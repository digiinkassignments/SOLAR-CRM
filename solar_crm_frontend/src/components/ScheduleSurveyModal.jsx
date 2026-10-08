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
import { getUsers } from "../services/userServices";

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

export default function ScheduleSurveyModal({ open, onClose, lead, onScheduled, showSnackbar }) {
  const [engineers, setEngineers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    assigned_engineer_id: "",
    scheduled_date: new Date().toISOString().slice(0, 10),
    scheduled_time: "10:00 AM",
    site_notes: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      fetchEngineers();
      setFormData({
        assigned_engineer_id: lead?.assigned_to || "",
        scheduled_date: new Date().toISOString().slice(0, 10),
        scheduled_time: "10:00 AM",
        site_notes: "",
      });
      setErrors({});
    }
  }, [open, lead]);

  const fetchEngineers = async () => {
    setLoadingUsers(true);
    try {
      const res = await getUsers({ limit: 100 });
      if (res?.data?.success) {
        setEngineers(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching team users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async () => {
    const errs = {};
    if (!formData.scheduled_date) errs.scheduled_date = "Date is required";
    if (!formData.scheduled_time) errs.scheduled_time = "Time slot is required";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
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
        onClose();
      } else {
        showSnackbar && showSnackbar(res.message || "Failed to schedule survey", "error");
      }
    } catch (err) {
      console.error("Schedule survey error:", err);
      showSnackbar && showSnackbar("Server error scheduling site survey.", "error");
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
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <LocationIcon sx={{ fontSize: 14, color: COLORS.textSecondary }} />
                    <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }} noWrap>
                      {fullLocation}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Box>
          </Stack>
        </Paper>

        <Grid container spacing={2}>
          {/* ASSIGN ENGINEER */}
          <Grid item xs={12}>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
              Assign Field Engineer / Surveyor
            </Typography>
            <Select
              fullWidth
              size="small"
              displayEmpty
              value={formData.assigned_engineer_id}
              onChange={(e) => setFormData((p) => ({ ...p, assigned_engineer_id: e.target.value }))}
              sx={{ borderRadius: "8px", fontSize: "0.82rem", backgroundColor: "#FFFFFF" }}
            >
              <MenuItem value="">Unassigned (Open Survey Task)</MenuItem>
              {engineers.map((u) => (
                <MenuItem key={u.id} value={u.id} sx={{ fontSize: "0.82rem" }}>
                  {u.full_name || u.name} ({u.role_name || u.role || "Team Member"})
                </MenuItem>
              ))}
            </Select>
          </Grid>

          {/* DATE PICKER */}
          <Grid item xs={12} sm={6}>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
              Survey Date *
            </Typography>
            <TextField
              type="date"
              fullWidth
              size="small"
              value={formData.scheduled_date}
              onChange={(e) => setFormData((p) => ({ ...p, scheduled_date: e.target.value }))}
              error={Boolean(errors.scheduled_date)}
              helperText={errors.scheduled_date}
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: "8px", backgroundColor: "#FFFFFF" },
                "& input": { fontSize: "0.82rem" },
              }}
            />
          </Grid>

          {/* TIME SLOT */}
          <Grid item xs={12} sm={6}>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
              Time Slot *
            </Typography>
            <Select
              fullWidth
              size="small"
              value={formData.scheduled_time}
              onChange={(e) => setFormData((p) => ({ ...p, scheduled_time: e.target.value }))}
              sx={{ borderRadius: "8px", fontSize: "0.82rem", backgroundColor: "#FFFFFF" }}
            >
              {TIME_SLOTS.map((slot) => (
                <MenuItem key={slot} value={slot} sx={{ fontSize: "0.82rem" }}>
                  {slot}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          {/* NOTES */}
          <Grid item xs={12}>
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
          disabled={saving}
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
