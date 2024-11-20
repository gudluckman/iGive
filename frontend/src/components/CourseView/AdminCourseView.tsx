import {
  Box,
  Button,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";
import { AdminCourseViewProps } from "../../interfaces/user.interface";
import { SpinningIconButton, splitCourseCode } from "../../util/helper";
import { useState } from "react";

export function AdminCourseView({
  courseCode,
  tasks,
  onTaskClick,
  handleDeleteTask,
  handleClickOpen,
  isDeadlinePassed,
  formatDeadline,
  handleSettingsMenuOpen,
  settingsAnchorEl,
  handleSettingsMenuClose,
  handleSettingsMenuItemClick,
}: AdminCourseViewProps) {
  const { term, course } = splitCourseCode(courseCode);
  const isMobile = useMediaQuery("(max-width:600px)");
  const [isSpinning, setIsSpinning] = useState(false);

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setIsSpinning(true);
    handleSettingsMenuOpen(event);

    setTimeout(() => {
      setIsSpinning(false);
    }, 500);
  };

  return (
    <Box sx={{ p: isMobile ? 1 : 2 }}>
      <Box
        display="flex"
        flexDirection={isMobile ? "column" : "row"}
        justifyContent="space-between"
        alignItems={isMobile ? "flex-start" : "center"}
        sx={{ marginBottom: "24px", gap: isMobile ? 1 : 0 }}
      >
        {/* Course Title */}
        <Typography
          variant="h3"
          sx={{
            fontWeight: 600,
            fontSize: isMobile ? "1.8rem" : { md: "2.5rem", lg: "3rem" },
            textAlign: isMobile ? "center" : "left",
          }}
        >
          {course} - {term}
        </Typography>

        {/* Button Settings Icon */}
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{ width: isMobile ? "100%" : "auto" }}
        >
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#2c3e50",
              textTransform: "none",
              padding: isMobile ? "6px 10px" : "8px 16px",
              fontSize: isMobile ? "12px" : { md: "14px", lg: "16px" },
              maxWidth: isMobile ? "40%" : "auto",
              marginLeft: isMobile ? "auto" : 0,
              boxShadow: isMobile ? "none" : "0px 4px 8px rgba(0, 0, 0, 0.2)",
            }}
            onClick={handleClickOpen}
          >
            New Task
          </Button>
          <Tooltip title="Course Settings" arrow>
            <SpinningIconButton
              sx={{ color: "#2c3e50" }}
              onClick={handleSettingsClick}
              className={isSpinning ? "spinning" : ""}
            >
              <SettingsIcon sx={{ fontSize: isMobile ? "1.5rem" : "2rem" }} />
            </SpinningIconButton>
          </Tooltip>

          {/* Settings Dropdown Menu */}
          <Menu
            anchorEl={settingsAnchorEl}
            open={Boolean(settingsAnchorEl)}
            onClose={handleSettingsMenuClose}
          >
            <MenuItem onClick={() => handleSettingsMenuItemClick("student")}>
              Add/Remove Students
            </MenuItem>
            <MenuItem onClick={() => handleSettingsMenuItemClick("tutor")}>
              Add/Remove Tutors
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {tasks.length === 0 ? (
        <Typography
          variant="h6"
          sx={{ marginBottom: "16px", color: "#888", textAlign: "left" }}
        >
          No tasks created at the moment.
        </Typography>
      ) : (
        <List
          sx={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            backgroundColor: "#f5f5f5",
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.05)",
            padding: isMobile ? "8px" : "16px",
          }}
        >
          {tasks.map((task, index) => (
            <ListItem
              key={index}
              component="li"
              sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "flex-start" : "center",
                justifyContent: "space-between",
                borderBottom:
                  tasks.length !== index + 1 ? "1px solid #e0e0e0" : "none",
                padding: "16px 24px",
                "&:hover": {
                  backgroundColor: "#f1f1f1",
                  transition: "background-color 0.3s ease",
                },
              }}
              onClick={() => onTaskClick(index, task.name)}
            >
              <ListItemText
                primary={task.name}
                primaryTypographyProps={{
                  fontSize: "1.25rem",
                  fontWeight: "500",
                  color: "#2c3e50",
                }}
              />
              <Box display="flex" alignItems="center" gap={isMobile ? 1 : 2}>
                <Box
                  sx={{
                    backgroundColor: isDeadlinePassed(task.deadline)
                      ? "#ffebee"
                      : "#e8f5e9",
                    padding: "4px 8px",
                    borderRadius: "8px",
                    border: isDeadlinePassed(task.deadline)
                      ? "1px solid #e57373"
                      : "1px solid #81c784",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDeadlinePassed(task.deadline)
                        ? "#d32f2f"
                        : "#388e3c",
                      fontWeight: "500",
                    }}
                  >
                    Due Date: {formatDeadline(task.deadline)}
                  </Typography>
                </Box>

                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTask(task);
                  }}
                  sx={{ color: "red" }}
                  id={`${task.name}-delete`}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
