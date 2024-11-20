import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { CourseSettingsProps } from "../../../interfaces/course.interface"
import { auth } from "../../../util/firebase_util";
import { useParams } from "react-router-dom";
import "../../../components/Animation/AlertStyles.css";
import "../../../components/Animation/SuccessAlert.css";
import InfoIcon from "@mui/icons-material/Info";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const CustomAlert = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  display: "flex",
  alignItems: "center",
  position: "relative",
}));

export function CourseSettingsModal({
  settingsOpen,
  setSettingsOpen,
  method,
}: CourseSettingsProps) {
  const { courseCode } = useParams();

  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    clearInputs();
  }, [settingsOpen]);

  // Remove the useEffects that handle timeouts since we'll let the CSS animation handle it
  const clearInputs = () => {
    setInput("");
    setFile(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  function changeFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) {
      setFile(null);
      return;
    }
    const fileName = e.target.files[0].name.toLowerCase();
    if (!fileName.endsWith(".csv")) {
      setError("Please upload a CSV file");
      setFile(null);
      return;
    }
    setFile(e.target.files[0]);
    setError("");
  }

  // In handleModify function, update the fetch URL:
  const handleModify = async (adding: string) => {
    if (!input.trim() && !file) {
      setError("Please enter zIDs or upload a file");
      return;
    }

    const formData = new FormData();
    formData.append("adding", adding);
    formData.append("students", input.trim() || "");
    if (file) {
      formData.append("file", file);
    }
    formData.append("course_code", courseCode || "");
    const tutor = method === "tutor" ? "true" : "false";
    formData.append("tutor", tutor);

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/course/modify_user_level`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      const data = await response.json();

      // Reset existing messages
      setWarningMessage("");
      setSuccessMessage("");

      const entityType = method === "student" ? "Student" : "Tutor";

      if (data.status === "success") {
        const { processed, already_in_course, not_found, not_in_course } =
          data.data;

        // Case 1: Handle users not in course (for removal)
        if (adding === "false" && not_in_course && not_in_course.length > 0) {
          const users = not_in_course.join(", ");
          // Simplified message
          const msg = `${users} is not in the course.`;
          setWarningMessage(msg);
          return;
        }

        // Case 2: Successfully processed (added or removed)
        if (processed && processed.length > 0) {
          var msg = `${entityType} successfully ${data.action} from the course!`;
          if (adding === "true") {
            msg = `${entityType} successfully ${data.action} to the course!`;
          }
          setSuccessMessage(msg);
          clearInputs();
          return;
        }

        // Case 3: Already in course (for adding)
        if (already_in_course && already_in_course.length > 0) {
          const msg = `${already_in_course.join(", ")} already in course.`;
          setWarningMessage(msg);
          return;
        }

        // Case 4: Not found
        if (not_found && not_found.length > 0) {
          const msg = `${not_found.join(", ")} not found.`;
          setWarningMessage(msg);
          return;
        }
      } else {
        setWarningMessage(data.message || "An error occurred");
      }
    } catch (error) {
      console.error("Error:", error);
      setWarningMessage("An error occurred. Please try again.");
    }
  };

  const handleClose = () => {
    setSettingsOpen(false);
    clearInputs();
  };

  // Add animation end handlers
  const handleAnimationEnd = (event: React.AnimationEvent<HTMLDivElement>) => {
    if (event.animationName === "loading") {
      // Add a small delay before clearing the message
      setTimeout(() => {
        if (warningMessage) setWarningMessage("");
        if (successMessage) setSuccessMessage("");
      }, 100);
    }
  };

  return (
    <Dialog open={settingsOpen} onClose={handleClose}>
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
        Add and Remove {method === "student" ? "Students" : "Tutors"}
        <IconButton sx={{ marginBottom: "5px" }} onClick={handleClose} id="close-course-settings-modal-button">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {warningMessage && (
          <CustomAlert className="custom-alert">
            <IconButton
              size="small"
              onClick={() => setWarningMessage("")}
              sx={{ position: "absolute", right: 8, top: 8 }}
            >
              <CloseIcon className="close-icon" />
            </IconButton>
            <InfoIcon className="info-icon" />
            <Typography variant="body2">
              <strong style={{ fontWeight: 600 }}>Hold up!</strong>{" "}
              {warningMessage}
            </Typography>
            <div
              className="loading-bar"
              onAnimationEnd={handleAnimationEnd}
            ></div>
          </CustomAlert>
        )}
        {successMessage && (
          <CustomAlert className="success-alert">
            <IconButton
              size="small"
              onClick={() => setSuccessMessage("")}
              sx={{ position: "absolute", right: 8, top: 8 }}
            >
              <CloseIcon className="close-icon" />
            </IconButton>
            <CheckCircleIcon className="check-icon" />
            <Typography variant="body2">
              <strong style={{ fontWeight: 600 }}>Successful!</strong>{" "}
              {successMessage}
            </Typography>
            <div
              className="loading-bar"
              onAnimationEnd={handleAnimationEnd}
            ></div>
          </CustomAlert>
        )}
        <DialogContentText sx={{ marginBottom: "10px", marginTop: "10px" }}>
          Add/remove {method === "student" ? "students" : "tutors"} via zID
          (comma separated) or file upload.
        </DialogContentText>
        <Box display="flex" flexDirection="column">
          <Box display="flex" flexDirection="row" alignItems="center" mb={2}>
            <TextField
              autoFocus
              margin="dense"
              label="zID"
              variant="outlined"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError("");
                setWarningMessage("");
                setSuccessMessage("");
              }}
              error={!!error}
              helperText={error}
              sx={{ marginRight: "10px", flexGrow: 1 }}
            />
            <Typography sx={{ fontWeight: 100, mx: 2 }}>or</Typography>
            <Button
              component="label"
              variant="contained"
              startIcon={<CloudUploadIcon />}
              sx={{ height: "56px" }}
            >
              Upload file
              <VisuallyHiddenInput
                type="file"
                accept=".csv"
                onChange={(event) => changeFile(event)}
                ref={fileInputRef}
              />
            </Button>
          </Box>
          {file && (
            <Box display="flex" alignItems="center" sx={{ marginTop: 1 }}>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ flex: 1 }}
              >
                File selected: {file.name}
              </Typography>
              <IconButton
                size="small"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                sx={{
                  padding: "4px",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => handleModify("true")}
          sx={{ fontWeight: 600, color: "#1a73e8" }}
        >
          Add
        </Button>
        <Button
          onClick={() => handleModify("false")}
          sx={{ fontWeight: 600, color: "red" }}
        >
          Remove
        </Button>
      </DialogActions>
    </Dialog>
  );
}
