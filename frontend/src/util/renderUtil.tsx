import { Box, Divider, Typography } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { StudentResult } from "../interfaces";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export function renderSubmissionDetails(submissionsJson: any) {
  if (submissionsJson) {
    const submissionTimes = Object.keys(submissionsJson["submissions"]);
    if (submissionTimes.length > 0) {
      const lastSubmissionTime = submissionTimes[0];
      const fileList = submissionsJson["submissions"][lastSubmissionTime].map(
        (filePath: string, index: number) => (
          <Box key={index} display="flex" alignItems="center" sx={{ mt: 0.5 }}>
            <CheckCircleIcon
              fontSize="small"
              sx={{ color: "#4caf50", mr: 1 }}
            />
            <Typography variant="body2" sx={{ color: "#333" }}>
              {filePath.split("/").pop() || "backend-error"}
            </Typography>
          </Box>
        )
      );

      return (
          <Box sx={{ padding: "8px 0" }}>
            {/* Last Submission Time */}
            <Typography
              variant="body2"
              sx={{
                display: "flex",
                alignItems: "center",
                fontWeight: 500,
                color: "#555",
                mb: 1,
              }}
            >
              <AccessTimeIcon fontSize="small" sx={{ color: "#555", mr: 1 }} />
              Last submission:{" "}
              <span style={{ fontStyle: "italic", marginLeft: "4px" }}>
                {lastSubmissionTime}
              </span>
            </Typography>

            {/* Files List */}
            <Box mt={1}>{fileList}</Box>
          </Box>
      );
    } else {
      return (
        <Box
          sx={{
            backgroundColor: "#fff",
            padding: "8px",
            borderRadius: "8px",
          }}
        >
          <Box sx={{ padding: "8px 0" }}>
            <Typography
              variant="body2"
              sx={{
                display: "flex",
                alignItems: "center",
                fontWeight: 500,
                color: "#f44336",
                mb: 1,
              }}
            >
              <AccessTimeIcon
                fontSize="small"
                sx={{ color: "#f44336", mr: 1 }}
              />
              Last submission:{" "}
              <span style={{ fontStyle: "italic", marginLeft: "4px" }}>
                No submissions yet
              </span>
            </Typography>
          </Box>
        </Box>
      );
    }
  } else {
    return (
      <Box
        sx={{
          backgroundColor: "#fff",
          padding: "8px",
          borderRadius: "8px",
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight="500"
          sx={{
            color: "#333",
            backgroundColor: "#e0ecff",
            padding: "8px",
            borderRadius: "8px 8px 0 0",
          }}
        >
          Submitted Files
        </Typography>

        <Box sx={{ padding: "8px 0" }}>
          <Typography
            variant="body2"
            sx={{
              display: "flex",
              alignItems: "center",
              fontWeight: 500,
              color: "#f44336",
            }}
          >
            <AccessTimeIcon fontSize="small" sx={{ color: "#f44336", mr: 1 }} />
            Last submission:{" "}
            <span style={{ fontStyle: "italic", marginLeft: "4px" }}>
              Unable to load submissions
            </span>
          </Typography>
        </Box>
      </Box>
    );
  }
}

export function renderAutotestResults(autotestResults: any[]) {
  if (!autotestResults || autotestResults.length === 0) {
    return <Typography>No autotest results available.</Typography>;
  }

  return (
    <Box>
      {autotestResults.map((result, index) => (
        <Box
          key={index}
          sx={{
            backgroundColor: result.passed ? "#dff0d8" : "#f2dede",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "8px",
            borderLeft: result.passed
              ? "6px solid #4CAF50"
              : "6px solid #F44336",
          }}
        >
          <Typography variant="body1" gutterBottom>
            <strong>{result.test_name}: </strong>{" "}
            {result.passed ? "Passed" : "Failed"}
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {result.output}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export function renderLateSubmissionDetails(student: StudentResult) {
  if (!student.latePolicy) return null;

  return (
    <Box
      sx={{
        backgroundColor: "#f0f0f0",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.1)",
        mb: 2,
      }}
    >
      <Typography 
        variant="subtitle2" 
        sx={{ 
          fontWeight: 600, 
          color: "#d32f2f",
          display: 'flex',
          alignItems: 'center',
          mb: 1
        }}
      >
        <WarningIcon sx={{ mr: 1, fontSize: "1.2rem" }}/>
        Late Submission Policy
      </Typography>

      <Divider sx={{ my: 1 }} />

      {/* Policy Details */}
      <Box sx={{ ml: 2 }}>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          • {student.latePolicy.percentDeductionPerDay}% deduction per{" "}
          {student.latePolicy.lateDayType.toLowerCase()} day
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          • Maximum {student.latePolicy.maxLateDays} late days allowed
        </Typography>
      </Box>

      {/* Late Submission Status */}
      {student.lateDays ? (
        <>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ ml: 2, mt: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500,
                color: "#d32f2f"
              }}
            >
              Current Status:
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              • Submitted {student.lateDays} {student.latePolicy.lateDayType.toLowerCase()} days late
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              • Penalty applied: {student.latePenaltyPercentage}%
            </Typography>
            {student.grade !== null && (
              <Box 
                sx={{ 
                  mt: 1,
                  p: 1,
                  backgroundColor: "rgba(211, 47, 47, 0.1)",
                  borderRadius: 1,
                  border: "1px solid rgba(211, 47, 47, 0.3)"
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Original grade: {student.grade}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Adjusted grade: {Math.round(Number(student.grade) * (1 - student.latePenaltyPercentage!/100))}
                </Typography>
              </Box>
            )}
          </Box>
        </>
      ) : (
        <Typography 
          variant="body2" 
          sx={{ 
            ml: 2,
            mt: 1,
            color: "#2e7d32",
            fontWeight: 500
          }}
        >
          ✓ Submitted on time
        </Typography>
      )}
    </Box>
  );
}

export function renderSpecialConsideration(student: StudentResult) {
  if (!student.specialConsideration) return null;

  return (
    <Box
      sx={{
        backgroundColor: "#e3f2fd",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.1)",
        mb: 2,
        border: "1px solid #90caf9"
      }}
    >
      <Typography 
        variant="subtitle2"
        sx={{ 
          fontWeight: 600, 
          color: "#1976d2",
          mb: 1
        }}
      >
        Special Consideration Applied
      </Typography>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ ml: 2 }}>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          • Extension granted: {student.specialConsideration.extensionHours} hours
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          • Reason: {student.specialConsideration.reason}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: "0.875rem", 
            color: "#666",
            mt: 1,
            fontStyle: "italic"
          }}
        >
          Approved by: {student.specialConsideration.approvedBy}
        </Typography>
      </Box>
    </Box>
  );
}