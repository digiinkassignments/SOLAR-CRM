import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Typography,
  Divider,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";

// Icons from @mui/icons-material
import HandshakeIcon from "@mui/icons-material/Handshake";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import SchoolIcon from "@mui/icons-material/School";
import DescriptionIcon from "@mui/icons-material/Description";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

const COLORS = {
  primary: "#0F172A",
  secondary: "#F59E0B",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F97316",
  bg: "#F8FAFC",
  cardBg: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
};

const useSnackbar = () => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return { snackbar, showSnackbar, hideSnackbar };
};

const initialFormData = {
  training_completed: "Completed",
  app_demo_completed: "Completed",
  emergency_contact_given: "Yes",
  operation_manual: "Yes",
  warranty_card: "Yes",
  maintenance_schedule: "Yes",
  inverter_manual: "Yes",
  handover_date: new Date().toISOString().split("T")[0],
  handover_manager: "",
  warranty_start_date: new Date().toISOString().split("T")[0],
  customer_signature: "Yes",
  customer_feedback: "",
  handover_status: "Completed",
  remarks: "",
};

export default function CustomerHandover({ project, projectId }) {
  const targetProjectId = projectId || project?.id;

  const [handover, setHandover] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const getApiUrl = (endpoint) => {
    const base = import.meta.env?.VITE_API_BASE_URL || "/api";
    const cleanedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    return `${cleanedBase}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  };

  const fetchHandover = useCallback(async () => {
    if (!targetProjectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(getApiUrl(`/projects/${targetProjectId}/handover`), {
        headers: getAuthHeader(),
      });

      const raw = res.data;
      const data =
        raw?.handover !== undefined
          ? raw.handover
          : raw?.data !== undefined
          ? raw.data
          : raw;

      if (data && (data.id || data.project_id || data.handover_status)) {
        setHandover(data);
      } else {
        setHandover(null);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        showSnackbar(
          err.response?.data?.message || "Failed to load customer handover data.",
          "error"
        );
      }
      setHandover(null);
    } finally {
      setLoading(false);
    }
  }, [targetProjectId, showSnackbar]);

  useEffect(() => {
    fetchHandover();
  }, [fetchHandover]);

  const handleOpenDialog = () => {
    if (handover) {
      setFormData({
        training_completed: handover.training_completed || "Completed",
        app_demo_completed: handover.app_demo_completed || "Completed",
        emergency_contact_given: handover.emergency_contact_given || "Yes",
        operation_manual: handover.operation_manual || "Yes",
        warranty_card: handover.warranty_card || "Yes",
        maintenance_schedule: handover.maintenance_schedule || "Yes",
        inverter_manual: handover.inverter_manual || "Yes",
        handover_date: handover.handover_date
          ? String(handover.handover_date).split("T")[0]
          : new Date().toISOString().split("T")[0],
        handover_manager: handover.handover_manager || "",
        warranty_start_date: handover.warranty_start_date
          ? String(handover.warranty_start_date).split("T")[0]
          : new Date().toISOString().split("T")[0],
        customer_signature: handover.customer_signature || "Yes",
        customer_feedback: handover.customer_feedback || "",
        handover_status: handover.handover_status || "Completed",
        remarks: handover.remarks || "",
      });
    } else {
      setFormData({
        ...initialFormData,
        handover_date: new Date().toISOString().split("T")[0],
        warranty_start_date: new Date().toISOString().split("T")[0],
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (!saving) {
      setDialogOpen(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!targetProjectId) {
      showSnackbar("Missing Project ID.", "error");
      return;
    }

    try {
      setSaving(true);
      const url = getApiUrl(`/projects/${targetProjectId}/handover`);
      const payload = { ...formData };

      let res;
      if (handover && handover.id) {
        res = await axios.put(url, payload, { headers: getAuthHeader() });
      } else {
        res = await axios.post(url, payload, { headers: getAuthHeader() });
      }

      const raw = res.data;
      const saved =
        raw?.handover !== undefined
          ? raw.handover
          : raw?.data !== undefined
          ? raw.data
          : raw;

      setHandover(saved || payload);
      showSnackbar("Customer handover data saved successfully!", "success");
      setDialogOpen(false);
      fetchHandover();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Failed to save customer handover data.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const getStatusChipProps = (status) => {
    switch (status) {
      case "Completed":
        return {
          label: "Completed",
          sx: {
            backgroundColor: "#ECFDF5",
            color: COLORS.success,
            border: `1px solid ${COLORS.success}`,
            fontWeight: 700,
            fontFamily: "Inter, sans-serif",
          },
        };
      case "Pending":
        return {
          label: "Pending",
          sx: {
            backgroundColor: "#FFFBEB",
            color: COLORS.secondary,
            border: `1px solid ${COLORS.secondary}`,
            fontWeight: 700,
            fontFamily: "Inter, sans-serif",
          },
        };
      case "Issues Reported":
        return {
          label: "Issues Reported",
          sx: {
            backgroundColor: "#FEF2F2",
            color: COLORS.error,
            border: `1px solid ${COLORS.error}`,
            fontWeight: 700,
            fontFamily: "Inter, sans-serif",
          },
        };
      default:
        return {
          label: status || "Pending",
          sx: {
            backgroundColor: "#F1F5F9",
            color: COLORS.textSecondary,
            border: `1px solid ${COLORS.border}`,
            fontWeight: 700,
            fontFamily: "Inter, sans-serif",
          },
        };
    }
  };

  const renderDetailItem = (label, value) => (
    <Box sx={{ mb: 1.5 }}>
      <Typography
        sx={{
          fontSize: "0.74rem",
          fontWeight: 600,
          color: COLORS.textSecondary,
          fontFamily: "Inter, sans-serif",
          textTransform: "uppercase",
          letterSpacing: "0.03em",
          mb: 0.25,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.9rem",
          fontWeight: 600,
          color: COLORS.textPrimary,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {value !== null && value !== undefined && value !== "" ? String(value) : "—"}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ fontFamily: "Inter, sans-serif" }}>
      {loading ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 8,
            gap: 2,
          }}
        >
          <CircularProgress size={36} sx={{ color: COLORS.primary }} />
          <Typography
            sx={{
              fontSize: "0.86rem",
              fontWeight: 500,
              color: COLORS.textSecondary,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Loading customer handover data...
          </Typography>
        </Box>
      ) : !handover ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: "14px",
            border: `1px dashed ${COLORS.border}`,
            backgroundColor: COLORS.cardBg,
            p: { xs: 3, sm: 6 },
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              backgroundColor: "#EFF6FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
              color: "#3B82F6",
            }}
          >
            <HandshakeIcon sx={{ fontSize: 34 }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: COLORS.textPrimary,
              fontFamily: "Inter, sans-serif",
              mb: 1,
            }}
          >
            Customer Handover Not Completed
          </Typography>
          <Typography
            sx={{
              fontSize: "0.88rem",
              color: COLORS.textSecondary,
              fontFamily: "Inter, sans-serif",
              maxWidth: 480,
              mb: 3,
            }}
          >
            Document customer training, app walkthrough, handover of warranty documents, and obtain sign-off.
          </Typography>
          <Button
            variant="contained"
            startIcon={<HandshakeIcon />}
            onClick={handleOpenDialog}
            sx={{
              backgroundColor: COLORS.primary,
              color: "#FFFFFF",
              textTransform: "none",
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              fontSize: "0.88rem",
              px: 3,
              py: 1,
              borderRadius: "8px",
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#020617",
                boxShadow: "none",
              },
            }}
          >
            Start Customer Handover
          </Button>
        </Card>
      ) : (
        <Box>
          {/* Header Action Bar */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              mb: 2.5,
              p: 2,
              borderRadius: "12px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.cardBg,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <HandshakeIcon sx={{ color: COLORS.success, fontSize: 28 }} />
              <Box>
                <Typography
                  sx={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Customer Handover Record
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    color: COLORS.textSecondary,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Handover Manager: <strong>{handover.handover_manager || "N/A"}</strong> • Date:{" "}
                  {handover.handover_date
                    ? String(handover.handover_date).split("T")[0]
                    : "N/A"}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Chip {...getStatusChipProps(handover.handover_status)} />
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                onClick={handleOpenDialog}
                sx={{
                  borderColor: COLORS.border,
                  color: COLORS.textPrimary,
                  textTransform: "none",
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  borderRadius: "8px",
                  "&:hover": {
                    borderColor: COLORS.primary,
                    backgroundColor: COLORS.bg,
                  },
                }}
              >
                Edit
              </Button>
            </Box>
          </Box>

          {/* Cards Grid */}
          <Grid container spacing={2.5}>
            {/* Section 1: Training & Demo */}
            <Grid item xs={12} md={6}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: "12px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.cardBg,
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2 }}>
                    <SchoolIcon sx={{ color: COLORS.secondary, fontSize: 22 }} />
                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: COLORS.textPrimary,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Training & Walkthrough
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6}>
                      {renderDetailItem("System Operation Training", handover.training_completed)}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      {renderDetailItem("Mobile App Demo", handover.app_demo_completed)}
                    </Grid>
                    <Grid item xs={12}>
                      {renderDetailItem("Emergency Contact Given", handover.emergency_contact_given)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section 2: Documents Handed Over */}
            <Grid item xs={12} md={6}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: "12px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.cardBg,
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2 }}>
                    <DescriptionIcon sx={{ color: COLORS.warning, fontSize: 22 }} />
                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: COLORS.textPrimary,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Documents Delivered
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      {renderDetailItem("Operation Manual", handover.operation_manual)}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem("Warranty Card", handover.warranty_card)}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem("Maintenance Schedule", handover.maintenance_schedule)}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem("Inverter Manual", handover.inverter_manual)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section 3: Handover Details */}
            <Grid item xs={12}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: "12px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.cardBg,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2 }}>
                    <AssignmentTurnedInIcon sx={{ color: COLORS.success, fontSize: 22 }} />
                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: COLORS.textPrimary,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Handover Sign-Off Details
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      {renderDetailItem("Handover Manager", handover.handover_manager)}
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      {renderDetailItem(
                        "Handover Date",
                        handover.handover_date
                          ? String(handover.handover_date).split("T")[0]
                          : null
                      )}
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      {renderDetailItem(
                        "Warranty Start Date",
                        handover.warranty_start_date
                          ? String(handover.warranty_start_date).split("T")[0]
                          : null
                      )}
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      {renderDetailItem("Signature Obtained", handover.customer_signature)}
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography
                          sx={{
                            fontSize: "0.74rem",
                            fontWeight: 600,
                            color: COLORS.textSecondary,
                            fontFamily: "Inter, sans-serif",
                            textTransform: "uppercase",
                            letterSpacing: "0.03em",
                            mb: 0.5,
                          }}
                        >
                          Handover Status
                        </Typography>
                        <Chip {...getStatusChipProps(handover.handover_status)} />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      {renderDetailItem("Remarks", handover.remarks)}
                    </Grid>
                    <Grid item xs={12}>
                      {renderDetailItem("Customer Feedback", handover.customer_feedback)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* MODAL DIALOG */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "14px",
            backgroundColor: COLORS.cardBg,
            fontFamily: "Inter, sans-serif",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2,
            borderBottom: `1px solid ${COLORS.border}`,
            fontSize: "1.1rem",
            fontWeight: 700,
            color: COLORS.textPrimary,
            fontFamily: "Inter, sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Customer Handover
          {handover && <Chip size="small" {...getStatusChipProps(formData.handover_status)} />}
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box component="form" id="handover-form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {/* Section 1: Training & Demo */}
            <Typography
              sx={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: COLORS.textPrimary,
                fontFamily: "Inter, sans-serif",
                mb: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <SchoolIcon sx={{ color: COLORS.secondary, fontSize: 20 }} />
              Section 1: Training & Demo
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                {
                  field: "training_completed",
                  label: "System Operation Training",
                  options: ["Completed", "Pending"],
                },
                {
                  field: "app_demo_completed",
                  label: "Mobile App Demo",
                  options: ["Completed", "Pending"],
                },
                {
                  field: "emergency_contact_given",
                  label: "Emergency Contact Given",
                  options: ["Yes", "No"],
                },
              ].map((item) => (
                <Grid item xs={12} sm={4} key={item.field}>
                  <Typography
                    sx={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: COLORS.textSecondary,
                      fontFamily: "Inter, sans-serif",
                      mb: 0.5,
                    }}
                  >
                    {item.label}
                  </Typography>
                  <RadioGroup
                    row
                    value={formData[item.field]}
                    onChange={(e) => handleInputChange(item.field, e.target.value)}
                  >
                    {item.options.map((opt) => (
                      <FormControlLabel
                        key={opt}
                        value={opt}
                        control={
                          <Radio
                            size="small"
                            sx={{
                              color: COLORS.border,
                              "&.Mui-checked": {
                                color:
                                  opt === "Completed" || opt === "Yes"
                                    ? COLORS.success
                                    : COLORS.secondary,
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            sx={{
                              fontSize: "0.85rem",
                              fontFamily: "Inter, sans-serif",
                              color: COLORS.textPrimary,
                            }}
                          >
                            {opt}
                          </Typography>
                        }
                      />
                    ))}
                  </RadioGroup>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 2.5, borderColor: COLORS.border }} />

            {/* Section 2: Documents Handed Over */}
            <Typography
              sx={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: COLORS.textPrimary,
                fontFamily: "Inter, sans-serif",
                mb: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <DescriptionIcon sx={{ color: COLORS.warning, fontSize: 20 }} />
              Section 2: Documents Handed Over
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { field: "operation_manual", label: "Operation Manual" },
                { field: "warranty_card", label: "Warranty Card" },
                { field: "maintenance_schedule", label: "Maintenance Schedule" },
                { field: "inverter_manual", label: "Inverter Manual" },
              ].map((item) => (
                <Grid item xs={12} sm={3} key={item.field}>
                  <Typography
                    sx={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: COLORS.textSecondary,
                      fontFamily: "Inter, sans-serif",
                      mb: 0.5,
                    }}
                  >
                    {item.label}
                  </Typography>
                  <RadioGroup
                    row
                    value={formData[item.field]}
                    onChange={(e) => handleInputChange(item.field, e.target.value)}
                  >
                    {["Yes", "No"].map((val) => (
                      <FormControlLabel
                        key={val}
                        value={val}
                        control={
                          <Radio
                            size="small"
                            sx={{
                              color: COLORS.border,
                              "&.Mui-checked": {
                                color: val === "Yes" ? COLORS.success : COLORS.error,
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            sx={{
                              fontSize: "0.85rem",
                              fontFamily: "Inter, sans-serif",
                              color: COLORS.textPrimary,
                            }}
                          >
                            {val}
                          </Typography>
                        }
                      />
                    ))}
                  </RadioGroup>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 2.5, borderColor: COLORS.border }} />

            {/* Section 3: Handover Details */}
            <Typography
              sx={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: COLORS.textPrimary,
                fontFamily: "Inter, sans-serif",
                mb: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <AssignmentTurnedInIcon sx={{ color: COLORS.success, fontSize: 20 }} />
              Section 3: Handover Details
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Handover Manager"
                  value={formData.handover_manager}
                  onChange={(e) => handleInputChange("handover_manager", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Handover Date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.handover_date}
                  onChange={(e) => handleInputChange("handover_date", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Warranty Start Date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.warranty_start_date}
                  onChange={(e) => handleInputChange("warranty_start_date", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: COLORS.textSecondary,
                    fontFamily: "Inter, sans-serif",
                    mb: 0.5,
                  }}
                >
                  Customer Signature Obtained
                </Typography>
                <RadioGroup
                  row
                  value={formData.customer_signature}
                  onChange={(e) => handleInputChange("customer_signature", e.target.value)}
                >
                  {["Yes", "No"].map((val) => (
                    <FormControlLabel
                      key={val}
                      value={val}
                      control={
                        <Radio
                          size="small"
                          sx={{
                            color: COLORS.border,
                            "&.Mui-checked": {
                              color: val === "Yes" ? COLORS.success : COLORS.error,
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          sx={{
                            fontSize: "0.85rem",
                            fontFamily: "Inter, sans-serif",
                            color: COLORS.textPrimary,
                          }}
                        >
                          {val}
                        </Typography>
                      }
                    />
                  ))}
                </RadioGroup>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontFamily: "Inter, sans-serif" }}>Handover Status</InputLabel>
                  <Select
                    value={formData.handover_status}
                    label="Handover Status"
                    onChange={(e) => handleInputChange("handover_status", e.target.value)}
                    sx={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Issues Reported">Issues Reported</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={1.5}
                  label="Remarks"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  label="Customer Feedback"
                  placeholder="Record customer experience, comments, app usability feedback..."
                  value={formData.customer_feedback}
                  onChange={(e) => handleInputChange("customer_feedback", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button
            onClick={handleCloseDialog}
            disabled={saving}
            startIcon={<CancelIcon />}
            sx={{
              color: COLORS.textSecondary,
              textTransform: "none",
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="handover-form"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{
              backgroundColor: COLORS.primary,
              color: "#FFFFFF",
              textTransform: "none",
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              borderRadius: "8px",
              px: 2.5,
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#020617",
                boxShadow: "none",
              },
            }}
          >
            {saving ? "Saving..." : "Save Handover"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={hideSnackbar}
          severity={snackbar.severity}
          sx={{
            width: "100%",
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            borderRadius: "8px",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
