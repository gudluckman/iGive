import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { TaskModalProps } from "../../../interfaces/modal.interface";
import { useEffect, useState } from "react";

export function TaskSettingsModal({
  editing,
  open,
  handleClose,
  handleAddNewTask,
  newTaskName,
  newTaskDeadline,
  newTaskMaxAutomark,
  newTaskMaxStyle,
  newTaskRequiredFiles,
  newTaskAllowedFileTypes,
  newTaskMaxFileSize,
  percentDeductionPerDay,
  lateDayType,
  maxLateDays,
  setNewTaskName,
  setNewTaskDeadline,
  setNewTaskMaxAutomark,
  setNewTaskMaxStyle,
  setNewTaskRequiredFiles,
  setNewTaskAllowedFileTypes,
  setNewTaskMaxFileSize,
  setPercentDeductionPerDay,
  setLateDayType,
  setMaxLateDays,
  tasks,
  taskSpecURL,
  setTaskSpecURL,
}: TaskModalProps) {
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (!editing) {
      if (!newTaskName) {
        setNameError("");
        return;
      }

      // Check for duplicate name (case-insensitive)
      const existingTask = tasks?.find(
        (task) =>
          task.name.toLowerCase() ===
          newTaskName.toLowerCase().replaceAll(/~/g, " ")
      );
      if (existingTask) {
        setNameError(
          "A task with this name already exists. Please delete the existing task first or choose a different name."
        );
        return;
      }

      // Check for special characters
      const finding = /[.[\]*`~/\\]/;
      if (finding.test(newTaskName)) {
        setNameError(
          "Task name cannot contain special characters: . [ ] * ` ~ / \\"
        );
        return;
      }

      setNameError("");
    }
  }, [newTaskName, tasks, editing]);

  return (
    <Dialog open={open} onClose={handleClose}>
      {/* Modal for entering task details */}
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
        {!editing ? "Create New Task" : "General Task Settings"}
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          sx={{ marginBottom: "16px", marginTop: "16px", fontSize: "0.875rem" }}
        >
          {!editing
            ? "Please enter the details for the new assignment or lab, including the due date and file restrictions."
            : "Please enter the updated details for the assignment or lab and confirm to modify."
          }
        </DialogContentText>

        {/* Task Name */}
        {!editing && (
          <TextField
            autoFocus
            margin="dense"
            label="Task Name"
            fullWidth
            variant="outlined"
            value={newTaskName}
            onChange={(e) => setNewTaskName!(e.target.value)}
            sx={{ marginBottom: "10px" }}
          />
        )}

        {/* Side-by-side Max Automark and Max Style Mark */}
        <Box sx={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
          <TextField
            margin="dense"
            label="Maximum Automark"
            variant="outlined"
            value={newTaskMaxAutomark}
            onChange={(e) => {
              const value = e.target.value;
              setNewTaskMaxAutomark(value === "" ? 0 : Number.parseInt(value));
            }}
            sx={{ flex: 1 }}
          />
          <TextField
            margin="dense"
            label="Maximum Style Mark"
            variant="outlined"
            value={newTaskMaxStyle}
            onChange={(e) => {
              const value = e.target.value;
              setNewTaskMaxStyle(value === "" ? 0 : Number.parseInt(value));
            }}
            sx={{ flex: 1 }}
          />
        </Box>

        {/* Date and Time Input or due date*/}
        <TextField
          label="Due Date"
          type="datetime-local"
          fullWidth
          variant="outlined"
          value={newTaskDeadline}
          onChange={(e) => setNewTaskDeadline(e.target.value)}
          sx={{ marginBottom: "10px" }}
          InputLabelProps={{
            shrink: true,
          }}
        />

        {/* Spec URL Input */}
        <TextField
          autoFocus
          margin="dense"
          label="Task Specification URL"
          fullWidth
          variant="outlined"
          value={taskSpecURL}
          onChange={(e) => setTaskSpecURL(e.target.value)}
          sx={{ marginBottom: "20px" }}
        />

        {/* Late Submission Policy Accordion */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ backgroundColor: "grey.200" }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Late Submission Policy
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Percentage Deduction per Day"
                type="number"
                fullWidth
                variant="outlined"
                value={percentDeductionPerDay}
                onChange={(e) =>
                  setPercentDeductionPerDay!(Number(e.target.value))
                }
                InputProps={{ inputProps: { min: 0, max: 100 } }}
              />

              <FormControl fullWidth>
                <InputLabel>Late Day Type</InputLabel>
                <Select
                  value={lateDayType}
                  label="Late Day Type"
                  onChange={(e) =>
                    setLateDayType!(e.target.value as "CALENDAR" | "BUSINESS")
                  }
                >
                  <MenuItem value="CALENDAR">Calendar Days</MenuItem>
                  <MenuItem value="BUSINESS">Business Days</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Maximum Late Days"
                type="number"
                fullWidth
                variant="outlined"
                value={maxLateDays}
                onChange={(e) => setMaxLateDays!(Number(e.target.value))}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Accordion for File Restrictions */}
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ backgroundColor: "grey.200" }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              File Restrictions
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TextField
              margin="dense"
              label="Required File (comma-separated)"
              fullWidth
              placeholder="e.g., isprime.py, iseven.c"
              variant="outlined"
              value={newTaskRequiredFiles}
              onChange={(e) => setNewTaskRequiredFiles(e.target.value)}
              sx={{ mb: "10px" }}
            />
            <TextField
              margin="dense"
              label="Allowed Extra File Extensions (comma-separated)"
              fullWidth
              placeholder="e.g., .c, .h"
              variant="outlined"
              value={newTaskAllowedFileTypes}
              onChange={(e) => setNewTaskAllowedFileTypes(e.target.value)}
              sx={{ mb: "10px" }}
            />
            <TextField
              margin="dense"
              label="Max File Size (in MB)"
              fullWidth
              variant="outlined"
              value={newTaskMaxFileSize}
              onChange={(e) => {
                const value = e.target.value;
                setNewTaskMaxFileSize(
                  value === "" ? 0 : Number.parseInt(value)
                );
              }}
              sx={{ marginBottom: "20px" }}
            />
          </AccordionDetails>
        </Accordion>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} sx={{ fontWeight: 600, color: "#888" }}>
          Cancel
        </Button>
        <Button
          onClick={handleAddNewTask}
          disabled={!!nameError || (!editing && !newTaskName)}
          sx={{
            fontWeight: 600,
            color: !!nameError || (!editing && !newTaskName) ? "grey.500" : "#1a73e8",
          }}
        >
          {!editing ? "Create Task" : "Confirm"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}