import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import usePlanFeatures from "../../hooks/usePlanFeatures";
import * as XLSX from "xlsx";
import {
  Alert as MuiAlert,
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
  Download as DownloadIcon,
  Description as DescriptionIcon,
  GridViewOutlined as GridViewOutlinedIcon,
  ViewListOutlined as ViewListOutlinedIcon,
  TableChartOutlined as TableChartOutlinedIcon,
  History as HistoryIcon,
  Send as SendIcon,
} from "@mui/icons-material";

import { State, City } from "country-state-city";

import {
  getDateWiseFollowups,
  getLeadById,
  createLead,
  updateLead,
  assignLead,
  addFollowup,
  getFollowups,
  deleteLead,
} from "../../services/leadService";

import { getUsers } from "../../services/userServices";
import { getSettings } from "../../services/settingsService";
import { useAuth } from "../../context/AuthContext";
import WhatsAppDrawer from "../../components/WhatsAppDrawer";
import ScheduleSurveyModal from "../../components/ScheduleSurveyModal";

/* ============================================================
   DESIGN TOKENS (MATCHING LEADS.JSX EXACTLY)
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

const SlideTransition = React.forwardRef((props, ref) => (
  <Slide ref={ref} {...props} direction="up" />
));

const customScrollbarSx = {
  "&::-webkit-scrollbar": { width: "6px", height: "6px" },
  "&::-webkit-scrollbar-track": { backgroundColor: "#F1F5F9", borderRadius: "4px" },
  "&::-webkit-scrollbar-thumb": { backgroundColor: "#94A3B8", borderRadius: "4px" },
  "&::-webkit-scrollbar-thumb:hover": { backgroundColor: COLORS.primary },
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
  "&:hover": { backgroundColor: COLORS.primaryDark },
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

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

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

export default function TodayFollowups() {
  const location = useLocation();
  const navigate = useNavigate();

  // State
  const [leads, setLeads] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);

  // View Mode: "box" (Default), "table", "grid"
  const [viewMode, setViewMode] = useState("box");

  // Date Filter: "today" (DEFAULT), "overdue", "upcoming", "date"
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [dateFilterMode, setDateFilterMode] = useState("today");
  const [selectedDate, setSelectedDate] = useState(todayStr); // Defaults to today!
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assignedToFilter, setAssignedToFilter] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Context Menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeLead, setActiveLead] = useState(null);

  // Form Dialog
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [cityOptions, setCityOptions] = useState([]);

  // View Lead Modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewLead, setViewLead] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewFollowups, setViewFollowups] = useState([]);

  // Remarks Modal (LIFO)
  const [remarksModalOpen, setRemarksModalOpen] = useState(false);
  const [remarksModalLead, setRemarksModalLead] = useState(null);
  const [remarksList, setRemarksList] = useState([]);
  const [remarksLoading, setRemarksLoading] = useState(false);
  const [newRemarkText, setNewRemarkText] = useState("");
  const [newRemarkType, setNewRemarkType] = useState("Call");
  const [newRemarkSaving, setNewRemarkSaving] = useState(false);

  // Assign Dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignedToUser, setAssignedToUser] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Log Follow-up Dialog
  const [followupDialogOpen, setFollowupDialogOpen] = useState(false);
  const [followupData, setFollowupData] = useState({
    note: "",
    followup_type: "Call",
    next_follow_up_date: todayStr,
    status_after_followup: "",
  });
  const [followupSaving, setFollowupSaving] = useState(false);

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // WhatsApp Drawer & Survey Modal
  const [whatsappDrawerOpen, setWhatsappDrawerOpen] = useState(false);
  const [whatsappLead, setWhatsappLead] = useState(null);
  const [scheduleSurveyOpen, setScheduleSurveyOpen] = useState(false);
  const [surveyLead, setSurveyLead] = useState(null);

  const indianStates = useMemo(() => State.getStatesOfCountry("IN"), []);

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await getUsers({ limit: 100 });
      if (res?.data?.success) {
        setUsersList(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }, []);

  // Fetch Follow-ups
  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        filter: dateFilterMode,
        date: dateFilterMode === "date" ? selectedDate : undefined,
        search: searchInput.trim() || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        assigned_to: assignedToFilter || undefined,
        page: page + 1,
        limit: rowsPerPage,
      };

      const res = await getDateWiseFollowups(params);
      if (res?.success) {
        setLeads(res.data || []);
        setTotalCount(res.total || 0);
      } else {
        setLeads([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("Fetch followups error:", err);
      showSnackbar("Failed to load today's follow-ups", "error");
      setLeads([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [dateFilterMode, selectedDate, searchInput, statusFilter, priorityFilter, assignedToFilter, page, rowsPerPage, showSnackbar]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchFollowups();
  }, [fetchFollowups]);

  // Quick Remark Handler (LIFO)
  const handleQuickRemarkSubmit = useCallback(async (lead, rawText) => {
    if (!lead || !rawText) return;
    const formattedNote = formatQuickRemark(rawText);

    try {
      await addFollowup(lead.id, {
        note: formattedNote,
        followup_type: "Call",
        next_follow_up_date: todayStr,
      });

      try {
        await updateLead(lead.id, {
          ...lead,
          remark: formattedNote,
          next_follow_up_date: todayStr,
        });
      } catch (e) {}

      showSnackbar(`Remark saved for ${lead.customer_name || "Lead"}`, "success");
      fetchFollowups();
    } catch (err) {
      console.error("Quick remark error:", err);
      showSnackbar("Failed to save remark.", "error");
    }
  }, [fetchFollowups, showSnackbar, todayStr]);

  // All Remarks History Modal Handler
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
      setRemarksList(res?.data || []);
    } catch (err) {
      setRemarksList([]);
    } finally {
      setRemarksLoading(false);
    }
  }, [activeLead]);

  const handleAddRemarkFromModal = useCallback(async () => {
    if (!newRemarkText.trim() || !remarksModalLead || newRemarkSaving) return;
    setNewRemarkSaving(true);
    const formattedNote = formatQuickRemark(newRemarkText.trim());

    try {
      await addFollowup(remarksModalLead.id, {
        note: formattedNote,
        followup_type: newRemarkType || "Call",
        next_follow_up_date: todayStr,
      });
      showSnackbar("New remark added successfully.", "success");
      setNewRemarkText("");
      const res = await getFollowups(remarksModalLead.id);
      setRemarksList(res?.data || []);
      fetchFollowups();
    } catch (err) {
      showSnackbar("Failed to add remark.", "error");
    } finally {
      setNewRemarkSaving(false);
    }
  }, [newRemarkText, remarksModalLead, newRemarkSaving, newRemarkType, showSnackbar, fetchFollowups, todayStr]);

  // Open View Modal
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

  // Open Assign Modal
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
      fetchFollowups();
    } catch (err) {
      showSnackbar("Unable to assign lead.", "error");
    } finally {
      setAssigning(false);
    }
  }, [assignedToUser, activeLead, fetchFollowups, showSnackbar]);

  // Open Follow-up Dialog
  const openFollowupModal = useCallback((lead) => {
    const target = lead || activeLead;
    if (!target) return;
    setActiveLead(target);
    setFollowupData({
      note: "",
      followup_type: "Call",
      next_follow_up_date: todayStr,
      status_after_followup: target.status || "",
    });
    setFollowupDialogOpen(true);
    setAnchorEl(null);
  }, [activeLead, todayStr]);

  const handleFollowupSubmit = useCallback(async () => {
    if (!followupData.note.trim() || !activeLead) return;
    setFollowupSaving(true);
    try {
      await addFollowup(activeLead.id, {
        note: followupData.note,
        followup_type: followupData.followup_type,
        next_follow_up_date: followupData.next_follow_up_date || undefined,
        status_after_followup: followupData.status_after_followup || undefined,
      });
      showSnackbar("Follow-up logged successfully.");
      setFollowupDialogOpen(false);
      fetchFollowups();
    } catch (err) {
      showSnackbar("Unable to save follow-up.", "error");
    } finally {
      setFollowupSaving(false);
    }
  }, [followupData, activeLead, fetchFollowups, showSnackbar]);

  // Delete Handlers
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
      setDeleteDialogOpen(false);
      fetchFollowups();
    } catch (err) {
      showSnackbar("Unable to delete lead.", "error");
    } finally {
      setDeleting(false);
    }
  }, [activeLead, fetchFollowups, showSnackbar]);

  // Lead Form Handlers
  const resetForm = useCallback(() => {
    setSelectedLead(null);
    setFormData(INITIAL_FORM_STATE);
    setFormErrors({});
    const rajState = indianStates.find((s) => s.name === "Rajasthan");
    setCityOptions(rajState ? City.getCitiesOfState("IN", rajState.isoCode) : []);
  }, [indianStates]);

  const openCreateDialog = useCallback(() => {
    resetForm();
    setFormDialogOpen(true);
  }, [resetForm]);

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
    setFormDialogOpen(true);
    setAnchorEl(null);
  }, [indianStates, activeLead]);

  const handleFormFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleFormSubmit = useCallback(async () => {
    if (!formData.customer_name.trim()) {
      setFormErrors({ customer_name: "Customer Name is required" });
      return;
    }
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
      fetchFollowups();
    } catch (err) {
      showSnackbar(err.response?.data?.message || "Unable to save lead.", "error");
    } finally {
      setSaving(false);
    }
  }, [formData, selectedLead, showSnackbar, resetForm, fetchFollowups]);

  const handleCall = useCallback((mobile) => {
    if (!mobile) return;
    window.location.href = `tel:${mobile}`;
  }, []);

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

  const handleMenuOpen = useCallback((event, lead) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setActiveLead(lead);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleResetFilters = useCallback(() => {
    setDateFilterMode("today");
    setSelectedDate(todayStr);
    setSearchInput("");
    setStatusFilter("");
    setPriorityFilter("");
    setAssignedToFilter("");
    setPage(0);
  }, [todayStr]);

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
          <Typography
            onClick={() => navigate("/leads")}
            sx={{ fontSize: "0.75rem", fontWeight: 600, color: COLORS.textMuted, cursor: "pointer", "&:hover": { color: COLORS.primary } }}
          >
            Lead Management
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.primaryDark }}>
            Today's Follow-up
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
              Today's Follow-up Directory
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.75rem", mt: 0.1 }}>
              Date-wise follow-up list, scheduled customer actions &amp; overdue pipeline tracker.
            </Typography>
          </Box>

          <Stack direction="row" alignItems="center" gap={1} sx={{ flexShrink: 0, flexWrap: "wrap" }}>
            {/* View Mode Switcher */}
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
                <Tooltip title="Box List View">
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
            <Tooltip title="Refresh List">
              <IconButton onClick={fetchFollowups} disabled={loading} size="small" sx={iconSquareBtnSx}>
                <RefreshIcon
                  sx={{
                    fontSize: 17,
                    animation: loading ? "spin 0.8s linear infinite" : "none",
                    "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                  }}
                />
              </IconButton>
            </Tooltip>

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

        {/* DATE & ATTRIBUTE FILTERS PANEL */}
        <Paper elevation={0} sx={{ ...cardSx, p: 1.8, mb: 2, width: "100%", boxSizing: "border-box" }}>
          <Stack spacing={1.5}>
            {/* Row 1: Date Filter Selection (Today is DEFAULT) */}
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.2, width: "100%" }}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary, mr: 0.5 }}>
                Filter Period:
              </Typography>

              <ToggleButtonGroup
                value={dateFilterMode}
                exclusive
                onChange={(e, newMode) => {
                  if (newMode) {
                    setDateFilterMode(newMode);
                    if (newMode === "today") setSelectedDate(todayStr);
                    setPage(0);
                  }
                }}
                size="small"
                sx={{
                  height: 32,
                  backgroundColor: "#F1F5F9",
                  borderRadius: "6px",
                  p: 0.2,
                  "& .MuiToggleButton-root": {
                    border: 0,
                    borderRadius: "4px",
                    px: 1.5,
                    py: 0.3,
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    color: COLORS.textSecondary,
                    "&.Mui-selected": {
                      backgroundColor: COLORS.primary,
                      color: "#FFFFFF",
                      fontWeight: 700,
                    },
                  },
                }}
              >
                <ToggleButton value="today">Today</ToggleButton>
                <ToggleButton value="overdue">Overdue</ToggleButton>
                <ToggleButton value="upcoming">Upcoming</ToggleButton>
                <ToggleButton value="not_set">Not Scheduled</ToggleButton>
                <ToggleButton value="all">All Follow-ups</ToggleButton>
              </ToggleButtonGroup>

              {/* Date Input - ALWAYS visible with today's date selected by default */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, ml: { sm: 1 } }}>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textSecondary }}>
                  Follow-up Date:
                </Typography>
                <TextField
                  size="small"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setDateFilterMode("date");
                    setPage(0);
                  }}
                  sx={{
                    ...dateControlSx,
                    width: 155,
                    "& .MuiOutlinedInput-root": { height: 32 },
                  }}
                />
              </Box>

              <Chip
                label={
                  dateFilterMode === "today"
                    ? `Showing: Today (${formatDate(todayStr)})`
                    : dateFilterMode === "overdue"
                    ? "Showing: Overdue Follow-ups"
                    : dateFilterMode === "upcoming"
                    ? "Showing: Upcoming Follow-ups"
                    : dateFilterMode === "not_set"
                    ? "Showing: Unscheduled Leads"
                    : dateFilterMode === "all"
                    ? "Showing: All Open Follow-ups"
                    : `Showing: Date (${formatDate(selectedDate)})`
                }
                size="small"
                sx={{
                  height: 26,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  bgcolor:
                    dateFilterMode === "overdue"
                      ? COLORS.dangerSoft
                      : dateFilterMode === "not_set"
                      ? COLORS.warningSoft
                      : COLORS.primarySoft,
                  color:
                    dateFilterMode === "overdue"
                      ? COLORS.danger
                      : dateFilterMode === "not_set"
                      ? COLORS.warning
                      : COLORS.primary,
                  borderRadius: "4px",
                  ml: { xs: 0, sm: "auto" },
                }}
              />
            </Box>

            <Divider sx={{ borderColor: COLORS.border }} />

            {/* Row 2: Search, Status, Priority, Assigned To */}
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
                  onKeyDown={(e) => e.key === "Enter" && fetchFollowups()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: 16, color: COLORS.textMuted }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={controlSx}
                />
              </Box>

              {/* Status */}
              <Box sx={{ flex: "0 1 150px", minWidth: 130 }}>
                <FieldLabel>Status</FieldLabel>
                <Select
                  fullWidth
                  size="small"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                  displayEmpty
                  sx={controlSx}
                >
                  <MenuItem value="" sx={{ fontSize: "0.78rem" }}>All Statuses</MenuItem>
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s} sx={{ fontSize: "0.78rem" }}>{s}</MenuItem>
                  ))}
                </Select>
              </Box>

              {/* Priority */}
              <Box sx={{ flex: "0 1 120px", minWidth: 110 }}>
                <FieldLabel>Priority</FieldLabel>
                <Select
                  fullWidth
                  size="small"
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value);
                    setPage(0);
                  }}
                  displayEmpty
                  sx={controlSx}
                >
                  <MenuItem value="" sx={{ fontSize: "0.78rem" }}>All</MenuItem>
                  {PRIORITY_OPTIONS.map((p) => (
                    <MenuItem key={p} value={p} sx={{ fontSize: "0.78rem" }}>{p}</MenuItem>
                  ))}
                </Select>
              </Box>

              {/* Assigned Rep */}
              <Box sx={{ flex: "0 1 160px", minWidth: 140 }}>
                <FieldLabel>Assigned To</FieldLabel>
                <Select
                  fullWidth
                  size="small"
                  value={assignedToFilter}
                  onChange={(e) => {
                    setAssignedToFilter(e.target.value);
                    setPage(0);
                  }}
                  displayEmpty
                  sx={controlSx}
                >
                  <MenuItem value="" sx={{ fontSize: "0.78rem" }}>All Staff</MenuItem>
                  {usersList.map((u) => (
                    <MenuItem key={u.id} value={u.id} sx={{ fontSize: "0.78rem" }}>{u.full_name}</MenuItem>
                  ))}
                </Select>
              </Box>

              {/* Reset */}
              <Button
                variant="outlined"
                size="small"
                onClick={handleResetFilters}
                startIcon={<FilterListOffIcon sx={{ fontSize: 15 }} />}
                sx={outlinedButtonSx}
              >
                Reset
              </Button>
            </Box>
          </Stack>
        </Paper>

        {/* LOADING / EMPTY / LEADS CONTENT */}
        {loading ? (
          <Stack spacing={1.5}>
            {[1, 2, 3].map((sk) => (
              <Skeleton key={sk} variant="rounded" height={160} sx={{ borderRadius: "10px" }} />
            ))}
          </Stack>
        ) : leads.length === 0 ? (
          <Paper elevation={0} sx={{ ...cardSx, p: 5, textAlign: "center" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "#F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 1.5,
                color: COLORS.textMuted,
              }}
            >
              <InboxIcon sx={{ fontSize: 28 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
              No Follow-ups Found for {dateFilterMode === "today" ? `Today (${formatDate(todayStr)})` : dateFilterMode === "date" ? formatDate(selectedDate) : dateFilterMode}
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textMuted, maxWidth: 440, mx: "auto", mb: 2 }}>
              There are no leads scheduled under this filter. You can select another date, view all open follow-ups, or create a new lead.
            </Typography>
            <Stack direction="row" spacing={1.5} justifyContent="center">
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setDateFilterMode("all");
                  setPage(0);
                }}
                sx={outlinedButtonSx}
              >
                View All Follow-ups
              </Button>
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreateDialog} sx={primaryButtonSx}>
                Create New Lead
              </Button>
            </Stack>
          </Paper>
        ) : viewMode === "box" ? (
          /* ============================================================
             BOX VIEW (IDENTICAL TO LEADS.JSX)
             ============================================================ */
          <Stack spacing={1.5}>
            {leads.map((row) => (
              <Paper
                key={row.id}
                elevation={0}
                sx={{
                  ...cardSx,
                  p: 2,
                  transition: "all 0.15s ease",
                  "&:hover": {
                    borderColor: COLORS.borderStrong,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  },
                }}
              >
                {/* Header Bar: ID, Name, Actions */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.2 }}>
                  <Stack direction="row" alignItems="center" gap={1.2}>
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

                {/* 3 Column Grid Layout */}
                <Grid container spacing={2}>
                  {/* Column 1 */}
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
                          Lead From: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{row.lead_source || "Website"}</Box>
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <PersonIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                          Assigned To: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{row.assigned_to_name || "Unassigned"}</Box>
                        </Typography>
                      </Box>

                      {/* Remark Container */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                          p: 1.2,
                          borderRadius: "8px",
                          backgroundColor: "#F8FAFC",
                          border: `1px solid ${COLORS.border}`,
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

                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            color: row.latest_remark || row.remark ? COLORS.textPrimary : COLORS.textMuted,
                            fontWeight: 500,
                            lineHeight: 1.45,
                            wordBreak: "break-word",
                            fontStyle: row.latest_remark || row.remark ? "normal" : "italic",
                          }}
                        >
                          {row.latest_remark || row.remark || "No remark logged yet."}
                        </Typography>

                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 0.4, borderTop: `1px dashed ${COLORS.border}`, mt: 0.2 }}>
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
                              "&:hover": { textDecoration: "underline", color: COLORS.primaryDark },
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

                  {/* Column 2 */}
                  <Grid item xs={12} sm={4}>
                    <Stack spacing={0.8}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <CalendarIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                          Created: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{formatDate(row.created_at)}</Box>
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <PhoneIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                          Phone: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{row.mobile_number || "—"}</Box>
                        </Typography>
                      </Box>

                      {row.email && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                          <EmailIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                          <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {row.email}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <LocationIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                          Location: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{[row.city, row.state].filter(Boolean).join(", ") || "—"}</Box>
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                          Priority:
                        </Typography>
                        <PriorityChip priority={row.priority} />
                      </Box>
                    </Stack>
                  </Grid>

                  {/* Column 3 */}
                  <Grid item xs={12} sm={4}>
                    <Stack spacing={0.8}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <SolarIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                          Requirement: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{row.solar_requirement || "Residential"} ({row.required_kw || 1} kW)</Box>
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <SiteVisitIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                          Survey: <Box component="span" sx={{ fontWeight: 600 }}>{row.site_visit_date ? formatDate(row.site_visit_date) : "Not scheduled"}</Box>
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          mt: 1,
                          p: 1.2,
                          borderRadius: "8px",
                          backgroundColor: row.follow_up_status === "OVERDUE" ? COLORS.dangerSoft : row.follow_up_status === "TODAY" ? COLORS.successSoft : "#F8FAFC",
                          border: `1px solid ${row.follow_up_status === "OVERDUE" ? "#FCA5A5" : row.follow_up_status === "TODAY" ? "#86EFAC" : COLORS.border}`,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, display: "block" }}>
                          NEXT FOLLOW-UP DATE
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 800,
                            color: row.follow_up_status === "OVERDUE" ? COLORS.danger : row.follow_up_status === "TODAY" ? COLORS.success : COLORS.textPrimary,
                            fontSize: "0.88rem",
                            mt: 0.2,
                          }}
                        >
                          {row.next_follow_up_date ? formatDate(row.next_follow_up_date) : "None Set"}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
        ) : viewMode === "table" ? (
          /* ============================================================
             TABLE VIEW
             ============================================================ */
          <TableContainer component={Paper} elevation={0} sx={{ ...cardSx, overflow: "hidden" }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: COLORS.primary }}>
                <TableRow>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Lead ID</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Customer Name</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Mobile</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Capacity</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Status</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Assigned To</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Next Follow-up</TableCell>
                  <TableCell align="right" sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.map((row) => (
                  <TableRow key={row.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell sx={{ fontSize: "0.75rem", fontWeight: 700 }}>
                      {row.lead_code || `LE${String(row.id).padStart(5, "0")}`}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.78rem", fontWeight: 600 }}>{row.customer_name}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem" }}>{row.mobile_number}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem" }}>{row.required_kw || 1} kW</TableCell>
                    <TableCell><StatusChip status={row.status} /></TableCell>
                    <TableCell sx={{ fontSize: "0.75rem" }}>{row.assigned_to_name || "Unassigned"}</TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", fontWeight: 700, color: row.follow_up_status === "OVERDUE" ? COLORS.danger : COLORS.textPrimary }}>
                      {formatDate(row.next_follow_up_date)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, row)}>
                        <MoreVertIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          /* ============================================================
             GRID VIEW
             ============================================================ */
          <Grid container spacing={2}>
            {leads.map((row) => (
              <Grid item xs={12} sm={6} md={4} key={row.id}>
                <Paper elevation={0} sx={{ ...cardSx, p: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: COLORS.textPrimary }}>
                        {row.customer_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: COLORS.textMuted }}>
                        {row.lead_code || `LE${String(row.id).padStart(5, "0")}`}
                      </Typography>
                    </Box>
                    <StatusChip status={row.status} />
                  </Box>

                  <Typography sx={{ fontSize: "0.76rem", color: COLORS.textSecondary, mb: 1 }}>
                    {row.mobile_number} · {[row.city, row.state].filter(Boolean).join(", ")}
                  </Typography>

                  <Divider sx={{ my: 1, borderColor: COLORS.border }} />

                  <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>
                    Next Follow-up: <strong>{formatDate(row.next_follow_up_date)}</strong>
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    <Button size="small" variant="contained" fullWidth onClick={() => openFollowupModal(row)} sx={primaryButtonSx}>
                      Log Follow-up
                    </Button>
                    <IconButton size="small" onClick={() => openWhatsAppDrawer(row)} sx={{ border: `1px solid ${COLORS.border}`, borderRadius: "6px" }}>
                      <WhatsAppIcon sx={{ fontSize: 16, color: "#16A34A" }} />
                    </IconButton>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {/* PAGINATION */}
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
          rowsPerPageOptions={[12, 24, 48]}
          sx={{ mt: 2, borderTop: `1px solid ${COLORS.border}` }}
        />

        {/* ACTION CONTEXT MENU */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={() => { handleMenuClose(); openViewModal(activeLead); }} sx={{ fontSize: "0.78rem" }}>
            <ViewIcon sx={{ fontSize: 16, mr: 1, color: COLORS.primary }} /> View Profile
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); openEditDialog(activeLead); }} sx={{ fontSize: "0.78rem" }}>
            <EditIcon sx={{ fontSize: 16, mr: 1, color: COLORS.secondaryDark }} /> Edit Details
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); openFollowupModal(activeLead); }} sx={{ fontSize: "0.78rem" }}>
            <FollowupIcon sx={{ fontSize: 16, mr: 1, color: COLORS.primary }} /> Log Follow-up &amp; Date
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); handleOpenRemarksHistory(activeLead); }} sx={{ fontSize: "0.78rem" }}>
            <HistoryIcon sx={{ fontSize: 16, mr: 1, color: COLORS.purple }} /> View Remarks History
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); openAssignModal(activeLead); }} sx={{ fontSize: "0.78rem" }}>
            <AssignIcon sx={{ fontSize: 16, mr: 1, color: COLORS.primary }} /> Assign Lead
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); openScheduleSurvey(activeLead); }} sx={{ fontSize: "0.78rem" }}>
            <SiteVisitIcon sx={{ fontSize: 16, mr: 1, color: COLORS.warning }} /> Schedule Site Survey
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { handleMenuClose(); openDeleteDialog(activeLead); }} sx={{ fontSize: "0.78rem", color: COLORS.danger }}>
            <DeleteIcon sx={{ fontSize: 16, mr: 1, color: COLORS.danger }} /> Delete Lead
          </MenuItem>
        </Menu>

        {/* ================= VIEW PROFILE MODAL ================= */}
        <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "12px", overflow: "hidden" } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2.5, py: 1.8, backgroundColor: COLORS.primary, color: "#FFFFFF" }}>
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>Lead Details Profile</Typography>
            <IconButton size="small" onClick={() => setViewModalOpen(false)} sx={{ color: "#FFFFFF" }}><CloseIcon fontSize="small" /></IconButton>
          </Box>
          <DialogContent sx={{ p: 2.5 }}>
            {viewLead && (
              <Grid container spacing={1.5}>
                <Grid item xs={6}><FieldLabel>Customer Name</FieldLabel><Typography sx={{ fontSize: "0.85rem", fontWeight: 700 }}>{viewLead.customer_name}</Typography></Grid>
                <Grid item xs={6}><FieldLabel>Mobile</FieldLabel><Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{viewLead.mobile_number}</Typography></Grid>
                <Grid item xs={6}><FieldLabel>Status</FieldLabel><StatusChip status={viewLead.status} /></Grid>
                <Grid item xs={6}><FieldLabel>Location</FieldLabel><Typography sx={{ fontSize: "0.85rem" }}>{[viewLead.city, viewLead.state].filter(Boolean).join(", ") || "—"}</Typography></Grid>
                <Grid item xs={6}><FieldLabel>Assigned To</FieldLabel><Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{viewLead.assigned_to_name || "Unassigned"}</Typography></Grid>
                <Grid item xs={6}><FieldLabel>Next Follow-up</FieldLabel><Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.primary }}>{formatDate(viewLead.next_follow_up_date)}</Typography></Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}` }}>
            <Button variant="outlined" onClick={() => setViewModalOpen(false)} sx={outlinedButtonSx}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* ================= LOG FOLLOW-UP MODAL ================= */}
        <Dialog open={followupDialogOpen} onClose={() => setFollowupDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "12px", overflow: "hidden" } }}>
          <Box sx={{ p: 2, backgroundColor: COLORS.primary, color: "#FFFFFF" }}>
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>Log Follow-up Note &amp; Next Date</Typography>
          </Box>
          <DialogContent sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box>
              <FieldLabel>Follow-up Mode</FieldLabel>
              <Select fullWidth size="small" value={followupData.followup_type} onChange={(e) => setFollowupData((prev) => ({ ...prev, followup_type: e.target.value }))} sx={controlSx}>
                <MenuItem value="Call">Phone Call</MenuItem>
                <MenuItem value="WhatsApp">WhatsApp</MenuItem>
                <MenuItem value="Meeting">Meeting</MenuItem>
                <MenuItem value="Site Visit">Site Visit</MenuItem>
              </Select>
            </Box>
            <Box>
              <FieldLabel>Next Follow-up Date *</FieldLabel>
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
              <TextField fullWidth multiline minRows={2} placeholder="Summary of conversation..." value={followupData.note} onChange={(e) => setFollowupData((prev) => ({ ...prev, note: e.target.value }))} sx={controlSx} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}` }}>
            <Button variant="outlined" onClick={() => setFollowupDialogOpen(false)} sx={outlinedButtonSx}>Cancel</Button>
            <Button variant="contained" onClick={handleFollowupSubmit} disabled={followupSaving || !followupData.note.trim()} sx={primaryButtonSx}>
              {followupSaving ? "Saving..." : "Save Follow-up"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ================= ALL REMARKS MODAL (LIFO) ================= */}
        <Dialog open={remarksModalOpen} onClose={() => setRemarksModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "12px", overflow: "hidden" } }}>
          <Box sx={{ p: 2, backgroundColor: COLORS.primary, color: "#FFFFFF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>
              Remarks History (LIFO) · {remarksModalLead?.customer_name}
            </Typography>
            <IconButton size="small" onClick={() => setRemarksModalOpen(false)} sx={{ color: "#FFFFFF" }}><CloseIcon fontSize="small" /></IconButton>
          </Box>
          <DialogContent sx={{ p: 2.5, maxHeight: "65vh", overflowY: "auto", ...customScrollbarSx }}>
            <Box sx={{ mb: 2, p: 1.5, borderRadius: "8px", bgcolor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
              <TextField fullWidth size="small" multiline rows={2} placeholder="Add new remark..." value={newRemarkText} onChange={(e) => setNewRemarkText(e.target.value)} sx={controlSx} />
              <Button size="small" variant="contained" onClick={handleAddRemarkFromModal} disabled={!newRemarkText.trim() || newRemarkSaving} sx={{ ...primaryButtonSx, mt: 1 }}>
                Save Remark
              </Button>
            </Box>

            {remarksLoading ? (
              <Skeleton variant="rounded" height={100} />
            ) : remarksList.length === 0 ? (
              <Typography sx={{ fontSize: "0.8rem", color: COLORS.textMuted }}>No remarks found.</Typography>
            ) : (
              <Stack spacing={1}>
                {remarksList.map((f, idx) => (
                  <Box key={f.id} sx={{ p: 1.2, borderRadius: "8px", bgcolor: "#F8FAFC", border: `1px solid ${idx === 0 ? "#93C5FD" : COLORS.border}` }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700 }}>{f.created_by_name || "Staff"} · {f.followup_type || "Call"}</Typography>
                      <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted }}>{formatDateTime(f.created_at)}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: "0.78rem" }}>{f.note}</Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}` }}>
            <Button variant="outlined" onClick={() => setRemarksModalOpen(false)} sx={outlinedButtonSx}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* ================= ASSIGN MODAL ================= */}
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
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}` }}>
            <Button variant="outlined" onClick={() => setAssignDialogOpen(false)} sx={outlinedButtonSx}>Cancel</Button>
            <Button variant="contained" onClick={handleAssignSubmit} disabled={assigning} sx={primaryButtonSx}>
              Save Assignment
            </Button>
          </DialogActions>
        </Dialog>

        {/* ================= ADD / EDIT LEAD MODAL ================= */}
        <Dialog open={formDialogOpen} onClose={() => !saving && setFormDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "14px", overflow: "hidden" } }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, backgroundColor: COLORS.primary, color: "#FFFFFF" }}>
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>
              {selectedLead ? "Edit Lead Details" : "Create New Solar Lead"}
            </Typography>
            <IconButton size="small" onClick={() => setFormDialogOpen(false)} sx={{ color: "#FFFFFF" }}><CloseIcon fontSize="small" /></IconButton>
          </Box>
          <DialogContent sx={{ p: 3, maxHeight: "75vh", overflowY: "auto", ...customScrollbarSx }}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <FieldLabel>Customer Name *</FieldLabel>
                <TextField fullWidth size="small" value={formData.customer_name} onChange={(e) => handleFormFieldChange("customer_name", e.target.value)} sx={controlSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldLabel>Mobile Number *</FieldLabel>
                <TextField fullWidth size="small" value={formData.mobile_number} onChange={(e) => handleFormFieldChange("mobile_number", e.target.value.replace(/\D/g, "").slice(0, 10))} sx={controlSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldLabel>Email</FieldLabel>
                <TextField fullWidth size="small" value={formData.email} onChange={(e) => handleFormFieldChange("email", e.target.value)} sx={controlSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldLabel>Required Capacity (kW)</FieldLabel>
                <TextField fullWidth size="small" type="number" value={formData.required_kw} onChange={(e) => handleFormFieldChange("required_kw", e.target.value)} sx={controlSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldLabel>Next Follow-up Date</FieldLabel>
                <TextField fullWidth size="small" type="date" value={formData.next_follow_up_date} onChange={(e) => handleFormFieldChange("next_follow_up_date", e.target.value)} InputLabelProps={{ shrink: true }} sx={dateControlSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldLabel>Date of Birth</FieldLabel>
                <TextField fullWidth size="small" type="date" value={formData.dob} onChange={(e) => handleFormFieldChange("dob", e.target.value)} InputLabelProps={{ shrink: true }} sx={dateControlSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldLabel>Anniversary Date</FieldLabel>
                <TextField fullWidth size="small" type="date" value={formData.anniversary_date} onChange={(e) => handleFormFieldChange("anniversary_date", e.target.value)} InputLabelProps={{ shrink: true }} sx={dateControlSx} />
              </Grid>
              <Grid item xs={12}>
                <FieldLabel>Initial Remark</FieldLabel>
                <TextField fullWidth size="small" multiline minRows={2} value={formData.remark} onChange={(e) => handleFormFieldChange("remark", e.target.value)} sx={controlSx} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${COLORS.border}` }}>
            <Button variant="outlined" onClick={() => setFormDialogOpen(false)} sx={outlinedButtonSx}>Cancel</Button>
            <Button variant="contained" onClick={handleFormSubmit} disabled={saving} sx={primaryButtonSx}>
              {selectedLead ? "Save Changes" : "Create Lead"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ================= DELETE CONFIRMATION MODAL ================= */}
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

        {/* DRAWERS & SURVEY MODALS */}
        {surveyLead && (
          <ScheduleSurveyModal open={scheduleSurveyOpen} onClose={() => setScheduleSurveyOpen(false)} lead={surveyLead} onSurveyScheduled={fetchFollowups} />
        )}
        {whatsappLead && (
          <WhatsAppDrawer open={whatsappDrawerOpen} onClose={() => setWhatsappDrawerOpen(false)} lead={whatsappLead} />
        )}

        {/* TOAST SNACKBAR */}
        <Snackbar open={snackbar.open} autoHideDuration={3500} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <MuiAlert onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: "100%", fontWeight: 600, fontSize: "0.8rem" }}>
            {snackbar.message}
          </MuiAlert>
        </Snackbar>
      </Box>
    </Box>
  );
}
