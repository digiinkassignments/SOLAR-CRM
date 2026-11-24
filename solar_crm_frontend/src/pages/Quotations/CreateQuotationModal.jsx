import QuotationPaymentSchedule from './QuotationPaymentSchedule';
import { solarTax } from "../../utils/solarTax";
import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  MenuItem,
  InputAdornment,
  IconButton,
  Stack,
  Alert,
  Paper,
  Chip,
  Tabs,
  Tab,
  Divider,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import api from "../../api/axios";
import toast from "react-hot-toast";
import { getStockItems } from "../../services/stockService";

const currency = (val) =>
  "₹ " +
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(val) || 0);

const STANDARD_SOLAR_TERMS = `1. 25-Year linear performance warranty on Solar PV Modules.
2. 5-Year comprehensive on-site warranty on Solar Inverter and Balance of System (BOS).
3. Payment terms: 20% advance booking, 70% before material dispatch, 10% after commissioning.
4. Net-metering approval and bi-directional meter installation are subject to DISCOM timelines.
5. Offer rates are valid for 30 days from the proposal date.`;

const STANDARD_SOLAR_SCOPE = `Turnkey supply, civil foundation / structure erection, ACDB/DCDB wiring, dual earthing pits, lightning arrestor installation, inverter synchronisation, testing, and complete DISCOM net-metering liaisoning.`;

const CAPACITY_PRESETS = [3, 5, 8, 10, 15];

const QuotationDialog = ({
  open,
  onClose,
  calcData = null,
  leadData = null,
  onQuotationCreated = null,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [leadsList, setLeadsList] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState(leadData?.id || "");

  // Customer Details
  const [customerName, setCustomerName] = useState(leadData?.customer_name || "");
  const [customerEmail, setCustomerEmail] = useState(leadData?.email || "");
  const [customerPhone, setCustomerPhone] = useState(
    leadData?.mobile_number || leadData?.phone || ""
  );
  const [customerAddress, setCustomerAddress] = useState(leadData?.address || "");
  const [city, setCity] = useState(leadData?.city || "");
  const [state, setState] = useState(leadData?.state || "");
  const [pincode, setPincode] = useState(leadData?.pincode || "");

  // Technical Specs
  const [systemCapacityKw, setSystemCapacityKw] = useState(
    leadData ? Number(leadData.required_kw) || "" : calcData?.recommended_kw || ""
  );
  const [systemType, setSystemType] = useState("On-Grid");
  const [panelBrand, setPanelBrand] = useState(
    calcData?.structured?.system?.panel_brand || ""
  );
  const [panelType, setPanelType] = useState(
    calcData?.structured?.system?.panel_model || ""
  );
  const [inverterBrand, setInverterBrand] = useState(
    calcData?.structured?.system?.inverter_brand || ""
  );
  const [structureType, setStructureType] = useState("");

  // Commercial / Pricing
  const [gstMode, setGstMode] = useState("solar_composite");
  const [discountAmount, setDiscountAmount] = useState("");
  const [subsidyAmount, setSubsidyAmount] = useState(
    calcData?.subsidy_amount || ""
  );

  // Line items
  const [stockItems, setStockItems] = useState([]);
  const [lineItems, setLineItems] = useState(() => [
    {
      name: leadData || calcData ? "Solar EPC System" : "",
      description:
        leadData || calcData
          ? "Supply, installation and net-metering commissioning of rooftop solar system"
          : "",
      unit: "System",
      quantity: 1,
      unit_price:
        leadData?.quotation_amount ||
        calcData?.gross_cost ||
        (leadData?.required_kw ? Math.round(leadData.required_kw * 50000) : ""),
      gst_rate: "",
      hsn_code: "8443",
      stock_item_id: null,
    },
  ]);

  // Validity & Terms
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [quotationNotes, setQuotationNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [paymentSchedule, setPaymentSchedule] = useState([]);

  // Post-creation State
  const [createdQuotation, setCreatedQuotation] = useState(null);

  // Fetch leads and stock catalog on open
  useEffect(() => {
    if (!open) return;
    let active = true;
    api
      .get("/leads?limit=150")
      .then((res) => {
        if (active && res.data?.success) setLeadsList(res.data.data || []);
      })
      .catch(() => {
        if (active) setLeadsList([]);
      });

    getStockItems({ page: 1, limit: 200, sort_by: "name", sort_order: "ASC" })
      .then((res) => {
        if (active) setStockItems(res?.data || []);
      })
      .catch(() => {
        if (active) setStockItems([]);
      });

    return () => {
      active = false;
    };
  }, [open]);

  const selectableLeads = useMemo(() => {
    if (leadData?.id && !leadsList.some((l) => String(l.id) === String(leadData.id))) {
      return [leadData, ...leadsList];
    }
    return leadsList;
  }, [leadData, leadsList]);

  const handleLeadSelect = (leadId) => {
    setSelectedLeadId(leadId);
    const lead = selectableLeads.find((l) => String(l.id) === String(leadId));
    if (lead) {
      setCustomerName(lead.customer_name || "");
      setCustomerEmail(lead.email || "");
      setCustomerPhone(lead.mobile_number || lead.phone || "");
      setCustomerAddress(lead.address || "");
      setCity(lead.city || "");
      setState(lead.state || "");
      setPincode(lead.pincode || "");
      if (lead.required_kw) {
        setSystemCapacityKw(Number(lead.required_kw));
        // Auto-recommend subsidy for residential sizes
        if (!subsidyAmount) {
          const kw = Number(lead.required_kw);
          if (kw <= 1) setSubsidyAmount(30000);
          else if (kw <= 2) setSubsidyAmount(60000);
          else setSubsidyAmount(78000);
        }
      }
    }
  };

  // Quick capacity picker helper
  const handleSelectCapacity = (kw) => {
    setSystemCapacityKw(kw);
    // If unit price is empty, suggest default ~₹50,000/kW
    if (lineItems.length === 1 && (!lineItems[0].unit_price || lineItems[0].unit_price === "")) {
      updateLine(0, "unit_price", Math.round(kw * 50000));
      if (!lineItems[0].name) {
        updateLine(0, "name", `${kw} kW Rooftop Solar System`);
      }
    }
    // Auto suggest central subsidy under PM Surya Ghar
    if (!subsidyAmount || subsidyAmount === 0) {
      if (kw <= 1) setSubsidyAmount(30000);
      else if (kw <= 2) setSubsidyAmount(60000);
      else setSubsidyAmount(78000);
    }
  };

  // Line item manipulation
  const updateLine = (idx, key, value) => {
    setLineItems((items) =>
      items.map((item, i) => (i === idx ? { ...item, [key]: value } : item))
    );
  };

  const selectStock = (index, stockId) => {
    const stock = stockItems.find((s) => String(s.id) === String(stockId));
    if (!stock) {
      updateLine(index, "stock_item_id", null);
      return;
    }
    setLineItems((items) =>
      items.map((item, i) =>
        i === index
          ? {
              ...item,
              stock_item_id: stock.id,
              name: stock.name,
              description: stock.description || "",
              item_code: stock.item_code,
              unit: stock.unit || "Piece",
              unit_price: Number(stock.unit_price) || 0,
              gst_rate: String(stock.gst_rate ?? ""),
              hsn_code: stock.hsn_code || "",
            }
          : item
      )
    );
  };

  // Financial Calculations
  const itemSubtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => {
      const q = Math.max(0, Number(item.quantity) || 0);
      const p = Math.max(0, Number(item.unit_price) || 0);
      return sum + Math.round(q * p * 100) / 100;
    }, 0);
  }, [lineItems]);

  const effectiveDiscount = Math.min(
    itemSubtotal,
    Math.max(0, Number(discountAmount) || 0)
  );
  const subtotalBeforeGst = Math.max(0, itemSubtotal - effectiveDiscount);
  const tax = solarTax({
    mode: gstMode,
    subtotal: itemSubtotal,
    discount: effectiveDiscount,
    items: lineItems,
  });
  const gstAmount = tax.gst;
  const totalAmount = Math.round((subtotalBeforeGst + gstAmount) * 100) / 100;
  const netPayable = Math.max(0, totalAmount - Number(subsidyAmount || 0));

  // Validation
  const validateCurrentTab = (tab) => {
    if (tab === 0) {
      if (!customerName.trim()) {
        toast.error("Please enter the customer name.");
        return false;
      }
      if (!customerPhone.trim()) {
        toast.error("Please enter the customer's phone number.");
        return false;
      }
      if (!systemCapacityKw || Number(systemCapacityKw) <= 0) {
        toast.error("Please enter a valid solar system capacity in kW.");
        return false;
      }
    } else if (tab === 1) {
      if (!lineItems.length) {
        toast.error("Please add at least one line item.");
        return false;
      }
      for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i];
        if (!item.name.trim()) {
          toast.error(`Please provide a name for Item #${i + 1}.`);
          return false;
        }
        if (Number(item.quantity) <= 0) {
          toast.error(`Quantity for Item #${i + 1} must be greater than 0.`);
          return false;
        }
        if (gstMode === "itemised" && (item.gst_rate === "" || item.gst_rate === undefined)) {
          toast.error(`Please enter a GST % for Item #${i + 1} or switch to Composite GST.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleNextTab = () => {
    if (validateCurrentTab(activeTab)) {
      setActiveTab((prev) => Math.min(prev + 1, 2));
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentTab(0) || !validateCurrentTab(1)) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        lead_id: selectedLeadId || null,
        calculation_id: calcData?.id || null,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        customer_address: customerAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        system_capacity_kw: Number(systemCapacityKw),
        system_type: systemType,
        panel_brand: panelBrand.trim(),
        panel_type: panelType.trim(),
        panel_count:
          calcData?.panel_count || Math.ceil((Number(systemCapacityKw) * 1000) / 550),
        inverter_brand: inverterBrand.trim(),
        inverter_capacity_kw: Number(systemCapacityKw),
        structure_type: structureType.trim(),
        base_price: itemSubtotal,
        structure_installation_cost: 0,
        gst_mode: gstMode,
        gst_rate: subtotalBeforeGst
          ? Number(((gstAmount / subtotalBeforeGst) * 100).toFixed(2))
          : 0,
        discount_amount: effectiveDiscount,
        line_items: lineItems.map(
          ({
            name,
            description,
            unit,
            quantity,
            unit_price,
            gst_rate,
            hsn_code,
            item_code,
            stock_item_id,
          }) => ({
            name: name.trim(),
            description: description?.trim() || "",
            unit: unit?.trim() || "Piece",
            quantity: Number(quantity),
            unit_price: Number(unit_price),
            gst_rate: Number(gst_rate || 0),
            hsn_code: hsn_code?.trim() || "",
            item_code: item_code?.trim() || "",
            stock_item_id: stock_item_id || null,
          })
        ),
        valid_until: validUntil || null,
        terms_and_conditions: terms.trim(),
        payment_schedule: paymentSchedule,
        notes: quotationNotes.trim(),
        subsidy_amount: Number(subsidyAmount || 0),
        annual_generation_kwh:
          calcData?.annual_generation_kwh ||
          Math.round(Number(systemCapacityKw) * 1450),
        annual_savings:
          calcData?.annual_savings ||
          Math.round(Number(systemCapacityKw) * 1450 * 8),
        payback_years: calcData?.payback_years || 2.5,
        twenty_five_year_savings:
          calcData?.twenty_five_year_savings ||
          Math.round(Number(systemCapacityKw) * 1450 * 8 * 25 * 0.75),
      };

      const res = await api.post("/quotations", payload);
      if (res.data?.success) {
        toast.success(res.data.message || "Quotation generated successfully!");
        setCreatedQuotation(res.data.data);
        if (onQuotationCreated) {
          onQuotationCreated(res.data.data);
        }
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

  const handleShareWhatsApp = () => {
    if (!createdQuotation) return;
    const phone = (createdQuotation.customer_phone || "").replace(/[^0-9]/g, "");
    const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
    const publicUrl = `${window.location.origin}/quote/${createdQuotation.public_token}`;
    const msg = `Hello ${createdQuotation.customer_name},\n\nHere is your official solar energy proposal for ${createdQuotation.system_capacity_kw} kW ${createdQuotation.system_type || "Solar"} System.\n\n⚡ Proposal Details:\n• System Capacity: ${createdQuotation.system_capacity_kw} kW\n• Total Project Cost: ₹${Math.round(createdQuotation.total_amount).toLocaleString("en-IN")}\n• Govt Subsidy (DBT): ₹${Math.round(createdQuotation.subsidy_amount || 0).toLocaleString("en-IN")}\n• Net Payable: ₹${Math.round(createdQuotation.net_payable_amount || createdQuotation.total_amount).toLocaleString("en-IN")}\n\n📄 View Full Proposal & Download PDF:\n${publicUrl}\n\nRegards,\nSolar Energy Team`;
    window.open(
      `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(
        msg
      )}`,
      "_blank"
    );
  };

  const handleCloseDialog = () => {
    setCreatedQuotation(null);
    setActiveTab(0);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!loading) handleCloseDialog();
      }}
      maxWidth={false}
      fullWidth
      aria-labelledby="create-quotation-title"
      slotProps={{
        paper: {
          sx: {
            m: { xs: 0, sm: 2 },
            width: { xs: "100%", sm: "calc(100% - 32px)" },
            maxWidth: 1180,
            height: { xs: "100dvh", sm: "92dvh" },
            maxHeight: { xs: "100dvh", sm: "calc(100dvh - 32px)" },
            borderRadius: { xs: 0, sm: "16px" },
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
          },
        },
      }}
    >
      {/* HEADER */}
      <DialogTitle
        component="div"
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          borderBottom: "1px solid #E2E8F0",
          bgcolor: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              width: 44,
              height: 44,
              flexShrink: 0,
              bgcolor: "#EFF6FF",
              color: "#005BAC",
              borderRadius: "12px",
              border: "1px solid #BFDBFE",
            }}
          >
            <DescriptionOutlinedIcon />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              id="create-quotation-title"
              component="h1"
              sx={{
                fontSize: { xs: "1.1rem", sm: "1.25rem" },
                color: "#0F172A",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.25,
              }}
            >
              {createdQuotation ? "Quotation Generated!" : "Create Solar Quotation"}
            </Typography>
            <Typography sx={{ color: "#64748B", fontSize: "0.78rem", mt: 0.2 }}>
              {createdQuotation
                ? `Proposal #${createdQuotation.quotation_number} is ready to view, download and share.`
                : "Fast 3-step proposal generator with automatic PM Surya Ghar subsidy and 70:30 GST calculation."}
            </Typography>
          </Box>
        </Stack>

        <IconButton
          aria-label="Close"
          disabled={loading}
          onClick={handleCloseDialog}
          sx={{
            flexShrink: 0,
            color: "#64748B",
            bgcolor: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "10px",
            "&:hover": { bgcolor: "#F1F5F9" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* STEP NAVIGATION TABS (Shown when not in success view) */}
      {!createdQuotation && (
        <Box
          sx={{
            px: { xs: 1.5, sm: 3 },
            bgcolor: "#FFFFFF",
            borderBottom: "1px solid #E2E8F0",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 48,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.85rem",
                minHeight: 48,
                px: { xs: 1.5, sm: 2.5 },
                color: "#64748B",
                "&.Mui-selected": {
                  color: "#005BAC",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#005BAC",
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
            }}
          >
            <Tab
              icon={<PersonOutlinedIcon sx={{ fontSize: "1.1rem" }} />}
              iconPosition="start"
              label="1. Customer & System"
            />
            <Tab
              icon={<ReceiptLongIcon sx={{ fontSize: "1.1rem" }} />}
              iconPosition="start"
              label="2. Pricing & Items"
            />
            <Tab
              icon={<FactCheckOutlinedIcon sx={{ fontSize: "1.1rem" }} />}
              iconPosition="start"
              label="3. Scope & Terms"
            />
          </Tabs>
        </Box>
      )}

      {/* BODY CONTENT */}
      <DialogContent
        sx={{
          p: { xs: 1.5, sm: 3 },
          bgcolor: "#F8FAFC",
          overflowY: "auto",
          minHeight: 0,
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            bgcolor: "#FFFFFF",
            fontSize: "0.86rem",
          },
          "& .MuiInputLabel-root": { fontSize: "0.84rem" },
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#CBD5E1" },
          "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#94A3B8",
          },
        }}
      >
        {createdQuotation ? (
          /* ================= SUCCESS STATE ================= */
          <Paper
            elevation={0}
            sx={{
              maxWidth: 680,
              mx: "auto",
              my: { xs: 2, sm: 4 },
              p: { xs: 3, sm: 4 },
              border: "1px solid #E2E8F0",
              borderRadius: "16px",
              textAlign: "center",
              bgcolor: "#FFFFFF",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                bgcolor: "#DCFCE7",
                color: "#16A34A",
                display: "grid",
                placeItems: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <CheckCircleOutlinedIcon sx={{ fontSize: 42 }} />
            </Box>

            <Typography
              component="h2"
              sx={{ fontSize: "1.35rem", fontWeight: 800, color: "#0F172A" }}
            >
              Solar Proposal Created Successfully!
            </Typography>

            <Chip
              label={`Quotation No: ${createdQuotation.quotation_number}`}
              sx={{
                mt: 1,
                mb: 2.5,
                fontWeight: 750,
                fontSize: "0.85rem",
                bgcolor: "#EFF6FF",
                color: "#005BAC",
                border: "1px solid #BFDBFE",
              }}
            />

            {/* Proposal Key Metrics Card */}
            <Box
              sx={{
                p: 2,
                mb: 3,
                borderRadius: "12px",
                bgcolor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                gap: 2,
                textAlign: "left",
              }}
            >
              <Box>
                <Typography sx={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>
                  Customer
                </Typography>
                <Typography sx={{ fontSize: "0.88rem", color: "#0F172A", fontWeight: 750 }}>
                  {createdQuotation.customer_name}
                </Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "#64748B" }}>
                  {createdQuotation.customer_phone}
                </Typography>
              </Box>

              <Box>
                <Typography sx={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>
                  System Spec
                </Typography>
                <Typography sx={{ fontSize: "0.88rem", color: "#0F172A", fontWeight: 750 }}>
                  {createdQuotation.system_capacity_kw} kW {createdQuotation.system_type}
                </Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "#64748B" }}>
                  {createdQuotation.panel_brand || "Standard Panels"}
                </Typography>
              </Box>

              <Box>
                <Typography sx={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>
                  Net Payable
                </Typography>
                <Typography sx={{ fontSize: "1.05rem", color: "#16A34A", fontWeight: 800 }}>
                  {currency(
                    createdQuotation.net_payable_amount || createdQuotation.total_amount
                  )}
                </Typography>
                {createdQuotation.subsidy_amount > 0 && (
                  <Typography sx={{ fontSize: "0.72rem", color: "#005BAC" }}>
                    Incl. {currency(createdQuotation.subsidy_amount)} Govt Subsidy
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Public Link Box */}
            <Box
              sx={{
                p: 2,
                border: "1px dashed #CBD5E1",
                borderRadius: "10px",
                bgcolor: "#F8FAFC",
                mb: 3,
                textAlign: "left",
              }}
            >
              <Typography
                sx={{
                  color: "#64748B",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  mb: 0.5,
                }}
              >
                Customer Live Web Proposal Link
              </Typography>
              <Typography
                sx={{
                  color: "#005BAC",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  wordBreak: "break-all",
                }}
              >
                {window.location.origin}/quote/{createdQuotation.public_token}
              </Typography>
            </Box>

            {/* Actions Grid */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                gap: 1.5,
              }}
            >
              <Button
                variant="contained"
                startIcon={<WhatsAppIcon />}
                onClick={handleShareWhatsApp}
                sx={{
                  bgcolor: "#16A34A",
                  color: "#FFFFFF",
                  fontWeight: 750,
                  py: 1.2,
                  "&:hover": { bgcolor: "#15803D" },
                }}
              >
                Share on WhatsApp
              </Button>

              <Button
                variant="contained"
                startIcon={<OpenInNewIcon />}
                onClick={() =>
                  window.open(
                    `/quote/${createdQuotation.public_token}`,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                sx={{
                  bgcolor: "#0F172A",
                  color: "#FFFFFF",
                  fontWeight: 750,
                  py: 1.2,
                  "&:hover": { bgcolor: "#1E293B" },
                }}
              >
                View Customer Proposal
              </Button>

              <Button
                variant="outlined"
                startIcon={<PictureAsPdfOutlinedIcon />}
                onClick={() =>
                  window.open(
                    `/quote/${createdQuotation.public_token}?download=true`,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                sx={{
                  borderColor: "#CBD5E1",
                  color: "#0F172A",
                  fontWeight: 700,
                  py: 1.1,
                }}
              >
                Download PDF Proposal
              </Button>

              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyPublicLink}
                sx={{
                  borderColor: "#CBD5E1",
                  color: "#475569",
                  fontWeight: 700,
                  py: 1.1,
                }}
              >
                Copy Link
              </Button>
            </Box>
          </Paper>
        ) : (
          /* ================= MAIN 2-COLUMN WIZARD ================= */
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr 340px" },
              gap: { xs: 2, lg: 3 },
              alignItems: "start",
            }}
          >
            {/* LEFT COLUMN: ACTIVE STEP FORM */}
            <Box sx={{ minWidth: 0 }}>
              {/* TAB 0: CUSTOMER & SOLAR SYSTEM */}
              {activeTab === 0 && (
                <Stack spacing={2.5}>
                  {/* Customer Information Card */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2, sm: 2.75 },
                      borderRadius: "14px",
                      border: "1px solid #E2E8F0",
                      bgcolor: "#FFFFFF",
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "8px",
                          bgcolor: "#F1F5F9",
                          color: "#005BAC",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <PersonOutlinedIcon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#0F172A" }}>
                          Customer & Location Information
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "#64748B" }}>
                          Link an existing CRM lead or enter customer contact details
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack spacing={2}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Link Existing Lead (Optional)"
                        value={selectedLeadId}
                        onChange={(e) => handleLeadSelect(e.target.value)}
                        slotProps={{
                          select: {
                            displayEmpty: true,
                            MenuProps: { PaperProps: { sx: { maxHeight: 300 } } },
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>None · Standalone / Direct Customer Quotation</em>
                        </MenuItem>
                        {selectableLeads.map((l) => (
                          <MenuItem key={l.id} value={l.id}>
                            <strong>{l.customer_name}</strong> &nbsp;—&nbsp;{" "}
                            {l.mobile_number || l.phone || "No phone"} &nbsp;
                            {l.required_kw ? `(${l.required_kw} kW)` : ""}
                          </MenuItem>
                        ))}
                      </TextField>

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                          gap: 2,
                        }}
                      >
                        <TextField
                          required
                          fullWidth
                          size="small"
                          label="Customer Full Name *"
                          placeholder="e.g. Ramesh Kumar"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                        <TextField
                          required
                          fullWidth
                          size="small"
                          label="Mobile Number *"
                          type="tel"
                          placeholder="e.g. 9876543210"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                      </Box>

                      <TextField
                        fullWidth
                        size="small"
                        label="Email Address (Optional)"
                        type="email"
                        placeholder="e.g. ramesh@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                      />

                      <TextField
                        fullWidth
                        size="small"
                        multiline
                        minRows={2}
                        label="Site / Installation Address"
                        placeholder="e.g. 124, Sunrise Enclave, Sector 5"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                      />

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                          gap: 1.5,
                        }}
                      >
                        <TextField
                          fullWidth
                          size="small"
                          label="City"
                          placeholder="e.g. Jaipur"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="State"
                          placeholder="e.g. Rajasthan"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="PIN Code"
                          placeholder="e.g. 302021"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                        />
                      </Box>
                    </Stack>
                  </Paper>

                  {/* Solar System Specs Card */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2, sm: 2.75 },
                      borderRadius: "14px",
                      border: "1px solid #E2E8F0",
                      bgcolor: "#FFFFFF",
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "8px",
                          bgcolor: "#FEF3C7",
                          color: "#D97706",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <SolarPowerIcon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#0F172A" }}>
                          Solar System Specifications
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "#64748B" }}>
                          Proposed system capacity, equipment brands and structure type
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack spacing={2.25}>
                      {/* Capacity with Quick Chips */}
                      <Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                          <Typography sx={{ fontSize: "0.82rem", fontWeight: 750, color: "#0F172A" }}>
                            System Capacity (kW) *
                          </Typography>
                          <Typography sx={{ fontSize: "0.73rem", color: "#64748B" }}>
                            Quick preset options:
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.25 }}>
                          {CAPACITY_PRESETS.map((kw) => (
                            <Chip
                              key={kw}
                              clickable
                              size="small"
                              label={`${kw} kW`}
                              onClick={() => handleSelectCapacity(kw)}
                              variant={Number(systemCapacityKw) === kw ? "filled" : "outlined"}
                              sx={{
                                fontWeight: 700,
                                fontSize: "0.76rem",
                                bgcolor:
                                  Number(systemCapacityKw) === kw ? "#005BAC" : "#F8FAFC",
                                color:
                                  Number(systemCapacityKw) === kw ? "#FFFFFF" : "#334155",
                                borderColor: "#CBD5E1",
                                "&:hover": { bgcolor: "#005BAC", color: "#FFFFFF" },
                              }}
                            />
                          ))}
                        </Box>

                        <TextField
                          required
                          fullWidth
                          size="small"
                          type="number"
                          placeholder="e.g. 5.0"
                          value={systemCapacityKw}
                          onChange={(e) =>
                            setSystemCapacityKw(
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          slotProps={{
                            input: {
                              endAdornment: (
                                <InputAdornment position="end">
                                  <strong>kW</strong>
                                </InputAdornment>
                              ),
                            },
                          }}
                          helperText="Estimated generation: ~1,450 units/year per kW (based on standard Indian solar irradiance)."
                        />
                      </Box>

                      {/* System Type */}
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                          gap: 2,
                        }}
                      >
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="System Configuration"
                          value={systemType}
                          onChange={(e) => setSystemType(e.target.value)}
                        >
                          <MenuItem value="On-Grid">On-Grid (Grid-Tied · Most Popular)</MenuItem>
                          <MenuItem value="Hybrid">Hybrid (Solar + Battery Storage)</MenuItem>
                          <MenuItem value="Off-Grid">Off-Grid (Standalone Battery Bank)</MenuItem>
                        </TextField>

                        <TextField
                          fullWidth
                          size="small"
                          label="Mounting Structure Type"
                          placeholder="e.g. Elevated GI High-Grade Structure"
                          value={structureType}
                          onChange={(e) => setStructureType(e.target.value)}
                        />
                      </Box>

                      {/* Equipment Brands */}
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                          gap: 2,
                        }}
                      >
                        <TextField
                          fullWidth
                          size="small"
                          label="Solar Panel Brand"
                          placeholder="e.g. Waaree / Tata Power / Adani"
                          value={panelBrand}
                          onChange={(e) => setPanelBrand(e.target.value)}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Panel Model / Rating"
                          placeholder="e.g. 550W Mono PERC Half-Cut DCR"
                          value={panelType}
                          onChange={(e) => setPanelType(e.target.value)}
                        />
                      </Box>

                      <TextField
                        fullWidth
                        size="small"
                        label="Solar Inverter Brand & Model"
                        placeholder="e.g. Growatt / Solis / Sungrow 5kW Dual MPPT"
                        value={inverterBrand}
                        onChange={(e) => setInverterBrand(e.target.value)}
                      />
                    </Stack>
                  </Paper>
                </Stack>
              )}

              {/* TAB 1: PRICING, LINE ITEMS & TAX */}
              {activeTab === 1 && (
                <Stack spacing={2.5}>
                  {/* GST Scheme Card */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2, sm: 2.75 },
                      borderRadius: "14px",
                      border: "1px solid #E2E8F0",
                      bgcolor: "#FFFFFF",
                    }}
                  >
                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#0F172A", mb: 0.5 }}>
                      Tax & GST Computation Method
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "#64748B", mb: 2 }}>
                      Select whether this proposal qualifies under standard MNRE Rooftop Solar rules
                    </Typography>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        gap: 1.5,
                      }}
                    >
                      {/* Option 1: Solar Composite */}
                      <Box
                        onClick={() => setGstMode("solar_composite")}
                        sx={{
                          p: 2,
                          borderRadius: "10px",
                          border: `2px solid ${
                            gstMode === "solar_composite" ? "#005BAC" : "#E2E8F0"
                          }`,
                          bgcolor:
                            gstMode === "solar_composite" ? "#EFF6FF" : "#F8FAFC",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                          <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: "#0F172A" }}>
                            MNRE 70:30 Composite Rule
                          </Typography>
                          <Chip
                            label="Recommended"
                            size="small"
                            sx={{
                              bgcolor: "#16A34A",
                              color: "#FFFFFF",
                              fontWeight: 750,
                              fontSize: "0.68rem",
                              height: 20,
                            }}
                          />
                        </Stack>
                        <Typography sx={{ fontSize: "0.74rem", color: "#475569", lineHeight: 1.4 }}>
                          70% Goods @ 5% GST + 30% Services @ 18% GST. Effective aggregate GST = <strong>8.90%</strong>.
                        </Typography>
                      </Box>

                      {/* Option 2: Itemised */}
                      <Box
                        onClick={() => setGstMode("itemised")}
                        sx={{
                          p: 2,
                          borderRadius: "10px",
                          border: `2px solid ${
                            gstMode === "itemised" ? "#005BAC" : "#E2E8F0"
                          }`,
                          bgcolor: gstMode === "itemised" ? "#EFF6FF" : "#F8FAFC",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: "#0F172A", mb: 0.5 }}>
                          Itemised GST (Per Product)
                        </Typography>
                        <Typography sx={{ fontSize: "0.74rem", color: "#475569", lineHeight: 1.4 }}>
                          Specify custom GST percentage per line item (e.g., Panels @ 12%, Inverters @ 18%).
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>

                  {/* Line Items Card */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2, sm: 2.75 },
                      borderRadius: "14px",
                      border: "1px solid #E2E8F0",
                      bgcolor: "#FFFFFF",
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 2 }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#0F172A" }}>
                          Bill of Materials & Services
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "#64748B" }}>
                          Add turnkey package or individual items/services
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          setLineItems((items) => [
                            ...items,
                            {
                              name: "",
                              description: "",
                              unit: "Piece",
                              quantity: 1,
                              unit_price: "",
                              gst_rate: "",
                              hsn_code: "",
                              stock_item_id: null,
                            },
                          ])
                        }
                        sx={{
                          borderColor: "#005BAC",
                          color: "#005BAC",
                          fontWeight: 750,
                          fontSize: "0.78rem",
                          borderRadius: "8px",
                          textTransform: "none",
                        }}
                      >
                        Add Item
                      </Button>
                    </Stack>

                    <Stack spacing={2}>
                      {lineItems.map((item, index) => (
                        <Box
                          key={`item-${index}`}
                          sx={{
                            p: 2,
                            borderRadius: "10px",
                            border: "1px solid #E2E8F0",
                            bgcolor: "#FAFAFA",
                            position: "relative",
                          }}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mb: 1.5 }}
                          >
                            <Chip
                              label={`Item #${index + 1}`}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.72rem",
                                bgcolor: "#E2E8F0",
                                color: "#1E293B",
                              }}
                            />
                            {lineItems.length > 1 && (
                              <IconButton
                                size="small"
                                onClick={() =>
                                  setLineItems((items) =>
                                    items.filter((_, i) => i !== index)
                                  )
                                }
                                sx={{ color: "#EF4444" }}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Stack>

                          {/* Inventory Auto-Fill Picker */}
                          {stockItems.length > 0 && (
                            <Box sx={{ mb: 1.5 }}>
                              <TextField
                                select
                                fullWidth
                                size="small"
                                label="Fill from Warehouse Stock (Optional)"
                                value={item.stock_item_id || ""}
                                onChange={(e) => selectStock(index, e.target.value)}
                                slotProps={{
                                  select: {
                                    displayEmpty: true,
                                    MenuProps: { PaperProps: { sx: { maxHeight: 280 } } },
                                  },
                                }}
                              >
                                <MenuItem value="">
                                  <em>None · Custom Item or Service</em>
                                </MenuItem>
                                {stockItems.map((stock) => (
                                  <MenuItem key={stock.id} value={stock.id}>
                                    {stock.name}{" "}
                                    {stock.item_code ? `(${stock.item_code})` : ""} ·{" "}
                                    {currency(stock.unit_price)}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </Box>
                          )}

                          <Stack spacing={1.5}>
                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" },
                                gap: 1.5,
                              }}
                            >
                              <TextField
                                required
                                fullWidth
                                size="small"
                                label="Item / Service Name *"
                                placeholder="e.g. Solar EPC System / Mono PERC Panels"
                                value={item.name}
                                onChange={(e) =>
                                  updateLine(index, "name", e.target.value)
                                }
                              />
                              <TextField
                                fullWidth
                                size="small"
                                label="HSN / SAC Code"
                                placeholder="e.g. 8443"
                                value={item.hsn_code || ""}
                                onChange={(e) =>
                                  updateLine(index, "hsn_code", e.target.value)
                                }
                              />
                            </Box>

                            <TextField
                              fullWidth
                              size="small"
                              label="Description / Scope"
                              placeholder="e.g. Supply and turnkey installation of rooftop solar power plant"
                              value={item.description}
                              onChange={(e) =>
                                updateLine(index, "description", e.target.value)
                              }
                            />

                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                  xs: "1fr 1fr",
                                  sm:
                                    gstMode === "itemised"
                                      ? "1fr 1fr 1.5fr 1fr"
                                      : "1fr 1fr 2fr",
                                },
                                gap: 1.5,
                                alignItems: "center",
                              }}
                            >
                              <TextField
                                required
                                fullWidth
                                size="small"
                                type="number"
                                label="Quantity *"
                                placeholder="e.g. 1"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateLine(index, "quantity", e.target.value)
                                }
                              />
                              <TextField
                                fullWidth
                                size="small"
                                label="Unit"
                                placeholder="e.g. System / Piece"
                                value={item.unit}
                                onChange={(e) =>
                                  updateLine(index, "unit", e.target.value)
                                }
                              />
                              <TextField
                                required
                                fullWidth
                                size="small"
                                type="number"
                                label="Unit Price (₹) *"
                                placeholder="e.g. 250000"
                                value={item.unit_price}
                                onChange={(e) =>
                                  updateLine(index, "unit_price", e.target.value)
                                }
                                slotProps={{
                                  input: {
                                    startAdornment: (
                                      <InputAdornment position="start">₹</InputAdornment>
                                    ),
                                  },
                                }}
                              />
                              {gstMode === "itemised" && (
                                <TextField
                                  required
                                  fullWidth
                                  size="small"
                                  type="number"
                                  label="GST %"
                                  placeholder="e.g. 18"
                                  value={item.gst_rate}
                                  onChange={(e) =>
                                    updateLine(index, "gst_rate", e.target.value)
                                  }
                                  slotProps={{
                                    input: {
                                      endAdornment: (
                                        <InputAdornment position="end">%</InputAdornment>
                                      ),
                                    },
                                  }}
                                />
                              )}
                            </Box>

                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                pt: 1,
                                borderTop: "1px dashed #E2E8F0",
                              }}
                            >
                              <Typography sx={{ fontSize: "0.75rem", color: "#64748B" }}>
                                Line Total (excl. tax):
                              </Typography>
                              <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, color: "#0F172A" }}>
                                {currency(
                                  (Number(item.quantity) || 0) *
                                    (Number(item.unit_price) || 0)
                                )}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>

                  {/* Commercial Adjustments & Subsidy Card */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2, sm: 2.75 },
                      borderRadius: "14px",
                      border: "1px solid #E2E8F0",
                      bgcolor: "#FFFFFF",
                    }}
                  >
                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#0F172A", mb: 0.5 }}>
                      Discounts & Government Subsidy
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "#64748B", mb: 2 }}>
                      Apply customer discounts and central PM Surya Ghar scheme benefits
                    </Typography>

                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Special Discount Before GST (₹)"
                        placeholder="e.g. 5000"
                        value={discountAmount}
                        onChange={(e) =>
                          setDiscountAmount(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">₹</InputAdornment>
                            ),
                          },
                        }}
                        helperText="Discount is subtracted from base value before calculating GST."
                      />

                      <Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 0.75,
                          }}
                        >
                          <Typography sx={{ fontSize: "0.82rem", fontWeight: 750, color: "#0F172A" }}>
                            PM Surya Ghar Govt Subsidy (₹)
                          </Typography>
                          <Typography sx={{ fontSize: "0.72rem", color: "#64748B" }}>
                            Standard National DBT:
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.25 }}>
                          <Chip
                            clickable
                            size="small"
                            label="₹30,000 (1 kW)"
                            onClick={() => setSubsidyAmount(30000)}
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.74rem",
                              bgcolor:
                                Number(subsidyAmount) === 30000 ? "#DCFCE7" : "#F8FAFC",
                              color:
                                Number(subsidyAmount) === 30000 ? "#15803D" : "#334155",
                              border: "1px solid #CBD5E1",
                            }}
                          />
                          <Chip
                            clickable
                            size="small"
                            label="₹60,000 (2 kW)"
                            onClick={() => setSubsidyAmount(60000)}
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.74rem",
                              bgcolor:
                                Number(subsidyAmount) === 60000 ? "#DCFCE7" : "#F8FAFC",
                              color:
                                Number(subsidyAmount) === 60000 ? "#15803D" : "#334155",
                              border: "1px solid #CBD5E1",
                            }}
                          />
                          <Chip
                            clickable
                            size="small"
                            label="₹78,000 (3 kW+ Residential)"
                            onClick={() => setSubsidyAmount(78000)}
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.74rem",
                              bgcolor:
                                Number(subsidyAmount) === 78000 ? "#DCFCE7" : "#F8FAFC",
                              color:
                                Number(subsidyAmount) === 78000 ? "#15803D" : "#334155",
                              border: "1px solid #CBD5E1",
                            }}
                          />
                          <Chip
                            clickable
                            size="small"
                            label="₹0 (No Subsidy)"
                            onClick={() => setSubsidyAmount("")}
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.74rem",
                              bgcolor: !subsidyAmount ? "#F1F5F9" : "#F8FAFC",
                              border: "1px solid #CBD5E1",
                            }}
                          />
                        </Box>

                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          placeholder="e.g. 78000"
                          value={subsidyAmount}
                          onChange={(e) =>
                            setSubsidyAmount(
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">₹</InputAdornment>
                              ),
                            },
                          }}
                          helperText="Direct Benefit Transfer (DBT) will be credited directly to customer's bank account."
                        />
                      </Box>
                    </Stack>
                  </Paper>
                </Stack>
              )}

              {/* TAB 2: SCOPE & TERMS */}
              {activeTab === 2 && (
                <Stack spacing={2.5}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2, sm: 2.75 },
                      borderRadius: "14px",
                      border: "1px solid #E2E8F0",
                      bgcolor: "#FFFFFF",
                    }}
                  >
                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#0F172A", mb: 0.5 }}>
                      Quotation Validity & Scope of Work
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: "#64748B", mb: 2 }}>
                      Commercial conditions, warranties and DISCOM liaising scope
                    </Typography>

                    <Stack spacing={2.5}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="Quotation Valid Until"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                      />

                      <Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 0.75,
                          }}
                        >
                          <Typography sx={{ fontSize: "0.82rem", fontWeight: 750, color: "#0F172A" }}>
                            Scope of Work & Technical Notes
                          </Typography>
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<AutoFixHighIcon />}
                            onClick={() => setQuotationNotes(STANDARD_SOLAR_SCOPE)}
                            sx={{
                              textTransform: "none",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              color: "#005BAC",
                            }}
                          >
                            Insert Standard Scope
                          </Button>
                        </Box>
                        <TextField
                          fullWidth
                          size="small"
                          multiline
                          minRows={3}
                          placeholder="e.g. Turnkey rooftop solar solution with DISCOM testing & documentation..."
                          value={quotationNotes}
                          onChange={(e) => setQuotationNotes(e.target.value)}
                        />
                      </Box>

                      <Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 0.75,
                          }}
                        >
                          <Typography sx={{ fontSize: "0.82rem", fontWeight: 750, color: "#0F172A" }}>
                            Terms & Conditions
                          </Typography>
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<AutoFixHighIcon />}
                            onClick={() => setTerms(STANDARD_SOLAR_TERMS)}
                            sx={{
                              textTransform: "none",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              color: "#005BAC",
                            }}
                          >
                            Insert Standard Solar Terms
                          </Button>
                        </Box>
                        <QuotationPaymentSchedule value={paymentSchedule} onChange={setPaymentSchedule} />
                          <TextField
                          fullWidth
                          size="small"
                          multiline
                          minRows={4}
                          placeholder="e.g. 1. 25 Years performance warranty on panels..."
                          value={terms}
                          onChange={(e) => setTerms(e.target.value)}
                        />
                      </Box>
                    </Stack>
                  </Paper>
                </Stack>
              )}
            </Box>

            {/* RIGHT COLUMN: STICKY COMMERCIAL BREAKDOWN SUMMARY */}
            <Box
              sx={{
                position: { xs: "static", lg: "sticky" },
                top: 0,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "14px",
                  border: "1px solid #CBD5E1",
                  bgcolor: "#FFFFFF",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                }}
              >
                <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#0F172A", mb: 0.5 }}>
                  Commercial Summary
                </Typography>
                <Typography sx={{ fontSize: "0.74rem", color: "#64748B", mb: 2 }}>
                  Live recalculation as you edit proposal
                </Typography>

                {/* Key Spec Badges */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "10px",
                    bgcolor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    mb: 2,
                  }}
                >
                  <Typography sx={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>
                    Customer:
                  </Typography>
                  <Typography sx={{ fontSize: "0.88rem", fontWeight: 750, color: "#0F172A", mb: 1 }}>
                    {customerName || "Customer Name"}
                  </Typography>

                  <Typography sx={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>
                    Proposed System:
                  </Typography>
                  <Typography sx={{ fontSize: "0.88rem", fontWeight: 750, color: "#005BAC" }}>
                    {systemCapacityKw ? `${systemCapacityKw} kW` : "— kW"} · {systemType}
                  </Typography>
                </Box>

                {/* Calculations Breakdown */}
                <Stack spacing={1.1} sx={{ mb: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: "0.78rem", color: "#64748B" }}>
                      Items Subtotal
                    </Typography>
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#0F172A" }}>
                      {currency(itemSubtotal)}
                    </Typography>
                  </Box>

                  {effectiveDiscount > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography sx={{ fontSize: "0.78rem", color: "#DC2626" }}>
                        (-) Special Discount
                      </Typography>
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#DC2626" }}>
                        - {currency(effectiveDiscount)}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: "0.78rem", color: "#64748B" }}>
                      Taxable Value
                    </Typography>
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#0F172A" }}>
                      {currency(subtotalBeforeGst)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ fontSize: "0.78rem", color: "#64748B" }}>
                      GST {gstMode === "solar_composite" ? "(70:30 Rule @ 8.9%)" : "(Itemised)"}
                    </Typography>
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#0F172A" }}>
                      + {currency(gstAmount)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 0.5 }} />

                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: "#0F172A" }}>
                      Gross Project Cost
                    </Typography>
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: "#0F172A" }}>
                      {currency(totalAmount)}
                    </Typography>
                  </Box>

                  {Number(subsidyAmount) > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#16A34A" }}>
                        (-) Govt Subsidy (DBT)
                      </Typography>
                      <Typography sx={{ fontSize: "0.84rem", fontWeight: 750, color: "#16A34A" }}>
                        - {currency(subsidyAmount)}
                      </Typography>
                    </Box>
                  )}
                </Stack>

                {/* Net Customer Investment Highlight Box */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "10px",
                    bgcolor: "#F0FDF4",
                    border: "1.5px solid #86EFAC",
                    textAlign: "center",
                    mb: 2,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      color: "#166534",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      mb: 0.25,
                    }}
                  >
                    Net Customer Investment
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "1.45rem",
                      fontWeight: 900,
                      color: "#15803D",
                      lineHeight: 1.2,
                    }}
                  >
                    {currency(netPayable)}
                  </Typography>
                  <Typography sx={{ fontSize: "0.68rem", color: "#166534", mt: 0.5 }}>
                    After central PM Surya Ghar DBT subsidy
                  </Typography>
                </Box>

                {/* Next Step / Create Quick Action */}
                {activeTab < 2 ? (
                  <Button
                    fullWidth
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    onClick={handleNextTab}
                    sx={{
                      bgcolor: "#005BAC",
                      fontWeight: 750,
                      py: 1.1,
                      borderRadius: "8px",
                      textTransform: "none",
                      "&:hover": { bgcolor: "#00488A" },
                    }}
                  >
                    Next: {activeTab === 0 ? "Pricing & Items" : "Scope & Terms"}
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    startIcon={!loading && <DescriptionOutlinedIcon />}
                    onClick={handleSubmit}
                    sx={{
                      bgcolor: "#0F172A",
                      fontWeight: 800,
                      py: 1.2,
                      borderRadius: "8px",
                      textTransform: "none",
                      "&:hover": { bgcolor: "#1E293B" },
                    }}
                  >
                    {loading ? "Generating Proposal…" : "Generate Official Proposal"}
                  </Button>
                )}
              </Paper>
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* FOOTER ACTIONS */}
      {!createdQuotation && (
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            py: 1.5,
            bgcolor: "#FFFFFF",
            borderTop: "1px solid #E2E8F0",
            flexShrink: 0,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Button
            disabled={loading}
            onClick={handleCloseDialog}
            sx={{
              color: "#64748B",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "8px",
            }}
          >
            Cancel
          </Button>

          <Stack direction="row" spacing={1.5}>
            {activeTab > 0 && (
              <Button
                variant="outlined"
                disabled={loading}
                startIcon={<ArrowBackIcon />}
                onClick={() => setActiveTab((p) => p - 1)}
                sx={{
                  borderColor: "#CBD5E1",
                  color: "#334155",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: "8px",
                }}
              >
                Back
              </Button>
            )}

            {activeTab < 2 ? (
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={handleNextTab}
                sx={{
                  bgcolor: "#005BAC",
                  color: "#FFFFFF",
                  fontWeight: 750,
                  px: 2.5,
                  borderRadius: "8px",
                  textTransform: "none",
                  "&:hover": { bgcolor: "#00488A" },
                }}
              >
                Next Step
              </Button>
            ) : (
              <Button
                variant="contained"
                disabled={loading}
                startIcon={!loading && <DescriptionOutlinedIcon />}
                onClick={handleSubmit}
                sx={{
                  bgcolor: "#0F172A",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  px: 3,
                  borderRadius: "8px",
                  textTransform: "none",
                  "&:hover": { bgcolor: "#1E293B" },
                }}
              >
                {loading ? "Generating Proposal…" : "Generate Official Proposal"}
              </Button>
            )}
          </Stack>
        </DialogActions>
      )}
    </Dialog>
  );
};

const CreateQuotationModal = (props) =>
  props.open ? <QuotationDialog {...props} /> : null;

export default CreateQuotationModal;
