import React, { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import usePlanFeatures from "../../hooks/usePlanFeatures";

import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Divider, Avatar, Badge,
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button, Tooltip, Chip, Collapse,
} from "@mui/material";

import DashboardOutlinedIcon   from "@mui/icons-material/DashboardOutlined";
import GroupOutlinedIcon       from "@mui/icons-material/GroupOutlined";
import SolarPowerOutlinedIcon  from "@mui/icons-material/SolarPowerOutlined";
import AssessmentOutlinedIcon  from "@mui/icons-material/AssessmentOutlined";
import SettingsOutlinedIcon    from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon      from "@mui/icons-material/LogoutOutlined";
import LockOutlinedIcon        from "@mui/icons-material/LockOutlined";
import CalculateOutlinedIcon   from "@mui/icons-material/CalculateOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import Inventory2OutlinedIcon  from "@mui/icons-material/Inventory2Outlined";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import FormatListBulletedOutlinedIcon from "@mui/icons-material/FormatListBulletedOutlined";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import CakeOutlinedIcon from "@mui/icons-material/CakeOutlined";
import EngineeringIcon from "@mui/icons-material/Engineering";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

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

const Sidebar = ({ mobileOpen, handleDrawerToggle, collapsed = false, sidebarWidth = 260 }) => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const { can } = usePlanFeatures();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const fullName       = user?.full_name || user?.name || "User";
  const roleName       = user?.role_name || user?.role || "Administrator";
  const avatarInitials = getInitials(fullName);

  const [leadsMenuOpen, setLeadsMenuOpen] = useState(
    location.pathname.startsWith("/leads")
  );

  React.useEffect(() => {
    if (location.pathname.startsWith("/leads")) {
      setLeadsMenuOpen(true);
    }
  }, [location.pathname]);

  const leadSubItems = [
    { title: "Today's Follow-up", icon: <EventNoteOutlinedIcon sx={{ fontSize: 17 }} />, path: "/leads/today-followups", badge: "Daily" },
    { title: "All Leads", icon: <FormatListBulletedOutlinedIcon sx={{ fontSize: 17 }} />, path: "/leads" },
    { title: "+ Add Lead", icon: <PersonAddOutlinedIcon sx={{ fontSize: 17 }} />, path: "/leads?create=true" },
    { title: "Birthdays / Events", icon: <CakeOutlinedIcon sx={{ fontSize: 17 }} />, path: "/leads/birthdays", badge: "Wishes" },
  ];

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

  const navigationMenuItems = [
    { title: "Dashboard", icon: <DashboardOutlinedIcon />, path: "/dashboard", featureKey: null },
    { title: "Lead Management", icon: <SolarPowerOutlinedIcon />, path: "/leads", featureKey: null },
    { title: "User Management", icon: <GroupOutlinedIcon />, path: "/users", featureKey: null },
    { title: "Stock Management", icon: <Inventory2OutlinedIcon />, path: "/stock", featureKey: null },
    { title: "Solar Calculator", icon: <CalculateOutlinedIcon />, path: "/calculator", featureKey: null },
    { title: "Quotations", icon: <DescriptionOutlinedIcon />, path: "/quotations", featureKey: null },
    { title: "Invoices & Billing", icon: <ReceiptLongOutlinedIcon />, path: "/invoices", featureKey: null },
    { isSection: true, title: "PROJECT EXECUTION" },
    { title: "Projects", icon: <EngineeringIcon />, path: "/projects", featureKey: null },
    { title: "Procurement", icon: <LocalShippingIcon />, path: "/procurement", featureKey: null },
    { title: "Subsidy Tracking", icon: <AccountBalanceIcon />, path: "/subsidies", featureKey: null },
    { title: "Reports", icon: <AssessmentOutlinedIcon />, path: "/reports", featureKey: "feature_reports" },
    { title: "Settings", icon: <SettingsOutlinedIcon />, path: "/settings", featureKey: null },
  ];

  const handleConfirmLogout = () => {
    setLogoutDialogOpen(false);
    logout?.();
  };

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#0F172A", color: "#FFFFFF" }}>
      {/* Brand Header */}
      <Box sx={{ p: collapsed ? 1.5 : 2.5, display: "flex", alignItems: "center", gap: 1.5, justifyContent: collapsed ? "center" : "flex-start" }}>
        <Box
          component="img"
          src={logo}
          alt="Solar CRM Logo"
          sx={{
            width: 38,
            height: 38,
            objectFit: "contain",
            borderRadius: "8px",
            bgcolor: "#FFFFFF",
            p: 0.4,
          }}
        />
        {!collapsed && (
          <Box sx={{ overflow: "hidden" }}>
            <Typography variant="h6" noWrap sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#FFFFFF", lineHeight: 1.1 }}>
              Solar CRM
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: "'Inter', sans-serif", color: "#F59E0B", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", display: "block" }}>
              ENTERPRISE PLATFORM
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

      {/* Navigation List */}
      <Box
        sx={{
          flexGrow: 1,
          px: collapsed ? 1 : 1.5,
          py: 2,
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        <List disablePadding>
          {navigationMenuItems.map((item) => {
            if (item.isSection) {
              return (
                <Box key={item.title} sx={{ mt: 1.8, mb: 0.6, px: collapsed ? 0.5 : 0.8 }}>
                  {!collapsed ? (
                    <Typography
                      sx={{
                        fontFamily: "'Inter', sans-serif",
                        color: "#64748B",
                        fontSize: "0.64rem",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        px: 1,
                        py: 0.4,
                      }}
                    >
                      {item.title}
                    </Typography>
                  ) : (
                    <Divider sx={{ my: 0.8, borderColor: "rgba(255,255,255,0.08)" }} />
                  )}
                </Box>
              );
            }

            const isLeadMgmt = item.title === "Lead Management";
            const isActive = location.pathname.startsWith(item.path);
            const isLocked = item.featureKey && !can(item.featureKey);

            if (isLeadMgmt && !collapsed) {
              return (
                <ListItem disablePadding key={item.title} sx={{ mb: 0.5, display: "block" }}>
                  <ListItemButton
                    data-tour="sidebar-leads"
                    onClick={() => {
                      setLeadsMenuOpen((prev) => !prev);
                    }}
                    sx={{
                      minHeight: 44,
                      borderRadius: "8px",
                      px: 1.8,
                      justifyContent: "flex-start",
                      backgroundColor: isActive ? "rgba(245,158,11,0.12)" : "transparent",
                      color: isActive ? "#F59E0B" : "#94A3B8",
                      borderLeft: isActive ? "4px solid #F59E0B" : "4px solid transparent",
                      "&:hover": {
                        backgroundColor: isActive ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.06)",
                        color: "#FFFFFF",
                      },
                      transition: "all 0.2s ease-in-out",
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, justifyContent: "center", color: isActive ? "#F59E0B" : "#94A3B8" }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "0.88rem",
                            fontWeight: isActive ? 600 : 500,
                            whiteSpace: "nowrap",
                            color: isActive ? "#F59E0B" : "#94A3B8",
                          }}
                        >
                          {item.title}
                        </Typography>
                      }
                    />
                    {leadsMenuOpen ? (
                      <ExpandLessIcon sx={{ fontSize: 18, color: isActive ? "#F59E0B" : "#94A3B8" }} />
                    ) : (
                      <ExpandMoreIcon sx={{ fontSize: 18, color: isActive ? "#F59E0B" : "#94A3B8" }} />
                    )}
                  </ListItemButton>

                  <Collapse in={leadsMenuOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ pt: 0.5, pb: 0.5 }}>
                      {leadSubItems.map((sub) => {
                        const isSubActive =
                          sub.path.includes("?")
                            ? location.pathname === "/leads" && location.search.includes("create=true")
                            : sub.path === "/leads"
                            ? location.pathname === "/leads" && !location.search.includes("create=true")
                            : location.pathname === sub.path;

                        return (
                          <ListItemButton
                            key={sub.title}
                            onClick={() => {
                              navigate(sub.path);
                              if (mobileOpen && handleDrawerToggle) handleDrawerToggle();
                            }}
                            sx={{
                              minHeight: 36,
                              borderRadius: "6px",
                              pl: 4.2,
                              pr: 1.5,
                              mb: 0.3,
                              justifyContent: "flex-start",
                              backgroundColor: isSubActive ? "rgba(245,158,11,0.18)" : "transparent",
                              color: isSubActive ? "#F59E0B" : "#94A3B8",
                              borderLeft: isSubActive ? "2px solid #F59E0B" : "2px solid rgba(255,255,255,0.08)",
                              "&:hover": {
                                backgroundColor: isSubActive ? "rgba(245,158,11,0.22)" : "rgba(255,255,255,0.06)",
                                color: "#FFFFFF",
                              },
                              transition: "all 0.15s ease",
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 26, justifyContent: "center", color: isSubActive ? "#F59E0B" : "#94A3B8" }}>
                              {sub.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography
                                  sx={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: "0.8rem",
                                    fontWeight: isSubActive ? 600 : 500,
                                    whiteSpace: "nowrap",
                                    color: isSubActive ? "#F59E0B" : "#94A3B8",
                                  }}
                                >
                                  {sub.title}
                                </Typography>
                              }
                            />
                            {sub.badge && (
                              <Chip
                                label={sub.badge}
                                size="small"
                                sx={{
                                  fontSize: "0.62rem",
                                  height: 18,
                                  fontWeight: 700,
                                  bgcolor: isSubActive ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.08)",
                                  color: isSubActive ? "#F59E0B" : "#94A3B8",
                                }}
                              />
                            )}
                          </ListItemButton>
                        );
                      })}
                    </List>
                  </Collapse>
                </ListItem>
              );
            }

            const btn = (
              <ListItemButton
                data-tour={`sidebar-${item.path.replace("/", "")}`}
                onClick={() => {
                  if (isLocked) return;
                  navigate(item.path);
                  if (mobileOpen && handleDrawerToggle) handleDrawerToggle();
                }}
                sx={{
                  minHeight: 44,
                  borderRadius: "8px",
                  px: collapsed ? 1 : 1.8,
                  justifyContent: collapsed ? "center" : "flex-start",
                  backgroundColor: isActive ? "rgba(245,158,11,0.15)" : "transparent",
                  color: isActive ? "#F59E0B" : isLocked ? "rgba(255,255,255,0.3)" : "#94A3B8",
                  borderLeft: collapsed ? "none" : isActive ? "4px solid #F59E0B" : "4px solid transparent",
                  borderBottom: collapsed && isActive ? "2px solid #F59E0B" : "none",
                  cursor: isLocked ? "not-allowed" : "pointer",
                  "&:hover": {
                    backgroundColor: isLocked ? "transparent" : isActive ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.06)",
                    color: isLocked ? "rgba(255,255,255,0.3)" : "#FFFFFF",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, justifyContent: "center", color: isActive ? "#F59E0B" : isLocked ? "rgba(255,255,255,0.25)" : "#94A3B8" }}>
                  {isLocked ? <LockOutlinedIcon fontSize="small" /> : item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={
                      <Typography
                        sx={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "0.88rem",
                          fontWeight: isActive ? 600 : 500,
                          whiteSpace: "nowrap",
                          color: isActive ? "#F59E0B" : isLocked ? "rgba(255,255,255,0.3)" : "#94A3B8",
                        }}
                      >
                        {item.title}
                      </Typography>
                    }
                  />
                )}
                {!collapsed && isLocked && (
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
                <Tooltip title={collapsed ? item.title : isLocked ? (item.upgradeMsg || "Upgrade your plan") : ""} placement="right" arrow>
                  <Box sx={{ width: "100%" }}>{btn}</Box>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Fixed Bottom — User Card + Logout */}
      <Box sx={{ flexShrink: 0, p: collapsed ? 1 : 2, borderTop: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#0F172A" }}>
        <Tooltip title={collapsed ? `${fullName} (${roleName})` : ""} placement="right" arrow>
          <Box
            onClick={() => navigate("/profile")}
            sx={{
              p: collapsed ? 0.8 : 1.2,
              mb: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: 1.5,
              borderRadius: "10px",
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.05)",
              cursor: "pointer",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.09)" },
              transition: "all 0.2s ease",
            }}
          >
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              variant="dot"
              sx={{ "& .MuiBadge-badge": { backgroundColor: "#22C55E", color: "#22C55E", boxShadow: "0 0 0 2px #0F172A", width: 10, height: 10, borderRadius: "50%" } }}
            >
              <Avatar
                src={avatarSrc || undefined}
                slotProps={{ img: { onError: (e) => { e.target.style.display = "none"; } } }}
                sx={{ width: 36, height: 36, background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", fontSize: "0.85rem", fontWeight: 700, color: "#FFFFFF" }}
              >
                {avatarInitials}
              </Avatar>
            </Badge>
            {!collapsed && (
              <Box sx={{ overflow: "hidden" }}>
                <Typography variant="subtitle2" noWrap sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.85rem", color: "#FFFFFF" }}>
                  {fullName}
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: "'Inter', sans-serif", color: "#F59E0B", fontSize: "0.72rem", display: "block", fontWeight: 600 }}>
                  {roleName}
                </Typography>
              </Box>
            )}
          </Box>
        </Tooltip>

        <Divider sx={{ mb: 1.5, borderColor: "rgba(255,255,255,0.08)" }} />

        <Tooltip title={collapsed ? "Logout" : ""} placement="right" arrow>
          <ListItemButton
            onClick={() => setLogoutDialogOpen(true)}
            sx={{
              minHeight: 40,
              borderRadius: "8px",
              color: "#F87171",
              justifyContent: collapsed ? "center" : "flex-start",
              px: collapsed ? 1 : 1.8,
              "&:hover": { backgroundColor: "rgba(239,68,68,0.12)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, justifyContent: "center", color: "#F87171" }}>
              <LogoutOutlinedIcon fontSize="small" />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText primary="Logout" slotProps={{ primary: { fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", fontWeight: 600 } }} />
            )}
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <>
      <Box component="nav" sx={{ width: { md: sidebarWidth }, flexShrink: { md: 0 }, transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)" }}>
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