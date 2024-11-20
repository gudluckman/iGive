import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  Box,
  IconButton,
  DialogContentText,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { ModifyMarksModalProps, StudentResult } from "../../interfaces";
import { successNotifier } from "../Notifier/ActionNotifier";

export const ModifyMarksModal: React.FC<ModifyMarksModalProps> = ({
  open,
  onClose,
  student,
  onUpdate,
}) => {
  const [grade, setGrade] = useState<string>(student.grade);
  const [automark, setAutomark] = useState(student.raw_automark || 0);
  const [style, setStyle] = useState(student.style);
  const [comments, setComments] = useState<string>(student.comments);
  const isMobile = useMediaQuery("(max-width:600px)");
  
  useEffect(() => {
    if (student) {
      setGrade(student.grade);
      setAutomark(student.raw_automark || 0);
      setStyle(student.style);
      setComments(student.comments);
    }
  }, [student]);

  const handleUpdate = () => {
    const updatedStudent: StudentResult = {
      ...student,
      grade: grade || "N/A",
      raw_automark: automark || 0,
      style: style || 0,
      comments: comments || "No comments",
    };

    onUpdate(updatedStudent);
    successNotifier("Sucessfully updated marks and comments")
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: "80vw", maxWidth: "700px", height: "auto" },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "grey.100",
          borderBottom: "1px solid",
          borderColor: "grey.300",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: 600,
          fontSize: isMobile ? "1rem" : "1.25rem",
          padding: "16px",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", }}>
          <AutoFixHighIcon sx={{ marginRight: "8px" }} />
          Modify Marks for {student.id}
        </span>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ padding: "16px" }}>
        <DialogContentText sx={{ marginBottom: "16px", marginTop: "16px" }}>
          Enter the marks and comments for the student's submission.
        </DialogContentText>

        <TextField
          margin="dense"
          fullWidth
          label="Automark"
          value={automark}
          onChange={(e) => {
            const value = Number.parseInt(e.target.value);
            if (!isNaN(value)) {
              setAutomark(value);
              setGrade((value + style).toString());
            } else if (e.target.value === "") {
              setAutomark(0);
              setGrade((0 + style).toString());
            }
          }}
          InputLabelProps={{ style: { fontSize: "1rem" } }}
          inputProps={{ style: { fontSize: "1rem" } }}
          sx={{ mb: "10px" }}
        />

        <TextField
          margin="dense"
          fullWidth
          label="Style"
          value={style}
          onChange={(e) => {
            const value = Number.parseInt(e.target.value);
            if (!isNaN(value)) {
              setStyle(value);
              setGrade((value + automark).toString());
            } else if (e.target.value === "") {
              setStyle(0);
              setGrade((0 + automark).toString());
            }
          }}
          InputLabelProps={{ style: { fontSize: "1rem" } }}
          inputProps={{ style: { fontSize: "1rem" } }}
          sx={{ mb: "10px" }}
        />

        <TextField
          margin="dense"
          fullWidth
          label="Comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          InputLabelProps={{ style: { fontSize: "1rem" } }}
          inputProps={{ style: { fontSize: "1rem" } }}
          sx={{ mb: "10px" }}
        />

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="flex-end" gap="10px">
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUpdate}>
            Update
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
