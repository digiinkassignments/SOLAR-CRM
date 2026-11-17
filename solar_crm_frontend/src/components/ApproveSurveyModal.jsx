import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Paper,
} from "@mui/material";
import {
  Engineering as EngineeringIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  SolarPower as SolarIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
} from "@mui/icons-material";
import api from "../api/axios";
import { getSurveyByLead, approveSurveyByLead } from "../services/surveyService";
import { STAGES } from "../utils/projectStages";

export default function ApproveSurveyModal({
  open,
  onClose,
  lead,
  survey: initialSurvey,
  onApproved,
}) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [survey, setSurvey] = useState(initialSurvey || null);
  const [engineers, setEngineers] = useState([]);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    initialStage: "Pre-Install Inspection",
    assigned_to: "",
    notes: "",
  });

  // Load Survey & Engineers when modal opens
  useEffect(() => {
    if (!open || !lead) return;

    setError("");
    setSubmitting(false);

    // Fetch site engineers for assignment dropdown
    api
      .get("/surveys/engineers")
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setEngineers(res.data.data);
        }
      })
      .catch((e) => console.warn("Failed to load engineers:", e));

    if (initialSurvey) {
      setSurvey(initialSurvey);
      setFormData({
        initialStage: "Pre-Install Inspection",
        assigned_to: initialSurvey.assigned_engineer_id || "",
        notes: initialSurvey.feasibility_notes || "",
      });
      return;
    }

    // Fetch survey details by lead
    setLoading(true);
    getSurveyByLead(lead.id)
      .then((res) => {
        if (res.success && res.data) {
          setSurvey(res.data);
          setFormData({
            initialStage: "Pre-Install Inspection",
            assigned_to: res.data.assigned_engineer_id || "",
            notes: res.data.feasibility_notes || "",
          });
        }
      })
      .catch((err) => {
        console.warn("Could not fetch survey by lead:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, lead, initialSurvey]);

  const handleSubmit = async () => {
    if (!lead) return;
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        surveyId: survey?.id || null,
        leadId: lead.id,
        initialStage: formData.initialStage || "Pre-Install Inspection",
        assigned_to: formData.assigned_to || survey?.assigned_engineer_id || null,
        notes: formData.notes || "Approved from Site Survey",
      };

      const res = await approveSurveyByLead(lead.id, payload);
      if (res?.success) {
        if (onApproved) {
          onApproved(res.data);
        }
        onClose();
      } else {
        setError(res?.message || "Failed to approve survey.");
      }
    } catch (err) {
      console.error("approve survey error:", err);
      setError(err.response?.data?.message || "Failed to approve survey and create project.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!lead) return null;

  const capacity =
    survey?.proposed_capacity_kw ||
    lead.required_kw ||
    survey?.required_kw ||
    3.0;

  const verdict = survey?.feasibility_verdict || "Feasible";
  const isFeasible = verdict === "Feasible" || verdict.includes("conditions");

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          p: 0,
          overflow: "hidden",
        },
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          px: 3,
          py: 2.2,
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              backgroundColor: "#16A34A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AssignmentTurnedInIcon sx={{ color: "#FFFFFF", fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.01em" }}>
              Approve Site Survey & Create Project
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "#94A3B8" }}>
              Convert completed technical feasibility into an active installation project
            </Typography>
          </Box>
        </Box>
        <Button
          onClick={onClose}
          disabled={submitting}
          sx={{ minWidth: 32, p: 0.5, color: "#94A3B8", "&:hover": { color: "#FFFFFF" } }}
        >
          <CloseIcon fontSize="small" />
        </Button>
      </Box>

      {/* CONTENT */}
      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress size={36} />
          </Box>
        ) : (
          <Stack spacing={2.5}>
            {/* LEAD & SURVEY SUMMARY CARD */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#F8FAFC",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#0F172A" }}>
                    {lead.customer_name}
                  </Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: "#64748B" }}>
                    Lead Code: <strong>{lead.lead_code || `LD${lead.id}`}</strong> · {lead.mobile_number}
                  </Typography>
                  {(lead.address || lead.city) && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.4 }}>
                      <LocationIcon sx={{ fontSize: 13, color: "#94A3B8" }} />
                      <Typography sx={{ fontSize: "0.72rem", color: "#64748B" }}>
                        {[lead.address, lead.city, lead.state].filter(Boolean).join(", ")}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Chip
                  label={verdict}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    bgcolor: isFeasible ? "#DCFCE7" : "#FEE2E2",
                    color: isFeasible ? "#166534" : "#991B1B",
                    borderRadius: "6px",
                  }}
                />
              </Box>

              <Divider sx={{ my: 1.2 }} />

              <Grid container spacing={1.5}>
                <Grid item xs={6} sm={3}>
                  <Typography sx={{ fontSize: "0.68rem", color: "#64748B", fontWeight: 600 }}>
                    SYSTEM CAPACITY
                  </Typography>
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: "#0F172A" }}>
                    {capacity} kW
                  </Typography>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Typography sx={{ fontSize: "0.68rem", color: "#64748B", fontWeight: 600 }}>
                    ROOF TYPE
                  </Typography>
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#0F172A" }}>
                    {survey?.roof_type || "RCC Flat"}
                  </Typography>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Typography sx={{ fontSize: "0.68rem", color: "#64748B", fontWeight: 600 }}>
                    SUPPLY PHASE
                  </Typography>
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#0F172A" }}>
                    {survey?.electrical_phase || "Single Phase"}
                  </Typography>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Typography sx={{ fontSize: "0.68rem", color: "#64748B", fontWeight: 600 }}>
                    CONSUMER NUMBER
                  </Typography>
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#0F172A" }}>
                    {survey?.consumer_number || lead.consumer_number || "N/A"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* PROJECT ASSIGNMENT & STAGE SETTINGS */}
            <Box>
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: "#1E293B", mb: 1.5 }}>
                Project Configuration
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Assign Site Engineer"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData((p) => ({ ...p, assigned_to: e.target.value }))}
                    helperText="This engineer will execute the project stages"
                  >
                    <MenuItem value="">
                      <em>Unassigned</em>
                    </MenuItem>
                    {engineers.map((eng) => (
                      <MenuItem key={eng.id} value={eng.id}>
                        {eng.full_name} (Site Engineer)
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Initial Project Stage"
                    value={formData.initialStage}
                    onChange={(e) => setFormData((p) => ({ ...p, initialStage: e.target.value }))}
                    helperText="Stage where the project will be placed"
                  >
                    {STAGES.map((stg) => (
                      <MenuItem key={stg} value={stg}>
                        {stg}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    label="Coordinator Approval Remarks / Technical Instructions"
                    placeholder="E.g. Approved for 3 kW installation. Site is shadow free. Proceed with BOM and structure layout."
                    value={formData.notes}
                    onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                  />
                </Grid>
              </Grid>
            </Box>

            <Alert severity="success" sx={{ borderRadius: "8px", fontSize: "0.76rem" }}>
              Once approved, a new project will be created automatically and immediately appear in the Site Engineer's portal under <strong>Assigned Projects</strong>.
            </Alert>
          </Stack>
        )}
      </DialogContent>

      {/* ACTIONS */}
      <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #E2E8F0", gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={submitting}
          sx={{ textTransform: "none", color: "#64748B", fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || loading}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <EngineeringIcon />}
          sx={{
            textTransform: "none",
            fontWeight: 800,
            borderRadius: "8px",
            px: 2.5,
            backgroundColor: "#16A34A",
            "&:hover": { backgroundColor: "#15803D" },
          }}
        >
          {submitting ? "Creating Project..." : "Approve Survey & Create Project"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

