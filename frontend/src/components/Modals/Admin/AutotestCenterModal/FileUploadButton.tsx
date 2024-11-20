import { Button, IconButton, Input, Tooltip, Typography } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import FilePresentIcon from "@mui/icons-material/FilePresent";
import { FileUploadButtonProps } from "../../../../interfaces/modal.interface";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useState } from "react";

export function FileUploadButton({
  handleFileUploadClick,
  handleFileUploadChange,
  handleScriptDownload,
  fileRef,
  file,
  method,
  uploaded,
}: FileUploadButtonProps) {
  const [isHoveringIconButton, setIsHoveringIconButton] = useState(false);

  return (
    <Button
      onClick={() => handleFileUploadClick(method)}
      fullWidth
      disableRipple={isHoveringIconButton}
      sx={{
        height: "56px",
        border: method === "script"
         ? (uploaded ? "1.5px solid #3cd64b" : "1.5px solid red")
         : "1.5px solid #1a73e8",
        borderRadius: "8px",
        color: "#555555",
        cursor: "pointer",
        mb: "10px",
        display: "flex",
        justifyContent: "flex-start",
        ...(isHoveringIconButton && {
          '&:hover': {
            // Disable hover effect on Button when hovering over IconButton
            backgroundColor: 'transparent',
          }
        })
      }}
    >
      {!file ? (
        <>
          <UploadFileIcon
            sx={{
              color: method === "script" ? "red" : "#1a73e8",
              mr: "5px",
            }}
          />
          <Typography
            variant="body1"
            sx={{
              ...(method === "script" && {color: "red"}),
              textTransform: "none"
            }}
          >
            {method === "script"
              ? "Upload Script File"
              : method === "in"
              ? "Upload Input File"
              : "Upload Output File"
            }
          </Typography>
        </>
      ) : (
        <>
          <FilePresentIcon
            sx={{
              color:
                method === "script" && !uploaded
                ? "red"
                : method === "script" && uploaded
                ? "#3cd64b"
                : "#1a73e8",
              mr: "5px"
            }}
          />
          <Typography
            noWrap
            variant="subtitle2"
            sx={{
              ...(method === "script" && uploaded && {color: "#3cd64b"}),
              ...(method === "script" && !uploaded && { color: "red" }),
              textTransform: "none"
            }}
          >
            {file.name}
          </Typography>
          {method === "script" && (
            <Tooltip title="Download Script File">
              <IconButton
                sx={{ ml: "auto" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleScriptDownload!();
                }}
                onMouseEnter={() => {
                  setIsHoveringIconButton(true);
                }}
                onMouseLeave={() => {
                  setIsHoveringIconButton(false);
                }}
              >
                <FileDownloadIcon/>
              </IconButton>
            </Tooltip>
          )}
        </>
      )}
      <Input
        type="file"
        inputRef={fileRef}
        sx={{ display: "none" }}
        inputProps={method === "script" ? { accept: ".sh" } : {}}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileUploadChange(e, method)}
        id={"file-upload-" + method}
      />
    </Button>
  )
}