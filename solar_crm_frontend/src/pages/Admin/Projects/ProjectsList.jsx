import { useState, useEffect, useCallback, useRef } from "react";
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
  Divider,
  Alert,
} from "@mui/material";

// Icons
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import FolderSpecialOutlinedIcon from "@mui/icons-material/FolderSpecialOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

import ProjectWorkspace from "./ProjectWorkspace";
import toast from "react-hot-toast";
import api from "../../../utils/api";
import {
  STAGES,
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
  const isManager = Number(user?.role_id) === 2 || roleName.includes("manager");
  const isEngineer = Number(user?.role_id) === 4 || roleName.includes("engineer");
  const canCreate = [1, 2].includes(Number(user?.role_id));
  const canDelete = [1,2].includes(Number(user?.role_id));
  const projectBasePath = isEngineer ? "/engineer/projects" : isManager ? "/manager/projects" : "/projects";
  const dashboardPath = isEngineer ? "/engineer/dashboard" : isManager ? "/manager/dashboard" : "/dashboard";

  // State
  const [projects, setProjects] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const requestSequence = useRef(0);
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
  const [surveyOptions, setSurveyOptions] = useState([]);
  const [loadingSurveys, setLoadingSurveys] = useState(false);
  const [selectedSurveyOption, setSelectedSurveyOption] = useState(null);
  const [engineersList, setEngineersList] = useState([]);
  const [linkSource, setLinkSource] = useState("survey"); // 'survey' or 'quotation'

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
    system_capacity_kw: "",
    panel_count: "",
    inverter_kw: "",
    total_cost: "",
    amount_received: "",
    payment_status: "Pending",
    customer_address: "",
    city: "",
    state: "",
    pincode: "",
    stage: "Pre-Install Inspection",
    assigned_to: "",
    notes: "",
  });

  // Fetch Quotation sent/accepted leads and completed surveys when modal opens
  const fetchModalOptions = useCallback(async () => {
    setLoadingQuotations(true);
    setLoadingSurveys(true);
    try {
      const [quoteRes, surveyRes, engRes] = await Promise.allSettled([
        api.get("/quotations"),
        api.get("/projects/completed-surveys"),
        api.get("/surveys/engineers"),
      ]);

      if (quoteRes.status === "fulfilled" && quoteRes.value.data?.success) {
        setQuotationOptions(Array.isArray(quoteRes.value.data.data) ? quoteRes.value.data.data : []);
      }
      if (surveyRes.status === "fulfilled" && surveyRes.value.data?.success) {
        setSurveyOptions(Array.isArray(surveyRes.value.data.data) ? surveyRes.value.data.data : []);
      }
      if (engRes.status === "fulfilled" && engRes.value.data?.success) {
        setEngineersList(Array.isArray(engRes.value.data.data) ? engRes.value.data.data : []);
      }
    } catch (err) {
      console.error("fetchModalOptions error:", err);
    } finally {
      setLoadingQuotations(false);
      setLoadingSurveys(false);
    }
  }, []);

  useEffect(() => {
    if (newModalOpen) {
      fetchModalOptions();
    }
  }, [newModalOpen, fetchModalOptions]);

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
          subsidy += Number(item.tracker_credited_count || 0);
          completed += Number(item.handover_count || 0);
        });

        setStats({ total, inProgress, subsidy, completed });
      }
    } catch (err) {
      console.error("fetchStats error:", err);
    }
  }, []);

  // Fetch Projects List from GET /api/projects
  const fetchProjects = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setLoadError("");
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        stage: selectedStage === "All" ? "" : selectedStage,
        search: search.trim(),
      };

      const res = await api.get("/projects", { params });
      if (sequence !== requestSequence.current) return;
      if (res.data?.success) {
        setProjects(res.data.data?.projects || []);
        setTotalCount(res.data.data?.total || 0);
      } else {
        setProjects([]);
        setTotalCount(0);
      }
    } catch (err) {
      if (sequence !== requestSequence.current) return;
      console.error("fetchProjects error:", err);
      setLoadError(err.response?.data?.message || "Failed to load projects. Please try again.");
      setProjects([]);
      setTotalCount(0);
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
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
    if (creating || !canCreate) return;
    if (!formData.customer_name.trim()) {
      toast.error("Customer name is required.");
      return;
    }
    if (!formData.customer_phone.trim()) {
      toast.error("Customer phone is required.");
      return;
    }

    if (!Number.isFinite(Number(formData.system_capacity_kw)) || Number(formData.system_capacity_kw) <= 0) {
      toast.error("System capacity must be greater than zero."); return;
    }
    if (Number(formData.total_cost) < 0 || Number(formData.amount_received) < 0) {
      toast.error("Payment amounts cannot be negative."); return;
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
    if (!projectToDelete || deleting || !canDelete) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/projects/${projectToDelete.id}`);
      if (res.data?.success) {
        toast.success(res.data.message || "Project deleted successfully!");
        setDeleteConfirmOpen(false);
        setProjectToDelete(null);
        if (projects.length === 1 && page > 0) setPage(page - 1);
        else fetchProjects();
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
    <ProjectWorkspace>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Breadcrumbs aria-label="Breadcrumb">
          <Button size="small" onClick={() => navigate(dashboardPath)} startIcon={<HomeOutlinedIcon />}>Dashboard</Button>
          <Typography variant="body2">Projects</Typography>
        </Breadcrumbs>
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
          <Box sx={{ minWidth: 0, flex: "1 1 260px" }}>
            <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 700 }}>SOLAR DELIVERY</Typography>
            <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 26, md: 30 }, fontWeight: 700 }}>Projects</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>From confirmed order to installation, handover and ongoing care.</Typography>
          </Box>
          <Stack direction="row"  sx={{gap: 1,  flexWrap: "wrap" }}>
            <Button variant="outlined" startIcon={<RefreshIcon />} disabled={loading} onClick={() => { fetchProjects(); fetchStats(); }}>Refresh</Button>
            {canCreate && <Button variant="contained" startIcon={<AddIcon />} onClick={() => setNewModalOpen(true)}>New project</Button>}
          </Stack>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
          {[
            ["Total projects", stats.total, "All project records", <FolderSpecialOutlinedIcon />],
            ["In execution", stats.inProgress, "Approvals through commissioning", <EngineeringOutlinedIcon />],
            ["Subsidy credited", stats.subsidy, "Verified in Subsidy Tracker", <AccountBalanceOutlinedIcon />],
            ["Handover & care", stats.completed, "Handover and warranty", <CheckCircleOutlinedIcon />],
          ].map(([label, count, caption, icon]) => <Paper key={label} variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, boxShadow: "none" }}>
            <Stack sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }} direction="row"   >
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
              <Box sx={{ color: "text.secondary", display: { xs: "none", sm: "flex" } }}>{icon}</Box>
            </Stack>
            <Typography sx={{ fontSize: 30, fontWeight: 700, fontVariantNumeric: "tabular-nums", my: 0.5 }}>{count}</Typography>
            <Typography variant="caption">{caption}</Typography>
          </Paper>)}
        </Box>
        <Paper variant="outlined" sx={{ p: 2, boxShadow: "none" }}>
          <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
            <TextField label="Search projects" placeholder="Customer, phone or project number" size="small" value={searchInput} onChange={e => setSearchInput(e.target.value)} sx={{ flex: "2 1 240px", minWidth: 0 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
            <TextField select label="Project stage" size="small" value={selectedStage} onChange={e => { setSelectedStage(e.target.value); setPage(0); }} sx={{ flex: "1 1 220px", minWidth: 0 }}>
              <MenuItem value="All">All stages</MenuItem>
              {STAGES.map(stage => <MenuItem key={stage} value={stage}>{stage}</MenuItem>)}
            </TextField>
            <Button type="submit" variant="outlined">Search</Button>
            {hasActiveFilters && <Button onClick={handleClearFilters}>Clear filters</Button>}
            <ToggleButtonGroup value={viewMode} exclusive onChange={(_, value) => value && setViewMode(value)} size="small" aria-label="Project view">
              <ToggleButton value="box" aria-label="Card view"><ViewListOutlinedIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="table" aria-label="Table view"><TableChartOutlinedIcon fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Paper>
        <Stack direction="row"   sx={{justifyContent: "space-between", gap: 1,  flexWrap: "wrap" }}>
          <Typography variant="subtitle1">{hasActiveFilters ? "Filtered projects" : "Project workspace"}</Typography>
          <Typography variant="body2" color="text.secondary" role="status">{loading ? "Loading projects..." : `${totalCount} ${totalCount === 1 ? "project" : "projects"}`}</Typography>
        </Stack>
        {loadError ? <Alert severity="error" action={<Button color="inherit" onClick={fetchProjects}>Retry</Button>}>{loadError}</Alert>
          : loading ? <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>{[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={260} />)}</Box>
          : projects.length === 0 ? <Paper variant="outlined" sx={{ py: 7, px: 3, textAlign: "center", boxShadow: "none" }}>
            <SolarPowerIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1.5 }} />
            <Typography variant="h6">{hasActiveFilters ? "No matching projects" : "Your next installation starts here"}</Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>{hasActiveFilters ? "Try a different customer name or stage." : "Create a project to bring your customer, site and delivery milestones together."}</Typography>
            {hasActiveFilters ? <Button variant="outlined" onClick={handleClearFilters}>Clear filters</Button> : canCreate && <Button variant="contained" startIcon={<AddIcon />} onClick={() => setNewModalOpen(true)}>Create project</Button>}
          </Paper>
          : viewMode === "box" ? <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
            {projects.map(project => {
              const stage = getStageConfig(project.stage);
              const openProject = () => navigate(`${projectBasePath}/${project.project_uuid || project.id}`);
              return <Paper key={project.id} variant="outlined" sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2, boxShadow: "none", borderRadius: 3 }}>
                <Stack direction="row"    sx={{alignItems: "center", justifyContent: "space-between", gap: 1,  flexWrap: "wrap" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: "monospace" }}>{project.project_number}</Typography>
                  <Chip size="small" label={project.stage} sx={{ bgcolor: stage.bg, color: stage.color, height: "auto", minHeight: 26, "& .MuiChip-label": { whiteSpace: "normal", py: 0.5 } }} />
                </Stack>
                <Box>
                  <Typography component="h2" variant="h6" sx={{ fontSize: 19, mb: 0.5 }}>{project.customer_name}</Typography>
                  <Typography variant="body2" color="text.secondary">{[project.customer_address, project.city, project.state].filter(Boolean).join(", ") || "Site address not added"}</Typography>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 2 }}>
                  <Box><Typography variant="caption">System capacity</Typography><Typography sx={{ fontWeight: 700 }} >{Number(project.system_capacity_kw || 0).toFixed(2)} kW</Typography></Box>
                  <Box><Typography variant="caption">Project owner</Typography><Typography sx={{ fontWeight: 600 }} >{project.assigned_to_name || "Unassigned"}</Typography></Box>
                  <Box><Typography variant="caption">Installation start</Typography><Typography variant="body2">{formatDate(project.installation_start_date)}</Typography></Box>
                  <Box><Typography variant="caption">Customer phone</Typography><Typography variant="body2" component="a" href={`tel:${project.customer_phone}`} sx={{ display: "block", color: "inherit", textDecoration: "none" }}>{project.customer_phone || "Not added"}</Typography></Box>
                </Box>
                <Box sx={{ mt: "auto" }}>
                  <Stack direction="row"   sx={{justifyContent: "space-between", gap: 1,  mb: 1 }}><Typography variant="caption">Stage {getStageIndex(project.stage) + 1} of {STAGES.length}</Typography><Typography variant="caption">{getProgressPercent(project.stage)}% of workflow</Typography></Stack>
                  <LinearProgress variant="determinate" value={getProgressPercent(project.stage)} aria-label="Project workflow progress" sx={{ bgcolor: "#F1F5F9", "& .MuiLinearProgress-bar": { bgcolor: "#F59E0B" } }} />
                </Box>
                <Stack direction="row"    sx={{alignItems: "center", justifyContent: "space-between", gap: 1,  pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption">Created {formatDate(project.created_at)}</Typography>
                  <Stack direction="row"  sx={{gap: 0.5,  flexShrink: 0 }}>
                    {canDelete && <IconButton aria-label={`Delete project ${project.project_number}`} onClick={() => handleDeleteClick(project)} color="error"><DeleteIcon fontSize="small" /></IconButton>}
                    <Button variant="outlined" size="small" endIcon={<ArrowForwardIcon />} onClick={openProject}>Open project</Button>
                  </Stack>
                </Stack>
              </Paper>;
            })}
          </Box> : <Paper variant="outlined" sx={{ boxShadow: "none", overflow: "hidden" }}>
            <TableContainer><Table size="small" sx={{ minWidth: 850 }} aria-label="Projects">
              <TableHead><TableRow>{["Project / customer", "Stage", "Capacity", "Owner", "Installation", "Actions"].map(label => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
              <TableBody>{projects.map(project => <TableRow key={project.id} hover>
                <TableCell><Typography sx={{ fontWeight: 600 }} >{project.customer_name}</Typography><Typography variant="caption">{project.project_number}</Typography></TableCell>
                <TableCell><Chip size="small" label={project.stage} /></TableCell>
                <TableCell>{Number(project.system_capacity_kw || 0).toFixed(2)} kW</TableCell>
                <TableCell>{project.assigned_to_name || "Unassigned"}</TableCell><TableCell>{formatDate(project.installation_start_date)}</TableCell>
                <TableCell><Stack sx={{ gap: 0.5 }} direction="row" ><Button size="small" onClick={() => navigate(`${projectBasePath}/${project.project_uuid || project.id}`)}>Open project</Button>{canDelete && <IconButton aria-label={`Delete project ${project.project_number}`} color="error" onClick={() => handleDeleteClick(project)}><DeleteIcon fontSize="small" /></IconButton>}</Stack></TableCell>
              </TableRow>)}</TableBody>
            </Table></TableContainer>
          </Paper>}
        {!loadError && totalCount > 0 && <TablePagination component="div" count={totalCount} page={page} rowsPerPage={rowsPerPage} rowsPerPageOptions={[15, 30, 50]} onPageChange={(_, value) => setPage(value)} onRowsPerPageChange={e => { setRowsPerPage(Number(e.target.value)); setPage(0); }} sx={{ "& .MuiTablePagination-toolbar": { flexWrap: "wrap", justifyContent: "flex-end", px: 0 }, "& .MuiTablePagination-spacer": { display: { xs: "none", sm: "block" } } }} />}
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
              {/* SECTION A: Quotation Link / Completed Survey Selection */}
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5, flexWrap: "wrap", gap: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      color: COLORS.primary,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Step 1: Link Customer & Project Source
                  </Typography>

                  <ToggleButtonGroup
                    value={linkSource}
                    exclusive
                    onChange={(_, val) => val && setLinkSource(val)}
                    size="small"
                  >
                    <ToggleButton value="survey" sx={{ fontSize: "0.7rem", py: 0.3, px: 1, textTransform: "none", fontWeight: 700 }}>
                      From Completed Survey
                    </ToggleButton>
                    <ToggleButton value="quotation" sx={{ fontSize: "0.7rem", py: 0.3, px: 1, textTransform: "none", fontWeight: 700 }}>
                      From Quotation
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Stack>

                {linkSource === "survey" ? (
                  <Autocomplete
                    options={surveyOptions}
                    loading={loadingSurveys}
                    value={selectedSurveyOption}
                    getOptionLabel={(option) => {
                      if (typeof option === "string") return option;
                      return `${option.customer_name || "Unknown"} (${option.mobile_number || "No phone"}) • [${option.lead_code || "LEAD"}] • ${option.proposed_capacity_kw || option.required_kw || 0} kW • Eng: ${option.engineer_name || "Assigned"}`;
                    }}
                    isOptionEqualToValue={(option, val) => option.survey_id === val.survey_id}
                    onChange={(e, newValue) => {
                      setSelectedSurveyOption(newValue);
                      if (newValue) {
                        setFormData((prev) => ({
                          ...prev,
                          customer_name: newValue.customer_name || "",
                          customer_phone: newValue.mobile_number || "",
                          customer_address: newValue.address || "",
                          city: newValue.city || "",
                          state: newValue.state || "",
                          pincode: newValue.pincode || "",
                          lead_id: newValue.lead_id || null,
                          system_capacity_kw: String(newValue.proposed_capacity_kw || newValue.required_kw || "3.0"),
                          assigned_to: newValue.assigned_engineer_id || "",
                          stage: "Pre-Install Inspection",
                        }));
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder="Search and select completed site survey..."
                      />
                    )}
                    noOptionsText={loadingSurveys ? "Loading surveys..." : "No completed surveys found."}
                  />
                ) : (
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
                    noOptionsText={loadingQuotations ? "Loading quotations..." : "No quotation found."}
                  />
                )}
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
                      placeholder="e.g. Ramesh Kumar"
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
                      placeholder="e.g. 9876543210"
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
                      placeholder="e.g. Plot 42, Sunrise Enclave, Sector 5"
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
                      placeholder="e.g. Jaipur"
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
                      placeholder="e.g. Rajasthan"
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
                      placeholder="e.g. 302021"
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

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Solar Panel Count (pcs)"
                      placeholder="e.g. 10"
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
                      placeholder="e.g. 5.0"
                      value={formData.inverter_kw}
                      onChange={(e) =>
                        setFormData({ ...formData, inverter_kw: e.target.value })
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Initial Project Stage *"
                      value={formData.stage}
                      onChange={(e) =>
                        setFormData({ ...formData, stage: e.target.value })
                      }
                    >
                      {STAGES.map((stg, i) => (
                        <MenuItem key={stg} value={stg} disabled={i >= 6}>
                          {i + 1}. {stg}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Assign Site Engineer"
                      value={formData.assigned_to || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, assigned_to: e.target.value })
                      }
                    >
                      <MenuItem value="">
                        <em>Unassigned</em>
                      </MenuItem>
                      {engineersList.map((eng) => (
                        <MenuItem key={eng.id} value={eng.id}>
                          {eng.full_name} (Site Engineer)
                        </MenuItem>
                      ))}
                    </TextField>
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
    </ProjectWorkspace>
  );
}
