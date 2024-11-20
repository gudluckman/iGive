from datetime import datetime, timedelta
import math
from flask import request, jsonify, Response, send_file, Blueprint
import pytz
import logging
from werkzeug.utils import secure_filename
import os
from io import StringIO, BytesIO
import csv
from collections import OrderedDict
import json
from blueprints.helpers import (
    get_student_results,
    verify_token,
    get_user_level,
    USER_LEVEL_TUTOR,
    USER_LEVEL_ADMIN,
    USER_LEVEL_NOT_MEMBER,
    USER_LEVEL_STUDENT,
    USER_LEVEL_ZID_DOESNT_EXIST,
    get_script_path,
    authorize
)
from firebase import db, bucket

task = Blueprint("task", __name__)


@task.route("/query_tasks", methods=["GET"])
@authorize(allowed_user_levels=[USER_LEVEL_STUDENT, USER_LEVEL_TUTOR, USER_LEVEL_ADMIN])
def query_tasks(course_code, user_zid, user_level):
    """
    Route to fetch all tasks and results for a course
    Request body:
    json containing:
        - "course_code": the course code to query tasks for
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json containing all tasks and results
        - 401 status code if token is invalid
        - 500 status code if an error occurs
    """
    tasks_collection_ref = (
        db.collection("courses").document(course_code).collection("tasks")
    )
    tasks_docs = tasks_collection_ref.stream()
    loaded_tasks = [{**doc.to_dict()} for doc in tasks_docs]

    return jsonify({"tasks": loaded_tasks}), 200


@task.route("/set_task_data", methods=["POST"])
def set_task_data():
    """
    Route to set task data for a given course and task
    Request body:
    json containing:
        - "course_code": the course code in which the task is located
        - "name": the name of the task
        - "deadline": the deadline for the task
        - "spec_URL": the URL to the task specification
        - "max_automark": the maximum mark for autotests
        - "max_style": the maximum mark for style
        - "file_restrictions": a dictionary containing:
            - "required_files": a list of required files
            - "allowed_file_types": a list of allowed file types
            - "max_file_size": the maximum file size in MB
        - "late_policy": a dictionary containing:
            - "percent_deduction_per_day": the percentage deduction per day
            - "late_day_type": the type of late day (CALENDAR or BUSINESS)
            - "max_late_days": the maximum number of late days
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json confirming the task data was set
        - 401 status code if token is invalid
        - 403 status code if user is not an admin
        - 404 status code if task data is not found
        - 500 status code if an error occurs
    """
    data = request.json
    course_code = data.get("course_code")
    task_name = data.get("name")

    # Authenticate user via token
    token = request.headers.get("Authorization")
    if not token or "Bearer " not in token:
        return jsonify({"error": "Authorization token is missing or invalid."}), 401

    token = token.split("Bearer ")[1]
    logged_in_zid = verify_token(token)

    # Get the user level to check permissions
    level = get_user_level(logged_in_zid, course_code)
    if level != USER_LEVEL_ADMIN and level != USER_LEVEL_TUTOR:
        return jsonify({"error": "Unauthorized"}), 403

    try:
        # Fetch task document
        task_collection_ref = (
            db.collection("courses").document(course_code).collection("tasks")
        )
        task_doc = task_collection_ref.document(task_name).get()
        if not task_doc.exists:
            return jsonify({"error": f"Task with name ${task_name} not found."}), 404

        task_deadline = data.get("deadline")
        task_spec_URL = data.get("spec_URL")
        max_automark = data.get("max_automark")
        max_style = data.get("max_style")

        # Validate deadline
        if not task_deadline:
            logging.error("Deadline is required.")
            return jsonify({"error": "Deadline is required."}), 400

        # Check if max automark and max style mark sum up to 100
        if max_automark + max_style != 100:
            logging.error("Max Automark and Max Style Mark must sum up to 100.")
            return (
                jsonify(
                    {"error": "Max Automark and Max Style Mark must sum up to 100."}
                ),
                400,
            )

        # File restrictions data
        file_restrictions = data.get("file_restrictions", {})
        required_files = file_restrictions.get("required_files")
        allowed_file_types = file_restrictions.get("allowed_file_types")
        max_file_size = file_restrictions.get("max_file_size", 1)

        # Late penalty data
        late_policy = data.get("late_policy", {})
        late_day_type = late_policy.get("late_day_type")
        max_late_days = late_policy.get("max_late_days")
        percent_deduction_per_day = late_policy.get("percent_deduction_per_day")

        new_task_details = {
            "deadline": task_deadline,
            "maxAutomark": max_automark,
            "maxStyleMark": max_style,
            "specURL": task_spec_URL,
            "fileRestrictions": {
                "allowedFileTypes": allowed_file_types if allowed_file_types else [],
                "maxFileSize": max_file_size if max_file_size is not None else 5,
                "requiredFiles": required_files if required_files else [],
            },
            "latePolicy": {
                "lateDayType": late_day_type,
                "maxLateDays": max_late_days,
                "percentDeductionPerDay": percent_deduction_per_day,
            },
        }

        task_collection_ref.document(task_name).set(new_task_details, merge=True)

        return jsonify({"message": "Task settings saved."}), 200

    except Exception as e:
        logging.error(f"Error setting task data: {str(e)}")
        return jsonify({"error": f"Error setting task data: {str(e)}"}), 500


@task.route("/task_data/<course_code>/<task_name>", methods=["GET"])
@authorize(allowed_user_levels=[USER_LEVEL_ADMIN])
def get_task_data(course_code, task_name, user_zid, user_level):
    """
    Route to fetch task data for a given course and task
    Parameters:
        - "course_code": the course code in which the task is located
        - "task_name": the task name to query
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json containing the task data
            - "students": a list of student results for the task
            - "maxAutomark": the maximum mark for autotests
            - "maxStyleMark": the maximum mark for style
            - "maxTaskMark": the maximum mark for the task
            - "deadline": the deadline for the task
            - "specUrl": the URL to the task specification
            - "allowedFileTypes": a list of allowed file types
            - "maxFileSize": the maximum file size in MB
            - "requiredFiles": a list of required files
        - 401 status code if token is invalid
        - 403 status code if user is not an admin
        - 404 status code if task data is not found
        - 500 status code if an error occurs

    """
    try:
        students_result_data = get_student_results(course_code, task_name)
        if students_result_data is None:
            return jsonify({"error": "No students data found for this task."}), 404

        # Fetch task document to get maxAutomark and maxStyleMark
        task_ref = (
            db.collection("courses")
            .document(course_code)
            .collection("tasks")
            .document(task_name)
        )
        task_doc = task_ref.get()
        if not task_doc.exists:
            return jsonify({"error": "Task data not found."}), 404

        task_data = task_doc.to_dict()
        deadline = task_data.get("deadline")
        spec_url = task_data.get("specURL")
        max_automark = task_data.get("maxAutomark", 0)
        max_style_mark = task_data.get("maxStyleMark", 0)
        max_task_mark = max_automark + max_style_mark

        file_restrictions = task_doc.get("fileRestrictions")
        if file_restrictions is None:
            logging.error(
                f"File restrictions not found for task '{task_name}' in course '{course_code}'."
            )
            return jsonify({"error": "fileRestrictions not found."}), 404

        allowed_file_types = file_restrictions.get("allowedFileTypes", [])
        max_file_size = file_restrictions.get("maxFileSize", 1)
        required_files = file_restrictions.get("requiredFiles", [])

        response_data = {
            "students": students_result_data,
            "deadline": deadline,
            "specUrl": spec_url,
            "maxAutomark": max_automark,
            "maxStyleMark": max_style_mark,
            "maxTaskMark": max_task_mark,
            "allowedFileTypes": allowed_file_types,
            "maxFileSize": max_file_size,
            "requiredFiles": required_files,
        }

        return jsonify(response_data), 200

    except Exception as e:
        logging.error(f"Error fetching task data: {str(e)}")
        return jsonify({"error": f"Error fetching task data: {str(e)}"}), 500


@task.route("/upload_script", methods=["POST"])
def upload_script():
    """
    Route to upload a new run.sh to a task in order to run autotests
    Request body:
    formdata containing:
        - "task": the task name to upload the script for
        - "course_code": the course code in which the task is located
        - "hidden": a boolean indicating if the script is for automark (true) or autotest (false)
        - "script": the run.sh file to upload
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with json confirming the script was uploaded
        - 401 status code if user is not an admin
        - 400 status code if the request is invalid
    """
    task = request.form["task"]
    course_code = request.form["course_code"]
    token = request.headers.get("Authorization").split("Bearer ")[1]
    logged_in_zid = verify_token(token)
    level = get_user_level(logged_in_zid, course_code)
    if level != USER_LEVEL_ADMIN:
        return jsonify({"error": "Unauthorised"}), 401

    script = request.files["script"]

    url = (
        get_script_path(course_code, task, request.form["hidden"] == "true") + "run.sh"
    )

    blob = bucket.blob(url)
    blob.upload_from_file(script)
    return jsonify({"message": "Script uploaded"}), 200


@task.route("/get_script/<course_code>/<task_name>", methods=["GET"])
@authorize(allowed_user_levels=[USER_LEVEL_ADMIN])
def get_script(course_code, task_name, user_zid, user_level):
    """
    Route to fetch the run.sh script for a task
    Parameters:
        - "course_code": the course code in which the task is located
        - "task_name": the task name to query
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with the run.sh script
        - 401 status code if token is invalid
        - 403 status code if user is not an admin
        - 404 status code if the script is not found
    """
    file_path = get_script_path(course_code, task_name, "true") + "run.sh"

    try:
        blob = bucket.blob(file_path)
        script_file = blob.download_as_bytes()

        return send_file(
            BytesIO(script_file), as_attachment=True, download_name="run.sh"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 404


@task.route("/get_test/<course_code>/<task_name>/<test_name>/<hidden>", methods=["GET"])
@authorize(allowed_user_levels=[USER_LEVEL_ADMIN])
def get_test(course_code, task_name, test_name, hidden, user_zid, user_level):
    """
    Route to fetch a test for a task
    Parameters:
        - "course_code": the course code in which the task is located
        - "task_name": the task name to query
        - "test_name": the name of the test to fetch
        - "hidden": a boolean indicating if the test is for automark (true) or autotest (false)
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json containing the test data
            - "test_name": the name of the test
            - "input": the input data for the test
            - "output": the expected output for the test
            - "runner_args": the runner arguments for the test
            - "cpu_time": the CPU time limit for the test
            - "memory_megabytes": the memory limit for the test
            - "isHidden": a boolean indicating if the test is hidden
        - 401 status code if token is invalid
        - 404 status code if the test is not found
    """
    url = get_script_path(course_code, task_name, hidden == "true")

    blobs = bucket.list_blobs(prefix=url)
    for blob in blobs:
        if blob.name.endswith("parameters.json"):
            # download parameters.json and extract test name
            parameters_content = json.loads(blob.download_as_string().decode("utf-8"))
            name = parameters_content["test_name"]

            # located test with matching name
            if name == test_name:
                # directory path
                directory_prefix = blob.name.rsplit("parameters.json", 1)[0]

                # fetch in and out blobs and download
                in_blob = bucket.blob(directory_prefix + "in")
                out_blob = bucket.blob(directory_prefix + "out")

                in_text = in_blob.download_as_string().decode("utf-8")
                out_text = out_blob.download_as_string().decode("utf-8")

                # fetch params
                runner_args = parameters_content["runner_args"]
                cpu_time = parameters_content["cpu_time"]
                memory_megabytes = parameters_content["memory_megabytes"]

                # hidden?
                isHidden = hidden == "true"

                return (
                    jsonify(
                        {
                            "test_name": test_name,
                            "input": in_text,
                            "output": out_text,
                            "runner_args": runner_args,
                            "cpu_time": cpu_time,
                            "memory_megabytes": memory_megabytes,
                            "isHidden": isHidden,
                        }
                    ),
                    200,
                )

    # test name did not match any in the storage
    return (
        jsonify(
            {"error": f"Test with name '{test_name}' not found. Aborting data fetch..."}
        ),
        404,
    )


@task.route(
    "/edit_test/<course_code>/<task_name>/<test_name>/<hidden>", methods=["PUT"]
)
def edit_test(course_code, task_name, test_name, hidden):
    """
    Route to edit a test for a task
    Parameters:
        - "course_code": the course code in which the task is located
        - "task_name": the task name to query
        - "test_name": the name of the test to edit
        - "hidden": a boolean indicating if the test is for automark (true) or autotest (false)
    Request body:
        formdata containing:
            - "input": the new input data for the test
            - "output": the new expected output for the test
            - "runner_args": the new runner arguments for the test
            - "cpu_time": the new CPU time limit for the test
            - "memory_megabytes": the new memory limit for the test
            - "test_name": the new name for the test
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json confirming the test was edited
        - 401 status code if token is invalid
        - 404 status code if the test is not found
        - 400 status code if the request is invalid
    """
    token = request.headers.get("Authorization").split("Bearer ")[1]
    logged_in_zid = verify_token(token)
    level = get_user_level(logged_in_zid, course_code)
    if level != USER_LEVEL_ADMIN:
        return jsonify({"error": "Unauthorised"}), 401

    target_url = get_script_path(
        course_code, task_name, request.form["hidden"] == "true"
    )

    old_test_name = test_name
    new_test_name = request.form["test_name"]

    blobs = bucket.list_blobs(prefix=target_url)
    # first check that the target directory does not contain a test with the same name
    # as the NEW test name
    max = 0
    for blob in blobs:
        if blob.name.endswith("parameters.json"):
            # download parameters.json and extract test name
            name = json.loads(blob.download_as_string().decode("utf-8"))["test_name"]

            # if the test name is being edited and it matches the name of a different test in
            # the same directory, return an error
            if name == new_test_name and old_test_name != new_test_name:
                return (
                    jsonify(
                        {"error": f"Test with name '{new_test_name}' already exists"}
                    ),
                    400,
                )

        # the following finds the next number for test in the event that a directory shift
        # is required
        if blob.name.endswith("run.sh"):
            continue

        if blob.name.endswith("/"):
            continue

        curr = blob.name.split("/")[4]
        curr = int(curr[5:])
        if curr > max:
            max = curr

    file_count = max + 1

    deleting = ""
    isMoved = False

    # MOVE AND DELETE
    # either a hidden test is changing to sample or vice versa - moving test data into
    # a new folder in the target directory:
    # currently this implementation loads pre-existing data of the test-to-be-edited
    # into the target folder and deletes old data from the source folder - this data
    # is then immediately edited following the deletion
    if hidden != request.form["hidden"]:
        isMoved = True
        source_url = get_script_path(course_code, task_name, hidden == "true")
        blobs = bucket.list_blobs(prefix=source_url)

        for blob in blobs:
            if blob.name.endswith("parameters.json"):
                # download parameters.json and extract test name
                parameters_content = json.loads(
                    blob.download_as_string().decode("utf-8")
                )
                name = parameters_content["test_name"]

            if name == old_test_name:
                # source directory path
                source_directory_prefix = blob.name.rsplit("parameters.json", 1)[0]
                # target directory path
                target_directory_prefix = target_url + f"test_{file_count}/"

                # fetch source in and out blobs and download
                source_in_blob = bucket.blob(source_directory_prefix + "in")
                source_out_blob = bucket.blob(source_directory_prefix + "out")

                in_text = source_in_blob.download_as_string().decode("utf-8")
                out_text = source_out_blob.download_as_string().decode("utf-8")

                # target in and out blobs and upload
                target_in_blob = bucket.blob(target_directory_prefix + "in")
                target_out_blob = bucket.blob(target_directory_prefix + "out")

                target_in_blob.upload_from_string(in_text, content_type="text/plain")
                target_out_blob.upload_from_string(out_text, content_type="text/plain")

                # load new params with new test name to avoid duplicate test name edge case
                parameters_content["test_name"] = new_test_name

                # target parameters upload
                target_params_blob = bucket.blob(
                    target_directory_prefix + "parameters.json"
                )
                target_params_blob.upload_from_string(
                    json.dumps(parameters_content), content_type="text/plain"
                )

                # storing deleting pathway for cleanup
                deleting = blob.name.split("/")[4]
                break

        # deleting old test folder
        deleting_blobs = bucket.list_blobs(prefix=source_url + deleting + "/")
        for blob in deleting_blobs:
            blob.delete()

    # EDIT
    blobs = bucket.list_blobs(prefix=target_url)
    for blob in blobs:
        if blob.name.endswith("parameters.json"):
            # download parameters.json and extract test name
            parameters_content = json.loads(blob.download_as_string().decode("utf-8"))
            name = parameters_content["test_name"]

            # located test to be edited
            if (name == old_test_name and not isMoved) or (
                isMoved and name == new_test_name
            ):
                # directory path
                directory_prefix = blob.name.rsplit("parameters.json", 1)[0]

                # fetch in.txt and out.txt blobs
                in_blob = bucket.blob(directory_prefix + "in")
                out_blob = bucket.blob(directory_prefix + "out")

                # upload updated in.txt
                in_blob.upload_from_string(
                    request.form["input"], content_type="text/plain"
                )

                # upload updated out.txt
                out_blob.upload_from_string(
                    request.form["output"], content_type="text/plain"
                )

                parameters_content["runner_args"] = request.form[
                    "runner_args"
                ]  # Update runner arguments
                parameters_content["cpu_time"] = request.form[
                    "cpu_time"
                ]  # Update cpu time_
                parameters_content["memory_megabytes"] = request.form[
                    "memory_megabytes"
                ]  # Update memory
                parameters_content["test_name"] = request.form[
                    "test_name"
                ]  # Update with new test name

                # @everyone: revisit
                parameters_content["tolerance_filters"] = [
                    "ignore_trailing_newline",
                    "ignore_trailing_whitespaces",
                ]

                # upload updated parameters.json
                blob.upload_from_string(
                    json.dumps(parameters_content), content_type="text/plain"
                )

                return (
                    jsonify(
                        {
                            "message": f"Test '{old_test_name}' updated to '{new_test_name}'"
                        }
                    ),
                    200,
                )

    # if the test name did not match any in the storage
    return (
        jsonify(
            {"error": f"Test with name '{old_test_name}' not found. Aborting edit..."}
        ),
        404,
    )


@task.route(
    "/delete_test/<course_code>/<task_name>/<hidden>/<test_name>", methods=["DELETE"]
)
def delete_test(course_code, task_name, hidden, test_name):
    """
    Route to delete a test for a task
    Parameters:
        - "course_code": the course code in which the task is located
        - "task_name": the task name to query
        - "hidden": a boolean indicating if the test is for automark (true) or autotest (false)
        - "test_name": the name of the test to delete
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json confirming the test was deleted
        - 401 status code if token is invalid
        - 404 status code if the test is not found
    """
    token = request.headers.get("Authorization").split("Bearer ")[1]
    logged_in_zid = verify_token(token)
    level = get_user_level(logged_in_zid, course_code)
    if level != USER_LEVEL_ADMIN:
        return jsonify({"error": "Unauthorised"}), 401

    url = get_script_path(course_code, task_name, hidden == "true")

    deleting = ""
    blobs = bucket.list_blobs(prefix=url)
    for blob in blobs:
        if blob.name.endswith("parameters.json"):
            name = json.loads(blob.download_as_string().decode("utf-8"))["test_name"]
            if name == test_name:
                deleting = blob.name.split("/")[4]
                break
    deleting_blobs = bucket.list_blobs(prefix=url + deleting + "/")
    for blob in deleting_blobs:
        blob.delete()
    return jsonify({"message": f"{task_name} deleted"}), 200


@task.route("/get_test_names/<course_code>/<task_name>/<hidden>", methods=["GET"])
@authorize(allowed_user_levels=[USER_LEVEL_STUDENT, USER_LEVEL_TUTOR, USER_LEVEL_ADMIN])
def get_test_names(course_code, task_name, hidden, user_zid, user_level):
    """
    Route to get all autotest or automark names for a task
    Parameters:
        - "course_code": the course code in which the task is located
        - "task_name": the task name to query
        - "hidden": a boolean indicating if the test is for automark (true) or autotest (false)
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json containing the test names
            - "names": a list of test names
        - 401 status code if token is invalid
        - 401 status code if user is not an admin
    """
    if user_level == USER_LEVEL_STUDENT and hidden == "true":
        return jsonify({"error": "Unauthorised"}), 401

    url = get_script_path(course_code, task_name, hidden == "true")

    blobs = bucket.list_blobs(prefix=url)
    names = []
    for blob in blobs:
        if blob.name.endswith("parameters.json"):
            names.append(
                json.loads(blob.download_as_string().decode("utf-8"))["test_name"]
            )
    names.sort()
    return jsonify({"names": names}), 200


@task.route("/add_autotest_from_string", methods=["POST"])
def add_autotest_from_string():
    """
    Route to add an autotest to a task from string input
    Request body:
    formdata containing:
        - "task": the task name to add the test to
        - "course_code": the course code in which the task is located
        - "hidden": a boolean indicating if the test is for automark (true) or autotest (false)
        - "input": the input data for the test
        - "output": the expected output for the test
        - "runner_args": the runner arguments for the test
        - "cpu_time": the CPU time limit for the test
        - "memory_megabytes": the memory limit for the test
        - "test_name": the name of the test
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json confirming the test was added
        - 401 status code if user is not an admin
        - 400 status code if the request is invalid

    """
    task = request.form["task"]
    course_code = request.form["course_code"]
    token = request.headers.get("Authorization").split("Bearer ")[1]
    logged_in_zid = verify_token(token)
    level = get_user_level(logged_in_zid, course_code)

    if level != USER_LEVEL_ADMIN:
        return jsonify({"error": "Unauthorised"}), 401

    input = request.form["input"]
    output = request.form["output"]

    test_name = request.form["test_name"]

    url = get_script_path(course_code, task, request.form["hidden"] == "true")

    blobs = bucket.list_blobs(prefix=url)
    max = 0
    for blob in blobs:
        if blob.name.endswith("parameters.json"):
            name = json.loads(blob.download_as_string().decode("utf-8"))["test_name"]
            if name == test_name:
                return jsonify({"error": "Test name already exists"}), 400
        if blob.name.endswith("run.sh"):
            continue

        if blob.name.endswith("/"):
            continue

        curr = blob.name.split("/")[4]
        curr = int(curr[5:])
        if curr > max:
            max = curr

    file_count = max + 1
    url += f"test_{file_count}/"
    blob_input = bucket.blob(url + "in")
    blob_output = bucket.blob(url + "out")

    parameters = bucket.blob(url + "parameters.json")

    # getting test params from form
    runner_args = request.form["runner_args"]
    cpu_time = request.form["cpu_time"]
    memory_megabytes = request.form["memory_megabytes"]

    # @everyone: revisit
    default_json = f'{{"cpu_time": {int(cpu_time)}, "memory_megabytes": {int(memory_megabytes)}, "runner_args": "{runner_args}", "test_name": "{test_name}", "tolerance_filters": ["ignore_trailing_newline", "ignore_trailing_whitespaces"]}}'

    parameters.upload_from_string(default_json)

    blob_input.upload_from_string(input)
    blob_output.upload_from_string(output)
    test_type = "automark" if request.form["hidden"] == "true" else "autotest"
    return jsonify({"message": f"{test_name} added as {test_type} {file_count}"}), 200


@task.route("/add_autotest_from_file", methods=["POST"])
def add_autotest_from_file():
    """
    Route to add an autotest to a task from file
    Request body:
    formdata containing:
        - "task": the task name to add the test to
        - "course_code": the course code in which the task is located
        - "hidden": a boolean indicating if the test is for automark (true) or autotest (false)
        - "input": the input file for the test
        - "output": the expected output file for the test
        - "runner_args": the runner arguments for the test
        - "cpu_time": the CPU time limit for the test
        - "memory_megabytes": the memory limit for the test
        - "test_name": the name of the test
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json confirming the test was added
        - 401 status code if user is not an admin
        - 400 status code if the request is invalid
    """
    task = request.form["task"]
    course_code = request.form["course_code"]
    token = request.headers.get("Authorization").split("Bearer ")[1]
    logged_in_zid = verify_token(token)
    level = get_user_level(logged_in_zid, course_code)
    if level != USER_LEVEL_ADMIN:
        return jsonify({"error": "Unauthorised"}), 401

    input = request.files["input"]
    output = request.files["output"]
    test_name = request.form["test_name"]

    url = get_script_path(course_code, task, request.form["hidden"] == "true")
    blobs = bucket.list_blobs(prefix=url)
    max = 0
    for blob in blobs:
        if blob.name.endswith("parameters.json"):
            name = json.loads(blob.download_as_string().decode("utf-8"))["test_name"]
            if name == test_name:
                return jsonify({"error": "Test name already exists"}), 400
        if blob.name.endswith("run.sh"):
            continue
        if blob.name.endswith("/"):
            continue

        curr = blob.name.split("/")[4]
        curr = int(curr[5:])
        if curr > max:
            max = curr

    file_count = max + 1
    url += f"test_{file_count}/"
    blob_input = bucket.blob(url + "in")
    blob_output = bucket.blob(url + "out")

    parameters = bucket.blob(url + "parameters.json")

    # getting test params from form
    runner_args = request.form["runner_args"]
    cpu_time = request.form["cpu_time"]
    memory_megabytes = request.form["memory_megabytes"]

    # @everyone: revisit
    default_json = f'{{"cpu_time": {int(cpu_time)}, "memory_megabytes": {int(memory_megabytes)}, "runner_args": "{runner_args}", "test_name": "{test_name}", "tolerance_filters": ["ignore_trailing_newline", "ignore_trailing_whitespaces"]}}'

    parameters.upload_from_string(default_json)
    blob_input.upload_from_file(input)
    blob_output.upload_from_file(output)
    test_type = "automark" if request.form["hidden"] == "true" else "autotest"
    return jsonify({"message": f"{test_name} added as {test_type} {file_count}"}), 200


@task.route("/query_result", methods=["GET"])
@authorize(allowed_user_levels=[USER_LEVEL_STUDENT, USER_LEVEL_TUTOR, USER_LEVEL_ADMIN])
def query_result(course_code, user_zid, user_level):
    """
    Route to fetch a student's result for a task
    Request body:
    json containing:
        - "course_code": the course code in which the task is located
        - "student": the student's zid to query
        - "task": the task to query
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json containing the student's result
            - "result": the student's result
        - 401 status code if token is invalid
        - 401 status code if user is not a student
        - 404 status code if the result is not found
    """
    task = request.args.get("task")
    if user_level == USER_LEVEL_STUDENT:
        zid_requested = user_zid
    else:
        zid_requested = request.args.get("student")

    student_ref = (
        db.collection("courses")
        .document(course_code)
        .collection("tasks")
        .document(task)
        .collection("results")
        .document(zid_requested)
    )

    if student_ref.get().exists:
        res = student_ref.get().to_dict()
        if user_level == USER_LEVEL_STUDENT and not res["mark_released"]:
            if "lastSubmitted" not in res:
                logging.error(f"Could not find time of last submission for task {task}")
                last_submitted = ""
            else:
                last_submitted = res["lastSubmitted"]

            return {"result": {"files": res["files"], "lastSubmitted": last_submitted}}
        else:
            return {"result": res}

    return {"result": "none"}


@task.route("/update_mark_release", methods=["POST"])
def updateMarkReleaseStatus():
    """
    Route to update the mark release status for a student's result
    Request body:
    json containing:
        - "course_code": the course code in which the task is located
        - "zid": the student's zid to query
        - "task": the task to query
        - "release": the new mark release status
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json confirming the mark release status was updated
        - 401 status code if user is not an admin
        - 400 status code if the result is not found
    """
    data = request.json
    zid_requested = data["zid"]
    course_code = data["course_code"]
    task = data["task"]
    release = data["release"]

    token = request.headers.get("Authorization").split("Bearer ")[1]
    logged_in_zid = verify_token(token)

    if get_user_level(logged_in_zid, course_code) < USER_LEVEL_ADMIN:
        return jsonify({"error": "Unauthorised"}), 401

    student_ref = (
        db.collection("courses")
        .document(course_code)
        .collection("tasks")
        .document(task)
        .collection("results")
        .document(zid_requested)
    )

    if student_ref.get().exists:
        result = student_ref.get().to_dict()
        result["mark_released"] = release
        student_ref.set(result)
        return jsonify({"message": "Mark release status updated"}), 200
    else:
        return jsonify({"message": "Student doesn't exist or hasn't submitted"}), 400


@task.route("/delete_automark", methods=["POST"])
def deleteMark():
    """
    Route to delete the automark for a student's result
    Request body:
    json containing:
        - "course_code": the course code in which the task is located
        - "zid": the student's zid to query
        - "task": the task to query
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json confirming the automark was deleted
        - 401 status code if user is not an admin
        - 400 status code if the result is not found
    """
    data = request.json
    zid_requested = data["zid"]
    course_code = data["course_code"]
    task = data["task"]

    token = request.headers.get("Authorization").split("Bearer ")[1]
    logged_in_zid = verify_token(token)

    if get_user_level(logged_in_zid, course_code) < USER_LEVEL_ADMIN:
        return jsonify({"error": "Unauthorised"}), 401

    student_ref = (
        db.collection("courses")
        .document(course_code)
        .collection("tasks")
        .document(task)
        .collection("results")
        .document(zid_requested)
    )

    if student_ref.get().exists:
        result = student_ref.get().to_dict()
        if result["automark_timestamp"] == "":
            return (
                jsonify({"message": "Automark haven't been ran for this student"}),
                400,
            )
        else:
            result["automark"] = ""
            result["automark_timestamp"] = ""
            result["automark_report"] = ""
            result["raw_automark"] = 0

        student_ref.set(result)
        return jsonify({"message": "Automark deleted"}), 200
    else:
        return jsonify({"message": "Student doesn't exist or haven't submitted"}), 400


@task.route("/override_mark", methods=["POST"])
def overrideMark():
    """
    Route to override the marks for a student's result
    Request body:
    json containing:
        - "course_code": the course code in which the task is located
        - "zid": the student's zid to query
        - "task": the task to query
        - "new_automark": the new automark to set
        - "new_style": the new style mark to set
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json confirming the marks were updated
        - 401 status code if user is not an admin
        - 400 status code if the result is
    """
    data = request.json
    zid_requested = data["zid"]
    course_code = data["course_code"]
    task = data["task"]
    new_automark = data["new_automark"]
    new_style = data["new_style"]
    new_comments = data["new_comments"]

    token = request.headers.get("Authorization").split("Bearer ")[1]
    logged_in_zid = verify_token(token)

    if get_user_level(logged_in_zid, course_code) < USER_LEVEL_TUTOR:
        return jsonify({"error": "Unauthorised"}), 401

    student_ref = (
        db.collection("courses")
        .document(course_code)
        .collection("tasks")
        .document(task)
        .collection("results")
        .document(zid_requested)
    )

    if student_ref.get().exists:
        result = student_ref.get().to_dict()
        result["automark"] = round(new_automark)
        result["style"] = round(new_style)
        result["comments"] = new_comments

        student_ref.set(result)
        return jsonify({"message": "Marks updated"}), 200
    else:
        return jsonify({"message": "Student doesn't exist or haven't submitted"}), 400


@task.route("/upload_submissions", methods=["PUT"])
def upload_submissions():
    """
    Uploads files from a student for a given task.
    Creates a new directory in storage inside of the course and task name.
    The submitted files will be stored in a directory with the submission timestamp as the name.
    Request body:
    formdata containing:
        - "course_code": the course code in which the task is located
        - "task": the task name to upload files for
        - "files[]": the files to upload
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json confirming the files were uploaded
        - 400 status code if the request is invalid
        - 401 status code if the token is invalid or the user is not a member of the course
    """
    try:
        # Check user has valid credentials
        token = request.headers.get("Authorization").split("Bearer ")[1]
        logged_in_zid = verify_token(token)
        course_code = request.form.get("course_code")
        user_level = get_user_level(logged_in_zid, course_code)

        if user_level == USER_LEVEL_ZID_DOESNT_EXIST:
            return jsonify({"message": "Unauthorised"}), 401

        elif user_level == USER_LEVEL_NOT_MEMBER:
            return jsonify({"message": "You are not a member of this course"}), 403

        files = request.files.getlist("files[]")
        if not files:
            return jsonify({"message": "No files uploaded"}), 400

        task = request.form.get("task")
        task_ref = (
            db.collection("courses")
            .document(course_code)
            .collection("tasks")
            .document(task)
        )
        task_doc = task_ref.get()

        if not task_doc.exists:
            return jsonify({"error": "Task not found"}), 404

        task_data = task_doc.to_dict()

        # Verify file restrictions
        file_restrictions = task_data.get("fileRestrictions")
        if not file_restrictions:
            return jsonify({"message": "File restrictions not set for this task"}), 400

        allowed_file_types = set(file_restrictions.get("allowedFileTypes"))
        max_file_size_mb = file_restrictions.get("maxFileSize", 1)
        required_files = set(file_restrictions.get("requiredFiles"))

        # Treat required_files as empty if it's an empty set or contains only an empty string
        if required_files == {""} or len(required_files) == 0:
            required_files = set()

        validation_errors = []
        for file in files:
            # Secure the filename and extract its base name and extension
            filename = secure_filename(file.filename)
            file_extension = os.path.splitext(filename)[1].lower()

            # Handle file restrictions
            if filename in required_files:
                # as it's required, check if it matches, and then remove from the required set
                required_files.remove(filename)
            else:
                # check if allowed_file_types is empty or contains only an empty string
                if allowed_file_types and not (
                    allowed_file_types == {""} or len(allowed_file_types) == 0
                ):
                    if file_extension not in allowed_file_types:
                        validation_errors.append(
                            f'File "{filename}" has an invalid type. Allowed types: {", ".join(allowed_file_types)}'
                        )
                        continue

                # Check max file size for all files
                file.seek(0, os.SEEK_END)
                file_size_mb = file.tell() / (1024 * 1024)  # Convert to MB
                if file_size_mb > max_file_size_mb:
                    validation_errors.append(
                        f'File "{filename}" exceeds the maximum size of {max_file_size_mb} MB'
                    )
                file.seek(0)

        # After processing all files, check if all required files have been uploaded
        if required_files:
            missing_files = ", ".join(required_files)
            validation_errors.append(f"Missing required files: {missing_files}")

        # If there are validation errors, return them
        if validation_errors:
            return (
                jsonify(
                    {"message": "File validation failed", "errors": validation_errors}
                ),
                400,
            )

        # Create time of submission with timezone
        sydney_tz = pytz.timezone("Australia/Sydney")
        submission_time = datetime.now(sydney_tz)
        formatted_time = submission_time.strftime(f"%d-%m-%Y %X")

        # Get task deadline and convert to timezone-aware datetime
        deadline_str = task_data.get("deadline")
        if not deadline_str:
            return jsonify({"error": "Task deadline not set"}), 400

        deadline = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
        if deadline.tzinfo is None:
            deadline = sydney_tz.localize(deadline)
        else:
            deadline = deadline.astimezone(sydney_tz)

        # Get late policy from task
        late_policy = task_data.get(
            "latePolicy",
            {
                "percentDeductionPerDay": 20,  # Default values
                "lateDayType": "CALENDAR",
                "maxLateDays": 5,
            },
        )

        # Calculate late days and penalty
        late_days = calculate_late_days(
            submission_time, deadline, late_policy["lateDayType"]
        )

        # Check if submission is past maximum late days
        if late_days > late_policy["maxLateDays"]:
            return (
                jsonify(
                    {
                        "error": f"Submission rejected - past maximum late days ({late_policy['maxLateDays']} days)",
                        "late_days": late_days,
                    }
                ),
                400,
            )

        # Calculate penalty percentage
        penalty_percentage = (
            min(late_days * late_policy["percentDeductionPerDay"], 100)  # Cap at 100%
            if late_days > 0
            else 0
        )

        # Upload files to storage
        for file in files:
            blob = bucket.blob(
                f"{course_code}/{task}/{logged_in_zid}/{formatted_time}/{file.filename}"
            )
            blob.upload_from_file(file)

        # Create database reference
        student_ref = (
            db.collection("courses")
            .document(course_code)
            .collection("tasks")
            .document(task)
            .collection("results")
            .document(logged_in_zid)
        )

        # Prepare submission data
        submission_data = {
            "files": [file.filename for file in files],
            "lastSubmitted": formatted_time,
            "lateDays": late_days,
            "latePenaltyPercentage": penalty_percentage,
            "automark": 0,
            "automark_timestamp": "",
            "automark_report": "",
            "style": 0,
            "comments": "",
            "mark_released": False,
        }

        # Update the database with submission info
        student_ref.set(submission_data)

        return (
            jsonify(
                {
                    "message": "File uploaded successfully",
                    "submission_time": formatted_time,
                    "late_days": late_days,
                    "late_penalty": penalty_percentage,
                }
            ),
            200,
        )

    except ValueError as ve:
        logging.error(f"Error parsing date/time: {str(ve)}")
        return jsonify({"error": "Invalid date format in deadline"}), 400
    except Exception as e:
        logging.error(f"Error in upload_submissions: {str(e)}")
        return jsonify({"error": str(e)}), 500


# This endpoint return all submissions of a specific assignment, ordered by submission date
# Only tutors and admin can request details of other users.
@task.route("/check_submissions", methods=["GET"])
@authorize(allowed_user_levels=[USER_LEVEL_STUDENT, USER_LEVEL_TUTOR, USER_LEVEL_ADMIN])
def check_submissions(course_code, user_zid, user_level):
    """
    Route to check submissions for a task
    Parameters:
        - "course_code": the course code in which the task is located
        - "task": the task name to query
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json containing the submissions
            - "submissions": a dictionary containing the submission times and files
        - 401 status code if token is invalid
        - 401 status code if user is not a member of the course
    """
    task = request.args.get("task")
    # students can only download their own work!
    if user_level == USER_LEVEL_STUDENT:
        student = user_zid
    else:
        student = request.args.get("student")

    # Get requested students submissions
    path = f"{course_code}/{task}/{student}/"
    blobs = bucket.list_blobs(prefix=path)

    # Blobs contains all files and subdirectories recursively...why Google?
    # Need to filter for all the submission times, and requery for the list of files in that time
    sub_times = set()
    for blob in blobs:
        # Determine whether this is the top level subdirectory
        # Necessary as list_blobs is recursive
        parents = blob.name.split("/")
        if len(parents) > 3:
            sub_times.add(parents[3])

    sub_times = list(sub_times)
    sub_times.sort(
        key=lambda x: datetime.strptime(x, "%d-%m-%Y %H:%M:%S").timestamp(),
        reverse=True,
    )

    response = {"submissions": OrderedDict()}
    for sub_time in sub_times:
        blobs = bucket.list_blobs(prefix=f"{path}{sub_time}/")
        for blob in blobs:
            if sub_time not in response["submissions"]:
                response["submissions"][sub_time] = []
            response["submissions"][sub_time].append(blob.name)

    return response


# This endpoint allow a user to download a submission's file from Storage.
# It takes an absolute path to the file in Firebase storage.
# Only student can download their own file, tutors and admins can download any
# files in their course.
@task.route("/download_submission_file", methods=["POST"])
def download_file():
    """
    Route to download a submission file from Storage
    Request body:
    json containing:
        - "path": the absolute path to the file in Firebase Storage
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with the file as an attachment
        - 400 status code if the path is invalid
        - 401 status code if the token is invalid or the user has no access to the file
    """
    data = request.json

    file_path = data.get("path")  # Absolute file path in Firebase Storage
    # sanity check that the path is of the correct format, eg:
    # 24T3COMP1511/Assignment 1/z0001511/17-10-2024 10:36:38/atc24-jia.pdf
    if len(file_path.split("/")) != 5:
        return jsonify({"error": "Bad file path"}), 400

    course_code = file_path.split("/")[0]
    zid_requested = file_path.split("/")[2]

    token = request.headers.get("Authorization").split("Bearer ")[1]
    logged_in_zid = verify_token(token)

    if get_user_level(logged_in_zid, course_code) == USER_LEVEL_ZID_DOESNT_EXIST:
        return jsonify({"error": "Unauthorised"}), 401

    if get_user_level(logged_in_zid, course_code) == USER_LEVEL_NOT_MEMBER:
        return jsonify({"error": "Unauthorised"}), 401

    if (
        get_user_level(logged_in_zid, course_code) == USER_LEVEL_STUDENT
        and logged_in_zid != zid_requested
    ):
        return jsonify({"error": "Unauthorised"}), 401

    try:
        blob = bucket.blob(file_path)
        file_contents = blob.download_as_bytes()

        return send_file(
            BytesIO(file_contents),
            as_attachment=True,
            download_name=file_path.split("/")[-1],
        )  # Use the file name from the path

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@task.route("/generate_csv/<course_code>/<task_name>", methods=["GET"])
@authorize(allowed_user_levels=[USER_LEVEL_ADMIN])
def generate_csv(course_code, task_name, user_zid, user_level):
    """
    Route to generate a CSV file containing student results for a task
    Parameters:
        - "course_code": the course code in which the task is located
        - "task_name": the task name to query
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with the CSV file as an attachment
        - 404 status code if the course or task is not found
        - 500 status code if an error occurs
    """
    try:
        # Get the course document
        course_ref = db.collection("courses").document(course_code)
        course_doc = course_ref.get()

        if not course_doc.exists:
            logging.error(f"Course {course_code} not found")
            return jsonify({"error": f"Course {course_code} not found."}), 404

        # Get the task document
        task_ref = course_ref.collection("tasks").document(task_name)
        task_doc = task_ref.get()

        if not task_doc.exists:
            logging.error(f"Task {task_name} not found in course {course_code}")
            return (
                jsonify(
                    {"error": f"Task {task_name} not found in course {course_code}."}
                ),
                404,
            )

        # Fetch real student performance data from Firestore
        student_results = []
        results_ref = task_ref.collection("results")
        results = results_ref.get()

        for result in results:
            student_data = result.to_dict()
            student_data["zid"] = result.id  # Add the document ID (zid) to the data

            raw_automark = student_data.get("raw_automark", -1)
            style = student_data.get("style", -1)

            final_mark = -1
            if not raw_automark == -1 and not style == -1:
                final_mark = round(
                    (
                        (raw_automark + style)
                        * (1 - student_data.get("latePenaltyPercentage", "N/A") / 100)
                    ),
                    2,
                )

            student_results.append(
                {
                    "zid": student_data["zid"],
                    "final_mark": final_mark if not final_mark == -1 else "TBD",
                    "raw_automark": raw_automark if not raw_automark == -1 else "TBD",
                    "automark_timestamp": student_data.get("automark_timestamp", "TBD"),
                    "automark_report": student_data.get("automark_report", "TBD"),
                    "style": style if not style == -1 else "TBD",
                    "comments": student_data.get("comments", "N/A"),
                    "late_penalty": student_data.get("latePenaltyPercentage", "N/A"),
                    "mark_released": student_data.get("mark_released", False),
                }
            )

        # Create CSV in-memory
        output = StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=[
                "zid",
                "final_mark",
                "raw_automark",
                "automark_timestamp",
                "automark_report",
                "style",
                "comments",
                "late_penalty",
                "mark_released",
            ],
        )
        writer.writeheader()
        for student_result in student_results:
            writer.writerow(student_result)

        # Return CSV as response
        output.seek(0)
        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={
                "Content-Disposition": f"attachment;filename={course_code}_{task_name}_results.csv"
            },
        )

    except Exception as e:
        logging.error(f"Error generating CSV: {str(e)}")
        return jsonify({"error": str(e)}), 500


@task.route("/set_file_restrictions", methods=["POST"])
def set_file_restrictions():
    """
    Saves file restrictions for a given course and task. These restrictions include allowed file types,
    maximum file size, and required file names.
    Request body:
    json containing:
        - "course_code": the course code in which the task is located
        - "task": the task name to set file restrictions for
        - "required_files": a list of required file names
        - "allowed_file_types": a list of allowed file types
        - "max_file_size": the maximum file size in MB
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json confirming the file restrictions were saved
        - 400 status code if the request is invalid
        - 403 status code if the user is not an admin
        - 500 status code if an error occurs

    """
    # Check authorization token
    token = request.headers.get("Authorization")
    if not token or "Bearer " not in token:
        return jsonify({"error": "Authorization token is missing or invalid."}), 401

    token = token.split("Bearer ")[1]
    logged_in_zid = verify_token(token)

    data = request.json
    course_code = data.get("course_code")
    task_name = data.get("task")

    required_files = data.get("required_files", [])
    required_file_types = data.get("allowed_file_types", [])
    max_file_size = data.get("max_file_size", 1)

    if not course_code or not task_name:
        return jsonify({"error": "Course code or task name is missing."}), 400

    level = get_user_level(logged_in_zid, course_code)
    if level != USER_LEVEL_ADMIN:
        return jsonify({"error": "Unauthorized"}), 403

    try:
        task_ref = (
            db.collection("courses")
            .document(course_code)
            .collection("tasks")
            .document(task_name)
        )

        task_doc = task_ref.get()
        if not task_doc.exists:
            return jsonify({"error": "Task data not found."}), 404

        file_restrictions = {
            "requiredFiles": required_files,
            "allowedFileTypes": required_file_types,
            "maxFileSize": max_file_size,
        }

        task_ref.set({"fileRestrictions": file_restrictions}, merge=True)

        return jsonify({"message": "File restrictions saved successfully."}), 200

    except Exception as e:
        logging.error(f"Error saving file restrictions: {str(e)}")
        return jsonify({"error": f"Error saving file restrictions: {str(e)}"}), 500


@task.route("/get_file_restrictions", methods=["GET"])
@authorize(allowed_user_levels=[USER_LEVEL_STUDENT, USER_LEVEL_ADMIN])
def get_file_restrictions(course_code, user_zid, user_level):
    """
    Fetches file restrictions for a given course and task.
    Request parameters:
        - "course_code": the course code in which the task is located
        - "task": the task name to get file restrictions for
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json containing the file restrictions
            - "allowedFileTypes": a list of allowed file types
            - "maxFileSize": the maximum file size in MB
            - "requiredFiles": a list of required file names
        - 400 status code if the request is invalid
        - 403 status code if the user is not an admin or student
        - 404 status code if the task is not found
        - 500 status code if an error occurs
    """
    task_name = request.args.get("task")
    if not task_name:
        return jsonify({"error": "Task name is missing."}), 400

    try:
        task_ref = (
            db.collection("courses")
            .document(course_code)
            .collection("tasks")
            .document(task_name)
        )

        task_doc = task_ref.get()
        if not task_doc.exists:
            logging.error(f"Task '{task_name}' not found for course '{course_code}'.")
            return jsonify({"error": "Task not found."}), 404

        file_restrictions = task_doc.get("fileRestrictions")
        if file_restrictions is None:
            logging.error(
                f"File restrictions not found for task '{task_name}' in course '{course_code}'."
            )
            return jsonify({"error": "fileRestrictions not found."}), 404

        allowed_file_types = file_restrictions.get("allowedFileTypes", [])
        max_file_size = file_restrictions.get("maxFileSize", 1)
        required_files = file_restrictions.get("requiredFiles", [])

        if (
            not isinstance(allowed_file_types, list)
            or not isinstance(required_files, list)
            or not isinstance(max_file_size, (int, float))
        ):
            logging.error(
                f"Invalid structure in file restrictions for task '{task_name}' in course '{course_code}'."
            )
            return jsonify({"error": "Invalid fileRestrictions structure."}), 500

        return jsonify(file_restrictions), 200

    except Exception as e:
        logging.error(f"Error fetching file restrictions: {str(e)}")
        return jsonify({"error": f"Error fetching file restrictions: {str(e)}"}), 500


@task.route("/set_late_policy/<course_code>", methods=["POST"])
def set_late_policy(course_code: str):
    """
    Set the late submission policy for a course
    Expected request body:
    {
        "percentDeductionPerDay": 20,  // Percentage deducted per day late
        "lateDayType": "CALENDAR",     // "CALENDAR" or "BUSINESS" days
        "maxLateDays": 5               // Maximum number of late days allowed
    }
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json confirming the late policy was saved
        - 400 status code if the request is invalid
        - 403 status code if the user is not an admin
        - 500 status code if an error occurs
    """
    # Verify admin authorization
    token = request.headers.get("Authorization").split("Bearer ")[1]
    logged_in_zid = verify_token(token)
    level = get_user_level(logged_in_zid, course_code)

    if level != USER_LEVEL_ADMIN:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.json
    percent_deduction = data.get("percentDeductionPerDay")
    late_day_type = data.get("lateDayType")
    max_late_days = data.get("maxLateDays")

    # Validate inputs
    if (
        not isinstance(percent_deduction, (int, float))
        or percent_deduction < 0
        or percent_deduction > 100
    ):
        return jsonify({"error": "Invalid percentage deduction"}), 400

    if late_day_type not in ["CALENDAR", "BUSINESS"]:
        return jsonify({"error": "Invalid late day type"}), 400

    if not isinstance(max_late_days, int) or max_late_days < 0:
        return jsonify({"error": "Invalid max late days"}), 400

    try:
        # Update the course document with late policy
        course_ref = db.collection("courses").document(course_code)

        course_ref.update(
            {
                "latePolicy": {
                    "percentDeductionPerDay": percent_deduction,
                    "lateDayType": late_day_type,
                    "maxLateDays": max_late_days,
                }
            }
        )

        return jsonify({"message": "Late policy updated successfully"}), 200

    except Exception as e:
        logging.error(f"Error setting late policy: {str(e)}")
        return jsonify({"error": str(e)}), 500


def calculate_late_days(
    submission_time: datetime, deadline: datetime, late_day_type: str
) -> int:
    """
    Calculate number of late days based on submission time and late day type
    Both times should already be in Sydney timezone
    """
    # Ensure both times are timezone aware and in Sydney timezone
    sydney_tz = pytz.timezone("Australia/Sydney")
    if submission_time.tzinfo is None:
        submission_time = sydney_tz.localize(submission_time)
    if deadline.tzinfo is None:
        deadline = sydney_tz.localize(deadline)

    # Convert both to Sydney timezone if they aren't already
    submission_time = submission_time.astimezone(sydney_tz)
    deadline = deadline.astimezone(sydney_tz)

    if submission_time <= deadline:
        return 0

    # Get dates only (ignore time) for business day calculation
    submission_date = submission_time.date()
    deadline_date = deadline.date()

    if late_day_type == "CALENDAR":
        # Calculate total days including partial days
        time_diff = submission_time - deadline
        return math.ceil(time_diff.total_seconds() / (24 * 3600))
    else:  # BUSINESS days
        business_days = 0
        current_date = deadline_date

        while current_date < submission_date:
            if current_date.weekday() < 5:  # Monday = 0, Friday = 4
                business_days += 1
            current_date += timedelta(days=1)

        # Add one more day if submission is later on the final day
        if current_date == submission_date and current_date.weekday() < 5:
            business_days += 1

        return business_days


@task.route(
    "/special_consideration/<course_code>/<task_name>",
    methods=["POST", "GET", "DELETE"],
)
def manage_special_consideration(course_code: str, task_name: str):
    """
    Route to manage special considerations for a task
    POST: Add a special consideration for a student
    GET: Retrieve special considerations for a student or all students
    DELETE: Remove a special consideration for a student
    Parameters:
        - "course_code": the course code in which the task is located
        - "task_name": the task name to manage special considerations for
    Request body (POST):
    {
        "studentZid": "z1234567",
        "extensionHours": 24,
        "reason": "Medical emergency",
        "documentation": "URL to medical certificate"
    }
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json confirming the special consideration was added
        - 400 status code if the request is invalid
        - 403 status code if the user is not an admin
        - 500 status code if an error occurs

    Request body (GET):
    {
        "studentZid": "z1234567"
    }
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json containing the special consideration
        - 404 status code if the special consideration is not found
        - 500 status code if an error occurs

    Request body (DELETE):
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json confirming the special consideration was removed
        - 400 status code if the request is invalid
        - 403 status code if the user is not an admin
        - 500 status code if an error occurs
    """
    try:
        # Verify admin authorization
        token = request.headers.get("Authorization").split("Bearer ")[1]
        logged_in_zid = verify_token(token)
        level = get_user_level(logged_in_zid, course_code)

        if level != USER_LEVEL_ADMIN:
            return jsonify({"error": "Unauthorized"}), 403

        # Clean up task name - replace tildes with spaces
        formatted_task_name = task_name.replace("~", " ")

        if request.method == "POST":
            data = request.json
            student_zid = data.get("studentZid")
            extension_hours = data.get("extensionHours")
            reason = data.get("reason")
            documentation = data.get("documentation", "")

            if not all([student_zid, extension_hours, reason]):
                return jsonify({"error": "Missing required fields"}), 400

            try:
                special_consideration = {
                    "studentZid": student_zid,
                    "extensionHours": extension_hours,
                    "reason": reason,
                    "documentation": documentation,
                    "approvedBy": logged_in_zid,
                    "approvedAt": datetime.now(
                        pytz.timezone("Australia/Sydney")
                    ).isoformat(),
                    "status": "APPROVED",
                }

                # Use formatted task name for Firebase path
                task_ref = (
                    db.collection("courses")
                    .document(course_code)
                    .collection("tasks")
                    .document(formatted_task_name)
                )

                task_ref.collection("specialConsiderations").document(student_zid).set(
                    special_consideration
                )

                # Update student's result document if it exists
                student_ref = task_ref.collection("results").document(student_zid).get()
                if student_ref.exists:
                    result_data = student_ref.to_dict()
                    result_data["specialConsideration"] = special_consideration
                    task_ref.collection("results").document(student_zid).set(
                        result_data
                    )

                return (
                    jsonify({"message": "Special consideration added successfully"}),
                    200,
                )

            except Exception as e:
                logging.error(f"Error adding special consideration: {str(e)}")
                return jsonify({"error": str(e)}), 500

        elif request.method == "GET":
            student_zid = request.args.get("studentZid")
            if student_zid:
                doc = (
                    db.collection("courses")
                    .document(course_code)
                    .collection("tasks")
                    .document(formatted_task_name)
                    .collection("specialConsiderations")
                    .document(student_zid)
                    .get()
                )
                if doc.exists:
                    return jsonify({"specialConsideration": doc.to_dict()}), 200
                return jsonify({"message": "No special consideration found"}), 404
            else:
                docs = (
                    db.collection("courses")
                    .document(course_code)
                    .collection("tasks")
                    .document(formatted_task_name)
                    .collection("specialConsiderations")
                    .get()
                )
                return (
                    jsonify({"specialConsiderations": [doc.to_dict() for doc in docs]}),
                    200,
                )

        elif request.method == "DELETE":
            student_zid = request.args.get("studentZid")
            if not student_zid:
                return jsonify({"error": "Student zID required"}), 400

            # Delete using formatted task name
            (
                db.collection("courses")
                .document(course_code)
                .collection("tasks")
                .document(formatted_task_name)
                .collection("specialConsiderations")
                .document(student_zid)
                .delete()
            )

            # Update student's result document using formatted task name
            student_ref = (
                db.collection("courses")
                .document(course_code)
                .collection("tasks")
                .document(formatted_task_name)
                .collection("results")
                .document(student_zid)
                .get()
            )

            if student_ref.exists:
                result_data = student_ref.to_dict()
                if "specialConsideration" in result_data:
                    del result_data["specialConsideration"]
                    student_ref.reference.set(result_data)

            return (
                jsonify({"message": "Special consideration removed successfully"}),
                200,
            )

    except Exception as e:
        logging.error(f"Error in special consideration management: {str(e)}")
        return jsonify({"error": str(e)}), 500


@task.route("/get_tolerance_filters", methods=["GET"])
@authorize(allowed_user_levels=[USER_LEVEL_ADMIN])
def get_tolerance_filters(course_code, user_zid, user_level):
    """
    Fetches tolerance filters for a given course and task.
    Request body:
    json containing:
        - "courseCode": the course code in which the task is located
        - "task": the task name to get tolerance filters for
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json containing the tolerance filters
            - "trailingNewline": whether to ignore trailing newlines
            - "trailingWhitespaces": whether to ignore trailing whitespaces
            - "whitespacesAmount": the number of whitespaces to ignore
            - "caseDifferences": whether to ignore case differences
        - 400 status code if the request is invalid
        - 403 status code if the user is not an admin
        - 404 status code if the task is not found
        - 500 status code if an error occurs
    """
    task_name = request.args.get("task")
    if not task_name:
        return jsonify({"error": "Task name is missing."}), 400

    try:
        task_ref = (
            db.collection("courses")
            .document(course_code)
            .collection("tasks")
            .document(task_name)
        )

        task_doc = task_ref.get()
        if not task_doc.exists:
            logging.error(f"Task '{task_name}' not found for course '{course_code}'.")
            return jsonify({"error": "Task not found."}), 404

        tolerance_filters = task_doc.get("toleranceFilters")
        if tolerance_filters is None:
            logging.error(
                f"Tolerance filters not found for task '{task_name}' in course '{course_code}'."
            )
            return jsonify({"error": "fileRestrictions not found."}), 404

        trailingNewline = tolerance_filters.get("ignoreTrailingNewline")
        trailingWhitespaces = tolerance_filters.get("ignoreTrailingWhitespaces")
        whitespacesAmount = tolerance_filters.get("ignoreWhitespacesAmount")
        caseDifferences = tolerance_filters.get("ignoreCaseDifferences")

        return (
            jsonify(
                {
                    "trailingNewline": trailingNewline,
                    "trailingWhitespaces": trailingWhitespaces,
                    "whitespacesAmount": whitespacesAmount,
                    "caseDifferences": caseDifferences,
                }
            ),
            200,
        )

    except Exception as e:
        logging.error(f"Error getting tolerance filters: {str(e)}")
        return jsonify({"error": f"Error getting tolerance filters: {str(e)}"}), 500


@task.route("/set_tolerance_filters", methods=["PUT"])
def set_tolerance_filters():
    """
    Saves tolerance filters for a given course and task.
    Request body:
    json containing:
        - "courseCode": the course code in which the task is located
        - "task": the task name to set tolerance filters for
        - "trailingNewline": whether to ignore trailing newlines (true/false)
        - "trailingWhitespaces": whether to ignore trailing whitespaces (true/false)
        - "whitespacesAmount": whether to ignore whitespace amount (true/false)
        - "caseDifferences": whether to ignore case differences (true/false)
    Headers:
        - "Authorization": the user's JWT token
    Returns:
        - 200 status code with a json confirming the tolerance filters were saved
        - 400 status code if the request is invalid
        - 403 status code if the user is not an admin
        - 500 status code if an error occurs
    """
    token = request.headers.get("Authorization")
    if not token or "Bearer " not in token:
        return jsonify({"error": "Authorization token is missing or invalid."}), 401

    token = token.split("Bearer ")[1]
    logged_in_zid = verify_token(token)

    course_code = request.args.get("courseCode")
    task_name = request.args.get("task")

    if not course_code or not task_name:
        return jsonify({"error": "Course code or task name is missing."}), 400

    level = get_user_level(logged_in_zid, course_code)
    if level not in [USER_LEVEL_ADMIN]:
        return jsonify({"error": "Unauthorized"}), 403

    try:
        task_ref = (
            db.collection("courses")
            .document(course_code)
            .collection("tasks")
            .document(task_name)
        )

        task_doc = task_ref.get()
        if not task_doc.exists:
            logging.error(f"Task '{task_name}' not found for course '{course_code}'.")
            return jsonify({"error": "Task not found."}), 404

        data = request.json
        tolerance_filters = {
            "ignoreTrailingNewline": data.get("trailingNewline"),
            "ignoreTrailingWhitespaces": data.get("trailingWhitespaces"),
            "ignoreWhitespacesAmount": data.get("whitespacesAmount"),
            "ignoreCaseDifferences": data.get("caseDifferences"),
        }

        task_ref.set({"toleranceFilters": tolerance_filters}, merge=True)

        return (
            jsonify({"message": "Tolerance filter settings saved successfully."}),
            200,
        )

    except Exception as e:
        logging.error(f"Error setting tolerance filters: {str(e)}")
        return jsonify({"error": f"Error setting tolerance filters: {str(e)}"}), 500
