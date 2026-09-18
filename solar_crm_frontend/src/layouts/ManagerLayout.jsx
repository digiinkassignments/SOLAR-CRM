import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import ManagerSidebar from "./ManagerSidebar";
import ManagerNavbar from "./ManagerNavbar";
import SubscriptionBanner from "../components/SubscriptionBanner"; // NEW

export default function ManagerLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarWidth = 240;
  const navbarHeight = 64;

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F8FAFC" }}>
      {/* Top Navbar */}
      <ManagerNavbar
        handleDrawerToggle={handleDrawerToggle}
        sidebarWidth={sidebarWidth}
        navbarHeight={navbarHeight}
      />

      {/* Left Sidebar */}
      <ManagerSidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        sidebarWidth={sidebarWidth}
      />

      {/* Main Page Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          pt: `${navbarHeight + 24}px`,
          width: { md: `calc(100% - ${sidebarWidth}px)` },
        }}
      >
        {/* NEW — Subscription warning banner */}
        <SubscriptionBanner />

        <Outlet />
      </Box>
    </Box>
  );
}