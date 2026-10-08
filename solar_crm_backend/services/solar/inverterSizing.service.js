/**
 * Solar Inverter Sizing & Compatibility Service
 */

const calculateInverterHardware = ({
  recommendedKw = 1.0,
  actualDcKw = 1.0,
  connectionPhase = "Single Phase",
}) => {
  let inverterKw = Math.ceil(recommendedKw);
  let recommendedPhase = connectionPhase;

  // Commercial / larger residential (> 8-10 kW) systems require 3 Phase inverters
  if (recommendedKw > 8.0) {
    recommendedPhase = "3 Phase";
  }

  // Calculate DC to AC oversizing ratio
  const dcAcRatio = parseFloat((actualDcKw / inverterKw).toFixed(2));
  const mpptCount = inverterKw >= 5.0 ? 2 : 1;

  let inverterBrand = "Growatt / Solis";
  if (inverterKw >= 10.0) {
    inverterBrand = "Growatt / Solis / GoodWe 3-Phase";
  }

  return {
    inverter_brand: inverterBrand,
    inverter_kw: inverterKw,
    inverter_ac_kw: inverterKw,
    dc_ac_ratio: dcAcRatio,
    mppt_count: mpptCount,
    connection_phase: recommendedPhase,
    grid_type: "On-Grid Net-Metered",
  };
};

module.exports = {
  calculateInverterHardware,
};
