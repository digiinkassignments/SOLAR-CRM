const indian = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

export const currency = (amount) => `${amount < 0 ? '-' : ''}₹${indian.format(Math.abs(amount))}`;

// Keep the API value unformatted; preserve partial decimal input while typing.
export function moneyInput(value) {
  if (value === '' || value == null) return '';
  const [whole, fraction] = String(value).split('.');
  return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(whole || 0))}${fraction !== undefined ? `.${fraction}` : ''}`;
}

export function openingSummary(data) {
  const cents = (value) => Math.round(Number(value || 0) * 100);
  const total = cents(data.invoice_amount);
  const received = cents(data.payment_amount) + cents(data.loan_disbursed_amount);
  const refund = cents(data.refund_paid_amount);
  const due = Math.max(0, total - received);
  const refundable = Math.max(0, received - total - refund);
  return { received: received / 100, net: (due - refundable) / 100 };
}
