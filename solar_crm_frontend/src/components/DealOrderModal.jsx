import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Select,
  Grid,
  Stack,
  CircularProgress,
  Paper,
  Chip,
  Divider,
  InputAdornment,
} from "@mui/material";

import {
  Close as CloseIcon,
  EmojiEvents as TrophyIcon,
  CheckCircle as CheckCircleIcon,
  MonetizationOn as MoneyIcon,
  AccountBalance as BankIcon,
  Receipt as ReceiptIcon,
  Badge as BadgeIcon,
} from "@mui/icons-material";

import { closeOrder, getOrderByLead } from "../services/dealService";
import api from "../api/axios";

const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  primarySoft: "#FEF3C7",
  accent: "#F59E0B",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  success: "#16A34A",
  gold: "#D97706",
};

const PAYMENT_MODES = [
  { id: "bank_transfer", label: "Bank Transfer (NEFT/RTGS/IMPS)" },
  { id: "upi", label: "UPI Payment (GPay / PhonePe / Paytm)" },
  { id: "cheque", label: "Cheque / Demand Draft" },
  { id: "financing", label: "Solar Loan / EMI Financing" },
  { id: "cash", label: "Cash Payment" },
];

export default function DealOrderModal({ open, onClose, lead, quotation, onOrderBooked, showSnackbar }) {
  const [saving, setSaving] = useState(false);
  const [dealers, setDealers] = useState([]);
  const [existingOrder, setExistingOrder] = useState(null);

  const [formData, setFormData] = useState({
    total_project_cost: "",
    advance_payment_amount: "",
    advance_payment_date: new Date().toISOString().slice(0, 10),
    payment_mode: "bank_transfer",
    payment_reference: "",
    dealer_id: "",
    dealer_commission: "",
    notes: "",
  });

  useEffect(() => {
    if (open && lead?.id) {
      fetchDealers();
      fetchExistingOrder();
    }
  }, [open, lead]);

  useEffect(() => {
    if (lead) {
      const estimatedCost =
        quotation?.net_payable_amount ||
        quotation?.total_amount ||
        lead.quotation_amount ||
        (lead.required_kw ? Number(lead.required_kw) * 50000 : 150000);

      const defaultAdvance = Math.round(Number(estimatedCost) * 0.2); // 20% advance

      setFormData((p) => ({
        ...p,
        total_project_cost: estimatedCost,
        advance_payment_amount: defaultAdvance,
        advance_payment_date: new Date().toISOString().slice(0, 10),
      }));
    }
  }, [lead, quotation, open]);

  const fetchDealers = async () => {
    try {
      const res = await api.get("/users?role=3&limit=50");
      if (res.data?.success || res.data?.data) {
        setDealers(res.data.data || res.data || []);
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchExistingOrder = async () => {
    try {
      const res = await getOrderByLead(lead.id);
      if (res.success && res.data) {
        setExistingOrder(res.data);
        setFormData({
          total_project_cost: res.data.total_project_cost || "",
          advance_payment_amount: res.data.advance_payment_amount || "",
          advance_payment_date: res.data.advance_payment_date ? String(res.data.advance_payment_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
          payment_mode: res.data.payment_mode || "bank_transfer",
          payment_reference: res.data.payment_reference || "",
          dealer_id: res.data.dealer_id || "",
          dealer_commission: res.data.dealer_commission || "",
          notes: res.data.notes || "",
        });
      } else {
        setExistingOrder(null);
      }
    } catch (e) {
      setExistingOrder(null);
    }
  };

  const handleSubmit = async () => {
    if (!lead?.id) return;
    if (!formData.total_project_cost || !formData.advance_payment_amount) {
      showSnackbar && showSnackbar("Total Project Cost and Advance Amount are required.", "warning");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        lead_id: lead.id,
        quotation_id: quotation?.id || null,
      };

      const res = await closeOrder(payload);
      if (res.success) {
        showSnackbar && showSnackbar(`🎉 Order ${res.data?.order_number || ""} Booked! Lead marked as 'Deal Won'.`, "success");
        onOrderBooked && onOrderBooked(res.data);
        onClose();
      } else {
        showSnackbar && showSnackbar(res.message || "Failed to book order.", "error");
      }
    } catch (err) {
      console.error("Close order error:", err);
      showSnackbar && showSnackbar("Server error booking order.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          border: `1px solid ${COLORS.border}`,
          maxHeight: "90vh",
        },
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          p: 2.5,
          background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, #15803D 50%, ${COLORS.success} 100%)`,
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: "10px",
              backgroundColor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TrophyIcon sx={{ color: "#FFD700", fontSize: 26 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", fontFamily: "'Inter', sans-serif" }}>
              Stage 7: Book Order & Mark Deal Won
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.85)", fontFamily: "'Inter', sans-serif" }}>
              Record advance token payment, agreement date, & dealer commission
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: "#FFFFFF" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* BODY */}
      <DialogContent sx={{ p: 2.5, overflowY: "auto" }}>
        {/* LEAD INFO BANNER */}
        <Paper elevation={0} sx={{ p: 1.8, mb: 2.5, borderRadius: "12px", border: `1px solid ${COLORS.border}`, bgcolor: "#F0FDF4" }}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12} sm={7}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: COLORS.textPrimary }}>
                👤 Customer: {lead?.customer_name} ({lead?.lead_code})
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}>
                📞 {lead?.mobile_number} | 📍 {lead?.city || lead?.address || "Site Address"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={5} sx={{ textAlign: { xs: "left", sm: "right" } }}>
              <Chip
                label={existingOrder ? `Order: ${existingOrder.order_number}` : "New Order Booking"}
                color="success"
                size="small"
                sx={{ fontWeight: 800, fontSize: "0.75rem" }}
              />
              <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, mt: 0.5 }}>
                ⚡ System: {lead?.required_kw || quotation?.system_capacity_kw || 3} kWp Solar Plant
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={2.5}>
          {/* SECTION 1: COMMERCIAL FINANCIAL SUMMARY */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, bgcolor: "#FFFFFF" }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <MoneyIcon sx={{ color: COLORS.success, fontSize: 22 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: COLORS.primaryDark, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  1. Order Value & Advance Payment (20-30% Token)
                </Typography>
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
                    Total Project Cost (₹) *
                  </Typography>
                  <TextField
                    type="number"
                    fullWidth
                    size="small"
                    placeholder="e.g. 175000"
                    value={formData.total_project_cost}
                    onChange={(e) => setFormData((p) => ({ ...p, total_project_cost: e.target.value }))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    sx={{ "& input": { fontSize: "0.85rem", fontWeight: 700 } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
                    Advance Token Received (₹) *
                  </Typography>
                  <TextField
                    type="number"
                    fullWidth
                    size="small"
                    placeholder="e.g. 35000"
                    value={formData.advance_payment_amount}
                    onChange={(e) => setFormData((p) => ({ ...p, advance_payment_amount: e.target.value }))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    sx={{ "& input": { fontSize: "0.85rem", fontWeight: 700, color: COLORS.success } }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
                    Advance Payment Date *
                  </Typography>
                  <TextField
                    type="date"
                    fullWidth
                    size="small"
                    value={formData.advance_payment_date}
                    onChange={(e) => setFormData((p) => ({ ...p, advance_payment_date: e.target.value }))}
                    sx={{ "& input": { fontSize: "0.82rem" } }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
                    Payment Mode *
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={formData.payment_mode}
                    onChange={(e) => setFormData((p) => ({ ...p, payment_mode: e.target.value }))}
                    sx={{ borderRadius: "8px", fontSize: "0.82rem" }}
                  >
                    {PAYMENT_MODES.map((m) => (
                      <MenuItem key={m.id} value={m.id} sx={{ fontSize: "0.82rem" }}>
                        {m.label}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
                    Payment UTR / Txn Reference No.
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. UTR123456789"
                    value={formData.payment_reference}
                    onChange={(e) => setFormData((p) => ({ ...p, payment_reference: e.target.value }))}
                    sx={{ "& input": { fontSize: "0.82rem" } }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* SECTION 2: DEALER / PARTNER COMMISSION */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${COLORS.border}`, bgcolor: "#FFFFFF" }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <BadgeIcon sx={{ color: COLORS.primary, fontSize: 22 }} />
                <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: COLORS.primaryDark, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  2. Dealer Tagging & Partner Commission (Optional)
                </Typography>
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
                    Associated Dealer / Partner
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    displayEmpty
                    value={formData.dealer_id}
                    onChange={(e) => setFormData((p) => ({ ...p, dealer_id: e.target.value }))}
                    sx={{ borderRadius: "8px", fontSize: "0.82rem" }}
                  >
                    <MenuItem value="" sx={{ fontSize: "0.82rem", color: COLORS.textSecondary }}>
                      -- Direct Company Sale (No Dealer) --
                    </MenuItem>
                    {dealers.map((d) => (
                      <MenuItem key={d.id} value={d.id} sx={{ fontSize: "0.82rem" }}>
                        👔 {d.full_name || d.name} ({d.role_name || "Sales Partner"})
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
                    Dealer Commission Amount (₹)
                  </Typography>
                  <TextField
                    type="number"
                    fullWidth
                    size="small"
                    placeholder="e.g. 5000"
                    value={formData.dealer_commission}
                    onChange={(e) => setFormData((p) => ({ ...p, dealer_commission: e.target.value }))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    sx={{ "& input": { fontSize: "0.82rem" } }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* SECTION 3: NOTES & AGREEMENT REMARKS */}
          <Grid item xs={12}>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.8 }}>
              Contract Notes & Special Remarks
            </Typography>
            <TextField
              multiline
              rows={2}
              fullWidth
              size="small"
              placeholder="e.g. Customer signed 3-page agreement, 50% dispatch scheduled upon inverter arrival..."
              value={formData.notes}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "0.82rem" } }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      {/* FOOTER */}
      <DialogActions sx={{ p: 2, px: 2.5, borderTop: `1px solid ${COLORS.border}` }}>
        <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 600, color: COLORS.textSecondary }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
          sx={{
            textTransform: "none",
            fontWeight: 800,
            borderRadius: "8px",
            px: 3,
            backgroundColor: COLORS.success,
            "&:hover": { backgroundColor: "#15803D" },
          }}
        >
          {saving ? "Booking Order..." : "Confirm & Book Order"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
