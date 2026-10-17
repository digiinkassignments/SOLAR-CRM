import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import toast from "react-hot-toast";
import { createCustomer } from "../../services/customerService";

const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  border: "#E2E8F0",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
};

export default function AddCustomerModal({ open, onClose, onCustomerCreated }) {
  const [formData, setFormData] = useState({
    customer_name: "",
    mobile_number: "",
    alternate_number: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    electricity_consumer_number: "",
    discom_name: "",
    sanctioned_load_kw: "",
    customer_gstin: "",
    solar_requirement: "Residential",
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_name.trim()) {
      return toast.error("Customer name is required");
    }
    if (!formData.mobile_number.trim()) {
      return toast.error("Mobile number is required");
    }

    setSaving(true);
    try {
      const res = await createCustomer(formData);
      if (res?.success) {
        toast.success(`Customer ${res.data?.customer_code || ""} created successfully!`);
        onCustomerCreated?.();
        handleClose();
      } else {
        toast.error(res?.message || "Failed to create customer");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error creating customer");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      customer_name: "",
      mobile_number: "",
      alternate_number: "",
      email: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      electricity_consumer_number: "",
      discom_name: "",
      sanctioned_load_kw: "",
      customer_gstin: "",
      solar_requirement: "Residential",
      notes: "",
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "12px" } }}>
      <DialogTitle sx={{ bgcolor: COLORS.primary, color: "#FFFFFF", py: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <PersonAddOutlinedIcon />
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem" }}>
          + Add New Customer Record
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            1. Primary Information
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.5, mb: 2.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                size="small"
                label="Full Customer / Entity Name"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                size="small"
                label="Mobile Number (Primary)"
                name="mobile_number"
                value={formData.mobile_number}
                onChange={handleChange}
                placeholder="10-digit mobile"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Alternate Phone"
                name="alternate_number"
                value={formData.alternate_number}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="email"
                label="Email Address"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Solar Requirement Category"
                name="solar_requirement"
                value={formData.solar_requirement}
                onChange={handleChange}
              >
                <MenuItem value="Residential">Residential (Home Rooftop)</MenuItem>
                <MenuItem value="Commercial">Commercial (Office / Factory)</MenuItem>
                <MenuItem value="Industrial">Industrial (Heavy Power)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="GSTIN (Optional, for Business)"
                name="customer_gstin"
                value={formData.customer_gstin}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            2. Site / Installation Address
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.5, mb: 2.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Site Full Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            3. Electricity Grid & Discom Info
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.5, mb: 1 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="CA / Consumer Number"
                name="electricity_consumer_number"
                value={formData.electricity_consumer_number}
                onChange={handleChange}
                placeholder="From Electricity Bill"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Discom Provider"
                name="discom_name"
                value={formData.discom_name}
                onChange={handleChange}
                placeholder="e.g. BSES, TPDDL, MSEDCL"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Sanctioned Load (kW)"
                name="sanctioned_load_kw"
                value={formData.sanctioned_load_kw}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                label="Special Notes / Remarks"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${COLORS.border}` }}>
          <Button onClick={handleClose} sx={{ color: COLORS.textSecondary, textTransform: "none", fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving && <CircularProgress size={16} sx={{ color: "#FFFFFF" }} />}
            sx={{
              bgcolor: COLORS.primary,
              "&:hover": { bgcolor: COLORS.primaryDark },
              textTransform: "none",
              fontWeight: 700,
              px: 3,
            }}
          >
            {saving ? "Saving Customer..." : "Save Customer"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
