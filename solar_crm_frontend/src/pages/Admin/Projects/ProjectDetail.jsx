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
  Alert,
  Chip,
} from "@mui/material";

// Icons
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import EditIcon from "@mui/icons-material/Edit";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
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

import ProjectWorkspace from "./ProjectWorkspace";
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
  const isManager = Number(user?.role_id) === 2 || roleName.includes("manager");
  const isEngineer = Number(user?.role_id) === 4 || roleName.includes("engineer");
  const canEdit = [1, 2, 4].includes(Number(user?.role_id));
  const canDelete = [1,2].includes(Number(user?.role_id));
  const projectBasePath = isEngineer ? "/engineer/projects" : isManager ? "/manager/projects" : "/projects";
  const dashboardPath = isEngineer ? "/engineer/dashboard" : isManager ? "/manager/dashboard" : "/dashboard";

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
    total_cost: "",
    amount_received: "",
    payment_status: "Pending",
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
        const pData = res.data.data;
        setProject(pData);
        // Use the canonical project URL; access control remains the API responsibility.
        if (pData.project_uuid && id !== pData.project_uuid) {
          navigate(`${projectBasePath}/${pData.project_uuid}`, { replace: true });
        }
      } else {
        setError("Project not found.");
      }
    } catch (err) {
      console.error("fetchProjectDetails error:", err);
      setError(err.response?.data?.message || "Failed to load project details.");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, projectBasePath]);

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
    const defaultNext = nextIdx < STAGES.length ? STAGES[nextIdx] : project.stage;
    setNextStage(defaultNext);
    setStageNotes("");
    setStageDialogOpen(true);
  };

  // Quick 1-Click Advance to Next Stage
  const handleQuickAdvance = async (targetStage) => {
    if (!targetStage || updatingStage || !canEdit) return;
    setUpdatingStage(true);
    try {
      const res = await api.put(`/projects/${project?.id || id}/stage`, {
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
    if (updatingStage || !canEdit) return;
    if (!nextStage) {
      toast.error("Please select a stage.");
      return;
    }
    setUpdatingStage(true);
    try {
      const res = await api.put(`/projects/${project?.id || id}/stage`, {
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
      total_cost: project.total_cost != null ? String(project.total_cost) : "",
      amount_received: project.amount_received != null ? String(project.amount_received) : "",
      payment_status: project.payment_status || "Pending",
    });
    setEditDialogOpen(true);
  };

  // Submit Edit Project
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (updatingProject || !canEdit) return;
    if (!editFormData.customer_name.trim() || !editFormData.customer_phone.trim() || !Number.isFinite(Number(editFormData.system_capacity_kw)) || Number(editFormData.system_capacity_kw) <= 0) {
      toast.error("Enter a customer name, phone and a system capacity greater than zero."); return;
    }
    if (Number(editFormData.total_cost) < 0 || Number(editFormData.amount_received) < 0) {
      toast.error("Payment amounts cannot be negative."); return;
    }
    setUpdatingProject(true);
    try {
      const res = await api.put(`/projects/${project?.id || id}`, {
        ...editFormData,
        installation_start_date: editFormData.installation_start_date || null,
        installation_end_date: editFormData.installation_end_date || null,
        completion_date: editFormData.completion_date || null,
      });
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
    if (!project || deleting || !canDelete) return;
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

  const renderStageBadge = (stageName) => <Chip size="small" label={stageName} />;

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
            {error || "The project you are looking for does not exist or may have been removed."}
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
    <ProjectWorkspace>
      <Box sx={{ width: "100%", maxWidth: "100%", mx: "auto" }}>
        {/* SECTION 1 — HEADER & BREADCRUMBS */}
        <Stack direction="row"   sx={{alignItems: "center", gap: 1.5,  mb: 1.5 }}>
          <IconButton
            size="small"
            aria-label="Back to projects"
            onClick={() => navigate(projectBasePath)}
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


              sx={{alignItems: "center", gap: 0.5,  cursor: "pointer" }}
              onClick={() => navigate(dashboardPath)}
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

        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3, boxShadow: "none" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ flex: "1 1 240px", minWidth: 0 }}>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>{project.project_number}</Typography>
              <Typography component="h1" variant="h4" sx={{ fontSize: { xs: 24, sm: 30 }, fontWeight: 700, mt: 0.5 }}>{project.customer_name}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>{[project.customer_address, project.city, project.state].filter(Boolean).join(", ") || "Site address not added"}</Typography>
            </Box>
            <Stack direction="row"  sx={{gap: 1,  flexWrap: "wrap" }}>
              {canEdit && <Button variant="outlined" startIcon={<EditIcon />} onClick={handleOpenEditDialog}>Edit details</Button>}
              {canEdit && <Button variant="contained" startIcon={<SwapHorizIcon />} onClick={handleOpenStageDialog}>Change stage</Button>}
              {canDelete && <Tooltip title="Delete project"><IconButton aria-label="Delete project" color="error" onClick={() => setDeleteConfirmOpen(true)}><DeleteIcon /></IconButton></Tooltip>}
            </Stack>
          </Box>
          <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid", borderColor: "divider", display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "2fr 1fr 1fr 1fr" }, gap: 2 }}>
            <Box><Typography variant="caption">Current milestone</Typography><Typography  sx={{fontWeight: 700,  mt: 0.5 }}>{project.stage}</Typography><LinearProgress variant="determinate" value={progressPct} aria-label="Project workflow progress" sx={{ mt: 1, maxWidth: 260, bgcolor: "#F1F5F9", "& .MuiLinearProgress-bar": { bgcolor: "#F59E0B" } }} /></Box>
            <Box><Typography variant="caption">System size</Typography><Typography  sx={{fontWeight: 700,  mt: 0.5 }}>{Number(project.system_capacity_kw || 0).toFixed(2)} kW</Typography></Box>
            <Box><Typography variant="caption">Project owner</Typography><Typography  sx={{fontWeight: 600,  mt: 0.5 }}>{project.assigned_to_name || "Unassigned"}</Typography></Box>
            <Box><Typography variant="caption">Last stage update</Typography><Typography variant="body2" sx={{ mt: 0.5 }}>{formatDate(project.stage_updated_at || project.updated_at)}</Typography></Box>
          </Box>
          {Number(project.total_cost) > 0 && <Box sx={{ mt: 2.5, p: 2, bgcolor: "#F8FAFC", borderRadius: 2, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
            {[["Contract value", Number(project.total_cost)], ["Amount received", Number(project.amount_received || 0)], ["Balance due", Math.max(0, Number(project.total_cost) - Number(project.amount_received || 0))]].map(([label, amount]) => <Box key={label}><Typography variant="caption">{label}</Typography><Typography sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", mt: 0.25 }}>{"\u20B9"}{amount.toLocaleString("en-IN")}</Typography></Box>)}
          </Box>}
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
              allowScrollButtonsMobile
              aria-label="Project sections"
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
                      <Stack sx={{ alignItems: "center", gap: 0.5 }} direction="row"  >
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
                      <Stack direction="row"   sx={{alignItems: "flex-start", gap: 0.6,  mt: 0.2 }}>
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
                      <Stack direction="row"   sx={{alignItems: "center", gap: 0.6,  mt: 0.2 }}>
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
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, flexWrap: "wrap", gap: 1.5 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: "0.9rem",
                        fontWeight: 900,
                        color: COLORS.textPrimary,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Delivery milestones
                    </Typography>
                    <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary, mt: 0.3 }}>
                      Track your delivery milestones, approvals and customer handover
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={`${progressPct}% of workflow`}
                    sx={{
                      height: 24,
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      backgroundColor: "#EFF6FF",
                      color: "#1D4ED8",
                      border: "1px solid #BFDBFE",
                    }}
                  />
                </Box>

                {/* Stepper Progress Bar */}
                <Box sx={{ mb: 2.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary }}>
                      Stage {currentStageIndex + 1} of 10: {stageConfig.label}
                    </Typography>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: stageConfig.color }}>
                      {progressPct}% of workflow
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

                            {isCurrent && nextStageCandidate && canEdit && (
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
            {!project.stage_logs?.length ? (
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
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5, flexWrap: "wrap", gap: 1 }}>
                      <Stack sx={{ alignItems: "center", gap: 1 }} direction="row"  >
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
            <PreInstallInspection project={project} projectId={project?.id || id} />
          </Box>
        )}

        {/* TAB 3: INSTALLATION PROGRESS */}
        {activeTab === 3 && (
          <Box sx={{ mt: 1 }}>
            <InstallationProgress project={project} projectId={project?.id || id} />
          </Box>
        )}

        {/* TAB 4: COMMISSIONING */}
        {activeTab === 4 && (
          <Box sx={{ mt: 1 }}>
            <Commissioning project={project} projectId={project?.id || id} />
          </Box>
        )}

        {/* TAB 5: FINAL INSPECTION */}
        {activeTab === 5 && (
          <Box sx={{ mt: 1 }}>
            <FinalInspection project={project} projectId={project?.id || id} />
          </Box>
        )}

        {/* TAB 6: CUSTOMER HANDOVER */}
        {activeTab === 6 && (
          <Box sx={{ mt: 1 }}>
            <CustomerHandover project={project} projectId={project?.id || id} />
          </Box>
        )}

        {/* TAB 7: WARRANTY & AMC */}
        {activeTab === 7 && (
          <Box sx={{ mt: 1 }}>
            <WarrantyAMC project={project} projectId={project?.id || id} />
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
                multiline
                rows={4}
                placeholder="Reason for change, approvals received, or milestone status..."
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    minHeight: "100px",
                    alignItems: "flex-start",
                  },
                }}
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
                      InputLabelProps={{ shrink: true }}
                      label="Install Start Date"
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
                      InputLabelProps={{ shrink: true }}
                      label="Install End Date"
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
                      InputLabelProps={{ shrink: true }}
                      label="Actual Handover Date"
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
                  multiline
                  rows={4}
                  placeholder="Installation notes, customer requests, or site hurdles..."
                  value={editFormData.notes}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, notes: e.target.value })
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      minHeight: "100px",
                      alignItems: "flex-start",
                    },
                  }}
                />
              </Box>

              <Divider />

              {/* Group 5: Commercial Contract & Handover Payment Sync */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      color: COLORS.primary,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Commercial Contract & Handover Payment Sync
                  </Typography>
                  <Chip
                    size="small"
                    label={
                      (() => {
                        const cost = Number(editFormData.total_cost) || 0;
                        const rec = Number(editFormData.amount_received) || 0;
                        const bal = Math.max(0, cost - rec);
                        if (cost === 0) return "Pending Valuation";
                        if (bal === 0) return "100% Paid (Handover Cleared)";
                        return `₹${bal.toLocaleString("en-IN")} Pending`;
                      })()
                    }
                    sx={{
                      height: 20,
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      bgcolor:
                        Number(editFormData.total_cost) > 0 &&
                        Math.max(0, (Number(editFormData.total_cost) || 0) - (Number(editFormData.amount_received) || 0)) === 0
                          ? "#DCFCE7"
                          : "#FEF3C7",
                      color:
                        Number(editFormData.total_cost) > 0 &&
                        Math.max(0, (Number(editFormData.total_cost) || 0) - (Number(editFormData.amount_received) || 0)) === 0
                          ? "#166534"
                          : "#92400E",
                    }}
                  />
                </Box>
                <Alert severity="info" sx={{ mb: 1.5, py: 0.3, fontSize: "0.75rem" }}>
                  Handover Lock: If Balance Due &gt; 0, Customer Handover stage completion and official handover dossiers cannot be released.
                </Alert>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Total Project Cost (₹)"
                      placeholder="e.g. 250000"
                      value={editFormData.total_cost}
                      onChange={(e) => {
                        const val = e.target.value;
                        const rec = Number(editFormData.amount_received) || 0;
                        const cost = Number(val) || 0;
                        const bal = Math.max(0, cost - rec);
                        setEditFormData({
                          ...editFormData,
                          total_cost: val,
                          payment_status: cost > 0 && bal === 0 ? "Completed" : (rec > 0 ? "Partial" : "Pending"),
                        });
                      }}
                      InputProps={{
                        startAdornment: <Typography sx={{ fontSize: "0.85rem", color: COLORS.textMuted, mr: 0.5 }}>₹</Typography>,
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Amount Received (₹)"
                      placeholder="e.g. 100000"
                      value={editFormData.amount_received}
                      onChange={(e) => {
                        const val = e.target.value;
                        const cost = Number(editFormData.total_cost) || 0;
                        const rec = Number(val) || 0;
                        const bal = Math.max(0, cost - rec);
                        setEditFormData({
                          ...editFormData,
                          amount_received: val,
                          payment_status: cost > 0 && bal === 0 ? "Completed" : (rec > 0 ? "Partial" : "Pending"),
                        });
                      }}
                      InputProps={{
                        startAdornment: <Typography sx={{ fontSize: "0.85rem", color: COLORS.textMuted, mr: 0.5 }}>₹</Typography>,
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Balance Due (Live)"
                      disabled
                      value={
                        (() => {
                          const cost = Number(editFormData.total_cost) || 0;
                          const rec = Number(editFormData.amount_received) || 0;
                          return `₹${Math.max(0, cost - rec).toLocaleString("en-IN")}`;
                        })()
                      }
                      sx={{
                        "& .MuiInputBase-input": {
                          fontWeight: 700,
                          color:
                            Math.max(0, (Number(editFormData.total_cost) || 0) - (Number(editFormData.amount_received) || 0)) > 0
                              ? "#DC2626"
                              : "#16A34A",
                        },
                      }}
                    />
                  </Grid>
                </Grid>
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
        role="alertdialog"
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
    </ProjectWorkspace>
  );
}
