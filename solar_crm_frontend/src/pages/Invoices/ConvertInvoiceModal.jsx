import React, { useState, useEffect } from "react";
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
  InputAdornment,
  IconButton,
  Divider,
  Stack,
  Alert,
  Paper,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import api from "../../api/axios";
import toast from "react-hot-toast";

const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  secondary: "#0284C7",
  border: "#E2E8F0",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  bgSubtle: "#F8FAFC",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
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

const ConvertInvoiceModal = ({ open, onClose, quotationData = null, onInvoiceCreated = null }) => {
  const [loading, setLoading] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState(null);

  // Client Details
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");

  // System Technical Specs
  const [systemCapacityKw, setSystemCapacityKw] = useState(1.0);
  const [systemType, setSystemType] = useState("On-Grid");
  const [panelSpecs, setPanelSpecs] = useState("Waaree 550W Mono PERC Half-Cut");
  const [inverterSpecs, setInverterSpecs] = useState("Growatt / Solis Solar Inverter");
  const [structureType, setStructureType] = useState("Elevated GI High-Grade Structure");

  // Commercial / Pricing Specs
  const [baseAmount, setBaseAmount] = useState(0);
  const [installationAmount, setInstallationAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [gstRate, setGstRate] = useState(13.80);
  const [subsidyAmount, setSubsidyAmount] = useState(0);

  // Payment Tracking
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [notes, setNotes] = useState("");

  // Initialize or pre-fill from quotation
  useEffect(() => {
    if (quotationData) {
      setCustomerName(quotationData.customer_name || "");
      setCustomerPhone(quotationData.customer_phone || "");
      setCustomerEmail(quotationData.customer_email || "");
      setCustomerAddress(quotationData.customer_address || "");
      setCity(quotationData.city || "");
      setState(quotationData.state || "");
      setPincode(quotationData.pincode || "");
      
      setSystemCapacityKw(quotationData.system_capacity_kw || 3.0);
      setSystemType(quotationData.system_type || "On-Grid");
      setPanelSpecs(`${quotationData.panel_brand || "Tier-1"} ${quotationData.panel_type || "550W Mono PERC"}`);
      setInverterSpecs(`${quotationData.inverter_brand || "Solar"} (${quotationData.inverter_capacity_kw || quotationData.system_capacity_kw || 3} kW)`);
      setStructureType(quotationData.structure_type || "Elevated GI High-Grade Structure");

      const base = parseFloat(quotationData.base_price) || 0;
      const install = parseFloat(quotationData.structure_installation_cost) || 0;
      const disc = parseFloat(quotationData.discount_amount) || 0;
      const gst = parseFloat(quotationData.gst_rate) || 13.80;
      const sub = parseFloat(quotationData.subsidy_amount) || 0;

      setBaseAmount(base);
      setInstallationAmount(install);
      setDiscountAmount(disc);
      setGstRate(gst);
      setSubsidyAmount(sub);

      // Default amount paid can be advance e.g. 20-30% or 0
      setAmountPaid(0);
      setNotes(`Generated against Quotation ${quotationData.quotation_number}`);
    }
  }, [quotationData, open]);

  // Real-time commercial arithmetic
  const numBase = parseFloat(baseAmount) || 0;
  const numInstall = parseFloat(installationAmount) || 0;
  const numDiscount = parseFloat(discountAmount) || 0;
  const numGstRate = parseFloat(gstRate) || 13.80;
  const numSubsidy = parseFloat(subsidyAmount) || 0;

  const taxableAmount = Math.max(0, numBase + numInstall - numDiscount);
  const gstAmount = Math.round((taxableAmount * numGstRate) / 100);
  const grossTotal = Math.round(taxableAmount + gstAmount);
  const netPayable = Math.max(0, grossTotal - numSubsidy);

  const numPaid = Math.max(0, parseFloat(amountPaid) || 0);
  const balanceDue = Math.max(0, netPayable - numPaid);

  let calculatedStatus = "Unpaid";
  if (balanceDue === 0 && numPaid > 0) {
    calculatedStatus = "Paid";
  } else if (numPaid > 0 && balanceDue > 0) {
    calculatedStatus = "Partially Paid";
  }

  const handleSubmit = async () => {
    if (!customerName || !customerPhone) {
      toast.error("Customer name and phone number are required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        quotation_id: quotationData?.id || null,
        lead_id: quotationData?.lead_id || null,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        customer_address: customerAddress,
        city,
        state,
        pincode,
        customer_gstin: customerGstin,
        system_capacity_kw: systemCapacityKw,
        system_type: systemType,
        panel_specs: panelSpecs,
        inverter_specs: inverterSpecs,
        structure_type: structureType,
        base_amount: numBase,
        installation_amount: numInstall,
        discount_amount: numDiscount,
        taxable_amount: taxableAmount,
        gst_rate: numGstRate,
        gst_amount: gstAmount,
        gross_total: grossTotal,
        subsidy_amount: numSubsidy,
        net_payable_amount: netPayable,
        amount_paid: numPaid,
        balance_due: balanceDue,
        payment_status: calculatedStatus,
        payment_mode: paymentMode,
        payment_reference: paymentReference,
        invoice_date: invoiceDate,
        due_date: dueDate,
        notes,
      };

      const res = await api.post("/invoices", payload);
      if (res.data?.success) {
        toast.success("Executive Tax Invoice created successfully!");
        setCreatedInvoice(res.data.data);
        if (onInvoiceCreated) onInvoiceCreated(res.data.data);
      }
    } catch (err) {
      console.error("Create invoice error:", err);
      toast.error(err.response?.data?.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdInvoice?.public_token) return;
    const url = `${window.location.origin}/invoice/${createdInvoice.public_token}`;
    navigator.clipboard.writeText(url);
    toast.success("Invoice link copied to clipboard!");
  };

  const handleShareWhatsApp = () => {
    if (!createdInvoice) return;
    const url = `${window.location.origin}/invoice/${createdInvoice.public_token}`;
    const text =
      `*TAX INVOICE / BILLING NOTICE*\n` +
      `Invoice No: ${createdInvoice.invoice_number}\n` +
      `Customer: ${customerName}\n` +
      `Plant Capacity: ${systemCapacityKw} kW\n` +
      `Net Invoice Amount: Rs. ${netPayable.toLocaleString("en-IN")}\n` +
      `Amount Paid / Advance: Rs. ${numPaid.toLocaleString("en-IN")}\n` +
      `Balance Due: Rs. ${balanceDue.toLocaleString("en-IN")}\n` +
      `Status: ${calculatedStatus.toUpperCase()}\n\n` +
      `View & Download Official Invoice PDF:\n${url}`;

    window.open(`https://api.whatsapp.com/send?phone=91${customerPhone}&text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleClose = () => {
    setCreatedInvoice(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
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
          <ReceiptLongIcon sx={{ color: "#38BDF8", fontSize: 26 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Convert into Official Tax Invoice
            </Typography>
            <Typography variant="caption" sx={{ color: "#94A3B8" }}>
              Pre-filled commercial & payment settlement form • 100% editable
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: "#94A3B8", "&:hover": { color: "#FFFFFF" } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: "#FAFBFC" }}>
        {createdInvoice ? (
          <Box sx={{ py: 3, textAlign: "center" }}>
            <CheckCircleOutlinedIcon sx={{ fontSize: 64, color: COLORS.success, mb: 1.5 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.primary, mb: 0.5 }}>
              Tax Invoice Generated Successfully!
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 3 }}>
              Invoice Number: <strong>{createdInvoice.invoice_number}</strong>
            </Typography>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mb: 3,
                bgcolor: "#FFFFFF",
                borderRadius: "12px",
                border: `1px solid ${COLORS.border}`,
                textAlign: "left",
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Net Total</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>₹{netPayable.toLocaleString("en-IN")}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Amount Paid</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.success }}>
                    ₹{numPaid.toLocaleString("en-IN")}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Balance Due</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: balanceDue > 0 ? COLORS.danger : COLORS.success }}>
                    ₹{balanceDue.toLocaleString("en-IN")}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Payment Status</Typography>
                  <Box sx={{ mt: 0.3 }}>
                    <Chip
                      size="small"
                      label={calculatedStatus}
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        bgcolor: calculatedStatus === "Paid" ? COLORS.successSoft : calculatedStatus === "Partially Paid" ? COLORS.warningSoft : COLORS.dangerSoft,
                        color: calculatedStatus === "Paid" ? COLORS.success : calculatedStatus === "Partially Paid" ? COLORS.warning : COLORS.danger,
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center">
              <Button
                variant="contained"
                startIcon={<PictureAsPdfIcon />}
                onClick={() => window.open(`/invoice/${createdInvoice.public_token}?download=true`, "_blank")}
                sx={{
                  bgcolor: COLORS.primary,
                  color: "#FFFFFF",
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: "8px",
                  "&:hover": { bgcolor: COLORS.primaryDark },
                }}
              >
                Download 1-Page PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                onClick={() => window.open(`/invoice/${createdInvoice.public_token}`, "_blank")}
                sx={{
                  borderColor: COLORS.border,
                  color: COLORS.primary,
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: "8px",
                  "&:hover": { borderColor: COLORS.primary },
                }}
              >
                Browser View ↗
              </Button>
              <Button
                variant="contained"
                startIcon={<WhatsAppIcon />}
                onClick={handleShareWhatsApp}
                sx={{
                  bgcolor: "#25D366",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: "8px",
                  "&:hover": { bgcolor: "#1EBE5D" },
                }}
              >
                Share WhatsApp
              </Button>
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyLink}
                sx={{
                  borderColor: COLORS.border,
                  color: COLORS.textSecondary,
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: "8px",
                }}
              >
                Copy Link
              </Button>
            </Stack>
          </Box>
        ) : (
          <Box sx={{ mt: 1 }}>
            {/* Section 1: Customer Details */}
            <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.secondary, textTransform: "uppercase", letterSpacing: 0.5, mb: 1, display: "block" }}>
              1. Customer & Billing Details
            </Typography>
            <Paper elevation={0} sx={{ p: 2, mb: 2.5, bgcolor: "#FFFFFF", borderRadius: "10px", border: `1px solid ${COLORS.border}` }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    Customer Name *
                  </Typography>
                  <TextField fullWidth size="small" value={customerName} onChange={(e) => setCustomerName(e.target.value)} sx={inputSx} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    Mobile Number *
                  </Typography>
                  <TextField fullWidth size="small" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} sx={inputSx} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    Email Address
                  </Typography>
                  <TextField fullWidth size="small" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} sx={inputSx} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    Customer GSTIN (For B2B Invoices)
                  </Typography>
                  <TextField fullWidth size="small" placeholder="Optional e.g. 08AAACH7409R1ZZ" value={customerGstin} onChange={(e) => setCustomerGstin(e.target.value)} sx={inputSx} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    Billing & Site Address
                  </Typography>
                  <TextField fullWidth size="small" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} sx={inputSx} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    City
                  </Typography>
                  <TextField fullWidth size="small" value={city} onChange={(e) => setCity(e.target.value)} sx={inputSx} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    State
                  </Typography>
                  <TextField fullWidth size="small" value={state} onChange={(e) => setState(e.target.value)} sx={inputSx} />
                </Grid>
              </Grid>
            </Paper>

            {/* Section 2: Technical Specifications */}
            <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.secondary, textTransform: "uppercase", letterSpacing: 0.5, mb: 1, display: "block" }}>
              2. System Specifications
            </Typography>
            <Paper elevation={0} sx={{ p: 2, mb: 2.5, bgcolor: "#FFFFFF", borderRadius: "10px", border: `1px solid ${COLORS.border}` }}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    Capacity (kW) *
                  </Typography>
                  <TextField type="number" fullWidth size="small" value={systemCapacityKw} onChange={(e) => setSystemCapacityKw(e.target.value)} sx={inputSx} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    System Type
                  </Typography>
                  <TextField select fullWidth size="small" value={systemType} onChange={(e) => setSystemType(e.target.value)} sx={inputSx}>
                    <MenuItem value="On-Grid">On-Grid (Grid-Tied)</MenuItem>
                    <MenuItem value="Off-Grid">Off-Grid (Battery Backup)</MenuItem>
                    <MenuItem value="Hybrid">Hybrid System</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    Solar PV Modules (HSN: 8479)
                  </Typography>
                  <TextField fullWidth size="small" value={panelSpecs} onChange={(e) => setPanelSpecs(e.target.value)} sx={inputSx} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    Solar Inverter (HSN: 8504)
                  </Typography>
                  <TextField fullWidth size="small" value={inverterSpecs} onChange={(e) => setInverterSpecs(e.target.value)} sx={inputSx} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    Mounting Structure & BoS
                  </Typography>
                  <TextField fullWidth size="small" value={structureType} onChange={(e) => setStructureType(e.target.value)} sx={inputSx} />
                </Grid>
              </Grid>
            </Paper>

            {/* Section 3: Commercial & Tax Structure */}
            <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.secondary, textTransform: "uppercase", letterSpacing: 0.5, mb: 1, display: "block" }}>
              3. Commercial Pricing & GST Breakdown
            </Typography>
            <Paper elevation={0} sx={{ p: 2, mb: 2.5, bgcolor: "#FFFFFF", borderRadius: "10px", border: `1px solid ${COLORS.border}` }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    Base Plant Cost (₹)
                  </Typography>
                  <TextField type="number" fullWidth size="small" value={baseAmount} onChange={(e) => setBaseAmount(e.target.value)} sx={inputSx} />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    Structure / Installation (₹)
                  </Typography>
                  <TextField type="number" fullWidth size="small" value={installationAmount} onChange={(e) => setInstallationAmount(e.target.value)} sx={inputSx} />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    Special Discount (₹)
                  </Typography>
                  <TextField type="number" fullWidth size="small" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} sx={inputSx} />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    GST Rate (%)
                  </Typography>
                  <TextField type="number" fullWidth size="small" value={gstRate} onChange={(e) => setGstRate(e.target.value)} sx={inputSx} />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    Calculated GST Amount (₹)
                  </Typography>
                  <TextField fullWidth size="small" value={`₹${gstAmount.toLocaleString("en-IN")}`} disabled sx={inputSx} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    PM Surya Ghar Subsidy (₹)
                  </Typography>
                  <TextField type="number" fullWidth size="small" value={subsidyAmount} onChange={(e) => setSubsidyAmount(e.target.value)} sx={inputSx} />
                </Grid>
              </Grid>

              {/* Financial Summary Highlight */}
              <Box sx={{ mt: 2, p: 1.5, bgcolor: COLORS.bgSubtle, borderRadius: "8px", border: `1px dashed ${COLORS.border}` }}>
                <Grid container spacing={1}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Taxable Value</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{taxableAmount.toLocaleString("en-IN")}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Total Inc. GST</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{grossTotal.toLocaleString("en-IN")}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Subsidy Deduction</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.success }}>-₹{numSubsidy.toLocaleString("en-IN")}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" sx={{ color: COLORS.primary, fontWeight: 700 }}>Net Customer Payable</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.primary }}>
                      ₹{netPayable.toLocaleString("en-IN")}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>

            {/* Section 4: Payment Tracking (Kitna payment aya, kitna baki hai) */}
            <Typography variant="caption" sx={{ fontWeight: 700, color: "#16A34A", textTransform: "uppercase", letterSpacing: 0.5, mb: 1, display: "block" }}>
              4. Payment Settlement & Terms (Kitna Payment Aaya Hai)
            </Typography>
            <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: "#FFFFFF", borderRadius: "10px", border: `1px solid ${COLORS.border}` }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    Payment Received / Advance (₹) *
                  </Typography>
                  <TextField
                    type="number"
                    fullWidth
                    size="small"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    helperText="Enter advance amount received"
                    sx={inputSx}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    Remaining Balance Due (₹)
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={`₹${balanceDue.toLocaleString("en-IN")}`}
                    disabled
                    sx={{
                      ...inputSx,
                      "& .MuiInputBase-input": {
                        fontWeight: 700,
                        color: balanceDue > 0 ? COLORS.danger : COLORS.success,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    Payment Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={calculatedStatus}
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        py: 1,
                        bgcolor: calculatedStatus === "Paid" ? COLORS.successSoft : calculatedStatus === "Partially Paid" ? COLORS.warningSoft : COLORS.dangerSoft,
                        color: calculatedStatus === "Paid" ? COLORS.success : calculatedStatus === "Partially Paid" ? COLORS.warning : COLORS.danger,
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4}>
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
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    Transaction / UTR Reference
                  </Typography>
                  <TextField fullWidth size="small" placeholder="e.g. UTR1234987654" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} sx={inputSx} />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    Invoice Due Date
                  </Typography>
                  <TextField type="date" fullWidth size="small" value={dueDate} onChange={(e) => setDueDate(e.target.value)} sx={inputSx} />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textPrimary, mb: 0.5, display: "block" }}>
                    Notes / Bank Wire Transfer Instructions
                  </Typography>
                  <TextField fullWidth multiline rows={2} size="small" placeholder="e.g. Balance payable upon delivery of solar modules at site" value={notes} onChange={(e) => setNotes(e.target.value)} sx={inputSx} />
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: "#FFFFFF", borderTop: `1px solid ${COLORS.border}` }}>
        {createdInvoice ? (
          <Button
            variant="contained"
            onClick={handleClose}
            sx={{
              bgcolor: COLORS.primary,
              color: "#FFFFFF",
              borderRadius: "8px",
              fontWeight: 600,
              textTransform: "none",
              px: 3,
            }}
          >
            Done & Close
          </Button>
        ) : (
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              onClick={handleClose}
              sx={{
                borderColor: COLORS.border,
                color: COLORS.textSecondary,
                borderRadius: "8px",
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={<ReceiptLongIcon />}
              sx={{
                bgcolor: COLORS.primary,
                color: "#FFFFFF",
                borderRadius: "8px",
                fontWeight: 700,
                textTransform: "none",
                px: 3,
                "&:hover": { bgcolor: COLORS.primaryDark },
              }}
            >
              {loading ? "Generating Invoice..." : "Generate Official Invoice ➔"}
            </Button>
          </Stack>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ConvertInvoiceModal;
