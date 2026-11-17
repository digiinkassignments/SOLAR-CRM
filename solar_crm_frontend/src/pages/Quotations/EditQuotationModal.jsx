import { solarTax } from "../../utils/solarTax";
import SolarTaxSummary from "../../components/SolarTaxSummary";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  Typography,
  Box,
  Divider,
  Paper,
  Stack,
  InputAdornment,
  IconButton,
  Chip,
} from "@mui/material";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import api from "../../api/axios";
import toast from "react-hot-toast";

const EditQuotationModal = ({ open, onClose, quotation, onUpdated }) => {
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
    city: "",
    state: "",
    pincode: "",
    system_capacity_kw: "",
    system_type: "On-Grid",
    panel_brand: "",
    panel_type: "",
    panel_count: "",
    inverter_brand: "",
    inverter_capacity_kw: "",
    structure_type: "",
    base_price: "",
    structure_installation_cost: "",
    discount_amount: "",
    gst_mode: "solar_composite",
    gst_rate: 13.8,
    subsidy_amount: "",
    status: "Sent",
    valid_until: "",
    terms_and_conditions: "",
    notes: "",
  });

  const [editedLines, setEditedLines] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (quotation) {
      setEditedLines(null);
      setFormData({
        customer_name: quotation.customer_name || "",
        customer_phone: quotation.customer_phone || "",
        customer_email: quotation.customer_email || "",
        customer_address: quotation.customer_address || "",
        city: quotation.city || "",
        state: quotation.state || "",
        pincode: quotation.pincode || "",
        system_capacity_kw: quotation.system_capacity_kw || "",
        system_type: quotation.system_type || "On-Grid",
        panel_brand: quotation.panel_brand || "",
        panel_type: quotation.panel_type || "",
        panel_count: quotation.panel_count || "",
        inverter_brand: quotation.inverter_brand || "",
        inverter_capacity_kw: quotation.inverter_capacity_kw || "",
        structure_type: quotation.structure_type || "",
        base_price: quotation.base_price ? parseFloat(quotation.base_price) : "",
        structure_installation_cost: quotation.structure_installation_cost
          ? parseFloat(quotation.structure_installation_cost)
          : "",
        discount_amount: quotation.discount_amount
          ? parseFloat(quotation.discount_amount)
          : "",
        gst_mode: quotation.gst_mode || "solar_composite",
        gst_rate: Number(quotation.gst_rate ?? 13.8),
        subsidy_amount: quotation.subsidy_amount
          ? parseFloat(quotation.subsidy_amount)
          : "",
        status: quotation.status || "Sent",
        valid_until: quotation.valid_until
          ? quotation.valid_until.split("T")[0]
          : "",
        terms_and_conditions: quotation.terms_and_conditions || "",
        notes: quotation.notes || "",
      });
    }
  }, [quotation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "system_capacity_kw") {
        const kw = parseFloat(value) || 1;
        updated.panel_count = Math.ceil((kw * 1000) / 550);
        updated.inverter_capacity_kw = Math.ceil(kw);
      }
      return updated;
    });
  };

  // Pricing calculations
  const numBase = parseFloat(formData.base_price) || 0;
  const numStruct = parseFloat(formData.structure_installation_cost) || 0;
  const numDiscount = parseFloat(formData.discount_amount) || 0;
  const numGstRate = Number(formData.gst_rate ?? 13.8);
  const numSubsidy = parseFloat(formData.subsidy_amount) || 0;

  const subtotalBeforeGst = Math.max(0, numBase + numStruct - numDiscount);
  let savedLines = [];
  try {
    savedLines =
      typeof quotation?.line_items_json === "string"
        ? JSON.parse(quotation.line_items_json)
        : quotation?.line_items_json || [];
  } catch {
    savedLines = [];
  }
  if (editedLines) savedLines = editedLines;
  const tax = solarTax({
    mode: formData.gst_mode,
    subtotal: numBase + numStruct,
    discount: numDiscount,
    items: savedLines,
    rate: numGstRate,
  });
  const gstAmount = tax.gst;
  const totalAmount = tax.total;
  const netPayable = Math.max(0, totalAmount - numSubsidy);

  const handleSubmit = async () => {
    if (!formData.customer_name || !formData.customer_phone) {
      toast.error("Customer name and phone number are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        expected_revision: quotation.revision_number || 1,
        ...(savedLines.length ? { line_items: savedLines } : {}),
        subtotal_before_gst: subtotalBeforeGst,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        net_payable_amount: netPayable,
      };

      const res = await api.put(`/quotations/${quotation.id}`, payload);
      if (res.data?.success) {
        toast.success("Quotation updated successfully!");
        if (onUpdated) onUpdated();
        onClose();
      }
    } catch (err) {
      console.error("Update quotation error:", err);
      toast.error(err.response?.data?.message || "Failed to update quotation");
    } finally {
      setSaving(false);
    }
  };

  if (!quotation) return null;

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!saving) onClose();
      }}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            m: { xs: 1, sm: 2 },
            width: { xs: "calc(100% - 16px)", sm: "calc(100% - 32px)" },
            maxHeight: "calc(100dvh - 32px)",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 20px 40px -10px rgba(15, 23, 42, 0.2)",
          },
        },
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          bgcolor: "#FFFFFF",
          color: "#0F172A",
          borderBottom: "1px solid #E2E8F0",
          py: 2,
          px: { xs: 2, sm: 3 },
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              bgcolor: "#EFF6FF",
              color: "#005BAC",
              display: "grid",
              placeItems: "center",
            }}
          >
            <EditIcon fontSize="small" />
          </Box>
          <Box>
            <Typography
              variant="h6"
              fontWeight={800}
              color="#0F172A"
              sx={{ fontSize: "1.1rem" }}
            >
              Edit Quotation ({quotation.quotation_number})
            </Typography>
            <Typography variant="caption" color="#64748B">
              Modify pricing, system specs, terms, or change proposal status
            </Typography>
          </Box>
        </Stack>
        <IconButton
          aria-label="Close"
          disabled={saving}
          onClick={onClose}
          sx={{
            color: "#64748B",
            bgcolor: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "9px",
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: "#F8FAFC",
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            bgcolor: "#FFFFFF",
            fontSize: "0.86rem",
          },
          "& .MuiInputLabel-root": { fontSize: "0.84rem" },
        }}
      >
        <Stack spacing={3}>
          {/* Section 1: Customer Details */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              bgcolor: "#FFFFFF",
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
              <PersonOutlinedIcon sx={{ color: "#005BAC" }} />
              <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: "#0F172A" }}>
                1. Customer & Location Details
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Customer Full Name *"
                  placeholder="e.g. Ramesh Kumar"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Phone Number *"
                  placeholder="e.g. 9876543210"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email Address"
                  placeholder="e.g. ramesh@example.com"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="City"
                  placeholder="e.g. Jaipur"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Full Installation Address"
                  placeholder="e.g. 124, Sunrise Enclave, Sector 5"
                  name="customer_address"
                  value={formData.customer_address}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Section 2: Technical Specs */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              bgcolor: "#FFFFFF",
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
              <SolarPowerIcon sx={{ color: "#D97706" }} />
              <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: "#0F172A" }}>
                2. Solar System Hardware Specifications
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="System Capacity (kW) *"
                  placeholder="e.g. 5.0"
                  name="system_capacity_kw"
                  value={formData.system_capacity_kw}
                  onChange={handleChange}
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position="end">kW</InputAdornment>,
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="System Type"
                  name="system_type"
                  value={formData.system_type}
                  onChange={handleChange}
                >
                  <MenuItem value="On-Grid">On-Grid (Net-Metered)</MenuItem>
                  <MenuItem value="Hybrid">Hybrid (Battery Backup)</MenuItem>
                  <MenuItem value="Off-Grid">Off-Grid (Standalone)</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Panel Brand"
                  placeholder="e.g. Waaree Solar / Tata Power"
                  name="panel_brand"
                  value={formData.panel_brand}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Panel Model / Specs"
                  placeholder="e.g. Mono PERC 550W Half-Cut DCR"
                  name="panel_type"
                  value={formData.panel_type}
                  onChange={handleChange}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Inverter Brand & Model"
                  placeholder="e.g. Growatt / Solis / Sungrow"
                  name="inverter_brand"
                  value={formData.inverter_brand}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Section 3: Commercial & Pricing */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              bgcolor: "#FFFFFF",
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
              <ReceiptLongIcon sx={{ color: "#059669" }} />
              <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: "#0F172A" }}>
                3. Commercial Pricing & Subsidy Breakdown
              </Typography>
            </Stack>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Base EPC System Cost (₹)"
                  disabled={savedLines.length > 0}
                  name="base_price"
                  value={formData.base_price}
                  onChange={handleChange}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">₹</InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Special Discount (₹)"
                  name="discount_amount"
                  value={formData.discount_amount}
                  onChange={handleChange}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">₹</InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="GST Scheme"
                  name="gst_mode"
                  value={formData.gst_mode}
                  onChange={handleChange}
                >
                  <MenuItem value="solar_composite">
                    MNRE 70:30 Solar Composite (Effective 8.9%)
                  </MenuItem>
                  <MenuItem value="itemised">Itemised GST</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="PM Surya Ghar Subsidy (₹)"
                  name="subsidy_amount"
                  value={formData.subsidy_amount}
                  onChange={handleChange}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">₹</InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
            </Grid>

            {/* Live Calculation Banner */}
            <Box
              sx={{
                p: 2,
                bgcolor: "#F0FDF4",
                borderRadius: "10px",
                border: "1.5px solid #86EFAC",
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
                gap: 2,
                textAlign: "center",
              }}
            >
              <Box>
                <Typography sx={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700 }}>
                  Taxable Value
                </Typography>
                <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: "#0F172A" }}>
                  ₹{subtotalBeforeGst.toLocaleString("en-IN")}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700 }}>
                  GST Amount
                </Typography>
                <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: "#0F172A" }}>
                  + ₹{gstAmount.toLocaleString("en-IN")}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700 }}>
                  Total Project Cost
                </Typography>
                <Typography sx={{ fontSize: "0.95rem", fontWeight: 900, color: "#005BAC" }}>
                  ₹{totalAmount.toLocaleString("en-IN")}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.72rem", color: "#166534", fontWeight: 800 }}>
                  Net Customer Payable
                </Typography>
                <Typography sx={{ fontSize: "1.1rem", fontWeight: 900, color: "#15803D" }}>
                  ₹{netPayable.toLocaleString("en-IN")}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Section 4: Status & Terms */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              bgcolor: "#FFFFFF",
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
              <FactCheckOutlinedIcon sx={{ color: "#6366F1" }} />
              <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: "#0F172A" }}>
                4. Proposal Status, Validity & Notes
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="Quotation Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <MenuItem value="Draft">Draft</MenuItem>
                  <MenuItem value="Sent">Sent to Customer</MenuItem>
                  <MenuItem value="Accepted">Accepted by Customer</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                  <MenuItem value="Expired">Expired</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Offer Valid Until"
                  name="valid_until"
                  value={formData.valid_until}
                  onChange={handleChange}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  label="Special Terms & Commercial Conditions"
                  name="terms_and_conditions"
                  value={formData.terms_and_conditions}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: 1.5,
          borderTop: "1px solid #E2E8F0",
          bgcolor: "#FFFFFF",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Button
          disabled={saving}
          onClick={onClose}
          sx={{ color: "#64748B", fontWeight: 700, textTransform: "none" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          startIcon={<SaveIcon />}
          sx={{
            bgcolor: "#0F172A",
            color: "#FFFFFF",
            fontWeight: 700,
            px: 3,
            borderRadius: "8px",
            textTransform: "none",
            "&:hover": { bgcolor: "#1E293B" },
          }}
        >
          {saving ? "Saving Changes..." : "Save Quotation Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditQuotationModal;
