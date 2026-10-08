import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  MenuItem,
  Select,
  FormControl,
  Breadcrumbs,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress,
} from "@mui/material";

// Icons (100% Professional MUI Icons — Zero Emojis)
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import ElectricBoltOutlinedIcon from "@mui/icons-material/ElectricBoltOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

import toast from "react-hot-toast";
import api from "../../../utils/api";
import {
  applySubsidy,
  getSubsidyByLead,
  uploadCustomerDoc,
  verifyCustomerDoc,
} from "../../../services/subsidyService";

// Theme constants
const COLORS = {
  primary: "#0F172A",
  secondary: "#F59E0B",
  background: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  primaryDark: "#0F172A",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
};

// 5 Portal Stages in order
const PORTAL_STEPS = [
  { id: "docs_pending", label: "Docs Pending", stepNumber: 1 },
  { id: "submitted", label: "Portal Submitted", stepNumber: 2 },
  { id: "feasibility_approved", label: "Feasibility Approved", stepNumber: 3 },
  { id: "subsidy_approved", label: "Subsidy Approved", stepNumber: 4 },
  { id: "disbursed", label: "Subsidy Disbursed (DBT)", stepNumber: 5 },
];

// Document Types with Professional MUI Icons & Theme Colors
const REQUIRED_DOC_TYPES = [
  {
    type: "id_proof",
    label: "Aadhaar Card / Photo ID",
    desc: "Proof of applicant identity for PM Surya Ghar portal submission",
    icon: <BadgeOutlinedIcon sx={{ fontSize: 24, color: "#2563EB" }} />,
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  {
    type: "pan_card",
    label: "PAN Card",
    desc: "Taxpayer identification for DBT subsidy verification",
    icon: <CreditCardOutlinedIcon sx={{ fontSize: 24, color: "#4F46E5" }} />,
    bg: "#EEF2FF",
    border: "#C7D2FE",
  },
  {
    type: "electricity_bill",
    label: "Latest Electricity Bill",
    desc: "DISCOM CA consumer bill matching solar installation address",
    icon: <ElectricBoltOutlinedIcon sx={{ fontSize: 24, color: "#D97706" }} />,
    bg: "#FEF3C7",
    border: "#FDE68A",
  },
  {
    type: "bank_proof",
    label: "Bank Passbook / Cancelled Cheque (DBT)",
    desc: "Bank account details for direct benefit transfer of ₹78,000",
    icon: <AccountBalanceOutlinedIcon sx={{ fontSize: 24, color: "#059669" }} />,
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
  {
    type: "site_photo",
    label: "Site Inspection Photo",
    desc: "Rooftop solar site photo before/after installation",
    icon: <CameraAltOutlinedIcon sx={{ fontSize: 24, color: "#0D9488" }} />,
    bg: "#CCFBF1",
    border: "#99F6E4",
  },
];

export default function SubsidyDetail() {
  const { leadId } = useParams();
  const navigate = useNavigate();

  // Data states
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState(null);
  const [documents, setDocuments] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    consumer_number: "",
    application_number: "",
    scheme_name: "PM Surya Ghar Muft Bijli Yojana",
    portal_status: "docs_pending",
    submission_date: "",
    approval_date: "",
    subsidy_amount: "78000",
    portal_notes: "",
  });

  // Rejection Dialog State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingDocId, setRejectingDocId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch Lead Info and Subsidy Details
  const fetchData = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      // 1. Fetch Lead Details
      let leadObj = null;
      try {
        const leadRes = await api.get(`/leads/${leadId}`);
        if (leadRes.data?.success) {
          leadObj = leadRes.data.data;
        }
      } catch (e) {
        // Fallback: fetch from /leads
        try {
          const allRes = await api.get("/leads");
          const list = allRes.data?.data?.leads || allRes.data?.data || [];
          leadObj = list.find((l) => String(l.id) === String(leadId)) || null;
        } catch (e2) {}
      }

      setLead(leadObj);

      // 2. Fetch Subsidy Details & Documents
      const subRes = await getSubsidyByLead(leadId);
      if (subRes.success && subRes.data) {
        const app = subRes.data.application;
        setDocuments(subRes.data.documents || []);

        if (app) {
          setFormData({
            consumer_number: app.consumer_number || "",
            application_number: app.application_number || "",
            scheme_name: app.scheme_name || "PM Surya Ghar Muft Bijli Yojana",
            portal_status: app.portal_status || "docs_pending",
            submission_date: app.submission_date
              ? String(app.submission_date).slice(0, 10)
              : "",
            approval_date: app.approval_date
              ? String(app.approval_date).slice(0, 10)
              : "",
            subsidy_amount: app.subsidy_amount || "78000",
            portal_notes: app.portal_notes || "",
          });
        }
      }
    } catch (err) {
      console.error("fetchData error:", err);
      toast.error("Failed to load subsidy details");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save Portal Application Details
  const handleSaveApplication = async () => {
    if (!formData.consumer_number.trim()) {
      toast.error("Electricity Bill Consumer Number is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        lead_id: leadId,
      };

      const res = await applySubsidy(payload);
      if (res.success) {
        toast.success("PM Surya Ghar Portal details saved successfully!");
        fetchData();
      } else {
        toast.error(res.message || "Failed to save subsidy details.");
      }
    } catch (err) {
      console.error("Save subsidy error:", err);
      toast.error(err.response?.data?.message || "Error saving subsidy application.");
    } finally {
      setSaving(false);
    }
  };

  // Upload KYC Document File
  const handleFileUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingType(docType);
    try {
      const data = new FormData();
      data.append("document", file);
      data.append("lead_id", leadId);
      data.append("document_type", docType);

      const res = await uploadCustomerDoc(data);
      if (res.success && res.data) {
        setDocuments(res.data);
        toast.success("Document uploaded successfully into Customer Vault!");
      } else {
        toast.error(res.message || "Upload failed.");
      }
    } catch (err) {
      console.error("Doc upload error:", err);
      toast.error(err.response?.data?.message || "Failed to upload document file.");
    } finally {
      setUploadingType(null);
    }
  };

  // Verify or Reject Document
  const handleVerifyStatus = async (docId, status, reason = null) => {
    try {
      const res = await verifyCustomerDoc(docId, {
        verification_status: status,
        rejection_reason: reason,
      });

      if (res.success) {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === docId
              ? { ...d, verification_status: status, rejection_reason: reason }
              : d
          )
        );
        toast.success(`Document marked as ${status}.`);
      }
    } catch (err) {
      console.error("Verify status error:", err);
      toast.error("Failed to update document verification status.");
    }
  };

  const handleOpenRejectDialog = (docId) => {
    setRejectingDocId(docId);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Please enter a rejection reason.");
      return;
    }
    handleVerifyStatus(rejectingDocId, "rejected", rejectionReason);
    setRejectModalOpen(false);
  };

  // Clean full file URL resolution
  const getFileFullUrl = (url) => {
    if (!url) return "#";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    const apiBase =
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
      "";
    if (apiBase.startsWith("http")) {
      try {
        const parsed = new URL(apiBase);
        return `${parsed.origin}${cleanPath}`;
      } catch (e) {}
    }
    return cleanPath;
  };

  const activeStepIdx = PORTAL_STEPS.findIndex(
    (s) => s.id === formData.portal_status
  );

  return (
    <Box
      sx={{
        backgroundColor: COLORS.background,
        minHeight: "100vh",
        p: 2.5,
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "100%", mx: "auto" }}>
        {/* SECTION 1: HEADER & BREADCRUMBS */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1.5 }}
        >
          <Breadcrumbs
            separator={
              <NavigateNextRoundedIcon
                sx={{ fontSize: "0.8rem", color: COLORS.textMuted }}
              />
            }
          >
            <Stack
              direction="row"
              alignItems="center"
              gap={0.5}
              sx={{ cursor: "pointer" }}
              onClick={() => navigate("/dashboard")}
            >
              <HomeOutlinedIcon
                sx={{ fontSize: "0.85rem", color: COLORS.textMuted }}
              />
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: COLORS.textMuted,
                  "&:hover": { color: COLORS.primary },
                }}
              >
                Dashboard
              </Typography>
            </Stack>

            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: COLORS.textMuted,
                cursor: "pointer",
                "&:hover": { color: COLORS.primary },
              }}
              onClick={() => navigate("/subsidies")}
            >
              Subsidy Tracking
            </Typography>

            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: COLORS.primaryDark,
              }}
            >
              {lead?.customer_name || lead?.name || `Lead #${leadId}`}
            </Typography>
          </Breadcrumbs>

          <Button
            startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate("/subsidies")}
            size="small"
            sx={{
              textTransform: "none",
              color: COLORS.textSecondary,
              fontWeight: 600,
              fontSize: "0.8rem",
            }}
          >
            Back to Subsidy List
          </Button>
        </Stack>

        {/* HERO PAPER HEADER */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 2.5,
            borderRadius: "14px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2,
          }}
        >
          <Box>
            <Stack direction="row" alignItems="center" gap={1.2} sx={{ mb: 0.5 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: COLORS.primaryDark,
                  fontSize: "1.2rem",
                }}
              >
                {lead?.customer_name || lead?.name || "Customer Subsidy File"}
              </Typography>
              <Chip
                label={lead?.lead_code || `LEAD-${leadId}`}
                size="small"
                sx={{
                  fontFamily: "monospace",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  backgroundColor: "#F1F5F9",
                  color: COLORS.primaryDark,
                  height: 24,
                }}
              />
            </Stack>

            <Stack
              direction="row"
              alignItems="center"
              gap={2}
              flexWrap="wrap"
              sx={{ mt: 0.5 }}
            >
              {lead?.mobile_number && (
                <Stack direction="row" alignItems="center" gap={0.6}>
                  <PhoneIcon sx={{ fontSize: 14, color: COLORS.textMuted }} />
                  <Typography
                    component="a"
                    href={`tel:${lead.mobile_number}`}
                    sx={{
                      fontSize: "0.78rem",
                      color: COLORS.textSecondary,
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    {lead.mobile_number}
                  </Typography>
                </Stack>
              )}

              {(lead?.city || lead?.state) && (
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <LocationOnOutlinedIcon
                    sx={{ fontSize: 14, color: COLORS.textMuted }}
                  />
                  <Typography
                    sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}
                  >
                    {[lead?.city, lead?.state].filter(Boolean).join(", ")}
                  </Typography>
                </Stack>
              )}

              <Chip
                label="PM Surya Ghar Muft Bijli Yojana"
                size="small"
                sx={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  backgroundColor: "#FEF3C7",
                  color: "#D97706",
                  height: 22,
                }}
              />
            </Stack>
          </Box>

          <Stack direction="row" alignItems="center" gap={1.2}>
            <Tooltip title="Refresh Page Data">
              <IconButton
                onClick={fetchData}
                disabled={loading}
                size="small"
                sx={{
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "8px",
                  p: 0.8,
                }}
              >
                <RefreshIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              startIcon={<SaveOutlinedIcon sx={{ fontSize: 17 }} />}
              onClick={handleSaveApplication}
              disabled={saving}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.82rem",
                px: 2.2,
                backgroundColor: COLORS.primary,
                color: "#FFFFFF",
                "&:hover": { backgroundColor: "#020617" },
              }}
            >
              {saving ? "Saving..." : "Save Portal Details"}
            </Button>
          </Stack>
        </Paper>

        {/* SECTION 2: PM SURYA GHAR 5-STAGE PROGRESS STEPPER */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 2.5,
            borderRadius: "14px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 800,
              color: COLORS.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              mb: 2,
            }}
          >
            PM Surya Ghar National Portal Progression
          </Typography>

          <Grid container spacing={1.5} alignItems="center">
            {PORTAL_STEPS.map((step, idx) => {
              const isCompleted = idx < activeStepIdx;
              const isCurrent = idx === activeStepIdx;

              return (
                <Grid item xs={12} sm={6} md={2.4} key={step.id}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "10px",
                      border: `1px solid ${
                        isCurrent
                          ? "#F59E0B"
                          : isCompleted
                          ? "#A7F3D0"
                          : COLORS.border
                      }`,
                      backgroundColor: isCurrent
                        ? "#FEF3C7"
                        : isCompleted
                        ? "#ECFDF5"
                        : "#F8FAFC",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.2,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        backgroundColor: isCurrent
                          ? "#F59E0B"
                          : isCompleted
                          ? "#10B981"
                          : "#E2E8F0",
                        color: isCurrent || isCompleted ? "#FFFFFF" : COLORS.textMuted,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "0.75rem",
                        flexShrink: 0,
                      }}
                    >
                      {isCompleted ? (
                        <CheckIcon sx={{ fontSize: 16 }} />
                      ) : (
                        step.stepNumber
                      )}
                    </Box>

                    <Box sx={{ overflow: "hidden" }}>
                      <Typography
                        noWrap
                        sx={{
                          fontSize: "0.78rem",
                          fontWeight: isCurrent ? 800 : 700,
                          color: isCurrent
                            ? "#92400E"
                            : isCompleted
                            ? "#065F46"
                            : COLORS.textSecondary,
                        }}
                      >
                        {step.label}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.68rem",
                          color: isCurrent
                            ? "#B45309"
                            : isCompleted
                            ? "#047857"
                            : COLORS.textMuted,
                          fontWeight: 600,
                        }}
                      >
                        {isCompleted
                          ? "Completed"
                          : isCurrent
                          ? "In Progress"
                          : "Pending"}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Paper>

        {/* SECTION 3: TWO COLUMN DETAILED GRID */}
        {loading ? (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={5}>
              <Skeleton variant="rectangular" height={450} sx={{ borderRadius: "14px" }} />
            </Grid>
            <Grid item xs={12} md={7}>
              <Skeleton variant="rectangular" height={450} sx={{ borderRadius: "14px" }} />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2.5}>
            {/* LEFT COLUMN: APPLICATION & CONSUMER INFO */}
            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "14px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.card,
                  height: "100%",
                  boxSizing: "border-box",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    color: COLORS.primaryDark,
                    mb: 0.5,
                  }}
                >
                  DISCOM & Portal Details
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    color: COLORS.textSecondary,
                    mb: 2.5,
                  }}
                >
                  Consumer bill details and National Solar Portal status
                </Typography>

                <Stack spacing={2}>
                  {/* Consumer Number */}
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: COLORS.textPrimary,
                        mb: 0.5,
                      }}
                    >
                      Electricity Bill Consumer No. *
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. 1029384756"
                      value={formData.consumer_number}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          consumer_number: e.target.value,
                        }))
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                        },
                      }}
                    />
                  </Box>

                  {/* Application Number */}
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: COLORS.textPrimary,
                        mb: 0.5,
                      }}
                    >
                      PM Surya Ghar Application No.
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. PMSG-2026-98765"
                      value={formData.application_number}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          application_number: e.target.value,
                        }))
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          fontSize: "0.82rem",
                        },
                      }}
                    />
                  </Box>

                  {/* Portal Status */}
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: COLORS.textPrimary,
                        mb: 0.5,
                      }}
                    >
                      Current Portal Status *
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={formData.portal_status}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            portal_status: e.target.value,
                          }))
                        }
                        sx={{ borderRadius: "8px", fontSize: "0.82rem" }}
                      >
                        {PORTAL_STEPS.map((s) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Subsidy Benefit Banner */}
                  <Box
                    sx={{
                      p: 1.8,
                      borderRadius: "10px",
                      backgroundColor: "#ECFDF5",
                      border: "1px solid #A7F3D0",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: "#047857",
                        textTransform: "uppercase",
                      }}
                    >
                      Central Government DBT Subsidy
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "1.3rem",
                        fontWeight: 900,
                        color: "#065F46",
                        mt: 0.2,
                      }}
                    >
                      ₹78,000 (Direct to Bank)
                    </Typography>
                    <Typography
                      sx={{ fontSize: "0.72rem", color: "#047857", mt: 0.3 }}
                    >
                      Transferred directly to consumer's Aadhaar-linked bank account
                    </Typography>
                  </Box>

                  {/* Dates */}
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        sx={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: COLORS.textPrimary,
                          mb: 0.5,
                        }}
                      >
                        Submission Date
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        value={formData.submission_date}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            submission_date: e.target.value,
                          }))
                        }
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                            fontSize: "0.82rem",
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography
                        sx={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: COLORS.textPrimary,
                          mb: 0.5,
                        }}
                      >
                        Approval Date
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        value={formData.approval_date}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            approval_date: e.target.value,
                          }))
                        }
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                            fontSize: "0.82rem",
                          },
                        }}
                      />
                    </Grid>
                  </Grid>

                  {/* Portal Remarks / Notes */}
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: COLORS.textPrimary,
                        mb: 0.5,
                      }}
                    >
                      Portal Remarks & Notes
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Remarks from DISCOM portal, inspection officer notes..."
                      value={formData.portal_notes}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          portal_notes: e.target.value,
                        }))
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          fontSize: "0.82rem",
                        },
                      }}
                    />
                  </Box>

                  {/* Save Details Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    size="medium"
                    startIcon={<SaveOutlinedIcon sx={{ fontSize: 18 }} />}
                    onClick={handleSaveApplication}
                    disabled={saving}
                    sx={{
                      height: 42,
                      borderRadius: "8px",
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      backgroundColor: COLORS.primary,
                      color: "#FFFFFF",
                      "&:hover": { backgroundColor: "#020617" },
                    }}
                  >
                    {saving ? "Saving Details..." : "Save Application Details"}
                  </Button>
                </Stack>
              </Paper>
            </Grid>

            {/* RIGHT COLUMN: PROFESSIONAL KYC DOCUMENT VAULT */}
            <Grid item xs={12} md={7}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "14px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.card,
                  height: "100%",
                  boxSizing: "border-box",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    color: COLORS.primaryDark,
                    mb: 0.5,
                  }}
                >
                  Customer KYC Document Vault & Verification
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    color: COLORS.textSecondary,
                    mb: 2.5,
                  }}
                >
                  Upload Aadhaar, PAN, Electricity Bill, and Bank Passbook for PM Surya Ghar portal submission.
                </Typography>

                {/* ROW BY ROW DOCUMENT CARDS (Generous spacing, professional layout, zero emojis) */}
                <Stack spacing={2}>
                  {REQUIRED_DOC_TYPES.map((docDef) => {
                    const uploadedList = documents.filter(
                      (d) => d.document_type === docDef.type
                    );
                    const uploaded =
                      uploadedList.length > 0 ? uploadedList[0] : null;
                    const isUploading = uploadingType === docDef.type;
                    const isVerified =
                      uploaded?.verification_status === "verified";
                    const isRejected =
                      uploaded?.verification_status === "rejected";
                    const isPending =
                      uploaded && uploaded.verification_status === "pending";

                    return (
                      <Paper
                        key={docDef.type}
                        elevation={0}
                        sx={{
                          p: 2.2,
                          borderRadius: "12px",
                          border: `1px solid ${
                            isVerified
                              ? "#A7F3D0"
                              : isRejected
                              ? "#FECACA"
                              : uploaded
                              ? COLORS.border
                              : "#E2E8F0"
                          }`,
                          backgroundColor: isVerified
                            ? "#F0FDF4"
                            : isRejected
                            ? "#FEF2F2"
                            : uploaded
                            ? "#FFFFFF"
                            : "#F8FAFC",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", sm: "center" }}
                          gap={2}
                        >
                          {/* Left: Professional Icon + Document Title + Details */}
                          <Stack direction="row" alignItems="center" gap={1.8}>
                            <Box
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: "10px",
                                backgroundColor: docDef.bg,
                                border: `1px solid ${docDef.border}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {docDef.icon}
                            </Box>

                            <Box>
                              <Typography
                                sx={{
                                  fontWeight: 800,
                                  fontSize: "0.88rem",
                                  color: COLORS.textPrimary,
                                  lineHeight: 1.25,
                                }}
                              >
                                {docDef.label}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: "0.72rem",
                                  color: COLORS.textSecondary,
                                  mt: 0.3,
                                }}
                              >
                                {uploaded
                                  ? uploaded.file_name || "Document attached"
                                  : docDef.desc}
                              </Typography>
                            </Box>
                          </Stack>

                          {/* Right: Status Chip & Action Buttons */}
                          <Stack
                            direction="row"
                            alignItems="center"
                            gap={1}
                            flexWrap="wrap"
                          >
                            {/* Verification Chip */}
                            {uploaded ? (
                              <Chip
                                icon={
                                  isVerified ? (
                                    <CheckCircleOutlinedIcon sx={{ fontSize: 14 }} />
                                  ) : isRejected ? (
                                    <CancelOutlinedIcon sx={{ fontSize: 14 }} />
                                  ) : (
                                    <HourglassEmptyOutlinedIcon
                                      sx={{ fontSize: 14 }}
                                    />
                                  )
                                }
                                label={
                                  isVerified
                                    ? "Verified"
                                    : isRejected
                                    ? "Rejected"
                                    : "Pending Review"
                                }
                                size="small"
                                sx={{
                                  height: 26,
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  color: isVerified
                                    ? "#047857"
                                    : isRejected
                                    ? "#B91C1C"
                                    : "#B45309",
                                  backgroundColor: isVerified
                                    ? "#D1FAE5"
                                    : isRejected
                                    ? "#FEE2E2"
                                    : "#FEF3C7",
                                  borderRadius: "6px",
                                }}
                              />
                            ) : (
                              <Chip
                                label="Not Uploaded"
                                size="small"
                                sx={{
                                  height: 26,
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  color: COLORS.textMuted,
                                  backgroundColor: "#E2E8F0",
                                  borderRadius: "6px",
                                }}
                              />
                            )}

                            {/* View Document Button */}
                            {uploaded && (
                              <Button
                                component="a"
                                href={getFileFullUrl(uploaded.file_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="outlined"
                                size="small"
                                startIcon={
                                  <VisibilityOutlinedIcon sx={{ fontSize: 15 }} />
                                }
                                sx={{
                                  height: 30,
                                  borderRadius: "6px",
                                  textTransform: "none",
                                  fontSize: "0.74rem",
                                  fontWeight: 700,
                                  borderColor: COLORS.border,
                                  color: COLORS.primaryDark,
                                  "&:hover": {
                                    backgroundColor: "#F1F5F9",
                                    borderColor: COLORS.primary,
                                  },
                                }}
                              >
                                View File
                              </Button>
                            )}

                            {/* Upload / Re-upload Button */}
                            <Button
                              component="label"
                              variant="outlined"
                              size="small"
                              startIcon={
                                isUploading ? (
                                  <CircularProgress size={13} />
                                ) : (
                                  <CloudUploadOutlinedIcon sx={{ fontSize: 15 }} />
                                )
                              }
                              disabled={isUploading}
                              sx={{
                                height: 30,
                                borderRadius: "6px",
                                textTransform: "none",
                                fontSize: "0.74rem",
                                fontWeight: 700,
                                borderColor: COLORS.border,
                                color: COLORS.primary,
                                "&:hover": {
                                  backgroundColor: "#F8FAFC",
                                  borderColor: COLORS.primary,
                                },
                              }}
                            >
                              {uploaded ? "Re-upload" : "Upload File"}
                              <input
                                type="file"
                                hidden
                                accept="image/*,application/pdf"
                                onChange={(e) =>
                                  handleFileUpload(e, docDef.type)
                                }
                              />
                            </Button>

                            {/* Verification Actions (Verify / Reject) */}
                            {uploaded && isPending && (
                              <Stack direction="row" gap={0.5}>
                                <Tooltip title="Mark Document as Verified">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleVerifyStatus(uploaded.id, "verified")
                                    }
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      borderRadius: "6px",
                                      backgroundColor: "#ECFDF5",
                                      color: "#059669",
                                      "&:hover": {
                                        backgroundColor: "#D1FAE5",
                                      },
                                    }}
                                  >
                                    <CheckCircleOutlinedIcon
                                      sx={{ fontSize: 16 }}
                                    />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Reject Document with Reason">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleOpenRejectDialog(uploaded.id)
                                    }
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      borderRadius: "6px",
                                      backgroundColor: "#FEF2F2",
                                      color: "#DC2626",
                                      "&:hover": {
                                        backgroundColor: "#FEE2E2",
                                      },
                                    }}
                                  >
                                    <CancelOutlinedIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            )}
                          </Stack>
                        </Stack>

                        {/* Rejection Reason Notice */}
                        {uploaded && isRejected && uploaded.rejection_reason && (
                          <Box
                            sx={{
                              mt: 1.5,
                              p: 1.2,
                              borderRadius: "6px",
                              backgroundColor: "#FEF2F2",
                              border: "1px solid #FECACA",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                color: "#DC2626",
                              }}
                            >
                              Rejection Reason: {uploaded.rejection_reason}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    );
                  })}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* REJECTION REASON DIALOG */}
      <Dialog
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            p: 1,
            backgroundColor: COLORS.card,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            fontSize: "1rem",
            color: COLORS.primaryDark,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Reject KYC Document
          <IconButton
            size="small"
            onClick={() => setRejectModalOpen(false)}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ py: 1 }}>
          <Typography
            sx={{
              fontSize: "0.8rem",
              color: COLORS.textSecondary,
              mb: 1.5,
            }}
          >
            Please provide a specific reason for rejection so the customer or field agent can re-upload:
          </Typography>

          <TextField
            fullWidth
            size="small"
            multiline
            rows={3}
            placeholder="e.g. Blurry photo, name mismatch on electricity bill, expired document..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                fontSize: "0.82rem",
              },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setRejectModalOpen(false)}
            sx={{
              color: COLORS.textSecondary,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmReject}
            sx={{
              backgroundColor: "#DC2626",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "6px",
              "&:hover": { backgroundColor: "#B91C1C" },
            }}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
