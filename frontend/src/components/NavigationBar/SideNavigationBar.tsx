import React, { useState, useEffect } from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Collapse,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { auth } from "../../util/firebase_util";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

type Section = "student" | "tutor" | "admin";

export function SideNavBar() {
  const navigate = useNavigate();
  const [studentCourses, setStudentCourses] = useState([]);
  const [tutorCourses, setTutorCourses] = useState([]);
  const [adminCourses, setAdminCourses] = useState([]);

  const [openSections, setOpenSections] = useState<{
    student: boolean;
    tutor: boolean;
    admin: boolean;
  }>(() => {
    const savedState = localStorage.getItem("openSections");
    return savedState
      ? JSON.parse(savedState)
      : { student: false, tutor: false, admin: false };
  });

  useEffect(() => {
    localStorage.setItem("openSections", JSON.stringify(openSections));
  }, [openSections]);

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const payload = {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${await user.getIdToken()}` }
        };
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user/user_courses`, payload)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            setStudentCourses(data.studentOf || []);
            setTutorCourses(data.tutorOf || []);
            setAdminCourses(data.adminOf || []);
          })
          .catch((error) => console.error("Error fetching user data:", error));
      }
    });
  }, []);

  const handlePageChange = (course: string) => {
    navigate(`/course/${course}`);
  };

  const handleToggleSection = (section: Section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const hasCourses =
    studentCourses.length > 0 ||
    tutorCourses.length > 0 ||
    adminCourses.length > 0;

  return (
    <Box
      sx={{
        width: 250, // Fixed width for the side nav
        minWidth: 250, // Ensure it stays consistent
        maxWidth: 250, // Prevent resizing
        bgcolor: "#F4F4F4",
        color: "black",
        height: "100vh", // Full height of the viewport
        overflowY: "auto", // Enable vertical scrolling
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start", // Content aligned to the top
      }}
    >
      <Divider sx={{ backgroundColor: "whitesmoke", opacity: 0.5, mb: 2 }} />

      <List>
        {/* Dashboard Link */}
        <ListItemButton onClick={() => navigate("/dashboard")}>
          <ListItemIcon sx={{ color: "black" }}>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText>
            <Typography
              sx={{
                color: "black",
                fontSize: { sm: "14px", md: "14px", lg: "16px" },
              }}
            >
              Course Overview
            </Typography>
          </ListItemText>
        </ListItemButton>
      </List>

      {hasCourses && (
        <Divider sx={{ backgroundColor: "whitesmoke", opacity: 0.5, mb: 2 }} />
      )}

      <List>
        {/* Student Courses */}
        {studentCourses.length > 0 && (
          <>
            <ListItemButton onClick={() => handleToggleSection("student")}>
              <ListItemIcon sx={{ color: "black" }}>
                <SchoolIcon />
              </ListItemIcon>
              <ListItemText>
                <Typography
                  sx={{
                    color: "black",
                    fontSize: { sm: "14px", md: "14px", lg: "16px" },
                  }}
                >
                  Student Courses
                </Typography>
              </ListItemText>
              {openSections.student ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
            <Collapse in={openSections.student} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {studentCourses.map((course, index) => (
                  <ListItemButton
                    key={index}
                    onClick={() => handlePageChange(course)}
                  >
                    <ListItemText
                      sx={{
                        pl: 8,
                        fontSize: { sm: "12px", md: "12px", lg: "14px" },
                      }}
                    >
                      {course}
                    </ListItemText>
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </>
        )}

        {/* Tutor Courses */}
        {tutorCourses.length > 0 && (
          <>
            <ListItemButton onClick={() => handleToggleSection("tutor")}>
              <ListItemIcon sx={{ color: "black" }}>
                <AccountCircleIcon />
              </ListItemIcon>
              <ListItemText>
                <Typography
                  sx={{
                    color: "black",
                    fontSize: { sm: "14px", md: "14px", lg: "16px" },
                  }}
                >
                  Tutor Courses
                </Typography>
              </ListItemText>
              {openSections.tutor ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
            <Collapse in={openSections.tutor} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {tutorCourses.map((course, index) => (
                  <ListItemButton
                    key={index}
                    onClick={() => handlePageChange(course)}
                  >
                    <ListItemText
                      sx={{
                        pl: 8,
                        fontSize: { sm: "12px", md: "12px", lg: "14px" },
                      }}
                    >
                      {course}
                    </ListItemText>
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </>
        )}

        {/* Admin Courses */}
        {adminCourses.length > 0 && (
          <>
            <ListItemButton onClick={() => handleToggleSection("admin")}>
              <ListItemIcon sx={{ color: "black" }}>
                <AdminPanelSettingsIcon />
              </ListItemIcon>
              <ListItemText>
                <Typography
                  sx={{
                    color: "black",
                    fontSize: { sm: "14px", md: "14px", lg: "16px" },
                  }}
                >
                  Admin Courses
                </Typography>
              </ListItemText>
              {openSections.admin ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
            <Collapse in={openSections.admin} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {adminCourses.map((course, index) => (
                  <ListItemButton
                    key={index}
                    onClick={() => handlePageChange(course)}
                  >
                    <ListItemText
                      sx={{
                        pl: 8,
                        fontSize: { sm: "12px", md: "12px", lg: "14px" },
                      }}
                    >
                      {course}
                    </ListItemText>
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </>
        )}
      </List>

      {/* Logout Button (Mobile only) */}
    </Box>
  );
}
