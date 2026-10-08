/**
 * Rooftop Area & Physical Clearance Sizing Service
 */

const calculateRoofArea = ({
  recommendedKw = 1.0,
  roofAreaSqft = 0,
  roofUsablePercent = 100.0,
  netModuleAreaSqft = 0,
}) => {
  const availableAreaSqft = Math.max(0, parseFloat(roofAreaSqft) || 0);
  const usablePercent = Math.min(100, Math.max(10, parseFloat(roofUsablePercent) || 100.0));
  const usableAreaSqft = Math.round(availableAreaSqft * (usablePercent / 100.0));

  // Required rooftop installation area (70 sq.ft per kWp includes walkway + row spacing clearance)
  const requiredAreaSqft = Math.round(recommendedKw * 70.0);
  const remainingAreaSqft = availableAreaSqft > 0 ? Math.max(0, usableAreaSqft - requiredAreaSqft) : 0;

  // Feasibility Check
  let isFeasible = true;
  let feasibilityNote = "Roof space is adequate for recommended solar installation.";

  if (availableAreaSqft > 0 && usableAreaSqft < requiredAreaSqft) {
    isFeasible = false;
    feasibilityNote = `Usable roof area (${usableAreaSqft} sq.ft) is smaller than required area (${requiredAreaSqft} sq.ft). Consider higher efficiency panels or reducing capacity.`;
  }

  const roofUtilizationPercent = usableAreaSqft > 0 ? parseFloat(((requiredAreaSqft / usableAreaSqft) * 100).toFixed(1)) : 0.0;

  return {
    available_roof_area_sqft: availableAreaSqft,
    roof_usable_percent: usablePercent,
    usable_roof_area_sqft: usableAreaSqft,
    required_area_sqft: requiredAreaSqft,
    net_module_area_sqft: netModuleAreaSqft,
    walkway_clearance_sqft: Math.max(0, requiredAreaSqft - netModuleAreaSqft),
    remaining_roof_area_sqft: remainingAreaSqft,
    roof_utilization_percent: Math.min(100, roofUtilizationPercent),
    is_feasible: isFeasible,
    feasibility_note: feasibilityNote,
  };
};

module.exports = {
  calculateRoofArea,
};
