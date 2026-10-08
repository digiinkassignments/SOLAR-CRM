/**
 * Bill to Units Reverse Estimation Engine
 * Reverses electricity bill to estimate monthly units consumption using DISCOM slabs or effective tariff rate.
 */

const { calculateBillFromUnits, DEFAULT_RESIDENTIAL_SLABS } = require("./tariff.service");

/**
 * Estimates monthly units consumption from a given monthly bill amount.
 */
const estimateUnitsFromBill = (monthlyBill = 0, tariffRate = 8.0, customSlabs = null) => {
  const bill = Math.max(0, parseFloat(monthlyBill) || 0);
  if (bill === 0) {
    return {
      monthly_units: 0,
      estimation_method: "zero_input",
    };
  }

  // If simple tariff rate is provided
  if (tariffRate && tariffRate > 0) {
    const units = Math.round(bill / tariffRate);
    return {
      monthly_units: units,
      estimation_method: "flat_tariff_rate",
      effective_rate: tariffRate,
    };
  }

  // Iterative binary search slab solver for precise reverse slab estimation
  const slabs = customSlabs || DEFAULT_RESIDENTIAL_SLABS;
  let low = 1;
  let high = 5000;
  let estimatedUnits = Math.round(bill / 8.0); // baseline guess

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const calc = calculateBillFromUnits(mid, null, slabs);

    if (Math.abs(calc.total_bill - bill) < 10) {
      estimatedUnits = mid;
      break;
    }

    if (calc.total_bill < bill) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return {
    monthly_units: estimatedUnits,
    estimation_method: "tariff_reverse_slab_calculation",
  };
};

module.exports = {
  estimateUnitsFromBill,
};
