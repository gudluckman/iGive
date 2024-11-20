import logging
import re
from firebase import db
from firebase_admin import auth
from flask import request, jsonify
from functools import wraps
from cache.user_cache import get_user_cache

# Helper function to validate token and return the user's zID
def verify_token(token):
    # Phone home to Firebase and check who is the logged in user
    try:
        decoded_token = auth.verify_id_token(token)
        user_email = decoded_token["email"]
        logged_in_zid = user_email.split("@")[0]

        return logged_in_zid

    except Exception as e:
        return None


# Helper function to determine what level is the user at for the given course
USER_LEVEL_ZID_DOESNT_EXIST = 0
USER_LEVEL_NOT_MEMBER = 1
USER_LEVEL_STUDENT = 2
USER_LEVEL_TUTOR = 3
USER_LEVEL_ADMIN = 4
def get_user_level(zid, course_code) -> int:
    if zid is None:
        return USER_LEVEL_ZID_DOESNT_EXIST

    docData = get_user_cache(zid)

    if docData == None:
        return USER_LEVEL_ZID_DOESNT_EXIST
    elif course_code in docData.get("studentOf"):
        return USER_LEVEL_STUDENT
    if course_code in docData.get("tutorOf"):
        return USER_LEVEL_TUTOR
    if course_code in docData.get("adminOf"):
        return USER_LEVEL_ADMIN
    else:
        return USER_LEVEL_NOT_MEMBER

# Backend validation helper functions
def is_valid_zid_email(email):
    """Checks if the provided email is a valid UNSW zID email."""
    zIDRegex = r"^z\d{7}@(ad\.)?unsw\.edu\.au$"
    return re.match(zIDRegex, email)


def is_strong_password(password):
    """Checks basic password requirements - only length is mandatory."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    return True, ""  # Always return True if minimum length is met


# Helper function to get the path to the scripts folder
def get_script_path(course_code, task, hidden):
    path = f"{course_code}/{task}/scripts/"
    if hidden:
        path += "automark/"
    else:
        path += "autotest/"
    return path


# Helper function to fetch students data from Firestore
def get_student_results(course_code, task_name):
    students_data = []
    try:
        results_ref = (
            db.collection("courses")
            .document(course_code)
            .collection("tasks")
            .document(task_name)
            .collection("students")
        )
        students_docs = results_ref.stream()

        for doc in students_docs:
            student_data = doc.to_dict()
            student_data["id"] = doc.id
            students_data.append(student_data)

        return students_data
    except Exception as e:
        logging.error(f"Error fetching students data: {str(e)}")
        return None

# Helper function to check if a request has valid payload
def get_user_from_token():
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        return None, "Authorization token is missing or invalid.", 401

    token = token.split("Bearer ")[1]
    user_zid = verify_token(token)
    if not user_zid:
        return None, "Invalid token.", 401
    return user_zid, None, None


# Decorator for endpoints
# Verifies if the token given in the header is valid
# Then gets the level of the user for the provided course
# Returns the course code, zID of the user and their level for the course
def authorize(allowed_user_levels=[]):
    def decorator(func):
        @wraps(func)
        def wrapper(course_code=None, *args, **kwargs):
            user_zid, error_message, status = get_user_from_token()
            if error_message:
                return jsonify({"error": error_message}), status

            # Course code can get passed in as param or in route
            if not course_code:
                course_code = request.args.get('course_code')
                if not course_code:
                    return jsonify({"error": "Course code is required."}), 400

            user_level = get_user_level(user_zid, course_code)
            if user_level not in allowed_user_levels:
                return jsonify({"error": "Unauthorized"}), 403

            # Pass course_code, user_zid user_level to the endpoint
            kwargs['course_code'] = course_code
            kwargs['user_zid'] = user_zid
            kwargs['user_level'] = user_level
            return func(*args, **kwargs)
        return wrapper
    return decorator

