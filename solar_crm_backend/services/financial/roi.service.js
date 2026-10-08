/**
 * Financial Payback & ROI Engine
 */

const calculatePaybackAndRoi = ({
  grossCost = 0,
  subsidyAmount = 0,
  annualSavings = 0,
}) => {
  const netCost = Math.max(0, grossCost - subsidyAmount);
  const paybackYears = annualSavings > 0 ? parseFloat((netCost / annualSavings).toFixed(1)) : 0.0;
  const annualRoiPercent = netCost > 0 ? parseFloat(((annualSavings / netCost) * 100).toFixed(1)) : 0.0;

  return {
    gross_cost: grossCost,
    subsidy_amount: subsidyAmount,
    net_cost: netCost,
    payback_years: paybackYears,
    annual_roi_percent: annualRoiPercent,
  };
};

module.exports = {
  calculatePaybackAndRoi,
};
