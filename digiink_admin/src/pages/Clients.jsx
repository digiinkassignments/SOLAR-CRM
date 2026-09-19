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
  TableContainer,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";

// Icons
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DomainOutlinedIcon from "@mui/icons-material/DomainOutlined";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";

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
    <Box sx={{ width: "100%", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: GOOGLE_COLORS.textPrimary,
              letterSpacing: "-0.01em",
              fontSize: "1.35rem",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Tenant Directory & Provisioning
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: GOOGLE_COLORS.textSecondary,
              mt: 0.4,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Manage multi-tenant isolated databases, subscriptions, and subdomains
          </Typography>
        </Box>

        <Button
          variant="contained"
          disableElevation
          startIcon={<AddRoundedIcon sx={{ fontSize: 18 }} />}
          onClick={() => navigate("/clients/new")}
          sx={{
            borderRadius: "100px",
            textTransform: "none",
            fontWeight: 600,
            px: 2.8,
            py: 1.1,
            backgroundColor: GOOGLE_COLORS.blue,
            color: "#FFFFFF",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            "&:hover": { backgroundColor: GOOGLE_COLORS.blueDark },
          }}
        >
          + Add New Client
        </Button>
      </Box>

      {/* Google Search & Filter Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.2,
          mb: 3,
          borderRadius: "20px",
          border: `1px solid ${GOOGLE_COLORS.border}`,
          backgroundColor: GOOGLE_COLORS.card,
        }}
      >
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}
        >
          <TextField
            size="small"
            placeholder="Search tenant name, code, domain, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: "1 1 280px", minWidth: 260 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" sx={{ color: GOOGLE_COLORS.textMuted }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: "100px",
                backgroundColor: GOOGLE_COLORS.bg,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "0.85rem",
                "& fieldset": { borderColor: GOOGLE_COLORS.border },
                "&:hover fieldset": { borderColor: "#BDC1C6" },
                "&.Mui-focused fieldset": { borderColor: GOOGLE_COLORS.blue, borderWidth: "2px" },
              },
            }}
          />

          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel sx={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Subscription Status</InputLabel>
            <Select
              value={status}
              label="Subscription Status"
              onChange={(e) => setStatus(e.target.value)}
              sx={{
                borderRadius: "12px",
                backgroundColor: GOOGLE_COLORS.bg,
                fontSize: "0.85rem",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
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
            <InputLabel sx={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Plan Tier</InputLabel>
            <Select
              value={planId}
              label="Plan Tier"
              onChange={(e) => setPlanId(e.target.value)}
              sx={{
                borderRadius: "12px",
                backgroundColor: GOOGLE_COLORS.bg,
                fontSize: "0.85rem",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
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
            disableElevation
            size="medium"
            startIcon={<FilterListRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: "100px",
              textTransform: "none",
              fontWeight: 600,
              px: 2.4,
              backgroundColor: GOOGLE_COLORS.blue,
              color: "#FFFFFF",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              "&:hover": { backgroundColor: GOOGLE_COLORS.blueDark },
            }}
          >
            Apply Filters
          </Button>

          {(search || status || planId) && (
            <Button
              variant="outlined"
              size="medium"
              startIcon={<ClearRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={handleResetFilters}
              sx={{
                borderRadius: "100px",
                textTransform: "none",
                fontWeight: 600,
                color: GOOGLE_COLORS.textSecondary,
                borderColor: GOOGLE_COLORS.border,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                "&:hover": { backgroundColor: GOOGLE_COLORS.bg, borderColor: "#BDC1C6" },
              }}
            >
              Clear
            </Button>
          )}
        </Box>
      </Paper>

      {/* Clients Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "20px",
          border: `1px solid ${GOOGLE_COLORS.border}`,
          backgroundColor: GOOGLE_COLORS.card,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: 2.2,
            borderBottom: `1px solid ${GOOGLE_COLORS.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <DomainOutlinedIcon sx={{ color: GOOGLE_COLORS.blue, fontSize: 22 }} />
            <Typography sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, fontSize: "0.98rem" }}>
              Active Tenant Accounts
            </Typography>
          </Stack>
          <Typography sx={{ color: GOOGLE_COLORS.textSecondary, fontSize: "0.82rem", fontWeight: 600 }}>
            {clients.length} Tenant{clients.length === 1 ? "" : "s"} Listed
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 8 }}>
            <CircularProgress size={36} sx={{ color: GOOGLE_COLORS.blue }} />
          </Box>
        ) : clients.length === 0 ? (
          <Box sx={{ p: 8, textAlign: "center" }}>
            <PeopleAltOutlinedIcon sx={{ fontSize: 48, color: GOOGLE_COLORS.border, mb: 1.5 }} />
            <Typography sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, fontSize: "1rem" }}>
              No tenant instances found
            </Typography>
            <Typography sx={{ color: GOOGLE_COLORS.textSecondary, fontSize: "0.85rem", mt: 0.5 }}>
              Try adjusting your filter query or provision a new tenant.
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 980 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#F8F9FA" }}>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, py: 1.8, px: 2, fontSize: "0.78rem" }}>Tenant Code</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 2, fontSize: "0.78rem" }}>Business Instance</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 2, fontSize: "0.78rem" }}>Subdomain Endpoint</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 2, fontSize: "0.78rem" }}>Plan Tier</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 2, fontSize: "0.78rem" }}>Subscription Expiry</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 2, fontSize: "0.78rem" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 2, textAlign: "right", fontSize: "0.78rem" }}>Actions</TableCell>
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
                        "&:hover": { backgroundColor: "#F8F9FA" },
                        cursor: "pointer",
                        transition: "background-color 0.15s ease",
                      }}
                      onClick={() => navigate(`/clients/${c.id}`)}
                    >
                      <TableCell sx={{ py: 1.8, px: 2 }}>
                        <Chip
                          label={c.client_code}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            bgcolor: GOOGLE_COLORS.blueSoft,
                            color: GOOGLE_COLORS.blue,
                            border: `1px solid #D2E3FC`,
                            borderRadius: "100px",
                          }}
                        />
                      </TableCell>

                      <TableCell sx={{ px: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              backgroundColor: GOOGLE_COLORS.blueSoft,
                              color: GOOGLE_COLORS.blue,
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              borderRadius: "100px",
                            }}
                          >
                            {c.business_name?.[0]?.toUpperCase() || "C"}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, fontSize: "0.85rem" }}>
                              {c.business_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: GOOGLE_COLORS.textSecondary, fontSize: "0.72rem" }}>
                              {c.email || c.owner_name}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ px: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={0.6}>
                          <LanguageRoundedIcon sx={{ fontSize: 15, color: GOOGLE_COLORS.textMuted }} />
                          <Typography variant="body2" sx={{ color: GOOGLE_COLORS.textPrimary, fontWeight: 600, fontSize: "0.82rem" }}>
                            {c.subdomain}
                          </Typography>
                          <Typography variant="caption" sx={{ color: GOOGLE_COLORS.textMuted, fontSize: "0.72rem" }}>
                            .solarcrm.com
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell sx={{ px: 2 }}>
                        <Chip
                          label={c.plan_name || "Custom"}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.72rem",
                            bgcolor: GOOGLE_COLORS.bg,
                            border: `1px solid ${GOOGLE_COLORS.border}`,
                            color: GOOGLE_COLORS.textPrimary,
                            borderRadius: "100px",
                          }}
                        />
                      </TableCell>

                      <TableCell sx={{ px: 2 }}>
                        <Typography variant="body2" sx={{ color: GOOGLE_COLORS.textPrimary, fontWeight: 500, fontSize: "0.82rem" }}>
                          {c.subscription_end
                            ? new Date(c.subscription_end).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ px: 2 }}>
                        <Chip
                          label={c.status}
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
                      </TableCell>

                      <TableCell sx={{ textAlign: "right", px: 2, minWidth: 140 }}>
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
                              borderRadius: "100px",
                              textTransform: "none",
                              fontWeight: 600,
                              fontSize: "0.78rem",
                              px: 1.8,
                              color: GOOGLE_COLORS.blue,
                              borderColor: GOOGLE_COLORS.border,
                              "&:hover": { borderColor: GOOGLE_COLORS.blue, backgroundColor: GOOGLE_COLORS.blueSoft },
                            }}
                          >
                            Details
                          </Button>

                          {c.status !== "Deleted" && (
                            <Tooltip title="Delete Client Tenant">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedClientToDelete(c);
                                  setDeleteInput("");
                                }}
                                sx={{
                                  borderRadius: "100px",
                                  border: `1px solid ${GOOGLE_COLORS.redSoft}`,
                                  bgcolor: GOOGLE_COLORS.redSoft,
                                  color: GOOGLE_COLORS.red,
                                  "&:hover": { bgcolor: "#FAD2CF", borderColor: GOOGLE_COLORS.red },
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
          </TableContainer>
        )}
      </Paper>

      {/* Delete Client Dialog */}
      <Dialog
        open={Boolean(selectedClientToDelete)}
        onClose={() => setSelectedClientToDelete(null)}
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
        <DialogTitle sx={{ fontWeight: 700, color: GOOGLE_COLORS.red, fontSize: "1.15rem" }}>
          Deprovision Tenant — {selectedClientToDelete?.client_code}
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
            <Typography variant="subtitle2" fontWeight={700}>
              Destructive Operation Warning:
            </Typography>
            <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: "0.85rem" }}>
              <li>Permanently deletes all tenant organization records</li>
              <li>Drops dedicated database instance: <strong>{selectedClientToDelete?.db_name}</strong></li>
              <li>Revokes all user credentials and access keys</li>
            </ul>
            <Typography variant="caption" sx={{ display: "block", mt: 1, fontWeight: 700 }}>
              This operation CANNOT be reverted.
            </Typography>
          </Alert>

          <Typography variant="body2" sx={{ color: GOOGLE_COLORS.textPrimary, mb: 1.2, fontWeight: 600 }}>
            To confirm deprovisioning, type <strong>{selectedClientToDelete?.client_code}</strong> below:
          </Typography>

          <TextField
            fullWidth
            size="small"
            placeholder={selectedClientToDelete?.client_code}
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
          <Button
            onClick={() => setSelectedClientToDelete(null)}
            sx={{ textTransform: "none", color: GOOGLE_COLORS.textSecondary, borderRadius: "100px", px: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={handleConfirmDelete}
            disabled={deleteInput.trim() !== selectedClientToDelete?.client_code || deleteLoading}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "100px",
              px: 3,
              backgroundColor: GOOGLE_COLORS.red,
              color: "#FFFFFF",
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

export default Clients;