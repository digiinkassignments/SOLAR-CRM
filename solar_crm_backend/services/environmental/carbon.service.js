/**
 * Environmental Impact & Carbon Mitigation Engine
 */

const calculateEnvironmentalImpact = ({
  thirtyYearGenerationKwh = 0,
  gridEmissionFactorKgPerKwh = 0.82,
}) => {
  const co2OffsetKg = thirtyYearGenerationKwh * gridEmissionFactorKgPerKwh;
  const co2OffsetTonnes = Math.round(co2OffsetKg / 1000);
  const treesPlanted = Math.round(co2OffsetTonnes * 1.6); // Documented tree offset conversion factor

  return {
    grid_emission_factor_kg_per_kwh: gridEmissionFactorKgPerKwh,
    thirty_year_co2_offset_kg: Math.round(co2OffsetKg),
    co2_offset_tonnes: co2OffsetTonnes,
    trees_planted: treesPlanted,
  };
};

module.exports = {
  calculateEnvironmentalImpact,
};
