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
import FactCheckIcon from "@mui/icons-material/FactCheck";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";

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
  installation_quality: "Pass",
  safety_compliance: "Pass",
  document_verification: "Pass",
  performance_testing: "Pass",
  inspector_name: "",
  inspector_type: "Internal",
  inspection_date: new Date().toISOString().split("T")[0],
  inspection_status: "Approved",
  corrections_needed: "",
  certificate_number: "",
  remarks: "",
};

export default function FinalInspection({ project, projectId }) {
  const targetProjectId = projectId || project?.id;

  const [inspection, setInspection] = useState(null);
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

  const fetchInspection = useCallback(async () => {
    if (!targetProjectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(getApiUrl(`/projects/${targetProjectId}/final-inspection`), {
        headers: getAuthHeader(),
      });

      const raw = res.data;
      const data =
        raw?.inspection !== undefined
          ? raw.inspection
          : raw?.data !== undefined
          ? raw.data
          : raw;

      if (data && (data.id || data.project_id || data.inspection_status)) {
        setInspection(data);
      } else {
        setInspection(null);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        showSnackbar(
          err.response?.data?.message || "Failed to load final inspection data.",
          "error"
        );
      }
      setInspection(null);
    } finally {
      setLoading(false);
    }
  }, [targetProjectId, showSnackbar]);

  useEffect(() => {
    fetchInspection();
  }, [fetchInspection]);

  const handleOpenDialog = () => {
    if (inspection) {
      setFormData({
        installation_quality: inspection.installation_quality || "Pass",
        safety_compliance: inspection.safety_compliance || "Pass",
        document_verification: inspection.document_verification || "Pass",
        performance_testing: inspection.performance_testing || "Pass",
        inspector_name: inspection.inspector_name || "",
        inspector_type: inspection.inspector_type || "Internal",
        inspection_date: inspection.inspection_date
          ? String(inspection.inspection_date).split("T")[0]
          : new Date().toISOString().split("T")[0],
        inspection_status: inspection.inspection_status || "Approved",
        corrections_needed: inspection.corrections_needed || "",
        certificate_number: inspection.certificate_number || "",
        remarks: inspection.remarks || "",
      });
    } else {
      setFormData({
        ...initialFormData,
        inspection_date: new Date().toISOString().split("T")[0],
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
      const url = getApiUrl(`/projects/${targetProjectId}/final-inspection`);
      const payload = { ...formData };

      let res;
      if (inspection && inspection.id) {
        res = await axios.put(url, payload, { headers: getAuthHeader() });
      } else {
        res = await axios.post(url, payload, { headers: getAuthHeader() });
      }

      const raw = res.data;
      const saved =
        raw?.inspection !== undefined
          ? raw.inspection
          : raw?.data !== undefined
          ? raw.data
          : raw;

      setInspection(saved || payload);
      showSnackbar("Final Inspection details saved successfully!", "success");
      setDialogOpen(false);
      fetchInspection();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Failed to save final inspection.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const getStatusChipProps = (status) => {
    switch (status) {
      case "Approved":
        return {
          label: "Approved",
          sx: {
            backgroundColor: "#ECFDF5",
            color: COLORS.success,
            border: `1px solid ${COLORS.success}`,
            fontWeight: 700,
            fontFamily: "Inter, sans-serif",
          },
        };
      case "Rejected":
        return {
          label: "Rejected",
          sx: {
            backgroundColor: "#FEF2F2",
            color: COLORS.error,
            border: `1px solid ${COLORS.error}`,
            fontWeight: 700,
            fontFamily: "Inter, sans-serif",
          },
        };
      case "Re-inspection Required":
        return {
          label: "Re-inspection Required",
          sx: {
            backgroundColor: "#FFFBEB",
            color: COLORS.secondary,
            border: `1px solid ${COLORS.secondary}`,
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
            Loading final inspection data...
          </Typography>
        </Box>
      ) : !inspection ? (
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
            <FactCheckIcon sx={{ fontSize: 34 }} />
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
            Final Inspection Not Done
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
            Conduct comprehensive quality compliance checks, performance validations, and verify regulatory clearance.
          </Typography>
          <Button
            variant="contained"
            startIcon={<FactCheckIcon />}
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
            Start Final Inspection
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
              <FactCheckIcon sx={{ color: COLORS.primary, fontSize: 28 }} />
              <Box>
                <Typography
                  sx={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Final Inspection & Quality Clearance
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    color: COLORS.textSecondary,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Inspector: <strong>{inspection.inspector_name || "N/A"}</strong> ({inspection.inspector_type || "Internal"}) • Date:{" "}
                  {inspection.inspection_date
                    ? String(inspection.inspection_date).split("T")[0]
                    : "N/A"}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Chip {...getStatusChipProps(inspection.inspection_status)} />
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
            {/* Section 1: Quality Checks */}
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
                    <AssignmentTurnedInIcon sx={{ color: COLORS.success, fontSize: 22 }} />
                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: COLORS.textPrimary,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Quality & Compliance Checks
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      {renderDetailItem("Installation Quality", inspection.installation_quality)}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem("Safety Compliance", inspection.safety_compliance)}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem("Document Verification", inspection.document_verification)}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem("Performance Testing", inspection.performance_testing)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section 2: Inspector Details */}
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
                    <PersonSearchIcon sx={{ color: COLORS.secondary, fontSize: 22 }} />
                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: COLORS.textPrimary,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Inspector & Clearance Details
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      {renderDetailItem("Inspector Name", inspection.inspector_name)}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem("Inspector Type", inspection.inspector_type)}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem(
                        "Inspection Date",
                        inspection.inspection_date
                          ? String(inspection.inspection_date).split("T")[0]
                          : null
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem("Approval Cert No.", inspection.certificate_number)}
                    </Grid>
                    <Grid item xs={12}>
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
                          Inspection Status
                        </Typography>
                        <Chip {...getStatusChipProps(inspection.inspection_status)} />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Remarks and Corrections */}
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
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      {renderDetailItem("Corrections Needed", inspection.corrections_needed)}
                    </Grid>
                    <Grid item xs={12} md={6}>
                      {renderDetailItem("Remarks", inspection.remarks)}
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
          Final Inspection & Approval
          {inspection && <Chip size="small" {...getStatusChipProps(formData.inspection_status)} />}
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box component="form" id="final-inspection-form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {/* Section 1: Quality Checks */}
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
              Section 1: Quality Checks
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { field: "installation_quality", label: "Installation Quality" },
                { field: "safety_compliance", label: "Safety Compliance" },
                { field: "document_verification", label: "Document Verification" },
                { field: "performance_testing", label: "Performance Testing" },
              ].map((item) => (
                <Grid item xs={12} sm={6} key={item.field}>
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
                    {["Pass", "Fail"].map((val) => (
                      <FormControlLabel
                        key={val}
                        value={val}
                        control={
                          <Radio
                            size="small"
                            sx={{
                              color: COLORS.border,
                              "&.Mui-checked": {
                                color: val === "Pass" ? COLORS.success : COLORS.error,
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

            {/* Section 2: Inspector Details */}
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
              <PersonSearchIcon sx={{ color: COLORS.secondary, fontSize: 20 }} />
              Section 2: Inspector Details
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Inspector Name"
                  value={formData.inspector_name}
                  onChange={(e) => handleInputChange("inspector_name", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontFamily: "Inter, sans-serif" }}>Inspector Type</InputLabel>
                  <Select
                    value={formData.inspector_type}
                    label="Inspector Type"
                    onChange={(e) => handleInputChange("inspector_type", e.target.value)}
                    sx={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <MenuItem value="Internal">Internal</MenuItem>
                    <MenuItem value="Government">Government</MenuItem>
                    <MenuItem value="Third Party">Third Party</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Inspection Date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.inspection_date}
                  onChange={(e) => handleInputChange("inspection_date", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontFamily: "Inter, sans-serif" }}>Inspection Status</InputLabel>
                  <Select
                    value={formData.inspection_status}
                    label="Inspection Status"
                    onChange={(e) => handleInputChange("inspection_status", e.target.value)}
                    sx={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <MenuItem value="Approved">Approved</MenuItem>
                    <MenuItem value="Rejected">Rejected</MenuItem>
                    <MenuItem value="Re-inspection Required">Re-inspection Required</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Approval Certificate Number"
                  value={formData.certificate_number}
                  onChange={(e) => handleInputChange("certificate_number", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  label="Corrections Needed"
                  placeholder="Items that require adjustment or compliance rectifications..."
                  value={formData.corrections_needed}
                  onChange={(e) => handleInputChange("corrections_needed", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  label="Remarks"
                  placeholder="Overall quality evaluation, clearance remarks..."
                  value={formData.remarks}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
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
            form="final-inspection-form"
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
            {saving ? "Saving..." : "Save Inspection"}
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
