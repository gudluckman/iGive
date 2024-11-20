import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import { AutotestModalProps } from "../../interfaces";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export function AutotestResultModal({
  open,
  handleClose,
  isAutotest,
  autotestResult,
  renderAutotestResults,
  studentId,
}: AutotestModalProps) {
  const isMobile = useMediaQuery("(max-width:600px)");
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      {/* Modal for displaying each student's autotest result of a task */}
      <DialogTitle
        sx={{
          backgroundColor: "grey.100",
          borderBottom: "1px solid grey.300",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: 600,
          fontSize: isMobile ? "1rem" : "1.25rem",
          height: "30px",
        }}
      >
        {isAutotest ? "Autotest" : "Automark"} Results{" "}
        {studentId && " - " + studentId}
        <IconButton onClick={handleClose} id={"close-autotest-result-modal-button"}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          fontSize: "0.875rem",
          padding: 0,
          backgroundColor: "#fafafa",
        }}
      >
        {/* Fixed Header with Passed Test Cases Count */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            backgroundColor: "#fafafa",
            borderBottom: "1px solid #e0e0e0",
            padding: "16px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <CheckCircleIcon sx={{ marginRight: "8px", color: "#4caf50" }} />
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: isMobile ? "0.9rem" : "1rem",
            }}
          >
            You've passed {autotestResult?.filter((res) => res.passed).length}/
            {autotestResult?.length} test cases.
          </Typography>
        </Box>

        {/* Scrollable Content for Test Results */}
        <Box
          sx={{
            maxHeight: "60vh",
            overflowY: "auto",
            padding: "10px",
            backgroundColor: "#fff",
            borderRadius: "8px",
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)",
            margin: "10px",
          }}
        >
          {autotestResult && renderAutotestResults(autotestResult)}
        </Box>
      </DialogContent>
      <DialogActions sx={{ padding: "16px" }}>
        <Button
          id={"close-autotest-result-modal-button"}
          onClick={handleClose}
          sx={{ fontWeight: 600, color: "#1a73e8" }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
