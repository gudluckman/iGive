import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
} from "@mui/material";
import { TutorCourseViewProps } from "../../interfaces/user.interface";
import { splitCourseCode } from "../../util/helper";

export function TutorCourseView({
  courseCode,
  tasks,
  onTaskClick,
  isDeadlinePassed,
  formatDeadline,
}: TutorCourseViewProps) {
  const { term, course } = splitCourseCode(courseCode);

  // Check for mobile screen size
  const isMobile = useMediaQuery("(max-width:600px)");

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
            fontSize: isMobile ? "1.8rem" : "3rem",
            textAlign: isMobile ? "center" : "left",
          }}
        >
          {course} - {term}
        </Typography>
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
            padding: isMobile ? "8px" : "16px", // Adjust padding
          }}
        >
          {tasks.map((task, index) => (
            <ListItem
              key={index}
              component="li"
              sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row", // Stack items on mobile
                alignItems: isMobile ? "flex-start" : "center",
                justifyContent: "space-between",
                borderBottom:
                  tasks.length !== index + 1 ? "1px solid #e0e0e0" : "none",
                padding: "16px 24px",
                cursor: "pointer",
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
              <Box
                display="flex"
                alignItems="center"
                gap={isMobile ? 1 : 2} // Adjust spacing for mobile
                sx={{
                  marginTop: isMobile ? "8px" : 0, // Adjust margin for mobile
                }}
              >
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
                    display: "inline-block",
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
              </Box>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
