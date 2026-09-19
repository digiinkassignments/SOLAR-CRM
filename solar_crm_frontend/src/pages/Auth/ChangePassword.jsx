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
  Fade,
  Stack,
  LinearProgress,
  Divider,
} from "@mui/material";

// Icons
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";

import { useAuth } from "../../context/AuthContext";
import axios from "axios";

// Image Imports
import logo from "../../assets/images/logo.png";
import loginBanner from "../../assets/images/login-banner.jpg";

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user, token, login } = useAuth();
  const [form, setForm] = useState({ password: "", confirm_password: "" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculateStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 40;
    if (/[A-Z]/.test(pass)) score += 20;
    if (/[0-9]/.test(pass)) score += 20;
    if (/[^A-Za-z0-9]/.test(pass)) score += 20;
    return score;
  };

  const strength = calculateStrength(form.password);

  const getStrengthColor = (s) => {
    if (s < 40) return "#EF4444"; // Red
    if (s < 80) return "#F59E0B"; // Yellow/Amber
    return "#10B981"; // Green
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.password || !form.confirm_password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match. Please verify your entries.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        "/api/auth/change-password",
        { password: form.password, confirm_password: form.confirm_password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update user object
      const updatedUser = { ...user, is_password_changed: 1 };
      login(updatedUser, token);

      // Redirect based on role
      const role = (user?.role_name || user?.role || "").toLowerCase();
      if (role.includes("manager")) navigate("/manager/dashboard", { replace: true });
      else if (role.includes("sales")) navigate("/sales/dashboard", { replace: true });
      else navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        maxHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.75) 0%, rgba(15, 23, 42, 0.85) 100%), url(${loginBanner})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        p: 2,
        overflow: "hidden",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: "100%",
          maxWidth: "410px",
          backgroundColor: "#FFFFFF",
          borderRadius: "14px",
          p: { xs: 2.5, sm: 3 },
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* LOGO */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1.8 }}>
          <Box
            component="img"
            src={logo}
            alt="Enterprise Logo"
            sx={{
              height: 42,
              width: "auto",
              objectFit: "contain",
            }}
          />
        </Box>

        {/* HEADER */}
        <Box sx={{ mb: 2, textAlign: "center" }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#0F172A",
              letterSpacing: "-0.02em",
              fontSize: "1.25rem",
              lineHeight: 1.2,
            }}
          >
            Set New Password
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.82rem", mt: 0.4 }}>
            Please set a new password for <strong>{user?.full_name || user?.name || "your account"}</strong> before accessing workspace.
          </Typography>
        </Box>

        {error && (
          <Fade in={Boolean(error)}>
            <Alert severity="error" sx={{ mb: 1.8, py: 0.3, px: 1.2, borderRadius: 1.5, fontSize: "0.8rem" }}>
              {error}
            </Alert>
          </Fade>
        )}

        {/* FORM */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* NEW PASSWORD */}
          <Box sx={{ mb: 1.5 }}>
            <Typography
              component="label"
              htmlFor="new-password-input"
              sx={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#334155",
                mb: 0.4,
              }}
            >
              New Password *
            </Typography>
            <OutlinedInput
              id="new-password-input"
              fullWidth
              type={showPass ? "text" : "password"}
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              disabled={loading}
              startAdornment={
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: "#94A3B8", fontSize: 20 }} />
                </InputAdornment>
              }
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    aria-label="toggle password visibility"
                    onClick={() => setShowPass(!showPass)}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                    size="small"
                    sx={{ color: "#64748B", mr: 0.2 }}
                  >
                    {showPass ? (
                      <VisibilityOff sx={{ fontSize: 20, color: "#2563EB" }} />
                    ) : (
                      <Visibility sx={{ fontSize: 20, color: "#94A3B8" }} />
                    )}
                  </IconButton>
                </InputAdornment>
              }
              sx={{
                borderRadius: "7px",
                backgroundColor: "#F8FAFC",
                fontSize: "0.88rem",
                height: "42px",
                "& fieldset": { borderColor: "#E2E8F0" },
                "&:hover fieldset": { borderColor: "#CBD5E1" },
                "&.Mui-focused": {
                  backgroundColor: "#FFFFFF",
                  "& fieldset": { borderColor: "#2563EB" },
                },
              }}
            />

            {/* Password Strength Indicator Bar */}
            {form.password.length > 0 && (
              <Box sx={{ mt: 0.8 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.3 }}>
                  <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.72rem", fontWeight: 600 }}>
                    Password Strength
                  </Typography>
                  <Typography variant="caption" sx={{ color: getStrengthColor(strength), fontSize: "0.72rem", fontWeight: 700 }}>
                    {strength < 40 ? "Weak" : strength < 80 ? "Medium" : "Strong"}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={strength}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: "#E2E8F0",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: getStrengthColor(strength),
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
            )}
          </Box>

          {/* CONFIRM PASSWORD */}
          <Box sx={{ mb: 1.8 }}>
            <Typography
              component="label"
              htmlFor="confirm-password-input"
              sx={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#334155",
                mb: 0.4,
              }}
            >
              Confirm Password *
            </Typography>
            <OutlinedInput
              id="confirm-password-input"
              fullWidth
              type={showConfirmPass ? "text" : "password"}
              placeholder="Re-enter new password"
              value={form.confirm_password}
              onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
              disabled={loading}
              startAdornment={
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: "#94A3B8", fontSize: 20 }} />
                </InputAdornment>
              }
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    aria-label="toggle confirm password visibility"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                    size="small"
                    sx={{ color: "#64748B", mr: 0.2 }}
                  >
                    {showConfirmPass ? (
                      <VisibilityOff sx={{ fontSize: 20, color: "#2563EB" }} />
                    ) : (
                      <Visibility sx={{ fontSize: 20, color: "#94A3B8" }} />
                    )}
                  </IconButton>
                </InputAdornment>
              }
              sx={{
                borderRadius: "7px",
                backgroundColor: "#F8FAFC",
                fontSize: "0.88rem",
                height: "42px",
                "& fieldset": { borderColor: "#E2E8F0" },
                "&:hover fieldset": { borderColor: "#CBD5E1" },
                "&.Mui-focused": {
                  backgroundColor: "#FFFFFF",
                  "& fieldset": { borderColor: "#2563EB" },
                },
              }}
            />

            {/* Validation Match Indicator */}
            {form.confirm_password.length > 0 && (
              <Stack direction="row" alignItems="center" spacing={0.6} sx={{ mt: 0.6 }}>
                {form.password === form.confirm_password ? (
                  <>
                    <CheckCircleOutlineRoundedIcon sx={{ fontSize: 14, color: "#10B981" }} />
                    <Typography variant="caption" sx={{ color: "#10B981", fontWeight: 600, fontSize: "0.72rem" }}>
                      Passwords match
                    </Typography>
                  </>
                ) : (
                  <>
                    <ErrorOutlineRoundedIcon sx={{ fontSize: 14, color: "#EF4444" }} />
                    <Typography variant="caption" sx={{ color: "#EF4444", fontWeight: 600, fontSize: "0.72rem" }}>
                      Passwords do not match
                    </Typography>
                  </>
                )}
              </Stack>
            )}
          </Box>

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            fullWidth
            disabled={loading}
            variant="contained"
            disableElevation
            sx={{
              py: 1.1,
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              fontSize: "0.88rem",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "7px",
              "&:hover": {
                backgroundColor: "#1D4ED8",
              },
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: "#FFFFFF" }} /> : "Set Password & Continue"}
          </Button>
        </Box>

        <Divider sx={{ my: 1.8, borderColor: "#F1F5F9" }} />

        {/* SECURITY SSO FOOTER */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.8, color: "#64748B" }}>
          <ShieldOutlinedIcon sx={{ fontSize: 14, flexShrink: 0 }} />
          <Typography variant="caption" sx={{ fontSize: "0.725rem", fontWeight: 500 }}>
            Protected by Enterprise SSO Policy
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChangePassword;

