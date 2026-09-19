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
  TableContainer,
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
  Tooltip,
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
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DnsOutlinedIcon from "@mui/icons-material/DnsOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";

import api from "../api/axios";

const GOOGLE_COLORS = {
  blue: "#1A73E8",
  blueDark: "#0B57D0",
  blueSoft: "#E8F0FE",
  green: "#1E8E3E",
  greenSoft: "#E6F4EA",
  red: "#D93025",
  redSoft: "#FCE8E6",
  yellow: "#F9AB00",
  yellowSoft: "#FEF7E0",
  orange: "#E37400",
  orangeSoft: "#FEF3D6",
  bg: "#F8F9FA",
  card: "#FFFFFF",
  border: "#E0E3E7",
  textPrimary: "#202124",
  textSecondary: "#5F6368",
  textMuted: "#70757A",
};

const STATUS_CONFIG = {
  Active: { bg: GOOGLE_COLORS.greenSoft, color: GOOGLE_COLORS.green, border: "#CEEAD6" },
  "Expiring Soon": { bg: GOOGLE_COLORS.yellowSoft, color: GOOGLE_COLORS.yellow, border: "#FEF0C7" },
  "Grace Period": { bg: GOOGLE_COLORS.orangeSoft, color: GOOGLE_COLORS.orange, border: "#FDE293" },
  Locked: { bg: GOOGLE_COLORS.redSoft, color: GOOGLE_COLORS.red, border: "#FAD2CF" },
  Deleted: { bg: "#F1F3F4", color: GOOGLE_COLORS.textMuted, border: "#DADCE0" },
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
    if (!window.confirm(`Are you sure you want to ${newStatus === "Active" ? "activate" : "lock"} this client instance?`)) return;
    try {
      await api.patch(`/clients/${id}/status`, { status: newStatus });
      setSuccess(`Client marked as ${newStatus}.`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Status update failed.");
    }
  };

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
      setError(err.response?.data?.message || "Client deprovisioning failed.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="65vh">
        <CircularProgress size={38} sx={{ color: GOOGLE_COLORS.blue }} />
      </Box>
    );
  }

  const client = data?.client;
  const history = data?.history || [];
  const payments = data?.payments || [];
  const sConf = STATUS_CONFIG[client?.status] || STATUS_CONFIG.Deleted;

  // Days until expiry
  let daysLeft = null;
  if (client?.subscription_end) {
    const end = new Date(client.subscription_end);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    daysLeft = diff;
  }

  return (
    <Box sx={{ width: "100%", fontFamily: "'Plus Jakarta Sans', sans-serif", pb: 4 }}>
      {/* ── Top Google Cloud Console Hero Banner ────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mb: 3,
          borderRadius: "24px",
          backgroundColor: GOOGLE_COLORS.card,
          border: `1px solid ${GOOGLE_COLORS.border}`,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2.5 }}>
          {/* Left: Back & Instance Info */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: "1 1 480px" }}>
            <IconButton
              onClick={() => navigate("/clients")}
              sx={{
                bgcolor: GOOGLE_COLORS.bg,
                border: `1px solid ${GOOGLE_COLORS.border}`,
                color: GOOGLE_COLORS.textSecondary,
                borderRadius: "100px",
                width: 44,
                height: 44,
                "&:hover": { bgcolor: "#E8EAED", color: GOOGLE_COLORS.textPrimary },
              }}
            >
              <ArrowBackRoundedIcon fontSize="small" />
            </IconButton>

            <Avatar
              sx={{
                width: 52,
                height: 52,
                backgroundColor: GOOGLE_COLORS.blueSoft,
                color: GOOGLE_COLORS.blue,
                fontSize: "1.2rem",
                fontWeight: 800,
                borderRadius: "100px",
                border: `1px solid #D2E3FC`,
              }}
            >
              {client?.business_name?.[0]?.toUpperCase() || "C"}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1.2} flexWrap="wrap" sx={{ mb: 0.5 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: GOOGLE_COLORS.textPrimary,
                    fontSize: "1.4rem",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {client?.business_name}
                </Typography>
                <Chip
                  label={client?.client_code}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    bgcolor: GOOGLE_COLORS.blueSoft,
                    color: GOOGLE_COLORS.blue,
                    border: `1px solid #D2E3FC`,
                    borderRadius: "100px",
                  }}
                />
                <Chip
                  label={client?.status}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    bgcolor: sConf.bg,
                    color: sConf.color,
                    border: `1px solid ${sConf.border}`,
                    borderRadius: "100px",
                  }}
                />
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" sx={{ rowGap: 0.5 }}>
                <Typography variant="body2" sx={{ color: GOOGLE_COLORS.textSecondary, fontSize: "0.83rem", fontWeight: 500 }}>
                  Database: <strong style={{ color: GOOGLE_COLORS.textPrimary }}>{client?.db_name}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: GOOGLE_COLORS.textMuted, fontSize: "0.83rem" }}>•</Typography>
                <Stack direction="row" alignItems="center" spacing={0.4}>
                  <Typography variant="body2" sx={{ color: GOOGLE_COLORS.textSecondary, fontSize: "0.83rem", fontWeight: 500 }}>
                    Endpoint:
                  </Typography>
                  <Box
                    component="a"
                    href={`https://${client?.subdomain}.solarcrm.com`}
                    target="_blank"
                    rel="noreferrer"
                    sx={{
                      color: GOOGLE_COLORS.blue,
                      fontWeight: 700,
                      fontSize: "0.83rem",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.4,
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    {client?.subdomain}.solarcrm.com
                    <OpenInNewRoundedIcon sx={{ fontSize: 13 }} />
                  </Box>
                </Stack>
              </Stack>
            </Box>
          </Stack>

          {/* Right: Actions */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="contained"
              disableElevation
              startIcon={<RefreshRoundedIcon sx={{ fontSize: 18 }} />}
              onClick={() => setRenewOpen(true)}
              sx={{
                borderRadius: "100px",
                textTransform: "none",
                fontWeight: 700,
                px: 2.8,
                py: 1,
                fontSize: "0.88rem",
                backgroundColor: GOOGLE_COLORS.green,
                color: "#FFFFFF",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                "&:hover": { backgroundColor: "#15803D" },
              }}
            >
              Renew Subscription
            </Button>

            <Button
              variant="outlined"
              startIcon={client?.status === "Locked" ? <LockOpenRoundedIcon sx={{ fontSize: 18 }} /> : <LockOutlinedIcon sx={{ fontSize: 18 }} />}
              onClick={handleStatusToggle}
              sx={{
                borderRadius: "100px",
                textTransform: "none",
                fontWeight: 700,
                px: 2.4,
                py: 1,
                fontSize: "0.88rem",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: client?.status === "Locked" ? GOOGLE_COLORS.green : GOOGLE_COLORS.red,
                borderColor: client?.status === "Locked" ? GOOGLE_COLORS.green : GOOGLE_COLORS.red,
                "&:hover": {
                  borderColor: client?.status === "Locked" ? GOOGLE_COLORS.green : GOOGLE_COLORS.red,
                  backgroundColor: client?.status === "Locked" ? GOOGLE_COLORS.greenSoft : GOOGLE_COLORS.redSoft,
                },
              }}
            >
              {client?.status === "Locked" ? "Unlock Access" : "Lock Instance"}
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Alerts */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: "16px",
            bgcolor: GOOGLE_COLORS.redSoft,
            color: GOOGLE_COLORS.red,
            border: `1px solid #FAD2CF`,
            "& .MuiAlert-icon": { color: GOOGLE_COLORS.red },
          }}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{
            mb: 3,
            borderRadius: "16px",
            bgcolor: GOOGLE_COLORS.greenSoft,
            color: GOOGLE_COLORS.green,
            border: `1px solid #CEEAD6`,
            "& .MuiAlert-icon": { color: GOOGLE_COLORS.green },
          }}
        >
          {success}
        </Alert>
      )}

      {/* ── 4 KPI Metric Summary Cards ────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: "18px",
              border: `1px solid ${GOOGLE_COLORS.border}`,
              backgroundColor: GOOGLE_COLORS.card,
            }}
          >
            <Typography variant="caption" sx={{ color: GOOGLE_COLORS.textMuted, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              ACTIVE PLAN TIER
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.8 }}>
              <Typography variant="h6" fontWeight={800} color={GOOGLE_COLORS.textPrimary}>
                {client?.plan_name || "Custom Tier"}
              </Typography>
              <Chip
                label={`₹${Number(client?.price_monthly || 0).toLocaleString("en-IN")}/mo`}
                size="small"
                sx={{ bgcolor: GOOGLE_COLORS.blueSoft, color: GOOGLE_COLORS.blue, fontWeight: 700, borderRadius: "100px" }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: "18px",
              border: `1px solid ${GOOGLE_COLORS.border}`,
              backgroundColor: GOOGLE_COLORS.card,
            }}
          >
            <Typography variant="caption" sx={{ color: GOOGLE_COLORS.textMuted, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              SYSTEM STATUS
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.8 }}>
              <Typography variant="h6" fontWeight={800} color={sConf.color}>
                {client?.status}
              </Typography>
              <ShieldOutlinedIcon sx={{ color: sConf.color, fontSize: 24 }} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: "18px",
              border: `1px solid ${GOOGLE_COLORS.border}`,
              backgroundColor: GOOGLE_COLORS.card,
            }}
          >
            <Typography variant="caption" sx={{ color: GOOGLE_COLORS.textMuted, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              SUBSCRIPTION EXPIRY
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.8 }}>
              <Typography variant="h6" fontWeight={800} color={GOOGLE_COLORS.textPrimary}>
                {client?.subscription_end ? new Date(client.subscription_end).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
              </Typography>
              {daysLeft !== null && (
                <Chip
                  label={`${daysLeft}d left`}
                  size="small"
                  sx={{
                    bgcolor: daysLeft <= 7 ? GOOGLE_COLORS.yellowSoft : GOOGLE_COLORS.greenSoft,
                    color: daysLeft <= 7 ? GOOGLE_COLORS.yellow : GOOGLE_COLORS.green,
                    fontWeight: 700,
                    borderRadius: "100px",
                  }}
                />
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: "18px",
              border: `1px solid ${GOOGLE_COLORS.border}`,
              backgroundColor: GOOGLE_COLORS.card,
            }}
          >
            <Typography variant="caption" sx={{ color: GOOGLE_COLORS.textMuted, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              ISOLATED DATABASE
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.8 }}>
              <Typography variant="h6" fontWeight={800} color={GOOGLE_COLORS.blue}>
                {client?.db_name}
              </Typography>
              <DnsOutlinedIcon sx={{ color: GOOGLE_COLORS.blue, fontSize: 24 }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ── 2-Column Main Details Profile Cards ────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Left Card: Organization & Technical Profile */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "20px",
              border: `1px solid ${GOOGLE_COLORS.border}`,
              backgroundColor: GOOGLE_COLORS.card,
              overflow: "hidden",
              height: "100%",
            }}
          >
            <Box sx={{ p: 2.5, borderBottom: `1px solid ${GOOGLE_COLORS.border}`, display: "flex", alignItems: "center", gap: 1.2 }}>
              <Box sx={{ width: 4, height: 20, borderRadius: "4px", backgroundColor: GOOGLE_COLORS.blue }} />
              <BusinessRoundedIcon sx={{ color: GOOGLE_COLORS.blue, fontSize: 22 }} />
              <Typography sx={{ fontWeight: 800, color: GOOGLE_COLORS.textPrimary, fontSize: "1.02rem" }}>
                Tenant Organization Profile
              </Typography>
            </Box>

            <Box sx={{ p: 2.5 }}>
              <DetailRow icon={<BusinessRoundedIcon />} label="Business Name" value={client?.business_name} />
              <DetailRow icon={<BadgeOutlinedIcon />} label="Tenant Code" value={<Chip label={client?.client_code} size="small" sx={{ fontWeight: 700, bgcolor: GOOGLE_COLORS.blueSoft, color: GOOGLE_COLORS.blue, borderRadius: "100px" }} />} />
              <DetailRow icon={<BadgeOutlinedIcon />} label="Primary Owner / Contact" value={client?.owner_name} />
              <DetailRow icon={<EmailOutlinedIcon />} label="Email Address" value={<Box component="a" href={`mailto:${client?.email}`} sx={{ color: GOOGLE_COLORS.blue, fontWeight: 600, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>{client?.email}</Box>} />
              <DetailRow icon={<PhoneOutlinedIcon />} label="Phone Number" value={client?.phone || "—"} />
              <DetailRow icon={<LocationOnOutlinedIcon />} label="Location" value={`${client?.city || "—"}, ${client?.state || "—"}`} />
              <DetailRow
                icon={<OpenInNewRoundedIcon />}
                label="App Subdomain Route"
                value={
                  <Box
                    component="a"
                    href={`https://${client?.subdomain}.solarcrm.com`}
                    target="_blank"
                    rel="noreferrer"
                    sx={{ color: GOOGLE_COLORS.blue, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 0.5, "&:hover": { textDecoration: "underline" } }}
                  >
                    https://{client?.subdomain}.solarcrm.com
                  </Box>
                }
              />
              <DetailRow icon={<DnsOutlinedIcon />} label="MySQL Dedicated DB" value={client?.db_name} isLast />
            </Box>
          </Paper>
        </Grid>

        {/* Right Card: Subscription Lifecycle & Expiry Audit */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: "20px",
              border: `1px solid ${GOOGLE_COLORS.border}`,
              backgroundColor: GOOGLE_COLORS.card,
              overflow: "hidden",
              height: "100%",
            }}
          >
            <Box sx={{ p: 2.5, borderBottom: `1px solid ${GOOGLE_COLORS.border}`, display: "flex", alignItems: "center", gap: 1.2 }}>
              <Box sx={{ width: 4, height: 20, borderRadius: "4px", backgroundColor: GOOGLE_COLORS.green }} />
              <CardMembershipRoundedIcon sx={{ color: GOOGLE_COLORS.green, fontSize: 22 }} />
              <Typography sx={{ fontWeight: 800, color: GOOGLE_COLORS.textPrimary, fontSize: "1.02rem" }}>
                Subscription Lifecycle & Billing
              </Typography>
            </Box>

            <Box sx={{ p: 2.5 }}>
              <DetailRow icon={<CardMembershipRoundedIcon />} label="Active Plan Tier" value={client?.plan_name || "Custom"} />
              <DetailRow icon={<AccountBalanceWalletOutlinedIcon />} label="Monthly Subscription Price" value={`₹${Number(client?.price_monthly || 0).toLocaleString("en-IN")}/month`} />
              <DetailRow icon={<CalendarTodayOutlinedIcon />} label="Subscription Start Date" value={client?.subscription_start ? new Date(client.subscription_start).toLocaleDateString("en-IN") : "—"} />
              <DetailRow icon={<CalendarTodayOutlinedIcon />} label="Subscription Expiry Date" value={client?.subscription_end ? new Date(client.subscription_end).toLocaleDateString("en-IN") : "—"} />
              <DetailRow icon={<CalendarTodayOutlinedIcon />} label="Grace Period Expiry Date" value={client?.grace_end_date ? new Date(client.grace_end_date).toLocaleDateString("en-IN") : "—"} />
              <DetailRow icon={<CalendarTodayOutlinedIcon />} label="Permanent Deletion Date" value={client?.delete_date ? new Date(client.delete_date).toLocaleDateString("en-IN") : "—"} />
              <DetailRow icon={<ShieldOutlinedIcon />} label="Account Status" value={<Chip label={client?.status} size="small" sx={{ fontWeight: 700, bgcolor: sConf.bg, color: sConf.color, border: `1px solid ${sConf.border}`, borderRadius: "100px" }} />} isLast />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ── Section 1: Subscription Renewal Audit Logs ─────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: "20px",
          border: `1px solid ${GOOGLE_COLORS.border}`,
          backgroundColor: GOOGLE_COLORS.card,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2.5, borderBottom: `1px solid ${GOOGLE_COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <HistoryRoundedIcon sx={{ color: GOOGLE_COLORS.blue, fontSize: 22 }} />
            <Typography sx={{ fontWeight: 800, color: GOOGLE_COLORS.textPrimary, fontSize: "1.02rem" }}>
              Subscription Renewal Audit Logs
            </Typography>
          </Stack>
          <Chip label={`${history.length} Logs`} size="small" sx={{ fontWeight: 700, bgcolor: GOOGLE_COLORS.blueSoft, color: GOOGLE_COLORS.blue, borderRadius: "100px" }} />
        </Box>

        {history.length === 0 ? (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <HistoryRoundedIcon sx={{ fontSize: 44, color: GOOGLE_COLORS.textMuted, opacity: 0.5, mb: 1 }} />
            <Typography color={GOOGLE_COLORS.textSecondary} variant="body2" fontWeight={600}>
              No historical renewal audit logs recorded for this tenant instance.
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#F8F9FA" }}>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, py: 1.8, px: 2.5, fontSize: "0.78rem" }}>Plan Tier</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 2.5, fontSize: "0.78rem" }}>Amount Paid</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 2.5, fontSize: "0.78rem" }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 2.5, fontSize: "0.78rem" }}>End Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 2.5, fontSize: "0.78rem" }}>Audit Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id} hover sx={{ "&:hover": { backgroundColor: "#F8F9FA" } }}>
                    <TableCell sx={{ py: 1.8, px: 2.5 }}>
                      <Chip
                        label={h.plan_name}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          bgcolor: GOOGLE_COLORS.blueSoft,
                          color: GOOGLE_COLORS.blue,
                          borderRadius: "100px",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: GOOGLE_COLORS.textPrimary, px: 2.5, fontSize: "0.88rem" }}>
                      ₹{Number(h.amount_paid).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell sx={{ color: GOOGLE_COLORS.textSecondary, px: 2.5, fontSize: "0.83rem" }}>
                      {new Date(h.start_date).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell sx={{ color: GOOGLE_COLORS.textSecondary, px: 2.5, fontSize: "0.83rem" }}>
                      {new Date(h.end_date).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell sx={{ color: GOOGLE_COLORS.textSecondary, px: 2.5, fontSize: "0.83rem" }}>{h.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ── Section 2: Submitted Payment Evidence & Proofs ──────────────────── */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: "20px",
          border: `1px solid ${GOOGLE_COLORS.border}`,
          backgroundColor: GOOGLE_COLORS.card,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2.5, borderBottom: `1px solid ${GOOGLE_COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <PaymentRoundedIcon sx={{ color: GOOGLE_COLORS.yellow, fontSize: 22 }} />
            <Typography sx={{ fontWeight: 800, color: GOOGLE_COLORS.textPrimary, fontSize: "1.02rem" }}>
              Submitted Payment Evidence & Bank Receipts
            </Typography>
          </Stack>
          <Chip label={`${payments.length} Requests`} size="small" sx={{ fontWeight: 700, bgcolor: GOOGLE_COLORS.yellowSoft, color: GOOGLE_COLORS.yellow, borderRadius: "100px" }} />
        </Box>

        {payments.length === 0 ? (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <PaymentRoundedIcon sx={{ fontSize: 44, color: GOOGLE_COLORS.textMuted, opacity: 0.5, mb: 1 }} />
            <Typography color={GOOGLE_COLORS.textSecondary} variant="body2" fontWeight={600}>
              No payment verification requests submitted by this tenant organization.
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#F8F9FA" }}>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, py: 1.8, px: 2.5, fontSize: "0.78rem" }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 2.5, fontSize: "0.78rem" }}>UTR Reference Number</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 2.5, fontSize: "0.78rem" }}>Payment Remark</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 2.5, fontSize: "0.78rem" }}>Submitted On</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 2.5, fontSize: "0.78rem" }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id} hover sx={{ "&:hover": { backgroundColor: "#F8F9FA" } }}>
                    <TableCell sx={{ fontWeight: 800, color: GOOGLE_COLORS.textPrimary, py: 1.8, px: 2.5, fontSize: "0.88rem" }}>
                      ₹{Number(p.amount).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell sx={{ color: GOOGLE_COLORS.textPrimary, px: 2.5, fontWeight: 700, fontSize: "0.83rem" }}>
                      <Chip label={p.utr_number || "No Reference"} size="small" variant="outlined" sx={{ fontWeight: 700, borderRadius: "100px" }} />
                    </TableCell>
                    <TableCell sx={{ color: GOOGLE_COLORS.textSecondary, px: 2.5, fontSize: "0.83rem" }}>{p.payment_note || "—"}</TableCell>
                    <TableCell sx={{ color: GOOGLE_COLORS.textSecondary, px: 2.5, fontSize: "0.83rem" }}>
                      {new Date(p.requested_at).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell sx={{ px: 2.5 }}>
                      <Chip
                        label={p.status}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          bgcolor: p.status === "Confirmed" ? GOOGLE_COLORS.greenSoft : p.status === "Pending" ? GOOGLE_COLORS.yellowSoft : GOOGLE_COLORS.redSoft,
                          color: p.status === "Confirmed" ? GOOGLE_COLORS.green : p.status === "Pending" ? GOOGLE_COLORS.yellow : GOOGLE_COLORS.red,
                          borderRadius: "100px",
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ── Section 3: Danger Zone / Delete Instance ───────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "24px",
          border: `1px solid ${GOOGLE_COLORS.redSoft}`,
          p: { xs: 3, sm: 3.5 },
          backgroundColor: GOOGLE_COLORS.redSoft,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2.5,
        }}
      >
        <Box sx={{ maxWidth: 680 }}>
          <Typography sx={{ fontWeight: 800, color: GOOGLE_COLORS.red, fontSize: "1.08rem" }}>
            Danger Zone — Deprovision Tenant Instance
          </Typography>
          <Typography variant="body2" color={GOOGLE_COLORS.textSecondary} sx={{ mt: 0.6, fontSize: "0.85rem", lineHeight: 1.4 }}>
            Permanently drop dedicated MySQL database (<strong>{client?.db_name}</strong>), delete organization records, and revoke subdomains. This operation cannot be undone.
          </Typography>
        </Box>
        <Button
          variant="contained"
          disableElevation
          color="error"
          startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 19 }} />}
          onClick={() => {
            setDeleteInput("");
            setDeleteOpen(true);
          }}
          sx={{
            borderRadius: "100px",
            textTransform: "none",
            fontWeight: 700,
            px: 3.2,
            py: 1.1,
            fontSize: "0.88rem",
            backgroundColor: GOOGLE_COLORS.red,
            color: "#FFFFFF",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            "&:hover": { backgroundColor: "#B2221A" },
          }}
        >
          Deprovision Tenant
        </Button>
      </Paper>

      {/* ── Dialog 1: Extend Subscription ─────────────────────────────────── */}
      <Dialog
        open={renewOpen}
        onClose={() => setRenewOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "24px",
            p: 1.5,
            border: `1px solid ${GOOGLE_COLORS.border}`,
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: GOOGLE_COLORS.textPrimary, fontSize: "1.15rem" }}>
          Extend Subscription — {client?.business_name}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth size="small" sx={{ mt: 1.5, mb: 2 }}>
            <InputLabel sx={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Select Plan</InputLabel>
            <Select
              value={renewForm.plan_id}
              label="Select Plan"
              sx={{
                borderRadius: "12px",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
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
            <InputLabel sx={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Renewal Duration</InputLabel>
            <Select
              value={renewForm.duration_months}
              label="Renewal Duration"
              sx={{
                borderRadius: "12px",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
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
              <MenuItem value={0.25}>7 Days (Trial Extension)</MenuItem>
              <MenuItem value={1}>1 Month Extension</MenuItem>
              <MenuItem value={3}>3 Months Extension</MenuItem>
              <MenuItem value={6}>6 Months Extension</MenuItem>
              <MenuItem value={12}>12 Months (1 Year Extension)</MenuItem>
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
            InputProps={{
              sx: {
                borderRadius: "12px",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              },
            }}
          />

          <TextField
            label="Renewal Audit Notes (optional)"
            value={renewForm.notes}
            onChange={(e) => setRenewForm({ ...renewForm, notes: e.target.value })}
            fullWidth
            size="small"
            multiline
            rows={2}
            placeholder="e.g. Bank Wire receipt verified by Super Admin"
            InputProps={{
              sx: {
                borderRadius: "12px",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRenewOpen(false)} sx={{ textTransform: "none", color: GOOGLE_COLORS.textSecondary, borderRadius: "100px", px: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={handleRenew}
            disabled={renewLoading}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "100px",
              px: 3,
              backgroundColor: GOOGLE_COLORS.green,
              color: "#FFFFFF",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              "&:hover": { backgroundColor: "#15803D" },
            }}
          >
            {renewLoading ? <CircularProgress size={18} color="inherit" /> : "Confirm Extension"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog 2: Deprovision Confirmation ───────────────────────────── */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "24px",
            p: 1.5,
            border: `1px solid ${GOOGLE_COLORS.border}`,
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: GOOGLE_COLORS.red, fontSize: "1.15rem" }}>
          Deprovision Tenant — {client?.client_code}
        </DialogTitle>
        <DialogContent>
          <Alert
            severity="error"
            sx={{
              mb: 2.5,
              borderRadius: "16px",
              bgcolor: GOOGLE_COLORS.redSoft,
              color: GOOGLE_COLORS.red,
              border: `1px solid ${STATUS_CONFIG.Locked.border}`,
              "& .MuiAlert-icon": { color: GOOGLE_COLORS.red },
            }}
          >
            <Typography variant="subtitle2" fontWeight={800}>
              Destructive Operation Warning:
            </Typography>
            <ul style={{ margin: "6px 0 0 16px", padding: 0, fontSize: "0.85rem" }}>
              <li>Permanently deletes all tenant organization records</li>
              <li>Drops dedicated database instance: <strong>{client?.db_name}</strong></li>
              <li>Revokes all user credentials and subdomain access</li>
            </ul>
            <Typography variant="caption" sx={{ display: "block", mt: 1, fontWeight: 800 }}>
              This operation CANNOT be reverted.
            </Typography>
          </Alert>

          <Typography variant="body2" sx={{ color: GOOGLE_COLORS.textPrimary, mb: 1.2, fontWeight: 600 }}>
            To confirm deprovisioning, type <strong>{client?.client_code}</strong> below:
          </Typography>

          <TextField
            fullWidth
            size="small"
            placeholder={client?.client_code}
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            InputProps={{
              sx: {
                borderRadius: "12px",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "0.88rem",
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} sx={{ textTransform: "none", color: GOOGLE_COLORS.textSecondary, borderRadius: "100px", px: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={handleDeleteClient}
            disabled={deleteInput.trim() !== client?.client_code || deleteLoading}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "100px",
              px: 3,
              backgroundColor: GOOGLE_COLORS.red,
              color: "#FFFFFF",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              "&:hover": { backgroundColor: "#B2221A" },
            }}
          >
            {deleteLoading ? <CircularProgress size={18} color="inherit" /> : "Permanently Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Helper component for structured detail rows
const DetailRow = ({ icon, label, value, isLast }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      py: 1.3,
      px: 0.5,
      borderBottom: isLast ? "none" : "1px solid #F1F3F4",
      gap: 2,
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1.2} sx={{ minWidth: 180, flexShrink: 0 }}>
      {React.cloneElement(icon, { sx: { fontSize: 17, color: GOOGLE_COLORS.textMuted } })}
      <Typography variant="body2" sx={{ color: GOOGLE_COLORS.textSecondary, fontWeight: 500, fontSize: "0.84rem" }}>
        {label}
      </Typography>
    </Stack>
    <Typography
      component="div"
      variant="body2"
      sx={{
        color: GOOGLE_COLORS.textPrimary,
        fontWeight: 600,
        fontSize: "0.86rem",
        textAlign: "right",
        wordBreak: "break-all",
      }}
    >
      {value}
    </Typography>
  </Box>
);

export default ClientDetail;