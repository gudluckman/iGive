import { Box, Typography, useMediaQuery } from "@mui/material";
import { Doughnut } from "react-chartjs-2";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface AutomarkResultChartProps {
  passed: number;
  failed: number;
}

export const AutomarkResultChart = ({
  passed,
  failed,
}: AutomarkResultChartProps) => {
  const hasData = passed > 0 || failed > 0;
  const isNotMobile = useMediaQuery("(min-width:600px)");

  // Chart data configuration
  const data: ChartData<"doughnut", number[], unknown> = {
    labels: hasData ? ["Tests Passed", "Tests Failed"] : ["No Data"],
    datasets: [
      {
        data: hasData ? [passed, failed] : [1],
        backgroundColor: hasData ? ["#4caf50", "#f44336"] : ["#e0e0e0"],
        hoverBackgroundColor: hasData ? ["#66bb6a", "#ef5350"] : ["#e0e0e0"],
      },
    ],
  };

  const chartSize = 150;

  return (
    <Box
      display="flex"
      flexDirection="row"
      justifyContent="space-around"
      alignItems="center"
      width="100%"
      px={2}
    >
      {/* Chart Container */}
      <Box position="relative" width={chartSize} height={chartSize}>
        <Doughnut
          data={data}
          options={{
            maintainAspectRatio: false,
            cutout: "65%",
            plugins: {
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const label = context.label || "";
                    const value = context.raw || 0;
                    return `${label}: ${value}`;
                  },
                },
              },
              legend: {
                display: false,
              },
            },
          }}
          width={chartSize}
          height={chartSize}
        />
      </Box>

      {/* Text Beside the Chart */}
      <Box
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        justifyContent="center"
        sx={{ marginLeft: { sm: 1, md: 2, lg: 3 } }}
        textAlign="left"
      >
        {hasData ? (
          <>
            <Box display="flex" alignItems="center">
              {isNotMobile && (
                <CheckCircleOutlineOutlinedIcon
                  sx={{
                    color: "#4caf50",
                    mr: 1,
                    fontSize: { md: "22px", lg: "24px" },
                  }}
                />
              )}
              <Typography
                sx={{
                  color: "#4caf50",
                  fontWeight: "400",
                  fontSize: { sm: "14px", md: "14px", lg: "14px" },
                }}
              >
                Tests Passed: {passed}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mt={1}>
              {isNotMobile && (
                <CancelOutlinedIcon
                  sx={{
                    color: "#f44336",
                    mr: 1,
                    fontSize: { md: "22px", lg: "24px" },
                  }}
                />
              )}
              <Typography
                sx={{
                  color: "#f44336",
                  fontWeight: "400",
                  fontSize: { sm: "14px", md: "14px", lg: "14px" },
                }}
              >
                Tests Failed: {failed}
              </Typography>
            </Box>
          </>
        ) : (
          <Box display="flex" alignItems="center">
            {isNotMobile && (
              <InfoOutlinedIcon
                sx={{
                  color: "#D0D0D0",
                  mr: 1,
                  fontSize: { md: "22px", lg: "24px" },
                }}
              />
            )}
            <Typography
              sx={{
                color: "#D0D0D0",
                fontWeight: "400",
                fontSize: { sm: "14px", md: "14px", lg: "14px" },
              }}
            >
              Tests Not Available
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};
