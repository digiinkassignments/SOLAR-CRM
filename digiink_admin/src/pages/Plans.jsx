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
        <CircularProgress size={36} sx={{ color: GOOGLE_COLORS.blue }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: GOOGLE_COLORS.textPrimary,
            fontSize: "1.35rem",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Subscription Tiers & Entitlements
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: GOOGLE_COLORS.textSecondary,
            mt: 0.4,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Configure tenant pricing tiers, resource quotas, and feature flag entitlements
        </Typography>
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

      {/* 2x2 Balanced Plans Grid */}
      <Grid container spacing={3} mb={4}>
        {plans.map((plan) => {
          const isEnterprise = plan.id === 4 || plan.name?.toLowerCase().includes("enterprise");

          return (
            <Grid item xs={12} md={6} key={plan.id}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: "20px",
                  border: isEnterprise ? `2px solid ${GOOGLE_COLORS.blue}` : `1px solid ${GOOGLE_COLORS.border}`,
                  overflow: "hidden",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: GOOGLE_COLORS.card,
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.06)",
                    borderColor: GOOGLE_COLORS.blue,
                  },
                }}
              >
                {/* Plan Header */}
                <Box
                  sx={{
                    p: 2.8,
                    backgroundColor: isEnterprise ? GOOGLE_COLORS.blueDark : "#F8F9FA",
                    borderBottom: `1px solid ${GOOGLE_COLORS.border}`,
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "100px",
                          backgroundColor: isEnterprise ? "rgba(255,255,255,0.15)" : GOOGLE_COLORS.blueSoft,
                          color: isEnterprise ? "#FFFFFF" : GOOGLE_COLORS.blue,
                        }}
                      >
                        <WorkspacePremiumRoundedIcon sx={{ fontSize: 22 }} />
                      </Avatar>
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: isEnterprise ? "#FFFFFF" : GOOGLE_COLORS.textPrimary,
                            fontSize: "1.15rem",
                            lineHeight: 1.2,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}
                        >
                          {plan.name} Tier
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: isEnterprise ? "rgba(255,255,255,0.7)" : GOOGLE_COLORS.textSecondary,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}
                        >
                          Monthly Recurring Subscription
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      size="small"
                      variant={isEnterprise ? "contained" : "outlined"}
                      disableElevation
                      startIcon={<EditRoundedIcon sx={{ fontSize: 14 }} />}
                      onClick={() => openEdit(plan)}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: "100px",
                        fontSize: "0.78rem",
                        px: 2,
                        py: 0.6,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        backgroundColor: isEnterprise ? "rgba(255,255,255,0.2)" : GOOGLE_COLORS.card,
                        color: isEnterprise ? "#FFFFFF" : GOOGLE_COLORS.blue,
                        borderColor: isEnterprise ? "rgba(255,255,255,0.3)" : GOOGLE_COLORS.border,
                        "&:hover": {
                          backgroundColor: isEnterprise ? "rgba(255,255,255,0.3)" : GOOGLE_COLORS.blueSoft,
                          borderColor: GOOGLE_COLORS.blue,
                        },
                      }}
                    >
                      Edit Plan
                    </Button>
                  </Box>

                  {/* Pricing and Capacity Badges */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mt: 2.2 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: isEnterprise ? "#FFFFFF" : GOOGLE_COLORS.blue,
                        fontSize: "1.65rem",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      ₹{Number(plan.price_monthly).toLocaleString("en-IN")}
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{
                          color: isEnterprise ? "rgba(255,255,255,0.7)" : GOOGLE_COLORS.textSecondary,
                          ml: 0.5,
                          fontSize: "0.82rem",
                          fontWeight: 500,
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
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
                          bgcolor: isEnterprise ? "rgba(255,255,255,0.2)" : GOOGLE_COLORS.blueSoft,
                          color: isEnterprise ? "#FFFFFF" : GOOGLE_COLORS.blue,
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          borderRadius: "100px",
                        }}
                      />
                      <Chip
                        label={`${plan.max_leads_per_month === 0 ? "Unlimited" : plan.max_leads_per_month} Leads/mo`}
                        size="small"
                        sx={{
                          bgcolor: isEnterprise ? "rgba(30,142,62,0.3)" : GOOGLE_COLORS.greenSoft,
                          color: isEnterprise ? "#CEEAD6" : GOOGLE_COLORS.green,
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          borderRadius: "100px",
                        }}
                      />
                    </Stack>
                  </Box>
                </Box>

                {/* 2-Column Feature Grid inside each Plan Card */}
                <Box sx={{ p: 2.8, flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: GOOGLE_COLORS.textMuted,
                      fontWeight: 700,
                      display: "block",
                      mb: 1.5,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
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
                              <CheckCircleRoundedIcon sx={{ fontSize: 17, color: GOOGLE_COLORS.green }} />
                            ) : (
                              <CancelRoundedIcon sx={{ fontSize: 17, color: GOOGLE_COLORS.textMuted }} />
                            )}
                            <Typography
                              variant="body2"
                              sx={{
                                color: isEnabled ? GOOGLE_COLORS.textPrimary : GOOGLE_COLORS.textMuted,
                                fontSize: "0.82rem",
                                fontWeight: isEnabled ? 600 : 400,
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
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
          borderRadius: "20px",
          border: `1px solid ${GOOGLE_COLORS.border}`,
          backgroundColor: GOOGLE_COLORS.card,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2.5, borderBottom: `1px solid ${GOOGLE_COLORS.border}`, display: "flex", alignItems: "center", gap: 1.2 }}>
          <TableChartRoundedIcon sx={{ color: GOOGLE_COLORS.blue, fontSize: 22 }} />
          <Box>
            <Typography sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, fontSize: "0.98rem" }}>
              Side-by-Side Feature Comparison Matrix
            </Typography>
            <Typography variant="caption" sx={{ color: GOOGLE_COLORS.textSecondary }}>
              Comprehensive feature availability matrix across all subscription plans
            </Typography>
          </Box>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#F8F9FA" }}>
              <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, py: 1.8, minWidth: 220, fontSize: "0.78rem" }}>
                Feature / Entitlement
              </TableCell>
              {plans.map((p) => (
                <TableCell key={p.id} sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, textAlign: "center", minWidth: 120 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: GOOGLE_COLORS.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {p.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: GOOGLE_COLORS.blue, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    ₹{Number(p.price_monthly).toLocaleString("en-IN")}/mo
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow hover sx={{ "&:hover": { backgroundColor: "#F8F9FA" } }}>
              <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, py: 1.4, fontSize: "0.82rem" }}>
                Team Members (Max Users)
              </TableCell>
              {plans.map((p) => (
                <TableCell key={p.id} sx={{ textAlign: "center", fontWeight: 700, color: GOOGLE_COLORS.textPrimary, fontSize: "0.82rem" }}>
                  {p.max_users === 0 ? "Unlimited" : `${p.max_users} Users`}
                </TableCell>
              ))}
            </TableRow>
            <TableRow hover sx={{ "&:hover": { backgroundColor: "#F8F9FA" } }}>
              <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, py: 1.4, fontSize: "0.82rem" }}>
                Monthly Leads Limit
              </TableCell>
              {plans.map((p) => (
                <TableCell key={p.id} sx={{ textAlign: "center", fontWeight: 700, color: GOOGLE_COLORS.textPrimary, fontSize: "0.82rem" }}>
                  {p.max_leads_per_month === 0 ? "Unlimited" : `${p.max_leads_per_month} Leads`}
                </TableCell>
              ))}
            </TableRow>
            {featureLabels.map(({ key, label }) => (
              <TableRow key={key} hover sx={{ "&:hover": { backgroundColor: "#F8F9FA" } }}>
                <TableCell sx={{ color: GOOGLE_COLORS.textPrimary, py: 1.2, fontSize: "0.82rem" }}>
                  {label}
                </TableCell>
                {plans.map((p) => (
                  <TableCell key={p.id} sx={{ textAlign: "center" }}>
                    {p[key] ? (
                      <CheckCircleRoundedIcon sx={{ fontSize: 18, color: GOOGLE_COLORS.green }} />
                    ) : (
                      <CancelRoundedIcon sx={{ fontSize: 18, color: GOOGLE_COLORS.textMuted }} />
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
        <Dialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "24px",
              p: 1.5,
              border: `1px solid ${GOOGLE_COLORS.border}`,
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, fontSize: "1.15rem" }}>
            Configure Tier Entitlements: {editForm.name}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Plan Tier Name"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  fullWidth
                  size="small"
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    },
                  }}
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
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    },
                  }}
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
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    },
                  }}
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
                  InputProps={{
                    sx: {
                      borderRadius: "12px",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1.5, borderColor: GOOGLE_COLORS.border }} />
                <Typography variant="subtitle2" fontWeight={700} color={GOOGLE_COLORS.textPrimary} mb={1}>
                  Feature Flag Permissions
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
                    label={<Typography variant="body2" sx={{ fontSize: "0.82rem", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{label}</Typography>}
                  />
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditOpen(false)} sx={{ textTransform: "none", color: GOOGLE_COLORS.textSecondary, borderRadius: "100px", px: 2 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={handleSave}
              disabled={editLoading}
              sx={{
                borderRadius: "100px",
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                backgroundColor: GOOGLE_COLORS.blue,
                color: "#FFFFFF",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                "&:hover": { backgroundColor: GOOGLE_COLORS.blueDark },
              }}
            >
              {editLoading ? <CircularProgress size={18} color="inherit" /> : "Save Plan Entitlements"}
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
        <Alert severity={snack.severity} sx={{ borderRadius: "12px" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Plans;