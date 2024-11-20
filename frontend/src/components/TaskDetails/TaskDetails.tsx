import {
  Box,
  Typography,
  Button,
  useMediaQuery,
  Autocomplete,
  TextField,
  InputAdornment,
  Grid,
  CircularProgress,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import DescriptionIcon from "@mui/icons-material/Description";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { auth } from "../../util/firebase_util";
import { useEffect, useState } from "react";
import { StudentResult } from "../../interfaces/user.interface";
import axios from "axios";
import { AutotestCenterModal } from "../Modals/Admin/AutotestCenterModal/AutotestCenterModal";
import { ModifyMarksModal } from "../Modals/ModifyMarksModal";
import { AutotestResultModal } from "../Modals/AutotestResultModal";
import { AdminActions } from "./AdminActions";
import { StudentAccordion } from "./StudentAccordion";
import { updateMarkReleaseStatus } from "../../services/resultService";
import {
  renderSubmissionDetails,
  renderAutotestResults,
} from "../../util/renderUtil";
import {
  successNotifier,
  alertNotifier,
  promiseNotifier,
} from "../Notifier/ActionNotifier";
import { fetchStudents } from "../../services/studentServices";
import SubmissionRateChart from "../SubmissionRateChart/SubmissionRateChart";
import { SpecialConsiderationModal } from "../Modals/Admin/SpecialConsiderationModal";
import { parseCourseDetails, formatDate } from "../../util/helper";
import { TaskSettingsModal } from "../Modals/Admin/TaskSettingsModal";
import { ToleranceSettingsModal } from "../Modals/Admin/ToleranceSettingsModal";

export function TaskDetails() {
  const { courseCode, task } = useParams();
  const {
    term,
    courseCode: extractedCourseCode,
    assignmentName,
  } = parseCourseDetails(
    courseCode ? `${courseCode}-${task?.replaceAll("~", " ")}` : ""
  );
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentResult[]>([]);
  const [userLevel, setCurrentUserLevel] = useState<string>("user");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [taskDeadline, setTaskDeadline] = useState("");
  const [maxTaskMark, setMaxTaskMark] = useState<number>(100);
  const [taskMaxAutomark, setTaskMaxAutomark] = useState(0);
  const [taskMaxStyle, setTaskMaxStyle] = useState(0);
  const [taskRequiredFiles, setTaskRequiredFiles] = useState<string>("");
  const [taskAllowedFileTypes, setTaskAllowedFileTypes] = useState<string>("");
  const [taskMaxFileSize, setTaskMaxFileSize] = useState(1);
  const [taskSpecURL, setTaskSpecURL] = useState("");
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [percentDeductionPerDay, setPercentDeductionPerDay] = useState(20); // Default 20%
  const [lateDayType, setLateDayType] = useState<"CALENDAR" | "BUSINESS">(
    "CALENDAR"
  );
  const [maxLateDays, setMaxLateDays] = useState(5); // Default 5 days

  // Modify mark
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(
    null
  );
  const [isModalOpen, setModalOpen] = useState(false);

  // States related to the testing result modal
  const [loadingAutotest, setLoadingAutotest] = useState<boolean>(false);
  const [autotestResult, setAutotestResult] = useState<any[] | null>(null);
  const [isAutotestModalOpen, setAutotestModalOpen] = useState<boolean>(false);
  const [selectedStudentResultAutotest, setSelectedStudentResultAutotest] =
    useState<string>("");
  const [isShowingAutotest, setIsShowingAutotest] = useState<boolean>(false);

  /* Open + Close Autotest Center */
  const [autotestCenterOpen, setAutotestCenterOpen] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [taskSettingsOpen, setTaskSettingsOpen] = useState(false);
  /* Open + Close Tolerance Settings Modal */
  const [toleranceSettingsOpen, setToleranceSettingsOpen] = useState(false);

  const [specialConsiderationOpen, setSpecialConsiderationOpen] =
    useState(false);
  const [selectedStudentForSC, setSelectedStudentForSC] = useState<
    string | null
  >(null);

  // Search student bar
  const [searchValue, setSearchValue] = useState<string>("");

  const isMobile = useMediaQuery("(max-width:600px)");

  const [showSubmissionRate, setShowSubmissionRate] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const initialize = async () => {
      setIsLoading(true);
      const user = auth.currentUser;
      if (!user) {
        if (isMounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
          navigate("/", {
            state: {
              returnUrl: `/course/${courseCode}/task/${task}`,
              message: "Please log in to view task details",
            },
          });
        }
        return;
      }

      if (!courseCode || !task) {
        if (isMounted) {
          setIsLoading(false);
          console.error("Course code or task ID is undefined.");
        }
        return;
      }

      try {
        // Fetch user level using the API instead
        const token = await user.getIdToken();
        const userLevelResponse = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/user/user_level`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              email: user.email,
              course_code: courseCode,
            }),
          }
        );

        if (!userLevelResponse.ok) {
          throw new Error(`HTTP error! Status: ${userLevelResponse.status}`);
        }

        const userLevelData = await userLevelResponse.json();
        if (userLevelData.userLevel === "student") {
          navigate("/");
          alertNotifier("Not authorised to view this page. Redirected to dashboard...")
          return;
        }
        if (userLevelData.userLevel && isMounted) {
          setCurrentUserLevel(userLevelData.userLevel);
        } else if (isMounted) {
          alertNotifier("Course not found");
        }

        // Fetch students data
        const studentsData = await fetchStudents(courseCode, task);
        if (isMounted) {
          setStudents(studentsData);
          setFilteredStudents(studentsData);
        }

        // Fetch task data
        const taskResponse = await fetch(
          `${
            process.env.REACT_APP_BACKEND_URL
          }/api/task/task_data/${encodeURIComponent(
            courseCode
          )}/${encodeURIComponent(task.replaceAll("~", " "))}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!taskResponse.ok) {
          const errorDetails = await taskResponse.text();
          console.error(
            `Failed to fetch task data: ${taskResponse.status} ${taskResponse.statusText}`,
            errorDetails
          );
          throw new Error(
            `Failed to fetch task data: ${taskResponse.statusText}`
          );
        }

        const taskData = await taskResponse.json();
        if (isMounted) {
          setTaskMaxAutomark(taskData.maxAutomark || 0);
          setTaskMaxStyle(taskData.maxStyleMark || 0);
          setMaxTaskMark(taskData.maxTaskMark || 0);
          setTaskDeadline(taskData.deadline || "N/A");
          setTaskSpecURL(taskData.specUrl || "N/A");
          setTaskRequiredFiles(taskData.requiredFiles.join(", "));
          setTaskAllowedFileTypes(taskData.allowedFileTypes.join(", "));
          setTaskMaxFileSize(taskData.maxFileSize);
        }
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (isMounted) {
        setIsAuthenticated(!!user);
        if (user && !isInitialized) {
          initialize();
        } else if (!user) {
          setIsLoading(false);
          navigate("/", {
            state: {
              returnUrl: `/course/${courseCode}/task/${task}`,
              message: "Your session has expired. Please log in again.",
            },
          });
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [courseCode, task, isInitialized, navigate]);

  const handleSpecialConsiderationClick = async (studentId: string) => {
    setSelectedStudentForSC(studentId);
    setSpecialConsiderationOpen(true);
  };

  const handleSpecialConsiderationSuccess = async () => {
    // Refresh students data to get updated special consideration status
    const updatedStudents = await fetchStudents(courseCode!, task!);
    setStudents(updatedStudents);
    setFilteredStudents(updatedStudents);
  };

  const handleSearchChange = (
    event: React.ChangeEvent<{}>,
    value: string | null
  ) => {
    setSearchValue(value || "");
    if (value) {
      const filtered = students.filter(
        (student) =>
          student.first_name.toLowerCase().includes(value.toLowerCase()) ||
          student.last_name.toLowerCase().includes(value.toLowerCase()) ||
          student.id.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const handleBackClick = () => {
    navigate(`/course/${courseCode}`);
  };

  const handleGenerateCSV = async () => {
    try {
      if (!courseCode || !task) {
        alertNotifier("Course code or task name is missing");
        return;
      }

      // Get auth token
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        alertNotifier("Authentication required");
        return;
      }

      // Fix the URL path - remove the double slash and encode the task name
      const encodedTaskName = encodeURIComponent(task.replaceAll("~", " "));
      const response = await axios({
        method: "GET",
        url: `${process.env.REACT_APP_BACKEND_URL}/api/task/generate_csv/${courseCode}/${encodedTaskName}`,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/csv",
        },
        responseType: "blob",
      });

      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "text/csv" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${courseCode}_${task.replaceAll("~", " ")}_results.csv`
      );
      document.body.appendChild(link);
      link.click();

      // Clean up
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      successNotifier("CSV file generated successfully");
    } catch (error) {
      console.error("Error generating CSV:", error);
      alertNotifier("Failed to generate CSV file");
    }
  };

  const handleSettingsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (settingsAnchorEl) {
      setSettingsAnchorEl(null);
    } else {
      setSettingsAnchorEl(event.currentTarget);
    }
  };

  const handleSettingsMenuClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleAutotestCenterClick = () => {
    setAutotestCenterOpen(true);
    handleSettingsMenuClose();
  };

  const handleAutotestCenterClose = () => {
    setAutotestCenterOpen(false);
  };

  const handleModifyMarksClick = (student: StudentResult) => {
    setSelectedStudent(student);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleUpdateMarks = async (updatedStudent: StudentResult) => {
    if (!courseCode || !task || !selectedStudent) return;

    try {
      const payload = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
        },
        body: JSON.stringify({
          zid: updatedStudent.id,
          course_code: courseCode,
          task: task ? task.replaceAll(/~/g, " ") : "Error",
          new_automark: updatedStudent.raw_automark,
          new_style: updatedStudent.style,
          new_comments: updatedStudent.comments,
        }),
      };
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/task/override_mark`,
        payload
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const updateStudentList = (prevStudents: any) =>
        prevStudents.map((student: any) =>
          student.id === selectedStudent.id ? updatedStudent : student
        );
      setStudents(updateStudentList);
      setFilteredStudents(updateStudentList);
    } catch (error) {
      console.error("Error updating marks:", error);
    } finally {
      handleModalClose();
    }
  };

  const handleAutotestClick = async (student: StudentResult) => {
    const submissionTimes = Object.keys(student.submissions["submissions"]);

    if (submissionTimes.length === 0) {
      alertNotifier("No submissions recorded. Cannot run autotest.");
      return;
    }
    setSelectedStudentResultAutotest(student.id);
    setLoadingAutotest(true);
    setAutotestModalOpen(false);
    setAutotestResult(null);

    const payload = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
      },
      body: JSON.stringify({
        zid: student.id,
        course_code: courseCode,
        task: task ? task.replaceAll(/~/g, " ") : "Error",
        timestamp: Object.keys(student.submissions["submissions"])[0],
      }),
    };

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/testing/run_autotest`,
        payload
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setAutotestResult(data.autotest_results);
      successNotifier("Autotest completed successfully!");
    } catch (error: any) {
      alertNotifier(error.message);
    } finally {
      setLoadingAutotest(false);
      setIsShowingAutotest(true);
      setAutotestModalOpen(true);
    }
  };

  const handleCloseAutotestModal = () => {
    setAutotestModalOpen(false);
  };

  const handleRunAutomarkClick = async (
    student: StudentResult,
    index: number
  ) => {
    if (!courseCode || !task || !auth.currentUser) {
      alertNotifier("Missing required information");
      return;
    }

    const automarkPromise = new Promise<string>(async (resolve, reject) => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          throw new Error("Authentication required");
        }

        // Get the latest submission timestamp
        const submissionTimes = Object.keys(student.submissions["submissions"]);
        if (submissionTimes.length === 0) {
          throw new Error("No submissions found for this student");
        }

        const payload = {
          zid: student.id,
          course_code: courseCode,
          task: task.replaceAll("~", " "),
          timestamp: submissionTimes[0],
        };

        // Run automark
        await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/testing/run_automark`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Fetch fresh data for all students
        const updatedStudents = await fetchStudents(courseCode, task);

        // Update both states with fresh data
        setStudents(updatedStudents);
        setFilteredStudents((prevFiltered) => {
          // Maintain current filters while updating data
          const currentFilters = prevFiltered.map((s) => s.id);
          return updatedStudents.filter((s) => currentFilters.includes(s.id));
        });

        resolve("Automark run finished successfully");
      } catch (error) {
        console.error("Automark error:", error);
        reject(
          error instanceof Error ? error.message : "Failed to run automark"
        );
      }
    });

    // Show notifications for the automark process with fixed error handling
    promiseNotifier(automarkPromise, {
      pending: `Running automark for ${student.id}...`,
      success: `Automark completed successfully for ${student.id}`,
      error: `Automark failed. Please try again.`, // Fixed: Now a string instead of a function
    });
  };

  const handleTaskSettingsClick = () => {
    setTaskSettingsOpen(true);
    handleSettingsMenuClose();
  };

  const handleTaskSettingsClose = () => {
    setTaskSettingsOpen(false);
  };

  const handleToleranceSettingsClick = () => {
    setToleranceSettingsOpen(true);
    handleSettingsMenuClose();
  };

  const handleToleranceSettingsClose = () => {
    setToleranceSettingsOpen(false);
  };

  const handleEditTaskConfirm = async () => {
    // Prepare task data, including file restrictions
    // split the strings into arrays
    const requiredFilesArray = taskRequiredFiles
      .split(",")
      .map((file) => file.trim());
    const allowedFileTypesArray = taskAllowedFileTypes
      .split(",")
      .map((type) => type.trim());
    if (taskMaxAutomark < 0 || taskMaxStyle < 0) {
      alertNotifier("Max Automark and Max Style Mark must be positive");
      return;
    }
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/task/set_task_data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            course_code: courseCode,
            name: task!.replaceAll(/~/g, " "),
            deadline: taskDeadline,
            spec_URL: taskSpecURL,
            max_automark: taskMaxAutomark,
            max_style: taskMaxStyle,
            file_restrictions: {
              required_files: requiredFilesArray,
              allowed_file_types: allowedFileTypesArray,
              max_file_size: taskMaxFileSize,
            },
            late_policy: {
              late_day_type: lateDayType,
              max_late_days: maxLateDays,
              percent_deduction_per_day: percentDeductionPerDay,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      successNotifier("Task settings saved successfully.");
    } catch (error) {
      console.error("Failed to save task settings:", error);

      if (error instanceof Error) {
        alertNotifier(`Failed to save task settings: ${error.message}`);
      } else {
        alertNotifier("An unknown error occured.");
      }
    }
  };

  const handleViewAutomarkReport = (student: StudentResult) => {
    try {
      const parsedReport = JSON.parse(student.automark_report);

      if (!parsedReport || Object.keys(parsedReport).length === 0) {
        throw new Error("The automark report is empty or invalid.");
      }

      setAutotestResult(parsedReport);
      setSelectedStudentResultAutotest(student.id);
      setIsShowingAutotest(false);
      setAutotestModalOpen(true);
    } catch (error: any) {
      console.error("Error parsing automark report:", error.message);
      alertNotifier(
        "Failed to load automark report. Please ensure the data is valid."
      );
    }
  };

  const handleMarkReleaseChange = async (index: number, checked: boolean) => {
    const studentsCopy = [...students];
    studentsCopy[index].mark_released = checked;
    setStudents(studentsCopy);
    setFilteredStudents(studentsCopy);

    await updateMarkReleaseStatus(
      (await auth.currentUser?.getIdToken()) || "",
      courseCode || "",
      task?.replaceAll("~", " ") || "",
      students[index].id,
      checked
    );
    successNotifier("Mark Status Updated");
  };

  const handleDownloadFiles = async (student: StudentResult) => {
    try {
      const submissionTimes = Object.keys(student.submissions["submissions"]);

      if (submissionTimes.length === 0) {
        alertNotifier(
          "No submissions found for this student. Please check again later."
        );
        return;
      }

      const fileStorPaths =
        student.submissions["submissions"][submissionTimes[0]];

      if (!fileStorPaths || fileStorPaths.length === 0) {
        alertNotifier("No files available to download.");
        return;
      }

      for (const fileStorPath of fileStorPaths) {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/task/download_submission_file`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
            },
            body: JSON.stringify({ path: fileStorPath }),
          }
        );

        if (response.ok) {
          const blob = await response.blob();
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = fileStorPath.split("/").pop() || "backend-error";
          document.body.appendChild(a);
          a.click();
          a.remove();
        } else {
          alertNotifier("Failed to download file: " + response.statusText);
        }
      }
    } catch (error) {
      console.error("Error downloading files:", error);
      alertNotifier("An error occurred while downloading files.");
    }
  };

  const getUserLevelStyles = (level: string) => {
    switch (level.toLowerCase()) {
      case "admin":
        return { backgroundColor: "#FF6961 ", color: "#fff" };
      case "tutor":
        return { backgroundColor: "#26415E ", color: "#fff" };
      case "student":
        return { backgroundColor: "#29a0b1 ", color: "#fff" };
      default:
        return { backgroundColor: "gray", color: "#fff" };
    }
  };

  return (
    <Box
      sx={{
        p: isMobile ? 1 : 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Container showing task fields, title, term code, details, spec url */}
      <Box>
        <Grid container spacing={2} sx={{ marginBottom: "8px" }}>
          {/* Top Row: Title and User Information */}
          {/* Top Row Left part */}
          <Grid item xs={12} sm={6}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 600,
                fontSize: {
                  xs: "1.5rem",
                  sm: "1.8rem",
                  md: "2.5rem",
                },
                textAlign: "left",
              }}
            >
              {extractedCourseCode} - {assignmentName || "Untitled Task"}
            </Typography>
          </Grid>
          {/* Top Row Right part */}
          <Grid
            item
            xs={12}
            sm={6}
            display="flex"
            alignItems="center"
            gap={1}
            sx={{
              justifyContent: isMobile ? "flex-start" : "flex-end",
            }}
          >
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBackClick}
              id="back-to-course-button"
              sx={{
                backgroundColor: "#f0f0f0",
                color: "#333",
                ":hover": { backgroundColor: "#e0e0e0" },
              }}
            />

            <Box
              sx={{
                backgroundColor: "#2c3e50",
                color: "#fff",
                padding: "4px 12px",
                borderRadius: "4px",
                minWidth: "60px",
                textAlign: "center",
                marginRight: isMobile ? "0" : "4px",
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontSize: isMobile ? "0.8rem" : "0.9rem",
                  fontStyle: "italic",
                }}
              >
                {term}
              </Typography>
            </Box>
            <Box
              sx={{
                ...getUserLevelStyles(userLevel),
                padding: "4px 12px",
                borderRadius: "4px",
                minWidth: "110px",
                textAlign: "center",
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontSize: isMobile ? "0.8rem" : "0.9rem",
                  fontStyle: "italic",
                }}
              >
                {userLevel?.charAt(0).toUpperCase() + userLevel.slice(1)}
              </Typography>
            </Box>
          </Grid>

          {/* Bottom Row: Deadline and Spec URL, Admin Actions */}
          {/* Bottom Row Left part */}
          <Grid item xs={12} sm={6}>
            {/* Due Date */}
            <Typography
              variant="subtitle1"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontSize: isMobile ? "0.8rem" : "1rem",
                color: "#555",
                marginBottom: 1,
                textAlign: "left",
              }}
            >
              <EventIcon color="action" sx={{ mr: isMobile ? 0.5 : 1 }} />
              <Box sx={{ flexGrow: 1, textAlign: "left" }}>
                <span style={{ fontWeight: 600 }}>Due Date:</span>{" "}
                {taskDeadline
                  ? formatDate(taskDeadline)
                  : "Deadline Not Provided"}
              </Box>
            </Typography>

            {/* Task Specification */}
            <Typography
              variant="subtitle1"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontSize: isMobile ? "0.8rem" : "1rem",
                color: "#555",
                marginBottom: 1,
              }}
            >
              <DescriptionIcon color="action" sx={{ mr: isMobile ? 0.5 : 1 }} />
              <Box sx={{ flexGrow: 1, textAlign: "left" }}>
                <span style={{ fontWeight: 600 }}>Task Specification:</span>{" "}
                {taskSpecURL && taskSpecURL !== "N/A" ? (
                  <a
                    href={taskSpecURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#1a73e8", textDecoration: "underline" }}
                  >
                    Click here!
                  </a>
                ) : (
                  "URL Not Provided"
                )}
              </Box>
            </Typography>
          </Grid>

          {/* Bottom Row Right part */}
          <Grid
            item
            xs={12}
            sm={6}
            display="flex"
            alignItems="center"
            sx={{
              justifyContent: isMobile ? "flex-start" : "flex-end",
            }}
          >
            {(userLevel === "admin" || userLevel === "tutor") && (
              <AdminActions
                courseCode={courseCode!}
                task={task!}
                students={students}
                fetchStudents={fetchStudents}
                setStudents={setStudents}
                setFilteredStudents={setFilteredStudents}
                handleGenerateCSV={handleGenerateCSV}
                handleSettingsMenuOpen={handleSettingsMenuOpen}
                handleAutotestCenterClick={handleAutotestCenterClick}
                handleTaskSettingsClick={handleTaskSettingsClick}
                handleToleranceSettingsClick={handleToleranceSettingsClick}
                settingsAnchorEl={settingsAnchorEl}
                handleSettingsMenuClose={handleSettingsMenuClose}
                onSubmissionRateClick={() => setShowSubmissionRate(true)}
                userLevel={userLevel} // Pass userLevel to allow feature restrictions
              />
            )}
          </Grid>
        </Grid>

        {/* Search bar for student search */}
        <Autocomplete
          freeSolo
          disableClearable
          options={[]}
          value={searchValue}
          onInputChange={handleSearchChange}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              placeholder="Search by student name or zID (e.g., John Smith, z4444444)"
              fullWidth
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          )}
          sx={{ mb: 2, mt: 2 }}
        />
      </Box>
      {/* Student Accordion */}
      <StudentAccordion
        filteredStudents={filteredStudents}
        isLoading={isLoading}
        isInitialized={isInitialized}
        userLevel={userLevel}
        taskMaxAutomark={taskMaxAutomark}
        taskMaxStyle={taskMaxStyle}
        maxTaskMark={maxTaskMark}
        handleAutotestClick={handleAutotestClick}
        handleRunAutomarkClick={handleRunAutomarkClick}
        handleViewAutomarkReport={handleViewAutomarkReport}
        handleModifyMarksClick={handleModifyMarksClick}
        handleMarkReleaseChange={handleMarkReleaseChange}
        renderSubmissionDetails={renderSubmissionDetails}
        handleDownloadFiles={handleDownloadFiles}
        handleSpecialConsiderationClick={handleSpecialConsiderationClick}
      />

      {/* Loading Spinner */}
      {loadingAutotest && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            textAlign: "center",
          }}
        >
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2, color: "#ebe8e8" }}>
            Loading your autotest...
          </Typography>
        </Box>
      )}

      {/* Autotest Result Modal */}
      <AutotestResultModal
        open={isAutotestModalOpen}
        handleClose={handleCloseAutotestModal}
        isAutotest={isShowingAutotest}
        autotestResult={autotestResult}
        renderAutotestResults={renderAutotestResults}
        studentId={selectedStudentResultAutotest}
      />
      {/* Submission Rate Overlay */}
      {showSubmissionRate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-full max-w-xs mx-4">
            {/* Submission Rate Modal */}
            <SubmissionRateChart
              courseCode={courseCode!}
              task={task!}
              students={students.map((student) => ({
                ...student,
                grade: student.grade ? parseFloat(student.grade) : undefined,
              }))}
              open={showSubmissionRate}
              onClose={() => setShowSubmissionRate(false)}
            />
          </div>
        </div>
      )}

      {userLevel === "admin" && (
        <>
          <AutotestCenterModal
            courseCode={courseCode!}
            task={task!}
            handleAutotestCenterClose={handleAutotestCenterClose}
            autotestCenterOpen={autotestCenterOpen}
          />
          <TaskSettingsModal
            editing={true}
            open={taskSettingsOpen}
            handleClose={handleTaskSettingsClose}
            handleAddNewTask={handleEditTaskConfirm}
            newTaskDeadline={taskDeadline}
            newTaskMaxAutomark={taskMaxAutomark}
            newTaskMaxStyle={taskMaxStyle}
            newTaskRequiredFiles={taskRequiredFiles}
            newTaskAllowedFileTypes={taskAllowedFileTypes}
            newTaskMaxFileSize={taskMaxFileSize}
            percentDeductionPerDay={percentDeductionPerDay}
            lateDayType={lateDayType}
            maxLateDays={maxLateDays}
            taskSpecURL={taskSpecURL}
            setNewTaskDeadline={setTaskDeadline}
            setNewTaskMaxAutomark={setTaskMaxAutomark}
            setNewTaskMaxStyle={setTaskMaxStyle}
            setNewTaskRequiredFiles={setTaskRequiredFiles}
            setNewTaskAllowedFileTypes={setTaskAllowedFileTypes}
            setNewTaskMaxFileSize={setTaskMaxFileSize}
            setTaskSpecURL={setTaskSpecURL}
            setPercentDeductionPerDay={setPercentDeductionPerDay}
            setLateDayType={setLateDayType}
            setMaxLateDays={setMaxLateDays}
          />
          <ToleranceSettingsModal
            courseCode={courseCode!}
            task={task!}
            toleranceSettingsOpen={toleranceSettingsOpen}
            handleToleranceSettingsClose={handleToleranceSettingsClose}
          />
          {/* SpecialConsiderationModal */}
          {specialConsiderationOpen && selectedStudentForSC && (
            <SpecialConsiderationModal
              open={specialConsiderationOpen}
              onClose={() => setSpecialConsiderationOpen(false)}
              studentId={selectedStudentForSC}
              courseCode={courseCode!}
              task={task!}
              onSuccess={handleSpecialConsiderationSuccess}
            />
          )}
        </>
      )}

      {selectedStudent && (
        <ModifyMarksModal
          open={isModalOpen}
          onClose={handleModalClose}
          student={selectedStudent}
          onUpdate={handleUpdateMarks}
        />
      )}
    </Box>
  );
}
