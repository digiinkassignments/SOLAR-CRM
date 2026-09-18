import React, { useState, useEffect, useMemo } from "react";
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
} from "@mui/material";

// Icons
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";

import { useAuth } from "../context/AuthContext";

const SIDEBAR_WIDTH = 280;
const NAVBAR_HEIGHT = 72;

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: <DashboardOutlinedIcon /> },
  { label: "Clients", path: "/clients", icon: <PeopleAltOutlinedIcon /> },
  { label: "Payments", path: "/payments", icon: <AccountBalanceWalletOutlinedIcon /> },
  { label: "Plans", path: "/plans", icon: <AutoAwesomeOutlinedIcon /> },
  { label: "Settings", path: "/settings", icon: <SettingsOutlinedIcon /> },
];

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "D";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getPageMetadata = (pathname) => {
  if (pathname.startsWith("/clients/new")) return { title: "Create Client", breadcrumb: "New Client" };
  if (pathname.startsWith("/clients/")) return { title: "Client Details", breadcrumb: "Client Info" };
  if (pathname.startsWith("/clients")) return { title: "Client Management", breadcrumb: "Clients" };
  if (pathname.startsWith("/payments")) return { title: "Payment Requests", breadcrumb: "Payments" };
  if (pathname.startsWith("/plans")) return { title: "Subscription Plans", breadcrumb: "Plans" };
  if (pathname.startsWith("/settings")) return { title: "Master Settings", breadcrumb: "Settings" };
  return { title: "Dashboard Overview", breadcrumb: "Dashboard" };
};

const AdminLayout = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

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
        {/* Brand Header */}
        <Box
          sx={{
            p: 2.5,
            display: "flex",
            alignItems: "center",
            gap: 1.8,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            minHeight: NAVBAR_HEIGHT,
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="Digiink"
            sx={{
              height: 44,
              width: 44,
              objectFit: "contain",
              borderRadius: "8px",
              flexShrink: 0,
            }}
          />
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, lineHeight: 1.1, color: "#FFFFFF", fontSize: "1.05rem" }}
            >
              Digiink Console
            </Typography>
            <Typography variant="caption" sx={{ color: "#93C5FD", fontSize: "0.7rem", fontWeight: 500 }}>
              SaaS Master Admin
            </Typography>
          </Box>
        </Box>

        {/* Master Badge */}
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
          <Chip
            label="Super Admin Panel"
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

        {/* Nav Items List */}
        <Box
          sx={{
            py: 1.5,
            px: 1.8,
            overflowY: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            "&::-webkit-scrollbar": { display: "none", width: 0 },
          }}
        >
          <List disablePadding>
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);

              return (
                <ListItem disablePadding key={item.label} sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => {
                      navigate(item.path);
                      if (mobileOpen) setMobileOpen(false);
                    }}
                    sx={{
                      minHeight: 48,
                      borderRadius: "8px",
                      px: 2,
                      backgroundColor: isActive ? "#005BAC" : "transparent",
                      color: isActive ? "#FFFFFF" : "#CBD5E1",
                      borderLeft: isActive ? "4px solid #38BDF8" : "4px solid transparent",
                      "&:hover": {
                        backgroundColor: isActive ? "#0A6FD8" : "rgba(255,255,255,0.06)",
                        color: "#FFFFFF",
                      },
                      transition: "all 0.2s ease-in-out",
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 38,
                        color: isActive ? "#FFFFFF" : "#94A3B8",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: "0.88rem",
                        fontWeight: isActive ? 600 : 500,
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

      {/* Bottom — User Card + Logout */}
      <Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <Box
          sx={{
            p: 1.2,
            mb: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            borderRadius: "10px",
            backgroundColor: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.05)",
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
                boxShadow: "0 0 0 2px #0B3A63",
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
                backgroundColor: "#005BAC",
                fontSize: "0.875rem",
                fontWeight: 700,
                color: "#FFFFFF",
              }}
            >
              {avatarInitials}
            </Avatar>
          </Badge>
          <Box sx={{ overflow: "hidden" }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, fontSize: "0.85rem", color: "#FFFFFF" }}>
              {adminName}
            </Typography>
            <Typography variant="caption" sx={{ color: "#38BDF8", fontSize: "0.72rem", display: "block", fontWeight: 500 }}>
              Super Admin
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 1.5, borderColor: "rgba(255,255,255,0.08)" }} />

        <ListItemButton
          onClick={() => setLogoutDialogOpen(true)}
          sx={{
            minHeight: 44,
            borderRadius: "8px",
            color: "#F87171",
            "&:hover": { backgroundColor: "rgba(239,68,68,0.12)" },
            px: 2,
          }}
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
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#F5F7FA" }}>
      {/* Sidebar Navigation */}
      <Box component="nav" sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}>
        {/* Mobile Drawer */}
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
              overflow: "hidden",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              "&::-webkit-scrollbar": { display: "none", width: 0 },
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: SIDEBAR_WIDTH,
              borderRight: "none",
              overflow: "hidden",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              "&::-webkit-scrollbar": { display: "none", width: 0 },
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
          backgroundColor: "#F5F7FA",
        }}
      >
        {/* Top Navbar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid #E2E8F0",
            color: "#0F172A",
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
            }}
          >
            {/* Left: Mobile Toggle & Breadcrumbs */}
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <IconButton
                sx={{ display: { md: "none" }, color: "#0F172A" }}
                onClick={() => setMobileOpen(true)}
              >
                <MenuIcon />
              </IconButton>
              <Box>
                <Breadcrumbs
                  separator={<KeyboardArrowRightIcon sx={{ fontSize: 14, color: "#94A3B8" }} />}
                  aria-label="breadcrumb"
                  sx={{ mb: 0.2 }}
                >
                  <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 500, fontSize: "0.75rem" }}>
                    Digiink
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#0B3A63", fontWeight: 700, fontSize: "0.75rem" }}>
                    {pageMeta.breadcrumb}
                  </Typography>
                </Breadcrumbs>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: "#0B3A63",
                    fontSize: "1.05rem",
                    lineHeight: 1.2,
                  }}
                >
                  {pageMeta.title}
                </Typography>
              </Box>
            </Stack>

            {/* Right: Clock & Access Badge */}
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 1 }}>
                <AccessTimeOutlinedIcon sx={{ fontSize: 16, color: "#64748B" }} />
                <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 500, fontSize: "0.78rem" }}>
                  {formattedDate} • {formattedTime}
                </Typography>
              </Box>

              <Chip
                icon={<ShieldOutlinedIcon sx={{ fontSize: "14px !important", color: "#005BAC" }} />}
                label="Master Access"
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  bgcolor: "rgba(0,91,172,0.08)",
                  color: "#005BAC",
                  border: "1px solid rgba(0,91,172,0.2)",
                  height: 26,
                }}
              />

              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: "#005BAC",
                  color: "#FFFFFF",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                }}
              >
                {avatarInitials}
              </Avatar>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Scrollable Page Content Container */}
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
        PaperProps={{ sx: { borderRadius: "14px", p: 1, minWidth: 330 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#0B3A63", pb: 1 }}>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.9rem", color: "#64748B" }}>
            Are you sure you want to end your Super Admin session?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLogoutDialogOpen(false)} sx={{ color: "#64748B", fontWeight: 600, textTransform: "none" }}>
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
              textTransform: "none",
              borderRadius: "8px",
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminLayout;