/**
 * Solar Panel Hardware & Physical Footprint Sizing Service
 */

const DEFAULT_PANEL = {
  brand: "Waaree Solar",
  model: "Arka Series 550W Mono PERC DCR",
  wattage: 550,
  length_mm: 2278,
  width_mm: 1134,
  efficiency: 21.28,
  technology: "Mono PERC Half-Cut DCR",
  is_dcr: 1,
};

const calculatePanelHardware = ({
  recommendedKw = 1.0,
  panelWattageOverride = null,
  customPanel = null,
}) => {
  const panel = customPanel || DEFAULT_PANEL;
  const wattage = parseInt(panelWattageOverride, 10) || panel.wattage || 550;

  const totalWattsNeeded = recommendedKw * 1000;
  const panelCount = Math.ceil(totalWattsNeeded / wattage);
  const actualDcKw = parseFloat(((panelCount * wattage) / 1000).toFixed(2));
  const dcOversizingPercent = parseFloat((((actualDcKw - recommendedKw) / recommendedKw) * 100).toFixed(1));

  // Physical Dimensions
  const lengthM = (panel.length_mm || 2278) / 1000;
  const widthM = (panel.width_mm || 1134) / 1000;
  const singlePanelAreaSqM = lengthM * widthM;
  const singlePanelAreaSqFt = singlePanelAreaSqM * 10.7639;

  // Net PV module array footprint area
  const netModuleAreaSqft = Math.round(panelCount * singlePanelAreaSqFt);

  return {
    panel_brand: panel.brand,
    panel_model: panel.model,
    panel_technology: panel.technology,
    panel_wattage: wattage,
    panel_count: panelCount,
    actual_dc_kw: actualDcKw,
    dc_oversizing_percent: dcOversizingPercent,
    single_panel_area_sqft: parseFloat(singlePanelAreaSqFt.toFixed(2)),
    net_module_area_sqft: netModuleAreaSqft,
    is_dcr: Boolean(panel.is_dcr),
  };
};

module.exports = {
  calculatePanelHardware,
  DEFAULT_PANEL,
};
