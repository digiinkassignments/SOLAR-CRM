import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  IconButton,
  Stack,
  Breadcrumbs,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  Divider,
  Tabs,
  Tab,
  LinearProgress,
  Tooltip,
} from "@mui/material";

// Icons
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import EditIcon from "@mui/icons-material/Edit";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import HistoryIcon from "@mui/icons-material/History";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ChecklistIcon from "@mui/icons-material/Checklist";
import ConstructionIcon from "@mui/icons-material/Construction";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import HandshakeIcon from "@mui/icons-material/Handshake";
import VerifiedIcon from "@mui/icons-material/Verified";
import DeleteIcon from "@mui/icons-material/Delete";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";

import toast from "react-hot-toast";
import api from "../../../utils/api";
import PreInstallInspection from "./tabs/PreInstallInspection";
import InstallationProgress from "./tabs/InstallationProgress";
import Commissioning from "./tabs/Commissioning";
import FinalInspection from "./tabs/FinalInspection";
import CustomerHandover from "./tabs/CustomerHandover";
import WarrantyAMC from "./tabs/WarrantyAMC";
import {
  STAGES,
  STAGE_CONFIG,
  getStageIndex,
  getProgressPercent,
  getStageConfig,
} from "../../../utils/projectStages";

// Theme constants
const COLORS = {
  primary: "#0F172A",
  primaryHover: "#020617",
  secondary: "#F59E0B",
  background: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const roleName = (user?.role_name || user?.role || "").toLowerCase();
  const isManager = user?.role_id === 2 || roleName.includes("manager");
  const projectBasePath = isManager ? "/manager/projects" : "/projects";

  // Project Data State
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab State: 0=Overview, 1=History, 2=Pre-Install, 3=Install, 4=Commissioning, 5=FinalInspection, 6=Handover, 7=Warranty
  const [activeTab, setActiveTab] = useState(0);

  // Change Stage Dialog State
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [nextStage, setNextStage] = useState("");
  const [stageNotes, setStageNotes] = useState("");
  const [updatingStage, setUpdatingStage] = useState(false);

  // Edit Project Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [updatingProject, setUpdatingProject] = useState(false);
  const [editFormData, setEditFormData] = useState({
    customer_name: "",
    customer_phone: "",
    system_capacity_kw: "",
    panel_count: "",
    inverter_kw: "",
    customer_address: "",
    city: "",
    state: "",
    pincode: "",
    installation_start_date: "",
    installation_end_date: "",
    completion_date: "",
    notes: "",
  });

  // Delete Project Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch Project Details from GET /api/projects/:id
  const fetchProjectDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/projects/${id}`);
      if (res.data?.success && res.data.data) {
        setProject(res.data.data);
      } else {
        setError("Project not found.");
      }
    } catch (err) {
      console.error("fetchProjectDetails error:", err);
      setError(err.response?.data?.message || "Failed to load project details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  // Current stage index in 10-stage lifecycle
  const currentStageIndex = project ? getStageIndex(project.stage) : 0;
  const progressPct = project ? getProgressPercent(project.stage) : 10;
  const stageConfig = project ? getStageConfig(project.stage) : getStageConfig("Order Closed");

  // Open Stage Change Dialog
  const handleOpenStageDialog = () => {
    const nextIdx = currentStageIndex + 1;
    const defaultNext = nextIdx < STAGES.length ? STAGES[nextIdx] : STAGES[0];
    setNextStage(defaultNext);
    setStageNotes("");
    setStageDialogOpen(true);
  };

  // Quick 1-Click Advance to Next Stage
  const handleQuickAdvance = async (targetStage) => {
    if (!targetStage) return;
    setUpdatingStage(true);
    try {
      const res = await api.put(`/projects/${id}/stage`, {
        stage: targetStage,
        notes: `Quick advanced to ${targetStage}`,
      });
      if (res.data?.success) {
        toast.success(`Project moved to: ${targetStage}`);
        fetchProjectDetails();
      }
    } catch (err) {
      console.error("Quick advance error:", err);
      toast.error(err.response?.data?.message || "Failed to update stage.");
    } finally {
      setUpdatingStage(false);
    }
  };

  // Submit Stage Change
  const handleSubmitStageChange = async (e) => {
    e.preventDefault();
    if (!nextStage) {
      toast.error("Please select a stage.");
      return;
    }
    setUpdatingStage(true);
    try {
      const res = await api.put(`/projects/${id}/stage`, {
        stage: nextStage,
        notes: stageNotes.trim() || undefined,
      });
      if (res.data?.success) {
        toast.success(`Project moved to: ${nextStage}`);
        setStageDialogOpen(false);
        fetchProjectDetails();
      }
    } catch (err) {
      console.error("Update stage error:", err);
      toast.error(err.response?.data?.message || "Failed to update stage.");
    } finally {
      setUpdatingStage(false);
    }
  };

  // Open Edit Dialog
  const handleOpenEditDialog = () => {
    if (!project) return;
    setEditFormData({
      customer_name: project.customer_name || "",
      customer_phone: project.customer_phone || "",
      system_capacity_kw: project.system_capacity_kw || "",
      panel_count: project.panel_count || "",
      inverter_kw: project.inverter_kw || "",
      customer_address: project.customer_address || "",
      city: project.city || "",
      state: project.state || "",
      pincode: project.pincode || "",
      installation_start_date: project.installation_start_date
        ? project.installation_start_date.slice(0, 10)
        : "",
      installation_end_date: project.installation_end_date
        ? project.installation_end_date.slice(0, 10)
        : "",
      completion_date: project.completion_date
        ? project.completion_date.slice(0, 10)
        : "",
      notes: project.notes || "",
    });
    setEditDialogOpen(true);
  };

  // Submit Edit Project
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setUpdatingProject(true);
    try {
      const res = await api.put(`/projects/${id}`, editFormData);
      if (res.data?.success) {
        toast.success("Project information updated successfully!");
        setEditDialogOpen(false);
        fetchProjectDetails();
      }
    } catch (err) {
      console.error("Update project error:", err);
      toast.error(err.response?.data?.message || "Failed to update project.");
    } finally {
      setUpdatingProject(false);
    }
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!project) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/projects/${project.id}`);
      if (res.data?.success) {
        toast.success(res.data.message || "Project deleted successfully!");
        setDeleteConfirmOpen(false);
        navigate(projectBasePath);
      } else {
        toast.error(res.data?.message || "Failed to delete project");
      }
    } catch (err) {
      console.error("Delete project error:", err);
      toast.error(err.response?.data?.message || "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  // Modern Stage Badge
  const renderStageBadge = (stageName) => {
    const config = getStageConfig(stageName);
    return (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.8,
          px: 1.4,
          py: 0.5,
          borderRadius: "8px",
          backgroundColor: config.bg,
          border: `1px solid ${config.border}`,
          color: config.color,
          fontWeight: 700,
          fontSize: "0.78rem",
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
        }}
      >
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: config.dot,
            flexShrink: 0,
            boxShadow: `0 0 0 2px ${config.bg}`,
          }}
        />
        <span>
          Step {config.step}/10 • {config.label}
        </span>
      </Box>
    );
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

  const formatDateTime = (dateVal) => {
    if (!dateVal) return "—";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "—";
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  // ── LOADING STATE ──
  if (loading) {
    return (
      <Box sx={{ p: 3, backgroundColor: COLORS.background, minHeight: "100vh" }}>
        <Skeleton variant="text" width={240} height={28} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={90} sx={{ borderRadius: "14px", mb: 3 }} />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Skeleton variant="rounded" height={400} sx={{ borderRadius: "14px" }} />
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Skeleton variant="rounded" height={400} sx={{ borderRadius: "14px" }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  // ── ERROR STATE ──
  if (error || !project) {
    return (
      <Box
        sx={{
          p: 4,
          backgroundColor: COLORS.background,
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 5,
            borderRadius: "16px",
            border: `1px solid ${COLORS.border}`,
            textAlign: "center",
            maxWidth: 440,
            backgroundColor: COLORS.card,
          }}
        >
          <ErrorOutlineOutlinedIcon sx={{ fontSize: 56, color: "#DC2626", mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, mb: 1 }}>
            Project Not Found
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 3 }}>
            The project you are looking for does not exist or may have been removed.
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(projectBasePath)}
            sx={{
              backgroundColor: COLORS.primary,
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "8px",
              px: 3,
            }}
          >
            Back to Projects
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: COLORS.background,
        minHeight: "100vh",
        p: { xs: 1.5, sm: 2.5, md: 3 },
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "100%", mx: "auto" }}>
        {/* SECTION 1 — HEADER & BREADCRUMBS */}
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1.5 }}>
          <IconButton
            size="small"
            onClick={() => navigate(-1)}
            sx={{
              width: 34,
              height: 34,
              borderRadius: "8px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.card,
              color: COLORS.textPrimary,
              "&:hover": { backgroundColor: "#F8FAFC" },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 18 }} />
          </IconButton>

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
              onClick={() => navigate(projectBasePath)}
            >
              Projects
            </Typography>

            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: COLORS.textPrimary,
              }}
            >
              {project.project_number}
            </Typography>
          </Breadcrumbs>
        </Stack>

        {/* SECTION 2 — PROJECT HERO CARD (NO-COLLISION HEADER) */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 2.5,
            borderRadius: "14px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            gap: 2,
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
          }}
        >
          {/* Customer & Project Title */}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack
              direction="row"
              alignItems="center"
              gap={1.2}
              sx={{ flexWrap: "wrap", mb: 0.6 }}
            >
              <Box
                sx={{
                  px: 1.2,
                  py: 0.35,
                  borderRadius: "6px",
                  backgroundColor: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  color: "#1D4ED8",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  fontFamily: "monospace",
                }}
              >
                {project.project_number}
              </Box>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: "1.15rem", sm: "1.3rem" },
                  color: COLORS.textPrimary,
                  letterSpacing: "-0.01em",
                }}
              >
                {project.customer_name}
              </Typography>

              {renderStageBadge(project.stage)}
            </Stack>

            <Typography
              variant="body2"
              sx={{
                color: COLORS.textSecondary,
                fontSize: "0.78rem",
              }}
            >
              Created on {formatDate(project.created_at)} • Last stage update:{" "}
              {formatDateTime(project.stage_updated_at || project.updated_at)}
            </Typography>
          </Box>

          {/* Action Buttons (Spaced & Wrapped Cleanly) */}
          <Stack
            direction="row"
            alignItems="center"
            gap={1}
            sx={{ flexWrap: "wrap", flexShrink: 0 }}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon sx={{ fontSize: 16 }} />}
              onClick={handleOpenEditDialog}
              sx={{
                height: 38,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.8rem",
                px: 2,
                borderColor: COLORS.border,
                color: COLORS.textPrimary,
                backgroundColor: "#FFFFFF",
                "&:hover": {
                  borderColor: COLORS.primary,
                  backgroundColor: "#F8FAFC",
                },
              }}
            >
              Edit Details
            </Button>

            <Button
              variant="contained"
              size="small"
              startIcon={<SwapHorizIcon sx={{ fontSize: 18 }} />}
              onClick={handleOpenStageDialog}
              sx={{
                height: 38,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.8rem",
                px: 2.2,
                backgroundColor: COLORS.secondary,
                color: "#FFFFFF",
                "&:hover": { backgroundColor: "#D97706" },
              }}
            >
              Change Stage
            </Button>

            <IconButton
              size="small"
              onClick={() => setDeleteConfirmOpen(true)}
              sx={{
                height: 38,
                width: 38,
                borderRadius: "8px",
                border: `1px solid ${COLORS.border}`,
                color: "#EF4444",
                "&:hover": {
                  borderColor: "#FCA5A5",
                  backgroundColor: "#FEF2F2",
                },
              }}
            >
              <Tooltip title="Delete Project">
                <DeleteIcon sx={{ fontSize: 18 }} />
              </Tooltip>
            </IconButton>
          </Stack>
        </Paper>

        {/* SECTION 3 — EXECUTION TABS BAR */}
        <Paper
          elevation={0}
          sx={{
            mb: 2.5,
            p: 0,
            borderRadius: "14px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            overflow: "hidden",
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, pt: 0.5, backgroundColor: "#FFFFFF" }}>
            <Tabs
              value={activeTab}
              onChange={(e, val) => setActiveTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  minHeight: 48,
                  color: COLORS.textSecondary,
                  "&.Mui-selected": { color: COLORS.primary, fontWeight: 700 },
                },
                "& .MuiTabs-indicator": { backgroundColor: COLORS.primary, height: 3 },
              }}
            >
              <Tab label="Overview & Stages" iconPosition="start" />
              <Tab label="Stage History" iconPosition="start" />
              <Tab
                label="Pre-Install Inspection"
                icon={<ChecklistIcon sx={{ fontSize: "1.1rem" }} />}
                iconPosition="start"
              />
              <Tab
                label="Installation Progress"
                icon={<ConstructionIcon sx={{ fontSize: "1.1rem" }} />}
                iconPosition="start"
              />
              <Tab icon={<ElectricBoltIcon />} label="Commissioning" iconPosition="start" />
              <Tab icon={<FactCheckIcon />} label="Final Inspection" iconPosition="start" />
              <Tab icon={<HandshakeIcon />} label="Customer Handover" iconPosition="start" />
              <Tab icon={<VerifiedIcon />} label="Warranty & AMC" iconPosition="start" />
            </Tabs>
          </Box>
        </Paper>

        {/* TAB 0: OVERVIEW (INFO GRID + 10-STAGE PIPELINE STEPPER) */}
        {activeTab === 0 && (
          <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
            {/* Left Column: Customer & System Details */}
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "14px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.card,
                  height: "100%",
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2.5,
                }}
              >
                {/* Customer Profile */}
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
                    Customer & Site Profile
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                        Customer Name
                      </Typography>
                      <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: COLORS.textPrimary }}>
                        {project.customer_name}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                        Mobile Phone
                      </Typography>
                      <Stack direction="row" alignItems="center" gap={0.5}>
                        <PhoneIcon sx={{ fontSize: 15, color: "#2563EB" }} />
                        <Typography
                          component="a"
                          href={`tel:${project.customer_phone}`}
                          sx={{
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            color: "#2563EB",
                            textDecoration: "none",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          {project.customer_phone || "—"}
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid size={12}>
                      <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                        Installation Site Location
                      </Typography>
                      <Stack direction="row" alignItems="flex-start" gap={0.6} sx={{ mt: 0.2 }}>
                        <LocationOnIcon sx={{ fontSize: 17, color: COLORS.textMuted, mt: 0.2 }} />
                        <Typography sx={{ fontSize: "0.85rem", color: COLORS.textPrimary }}>
                          {[project.customer_address, project.city, project.state, project.pincode]
                            .filter(Boolean)
                            .join(", ") || "Site address not specified"}
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* Solar Engineering Specs */}
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
                    Solar Technical Specifications
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                        System Capacity
                      </Typography>
                      <Stack direction="row" alignItems="center" gap={0.6} sx={{ mt: 0.2 }}>
                        <SolarPowerIcon sx={{ fontSize: 20, color: "#D97706" }} />
                        <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: COLORS.textPrimary }}>
                          {parseFloat(project.system_capacity_kw || 1).toFixed(2)} kW
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                        Solar Modules
                      </Typography>
                      <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: COLORS.textPrimary, mt: 0.2 }}>
                        {project.panel_count ? `${project.panel_count} Panels` : "Standard Array"}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                        Grid Inverter
                      </Typography>
                      <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: COLORS.textPrimary, mt: 0.2 }}>
                        {project.inverter_kw ? `${project.inverter_kw} kW Smart` : "Grid-Tied"}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* Project Execution Timeline */}
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
                    Project Execution Schedule
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                        Installation Start Date
                      </Typography>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: COLORS.textPrimary, mt: 0.2 }}>
                        {formatDate(project.installation_start_date)}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                        Target Completion Date
                      </Typography>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: COLORS.textPrimary, mt: 0.2 }}>
                        {formatDate(project.installation_end_date)}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                        Actual Handover Date
                      </Typography>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "#16A34A", mt: 0.2 }}>
                        {formatDate(project.completion_date)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {project.notes && (
                  <>
                    <Divider />
                    <Box>
                      <Typography
                        sx={{
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          color: COLORS.primary,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          mb: 0.6,
                        }}
                      >
                        Project Notes
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.82rem",
                          color: COLORS.textSecondary,
                          backgroundColor: "#F8FAFC",
                          p: 1.5,
                          borderRadius: "8px",
                          border: `1px solid ${COLORS.border}`,
                        }}
                      >
                        {project.notes}
                      </Typography>
                    </Box>
                  </>
                )}
              </Paper>
            </Grid>

            {/* Right Column: 10-STAGE INTERACTIVE PIPELINE STEPPER */}
            <Grid size={{ xs: 12, lg: 6 }}>
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
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "0.85rem",
                        fontWeight: 900,
                        color: COLORS.textPrimary,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Solar Project Execution Stepper
                    </Typography>
                    <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary, mt: 0.2 }}>
                      10 sequential phases under PM Surya Ghar & DISCOM net-metering
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<SwapHorizIcon sx={{ fontSize: 16 }} />}
                    onClick={handleOpenStageDialog}
                    sx={{
                      height: 30,
                      borderRadius: "6px",
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.74rem",
                    }}
                  >
                    Change Stage
                  </Button>
                </Box>

                {/* Stepper Progress Bar */}
                <Box sx={{ mb: 2.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary }}>
                      Stage {currentStageIndex + 1} of 10: {stageConfig.label}
                    </Typography>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: stageConfig.color }}>
                      {progressPct}% Done
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progressPct}
                    sx={{
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: "#F1F5F9",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 4,
                        backgroundColor: stageConfig.dot,
                      },
                    }}
                  />
                </Box>

                {/* 10 Vertical Milestones */}
                <Stack spacing={1.5}>
                  {STAGES.map((stageName, index) => {
                    const isCompleted = index < currentStageIndex;
                    const isCurrent = index === currentStageIndex;
                    const itemConfig = getStageConfig(stageName);
                    const nextStageCandidate = index + 1 < STAGES.length ? STAGES[index + 1] : null;

                    const matchingLog = project.stage_logs?.find(
                      (l) => l.to_stage === stageName
                    );

                    return (
                      <Box
                        key={stageName}
                        sx={{
                          p: 1.5,
                          borderRadius: "10px",
                          border: `1px solid ${
                            isCurrent
                              ? itemConfig.border
                              : isCompleted
                              ? "#DCFCE7"
                              : COLORS.border
                          }`,
                          backgroundColor: isCurrent
                            ? itemConfig.bg
                            : isCompleted
                            ? "#F0FDF4"
                            : "#F8FAFC",
                          transition: "all 0.18s ease-in-out",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                          {/* Step Icon */}
                          <Box sx={{ mt: 0.2 }}>
                            {isCompleted ? (
                              <CheckCircleIcon sx={{ fontSize: 20, color: "#16A34A" }} />
                            ) : isCurrent ? (
                              <RadioButtonCheckedIcon
                                sx={{
                                  fontSize: 20,
                                  color: itemConfig.dot,
                                  animation: "pulse 1.8s infinite",
                                  "@keyframes pulse": {
                                    "0%": { transform: "scale(0.95)" },
                                    "50%": { transform: "scale(1.15)" },
                                    "100%": { transform: "scale(0.95)" },
                                  },
                                }}
                              />
                            ) : (
                              <RadioButtonUncheckedIcon sx={{ fontSize: 20, color: "#94A3B8" }} />
                            )}
                          </Box>

                          {/* Content */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 0.5 }}>
                              <Typography
                                sx={{
                                  fontSize: "0.82rem",
                                  fontWeight: isCurrent ? 800 : isCompleted ? 700 : 600,
                                  color: isCurrent
                                    ? itemConfig.color
                                    : isCompleted
                                    ? "#16A34A"
                                    : COLORS.textPrimary,
                                }}
                              >
                                {index + 1}. {stageName}
                              </Typography>

                              {isCurrent && (
                                <Box
                                  sx={{
                                    px: 1,
                                    py: 0.2,
                                    borderRadius: "4px",
                                    backgroundColor: itemConfig.dot,
                                    color: "#FFFFFF",
                                    fontSize: "0.68rem",
                                    fontWeight: 800,
                                    letterSpacing: "0.02em",
                                  }}
                                >
                                  CURRENT ACTIVE STAGE
                                </Box>
                              )}
                            </Box>

                            <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mt: 0.3 }}>
                              {itemConfig.description}
                            </Typography>

                            {/* Completed Timestamp or 1-Click Advance Button */}
                            {isCompleted && matchingLog?.created_at && (
                              <Typography sx={{ fontSize: "0.68rem", color: "#15803D", mt: 0.4 }}>
                                Completed on {formatDateTime(matchingLog.created_at)}
                              </Typography>
                            )}

                            {isCurrent && nextStageCandidate && (
                              <Box sx={{ mt: 1.2 }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
                                  onClick={() => handleQuickAdvance(nextStageCandidate)}
                                  disabled={updatingStage}
                                  sx={{
                                    height: 28,
                                    borderRadius: "6px",
                                    textTransform: "none",
                                    fontWeight: 700,
                                    fontSize: "0.74rem",
                                    px: 1.8,
                                    backgroundColor: itemConfig.color,
                                    color: "#FFFFFF",
                                    "&:hover": { opacity: 0.9 },
                                  }}
                                >
                                  Advance to: {nextStageCandidate}
                                </Button>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* TAB 1: STAGE HISTORY */}
        {activeTab === 1 && (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.card,
              mb: 2.5,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.05rem", mb: 2 }}>
              Stage Transition Audit Trail
            </Typography>
            {project.stage_logs?.length === 0 ? (
              <Typography sx={{ fontSize: "0.82rem", color: COLORS.textMuted }}>
                No stage changes logged yet.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {project.stage_logs?.map((log) => (
                  <Box
                    key={log.id}
                    sx={{
                      p: 1.5,
                      borderRadius: "10px",
                      backgroundColor: "#F8FAFC",
                      border: `1px solid ${COLORS.border}`,
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 700 }}>
                          {log.from_stage ? `${log.from_stage} → ` : ""}
                          <Box component="span" sx={{ color: "#2563EB" }}>
                            {log.to_stage}
                          </Box>
                        </Typography>
                      </Stack>
                      <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                        {formatDateTime(log.created_at)}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary }}>
                      Changed by: <strong>{log.changed_by_name || "System"}</strong>
                    </Typography>
                    {log.notes && (
                      <Typography sx={{ fontSize: "0.74rem", color: COLORS.textPrimary, mt: 0.5, fontStyle: "italic" }}>
                        "{log.notes}"
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        )}

        {/* TAB 2: PRE-INSTALL INSPECTION */}
        {activeTab === 2 && (
          <Box sx={{ mt: 1 }}>
            <PreInstallInspection project={project} projectId={id} />
          </Box>
        )}

        {/* TAB 3: INSTALLATION PROGRESS */}
        {activeTab === 3 && (
          <Box sx={{ mt: 1 }}>
            <InstallationProgress project={project} projectId={id} />
          </Box>
        )}

        {/* TAB 4: COMMISSIONING */}
        {activeTab === 4 && (
          <Box sx={{ mt: 1 }}>
            <Commissioning project={project} projectId={id} />
          </Box>
        )}

        {/* TAB 5: FINAL INSPECTION */}
        {activeTab === 5 && (
          <Box sx={{ mt: 1 }}>
            <FinalInspection project={project} projectId={id} />
          </Box>
        )}

        {/* TAB 6: CUSTOMER HANDOVER */}
        {activeTab === 6 && (
          <Box sx={{ mt: 1 }}>
            <CustomerHandover project={project} projectId={id} />
          </Box>
        )}

        {/* TAB 7: WARRANTY & AMC */}
        {activeTab === 7 && (
          <Box sx={{ mt: 1 }}>
            <WarrantyAMC project={project} projectId={id} />
          </Box>
        )}
      </Box>

      {/* ============================================================== */}
      {/* CHANGE STAGE DIALOG                                            */}
      {/* ============================================================== */}
      <Dialog
        open={stageDialogOpen}
        onClose={() => !updatingStage && setStageDialogOpen(false)}
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
          Change Project Stage
          <IconButton
            size="small"
            onClick={() => setStageDialogOpen(false)}
            disabled={updatingStage}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmitStageChange}>
          <DialogContent dividers sx={{ borderColor: COLORS.border, py: 2.5 }}>
            <Box sx={{ mb: 2.5 }}>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted, mb: 0.5 }}>
                Current Active Stage
              </Typography>
              {renderStageBadge(project.stage)}
            </Box>

            <Box sx={{ mb: 2.5 }}>
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: COLORS.primary,
                  mb: 0.8,
                }}
              >
                Select New Execution Stage (1-10) *
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={nextStage}
                  onChange={(e) => setNextStage(e.target.value)}
                  sx={{ borderRadius: "8px" }}
                >
                  {STAGES.map((stg, i) => (
                    <MenuItem key={stg} value={stg} sx={{ fontSize: "0.82rem" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: STAGE_CONFIG[stg]?.dot || "#94A3B8",
                          }}
                        />
                        <span>
                          {i + 1}. {stg}
                        </span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: COLORS.primary,
                  mb: 0.8,
                }}
              >
                Remarks / Stage Transition Audit Notes
              </Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={3.5}
                InputLabelProps={{ shrink: true }}
                placeholder="Reason for change, approvals received, or milestone status..."
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              onClick={() => setStageDialogOpen(false)}
              disabled={updatingStage}
              sx={{ textTransform: "none", fontWeight: 600, color: COLORS.textSecondary }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={updatingStage}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                backgroundColor: COLORS.secondary,
                px: 3,
                "&:hover": { backgroundColor: "#D97706" },
              }}
            >
              {updatingStage ? "Updating..." : "Update Stage"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ============================================================== */}
      {/* EDIT PROJECT DIALOG (FIXED IMAGE 2 SQUISHING - SPACIOUS maxWidth="md") */}
      {/* ============================================================== */}
      <Dialog
        open={editDialogOpen}
        onClose={() => !updatingProject && setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "16px", p: 1 },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 900,
            fontSize: "1.15rem",
            color: COLORS.textPrimary,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Edit Solar Project Details
          <IconButton
            size="small"
            onClick={() => setEditDialogOpen(false)}
            disabled={updatingProject}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmitEdit}>
          <DialogContent dividers sx={{ borderColor: COLORS.border, py: 2.5 }}>
            <Stack spacing={3}>
              {/* Group 1: Customer Profile */}
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
                  Customer & Contact Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      required
                      label="Customer Full Name *"
                      value={editFormData.customer_name}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, customer_name: e.target.value })
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      required
                      label="Customer Mobile Phone *"
                      value={editFormData.customer_phone}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, customer_phone: e.target.value })
                      }
                    />
                  </Grid>

                  <Grid size={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Site Installation Address"
                      value={editFormData.customer_address}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, customer_address: e.target.value })
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="City"
                      value={editFormData.city}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, city: e.target.value })
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="State"
                      value={editFormData.state}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, state: e.target.value })
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Pincode"
                      value={editFormData.pincode}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, pincode: e.target.value })
                      }
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Group 2: Solar Technical Specs */}
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
                  Technical Solar System Specifications
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      step="0.1"
                      required
                      label="System Capacity (kW) *"
                      value={editFormData.system_capacity_kw}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, system_capacity_kw: e.target.value })
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Panel Count (pcs)"
                      value={editFormData.panel_count}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, panel_count: e.target.value })
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      step="0.1"
                      label="Inverter Size (kW)"
                      value={editFormData.inverter_kw}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, inverter_kw: e.target.value })
                      }
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Group 3: Schedule Dates */}
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
                  Project Execution Schedule Dates
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Install Start Date"
                      InputLabelProps={{ shrink: true }}
                      value={editFormData.installation_start_date}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          installation_start_date: e.target.value,
                        })
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Install End Date"
                      InputLabelProps={{ shrink: true }}
                      value={editFormData.installation_end_date}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          installation_end_date: e.target.value,
                        })
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Actual Handover Date"
                      InputLabelProps={{ shrink: true }}
                      value={editFormData.completion_date}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          completion_date: e.target.value,
                        })
                      }
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Group 4: Notes (FULL WIDTH - NEVER SQUISHED) */}
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
                  Project Notes & Special Instructions
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={3.5}
                  InputLabelProps={{ shrink: true }}
                  label="Notes"
                  placeholder="Installation notes, customer requests, or site hurdles..."
                  value={editFormData.notes}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, notes: e.target.value })
                  }
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              onClick={() => setEditDialogOpen(false)}
              disabled={updatingProject}
              sx={{ textTransform: "none", fontWeight: 600, color: COLORS.textSecondary }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={updatingProject}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                backgroundColor: COLORS.primary,
                px: 3,
                "&:hover": { backgroundColor: COLORS.primaryHover },
              }}
            >
              {updatingProject ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* DELETE PROJECT CONFIRMATION DIALOG */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !deleting && setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "14px", p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.05rem" }}>
          Delete Solar Project?
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: COLORS.border }}>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 1.5 }}>
            Are you sure you want to delete project{" "}
            <strong>{project?.project_number}</strong> for{" "}
            <strong>{project?.customer_name}</strong>?
          </Typography>
          <Typography variant="caption" sx={{ color: "#DC2626", fontWeight: 600 }}>
            This action will soft-delete the project record. Related site inspections and logs will be preserved.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            disabled={deleting}
            sx={{ textTransform: "none", fontWeight: 600, color: COLORS.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleting}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {deleting ? "Deleting..." : "Delete Project"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
