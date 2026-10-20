import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  MenuItem,
  Divider,
  Snackbar,
  Alert,
  Slide,
  CircularProgress,
  IconButton,
  Avatar,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Select,
  InputLabel,
  FormControl,
  Tooltip,
} from "@mui/material";

// Icons
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CloseIcon from "@mui/icons-material/Close";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ViewKanbanOutlinedIcon from "@mui/icons-material/ViewKanbanOutlined";
import SourceOutlinedIcon from "@mui/icons-material/SourceOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import RolesManagement from "./RolesManagement";

// Services
import { useAuth } from "../../context/AuthContext";
import {
  getSettings,
  updateSettings,
  uploadCompanyLogo,
} from "../../services/settingsService";
import {
  getLeadSources,
  createLeadSource,
  updateLeadSource,
  deleteLeadSource,
  getPipelineStatuses,
  createPipelineStatus,
  updatePipelineStatus,
  deletePipelineStatus,
  reorderPipelineStatuses,
} from "../../services/leadConfigService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
  "";

const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  accent: "#2563EB",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#D97706",
  info: "#0284C7",
};

const SlideTransition = React.forwardRef(function SlideTransition(props, ref) {
  return <Slide ref={ref} {...props} direction="left" />;
});

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
    height: "38px",
    fontSize: "0.85rem",
    "& fieldset": { borderColor: COLORS.border },
    "&:hover fieldset": { borderColor: "#94A3B8" },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary, borderWidth: "1.5px" },
  },
  "& .MuiInputLabel-root": { fontSize: "0.8rem", top: "-2px" },
  "& .MuiInputLabel-root.Mui-focused": { color: COLORS.primary },
};

const cardSx = {
  p: { xs: 2, md: 2.5 },
  borderRadius: "14px",
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.card,
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
};

const sectionTitleSx = {
  fontWeight: 700,
  color: COLORS.primaryDark,
  fontSize: "1rem",
  letterSpacing: "-0.2px",
};

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const { user: authUser, token } = useAuth();

  // Custom Fields State
  const [customFields, setCustomFields] = useState([]);
  const [cfLoading, setCfLoading] = useState(false);
  const [cfForm, setCfForm] = useState({ field_name: "", field_type: "text", is_required: 0, options: "" });
  const [cfDialog, setCfDialog] = useState(false);
  const [cfEditId, setCfEditId] = useState(null);

  // Dynamic Lead Sources & Pipeline Statuses State
  const [leadSourcesList, setLeadSourcesList] = useState([]);
  const [pipelineStatusesList, setPipelineStatusesList] = useState([]);
  const [configLoading, setConfigLoading] = useState(false);

  // Source Dialog
  const [sourceDialog, setSourceDialog] = useState(false);
  const [sourceEditing, setSourceEditing] = useState(null);
  const [sourceNameInput, setSourceNameInput] = useState("");

  // Status Dialog
  const [statusDialog, setStatusDialog] = useState(false);
  const [statusEditing, setStatusEditing] = useState(null);
  const [statusForm, setStatusForm] = useState({
    name: "",
    color_code: "#2563EB",
    is_won: 0,
    is_lost: 0,
  });

  const fetchCustomFields = async () => {
    try {
      setCfLoading(true);
      const res = await fetch("/api/custom-fields", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setCustomFields(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setCfLoading(false);
    }
  };

  const saveCustomField = async () => {
    try {
      const payload = {
        field_name: cfForm.field_name,
        field_type: cfForm.field_type,
        is_required: cfForm.is_required,
        options: cfForm.field_type === "dropdown" && cfForm.options
          ? cfForm.options.split(",").map(o => o.trim())
          : null,
      };
      const url = cfEditId ? `/api/custom-fields/${cfEditId}` : "/api/custom-fields";
      const method = cfEditId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        fetchCustomFields();
        setCfDialog(false);
        setCfForm({ field_name: "", field_type: "text", is_required: 0, options: "" });
        setCfEditId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteCustomField = async (id) => {
    try {
      await fetch(`/api/custom-fields/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCustomFields();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeadConfig = async () => {
    try {
      setConfigLoading(true);
      const [sourcesRes, statusesRes] = await Promise.all([
        getLeadSources(true),
        getPipelineStatuses(true),
      ]);
      if (sourcesRes.success) setLeadSourcesList(sourcesRes.data || []);
      if (statusesRes.success) setPipelineStatusesList(statusesRes.data || []);
    } catch (e) {
      console.error(e);
      showNotification("Failed to load lead configuration", "error");
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 5) fetchCustomFields();
    if (activeTab === 6 || activeTab === 7) fetchLeadConfig();
  }, [activeTab]);

  // Source Actions
  const handleOpenSourceDialog = (src = null) => {
    if (src) {
      setSourceEditing(src);
      setSourceNameInput(src.name);
    } else {
      setSourceEditing(null);
      setSourceNameInput("");
    }
    setSourceDialog(true);
  };

  const handleSaveSource = async () => {
    if (!sourceNameInput.trim()) return;
    try {
      if (sourceEditing) {
        const res = await updateLeadSource(sourceEditing.id, { name: sourceNameInput.trim() });
        if (res.success) showNotification("Lead source updated successfully");
      } else {
        const res = await createLeadSource(sourceNameInput.trim());
        if (res.success) showNotification("Lead source created successfully");
      }
      setSourceDialog(false);
      fetchLeadConfig();
    } catch (e) {
      showNotification(e.response?.data?.message || "Error saving lead source", "error");
    }
  };

  const handleToggleSourceActive = async (src) => {
    try {
      const res = await updateLeadSource(src.id, { is_active: src.is_active ? 0 : 1 });
      if (res.success) {
        showNotification(src.is_active ? "Lead source deactivated" : "Lead source activated");
        fetchLeadConfig();
      }
    } catch (e) {
      showNotification("Failed to toggle source status", "error");
    }
  };

  const handleDeleteSource = async (src) => {
    if (!window.confirm(`Are you sure you want to delete / deactivate "${src.name}"?`)) return;
    try {
      const res = await deleteLeadSource(src.id);
      if (res.success) {
        showNotification(res.message || "Source deleted");
        fetchLeadConfig();
      }
    } catch (e) {
      showNotification(e.response?.data?.message || "Failed to delete source", "error");
    }
  };

  // Pipeline Status Actions
  const handleOpenStatusDialog = (st = null) => {
    if (st) {
      setStatusEditing(st);
      setStatusForm({
        name: st.name,
        color_code: st.color_code || "#2563EB",
        is_won: st.is_won ? 1 : 0,
        is_lost: st.is_lost ? 1 : 0,
      });
    } else {
      setStatusEditing(null);
      setStatusForm({
        name: "",
        color_code: "#2563EB",
        is_won: 0,
        is_lost: 0,
      });
    }
    setStatusDialog(true);
  };

  const handleSaveStatus = async () => {
    if (!statusForm.name.trim()) return;
    try {
      if (statusEditing) {
        const res = await updatePipelineStatus(statusEditing.id, statusForm);
        if (res.success) showNotification("Pipeline stage updated successfully");
      } else {
        const res = await createPipelineStatus(statusForm);
        if (res.success) showNotification("Pipeline stage created successfully");
      }
      setStatusDialog(false);
      fetchLeadConfig();
    } catch (e) {
      showNotification(e.response?.data?.message || "Error saving pipeline stage", "error");
    }
  };

  const handleToggleStatusActive = async (st) => {
    try {
      const res = await updatePipelineStatus(st.id, { is_active: st.is_active ? 0 : 1 });
      if (res.success) {
        showNotification(st.is_active ? "Stage deactivated" : "Stage activated");
        fetchLeadConfig();
      }
    } catch (e) {
      showNotification("Failed to toggle stage status", "error");
    }
  };

  const handleDeleteStatus = async (st) => {
    if (!window.confirm(`Are you sure you want to delete / deactivate stage "${st.name}"?`)) return;
    try {
      const res = await deletePipelineStatus(st.id);
      if (res.success) {
        showNotification(res.message || "Stage deleted");
        fetchLeadConfig();
      }
    } catch (e) {
      showNotification(e.response?.data?.message || "Failed to delete stage", "error");
    }
  };

  const handleMoveStatus = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= pipelineStatusesList.length) return;
    const newList = [...pipelineStatusesList];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;
    setPipelineStatusesList(newList);

    try {
      const orderList = newList.map((item, idx) => ({ id: item.id, stage_order: idx + 1 }));
      await reorderPipelineStatuses(orderList);
      showNotification("Pipeline order updated");
    } catch (e) {
      console.error(e);
      fetchLeadConfig();
    }
  };

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Settings State Schema
  const [settings, setSettings] = useState({
    company_name: "",
    company_logo: "",
    quotation_template: "template1",
    company_email: "",
    company_phone: "",
    website: "",

    gst_number: "",
    pan_number: "",

    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",

    bank_name: "",
    account_name: "",
    account_number: "",
    ifsc_code: "",
    branch_name: "",
    upi_id: "",

    currency: "INR",
    timezone: "Asia/Kolkata",
    date_format: "DD/MM/YYYY",

    smtp_host: "",
    smtp_port: "",
    smtp_username: "",
    smtp_password: "",
    smtp_encryption: "TLS",

    session_timeout: 30,
    password_expiry_days: 90,
    otp_length: 4,

    enable_2fa: false,
    strong_password: true,

    email_notifications: true,
    lead_notifications: true,
    weekly_reports: false,
    system_notifications: true,

    backup_frequency: "Daily",
    backup_retention_days: 30,
  });

  // Toast System
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showNotification = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Fetch Settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await getSettings();
      const data = res?.data?.data || res?.data || {};

      setSettings((prev) => ({
        ...prev,
        ...data,
        enable_2fa: Boolean(data.enable_2fa),
        strong_password: Boolean(data.strong_password),
        email_notifications: Boolean(data.email_notifications),
        lead_notifications: Boolean(data.lead_notifications),
        weekly_reports: Boolean(data.weekly_reports),
        system_notifications: Boolean(data.system_notifications),
      }));
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to load system settings.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSettings(settings);
      showNotification("Settings updated successfully!", "success");
      await fetchSettings();
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to update settings.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.match(/^image\/(jpeg|png|jpg|webp)$/)) {
        showNotification("Allowed logo formats: JPG, JPEG, PNG, WEBP", "warning");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        showNotification("Logo file size must be under 2MB", "warning");
        return;
      }

      const formData = new FormData();
      formData.append("company_logo", file);

      setUploadingLogo(true);
      const uploadRes = await uploadCompanyLogo(formData);
      showNotification("Company logo uploaded successfully!", "success");
      if (uploadRes?.data?.logo) {
        setSettings((prev) => ({ ...prev, company_logo: uploadRes.data.logo }));
      }
      setLogoTimestamp(Date.now());
      await fetchSettings();
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to upload company logo.",
        "error"
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  const [logoTimestamp, setLogoTimestamp] = useState(Date.now());

  const getCleanLogoUrl = (rawLogo) => {
    if (!rawLogo) return null;
    if (rawLogo.startsWith("http://") || rawLogo.startsWith("https://")) return rawLogo;
    const cleanFile = rawLogo.replace(/^.*[\\/]/, "");
    return `${API_BASE_URL}/uploads/company/${cleanFile}?v=${logoTimestamp}`;
  };

  const logoUrl = getCleanLogoUrl(settings.company_logo);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
        <CircularProgress sx={{ color: COLORS.primary }} size={38} thickness={4} />
      </Box>
    );
  }

  // Windows 11 Fluent Sidebar Navigation Items
  const NAV_ITEMS = [
    { id: 0, label: "General & Company", desc: "Company branding, GST, Bank & Organization", icon: <BusinessOutlinedIcon sx={{ fontSize: "1.1rem" }} /> },
    { id: 9, label: "Roles & Permissions", desc: "Custom roles, dynamic features & access control", icon: <ShieldOutlinedIcon sx={{ fontSize: "1.1rem" }} /> },
    { id: 7, label: "Pipeline Stages", desc: "Customize sales pipeline stages, colors & workflow", icon: <ViewKanbanOutlinedIcon sx={{ fontSize: "1.1rem" }} /> },
    { id: 6, label: "Lead Sources", desc: "Configure customer acquisition sources & channels", icon: <SourceOutlinedIcon sx={{ fontSize: "1.1rem" }} /> },
    { id: 5, label: "Custom Fields", desc: "Add custom metadata fields to lead forms", icon: <TuneOutlinedIcon sx={{ fontSize: "1.1rem" }} /> },
    { id: 1, label: "SMTP & Email", desc: "Mail server, TLS ports & notification sender", icon: <EmailOutlinedIcon sx={{ fontSize: "1.1rem" }} /> },
    { id: 8, label: "My Profile", desc: "Personal info, profile photo & security password", icon: <AccountCircleOutlinedIcon sx={{ fontSize: "1.1rem" }} />, path: "/profile" },
  ];

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.label.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q);
  });

  return (
    <Box sx={{ width: "100%", backgroundColor: "#F8FAFC", minHeight: "100vh", p: { xs: 1.5, md: 2.5 } }}>
      <Box sx={{ width: "100%", mx: "auto" }}>

        {/* TOP WINDOWS 11 STYLE APP BAR */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2.5,
            px: 0.5,
          }}
        >
          {/* LEFT: TITLE & BREADCRUMB */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "8px",
                backgroundColor: "#0F172A",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SettingsOutlinedIcon sx={{ fontSize: 19 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", color: "#0F172A", lineHeight: 1.2, letterSpacing: "-0.3px" }}>
                Settings
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.75rem" }}>
                System configuration, company profile & sales pipeline
              </Typography>
            </Box>
          </Box>

          {/* RIGHT: SEARCH FILTER INPUT */}
          <Box sx={{ width: { xs: 200, sm: 320, md: 360 } }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Find a setting..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: "#94A3B8", fontSize: "1.1rem", mr: 1 }} />,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  backgroundColor: "#FFFFFF",
                  height: 36,
                  fontSize: "0.825rem",
                  "& fieldset": { borderColor: "#E2E8F0" },
                  "&:hover fieldset": { borderColor: "#CBD5E1" },
                  "&.Mui-focused fieldset": { borderColor: "#0F172A", borderWidth: "1.5px" },
                },
              }}
            />
          </Box>
        </Box>

        {/* MAIN LAYOUT: SIDEBAR + CONTENT AREA */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2.5, alignItems: "flex-start", width: "100%" }}>
          {/* SIDEBAR NAVIGATION (WINDOWS 11 STYLE) */}
          <Box sx={{ width: { xs: "100%", md: 320 }, flexShrink: 0 }}>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: "14px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
                position: { md: "sticky" },
                top: { md: 16 },
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
              }}
            >
              {/* USER PROFILE MINI CARD */}
              <Box
                onClick={() => navigate("/profile")}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.25,
                  mb: 1.5,
                  borderRadius: "10px",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #F1F5F9",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    backgroundColor: "#F1F5F9",
                    borderColor: "#CBD5E1",
                  },
                }}
              >
                <Avatar
                  src={logoUrl || undefined}
                  sx={{
                    width: 42,
                    height: 42,
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    borderRadius: "10px",
                    "& .MuiAvatar-img": {
                      objectFit: "contain",
                      p: 0.3,
                    },
                  }}
                >
                  {(authUser?.name || settings.company_name || "A").substring(0, 2).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.86rem", color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {authUser?.name || settings.company_name || "Client Admin"}
                    </Typography>
                    <Chip label="Profile" size="small" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, backgroundColor: "#E2E8F0", color: "#475569" }} />
                  </Box>
                  <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.72rem", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {authUser?.email || settings.company_email || "admin@solarcrm.com"}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 1.25, borderColor: "#F1F5F9" }} />

              {/* NAV ITEMS LIST */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {filteredNavItems.map((item) => {
                  const isSelected = activeTab === item.id;
                  const isExternal = Boolean(item.path);

                  const handleClick = () => {
                    if (item.path) {
                      navigate(item.path);
                    } else {
                      setActiveTab(item.id);
                    }
                  };

                  return (
                    <Box
                      key={item.id}
                      onClick={handleClick}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        py: 1.1,
                        px: 1.25,
                        borderRadius: "10px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        backgroundColor: isSelected ? "#0F172A" : "transparent",
                        color: isSelected ? "#FFFFFF" : "#334155",
                        "&:hover": {
                          backgroundColor: isSelected ? "#0F172A" : "#F1F5F9",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: isSelected ? "#38BDF8" : isExternal ? "#2563EB" : "#64748B",
                          }}
                        >
                          {item.icon}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontWeight: isSelected ? 700 : 600,
                              fontSize: "0.83rem",
                              color: isSelected ? "#FFFFFF" : "#0F172A",
                              lineHeight: 1.2,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item.label}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: isSelected ? "#94A3B8" : "#64748B",
                              fontSize: "0.68rem",
                              display: "block",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: 190,
                            }}
                          >
                            {item.desc}
                          </Typography>
                        </Box>
                      </Box>
                      {isExternal ? (
                        <OpenInNewOutlinedIcon sx={{ fontSize: 15, color: "#94A3B8" }} />
                      ) : (
                        <ChevronRightIcon sx={{ fontSize: 16, color: isSelected ? "#FFFFFF" : "#94A3B8" }} />
                      )}
                    </Box>
                  );
                })}

                {filteredNavItems.length === 0 && (
                  <Box sx={{ textAlign: "center", py: 3 }}>
                    <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.8rem" }}>
                      No settings matched "{searchQuery}"
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>

          {/* MAIN CONTENT RIGHT PANEL */}
          <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>

            {/* TAB 0: GENERAL & COMPANY SETTINGS */}
            {activeTab === 0 && (
              <Paper elevation={0} sx={cardSx}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Typography sx={sectionTitleSx}>Company Details & Branding</Typography>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={14} sx={{ color: "#FFF" }} /> : <SaveOutlinedIcon />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{
                      height: 36,
                      borderRadius: "8px",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.825rem",
                      px: 2.5,
                      backgroundColor: COLORS.primary,
                      "&:hover": { backgroundColor: COLORS.primaryDark },
                    }}
                  >
                    Save Settings
                  </Button>
                </Box>
                <Divider sx={{ mb: 2, borderColor: "#F1F5F9" }} />

                {/* Company Logo Upload Box */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 3, p: 2, backgroundColor: "#F8FAFC", borderRadius: "10px", border: `1px solid ${COLORS.border}` }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    badgeContent={
                      <IconButton
                        component="label"
                        disabled={uploadingLogo}
                        sx={{
                          backgroundColor: COLORS.primary,
                          color: "#FFFFFF",
                          width: 28,
                          height: 28,
                          "&:hover": { backgroundColor: COLORS.primaryDark },
                        }}
                      >
                        {uploadingLogo ? <CircularProgress size={14} sx={{ color: "#FFF" }} /> : <PhotoCameraOutlinedIcon sx={{ fontSize: "0.9rem" }} />}
                        <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                      </IconButton>
                    }
                  >
                    <Avatar
                      src={logoUrl || undefined}
                      variant="rounded"
                      imgProps={{
                        onError: (e) => {
                          console.error("Logo failed to load:", e.target.src);
                        },
                      }}
                      sx={{
                        width: 68,
                        height: 68,
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        fontWeight: 700,
                        borderRadius: "12px",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        "& .MuiAvatar-img": {
                          objectFit: "contain",
                          p: 0.5,
                        },
                      }}
                    >
                      {settings.company_name ? settings.company_name.substring(0, 2).toUpperCase() : "CRM"}
                    </Avatar>
                  </Badge>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
                      Company Logo
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                      Upload JPEG, PNG, or WEBP logo (Max 2MB). Used across invoices & portal header.
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Company Name"
                      name="company_name"
                      value={settings.company_name}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Company Email"
                      name="company_email"
                      value={settings.company_email}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Company Phone"
                      name="company_phone"
                      value={settings.company_phone}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Official Website"
                      name="website"
                      value={settings.website}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>
                </Grid>

                <Typography sx={{ ...sectionTitleSx, mt: 3, mb: 1 }}>Statutory & Tax Details</Typography>
                <Divider sx={{ mb: 2, borderColor: "#F1F5F9" }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="GST Number"
                      name="gst_number"
                      value={settings.gst_number}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="PAN Number"
                      name="pan_number"
                      value={settings.pan_number}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>
                </Grid>

                <Typography sx={{ ...sectionTitleSx, mt: 3, mb: 1 }}>Company Address</Typography>
                <Divider sx={{ mb: 2, borderColor: "#F1F5F9" }} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Registered Address"
                      name="address"
                      value={settings.address}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="City"
                      name="city"
                      value={settings.city}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="State"
                      name="state"
                      value={settings.state}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Country"
                      name="country"
                      value={settings.country}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Pincode"
                      name="pincode"
                      value={settings.pincode}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>
                </Grid>

                <Typography sx={{ ...sectionTitleSx, mt: 3, mb: 1 }}>Banking & Settlement Details</Typography>
                <Divider sx={{ mb: 2, borderColor: "#F1F5F9" }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Bank Name"
                      name="bank_name"
                      value={settings.bank_name}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Account Holder Name"
                      name="account_name"
                      value={settings.account_name}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Account Number"
                      name="account_number"
                      value={settings.account_number}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="IFSC Code"
                      name="ifsc_code"
                      value={settings.ifsc_code}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Branch Name"
                      name="branch_name"
                      value={settings.branch_name}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="UPI ID / VPA"
                      name="upi_id"
                      value={settings.upi_id}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>
                </Grid>

                <Typography sx={{ ...sectionTitleSx, mt: 3, mb: 1 }}>Localization & Quotation Layout</Typography>
                <Divider sx={{ mb: 2, borderColor: "#F1F5F9" }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      select
                      fullWidth
                      label="Base Currency"
                      name="currency"
                      value={settings.currency}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    >
                      <MenuItem value="INR">₹ INR (Indian Rupee)</MenuItem>
                      <MenuItem value="USD">$ USD (US Dollar)</MenuItem>
                      <MenuItem value="EUR">€ EUR (Euro)</MenuItem>
                      <MenuItem value="AED">AED (UAE Dirham)</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      select
                      fullWidth
                      label="Timezone"
                      name="timezone"
                      value={settings.timezone}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    >
                      <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</MenuItem>
                      <MenuItem value="Asia/Dubai">Asia/Dubai (GST +4:00)</MenuItem>
                      <MenuItem value="UTC">UTC (Universal Coordinated Time)</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      select
                      fullWidth
                      label="Quotation PDF Template"
                      name="quotation_template"
                      value={settings.quotation_template || "template1"}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    >
                      <MenuItem value="template1">Modern Corporate (Template 1)</MenuItem>
                      <MenuItem value="template2">Minimal Clean (Template 2)</MenuItem>
                      <MenuItem value="template3">Detailed Technical (Template 3)</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* TAB 1: SMTP & EMAIL CONFIGURATION */}
            {activeTab === 1 && (
              <Paper elevation={0} sx={cardSx}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Typography sx={sectionTitleSx}>SMTP Email Server Configuration</Typography>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={14} sx={{ color: "#FFF" }} /> : <SaveOutlinedIcon />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{
                      height: 36,
                      borderRadius: "8px",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.825rem",
                      px: 2.5,
                      backgroundColor: COLORS.primary,
                      "&:hover": { backgroundColor: COLORS.primaryDark },
                    }}
                  >
                    Save SMTP Settings
                  </Button>
                </Box>
                <Divider sx={{ mb: 2, borderColor: "#F1F5F9" }} />

                <Alert severity="info" sx={{ mb: 3, borderRadius: "8px", fontSize: "0.8rem" }}>
                  Configure your SMTP credentials to send client proposals, notification alerts, and automated email receipts directly from your corporate mailbox.
                </Alert>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      label="SMTP Server / Host"
                      name="smtp_host"
                      value={settings.smtp_host}
                      onChange={handleChange}
                      placeholder="e.g. smtp.gmail.com or mail.yourdomain.com"
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="SMTP Port"
                      name="smtp_port"
                      value={settings.smtp_port}
                      onChange={handleChange}
                      placeholder="e.g. 587 or 465"
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Sender Email / Username"
                      name="smtp_username"
                      value={settings.smtp_username}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="password"
                      label="SMTP Password / App Key"
                      name="smtp_password"
                      value={settings.smtp_password}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Encryption Mode"
                      name="smtp_encryption"
                      value={settings.smtp_encryption || "TLS"}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    >
                      <MenuItem value="TLS">TLS (Recommended - Port 587)</MenuItem>
                      <MenuItem value="SSL">SSL (Port 465)</MenuItem>
                      <MenuItem value="NONE">None (Port 25)</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* TAB 2: SECURITY & AUTHENTICATION */}
            {activeTab === 2 && (
              <Paper elevation={0} sx={cardSx}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Typography sx={sectionTitleSx}>Security Policies & Authentication</Typography>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={14} sx={{ color: "#FFF" }} /> : <SaveOutlinedIcon />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{
                      height: 36,
                      borderRadius: "8px",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.825rem",
                      px: 2.5,
                      backgroundColor: COLORS.primary,
                      "&:hover": { backgroundColor: COLORS.primaryDark },
                    }}
                  >
                    Save Security Rules
                  </Button>
                </Box>
                <Divider sx={{ mb: 2, borderColor: "#F1F5F9" }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Session Inactivity Timeout (Minutes)"
                      name="session_timeout"
                      value={settings.session_timeout}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Password Expiry (Days)"
                      name="password_expiry_days"
                      value={settings.password_expiry_days}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, border: `1px solid ${COLORS.border}`, borderRadius: "10px", backgroundColor: "#F8FAFC" }}>
                      <FormControlLabel
                        control={<Switch checked={Boolean(settings.enable_2fa)} onChange={handleChange} name="enable_2fa" />}
                        label={<Typography sx={{ fontWeight: 600, fontSize: "0.85rem" }}>Enforce Two-Factor Authentication (2FA)</Typography>}
                      />
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block", mt: 0.5 }}>
                        Requires team members to verify an OTP code sent via email upon login.
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, border: `1px solid ${COLORS.border}`, borderRadius: "10px", backgroundColor: "#F8FAFC" }}>
                      <FormControlLabel
                        control={<Switch checked={Boolean(settings.strong_password)} onChange={handleChange} name="strong_password" />}
                        label={<Typography sx={{ fontWeight: 600, fontSize: "0.85rem" }}>Enforce Strict Password Policy</Typography>}
                      />
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block", mt: 0.5 }}>
                        Requires passwords with minimum 8 characters, special symbols, and capital letters.
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* TAB 3: NOTIFICATIONS */}
            {activeTab === 3 && (
              <Paper elevation={0} sx={cardSx}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Typography sx={sectionTitleSx}>System & Lead Notifications</Typography>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={14} sx={{ color: "#FFF" }} /> : <SaveOutlinedIcon />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{
                      height: 36,
                      borderRadius: "8px",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.825rem",
                      px: 2.5,
                      backgroundColor: COLORS.primary,
                      "&:hover": { backgroundColor: COLORS.primaryDark },
                    }}
                  >
                    Save Preferences
                  </Button>
                </Box>
                <Divider sx={{ mb: 2, borderColor: "#F1F5F9" }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, border: `1px solid ${COLORS.border}`, borderRadius: "10px", backgroundColor: "#F8FAFC" }}>
                      <FormControlLabel
                        control={<Switch checked={Boolean(settings.lead_notifications)} onChange={handleChange} name="lead_notifications" />}
                        label={<Typography sx={{ fontWeight: 600, fontSize: "0.85rem" }}>Instant Lead Assignment Alerts</Typography>}
                      />
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block", mt: 0.5 }}>
                        Send immediate notification to sales reps when a new lead is assigned to them.
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, border: `1px solid ${COLORS.border}`, borderRadius: "10px", backgroundColor: "#F8FAFC" }}>
                      <FormControlLabel
                        control={<Switch checked={Boolean(settings.email_notifications)} onChange={handleChange} name="email_notifications" />}
                        label={<Typography sx={{ fontWeight: 600, fontSize: "0.85rem" }}>Email Transaction Reports</Typography>}
                      />
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block", mt: 0.5 }}>
                        Send email confirmations when invoices and payment receipts are logged.
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, border: `1px solid ${COLORS.border}`, borderRadius: "10px", backgroundColor: "#F8FAFC" }}>
                      <FormControlLabel
                        control={<Switch checked={Boolean(settings.weekly_reports)} onChange={handleChange} name="weekly_reports" />}
                        label={<Typography sx={{ fontWeight: 600, fontSize: "0.85rem" }}>Weekly Pipeline Summary Digest</Typography>}
                      />
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block", mt: 0.5 }}>
                        Weekly analytical digest of won contracts, revenue, and active stages delivered to admins.
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, border: `1px solid ${COLORS.border}`, borderRadius: "10px", backgroundColor: "#F8FAFC" }}>
                      <FormControlLabel
                        control={<Switch checked={Boolean(settings.system_notifications)} onChange={handleChange} name="system_notifications" />}
                        label={<Typography sx={{ fontWeight: 600, fontSize: "0.85rem" }}>In-App Push Bell Notifications</Typography>}
                      />
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block", mt: 0.5 }}>
                        Show bell alerts for follow-up reminders, task deadlines, and quote visits.
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* TAB 4: BACKUP & STORAGE */}
            {activeTab === 4 && (
              <Paper elevation={0} sx={cardSx}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Typography sx={sectionTitleSx}>Database Backup & Snapshot Schedules</Typography>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={14} sx={{ color: "#FFF" }} /> : <SaveOutlinedIcon />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{
                      height: 36,
                      borderRadius: "8px",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.825rem",
                      px: 2.5,
                      backgroundColor: COLORS.primary,
                      "&:hover": { backgroundColor: COLORS.primaryDark },
                    }}
                  >
                    Save Backup Policy
                  </Button>
                </Box>
                <Divider sx={{ mb: 2, borderColor: "#F1F5F9" }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Automated Snapshot Frequency"
                      name="backup_frequency"
                      value={settings.backup_frequency || "Daily"}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    >
                      <MenuItem value="Daily">Daily (Every night at 02:00 AM IST)</MenuItem>
                      <MenuItem value="Weekly">Weekly (Every Sunday)</MenuItem>
                      <MenuItem value="Monthly">Monthly</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Snapshot Retention (Days)"
                      name="backup_retention_days"
                      value={settings.backup_retention_days}
                      onChange={handleChange}
                      size="small"
                      sx={fieldSx}
                    />
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* TAB 5: CUSTOM FIELDS */}
            {activeTab === 5 && (
              <Paper elevation={0} sx={cardSx}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Box>
                    <Typography sx={sectionTitleSx}>Custom Lead Form Fields</Typography>
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                      Define custom properties and metadata fields captured across lead entries.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<AddOutlinedIcon sx={{ fontSize: "1.1rem" }} />}
                    onClick={() => { setCfDialog(true); setCfEditId(null); setCfForm({ field_name: "", field_type: "text", is_required: 0, options: "" }); }}
                    sx={{
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.86rem",
                      backgroundColor: COLORS.primary,
                      height: 38,
                      px: 2.5,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      boxShadow: "none",
                      "&:hover": { backgroundColor: COLORS.primaryDark, boxShadow: "none" },
                    }}
                  >
                    Add Custom Field
                  </Button>
                </Box>
                <Divider sx={{ mb: 2, borderColor: "#F1F5F9" }} />

                {cfLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress size={28} />
                  </Box>
                ) : customFields.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <TuneOutlinedIcon sx={{ fontSize: 40, color: "#CBD5E1", mb: 1 }} />
                    <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>No custom fields configured yet.</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {customFields.map((field) => (
                      <Box key={field.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5, borderRadius: "10px", border: `1px solid ${COLORS.border}`, backgroundColor: "#FFFFFF" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>{field.field_name}</Typography>
                            <Box sx={{ display: "flex", gap: 0.8, mt: 0.4 }}>
                              <Chip label={field.field_type} size="small" sx={{ fontSize: "0.68rem", height: 20, backgroundColor: "#EFF6FF", color: COLORS.primary }} />
                              {field.is_required ? <Chip label="Required" size="small" sx={{ fontSize: "0.68rem", height: 20, backgroundColor: "#FEF2F2", color: "#DC2626" }} /> : null}
                            </Box>
                          </Box>
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => {
                              setCfEditId(field.id);
                              setCfForm({ field_name: field.field_name, field_type: field.field_type, is_required: field.is_required, options: field.options ? JSON.parse(field.options).join(", ") : "" });
                              setCfDialog(true);
                            }}>
                              <EditOutlinedIcon sx={{ fontSize: 16, color: COLORS.primary }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => deleteCustomField(field.id)}>
                              <DeleteOutlineOutlinedIcon sx={{ fontSize: 16, color: "#DC2626" }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>
            )}

            {/* TAB 6: LEAD SOURCES */}
            {activeTab === 6 && (
              <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2, md: 2.5 },
                    borderRadius: "14px",
                    border: `1px solid ${COLORS.border}`,
                    backgroundColor: "#FFFFFF",
                    width: "100%",
                  }}
                >
                  <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: "10px", backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <SourceOutlinedIcon sx={{ color: COLORS.primary, fontSize: "1.25rem" }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: COLORS.textPrimary }}>
                          Lead Sources ({leadSourcesList.length})
                        </Typography>
                        <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.8rem", mt: 0.25 }}>
                          Configure acquisition channels (Website, Calls, Referrals). Reflects instantly in lead forms and filters.
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      variant="contained"
                      startIcon={<AddOutlinedIcon sx={{ fontSize: "1.1rem" }} />}
                      onClick={() => handleOpenSourceDialog()}
                      sx={{
                        backgroundColor: COLORS.primary,
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.86rem",
                        height: 38,
                        px: 2.5,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        boxShadow: "none",
                        "&:hover": { backgroundColor: COLORS.primaryDark, boxShadow: "none" },
                      }}
                    >
                      Add Lead Source
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: "#F1F5F9" }} />

                  {configLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                      <CircularProgress size={28} />
                    </Box>
                  ) : leadSourcesList.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 5 }}>
                      <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>No lead sources configured yet.</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, width: "100%" }}>
                      {leadSourcesList.map((src) => (
                        <Box
                          key={src.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            py: 1.25,
                            px: 2,
                            borderRadius: "10px",
                            border: `1px solid ${src.is_active ? COLORS.border : "#F1F5F9"}`,
                            backgroundColor: src.is_active ? "#FFFFFF" : "#F8FAFC",
                            transition: "all 0.15s ease",
                            "&:hover": {
                              borderColor: "#CBD5E1",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                            },
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                flexShrink: 0,
                                backgroundColor: src.is_active ? COLORS.success : "#CBD5E1",
                              }}
                            />
                            <Typography
                              sx={{
                                fontWeight: 700,
                                fontSize: "0.88rem",
                                color: src.is_active ? COLORS.textPrimary : COLORS.textSecondary,
                              }}
                            >
                              {src.name}
                            </Typography>
                            {src.is_default ? (
                              <Chip
                                label="Default"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  backgroundColor: "#F1F5F9",
                                  color: "#64748B",
                                  borderRadius: "5px",
                                }}
                              />
                            ) : (
                              <Chip
                                label="Custom"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  backgroundColor: "#EFF6FF",
                                  color: "#2563EB",
                                  borderRadius: "5px",
                                }}
                              />
                            )}
                          </Box>

                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                            <Tooltip title={src.is_active ? "Active" : "Disabled"}>
                              <Switch
                                size="small"
                                checked={!!src.is_active}
                                onChange={() => handleToggleSourceActive(src)}
                                sx={{ mr: 0.75 }}
                              />
                            </Tooltip>
                            <Tooltip title="Edit Source">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenSourceDialog(src)}
                                sx={{ width: 32, height: 32, color: COLORS.textSecondary, "&:hover": { color: COLORS.primary, backgroundColor: "#F1F5F9" } }}
                              >
                                <EditOutlinedIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Source">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteSource(src)}
                                sx={{ width: 32, height: 32, color: "#94A3B8", "&:hover": { color: "#DC2626", backgroundColor: "#FEF2F2" } }}
                              >
                                <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Paper>
              </Box>
            )}

            {/* TAB 7: PIPELINE SALES STAGES */}
            {activeTab === 7 && (
              <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2, md: 2.5 },
                    borderRadius: "14px",
                    border: `1px solid ${COLORS.border}`,
                    backgroundColor: "#FFFFFF",
                    width: "100%",
                  }}
                >
                  <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: "10px", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ViewKanbanOutlinedIcon sx={{ color: "#2563EB", fontSize: "1.25rem" }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: COLORS.textPrimary }}>
                          Sales Pipeline Stages ({pipelineStatusesList.length})
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: "0.8rem", mt: 0.25, display: "block" }}>
                          Sequential stages from initial Lead to Closed Deal. Reorder sequence using arrow controls.
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      variant="contained"
                      startIcon={<AddOutlinedIcon sx={{ fontSize: "1.1rem" }} />}
                      onClick={() => handleOpenStatusDialog()}
                      sx={{
                        backgroundColor: COLORS.primary,
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.86rem",
                        height: 38,
                        px: 2.5,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        boxShadow: "none",
                        "&:hover": { backgroundColor: COLORS.primaryDark, boxShadow: "none" },
                      }}
                    >
                      Add Pipeline Stage
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: "#F1F5F9" }} />

                  {configLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                      <CircularProgress size={28} />
                    </Box>
                  ) : pipelineStatusesList.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 5 }}>
                      <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>No pipeline stages configured yet.</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, width: "100%" }}>
                      {pipelineStatusesList.map((st, idx) => (
                        <Box
                          key={st.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            py: 1.25,
                            px: 2,
                            borderRadius: "10px",
                            border: `1px solid ${st.is_active ? COLORS.border : "#F1F5F9"}`,
                            backgroundColor: st.is_active ? "#FFFFFF" : "#F8FAFC",
                            transition: "all 0.15s ease",
                            "&:hover": {
                              borderColor: "#CBD5E1",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                            },
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                            {/* REORDER BUTTONS */}
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                              <IconButton
                                size="small"
                                disabled={idx === 0}
                                onClick={() => handleMoveStatus(idx, -1)}
                                sx={{ p: 0.2, width: 22, height: 18 }}
                              >
                                <ArrowUpwardIcon sx={{ fontSize: 13 }} />
                              </IconButton>
                              <IconButton
                                size="small"
                                disabled={idx === pipelineStatusesList.length - 1}
                                onClick={() => handleMoveStatus(idx, 1)}
                                sx={{ p: 0.2, width: 22, height: 18 }}
                              >
                                <ArrowDownwardIcon sx={{ fontSize: 13 }} />
                              </IconButton>
                            </Box>

                            {/* STAGE COLOR PILL */}
                            <Box
                              sx={{
                                width: 14,
                                height: 14,
                                borderRadius: "4px",
                                flexShrink: 0,
                                backgroundColor: st.color_code || "#2563EB",
                              }}
                            />

                            <Typography
                              sx={{
                                fontWeight: 700,
                                fontSize: "0.88rem",
                                color: st.is_active ? COLORS.textPrimary : COLORS.textSecondary,
                              }}
                            >
                              {st.name}
                            </Typography>

                            {st.is_won ? (
                              <Chip
                                icon={<CheckCircleIcon sx={{ fontSize: "0.8rem !important", color: "#16A34A !important" }} />}
                                label="Won Deal"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  backgroundColor: "#F0FDF4",
                                  color: "#16A34A",
                                  borderRadius: "5px",
                                }}
                              />
                            ) : null}

                            {st.is_lost ? (
                              <Chip
                                icon={<CancelIcon sx={{ fontSize: "0.8rem !important", color: "#DC2626 !important" }} />}
                                label="Lost Deal"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  backgroundColor: "#FEF2F2",
                                  color: "#DC2626",
                                  borderRadius: "5px",
                                }}
                              />
                            ) : null}

                            {st.is_default ? (
                              <Chip
                                label="Default"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  backgroundColor: "#F1F5F9",
                                  color: "#64748B",
                                  borderRadius: "5px",
                                }}
                              />
                            ) : (
                              <Chip
                                label="Custom"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  backgroundColor: "#EFF6FF",
                                  color: "#2563EB",
                                  borderRadius: "5px",
                                }}
                              />
                            )}
                          </Box>

                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                            <Tooltip title={st.is_active ? "Active" : "Disabled"}>
                              <Switch
                                size="small"
                                checked={!!st.is_active}
                                onChange={() => handleToggleStatusActive(st)}
                                sx={{ mr: 0.75 }}
                              />
                            </Tooltip>
                            <Tooltip title="Edit Stage">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenStatusDialog(st)}
                                sx={{ width: 32, height: 32, color: COLORS.textSecondary, "&:hover": { color: COLORS.primary, backgroundColor: "#F1F5F9" } }}
                              >
                                <EditOutlinedIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Stage">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteStatus(st)}
                                sx={{ width: 32, height: 32, color: "#94A3B8", "&:hover": { color: "#DC2626", backgroundColor: "#FEF2F2" } }}
                              >
                                <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Paper>
              </Box>
            )}

            {/* TAB 9: ROLES & PERMISSIONS (DYNAMIC RBAC) */}
            {activeTab === 9 && (
              <RolesManagement showNotification={showNotification} />
            )}

          </Box>
        </Box>

        {/* ADD/EDIT CUSTOM FIELD DIALOG */}
        <Dialog open={cfDialog} onClose={() => setCfDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "12px", p: 1 } }}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>
            {cfEditId ? "Edit Custom Field" : "Add Custom Field"}
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <TextField
                label="Field Name"
                value={cfForm.field_name}
                onChange={(e) => setCfForm({ ...cfForm, field_name: e.target.value })}
                fullWidth size="small"
                placeholder="e.g. Panel Brand"
                sx={fieldSx}
              />
              <FormControl fullWidth size="small">
                <InputLabel>Field Type</InputLabel>
                <Select
                  value={cfForm.field_type}
                  label="Field Type"
                  onChange={(e) => setCfForm({ ...cfForm, field_type: e.target.value })}
                  sx={{ borderRadius: "8px" }}
                >
                  <MenuItem value="text">Text</MenuItem>
                  <MenuItem value="number">Number</MenuItem>
                  <MenuItem value="dropdown">Dropdown</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                </Select>
              </FormControl>
              {cfForm.field_type === "dropdown" && (
                <TextField
                  label="Options (comma separated)"
                  value={cfForm.options}
                  onChange={(e) => setCfForm({ ...cfForm, options: e.target.value })}
                  fullWidth size="small"
                  placeholder="e.g. Waaree, Adani, Tata"
                  sx={fieldSx}
                />
              )}
              <FormControlLabel
                control={<Switch checked={!!cfForm.is_required} onChange={(e) => setCfForm({ ...cfForm, is_required: e.target.checked ? 1 : 0 })} />}
                label="Required Field"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button onClick={() => setCfDialog(false)} sx={{ borderRadius: "8px", textTransform: "none" }}>Cancel</Button>
            <Button variant="contained" onClick={saveCustomField} disabled={!cfForm.field_name}
              sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700, backgroundColor: COLORS.primary }}>
              {cfEditId ? "Update" : "Add Field"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ADD/EDIT SOURCE DIALOG */}
        <Dialog open={sourceDialog} onClose={() => setSourceDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "12px", p: 1 } }}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>
            {sourceEditing ? "Edit Lead Source" : "Add New Lead Source"}
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <TextField
                label="Lead Source Name"
                value={sourceNameInput}
                onChange={(e) => setSourceNameInput(e.target.value)}
                fullWidth
                size="small"
                placeholder="e.g. Instagram Ads, Trade Fair, Partner Referral"
                sx={fieldSx}
                autoFocus
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button onClick={() => setSourceDialog(false)} sx={{ borderRadius: "8px", textTransform: "none" }}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSaveSource}
              disabled={!sourceNameInput.trim()}
              sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700, backgroundColor: COLORS.primary }}
            >
              {sourceEditing ? "Update Source" : "Add Source"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ADD/EDIT PIPELINE STATUS DIALOG */}
        <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "12px", p: 1 } }}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>
            {statusEditing ? "Edit Pipeline Stage" : "Add New Pipeline Stage"}
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <TextField
                label="Stage Name"
                value={statusForm.name}
                onChange={(e) => setStatusForm({ ...statusForm, name: e.target.value })}
                fullWidth
                size="small"
                placeholder="e.g. Site Survey Completed"
                sx={fieldSx}
                autoFocus
              />

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary, mb: 1, display: "block" }}>
                  Badge Color
                </Typography>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <input
                    type="color"
                    value={statusForm.color_code}
                    onChange={(e) => setStatusForm({ ...statusForm, color_code: e.target.value })}
                    style={{
                      width: 40,
                      height: 38,
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      padding: 0,
                      backgroundColor: "transparent",
                    }}
                  />
                  <TextField
                    size="small"
                    value={statusForm.color_code}
                    onChange={(e) => setStatusForm({ ...statusForm, color_code: e.target.value })}
                    sx={{ ...fieldSx, width: 140 }}
                    placeholder="#2563EB"
                  />
                  <Box
                    sx={{
                      px: 2,
                      py: 0.6,
                      borderRadius: "6px",
                      backgroundColor: statusForm.color_code,
                      color: "#FFFFFF",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                  >
                    Preview
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!statusForm.is_won}
                      onChange={(e) => setStatusForm({ ...statusForm, is_won: e.target.checked ? 1 : 0, is_lost: e.target.checked ? 0 : statusForm.is_lost })}
                    />
                  }
                  label={
                    <Box>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>Mark as "Won" Stage</Typography>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block" }}>
                        Leads reaching this stage count as successfully converted sales.
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!statusForm.is_lost}
                      onChange={(e) => setStatusForm({ ...statusForm, is_lost: e.target.checked ? 1 : 0, is_won: e.target.checked ? 0 : statusForm.is_won })}
                    />
                  }
                  label={
                    <Box>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>Mark as "Lost / Dropped" Stage</Typography>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block" }}>
                        Leads reaching this stage count as closed lost or disqualified.
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button onClick={() => setStatusDialog(false)} sx={{ borderRadius: "8px", textTransform: "none" }}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSaveStatus}
              disabled={!statusForm.name.trim()}
              sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700, backgroundColor: COLORS.primary }}
            >
              {statusEditing ? "Update Stage" : "Add Stage"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* TOAST SYSTEM */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3500}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          TransitionComponent={SlideTransition}
          sx={{ mt: 2 }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            variant="filled"
            iconMapping={{
              success: <CheckCircleOutlineOutlinedIcon fontSize="inherit" />,
              error: <ErrorOutlineOutlinedIcon fontSize="inherit" />,
              warning: <WarningAmberOutlinedIcon fontSize="inherit" />,
              info: <InfoOutlinedIcon fontSize="inherit" />,
            }}
            action={
              <IconButton size="small" onClick={handleSnackbarClose} sx={{ color: "#FFFFFF" }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            }
            sx={{
              minWidth: 280,
              borderRadius: "8px",
              fontWeight: 600,
              alignItems: "center",
              boxShadow: "0 6px 20px rgba(15, 23, 42, 0.15)",
              backgroundColor:
                snackbar.severity === "success"
                  ? COLORS.success
                  : snackbar.severity === "error"
                  ? COLORS.danger
                  : snackbar.severity === "warning"
                  ? COLORS.warning
                  : COLORS.info,
              color: "#FFFFFF",
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

      </Box>
    </Box>
  );
};

export default Settings;