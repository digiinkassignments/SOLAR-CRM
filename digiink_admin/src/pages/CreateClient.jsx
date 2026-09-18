import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  IconButton,
  Chip,
} from "@mui/material";

// Icons
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import CardMembershipRoundedIcon from "@mui/icons-material/CardMembershipRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import AddBusinessRoundedIcon from "@mui/icons-material/AddBusinessRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";

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
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
};

const CreateClient = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    business_name: "",
    owner_name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    subdomain: "",
    plan_id: "",
    duration_months: 1,
  });

  useEffect(() => {
    api.get("/plans").then((r) => setPlans(r.data?.data || []));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Subdomain auto-generate from business name
    if (name === "business_name") {
      const auto = value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 20);
      setForm((prev) => ({ ...prev, business_name: value, subdomain: auto }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !form.business_name ||
      !form.owner_name ||
      !form.email ||
      !form.phone ||
      !form.subdomain ||
      !form.plan_id
    ) {
      setError("Please fill in all required fields marked with *.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/clients", form);
      const data = res.data?.data;
      setSuccess(
        `Client created successfully! Subdomain: ${data.subdomain}.solarcrm.com | Temp Password: ${data.tempPassword}`
      );
      setTimeout(() => navigate("/clients"), 3500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create client.");
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === Number(form.plan_id));
  const estimatedCost = selectedPlan ? Number(selectedPlan.price_monthly) * Number(form.duration_months) : 0;

  return (
    <Box>
      {/* Top Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <IconButton
          onClick={() => navigate("/clients")}
          sx={{
            bgcolor: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textPrimary,
            borderRadius: "10px",
            "&:hover": { bgcolor: "#F1F5F9" },
          }}
        >
          <ArrowBackRoundedIcon fontSize="small" />
        </IconButton>
        <Box>
          <Typography variant="h5" fontWeight={800} color={COLORS.primaryDark}>
            Provision New Client
          </Typography>
          <Typography variant="body2" color={COLORS.textSecondary}>
            Create an isolated MySQL database and setup custom subdomain credentials
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: "10px" }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2.5, borderRadius: "10px" }}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Provision Form */}
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "14px",
              border: `1px solid ${COLORS.border}`,
              p: 3.5,
              backgroundColor: COLORS.card,
            }}
            component="form"
            onSubmit={handleSubmit}
          >
            {/* Section 1: Business Info */}
            <Stack direction="row" alignItems="center" spacing={1.2} mb={2}>
              <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: COLORS.primary }} />
              <BusinessRoundedIcon sx={{ color: COLORS.primary, fontSize: 20 }} />
              <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.95rem" }}>
                Business Information
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2.5, borderColor: COLORS.border }} />

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Business Name *"
                  name="business_name"
                  placeholder="e.g. Smart Sun Power Ltd."
                  value={form.business_name}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputProps={{ sx: { borderRadius: "8px" } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Owner / Contact Person *"
                  name="owner_name"
                  placeholder="e.g. Rajesh Sharma"
                  value={form.owner_name}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputProps={{ sx: { borderRadius: "8px" } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email Address *"
                  name="email"
                  type="email"
                  placeholder="admin@business.com"
                  value={form.email}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputProps={{ sx: { borderRadius: "8px" } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number *"
                  name="phone"
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputProps={{ sx: { borderRadius: "8px" } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="City"
                  name="city"
                  placeholder="e.g. Jaipur"
                  value={form.city}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputProps={{ sx: { borderRadius: "8px" } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="State"
                  name="state"
                  placeholder="e.g. Rajasthan"
                  value={form.state}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  InputProps={{ sx: { borderRadius: "8px" } }}
                />
              </Grid>
            </Grid>

            {/* Section 2: Subscription & Subdomain */}
            <Stack direction="row" alignItems="center" spacing={1.2} mt={4} mb={2}>
              <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: COLORS.success }} />
              <CardMembershipRoundedIcon sx={{ color: COLORS.success, fontSize: 20 }} />
              <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.95rem" }}>
                Subscription & Domain Setup
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2.5, borderColor: COLORS.border }} />

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tenant Subdomain *"
                  name="subdomain"
                  value={form.subdomain}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  helperText={
                    form.subdomain
                      ? `Tenant URL: https://${form.subdomain}.solarcrm.com`
                      : "Auto-generated lowercase slug"
                  }
                  InputProps={{ sx: { borderRadius: "8px" } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Select Subscription Plan *</InputLabel>
                  <Select
                    name="plan_id"
                    value={form.plan_id}
                    label="Select Subscription Plan *"
                    onChange={handleChange}
                    sx={{ borderRadius: "8px" }}
                  >
                    {plans.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name} — ₹{Number(p.price_monthly).toLocaleString("en-IN")}/month
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Initial Duration</InputLabel>
                  <Select
                    name="duration_months"
                    value={form.duration_months}
                    label="Initial Duration"
                    onChange={handleChange}
                    sx={{ borderRadius: "8px" }}
                  >
                    <MenuItem value={0.25}>7 Days (Trial)</MenuItem>
                    <MenuItem value={1}>1 Month</MenuItem>
                    <MenuItem value={3}>3 Months</MenuItem>
                    <MenuItem value={6}>6 Months</MenuItem>
                    <MenuItem value={12}>12 Months (1 Year)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Actions */}
            <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={<AddBusinessRoundedIcon />}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 700,
                  px: 3.5,
                  py: 1.2,
                  backgroundColor: COLORS.primary,
                  "&:hover": { backgroundColor: "#0A6FD8" },
                  boxShadow: "0 4px 12px rgba(0,91,172,0.25)",
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : "Provision & Create Client"}
              </Button>

              <Button
                onClick={() => navigate("/clients")}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  color: COLORS.textSecondary,
                }}
              >
                Cancel
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Plan Summary Card */}
        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "14px",
              border: `1px solid ${COLORS.border}`,
              p: 3,
              backgroundColor: COLORS.card,
              position: "sticky",
              top: 90,
            }}
          >
            <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.95rem", mb: 2 }}>
              Plan Summary & Features
            </Typography>
            <Divider sx={{ mb: 2.5, borderColor: COLORS.border }} />

            {selectedPlan ? (
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={800} color={COLORS.primary}>
                      {selectedPlan.name} Plan
                    </Typography>
                    <Typography variant="caption" color={COLORS.textSecondary}>
                      ₹{Number(selectedPlan.price_monthly).toLocaleString("en-IN")}/month
                    </Typography>
                  </Box>
                  <Chip
                    label={`${form.duration_months} mo`}
                    size="small"
                    sx={{ fontWeight: 700, bgcolor: COLORS.primarySoft, color: COLORS.primary }}
                  />
                </Box>

                <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: "10px", bgcolor: "#F8FAFC", borderColor: COLORS.border }}>
                  <Typography variant="caption" color={COLORS.textSecondary} fontWeight={600}>Total Billing Estimate</Typography>
                  <Typography variant="h5" fontWeight={800} color={COLORS.textPrimary}>
                    ₹{estimatedCost.toLocaleString("en-IN")}
                  </Typography>
                </Paper>

                <Stack spacing={1.2}>
                  <FeatureRow label="Team Members" value={selectedPlan.max_users === 0 ? "Unlimited" : `${selectedPlan.max_users} Users`} enabled />
                  <FeatureRow label="Monthly Leads" value={selectedPlan.max_leads_per_month === 0 ? "Unlimited" : `${selectedPlan.max_leads_per_month} Leads`} enabled />
                  <FeatureRow label="Site Surveys" enabled={Boolean(selectedPlan.has_site_survey)} />
                  <FeatureRow label="Quotation & Invoice PDF" enabled={Boolean(selectedPlan.has_quotation_stages)} />
                  <FeatureRow label="Advanced Reports" enabled={Boolean(selectedPlan.has_reports)} />
                  <FeatureRow label="Android Mobile App" enabled={Boolean(selectedPlan.has_android_apk)} />
                </Stack>
              </Box>
            ) : (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <CardMembershipRoundedIcon sx={{ fontSize: 44, color: COLORS.border, mb: 1 }} />
                <Typography color={COLORS.textSecondary} variant="body2">
                  Select a plan from the dropdown to review included features and cost breakdown.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const FeatureRow = ({ label, value, enabled }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.4 }}>
    <Stack direction="row" alignItems="center" spacing={1}>
      {enabled ? (
        <CheckCircleRoundedIcon sx={{ fontSize: 16, color: COLORS.success }} />
      ) : (
        <CancelRoundedIcon sx={{ fontSize: 16, color: COLORS.textMuted }} />
      )}
      <Typography variant="body2" sx={{ color: enabled ? COLORS.textPrimary : COLORS.textMuted, fontSize: "0.82rem" }}>
        {label}
      </Typography>
    </Stack>
    {value && (
      <Typography variant="body2" fontWeight={700} sx={{ color: COLORS.textPrimary, fontSize: "0.82rem" }}>
        {value}
      </Typography>
    )}
  </Box>
);

export default CreateClient;