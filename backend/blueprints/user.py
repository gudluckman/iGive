from flask import request, jsonify, Blueprint
from blueprints.helpers import (
    USER_LEVEL_ADMIN,
    USER_LEVEL_NOT_MEMBER,
    USER_LEVEL_STUDENT,
    USER_LEVEL_TUTOR,
    USER_LEVEL_ZID_DOESNT_EXIST,
    get_user_level,
    is_valid_zid_email,
    is_strong_password,
    verify_token,
)
from cache.user_cache import get_user_cache, invalidate_user_cache
from firebase import db

user = Blueprint("user", __name__)


@user.route("/user_level", methods=["POST"])
def user_level():
    """
    Determine the user level for the caller for a given course.
    Request body:
    json containing:
        - "course_code": the course code to check the user's level for
    Headers:
        - "Authorization": the bearer token for the user
    Returns:
        - 200 status code with json containing:
            - "userLevel": "student" | "tutor" | "admin"
        - 400 status code if the user is not part of the course
        - 401 status code if the token is invalid or the user is unauthorized
    """
    # Get authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Authorization header missing or malformed"}), 401

    # Extract the token from the Authorization header
    token = auth_header.split("Bearer ")[1]

    zid = verify_token(token)
    if zid is None:
        return jsonify({"error": "Unauthorized or invalid token"}), 401

    data = request.get_json()
    course_code = data.get("course_code")

    user_level = get_user_level(zid, course_code)

    if user_level == USER_LEVEL_STUDENT:
        return jsonify({"userLevel": "student"}), 200
    elif user_level == USER_LEVEL_TUTOR:
        return jsonify({"userLevel": "tutor"}), 200
    elif user_level == USER_LEVEL_ADMIN:
        return jsonify({"userLevel": "admin"}), 200
    elif user_level == USER_LEVEL_NOT_MEMBER:
        return jsonify({"error": "User is not part of this course"}), 400
    elif user_level == USER_LEVEL_ZID_DOESNT_EXIST:
        return jsonify({"error": "User does not exist in database"}), 400
    else:
        return jsonify({"error": "Unknown error"}), 500


@user.route("/user_courses", methods=["POST"])
def user_courses():
    """
    Fetch the courses a user is associated with based on their token.
    Headers:
        - "Authorization": the bearer token for the user
    Returns:
        - 200 status code with json containing:
            - "studentOf": list of courses the user is a student of
            - "tutorOf": list of courses the user is a tutor of
            - "adminOf": list of courses the user is an admin of
        - 400 status code if the email is invalid or the user does not exist
    """
    # Get authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Authorization header missing or malformed"}), 401

    # Extract the token from the Authorization header
    token = auth_header.split("Bearer ")[1]

    zid = verify_token(token)
    if zid is None:
        return jsonify({"error": "Unauthorized or invalid token"}), 401

    docData = get_user_cache(zid)
    if docData is None:
        return jsonify({"error": "User does not exist in database"}), 400

    student_of = docData.get("studentOf", "N/A")
    tutor_of = docData.get("tutorOf", "N/A")
    admin_of = docData.get("adminOf", "N/A")
    if student_of == "N/A" or tutor_of == "N/A" or admin_of == "N/A":
        return (
            jsonify(
                {"error": "Database not set up properly, one course field is missing"}
            ),
            400,
        )
    else:
        return (
            jsonify(
                {"studentOf": student_of, "tutorOf": tutor_of, "adminOf": admin_of}
            ),
            200,
        )


@user.route("/user_register", methods=["POST"])
def user_register():
    """
    Handles user registration with support for existing user documents.
    If a user document exists (from admin adding courses), updates it instead of creating new.
    Request body:
    json containing:
        - "email": the email of the user to register
        - "password": the password for the user
        - "firstName": the first name of the user
        - "lastName": the last name of the user
    Returns:
        - 200 status code with json containing:
            - "message": "User <zID> registered successfully"
        - 400 status code if the email is invalid or the first/last name is missing
        - 500 status code if the registration failed
    """
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    first_name = data.get("firstName")
    last_name = data.get("lastName")

    # Validate email format
    if not email or not is_valid_zid_email(email):
        return (
            jsonify({"error": "Invalid zID email format (z1234567@unsw.edu.au)"}),
            400,
        )

    # Validate the presence of first and last names
    if not first_name or not last_name:
        return jsonify({"error": "First name and last name are required"}), 400

    # Only check minimum password length
    is_password_valid, password_msg = is_strong_password(password)
    if not is_password_valid:
        return jsonify({"error": password_msg}), 400

    # Process the user registration in Firestore
    zID = email[:8]
    user_collection = db.collection("users")
    user_doc = user_collection.document(zID)

    try:
        # Check if user document exists
        doc = user_doc.get()
        if doc.exists:
            # If document exists, ensure it has all required fields
            current_data = doc.to_dict()
            updated_data = {
                "firstName": current_data.get("firstName", first_name),
                "lastName": current_data.get("lastName", last_name),
                "studentOf": current_data.get("studentOf", []),
                "tutorOf": current_data.get("tutorOf", []),
                "adminOf": current_data.get("adminOf", []),
            }
            # Update the document with any missing fields
            user_doc.set(updated_data, merge=True)
            invalidate_user_cache(zID)
        else:
            # Create new user document if it doesn't exist
            user_data = {
                "firstName": first_name,
                "lastName": last_name,
                "studentOf": [],
                "tutorOf": [],
                "adminOf": [],
            }
            user_doc.set(user_data)
            invalidate_user_cache(zID)

        return jsonify({"message": f"User {zID} registered successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500


@user.route("/user_name", methods=["GET"])
def get_user_details():
    """
    Fetch the first name and last name of a user based on zID.
    Request body:
    json containing:
        - "zID": the zID of the user to fetch details for
    Headers:
        - "Authorization": the bearer token for the user
    Returns:
        - 200 status code with json containing:
            - "firstName": the first name of the user
            - "lastName": the last name of the user
        - 400 status code if the zID is missing
        - 404 status code if the user document does not exist
        - 401 status code if the token is invalid
    """
    # Authenticate user via token
    token = request.headers.get("Authorization")
    if not token or "Bearer " not in token:
        return jsonify({"error": "Authorization token is missing or invalid."}), 401

    # Extract and verify the token
    token = token.split("Bearer ")[1]
    logged_in_zid = verify_token(token)

    if not logged_in_zid:
        return jsonify({"error": "Invalid token"}), 401

    # Extract zID from query parameters
    zID = request.args.get("zID")

    if not zID:
        return jsonify({"error": "zID is required"}), 400

    doc = get_user_cache(zID)
    if doc is None:
        return jsonify({"error": f"User document for {zID} does not exist"}), 404
    else:
        first_name = doc.get("firstName")
        last_name = doc.get("lastName")
        return jsonify({"firstName": first_name, "lastName": last_name}), 200
