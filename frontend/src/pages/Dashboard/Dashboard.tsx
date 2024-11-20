import React, { useRef, useState, useEffect } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { CourseCard } from "./CourseCard";
import { auth } from "../../util/firebase_util";
import PageTransition from "../../components/Animation/PageTransition";
import { useTransition } from "../../context/TransitionContext";
import { Course, CourseSectionProps } from "../../interfaces/course.interface";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import { useNavigate } from "react-router-dom";
import { parseCourseDetails } from "../../util/helper";

const roleColors: Record<"student" | "tutor" | "admin", string> = {
  student: "#29a0b1 ",
  tutor: "#26415E ",
  admin: "#FF6961 ",
};

const fetchCourseTitles = async (courseIds: string[]) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error("Authorization token not found");
    }

    const response = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/course/get_course_titles`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ course_ids: courseIds }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch course titles");
    }

    const data = await response.json();
    return data.courses.map((course: { id: string; title: string }) => ({
      id: course.id,
      title: course.title,
    }));
  } catch (error) {
    return courseIds.map((courseId) => ({
      id: courseId,
      title: "Error fetching title",
    }));
  }
};


export const CourseSection = ({ role, courses }: CourseSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Typography
        variant="h5"
        sx={{ ml: "15px", mb: "10px", mt: "10px", fontWeight: 500 }}
      >
        <Box
          component="span"
          sx={{
            backgroundColor: roleColors[role],
            borderRadius: "6px",
            px: 2,
            py: 0.2,
            color: "white",
          }}
        >
          {role.toUpperCase()}
        </Box>
      </Typography>

      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          bgcolor: "#f9f9f9",
          borderRadius: "16px",
        }}
      >
        {courses.length > 0 ? (
          <div style={{ overflowX: "auto", flex: 1, display: "flex" }}>
            <div
              ref={scrollRef}
              style={{ display: "flex", whiteSpace: "nowrap", padding: "16px" }}
            >
              {courses.map((course, index) => {
                const { term, courseCode } = parseCourseDetails(course.id);
                return (
                  <CourseCard
                    key={index}
                    courseId={course.id}
                    courseCode={courseCode}
                    title={course.title}
                    term={term}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <Typography sx={{ textAlign: "center", width: "100%", p: 2 }}>
            No courses available.
          </Typography>
        )}
      </Box>
    </>
  );
};

export function Dashboard() {
  const [studentCourses, setStudentCourses] = useState<Course[]>([]);
  const [tutorCourses, setTutorCourses] = useState<Course[]>([]);
  const [adminCourses, setAdminCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const { showTransition, setShowTransition, isAuthTransition } =
    useTransition();

  useEffect(() => {
    // Check if user just registered
    const justRegistered = localStorage.getItem("justRegistered");
    if (justRegistered) {
      localStorage.removeItem("justRegistered");
      navigate("/");
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.email) {
        const match = user.email.match(/(z\d{7})/i);
        if (match) {
          fetchUserCourses();
        }
      } else {
        navigate("/");
      }
      setShowTransition(false);
    });

    return () => unsubscribe();
  }, [setShowTransition, navigate]);

  const fetchUserCourses = async () => {
    const payload = {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${await auth.currentUser?.getIdToken()}` },
    };

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/user/user_courses`,
        payload
      );
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();

      setStudentCourses(await fetchCourseTitles(data.studentOf || []));
      setTutorCourses(await fetchCourseTitles(data.tutorOf || []));
      setAdminCourses(await fetchCourseTitles(data.adminOf || []));
    } catch (error) {
      console.error("Error fetching user courses:", error);
    } finally {
      setLoading(false);
    }
  };

  if (showTransition && isAuthTransition) {
    return <PageTransition />;
  }

  const hasNoCourses =
    studentCourses.length === 0 &&
    tutorCourses.length === 0 &&
    adminCourses.length === 0;

  return (
    <>
      {loading ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "70vh",
            textAlign: "center",
          }}
        >
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Getting your courses...
          </Typography>
        </Box>
      ) : hasNoCourses ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "70vh",
            textAlign: "center",
            gap: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "#555",
            }}
          >
            Oops, looks like you aren't enrolled in any courses yet.
          </Typography>
          <SentimentVeryDissatisfiedIcon
            sx={{
              fontSize: 40,
              color: "#626a99",
            }}
          />
        </Box>
      ) : (
        <>
          {studentCourses.length > 0 && (
            <CourseSection role="student" courses={studentCourses} />
          )}
          {tutorCourses.length > 0 && (
            <CourseSection role="tutor" courses={tutorCourses} />
          )}
          {adminCourses.length > 0 && (
            <CourseSection role="admin" courses={adminCourses} />
          )}
        </>
      )}
    </>
  );
}
