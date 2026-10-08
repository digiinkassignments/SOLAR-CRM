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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import api from "../../api/axios";
import toast from "react-hot-toast";

const CreateQuotationModal = ({ open, onClose, calcData = null, leadData = null }) => {
  const [loading, setLoading] = useState(false);
  const [leadsList, setLeadsList] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Commercial Spec Form
  const [systemCapacityKw, setSystemCapacityKw] = useState(3.0);
  const [systemType, setSystemType] = useState("On-Grid");
  const [panelBrand, setPanelBrand] = useState("Waaree Mono PERC");
  const [panelType, setPanelType] = useState("Mono PERC 550W Half-Cut");
  const [inverterBrand, setInverterBrand] = useState("Growatt / Solis");
  const [structureType, setStructureType] = useState("Elevated GI High-Grade Structure");
  
  const [basePrice, setBasePrice] = useState(150000);
  const [structureCost, setStructureCost] = useState(15000);
  const [gstRate, setGstRate] = useState(13.8);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [subsidyAmount, setSubsidyAmount] = useState(78000);

  // Result state after creation
  const [createdQuotation, setCreatedQuotation] = useState(null);

  useEffect(() => {
    if (open) {
      setCreatedQuotation(null);
      fetchLeads();
    }
  }, [open]);

  useEffect(() => {
    if (calcData) {
      const kw = calcData.recommended_kw || 3.0;
      setSystemCapacityKw(kw);
      setSubsidyAmount(calcData.subsidy_amount || 0);
      const gross = calcData.gross_cost || Math.round(kw * 50000);
      setBasePrice(gross);

      if (calcData.structured?.system) {
        const sys = calcData.structured.system;
        if (sys.panel_brand) setPanelBrand(sys.panel_brand);
        if (sys.panel_model) setPanelType(sys.panel_model);
        if (sys.inverter_brand) setInverterBrand(sys.inverter_brand);
      }
    }
    if (leadData) {
      setSelectedLeadId(leadData.id || "");
      setCustomerName(leadData.customer_name || "");
      setCustomerEmail(leadData.email || "");
      setCustomerPhone(leadData.mobile_number || leadData.phone || "");
      setCustomerAddress(leadData.address || "");
      setCity(leadData.city || "");
      setState(leadData.state || "");
    }
  }, [calcData, leadData, open]);

  const fetchLeads = async () => {
    try {
      const res = await api.get("/leads?limit=150");
      if (res.data?.success) {
        setLeadsList(res.data.data || []);
      }
    } catch {
      // ignore
    }
  };

  const handleLeadSelect = (leadId) => {
    setSelectedLeadId(leadId);
    const lead = leadsList.find((l) => l.id === leadId);
    if (lead) {
      setCustomerName(lead.customer_name || "");
      setCustomerEmail(lead.email || "");
      setCustomerPhone(lead.mobile_number || lead.phone || "");
      setCustomerAddress(lead.address || "");
      setCity(lead.city || "");
      setState(lead.state || "");
    }
  };

  // Live total calculations
  const subtotalBeforeGst = Math.max(0, (Number(basePrice) + Number(structureCost)) - Number(discountAmount));
  const gstAmount = Math.round((subtotalBeforeGst * Number(gstRate)) / 100);
  const totalAmount = subtotalBeforeGst + gstAmount;
  const netPayable = Math.max(0, totalAmount - Number(subsidyAmount));

  const handleSubmit = async () => {
    if (!customerName || !customerPhone || !systemCapacityKw) {
      toast.error("Customer name, phone, and capacity are required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        lead_id: selectedLeadId || null,
        calculation_id: calcData?.id || null,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        city,
        state,
        system_capacity_kw: systemCapacityKw,
        system_type: systemType,
        panel_brand: panelBrand,
        panel_type: panelType,
        panel_count: calcData?.panel_count || Math.ceil((systemCapacityKw * 1000) / 550),
        inverter_brand: inverterBrand,
        inverter_capacity_kw: systemCapacityKw,
        structure_type: structureType,
        base_price: basePrice,
        structure_installation_cost: structureCost,
        gst_rate: gstRate,
        discount_amount: discountAmount,
        subsidy_amount: subsidyAmount,
        annual_generation_kwh: calcData?.annual_generation_kwh || Math.round(systemCapacityKw * 1450),
        annual_savings: calcData?.annual_savings || Math.round(systemCapacityKw * 1450 * 8),
        payback_years: calcData?.payback_years || 2.5,
        twenty_five_year_savings: calcData?.twenty_five_year_savings || 750000,
      };

      const res = await api.post("/quotations", payload);
      if (res.data?.success) {
        toast.success("Quotation generated successfully!");
        setCreatedQuotation(res.data.data);
      }
    } catch (err) {
      console.error("Create quotation error:", err);
      toast.error(err.response?.data?.message || "Failed to create quotation");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPublicLink = () => {
    if (!createdQuotation?.public_token) return;
    const fullUrl = `${window.location.origin}/quote/${createdQuotation.public_token}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Public quotation link copied to clipboard!");
  };

  const handleCloseDialog = () => {
    setCreatedQuotation(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", pb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#0B3A63" }}>
            Generate Dynamic Web Proposal
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748B" }}>
            Creates official quotation and customer dynamic web page link
          </Typography>
        </Box>
        <IconButton onClick={handleCloseDialog}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {createdQuotation ? (
          <Box sx={{ py: 3, textAlign: "center" }}>
            <CheckCircleOutlinedIcon sx={{ fontSize: 64, color: "#22C55E", mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0B3A63", mb: 1 }}>
              Proposal Created Successfully!
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B", mb: 3 }}>
              Quotation Number: <strong>{createdQuotation.quotation_number}</strong>
            </Typography>

            <Alert severity="success" sx={{ mb: 3, borderRadius: "12px", textAlign: "left" }}>
              Dynamic Web Proposal Page is live and accessible without requiring customer login!
            </Alert>

            <Paper elevation={0} sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0", mb: 3, textAlign: "left" }}>
              <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600 }}>
                Public Dynamic Link:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#005BAC", wordBreak: "break-all" }}>
                {window.location.origin}/quote/{createdQuotation.public_token}
              </Typography>
            </Paper>

            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyPublicLink}
                sx={{ borderRadius: "10px", fontWeight: 700 }}
              >
                Copy Link
              </Button>
              <Button
                variant="contained"
                startIcon={<OpenInNewIcon />}
                onClick={() => window.open(`/quote/${createdQuotation.public_token}`, "_blank")}
                sx={{ bgcolor: "#005BAC", color: "#FFFFFF", borderRadius: "10px", fontWeight: 700 }}
              >
                Open Proposal Page
              </Button>
            </Stack>
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* Lead Select / Customer Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0B3A63", mb: 1.5 }}>
                1. Customer & Lead Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Select Existing Lead (Optional)"
                    value={selectedLeadId}
                    onChange={(e) => handleLeadSelect(e.target.value)}
                  >
                    <MenuItem value="">-- Create Standalone Proposal --</MenuItem>
                    {leadsList.map((lead) => (
                      <MenuItem key={lead.id} value={lead.id}>
                        {lead.customer_name} ({lead.mobile_number})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Customer Full Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Mobile Number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* System Specifications */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0B3A63", mb: 1.5 }}>
                2. System Specifications
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    required
                    label="Capacity (kW)"
                    type="number"
                    value={systemCapacityKw}
                    onChange={(e) => setSystemCapacityKw(Number(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    fullWidth
                    label="System Type"
                    value={systemType}
                    onChange={(e) => setSystemType(e.target.value)}
                  >
                    <MenuItem value="On-Grid">On-Grid</MenuItem>
                    <MenuItem value="Off-Grid">Off-Grid</MenuItem>
                    <MenuItem value="Hybrid">Hybrid</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Panel Brand"
                    value={panelBrand}
                    onChange={(e) => setPanelBrand(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Inverter Brand & Specs"
                    value={inverterBrand}
                    onChange={(e) => setInverterBrand(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Structure Type"
                    value={structureType}
                    onChange={(e) => setStructureType(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Financial Commercials */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0B3A63", mb: 1.5 }}>
                3. Financial Breakdown (₹)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Base System Price"
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Structure & Installation"
                    type="number"
                    value={structureCost}
                    onChange={(e) => setStructureCost(Number(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="GST Rate (%)"
                    type="number"
                    value={gstRate}
                    onChange={(e) => setGstRate(Number(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="PM Surya Ghar Subsidy (-₹)"
                    type="number"
                    value={subsidyAmount}
                    onChange={(e) => setSubsidyAmount(Number(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Discount (-₹)"
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  />
                </Grid>
              </Grid>

              {/* Total Summary Box */}
              <Box sx={{ mt: 3, p: 2.5, bgcolor: "#0B3A63", color: "#FFFFFF", borderRadius: "12px" }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" sx={{ color: "#93C5FD" }}>Subtotal</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>₹{subtotalBeforeGst.toLocaleString("en-IN")}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" sx={{ color: "#93C5FD" }}>GST ({gstRate}%)</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>₹{gstAmount.toLocaleString("en-IN")}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" sx={{ color: "#86EFAC" }}>Subsidy</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#86EFAC" }}>- ₹{Number(subsidyAmount).toLocaleString("en-IN")}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" sx={{ color: "#38BDF8", fontWeight: 700 }}>Net Payable</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#38BDF8" }}>₹{netPayable.toLocaleString("en-IN")}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Stack>
        )}
      </DialogContent>

      {!createdQuotation && (
        <DialogActions sx={{ p: 2.5, borderTop: "1px solid #E2E8F0" }}>
          <Button onClick={handleCloseDialog} sx={{ color: "#64748B", fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{ bgcolor: "#005BAC", color: "#FFFFFF", fontWeight: 700, px: 3, borderRadius: "10px", "&:hover": { bgcolor: "#0B3A63" } }}
          >
            {loading ? "Generating..." : "Generate Web Proposal"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default CreateQuotationModal;
