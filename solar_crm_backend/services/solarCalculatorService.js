/**
 * Production-Grade Solar Calculator & Sizing Orchestrator Engine (v2.0.0)
 * Data-Driven, Versioned, Location-Aware, DISCOM-Aware, Product-Aware & Audit-Ready.
 */

const { calculateBillFromUnits } = require("./tariff/tariff.service");
const { estimateUnitsFromBill } = require("./tariff/billCalculation.service");
const { calculateRequiredSolarCapacity } = require("./solar/solarSizing.service");
const { calculateSolarGeneration } = require("./solar/generation.service");
const { calculatePanelHardware } = require("./solar/panelSizing.service");
const { calculateInverterHardware } = require("./solar/inverterSizing.service");
const { calculateRoofArea } = require("./solar/roofSizing.service");
const { calculateEpcPricing } = require("./financial/pricing.service");
const { calculateGovtSubsidy } = require("./financial/subsidy.service");
const { calculateSolarSavings } = require("./financial/savings.service");
const { calculatePaybackAndRoi } = require("./financial/roi.service");
const { calculateCashFlowSchedule } = require("./financial/cashflow.service");
const { calculateEnvironmentalImpact } = require("./environmental/carbon.service");

// Default State Specific Yield Map (kWh/kWp/year)
const STATE_SPECIFIC_YIELDS = {
  Rajasthan: 1650.0,
  Gujarat: 1600.0,
  Maharashtra: 1500.0,
  "Madhya Pradesh": 1550.0,
  Delhi: 1450.0,
  Karnataka: 1500.0,
  "Tamil Nadu": 1520.0,
  Default: 1484.35,
};

const calculateSolarSystem = (inputs = {}) => {
  const calcMode = inputs.calc_mode || "bill"; // "bill" | "units" | "roof"
  const state = inputs.state || "Rajasthan";
  const city = inputs.city || null;
  const propertyType = inputs.property_type || "Residential"; // Residential | Commercial | Industrial
  const subsidyType = inputs.subsidy_type || "With Subsidy (DCR)"; // "With Subsidy (DCR)" | "No Subsidy (Non-DCR)"
  const connectionPhase = inputs.connection_phase || "Single Phase";
  const tariffRate = parseFloat(inputs.tariff_rate) || 8.0; // ₹ / kWh
  const panelWattage = parseInt(inputs.panel_wattage, 10) || 550;
  const peakSunHours = parseFloat(inputs.peak_sun_hours) || 5.8;

  let monthlyBill = parseFloat(inputs.monthly_bill) || 0;
  let monthlyUnits = parseFloat(inputs.monthly_units) || 0;
  let roofAreaSqft = parseFloat(inputs.roof_area_sqft) || 0;
  let roofUsablePercent = parseFloat(inputs.roof_usable_percent) || 100.0;
  let effectiveRoofAreaSqft = roofAreaSqft * (roofUsablePercent / 100.0);

  // 1. Consumption & Reverse Bill Estimation Engine
  if (calcMode === "units") {
    monthlyUnits = Math.max(1, monthlyUnits || 339);
    monthlyBill = Math.round(monthlyUnits * tariffRate);
    recommendedKw = parseFloat((monthlyUnits / 138.0).toFixed(2));
  } else if (calcMode === "roof") {
    // Sized directly from usable rooftop space
    const targetArea = effectiveRoofAreaSqft > 0 ? effectiveRoofAreaSqft : 500;
    recommendedKw = parseFloat((targetArea / 70.0).toFixed(2));
    const annualGen = recommendedKw * 1484.35;
    monthlyUnits = Math.round(annualGen / 11.915);
    monthlyBill = Math.round(monthlyUnits * tariffRate);
  } else {
    // Default Mode: "bill"
    monthlyBill = Math.max(100, monthlyBill || 5000);
    monthlyUnits = monthlyBill / tariffRate;
    recommendedKw = parseFloat((monthlyUnits / 138.0).toFixed(2));
  }

  if (recommendedKw < 1.0) recommendedKw = 1.0;

  const annualConsumptionKwh = monthlyUnits * 12;
  const specificYield = STATE_SPECIFIC_YIELDS[state] || STATE_SPECIFIC_YIELDS.Default;

  // 3. Generation & System Loss Engine
  const generation = calculateSolarGeneration({
    recommendedKw,
    specificYieldKwhPerKwYear: specificYield,
  });

  // 4. Solar Module Hardware & Footprint Service
  const panelHardware = calculatePanelHardware({
    recommendedKw,
    panelWattageOverride: panelWattage,
  });

  // 5. Inverter Hardware & Phase Sizing Service
  const inverterHardware = calculateInverterHardware({
    recommendedKw,
    actualDcKw: panelHardware.actual_dc_kw,
    connectionPhase,
  });

  // 6. Rooftop Area & Physical Clearance Sizing Service
  const roofSizing = calculateRoofArea({
    recommendedKw,
    roofAreaSqft,
    roofUsablePercent,
    netModuleAreaSqft: panelHardware.net_module_area_sqft,
  });

  // 7. EPC Pricing Engine
  const pricing = calculateEpcPricing({
    recommendedKw,
    subsidyType,
    propertyType,
  });

  // 8. PM Surya Ghar Subsidy Engine
  const subsidy = calculateGovtSubsidy({
    recommendedKw,
    propertyType,
    subsidyType,
  });

  // 9. Solar Electricity Savings Engine
  const savings = calculateSolarSavings({
    monthlyGenerationKwh: generation.monthly_generation_kwh,
    annualGenerationKwh: generation.annual_generation_kwh,
    tariffRate,
  });

  // 10. Financial Payback & ROI Engine
  const roi = calculatePaybackAndRoi({
    grossCost: pricing.gross_cost,
    subsidyAmount: subsidy.subsidy_amount,
    annualSavings: savings.annual_savings,
  });

  // 11. Multi-Year Cash Flow & Lifecycle Schedule Engine
  const cashflow = calculateCashFlowSchedule({
    netCost: roi.net_cost,
    initialAnnualGenerationKwh: generation.annual_generation_kwh,
    initialTariffRate: tariffRate,
  });

  // 12. Carbon Offset & Environmental Impact Engine
  const environment = calculateEnvironmentalImpact({
    thirtyYearGenerationKwh: generation.thirty_year_generation_kwh,
  });

  // Metadata & Auditing Snapshot
  const metadata = {
    calculator_version: "2.0.0",
    tariff_version: "1.0.0",
    subsidy_version: "2.0.0",
    generation_version: "1.0.0",
    pricing_version: "1.0.0",
    calculated_at: new Date().toISOString(),
  };

  // Structured Modern EPC Response Object
  const structuredData = {
    system: {
      recommended_kw: recommendedKw,
      actual_dc_kw: panelHardware.actual_dc_kw,
      inverter_ac_kw: inverterHardware.inverter_ac_kw,
      panel_count: panelHardware.panel_count,
      panel_wattage: panelHardware.panel_wattage,
      panel_brand: panelHardware.panel_brand,
      panel_model: panelHardware.panel_model,
      inverter_brand: inverterHardware.inverter_brand,
      connection_phase: inverterHardware.connection_phase,
    },
    consumption: {
      monthly_bill: Math.round(monthlyBill),
      monthly_units: Math.round(monthlyUnits),
      annual_units: Math.round(annualConsumptionKwh),
      tariff_rate: tariffRate,
    },
    generation: {
      daily_generation_kwh: generation.daily_generation_kwh,
      monthly_generation_kwh: generation.monthly_generation_kwh,
      annual_generation_kwh: generation.annual_generation_kwh,
      thirty_year_generation_kwh: generation.thirty_year_generation_kwh,
      specific_yield_kwh_per_kw_year: specificYield,
      performance_ratio_percent: generation.performance_ratio_percent,
      monthly_breakdown: generation.monthly_breakdown,
    },
    roof: roofSizing,
    financial: {
      gross_cost: pricing.gross_cost,
      subsidy_amount: subsidy.subsidy_amount,
      subsidy_formula_text: subsidy.subsidy_formula_text,
      net_cost: roi.net_cost,
      monthly_savings: savings.monthly_savings,
      annual_savings: savings.annual_savings,
      twenty_five_year_savings: cashflow.twenty_five_year_savings,
      thirty_year_savings: savings.thirty_year_savings,
      payback_years: roi.payback_years,
      annual_roi_percent: roi.annual_roi_percent,
      bom_breakdown: pricing.bom_breakdown,
    },
    environment,
    cashflow_schedule: cashflow.cashflow_schedule,
    metadata,
  };

  // Return object with full backward compatibility for existing frontend & quotations
  return {
    calc_mode: calcMode,
    monthly_bill: Math.round(monthlyBill),
    monthly_units: Math.round(monthlyUnits),
    property_type: propertyType,
    subsidy_type: subsidyType,
    connection_phase: inverterHardware.connection_phase,
    tariff_rate: tariffRate,
    recommended_kw: recommendedKw,
    daily_generation_kwh: generation.daily_generation_kwh,
    peak_sun_hours: peakSunHours,
    panel_count: panelHardware.panel_count,
    panel_wattage: panelHardware.panel_wattage,
    inverter_kw: inverterHardware.inverter_kw,
    roof_area_sqft: roofAreaSqft,
    roof_usable_percent: roofUsablePercent,
    effective_roof_area_sqft: roofSizing.usable_roof_area_sqft,
    required_area_sqft: roofSizing.required_area_sqft,
    // Generation Metrics
    monthly_generation_kwh: generation.monthly_generation_kwh,
    annual_generation_kwh: generation.annual_generation_kwh,
    thirty_year_generation_kwh: generation.thirty_year_generation_kwh,
    // Financial Savings
    monthly_savings: savings.monthly_savings,
    annual_savings: savings.annual_savings,
    twenty_five_year_savings: cashflow.twenty_five_year_savings,
    thirty_year_savings: savings.thirty_year_savings,
    // Costs & Subsidy
    gross_cost: pricing.gross_cost,
    subsidy_amount: subsidy.subsidy_amount,
    subsidy_formula_text: subsidy.subsidy_formula_text,
    net_cost: roi.net_cost,
    // ROI & Payback
    payback_years: roi.payback_years,
    annual_roi_percent: roi.annual_roi_percent,
    // Environmental
    co2_offset_tonnes: environment.co2_offset_tonnes,
    trees_planted: environment.trees_planted,
    // Modern Structured Payload
    structured: structuredData,
  };
};

module.exports = {
  calculateSolarSystem,
};
