import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
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
    system_capacity_kw: 3,
    system_type: "On-Grid",
    panel_brand: "Waaree Solar",
    panel_type: "Mono PERC 550W Half-Cut DCR",
    panel_count: 6,
    inverter_brand: "Growatt / Solis",
    inverter_capacity_kw: 3,
    structure_type: "Elevated GI High-Grade Structure",
    base_price: 169275,
    structure_installation_cost: 15000,
    discount_amount: 0,
    gst_rate: 13.80,
    subsidy_amount: 78000,
    status: "Sent",
    valid_until: "",
    terms_and_conditions: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (quotation) {
      setFormData({
        customer_name: quotation.customer_name || "",
        customer_phone: quotation.customer_phone || "",
        customer_email: quotation.customer_email || "",
        customer_address: quotation.customer_address || "",
        city: quotation.city || "",
        state: quotation.state || "",
        pincode: quotation.pincode || "",
        system_capacity_kw: quotation.system_capacity_kw || 3,
        system_type: quotation.system_type || "On-Grid",
        panel_brand: quotation.panel_brand || "Waaree Solar",
        panel_type: quotation.panel_type || "Mono PERC 550W Half-Cut DCR",
        panel_count: quotation.panel_count || 6,
        inverter_brand: quotation.inverter_brand || "Growatt / Solis",
        inverter_capacity_kw: quotation.inverter_capacity_kw || 3,
        structure_type: quotation.structure_type || "Elevated GI High-Grade Structure",
        base_price: parseFloat(quotation.base_price) || 0,
        structure_installation_cost: parseFloat(quotation.structure_installation_cost) || 0,
        discount_amount: parseFloat(quotation.discount_amount) || 0,
        gst_rate: parseFloat(quotation.gst_rate) || 13.80,
        subsidy_amount: parseFloat(quotation.subsidy_amount) || 0,
        status: quotation.status || "Sent",
        valid_until: quotation.valid_until ? quotation.valid_until.split("T")[0] : "",
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
  const numGstRate = parseFloat(formData.gst_rate) || 13.80;
  const numSubsidy = parseFloat(formData.subsidy_amount) || 0;

  const subtotalBeforeGst = Math.max(0, numBase + numStruct - numDiscount);
  const gstAmount = Math.round((subtotalBeforeGst * numGstRate) / 100);
  const totalAmount = Math.round(subtotalBeforeGst + gstAmount);
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "20px" } }}>
      <DialogTitle sx={{ bgcolor: "#005BAC", color: "#FFFFFF", py: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <EditIcon />
          <Box>
            <Typography variant="h6" fontWeight={800} color="#FFFFFF">
              Edit Quotation ({quotation.quotation_number})
            </Typography>
            <Typography variant="caption" color="#93C5FD">
              Update pricing, customer details, equipment specs, and status
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 4 }}>
        {/* Section 1: Customer Details */}
        <Typography variant="subtitle2" fontWeight={800} color="#0B3A63" mb={2}>
          1. Customer & Location Information
        </Typography>

        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Customer Name *" name="customer_name" value={formData.customer_name} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Phone Number *" name="customer_phone" value={formData.customer_phone} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Email Address" name="customer_email" value={formData.customer_email} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="City" name="city" value={formData.city} onChange={handleChange} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="Full Address" name="customer_address" value={formData.customer_address} onChange={handleChange} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Section 2: Technical Specs */}
        <Typography variant="subtitle2" fontWeight={800} color="#0B3A63" mb={2}>
          2. Solar System Hardware Specifications
        </Typography>

        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" type="number" label="System Capacity (kWp) *" name="system_capacity_kw" value={formData.system_capacity_kw} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" select label="System Type" name="system_type" value={formData.system_type} onChange={handleChange}>
              <MenuItem value="On-Grid">On-Grid Net-Metered</MenuItem>
              <MenuItem value="Off-Grid">Off-Grid (Battery)</MenuItem>
              <MenuItem value="Hybrid">Hybrid System</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" label="Panel Brand" name="panel_brand" value={formData.panel_brand} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Panel Type / Specs" name="panel_type" value={formData.panel_type} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Inverter Brand & Model" name="inverter_brand" value={formData.inverter_brand} onChange={handleChange} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Section 3: Commercial & Pricing */}
        <Typography variant="subtitle2" fontWeight={800} color="#0B3A63" mb={2}>
          3. Commercial EPC Pricing & Subsidy Breakdown
        </Typography>

        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Base EPC System Cost (₹)"
              name="base_price"
              value={formData.base_price}
              onChange={handleChange}
              InputProps={{ startAdornment: <InputAdornment position="start"><CurrencyRupeeIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Structure & BOS Installation (₹)"
              name="structure_installation_cost"
              value={formData.structure_installation_cost}
              onChange={handleChange}
              InputProps={{ startAdornment: <InputAdornment position="start"><CurrencyRupeeIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Discount Amount (₹)"
              name="discount_amount"
              value={formData.discount_amount}
              onChange={handleChange}
              InputProps={{ startAdornment: <InputAdornment position="start"><CurrencyRupeeIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" type="number" label="GST Rate (%)" name="gst_rate" value={formData.gst_rate} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="PM Surya Ghar Subsidy (₹)"
              name="subsidy_amount"
              value={formData.subsidy_amount}
              onChange={handleChange}
              InputProps={{ startAdornment: <InputAdornment position="start"><CurrencyRupeeIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
            />
          </Grid>
        </Grid>

        {/* Live Calculation Summary */}
        <Paper elevation={0} sx={{ p: 2.5, bgcolor: "#F0F7FF", borderRadius: "14px", border: "1px solid #BAE6FD", mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="#64748B" fontWeight={700}>Subtotal Before GST</Typography>
              <Typography variant="subtitle1" fontWeight={800} color="#0B3A63">₹{subtotalBeforeGst.toLocaleString("en-IN")}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="#64748B" fontWeight={700}>GST ({formData.gst_rate}%)</Typography>
              <Typography variant="subtitle1" fontWeight={800} color="#0F172A">₹{gstAmount.toLocaleString("en-IN")}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="#64748B" fontWeight={700}>Total Project Cost</Typography>
              <Typography variant="subtitle1" fontWeight={900} color="#005BAC">₹{totalAmount.toLocaleString("en-IN")}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="#15803D" fontWeight={700}>Net Customer Investment</Typography>
              <Typography variant="subtitle1" fontWeight={900} color="#16A34A">₹{netPayable.toLocaleString("en-IN")}</Typography>
            </Grid>
          </Grid>
        </Paper>

        <Divider sx={{ my: 3 }} />

        {/* Section 4: Status & Terms */}
        <Typography variant="subtitle2" fontWeight={800} color="#0B3A63" mb={2}>
          4. Proposal Status & Validity
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" select label="Quotation Status" name="status" value={formData.status} onChange={handleChange}>
              <MenuItem value="Draft">Draft</MenuItem>
              <MenuItem value="Sent">Sent to Customer</MenuItem>
              <MenuItem value="Accepted">Accepted by Customer</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
              <MenuItem value="Expired">Expired</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" type="date" label="Valid Until" name="valid_until" value={formData.valid_until} onChange={handleChange} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={2} size="small" label="Special Terms & Conditions" name="terms_and_conditions" value={formData.terms_and_conditions} onChange={handleChange} />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, borderTop: "1px solid #E2E8F0", pt: 2 }}>
        <Button onClick={onClose} sx={{ color: "#64748B", fontWeight: 700 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          startIcon={<SaveIcon />}
          sx={{ bgcolor: "#005BAC", color: "#FFFFFF", fontWeight: 800, borderRadius: "10px", px: 4, "&:hover": { bgcolor: "#0B3A63" } }}
        >
          {saving ? "Saving Changes..." : "Save Quotation Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditQuotationModal;
