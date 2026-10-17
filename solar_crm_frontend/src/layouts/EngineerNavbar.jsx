import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
  Breadcrumbs,
  Link,
  Tooltip,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";

const getEngineerPageMetadata = (pathname) => {
  if (pathname.includes("/engineer/surveys"))
    return { title: "Site Surveys & Feasibility", breadcrumb: "Site Surveys" };
  if (pathname.includes("/engineer/projects"))
    return { title: "Assigned Projects & Installations", breadcrumb: "Projects" };
  if (pathname.includes("/engineer/calculator"))
    return { title: "Solar Feasibility Calculator", breadcrumb: "Calculator" };
  if (pathname.includes("/engineer/profile"))
    return { title: "Engineer Profile", breadcrumb: "Profile" };
  return { title: "Site Engineer Dashboard", breadcrumb: "Dashboard" };
};

export default function EngineerNavbar({
  handleDrawerToggle,
  handleToggleCollapse,
  collapsed,
  sidebarWidth = 260,
  navbarHeight = 64,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { title, breadcrumb } = getEngineerPageMetadata(location.pathname);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${sidebarWidth}px)` },
        ml: { md: `${sidebarWidth}px` },
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        color: "#0F172A",
        transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 1100,
      }}
    >
      <Toolbar sx={{ minHeight: `${navbarHeight}px`, px: { xs: 2, sm: 3 }, gap: 2 }}>
        {/* MOBILE MENU TOGGLE */}
        <IconButton
          color="inherit"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ display: { md: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        {/* DESKTOP COLLAPSE TOGGLE */}
        <IconButton
          color="inherit"
          edge="start"
          onClick={handleToggleCollapse}
          sx={{ display: { xs: "none", md: "flex" } }}
        >
          <MenuIcon />
        </IconButton>

        {/* PAGE TITLE & BREADCRUMBS */}
        <Box sx={{ flexGrow: 1 }}>
          <Breadcrumbs
            separator={<KeyboardArrowRightIcon sx={{ fontSize: "0.85rem", color: "#94A3B8" }} />}
            sx={{ fontSize: "0.75rem", mb: 0.2 }}
          >
            <Link
              underline="hover"
              color="#64748B"
              onClick={() => navigate("/engineer/dashboard")}
              sx={{ cursor: "pointer", fontWeight: 600 }}
            >
              Engineer Portal
            </Link>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#0F172A" }}>
              {breadcrumb}
            </Typography>
          </Breadcrumbs>
          <Typography sx={{ fontSize: "1.05rem", fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
            {title}
          </Typography>
        </Box>

        {/* RIGHT ACTIONS */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            <IconButton onClick={toggleFullscreen} sx={{ color: "#64748B" }}>
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="View Profile">
            <IconButton onClick={() => navigate("/engineer/profile")} sx={{ p: 0.5 }}>
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: "#0284C7",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "#FFFFFF",
                }}
              >
                {(user?.full_name || user?.name || "E").charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
