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
  Button,
  Typography,
  Divider,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
} from "@mui/material";

// Icons from @mui/icons-material
import VerifiedIcon from "@mui/icons-material/Verified";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import BuildIcon from "@mui/icons-material/Build";
import HandymanIcon from "@mui/icons-material/Handyman";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ShieldIcon from "@mui/icons-material/Shield";
import CancelIcon from "@mui/icons-material/Cancel";
import SaveIcon from "@mui/icons-material/Save";


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

const initialWarrantyFormData = {
  panel_warranty_years: 25,
  inverter_warranty_years: 5,
  installation_warranty_years: 5,
  warranty_start_date: new Date().toISOString().split("T")[0],
  warranty_end_date: "",
  amc_start_date: new Date().toISOString().split("T")[0],
  amc_end_date: "",
  amc_plan: "Standard",
  amc_amount: "",
  visit_frequency: "Quarterly",
};

const initialVisitFormData = {
  visit_date: new Date().toISOString().split("T")[0],
  technician: "",
  issue_reported: "",
  resolution: "",
  status: "Completed",
};

export default function WarrantyAMC({ project, projectId }) {
  const targetProjectId = projectId || project?.id;

  const [warrantyData, setWarrantyData] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modals
  const [warrantyModalOpen, setWarrantyModalOpen] = useState(false);
  const [visitModalOpen, setVisitModalOpen] = useState(false);

  const [warrantyForm, setWarrantyForm] = useState(initialWarrantyFormData);
  const [visitForm, setVisitForm] = useState(initialVisitFormData);

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

  const fetchData = useCallback(async () => {
    if (!targetProjectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(getApiUrl(`/projects/${targetProjectId}/warranty`), {
        headers: getAuthHeader(),
      });

      const raw = res.data;
      const data = raw?.data !== undefined ? raw.data : raw;

      const warranty = data?.warranty !== undefined ? data.warranty : data;
      const visitsList = Array.isArray(data?.visits)
        ? data.visits
        : Array.isArray(warranty?.visits)
        ? warranty.visits
        : [];

      if (warranty && (warranty.id || warranty.panel_warranty_years || warranty.warranty_start_date)) {
        setWarrantyData(warranty);
      } else {
        setWarrantyData(null);
      }

      setVisits(visitsList);
    } catch (err) {
      if (err.response?.status !== 404) {
        showSnackbar(
          err.response?.data?.message || "Failed to load warranty and AMC data.",
          "error"
        );
      }
      setWarrantyData(null);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  }, [targetProjectId, showSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Warranty Setup/Edit modal
  const handleOpenWarrantyModal = () => {
    if (warrantyData) {
      setWarrantyForm({
        panel_warranty_years: warrantyData.panel_warranty_years ?? 25,
        inverter_warranty_years: warrantyData.inverter_warranty_years ?? 5,
        installation_warranty_years: warrantyData.installation_warranty_years ?? 5,
        warranty_start_date: warrantyData.warranty_start_date
          ? String(warrantyData.warranty_start_date).split("T")[0]
          : new Date().toISOString().split("T")[0],
        warranty_end_date: warrantyData.warranty_end_date
          ? String(warrantyData.warranty_end_date).split("T")[0]
          : "",
        amc_start_date: warrantyData.amc_start_date
          ? String(warrantyData.amc_start_date).split("T")[0]
          : new Date().toISOString().split("T")[0],
        amc_end_date: warrantyData.amc_end_date
          ? String(warrantyData.amc_end_date).split("T")[0]
          : "",
        amc_plan: warrantyData.amc_plan || "Standard",
        amc_amount: warrantyData.amc_amount ?? "",
        visit_frequency: warrantyData.visit_frequency || "Quarterly",
      });
    } else {
      setWarrantyForm({
        ...initialWarrantyFormData,
        warranty_start_date: new Date().toISOString().split("T")[0],
        amc_start_date: new Date().toISOString().split("T")[0],
      });
    }
    setWarrantyModalOpen(true);
  };

  const handleSaveWarranty = async (e) => {
    if (e) e.preventDefault();
    if (!targetProjectId) {
      showSnackbar("Missing Project ID.", "error");
      return;
    }

    try {
      setSaving(true);
      const url = getApiUrl(`/projects/${targetProjectId}/warranty`);
      const payload = {
        ...warrantyForm,
        panel_warranty_years:
          warrantyForm.panel_warranty_years === "" ? null : Number(warrantyForm.panel_warranty_years),
        inverter_warranty_years:
          warrantyForm.inverter_warranty_years === "" ? null : Number(warrantyForm.inverter_warranty_years),
        installation_warranty_years:
          warrantyForm.installation_warranty_years === ""
            ? null
            : Number(warrantyForm.installation_warranty_years),
        amc_amount: warrantyForm.amc_amount === "" ? null : Number(warrantyForm.amc_amount),
        warranty_end_date: warrantyForm.warranty_end_date || null,
        amc_end_date: warrantyForm.amc_end_date || null,
      };

      await axios.post(url, payload, { headers: getAuthHeader() });
      showSnackbar("Warranty & AMC configuration saved successfully!", "success");
      setWarrantyModalOpen(false);
      fetchData();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Failed to save warranty information.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // Open Log Visit Modal
  const handleOpenVisitModal = () => {
    setVisitForm({
      ...initialVisitFormData,
      visit_date: new Date().toISOString().split("T")[0],
    });
    setVisitModalOpen(true);
  };

  const handleSaveVisit = async (e) => {
    if (e) e.preventDefault();
    if (!targetProjectId) return;

    try {
      setSaving(true);
      const url = getApiUrl(`/projects/${targetProjectId}/warranty/visits`);
      await axios.post(url, visitForm, { headers: getAuthHeader() });
      showSnackbar("Service visit logged successfully!", "success");
      setVisitModalOpen(false);
      fetchData();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Failed to log service visit.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const getStatusChip = (status) => {
    let color = COLORS.primary;
    let bg = "#F1F5F9";
    let border = COLORS.border;

    if (status === "Completed") {
      color = COLORS.success;
      bg = "#ECFDF5";
      border = COLORS.success;
    } else if (status === "Pending") {
      color = COLORS.secondary;
      bg = "#FFFBEB";
      border = COLORS.secondary;
    } else if (status === "Escalated") {
      color = COLORS.error;
      bg = "#FEF2F2";
      border = COLORS.error;
    }

    return (
      <Chip
        label={status || "Completed"}
        size="small"
        sx={{
          backgroundColor: bg,
          color,
          border: `1px solid ${border}`,
          fontWeight: 700,
          fontFamily: "Inter, sans-serif",
          fontSize: "0.72rem",
        }}
      />
    );
  };

  const getPlanChip = (plan) => {
    let bg = "#EFF6FF";
    let color = "#2563EB";
    if (plan === "Premium") {
      bg = "#FAF5FF";
      color = "#9333EA";
    } else if (plan === "Basic") {
      bg = "#F1F5F9";
      color = COLORS.textSecondary;
    }
    return (
      <Chip
        label={plan || "Standard"}
        size="small"
        sx={{
          backgroundColor: bg,
          color,
          fontWeight: 700,
          fontFamily: "Inter, sans-serif",
          fontSize: "0.74rem",
        }}
      />
    );
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
            Loading Warranty & AMC details...
          </Typography>
        </Box>
      ) : !warrantyData ? (
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
            <VerifiedIcon sx={{ fontSize: 34 }} />
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
            Warranty & AMC Not Configured
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
            Setup equipment warranty durations, Annual Maintenance Contract (AMC) plans, and schedule regular servicing.
          </Typography>
          <Button
            variant="contained"
            startIcon={<VerifiedIcon />}
            onClick={handleOpenWarrantyModal}
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
            Setup Warranty & AMC
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
                  Active Warranty & AMC Protection Plan
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    color: COLORS.textSecondary,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Plan: <strong>{warrantyData.amc_plan || "Standard"}</strong> • Frequency:{" "}
                  <strong>{warrantyData.visit_frequency || "Quarterly"}</strong> • Total Service Visits:{" "}
                  <strong>{visits.length}</strong>
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                onClick={handleOpenVisitModal}
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
                Log Service Visit
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                onClick={handleOpenWarrantyModal}
                sx={{
                  backgroundColor: COLORS.primary,
                  color: "#FFFFFF",
                  textTransform: "none",
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  borderRadius: "8px",
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: "#020617",
                    boxShadow: "none",
                  },
                }}
              >
                Edit Contract
              </Button>
            </Stack>
          </Box>

          <Grid container spacing={2.5}>
            {/* Section 1: Warranty Details */}
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
                    <ShieldIcon sx={{ color: COLORS.secondary, fontSize: 22 }} />
                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: COLORS.textPrimary,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Warranty Coverage Details
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={1.5}>
                    <Grid item xs={6} sm={4}>
                      {renderDetailItem(
                        "Panel Warranty",
                        warrantyData.panel_warranty_years
                          ? `${warrantyData.panel_warranty_years} Years`
                          : "—"
                      )}
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      {renderDetailItem(
                        "Inverter Warranty",
                        warrantyData.inverter_warranty_years
                          ? `${warrantyData.inverter_warranty_years} Years`
                          : "—"
                      )}
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      {renderDetailItem(
                        "Installation Warranty",
                        warrantyData.installation_warranty_years
                          ? `${warrantyData.installation_warranty_years} Years`
                          : "—"
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem(
                        "Warranty Start Date",
                        warrantyData.warranty_start_date
                          ? String(warrantyData.warranty_start_date).split("T")[0]
                          : "—"
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem(
                        "Warranty End Date",
                        warrantyData.warranty_end_date
                          ? String(warrantyData.warranty_end_date).split("T")[0]
                          : "—"
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section 2: AMC Contract */}
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
                    <BuildIcon sx={{ color: COLORS.warning, fontSize: 22 }} />
                    <Typography
                      sx={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: COLORS.textPrimary,
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      AMC Contract Terms
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
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
                          AMC Plan
                        </Typography>
                        {getPlanChip(warrantyData.amc_plan)}
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem(
                        "AMC Amount",
                        warrantyData.amc_amount
                          ? `₹${Number(warrantyData.amc_amount).toLocaleString("en-IN")}`
                          : "—"
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem(
                        "AMC Start Date",
                        warrantyData.amc_start_date
                          ? String(warrantyData.amc_start_date).split("T")[0]
                          : "—"
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      {renderDetailItem(
                        "AMC End Date",
                        warrantyData.amc_end_date
                          ? String(warrantyData.amc_end_date).split("T")[0]
                          : "—"
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      {renderDetailItem("Visit Frequency", warrantyData.visit_frequency)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section 3: Service Visits Table */}
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
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                      <HandymanIcon sx={{ color: COLORS.secondary, fontSize: 22 }} />
                      <Typography
                        sx={{
                          fontSize: "0.95rem",
                          fontWeight: 700,
                          color: COLORS.textPrimary,
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        Service & Maintenance History
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                      onClick={handleOpenVisitModal}
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
                      Add Service Visit
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  {visits.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: "center", color: COLORS.textSecondary }}>
                      <Typography sx={{ fontSize: "0.88rem", fontFamily: "Inter, sans-serif" }}>
                        No service visits logged yet for this solar installation.
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${COLORS.border}` }}>
                      <Table size="small">
                        <TableHead sx={{ backgroundColor: COLORS.bg }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem", color: COLORS.textSecondary }}>
                              Visit Date
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem", color: COLORS.textSecondary }}>
                              Technician
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem", color: COLORS.textSecondary }}>
                              Issue Reported
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem", color: COLORS.textSecondary }}>
                              Resolution / Work Done
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: "0.78rem", color: COLORS.textSecondary }}>
                              Status
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {visits.map((row) => (
                            <TableRow key={row.id} hover>
                              <TableCell sx={{ fontSize: "0.82rem", fontWeight: 600, color: COLORS.textPrimary }}>
                                {row.visit_date ? String(row.visit_date).split("T")[0] : "—"}
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.82rem", color: COLORS.textPrimary }}>
                                {row.technician || "—"}
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.82rem", color: COLORS.textPrimary }}>
                                {row.issue_reported || "Routine check"}
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.82rem", color: COLORS.textPrimary }}>
                                {row.resolution || "—"}
                              </TableCell>
                              <TableCell>{getStatusChip(row.status)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* SETUP / EDIT WARRANTY MODAL */}
      <Dialog
        open={warrantyModalOpen}
        onClose={() => !saving && setWarrantyModalOpen(false)}
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
          }}
        >
          {warrantyData ? "Edit Warranty & AMC Configuration" : "Setup Warranty & AMC"}
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box component="form" id="warranty-form" onSubmit={handleSaveWarranty} sx={{ mt: 1 }}>
            {/* Warranty Details */}
            <Typography
              sx={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: COLORS.textPrimary,
                fontFamily: "Inter, sans-serif",
                mb: 1.5,
              }}
            >
              Warranty Coverage
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Panel Warranty (Years)"
                  value={warrantyForm.panel_warranty_years}
                  onChange={(e) =>
                    setWarrantyForm({ ...warrantyForm, panel_warranty_years: e.target.value })
                  }
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Inverter Warranty (Years)"
                  value={warrantyForm.inverter_warranty_years}
                  onChange={(e) =>
                    setWarrantyForm({ ...warrantyForm, inverter_warranty_years: e.target.value })
                  }
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Installation Warranty (Years)"
                  value={warrantyForm.installation_warranty_years}
                  onChange={(e) =>
                    setWarrantyForm({ ...warrantyForm, installation_warranty_years: e.target.value })
                  }
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Warranty Start Date"
                  InputLabelProps={{ shrink: true }}
                  value={warrantyForm.warranty_start_date}
                  onChange={(e) =>
                    setWarrantyForm({ ...warrantyForm, warranty_start_date: e.target.value })
                  }
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Warranty End Date"
                  InputLabelProps={{ shrink: true }}
                  value={warrantyForm.warranty_end_date}
                  onChange={(e) =>
                    setWarrantyForm({ ...warrantyForm, warranty_end_date: e.target.value })
                  }
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2.5, borderColor: COLORS.border }} />

            {/* AMC Details */}
            <Typography
              sx={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: COLORS.textPrimary,
                fontFamily: "Inter, sans-serif",
                mb: 1.5,
              }}
            >
              AMC Contract Terms
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontFamily: "Inter, sans-serif" }}>AMC Plan</InputLabel>
                  <Select
                    value={warrantyForm.amc_plan}
                    label="AMC Plan"
                    onChange={(e) =>
                      setWarrantyForm({ ...warrantyForm, amc_plan: e.target.value })
                    }
                    sx={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <MenuItem value="Basic">Basic</MenuItem>
                    <MenuItem value="Standard">Standard</MenuItem>
                    <MenuItem value="Premium">Premium</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="AMC Amount (₹)"
                  value={warrantyForm.amc_amount}
                  onChange={(e) =>
                    setWarrantyForm({ ...warrantyForm, amc_amount: e.target.value })
                  }
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontFamily: "Inter, sans-serif" }}>Visit Frequency</InputLabel>
                  <Select
                    value={warrantyForm.visit_frequency}
                    label="Visit Frequency"
                    onChange={(e) =>
                      setWarrantyForm({ ...warrantyForm, visit_frequency: e.target.value })
                    }
                    sx={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <MenuItem value="Monthly">Monthly</MenuItem>
                    <MenuItem value="Quarterly">Quarterly</MenuItem>
                    <MenuItem value="Half-Yearly">Half-Yearly</MenuItem>
                    <MenuItem value="Yearly">Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="AMC Start Date"
                  InputLabelProps={{ shrink: true }}
                  value={warrantyForm.amc_start_date}
                  onChange={(e) =>
                    setWarrantyForm({ ...warrantyForm, amc_start_date: e.target.value })
                  }
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="AMC End Date"
                  InputLabelProps={{ shrink: true }}
                  value={warrantyForm.amc_end_date}
                  onChange={(e) =>
                    setWarrantyForm({ ...warrantyForm, amc_end_date: e.target.value })
                  }
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button
            onClick={() => setWarrantyModalOpen(false)}
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
            form="warranty-form"
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
            {saving ? "Saving..." : "Save Warranty & AMC"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* LOG SERVICE VISIT MODAL */}
      <Dialog
        open={visitModalOpen}
        onClose={() => !saving && setVisitModalOpen(false)}
        maxWidth="sm"
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
          }}
        >
          Log Service & Maintenance Visit
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box component="form" id="visit-form" onSubmit={handleSaveVisit} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Visit Date"
                  InputLabelProps={{ shrink: true }}
                  value={visitForm.visit_date}
                  onChange={(e) => setVisitForm({ ...visitForm, visit_date: e.target.value })}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Technician"
                  value={visitForm.technician}
                  onChange={(e) => setVisitForm({ ...visitForm, technician: e.target.value })}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Issue Reported / Reason"
                  placeholder="e.g. Inverter alert code 302, routine quarterly inspection..."
                  value={visitForm.issue_reported}
                  onChange={(e) => setVisitForm({ ...visitForm, issue_reported: e.target.value })}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  label="Resolution / Work Done"
                  placeholder="e.g. Cleaned solar panels, tightened loose MC4 connectors, verified earth resistance..."
                  value={visitForm.resolution}
                  onChange={(e) => setVisitForm({ ...visitForm, resolution: e.target.value })}
                  sx={{ fontFamily: "Inter, sans-serif" }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontFamily: "Inter, sans-serif" }}>Status</InputLabel>
                  <Select
                    value={visitForm.status}
                    label="Status"
                    onChange={(e) => setVisitForm({ ...visitForm, status: e.target.value })}
                    sx={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Escalated">Escalated</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button
            onClick={() => setVisitModalOpen(false)}
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
            form="visit-form"
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
            {saving ? "Saving..." : "Save Visit"}
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
