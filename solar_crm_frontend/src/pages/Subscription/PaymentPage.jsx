// ============================================================
// PAYMENT PAGE — LOCK PAGE (Clean & Professional)
// Client account lock / subscription expiry page
// ============================================================

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Divider,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Stack,
  Container,
  Grid,
} from "@mui/material";

// Icons
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import { useAuth } from "../../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL;

const THEME = {
  primary: "#005BAC",
  primaryDark: "#0B3A63",
  primarySoft: "#EFF6FF",
  danger: "#DC2626",
  dangerDark: "#991B1B",
  dangerSoft: "#FEF2F2",
  success: "#16A34A",
  successSoft: "#F0FDF4",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#64748B",
  border: "#E2E8F0",
  bg: "#F8FAFC",
};

const PaymentPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [utr, setUtr] = useState("");
  const [note, setNote] = useState("");
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const redirectToDashboardOrLogin = (status) => {
    localStorage.setItem("subscription_status", status || "Active");
    if (token && user) {
      const role = (user?.role_name || user?.role || "").toLowerCase();
      if (role.includes("manager")) {
        navigate("/manager/dashboard", { replace: true });
      } else if (role.includes("sales")) {
        navigate("/sales/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } else {
      navigate("/", { replace: true });
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const authToken = localStorage.getItem("token") || "";
        const res = await axios.get(`${API}/subscription/status`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });

        if (!isMounted) return;
        const subData = res.data.data;
        setData(subData);

        if (subData?.status && subData.status !== "Locked" && subData.status !== "Deleted") {
          setIsActivated(true);
          setSnack({ open: true, msg: "Payment confirmed. Your account is active. Redirecting...", severity: "success" });
          setTimeout(() => {
            if (isMounted) redirectToDashboardOrLogin(subData.status);
          }, 1500);
          return;
        }

        const prRes = await axios.get(`${API}/subscription/payment-status`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        if (isMounted && prRes.data.data?.status === "Pending") {
          setSubmitted(true);
        }
      } catch (err) {
        console.error("Subscription poll error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStatus();

    const interval = setInterval(fetchStatus, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, user, navigate]);

  const handleSubmitPayment = async () => {
    setSubmitting(true);
    try {
      await axios.post(
        `${API}/subscription/payment-request`,
        { utr_number: utr, payment_note: note },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } }
      );
      setSubmitted(true);
      setSnack({ open: true, msg: "Payment request submitted successfully. Verification in progress.", severity: "success" });
    } catch (err) {
      setSnack({ open: true, msg: err?.response?.data?.message || "Failed to submit request.", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysUntilDelete = () => {
    if (!data?.delete_date) return null;
    const diff = Math.ceil((new Date(data.delete_date) - new Date()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor={THEME.bg}>
        <CircularProgress size={40} sx={{ color: THEME.primary }} />
      </Box>
    );
  }

  const pd = data?.payment_details || {};
  const plan = data?.plan || {};
  const daysLeft = getDaysUntilDelete();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: THEME.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 5,
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            borderRadius: "16px",
            border: `1px solid ${THEME.border}`,
            bgcolor: "#FFFFFF",
            overflow: "hidden",
            boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
          }}
        >
          {/* Header Card */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${THEME.dangerDark} 0%, ${THEME.danger} 100%)`,
              p: 4,
              textAlign: "center",
              color: "#FFFFFF",
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                bgcolor: "rgba(255, 255, 255, 0.15)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1.5,
                backdropFilter: "blur(4px)",
              }}
            >
              <LockResetRoundedIcon sx={{ fontSize: 34, color: "#FFFFFF" }} />
            </Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">
              Account Temporarily Locked
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5, maxWidth: 440, mx: "auto" }}>
              Your subscription plan period has ended. Please settle the due amount to reactivate access immediately.
            </Typography>
          </Box>

          <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
            {/* Deletion Warning Banner */}
            {daysLeft !== null && (
              <Alert
                severity="error"
                icon={<WarningAmberRoundedIcon sx={{ color: THEME.danger }} />}
                sx={{
                  mb: 3,
                  borderRadius: "12px",
                  bgcolor: THEME.dangerSoft,
                  border: `1px solid rgba(220, 38, 38, 0.2)`,
                  color: THEME.dangerDark,
                  "& .MuiAlert-message": { fontSize: "0.85rem" },
                }}
              >
                Data retention limit: <strong>{daysLeft} day(s) remaining</strong> before permanent account purge. Renew today to preserve your records.
              </Alert>
            )}

            {/* Plan Due Card */}
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: "12px",
                borderColor: THEME.border,
                bgcolor: THEME.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: THEME.textMuted, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                  Subscription Due
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: THEME.textPrimary }}>
                  {plan.name || "Standard Plan"}
                </Typography>
              </Box>
              <Chip
                icon={<CreditCardRoundedIcon sx={{ fontSize: "16px !important", color: `${THEME.primary} !important` }} />}
                label={`₹${Number(plan.price_monthly || 0).toLocaleString("en-IN")} / month`}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  bgcolor: THEME.primarySoft,
                  color: THEME.primary,
                  border: `1px solid rgba(0, 91, 172, 0.2)`,
                  py: 0.5,
                }}
              />
            </Paper>

            {/* Bank Details */}
            {(pd.bank_account_number || pd.upi_id) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: THEME.textPrimary, display: "flex", alignItems: "center", gap: 1 }}>
                  <AccountBalanceRoundedIcon sx={{ fontSize: 20, color: THEME.primary }} />
                  Official Bank & Wire Transfer Details
                </Typography>

                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "12px", borderColor: THEME.border, bgcolor: "#FFFFFF" }}>
                  <Stack spacing={1.2}>
                    {pd.bank_account_name && <DetailRow label="Account Name" value={pd.bank_account_name} />}
                    {pd.bank_account_number && <DetailRow label="Account Number" value={pd.bank_account_number} bold />}
                    {pd.bank_ifsc && <DetailRow label="IFSC Code" value={pd.bank_ifsc} bold />}
                    {pd.bank_name && <DetailRow label="Bank Name" value={`${pd.bank_name}${pd.bank_branch ? ` (${pd.bank_branch})` : ""}`} />}

                    {pd.upi_id && (
                      <>
                        <Divider sx={{ my: 1, borderColor: THEME.border }} />
                        <DetailRow label="UPI VPA Handle" value={pd.upi_id} bold color={THEME.primary} />
                        <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1, color: THEME.textSecondary }}>
                          <QrCode2RoundedIcon sx={{ fontSize: 20, color: THEME.textMuted }} />
                          <Typography variant="caption" sx={{ color: THEME.textMuted }}>
                            Scan QR code with any UPI app (GPay, PhonePe, Paytm)
                          </Typography>
                        </Box>
                        {pd.upi_qr_image && (
                          <Box sx={{ mt: 1.5, textAlign: "center" }}>
                            <Box
                              component="img"
                              src={`${API.replace("/api", "")}/uploads/qr/${pd.upi_qr_image}`}
                              alt="UPI QR Code"
                              sx={{
                                width: 160,
                                height: 160,
                                borderRadius: "10px",
                                border: `1px solid ${THEME.border}`,
                                p: 1,
                                bgcolor: "#FFFFFF",
                              }}
                            />
                          </Box>
                        )}
                      </>
                    )}
                  </Stack>
                </Paper>
              </Box>
            )}

            <Divider sx={{ my: 3, borderColor: THEME.border }} />

            {/* Payment Verification Form */}
            {submitted ? (
              <Alert
                icon={<CheckCircleRoundedIcon sx={{ color: THEME.success }} />}
                sx={{
                  borderRadius: "12px",
                  bgcolor: THEME.successSoft,
                  border: `1px solid rgba(22, 163, 74, 0.2)`,
                  color: THEME.success,
                  py: 1.5,
                }}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  Payment Request Logged
                </Typography>
                <Typography variant="body2" sx={{ color: THEME.textSecondary, mt: 0.3 }}>
                  Our accounts team is verifying your transaction. Your portal will unlock automatically once confirmed.
                </Typography>
              </Alert>
            ) : (
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: THEME.textPrimary }}>
                  Submit Transaction Details
                </Typography>
                <TextField
                  label="UTR / Transaction Reference Number"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  size="small"
                  fullWidth
                  sx={{ mb: 2 }}
                  placeholder="e.g. 4268XXXXXXXX or UPI Ref ID"
                  InputProps={{ sx: { borderRadius: "8px" } }}
                />
                <TextField
                  label="Additional Reference Note (Optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  sx={{ mb: 2.5 }}
                  placeholder="Mention payment bank or depositor name if applicable"
                  InputProps={{ sx: { borderRadius: "8px" } }}
                />
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSubmitPayment}
                  disabled={submitting}
                  startIcon={!submitting && <SendRoundedIcon />}
                  sx={{
                    borderRadius: "10px",
                    fontWeight: 700,
                    py: 1.4,
                    fontSize: "0.92rem",
                    textTransform: "none",
                    bgcolor: THEME.success,
                    "&:hover": { bgcolor: "#15803D" },
                    boxShadow: "0 4px 6px -1px rgba(22, 163, 74, 0.2)",
                  }}
                >
                  {submitting ? <CircularProgress size={22} color="inherit" /> : "Submit Payment for Verification"}
                </Button>
              </Box>
            )}

            {/* Support Desk */}
            {(pd.support_phone || pd.support_email || pd.support_whatsapp) && (
              <>
                <Divider sx={{ my: 3, borderColor: THEME.border }} />
                <Box sx={{ p: 2, borderRadius: "10px", bgcolor: THEME.bg, border: `1px solid ${THEME.border}` }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                    <SupportAgentRoundedIcon sx={{ fontSize: 22, color: THEME.primary }} />
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: THEME.textPrimary }}>
                      Billing & Accounts Support
                    </Typography>
                  </Box>

                  <Grid container spacing={1.5}>
                    {pd.support_phone && (
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: THEME.textSecondary }}>
                          <PhoneRoundedIcon sx={{ fontSize: 16, color: THEME.textMuted }} />
                          <Typography variant="caption" fontWeight={600}>{pd.support_phone}</Typography>
                        </Box>
                      </Grid>
                    )}
                    {pd.support_email && (
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: THEME.textSecondary }}>
                          <EmailRoundedIcon sx={{ fontSize: 16, color: THEME.textMuted }} />
                          <Typography variant="caption" fontWeight={600}>{pd.support_email}</Typography>
                        </Box>
                      </Grid>
                    )}
                    {pd.support_whatsapp && (
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: THEME.textSecondary }}>
                          <WhatsAppIcon sx={{ fontSize: 16, color: "#25D366" }} />
                          <Typography variant="caption" fontWeight={600}>{pd.support_whatsapp}</Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </>
            )}
          </Box>
        </Paper>
      </Container>

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
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

const DetailRow = ({ label, value, bold, color }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <Typography variant="body2" sx={{ color: THEME.textMuted, fontSize: "0.82rem" }}>
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        fontWeight: bold ? 700 : 500,
        color: color || THEME.textPrimary,
        fontSize: "0.85rem",
      }}
    >
      {value}
    </Typography>
  </Box>
);

export default PaymentPage;

