import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../../util/firebase_util";
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import IgiveIcon from "../../assets/IGIVE.png";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { signOut } from "firebase/auth";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DefaultAvatar from "../../assets/default-avatar.webp";

interface TopNavBarProps {
  toggleDrawer: () => void;
  isMobile: boolean;
}

export function TopNavBar({ toggleDrawer, isMobile }: TopNavBarProps) {
  const navigate = useNavigate();
  const [userZID, setUserZID] = useState<string | null>(null);
  const [userName, setUserName] = useState<{
    firstName?: string;
    lastName?: string;
  } | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Fetch user information (ZID and names)
  useEffect(() => {
    const fetchUserDetails = async () => {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email) {
        const match = currentUser.email.match(/(z\d{7})/i);
        if (match) {
          const zID = match[0];
          setUserZID(zID);

          try {
            const token = await currentUser.getIdToken();
            const response = await fetch(
              `${
                process.env.REACT_APP_BACKEND_URL
              }/api/user/user_name?zID=${encodeURIComponent(zID)}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!response.ok) {
              throw new Error(
                `Failed to fetch user details: ${response.statusText}`
              );
            }

            const data = await response.json();
            setUserName({
              firstName: data.firstName || "",
              lastName: data.lastName || "",
            });
          } catch (error) {
            console.error("Error fetching user details:", error);
          }
        }
      } else {
        setUserZID(null);
        setUserName(null);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserDetails();
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle menu open and close
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    signOut(auth).then(() => navigate("/"));
    handleMenuClose();
  };

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "#2C3C5F",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
        width: "100%",
        height: 80,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: isMobile ? 1 : 2,
        }}
      >
        {/* Left Section: Logo + Optional Menu Icon (Mobile) */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            color: "white",
          }}
        >
          {isMobile && (
            <IconButton onClick={toggleDrawer} sx={{ color: "white", mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Box
            component="img"
            src={IgiveIcon}
            alt="iGive Logo"
            sx={{
              height: { xs: 40, sm: 50, md: 60 },
              cursor: "pointer",
              marginRight: isMobile ? 0.5 : 1.5,
              filter: "drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))",
            }}
            onClick={() => navigate("/dashboard")}
          />
          <Typography
            variant="h5"
            sx={{
              fontWeight: "400",
              fontSize: { xs: "1.5rem", sm: "2.2rem" },
              cursor: "pointer",
              color: "white",
            }}
            onClick={() => navigate("/dashboard")}
          >
            iGive
          </Typography>
        </Box>

        {/* Right Section: User ID and Name */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {userZID && userName ? (
            <Box
              sx={{ textAlign: "right", cursor: "pointer" }}
              onClick={handleMenuOpen}
            >
              {userName.firstName && userName.lastName && (
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 500,
                    color: "white",
                    fontFamily: "Open Sans, sans-serif",
                    fontSize: { xs: "14px", sm: "16px", md: "18px" },
                  }}
                >
                  {userName.firstName} {userName.lastName}
                </Typography>
              )}
              <Typography
                variant="caption"
                sx={{
                  color: "white",
                  fontFamily: "Open Sans, sans-serif",
                  fontSize: { xs: "8px", sm: "10px", md: "12px" },
                  display: userZID ? "block" : "none",
                }}
              >
                {userZID}
              </Typography>
            </Box>
          ) : (
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: "white",
                fontFamily: "Open Sans, sans-serif",
                fontSize: { xs: "12px", sm: "14px", md: "16px" },
              }}
            >
              Loading user info...
            </Typography>
          )}

          {/* Profile Avatar with Down Arrow */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              gap: 0.5,
            }}
            onClick={handleMenuOpen}
            id="user-avatar"
          >
            <Avatar
              src={DefaultAvatar}
              alt="User Avatar"
              sx={{
                width: 40,
                height: 40,
                backgroundColor: "#e0e0e0",
              }}
            />
            <KeyboardArrowDownIcon
              sx={{
                color: "white",
                fontSize: "1.2rem",
              }}
            />
          </Box>

          {/* Menu for Logout */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            sx={{
              mt: 1,
              "& .MuiMenu-list": {
                outline: "none",
              },
              "& .MuiMenuItem-root": {
                "&:focus": { backgroundColor: "transparent" },
              },
            }}
          >
            <MenuItem>
              <AccountCircleIcon sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem>
              <SettingsIcon sx={{ mr: 1 }} />
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout} id={"logout-button"}>
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
