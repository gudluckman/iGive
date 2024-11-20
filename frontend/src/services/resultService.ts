import { alertNotifier } from "../components/Notifier/ActionNotifier";
import { StudentResult } from '../interfaces/user.interface';

interface GradeCalculationResult {
  rawMark: number;
  finalMark: number;
  deduction: number;
  penaltyPercentage: number;
}

export function calculateGrade(result: StudentResult): GradeCalculationResult {
  const rawMark = result.automark + result.style;
  
  // If there's no late penalty or special consideration, return raw mark
  if (!result.lateDays || !result.latePenaltyPercentage) {
    return {
      rawMark,
      finalMark: rawMark,
      deduction: 0,
      penaltyPercentage: 0
    };
  }

  // Calculate penalty
  const penaltyPercentage = Math.min(result.latePenaltyPercentage, 100);
  const deduction = (rawMark * penaltyPercentage) / 100;
  const finalMark = Math.max(0, rawMark - deduction);

  return {
    rawMark,
    finalMark,
    deduction,
    penaltyPercentage
  };
}

export async function fetchStudentResult(
  token: string,
  courseCode: string,
  task: string,
  id: string
): Promise<{ result: StudentResult }> {
  const params = new URLSearchParams();
  params.append("course_code", courseCode);
  params.append("task", task);
  params.append("student", id);

  try {
    const response = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/task/query_result?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    alertNotifier(`Error fetching result: ${error}`);
    throw error;
  }
}

export async function updateMarkReleaseStatus(
  token: string,
  courseCode: string,
  task: string,
  id: string,
  release: boolean
): Promise<boolean> {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/task/update_mark_release`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          zid: id,
          course_code: courseCode,
          task,
          release,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return true;
  } catch (error) {
    alertNotifier(`Error updating mark release status: ${error}`);
    return false;
  }
}

