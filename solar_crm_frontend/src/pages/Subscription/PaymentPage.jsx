// ============================================================
// PAYMENT PAGE — LOCK PAGE
// Client ka account lock hone par sirf yeh page dikhega
// Koi aur page/dashboard access nahi hoga
//
// File location: src/pages/Subscription/PaymentPage.jsx
// ============================================================

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box, Typography, Paper, Divider, TextField, Button,
  Chip, CircularProgress, Alert, Snackbar, Avatar,
  Stack,
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import QrCodeIcon         from "@mui/icons-material/QrCode";
import SupportAgentIcon   from "@mui/icons-material/SupportAgent";
import CheckCircleIcon    from "@mui/icons-material/CheckCircle";
import WarningAmberIcon   from "@mui/icons-material/WarningAmber";
import { useAuth }        from "../../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL;

const PaymentPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [utr,        setUtr]        = useState("");
  const [note,       setNote]       = useState("");
  const [snack,      setSnack]      = useState({ open: false, msg: "", severity: "success" });

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

  // Subscription status + payment details fetch & auto-polling
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

        // Agar account Super Admin ne activate kar diya hai
        if (subData?.status && subData.status !== "Locked" && subData.status !== "Deleted") {
          setIsActivated(true);
          setSnack({ open: true, msg: "Payment confirmed! Your account is active. Redirecting...", severity: "success" });
          setTimeout(() => {
            if (isMounted) redirectToDashboardOrLogin(subData.status);
          }, 1500);
          return;
        }

        // Previous payment request check
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

    // Poll every 4 seconds for Super Admin confirmation
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
      setSnack({ open: true, msg: "Payment request submitted! We will verify and activate your account shortly.", severity: "success" });
    } catch (err) {
      setSnack({ open: true, msg: err?.response?.data?.message || "Something went wrong.", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // Days until delete
  const getDaysUntilDelete = () => {
    if (!data?.delete_date) return null;
    const diff = Math.ceil((new Date(data.delete_date) - new Date()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const pd       = data?.payment_details || {};
  const plan     = data?.plan || {};
  const daysLeft = getDaysUntilDelete();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f5f5f5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 640,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {/* Red top bar */}
        <Box
          sx={{
            bgcolor: "#b71c1c",
            p: 3,
            textAlign: "center",
            color: "white",
          }}
        >
          <WarningAmberIcon sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h5" fontWeight={700}>
            Account Locked
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
            Your subscription has expired. Please renew to restore access.
          </Typography>
        </Box>

        <Box sx={{ p: 3 }}>

          {/* Data deletion warning */}
          {daysLeft !== null && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              <strong>Your data will be permanently deleted in {daysLeft} day(s)</strong> if payment is not received.
              Your data is safe right now — renew to keep it.
            </Alert>
          )}

          {/* Plan info */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Plan Due</Typography>
            <Typography variant="h6" fontWeight={700}>
              {plan.name || "—"} &nbsp;
              <Chip
                label={`₹${Number(plan.price_monthly || 0).toLocaleString("en-IN")}/month`}
                color="primary"
                size="small"
              />
            </Typography>
          </Paper>

          {/* Bank Details */}
          {(pd.bank_account_number || pd.upi_id) && (
            <>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                <AccountBalanceIcon fontSize="small" />
                Payment Details
              </Typography>

              <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: "#fafafa" }}>
                {pd.bank_account_name   && <Row label="Account Name"   value={pd.bank_account_name} />}
                {pd.bank_account_number && <Row label="Account Number" value={pd.bank_account_number} bold />}
                {pd.bank_ifsc           && <Row label="IFSC Code"      value={pd.bank_ifsc} bold />}
                {pd.bank_name           && <Row label="Bank"           value={`${pd.bank_name}${pd.bank_branch ? ` — ${pd.bank_branch}` : ""}`} />}

                {pd.upi_id && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <Row label="UPI ID" value={pd.upi_id} bold />
                    <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                      <QrCodeIcon color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Scan QR code to pay via any UPI app
                      </Typography>
                    </Box>
                    {pd.upi_qr_image && (
                      <Box sx={{ mt: 1, textAlign: "center" }}>
                        <img
                          src={`${API.replace("/api", "")}/uploads/qr/${pd.upi_qr_image}`}
                          alt="UPI QR Code"
                          style={{ width: 160, height: 160, borderRadius: 8 }}
                        />
                      </Box>
                    )}
                  </>
                )}
              </Paper>
            </>
          )}

          {/* I have paid section */}
          <Divider sx={{ my: 2 }} />

          {submitted ? (
            <Alert icon={<CheckCircleIcon />} severity="success" sx={{ borderRadius: 2 }}>
              <strong>Payment request submitted!</strong><br />
              Our team will verify and activate your account shortly.
            </Alert>
          ) : (
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                Already paid? Let us know
              </Typography>
              <TextField
                label="UTR / Transaction ID (optional)"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                size="small"
                fullWidth
                sx={{ mb: 1.5 }}
                placeholder="12-digit UTR number or UPI reference"
              />
              <TextField
                label="Additional note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                size="small"
                fullWidth
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                color="success"
                fullWidth
                size="large"
                onClick={handleSubmitPayment}
                disabled={submitting}
                sx={{ borderRadius: 2, fontWeight: 700, py: 1.5 }}
              >
                {submitting ? <CircularProgress size={22} color="inherit" /> : "✅ I have made the payment"}
              </Button>
            </Box>
          )}

          {/* Support */}
          {(pd.support_phone || pd.support_email || pd.support_whatsapp) && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <SupportAgentIcon color="action" sx={{ mt: 0.3 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>Need Help?</Typography>
                  {pd.support_phone     && <Typography variant="body2">📞 {pd.support_phone}</Typography>}
                  {pd.support_email     && <Typography variant="body2">📧 {pd.support_email}</Typography>}
                  {pd.support_whatsapp  && <Typography variant="body2">💬 WhatsApp: {pd.support_whatsapp}</Typography>}
                </Box>
              </Box>
            </>
          )}

        </Box>
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={6000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Simple row component for payment details
const Row = ({ label, value, bold }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={bold ? 700 : 400} sx={{ textAlign: "right" }}>
      {value}
    </Typography>
  </Box>
);

export default PaymentPage;
