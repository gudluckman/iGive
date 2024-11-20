import React, { useState, MouseEvent, useEffect } from "react";
import {
  Box,
  Menu,
  MenuItem,
  useMediaQuery,
  IconButton,
  Tooltip,
  Collapse,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  CircularProgress,
  styled,
  alpha,
  Switch,
} from "@mui/material";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import SettingsIcon from "@mui/icons-material/Settings";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { AdminActionsProps } from "../../interfaces/action.interface";
import { auth } from "../../util/firebase_util";
import { deleteAutomark } from "../../services/autotestService";
import { updateMarkReleaseStatus } from "../../services/resultService";
import { promiseNotifier, successNotifier } from "../Notifier/ActionNotifier";
import { SpinningIconButton } from "../../util/helper";
import BatchAutomarkModal from "../Modals/Admin/BatchAutomarkModal";

export const AdminActions: React.FC<AdminActionsProps> = ({
  courseCode,
  task,
  students,
  fetchStudents,
  setStudents,
  setFilteredStudents,
  handleGenerateCSV,
  handleSettingsMenuOpen,
  handleAutotestCenterClick,
  handleTaskSettingsClick,
  handleToleranceSettingsClick,
  settingsAnchorEl,
  handleSettingsMenuClose,
  onSubmissionRateClick,
  userLevel,
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasMarkBeenReleased, setHasMarkBeenReleased] = useState(false);
  const [releaseAllMarks, setReleaseAllMarks] =
    useState<boolean>(hasMarkBeenReleased);
  const [isAutomarkOpen, setIsAutomarkOpen] = useState(false);
  const [isTogglingRelease, setIsTogglingRelease] = useState(false);

  const checkMarkReleaseStatus = () => {
    const studentsWithValidSubmissions = students.filter((student) => {
      return Object.keys(student.submissions["submissions"]).length > 0;
    });

    const anyMarksReleased = studentsWithValidSubmissions.some(
      (student) => student.mark_released === true
    );

    setHasMarkBeenReleased(anyMarksReleased);
    return anyMarksReleased;
  };

  useEffect(() => {
    const anyMarksReleased = checkMarkReleaseStatus();
    setReleaseAllMarks(anyMarksReleased);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students]);

  useEffect(() => {
    // Directly get the mark release status by calling checkMarkReleaseStatus
    const allMarksReleased = checkMarkReleaseStatus();
    setReleaseAllMarks(allMarksReleased);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students]);

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setIsSpinning(true);
    handleSettingsMenuOpen(event);

    setTimeout(() => {
      setIsSpinning(false);
    }, 500);
  };

  const [actionAnchorEl, setActionAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const openActionMenu = (event: MouseEvent<HTMLElement>) =>
    setActionAnchorEl(event.currentTarget);
  const closeActionMenu = () => setActionAnchorEl(null);

  const [isAutomarkModalOpen, setIsAutomarkModalOpen] = useState(false);

  const handleRunAutomarker = () => {
    setIsAutomarkModalOpen(true);
    closeActionMenu();
  };

  const handleAutomarkComplete = async () => {
    const newStudents = await fetchStudents(courseCode, task);
    setStudents(newStudents);
    setFilteredStudents(newStudents);
    successNotifier("Automark runs all finished!");
  };

  const handleEraseAutomarks = async () => {
    const token = (await auth.currentUser?.getIdToken()) || "";

    const deletePromise = Promise.all(
      students
        .filter((student) => student.automark_timestamp.trim().length > 3)
        .map((student) =>
          deleteAutomark(
            token,
            courseCode,
            task.replaceAll("~", " "),
            student.id
          )
        )
    );

    promiseNotifier(deletePromise, {
      pending: "Deleting automarks...",
      success: "All automarks deleted!",
      error: "Failed to delete automarks. Please try again!",
    });

    try {
      await deletePromise;
      const newStudents = await fetchStudents(courseCode, task);
      setStudents(newStudents);
      setFilteredStudents(newStudents);
    } catch (error) {
      console.error("Error during automark deletion:", error);
    }
  };

  const handleToggleMarksRelease = async (release: boolean) => {
    setIsTogglingRelease(true); // Start loading
    const token = (await auth.currentUser?.getIdToken()) || "";
    try {
      await Promise.all(
        students
          .filter(
            (student) =>
              Object.keys(student.submissions["submissions"]).length > 0
          )
          .map((student) =>
            updateMarkReleaseStatus(
              token,
              courseCode,
              task.replaceAll("~", " "),
              student.id,
              release
            )
          )
      );
      const newStudents = await fetchStudents(courseCode, task);
      setStudents(newStudents);
      setFilteredStudents(newStudents);
      successNotifier(
        release ? "All marks released!" : "All marks not released!"
      );
      setReleaseAllMarks(release);
    } catch (error) {
      console.error("Failed to toggle marks release:", error);
    } finally {
      setIsTogglingRelease(false);
    }
  };

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
    <Box display="flex" justifyContent="space-between" alignItems="center">
      {/* Marks Released Toggle Switch */}
      {userLevel === "admin" && (
        <Box display="flex" alignItems="center" gap={1} sx={{ mr: 2 }}>
          <Typography
            variant="body1"
            sx={{
              color: releaseAllMarks ? "green" : "grey",
              fontSize: { sm: "14px", md: "16px", lg: "18px" },
              textAlign: { sm: "right" },
            }}
          >
            {releaseAllMarks ? "MARKS RELEASED" : "MARKS NOT RELEASED"}
          </Typography>
          <Tooltip title="Overall Mark Status" arrow>
            <GreenSwitch
              checked={releaseAllMarks}
              onChange={(event) =>
                handleToggleMarksRelease(event.target.checked)
              }
              disabled={isTogglingRelease}
              sx={{ fontSize: isMobile ? "1.7rem" : "2rem" }}
            />
          </Tooltip>
          {isTogglingRelease && (
            <CircularProgress size={20} sx={{ color: "primary.main" }} />
          )}
        </Box>
      )}

      {/* Admin Action Icon Button */}
      {userLevel === "admin" && (
        <Tooltip title="Admin Actions" arrow>
          <IconButton onClick={openActionMenu} sx={{ color: "#2c3e50" }}>
            <AdminPanelSettingsIcon
              sx={{ fontSize: isMobile ? "1.7rem" : "2rem" }}
              id="admin-actions"
            />
          </IconButton>
        </Tooltip>
      )}

      {/* Admin Action Dropdown Menu (AUTOMARK) */}
      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={closeActionMenu}
      >
        <MenuItem onClick={handleGenerateCSV} disabled={!courseCode || !task}>
          Generate CSV
        </MenuItem>
        <MenuItem
          onClick={() => setIsAutomarkOpen(!isAutomarkOpen)}
          sx={{ display: "flex", justifyContent: "space-between" }}
        >
          Automarks
          {isAutomarkOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
        </MenuItem>
        <Collapse in={isAutomarkOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton onClick={handleRunAutomarker} sx={{ pl: 4 }}>
              <ListItemText primary="Run All" />
            </ListItemButton>
            <ListItemButton onClick={handleEraseAutomarks} sx={{ pl: 4 }}>
              <ListItemText primary="Erase All" />
            </ListItemButton>
          </List>
        </Collapse>
      </Menu>

      {/* Automark Modal */}
      <BatchAutomarkModal
        open={isAutomarkModalOpen}
        onClose={() => setIsAutomarkModalOpen(false)}
        students={students}
        courseCode={courseCode}
        task={task}
        onComplete={handleAutomarkComplete}
        auth={auth}
      />

      {/* Settings Icon */}
      {(userLevel === "tutor" || userLevel === "admin") && (
        <Tooltip title="Task Settings" arrow>
          <SpinningIconButton
            sx={{ color: "#2c3e50" }}
            onClick={handleSettingsClick}
            className={isSpinning ? "spinning" : ""}
          >
            <SettingsIcon sx={{ fontSize: isMobile ? "1.7rem" : "2rem" }} />
          </SpinningIconButton>
        </Tooltip>
      )}

      {/* Settings Dropdown Menu */}
      <Menu
        anchorEl={settingsAnchorEl}
        open={Boolean(settingsAnchorEl)}
        onClose={handleSettingsMenuClose}
      >
        {[
          {
            label: "General Task Settings",
            onClick: handleTaskSettingsClick,
            roles: ["admin"],
          },
          {
            label: "Autotest Center",
            onClick: handleAutotestCenterClick,
            roles: ["admin"],
          },
          {
            label: "View Submission Rate",
            onClick: () => {
              onSubmissionRateClick();
              handleSettingsMenuClose();
            },
            roles: ["admin", "tutor"],
          },
          {
            label: "Tolerance Settings",
            onClick: handleToleranceSettingsClick,
            roles: ["admin"],
          },
        ]
          .filter((item) => item.roles.includes(userLevel))
          .map((item, index) => (
            <MenuItem key={index} onClick={item.onClick}>
              {item.label}
            </MenuItem>
          ))}
      </Menu>
    </Box>
  );
};
