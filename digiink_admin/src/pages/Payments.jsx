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
  Card,
  CardContent,
  Divider,
} from "@mui/material";

// Icons
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
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

const Payments = () => {
  const [tab, setTab] = useState(0);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

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
      const [currRes, pendingRes, confirmedRes, rejectedRes] = await Promise.all([
        api.get("/payments", { params: { status: statusMap[tab] } }),
        api.get("/payments", { params: { status: "Pending" } }),
        api.get("/payments", { params: { status: "Confirmed" } }),
        api.get("/payments", { params: { status: "Rejected" } }),
      ]);
      setPayments(currRes.data?.data || []);
      setCounts({
        pending: pendingRes.data?.data?.length || 0,
        confirmed: confirmedRes.data?.data?.length || 0,
        rejected: rejectedRes.data?.data?.length || 0,
      });
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
    <Box sx={{ width: "100%", fontFamily: "'Plus Jakarta Sans', sans-serif", pb: 4 }}>
      {/* ── Top Header ────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: GOOGLE_COLORS.textPrimary,
            fontSize: "1.35rem",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Payment Approvals & Billing Verification
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: GOOGLE_COLORS.textSecondary,
            mt: 0.4,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Audit client bank wire transfers, verify transaction UTR references, and confirm subscription renewals
        </Typography>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: "16px",
            bgcolor: GOOGLE_COLORS.redSoft,
            color: GOOGLE_COLORS.red,
            border: `1px solid #FAD2CF`,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {error}
        </Alert>
      )}

      {/* ── 3 Exact Google Stat Cards ─────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={4}>
          <Card
            elevation={0}
            onClick={() => setTab(0)}
            sx={{
              height: "100%",
              borderRadius: "16px",
              border: `1px solid ${tab === 0 ? GOOGLE_COLORS.yellow : GOOGLE_COLORS.border}`,
              backgroundColor: tab === 0 ? GOOGLE_COLORS.yellowSoft : GOOGLE_COLORS.card,
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                borderColor: GOOGLE_COLORS.yellow,
              },
            }}
          >
            <CardContent sx={{ p: 2.2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.2 }}>
                <Typography
                  sx={{
                    color: GOOGLE_COLORS.textSecondary,
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Pending Review
                </Typography>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "100px",
                    backgroundColor: GOOGLE_COLORS.yellowSoft,
                    color: GOOGLE_COLORS.yellow,
                  }}
                >
                  <HourglassEmptyRoundedIcon sx={{ fontSize: 20 }} />
                </Avatar>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: GOOGLE_COLORS.yellow,
                  lineHeight: 1.1,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {counts.pending}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: GOOGLE_COLORS.textSecondary,
                  mt: 0.6,
                  display: "block",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Awaiting manual bank reconciliation
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card
            elevation={0}
            onClick={() => setTab(1)}
            sx={{
              height: "100%",
              borderRadius: "16px",
              border: `1px solid ${tab === 1 ? GOOGLE_COLORS.green : GOOGLE_COLORS.border}`,
              backgroundColor: tab === 1 ? GOOGLE_COLORS.greenSoft : GOOGLE_COLORS.card,
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                borderColor: GOOGLE_COLORS.green,
              },
            }}
          >
            <CardContent sx={{ p: 2.2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.2 }}>
                <Typography
                  sx={{
                    color: GOOGLE_COLORS.textSecondary,
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Confirmed Payments
                </Typography>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "100px",
                    backgroundColor: GOOGLE_COLORS.greenSoft,
                    color: GOOGLE_COLORS.green,
                  }}
                >
                  <VerifiedUserRoundedIcon sx={{ fontSize: 20 }} />
                </Avatar>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: GOOGLE_COLORS.green,
                  lineHeight: 1.1,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {counts.confirmed}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: GOOGLE_COLORS.textSecondary,
                  mt: 0.6,
                  display: "block",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Approved and extended subscriptions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card
            elevation={0}
            onClick={() => setTab(2)}
            sx={{
              height: "100%",
              borderRadius: "16px",
              border: `1px solid ${tab === 2 ? GOOGLE_COLORS.red : GOOGLE_COLORS.border}`,
              backgroundColor: tab === 2 ? GOOGLE_COLORS.redSoft : GOOGLE_COLORS.card,
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                borderColor: GOOGLE_COLORS.red,
              },
            }}
          >
            <CardContent sx={{ p: 2.2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.2 }}>
                <Typography
                  sx={{
                    color: GOOGLE_COLORS.textSecondary,
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Rejected Requests
                </Typography>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "100px",
                    backgroundColor: GOOGLE_COLORS.redSoft,
                    color: GOOGLE_COLORS.red,
                  }}
                >
                  <BlockRoundedIcon sx={{ fontSize: 20 }} />
                </Avatar>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: GOOGLE_COLORS.red,
                  lineHeight: 1.1,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {counts.rejected}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: GOOGLE_COLORS.textSecondary,
                  mt: 0.6,
                  display: "block",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Invalid transaction or declined proofs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Table & Navigation Container ───────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "20px",
          border: `1px solid ${GOOGLE_COLORS.border}`,
          backgroundColor: GOOGLE_COLORS.card,
          overflow: "hidden",
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            borderBottom: `1px solid ${GOOGLE_COLORS.border}`,
            px: 2,
            bgcolor: "#F8F9FA",
            "& .MuiTabs-indicator": { backgroundColor: GOOGLE_COLORS.blue, height: 3, borderRadius: "3px 3px 0 0" },
          }}
        >
          <Tab
            label={`Pending Review (${counts.pending})`}
            sx={{
              textTransform: "none",
              fontWeight: tab === 0 ? 700 : 500,
              fontSize: "0.85rem",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: tab === 0 ? GOOGLE_COLORS.blue : GOOGLE_COLORS.textSecondary,
              py: 2,
            }}
          />
          <Tab
            label={`Confirmed Transactions (${counts.confirmed})`}
            sx={{
              textTransform: "none",
              fontWeight: tab === 1 ? 700 : 500,
              fontSize: "0.85rem",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: tab === 1 ? GOOGLE_COLORS.blue : GOOGLE_COLORS.textSecondary,
              py: 2,
            }}
          />
          <Tab
            label={`Rejected Submissions (${counts.rejected})`}
            sx={{
              textTransform: "none",
              fontWeight: tab === 2 ? 700 : 500,
              fontSize: "0.85rem",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: tab === 2 ? GOOGLE_COLORS.blue : GOOGLE_COLORS.textSecondary,
              py: 2,
            }}
          />
        </Tabs>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 8 }}>
            <CircularProgress size={36} sx={{ color: GOOGLE_COLORS.blue }} />
          </Box>
        ) : payments.length === 0 ? (
          <Box sx={{ p: 8, textAlign: "center" }}>
            <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 52, color: GOOGLE_COLORS.border, mb: 1.5 }} />
            <Typography sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, fontSize: "1rem" }}>
              No {statusMap[tab].toLowerCase()} payment records found
            </Typography>
            <Typography sx={{ color: GOOGLE_COLORS.textSecondary, fontSize: "0.85rem", mt: 0.5, maxWidth: 400, mx: "auto" }}>
              When tenant administrators submit transaction receipts, they will be queued here for audit and approval.
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
            <Table sx={{ minWidth: 960 }} size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#F8F9FA" }}>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, py: 1.8, px: 2, fontSize: "0.78rem" }}>Client Organization</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 2, fontSize: "0.78rem" }}>Target Plan</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 2, fontSize: "0.78rem" }}>Amount Paid</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 2, fontSize: "0.78rem" }}>UTR Reference</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 2, fontSize: "0.78rem" }}>Notes</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 2, fontSize: "0.78rem" }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 2, fontSize: "0.78rem" }}>Status</TableCell>
                  {tab === 0 && <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, textAlign: "right", px: 2, fontSize: "0.78rem" }}>Actions</TableCell>}
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
                            backgroundColor: GOOGLE_COLORS.blueSoft,
                            color: GOOGLE_COLORS.blue,
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            borderRadius: "100px",
                          }}
                        >
                          {p.business_name?.[0]?.toUpperCase() || "C"}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, fontSize: "0.85rem" }}>
                            {p.business_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: GOOGLE_COLORS.textSecondary, fontSize: "0.72rem" }}>
                            {p.client_code} • {p.subdomain}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ px: 2 }}>
                      <Chip
                        label={p.plan_name || "Starter"}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          bgcolor: GOOGLE_COLORS.blueSoft,
                          color: GOOGLE_COLORS.blue,
                          borderRadius: "100px",
                          border: `1px solid #D2E3FC`,
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ px: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, fontSize: "0.85rem" }}>
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
                          borderColor: GOOGLE_COLORS.border,
                          color: p.utr_number ? GOOGLE_COLORS.textPrimary : GOOGLE_COLORS.textMuted,
                          borderRadius: "100px",
                          fontFamily: "monospace",
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ color: GOOGLE_COLORS.textSecondary, fontSize: "0.82rem", maxWidth: 180, px: 2 }}>
                      {p.payment_note || "—"}
                    </TableCell>

                    <TableCell sx={{ color: GOOGLE_COLORS.textSecondary, fontSize: "0.82rem", px: 2 }}>
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
                            tab === 0 ? GOOGLE_COLORS.yellowSoft :
                            tab === 1 ? GOOGLE_COLORS.greenSoft : GOOGLE_COLORS.redSoft,
                          color:
                            tab === 0 ? GOOGLE_COLORS.yellow :
                            tab === 1 ? GOOGLE_COLORS.green : GOOGLE_COLORS.red,
                          border: `1px solid ${tab === 0 ? "#FDE293" : tab === 1 ? "#CEEAD6" : "#FAD2CF"}`,
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
                              py: 0.6,
                              backgroundColor: GOOGLE_COLORS.green,
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
                              py: 0.6,
                              color: GOOGLE_COLORS.red,
                              borderColor: "#FAD2CF",
                              backgroundColor: GOOGLE_COLORS.redSoft,
                              "&:hover": { backgroundColor: "#FAD2CF", borderColor: GOOGLE_COLORS.red },
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

      {/* ── Confirm Modal ───────────────────────────────────────── */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "20px",
            p: 1.5,
            border: `1px solid ${GOOGLE_COLORS.border}`,
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, fontSize: "1.15rem", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Approve Payment & Extend Plan
        </DialogTitle>
        <DialogContent>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: "14px",
              bgcolor: GOOGLE_COLORS.bg,
              border: `1px solid ${GOOGLE_COLORS.border}`,
            }}
          >
            <Typography variant="body2" color={GOOGLE_COLORS.textSecondary} mb={0.5} sx={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Client: <strong style={{ color: GOOGLE_COLORS.textPrimary }}>{selectedPr?.business_name}</strong>
            </Typography>
            <Typography variant="body2" color={GOOGLE_COLORS.textSecondary} sx={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Amount Recorded: <strong style={{ color: GOOGLE_COLORS.green }}>₹{Number(selectedPr?.amount || 0).toLocaleString("en-IN")}</strong>
            </Typography>
          </Paper>

          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel id="duration-select-label" sx={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Select Subscription Duration
            </InputLabel>
            <Select
              labelId="duration-select-label"
              id="duration-select"
              value={duration}
              label="Select Subscription Duration"
              onChange={(e) => setDuration(Number(e.target.value))}
              sx={{
                borderRadius: "12px",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "0.88rem",
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
          <Button onClick={() => setConfirmOpen(false)} sx={{ textTransform: "none", color: GOOGLE_COLORS.textSecondary, borderRadius: "100px", px: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={handleConfirm}
            disabled={confirmLoading}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "100px",
              px: 3,
              backgroundColor: GOOGLE_COLORS.green,
              color: "#FFFFFF",
              "&:hover": { backgroundColor: "#15803D" },
            }}
          >
            {confirmLoading ? <CircularProgress size={18} color="inherit" /> : "Approve & Activate"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Reject Modal ────────────────────────────────────────── */}
      <Dialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "20px",
            p: 1.5,
            border: `1px solid ${GOOGLE_COLORS.border}`,
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: GOOGLE_COLORS.red, fontSize: "1.15rem", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Reject Payment Submission
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color={GOOGLE_COLORS.textSecondary} mb={2} sx={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            You are rejecting payment verification for <strong style={{ color: GOOGLE_COLORS.textPrimary }}>{selectedPr?.business_name}</strong>.
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
            InputProps={{
              sx: {
                borderRadius: "12px",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRejectOpen(false)} sx={{ textTransform: "none", color: GOOGLE_COLORS.textSecondary, borderRadius: "100px", px: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={handleReject}
            disabled={rejectLoading}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "100px",
              px: 3,
              backgroundColor: GOOGLE_COLORS.red,
              color: "#FFFFFF",
              "&:hover": { backgroundColor: "#B91C1C" },
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
        <Alert severity={snack.severity} sx={{ borderRadius: "12px", fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Payments;