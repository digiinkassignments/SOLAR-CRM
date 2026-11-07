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
  IconButton,
  Tooltip,
  Alert,
  FormHelperText,
  InputAdornment,
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
import MyLocationIcon from "@mui/icons-material/MyLocation";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PersonIcon from "@mui/icons-material/Person";
import SignatureCapture from "../../../../components/SignatureCapture";

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
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
};

// Date Formatter: "04 Nov 2026"
const formatCleanDate = (dateVal) => {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
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

export default function PreInstallInspection({ project, projectId }) {
  const targetProjectId = projectId || project?.id;
  const systemKw = Number(project?.system_capacity_kw || 0);

  // Smart recommended meter type based on DISCOM limits (>5 kW requires Three Phase)
  const recommendedMeter = systemKw > 5.0 ? "Three Phase" : "Single Phase";

  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fetchingGps, setFetchingGps] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Section 1: Roof Assessment
    roof_condition: "Good",
    roof_type: "RCC Flat",
    roof_orientation: "South",
    roof_tilt_angle: "",
    roof_area_sqft: "",
    shadow_free_area_sqft: "",
    roof_age_years: "",
    structural_concerns: "",

    // Section 2: Electrical & DISCOM Grid Assessment
    existing_load_kw: "",
    sanctioned_load_kw: "",
    consumer_number: "",
    meter_type: recommendedMeter,
    main_panel_capacity: "",
    earthing_available: "Yes",
    electrical_issues: "",

    // Section 3: Site Conditions & Geolocation
    shading_issues: "None",
    shading_source: "",
    water_availability: "Yes",
    site_access: "Easy",
    gps_coordinates: "",
    additional_challenges: "",
    site_photos: "",

    // Section 4: Inspection Decision & Sign-Off
    overall_status: "Pending", // Default is strictly Pending
    inspector_name: "",
    inspection_date: new Date().toISOString().split("T")[0],
    remarks: "",
    customer_signature_name: "",
    signature_date: "",
    signature_data: "",
  });

  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  // Axios helper with Auth header
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

  // Handle open dialog
  const handleOpenDialog = () => {
    if (inspection) {
      setFormData({
        roof_condition: inspection.roof_condition || "Good",
        roof_type: inspection.roof_type || "RCC Flat",
        roof_orientation: inspection.roof_orientation || "South",
        roof_tilt_angle: inspection.roof_tilt_angle ?? "",
        roof_area_sqft: inspection.roof_area_sqft ?? "",
        shadow_free_area_sqft: inspection.shadow_free_area_sqft ?? "",
        roof_age_years: inspection.roof_age_years ?? "",
        structural_concerns: inspection.structural_concerns || "",

        existing_load_kw: inspection.existing_load_kw ?? "",
        sanctioned_load_kw: inspection.sanctioned_load_kw ?? "",
        consumer_number: inspection.consumer_number || "",
        meter_type: inspection.meter_type || recommendedMeter,
        main_panel_capacity: inspection.main_panel_capacity ?? "",
        earthing_available: inspection.earthing_available === "No" || inspection.earthing_available === 0 ? "No" : "Yes",
        electrical_issues: inspection.electrical_issues || "",

        shading_issues: inspection.shading_issues || "None",
        shading_source: inspection.shading_source || "",
        water_availability: inspection.water_availability === "No" || inspection.water_availability === 0 ? "No" : "Yes",
        site_access: inspection.site_access || "Easy",
        gps_coordinates: inspection.gps_coordinates || "",
        additional_challenges: inspection.additional_challenges || "",
        site_photos: inspection.site_photos || "",

        overall_status: inspection.overall_status || "Pending",
        inspector_name: inspection.inspector_name || "",
        inspection_date: inspection.inspection_date
          ? String(inspection.inspection_date).split("T")[0]
          : new Date().toISOString().split("T")[0],
        remarks: inspection.remarks || "",
        customer_signature_name: inspection.customer_signature_name || "",
        signature_date: inspection.signature_date
          ? String(inspection.signature_date).split("T")[0]
          : "",
        signature_data: inspection.signature_data || "",
      });
    } else {
      setFormData({
        roof_condition: "Good",
        roof_type: "RCC Flat",
        roof_orientation: "South",
        roof_tilt_angle: "",
        roof_area_sqft: "",
        shadow_free_area_sqft: "",
        roof_age_years: "",
        structural_concerns: "",

        existing_load_kw: "",
        sanctioned_load_kw: "",
        consumer_number: "",
        meter_type: recommendedMeter,
        main_panel_capacity: "",
        earthing_available: "Yes",
        electrical_issues: "",

        shading_issues: "None",
        shading_source: "",
        water_availability: "Yes",
        site_access: "Easy",
        gps_coordinates: "",
        additional_challenges: "",
        site_photos: "",

        overall_status: "Pending", // Strictly Pending
        inspector_name: "",
        inspection_date: new Date().toISOString().split("T")[0],
        remarks: "",
        customer_signature_name: "",
        signature_date: "",
        signature_data: "",
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

  // Quick GPS capture
  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      showSnackbar("Geolocation is not supported by your browser.", "error");
      return;
    }
    setFetchingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        handleInputChange("gps_coordinates", coords);
        setFetchingGps(false);
        showSnackbar(`Location captured: ${coords}`, "success");
      },
      (err) => {
        setFetchingGps(false);
        showSnackbar(`Unable to fetch location: ${err.message}`, "warning");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Submit Inspection Form
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!targetProjectId) {
      showSnackbar("Missing Project ID. Cannot save inspection.", "error");
      return;
    }

    // Required Field Validations
    if (!formData.roof_area_sqft) {
      showSnackbar("Please enter Roof Area Available (sqft).", "error");
      return;
    }
    if (!formData.meter_type) {
      showSnackbar("Please select Meter Type.", "error");
      return;
    }
    if (!formData.inspector_name || !formData.inspector_name.trim()) {
      showSnackbar("Please enter Inspector Name.", "error");
      return;
    }
    if (!formData.overall_status) {
      showSnackbar("Please select Overall Status.", "error");
      return;
    }

    try {
      setSaving(true);
      const url = getApiUrl(`/projects/${targetProjectId}/inspection`);
      const payload = {
        ...formData,
        roof_area_sqft: formData.roof_area_sqft === "" ? null : Number(formData.roof_area_sqft),
        shadow_free_area_sqft: formData.shadow_free_area_sqft === "" ? null : Number(formData.shadow_free_area_sqft),
        roof_tilt_angle: formData.roof_tilt_angle === "" ? null : Number(formData.roof_tilt_angle),
        roof_age_years: formData.roof_age_years === "" ? null : Number(formData.roof_age_years),
        existing_load_kw: formData.existing_load_kw === "" ? null : Number(formData.existing_load_kw),
        sanctioned_load_kw: formData.sanctioned_load_kw === "" ? null : Number(formData.sanctioned_load_kw),
        main_panel_capacity: formData.main_panel_capacity === "" ? null : Number(formData.main_panel_capacity),
        shading_source: formData.shading_issues === "None" ? "" : formData.shading_source,
      };

      if (inspection && inspection.id) {
        await axios.put(url, payload, { headers: getAuthHeader() });
      } else {
        await axios.post(url, payload, { headers: getAuthHeader() });
      }

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
            color: "#059669",
            border: "1px solid #A7F3D0",
            fontWeight: 800,
            fontSize: "0.8rem",
          },
        };
      case "Conditional Approval":
        return {
          label: "Conditional Approval",
          sx: {
            backgroundColor: "#FFFBEB",
            color: "#D97706",
            border: "1px solid #FDE68A",
            fontWeight: 800,
            fontSize: "0.8rem",
          },
        };
      case "Rejected":
        return {
          label: "Rejected",
          sx: {
            backgroundColor: "#FEF2F2",
            color: "#DC2626",
            border: "1px solid #FECACA",
            fontWeight: 800,
            fontSize: "0.8rem",
          },
        };
      case "Pending":
      default:
        return {
          label: status || "Pending",
          sx: {
            backgroundColor: "#F1F5F9",
            color: "#475569",
            border: "1px solid #CBD5E1",
            fontWeight: 800,
            fontSize: "0.8rem",
          },
        };
    }
  };

  // Render detail row item
  const renderDetailItem = (label, value) => (
    <Box sx={{ mb: 1.5 }}>
      <Typography
        sx={{
          fontSize: "0.72rem",
          fontWeight: 700,
          color: COLORS.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.03em",
          mb: 0.25,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.88rem",
          fontWeight: 600,
          color: COLORS.textPrimary,
        }}
      >
        {value !== null && value !== undefined && value !== "" ? String(value) : "—"}
      </Typography>
    </Box>
  );

  return (
    <Box>
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
          <Typography sx={{ fontSize: "0.86rem", fontWeight: 500, color: COLORS.textSecondary }}>
            Loading inspection feasibility data...
          </Typography>
        </Box>
      ) : !inspection ? (
        /* Empty State */
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
              color: "#2563EB",
            }}
          >
            <ChecklistIcon sx={{ fontSize: 34 }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: COLORS.textPrimary,
              mb: 1,
            }}
          >
            No Pre-Installation Inspection Yet
          </Typography>
          <Typography
            sx={{
              fontSize: "0.88rem",
              color: COLORS.textSecondary,
              maxWidth: 520,
              mb: 3,
            }}
          >
            Verify roof tilt & orientation, shadow-free area, DISCOM sanctioned load, and grid meter
            phase compatibility before purchasing materials and commencing installation.
          </Typography>
          <Button
            variant="contained"
            startIcon={<ChecklistIcon />}
            onClick={handleOpenDialog}
            sx={{
              backgroundColor: COLORS.primary,
              color: "#FFFFFF",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.88rem",
              px: 3,
              py: 1.1,
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
        /* Filled State: Read-Only Cards with Clean 04 Nov 2026 Dates */
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
              <AssignmentTurnedInIcon sx={{ color: "#2563EB", fontSize: 28 }} />
              <Box>
                <Typography
                  sx={{
                    fontSize: "1rem",
                    fontWeight: 800,
                    color: COLORS.textPrimary,
                  }}
                >
                  Pre-Installation Technical Feasibility Record
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}>
                  Inspected by <strong>{inspection.inspector_name || "N/A"}</strong> on{" "}
                  <strong>{formatCleanDate(inspection.inspection_date)}</strong>
                  {inspection.gps_coordinates && ` • GPS: ${inspection.gps_coordinates}`}
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
                  fontWeight: 700,
                  borderRadius: "8px",
                  "&:hover": {
                    borderColor: COLORS.primary,
                    backgroundColor: COLORS.bg,
                  },
                }}
              >
                Edit Inspection
              </Button>
            </Box>
          </Box>

          {/* Inspection Details 4-Card Grid */}
          <Grid container spacing={2.5}>
            {/* Section 1: Roof Assessment */}
            <Grid size={{ xs: 12, md: 6 }}>
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.8 }}>
                    <HomeRepairServiceIcon sx={{ color: COLORS.secondary, fontSize: 22 }} />
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: COLORS.textPrimary }}>
                      Section 1: Roof & Solar Geometry
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={1.5}>
                    <Grid size={6}>
                      {renderDetailItem("Roof Condition", inspection.roof_condition)}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem("Roof Type", inspection.roof_type)}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem("Roof Orientation", inspection.roof_orientation || "South")}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem(
                        "Tilt Angle",
                        inspection.roof_tilt_angle ? `${inspection.roof_tilt_angle}°` : null
                      )}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem(
                        "Total Roof Area",
                        inspection.roof_area_sqft ? `${inspection.roof_area_sqft} sqft` : null
                      )}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem(
                        "Shadow-Free Usable Area",
                        inspection.shadow_free_area_sqft
                          ? `${inspection.shadow_free_area_sqft} sqft`
                          : null
                      )}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem(
                        "Roof Age",
                        inspection.roof_age_years ? `${inspection.roof_age_years} years` : null
                      )}
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      {renderDetailItem("Structural Concerns", inspection.structural_concerns)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section 2: Electrical & DISCOM Grid Assessment */}
            <Grid size={{ xs: 12, md: 6 }}>
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.8 }}>
                    <ElectricBoltIcon sx={{ color: COLORS.warning, fontSize: 22 }} />
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: COLORS.textPrimary }}>
                      Section 2: Electrical & DISCOM Grid Connection
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={1.5}>
                    <Grid size={6}>
                      {renderDetailItem(
                        "Meter Type (Phase)",
                        inspection.meter_type
                      )}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem(
                        "Sanctioned Load",
                        inspection.sanctioned_load_kw
                          ? `${inspection.sanctioned_load_kw} kW`
                          : null
                      )}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem(
                        "DISCOM Consumer / CA No",
                        inspection.consumer_number
                      )}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem(
                        "Existing Running Load",
                        inspection.existing_load_kw ? `${inspection.existing_load_kw} kW` : null
                      )}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem(
                        "Main Panel Capacity",
                        inspection.main_panel_capacity
                          ? `${inspection.main_panel_capacity} Amps`
                          : null
                      )}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem("Earthing Available", inspection.earthing_available)}
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      {renderDetailItem("Electrical Observations", inspection.electrical_issues)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section 3: Site Conditions & Geolocation */}
            <Grid size={{ xs: 12, md: 6 }}>
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.8 }}>
                    <WbSunnyIcon sx={{ color: COLORS.secondary, fontSize: 22 }} />
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: COLORS.textPrimary }}>
                      Section 3: Site Conditions & Geolocation
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={1.5}>
                    <Grid size={6}>
                      {renderDetailItem("Shading Issues", inspection.shading_issues)}
                    </Grid>
                    {inspection.shading_issues !== "None" && inspection.shading_source && (
                      <Grid size={6}>
                        {renderDetailItem("Shading Source", inspection.shading_source)}
                      </Grid>
                    )}
                    <Grid size={6}>
                      {renderDetailItem("Water Availability", inspection.water_availability)}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem("Site Access", inspection.site_access)}
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      {renderDetailItem("GPS Coordinates", inspection.gps_coordinates)}
                    </Grid>
                    {inspection.site_photos && (
                      <Grid size={{ xs: 12 }}>
                        {renderDetailItem("Site Photos / Notes", inspection.site_photos)}
                      </Grid>
                    )}
                    <Grid size={12}>
                      {renderDetailItem("Additional Challenges", inspection.additional_challenges)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section 4: Feasibility Decision & Sign-off */}
            <Grid size={{ xs: 12, md: 6 }}>
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.8 }}>
                    <AssignmentTurnedInIcon sx={{ color: COLORS.success, fontSize: 22 }} />
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: COLORS.textPrimary }}>
                      Section 4: Inspection Decision & Sign-Off
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={1.5}>
                    <Grid size={6}>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography
                          sx={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            color: COLORS.textMuted,
                            textTransform: "uppercase",
                            letterSpacing: "0.03em",
                            mb: 0.5,
                          }}
                        >
                          Overall Feasibility Status
                        </Typography>
                        <Chip {...getStatusChipProps(inspection.overall_status)} />
                      </Box>
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem("Lead Inspector Name", inspection.inspector_name)}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem(
                        "Inspection Date",
                        formatCleanDate(inspection.inspection_date)
                      )}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem("Customer / Rep Sign-Off", inspection.customer_signature_name)}
                    </Grid>
                    {inspection.signature_date && (
                      <Grid size={6}>
                        {renderDetailItem(
                          "Sign-Off Date",
                          formatCleanDate(inspection.signature_date)
                        )}
                      </Grid>
                    )}
                    {inspection.signature_data && (
                      <Grid size={12}>
                        <Box sx={{ p: 1.5, borderRadius: "8px", border: "1px solid #10B981", backgroundColor: "#F0FDF4", mt: 1 }}>
                          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#166534" }}>
                              Customer / Representative Digital Signature
                            </Typography>
                            <Chip size="small" label="✓ Signature Verified" sx={{ height: 20, fontSize: "0.68rem", fontWeight: 800, color: "#16A34A", backgroundColor: "#DCFCE7", border: "1px solid #86EFAC" }} />
                          </Stack>
                          <Box sx={{ display: "flex", justifyContent: "center", backgroundColor: "#FFFFFF", borderRadius: "6px", p: 1, border: "1px dashed #CBD5E1" }}>
                            <Box component="img" src={inspection.signature_data} alt="Verified Signature" sx={{ maxHeight: 70, maxWidth: "100%", objectFit: "contain" }} />
                          </Box>
                        </Box>
                      </Grid>
                    )}
                    <Grid size={12}>
                      {renderDetailItem("Technical Remarks & Conditions", inspection.remarks)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ============================================================== */}
      {/* INSPECTION FORM MODAL DIALOG (SPACIOUS, NO OVERLAPPING)       */}
      {/* ============================================================== */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            backgroundColor: COLORS.cardBg,
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
          <Box>
            <Typography sx={{ fontSize: "1.15rem", fontWeight: 900, color: COLORS.textPrimary }}>
              Pre-Installation Technical Site Inspection
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, mt: 0.2 }}>
              Project: {project?.project_number} • System: {project?.system_capacity_kw || "N/A"} kW
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleCloseDialog} disabled={saving}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box component="form" id="inspection-form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            
            {/* CAPACITY / PHASE CONFLICT ADVISORY BANNER */}
            {systemKw > 5.0 && formData.meter_type === "Single Phase" && (
              <Alert
                severity="warning"
                sx={{ mb: 3, borderRadius: "10px", fontSize: "0.82rem", fontWeight: 500 }}
              >
                <strong>Phase Notice:</strong> System capacity is <strong>{systemKw} kW</strong>. Most DISCOMs (e.g. JVVNL) limit Single Phase to 5 kW. A <strong>Three Phase</strong> meter is strongly recommended for feasibility approval.
              </Alert>
            )}

            {/* SECTION 1: ROOF ASSESSMENT */}
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: COLORS.primary,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  mb: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <HomeRepairServiceIcon sx={{ color: COLORS.secondary, fontSize: 18 }} />
                Section 1: Roof Assessment & Geometry
              </Typography>

              <Grid container spacing={2}>
                {/* Roof Condition */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
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
                        control={<Radio size="small" />}
                        label={<Typography sx={{ fontSize: "0.82rem" }}>{option}</Typography>}
                      />
                    ))}
                  </RadioGroup>
                </Grid>

                {/* Roof Type */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Roof Type</InputLabel>
                    <Select
                      value={formData.roof_type}
                      label="Roof Type"
                      onChange={(e) => handleInputChange("roof_type", e.target.value)}
                    >
                      <MenuItem value="RCC Flat">RCC Flat (Concrete)</MenuItem>
                      <MenuItem value="Sloped Tin">Sloped Tin / Metal Sheet</MenuItem>
                      <MenuItem value="Sloped Tile">Sloped Tile</MenuItem>
                      <MenuItem value="Elevated Super-Structure">Elevated Super-Structure</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Roof Orientation */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Roof Orientation</InputLabel>
                    <Select
                      value={formData.roof_orientation}
                      label="Roof Orientation"
                      onChange={(e) => handleInputChange("roof_orientation", e.target.value)}
                    >
                      <MenuItem value="South">South (Optimal for India)</MenuItem>
                      <MenuItem value="South-West">South-West</MenuItem>
                      <MenuItem value="South-East">South-East</MenuItem>
                      <MenuItem value="East">East</MenuItem>
                      <MenuItem value="West">West</MenuItem>
                      <MenuItem value="North">North (Not Recommended)</MenuItem>
                      <MenuItem value="Flat / Nil">Flat / Nil</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Roof Tilt Angle */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Tilt Angle (Degrees °)"
                    type="number"
                    placeholder="e.g. 15, 20 or 25"
                    inputProps={{ min: 0, max: 90, step: "any" }}
                    InputLabelProps={{ shrink: true }}
                    value={formData.roof_tilt_angle}
                    onChange={(e) => handleInputChange("roof_tilt_angle", e.target.value)}
                  />
                </Grid>

                {/* Roof Age */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Roof Age (years)"
                    type="number"
                    placeholder="e.g. 5"
                    inputProps={{ min: 0, step: "any" }}
                    InputLabelProps={{ shrink: true }}
                    value={formData.roof_age_years}
                    onChange={(e) => handleInputChange("roof_age_years", e.target.value)}
                  />
                </Grid>

                {/* Roof Area Available * MANDATORY */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    label="Total Roof Area (sqft) *"
                    type="number"
                    placeholder="e.g. 800"
                    inputProps={{ min: 0, step: "any" }}
                    InputLabelProps={{ shrink: true }}
                    value={formData.roof_area_sqft}
                    onChange={(e) => handleInputChange("roof_area_sqft", e.target.value)}
                    helperText="Total physical footprint of the rooftop"
                  />
                </Grid>

                {/* Shadow-Free Area */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Shadow-Free Usable Area (sqft)"
                    type="number"
                    placeholder="e.g. 600"
                    inputProps={{ min: 0, step: "any" }}
                    InputLabelProps={{ shrink: true }}
                    value={formData.shadow_free_area_sqft}
                    onChange={(e) => handleInputChange("shadow_free_area_sqft", e.target.value)}
                    helperText="Area receiving unobstructed sunlight (9am - 4pm)"
                  />
                </Grid>

                {/* Structural Concerns - TALL MULTI-LINE */}
                <Grid size={{ xs: 12 }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.6 }}>
                    Structural Concerns & Rooftop Observations
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Waterproofing status, crack formations, parapet height, structural load capacity observations..."
                    value={formData.structural_concerns}
                    onChange={(e) => handleInputChange("structural_concerns", e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        minHeight: "100px",
                        alignItems: "flex-start",
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2.5, borderColor: COLORS.border }} />

            {/* SECTION 2: ELECTRICAL ASSESSMENT */}
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: COLORS.primary,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  mb: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <ElectricBoltIcon sx={{ color: COLORS.warning, fontSize: 18 }} />
                Section 2: Electrical & DISCOM Grid Connection
              </Typography>

              <Grid container spacing={2}>
                {/* Meter Type * MANDATORY with Auto-Select Logic */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel>Meter Type (Grid Phase) *</InputLabel>
                    <Select
                      value={formData.meter_type}
                      label="Meter Type (Grid Phase) *"
                      onChange={(e) => handleInputChange("meter_type", e.target.value)}
                    >
                      <MenuItem value="Single Phase">Single Phase (Up to 5 kW)</MenuItem>
                      <MenuItem value="Three Phase">Three Phase (&gt; 5 kW DISCOM Requirement)</MenuItem>
                    </Select>
                    <FormHelperText>
                      {systemKw > 5
                        ? "Recommended: Three Phase (System capacity is > 5 kW)"
                        : "Recommended: Single Phase (System capacity ≤ 5 kW)"}
                    </FormHelperText>
                  </FormControl>
                </Grid>

                {/* Sanctioned Load */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="DISCOM Sanctioned Load (kW)"
                    type="number"
                    placeholder="e.g. 5"
                    inputProps={{ min: 0, step: "any" }}
                    value={formData.sanctioned_load_kw}
                    onChange={(e) => handleInputChange("sanctioned_load_kw", e.target.value)}
                    helperText="From customer's recent electricity bill"
                  />
                </Grid>

                {/* DISCOM Consumer / CA Number */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="DISCOM Consumer / CA / K Number"
                    placeholder="e.g. 210103489201"
                    value={formData.consumer_number}
                    onChange={(e) => handleInputChange("consumer_number", e.target.value)}
                    helperText="Required for DISCOM net metering & feasibility form"
                  />
                </Grid>

                {/* Existing Running Load */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Existing Running Load (kW)"
                    type="number"
                    placeholder="e.g. 3.5"
                    inputProps={{ min: 0, step: "any" }}
                    value={formData.existing_load_kw}
                    onChange={(e) => handleInputChange("existing_load_kw", e.target.value)}
                  />
                </Grid>

                {/* Main Panel Capacity */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Main Panel Capacity (Amps)"
                    type="number"
                    placeholder="e.g. 32 or 63"
                    inputProps={{ min: 0, step: "any" }}
                    value={formData.main_panel_capacity}
                    onChange={(e) => handleInputChange("main_panel_capacity", e.target.value)}
                  />
                </Grid>

                {/* Earthing Available */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                    Dedicated Earthing Available?
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
                        control={<Radio size="small" />}
                        label={<Typography sx={{ fontSize: "0.82rem" }}>{option}</Typography>}
                      />
                    ))}
                  </RadioGroup>
                </Grid>

                {/* Electrical Issues - TALL MULTI-LINE */}
                <Grid size={{ xs: 12 }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.6 }}>
                    Electrical Issues & Grid Notes
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Voltage fluctuation history, distance from LT transformer, wiring quality, cable route distance to inverter..."
                    value={formData.electrical_issues}
                    onChange={(e) => handleInputChange("electrical_issues", e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        minHeight: "100px",
                        alignItems: "flex-start",
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2.5, borderColor: COLORS.border }} />

            {/* SECTION 3: SITE CONDITIONS */}
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: COLORS.primary,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  mb: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <WbSunnyIcon sx={{ color: COLORS.secondary, fontSize: 18 }} />
                Section 3: Site Conditions & Geolocation
              </Typography>

              <Grid container spacing={2}>
                {/* Shading Issues */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                    Shading Obstacles
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
                        control={<Radio size="small" />}
                        label={<Typography sx={{ fontSize: "0.82rem" }}>{option}</Typography>}
                      />
                    ))}
                  </RadioGroup>
                </Grid>

                {/* Shading Source - ONLY SHOWN IF PARTIAL OR SEVERE */}
                {formData.shading_issues !== "None" && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Shading Source *"
                      placeholder="Nearby multi-story building, trees, water tank, dish antenna..."
                      value={formData.shading_source}
                      onChange={(e) => handleInputChange("shading_source", e.target.value)}
                      helperText="Specify object causing shadow"
                    />
                  </Grid>
                )}

                {/* Water Availability */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                    Rooftop Water Tap Available? (For Panel Cleaning)
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
                        control={<Radio size="small" />}
                        label={<Typography sx={{ fontSize: "0.82rem" }}>{option}</Typography>}
                      />
                    ))}
                  </RadioGroup>
                </Grid>

                {/* Site Access */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                    Rooftop Accessibility
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
                        control={<Radio size="small" />}
                        label={<Typography sx={{ fontSize: "0.82rem" }}>{option}</Typography>}
                      />
                    ))}
                  </RadioGroup>
                </Grid>

                {/* GPS Coordinates with Quick-Detect Button */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="GPS Coordinates (Lat, Long)"
                    placeholder="e.g. 26.912434, 75.787271"
                    value={formData.gps_coordinates}
                    onChange={(e) => handleInputChange("gps_coordinates", e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Capture current device GPS location">
                            <span>
                              <IconButton
                                size="small"
                                onClick={handleCaptureGps}
                                disabled={fetchingGps}
                                sx={{ color: "#2563EB" }}
                              >
                                {fetchingGps ? (
                                  <CircularProgress size={18} />
                                ) : (
                                  <MyLocationIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                    helperText="Click icon to auto-capture current GPS position"
                  />
                </Grid>

                {/* Site Photos / Cloud Link */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Site Photos / Drive Links"
                    placeholder="Google Drive link or photo notes"
                    value={formData.site_photos}
                    onChange={(e) => handleInputChange("site_photos", e.target.value)}
                    helperText="Paste cloud folder URL or photos summary"
                  />
                </Grid>

                {/* Additional Challenges - TALL MULTI-LINE */}
                <Grid size={{ xs: 12 }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.6 }}>
                    Additional Challenges & Logistics Notes
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Narrow staircase for lifting solar panels, crane required, high wind zone, animal nuisance..."
                    value={formData.additional_challenges}
                    onChange={(e) => handleInputChange("additional_challenges", e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        minHeight: "100px",
                        alignItems: "flex-start",
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2.5, borderColor: COLORS.border }} />

            {/* SECTION 4: INSPECTION DECISION & SIGN-OFF */}
            <Box>
              <Typography
                sx={{
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: COLORS.primary,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  mb: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <AssignmentTurnedInIcon sx={{ color: COLORS.success, fontSize: 18 }} />
                Section 4: Inspection Decision & Customer Sign-Off
              </Typography>

              <Grid container spacing={2}>
                {/* Overall Status * MANDATORY (DEFAULTS TO PENDING) */}
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel>Overall Feasibility Status *</InputLabel>
                    <Select
                      value={formData.overall_status}
                      label="Overall Feasibility Status *"
                      onChange={(e) => handleInputChange("overall_status", e.target.value)}
                    >
                      <MenuItem value="Pending">Pending (Inspection In-Progress)</MenuItem>
                      <MenuItem value="Approved">Approved (Site Feasible)</MenuItem>
                      <MenuItem value="Conditional Approval">Conditional Approval (Changes Needed)</MenuItem>
                      <MenuItem value="Rejected">Rejected (Unfeasible)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Inspector Name * MANDATORY */}
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    label="Inspector Name *"
                    placeholder="e.g. Er. Vikram Singh"
                    value={formData.inspector_name}
                    onChange={(e) => handleInputChange("inspector_name", e.target.value)}
                  />
                </Grid>

                {/* Inspection Date * MANDATORY */}
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.6 }}>
                    Inspection Date *
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    type="date"
                    value={formData.inspection_date}
                    onChange={(e) => handleInputChange("inspection_date", e.target.value)}
                  />
                </Grid>

                {/* Customer Sign-off Name */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.6 }}>
                    Customer / Representative Sign-Off
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Name of homeowner or site manager present"
                    value={formData.customer_signature_name}
                    onChange={(e) => handleInputChange("customer_signature_name", e.target.value)}
                  />
                </Grid>

                {/* Sign-off Date */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.6 }}>
                    Sign-Off Date
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={formData.signature_date}
                    onChange={(e) => handleInputChange("signature_date", e.target.value)}
                  />
                </Grid>

                {/* Digital Signature Pad & Upload Option */}
                <Grid size={{ xs: 12 }}>
                  <SignatureCapture
                    label="Customer / Representative Signature"
                    value={formData.signature_data}
                    signatoryName={formData.customer_signature_name || project?.customer_name}
                    onChange={(sig) => handleInputChange("signature_data", sig)}
                    helperText="Sign digitally using mouse/touchpad/finger or upload signature image"
                  />
                </Grid>

                {/* Remarks - TALL MULTI-LINE */}
                <Grid size={{ xs: 12 }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.6 }}>
                    Remarks & Feasibility Recommendations
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Key observations, BOM recommendations, structure height recommendations, condition clauses..."
                    value={formData.remarks}
                    onChange={(e) => handleInputChange("remarks", e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        minHeight: "100px",
                        alignItems: "flex-start",
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button
            onClick={handleCloseDialog}
            disabled={saving}
            sx={{ textTransform: "none", fontWeight: 600, color: COLORS.textSecondary }}
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
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              borderRadius: "8px",
              "&:hover": { backgroundColor: "#020617" },
            }}
          >
            {saving ? "Saving Feasibility..." : "Save Inspection"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
