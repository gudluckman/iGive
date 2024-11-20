import {
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  IconButton,
  Typography,
  Box,
  TableCell,
  TableRow,
  TableBody,
  Table,
  TableContainer,
  Paper,
  useMediaQuery,
} from "@mui/material";
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useState, useEffect } from "react";
import { auth } from "../../../util/firebase_util";
import { FileUploadModalProps } from "../../../interfaces/modal.interface";
import { successNotifier } from "../../Notifier/ActionNotifier";

export function MakeSubmissionModal({
  open,
  onClose,
  courseCode,
  taskName,
  taskIndex,
  updateFiles,
}: FileUploadModalProps & { open: boolean; onClose: () => void }) {
  const [files, setFiles] = useState<(File | null)[]>([null]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [fileRestrictions, setFileRestrictions] = useState<{
    allowedFileTypes: string[];
    maxFileSize: number;
    requiredFiles: string[];
  } | null>(null);
  const isMobile = useMediaQuery("(max-width:600px)");

  const VisuallyHiddenInput = styled("input")({
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    bottom: 0,
    left: 0,
    whiteSpace: "nowrap",
    width: 1,
  });

  useEffect(() => {
    setFiles([null]);
  }, [open]);

  // Fetch file restrictions when the component mounts
  useEffect(() => {
    const fetchFileRestrictions = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch(
          `${
            process.env.REACT_APP_BACKEND_URL
          }/api/task/get_file_restrictions?course_code=${courseCode}&task=${encodeURIComponent(
            taskName.replaceAll(/~/g, " ")
          )}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const result = await response.json();

        if (response.ok) {
          setFileRestrictions(result);
        } else {
          console.error("Failed to fetch file restrictions:", result);
        }
      } catch (error) {
        console.error("Error fetching file restrictions:", error);
      }
    };

    fetchFileRestrictions();
  }, [courseCode, taskName]);

  const handleFileUpload = (
    e: any,
    index: number
  ) => {
    setUploadErrors([]);
    const selectedFiles = e.target.files || null;
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles((prevFiles) => {
        const updatedFiles = [...prevFiles];
        updatedFiles.splice(index, 1);
        updatedFiles.splice(index, 0, ...selectedFiles);
        return updatedFiles;
      });
    }
  };

  const handleSubmitFiles = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadErrors([]);

    const nonNullFiles: File[] = files.filter(
      (file): file is File => file !== null
    );

    if (nonNullFiles.length === 0) {
      setUploadErrors(["You must upload at least one file."]);
      return;
    }

    // Remove duplicate files based on unique properties like `name`, `size`, and `lastModified`
    const uniqueFiles: File[] = nonNullFiles.filter((file, index, self) =>
      index === self.findIndex((f) =>
        f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
      )
    );

    const formData = new FormData();
    formData.append("course_code", courseCode || "");
    formData.append("task", taskName);
    for (const file of uniqueFiles) {
      formData.append("files[]", file);
    }

    const payload = {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + (await auth.currentUser?.getIdToken()),
      },
      body: formData,
    };

    setUploading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/task/upload_submissions`,
        payload
      );
      const result = await response.json();
      if (!response.ok) {
        console.error("Upload failed:", result);

        // Handle late submission error specifically
        if (result.error && result.error.includes("past maximum late days")) {
          // Extract the max days from the error message if available
          const maxDaysMatch = result.error.match(/\((\d+) days\)/);
          const maxDays = maxDaysMatch ? maxDaysMatch[1] : "the maximum allowed";

          // Format a more user-friendly error message
          setUploadErrors([
            `Unable to submit - Submissions ${maxDays} days after the deadline are not accepted.`,
            `Please contact your course administrator if you need an extension.`
          ]);
        } else if (result.errors) {
          // Handle other validation errors
          setUploadErrors(result.errors);
        } else {
          // Generic error fallback
          setUploadErrors(["File upload failed. Please try again or contact support."]);
        }

      } else {
        successNotifier(
          `Uploaded ${uniqueFiles.length} files for ${taskName}!`
        );
        const submissionTime = result.submission_time;
        updateFiles(
          uniqueFiles.map((file) => file.name),
          submissionTime,
          taskIndex,
        );
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setUploadErrors([
        "An unexpected error occurred. Please try again later.",
        "If the problem persists, please contact support."
      ]);
    } finally {
      setUploading(false);
    }
  };

  const addFileSlot = () => {
    setFiles((prevFiles) => [...prevFiles, null]);
  };

  const removeFileSlot = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: "80vw", maxWidth: "700px", height: "auto" },
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
        <span style={{ display: "flex", alignItems: "center" }}>
          <AttachFileIcon  sx={{ marginRight: "8px" }} />
          Upload your submission for {taskName}
        </span>
      </DialogTitle>
      <form onSubmit={handleSubmitFiles}>
        <DialogContent sx={{ p: 2, overflowX: "hidden" }}>
          {/* File Restrictions Info */}
          {fileRestrictions && (
            <TableContainer
              component={Paper}
              sx={{
                mt: 1,
                mb: 2,
                borderRadius: 1,
                backgroundColor: "grey.100",
                border: "1px solid",
                borderColor: "grey.300",
                boxShadow: 0.5,
                maxWidth: "100%",
                overflowX: "auto",
              }}
            >
              <Table size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
                {" "}
                {/* Fixed layout to prevent overflow */}
                <TableBody>
                  <TableRow
                    sx={{ borderBottom: "1px solid", borderColor: "grey.300" }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "grey.200",
                        maxWidth: "40%",
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        Required Files
                      </Typography>
                    </TableCell>
                    {/* Required files table */}
                    <TableCell sx={{ backgroundColor: "grey.50" }}>
                      {fileRestrictions.requiredFiles &&
                      fileRestrictions.requiredFiles.length > 0 &&
                      !fileRestrictions.requiredFiles.every(
                        (file) => file === ""
                      ) ? (
                        fileRestrictions.requiredFiles.length > 1 ? (
                          <ul style={{ paddingLeft: "20px", margin: 0 }}>
                            {fileRestrictions.requiredFiles.map(
                              (file, index) => (
                                <li key={index}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      lineHeight: 1.2,
                                      fontStyle: "italic",
                                    }}
                                  >
                                    {file}
                                  </Typography>
                                </li>
                              )
                            )}
                          </ul>
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{ lineHeight: 1.2, fontStyle: "italic" }}
                          >
                            {fileRestrictions.requiredFiles[0]}
                          </Typography>
                        )
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{ lineHeight: 1.2, fontStyle: "italic" }}
                        >
                          No required files
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow
                    sx={{ borderBottom: "1px solid", borderColor: "grey.300" }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "grey.200",
                        maxWidth: "40%",
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        Allowed Extra File Extensions
                      </Typography>
                    </TableCell>
                    {/* Allowed file types table */}
                    <TableCell sx={{ backgroundColor: "grey.50" }}>
                      {fileRestrictions.allowedFileTypes &&
                      fileRestrictions.allowedFileTypes.length > 0 &&
                      !fileRestrictions.allowedFileTypes.every(
                        (type) => type === ""
                      ) ? (
                        fileRestrictions.allowedFileTypes.length > 1 ? (
                          <ul style={{ paddingLeft: "20px", margin: 0 }}>
                            {fileRestrictions.allowedFileTypes.map(
                              (type, index) => (
                                <li key={index}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      lineHeight: 1.2,
                                      fontStyle: "italic",
                                    }}
                                  >
                                    {type}
                                  </Typography>
                                </li>
                              )
                            )}
                          </ul>
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{ lineHeight: 1.2, fontStyle: "italic" }}
                          >
                            {fileRestrictions.allowedFileTypes[0]}
                          </Typography>
                        )
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{ lineHeight: 1.2, fontStyle: "italic" }}
                        >
                          Any
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "grey.200",
                        maxWidth: "40%",
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        Max File Size
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ backgroundColor: "grey.50" }}>
                      <Typography
                        variant="body2"
                        sx={{ lineHeight: 1.2, fontStyle: "italic" }}
                      >
                        {fileRestrictions.maxFileSize} MB
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {files.map((file, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "center",
                bgcolor: "background.paper",
                p: 1,
                borderRadius: 1,
                border: "1px solid",
                borderTop: index === 0 ? 1 : 0,
                borderColor: "divider",
              }}
            >
              <Button
                component="label"
                variant="outlined"
                size="small"
                startIcon={<CloudUploadIcon />}
                id = {`file-upload-${index}`}
                sx={{ mr: 1, minWidth: isMobile ? "100px" : "140px" }}
              >
                Choose file
                <VisuallyHiddenInput
                  type="file"
                  onChange={(e) => handleFileUpload(e, index)}
                  multiple
                />
              </Button>
              <Typography sx={{ flexGrow: 1, ml: 2 }}>
                {file ? file.name : "No file chosen"}
              </Typography>
              <IconButton size="small" onClick={() => removeFileSlot(index)}>
                <CloseIcon fontSize="small" id={"close-icon-" + index}/>
              </IconButton>
            </Box>
          ))}

          <Button
            variant="outlined"
            color="secondary"
            onClick={addFileSlot}
            id={"add-file-button"}
            sx={{ my: 2 }}
          >
            Add file
          </Button>
          {uploadErrors.length > 0 && (
            <Alert severity="error">
              <AlertTitle>File Upload Error</AlertTitle>
              {uploadErrors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 1, mb: 2 }}>
          <Button onClick={onClose} variant="outlined" sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            endIcon={<SendIcon />}
            disabled={uploading}
            id={"submit-files-button"}
            sx={{
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            Submit files
          </Button>
          {uploading && (
            <CircularProgress
              size={24}
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                mt: "-12px",
                ml: "-12px",
              }}
            />
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
}
