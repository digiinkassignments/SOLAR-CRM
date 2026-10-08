import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  IconButton,
  Tooltip,
  Stack,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  Breadcrumbs,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

// Icons
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import FolderSpecialOutlinedIcon from "@mui/icons-material/FolderSpecialOutlined";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import VisibilityIcon from "@mui/icons-material/Visibility";
import InboxIcon from "@mui/icons-material/Inbox";
import CloseIcon from "@mui/icons-material/Close";

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

// Stage chip color definitions
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

const STAGE_OPTIONS = [
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

export default function ProjectsList() {
  const navigate = useNavigate();

  // State
  const [projects, setProjects] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    warranty: 0,
  });

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedStage, setSelectedStage] = useState("All");
  const [viewMode, setViewMode] = useState("box"); // 'box' or 'table'
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // New Project Dialog State
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    system_capacity_kw: "5.00",
    customer_address: "",
    city: "",
    state: "",
    pincode: "",
    stage: "Order Closed",
    notes: "",
  });

  // Fetch Stats from GET /api/projects/stats
  const fetchStats = useCallback(async () => {
    try {
      const endpoint = "/projects/stats";
      const res = await api.get(endpoint);
      if (res.data?.success && Array.isArray(res.data.data)) {
        const rows = res.data.data;
        let total = 0;
        let inProgress = 0;
        let completed = 0;
        let warranty = 0;

        rows.forEach((item) => {
          const count = Number(item.count) || 0;
          total += count;
          if (item.stage === "Installation In Progress") inProgress = count;
          if (item.stage === "Handover Done") completed = count;
          if (item.stage === "Warranty Period") warranty = count;
        });

        setStats({ total, inProgress, completed, warranty });
      }
    } catch (err) {
      console.error("fetchStats error:", err);
    }
  }, []);

  // Fetch Projects List from GET /api/projects
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        stage: selectedStage === "All" ? "" : selectedStage,
        search: search.trim(),
      };

      const res = await api.get("/projects", { params });
      if (res.data?.success) {
        setProjects(res.data.data?.projects || []);
        setTotalCount(res.data.data?.total || 0);
      } else {
        setProjects([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("fetchProjects error:", err);
      toast.error(err.response?.data?.message || "Failed to load projects");
      setProjects([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, selectedStage, search]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const res = await api.get("/projects/stats");
        if (!ignore && res.data?.success && Array.isArray(res.data.data)) {
          let total = 0;
          let inProgress = 0;
          let completed = 0;
          let warranty = 0;
          res.data.data.forEach((item) => {
            const count = Number(item.count) || 0;
            total += count;
            if (item.stage === "Installation In Progress") inProgress = count;
            if (item.stage === "Handover Done") completed = count;
            if (item.stage === "Warranty Period") warranty = count;
          });
          setStats({ total, inProgress, completed, warranty });
        }
      } catch (e) {
        console.error("Stats load error:", e);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setLoading(true);
      try {
        const params = {
          page: page + 1,
          limit: rowsPerPage,
          stage: selectedStage === "All" ? "" : selectedStage,
          search: search.trim(),
        };
        const res = await api.get("/projects", { params });
        if (!ignore && res.data?.success) {
          setProjects(res.data.data?.projects || []);
          setTotalCount(res.data.data?.total || 0);
        }
      } catch (err) {
        if (!ignore) {
          console.error("fetchProjects error:", err);
          setProjects([]);
          setTotalCount(0);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [page, rowsPerPage, selectedStage, search]);

  // Search handler (on Enter or Button)
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  };

  const handleClearFilters = () => {
    setSearch("");
    setSearchInput("");
    setSelectedStage("All");
    setPage(0);
  };

  // Create Project Submit Handler
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.customer_phone || !formData.system_capacity_kw) {
      toast.error("Please fill all required fields (*)");
      return;
    }

    setCreating(true);
    try {
      const res = await api.post("/projects", formData);
      if (res.data?.success) {
        toast.success(res.data.message || "Project created successfully!");
        setNewModalOpen(false);
        setFormData({
          customer_name: "",
          customer_phone: "",
          system_capacity_kw: "5.00",
          customer_address: "",
          city: "",
          state: "",
          pincode: "",
          stage: "Order Closed",
          notes: "",
        });
        fetchProjects();
        fetchStats();
      }
    } catch (err) {
      console.error("handleCreateSubmit error:", err);
      toast.error(err.response?.data?.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  // Stage Chip Renderer
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
          fontSize: "0.72rem",
          height: 24,
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

  const hasActiveFilters = Boolean(search || selectedStage !== "All");

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
        {/* 1. BREADCRUMBS */}
        <Breadcrumbs
          separator={
            <NavigateNextRoundedIcon
              sx={{ fontSize: "0.8rem", color: COLORS.textMuted }}
            />
          }
          sx={{ mb: 1.5 }}
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
              fontWeight: 700,
              color: COLORS.primaryDark,
            }}
          >
            Projects
          </Typography>
        </Breadcrumbs>

        {/* 2. HERO HEADER PAPER */}
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
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: COLORS.textPrimary,
                fontSize: "1.15rem",
                letterSpacing: "-0.01em",
              }}
            >
              Project Management
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: COLORS.textSecondary,
                fontSize: "0.78rem",
                mt: 0.2,
              }}
            >
              Track solar installation projects from order to handover
            </Typography>
          </Box>

          <Stack
            direction="row"
            alignItems="center"
            gap={1}
            sx={{ flexShrink: 0, flexWrap: "wrap" }}
          >
            {/* View Toggle */}
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
                  px: 1.4,
                  py: 0.4,
                  color: COLORS.textSecondary,
                  "&.Mui-selected": {
                    backgroundColor: COLORS.card,
                    color: COLORS.primary,
                    fontWeight: 700,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  },
                },
              }}
            >
              <ToggleButton value="box">
                <Tooltip title="Box / Card View">
                  <Stack direction="row" alignItems="center" gap={0.6}>
                    <ViewListOutlinedIcon sx={{ fontSize: 17 }} />
                    <Typography sx={{ fontSize: "0.74rem", fontWeight: 700 }}>
                      Box
                    </Typography>
                  </Stack>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="table">
                <Tooltip title="Table View">
                  <Stack direction="row" alignItems="center" gap={0.6}>
                    <TableChartOutlinedIcon sx={{ fontSize: 17 }} />
                    <Typography sx={{ fontSize: "0.74rem", fontWeight: 700 }}>
                      Table
                    </Typography>
                  </Stack>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Refresh Button */}
            <Tooltip title="Refresh Projects & Stats">
              <span>
                <IconButton
                  onClick={() => {
                    fetchProjects();
                    fetchStats();
                  }}
                  disabled={loading}
                  size="small"
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "6px",
                    border: `1px solid ${COLORS.border}`,
                    backgroundColor: COLORS.card,
                    color: COLORS.textPrimary,
                    "&:hover": { backgroundColor: "#F8FAFC" },
                  }}
                >
                  <RefreshIcon
                    sx={{
                      fontSize: 18,
                      animation: loading ? "spin 0.8s linear infinite" : "none",
                      "@keyframes spin": {
                        from: { transform: "rotate(0deg)" },
                        to: { transform: "rotate(360deg)" },
                      },
                    }}
                  />
                </IconButton>
              </span>
            </Tooltip>

            {/* New Project Button */}
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 17 }} />}
              onClick={() => setNewModalOpen(true)}
              sx={{
                height: 36,
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.8rem",
                px: 2,
                backgroundColor: COLORS.primary,
                color: "#FFFFFF",
                whiteSpace: "nowrap",
                "&:hover": { backgroundColor: "#020617" },
              }}
            >
              New Project
            </Button>
          </Stack>
        </Paper>

        {/* 3. STATS ROW (4 Cards) */}
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          {/* Total Projects */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              onClick={() => {
                setSelectedStage("All");
                setPage(0);
              }}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: `1px solid ${selectedStage === "All" ? COLORS.primary : COLORS.border}`,
                backgroundColor: COLORS.card,
                cursor: "pointer",
                transition: "all 0.15s ease-in-out",
                "&:hover": {
                  borderColor: COLORS.primary,
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
                },
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Total Projects
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "1.6rem",
                      fontWeight: 900,
                      color: COLORS.primaryDark,
                      mt: 0.3,
                    }}
                  >
                    {stats.total}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "10px",
                    backgroundColor: "#EFF6FF",
                    color: "#2563EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FolderSpecialOutlinedIcon sx={{ fontSize: 22 }} />
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* In Progress */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              onClick={() => {
                setSelectedStage("Installation In Progress");
                setPage(0);
              }}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: `1px solid ${selectedStage === "Installation In Progress" ? "#F59E0B" : COLORS.border}`,
                backgroundColor: COLORS.card,
                cursor: "pointer",
                transition: "all 0.15s ease-in-out",
                "&:hover": {
                  borderColor: "#F59E0B",
                  boxShadow: "0 2px 8px rgba(245, 158, 11, 0.08)",
                },
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    In Progress
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "1.6rem",
                      fontWeight: 900,
                      color: "#D97706",
                      mt: 0.3,
                    }}
                  >
                    {stats.inProgress}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "10px",
                    backgroundColor: "#FEF3C7",
                    color: "#D97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <EngineeringOutlinedIcon sx={{ fontSize: 22 }} />
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* Completed (Handover Done) */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              onClick={() => {
                setSelectedStage("Handover Done");
                setPage(0);
              }}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: `1px solid ${selectedStage === "Handover Done" ? "#10B981" : COLORS.border}`,
                backgroundColor: COLORS.card,
                cursor: "pointer",
                transition: "all 0.15s ease-in-out",
                "&:hover": {
                  borderColor: "#10B981",
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)",
                },
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Completed
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "1.6rem",
                      fontWeight: 900,
                      color: "#059669",
                      mt: 0.3,
                    }}
                  >
                    {stats.completed}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "10px",
                    backgroundColor: "#D1FAE5",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircleOutlinedIcon sx={{ fontSize: 22 }} />
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* Warranty Period */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              onClick={() => {
                setSelectedStage("Warranty Period");
                setPage(0);
              }}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: `1px solid ${selectedStage === "Warranty Period" ? "#0D9488" : COLORS.border}`,
                backgroundColor: COLORS.card,
                cursor: "pointer",
                transition: "all 0.15s ease-in-out",
                "&:hover": {
                  borderColor: "#0D9488",
                  boxShadow: "0 2px 8px rgba(13, 148, 136, 0.08)",
                },
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Warranty
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "1.6rem",
                      fontWeight: 900,
                      color: "#0D9488",
                      mt: 0.3,
                    }}
                  >
                    {stats.warranty}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "10px",
                    backgroundColor: "#CCFBF1",
                    color: "#0D9488",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <VerifiedUserOutlinedIcon sx={{ fontSize: 22 }} />
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* 4. FILTER BAR */}
        <Paper
          elevation={0}
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            p: 1.8,
            mb: 2.5,
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1.5,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Search Input */}
          <Box sx={{ flex: "1 1 240px", minWidth: 200 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by project number, customer, phone, city..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: COLORS.textMuted }} />
                  </InputAdornment>
                ),
                endAdornment: searchInput && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearchInput("");
                        setSearch("");
                        setPage(0);
                      }}
                      sx={{ p: 0.2 }}
                    >
                      <CloseIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: 38,
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  backgroundColor: "#FFFFFF",
                },
              }}
            />
          </Box>

          {/* Stage Dropdown */}
          <Box sx={{ flex: "0 0 220px", minWidth: 180 }}>
            <FormControl fullWidth size="small">
              <Select
                value={selectedStage}
                onChange={(e) => {
                  setSelectedStage(e.target.value);
                  setPage(0);
                }}
                sx={{
                  height: 38,
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <MenuItem value="All">All Stages</MenuItem>
                {STAGE_OPTIONS.map((stg) => (
                  <MenuItem key={stg} value={stg}>
                    {stg}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Submit Search */}
          <Button
            type="submit"
            variant="contained"
            size="small"
            sx={{
              height: 38,
              borderRadius: "6px",
              px: 2,
              fontWeight: 700,
              fontSize: "0.78rem",
              textTransform: "none",
              backgroundColor: COLORS.primary,
              "&:hover": { backgroundColor: "#020617" },
            }}
          >
            Search
          </Button>

          {/* Clear Filters Button */}
          <Tooltip title="Clear all filters">
            <span>
              <IconButton
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
                size="small"
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "6px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.card,
                  color: hasActiveFilters ? COLORS.primary : COLORS.textMuted,
                  "&:hover": { backgroundColor: "#F8FAFC" },
                }}
              >
                <FilterListOffIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Paper>

        {/* 8. LOADING STATE (Skeletons) */}
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={viewMode === "box" ? 130 : 54}
                sx={{ borderRadius: "12px" }}
              />
            ))}
          </Box>
        ) : projects.length === 0 ? (
          /* 7. EMPTY STATE */
          <Paper
            elevation={0}
            sx={{
              py: 8,
              px: 3,
              borderRadius: "12px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.card,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "#F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: COLORS.textMuted,
                mb: 2,
              }}
            >
              <InboxIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: COLORS.textPrimary,
                fontSize: "1.05rem",
                mb: 0.5,
              }}
            >
              No projects found
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: COLORS.textSecondary,
                fontSize: "0.8rem",
                maxWidth: 420,
                mb: 2.5,
              }}
            >
              {hasActiveFilters
                ? "No solar installation projects match your search criteria or selected stage. Try adjusting your filters."
                : "No solar projects have been initiated yet. Create your first project to begin tracking from order to handover."}
            </Typography>
            {hasActiveFilters ? (
              <Button
                variant="outlined"
                size="small"
                onClick={handleClearFilters}
                sx={{
                  borderRadius: "6px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setNewModalOpen(true)}
                sx={{
                  borderRadius: "6px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  backgroundColor: COLORS.primary,
                  "&:hover": { backgroundColor: "#020617" },
                }}
              >
                New Project
              </Button>
            )}
          </Paper>
        ) : viewMode === "box" ? (
          /* 5. BOX VIEW (DEFAULT) */
          <Stack spacing={1.8}>
            {projects.map((proj) => (
              <Paper
                key={proj.id}
                elevation={0}
                sx={{
                  p: 2.2,
                  borderRadius: "12px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.card,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    borderColor: COLORS.primary,
                    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
                  },
                }}
              >
                {/* Card Top Row: Project Number + Stage Chip */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1,
                    mb: 1.5,
                  }}
                >
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
                        fontSize: "0.82rem",
                        fontFamily: "monospace",
                        letterSpacing: "0.03em",
                      }}
                    >
                      {proj.project_number}
                    </Box>

                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: "1rem",
                        color: COLORS.textPrimary,
                      }}
                    >
                      {proj.customer_name}
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" gap={1}>
                    {renderStageChip(proj.stage)}
                  </Stack>
                </Box>

                {/* Card Middle Grid (Customer, kW badge, Assigned Rep, Dates) */}
                <Grid container spacing={2} sx={{ mb: 1.5 }}>
                  {/* Col 1: Customer Contact & Location */}
                  <Grid item xs={12} sm={4}>
                    <Stack spacing={0.6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <PhoneIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                        <Typography
                          component="a"
                          href={`tel:${proj.customer_phone}`}
                          sx={{
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            color: COLORS.primaryDark,
                            textDecoration: "none",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          {proj.customer_phone || "—"}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: "0.74rem",
                          color: COLORS.textSecondary,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {[proj.city, proj.state].filter(Boolean).join(", ") ||
                          proj.customer_address ||
                          "Site location not specified"}
                      </Typography>
                    </Stack>
                  </Grid>

                  {/* Col 2: System Capacity kW badge */}
                  <Grid item xs={12} sm={4}>
                    <Stack spacing={0.6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <Chip
                          icon={
                            <SolarPowerIcon
                              sx={{
                                fontSize: "14px !important",
                                color: "#B45309 !important",
                              }}
                            />
                          }
                          label={`${parseFloat(proj.system_capacity_kw || 1).toFixed(2)} kW System`}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            backgroundColor: "#FEF3C7",
                            color: "#92400E",
                            border: "1px solid #FDE68A",
                            borderRadius: "6px",
                          }}
                        />
                      </Box>
                      {proj.panel_count && (
                        <Typography
                          sx={{ fontSize: "0.73rem", color: COLORS.textSecondary }}
                        >
                          Panels: {proj.panel_count} pcs • Inverter:{" "}
                          {proj.inverter_kw ? `${proj.inverter_kw} kW` : "N/A"}
                        </Typography>
                      )}
                    </Stack>
                  </Grid>

                  {/* Col 3: Assigned to & Installation Date */}
                  <Grid item xs={12} sm={4}>
                    <Stack spacing={0.6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <PersonIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                        <Typography
                          sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}
                        >
                          Assigned Rep:{" "}
                          <Box
                            component="span"
                            sx={{ fontWeight: 700, color: COLORS.textPrimary }}
                          >
                            {proj.assigned_to_name || "Unassigned"}
                          </Box>
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <CalendarTodayIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                        <Typography
                          sx={{ fontSize: "0.74rem", color: COLORS.textSecondary }}
                        >
                          Install Date:{" "}
                          <Box
                            component="span"
                            sx={{ fontWeight: 600, color: COLORS.textPrimary }}
                          >
                            {formatDate(proj.installation_start_date) || "Not Scheduled"}
                          </Box>
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>

                {/* Card Bottom Row: Actions */}
                <Box
                  sx={{
                    pt: 1.2,
                    borderTop: `1px solid ${COLORS.border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      color: COLORS.textMuted,
                      fontWeight: 600,
                    }}
                  >
                    Created {formatDate(proj.created_at)}
                  </Typography>

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<VisibilityIcon sx={{ fontSize: 15 }} />}
                    onClick={() => navigate(`/projects/${proj.id}`)}
                    sx={{
                      height: 30,
                      borderRadius: "6px",
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.74rem",
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
                    View Project
                  </Button>
                </Box>
              </Paper>
            ))}
          </Stack>
        ) : (
          /* 6. TABLE VIEW */
          <Paper
            elevation={0}
            sx={{
              borderRadius: "12px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.card,
              overflow: "hidden",
              width: "100%",
            }}
          >
            <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 950 }}>
                <TableHead sx={{ backgroundColor: COLORS.primary }}>
                  <TableRow>
                    <TableCell
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        py: 1.2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Project No
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        py: 1.2,
                        whiteSpace: "nowrap",
                        minWidth: 160,
                      }}
                    >
                      Customer
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        py: 1.2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Capacity
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        py: 1.2,
                        whiteSpace: "nowrap",
                        minWidth: 160,
                      }}
                    >
                      Stage
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        py: 1.2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Assigned To
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        py: 1.2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Start Date
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        py: 1.2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projects.map((proj) => (
                    <TableRow
                      key={proj.id}
                      hover
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        "& td": { py: 1.2, px: 1.8 },
                      }}
                    >
                      {/* Project No */}
                      <TableCell sx={{ fontSize: "0.76rem", fontWeight: 700 }}>
                        <Box
                          sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: "4px",
                            backgroundColor: "#EFF6FF",
                            color: "#1D4ED8",
                            border: "1px solid #BFDBFE",
                            fontFamily: "monospace",
                            display: "inline-block",
                          }}
                        >
                          {proj.project_number}
                        </Box>
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <Typography
                          sx={{
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            color: COLORS.textPrimary,
                          }}
                        >
                          {proj.customer_name}
                        </Typography>
                        <Typography
                          sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}
                        >
                          {proj.customer_phone}
                        </Typography>
                      </TableCell>

                      {/* Capacity */}
                      <TableCell sx={{ fontSize: "0.76rem", fontWeight: 700 }}>
                        {parseFloat(proj.system_capacity_kw || 1).toFixed(2)} kW
                      </TableCell>

                      {/* Stage */}
                      <TableCell>{renderStageChip(proj.stage)}</TableCell>

                      {/* Assigned To */}
                      <TableCell
                        sx={{ fontSize: "0.76rem", color: COLORS.textSecondary }}
                      >
                        {proj.assigned_to_name || "Unassigned"}
                      </TableCell>

                      {/* Start Date */}
                      <TableCell
                        sx={{ fontSize: "0.76rem", color: COLORS.textSecondary }}
                      >
                        {formatDate(proj.installation_start_date)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                          onClick={() => navigate(`/projects/${proj.id}`)}
                          sx={{
                            height: 28,
                            borderRadius: "6px",
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            px: 1.4,
                            borderColor: COLORS.border,
                            color: COLORS.textPrimary,
                            "&:hover": {
                              borderColor: COLORS.primary,
                              backgroundColor: "#F8FAFC",
                            },
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* PAGINATION */}
        {totalCount > 0 && (
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
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
              rowsPerPageOptions={[10, 15, 25, 50]}
              sx={{
                border: "none",
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                  fontSize: "0.76rem",
                  color: COLORS.textSecondary,
                },
              }}
            />
          </Box>
        )}
      </Box>

      {/* CREATE NEW PROJECT MODAL */}
      <Dialog
        open={newModalOpen}
        onClose={() => !creating && setNewModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "14px", p: 1 },
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
          Create New Solar Project
          <IconButton
            size="small"
            onClick={() => setNewModalOpen(false)}
            disabled={creating}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleCreateSubmit}>
          <DialogContent dividers sx={{ borderColor: COLORS.border }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography
                  sx={{
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: COLORS.textSecondary,
                    mb: 0.5,
                  }}
                >
                  Customer Name *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography
                  sx={{
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: COLORS.textSecondary,
                    mb: 0.5,
                  }}
                >
                  Customer Phone *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  required
                  placeholder="e.g. 9876543210"
                  value={formData.customer_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_phone: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography
                  sx={{
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: COLORS.textSecondary,
                    mb: 0.5,
                  }}
                >
                  System Capacity (kW) *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 5.0"
                  value={formData.system_capacity_kw}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      system_capacity_kw: e.target.value,
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography
                  sx={{
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: COLORS.textSecondary,
                    mb: 0.5,
                  }}
                >
                  Initial Stage
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  value={formData.stage}
                  onChange={(e) =>
                    setFormData({ ...formData, stage: e.target.value })
                  }
                >
                  {STAGE_OPTIONS.map((stg) => (
                    <MenuItem key={stg} value={stg}>
                      {stg}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography
                  sx={{
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: COLORS.textSecondary,
                    mb: 0.5,
                  }}
                >
                  City
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. Jaipur"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography
                  sx={{
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: COLORS.textSecondary,
                    mb: 0.5,
                  }}
                >
                  State
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. Rajasthan"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <Typography
                  sx={{
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: COLORS.textSecondary,
                    mb: 0.5,
                  }}
                >
                  Site Address
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. Plot 42, Green Avenue..."
                  value={formData.customer_address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customer_address: e.target.value,
                    })
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <Typography
                  sx={{
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: COLORS.textSecondary,
                    mb: 0.5,
                  }}
                >
                  Notes / Installation Details
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  placeholder="Initial site inspection and customer notes..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              onClick={() => setNewModalOpen(false)}
              disabled={creating}
              sx={{ textTransform: "none", fontWeight: 600, color: COLORS.textSecondary }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={creating}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                backgroundColor: COLORS.primary,
                "&:hover": { backgroundColor: "#020617" },
              }}
            >
              {creating ? "Creating Project..." : "Create Project"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
