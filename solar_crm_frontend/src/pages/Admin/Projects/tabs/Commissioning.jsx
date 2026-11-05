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
} from "@mui/material";

// Icons from @mui/icons-material
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import SpeedIcon from "@mui/icons-material/Speed";
import SecurityIcon from "@mui/icons-material/Security";
import VerifiedIcon from "@mui/icons-material/Verified";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import AutorenewIcon from "@mui/icons-material/Autorenew";

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

export default function Commissioning({ project, projectId }) {
  const targetProjectId = projectId || project?.id;
  const systemKw = Number(project?.system_capacity_kw || 0);
  const inverterRatingKw = Number(project?.inverter_kw || systemKw || 5);

  // Compute sensible default commissioning date (on or after installation end date)
  const defaultCommissionDate = useMemo(() => {
    if (project?.installation_end_date) {
      const d = new Date(project.installation_end_date);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0];
    }
    return new Date().toISOString().split("T")[0];
  }, [project?.installation_end_date]);

  // Auto-generate Certificate Number
  const autoCertificateNumber = useMemo(() => {
    const projNum = project?.project_number ? project.project_number.replace(/[^A-Za-z0-9]/g, "") : "SOLAR";
    const yr = new Date().getFullYear();
    return `COMM-${projNum}-${yr}`;
  }, [project?.project_number]);

  const [commissioning, setCommissioning] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Initial Form State - Tests unselected & status Pending by default
  const [formData, setFormData] = useState({
    // Section 1: System Electrical Measurements
    panel_output_voltage: "", // DC string voltage
    dc_current_amps: "",
    inverter_output_kw: "",
    inverter_display_status: "Normal / Generating",
    ac_output_voltage: "",

    // Net Metering
    meter_serial_number: "",
    net_meter_import_kwh: "",
    net_meter_export_kwh: "",
    generation_meter_kwh: "",

    // Section 2: Safety & Protection Tests (Unselected by default)
    anti_islanding_test: "", // Anti-islanding grid cutoff
    safety_shutdowns: "",
    grounding_check: "",
    earth_resistance_ohm: "", // normally < 5 ohm
    wiring_insulation: "",
    insulation_resistance_mohm: "", // Megger test in MΩ
    earth_leakage: "",

    // Section 3: Commissioning Result
    overall_result: "Pending", // Strictly Pending by default
    commission_date: defaultCommissionDate,
    commissioning_engineer: "",
    certificate_number: autoCertificateNumber,
    remarks: "",

    // Section 4: Attachments & Sign-off
    meter_photo_url: "",
    inverter_photo_url: "",
    customer_signature_name: project?.customer_name || "",
    customer_acknowledged: false,
    engineer_signoff: false,
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

  const fetchCommissioning = useCallback(async () => {
    if (!targetProjectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(getApiUrl(`/projects/${targetProjectId}/commissioning`), {
        headers: getAuthHeader(),
      });

      const raw = res.data;
      const data =
        raw?.commissioning !== undefined
          ? raw.commissioning
          : raw?.data !== undefined
          ? raw.data
          : raw;

      if (data && (data.id || data.project_id || data.overall_result)) {
        setCommissioning(data);
      } else {
        setCommissioning(null);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        showSnackbar(
          err.response?.data?.message || "Failed to load commissioning data.",
          "error"
        );
      }
      setCommissioning(null);
    } finally {
      setLoading(false);
    }
  }, [targetProjectId, showSnackbar]);

  useEffect(() => {
    fetchCommissioning();
  }, [fetchCommissioning]);

  const handleOpenDialog = () => {
    if (commissioning) {
      setFormData({
        panel_output_voltage: commissioning.panel_output_voltage ?? "",
        dc_current_amps: commissioning.dc_current_amps ?? "",
        inverter_output_kw: commissioning.inverter_output_kw ?? "",
        inverter_display_status: commissioning.inverter_display_status || "Normal / Generating",
        ac_output_voltage: commissioning.ac_output_voltage ?? "",

        meter_serial_number: commissioning.meter_serial_number || "",
        net_meter_import_kwh: commissioning.net_meter_import_kwh ?? "",
        net_meter_export_kwh: commissioning.net_meter_export_kwh ?? "",
        generation_meter_kwh: commissioning.generation_meter_kwh ?? commissioning.meter_reading_kwh ?? "",

        anti_islanding_test: commissioning.anti_islanding_test || "",
        safety_shutdowns: commissioning.safety_shutdowns || "",
        grounding_check: commissioning.grounding_check || "",
        earth_resistance_ohm: commissioning.earth_resistance_ohm ?? "",
        wiring_insulation: commissioning.wiring_insulation || "",
        insulation_resistance_mohm: commissioning.insulation_resistance_mohm ?? "",
        earth_leakage: commissioning.earth_leakage || "",

        overall_result: commissioning.overall_result || "Pending",
        commission_date: commissioning.commission_date
          ? String(commissioning.commission_date).split("T")[0]
          : defaultCommissionDate,
        commissioning_engineer: commissioning.commissioning_engineer || "",
        certificate_number: commissioning.certificate_number || autoCertificateNumber,
        remarks: commissioning.remarks || "",

        meter_photo_url: commissioning.meter_photo_url || "",
        inverter_photo_url: commissioning.inverter_photo_url || "",
        customer_signature_name: commissioning.customer_signature_name || project?.customer_name || "",
        customer_acknowledged: Boolean(commissioning.customer_acknowledged),
        engineer_signoff: Boolean(commissioning.engineer_signoff),
      });
    } else {
      setFormData({
        panel_output_voltage: "",
        dc_current_amps: "",
        inverter_output_kw: "",
        inverter_display_status: "Normal / Generating",
        ac_output_voltage: "",

        meter_serial_number: "",
        net_meter_import_kwh: "",
        net_meter_export_kwh: "",
        generation_meter_kwh: "",

        anti_islanding_test: "",
        safety_shutdowns: "",
        grounding_check: "",
        earth_resistance_ohm: "",
        wiring_insulation: "",
        insulation_resistance_mohm: "",
        earth_leakage: "",

        overall_result: "Pending", // Strictly Pending
        commission_date: defaultCommissionDate,
        commissioning_engineer: "",
        certificate_number: autoCertificateNumber,
        remarks: "",

        meter_photo_url: "",
        inverter_photo_url: "",
        customer_signature_name: project?.customer_name || "",
        customer_acknowledged: false,
        engineer_signoff: false,
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

      // Tests list
      const safetyTests = [
        updated.anti_islanding_test,
        updated.safety_shutdowns,
        updated.grounding_check,
        updated.wiring_insulation,
        updated.earth_leakage,
      ];

      // Auto-follow rule: If ANY test fails, overall_result must be Failed
      const hasFailedTest = safetyTests.some((t) => t === "Fail");
      const allTestsPassed = safetyTests.every((t) => t === "Pass");
      const hasUnselectedTest = safetyTests.some((t) => !t);

      if (hasFailedTest) {
        updated.overall_result = "Failed";
      } else if (allTestsPassed && (prev.overall_result === "Pending" || prev.overall_result === "Failed")) {
        updated.overall_result = "Passed";
      } else if (hasUnselectedTest && updated.overall_result === "Passed") {
        updated.overall_result = "Pending";
      }

      return updated;
    });
  };

  // Test validation warnings
  const testsList = [
    formData.anti_islanding_test,
    formData.safety_shutdowns,
    formData.grounding_check,
    formData.wiring_insulation,
    formData.earth_leakage,
  ];
  const hasFailedTest = testsList.some((t) => t === "Fail");

  // Inverter power limit check (> inverter rating or system kW + 10%)
  const inverterKwNum = Number(formData.inverter_output_kw);
  const exceedsInverterLimit = inverterKwNum > (inverterRatingKw * 1.15) && inverterKwNum > 0;

  // AC Voltage bounds check (Single Phase: 210-250V, Three Phase: 380-440V)
  const acVoltNum = Number(formData.ac_output_voltage);
  const isThreePhase = project?.meter_type === "Three Phase" || systemKw > 5;
  const acVoltageOutRange = acVoltNum > 0 && (
    isThreePhase
      ? (acVoltNum < 360 || acVoltNum > 460)
      : (acVoltNum < 195 || acVoltNum > 260)
  );

  // Earth resistance check (> 5 ohm is unsafe)
  const earthResistanceNum = Number(formData.earth_resistance_ohm);
  const isEarthResistanceHigh = earthResistanceNum > 5.0;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!targetProjectId) {
      showSnackbar("Missing Project ID.", "error");
      return;
    }

    // Required fields check
    if (!formData.commission_date) {
      showSnackbar("Please select Commissioning Date.", "warning");
      return;
    }
    if (!formData.commissioning_engineer || !formData.commissioning_engineer.trim()) {
      showSnackbar("Please enter Commissioning Engineer Name.", "warning");
      return;
    }
    if (!formData.certificate_number || !formData.certificate_number.trim()) {
      showSnackbar("Please provide Certificate Number.", "warning");
      return;
    }

    // Block Passed if any test is Fail
    if (formData.overall_result === "Passed" && hasFailedTest) {
      showSnackbar("Cannot approve as 'Passed': One or more safety tests have Failed.", "error");
      return;
    }

    try {
      setSaving(true);
      const url = getApiUrl(`/projects/${targetProjectId}/commissioning`);
      const payload = {
        ...formData,
        panel_output_voltage: formData.panel_output_voltage === "" ? null : Number(formData.panel_output_voltage),
        dc_current_amps: formData.dc_current_amps === "" ? null : Number(formData.dc_current_amps),
        inverter_output_kw: formData.inverter_output_kw === "" ? null : Number(formData.inverter_output_kw),
        ac_output_voltage: formData.ac_output_voltage === "" ? null : Number(formData.ac_output_voltage),
        net_meter_import_kwh: formData.net_meter_import_kwh === "" ? null : Number(formData.net_meter_import_kwh),
        net_meter_export_kwh: formData.net_meter_export_kwh === "" ? null : Number(formData.net_meter_export_kwh),
        generation_meter_kwh: formData.generation_meter_kwh === "" ? null : Number(formData.generation_meter_kwh),
        meter_reading_kwh: formData.generation_meter_kwh === "" ? null : Number(formData.generation_meter_kwh),
        earth_resistance_ohm: formData.earth_resistance_ohm === "" ? null : Number(formData.earth_resistance_ohm),
        insulation_resistance_mohm: formData.insulation_resistance_mohm === "" ? null : Number(formData.insulation_resistance_mohm),
      };

      if (commissioning && commissioning.id) {
        await axios.put(url, payload, { headers: getAuthHeader() });
      } else {
        await axios.post(url, payload, { headers: getAuthHeader() });
      }

      showSnackbar("Technical commissioning report saved successfully!", "success");
      setDialogOpen(false);
      fetchCommissioning();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Failed to save commissioning data.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const getResultChipProps = (result) => {
    switch (result) {
      case "Passed":
        return {
          label: "Passed & Synchronized",
          sx: {
            backgroundColor: "#ECFDF5",
            color: "#059669",
            border: "1px solid #A7F3D0",
            fontWeight: 800,
            fontSize: "0.8rem",
          },
        };
      case "Failed":
        return {
          label: "Failed (Rectification Required)",
          sx: {
            backgroundColor: "#FEF2F2",
            color: "#DC2626",
            border: "1px solid #FECACA",
            fontWeight: 800,
            fontSize: "0.8rem",
          },
        };
      case "Conditional Pass":
        return {
          label: "Conditional Pass",
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
          label: result || "Pending",
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
        <strong>Technical & Functional Commissioning:</strong> This stage confirms anti-islanding safety shutoff, inverter synchronisation, insulation Megger resistance, and net-meter readings before customer handover and DISCOM subsidy inspection.
      </Alert>

      {loading ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, gap: 2 }}>
          <CircularProgress size={34} sx={{ color: COLORS.primary }} />
          <Typography sx={{ fontSize: "0.85rem", color: COLORS.textSecondary }}>
            Loading commissioning validation records...
          </Typography>
        </Box>
      ) : !commissioning ? (
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
            <ElectricBoltIcon sx={{ fontSize: 34 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, mb: 1 }}>
            Commissioning Not Conducted Yet
          </Typography>
          <Typography sx={{ fontSize: "0.85rem", color: COLORS.textSecondary, maxWidth: 500, mb: 3 }}>
            Validate DC string voltage, anti-islanding protection cutoff, Megger insulation resistance, earth resistance, and net meter baseline readings.
          </Typography>
          <Button
            variant="contained"
            startIcon={<ElectricBoltIcon />}
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
            Begin Functional Commissioning
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
              <VerifiedIcon sx={{ color: "#16A34A", fontSize: 28 }} />
              <Box>
                <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: COLORS.textPrimary }}>
                  Commissioning & Functional Testing Certificate
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}>
                  Engineer: <strong>{commissioning.commissioning_engineer || "N/A"}</strong> • Date:{" "}
                  <strong>{formatCleanDate(commissioning.commission_date)}</strong>
                  {commissioning.certificate_number && ` • Cert #${commissioning.certificate_number}`}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Chip {...getResultChipProps(commissioning.overall_result)} />
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
                Edit Commissioning
              </Button>
            </Box>
          </Box>

          {/* Cards Grid */}
          <Grid container spacing={2.5}>
            {/* Section 1: Electrical Generation & Net Meter Readings */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card elevation={0} sx={{ borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.cardBg, height: "100%" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.8 }}>
                    <SpeedIcon sx={{ color: COLORS.secondary, fontSize: 22 }} />
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: COLORS.textPrimary }}>
                      Section 1: Electrical & Net Meter Readings
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={1.5}>
                    <Grid size={6}>
                      {renderDetailItem(
                        "DC String Voltage",
                        commissioning.panel_output_voltage ? `${commissioning.panel_output_voltage} V` : null
                      )}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem(
                        "DC String Current",
                        commissioning.dc_current_amps ? `${commissioning.dc_current_amps} A` : null
                      )}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem(
                        "Inverter Output Power",
                        commissioning.inverter_output_kw ? `${commissioning.inverter_output_kw} kW` : null
                      )}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem(
                        "Inverter Display Status",
                        commissioning.inverter_display_status
                      )}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem(
                        "AC Grid Output Voltage",
                        commissioning.ac_output_voltage ? `${commissioning.ac_output_voltage} V` : null
                      )}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem(
                        "Meter Serial Number",
                        commissioning.meter_serial_number
                      )}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem(
                        "Net Meter Import",
                        commissioning.net_meter_import_kwh ? `${commissioning.net_meter_import_kwh} kWh` : null
                      )}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem(
                        "Net Meter Export",
                        commissioning.net_meter_export_kwh ? `${commissioning.net_meter_export_kwh} kWh` : null
                      )}
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      {renderDetailItem(
                        "Solar Generation Baseline",
                        (commissioning.generation_meter_kwh || commissioning.meter_reading_kwh)
                          ? `${commissioning.generation_meter_kwh || commissioning.meter_reading_kwh} kWh`
                          : null
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section 2: Safety, Anti-Islanding & Insulation Tests */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card elevation={0} sx={{ borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.cardBg, height: "100%" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.8 }}>
                    <SecurityIcon sx={{ color: COLORS.warning, fontSize: 22 }} />
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: COLORS.textPrimary }}>
                      Section 2: Anti-Islanding & Insulation Protection
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={1.5}>
                    <Grid size={6}>
                      {renderDetailItem("Anti-Islanding Test", commissioning.anti_islanding_test)}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem("Emergency Shutdowns", commissioning.safety_shutdowns)}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem("Grounding / Earthing Continuity", commissioning.grounding_check)}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem(
                        "Earth Resistance",
                        commissioning.earth_resistance_ohm
                          ? `${commissioning.earth_resistance_ohm} Ω (Req: < 5 Ω)`
                          : null
                      )}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem("Wiring Insulation Integrity", commissioning.wiring_insulation)}
                    </Grid>
                    <Grid size={6}>
                      {renderDetailItem(
                        "Megger Insulation Resistance",
                        commissioning.insulation_resistance_mohm
                          ? `${commissioning.insulation_resistance_mohm} MΩ (Req: > 1 MΩ)`
                          : null
                      )}
                    </Grid>
                    <Grid size={12}>
                      {renderDetailItem("Earth Leakage Current Test", commissioning.earth_leakage)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section 3: Commissioning Certificate & Sign-Off */}
            <Grid size={12}>
              <Card elevation={0} sx={{ borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.cardBg }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.8 }}>
                    <AssignmentTurnedInIcon sx={{ color: COLORS.success, fontSize: 22 }} />
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: COLORS.textPrimary }}>
                      Section 3: Commissioning Decision & Formal Sign-Off
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", mb: 0.5 }}>
                          Overall Technical Result
                        </Typography>
                        <Chip {...getResultChipProps(commissioning.overall_result)} />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      {renderDetailItem("Commissioning Date", formatCleanDate(commissioning.commission_date))}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      {renderDetailItem("Testing Engineer", commissioning.commissioning_engineer)}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      {renderDetailItem("Certificate Number", commissioning.certificate_number)}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      {renderDetailItem("Customer / Rep Sign-Off", commissioning.customer_signature_name)}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", mb: 0.3 }}>
                          Verification Status
                        </Typography>
                        <Stack direction="row" gap={1} flexWrap="wrap">
                          {commissioning.customer_acknowledged === 1 && (
                            <Chip size="small" icon={<CheckCircleIcon />} label="Customer Acknowledged" color="success" />
                          )}
                          {commissioning.engineer_signoff === 1 && (
                            <Chip size="small" icon={<VerifiedIcon />} label="Engineer Signed Off" color="primary" />
                          )}
                        </Stack>
                      </Box>
                    </Grid>
                    <Grid size={12}>
                      {renderDetailItem("Technical Remarks & Observations", commissioning.remarks)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ============================================================== */}
      {/* COMMISSIONING MODAL FORM DIALOG                                */}
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
              Functional & Electrical Commissioning Form
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, mt: 0.2 }}>
              Project: {project?.project_number} • System: {project?.system_capacity_kw || "N/A"} kW • Inverter: {inverterRatingKw} kW
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleCloseDialog} disabled={saving}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box component="form" id="commissioning-form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Stack spacing={3}>

              {/* SECTION 1: ELECTRICAL READINGS & NET METERING */}
              <Box>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.04em", mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                  <SpeedIcon sx={{ color: COLORS.secondary, fontSize: 18 }} />
                  Section 1: DC/AC Electrical Readings & Net Meter
                </Typography>

                <Grid container spacing={2}>
                  {/* DC String Voltage (V) */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="DC String Voltage (V) *"
                      placeholder="e.g. 380"
                      inputProps={{ step: "any" }}
                      value={formData.panel_output_voltage}
                      onChange={(e) => handleInputChange("panel_output_voltage", e.target.value)}
                      helperText="Total open circuit voltage Voc of module strings"
                    />
                  </Grid>

                  {/* DC String Current (A) */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="DC String Current (A)"
                      placeholder="e.g. 11.8"
                      inputProps={{ step: "any" }}
                      value={formData.dc_current_amps}
                      onChange={(e) => handleInputChange("dc_current_amps", e.target.value)}
                      helperText="Operating DC current during peak sunlight"
                    />
                  </Grid>

                  {/* Inverter Output (kW) with Limit Validation */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Inverter Output Power (kW)"
                      placeholder="e.g. 4.8"
                      inputProps={{ step: "any", min: 0 }}
                      value={formData.inverter_output_kw}
                      onChange={(e) => handleInputChange("inverter_output_kw", e.target.value)}
                      error={exceedsInverterLimit}
                      helperText={
                        exceedsInverterLimit
                          ? `Warning: Output exceeds inverter rated limit (${inverterRatingKw} kW)`
                          : `Inverter rating: ${inverterRatingKw} kW`
                      }
                    />
                  </Grid>

                  {/* Inverter Display Status */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Inverter LCD Status Display</InputLabel>
                      <Select
                        value={formData.inverter_display_status}
                        label="Inverter LCD Status Display"
                        onChange={(e) => handleInputChange("inverter_display_status", e.target.value)}
                      >
                        <MenuItem value="Normal / Generating">Normal / Generating (Green LED)</MenuItem>
                        <MenuItem value="Grid Synchronized">Grid Synchronized / Feeding</MenuItem>
                        <MenuItem value="Waiting / Connecting">Waiting / Standby Mode</MenuItem>
                        <MenuItem value="Fault / Error Code">Fault / Error Code Present</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* AC Output Voltage (V) with Bounds Validation */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="AC Grid Output Voltage (V) *"
                      placeholder={isThreePhase ? "e.g. 415" : "e.g. 230"}
                      inputProps={{ step: "any" }}
                      value={formData.ac_output_voltage}
                      onChange={(e) => handleInputChange("ac_output_voltage", e.target.value)}
                      error={acVoltageOutRange}
                      helperText={
                        acVoltageOutRange
                          ? `Warning: Voltage is outside normal bounds (${isThreePhase ? "380V - 440V" : "210V - 250V"})`
                          : `Normal: ${isThreePhase ? "380V - 440V (Three Phase)" : "210V - 250V (Single Phase)"}`
                      }
                    />
                  </Grid>

                  {/* Meter Serial Number */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Net Meter Serial Number"
                      placeholder="e.g. DISCOM-NM-882910"
                      value={formData.meter_serial_number}
                      onChange={(e) => handleInputChange("meter_serial_number", e.target.value)}
                      helperText="Serial printed on DISCOM net meter plate"
                    />
                  </Grid>

                  {/* Net Meter Import Reading (kWh) */}
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Net Meter Import (kWh)"
                      placeholder="e.g. 10.5"
                      inputProps={{ step: "any" }}
                      value={formData.net_meter_import_kwh}
                      onChange={(e) => handleInputChange("net_meter_import_kwh", e.target.value)}
                      helperText="Energy consumed from grid"
                    />
                  </Grid>

                  {/* Net Meter Export Reading (kWh) */}
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Net Meter Export (kWh)"
                      placeholder="e.g. 0.0"
                      inputProps={{ step: "any" }}
                      value={formData.net_meter_export_kwh}
                      onChange={(e) => handleInputChange("net_meter_export_kwh", e.target.value)}
                      helperText="Solar energy sent to grid"
                    />
                  </Grid>

                  {/* Solar Generation Baseline Meter (kWh) */}
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Solar Generation (kWh)"
                      placeholder="e.g. 2.4"
                      inputProps={{ step: "any" }}
                      value={formData.generation_meter_kwh}
                      onChange={(e) => handleInputChange("generation_meter_kwh", e.target.value)}
                      helperText="Cumulative solar generation"
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* SECTION 2: SAFETY & ELECTRICAL PROTECTION TESTS */}
              <Box>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.04em", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                  <SecurityIcon sx={{ color: COLORS.warning, fontSize: 18 }} />
                  Section 2: Anti-Islanding & Safety Protection Tests
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mb: 2 }}>
                  Verify electrical cutoff thresholds and insulation readings. Tests default to unselected to prevent accidental approval.
                </Typography>

                <Grid container spacing={2}>
                  {/* Anti-Islanding Test - CRUCIAL SAFETY */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 1.5, borderRadius: "8px", border: `1px solid ${formData.anti_islanding_test === "Pass" ? "#A7F3D0" : formData.anti_islanding_test === "Fail" ? "#FECACA" : COLORS.border}`, backgroundColor: "#F8FAFC" }}>
                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: COLORS.textPrimary }}>
                        Anti-Islanding Protection Test *
                      </Typography>
                      <Typography sx={{ fontSize: "0.68rem", color: COLORS.textSecondary, mb: 0.8 }}>
                        Inverter switches off within 2 seconds upon grid power failure (IEEE 1547 / CEA)
                      </Typography>
                      <RadioGroup
                        row
                        value={formData.anti_islanding_test}
                        onChange={(e) => handleInputChange("anti_islanding_test", e.target.value)}
                      >
                        <FormControlLabel value="Pass" control={<Radio size="small" color="success" />} label={<Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#16A34A" }}>Pass</Typography>} />
                        <FormControlLabel value="Fail" control={<Radio size="small" color="error" />} label={<Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#DC2626" }}>Fail</Typography>} />
                      </RadioGroup>
                    </Box>
                  </Grid>

                  {/* Safety Shutdowns */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 1.5, borderRadius: "8px", border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC" }}>
                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: COLORS.textPrimary }}>
                        Emergency AC/DC Isolator Trip Test
                      </Typography>
                      <Typography sx={{ fontSize: "0.68rem", color: COLORS.textSecondary, mb: 0.8 }}>
                        Manual rotary isolators trip and disconnect cleanly
                      </Typography>
                      <RadioGroup
                        row
                        value={formData.safety_shutdowns}
                        onChange={(e) => handleInputChange("safety_shutdowns", e.target.value)}
                      >
                        <FormControlLabel value="Pass" control={<Radio size="small" color="success" />} label={<Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#16A34A" }}>Pass</Typography>} />
                        <FormControlLabel value="Fail" control={<Radio size="small" color="error" />} label={<Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#DC2626" }}>Fail</Typography>} />
                      </RadioGroup>
                    </Box>
                  </Grid>

                  {/* Grounding / Earthing Check + Earth Resistance (Ω) */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 1.5, borderRadius: "8px", border: `1px solid ${isEarthResistanceHigh ? "#FECACA" : COLORS.border}`, backgroundColor: "#F8FAFC" }}>
                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: COLORS.textPrimary }}>
                        Grounding Continuity & Earth Resistance
                      </Typography>
                      <RadioGroup
                        row
                        value={formData.grounding_check}
                        onChange={(e) => handleInputChange("grounding_check", e.target.value)}
                        sx={{ mb: 1 }}
                      >
                        <FormControlLabel value="Pass" control={<Radio size="small" color="success" />} label={<Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#16A34A" }}>Pass</Typography>} />
                        <FormControlLabel value="Fail" control={<Radio size="small" color="error" />} label={<Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#DC2626" }}>Fail</Typography>} />
                      </RadioGroup>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Measured Earth Resistance (Ω)"
                        placeholder="e.g. 2.8"
                        inputProps={{ step: "0.1", min: 0 }}
                        value={formData.earth_resistance_ohm}
                        onChange={(e) => handleInputChange("earth_resistance_ohm", e.target.value)}
                        error={isEarthResistanceHigh}
                        helperText={isEarthResistanceHigh ? "Warning: Earth resistance exceeds 5 Ω safety threshold" : "Standard requirement: < 5.0 Ω"}
                      />
                    </Box>
                  </Grid>

                  {/* Wiring Insulation + Megger Value (MΩ) */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 1.5, borderRadius: "8px", border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC" }}>
                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: COLORS.textPrimary }}>
                        Wiring Insulation & Megger Resistance
                      </Typography>
                      <RadioGroup
                        row
                        value={formData.wiring_insulation}
                        onChange={(e) => handleInputChange("wiring_insulation", e.target.value)}
                        sx={{ mb: 1 }}
                      >
                        <FormControlLabel value="Pass" control={<Radio size="small" color="success" />} label={<Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#16A34A" }}>Pass</Typography>} />
                        <FormControlLabel value="Fail" control={<Radio size="small" color="error" />} label={<Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#DC2626" }}>Fail</Typography>} />
                      </RadioGroup>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Insulation Resistance (MΩ)"
                        placeholder="e.g. 50"
                        inputProps={{ step: "any", min: 0 }}
                        value={formData.insulation_resistance_mohm}
                        onChange={(e) => handleInputChange("insulation_resistance_mohm", e.target.value)}
                        helperText="Standard requirement: > 1.0 MΩ (Megger test)"
                      />
                    </Box>
                  </Grid>

                  {/* Earth Leakage Test */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 1.5, borderRadius: "8px", border: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC" }}>
                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: COLORS.textPrimary }}>
                        Earth Leakage / Residual Current (RCD)
                      </Typography>
                      <Typography sx={{ fontSize: "0.68rem", color: COLORS.textSecondary, mb: 0.8 }}>
                        RCD trips within 300ms on residual current leakage
                      </Typography>
                      <RadioGroup
                        row
                        value={formData.earth_leakage}
                        onChange={(e) => handleInputChange("earth_leakage", e.target.value)}
                      >
                        <FormControlLabel value="Pass" control={<Radio size="small" color="success" />} label={<Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#16A34A" }}>Pass</Typography>} />
                        <FormControlLabel value="Fail" control={<Radio size="small" color="error" />} label={<Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#DC2626" }}>Fail</Typography>} />
                      </RadioGroup>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* SECTION 3: DECISION, CERTIFICATE & SIGN-OFF */}
              <Box>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.04em", mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                  <VerifiedIcon sx={{ color: COLORS.success, fontSize: 18 }} />
                  Section 3: Commissioning Result & Engineering Sign-Off
                </Typography>

                <Grid container spacing={2}>
                  {/* Overall Result with Auto-Follow Safety Gate */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small" required error={hasFailedTest && formData.overall_result === "Passed"}>
                      <InputLabel>Overall Technical Result *</InputLabel>
                      <Select
                        value={formData.overall_result}
                        label="Overall Technical Result *"
                        onChange={(e) => handleInputChange("overall_result", e.target.value)}
                      >
                        <MenuItem value="Pending">Pending (Testing Incomplete)</MenuItem>
                        <MenuItem value="Passed" disabled={hasFailedTest}>
                          Passed & Synchronized {hasFailedTest ? "(Blocked: Test Failed)" : ""}
                        </MenuItem>
                        <MenuItem value="Conditional Pass">Conditional Pass (Minor Fixes Needed)</MenuItem>
                        <MenuItem value="Failed">Failed (Safety Rectification Required)</MenuItem>
                      </Select>
                      {hasFailedTest && (
                        <FormHelperText error>
                          Cannot mark as Passed because one or more safety tests have Failed.
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Commissioning Date */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.6 }}>
                      Commissioning Date *
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      required
                      type="date"
                      value={formData.commission_date}
                      onChange={(e) => handleInputChange("commission_date", e.target.value)}
                      helperText="Must be on or after installation finish date"
                    />
                  </Grid>

                  {/* Commissioning Engineer Name */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      required
                      label="Commissioning Engineer Name *"
                      placeholder="e.g. Er. Vikram Singh"
                      value={formData.commissioning_engineer}
                      onChange={(e) => handleInputChange("commissioning_engineer", e.target.value)}
                    />
                  </Grid>

                  {/* Certificate Number (Auto-Generated) */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      required
                      label="Certificate Number *"
                      value={formData.certificate_number}
                      onChange={(e) => handleInputChange("certificate_number", e.target.value)}
                      helperText="Auto-generated unique serial number"
                    />
                  </Grid>

                  {/* Customer Sign-off Name */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Customer / Representative Sign-Off"
                      value={formData.customer_signature_name}
                      onChange={(e) => handleInputChange("customer_signature_name", e.target.value)}
                    />
                  </Grid>

                  {/* Checkbox Sign-Offs */}
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
                        label={<Typography sx={{ fontSize: "0.78rem" }}>Customer witnessed generation demonstration</Typography>}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.engineer_signoff}
                            onChange={(e) => handleInputChange("engineer_signoff", e.target.checked)}
                            color="success"
                            size="small"
                          />
                        }
                        label={<Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>Engineer verifies compliance with CEA / DISCOM rules</Typography>}
                      />
                    </Stack>
                  </Grid>

                  {/* TALL Multi-Line Remarks */}
                  <Grid size={{ xs: 12 }}>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.6 }}>
                      Commissioning Remarks & Engineering Observations
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Observations on grid voltage harmonics, inverter synchronization time, anti-islanding test result, customer briefing notes..."
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
            form="commissioning-form"
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
            {saving ? "Saving Certificate..." : "Save Commissioning"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
