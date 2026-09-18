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
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";

import loginBanner from "../assets/login-banner.jpg";

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
        backgroundImage: `linear-gradient(135deg, rgba(11, 58, 99, 0.84) 0%, rgba(15, 23, 42, 0.92) 100%), url(${loginBanner})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        p: 2,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <Paper
        elevation={8}
        sx={{
          width: "100%",
          maxWidth: "385px",
          backgroundColor: "#FFFFFF",
          borderRadius: "14px",
          p: { xs: 2.5, sm: 3 },
          boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.45)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
        }}
      >
        {/* LOGO */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="Digiink"
            sx={{
              height: 52,
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
              letterSpacing: "-0.01em",
              fontSize: "1.15rem",
              lineHeight: 1.2,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Super Admin Console
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#64748B",
              fontSize: "0.78rem",
              mt: 0.4,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Enter your credentials to access management console.
          </Typography>

          <Box sx={{ mt: 1.2, display: "flex", justifyContent: "center" }}>
            <Chip
              icon={<ShieldOutlinedIcon sx={{ fontSize: "13px !important", color: "#005BAC" }} />}
              label="Master System Access"
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: "0.68rem",
                bgcolor: "rgba(0, 91, 172, 0.08)",
                color: "#005BAC",
                border: "1px solid rgba(0, 91, 172, 0.2)",
                height: "22px",
                fontFamily: "'Inter', sans-serif",
              }}
            />
          </Box>
        </Box>

        {error && (
          <Fade in={Boolean(error)}>
            <Alert
              severity="error"
              sx={{
                mb: 1.8,
                py: 0.2,
                px: 1.2,
                borderRadius: "8px",
                fontSize: "0.78rem",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* LOGIN FORM */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* EMAIL */}
          <Box sx={{ mb: 1.5 }}>
            <Typography
              component="label"
              htmlFor="email-input"
              sx={{
                display: "block",
                fontSize: "0.74rem",
                fontWeight: 600,
                color: "#334155",
                mb: 0.4,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Super Admin Email
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
                  <EmailOutlinedIcon sx={{ color: "#94A3B8", fontSize: 18 }} />
                </InputAdornment>
              }
              sx={{
                borderRadius: "8px",
                backgroundColor: "#F8FAFC",
                fontSize: "0.82rem",
                height: "40px",
                fontFamily: "'Inter', sans-serif",
                "& fieldset": { borderColor: "#E2E8F0" },
                "&:hover fieldset": { borderColor: "#CBD5E1" },
                "&.Mui-focused": {
                  backgroundColor: "#FFFFFF",
                  "& fieldset": { borderColor: "#005BAC", borderWidth: "1.5px" },
                },
              }}
            />
          </Box>

          {/* PASSWORD */}
          <Box sx={{ mb: 2.2 }}>
            <Typography
              component="label"
              htmlFor="password-input"
              sx={{
                display: "block",
                fontSize: "0.74rem",
                fontWeight: 600,
                color: "#334155",
                mb: 0.4,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Password
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
                  <LockOutlinedIcon sx={{ color: "#94A3B8", fontSize: 18 }} />
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
                    sx={{ color: "#64748B", mr: 0.2 }}
                  >
                    {showPassword ? (
                      <VisibilityOff sx={{ fontSize: 18, color: "#005BAC" }} />
                    ) : (
                      <Visibility sx={{ fontSize: 18, color: "#94A3B8" }} />
                    )}
                  </IconButton>
                </InputAdornment>
              }
              sx={{
                borderRadius: "8px",
                backgroundColor: "#F8FAFC",
                fontSize: "0.82rem",
                height: "40px",
                fontFamily: "'Inter', sans-serif",
                "& fieldset": { borderColor: "#E2E8F0" },
                "&:hover fieldset": { borderColor: "#CBD5E1" },
                "&.Mui-focused": {
                  backgroundColor: "#FFFFFF",
                  "& fieldset": { borderColor: "#005BAC", borderWidth: "1.5px" },
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
              height: "42px",
              borderRadius: "10px",
              fontWeight: 700,
              textTransform: "none",
              fontSize: "0.85rem",
              backgroundColor: "#005BAC",
              color: "#FFFFFF",
              boxShadow: "0 4px 10px rgba(0, 91, 172, 0.2)",
              fontFamily: "'Inter', sans-serif",
              transition: "all 0.15s ease-in-out",
              "&:hover": {
                backgroundColor: "#0B3A63",
                boxShadow: "0 6px 14px rgba(0, 91, 172, 0.3)",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Sign In to Console"
            )}
          </Button>
        </Box>

        {/* SECURITY FOOTER */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={0.6}
          sx={{ mt: 2.5, pt: 1.5, borderTop: "1px solid #F1F5F9" }}
        >
          <ShieldOutlinedIcon sx={{ fontSize: 13, color: "#94A3B8" }} />
          <Typography
            variant="caption"
            sx={{
              color: "#94A3B8",
              fontWeight: 500,
              fontSize: "0.7rem",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Secured by Digiink Solutions • 256-Bit SSL Encrypted
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Login;