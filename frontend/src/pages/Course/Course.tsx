import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { StudentCourseView } from "../../components/CourseView/StudentCourseView";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";
import { AdminCourseView } from "../../components/CourseView/AdminCourseView";
import { TutorCourseView } from "../../components/CourseView/TutorCourseView";
import { TaskSettingsModal } from "../../components/Modals/Admin/TaskSettingsModal";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { auth } from "../../util/firebase_util";
import { onAuthStateChanged } from "firebase/auth";
import { Task } from "../../interfaces/tasks.interface";
import { CourseSettingsModal } from "../../components/Modals/Admin/CourseSettingsModal";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import {
  alertNotifier,
  successNotifier,
} from "../../components/Notifier/ActionNotifier";
import { User } from "firebase/auth";

dayjs.extend(isSameOrAfter);

const formatDeadline = (deadline: string) => {
  const date = new Date(deadline);
  const formattedDate = date.toLocaleDateString("en-GB");
  const formattedTime = date.toLocaleTimeString("en-GB");
  return `${formattedDate} - ${formattedTime}`;
};

const isDeadlinePassed = (deadline: string) => {
  const currentDate = dayjs();
  const parsedDeadline = dayjs(deadline);
  return currentDate.isSameOrAfter(parsedDeadline);
};

export function Course() {
  const { courseCode } = useParams();
  const navigate = useNavigate();

  /* Describes the current user's access level / user type
   * One of:
   *  - "student": default configuration
   *  - "tutor"
   *  - "admin"
   */
  const [currentUserLevel, setCurrentUserLevel] = useState("student");
  const [courseNotFound, setCourseNotFound] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [userLevelLoading, setUserLevelLoading] = useState(true);
  const [fetchTasksLoading, setFetchTasksLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setUserLevelLoading(true);
    setFetchTasksLoading(true);
  }, [courseCode]);

  useEffect(() => {
    if (!userLevelLoading && !fetchTasksLoading) {
      setLoading(false);
    }
  }, [userLevelLoading, fetchTasksLoading]);

  // Authentication state management
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setCurrentUserLevel("student");
        setCourseNotFound(true);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const response = await fetch(
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
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const data = await response.json();
          if (data.userLevel) {
            setCurrentUserLevel(data.userLevel);
            setCourseNotFound(false);
          } else {
            setCourseNotFound(true);
          }
        } catch (error) {
          console.error("Error fetching user level:", error);
          setCourseNotFound(true);
        } finally {
          setUserLevelLoading(false);
        }
      }
    });
  }, [user, courseCode]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const [newTaskMaxAutomark, setNewTaskMaxAutomark] = useState(0);
  const [newTaskMaxStyle, setNewTaskMaxStyle] = useState(0);
  const [newTaskrequiredFiles, setNewTaskrequiredFiles] = useState<string>("");
  const [newTaskAllowedFileTypes, setNewTaskAllowedFileTypes] =
    useState<string>("");
  const [newTaskMaxFileSize, setNewTaskMaxFileSize] = useState(1); // default max file size is 1mb
  const [percentDeductionPerDay, setPercentDeductionPerDay] = useState(20); // Default 20%
  const [lateDayType, setLateDayType] = useState<'CALENDAR' | 'BUSINESS'>('CALENDAR');
  const [maxLateDays, setMaxLateDays] = useState(5); // Default 5 days
  const [newTaskSpecURL, setNewTaskSpecURL] = useState("");

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsMethod, setSettingsMethod] = useState("");
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(
    null
  );

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

  const handleSettingsMenuItemClick = (method: string) => {
    if (method === "student") {
      setSettingsMethod("student");
    } else {
      setSettingsMethod("tutor");
    }
    setSettingsOpen(true);
    handleSettingsMenuClose();
  };

  useEffect(() => {
    const fetchTasks = async () => {
      if (!courseCode) return;

      try {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch(
          `${
            process.env.REACT_APP_BACKEND_URL
          }/api/task/query_tasks?course_code=${encodeURIComponent(courseCode)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error);
        }

        setTasks(data.tasks || []);
      } catch (error) {
        alertNotifier(`Fetching ${error}`);
      } finally {
        setFetchTasksLoading(false);
      }
    };

    if (user) {
      fetchTasks();
    }
  }, [courseCode, user]);

  const handleTaskClick = (id: number, name: string) => {
    const task = name.replaceAll(/\s/g, "~");
    setTimeout(() => navigate(`/course/${courseCode}/${task}`), 300);
  };

  const handleAddNewTask = async () => {
    // Input validation
    if (!newTaskName || !newTaskDeadline || !courseCode) {
      alertNotifier("All fields must be non-empty");
      return;
    }

    if (newTaskMaxAutomark < 0 || newTaskMaxStyle < 0) {
      alertNotifier("Max Automark and Max Style Mark must be positive");
      return;
    }

    if (newTaskMaxAutomark + newTaskMaxStyle !== 100) {
      alertNotifier("Max Automark and Max Style Mark must sum up to 100");
      return;
    }

    // Validation for late penalties
    if (percentDeductionPerDay < 0 || percentDeductionPerDay > 100) {
      alertNotifier("Percentage deduction must be between 0 and 100");
      return;
    }

    if (maxLateDays < 0) {
      alertNotifier("Maximum late days must be positive");
      return;
    }

    const finding = /[.[\]*`~/\\]/;
    if (finding.test(newTaskName)) {
      alertNotifier(
        "Task name cannot contain special characters: . [ ] * ` ~ / \\"
      );
      return;
    }

    // Prepare task data, including file restrictions
    // split the strings into arrays
    const requiredFilesArray = newTaskrequiredFiles
      .split(",")
      .map((file) => file.trim());
    const allowedFileTypesArray = newTaskAllowedFileTypes
      .split(",")
      .map((type) => type.trim());

    const newTask = {
      name: newTaskName.replaceAll(/~/g, " "),
      deadline: newTaskDeadline,
      course_code: courseCode,
      max_automark: newTaskMaxAutomark,
      max_style_mark: newTaskMaxStyle,
      spec_url: newTaskSpecURL,
      file_restrictions: {
        required_files: requiredFilesArray,
        allowed_file_types: allowedFileTypesArray,
        max_file_size: newTaskMaxFileSize,
      },
      // late policy
      latePolicy: {
        percentDeductionPerDay,
        lateDayType,
        maxLateDays
      }
    };

    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      alertNotifier("Authorization token missing. Please log in again.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/course/create_task`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newTask),
        }
      );

      const result = await response.json();

      if (response.ok) {
        // On success, update task list and reset form fields
        setTasks((prevTasks) => [...prevTasks, result.task]);
        setNewTaskName("");
        setNewTaskDeadline("");
        setNewTaskMaxAutomark(0);
        setNewTaskMaxStyle(0);
        setNewTaskrequiredFiles("");
        setNewTaskAllowedFileTypes("");
        setNewTaskMaxFileSize(1);
        setPercentDeductionPerDay(20);
        setLateDayType('CALENDAR');
        setMaxLateDays(5);
        setNewTaskSpecURL("");
        setOpen(false);
        successNotifier("Task created successfully");
      } else {
        alertNotifier(result.error || "Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alertNotifier("An error occurred while creating the task");
    }
  };

  /* Confirm task deletion */
  const [isConfirmingTaskDeletion, setIsConfirmingTaskDeletion] =
    useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmTaskDeletionOpen, setConfirmTaskDeletionOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ name: string } | null>(
    null
  );

  const handleDeleteConfirmClose = () => {
    setTaskToDelete(null);
    setConfirmTaskDeletionOpen(false);
  };

  /* Triggers when red deletion button on task is clicked */
  const handleDeleteTask = (task: { name: string }) => {
    setTaskToDelete(task);
    setIsConfirmingTaskDeletion(true);
    setConfirmTaskDeletionOpen(true);
  };

  /* Triggers when "delete" button is clicked on confirmation modal */
  const deleteTask = async (task: { name: string }) => {
    if (!courseCode || !task!.name) {
      console.error("Course code or task name is missing.");
      return;
    }

    try {
      setIsConfirmingTaskDeletion(false);
      setDeleting(true);
      await auth.currentUser?.getIdToken().then((token) => {
        fetch(
          `${
            process.env.REACT_APP_BACKEND_URL
          }/api/course/delete_task/${courseCode}/${task.name.replaceAll(
            /~/g,
            " "
          )}`,
          {
            method: "DELETE",
            headers: {
              Authorization: "Bearer " + token,
            },
          }
        )
          .then((response) => response.json())
          .then((data) => {
            successNotifier(data.message);
            setDeleting(false);
            setTimeout(() => {
              handleDeleteConfirmClose();
            }, 1000);
          });
      });

      setTasks((prevTasks) => prevTasks.filter((t) => t.name !== task.name));
    } catch (error) {
      console.error("Error removing task:", error);
    }
  };

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewTaskName("");
    setNewTaskDeadline("");
    setNewTaskMaxAutomark(0);
    setNewTaskMaxStyle(0);
    setNewTaskrequiredFiles("");
    setNewTaskAllowedFileTypes("");
    setNewTaskMaxFileSize(1);
    // Reset late penalty fields
    setPercentDeductionPerDay(20);
    setLateDayType('CALENDAR');
    setMaxLateDays(5);
  };


  if (loading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: "80vh" }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (courseNotFound) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        sx={{ minHeight: "70vh", textAlign: "center", gap: 2 }}
      >
        <SentimentVeryDissatisfiedIcon
          sx={{ fontSize: 80, color: "#626a99" }}
        />
        <Typography variant="h6" sx={{ color: "#555" }}>
          You are not enrolled in this course.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {currentUserLevel === "student" ? (
        <StudentCourseView courseCode={courseCode!} tasks={tasks} />
      ) : currentUserLevel === "admin" ? (
        <>
          <AdminCourseView
            courseCode={courseCode!}
            tasks={tasks}
            onTaskClick={handleTaskClick}
            handleDeleteTask={handleDeleteTask}
            handleClickOpen={handleClickOpen}
            isDeadlinePassed={isDeadlinePassed}
            formatDeadline={formatDeadline}
            handleSettingsMenuOpen={handleSettingsMenuOpen}
            settingsAnchorEl={settingsAnchorEl}
            handleSettingsMenuClose={handleSettingsMenuClose}
            handleSettingsMenuItemClick={handleSettingsMenuItemClick}
          />
          <TaskSettingsModal
              editing={false}
              open={open}
              handleClose={handleClose}
              handleAddNewTask={handleAddNewTask}
              newTaskName={newTaskName}
              newTaskDeadline={newTaskDeadline}
              newTaskMaxAutomark={newTaskMaxAutomark}
              newTaskMaxStyle={newTaskMaxStyle}
              newTaskRequiredFiles={newTaskrequiredFiles}
              newTaskAllowedFileTypes={newTaskAllowedFileTypes}
              newTaskMaxFileSize={newTaskMaxFileSize}
              percentDeductionPerDay={percentDeductionPerDay}
              lateDayType={lateDayType}
              maxLateDays={maxLateDays}
              setNewTaskName={setNewTaskName}
              setNewTaskDeadline={setNewTaskDeadline}
              setNewTaskMaxAutomark={setNewTaskMaxAutomark}
              setNewTaskMaxStyle={setNewTaskMaxStyle}
              setNewTaskRequiredFiles={setNewTaskrequiredFiles}
              setNewTaskAllowedFileTypes={setNewTaskAllowedFileTypes}
              setNewTaskMaxFileSize={setNewTaskMaxFileSize}
              setPercentDeductionPerDay={setPercentDeductionPerDay}
              setLateDayType={setLateDayType}
              setMaxLateDays={setMaxLateDays}
              tasks={tasks}
              taskSpecURL={newTaskSpecURL}
              setTaskSpecURL={setNewTaskSpecURL}
          />
          <CourseSettingsModal
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
            method={settingsMethod}
          />
        </>
      ) : (
        <TutorCourseView
          courseCode={courseCode!}
          tasks={tasks}
          onTaskClick={handleTaskClick}
          isDeadlinePassed={isDeadlinePassed}
          formatDeadline={formatDeadline}
        />
      )}

      {/* Confirm Task Deletion Modal */}
      <Dialog
        open={confirmTaskDeletionOpen}
        onClose={handleDeleteConfirmClose}
        PaperProps={{
          sx: { maxWidth: "50vw", pb: "10px" },
        }}
      >
        {isConfirmingTaskDeletion ? (
          <>
            <DialogTitle sx={{ fontWeight: 600, fontSize: "1.25rem" }}>
              Do you really want to delete this task?
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: "16px", fontSize: "0.875rem" }}>
                Deleting this task (
                <Typography component="span" fontWeight={600}>
                  {taskToDelete?.name || "Unnamed Task"}
                </Typography>
                ) removes all data correlating to the task. Do you wish to
                proceed?
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ mr: "10px" }}>
              <Button
                onClick={handleDeleteConfirmClose}
                sx={{ fontWeight: 600, color: "#888" }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => deleteTask(taskToDelete!)}
                sx={{ fontWeight: 600 }}
              >
                Delete
              </Button>
            </DialogActions>
          </>
        ) : deleting ? (
          <DialogContent>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              sx={{ padding: { xs: "16px", sm: "24px" }, textAlign: "center" }}
            >
              <DialogTitle
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "1.25rem", sm: "1.5rem" },
                  marginBottom: "16px",
                }}
              >
                Deleting...
              </DialogTitle>
              <CircularProgress color="primary" sx={{ marginBottom: "16px" }} />
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
              >
                Please wait while we process your request.
              </Typography>
            </Box>
          </DialogContent>
        ) : (
          <DialogContent>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              sx={{ padding: { xs: "16px", sm: "24px" }, textAlign: "center" }}
            >
              <DialogTitle
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "1.25rem", sm: "1.5rem" },
                  color: "green",
                  marginBottom: "16px",
                }}
              >
                Deletion Successful!
              </DialogTitle>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
              >
                The item has been deleted successfully.
              </Typography>
            </Box>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
