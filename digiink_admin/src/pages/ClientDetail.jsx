import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar,
  Stack,
  IconButton,
} from "@mui/material";

// Icons
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import CardMembershipRoundedIcon from "@mui/icons-material/CardMembershipRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import PaymentRoundedIcon from "@mui/icons-material/PaymentRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

import api from "../api/axios";

const COLORS = {
  primary: "#005BAC",
  primaryDark: "#0B3A63",
  primarySoft: "#E0F2FE",
  bg: "#F5F7FA",
  card: "#FFFFFF",
  border: "#E2E8F0",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  orange: "#EA580C",
  orangeSoft: "#FFEDD5",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
};

const STATUS_CONFIG = {
  Active: { bg: COLORS.successSoft, color: COLORS.success, border: "rgba(22,163,74,0.2)" },
  "Expiring Soon": { bg: COLORS.warningSoft, color: COLORS.warning, border: "rgba(217,119,6,0.2)" },
  "Grace Period": { bg: COLORS.orangeSoft, color: COLORS.orange, border: "rgba(234,88,12,0.2)" },
  Locked: { bg: COLORS.dangerSoft, color: COLORS.danger, border: "rgba(220,38,38,0.2)" },
  Deleted: { bg: "#F1F5F9", color: COLORS.textSecondary, border: "rgba(100,116,139,0.2)" },
};

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Renew Dialog
  const [renewOpen, setRenewOpen] = useState(false);
  const [renewLoading, setRenewLoading] = useState(false);
  const [renewForm, setRenewForm] = useState({
    plan_id: "",
    duration_months: 1,
    amount_paid: "",
    notes: "",
  });

  // Delete Dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteClient = async () => {
    if (deleteInput.trim() !== client?.client_code) return;
    setDeleteLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.delete(`/clients/${id}`);
      setDeleteOpen(false);
      navigate("/clients");
    } catch (err) {
      setError(err.response?.data?.message || "Client deletion failed.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clientRes, plansRes] = await Promise.all([
        api.get(`/clients/${id}`),
        api.get("/plans"),
      ]);
      const clientData = clientRes.data?.data;
      setData(clientData);
      setPlans(plansRes.data?.data || []);
      if (clientData?.client) {
        setRenewForm((prev) => ({
          ...prev,
          plan_id: clientData.client.plan_id,
          amount_paid: clientData.client.price_monthly || "",
        }));
      }
    } catch (err) {
      setError("Failed to load client details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleRenew = async () => {
    setRenewLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post(`/clients/${id}/renew`, renewForm);
      setSuccess("Client subscription renewed successfully!");
      setRenewOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Renewal failed.");
    } finally {
      setRenewLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    const client = data?.client;
    const newStatus = client?.status === "Locked" ? "Active" : "Locked";
    if (!window.confirm(`Are you sure you want to ${newStatus === "Active" ? "activate" : "lock"} this client?`)) return;
    try {
      await api.patch(`/clients/${id}/status`, { status: newStatus });
      setSuccess(`Client marked as ${newStatus}.`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Status update failed.");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={36} sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  const client = data?.client;
  const history = data?.history || [];
  const payments = data?.payments || [];
  const sConf = STATUS_CONFIG[client?.status] || STATUS_CONFIG.Deleted;

  return (
    <Box>
      {/* Top Navigation & Action Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton
            onClick={() => navigate("/clients")}
            sx={{
              bgcolor: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.textPrimary,
              borderRadius: "10px",
              "&:hover": { bgcolor: "#F1F5F9" },
            }}
          >
            <ArrowBackRoundedIcon fontSize="small" />
          </IconButton>

          <Avatar
            sx={{
              width: 44,
              height: 44,
              backgroundColor: COLORS.primaryDark,
              color: "#FFFFFF",
              fontSize: "1rem",
              fontWeight: 700,
            }}
          >
            {client?.business_name?.[0]?.toUpperCase() || "C"}
          </Avatar>

          <Box>
            <Stack direction="row" alignItems="center" spacing={1.2}>
              <Typography variant="h5" fontWeight={800} color={COLORS.primaryDark}>
                {client?.business_name}
              </Typography>
              <Chip
                label={client?.client_code}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  bgcolor: "rgba(0,91,172,0.08)",
                  color: COLORS.primary,
                  border: "1px solid rgba(0,91,172,0.2)",
                }}
              />
              <Chip
                label={client?.status}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  bgcolor: sConf.bg,
                  color: sConf.color,
                  border: `1px solid ${sConf.border}`,
                }}
              />
            </Stack>
            <Typography variant="caption" color={COLORS.textSecondary} sx={{ display: "block", mt: 0.2 }}>
              Database: <strong style={{ color: COLORS.textPrimary }}>{client?.db_name}</strong> • Subdomain:{" "}
              <strong style={{ color: COLORS.primary }}>{client?.subdomain}.solarcrm.com</strong>
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="contained"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => setRenewOpen(true)}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              px: 2.2,
              backgroundColor: COLORS.success,
              "&:hover": { backgroundColor: "#15803D" },
            }}
          >
            Renew Plan
          </Button>

          <Button
            variant="outlined"
            startIcon={client?.status === "Locked" ? <LockOpenRoundedIcon /> : <LockOutlinedIcon />}
            onClick={handleStatusToggle}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              px: 2,
              color: client?.status === "Locked" ? COLORS.success : COLORS.danger,
              borderColor: client?.status === "Locked" ? COLORS.success : COLORS.danger,
              "&:hover": {
                borderColor: client?.status === "Locked" ? COLORS.success : COLORS.danger,
                backgroundColor: client?.status === "Locked" ? COLORS.successSoft : COLORS.dangerSoft,
              },
            }}
          >
            {client?.status === "Locked" ? "Unlock Access" : "Lock Access"}
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: "10px" }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2.5, borderRadius: "10px" }}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Business Details Card */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "14px",
              border: `1px solid ${COLORS.border}`,
              p: 3,
              backgroundColor: COLORS.card,
              height: "100%",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.2} mb={2}>
              <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: COLORS.primary }} />
              <BusinessRoundedIcon sx={{ color: COLORS.primary, fontSize: 20 }} />
              <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.95rem" }}>
                Business Details
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

            {[
              ["Business Name", client?.business_name],
              ["Client Code", client?.client_code],
              ["Owner / Contact Name", client?.owner_name],
              ["Email Address", client?.email],
              ["Phone Number", client?.phone || "—"],
              ["City / State", `${client?.city || "—"}, ${client?.state || "—"}`],
              ["App Subdomain", `${client?.subdomain}.solarcrm.com`],
              ["MySQL Database", client?.db_name],
            ].map(([label, val]) => (
              <Box
                key={label}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  py: 1,
                  borderBottom: "1px dashed #F1F5F9",
                }}
              >
                <Typography variant="body2" color={COLORS.textSecondary} fontWeight={500}>
                  {label}
                </Typography>
                <Typography variant="body2" fontWeight={700} color={COLORS.textPrimary}>
                  {val}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Subscription Info Card */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "14px",
              border: `1px solid ${COLORS.border}`,
              p: 3,
              backgroundColor: COLORS.card,
              height: "100%",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.2} mb={2}>
              <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: COLORS.success }} />
              <CardMembershipRoundedIcon sx={{ color: COLORS.success, fontSize: 20 }} />
              <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.95rem" }}>
                Subscription Info
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

            {[
              ["Active Plan", client?.plan_name || "Custom"],
              ["Monthly Price", `₹${Number(client?.price_monthly || 0).toLocaleString("en-IN")}/month`],
              ["Subscription Start", client?.subscription_start ? new Date(client.subscription_start).toLocaleDateString("en-IN") : "—"],
              ["Subscription Expiry", client?.subscription_end ? new Date(client.subscription_end).toLocaleDateString("en-IN") : "—"],
              ["Grace Period End", client?.grace_end_date ? new Date(client.grace_end_date).toLocaleDateString("en-IN") : "—"],
              ["Permanent Deletion Date", client?.delete_date ? new Date(client.delete_date).toLocaleDateString("en-IN") : "—"],
              ["Account Status", client?.status],
            ].map(([label, val]) => (
              <Box
                key={label}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  py: 1,
                  borderBottom: "1px dashed #F1F5F9",
                }}
              >
                <Typography variant="body2" color={COLORS.textSecondary} fontWeight={500}>
                  {label}
                </Typography>
                <Typography variant="body2" fontWeight={700} color={COLORS.textPrimary}>
                  {val}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Subscription History Table */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "14px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.card,
              overflow: "hidden",
            }}
          >
            <Box sx={{ p: 2.5, borderBottom: `1px solid ${COLORS.border}` }}>
              <Stack direction="row" alignItems="center" spacing={1.2}>
                <HistoryRoundedIcon sx={{ color: COLORS.primary, fontSize: 20 }} />
                <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.95rem" }}>
                  Subscription History
                </Typography>
              </Stack>
            </Box>

            {history.length === 0 ? (
              <Box sx={{ p: 5, textAlign: "center" }}>
                <Typography color={COLORS.textSecondary} variant="body2">No historical renewals found.</Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, py: 1.5 }}>Plan</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>Amount Paid</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>Start Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>End Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.id} hover>
                      <TableCell sx={{ py: 1.5 }}>
                        <Chip label={h.plan_name} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: "0.72rem" }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
                        ₹{Number(h.amount_paid).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell sx={{ color: COLORS.textSecondary }}>
                        {new Date(h.start_date).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell sx={{ color: COLORS.textSecondary }}>
                        {new Date(h.end_date).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell sx={{ color: COLORS.textSecondary }}>{h.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Grid>

        {/* Payment Requests Table */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "14px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.card,
              overflow: "hidden",
            }}
          >
            <Box sx={{ p: 2.5, borderBottom: `1px solid ${COLORS.border}` }}>
              <Stack direction="row" alignItems="center" spacing={1.2}>
                <PaymentRoundedIcon sx={{ color: COLORS.warning, fontSize: 20 }} />
                <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.95rem" }}>
                  Submitted Payment Requests
                </Typography>
              </Stack>
            </Box>

            {payments.length === 0 ? (
              <Box sx={{ p: 5, textAlign: "center" }}>
                <Typography color={COLORS.textSecondary} variant="body2">No payment requests submitted by this client.</Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, py: 1.5 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>UTR Number</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>Payment Note</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>Requested Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, py: 1.5 }}>
                        ₹{Number(p.amount).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell sx={{ color: COLORS.textPrimary, fontWeight: 600 }}>{p.utr_number || "—"}</TableCell>
                      <TableCell sx={{ color: COLORS.textSecondary }}>{p.payment_note || "—"}</TableCell>
                      <TableCell sx={{ color: COLORS.textSecondary }}>
                        {new Date(p.requested_at).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={p.status}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            bgcolor: p.status === "Confirmed" ? COLORS.successSoft : p.status === "Pending" ? COLORS.warningSoft : COLORS.dangerSoft,
                            color: p.status === "Confirmed" ? COLORS.success : p.status === "Pending" ? COLORS.warning : COLORS.danger,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Grid>

        {/* Danger Zone / Delete Client Card */}
        <Grid item xs={12} sx={{ mt: 1 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "14px",
              border: `1px solid ${COLORS.dangerSoft}`,
              p: 3,
              backgroundColor: "#FFF5F5",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 800, color: COLORS.danger, fontSize: "0.95rem" }}>
                Danger Zone — Delete Client
              </Typography>
              <Typography variant="body2" color={COLORS.textSecondary} sx={{ mt: 0.3 }}>
                Permanently drop client database (<strong>{client?.db_name}</strong>) and remove all tenant data. This action cannot be undone.
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteOutlineRoundedIcon />}
              onClick={() => {
                setDeleteInput("");
                setDeleteOpen(true);
              }}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                px: 2.5,
                backgroundColor: COLORS.danger,
                "&:hover": { backgroundColor: "#B91C1C" },
              }}
            >
              Delete Client
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Renew Dialog */}
      <Dialog open={renewOpen} onClose={() => setRenewOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: COLORS.primaryDark }}>
          Renew Subscription — {client?.business_name}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth size="small" sx={{ mt: 1.5, mb: 2 }}>
            <InputLabel>Select Plan</InputLabel>
            <Select
              value={renewForm.plan_id}
              label="Select Plan"
              sx={{ borderRadius: "8px" }}
              onChange={(e) => {
                const sel = plans.find((p) => p.id === e.target.value);
                setRenewForm({
                  ...renewForm,
                  plan_id: e.target.value,
                  amount_paid: sel ? Number(sel.price_monthly) * Number(renewForm.duration_months) : renewForm.amount_paid,
                });
              }}
            >
              {plans.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} — ₹{Number(p.price_monthly).toLocaleString("en-IN")}/mo
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Renewal Duration</InputLabel>
            <Select
              value={renewForm.duration_months}
              label="Renewal Duration"
              sx={{ borderRadius: "8px" }}
              onChange={(e) => {
                const dur = Number(e.target.value);
                const sel = plans.find((p) => p.id === renewForm.plan_id);
                setRenewForm({
                  ...renewForm,
                  duration_months: dur,
                  amount_paid: sel ? Number(sel.price_monthly) * dur : renewForm.amount_paid,
                });
              }}
            >
              <MenuItem value={0.25}>7 Days (Trial)</MenuItem>
              <MenuItem value={1}>1 Month</MenuItem>
              <MenuItem value={3}>3 Months</MenuItem>
              <MenuItem value={6}>6 Months</MenuItem>
              <MenuItem value={12}>12 Months (1 Year)</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Amount Paid (₹)"
            type="number"
            value={renewForm.amount_paid}
            onChange={(e) => setRenewForm({ ...renewForm, amount_paid: e.target.value })}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            InputProps={{ sx: { borderRadius: "8px" } }}
          />

          <TextField
            label="Renewal Notes (optional)"
            value={renewForm.notes}
            onChange={(e) => setRenewForm({ ...renewForm, notes: e.target.value })}
            fullWidth
            size="small"
            multiline
            rows={2}
            InputProps={{ sx: { borderRadius: "8px" } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRenewOpen(false)} sx={{ textTransform: "none", color: COLORS.textSecondary }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRenew}
            disabled={renewLoading}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "8px",
              px: 3,
              backgroundColor: COLORS.success,
              "&:hover": { backgroundColor: "#15803D" },
            }}
          >
            {renewLoading ? <CircularProgress size={18} color="inherit" /> : "Confirm & Extend Subscription"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: COLORS.danger }}>
          Delete Client — {client?.client_code}
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: "8px" }}>
            <Typography variant="subtitle2" fontWeight={700}>
              This will permanently:
            </Typography>
            <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: "0.85rem" }}>
              <li>Delete all client data</li>
              <li>Drop database: <strong>{client?.db_name}</strong></li>
              <li>Remove all leads, users, and settings</li>
            </ul>
            <Typography variant="caption" sx={{ display: "block", mt: 1, fontWeight: 700 }}>
              This action CANNOT be undone.
            </Typography>
          </Alert>

          <Typography variant="body2" sx={{ color: COLORS.textPrimary, mb: 1, fontWeight: 600 }}>
            To confirm, please type <strong>{client?.client_code}</strong> below:
          </Typography>

          <TextField
            fullWidth
            size="small"
            placeholder={client?.client_code}
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            InputProps={{ sx: { borderRadius: "8px" } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} sx={{ textTransform: "none", color: COLORS.textSecondary }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteClient}
            disabled={deleteInput.trim() !== client?.client_code || deleteLoading}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "8px",
              px: 3,
              backgroundColor: COLORS.danger,
              "&:hover": { backgroundColor: "#B91C1C" },
            }}
          >
            {deleteLoading ? <CircularProgress size={18} color="inherit" /> : "Permanently Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientDetail;