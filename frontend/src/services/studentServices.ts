import { auth } from "../util/firebase_util";
import { StudentDetails, StudentResult } from "../interfaces";
import { fetchStudentResult } from "./resultService";
import { alertNotifier } from "../components/Notifier/ActionNotifier";

// Add interface for the result structure
interface StudentResultResponse {
  result: StudentResult | "none";
}

async function fetchStudentsDetails(token: string, courseCode: string) {
  const params = new URLSearchParams();
  params.append("course_code", courseCode);

  const payload = {
    method: "GET",
    headers: {
      Authorization: "Bearer " + token,
    },
  };

  try {
    const response = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/course/list_students_details?${params.toString()}`,
      payload
    );

    if (!response.ok) {
      alertNotifier(`HTTP error! Status: ${response.status}`);
      console.error("Fetch request failed with status:", response.status);
      return [];
    }

    const data = await response.json();
    return data["students"];
  } catch (error) {
    console.error("Error occurred while fetching student details:", error);
    return [];
  }
}

async function fetchStudentSubmissions(
  token: string,
  courseCode: string,
  task: string,
  id: string
) {
  const params = new URLSearchParams();
  params.append("course_code", courseCode);
  params.append("student", id);
  params.append("task", task);

  const payload = {
    method: "GET",
    headers: {
      Authorization: "Bearer " + token,
    },
  };
  try {
    const response = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/task/check_submissions?${params.toString()}`,
      payload
    );
    if (!response.ok) {
      alertNotifier(`HTTP error! Status: ${response.status}`);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    let data = await response.json();

    const sortedEntries = Object.entries(data.submissions).sort((a, b) => {
      const dateA = new Date(a[0].replace(/(\d+)-(\d+)-(\d+)/, '$2/$1/$3')).getTime();
      const dateB = new Date(b[0].replace(/(\d+)-(\d+)-(\d+)/, '$2/$1/$3')).getTime();
      return dateB - dateA;
    });
    data.submissions = Object.fromEntries(sortedEntries);

    return data;
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return { submissions: {} };
  }
}

export async function fetchStudents(courseCode: string, task: string) {
  const originalTaskName = task.replaceAll(/~/g, " ");
  const token = await auth.currentUser?.getIdToken();

  // Explicitly type studentDetailsList as an array of StudentDetails
  const studentDetailsList: StudentDetails[] = await fetchStudentsDetails(
    token || "",
    courseCode
  );

  // Now TypeScript will recognize the types of zID, firstName, and lastName
  const students: StudentResult[] = await Promise.all(
    studentDetailsList.map(
      async ({ zID, firstName, lastName }: StudentDetails) => {

        let student: StudentResult = {
          id: zID,
          first_name: firstName,
          last_name: lastName,
          automark: -1,
          automark_timestamp: "N/A",
          automark_report: "N/A",
          style: -1,
          raw_automark: -1,
          grade: "",
          comments: "",
          mark_released: false,
          lastSubmitted: "N/A",
          submissions: await fetchStudentSubmissions(
            token || "",
            courseCode,
            originalTaskName,
            zID
          ),
        };

        try {
          const resultResponse: StudentResultResponse = await fetchStudentResult(
            token || "",
            courseCode,
            originalTaskName,
            zID
          );

          if (resultResponse.result !== "none") {
            const result = resultResponse.result;
            student.automark = result.automark;
            student.automark_timestamp = result.automark_timestamp;
            student.automark_report = result.automark_report;
            student.style = result.style;
            student.grade = (result.automark + result.style).toString();
            student.comments = result.comments;
            student.mark_released = result.mark_released;
            student.raw_automark = result.raw_automark;

            // Add late penalty information if it exists
            if ('lateDays' in result) {
              student.lateDays = result.lateDays;
              student.latePenaltyPercentage = result.latePenaltyPercentage;
              student.latePolicy = result.latePolicy;
            }
          }
        } catch (error) {
          console.error("Error fetching student result:", error);
        }

        return student;
      }
    )
  );

  return students;
}