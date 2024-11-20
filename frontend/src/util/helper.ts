import { IconButton, styled } from "@mui/material";

// Split course into term and course for admin/tutor/student view
export const splitCourseCode = (courseCode: string) => {
  const term = courseCode.slice(0, 4); // e.g., "24T3"
  const course = courseCode.slice(4); // e.g., "COMP1511"
  return { term, course };
};

export const parseCourseDetails = (courseString: string) => {
  const match = courseString.match(/(\d{2}T\d+)(COMP\d{4})(?:\s*-\s*(.+))?/i);
  if (match) {
    return {
      term: match[1],
      courseCode: match[2],
      assignmentName: match[3] || "",
    };
  }
  return { term: "", courseCode: courseString, assignmentName: "" };
};

export const formatDate = (dateString: any) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Spinning icon button
export const SpinningIconButton = styled(IconButton)`
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  &.spinning {
    animation: spin 0.5s ease;
  }
`;

export function calculateTestResults(report: string | null) {
  if (!report || report === "N/A") {
    return { passed: 0, failed: 0 };
  }

  try {
    const parsedReport = JSON.parse(report);
    const passed = parsedReport.filter((test: any) => test.passed).length;
    const failed = parsedReport.length - passed;
    return { passed, failed };
  } catch (error) {
    console.error("Failed to parse automark report JSON:", error);
    return { passed: 0, failed: 0 };
  }
}