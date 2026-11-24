import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Divider, Avatar, Badge,
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button, Tooltip,
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
  (typeof window !== "undefined" ? window.location.origin : "");

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
      { title: "My Tasks & Blockers", icon: <AssignmentTurnedInOutlinedIcon />, path: "/engineer/tasks" },
      { title: "Service & AMC", icon: <EngineeringOutlinedIcon />, path: "/engineer/service" },
      { title: "Assigned Projects", icon: <EngineeringOutlinedIcon />, path: "/engineer/projects" },
      { title:'Subsidy Tracker',icon:<AssignmentTurnedInOutlinedIcon />,path:'/engineer/subsidies' },
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
  const compact = collapsed && !mobileOpen;
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
  const avatarInitials = userName.trim().split(/\s+/).map(word=>word[0]).filter(Boolean).slice(0,2).join('').toUpperCase();
  const imagePath = typeof user?.profile_image === 'string' ? user.profile_image.trim() : '';
  const cleanImage = imagePath.replace(/^\//,'');
  const avatarSrc = !imagePath || ['null','undefined'].includes(imagePath) ? undefined : /^https?:\/\//.test(imagePath) ? imagePath : `${API_BASE_URL.replace(/\/api\/?$/,'').replace(/\/$/,'')}/${cleanImage.startsWith('uploads/profiles/') ? cleanImage : 'uploads/profiles/'+cleanImage.replace(/^uploads\//,'')}`;
  const roleName = "Site Engineer";

  const drawerContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#0F172A",
        color: "#F8FAFC",
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      {/* Brand Header */}
      <Box sx={{ flexShrink: 0, p: compact ? 1.5 : 2.5, display: "flex", alignItems: "center", gap: 1.5, justifyContent: compact ? "center" : "flex-start" }}>
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
        {!compact && (
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

      {/* NAVIGATION LIST */}
      <Box aria-label="Engineer navigation" sx={{ flexGrow: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", py: 2, px: compact ? 1 : 1.5, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
        {navigationSections.map((section, idx) => (
          <List
            key={idx}
            disablePadding
          >
            {idx > 0 && <Box sx={{mt:2.2,mb:0.8,px:compact?0.5:0.8}}>
              <Divider sx={{mb:1.2,borderColor:'rgba(255,255,255,0.08)'}} />
              {!compact && <Typography sx={{color:'#64748B',fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.1em',px:1}}>{section.subheader}</Typography>}
            </Box>}
            {section.items.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
                  <Tooltip title={compact ? item.title : ""} placement="right">
                    <ListItemButton
                      onClick={() => handleNavClick(item.path)}
                      sx={{
                        borderRadius: "8px",
                        minHeight: 44,
                        py: 1,
                        px: compact ? 1.5 : 2,
                        backgroundColor: isActive ? "rgba(245,158,11,0.12)" : "transparent",
                        borderLeft: isActive ? "4px solid #F59E0B" : "4px solid transparent",
                        justifyContent: compact ? "center" : "flex-start",
                        transition: "all 0.2s ease-in-out",
                        color: isActive ? "#F59E0B" : "#94A3B8",
                        "&:hover": {
                          backgroundColor: isActive ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.06)",
                          color: "#FFFFFF",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: isActive ? "#F59E0B" : "#94A3B8",
                          minWidth: compact ? 0 : 36,
                          justifyContent: "center",
                          "& svg": { fontSize: "1.2rem" },
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {!compact && (
                        <ListItemText
                          primary={item.title}
                          primaryTypographyProps={{
                            fontSize: "0.88rem",
                            fontWeight: isActive ? 600 : 500,
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

      {/* Fixed Bottom — User Card + Logout */}
      <Box sx={{ flexShrink: 0, p: compact ? 1 : 2, borderTop: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#0F172A" }}>
        <Tooltip title={compact ? `${userName} (${roleName})` : ""} placement="right" arrow>
          <Box
            onClick={() => handleNavClick("/engineer/profile")}
            sx={{
              p: compact ? 0.8 : 1.2,
              mb: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: compact ? "center" : "flex-start",
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
            {!compact && (
              <Box sx={{ overflow: "hidden" }}>
                <Typography variant="subtitle2" noWrap sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.85rem", color: "#FFFFFF" }}>
                  {userName}
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: "'Inter', sans-serif", color: "#F59E0B", fontSize: "0.72rem", display: "block", fontWeight: 600 }}>
                  {roleName}
                </Typography>
              </Box>
            )}
          </Box>
        </Tooltip>

        <Divider sx={{ mb: 1.5, borderColor: "rgba(255,255,255,0.08)" }} />

        <Tooltip title={compact ? "Logout" : ""} placement="right" arrow>
          <ListItemButton
            onClick={() => setLogoutDialogOpen(true)}
            sx={{
              minHeight: 40,
              borderRadius: "8px",
              color: "#F87171",
              justifyContent: compact ? "center" : "flex-start",
              px: compact ? 1 : 1.8,
              "&:hover": { backgroundColor: "rgba(239,68,68,0.12)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: compact ? 0 : 36, justifyContent: "center", color: "#F87171" }}>
              <LogoutOutlinedIcon fontSize="small" />
            </ListItemIcon>
            {!compact && (
              <ListItemText primary="Logout" slotProps={{ primary: { fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", fontWeight: 600 } }} />
            )}
          </ListItemButton>
        </Tooltip>
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
              overflowY: "hidden",
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
              overflowY: "hidden",
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
        slotProps={{ paper: { sx: { borderRadius: "12px", p: 1, width: "min(330px, calc(100vw - 64px))" } } }}
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
