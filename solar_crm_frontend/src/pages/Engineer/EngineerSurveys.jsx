import React, { useState, useEffect } from "react";
import {
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
} from "@mui/icons-material";

import { getSurveysList, completeSurvey, uploadSurveyPhotos } from "../../services/surveyService";
import { useAuth } from "../../context/AuthContext";

export default function EngineerSurveys() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Complete Survey Modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const [form, setForm] = useState({
    roof_type: "RCC",
    roof_area_sqft: "",
    shadow_conditions: "Shadow-Free",
    electrical_phase: "1-Phase",
    sanctioned_load_kw: "",
    site_notes: "",
    photos: [],
  });

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
    setForm({
      roof_type: survey.roof_type || "RCC",
      roof_area_sqft: survey.roof_area_sqft || "",
      shadow_conditions: survey.shadow_conditions || "Shadow-Free",
      electrical_phase: survey.electrical_phase || "1-Phase",
      sanctioned_load_kw: survey.sanctioned_load_kw || "",
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
    try {
      setSaving(true);
      const res = await completeSurvey(selectedSurvey.id, form);
      if (res?.success) {
        setCompleteModalOpen(false);
        fetchSurveys();
      }
    } catch (err) {
      console.error("Error completing survey:", err);
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
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant={row.status === "completed" ? "outlined" : "contained"}
                        onClick={() => handleOpenCompleteModal(row)}
                        startIcon={row.status === "completed" ? <CheckCircleIcon /> : <AssignmentTurnedInIcon />}
                        sx={{
                          textTransform: "none",
                          fontSize: "0.74rem",
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

          <Grid container spacing={2} sx={{ mt: 0.5 }}>
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
                <MenuItem value="RCC">RCC Concrete Flat Roof</MenuItem>
                <MenuItem value="Tin Shade">Industrial Tin / Metal Shade</MenuItem>
                <MenuItem value="Tiled">Tiled / Slanted Roof</MenuItem>
                <MenuItem value="Asbestos">Asbestos Sheet Roof</MenuItem>
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
                Shadow Conditions
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

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", mb: 0.5 }}>
                Electrical Connection Phase
              </Typography>
              <Select
                fullWidth
                size="small"
                value={form.electrical_phase}
                onChange={(e) => setForm((p) => ({ ...p, electrical_phase: e.target.value }))}
                sx={{ borderRadius: "8px", fontSize: "0.82rem" }}
              >
                <MenuItem value="1-Phase">1-Phase Connection</MenuItem>
                <MenuItem value="3-Phase">3-Phase Connection</MenuItem>
              </Select>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", mb: 0.5 }}>
                Sanctioned Meter Load (kW)
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

            <Grid item xs={12}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", mb: 0.5 }}>
                Field Engineer Notes & Feasibility Remarks
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2.5}
                size="small"
                placeholder="Mention cable distance, meter location, structure recommendation..."
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
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #E2E8F0" }}>
          <Button onClick={() => setCompleteModalOpen(false)} sx={{ textTransform: "none", color: "#64748B" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitComplete}
            disabled={saving}
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
    </Box>
  );
}
