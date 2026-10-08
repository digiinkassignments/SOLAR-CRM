import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Typography,
  Box,
  MenuItem,
  IconButton,
  Stack,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PaymentIcon from "@mui/icons-material/Payment";
import api from "../../api/axios";
import toast from "react-hot-toast";

const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  border: "#E2E8F0",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  success: "#16A34A",
  danger: "#DC2626",
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
    fontSize: "0.92rem",
    "& fieldset": { borderColor: COLORS.border },
    "&:hover fieldset": { borderColor: "#94A3B8" },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary },
  },
  "& .MuiInputBase-input": { py: 1.1, px: 1.5 },
};

const RecordPaymentModal = ({ open, onClose, invoice = null, onPaymentRecorded = null }) => {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!invoice) return null;

  const currentBalance = parseFloat(invoice.balance_due) || 0;
  const numAmount = parseFloat(amount) || 0;
  const newBalance = Math.max(0, currentBalance - numAmount);

  const handleSubmit = async () => {
    if (numAmount <= 0) {
      toast.error("Please enter a valid payment amount greater than 0");
      return;
    }
    if (numAmount > currentBalance) {
      if (!window.confirm("Payment amount exceeds outstanding balance. Continue?")) {
        return;
      }
    }

    setLoading(true);
    try {
      const res = await api.post(`/invoices/${invoice.id}/payments`, {
        amount: numAmount,
        payment_date: paymentDate,
        payment_mode: paymentMode,
        reference_number: referenceNumber,
        notes,
      });

      if (res.data?.success) {
        toast.success(`Payment of ₹${numAmount.toLocaleString("en-IN")} recorded successfully!`);
        if (onPaymentRecorded) onPaymentRecorded(res.data.data);
        onClose();
      }
    } catch (err) {
      console.error("Record payment error:", err);
      toast.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "14px",
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.15)",
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: COLORS.primary,
          color: "#FFFFFF",
          px: 3,
          py: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <PaymentIcon sx={{ color: "#38BDF8", fontSize: 24 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Record Payment Installment
            </Typography>
            <Typography variant="caption" sx={{ color: "#94A3B8" }}>
              Invoice {invoice.invoice_number} • {invoice.customer_name}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "#94A3B8", "&:hover": { color: "#FFFFFF" } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: "#FAFBFC" }}>
        <Alert severity="info" sx={{ mb: 2.5, borderRadius: "8px" }}>
          Current Outstanding Balance: <strong>₹{currentBalance.toLocaleString("en-IN")}</strong>
        </Alert>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
              Payment Amount (₹) *
            </Typography>
            <TextField
              type="number"
              fullWidth
              size="small"
              placeholder={`Max ₹${currentBalance}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              sx={inputSx}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
              Payment Date *
            </Typography>
            <TextField
              type="date"
              fullWidth
              size="small"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              sx={inputSx}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
              Payment Mode
            </Typography>
            <TextField select fullWidth size="small" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} sx={inputSx}>
              <MenuItem value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</MenuItem>
              <MenuItem value="UPI / QR">UPI / QR Payment</MenuItem>
              <MenuItem value="Cheque">Cheque</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Net Banking">Net Banking</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
              Reference / UTR / Cheque No
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. UTR987654321"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              sx={inputSx}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
              Payment Notes
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. Second installment paid upon inverter delivery"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={inputSx}
            />
          </Grid>
        </Grid>

        {numAmount > 0 && (
          <Box sx={{ mt: 2.5, p: 1.5, bgcolor: "#FFFFFF", borderRadius: "8px", border: `1px solid ${COLORS.border}` }}>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block" }}>
              New Remaining Balance: <strong style={{ color: newBalance > 0 ? COLORS.danger : COLORS.success }}>₹{newBalance.toLocaleString("en-IN")}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block" }}>
              New Status: <strong>{newBalance === 0 ? "PAID IN FULL" : "PARTIALLY PAID"}</strong>
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: "#FFFFFF", borderTop: `1px solid ${COLORS.border}` }}>
        <Button variant="outlined" onClick={onClose} sx={{ borderColor: COLORS.border, color: COLORS.textSecondary }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            bgcolor: COLORS.primary,
            color: "#FFFFFF",
            fontWeight: 700,
            textTransform: "none",
            px: 3,
            "&:hover": { bgcolor: COLORS.primaryDark },
          }}
        >
          {loading ? "Recording..." : "Record Payment ➔"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecordPaymentModal;
