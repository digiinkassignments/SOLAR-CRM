// Money is calculated in paise. Never net separate invoices against each other.
const paise = (value) => Math.round(Number(value || 0) * 100);
const date = (value) =>
  value instanceof Date
    ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
    : String(value || '').slice(0, 10);
const days = (from, to) =>
  Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 86400000);

function calculate(
  invoices,
  opening,
  loans = [],
  refunds = [],
  credits = [],
  milestones = [],
  today
) {
  const rows = invoices.map((i) => ({
    key: `invoice-${i.id}`,
    invoice_id: Number(i.id),
    invoice_number: i.invoice_number,
    lead_id: i.lead_id,
    refund_due_since: date(i.payment_date || i.updated_at || i.invoice_date),
    invoice_date: date(i.invoice_date),
    due_date: date(i.due_date),
    amount: paise(i.gross_total),
    payments: paise(i.amount_paid),
    loan: 0,
    sanctioned: 0,
    refunds: 0,
    credits: credits
      .filter((c) => Number(c.invoice_id) === Number(i.id))
      .reduce((sum, c) => sum + paise(c.amount), 0),
  }));
  if (opening)
    rows.unshift({
      key: 'opening',
      invoice_id: null,
      invoice_number: opening.invoice_reference || 'Opening record',
      refund_due_since: date(opening.payment_date || opening.created_at),
      invoice_date: date(opening.created_at),
      due_date: date(opening.due_date),
      amount: paise(opening.invoice_amount),
      payments: paise(opening.amount_paid),
      loan: paise(opening.loan_disbursed_amount),
      sanctioned: paise(opening.loan_sanctioned_amount),
      refunds: paise(opening.refund_paid_amount),
      credits: 0,
    });
  rows.sort(
    (a, b) =>
      (a.invoice_date || '').localeCompare(b.invoice_date || '') ||
      (a.invoice_id || 0) - (b.invoice_id || 0)
  );
  // Loans have a lead, not an invoice. Allocate once, oldest linked debt first;
  // any surplus stays on the last linked invoice and can become refundable.
  for (const loan of loans) {
    let targets = rows.filter((r) => r.invoice_id && Number(r.lead_id) === Number(loan.lead_id));
    if (!targets.length) targets = rows.filter((r) => r.invoice_id);
    if (!targets.length) {
      let row = rows.find((r) => r.key === 'unallocated');
      if (!row) {
        row = {
          key: 'unallocated',
          invoice_id: null,
          invoice_number: 'Unallocated loan',
          amount: 0,
          payments: 0,
          loan: 0,
          sanctioned: 0,
          refunds: 0,
          credits: 0,
        };
        rows.push(row);
      }
      targets = [row];
    }
    let remaining = paise(loan.disbursed_amount);
    targets.forEach((r, index) => {
      const used =
        index === targets.length - 1
          ? remaining
          : Math.min(remaining, Math.max(0, r.amount - r.credits - r.payments - r.loan));
      r.loan += used;
      remaining -= used;
    });
    let awaited = Math.max(0, paise(loan.sanctioned_amount) - paise(loan.disbursed_amount));
    for (const r of targets) {
      const used = Math.min(awaited, Math.max(0, r.amount - r.credits - r.payments - r.loan));
      r.sanctioned = Math.max(r.sanctioned, r.loan) + used;
      awaited -= used;
    }
    targets[targets.length - 1].sanctioned += awaited;
  }
  for (const refund of refunds) {
    let remaining = paise(refund.amount);
    const targets = refund.record_key
      ? rows.filter((r) => r.key === refund.record_key)
      : refund.invoice_id
        ? rows.filter((r) => Number(r.invoice_id) === Number(refund.invoice_id))
        : rows;
    for (const r of targets) {
      const used = Math.min(
        remaining,
        Math.max(0, r.payments + r.loan - Math.max(0, r.amount - r.credits) - r.refunds)
      );
      r.refunds += used;
      remaining -= used;
    }
    // Historical customer-level refunds remain visible even if their invoice changed.
    if (remaining && targets.length) targets[targets.length - 1].refunds += remaining;
  }
  const result = rows.map((r) => {
    const final = Math.max(0, r.amount - r.credits),
      received = r.payments + r.loan;
    const outstanding = Math.max(0, final - received),
      refund = r.key === 'unallocated' ? 0 : Math.max(0, received - final - r.refunds);
    let covered = received;
    const own = milestones
      .filter((m) => Number(m.invoice_id) === Number(r.invoice_id))
      .sort((a, b) => Number(a.position) - Number(b.position));
    const unpaid = own
      .map((m) => {
        const amount = paise(m.amount),
          paid = Math.min(amount, covered);
        covered -= paid;
        return { ...m, due_date: date(m.due_date), balance_amount: (amount - paid) / 100 };
      })
      .filter((m) => m.balance_amount > 0);
    const dates = unpaid.map((m) => m.due_date).filter(Boolean);
    // An incomplete plan leaves the unscheduled balance on the invoice due date.
    const scheduled = own.reduce((s, m) => s + paise(m.amount), 0);
    const noDate =
      outstanding > 0 &&
      (unpaid.some((m) => !m.due_date) || ((!own.length || scheduled < final) && !r.due_date));
    if ((!own.length || scheduled < final) && outstanding && r.due_date) dates.push(r.due_date);
    const next = outstanding ? dates.sort()[0] || null : null;
    return {
      ...r,
      amount: r.amount / 100,
      credit_notes: r.credits / 100,
      final_amount: final / 100,
      payments_received: r.payments / 100,
      loan_disbursed: r.loan / 100,
      loan_sanctioned: r.sanctioned / 100,
      total_received: received / 100,
      refunds_paid: r.refunds / 100,
      balance_due: outstanding / 100,
      refund_due: refund / 100,
      loan_awaited: Math.min(outstanding, Math.max(0, r.sanctioned - r.loan)) / 100,
      next_due_date: next,
      no_due_date: noDate,
      days_overdue: next && next < today ? days(next, today) : 0,
      milestones: unpaid,
    };
  });
  const sum = (key) => result.reduce((s, r) => s + paise(r[key]), 0) / 100;
  const dueDates = result
    .map((r) => r.next_due_date)
    .filter(Boolean)
    .sort();
  return {
    invoices: result,
    invoice_count: invoices.length,
    has_financial_record: !!opening || invoices.length > 0,
    contract_total: sum('final_amount'),
    total_received: sum('total_received'),
    loan_disbursed: sum('loan_disbursed'),
    loan_sanctioned: sum('loan_sanctioned'),
    refunds_paid: sum('refunds_paid'),
    balance_due: sum('balance_due'),
    refund_due: sum('refund_due'),
    balance: (paise(sum('balance_due')) - paise(sum('refund_due'))) / 100,
    loan_awaited: sum('loan_awaited'),
    next_due_date: dueDates[0] || null,
    no_due_date: result.some((r) => r.no_due_date),
    days_overdue: Math.max(0, ...result.map((r) => r.days_overdue)),
  };
}
module.exports = { calculate, date, days, paise };
