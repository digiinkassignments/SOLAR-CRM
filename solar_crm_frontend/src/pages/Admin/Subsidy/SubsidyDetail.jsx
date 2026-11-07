import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Switch,
  FormControlLabel,
  Alert,
  AlertTitle,
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
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import SolarPowerOutlinedIcon from "@mui/icons-material/SolarPowerOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import HistoryIcon from "@mui/icons-material/History";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import DoneAllIcon from "@mui/icons-material/DoneAll";

import DocumentCaptureModal from "../../../components/DocumentCaptureModal";
import toast from "react-hot-toast";
import api from "../../../utils/api";
import {
  applySubsidy,
  getSubsidyByLead,
  uploadCustomerDoc,
  verifyCustomerDoc,
  logSubsidyRejection,
  resolveRejectionFixTask,
} from "../../../services/subsidyService";

// Theme constants
const COLORS = {
  primary: "#0F172A", // Slate 900
  secondary: "#F59E0B", // Solar Amber
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
  info: "#3B82F6",
};

// 9 Real Portal Stages in exact order + owners and SLA
const PORTAL_STAGES = [
  {
    id: "registered",
    stepNumber: 1,
    label: "Registered",
    shortLabel: "Registered",
    owner: "Your Team",
    ownerType: "team",
    expectedDays: 2,
    chase: "Your Team (Complete National Portal registration)",
    requiredDocs: ["electricity_bill", "id_proof"],
  },
  {
    id: "feasibility_approved",
    stepNumber: 2,
    label: "Feasibility Approved",
    shortLabel: "Feasibility",
    owner: "DISCOM",
    ownerType: "discom",
    expectedDays: 7,
    chase: "DISCOM Junior Engineer (JE) / Feasibility Desk",
    requiredDocs: ["inspection_report"],
  },
  {
    id: "vendor_selected",
    stepNumber: 3,
    label: "Vendor Selected",
    shortLabel: "Vendor Selected",
    owner: "Customer",
    ownerType: "customer",
    expectedDays: 3,
    chase: "Customer (Log in to solarrooftop.gov.in & select vendor)",
    requiredDocs: [],
  },
  {
    id: "agreement_uploaded",
    stepNumber: 4,
    label: "Agreement Uploaded",
    shortLabel: "Agreement",
    owner: "Your Team",
    ownerType: "team",
    expectedDays: 2,
    chase: "Your Team (Upload signed model agreement)",
    requiredDocs: ["signed_agreement"],
  },
  {
    id: "installed_docs_uploaded",
    stepNumber: 5,
    label: "Installed & Docs Uploaded",
    shortLabel: "Work Uploaded",
    owner: "Your Team",
    ownerType: "team",
    expectedDays: 10,
    chase: "Your Team (Upload site photos, work completion & DCR undertaking)",
    requiredDocs: ["geo_tagged_photos", "dcr_undertaking"],
  },
  {
    id: "net_meter_applied",
    stepNumber: 6,
    label: "Net Meter Applied",
    shortLabel: "Net Meter",
    owner: "DISCOM",
    ownerType: "discom",
    expectedDays: 15,
    chase: "DISCOM M&P Wing / Sub-division Meter Lab",
    requiredDocs: ["meter_installation_report"],
  },
  {
    id: "commissioning_issued",
    stepNumber: 7,
    label: "Commissioning Certificate Issued",
    shortLabel: "Commissioning",
    owner: "DISCOM",
    ownerType: "discom",
    expectedDays: 7,
    chase: "DISCOM Assistant Engineer (AEN) / Technical Inspector",
    requiredDocs: ["commissioning_certificate"],
  },
  {
    id: "bank_details_submitted",
    stepNumber: 8,
    label: "Bank Details Submitted",
    shortLabel: "Bank Details",
    owner: "Your Team",
    ownerType: "team",
    expectedDays: 2,
    chase: "Your Team (Verify bank mandate & passbook for DBT)",
    requiredDocs: ["bank_passbook"],
  },
  {
    id: "subsidy_credited",
    stepNumber: 9,
    label: "Subsidy Credited",
    shortLabel: "Subsidy Credited",
    owner: "Government",
    ownerType: "govt",
    expectedDays: 30,
    chase: "Central DBT / PFMS (Direct Bank Transfer release)",
    requiredDocs: [],
  },
];

// Document Types with Professional MUI Icons & Theme Colors
const REQUIRED_DOC_TYPES = [
  {
    type: "electricity_bill",
    label: "Electricity Bill (CA No.)",
    desc: "DISCOM consumer bill matching solar installation address & sanctioned load",
    icon: <ElectricBoltOutlinedIcon sx={{ fontSize: 22, color: "#D97706" }} />,
    bg: "#FEF3C7",
    border: "#FDE68A",
    mandatoryForStage: "registered",
  },
  {
    type: "id_proof",
    label: "Aadhaar Card / Photo ID",
    desc: "Proof of applicant identity for PM Surya Ghar portal submission",
    icon: <BadgeOutlinedIcon sx={{ fontSize: 22, color: "#2563EB" }} />,
    bg: "#EFF6FF",
    border: "#BFDBFE",
    mandatoryForStage: "registered",
  },
  {
    type: "bank_passbook",
    label: "Bank Passbook / Cheque (DBT)",
    desc: "Aadhaar-linked bank account proof for Direct Benefit Transfer (₹78,000)",
    icon: <AccountBalanceOutlinedIcon sx={{ fontSize: 22, color: "#059669" }} />,
    bg: "#ECFDF5",
    border: "#A7F3D0",
    mandatoryForStage: "bank_details_submitted",
  },
  {
    type: "signed_agreement",
    label: "Signed Model Agreement",
    desc: "Tripartite/Vendor agreement signed by consumer and EPC partner",
    icon: <DescriptionOutlinedIcon sx={{ fontSize: 22, color: "#4F46E5" }} />,
    bg: "#EEF2FF",
    border: "#C7D2FE",
    mandatoryForStage: "agreement_uploaded",
  },
  {
    type: "geo_tagged_photos",
    label: "Geo-tagged Site Photos",
    desc: "Clear photos of installed solar array, structure, inverter & earth pit",
    icon: <CameraAltOutlinedIcon sx={{ fontSize: 22, color: "#0D9488" }} />,
    bg: "#CCFBF1",
    border: "#99F6E4",
    mandatoryForStage: "installed_docs_uploaded",
  },
  {
    type: "dcr_undertaking",
    label: "DCR Undertaking Certificate",
    desc: "Domestic Content Requirement certificate matching module serial numbers",
    icon: <AssignmentTurnedInIcon sx={{ fontSize: 22, color: "#E11D48" }} />,
    bg: "#FFE4E6",
    border: "#FECDD3",
    mandatoryForStage: "installed_docs_uploaded",
  },
  {
    type: "inspection_report",
    label: "Site Feasibility Inspection Report",
    desc: "Technical site feasibility report signed by installer and customer",
    icon: <DescriptionOutlinedIcon sx={{ fontSize: 22, color: "#7C3AED" }} />,
    bg: "#F5F3FF",
    border: "#DDD6FE",
    mandatoryForStage: "feasibility_approved",
  },
  {
    type: "meter_installation_report",
    label: "Net Meter Installation Report",
    desc: "Bi-directional net meter installation and sealing certificate by DISCOM",
    icon: <ElectricBoltOutlinedIcon sx={{ fontSize: 22, color: "#EA580C" }} />,
    bg: "#FFF7ED",
    border: "#FFEDD5",
    mandatoryForStage: "net_meter_applied",
  },
  {
    type: "commissioning_certificate",
    label: "Joint Commissioning Certificate (JCC)",
    desc: "Official commissioning certificate issued jointly by DISCOM inspector and EPC",
    icon: <CheckCircleOutlinedIcon sx={{ fontSize: 22, color: "#16A34A" }} />,
    bg: "#F0FDF4",
    border: "#BBF7D0",
    mandatoryForStage: "commissioning_issued",
  },
];

export default function SubsidyDetail() {
  const { leadId } = useParams();
  const navigate = useNavigate();

  // Data states
  const [lead, setLead] = useState(null);
  const [projectInfo, setProjectInfo] = useState(null);
  const [portalLogs, setPortalLogs] = useState([]);
  const [rejections, setRejections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState(null);
  const [documents, setDocuments] = useState([]);

  // Copy Feedback state
  const [copiedKey, setCopiedKey] = useState(null);

  // Camera Capture State
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [captureDocType, setCaptureDocType] = useState(null);
  const [captureDocLabel, setCaptureDocLabel] = useState("");

  // Rejection Dialog State
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionForm, setRejectionForm] = useState({
    rejection_category: "Wrong / Blurred Photo",
    rejection_reason: "",
    fix_task: "",
  });

  // Document Verification Reject Dialog
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingDocId, setRejectingDocId] = useState(null);
  const [docRejectionReason, setDocRejectionReason] = useState("");

  // Stage Document Blocker Modal State
  const [blockerModalOpen, setBlockerModalOpen] = useState(false);
  const [blockerData, setBlockerData] = useState({ targetStage: null, missingDocs: [] });

  // Main Form Data State
  const [formData, setFormData] = useState({
    consumer_number: "",
    application_number: "",
    scheme_name: "PM Surya Ghar Muft Bijli Yojana",
    portal_status: "registered",
    discom_name: "JVVNL",
    discom_division: "",
    bank_name: "",
    bank_account_no: "",
    bank_ifsc: "",
    bank_account_holder: "",
    panel_make_model: "Waaree 540W Mono PERC",
    panel_serial_numbers: "",
    is_dcr_compliant: 1,
    inverter_make_model: "Growatt 5kW On-Grid",
    inverter_serial_number: "",
    expected_subsidy: "78000",
    amount_received: "0",
    credit_date: "",
    utr_number: "",
    customer_total_cost: "220000",
    customer_amount_paid: "220000",
    customer_balance: "0",
    sla_expected_days: 2,
    stage_started_at: null,
    submission_date: "",
    approval_date: "",
    portal_notes: "",
  });

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
        setPortalLogs(subRes.data.logs || []);
        setRejections(subRes.data.rejections || []);

        if (app) {
          if (app.project_id || app.project_number) {
            setProjectInfo({
              id: app.project_id,
              number: app.project_number,
              stage: app.project_stage,
              capacity: app.system_capacity_kw,
            });
          }

          setFormData({
            consumer_number: app.consumer_number || "",
            application_number: app.application_number || "",
            scheme_name: app.scheme_name || "PM Surya Ghar Muft Bijli Yojana",
            portal_status: app.portal_status || "registered",
            discom_name: app.discom_name || "JVVNL",
            discom_division: app.discom_division || "",
            bank_name: app.bank_name || "",
            bank_account_no: app.bank_account_no || "",
            bank_ifsc: app.bank_ifsc || "",
            bank_account_holder: app.bank_account_holder || leadObj?.customer_name || leadObj?.name || "",
            panel_make_model: app.panel_make_model || "Waaree 540W Mono PERC",
            panel_serial_numbers: app.panel_serial_numbers || "",
            is_dcr_compliant: app.is_dcr_compliant !== undefined ? Number(app.is_dcr_compliant) : 1,
            inverter_make_model: app.inverter_make_model || "Growatt 5kW On-Grid",
            inverter_serial_number: app.inverter_serial_number || "",
            expected_subsidy: app.expected_subsidy !== undefined ? String(app.expected_subsidy) : "78000",
            amount_received: app.amount_received !== undefined ? String(app.amount_received) : "0",
            credit_date: app.credit_date ? String(app.credit_date).slice(0, 10) : "",
            utr_number: app.utr_number || "",
            customer_total_cost: app.customer_total_cost !== undefined ? String(app.customer_total_cost) : (app.deal_amount ? String(app.deal_amount) : "220000"),
            customer_amount_paid: app.customer_amount_paid !== undefined ? String(app.customer_amount_paid) : "0",
            customer_balance: app.customer_balance !== undefined ? String(app.customer_balance) : "220000",
            sla_expected_days: app.sla_expected_days || 2,
            stage_started_at: app.stage_started_at || null,
            submission_date: app.submission_date ? String(app.submission_date).slice(0, 10) : "",
            approval_date: app.approval_date ? String(app.approval_date).slice(0, 10) : "",
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

  // Copy helper with feedback
  const handleCopyText = (key, text, label) => {
    if (!text) {
      toast.error(`${label} is empty.`);
      return;
    }
    navigator.clipboard.writeText(String(text));
    setCopiedKey(key);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Copy Full Portal Data Pack
  const handleCopyAllPortalData = () => {
    const custName = formData.bank_account_holder || lead?.customer_name || lead?.name || "N/A";
    const fullAddr = [lead?.address, lead?.city, lead?.state, lead?.pincode].filter(Boolean).join(", ") || "N/A";
    const cap = projectInfo?.capacity || lead?.system_capacity || "3.50 kW";

    const text = `=== PM SURYA GHAR NATIONAL PORTAL DATA PACK ===
Applicant Name: ${custName}
Electricity Bill CA No.: ${formData.consumer_number || "N/A"}
PM Surya Ghar App No.: ${formData.application_number || "Pending"}
Installation Address: ${fullAddr}
System Capacity: ${cap} kW
DISCOM: ${formData.discom_name || "JVVNL"}
Sub-Division / Circle: ${formData.discom_division || "N/A"}
Bank Account Holder: ${formData.bank_account_holder || custName}
Bank Name: ${formData.bank_name || "N/A"}
Account Number: ${formData.bank_account_no || "N/A"}
IFSC Code: ${formData.bank_ifsc || "N/A"}
Solar Panels: ${formData.panel_make_model} (DCR Compliant: ${formData.is_dcr_compliant ? "YES" : "NO"})
Panel Serials: ${formData.panel_serial_numbers || "N/A"}
Inverter Make & Model: ${formData.inverter_make_model}
Inverter Serial: ${formData.inverter_serial_number || "N/A"}
Expected Central DBT Subsidy: ₹${formData.expected_subsidy || "78,000"}
===============================================`;

    navigator.clipboard.writeText(text);
    setCopiedKey("ALL_DATA_PACK");
    toast.success("Full Portal Data Pack copied! Paste directly into portal.");
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Calculate Days in Current Stage
  const daysInCurrentStage = useMemo(() => {
    if (!formData.stage_started_at) return 1;
    const start = new Date(formData.stage_started_at).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  }, [formData.stage_started_at]);

  // Current stage object
  const currentStageObj = useMemo(() => {
    return PORTAL_STAGES.find((s) => s.id === formData.portal_status) || PORTAL_STAGES[0];
  }, [formData.portal_status]);

  const isCurrentStageDelayed = daysInCurrentStage > (currentStageObj.expectedDays || 7);

  // Check if mandatory documents exist for a target stage
  const validateStageDocuments = (targetStageId) => {
    const targetIdx = PORTAL_STAGES.findIndex((s) => s.id === targetStageId);
    if (targetIdx <= 0) return { allowed: true, missing: [] };

    const missing = [];
    // Check all required documents up to target stage
    for (let i = 0; i <= targetIdx; i++) {
      const stage = PORTAL_STAGES[i];
      if (stage.requiredDocs && stage.requiredDocs.length > 0) {
        for (const docKey of stage.requiredDocs) {
          const docFound = documents.some((d) => d.document_type === docKey && d.verification_status !== "rejected");
          if (!docFound) {
            const docDef = REQUIRED_DOC_TYPES.find((r) => r.type === docKey);
            missing.push({
              key: docKey,
              label: docDef ? docDef.label : docKey,
              requiredForStage: stage.label,
            });
          }
        }
      }
    }

    return {
      allowed: missing.length === 0,
      missing,
    };
  };

  // Step click handler with Document Checklist Rule
  const handleStageClick = (stage) => {
    if (stage.id === formData.portal_status) return;

    // Check mandatory documents rule
    const validation = validateStageDocuments(stage.id);
    if (!validation.allowed) {
      setBlockerData({
        targetStage: stage,
        missingDocs: validation.missing,
      });
      setBlockerModalOpen(true);
      return;
    }

    // Allowed: update portal status
    setFormData((prev) => ({
      ...prev,
      portal_status: stage.id,
      sla_expected_days: stage.expectedDays,
    }));
    toast.success(`Stage set to: ${stage.label}`);
  };

  // Open Document Camera Capture
  const handleOpenCapture = (docType, docLabel) => {
    setCaptureDocType(docType);
    setCaptureDocLabel(docLabel);
    setCaptureModalOpen(true);
  };

  // Handle Photo Captured from Modal
  const handleCaptureSuccess = async (file, docType) => {
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
        toast.success("Document photo captured and saved into Customer Vault!");
        fetchData();
      } else {
        toast.error(res.message || "Failed to save captured photo.");
      }
    } catch (err) {
      console.error("Capture upload error:", err);
      toast.error("Error uploading captured document.");
    } finally {
      setUploadingType(null);
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

  const handleOpenDocRejectDialog = (docId) => {
    setRejectingDocId(docId);
    setDocRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmDocReject = () => {
    if (!docRejectionReason.trim()) {
      toast.error("Please enter a rejection reason.");
      return;
    }
    handleVerifyStatus(rejectingDocId, "rejected", docRejectionReason);
    setRejectModalOpen(false);
  };

  // Log Portal Rejection with Actionable Fix Task
  const handleLogRejectionSubmit = async () => {
    if (!rejectionForm.rejection_reason.trim()) {
      toast.error("Please provide the rejection reason from the portal.");
      return;
    }
    if (!rejectionForm.fix_task.trim()) {
      toast.error("Please define the actionable fix task for the team.");
      return;
    }

    try {
      const res = await logSubsidyRejection({
        lead_id: leadId,
        stage_at_rejection: formData.portal_status,
        rejection_category: rejectionForm.rejection_category,
        rejection_reason: rejectionForm.rejection_reason,
        fix_task: rejectionForm.fix_task,
      });

      if (res.success) {
        toast.success("Portal rejection logged & fix task assigned!");
        setRejectionModalOpen(false);
        setRejectionForm({
          rejection_category: "Wrong / Blurred Photo",
          rejection_reason: "",
          fix_task: "",
        });
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to log portal rejection.");
    }
  };

  // Resolve Rejection Task
  const handleResolveTask = async (rejectionId) => {
    try {
      const res = await resolveRejectionFixTask(rejectionId);
      if (res.success) {
        toast.success("Rejection fix task marked as resolved!");
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to resolve task.");
    }
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

  const activeStageIdx = PORTAL_STAGES.findIndex((s) => s.id === formData.portal_status);
  const isRejectedState = formData.portal_status === "rejected";

  return (
    <Box
      sx={{
        backgroundColor: COLORS.background,
        minHeight: "100vh",
        p: { xs: 2, sm: 3 },
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1400, mx: "auto" }}>
        {/* HEADER & BREADCRUMBS */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
          flexWrap="wrap"
          gap={1.5}
        >
          <Breadcrumbs
            separator={
              <NavigateNextRoundedIcon sx={{ fontSize: "0.85rem", color: COLORS.textMuted }} />
            }
          >
            <Stack
              direction="row"
              alignItems="center"
              gap={0.5}
              sx={{ cursor: "pointer" }}
              onClick={() => navigate("/dashboard")}
            >
              <HomeOutlinedIcon sx={{ fontSize: "0.9rem", color: COLORS.textMuted }} />
              <Typography
                sx={{
                  fontSize: "0.8rem",
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
                fontSize: "0.8rem",
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
                fontSize: "0.8rem",
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
              fontSize: "0.82rem",
            }}
          >
            Back to Subsidy Hub
          </Button>
        </Stack>

        {/* HERO HEADER PAPER */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 3,
            borderRadius: "14px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            gap: 2,
          }}
        >
          <Box>
            <Stack direction="row" alignItems="center" gap={1.2} sx={{ mb: 0.5 }} flexWrap="wrap">
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: COLORS.primaryDark,
                  fontSize: "1.25rem",
                }}
              >
                {lead?.customer_name || lead?.name || "Customer Subsidy Project"}
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

              {isRejectedState ? (
                <Chip
                  icon={<ErrorOutlineOutlinedIcon sx={{ fontSize: "14px !important", color: "#B91C1C !important" }} />}
                  label="PORTAL REJECTED"
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    backgroundColor: "#FEE2E2",
                    color: "#B91C1C",
                    border: "1px solid #FCA5A5",
                    height: 24,
                  }}
                />
              ) : (
                <Chip
                  icon={<CheckCircleOutlinedIcon sx={{ fontSize: "14px !important", color: "#047857 !important" }} />}
                  label={`STAGE: ${currentStageObj.label.toUpperCase()}`}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    backgroundColor: "#ECFDF5",
                    color: "#047857",
                    border: "1px solid #A7F3D0",
                    height: 24,
                  }}
                />
              )}
            </Stack>

            <Stack direction="row" alignItems="center" gap={2} flexWrap="wrap" sx={{ mt: 0.8 }}>
              {lead?.mobile_number && (
                <Stack direction="row" alignItems="center" gap={0.6}>
                  <PhoneIcon sx={{ fontSize: 14, color: COLORS.textMuted }} />
                  <Typography
                    component="a"
                    href={`tel:${lead.mobile_number}`}
                    sx={{
                      fontSize: "0.8rem",
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
                  <LocationOnOutlinedIcon sx={{ fontSize: 14, color: COLORS.textMuted }} />
                  <Typography sx={{ fontSize: "0.8rem", color: COLORS.textSecondary, fontWeight: 500 }}>
                    {[lead?.address, lead?.city, lead?.state].filter(Boolean).join(", ")}
                  </Typography>
                </Stack>
              )}

              <Chip
                icon={<SolarPowerOutlinedIcon sx={{ fontSize: "14px !important", color: "#B45309 !important" }} />}
                label={`${projectInfo?.capacity || lead?.system_capacity || "3.50"} kW Plant`}
                size="small"
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  backgroundColor: "#FEF3C7",
                  color: "#B45309",
                  height: 24,
                }}
              />
            </Stack>
          </Box>

          {/* Quick Header Actions */}
          <Stack direction="row" alignItems="center" gap={1.2} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />}
              onClick={handleCopyAllPortalData}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.8rem",
                px: 1.8,
                borderColor: copiedKey === "ALL_DATA_PACK" ? COLORS.success : COLORS.border,
                color: copiedKey === "ALL_DATA_PACK" ? COLORS.success : COLORS.textPrimary,
                backgroundColor: copiedKey === "ALL_DATA_PACK" ? "#ECFDF5" : "#FFFFFF",
                "&:hover": { borderColor: COLORS.primary },
              }}
            >
              {copiedKey === "ALL_DATA_PACK" ? "Copied All!" : "Copy Portal Data Pack"}
            </Button>

            <Button
              variant="outlined"
              color="error"
              startIcon={<ErrorOutlineOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={() => setRejectionModalOpen(true)}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.8rem",
                px: 1.8,
              }}
            >
              Log Rejection
            </Button>

            <Tooltip title="Refresh Data">
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
              {saving ? "Saving..." : "Save Portal Updates"}
            </Button>
          </Stack>
        </Paper>

        {/* SECTION 1: 9-STAGE PORTAL MIRROR STEPPER WITH STAGE OWNERS */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: "14px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
            <Box>
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: COLORS.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                National Solar Portal Mirror Statuses (Click to advance stage)
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary, mt: 0.2 }}>
                Mandatory document rules apply before advancing to gated milestones.
              </Typography>
            </Box>

            <Stack direction="row" alignItems="center" gap={1}>
              <Chip size="small" label="Your Team" sx={{ bgcolor: "#F1F5F9", color: "#0F172A", fontWeight: 700, fontSize: "0.68rem" }} />
              <Chip size="small" label="DISCOM" sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700, fontSize: "0.68rem" }} />
              <Chip size="small" label="Customer" sx={{ bgcolor: "#FEF3C7", color: "#B45309", fontWeight: 700, fontSize: "0.68rem" }} />
              <Chip size="small" label="Government" sx={{ bgcolor: "#ECFDF5", color: "#047857", fontWeight: 700, fontSize: "0.68rem" }} />
            </Stack>
          </Stack>

          <Grid container spacing={1}>
            {PORTAL_STAGES.map((stage, idx) => {
              const isCompleted = activeStageIdx !== -1 && idx < activeStageIdx;
              const isCurrent = idx === activeStageIdx && !isRejectedState;

              return (
                <Grid item xs={12} sm={6} md={1.33} key={stage.id}>
                  <Box
                    onClick={() => handleStageClick(stage)}
                    sx={{
                      p: 1.2,
                      borderRadius: "10px",
                      cursor: "pointer",
                      border: `1.5px solid ${
                        isCurrent
                          ? COLORS.secondary
                          : isCompleted
                          ? "#10B981"
                          : COLORS.border
                      }`,
                      backgroundColor: isCurrent
                        ? "#FFFBEB"
                        : isCompleted
                        ? "#F0FDF4"
                        : "#FFFFFF",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: 88,
                      transition: "all 0.15s ease",
                      "&:hover": {
                        borderColor: isCurrent ? COLORS.secondary : COLORS.primary,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          backgroundColor: isCurrent
                            ? COLORS.secondary
                            : isCompleted
                            ? "#10B981"
                            : "#E2E8F0",
                          color: isCurrent || isCompleted ? "#FFFFFF" : COLORS.textMuted,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "0.7rem",
                          flexShrink: 0,
                        }}
                      >
                        {isCompleted ? <CheckIcon sx={{ fontSize: 13 }} /> : stage.stepNumber}
                      </Box>

                      <Chip
                        label={stage.owner}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: "0.62rem",
                          fontWeight: 800,
                          backgroundColor:
                            stage.ownerType === "discom"
                              ? "#DBEAFE"
                              : stage.ownerType === "govt"
                              ? "#D1FAE5"
                              : stage.ownerType === "customer"
                              ? "#FEF3C7"
                              : "#E2E8F0",
                          color:
                            stage.ownerType === "discom"
                              ? "#1E40AF"
                              : stage.ownerType === "govt"
                              ? "#065F46"
                              : stage.ownerType === "customer"
                              ? "#92400E"
                              : "#334155",
                        }}
                      />
                    </Stack>

                    <Box sx={{ mt: 0.8 }}>
                      <Typography
                        sx={{
                          fontSize: "0.72rem",
                          fontWeight: isCurrent ? 800 : 700,
                          color: isCurrent
                            ? "#92400E"
                            : isCompleted
                            ? "#065F46"
                            : COLORS.textPrimary,
                          lineHeight: 1.25,
                        }}
                      >
                        {stage.shortLabel}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.62rem",
                          color: COLORS.textMuted,
                          fontWeight: 600,
                          mt: 0.3,
                        }}
                      >
                        SLA: {stage.expectedDays}d
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>

          {/* ACTIVE STAGE SLA & CHASE BANNER */}
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: "10px",
              backgroundColor: isRejectedState
                ? "#FEF2F2"
                : isCurrentStageDelayed
                ? "#FFFBEB"
                : "#F8FAFC",
              border: `1px solid ${
                isRejectedState
                  ? "#FCA5A5"
                  : isCurrentStageDelayed
                  ? "#FCD34D"
                  : COLORS.border
              }`,
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={7}>
                <Stack direction="row" alignItems="center" gap={1.2}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: "8px",
                      backgroundColor: isRejectedState ? "#FEE2E2" : isCurrentStageDelayed ? "#FEF3C7" : "#E2E8F0",
                      color: isRejectedState ? "#B91C1C" : isCurrentStageDelayed ? "#B45309" : COLORS.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isRejectedState ? (
                      <ErrorOutlineOutlinedIcon sx={{ fontSize: 22 }} />
                    ) : (
                      <TimerOutlinedIcon sx={{ fontSize: 22 }} />
                    )}
                  </Box>

                  <Box>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase" }}>
                      Who do we chase? (Stage Responsibility)
                    </Typography>
                    <Typography sx={{ fontSize: "0.88rem", fontWeight: 800, color: COLORS.primaryDark }}>
                      {isRejectedState
                        ? "Actionable Fix Task: Resolve rejection items & re-submit to portal"
                        : currentStageObj.chase}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} md={5}>
                <Stack direction="row" alignItems="center" justifyContent={{ xs: "flex-start", md: "flex-end" }} gap={2}>
                  <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
                    <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                      Time Elapsed vs SLA
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.85rem",
                        fontWeight: 800,
                        color: isCurrentStageDelayed ? COLORS.danger : COLORS.primaryDark,
                      }}
                    >
                      {daysInCurrentStage} days elapsed / Expected {currentStageObj.expectedDays} days
                    </Typography>
                  </Box>

                  {isCurrentStageDelayed && (
                    <Chip
                      icon={<WarningAmberIcon sx={{ fontSize: "14px !important", color: "#B45309 !important" }} />}
                      label={`DELAYED (+${daysInCurrentStage - currentStageObj.expectedDays}d)`}
                      size="small"
                      sx={{
                        bgcolor: "#FEF3C7",
                        color: "#B45309",
                        fontWeight: 800,
                        fontSize: "0.72rem",
                        height: 26,
                      }}
                    />
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* SECTION 2: PORTAL DATA PACK (ALL 12 FIELDS WITH 1-CLICK COPY BUTTONS) */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: "14px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: COLORS.primaryDark }}>
                National Solar Portal Data Pack
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}>
                One screen with every field the portal asks for. Click copy next to any field — staff type nothing twice.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopyIcon sx={{ fontSize: 15 }} />}
              onClick={handleCopyAllPortalData}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.78rem",
                borderRadius: "8px",
                borderColor: COLORS.primary,
                color: COLORS.primary,
              }}
            >
              {copiedKey === "ALL_DATA_PACK" ? "Copied All Fields!" : "Copy Full Data Pack (All)"}
            </Button>
          </Stack>

          <Grid container spacing={2}>
            {/* Field 1: Applicant Name */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 1.5, borderRadius: "8px", border: `1px solid ${COLORS.border}`, bgcolor: "#F8FAFC" }}>
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  Applicant Name
                </Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  <Typography noWrap sx={{ fontSize: "0.85rem", fontWeight: 800, color: COLORS.primaryDark, maxWidth: "75%" }}>
                    {formData.bank_account_holder || lead?.customer_name || lead?.name || "N/A"}
                  </Typography>
                  <Tooltip title="Copy Applicant Name">
                    <IconButton
                      size="small"
                      onClick={() => handleCopyText("NAME", formData.bank_account_holder || lead?.customer_name || lead?.name, "Applicant Name")}
                      sx={{ p: 0.5, bgcolor: copiedKey === "NAME" ? "#DCFCE7" : "#FFFFFF", border: `1px solid ${COLORS.border}` }}
                    >
                      {copiedKey === "NAME" ? <CheckIcon sx={{ fontSize: 14, color: "#16A34A" }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </Grid>

            {/* Field 2: Consumer Number */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 1.5, borderRadius: "8px", border: `1px solid ${COLORS.border}`, bgcolor: "#F8FAFC" }}>
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  Consumer No. (CA No.) *
                </Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  <Typography noWrap sx={{ fontSize: "0.85rem", fontWeight: 800, color: COLORS.primaryDark, maxWidth: "75%", fontFamily: "monospace" }}>
                    {formData.consumer_number || "Required"}
                  </Typography>
                  <Tooltip title="Copy Consumer No.">
                    <IconButton
                      size="small"
                      onClick={() => handleCopyText("CONSUMER_NO", formData.consumer_number, "Consumer Number")}
                      sx={{ p: 0.5, bgcolor: copiedKey === "CONSUMER_NO" ? "#DCFCE7" : "#FFFFFF", border: `1px solid ${COLORS.border}` }}
                    >
                      {copiedKey === "CONSUMER_NO" ? <CheckIcon sx={{ fontSize: 14, color: "#16A34A" }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </Grid>

            {/* Field 3: PM Surya Ghar Application No */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 1.5, borderRadius: "8px", border: `1px solid ${COLORS.border}`, bgcolor: "#F8FAFC" }}>
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  PM Surya Ghar App No.
                </Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  <Typography noWrap sx={{ fontSize: "0.85rem", fontWeight: 800, color: COLORS.primaryDark, maxWidth: "75%", fontFamily: "monospace" }}>
                    {formData.application_number || "Not Applied"}
                  </Typography>
                  <Tooltip title="Copy Application No.">
                    <IconButton
                      size="small"
                      onClick={() => handleCopyText("APP_NO", formData.application_number, "Application Number")}
                      sx={{ p: 0.5, bgcolor: copiedKey === "APP_NO" ? "#DCFCE7" : "#FFFFFF", border: `1px solid ${COLORS.border}` }}
                    >
                      {copiedKey === "APP_NO" ? <CheckIcon sx={{ fontSize: 14, color: "#16A34A" }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </Grid>

            {/* Field 4: Plant Capacity */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 1.5, borderRadius: "8px", border: `1px solid ${COLORS.border}`, bgcolor: "#F8FAFC" }}>
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  Sanctioned Capacity (kW)
                </Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: COLORS.primaryDark }}>
                    {projectInfo?.capacity || lead?.system_capacity || "3.50"} kW
                  </Typography>
                  <Tooltip title="Copy Capacity">
                    <IconButton
                      size="small"
                      onClick={() => handleCopyText("CAPACITY", `${projectInfo?.capacity || lead?.system_capacity || "3.50"}`, "Capacity")}
                      sx={{ p: 0.5, bgcolor: copiedKey === "CAPACITY" ? "#DCFCE7" : "#FFFFFF", border: `1px solid ${COLORS.border}` }}
                    >
                      {copiedKey === "CAPACITY" ? <CheckIcon sx={{ fontSize: 14, color: "#16A34A" }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </Grid>

            {/* Field 5: DISCOM Name */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 1.5, borderRadius: "8px", border: `1px solid ${COLORS.border}`, bgcolor: "#F8FAFC" }}>
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  DISCOM Name
                </Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  <Typography noWrap sx={{ fontSize: "0.85rem", fontWeight: 800, color: COLORS.primaryDark }}>
                    {formData.discom_name || "JVVNL"}
                  </Typography>
                  <Tooltip title="Copy DISCOM">
                    <IconButton
                      size="small"
                      onClick={() => handleCopyText("DISCOM", formData.discom_name || "JVVNL", "DISCOM")}
                      sx={{ p: 0.5, bgcolor: copiedKey === "DISCOM" ? "#DCFCE7" : "#FFFFFF", border: `1px solid ${COLORS.border}` }}
                    >
                      {copiedKey === "DISCOM" ? <CheckIcon sx={{ fontSize: 14, color: "#16A34A" }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </Grid>

            {/* Field 6: DISCOM Circle / Division */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 1.5, borderRadius: "8px", border: `1px solid ${COLORS.border}`, bgcolor: "#F8FAFC" }}>
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  Sub-Division / Circle
                </Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  <Typography noWrap sx={{ fontSize: "0.85rem", fontWeight: 800, color: COLORS.primaryDark }}>
                    {formData.discom_division || lead?.city || "Jaipur Circle"}
                  </Typography>
                  <Tooltip title="Copy Division">
                    <IconButton
                      size="small"
                      onClick={() => handleCopyText("DIVISION", formData.discom_division || lead?.city, "Sub-Division")}
                      sx={{ p: 0.5, bgcolor: copiedKey === "DIVISION" ? "#DCFCE7" : "#FFFFFF", border: `1px solid ${COLORS.border}` }}
                    >
                      {copiedKey === "DIVISION" ? <CheckIcon sx={{ fontSize: 14, color: "#16A34A" }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </Grid>

            {/* Field 7: Installation Address */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 1.5, borderRadius: "8px", border: `1px solid ${COLORS.border}`, bgcolor: "#F8FAFC" }}>
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  Installation Address
                </Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  <Typography noWrap sx={{ fontSize: "0.85rem", fontWeight: 800, color: COLORS.primaryDark, maxWidth: "75%" }}>
                    {[lead?.address, lead?.city, lead?.state, lead?.pincode].filter(Boolean).join(", ") || "N/A"}
                  </Typography>
                  <Tooltip title="Copy Address">
                    <IconButton
                      size="small"
                      onClick={() => handleCopyText("ADDRESS", [lead?.address, lead?.city, lead?.state, lead?.pincode].filter(Boolean).join(", "), "Address")}
                      sx={{ p: 0.5, bgcolor: copiedKey === "ADDRESS" ? "#DCFCE7" : "#FFFFFF", border: `1px solid ${COLORS.border}` }}
                    >
                      {copiedKey === "ADDRESS" ? <CheckIcon sx={{ fontSize: 14, color: "#16A34A" }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </Grid>

            {/* Field 8: Bank Name */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 1.5, borderRadius: "8px", border: `1px solid ${COLORS.border}`, bgcolor: "#F8FAFC" }}>
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  Bank Name
                </Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  <Typography noWrap sx={{ fontSize: "0.85rem", fontWeight: 800, color: COLORS.primaryDark }}>
                    {formData.bank_name || "State Bank of India"}
                  </Typography>
                  <Tooltip title="Copy Bank Name">
                    <IconButton
                      size="small"
                      onClick={() => handleCopyText("BANK_NAME", formData.bank_name || "State Bank of India", "Bank Name")}
                      sx={{ p: 0.5, bgcolor: copiedKey === "BANK_NAME" ? "#DCFCE7" : "#FFFFFF", border: `1px solid ${COLORS.border}` }}
                    >
                      {copiedKey === "BANK_NAME" ? <CheckIcon sx={{ fontSize: 14, color: "#16A34A" }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </Grid>

            {/* Field 9: Bank Account Number */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 1.5, borderRadius: "8px", border: `1px solid ${COLORS.border}`, bgcolor: "#F8FAFC" }}>
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  Bank Account No. (DBT)
                </Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  <Typography noWrap sx={{ fontSize: "0.85rem", fontWeight: 800, color: COLORS.primaryDark, fontFamily: "monospace" }}>
                    {formData.bank_account_no || "Pending verification"}
                  </Typography>
                  <Tooltip title="Copy Account No.">
                    <IconButton
                      size="small"
                      onClick={() => handleCopyText("BANK_ACC", formData.bank_account_no, "Account Number")}
                      sx={{ p: 0.5, bgcolor: copiedKey === "BANK_ACC" ? "#DCFCE7" : "#FFFFFF", border: `1px solid ${COLORS.border}` }}
                    >
                      {copiedKey === "BANK_ACC" ? <CheckIcon sx={{ fontSize: 14, color: "#16A34A" }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </Grid>

            {/* Field 10: Bank IFSC Code */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 1.5, borderRadius: "8px", border: `1px solid ${COLORS.border}`, bgcolor: "#F8FAFC" }}>
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  Bank IFSC Code
                </Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  <Typography noWrap sx={{ fontSize: "0.85rem", fontWeight: 800, color: COLORS.primaryDark, fontFamily: "monospace" }}>
                    {formData.bank_ifsc || "SBIN0001234"}
                  </Typography>
                  <Tooltip title="Copy IFSC">
                    <IconButton
                      size="small"
                      onClick={() => handleCopyText("BANK_IFSC", formData.bank_ifsc, "IFSC Code")}
                      sx={{ p: 0.5, bgcolor: copiedKey === "BANK_IFSC" ? "#DCFCE7" : "#FFFFFF", border: `1px solid ${COLORS.border}` }}
                    >
                      {copiedKey === "BANK_IFSC" ? <CheckIcon sx={{ fontSize: 14, color: "#16A34A" }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </Grid>

            {/* Field 11: Module Make & DCR */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 1.5, borderRadius: "8px", border: `1px solid ${COLORS.border}`, bgcolor: "#F8FAFC" }}>
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  Solar Panel Model (DCR)
                </Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  <Typography noWrap sx={{ fontSize: "0.85rem", fontWeight: 800, color: COLORS.primaryDark }}>
                    {formData.panel_make_model || "Waaree 540W"}
                  </Typography>
                  <Tooltip title="Copy Panel Model">
                    <IconButton
                      size="small"
                      onClick={() => handleCopyText("PANEL_MODEL", formData.panel_make_model, "Panel Model")}
                      sx={{ p: 0.5, bgcolor: copiedKey === "PANEL_MODEL" ? "#DCFCE7" : "#FFFFFF", border: `1px solid ${COLORS.border}` }}
                    >
                      {copiedKey === "PANEL_MODEL" ? <CheckIcon sx={{ fontSize: 14, color: "#16A34A" }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </Grid>

            {/* Field 12: Inverter Make & Model */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 1.5, borderRadius: "8px", border: `1px solid ${COLORS.border}`, bgcolor: "#F8FAFC" }}>
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  Inverter Make & Model
                </Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  <Typography noWrap sx={{ fontSize: "0.85rem", fontWeight: 800, color: COLORS.primaryDark }}>
                    {formData.inverter_make_model || "Growatt 5kW"}
                  </Typography>
                  <Tooltip title="Copy Inverter Model">
                    <IconButton
                      size="small"
                      onClick={() => handleCopyText("INVERTER_MODEL", formData.inverter_make_model, "Inverter Model")}
                      sx={{ p: 0.5, bgcolor: copiedKey === "INVERTER_MODEL" ? "#DCFCE7" : "#FFFFFF", border: `1px solid ${COLORS.border}` }}
                    >
                      {copiedKey === "INVERTER_MODEL" ? <CheckIcon sx={{ fontSize: 14, color: "#16A34A" }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* SECTION 3: TWO COLUMN MAIN INTERFACE */}
        <Grid container spacing={3}>
          {/* LEFT COLUMN: PORTAL SETTINGS, DCR MODULE DETAILS & SUBSIDY LEDGER */}
          <Grid item xs={12} lg={6}>
            <Stack spacing={3}>
              {/* CARD A: EDITABLE DISCOM & PORTAL SETTINGS */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "14px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.card,
                }}
              >
                <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: COLORS.primaryDark, mb: 0.5 }}>
                  Portal Application & DISCOM Setup
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary, mb: 2 }}>
                  Set electricity consumer connection details and sub-division routing
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
                      Electricity Bill Consumer No. (CA No.) *
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. 1029384756"
                      value={formData.consumer_number}
                      onChange={(e) => setFormData((p) => ({ ...p, consumer_number: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700 } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
                      PM Surya Ghar Application No.
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. PMSG-2026-98765"
                      value={formData.application_number}
                      onChange={(e) => setFormData((p) => ({ ...p, application_number: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem" } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
                      DISCOM Name
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. JVVNL / Tata Power / BESCOM"
                      value={formData.discom_name}
                      onChange={(e) => setFormData((p) => ({ ...p, discom_name: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem" } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
                      Sub-Division / Circle Office
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. Mansarovar Sub-Division"
                      value={formData.discom_division}
                      onChange={(e) => setFormData((p) => ({ ...p, discom_division: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem" } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
                      Bank Name (DBT Beneficiary)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. State Bank of India"
                      value={formData.bank_name}
                      onChange={(e) => setFormData((p) => ({ ...p, bank_name: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem" } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
                      Bank Account Number
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. 30129482910"
                      value={formData.bank_account_no}
                      onChange={(e) => setFormData((p) => ({ ...p, bank_account_no: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem" } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
                      Bank IFSC Code
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. SBIN0001234"
                      value={formData.bank_ifsc}
                      onChange={(e) => setFormData((p) => ({ ...p, bank_ifsc: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem" } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
                      Account Holder Name
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="As per bank passbook"
                      value={formData.bank_account_holder}
                      onChange={(e) => setFormData((p) => ({ ...p, bank_account_holder: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem" } }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
                      Portal Remarks & Inspection Officer Notes
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Remarks from DISCOM portal, inspection officer feedback..."
                      value={formData.portal_notes}
                      onChange={(e) => setFormData((p) => ({ ...p, portal_notes: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.82rem" } }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* CARD B: MODULE & INVERTER DETAILS (DCR COMPLIANCE) */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "14px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.card,
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: COLORS.primaryDark }}>
                      Module & Inverter Details (DCR Compliance)
                    </Typography>
                    <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}>
                      Non-DCR panels are the #1 cause of MNRE subsidy rejections.
                    </Typography>
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_dcr_compliant === 1}
                        onChange={(e) => setFormData((p) => ({ ...p, is_dcr_compliant: e.target.checked ? 1 : 0 }))}
                        color="success"
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: formData.is_dcr_compliant ? "#16A34A" : "#DC2626" }}>
                        {formData.is_dcr_compliant ? "DCR Compliant" : "Non-DCR (Risk)"}
                      </Typography>
                    }
                  />
                </Stack>

                {!formData.is_dcr_compliant && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: "8px", fontSize: "0.78rem" }}>
                    Warning: Non-DCR solar cells will be immediately rejected during National Portal document verification.
                  </Alert>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
                      Panel Make & Model *
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. Waaree 540W Mono PERC"
                      value={formData.panel_make_model}
                      onChange={(e) => setFormData((p) => ({ ...p, panel_make_model: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem" } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
                      Inverter Make & Model *
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. Growatt 5kW Grid-Tie"
                      value={formData.inverter_make_model}
                      onChange={(e) => setFormData((p) => ({ ...p, inverter_make_model: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem" } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
                      Inverter Serial Number
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. GRW-2026-908123"
                      value={formData.inverter_serial_number}
                      onChange={(e) => setFormData((p) => ({ ...p, inverter_serial_number: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem", fontFamily: "monospace" } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
                      Panel Serial Numbers (Comma separated)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="WAA-001, WAA-002, WAA-003..."
                      value={formData.panel_serial_numbers}
                      onChange={(e) => setFormData((p) => ({ ...p, panel_serial_numbers: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem", fontFamily: "monospace" } }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* CARD C: SUBSIDY FINANCIAL LEDGER & MISMATCH HIGHLIGHTS */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "14px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.card,
                }}
              >
                <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: COLORS.primaryDark, mb: 0.5 }}>
                  Subsidy Financial Ledger
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary, mb: 2 }}>
                  Tracks expected DBT subsidy, disbursement credit date, UTR reference, and customer balance.
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                      <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#1E40AF", textTransform: "uppercase" }}>
                        Expected Central Govt DBT
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={formData.expected_subsidy}
                        onChange={(e) => setFormData((p) => ({ ...p, expected_subsidy: e.target.value }))}
                        sx={{ mt: 0.5, "& .MuiOutlinedInput-root": { bgcolor: "#FFFFFF", borderRadius: "8px", fontWeight: 800 } }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                      <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#065F46", textTransform: "uppercase" }}>
                        Amount Received in Customer Bank (₹)
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={formData.amount_received}
                        onChange={(e) => setFormData((p) => ({ ...p, amount_received: e.target.value }))}
                        sx={{ mt: 0.5, "& .MuiOutlinedInput-root": { bgcolor: "#FFFFFF", borderRadius: "8px", fontWeight: 800 } }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
                      Subsidy Credit Date
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={formData.credit_date}
                      onChange={(e) => setFormData((p) => ({ ...p, credit_date: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem" } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
                      Bank UTR / Transaction Ref No.
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. UTR-20261106-9921"
                      value={formData.utr_number}
                      onChange={(e) => setFormData((p) => ({ ...p, utr_number: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem", fontFamily: "monospace" } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
                      Customer Quotation Total (₹)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={formData.customer_total_cost}
                      onChange={(e) => setFormData((p) => ({ ...p, customer_total_cost: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700 } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
                      Customer Paid (₹)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={formData.customer_amount_paid}
                      onChange={(e) => setFormData((p) => ({ ...p, customer_amount_paid: e.target.value }))}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700 } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
                      Customer Balance (₹)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={formData.customer_balance}
                      onChange={(e) => setFormData((p) => ({ ...p, customer_balance: e.target.value }))}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          fontWeight: 800,
                          color: Number(formData.customer_balance) > 0 ? COLORS.danger : COLORS.success,
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Stack>
          </Grid>

          {/* RIGHT COLUMN: DOCUMENT CHECKLIST (WITH RULES & LIVE CAMERA SCAN) & REJECTION HISTORY */}
          <Grid item xs={12} lg={6}>
            <Stack spacing={3}>
              {/* CARD D: DOCUMENT VAULT & CHECKLIST */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "14px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.card,
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: COLORS.primaryDark }}>
                      Document Checklist & National Portal Vault
                    </Typography>
                    <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}>
                      Live camera scanner & file upload with stage progression rules
                    </Typography>
                  </Box>

                  <Chip
                    label={`${documents.length} / ${REQUIRED_DOC_TYPES.length} Vault Files`}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      bgcolor: "#F1F5F9",
                      color: COLORS.primaryDark,
                    }}
                  />
                </Stack>

                <Stack spacing={1.8}>
                  {REQUIRED_DOC_TYPES.map((docDef) => {
                    const uploadedDoc = documents.find((d) => d.document_type === docDef.type);
                    const isUploading = uploadingType === docDef.type;
                    const isVerified = uploadedDoc?.verification_status === "verified";
                    const isRejected = uploadedDoc?.verification_status === "rejected";

                    return (
                      <Box
                        key={docDef.type}
                        sx={{
                          p: 1.8,
                          borderRadius: "10px",
                          border: `1px solid ${
                            isRejected
                              ? "#FCA5A5"
                              : isVerified
                              ? "#86EFAC"
                              : uploadedDoc
                              ? "#BAE6FD"
                              : COLORS.border
                          }`,
                          backgroundColor: isRejected
                            ? "#FEF2F2"
                            : isVerified
                            ? "#F0FDF4"
                            : uploadedDoc
                            ? "#F0F9FF"
                            : "#FFFFFF",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <Grid container spacing={1.5} alignItems="center">
                          <Grid item xs={12} sm={6.5}>
                            <Stack direction="row" alignItems="center" gap={1.2}>
                              <Box
                                sx={{
                                  p: 0.8,
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

                              <Box sx={{ overflow: "hidden" }}>
                                <Typography noWrap sx={{ fontSize: "0.82rem", fontWeight: 800, color: COLORS.primaryDark }}>
                                  {docDef.label}
                                </Typography>
                                <Typography sx={{ fontSize: "0.7rem", color: COLORS.textSecondary, mt: 0.2 }}>
                                  {docDef.desc}
                                </Typography>

                                {uploadedDoc && (
                                  <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                                    <Chip
                                      label={isVerified ? "Verified" : isRejected ? "Rejected" : "Pending Review"}
                                      size="small"
                                      sx={{
                                        height: 20,
                                        fontSize: "0.65rem",
                                        fontWeight: 800,
                                        bgcolor: isVerified ? "#DCFCE7" : isRejected ? "#FEE2E2" : "#FEF3C7",
                                        color: isVerified ? "#15803D" : isRejected ? "#B91C1C" : "#B45309",
                                      }}
                                    />
                                    <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted }}>
                                      {new Date(uploadedDoc.uploaded_at).toLocaleDateString()}
                                    </Typography>
                                  </Stack>
                                )}
                              </Box>
                            </Stack>
                          </Grid>

                          <Grid item xs={12} sm={5.5}>
                            <Stack direction="row" alignItems="center" justifyContent={{ xs: "flex-start", sm: "flex-end" }} gap={1} flexWrap="wrap">
                              {uploadedDoc ? (
                                <>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    component="a"
                                    href={getFileFullUrl(uploadedDoc.file_url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 14 }} />}
                                    sx={{
                                      fontSize: "0.72rem",
                                      fontWeight: 700,
                                      textTransform: "none",
                                      borderRadius: "6px",
                                      py: 0.4,
                                      px: 1,
                                    }}
                                  >
                                    View
                                  </Button>

                                  {!isVerified && (
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      color="success"
                                      onClick={() => handleVerifyStatus(uploadedDoc.id, "verified")}
                                      startIcon={<CheckIcon sx={{ fontSize: 14 }} />}
                                      sx={{
                                        fontSize: "0.72rem",
                                        fontWeight: 700,
                                        textTransform: "none",
                                        borderRadius: "6px",
                                        py: 0.4,
                                        px: 1,
                                      }}
                                    >
                                      Approve
                                    </Button>
                                  )}

                                  {!isRejected && (
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      color="error"
                                      onClick={() => handleOpenDocRejectDialog(uploadedDoc.id)}
                                      startIcon={<CloseIcon sx={{ fontSize: 14 }} />}
                                      sx={{
                                        fontSize: "0.72rem",
                                        fontWeight: 700,
                                        textTransform: "none",
                                        borderRadius: "6px",
                                        py: 0.4,
                                        px: 1,
                                      }}
                                    >
                                      Reject
                                    </Button>
                                  )}
                                </>
                              ) : null}

                              {/* Camera Scan Button */}
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleOpenCapture(docDef.type, docDef.label)}
                                disabled={isUploading}
                                startIcon={<CameraAltOutlinedIcon sx={{ fontSize: 15 }} />}
                                sx={{
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  textTransform: "none",
                                  borderRadius: "6px",
                                  py: 0.4,
                                  px: 1,
                                  borderColor: COLORS.primary,
                                  color: COLORS.primary,
                                }}
                              >
                                Scan
                              </Button>

                              {/* Upload File Input Button */}
                              <Button
                                variant="contained"
                                size="small"
                                component="label"
                                disabled={isUploading}
                                startIcon={<CloudUploadOutlinedIcon sx={{ fontSize: 15 }} />}
                                sx={{
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  textTransform: "none",
                                  borderRadius: "6px",
                                  py: 0.4,
                                  px: 1.2,
                                  bgcolor: COLORS.primary,
                                  "&:hover": { bgcolor: "#020617" },
                                }}
                              >
                                {isUploading ? "Uploading..." : uploadedDoc ? "Re-upload" : "Upload"}
                                <input
                                  type="file"
                                  hidden
                                  accept="image/*,application/pdf"
                                  onChange={(e) => handleFileUpload(e, docDef.type)}
                                />
                              </Button>
                            </Stack>
                          </Grid>
                        </Grid>
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>

              {/* CARD E: REJECTION LOG & ACTIONABLE FIX TASKS */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "14px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.card,
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: COLORS.primaryDark }}>
                      Rejection Log & Actionable Fix Tasks
                    </Typography>
                    <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}>
                      Identifies recurring errors (wrong photo, name mismatch, bank details) and tracks fixes.
                    </Typography>
                  </Box>

                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<ErrorOutlineOutlinedIcon sx={{ fontSize: 15 }} />}
                    onClick={() => setRejectionModalOpen(true)}
                    sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.78rem", borderRadius: "8px" }}
                  >
                    Log Rejection
                  </Button>
                </Stack>

                {rejections.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: "center", bgcolor: "#F8FAFC", borderRadius: "10px", border: `1px dashed ${COLORS.border}` }}>
                    <CheckCircleOutlinedIcon sx={{ fontSize: 32, color: "#16A34A", mb: 0.5 }} />
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.textPrimary }}>
                      No Rejections Recorded
                    </Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>
                      This project has passed all portal inspection and documentation criteria cleanly.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.5}>
                    {rejections.map((rej) => {
                      const isPending = rej.fix_status === "pending";
                      return (
                        <Box
                          key={rej.id}
                          sx={{
                            p: 1.8,
                            borderRadius: "10px",
                            border: `1px solid ${isPending ? "#FCA5A5" : "#86EFAC"}`,
                            bgcolor: isPending ? "#FEF2F2" : "#F0FDF4",
                          }}
                        >
                          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                            <Stack direction="row" alignItems="center" gap={1}>
                              <Chip
                                label={rej.rejection_category}
                                size="small"
                                sx={{
                                  fontSize: "0.68rem",
                                  fontWeight: 800,
                                  bgcolor: isPending ? "#FEE2E2" : "#DCFCE7",
                                  color: isPending ? "#B91C1C" : "#15803D",
                                }}
                              />
                              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                                Stage: {rej.stage_at_rejection}
                              </Typography>
                            </Stack>

                            <Chip
                              label={isPending ? "Fix Pending" : "Resolved"}
                              size="small"
                              sx={{
                                fontSize: "0.65rem",
                                fontWeight: 800,
                                bgcolor: isPending ? "#EF4444" : "#10B981",
                                color: "#FFFFFF",
                              }}
                            />
                          </Stack>

                          <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.primaryDark, mt: 0.5 }}>
                            Reason: {rej.rejection_reason}
                          </Typography>

                          <Box sx={{ mt: 1, p: 1, borderRadius: "6px", bgcolor: "#FFFFFF", border: `1px solid ${COLORS.border}` }}>
                            <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: COLORS.textPrimary }}>
                              Fix Task Assigned: {rej.fix_task}
                            </Typography>
                          </Box>

                          {isPending && (
                            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                              <Button
                                variant="contained"
                                size="small"
                                color="success"
                                startIcon={<CheckIcon sx={{ fontSize: 14 }} />}
                                onClick={() => handleResolveTask(rej.id)}
                                sx={{ textTransform: "none", fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px", py: 0.3 }}
                              >
                                Mark Fix as Resolved
                              </Button>
                            </Stack>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* MODAL 1: STAGE DOCUMENT BLOCKER WARNING DIALOG */}
      <Dialog
        open={blockerModalOpen}
        onClose={() => setBlockerModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.05rem", color: COLORS.primaryDark, pb: 1 }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <LockOutlinedIcon sx={{ color: COLORS.danger, fontSize: 24 }} />
            Mandatory Documents Required
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.82rem", color: COLORS.textSecondary, mb: 2 }}>
            You cannot advance to stage <strong>{blockerData.targetStage?.label}</strong> because mandatory portal documents are missing. Please upload or scan them below:
          </Typography>

          <Stack spacing={1.2}>
            {blockerData.missingDocs.map((item) => (
              <Box
                key={item.key}
                sx={{
                  p: 1.5,
                  borderRadius: "8px",
                  bgcolor: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: "#B91C1C" }}>
                    {item.label}
                  </Typography>
                  <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted }}>
                    Required for: {item.requiredForStage}
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setBlockerModalOpen(false);
                    handleOpenCapture(item.key, item.label);
                  }}
                  startIcon={<CameraAltOutlinedIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: "6px",
                    bgcolor: "#FFFFFF",
                  }}
                >
                  Scan Now
                </Button>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => setBlockerModalOpen(false)}
            variant="outlined"
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
          >
            Close & Complete Uploads
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL 2: LOG PORTAL REJECTION & ASSIGN FIX TASK */}
      <Dialog
        open={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.05rem", color: COLORS.primaryDark }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <ErrorOutlineOutlinedIcon sx={{ color: COLORS.danger, fontSize: 24 }} />
            Log Portal Rejection & Assign Fix Task
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary, mb: 2 }}>
            Record the rejection reason from the National Solar Portal and create an actionable fix task for your team.
          </Typography>

          <Stack spacing={2}>
            <Box>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
                Rejection Category *
              </Typography>
              <Select
                fullWidth
                size="small"
                value={rejectionForm.rejection_category}
                onChange={(e) => setRejectionForm((p) => ({ ...p, rejection_category: e.target.value }))}
                sx={{ borderRadius: "8px", fontSize: "0.85rem" }}
              >
                <MenuItem value="Wrong / Blurred Photo">Wrong or Blurred Photo</MenuItem>
                <MenuItem value="Name Mismatch with Bill">Name Mismatch with Electricity Bill</MenuItem>
                <MenuItem value="Bank Account / IFSC Mismatch">Bank Account or IFSC Mismatch</MenuItem>
                <MenuItem value="Non-DCR Panel Certificate">Non-DCR Solar Cell / Undertaking Issue</MenuItem>
                <MenuItem value="Sanctioned Load Exceeded">Sanctioned Load Feasibility Denied</MenuItem>
                <MenuItem value="Incorrect Meter Report">Incorrect Meter Installation Report</MenuItem>
                <MenuItem value="Other Technical Reason">Other Technical Reason</MenuItem>
              </Select>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
                Exact Rejection Reason from Portal *
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Copy-paste the rejection remarks from DISCOM / National Portal..."
                value={rejectionForm.rejection_reason}
                onChange={(e) => setRejectionForm((p) => ({ ...p, rejection_reason: e.target.value }))}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.82rem" } }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
                Actionable Fix Task for Team *
              </Typography>
              <TextField
                fullWidth
                placeholder="e.g. Obtain clear cancelled cheque from customer with legible IFSC code"
                value={rejectionForm.fix_task}
                onChange={(e) => setRejectionForm((p) => ({ ...p, fix_task: e.target.value }))}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.82rem" } }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setRejectionModalOpen(false)} sx={{ textTransform: "none", fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleLogRejectionSubmit}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", px: 2 }}
          >
            Save Rejection & Assign Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL 3: DOCUMENT REJECTION DIALOG */}
      <Dialog
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px" } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1rem", color: COLORS.primaryDark }}>
          Reject Document File
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary, mb: 1.5 }}>
            Specify why this document is rejected (e.g. blurred image, wrong name, expired bill):
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Rejection reason..."
            value={docRejectionReason}
            onChange={(e) => setDocRejectionReason(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.82rem" } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setRejectModalOpen(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDocReject}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>

      {/* LIVE CAMERA CAPTURE MODAL INTEGRATION */}
      <DocumentCaptureModal
        open={captureModalOpen}
        onClose={() => setCaptureModalOpen(false)}
        documentType={captureDocType}
        documentLabel={captureDocLabel}
        onCaptureSuccess={handleCaptureSuccess}
      />
    </Box>
  );
}
