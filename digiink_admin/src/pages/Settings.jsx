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

const COLORS = {
  primary: "#005BAC",
  primaryDark: "#0B3A63",
  primarySoft: "#E0F2FE",
  bg: "#F5F7FA",
  card: "#FFFFFF",
  border: "#E2E8F0",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
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
        <CircularProgress size={36} sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Top Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} color={COLORS.primaryDark}>
            Master SaaS Settings
          </Typography>
          <Typography variant="body2" color={COLORS.textSecondary} sx={{ mt: 0.3 }}>
            Configure bank transfer details, UPI QR information, and tenant customer support channels
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<SaveRoundedIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 700,
            px: 3,
            py: 1,
            backgroundColor: COLORS.primary,
            "&:hover": { backgroundColor: "#0A6FD8" },
            boxShadow: "0 4px 12px rgba(0,91,172,0.25)",
          }}
        >
          {saving ? <CircularProgress size={20} color="inherit" /> : "Save Settings"}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Company Information */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "14px",
              border: `1px solid ${COLORS.border}`,
              p: 3,
              backgroundColor: COLORS.card,
              height: "100%",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.2} mb={2}>
              <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: COLORS.primary }} />
              <BusinessRoundedIcon sx={{ color: COLORS.primary, fontSize: 20 }} />
              <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.95rem" }}>
                Company Information
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2.5, borderColor: COLORS.border }} />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Organization / Business Name"
                  name="company_name"
                  value={form.company_name || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputProps={{ sx: { borderRadius: "8px" } }}
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
                  InputProps={{ sx: { borderRadius: "8px" } }}
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
              borderRadius: "14px",
              border: `1px solid ${COLORS.border}`,
              p: 3,
              backgroundColor: COLORS.card,
              height: "100%",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.2} mb={2}>
              <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: COLORS.success }} />
              <SupportAgentRoundedIcon sx={{ color: COLORS.success, fontSize: 20 }} />
              <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.95rem" }}>
                Tenant Support Channels
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2.5, borderColor: COLORS.border }} />

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
                  InputProps={{ sx: { borderRadius: "8px" } }}
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
                  InputProps={{ sx: { borderRadius: "8px" } }}
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
                  InputProps={{ sx: { borderRadius: "8px" } }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Bank & UPI Information (Shown on Locked Payment Screen) */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "14px",
              border: `1px solid ${COLORS.border}`,
              p: 3,
              backgroundColor: COLORS.card,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.2} mb={2}>
              <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: COLORS.primaryDark }} />
              <AccountBalanceRoundedIcon sx={{ color: COLORS.primaryDark, fontSize: 20 }} />
              <Box>
                <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.95rem" }}>
                  Bank Transfer & NEFT / RTGS Details
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                  These details will be displayed to tenant admins on their locked payment & renewal screen
                </Typography>
              </Box>
            </Stack>
            <Divider sx={{ mb: 2.5, borderColor: COLORS.border }} />

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Account Holder Name"
                  name="bank_account_name"
                  value={form.bank_account_name || ""}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputProps={{ sx: { borderRadius: "8px" } }}
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
                  InputProps={{ sx: { borderRadius: "8px" } }}
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
                  InputProps={{ sx: { borderRadius: "8px" } }}
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
                  InputProps={{ sx: { borderRadius: "8px" } }}
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
                  InputProps={{ sx: { borderRadius: "8px" } }}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1.5, borderColor: COLORS.border }} />
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <QrCodeRoundedIcon sx={{ color: COLORS.primary, fontSize: 18 }} />
                  <Typography variant="subtitle2" fontWeight={700} color={COLORS.primaryDark}>
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
                  InputProps={{ sx: { borderRadius: "8px" } }}
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
        <Alert severity={snack.severity} sx={{ borderRadius: "10px" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;