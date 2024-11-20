import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  useMediaQuery,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PersonOffIcon from "@mui/icons-material/PersonOff";

export const LoadingSkeleton = () => {
  const isMobile = useMediaQuery("(max-width:600px)");

  return (
    <div>
      {[...Array(12)].map((_, i) => (
        <Accordion
          key={i}
          disabled
          sx={{
            border: "1px solid #ccc",
            backgroundColor: "#e0e0e5",
            opacity: 1,
            "&.Mui-disabled": {
              backgroundColor: "#e0e0e5",
            },
            "&::before": {
              display: "none",
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              borderBottom: "1px solid #ccc",
              opacity: 0.7,
              animation: "pulse 1.5s infinite ease-in-out",
              "@keyframes pulse": {
                "0%": {
                  opacity: 0.7,
                },
                "50%": {
                  opacity: 0.5,
                },
                "100%": {
                  opacity: 0.7,
                },
              },
            }}
          >
            <Box display="flex" alignItems="center" width="100%">
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: isMobile ? "1rem" : "1.25rem",
                    textAlign: isMobile ? "center" : "left",
                    color: "gray",
                  }}
                >
                  Inactive User (z0000000)
                </Typography>
                <PersonOffIcon
                  sx={{ fontSize: "1.2rem", color: "gray", ml: 0.5 }}
                />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  marginLeft: "auto",
                  fontWeight: 600,
                  fontSize: isMobile ? "16px" : "18px",
                }}
              >
                - / 100
              </Typography>
            </Box>
          </AccordionSummary>
        </Accordion>
      ))}
    </div>
  );
};
