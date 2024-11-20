import { StudentPastSubmissionsModalProps } from "../../../interfaces/modal.interface"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  CircularProgress,
  IconButton,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AccordionActions,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { auth } from "../../../util/firebase_util";
import { alertNotifier } from "../../Notifier/ActionNotifier";


export function StudentPastSubmissionsModal ({
  open,
  onClose,
  courseCode,
  taskName,
  loadingPastSubmissions,
  pastSubmissions
} : StudentPastSubmissionsModalProps) {

  const downloadFilesFromSubmission = async (filePaths: string[]) => {
    for (const fileStorPath of filePaths) {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/task/download_submission_file`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
          },
          body: JSON.stringify({
            path: fileStorPath,
          }),
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download =
          fileStorPath.split("/").pop() || "backend-error";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alertNotifier(
          "Failed to download file: " + response.statusText
        );
      }
    }
  }

  const renderFileName = (filePath: string) => {
    const directories = filePath.split('/');
    return directories[directories.length - 1];
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: "80vw", maxWidth: "700px", maxHeight: "80vh" },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "grey.100",
          borderBottom: "1px solid grey.300",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: 600,
          fontSize: "1.25rem",
          height: "30px",
        }}
      >
        <Box style={{ display: "flex", alignItems: "center" }}>
          <FileDownloadIcon  sx={{ marginRight: "8px" }} />
          {taskName} past submissions
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ mt: 1, p: 2, overflowX: "hidden", minHeight: "30vh" }}>
        {loadingPastSubmissions ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              height: "250px",
              textAlign: "center"
            }}
          >
            <CircularProgress sx={{ mb: 2 }}/>
            Loading past submissions...
          </Box>
        ) : (
          <Box sx={{ my: 2 }}>
            {pastSubmissions.map((submission, index) => (
              <Box>
                <Accordion
                  id={`submission${index}-accordion`}
                  sx={{
                    borderRadius: 1,
                    border: "1px solid",
                    borderTop: index === 0 ? 1 : 0,
                    borderColor: "divider",
                    mb: 1
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      fontWeight: 600,
                      backgroundColor: "#C3CEE3"
                    }}
                  >
                    {submission.timestamp} {index === 0 && " (latest submission)"}
                  </AccordionSummary>
                  <AccordionDetails sx={{ pb: 1 }}>
                    {submission.filePaths.map((filePath) => (
                      <Typography noWrap>
                        {renderFileName(filePath)}
                      </Typography>
                    ))}
                  </AccordionDetails>
                  <AccordionActions sx={{ pt: 0 }}>
                    <Button
                      variant="outlined"
                      onClick={() => downloadFilesFromSubmission(submission.filePaths)}
                    >
                      Download files
                    </Button>
                  </AccordionActions>
                </Accordion>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}