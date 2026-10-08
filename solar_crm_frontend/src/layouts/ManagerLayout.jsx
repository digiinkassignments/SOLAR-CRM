import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box, Toolbar } from "@mui/material";
import ManagerSidebar from "./ManagerSidebar";
import ManagerNavbar from "./ManagerNavbar";
import SubscriptionBanner from "../components/SubscriptionBanner";

const EXPANDED_SIDEBAR_WIDTH = 260;
const COLLAPSED_SIDEBAR_WIDTH = 76;
const NAVBAR_HEIGHT = 64;

export default function ManagerLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleToggleCollapse = () => {
    setCollapsed((prev) => !prev);
  };

  const currentSidebarWidth = collapsed ? COLLAPSED_SIDEBAR_WIDTH : EXPANDED_SIDEBAR_WIDTH;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#F8FAFC" }}>
      <ManagerNavbar
        handleDrawerToggle={handleDrawerToggle}
        handleToggleCollapse={handleToggleCollapse}
        collapsed={collapsed}
        sidebarWidth={currentSidebarWidth}
        navbarHeight={NAVBAR_HEIGHT}
      />
      <ManagerSidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        handleToggleCollapse={handleToggleCollapse}
        collapsed={collapsed}
        sidebarWidth={currentSidebarWidth}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${currentSidebarWidth}px)` },
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#F8FAFC",
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <Toolbar sx={{ minHeight: `${NAVBAR_HEIGHT}px !important` }} />
        <SubscriptionBanner />
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            overflowY: "auto",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}