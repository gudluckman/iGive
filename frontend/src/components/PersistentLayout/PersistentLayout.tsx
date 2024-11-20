import { Box, useMediaQuery, Drawer } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import { TopNavBar } from "../NavigationBar/TopNavigationBar";
import { SideNavBar } from "../NavigationBar/SideNavigationBar";
import { Outlet } from "react-router-dom";

export function PersistentLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerToggle = () => {
    setDrawerOpen(!isDrawerOpen);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <TopNavBar
        toggleDrawer={handleDrawerToggle}
        isMobile={isMobile}
      />

      {/* Drawer for mobile view */}
      <Drawer
        anchor="left"
        open={isDrawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          "& .MuiDrawer-paper": {
            width: 250,
          },
        }}
      >
        <SideNavBar />
      </Drawer>

      <Box
        sx={{
          display: "flex",
          flexGrow: 1,
          overflow: "hidden",
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        {/* Sidebar for desktop view */}
        {!isMobile && (
          <Box
            sx={{
              width: 250,
              height: "100vh",
              overflowY: "auto",
              flexShrink: 0,
              backgroundColor: "#F4F4F4",
            }}
          >
            <SideNavBar />
          </Box>
        )}

        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 3 },
            overflowY: "auto",
            backgroundColor: "#FFFFFF",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
