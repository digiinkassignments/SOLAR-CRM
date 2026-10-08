import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Select,
  Grid,
  Stack,
  CircularProgress,
  Paper,
  Chip,
  Divider,
  Card,
  CardMedia,
} from "@mui/material";

import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationIcon,
  CloudUpload as UploadIcon,
  SolarPower as SolarIcon,
  ElectricMeter as MeterIcon,
  AddAPhoto as AddPhotoIcon,
  MyLocation as GpsIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

import { completeSurvey, uploadSurveyPhotos } from "../services/surveyService";

const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  primarySoft: "#FEF3C7",
  accent: "#F59E0B",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  success: "#16A34A",
};

const ROOF_TYPES = ["RCC", "Tin shade", "Sloped", "Elevated Structure", "Open Ground"];
const SHADOW_CONDITIONS = ["No Obstruction (100% Solar)", "Partial Shadow", "Morning Shadow", "Afternoon Shadow", "Heavy Obstructions"];
const ELECTRICAL_PHASES = ["1-Phase", "3-Phase"];

const getImageUrl = (url) => {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  const apiBase = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "";
  if (apiBase.startsWith("http")) {
    try {
      const parsed = new URL(apiBase);
      return `${parsed.origin}${cleanPath}`;
    } catch (e) {}
  }
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return `http://localhost:5000${cleanPath}`;
  }
  return `${window.location.origin}${cleanPath}`;
};

export default function SurveyExecutionModal({ open, onClose, survey, lead, onCompleted, showSnackbar }) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [formData, setFormData] = useState({
    roof_type: "RCC",
    roof_area_sqft: "",
    shadow_conditions: "No Obstruction (100% Solar)",
    electrical_phase: "1-Phase",
    sanctioned_load_kw: "",
    photos: [],
    site_notes: "",
    gps_latitude: "",
    gps_longitude: "",
  });

  useEffect(() => {
    if (survey) {
      setFormData({
        roof_type: survey.roof_type || "RCC",
        roof_area_sqft: survey.roof_area_sqft || (lead?.required_kw ? Number(lead.required_kw) * 100 : ""),
        shadow_conditions: survey.shadow_conditions || "No Obstruction (100% Solar)",
        electrical_phase: survey.electrical_phase || "1-Phase",
        sanctioned_load_kw: survey.sanctioned_load_kw || lead?.required_kw || "",
        photos: Array.isArray(survey.photos) ? survey.photos : [],
        site_notes: survey.site_notes || "",
        gps_latitude: survey.gps_latitude || "",
        gps_longitude: survey.gps_longitude || "",
      });
    }
  }, [survey, lead, open]);

  // Handle GPS location detection
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      showSnackbar && showSnackbar("Geolocation is not supported by your browser.", "warning");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((p) => ({
          ...p,
          gps_latitude: position.coords.latitude.toFixed(6),
          gps_longitude: position.coords.longitude.toFixed(6),
        }));
        setGpsLoading(false);
        showSnackbar && showSnackbar("GPS coordinates captured successfully!", "success");
      },
      (error) => {
        console.error("GPS Error:", error);
        setGpsLoading(false);
        showSnackbar && showSnackbar("Unable to fetch GPS position. Please enter manually.", "error");
      }
    );
  };

  // Handle File Uploads
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const data = new FormData();
      files.forEach((file) => data.append("photos", file));

      const res = await uploadSurveyPhotos(data);
      if (res.success && res.data) {
        setFormData((p) => ({
          ...p,
          photos: [...p.photos, ...res.data],
        }));
        showSnackbar && showSnackbar(`${files.length} photo(s) uploaded successfully!`, "success");
      }
    } catch (err) {
      console.error("Photo upload error:", err);
      showSnackbar && showSnackbar("Failed to upload photos.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = (index) => {
    setFormData((p) => ({
      ...p,
      photos: p.photos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!survey?.id) return;

    setSaving(true);
    try {
      const res = await completeSurvey(survey.id, formData);
      if (res.success) {
        showSnackbar && showSnackbar("Site Survey measurements & photos saved! Lead marked as 'Survey Completed'.", "success");
        onCompleted && onCompleted(res.data);
        onClose();
      } else {
        showSnackbar && showSnackbar(res.message || "Failed to save survey.", "error");
      }
    } catch (err) {
      console.error("Complete survey error:", err);
      showSnackbar && showSnackbar("Server error completing site survey.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          border: `1px solid ${COLORS.border}`,
          maxHeight: "90vh",
        },
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          p: 2.5,
          background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, #3D2B9A 50%, ${COLORS.primary} 100%)`,
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              backgroundColor: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SolarIcon sx={{ color: "#25D366", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", fontFamily: "'Inter', sans-serif" }}>
              Execute Site Survey & Measurement
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)", fontFamily: "'Inter', sans-serif" }}>
              Record roof dimensions, electrical capacity, photos, & GPS location
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: "#FFFFFF" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* BODY */}
      <DialogContent sx={{ p: 2.5, overflowY: "auto" }}>
        {/* LEAD INFO SUMMARY */}
        <Paper elevation={0} sx={{ p: 1.8, mb: 2.5, borderRadius: "12px", border: `1px solid ${COLORS.border}`, bgcolor: "#F8FAFC" }}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: COLORS.textPrimary }}>
                👤 {lead?.customer_name} ({lead?.lead_code})
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}>
                📞 {lead?.mobile_number} | 📍 {lead?.city || lead?.address || "Site Location"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ textAlign: { xs: "left", sm: "right" } }}>
              <Chip
                label={`Status: ${survey?.status === "completed" ? "Completed" : "Scheduled"}`}
                color={survey?.status === "completed" ? "success" : "primary"}
                size="small"
                sx={{ fontWeight: 700, fontSize: "0.75rem" }}
              />
              <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, mt: 0.5 }}>
                📅 Scheduled: {survey?.scheduled_date ? String(survey.scheduled_date).slice(0, 10) : "N/A"} at {survey?.scheduled_time || "N/A"}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={2.5}>
          {/* SECTION 1: ROOF & STRUCTURAL DATA */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, bgcolor: "#FFFFFF" }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <SolarIcon sx={{ color: COLORS.primary, fontSize: 20 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: COLORS.primaryDark, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  1. Roof & Structural Specifications
                </Typography>
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
                    Roof Type *
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={formData.roof_type}
                    onChange={(e) => setFormData((p) => ({ ...p, roof_type: e.target.value }))}
                    sx={{ borderRadius: "8px", fontSize: "0.82rem" }}
                  >
                    {ROOF_TYPES.map((t) => (
                      <MenuItem key={t} value={t} sx={{ fontSize: "0.82rem" }}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
                    Usable Roof Area (sq. ft.) *
                  </Typography>
                  <TextField
                    type="number"
                    fullWidth
                    size="small"
                    placeholder="e.g. 600"
                    value={formData.roof_area_sqft}
                    onChange={(e) => setFormData((p) => ({ ...p, roof_area_sqft: e.target.value }))}
                    sx={{ "& input": { fontSize: "0.82rem" } }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
                    Shadow Analysis *
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={formData.shadow_conditions}
                    onChange={(e) => setFormData((p) => ({ ...p, shadow_conditions: e.target.value }))}
                    sx={{ borderRadius: "8px", fontSize: "0.82rem" }}
                  >
                    {SHADOW_CONDITIONS.map((c) => (
                      <MenuItem key={c} value={c} sx={{ fontSize: "0.82rem" }}>
                        {c}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* SECTION 2: ELECTRICAL SPECS & GPS */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, bgcolor: "#FFFFFF" }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <MeterIcon sx={{ color: COLORS.primary, fontSize: 20 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: COLORS.primaryDark, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  2. Electrical Connection & GPS Coordinates
                </Typography>
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
                    Electrical Phase *
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={formData.electrical_phase}
                    onChange={(e) => setFormData((p) => ({ ...p, electrical_phase: e.target.value }))}
                    sx={{ borderRadius: "8px", fontSize: "0.82rem" }}
                  >
                    {ELECTRICAL_PHASES.map((ph) => (
                      <MenuItem key={ph} value={ph} sx={{ fontSize: "0.82rem" }}>
                        ⚡ {ph}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
                    Sanctioned Load (kW)
                  </Typography>
                  <TextField
                    type="number"
                    fullWidth
                    size="small"
                    placeholder="e.g. 5"
                    value={formData.sanctioned_load_kw}
                    onChange={(e) => setFormData((p) => ({ ...p, sanctioned_load_kw: e.target.value }))}
                    sx={{ "& input": { fontSize: "0.82rem" } }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
                    GPS Tagging (Latitude & Longitude)
                  </Typography>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={handleDetectGps}
                    disabled={gpsLoading}
                    startIcon={gpsLoading ? <CircularProgress size={14} /> : <GpsIcon />}
                    sx={{
                      height: 38,
                      borderRadius: "8px",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.78rem",
                      borderColor: COLORS.primary,
                      color: COLORS.primary,
                    }}
                  >
                    {formData.gps_latitude ? `${formData.gps_latitude}, ${formData.gps_longitude}` : "Auto-Detect GPS"}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* SECTION 3: PHOTO LOG UPLOAD */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, bgcolor: "#FFFFFF" }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AddPhotoIcon sx={{ color: COLORS.primary, fontSize: 20 }} />
                  <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: COLORS.primaryDark, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    3. Site Inspection Photos (Roof, Meter Box, Obstructions)
                  </Typography>
                </Stack>
                <Button
                  component="label"
                  variant="contained"
                  size="small"
                  startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <UploadIcon />}
                  disabled={uploading}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: "8px",
                    fontSize: "0.78rem",
                    backgroundColor: COLORS.primary,
                  }}
                >
                  Upload Photos
                  <input type="file" multiple accept="image/*" hidden onChange={handleFileChange} />
                </Button>
              </Stack>

              {formData.photos.length === 0 ? (
                <Box
                  sx={{
                    p: 3,
                    borderRadius: "10px",
                    border: `2px dashed ${COLORS.border}`,
                    textAlign: "center",
                    bgcolor: "#FAF8FC",
                  }}
                >
                  <Typography sx={{ fontSize: "0.8rem", color: COLORS.textSecondary }}>
                    📷 No site photos attached yet. Click "Upload Photos" to add roof layout, meter, & obstruction views.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={1.5}>
                  {formData.photos.map((url, idx) => (
                    <Grid item xs={6} sm={3} key={idx}>
                      <Card elevation={0} sx={{ position: "relative", borderRadius: "8px", border: `1px solid ${COLORS.border}` }}>
                        <CardMedia
                          component="img"
                          height="100"
                          image={getImageUrl(url)}
                          alt={`Site Photo ${idx + 1}`}
                          sx={{ objectFit: "cover" }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemovePhoto(idx)}
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            bgcolor: "rgba(0,0,0,0.6)",
                            color: "#FFFFFF",
                            "&:hover": { bgcolor: "rgba(220,38,38,0.9)" },
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>

          {/* SECTION 4: SITE NOTES */}
          <Grid item xs={12}>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
              Surveyor Notes & Technical Constraints
            </Typography>
            <TextField
              multiline
              rows={3}
              fullWidth
              size="small"
              placeholder="e.g. Parapet wall height 3ft, cable distance from roof to meter box is 25 meters, requires walkway structure..."
              value={formData.site_notes}
              onChange={(e) => setFormData((p) => ({ ...p, site_notes: e.target.value }))}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "0.82rem" } }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      {/* FOOTER */}
      <DialogActions sx={{ p: 2, px: 2.5, borderTop: `1px solid ${COLORS.border}` }}>
        <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 600, color: COLORS.textSecondary }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: "8px",
            px: 3,
            backgroundColor: COLORS.success,
            "&:hover": { backgroundColor: "#15803D" },
          }}
        >
          {saving ? "Completing..." : "Complete & Save Survey"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
