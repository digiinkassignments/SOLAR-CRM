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
  IconButton,
  Divider,
  Stack,
  Checkbox,
  FormControlLabel,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

// Icons from @mui/icons-material
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ConstructionIcon from "@mui/icons-material/Construction";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PeopleIcon from "@mui/icons-material/People";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import SecurityIcon from "@mui/icons-material/Security";
import VerifiedIcon from "@mui/icons-material/Verified";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import SpeedIcon from "@mui/icons-material/Speed";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";

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
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
};

// 5 Industry-Standard Solar Installation Execution Phases
export const INSTALLATION_PHASES = [
  "Structure",
  "Panels",
  "Inverter & Electrical",
  "Earthing & Protection",
  "Testing",
];

export const PHASE_CONFIG = {
  Structure: {
    label: "Structure",
    fullName: "Mounting Structure & Civil Foundation",
    color: "#6366F1",
    bg: "#EEF2FF",
    border: "#C7D2FE",
    targetProgress: 20,
    desc: "Leg mounting, base plates, anchoring & torque check",
  },
  Panels: {
    label: "Panels",
    fullName: "Module Placement & DC Cabling",
    color: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FDE68A",
    targetProgress: 45,
    desc: "Solar panel clamping, string formation & DC wiring",
  },
  "Inverter & Electrical": {
    label: "Inverter & Electrical",
    fullName: "Inverter Mounting & AC/DC DBs",
    color: "#3B82F6",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    targetProgress: 70,
    desc: "Inverter mounting, conduit pipes, ACDB/DCDB connection",
  },
  "Earthing & Protection": {
    label: "Earthing & Protection",
    fullName: "Chemical Earthing & Lightning Arrestor",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    targetProgress: 85,
    desc: "Earthing pits, copper bonded rods, LA spike & strip",
  },
  Testing: {
    label: "Testing",
    fullName: "Pre-Commissioning Testing & Polarity",
    color: "#10B981",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    targetProgress: 100,
    desc: "Megger insulation test, Voc check, inverter power-on test",
  },
};

// Clean Date Formatter: "04 Nov 2026"
const formatCleanDate = (dateVal) => {
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

// Custom lightweight toast hook
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

export default function InstallationProgress({ project, projectId }) {
  const targetProjectId = projectId || project?.id;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [completedPhases, setCompletedPhases] = useState([]);

  // Expected Completion Date Dialog State
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [newTargetDate, setNewTargetDate] = useState("");
  const [savingDate, setSavingDate] = useState(false);
  const [localProjectDates, setLocalProjectDates] = useState({
    start: project?.installation_start_date || "",
    end: project?.installation_end_date || "",
  });

  // Photos & Lightbox State
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    log_date: new Date().toISOString().split("T")[0],
    phase: INSTALLATION_PHASES[0],
    is_phase_completed: false,
    work_done: "",
    workers_count: "",
    hours_worked: "",
    supervisor_name: "",
    crew_names: "",
    materials_list: [], // structured rows: [{ item: "", quantity: "", unit: "Nos" }]
    issues_faced: "",
    progress_percent: "",
    weather: "Sunny / Clear",
    safety_checklist: {
      harness: false,
      helmet: false,
      shoes: false,
      lifeline: false,
    },
    supervisor_signoff: false,
  });

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

  // Fetch installation logs from backend
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
      } else if (logsList.length > 0 && logsList[0].progress_percent !== null && logsList[0].progress_percent !== undefined) {
        setCurrentProgress(Number(logsList[0].progress_percent));
      } else {
        setCurrentProgress(0);
      }

      // Determine completed phases
      if (Array.isArray(data?.completedPhases)) {
        setCompletedPhases(data.completedPhases);
      } else {
        const comp = logsList
          .filter((l) => l.is_phase_completed === 1 || l.is_phase_completed === true)
          .map((l) => l.phase);
        setCompletedPhases([...new Set(comp)]);
      }

      // Check auto start date if project has none
      if (!localProjectDates.start && logsList.length > 0) {
        const earliest = logsList[logsList.length - 1]?.log_date;
        if (earliest) {
          setLocalProjectDates((prev) => ({ ...prev, start: earliest }));
        }
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
  }, [targetProjectId, localProjectDates.start, showSnackbar]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Handle open Add Modal
  const handleOpenAddModal = () => {
    setEditingLogId(null);
    setSelectedPhotos([]);
    setPhotoPreviews([]);

    // Auto-select the next uncompleted phase
    const nextPhase =
      INSTALLATION_PHASES.find((p) => !completedPhases.includes(p)) ||
      INSTALLATION_PHASES[0];

    const targetPct = PHASE_CONFIG[nextPhase]?.targetProgress || currentProgress || 10;

    setFormData({
      log_date: new Date().toISOString().split("T")[0],
      phase: nextPhase,
      is_phase_completed: false,
      work_done: "",
      workers_count: "",
      hours_worked: "8",
      supervisor_name: "",
      crew_names: "",
      materials_list: [{ item: "", quantity: "", unit: "Nos" }],
      issues_faced: "",
      progress_percent: targetPct,
      weather: "Sunny / Clear",
      safety_checklist: {
        harness: true,
        helmet: true,
        shoes: true,
        lifeline: true,
      },
      supervisor_signoff: true,
    });
    setModalOpen(true);
  };

  // Handle open Edit Modal
  const handleOpenEditModal = (log) => {
    setEditingLogId(log.id);
    setSelectedPhotos([]);
    setPhotoPreviews([]);

    // Map materials
    let mats = [];
    if (Array.isArray(log.materials_list)) {
      mats = log.materials_list;
    } else if (log.materials_used) {
      mats = [{ item: log.materials_used, quantity: 1, unit: "Nos" }];
    } else {
      mats = [{ item: "", quantity: "", unit: "Nos" }];
    }

    // Map safety
    const sc = log.safety_checklist || {};

    setFormData({
      log_date: log.log_date
        ? String(log.log_date).split("T")[0]
        : new Date().toISOString().split("T")[0],
      phase: log.phase || INSTALLATION_PHASES[0],
      is_phase_completed: log.is_phase_completed === 1 || log.is_phase_completed === true,
      work_done: log.work_done || "",
      workers_count: log.workers_count ?? "",
      hours_worked: log.hours_worked ?? "",
      supervisor_name: log.supervisor_name || "",
      crew_names: log.crew_names || "",
      materials_list: mats.length > 0 ? mats : [{ item: "", quantity: "", unit: "Nos" }],
      issues_faced: log.issues_faced || "",
      progress_percent: log.progress_percent ?? "",
      weather: log.weather || "Sunny / Clear",
      safety_checklist: {
        harness: Boolean(sc.harness),
        helmet: Boolean(sc.helmet),
        shoes: Boolean(sc.shoes),
        lifeline: Boolean(sc.lifeline),
      },
      supervisor_signoff: log.supervisor_signoff === 1 || log.supervisor_signoff === true,
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

  // Photo selection (up to 10 photos with captions & tags)
  const handleFilesSelect = (files) => {
    const validFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (validFiles.length === 0) {
      showSnackbar("Please select valid image files (JPG, PNG, WEBP).", "warning");
      return;
    }

    const totalAllowed = 10;
    const remainingSlots = totalAllowed - selectedPhotos.length;

    if (remainingSlots <= 0) {
      showSnackbar("Maximum 10 site photos allowed per daily log.", "warning");
      return;
    }

    const filesToAdd = validFiles.slice(0, remainingSlots);
    if (validFiles.length > remainingSlots) {
      showSnackbar(`Only first ${remainingSlots} photo(s) added (Max 10 limit).`, "info");
    }

    const newPhotos = [...selectedPhotos, ...filesToAdd];
    setSelectedPhotos(newPhotos);

    const newPreviews = [...photoPreviews];
    filesToAdd.forEach((f) => {
      newPreviews.push({
        name: f.name,
        url: URL.createObjectURL(f),
        caption: "",
        tag: "During",
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

  const handleUpdatePhotoMeta = (index, field, value) => {
    setPhotoPreviews((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  // Materials rows management
  const handleAddMaterialRow = () => {
    setFormData((prev) => ({
      ...prev,
      materials_list: [...prev.materials_list, { item: "", quantity: "", unit: "Nos" }],
    }));
  };

  const handleRemoveMaterialRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      materials_list: prev.materials_list.filter((_, i) => i !== index),
    }));
  };

  const handleMaterialChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.materials_list];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, materials_list: updated };
    });
  };

  // Form field changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // When phase changes, suggest target progress percent
      if (field === "phase" && PHASE_CONFIG[value]) {
        updated.progress_percent = PHASE_CONFIG[value].targetProgress;
      }
      return updated;
    });
  };

  const handleSafetyToggle = (key) => {
    setFormData((prev) => ({
      ...prev,
      safety_checklist: {
        ...prev.safety_checklist,
        [key]: !prev.safety_checklist[key],
      },
    }));
  };

  // Save Daily Log
  const handleSaveLog = async (e) => {
    if (e) e.preventDefault();

    if (!formData.work_done?.trim()) {
      showSnackbar("Please enter a description of Work Done Today.", "warning");
      return;
    }
    if (formData.progress_percent === "" || isNaN(Number(formData.progress_percent))) {
      showSnackbar("Please enter valid Overall Progress % (0 - 100).", "warning");
      return;
    }

    try {
      setSaving(true);
      // Clean materials list
      const cleanMaterials = formData.materials_list.filter(
        (m) => m.item && m.item.trim()
      );

      const payload = {
        log_date: formData.log_date,
        phase: formData.phase,
        is_phase_completed: formData.is_phase_completed ? 1 : 0,
        work_done: formData.work_done.trim(),
        workers_count: formData.workers_count === "" ? 0 : Number(formData.workers_count),
        hours_worked: formData.hours_worked === "" ? 0 : Number(formData.hours_worked),
        supervisor_name: formData.supervisor_name.trim() || null,
        crew_names: formData.crew_names.trim() || null,
        materials_list: cleanMaterials,
        materials_used: cleanMaterials
          .map((m) => `${m.quantity || 1} ${m.unit || "Nos"} ${m.item}`)
          .join(", ") || null,
        issues_faced: formData.issues_faced.trim() || null,
        progress_percent: Math.min(100, Math.max(0, Number(formData.progress_percent))),
        weather: formData.weather,
        safety_checklist: formData.safety_checklist,
        supervisor_signoff: formData.supervisor_signoff ? 1 : 0,
        supervisor_signoff_time: formData.supervisor_signoff ? new Date().toISOString() : null,
      };

      let targetLogId = editingLogId;

      if (editingLogId) {
        await axios.put(
          getApiUrl(`/projects/${targetProjectId}/installation-logs/${editingLogId}`),
          payload,
          { headers: getAuthHeader() }
        );
      } else {
        const res = await axios.post(
          getApiUrl(`/projects/${targetProjectId}/installation-logs`),
          payload,
          { headers: getAuthHeader() }
        );
        targetLogId = res.data?.id;
      }

      // Upload selected photos (up to 10) with metadata captions
      if (selectedPhotos.length > 0 && targetLogId) {
        const photoFormData = new FormData();
        selectedPhotos.forEach((file) => {
          photoFormData.append("photos", file);
        });

        // Pass metadata captions array as JSON
        const captionsMeta = photoPreviews.map((p) => ({
          caption: p.caption || "",
          tag: p.tag || "During",
        }));
        photoFormData.append("captions", JSON.stringify(captionsMeta));

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
          : "Daily installation progress log saved successfully!",
        "success"
      );

      // Revoke blobs
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

  // Quick Target Completion Date Update
  const handleSaveTargetDate = async () => {
    if (!newTargetDate) {
      showSnackbar("Please select a target date.", "warning");
      return;
    }
    setSavingDate(true);
    try {
      await axios.put(
        getApiUrl(`/projects/${targetProjectId}`),
        { installation_end_date: newTargetDate },
        { headers: getAuthHeader() }
      );
      setLocalProjectDates((prev) => ({ ...prev, end: newTargetDate }));
      showSnackbar("Expected Completion Date updated successfully!", "success");
      setDateDialogOpen(false);
    } catch (err) {
      showSnackbar("Failed to update expected completion date.", "error");
    } finally {
      setSavingDate(false);
    }
  };

  // Calculate earliest log date for start date fallback
  const autoStartDate =
    localProjectDates.start ||
    (logs.length > 0 ? logs[logs.length - 1]?.log_date : null);

  return (
    <Box>
      {/* ============================================================== */}
      {/* 1. TOP HEADER: LIFECYCLE SUMMARY & PHASE MILESTONES            */}
      {/* ============================================================== */}
      <Card
        elevation={0}
        sx={{
          borderRadius: "14px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.cardBg,
          p: { xs: 2, sm: 2.5 },
          mb: 3,
        }}
      >
        <Grid container spacing={2.5} alignItems="center">
          {/* Left stats info */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Stack direction="row" alignItems="center" gap={1.2} sx={{ mb: 0.5 }}>
              <ConstructionIcon sx={{ color: COLORS.secondary, fontSize: 24 }} />
              <Typography sx={{ fontSize: "1.05rem", fontWeight: 800, color: COLORS.textPrimary }}>
                Installation Execution & Daily Site Progress
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary, mb: 2 }}>
              Track daily field developments, crew attendance, material consumption, and safety adherence.
            </Typography>

            <Grid container spacing={2}>
              {/* Start Date (Auto-filled from Log 1 if not set) */}
              <Grid size={{ xs: 6, sm: 4 }}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  Start Date
                </Typography>
                <Stack direction="row" alignItems="center" gap={0.6} sx={{ mt: 0.3 }}>
                  <CalendarTodayIcon sx={{ fontSize: 13, color: COLORS.textSecondary }} />
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.textPrimary }}>
                    {formatCleanDate(autoStartDate)}
                  </Typography>
                </Stack>
              </Grid>

              {/* Expected Completion Date (Settable before work begins) */}
              <Grid size={{ xs: 6, sm: 5 }}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  Target Completion
                </Typography>
                <Stack direction="row" alignItems="center" gap={0.6} sx={{ mt: 0.3 }}>
                  <CalendarTodayIcon sx={{ fontSize: 13, color: COLORS.textSecondary }} />
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.textPrimary }}>
                    {formatCleanDate(localProjectDates.end)}
                  </Typography>
                  <Tooltip title="Set or change target delivery date">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setNewTargetDate(localProjectDates.end ? localProjectDates.end.slice(0, 10) : "");
                        setDateDialogOpen(true);
                      }}
                      sx={{ p: 0.2, color: "#2563EB" }}
                    >
                      <EditCalendarIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Grid>

              {/* Total Logs */}
              <Grid size={{ xs: 12, sm: 3 }}>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  Field Logs
                </Typography>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: COLORS.textPrimary, mt: 0.3 }}>
                  {logs.length} Entries
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Right progress dial & add log button */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: { xs: "space-between", md: "flex-end" },
                gap: { xs: 2, sm: 3 },
                p: 2,
                borderRadius: "12px",
                backgroundColor: COLORS.bg,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <Box sx={{ textAlign: "center" }}>
                <Typography sx={{ fontSize: "2rem", fontWeight: 900, color: COLORS.secondary, lineHeight: 1 }}>
                  {currentProgress}%
                </Typography>
                <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: COLORS.textSecondary, textTransform: "uppercase", mt: 0.5 }}>
                  Overall Progress
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
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  px: 2.5,
                  py: 1,
                  borderRadius: "8px",
                  "&:hover": { backgroundColor: "#020617" },
                }}
              >
                Log Today's Work
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5, borderColor: COLORS.border }} />

        {/* 5-PHASE INTERACTIVE MILESTONE STEPPER */}
        <Box>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", mb: 1.5 }}>
            5-Stage Solar Engineering Sequence
          </Typography>

          <Grid container spacing={1.5}>
            {INSTALLATION_PHASES.map((phaseKey, idx) => {
              const cfg = PHASE_CONFIG[phaseKey];
              const isCompleted = completedPhases.includes(phaseKey);
              // Active is the first uncompleted phase
              const isCurrent = !isCompleted && completedPhases.length === idx;

              return (
                <Grid size={{ xs: 12, sm: 6, md: 2 }} key={phaseKey}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "10px",
                      backgroundColor: isCompleted ? "#ECFDF5" : isCurrent ? cfg.bg : "#F8FAFC",
                      border: `1px solid ${isCompleted ? "#A7F3D0" : isCurrent ? cfg.border : COLORS.border}`,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.8 }}>
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isCompleted ? "#10B981" : isCurrent ? cfg.color : "#E2E8F0",
                          color: "#FFFFFF",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                        }}
                      >
                        {isCompleted ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : idx + 1}
                      </Box>

                      {isCompleted ? (
                        <Chip
                          label="Completed"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            backgroundColor: "#D1FAE5",
                            color: "#065F46",
                          }}
                        />
                      ) : isCurrent ? (
                        <Chip
                          label="In Progress"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            backgroundColor: cfg.color,
                            color: "#FFFFFF",
                          }}
                        />
                      ) : (
                        <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted, fontWeight: 600 }}>
                          Pending
                        </Typography>
                      )}
                    </Stack>

                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: COLORS.textPrimary }}>
                      {cfg.label}
                    </Typography>
                    <Typography sx={{ fontSize: "0.7rem", color: COLORS.textSecondary, mt: 0.3 }}>
                      {cfg.fullName}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Card>

      {/* ============================================================== */}
      {/* 2. DAILY PROGRESS LOGS LIST                                    */}
      {/* ============================================================== */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: "1.05rem", fontWeight: 800, color: COLORS.textPrimary }}>
            Daily Field Logs & Timeline ({logs.length})
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={handleOpenAddModal}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.78rem",
              color: COLORS.primary,
            }}
          >
            Add New Entry
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, gap: 2 }}>
            <CircularProgress size={32} sx={{ color: COLORS.primary }} />
            <Typography sx={{ fontSize: "0.82rem", color: COLORS.textSecondary }}>
              Loading site installation logs...
            </Typography>
          </Box>
        ) : logs.length === 0 ? (
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
                width: 52,
                height: 52,
                borderRadius: "50%",
                backgroundColor: "#EFF6FF",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1.5,
                color: "#2563EB",
              }}
            >
              <ConstructionIcon sx={{ fontSize: 26 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: COLORS.textPrimary, mb: 0.5 }}>
              No Daily Installation Logs Recorded Yet
            </Typography>
            <Typography sx={{ fontSize: "0.82rem", color: COLORS.textSecondary, maxWidth: 440, mx: "auto", mb: 2.5 }}>
              Record today's structural or electrical milestones, worker headcounts, materials consumed, and site photos.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddModal}
              sx={{
                backgroundColor: COLORS.primary,
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "8px",
                px: 2.5,
              }}
            >
              Add First Daily Log
            </Button>
          </Card>
        ) : (
          <Stack spacing={2}>
            {logs.map((log) => {
              const cfg = PHASE_CONFIG[log.phase] || PHASE_CONFIG["Structure"];
              const materials = Array.isArray(log.materials_list)
                ? log.materials_list
                : log.materials_used
                ? [{ item: log.materials_used }]
                : [];

              return (
                <Card
                  key={log.id}
                  elevation={0}
                  sx={{
                    borderRadius: "12px",
                    border: `1px solid ${COLORS.border}`,
                    backgroundColor: COLORS.cardBg,
                    transition: "box-shadow 0.2s ease",
                    "&:hover": { boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                    {/* Header Row */}
                    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1.5, mb: 1.5 }}>
                      <Stack direction="row" alignItems="center" gap={1.2} flexWrap="wrap">
                        <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: COLORS.textPrimary }}>
                          {formatCleanDate(log.log_date)}
                        </Typography>

                        <Chip
                          label={cfg.fullName || log.phase}
                          size="small"
                          sx={{
                            backgroundColor: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${cfg.border}`,
                            fontWeight: 800,
                            fontSize: "0.72rem",
                          }}
                        />

                        {log.is_phase_completed === 1 && (
                          <Chip
                            icon={<CheckCircleIcon sx={{ fontSize: "14px !important" }} />}
                            label="Phase Completed"
                            size="small"
                            sx={{
                              backgroundColor: "#ECFDF5",
                              color: "#059669",
                              border: "1px solid #A7F3D0",
                              fontWeight: 800,
                              fontSize: "0.7rem",
                            }}
                          />
                        )}

                        <Chip
                          label={`Overall Progress: ${log.progress_percent}%`}
                          size="small"
                          sx={{
                            backgroundColor: "#FEF3C7",
                            color: "#B45309",
                            border: "1px solid #FDE68A",
                            fontWeight: 800,
                            fontSize: "0.7rem",
                          }}
                        />

                        {log.weather && (
                          <Chip
                            icon={<WbSunnyIcon sx={{ fontSize: "13px !important" }} />}
                            label={log.weather}
                            size="small"
                            sx={{
                              backgroundColor: "#F8FAFC",
                              color: COLORS.textSecondary,
                              border: `1px solid ${COLORS.border}`,
                              fontWeight: 600,
                              fontSize: "0.7rem",
                            }}
                          />
                        )}
                      </Stack>

                      <Stack direction="row" alignItems="center" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditModal(log)}
                          sx={{
                            color: COLORS.textSecondary,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: "6px",
                            p: 0.6,
                            "&:hover": { color: COLORS.primary, backgroundColor: COLORS.bg },
                          }}
                        >
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Stack>
                    </Box>

                    {/* Work Done Description */}
                    <Typography sx={{ fontSize: "0.85rem", color: COLORS.textPrimary, lineHeight: 1.6, mb: 1.8, whiteSpace: "pre-line" }}>
                      {log.work_done}
                    </Typography>

                    {/* Structured Materials Consumed Table / Chips */}
                    {materials.length > 0 && (
                      <Box sx={{ mb: 1.8, p: 1.5, borderRadius: "8px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", mb: 0.8, display: "flex", alignItems: "center", gap: 0.6 }}>
                          <Inventory2OutlinedIcon sx={{ fontSize: 14 }} />
                          Materials Consumed on Site
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                          {materials.map((m, mIdx) => (
                            <Box
                              key={mIdx}
                              sx={{
                                px: 1.2,
                                py: 0.4,
                                borderRadius: "6px",
                                backgroundColor: "#FFFFFF",
                                border: `1px solid ${COLORS.border}`,
                                fontSize: "0.74rem",
                                fontWeight: 700,
                                color: COLORS.textPrimary,
                              }}
                            >
                              <Box component="span" sx={{ color: "#2563EB" }}>
                                {m.quantity ? `${m.quantity} ${m.unit || "Nos"}` : ""}
                              </Box>{" "}
                              {m.item}
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {/* Personnel & Verification Row */}
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 2,
                        py: 1,
                        px: 1.5,
                        borderRadius: "8px",
                        backgroundColor: "#F8FAFC",
                        border: `1px solid ${COLORS.border}`,
                        mb: log.issues_faced || (log.photos && log.photos.length > 0) ? 1.5 : 0,
                      }}
                    >
                      {log.supervisor_name && (
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                          Supervisor: <strong>{log.supervisor_name}</strong>
                        </Typography>
                      )}

                      <Stack direction="row" alignItems="center" gap={0.5}>
                        <PeopleIcon sx={{ fontSize: 15, color: COLORS.textSecondary }} />
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                          Workers: <strong>{log.workers_count || 0}</strong>
                        </Typography>
                      </Stack>

                      <Stack direction="row" alignItems="center" gap={0.5}>
                        <AccessTimeIcon sx={{ fontSize: 15, color: COLORS.textSecondary }} />
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                          Hours: <strong>{log.hours_worked || 0}h</strong>
                        </Typography>
                      </Stack>

                      {log.crew_names && (
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                          Crew: <strong>{log.crew_names}</strong>
                        </Typography>
                      )}

                      {log.supervisor_signoff === 1 && (
                        <Stack direction="row" alignItems="center" gap={0.4} sx={{ color: "#16A34A" }}>
                          <VerifiedIcon sx={{ fontSize: 14 }} />
                          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700 }}>
                            Supervisor Verified
                          </Typography>
                        </Stack>
                      )}
                    </Box>

                    {/* Site Photos with Captions & Tags */}
                    {log.photos && log.photos.length > 0 && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", mb: 0.8 }}>
                          Field Photos ({log.photos.length})
                        </Typography>
                        <Grid container spacing={1.5}>
                          {log.photos.map((photo, pIdx) => {
                            const fullUrl = photo.photo_url.startsWith("http")
                              ? photo.photo_url
                              : `${getApiUrl("")}${photo.photo_url}`;

                            return (
                              <Grid size={{ xs: 6, sm: 4, md: 2 }} key={pIdx}>
                                <Box
                                  onClick={() => setLightboxImg(fullUrl)}
                                  sx={{
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    border: `1px solid ${COLORS.border}`,
                                    cursor: "pointer",
                                    backgroundColor: "#F1F5F9",
                                    position: "relative",
                                    transition: "all 0.15s ease",
                                    "&:hover": { transform: "scale(1.02)", borderColor: COLORS.primary },
                                  }}
                                >
                                  <Box
                                    component="img"
                                    src={fullUrl}
                                    alt={photo.caption || `Site Photo ${pIdx + 1}`}
                                    sx={{ width: "100%", height: 110, objectFit: "cover", display: "block" }}
                                    onError={(e) => {
                                      e.target.src = "https://placehold.co/120x90?text=Photo";
                                    }}
                                  />
                                  {photo.photo_tag && (
                                    <Box
                                      sx={{
                                        position: "absolute",
                                        top: 6,
                                        left: 6,
                                        px: 0.8,
                                        py: 0.2,
                                        borderRadius: "4px",
                                        backgroundColor: "rgba(15, 23, 42, 0.85)",
                                        color: "#FFFFFF",
                                        fontSize: "0.65rem",
                                        fontWeight: 800,
                                      }}
                                    >
                                      {photo.photo_tag}
                                    </Box>
                                  )}
                                  {photo.caption && (
                                    <Box sx={{ p: 0.8, backgroundColor: "#FFFFFF", borderTop: `1px solid ${COLORS.border}` }}>
                                      <Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: COLORS.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {photo.caption}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Box>
                    )}

                    {/* Issues Faced Alert */}
                    {log.issues_faced && (
                      <Alert
                        severity="warning"
                        icon={<WarningAmberIcon sx={{ fontSize: 17 }} />}
                        sx={{
                          mt: 1.5,
                          borderRadius: "8px",
                          fontSize: "0.78rem",
                          backgroundColor: "#FFFBEB",
                          color: "#92400E",
                          border: "1px solid #FDE68A",
                        }}
                      >
                        <strong>Issue Recorded: </strong> {log.issues_faced}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* ============================================================== */}
      {/* 3. ADD/EDIT LOG MODAL DIALOG (SPACIOUS, 2-COLUMN, NO OVERLAP) */}
      {/* ============================================================== */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "16px", backgroundColor: COLORS.cardBg },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2,
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography sx={{ fontSize: "1.15rem", fontWeight: 900, color: COLORS.textPrimary }}>
              {editingLogId ? "Edit Daily Installation Log" : "Log Daily Site Installation Progress"}
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, mt: 0.2 }}>
              Project: {project?.project_number} • System: {project?.system_capacity_kw || "N/A"} kW
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleCloseModal} disabled={saving}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box component="form" id="installation-log-form" onSubmit={handleSaveLog} sx={{ mt: 1 }}>
            <Stack spacing={3}>
              
              {/* SECTION A: DATE, PHASE & STATUS */}
              <Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.04em", mb: 1.5 }}>
                  Phase & Timeline
                </Typography>

                <Grid container spacing={2}>
                  {/* Log Date */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.6 }}>
                      Log Date *
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      required
                      type="date"
                      value={formData.log_date}
                      onChange={(e) => handleInputChange("log_date", e.target.value)}
                    />
                  </Grid>

                  {/* Installation Phase */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small" required>
                      <InputLabel>Installation Phase *</InputLabel>
                      <Select
                        value={formData.phase}
                        label="Installation Phase *"
                        onChange={(e) => handleInputChange("phase", e.target.value)}
                      >
                        {INSTALLATION_PHASES.map((p, i) => (
                          <MenuItem key={p} value={p}>
                            {i + 1}. {PHASE_CONFIG[p]?.fullName || p}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Phase Completed Checkbox */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box
                      sx={{
                        p: 1.2,
                        borderRadius: "8px",
                        backgroundColor: formData.is_phase_completed ? "#ECFDF5" : "#F8FAFC",
                        border: `1px solid ${formData.is_phase_completed ? "#A7F3D0" : COLORS.border}`,
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.is_phase_completed}
                            onChange={(e) => handleInputChange("is_phase_completed", e.target.checked)}
                            color="success"
                            size="small"
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.textPrimary }}>
                              Mark Phase as Completed Today
                            </Typography>
                            <Typography sx={{ fontSize: "0.7rem", color: COLORS.textSecondary }}>
                              Advances milestone stepper to the next stage
                            </Typography>
                          </Box>
                        }
                      />
                    </Box>
                  </Grid>

                  {/* Weather */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Site Weather</InputLabel>
                      <Select
                        value={formData.weather}
                        label="Site Weather"
                        onChange={(e) => handleInputChange("weather", e.target.value)}
                      >
                        <MenuItem value="Sunny / Clear">☀️ Sunny / Clear (Optimal)</MenuItem>
                        <MenuItem value="Partly Cloudy">⛅ Partly Cloudy</MenuItem>
                        <MenuItem value="Light Rain / Drizzle">🌧️ Light Rain / Drizzle</MenuItem>
                        <MenuItem value="High Wind">💨 High Wind (Caution)</MenuItem>
                        <MenuItem value="Extreme Heat">🔥 Extreme Heat (&gt;42°C)</MenuItem>
                        <MenuItem value="Work Halted - Weather">⚠️ Work Halted due to Bad Weather</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* SECTION B: WORK DONE TODAY */}
              <Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.04em", mb: 1 }}>
                  Work Done Today (Detailed Description) *
                </Typography>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={4}
                  placeholder="Describe exact rooftop tasks: number of structure legs grouted, torque tightness checked, panels bolted, DC stringing, conduit piping, earthing pit excavation..."
                  value={formData.work_done}
                  onChange={(e) => handleInputChange("work_done", e.target.value)}
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

              {/* SECTION C: PERSONNEL & SUPERVISOR */}
              <Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.04em", mb: 1.5 }}>
                  Field Personnel & Attendance
                </Typography>
                <Grid container spacing={2}>
                  {/* Supervisor Name */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Site Supervisor Name"
                      placeholder="e.g. Er. Vikram Singh"
                      value={formData.supervisor_name}
                      onChange={(e) => handleInputChange("supervisor_name", e.target.value)}
                    />
                  </Grid>

                  {/* Workers Count */}
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Workers on Site"
                      placeholder="e.g. 4"
                      inputProps={{ min: 0 }}
                      value={formData.workers_count}
                      onChange={(e) => handleInputChange("workers_count", e.target.value)}
                    />
                  </Grid>

                  {/* Hours Worked */}
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Hours Worked"
                      placeholder="e.g. 8"
                      inputProps={{ min: 0, step: "0.5" }}
                      value={formData.hours_worked}
                      onChange={(e) => handleInputChange("hours_worked", e.target.value)}
                    />
                  </Grid>

                  {/* Crew Names */}
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Crew Members on Site"
                      placeholder="e.g. Ramesh (Master Electrician), Suresh (Fabricator), Mohan & Anil (Technicians)"
                      value={formData.crew_names}
                      onChange={(e) => handleInputChange("crew_names", e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* SECTION D: STRUCTURED MATERIALS USED (ROW-BASED) */}
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.2 }}>
                  <Box>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Materials Consumed on Site Today
                    </Typography>
                    <Typography sx={{ fontSize: "0.7rem", color: COLORS.textSecondary }}>
                      Structured items with quantities and units for inventory tracking
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAddMaterialRow}
                    sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.74rem" }}
                  >
                    Add Item
                  </Button>
                </Stack>

                <Stack spacing={1.2}>
                  {formData.materials_list.map((m, idx) => (
                    <Grid container spacing={1.5} alignItems="center" key={idx}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label={`Material Item #${idx + 1}`}
                          placeholder="e.g. Solar Panels 550W, 4 sqmm DC Cable, Mid Clamps..."
                          value={m.item}
                          onChange={(e) => handleMaterialChange(idx, "item", e.target.value)}
                        />
                      </Grid>

                      <Grid size={{ xs: 6, sm: 3 }}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Quantity"
                          placeholder="e.g. 10"
                          inputProps={{ min: 0, step: "any" }}
                          value={m.quantity}
                          onChange={(e) => handleMaterialChange(idx, "quantity", e.target.value)}
                        />
                      </Grid>

                      <Grid size={{ xs: 4, sm: 2 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Unit</InputLabel>
                          <Select
                            value={m.unit || "Nos"}
                            label="Unit"
                            onChange={(e) => handleMaterialChange(idx, "unit", e.target.value)}
                          >
                            <MenuItem value="Nos">Nos</MenuItem>
                            <MenuItem value="Meters">Meters</MenuItem>
                            <MenuItem value="Sets">Sets</MenuItem>
                            <MenuItem value="Pcs">Pcs</MenuItem>
                            <MenuItem value="Kg">Kg</MenuItem>
                            <MenuItem value="Bags">Bags</MenuItem>
                            <MenuItem value="Rolls">Rolls</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid size={{ xs: 2, sm: 1 }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveMaterialRow(idx)}
                          disabled={formData.materials_list.length === 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}
                </Stack>
              </Box>

              <Divider />

              {/* SECTION E: SAFETY CHECKLIST */}
              <Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.04em", mb: 1.2, display: "flex", alignItems: "center", gap: 0.8 }}>
                  <SecurityIcon sx={{ color: "#16A34A", fontSize: 16 }} />
                  Rooftop Safety Compliance Checklist
                </Typography>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.safety_checklist.harness}
                          onChange={() => handleSafetyToggle("harness")}
                          size="small"
                          color="success"
                        />
                      }
                      label={<Typography sx={{ fontSize: "0.8rem" }}>Full Body Safety Harness Worn</Typography>}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.safety_checklist.helmet}
                          onChange={() => handleSafetyToggle("helmet")}
                          size="small"
                          color="success"
                        />
                      }
                      label={<Typography sx={{ fontSize: "0.8rem" }}>Safety Helmets (Hard Hats) Worn</Typography>}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.safety_checklist.shoes}
                          onChange={() => handleSafetyToggle("shoes")}
                          size="small"
                          color="success"
                        />
                      }
                      label={<Typography sx={{ fontSize: "0.8rem" }}>Safety Shoes Worn</Typography>}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.safety_checklist.lifeline}
                          onChange={() => handleSafetyToggle("lifeline")}
                          size="small"
                          color="success"
                        />
                      }
                      label={<Typography sx={{ fontSize: "0.8rem" }}>Rooftop Lifeline / Rope Anchor Secured</Typography>}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* SECTION F: PROGRESS %, ISSUES & SIGN-OFF */}
              <Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.04em", mb: 1.5 }}>
                  Project Progress & Verification
                </Typography>

                <Grid container spacing={2}>
                  {/* Overall Progress % */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      required
                      type="number"
                      label="Overall Project Progress (%) *"
                      placeholder="e.g. 45"
                      inputProps={{ min: 0, max: 100 }}
                      value={formData.progress_percent}
                      onChange={(e) => handleInputChange("progress_percent", e.target.value)}
                      helperText={`Target milestone for ${formData.phase} is ~${PHASE_CONFIG[formData.phase]?.targetProgress || 50}%`}
                    />
                  </Grid>

                  {/* Supervisor Sign-Off */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box
                      sx={{
                        p: 1.2,
                        borderRadius: "8px",
                        backgroundColor: formData.supervisor_signoff ? "#ECFDF5" : "#F8FAFC",
                        border: `1px solid ${formData.supervisor_signoff ? "#A7F3D0" : COLORS.border}`,
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.supervisor_signoff}
                            onChange={(e) => handleInputChange("supervisor_signoff", e.target.checked)}
                            color="success"
                            size="small"
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.textPrimary }}>
                              Supervisor Sign-Off & Verification
                            </Typography>
                            <Typography sx={{ fontSize: "0.7rem", color: COLORS.textSecondary }}>
                              Confirms quality standards meet DISCOM norms
                            </Typography>
                          </Box>
                        }
                      />
                    </Box>
                  </Grid>

                  {/* Issues Faced */}
                  <Grid size={12}>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.6 }}>
                      Issues Faced / Field Roadblocks
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="e.g. Delayed panel crane lifting, parapet wall drilling issue, inverter breaker tripping..."
                      value={formData.issues_faced}
                      onChange={(e) => handleInputChange("issues_faced", e.target.value)}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          minHeight: "100px",
                          alignItems: "flex-start",
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* SECTION G: PHOTOS UPLOAD (UP TO 10 PHOTOS WITH CAPTIONS & TAGS) */}
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Site Photos (Up to 10 with Before/After Captions)
                  </Typography>
                  <Typography sx={{ fontSize: "0.7rem", color: COLORS.textSecondary }}>
                    {selectedPhotos.length} / 10 Selected
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    p: 2.5,
                    border: `1.5px dashed ${COLORS.border}`,
                    borderRadius: "10px",
                    backgroundColor: COLORS.bg,
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": { borderColor: COLORS.secondary, backgroundColor: "#FFFBEB" },
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
                    }}
                  />
                  <CloudUploadIcon sx={{ fontSize: 32, color: COLORS.textMuted, mb: 0.5 }} />
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.textPrimary }}>
                    Click or drag & drop installation photos
                  </Typography>
                  <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mt: 0.2 }}>
                    Upload structure alignment, inverter connections, cable crimping & earthing pits
                  </Typography>
                </Box>

                {/* Previews with Caption & Tag Inputs */}
                {photoPreviews.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={1.5}>
                      {photoPreviews.map((preview, idx) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: "10px",
                              border: `1px solid ${COLORS.border}`,
                              backgroundColor: "#FFFFFF",
                              display: "flex",
                              gap: 1.5,
                              alignItems: "center",
                            }}
                          >
                            <Box
                              sx={{
                                position: "relative",
                                width: 70,
                                height: 70,
                                borderRadius: "8px",
                                overflow: "hidden",
                                flexShrink: 0,
                                backgroundColor: "#F1F5F9",
                              }}
                            >
                              <Box
                                component="img"
                                src={preview.url}
                                alt={`Preview ${idx + 1}`}
                                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="Caption (e.g. Before panel placement)"
                                value={preview.caption}
                                onChange={(e) => handleUpdatePhotoMeta(idx, "caption", e.target.value)}
                                sx={{ mb: 0.8, "& .MuiInputBase-input": { fontSize: "0.75rem", py: 0.6 } }}
                              />
                              <FormControl fullWidth size="small">
                                <Select
                                  value={preview.tag || "During"}
                                  onChange={(e) => handleUpdatePhotoMeta(idx, "tag", e.target.value)}
                                  sx={{ fontSize: "0.72rem", height: 28 }}
                                >
                                  <MenuItem value="Before">Tag: Before</MenuItem>
                                  <MenuItem value="During">Tag: During</MenuItem>
                                  <MenuItem value="After">Tag: After</MenuItem>
                                  <MenuItem value="Structure">Tag: Structure</MenuItem>
                                  <MenuItem value="Inverter">Tag: Inverter</MenuItem>
                                  <MenuItem value="Earthing">Tag: Earthing</MenuItem>
                                </Select>
                              </FormControl>
                            </Box>

                            <IconButton
                              size="small"
                              onClick={() => handleRemovePhoto(idx)}
                              sx={{ color: COLORS.error }}
                            >
                              <CloseIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button
            onClick={handleCloseModal}
            disabled={saving}
            sx={{ textTransform: "none", fontWeight: 600, color: COLORS.textSecondary }}
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
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              borderRadius: "8px",
              "&:hover": { backgroundColor: "#020617" },
            }}
          >
            {saving ? "Saving Log..." : "Save Daily Log"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================== */}
      {/* 4. SET EXPECTED COMPLETION DATE DIALOG                        */}
      {/* ============================================================== */}
      <Dialog
        open={dateDialogOpen}
        onClose={() => !savingDate && setDateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.05rem" }}>
          Set Target Completion Date
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary, mb: 2 }}>
            Specify the scheduled installation completion date before commencing rooftop work.
          </Typography>
          <Box>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.6 }}>
              Target Completion Date
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="date"
              value={newTargetDate}
              onChange={(e) => setNewTargetDate(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDateDialogOpen(false)} disabled={savingDate} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveTargetDate}
            variant="contained"
            disabled={savingDate}
            sx={{ textTransform: "none", fontWeight: 700, backgroundColor: COLORS.primary }}
          >
            {savingDate ? "Saving..." : "Save Date"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================== */}
      {/* 5. FULL-SIZE PHOTO LIGHTBOX DIALOG                            */}
      {/* ============================================================== */}
      <Dialog
        open={Boolean(lightboxImg)}
        onClose={() => setLightboxImg(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: "transparent", boxShadow: "none", overflow: "hidden" },
        }}
      >
        <Box sx={{ position: "relative", display: "flex", justifyContent: "center", p: 1 }}>
          <IconButton
            onClick={() => setLightboxImg(null)}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              color: "#FFFFFF",
              "&:hover": { backgroundColor: COLORS.primary },
              zIndex: 10,
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
          {lightboxImg && (
            <Box
              component="img"
              src={lightboxImg}
              alt="Site Photo Full Preview"
              sx={{
                maxWidth: "100%",
                maxHeight: "85vh",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
