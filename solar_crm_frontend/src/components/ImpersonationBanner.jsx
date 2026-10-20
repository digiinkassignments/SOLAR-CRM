import React from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import ExitToAppRoundedIcon from "@mui/icons-material/ExitToAppRounded";
import { useAuth } from "../context/AuthContext";

const ImpersonationBanner = () => {
  const { user, logout } = useAuth();

  if (!user?.is_impersonated) return null;

  const handleExitSession = () => {
    logout();
    window.location.href = "https://crm-admin.digiinksolutions.com/#/clients";
  };

  return (
    <Box
      sx={{
        backgroundColor: "#1E293B",
        color: "#FFFFFF",
        px: { xs: 2, sm: 3 },
        py: 0.9,
        borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1.5,
        zIndex: 1400,
        boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.2}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 26,
            height: 26,
            borderRadius: "100px",
            backgroundColor: "#F59E0B",
            color: "#000",
          }}
        >
          <VisibilityRoundedIcon sx={{ fontSize: 16 }} />
        </Box>
        <Typography
          sx={{
            fontSize: "0.84rem",
            fontWeight: 600,
            color: "#F8FAFC",
            letterSpacing: "-0.01em",
          }}
        >
          Super Admin Mode Active: Viewing tenant instance as{" "}
          <strong style={{ color: "#FBBF24" }}>{user?.full_name || user?.username || "Client Admin"}</strong>
        </Typography>
      </Stack>

      <Button
        size="small"
        variant="contained"
        disableElevation
        onClick={handleExitSession}
        startIcon={<ExitToAppRoundedIcon sx={{ fontSize: 15 }} />}
        sx={{
          borderRadius: "100px",
          textTransform: "none",
          fontWeight: 700,
          fontSize: "0.75rem",
          px: 2,
          py: 0.5,
          backgroundColor: "#EF4444",
          color: "#FFFFFF",
          "&:hover": { backgroundColor: "#DC2626" },
        }}
      >
        Exit Impersonation
      </Button>
    </Box>
  );
};

export default ImpersonationBanner;
