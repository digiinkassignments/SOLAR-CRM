/**
 * DISCOM Tariff Engine
 * Calculates slab-wise energy charges, fixed charges, and duties based on official SERC tariff orders.
 */

// Default Fallback Tariff Slabs if DB/DISCOM is not specified
const DEFAULT_RESIDENTIAL_SLABS = [
  { slab_from_units: 0, slab_to_units: 50, energy_rate: 4.75, fixed_charge: 230 },
  { slab_from_units: 51, slab_to_units: 150, energy_rate: 6.50, fixed_charge: 230 },
  { slab_from_units: 151, slab_to_units: 300, energy_rate: 7.35, fixed_charge: 275 },
  { slab_from_units: 301, slab_to_units: 500, energy_rate: 7.65, fixed_charge: 340 },
  { slab_from_units: 501, slab_to_units: 999999, energy_rate: 7.95, fixed_charge: 400 },
];

/**
 * Calculates total bill amount for a given monthly units consumption using slab structure.
 */
const calculateBillFromUnits = (units = 0, flatRateOverride = null, customSlabs = null) => {
  const totalUnits = Math.max(0, parseFloat(units) || 0);
  if (totalUnits === 0) {
    return {
      total_bill: 0,
      energy_charges: 0,
      fixed_charges: 0,
      effective_per_unit_rate: 0,
      slab_breakdown: [],
    };
  }

  // If a flat tariff rate is explicitly provided (e.g. ₹8.00 / kWh)
  if (flatRateOverride && flatRateOverride > 0) {
    const bill = Math.round(totalUnits * flatRateOverride);
    return {
      total_bill: bill,
      energy_charges: bill,
      fixed_charges: 0,
      effective_per_unit_rate: flatRateOverride,
      slab_breakdown: [
        {
          units: totalUnits,
          rate: flatRateOverride,
          cost: bill,
        },
      ],
    };
  }

  const slabs = customSlabs || DEFAULT_RESIDENTIAL_SLABS;
  let remainingUnits = totalUnits;
  let energyCharges = 0;
  let fixedCharges = 0;
  const breakdown = [];

  for (const slab of slabs) {
    if (remainingUnits <= 0) break;
    const slabSpan = slab.slab_to_units - slab.slab_from_units + 1;
    const unitsInSlab = Math.min(remainingUnits, slabSpan);

    const cost = unitsInSlab * slab.energy_rate;
    energyCharges += cost;
    remainingUnits -= unitsInSlab;

    breakdown.push({
      range: `${slab.slab_from_units}-${slab.slab_to_units}`,
      units: unitsInSlab,
      rate: slab.energy_rate,
      cost: Math.round(cost),
    });

    if (slab.fixed_charge > fixedCharges) {
      fixedCharges = slab.fixed_charge;
    }
  }

  const totalBill = Math.round(energyCharges + fixedCharges);
  const effectiveRate = parseFloat((totalBill / totalUnits).toFixed(2));

  return {
    total_bill: totalBill,
    energy_charges: Math.round(energyCharges),
    fixed_charges: Math.round(fixedCharges),
    effective_per_unit_rate: effectiveRate,
    slab_breakdown: breakdown,
  };
};

module.exports = {
  calculateBillFromUnits,
  DEFAULT_RESIDENTIAL_SLABS,
};
