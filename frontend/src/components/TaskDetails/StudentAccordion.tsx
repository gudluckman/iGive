import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  useMediaQuery,
  Grid,
  useTheme,
  TextField,
  IconButton,
  Tooltip,
  Switch,
  styled,
  alpha,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import EmergencyIcon from "@mui/icons-material/Emergency";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { StudentAccordionProps } from "../../interfaces";
import RuleIcon from "@mui/icons-material/Rule";
import DownloadForOfflineOutlinedIcon from "@mui/icons-material/DownloadForOfflineOutlined";
import EastOutlinedIcon from "@mui/icons-material/EastOutlined";
import EditIcon from "@mui/icons-material/Edit";
import { calculateTestResults } from "../../util/helper";
import { AutomarkResultChart } from "./AutomarkResultChart";
import { GradeDisplay } from "../GradeDisplay/GradeDisplay";

export const StudentAccordion = ({
  filteredStudents,
  isLoading,
  isInitialized,
  userLevel,
  maxTaskMark,
  taskMaxAutomark,
  taskMaxStyle,
  handleAutotestClick,
  handleRunAutomarkClick,
  handleViewAutomarkReport,
  handleModifyMarksClick,
  handleMarkReleaseChange,
  renderSubmissionDetails,
  handleDownloadFiles,
  handleSpecialConsiderationClick,
}: StudentAccordionProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:600px)");
  const isMediumScreen = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const GreenSwitch = styled(Switch)(({ theme }) => ({
    "& .MuiSwitch-switchBase.Mui-checked": {
      color: "#68D46C",
      "&:hover": {
        backgroundColor: alpha("#68D46C", theme.palette.action.hoverOpacity),
      },
    },
    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
      backgroundColor: "#68D46C",
    },
  }));

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: "auto",
        maxHeight: "100%",
        paddingRight: 1,
        "&::-webkit-scrollbar": {
          width: "8px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "#f1f1f1",
          borderRadius: "10px",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#888",
          borderRadius: "10px",
        },
        "&::-webkit-scrollbar-thumb:hover": {
          backgroundColor: "#555",
        },
      }}
    >
      {isLoading || !isInitialized ? (
        <LoadingSkeleton />
      ) : filteredStudents.length === 0 ? (
        <Typography
          variant="h6"
          sx={{
            textAlign: "left",
            marginTop: "16px",
            color: "#666",
            paddingLeft: 1,
          }}
        >
          No students found.
        </Typography>
      ) : (
        filteredStudents.map((student, index) => {
          const { passed, failed } = calculateTestResults(
            student.automark_report
          );

          return (
            <Accordion
              key={student.id || index}
              // expanded={expanded === student.id}
              // onChange={handleAccordionChange(student.id)}
              sx={{
                backgroundColor:
                  student.first_name === "N/A" || student.last_name === "N/A"
                    ? "#e0e0e5"
                    : "#C3CEE3",
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ borderBottom: "1px solid #ccc" }}
              >
                <Box display="flex" alignItems="center">
                  <Typography
                    variant="h6"
                    sx={{
                      marginRight: isMobile ? 0 : 1,
                      fontSize: isMobile ? "1rem" : "1.25rem",
                      textAlign: isMobile ? "center" : "left",
                    }}
                  >
                    {student.first_name !== "N/A" && student.last_name !== "N/A"
                      ? `${student.first_name} ${student.last_name} (${student.id})`
                      : `Inactive User (${student.id})`}
                  </Typography>

                  {(student.first_name === "N/A" ||
                    student.last_name === "N/A") && (
                    <PersonOffIcon
                      sx={{ fontSize: "1.6rem", ml: 0.5, color: "gray" }}
                    />
                  )}
                </Box>

                <Box sx={{ ml: "auto" }}>
                  <GradeDisplay
                    student={student}
                    maxTaskMark={maxTaskMark}
                    userLevel={userLevel}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ backgroundColor: "#f5f5f7", p: 3 }}>
                <Grid container spacing={4}>
                  {/* Automark and style capsule container start */}
                  {!isMobile ? (
                    <Grid item xs={12} lg={8}>
                      <Box
                        sx={{
                          backgroundColor: "#DEE0EB",
                          height: "auto",
                          boxSizing: "border-box",
                          borderRadius: "10px",
                          boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.25)",
                        }}
                      >
                        <Grid container>
                          {/* Automark Result Grid */}
                          <Grid
                            item
                            xs={6}
                            sx={{
                              height: { xs: "auto", sm: "100px" },
                              padding: 2,
                              borderRight: "0.5px solid #C0B4B4",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <Grid container alignItems="center">
                              {/* Left Side - 70% width */}
                              <Grid
                                item
                                xs={8}
                                sx={{
                                  padding: "0 8px",
                                }}
                              >
                                <Typography
                                  variant={
                                    isMobile
                                      ? "body1"
                                      : isMediumScreen
                                      ? "h6"
                                      : "subtitle1"
                                  }
                                  fontWeight="500"
                                  fontSize={{
                                    xs: "1rem",
                                    lg: "1.25rem",
                                  }}
                                >
                                  Automark Result
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  fontSize={{
                                    sm: "0.875rem",
                                    lg: "0.875rem",
                                  }}
                                >
                                  Last run:{" "}
                                  {student.automark_timestamp || "N/A"}
                                </Typography>
                              </Grid>

                              {/* Right Side - 30% width */}
                              <Grid
                                item
                                xs={4}
                                sx={{
                                  display: "flex",
                                  alignItems: "right",
                                  justifyContent: "right",
                                  padding: "0 8px",
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  fontSize={{
                                    xs: "1rem",
                                    lg: "1.25rem",
                                  }}
                                >
                                  {student.raw_automark === -1
                                    ? "N/A"
                                    : student.raw_automark}{" "}
                                  / {taskMaxAutomark}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Grid>

                          {/* Style Mark Grid */}
                          <Grid
                            item
                            xs={6}
                            sx={{
                              height: { xs: "auto", sm: "100px" },
                              padding: 2,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <Grid container alignItems="center">
                              {/* Left Side - 70% width */}
                              <Grid
                                item
                                xs={8}
                                sx={{
                                  padding: "0 8px",
                                }}
                              >
                                <Typography
                                  variant={
                                    isMobile
                                      ? "body1"
                                      : isMediumScreen
                                      ? "h6"
                                      : "subtitle1"
                                  }
                                  fontWeight="500"
                                  fontSize={{
                                    xs: "1rem",
                                    lg: "1.25rem",
                                  }}
                                >
                                  Style Mark
                                </Typography>
                              </Grid>

                              {/* Right Side - 30% width */}
                              <Grid
                                item
                                xs={4}
                                sx={{
                                  display: "flex",
                                  alignItems: "right",
                                  justifyContent: "right",
                                  padding: "0 8px",
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  fontSize={{
                                    xs: "1rem",
                                    lg: "1.25rem",
                                  }}
                                >
                                  {student.style === -1 ? "N/A" : student.style}{" "}
                                  / {taskMaxStyle}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Grid>

                          <Grid
                            item
                            xs={6}
                            sx={{
                              minHeight: { xs: "200px", md: "220px" },
                              padding: 2,
                              backgroundColor: "#fff",
                              borderRight: "0.5px solid #C0B4B4",
                              borderBottomLeftRadius: "10px",
                              position: "relative",
                            }}
                          >
                            {/* Automark Result Chart */}
                            <AutomarkResultChart
                              passed={passed}
                              failed={failed}
                            />

                            {/* Bottom elements container */}
                            <Box
                              display="flex"
                              flexDirection={{
                                sm: "column",
                                md: "column",
                                lg: "row",
                              }}
                              justifyContent={{ lg: "space-between" }}
                              position="absolute"
                              bottom={8}
                              left={8}
                              right={8}
                              mt={2}
                              mr={1}
                              ml={1}
                            >
                              {/* Open Report Link at Bottom Right */}
                              <Tooltip title="View Automark Report" arrow>
                                <Box
                                  sx={{
                                    ml: "auto",
                                    mb: "5px",
                                    display: "flex",
                                    alignItems: "center",
                                    textAlign: { xs: "center", sm: "right" },
                                    cursor: "pointer",
                                    color: "black",
                                    "&:hover": {
                                      color: "primary.main",
                                    },
                                  }}
                                  onClick={() =>
                                    handleViewAutomarkReport(student)
                                  }
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{ textDecoration: "underline" }}
                                  >
                                    Open report
                                  </Typography>
                                  <EastOutlinedIcon
                                    fontSize="small"
                                    sx={{ ml: 0.5 }}
                                  />{" "}
                                </Box>
                              </Tooltip>
                            </Box>
                          </Grid>

                          <Grid
                            item
                            xs={6}
                            sx={{
                              padding: 2,
                              backgroundColor: "#fff",
                              position: "relative",
                              borderBottomRightRadius: "10px",
                              height: "auto", // Adjust based on content
                            }}
                          >
                            {/* Comment Title */}
                            <Typography
                              variant="subtitle1"
                              fontWeight="500"
                              fontSize={{
                                xs: "0.8rem",
                                sm: "0.8rem",
                                md: "0.8rem",
                                lg: "0.8rem",
                              }}
                            >
                              Tutor Comments:
                            </Typography>

                            {/* Comment Text Field */}
                            <TextField
                              variant="outlined"
                              fullWidth
                              multiline
                              minRows={3}
                              maxRows={6}
                              value={student.comments || ""}
                              placeholder="No comments"
                              InputProps={{
                                readOnly: true,
                              }}
                              sx={{
                                marginTop: 1,
                                "& .MuiOutlinedInput-root": {
                                  backgroundColor: "#f9f9f9",
                                },
                                "& .MuiOutlinedInput-input": {
                                  fontSize: {
                                    xs: "0.5rem",
                                    sm: "0.6rem",
                                    md: "0.7rem",
                                    lg: "0.8rem",
                                  },
                                },
                              }}
                            />

                            {/* Edit Icon Positioned at Bottom Right */}
                            <Box
                              sx={{
                                position: "absolute",
                                bottom: 8,
                                right: 8,
                              }}
                            >
                              <IconButton
                                aria-label="edit"
                                onClick={() => handleModifyMarksClick(student)}
                                color="primary"
                              >
                                <Tooltip title="Edit Marks" arrow>
                                  <EditIcon
                                    sx={{
                                      color: "black",
                                      fontSize: {
                                        sm: "1.25rem",
                                        md: "1.5rem",
                                        lg: "1.75rem",
                                      },
                                    }}
                                  />
                                </Tooltip>
                              </IconButton>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>
                  ) : (
                    <>
                      <Grid item xs={12} lg={4}>
                        <Box display="flex" flexDirection="column">
                          <Box
                            sx={{
                              backgroundColor: "#DEE0EB",
                              height: "auto",
                              boxSizing: "border-box",
                              borderRadius: "10px",
                              boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.25)",
                            }}
                          >
                            <Grid container>
                              {/* Automark Result Grid */}
                              <Grid
                                item
                                xs={12}
                                sx={{
                                  height: "100px",
                                  padding: 2,
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <Grid container alignItems="center">
                                  {/* Left Side - 70% width */}
                                  <Grid
                                    item
                                    xs={8}
                                    sx={{
                                      padding: "0 8px",
                                    }}
                                  >
                                    <Typography
                                      variant={
                                        isMobile
                                          ? "body1"
                                          : isMediumScreen
                                          ? "h6"
                                          : "subtitle1"
                                      }
                                      fontWeight="500"
                                      fontSize={{
                                        xs: "1rem",
                                        lg: "1.25rem",
                                      }}
                                    >
                                      Automark Result
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      fontSize={{
                                        sm: "0.875rem",
                                        lg: "0.875rem",
                                      }}
                                    >
                                      Last run:{" "}
                                      {student.automark_timestamp || "N/A"}
                                    </Typography>
                                  </Grid>

                                  {/* Right Side - 30% width */}
                                  <Grid
                                    item
                                    xs={4}
                                    sx={{
                                      display: "flex",
                                      alignItems: "right",
                                      justifyContent: "right",
                                      padding: "0 8px",
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      fontSize={{
                                        xs: "1rem",
                                        lg: "1.25rem",
                                      }}
                                    >
                                      {student.raw_automark === -1
                                        ? "N/A"
                                        : student.raw_automark}{" "}
                                      / {taskMaxAutomark}
                                    </Typography>
                                  </Grid>
                                </Grid>
                              </Grid>
                              <Grid
                                item
                                xs={12}
                                sx={{
                                  minHeight: { xs: "200px", md: "220px" },
                                  padding: 2,
                                  backgroundColor: "#fff",
                                  borderRight: "0.5px solid #C0B4B4",
                                  borderBottomLeftRadius: "10px",
                                  position: "relative",
                                }}
                              >
                                {/* Automark Result Chart */}
                                <AutomarkResultChart
                                  passed={passed}
                                  failed={failed}
                                />

                                {/* Bottom elements container */}
                                <Box
                                  display="flex"
                                  flexDirection={{
                                    sm: "column",
                                    md: "column",
                                    lg: "row",
                                  }}
                                  justifyContent={{ lg: "space-between" }}
                                  position="absolute"
                                  bottom={8}
                                  left={8}
                                  right={8}
                                  mt={2}
                                  mr={1}
                                  ml={1}
                                >
                                  {/* Open Report Link at Bottom Right */}
                                  <Tooltip title="View Automark Report" arrow>
                                    <Box
                                      sx={{
                                        ml: "auto",
                                        mb: "5px",
                                        display: "flex",
                                        alignItems: "center",
                                        textAlign: {
                                          xs: "center",
                                          sm: "right",
                                        },
                                        cursor: "pointer",
                                        color: "black",
                                        "&:hover": {
                                          color: "primary.main",
                                        },
                                      }}
                                      onClick={() =>
                                        handleViewAutomarkReport(student)
                                      }
                                    >
                                      <Typography
                                        variant="body2"
                                        sx={{ textDecoration: "underline" }}
                                      >
                                        Open report
                                      </Typography>
                                      <EastOutlinedIcon
                                        fontSize="small"
                                        sx={{ ml: 0.5 }}
                                      />{" "}
                                    </Box>
                                  </Tooltip>
                                </Box>
                              </Grid>
                            </Grid>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} lg={4}>
                        <Box display="flex" flexDirection="column">
                          <Box
                            sx={{
                              backgroundColor: "#DEE0EB",
                              height: "auto",
                              boxSizing: "border-box",
                              borderRadius: "10px",
                              boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.25)",
                            }}
                          >
                            <Grid container>
                              {/* Style Mark Grid */}
                              <Grid
                                item
                                xs={12}
                                sx={{
                                  height: "100px",
                                  padding: 2,
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <Grid container alignItems="center">
                                  {/* Left Side - 70% width */}
                                  <Grid
                                    item
                                    xs={8}
                                    sx={{
                                      padding: "0 8px",
                                    }}
                                  >
                                    <Typography
                                      variant={
                                        isMobile
                                          ? "body1"
                                          : isMediumScreen
                                          ? "h6"
                                          : "subtitle1"
                                      }
                                      fontWeight="500"
                                      fontSize={{
                                        xs: "1rem",
                                        lg: "1.25rem",
                                      }}
                                    >
                                      Style Mark
                                    </Typography>
                                  </Grid>

                                  {/* Right Side - 30% width */}
                                  <Grid
                                    item
                                    xs={4}
                                    sx={{
                                      display: "flex",
                                      alignItems: "right",
                                      justifyContent: "right",
                                      padding: "0 8px",
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      fontSize={{
                                        xs: "1rem",
                                        lg: "1.25rem",
                                      }}
                                    >
                                      {student.style === -1
                                        ? "N/A"
                                        : student.style}{" "}
                                      / {taskMaxStyle}
                                    </Typography>
                                  </Grid>
                                </Grid>
                              </Grid>
                              <Grid
                                item
                                xs={12}
                                sx={{
                                  minHeight: { xs: "200px", md: "220px" },
                                  padding: 2,
                                  backgroundColor: "#fff",
                                  position: "relative",
                                  borderBottomRightRadius: "10px",
                                  height: "auto",
                                }}
                              >
                                {/* Comment Title */}
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="500"
                                  fontSize="0.8rem"
                                >
                                  Tutor Comments:
                                </Typography>

                                {/* Comment Text Field */}
                                <TextField
                                  variant="outlined"
                                  fullWidth
                                  multiline
                                  minRows={3}
                                  maxRows={6}
                                  value={student.comments || ""}
                                  placeholder="No comments"
                                  InputProps={{
                                    readOnly: true,
                                  }}
                                  sx={{
                                    marginTop: 1,
                                    "& .MuiOutlinedInput-root": {
                                      backgroundColor: "#f9f9f9",
                                    },
                                    "& .MuiOutlinedInput-input": {
                                      fontSize: "0.7rem",
                                    },
                                  }}
                                />

                                {/* Edit Icon Positioned at Bottom Right */}
                                <Box
                                  sx={{
                                    position: "absolute",
                                    bottom: 8,
                                    right: 8,
                                  }}
                                >
                                  <IconButton
                                    aria-label="edit"
                                    onClick={() =>
                                      handleModifyMarksClick(student)
                                    }
                                    color="primary"
                                  >
                                    <Tooltip title="Edit Marks" arrow>
                                      <EditIcon
                                        sx={{ color: "black" }}
                                        fontSize="medium"
                                      />
                                    </Tooltip>
                                  </IconButton>
                                </Box>
                              </Grid>
                            </Grid>
                          </Box>
                        </Box>
                      </Grid>
                    </>
                  )}
                  {/* Automark and style capsule container end */}

                  {/* Submitted files part start */}
                  <Grid item xs={12} lg={4}>
                    <Box display="flex" flexDirection="column">
                      <Box
                        sx={{
                          backgroundColor: "#DEE0EB",
                          height: "auto",
                          boxSizing: "border-box",
                          borderRadius: "10px",
                          boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.25)",
                        }}
                      >
                        <Grid container>
                          {/* Submitted File Grid */}
                          <Grid
                            item
                            xs={12}
                            sx={{
                              height: "100px",
                              padding: 2,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <Grid container alignItems="center">
                              {/* Left Side - 70% width */}
                              <Grid
                                item
                                xs={12}
                                sx={{
                                  padding: "0 8px",
                                }}
                              >
                                <Typography
                                  variant={
                                    isMobile
                                      ? "body1"
                                      : isMediumScreen
                                      ? "h6"
                                      : "subtitle1"
                                  }
                                  fontWeight="500"
                                  fontSize={{
                                    xs: "1rem",
                                    lg: "1.25rem",
                                  }}
                                >
                                  Submitted File(s)
                                </Typography>
                              </Grid>
                            </Grid>

                            {/*Run automark and autotest menu */}
                            <Tooltip title="Run Autotests" arrow>
                              <Button
                                sx={{
                                  textTransform: "none",
                                  minWidth: 0,
                                  padding: 0.5,
                                  color: "black",
                                }}
                                onClick={() => handleAutotestClick(student)}
                              >
                                <PublishedWithChangesIcon
                                  fontSize="medium"
                                  id={"autotest-" + student.id}
                                />
                              </Button>
                            </Tooltip>
                            <Tooltip title="Run Automarker" arrow>
                              <Button
                                sx={{
                                  textTransform: "none",
                                  minWidth: 0,
                                  padding: 0.5,
                                  color: "black",
                                }}
                                onClick={() =>
                                  handleRunAutomarkClick(student, index)
                                }
                              >
                                <RuleIcon fontSize="medium" />
                              </Button>
                            </Tooltip>
                            {userLevel === "admin" && (
                              <Tooltip title="Special Consideration" arrow>
                                <Button
                                  id={`special-consideration-${student.id}`}
                                  sx={{
                                    textTransform: "none",
                                    minWidth: 0,
                                    padding: 0.5,
                                    color: "black",
                                  }}
                                  onClick={() =>
                                    handleSpecialConsiderationClick(student.id)
                                  }
                                >
                                  <EmergencyIcon fontSize="medium" />
                                </Button>
                              </Tooltip>
                            )}
                          </Grid>

                          {/* Submitted Files Display + Release Marks Switch + Download Files */}
                          <Grid
                            item
                            xs={12}
                            sx={{ minHeight: { xs: "200px", md: "220px" } }}
                          >
                            {/* Submissions files display */}
                            <Grid
                              item
                              xs={12}
                              sx={{
                                height: "auto",
                                minHeight: { xs: "138px", md: "158px" },
                                padding: 2,
                                backgroundColor: "#fff",
                                position: "relative",
                              }}
                            >
                              {/* Submitted file details */}
                              <Box maxHeight="134px" overflow="auto">
                                {renderSubmissionDetails(student.submissions)}
                              </Box>
                            </Grid>
                            <Grid
                              item
                              xs={12}
                              sx={{
                                backgroundColor: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                px: 2,
                                pb: 1,
                                borderBottomLeftRadius: "10px",
                                borderBottomRightRadius: "10px",
                              }}
                            >
                              {/* Marks Released Switch */}
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "left",
                                  padding: "4px 4px",
                                  mb: "8px",
                                  minHeight: '40px'
                                }}
                              >
                                {userLevel === "admin" && (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Typography
                                      variant="subtitle1"
                                      sx={{
                                        fontSize: "14px",
                                        color: "#333",
                                        mr: 0,
                                      }}
                                    >
                                      Marks Released:
                                    </Typography>
                                    <GreenSwitch
                                      checked={student.mark_released}
                                      onChange={(event) =>
                                        handleMarkReleaseChange(
                                          index,
                                          event.target.checked
                                        )
                                      }
                                    />
                                  </Box>
                                )}
                              </Box>
                              {/* Download files button */}
                              <Tooltip title="Download Files" arrow>
                                <IconButton
                                  sx={{
                                    color: "#333",
                                    borderRadius: "8px",
                                    fontSize: {
                                      sm: "16px",
                                      lg: "20px",
                                    },
                                    "&:hover": {
                                      backgroundColor: "#fff",
                                    },
                                  }}
                                  onClick={() => handleDownloadFiles(student)}
                                >
                                  <DownloadForOfflineOutlinedIcon
                                    sx={{
                                      color: "black",
                                      fontSize: {
                                        sm: "1.25rem",
                                        md: "1.5rem",
                                        lg: "1.75rem",
                                      },
                                    }}
                                  />
                                </IconButton>
                              </Tooltip>
                            </Grid>
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>
                  </Grid>
                  {/* Submitted files part end */}
                </Grid>
              </AccordionDetails>
            </Accordion>
          );
        })
      )}
    </Box>
  );
};
