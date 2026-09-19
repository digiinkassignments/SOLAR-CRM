import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  OutlinedInput,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Chip,
  Fade,
  Stack,
} from "@mui/material";

// Icons
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";

import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/login", { email: email.trim(), password });
      login(res.data.admin, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid Super Admin credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8F9FA",
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        p: 2,
        overflow: "auto",
        boxSizing: "border-box",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#FFFFFF",
          borderRadius: "24px",
          p: { xs: 3.5, sm: 4.5 },
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04)",
          border: "1px solid #E0E3E7",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* GOOGLE ACCENT TOP BAR */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #1A73E8 0%, #34A853 33%, #FBBC05 66%, #EA4335 100%)",
          }}
        />

        {/* LOGO & BRANDING */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="Digiink"
            sx={{
              height: 48,
              width: "auto",
              objectFit: "contain",
              mb: 2,
            }}
          />
          <Chip
            icon={<AdminPanelSettingsOutlinedIcon sx={{ fontSize: "14px !important", color: "#1A73E8" }} />}
            label="Super Admin Portal"
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: "0.72rem",
              bgcolor: "#E8F0FE",
              color: "#1A73E8",
              border: "1px solid #D2E3FC",
              borderRadius: "100px",
              height: "26px",
              px: 0.5,
            }}
          />
        </Box>

        {/* HEADER */}
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "#202124",
              letterSpacing: "-0.02em",
              fontSize: "1.35rem",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Sign in to Console
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#5F6368",
              fontSize: "0.85rem",
              mt: 0.6,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Manage tenants, infrastructure, plans and system billing
          </Typography>
        </Box>

        {error && (
          <Fade in={Boolean(error)}>
            <Alert
              severity="error"
              sx={{
                mb: 2.5,
                py: 0.5,
                px: 1.5,
                borderRadius: "12px",
                fontSize: "0.82rem",
                bgcolor: "#FCE8E6",
                color: "#C5221F",
                border: "1px solid #FAD2CF",
                "& .MuiAlert-icon": { color: "#C5221F" },
              }}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* LOGIN FORM */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* EMAIL */}
          <Box sx={{ mb: 2 }}>
            <Typography
              component="label"
              htmlFor="email-input"
              sx={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#3C4043",
                mb: 0.6,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Admin Identity / Email
            </Typography>
            <OutlinedInput
              id="email-input"
              type="email"
              fullWidth
              placeholder="admin@digiink.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              startAdornment={
                <InputAdornment position="start">
                  <EmailOutlinedIcon sx={{ color: "#70757A", fontSize: 19 }} />
                </InputAdornment>
              }
              sx={{
                borderRadius: "12px",
                backgroundColor: "#F8F9FA",
                fontSize: "0.88rem",
                height: "44px",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                "& fieldset": { borderColor: "#DADCE0" },
                "&:hover fieldset": { borderColor: "#BDC1C6" },
                "&.Mui-focused": {
                  backgroundColor: "#FFFFFF",
                  "& fieldset": { borderColor: "#1A73E8", borderWidth: "2px" },
                },
              }}
            />
          </Box>

          {/* PASSWORD */}
          <Box sx={{ mb: 3 }}>
            <Typography
              component="label"
              htmlFor="password-input"
              sx={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#3C4043",
                mb: 0.6,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Master Key / Password
            </Typography>
            <OutlinedInput
              id="password-input"
              fullWidth
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              startAdornment={
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: "#70757A", fontSize: 19 }} />
                </InputAdornment>
              }
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    aria-label="toggle password visibility"
                    onClick={handleTogglePassword}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                    size="small"
                    sx={{ color: "#5F6368", mr: 0.2 }}
                  >
                    {showPassword ? (
                      <VisibilityOff sx={{ fontSize: 19, color: "#1A73E8" }} />
                    ) : (
                      <Visibility sx={{ fontSize: 19, color: "#70757A" }} />
                    )}
                  </IconButton>
                </InputAdornment>
              }
              sx={{
                borderRadius: "12px",
                backgroundColor: "#F8F9FA",
                fontSize: "0.88rem",
                height: "44px",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                "& fieldset": { borderColor: "#DADCE0" },
                "&:hover fieldset": { borderColor: "#BDC1C6" },
                "&.Mui-focused": {
                  backgroundColor: "#FFFFFF",
                  "& fieldset": { borderColor: "#1A73E8", borderWidth: "2px" },
                },
              }}
            />
          </Box>

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              height: "46px",
              borderRadius: "100px",
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.92rem",
              backgroundColor: "#1A73E8",
              color: "#FFFFFF",
              boxShadow: "none",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                backgroundColor: "#0B57D0",
                boxShadow: "0 2px 6px rgba(26, 115, 232, 0.3)",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Sign in to Admin Console"
            )}
          </Button>
        </Box>

        {/* SECURITY FOOTER */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={0.8}
          sx={{ mt: 3.5, pt: 2, borderTop: "1px solid #F1F3F4" }}
        >
          <SecurityOutlinedIcon sx={{ fontSize: 14, color: "#70757A" }} />
          <Typography
            variant="caption"
            sx={{
              color: "#70757A",
              fontWeight: 500,
              fontSize: "0.75rem",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Protected by Enterprise Auth & 256-bit TLS Encryption
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Login;