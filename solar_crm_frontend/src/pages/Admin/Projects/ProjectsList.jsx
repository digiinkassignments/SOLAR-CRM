import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
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
  Breadcrumbs,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  LinearProgress,
  Avatar,
  Divider,
  Alert,
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
import FolderSpecialOutlinedIcon from "@mui/icons-material/FolderSpecialOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeleteIcon from "@mui/icons-material/Delete";
import InboxIcon from "@mui/icons-material/Inbox";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import ElectricBoltOutlinedIcon from "@mui/icons-material/ElectricBoltOutlined";

import toast from "react-hot-toast";
import api from "../../../utils/api";
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

export default function ProjectsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roleName = (user?.role_name || user?.role || "").toLowerCase();
  const isManager = user?.role_id === 2 || roleName.includes("manager");
  const projectBasePath = isManager ? "/manager/projects" : "/projects";

  // State
  const [projects, setProjects] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    subsidy: 0,
    completed: 0,
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
  const [quotationOptions, setQuotationOptions] = useState([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  // Delete Project Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    lead_id: null,
    quotation_id: null,
    system_capacity_kw: "5.00",
    panel_count: "",
    inverter_kw: "",
    total_cost: "",
    amount_received: "",
    payment_status: "Pending",
    customer_address: "",
    city: "",
    state: "",
    pincode: "",
    stage: "Order Closed",
    notes: "",
  });

  // Fetch Quotation sent/accepted leads when modal opens
  const fetchQuotationOptions = useCallback(async () => {
    setLoadingQuotations(true);
    try {
      const res = await api.get("/quotations");
      if (res.data?.success && Array.isArray(res.data.data)) {
        setQuotationOptions(res.data.data);
      } else {
        setQuotationOptions([]);
      }
    } catch (err) {
      console.error("fetchQuotationOptions error:", err);
    } finally {
      setLoadingQuotations(false);
    }
  }, []);

  useEffect(() => {
    if (newModalOpen) {
      fetchQuotationOptions();
    }
  }, [newModalOpen, fetchQuotationOptions]);

  // Fetch Stats from GET /api/projects/stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/projects/stats");
      if (res.data?.success && Array.isArray(res.data.data)) {
        const rows = res.data.data;
        let total = 0;
        let inProgress = 0;
        let subsidy = 0;
        let completed = 0;

        rows.forEach((item) => {
          const count = Number(item.count) || 0;
          total += count;
          if (
            item.stage === "DISCOM Application" ||
            item.stage === "Pre-Install Inspection" ||
            item.stage === "Procurement" ||
            item.stage === "Installation In Progress" ||
            item.stage === "Commissioning"
          ) {
            inProgress += count;
          }
          if (
            item.stage === "Subsidy Applied" ||
            item.stage === "Subsidy Received"
          ) {
            subsidy += count;
          }
          if (
            item.stage === "Handover Done" ||
            item.stage === "Warranty Period"
          ) {
            completed += count;
          }
        });

        setStats({ total, inProgress, subsidy, completed });
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
      toast.error(err.response?.data?.message || "Failed to load projects.");
      setProjects([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, selectedStage, search]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Search Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0);
  };

  // Clear Filters
  const handleClearFilters = () => {
    setSearch("");
    setSearchInput("");
    setSelectedStage("All");
    setPage(0);
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_name.trim()) {
      toast.error("Customer name is required.");
      return;
    }
    if (!formData.customer_phone.trim()) {
      toast.error("Customer phone is required.");
      return;
    }

    setCreating(true);
    try {
      const res = await api.post("/projects", formData);
      if (res.data?.success) {
        toast.success(res.data.message || "Project created successfully!");
        setNewModalOpen(false);
        setSelectedQuotation(null);
        setFormData({
          customer_name: "",
          customer_phone: "",
          lead_id: null,
          quotation_id: null,
          system_capacity_kw: "5.00",
          panel_count: "",
          inverter_kw: "",
    total_cost: "",
    amount_received: "",
    payment_status: "Pending",
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

  // Open Delete Confirmation
  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setDeleteConfirmOpen(true);
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/projects/${projectToDelete.id}`);
      if (res.data?.success) {
        toast.success(res.data.message || "Project deleted successfully!");
        setDeleteConfirmOpen(false);
        setProjectToDelete(null);
        fetchProjects();
        fetchStats();
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

  // Modern Stage Badge Renderer
  const renderStageBadge = (stageName) => {
    const config = getStageConfig(stageName);
    return (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.8,
          px: 1.4,
          py: 0.45,
          borderRadius: "8px",
          backgroundColor: config.bg,
          border: `1px solid ${config.border}`,
          color: config.color,
          fontWeight: 700,
          fontSize: "0.76rem",
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
    if (!dateVal) return "Not Scheduled";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "Not Scheduled";
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Not Scheduled";
    }
  };

  const hasActiveFilters = Boolean(search || selectedStage !== "All");

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
              color: COLORS.textPrimary,
            }}
          >
            Projects
          </Typography>
        </Breadcrumbs>

        {/* 2. HERO HEADER (RESPONSIVE NO-OVERLAP) */}
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
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                color: COLORS.textPrimary,
                fontSize: { xs: "1.15rem", sm: "1.3rem" },
                letterSpacing: "-0.02em",
              }}
            >
              Project Execution & Handover
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: COLORS.textSecondary,
                fontSize: "0.82rem",
                mt: 0.3,
              }}
            >
              10-stage end-to-end solar engineering pipeline from order closure to subsidy & AMC warranty
            </Typography>
          </Box>

          <Stack
            direction="row"
            alignItems="center"
            gap={1.2}
            sx={{ flexWrap: "wrap", width: { xs: "100%", sm: "auto" } }}
          >
            {/* View Mode Toggle */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newView) => newView && setViewMode(newView)}
              size="small"
              sx={{
                height: 38,
                backgroundColor: "#F1F5F9",
                borderRadius: "8px",
                p: 0.3,
                "& .MuiToggleButton-root": {
                  border: 0,
                  borderRadius: "6px",
                  px: 1.5,
                  py: 0.5,
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
                <Tooltip title="Modern Card View">
                  <Stack direction="row" alignItems="center" gap={0.6}>
                    <ViewListOutlinedIcon sx={{ fontSize: 18 }} />
                    <Typography sx={{ fontSize: "0.76rem", fontWeight: 700 }}>
                      Cards
                    </Typography>
                  </Stack>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="table">
                <Tooltip title="Data Table View">
                  <Stack direction="row" alignItems="center" gap={0.6}>
                    <TableChartOutlinedIcon sx={{ fontSize: 18 }} />
                    <Typography sx={{ fontSize: "0.76rem", fontWeight: 700 }}>
                      Table
                    </Typography>
                  </Stack>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Refresh */}
            <Tooltip title="Refresh Projects">
              <span>
                <IconButton
                  onClick={() => {
                    fetchProjects();
                    fetchStats();
                  }}
                  disabled={loading}
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: "8px",
                    border: `1px solid ${COLORS.border}`,
                    backgroundColor: COLORS.card,
                    color: COLORS.textPrimary,
                    "&:hover": { backgroundColor: "#F8FAFC" },
                  }}
                >
                  <RefreshIcon
                    sx={{
                      fontSize: 19,
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

            {/* Create Project Button */}
            <Button
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: 19 }} />}
              onClick={() => setNewModalOpen(true)}
              sx={{
                height: 38,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.82rem",
                px: 2.2,
                backgroundColor: COLORS.primary,
                color: "#FFFFFF",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.15)",
                whiteSpace: "nowrap",
                "&:hover": { backgroundColor: COLORS.primaryHover },
              }}
            >
              New Project
            </Button>
          </Stack>
        </Paper>

        {/* 3. STATS CARDS (4 KPI BOXES WITH EXACT 10-STAGE AWARENESS) */}
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          {/* Total Projects */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              onClick={() => {
                setSelectedStage("All");
                setPage(0);
              }}
              sx={{
                p: 2.2,
                borderRadius: "14px",
                border: `1px solid ${selectedStage === "All" ? COLORS.primary : COLORS.border}`,
                backgroundColor: COLORS.card,
                cursor: "pointer",
                transition: "all 0.18s ease-in-out",
                "&:hover": {
                  borderColor: COLORS.primary,
                  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      color: COLORS.textSecondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Total Projects
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "1.7rem",
                      fontWeight: 900,
                      color: COLORS.textPrimary,
                      mt: 0.3,
                    }}
                  >
                    {stats.total}
                  </Typography>
                  <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                    All active & historical orders
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    backgroundColor: "#EFF6FF",
                    color: "#2563EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FolderSpecialOutlinedIcon sx={{ fontSize: 24 }} />
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* Execution In Progress */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              onClick={() => {
                setSelectedStage("Installation In Progress");
                setPage(0);
              }}
              sx={{
                p: 2.2,
                borderRadius: "14px",
                border: `1px solid ${selectedStage === "Installation In Progress" ? "#F59E0B" : COLORS.border}`,
                backgroundColor: COLORS.card,
                cursor: "pointer",
                transition: "all 0.18s ease-in-out",
                "&:hover": {
                  borderColor: "#F59E0B",
                  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.1)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      color: COLORS.textSecondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    In Execution
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "1.7rem",
                      fontWeight: 900,
                      color: "#D97706",
                      mt: 0.3,
                    }}
                  >
                    {stats.inProgress}
                  </Typography>
                  <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                    DISCOM, Survey, Procurement & Build
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    backgroundColor: "#FFFBEB",
                    color: "#D97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <EngineeringOutlinedIcon sx={{ fontSize: 24 }} />
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* Subsidy Tracking (Applied & Received) */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              onClick={() => {
                setSelectedStage("Subsidy Received");
                setPage(0);
              }}
              sx={{
                p: 2.2,
                borderRadius: "14px",
                border: `1px solid ${selectedStage === "Subsidy Received" ? "#0891B2" : COLORS.border}`,
                backgroundColor: COLORS.card,
                cursor: "pointer",
                transition: "all 0.18s ease-in-out",
                "&:hover": {
                  borderColor: "#0891B2",
                  boxShadow: "0 4px 12px rgba(8, 145, 178, 0.1)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      color: COLORS.textSecondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Subsidy Pipeline
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "1.7rem",
                      fontWeight: 900,
                      color: "#0891B2",
                      mt: 0.3,
                    }}
                  >
                    {stats.subsidy}
                  </Typography>
                  <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                    Subsidy Applied & DBT Credited
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    backgroundColor: "#ECFEFF",
                    color: "#0891B2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AccountBalanceOutlinedIcon sx={{ fontSize: 24 }} />
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* Handover & Warranty */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              onClick={() => {
                setSelectedStage("Handover Done");
                setPage(0);
              }}
              sx={{
                p: 2.2,
                borderRadius: "14px",
                border: `1px solid ${selectedStage === "Handover Done" ? "#059669" : COLORS.border}`,
                backgroundColor: COLORS.card,
                cursor: "pointer",
                transition: "all 0.18s ease-in-out",
                "&:hover": {
                  borderColor: "#059669",
                  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.1)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      color: COLORS.textSecondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Handover & AMC
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "1.7rem",
                      fontWeight: 900,
                      color: "#059669",
                      mt: 0.3,
                    }}
                  >
                    {stats.completed}
                  </Typography>
                  <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                    Delivered & 25-yr warranty period
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    backgroundColor: "#ECFDF5",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircleOutlinedIcon sx={{ fontSize: 24 }} />
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* 4. FILTER BAR (SEARCH + 10 STAGES DROPDOWN + RESET) */}
        <Paper
          elevation={0}
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            p: 1.8,
            mb: 2.5,
            borderRadius: "14px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          {/* Search Box */}
          <Box sx={{ flex: "1 1 280px", minWidth: 220 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by project #, customer name, phone, city..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 19, color: COLORS.textMuted }} />
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
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  backgroundColor: "#F8FAFC",
                },
              }}
            />
          </Box>

          {/* Stage Dropdown (10 Stages in Sequential Order) */}
          <Box sx={{ minWidth: 230 }}>
            <Select
              fullWidth
              size="small"
              value={selectedStage}
              onChange={(e) => {
                setSelectedStage(e.target.value);
                setPage(0);
              }}
              sx={{
                borderRadius: "8px",
                backgroundColor: "#F8FAFC",
                fontSize: "0.82rem",
                fontWeight: 600,
              }}
            >
              <MenuItem value="All">
                <strong>All Stages (Complete Pipeline)</strong>
              </MenuItem>
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
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="small"
            sx={{
              height: 38,
              borderRadius: "8px",
              px: 2.2,
              backgroundColor: COLORS.primary,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.8rem",
              "&:hover": { backgroundColor: COLORS.primaryHover },
            }}
          >
            Search
          </Button>

          {hasActiveFilters && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterListOffIcon sx={{ fontSize: 16 }} />}
              onClick={handleClearFilters}
              sx={{
                height: 38,
                borderRadius: "8px",
                px: 2,
                borderColor: COLORS.border,
                color: COLORS.textSecondary,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.8rem",
                "&:hover": { backgroundColor: "#F1F5F9" },
              }}
            >
              Reset Filters
            </Button>
          )}
        </Paper>

        {/* 5. CONTENT AREA: SKELETON / EMPTY / BOX / TABLE */}
        {loading ? (
          <Stack spacing={2}>
            {[1, 2, 3].map((n) => (
              <Skeleton
                key={n}
                variant="rounded"
                height={160}
                sx={{ borderRadius: "14px" }}
              />
            ))}
          </Stack>
        ) : projects.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              py: 8,
              px: 3,
              borderRadius: "14px",
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
                fontSize: "1.1rem",
                mb: 0.5,
              }}
            >
              No projects found
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: COLORS.textSecondary,
                fontSize: "0.82rem",
                maxWidth: 440,
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
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 700,
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
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 700,
                  backgroundColor: COLORS.primary,
                  "&:hover": { backgroundColor: COLORS.primaryHover },
                }}
              >
                New Project
              </Button>
            )}
          </Paper>
        ) : viewMode === "box" ? (
          /* ============================================================== */
          /* 6. REDESIGNED CARD VIEW (ZERO OVERLAPPING, MODERN SAAS GRID)   */
          /* ============================================================== */
          <Stack spacing={2}>
            {projects.map((proj) => {
              const currentStep = getStageIndex(proj.stage) + 1;
              const progressPct = getProgressPercent(proj.stage);
              const stageConfig = getStageConfig(proj.stage);

              return (
                <Paper
                  key={proj.id}
                  elevation={0}
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: "14px",
                    border: `1px solid ${COLORS.border}`,
                    backgroundColor: COLORS.card,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      borderColor: COLORS.primary,
                      boxShadow: "0 6px 20px rgba(15, 23, 42, 0.08)",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  {/* Top Header: Project Code + Customer Info & Stage Badge */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      justifyContent: "space-between",
                      alignItems: { xs: "flex-start", sm: "center" },
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    {/* Left: Project Number + Customer Name + Location Subtitle */}
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        gap={1.2}
                        sx={{ flexWrap: "wrap", mb: 0.4 }}
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
                            letterSpacing: "0.03em",
                          }}
                        >
                          {proj.project_number}
                        </Box>

                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 800,
                            fontSize: "1.08rem",
                            color: COLORS.textPrimary,
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {proj.customer_name}
                        </Typography>
                      </Stack>

                      {/* Location Subtitle */}
                      <Stack
                        direction="row"
                        alignItems="center"
                        gap={0.5}
                        sx={{ color: COLORS.textSecondary }}
                      >
                        <LocationOnOutlinedIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                        <Typography sx={{ fontSize: "0.76rem" }}>
                          {[proj.city, proj.state].filter(Boolean).join(", ") ||
                            proj.customer_address ||
                            "Site location not specified"}
                        </Typography>
                      </Stack>
                    </Box>

                    {/* Right: Stage Badge */}
                    <Box sx={{ flexShrink: 0 }}>
                      {renderStageBadge(proj.stage)}
                    </Box>
                  </Box>

                  {/* 10-Stage Milestone Progress Bar */}
                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 0.6,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: COLORS.textSecondary,
                        }}
                      >
                        Stage {currentStep} of 10:{" "}
                        <Box
                          component="span"
                          sx={{ color: stageConfig.color, fontWeight: 800 }}
                        >
                          {stageConfig.label}
                        </Box>
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          color: COLORS.textPrimary,
                        }}
                      >
                        {progressPct}% Completed
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progressPct}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: "#F1F5F9",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 3,
                          backgroundColor: stageConfig.dot,
                        },
                      }}
                    />
                  </Box>

                  {/* 4 Distinct Data Metric Cards (NO COLLISION / OVERLAP) */}
                  <Grid container spacing={1.5} sx={{ mb: 2 }}>
                    {/* Metric 1: System Capacity */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Box
                        sx={{
                          p: 1.4,
                          borderRadius: "10px",
                          backgroundColor: "#F8FAFC",
                          border: `1px solid ${COLORS.border}`,
                          height: "100%",
                          boxSizing: "border-box",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            color: COLORS.textMuted,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            mb: 0.4,
                          }}
                        >
                          System Capacity
                        </Typography>
                        <Stack direction="row" alignItems="center" gap={0.8}>
                          <SolarPowerIcon sx={{ fontSize: 20, color: "#D97706" }} />
                          <Typography
                            sx={{
                              fontSize: "0.92rem",
                              fontWeight: 800,
                              color: COLORS.textPrimary,
                            }}
                          >
                            {parseFloat(proj.system_capacity_kw || 1).toFixed(2)} kW
                          </Typography>
                        </Stack>
                        <Typography
                          sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mt: 0.3 }}
                        >
                          {proj.panel_count ? `${proj.panel_count} Panels` : "Solar Array"} •{" "}
                          {proj.inverter_kw ? `${proj.inverter_kw} kW Inverter` : "Grid Inverter"}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Metric 2: Customer Contact */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Box
                        sx={{
                          p: 1.4,
                          borderRadius: "10px",
                          backgroundColor: "#F8FAFC",
                          border: `1px solid ${COLORS.border}`,
                          height: "100%",
                          boxSizing: "border-box",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            color: COLORS.textMuted,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            mb: 0.4,
                          }}
                        >
                          Customer Contact
                        </Typography>
                        <Stack direction="row" alignItems="center" gap={0.8}>
                          <PhoneIcon sx={{ fontSize: 17, color: "#2563EB" }} />
                          <Typography
                            component="a"
                            href={`tel:${proj.customer_phone}`}
                            sx={{
                              fontSize: "0.9rem",
                              fontWeight: 700,
                              color: "#2563EB",
                              textDecoration: "none",
                              "&:hover": { textDecoration: "underline" },
                            }}
                          >
                            {proj.customer_phone || "—"}
                          </Typography>
                        </Stack>
                        <Typography
                          sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mt: 0.3 }}
                        >
                          Direct Customer Mobile
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Metric 3: Assigned Rep */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Box
                        sx={{
                          p: 1.4,
                          borderRadius: "10px",
                          backgroundColor: "#F8FAFC",
                          border: `1px solid ${COLORS.border}`,
                          height: "100%",
                          boxSizing: "border-box",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            color: COLORS.textMuted,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            mb: 0.4,
                          }}
                        >
                          Project Engineer
                        </Typography>
                        <Stack direction="row" alignItems="center" gap={0.8}>
                          <Avatar
                            sx={{
                              width: 22,
                              height: 22,
                              fontSize: "0.68rem",
                              backgroundColor: COLORS.primary,
                              fontWeight: 800,
                            }}
                          >
                            {(proj.assigned_to_name || "U")[0]}
                          </Avatar>
                          <Typography
                            sx={{
                              fontSize: "0.86rem",
                              fontWeight: 700,
                              color: COLORS.textPrimary,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {proj.assigned_to_name || "Unassigned"}
                          </Typography>
                        </Stack>
                        <Typography
                          sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mt: 0.3 }}
                        >
                          Lead Execution Manager
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Metric 4: Installation Target */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Box
                        sx={{
                          p: 1.4,
                          borderRadius: "10px",
                          backgroundColor: "#F8FAFC",
                          border: `1px solid ${COLORS.border}`,
                          height: "100%",
                          boxSizing: "border-box",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            color: COLORS.textMuted,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            mb: 0.4,
                          }}
                        >
                          Target Timeline
                        </Typography>
                        <Stack direction="row" alignItems="center" gap={0.8}>
                          <CalendarTodayIcon sx={{ fontSize: 16, color: COLORS.textMuted }} />
                          <Typography
                            sx={{
                              fontSize: "0.86rem",
                              fontWeight: 700,
                              color: COLORS.textPrimary,
                            }}
                          >
                            {formatDate(proj.installation_start_date)}
                          </Typography>
                        </Stack>
                        <Typography
                          sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mt: 0.3 }}
                        >
                          {proj.completion_date
                            ? `Done by ${formatDate(proj.completion_date)}`
                            : "On-site construction"}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Card Bottom Row: Timestamps + Action Buttons */}
                  <Box
                    sx={{
                      pt: 1.5,
                      borderTop: `1px solid ${COLORS.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.73rem",
                        color: COLORS.textMuted,
                      }}
                    >
                      Created on {formatDate(proj.created_at)}
                    </Typography>

                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                        onClick={() => navigate(`${projectBasePath}/${proj.project_uuid || proj.id}`)}
                        sx={{
                          height: 32,
                          borderRadius: "8px",
                          textTransform: "none",
                          fontWeight: 700,
                          fontSize: "0.78rem",
                          px: 2,
                          backgroundColor: COLORS.primary,
                          color: "#FFFFFF",
                          "&:hover": { backgroundColor: COLORS.primaryHover },
                        }}
                      >
                        View Project Details
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(proj)}
                        sx={{
                          height: 32,
                          width: 32,
                          borderRadius: "8px",
                          border: `1px solid ${COLORS.border}`,
                          color: "#EF4444",
                          "&:hover": {
                            backgroundColor: "#FEF2F2",
                            borderColor: "#FCA5A5",
                          },
                        }}
                      >
                        <Tooltip title="Delete Project">
                          <DeleteIcon sx={{ fontSize: 17 }} />
                        </Tooltip>
                      </IconButton>
                    </Stack>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        ) : (
          /* ============================================================== */
          /* 7. DATA TABLE VIEW                                             */
          /* ============================================================== */
          <Paper
            elevation={0}
            sx={{
              borderRadius: "14px",
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
                        fontSize: "0.78rem",
                        py: 1.4,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Project No
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        py: 1.4,
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
                        fontSize: "0.78rem",
                        py: 1.4,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Capacity
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        py: 1.4,
                        whiteSpace: "nowrap",
                        minWidth: 200,
                      }}
                    >
                      Execution Stage (1-10)
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        py: 1.4,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Engineer
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        py: 1.4,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Install Date
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        py: 1.4,
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
                        "& td": { py: 1.3, px: 2 },
                      }}
                    >
                      <TableCell sx={{ fontSize: "0.78rem", fontWeight: 700 }}>
                        <Box
                          sx={{
                            px: 1,
                            py: 0.3,
                            borderRadius: "6px",
                            backgroundColor: "#EFF6FF",
                            color: "#1D4ED8",
                            fontFamily: "monospace",
                            fontWeight: 800,
                            display: "inline-block",
                          }}
                        >
                          {proj.project_number}
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography sx={{ fontSize: "0.84rem", fontWeight: 700 }}>
                          {proj.customer_name}
                        </Typography>
                        <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                          {proj.customer_phone || "—"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <SolarPowerIcon sx={{ fontSize: 16, color: "#D97706" }} />
                          <Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>
                            {parseFloat(proj.system_capacity_kw || 1).toFixed(2)} kW
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>{renderStageBadge(proj.stage)}</TableCell>

                      <TableCell sx={{ fontSize: "0.8rem", color: COLORS.textSecondary }}>
                        {proj.assigned_to_name || "Unassigned"}
                      </TableCell>

                      <TableCell sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}>
                        {formatDate(proj.installation_start_date)}
                      </TableCell>

                      <TableCell align="right">
                        <Stack direction="row" spacing={0.8} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`${projectBasePath}/${proj.project_uuid || proj.id}`)}
                            sx={{
                              height: 30,
                              borderRadius: "6px",
                              textTransform: "none",
                              fontWeight: 700,
                              fontSize: "0.74rem",
                              px: 1.5,
                              borderColor: COLORS.border,
                              color: COLORS.textPrimary,
                            }}
                          >
                            Details
                          </Button>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(proj)}
                            sx={{
                              height: 30,
                              width: 30,
                              borderRadius: "6px",
                              border: `1px solid ${COLORS.border}`,
                              color: "#EF4444",
                              "&:hover": { backgroundColor: "#FEF2F2" },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Stack>
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
          <Box sx={{ mt: 2.5, display: "flex", justifyContent: "flex-end" }}>
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
                  fontSize: "0.78rem",
                  color: COLORS.textSecondary,
                },
              }}
            />
          </Box>
        )}
      </Box>

      {/* ============================================================== */}
      {/* CREATE NEW PROJECT MODAL (SPACIOUS maxWidth="md" - NO OVERLAPPING)*/}
      {/* ============================================================== */}
      <Dialog
        open={newModalOpen}
        onClose={() => !creating && setNewModalOpen(false)}
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
            pb: 1,
          }}
        >
          Create New Solar Installation Project
          <IconButton
            size="small"
            onClick={() => setNewModalOpen(false)}
            disabled={creating}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleCreateSubmit}>
          <DialogContent dividers sx={{ borderColor: COLORS.border, py: 2.5 }}>
            <Stack spacing={3}>
              {/* SECTION A: Quotation Link / Lead Selection */}
              <Box>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    color: COLORS.primary,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    mb: 1,
                  }}
                >
                  Step 1: Select Approved Quotation / Customer
                </Typography>
                <Autocomplete
                  options={quotationOptions}
                  loading={loadingQuotations}
                  value={selectedQuotation}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    return `${option.customer_name || "Unknown"} (${option.customer_phone || "No phone"}) • [${option.quotation_number || "QUO"}] • ${option.system_capacity_kw || 0} kW (${option.status || "Sent"})`;
                  }}
                  isOptionEqualToValue={(option, val) => option.id === val.id}
                  onChange={(e, newValue) => {
                    setSelectedQuotation(newValue);
                    if (newValue) {
                      setFormData((prev) => ({
                        ...prev,
                        customer_name: newValue.customer_name || "",
                        customer_phone: newValue.customer_phone || "",
                        lead_id: newValue.lead_id || null,
                        quotation_id: newValue.id || null,
                        total_cost: (newValue.grand_total || newValue.total_amount || newValue.net_payable_amount || newValue.final_amount) ? String(newValue.grand_total || newValue.total_amount || newValue.net_payable_amount || newValue.final_amount) : prev.total_cost,
                        system_capacity_kw: newValue.system_capacity_kw ? String(newValue.system_capacity_kw) : prev.system_capacity_kw,
                        customer_address: newValue.customer_address || prev.customer_address || "",
                        city: newValue.city || prev.city || "",
                        state: newValue.state || prev.state || "",
                        pincode: newValue.pincode || prev.pincode || "",
                      }));
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        lead_id: null,
                        quotation_id: null,
                      }));
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder="Search and select approved quotation..."
                    />
                  )}
                  noOptionsText={
                    loadingQuotations
                      ? "Loading quotations..."
                      : "No quotation found. You can enter details manually below."
                  }
                />
              </Box>

              <Divider />

              {/* SECTION B: Customer & Site Details */}
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
                  Step 2: Customer & Site Location
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      required
                      label="Customer Full Name *"
                      value={formData.customer_name}
                      onChange={(e) =>
                        setFormData({ ...formData, customer_name: e.target.value })
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      required
                      label="Customer Mobile Phone *"
                      value={formData.customer_phone}
                      onChange={(e) =>
                        setFormData({ ...formData, customer_phone: e.target.value })
                      }
                    />
                  </Grid>

                  <Grid size={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Installation Site Address"
                      placeholder="e.g. Plot 42, Sunrise Enclave..."
                      value={formData.customer_address}
                      onChange={(e) =>
                        setFormData({ ...formData, customer_address: e.target.value })
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="City"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="State"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Pincode"
                      value={formData.pincode}
                      onChange={(e) =>
                        setFormData({ ...formData, pincode: e.target.value })
                      }
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* SECTION C: Technical System Specs & Pipeline Stage */}
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
                  Step 3: Solar Engineering Specs & Stage
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
                      value={formData.system_capacity_kw}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          system_capacity_kw: e.target.value,
                        })
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Solar Panel Count (pcs)"
                      value={formData.panel_count}
                      onChange={(e) =>
                        setFormData({ ...formData, panel_count: e.target.value })
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
                      value={formData.inverter_kw}
                      onChange={(e) =>
                        setFormData({ ...formData, inverter_kw: e.target.value })
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Select
                      fullWidth
                      size="small"
                      value={formData.stage}
                      onChange={(e) =>
                        setFormData({ ...formData, stage: e.target.value })
                      }
                    >
                      {STAGES.map((stg, i) => (
                        <MenuItem key={stg} value={stg}>
                          {i + 1}. {stg}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>

                  <Grid size={12}>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={3}
                      label="Project Notes / Special Site Instructions"
                      placeholder="e.g. Structure elevated GI, shadow analysis done, meter shift required..."
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* SECTION D: Commercial Contract & Payment Details */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: COLORS.textPrimary }}>
                    Step 4: Commercial Contract & Payment Details
                  </Typography>
                  <Chip
                    size="small"
                    label={
                      (() => {
                        const total = Number(formData.total_cost) || 0;
                        const rec = Number(formData.amount_received) || 0;
                        const bal = Math.max(0, total - rec);
                        if (total === 0) return "Pending Valuation";
                        if (bal === 0) return "100% Paid (Eligible for Handover)";
                        return `₹${bal.toLocaleString("en-IN")} Pending`;
                      })()
                    }
                    sx={{
                      height: 22,
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      bgcolor:
                        (Number(formData.total_cost) > 0 && Math.max(0, (Number(formData.total_cost) || 0) - (Number(formData.amount_received) || 0)) === 0)
                          ? "#DCFCE7"
                          : "#FEF3C7",
                      color:
                        (Number(formData.total_cost) > 0 && Math.max(0, (Number(formData.total_cost) || 0) - (Number(formData.amount_received) || 0)) === 0)
                          ? "#166534"
                          : "#92400E",
                    }}
                  />
                </Box>

                <Alert severity="info" sx={{ mb: 2, fontSize: "0.78rem", py: 0.5, borderRadius: 1.5 }}>
                  <strong>Handover Clearance Rule:</strong> Final project handover dossiers, warranty certificates, and statutory commissioning documents cannot be released to the customer until 100% of the project cost is received.
                </Alert>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Total Project Cost (₹)"
                      placeholder="e.g. 250000"
                      value={formData.total_cost}
                      onChange={(e) => {
                        const val = e.target.value;
                        const rec = Number(formData.amount_received) || 0;
                        const cost = Number(val) || 0;
                        const bal = Math.max(0, cost - rec);
                        setFormData({
                          ...formData,
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
                      label="Amount Received / Advance (₹)"
                      placeholder="e.g. 50000"
                      value={formData.amount_received}
                      onChange={(e) => {
                        const val = e.target.value;
                        const cost = Number(formData.total_cost) || 0;
                        const rec = Number(val) || 0;
                        const bal = Math.max(0, cost - rec);
                        setFormData({
                          ...formData,
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
                          const cost = Number(formData.total_cost) || 0;
                          const rec = Number(formData.amount_received) || 0;
                          return `₹${Math.max(0, cost - rec).toLocaleString("en-IN")}`;
                        })()
                      }
                      sx={{
                        "& .MuiInputBase-input": {
                          fontWeight: 700,
                          color: Math.max(0, (Number(formData.total_cost) || 0) - (Number(formData.amount_received) || 0)) > 0 ? "#DC2626" : "#16A34A",
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
                px: 3,
                "&:hover": { backgroundColor: COLORS.primaryHover },
              }}
            >
              {creating ? "Creating Project..." : "Create Project"}
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
            <strong>{projectToDelete?.project_number}</strong> for{" "}
            <strong>{projectToDelete?.customer_name}</strong>?
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
