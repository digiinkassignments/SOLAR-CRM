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
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Typography,
  Divider,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";

// Icons from @mui/icons-material
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import SpeedIcon from "@mui/icons-material/Speed";
import SecurityIcon from "@mui/icons-material/Security";
import VerifiedIcon from "@mui/icons-material/Verified";

const COLORS = {
  primary: "#0F172A",
  secondary: "#F59E0B",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F97316",
  bg: "#F8FAFC",
  cardBg: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
};

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

const initialFormData = {
  panel_output_voltage: "",
  inverter_output_kw: "",
  ac_output_voltage: "",
  meter_reading_kwh: "",
  safety_shutdowns: "Pass",
  grounding_check: "Pass",
  wiring_insulation: "Pass",
  earth_leakage: "Pass",
  overall_result: "Passed",
  commission_date: new Date().toISOString().split("T")[0],
  commissioning_engineer: "",
  certificate_number: "",
  remarks: "",
};

export default function Commissioning({ project, projectId }) {
  const targetProjectId = projectId || project?.id;

  const [commissioning, setCommissioning] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

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

  const fetchCommissioning = useCallback(async () => {
    if (!targetProjectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(getApiUrl(`/projects/${targetProjectId}/commissioning`), {
        headers: getAuthHeader(),
      });

      const raw = res.data;
      const data =
        raw?.commissioning !== undefined
          ? raw.commissioning
          : raw?.data !== undefined
          ? raw.data
          : raw;

      if (data && (data.id || data.project_id || data.overall_result)) {
        setCommissioning(data);
      } else {
        setCommissioning(null);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        showSnackbar(
          err.response?.data?.message || "Failed to load commissioning data.",
          "error"
        );
      }
      setCommissioning(null);
    } finally {
      setLoading(false);
    }
  }, [targetProjectId, showSnackbar]);

  useEffect(() => {
    fetchCommissioning();
  }, [fetchCommissioning]);

  const handleOpenDialog = () => {
    if (commissioning) {
      setFormData({
        panel_output_voltage: commissioning.panel_output_voltage ?? "",
        inverter_output_kw: commissioning.inverter_output_kw ?? "",
        ac_output_voltage: commissioning.ac_output_voltage ?? "",
        meter_reading_kwh: commissioning.meter_reading_kwh ?? "",
        safety_shutdowns: commissioning.safety_shutdowns || "Pass",
        grounding_check: commissioning.grounding_check || "Pass",
        wiring_insulation: commissioning.wiring_insulation || "Pass",
        earth_leakage: commissioning.earth_leakage || "Pass",
        overall_result: commissioning.overall_result || "Passed",
        commission_date: commissioning.commission_date
          ? String(commissioning.commission_date).split("T")[0]
          : new Date().toISOString().split("T")[0],
        commissioning_engineer: commissioning.commissioning_engineer || "",
        certificate_number: commissioning.certificate_number || "",
        remarks: commissioning.remarks || "",
      });
    } else {
      setFormData({
        ...initialFormData,
        commission_date: new Date().toISOString().split("T")[0],
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (!saving) {
      setDialogOpen(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!targetProjectId) {
      showSnackbar("Missing Project ID.", "error");
      return;
    }

    try {
      setSaving(true);
      const url = getApiUrl(`/projects/${targetProjectId}/commissioning`);
      const payload = {
        ...formData,
        panel_output_voltage:
          formData.panel_output_voltage === "" ? null : Number(formData.panel_output_voltage),
        inverter_output_kw:
          formData.inverter_output_kw === "" ? null : Number(formData.inverter_output_kw),
        ac_output_voltage:
          formData.ac_output_voltage === "" ? null : Number(formData.ac_output_voltage),
        meter_reading_kwh:
          formData.meter_reading_kwh === "" ? null : Number(formData.meter_reading_kwh),
      };

      let res;
      if (commissioning && commissioning.id) {
        res = await axios.put(url, payload, { headers: getAuthHeader() });
      } else {
        res = await axios.post(url, payload, { headers: getAuthHeader() });
      }

      const raw = res.data;
      const saved =
        raw?.commissioning !== undefined
          ? raw.commissioning
          : raw?.data !== undefined
          ? raw.data
          : raw;

      setCommissioning(saved || payload);
      showSnackbar("Commissioning & testing data saved successfully!", "success");
      setDialogOpen(false);
      fetchCommissioning();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Failed to save commissioning data.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const getResultChipProps = (result) => {
    switch (result) {
      case "Passed":
        return {
          label: "Passed",
          sx: {
            backgroundColor: "#ECFDF5",
            color: COLORS.success,
            border: `1px solid ${COLORS.success}`,
            fontWeight: 700,
            fontFamily: "Inter, sans-serif",
          },
        };
      case "Failed":
        return {
          label: "Failed",
          sx: {
            backgroundColor: "#FEF2F2",
            color: COLORS.error,
            border: `1px solid ${COLORS.error}`,
            fontWeight: 700,
            fontFamily: "Inter, sans-serif",
          },
        };
      case "Conditional Pass":
        return {
          label: "Conditional Pass",
          sx: {
            backgroundColor: "#FFFBEB",
            color: COLORS.secondary,
            border: `1px solid ${COLORS.secondary}`,
            fontWeight: 700,
            fontFamily: "Inter, sans-serif",
          },
        };
      default:
        return {
          label: result || "Pending",
          sx: {
            backgroundColor: "#F1F5F9",
            color: COLORS.textSecondary,
            border: `1px solid ${COLORS.border}`,
            fontWeight: 700,
            fontFamily: "Inter, sans-serif",
          },
        };
    }
  };

  const renderDetailItem = (label, value) => (
    <Box sx={{ mb: 1.5 }}>
      <Typography
        sx={{
          fontSize: "0.74rem",
          fontWeight: 600,
          color: COLORS.textSecondary,
          fontFamily: "Inter, sans-serif",
          textTransform: "uppercase",
          letterSpacing: "0.03em",
          mb: 0.25,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.9rem",
          fontWeight: 600,
          color: COLORS.textPrimary,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {value !== null && value !== undefined && value !== "" ? String(value) : "—"}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ fontFamily: "Inter, sans-serif" }}>
      {loading ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 8,
            gap: 2,
          }}
        >
          <CircularProgress size={36} sx={{ color: COLORS.primary }} />
          <Typography
            sx={{
              fontSize: "0.86rem",
              fontWeight: 500,
              color: COLORS.textSecondary,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Loading commissioning data...
          </Typography>
        </Box>
      ) : !commissioning ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: "14px",
            border: `1px dashed ${COLORS.border}`,
            backgroundColor: COLORS.cardBg,
            p: { xs: 3, sm: 6 },
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
              backgroundColor: "#EFF6FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
              color: "#3B82F6",
            }}
          >
            <ElectricBoltIcon sx={{ fontSize: 34 }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: COLORS.textPrimary,
              fontFamily: "Inter, sans-serif",
              mb: 1,
            }}
          >
            Commissioning Not Conducted Yet
          </Typography>
          <Typography
            sx={{
              fontSize: "0.88rem",
              color: COLORS.textSecondary,
              fontFamily: "Inter, sans-serif",
              maxWidth: 480,
              mb: 3,
            }}
          >
            Perform system output validations, electrical insulation tests, and record engineering sign-off for safety.
          </Typography>
          <Button
            variant="contained"
            startIcon={<ElectricBoltIcon />}
            onClick={handleOpenDialog}
            sx={{
              backgroundColor: COLORS.primary,
              color: "#FFFFFF",
              textTransform: "none",
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              fontSize: "0.88rem",
              px: 3,
              py: 1,
              borderRadius: "8px",
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#020617",
                boxShadow: "none",
              },
            }}
          >
            Start Commissioning
          </Button>
        </Card>
      ) : (
        <Box>
          {/* Header Action Bar */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              mb: 2.5,
              p: 2,
              borderRadius: "12px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.cardBg,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <VerifiedIcon sx={{ color: COLORS.success, fontSize: 28 }} />
              <Box>
                <Typography
                  sx={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Commissioning & Testing Certificate
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    color: COLORS.textSecondary,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Engineer: <strong>{commissioning.commissioning_engineer || "N/A"}</strong> • Date:{" "}
                  {commissioning.commission_date
                    ? String(commissioning.commission_date).split("T")[0]
                    : "N/A"}{" "}
                  {commissioning.certificate_number && `• Cert: #${commissioning.certificate_number}`}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Chip {...getResultChipProps(commissioning.overall_result)} />
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                onClick={handleOpenDialog}
                sx={{
                  borderColor: COLORS.border,
                  color: COLORS.textPrimary,
                  textTransform: "none",
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  borderRadius: "8px",
                  "&:hover": {
                    borderColor: COLORS.primary,
                    backgroundColor: COLORS.bg,
                  },
                }}
              >
                Edit
              </Button>
            </Box>
          </Box>

          {/* Cards Grid */}
          <Grid container spacing={2.5}>
            {/* Section 1: System Output Test */}
            <Grid item xs={12} md={6}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: "12px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.cardBg,
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2 }}>
                    <SpeedIcon sx={{ color: COLORS.secondary, fontSize: 22 }} />
                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: COLORS.textPrimary,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      System Output Test
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      {renderDetailItem(
                        "Panel Output Voltage",
                        commissioning.panel_output_voltage ? `${commissioning.panel_output_voltage} V` : null
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem(
                        "Inverter Output",
                        commissioning.inverter_output_kw ? `${commissioning.inverter_output_kw} kW` : null
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem(
                        "AC Output Voltage",
                        commissioning.ac_output_voltage ? `${commissioning.ac_output_voltage} V` : null
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem(
                        "Meter Reading",
                        commissioning.meter_reading_kwh ? `${commissioning.meter_reading_kwh} kWh` : null
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section 2: Safety Checks */}
            <Grid item xs={12} md={6}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: "12px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.cardBg,
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2 }}>
                    <SecurityIcon sx={{ color: COLORS.warning, fontSize: 22 }} />
                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: COLORS.textPrimary,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Safety Checks & Protection
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      {renderDetailItem("Safety Shutdowns Test", commissioning.safety_shutdowns)}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem("Grounding Check", commissioning.grounding_check)}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem("Wiring Insulation Test", commissioning.wiring_insulation)}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem("Earth Leakage Test", commissioning.earth_leakage)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section 3: Commissioning Result Details */}
            <Grid item xs={12}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: "12px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.cardBg,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2 }}>
                    <VerifiedIcon sx={{ color: COLORS.success, fontSize: 22 }} />
                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: COLORS.textPrimary,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Commissioning Result & Sign-Off
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography
                          sx={{
                            fontSize: "0.74rem",
                            fontWeight: 600,
                            color: COLORS.textSecondary,
                            fontFamily: "Inter, sans-serif",
                            textTransform: "uppercase",
                            letterSpacing: "0.03em",
                            mb: 0.5,
                          }}
                        >
                          Overall Result
                        </Typography>
                        <Chip {...getResultChipProps(commissioning.overall_result)} />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      {renderDetailItem(
                        "Commission Date",
                        commissioning.commission_date
                          ? String(commissioning.commission_date).split("T")[0]
                          : null
                      )}
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      {renderDetailItem("Commissioning Engineer", commissioning.commissioning_engineer)}
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      {renderDetailItem("Certificate Number", commissioning.certificate_number)}
                    </Grid>
                    <Grid item xs={12}>
                      {renderDetailItem("Remarks", commissioning.remarks)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* MODAL DIALOG */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "14px",
            backgroundColor: COLORS.cardBg,
            fontFamily: "Inter, sans-serif",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2,
            borderBottom: `1px solid ${COLORS.border}`,
            fontSize: "1.1rem",
            fontWeight: 700,
            color: COLORS.textPrimary,
            fontFamily: "Inter, sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Commissioning & Testing
          {commissioning && <Chip size="small" {...getResultChipProps(formData.overall_result)} />}
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box component="form" id="commissioning-form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {/* Section 1: System Output Test */}
            <Typography
              sx={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: COLORS.textPrimary,
                fontFamily: "Inter, sans-serif",
                mb: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <SpeedIcon sx={{ color: COLORS.secondary, fontSize: 20 }} />
              Section 1: System Output Test
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Panel Output Voltage (V)"
                  inputProps={{ step: "any" }}
                  value={formData.panel_output_voltage}
                  onChange={(e) => handleInputChange("panel_output_voltage", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Inverter Output (kW)"
                  inputProps={{ step: "any" }}
                  value={formData.inverter_output_kw}
                  onChange={(e) => handleInputChange("inverter_output_kw", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="AC Output Voltage (V)"
                  inputProps={{ step: "any" }}
                  value={formData.ac_output_voltage}
                  onChange={(e) => handleInputChange("ac_output_voltage", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Meter Reading (kWh)"
                  inputProps={{ step: "any" }}
                  value={formData.meter_reading_kwh}
                  onChange={(e) => handleInputChange("meter_reading_kwh", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2.5, borderColor: COLORS.border }} />

            {/* Section 2: Safety Checks */}
            <Typography
              sx={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: COLORS.textPrimary,
                fontFamily: "Inter, sans-serif",
                mb: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <SecurityIcon sx={{ color: COLORS.warning, fontSize: 20 }} />
              Section 2: Safety Checks
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                { field: "safety_shutdowns", label: "Safety Shutdowns Test" },
                { field: "grounding_check", label: "Grounding Check" },
                { field: "wiring_insulation", label: "Wiring Insulation Test" },
                { field: "earth_leakage", label: "Earth Leakage Test" },
              ].map((item) => (
                <Grid item xs={12} sm={6} key={item.field}>
                  <Typography
                    sx={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: COLORS.textSecondary,
                      fontFamily: "Inter, sans-serif",
                      mb: 0.5,
                    }}
                  >
                    {item.label}
                  </Typography>
                  <RadioGroup
                    row
                    value={formData[item.field]}
                    onChange={(e) => handleInputChange(item.field, e.target.value)}
                  >
                    {["Pass", "Fail"].map((val) => (
                      <FormControlLabel
                        key={val}
                        value={val}
                        control={
                          <Radio
                            size="small"
                            sx={{
                              color: COLORS.border,
                              "&.Mui-checked": {
                                color: val === "Pass" ? COLORS.success : COLORS.error,
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            sx={{
                              fontSize: "0.85rem",
                              fontFamily: "Inter, sans-serif",
                              color: COLORS.textPrimary,
                            }}
                          >
                            {val}
                          </Typography>
                        }
                      />
                    ))}
                  </RadioGroup>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 2.5, borderColor: COLORS.border }} />

            {/* Section 3: Commissioning Result */}
            <Typography
              sx={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: COLORS.textPrimary,
                fontFamily: "Inter, sans-serif",
                mb: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <VerifiedIcon sx={{ color: COLORS.success, fontSize: 20 }} />
              Section 3: Commissioning Result
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontFamily: "Inter, sans-serif" }}>Overall Result</InputLabel>
                  <Select
                    value={formData.overall_result}
                    label="Overall Result"
                    onChange={(e) => handleInputChange("overall_result", e.target.value)}
                    sx={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <MenuItem value="Passed">Passed</MenuItem>
                    <MenuItem value="Failed">Failed</MenuItem>
                    <MenuItem value="Conditional Pass">Conditional Pass</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Commission Date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.commission_date}
                  onChange={(e) => handleInputChange("commission_date", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Commissioning Engineer"
                  value={formData.commissioning_engineer}
                  onChange={(e) => handleInputChange("commissioning_engineer", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Certificate Number"
                  value={formData.certificate_number}
                  onChange={(e) => handleInputChange("certificate_number", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  label="Remarks"
                  placeholder="Additional commissioning notes, readings, recommendations..."
                  value={formData.remarks}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button
            onClick={handleCloseDialog}
            disabled={saving}
            startIcon={<CancelIcon />}
            sx={{
              color: COLORS.textSecondary,
              textTransform: "none",
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="commissioning-form"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{
              backgroundColor: COLORS.primary,
              color: "#FFFFFF",
              textTransform: "none",
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              borderRadius: "8px",
              px: 2.5,
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#020617",
                boxShadow: "none",
              },
            }}
          >
            {saving ? "Saving..." : "Save Commissioning"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={hideSnackbar}
          severity={snackbar.severity}
          sx={{
            width: "100%",
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            borderRadius: "8px",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
