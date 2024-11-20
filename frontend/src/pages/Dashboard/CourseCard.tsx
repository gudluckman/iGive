import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { CourseCardProps } from "../../interfaces/course.interface";

export function CourseCard({
  courseId,
  courseCode,
  title,
  term,
}: CourseCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/course/${courseId}`);
  };

  return (
    <Box
      sx={{
        display: "inline-block",
        width: "300px",
        mr: 2,
        borderRadius: "12px",
        boxShadow: 3,
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          transform: "scale(1.05)",
          boxShadow: 6,
        },
      }}
    >
      <Card
        sx={{
          borderRadius: "12px",
          height: "120px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          p: 2,
          background: "#FAFAFA",
        }}
        onClick={handleCardClick}
      >
        <CardContent sx={{ textAlign: "left", padding: 0, flexGrow: 1 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            {courseCode}
          </Typography>
          <Typography
            variant="body2"
            sx={{ wordWrap: "break-word", whiteSpace: "normal", mb: 2 }}
          >
            {title}
          </Typography>
        </CardContent>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Chip
            label={term}
            sx={{ background: "#788bb3", color: "white" }}
            size="small"
          />
        </Box>
      </Card>
    </Box>
  );
}
