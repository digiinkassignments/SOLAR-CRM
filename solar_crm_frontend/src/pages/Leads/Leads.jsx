import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import usePlanFeatures from "../../hooks/usePlanFeatures";
import * as XLSX from "xlsx";
import {
  Alert as MuiAlert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Breadcrumbs,
  Slide,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Checkbox,
} from "@mui/material";

import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AssignmentInd as AssignIcon,
  Event as FollowupIcon,
  Visibility as ViewIcon,
  Call as CallIcon,
  WhatsApp as WhatsAppIcon,
  Close as CloseIcon,
  Inbox as InboxIcon,
  HomeWork as SiteVisitIcon,
  MoreVert as MoreVertIcon,
  HomeOutlined as HomeOutlinedIcon,
  NavigateNextRounded as NavigateNextRoundedIcon,
  FilterListOff as FilterListOffIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  SolarPower as SolarIcon,
  Notes as NotesIcon,
  Timeline as TimelineIcon,
  Download as DownloadIcon,
  Description as DescriptionIcon,
  GridViewOutlined as GridViewOutlinedIcon,
  ViewListOutlined as ViewListOutlinedIcon,
  TableChartOutlined as TableChartOutlinedIcon,
  SortRounded as SortRoundedIcon,
  UploadFile as UploadFileIcon,
  PictureAsPdf as PictureAsPdfIcon,
  History as HistoryIcon,
  Send as SendIcon,
} from "@mui/icons-material";

import { State, City } from "country-state-city";

import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  assignLead,
  addFollowup,
  getFollowups,
  getActivityLogs,
  deleteLead,
  bulkDeleteLeads,
  downloadQuotationPDF,
} from "../../services/leadService";

import { getUsers } from "../../services/userServices";
import { getSettings } from "../../services/settingsService";
import ImportLeadsDialog from "../../components/ImportLeadsDialog";
import { useAuth } from "../../context/AuthContext";
import WhatsAppDrawer from "../../components/WhatsAppDrawer";
import ScheduleSurveyModal from "../../components/ScheduleSurveyModal";
import { getSurveyByLead } from "../../services/surveyService";
import BulkDeleteBar from "../../components/BulkDeleteBar";

/* ============================================================
   DESIGN TOKENS
   ============================================================ */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
  "http://localhost:5000";

const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  primarySoft: "#E6F0FA",
  secondary: "#F59E0B",
  secondaryDark: "#D97706",
  secondarySoft: "#FEF3C7",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  purple: "#7C3AED",
  purpleSoft: "#EDE9FE",
};

const STATUS_OPTIONS = [
  "New Lead",
  "Contacted",
  "Follow-up Pending",
  "Site Visit Scheduled",
  "Quotation Sent",
  "Negotiation",
  "Won",
  "Lost",
  "Not Interested",
];

const PRIORITY_OPTIONS = ["Low", "Medium", "High"];
const LEAD_SOURCE_OPTIONS = ["Website", "Call", "WhatsApp", "Reference", "Facebook", "Google", "Cold Call", "Direct", "Other"];
const SOLAR_REQUIREMENT_OPTIONS = ["Residential", "Commercial"];

const INITIAL_FORM_STATE = {
  customer_name: "",
  mobile_number: "",
  alternate_number: "",
  email: "",
  address: "",
  city: "Jaipur",
  state: "Rajasthan",
  pincode: "",
  solar_requirement: "Residential",
  interest_status: "Pending",
  required_kw: "5",
  remark: "",
  lead_source: "Website",
  priority: "Medium",
  status: "New Lead",
  assigned_to: "",
  next_follow_up_date: "",
  site_visit_date: "",
  quotation_amount: "",
  dob: "",
  anniversary_date: "",
};

const INITIAL_FILTERS = {
  search: "",
  status: "",
  priority: "",
  lead_source: "",
  assigned_to: "",
  solar_requirement: "",
  capacity_range: "",
  interest_status: "",
  date_from: "",
  date_to: "",
};

const SlideTransition = React.forwardRef((props, ref) => (
  <Slide ref={ref} {...props} direction="up" />
));

const customScrollbarSx = {
  "&::-webkit-scrollbar": {
    width: "6px",
    height: "6px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "#F1F5F9",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "#94A3B8",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    backgroundColor: COLORS.primary,
  },
};

const cardSx = {
  borderRadius: "12px",
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.card,
  boxShadow: "none",
};

const primaryButtonSx = {
  height: 36,
  borderRadius: "6px",
  textTransform: "none",
  fontWeight: 700,
  fontSize: "0.78rem",
  px: 2,
  backgroundColor: COLORS.primary,
  whiteSpace: "nowrap",
  fontFamily: "'Inter', sans-serif",
  "&:hover": {
    backgroundColor: COLORS.primaryDark,
  },
};

const outlinedButtonSx = {
  height: 36,
  borderRadius: "6px",
  textTransform: "none",
  fontWeight: 700,
  fontSize: "0.78rem",
  px: 1.8,
  borderColor: COLORS.border,
  backgroundColor: COLORS.card,
  color: COLORS.textPrimary,
  whiteSpace: "nowrap",
  fontFamily: "'Inter', sans-serif",
  "&:hover": { borderColor: COLORS.primary, backgroundColor: "#F8FAFC" },
};

const iconSquareBtnSx = {
  width: 36,
  height: 36,
  borderRadius: "6px",
  border: `1px solid ${COLORS.border}`,
  color: COLORS.primary,
  backgroundColor: COLORS.card,
  "&:hover": { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
};

const controlSx = {
  fontFamily: "'Inter', sans-serif",
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    backgroundColor: "#FAFBFC",
    fontSize: "0.78rem",
    color: COLORS.textPrimary,
    height: 36,
    "& fieldset": { borderColor: COLORS.border },
    "&:hover fieldset": { borderColor: COLORS.borderStrong },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary, borderWidth: "1.5px" },
  },
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    fontSize: "0.78rem",
  },
};

const dateControlSx = {
  ...controlSx,
  "& .MuiOutlinedInput-root": {
    ...controlSx["& .MuiOutlinedInput-root"],
    "& input[type='date']": {
      fontFamily: "'Inter', sans-serif",
      fontSize: "0.78rem",
      colorScheme: "light",
    },
  },
};

const FieldLabel = ({ children }) => (
  <Typography
    sx={{
      fontSize: "0.68rem",
      fontWeight: 800,
      color: COLORS.textSecondary,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      mb: 0.5,
      fontFamily: "'Inter', sans-serif",
    }}
  >
    {children}
  </Typography>
);

/* ============================================================
   HELPERS
   ============================================================ */
const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} at ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "L";

const STATUS_STYLES = {
  "New Lead": { color: "#0284C7", bg: "#E0F2FE" },
  Contacted: { color: "#D97706", bg: "#FEF3C7" },
  "Follow-up Pending": { color: COLORS.warning, bg: COLORS.warningSoft },
  "Site Visit Scheduled": { color: COLORS.purple, bg: COLORS.purpleSoft },
  "Quotation Sent": { color: "#9333EA", bg: "#F3E8FF" },
  Negotiation: { color: "#C026D3", bg: "#FCE7F3" },
  Won: { color: COLORS.success, bg: COLORS.successSoft },
  Lost: { color: COLORS.danger, bg: COLORS.dangerSoft },
  "Not Interested": { color: COLORS.textSecondary, bg: "#F1F5F9" },
};

const PRIORITY_STYLES = {
  High: { color: COLORS.danger, bg: COLORS.dangerSoft },
  Medium: { color: COLORS.warning, bg: COLORS.warningSoft },
  Low: { color: COLORS.success, bg: COLORS.successSoft },
};

const StatusChip = ({ status }) => {
  const style = STATUS_STYLES[status] || { color: COLORS.textMuted, bg: "#F1F2F4" };
  return (
    <Chip
      label={status || "New Lead"}
      size="small"
      sx={{
        color: style.color,
        backgroundColor: style.bg,
        fontWeight: 700,
        fontSize: "0.68rem",
        height: 20,
        borderRadius: "4px",
      }}
    />
  );
};

const PriorityChip = ({ priority }) => {
  const style = PRIORITY_STYLES[priority] || { color: COLORS.textMuted, bg: "#F1F2F4" };
  return (
    <Chip
      label={priority || "Medium"}
      size="small"
      variant="outlined"
      sx={{
        color: style.color,
        borderColor: `${style.color}40`,
        backgroundColor: style.bg,
        fontWeight: 700,
        fontSize: "0.65rem",
        height: 18,
        borderRadius: "4px",
      }}
    />
  );
};

const EmptyState = ({ onAdd }) => (
  <Box sx={{ py: 6, px: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
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
        color: COLORS.textMuted,
      }}
    >
      <InboxIcon sx={{ fontSize: 32 }} />
    </Box>
    <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.textPrimary, mb: 0.5, fontFamily: "'Inter', sans-serif" }}>
      No Leads Found
    </Typography>
    <Typography variant="body2" sx={{ color: COLORS.textMuted, maxWidth: 380, mb: 3, textAlign: "center", fontFamily: "'Inter', sans-serif" }}>
      There are no leads matching your current search or filters. Try adjusting your filters or add a new customer lead.
    </Typography>
    {onAdd && (
      <Button
        variant="contained"
        onClick={onAdd}
        startIcon={<AddIcon />}
        sx={{
          backgroundColor: COLORS.primary,
          color: "#FFFFFF",
          fontWeight: 700,
          textTransform: "none",
          borderRadius: "6px",
          px: 3,
          py: 1,
          fontFamily: "'Inter', sans-serif",
          "&:hover": { backgroundColor: COLORS.primaryDark },
        }}
      >
        Add New Lead
      </Button>
    )}
  </Box>
);

const formatQuickRemark = (rawText) => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const formattedHours = String(hours).padStart(2, "0");
  const timestampStr = `${day}-${month}-${year} ${formattedHours}:${minutes}${ampm}`;
  return `${timestampStr} --- "${rawText.trim()}"`;
};

const QuickRemarkInput = ({ lead, onSave }) => {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!text.trim() || saving) return;
    setSaving(true);
    await onSave(lead, text.trim());
    setText("");
    setSaving(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Box sx={{ mt: 0.5, width: "100%" }}>
      <TextField
        fullWidth
        size="small"
        placeholder="+ Add remark (Enter to save)..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={saving}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {saving ? (
                <CircularProgress size={12} color="inherit" />
              ) : (
                <IconButton
                  size="small"
                  onClick={handleSave}
                  disabled={!text.trim()}
                  sx={{ p: 0.2, color: text.trim() ? COLORS.primary : COLORS.textMuted }}
                >
                  <SendIcon sx={{ fontSize: 13 }} />
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "6px",
            backgroundColor: "#FAFBFC",
            fontSize: "0.72rem",
            height: 26,
            px: 1,
            "& fieldset": { borderColor: COLORS.border },
            "&:hover fieldset": { borderColor: COLORS.borderStrong },
            "&.Mui-focused fieldset": { borderColor: COLORS.primary },
          },
          "& input": { py: 0, fontSize: "0.72rem" },
        }}
      />
    </Box>
  );
};

// ======================================================
// PDF EXPORT HELPER (WITH LOGO & SETTINGS DETAILS)
// ======================================================
const exportLeadsToPdf = (rows, companyData) => {
  if (!rows || !rows.length) return;

  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const compName = companyData?.company_name || "Solar CRM";
  const compEmail = companyData?.company_email || "";
  const compPhone = companyData?.company_phone || "";
  const compWebsite = companyData?.website || "";
  const compAddressParts = [
    companyData?.address,
    companyData?.city,
    companyData?.state,
    companyData?.pincode || companyData?.zip_code,
  ].filter(Boolean);
  const compAddress = compAddressParts.join(", ");
  const compGst = companyData?.gst_number ? `GSTIN: ${companyData.gst_number}` : "";

  const logoFile = companyData?.company_logo;
  const logoUrl = logoFile
    ? logoFile.startsWith("http")
      ? logoFile
      : `${API_BASE_URL}/uploads/company/${logoFile}`
    : null;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${compName} - Lead Management Report</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            margin: 0; padding: 16px; color: #0F172A; background: #ffffff;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; border-bottom: 2px solid #0F172A; padding-bottom: 12px; }
          .brand-cell { vertical-align: middle; width: 50%; }
          .logo-img { max-height: 48px; max-width: 180px; object-fit: contain; margin-bottom: 4px; }
          .brand-title { font-size: 20px; font-weight: 800; color: #0F172A; letter-spacing: -0.5px; }
          .brand-subtitle { font-size: 11px; color: #64748B; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-top: 4px; }
          .meta-cell { text-align: right; vertical-align: middle; font-size: 10px; color: #475569; line-height: 1.5; width: 50%; }
          .meta-cell strong { color: #0F172A; font-size: 11px; }
          .doc-bar { background: #0F172A; color: #ffffff; padding: 8px 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
          .doc-title { font-size: 12px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }
          .doc-date { font-size: 11px; opacity: 0.9; }
          table.data-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px; }
          table.data-table th { background-color: #0F172A; color: #ffffff; font-weight: 800; text-align: left; padding: 8px; font-size: 9px; text-transform: uppercase; }
          table.data-table td { padding: 7px 8px; border-bottom: 1px solid #E2E8F0; }
          table.data-table tr:nth-child(even) { background-color: #F8FAFC; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8.5px; font-weight: 800; text-transform: uppercase; }
          .footer-box { border-top: 2px solid #E2E8F0; padding-top: 8px; margin-top: 16px; font-size: 9px; color: #64748B; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td class="brand-cell">
              ${logoUrl ? `<img src="${logoUrl}" class="logo-img" alt="${compName}" /><div class="brand-title" style="display:none;">${compName}</div>` : `<div class="brand-title">${compName}</div>`}
              <div class="brand-subtitle">SOLAR LEAD MANAGEMENT REPORT</div>
            </td>
            <td class="meta-cell">
              <strong>${compName}</strong><br/>
              ${compAddress ? `${compAddress}<br/>` : ""}
              ${compEmail ? `Email: ${compEmail} ` : ""}${compPhone ? `| Ph: ${compPhone}` : ""}<br/>
              ${compWebsite ? `Web: ${compWebsite} ` : ""}${compGst ? `| ${compGst}` : ""}
            </td>
          </tr>
        </table>

        <div class="doc-bar">
          <span class="doc-title">Solar Customer Leads Directory</span>
          <span class="doc-date">Generated on ${dateStr} · Total: ${rows.length} Leads</span>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Lead ID</th>
              <th>Customer Name</th>
              <th>Mobile</th>
              <th>Location</th>
              <th>Requirement</th>
              <th>Source</th>
              <th>Assigned Rep</th>
              <th>Status</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((r, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${r.lead_code || `LE${String(r.id).padStart(5, '0')}`}</strong></td>
                <td><strong>${r.customer_name || ''}</strong></td>
                <td>${r.mobile_number || ''}</td>
                <td>${[r.city, r.state].filter(Boolean).join(", ") || 'N/A'}</td>
                <td>${r.solar_requirement || 'Residential'} (${r.required_kw || 1} kW)</td>
                <td>${r.lead_source || 'Other'}</td>
                <td>${r.assigned_to_name || 'Unassigned'}</td>
                <td><span class="badge" style="background:#E0F2FE; color:#0284C7;">${r.status || 'New Lead'}</span></td>
                <td>${r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer-box">
          <div><strong>${compName}</strong> — Internal Solar CRM Lead Management Document</div>
          <div>${dateStr}</div>
        </div>

        <script>
          window.onload = function() { setTimeout(function() { window.print(); }, 300); };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function Leads() {
  const location = useLocation();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const { can } = usePlanFeatures();
  const { user } = useAuth();

  // View Mode: "box" (Default), "table", "grid"
  const [viewMode, setViewMode] = useState("box");
  const [sortBy, setSortBy] = useState("newest");

  // Export Modal Dialog State
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("excel"); // "excel" or "pdf"

  const [whatsappDrawerOpen, setWhatsappDrawerOpen] = useState(false);
  const [whatsappLead, setWhatsappLead] = useState(null);

  const [scheduleSurveyOpen, setScheduleSurveyOpen] = useState(false);
  const [surveyLead, setSurveyLead] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [searchInput, setSearchInput] = useState("");

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [anchorEl, setAnchorEl] = useState(null);
  const [activeLead, setActiveLead] = useState(null);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [duplicateChecking, setDuplicateChecking] = useState(false);

  // View Lead Modal Popup State (Centered Modal Popup)
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewLead, setViewLead] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewFollowups, setViewFollowups] = useState([]);

  // All Remarks History Modal State (LIFO Timeline + Quick Add)
  const [remarksModalOpen, setRemarksModalOpen] = useState(false);
  const [remarksModalLead, setRemarksModalLead] = useState(null);
  const [remarksList, setRemarksList] = useState([]);
  const [remarksLoading, setRemarksLoading] = useState(false);
  const [newRemarkText, setNewRemarkText] = useState("");
  const [newRemarkType, setNewRemarkType] = useState("Call");
  const [newRemarkSaving, setNewRemarkSaving] = useState(false);

  // Assign Dialog State
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignedToUser, setAssignedToUser] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Follow-up Dialog State
  const [followupDialogOpen, setFollowupDialogOpen] = useState(false);
  const [followupData, setFollowupData] = useState({
    note: "",
    followup_type: "Call",
    next_follow_up_date: "",
    status_after_followup: "",
  });
  const [followupSaving, setFollowupSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [cityOptions, setCityOptions] = useState([]);

  // Bulk Delete State
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const userRole = useMemo(() => {
    return (user?.role_name || user?.role || "").toLowerCase().trim();
  }, [user]);

  const canExportData = useMemo(() => {
    if (!userRole) return true;
    const isBlocked = userRole.includes("sales") || userRole.includes("telecaller") || userRole.includes("caller");
    if (isBlocked) return false;
    return userRole.includes("admin") || userRole.includes("manager") || userRole === "super_admin";
  }, [userRole]);

  const openWhatsAppDrawer = useCallback((lead) => {
    setWhatsappLead(lead);
    setWhatsappDrawerOpen(true);
    setAnchorEl(null);
  }, []);

  const openScheduleSurvey = useCallback((lead) => {
    setSurveyLead(lead || activeLead);
    setScheduleSurveyOpen(true);
    setAnchorEl(null);
  }, [activeLead]);

  const indianStates = useMemo(() => State.getStatesOfCountry("IN"), []);

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchCompanySettings = async () => {
    try {
      const res = await getSettings();
      const data = res?.data?.data || res?.data || {};
      setCompanySettings(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await getUsers({ limit: 100 });
      const responseData = res?.data;
      if (responseData?.success) {
        setUsersList(responseData.data || []);
      }
    } catch (err) {
      console.error("Error fetching users for dropdown:", err);
    }
  }, []);

  const buildQueryParams = useCallback(
    (overrides = {}) => ({
      search: filters.search,
      status: filters.status,
      priority: filters.priority,
      lead_source: filters.lead_source,
      assigned_to: filters.assigned_to,
      solar_requirement: filters.solar_requirement,
      date_from: filters.date_from,
      date_to: filters.date_to,
      ...overrides,
    }),
    [filters]
  );

  const fetchLeadsList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLeads(buildQueryParams({ page: page + 1, limit: rowsPerPage }));
      if (res?.success) {
        setLeads(res.data || []);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      console.error(err);
      showSnackbar("Unable to load leads. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, page, rowsPerPage, showSnackbar]);

  const handleQuickRemarkSubmit = useCallback(async (lead, rawText) => {
    if (!lead || !rawText) return;
    const formattedNote = formatQuickRemark(rawText);
    const todayDateStr = new Date().toISOString().slice(0, 10);

    try {
      // 1. Primary: Save follow-up entry
      await addFollowup(lead.id, {
        note: formattedNote,
        followup_type: "Call",
        next_follow_up_date: todayDateStr,
      });

      // 2. Secondary: Update lead remark field with full payload to satisfy backend validation
      try {
        await updateLead(lead.id, {
          ...lead,
          remark: formattedNote,
          next_follow_up_date: todayDateStr,
        });
      } catch (updateErr) {
        console.warn("Lead main record remark update warning:", updateErr);
      }

      showSnackbar(`Remark & Follow-up saved for ${lead.customer_name || "Lead"}`, "success");
      fetchLeadsList();
    } catch (err) {
      console.error("Quick remark error:", err);
      showSnackbar("Failed to save remark. Please try again.", "error");
    }
  }, [fetchLeadsList, showSnackbar]);

  const handleOpenRemarksHistory = useCallback(async (lead) => {
    const target = lead || activeLead;
    if (!target) return;
    setRemarksModalLead(target);
    setRemarksModalOpen(true);
    setRemarksLoading(true);
    setNewRemarkText("");
    setNewRemarkType("Call");
    setAnchorEl(null);
    try {
      const res = await getFollowups(target.id);
      if (res?.data) {
        setRemarksList(res.data);
      } else {
        setRemarksList([]);
      }
    } catch (err) {
      console.error("Failed to fetch remarks history:", err);
      setRemarksList([]);
      showSnackbar("Could not load remarks history.", "error");
    } finally {
      setRemarksLoading(false);
    }
  }, [activeLead, showSnackbar]);

  const handleAddRemarkFromModal = useCallback(async () => {
    if (!newRemarkText.trim() || !remarksModalLead || newRemarkSaving) return;
    setNewRemarkSaving(true);
    const formattedNote = formatQuickRemark(newRemarkText.trim());
    const todayDateStr = new Date().toISOString().slice(0, 10);

    try {
      await addFollowup(remarksModalLead.id, {
        note: formattedNote,
        followup_type: newRemarkType || "Call",
        next_follow_up_date: todayDateStr,
      });
      showSnackbar("New remark added successfully.", "success");
      setNewRemarkText("");
      const res = await getFollowups(remarksModalLead.id);
      if (res?.data) setRemarksList(res.data);
      fetchLeadsList();
    } catch (err) {
      console.error("Failed to add remark:", err);
      showSnackbar(err.response?.data?.message || "Failed to add remark.", "error");
    } finally {
      setNewRemarkSaving(false);
    }
  }, [newRemarkText, remarksModalLead, newRemarkSaving, newRemarkType, showSnackbar, fetchLeadsList]);

  useEffect(() => {
    fetchUsers();
    fetchCompanySettings();
  }, [fetchUsers]);

  useEffect(() => {
    fetchLeadsList();
  }, [fetchLeadsList]);

  // Client-side Filtered and Sorted Leads
  const processedLeads = useMemo(() => {
    let list = [...leads];

    if (filters.capacity_range) {
      if (filters.capacity_range === "1-3") {
        list = list.filter((l) => Number(l.required_kw || 0) >= 1 && Number(l.required_kw || 0) <= 3);
      } else if (filters.capacity_range === "3-5") {
        list = list.filter((l) => Number(l.required_kw || 0) > 3 && Number(l.required_kw || 0) <= 5);
      } else if (filters.capacity_range === "5-10") {
        list = list.filter((l) => Number(l.required_kw || 0) > 5 && Number(l.required_kw || 0) <= 10);
      } else if (filters.capacity_range === "10+") {
        list = list.filter((l) => Number(l.required_kw || 0) > 10);
      }
    }

    if (sortBy === "name_asc") {
      list.sort((a, b) => (a.customer_name || "").localeCompare(b.customer_name || ""));
    } else if (sortBy === "name_desc") {
      list.sort((a, b) => (b.customer_name || "").localeCompare(a.customer_name || ""));
    } else if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === "kw_high") {
      list.sort((a, b) => Number(b.required_kw || 0) - Number(a.required_kw || 0));
    } else {
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return list;
  }, [leads, sortBy, filters.capacity_range]);

  const resetForm = useCallback(() => {
    setSelectedLead(null);
    setFormData(INITIAL_FORM_STATE);
    setFormErrors({});
    const rajState = indianStates.find((s) => s.name === "Rajasthan");
    setCityOptions(rajState ? City.getCitiesOfState("IN", rajState.isoCode) : []);
    setDuplicateWarning(null);
    setDuplicateChecking(false);
  }, [indianStates]);

  const openCreateDialog = useCallback(() => {
    resetForm();
    setFormDialogOpen(true);
  }, [resetForm]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("create") === "true") {
      openCreateDialog();
    }
  }, [location.search, openCreateDialog]);

  const openEditDialog = useCallback((lead) => {
    const target = lead || activeLead;
    if (!target) return;
    setSelectedLead(target);
    if (target.state) {
      const stateObj = indianStates.find((s) => s.name === target.state);
      setCityOptions(stateObj ? City.getCitiesOfState("IN", stateObj.isoCode) : []);
    } else {
      setCityOptions([]);
    }

    setFormData({
      customer_name: target.customer_name || "",
      mobile_number: target.mobile_number || "",
      alternate_number: target.alternate_number || "",
      email: target.email || "",
      address: target.address || "",
      city: target.city || "",
      state: target.state || "",
      pincode: target.pincode || "",
      solar_requirement: target.solar_requirement || "Residential",
      interest_status: target.interest_status || "Pending",
      required_kw: target.required_kw || "5",
      remark: target.remark || "",
      lead_source: target.lead_source || "Website",
      priority: target.priority || "Medium",
      status: target.status || "New Lead",
      assigned_to: target.assigned_to || "",
      next_follow_up_date: target.next_follow_up_date ? target.next_follow_up_date.slice(0, 10) : "",
      site_visit_date: target.site_visit_date ? target.site_visit_date.slice(0, 10) : "",
      quotation_amount: target.quotation_amount || "",
      dob: target.dob ? target.dob.slice(0, 10) : "",
      anniversary_date: target.anniversary_date ? target.anniversary_date.slice(0, 10) : "",
    });
    setFormErrors({});
    setDuplicateWarning(null);
    setFormDialogOpen(true);
    setAnchorEl(null);
  }, [indianStates, activeLead]);

  const handleStateChange = useCallback(
    (e) => {
      const stateName = e.target.value;
      setFormData((prev) => ({ ...prev, state: stateName, city: "" }));
      const stateObj = indianStates.find((s) => s.name === stateName);
      if (stateObj) {
        setCityOptions(City.getCitiesOfState("IN", stateObj.isoCode));
      } else {
        setCityOptions([]);
      }
    },
    [indianStates]
  );

  const handleCityChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, city: e.target.value }));
  }, []);

  const handleFormFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};
    if (!formData.customer_name.trim()) errors.customer_name = "Customer Name is required";
    if (!formData.mobile_number.trim()) {
      errors.mobile_number = "Mobile Number is required";
    } else if (!/^\d{10}$/.test(formData.mobile_number.trim())) {
      errors.mobile_number = "Enter valid 10-digit mobile number";
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Enter valid email address";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleFormSubmit = useCallback(async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = { ...formData };
      if (!payload.assigned_to) delete payload.assigned_to;
      if (!payload.next_follow_up_date) delete payload.next_follow_up_date;
      if (!payload.site_visit_date) delete payload.site_visit_date;
      if (!payload.dob) delete payload.dob;
      if (!payload.anniversary_date) delete payload.anniversary_date;

      if (selectedLead) {
        await updateLead(selectedLead.id, payload);
        showSnackbar("Lead updated successfully.");
      } else {
        await createLead(payload);
        showSnackbar("New lead created successfully.");
      }
      setFormDialogOpen(false);
      resetForm();
      fetchLeadsList();
    } catch (err) {
      console.error(err);
      showSnackbar(err.response?.data?.message || "Unable to save lead.", "error");
    } finally {
      setSaving(false);
    }
  }, [validateForm, formData, selectedLead, showSnackbar, resetForm, fetchLeadsList]);

  // Open View Lead Profile Modal Popup
  const openViewModal = useCallback(async (lead) => {
    const target = lead || activeLead;
    if (!target) return;
    setViewLead(target);
    setViewModalOpen(true);
    setViewLoading(true);
    setAnchorEl(null);
    try {
      const details = await getLeadById(target.id);
      if (details?.data) setViewLead(details.data);
      const followups = await getFollowups(target.id);
      if (followups?.data) setViewFollowups(followups.data);
    } catch (err) {
      console.error(err);
    } finally {
      setViewLoading(false);
    }
  }, [activeLead]);

  // Open Assign Dialog Modal
  const openAssignModal = useCallback((lead) => {
    const target = lead || activeLead;
    if (!target) return;
    setActiveLead(target);
    setAssignedToUser(target.assigned_to || "");
    setAssignDialogOpen(true);
    setAnchorEl(null);
  }, [activeLead]);

  const handleAssignSubmit = useCallback(async () => {
    if (!activeLead) return;
    setAssigning(true);
    try {
      await assignLead(activeLead.id, { assigned_to: assignedToUser || null });
      showSnackbar("Lead assigned successfully.");
      setAssignDialogOpen(false);
      fetchLeadsList();
    } catch (err) {
      console.error(err);
      showSnackbar(err.response?.data?.message || "Unable to assign lead.", "error");
    } finally {
      setAssigning(false);
    }
  }, [assignedToUser, activeLead, fetchLeadsList, showSnackbar]);

  // Open Followup Dialog Modal
  const openFollowupModal = useCallback((lead) => {
    const target = lead || activeLead;
    if (!target) return;
    setActiveLead(target);
    setFollowupData({ note: "", followup_type: "Call", next_follow_up_date: "", status_after_followup: target.status || "" });
    setFollowupDialogOpen(true);
    setAnchorEl(null);
  }, [activeLead]);

  const handleFollowupSubmit = useCallback(async () => {
    if (!followupData.note.trim() || !activeLead) return;
    setFollowupSaving(true);
    try {
      await addFollowup(activeLead.id, {
        note: followupData.note,
        followup_type: followupData.followup_type,
        follow_up_date: followupData.next_follow_up_date || undefined,
        status_after_followup: followupData.status_after_followup || undefined,
      });
      showSnackbar("Follow-up logged successfully.");
      setFollowupDialogOpen(false);
      fetchLeadsList();
    } catch (err) {
      console.error(err);
      showSnackbar(err.response?.data?.message || "Unable to save follow-up.", "error");
    } finally {
      setFollowupSaving(false);
    }
  }, [followupData, activeLead, fetchLeadsList, showSnackbar]);

  const openDeleteDialog = useCallback((lead) => {
    const target = lead || activeLead;
    if (!target) return;
    setActiveLead(target);
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  }, [activeLead]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!activeLead) return;
    setDeleting(true);
    try {
      await deleteLead(activeLead.id);
      showSnackbar("Lead deleted successfully.");
      setSelectedIds((prev) => prev.filter((id) => id !== activeLead.id));
      setDeleteDialogOpen(false);
      fetchLeadsList();
    } catch (err) {
      console.error(err);
      showSnackbar(err.response?.data?.message || "Unable to delete lead.", "error");
    } finally {
      setDeleting(false);
    }
  }, [activeLead, fetchLeadsList, showSnackbar]);

  const handleToggleSelect = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(processedLeads.map((r) => r.id));
  }, [processedLeads]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const res = await bulkDeleteLeads(selectedIds);
      if (res?.success) {
        showSnackbar(res.message || `${selectedIds.length} leads deleted successfully.`);
        setSelectedIds([]);
        fetchLeadsList();
      } else {
        showSnackbar(res?.message || "Failed to delete selected leads.", "error");
      }
    } catch (err) {
      console.error(err);
      showSnackbar(err.response?.data?.message || "Failed to delete selected leads.", "error");
    } finally {
      setBulkDeleting(false);
    }
  }, [selectedIds, showSnackbar, fetchLeadsList]);

  const handleMenuOpen = useCallback((event, lead) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setActiveLead(lead);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      setPage(0);
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }
  }, [searchInput]);

  const handleSearchBlur = useCallback(() => {
    setPage(0);
    setFilters((prev) => ({ ...prev, search: searchInput }));
  }, [searchInput]);

  const handleFilterChange = useCallback((field, value) => {
    setPage(0);
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setSearchInput("");
    setSortBy("newest");
    setPage(0);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchLeadsList();
  }, [fetchLeadsList]);

  const handleCall = useCallback((mobile) => {
    if (!mobile) return;
    window.location.href = `tel:${mobile}`;
  }, []);

  const handleExportSubmit = useCallback(() => {
    setExportModalOpen(false);
    if (exportFormat === "excel") {
      const headers = [
        "Lead ID", "Customer Name", "Mobile Number", "Email", "City", "State",
        "Requirement", "Required kW", "Source", "Priority", "Status", "Assigned To", "Created Date"
      ];
      const data = processedLeads.map((r, idx) => ({
        "S.No": idx + 1,
        "Lead ID": r.lead_code || `LE${String(r.id).padStart(5, "0")}`,
        "Customer Name": r.customer_name || "",
        "Mobile Number": r.mobile_number || "",
        "Email": r.email || "",
        "City": r.city || "",
        "State": r.state || "",
        "Requirement": r.solar_requirement || "",
        "Required kW": r.required_kw || "",
        "Source": r.lead_source || "",
        "Priority": r.priority || "",
        "Status": r.status || "",
        "Assigned To": r.assigned_to_name || "Unassigned",
        "Created Date": r.created_at ? new Date(r.created_at).toLocaleDateString("en-GB") : "",
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads Data");
      XLSX.writeFile(workbook, `Solar_Leads_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showSnackbar("Leads exported to Excel successfully.");
    } else {
      exportLeadsToPdf(processedLeads, companySettings);
      showSnackbar("Leads PDF report opened for printing.");
    }
  }, [exportFormat, processedLeads, companySettings, showSnackbar]);

  const hasActiveFilters = Boolean(
    filters.search || filters.status || filters.priority || filters.lead_source || filters.assigned_to || filters.solar_requirement || filters.capacity_range || filters.date_from || filters.date_to || sortBy !== "newest"
  );

  return (
    <Box sx={{ backgroundColor: COLORS.bg, minHeight: "100vh", p: 2, boxSizing: "border-box", width: "100%" }}>
      <Box sx={{ width: "100%", maxWidth: "100%", mx: "auto" }}>

        {/* BREADCRUMBS */}
        <Breadcrumbs separator={<NavigateNextRoundedIcon sx={{ fontSize: "0.8rem", color: COLORS.textMuted }} />} sx={{ mb: 1.5 }}>
          <Stack direction="row" alignItems="center" gap={0.5}>
            <HomeOutlinedIcon sx={{ fontSize: "0.8rem", color: COLORS.textMuted }} />
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: COLORS.textMuted }}>
              Dashboard
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.primaryDark }}>
            Lead Management
          </Typography>
        </Breadcrumbs>

        {/* HERO HEADER */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 1.5,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1.05rem" }}>
              Lead Management Directory
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.75rem", mt: 0.1 }}>
              Manage customer enquiries, assignments, site surveys &amp; follow-up pipeline.
            </Typography>
          </Box>

          <Stack direction="row" alignItems="center" gap={1} sx={{ flexShrink: 0, flexWrap: "wrap" }}>
            {/* View Mode Switcher (Box List / Table / Grid) */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newView) => newView && setViewMode(newView)}
              size="small"
              sx={{
                height: 36,
                backgroundColor: "#F1F5F9",
                borderRadius: "6px",
                p: 0.3,
                "& .MuiToggleButton-root": {
                  border: 0,
                  borderRadius: "4px",
                  px: 1.2,
                  py: 0.4,
                  color: COLORS.textSecondary,
                  "&.Mui-selected": {
                    backgroundColor: COLORS.card,
                    color: COLORS.primary,
                    fontWeight: 700,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  },
                },
              }}
            >
              <ToggleButton value="box">
                <Tooltip title="Box List View (Default)">
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <ViewListOutlinedIcon sx={{ fontSize: 17 }} />
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700 }}>Box</Typography>
                  </Stack>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="table">
                <Tooltip title="Table View">
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <TableChartOutlinedIcon sx={{ fontSize: 17 }} />
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700 }}>Table</Typography>
                  </Stack>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="grid">
                <Tooltip title="Grid View">
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <GridViewOutlinedIcon sx={{ fontSize: 17 }} />
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700 }}>Grid</Typography>
                  </Stack>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Refresh */}
            <Tooltip title="Refresh Directory">
              <IconButton onClick={handleRefresh} disabled={loading} size="small" sx={iconSquareBtnSx}>
                <RefreshIcon
                  sx={{
                    fontSize: 17,
                    animation: loading ? "spin 0.8s linear infinite" : "none",
                    "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                  }}
                />
              </IconButton>
            </Tooltip>

            {can("has_csv_import_export") && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<UploadFileIcon sx={{ fontSize: 15 }} />}
                onClick={() => setImportDialogOpen(true)}
                sx={outlinedButtonSx}
              >
                Import
              </Button>
            )}

            {can("has_csv_import_export") && canExportData && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon sx={{ fontSize: 15 }} />}
                onClick={() => setExportModalOpen(true)}
                disabled={leads.length === 0}
                sx={outlinedButtonSx}
              >
                Export
              </Button>
            )}

            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={openCreateDialog}
              sx={primaryButtonSx}
            >
              Add Lead
            </Button>
          </Stack>
        </Paper>

        {/* UNLIMITED / EXTENSIVE MULTIPLE FILTERS PANEL */}
        <Paper elevation={0} sx={{ ...cardSx, p: 1.8, mb: 2, width: "100%", boxSizing: "border-box" }}>
          <Stack spacing={1.5}>
            {/* Filter Row 1 */}
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 1.2, width: "100%" }}>
              {/* Search */}
              <Box sx={{ flex: "1 1 200px", minWidth: 160 }}>
                <FieldLabel>Search Leads</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Name, phone, email, ID, city..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  onBlur={handleSearchBlur}
                  sx={controlSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" sx={{ color: COLORS.textMuted }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Status */}
              <Box sx={{ flex: "0 1 140px", minWidth: 120 }}>
                <FieldLabel>Pipeline Status</FieldLabel>
                <Select fullWidth displayEmpty size="small" value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)} sx={controlSx}>
                  <MenuItem value="" sx={{ fontSize: "0.78rem" }}>All Statuses</MenuItem>
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s} sx={{ fontSize: "0.78rem" }}>{s}</MenuItem>
                  ))}
                </Select>
              </Box>

              {/* Source */}
              <Box sx={{ flex: "0 1 130px", minWidth: 110 }}>
                <FieldLabel>Lead Source</FieldLabel>
                <Select fullWidth displayEmpty size="small" value={filters.lead_source} onChange={(e) => handleFilterChange("lead_source", e.target.value)} sx={controlSx}>
                  <MenuItem value="" sx={{ fontSize: "0.78rem" }}>All Sources</MenuItem>
                  {LEAD_SOURCE_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s} sx={{ fontSize: "0.78rem" }}>{s}</MenuItem>
                  ))}
                </Select>
              </Box>

              {/* Assignee */}
              <Box sx={{ flex: "0 1 140px", minWidth: 120 }}>
                <FieldLabel>Assigned Rep</FieldLabel>
                <Select fullWidth displayEmpty size="small" value={filters.assigned_to} onChange={(e) => handleFilterChange("assigned_to", e.target.value)} sx={controlSx}>
                  <MenuItem value="" sx={{ fontSize: "0.78rem" }}>Everyone</MenuItem>
                  {usersList.map((u) => (
                    <MenuItem key={u.id} value={u.id} sx={{ fontSize: "0.78rem" }}>{u.full_name}</MenuItem>
                  ))}
                </Select>
              </Box>

              {/* Priority */}
              <Box sx={{ flex: "0 1 120px", minWidth: 100 }}>
                <FieldLabel>Priority</FieldLabel>
                <Select fullWidth displayEmpty size="small" value={filters.priority} onChange={(e) => handleFilterChange("priority", e.target.value)} sx={controlSx}>
                  <MenuItem value="" sx={{ fontSize: "0.78rem" }}>All Priorities</MenuItem>
                  {PRIORITY_OPTIONS.map((p) => (
                    <MenuItem key={p} value={p} sx={{ fontSize: "0.78rem" }}>{p}</MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>

            {/* Filter Row 2 */}
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 1.2, width: "100%" }}>
              {/* Requirement Type */}
              <Box sx={{ flex: "0 1 140px", minWidth: 120 }}>
                <FieldLabel>Requirement</FieldLabel>
                <Select fullWidth displayEmpty size="small" value={filters.solar_requirement} onChange={(e) => handleFilterChange("solar_requirement", e.target.value)} sx={controlSx}>
                  <MenuItem value="" sx={{ fontSize: "0.78rem" }}>All Types</MenuItem>
                  {SOLAR_REQUIREMENT_OPTIONS.map((r) => (
                    <MenuItem key={r} value={r} sx={{ fontSize: "0.78rem" }}>{r}</MenuItem>
                  ))}
                </Select>
              </Box>

              {/* Capacity Range */}
              <Box sx={{ flex: "0 1 130px", minWidth: 110 }}>
                <FieldLabel>Solar kW Range</FieldLabel>
                <Select fullWidth displayEmpty size="small" value={filters.capacity_range} onChange={(e) => handleFilterChange("capacity_range", e.target.value)} sx={controlSx}>
                  <MenuItem value="" sx={{ fontSize: "0.78rem" }}>All Capacity</MenuItem>
                  <MenuItem value="1-3" sx={{ fontSize: "0.78rem" }}>1 - 3 kW</MenuItem>
                  <MenuItem value="3-5" sx={{ fontSize: "0.78rem" }}>3 - 5 kW</MenuItem>
                  <MenuItem value="5-10" sx={{ fontSize: "0.78rem" }}>5 - 10 kW</MenuItem>
                  <MenuItem value="10+" sx={{ fontSize: "0.78rem" }}>10+ kW</MenuItem>
                </Select>
              </Box>

              {/* From Date */}
              <Box sx={{ flex: "0 1 130px", minWidth: 110 }}>
                <FieldLabel>From Date</FieldLabel>
                <TextField fullWidth size="small" type="date" value={filters.date_from} onChange={(e) => handleFilterChange("date_from", e.target.value)} sx={dateControlSx} />
              </Box>

              {/* To Date */}
              <Box sx={{ flex: "0 1 130px", minWidth: 110 }}>
                <FieldLabel>To Date</FieldLabel>
                <TextField fullWidth size="small" type="date" value={filters.date_to} onChange={(e) => handleFilterChange("date_to", e.target.value)} sx={dateControlSx} />
              </Box>

              {/* Sort By */}
              <Box sx={{ flex: "0 1 160px", minWidth: 130 }}>
                <FieldLabel>Sort Order</FieldLabel>
                <Select
                  fullWidth
                  size="small"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={controlSx}
                  startAdornment={
                    <InputAdornment position="start">
                      <SortRoundedIcon sx={{ color: COLORS.textMuted, fontSize: "0.85rem", ml: 0.5 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="newest" sx={{ fontSize: "0.78rem" }}>Newest First</MenuItem>
                  <MenuItem value="oldest" sx={{ fontSize: "0.78rem" }}>Oldest First</MenuItem>
                  <MenuItem value="name_asc" sx={{ fontSize: "0.78rem" }}>Name (A-Z)</MenuItem>
                  <MenuItem value="name_desc" sx={{ fontSize: "0.78rem" }}>Name (Z-A)</MenuItem>
                  <MenuItem value="kw_high" sx={{ fontSize: "0.78rem" }}>Capacity (High to Low)</MenuItem>
                </Select>
              </Box>

              {/* Reset */}
              <Box sx={{ flex: "0 0 auto" }}>
                <Tooltip title="Reset All Filters">
                  <span>
                    <IconButton onClick={handleResetFilters} disabled={!hasActiveFilters} size="small" sx={{ ...iconSquareBtnSx, color: hasActiveFilters ? COLORS.primary : COLORS.textMuted }}>
                      <FilterListOffIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          </Stack>
        </Paper>

        {/* BULK ACTIONS BAR */}
        <BulkDeleteBar
          selectedCount={selectedIds.length}
          totalCount={processedLeads.length}
          itemLabel="Leads"
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          isAllSelected={selectedIds.length === processedLeads.length && processedLeads.length > 0}
          onConfirmDelete={handleBulkDelete}
          loading={bulkDeleting}
        />

        {/* MAIN DATA CONTENT (BOX LIST / TABLE / GRID) */}
        {loading ? (
          <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: "12px" }} />
            ))}
          </Box>
        ) : processedLeads.length === 0 ? (
          <Paper elevation={0} sx={{ ...cardSx, p: 4, textAlign: "center" }}>
            <EmptyState onAdd={openCreateDialog} />
          </Paper>
        ) : viewMode === "box" ? (
          /* ================= DEFAULT BOX LIST VIEW ================= */
          <Box sx={{ width: "100%" }}>
            {processedLeads.map((row) => {
              const isSelected = selectedIds.includes(row.id);
              return (
              <Paper
                key={row.id}
                elevation={0}
                sx={{
                  p: 2,
                  mb: 1.5,
                  borderRadius: "12px",
                  border: `1px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                  backgroundColor: isSelected ? "rgba(15, 23, 42, 0.02)" : COLORS.card,
                  width: "100%",
                  boxSizing: "border-box",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    borderColor: COLORS.primary,
                    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
                  },
                }}
              >
                {/* Header Row */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.2 }}>
                  <Stack direction="row" alignItems="center" gap={1}>
                    <Checkbox
                      size="small"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(row.id)}
                      sx={{ p: 0.5, color: COLORS.borderStrong, "&.Mui-checked": { color: COLORS.primary } }}
                    />
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: "6px",
                        backgroundColor: "#EFF6FF",
                        border: "1px solid #BFDBFE",
                        color: "#1D4ED8",
                        fontWeight: 800,
                        fontSize: "0.78rem",
                        fontFamily: "monospace",
                        letterSpacing: "0.03em",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      {row.lead_code || `LE${String(row.id).padStart(5, "0")}`}
                    </Box>

                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: COLORS.textPrimary }}>
                      {row.customer_name || "Untitled Lead"}
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" gap={1}>
                    <Button
                      size="small"
                      startIcon={<CallIcon sx={{ fontSize: 14 }} />}
                      onClick={() => handleCall(row.mobile_number)}
                      sx={{
                        color: COLORS.primary,
                        backgroundColor: COLORS.primarySoft,
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        borderRadius: "6px",
                        px: 1.2,
                        height: 28,
                        "&:hover": { backgroundColor: COLORS.primary, color: "#FFFFFF" },
                      }}
                    >
                      CALL
                    </Button>

                    <Tooltip title="WhatsApp Lead">
                      <IconButton
                        size="small"
                        onClick={() => openWhatsAppDrawer(row)}
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: "6px",
                          color: "#16A34A",
                          backgroundColor: "#DCFCE7",
                          "&:hover": { backgroundColor: "#16A34A", color: "#FFFFFF" },
                        }}
                      >
                        <WhatsAppIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>

                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, row)}
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "6px",
                        color: COLORS.textSecondary,
                        backgroundColor: "#F1F5F9",
                        "&:hover": { backgroundColor: "#E2E8F0" },
                      }}
                    >
                      <MoreVertIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Stack>
                </Box>

                <Divider sx={{ mb: 1.2, borderColor: COLORS.border }} />

                {/* 3 Column Grid Details Layout */}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Stack spacing={0.8}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <DescriptionIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, fontWeight: 600 }}>
                          Lead Status:
                        </Typography>
                        <StatusChip status={row.status} />
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <SolarIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                          Lead From: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{row.lead_source || "WhatsApp Lead"}</Box>
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <PersonIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                          Branch Lead Assign: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{row.assigned_to_name || "Head Office"}</Box>
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                          p: 1.2,
                          borderRadius: "8px",
                          backgroundColor: "#F8FAFC",
                          border: `1px solid ${COLORS.border}`,
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: "#CBD5E1",
                            backgroundColor: "#F1F5F9",
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Stack direction="row" alignItems="center" gap={0.6}>
                            <NotesIcon sx={{ fontSize: 14, color: COLORS.primary }} />
                            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary }}>
                              Remark:
                            </Typography>
                            <Chip
                              label="Latest"
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: "0.58rem",
                                fontWeight: 800,
                                backgroundColor: "#DCFCE7",
                                color: "#166534",
                                borderRadius: "4px",
                                px: 0.3,
                              }}
                            />
                          </Stack>

                          {row.latest_followup_at && (
                            <Typography sx={{ fontSize: "0.64rem", color: COLORS.textMuted, fontWeight: 500 }}>
                              {formatDate(row.latest_followup_at)}
                            </Typography>
                          )}
                        </Box>

                        {/* Expandable remark container - Box grows dynamically if text is long */}
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            color: row.remark ? COLORS.textPrimary : COLORS.textMuted,
                            fontWeight: 500,
                            lineHeight: 1.45,
                            wordBreak: "break-word",
                            fontStyle: row.remark ? "normal" : "italic",
                          }}
                        >
                          {row.remark || "No remark logged yet."}
                        </Typography>

                        {/* Read more action to view all remarks */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            pt: 0.4,
                            borderTop: `1px dashed ${COLORS.border}`,
                            mt: 0.2,
                          }}
                        >
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleOpenRemarksHistory(row)}
                            sx={{
                              p: 0,
                              minWidth: "auto",
                              fontSize: "0.71rem",
                              fontWeight: 700,
                              color: COLORS.primary,
                              textTransform: "none",
                              "&:hover": {
                                backgroundColor: "transparent",
                                textDecoration: "underline",
                                color: COLORS.primaryDark,
                              },
                            }}
                            startIcon={<ViewIcon sx={{ fontSize: 13 }} />}
                          >
                            Read more ({row.total_followups || (row.remark ? 1 : 0)} remarks)
                          </Button>
                        </Box>

                        <QuickRemarkInput lead={row} onSave={handleQuickRemarkSubmit} />
                      </Box>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Stack spacing={0.8}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <CalendarIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                          Date: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{formatDate(row.created_at)}</Box>
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <PhoneIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                          Phone: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{row.mobile_number || "N/A"}</Box>
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <AssignIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                          Lead Assign: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{row.assigned_to_name || "Unassigned"}</Box>
                          {row.assigned_to_name && (
                            <Box component="span" sx={{ fontSize: "0.68rem", color: COLORS.textMuted, ml: 0.5 }}>
                              (by {row.assigned_by_name || row.created_by_name || "Admin"})
                            </Box>
                          )}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <FollowupIcon sx={{ fontSize: 15, color: COLORS.purple }} />
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                          Next Follow-up: <Box component="span" sx={{ fontWeight: 700, color: (row.next_follow_up_date || row.follow_up_date) ? COLORS.purple : COLORS.textMuted }}>
                            {formatDate(row.next_follow_up_date || row.follow_up_date) || "Not Scheduled"}
                          </Box>
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Stack spacing={0.8}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <HistoryIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                          Time: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{formatTime(row.created_at)}</Box>
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <LocationIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                          Location: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{[row.city, row.state].filter(Boolean).join(", ") || "N/A"}</Box>
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <SolarIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                          Requirement: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{row.solar_requirement || "Residential"}{row.required_kw ? ` (${row.required_kw} kW)` : ""}</Box>
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>
            );
          })}
          </Box>
        ) : viewMode === "table" ? (
          /* ================= TABLE VIEW ================= */
          <Paper elevation={0} sx={{ ...cardSx, overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
            <TableContainer sx={{ maxHeight: 600, width: "100%", overflowX: "auto", ...customScrollbarSx }}>
              <Table stickyHeader size="small" sx={{ width: "100%", minWidth: 1150 }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        backgroundColor: "#F8FAFC",
                        width: "44px",
                        py: 0.5,
                        px: 1,
                        borderBottom: `2px solid ${COLORS.border}`,
                      }}
                    >
                      <Checkbox
                        size="small"
                        indeterminate={selectedIds.length > 0 && selectedIds.length < processedLeads.length}
                        checked={processedLeads.length > 0 && selectedIds.length === processedLeads.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(processedLeads.map((r) => r.id));
                          else setSelectedIds([]);
                        }}
                        sx={{
                          p: 0.5,
                          color: COLORS.borderStrong,
                          "&.Mui-checked, &.MuiCheckbox-indeterminate": { color: COLORS.primary },
                        }}
                      />
                    </TableCell>
                    {[
                      { label: "Lead ID", width: "80px" },
                      { label: "Customer Name", minWidth: "140px" },
                      { label: "Phone Number", width: "110px" },
                      { label: "Location", width: "100px" },
                      { label: "Requirement", width: "110px" },
                      { label: "Next Follow-up", width: "120px" },
                      { label: "Priority", width: "80px" },
                      { label: "Status", width: "100px" },
                      { label: "Assigned To", width: "120px" },
                      { label: "Remark & Add Note", minWidth: "190px" },
                      { label: "Actions", width: "70px", align: "right" },
                    ].map((head) => (
                      <TableCell
                        key={head.label}
                        align={head.align || "left"}
                        sx={{
                          backgroundColor: "#F8FAFC",
                          fontWeight: 800,
                          color: COLORS.textPrimary,
                          fontSize: "0.68rem",
                          letterSpacing: "0.03em",
                          py: 1,
                          px: 1.2,
                          width: head.width,
                          minWidth: head.minWidth,
                          borderBottom: `2px solid ${COLORS.border}`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {head.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {processedLeads.map((row) => {
                    const isSelected = selectedIds.includes(row.id);
                    return (
                    <TableRow
                      key={row.id}
                      hover
                      selected={isSelected}
                      sx={{
                        "& td": { borderBottom: `1px solid ${COLORS.border}`, py: 0.8, px: 1.2 },
                        "&:hover td": { backgroundColor: "#FAFBFD" },
                        bgcolor: isSelected ? "rgba(15, 23, 42, 0.04)" : "inherit",
                      }}
                    >
                      <TableCell sx={{ width: "44px", py: 0.5, px: 1 }}>
                        <Checkbox
                          size="small"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(row.id)}
                          sx={{ p: 0.5, color: COLORS.borderStrong, "&.Mui-checked": { color: COLORS.primary } }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 800, color: COLORS.primary, fontSize: "0.75rem" }}>
                          {row.lead_code || `LE${String(row.id).padStart(5, "0")}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "0.78rem" }}>
                          {row.customer_name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                        {row.mobile_number}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                        {[row.city, row.state].filter(Boolean).join(", ") || "—"}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.75rem" }}>
                        {row.solar_requirement || "Residential"}{row.required_kw ? ` (${row.required_kw}kW)` : ""}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.75rem" }}>
                        <Typography sx={{ fontSize: "0.72rem", fontWeight: (row.next_follow_up_date || row.follow_up_date) ? 700 : 400, color: (row.next_follow_up_date || row.follow_up_date) ? COLORS.purple : COLORS.textMuted }}>
                          {formatDate(row.next_follow_up_date || row.follow_up_date) || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <PriorityChip priority={row.priority} />
                      </TableCell>
                      <TableCell>
                        <StatusChip status={row.status} />
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                        <Typography sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "0.75rem" }}>
                          {row.assigned_to_name || "Unassigned"}
                        </Typography>
                        {row.assigned_to_name && (
                          <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted, fontWeight: 500 }}>
                            by {row.assigned_by_name || row.created_by_name || "Admin"}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.75rem", minWidth: 210 }}>
                        <Box sx={{ mb: 0.4 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 0.2 }}>
                            <Chip
                              label="Latest"
                              size="small"
                              sx={{
                                height: 15,
                                fontSize: "0.55rem",
                                fontWeight: 800,
                                backgroundColor: "#DCFCE7",
                                color: "#166534",
                                borderRadius: "3px",
                                px: 0.2,
                              }}
                            />
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => handleOpenRemarksHistory(row)}
                              sx={{
                                p: 0,
                                minWidth: "auto",
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                color: COLORS.primary,
                                textTransform: "none",
                                "&:hover": { textDecoration: "underline" },
                              }}
                            >
                              Read more ({row.total_followups || (row.remark ? 1 : 0)})
                            </Button>
                          </Box>
                          <Typography
                            sx={{
                              fontSize: "0.72rem",
                              color: row.remark ? COLORS.textPrimary : COLORS.textMuted,
                              fontWeight: 500,
                              wordBreak: "break-word",
                              maxHeight: 52,
                              overflowY: "auto",
                              lineHeight: 1.35,
                            }}
                          >
                            {row.remark || "No remarks"}
                          </Typography>
                        </Box>
                        <QuickRemarkInput lead={row} onSave={handleQuickRemarkSubmit} />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, row)} sx={iconSquareBtnSx}>
                          <MoreVertIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ) : (
          /* ================= GRID VIEW (BALANCED RESPONSIVE GRID) ================= */
          <Grid container spacing={2} sx={{ width: "100%" }}>
            {processedLeads.map((row) => {
              const isSelected = selectedIds.includes(row.id);
              return (
              <Grid item xs={12} sm={6} md={4} lg={3} xl={3} key={row.id}>
                <Paper
                  elevation={0}
                  sx={{
                    ...cardSx,
                    p: 2,
                    borderRadius: "12px",
                    border: `1px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                    backgroundColor: isSelected ? "rgba(15, 23, 42, 0.02)" : COLORS.card,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                    boxSizing: "border-box",
                    "&:hover": { borderColor: COLORS.primary, boxShadow: "0 4px 12px rgba(15,23,42,0.08)" },
                  }}
                >
                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                      <Stack direction="row" alignItems="center" gap={0.5}>
                        <Checkbox
                          size="small"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(row.id)}
                          sx={{ p: 0.25, color: COLORS.borderStrong, "&.Mui-checked": { color: COLORS.primary } }}
                        />
                        <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", color: COLORS.primary }}>
                          {row.lead_code || `LE${String(row.id).padStart(5, "0")}`}
                        </Typography>
                      </Stack>
                      <StatusChip status={row.status} />
                    </Box>

                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: COLORS.textPrimary, mb: 0.5 }}>
                      {row.customer_name}
                    </Typography>

                    <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, mb: 1 }}>
                      Phone: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{row.mobile_number}</Box>
                    </Typography>

                    <Divider sx={{ my: 1, borderColor: COLORS.border }} />

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>
                        Req: {row.solar_requirement || "Residential"} {row.required_kw ? `(${row.required_kw} kW)` : ""}
                      </Typography>
                      <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>
                        Assigned: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{row.assigned_to_name || "Unassigned"}</Box>
                        {row.assigned_to_name && (
                          <Box component="span" sx={{ fontSize: "0.68rem", color: COLORS.textMuted, ml: 0.5 }}>
                            by {row.assigned_by_name || row.created_by_name || "Admin"}
                          </Box>
                        )}
                      </Typography>
                      <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>
                        Next Follow-up: <Box component="span" sx={{ fontWeight: 700, color: (row.next_follow_up_date || row.follow_up_date) ? COLORS.purple : COLORS.textMuted }}>
                          {formatDate(row.next_follow_up_date || row.follow_up_date) || "Not Scheduled"}
                        </Box>
                      </Typography>
                      <Box sx={{ p: 1, borderRadius: "6px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}`, mt: 0.5 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.3 }}>
                          <Stack direction="row" alignItems="center" gap={0.5}>
                            <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: COLORS.textSecondary }}>
                              Remark:
                            </Typography>
                            <Chip label="Latest" size="small" sx={{ height: 15, fontSize: "0.55rem", fontWeight: 800, bgcolor: "#DCFCE7", color: "#166534", borderRadius: "3px" }} />
                          </Stack>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleOpenRemarksHistory(row)}
                            sx={{ p: 0, minWidth: "auto", fontSize: "0.65rem", fontWeight: 700, color: COLORS.primary, textTransform: "none", "&:hover": { textDecoration: "underline" } }}
                          >
                            Read more
                          </Button>
                        </Box>
                        <Typography sx={{ fontSize: "0.74rem", color: row.remark ? COLORS.textPrimary : COLORS.textMuted, fontWeight: 500, wordBreak: "break-word", lineHeight: 1.4 }}>
                          {row.remark || "No remarks"}
                        </Typography>
                      </Box>
                      <QuickRemarkInput lead={row} onSave={handleQuickRemarkSubmit} />
                    </Box>
                  </Box>

                  <Box sx={{ pt: 1.5, mt: 1.5, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Stack direction="row" gap={0.5}>
                      <IconButton size="small" onClick={() => handleCall(row.mobile_number)} sx={{ color: COLORS.primary, bgcolor: COLORS.primarySoft }}>
                        <CallIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => openWhatsAppDrawer(row)} sx={{ color: "#16A34A", bgcolor: "#DCFCE7" }}>
                        <WhatsAppIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Stack>

                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, row)} sx={iconSquareBtnSx}>
                      <MoreVertIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </Paper>
              </Grid>
              );
            })}
          </Grid>
        )}

        {/* PAGINATION */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[6, 12, 24, 48]}
            sx={{
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                fontSize: "0.72rem",
                color: COLORS.textSecondary,
              },
              "& .MuiTablePagination-select": { fontSize: "0.72rem" },
            }}
          />
        </Box>
      </Box>

      {/* FIXED 3-DOTS ACTIONS CONTEXT MENU */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: "10px",
            border: `1px solid ${COLORS.border}`,
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            minWidth: 180,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            const target = activeLead;
            handleMenuClose();
            openViewModal(target);
          }}
          sx={{ fontSize: "0.8rem", py: 0.9 }}
        >
          <ViewIcon sx={{ fontSize: 16, mr: 1.2, color: COLORS.primary }} /> View Lead Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            const target = activeLead;
            handleMenuClose();
            openEditDialog(target);
          }}
          sx={{ fontSize: "0.8rem", py: 0.9 }}
        >
          <EditIcon sx={{ fontSize: 16, mr: 1.2, color: COLORS.warning }} /> Edit Lead Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            const target = activeLead;
            handleMenuClose();
            openFollowupModal(target);
          }}
          sx={{ fontSize: "0.8rem", py: 0.9 }}
        >
          <FollowupIcon sx={{ fontSize: 16, mr: 1.2, color: COLORS.purple }} /> Add Follow-up / Status
        </MenuItem>
        <MenuItem
          onClick={() => {
            const target = activeLead;
            handleMenuClose();
            openAssignModal(target);
          }}
          sx={{ fontSize: "0.8rem", py: 0.9 }}
        >
          <AssignIcon sx={{ fontSize: 16, mr: 1.2, color: COLORS.success }} /> Assign / Reassign Lead
        </MenuItem>
        {can("has_site_survey") && (
          <MenuItem
            onClick={() => {
              const target = activeLead;
              handleMenuClose();
              openScheduleSurvey(target);
            }}
            sx={{ fontSize: "0.8rem", py: 0.9 }}
          >
            <SiteVisitIcon sx={{ fontSize: 16, mr: 1.2, color: "#D97706" }} /> Schedule Site Survey
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            const target = activeLead;
            handleMenuClose();
            handleOpenRemarksHistory(target);
          }}
          sx={{ fontSize: "0.8rem", py: 0.9 }}
        >
          <NotesIcon sx={{ fontSize: 16, mr: 1.2, color: COLORS.primary }} /> All Remarks History (LIFO)
        </MenuItem>
        <MenuItem
          onClick={() => {
            const target = activeLead;
            handleMenuClose();
            openDeleteDialog(target);
          }}
          sx={{ fontSize: "0.8rem", py: 0.9, color: COLORS.danger }}
        >
          <DeleteIcon sx={{ fontSize: 16, mr: 1.2 }} /> Delete Lead
        </MenuItem>
      </Menu>

      {/* ================= EXPORT DIALOG MODAL (EXCEL VS PDF RADIO SELECTION) ================= */}
      <Dialog
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px", p: 0, overflow: "hidden" } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 1.8, backgroundColor: COLORS.primary, color: "#FFFFFF" }}>
          <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>Export Lead Records</Typography>
          <IconButton size="small" onClick={() => setExportModalOpen(false)} sx={{ color: "#FFFFFF", opacity: 0.8 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 2.5 }}>
          <Typography sx={{ fontSize: "0.8rem", color: COLORS.textSecondary, mb: 2 }}>
            Select your preferred report export format:
          </Typography>

          <FormControl component="fieldset" fullWidth>
            <RadioGroup value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
              <Paper
                elevation={0}
                onClick={() => setExportFormat("excel")}
                sx={{
                  p: 1.5,
                  mb: 1.5,
                  borderRadius: "10px",
                  border: `1.5px solid ${exportFormat === "excel" ? COLORS.primary : COLORS.border}`,
                  backgroundColor: exportFormat === "excel" ? COLORS.primarySoft : "#FFFFFF",
                  cursor: "pointer",
                }}
              >
                <FormControlLabel
                  value="excel"
                  control={<Radio size="small" sx={{ color: COLORS.primary, "&.Mui-checked": { color: COLORS.primary } }} />}
                  label={
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: COLORS.textPrimary }}>
                        📊 Excel Spreadsheet (.xlsx)
                      </Typography>
                      <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>
                        Download complete formatted spreadsheet data.
                      </Typography>
                    </Box>
                  }
                />
              </Paper>

              <Paper
                elevation={0}
                onClick={() => setExportFormat("pdf")}
                sx={{
                  p: 1.5,
                  borderRadius: "10px",
                  border: `1.5px solid ${exportFormat === "pdf" ? COLORS.primary : COLORS.border}`,
                  backgroundColor: exportFormat === "pdf" ? COLORS.primarySoft : "#FFFFFF",
                  cursor: "pointer",
                }}
              >
                <FormControlLabel
                  value="pdf"
                  control={<Radio size="small" sx={{ color: COLORS.primary, "&.Mui-checked": { color: COLORS.primary } }} />}
                  label={
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: COLORS.textPrimary }}>
                        📄 Professional PDF Document (.pdf)
                      </Typography>
                      <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>
                        Print-ready PDF report with Company Logo &amp; Header details.
                      </Typography>
                    </Box>
                  }
                />
              </Paper>
            </RadioGroup>
          </FormControl>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 1.8, borderTop: `1px solid ${COLORS.border}`, gap: 1 }}>
          <Button variant="outlined" onClick={() => setExportModalOpen(false)} sx={outlinedButtonSx}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleExportSubmit} startIcon={<DownloadIcon sx={{ fontSize: 16 }} />} sx={primaryButtonSx}>
            Download Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= VIEW LEAD PROFILE POPUP MODAL (DIALOG) ================= */}
      <Dialog
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px", p: 0, overflow: "hidden" } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 1.8, backgroundColor: COLORS.primary, color: "#FFFFFF" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PersonIcon sx={{ color: COLORS.secondary, fontSize: "1.2rem" }} />
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>
              Lead Profile Details
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setViewModalOpen(false)} sx={{ color: "#FFFFFF", opacity: 0.8 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {viewLoading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress size={30} sx={{ color: COLORS.primary }} />
          </Box>
        ) : viewLead ? (
          <DialogContent sx={{ p: 2.5, maxHeight: "75vh", overflowY: "auto", ...customScrollbarSx }}>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: COLORS.textPrimary }}>
                {viewLead.customer_name}
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: COLORS.textMuted }}>
                Lead ID: <strong>{viewLead.lead_code || `LE${String(viewLead.id).padStart(5, "0")}`}</strong>
              </Typography>
              <Stack direction="row" gap={1} sx={{ mt: 1 }}>
                <StatusChip status={viewLead.status} />
                <PriorityChip priority={viewLead.priority} />
              </Stack>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <FieldLabel>Mobile Number</FieldLabel>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.textPrimary }}>
                  {viewLead.mobile_number}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <FieldLabel>Email Address</FieldLabel>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: COLORS.textPrimary }}>
                  {viewLead.email || "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <FieldLabel>Location</FieldLabel>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: COLORS.textPrimary }}>
                  {[viewLead.city, viewLead.state].filter(Boolean).join(", ") || "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <FieldLabel>Solar Requirement</FieldLabel>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.primary }}>
                  {viewLead.solar_requirement || "Residential"} ({viewLead.required_kw || 1} kW)
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <FieldLabel>Assigned Sales Rep</FieldLabel>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: COLORS.textPrimary }}>
                  {viewLead.assigned_to_name || "Unassigned"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <FieldLabel>Lead Source</FieldLabel>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: COLORS.textPrimary }}>
                  {viewLead.lead_source || "N/A"}
                </Typography>
              </Grid>
              {viewLead.dob && (
                <Grid item xs={6}>
                  <FieldLabel>Date of Birth</FieldLabel>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: COLORS.textPrimary }}>
                    🎂 {formatDate(viewLead.dob)}
                  </Typography>
                </Grid>
              )}
              {viewLead.anniversary_date && (
                <Grid item xs={6}>
                  <FieldLabel>Anniversary Date</FieldLabel>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: COLORS.textPrimary }}>
                    💍 {formatDate(viewLead.anniversary_date)}
                  </Typography>
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase" }}>
                Follow-up History &amp; Remarks (LIFO)
              </Typography>
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  const target = viewLead;
                  setViewModalOpen(false);
                  handleOpenRemarksHistory(target);
                }}
                sx={{ fontSize: "0.72rem", fontWeight: 700, p: 0, textTransform: "none", color: COLORS.primary }}
              >
                + Add / Manage Remarks
              </Button>
            </Box>

            {viewFollowups.length === 0 && !viewLead.initial_remark && !viewLead.remark ? (
              <Typography sx={{ fontSize: "0.75rem", color: COLORS.textMuted }}>No follow-up records logged yet.</Typography>
            ) : (
              <Stack spacing={1}>
                {viewFollowups.map((f, idx) => (
                  <Box key={f.id} sx={{ p: 1.2, borderRadius: "8px", backgroundColor: "#F8FAFC", border: `1px solid ${idx === 0 ? "#93C5FD" : COLORS.border}` }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                      <Stack direction="row" alignItems="center" gap={0.6}>
                        {idx === 0 && (
                          <Chip label="Latest" size="small" sx={{ height: 16, fontSize: "0.58rem", fontWeight: 800, bgcolor: "#DCFCE7", color: "#166534" }} />
                        )}
                        <Chip label={f.followup_type || "Call"} size="small" sx={{ height: 16, fontSize: "0.6rem", fontWeight: 700, bgcolor: "#EFF6FF", color: "#1E40AF" }} />
                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textPrimary }}>
                          {f.created_by_name || "Staff"}
                        </Typography>
                      </Stack>
                      <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted }}>
                        {formatDateTime(f.created_at)}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: "0.78rem", color: COLORS.textPrimary, fontWeight: 500, wordBreak: "break-word" }}>
                      {f.note}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </DialogContent>
        ) : null}

        <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}`, justifyContent: "space-between" }}>
          <Stack direction="row" gap={1}>
            {viewLead && (
              <>
                <Button size="small" startIcon={<CallIcon sx={{ fontSize: 14 }} />} onClick={() => handleCall(viewLead.mobile_number)} sx={{ color: COLORS.primary, bgcolor: COLORS.primarySoft, fontWeight: 700 }}>
                  CALL
                </Button>
                <IconButton size="small" onClick={() => openWhatsAppDrawer(viewLead)} sx={{ color: "#16A34A", bgcolor: "#DCFCE7" }}>
                  <WhatsAppIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </>
            )}
          </Stack>

          <Button variant="outlined" onClick={() => setViewModalOpen(false)} sx={outlinedButtonSx}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= ASSIGN LEAD DIALOG MODAL ================= */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "12px", p: 0 } }}>
        <Box sx={{ p: 2, backgroundColor: COLORS.primary, color: "#FFFFFF" }}>
          <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>Assign / Reassign Lead</Typography>
        </Box>
        <DialogContent sx={{ p: 2.5 }}>
          <FieldLabel>Select Sales Rep or Manager</FieldLabel>
          <Select fullWidth size="small" value={assignedToUser} onChange={(e) => setAssignedToUser(e.target.value)} sx={controlSx}>
            <MenuItem value="" sx={{ fontSize: "0.8rem" }}><em>Unassigned</em></MenuItem>
            {usersList.map((u) => (
              <MenuItem key={u.id} value={u.id} sx={{ fontSize: "0.8rem" }}>{u.full_name} ({u.role_name || "Staff"})</MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}`, gap: 1 }}>
          <Button variant="outlined" onClick={() => setAssignDialogOpen(false)} disabled={assigning} sx={outlinedButtonSx}>Cancel</Button>
          <Button variant="contained" onClick={handleAssignSubmit} disabled={assigning} sx={primaryButtonSx}>
            {assigning ? "Saving..." : "Save Assignment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= LOG FOLLOW-UP DIALOG MODAL ================= */}
      <Dialog open={followupDialogOpen} onClose={() => setFollowupDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "12px", p: 0 } }}>
        <Box sx={{ p: 2, backgroundColor: COLORS.primary, color: "#FFFFFF" }}>
          <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>Add Follow-up Note &amp; Status</Typography>
        </Box>
        <DialogContent sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box>
            <FieldLabel>Follow-up Type</FieldLabel>
            <Select fullWidth size="small" value={followupData.followup_type} onChange={(e) => setFollowupData((prev) => ({ ...prev, followup_type: e.target.value }))} sx={controlSx}>
              <MenuItem value="Call">Call</MenuItem>
              <MenuItem value="WhatsApp">WhatsApp</MenuItem>
              <MenuItem value="Meeting">Meeting</MenuItem>
              <MenuItem value="Site Visit">Site Visit</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </Box>
          <Box>
            <FieldLabel>Next Follow-up Date</FieldLabel>
            <TextField fullWidth size="small" type="date" value={followupData.next_follow_up_date} onChange={(e) => setFollowupData((prev) => ({ ...prev, next_follow_up_date: e.target.value }))} sx={dateControlSx} />
          </Box>
          <Box>
            <FieldLabel>Update Pipeline Status</FieldLabel>
            <Select fullWidth size="small" value={followupData.status_after_followup} onChange={(e) => setFollowupData((prev) => ({ ...prev, status_after_followup: e.target.value }))} sx={controlSx}>
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s} sx={{ fontSize: "0.8rem" }}>{s}</MenuItem>
              ))}
            </Select>
          </Box>
          <Box>
            <FieldLabel>Follow-up Note *</FieldLabel>
            <TextField fullWidth multiline minRows={2} size="small" placeholder="Enter follow-up discussion summary..." value={followupData.note} onChange={(e) => setFollowupData((prev) => ({ ...prev, note: e.target.value }))} sx={controlSx} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}`, gap: 1 }}>
          <Button variant="outlined" onClick={() => setFollowupDialogOpen(false)} disabled={followupSaving} sx={outlinedButtonSx}>Cancel</Button>
          <Button variant="contained" onClick={handleFollowupSubmit} disabled={followupSaving || !followupData.note.trim()} sx={primaryButtonSx}>
            {followupSaving ? "Saving..." : "Save Follow-up"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ADD / EDIT LEAD DIALOG MODAL */}
      <Dialog
        open={formDialogOpen}
        onClose={() => !saving && setFormDialogOpen(false)}
        TransitionComponent={SlideTransition}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px", overflow: "hidden" } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, backgroundColor: COLORS.primary, color: "#FFFFFF" }}>
          <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>
            {selectedLead ? "Edit Lead Details" : "Create New Solar Lead"}
          </Typography>
          <IconButton size="small" onClick={() => setFormDialogOpen(false)} disabled={saving} sx={{ color: "#FFFFFF", opacity: 0.8 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, maxHeight: "75vh", overflowY: "auto", ...customScrollbarSx }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

            <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.04em", pb: 0.5, borderBottom: `1px solid ${COLORS.border}` }}>
              Customer Contact Information
            </Typography>

            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <FieldLabel>Customer Name *</FieldLabel>
                <TextField fullWidth size="small" placeholder="e.g. Ramesh Kumar" value={formData.customer_name} onChange={(e) => handleFormFieldChange("customer_name", e.target.value)} error={Boolean(formErrors.customer_name)} helperText={formErrors.customer_name} sx={controlSx} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FieldLabel>Mobile Number *</FieldLabel>
                <TextField fullWidth size="small" placeholder="10-digit number" value={formData.mobile_number} onChange={(e) => handleFormFieldChange("mobile_number", e.target.value.replace(/\D/g, "").slice(0, 10))} error={Boolean(formErrors.mobile_number)} helperText={formErrors.mobile_number} sx={controlSx} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FieldLabel>Alternate Number</FieldLabel>
                <TextField fullWidth size="small" placeholder="Optional" value={formData.alternate_number} onChange={(e) => handleFormFieldChange("alternate_number", e.target.value.replace(/\D/g, "").slice(0, 10))} sx={controlSx} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FieldLabel>Email Address</FieldLabel>
                <TextField fullWidth size="small" placeholder="customer@example.com" value={formData.email} onChange={(e) => handleFormFieldChange("email", e.target.value)} error={Boolean(formErrors.email)} helperText={formErrors.email} sx={controlSx} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FieldLabel>State</FieldLabel>
                <Select fullWidth size="small" value={formData.state} onChange={handleStateChange} sx={controlSx}>
                  {indianStates.map((s) => (
                    <MenuItem key={s.isoCode} value={s.name} sx={{ fontSize: "0.78rem" }}>{s.name}</MenuItem>
                  ))}
                </Select>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FieldLabel>City</FieldLabel>
                <Select fullWidth size="small" value={formData.city} onChange={handleCityChange} sx={controlSx}>
                  {cityOptions.map((c) => (
                    <MenuItem key={c.name} value={c.name} sx={{ fontSize: "0.78rem" }}>{c.name}</MenuItem>
                  ))}
                </Select>
              </Grid>

              <Grid item xs={12} sm={8}>
                <FieldLabel>Full Address</FieldLabel>
                <TextField fullWidth size="small" placeholder="Full address" value={formData.address} onChange={(e) => handleFormFieldChange("address", e.target.value)} sx={controlSx} />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FieldLabel>Pincode</FieldLabel>
                <TextField fullWidth size="small" placeholder="Pincode" value={formData.pincode} onChange={(e) => handleFormFieldChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} sx={controlSx} />
              </Grid>
            </Grid>

            <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.04em", pb: 0.5, borderBottom: `1px solid ${COLORS.border}`, mt: 1 }}>
              Solar System Specifications &amp; Assignment
            </Typography>

            <Grid container spacing={1.5}>
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: "10px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary }}>
                      Required Solar Capacity (kW)
                    </Typography>
                    <Chip label={`${formData.required_kw || 1} kW System`} size="small" sx={{ fontWeight: 800, backgroundColor: COLORS.secondarySoft, color: COLORS.secondaryDark, fontSize: "0.75rem" }} />
                  </Box>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={9}>
                      <Slider
                        value={Number(formData.required_kw) || 1}
                        min={1}
                        max={100}
                        step={1}
                        onChange={(e, val) => handleFormFieldChange("required_kw", String(val))}
                        sx={{
                          color: COLORS.primary,
                          "& .MuiSlider-thumb": { backgroundColor: COLORS.secondary, border: "2px solid #FFFFFF" },
                        }}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField size="small" type="number" value={formData.required_kw} onChange={(e) => handleFormFieldChange("required_kw", e.target.value)} InputProps={{ endAdornment: <InputAdornment position="end">kW</InputAdornment> }} sx={controlSx} />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FieldLabel>Requirement Type</FieldLabel>
                <Select fullWidth size="small" value={formData.solar_requirement} onChange={(e) => handleFormFieldChange("solar_requirement", e.target.value)} sx={controlSx}>
                  {SOLAR_REQUIREMENT_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s} sx={{ fontSize: "0.78rem" }}>{s}</MenuItem>
                  ))}
                </Select>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FieldLabel>Lead Source</FieldLabel>
                <Select fullWidth size="small" value={formData.lead_source} onChange={(e) => handleFormFieldChange("lead_source", e.target.value)} sx={controlSx}>
                  {LEAD_SOURCE_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s} sx={{ fontSize: "0.78rem" }}>{s}</MenuItem>
                  ))}
                </Select>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FieldLabel>Priority Level</FieldLabel>
                <Select fullWidth size="small" value={formData.priority} onChange={(e) => handleFormFieldChange("priority", e.target.value)} sx={controlSx}>
                  {PRIORITY_OPTIONS.map((p) => (
                    <MenuItem key={p} value={p} sx={{ fontSize: "0.78rem" }}>{p}</MenuItem>
                  ))}
                </Select>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FieldLabel>Assign Sales Rep / Manager</FieldLabel>
                <Select fullWidth displayEmpty size="small" value={formData.assigned_to || ""} onChange={(e) => handleFormFieldChange("assigned_to", e.target.value)} sx={controlSx}>
                  <MenuItem value="" sx={{ fontSize: "0.78rem" }}><em>Unassigned</em></MenuItem>
                  {usersList.map((u) => (
                    <MenuItem key={u.id} value={u.id} sx={{ fontSize: "0.78rem" }}>{u.full_name} ({u.role_name || "Staff"})</MenuItem>
                  ))}
                </Select>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FieldLabel>Pipeline Status</FieldLabel>
                <Select fullWidth size="small" value={formData.status} onChange={(e) => handleFormFieldChange("status", e.target.value)} sx={controlSx}>
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s} sx={{ fontSize: "0.78rem" }}>{s}</MenuItem>
                  ))}
                </Select>
              </Grid>

              <Grid item xs={12}>
                <FieldLabel>Remark / Initial Notes</FieldLabel>
                <TextField fullWidth size="small" multiline minRows={2} placeholder="Add any specific requirements..." value={formData.remark} onChange={(e) => handleFormFieldChange("remark", e.target.value)} sx={controlSx} />
              </Grid>
            </Grid>

            <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.04em", pb: 0.5, borderBottom: `1px solid ${COLORS.border}`, mt: 1 }}>
              Client Milestones &amp; Events (Birthdays &amp; Anniversaries)
            </Typography>

            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <FieldLabel>Date of Birth</FieldLabel>
                <TextField fullWidth size="small" type="date" value={formData.dob || ""} onChange={(e) => handleFormFieldChange("dob", e.target.value)} InputLabelProps={{ shrink: true }} sx={dateControlSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldLabel>Wedding / Anniversary Date</FieldLabel>
                <TextField fullWidth size="small" type="date" value={formData.anniversary_date || ""} onChange={(e) => handleFormFieldChange("anniversary_date", e.target.value)} InputLabelProps={{ shrink: true }} sx={dateControlSx} />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${COLORS.border}`, gap: 1 }}>
          <Button variant="outlined" onClick={() => setFormDialogOpen(false)} disabled={saving} sx={outlinedButtonSx}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleFormSubmit} disabled={saving} startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <AddIcon sx={{ fontSize: 16 }} />} sx={primaryButtonSx}>
            {selectedLead ? "Save Changes" : "Create Lead"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: "12px", p: 1, maxWidth: 360 } }}>
        <Box sx={{ p: 2, textAlign: "center" }}>
          <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: COLORS.textPrimary, mb: 1 }}>Delete Lead?</Typography>
          <Typography sx={{ fontSize: "0.8rem", color: COLORS.textSecondary, mb: 2 }}>
            Are you sure you want to delete lead <strong>{activeLead?.customer_name}</strong>?
          </Typography>
          <Stack direction="row" gap={1} justifyContent="center">
            <Button variant="outlined" onClick={() => setDeleteDialogOpen(false)} sx={outlinedButtonSx}>Cancel</Button>
            <Button variant="contained" onClick={handleDeleteConfirm} disabled={deleting} sx={{ ...primaryButtonSx, bgcolor: COLORS.danger, "&:hover": { bgcolor: "#B91C1C" } }}>
              {deleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </Stack>
        </Box>
      </Dialog>

      {/* ================= ALL REMARKS & FOLLOW-UP HISTORY MODAL (LIFO) ================= */}
      <Dialog
        open={remarksModalOpen}
        onClose={() => setRemarksModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "14px",
            overflow: "hidden",
            boxShadow: "0 20px 40px rgba(15,23,42,0.18)",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.5,
            py: 1.8,
            backgroundColor: COLORS.primary,
            color: "#FFFFFF",
          }}
        >
          <Box>
            <Stack direction="row" alignItems="center" gap={1}>
              <NotesIcon sx={{ fontSize: 20, color: "#38BDF8" }} />
              <Typography sx={{ fontWeight: 800, fontSize: "0.98rem", letterSpacing: "0.01em" }}>
                Remarks &amp; Follow-up History
              </Typography>
            </Stack>
            {remarksModalLead && (
              <Typography sx={{ fontSize: "0.72rem", color: "#94A3B8", mt: 0.3 }}>
                Lead: <strong>{remarksModalLead.lead_code || `LE${String(remarksModalLead.id).padStart(5, "0")}`}</strong> — {remarksModalLead.customer_name} ({remarksModalLead.mobile_number})
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={() => setRemarksModalOpen(false)} sx={{ color: "#FFFFFF", opacity: 0.85, "&:hover": { opacity: 1 } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 2.5, maxHeight: "75vh", overflowY: "auto", ...customScrollbarSx, backgroundColor: "#F8FAFC" }}>
          {/* Quick Add New Remark Section */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: "10px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <Typography sx={{ fontSize: "0.76rem", fontWeight: 800, color: COLORS.textPrimary, mb: 1, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              + Add New Follow-up Remark
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              placeholder="Enter new remark, customer conversation notes, or action item..."
              value={newRemarkText}
              onChange={(e) => setNewRemarkText(e.target.value)}
              disabled={newRemarkSaving}
              sx={{
                mb: 1.2,
                "& .MuiOutlinedInput-root": {
                  fontSize: "0.8rem",
                  borderRadius: "8px",
                  backgroundColor: "#FAFBFC",
                  "& fieldset": { borderColor: COLORS.border },
                  "&:hover fieldset": { borderColor: COLORS.borderStrong },
                  "&.Mui-focused fieldset": { borderColor: COLORS.primary },
                },
              }}
            />

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
              <Stack direction="row" alignItems="center" gap={0.8}>
                <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, fontWeight: 600 }}>
                  Mode:
                </Typography>
                <Select
                  size="small"
                  value={newRemarkType}
                  onChange={(e) => setNewRemarkType(e.target.value)}
                  sx={{
                    height: 30,
                    fontSize: "0.74rem",
                    borderRadius: "6px",
                    minWidth: 110,
                    backgroundColor: "#F1F5F9",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.border },
                  }}
                >
                  <MenuItem value="Call" sx={{ fontSize: "0.75rem" }}>📞 Phone Call</MenuItem>
                  <MenuItem value="WhatsApp" sx={{ fontSize: "0.75rem" }}>💬 WhatsApp</MenuItem>
                  <MenuItem value="Meeting" sx={{ fontSize: "0.75rem" }}>🤝 Meeting</MenuItem>
                  <MenuItem value="Site Visit" sx={{ fontSize: "0.75rem" }}>🏡 Site Visit</MenuItem>
                  <MenuItem value="Note" sx={{ fontSize: "0.75rem" }}>📝 Note</MenuItem>
                </Select>
              </Stack>

              <Button
                variant="contained"
                size="small"
                onClick={handleAddRemarkFromModal}
                disabled={!newRemarkText.trim() || newRemarkSaving}
                startIcon={newRemarkSaving ? <CircularProgress size={12} color="inherit" /> : <SendIcon sx={{ fontSize: 13 }} />}
                sx={{
                  backgroundColor: COLORS.primary,
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "0.74rem",
                  textTransform: "none",
                  borderRadius: "6px",
                  px: 2,
                  py: 0.6,
                  "&:hover": { backgroundColor: COLORS.primaryDark },
                }}
              >
                {newRemarkSaving ? "Saving..." : "Save Remark (LIFO)"}
              </Button>
            </Box>
          </Paper>

          {/* Remarks Timeline Header */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Stack direction="row" alignItems="center" gap={0.8}>
              <HistoryIcon sx={{ fontSize: 16, color: COLORS.primary }} />
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: COLORS.textPrimary }}>
                All Remarks Timeline (LIFO - Newest on Top)
              </Typography>
            </Stack>
            <Chip
              label={`${remarksList.length + (remarksModalLead?.initial_remark ? 1 : 0)} entries`}
              size="small"
              sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, backgroundColor: "#E2E8F0", color: COLORS.textPrimary }}
            />
          </Box>

          {/* Remarks List */}
          {remarksLoading ? (
            <Stack spacing={1.5}>
              <Skeleton variant="rounded" height={60} sx={{ borderRadius: "8px" }} />
              <Skeleton variant="rounded" height={60} sx={{ borderRadius: "8px" }} />
              <Skeleton variant="rounded" height={60} sx={{ borderRadius: "8px" }} />
            </Stack>
          ) : remarksList.length === 0 && !remarksModalLead?.initial_remark && !remarksModalLead?.remark ? (
            <Paper elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: "10px", border: `1px dashed ${COLORS.border}`, bgcolor: "#FFFFFF" }}>
              <NotesIcon sx={{ fontSize: 36, color: COLORS.textMuted, mb: 1 }} />
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.textPrimary }}>
                No Remarks Recorded Yet
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted, mt: 0.5 }}>
                Use the box above to record your first conversation note or remark.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {/* LIFO: Newest remarks on top */}
              {remarksList.map((f, idx) => {
                const isLatest = idx === 0;
                return (
                  <Paper
                    key={f.id || idx}
                    elevation={0}
                    sx={{
                      p: 1.6,
                      borderRadius: "10px",
                      backgroundColor: "#FFFFFF",
                      border: `1px solid ${isLatest ? "#93C5FD" : COLORS.border}`,
                      boxShadow: isLatest ? "0 2px 8px rgba(37,99,235,0.08)" : "none",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.8 }}>
                      <Stack direction="row" alignItems="center" gap={0.8} sx={{ flexWrap: "wrap" }}>
                        {isLatest && (
                          <Chip
                            label="Latest"
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: "0.62rem",
                              fontWeight: 800,
                              backgroundColor: "#DCFCE7",
                              color: "#166534",
                              borderRadius: "4px",
                            }}
                          />
                        )}
                        <Chip
                          label={f.followup_type || "Call"}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            backgroundColor: "#EFF6FF",
                            color: "#1E40AF",
                            borderRadius: "4px",
                          }}
                        />
                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textPrimary }}>
                          {f.created_by_name || "Staff"}
                        </Typography>
                      </Stack>

                      <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted, fontWeight: 500 }}>
                        {formatDateTime(f.created_at)}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        color: COLORS.textPrimary,
                        fontWeight: 500,
                        lineHeight: 1.5,
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {f.note}
                    </Typography>
                  </Paper>
                );
              })}

              {/* Initial Registration Remark if available */}
              {(remarksModalLead?.initial_remark || (remarksList.length === 0 && remarksModalLead?.remark)) && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.6,
                    borderRadius: "10px",
                    backgroundColor: "#F1F5F9",
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.6 }}>
                    <Stack direction="row" alignItems="center" gap={0.8}>
                      <Chip
                        label="Initial Lead Note (Day 0)"
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: "0.62rem",
                          fontWeight: 700,
                          backgroundColor: "#E2E8F0",
                          color: COLORS.textSecondary,
                          borderRadius: "4px",
                        }}
                      />
                      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary }}>
                        {remarksModalLead?.created_by_name || "Lead Registration"}
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted }}>
                      {formatDateTime(remarksModalLead?.created_at)}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "0.78rem",
                      color: COLORS.textSecondary,
                      fontWeight: 500,
                      lineHeight: 1.5,
                      wordBreak: "break-word",
                      fontStyle: "italic",
                    }}
                  >
                    {remarksModalLead?.initial_remark || remarksModalLead?.remark}
                  </Typography>
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}`, justifyContent: "space-between", backgroundColor: "#FFFFFF" }}>
          <Stack direction="row" gap={1}>
            {remarksModalLead && (
              <>
                <Button
                  size="small"
                  startIcon={<CallIcon sx={{ fontSize: 14 }} />}
                  onClick={() => handleCall(remarksModalLead.mobile_number)}
                  sx={{ color: COLORS.primary, bgcolor: COLORS.primarySoft, fontWeight: 700, fontSize: "0.74rem" }}
                >
                  Call
                </Button>
                <IconButton
                  size="small"
                  onClick={() => {
                    const l = remarksModalLead;
                    setRemarksModalOpen(false);
                    openWhatsAppDrawer(l);
                  }}
                  sx={{ color: "#16A34A", bgcolor: "#DCFCE7", width: 28, height: 28, borderRadius: "6px" }}
                >
                  <WhatsAppIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </>
            )}
          </Stack>

          <Button
            variant="outlined"
            onClick={() => setRemarksModalOpen(false)}
            sx={outlinedButtonSx}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* SURVEY & WHATSAPP MODALS */}
      {surveyLead && (
        <ScheduleSurveyModal open={scheduleSurveyOpen} onClose={() => setScheduleSurveyOpen(false)} lead={surveyLead} onSurveyScheduled={fetchLeadsList} />
      )}
      {whatsappLead && (
        <WhatsAppDrawer open={whatsappDrawerOpen} onClose={() => setWhatsappDrawerOpen(false)} lead={whatsappLead} />
      )}
      <ImportLeadsDialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} onImportSuccess={fetchLeadsList} showSnackbar={showSnackbar} />

      {/* TOAST SNACKBAR */}
      <Snackbar open={snackbar.open} autoHideDuration={3500} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <MuiAlert onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: "100%", fontWeight: 600, fontSize: "0.8rem" }}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}