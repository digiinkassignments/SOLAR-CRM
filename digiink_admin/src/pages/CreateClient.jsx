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
        `Client provisioned successfully! Subdomain: ${data.subdomain}.solarcrm.com | Temp Password: ${data.tempPassword}`
      );
      setTimeout(() => navigate("/clients"), 3500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to provision tenant client.");
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === Number(form.plan_id));
  const estimatedCost = selectedPlan ? Number(selectedPlan.price_monthly) * Number(form.duration_months) : 0;

  return (
    <Box sx={{ width: "100%", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <IconButton
          onClick={() => navigate("/clients")}
          sx={{
            bgcolor: GOOGLE_COLORS.card,
            border: `1px solid ${GOOGLE_COLORS.border}`,
            color: GOOGLE_COLORS.textSecondary,
            borderRadius: "100px",
            width: 40,
            height: 40,
            "&:hover": { bgcolor: GOOGLE_COLORS.bg },
          }}
        >
          <ArrowBackRoundedIcon fontSize="small" />
        </IconButton>
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
            Provision New Tenant Instance
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: GOOGLE_COLORS.textSecondary,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Provision an isolated tenant database, configure subdomain routes, and generate master admin keys
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2.5,
            borderRadius: "16px",
            bgcolor: GOOGLE_COLORS.redSoft,
            color: GOOGLE_COLORS.red,
            border: `1px solid #FAD2CF`,
            "& .MuiAlert-icon": { color: GOOGLE_COLORS.red },
          }}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{
            mb: 2.5,
            borderRadius: "16px",
            bgcolor: GOOGLE_COLORS.greenSoft,
            color: GOOGLE_COLORS.green,
            border: `1px solid #CEEAD6`,
            "& .MuiAlert-icon": { color: GOOGLE_COLORS.green },
          }}
        >
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Provision Form */}
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "20px",
              border: `1px solid ${GOOGLE_COLORS.border}`,
              p: { xs: 2.8, sm: 3.5 },
              backgroundColor: GOOGLE_COLORS.card,
            }}
            component="form"
            onSubmit={handleSubmit}
          >
            {/* Section 1: Business Info */}
            <Stack direction="row" alignItems="center" spacing={1.2} mb={2}>
              <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: GOOGLE_COLORS.blue }} />
              <BusinessRoundedIcon sx={{ color: GOOGLE_COLORS.blue, fontSize: 22 }} />
              <Typography sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, fontSize: "0.98rem" }}>
                Tenant Organization Details
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2.8, borderColor: GOOGLE_COLORS.border }} />

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
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                      backgroundColor: GOOGLE_COLORS.bg,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    },
                  }}
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
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                      backgroundColor: GOOGLE_COLORS.bg,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    },
                  }}
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
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                      backgroundColor: GOOGLE_COLORS.bg,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    },
                  }}
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
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                      backgroundColor: GOOGLE_COLORS.bg,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    },
                  }}
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
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                      backgroundColor: GOOGLE_COLORS.bg,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    },
                  }}
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

            {/* Section 2: Subscription & Subdomain */}
            <Stack direction="row" alignItems="center" spacing={1.2} mt={4} mb={2}>
              <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: GOOGLE_COLORS.green }} />
              <CardMembershipRoundedIcon sx={{ color: GOOGLE_COLORS.green, fontSize: 22 }} />
              <Typography sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, fontSize: "0.98rem" }}>
                Subscription Tier & Subdomain Route
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2.8, borderColor: GOOGLE_COLORS.border }} />

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
                      ? `Tenant Route: https://${form.subdomain}.solarcrm.com`
                      : "Auto-generated slug based on business name"
                  }
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                      backgroundColor: GOOGLE_COLORS.bg,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Select Subscription Plan *</InputLabel>
                  <Select
                    name="plan_id"
                    value={form.plan_id}
                    label="Select Subscription Plan *"
                    onChange={handleChange}
                    sx={{
                      borderRadius: "12px",
                      backgroundColor: GOOGLE_COLORS.bg,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
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
                  <InputLabel sx={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Initial Duration</InputLabel>
                  <Select
                    name="duration_months"
                    value={form.duration_months}
                    label="Initial Duration"
                    onChange={handleChange}
                    sx={{
                      borderRadius: "12px",
                      backgroundColor: GOOGLE_COLORS.bg,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
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
                disableElevation
                disabled={loading}
                startIcon={<AddBusinessRoundedIcon />}
                sx={{
                  borderRadius: "100px",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3.5,
                  py: 1.2,
                  backgroundColor: GOOGLE_COLORS.blue,
                  color: "#FFFFFF",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  "&:hover": { backgroundColor: GOOGLE_COLORS.blueDark },
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : "Provision & Deploy Instance"}
              </Button>

              <Button
                onClick={() => navigate("/clients")}
                sx={{
                  borderRadius: "100px",
                  textTransform: "none",
                  fontWeight: 600,
                  color: GOOGLE_COLORS.textSecondary,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
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
              borderRadius: "20px",
              border: `1px solid ${GOOGLE_COLORS.border}`,
              p: 3,
              backgroundColor: GOOGLE_COLORS.card,
              position: "sticky",
              top: 90,
            }}
          >
            <Typography sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, fontSize: "0.98rem", mb: 2 }}>
              Resource Plan Summary
            </Typography>
            <Divider sx={{ mb: 2.5, borderColor: GOOGLE_COLORS.border }} />

            {selectedPlan ? (
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={700} color={GOOGLE_COLORS.blue}>
                      {selectedPlan.name} Tier
                    </Typography>
                    <Typography variant="caption" color={GOOGLE_COLORS.textSecondary}>
                      ₹{Number(selectedPlan.price_monthly).toLocaleString("en-IN")}/month
                    </Typography>
                  </Box>
                  <Chip
                    label={`${form.duration_months} mo`}
                    size="small"
                    sx={{ fontWeight: 700, bgcolor: GOOGLE_COLORS.blueSoft, color: GOOGLE_COLORS.blue, borderRadius: "100px" }}
                  />
                </Box>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 2.5,
                    borderRadius: "14px",
                    bgcolor: GOOGLE_COLORS.bg,
                    border: `1px solid ${GOOGLE_COLORS.border}`,
                  }}
                >
                  <Typography variant="caption" color={GOOGLE_COLORS.textSecondary} fontWeight={600}>Estimated Initial Invoice</Typography>
                  <Typography variant="h5" fontWeight={700} color={GOOGLE_COLORS.textPrimary}>
                    ₹{estimatedCost.toLocaleString("en-IN")}
                  </Typography>
                </Paper>

                <Stack spacing={1.2}>
                  <FeatureRow label="Team Members" value={selectedPlan.max_users === 0 ? "Unlimited" : `${selectedPlan.max_users} Users`} enabled />
                  <FeatureRow label="Monthly Leads Limit" value={selectedPlan.max_leads_per_month === 0 ? "Unlimited" : `${selectedPlan.max_leads_per_month} Leads`} enabled />
                  <FeatureRow label="Site Surveys Module" enabled={Boolean(selectedPlan.has_site_survey)} />
                  <FeatureRow label="Quotation & Invoice PDF" enabled={Boolean(selectedPlan.has_quotation_stages)} />
                  <FeatureRow label="Advanced Analytics" enabled={Boolean(selectedPlan.has_reports)} />
                  <FeatureRow label="Android Mobile App Access" enabled={Boolean(selectedPlan.has_android_apk)} />
                </Stack>
              </Box>
            ) : (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <CardMembershipRoundedIcon sx={{ fontSize: 44, color: GOOGLE_COLORS.border, mb: 1.5 }} />
                <Typography color={GOOGLE_COLORS.textSecondary} variant="body2">
                  Select a subscription plan to view resource quotas and estimated billing breakdown.
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
        <CheckCircleRoundedIcon sx={{ fontSize: 17, color: GOOGLE_COLORS.green }} />
      ) : (
        <CancelRoundedIcon sx={{ fontSize: 17, color: GOOGLE_COLORS.textMuted }} />
      )}
      <Typography variant="body2" sx={{ color: enabled ? GOOGLE_COLORS.textPrimary : GOOGLE_COLORS.textMuted, fontSize: "0.82rem" }}>
        {label}
      </Typography>
    </Stack>
    {value && (
      <Typography variant="body2" fontWeight={700} sx={{ color: GOOGLE_COLORS.textPrimary, fontSize: "0.82rem" }}>
        {value}
      </Typography>
    )}
  </Box>
);

export default CreateClient;