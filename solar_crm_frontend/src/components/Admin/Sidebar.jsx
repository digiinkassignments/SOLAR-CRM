import React, { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import usePlanFeatures from "../../hooks/usePlanFeatures";

import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Divider, Avatar, Badge,
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button, Tooltip, Chip,
} from "@mui/material";

import DashboardOutlinedIcon  from "@mui/icons-material/DashboardOutlined";
import GroupOutlinedIcon      from "@mui/icons-material/GroupOutlined";
import SolarPowerOutlinedIcon from "@mui/icons-material/SolarPowerOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import SettingsOutlinedIcon   from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon     from "@mui/icons-material/LogoutOutlined";
import LockOutlinedIcon       from "@mui/icons-material/LockOutlined";

import logo from "../../assets/images/logo.png";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000";

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const Sidebar = ({ mobileOpen, handleDrawerToggle, sidebarWidth = 280 }) => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const { can, features } = usePlanFeatures();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const fullName       = user?.full_name || user?.name || "User";
  const roleName       = user?.role_name || user?.role || "Administrator";
  const avatarInitials = getInitials(fullName);

  const avatarSrc = useMemo(() => {
    const imgPath = user?.profile_image;
    if (!imgPath || imgPath === "null" || imgPath === "undefined" || imgPath.trim() === "") return null;
    if (imgPath.startsWith("http")) return imgPath;
    let cleanPath = imgPath.startsWith("/") ? imgPath.slice(1) : imgPath;
    if (!cleanPath.startsWith("uploads/profiles/")) {
      cleanPath = cleanPath.startsWith("uploads/")
        ? cleanPath.replace("uploads/", "uploads/profiles/")
        : `uploads/profiles/${cleanPath}`;
    }
    return `${API_BASE_URL}/${cleanPath}`;
  }, [user?.profile_image]);

  // ── Nav items — featureKey null means always visible ──────
  const navigationMenuItems = [
    {
      title:      "Dashboard",
      icon:       <DashboardOutlinedIcon />,
      path:       "/dashboard",
      featureKey: null,
    },
    {
      title:      "User Management",
      icon:       <GroupOutlinedIcon />,
      path:       "/users",
      featureKey: null,
    },
    {
      title:      "Lead Management",
      icon:       <SolarPowerOutlinedIcon />,
      path:       "/leads",
      featureKey: null,
    },
    {
      title:      "Reports",
      icon:       <AssessmentOutlinedIcon />,
      path:       "/reports",
      featureKey: "has_reports",
      upgradeMsg: "Professional plan mein upgrade karo",
    },
    {
      title:      "Settings",
      icon:       <SettingsOutlinedIcon />,
      path:       "/settings",
      featureKey: null,
    },
  ];

  const handleConfirmLogout = () => {
    setLogoutDialogOpen(false);
    logout?.();
    navigate("/", { replace: true });
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#0B3A63",
        color: "#FFFFFF",
      }}
    >
      <Box>
        {/* Logo */}
        <Box
          sx={{
            p: 2.5, display: "flex", alignItems: "center", gap: 1.8,
            borderBottom: "1px solid rgba(255,255,255,0.08)", minHeight: 72,
          }}
        >
          <Box component="img" src={logo} alt="Solar CRM" sx={{ height: 40, width: "auto", flexShrink: 0 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1, color: "#FFFFFF", fontSize: "1.05rem" }}>
              Solar CRM
            </Typography>
            <Typography variant="caption" sx={{ color: "#93C5FD", fontSize: "0.7rem", fontWeight: 500 }}>
              Sales Management Platform
            </Typography>
          </Box>
        </Box>

        {/* Plan Badge */}
        {features && (
          <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
            <Chip
              label={features.name || "Starter"}
              size="small"
              sx={{
                bgcolor: "rgba(56,189,248,0.15)",
                color: "#38BDF8",
                fontWeight: 700,
                fontSize: "0.7rem",
                border: "1px solid rgba(56,189,248,0.3)",
              }}
            />
          </Box>
        )}

        {/* Nav Items */}
        <Box
          sx={{
            py: 2, px: 1.8,
            maxHeight: "calc(100vh - 240px)",
            overflowY: "auto",
            "&::-webkit-scrollbar": { width: "4px" },
            "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "4px" },
          }}
        >
          <List disablePadding>
            {navigationMenuItems.map((item) => {
              const isActive  = location.pathname.startsWith(item.path);
              const isLocked  = item.featureKey && !can(item.featureKey);

              const btn = (
                <ListItemButton
                  onClick={() => {
                    if (isLocked) return;
                    navigate(item.path);
                    if (mobileOpen && handleDrawerToggle) handleDrawerToggle();
                  }}
                  sx={{
                    minHeight: 48,
                    borderRadius: "8px",
                    px: 2,
                    backgroundColor: isActive ? "#005BAC" : "transparent",
                    color: isActive ? "#FFFFFF" : isLocked ? "rgba(255,255,255,0.3)" : "#CBD5E1",
                    borderLeft: isActive ? "4px solid #38BDF8" : "4px solid transparent",
                    cursor: isLocked ? "not-allowed" : "pointer",
                    "&:hover": {
                      backgroundColor: isLocked ? "transparent" : isActive ? "#0A6FD8" : "rgba(255,255,255,0.06)",
                      color: isLocked ? "rgba(255,255,255,0.3)" : "#FFFFFF",
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 38, color: isActive ? "#FFFFFF" : isLocked ? "rgba(255,255,255,0.25)" : "#94A3B8" }}>
                    {isLocked ? <LockOutlinedIcon fontSize="small" /> : item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    primaryTypographyProps={{
                      fontSize: "0.88rem",
                      fontWeight: isActive ? 600 : 500,
                      whiteSpace: "nowrap",
                    }}
                  />
                  {isLocked && (
                    <Chip
                      label="Upgrade"
                      size="small"
                      sx={{ fontSize: "0.6rem", height: 18, bgcolor: "rgba(251,191,36,0.2)", color: "#FCD34D" }}
                    />
                  )}
                </ListItemButton>
              );

              return (
                <ListItem disablePadding key={item.title} sx={{ mb: 1 }}>
                  {isLocked ? (
                    <Tooltip title={item.upgradeMsg || "Upgrade your plan"} placement="right">
                      <Box sx={{ width: "100%" }}>{btn}</Box>
                    </Tooltip>
                  ) : btn}
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Box>

      {/* Bottom — User Card + Logout */}
      <Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <Box
          onClick={() => navigate("/profile")}
          sx={{
            p: 1.2, mb: 1.5,
            display: "flex", alignItems: "center", gap: 1.5,
            borderRadius: "10px",
            backgroundColor: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.05)",
            cursor: "pointer",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.09)" },
            transition: "background-color 0.2s ease",
          }}
        >
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            variant="dot"
            sx={{ "& .MuiBadge-badge": { backgroundColor: "#22C55E", color: "#22C55E", boxShadow: "0 0 0 2px #0B3A63", width: 10, height: 10, borderRadius: "50%" } }}
          >
            <Avatar
              src={avatarSrc || undefined}
              imgProps={{ onError: (e) => { e.target.style.display = "none"; } }}
              sx={{ width: 38, height: 38, backgroundColor: "#005BAC", fontSize: "0.875rem", fontWeight: 700, color: "#FFFFFF" }}
            >
              {avatarInitials}
            </Avatar>
          </Badge>
          <Box sx={{ overflow: "hidden" }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, fontSize: "0.85rem", color: "#FFFFFF" }}>
              {fullName}
            </Typography>
            <Typography variant="caption" sx={{ color: "#38BDF8", fontSize: "0.72rem", display: "block", fontWeight: 500 }}>
              {roleName}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 1.5, borderColor: "rgba(255,255,255,0.08)" }} />

        <ListItemButton
          onClick={() => setLogoutDialogOpen(true)}
          sx={{ minHeight: 44, borderRadius: "8px", color: "#F87171", "&:hover": { backgroundColor: "rgba(239,68,68,0.12)" }, px: 2 }}
        >
          <ListItemIcon sx={{ minWidth: 38, color: "#F87171" }}>
            <LogoutOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 600 }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      <Box component="nav" sx={{ width: { md: sidebarWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width: sidebarWidth, borderRight: "none" } }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width: sidebarWidth, borderRight: "none" } }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)} PaperProps={{ sx: { borderRadius: "12px", p: 1, minWidth: 330 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: "#0B3A63", pb: 1 }}>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.9rem", color: "#64748B" }}>
            Are you sure you want to end your current session?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLogoutDialogOpen(false)} sx={{ color: "#64748B", fontWeight: 600 }}>Cancel</Button>
          <Button
            onClick={handleConfirmLogout}
            variant="contained"
            disableElevation
            sx={{ backgroundColor: "#EF4444", "&:hover": { backgroundColor: "#DC2626" }, fontWeight: 600 }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Sidebar;