import {portalRole, homePath} from "../../utils/portalRoles";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, getTenantInfo } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

import {
  Box,
  Typography,
  OutlinedInput,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
  Divider,
  Checkbox,
  FormControlLabel,
  Link,
  Alert,
  Fade,
  Paper,
} from "@mui/material";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import GetAppRoundedIcon from "@mui/icons-material/GetAppRounded";

// Image Imports
import logo from "../../assets/images/logo.png";
import loginBanner from "../../assets/images/login-banner.jpg";

const Login = () => {
  const navigate = useNavigate();
  const { login, user, token } = useAuth();

  useEffect(() => {
    if (token && user) {
      if(Number(user.is_password_changed)===0){navigate("/change-password",{replace:true});return;}
      const userRole = (user?.role_name || user?.role || "").toLowerCase();

      if (portalRole(user)) {
        navigate(homePath(user), {replace:true});
      } else if (userRole.includes("manager")) {
        navigate("/manager/dashboard", { replace: true });
      } else if (userRole.includes("sales")) {
        navigate("/sales/dashboard", { replace: true });
      } else if (userRole.includes("engineer")) {
        navigate("/engineer/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [token, user, navigate]);

  const [tenantStatus, setTenantStatus] = useState({ checking: true, exists: true, data: null });

  useEffect(() => {
    const host = window.location.hostname;
    const parts = host.split(".");
    const subdomain = parts[0];
    const isSubdomain = parts.length > 2 && !["www", "admin", "localhost"].includes(subdomain);

    if (isSubdomain) {
      getTenantInfo()
        .then((res) => {
          setTenantStatus({ checking: false, exists: true, data: res.data?.data });
        })
        .catch((err) => {
          if (err.response?.status === 404 || err.response?.data?.message?.includes("not found")) {
            setTenantStatus({ checking: false, exists: false, data: null });
          } else {
            setTenantStatus({ checking: false, exists: true, data: null });
          }
        });
    } else {
      setTenantStatus({ checking: false, exists: true, data: null });
    }
  }, []);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    navigate("/forgot-password");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      const response = await loginUser({
        login: identifier,
        password,
      });

const userData = response.data.user;
const authToken = response.data.token;
const subscription = response.data.subscription; // NEW

login(userData, authToken, subscription);

    // Password change check
    if (userData.is_password_changed === 0) {
      navigate("/change-password", { replace: true });
    }
    } catch (error) {
      if (error.response) {
        setError(error.response.data.message || "Invalid credentials.");
      } else {
        setError("Server not responding. Please check backend network.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!tenantStatus.checking && !tenantStatus.exists) {
    const host = window.location.hostname;
    return (
      <Box
        sx={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%), url(${loginBanner})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          p: 2,
        }}
      >
        <Paper
          elevation={12}
          sx={{
            maxWidth: 480,
            width: "100%",
            p: { xs: 3, sm: 4.5 },
            borderRadius: "20px",
            textAlign: "center",
            boxShadow: "0 24px 48px -12px rgba(0,0,0,0.5)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "#FFFFFF",
          }}
        >
          <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
            <img src={logo} alt="Solops" style={{ height: 48, objectFit: "contain" }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#101828", mb: 1, fontFamily: "'Manrope', sans-serif" }}>
            Workspace Not Found
          </Typography>
          <Typography variant="body2" sx={{ color: "#667085", mb: 3.5, lineHeight: 1.6 }}>
            No active solar company workspace was found at <strong>{host}</strong>.<br />
            This workspace does not exist or may have been removed.
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Button
              variant="contained"
              fullWidth
              href="https://solops.cloud/"
              sx={{
                background: "#F36B16",
                "&:hover": { background: "#D95609" },
                py: 1.3,
                fontWeight: 700,
                borderRadius: "10px",
                textTransform: "none",
                fontSize: "15px",
              }}
            >
              Return to Solops.cloud
            </Button>
            <Button
              variant="outlined"
              fullWidth
              href="https://admin.solops.cloud/"
              sx={{
                borderColor: "#D0D5DD",
                color: "#344054",
                "&:hover": { borderColor: "#98A2B3", background: "#F9FAFB" },
                py: 1.2,
                fontWeight: 600,
                borderRadius: "10px",
                textTransform: "none",
                fontSize: "14px",
              }}
            >
              Super Admin Console
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

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
            {tenantStatus.data?.business_name ? tenantStatus.data.business_name : "Sign in to platform"}
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.82rem", mt: 0.4 }}>
            {tenantStatus.data?.business_name ? "Enter credentials to access company workspace" : "Enter your credentials to access workspace."}
          </Typography>
        </Box>

        {error && (
          <Fade in={Boolean(error)}>
            <Alert severity="error" sx={{ mb: 1.8, py: 0.3, px: 1.2, borderRadius: 1.5, fontSize: "0.8rem" }}>
              {error}
            </Alert>
          </Fade>
        )}

        {/* LOGIN FORM */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* USERNAME / EMAIL / PHONE */}
          <Box sx={{ mb: 1.5 }}>
            <Typography
              component="label"
              htmlFor="identifier-input"
              sx={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#334155",
                mb: 0.4,
              }}
            >
              Username, Email, or Mobile
            </Typography>
            <OutlinedInput
              id="identifier-input"
              fullWidth
              placeholder="name@company.com or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading}
              startAdornment={
                <InputAdornment position="start">
                  <PersonOutlineOutlinedIcon sx={{ color: "#94A3B8", fontSize: 20 }} />
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
                  "& fieldset": { borderColor: "#F59E0B" },
                },
              }}
            />
          </Box>

          {/* PASSWORD FIELD WITH GUARANTEED EYE ICON */}
          <Box sx={{ mb: 1.2 }}>
            <Typography
              component="label"
              htmlFor="password-input"
              sx={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#334155",
                mb: 0.4,
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
                  <LockOutlinedIcon sx={{ color: "#94A3B8", fontSize: 20 }} />
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
                      <VisibilityOff sx={{ fontSize: 20, color: "#D97706" }} />
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
                  "& fieldset": { borderColor: "#F59E0B" },
                },
              }}
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
              <Link
                component="button"
                type="button"
                onClick={handleForgotPasswordClick}
                underline="hover"
                sx={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "#D97706",
                  cursor: "pointer",
                }}
              >
                Forgot password?
              </Link>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", mb: 1.8 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  size="small"
                  sx={{
                    p: 0.5,
                    color: "#CBD5E1",
                    "&.Mui-checked": { color: "#F59E0B" },
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: "0.8rem", color: "#475569", fontWeight: 500 }}>
                  Keep me signed in
                </Typography>
              }
            />
          </Box>

          <Button
            type="submit"
            fullWidth
            disabled={loading}
            variant="contained"
            disableElevation
            sx={{
              py: 1.1,
              background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
              color: "#FFFFFF",
              fontSize: "0.88rem",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "7px",
              "&:hover": {
                background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
              },
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: "#FFFFFF" }} /> : "Authenticate Account"}
          </Button>
        </Box>

        {/* ANDROID APP DOWNLOAD CARD */}
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

export default Login;