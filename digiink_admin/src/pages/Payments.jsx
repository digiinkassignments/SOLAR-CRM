import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Snackbar,
  Avatar,
  Stack,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

// Icons
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";

import api from "../api/axios";

const COLORS = {
  primary: "#1A73E8",
  primaryDark: "#0B57D0",
  primarySoft: "#E8F0FE",
  bg: "#F8F9FA",
  card: "#FFFFFF",
  border: "#E0E3E7",
  success: "#1E8E3E",
  successSoft: "#E6F4EA",
  danger: "#D93025",
  dangerSoft: "#FCE8E6",
  warning: "#F9AB00",
  warningSoft: "#FEF7E0",
  textPrimary: "#202124",
  textSecondary: "#5F6368",
  textMuted: "#70757A",
};

const Payments = () => {
  const [tab, setTab] = useState(0);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  // Counts for summary metrics
  const [counts, setCounts] = useState({ pending: 0, confirmed: 0, rejected: 0 });

  // Confirm Dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedPr, setSelectedPr] = useState(null);
  const [duration, setDuration] = useState(1);

  // Reject Dialog
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const statusMap = ["Pending", "Confirmed", "Rejected"];

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/payments", {
        params: { status: statusMap[tab] },
      });
      const data = res.data?.data || [];
      setPayments(data);

      // Fetch overview counts if on tab 0
      if (tab === 0) {
        setCounts((prev) => ({ ...prev, pending: data.length }));
      }
    } catch (err) {
      setError("Failed to load payment requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [tab]);

  const openConfirm = (pr) => {
    setSelectedPr(pr);
    setDuration(1);
    setConfirmOpen(true);
  };

  const openReject = (pr) => {
    setSelectedPr(pr);
    setRejectNote("");
    setRejectOpen(true);
  };

  const handleConfirm = async () => {
    setConfirmLoading(true);
    try {
      const prId = selectedPr.id || selectedPr.request_id;
      await api.post(`/payments/${prId}/confirm`, {
        duration_months: duration,
      });
      setSnack({ open: true, msg: "Payment confirmed successfully. Client subscription extended.", severity: "success" });
      setConfirmOpen(false);
      fetchPayments();
    } catch (err) {
      setSnack({ open: true, msg: err.response?.data?.message || "Failed to confirm payment.", severity: "error" });
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleReject = async () => {
    setRejectLoading(true);
    try {
      const prId = selectedPr.id || selectedPr.request_id;
      await api.post(`/payments/${prId}/reject`, {
        rejection_note: rejectNote,
      });
      setSnack({ open: true, msg: "Payment request rejected.", severity: "warning" });
      setRejectOpen(false);
      fetchPayments();
    } catch (err) {
      setSnack({ open: true, msg: err.response?.data?.message || "Failed to reject payment.", severity: "error" });
    } finally {
      setRejectLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800} color={COLORS.primaryDark} letterSpacing="-0.02em">
          Payment Approvals & Audits
        </Typography>
        <Typography variant="body2" color={COLORS.textSecondary} sx={{ mt: 0.3 }}>
          Verify bank wire receipts and UTR numbers submitted by client organization admins
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            onClick={() => setTab(0)}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: `1px solid ${tab === 0 ? COLORS.warning : COLORS.border}`,
              bgcolor: tab === 0 ? COLORS.warningSoft : COLORS.card,
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": { borderColor: COLORS.warning },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 700, textTransform: "uppercase" }}>
                  Pending Review
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: COLORS.warning, mt: 0.5 }}>
                  {tab === 0 ? payments.length : counts.pending}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: COLORS.warningSoft, color: COLORS.warning, width: 44, height: 44 }}>
                <HourglassEmptyRoundedIcon />
              </Avatar>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            onClick={() => setTab(1)}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: `1px solid ${tab === 1 ? COLORS.success : COLORS.border}`,
              bgcolor: tab === 1 ? COLORS.successSoft : COLORS.card,
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": { borderColor: COLORS.success },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 700, textTransform: "uppercase" }}>
                  Confirmed Payments
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: COLORS.success, mt: 0.5 }}>
                  {tab === 1 ? payments.length : "—"}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: COLORS.successSoft, color: COLORS.success, width: 44, height: 44 }}>
                <VerifiedUserRoundedIcon />
              </Avatar>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper
            elevation={0}
            onClick={() => setTab(2)}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: `1px solid ${tab === 2 ? COLORS.danger : COLORS.border}`,
              bgcolor: tab === 2 ? COLORS.dangerSoft : COLORS.card,
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": { borderColor: COLORS.danger },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 700, textTransform: "uppercase" }}>
                  Rejected Requests
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: COLORS.danger, mt: 0.5 }}>
                  {tab === 2 ? payments.length : "—"}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: COLORS.dangerSoft, color: COLORS.danger, width: 44, height: 44 }}>
                <BlockRoundedIcon />
              </Avatar>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs & Table Container */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "14px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.card,
          overflow: "hidden",
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            borderBottom: `1px solid ${COLORS.border}`,
            px: 2,
            bgcolor: COLORS.bg,
            "& .MuiTabs-indicator": { backgroundColor: COLORS.primary, height: 3, borderRadius: "3px 3px 0 0" },
          }}
        >
          <Tab
            label="Pending Review"
            sx={{
              textTransform: "none",
              fontWeight: tab === 0 ? 700 : 500,
              fontSize: "0.88rem",
              color: tab === 0 ? COLORS.primary : COLORS.textSecondary,
              py: 2,
            }}
          />
          <Tab
            label="Confirmed Transactions"
            sx={{
              textTransform: "none",
              fontWeight: tab === 1 ? 700 : 500,
              fontSize: "0.88rem",
              color: tab === 1 ? COLORS.primary : COLORS.textSecondary,
              py: 2,
            }}
          />
          <Tab
            label="Rejected Submissions"
            sx={{
              textTransform: "none",
              fontWeight: tab === 2 ? 700 : 500,
              fontSize: "0.88rem",
              color: tab === 2 ? COLORS.primary : COLORS.textSecondary,
              py: 2,
            }}
          />
        </Tabs>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 8 }}>
            <CircularProgress size={36} sx={{ color: COLORS.primary }} />
          </Box>
        ) : payments.length === 0 ? (
          <Box sx={{ p: 8, textAlign: "center" }}>
            <AccountBalanceWalletRoundedIcon sx={{ fontSize: 52, color: COLORS.textMuted, mb: 1.5, opacity: 0.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
              No {statusMap[tab].toLowerCase()} payment records found
            </Typography>
            <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.85rem", mt: 0.5, maxWidth: 380, mx: "auto" }}>
              When tenant administrators submit transaction receipts, they will be queued here for audit and approval.
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
            <Table sx={{ minWidth: 920 }} size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#F8F9FA" }}>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, py: 1.8, px: 2, fontSize: "0.78rem" }}>Client Organization</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, px: 2, fontSize: "0.78rem" }}>Target Plan</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, px: 2, fontSize: "0.78rem" }}>Amount Paid</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, px: 2, fontSize: "0.78rem" }}>UTR / Transaction Reference</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, px: 2, fontSize: "0.78rem" }}>Notes</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, px: 2, fontSize: "0.78rem" }}>Requested Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, px: 2, fontSize: "0.78rem" }}>Status</TableCell>
                  {tab === 0 && <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, textAlign: "right", px: 2, fontSize: "0.78rem" }}>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id || p.request_id} hover sx={{ "&:hover": { backgroundColor: "#F8F9FA" } }}>
                    <TableCell sx={{ py: 1.8, px: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            backgroundColor: COLORS.primarySoft,
                            color: COLORS.primary,
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            borderRadius: "100px",
                          }}
                        >
                          {p.business_name?.[0]?.toUpperCase() || "C"}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "0.85rem" }}>
                            {p.business_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: COLORS.textMuted, fontSize: "0.72rem" }}>
                            {p.client_code} • {p.subdomain}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ px: 2 }}>
                      <Chip
                        label={p.plan_name}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          bgcolor: COLORS.primarySoft,
                          color: COLORS.primary,
                          borderRadius: "100px",
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ px: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.85rem" }}>
                        ₹{Number(p.amount).toLocaleString("en-IN")}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ px: 2 }}>
                      <Chip
                        label={p.utr_number || "No Reference"}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontWeight: p.utr_number ? 700 : 500,
                          fontSize: "0.72rem",
                          borderColor: COLORS.border,
                          color: p.utr_number ? COLORS.textPrimary : COLORS.textMuted,
                          borderRadius: "100px",
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ color: COLORS.textSecondary, fontSize: "0.82rem", maxWidth: 180, px: 2 }}>
                      {p.payment_note || "—"}
                    </TableCell>

                    <TableCell sx={{ color: COLORS.textSecondary, fontSize: "0.82rem", px: 2 }}>
                      {new Date(p.requested_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>

                    <TableCell sx={{ px: 2 }}>
                      <Chip
                        label={p.status || statusMap[tab]}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          bgcolor:
                            tab === 0 ? COLORS.warningSoft :
                            tab === 1 ? COLORS.successSoft : COLORS.dangerSoft,
                          color:
                            tab === 0 ? COLORS.warning :
                            tab === 1 ? COLORS.success : COLORS.danger,
                          borderRadius: "100px",
                        }}
                      />
                    </TableCell>

                    {tab === 0 && (
                      <TableCell sx={{ textAlign: "right", px: 2, minWidth: 180 }}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="contained"
                            disableElevation
                            startIcon={<CheckCircleRoundedIcon sx={{ fontSize: 16 }} />}
                            onClick={() => openConfirm(p)}
                            sx={{
                              textTransform: "none",
                              fontWeight: 700,
                              borderRadius: "100px",
                              fontSize: "0.75rem",
                              px: 2,
                              backgroundColor: COLORS.success,
                              "&:hover": { backgroundColor: "#15803D" },
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CancelRoundedIcon sx={{ fontSize: 16 }} />}
                            onClick={() => openReject(p)}
                            sx={{
                              textTransform: "none",
                              fontWeight: 700,
                              borderRadius: "100px",
                              fontSize: "0.75rem",
                              px: 1.8,
                              color: COLORS.danger,
                              borderColor: COLORS.danger,
                              "&:hover": { backgroundColor: COLORS.dangerSoft, borderColor: COLORS.danger },
                            }}
                          >
                            Reject
                          </Button>
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Confirm Modal */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: COLORS.primaryDark }}>Approve Payment & Extend Plan</DialogTitle>
        <DialogContent>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: "10px", bgcolor: "#F8FAFC", borderColor: COLORS.border }}>
            <Typography variant="body2" color={COLORS.textSecondary} mb={0.5}>
              Client: <strong style={{ color: COLORS.textPrimary }}>{selectedPr?.business_name}</strong>
            </Typography>
            <Typography variant="body2" color={COLORS.textSecondary}>
              Amount Recorded: <strong style={{ color: COLORS.success }}>₹{Number(selectedPr?.amount || 0).toLocaleString("en-IN")}</strong>
            </Typography>
          </Paper>

          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel id="duration-select-label" sx={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Select Subscription Extension Duration
            </InputLabel>
            <Select
              labelId="duration-select-label"
              id="duration-select"
              value={duration}
              label="Select Subscription Extension Duration"
              onChange={(e) => setDuration(Number(e.target.value))}
              sx={{
                borderRadius: "12px",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "0.88rem",
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    borderRadius: "12px",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  },
                },
              }}
            >
              <MenuItem value={0.25}>7 Days (Trial Extension)</MenuItem>
              <MenuItem value={1}>1 Month Extension</MenuItem>
              <MenuItem value={3}>3 Months Extension</MenuItem>
              <MenuItem value={6}>6 Months Extension</MenuItem>
              <MenuItem value={12}>12 Months (1 Year Extension)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ textTransform: "none", color: COLORS.textSecondary }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={confirmLoading}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "8px",
              px: 3,
              backgroundColor: COLORS.success,
              boxShadow: "none",
              "&:hover": { backgroundColor: "#15803D", boxShadow: "none" },
            }}
          >
            {confirmLoading ? <CircularProgress size={18} color="inherit" /> : "Approve & Activate"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: COLORS.primaryDark }}>Reject Payment Submission</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color={COLORS.textSecondary} mb={2}>
            You are rejecting payment verification for <strong style={{ color: COLORS.textPrimary }}>{selectedPr?.business_name}</strong>.
          </Typography>
          <TextField
            label="Reason for Rejection (Optional)"
            fullWidth
            size="small"
            multiline
            rows={3}
            placeholder="e.g. UTR number not matching bank statement records"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            InputProps={{ sx: { borderRadius: "8px" } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRejectOpen(false)} sx={{ textTransform: "none", color: COLORS.textSecondary }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleReject}
            disabled={rejectLoading}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "8px",
              backgroundColor: COLORS.danger,
              boxShadow: "none",
              "&:hover": { backgroundColor: "#B91C1C", boxShadow: "none" },
            }}
          >
            {rejectLoading ? <CircularProgress size={18} color="inherit" /> : "Confirm Rejection"}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} sx={{ borderRadius: "10px", fontWeight: 600 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Payments;