import {
  Box,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CircularProgress from "@mui/material/CircularProgress";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { blueGrey, grey } from "@mui/material/colors";
import { StudentCourseViewProps } from "../../interfaces/user.interface";
import { MakeSubmissionModal } from "../Modals/Student/MakeSubmissionModal";
import { auth } from "../../util/firebase_util";
import { useEffect, useState } from "react";
import { splitCourseCode } from "../../util/helper";
import { TaskResult, PastSubmission } from "../../interfaces/tasks.interface";
import { alertNotifier } from "../Notifier/ActionNotifier";
import { AutotestResultModal } from "../Modals/AutotestResultModal";
import { renderAutotestResults } from "../../util/renderUtil";
import { StudentPastSubmissionsModal } from "../Modals/Student/StudentPastSubmissionsModal";

export function StudentCourseView({
  courseCode,
  tasks,
}: StudentCourseViewProps) {
  const [loadingTaskResults, setLoadingTaskResults] = useState<boolean>(true);
  const [taskResults, setTaskResults] = useState<TaskResult[]>([]);

  /* States for file upload */
  const [selectedUploadTask, setSelectedUploadTask] = useState<string>("");
  const [selectedUploadTaskIndex, setSelectedUploadTaskIndex] = useState<number>(-1);
  const [submissionOpen, setSubmissionOpen] = useState<boolean>(false);

  /* States for viewing past submissions */
  const [selectedPastSubmissionsTask, setSelectedPastSubmissionsTask] = useState<string>("");
  const [pastSubmissionsModalOpen, setPastSubmissionsModalOpen] = useState<boolean>(false);
  const [loadingPastSubmissions, setLoadingPastSubmissions] = useState<boolean>(false);
  const [pastSubmissions, setPastSubmissions] = useState<PastSubmission[]>([]);

  /* States for running autotests */
  const [loadingAutotest, setLoadingAutotest] = useState<boolean>(false);
  const [autotestResult, setAutotestResult] = useState<any[] | null>(null);
  const [isAutotestModalOpen, setAutotestModalOpen] = useState<boolean>(false);

  const { term, course } = splitCourseCode(courseCode);
  const isMobile = useMediaQuery("(max-width:600px)");
  const notAvailableColour = grey[600];
  const notAvailableIconColour = blueGrey[300];

  const calculateGrades = (task: TaskResult) => {
    if (task.automark === null && task.style === null) {
      return {
        rawGrade: null,
        finalGrade: null,
      };
    }

    // Get raw marks
    const rawAutomark = task.raw_automark ?? 0;
    const styleMark = task.style ?? 0;

    // Raw grade combines raw automark and style
    const rawGrade = rawAutomark + styleMark;

    // Apply late penalty if exists
    if (task.latePenaltyPercentage) {
      // Calculate deduction only on raw automark (not style mark)
      // const deduction = rawAutomark * (task.latePenaltyPercentage / 100);

      // Calculate final grade: (raw_automark - penalty) + style
      const finalGrade = rawGrade * (1 - task.latePenaltyPercentage / 100);

      return {
        rawGrade,
        finalGrade: parseFloat(finalGrade.toFixed(1)),
      };
    }

    return {
      rawGrade,
      finalGrade: rawGrade,
    };
  };

  const taskDetailFont = {
    marginBottom: "8px",
    paddingBottom: "8px",
    borderBottom: "1px solid #ccc",
    fontSize: isMobile ? "12px" : "16px",
  };

  const notAvailableFont = {
    fontSize: isMobile ? "12px" : "14px",
    color: notAvailableColour,
  };

  // Load all the tasks along with the results on page load
  useEffect(() => {
    const fetchResults = async () => {
      if (!courseCode) {
        console.error("Course code is undefined");
        return;
      }

      setLoadingTaskResults(true);
      const newTaskResults: TaskResult[] = [];
      for (const task of tasks) {
        const nextTask: TaskResult = {
          ...task,
          files: [],
          lastSubmitted: "",
          automark: null,
          style: null,
          grade: null,
          maxMark: task.maxAutomark + task.maxStyleMark,
          comments: "",
          latePolicy: task.latePolicy
            ? {
              percentDeductionPerDay: task.latePolicy.percentDeductionPerDay,
              lateDayType: task.latePolicy.lateDayType,
              maxLateDays: task.latePolicy.maxLateDays,
            }
            : undefined,
          maxAutomark: 0
        };

        try {
          const params = new URLSearchParams();
          params.append("course_code", courseCode);
          params.append("task", task.name);

          const payload = {
            method: "GET",
            headers: {
              Authorization: "Bearer " + (await auth.currentUser?.getIdToken()),
            },
          };

          const query_result = await fetch(
            `${
              process.env.REACT_APP_BACKEND_URL
            }/api/task/query_result?${params.toString()}`,
            payload
          );

          const data = await query_result.json();
          const results = data.result;

          if (results !== "none") {
            // Store both raw and penalized marks
            nextTask.maxAutomark = task.maxAutomark;
            nextTask.raw_automark =
              results.raw_automark ?? results.automark ?? null; // Get raw mark (70)
            nextTask.automark = results.automark ?? null; // Get penalized mark (66)
            nextTask.style = results.style ?? null; // Get style mark (0)
            nextTask.lateDays = results.lateDays || 0;
            nextTask.latePenaltyPercentage = results.latePenaltyPercentage || 0;

            // Calculate the grades
            const { finalGrade } = calculateGrades(nextTask);
            nextTask.grade = finalGrade; // This will be 66.5

            nextTask.files = results.files || [];
            nextTask.lastSubmitted = results.lastSubmitted || "";
            nextTask.comments = results.comments || "";
          }
        } catch (e) {
          console.error("Error fetching results:", e);
        } finally {
          newTaskResults.push(nextTask);
        }
      }
      setTaskResults(newTaskResults);
      setLoadingTaskResults(false);
    };

    fetchResults();
  }, [courseCode, tasks]);

  interface RenderDeadlineProps {
    deadline: string;
  }

  const renderDeadline = ({ deadline }: RenderDeadlineProps) => {
    const date = new Date(deadline);
    const formattedDate = date.toLocaleDateString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <Box sx={{ ...taskDetailFont, display: "flex", alignItems: "center" }}>
        <AccessTimeIcon fontSize="small" sx={{ mr: "4px" }} />
        <Typography sx={{ fontWeight: "bold", mr: "4px" }}>Due:</Typography>
        {`${formattedDate} at ${formattedTime}`}
      </Box>
    );
  };

  const renderSubmittedFileDetails = (
    filenames: string[],
    lastSubmitted: string
  ) =>
    filenames.length === 0 ? (
      <Typography sx={taskDetailFont}>No files submitted</Typography>
    ) : (
      <Box sx={taskDetailFont}>
        <Typography sx={{ fontWeight: "bold" }}>Submitted files:</Typography>
        {filenames.map((filename, index) => (
          <Typography
            key={index}
            sx={{ fontSize: isMobile ? "12px" : "14px" }}
            noWrap
          >
            {filename}
          </Typography>
        ))}
        <Typography sx={{ mt: 1, fontSize: isMobile ? "12px" : "14px" }}>
          {lastSubmitted ? (
            <>
              Last submitted:
              <Box sx={{ fontStyle: "italic", display: "inline" }}>
                {/* This commented code out works if the submission time is in the isoformat time */}
                {/* {new Date(lastSubmitted).toLocaleDateString("en-AU", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                at{" "}
                {new Date(lastSubmitted).toLocaleTimeString("en-AU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })} */}
                {lastSubmitted}
              </Box>
            </>
          ) : (
            "Time of last submission not found"
          )}
        </Typography>
      </Box>
    );

  const updateFiles = (
    filenames: string[],
    submissionTime: string,
    index: number
  ) => {
    const prevTaskResults = [...taskResults];
    prevTaskResults[index].files = filenames;
    prevTaskResults[index].lastSubmitted = submissionTime;
    setTaskResults(prevTaskResults);
  };

  const renderAutomark = (
    automark: number | null,
    maxAutomark: number,
    task: TaskResult
  ) =>
    automark == null ? (
      <Box sx={taskDetailFont}>
        <Typography sx={{ fontWeight: "bold" }}>Automark:</Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <ErrorOutlineIcon
            fontSize="small"
            sx={{ mr: "4px", color: notAvailableIconColour }}
          ></ErrorOutlineIcon>
          <Typography sx={notAvailableFont}>Not available</Typography>
        </Box>
      </Box>
    ) : (
      <Box sx={taskDetailFont}>
        <Typography sx={{ fontWeight: "bold", display: "inline", mr: "4px" }}>
          Automark:
        </Typography>
        <Typography sx={{ display: "inline" }}>
          {`${automark} / ${maxAutomark}`}
        </Typography>
      </Box>
    );

  const renderStyleMark = (styleMark: number | null, maxStyleMark: number) =>
    styleMark == null ? (
      <Box sx={taskDetailFont}>
        <Typography sx={{ fontWeight: "bold" }}>Style Mark:</Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <ErrorOutlineIcon
            fontSize="small"
            sx={{ mr: "4px", color: notAvailableIconColour }}
          ></ErrorOutlineIcon>
          <Typography sx={notAvailableFont}>Not available</Typography>
        </Box>
      </Box>
    ) : (
      <Box sx={taskDetailFont}>
        <Typography sx={{ fontWeight: "bold", display: "inline", mr: "4px" }}>
          Style mark:
        </Typography>
        <Typography sx={{ display: "inline" }}>
          {`${styleMark} / ${maxStyleMark}`}
        </Typography>
      </Box>
    );

  const renderComments = (comments: string) =>
    comments ? (
      <Box
        sx={{
          marginBottom: "12px",
          fontSize: isMobile ? "12px" : "16px",
        }}
      >
        <Typography sx={{ fontWeight: "bold", display: "inline", mr: "4px" }}>
          Comments:
        </Typography>
        <Typography sx={{ display: "inline" }}>{comments}</Typography>
      </Box>
    ) : (
      <Box
        sx={{
          marginBottom: "12px",
          fontSize: isMobile ? "12px" : "16px",
        }}
      >
        <Typography sx={{ fontWeight: "bold" }}>Comments:</Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <ErrorOutlineIcon
            fontSize="small"
            sx={{ mr: "4px", color: notAvailableIconColour }}
          ></ErrorOutlineIcon>
          <Typography sx={notAvailableFont}>Not available</Typography>
        </Box>
      </Box>
    );

  const renderLatePolicy = (task: TaskResult) => (
    <Box sx={taskDetailFont}>
      <Typography sx={{ fontWeight: "bold", color: "#d32f2f" }}>
        Late Submission Policy:
      </Typography>
      {task.latePolicy ? (
        <Box sx={{ ml: 2, mt: 1 }}>
          {/* Show late submission rules */}
          <Typography sx={{ fontSize: isMobile ? "12px" : "14px" }}>
            • {task.latePolicy.percentDeductionPerDay}% deduction per{" "}
            {task.latePolicy.lateDayType.toLowerCase()} day
          </Typography>
          <Typography sx={{ fontSize: isMobile ? "12px" : "14px" }}>
            • Maximum {task.latePolicy.maxLateDays} days late allowed
          </Typography>

          {/* Show current submission status if it's late */}
          {isSubmissionLate(task.deadline) &&
          task.lastSubmitted &&
          task.latePenaltyPercentage ? (
            <Box
              sx={{
                mt: 1,
                p: 1,
                backgroundColor: "rgba(211, 47, 47, 0.1)",
                borderRadius: 1,
                border: "1px solid rgba(211, 47, 47, 0.3)",
              }}
            >
              <Typography
                sx={{
                  color: "#d32f2f",
                  fontWeight: "bold",
                  fontSize: isMobile ? "12px" : "14px",
                }}
              >
                Current submission is {task.lateDays} days late (Penalty:{" "}
                {task.latePenaltyPercentage}%)
              </Typography>
            </Box>
          ) : isSubmissionLate(task.deadline) && !task.lastSubmitted ? (
            <Box
              sx={{
                mt: 1,
                p: 1,
                backgroundColor: "#fff3e0",
                borderRadius: 1,
                border: "1px solid #ffe0b2",
              }}
            >
              <Typography
                sx={{
                  color: "#e65100",
                  fontSize: isMobile ? "12px" : "14px",
                }}
              >
                • Late submissions allowed with penalties applied
              </Typography>
            </Box>
          ) : (
            <Typography
              sx={{
                mt: 1,
                color: "#2e7d32",
                fontWeight: "500",
                fontSize: isMobile ? "12px" : "14px",
              }}
            >
              ✓ On-time submission window open
            </Typography>
          )}
        </Box>
      ) : (
        <Typography
          sx={{ fontSize: isMobile ? "12px" : "14px", ml: 2, color: "#666" }}
        >
          Late submission policy not set
        </Typography>
      )}
    </Box>
  );

  const isSubmissionLate = (deadline: string) => {
    const now = new Date();
    const dueDate = new Date(deadline);
    return now > dueDate;
  };

  const handleOpenSubmission = (taskName: string, index: number) => {
    setSelectedUploadTask(taskName);
    setSelectedUploadTaskIndex(index);
    setSubmissionOpen(true);
  };

  const handleCloseSubmission = () => {
    setSelectedUploadTask("");
    setSelectedUploadTaskIndex(-1);
    setSubmissionOpen(false);
  };

  const handleOpenPastSubmissionsModal = async (taskName: string) => {
    setPastSubmissionsModalOpen(true);
    setLoadingPastSubmissions(true);
    setSelectedPastSubmissionsTask(taskName);

    // Load in all the submissions for this task
    const params = new URLSearchParams();
    params.append("course_code", courseCode);
    params.append("task", taskName);

    const payload = {
      method: "GET",
      headers: {
        Authorization: "Bearer " + (await auth.currentUser?.getIdToken()),
      },
    };

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/task/check_submissions?${params.toString()}`,
        payload
      );

      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();
      const sortedEntries = Object.entries(data.submissions).sort((a, b) => {
        // Map Python's timestamp format to JS date format.
        const dateA = new Date(a[0].replace(/(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/, '$2/$1/$3 $4:$5:$6')).getTime();
        const dateB = new Date(b[0].replace(/(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/, '$2/$1/$3 $4:$5:$6')).getTime();

        return dateB - dateA;
      });
      const sortedSubmissions: any = Object.fromEntries(sortedEntries);

      const submissions: PastSubmission[] = [];
      for (const timestamp in sortedSubmissions) {
        const filePaths: string[] = sortedSubmissions[timestamp];

        submissions.push({
          timestamp,
          filePaths
        });
      }

      setPastSubmissions(submissions);
      setLoadingPastSubmissions(false);
    } catch (e) {
      console.error(e);
    }
  }

  const handleClosePastSubmissionsModal = () => {
    setPastSubmissionsModalOpen(false);
    setSelectedPastSubmissionsTask("");
    setPastSubmissions([]);
  }

  const handleOpenAutotestModal = async (task: string, timestamp: string) => {
    setLoadingAutotest(true);
    setAutotestResult(null);

    const payload = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
      },
      body: JSON.stringify({
        course_code: courseCode,
        task: task.replaceAll(/~/g, " "),
        timestamp: timestamp,
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
    } catch (e: any) {
      alertNotifier(e.message);
    } finally {
      setLoadingAutotest(false);
      setAutotestModalOpen(true);
    }
  };

  const handleCloseAutotestModal = () => {
    setAutotestModalOpen(false);
  };

  return (
    <>
      <Box sx={{ p: isMobile ? 1 : 2 }}>
        <Box
          display="flex"
          flexDirection={isMobile ? "column" : "row"} // Stack on mobile
          justifyContent="space-between"
          alignItems={isMobile ? "flex-start" : "center"}
          sx={{ marginBottom: "24px", gap: isMobile ? 1 : 0 }}
        >
          {/* Course Title on the Left */}
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

        {/* Tasks section */}
        {loadingTaskResults ? (
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
              Loading tasks...
            </Typography>
          </Box>
        ) : taskResults.length === 0 ? (
          <Typography
            variant="h6"
            sx={{ marginBottom: "16px", color: "#888", textAlign: "left" }}
          >
            No tasks created at the moment.
          </Typography>
        ) : (
          /* Display all the tasks */
          taskResults.map((task: TaskResult, index) => {
            const { finalGrade } = calculateGrades(task);

            return (
              <Accordion
                key={index}
                sx={{
                  marginBottom: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  backgroundColor: "#e0e0e5",
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ borderBottom: "1px solid #ccc" }}
                >
                  <Typography variant="h5" noWrap>{task.name}</Typography>
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{
                      marginLeft: "auto",
                      marginRight: isMobile ? "8px" : "12px",
                      my: "auto",
                      fontWeight: 400,
                      fontSize: isMobile ? "16px" : "24px",
                    }}
                  >
                    {finalGrade !== null ? finalGrade.toFixed(1) : "N/A"}
                    {" / "}
                    100
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ backgroundColor: "#f5f5f7" }}>
                  <Box
                    display="flex"
                    justifyContent={isMobile ? "center" : "space-between"}
                    flexDirection={isMobile ? "column" : "row"}
                    alignItems={isMobile ? "flex-start" : "flex-start"}
                    sx={{
                      padding: "16px",
                      backgroundColor: "#e0e0e0",
                      borderRadius: "8px",
                    }}
                  >
                    {/* Left Section: Submitted Files, marks and comments */}
                    <Box sx={{ flex: 1, width: isMobile ? "100%" : "80%" }}>
                      {renderDeadline({ deadline: task.deadline })}
                      {/* Add warning if current time is past deadline */}
                      {isSubmissionLate(task.deadline) && !task.lastSubmitted && (
                        <Box
                          sx={{
                            backgroundColor: "#ffebee",
                            p: 2,
                            borderRadius: 1,
                            mb: 2,
                            border: "1px solid #ef5350",
                          }}
                        >
                          <Typography
                            sx={{ color: "#d32f2f", fontWeight: "500" }}
                          >
                            Warning: This task is past its deadline. Late
                            penalties will apply.
                          </Typography>
                        </Box>
                      )}
                      {renderLatePolicy(task)}
                      {renderSubmittedFileDetails(task.files, task.lastSubmitted)}
                      {renderAutomark(task.raw_automark!, task.maxAutomark, task)}
                      {renderStyleMark(task.style, task.maxStyleMark)}
                      {renderComments(task.comments)}
                    </Box>

                    {/* Right Section: Submission and Autotest Buttons */}
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems={isMobile ? "center" : "flex-start"} // Center on mobile
                      sx={{
                        pl: isMobile ? 0 : "16px",
                        gap: 1,
                      }}
                    >
                      <Button
                        variant="contained"
                        onClick={() => handleOpenSubmission(task.name, index)}
                        sx={{
                          backgroundColor: "#2c3e50",
                          width: "100%",
                        }}
                        id={`make-submission-${task.name}`}
                      >
                        Make Submission
                      </Button>
                      <Button
                        variant="contained"
                        sx={{
                          backgroundColor: "#2c3e50",
                          width: "100%",
                        }}
                        onClick={() => handleOpenPastSubmissionsModal(task.name)}
                        disabled={task.files.length === 0}
                      >
                        Past Submissions
                      </Button>
                      <Button
                        variant="contained"
                        sx={{
                          backgroundColor: "#2c3e50",
                          width: "100%",
                        }}
                        onClick={() =>
                          handleOpenAutotestModal(task.name, task.lastSubmitted)
                        }
                        disabled={!task.lastSubmitted}
                        id={`run-autotests-${task.name}`}
                      >
                        Run Autotests
                      </Button>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            )
          })
        )}
      </Box>

      {/* Modal for File Upload */}
      <MakeSubmissionModal
        open={submissionOpen}
        onClose={handleCloseSubmission}
        courseCode={courseCode}
        taskName={selectedUploadTask}
        taskIndex={selectedUploadTaskIndex}
        updateFiles={updateFiles}
      />

      {/* Modal for viewing past submissions */}
      <StudentPastSubmissionsModal
        open={pastSubmissionsModalOpen}
        onClose={handleClosePastSubmissionsModal}
        courseCode={courseCode}
        taskName={selectedPastSubmissionsTask}
        loadingPastSubmissions={loadingPastSubmissions}
        pastSubmissions={pastSubmissions}
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
        isAutotest={true}
        autotestResult={autotestResult}
        renderAutotestResults={renderAutotestResults}
      />
    </>
  );
}
