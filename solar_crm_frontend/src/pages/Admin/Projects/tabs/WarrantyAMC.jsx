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
  Button,
  Typography,
  Divider,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormHelperText,
} from "@mui/material";

// Icons from @mui/icons-material
import VerifiedIcon from "@mui/icons-material/Verified";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import BuildIcon from "@mui/icons-material/Build";
import HandymanIcon from "@mui/icons-material/Handyman";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ShieldIcon from "@mui/icons-material/Shield";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CloseIcon from "@mui/icons-material/Close";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import FactCheckIcon from "@mui/icons-material/FactCheck";

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
  textMuted: "#94A3B8",
};

const formatDate = (dateVal) => {
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

const addYearsToDate = (baseDateStr, years) => {
  if (!baseDateStr) return "";
  try {
    const d = new Date(baseDateStr);
    if (isNaN(d.getTime())) return "";
    d.setFullYear(d.getFullYear() + parseInt(years || 0, 10));
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

const addDaysToDate = (baseDateStr, days) => {
  if (!baseDateStr) return "";
  try {
    const d = new Date(baseDateStr);
    if (isNaN(d.getTime())) return "";
    d.setDate(d.getDate() + parseInt(days || 0, 10));
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

const DEFAULT_SCHEDULED_VISITS = [
  {
    id: 1,
    quarter: "Q1 Routine Service",
    scheduled_date: "2027-02-12",
    technician: "Amit Verma (Site Supervisor)",
    scope: "Solar PV Module washing, string Voc verification, DC isolator & MCB screw torque check.",
    status: "Completed",
    completed_date: "2027-02-12",
  },
  {
    id: 2,
    quarter: "Q2 Pre-Monsoon Audit",
    scheduled_date: "2027-05-12",
    technician: "Rakesh Singh Shekhawat (QC Engineer)",
    scope: "Earth resistance Megger test (<5 Ω), lightning arrestor bonding, roof waterproofing inspection.",
    status: "Scheduled",
    completed_date: null,
  },
  {
    id: 3,
    quarter: "Q3 Post-Monsoon Health Check",
    scheduled_date: "2027-08-12",
    technician: "Vikram Rathore (Project Lead)",
    scope: "Thermal hot-spot scanning, inverter heat dissipation, cloud monitoring data logger sync.",
    status: "Scheduled",
    completed_date: null,
  },
  {
    id: 4,
    quarter: "Q4 Annual Comprehensive Audit",
    scheduled_date: "2027-11-12",
    technician: "Amit Verma (Site Supervisor)",
    scope: "Annual Performance Ratio (PR) calculation, degradation verification, AMC renewal inspection.",
    status: "Scheduled",
    completed_date: null,
  },
];

export default function WarrantyAMC({ project, projectId }) {
  const targetProjectId = projectId || project?.id;

  // Defaults: Handover on 12 Nov 2026.
  // 1st year free warranty: 12 Nov 2026 -> 11 Nov 2027
  // Paid AMC begins 1 year after handover: 12 Nov 2027 -> 11 Nov 2028
  const defaultWarrantyStart = "2026-11-12";
  const defaultFreeServiceEnd = "2027-11-11";
  const defaultAmcStart = "2027-11-12";
  const defaultAmcEnd = "2028-11-11";

  const [warrantyData, setWarrantyData] = useState(null);
  const [visits, setVisits] = useState([]);
  const [scheduledVisits, setScheduledVisits] = useState(DEFAULT_SCHEDULED_VISITS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modals
  const [warrantyModalOpen, setWarrantyModalOpen] = useState(false);
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [bannerAlert, setBannerAlert] = useState(null);

  // Form State
  const [warrantyForm, setWarrantyForm] = useState({
    warranty_certificate_no: `WAR-2026-${String(targetProjectId || 4).padStart(4, "0")}`,
    warranty_start_date: defaultWarrantyStart,
    free_service_end_date: defaultFreeServiceEnd,
    panel_product_warranty_years: 12,
    panel_product_warranty_end: addYearsToDate(defaultWarrantyStart, 12),
    panel_performance_warranty_years: 25,
    panel_performance_warranty_end: addYearsToDate(defaultWarrantyStart, 25),
    inverter_warranty_years: 5,
    inverter_warranty_end: addYearsToDate(defaultWarrantyStart, 5),
    installation_warranty_years: 5,
    installation_warranty_end: addYearsToDate(defaultWarrantyStart, 5),
    amc_start_date: defaultAmcStart,
    amc_end_date: defaultAmcEnd,
    amc_plan: "Standard",
    amc_amount: 4500.0,
    amc_payment_status: "Paid",
    amc_renewal_date: defaultAmcEnd,
    visit_frequency: "Quarterly",
    panel_serial_numbers: "JKM550-2026-001 to JKM550-2026-010 (10x 550W Tier-1 Panels)",
    inverter_serial_number: "SOL-5K-2026-8841 (5.0 kW Grid-Tied Inverter)",
    monitoring_portal_url: "https://monitoring.solaxcloud.com",
    monitoring_plant_id: "SOLAR-PLANT-004",
    monitoring_username: "rajesh.sharma@solax",
    warranty_docket_url: "https://diassignments.digiinksolutions.com/uploads/handover_dockets/DOCKET-PROJ-004-SIGNED.pdf",
  });

  const [newVisitForm, setNewVisitForm] = useState({
    visit_date: new Date().toISOString().split("T")[0],
    technician: "Amit Verma (Site Supervisor)",
    issue_reported: "Routine quarterly cleaning & electrical connection check",
    resolution: "Cleaned panels with de-ionized water, verified string voltages, inverter operating normally.",
    status: "Completed",
  });

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const getApiUrl = (endpoint) => {
    const base = import.meta.env.VITE_API_URL || "https://diassignments.digiinksolutions.com/api";
    return `${base.replace(/\/$/, "")}${endpoint}`;
  };

  // Fetch Warranty & AMC data
  const fetchData = useCallback(async () => {
    if (!targetProjectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(getApiUrl(`/projects/${targetProjectId}/warranty`), {
        headers: getAuthHeader(),
      });

      const w = res.data?.warranty;
      const v = res.data?.visits || [];

      if (w) {
        setWarrantyData(w);
        const wStart = w.warranty_start_date ? w.warranty_start_date.split("T")[0] : defaultWarrantyStart;
        const amcStart = w.amc_start_date ? w.amc_start_date.split("T")[0] : defaultAmcStart;

        setWarrantyForm({
          warranty_certificate_no: w.warranty_certificate_no || `WAR-2026-${String(targetProjectId).padStart(4, "0")}`,
          warranty_start_date: wStart,
          free_service_end_date: w.free_service_end_date ? w.free_service_end_date.split("T")[0] : addDaysToDate(wStart, 365),
          panel_product_warranty_years: w.panel_product_warranty_years || 12,
          panel_product_warranty_end: w.panel_product_warranty_end ? w.panel_product_warranty_end.split("T")[0] : addYearsToDate(wStart, 12),
          panel_performance_warranty_years: w.panel_performance_warranty_years || 25,
          panel_performance_warranty_end: w.panel_performance_warranty_end ? w.panel_performance_warranty_end.split("T")[0] : addYearsToDate(wStart, 25),
          inverter_warranty_years: w.inverter_warranty_years || 5,
          inverter_warranty_end: w.inverter_warranty_end ? w.inverter_warranty_end.split("T")[0] : addYearsToDate(wStart, 5),
          installation_warranty_years: w.installation_warranty_years || 5,
          installation_warranty_end: w.installation_warranty_end ? w.installation_warranty_end.split("T")[0] : addYearsToDate(wStart, 5),
          amc_start_date: amcStart,
          amc_end_date: w.amc_end_date ? w.amc_end_date.split("T")[0] : addYearsToDate(amcStart, 1),
          amc_plan: w.amc_plan || "Standard",
          amc_amount: w.amc_amount || 4500.0,
          amc_payment_status: w.amc_payment_status || "Paid",
          amc_renewal_date: w.amc_renewal_date ? w.amc_renewal_date.split("T")[0] : addYearsToDate(amcStart, 1),
          visit_frequency: w.visit_frequency || "Quarterly",
          panel_serial_numbers: w.panel_serial_numbers || "JKM550-2026-001 to JKM550-2026-010 (10x 550W Tier-1 Panels)",
          inverter_serial_number: w.inverter_serial_number || "SOL-5K-2026-8841 (5.0 kW Grid-Tied Inverter)",
          monitoring_portal_url: w.monitoring_portal_url || "https://monitoring.solaxcloud.com",
          monitoring_plant_id: w.monitoring_plant_id || "SOLAR-PLANT-004",
          monitoring_username: w.monitoring_username || "rajesh.sharma@solax",
          warranty_docket_url: w.warranty_docket_url || "https://diassignments.digiinksolutions.com/uploads/handover_dockets/DOCKET-PROJ-004-SIGNED.pdf",
        });

        if (Array.isArray(w.scheduled_visits) && w.scheduled_visits.length > 0) {
          setScheduledVisits(w.scheduled_visits);
        }
      }
      setVisits(v);
    } catch (err) {
      console.error("fetchData error:", err);
    } finally {
      setLoading(false);
    }
  }, [targetProjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Recalculate auto warranty dates when warranty_start_date changes
  const handleWarrantyStartDateChange = (newStart) => {
    setWarrantyForm((prev) => {
      const freeEnd = addDaysToDate(newStart, 365);
      const amcStart = addDaysToDate(freeEnd, 1);
      const amcEnd = addYearsToDate(amcStart, 1);
      return {
        ...prev,
        warranty_start_date: newStart,
        free_service_end_date: freeEnd,
        panel_product_warranty_end: addYearsToDate(newStart, prev.panel_product_warranty_years),
        panel_performance_warranty_end: addYearsToDate(newStart, prev.panel_performance_warranty_years),
        inverter_warranty_end: addYearsToDate(newStart, prev.inverter_warranty_years),
        installation_warranty_end: addYearsToDate(newStart, prev.installation_warranty_years),
        amc_start_date: amcStart,
        amc_end_date: amcEnd,
        amc_renewal_date: amcEnd,
      };
    });
  };

  // Recalculate AMC end date when amc_start_date changes
  const handleAmcStartDateChange = (newStart) => {
    setWarrantyForm((prev) => {
      const amcEnd = addYearsToDate(newStart, 1);
      return {
        ...prev,
        amc_start_date: newStart,
        amc_end_date: amcEnd,
        amc_renewal_date: amcEnd,
      };
    });
  };

  // Toggle scheduled visit status
  const handleToggleScheduledVisit = (id) => {
    const updated = scheduledVisits.map((v) => {
      if (v.id === id) {
        const nextStatus = v.status === "Completed" ? "Scheduled" : "Completed";
        return {
          ...v,
          status: nextStatus,
          completed_date: nextStatus === "Completed" ? new Date().toISOString().split("T")[0] : null,
        };
      }
      return v;
    });
    setScheduledVisits(updated);

    // Persist automatically to backend
    axios
      .post(
        getApiUrl(`/projects/${targetProjectId}/warranty`),
        { ...warrantyForm, scheduled_visits: updated },
        { headers: getAuthHeader() }
      )
      .then(() => {
        setBannerAlert({ severity: "success", message: "Service visit status updated!" });
      })
      .catch((e) => console.error(e));
  };

  // Save Warranty Form
  const handleSaveWarranty = async () => {
    setSaving(true);
    setBannerAlert(null);
    try {
      const url = getApiUrl(`/projects/${targetProjectId}/warranty`);
      const payload = {
        ...warrantyForm,
        scheduled_visits: scheduledVisits,
      };

      await axios.post(url, payload, { headers: getAuthHeader() });
      setBannerAlert({
        severity: "success",
        message: "Warranty & AMC lifecycle data saved successfully!",
      });
      setWarrantyModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Save warranty error:", err);
      setBannerAlert({
        severity: "error",
        message: err.response?.data?.message || "Failed to save warranty details.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Add Service Visit
  const handleAddVisit = async () => {
    setSaving(true);
    try {
      const url = getApiUrl(`/projects/${targetProjectId}/warranty/visits`);
      await axios.post(url, newVisitForm, { headers: getAuthHeader() });
      setBannerAlert({
        severity: "success",
        message: "New service log added successfully!",
      });
      setVisitModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Add visit error:", err);
      setBannerAlert({
        severity: "error",
        message: err.response?.data?.message || "Failed to record service visit.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
        <CircularProgress size={36} sx={{ color: COLORS.secondary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 }, maxWidth: "1280px", margin: "0 auto" }}>
      {bannerAlert && (
        <Alert
          severity={bannerAlert.severity}
          onClose={() => setBannerAlert(null)}
          sx={{ mb: 2.5, borderRadius: "10px", fontWeight: 600 }}
        >
          {bannerAlert.message}
        </Alert>
      )}

      {/* HEADER CARD: STAGE BANNER & WORKFLOW STEPPER */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: "14px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.cardBg,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
              <Box
                sx={{
                  backgroundColor: "#ECFDF5",
                  p: 0.8,
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldIcon sx={{ color: "#059669", fontSize: 24 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
                Stage 9: Warranty Certification & Annual Maintenance Contract (AMC)
              </Typography>
              <Chip
                label="Active (Free 1st Year)"
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  backgroundColor: "#DEF7EC",
                  color: "#03543F",
                  border: "1px solid #31C48D",
                }}
              />
            </Stack>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.85rem" }}>
              Multi-tier component guarantees, automated quarterly preventive maintenance schedules, and paid AMC contract lifecycle.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setWarrantyModalOpen(true)}
              sx={{
                backgroundColor: COLORS.primary,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.82rem",
                borderRadius: "8px",
                px: 2.5,
                py: 0.9,
                "&:hover": { backgroundColor: "#020617" },
              }}
            >
              Update Warranty & AMC
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setVisitModalOpen(true)}
              sx={{
                borderColor: COLORS.border,
                color: COLORS.primary,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.82rem",
                borderRadius: "8px",
                px: 2,
                "&:hover": { borderColor: COLORS.primary },
              }}
            >
              Log Unscheduled Visit
            </Button>
          </Stack>
        </Stack>

        {/* WORKFLOW PIPELINE BREADCRUMB WITH BACKDATED TIMELINE */}
        <Box
          sx={{
            p: 1.5,
            borderRadius: "10px",
            backgroundColor: "#F1F5F9",
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
            fontSize: "0.75rem",
            color: COLORS.textSecondary,
          }}
        >
          <Typography component="span" sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.primary }}>
            Verified Solar EPC Timeline:
          </Typography>
          <span>Pre-Install (25 Oct)</span>
          <span>→</span>
          <span>Procurement (28 Oct)</span>
          <span>→</span>
          <span>Installation (04 Nov)</span>
          <span>→</span>
          <span>Commissioning (08 Nov)</span>
          <span>→</span>
          <span>QC Pass (10 Nov)</span>
          <span>→</span>
          <span>Handover (12 Nov)</span>
          <span>→</span>
          <Chip
            label="Warranty & AMC Active"
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: "0.7rem",
              backgroundColor: "#059669",
              color: "#FFF",
              height: 22,
            }}
          />
          <span>→</span>
          <span>Paid AMC Starts (12 Nov 2027)</span>
        </Box>
      </Paper>

      {/* ASSET IDENTIFICATION & CERTIFICATE CARD */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: "14px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.cardBg,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ p: 1, borderRadius: "8px", backgroundColor: "#EFF6FF" }}>
                <VerifiedIcon sx={{ color: "#2563EB" }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  Warranty Certificate #
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: COLORS.primary }}>
                  {warrantyForm.warranty_certificate_no}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Typography sx={{ fontSize: "0.7rem", color: COLORS.textSecondary }}>Warranty Start Date</Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
              {formatDate(warrantyForm.warranty_start_date)}
            </Typography>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Typography sx={{ fontSize: "0.7rem", color: COLORS.textSecondary }}>Free 1st-Year Service</Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: "#059669" }}>
              Ends {formatDate(warrantyForm.free_service_end_date)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3} sx={{ textAlign: { xs: "left", md: "right" } }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PictureAsPdfIcon sx={{ color: "#DC2626" }} />}
              endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
              href={warrantyForm.warranty_docket_url}
              target="_blank"
              rel="noreferrer"
              sx={{
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "none",
                borderColor: COLORS.border,
                color: COLORS.primary,
              }}
            >
              View Signed Docket
            </Button>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* ASSET SERIAL NUMBERS & MONITORING PORTAL */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>
              Registered Component Hardware Serial Numbers:
            </Typography>
            <Box sx={{ p: 1.2, borderRadius: "8px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary }}>
                • Panels: {warrantyForm.panel_serial_numbers}
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary }}>
                • Inverter: {warrantyForm.inverter_serial_number}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textMuted, mb: 0.5 }}>
              Cloud Generation Monitoring Portal:
            </Typography>
            <Box sx={{ p: 1.2, borderRadius: "8px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: "#2563EB" }}>
                  {warrantyForm.monitoring_portal_url}
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>
                  Plant ID: <strong>{warrantyForm.monitoring_plant_id}</strong> | User: <strong>{warrantyForm.monitoring_username}</strong>
                </Typography>
              </Box>
              <Chip label="Connected" size="small" sx={{ height: 20, fontSize: "0.68rem", fontWeight: 800, backgroundColor: "#DCFCE7", color: "#166534" }} />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 4-TIER GRANULAR WARRANTY CARDS (EACH WITH AUTO-CALCULATED END DATE) */}
      <Box sx={{ mb: 3 }}>
        <Typography
          sx={{
            fontSize: "0.8rem",
            fontWeight: 800,
            color: COLORS.primary,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            mb: 1.5,
          }}
        >
          Independent Component Warranties (Start Date: {formatDate(warrantyForm.warranty_start_date)})
        </Typography>

        <Grid container spacing={2}>
          {/* PANEL PRODUCT WARRANTY */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.cardBg,
                height: "100%",
                borderTop: "4px solid #0284C7",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <SolarPowerIcon sx={{ color: "#0284C7", fontSize: 20 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: COLORS.textPrimary }}>
                  Panel Product Warranty
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: COLORS.primary }}>
                {warrantyForm.panel_product_warranty_years} Years
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mb: 1 }}>
                Materials & Manufacturing Workmanship
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                Valid Until:{" "}
                <strong style={{ color: COLORS.textPrimary }}>
                  {formatDate(warrantyForm.panel_product_warranty_end)}
                </strong>
              </Typography>
            </Paper>
          </Grid>

          {/* PANEL PERFORMANCE WARRANTY */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.cardBg,
                height: "100%",
                borderTop: "4px solid #2563EB",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <FactCheckIcon sx={{ color: "#2563EB", fontSize: 20 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: COLORS.textPrimary }}>
                  Panel Power Performance
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: COLORS.primary }}>
                {warrantyForm.panel_performance_warranty_years} Years
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mb: 1 }}>
                Linear Retention Guarantee (&gt;84.8% at 25y)
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                Valid Until:{" "}
                <strong style={{ color: COLORS.textPrimary }}>
                  {formatDate(warrantyForm.panel_performance_warranty_end)}
                </strong>
              </Typography>
            </Paper>
          </Grid>

          {/* INVERTER REPLACEMENT WARRANTY */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.cardBg,
                height: "100%",
                borderTop: "4px solid #D97706",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <ElectricBoltIcon sx={{ color: "#D97706", fontSize: 20 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: COLORS.textPrimary }}>
                  Grid Inverter Warranty
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: COLORS.primary }}>
                {warrantyForm.inverter_warranty_years} Years
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mb: 1 }}>
                OEM Inverter Hardware Replacement
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                Valid Until:{" "}
                <strong style={{ color: COLORS.textPrimary }}>
                  {formatDate(warrantyForm.inverter_warranty_end)}
                </strong>
              </Typography>
            </Paper>
          </Grid>

          {/* EPC WORKMANSHIP WARRANTY */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.cardBg,
                height: "100%",
                borderTop: "4px solid #059669",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <BuildIcon sx={{ color: "#059669", fontSize: 20 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: COLORS.textPrimary }}>
                  EPC Installation Warranty
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: COLORS.primary }}>
                {warrantyForm.installation_warranty_years} Years
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mb: 1 }}>
                GI Rooftop Structure & Waterproofing
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                Valid Until:{" "}
                <strong style={{ color: COLORS.textPrimary }}>
                  {formatDate(warrantyForm.installation_warranty_end)}
                </strong>
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* AMC CONTRACT & COVERAGE DETAILS */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: "14px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.cardBg,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.8rem",
            fontWeight: 800,
            color: COLORS.primary,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            mb: 1.5,
          }}
        >
          Paid Annual Maintenance Contract (Starts Post Free Period: {formatDate(warrantyForm.amc_start_date)})
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, borderRadius: "10px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}`, height: "100%" }}>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted, textTransform: "uppercase", fontWeight: 800 }}>
                Selected Plan
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.primary }}>
                  {warrantyForm.amc_plan} AMC Plan
                </Typography>
                <Chip label={warrantyForm.visit_frequency} size="small" sx={{ fontWeight: 800, height: 22 }} />
              </Stack>
              <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, lineHeight: 1.5 }}>
                {warrantyForm.amc_plan === "Basic"
                  ? "Covers quarterly module washing & dust cleaning only."
                  : warrantyForm.amc_plan === "Premium"
                  ? "Comprehensive: Cleaning + Inverter diagnostics + Consumables replacement (MCB/fuses) + Earth pit treatment + 24hr priority breakdown."
                  : "Standard: Module washing + Inverter health inspection + Electrical terminal torque & generation performance audit."}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ p: 2, borderRadius: "10px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}`, height: "100%" }}>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted, textTransform: "uppercase", fontWeight: 800 }}>
                Commercial Terms & Fee
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.primary, mt: 0.5 }}>
                ₹{Number(warrantyForm.amc_amount || 4500).toLocaleString("en-IN")}{" "}
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: COLORS.textMuted }}>/ year</span>
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mt: 0.5 }}>
                Calculated for 5.45 kW system (₹1,125 per quarterly visit)
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                <Chip
                  icon={<CheckCircleIcon />}
                  label={`Payment Status: ${warrantyForm.amc_payment_status}`}
                  size="small"
                  sx={{ fontWeight: 800, backgroundColor: "#DCFCE7", color: "#166534" }}
                />
              </Stack>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ p: 2, borderRadius: "10px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}`, height: "100%" }}>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted, textTransform: "uppercase", fontWeight: 800 }}>
                Contract Term & Renewal
              </Typography>
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: COLORS.textPrimary, mt: 0.5 }}>
                Effective: {formatDate(warrantyForm.amc_start_date)} — {formatDate(warrantyForm.amc_end_date)}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mt: 0.5 }}>
                Renewal Date: <strong>{formatDate(warrantyForm.amc_renewal_date)}</strong>
              </Typography>
              <Alert severity="info" sx={{ mt: 1.5, py: 0.2, px: 1, fontSize: "0.72rem" }}>
                Auto Reminder: Renewal invoice will trigger 30 days prior to contract expiry.
              </Alert>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* AUTOMATED PREVENTIVE SERVICE VISIT SCHEDULE (4 QUARTERLY VISITS) */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: "14px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.cardBg,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
              Preventive Maintenance Visit Schedule (4 Quarterly Visits)
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.75rem" }}>
              Automated service intervals with technical scope. Click status to mark visits Done.
            </Typography>
          </Box>
        </Stack>

        <TableContainer sx={{ borderRadius: "10px", border: `1px solid ${COLORS.border}` }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.textPrimary }}>Quarter / Milestone</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.textPrimary }}>Scheduled Date</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.textPrimary }}>Assigned Engineer</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.textPrimary }}>Preventive Maintenance Scope</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.textPrimary, textAlign: "center" }}>Status Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scheduledVisits.map((v) => (
                <TableRow key={v.id} sx={{ "&:hover": { backgroundColor: "#F8FAFC" } }}>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.8rem", color: COLORS.primary }}>
                    {v.quarter}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem", color: COLORS.textPrimary }}>
                    {formatDate(v.scheduled_date)}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}>
                    {v.technician}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                    {v.scope}
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <Tooltip title="Click to toggle Done/Scheduled">
                      <Chip
                        icon={v.status === "Completed" ? <CheckCircleIcon /> : <CalendarMonthIcon />}
                        label={v.status === "Completed" ? "Completed" : "Scheduled"}
                        size="small"
                        onClick={() => handleToggleScheduledVisit(v.id)}
                        sx={{
                          cursor: "pointer",
                          fontWeight: 800,
                          fontSize: "0.72rem",
                          backgroundColor: v.status === "Completed" ? "#DCFCE7" : "#FEF3C7",
                          color: v.status === "Completed" ? "#166534" : "#92400E",
                          "&:hover": { opacity: 0.8 },
                        }}
                      />
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* UNSCHEDULED / HISTORICAL SERVICE VISIT LOGS */}
      {visits.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: "14px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.cardBg,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.textPrimary, mb: 1.5 }}>
            Historical Field Service Logs ({visits.length})
          </Typography>

          <TableContainer sx={{ borderRadius: "10px", border: `1px solid ${COLORS.border}` }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem" }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem" }}>Technician</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem" }}>Issue / Scope</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem" }}>Resolution</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem" }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visits.map((vis) => (
                  <TableRow key={vis.id}>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem" }}>{formatDate(vis.visit_date)}</TableCell>
                    <TableCell sx={{ fontSize: "0.78rem" }}>{vis.technician || "—"}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem" }}>{vis.issue_reported || "Routine service"}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem" }}>{vis.resolution || "—"}</TableCell>
                    <TableCell>
                      <Chip label={vis.status || "Completed"} size="small" sx={{ fontWeight: 800, fontSize: "0.7rem", height: 22 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* EDIT MODAL: SPACIOUS maxWidth="md" WITH FIXED DATE LABELS (NO OVERLAPPING!) */}
      <Dialog
        open={warrantyModalOpen}
        onClose={() => !saving && setWarrantyModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "16px", p: 1 },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            fontSize: "1.1rem",
            color: COLORS.textPrimary,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Update Warranty Certification & Annual Maintenance Contract
          <IconButton size="small" onClick={() => setWarrantyModalOpen(false)} disabled={saving}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: COLORS.border, py: 2.5 }}>
          <Stack spacing={3}>
            {/* GROUP 1: WARRANTY DATES & CERTIFICATE */}
            <Box>
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: COLORS.primary,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  mb: 1.5,
                }}
              >
                1. Warranty Certificate & Free Service Period
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Warranty Certificate # *"
                    value={warrantyForm.warranty_certificate_no}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, warranty_certificate_no: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    required
                    label="Warranty Start Date *"
                    InputLabelProps={{ shrink: true }}
                    value={warrantyForm.warranty_start_date}
                    helperText="Starts on Handover Date (12 Nov 2026)"
                    onChange={(e) => handleWarrantyStartDateChange(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    required
                    label="Free 1st-Year Service Ends *"
                    InputLabelProps={{ shrink: true }}
                    value={warrantyForm.free_service_end_date}
                    helperText="1 Year from Handover (11 Nov 2027)"
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, free_service_end_date: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* GROUP 2: INDEPENDENT COMPONENT WARRANTIES */}
            <Box>
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: COLORS.primary,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  mb: 1.5,
                }}
              >
                2. Multi-Component Warranty Durations (Auto-Calculates End Dates)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Panel Product (Yrs) *"
                    value={warrantyForm.panel_product_warranty_years}
                    onChange={(e) => {
                      const yrs = e.target.value;
                      setWarrantyForm({
                        ...warrantyForm,
                        panel_product_warranty_years: yrs,
                        panel_product_warranty_end: addYearsToDate(warrantyForm.warranty_start_date, yrs),
                      });
                    }}
                  />
                  <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, mt: 0.5 }}>
                    Expires: {formatDate(warrantyForm.panel_product_warranty_end)}
                  </Typography>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Panel Power (Yrs) *"
                    value={warrantyForm.panel_performance_warranty_years}
                    onChange={(e) => {
                      const yrs = e.target.value;
                      setWarrantyForm({
                        ...warrantyForm,
                        panel_performance_warranty_years: yrs,
                        panel_performance_warranty_end: addYearsToDate(warrantyForm.warranty_start_date, yrs),
                      });
                    }}
                  />
                  <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, mt: 0.5 }}>
                    Expires: {formatDate(warrantyForm.panel_performance_warranty_end)}
                  </Typography>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Inverter (Yrs) *"
                    value={warrantyForm.inverter_warranty_years}
                    onChange={(e) => {
                      const yrs = e.target.value;
                      setWarrantyForm({
                        ...warrantyForm,
                        inverter_warranty_years: yrs,
                        inverter_warranty_end: addYearsToDate(warrantyForm.warranty_start_date, yrs),
                      });
                    }}
                  />
                  <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, mt: 0.5 }}>
                    Expires: {formatDate(warrantyForm.inverter_warranty_end)}
                  </Typography>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="EPC Workmanship (Yrs) *"
                    value={warrantyForm.installation_warranty_years}
                    onChange={(e) => {
                      const yrs = e.target.value;
                      setWarrantyForm({
                        ...warrantyForm,
                        installation_warranty_years: yrs,
                        installation_warranty_end: addYearsToDate(warrantyForm.warranty_start_date, yrs),
                      });
                    }}
                  />
                  <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, mt: 0.5 }}>
                    Expires: {formatDate(warrantyForm.installation_warranty_end)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* GROUP 3: AMC PLAN, COMMERCIALS & DATES */}
            <Box>
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: COLORS.primary,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  mb: 1.5,
                }}
              >
                3. Paid Annual Maintenance Contract (AMC) Setup
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    required
                    label="AMC Start Date *"
                    InputLabelProps={{ shrink: true }}
                    value={warrantyForm.amc_start_date}
                    helperText="Starts day after free service ends"
                    onChange={(e) => handleAmcStartDateChange(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    required
                    label="AMC End Date *"
                    InputLabelProps={{ shrink: true }}
                    value={warrantyForm.amc_end_date}
                    helperText="Auto calculated 1 year"
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, amc_end_date: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Next AMC Renewal Date *"
                    InputLabelProps={{ shrink: true }}
                    value={warrantyForm.amc_renewal_date}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, amc_renewal_date: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="amc-plan-label">AMC Plan Coverage *</InputLabel>
                    <Select
                      labelId="amc-plan-label"
                      label="AMC Plan Coverage *"
                      value={warrantyForm.amc_plan}
                      onChange={(e) => {
                        const plan = e.target.value;
                        const amt = plan === "Basic" ? 3000 : plan === "Premium" ? 7500 : 4500;
                        setWarrantyForm({ ...warrantyForm, amc_plan: plan, amc_amount: amt });
                      }}
                    >
                      <MenuItem value="Basic">Basic (Cleaning Only - ₹3,000/yr)</MenuItem>
                      <MenuItem value="Standard">Standard (Cleaning + Inspection - ₹4,500/yr)</MenuItem>
                      <MenuItem value="Premium">Premium (Cleaning + Inspection + Parts - ₹7,500/yr)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="AMC Annual Amount (₹) *"
                    value={warrantyForm.amc_amount}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, amc_amount: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="amc-pay-label">AMC Payment Status *</InputLabel>
                    <Select
                      labelId="amc-pay-label"
                      label="AMC Payment Status *"
                      value={warrantyForm.amc_payment_status}
                      onChange={(e) => setWarrantyForm({ ...warrantyForm, amc_payment_status: e.target.value })}
                    >
                      <MenuItem value="Paid">Paid (Confirmed)</MenuItem>
                      <MenuItem value="Pending">Pending Payment</MenuItem>
                      <MenuItem value="Due">Due for Renewal</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* GROUP 4: SERIAL NUMBERS & MONITORING CREDENTIALS */}
            <Box>
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: COLORS.primary,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  mb: 1.5,
                }}
              >
                4. Component Serial Numbers & Monitoring Portal
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Solar Panel Serial Numbers"
                    value={warrantyForm.panel_serial_numbers}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, panel_serial_numbers: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Solar Inverter Serial Number"
                    value={warrantyForm.inverter_serial_number}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, inverter_serial_number: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Monitoring Portal URL"
                    value={warrantyForm.monitoring_portal_url}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, monitoring_portal_url: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Monitoring Plant ID"
                    value={warrantyForm.monitoring_plant_id}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, monitoring_plant_id: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Client Monitoring Username"
                    value={warrantyForm.monitoring_username}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, monitoring_username: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setWarrantyModalOpen(false)}
            disabled={saving}
            sx={{ textTransform: "none", fontWeight: 600, color: COLORS.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveWarranty}
            disabled={saving}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              backgroundColor: COLORS.primary,
              px: 3,
              "&:hover": { backgroundColor: "#020617" },
            }}
          >
            {saving ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Save Warranty & AMC"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: LOG UNSCHEDULED VISIT */}
      <Dialog
        open={visitModalOpen}
        onClose={() => !saving && setVisitModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "16px", p: 1 },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            fontSize: "1.1rem",
            color: COLORS.textPrimary,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Log Field Service / Maintenance Visit
          <IconButton size="small" onClick={() => setVisitModalOpen(false)} disabled={saving}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: COLORS.border, py: 2.5 }}>
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              size="small"
              type="date"
              required
              label="Visit Date *"
              InputLabelProps={{ shrink: true }}
              value={newVisitForm.visit_date}
              onChange={(e) => setNewVisitForm({ ...newVisitForm, visit_date: e.target.value })}
            />

            <TextField
              fullWidth
              size="small"
              label="Attending Technician / Engineer *"
              value={newVisitForm.technician}
              onChange={(e) => setNewVisitForm({ ...newVisitForm, technician: e.target.value })}
            />

            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              label="Issue Reported / Scope of Work *"
              value={newVisitForm.issue_reported}
              onChange={(e) => setNewVisitForm({ ...newVisitForm, issue_reported: e.target.value })}
            />

            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              label="Action Taken / Resolution *"
              value={newVisitForm.resolution}
              onChange={(e) => setNewVisitForm({ ...newVisitForm, resolution: e.target.value })}
            />

            <FormControl fullWidth size="small">
              <InputLabel id="visit-status-label">Visit Status *</InputLabel>
              <Select
                labelId="visit-status-label"
                label="Visit Status *"
                value={newVisitForm.status}
                onChange={(e) => setNewVisitForm({ ...newVisitForm, status: e.target.value })}
              >
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Pending">Pending Followup</MenuItem>
                <MenuItem value="Escalated">Escalated to OEM</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setVisitModalOpen(false)}
            disabled={saving}
            sx={{ textTransform: "none", fontWeight: 600, color: COLORS.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddVisit}
            disabled={saving}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              backgroundColor: COLORS.primary,
              px: 3,
              "&:hover": { backgroundColor: "#020617" },
            }}
          >
            {saving ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Save Service Log"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
