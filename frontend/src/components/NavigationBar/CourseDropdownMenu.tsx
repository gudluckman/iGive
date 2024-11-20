import React, { useState } from "react";
import {
  Button,
  MenuItem,
  Menu,
  ListItemText,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useNavigate } from "react-router-dom";
import { CourseDropdownProps } from "../../interfaces/course.interface";

export function CourseDropdown({ userType, courses }: CourseDropdownProps) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (course: string) => {
    handleClose();
    navigate(`/course/${course}`);
  };

  return (
    <>
      <Button
        id="dropdown-button"
        aria-controls={open ? "dropdown-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        variant="contained"
        disableElevation
        onClick={handleClick}
        endIcon={
          <KeyboardArrowDownIcon
            sx={{
              transition: "transform 0.3s ease-in-out",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        }
        sx={{
          textAlign: "center",
          color: "white",
          backgroundColor: "#2C3C5F",
          borderRadius: "8px",
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            backgroundColor: "white",
            color: "black",
          },
          margin: "2px",
          width: { xs: "100%", sm: "auto" },
        }}
      >
        {userType}
      </Button>

      <Menu
        id="dropdown-menu"
        MenuListProps={{ "aria-labelledby": "dropdown-button" }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        sx={{
          display: { xs: "block", sm: "inline-block" },
          width: { xs: "100%", sm: "auto" },
        }}
      >
        {courses.map((course) => (
          <MenuItem
            key={course}
            onClick={() => handleMenuItemClick(course)}
            disableRipple
            sx={{
              "&:hover": { backgroundColor: "#dddddd" },
              width: "100%",
            }}
          >
            <ListItemText primary={course} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
