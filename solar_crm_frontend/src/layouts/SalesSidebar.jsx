import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import CakeOutlinedIcon from "@mui/icons-material/CakeOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import usePlanFeatures from "../hooks/usePlanFeatures";

import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  ListSubheader,
  Chip,
  Tooltip,
  Collapse,
} from "@mui/material";

// Material UI Icons
import DashboardOutlinedIcon     from "@mui/icons-material/DashboardOutlined";
import PhoneInTalkOutlinedIcon   from "@mui/icons-material/PhoneInTalkOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import LogoutOutlinedIcon        from "@mui/icons-material/LogoutOutlined";
import CalculateOutlinedIcon     from "@mui/icons-material/CalculateOutlined";
import DescriptionOutlinedIcon   from "@mui/icons-material/DescriptionOutlined";
import ReceiptLongOutlinedIcon   from "@mui/icons-material/ReceiptLongOutlined";

// Logo
import logo from "../assets/images/logo.png";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  (typeof window !== "undefined" ? window.location.origin : "");

const navigationSections = [
  {
    subheader: "OVERVIEW",
    items: [
      { title: "Dashboard", icon: <DashboardOutlinedIcon />, path: "/sales/dashboard" },
    ],
  },
  {
    subheader: "SALES & LEADS",
    items: [{ title: "Lead Management", icon: <PhoneInTalkOutlinedIcon />, path: "/sales/leads", children: [
      { title: "Today's Follow-up", icon: <EventNoteOutlinedIcon />, path: "/sales/leads/today-followups", badge: "Daily" },
      { title: "My Leads", icon: <FormatListBulletedIcon />, path: "/sales/leads" },
      { title: "Add Lead", icon: <PersonAddAltOutlinedIcon />, path: "/sales/leads?create=true" },
      { title: "Birthdays / Events", icon: <CakeOutlinedIcon />, path: "/sales/leads/birthdays", badge: "Wishes" },
    ] }],
  },
  {
    subheader: "WORKSPACE",
    items: [
      { title: "Solar Calculator", icon: <CalculateOutlinedIcon />, path: "/sales/calculator" },
      { title: 'Subsidy Tracker', icon: <ReceiptLongOutlinedIcon />, path:'/sales/subsidies' },
      { title: "Quotations", icon: <DescriptionOutlinedIcon />, path: "/sales/quotations" },
      { title: "Invoices & Billing", icon: <ReceiptLongOutlinedIcon />, path: "/sales/invoices" },
    ],
  },
  {
    subheader: "ACCOUNT",
    items: [
      { title: "My Profile", icon: <PersonOutlineOutlinedIcon />, path: "/sales/profile" },
    ],
  },
];

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "S";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const SalesSidebar = ({ mobileOpen, handleDrawerToggle, collapsed = false, sidebarWidth = 260 }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();
  const { features } = usePlanFeatures();
  const [leadsOpen, setLeadsOpen] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const fullName       = user?.full_name || user?.name || "Sales Executive";
  const roleName       = user?.role_name || user?.role || "Salesperson";
  const avatarInitials = getInitials(fullName);

  const getAvatarUrl = (imgPath) => {
    if (!imgPath || imgPath === "null" || imgPath === "undefined" || imgPath.trim() === "") return null;
    if (imgPath.startsWith("http")) return imgPath;

    let cleanPath = imgPath.startsWith("/") ? imgPath.slice(1) : imgPath;
    if (!cleanPath.startsWith("uploads/profiles/")) {
      if (cleanPath.startsWith("uploads/")) {
        cleanPath = cleanPath.replace("uploads/", "uploads/profiles/");
      } else {
        cleanPath = `uploads/profiles/${cleanPath}`;
      }
    }
    return `${API_BASE_URL}/${cleanPath}`;
  };

  const avatarSrc = getAvatarUrl(user?.profile_image);

  const handleConfirmLogout = () => {
    if (authLogout) {
      authLogout();
    } else {
      localStorage.clear();
      sessionStorage.clear();
    }
    setLogoutDialogOpen(false);
    navigate("/");
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#0F172A",
        color: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      {/* BRAND HEADER */}
      <Box
        sx={{
          p: collapsed ? 1.2 : 1.5,
          px: collapsed ? 1 : 1.8,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: 1.5,
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          minHeight: 64,
          flexShrink: 0,
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="Solar CRM"
          sx={{ height: 32, width: "auto", flexShrink: 0 }}
        />
        {!collapsed && (
          <Box sx={{ overflow: "hidden" }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                lineHeight: 1.1,
                color: "#FFFFFF",
                fontSize: "0.92rem",
                letterSpacing: "0.02em",
              }}
            >
              Solar CRM
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#F59E0B",
                fontSize: "0.66rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Sales Portal
            </Typography>
          </Box>
        )}
      </Box>

      {/* Plan Badge */}
      {!collapsed && features && (
        <Box sx={{ px: 2, pt: 1, pb: 0 }}>
          <Chip
            label={features.name || "Starter"}
            size="small"
            sx={{
              bgcolor: "rgba(245,158,11,0.15)",
              color: "#F59E0B",
              fontWeight: 700,
              fontSize: "0.7rem",
              border: "1px solid rgba(245,158,11,0.3)",
            }}
          />
        </Box>
      )}

      {/* NAVIGATION SECTIONS */}
      <Box
        sx={{
          flex: 1,
          py: 1,
          px: collapsed ? 0.8 : 1,
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {navigationSections.map((section, idx) => (
          <List
            key={section.subheader}
            disablePadding
            subheader={
              !collapsed && (
                <ListSubheader
                  disableSticky
                  sx={{
                    backgroundColor: "transparent",
                    color: "#64748B",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    lineHeight: "22px",
                    mt: idx > 0 ? 1.2 : 0.2,
                    mb: 0.2,
                    px: 1.2,
                  }}
                >
                  {section.subheader}
                </ListSubheader>
              )
            }
          >
            {section.items.map((item) => {
              if (item.children) {
                const activeGroup = location.pathname.startsWith("/sales/leads");
                return <Box key={item.title} sx={{ mb: 1 }}>
                  <Tooltip title={collapsed ? item.title : ""} placement="right"><ListItemButton onClick={() => { if (collapsed) { navigate(item.path); if (mobileOpen && handleDrawerToggle) handleDrawerToggle(); } else setLeadsOpen(value => !value); }} aria-expanded={collapsed ? undefined : leadsOpen} sx={{ borderRadius: "8px", minHeight: 42, color: activeGroup ? "#F59E0B" : "#94A3B8", bgcolor: activeGroup ? "rgba(245,158,11,0.1)" : "transparent", px: 1.2, justifyContent: collapsed ? "center" : "flex-start" }}><ListItemIcon sx={{ minWidth: collapsed ? 0 : 30, color: "inherit" }}>{item.icon}</ListItemIcon>{!collapsed && <><ListItemText primary={item.title} slotProps={{ primary: { fontSize: "0.82rem", fontWeight: 700 } }} /><ExpandMoreIcon sx={{ transform: leadsOpen ? "rotate(180deg)" : "none", fontSize: 18 }} /></>}</ListItemButton></Tooltip>
                  <Collapse in={!collapsed && leadsOpen}><List disablePadding sx={{ mt: 0.75, ml: 1, borderLeft: "2px solid rgba(148,163,184,0.15)", pl: 0.75 }}>{item.children.map(child => {
                    const active = child.path.includes("?") ? `${location.pathname}${location.search}` === child.path : location.pathname === child.path && !location.search;
                    return <ListItemButton key={child.path} onClick={() => { navigate(child.path); if (mobileOpen && handleDrawerToggle) handleDrawerToggle(); }} selected={active} sx={{ borderRadius: "8px", minHeight: 42, px: 1, mb: 0.5, color: active ? "#F59E0B" : "#94A3B8", "&.Mui-selected": { bgcolor: "rgba(148,163,184,0.12)" }, "&:hover": { bgcolor: "rgba(148,163,184,0.08)" } }}><ListItemIcon sx={{ minWidth: 27, color: "inherit", "& .MuiSvgIcon-root": { fontSize: 19 } }}>{child.icon}</ListItemIcon><ListItemText primary={child.title} slotProps={{ primary: { fontSize: "0.78rem", fontWeight: active ? 700 : 500 } }} />{child.badge && <Chip size="small" label={child.badge} sx={{ height: 20, ml: 0.5, borderRadius: "6px", bgcolor: "rgba(148,163,184,0.12)", color: "#94A3B8", fontSize: "0.62rem", fontWeight: 700, "& .MuiChip-label": { px: 0.75 } }} />}</ListItemButton>;
                  })}</List></Collapse>
                </Box>;
              }
              const isActive = location.pathname === item.path;

              return (
                <ListItem disablePadding key={item.title} sx={{ mb: 0.3 }}>
                  <Tooltip title={collapsed ? item.title : ""} placement="right" arrow>
                    <ListItemButton
                      onClick={() => {
                        navigate(item.path);
                        if (mobileOpen && handleDrawerToggle) handleDrawerToggle();
                      }}
                      sx={{
                        minHeight: 38,
                        borderRadius: "6px",
                        px: collapsed ? 1 : 1.2,
                        justifyContent: collapsed ? "center" : "flex-start",
                        backgroundColor: isActive ? "rgba(245,158,11,0.15)" : "transparent",
                        color: isActive ? "#F59E0B" : "#94A3B8",
                        borderLeft: collapsed ? "none" : isActive ? "3px solid #F59E0B" : "3px solid transparent",
                        borderBottom: collapsed && isActive ? "2px solid #F59E0B" : "none",
                        "&:hover": {
                          backgroundColor: isActive ? "rgba(245,158,11,0.2)" : "rgba(255, 255, 255, 0.06)",
                          color: "#FFFFFF",
                        },
                        transition: "all 0.15s ease-in-out",
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: collapsed ? 0 : 28,
                          justifyContent: "center",
                          color: isActive ? "#F59E0B" : "#94A3B8",
                          "& .MuiSvgIcon-root": { fontSize: "1.1rem" },
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {!collapsed && (
                        <ListItemText
                          primary={item.title}
                          slotProps={{
                            primary: {
                              fontFamily: "'Inter', sans-serif",
                              fontSize: "0.8rem",
                              fontWeight: isActive ? 600 : 500,
                              whiteSpace: "nowrap",
                            },
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

      {/* FOOTER: PROFILE & LOGOUT */}
      <Box sx={{ p: collapsed ? 0.8 : 1.2, borderTop: "1px solid rgba(255, 255, 255, 0.08)", flexShrink: 0, backgroundColor: "#0F172A" }}>
        <Tooltip title={collapsed ? `${fullName} (${roleName})` : ""} placement="right" arrow>
          <Box
            onClick={() => navigate("/sales/profile")}
            sx={{
              p: 0.8,
              mb: 0.6,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: 1.2,
              borderRadius: "6px",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              cursor: "pointer",
              "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.08)" },
              transition: "background-color 0.15s ease",
            }}
          >
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              variant="dot"
              sx={{
                "& .MuiBadge-badge": {
                  backgroundColor: "#22C55E",
                  color: "#22C55E",
                  boxShadow: "0 0 0 2px #0F172A",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                },
              }}
            >
              <Avatar
                key={user?.id || avatarInitials}
                src={avatarSrc || undefined}
                sx={{
                  width: 32,
                  height: 32,
                  background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "#FFFFFF",
                }}
              >
                {avatarInitials}
              </Avatar>
            </Badge>

            {!collapsed && (
              <Box sx={{ overflow: "hidden" }}>
                <Typography
                  variant="subtitle2"
                  noWrap
                  sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.78rem", color: "#FFFFFF" }}
                >
                  {fullName}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontFamily: "'Inter', sans-serif", color: "#F59E0B", fontSize: "0.66rem", display: "block", fontWeight: 600 }}
                >
                  {roleName}
                </Typography>
              </Box>
            )}
          </Box>
        </Tooltip>

        <Divider sx={{ mb: 0.6, borderColor: "rgba(255, 255, 255, 0.08)" }} />

        <Tooltip title={collapsed ? "Logout" : ""} placement="right" arrow>
          <ListItemButton
            onClick={() => setLogoutDialogOpen(true)}
            sx={{
              minHeight: 34,
              borderRadius: "6px",
              color: "#F87171",
              justifyContent: collapsed ? "center" : "flex-start",
              "&:hover": { backgroundColor: "rgba(239, 68, 68, 0.12)" },
              px: collapsed ? 1 : 1.2,
            }}
          >
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 28, justifyContent: "center", color: "#F87171", "& .MuiSvgIcon-root": { fontSize: "1.1rem" } }}>
              <LogoutOutlinedIcon />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Logout"
                slotProps={{
                  primary: { fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", fontWeight: 600 },
                }}
              />
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

      {/* CONFIRM LOGOUT DIALOG */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: "10px", p: 0.5, minWidth: 300 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#0B3A63", pb: 1, fontSize: "0.98rem" }}>
          Confirm Logout
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.85rem", color: "#64748B" }}>
            Are you sure you want to end your current Sales session?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5 }}>
          <Button
            onClick={() => setLogoutDialogOpen(false)}
            sx={{ color: "#64748B", fontWeight: 600, fontSize: "0.8rem" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmLogout}
            variant="contained"
            disableElevation
            sx={{
              backgroundColor: "#EF4444",
              "&:hover": { backgroundColor: "#DC2626" },
              fontWeight: 600,
              fontSize: "0.8rem",
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SalesSidebar;
