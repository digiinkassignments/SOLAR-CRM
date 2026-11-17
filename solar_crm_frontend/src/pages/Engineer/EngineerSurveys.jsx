import SurveyDocuments from "../../components/SurveyDocuments";
import toast from "react-hot-toast";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Skeleton,
  InputAdornment,
} from "@mui/material";

import {
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Event as EventIcon,
  LocationOn as LocationOnIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckCircleIcon,
  CloudUpload as CloudUploadIcon,
  Search as SearchIcon,
  AddAPhoto as AddAPhotoIcon,
  Engineering as EngineeringIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";

import api from "../../api/axios";
import { getSurveysList, completeSurvey, uploadSurveyPhotos } from "../../services/surveyService";
import { useAuth } from "../../context/AuthContext";
import ApproveSurveyModal from "../../components/ApproveSurveyModal";

export default function EngineerSurveys() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCoordinator = [1, 2].includes(Number(user?.role_id));
  const isEngineer = Number(user?.role_id) === 4;
  const projectBasePath = isEngineer ? "/engineer/projects" : "/projects";
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Complete Survey Modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [consumerWarning, setConsumerWarning] = useState("");
  const [modalError, setModalError] = useState("");

  // Approve Survey Modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [surveyToApprove, setSurveyToApprove] = useState(null);

  const [form, setForm] = useState({
    roof_type: "RCC Flat Roof",
    roof_area_sqft: "",
    shadow_conditions: "Shadow-Free",
    roof_orientation: "South",
    roof_tilt_angle: "",
    roof_ownership: "Self-Owned Freehold",
    noc_status: "NOC Not Required",
    electrical_phase: "Single Phase",
    sanctioned_load_kw: "",
    consumer_number: "",
    proposed_capacity_kw: "",
    feasibility_verdict: "Feasible",
    not_feasible_reason: "",
    lead_action_on_not_feasible: "Switch Lead to On Hold",
    site_notes: "",
    photos: [],
  });

  const singlePhaseAbove5Kw =
    (form.electrical_phase === "Single Phase" ||
      form.electrical_phase?.toLowerCase()?.includes("1-phase") ||
      form.electrical_phase?.toLowerCase()?.includes("single")) &&
    Number(form.proposed_capacity_kw) > 5;

  useEffect(() => {
    if (!completeModalOpen || !form.consumer_number) {
      setConsumerWarning("");
      return;
    }
    const str = String(form.consumer_number).trim();
    if (str.length > 0 && (str.length < 8 || str.length > 16)) {
      setConsumerWarning("Consumer number must be between 8 and 16 characters for DISCOM feasibility.");
      return;
    }
    if (str.length >= 8) {
      const timer = setTimeout(async () => {
        try {
          const res = await api.get("/field-work/check-consumer-number", {
            params: { consumer_number: str, lead_id: selectedSurvey?.lead_id },
          });
          if (res.data?.exists) {
            setConsumerWarning(res.data.message || "Consumer number already registered.");
          } else {
            setConsumerWarning("");
          }
        } catch (_) {}
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [form.consumer_number, selectedSurvey, completeModalOpen]);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const res = await getSurveysList({
        engineer_id: user?.id,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      if (res?.success) {
        setSurveys(res.data || []);
      }
    } catch (err) {
      console.error("Error fetching surveys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchSurveys();
    }
  }, [user?.id, search, statusFilter]);

  const handleOpenCompleteModal = (survey) => {
    setSelectedSurvey(survey);
    setConsumerWarning("");
    setModalError("");
    setForm({
      roof_type: survey.roof_type || "RCC Flat Roof",
      roof_area_sqft: survey.roof_area_sqft || "",
      shadow_conditions: survey.shadow_conditions || "Shadow-Free",
      roof_orientation: survey.roof_orientation || "South",
      roof_tilt_angle: survey.roof_tilt_angle ?? "",
      roof_ownership: survey.roof_ownership || "Self-Owned Freehold",
      noc_status: survey.noc_status || "NOC Not Required",
      electrical_phase: survey.electrical_phase?.toLowerCase()?.includes("3") ? "Three Phase" : (survey.electrical_phase || "Single Phase"),
      sanctioned_load_kw: survey.sanctioned_load_kw || "",
      consumer_number: survey.consumer_number || survey.customer_consumer_number || "",
      proposed_capacity_kw: survey.proposed_capacity_kw || "",
      feasibility_verdict: survey.feasibility_verdict || "Feasible",
      not_feasible_reason: survey.not_feasible_reason || "",
      lead_action_on_not_feasible: survey.lead_action_on_not_feasible || "Switch Lead to On Hold",
      site_notes: survey.site_notes || "",
      photos: Array.isArray(survey.photos) ? survey.photos : [],
    });
    setCompleteModalOpen(true);
  };

  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("photos", files[i]);
    }

    try {
      setUploadingPhotos(true);
      const res = await uploadSurveyPhotos(formData);
      if (res?.success && res.data) {
        setForm((p) => ({
          ...p,
          photos: [...p.photos, ...res.data],
        }));
      }
    } catch (err) {
      console.error("Photo upload error:", err);
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleSubmitComplete = async () => {
    if (!selectedSurvey) return;
    if (!form.feasibility_verdict) { toast.error("Choose a feasibility verdict."); return; }
    setModalError("");

    if (!form.consumer_number || !String(form.consumer_number).trim()) {
      setModalError("Consumer number is required for DISCOM feasibility.");
      return;
    }
    const cStr = String(form.consumer_number).trim();
    if (cStr.length < 8 || cStr.length > 16) {
      setModalError("Consumer number must be between 8 and 16 characters for DISCOM feasibility.");
      return;
    }
    if (!form.roof_area_sqft || Number(form.roof_area_sqft) <= 0) {
      setModalError("Usable roof area must be a positive number.");
      return;
    }
    if (!form.proposed_capacity_kw || Number(form.proposed_capacity_kw) <= 0) {
      setModalError("Proposed capacity (kW) must be a positive number.");
      return;
    }
    if (form.feasibility_verdict === "Not feasible" && (!form.not_feasible_reason || !form.not_feasible_reason.trim())) {
      setModalError("Please select or enter the specific reason why this site is Not Feasible.");
      return;
    }

    try {
      setSaving(true);
      const res = await completeSurvey(selectedSurvey.id, form);
      if (res?.success) {
        toast.success(res.message || "Survey saved.");
        setCompleteModalOpen(false);
        fetchSurveys();
      } else {
        setModalError(res?.message || "Failed to submit survey.");
      }
    } catch (err) {
      console.error("Error completing survey:", err);
      toast.error(err.response?.data?.message || "Could not save the survey. Please retry.");
      setModalError(err.response?.data?.message || "Error completing survey. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
        <Box>
          <Typography sx={{ fontSize: "1.2rem", fontWeight: 800, color: "#0F172A" }}>
            Site Surveys & Technical Feasibility
          </Typography>
          <Typography sx={{ fontSize: "0.78rem", color: "#64748B" }}>
            Fill roof measurements, shadow conditions, electrical details & upload site inspection photos
          </Typography>
        </Box>
      </Box>

      {/* FILTERS */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: "10px", border: "1px solid #E2E8F0", mb: 2.5, backgroundColor: "#FFFFFF" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by customer name, lead code, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#94A3B8", fontSize: "1.1rem" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.8rem" } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                displayEmpty
                sx={{ borderRadius: "8px", fontSize: "0.8rem" }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="scheduled">Scheduled / Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* SURVEYS TABLE */}
      <Paper elevation={0} sx={{ borderRadius: "10px", border: "1px solid #E2E8F0", backgroundColor: "#FFFFFF", overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </Box>
        ) : surveys.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography sx={{ fontWeight: 700, color: "#0F172A" }}>No site surveys assigned yet</Typography>
            <Typography sx={{ fontSize: "0.78rem", color: "#64748B", mt: 0.5 }}>
              When a Manager or Admin schedules a site survey for you, it will appear here.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.72rem", color: "#64748B" }}>DATE & TIME</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.72rem", color: "#64748B" }}>CUSTOMER</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.72rem", color: "#64748B" }}>REQ. CAPACITY</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.72rem", color: "#64748B" }}>ADDRESS</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.72rem", color: "#64748B" }}>STATUS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.72rem", color: "#64748B" }}>ACTION</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {surveys.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: "#0F172A" }}>
                        {row.scheduled_date ? new Date(row.scheduled_date).toLocaleDateString() : "—"}
                      </Typography>
                      <Typography sx={{ fontSize: "0.72rem", color: "#0284C7", fontWeight: 600 }}>
                        {row.scheduled_time}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#0F172A" }}>
                        {row.customer_name || "Customer"}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.3 }}>
                        <PhoneIcon sx={{ fontSize: "0.75rem", color: "#94A3B8" }} />
                        <Typography sx={{ fontSize: "0.72rem", color: "#64748B" }}>
                          {row.mobile_number}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem" }}>
                      {row.required_kw ? `${row.required_kw} kW` : "—"}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, maxWidth: 280 }}>
                        <LocationOnIcon sx={{ fontSize: "0.85rem", color: "#94A3B8" }} />
                        <Typography sx={{ fontSize: "0.75rem", color: "#334155" }} noWrap>
                          {[row.address, row.city, row.state].filter(Boolean).join(", ") || "—"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Chip
                          size="small"
                          label={row.status === "completed" ? "Completed" : "Scheduled"}
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            backgroundColor: row.status === "completed" ? "#DCFCE7" : "#E0F2FE",
                            color: row.status === "completed" ? "#16A34A" : "#0284C7",
                          }}
                        />
                        {row.status === "completed" && (
                          row.project_id ? (
                            <Chip
                              size="small"
                              label={row.project_number || "Project Created"}
                              color="success"
                              variant="outlined"
                              sx={{ fontWeight: 800, fontSize: "0.68rem" }}
                            />
                          ) : (
                            <Chip
                              size="small"
                              label="Awaiting Approval"
                              sx={{ fontWeight: 700, fontSize: "0.68rem", bgcolor: "#FEF3C7", color: "#92400E" }}
                            />
                          )
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                        {row.project_id && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => navigate(`${projectBasePath}/${row.project_id}`)}
                            endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
                            sx={{
                              textTransform: "none",
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              py: 0.3,
                              px: 1,
                              borderRadius: "6px",
                              backgroundColor: "#16A34A",
                              "&:hover": { backgroundColor: "#15803D" },
                            }}
                          >
                            Open Project
                          </Button>
                        )}
                        {isCoordinator && row.status === "completed" && !row.project_id && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              setSurveyToApprove(row);
                              setApproveModalOpen(true);
                            }}
                            startIcon={<EngineeringIcon sx={{ fontSize: 14 }} />}
                            sx={{
                              textTransform: "none",
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              py: 0.3,
                              px: 1,
                              borderRadius: "6px",
                              backgroundColor: "#0284C7",
                              "&:hover": { backgroundColor: "#0369A1" },
                            }}
                          >
                            Approve &amp; Create Project
                          </Button>
                        )}
                        <Button
                          size="small"
                          variant={row.status === "completed" ? "outlined" : "contained"}
                          onClick={() => handleOpenCompleteModal(row)}
                          startIcon={row.status === "completed" ? <CheckCircleIcon /> : <AssignmentTurnedInIcon />}
                          sx={{
                            textTransform: "none",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            borderRadius: "6px",
                            backgroundColor: row.status === "completed" ? "transparent" : "#0284C7",
                            color: row.status === "completed" ? "#16A34A" : "#FFFFFF",
                            borderColor: row.status === "completed" ? "#86EFAC" : "transparent",
                            "&:hover": {
                              backgroundColor: row.status === "completed" ? "#F0FDF4" : "#0369A1",
                            },
                          }}
                        >
                          {row.status === "completed" ? "Edit Survey" : "Fill Report"}
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* COMPLETE / EDIT SURVEY MODAL */}
      <Dialog open={completeModalOpen} onClose={() => setCompleteModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.05rem", borderBottom: "1px solid #E2E8F0" }}>
          Technical Site Survey & Feasibility Report
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          {selectedSurvey && (
            <Box sx={{ mb: 2, p: 1.5, borderRadius: "8px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#0F172A" }}>
                Lead: {selectedSurvey.customer_name} ({selectedSurvey.lead_code})
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "#64748B", mt: 0.3 }}>
                Location: {[selectedSurvey.address, selectedSurvey.city].filter(Boolean).join(", ")} · Phone: {selectedSurvey.mobile_number}
              </Typography>
            </Box>
          )}

          {modalError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {modalError}
            </Alert>
          )}

          {singlePhaseAbove5Kw && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              ⚠️ <strong>Phase Capacity Notice:</strong> Single Phase connections typically support up to 5 kW only. Proposed capacity of {form.proposed_capacity_kw} kW requires a DISCOM phase upgrade to Three Phase.
            </Alert>
          )}

          {consumerWarning && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              ⚠️ {consumerWarning}
            </Alert>
          )}

          {form.feasibility_verdict === "Not feasible" && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              ⚠️ Site marked as <strong>Not Feasible</strong>. Please select the specific technical reason and choose the action for this lead.
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {/* ROOF & STRUCTURE SECTION */}
            <Grid item xs={12}>
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: "#0F172A", borderBottom: "1px solid #E2E8F0", pb: 0.5 }}>
                1. Roof & Structure Assessment
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", mb: 0.5 }}>
                Roof Type *
              </Typography>
              <Select
                fullWidth
                size="small"
                value={form.roof_type}
                onChange={(e) => setForm((p) => ({ ...p, roof_type: e.target.value }))}
                sx={{ borderRadius: "8px", fontSize: "0.82rem" }}
              >
                <MenuItem value="RCC Flat Roof">RCC Concrete Flat Roof</MenuItem>
                <MenuItem value="Industrial Tin / Metal Shade">Industrial Tin / Metal Shade</MenuItem>
                <MenuItem value="Tiled / Slanted Roof">Tiled / Slanted Roof</MenuItem>
                <MenuItem value="Asbestos Sheet Roof">Asbestos Sheet Roof</MenuItem>
                <MenuItem value="Ground Mount">Ground Mount</MenuItem>
                <MenuItem value="Elevated Super Structure">Elevated Super Structure</MenuItem>
              </Select>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", mb: 0.5 }}>
                Usable Roof Area (Sq.Ft) *
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                placeholder="e.g. 500"
                value={form.roof_area_sqft}
                onChange={(e) => setForm((p) => ({ ...p, roof_area_sqft: e.target.value }))}
                InputProps={{ sx: { borderRadius: "8px", fontSize: "0.82rem" } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", mb: 0.5 }}>
                Roof Orientation *
              </Typography>
              <Select
                fullWidth
                size="small"
                value={form.roof_orientation}
                onChange={(e) => setForm((p) => ({ ...p, roof_orientation: e.target.value }))}
                sx={{ borderRadius: "8px", fontSize: "0.82rem" }}
              >
                <MenuItem value="South">South (Optimal Solar Yield)</MenuItem>
                <MenuItem value="South-East">South-East</MenuItem>
                <MenuItem value="South-West">South-West</MenuItem>
                <MenuItem value="East">East</MenuItem>
                <MenuItem value="West">West</MenuItem>
                <MenuItem value="North">North (Sub-optimal)</MenuItem>
              </Select>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", mb: 0.5 }}>
                Roof Tilt / Slope Angle (Degrees)
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                placeholder="e.g. 20 (degrees)"
                value={form.roof_tilt_angle}
                onChange={(e) => setForm((p) => ({ ...p, roof_tilt_angle: e.target.value }))}
                InputProps={{ sx: { borderRadius: "8px", fontSize: "0.82rem" } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", mb: 0.5 }}>
                Roof Ownership & Permission *
              </Typography>
              <Select
                fullWidth
                size="small"
                value={form.roof_ownership}
                onChange={(e) => setForm((p) => ({ ...p, roof_ownership: e.target.value }))}
                sx={{ borderRadius: "8px", fontSize: "0.82rem" }}
              >
                <MenuItem value="Self-Owned Freehold">Self-Owned Freehold (No NOC required)</MenuItem>
                <MenuItem value="Rented / Tenant">Rented / Tenant (Landlord NOC Required)</MenuItem>
                <MenuItem value="Co-Owned / Joint Family">Co-Owned / Joint Family (Consent Required)</MenuItem>
                <MenuItem value="Society / Shared Apartment Roof">Society / Shared Apartment Roof (Society NOC Required)</MenuItem>
              </Select>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", mb: 0.5 }}>
                NOC Status
              </Typography>
              <Select
                fullWidth
                size="small"
                value={form.noc_status}
                onChange={(e) => setForm((p) => ({ ...p, noc_status: e.target.value }))}
                sx={{ borderRadius: "8px", fontSize: "0.82rem" }}
              >
                <MenuItem value="NOC Not Required">NOC Not Required</MenuItem>
                <MenuItem value="NOC Already Obtained">NOC Already Obtained</MenuItem>
                <MenuItem value="NOC Pending / In Process">NOC Pending / In Process</MenuItem>
                <MenuItem value="NOC Refused">NOC Refused</MenuItem>
              </Select>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", mb: 0.5 }}>
                Shadow Conditions *
              </Typography>
              <Select
                fullWidth
                size="small"
                value={form.shadow_conditions}
                onChange={(e) => setForm((p) => ({ ...p, shadow_conditions: e.target.value }))}
                sx={{ borderRadius: "8px", fontSize: "0.82rem" }}
              >
                <MenuItem value="Shadow-Free">100% Shadow-Free (Ideal)</MenuItem>
                <MenuItem value="Partial Morning Shadow">Partial Morning Shadow</MenuItem>
                <MenuItem value="Partial Evening Shadow">Partial Evening Shadow</MenuItem>
                <MenuItem value="Heavy Tree Obstruction">Heavy Tree Obstruction</MenuItem>
              </Select>
            </Grid>

            {/* ELECTRICAL & GRID SECTION */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: "#0F172A", borderBottom: "1px solid #E2E8F0", pb: 0.5 }}>
                2. Electrical Connection & DISCOM Details
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", mb: 0.5 }}>
                Supply Phase *
              </Typography>
              <Select
                fullWidth
                size="small"
                value={form.electrical_phase}
                onChange={(e) => setForm((p) => ({ ...p, electrical_phase: e.target.value }))}
                sx={{ borderRadius: "8px", fontSize: "0.82rem" }}
              >
                <MenuItem value="Single Phase">Single Phase</MenuItem>
                <MenuItem value="Three Phase">Three Phase</MenuItem>
              </Select>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", mb: 0.5 }}>
                Proposed Solar Capacity (kW) *
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                placeholder="e.g. 5.0"
                value={form.proposed_capacity_kw}
                onChange={(e) => setForm((p) => ({ ...p, proposed_capacity_kw: e.target.value }))}
                InputProps={{ sx: { borderRadius: "8px", fontSize: "0.82rem" } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", mb: 0.5 }}>
                Sanctioned Meter Load (kW) *
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                placeholder="e.g. 3.0"
                value={form.sanctioned_load_kw}
                onChange={(e) => setForm((p) => ({ ...p, sanctioned_load_kw: e.target.value }))}
                InputProps={{ sx: { borderRadius: "8px", fontSize: "0.82rem" } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", mb: 0.5 }}>
                Consumer Number (Required for DISCOM Feasibility) *
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. 100012345678"
                value={form.consumer_number}
                onChange={(e) => setForm((p) => ({ ...p, consumer_number: e.target.value }))}
                InputProps={{ sx: { borderRadius: "8px", fontSize: "0.82rem" } }}
                helperText="Must be 8 to 16 characters matching electricity bill"
              />
            </Grid>

            {/* FEASIBILITY VERDICT SECTION */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: "#0F172A", borderBottom: "1px solid #E2E8F0", pb: 0.5 }}>
                3. Technical Feasibility Verdict & Sales Recommendation
              </Typography>
            </Grid>

            <Grid item xs={12} sm={form.feasibility_verdict === "Not feasible" ? 4 : 12}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", mb: 0.5 }}>
                Feasibility Verdict *
              </Typography>
              <Select
                fullWidth
                size="small"
                value={form.feasibility_verdict}
                onChange={(e) => setForm((p) => ({ ...p, feasibility_verdict: e.target.value }))}
                sx={{
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: form.feasibility_verdict === "Feasible" ? "#16A34A" : form.feasibility_verdict === "Not feasible" ? "#DC2626" : "#D97706",
                }}
              >
                <MenuItem value="Feasible" sx={{ color: "#16A34A", fontWeight: 600 }}>Feasible (Recommended for Installation)</MenuItem>
                <MenuItem value="Feasible with conditions" sx={{ color: "#D97706", fontWeight: 600 }}>Feasible with conditions (Special Structure / Upgrades)</MenuItem>
                <MenuItem value="Not feasible" sx={{ color: "#DC2626", fontWeight: 600 }}>Not feasible (Cannot Proceed with Solar)</MenuItem>
              </Select>
            </Grid>

            {form.feasibility_verdict === "Not feasible" && (
              <>
                <Grid item xs={12} sm={4}>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#DC2626", mb: 0.5 }}>
                    Reason for Not Feasible *
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={form.not_feasible_reason}
                    onChange={(e) => setForm((p) => ({ ...p, not_feasible_reason: e.target.value }))}
                    sx={{ borderRadius: "8px", fontSize: "0.82rem" }}
                  >
                    <MenuItem value="Weak roof structure / Unsafe for solar installation">Weak roof structure / Unsafe for solar installation</MenuItem>
                    <MenuItem value="Severe shading from adjacent buildings / trees">Severe shading from adjacent buildings / trees</MenuItem>
                    <MenuItem value="Tenant / Society refused NOC permission">Tenant / Society refused NOC permission</MenuItem>
                    <MenuItem value="Overhead HT line / clearance hazard">Overhead HT line / clearance hazard</MenuItem>
                    <MenuItem value="DISCOM transformer overloaded / grid constraints">DISCOM transformer overloaded / grid constraints</MenuItem>
                    <MenuItem value="Inadequate roof area (< 100 sq ft)">Inadequate roof area (&lt; 100 sq ft)</MenuItem>
                    <MenuItem value="Other technical / electrical constraints">Other technical / electrical constraints</MenuItem>
                  </Select>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", mb: 0.5 }}>
                    Action for Lead *
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={form.lead_action_on_not_feasible}
                    onChange={(e) => setForm((p) => ({ ...p, lead_action_on_not_feasible: e.target.value }))}
                    sx={{ borderRadius: "8px", fontSize: "0.82rem" }}
                  >
                    <MenuItem value="Switch Lead to On Hold">Switch Lead to On Hold</MenuItem>
                    <MenuItem value="Close Lead as Lost / Not Feasible">Close Lead as Lost / Not Feasible</MenuItem>
                    <MenuItem value="Keep Current Lead Status">Keep Current Lead Status</MenuItem>
                  </Select>
                </Grid>
              </>
            )}

            {/* REMARKS & ACCESS SECTION */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", mb: 0.5 }}>
                Field Engineer Notes & Feasibility Remarks
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2.5}
                size="small"
                placeholder="Mention cable distance, meter location, structure recommendation, earthing spot..."
                value={form.site_notes}
                onChange={(e) => setForm((p) => ({ ...p, site_notes: e.target.value }))}
                InputProps={{ sx: { borderRadius: "8px", fontSize: "0.82rem" } }}
              />
            </Grid>

            {/* PHOTOS SECTION */}
            <Grid item xs={12}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", mb: 0.8 }}>
                Site & Roof Inspection Photos ({form.photos.length} uploaded)
              </Typography>
              <Button
                component="label"
                variant="outlined"
                startIcon={<AddAPhotoIcon />}
                disabled={uploadingPhotos}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  borderRadius: "8px",
                  borderColor: "#CBD5E1",
                  color: "#0F172A",
                }}
              >
                {uploadingPhotos ? "Uploading Photos..." : "Upload Site Photos"}
                <input type="file" hidden multiple accept="image/*" onChange={handlePhotoUpload} />
              </Button>

              {form.photos.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ mt: 1.5, overflowX: "auto", py: 0.5 }}>
                  {form.photos.map((src, i) => (
                    <Box
                      key={i}
                      component="img"
                      src={src.startsWith("http") ? src : `http://localhost:5000${src}`}
                      alt={`Site Photo ${i + 1}`}
                      sx={{
                        width: 70,
                        height: 70,
                        borderRadius: "8px",
                        objectFit: "cover",
                        border: "1px solid #CBD5E1",
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Grid>
          </Grid>
        <Box sx={{ mt: 3 }}><SurveyDocuments surveyId={selectedSurvey?.id} /></Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #E2E8F0" }}>
          <Button onClick={() => setCompleteModalOpen(false)} sx={{ textTransform: "none", color: "#64748B" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitComplete}
            disabled={saving || uploadingPhotos}
            sx={{
              backgroundColor: "#0284C7",
              color: "#FFFFFF",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.82rem",
              borderRadius: "8px",
              px: 2.5,
              "&:hover": { backgroundColor: "#0369A1" },
            }}
          >
            {saving ? "Saving Report..." : "Submit Feasibility Report"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* APPROVE SURVEY TO PROJECT MODAL */}
      {surveyToApprove && (
        <ApproveSurveyModal
          open={approveModalOpen}
          onClose={() => {
            setApproveModalOpen(false);
            setSurveyToApprove(null);
          }}
          lead={{
            id: surveyToApprove.lead_id,
            customer_name: surveyToApprove.customer_name,
            lead_code: surveyToApprove.lead_code,
            mobile_number: surveyToApprove.mobile_number,
            address: surveyToApprove.address,
            city: surveyToApprove.city,
            state: surveyToApprove.state,
            required_kw: surveyToApprove.required_kw,
          }}
          survey={surveyToApprove}
          onApproved={() => {
            fetchSurveys();
          }}
        />
      )}
    </Box>
  );
}
