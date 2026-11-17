import api from "../api/axios";
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
  Avatar,
  Divider,
  Alert,
} from "@mui/material";

import {
  Close as CloseIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AssignmentInd as AssignIcon,
  SolarPower as SolarIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";

import { scheduleSurvey } from "../services/surveyService";

const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  primarySoft: "#F1F5F9",
  accent: "#F59E0B",
  border: "#CBD5E1",
  borderLight: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
};

const TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:30 PM",
  "05:00 PM",
];

export default function ScheduleSurveyModal({ open, onClose, lead, onScheduled, onSurveyScheduled, showSnackbar }) {
  const [engineers, setEngineers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [booked, setBooked] = useState([]), [checking, setChecking] = useState(false), [slotError, setSlotError] = useState(''), [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    assigned_engineer_id: "",
    scheduled_date: new Date().toLocaleDateString('en-CA'),
    scheduled_time: "10:00 AM",
    site_notes: "",
    site_address: "", landmark: "", site_latitude: "", site_longitude: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      fetchEngineers();
      const addr = [lead?.address, lead?.city, lead?.state, lead?.pincode].filter(Boolean).join(", ");
      setFormData({
        assigned_engineer_id: "",
        scheduled_date: new Date().toLocaleDateString('en-CA'),
        scheduled_time: "10:00 AM",
        site_notes: "",
        site_address: addr || lead?.address || "",
        landmark: lead?.landmark || "",
        site_latitude: lead?.latitude || "",
        site_longitude: lead?.longitude || "",
      });
      setErrors({});
      setSaveError('');
    }
  }, [open, lead]);

  const slotTime = slot => { const m=slot.match(/(\d+):(\d+) (AM|PM)/); return m ? String(Number(m[1])%12+(m[3]==='PM'?12:0)).padStart(2,'0')+':'+m[2] : slot; };
  useEffect(() => {
    if (!open || !formData.assigned_engineer_id || !formData.scheduled_date) { setBooked([]); return; }
    let active=true; setChecking(true); setSlotError('');
    api.get('/surveys/availability',{params:{engineer_id:formData.assigned_engineer_id,date:formData.scheduled_date,lead_id:lead?.id}}).then(r=>{if(active)setBooked(r.data.data.booked_times);}).catch(()=>{if(active)setSlotError('Could not check availability. Change the date or engineer to retry.');}).finally(()=>{if(active)setChecking(false);});
    return ()=>{active=false;};
  },[open,formData.assigned_engineer_id,formData.scheduled_date,lead?.id]);
  const useLocation = () => {
    if(!navigator.geolocation){setSaveError('GPS is not supported. Enter coordinates manually.');return;}
    navigator.geolocation.getCurrentPosition(p=>{setFormData(f=>({...f,site_latitude:p.coords.latitude,site_longitude:p.coords.longitude}));},()=>setSaveError('Location permission unavailable. Enter the actual site coordinates manually.'),{enableHighAccuracy:true,timeout:15000});
  };
  const fetchEngineers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get("/surveys/engineers");
      if (res?.data?.success) {
        setEngineers(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching team users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const change = (key, value) => {
    setFormData(p=>({...p,[key]:value}));
    setErrors(p=>({...p,[key]:undefined}));
    setSaveError('');
  };
  const handleSubmit = async () => {
    const errs = {};
    if (!formData.assigned_engineer_id) errs.assigned_engineer_id = "Please select a Site Engineer";
    if (!formData.scheduled_date) errs.scheduled_date = "Date is required";
    if (!formData.scheduled_time) errs.scheduled_time = "Time slot is required";
    if (!formData.site_address.trim()) errs.site_address = 'Enter complete site address';
    if (!formData.landmark.trim()) errs.landmark = 'Enter nearby landmark';

    let lat = formData.site_latitude !== "" && formData.site_latitude !== null && formData.site_latitude !== undefined ? Number(formData.site_latitude) : 0;
    let lng = formData.site_longitude !== "" && formData.site_longitude !== null && formData.site_longitude !== undefined ? Number(formData.site_longitude) : 0;
    if (formData.site_latitude !== "" && (!Number.isFinite(lat) || Math.abs(lat) > 90)) errs.site_latitude = 'Enter valid GPS latitude (-90 to 90)';
    if (formData.site_longitude !== "" && (!Number.isFinite(lng) || Math.abs(lng) > 180)) errs.site_longitude = 'Enter valid GPS longitude (-180 to 180)';

    if (booked.includes(slotTime(formData.scheduled_time))) errs.scheduled_time = 'Surveyor is already booked. Choose another slot.';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        site_address: formData.site_address.trim(),
        landmark: formData.landmark.trim() || "Nearby",
        site_latitude: lat,
        site_longitude: lng,
        lead_id: lead.id,
        assigned_engineer_id: formData.assigned_engineer_id || null,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        site_notes: formData.site_notes,
      };

      const res = await scheduleSurvey(payload);
      if (res.success) {
        showSnackbar && showSnackbar("Site survey scheduled successfully!", "success");
        onScheduled && onScheduled(res.data);
        onSurveyScheduled && onSurveyScheduled(res.data);
        onClose();
      } else {
        showSnackbar && showSnackbar(res.message || "Failed to schedule survey", "error");
      }
    } catch (err) {
      console.error("Schedule survey error:", err);
      if(err.response?.status===409)setBooked(p=>[...new Set([...p,slotTime(formData.scheduled_time)])]);
      setSaveError(err.response?.data?.message || "Could not schedule survey. Try again.");
      showSnackbar && showSnackbar(err.response?.data?.message || "Could not schedule survey.", "error");
    } finally {
      setSaving(false);
    }
  };

  const fullLocation = [lead?.address, lead?.city, lead?.state, lead?.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          border: `1px solid ${COLORS.borderLight}`,
          overflow: "hidden",
          boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.15)",
        },
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          p: 2.5,
          backgroundColor: COLORS.primary,
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "10px",
              backgroundColor: "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <EventIcon sx={{ color: COLORS.accent, fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", fontFamily: "'Inter', sans-serif" }}>
              Schedule Site Survey
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)", fontFamily: "'Inter', sans-serif" }}>
              Assign field engineer & set survey appointment
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: "#FFFFFF" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* BODY */}
      <DialogContent sx={{ p: 2.5 }}>
        {/* LEAD BRIEF CARD */}
        <Paper
          elevation={0}
          sx={{
            p: 1.8,
            mb: 2.5,
            borderRadius: "12px",
            border: `1px solid ${COLORS.borderLight}`,
            backgroundColor: "#F8FAFC",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: COLORS.primary, width: 40, height: 40, fontWeight: 700 }}>
              {lead?.customer_name ? lead.customer_name.charAt(0).toUpperCase() : "C"}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: COLORS.textPrimary }}>
                {lead?.customer_name} {lead?.lead_code ? `(${lead.lead_code})` : ""}
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.3 }} flexWrap="wrap">
                {lead?.mobile_number && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <PhoneIcon sx={{ fontSize: 14, color: COLORS.textSecondary }} />
                    <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}>
                      {lead.mobile_number}
                    </Typography>
                  </Stack>
                )}
                {fullLocation && (
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{minWidth:0,maxWidth:"100%"}}>
                    <LocationIcon sx={{ fontSize: 14, color: COLORS.textSecondary }} />
                    <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary, overflowWrap:"anywhere" }}>
                      {fullLocation}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Box>
          </Stack>
        </Paper>

        <Grid container spacing={2}>
          {/* ASSIGN ENGINEER / SURVEYOR */}
          <Grid size={{xs:12}}>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
              Assign Field Engineer / Surveyor *
            </Typography>
            <Select
              fullWidth
              size="small"
              displayEmpty
              value={formData.assigned_engineer_id}
              onChange={(e) => {
                setFormData((p) => ({ ...p, assigned_engineer_id: e.target.value }));
                setErrors((p) => ({ ...p, assigned_engineer_id: undefined }));
              }}
              sx={{ borderRadius: "8px", fontSize: "0.82rem", backgroundColor: "#FFFFFF" }}
            >
              <MenuItem disabled value="">
                {loadingUsers ? "Loading Site Engineers..." : engineers.length === 0 ? "No active Site Engineers found" : "Select an active Site Engineer"}
              </MenuItem>
              {engineers.map((u) => (
                <MenuItem key={u.id} value={u.id} sx={{ fontSize: "0.82rem" }}>
                  {u.full_name || u.name} (Site Engineer)
                </MenuItem>
              ))}
            </Select>
            {errors.assigned_engineer_id && <Typography variant="caption" color="error">{errors.assigned_engineer_id}</Typography>}
          </Grid>

          {/* DATE PICKER */}
          <Grid size={{xs:12,sm:6}}>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
              Survey Date *
            </Typography>
            <TextField
              type="date"
                    slotProps={{ inputLabel: { shrink: true } }}
                    InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
              value={formData.scheduled_date}
              onChange={(e) => setFormData((p) => ({ ...p, scheduled_date: e.target.value }))}
              error={Boolean(errors.scheduled_date)}
              helperText={errors.scheduled_date}
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: "8px", backgroundColor: "#FFFFFF" },
                "& input": { fontSize: "0.82rem" },
              }}
            />
          </Grid>

          {/* TIME SLOT */}
          <Grid size={{xs:12,sm:6}}>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
              Time Slot *
            </Typography>
            <Select
              fullWidth
              size="small"
              value={formData.scheduled_time}
              onChange={(e) => change('scheduled_time', e.target.value)}
              sx={{ borderRadius: "8px", fontSize: "0.82rem", backgroundColor: "#FFFFFF" }}
            >
              {TIME_SLOTS.map((slot) => (
                <MenuItem disabled={checking || Boolean(slotError) || booked.includes(slotTime(slot))} key={slot} value={slot} sx={{ fontSize: "0.82rem" }}>
                  {slot}{booked.includes(slotTime(slot)) ? " - Booked" : ""}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid size={{xs:12}}>
            {checking && <Typography variant="caption">Checking engineer availability...</Typography>}
            {(slotError || errors.scheduled_time) && <Alert severity="warning">{slotError || errors.scheduled_time}</Alert>}
            {saveError && <Alert severity="error" sx={{mb:2}}>{saveError}</Alert>}
            <Stack spacing={2} sx={{mt:2}}>
              <TextField label="Complete site address" placeholder="e.g. 124, Sunrise Enclave, Sector 5" required multiline minRows={2} value={formData.site_address} onChange={e=>change('site_address',e.target.value)} error={Boolean(errors.site_address)} helperText={errors.site_address} inputProps={{maxLength:2000}} />
              <TextField label="Nearby landmark" placeholder="e.g. Near City Hospital / Landmark" required value={formData.landmark} onChange={e=>change('landmark',e.target.value)} error={Boolean(errors.landmark)} helperText={errors.landmark} inputProps={{maxLength:255}} />
              <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',sm:'1fr 1fr'},gap:2}}>
                <TextField label="Site GPS latitude (Optional)" placeholder="e.g. 26.9124" type="number" value={formData.site_latitude} onChange={e=>change('site_latitude',e.target.value)} error={Boolean(errors.site_latitude)} helperText={errors.site_latitude} inputProps={{min:-90,max:90,step:'any'}} />
                <TextField label="Site GPS longitude (Optional)" placeholder="e.g. 75.7873" type="number" value={formData.site_longitude} onChange={e=>change('site_longitude',e.target.value)} error={Boolean(errors.site_longitude)} helperText={errors.site_longitude} inputProps={{min:-180,max:180,step:'any'}} />
              </Box>
              <Button variant="outlined" onClick={useLocation}>Use current location (only when at site)</Button>
              <Typography variant="caption" color="text.secondary">Enter the customer's actual site coordinates. Your office location should not be used as the site GPS.</Typography>
            </Stack>
          </Grid>
          {/* NOTES */}
          <Grid size={{xs:12}}>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
              Instructions / Site Access Notes
            </Typography>
            <TextField
              variant="outlined"
              multiline
              rows={3}
              fullWidth
              placeholder="e.g. Roof key with security guard, check 3-phase meter availability..."
              value={formData.site_notes}
              onChange={(e) => setFormData((p) => ({ ...p, site_notes: e.target.value }))}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  backgroundColor: "#FFFFFF",
                  fontFamily: "'Inter', sans-serif",
                },
                "& .MuiOutlinedInput-input": {
                  p: 0,
                },
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      {/* FOOTER */}
      <DialogActions sx={{ p: 2, px: 2.5, borderTop: `1px solid ${COLORS.borderLight}`, backgroundColor: "#F8FAFC" }}>
        <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 600, color: COLORS.textSecondary }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving || checking || Boolean(slotError) || booked.includes(slotTime(formData.scheduled_time))}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <EventIcon />}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: "8px",
            px: 2.5,
            backgroundColor: COLORS.primary,
            "&:hover": { backgroundColor: COLORS.primaryDark },
          }}
        >
          {saving ? "Scheduling..." : "Schedule Survey"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
