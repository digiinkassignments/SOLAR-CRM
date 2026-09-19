import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Snackbar,
  Stack,
} from "@mui/material";

// Icons
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import QrCodeRoundedIcon from "@mui/icons-material/QrCodeRounded";

import api from "../api/axios";

const GOOGLE_COLORS = {
  blue: "#1A73E8",
  blueDark: "#0B57D0",
  blueSoft: "#E8F0FE",
  green: "#1E8E3E",
  greenSoft: "#E6F4EA",
  red: "#D93025",
  redSoft: "#FCE8E6",
  yellow: "#F9AB00",
  yellowSoft: "#FEF7E0",
  orange: "#E37400",
  orangeSoft: "#FEF3D6",
  bg: "#F8F9FA",
  card: "#FFFFFF",
  border: "#E0E3E7",
  textPrimary: "#202124",
  textSecondary: "#5F6368",
  textMuted: "#70757A",
};

const Settings = () => {
  const [form, setForm] = useState({
    company_name: "",
    company_website: "",
    bank_account_name: "",
    bank_account_number: "",
    bank_ifsc: "",
    bank_name: "",
    bank_branch: "",
    upi_id: "",
    support_phone: "",
    support_email: "",
    support_whatsapp: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    api.get("/settings")
      .then((res) => {
        const d = res.data?.data || {};
        setForm((prev) => ({ ...prev, ...d }));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/settings", form);
      setSnack({ open: true, msg: "Master payment & support settings saved successfully!", severity: "success" });
    } catch (err) {
      setSnack({ open: true, msg: err.response?.data?.message || "Failed to save settings.", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={36} sx={{ color: GOOGLE_COLORS.blue }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: GOOGLE_COLORS.textPrimary,
              fontSize: "1.35rem",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            System Console Configuration
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: GOOGLE_COLORS.textSecondary,
              mt: 0.4,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Configure master organization metadata, bank wire parameters, and tenant support channels
          </Typography>
        </Box>

        <Button
          variant="contained"
          disableElevation
          startIcon={<SaveRoundedIcon sx={{ fontSize: 18 }} />}
          onClick={handleSave}
          disabled={saving}
          sx={{
            borderRadius: "100px",
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            py: 1,
            backgroundColor: GOOGLE_COLORS.blue,
            color: "#FFFFFF",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            "&:hover": { backgroundColor: GOOGLE_COLORS.blueDark },
          }}
        >
          {saving ? <CircularProgress size={20} color="inherit" /> : "Save Configuration"}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Company Information */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "20px",
              border: `1px solid ${GOOGLE_COLORS.border}`,
              p: 3,
              backgroundColor: GOOGLE_COLORS.card,
              height: "100%",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.2} mb={2}>
              <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: GOOGLE_COLORS.blue }} />
              <BusinessRoundedIcon sx={{ color: GOOGLE_COLORS.blue, fontSize: 22 }} />
              <Typography sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, fontSize: "0.98rem" }}>
                Master Organization Profile
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2.5, borderColor: GOOGLE_COLORS.border }} />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Organization / Business Name"
                  name="company_name"
                  value={form.company_name || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                      backgroundColor: GOOGLE_COLORS.bg,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Official Website URL"
                  name="company_website"
                  placeholder="https://digiink.com"
                  value={form.company_website || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                      backgroundColor: GOOGLE_COLORS.bg,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Customer Support Channels */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "20px",
              border: `1px solid ${GOOGLE_COLORS.border}`,
              p: 3,
              backgroundColor: GOOGLE_COLORS.card,
              height: "100%",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.2} mb={2}>
              <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: GOOGLE_COLORS.green }} />
              <SupportAgentRoundedIcon sx={{ color: GOOGLE_COLORS.green, fontSize: 22 }} />
              <Typography sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, fontSize: "0.98rem" }}>
                Tenant Support Channels
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2.5, borderColor: GOOGLE_COLORS.border }} />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Support Phone Helpline"
                  name="support_phone"
                  placeholder="+91 9876543210"
                  value={form.support_phone || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                      backgroundColor: GOOGLE_COLORS.bg,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Support Email Address"
                  name="support_email"
                  placeholder="support@digiink.com"
                  value={form.support_email || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                      backgroundColor: GOOGLE_COLORS.bg,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="WhatsApp Support Number"
                  name="support_whatsapp"
                  placeholder="+91 9876543210"
                  value={form.support_whatsapp || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                      backgroundColor: GOOGLE_COLORS.bg,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Bank & UPI Information */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "20px",
              border: `1px solid ${GOOGLE_COLORS.border}`,
              p: 3,
              backgroundColor: GOOGLE_COLORS.card,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.2} mb={2}>
              <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: GOOGLE_COLORS.blueDark }} />
              <AccountBalanceRoundedIcon sx={{ color: GOOGLE_COLORS.blueDark, fontSize: 22 }} />
              <Box>
                <Typography sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, fontSize: "0.98rem" }}>
                  Bank Wire & NEFT / RTGS Billing Info
                </Typography>
                <Typography variant="caption" sx={{ color: GOOGLE_COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Displayed to tenant administrators when settling invoice payments & renewals
                </Typography>
              </Box>
            </Stack>
            <Divider sx={{ mb: 2.5, borderColor: GOOGLE_COLORS.border }} />

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Account Holder Name"
                  name="bank_account_name"
                  value={form.bank_account_name || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                      backgroundColor: GOOGLE_COLORS.bg,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Bank Account Number"
                  name="bank_account_number"
                  value={form.bank_account_number || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                      backgroundColor: GOOGLE_COLORS.bg,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="IFSC Code"
                  name="bank_ifsc"
                  value={form.bank_ifsc || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                      backgroundColor: GOOGLE_COLORS.bg,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={6}>
                <TextField
                  label="Bank Name"
                  name="bank_name"
                  value={form.bank_name || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                      backgroundColor: GOOGLE_COLORS.bg,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={6}>
                <TextField
                  label="Bank Branch"
                  name="bank_branch"
                  value={form.bank_branch || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                      backgroundColor: GOOGLE_COLORS.bg,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1.5, borderColor: GOOGLE_COLORS.border }} />
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <QrCodeRoundedIcon sx={{ color: GOOGLE_COLORS.blue, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={700} color={GOOGLE_COLORS.textPrimary}>
                    UPI VPA Identifier
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="UPI ID / VPA"
                  name="upi_id"
                  placeholder="digiink@okhdfcbank"
                  value={form.upi_id || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                      backgroundColor: GOOGLE_COLORS.bg,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} sx={{ borderRadius: "12px" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;