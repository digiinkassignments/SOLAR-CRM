import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Slider,
  MenuItem,
  Button,
  Chip,
  Card,
  Divider,
  Stack,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  CircularProgress,
} from "@mui/material";

// Material-UI Icons (Strictly No Emojis)
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CategoryIcon from "@mui/icons-material/Category";
import SquareFootIcon from "@mui/icons-material/SquareFoot";
import SavingsIcon from "@mui/icons-material/Savings";
import SaveIcon from "@mui/icons-material/Save";
import PersonIcon from "@mui/icons-material/Person";
import HistoryIcon from "@mui/icons-material/History";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PrintIcon from "@mui/icons-material/Print";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ForestIcon from "@mui/icons-material/Forest";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SpeedIcon from "@mui/icons-material/Speed";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import TimelineIcon from "@mui/icons-material/Timeline";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import HelpOutlinedIcon from "@mui/icons-material/HelpOutlined";
import CloseIcon from "@mui/icons-material/Close";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import DoneAllIcon from "@mui/icons-material/DoneAll";

import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  INDIAN_STATES_TARIFF_MAP,
  getTariffForState,
  getSunHoursForState,
} from "../../utils/indianStatesTariffMap";
import CreateQuotationModal from "../Quotations/CreateQuotationModal";
import { getSurveyByLead } from "../../services/surveyService";
import { getSettings } from "../../services/settingsService";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000";

/* ============================================================
   DESIGN TOKENS (Matching Stock Management & Leads)
   ============================================================ */
const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  primarySoft: "#F1F5F9",
  secondary: "#F59E0B",
  secondaryDark: "#D97706",
  secondarySoft: "#FEF3C7",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  info: "#0284C7",
  infoSoft: "#E0F2FE",
};

const controlSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#FAFBFC",
    fontSize: "0.92rem",
    color: COLORS.textPrimary,
    minHeight: 40,
    "& fieldset": { borderColor: COLORS.border, borderWidth: "1px" },
    "&:hover fieldset": { borderColor: COLORS.borderStrong },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary, borderWidth: "1.5px" },
  },
  "& .MuiInputBase-input": {
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.92rem",
    py: 1,
  },
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    fontSize: "0.92rem",
    fontFamily: "'Inter', sans-serif",
    py: 1,
  },
  "& .MuiInputLabel-root": {
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.92rem",
    color: COLORS.textSecondary,
    "&.Mui-focused": { color: COLORS.primary },
  },
};

const FieldLabel = ({ children, required = false }) => (
  <Typography
    variant="caption"
    sx={{
      display: "block",
      fontWeight: 600,
      color: COLORS.textPrimary,
      fontFamily: "'Inter', sans-serif",
      fontSize: "0.88rem",
      mb: 0.6,
    }}
  >
    {children}
    {required && <span style={{ color: COLORS.danger, marginLeft: 3 }}>*</span>}
  </Typography>
);

// Currency Formatter
const formatIndianCurrency = (val) => {
  if (val === undefined || val === null) return "₹0";
  const num = Number(val) || 0;
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  }
  return `₹${Math.round(num).toLocaleString("en-IN")}`;
};

// State Specific Solar Generation Yield Map (kWh/kWp/year)
const STATE_SPECIFIC_YIELDS = {
  Rajasthan: 1650.0,
  Gujarat: 1600.0,
  Maharashtra: 1500.0,
  "Madhya Pradesh": 1550.0,
  Delhi: 1450.0,
  Karnataka: 1500.0,
  "Tamil Nadu": 1520.0,
  Default: 1485.0,
};

/* ============================================================
   REAL-TIME CALCULATION ENGINE (Instant client-side + backend parity)
   ============================================================ */
const computeLocalSolarSystem = ({
  calcMode,
  monthlyBill,
  monthlyUnits,
  roofAreaSqft,
  roofUsablePercent,
  tariffRate,
  selectedState,
  propertyType,
  subsidyType,
}) => {
  const tRate = Math.max(1.0, parseFloat(tariffRate) || 8.0);
  let bill = parseFloat(monthlyBill) || 0;
  let units = parseFloat(monthlyUnits) || 0;
  let roof = parseFloat(roofAreaSqft) || 0;
  let usablePct = Math.min(100, Math.max(10, parseFloat(roofUsablePercent) || 80));
  let usableRoofSqft = Math.round(roof * (usablePct / 100.0));

  let recommendedKw = 1.0;

  if (calcMode === "units") {
    units = Math.max(10, units || 625);
    bill = Math.round(units * tRate);
    recommendedKw = parseFloat((units / 135.0).toFixed(2));
  } else if (calcMode === "roof") {
    const targetArea = usableRoofSqft > 0 ? usableRoofSqft : 400;
    recommendedKw = parseFloat((targetArea / 80.0).toFixed(2));
    units = Math.round(recommendedKw * 135.0);
    bill = Math.round(units * tRate);
  } else {
    // Mode: "bill"
    bill = Math.max(500, bill || 5000);
    units = Math.round(bill / tRate);
    recommendedKw = parseFloat((units / 135.0).toFixed(2));
  }

  if (recommendedKw < 1.0) recommendedKw = 1.0;

  // Panel sizing: 550W Mono PERC Half-Cut DCR
  const panelWattage = 550;
  const panelCount = Math.ceil((recommendedKw * 1000) / panelWattage);
  const actualDcKw = parseFloat(((panelCount * panelWattage) / 1000).toFixed(2));
  const inverterKw = Math.ceil(recommendedKw);
  const connectionPhase = recommendedKw > 8.0 ? "3 Phase" : "Single Phase";

  // Generation Calculations
  const specificYield = STATE_SPECIFIC_YIELDS[selectedState] || STATE_SPECIFIC_YIELDS.Default;
  const annualGenerationKwh = Math.round(recommendedKw * specificYield);
  const dailyGenerationKwh = parseFloat((annualGenerationKwh / 365.0).toFixed(1));
  const monthlyGenerationKwh = Math.round(annualGenerationKwh / 12.0);
  const thirtyYearGenerationKwh = Math.round(annualGenerationKwh * 27.9);

  // EPC Pricing (Indian Benchmarks: ₹55,000/kW for DCR Monocrystalline)
  const isNonDcr = subsidyType.includes("Non-DCR");
  const costPerKw = isNonDcr ? 48500 : 55000;
  const grossCost = Math.round(recommendedKw * costPerKw);

  // PM Surya Ghar: Muft Bijli Yojana Central Financial Assistance (CFA) Rules
  let subsidyAmount = 0;
  let subsidyFormulaText = "Ineligible";
  const isResidential = propertyType === "Residential";

  if (isResidential && !isNonDcr && subsidyType !== "No Subsidy") {
    if (recommendedKw <= 2.0) {
      subsidyAmount = Math.round(recommendedKw * 30000);
      subsidyFormulaText = "₹30,000/kW (Up to 2 kW)";
    } else if (recommendedKw <= 3.0) {
      subsidyAmount = Math.round(60000 + (recommendedKw - 2.0) * 18000);
      subsidyFormulaText = "₹60,000 + ₹18,000/kW (3rd kW)";
    } else {
      subsidyAmount = 78000; // Flat max cap at 3 kW
      subsidyFormulaText = "PM Surya Ghar Max Cap (₹78,000)";
    }
  } else if (!isResidential) {
    subsidyAmount = 0;
    subsidyFormulaText = "Commercial / Industrial (Tax Depreciation 40%)";
  } else {
    subsidyAmount = 0;
    subsidyFormulaText = "Non-DCR Panels (Ineligible for CFA)";
  }

  const netCost = Math.max(0, grossCost - subsidyAmount);

  // Financial Savings & Payback
  const monthlySavings = Math.round(monthlyGenerationKwh * tRate);
  const annualSavings = Math.round(annualGenerationKwh * tRate);
  const paybackYears = annualSavings > 0 ? parseFloat((netCost / annualSavings).toFixed(1)) : 0.0;
  const annualRoiPercent = netCost > 0 ? parseFloat(((annualSavings / netCost) * 100).toFixed(1)) : 0.0;

  // Rooftop Clearance: ~80 sq.ft per kWp
  const requiredAreaSqft = Math.round(recommendedKw * 80.0);
  const remainingRoofAreaSqft = roof > 0 ? Math.max(0, usableRoofSqft - requiredAreaSqft) : 0;
  const isFeasible = roof === 0 || usableRoofSqft >= requiredAreaSqft;

  // Bill of Materials (BOM) Breakdown
  const bomBreakdown = {
    panel_cost: Math.round(grossCost * 0.55),
    inverter_cost: Math.round(grossCost * 0.2),
    structure_bos_cost: Math.round(grossCost * 0.15),
    installation_testing_cost: Math.round(grossCost * 0.1),
  };

  // 12-Month Seasonal Generation Profile
  const weights = [0.075, 0.08, 0.092, 0.096, 0.098, 0.085, 0.07, 0.068, 0.08, 0.086, 0.082, 0.078];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyBreakdown = monthNames.map((m, idx) => {
    const kwh = Math.round(annualGenerationKwh * weights[idx]);
    return {
      month: m,
      generation_kwh: kwh,
      daily_avg_kwh: parseFloat((kwh / 30.0).toFixed(1)),
    };
  });

  // 25-Year Lifecycle Cashflow Schedule (0.55% degradation, 3% tariff escalation)
  const cashflowSchedule = [];
  let cumulativeSavings = 0;
  let curGen = annualGenerationKwh;
  let curTariff = tRate;

  for (let y = 1; y <= 25; y++) {
    if (y > 1) {
      curGen *= 1 - 0.0055;
      curTariff *= 1 + 0.03;
    }
    const yearSavings = Math.round(curGen * curTariff);
    cumulativeSavings += yearSavings;
    cashflowSchedule.push({
      year: y,
      generation_kwh: Math.round(curGen),
      tariff_rate: parseFloat(curTariff.toFixed(2)),
      annual_savings: yearSavings,
      cumulative_savings: cumulativeSavings,
    });
  }

  const twentyFiveYearSavings = cumulativeSavings - netCost;
  const co2OffsetTonnes = Math.round((annualGenerationKwh * 25 * 0.82) / 1000);
  const treesPlanted = Math.round(co2OffsetTonnes * 16);

  return {
    calc_mode: calcMode,
    monthly_bill: Math.round(bill),
    monthly_units: Math.round(units),
    property_type: propertyType,
    subsidy_type: subsidyType,
    connection_phase: connectionPhase,
    tariff_rate: tRate,
    recommended_kw: recommendedKw,
    daily_generation_kwh: dailyGenerationKwh,
    panel_count: panelCount,
    panel_wattage: panelWattage,
    inverter_kw: inverterKw,
    roof_area_sqft: roof,
    roof_usable_percent: usablePct,
    usable_roof_area_sqft: usableRoofSqft,
    required_area_sqft: requiredAreaSqft,
    remaining_roof_area_sqft: remainingRoofAreaSqft,
    is_feasible: isFeasible,
    monthly_generation_kwh: monthlyGenerationKwh,
    annual_generation_kwh: annualGenerationKwh,
    thirty_year_generation_kwh: thirtyYearGenerationKwh,
    monthly_savings: monthlySavings,
    annual_savings: annualSavings,
    twenty_five_year_savings: twentyFiveYearSavings,
    gross_cost: grossCost,
    subsidy_amount: subsidyAmount,
    subsidy_formula_text: subsidyFormulaText,
    net_cost: netCost,
    payback_years: paybackYears,
    annual_roi_percent: annualRoiPercent,
    co2_offset_tonnes: co2OffsetTonnes,
    trees_planted: treesPlanted,
    structured: {
      system: {
        recommended_kw: recommendedKw,
        actual_dc_kw: actualDcKw,
        inverter_ac_kw: inverterKw,
        panel_count: panelCount,
        panel_wattage: panelWattage,
        panel_brand: "Waaree Solar",
        panel_model: "Arka Series 550W Mono PERC DCR",
        inverter_brand: inverterKw > 8 ? "Growatt / Solis 3-Phase" : "Growatt / Solis Single-Phase",
        connection_phase: connectionPhase,
      },
      roof: {
        available_roof_area_sqft: roof,
        roof_usable_percent: usablePct,
        usable_roof_area_sqft: usableRoofSqft,
        required_area_sqft: requiredAreaSqft,
        remaining_roof_area_sqft: remainingRoofAreaSqft,
        is_feasible: isFeasible,
      },
      financial: {
        gross_cost: grossCost,
        subsidy_amount: subsidyAmount,
        subsidy_formula_text: subsidyFormulaText,
        net_cost: netCost,
        monthly_savings: monthlySavings,
        annual_savings: annualSavings,
        twenty_five_year_savings: twentyFiveYearSavings,
        payback_years: paybackYears,
        annual_roi_percent: annualRoiPercent,
        bom_breakdown: bomBreakdown,
      },
      generation: {
        daily_generation_kwh: dailyGenerationKwh,
        monthly_generation_kwh: monthlyGenerationKwh,
        annual_generation_kwh: annualGenerationKwh,
        monthly_breakdown: monthlyBreakdown,
      },
      cashflow_schedule: cashflowSchedule,
    },
  };
};

/* ============================================================
   MAIN COMPONENT: SolarCalculator
   ============================================================ */
const SolarCalculator = ({ embeddedLead = null, onQuotationCreated = null }) => {
  // Mode: "bill" | "units" | "roof"
  const [calcMode, setCalcMode] = useState("bill");

  // Inputs
  const [monthlyBill, setMonthlyBill] = useState(5000);
  const [monthlyUnits, setMonthlyUnits] = useState(625);
  const [roofAreaSqft, setRoofAreaSqft] = useState(500);
  const [roofUsablePercent, setRoofUsablePercent] = useState(80);

  const [selectedState, setSelectedState] = useState("Rajasthan");
  const [propertyType, setPropertyType] = useState("Residential");
  const [subsidyType, setSubsidyType] = useState("With Subsidy (DCR)");
  const [tariffRate, setTariffRate] = useState(8.0);
  const [peakSunHours, setPeakSunHours] = useState(5.8);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [openQuotationModal, setOpenQuotationModal] = useState(false);
  const [openGuideModal, setOpenGuideModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companySettings, setCompanySettings] = useState(null);

  // Client / Lead Integration
  const [leadsList, setLeadsList] = useState([]);
  const [selectedLead, setSelectedLead] = useState(embeddedLead || null);
  const [openSavedModal, setOpenSavedModal] = useState(false);
  const [savedCalculations, setSavedCalculations] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [activeQuotationCalc, setActiveQuotationCalc] = useState(null);

  const resultsRef = useRef(null);

  // Synchronous client calculation state (guarantees 0-lag responsiveness)
  const [calcResult, setCalcResult] = useState(() =>
    computeLocalSolarSystem({
      calcMode: "bill",
      monthlyBill: 5000,
      monthlyUnits: 625,
      roofAreaSqft: 500,
      roofUsablePercent: 80,
      tariffRate: 8.0,
      selectedState: "Rajasthan",
      propertyType: "Residential",
      subsidyType: "With Subsidy (DCR)",
    })
  );

  // Load Company Settings for professional PDF/Print Header & Footer
  useEffect(() => {
    getSettings()
      .then((res) => {
        const data = res?.data?.data || res?.data || null;
        if (data) {
          setCompanySettings(data);
        }
      })
      .catch((err) => {
        console.warn("Could not load company settings for report:", err);
      });
  }, []);

  // Fetch leads for dropdown selection
  useEffect(() => {
    api.get("/leads?limit=150")
      .then((res) => {
        if (res.data?.success) setLeadsList(res.data.data || []);
      })
      .catch(() => {});
  }, []);

  // Pre-fill lead state & survey data if provided
  useEffect(() => {
    if (embeddedLead) {
      if (embeddedLead.state) {
        setSelectedState(embeddedLead.state);
        const t = getTariffForState(embeddedLead.state);
        const sh = getSunHoursForState(embeddedLead.state);
        setTariffRate(t);
        setPeakSunHours(sh);
      }
      if (embeddedLead.solar_requirement) {
        setPropertyType(embeddedLead.solar_requirement);
      }
      if (embeddedLead.id) {
        getSurveyByLead(embeddedLead.id)
          .then((res) => {
            if (res?.success && res.data) {
              const survey = res.data;
              if (survey.roof_area_sqft) {
                setRoofAreaSqft(Number(survey.roof_area_sqft));
                toast.success(`Loaded ${survey.roof_area_sqft} sq.ft roof area from completed Site Survey`);
              }
            }
          })
          .catch(() => {});
      }
    }
  }, [embeddedLead]);

  // When State changes, auto-fill Discom Tariff Rate & Peak Sun Hours
  const handleStateChange = (stateName) => {
    setSelectedState(stateName);
    const defaultTariff = getTariffForState(stateName);
    const defaultSunHours = getSunHoursForState(stateName);
    setTariffRate(defaultTariff);
    setPeakSunHours(defaultSunHours);
  };

  // When Property Type changes, adjust subsidy and tariff appropriately
  const handlePropertyTypeChange = (newType) => {
    setPropertyType(newType);
    if (newType === "Residential") {
      setSubsidyType("With Subsidy (DCR)");
      setTariffRate(getTariffForState(selectedState));
    } else if (newType === "Commercial") {
      setSubsidyType("No Subsidy");
      const base = getTariffForState(selectedState);
      setTariffRate(parseFloat((base * 1.35).toFixed(2)));
    } else if (newType === "Industrial") {
      setSubsidyType("No Subsidy");
      const base = getTariffForState(selectedState);
      setTariffRate(parseFloat((base * 1.15).toFixed(2)));
    }
  };

  // Sync inputs based on mode
  const handleBillChange = (val) => {
    const num = Math.max(0, Number(val) || 0);
    setMonthlyBill(num);
    setMonthlyUnits(Math.round(num / (tariffRate || 8)));
  };

  const handleUnitsChange = (val) => {
    const num = Math.max(0, Number(val) || 0);
    setMonthlyUnits(num);
    setMonthlyBill(Math.round(num * (tariffRate || 8)));
  };

  const handleRoofChange = (val) => {
    const num = Math.max(0, Number(val) || 0);
    setRoofAreaSqft(num);
  };

  // Trigger calculation: updates local engine immediately, then asks backend for verified audit
  const runCalculation = async (shouldScroll = false) => {
    const local = computeLocalSolarSystem({
      calcMode,
      monthlyBill,
      monthlyUnits,
      roofAreaSqft,
      roofUsablePercent,
      tariffRate,
      selectedState,
      propertyType,
      subsidyType,
    });
    setCalcResult(local);

    try {
      const payload = {
        calc_mode: calcMode,
        monthly_bill: local.monthly_bill,
        monthly_units: local.monthly_units,
        property_type: propertyType,
        subsidy_type: subsidyType,
        tariff_rate: tariffRate,
        peak_sun_hours: peakSunHours,
        roof_area_sqft: roofAreaSqft,
        roof_usable_percent: roofUsablePercent,
        effective_roof_area_sqft: local.usable_roof_area_sqft,
        state: selectedState,
      };

      const res = await api.post("/calculator/calculate", payload);
      if (res.data?.success && res.data?.data) {
        setCalcResult(res.data.data);
      }
    } catch {
      // Local calculation already computed seamlessly
    }

    if (shouldScroll && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  // Auto calculate on input change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      runCalculation(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [
    calcMode,
    monthlyBill,
    monthlyUnits,
    roofAreaSqft,
    roofUsablePercent,
    selectedState,
    propertyType,
    subsidyType,
    tariffRate,
    peakSunHours,
  ]);

  const handleSaveCalculation = async () => {
    setSaving(true);
    try {
      const currentLead = selectedLead || embeddedLead;
      const payload = {
        lead_id: currentLead?.id || null,
        monthly_bill: monthlyBill,
        monthly_units: monthlyUnits,
        property_type: propertyType,
        tariff_rate: tariffRate,
        roof_area_sqft: roofAreaSqft,
        roof_usable_percent: roofUsablePercent,
        calc_mode: calcMode,
      };
      const res = await api.post("/calculator/save", payload);
      if (res.data?.success) {
        toast.success(`Solar sizing calculation saved successfully${currentLead ? ` for ${currentLead.customer_name}` : ""}!`);
      }
    } catch (err) {
      console.error("Save calc error:", err);
      toast.error("Failed to save calculation");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSavedModal = async () => {
    setOpenSavedModal(true);
    setLoadingSaved(true);
    try {
      const res = await api.get("/calculator");
      if (res.data?.success) {
        setSavedCalculations(res.data.data || []);
      }
    } catch {
      toast.error("Failed to load saved calculations");
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleSelectLead = (leadId) => {
    if (!leadId) {
      setSelectedLead(null);
      return;
    }
    const lead = leadsList.find((l) => l.id === leadId);
    if (lead) {
      setSelectedLead(lead);
      if (lead.state) {
        handleStateChange(lead.state);
      }
      if (lead.solar_requirement) {
        handlePropertyTypeChange(lead.solar_requirement);
      }
      toast.success(`Linked calculation to client: ${lead.customer_name}`);
    }
  };

  const handleCreateProposalFromSaved = (calc) => {
    setActiveQuotationCalc(calc);
    if (calc.lead_id) {
      const foundLead = leadsList.find((l) => l.id === calc.lead_id);
      if (foundLead) setSelectedLead(foundLead);
    }
    setOpenSavedModal(false);
    setOpenQuotationModal(true);
  };

  const handleCreateCurrentProposal = () => {
    setActiveQuotationCalc(calcResult);
    setOpenQuotationModal(true);
  };

  // WhatsApp Share Helper (Clean professional text without emojis)
  const handleShareWhatsApp = () => {
    if (!calcResult) return;
    const text =
      `*SOLAR EPC SIZING & SAVINGS REPORT*\n\n` +
      `Recommended Plant Size: ${calcResult.recommended_kw ?? 0} kWp (${calcResult.panel_count ?? 0} Panels x ${calcResult.panel_wattage ?? 550}W)\n` +
      `Estimated Daily Generation: ${calcResult.daily_generation_kwh ?? 0} kWh / day\n` +
      `Estimated Monthly Generation: ${(calcResult.monthly_generation_kwh ?? 0).toLocaleString("en-IN")} kWh / month\n\n` +
      `Estimated Monthly Savings: Rs. ${(calcResult.monthly_savings ?? 0).toLocaleString("en-IN")} / month\n` +
      `Estimated Annual Savings: Rs. ${(calcResult.annual_savings ?? 0).toLocaleString("en-IN")} / year\n\n` +
      `Gross Project Cost: ${formatIndianCurrency(calcResult.gross_cost)}\n` +
      `PM Surya Ghar Subsidy: - Rs. ${(calcResult.subsidy_amount ?? 0).toLocaleString("en-IN")}\n` +
      `Net Customer Investment: ${formatIndianCurrency(calcResult.net_cost)}\n\n` +
      `Simple Payback Period: ${calcResult.payback_years ?? 0} Years\n` +
      `Annual Return on Investment (ROI): ${calcResult.annual_roi_percent ?? 0}%\n` +
      `25-Year Net Financial Savings: ${formatIndianCurrency(calcResult.twenty_five_year_savings)}\n` +
      `Lifetime Carbon Offset: ${calcResult.co2_offset_tonnes ?? 0} Tonnes CO2\n\n` +
      `Generated via ${companySettings?.company_name || "Solar CRM SaaS"}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handlePrintPDFReport = () => {
    window.print();
  };

  // Company Logo Resolution
  const logoUrl = companySettings?.company_logo
    ? companySettings.company_logo.startsWith("http")
      ? companySettings.company_logo
      : `${API_BASE_URL}/uploads/company/${companySettings.company_logo}`
    : null;

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", pb: 6, px: { xs: 1.5, sm: 2.5 } }}>
      {/* =========================================================
          PRINT STYLES FOR STRICT 1-PAGE EXECUTIVE PDF REPORT
         ========================================================= */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 10mm;
          }
          body * {
            visibility: hidden !important;
          }
          #solar-executive-pdf-document, #solar-executive-pdf-document * {
            visibility: visible !important;
          }
          #solar-executive-pdf-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: block !important;
            background: #ffffff !important;
            color: #0F172A !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
        @media screen {
          #solar-executive-pdf-document {
            display: none !important;
          }
        }
      `}</style>

      {/* =========================================================
          ON-SCREEN HEADER (Aligned: All Action Buttons in One Row)
         ========================================================= */}
      <Box
        className="no-print"
        sx={{
          mb: 3,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: COLORS.primary,
              color: COLORS.secondary,
              width: 44,
              height: 44,
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.15)",
            }}
          >
            <SolarPowerIcon />
          </Avatar>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: COLORS.primary,
                fontFamily: "'Outfit', sans-serif",
                lineHeight: 1.2,
              }}
            >
              Solar EPC Sizing & Financial Calculator
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: COLORS.textSecondary,
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.8rem",
              }}
            >
              Precision system capacity sizing, PM Surya Ghar subsidy engine & 25-year ROI analytics
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons: Neatly aligned in one row */}
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", alignItems: "center" }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<HistoryIcon />}
            onClick={handleOpenSavedModal}
            sx={{
              color: COLORS.primary,
              borderColor: COLORS.borderStrong,
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "0.8125rem",
              textTransform: "none",
              fontFamily: "'Inter', sans-serif",
              "&:hover": {
                borderColor: COLORS.primary,
                bgcolor: COLORS.primarySoft,
              },
            }}
          >
            Saved Records
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<SaveIcon />}
            disabled={saving}
            onClick={handleSaveCalculation}
            sx={{
              color: COLORS.primary,
              borderColor: COLORS.borderStrong,
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "0.8125rem",
              textTransform: "none",
              fontFamily: "'Inter', sans-serif",
              "&:hover": {
                borderColor: COLORS.primary,
                bgcolor: COLORS.primarySoft,
              },
            }}
          >
            {saving ? "Saving..." : "Save Calculation"}
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<ReceiptLongIcon />}
            onClick={handleCreateCurrentProposal}
            sx={{
              bgcolor: COLORS.primary,
              color: "#FFFFFF",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.8125rem",
              textTransform: "none",
              fontFamily: "'Inter', sans-serif",
              boxShadow: "0 2px 6px rgba(15, 23, 42, 0.2)",
              "&:hover": {
                bgcolor: COLORS.primaryDark,
              },
            }}
          >
            Create Proposal ➔
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintIcon />}
            onClick={handlePrintPDFReport}
            sx={{
              color: COLORS.textPrimary,
              borderColor: COLORS.borderStrong,
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "0.8125rem",
              textTransform: "none",
              fontFamily: "'Inter', sans-serif",
              "&:hover": {
                borderColor: COLORS.primary,
                bgcolor: COLORS.primarySoft,
              },
            }}
          >
            Print / PDF
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<WhatsAppIcon />}
            onClick={handleShareWhatsApp}
            sx={{
              color: COLORS.success,
              borderColor: COLORS.success,
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "0.8125rem",
              textTransform: "none",
              fontFamily: "'Inter', sans-serif",
              "&:hover": {
                borderColor: COLORS.success,
                bgcolor: COLORS.successSoft,
              },
            }}
          >
            Share
          </Button>

          <Button
            variant="text"
            size="small"
            startIcon={<HelpOutlinedIcon />}
            onClick={() => setOpenGuideModal(true)}
            sx={{
              color: COLORS.textSecondary,
              fontWeight: 600,
              fontSize: "0.8125rem",
              textTransform: "none",
            }}
          >
            Guide
          </Button>
        </Stack>
      </Box>

      {/* =========================================================
          CLIENT / LEAD ASSOCIATION BAR (Dropdown & Linked Status)
         ========================================================= */}
      <Paper
        className="no-print"
        elevation={0}
        sx={{
          mb: 3,
          p: 1.8,
          borderRadius: "10px",
          bgcolor: "#FFFFFF",
          border: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, minWidth: 280 }}>
          <PersonIcon sx={{ color: COLORS.primary, fontSize: 24 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", display: "block" }}>
              Select Client / Lead to Link Calculation &amp; Proposal
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={selectedLead?.id || ""}
              onChange={(e) => handleSelectLead(e.target.value)}
              sx={{
                mt: 0.5,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  bgcolor: "#FAFBFC",
                  fontSize: "0.88rem",
                },
              }}
            >
              <MenuItem value="">
                <em>— Direct / Walk-in Client (Fill details in Proposal) —</em>
              </MenuItem>
              {leadsList.map((lead) => (
                <MenuItem key={lead.id} value={lead.id}>
                  {lead.customer_name} • {lead.mobile_number || lead.phone || "No phone"} {lead.city ? `(${lead.city}, ${lead.state || ""})` : ""}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>

        {selectedLead ? (
          <Box sx={{ p: 1, px: 2, bgcolor: "#F0FDF4", borderRadius: "8px", border: "1px solid #BBF7D0", textAlign: "right" }}>
            <Typography variant="caption" sx={{ color: "#16A34A", fontWeight: 700, display: "block" }}>
              ✓ Linked: {selectedLead.customer_name}
            </Typography>
            <Typography variant="caption" sx={{ color: "#475569" }}>
              {selectedLead.mobile_number || selectedLead.phone} {selectedLead.city ? `• ${selectedLead.city}` : ""}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 1, px: 2, bgcolor: "#F8FAFC", borderRadius: "8px", border: "1px dashed #CBD5E1", textAlign: "right" }}>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600, display: "block" }}>
              Calculation unlinked
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textMuted }}>
              Select a lead above to auto-link
            </Typography>
          </Box>
        )}
      </Paper>

      {/* =========================================================
          MAIN TWO-COLUMN WORKSPACE (Top 4 KPI cards removed)
         ========================================================= */}
      <Grid container spacing={3} className="no-print">
        {/* LEFT COLUMN: Sizing Inputs & Parameters */}
        <Grid item xs={12} lg={5}>
          <Card
            elevation={0}
            sx={{
              bgcolor: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "14px",
              boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
              p: { xs: 2.5, sm: 3 },
            }}
          >
            {/* Step 1: Calculation Mode Selector */}
            <Box mb={3}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Avatar
                  sx={{
                    bgcolor: COLORS.primarySoft,
                    color: COLORS.primary,
                    width: 24,
                    height: 24,
                    fontSize: "0.75rem",
                    fontWeight: 800,
                  }}
                >
                  1
                </Avatar>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: COLORS.primary,
                    fontFamily: "'Outfit', sans-serif",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Calculation Mode
                </Typography>
              </Box>

              {/* Segmented Mode Selection Cards */}
              <Grid container spacing={1.5}>
                {[
                  { id: "bill", label: "Monthly Bill", icon: <CurrencyRupeeIcon sx={{ fontSize: 18 }} /> },
                  { id: "units", label: "Monthly Units", icon: <ElectricBoltIcon sx={{ fontSize: 18 }} /> },
                  { id: "roof", label: "Rooftop Space", icon: <HomeWorkIcon sx={{ fontSize: 18 }} /> },
                ].map((mode) => {
                  const isSelected = calcMode === mode.id;
                  return (
                    <Grid item xs={4} key={mode.id}>
                      <Box
                        onClick={() => setCalcMode(mode.id)}
                        sx={{
                          p: 1.5,
                          borderRadius: "10px",
                          border: `1px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                          bgcolor: isSelected ? COLORS.primarySoft : "#FAFBFC",
                          cursor: "pointer",
                          textAlign: "center",
                          transition: "all 0.18s ease-in-out",
                          "&:hover": {
                            borderColor: COLORS.primary,
                            bgcolor: isSelected ? COLORS.primarySoft : "#FFFFFF",
                          },
                        }}
                      >
                        <Box sx={{ color: isSelected ? COLORS.primary : COLORS.textSecondary, mb: 0.5 }}>
                          {mode.icon}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? COLORS.primary : COLORS.textPrimary,
                            fontSize: "0.75rem",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {mode.label}
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Dynamic Input based on Mode */}
              <Box sx={{ mt: 2.5, p: 2, bgcolor: "#FAFBFC", borderRadius: "10px", border: `1px solid ${COLORS.border}` }}>
                {calcMode === "bill" && (
                  <Box>
                    <FieldLabel required>Monthly Electricity Bill (₹)</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={monthlyBill || ""}
                      onChange={(e) => handleBillChange(e.target.value)}
                      placeholder="e.g. 5000"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Typography sx={{ fontWeight: 700, color: COLORS.textSecondary, fontSize: "0.85rem" }}>₹</Typography>
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography sx={{ color: COLORS.textMuted, fontSize: "0.75rem" }}>/ month</Typography>
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={controlSx}
                    />
                    <Stack direction="row" spacing={0.8} mt={1.5} sx={{ flexWrap: "wrap", gap: 0.8 }}>
                      <Typography variant="caption" sx={{ color: COLORS.textMuted, fontSize: "0.75rem", alignSelf: "center", mr: 0.5 }}>
                        Quick Select:
                      </Typography>
                      {[2500, 5000, 10000, 20000, 50000].map((amt) => (
                        <Chip
                          key={amt}
                          label={`₹${amt.toLocaleString("en-IN")}`}
                          size="small"
                          clickable
                          onClick={() => handleBillChange(amt)}
                          sx={{
                            bgcolor: monthlyBill === amt ? COLORS.primary : COLORS.card,
                            color: monthlyBill === amt ? "#FFFFFF" : COLORS.textPrimary,
                            border: `1px solid ${monthlyBill === amt ? COLORS.primary : COLORS.border}`,
                            fontWeight: 600,
                            fontSize: "0.72rem",
                            borderRadius: "6px",
                            height: 24,
                            "&:hover": { bgcolor: monthlyBill === amt ? COLORS.primaryDark : COLORS.primarySoft },
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {calcMode === "units" && (
                  <Box>
                    <FieldLabel required>Monthly Electricity Consumption (Units / kWh)</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={monthlyUnits || ""}
                      onChange={(e) => handleUnitsChange(e.target.value)}
                      placeholder="e.g. 625"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <ElectricBoltIcon sx={{ color: COLORS.textSecondary, fontSize: 18 }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography sx={{ color: COLORS.textMuted, fontSize: "0.75rem" }}>kWh / mo</Typography>
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={controlSx}
                    />
                    <Stack direction="row" spacing={0.8} mt={1.5} sx={{ flexWrap: "wrap", gap: 0.8 }}>
                      <Typography variant="caption" sx={{ color: COLORS.textMuted, fontSize: "0.75rem", alignSelf: "center", mr: 0.5 }}>
                        Quick Select:
                      </Typography>
                      {[300, 600, 1200, 2500, 5000].map((u) => (
                        <Chip
                          key={u}
                          label={`${u} kWh`}
                          size="small"
                          clickable
                          onClick={() => handleUnitsChange(u)}
                          sx={{
                            bgcolor: monthlyUnits === u ? COLORS.primary : COLORS.card,
                            color: monthlyUnits === u ? "#FFFFFF" : COLORS.textPrimary,
                            border: `1px solid ${monthlyUnits === u ? COLORS.primary : COLORS.border}`,
                            fontWeight: 600,
                            fontSize: "0.72rem",
                            borderRadius: "6px",
                            height: 24,
                            "&:hover": { bgcolor: monthlyUnits === u ? COLORS.primaryDark : COLORS.primarySoft },
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {calcMode === "roof" && (
                  <Box>
                    <FieldLabel required>Total Available Rooftop Space (sq.ft)</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={roofAreaSqft || ""}
                      onChange={(e) => handleRoofChange(e.target.value)}
                      placeholder="e.g. 500"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <SquareFootIcon sx={{ color: COLORS.textSecondary, fontSize: 18 }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography sx={{ color: COLORS.textMuted, fontSize: "0.75rem" }}>sq.ft</Typography>
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={controlSx}
                    />

                    <Stack direction="row" spacing={0.8} mt={1.5} mb={2} sx={{ flexWrap: "wrap", gap: 0.8 }}>
                      <Typography variant="caption" sx={{ color: COLORS.textMuted, fontSize: "0.75rem", alignSelf: "center", mr: 0.5 }}>
                        Quick Select:
                      </Typography>
                      {[300, 500, 1000, 2000, 5000].map((a) => (
                        <Chip
                          key={a}
                          label={`${a} sq.ft`}
                          size="small"
                          clickable
                          onClick={() => handleRoofChange(a)}
                          sx={{
                            bgcolor: roofAreaSqft === a ? COLORS.primary : COLORS.card,
                            color: roofAreaSqft === a ? "#FFFFFF" : COLORS.textPrimary,
                            border: `1px solid ${roofAreaSqft === a ? COLORS.primary : COLORS.border}`,
                            fontWeight: 600,
                            fontSize: "0.72rem",
                            borderRadius: "6px",
                            height: 24,
                            "&:hover": { bgcolor: roofAreaSqft === a ? COLORS.primaryDark : COLORS.primarySoft },
                          }}
                        />
                      ))}
                    </Stack>

                    <Divider sx={{ my: 1.5, borderColor: COLORS.border }} />

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                      <FieldLabel>Usable Roof Space for Solar (%)</FieldLabel>
                      <Chip
                        label={`${roofUsablePercent}% Usable (${Math.round(roofAreaSqft * (roofUsablePercent / 100))} sq.ft)`}
                        size="small"
                        sx={{
                          bgcolor: COLORS.primarySoft,
                          color: COLORS.primary,
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          borderRadius: "6px",
                          height: 22,
                        }}
                      />
                    </Box>

                    <Slider
                      value={roofUsablePercent}
                      min={20}
                      max={100}
                      step={5}
                      onChange={(_, val) => setRoofUsablePercent(val)}
                      sx={{
                        color: COLORS.primary,
                        height: 6,
                        "& .MuiSlider-thumb": {
                          width: 16,
                          height: 16,
                          bgcolor: "#FFFFFF",
                          border: `2px solid ${COLORS.primary}`,
                        },
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 2.5, borderColor: COLORS.border }} />

            {/* Step 2: Location & Customer Profile */}
            <Box mb={3}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Avatar
                  sx={{
                    bgcolor: COLORS.primarySoft,
                    color: COLORS.primary,
                    width: 24,
                    height: 24,
                    fontSize: "0.75rem",
                    fontWeight: 800,
                  }}
                >
                  2
                </Avatar>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: COLORS.primary,
                    fontFamily: "'Outfit', sans-serif",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Location & Customer Profile
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FieldLabel required>State / Union Territory</FieldLabel>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={selectedState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    sx={controlSx}
                  >
                    {INDIAN_STATES_TARIFF_MAP.map((item) => (
                      <MenuItem key={item.state} value={item.state} sx={{ fontSize: "0.85rem" }}>
                        {item.state}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FieldLabel required>Customer Category</FieldLabel>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={propertyType}
                    onChange={(e) => handlePropertyTypeChange(e.target.value)}
                    sx={controlSx}
                  >
                    <MenuItem value="Residential" sx={{ fontSize: "0.85rem" }}>
                      Residential (Eligible for Subsidy)
                    </MenuItem>
                    <MenuItem value="Commercial" sx={{ fontSize: "0.85rem" }}>
                      Commercial (Depreciation 40%)
                    </MenuItem>
                    <MenuItem value="Industrial" sx={{ fontSize: "0.85rem" }}>
                      Industrial (Depreciation 40%)
                    </MenuItem>
                  </TextField>
                </Grid>

                {propertyType === "Residential" && (
                  <Grid item xs={12}>
                    <FieldLabel>Central Government Subsidy Scheme</FieldLabel>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={subsidyType}
                      onChange={(e) => setSubsidyType(e.target.value)}
                      sx={controlSx}
                    >
                      <MenuItem value="With Subsidy (DCR)" sx={{ fontSize: "0.85rem" }}>
                        PM Surya Ghar Muft Bijli Yojana (DCR Modules - Up to ₹78,000 CFA)
                      </MenuItem>
                      <MenuItem value="No Subsidy (Non-DCR)" sx={{ fontSize: "0.85rem" }}>
                        Non-DCR Panels (Ineligible for Central Subsidy)
                      </MenuItem>
                    </TextField>
                  </Grid>
                )}
              </Grid>
            </Box>

            <Divider sx={{ my: 2.5, borderColor: COLORS.border }} />

            {/* Step 3: Electricity Tariff Rate */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Avatar
                  sx={{
                    bgcolor: COLORS.primarySoft,
                    color: COLORS.primary,
                    width: 24,
                    height: 24,
                    fontSize: "0.75rem",
                    fontWeight: 800,
                  }}
                >
                  3
                </Avatar>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: COLORS.primary,
                    fontFamily: "'Outfit', sans-serif",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Discom Electricity Tariff
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.primary, fontFamily: "'Outfit', sans-serif" }}>
                  ₹{Number(tariffRate).toFixed(2)} <span style={{ fontSize: "0.75rem", color: COLORS.textSecondary, fontWeight: 500 }}>per kWh (unit)</span>
                </Typography>
                <TextField
                  size="small"
                  type="number"
                  value={tariffRate}
                  onChange={(e) => setTariffRate(Math.max(1, Number(e.target.value)))}
                  slotProps={{ htmlInput: { step: 0.25, min: 1, max: 25 } }}
                  sx={{
                    width: 90,
                    ...controlSx,
                    "& .MuiInputBase-input": { py: 0.5, fontSize: "0.8rem", textAlign: "right" },
                  }}
                />
              </Box>

              <Slider
                value={Number(tariffRate)}
                min={2.0}
                max={20.0}
                step={0.25}
                onChange={(_, val) => setTariffRate(val)}
                sx={{
                  color: COLORS.primary,
                  height: 6,
                  "& .MuiSlider-thumb": {
                    width: 16,
                    height: 16,
                    bgcolor: "#FFFFFF",
                    border: `2px solid ${COLORS.primary}`,
                  },
                }}
              />

              <Box sx={{ mt: 1.5, p: 1.2, bgcolor: COLORS.primarySoft, borderRadius: "8px", display: "flex", alignItems: "center", gap: 1 }}>
                <InfoOutlinedIcon sx={{ color: COLORS.info, fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: "0.75rem" }}>
                  Auto-populated benchmark tariff for <strong>{selectedState}</strong>. Can be manually fine-tuned.
                </Typography>
              </Box>
            </Box>

            {/* Recalculate Button */}
            <Box sx={{ mt: 3, pt: 1 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => runCalculation(true)}
                disabled={loading}
                startIcon={<SpeedIcon />}
                sx={{
                  bgcolor: COLORS.primary,
                  color: "#FFFFFF",
                  borderRadius: "8px",
                  fontWeight: 700,
                  py: 1.2,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.9rem",
                  textTransform: "none",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.25)",
                  "&:hover": {
                    bgcolor: COLORS.primaryDark,
                  },
                }}
              >
                {loading ? "Optimizing Sizing..." : "Calculate Solar System"}
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* RIGHT COLUMN: Engineering & Financial Analysis (Screen View) */}
        <Grid item xs={12} lg={7} ref={resultsRef}>
          <Paper
            elevation={0}
            sx={{
              bgcolor: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "14px",
              boxShadow: "0 2px 12px rgba(15, 23, 42, 0.04)",
              p: { xs: 2.5, sm: 3.5 },
            }}
          >
            {/* Screen Header Title */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: "'Outfit', sans-serif" }}>
                  Engineering Sizing & Financial Appraisal
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontFamily: "'Inter', sans-serif" }}>
                  Configured for {propertyType} consumer in {selectedState} ({calcResult.connection_phase || "Single Phase"})
                </Typography>
              </Box>
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: 16, color: `${COLORS.success} !important` }} />}
                label={calcResult.is_feasible ? "Feasible Installation" : "Constrained Roof Space"}
                size="small"
                sx={{
                  bgcolor: calcResult.is_feasible ? COLORS.successSoft : COLORS.warningSoft,
                  color: calcResult.is_feasible ? COLORS.success : COLORS.warning,
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  borderRadius: "6px",
                }}
              />
            </Box>

            {/* Hero Plant Capacity & Investment Box */}
            <Card
              elevation={0}
              sx={{
                mb: 3,
                p: 2.5,
                borderRadius: "12px",
                bgcolor: COLORS.primarySoft,
                border: `1px solid ${COLORS.borderStrong}`,
              }}
            >
              <Grid container spacing={2} sx={{ alignItems: "center" }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Recommended Plant Capacity
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 900, color: COLORS.primary, fontFamily: "'Outfit', sans-serif", my: 0.5 }}>
                    {calcResult.recommended_kw ?? 0} <span style={{ fontSize: "1.2rem", fontWeight: 700 }}>kWp</span>
                  </Typography>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block" }}>
                    {calcResult.panel_count ?? 0} Panels × {calcResult.panel_wattage ?? 550}W Mono PERC Half-Cut
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: COLORS.card, borderRadius: "10px", border: `1px solid ${COLORS.border}` }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Gross System Cost:</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{formatIndianCurrency(calcResult.gross_cost)}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.8 }}>
                      <Typography variant="caption" sx={{ color: COLORS.success, fontWeight: 600 }}>PM Surya Ghar Subsidy:</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.success }}>- ₹{(calcResult.subsidy_amount ?? 0).toLocaleString("en-IN")}</Typography>
                    </Box>
                    <Divider sx={{ my: 0.6 }} />
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary }}>Net Investment:</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: "'Outfit', sans-serif" }}>{formatIndianCurrency(calcResult.net_cost)}</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Card>

            {/* Analysis Navigation Tabs */}
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                mb: 3,
                borderBottom: `1px solid ${COLORS.border}`,
                "& .MuiTab-root": {
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  textTransform: "none",
                  minHeight: 40,
                  py: 1,
                  color: COLORS.textSecondary,
                  "&.Mui-selected": { color: COLORS.primary, fontWeight: 700 },
                },
                "& .MuiTabs-indicator": {
                  bgcolor: COLORS.primary,
                  height: 2.5,
                  borderRadius: "2px",
                },
              }}
            >
              <Tab icon={<CurrencyRupeeIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Financial Appraisal & BOM" />
              <Tab icon={<PrecisionManufacturingIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Technical & Roof Clearance" />
              <Tab icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Seasonal Generation" />
              <Tab icon={<TimelineIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="25-Year Cash Flow" />
            </Tabs>

            {/* SECTION 1: FINANCIAL OVERVIEW & BOM BREAKDOWN */}
            {activeTab === 0 && (
              <Box>
                <Grid container spacing={2} mb={3}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 2, bgcolor: "#FAFBFC", borderRadius: "10px", border: `1px solid ${COLORS.border}`, textAlign: "center" }}>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600, textTransform: "uppercase" }}>Monthly Generation</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: "'Outfit', sans-serif", my: 0.3 }}>
                        {(calcResult.monthly_generation_kwh ?? 0).toLocaleString("en-IN")} kWh
                      </Typography>
                      <Typography variant="caption" sx={{ color: COLORS.textMuted }}>~{calcResult.daily_generation_kwh ?? 0} units/day</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 2, bgcolor: "#FAFBFC", borderRadius: "10px", border: `1px solid ${COLORS.border}`, textAlign: "center" }}>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600, textTransform: "uppercase" }}>Monthly Bill Savings</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.success, fontFamily: "'Outfit', sans-serif", my: 0.3 }}>
                        ₹{(calcResult.monthly_savings ?? 0).toLocaleString("en-IN")}
                      </Typography>
                      <Typography variant="caption" sx={{ color: COLORS.textMuted }}>₹{(calcResult.annual_savings ?? 0).toLocaleString("en-IN")} / year</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 2, bgcolor: "#FAFBFC", borderRadius: "10px", border: `1px solid ${COLORS.border}`, textAlign: "center" }}>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600, textTransform: "uppercase" }}>25-Year Net Benefit</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: "'Outfit', sans-serif", my: 0.3 }}>
                        {formatIndianCurrency(calcResult.twenty_five_year_savings)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: COLORS.textMuted }}>Payback: {calcResult.payback_years} Yrs</Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.primary, mb: 1.5, fontFamily: "'Outfit', sans-serif" }}>
                  EPC Bill of Materials (BOM) Cost Distribution
                </Typography>

                <Paper elevation={0} sx={{ border: `1px solid ${COLORS.border}`, borderRadius: "10px", overflow: "hidden", mb: 3 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: COLORS.primarySoft }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "0.8rem", py: 1 }}>Component / Service</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "0.8rem", py: 1 }}>Standard Share</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "0.8rem", py: 1 }}>Estimated Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[
                        {
                          item: `Solar PV Modules (${calcResult.panel_count ?? 0} Panels × 550W)`,
                          share: "55%",
                          cost: calcResult.structured?.financial?.bom_breakdown?.panel_cost || calcResult.gross_cost * 0.55,
                        },
                        {
                          item: `Grid-Tied Inverter & AC/DC Protection (${calcResult.inverter_kw ?? 0} kW)`,
                          share: "20%",
                          cost: calcResult.structured?.financial?.bom_breakdown?.inverter_cost || calcResult.gross_cost * 0.2,
                        },
                        {
                          item: "Galvanized Elevated Structure, Cables & BOS",
                          share: "15%",
                          cost: calcResult.structured?.financial?.bom_breakdown?.structure_bos_cost || calcResult.gross_cost * 0.15,
                        },
                        {
                          item: "Installation, Earthing, Testing & Net-Metering Liaison",
                          share: "10%",
                          cost: calcResult.structured?.financial?.bom_breakdown?.installation_testing_cost || calcResult.gross_cost * 0.1,
                        },
                      ].map((row, idx) => (
                        <TableRow key={idx} sx={{ "&:last-child td": { border: 0 } }}>
                          <TableCell sx={{ fontSize: "0.8125rem", color: COLORS.textPrimary }}>{row.item}</TableCell>
                          <TableCell sx={{ fontSize: "0.8125rem", color: COLORS.textSecondary }}>{row.share}</TableCell>
                          <TableCell align="right" sx={{ fontSize: "0.8125rem", fontWeight: 700, color: COLORS.primary }}>
                            {formatIndianCurrency(row.cost)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>

                <Box sx={{ p: 2, bgcolor: COLORS.successSoft, borderRadius: "10px", border: `1px solid ${COLORS.success}40`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: COLORS.success, color: "#FFFFFF", width: 36, height: 36 }}>
                      <ForestIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.success }}>
                        Environmental Impact (25-Year Lifecycle)
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#14532D" }}>
                        Mitigates <strong>{calcResult.co2_offset_tonnes ?? 0} Tonnes</strong> of CO2 emissions
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={`Equivalent to ${calcResult.trees_planted ?? 0} Trees Planted`}
                    size="small"
                    sx={{ bgcolor: "#FFFFFF", color: COLORS.success, fontWeight: 700, fontSize: "0.75rem", border: `1px solid ${COLORS.success}` }}
                  />
                </Box>
              </Box>
            )}

            {/* SECTION 2: TECHNICAL SPECS & ROOFTOP CLEARANCE */}
            {activeTab === 1 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.primary, mb: 1.5, fontFamily: "'Outfit', sans-serif" }}>
                  System Hardware Specifications
                </Typography>

                <Paper elevation={0} sx={{ border: `1px solid ${COLORS.border}`, borderRadius: "10px", p: 2, mb: 3 }}>
                  <Grid container spacing={2}>
                    {[
                      { label: "Selected PV Module", val: `${calcResult.structured?.system?.panel_brand || "Waaree Solar"} (${calcResult.panel_wattage ?? 550}W DCR Mono PERC)` },
                      { label: "Installed DC Capacity", val: `${calcResult.structured?.system?.actual_dc_kw || calcResult.recommended_kw} kWp DC (${calcResult.panel_count ?? 0} Modules)` },
                      { label: "Grid Inverter Rating", val: `${calcResult.structured?.system?.inverter_brand || "Growatt / Solis"} (${calcResult.inverter_kw ?? 0} kW AC)` },
                      { label: "Connection Phase", val: `${calcResult.connection_phase || "Single Phase"} (On-Grid Net Metering)` },
                      { label: "Module Technology", val: "Monocrystalline Half-Cut Multi-Busbar (MBB) DCR" },
                      { label: "Warranty Standard", val: "12-Year Product Warranty + 25-Year Performance Warranty" },
                    ].map((item, idx) => (
                      <Grid item xs={12} sm={6} key={idx}>
                        <Box sx={{ p: 1.2, bgcolor: "#FAFBFC", borderRadius: "8px", border: `1px solid ${COLORS.border}` }}>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block" }}>{item.label}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.primary }}>{item.val}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.primary, mb: 1.5, fontFamily: "'Outfit', sans-serif" }}>
                  Rooftop Space Clearance & Structural Feasibility
                </Typography>

                <Paper elevation={0} sx={{ border: `1px solid ${COLORS.border}`, borderRadius: "10px", p: 2.5, mb: 2 }}>
                  <Grid container spacing={2} mb={2}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Available Roof</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary }}>{calcResult.roof_area_sqft || 500} sq.ft</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Usable Space ({calcResult.roof_usable_percent}%)</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.info }}>{calcResult.usable_roof_area_sqft} sq.ft</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Required Area</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary }}>{calcResult.required_area_sqft} sq.ft</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Clearance Margin</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.success }}>{calcResult.remaining_roof_area_sqft} sq.ft</Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Math.round(((calcResult.required_area_sqft || 1) / (calcResult.usable_roof_area_sqft || 1)) * 100))}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: COLORS.primarySoft,
                      "& .MuiLinearProgress-bar": {
                        bgcolor: calcResult.is_feasible ? COLORS.success : COLORS.danger,
                        borderRadius: 4,
                      },
                    }}
                  />

                  <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                    {calcResult.is_feasible ? (
                      <CheckCircleIcon sx={{ color: COLORS.success, fontSize: 18 }} />
                    ) : (
                      <WarningAmberIcon sx={{ color: COLORS.warning, fontSize: 18 }} />
                    )}
                    <Typography variant="caption" sx={{ color: calcResult.is_feasible ? COLORS.success : COLORS.warning, fontWeight: 600 }}>
                      {calcResult.is_feasible
                        ? "Adequate shade-free rooftop clearance available for safe installation and maintenance walkways."
                        : "Caution: Recommended capacity requires more space than usable roof area. Consider higher-wattage modules."}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            )}

            {/* SECTION 3: 12-MONTH SEASONAL GENERATION PROFILE */}
            {activeTab === 2 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.primary, mb: 1.5, fontFamily: "'Outfit', sans-serif" }}>
                  12-Month Solar Yield Distribution (Seasonality Model)
                </Typography>

                <Grid container spacing={1.5}>
                  {calcResult.structured?.generation?.monthly_breakdown?.map((m) => (
                    <Grid item xs={4} sm={3} md={2} key={m.month}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: "8px",
                          border: `1px solid ${COLORS.border}`,
                          bgcolor: "#FAFBFC",
                          textAlign: "center",
                          transition: "all 0.15s ease",
                          "&:hover": { borderColor: COLORS.primary, bgcolor: "#FFFFFF" },
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, display: "block" }}>
                          {m.month.toUpperCase()}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: "'Outfit', sans-serif", my: 0.2 }}>
                          {m.generation_kwh}
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.textMuted, fontSize: "0.7rem" }}>
                          ~{m.daily_avg_kwh}/day
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                <Box sx={{ mt: 2.5, p: 2, bgcolor: COLORS.primarySoft, borderRadius: "10px", display: "flex", alignItems: "center", gap: 1 }}>
                  <InfoOutlinedIcon sx={{ color: COLORS.info, fontSize: 18 }} />
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: "0.78rem" }}>
                    Generation peaks during March–May with average <strong>~{calcResult.daily_generation_kwh ?? 0} kWh/day</strong> based on regional solar irradiance data in {selectedState}.
                  </Typography>
                </Box>
              </Box>
            )}

            {/* SECTION 4: 25-YEAR LIFECYCLE CASH FLOW */}
            {activeTab === 3 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.primary, mb: 1, fontFamily: "'Outfit', sans-serif" }}>
                  25-Year Lifecycle Financial Cash Flow Schedule
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block", mb: 2 }}>
                  Models 0.55% annual PV degradation and 3.0% annual grid electricity tariff inflation.
                </Typography>

                <TableContainer sx={{ border: `1px solid ${COLORS.border}`, borderRadius: "10px", maxHeight: 340 }}>
                  <Table size="small" stickyHeader>
                    <TableHead sx={{ bgcolor: COLORS.primarySoft }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", bgcolor: COLORS.primarySoft }}>Year</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", bgcolor: COLORS.primarySoft }}>Generation (kWh)</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", bgcolor: COLORS.primarySoft }}>Grid Tariff</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", bgcolor: COLORS.primarySoft }}>Annual Savings</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", bgcolor: COLORS.primarySoft }}>Cumulative Savings</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {calcResult.structured?.cashflow_schedule?.map((row) => {
                        const isPaybackYear = row.year === Math.ceil(calcResult.payback_years || 3);
                        return (
                          <TableRow
                            key={row.year}
                            sx={{
                              bgcolor: isPaybackYear ? COLORS.successSoft : "transparent",
                              "&:hover": { bgcolor: COLORS.primarySoft },
                            }}
                          >
                            <TableCell sx={{ fontSize: "0.78rem", fontWeight: 700 }}>
                              Year {row.year} {isPaybackYear && <Chip label="Payback" size="small" sx={{ height: 18, fontSize: "0.65rem", bgcolor: COLORS.success, color: "#fff", ml: 0.5 }} />}
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.78rem" }}>{row.generation_kwh.toLocaleString("en-IN")}</TableCell>
                            <TableCell sx={{ fontSize: "0.78rem" }}>₹{row.tariff_rate.toFixed(2)}</TableCell>
                            <TableCell sx={{ fontSize: "0.78rem", color: COLORS.success, fontWeight: 600 }}>₹{row.annual_savings.toLocaleString("en-IN")}</TableCell>
                            <TableCell sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.primary }}>₹{row.cumulative_savings.toLocaleString("en-IN")}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Bottom Action Footer Bar (Screen View) */}
            <Box
              sx={{
                mt: 3.5,
                pt: 2.5,
                borderTop: `1px solid ${COLORS.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1.5,
              }}
            >
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={handleSaveCalculation}
                disabled={saving}
                sx={{
                  borderRadius: "8px",
                  borderColor: COLORS.borderStrong,
                  color: COLORS.textPrimary,
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  textTransform: "none",
                  fontFamily: "'Inter', sans-serif",
                  "&:hover": {
                    borderColor: COLORS.primary,
                    bgcolor: COLORS.primarySoft,
                  },
                }}
              >
                {saving ? "Saving to Database..." : "Save Calculation to Lead"}
              </Button>

              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => setOpenQuotationModal(true)}
                sx={{
                  bgcolor: COLORS.primary,
                  color: "#FFFFFF",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  px: 3,
                  py: 1.1,
                  borderRadius: "8px",
                  textTransform: "none",
                  fontFamily: "'Inter', sans-serif",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.2)",
                  "&:hover": {
                    bgcolor: COLORS.primaryDark,
                  },
                }}
              >
                Create Official Web Quotation & Proposal Link
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ============================================================
          EXECUTIVE 1-PAGE SOLAR EPC PROPOSAL (PRINT-ONLY)
          Strictly Fits on 1 Single A4 Sheet | Minimalist Slate EPC Theme
         ============================================================ */}
      <Box
        id="solar-executive-pdf-document"
        sx={{
          bgcolor: "#FFFFFF",
          color: "#0F172A",
          fontFamily: "'Inter', 'Helvetica', Arial, sans-serif",
          fontSize: "9pt",
          lineHeight: 1.35,
          p: 0,
        }}
      >
        {/* 1. Formal Executive Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", pb: 0.8, borderBottom: "2px solid #0F172A" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, maxWidth: "60%" }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Company Logo" style={{ maxHeight: 42, maxWidth: 120, objectFit: "contain" }} />
            ) : (
              <Box sx={{ bgcolor: "#0F172A", color: "#FFFFFF", p: 0.8, borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SolarPowerIcon sx={{ fontSize: 24 }} />
              </Box>
            )}
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: "13pt", color: "#0F172A", lineHeight: 1.1, fontFamily: "'Outfit', sans-serif" }}>
                {companySettings?.company_name || "SOLAR EPC SOLUTIONS"}
              </Typography>
              <Typography sx={{ fontSize: "8pt", color: "#475569", mt: 0.3 }}>
                {[companySettings?.address, companySettings?.city, companySettings?.state, companySettings?.pincode].filter(Boolean).join(", ")}
              </Typography>
              <Typography sx={{ fontSize: "8pt", color: "#475569" }}>
                Tel: {companySettings?.company_phone || "+91 98765 43210"} | Email: {companySettings?.company_email || "info@solarepc.com"}
                {companySettings?.gst_number && ` | GSTIN: ${companySettings.gst_number}`}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: "right", maxWidth: "38%" }}>
            <Typography sx={{ fontWeight: 900, fontSize: "10.5pt", color: "#0F172A", textTransform: "uppercase", letterSpacing: 0.5 }}>
              SOLAR PV FEASIBILITY REPORT
            </Typography>
            <Typography sx={{ fontSize: "8pt", color: "#475569" }}>
              Doc Ref: <strong>SOL-EPC-{new Date().getFullYear()}-{Date.now().toString().slice(-4)}</strong>
            </Typography>
            <Typography sx={{ fontSize: "8pt", color: "#475569" }}>
              Date: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </Typography>
            <Typography sx={{ fontSize: "8.5pt", fontWeight: 700, color: "#0F172A", mt: 0.2 }}>
              Client: {embeddedLead?.customer_name || "Prospective Client"} ({selectedState})
            </Typography>
          </Box>
        </Box>

        {/* 2. Key Metrics Summary Strip (Minimalist Corporate 4-Grid) */}
        <Box sx={{ display: "flex", border: "1px solid #CBD5E1", borderRadius: "4px", my: 0.8, overflow: "hidden", bgcolor: "#FAFBFC" }}>
          {[
            { label: "RECOMMENDED CAPACITY", val: `${calcResult.recommended_kw} kWp`, sub: `${calcResult.panel_count} Panels (550W DCR)` },
            { label: "CUSTOMER NET INVESTMENT", val: formatIndianCurrency(calcResult.net_cost), sub: `Gross: ${formatIndianCurrency(calcResult.gross_cost)} | CFA: ₹${(calcResult.subsidy_amount || 0).toLocaleString("en-IN")}` },
            { label: "1ST YEAR ELECTRICITY SAVINGS", val: `₹${(calcResult.annual_savings || 0).toLocaleString("en-IN")}`, sub: `₹${(calcResult.monthly_savings || 0).toLocaleString("en-IN")}/mo at ₹${tariffRate.toFixed(2)}/u` },
            { label: "PAYBACK & LIFETIME RETURN", val: `${calcResult.payback_years} Years`, sub: `ROI: ${calcResult.annual_roi_percent}% | 25-Yr: ${formatIndianCurrency(calcResult.twenty_five_year_savings)}` },
          ].map((item, idx) => (
            <Box key={idx} sx={{ flex: 1, p: 0.7, textAlign: "center", borderRight: idx < 3 ? "1px solid #E2E8F0" : "none" }}>
              <Typography sx={{ fontSize: "7.5pt", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>{item.label}</Typography>
              <Typography sx={{ fontSize: "12pt", fontWeight: 900, color: "#0F172A", my: 0.2, fontFamily: "'Outfit', sans-serif" }}>{item.val}</Typography>
              <Typography sx={{ fontSize: "7.5pt", color: "#475569" }}>{item.sub}</Typography>
            </Box>
          ))}
        </Box>

        {/* 3. Engineering Hardware & Commercial Tables (Side by Side) */}
        <Box sx={{ display: "flex", gap: "2%", mb: 0.8 }}>
          {/* Left Table: Technical Hardware Specs */}
          <Box sx={{ width: "49%", border: "1px solid #CBD5E1", borderRadius: "4px", overflow: "hidden" }}>
            <Box sx={{ bgcolor: "#0F172A", color: "#FFFFFF", px: 1, py: 0.4 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "8.5pt", textTransform: "uppercase", letterSpacing: 0.5 }}>
                1. System Technical Specifications
              </Typography>
            </Box>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8.2pt" }}>
              <tbody>
                {[
                  ["PV Module Model", "550W Monocrystalline Half-Cut PERC (DCR)"],
                  ["Installed DC Rating", `${calcResult.structured?.system?.actual_dc_kw || calcResult.recommended_kw} kWp (${calcResult.panel_count} Modules)`],
                  ["Grid Inverter Rating", `${calcResult.inverter_kw} kW AC (${calcResult.connection_phase || "Single Phase"})`],
                  ["Grid Synchronization", "On-Grid Bi-Directional Net-Metered"],
                  ["Daily Generation Avg", `~${calcResult.daily_generation_kwh} kWh / Day (${selectedState})`],
                  ["Annual Generation", `${(calcResult.annual_generation_kwh || 0).toLocaleString("en-IN")} kWh / Year`],
                  ["Rooftop Space Clearance", `${calcResult.required_area_sqft} sq.ft Required (Adequate & Feasible)`],
                ].map(([label, val], idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#FAFBFC" }}>
                    <td style={{ padding: "3px 8px", color: "#64748B", fontWeight: 600, width: "45%" }}>{label}</td>
                    <td style={{ padding: "3px 8px", color: "#0F172A", fontWeight: 700 }}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>

          {/* Right Table: Commercial Appraisal & Subsidy */}
          <Box sx={{ width: "49%", border: "1px solid #CBD5E1", borderRadius: "4px", overflow: "hidden" }}>
            <Box sx={{ bgcolor: "#0F172A", color: "#FFFFFF", px: 1, py: 0.4 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "8.5pt", textTransform: "uppercase", letterSpacing: 0.5 }}>
                2. Commercial Appraisal & Subsidy Breakdown
              </Typography>
            </Box>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8.2pt" }}>
              <tbody>
                {[
                  ["Gross EPC Project Cost", formatIndianCurrency(calcResult.gross_cost)],
                  ["PM Surya Ghar Govt. CFA", `- ₹${(calcResult.subsidy_amount || 0).toLocaleString("en-IN")} (${calcResult.subsidy_formula_text})`],
                  ["Net Customer Investment", formatIndianCurrency(calcResult.net_cost)],
                  ["1st Year Tariff Rate", `₹${tariffRate.toFixed(2)} / kWh (DISCOM Benchmark)`],
                  ["1st Year Net Savings", `₹${(calcResult.annual_savings || 0).toLocaleString("en-IN")} / Year`],
                  ["Simple Payback Period", `${calcResult.payback_years} Years (Breakeven)`],
                  ["25-Year Net Benefit", formatIndianCurrency(calcResult.twenty_five_year_savings)],
                ].map(([label, val], idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: idx === 2 ? "#F1F5F9" : idx % 2 === 0 ? "#FFFFFF" : "#FAFBFC" }}>
                    <td style={{ padding: "3px 8px", color: idx === 2 ? "#0F172A" : "#64748B", fontWeight: idx === 2 ? 800 : 600, width: "45%" }}>{label}</td>
                    <td style={{ padding: "3px 8px", color: idx === 2 ? "#0F172A" : "#0F172A", fontWeight: 800 }}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Box>

        {/* 4. Bill of Materials (BOM) & Environmental Metrics (Side by Side) */}
        <Box sx={{ display: "flex", gap: "2%", mb: 0.8 }}>
          {/* Left: BOM Share */}
          <Box sx={{ width: "49%", border: "1px solid #CBD5E1", borderRadius: "4px", p: 0.7, bgcolor: "#FAFBFC" }}>
            <Typography sx={{ fontWeight: 800, fontSize: "8pt", textTransform: "uppercase", color: "#0F172A", mb: 0.3 }}>
              3. Bill of Materials (BOM) Distribution
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "7.8pt", color: "#475569" }}>
              <span>Modules (55%): <strong>{formatIndianCurrency(calcResult.gross_cost * 0.55)}</strong></span>
              <span>Inverter (20%): <strong>{formatIndianCurrency(calcResult.gross_cost * 0.20)}</strong></span>
              <span>BOS/Structure (15%): <strong>{formatIndianCurrency(calcResult.gross_cost * 0.15)}</strong></span>
              <span>Civil/Install (10%): <strong>{formatIndianCurrency(calcResult.gross_cost * 0.10)}</strong></span>
            </Box>
          </Box>

          {/* Right: Environmental Impact */}
          <Box sx={{ width: "49%", border: "1px solid #CBD5E1", borderRadius: "4px", p: 0.7, bgcolor: "#FAFBFC" }}>
            <Typography sx={{ fontWeight: 800, fontSize: "8pt", textTransform: "uppercase", color: "#0F172A", mb: 0.3 }}>
              4. Environmental Carbon Offsets
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "7.8pt", color: "#475569" }}>
              <span>25-Yr CO₂ Mitigated: <strong>{calcResult.co2_offset_tonnes} Tonnes</strong></span>
              <span>Equivalent Trees: <strong>~{calcResult.trees_planted} Trees</strong></span>
              <span>Clean Green Power: <strong>100% Sustainable</strong></span>
            </Box>
          </Box>
        </Box>

        {/* 5. Warranties & Lifecycle Terms Strip */}
        <Box sx={{ border: "1px solid #CBD5E1", borderRadius: "4px", p: 0.7, mb: 1, bgcolor: "#FFFFFF" }}>
          <Typography sx={{ fontWeight: 800, fontSize: "8pt", textTransform: "uppercase", color: "#0F172A", mb: 0.2 }}>
            5. Standard Warranties & Performance Guarantees
          </Typography>
          <Typography sx={{ fontSize: "7.8pt", color: "#475569", lineHeight: 1.3 }}>
            • <strong>PV Modules:</strong> 12-Year Product Workmanship Guarantee & 25-Year Linear Power Degradation Warranty (≥84.8% at Year 25).<br />
            • <strong>Grid Inverter:</strong> 5-Year Standard Manufacturer Replacement Warranty.<br />
            • <strong>Mounting Structure:</strong> 10-Year Hot-Dip Galvanized Anti-Corrosion Structural Guarantee.
          </Typography>
        </Box>

        {/* 6. AUTHORIZATION & ACCEPTANCE (Full Width, Generous Spacing, Clean Side-by-Side Boxes) */}
        <Box sx={{ borderTop: "1.5px solid #0F172A", pt: 0.8, mt: 0.8 }}>
          <Typography sx={{ fontWeight: 900, fontSize: "9pt", textTransform: "uppercase", color: "#0F172A", letterSpacing: 0.5, mb: 0.2 }}>
            AUTHORIZATION & ACCEPTANCE
          </Typography>
          <Typography sx={{ fontSize: "7.8pt", color: "#64748B", mb: 0.8 }}>
            The customer accepts the system sizing, financial appraisal, and commercial scope outlined above. Project execution is subject to formal rooftop physical inspection and DISCOM net-metering feasibility sanction.
          </Typography>

          {/* Clean Side-by-Side Signature Boxes with 6% Gap */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            {/* Box 1: Client Acceptance (Left, 47% width) */}
            <Box sx={{ width: "47%", border: "1px solid #CBD5E1", borderRadius: "4px", p: 0.9 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "8.5pt", color: "#0F172A", pb: 0.4, borderBottom: "1px solid #E2E8F0" }}>
                Client / Customer Acceptance
              </Typography>
              <Box sx={{ mt: 0.8 }}>
                <Typography sx={{ fontSize: "8pt", color: "#475569", mb: 0.5 }}>
                  Customer Name: <strong>{embeddedLead?.customer_name || "____________________________________"}</strong>
                </Typography>
                <Typography sx={{ fontSize: "8pt", color: "#475569", mb: 1.5 }}>
                  Date of Acceptance: _________________________
                </Typography>
                <Box sx={{ pt: 0.8, borderTop: "1px dashed #94A3B8" }}>
                  <Typography sx={{ fontSize: "7.8pt", color: "#64748B", textAlign: "center" }}>
                    Signature of Customer / Authorized Signatory
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Box 2: EPC Authorized Signatory (Right, 47% width) */}
            <Box sx={{ width: "47%", border: "1px solid #CBD5E1", borderRadius: "4px", p: 0.9 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "8.5pt", color: "#0F172A", pb: 0.4, borderBottom: "1px solid #E2E8F0" }}>
                For {companySettings?.company_name || "Solar EPC Solutions"}
              </Typography>
              <Box sx={{ mt: 0.8 }}>
                <Typography sx={{ fontSize: "8pt", color: "#475569", mb: 0.5 }}>
                  Authorized Signatory: ____________________________________
                </Typography>
                <Typography sx={{ fontSize: "8pt", color: "#475569", mb: 1.5 }}>
                  Date: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </Typography>
                <Box sx={{ pt: 0.8, borderTop: "1px dashed #94A3B8" }}>
                  <Typography sx={{ fontSize: "7.8pt", color: "#64748B", textAlign: "center" }}>
                    Official Signature & Corporate Stamp
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* 7. Document Footer */}
        <Box sx={{ textAlign: "center", mt: 0.8, pt: 0.5, borderTop: "1px dashed #CBD5E1" }}>
          <Typography sx={{ fontSize: "7pt", color: "#64748B" }}>
            {companySettings?.company_name || "Solar EPC Solutions"} • {companySettings?.website || "www.solarcrm.com"} • Support: {companySettings?.company_phone || "+91 98765 43210"} • Email: {companySettings?.company_email || "contact@solarepc.com"} • Computer-generated solar proposal.
          </Typography>
        </Box>
      </Box>

      {/* ============================================================
          HOW TO USE SOLAR CALCULATOR - DETAILED MODAL DIALOG
         ============================================================ */}
      <Dialog
        open={openGuideModal}
        onClose={() => setOpenGuideModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "14px",
            bgcolor: "#FFFFFF",
            boxShadow: "0 10px 40px rgba(15, 23, 42, 0.16)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `1px solid ${COLORS.border}`,
            py: 2,
            px: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ bgcolor: COLORS.primary, color: COLORS.secondary, width: 36, height: 36, borderRadius: "8px" }}>
              <MenuBookIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.primary, fontFamily: "'Outfit', sans-serif" }}>
                Solar EPC Sizing & Calculator Methodology Guide
              </Typography>
              <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontFamily: "'Inter', sans-serif" }}>
                How plant capacity, PM Surya Ghar subsidy, rooftop area & 25-yr financial ROI are computed
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setOpenGuideModal(false)} size="small" sx={{ color: COLORS.textSecondary }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: "#FAFBFC" }}>
          <Stack spacing={2.5}>
            {/* Step 1 Guide */}
            <Card elevation={0} sx={{ p: 2, borderRadius: "10px", border: `1px solid ${COLORS.border}`, bgcolor: "#FFFFFF" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                <Chip label="STEP 1" size="small" sx={{ bgcolor: COLORS.primary, color: "#FFFFFF", fontWeight: 800, fontSize: "0.72rem" }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary }}>
                  Choose Your Sizing Mode
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.82rem", lineHeight: 1.6 }}>
                • <strong>By Monthly Bill (₹)</strong>: Enter the customer’s regular bi-monthly or monthly electricity bill. The calculator divides the bill by your state’s DISCOM unit rate to derive consumption units, then sizes a plant that offsets ~90–100% of their electricity bill.<br />
                • <strong>By Monthly Units (kWh)</strong>: If the customer provides their units from the electricity bill, enter it directly for maximum engineering precision.<br />
                • <strong>By Rooftop Space (sq.ft)</strong>: Enter the total roof footprint and usable percentage. The engine calculates the maximum solar plant capacity that can physically fit on the roof.
              </Typography>
            </Card>

            {/* Step 2 Guide */}
            <Card elevation={0} sx={{ p: 2, borderRadius: "10px", border: `1px solid ${COLORS.border}`, bgcolor: "#FFFFFF" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                <Chip label="STEP 2" size="small" sx={{ bgcolor: COLORS.primary, color: "#FFFFFF", fontWeight: 800, fontSize: "0.72rem" }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary }}>
                  Location, Customer Category & Tariff Auto-Fetch
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.82rem", lineHeight: 1.6 }}>
                • <strong>State Detection</strong>: Selecting the state automatically pulls official average DISCOM tariffs (e.g. Rajasthan ₹8.00/unit, Gujarat ₹7.20/unit, Maharashtra ₹9.50/unit) and regional peak solar irradiation hours.<br />
                • <strong>Customer Category</strong>: Choose between <em>Residential</em> (eligible for PM Surya Ghar subsidy) and <em>Commercial/Industrial</em> (subsidies do not apply, but commercial users benefit from 40% Accelerated Depreciation tax write-offs).
              </Typography>
            </Card>

            {/* Step 3 Guide */}
            <Card elevation={0} sx={{ p: 2, borderRadius: "10px", border: `1px solid ${COLORS.border}`, bgcolor: "#FFFFFF" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                <Chip label="STEP 3" size="small" sx={{ bgcolor: COLORS.primary, color: "#FFFFFF", fontWeight: 800, fontSize: "0.72rem" }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary }}>
                  PM Surya Ghar: Muft Bijli Yojana Central Subsidy Rules
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.82rem", lineHeight: 1.6 }}>
                The calculator implements official Central Financial Assistance (CFA) gazette formulas:<br />
                • <strong>Up to 2.0 kWp</strong>: ₹30,000 per kW (2.0 kWp = <strong>₹60,000</strong>).<br />
                • <strong>Between 2.0 and 3.0 kWp</strong>: ₹60,000 + (kW − 2.0) × ₹18,000.<br />
                • <strong>3.0 kWp and Above</strong>: <strong>₹78,000</strong> (Hard Cap limit for individual residential rooftop consumers).<br />
                • <em>Note:</em> Panels must be Domestic Content Requirement (DCR) compliant to qualify for the subsidy.
              </Typography>
            </Card>

            {/* Step 4 Guide */}
            <Card elevation={0} sx={{ p: 2, borderRadius: "10px", border: `1px solid ${COLORS.border}`, bgcolor: "#FFFFFF" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                <Chip label="STEP 4" size="small" sx={{ bgcolor: COLORS.primary, color: "#FFFFFF", fontWeight: 800, fontSize: "0.72rem" }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary }}>
                  Hardware Sizing, Roof Math & Feasibility Gauge
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.82rem", lineHeight: 1.6 }}>
                • <strong>Solar Modules</strong>: Sized using modern 550W Monocrystalline Half-cut PERC / TopCon panels.<br />
                • <strong>Rooftop Space Benchmark</strong>: 1 kWp of solar requires <strong>~80 sq.ft</strong> of shadow-free rooftop area. This includes panel dimensions (approx 27.6 sq.ft per 550W panel) plus inter-row pitch spacing to prevent mutual row shading and walkway aisles for module cleaning.<br />
                • <strong>Inverter Phase</strong>: Systems up to 8 kWp are configured for Single Phase Net Metering; systems above 8 kWp automatically switch to 3-Phase Grid-Tied Inverters.
              </Typography>
            </Card>

            {/* Step 5 Guide */}
            <Card elevation={0} sx={{ p: 2, borderRadius: "10px", border: `1px solid ${COLORS.border}`, bgcolor: "#FFFFFF" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                <Chip label="STEP 5" size="small" sx={{ bgcolor: COLORS.primary, color: "#FFFFFF", fontWeight: 800, fontSize: "0.72rem" }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary }}>
                  Financial Appraisal, Payback & Proposals
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.82rem", lineHeight: 1.6 }}>
                • <strong>Payback Period</strong>: Calculated as <code>Customer Net Investment ÷ Annual Electricity Savings</code>. In India, residential payback typically ranges between <strong>2.8 to 3.8 years</strong>.<br />
                • <strong>25-Year Lifecycle Cash Flow</strong>: Models 0.55% annual PV degradation and 3.0% annual DISCOM electricity tariff escalation.<br />
                • <strong>1-Click Proposal</strong>: Click <em>Create Proposal</em> to generate an official digital web quotation or <em>Print / PDF</em> for an executive appraisal report with your company branding.
              </Typography>
            </Card>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button
            variant="contained"
            onClick={() => setOpenGuideModal(false)}
            startIcon={<DoneAllIcon />}
            sx={{
              bgcolor: COLORS.primary,
              color: "#FFFFFF",
              borderRadius: "8px",
              fontWeight: 600,
              textTransform: "none",
              px: 3,
              "&:hover": { bgcolor: COLORS.primaryDark },
            }}
          >
            Got It, Back to Calculator
          </Button>
        </DialogActions>
      </Dialog>

      {/* Saved Calculations Modal */}
      <Dialog
        open={openSavedModal}
        onClose={() => setOpenSavedModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px" } }}
      >
        <DialogTitle sx={{ bgcolor: COLORS.primary, color: "#FFFFFF", px: 3, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <HistoryIcon sx={{ color: "#38BDF8" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Saved Solar Calculations &amp; Sizing Records
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenSavedModal(false)} sx={{ color: "#94A3B8", "&:hover": { color: "#FFFFFF" } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, bgcolor: "#FAFBFC" }}>
          {loadingSaved ? (
            <Box sx={{ p: 5, textAlign: "center" }}>
              <CircularProgress size={32} sx={{ color: COLORS.primary }} />
              <Typography variant="body2" sx={{ mt: 1, color: COLORS.textSecondary }}>Loading records...</Typography>
            </Box>
          ) : savedCalculations.length === 0 ? (
            <Box sx={{ p: 5, textAlign: "center" }}>
              <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>
                No saved calculations found yet.
              </Typography>
              <Typography variant="caption" sx={{ color: COLORS.textMuted }}>
                Calculate solar requirements and click "Save Calculation" to persist them.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {savedCalculations.map((sc) => (
                <Paper
                  key={sc.id}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "10px",
                    border: `1px solid ${COLORS.border}`,
                    bgcolor: "#FFFFFF",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.primary }}>
                      {sc.customer_name || "Direct Client"} • {sc.recommended_kw} kW {sc.property_type || "Residential"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block" }}>
                      {sc.phone ? `Ph: ${sc.phone} • ` : ""}{sc.city ? `Location: ${sc.city} • ` : ""}Monthly Bill: ₹{Math.round(sc.monthly_bill || 0).toLocaleString("en-IN")} • Panels: {sc.panel_count} Nos
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.textMuted, fontSize: "0.72rem" }}>
                      Saved on: {new Date(sc.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block" }}>
                        Net Investment
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary }}>
                        ₹{Math.round(sc.net_cost || 0).toLocaleString("en-IN")}
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ReceiptLongIcon sx={{ fontSize: 15 }} />}
                      onClick={() => handleCreateProposalFromSaved(sc)}
                      sx={{
                        bgcolor: COLORS.primary,
                        color: "#FFFFFF",
                        fontWeight: 700,
                        textTransform: "none",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        px: 1.8,
                        "&:hover": { bgcolor: COLORS.primaryDark },
                      }}
                    >
                      Create Proposal ➔
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Proposal Modal Integration */}
      <CreateQuotationModal
        open={openQuotationModal}
        onClose={() => {
          setOpenQuotationModal(false);
          setActiveQuotationCalc(null);
        }}
        calcData={activeQuotationCalc || calcResult}
        leadData={selectedLead || embeddedLead}
      />
    </Box>
  );
};

export default SolarCalculator;
