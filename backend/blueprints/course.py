from firebase_admin import firestore
from flask import request, jsonify, Blueprint
import pandas as pd
import logging
from blueprints.helpers import (
    verify_token,
    get_user_level,
    USER_LEVEL_ADMIN,
    authorize
)
from cache.user_cache import get_user_cache, invalidate_user_cache
from firebase import db, bucket

course = Blueprint("course", __name__)


@course.route("/setup", methods=["POST"])
def setup():
    """
    This route accepts a POST request with a csv file and sets up the firebase database with the data in the csv file.
    Request body:
    form data containing:
        - "csv": the csv file containing the data to be set up
    Returns:
    200 status code with a message detailing actions taken in the setup

    csv format: zid,user_type,course_code,title as titles
    example csv:
    zid,user_type,course_code,title
    z1234567,admin,COMP1531,Software Engineering Fundamentals
    z1234568,student,COMP1531,Software Engineering Fundamentals
    """

    setup = pd.read_csv(request.files["csv"])

    message = ""
    for _, row in setup.iterrows():
        zid, user_type, course_code, course_name = (
            row["zid"],
            row["user_type"],
            row["course_code"],
            row["title"],
        )
        invalidate_user_cache(zid)
        message += f"Setting up {zid} as {user_type} for {course_code};\n"
        if user_type == "admin":
            db.collection("users").document(zid).set(
                {"adminOf": firestore.ArrayUnion([course_code])}, merge=True
            )
            db.collection("courses").document(course_code).set(
                {
                    "title": course_name,
                    "students": [],
                    "tutors": [],
                    "administrator": [zid],
                },
                merge=True,
            )

        elif user_type == "student":
            db.collection("users").document(zid).set(
                {
                    "studentOf": firestore.ArrayUnion([course_code]),
                    "adminOf": [],
                    "tutorOf": [],
                },
                merge=True,
            )

            db.collection("courses").document(course_code).set(
                {"students": firestore.ArrayUnion([zid])}, merge=True
            )

        elif user_type == "tutor":
            db.collection("users").document(zid).set(
                {
                    "tutorOf": firestore.ArrayUnion([course_code]),
                    "adminOf": [],
                    "studentOf": [],
                },
                merge=True,
            )
            db.collection("courses").document(course_code).set(
                {"tutors": firestore.ArrayUnion([zid])}, merge=True
            )
    return jsonify({"message": message}), 200


@course.route("/list_students_details", methods=["GET"])
@authorize(allowed_user_levels=[USER_LEVEL_ADMIN])
def list_students_details(course_code, user_zid, user_level):
    """
    Fetch the zID, first name, and last name for each student in a course.

    Request body:
    json containing:
        - "course_code": the course code to fetch student details for
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json containing the zID, first name, and last name for each student in the course
        - 401 status code if the user is not authorized to view the course
        - 400 status code if the course does not exist

    """
    # Fetch students' zIDs from the course document
    course_doc = db.collection("courses").document(course_code).get()
    if not course_doc.exists:
        return jsonify({"error": "Course doesn't exist"}), 400

    student_zids = course_doc.to_dict().get("students", [])
    students_details = []

    # Fetch first and last names for each student zID
    for zID in student_zids:
        user_doc = get_user_cache(zID)
        if user_doc is not None:
            students_details.append(
                {
                    "zID": zID,
                    "firstName": user_doc.get("firstName", "N/A"),
                    "lastName": user_doc.get("lastName", "N/A"),
                }
            )
        else:
            # If the user's document does not exist, provide a default response
            students_details.append({"zID": zID, "firstName": "N/A", "lastName": "N/A"})

    return jsonify({"students": students_details}), 200


@course.route("/modify_user_level", methods=["POST"])
def modify_user_level():
    """
    Route to modify the user level of one or more users in a course (tutor, student)
    Request body:
    form data containing:
        - "course_code": the course code to modify user levels in
        - "students": a comma-separated list of zIDs to modify user levels for
        - "tutor": whether the user level to modify is tutor (true, false for student)
        - "adding": whether to add the user type (true, false to remove)
        - "file": a csv file containing zIDs to modify user levels for
            csv header: "zid"
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json containing the status of the modification and what was changed
        - 401 status code if the user is not authorized to modify user levels in the course
        - 404 status code if the course does not exist
    """
    token = request.headers.get("Authorization").split("Bearer ")[1]
    logged_in_zid = verify_token(token)
    if get_user_level(logged_in_zid, request.form["course_code"]) != USER_LEVEL_ADMIN:
        return jsonify({"error": "Unauthorised"}), 401

    adding = request.form["adding"]
    adding = True if adding == "true" else False
    tutor = request.form["tutor"]
    member = "tutor" if tutor == "true" else "student"

    students = request.form["students"]
    students = [student.strip() for student in students.split(",")]
    if "file" in request.files and request.files["file"].filename.endswith(".csv"):
        csv = pd.read_csv(request.files["file"])
        students += list(csv["zid"])
    if "" in students:
        students.remove("")

    course_code = request.form["course_code"]
    course_ref = db.collection("courses").document(course_code)
    course_doc = course_ref.get()

    if not course_doc.exists:
        return jsonify({"status": "error", "message": "Course not found"}), 404

    course_data = course_doc.to_dict()
    current_members = course_data.get(member + "s", [])

    updating = db.collection("users")
    unfound = []
    already = []
    not_in_course = []
    added_or_removed = []

    for student in students:
        user_ref = updating.document(student)
        user_doc = user_ref.get()

        if not user_doc.exists:
            unfound.append(student)
            continue

        if adding:
            if (
                course_code in user_doc.get("tutorOf")
                or course_code in user_doc.get("adminOf")
                or course_code in user_doc.get("studentOf")
            ):
                already.append(student)
            else:
                user_ref.update({member + "Of": firestore.ArrayUnion([course_code])})
                added_or_removed.append(student)
                invalidate_user_cache(student)
        else:
            # When removing, explicitly check if user is in the course
            if student not in current_members:
                not_in_course.append(student)
            else:
                user_ref.update({member + "Of": firestore.ArrayRemove([course_code])})
                added_or_removed.append(student)
                invalidate_user_cache(student)

    # Update course document only if there are changes
    if added_or_removed:
        if adding:
            course_ref.update({member + "s": firestore.ArrayUnion(added_or_removed)})
        else:
            course_ref.update({member + "s": firestore.ArrayRemove(added_or_removed)})

    # Prepare response message with structured data
    response = {
        "status": "success",
        "action": "added" if adding else "removed",
        "data": {
            "processed": added_or_removed,
            "already_in_course": already,
            "not_found": unfound,
            "not_in_course": not_in_course,
        },
    }

    return jsonify(response), 200


@course.route("/create_task", methods=["POST"])
def create_task():
    """
    Route to create a task with file restrictions in a specified course
    Request body:
    json containing:
        - "course_code": the course code to create the task in
        - "name": the name of the task
        - "deadline": the deadline for the task
        - "max_automark": the maximum mark for autotests
        - "max_style_mark": the maximum mark for style
        - "file_restrictions": a dictionary containing:
            - "required_files": a list of required files
            - "allowed_file_types": a list of allowed file types
            - "max_file_size": the maximum file size in MB
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 201 status code with a json confirming the task was created including:
            - "message": "Task created successfully with file restrictions."
            - "task": the created task data
        - 400 status code if the request is invalid
        - 401 status code if the token is invalid
        - 403 status code if the user is not an admin
        - 500 status code if an error occurs

    """
    data = request.json
    # Extract token and verify
    token = request.headers.get("Authorization").split("Bearer ")[1]
    logged_in_zid = verify_token(token)
    if not logged_in_zid:
        logging.error("Invalid or expired token.")
        return jsonify({"error": "Invalid or expired token"}), 401

    course_code = data.get("course_code")
    task_name = data.get("name").strip()
    task_deadline = data.get("deadline")
    max_automark = data.get("max_automark")
    max_style = data.get("max_style_mark")
    spec_url = data.get("spec_url")

    # File restrictions data
    file_restrictions = data.get("file_restrictions", {})
    required_files = file_restrictions.get("required_files")
    allowed_file_types = file_restrictions.get("allowed_file_types")
    max_file_size = file_restrictions.get("max_file_size", 1)

    # late policy data
    late_policy = data.get("latePolicy", {})

    # Validate required fields
    if not course_code or not task_name or not task_deadline:
        logging.error("Course code, task name, and deadline are required fields.")
        return (
            jsonify({"error": "Course code, task name, and deadline are required."}),
            400,
        )

    # Check if max automark and max style mark sum up to 100
    if max_automark + max_style != 100:
        logging.error("Max Automark and Max Style Mark must sum up to 100.")
        return (
            jsonify({"error": "Max Automark and Max Style Mark must sum up to 100."}),
            400,
        )

    # Check user level
    level = get_user_level(logged_in_zid, course_code)
    if level != USER_LEVEL_ADMIN:
        logging.error(
            "Unauthorized access attempt by user %s for course %s",
            logged_in_zid,
            course_code,
        )
        return jsonify({"error": "Unauthorized"}), 403

    # Validate task name (avoid special characters)
    if any(char in task_name for char in ".[]*`~/\\"):
        logging.error("Task name contains invalid characters.")
        return (
            jsonify(
                {
                    "error": "Task name cannot contain special characters: . [ ] * ` ~ / \\"
                }
            ),
            400,
        )

    try:
        tasks_collection_ref = (
            db.collection("courses").document(course_code).collection("tasks")
        )

        new_task = {
            "name": task_name,
            "deadline": task_deadline,
            "maxAutomark": max_automark,
            "maxStyleMark": max_style,
            "specURL": spec_url,
            "fileRestrictions": {
                "allowedFileTypes": allowed_file_types if allowed_file_types else [],
                "maxFileSize": max_file_size if max_file_size is not None else 5,
                "requiredFiles": required_files if required_files else [],
            },
            "toleranceFilters": {
                "ignoreTrailingNewline": True,
                "ignoreTrailingWhitespaces": True,
                "ignoreWhitespacesAmount": False,
                "ignoreCaseDifferences": False,
            },
            "latePolicy": (
                {
                    "percentDeductionPerDay": late_policy.get(
                        "percentDeductionPerDay", 0
                    ),
                    "lateDayType": late_policy.get("lateDayType", "CALENDAR"),
                    "maxLateDays": late_policy.get("maxLateDays", 0),
                }
                if late_policy
                else None
            ),
        }
        # Save the task document with file restrictions
        tasks_collection_ref.document(task_name).set(new_task)
        return (
            jsonify(
                {
                    "message": "Task created successfully with file restrictions.",
                    "task": new_task,
                }
            ),
            201,
        )

    except Exception as e:
        logging.error("Error creating task in Firestore: %s", str(e))
        return jsonify({"error": f"Failed to create task: {str(e)}"}), 500


@course.route("/delete_task/<course_code>/<task_name>", methods=["DELETE"])
def delete_task(course_code, task_name):
    """
    Route to delete a task from a course. Deletes all related data including:
    - Files in storage
    - Task document
    - Results collection
    - Special considerations collection

    Parameters:
        - course_code: the course code to delete the task from
        - task_name: the name of the task to delete
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json containing a message confirming the deletion
        - 401 status code if the user is not authorized to delete the task
    """
    token = request.headers.get("Authorization").split("Bearer ")[1]
    logged_in_zid = verify_token(token)

    if get_user_level(logged_in_zid, course_code) != USER_LEVEL_ADMIN:
        return jsonify({"error": "Unauthorised"}), 401

    try:
        # Delete all files from storage
        blobs = list(bucket.list_blobs(prefix=f"{course_code}/{task_name}/"))
        for blob in blobs:
            blob.delete()

        # Get reference to task document
        task_ref = (
            db.collection("courses")
            .document(course_code)
            .collection("tasks")
            .document(task_name)
        )

        # Delete all results documents
        results_ref = task_ref.collection("results")
        for doc in results_ref.list_documents():
            doc.delete()

        # Delete all special considerations documents
        special_considerations_ref = task_ref.collection("specialConsiderations")
        for doc in special_considerations_ref.list_documents():
            doc.delete()

        # Finally delete the task document itself
        task_ref.delete()

        return (
            jsonify({"message": f"Task {task_name} deleted from course {course_code}"}),
            200,
        )

    except Exception as e:
        logging.error(f"Error deleting task: {str(e)}")
        return jsonify({"error": f"Failed to delete task: {str(e)}"}), 500


@course.route("/get_course_titles", methods=["POST"])
def get_course_titles():
    """
    Route to get the titles of courses given their IDs
    Request body:
    json containing:
        - "course_ids": a list of course IDs to get the titles for
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json containing the course IDs and titles
        - 401 status code if the token is invalid
        - 500 status code if an unexpected error occurs
    """
    try:
        token = request.headers.get("Authorization").split("Bearer ")[1]
        logged_in_zid = verify_token(token)
        if not logged_in_zid:
            return jsonify({"error": "Invalid token"}), 401

        # Parse course IDs from the request JSON body
        request_data = request.get_json()
        course_ids = request_data.get("course_ids", [])

        courses_with_titles = []

        for course_id in course_ids:
            course_ref = db.collection("courses").document(course_id)
            course_doc = course_ref.get()

            if course_doc.exists:
                course_data = course_doc.to_dict()
                courses_with_titles.append(
                    {"id": course_id, "title": course_data.get("title", "No Title")}
                )
            else:
                courses_with_titles.append({"id": course_id, "title": "No Title"})

        return jsonify({"courses": courses_with_titles}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
