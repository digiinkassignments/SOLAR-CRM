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
import ChecklistIcon from "@mui/icons-material/Checklist";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import HomeRepairServiceIcon from "@mui/icons-material/HomeRepairService";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

// Design Palette
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

// Custom lightweight hook for snackbar alerts
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

// Initial form state definition
const initialFormData = {
  roof_condition: "Good",
  roof_type: "RCC Flat",
  roof_area_sqft: "",
  roof_age_years: "",
  structural_concerns: "",
  existing_load_kw: "",
  meter_type: "Single Phase",
  main_panel_capacity: "",
  earthing_available: "Yes",
  electrical_issues: "",
  shading_issues: "None",
  shading_source: "",
  water_availability: "Yes",
  site_access: "Easy",
  additional_challenges: "",
  overall_status: "Approved",
  inspector_name: "",
  inspection_date: new Date().toISOString().split("T")[0],
  remarks: "",
};

export default function PreInstallInspection({ project, projectId }) {
  const targetProjectId = projectId || project?.id;

  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  // Axios helper with Auth header and baseURL fallback
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

  // Fetch Inspection Data
  const fetchInspection = useCallback(async () => {
    if (!targetProjectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(getApiUrl(`/projects/${targetProjectId}/inspection`), {
        headers: getAuthHeader(),
      });

      const raw = res.data;
      const data = raw?.inspection !== undefined ? raw.inspection : (raw?.data !== undefined ? raw.data : raw);
      if (data && (data.id || data.project_id)) {
        setInspection(data);
      } else {
        setInspection(null);
      }
    } catch (err) {
      // 404 means no inspection recorded yet
      if (err.response?.status !== 404) {
        showSnackbar(
          err.response?.data?.message || "Failed to load pre-installation inspection data.",
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

  // Handle open dialog for Begin or Edit
  const handleOpenDialog = () => {
    if (inspection) {
      setFormData({
        roof_condition: inspection.roof_condition || "Good",
        roof_type: inspection.roof_type || "RCC Flat",
        roof_area_sqft: inspection.roof_area_sqft ?? "",
        roof_age_years: inspection.roof_age_years ?? "",
        structural_concerns: inspection.structural_concerns || "",
        existing_load_kw: inspection.existing_load_kw ?? "",
        meter_type: inspection.meter_type || "Single Phase",
        main_panel_capacity: inspection.main_panel_capacity ?? "",
        earthing_available: inspection.earthing_available || "Yes",
        electrical_issues: inspection.electrical_issues || "",
        shading_issues: inspection.shading_issues || "None",
        shading_source: inspection.shading_source || "",
        water_availability: inspection.water_availability || "Yes",
        site_access: inspection.site_access || "Easy",
        additional_challenges: inspection.additional_challenges || "",
        overall_status: inspection.overall_status || "Approved",
        inspector_name: inspection.inspector_name || "",
        inspection_date: inspection.inspection_date
          ? String(inspection.inspection_date).split("T")[0]
          : new Date().toISOString().split("T")[0],
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

  // Submit Inspection Form (Create or Update)
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!targetProjectId) {
      showSnackbar("Missing Project ID. Cannot save inspection.", "error");
      return;
    }

    try {
      setSaving(true);
      const url = getApiUrl(`/projects/${targetProjectId}/inspection`);
      const payload = {
        ...formData,
        roof_area_sqft: formData.roof_area_sqft === "" ? null : Number(formData.roof_area_sqft),
        roof_age_years: formData.roof_age_years === "" ? null : Number(formData.roof_age_years),
        existing_load_kw: formData.existing_load_kw === "" ? null : Number(formData.existing_load_kw),
        main_panel_capacity: formData.main_panel_capacity === "" ? null : Number(formData.main_panel_capacity),
      };

      let res;
      if (inspection && inspection.id) {
        // PUT update
        res = await axios.put(url, payload, { headers: getAuthHeader() });
      } else {
        // POST create
        res = await axios.post(url, payload, { headers: getAuthHeader() });
      }

      const raw = res.data;
      const savedData = raw?.inspection !== undefined ? raw.inspection : (raw?.data !== undefined ? raw.data : raw);
      setInspection(savedData || payload);
      showSnackbar("Pre-Installation Inspection saved successfully!", "success");
      setDialogOpen(false);
      fetchInspection();

    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Failed to save pre-installation inspection.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // Helper for Status Chip styling
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
      case "Conditional Approval":
        return {
          label: "Conditional Approval",
          sx: {
            backgroundColor: "#FFFBEB",
            color: COLORS.secondary,
            border: `1px solid ${COLORS.secondary}`,
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

  // Render detail row item
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
      {/* Loading Indicator */}
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
            Loading inspection details...
          </Typography>
        </Box>
      ) : !inspection ? (
        /* Empty State: Inspection Not Done Yet */
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
              backgroundColor: "#F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
              color: COLORS.primary,
            }}
          >
            <ChecklistIcon sx={{ fontSize: 34 }} />
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
            No Pre-Installation Inspection Yet
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
            Evaluate roof feasibility, electrical loads, and site conditions before beginning
            solar system installation.
          </Typography>
          <Button
            variant="contained"
            startIcon={<ChecklistIcon />}
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
            Begin Pre-Installation Inspection
          </Button>
        </Card>
      ) : (
        /* Filled State: Read-Only Cards with Edit Action */
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
              <AssignmentTurnedInIcon sx={{ color: COLORS.primary, fontSize: 28 }} />
              <Box>
                <Typography
                  sx={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Pre-Installation Inspection Record
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    color: COLORS.textSecondary,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Inspected by <strong>{inspection.inspector_name || "N/A"}</strong> on{" "}
                  {inspection.inspection_date
                    ? String(inspection.inspection_date).split("T")[0]
                    : "N/A"}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Chip {...getStatusChipProps(inspection.overall_status)} />
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

          {/* Inspection Details Grid */}
          <Grid container spacing={2.5}>
            {/* Section 1: Roof Assessment */}
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
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2 }}>
                    <HomeRepairServiceIcon sx={{ color: COLORS.secondary, fontSize: 22 }} />
                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: COLORS.textPrimary,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Roof Assessment
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      {renderDetailItem("Roof Condition", inspection.roof_condition)}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem("Roof Type", inspection.roof_type)}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem(
                        "Roof Area Available",
                        inspection.roof_area_sqft ? `${inspection.roof_area_sqft} sqft` : null
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem(
                        "Roof Age",
                        inspection.roof_age_years ? `${inspection.roof_age_years} years` : null
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      {renderDetailItem("Structural Concerns", inspection.structural_concerns)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section 2: Electrical Assessment */}
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
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2 }}>
                    <ElectricBoltIcon sx={{ color: COLORS.warning, fontSize: 22 }} />
                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: COLORS.textPrimary,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Electrical Assessment
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      {renderDetailItem(
                        "Existing Load",
                        inspection.existing_load_kw ? `${inspection.existing_load_kw} kW` : null
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem("Meter Type", inspection.meter_type)}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem(
                        "Main Panel Capacity",
                        inspection.main_panel_capacity
                          ? `${inspection.main_panel_capacity} Amps`
                          : null
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem("Earthing Available", inspection.earthing_available)}
                    </Grid>
                    <Grid item xs={12}>
                      {renderDetailItem("Electrical Issues", inspection.electrical_issues)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section 3: Site Conditions */}
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
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2 }}>
                    <WbSunnyIcon sx={{ color: COLORS.secondary, fontSize: 22 }} />
                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: COLORS.textPrimary,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Site Conditions
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      {renderDetailItem("Shading Issues", inspection.shading_issues)}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem("Shading Source", inspection.shading_source)}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem("Water Availability", inspection.water_availability)}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem("Site Access", inspection.site_access)}
                    </Grid>
                    <Grid item xs={12}>
                      {renderDetailItem("Additional Challenges", inspection.additional_challenges)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section 4: Inspection Decision */}
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
                <CardContent sx={{ p: 2.5 }}>
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
                      Inspection Decision
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
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
                          Overall Status
                        </Typography>
                        <Chip {...getStatusChipProps(inspection.overall_status)} />
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem("Inspector Name", inspection.inspector_name)}
                    </Grid>
                    <Grid item xs={12}>
                      {renderDetailItem(
                        "Inspection Date",
                        inspection.inspection_date
                          ? String(inspection.inspection_date).split("T")[0]
                          : null
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      {renderDetailItem("Remarks", inspection.remarks)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* INSPECTION FORM MODAL DIALOG */}
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
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            sx={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: COLORS.textPrimary,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Pre-Installation Inspection
          </Typography>
          {inspection && (
            <Chip size="small" {...getStatusChipProps(formData.overall_status)} />
          )}
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box component="form" id="inspection-form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {/* Section 1: Roof Assessment */}
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
              <HomeRepairServiceIcon sx={{ color: COLORS.secondary, fontSize: 20 }} />
              Section 1: Roof Assessment
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {/* Roof Condition */}
              <Grid item xs={12} sm={6}>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: COLORS.textSecondary,
                    fontFamily: "Inter, sans-serif",
                    mb: 0.5,
                  }}
                >
                  Roof Condition
                </Typography>
                <RadioGroup
                  row
                  value={formData.roof_condition}
                  onChange={(e) => handleInputChange("roof_condition", e.target.value)}
                >
                  {["Good", "Fair", "Poor"].map((option) => (
                    <FormControlLabel
                      key={option}
                      value={option}
                      control={
                        <Radio
                          size="small"
                          sx={{
                            color: COLORS.border,
                            "&.Mui-checked": { color: COLORS.primary },
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
                          {option}
                        </Typography>
                      }
                    />
                  ))}
                </RadioGroup>
              </Grid>

              {/* Roof Type */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontFamily: "Inter, sans-serif" }}>Roof Type</InputLabel>
                  <Select
                    value={formData.roof_type}
                    label="Roof Type"
                    onChange={(e) => handleInputChange("roof_type", e.target.value)}
                    sx={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <MenuItem value="RCC Flat">RCC Flat</MenuItem>
                    <MenuItem value="Sloped Tin">Sloped Tin</MenuItem>
                    <MenuItem value="Sloped Tile">Sloped Tile</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Roof Area Available */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Roof Area Available (sqft)"
                  type="number"
                  inputProps={{ min: 0, step: "any" }}
                  value={formData.roof_area_sqft}
                  onChange={(e) => handleInputChange("roof_area_sqft", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              {/* Roof Age */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Roof Age (years)"
                  type="number"
                  inputProps={{ min: 0, step: "any" }}
                  value={formData.roof_age_years}
                  onChange={(e) => handleInputChange("roof_age_years", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              {/* Structural Concerns */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  label="Structural Concerns"
                  placeholder="Notes on cracks, water-proofing, load-bearing ability..."
                  value={formData.structural_concerns}
                  onChange={(e) => handleInputChange("structural_concerns", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2.5, borderColor: COLORS.border }} />

            {/* Section 2: Electrical Assessment */}
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
              <ElectricBoltIcon sx={{ color: COLORS.warning, fontSize: 20 }} />
              Section 2: Electrical Assessment
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {/* Existing Load */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Existing Load (kW)"
                  type="number"
                  inputProps={{ min: 0, step: "any" }}
                  value={formData.existing_load_kw}
                  onChange={(e) => handleInputChange("existing_load_kw", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              {/* Meter Type */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontFamily: "Inter, sans-serif" }}>Meter Type</InputLabel>
                  <Select
                    value={formData.meter_type}
                    label="Meter Type"
                    onChange={(e) => handleInputChange("meter_type", e.target.value)}
                    sx={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <MenuItem value="Single Phase">Single Phase</MenuItem>
                    <MenuItem value="Three Phase">Three Phase</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Main Panel Capacity */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Main Panel Capacity (Amps)"
                  type="number"
                  inputProps={{ min: 0, step: "any" }}
                  value={formData.main_panel_capacity}
                  onChange={(e) => handleInputChange("main_panel_capacity", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              {/* Earthing Available */}
              <Grid item xs={12} sm={6}>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: COLORS.textSecondary,
                    fontFamily: "Inter, sans-serif",
                    mb: 0.5,
                  }}
                >
                  Earthing Available
                </Typography>
                <RadioGroup
                  row
                  value={formData.earthing_available}
                  onChange={(e) => handleInputChange("earthing_available", e.target.value)}
                >
                  {["Yes", "No"].map((option) => (
                    <FormControlLabel
                      key={option}
                      value={option}
                      control={
                        <Radio
                          size="small"
                          sx={{
                            color: COLORS.border,
                            "&.Mui-checked": { color: COLORS.primary },
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
                          {option}
                        </Typography>
                      }
                    />
                  ))}
                </RadioGroup>
              </Grid>

              {/* Electrical Issues */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  label="Electrical Issues"
                  placeholder="Notes on wiring quality, voltage fluctuations, transformer distance..."
                  value={formData.electrical_issues}
                  onChange={(e) => handleInputChange("electrical_issues", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2.5, borderColor: COLORS.border }} />

            {/* Section 3: Site Conditions */}
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
              <WbSunnyIcon sx={{ color: COLORS.secondary, fontSize: 20 }} />
              Section 3: Site Conditions
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {/* Shading Issues */}
              <Grid item xs={12} sm={6}>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: COLORS.textSecondary,
                    fontFamily: "Inter, sans-serif",
                    mb: 0.5,
                  }}
                >
                  Shading Issues
                </Typography>
                <RadioGroup
                  row
                  value={formData.shading_issues}
                  onChange={(e) => handleInputChange("shading_issues", e.target.value)}
                >
                  {["None", "Partial", "Severe"].map((option) => (
                    <FormControlLabel
                      key={option}
                      value={option}
                      control={
                        <Radio
                          size="small"
                          sx={{
                            color: COLORS.border,
                            "&.Mui-checked": { color: COLORS.primary },
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
                          {option}
                        </Typography>
                      }
                    />
                  ))}
                </RadioGroup>
              </Grid>

              {/* Shading Source */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Shading Source"
                  placeholder="Trees, nearby building, parapet wall, water tank..."
                  value={formData.shading_source}
                  onChange={(e) => handleInputChange("shading_source", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              {/* Water Availability */}
              <Grid item xs={12} sm={6}>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: COLORS.textSecondary,
                    fontFamily: "Inter, sans-serif",
                    mb: 0.5,
                  }}
                >
                  Water Availability
                </Typography>
                <RadioGroup
                  row
                  value={formData.water_availability}
                  onChange={(e) => handleInputChange("water_availability", e.target.value)}
                >
                  {["Yes", "No"].map((option) => (
                    <FormControlLabel
                      key={option}
                      value={option}
                      control={
                        <Radio
                          size="small"
                          sx={{
                            color: COLORS.border,
                            "&.Mui-checked": { color: COLORS.primary },
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
                          {option}
                        </Typography>
                      }
                    />
                  ))}
                </RadioGroup>
              </Grid>

              {/* Site Access */}
              <Grid item xs={12} sm={6}>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: COLORS.textSecondary,
                    fontFamily: "Inter, sans-serif",
                    mb: 0.5,
                  }}
                >
                  Site Access
                </Typography>
                <RadioGroup
                  row
                  value={formData.site_access}
                  onChange={(e) => handleInputChange("site_access", e.target.value)}
                >
                  {["Easy", "Moderate", "Difficult"].map((option) => (
                    <FormControlLabel
                      key={option}
                      value={option}
                      control={
                        <Radio
                          size="small"
                          sx={{
                            color: COLORS.border,
                            "&.Mui-checked": { color: COLORS.primary },
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
                          {option}
                        </Typography>
                      }
                    />
                  ))}
                </RadioGroup>
              </Grid>

              {/* Additional Challenges */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  label="Additional Challenges"
                  placeholder="Narrow staircase, high wind zone, animal nuisance..."
                  value={formData.additional_challenges}
                  onChange={(e) => handleInputChange("additional_challenges", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2.5, borderColor: COLORS.border }} />

            {/* Section 4: Inspection Decision */}
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
              Section 4: Inspection Decision
            </Typography>

            <Grid container spacing={2}>
              {/* Overall Status */}
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontFamily: "Inter, sans-serif" }}>Overall Status</InputLabel>
                  <Select
                    value={formData.overall_status}
                    label="Overall Status"
                    onChange={(e) => handleInputChange("overall_status", e.target.value)}
                    sx={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <MenuItem value="Approved">Approved</MenuItem>
                    <MenuItem value="Conditional Approval">Conditional Approval</MenuItem>
                    <MenuItem value="Rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Inspector Name */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Inspector Name"
                  value={formData.inspector_name}
                  onChange={(e) => handleInputChange("inspector_name", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              {/* Inspection Date */}
              <Grid item xs={12} sm={4}>
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

              {/* Remarks */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  label="Remarks"
                  placeholder="Key recommendations, observations, condition clauses..."
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
            form="inspection-form"
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

      {/* Toast Notification Snackbar */}
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
