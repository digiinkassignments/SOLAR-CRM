import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  IconButton,
  Tooltip,
  InputAdornment,
  Avatar,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";

// Icons
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
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

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [planId, setPlanId] = useState("");
  const [plans, setPlans] = useState([]);

  // Delete modal state
  const [selectedClientToDelete, setSelectedClientToDelete] = useState(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleConfirmDelete = async () => {
    if (!selectedClientToDelete || deleteInput.trim() !== selectedClientToDelete.client_code) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/clients/${selectedClientToDelete.id}`);
      setSelectedClientToDelete(null);
      setDeleteInput("");
      fetchClients();
    } catch (err) {
      console.error("Delete client error:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      if (planId) params.plan_id = planId;
      const res = await api.get("/clients", { params });
      setClients(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get("/plans").then((r) => setPlans(r.data?.data || []));
  }, []);

  useEffect(() => {
    fetchClients();
  }, [status, planId]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchClients();
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatus("");
    setPlanId("");
  };

  return (
    <Box>
      {/* Top Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} color={COLORS.primaryDark} sx={{ letterSpacing: "-0.01em" }}>
            Client Management
          </Typography>
          <Typography variant="body2" color={COLORS.textSecondary} sx={{ mt: 0.3 }}>
            Manage isolated tenant databases, client subscriptions, and domains
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => navigate("/clients/new")}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 700,
            px: 2.5,
            py: 1,
            backgroundColor: COLORS.primary,
            "&:hover": { backgroundColor: "#0A6FD8" },
            boxShadow: "0 4px 12px rgba(0,91,172,0.25)",
          }}
        >
          Create New Client
        </Button>
      </Box>

      {/* Filter Card */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: "14px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.card,
        }}
      >
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}
        >
          <TextField
            size="small"
            placeholder="Search business, code, email, domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: "1 1 260px", minWidth: 240 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" sx={{ color: COLORS.textMuted }} />
                </InputAdornment>
              ),
              sx: { borderRadius: "8px" },
            }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Subscription Status</InputLabel>
            <Select
              value={status}
              label="Subscription Status"
              onChange={(e) => setStatus(e.target.value)}
              sx={{ borderRadius: "8px" }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Expiring Soon">Expiring Soon</MenuItem>
              <MenuItem value="Grace Period">Grace Period</MenuItem>
              <MenuItem value="Locked">Locked</MenuItem>
              <MenuItem value="Deleted">Deleted</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Plan</InputLabel>
            <Select
              value={planId}
              label="Plan"
              onChange={(e) => setPlanId(e.target.value)}
              sx={{ borderRadius: "8px" }}
            >
              <MenuItem value="">All Plans</MenuItem>
              {plans.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            type="submit"
            variant="contained"
            size="medium"
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 700,
              px: 2.2,
              backgroundColor: COLORS.primaryDark,
              "&:hover": { backgroundColor: "#06243F" },
            }}
          >
            Filter
          </Button>

          {(search || status || planId) && (
            <Button
              variant="outlined"
              size="medium"
              startIcon={<ClearRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={handleResetFilters}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                color: COLORS.textSecondary,
                borderColor: COLORS.border,
              }}
            >
              Reset
            </Button>
          )}
        </Box>
      </Paper>

      {/* Clients Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "14px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.card,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <PeopleAltOutlinedIcon sx={{ color: COLORS.primary, fontSize: 20 }} />
            <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.95rem" }}>
              Registered Clients
            </Typography>
          </Stack>
          <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.78rem", fontWeight: 600 }}>
            {clients.length} Client{clients.length === 1 ? "" : "s"} Found
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 8 }}>
            <CircularProgress size={36} sx={{ color: COLORS.primary }} />
          </Box>
        ) : clients.length === 0 ? (
          <Box sx={{ p: 8, textAlign: "center" }}>
            <PeopleAltOutlinedIcon sx={{ fontSize: 48, color: COLORS.border, mb: 1 }} />
            <Typography sx={{ fontWeight: 700, color: COLORS.textPrimary }}>No clients found</Typography>
            <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.82rem", mt: 0.5 }}>
              Try adjusting your search criteria or add a new client.
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, py: 1.6 }}>Client Code</TableCell>
                <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>Business Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>Subdomain</TableCell>
                <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>Plan</TableCell>
                <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>Subscription Expiry</TableCell>
                <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, textAlign: "right" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((c) => {
                const sConf = STATUS_CONFIG[c.status] || STATUS_CONFIG.Deleted;

                return (
                  <TableRow
                    key={c.id}
                    hover
                    sx={{
                      "&:hover": { backgroundColor: "#F8FAFC" },
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                    }}
                    onClick={() => navigate(`/clients/${c.id}`)}
                  >
                    <TableCell sx={{ py: 1.8 }}>
                      <Chip
                        label={c.client_code}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.75rem",
                          bgcolor: "rgba(0,91,172,0.08)",
                          color: COLORS.primary,
                          border: "1px solid rgba(0,91,172,0.2)",
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            backgroundColor: COLORS.primarySoft,
                            color: COLORS.primary,
                            fontSize: "0.82rem",
                            fontWeight: 700,
                          }}
                        >
                          {c.business_name?.[0]?.toUpperCase() || "C"}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
                            {c.business_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                            {c.email || c.owner_name}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={0.6}>
                        <LanguageRoundedIcon sx={{ fontSize: 14, color: COLORS.textMuted }} />
                        <Typography variant="body2" sx={{ color: COLORS.textPrimary, fontWeight: 500 }}>
                          {c.subdomain}
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.textMuted }}>
                          .solarcrm.com
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={c.plan_name || "Custom"}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.72rem",
                          borderColor: COLORS.border,
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ color: COLORS.textPrimary, fontWeight: 500 }}>
                        {c.subscription_end
                          ? new Date(c.subscription_end).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={c.status}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          bgcolor: sConf.bg,
                          color: sConf.color,
                          border: `1px solid ${sConf.border}`,
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ textAlign: "right" }}>
                      <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                        <Button
                          size="small"
                          variant="outlined"
                          endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/clients/${c.id}`);
                          }}
                          sx={{
                            borderRadius: "8px",
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            color: COLORS.primary,
                            borderColor: COLORS.border,
                            "&:hover": { borderColor: COLORS.primary, backgroundColor: "rgba(0,91,172,0.04)" },
                          }}
                        >
                          Manage
                        </Button>

                        {c.status !== "Deleted" && (
                          <Tooltip title="Delete Client">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClientToDelete(c);
                                setDeleteInput("");
                              }}
                              sx={{
                                borderRadius: "8px",
                                border: `1px solid ${COLORS.dangerSoft}`,
                                bgcolor: COLORS.dangerSoft,
                                color: COLORS.danger,
                                "&:hover": { bgcolor: "#FEE2E2", borderColor: COLORS.danger },
                              }}
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Delete Client Dialog */}
      <Dialog
        open={Boolean(selectedClientToDelete)}
        onClose={() => setSelectedClientToDelete(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: COLORS.danger }}>
          Delete Client — {selectedClientToDelete?.client_code}
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: "8px" }}>
            <Typography variant="subtitle2" fontWeight={700}>
              This will permanently:
            </Typography>
            <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: "0.85rem" }}>
              <li>Delete all client data</li>
              <li>Drop database: <strong>{selectedClientToDelete?.db_name}</strong></li>
              <li>Remove all leads, users, and settings</li>
            </ul>
            <Typography variant="caption" sx={{ display: "block", mt: 1, fontWeight: 700 }}>
              This action CANNOT be undone.
            </Typography>
          </Alert>

          <Typography variant="body2" sx={{ color: COLORS.textPrimary, mb: 1, fontWeight: 600 }}>
            To confirm, please type <strong>{selectedClientToDelete?.client_code}</strong> below:
          </Typography>

          <TextField
            fullWidth
            size="small"
            placeholder={selectedClientToDelete?.client_code}
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            InputProps={{ sx: { borderRadius: "8px" } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setSelectedClientToDelete(null)}
            sx={{ textTransform: "none", color: COLORS.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteInput.trim() !== selectedClientToDelete?.client_code || deleteLoading}
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

export default Clients;