/**
 * Solar System Capacity Sizing Service
 * Determines required solar DC capacity (kWp) based on target annual generation & location specific yield.
 */

const calculateRequiredSolarCapacity = ({
  annualConsumptionKwh = 0,
  targetOffsetPercent = 100.0,
  specificYieldKwhPerKwYear = 1484.35,
  calcMode = "bill",
  effectiveRoofAreaSqft = 0,
  roofSizingRatioSqftPerKw = 70.0, // Waaree standard ~70 sq.ft / kWp
}) => {
  let recommendedKw = 1.0;
  let targetAnnualGeneration = 0;

  if (calcMode === "roof") {
    // Sizing from available usable rooftop area
    const usableArea = effectiveRoofAreaSqft > 0 ? effectiveRoofAreaSqft : 500;
    recommendedKw = parseFloat((usableArea / roofSizingRatioSqftPerKw).toFixed(2));
    targetAnnualGeneration = Math.round(recommendedKw * specificYieldKwhPerKwYear);
  } else {
    // Sizing from consumption requirement & target offset %
    targetAnnualGeneration = (annualConsumptionKwh * (targetOffsetPercent / 100.0));
    const rawKw = targetAnnualGeneration / specificYieldKwhPerKwYear;
    recommendedKw = parseFloat(rawKw.toFixed(2));
  }

  if (recommendedKw < 1.0) recommendedKw = 1.0;

  return {
    recommended_kw: recommendedKw,
    target_annual_generation_kwh: Math.round(targetAnnualGeneration),
    target_offset_percent: targetOffsetPercent,
    specific_yield_kwh_per_kw_year: specificYieldKwhPerKwYear,
  };
};

module.exports = {
  calculateRequiredSolarCapacity,
};
