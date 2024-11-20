import { Box, Typography } from "@mui/material";
import { AutotestSummaryModule } from "./AutotestSummaryModule";
import { AutotestSummaryContainerProps } from "../../../../interfaces/modal.interface";

export function AutotestSummaryContainer({
  tests,
  handleAutotestDeleteClick,
  handleAutotestEditClick,
  editingModule,
  hidden,
}: AutotestSummaryContainerProps) {
  return (
    <Box
      sx={{
        border: "1px solid #D3D3D3",
        bgcolor: "#F4F3F8",
        height: "197px",
        mb: "15px",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        overflowX: "hidden",
        borderRadius: "8px",
        "&::-webkit-scrollbar": {
          width: "6px",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#A0A0A0",
          borderRadius: "3px",
        },
        "&::-webkit-scrollbar-thumb:hover": {
          backgroundColor: "#888",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "#E0E0E0",
        },
        scrollBehavior: "smooth",
      }}
    >
      {tests.length === 0 ? (
        <Box
          height="100%"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
        >
          <Typography sx={{ fontSize: "14px" }}>
            Looks like theres nothing here...
          </Typography>
          <Typography sx={{ fontSize: "12px" }}>
            Try creating a {hidden ? "hidden" : "non-hidden"} test!
          </Typography>
        </Box>
      ) : (
        <>
          {tests.map((test) => (
            <AutotestSummaryModule
              key={test}
              handleAutotestDeleteClick={handleAutotestDeleteClick}
              handleAutotestEditClick={handleAutotestEditClick}
              test={test}
              hidden={hidden}
              isEditing={
                hidden
                  ? editingModule === test + "true"
                  : editingModule === test + "false"
              }
            />
          ))}
        </>
      )}
    </Box>
  );
}
