const test = require("node:test");
const assert = require("node:assert/strict");

const { calculateSolarSystem } = require("../services/solarCalculatorService");
const { calculateGovtSubsidy } = require("../services/financial/subsidy.service");
const { calculatePanelHardware } = require("../services/solar/panelSizing.service");
const { calculateInverterHardware } = require("../services/solar/inverterSizing.service");
const { calculateRoofArea } = require("../services/solar/roofSizing.service");
const { calculateCashFlowSchedule } = require("../services/financial/cashflow.service");

test("1. Bill Mode Calculation - 3.58 kWp Waaree Benchmark Match", () => {
  const result = calculateSolarSystem({
    calc_mode: "bill",
    monthly_bill: 3952,
    tariff_rate: 8.0,
    property_type: "Residential",
    subsidy_type: "With Subsidy (DCR)",
    state: "Default",
  });

  assert.equal(result.recommended_kw, 3.58);
  assert.equal(result.monthly_generation_kwh, 446);
  assert.equal(result.annual_generation_kwh, 5314);
  assert.equal(result.thirty_year_generation_kwh, 148271);
  assert.equal(result.gross_cost, 202002);
  assert.equal(result.subsidy_amount, 78000);
  assert.equal(result.net_cost, 124002);
  assert.equal(result.payback_years, 2.9);
  assert.equal(result.annual_roi_percent, 34.3);
  assert.equal(result.co2_offset_tonnes, 122);
  assert.equal(result.trees_planted, 195);
});

test("2. Units Mode Calculation - 494 units input", () => {
  const result = calculateSolarSystem({
    calc_mode: "units",
    monthly_units: 494,
    tariff_rate: 8.0,
    property_type: "Residential",
    subsidy_type: "With Subsidy (DCR)",
    state: "Default",
  });

  assert.equal(result.recommended_kw, 3.58);
  assert.equal(result.monthly_units, 494);
  assert.equal(result.panel_count, 7);
  assert.equal(result.subsidy_amount, 78000);
});

test("3. Roof Area Mode Calculation - 500 sq.ft roof at 100% usability", () => {
  const result = calculateSolarSystem({
    calc_mode: "roof",
    roof_area_sqft: 500,
    roof_usable_percent: 100,
    tariff_rate: 8.0,
  });

  assert.equal(result.recommended_kw, 7.14);
  assert.equal(result.panel_count, 13);
  assert.equal(result.subsidy_amount, 78000); // capped at ₹78,000 for residential
});

test("4. Government Subsidy Rules - PM Surya Ghar Slabs & Caps", () => {
  // 1.5 kW => ₹45,000
  const sub1 = calculateGovtSubsidy({ recommendedKw: 1.5, propertyType: "Residential", subsidyType: "With Subsidy (DCR)" });
  assert.equal(sub1.subsidy_amount, 45000);

  // 2.5 kW => ₹60,000 + (0.5 * 18,000) = ₹69,000
  const sub2 = calculateGovtSubsidy({ recommendedKw: 2.5, propertyType: "Residential", subsidyType: "With Subsidy (DCR)" });
  assert.equal(sub2.subsidy_amount, 69000);

  // 5.0 kW => Capped at max ₹78,000
  const sub3 = calculateGovtSubsidy({ recommendedKw: 5.0, propertyType: "Residential", subsidyType: "With Subsidy (DCR)" });
  assert.equal(sub3.subsidy_amount, 78000);

  // Non-DCR Panels => Ineligible (₹0)
  const sub4 = calculateGovtSubsidy({ recommendedKw: 3.0, propertyType: "Residential", subsidyType: "No Subsidy (Non-DCR)" });
  assert.equal(sub4.subsidy_amount, 0);

  // Commercial Property => Ineligible (₹0)
  const sub5 = calculateGovtSubsidy({ recommendedKw: 10.0, propertyType: "Commercial", subsidyType: "With Subsidy (DCR)" });
  assert.equal(sub5.subsidy_amount, 0);
});

test("5. Panel & Inverter Hardware Sizing", () => {
  const panel = calculatePanelHardware({ recommendedKw: 5.5, panelWattageOverride: 550 });
  assert.equal(panel.panel_count, 10);
  assert.equal(panel.actual_dc_kw, 5.5);

  const inverterSmall = calculateInverterHardware({ recommendedKw: 3.0, actualDcKw: 3.3, connectionPhase: "Single Phase" });
  assert.equal(inverterSmall.inverter_kw, 3.0);
  assert.equal(inverterSmall.connection_phase, "Single Phase");

  const inverterLarge = calculateInverterHardware({ recommendedKw: 10.0, actualDcKw: 11.0, connectionPhase: "Single Phase" });
  assert.equal(inverterLarge.inverter_kw, 10.0);
  assert.equal(inverterLarge.connection_phase, "3 Phase"); // auto upgrades to 3 Phase for > 8kW
});

test("6. Roof Sizing & Feasibility Check", () => {
  // Adequate roof space
  const roofGood = calculateRoofArea({ recommendedKw: 3.0, roofAreaSqft: 400, roofUsablePercent: 100 });
  assert.equal(roofGood.usable_roof_area_sqft, 400);
  assert.equal(roofGood.required_area_sqft, 210);
  assert.equal(roofGood.is_feasible, true);

  // Small / Insufficient roof space
  const roofSmall = calculateRoofArea({ recommendedKw: 5.0, roofAreaSqft: 200, roofUsablePercent: 50 });
  assert.equal(roofSmall.usable_roof_area_sqft, 100);
  assert.equal(roofSmall.required_area_sqft, 350);
  assert.equal(roofSmall.is_feasible, false);
});

test("7. Multi-Year Cashflow & Financial Schedule", () => {
  const cf = calculateCashFlowSchedule({
    netCost: 124000,
    initialAnnualGenerationKwh: 5314,
    initialTariffRate: 8.0,
    years: 25,
  });

  assert.equal(cf.lifespan_years, 25);
  assert.equal(cf.cashflow_schedule.length, 25);
  assert.ok(cf.twenty_five_year_savings > 0);
  assert.ok(cf.breakeven_year <= 5);
});
