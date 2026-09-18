import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Switch,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  FormControlLabel,
  Snackbar,
  Stack,
  Avatar,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";

// Icons
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";

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

const featureLabels = [
  { key: "has_manager_role", label: "Manager Role Access" },
  { key: "has_site_survey", label: "Site Survey Module" },
  { key: "has_quotation_stages", label: "Quotation & Invoice PDF" },
  { key: "has_reports", label: "Reports & Analytics" },
  { key: "has_csv_import_export", label: "CSV Import / Export" },
  { key: "has_bulk_reassign", label: "Bulk Lead Reassignment" },
  { key: "has_advanced_reports", label: "Advanced Business BI" },
  { key: "has_activity_logs", label: "Activity Audit Logs" },
  { key: "has_push_notifications", label: "Push Notifications (FCM)" },
  { key: "has_android_apk", label: "Android Mobile App" },
  { key: "has_multi_branch", label: "Multi-Branch Support" },
  { key: "has_priority_support", label: "24/7 Priority Support" },
];

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  // Edit Dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get("/plans");
      setPlans(res.data?.data || []);
    } catch {
      setError("Failed to load subscription plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openEdit = (plan) => {
    setEditForm({ ...plan });
    setEditOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const handleSave = async () => {
    setEditLoading(true);
    try {
      await api.put(`/plans/${editForm.id}`, editForm);
      setSnack({ open: true, msg: "Plan updated successfully!", severity: "success" });
      setEditOpen(false);
      fetchPlans();
    } catch (err) {
      setSnack({ open: true, msg: err.response?.data?.message || "Failed to update plan.", severity: "error" });
    } finally {
      setEditLoading(false);
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
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800} color={COLORS.primaryDark}>
          Subscription Plans & Feature Flags
        </Typography>
        <Typography variant="body2" color={COLORS.textSecondary} sx={{ mt: 0.3 }}>
          Configure pricing tiers, user limits, and tenant feature entitlements
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: "10px" }}>{error}</Alert>}

      {/* 2x2 Balanced Plans Grid (2 per row, perfectly filling full width) */}
      <Grid container spacing={3} mb={4}>
        {plans.map((plan) => {
          const isEnterprise = plan.id === 4 || plan.name?.toLowerCase().includes("enterprise");

          return (
            <Grid item xs={12} md={6} key={plan.id}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: "16px",
                  border: isEnterprise ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                  overflow: "hidden",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: COLORS.card,
                  transition: "box-shadow 0.2s ease, transform 0.2s ease",
                  "&:hover": {
                    boxShadow: "0 10px 25px rgba(11, 58, 99, 0.08)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                {/* Plan Header */}
                <Box
                  sx={{
                    p: 2.5,
                    backgroundColor: isEnterprise ? COLORS.primaryDark : "#F8FAFC",
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "10px",
                          backgroundColor: isEnterprise ? "rgba(255,255,255,0.15)" : COLORS.primarySoft,
                          color: isEnterprise ? "#38BDF8" : COLORS.primary,
                        }}
                      >
                        <WorkspacePremiumRoundedIcon sx={{ fontSize: 22 }} />
                      </Avatar>
                      <Box>
                        <Typography
                          variant="h6"
                          fontWeight={800}
                          color={isEnterprise ? "#FFFFFF" : COLORS.primaryDark}
                          sx={{ fontSize: "1.1rem", lineHeight: 1.2 }}
                        >
                          {plan.name} Plan
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: isEnterprise ? "rgba(255,255,255,0.7)" : COLORS.textSecondary }}
                        >
                          Monthly Tier Subscription
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      size="small"
                      variant={isEnterprise ? "contained" : "outlined"}
                      startIcon={<EditRoundedIcon sx={{ fontSize: 14 }} />}
                      onClick={() => openEdit(plan)}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        borderRadius: "8px",
                        fontSize: "0.78rem",
                        px: 2,
                        py: 0.6,
                        backgroundColor: isEnterprise ? "rgba(255,255,255,0.18)" : COLORS.card,
                        color: isEnterprise ? "#FFFFFF" : COLORS.primary,
                        borderColor: isEnterprise ? "rgba(255,255,255,0.3)" : COLORS.border,
                        "&:hover": {
                          backgroundColor: isEnterprise ? "rgba(255,255,255,0.28)" : "rgba(0,91,172,0.06)",
                        },
                      }}
                    >
                      Edit Plan
                    </Button>
                  </Box>

                  {/* Pricing and Capacity Badges */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mt: 2 }}>
                    <Typography
                      variant="h4"
                      fontWeight={800}
                      color={isEnterprise ? "#38BDF8" : COLORS.primary}
                      sx={{ fontSize: "1.6rem" }}
                    >
                      ₹{Number(plan.price_monthly).toLocaleString("en-IN")}
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{
                          color: isEnterprise ? "rgba(255,255,255,0.6)" : COLORS.textSecondary,
                          ml: 0.5,
                          fontSize: "0.82rem",
                          fontWeight: 500,
                        }}
                      >
                        /month
                      </Typography>
                    </Typography>

                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={`${plan.max_users === 0 ? "Unlimited" : plan.max_users} Users`}
                        size="small"
                        sx={{
                          bgcolor: isEnterprise ? "rgba(56,189,248,0.2)" : COLORS.primarySoft,
                          color: isEnterprise ? "#38BDF8" : COLORS.primary,
                          fontWeight: 700,
                          fontSize: "0.72rem",
                        }}
                      />
                      <Chip
                        label={`${plan.max_leads_per_month === 0 ? "Unlimited" : plan.max_leads_per_month} Leads/mo`}
                        size="small"
                        sx={{
                          bgcolor: isEnterprise ? "rgba(34,197,94,0.2)" : COLORS.successSoft,
                          color: isEnterprise ? "#4ADE80" : COLORS.success,
                          fontWeight: 700,
                          fontSize: "0.72rem",
                        }}
                      />
                    </Stack>
                  </Box>
                </Box>

                {/* 2-Column Feature Grid inside each Plan Card */}
                <Box sx={{ p: 2.5, flex: 1 }}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, display: "block", mb: 1.5, letterSpacing: "0.03em" }}>
                    INCLUDED FEATURES & PERMISSIONS
                  </Typography>

                  <Grid container spacing={1.2}>
                    {featureLabels.map(({ key, label }) => {
                      const isEnabled = Boolean(plan[key]);

                      return (
                        <Grid item xs={12} sm={6} key={key}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              py: 0.5,
                            }}
                          >
                            {isEnabled ? (
                              <CheckCircleRoundedIcon sx={{ fontSize: 16, color: COLORS.success }} />
                            ) : (
                              <CancelRoundedIcon sx={{ fontSize: 16, color: COLORS.textMuted }} />
                            )}
                            <Typography
                              variant="body2"
                              sx={{
                                color: isEnabled ? COLORS.textPrimary : COLORS.textMuted,
                                fontSize: "0.8rem",
                                fontWeight: isEnabled ? 600 : 400,
                              }}
                            >
                              {label}
                            </Typography>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Feature Comparison Matrix Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.card,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2.5, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 1.2 }}>
          <TableChartRoundedIcon sx={{ color: COLORS.primary, fontSize: 22 }} />
          <Box>
            <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1rem" }}>
              Full Feature Comparison Matrix
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
              Direct side-by-side feature comparison across all subscription tiers
            </Typography>
          </Box>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#F8FAFC" }}>
              <TableCell sx={{ fontWeight: 800, color: COLORS.textPrimary, py: 1.8, minWidth: 200 }}>
                Feature / Entitlement
              </TableCell>
              {plans.map((p) => (
                <TableCell key={p.id} sx={{ fontWeight: 800, color: COLORS.textPrimary, textAlign: "center", minWidth: 120 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: COLORS.primaryDark }}>
                    {p.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: COLORS.primary, fontWeight: 700 }}>
                    ₹{Number(p.price_monthly).toLocaleString("en-IN")}/mo
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow hover>
              <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, py: 1.4 }}>
                Team Members (Max Users)
              </TableCell>
              {plans.map((p) => (
                <TableCell key={p.id} sx={{ textAlign: "center", fontWeight: 700, color: COLORS.textPrimary }}>
                  {p.max_users === 0 ? "Unlimited" : `${p.max_users} Users`}
                </TableCell>
              ))}
            </TableRow>
            <TableRow hover>
              <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, py: 1.4 }}>
                Monthly Leads Limit
              </TableCell>
              {plans.map((p) => (
                <TableCell key={p.id} sx={{ textAlign: "center", fontWeight: 700, color: COLORS.textPrimary }}>
                  {p.max_leads_per_month === 0 ? "Unlimited" : `${p.max_leads_per_month} Leads`}
                </TableCell>
              ))}
            </TableRow>
            {featureLabels.map(({ key, label }) => (
              <TableRow key={key} hover>
                <TableCell sx={{ color: COLORS.textPrimary, py: 1.2, fontSize: "0.82rem" }}>
                  {label}
                </TableCell>
                {plans.map((p) => (
                  <TableCell key={p.id} sx={{ textAlign: "center" }}>
                    {p[key] ? (
                      <CheckCircleRoundedIcon sx={{ fontSize: 18, color: COLORS.success }} />
                    ) : (
                      <CancelRoundedIcon sx={{ fontSize: 18, color: COLORS.textMuted }} />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Edit Plan Dialog */}
      {editForm && (
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}>
          <DialogTitle sx={{ fontWeight: 800, color: COLORS.primaryDark }}>
            Configure Plan: {editForm.name}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Plan Name"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  fullWidth
                  size="small"
                  InputProps={{ sx: { borderRadius: "8px" } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Monthly Price (₹)"
                  name="price_monthly"
                  type="number"
                  value={editForm.price_monthly}
                  onChange={handleEditChange}
                  fullWidth
                  size="small"
                  InputProps={{ sx: { borderRadius: "8px" } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Max Users (0 = Unlimited)"
                  name="max_users"
                  type="number"
                  value={editForm.max_users}
                  onChange={handleEditChange}
                  fullWidth
                  size="small"
                  InputProps={{ sx: { borderRadius: "8px" } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Max Leads/Month (0 = Unlimited)"
                  name="max_leads_per_month"
                  type="number"
                  value={editForm.max_leads_per_month}
                  onChange={handleEditChange}
                  fullWidth
                  size="small"
                  InputProps={{ sx: { borderRadius: "8px" } }}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1.5, borderColor: COLORS.border }} />
                <Typography variant="subtitle2" fontWeight={700} color={COLORS.primaryDark} mb={1}>
                  Feature Entitlements
                </Typography>
              </Grid>

              {featureLabels.map(({ key, label }) => (
                <Grid item xs={6} key={key}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(editForm[key])}
                        onChange={handleEditChange}
                        name={key}
                        size="small"
                        color="primary"
                      />
                    }
                    label={<Typography variant="body2" sx={{ fontSize: "0.82rem" }}>{label}</Typography>}
                  />
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditOpen(false)} sx={{ textTransform: "none", color: COLORS.textSecondary }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={editLoading}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 700,
                px: 3,
                backgroundColor: COLORS.primary,
                "&:hover": { backgroundColor: "#0A6FD8" },
              }}
            >
              {editLoading ? <CircularProgress size={18} color="inherit" /> : "Save Plan Changes"}
            </Button>
          </DialogActions>
        </Dialog>
      )}

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

export default Plans;