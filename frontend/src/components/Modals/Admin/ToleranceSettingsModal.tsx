import { alpha, Box, Button, Dialog, DialogContent, DialogTitle, IconButton, styled, Switch, Typography } from "@mui/material";
import { ToleranceSettingsModalProps } from "../../../interfaces/modal.interface";
import CloseIcon from '@mui/icons-material/Close';
import { useEffect, useState } from "react";
import { auth } from "../../../util/firebase_util";
import { alertNotifier, successNotifier } from "../../Notifier/ActionNotifier";

const TOLERANCE_FILTER_IGNORE_TRAILING_NEWLINE = "Ignore Trailing Newline"
const TOLERANCE_FILTER_IGNORE_TRAILING_WHITESPACES = "Ignore Trailing Whitespaces"
const TOLERANCE_FILTER_IGNORE_WHITESPACES_AMOUNT = "Ignore Whitespaces Amount"
const TOLERANCE_FILTER_IGNORE_CASE_DIFFERENCES = "Ignore Case Differences"

const BlueSwitch = styled(Switch)(({ theme }) => ({
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: "#2C3C5F",
    '&:hover': {
      backgroundColor: alpha("#2C3C5F", theme.palette.action.hoverOpacity),
    },
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: "#2C3C5F",
  },
}));

interface ToleranceFilterModuleProps {
  toleranceType: string;
  state: boolean;
}

export function ToleranceSettingsModal({
  courseCode,
  task,
  toleranceSettingsOpen,
  handleToleranceSettingsClose
}: ToleranceSettingsModalProps) {

  /* State variables controling states of each tolerance filter */
  const [trailingNewline, setTrailingNewline] = useState(true);
  const [trailingWhitespaces, setTrailingWhitespaces] = useState(true);
  const [whitespacesAmount, setWhitespacesAmount] = useState(false);
  const [caseDifferences, setCaseDifferences] = useState(false);

  useEffect(() => {
    const fetchToleranceFilters = async () => {
      if (toleranceSettingsOpen) {
        try {
          const token = await auth.currentUser?.getIdToken();
          const res = await fetch(
            `${process.env.REACT_APP_BACKEND_URL}/api/task/get_tolerance_filters?course_code=${courseCode}&task=${encodeURIComponent(task.replaceAll(/~/g, " "))}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const data = await res.json();
          if (res.ok && data) {
            setTrailingNewline(data["trailingNewline"]);
            setTrailingWhitespaces(data["trailingWhitespaces"]);
            setWhitespacesAmount(data["whitespacesAmount"]);
            setCaseDifferences(data["caseDifferences"]);
          } else {
            alertNotifier("Failed to fetch tolerance filters");
          }
        } catch (error) {
          alertNotifier("An error occurred while fetching tolerance filters.");
        }
      }
    }

    fetchToleranceFilters();
  }, [courseCode, task, toleranceSettingsOpen]);

  const handleToleranceFilterSwitch = (e: React.ChangeEvent<HTMLInputElement>, toleranceType: string) => {
    if (toleranceType === TOLERANCE_FILTER_IGNORE_TRAILING_NEWLINE) {
      setTrailingNewline(e.target.checked);
    } else if (toleranceType === TOLERANCE_FILTER_IGNORE_TRAILING_WHITESPACES) {
      setTrailingWhitespaces(e.target.checked);
    } else if (toleranceType === TOLERANCE_FILTER_IGNORE_WHITESPACES_AMOUNT) {
      setWhitespacesAmount(e.target.checked);
    } else if (toleranceType === TOLERANCE_FILTER_IGNORE_CASE_DIFFERENCES) {
      setCaseDifferences(e.target.checked);
    }
  }

  const handleConfirm = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/task/set_tolerance_filters?courseCode=${courseCode}&task=${encodeURIComponent(task.replaceAll(/~/g, " "))}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            "trailingNewline": trailingNewline,
            "trailingWhitespaces": trailingWhitespaces,
            "whitespacesAmount": whitespacesAmount,
            "caseDifferences": caseDifferences
          })
        }
      );
      if (!res.ok) {
        alertNotifier("HTTP Error: Failed to set tolerance filters");
      } else {
        successNotifier("Tolerance filter settings saved.");
      }
    } catch (error) {
      alertNotifier("An error occurred while setting tolerance filters.");
    }
  }

  function ToleranceFilterModule({ toleranceType, state }: ToleranceFilterModuleProps) {
    return (
      <Box sx={{ my: "20px", mx: "10px" }}>
        <Box display="flex">
          <Box display="flex" flexDirection="column" justifyContent="center">
            <Typography sx={{ fontWeight: 400 }}>
              {toleranceType}
            </Typography>
          </Box>
          <BlueSwitch
            id = {toleranceType}
            defaultChecked={state}
            sx={{ ml: "auto", color: "#F4F3F8" }}
            onChange={(e) => handleToleranceFilterSwitch(e, toleranceType)}
          />
        </Box>
      </Box>
    )
  }

  return (
    <Dialog
      open={toleranceSettingsOpen}
      onClose={handleToleranceSettingsClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { bgcolor: "#F4F3F8", borderRadius: "10px" },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: 600,
          fontSize: "1.25rem",
          bgcolor: "#2C3C5F",
          height: "30px",
          color: "white",
        }}
      >
        Tolerance Filters
        <IconButton onClick={handleToleranceSettingsClose} sx={{ color: "white" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ my: "20px", mx: "10px" }}>
        <Typography sx={{ fontSize: "16px", fontWeight: 500, mb: "20px" }}>
          Please select the error tolerance toggles you would like to be applied for the autotests in this task.
        </Typography>
        </Box>
        <ToleranceFilterModule toleranceType={TOLERANCE_FILTER_IGNORE_TRAILING_NEWLINE} state={trailingNewline}/>
        <ToleranceFilterModule toleranceType={TOLERANCE_FILTER_IGNORE_TRAILING_WHITESPACES} state={trailingWhitespaces}/>
        <ToleranceFilterModule toleranceType={TOLERANCE_FILTER_IGNORE_WHITESPACES_AMOUNT} state={whitespacesAmount}/>
        <ToleranceFilterModule toleranceType={TOLERANCE_FILTER_IGNORE_CASE_DIFFERENCES} state={caseDifferences}/>
        <Box display="flex" flexDirection="row-reverse" sx={{ mt: "20px" }}>
          <Button variant="contained" sx={{ bgcolor: "#2C3C5F" }} onClick={handleConfirm}>Confirm</Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}