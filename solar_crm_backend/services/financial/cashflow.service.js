/**
 * Multi-Year Cash Flow & Lifecycle Financial Schedule Engine
 */

const calculateCashFlowSchedule = ({
  netCost = 0,
  initialAnnualGenerationKwh = 0,
  initialTariffRate = 8.0,
  years = 25,
  annualDegradationPercent = 0.55,
  tariffEscalationPercent = 3.0,
}) => {
  const schedule = [];
  let cumulativeSavings = 0;
  let remainingInvestment = netCost;
  let breakevenYear = null;

  let currentGen = initialAnnualGenerationKwh;
  let currentTariff = initialTariffRate;

  for (let year = 1; year <= years; year++) {
    if (year > 1) {
      currentGen *= (1 - annualDegradationPercent / 100);
      currentTariff *= (1 + tariffEscalationPercent / 100);
    }

    const yearSavings = Math.round(currentGen * currentTariff);
    cumulativeSavings += yearSavings;
    remainingInvestment -= yearSavings;

    if (remainingInvestment <= 0 && breakevenYear === null) {
      breakevenYear = year;
    }

    schedule.push({
      year,
      generation_kwh: Math.round(currentGen),
      tariff_rate: parseFloat(currentTariff.toFixed(2)),
      annual_savings: yearSavings,
      cumulative_savings: cumulativeSavings,
      net_cash_flow: yearSavings - (year === 1 ? netCost : 0),
    });
  }

  const twentyFiveYearSavings = Math.round(cumulativeSavings - netCost);

  return {
    lifespan_years: years,
    total_cumulative_savings: cumulativeSavings,
    twenty_five_year_savings: twentyFiveYearSavings,
    breakeven_year: breakevenYear || Math.ceil(netCost / (initialAnnualGenerationKwh * initialTariffRate)),
    cashflow_schedule: schedule,
  };
};

module.exports = {
  calculateCashFlowSchedule,
};
