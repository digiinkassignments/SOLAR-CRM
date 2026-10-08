import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Chip,
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

import toast from "react-hot-toast";
import api from "../../../utils/api";

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
};

// All 9 Stages in Exact Sequential Order
const STAGES = [
  "Order Closed",
  "Procurement",
  "Pre-Install Inspection",
  "Installation In Progress",
  "Commissioning",
  "DISCOM Application",
  "Subsidy Applied",
  "Handover Done",
  "Warranty Period",
];

// Stage Chip Configs
const STAGE_CONFIG = {
  "Order Closed": {
    color: "#3B82F6",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  Procurement: {
    color: "#F97316",
    bg: "#FFF7ED",
    border: "#FED7AA",
  },
  "Pre-Install Inspection": {
    color: "#8B5CF6",
    bg: "#F5F3FF",
    border: "#DDD6FE",
  },
  "Installation In Progress": {
    color: "#F59E0B",
    bg: "#FEF3C7",
    border: "#FDE68A",
  },
  Commissioning: {
    color: "#6366F1",
    bg: "#EEF2FF",
    border: "#C7D2FE",
  },
  "DISCOM Application": {
    color: "#06B6D4",
    bg: "#ECFEFF",
    border: "#A5F3FC",
  },
  "Subsidy Applied": {
    color: "#10B981",
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
  "Handover Done": {
    color: "#059669",
    bg: "#D1FAE5",
    border: "#6EE7B7",
  },
  "Warranty Period": {
    color: "#0D9488",
    bg: "#CCFBF1",
    border: "#99F6E4",
  },
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Project Data State
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Change Stage Dialog State
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [nextStage, setNextStage] = useState("");
  const [stageNotes, setStageNotes] = useState("");
  const [updatingStage, setUpdatingStage] = useState(false);

  // Edit Project Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [updatingProject, setUpdatingProject] = useState(false);

  // Fetch Project Details by ID (for manual calls like after saving)
  const fetchProjectDetails = useCallback(async () => {
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
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/projects/${id}`);
        if (!ignore) {
          if (res.data?.success && res.data.data) {
            setProject(res.data.data);
          } else {
            setError("Project not found.");
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error("loadProject error:", err);
          setError(err.response?.data?.message || "Failed to load project details.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [id]);

  // Current Stage Index in the 9-stage pipeline
  const currentStageIndex = project ? STAGES.indexOf(project.stage) : -1;

  // Available stages for changing
  const availableNextStages = STAGES.filter((stg) => stg !== project?.stage);

  // Open Stage Change Dialog
  const handleOpenStageDialog = () => {
    const nextIdx = currentStageIndex + 1;
    const defaultNext = nextIdx < STAGES.length ? STAGES[nextIdx] : STAGES[0];
    setNextStage(defaultNext);
    setStageNotes("");
    setStageDialogOpen(true);
  };

  // Submit Stage Change
  const handleSubmitStageChange = async (e) => {
    e.preventDefault();
    if (!nextStage) return;

    setUpdatingStage(true);
    try {
      const res = await api.put(`/projects/${id}/stage`, {
        stage: nextStage,
        notes: stageNotes.trim() || undefined,
      });

      if (res.data?.success) {
        toast.success(`Stage updated to ${nextStage}!`);
        setStageDialogOpen(false);
        fetchProjectDetails();
      }
    } catch (err) {
      console.error("Change stage error:", err);
      toast.error(err.response?.data?.message || "Failed to update project stage.");
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

  const renderStageChip = (stageName) => {
    const config = STAGE_CONFIG[stageName] || {
      color: COLORS.textSecondary,
      bg: "#F1F5F9",
      border: COLORS.border,
    };

    return (
      <Chip
        label={stageName || "Order Closed"}
        size="small"
        sx={{
          color: config.color,
          backgroundColor: config.bg,
          border: `1px solid ${config.border}`,
          fontWeight: 700,
          fontSize: "0.74rem",
          height: 26,
          borderRadius: "6px",
        }}
      />
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
      <Box sx={{ p: 2.5, backgroundColor: COLORS.background, minHeight: "100vh" }}>
        <Skeleton variant="text" width={220} height={28} sx={{ mb: 1.5 }} />
        <Skeleton variant="rounded" height={80} sx={{ borderRadius: "12px", mb: 2.5 }} />
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={7}>
            <Skeleton variant="rounded" height={380} sx={{ borderRadius: "12px" }} />
          </Grid>
          <Grid item xs={12} md={5}>
            <Skeleton variant="rounded" height={380} sx={{ borderRadius: "12px" }} />
          </Grid>
          <Grid item xs={12}>
            <Skeleton variant="rounded" height={220} sx={{ borderRadius: "12px" }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  // ── ERROR STATE (Project Not Found) ──
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
            borderRadius: "14px",
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
            onClick={() => navigate("/projects")}
            sx={{
              backgroundColor: COLORS.primary,
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "6px",
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
        p: 2.5,
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
              width: 32,
              height: 32,
              borderRadius: "6px",
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
              onClick={() => navigate("/projects")}
            >
              Projects
            </Typography>
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: COLORS.primaryDark,
                fontFamily: "monospace",
              }}
            >
              {project.project_number}
            </Typography>
          </Breadcrumbs>
        </Stack>

        {/* Hero Paper */}
        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            mb: 2.5,
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 1.5,
          }}
        >
          <Box>
            <Stack direction="row" alignItems="center" gap={1.2}>
              <Box
                sx={{
                  px: 1.2,
                  py: 0.35,
                  borderRadius: "6px",
                  backgroundColor: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  color: "#1D4ED8",
                  fontWeight: 800,
                  fontSize: "0.92rem",
                  fontFamily: "monospace",
                  letterSpacing: "0.03em",
                }}
              >
                {project.project_number}
              </Box>

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: COLORS.textPrimary,
                  fontSize: "1.15rem",
                }}
              >
                {project.customer_name}
              </Typography>

              {renderStageChip(project.stage)}
            </Stack>
            <Typography
              variant="body2"
              sx={{
                color: COLORS.textSecondary,
                fontSize: "0.76rem",
                mt: 0.5,
              }}
            >
              Created on {formatDate(project.created_at)} • Last stage updated:{" "}
              {formatDateTime(project.stage_updated_at || project.updated_at)}
            </Typography>
          </Box>

          <Stack direction="row" alignItems="center" gap={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon sx={{ fontSize: 16 }} />}
              onClick={handleOpenEditDialog}
              sx={{
                height: 36,
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.78rem",
                px: 1.8,
                borderColor: COLORS.border,
                color: COLORS.textPrimary,
                backgroundColor: "#FFFFFF",
                "&:hover": {
                  borderColor: COLORS.primary,
                  backgroundColor: "#F8FAFC",
                },
              }}
            >
              Edit Project
            </Button>

            <Button
              variant="contained"
              size="small"
              startIcon={<SwapHorizIcon sx={{ fontSize: 17 }} />}
              onClick={handleOpenStageDialog}
              sx={{
                height: 36,
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.78rem",
                px: 2,
                backgroundColor: COLORS.secondary,
                color: "#FFFFFF",
                "&:hover": { backgroundColor: "#D97706" },
              }}
            >
              Change Stage
            </Button>
          </Stack>
        </Paper>

        {/* SECTION 2 — INFO GRID (2 Columns) */}
        <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
          {/* Left Column — Customer & System Info */}
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: "12px",
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.card,
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {/* Customer Profile */}
              <Box>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    color: COLORS.textSecondary,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    mb: 1.5,
                  }}
                >
                  Customer & Site Details
                </Typography>

                <Grid container spacing={1.8}>
                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                      Customer Name
                    </Typography>
                    <Typography sx={{ fontSize: "0.86rem", fontWeight: 700, color: COLORS.textPrimary }}>
                      {project.customer_name}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                      Mobile Contact
                    </Typography>
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <PhoneIcon sx={{ fontSize: 14, color: COLORS.textMuted }} />
                      <Typography
                        component="a"
                        href={`tel:${project.customer_phone}`}
                        sx={{
                          fontSize: "0.86rem",
                          fontWeight: 700,
                          color: "#1D4ED8",
                          textDecoration: "none",
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        {project.customer_phone}
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                      Installation Site Address
                    </Typography>
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <LocationOnIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                      <Typography sx={{ fontSize: "0.82rem", color: COLORS.textPrimary }}>
                        {[
                          project.customer_address,
                          project.city,
                          project.state,
                          project.pincode,
                        ]
                          .filter(Boolean)
                          .join(", ") || "No address provided"}
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ borderColor: COLORS.border }} />

              {/* Technical Solar System Info */}
              <Box>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    color: COLORS.textSecondary,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    mb: 1.5,
                  }}
                >
                  Solar System Configuration
                </Typography>

                <Grid container spacing={1.8}>
                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                      Capacity kW
                    </Typography>
                    <Chip
                      icon={<SolarPowerIcon sx={{ fontSize: "14px !important", color: "#B45309 !important" }} />}
                      label={`${parseFloat(project.system_capacity_kw || 1).toFixed(2)} kW`}
                      size="small"
                      sx={{
                        mt: 0.3,
                        fontWeight: 800,
                        fontSize: "0.76rem",
                        backgroundColor: "#FEF3C7",
                        color: "#92400E",
                        border: "1px solid #FDE68A",
                        borderRadius: "6px",
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                      Panel Count
                    </Typography>
                    <Typography sx={{ fontSize: "0.86rem", fontWeight: 700, color: COLORS.textPrimary, mt: 0.3 }}>
                      {project.panel_count ? `${project.panel_count} Panels` : "—"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                      Inverter Capacity
                    </Typography>
                    <Typography sx={{ fontSize: "0.86rem", fontWeight: 700, color: COLORS.textPrimary, mt: 0.3 }}>
                      {project.inverter_kw ? `${parseFloat(project.inverter_kw).toFixed(2)} kW` : "—"}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ borderColor: COLORS.border }} />

              {/* Assignment & Key Dates */}
              <Box>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    color: COLORS.textSecondary,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    mb: 1.5,
                  }}
                >
                  Project Operations & Schedule
                </Typography>

                <Grid container spacing={1.8}>
                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                      Assigned Representative
                    </Typography>
                    <Stack direction="row" alignItems="center" gap={0.6} sx={{ mt: 0.3 }}>
                      <PersonIcon sx={{ fontSize: 16, color: COLORS.textMuted }} />
                      <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, color: COLORS.textPrimary }}>
                        {project.assigned_to_name || "Unassigned"}
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                      Installation Start Date
                    </Typography>
                    <Stack direction="row" alignItems="center" gap={0.6} sx={{ mt: 0.3 }}>
                      <CalendarTodayIcon sx={{ fontSize: 14, color: COLORS.textMuted }} />
                      <Typography sx={{ fontSize: "0.84rem", fontWeight: 600, color: COLORS.textPrimary }}>
                        {formatDate(project.installation_start_date)}
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                      Installation End Date
                    </Typography>
                    <Stack direction="row" alignItems="center" gap={0.6} sx={{ mt: 0.3 }}>
                      <CalendarTodayIcon sx={{ fontSize: 14, color: COLORS.textMuted }} />
                      <Typography sx={{ fontSize: "0.84rem", fontWeight: 600, color: COLORS.textPrimary }}>
                        {formatDate(project.installation_end_date)}
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                      Project Completion Date
                    </Typography>
                    <Stack direction="row" alignItems="center" gap={0.6} sx={{ mt: 0.3 }}>
                      <CalendarTodayIcon sx={{ fontSize: 14, color: COLORS.textMuted }} />
                      <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, color: "#16A34A" }}>
                        {formatDate(project.completion_date)}
                      </Typography>
                    </Stack>
                  </Grid>

                  {project.notes && (
                    <Grid item xs={12}>
                      <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                        Installation Notes
                      </Typography>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          mt: 0.4,
                          borderRadius: "8px",
                          backgroundColor: "#F8FAFC",
                          border: `1px solid ${COLORS.border}`,
                          fontSize: "0.78rem",
                          color: COLORS.textSecondary,
                        }}
                      >
                        {project.notes}
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Paper>
          </Grid>

          {/* Right Column — Project Timeline (Vertical Stepper) */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: "12px",
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.card,
                height: "100%",
                boxSizing: "border-box",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  color: COLORS.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  mb: 2.5,
                }}
              >
                Project Pipeline Stages
              </Typography>

              <Box sx={{ position: "relative", pl: 1 }}>
                {STAGES.map((stageName, index) => {
                  const isCompleted = index < currentStageIndex;
                  const isCurrent = index === currentStageIndex;
                  const isLast = index === STAGES.length - 1;

                  const matchingLog = project.stage_logs?.find(
                    (l) => l.to_stage === stageName
                  );

                  return (
                    <Box
                      key={stageName}
                      sx={{
                        position: "relative",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.8,
                        pb: isLast ? 0 : 2.5,
                      }}
                    >
                      {/* Vertical Connecting Line */}
                      {!isLast && (
                        <Box
                          sx={{
                            position: "absolute",
                            left: 11,
                            top: 24,
                            bottom: 0,
                            width: 2,
                            backgroundColor: isCompleted
                              ? "#16A34A"
                              : isCurrent
                              ? "#FDE68A"
                              : "#E2E8F0",
                            transition: "background-color 0.2s ease",
                          }}
                        />
                      )}

                      {/* Stage Node Icon */}
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 1,
                          backgroundColor: "#FFFFFF",
                        }}
                      >
                        {isCompleted ? (
                          <CheckCircleIcon sx={{ fontSize: 22, color: "#16A34A" }} />
                        ) : isCurrent ? (
                          <RadioButtonCheckedIcon
                            sx={{
                              fontSize: 22,
                              color: "#F59E0B",
                              animation: "pulse 1.8s infinite",
                              "@keyframes pulse": {
                                "0%": { transform: "scale(0.95)" },
                                "50%": { transform: "scale(1.15)" },
                                "100%": { transform: "scale(0.95)" },
                              },
                            }}
                          />
                        ) : (
                          <RadioButtonUncheckedIcon sx={{ fontSize: 22, color: "#CBD5E1" }} />
                        )}
                      </Box>

                      {/* Stage Content */}
                      <Box sx={{ flex: 1, pt: 0.2 }}>
                        <Typography
                          sx={{
                            fontSize: "0.82rem",
                            fontWeight: isCurrent ? 800 : isCompleted ? 700 : 500,
                            color: isCurrent
                              ? "#D97706"
                              : isCompleted
                              ? COLORS.textPrimary
                              : COLORS.textMuted,
                          }}
                        >
                          {stageName}
                        </Typography>

                        {/* Stage Timestamp if available */}
                        {isCurrent ? (
                          <Typography
                            sx={{
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              color: "#F59E0B",
                              mt: 0.2,
                            }}
                          >
                            Active Stage • Updated{" "}
                            {formatDateTime(project.stage_updated_at || project.updated_at)}
                          </Typography>
                        ) : matchingLog?.created_at ? (
                          <Typography
                            sx={{
                              fontSize: "0.7rem",
                              color: COLORS.textMuted,
                              mt: 0.2,
                            }}
                          >
                            Reached on {formatDateTime(matchingLog.created_at)}
                          </Typography>
                        ) : isCompleted ? (
                          <Typography
                            sx={{
                              fontSize: "0.7rem",
                              color: "#16A34A",
                              mt: 0.2,
                            }}
                          >
                            Completed
                          </Typography>
                        ) : (
                          <Typography
                            sx={{
                              fontSize: "0.7rem",
                              color: COLORS.textMuted,
                              mt: 0.2,
                            }}
                          >
                            Pending
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* SECTION 3 — STAGE LOGS HISTORY */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Stack direction="row" alignItems="center" gap={1}>
              <HistoryIcon sx={{ fontSize: 20, color: COLORS.textSecondary }} />
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  color: COLORS.textPrimary,
                }}
              >
                Stage Change History
              </Typography>
              <Chip
                label={`${project.stage_logs?.length || 0} logs`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  bgcolor: "#F1F5F9",
                }}
              />
            </Stack>
          </Stack>

          {!project.stage_logs || project.stage_logs.length === 0 ? (
            <Box
              sx={{
                py: 4,
                textAlign: "center",
                color: COLORS.textMuted,
              }}
            >
              <Typography sx={{ fontSize: "0.82rem" }}>
                No stage change logs recorded yet for this project.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {project.stage_logs.map((log) => (
                <Paper
                  key={log.id}
                  elevation={0}
                  sx={{
                    p: 1.8,
                    borderRadius: "8px",
                    border: `1px solid ${COLORS.border}`,
                    backgroundColor: "#F8FAFC",
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "space-between",
                    alignItems: { xs: "flex-start", sm: "center" },
                    gap: 1.2,
                  }}
                >
                  <Box>
                    <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                      {log.from_stage ? (
                        <>
                          {renderStageChip(log.from_stage)}
                          <ArrowForwardIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                        </>
                      ) : (
                        <Chip
                          label="Initial Stage"
                          size="small"
                          sx={{
                            fontSize: "0.68rem",
                            height: 22,
                            bgcolor: "#E2E8F0",
                            color: COLORS.textSecondary,
                            fontWeight: 700,
                          }}
                        />
                      )}
                      {renderStageChip(log.to_stage)}
                    </Stack>

                    {log.notes && (
                      <Typography
                        sx={{
                          fontSize: "0.78rem",
                          color: COLORS.textSecondary,
                          mt: 0.8,
                          fontStyle: "italic",
                        }}
                      >
                        "{log.notes}"
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: COLORS.textPrimary,
                      }}
                    >
                      {log.changed_by_name || log.name || "System Rep"}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.7rem",
                        color: COLORS.textMuted,
                      }}
                    >
                      {formatDateTime(log.created_at)}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>

      {/* SECTION 4 — CHANGE STAGE DIALOG */}
      <Dialog
        open={stageDialogOpen}
        onClose={() => !updatingStage && setStageDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "14px", p: 1 },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            fontSize: "1.05rem",
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
          <DialogContent dividers sx={{ borderColor: COLORS.border }}>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted, mb: 0.5 }}>
                Current Stage
              </Typography>
              {renderStageChip(project.stage)}
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography
                sx={{
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  color: COLORS.textSecondary,
                  mb: 0.5,
                }}
              >
                Select New Stage *
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={nextStage}
                  onChange={(e) => setNextStage(e.target.value)}
                  sx={{ borderRadius: "6px" }}
                >
                  {availableNextStages.map((stg) => (
                    <MenuItem key={stg} value={stg}>
                      {stg}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  color: COLORS.textSecondary,
                  mb: 0.5,
                }}
              >
                Remarks / Stage Notes (Optional)
              </Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                placeholder="Reason for change or update notes..."
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 1.5 }}>
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
                "&:hover": { backgroundColor: "#D97706" },
              }}
            >
              {updatingStage ? "Updating..." : "Update Stage"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* EDIT PROJECT DIALOG */}
      <Dialog
        open={editDialogOpen}
        onClose={() => !updatingProject && setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "14px", p: 1 },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            fontSize: "1.05rem",
            color: COLORS.textPrimary,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Edit Project Details
          <IconButton
            size="small"
            onClick={() => setEditDialogOpen(false)}
            disabled={updatingProject}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmitEdit}>
          <DialogContent dividers sx={{ borderColor: COLORS.border }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.4 }}>
                  Customer Name *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  required
                  value={editFormData.customer_name || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, customer_name: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.4 }}>
                  Customer Phone *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  required
                  value={editFormData.customer_phone || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, customer_phone: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.4 }}>
                  System Capacity (kW)
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  step="0.1"
                  value={editFormData.system_capacity_kw || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, system_capacity_kw: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.4 }}>
                  Panel Count
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={editFormData.panel_count || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, panel_count: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.4 }}>
                  Inverter (kW)
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  step="0.1"
                  value={editFormData.inverter_kw || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, inverter_kw: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.4 }}>
                  City
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={editFormData.city || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, city: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.4 }}>
                  State
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={editFormData.state || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, state: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.4 }}>
                  Pincode
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={editFormData.pincode || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, pincode: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.4 }}>
                  Site Address
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={editFormData.customer_address || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, customer_address: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.4 }}>
                  Install Start Date
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={editFormData.installation_start_date || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, installation_start_date: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.4 }}>
                  Install End Date
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={editFormData.installation_end_date || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, installation_end_date: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.4 }}>
                  Completion Date
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={editFormData.completion_date || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, completion_date: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.4 }}>
                  Notes
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  value={editFormData.notes || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, notes: e.target.value })
                  }
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 1.5 }}>
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
                "&:hover": { backgroundColor: "#020617" },
              }}
            >
              {updatingProject ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
