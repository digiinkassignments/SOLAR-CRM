import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Chip,
  Divider,
  Tooltip,
  Stack,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Breadcrumbs,
  InputBase,
  Paper,
} from "@mui/material";

// Icons
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import SearchIcon from "@mui/icons-material/Search";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";

import { useAuth } from "../context/AuthContext";

const SIDEBAR_WIDTH = 264;
const NAVBAR_HEIGHT = 64;

const GOOGLE_COLORS = {
  blue: "#1A73E8",
  blueDark: "#0B57D0",
  blueSoft: "#E8F0FE",
  bgSidebar: "#0F172A", // Google Cloud Console dark slate
  bgSidebarItemHover: "rgba(255, 255, 255, 0.08)",
  textSidebar: "#94A3B8",
  textSidebarActive: "#FFFFFF",
  bgMain: "#F8F9FA",
  cardBorder: "#E0E0E0",
  headerBg: "#FFFFFF",
};

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: <DashboardOutlinedIcon />, activeIcon: <DashboardIcon /> },
  { label: "Clients", path: "/clients", icon: <PeopleAltOutlinedIcon />, activeIcon: <PeopleAltIcon /> },
  { label: "Payments", path: "/payments", icon: <AccountBalanceWalletOutlinedIcon />, activeIcon: <AccountBalanceWalletIcon /> },
  { label: "Plans", path: "/plans", icon: <AutoAwesomeOutlinedIcon />, activeIcon: <AutoAwesomeIcon /> },
  { label: "Settings", path: "/settings", icon: <SettingsOutlinedIcon />, activeIcon: <SettingsIcon /> },
];

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "D";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getPageMetadata = (pathname) => {
  if (pathname.startsWith("/clients/new")) return { title: "Create New Client", breadcrumb: "New Client" };
  if (pathname.startsWith("/clients/")) return { title: "Client Details", breadcrumb: "Client Info" };
  if (pathname.startsWith("/clients")) return { title: "Client Management", breadcrumb: "Clients" };
  if (pathname.startsWith("/payments")) return { title: "Payments & Audits", breadcrumb: "Payments" };
  if (pathname.startsWith("/plans")) return { title: "Subscription Tiers", breadcrumb: "Plans" };
  if (pathname.startsWith("/settings")) return { title: "Master Settings", breadcrumb: "Settings" };
  return { title: "Console Dashboard", breadcrumb: "Dashboard" };
};

const AdminLayout = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const adminName = admin?.full_name || admin?.name || "Digiink Admin";
  const avatarInitials = getInitials(adminName);
  const pageMeta = getPageMetadata(location.pathname);

  const formattedDate = currentTime.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const handleConfirmLogout = () => {
    setLogoutDialogOpen(false);
    logout();
    navigate("/login");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/clients?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: GOOGLE_COLORS.bgSidebar,
        color: "#FFFFFF",
      }}
    >
      <Box>
        {/* Brand Header */}
        <Box
          sx={{
            p: 2.5,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            minHeight: NAVBAR_HEIGHT,
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="Digiink"
            sx={{
              height: 36,
              width: "auto",
              objectFit: "contain",
              maxHeight: 36,
            }}
          />
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, lineHeight: 1.1, color: "#FFFFFF", fontSize: "0.98rem", letterSpacing: "-0.01em" }}
            >
              Digiink Console
            </Typography>
            <Typography variant="caption" sx={{ color: "#38BDF8", fontSize: "0.7rem", fontWeight: 600 }}>
              Google Cloud SaaS Platform
            </Typography>
          </Box>
        </Box>

        {/* Console Pill Badge */}
        <Box sx={{ px: 2.5, pt: 2, pb: 0.5 }}>
          <Chip
            icon={<ShieldOutlinedIcon sx={{ fontSize: "14px !important", color: "#38BDF8" }} />}
            label="Super Admin Mode"
            size="small"
            sx={{
              bgcolor: "rgba(56, 189, 248, 0.12)",
              color: "#38BDF8",
              fontWeight: 700,
              fontSize: "0.7rem",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              borderRadius: "16px",
            }}
          />
        </Box>

        {/* Nav Items List */}
        <Box sx={{ py: 2, px: 1.5 }}>
          <List disablePadding>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));

              return (
                <ListItem disablePadding key={item.label} sx={{ mb: 0.8 }}>
                  <ListItemButton
                    onClick={() => {
                      navigate(item.path);
                      if (mobileOpen) setMobileOpen(false);
                    }}
                    sx={{
                      minHeight: 46,
                      borderRadius: "24px", // Google Material 3 rounded pill style
                      px: 2.2,
                      backgroundColor: isActive ? GOOGLE_COLORS.blue : "transparent",
                      color: isActive ? "#FFFFFF" : GOOGLE_COLORS.textSidebar,
                      "&:hover": {
                        backgroundColor: isActive ? GOOGLE_COLORS.blueDark : GOOGLE_COLORS.bgSidebarItemHover,
                        color: "#FFFFFF",
                      },
                      transition: "all 0.15s ease-in-out",
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: isActive ? "#FFFFFF" : GOOGLE_COLORS.textSidebar,
                      }}
                    >
                      {isActive ? item.activeIcon : item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: "0.875rem",
                        fontWeight: isActive ? 700 : 500,
                        whiteSpace: "nowrap",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Box>

      {/* Bottom User Card & Logout */}
      <Box sx={{ p: 2, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <Box
          sx={{
            p: 1.2,
            mb: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            borderRadius: "12px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
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
                boxShadow: `0 0 0 2px ${GOOGLE_COLORS.bgSidebar}`,
                width: 10,
                height: 10,
                borderRadius: "50%",
              },
            }}
          >
            <Avatar
              sx={{
                width: 38,
                height: 38,
                backgroundColor: GOOGLE_COLORS.blue,
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#FFFFFF",
              }}
            >
              {avatarInitials}
            </Avatar>
          </Badge>
          <Box sx={{ overflow: "hidden" }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#FFFFFF" }}>
              {adminName}
            </Typography>
            <Typography variant="caption" sx={{ color: "#38BDF8", fontSize: "0.7rem", display: "block", fontWeight: 600 }}>
              Master Admin
            </Typography>
          </Box>
        </Box>

        <ListItemButton
          onClick={() => setLogoutDialogOpen(true)}
          sx={{
            minHeight: 42,
            borderRadius: "20px",
            color: "#F87171",
            "&:hover": { backgroundColor: "rgba(239, 68, 68, 0.12)" },
            px: 2,
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: "#F87171" }}>
            <LogoutOutlinedIcon sx={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText primary="Sign Out" primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 600 }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: GOOGLE_COLORS.bgMain }}>
      {/* Sidebar Navigation */}
      <Box component="nav" sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: SIDEBAR_WIDTH,
              borderRight: "none",
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
              width: SIDEBAR_WIDTH,
              borderRight: "none",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: GOOGLE_COLORS.bgMain,
        }}
      >
        {/* Google Top App Bar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: GOOGLE_COLORS.headerBg,
            borderBottom: `1px solid ${GOOGLE_COLORS.cardBorder}`,
            color: "#202124",
            zIndex: 1100,
          }}
        >
          <Toolbar
            sx={{
              minHeight: `${NAVBAR_HEIGHT}px !important`,
              px: { xs: 2, sm: 3, md: 3.5 },
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
            }}
          >
            {/* Left: Mobile Toggle & Page Title / Breadcrumb */}
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <IconButton
                sx={{ display: { md: "none" }, color: "#202124" }}
                onClick={() => setMobileOpen(true)}
              >
                <MenuIcon />
              </IconButton>
              <Box>
                <Breadcrumbs
                  separator={<KeyboardArrowRightIcon sx={{ fontSize: 14, color: "#5F6368" }} />}
                  aria-label="breadcrumb"
                  sx={{ mb: 0.1 }}
                >
                  <Typography variant="caption" sx={{ color: "#5F6368", fontWeight: 500, fontSize: "0.75rem" }}>
                    Digiink Console
                  </Typography>
                  <Typography variant="caption" sx={{ color: GOOGLE_COLORS.blue, fontWeight: 700, fontSize: "0.75rem" }}>
                    {pageMeta.breadcrumb}
                  </Typography>
                </Breadcrumbs>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: "#202124",
                    fontSize: "1.05rem",
                    lineHeight: 1.2,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {pageMeta.title}
                </Typography>
              </Box>
            </Stack>

            {/* Middle: Google Style Rounded Search Bar */}
            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                backgroundColor: "#F1F3F4",
                borderRadius: "28px",
                px: 2,
                py: 0.6,
                width: 320,
                transition: "all 0.2s ease",
                "&:focus-within": {
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 1px 6px rgba(32, 33, 36, 0.28)",
                  width: 380,
                },
              }}
            >
              <SearchIcon sx={{ color: "#5F6368", fontSize: 20, mr: 1 }} />
              <InputBase
                placeholder="Search clients, code, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  fontSize: "0.85rem",
                  color: "#202124",
                  width: "100%",
                }}
              />
            </Box>

            {/* Right: Clock, Master Access Badge & Google Profile Avatar */}
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{ display: { xs: "none", lg: "flex" }, alignItems: "center", gap: 1 }}>
                <AccessTimeOutlinedIcon sx={{ fontSize: 16, color: "#5F6368" }} />
                <Typography variant="caption" sx={{ color: "#5F6368", fontWeight: 600, fontSize: "0.78rem" }}>
                  {formattedDate} • {formattedTime}
                </Typography>
              </Box>

              <Chip
                icon={<ShieldOutlinedIcon sx={{ fontSize: "14px !important", color: GOOGLE_COLORS.blue }} />}
                label="Master Console"
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  bgcolor: GOOGLE_COLORS.blueSoft,
                  color: GOOGLE_COLORS.blue,
                  border: `1px solid rgba(26, 115, 232, 0.25)`,
                  height: 28,
                  borderRadius: "16px",
                }}
              />

              <Tooltip title={`Signed in as ${adminName}`}>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    backgroundColor: GOOGLE_COLORS.blue,
                    color: "#FFFFFF",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
                    cursor: "pointer",
                  }}
                >
                  {avatarInitials}
                </Avatar>
              </Tooltip>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Scrollable Main Content */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 3.5 },
            overflowY: "auto",
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: "16px", p: 1, minWidth: 330 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#202124", pb: 1 }}>Sign Out of Console?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.88rem", color: "#5F6368" }}>
            Are you sure you want to end your current Super Admin session?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLogoutDialogOpen(false)} sx={{ color: "#5F6368", fontWeight: 600, textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmLogout}
            variant="contained"
            disableElevation
            sx={{
              backgroundColor: "#D93025",
              "&:hover": { backgroundColor: "#B3261E" },
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "8px",
            }}
          >
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminLayout;