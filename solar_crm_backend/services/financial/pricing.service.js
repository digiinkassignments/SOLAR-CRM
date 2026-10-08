/**
 * Solar EPC Pricing & BOM Breakdown Engine
 */

const calculateEpcPricing = ({
  recommendedKw = 1.0,
  subsidyType = "With Subsidy (DCR)",
  systemType = "On-Grid",
}) => {
  // Waaree Base Rates (DCR Panels: ₹56,425 / kWp, Non-DCR: ₹48,500 / kWp)
  const isNonDcr = subsidyType.includes("Non-DCR");
  const costPerKw = isNonDcr ? 48500 : 56425;

  const grossCost = Math.round(recommendedKw * costPerKw);
  const gstRatePercent = 13.80; // Combined Solar Equipment GST Rate in India

  // Bill of Materials (BOM) Breakdown
  const panelCost = Math.round(grossCost * 0.55);
  const inverterCost = Math.round(grossCost * 0.20);
  const structureBosCost = Math.round(grossCost * 0.15);
  const installationTestingCost = Math.round(grossCost * 0.10);

  return {
    cost_per_kw: costPerKw,
    gross_cost: grossCost,
    gst_rate_percent: gstRatePercent,
    bom_breakdown: {
      panel_cost: panelCost,
      inverter_cost: inverterCost,
      structure_bos_cost: structureBosCost,
      installation_testing_cost: installationTestingCost,
    },
  };
};

module.exports = {
  calculateEpcPricing,
};
