import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
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
} from "@mui/material";

// Icons
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";

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
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
};

const Payments = () => {
  const [tab, setTab] = useState(0);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

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
      setPayments(res.data?.data || []);
    } catch (err) {
      setError("Failed to load payments.");
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
      setSnack({ open: true, msg: "Payment confirmed! Client activated & subscription extended.", severity: "success" });
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
      setSnack({ open: true, msg: "Payment rejected.", severity: "warning" });
      setRejectOpen(false);
      fetchPayments();
    } catch (err) {
      setSnack({ open: true, msg: err.response?.data?.message || "Failed to reject payment.", severity: "error" });
    } finally {
      setRejectLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800} color={COLORS.primaryDark}>
          Payment Requests
        </Typography>
        <Typography variant="body2" color={COLORS.textSecondary} sx={{ mt: 0.3 }}>
          Review UPI & bank transfer verification requests submitted by tenants
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: "10px" }}>{error}</Alert>}

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
            "& .MuiTabs-indicator": { backgroundColor: COLORS.primary, height: 3 },
          }}
        >
          <Tab
            label="Pending Review"
            sx={{
              textTransform: "none",
              fontWeight: tab === 0 ? 700 : 500,
              fontSize: "0.88rem",
              color: tab === 0 ? COLORS.primary : COLORS.textSecondary,
            }}
          />
          <Tab
            label="Confirmed"
            sx={{
              textTransform: "none",
              fontWeight: tab === 1 ? 700 : 500,
              fontSize: "0.88rem",
              color: tab === 1 ? COLORS.primary : COLORS.textSecondary,
            }}
          />
          <Tab
            label="Rejected"
            sx={{
              textTransform: "none",
              fontWeight: tab === 2 ? 700 : 500,
              fontSize: "0.88rem",
              color: tab === 2 ? COLORS.primary : COLORS.textSecondary,
            }}
          />
        </Tabs>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 8 }}>
            <CircularProgress size={36} sx={{ color: COLORS.primary }} />
          </Box>
        ) : payments.length === 0 ? (
          <Box sx={{ p: 8, textAlign: "center" }}>
            <AccountBalanceWalletRoundedIcon sx={{ fontSize: 48, color: COLORS.border, mb: 1 }} />
            <Typography sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
              No {statusMap[tab].toLowerCase()} payment requests
            </Typography>
            <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.82rem", mt: 0.5 }}>
              Payment receipts submitted by client admins will appear here.
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, py: 1.6 }}>Client Business</TableCell>
                <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>Plan Requested</TableCell>
                <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>UTR / Transaction ID</TableCell>
                <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>Notes</TableCell>
                <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>Requested Date</TableCell>
                <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>Status</TableCell>
                {tab === 0 && <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, textAlign: "right" }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id || p.request_id} hover sx={{ "&:hover": { backgroundColor: "#F8FAFC" } }}>
                  <TableCell sx={{ py: 1.8 }}>
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
                        {p.business_name?.[0]?.toUpperCase() || "C"}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
                          {p.business_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                          {p.client_code}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={p.plan_name}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.72rem",
                        bgcolor: "rgba(0,91,172,0.06)",
                        color: COLORS.primary,
                        border: "1px solid rgba(0,91,172,0.15)",
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>
                      ₹{Number(p.amount).toLocaleString("en-IN")}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={p.utr_number || "No UTR"}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontWeight: p.utr_number ? 700 : 400,
                        fontSize: "0.72rem",
                        borderColor: COLORS.border,
                      }}
                    />
                  </TableCell>

                  <TableCell sx={{ color: COLORS.textSecondary, fontSize: "0.82rem", maxWidth: 180 }}>
                    {p.payment_note || "—"}
                  </TableCell>

                  <TableCell sx={{ color: COLORS.textSecondary, fontSize: "0.82rem" }}>
                    {new Date(p.requested_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>

                  <TableCell>
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
                      }}
                    />
                  </TableCell>

                  {tab === 0 && (
                    <TableCell sx={{ textAlign: "right" }}>
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<CheckCircleRoundedIcon sx={{ fontSize: 16 }} />}
                          onClick={() => openConfirm(p)}
                          sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            borderRadius: "8px",
                            fontSize: "0.75rem",
                            backgroundColor: COLORS.success,
                            "&:hover": { backgroundColor: "#15803D" },
                          }}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<CancelRoundedIcon sx={{ fontSize: 16 }} />}
                          onClick={() => openReject(p)}
                          sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            borderRadius: "8px",
                            fontSize: "0.75rem",
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
        )}
      </Paper>

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: COLORS.primaryDark }}>Confirm Payment & Activate</DialogTitle>
        <DialogContent>
          <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: "10px", bgcolor: "#F8FAFC", borderColor: COLORS.border }}>
            <Typography variant="body2" color={COLORS.textSecondary} mb={0.5}>
              Client: <strong style={{ color: COLORS.textPrimary }}>{selectedPr?.business_name}</strong>
            </Typography>
            <Typography variant="body2" color={COLORS.textSecondary}>
              Amount: <strong style={{ color: COLORS.success }}>₹{Number(selectedPr?.amount || 0).toLocaleString("en-IN")}</strong>
            </Typography>
          </Paper>

          <TextField
            select
            label="Extend Subscription By"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            fullWidth
            size="small"
            SelectProps={{ native: true }}
            InputProps={{ sx: { borderRadius: "8px" } }}
          >
            <option value={0.25}>7 Days (Trial)</option>
            <option value={1}>1 Month</option>
            <option value={3}>3 Months</option>
            <option value={6}>6 Months</option>
            <option value={12}>12 Months (1 Year)</option>
          </TextField>
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
              "&:hover": { backgroundColor: "#15803D" },
            }}
          >
            {confirmLoading ? <CircularProgress size={18} color="inherit" /> : "Confirm & Activate"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: COLORS.primaryDark }}>Reject Payment Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color={COLORS.textSecondary} mb={2}>
            Rejecting payment for <strong style={{ color: COLORS.textPrimary }}>{selectedPr?.business_name}</strong>
          </Typography>
          <TextField
            label="Rejection Reason (optional)"
            fullWidth
            size="small"
            multiline
            rows={3}
            placeholder="e.g. UTR number not matching bank statement"
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
              "&:hover": { backgroundColor: "#B91C1C" },
            }}
          >
            {rejectLoading ? <CircularProgress size={18} color="inherit" /> : "Reject Request"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} sx={{ borderRadius: "10px" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Payments;