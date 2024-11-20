import React, { useState, useMemo, useEffect } from "react";
import CloseIcon from "@mui/icons-material/Close";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import PeopleIcon from "@mui/icons-material/People";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TableCell,
  Typography,
  TableBody,
  TableContainer,
  TableRow,
  Paper,
  Table,
  Box,
} from "@mui/material";

interface Student {
  id: string;
  submissions: {
    submissions: Record<string, any>;
  };
  grade?: number;
}

interface SubmissionRateChartProps {
  courseCode: string;
  task: string;
  students: Student[];
  open: boolean;
  onClose: () => void;
}

const SubmissionRateChart: React.FC<SubmissionRateChartProps> = ({
  courseCode,
  task,
  students,
  open,
  onClose,
}) => {
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (open) {
      const duration = 1000;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setAnimationProgress(progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [open]);

  const chartData = useMemo(() => {
    if (!students?.length) return [];

    const submittedCount = students.filter(
      (student) =>
        student.submissions &&
        Object.keys(student.submissions.submissions || {}).length > 0
    ).length;

    const notSubmittedCount = students.length - submittedCount;

    return [
      {
        label: `Submitted: ${submittedCount}`,
        value: submittedCount,
        color: "#ccdafc",
        percentage: Math.round((submittedCount / students.length) * 100),
      },
      {
        label: `Not Submitted: ${notSubmittedCount}`,
        value: notSubmittedCount,
        color: "#e2e8f0",
        percentage: Math.round((notSubmittedCount / students.length) * 100),
      },
    ];
  }, [students]);

  if (!chartData.length || chartData[0]?.percentage === 0) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
        <DialogTitle
          sx={{
            backgroundColor: "grey.100",
            borderBottom: "1px solid grey.300",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 600,
            fontSize: "1.25rem",
            padding: "12px 16px",
          }}
        >
          Submission Rate - {task?.replace("~", " ")}
          <IconButton onClick={onClose} sx={{ padding: "4px" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            sx={{ textAlign: "center", padding: "24px 16px" }}
          >
            <ReportProblemIcon
              sx={{
                fontSize: "2.5rem",
                color: "#ff9800",
                marginBottom: "16px",
              }}
            />
            <Typography
              variant="body1"
              color="textSecondary"
              sx={{ marginBottom: "12px" }}
            >
              No submissions recorded yet
            </Typography>
            <Box
              display="flex"
              alignItems="center"
              sx={{
                padding: "8px",
                backgroundColor: "#f7f7f7",
                borderRadius: "8px",
                marginTop: "12px",
              }}
            >
              <PeopleIcon sx={{ marginRight: "6px", color: "#607d8b" }} />
              <Typography variant="body2" color="textSecondary">
                Total enrolled students: {students.length}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  const displayPercentage = Math.round(
    (hoveredSlice !== null
      ? chartData[hoveredSlice].percentage
      : chartData[0].percentage) * animationProgress
  );

  const getPath = (startAngle: number, percentage: number) => {
    const animatedPercentage = percentage * animationProgress;
    const angle = (animatedPercentage * 360) / 100;
    const endAngle = startAngle + angle;
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    const radius = 60;
    const centerX = 80;
    const centerY = 80;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${
      angle > 180 ? 1 : 0
    } 1 ${x2} ${y2} Z`;
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle
        sx={{
          backgroundColor: "grey.100",
          borderBottom: "1px solid grey.300",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: 600,
          fontSize: "1.25rem",
          height: "30px",
        }}
      >
        Submission Rate - {task?.replaceAll("~", " ")}
        <IconButton onClick={onClose} sx={{ marginBottom: "5px" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2, overflowX: "hidden" }}>
        <div className="flex items-center justify-center gap-3">
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 160 160">
              {chartData.reduce((acc, slice, index) => {
                const previousTotal = chartData
                  .slice(0, index)
                  .reduce((sum, item) => sum + item.value, 0);
                const startAngle =
                  (previousTotal /
                    chartData.reduce((sum, item) => sum + item.value, 0)) *
                  360;

                return [
                  ...acc,
                  <path
                    key={slice.label}
                    d={getPath(
                      startAngle,
                      (slice.value /
                        chartData.reduce((sum, item) => sum + item.value, 0)) *
                        100
                    )}
                    fill={slice.color}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredSlice(index)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    style={{
                      filter:
                        hoveredSlice === index
                          ? "drop-shadow(0 0 4px rgba(0,0,0,0.15))"
                          : "none",
                      opacity:
                        hoveredSlice === null || hoveredSlice === index
                          ? 1
                          : 0.7,
                    }}
                  />,
                ];
              }, [] as JSX.Element[])}

              <circle cx="80" cy="80" r="40" fill="white" />
              <text
                x="80"
                y="75"
                textAnchor="middle"
                fontSize="24"
                className="font-semibold"
                fill="#1f2937"
              >
                {displayPercentage}%
              </text>
              <text
                x="80"
                y="95"
                textAnchor="middle"
                fontSize="12"
                fill="#6b7280"
              >
                {hoveredSlice !== null
                  ? hoveredSlice === 0
                    ? "Submitted"
                    : "Not Submitted"
                  : "Submitted"}
              </text>
            </svg>
          </div>
        </div>

        {/* Always show total enrolled students */}
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          sx={{ textAlign: "center" }}
        >
          <Box
            display="flex"
            alignItems="center"
            sx={{
              padding: "8px",
              backgroundColor: "#f7f7f7",
              borderRadius: "8px",
              marginTop: "12px",
            }}
          >
            <PeopleIcon sx={{ marginRight: "6px", color: "#607d8b" }} />
            <Typography variant="body2" color="textSecondary">
              Total enrolled students: {students.length}
            </Typography>
          </Box>
        </Box>

        {/* Submission Details Table */}
        <TableContainer
          component={Paper}
          sx={{
            mt: 2,
            borderRadius: 1,
            backgroundColor: "grey.100",
            border: "1px solid",
            borderColor: "grey.300",
            boxShadow: 0.5,
            maxWidth: "100%",
            overflowX: "hidden",
            overflowY: "hidden",
          }}
        >
          <Table size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
            <TableBody>
              {chartData.map((item, index) => (
                <TableRow
                  key={item.label}
                  sx={{ borderBottom: "1px solid", borderColor: "grey.300" }}
                >
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: "grey.200",
                      maxWidth: "40%",
                      whiteSpace: "nowrap",
                      padding: "8px 12px",
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {index === 0 ? (
                        <>
                          <CheckCircleIcon
                            sx={{ color: "green", fontSize: "1.2rem" }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "bold" }}
                          >
                            Submitted
                          </Typography>
                        </>
                      ) : (
                        <>
                          <CancelIcon
                            sx={{ color: "red", fontSize: "1.2rem" }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "bold" }}
                          >
                            Not Submitted
                          </Typography>
                        </>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "grey.50",
                      whiteSpace: "nowrap",
                      textAlign: "right",
                      padding: "8px 12px",
                    }}
                  >
                    <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                      {item.value} student{item.value !== 1 ? "s" : ""}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
};

export default SubmissionRateChart;
