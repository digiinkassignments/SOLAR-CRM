import AmcPlanManager from '../../../../components/AmcPlanManager';
import { AMC_FREQUENCIES } from '../../../../utils/amcPlans';
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import api from "../../../../api/axios";
import {
  Box,
  Grid,
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
} from "@mui/material";

// Icons from @mui/icons-material
import VerifiedIcon from "@mui/icons-material/Verified";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import BuildIcon from "@mui/icons-material/Build";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ShieldIcon from "@mui/icons-material/Shield";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
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
  if (!baseDateStr || years === "" || years == null) return "";
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

export default function WarrantyAMC({ project, projectId }) {
  const targetProjectId = project?.id || projectId;

  // Use the project's actual handover date when recorded; leave dates blank otherwise.
  const defaultWarrantyStart = project?.warranty_anchor_date?.split("T")[0] || project?.completion_date?.split("T")[0] || "";
  const defaultFreeServiceEnd = addDaysToDate(defaultWarrantyStart, 365);

  const [companyPlans, setCompanyPlans] = useState([]);
  const [planError, setPlanError] = useState('');
  const loadPlans = useCallback(async () => {
    try { const response = await api.get('/amc-plans'); setCompanyPlans(response.data.plans || []); setPlanError(''); }
    catch { setPlanError('Could not load company AMC plans. Retry before selecting a plan.'); }
  }, []);
  useEffect(() => { loadPlans(); }, [loadPlans]);
  const [warrantyData, setWarrantyData] = useState(null);
  const [visits, setVisits] = useState([]);
  const [scheduledVisits, setScheduledVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modals
  const [warrantyModalOpen, setWarrantyModalOpen] = useState(false);
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [bannerAlert, setBannerAlert] = useState(null);

  // Form State
  const [warrantyForm, setWarrantyForm] = useState({
    warranty_certificate_no: `WAR-${new Date().getFullYear()}-${String(targetProjectId).padStart(4, "0")}`,
    warranty_start_date: defaultWarrantyStart,
    free_service_end_date: defaultFreeServiceEnd,
    panel_product_warranty_years: "",
    panel_product_warranty_end: "",
    panel_performance_warranty_years: "",
    panel_performance_warranty_end: "",
    inverter_warranty_years: "",
    inverter_warranty_end: "",
    installation_warranty_years: "",
    installation_warranty_end: "",
    amc_start_date: "",
    amc_end_date: "",
    amc_plan: "",
    amc_plan_id: null,
    amc_plan_snapshot: null,
    amc_apply_plan: false,
    amc_amount: "",
    amc_payment_status: "",
    amc_renewal_date: "",
    visit_frequency: "",
    panel_serial_numbers: "",
    inverter_serial_number: "",
    monitoring_portal_url: "",
    monitoring_plant_id: "",
    monitoring_username: "",
    warranty_docket_url: "",
  });
  const serviceVisitsPerYear = { Monthly: 12, Quarterly: 4, "Half-yearly": 2, Annual: 1 }[warrantyForm.visit_frequency] || 0;
  const annualAmcFee = warrantyForm.amc_amount === "" ? null : Number(warrantyForm.amc_amount);
  const amcFeePerVisit = serviceVisitsPerYear && annualAmcFee !== null ? annualAmcFee / serviceVisitsPerYear : null;

  const [newVisitForm, setNewVisitForm] = useState({
    visit_date: new Date().toISOString().split("T")[0],
    technician: "",
    issue_reported: "",
    resolution: "",
    status: "Pending",
  });

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const getApiUrl = (endpoint) => {
    const base = api.defaults.baseURL || "/api";
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
        const wStart = defaultWarrantyStart || (w.warranty_start_date ? w.warranty_start_date.split("T")[0] : "");
        const amcStart = w.amc_start_date ? w.amc_start_date.split("T")[0] : "";

        setWarrantyForm({
          warranty_certificate_no: w.warranty_certificate_no || `WAR-${new Date().getFullYear()}-${String(targetProjectId).padStart(4, "0")}`,
          warranty_start_date: wStart,
          free_service_end_date: w.free_service_end_date ? w.free_service_end_date.split("T")[0] : addDaysToDate(wStart, 365),
          panel_product_warranty_years: w.panel_product_warranty_years ?? "",
          panel_product_warranty_end: w.panel_product_warranty_end ? w.panel_product_warranty_end.split("T")[0] : addYearsToDate(wStart, w.panel_product_warranty_years),
          panel_performance_warranty_years: w.panel_performance_warranty_years ?? "",
          panel_performance_warranty_end: w.panel_performance_warranty_end ? w.panel_performance_warranty_end.split("T")[0] : addYearsToDate(wStart, w.panel_performance_warranty_years),
          inverter_warranty_years: w.inverter_warranty_years ?? "",
          inverter_warranty_end: w.inverter_warranty_end ? w.inverter_warranty_end.split("T")[0] : addYearsToDate(wStart, w.inverter_warranty_years),
          installation_warranty_years: w.installation_warranty_years ?? "",
          installation_warranty_end: w.installation_warranty_end ? w.installation_warranty_end.split("T")[0] : addYearsToDate(wStart, w.installation_warranty_years),
          amc_start_date: amcStart,
          amc_end_date: w.amc_end_date ? w.amc_end_date.split("T")[0] : "",
          amc_plan: w.amc_plan || "",
          amc_plan_id: w.amc_plan_id || null,
          amc_plan_snapshot: w.amc_plan_snapshot || null,
          amc_apply_plan: false,
          amc_amount: w.amc_amount ?? "",
          amc_payment_status: w.amc_payment_status || "",
          amc_renewal_date: w.amc_renewal_date ? w.amc_renewal_date.split("T")[0] : "",
          visit_frequency: w.visit_frequency || "",
          panel_serial_numbers: w.panel_serial_numbers || "",
          inverter_serial_number: w.inverter_serial_number || "",
          monitoring_portal_url: w.monitoring_portal_url || "",
          monitoring_plant_id: w.monitoring_plant_id || "",
          monitoring_username: w.monitoring_username || "",
          warranty_docket_url: w.warranty_docket_url || "",
        });

        setScheduledVisits(Array.isArray(w.scheduled_visits) ? w.scheduled_visits : []);
      }
      setVisits(v);
    } catch (err) {
      console.error("fetchData error:", err);
    } finally {
      setLoading(false);
    }
  }, [targetProjectId, defaultWarrantyStart]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Recalculate auto warranty dates when warranty_start_date changes
  const handleWarrantyStartDateChange = (newStart) => {
    setWarrantyForm((prev) => {
      const freeEnd = addDaysToDate(newStart, 365);
      const amcStart = addDaysToDate(freeEnd, 1);
      const amcEnd = planEndDate(amcStart, prev.amc_plan_snapshot?.term_months || 12);
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

  const planEndDate = (start, months) => {
    if (!start) return '';
    const [year, month, day] = start.split('-').map(Number);
    const end = new Date(Date.UTC(year, month - 1 + Number(months), 1));
    const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
    end.setUTCDate(Math.min(day, lastDay));
    end.setUTCDate(end.getUTCDate() - 1);
    return end.toISOString().slice(0, 10);
  };
  const selectPlan = id => {
    const plan = companyPlans.find(p => Number(p.id) === Number(id) && Number(p.is_active));
    if (!plan) return;
    setWarrantyForm(prev => ({ ...prev, amc_plan: plan.name, amc_plan_id: plan.id,
      amc_plan_version: plan.version, amc_apply_plan: true, amc_plan_snapshot: plan,
      amc_amount: plan.annual_amount, visit_frequency: plan.visit_frequency,
      amc_end_date: planEndDate(prev.amc_start_date, plan.term_months),
      amc_renewal_date: planEndDate(prev.amc_start_date, plan.term_months) }));
  };
  // Recalculate AMC end date when amc_start_date changes
  const handleAmcStartDateChange = (newStart) => {
    setWarrantyForm((prev) => {
      const amcEnd = planEndDate(newStart, prev.amc_plan_snapshot?.term_months || 12);
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
        amc_plan: warrantyForm.amc_plan || null,
        amc_plan_id: warrantyForm.amc_plan_id || undefined,
        amc_amount: warrantyForm.amc_amount === "" ? null : Number(warrantyForm.amc_amount),
        amc_payment_status: warrantyForm.amc_payment_status || null,
        amc_renewal_date: warrantyForm.amc_renewal_date || null,
        visit_frequency: warrantyForm.visit_frequency || null,
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
    <Box sx={{ p: 0, width: "100%", minWidth: 0 }}>
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


          spacing={2}
          sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexWrap: "wrap", mb: 2 }}
        >
          <Box sx={{ flex: "1 1 320px", minWidth: 0, maxWidth: "100%" }}>
            <Stack direction="row"  spacing={1.5} sx={{alignItems: "center",  mb: 0.5 }}>
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
                Warranty & AMC
              </Typography>
              <Chip
                label={warrantyData ? "Warranty record saved" : "Not configured"}
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
              Component warranties, recorded service visits and company-defined AMC contracts.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", maxWidth: "100%", minWidth: 0 }}>
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

        <Alert severity="info" sx={{ mt: 2 }}>
          Current project milestone: {project?.stage || "Not recorded"}. Check Stage History for saved changes and dates.
        </Alert>
      </Paper>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">AMC plans are defined by your company. Select a plan explicitly for each contract.</Typography>
        <AmcPlanManager onChanged={loadPlans} />
      </Stack>
      {planError && <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={loadPlans}>Retry</Button>}>{planError}</Alert>}
      {!warrantyData && <Alert severity="info" sx={{ mb: 3 }}>No warranty or AMC record has been saved. Values below are draft setup values; confirm dates, terms and hardware details before saving.</Alert>}
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
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Stack sx={{ alignItems: "center" }} direction="row" spacing={1.5} >
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

          <Grid size={{ xs: 6, sm: 6, md: 4 }}>
            <Typography sx={{ fontSize: "0.7rem", color: COLORS.textSecondary }}>Warranty Start Date</Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
              {formatDate(warrantyForm.warranty_start_date)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6, sm: 6, md: 4 }}>
            <Typography sx={{ fontSize: "0.7rem", color: COLORS.textSecondary }}>Free 1st-Year Service</Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: "#059669" }}>
              Ends {formatDate(warrantyForm.free_service_end_date)}
            </Typography>
          </Grid>

        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* ASSET SERIAL NUMBERS & MONITORING PORTAL */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
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

          <Grid size={{ xs: 12, md: 6 }}>
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
              <Chip label={warrantyForm.monitoring_portal_url ? "Portal recorded" : "Not configured"} size="small" sx={{ height: 20, fontSize: "0.68rem", fontWeight: 800, backgroundColor: "#DCFCE7", color: "#166534" }} />
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
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
              <Stack direction="row" spacing={1}  sx={{alignItems: "center",  mb: 1 }}>
                <SolarPowerIcon sx={{ color: "#0284C7", fontSize: 20 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: COLORS.textPrimary }}>
                  Panel Product Warranty
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: COLORS.primary }}>
                {warrantyForm.panel_product_warranty_years ? `${warrantyForm.panel_product_warranty_years} Years` : "Not set"}
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
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
              <Stack direction="row" spacing={1}  sx={{alignItems: "center",  mb: 1 }}>
                <FactCheckIcon sx={{ color: "#2563EB", fontSize: 20 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: COLORS.textPrimary }}>
                  Panel Power Performance
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: COLORS.primary }}>
                {warrantyForm.panel_performance_warranty_years ? `${warrantyForm.panel_performance_warranty_years} Years` : "Not set"}
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
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
              <Stack direction="row" spacing={1}  sx={{alignItems: "center",  mb: 1 }}>
                <ElectricBoltIcon sx={{ color: "#D97706", fontSize: 20 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: COLORS.textPrimary }}>
                  Grid Inverter Warranty
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: COLORS.primary }}>
                {warrantyForm.inverter_warranty_years ? `${warrantyForm.inverter_warranty_years} Years` : "Not set"}
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
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
              <Stack direction="row" spacing={1}  sx={{alignItems: "center",  mb: 1 }}>
                <BuildIcon sx={{ color: "#059669", fontSize: 20 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: COLORS.textPrimary }}>
                  EPC Installation Warranty
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: COLORS.primary }}>
                {warrantyForm.installation_warranty_years ? `${warrantyForm.installation_warranty_years} Years` : "Not set"}
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
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between", mb: 1.5 }}>
          <Box>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.04em" }}>Paid Annual Maintenance Contract</Typography>
            <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary, mt: 0.35 }}>Starts after the free-service period. Confirm plan, pricing and term before saving.</Typography>
          </Box>
          <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => setWarrantyModalOpen(true)} sx={{ alignSelf: { xs: "flex-start", sm: "center" }, textTransform: "none", fontWeight: 700, borderColor: COLORS.border, color: COLORS.primary, whiteSpace: "nowrap" }}>Edit AMC details</Button>
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ p: 2, borderRadius: "10px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}`, height: "100%" }}>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted, textTransform: "uppercase", fontWeight: 800 }}>
                Selected Plan
              </Typography>
              <Stack direction="row" spacing={1}  sx={{alignItems: "center",  mt: 0.5, mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.primary }}>
                  {warrantyForm.amc_plan ? warrantyForm.amc_plan : "Plan not selected"}
                </Typography>
                {warrantyForm.visit_frequency && <Chip label={warrantyForm.visit_frequency} size="small" sx={{ fontWeight: 800, height: 22 }} />}
              </Stack>
              <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, lineHeight: 1.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {warrantyForm.amc_plan_snapshot?.coverage || (warrantyForm.amc_plan
                  ? 'Legacy contract: coverage was not recorded. Review the agreed terms before selecting a company plan.'
                  : 'No plan selected. Create company plans and select one in Edit AMC details.')}
              </Typography>
              {warrantyForm.amc_plan_snapshot?.exclusions && <Typography variant="caption" sx={{ display: 'block', mt: 1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>Exclusions: {warrantyForm.amc_plan_snapshot.exclusions}</Typography>}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box sx={{ p: 2, borderRadius: "10px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}`, height: "100%" }}>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted, textTransform: "uppercase", fontWeight: 800 }}>
                Commercial Terms & Fee
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.primary, mt: 0.5 }}>
                {warrantyForm.amc_amount === "" ? "Not set" : `₹${Number(warrantyForm.amc_amount).toLocaleString("en-IN")}`}{" "}
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: COLORS.textMuted }}>/ year</span>
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mt: 0.5 }}>
                {Number(project?.system_capacity_kw) > 0 ? `Calculated for ${Number(project.system_capacity_kw).toLocaleString("en-IN")} kW system` : "System capacity not recorded"}
                {amcFeePerVisit !== null && serviceVisitsPerYear ? ` · ₹${amcFeePerVisit.toLocaleString("en-IN", { maximumFractionDigits: 2 })} per ${warrantyForm.visit_frequency.toLowerCase()} visit` : " · Per-visit fee not calculated"}
              </Typography>
              <Stack direction="row" spacing={1}  sx={{alignItems: "center",  mt: 1.5 }}>
                <Chip
                  icon={warrantyForm.amc_payment_status === "Paid" ? <CheckCircleIcon /> : undefined}
                  label={`Payment Status: ${warrantyForm.amc_payment_status || "Not set"}`}
                  size="small"
                  sx={{ fontWeight: 800, backgroundColor: warrantyForm.amc_payment_status === "Paid" ? "#DCFCE7" : "#F1F5F9", color: warrantyForm.amc_payment_status === "Paid" ? "#166534" : COLORS.textSecondary }}
                />
              </Stack>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box sx={{ p: 2, borderRadius: "10px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}`, height: "100%" }}>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted, textTransform: "uppercase", fontWeight: 800 }}>
                Contract Term & Renewal
              </Typography>
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: COLORS.textPrimary, mt: 0.5 }}>
                Effective: {warrantyForm.amc_start_date && warrantyForm.amc_end_date ? `${formatDate(warrantyForm.amc_start_date)} — ${formatDate(warrantyForm.amc_end_date)}` : "Term not set"}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mt: 0.5 }}>
                Renewal Date: <strong>{warrantyForm.amc_renewal_date ? formatDate(warrantyForm.amc_renewal_date) : "Not set"}</strong>
              </Typography>
              <Alert severity="info" sx={{ mt: 1.5, py: 0.2, px: 1, fontSize: "0.72rem" }}>
                Review the renewal date and arrange the next AMC invoice with your finance team.
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
        <Stack direction="row"   sx={{justifyContent: "space-between", alignItems: "center",  mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
              Preventive maintenance schedule
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.75rem" }}>
              Saved service intervals and technical scope. Click a status to update a scheduled visit.
            </Typography>
          </Box>
        </Stack>

        <TableContainer sx={{ borderRadius: "10px", border: `1px solid ${COLORS.border}` }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.textPrimary }}>Service milestone</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.textPrimary }}>Scheduled Date</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.textPrimary }}>Assigned Engineer</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.textPrimary }}>Preventive Maintenance Scope</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.textPrimary, textAlign: "center" }}>Status Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scheduledVisits.length === 0 && <TableRow><TableCell colSpan={5}>No maintenance visits have been scheduled.</TableCell></TableRow>}
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
          <IconButton size="small" onClick={() => { if (!saving) { setWarrantyModalOpen(false); fetchData(); } }} disabled={saving}>
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
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Warranty Certificate # *"
                    value={warrantyForm.warranty_certificate_no}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, warranty_certificate_no: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.6 }}>
                    Warranty Start Date *
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    required
                    value={warrantyForm.warranty_start_date}
                    disabled
                    helperText="Warranty starts on the completed handover date, independent of subsidy credit."
                    onChange={(e) => handleWarrantyStartDateChange(e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.6 }}>
                    Free 1st-Year Service Ends *
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    required
                    value={warrantyForm.free_service_end_date}
                    helperText="Confirm the contractual free-service end date"
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
                <Grid size={{ xs: 6, sm: 3 }}>
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

                <Grid size={{ xs: 6, sm: 3 }}>
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

                <Grid size={{ xs: 6, sm: 3 }}>
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

                <Grid size={{ xs: 6, sm: 3 }}>
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
              <Box sx={{ mb: 2 }}><AmcPlanManager onChanged={loadPlans} /></Box>
              {!companyPlans.some(p => Number(p.is_active)) && <Alert severity="info" sx={{ mb: 2 }}>No active company plans. Create a plan before selecting a new AMC contract.</Alert>}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Selecting a plan copies its fee, service frequency and term. Review the contract amount and dates before saving.</Typography>

              {warrantyForm.amc_plan_snapshot && <Alert severity="info" sx={{ mb: 2, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                <strong>{warrantyForm.amc_plan}</strong><br />{warrantyForm.amc_plan_snapshot.coverage}
                {warrantyForm.amc_plan_snapshot.exclusions && <><br />Exclusions: {warrantyForm.amc_plan_snapshot.exclusions}</>}
              </Alert>}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.6 }}>
                    AMC Start Date *
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    required
                    value={warrantyForm.amc_start_date}
                    helperText="Starts day after free service ends"
                    onChange={(e) => handleAmcStartDateChange(e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.6 }}>
                    AMC End Date *
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    required
                    value={warrantyForm.amc_end_date}
                    helperText="Calculated from the selected plan term; editable"
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, amc_end_date: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.6 }}>
                    Next AMC Renewal Date *
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={warrantyForm.amc_renewal_date}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, amc_renewal_date: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="amc-plan-label">AMC Plan Coverage *</InputLabel>
                    <Select
                      labelId="amc-plan-label"
                      label="AMC Plan Coverage *"
                      value={warrantyForm.amc_plan_id || (warrantyForm.amc_plan ? 'legacy' : '')}
                      onChange={(e) => selectPlan(e.target.value)}
                    >
                      <MenuItem value="" disabled>Select company AMC plan</MenuItem>
                      {warrantyForm.amc_plan && !warrantyForm.amc_plan_id && <MenuItem value="legacy">{warrantyForm.amc_plan} (existing contract)</MenuItem>}
                      {warrantyForm.amc_plan_id && !companyPlans.some(p => Number(p.id) === Number(warrantyForm.amc_plan_id) && Number(p.is_active)) && <MenuItem value={warrantyForm.amc_plan_id}>{warrantyForm.amc_plan} (saved contract)</MenuItem>}
                      {companyPlans.filter(p => Number(p.is_active)).map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="amc-frequency-label">Service Frequency</InputLabel>
                    <Select labelId="amc-frequency-label" label="Service Frequency" value={warrantyForm.visit_frequency} onChange={(e) => setWarrantyForm({ ...warrantyForm, visit_frequency: e.target.value })}>
                      <MenuItem value="">Not set</MenuItem>
                      {AMC_FREQUENCIES.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="AMC Annual Amount (₹) *"
                    value={warrantyForm.amc_amount}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, amc_amount: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="amc-pay-label">AMC Payment Status</InputLabel>
                    <Select
                      labelId="amc-pay-label"
                      label="AMC Payment Status"
                      value={warrantyForm.amc_payment_status}
                      onChange={(e) => setWarrantyForm({ ...warrantyForm, amc_payment_status: e.target.value })}
                    >
                      <MenuItem value="">Select status</MenuItem>
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
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Solar Panel Serial Numbers"
                    value={warrantyForm.panel_serial_numbers}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, panel_serial_numbers: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Solar Inverter Serial Number"
                    value={warrantyForm.inverter_serial_number}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, inverter_serial_number: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Monitoring Portal URL"
                    value={warrantyForm.monitoring_portal_url}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, monitoring_portal_url: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Monitoring Plant ID"
                    value={warrantyForm.monitoring_plant_id}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, monitoring_plant_id: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
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
            onClick={() => { if (!saving) { setWarrantyModalOpen(false); fetchData(); } }}
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
            <Box>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.6 }}>
                Visit Date *
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="date"
                required
                value={newVisitForm.visit_date}
                onChange={(e) => setNewVisitForm({ ...newVisitForm, visit_date: e.target.value })}
              />
            </Box>

            <TextField
              fullWidth
              size="small"
              label="Attending Technician / Engineer *"
              value={newVisitForm.technician}
              onChange={(e) => setNewVisitForm({ ...newVisitForm, technician: e.target.value })}
            />

            <Box>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.6 }}>
                Issue Reported / Scope of Work *
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Describe issue reported or maintenance scope..."
                value={newVisitForm.issue_reported}
                onChange={(e) => setNewVisitForm({ ...newVisitForm, issue_reported: e.target.value })}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    minHeight: "80px",
                    alignItems: "flex-start",
                  },
                }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.6 }}>
                Action Taken / Resolution *
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Describe rectifications performed, parts replaced, or inspection findings..."
                value={newVisitForm.resolution}
                onChange={(e) => setNewVisitForm({ ...newVisitForm, resolution: e.target.value })}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    minHeight: "80px",
                    alignItems: "flex-start",
                  },
                }}
              />
            </Box>

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
