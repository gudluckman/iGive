from datetime import datetime, timedelta
import os
from flask import request, jsonify, Blueprint
import logging
import re
import tempfile
import re
import json
import resource
import subprocess
import shlex
import math
from blueprints.helpers import (
    USER_LEVEL_TUTOR,
    verify_token,
    get_user_level,
    USER_LEVEL_ADMIN,
    USER_LEVEL_NOT_MEMBER,
    USER_LEVEL_STUDENT,
)
from firebase import db, bucket

testing = Blueprint("testing", __name__)

TOLERANCE_FILTER_IGNORE_TRAILING_NEWLINE = "ignoreTrailingNewline"
TOLERANCE_FILTER_IGNORE_TRAILING_WHITESPACES = "ignoreTrailingWhitespaces"
TOLERANCE_FILTER_IGNORE_WHITESPACES_AMOUNT = "ignoreWhitespacesAmount"
TOLERANCE_FILTER_IGNORE_CASE_DIFFERENCES = "ignoreCaseDifferences"


def run_testing(
    is_autotest: bool,
    zid_requested: str,
    course_code: str,
    task: str,
    submission_timestamp: str,
):
    # First we query the DB to see what tolerance filters are turned on by the admin
    tolerance_filters = []
    course_ref = db.collection("courses").document(course_code)
    course_doc = course_ref.get()
    if not course_doc.exists:
        logging.error(
            f"FATAL error in run_testing(): course {course_code} document not found in DB"
        )
        return None
    else:
        task_doc = course_ref.collection("tasks").document(task).get()
        if not task_doc.exists:
            logging.error(
                f"FATAL error in run_testing(): task {task} document of course {course_code} not found in DB"
            )
            return None
        else:
            task_dict = task_doc.to_dict()
            for filter in task_dict["toleranceFilters"].keys():
                if task_dict["toleranceFilters"][filter]:
                    tolerance_filters.append(filter)

    # Then work out where in the storage bucket to grab files from
    path = f"{course_code}/{task}/scripts/"
    if is_autotest:
        path += "autotest/"
    else:
        path += "automark/"

    # Work out where all the test cases are. Again, Google's stupid list_blobs
    # is recursive so we need to unrecurse it.
    blobs = bucket.list_blobs(prefix=path)
    test_cases_directories_set = set()
    for blob in blobs:
        test_case_match = re.match(
            r"^([A-Z0-9]+/[^/]*/scripts/(autotest|automark)/test_[0-9]+/)", blob.name
        )
        if test_case_match:
            test_cases_directories_set.add(test_case_match.group(1))

    # For each test case, create a temp folder, copy in all the necessary file and execute
    # Not a true sandbox, but we ball
    test_cases_storage = sorted(list(test_cases_directories_set))
    run_result = []
    with tempfile.TemporaryDirectory() as sandbox:
        # Copy in the student's code
        submission_path = f"{course_code}/{task}/{zid_requested}/{submission_timestamp}"
        submission_blobs = bucket.list_blobs(prefix=submission_path)
        for blob in submission_blobs:
            blob.download_to_filename(os.path.join(sandbox, blob.name.split("/")[-1]))

        # Copy in the runner
        runner_path = path + "run.sh"
        runner_blob = bucket.blob(runner_path)
        try:
            runner_blob.download_to_filename(os.path.join(sandbox, "run.sh"))
        except:
            logging.error("No runner script found, aborting.")
            return None

        for test_case_dir in test_cases_storage:
            # grab the parameters
            parameters_blob = bucket.blob(test_case_dir + "parameters.json")
            parameters_str = parameters_blob.download_as_bytes().decode("utf-8")
            # now deserialise it
            parameters = json.loads(parameters_str)
            runner_args = parameters["runner_args"]
            cpu_time_limit = parameters["cpu_time"]
            memory_limit = parameters["memory_megabytes"]

            if isinstance(cpu_time_limit, str):
                cpu_time_limit = int(cpu_time_limit)
            if isinstance(memory_limit, str):
                memory_limit = int(memory_limit)

            # Download test files from storage
            input_blob = bucket.blob(test_case_dir + "in")
            input_blob.download_to_filename(os.path.join(sandbox, "in"))
            output_blob = bucket.blob(test_case_dir + "out")
            output_blob.download_to_filename(os.path.join(sandbox, "out"))

            # Convert Windows' CRLF to *unix's LF
            subprocess.run(
                ["dos2unix", os.path.join(sandbox, "in")],
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            subprocess.run(
                ["dos2unix", os.path.join(sandbox, "out")],
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )

            # Apply tolerance filters to our reference in and out if necessary
            if TOLERANCE_FILTER_IGNORE_TRAILING_NEWLINE in tolerance_filters:
                subprocess.run(
                    ["perl", "-i", "-pe", "'chomp if eof'", os.path.join(sandbox, "in")]
                )
                subprocess.run(
                    [
                        "perl",
                        "-i",
                        "-pe",
                        "'chomp if eof'",
                        os.path.join(sandbox, "out"),
                    ]
                )

            # got all the files in place, but there are a few more moving pieces to set up
            # call the shell lexer on "runner_args", theres some deep osdev lore behind this:
            # the shell do argument splitting for you into an array then invoke the exec syscall which
            # sets up the child process's argv in the stack to point to the array the shell did the splitting on.
            # since python doesnt do this we need to do it explicitly to maintain shell word splitting
            # semantics (e.g. words with spaces inside a quote is one argument).
            exec_command = shlex.split(
                f"/bin/sh {os.path.join(sandbox, 'run.sh')} {runner_args}"
            )

            # set memory limit, this won't crash the subprocess if it runs out of memory
            # but allocations in that subprocess will fail, which is enough to cause test cases to fail.
            def limit_subproc_mem():
                soft, hard = resource.getrlimit(resource.RLIMIT_DATA)
                resource.setrlimit(
                    resource.RLIMIT_DATA, (memory_limit * 1024 * 1024, hard)
                )

            # now we can actually run
            try:
                runner_result = subprocess.run(
                    exec_command,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    preexec_fn=limit_subproc_mem,
                    timeout=cpu_time_limit,
                    cwd=sandbox,
                )

                # run.sh finished, student's output in stdout stream, dump it into a file so we can use GNU diff on it
                their_out_path = os.path.join(sandbox, "their_out")
                with open(their_out_path, "wb") as their_out_handle:
                    their_out_handle.write(runner_result.stdout)

                # Apply the ignore last newline tolerance if enabled to student output
                if TOLERANCE_FILTER_IGNORE_TRAILING_NEWLINE in tolerance_filters:
                    subprocess.run(
                        ["perl", "-i", "-pe", "'chomp if eof'", their_out_path]
                    )

                # Apply other tolerances as configured by admin
                our_out_path = os.path.join(sandbox, "out")
                diff_exec_cmd = ["diff"]
                if TOLERANCE_FILTER_IGNORE_TRAILING_WHITESPACES in tolerance_filters:
                    diff_exec_cmd.append("--ignore-trailing-space")
                if TOLERANCE_FILTER_IGNORE_WHITESPACES_AMOUNT in tolerance_filters:
                    diff_exec_cmd.append("--ignore-space-change")
                if TOLERANCE_FILTER_IGNORE_CASE_DIFFERENCES in tolerance_filters:
                    diff_exec_cmd.append("--ignore-case")

                # Now really run diff
                diff_result = subprocess.run(
                    diff_exec_cmd + [their_out_path, our_out_path],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                )
                output_diff_equal = diff_result.returncode == 0

                # run.sh can also return an error code so it can do some custom testing
                runner_success = runner_result.returncode == 0

                # Map the two results into an easy to read (hopefully) report.
                def runner_fail(runner_stdout_bytes, runner_stderr_bytes) -> str:
                    report = "# TEST FAILED. Our code runner returned an error. "
                    report += "You could be crashing, failing a hidden check or running out of memory.\n"
                    report += f"The stdout message (if any) is:\n{runner_stdout_bytes.decode('utf-8')}\n"
                    report += f"The stderr message (if any) is:\n{runner_stderr_bytes.decode('utf-8')}\n"
                    return report

                def diff_fail(
                    in_bytes, our_out_bytes, their_out_bytes, diff_stdout_bytes
                ) -> str:
                    report = "# TEST FAILED. Your output does not match the expected output.\n"
                    report += f"*** Input is: \n"
                    report += in_bytes.decode("utf-8")
                    report += f"*** Expected output is: \n"
                    report += our_out_bytes.decode("utf-8")
                    report += f"*** Your output is: \n"
                    report += their_out_bytes.decode("utf-8")
                    report += f"*** The difference is: \n"
                    report += diff_stdout_bytes.decode("utf-8")
                    report += f"*** This test case was ran with these tolerances: \n"
                    report += str(tolerance_filters) + "\n"
                    return report

                result_rubric = {
                    (True, True): "# TEST PASSED",
                    (True, False): runner_fail(
                        runner_result.stdout, runner_result.stderr
                    ),
                    (False, True): diff_fail(
                        input_blob.download_as_bytes(),
                        output_blob.download_as_bytes(),
                        runner_result.stdout,
                        diff_result.stdout,
                    ),
                }
                result_rubric[(False, False)] = (
                    result_rubric[(False, True)] + result_rubric[(True, False)]
                )

                run_result.append(
                    {
                        "test_name": parameters["test_name"],
                        "passed": output_diff_equal and runner_success,
                        "output": result_rubric[(output_diff_equal, runner_success)],
                    }
                )

            except subprocess.TimeoutExpired:
                run_result.append(
                    {
                        "test_name": parameters["test_name"],
                        "passed": False,
                        "output": f"You've exceeded the CPU time limit of {cpu_time_limit} seconds.",
                    }
                )
            except Exception as e:
                run_result.append(
                    {
                        "test_name": parameters["test_name"],
                        "passed": False,
                        "output": f"A server error occurred: {e}.",
                    }
                )
                logging.error(e)

    return run_result


@testing.route("/run_autotest", methods=["POST"])
def autotest():
    """
    Route to run autotests (sample visible tests) for a student's submission for a specific task in a course.
    Request body:
    json containing:
        - "course_code": the course code in which the task is located
        - "task": the task name
        - "timestamp": the submission timestamp to be run
        - "zid": the zid of the student whose submission is to be tested (Only on admin run)
    Headers:
        - "Authorization": the bearer token for the user
    Returns:
        - 200 status code if successful with json containing:
            - "autotest_results": a list of dictionaries, each containing:
                - "test_name": the name of the test
                - "passed": whether the test passed
                - "output": the output of the test (any error messages or differences)
        - 401 status code if the user is not authorised
        - 500 status code if there are no submissions recorded for the provided parameters
    """
    data = request.json
    course_code = data["course_code"]
    task = data["task"]
    submission_timestamp = data["timestamp"]

    token = request.headers.get("Authorization").split("Bearer ")[1]
    logged_in_zid = verify_token(token)

    if get_user_level(logged_in_zid, course_code) <= USER_LEVEL_NOT_MEMBER:
        return jsonify({"error": "Unauthorised"}), 401

    if get_user_level(logged_in_zid, course_code) == USER_LEVEL_STUDENT:
        # A student can only run their own autotests
        zid_requested = logged_in_zid
    else:
        zid_requested = data["zid"]

    submission_path = f"{course_code}/{task}/{zid_requested}/{submission_timestamp}/"
    submission_blobs = bucket.list_blobs(prefix=submission_path)
    if len(list(submission_blobs)) == 0:
        return (
            jsonify(
                {
                    "error": "no submissions recorded for the provided parameters, cannot run autotest!"
                }
            ),
            500,
        )

    resp = run_testing(True, zid_requested, course_code, task, submission_timestamp)

    if resp is None:
        return (
            jsonify({"error": "An internal server error occured."}),
            500,
        )
    else:
        return {"autotest_results": resp}


@testing.route("/run_automark", methods=["POST"])
def automark():
    """
    Route to run automark (hidden tests) for a student's submission for a specific task in a course.
    Request body:
    json containing:
        - "course_code": the course code in which the task is located
        - "task": the task name
        - "timestamp": the submission timestamp to be run
        - "zid": the zid of the student whose submission is to be tested (Only on admin run)
    Headers:
        - "Authorization": the bearer token for the user
    Returns:
        - 200 status code if successful with json containing:
            - "automark_results": a list of dictionaries, each containing:
                - "test_name": the name of the test
                - "passed": whether the test passed
                - "output": the output of the test (any error messages or differences)
        - 401 status code if the user is not authorised
        - 500 status code if there are no submissions recorded for the provided parameters
    """
    try:
        data = request.json
        zid_requested = data["zid"]
        course_code = data["course_code"]
        task = data["task"]
        submission_timestamp = data["timestamp"]

        token = request.headers.get("Authorization").split("Bearer ")[1]
        logged_in_zid = verify_token(token)

        if get_user_level(logged_in_zid, course_code) < USER_LEVEL_TUTOR:
            logging.error(f"AUTOMARK run cancelled, requestor unauthorised")
            return jsonify({"error": "Unauthorised"}), 401

        submission_path = (
            f"{course_code}/{task}/{zid_requested}/{submission_timestamp}/"
        )
        submission_blobs = bucket.list_blobs(prefix=submission_path)
        if len(list(submission_blobs)) == 0:
            return (
                jsonify(
                    {
                        "error": "no submissions recorded for the provided parameters, cant run automark!"
                    }
                ),
                500,
            )

        # Run the tests first
        result = run_testing(
            False, zid_requested, course_code, task, submission_timestamp
        )
        if result is None:
            return jsonify({"error": "Internal server error"}), 500

        # Calculate raw marks
        num_passed = sum(1 for test_case in result if test_case.get("passed"))
        timestamp = datetime.now().strftime(f"%d-%m-%Y %X")
        mark_released = False
        report = json.dumps(result)

        # Get task data and special consideration
        course_ref = db.collection("courses").document(course_code)
        task_ref = course_ref.collection("tasks").document(task)
        task_doc = task_ref.get()

        if not task_doc.exists:
            return jsonify({"error": "Task not found"}), 404

        task_params = task_doc.to_dict()
        max_automark = task_params["maxAutomark"]

        # Calculate raw mark before any penalties
        raw_mark = round(((num_passed / len(result)) * 100) * (max_automark / 100))

        # Check for special consideration
        special_consideration_ref = (
            task_ref.collection("specialConsiderations").document(zid_requested).get()
        )
        extension_hours = 0
        if special_consideration_ref.exists:
            special_consideration = special_consideration_ref.to_dict()
            if special_consideration.get("status") == "APPROVED":
                extension_hours = special_consideration.get("extensionHours", 0)

        # Calculate late penalty with special consideration
        submission_time = datetime.strptime(submission_timestamp, "%d-%m-%Y %X")
        deadline = datetime.fromisoformat(
            task_params["deadline"].replace("Z", "+00:00")
        )

        if extension_hours > 0:
            # Add extension to deadline
            deadline = deadline + timedelta(hours=extension_hours)

        # Calculate late days (you would need to import this from your task.py)
        from blueprints.task import calculate_late_days

        late_days = calculate_late_days(
            submission_time,
            deadline,
            task_params.get("latePolicy", {}).get("lateDayType", "CALENDAR"),
        )

        # Calculate penalty percentage
        deduction_per_day = task_params.get("latePolicy", {}).get(
            "percentDeductionPerDay", 0
        )
        penalty_percentage = (
            min(late_days * deduction_per_day, 100) if late_days > 0 else 0
        )

        if task_params.get("latePolicy", {}).get("maxLateDays") < late_days:
            penalty_percentage = 100

        # Apply penalty to raw mark
        # final_mark = math.ceil(raw_mark * (1 - penalty_percentage / 100))

        # Update student record
        student_result_ref = task_ref.collection("results").document(zid_requested)
        if student_result_ref.get().exists:
            result_record = student_result_ref.get().to_dict()
            result_record.update(
                {
                    # "automark": final_mark,
                    "raw_automark": raw_mark,  # Store the raw mark before penalties
                    "automark_timestamp": timestamp,
                    "automark_report": report,
                    "lateDays": late_days,
                    "latePenaltyPercentage": penalty_percentage,
                    "comments": result_record.get("comments", ""),
                    "mark_released": result_record.get("mark_released", mark_released),
                    "style": result_record.get("style", 0),
                }
            )

            # If there's special consideration, include it in the record
            if extension_hours > 0:
                result_record["specialConsiderationApplied"] = {
                    "extensionHours": extension_hours,
                    "originalDeadline": task_params["deadline"],
                    "extendedDeadline": deadline.isoformat(),
                }

            student_result_ref.update(result_record)
        else:
            logging.error(
                "result record does not exist, it should've been created from file upload!"
            )
            return jsonify({"error": "Internal server error"}), 500

        return {"automark_results": result}

    except Exception as e:
        logging.error(f"Error in automark: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500
