const PROJECT_STAGES = Object.freeze([
  'Order Closed',
  'DISCOM Application',
  'Pre-Install Inspection',
  'Procurement',
  'Installation In Progress',
  'Commissioning',
  'Handover Done',
  'Subsidy Applied',
  'Subsidy Received',
  'Warranty Period',
]);
const TRACKER_STAGES = Object.freeze([
  'registered',
  'feasibility_approved',
  'vendor_selected',
  'agreement_uploaded',
  'installed_docs_uploaded',
  'net_meter_applied',
  'commissioning_issued',
  'bank_details_submitted',
  'subsidy_credited',
]);
function invalid(message, status = 422) {
  return Object.assign(new Error(message), { status });
}
function assertManualStage(stage) {
  if (stage === 'Subsidy Received')
    throw invalid('Subsidy Received is controlled by the Subsidy Tracker', 409);
  if (stage === 'Subsidy Applied')
    throw invalid('Subsidy Applied is controlled by the Subsidy Tracker', 409);
  if (!PROJECT_STAGES.includes(stage)) throw invalid('Unknown project stage.');
}
function dateOnly(value) {
  if (value instanceof Date) {
    if (!Number.isFinite(+value)) return null;
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  const result = String(value || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result)) return null;
  const parsed = new Date(`${result}T00:00:00Z`);
  return Number.isFinite(+parsed) && parsed.toISOString().slice(0, 10) === result ? result : null;
}
function today(timeZone = 'Asia/Kolkata', now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  return ['year', 'month', 'day'].map((key) => parts.find((p) => p.type === key).value).join('-');
}
function validateTransition(previous, next, { commissioningDate, timeZone, isAdmin, reason } = {}) {
  const status = next.portal_status || 'registered';
  if (![...TRACKER_STAGES, 'rejected'].includes(status)) throw invalid('Unknown subsidy stage.');
  const before = previous?.portal_status || 'registered';
  const from = TRACKER_STAGES.indexOf(before);
  const to = TRACKER_STAGES.indexOf(status);
  const creditChanged =
    before === 'subsidy_credited' &&
    status === before &&
    (Number(previous.amount_received) !== Number(next.amount_received) ||
      dateOnly(previous.credit_date) !== dateOnly(next.credit_date) ||
      String(previous.utr_number || '').trim() !== String(next.utr_number || '').trim());
  if (creditChanged && (!isAdmin || !String(reason || '').trim()))
    throw invalid(
      'Changing credited receipt details requires Super Admin approval and a reason.',
      403
    );
  if (before === 'subsidy_credited' && status !== before) {
    if (!isAdmin || !String(reason || '').trim())
      throw invalid('Correcting credited subsidy requires Super Admin approval and a reason.', 403);
  } else if (status !== 'rejected' && before !== 'rejected' && to > from + 1) {
    throw invalid('Complete the previous Subsidy Tracker stages first.');
  } else if (
    before === 'rejected' &&
    to > TRACKER_STAGES.indexOf(previous.last_completed_stage || 'registered') + 1
  ) {
    throw invalid('Resolve the rejected application from its last completed stage.');
  }
  for (const key of ['expected_subsidy', 'amount_received']) {
    if (
      typeof next[key] === 'boolean' ||
      !Number.isFinite(Number(next[key] ?? 0)) ||
      Number(next[key] ?? 0) < 0
    )
      throw invalid(`${key} must be a non-negative amount.`);
    const amount = Number(next[key] ?? 0);
    if (amount > 99999999.99 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001)
      throw invalid(`${key} must fit the supported amount range with at most two decimal places.`);
  }
  if (status !== 'subsidy_credited') return;
  if (
    Number(next.amount_received) <= 0 ||
    !String(next.utr_number || '').trim() ||
    !dateOnly(next.credit_date)
  )
    throw invalid('Positive credited amount, credit date and UTR number are required.');
  if (typeof next.utr_number !== 'string' || next.utr_number.trim().length > 100)
    throw invalid('UTR must be a text reference of at most 100 characters.');
  const commissioned = dateOnly(commissioningDate);
  if (!commissioned || dateOnly(next.credit_date) <= commissioned)
    throw invalid('Credit date must be after the recorded commissioning date.');
  if (dateOnly(next.credit_date) > today(timeZone))
    throw invalid('Credit date cannot be in the future.');
  if (
    Number(next.amount_received) < Number(next.expected_subsidy) &&
    !String(next.shortfall_remark || '').trim()
  )
    throw invalid('A remark is required when credited subsidy is below the expected amount.');
}
function plannedStages(projectStage, tracker, handedOver, applicable = true) {
  if (!handedOver) return [];
  if (!applicable) return projectStage === 'Warranty Period' ? [] : ['Warranty Period'];
  if (tracker?.portal_status === 'subsidy_credited') {
    if (projectStage === 'Warranty Period') return [];
    return ['Subsidy Applied', 'Subsidy Received', 'Warranty Period'].filter(
      (stage) => PROJECT_STAGES.indexOf(stage) > PROJECT_STAGES.indexOf(projectStage)
    );
  }
  if (
    ['bank_details_submitted', 'rejected'].includes(tracker?.portal_status) &&
    projectStage === 'Handover Done'
  )
    return ['Subsidy Applied'];
  return [];
}
module.exports = {
  PROJECT_STAGES,
  TRACKER_STAGES,
  invalid,
  assertManualStage,
  dateOnly,
  today,
  validateTransition,
  plannedStages,
};
