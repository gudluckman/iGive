import { Box, Button, IconButton, Typography } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { AutotestSummaryModuleProps } from "../../../../interfaces/modal.interface";

export function AutotestSummaryModule({
  handleAutotestDeleteClick,
  handleAutotestEditClick,
  test,
  hidden,
  isEditing
}: AutotestSummaryModuleProps) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        bgcolor: isEditing ? "#E2E0EC" : "#F4F3F8"
      }}
    >
      <Box
        flexGrow={1}
        overflow="hidden"
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center"
        }}
      >
        <Button
          id={test}
          data-ishidden={hidden}
          onClick={(e) => handleAutotestEditClick(e)}
          sx={{
            textTransform: "none",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            pl: "10px"
          }}
        >
          <Typography noWrap color="black">{test}</Typography>
        </Button>
      </Box>
      <Box>
        <IconButton
          id={test}
          data-ishidden={hidden}
          sx={{ color: "red" }}
          onClick={(e) => handleAutotestDeleteClick(e)}
        >
          <DeleteIcon/>
        </IconButton>
      </Box>
    </Box>
  )
}