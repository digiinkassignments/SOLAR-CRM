import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, TextField, Button,
  CircularProgress, Alert, InputAdornment, IconButton,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user, token, login } = useAuth();
  const [form, setForm] = useState({ password: "", confirm_password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.password || !form.confirm_password) {
      setError("Please fill all fields.");
      return;
    }
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    try {
      setLoading(true);
      await axios.post("/api/auth/change-password", 
        { password: form.password, confirm_password: form.confirm_password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update user object
      const updatedUser = { ...user, is_password_changed: 1 };
      login(updatedUser, token);
      // Redirect to dashboard
      const role = (user?.role_name || "").toLowerCase();
      if (role.includes("manager")) navigate("/manager/dashboard", { replace: true });
      else if (role.includes("sales")) navigate("/sales/dashboard", { replace: true });
      else navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#0f172a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper elevation={0} sx={{ width: "100%", maxWidth: 420, borderRadius: 3, p: 4 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: "14px",
            bgcolor: "#0B3A63", display: "flex",
            alignItems: "center", justifyContent: "center",
            mx: "auto", mb: 2
          }}>
            <LockIcon sx={{ fontSize: 28, color: "#fff" }} />
          </Box>
          <Typography variant="h6" fontWeight={700} color="#0f172a">
            Set New Password
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Please change your password before continuing
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="New Password"
            type={showPass ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            fullWidth size="small" sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" color="action" /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Confirm Password"
            type="password"
            value={form.confirm_password}
            onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
            fullWidth size="small" sx={{ mb: 3 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" color="action" /></InputAdornment>,
            }}
          />
          <Button
            type="submit" fullWidth variant="contained"
            size="large" disabled={loading}
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : "Set Password & Continue"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChangePassword;
