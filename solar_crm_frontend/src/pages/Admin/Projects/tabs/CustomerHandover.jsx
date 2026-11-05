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
  Checkbox,
  Rating,
  FormHelperText,
  Paper,
  FormControlLabel,
  Switch,
} from "@mui/material";

// Icons from @mui/icons-material
import HandshakeIcon from "@mui/icons-material/Handshake";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import VerifiedIcon from "@mui/icons-material/Verified";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import StarIcon from "@mui/icons-material/Star";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import SecurityIcon from "@mui/icons-material/Security";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import BuildIcon from "@mui/icons-material/Build";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

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

const DEFAULT_DOSSIER_CHECKLIST = [
  { id: "comm_cert", label: "Commissioning & Grid Synchronisation Certificate (COMM-2026-0004)", checked: true, required: true },
  { id: "qc_report", label: "Final Quality & Safety Inspection Report (QC-2026-0004)", checked: true, required: true },
  { id: "discom_metering", label: "DISCOM Net-Metering Feasibility & Bi-directional Meter Test Report", checked: true, required: true },
  { id: "subsidy_doc", label: "PM Surya Ghar National Portal Subsidy Claim Submission Receipt", checked: true, required: false },
  { id: "gst_invoice", label: "Final GST Commercial Tax Invoice & Zero-Balance Payment Receipt", checked: true, required: true },
  { id: "oem_warranty", label: "OEM Warranty Certificates (25-Yr PV Modules & Inverter)", checked: true, required: true },
  { id: "om_manual", label: "Customer Operation & Emergency Shutdown Safety Manual", checked: true, required: false },
];

export default function CustomerHandover({ project, projectId }) {
  const targetProjectId = projectId || project?.id;

  // Sensible default dates: Handover 2 days after Final Inspection (12 Nov 2026)
  const defaultHandoverDate = "2026-11-12";
  const finalInspectionDate = "2026-11-10";

  const [handover, setHandover] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [financials, setFinancials] = useState({
    contractValue: 272500,
    amountPaid: 272500,
    balanceDue: 0,
    paymentStatus: "Paid",
    invoiceNumber: "INV-2026-1008",
  });

  const [bannerAlert, setBannerAlert] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    handover_date: defaultHandoverDate,
    handover_manager: "Vikram Rathore (Project Lead)",
    warranty_start_date: defaultHandoverDate,
    module_warranty_years: 25,
    module_warranty_end: addYearsToDate(defaultHandoverDate, 25),
    inverter_warranty_years: 5,
    inverter_warranty_end: addYearsToDate(defaultHandoverDate, 5),
    workmanship_warranty_years: 5,
    workmanship_warranty_end: addYearsToDate(defaultHandoverDate, 5),
    amc_warranty_years: 1,
    amc_warranty_end: addYearsToDate(defaultHandoverDate, 1),
    first_service_due_date: addDaysToDate(defaultHandoverDate, 90),
    training_completed: "", // Unselected by default
    app_demo_completed: "", // Unselected by default
    monitoring_app_access_shared: 1,
    emergency_contact_given: 1,
    operation_manual: 1,
    warranty_card: 1,
    maintenance_schedule: 1,
    inverter_manual: 1,
    documents_pack_checklist: DEFAULT_DOSSIER_CHECKLIST,
    customer_signature: 0, // Unselected by default
    signature_signatory_name: project?.customer_name || "Rajesh Sharma",
    signature_phone: project?.customer_phone || "9876501234",
    signed_docket_url: "https://diassignments.digiinksolutions.com/uploads/handover_dockets/DOCKET-PROJ-004-SIGNED.pdf",
    handover_photo_url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=60",
    customer_rating: 5,
    customer_feedback: "Pleased with the rooftop solar installation speed and prompt DISCOM meter sync. Generation is visible clearly on the mobile phone app.",
    handover_status: "Pending", // Default Pending as requested
    remarks: "Customer oriented with inverter emergency shutoff and isolation MCB. Plant fully functional.",
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

  // Fetch Handover details & Invoice billing
  const fetchHandoverAndFinancials = useCallback(async () => {
    if (!targetProjectId) return;
    setLoading(true);
    try {
      // 1. Fetch Handover Record
      const url = getApiUrl(`/projects/${targetProjectId}/handover`);
      const res = await axios.get(url, { headers: getAuthHeader() });
      const record = res.data?.handover;

      if (record) {
        setHandover(record);
        setFormData({
          handover_date: record.handover_date ? record.handover_date.split("T")[0] : defaultHandoverDate,
          handover_manager: record.handover_manager || "Vikram Rathore (Project Lead)",
          warranty_start_date: record.warranty_start_date ? record.warranty_start_date.split("T")[0] : (record.handover_date ? record.handover_date.split("T")[0] : defaultHandoverDate),
          module_warranty_years: record.module_warranty_years || 25,
          module_warranty_end: record.module_warranty_end ? record.module_warranty_end.split("T")[0] : addYearsToDate(record.warranty_start_date || defaultHandoverDate, 25),
          inverter_warranty_years: record.inverter_warranty_years || 5,
          inverter_warranty_end: record.inverter_warranty_end ? record.inverter_warranty_end.split("T")[0] : addYearsToDate(record.warranty_start_date || defaultHandoverDate, 5),
          workmanship_warranty_years: record.workmanship_warranty_years || 5,
          workmanship_warranty_end: record.workmanship_warranty_end ? record.workmanship_warranty_end.split("T")[0] : addYearsToDate(record.warranty_start_date || defaultHandoverDate, 5),
          amc_warranty_years: record.amc_warranty_years || 1,
          amc_warranty_end: record.amc_warranty_end ? record.amc_warranty_end.split("T")[0] : addYearsToDate(record.warranty_start_date || defaultHandoverDate, 1),
          first_service_due_date: record.first_service_due_date ? record.first_service_due_date.split("T")[0] : addDaysToDate(record.handover_date || defaultHandoverDate, 90),
          training_completed: record.training_completed || "",
          app_demo_completed: record.app_demo_completed || "",
          monitoring_app_access_shared: record.monitoring_app_access_shared !== undefined ? (record.monitoring_app_access_shared ? 1 : 0) : 1,
          emergency_contact_given: record.emergency_contact_given ? 1 : 0,
          operation_manual: record.operation_manual ? 1 : 0,
          warranty_card: record.warranty_card ? 1 : 0,
          maintenance_schedule: record.maintenance_schedule ? 1 : 0,
          inverter_manual: record.inverter_manual ? 1 : 0,
          documents_pack_checklist: Array.isArray(record.documents_pack_checklist) && record.documents_pack_checklist.length > 0
            ? record.documents_pack_checklist
            : DEFAULT_DOSSIER_CHECKLIST,
          customer_signature: record.customer_signature ? 1 : 0,
          signature_signatory_name: record.signature_signatory_name || project?.customer_name || "Rajesh Sharma",
          signature_phone: record.signature_phone || project?.customer_phone || "9876501234",
          signed_docket_url: record.signed_docket_url || "https://diassignments.digiinksolutions.com/uploads/handover_dockets/DOCKET-PROJ-004-SIGNED.pdf",
          handover_photo_url: record.handover_photo_url || "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=60",
          customer_rating: record.customer_rating || 5,
          customer_feedback: record.customer_feedback || "",
          handover_status: record.handover_status || "Pending",
          remarks: record.remarks || "",
        });
      }

      // 2. Fetch Invoices to verify Commercial Balance
      try {
        const invRes = await axios.get(getApiUrl(`/invoices`), { headers: getAuthHeader() });
        const invList = invRes.data?.data || invRes.data?.invoices || [];
        const phone = (project?.customer_phone || "").replace(/\D/g, "");
        const name = (project?.customer_name || "").toLowerCase();

        const match = invList.find((i) => {
          const invPhone = (i.customer_phone || "").replace(/\D/g, "");
          const invName = (i.customer_name || "").toLowerCase();
          return (phone && invPhone && invPhone === phone) || (name && invName && invName.includes(name));
        });

        if (match) {
          const gross = parseFloat(match.net_payable_amount || match.gross_total || 0);
          const paid = parseFloat(match.amount_paid || 0);
          const balance = parseFloat(match.balance_due || (gross - paid));
          setFinancials({
            contractValue: gross,
            amountPaid: paid,
            balanceDue: balance,
            paymentStatus: match.payment_status || (balance <= 0 ? "Paid" : "Partially Paid"),
            invoiceNumber: match.invoice_number,
          });
        }
      } catch (e) {
        // Fallback default
      }
    } catch (err) {
      console.error("fetchHandover error:", err);
    } finally {
      setLoading(false);
    }
  }, [targetProjectId, project]);

  useEffect(() => {
    fetchHandoverAndFinancials();
  }, [fetchHandoverAndFinancials]);

  // Recalculate auto warranty end dates when warranty_start_date changes
  const handleWarrantyStartDateChange = (newDate) => {
    setFormData((prev) => ({
      ...prev,
      warranty_start_date: newDate,
      module_warranty_end: addYearsToDate(newDate, prev.module_warranty_years),
      inverter_warranty_end: addYearsToDate(newDate, prev.inverter_warranty_years),
      workmanship_warranty_end: addYearsToDate(newDate, prev.workmanship_warranty_years),
      amc_warranty_end: addYearsToDate(newDate, prev.amc_warranty_years),
    }));
  };

  // Recalculate first service due date when handover_date changes
  const handleHandoverDateChange = (newDate) => {
    setFormData((prev) => ({
      ...prev,
      handover_date: newDate,
      warranty_start_date: newDate,
      first_service_due_date: addDaysToDate(newDate, 90),
      module_warranty_end: addYearsToDate(newDate, prev.module_warranty_years),
      inverter_warranty_end: addYearsToDate(newDate, prev.inverter_warranty_years),
      workmanship_warranty_end: addYearsToDate(newDate, prev.workmanship_warranty_years),
      amc_warranty_end: addYearsToDate(newDate, prev.amc_warranty_years),
    }));
  };

  // Toggle checklist item
  const handleToggleChecklist = (id) => {
    setFormData((prev) => {
      const updated = prev.documents_pack_checklist.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      );
      return { ...prev, documents_pack_checklist: updated };
    });
  };

  // Safety Gate: Block "Completed" status if training, app demo, or customer signature is incomplete
  const canCompleteHandover = useMemo(() => {
    return (
      formData.training_completed === "Completed" &&
      formData.app_demo_completed === "Completed" &&
      (formData.customer_signature === 1 || formData.customer_signature === true)
    );
  }, [formData.training_completed, formData.app_demo_completed, formData.customer_signature]);

  // Handle Save
  const handleSave = async () => {
    // 1. Date Checks
    if (formData.handover_date && formData.handover_date < finalInspectionDate) {
      setBannerAlert({
        severity: "error",
        message: `Date Sequence Error: Handover Date (${formatDate(formData.handover_date)}) cannot be earlier than Final Inspection Date (${formatDate(finalInspectionDate)}).`,
      });
      return;
    }

    if (formData.warranty_start_date && formData.warranty_start_date < formData.handover_date) {
      setBannerAlert({
        severity: "error",
        message: `Date Sequence Error: Warranty Start Date (${formatDate(formData.warranty_start_date)}) cannot precede the Handover Date (${formatDate(formData.handover_date)}).`,
      });
      return;
    }

    // 2. Safety Gate Check: Cannot mark as Completed if training/signature not done
    if (formData.handover_status === "Completed" && !canCompleteHandover) {
      setBannerAlert({
        severity: "error",
        message: "Safety Gate Block: Handover cannot be marked 'Completed' until Customer Training, App Demo, and Customer Signoff are fully verified.",
      });
      return;
    }

    setSaving(true);
    setBannerAlert(null);

    try {
      const url = getApiUrl(`/projects/${targetProjectId}/handover`);
      const payload = {
        ...formData,
        customer_signature: formData.customer_signature ? 1 : 0,
        monitoring_app_access_shared: formData.monitoring_app_access_shared ? 1 : 0,
      };

      if (handover && handover.id) {
        await axios.put(url, payload, { headers: getAuthHeader() });
      } else {
        await axios.post(url, payload, { headers: getAuthHeader() });
      }

      setBannerAlert({
        severity: "success",
        message: "Customer Handover dossier updated successfully!",
      });
      setDialogOpen(false);
      fetchHandoverAndFinancials();
    } catch (err) {
      console.error("Save handover error:", err);
      setBannerAlert({
        severity: "error",
        message: err.response?.data?.message || "Failed to update handover details.",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return { bg: "#DEF7EC", text: "#03543F", border: "#31C48D" };
      case "In Progress":
        return { bg: "#E1EFFE", text: "#1E429F", border: "#76A9FA" };
      case "On Hold":
        return { bg: "#FDF2F2", text: "#9B1C1C", border: "#F98080" };
      default:
        return { bg: "#FEF08A", text: "#713F12", border: "#EAB308" }; // Pending
    }
  };

  const activeStatus = handover?.handover_status || formData.handover_status || "Pending";
  const statusColors = getStatusColor(activeStatus);

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
                  backgroundColor: "#FEF3C7",
                  p: 0.8,
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <HandshakeIcon sx={{ color: "#D97706", fontSize: 24 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
                Stage 8: Customer Handover & System Walkthrough
              </Typography>
              <Chip
                label={activeStatus}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  backgroundColor: statusColors.bg,
                  color: statusColors.text,
                  border: `1px solid ${statusColors.border}`,
                }}
              />
            </Stack>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.85rem" }}>
              Operational training, cloud monitoring app onboarding, warranty activation & signed customer acceptance dossier.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setDialogOpen(true)}
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
            Update Handover Details
          </Button>
        </Stack>

        {/* WORKFLOW PIPELINE BREADCRUMB */}
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
            Standard EPC Pipeline:
          </Typography>
          <span>Order Closed</span>
          <span>→</span>
          <span>DISCOM Feasibility</span>
          <span>→</span>
          <span>Pre-Install Inspection</span>
          <span>→</span>
          <span>Procurement</span>
          <span>→</span>
          <span>Installation</span>
          <span>→</span>
          <span>Commissioning (08 Nov)</span>
          <span>→</span>
          <span>QC Inspection (10 Nov)</span>
          <span>→</span>
          <Chip
            label="Handover (12 Nov)"
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: "0.7rem",
              backgroundColor: COLORS.primary,
              color: "#FFF",
              height: 22,
            }}
          />
          <span>→</span>
          <span>Subsidy Claim</span>
          <span>→</span>
          <span>Subsidy Received</span>
          <span>→</span>
          <span>Warranty & AMC</span>
        </Box>
      </Paper>

      {/* COMMERCIAL SAFETY GATE: PAYMENT CLEARANCE STATUS */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: "14px",
          border: `1px solid ${financials.balanceDue > 0 ? "#FCA5A5" : "#A7F3D0"}`,
          backgroundColor: financials.balanceDue > 0 ? "#FFF5F5" : "#F0FDF4",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  p: 1,
                  borderRadius: "8px",
                  backgroundColor: financials.balanceDue > 0 ? "#FEE2E2" : "#DCFCE7",
                }}
              >
                <ReceiptLongIcon sx={{ color: financials.balanceDue > 0 ? "#DC2626" : "#16A34A" }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  Payment Clearance Gate
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
                  {financials.balanceDue > 0 ? "Commercial Hold" : "Payment Cleared (100%)"}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>Contract Total</Typography>
            <Typography variant="body1" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
              ₹{financials.contractValue.toLocaleString("en-IN")}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>Amount Paid</Typography>
            <Typography variant="body1" sx={{ fontWeight: 800, color: "#16A34A" }}>
              ₹{financials.amountPaid.toLocaleString("en-IN")}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>Balance Due</Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 800,
                color: financials.balanceDue > 0 ? "#DC2626" : "#16A34A",
              }}
            >
              ₹{financials.balanceDue.toLocaleString("en-IN")}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 2 }} sx={{ textAlign: { xs: "left", md: "right" } }}>
            <Chip
              icon={financials.balanceDue > 0 ? <WarningAmberIcon /> : <CheckCircleIcon />}
              label={financials.balanceDue > 0 ? "Balance Pending" : "Cleared for Handover"}
              size="small"
              sx={{
                fontWeight: 800,
                backgroundColor: financials.balanceDue > 0 ? "#FEE2E2" : "#DCFCE7",
                color: financials.balanceDue > 0 ? "#991B1B" : "#166534",
              }}
            />
          </Grid>
        </Grid>

        {financials.balanceDue > 0 && (
          <Alert severity="warning" sx={{ mt: 1.5, py: 0.5, fontSize: "0.78rem" }}>
            Commercial Notice: Final system handover is strictly gated by accounts. If balance payment is pending, collect the cheque/NEFT reference before completing digital customer signoff.
          </Alert>
        )}
      </Paper>

      {/* CORE 4-TIER GRANULAR WARRANTY MATRIX */}
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
          Multi-Tier Component Warranty Activation (Starts: {formatDate(formData.warranty_start_date)})
        </Typography>

        <Grid container spacing={2}>
          {/* PV MODULE WARRANTY */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.cardBg,
                height: "100%",
                borderTop: "4px solid #3B82F6",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <SolarPowerIcon sx={{ color: "#2563EB", fontSize: 20 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: COLORS.textPrimary }}>
                  Solar PV Modules
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: COLORS.primary }}>
                {formData.module_warranty_years} Years
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mb: 1 }}>
                Linear Degradation Performance Warranty
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                Valid Until:{" "}
                <strong style={{ color: COLORS.textPrimary }}>
                  {formatDate(formData.module_warranty_end)}
                </strong>
              </Typography>
            </Paper>
          </Grid>

          {/* INVERTER WARRANTY */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.cardBg,
                height: "100%",
                borderTop: "4px solid #F59E0B",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <ElectricBoltIcon sx={{ color: "#D97706", fontSize: 20 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: COLORS.textPrimary }}>
                  Grid Inverter
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: COLORS.primary }}>
                {formData.inverter_warranty_years} Years
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mb: 1 }}>
                Manufacturer Replacement Warranty
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                Valid Until:{" "}
                <strong style={{ color: COLORS.textPrimary }}>
                  {formatDate(formData.inverter_warranty_end)}
                </strong>
              </Typography>
            </Paper>
          </Grid>

          {/* WORKMANSHIP WARRANTY */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.cardBg,
                height: "100%",
                borderTop: "4px solid #10B981",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <BuildIcon sx={{ color: "#059669", fontSize: 20 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: COLORS.textPrimary }}>
                  EPC Workmanship
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: COLORS.primary }}>
                {formData.workmanship_warranty_years} Years
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mb: 1 }}>
                Structure, Fasteners & Waterproofing
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                Valid Until:{" "}
                <strong style={{ color: COLORS.textPrimary }}>
                  {formatDate(formData.workmanship_warranty_end)}
                </strong>
              </Typography>
            </Paper>
          </Grid>

          {/* AMC MAINTENANCE */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.cardBg,
                height: "100%",
                borderTop: "4px solid #8B5CF6",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <SupportAgentIcon sx={{ color: "#7C3AED", fontSize: 20 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: COLORS.textPrimary }}>
                  Free Scheduled AMC
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: COLORS.primary }}>
                {formData.amc_warranty_years} Year (4 Visits)
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mb: 1 }}>
                Periodic Module Wash & Electrical Health Check
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                Valid Until:{" "}
                <strong style={{ color: COLORS.textPrimary }}>
                  {formatDate(formData.amc_warranty_end)}
                </strong>
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* TWO COLUMN GRID: ONBOARDING & DOSSIER */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* LEFT COLUMN: CUSTOMER ONBOARDING & APP DEMO */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.cardBg,
              height: "100%",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <SchoolIcon sx={{ color: COLORS.primary }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
                Customer Training & Mobile App Onboarding
              </Typography>
            </Stack>

            <Stack spacing={2}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "10px",
                  border: `1px solid ${COLORS.border}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.textPrimary }}>
                    Plant Operations & Safety Briefing
                  </Typography>
                  <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>
                    Inverter shutoff, trip sequence, generation meter check
                  </Typography>
                </Box>
                <Chip
                  label={formData.training_completed || "Pending"}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    backgroundColor: formData.training_completed === "Completed" ? "#DEF7EC" : "#FEF08A",
                    color: formData.training_completed === "Completed" ? "#03543F" : "#713F12",
                  }}
                />
              </Box>

              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "10px",
                  border: `1px solid ${COLORS.border}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.textPrimary }}>
                    Mobile Monitoring App Walkthrough
                  </Typography>
                  <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>
                    Daily kWh graph, real-time kW output, carbon offset stats
                  </Typography>
                </Box>
                <Chip
                  label={formData.app_demo_completed || "Pending"}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    backgroundColor: formData.app_demo_completed === "Completed" ? "#DEF7EC" : "#FEF08A",
                    color: formData.app_demo_completed === "Completed" ? "#03543F" : "#713F12",
                  }}
                />
              </Box>

              <Grid container spacing={1.5}>
                <Grid size={6}>
                  <Box sx={{ p: 1.5, borderRadius: "8px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
                    <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted }}>App Access Shared</Typography>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: formData.monitoring_app_access_shared ? "#16A34A" : "#DC2626" }}>
                      {formData.monitoring_app_access_shared ? "Yes (Shared on WhatsApp)" : "No"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={6}>
                  <Box sx={{ p: 1.5, borderRadius: "8px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
                    <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted }}>Emergency Helpline</Typography>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: formData.emergency_contact_given ? "#16A34A" : "#DC2626" }}>
                      {formData.emergency_contact_given ? "Yes (Sticker Pasted)" : "No"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={6}>
                  <Box sx={{ p: 1.5, borderRadius: "8px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
                    <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted }}>Handover Date</Typography>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: COLORS.textPrimary }}>
                      {formatDate(formData.handover_date)}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={6}>
                  <Box sx={{ p: 1.5, borderRadius: "8px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
                    <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted }}>1st Scheduled Service Due</Typography>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: "#2563EB" }}>
                      {formatDate(formData.first_service_due_date)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ p: 1.5, borderRadius: "8px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
                <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted }}>Handover Manager</Typography>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: COLORS.textPrimary }}>
                  {formData.handover_manager || "Vikram Rathore (Project Lead)"}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* RIGHT COLUMN: STATUTORY DOCUMENT DOSSIER */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.cardBg,
              height: "100%",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <PictureAsPdfIcon sx={{ color: "#DC2626" }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
                Statutory Document Dossier (Delivered to Client)
              </Typography>
            </Stack>

            <Stack spacing={1.2}>
              {formData.documents_pack_checklist.map((doc) => (
                <Box
                  key={doc.id}
                  sx={{
                    p: 1.2,
                    borderRadius: "8px",
                    border: `1px solid ${COLORS.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: doc.checked ? "#F0FDF4" : "#FFFFFF",
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    {doc.checked ? (
                      <CheckCircleIcon sx={{ color: "#16A34A", fontSize: 18 }} />
                    ) : (
                      <WarningAmberIcon sx={{ color: "#F59E0B", fontSize: 18 }} />
                    )}
                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: doc.checked ? COLORS.textPrimary : COLORS.textMuted,
                      }}
                    >
                      {doc.label}
                    </Typography>
                  </Stack>
                  <Chip
                    label={doc.checked ? "Delivered" : "Pending"}
                    size="small"
                    sx={{
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      height: 20,
                      backgroundColor: doc.checked ? "#DCFCE7" : "#FEE2E2",
                      color: doc.checked ? "#166534" : "#991B1B",
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* BOTTOM SECTION: DIGITAL SIGNOFF & CUSTOMER FEEDBACK */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: "14px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.cardBg,
        }}
      >
        <Grid container spacing={3}>
          {/* SIGNATURE & EVIDENCE */}
          <Grid size={{ xs: 12, md: 6 }}>
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
              Customer Acceptance & Signed Docket Evidence
            </Typography>

            <Stack spacing={1.8}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "10px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: formData.customer_signature ? "#F0FDF4" : "#FEF3C7",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: COLORS.textPrimary }}>
                      Digital Signoff Status
                    </Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>
                      Signatory: {formData.signature_signatory_name || "Customer"} ({formData.signature_phone})
                    </Typography>
                  </Box>
                  <Chip
                    icon={formData.customer_signature ? <VerifiedIcon /> : <WarningAmberIcon />}
                    label={formData.customer_signature ? "Signed & Confirmed" : "Signoff Pending"}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      backgroundColor: formData.customer_signature ? "#DEF7EC" : "#FEF08A",
                      color: formData.customer_signature ? "#03543F" : "#713F12",
                    }}
                  />
                </Stack>
              </Box>

              <Grid container spacing={1.5}>
                <Grid size={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PictureAsPdfIcon sx={{ color: "#DC2626" }} />}
                    endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                    href={formData.signed_docket_url}
                    target="_blank"
                    rel="noreferrer"
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textTransform: "none",
                      color: COLORS.primary,
                      borderColor: COLORS.border,
                      py: 1,
                    }}
                  >
                    View Signed Docket
                  </Button>
                </Grid>

                <Grid size={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PhotoCameraIcon sx={{ color: "#2563EB" }} />}
                    endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                    href={formData.handover_photo_url}
                    target="_blank"
                    rel="noreferrer"
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textTransform: "none",
                      color: COLORS.primary,
                      borderColor: COLORS.border,
                      py: 1,
                    }}
                  >
                    View Plant Photo
                  </Button>
                </Grid>
              </Grid>
            </Stack>
          </Grid>

          {/* CUSTOMER FEEDBACK & STAR RATING */}
          <Grid size={{ xs: 12, md: 6 }}>
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
              Customer Satisfaction & Reviews
            </Typography>

            <Box
              sx={{
                p: 2,
                borderRadius: "10px",
                border: `1px solid ${COLORS.border}`,
                backgroundColor: "#F8FAFC",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                <Rating value={formData.customer_rating} readOnly precision={0.5} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: COLORS.textPrimary }}>
                  {formData.customer_rating}.0 / 5.0 Rating
                </Typography>
              </Stack>

              <Typography
                sx={{
                  fontSize: "0.82rem",
                  color: COLORS.textSecondary,
                  fontStyle: "italic",
                  lineHeight: 1.5,
                }}
              >
                "{formData.customer_feedback || "No feedback comments submitted yet."}"
              </Typography>

              {formData.remarks && (
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px dashed ${COLORS.border}` }}>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textMuted }}>
                    Supervisor Handover Notes:
                  </Typography>
                  <Typography sx={{ fontSize: "0.78rem", color: COLORS.textPrimary }}>
                    {formData.remarks}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* FULL EDIT HANDOVER MODAL (SPACIOUS maxWidth="md" - NO SQUISHED TEXTAREAS) */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
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
          Update Customer Handover Dossier & Warranties
          <IconButton size="small" onClick={() => setDialogOpen(false)} disabled={saving}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: COLORS.border, py: 2.5 }}>
          <Stack spacing={3}>
            {/* SECTION 1: MILESTONE DATES & HANDOVER PERSONNEL */}
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
                1. Handover Milestone Dates & Verification
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    slotProps={{ inputLabel: { shrink: true } }}
                    InputLabelProps={{ shrink: true }}
                    required
                    InputLabelProps={{ shrink: true }}
                    label="Customer Handover Date *"
                    InputLabelProps={{ shrink: true }}
                    value={formData.handover_date}
                    helperText={`Final Inspection was on ${formatDate(finalInspectionDate)}`}
                    onChange={(e) => handleHandoverDateChange(e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    slotProps={{ inputLabel: { shrink: true } }}
                    InputLabelProps={{ shrink: true }}
                    required
                    label="Warranty Start Date *"
                    InputLabelProps={{ shrink: true }}
                    value={formData.warranty_start_date}
                    helperText="Must be on or after Handover Date"
                    onChange={(e) => handleWarrantyStartDateChange(e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    slotProps={{ inputLabel: { shrink: true } }}
                    InputLabelProps={{ shrink: true }}
                    label="1st Routine Service Date"
                    InputLabelProps={{ shrink: true }}
                    value={formData.first_service_due_date}
                    helperText="Auto 90 days after Handover"
                    onChange={(e) => setFormData({ ...formData, first_service_due_date: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="handover-manager-label">Handover Manager *</InputLabel>
                    <Select
                      labelId="handover-manager-label"
                      label="Handover Manager *"
                      value={formData.handover_manager}
                      onChange={(e) => setFormData({ ...formData, handover_manager: e.target.value })}
                    >
                      <MenuItem value="Vikram Rathore (Project Lead)">Vikram Rathore (Project Lead)</MenuItem>
                      <MenuItem value="Rakesh Singh Shekhawat (QC Engineer)">Rakesh Singh Shekhawat (QC Engineer)</MenuItem>
                      <MenuItem value="Adtiya Sethi (Super Admin)">Adtiya Sethi (Super Admin)</MenuItem>
                      <MenuItem value="Harshit (Project Manager)">Harshit (Project Manager)</MenuItem>
                      <MenuItem value="Amit Verma (Site Supervisor)">Amit Verma (Site Supervisor)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="handover-status-label">Overall Handover Status *</InputLabel>
                    <Select
                      labelId="handover-status-label"
                      label="Overall Handover Status *"
                      value={formData.handover_status}
                      onChange={(e) => setFormData({ ...formData, handover_status: e.target.value })}
                    >
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="In Progress">In Progress</MenuItem>
                      <MenuItem value="Completed" disabled={!canCompleteHandover}>
                        Completed {!canCompleteHandover ? "(Requires Training & Signoff)" : ""}
                      </MenuItem>
                      <MenuItem value="On Hold">On Hold</MenuItem>
                    </Select>
                    {!canCompleteHandover && (
                      <FormHelperText sx={{ color: "#D97706" }}>
                        "Completed" is blocked until Customer Training, App Demo, and Customer Signoff are confirmed.
                      </FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* SECTION 2: CUSTOMER TRAINING & MOBILE APP ONBOARDING */}
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
                2. Customer Operational Training & Mobile App
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="training-label">System Operations Training *</InputLabel>
                    <Select
                      labelId="training-label"
                      label="System Operations Training *"
                      value={formData.training_completed}
                      onChange={(e) => setFormData({ ...formData, training_completed: e.target.value })}
                    >
                      <MenuItem value="">-- Select Status --</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                      <MenuItem value="Partial">Partial</MenuItem>
                      <MenuItem value="Pending">Pending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="app-demo-label">Monitoring App Demo *</InputLabel>
                    <Select
                      labelId="app-demo-label"
                      label="Monitoring App Demo *"
                      value={formData.app_demo_completed}
                      onChange={(e) => setFormData({ ...formData, app_demo_completed: e.target.value })}
                    >
                      <MenuItem value="">-- Select Status --</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                      <MenuItem value="Partial">Partial</MenuItem>
                      <MenuItem value="Pending">Pending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="app-cred-label">Monitoring App Login Shared?</InputLabel>
                    <Select
                      labelId="app-cred-label"
                      label="Monitoring App Login Shared?"
                      value={formData.monitoring_app_access_shared}
                      onChange={(e) => setFormData({ ...formData, monitoring_app_access_shared: e.target.value })}
                    >
                      <MenuItem value={1}>Yes (Credentials handed over)</MenuItem>
                      <MenuItem value={0}>No (Pending setup)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="emergency-label">Emergency Helpline Sticker Provided?</InputLabel>
                    <Select
                      labelId="emergency-label"
                      label="Emergency Helpline Sticker Provided?"
                      value={formData.emergency_contact_given}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_given: e.target.value })}
                    >
                      <MenuItem value={1}>Yes (Pasted on Inverter)</MenuItem>
                      <MenuItem value={0}>No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* SECTION 3: GRANULAR 4-TIER WARRANTY MATRIX */}
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
                3. Granular Multi-Component Warranty End Dates
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Solar Modules (Yrs)"
                    value={formData.module_warranty_years}
                    onChange={(e) => {
                      const yrs = e.target.value;
                      setFormData({
                        ...formData,
                        module_warranty_years: yrs,
                        module_warranty_end: addYearsToDate(formData.warranty_start_date, yrs),
                      });
                    }}
                  />
                  <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, mt: 0.5 }}>
                    Expires: {formatDate(formData.module_warranty_end)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Inverter (Yrs)"
                    value={formData.inverter_warranty_years}
                    onChange={(e) => {
                      const yrs = e.target.value;
                      setFormData({
                        ...formData,
                        inverter_warranty_years: yrs,
                        inverter_warranty_end: addYearsToDate(formData.warranty_start_date, yrs),
                      });
                    }}
                  />
                  <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, mt: 0.5 }}>
                    Expires: {formatDate(formData.inverter_warranty_end)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Workmanship (Yrs)"
                    value={formData.workmanship_warranty_years}
                    onChange={(e) => {
                      const yrs = e.target.value;
                      setFormData({
                        ...formData,
                        workmanship_warranty_years: yrs,
                        workmanship_warranty_end: addYearsToDate(formData.warranty_start_date, yrs),
                      });
                    }}
                  />
                  <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, mt: 0.5 }}>
                    Expires: {formatDate(formData.workmanship_warranty_end)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Free AMC (Yrs)"
                    value={formData.amc_warranty_years}
                    onChange={(e) => {
                      const yrs = e.target.value;
                      setFormData({
                        ...formData,
                        amc_warranty_years: yrs,
                        amc_warranty_end: addYearsToDate(formData.warranty_start_date, yrs),
                      });
                    }}
                  />
                  <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, mt: 0.5 }}>
                    Expires: {formatDate(formData.amc_warranty_end)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* SECTION 4: STATUTORY DOCUMENT DOSSIER CHECKLIST */}
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
                4. Statutory Document Pack Checklist
              </Typography>
              <Grid container spacing={1}>
                {formData.documents_pack_checklist.map((doc) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={doc.id}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={doc.checked}
                          onChange={() => handleToggleChecklist(doc.id)}
                          size="small"
                          sx={{ color: COLORS.secondary, "&.Mui-checked": { color: COLORS.secondary } }}
                        />
                      }
                      label={
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: COLORS.textPrimary }}>
                          {doc.label}
                        </Typography>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider />

            {/* SECTION 5: CUSTOMER SIGNOFF & EVIDENCE LINKS */}
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
                5. Customer Acceptance Signoff & Photo Evidence
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="cust-sig-label">Customer Signature Obtained? *</InputLabel>
                    <Select
                      labelId="cust-sig-label"
                      label="Customer Signature Obtained? *"
                      value={formData.customer_signature}
                      onChange={(e) => setFormData({ ...formData, customer_signature: Number(e.target.value) })}
                    >
                      <MenuItem value={1}>Yes (Signed Docket Acquired)</MenuItem>
                      <MenuItem value={0}>No (Pending Signoff)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Signatory Customer Name"
                    value={formData.signature_signatory_name}
                    onChange={(e) => setFormData({ ...formData, signature_signatory_name: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Signatory Phone"
                    value={formData.signature_phone}
                    onChange={(e) => setFormData({ ...formData, signature_phone: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Scanned Signed Docket URL"
                    placeholder="https://.../docket.pdf"
                    value={formData.signed_docket_url}
                    onChange={(e) => setFormData({ ...formData, signed_docket_url: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Handover Site Photo URL (Customer + Plant)"
                    placeholder="https://.../customer_handover.jpg"
                    value={formData.handover_photo_url}
                    onChange={(e) => setFormData({ ...formData, handover_photo_url: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* SECTION 6: CUSTOMER FEEDBACK & REMARKS (TALL MULTI-LINE FIELDS) */}
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
                6. Customer Feedback & Engineering Remarks
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.textPrimary }}>
                      Customer Star Rating:
                    </Typography>
                    <Rating
                      value={formData.customer_rating}
                      onChange={(e, val) => setFormData({ ...formData, customer_rating: val || 5 })}
                      precision={1}
                    />
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: COLORS.secondary }}>
                      {formData.customer_rating} Star{formData.customer_rating > 1 ? "s" : ""}
                    </Typography>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    minRows={3.5}
                    InputLabelProps={{ shrink: true }}
                    label="Customer Feedback / Testimonial *"
                    placeholder="Record customer experience, feedback on crew timeliness, quality, etc."
                    value={formData.customer_feedback}
                    onChange={(e) => setFormData({ ...formData, customer_feedback: e.target.value })}
                  />
                </Grid>

                <Grid size={12}>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    slotProps={{ inputLabel: { shrink: true } }}
                    minRows={3.5}
                    InputLabelProps={{ shrink: true }}
                    label="Supervisor Handover Remarks"
                    placeholder="Internal audit notes, spare parts left on site, client special requests..."
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={saving}
            sx={{ textTransform: "none", fontWeight: 600, color: COLORS.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              backgroundColor: COLORS.primary,
              px: 3,
              "&:hover": { backgroundColor: "#020617" },
            }}
          >
            {saving ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Save Handover Dossier"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
