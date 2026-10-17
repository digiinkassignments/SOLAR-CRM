import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Divider, Avatar, Badge,
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button, ListSubheader, Tooltip,
} from "@mui/material";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

import logo from "../assets/images/logo.png";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000";

const navigationSections = [
  {
    subheader: "OVERVIEW",
    items: [
      { title: "Dashboard", icon: <DashboardOutlinedIcon />, path: "/engineer/dashboard" },
    ],
  },
  {
    subheader: "FIELD WORK",
    items: [
      { title: "Site Surveys", icon: <AssignmentTurnedInOutlinedIcon />, path: "/engineer/surveys" },
      { title: "Assigned Projects", icon: <EngineeringOutlinedIcon />, path: "/engineer/projects" },
      { title: "Solar Calculator", icon: <CalculateOutlinedIcon />, path: "/engineer/calculator" },
    ],
  },
  {
    subheader: "ACCOUNT",
    items: [
      { title: "My Profile", icon: <PersonOutlineOutlinedIcon />, path: "/engineer/profile" },
    ],
  },
];

export default function EngineerSidebar({
  mobileOpen,
  handleDrawerToggle,
  collapsed,
  sidebarWidth = 260,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleNavClick = (path) => {
    navigate(path);
    if (mobileOpen) handleDrawerToggle();
  };

  const handleLogoutConfirm = () => {
    setLogoutDialogOpen(false);
    logout();
    navigate("/");
  };

  const userName = user?.full_name || user?.name || "Site Engineer";
  const userEmail = user?.email || "";
  const roleName = "Site Engineer";

  const drawerContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#0F172A",
        color: "#F8FAFC",
        borderRight: "1px solid #1E293B",
      }}
    >
      {/* BRAND HEADER */}
      <Box
        sx={{
          height: 64,
          display: "flex",
          alignItems: "center",
          px: collapsed ? 1.5 : 2.5,
          gap: 1.5,
          borderBottom: "1px solid #1E293B",
        }}
      >
        <Avatar
          src={logo}
          alt="Solar CRM"
          sx={{
            width: 34,
            height: 34,
            borderRadius: "8px",
            backgroundColor: "#0284C7",
          }}
        />
        {!collapsed && (
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#FFFFFF", lineHeight: 1.1 }}>
              SOLAR<span style={{ color: "#38BDF8" }}>CRM</span>
            </Typography>
            <Typography sx={{ fontSize: "0.65rem", color: "#94A3B8", letterSpacing: "0.05em", fontWeight: 700 }}>
              SITE ENGINEER PORTAL
            </Typography>
          </Box>
        )}
      </Box>

      {/* NAVIGATION LIST */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", py: 1.5, px: 1 }}>
        {navigationSections.map((section, idx) => (
          <List
            key={idx}
            subheader={
              !collapsed ? (
                <ListSubheader
                  sx={{
                    backgroundColor: "transparent",
                    color: "#64748B",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    lineHeight: "28px",
                    px: 1.5,
                  }}
                >
                  {section.subheader}
                </ListSubheader>
              ) : null
            }
          >
            {section.items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                  <Tooltip title={collapsed ? item.title : ""} placement="right">
                    <ListItemButton
                      onClick={() => handleNavClick(item.path)}
                      sx={{
                        borderRadius: "8px",
                        py: 0.9,
                        px: collapsed ? 1.5 : 2,
                        backgroundColor: isActive ? "#0284C7" : "transparent",
                        color: isActive ? "#FFFFFF" : "#94A3B8",
                        "&:hover": {
                          backgroundColor: isActive ? "#0284C7" : "#1E293B",
                          color: "#FFFFFF",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: isActive ? "#FFFFFF" : "#94A3B8",
                          minWidth: collapsed ? 0 : 36,
                          justifyContent: "center",
                          "& svg": { fontSize: "1.2rem" },
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {!collapsed && (
                        <ListItemText
                          primary={item.title}
                          primaryTypographyProps={{
                            fontSize: "0.82rem",
                            fontWeight: isActive ? 700 : 500,
                          }}
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              );
            })}
          </List>
        ))}
      </Box>

      {/* USER FOOTER & LOGOUT */}
      <Box sx={{ p: 1.5, borderTop: "1px solid #1E293B" }}>
        {!collapsed ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1, mb: 1, borderRadius: "8px", backgroundColor: "#1E293B" }}>
            <Avatar
              sx={{ width: 34, height: 34, bgcolor: "#0284C7", color: "#FFFFFF", fontSize: "0.85rem", fontWeight: 700 }}
            >
              {userName.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ overflow: "hidden", flex: 1 }}>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {userName}
              </Typography>
              <Typography sx={{ fontSize: "0.68rem", color: "#38BDF8", fontWeight: 600 }}>
                {roleName}
              </Typography>
            </Box>
          </Box>
        ) : null}

        <ListItemButton
          onClick={() => setLogoutDialogOpen(true)}
          sx={{
            borderRadius: "8px",
            py: 0.8,
            px: collapsed ? 1.5 : 2,
            color: "#EF4444",
            "&:hover": { backgroundColor: "#331E29", color: "#F87171" },
          }}
        >
          <ListItemIcon sx={{ color: "inherit", minWidth: collapsed ? 0 : 36, justifyContent: "center" }}>
            <LogoutOutlinedIcon sx={{ fontSize: "1.2rem" }} />
          </ListItemIcon>
          {!collapsed && (
            <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: "0.82rem", fontWeight: 600 }} />
          )}
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      <Box
        component="nav"
        sx={{
          width: { md: sidebarWidth },
          flexShrink: { md: 0 },
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: 260,
              borderRight: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "#0F172A",
              color: "#FFFFFF",
              borderRadius: "0px !important",
              boxShadow: "none",
            },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: sidebarWidth,
              borderRight: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "#0F172A",
              color: "#FFFFFF",
              borderRadius: "0px !important",
              boxShadow: "none",
              transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              overflowX: "hidden",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* LOGOUT DIALOG */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: "12px", p: 1, minWidth: 330 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#0B3A63", pb: 1 }}>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.9rem", color: "#64748B" }}>
            Are you sure you want to log out of the Site Engineer portal?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLogoutDialogOpen(false)} sx={{ color: "#64748B", fontWeight: 600 }}>Cancel</Button>
          <Button
            variant="contained"
            disableElevation
            onClick={handleLogoutConfirm}
            sx={{ backgroundColor: "#EF4444", "&:hover": { backgroundColor: "#DC2626" }, fontWeight: 600 }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
