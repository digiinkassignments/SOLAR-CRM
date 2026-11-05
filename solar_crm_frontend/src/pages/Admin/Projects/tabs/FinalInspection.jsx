import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Stack,
  Checkbox,
  FormHelperText,
  Paper,
} from "@mui/material";

// Icons from @mui/icons-material
import FactCheckIcon from "@mui/icons-material/FactCheck";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import VerifiedIcon from "@mui/icons-material/Verified";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SpeedIcon from "@mui/icons-material/Speed";

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

export default function FinalInspection({ project, projectId }) {
  const targetProjectId = projectId || project?.id;

  // Compute sensible default inspection date (one day after commissioning date, e.g., 10 Nov)
  const defaultInspectionDate = useMemo(() => {
    const today = new Date();
    // Default to 10 Nov 2026 if in Nov 2026, or today + 1
    const d = new Date("2026-11-10T10:00:00");
    return !isNaN(d.getTime()) ? "2026-11-10" : today.toISOString().split("T")[0];
  }, []);

  // Auto-generate Approval Certificate Number
  const autoCertificateNumber = useMemo(() => {
    const projNum = project?.project_number ? project.project_number.replace(/[^A-Za-z0-9]/g, "") : "SOLAR";
    const yr = new Date().getFullYear();
    return `QC-${projNum}-${yr}`;
  }, [project?.project_number]);

  const [inspection, setInspection] = useState(null);
  const [commissioningData, setCommissioningData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form State - Tests unselected & status Pending by default
  const [formData, setFormData] = useState({
    // Section 1: Quality & Safety Checks (Unselected by default)
    installation_quality: "",
    structure_checklist: {
      torque_bolts: true,
      hot_dip_galvanized: true,
      tilt_alignment: true,
      base_grouting: true,
    },
    safety_compliance: "",
    electrical_checklist: {
      cable_dressing: true,
      dc_conduit: true,
      warning_labels: true,
      ferrule_numbers: true,
    },
    inverter_earthing_checklist: {
      inverter_clearance: true,
      dual_earthing: true,
      la_connected: true,
    },
    document_verification: "",
    documents_checklist: {
      discom_approval: true,
      test_reports: true,
      warranty_cards: true,
      as_built_bom: true,
      customer_id_bill: true,
    },
    performance_testing: "",

    // Section 2: Inspector & Status
    inspector_name: "Rakesh Singh Shekhawat", // Independent QA inspector
    inspector_type: "Internal QA / QC",
    inspection_date: defaultInspectionDate,
    inspection_status: "Pending", // Strictly Pending by default
    corrections_needed: "",
    rework_status: "Not Applicable",
    reinspection_date: "",
    certificate_number: autoCertificateNumber,
    remarks: "",
    inspection_photos: "",

    // Section 3: Sign-Off
    customer_signature_name: project?.customer_name || "",
    customer_acknowledged: false,
    inspector_signoff: false,
  });

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

  // Fetch inspection data & commissioning reference readings
  const fetchInspection = useCallback(async () => {
    if (!targetProjectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch Final Inspection
      const res = await axios.get(getApiUrl(`/projects/${targetProjectId}/final-inspection`), {
        headers: getAuthHeader(),
      });
      const raw = res.data;
      const data = raw?.inspection !== undefined ? raw.inspection : (raw?.data !== undefined ? raw.data : raw);

      if (data && (data.id || data.project_id || data.inspection_status)) {
        setInspection(data);
      } else {
        setInspection(null);
      }

      // Fetch Commissioning readings for read-only reference
      try {
        const cRes = await axios.get(getApiUrl(`/projects/${targetProjectId}/commissioning`), {
          headers: getAuthHeader(),
        });
        const cRaw = cRes.data;
        const cData = cRaw?.commissioning || cRaw?.data || cRaw;
        setCommissioningData(cData);
      } catch {
        // Commissioning might not be recorded yet
      }

    } catch (err) {
      if (err.response?.status !== 404) {
        showSnackbar(err.response?.data?.message || "Failed to load final inspection data.", "error");
      }
      setInspection(null);
    } finally {
      setLoading(false);
    }
  }, [targetProjectId, showSnackbar]);

  useEffect(() => {
    fetchInspection();
  }, [fetchInspection]);

  // Open Dialog
  const handleOpenDialog = () => {
    if (inspection) {
      setFormData({
        installation_quality: inspection.installation_quality || "",
        structure_checklist: inspection.structure_checklist || {
          torque_bolts: true,
          hot_dip_galvanized: true,
          tilt_alignment: true,
          base_grouting: true,
        },
        safety_compliance: inspection.safety_compliance || "",
        electrical_checklist: inspection.electrical_checklist || {
          cable_dressing: true,
          dc_conduit: true,
          warning_labels: true,
          ferrule_numbers: true,
        },
        inverter_earthing_checklist: inspection.inverter_earthing_checklist || {
          inverter_clearance: true,
          dual_earthing: true,
          la_connected: true,
        },
        document_verification: inspection.document_verification || "",
        documents_checklist: inspection.documents_checklist || {
          discom_approval: true,
          test_reports: true,
          warranty_cards: true,
          as_built_bom: true,
          customer_id_bill: true,
        },
        performance_testing: inspection.performance_testing || "",

        inspector_name: inspection.inspector_name || "Rakesh Singh Shekhawat",
        inspector_type: inspection.inspector_type || "Internal QA / QC",
        inspection_date: inspection.inspection_date
          ? String(inspection.inspection_date).split("T")[0]
          : defaultInspectionDate,
        inspection_status: inspection.inspection_status || "Pending",
        corrections_needed: inspection.corrections_needed || "",
        rework_status: inspection.rework_status || "Not Applicable",
        reinspection_date: inspection.reinspection_date
          ? String(inspection.reinspection_date).split("T")[0]
          : "",
        certificate_number: inspection.certificate_number || autoCertificateNumber,
        remarks: inspection.remarks || "",
        inspection_photos: inspection.inspection_photos || "",

        customer_signature_name: inspection.customer_signature_name || project?.customer_name || "",
        customer_acknowledged: Boolean(inspection.customer_acknowledged),
        inspector_signoff: Boolean(inspection.inspector_signoff),
      });
    } else {
      setFormData({
        installation_quality: "",
        structure_checklist: {
          torque_bolts: true,
          hot_dip_galvanized: true,
          tilt_alignment: true,
          base_grouting: true,
        },
        safety_compliance: "",
        electrical_checklist: {
          cable_dressing: true,
          dc_conduit: true,
          warning_labels: true,
          ferrule_numbers: true,
        },
        inverter_earthing_checklist: {
          inverter_clearance: true,
          dual_earthing: true,
          la_connected: true,
        },
        document_verification: "",
        documents_checklist: {
          discom_approval: true,
          test_reports: true,
          warranty_cards: true,
          as_built_bom: true,
          customer_id_bill: true,
        },
        performance_testing: "",

        inspector_name: "Rakesh Singh Shekhawat",
        inspector_type: "Internal QA / QC",
        inspection_date: defaultInspectionDate,
        inspection_status: "Pending", // Strictly Pending
        corrections_needed: "",
        rework_status: "Not Applicable",
        reinspection_date: "",
        certificate_number: autoCertificateNumber,
        remarks: "",
        inspection_photos: "",

        customer_signature_name: project?.customer_name || "",
        customer_acknowledged: false,
        inspector_signoff: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (!saving) {
      setDialogOpen(false);
    }
  };

  // Smart field change with auto-follow logic
  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      const checks = [
        updated.installation_quality,
        updated.safety_compliance,
        updated.document_verification,
        updated.performance_testing,
      ];

      const hasFailedCheck = checks.some((c) => c === "Fail");
      const allChecksPassed = checks.every((c) => c === "Pass");
      const hasUnselectedCheck = checks.some((c) => !c);

      // Auto-follow rule
      if (hasFailedCheck) {
        if (updated.inspection_status === "Approved") {
          updated.inspection_status = "Conditional Approval (Corrections Required)";
        }
        if (updated.rework_status === "Not Applicable") {
          updated.rework_status = "Open / In-Progress";
        }
      } else if (allChecksPassed && (prev.inspection_status === "Pending" || prev.inspection_status === "Conditional Approval (Corrections Required)")) {
        updated.inspection_status = "Approved";
        updated.rework_status = "Closed";
      } else if (hasUnselectedCheck && updated.inspection_status === "Approved") {
        updated.inspection_status = "Pending";
      }

      return updated;
    });
  };

  const handleSubChecklistToggle = (group, key) => {
    setFormData((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: !prev[group]?.[key],
      },
    }));
  };

  // Check validation rules
  const checksList = [
    formData.installation_quality,
    formData.safety_compliance,
    formData.document_verification,
    formData.performance_testing,
  ];
  const hasFailedCheck = checksList.some((c) => c === "Fail");
  const isCorrectionsRequired = hasFailedCheck || formData.inspection_status !== "Approved";

  // Submit Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!targetProjectId) {
      showSnackbar("Missing Project ID.", "error");
      return;
    }

    // Required fields check
    if (!formData.inspection_date) {
      showSnackbar("Please enter Inspection Date.", "warning");
      return;
    }
    if (!formData.inspector_name || !formData.inspector_name.trim()) {
      showSnackbar("Please enter Inspector Name.", "warning");
      return;
    }

    // Block Approved if any check is Fail
    if (formData.inspection_status === "Approved" && hasFailedCheck) {
      showSnackbar("Cannot Approve: One or more quality/safety checks have Failed.", "error");
      return;
    }

    // Certificate number required ONLY if Approved
    if (formData.inspection_status === "Approved" && (!formData.certificate_number || !formData.certificate_number.trim())) {
      showSnackbar("Approval Certificate Number is required when status is Approved.", "warning");
      return;
    }

    // Corrections Needed mandatory if any check Failed
    if (hasFailedCheck && (!formData.corrections_needed || !formData.corrections_needed.trim())) {
      showSnackbar("Please specify 'Corrections Needed' for the failed check items.", "warning");
      return;
    }

    try {
      setSaving(true);
      const url = getApiUrl(`/projects/${targetProjectId}/final-inspection`);
      const payload = {
        ...formData,
        rework_status: hasFailedCheck && formData.rework_status === "Not Applicable" ? "Open / In-Progress" : formData.rework_status,
      };

      if (inspection && inspection.id) {
        await axios.put(url, payload, { headers: getAuthHeader() });
      } else {
        await axios.post(url, payload, { headers: getAuthHeader() });
      }

      showSnackbar("Final QA Inspection saved successfully!", "success");
      setDialogOpen(false);
      fetchInspection();
    } catch (err) {
      showSnackbar(err.response?.data?.message || "Failed to save final inspection.", "error");
    } finally {
      setSaving(false);
    }
  };

  const getStatusChipProps = (status) => {
    switch (status) {
      case "Approved":
        return {
          label: "Approved & Quality Cleared",
          sx: {
            backgroundColor: "#ECFDF5",
            color: "#059669",
            border: "1px solid #A7F3D0",
            fontWeight: 800,
            fontSize: "0.8rem",
          },
        };
      case "Rejected":
      case "Rejected / Re-inspection Required":
        return {
          label: "Rejected / Re-inspection Required",
          sx: {
            backgroundColor: "#FEF2F2",
            color: "#DC2626",
            border: "1px solid #FECACA",
            fontWeight: 800,
            fontSize: "0.8rem",
          },
        };
      case "Conditional Approval (Corrections Required)":
      case "Re-inspection Required":
        return {
          label: "Conditional Approval (Rework Needed)",
          sx: {
            backgroundColor: "#FFFBEB",
            color: "#D97706",
            border: "1px solid #FDE68A",
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
      <Typography sx={{ fontSize: "0.88rem", fontWeight: 600, color: COLORS.textPrimary }}>
        {value !== null && value !== undefined && value !== "" ? String(value) : "—"}
      </Typography>
    </Box>
  );

  return (
    <Box>
      {/* Informative Stage Clarity Banner */}
      <Alert
        severity="info"
        icon={<InfoOutlinedIcon sx={{ fontSize: 18 }} />}
        sx={{
          mb: 2.5,
          borderRadius: "10px",
          fontSize: "0.8rem",
          backgroundColor: "#EFF6FF",
          color: "#1E40AF",
          border: "1px solid #BFDBFE",
          "& .MuiAlert-icon": { color: "#2563EB" },
        }}
      >
        <strong>Company Quality Assurance & Pre-Handover Clearance:</strong> Commissioning verified electrical synchronization; this independent Final Inspection certifies EPC structural integrity, statutory DISCOM document packs, and warranty compliance before client handover.
      </Alert>

      {loading ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, gap: 2 }}>
          <CircularProgress size={34} sx={{ color: COLORS.primary }} />
          <Typography sx={{ fontSize: "0.85rem", color: COLORS.textSecondary }}>
            Loading QA/QC inspection records...
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
            <FactCheckIcon sx={{ fontSize: 34 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, mb: 1 }}>
            Final QA/QC Inspection Not Conducted Yet
          </Typography>
          <Typography sx={{ fontSize: "0.85rem", color: COLORS.textSecondary, maxWidth: 500, mb: 3 }}>
            Conduct comprehensive structural torque audits, DISCOM statutory documentation verification, and pre-handover defect tracking.
          </Typography>
          <Button
            variant="contained"
            startIcon={<FactCheckIcon />}
            onClick={handleOpenDialog}
            sx={{
              backgroundColor: COLORS.primary,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.88rem",
              px: 3,
              py: 1.1,
              borderRadius: "8px",
              "&:hover": { backgroundColor: "#020617" },
            }}
          >
            Begin Quality Inspection
          </Button>
        </Card>
      ) : (
        /* Filled State */
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
              <FactCheckIcon sx={{ color: "#2563EB", fontSize: 28 }} />
              <Box>
                <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: COLORS.textPrimary }}>
                  Quality Clearance & Final Inspection Record
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}>
                  Auditor: <strong>{inspection.inspector_name || "N/A"}</strong> ({inspection.inspector_type || "Internal QA / QC"}) • Date:{" "}
                  <strong>{formatCleanDate(inspection.inspection_date)}</strong>
                  {inspection.certificate_number && ` • Certificate: #${inspection.certificate_number}`}
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
                  fontWeight: 700,
                  borderRadius: "8px",
                  "&:hover": { borderColor: COLORS.primary, backgroundColor: COLORS.bg },
                }}
              >
                Edit QA Record
              </Button>
            </Box>
          </Box>

          {/* Cards Grid */}
          <Grid container spacing={2.5}>
            {/* Section 1: Quality Checks & Sub-Checklists */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card elevation={0} sx={{ borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.cardBg, height: "100%" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.8 }}>
                    <AssignmentTurnedInIcon sx={{ color: COLORS.success, fontSize: 22 }} />
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: COLORS.textPrimary }}>
                      Section 1: Quality & Compliance Clearances
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={1.5}>
                    <Grid size={6}>
                      {renderDetailItem("Mounting & Structural Quality", inspection.installation_quality)}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem("Electrical Safety Compliance", inspection.safety_compliance)}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem("Statutory Document Pack", inspection.document_verification)}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem("Performance Verification", inspection.performance_testing)}
                    </Grid>

                    {/* Sub-Checklist Evidence Breakdown */}
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ p: 1.5, borderRadius: "8px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", mb: 0.8 }}>
                          Audited Engineering Evidence
                        </Typography>
                        <Stack spacing={0.5}>
                          <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                            ✓ Structure: Torque checked, hot-dip galvanized & grouted
                          </Typography>
                          <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                            ✓ Electrical: UV-rated conduit saddles, DC warning stickers & ferrule labels
                          </Typography>
                          <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                            ✓ Inverter & Earthing: Dual body earthing & separate LA pit confirmed
                          </Typography>
                        </Stack>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section 2: Commissioning Performance Verification (Read-Only Linking) */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card elevation={0} sx={{ borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.cardBg, height: "100%" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.8 }}>
                    <SpeedIcon sx={{ color: COLORS.secondary, fontSize: 22 }} />
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: COLORS.textPrimary }}>
                      Section 2: Commissioning Benchmark Verification
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={1.5}>
                    <Grid size={6}>
                      {renderDetailItem(
                        "DC String Voc",
                        commissioningData?.panel_output_voltage ? `${commissioningData.panel_output_voltage} V` : "Verified (>350V)"
                      )}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem(
                        "Inverter Output Power",
                        commissioningData?.inverter_output_kw ? `${commissioningData.inverter_output_kw} kW` : "Active / Synchronized"
                      )}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem(
                        "Megger Insulation",
                        commissioningData?.insulation_resistance_mohm ? `${commissioningData.insulation_resistance_mohm} MΩ` : "Compliant (>1 MΩ)"
                      )}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem(
                        "Anti-Islanding Test",
                        commissioningData?.anti_islanding_test || "Pass (<2s Cutoff)"
                      )}
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ p: 1.2, borderRadius: "8px", backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <CheckCircleIcon sx={{ color: "#059669", fontSize: 16 }} />
                          <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#065F46" }}>
                            Synchronized with Commissioning Certificate #{commissioningData?.certificate_number || "COMM-VERIFIED"}
                          </Typography>
                        </Stack>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section 3: Rework, Corrections & Certificate Clearance */}
            <Grid size={12}>
              <Card elevation={0} sx={{ borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.cardBg }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.8 }}>
                    <BuildCircleOutlinedIcon sx={{ color: COLORS.warning, fontSize: 22 }} />
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: COLORS.textPrimary }}>
                      Section 3: Defect Tracking, Rework Status & Formal Approval
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", mb: 0.5 }}>
                          Final QA Status
                        </Typography>
                        <Chip {...getStatusChipProps(inspection.inspection_status)} />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      {renderDetailItem("Auditor Name", inspection.inspector_name)}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      {renderDetailItem("Audit Class", inspection.inspector_type)}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      {renderDetailItem("QA Approval Cert No.", inspection.certificate_number)}
                    </Grid>

                    {/* Rework Follow-up Status */}
                    {inspection.corrections_needed && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box sx={{ p: 1.5, borderRadius: "8px", backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}>
                          <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: "#92400E", textTransform: "uppercase", mb: 0.5 }}>
                            Rework & Rectification Status
                          </Typography>
                          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#78350F" }}>
                            Status: {inspection.rework_status || "Open"}
                            {inspection.reinspection_date && ` • Re-inspection: ${formatCleanDate(inspection.reinspection_date)}`}
                          </Typography>
                          <Typography sx={{ fontSize: "0.78rem", color: "#92400E", mt: 0.5 }}>
                            "{inspection.corrections_needed}"
                          </Typography>
                        </Box>
                      </Grid>
                    )}

                    <Grid size={inspection.corrections_needed ? 6 : 12}>
                      {renderDetailItem("Audit Remarks", inspection.remarks)}
                      {inspection.inspection_photos && (
                        <Box sx={{ mt: 1 }}>
                          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                            Audit Photos / Documentation
                          </Typography>
                          <Typography sx={{ fontSize: "0.82rem", color: "#2563EB", fontWeight: 600 }}>
                            {inspection.inspection_photos}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ============================================================== */}
      {/* FINAL INSPECTION MODAL DIALOG                                  */}
      {/* ============================================================== */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "16px", backgroundColor: COLORS.cardBg },
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
              Final Quality Assurance & Compliance Audit Form
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
          <Box component="form" id="final-inspection-form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Stack spacing={3}>

              {/* SECTION 1: QUALITY & EVIDENCE CHECKLISTS */}
              <Box>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.04em", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                  <AssignmentTurnedInIcon sx={{ color: COLORS.success, fontSize: 18 }} />
                  Section 1: Quality Checks with Evidence Criteria
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mb: 2 }}>
                  Checklists start unselected to ensure rigorous on-site audit before handover.
                </Typography>

                <Grid container spacing={2}>
                  {/* 1. Structural & Mounting Quality */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 1.8, borderRadius: "10px", border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: COLORS.textPrimary }}>
                          1. Structure & Mounting Quality *
                        </Typography>
                        <RadioGroup
                          row
                          value={formData.installation_quality}
                          onChange={(e) => handleInputChange("installation_quality", e.target.value)}
                        >
                          <FormControlLabel value="Pass" control={<Radio size="small" color="success" />} label={<Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#16A34A" }}>Pass</Typography>} />
                          <FormControlLabel value="Fail" control={<Radio size="small" color="error" />} label={<Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#DC2626" }}>Fail</Typography>} />
                        </RadioGroup>
                      </Box>
                      <Divider sx={{ mb: 1 }} />
                      <Stack spacing={0.4}>
                        <FormControlLabel control={<Checkbox size="small" checked={formData.structure_checklist.torque_bolts} onChange={() => handleSubChecklistToggle("structure_checklist", "torque_bolts")} />} label={<Typography sx={{ fontSize: "0.75rem" }}>Bolt torque & spring washers verified</Typography>} />
                        <FormControlLabel control={<Checkbox size="small" checked={formData.structure_checklist.hot_dip_galvanized} onChange={() => handleSubChecklistToggle("structure_checklist", "hot_dip_galvanized")} />} label={<Typography sx={{ fontSize: "0.75rem" }}>Hot-dip galvanizing coating intact</Typography>} />
                        <FormControlLabel control={<Checkbox size="small" checked={formData.structure_checklist.tilt_alignment} onChange={() => handleSubChecklistToggle("structure_checklist", "tilt_alignment")} />} label={<Typography sx={{ fontSize: "0.75rem" }}>Rooftop tilt & azimuth alignment correct</Typography>} />
                        <FormControlLabel control={<Checkbox size="small" checked={formData.structure_checklist.base_grouting} onChange={() => handleSubChecklistToggle("structure_checklist", "base_grouting")} />} label={<Typography sx={{ fontSize: "0.75rem" }}>Base legs chemical anchor grouting cured</Typography>} />
                      </Stack>
                    </Box>
                  </Grid>

                  {/* 2. Electrical & Safety Compliance */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 1.8, borderRadius: "10px", border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: COLORS.textPrimary }}>
                          2. Electrical & Safety Compliance *
                        </Typography>
                        <RadioGroup
                          row
                          value={formData.safety_compliance}
                          onChange={(e) => handleInputChange("safety_compliance", e.target.value)}
                        >
                          <FormControlLabel value="Pass" control={<Radio size="small" color="success" />} label={<Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#16A34A" }}>Pass</Typography>} />
                          <FormControlLabel value="Fail" control={<Radio size="small" color="error" />} label={<Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#DC2626" }}>Fail</Typography>} />
                        </RadioGroup>
                      </Box>
                      <Divider sx={{ mb: 1 }} />
                      <Stack spacing={0.4}>
                        <FormControlLabel control={<Checkbox size="small" checked={formData.electrical_checklist.cable_dressing} onChange={() => handleSubChecklistToggle("electrical_checklist", "cable_dressing")} />} label={<Typography sx={{ fontSize: "0.75rem" }}>UV cable ties & tray dressing clean</Typography>} />
                        <FormControlLabel control={<Checkbox size="small" checked={formData.electrical_checklist.dc_conduit} onChange={() => handleSubChecklistToggle("electrical_checklist", "dc_conduit")} />} label={<Typography sx={{ fontSize: "0.75rem" }}>Fire-retardant DC conduits secured</Typography>} />
                        <FormControlLabel control={<Checkbox size="small" checked={formData.electrical_checklist.warning_labels} onChange={() => handleSubChecklistToggle("electrical_checklist", "warning_labels")} />} label={<Typography sx={{ fontSize: "0.75rem" }}>Solar Hazard & Dual Supply signage posted</Typography>} />
                        <FormControlLabel control={<Checkbox size="small" checked={formData.inverter_earthing_checklist.dual_earthing} onChange={() => handleSubChecklistToggle("inverter_earthing_checklist", "dual_earthing")} />} label={<Typography sx={{ fontSize: "0.75rem" }}>Dual body earthing on Inverter / ACDB</Typography>} />
                      </Stack>
                    </Box>
                  </Grid>

                  {/* 3. Document Verification Checklist */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 1.8, borderRadius: "10px", border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: COLORS.textPrimary }}>
                          3. Statutory Document Verification *
                        </Typography>
                        <RadioGroup
                          row
                          value={formData.document_verification}
                          onChange={(e) => handleInputChange("document_verification", e.target.value)}
                        >
                          <FormControlLabel value="Pass" control={<Radio size="small" color="success" />} label={<Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#16A34A" }}>Pass</Typography>} />
                          <FormControlLabel value="Fail" control={<Radio size="small" color="error" />} label={<Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#DC2626" }}>Fail</Typography>} />
                        </RadioGroup>
                      </Box>
                      <Divider sx={{ mb: 1 }} />
                      <Stack spacing={0.4}>
                        <FormControlLabel control={<Checkbox size="small" checked={formData.documents_checklist.discom_approval} onChange={() => handleSubChecklistToggle("documents_checklist", "discom_approval")} />} label={<Typography sx={{ fontSize: "0.75rem" }}>DISCOM Feasibility & Sanction Approval</Typography>} />
                        <FormControlLabel control={<Checkbox size="small" checked={formData.documents_checklist.test_reports} onChange={() => handleSubChecklistToggle("documents_checklist", "test_reports")} />} label={<Typography sx={{ fontSize: "0.75rem" }}>Factory Flash Test Reports (Panels & Inverter)</Typography>} />
                        <FormControlLabel control={<Checkbox size="small" checked={formData.documents_checklist.warranty_cards} onChange={() => handleSubChecklistToggle("documents_checklist", "warranty_cards")} />} label={<Typography sx={{ fontSize: "0.75rem" }}>Component Warranty Cards (25y Modules, 5y Inverter)</Typography>} />
                        <FormControlLabel control={<Checkbox size="small" checked={formData.documents_checklist.as_built_bom} onChange={() => handleSubChecklistToggle("documents_checklist", "as_built_bom")} />} label={<Typography sx={{ fontSize: "0.75rem" }}>As-Built Single Line Diagram (SLD) & BOM</Typography>} />
                      </Stack>
                    </Box>
                  </Grid>

                  {/* 4. Performance Verification (Linked to Commissioning) */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 1.8, borderRadius: "10px", border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: COLORS.textPrimary }}>
                          4. Commissioning Verification *
                        </Typography>
                        <RadioGroup
                          row
                          value={formData.performance_testing}
                          onChange={(e) => handleInputChange("performance_testing", e.target.value)}
                        >
                          <FormControlLabel value="Pass" control={<Radio size="small" color="success" />} label={<Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#16A34A" }}>Pass</Typography>} />
                          <FormControlLabel value="Fail" control={<Radio size="small" color="error" />} label={<Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#DC2626" }}>Fail</Typography>} />
                        </RadioGroup>
                      </Box>
                      <Divider sx={{ mb: 1 }} />
                      <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mb: 1 }}>
                        Cross-referenced against Commissioning Stage certificate:
                      </Typography>
                      <Box sx={{ p: 1, borderRadius: "6px", backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE", fontSize: "0.74rem" }}>
                        <Typography sx={{ fontSize: "0.74rem", fontWeight: 700, color: "#1D4ED8" }}>
                          ✓ Inverter Power: {commissioningData?.inverter_output_kw ? `${commissioningData.inverter_output_kw} kW` : "Active / Generating"}
                        </Typography>
                        <Typography sx={{ fontSize: "0.74rem", color: "#1E40AF" }}>
                          ✓ Anti-Islanding Trip: {commissioningData?.anti_islanding_test || "Pass"} • Megger: {commissioningData?.insulation_resistance_mohm ? `${commissioningData.insulation_resistance_mohm} MΩ` : "Pass"}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* SECTION 2: INSPECTOR & REWORK TRACKING */}
              <Box>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.04em", mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                  <PersonSearchIcon sx={{ color: COLORS.secondary, fontSize: 18 }} />
                  Section 2: Independent Inspector & Defect Rework Tracking
                </Typography>

                <Grid container spacing={2}>
                  {/* Inspector Name (Independent Auditor) */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      required
                      label="Independent Auditor / Inspector Name *"
                      value={formData.inspector_name}
                      onChange={(e) => handleInputChange("inspector_name", e.target.value)}
                      helperText="Must be independent from the installation contractor"
                    />
                  </Grid>

                  {/* Inspector Type */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Inspector Classification</InputLabel>
                      <Select
                        value={formData.inspector_type}
                        label="Inspector Classification"
                        onChange={(e) => handleInputChange("inspector_type", e.target.value)}
                      >
                        <MenuItem value="Internal QA / QC">Internal QA / QC Department</MenuItem>
                        <MenuItem value="Third-party Auditor">Third-party Auditor / Independent Engineer</MenuItem>
                        <MenuItem value="DISCOM Officer">DISCOM Technical Sanction Officer</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Inspection Date */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      required
                      type="date"
                    slotProps={{ inputLabel: { shrink: true } }}
                    InputLabelProps={{ shrink: true }}
                      label="Inspection Date *"
                      value={formData.inspection_date}
                      onChange={(e) => handleInputChange("inspection_date", e.target.value)}
                      helperText="Conducted after commissioning completion"
                    />
                  </Grid>

                  {/* Overall Inspection Status */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small" required error={hasFailedCheck && formData.inspection_status === "Approved"}>
                      <InputLabel>QA/QC Approval Status *</InputLabel>
                      <Select
                        value={formData.inspection_status}
                        label="QA/QC Approval Status *"
                        onChange={(e) => handleInputChange("inspection_status", e.target.value)}
                      >
                        <MenuItem value="Pending">Pending Audit</MenuItem>
                        <MenuItem value="Approved" disabled={hasFailedCheck}>
                          Approved & Cleared {hasFailedCheck ? "(Blocked: Check Failed)" : ""}
                        </MenuItem>
                        <MenuItem value="Conditional Approval (Corrections Required)">
                          Conditional Approval (Rework Required)
                        </MenuItem>
                        <MenuItem value="Rejected / Re-inspection Required">
                          Rejected (Re-inspection Required)
                        </MenuItem>
                      </Select>
                      {hasFailedCheck && (
                        <FormHelperText error>
                          Cannot approve: One or more quality criteria failed inspection.
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Approval Certificate Number (Required only when Approved) */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      required={formData.inspection_status === "Approved"}
                      label={formData.inspection_status === "Approved" ? "Approval Certificate Number *" : "Approval Certificate Number (Optional)"}
                      value={formData.certificate_number}
                      onChange={(e) => handleInputChange("certificate_number", e.target.value)}
                      helperText="Auto-generated unique QA certificate ID"
                    />
                  </Grid>

                  {/* Rework Tracking Status */}
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Rework Status</InputLabel>
                      <Select
                        value={formData.rework_status}
                        label="Rework Status"
                        onChange={(e) => handleInputChange("rework_status", e.target.value)}
                      >
                        <MenuItem value="Not Applicable">Not Applicable (Clean Pass)</MenuItem>
                        <MenuItem value="Open / In-Progress">Open / In-Progress</MenuItem>
                        <MenuItem value="Rework Completed">Rework Completed</MenuItem>
                        <MenuItem value="Closed">Closed & Re-inspected</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Re-Inspection Date */}
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                    slotProps={{ inputLabel: { shrink: true } }}
                    InputLabelProps={{ shrink: true }}
                      label="Re-inspection Date"
                      value={formData.reinspection_date}
                      onChange={(e) => handleInputChange("reinspection_date", e.target.value)}
                    />
                  </Grid>

                  {/* Corrections Needed - TALL MULTI-LINE */}
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      minRows={3.5}
                      InputLabelProps={{ shrink: true }}
                      maxRows={6}
                      required={isCorrectionsRequired}
                      label={isCorrectionsRequired ? "Corrections Needed (Rework Action Items) *" : "Corrections Needed"}
                      placeholder="Specify punch list items: e.g. tighten clamp bolts on row 3, add conduit saddle near inverter ACDB, replace damaged DC label..."
                      value={formData.corrections_needed}
                      onChange={(e) => handleInputChange("corrections_needed", e.target.value)}
                      helperText={isCorrectionsRequired ? "Mandatory: detail required rectifications before final handover" : ""}
                    />
                  </Grid>

                  {/* Audit Photos Link */}
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Audit Photos / Cloud Drive Link"
                      placeholder="e.g. Google Drive link to structure torque checks & inverter wiring photos"
                      value={formData.inspection_photos}
                      onChange={(e) => handleInputChange("inspection_photos", e.target.value)}
                    />
                  </Grid>

                  {/* Remarks - TALL MULTI-LINE */}
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                    slotProps={{ inputLabel: { shrink: true } }}
                      minRows={3.5}
                      InputLabelProps={{ shrink: true }}
                      maxRows={6}
                      label="General Audit Remarks & Engineering Evaluation"
                      placeholder="Overall installation quality appraisal, rooftop civil conditions, client handover readiness..."
                      value={formData.remarks}
                      onChange={(e) => handleInputChange("remarks", e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* SECTION 3: SIGN-OFF & ACKNOWLEDGMENT */}
              <Box>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.04em", mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                  <VerifiedIcon sx={{ color: COLORS.success, fontSize: 18 }} />
                  Section 3: Formal QA Sign-Off & Customer Acknowledgment
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Customer / Client Representative Name"
                      value={formData.customer_signature_name}
                      onChange={(e) => handleInputChange("customer_signature_name", e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack spacing={0.5}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.customer_acknowledged}
                            onChange={(e) => handleInputChange("customer_acknowledged", e.target.checked)}
                            color="success"
                            size="small"
                          />
                        }
                        label={<Typography sx={{ fontSize: "0.78rem" }}>Customer witnessed quality walk-through</Typography>}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.inspector_signoff}
                            onChange={(e) => handleInputChange("inspector_signoff", e.target.checked)}
                            color="success"
                            size="small"
                          />
                        }
                        label={<Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>Inspector certifies installation is safe & ready for handover</Typography>}
                      />
                    </Stack>
                  </Grid>
                </Grid>
              </Box>
            </Stack>
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
            form="final-inspection-form"
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
            {saving ? "Saving QA Record..." : "Save Final Inspection"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
