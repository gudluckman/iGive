import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Box,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CircularProgress from "@mui/material/CircularProgress";
import AnimatedCheckmark from "../../Animation/AnimatedCheckmark";
import AnimatedCross from "../../Animation/AnimatedCross";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  submissions: {
    submissions: Record<string, string[]>;
  };
}

interface AutomarkModalProps {
  open: boolean;
  onClose: () => void;
  students: Student[];
  courseCode: string;
  task: string;
  onComplete: () => void;
  auth: {
    currentUser: {
      getIdToken: () => Promise<string>;
    } | null;
  };
}

const BatchAutomarkModal = ({
  open,
  onClose,
  students,
  courseCode,
  task,
  onComplete,
  auth,
}: AutomarkModalProps) => {
  const eligibleStudents = students.filter(
    (student) => Object.keys(student.submissions["submissions"]).length > 0
  );

  const [runningStatus, setRunningStatus] = useState<boolean[]>(
    new Array(eligibleStudents.length).fill(false)
  );
  const [completedStatus, setCompletedStatus] = useState<boolean[]>(
    new Array(eligibleStudents.length).fill(false)
  );
  const [errorStatus, setErrorStatus] = useState<boolean[]>(
    new Array(eligibleStudents.length).fill(false)
  );
  const [isRunning, setIsRunning] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (open) {
      const initialArray = new Array(eligibleStudents.length).fill(false);
      setRunningStatus(initialArray);
      setCompletedStatus(initialArray);
      setErrorStatus(initialArray);
      setCompletedCount(0);
    }
  }, [open, eligibleStudents.length]);


  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const handleClose = () => {
    if (!isRunning) {
      onClose();
    }
  };

  const runAutomark = async (studentIndex: number, student: Student) => {
    try {
      const payload = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
        },
        body: JSON.stringify({
          zid: student.id,
          course_code: courseCode,
          task: task ? task.replace(/~/g, " ") : "Error",
          timestamp: Object.keys(student.submissions["submissions"])[0],
        }),
      };

      // Add response handling
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/testing/run_automark`, payload);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to run automark: ${errorData}`);
      }

      const data = await response.json();
      if (!data.automark_results) {
        throw new Error('Invalid response format');
      }

      // Shorter delay
      await sleep(200);

      setCompletedStatus((prev) => {
        const newStatus = [...prev];
        newStatus[studentIndex] = true;
        return newStatus;
      });
      setErrorStatus((prev) => {
        const newStatus = [...prev];
        newStatus[studentIndex] = false;
        return newStatus;
      });
      setCompletedCount((prev) => prev + 1);
    } catch (error) {
      console.error(`Error running automark for student ${student.id}:`, error);
      // might want to set an error state here to show in the UI
      setCompletedStatus((prev) => {
        const newStatus = [...prev];
        newStatus[studentIndex] = true;
        return newStatus;
      });
      setErrorStatus((prev) => {
        const newStatus = [...prev];
        newStatus[studentIndex] = true;
        return newStatus;
      });
      setCompletedCount((prev) => prev + 1);
    } finally {
      setRunningStatus((prev) => {
        const newStatus = [...prev];
        newStatus[studentIndex] = false;
        return newStatus;
      });
    }
  };

  const handleRunAll = async () => {
    setIsRunning(true);

    // Set all students to running state immediately
    setRunningStatus(new Array(eligibleStudents.length).fill(true));
    setCompletedStatus(new Array(eligibleStudents.length).fill(false));
    setErrorStatus(new Array(eligibleStudents.length).fill(false));
    setCompletedCount(0);

    try {
      // Run all automarks in parallel using Promise.all
      await Promise.all(
        eligibleStudents.map((student, index) => runAutomark(index, student))
      );
    } finally {
      setIsRunning(false);
      onComplete();
    }
  };

  useEffect(() => {
    if (open && eligibleStudents.length > 0) {
      handleRunAll();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          bgcolor: "#fff",
          borderRadius: "8px",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "#f5f5f7",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Typography variant="h6" component="div">
          Running Automarker{" "}
          {isRunning
            ? `(${completedCount}/${eligibleStudents.length})`
            : "- Complete!"}
        </Typography>
        <IconButton
          onClick={() => !isRunning && onClose()}
          disabled={isRunning}
          size="small"
          sx={{ color: "#2c3e50" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ maxHeight: "60vh", overflow: "auto" }}>
          {eligibleStudents.map((student, index) => (
            <Box
              key={student.id}
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #e0e0e0",
                "&:last-child": {
                  borderBottom: "none",
                },
              }}
            >
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 500,
                    color: "#2c3e50",
                  }}
                >
                  {student.first_name} {student.last_name} ({student.id})
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  ml: 2,
                  width: 24,
                  height: 24,
                  justifyContent: "center",
                }}
              >
                {runningStatus[index] && (
                  <CircularProgress size={24} sx={{ color: "#2196f3" }} />
                )}
                {completedStatus[index] && !runningStatus[index] && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "24px",
                      height: "24px",
                      opacity: 0,
                      animation: "fadeIn 0.5s ease-in forwards",
                      animationFillMode: "forwards",
                      "@keyframes fadeIn": {
                        "0%": { opacity: 0 },
                        "100%": { opacity: 1 },
                      },
                    }}
                  >
                    {errorStatus[index] ? <AnimatedCross /> : <AnimatedCheckmark />}
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          bgcolor: "#f5f5f7",
          position: "relative",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Button
          onClick={handleClose}
          disabled={isRunning}
          variant="contained"
          sx={{
            bgcolor: "#2c3e50",
            "&:hover": {
              bgcolor: "#1c2833",
            },
            textTransform: "none",
            px: 4,
          }}
        >
          {isRunning ? "Running..." : "Close"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchAutomarkModal;
