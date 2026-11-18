import {useAuth} from "../../context/AuthContext";
import api from "../../api/axios";
import { useState, useEffect } from "react";
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
  const {user}=useAuth();
  const managerMode=Number(user?.role_id)===2;
  const [team,setTeam]=useState([]);
  useEffect(()=>{if(open && managerMode) api.get("/users/team").then(r=>setTeam(r.data.data||[])).catch(()=>toast.error("Team could not be loaded."));},[open,managerMode]);
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
    lead_source: "",
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

    if(managerMode && !formData.assigned_to) return toast.error("Choose a salesperson in your team.");
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
      lead_source: "",
    notes: "",
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={() => !saving && handleClose()} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "12px" } }}>
      <DialogTitle sx={{ bgcolor: COLORS.primary, color: "#FFFFFF", py: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <PersonAddOutlinedIcon />
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem" }}>
          Add customer
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3 }}>
          {managerMode && <TextField select required fullWidth size="small" label="Assigned salesperson" name="assigned_to" value={formData.assigned_to||""} onChange={handleChange} sx={{mb:2}}>{team.map(rep=><MenuItem key={rep.id} value={rep.id}>{rep.full_name}</MenuItem>)}</TextField>}
          <TextField fullWidth size="small" label="Lead source" name="lead_source" placeholder="e.g. Referral, Website, Meta Ads" value={formData.lead_source || ""} onChange={handleChange} sx={{mb:2}}/>
          <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            1. Primary Information
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.5, mb: 2.5 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                required
                fullWidth
                size="small"
                label="Full Customer / Entity Name"
                placeholder="e.g. Ramesh Kumar"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                required
                fullWidth
                size="small"
                label="Mobile Number (Primary)"
                name="mobile_number"
                value={formData.mobile_number}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Alternate Phone"
                placeholder="e.g. 9876543211"
                name="alternate_number"
                value={formData.alternate_number}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="email"
                label="Email Address"
                placeholder="e.g. ramesh@example.com"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="GSTIN (Optional, for Business)"
                placeholder="e.g. 08AAAAA0000A1Z5"
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
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="Site Full Address"
                placeholder="e.g. 124, Sunrise Enclave, Sector 5"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
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
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="State"
                placeholder="e.g. Rajasthan"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Pincode"
                placeholder="e.g. 302021"
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
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="CA / Consumer Number"
                name="electricity_consumer_number"
                value={formData.electricity_consumer_number}
                onChange={handleChange}
                placeholder="e.g. 10023456789"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Discom Provider"
                name="discom_name"
                value={formData.discom_name}
                onChange={handleChange}
                placeholder="e.g. JVVNL / BSES / TPDDL"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Sanctioned Load (kW)"
                placeholder="e.g. 5.0"
                name="sanctioned_load_kw"
                value={formData.sanctioned_load_kw}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                label="Special Notes / Remarks"
                placeholder="e.g. Customer interested in 5kW residential rooftop solar"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${COLORS.border}` }}>
          <Button onClick={handleClose} disabled={saving} sx={{ color: COLORS.textSecondary, textTransform: "none", fontWeight: 600 }}>
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
