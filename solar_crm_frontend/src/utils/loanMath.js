// Reducing-balance estimate; lender fees and moratorium terms are not included.
export const calculateEMI = (principal, annualRate = 7, tenureMonths = 60) => {
  const amount = Number(principal);
  const rate = Number(annualRate);
  const months = Number(tenureMonths);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(rate) || rate < 0 || !Number.isInteger(months) || months <= 0) return 0;
  if (rate === 0) return Math.round(amount / months);
  const monthlyRate = rate / 1200;
  const factor = Math.pow(1 + monthlyRate, months);
  return Math.round((amount * monthlyRate * factor) / (factor - 1));
};
