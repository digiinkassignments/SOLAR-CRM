import React, { useState, useEffect, useCallback } from "react";
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
  Chip,
  Alert,
  CircularProgress,
  Snackbar,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Divider,
  Stack,
} from "@mui/material";

// Icons from @mui/icons-material
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ConstructionIcon from "@mui/icons-material/Construction";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PeopleIcon from "@mui/icons-material/People";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

// Design Palette
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
};

// Installation Phases
const PHASES = [
  "Mounting Structure",
  "Panel Installation",
  "Electrical & Wiring",
  "Inverter Installation",
  "Final Testing & Safety",
];

// Phase Chip Color Mapping
const PHASE_COLORS = {
  "Mounting Structure": "#6366F1",
  "Panel Installation": "#F59E0B",
  "Electrical & Wiring": "#EF4444",
  "Inverter Installation": "#3B82F6",
  "Final Testing & Safety": "#10B981",
};

// Lightweight custom toast hook
const useSnackbar = () => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return { snackbar, showSnackbar, hideSnackbar };
};

const initialFormState = {
  log_date: new Date().toISOString().split("T")[0],
  phase: PHASES[0],
  work_done: "",
  workers_count: "",
  hours_worked: "",
  materials_used: "",
  issues_faced: "",
  progress_percent: "",
};

export default function InstallationProgress({ project, projectId }) {
  const targetProjectId = projectId || project?.id;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [currentProgress, setCurrentProgress] = useState(0);

  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const getApiUrl = (endpoint) => {
    const base = import.meta.env?.VITE_API_BASE_URL || "/api";
    const cleanedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    return `${cleanedBase}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  };

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    if (!targetProjectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(
        getApiUrl(`/projects/${targetProjectId}/installation-logs`),
        { headers: getAuthHeader() }
      );

      const raw = res.data;
      const data = raw?.data !== undefined ? raw.data : raw;
      const logsList = Array.isArray(data?.logs)
        ? data.logs
        : Array.isArray(data)
        ? data
        : [];

      // Sort logs newest first
      logsList.sort(
        (a, b) =>
          new Date(b.log_date || b.created_at) - new Date(a.log_date || a.created_at)
      );
      setLogs(logsList);

      // Determine progress percent
      if (data?.currentProgress !== undefined) {
        setCurrentProgress(Number(data.currentProgress));
      } else if (logsList.length > 0 && logsList[0].progress_percent !== undefined && logsList[0].progress_percent !== null) {
        setCurrentProgress(Number(logsList[0].progress_percent));
      } else if (project?.progress_percent !== undefined && project?.progress_percent !== null) {
        setCurrentProgress(Number(project.progress_percent));
      } else {
        setCurrentProgress(0);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        showSnackbar(
          err.response?.data?.message || "Failed to load installation progress logs.",
          "error"
        );
      }
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [targetProjectId, project?.progress_percent, showSnackbar]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Compute Active Step in Phase Stepper based on logs or currentProgress
  const computeActiveStep = () => {
    if (currentProgress >= 100) return 5;
    if (logs.length === 0) return 0;
    const latestPhase = logs[0]?.phase;
    const phaseIdx = PHASES.indexOf(latestPhase);
    return phaseIdx >= 0 ? phaseIdx : 0;
  };

  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [lightboxImg, setLightboxImg] = useState(null);

  const handleOpenAddModal = () => {
    setEditingLogId(null);
    setSelectedPhotos([]);
    setPhotoPreviews([]);
    setFormData({
      ...initialFormState,
      log_date: new Date().toISOString().split("T")[0],
      progress_percent: currentProgress || "",
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (log) => {
    setEditingLogId(log.id);
    setSelectedPhotos([]);
    setPhotoPreviews([]);
    setFormData({
      log_date: log.log_date
        ? String(log.log_date).split("T")[0]
        : new Date().toISOString().split("T")[0],
      phase: log.phase || PHASES[0],
      work_done: log.work_done || "",
      workers_count: log.workers_count ?? "",
      hours_worked: log.hours_worked ?? "",
      materials_used: log.materials_used || "",
      issues_faced: log.issues_faced || "",
      progress_percent: log.progress_percent ?? "",
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!saving) {
      setModalOpen(false);
      setEditingLogId(null);
      setSelectedPhotos([]);
      setPhotoPreviews([]);
    }
  };

  const handleFilesSelect = (files) => {
    const validFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (validFiles.length === 0) {
      showSnackbar("Please select valid image files (JPG, PNG, WEBP).", "warning");
      return;
    }

    const totalAllowed = 5;
    const remainingSlots = totalAllowed - selectedPhotos.length;

    if (remainingSlots <= 0) {
      showSnackbar("Maximum 5 photos allowed per log entry.", "warning");
      return;
    }

    const filesToAdd = validFiles.slice(0, remainingSlots);
    if (validFiles.length > remainingSlots) {
      showSnackbar(`Only first ${remainingSlots} photo(s) added (Max 5 limit).`, "info");
    }

    const newPhotos = [...selectedPhotos, ...filesToAdd];
    setSelectedPhotos(newPhotos);

    const newPreviews = [...photoPreviews];
    filesToAdd.forEach((f) => {
      newPreviews.push({
        name: f.name,
        url: URL.createObjectURL(f),
      });
    });
    setPhotoPreviews(newPreviews);
  };

  const handleRemovePhoto = (index) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => {
      const removed = prev[index];
      if (removed?.url && removed.url.startsWith("blob:")) {
        URL.revokeObjectURL(removed.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveLog = async (e) => {
    if (e) e.preventDefault();

    if (!formData.work_done?.trim()) {
      showSnackbar("Please enter a description of work done today.", "warning");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        log_date: formData.log_date,
        phase: formData.phase,
        work_done: formData.work_done.trim(),
        workers_count:
          formData.workers_count === "" ? null : Number(formData.workers_count),
        hours_worked:
          formData.hours_worked === "" ? null : Number(formData.hours_worked),
        materials_used: formData.materials_used || null,
        issues_faced: formData.issues_faced || null,
        progress_percent:
          formData.progress_percent === ""
            ? null
            : Number(formData.progress_percent),
      };

      let targetLogId = editingLogId;

      if (editingLogId) {
        // PUT update log
        await axios.put(
          getApiUrl(`/projects/${targetProjectId}/installation-logs/${editingLogId}`),
          payload,
          { headers: getAuthHeader() }
        );
      } else {
        // POST create log
        const res = await axios.post(
          getApiUrl(`/projects/${targetProjectId}/installation-logs`),
          payload,
          { headers: getAuthHeader() }
        );
        targetLogId = res.data?.id;
      }

      // If user selected photos, upload them as multipart/form-data with field name photos
      if (selectedPhotos.length > 0 && targetLogId) {
        const photoFormData = new FormData();
        selectedPhotos.forEach((file) => {
          photoFormData.append("photos", file);
        });

        const token = localStorage.getItem("token");
        await axios.post(
          getApiUrl(`/projects/${targetProjectId}/installation-logs/${targetLogId}/photos`),
          photoFormData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      showSnackbar(
        editingLogId
          ? "Installation log updated successfully!"
          : "Daily progress log and photos saved successfully!",
        "success"
      );

      // Clean up blob preview URLs
      photoPreviews.forEach((p) => {
        if (p.url && p.url.startsWith("blob:")) {
          URL.revokeObjectURL(p.url);
        }
      });
      setSelectedPhotos([]);
      setPhotoPreviews([]);

      setModalOpen(false);
      setEditingLogId(null);
      fetchLogs();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Failed to save daily installation log.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Box sx={{ fontFamily: "Inter, sans-serif" }}>
      {/* ================= 1. TOP SECTION: PROGRESS OVERVIEW CARD ================= */}
      <Card
        elevation={0}
        sx={{
          borderRadius: "14px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.cardBg,
          p: { xs: 2.5, md: 3 },
          mb: 3,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          {/* Left stats info */}
          <Grid item xs={12} md={7}>
            <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
              <ConstructionIcon sx={{ color: COLORS.secondary, fontSize: 26 }} />
              <Typography
                sx={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: COLORS.textPrimary,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Installation Lifecycle & Execution
              </Typography>
            </Stack>
            <Typography
              sx={{
                fontSize: "0.82rem",
                color: COLORS.textSecondary,
                fontFamily: "Inter, sans-serif",
                mb: 2,
              }}
            >
              Monitor daily site developments, worker metrics, and execution phases.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: COLORS.textSecondary,
                    textTransform: "uppercase",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Start Date
                </Typography>
                <Stack direction="row" alignItems="center" gap={0.6} sx={{ mt: 0.3 }}>
                  <CalendarTodayIcon sx={{ fontSize: 13, color: COLORS.textSecondary }} />
                  <Typography
                    sx={{
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color: COLORS.textPrimary,
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {project?.installation_start_date
                      ? formatDate(project.installation_start_date)
                      : "Not Started"}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={6} sm={5}>
                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: COLORS.textSecondary,
                    textTransform: "uppercase",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Expected Completion
                </Typography>
                <Stack direction="row" alignItems="center" gap={0.6} sx={{ mt: 0.3 }}>
                  <CalendarTodayIcon sx={{ fontSize: 13, color: COLORS.textSecondary }} />
                  <Typography
                    sx={{
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color: COLORS.textPrimary,
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {project?.installation_end_date
                      ? formatDate(project.installation_end_date)
                      : "TBD"}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: COLORS.textSecondary,
                    textTransform: "uppercase",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Total Logs
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    fontFamily: "Inter, sans-serif",
                    mt: 0.3,
                  }}
                >
                  {logs.length} Entries
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Right stats & action */}
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "row", sm: "row" },
                alignItems: "center",
                justifyContent: { xs: "space-between", md: "flex-end" },
                gap: { xs: 2, sm: 4 },
                p: { xs: 1.5, sm: 2 },
                borderRadius: "12px",
                backgroundColor: COLORS.bg,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  sx={{
                    fontSize: "2.2rem",
                    fontWeight: 900,
                    color: COLORS.secondary,
                    lineHeight: 1,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {currentProgress}%
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: COLORS.textSecondary,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    fontFamily: "Inter, sans-serif",
                    mt: 0.5,
                  }}
                >
                  Complete
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAddModal}
                sx={{
                  backgroundColor: COLORS.primary,
                  color: "#FFFFFF",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  fontFamily: "Inter, sans-serif",
                  px: 2.5,
                  py: 1.1,
                  borderRadius: "8px",
                  boxShadow: "none",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    backgroundColor: "#020617",
                    boxShadow: "none",
                  },
                }}
              >
                Add Daily Log
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: COLORS.border }} />

        {/* Horizontal Phase Stepper */}
        <Box sx={{ width: "100%", overflowX: "auto", py: 0.5 }}>
          <Stepper
            activeStep={computeActiveStep()}
            alternativeLabel
            sx={{
              minWidth: { xs: 600, md: "auto" },
              "& .MuiStepLabel-label": {
                fontFamily: "Inter, sans-serif",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: COLORS.textSecondary,
                mt: 0.5,
                "&.Mui-active": {
                  color: COLORS.primary,
                  fontWeight: 800,
                },
                "&.Mui-completed": {
                  color: COLORS.success,
                  fontWeight: 700,
                },
              },
              "& .MuiStepIcon-root": {
                color: "#E2E8F0",
                "&.Mui-active": {
                  color: COLORS.secondary,
                },
                "&.Mui-completed": {
                  color: COLORS.success,
                },
              },
            }}
          >
            {PHASES.map((phaseLabel) => (
              <Step key={phaseLabel}>
                <StepLabel>{phaseLabel}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Card>

      {/* ================= 2. DAILY LOGS SECTION ================= */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography
            sx={{
              fontSize: "1rem",
              fontWeight: 700,
              color: COLORS.textPrimary,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Daily Progress Logs
          </Typography>
          <Typography
            sx={{
              fontSize: "0.78rem",
              color: COLORS.textSecondary,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Showing {logs.length} recorded update{logs.length === 1 ? "" : "s"}
          </Typography>
        </Stack>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 8,
              gap: 2,
            }}
          >
            <CircularProgress size={34} sx={{ color: COLORS.primary }} />
            <Typography
              sx={{
                fontSize: "0.85rem",
                color: COLORS.textSecondary,
                fontFamily: "Inter, sans-serif",
              }}
            >
              Loading installation logs...
            </Typography>
          </Box>
        ) : logs.length === 0 ? (
          /* Empty state */
          <Card
            elevation={0}
            sx={{
              borderRadius: "14px",
              border: `1px dashed ${COLORS.border}`,
              backgroundColor: COLORS.cardBg,
              p: 5,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "#F1F5F9",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1.5,
                color: COLORS.textSecondary,
              }}
            >
              <ConstructionIcon sx={{ fontSize: 28 }} />
            </Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "1rem",
                color: COLORS.textPrimary,
                fontFamily: "Inter, sans-serif",
                mb: 0.5,
              }}
            >
              No Daily Logs Recorded
            </Typography>
            <Typography
              sx={{
                fontSize: "0.85rem",
                color: COLORS.textSecondary,
                fontFamily: "Inter, sans-serif",
                maxWidth: 420,
                mx: "auto",
                mb: 2.5,
              }}
            >
              Start capturing field installation progress by logging daily site activities,
              material usages, and crew members.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddModal}
              sx={{
                backgroundColor: COLORS.primary,
                color: "#FFFFFF",
                textTransform: "none",
                fontWeight: 600,
                fontFamily: "Inter, sans-serif",
                borderRadius: "8px",
                px: 2.5,
                py: 0.8,
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: "#020617",
                  boxShadow: "none",
                },
              }}
            >
              Add First Daily Log
            </Button>
          </Card>
        ) : (
          /* Logs cards list */
          <Stack spacing={2}>
            {logs.map((log) => {
              const chipColor = PHASE_COLORS[log.phase] || COLORS.primary;

              return (
                <Card
                  key={log.id}
                  elevation={0}
                  sx={{
                    borderRadius: "12px",
                    border: `1px solid ${COLORS.border}`,
                    backgroundColor: COLORS.cardBg,
                    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                    "&:hover": {
                      borderColor: "#CBD5E1",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                    {/* Header Row: Date, Phase, Progress, Edit button */}
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1.5,
                        mb: 1.5,
                      }}
                    >
                      <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
                        <Typography
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.95rem",
                            color: COLORS.textPrimary,
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          {formatDate(log.log_date)}
                        </Typography>

                        <Chip
                          label={log.phase}
                          size="small"
                          sx={{
                            backgroundColor: `${chipColor}15`,
                            color: chipColor,
                            border: `1px solid ${chipColor}40`,
                            fontWeight: 700,
                            fontSize: "0.74rem",
                            fontFamily: "Inter, sans-serif",
                          }}
                        />

                        {log.progress_percent !== null && log.progress_percent !== undefined && (
                          <Chip
                            label={`${log.progress_percent}% Progress`}
                            size="small"
                            sx={{
                              backgroundColor: "#FEF3C7",
                              color: "#92400E",
                              border: "1px solid #FDE68A",
                              fontWeight: 700,
                              fontSize: "0.72rem",
                              fontFamily: "Inter, sans-serif",
                            }}
                          />
                        )}
                      </Stack>

                      <Stack direction="row" alignItems="center" gap={1}>
                        <Chip
                          icon={<PhotoCameraIcon sx={{ fontSize: "14px !important" }} />}
                          label={`${log.photos?.length || 0} Photos`}
                          size="small"
                          sx={{
                            backgroundColor: log.photos?.length > 0 ? "#EFF6FF" : "#F1F5F9",
                            color: log.photos?.length > 0 ? "#1D4ED8" : COLORS.textSecondary,
                            border: log.photos?.length > 0 ? "1px solid #BFDBFE" : `1px solid ${COLORS.border}`,
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            fontFamily: "Inter, sans-serif",
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditModal(log)}
                          sx={{
                            color: COLORS.textSecondary,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: "6px",
                            p: 0.6,
                            "&:hover": {
                              color: COLORS.primary,
                              backgroundColor: COLORS.bg,
                            },
                          }}
                        >
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Stack>
                    </Box>

                    {/* Description of work done */}
                    <Typography
                      sx={{
                        fontSize: "0.88rem",
                        color: COLORS.textPrimary,
                        lineHeight: 1.55,
                        fontFamily: "Inter, sans-serif",
                        mb: 1.8,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {log.work_done}
                    </Typography>

                    {/* Metadata stats pill row */}
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 2.5,
                        py: 1,
                        px: 1.5,
                        borderRadius: "8px",
                        backgroundColor: COLORS.bg,
                        border: `1px solid ${COLORS.border}`,
                        mb: log.issues_faced || (log.photos && log.photos.length > 0) ? 1.5 : 0,
                      }}
                    >
                      <Stack direction="row" alignItems="center" gap={0.8}>
                        <PeopleIcon sx={{ fontSize: 16, color: COLORS.textSecondary }} />
                        <Typography
                          sx={{
                            fontSize: "0.78rem",
                            color: COLORS.textSecondary,
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          Crew:{" "}
                          <strong style={{ color: COLORS.textPrimary }}>
                            {log.workers_count !== null && log.workers_count !== undefined
                              ? `${log.workers_count} Workers`
                              : "N/A"}
                          </strong>
                        </Typography>
                      </Stack>

                      <Stack direction="row" alignItems="center" gap={0.8}>
                        <AccessTimeIcon sx={{ fontSize: 16, color: COLORS.textSecondary }} />
                        <Typography
                          sx={{
                            fontSize: "0.78rem",
                            color: COLORS.textSecondary,
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          Hours:{" "}
                          <strong style={{ color: COLORS.textPrimary }}>
                            {log.hours_worked !== null && log.hours_worked !== undefined
                              ? `${log.hours_worked} hrs`
                              : "N/A"}
                          </strong>
                        </Typography>
                      </Stack>

                      {log.materials_used && (
                        <Typography
                          sx={{
                            fontSize: "0.78rem",
                            color: COLORS.textSecondary,
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          Materials:{" "}
                          <strong style={{ color: COLORS.textPrimary }}>
                            {log.materials_used}
                          </strong>
                        </Typography>
                      )}
                    </Box>

                    {/* Thumbnail strip below log entry */}
                    {log.photos && log.photos.length > 0 && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography
                          sx={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            color: COLORS.textSecondary,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            mb: 0.8,
                          }}
                        >
                          Site Photos ({log.photos.length})
                        </Typography>
                        <Stack direction="row" spacing={1.2} sx={{ overflowX: "auto", pb: 0.5 }}>
                          {log.photos.map((photo, pIdx) => {
                            const fullUrl = photo.photo_url.startsWith("http")
                              ? photo.photo_url
                              : `${getApiUrl("").replace(/\/api$/, "")}${photo.photo_url}`;
                            return (
                              <Box
                                key={photo.id || pIdx}
                                onClick={() => setLightboxImg(fullUrl)}
                                sx={{
                                  width: 72,
                                  height: 72,
                                  borderRadius: "8px",
                                  overflow: "hidden",
                                  flexShrink: 0,
                                  cursor: "pointer",
                                  border: `1px solid ${COLORS.border}`,
                                  position: "relative",
                                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                                  "&:hover": {
                                    transform: "scale(1.05)",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                                    borderColor: COLORS.primary,
                                  },
                                }}
                              >
                                <Box
                                  component="img"
                                  src={fullUrl}
                                  alt={`Log photo ${pIdx + 1}`}
                                  sx={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                  onError={(e) => {
                                    e.target.src = "https://placehold.co/100x100?text=Photo";
                                  }}
                                />
                              </Box>
                            );
                          })}
                        </Stack>
                      </Box>
                    )}

                    {/* Issues Faced Alert (Orange Alert Box) */}
                    {log.issues_faced && (
                      <Alert
                        severity="warning"
                        icon={<WarningAmberIcon sx={{ fontSize: 18 }} />}
                        sx={{
                          mt: 1.5,
                          borderRadius: "8px",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "0.82rem",
                          backgroundColor: "#FFFBEB",
                          color: "#92400E",
                          border: "1px solid #FDE68A",
                          "& .MuiAlert-icon": { color: "#D97706" },
                        }}
                      >
                        <strong>Issue Recorded: </strong>
                        {log.issues_faced}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* ================= 3. ADD/EDIT LOG MODAL DIALOG ================= */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "14px",
            backgroundColor: COLORS.cardBg,
            fontFamily: "Inter, sans-serif",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2,
            borderBottom: `1px solid ${COLORS.border}`,
            fontSize: "1.05rem",
            fontWeight: 700,
            color: COLORS.textPrimary,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {editingLogId ? "Edit Daily Installation Log" : "Add Daily Installation Log"}
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box component="form" id="installation-log-form" onSubmit={handleSaveLog} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              {/* Log Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Log Date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.log_date}
                  onChange={(e) => handleInputChange("log_date", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              {/* Phase */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontFamily: "Inter, sans-serif" }}>Installation Phase</InputLabel>
                  <Select
                    value={formData.phase}
                    label="Installation Phase"
                    onChange={(e) => handleInputChange("phase", e.target.value)}
                    sx={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {PHASES.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Work Done Today */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  multiline
                  rows={3}
                  label="Work Done Today"
                  placeholder="Describe structural progress, stringing, module cabling, earthing pits completed..."
                  value={formData.work_done}
                  onChange={(e) => handleInputChange("work_done", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              {/* Workers Count */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Workers on Site"
                  inputProps={{ min: 0 }}
                  value={formData.workers_count}
                  onChange={(e) => handleInputChange("workers_count", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              {/* Hours Worked */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Hours Worked"
                  inputProps={{ min: 0, step: "0.5" }}
                  value={formData.hours_worked}
                  onChange={(e) => handleInputChange("hours_worked", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              {/* Progress % */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Progress % (0-100)"
                  inputProps={{ min: 0, max: 100 }}
                  value={formData.progress_percent}
                  onChange={(e) => handleInputChange("progress_percent", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              {/* Materials Used */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  label="Materials Used"
                  placeholder="e.g. 24 Solar Modules, 120m DC Cable, Aluminum Clamps, 2 Earthing Electrodes..."
                  value={formData.materials_used}
                  onChange={(e) => handleInputChange("materials_used", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              {/* Issues Faced */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  label="Issues Faced"
                  placeholder="e.g. Rain delay, grid power outage, crane access restriction..."
                  value={formData.issues_faced}
                  onChange={(e) => handleInputChange("issues_faced", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              {/* Photos Upload Section */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    border: `1.5px dashed ${COLORS.border}`,
                    borderRadius: "10px",
                    backgroundColor: COLORS.bg,
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: COLORS.secondary,
                      backgroundColor: "#FFFBEB",
                    },
                  }}
                  onClick={() => document.getElementById("log-photo-input")?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer?.files) {
                      handleFilesSelect(e.dataTransfer.files);
                    }
                  }}
                >
                  <input
                    id="log-photo-input"
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files) {
                        handleFilesSelect(e.target.files);
                      }
                      e.target.value = "";
                    }}
                  />
                  <CloudUploadIcon sx={{ color: COLORS.secondary, fontSize: 32, mb: 0.5 }} />
                  <Typography
                    sx={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: COLORS.textPrimary,
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Click to upload or drag & drop site photos
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.74rem",
                      color: COLORS.textSecondary,
                      fontFamily: "Inter, sans-serif",
                      mt: 0.3,
                    }}
                  >
                    Accepts JPG, PNG, WEBP • Max 5 photos ({5 - selectedPhotos.length} slots left)
                  </Typography>
                </Box>

                {/* Photo Previews Grid (3 Columns) */}
                {photoPreviews.length > 0 && (
                  <Box sx={{ mt: 1.5 }}>
                    <Grid container spacing={1.5}>
                      {photoPreviews.map((preview, idx) => (
                        <Grid item xs={4} key={idx}>
                          <Box
                            sx={{
                              position: "relative",
                              width: "100%",
                              height: 90,
                              borderRadius: "8px",
                              overflow: "hidden",
                              border: `1px solid ${COLORS.border}`,
                              backgroundColor: "#F1F5F9",
                            }}
                          >
                            <Box
                              component="img"
                              src={preview.url}
                              alt={preview.name || `Preview ${idx + 1}`}
                              sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePhoto(idx);
                              }}
                              sx={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                width: 22,
                                height: 22,
                                backgroundColor: "rgba(15, 23, 42, 0.75)",
                                color: "#FFFFFF",
                                "&:hover": {
                                  backgroundColor: COLORS.error,
                                },
                              }}
                            >
                              <CloseIcon sx={{ fontSize: 13 }} />
                            </IconButton>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button
            onClick={handleCloseModal}
            disabled={saving}
            sx={{
              color: COLORS.textSecondary,
              textTransform: "none",
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="installation-log-form"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              backgroundColor: COLORS.primary,
              color: "#FFFFFF",
              textTransform: "none",
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              borderRadius: "8px",
              px: 2.5,
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#020617",
                boxShadow: "none",
              },
            }}
          >
            {saving ? "Saving..." : "Save Log"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= 4. FULL SIZE PHOTO LIGHTBOX MODAL ================= */}
      <Dialog
        open={Boolean(lightboxImg)}
        onClose={() => setLightboxImg(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "transparent",
            boxShadow: "none",
            overflow: "hidden",
            position: "relative",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 1,
          }}
        >
          <IconButton
            onClick={() => setLightboxImg(null)}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              color: "#FFFFFF",
              "&:hover": {
                backgroundColor: COLORS.primary,
              },
              zIndex: 10,
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
          {lightboxImg && (
            <Box
              component="img"
              src={lightboxImg}
              alt="Full size site photo"
              sx={{
                maxWidth: "100%",
                maxHeight: "85vh",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                objectFit: "contain",
              }}
            />
          )}
        </Box>
      </Dialog>

      {/* Snackbar alerts */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={hideSnackbar}
          severity={snackbar.severity}
          sx={{
            width: "100%",
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            borderRadius: "8px",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
