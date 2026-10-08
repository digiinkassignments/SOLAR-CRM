import React, { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Select,
  Grid,
  Stack,
  CircularProgress,
  Paper,
  Chip,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardMedia,
  CardContent,
  Tooltip,
} from "@mui/material";

import {
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  CheckCircle as VerifiedIcon,
  Cancel as RejectedIcon,
  HourglassEmpty as PendingIcon,
  SolarPower as SolarIcon,
  VerifiedUser as ShieldIcon,
  InsertDriveFile as FileIcon,
  OpenInNew as OpenLinkIcon,
  Save as SaveIcon,
  BadgeOutlined as BadgeIcon,
  CreditCardOutlined as CreditCardIcon,
  ElectricBoltOutlined as ElectricBoltIcon,
  AccountBalanceOutlined as AccountBalanceIcon,
  CameraAltOutlined as CameraAltIcon,
} from "@mui/icons-material";

import {
  applySubsidy,
  getSubsidyByLead,
  uploadCustomerDoc,
  verifyCustomerDoc,
} from "../services/subsidyService";

const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  primarySoft: "#FEF3C7",
  accent: "#F59E0B",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
};

const PORTAL_STEPS = [
  { id: "docs_pending", label: "Docs Pending" },
  { id: "submitted", label: "Portal Submitted" },
  { id: "feasibility_approved", label: "Feasibility Approved" },
  { id: "subsidy_approved", label: "Subsidy Approved" },
  { id: "disbursed", label: "Subsidy Disbursed" },
];

const REQUIRED_DOC_TYPES = [
  {
    type: "id_proof",
    label: "Aadhaar Card / Photo ID",
    icon: <BadgeIcon sx={{ fontSize: 20, color: "#2563EB" }} />,
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  {
    type: "pan_card",
    label: "PAN Card",
    icon: <CreditCardIcon sx={{ fontSize: 20, color: "#4F46E5" }} />,
    bg: "#EEF2FF",
    border: "#C7D2FE",
  },
  {
    type: "electricity_bill",
    label: "Latest Electricity Bill",
    icon: <ElectricBoltIcon sx={{ fontSize: 20, color: "#D97706" }} />,
    bg: "#FEF3C7",
    border: "#FDE68A",
  },
  {
    type: "bank_proof",
    label: "Bank Passbook / Cancelled Cheque (DBT)",
    icon: <AccountBalanceIcon sx={{ fontSize: 20, color: "#059669" }} />,
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
  {
    type: "site_photo",
    label: "Site Inspection Photo",
    icon: <CameraAltIcon sx={{ fontSize: 20, color: "#0D9488" }} />,
    bg: "#F0FDFA",
    border: "#99F6E4",
  },
];

export default function SubsidyTrackerDrawer({ open, onClose, lead, showSnackbar }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState(null);

  const [subsidyApp, setSubsidyApp] = useState(null);
  const [documents, setDocuments] = useState([]);

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

  useEffect(() => {
    if (open && lead?.id) {
      fetchSubsidyDetails();
    }
  }, [open, lead]);

  const fetchSubsidyDetails = async () => {
    setLoading(true);
    try {
      const res = await getSubsidyByLead(lead.id);
      if (res.success && res.data) {
        const app = res.data.application;
        setSubsidyApp(app);
        setDocuments(res.data.documents || []);

        if (app) {
          setFormData({
            consumer_number: app.consumer_number || "",
            application_number: app.application_number || "",
            scheme_name: app.scheme_name || "PM Surya Ghar Muft Bijli Yojana",
            portal_status: app.portal_status || "docs_pending",
            submission_date: app.submission_date ? String(app.submission_date).slice(0, 10) : "",
            approval_date: app.approval_date ? String(app.approval_date).slice(0, 10) : "",
            subsidy_amount: app.subsidy_amount || "78000",
            portal_notes: app.portal_notes || "",
          });
        }
      }
    } catch (err) {
      console.error("Fetch subsidy details error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApplication = async () => {
    if (!lead?.id) return;
    if (!formData.consumer_number) {
      showSnackbar && showSnackbar("Consumer Number is required for PM Surya Ghar portal tracking.", "warning");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        lead_id: lead.id,
      };
      const res = await applySubsidy(payload);
      if (res.success) {
        showSnackbar && showSnackbar("PM Surya Ghar Portal details saved successfully!", "success");
        setSubsidyApp(res.data?.application || res.data);
      } else {
        showSnackbar && showSnackbar(res.message || "Failed to save subsidy details.", "error");
      }
    } catch (err) {
      console.error("Save subsidy error:", err);
      showSnackbar && showSnackbar("Server error saving subsidy application.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file || !lead?.id) return;

    setUploadingType(docType);
    try {
      const data = new FormData();
      data.append("document", file);
      data.append("lead_id", lead.id);
      data.append("document_type", docType);

      const res = await uploadCustomerDoc(data);
      if (res.success && res.data) {
        setDocuments(res.data);
        showSnackbar && showSnackbar("Document uploaded into Customer Vault!", "success");
      }
    } catch (err) {
      console.error("Doc upload error:", err);
      showSnackbar && showSnackbar("Failed to upload document.", "error");
    } finally {
      setUploadingType(null);
    }
  };

  const handleVerifyStatus = async (docId, status, rejectionReason = null) => {
    try {
      const res = await verifyCustomerDoc(docId, {
        verification_status: status,
        rejection_reason: rejectionReason,
      });
      if (res.success) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, verification_status: status } : d))
        );
        showSnackbar && showSnackbar(`Document marked as ${status}.`, "success");
      }
    } catch (err) {
      console.error("Verify status error:", err);
    }
  };

  const activeStepIndex = PORTAL_STEPS.findIndex((s) => s.id === formData.portal_status);

  const getFileFullUrl = (url) => {
    if (!url) return "#";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    const apiBase = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "";
    if (apiBase.startsWith("http")) {
      try {
        const parsed = new URL(apiBase);
        return `${parsed.origin}${cleanPath}`;
      } catch (e) {}
    }
    if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
      return `http://localhost:5000${cleanPath}`;
    }
    return `${window.location.origin}${cleanPath}`;
  };

  return (
    <Drawer
      anchor="right"
      open={Boolean(open)}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 580, md: 680 },
          bgcolor: "#F8FAFC",
        },
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          p: 2.5,
          background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, #0F172A 100%)`,
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: "10px",
              backgroundColor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldIcon sx={{ color: "#FFFFFF", fontSize: 26 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", fontFamily: "'Inter', sans-serif" }}>
              PM Surya Ghar Subsidy Hub & Vault
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.85)", fontFamily: "'Inter', sans-serif" }}>
              Track portal status, consumer number, & customer KYC vault
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: "#FFFFFF" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* BODY */}
      <Box sx={{ p: 2.5, overflowY: "auto", flexGrow: 1 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={40} sx={{ color: COLORS.primary }} />
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* LEAD & CONSUMER HEADER */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, bgcolor: "#FFFFFF" }}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={12} sm={7}>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: COLORS.textPrimary }}>
                    👤 {lead?.customer_name} ({lead?.lead_code})
                  </Typography>
                  <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary, mt: 0.3 }}>
                    📞 {lead?.mobile_number} | 📍 {lead?.city || lead?.state || "India"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={5} sx={{ textAlign: { xs: "left", sm: "right" } }}>
                  <Chip
                    label={`Subsidy: ₹${Number(formData.subsidy_amount || 78000).toLocaleString("en-IN")}`}
                    color="success"
                    size="small"
                    sx={{ fontWeight: 800, fontSize: "0.75rem" }}
                  />
                  <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, mt: 0.5 }}>
                    🏛️ PM Surya Ghar Muft Bijli Yojana
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* STEPPER: NATIONAL PORTAL PROGRESS */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "12px", border: `1px solid ${COLORS.border}`, bgcolor: "#FFFFFF" }}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: COLORS.primaryDark, textTransform: "uppercase", letterSpacing: "0.04em", mb: 2 }}>
                1. National Subsidy Portal Stepper Progress
              </Typography>
              <Stepper activeStep={activeStepIndex >= 0 ? activeStepIndex : 0} alternativeLabel sx={{ pt: 1 }}>
                {PORTAL_STEPS.map((step) => (
                  <Step key={step.id}>
                    <StepLabel
                      componentsProps={{
                        label: {
                          style: {
                            fontSize: "0.7rem",
                            fontWeight: 700,
                          },
                        },
                      }}
                    >
                      {step.label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Paper>

            {/* FORM: CONSUMER & APPLICATION NUMBER DETAILS */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "12px", border: `1px solid ${COLORS.border}`, bgcolor: "#FFFFFF" }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: COLORS.primaryDark, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  2. DISCOM Consumer & Portal Application Specs
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSaveApplication}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: "8px",
                    fontSize: "0.78rem",
                    backgroundColor: COLORS.primary,
                  }}
                >
                  {saving ? "Saving..." : "Save Portal Data"}
                </Button>
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
                    Electricity Bill Consumer No. *
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. 1029384756"
                    value={formData.consumer_number}
                    onChange={(e) => setFormData((p) => ({ ...p, consumer_number: e.target.value }))}
                    sx={{ "& input": { fontSize: "0.82rem", fontWeight: 700 } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
                    PM Surya Ghar Application No.
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. PMSG-2026-98765"
                    value={formData.application_number}
                    onChange={(e) => setFormData((p) => ({ ...p, application_number: e.target.value }))}
                    sx={{ "& input": { fontSize: "0.82rem", fontWeight: 700 } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
                    Portal Status *
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={formData.portal_status}
                    onChange={(e) => setFormData((p) => ({ ...p, portal_status: e.target.value }))}
                    sx={{ borderRadius: "8px", fontSize: "0.82rem" }}
                  >
                    {PORTAL_STEPS.map((s) => (
                      <MenuItem key={s.id} value={s.id} sx={{ fontSize: "0.82rem" }}>
                        {s.label}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
                    Eligible Subsidy Amount (₹)
                  </Typography>
                  <TextField
                    type="number"
                    fullWidth
                    size="small"
                    placeholder="78000"
                    value={formData.subsidy_amount}
                    onChange={(e) => setFormData((p) => ({ ...p, subsidy_amount: e.target.value }))}
                    sx={{ "& input": { fontSize: "0.82rem", fontWeight: 700, color: COLORS.success } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
                    Portal Submission Date
                  </Typography>
                  <TextField
                    type="date"
                    fullWidth
                    size="small"
                    value={formData.submission_date}
                    onChange={(e) => setFormData((p) => ({ ...p, submission_date: e.target.value }))}
                    sx={{ "& input": { fontSize: "0.82rem" } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
                    Subsidy Approval Date
                  </Typography>
                  <TextField
                    type="date"
                    fullWidth
                    size="small"
                    value={formData.approval_date}
                    onChange={(e) => setFormData((p) => ({ ...p, approval_date: e.target.value }))}
                    sx={{ "& input": { fontSize: "0.82rem" } }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* SECTION 3: CUSTOMER KYC DOCUMENT VAULT */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "12px", border: `1px solid ${COLORS.border}`, bgcolor: "#FFFFFF" }}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: COLORS.primaryDark, textTransform: "uppercase", letterSpacing: "0.04em", mb: 0.5 }}>
                3. Customer KYC Document Vault & Verification
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, mb: 2 }}>
                Upload Aadhaar, PAN, Electricity Bill, and Bank Passbook for PM Surya Ghar portal submission.
              </Typography>

              <Grid container spacing={2}>
                {REQUIRED_DOC_TYPES.map((docDef) => {
                  const uploaded = documents.filter((d) => d.document_type === docDef.type);
                  const isUploading = uploadingType === docDef.type;

                  return (
                    <Grid item xs={12} key={docDef.type}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.8,
                          borderRadius: "10px",
                          border: `1px solid ${uploaded.length > 0 ? COLORS.border : "#CBD5E1"}`,
                          bgcolor: uploaded.length > 0 ? "#FAFAFA" : "#FFFBEB",
                        }}
                      >
                        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5}>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box
                              sx={{
                                width: 38,
                                height: 38,
                                borderRadius: "8px",
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
                              <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: COLORS.textPrimary }}>
                                {docDef.label}
                              </Typography>
                              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>
                                {uploaded.length > 0 ? `${uploaded.length} file(s) attached` : "Required for portal submission"}
                              </Typography>
                            </Box>
                          </Stack>

                          <Button
                            component="label"
                            variant="outlined"
                            size="small"
                            startIcon={isUploading ? <CircularProgress size={14} /> : <UploadIcon />}
                            disabled={isUploading}
                            sx={{
                              textTransform: "none",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              borderRadius: "8px",
                              borderColor: COLORS.primary,
                              color: COLORS.primary,
                            }}
                          >
                            Upload File
                            <input
                              type="file"
                              hidden
                              accept="image/*,application/pdf"
                              onChange={(e) => handleFileUpload(e, docDef.type)}
                            />
                          </Button>
                        </Stack>

                        {/* LIST ATTACHED FILES FOR THIS TYPE */}
                        {uploaded.length > 0 && (
                          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px dashed ${COLORS.border}` }}>
                            <Stack spacing={1}>
                              {uploaded.map((doc) => (
                                <Stack key={doc.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ bgcolor: "#FFFFFF", p: 1, px: 1.5, borderRadius: "6px", border: `1px solid ${COLORS.border}` }}>
                                  <Stack direction="row" alignItems="center" spacing={1} sx={{ overflow: "hidden" }}>
                                    <FileIcon sx={{ fontSize: 18, color: COLORS.primary }} />
                                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: COLORS.textPrimary, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: 200 }}>
                                      {doc.file_name || "Document File"}
                                    </Typography>
                                    <Chip
                                      label={doc.verification_status || "pending"}
                                      size="small"
                                      color={doc.verification_status === "verified" ? "success" : doc.verification_status === "rejected" ? "error" : "warning"}
                                      sx={{ fontSize: "0.68rem", fontWeight: 700, height: 20 }}
                                    />
                                  </Stack>

                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    <IconButton
                                      component="a"
                                      href={getFileFullUrl(doc.file_url)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      size="small"
                                      sx={{ color: COLORS.primary }}
                                    >
                                      <OpenLinkIcon fontSize="small" />
                                    </IconButton>
                                    <Button
                                      size="small"
                                      variant={doc.verification_status === "verified" ? "contained" : "outlined"}
                                      color="success"
                                      onClick={() => handleVerifyStatus(doc.id, doc.verification_status === "verified" ? "pending" : "verified")}
                                      sx={{ fontSize: "0.68rem", py: 0.2, px: 1, textTransform: "none", minWidth: 60 }}
                                    >
                                      {doc.verification_status === "verified" ? "Verified" : "Verify"}
                                    </Button>
                                  </Stack>
                                </Stack>
                              ))}
                            </Stack>
                          </Box>
                        )}
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}
