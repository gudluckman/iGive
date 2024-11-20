import React, { useState } from "react";
import { Box, Typography, Tooltip, Button } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import InfoIcon from "@mui/icons-material/Info";
import { StudentResult } from "../../interfaces/user.interface";

interface GradeDisplayProps {
  student: StudentResult;
  maxTaskMark: number;
  userLevel: string;
}

export function GradeDisplay({
  student,
  maxTaskMark,
  userLevel,
}: GradeDisplayProps) {
  const [showModal, setShowModal] = useState(false);

  // Calculate grades similar to StudentCourseView
  const calculateGrades = (student: StudentResult) => {
    if (student.raw_automark === null && student.style === null) {
      return {
        rawGrade: null,
        finalGrade: null,
      };
    }

    // Match StudentCourseView's handling - use automark as raw mark if no raw_automark exists
    const rawAutomark = student.raw_automark ?? 0; // Use automark (66) as raw mark
    const styleMark = student.style ?? 0;

    // Raw grade combines automark and style
    const rawGrade = rawAutomark + styleMark;

    // Apply late penalty if exists
    if (student.latePenaltyPercentage) {
      // Calculate deduction on the raw mark
      // const deduction = rawAutomark * (student.latePenaltyPercentage / 100);

      // Calculate final grade: (raw_automark - penalty) + style
      const finalGrade = rawGrade * (1 - student.latePenaltyPercentage / 100);

      return {
        rawGrade,
        finalGrade: parseFloat(finalGrade.toFixed(1)),
      };
    }

    return {
      rawGrade,
      finalGrade: rawGrade,
    };
  };

  // Get the grades using the same calculation
  // const rawGrade = student.raw_automark;
  // const finalGrade = Number(student.automark + student.style);
  const { rawGrade, finalGrade } = calculateGrades(student);

  const lateDays = student.lateDays || 0;
  const isLateSubmission = lateDays > 0;
  const penaltyPercentage = student.latePenaltyPercentage || 0;
  const penaltyAmount = isLateSubmission ? rawGrade! - finalGrade! : 0;

  const showDetails = userLevel !== "student" || student.mark_released;
  const hasSpecialConsideration = Boolean(student.specialConsideration);

  if (!showDetails) {
    return (
      <Typography variant="body1" fontWeight={400}>
        {student.mark_released
          ? finalGrade !== null
            ? `${finalGrade?.toFixed(1)} / ${maxTaskMark}`
            : `N/A / ${maxTaskMark}`
          : "Pending"}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography
        variant="h6"
        fontWeight={400}
        sx={{
          fontSize: {
            xs: "1rem",
            sm: "1.25rem",
            md: "1.5rem",
          },
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {/* jank. essentially makes sure that students who have automark erased
          as well as students who never submitted all display N/A. Reason: submission + erased is treated differently
          in the database vs students who never submitted, and erase doesn't affect those people so you end up with -1
          and "" as different default values. */}
        {/* {!student.automark ? "N/A" : (finalGrade === -2 ? "N/A" : `${finalGrade?.toFixed(1)} / ${maxTaskMark}`)} */}
        {finalGrade === -2
          ? `N/A / ${maxTaskMark}`
          : `${finalGrade?.toFixed(1)} / ${maxTaskMark}`}
      </Typography>

      {isLateSubmission && (
        <Tooltip
          title={`${lateDays} ${
            lateDays === 1 ? "day" : "days"
          } late (-${penaltyPercentage}%)`}
        >
          <AccessTimeIcon
            id={"late-icon-" + student.id}
            color="error"
            sx={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              setShowModal(true);
            }}
          />
        </Tooltip>
      )}

      {hasSpecialConsideration && (
        <Tooltip
          title={`${student.specialConsideration?.extensionHours} hours extension granted`}
        >
          <InfoIcon color="info" />
        </Tooltip>
      )}

      {/* Modal */}
      {showModal && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1300,
          }}
          onClick={() => setShowModal(false)}
        >
          <Box
            sx={{
              backgroundColor: "white",
              borderRadius: 1,
              p: 3,
              maxWidth: 400,
              width: "90%",
              m: 2,
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="h6" gutterBottom>
              Grade Details
            </Typography>

            {/* Raw Mark */}
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Typography color="text.secondary">Raw Mark:</Typography>
              <Typography fontWeight={500}>
                {rawGrade !== null ? rawGrade.toFixed(1) : "N/A"}
              </Typography>
            </Box>

            {/* Late Penalty */}
            {isLateSubmission && (
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "error.main",
                  }}
                >
                  <Typography>Late Penalty:</Typography>
                  <Typography fontWeight={500}>
                    -{penaltyAmount.toFixed(1)}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    mt: 1,
                    p: 1,
                    bgcolor: hasSpecialConsideration
                      ? "info.soft"
                      : "warning.soft",
                    borderRadius: 1,
                    fontSize: "0.875rem",
                  }}
                >
                  <Typography variant="body2">
                    {`${penaltyAmount.toFixed(
                      1
                    )} marks deducted (${penaltyPercentage}% penalty for being ${lateDays} ${
                      lateDays === 1 ? "day" : "days"
                    } late)`}
                    {hasSpecialConsideration && (
                      <Box component="span" sx={{ display: "block", mt: 0.5 }}>
                        {student.specialConsideration?.extensionHours} hours
                        extension granted
                      </Box>
                    )}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Final Mark */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                pt: 2,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography fontWeight={400}>Final Mark:</Typography>
              <Typography fontWeight={400}>
                {finalGrade !== null ? finalGrade.toFixed(1) : "N/A"}
              </Typography>
            </Box>

            <Button
              variant="outlined"
              onClick={() => setShowModal(false)}
              fullWidth
              sx={{
                mt: 3,
                textTransform: "none",
                color: "text.secondary",
                borderColor: "divider",
              }}
            >
              Close
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
