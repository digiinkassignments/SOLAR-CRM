const { test } = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../services/subsidyRules');
const { protect } = require('../middleware/subsidyAccess');
const valid = {
  portal_status: 'subsidy_credited',
  amount_received: 78000,
  expected_subsidy: 78000,
  credit_date: '2026-11-20',
  utr_number: 'TEST-UTR',
};
const prior = { portal_status: 'bank_details_submitted' };
const context = { commissioningDate: '2026-11-19', timeZone: 'Asia/Kolkata' };
test('handover precedes subsidy applied and received in the execution lifecycle', () => {
  assert.deepEqual(rules.PROJECT_STAGES.slice(5), [
    'Commissioning',
    'Handover Done',
    'Subsidy Applied',
    'Subsidy Received',
    'Warranty Period',
  ]);
});
test('manual subsidy stages cannot bypass the tracker', () => {
  for (const stage of ['Subsidy Received', 'Subsidy Applied'])
    assert.throws(() => rules.assertManualStage(stage), { status: 409 });
  assert.doesNotThrow(() => rules.assertManualStage('Commissioning'));
});
test('credit accepts a complete receipt after commissioning', () => {
  assert.doesNotThrow(() => rules.validateTransition(prior, valid, context));
});
for (const [name, change] of [
  ['zero credit', { amount_received: 0 }],
  ['negative credit', { amount_received: -1 }],
  ['missing UTR', { utr_number: ' ' }],
  ['missing date', { credit_date: null }],
  ['impossible date', { credit_date: '2026-02-30' }],
  ['future date', { credit_date: '2099-01-01' }],
  ['commissioning day', { credit_date: '2026-11-19' }],
  ['pre-commissioning', { credit_date: '2026-11-18' }],
  ['shortfall without remark', { amount_received: 50000 }],
  ['invalid money', { amount_received: 'NaN' }],
  ['fraction below a paise', { amount_received:0.001 }],
  ['amount outside database range', { amount_received:100000000 }],
])
  test(`credit rejects ${name}`, () =>
    assert.throws(() => rules.validateTransition(prior, { ...valid, ...change }, context), {
      status: 422,
    }));
test('credit requires a recorded commissioning date', () => {
  assert.throws(() => rules.validateTransition(prior, valid, {}), /commissioning date/);
});
test('short credit with explanation is accepted', () => {
  assert.doesNotThrow(() =>
    rules.validateTransition(
      prior,
      {
        ...valid,
        amount_received: 50000,
        shortfall_remark: 'Portal assessed lower eligible capacity.',
      },
      context
    )
  );
});
test('sequential tracker progress cannot skip stages', () => {
  assert.throws(
    () =>
      rules.validateTransition(
        { portal_status: 'registered' },
        { portal_status: 'bank_details_submitted' }
      ),
    /previous/
  );
});
test('rejected application cannot use rejection to skip unfinished stages', () => {
  assert.throws(
    () =>
      rules.validateTransition(
        { portal_status: 'rejected', last_completed_stage: 'registered' },
        valid,
        context
      ),
    /last completed/
  );
});
test('credited rollback needs current Super Admin and mandatory reason', () => {
  for (const options of [{}, { isAdmin: true }, { reason: 'Correction' }])
    assert.throws(
      () =>
        rules.validateTransition(
          valid,
          { ...valid, portal_status: 'bank_details_submitted' },
          { ...context, ...options }
        ),
      { status: 403 }
    );
  assert.doesNotThrow(() =>
    rules.validateTransition(
      valid,
      { ...valid, portal_status: 'bank_details_submitted' },
      { ...context, isAdmin: true, reason: 'Bank reversed this credit' }
    )
  );
});
test('editing credited receipt cannot bypass the correction requirement', () => {
  assert.throws(
    () => rules.validateTransition(valid, { ...valid, utr_number: 'Changed' }, context),
    { status: 403 }
  );
});
test('credit before handover never moves execution stages', () => {
  assert.deepEqual(rules.plannedStages('Commissioning', valid, false), []);
});
test('handover catches up applied and received then enters warranty', () => {
  assert.deepEqual(rules.plannedStages('Handover Done', valid, true), [
    'Subsidy Applied',
    'Subsidy Received',
    'Warranty Period',
  ]);
});
test('repeated synchronization is idempotent', () => {
  assert.deepEqual(rules.plannedStages('Warranty Period', valid, true), []);
});
test('bank details only advance subsidy after handover', () => {
  assert.deepEqual(rules.plannedStages('Handover Done', prior, true), ['Subsidy Applied']);
  assert.deepEqual(rules.plannedStages('Commissioning', prior, false), []);
});
test('not-applicable projects enter warranty without subsidy stages', () => {
  assert.deepEqual(rules.plannedStages('Handover Done', null, true, false), ['Warranty Period']);
});
test('read-only response removes raw bank, Aadhaar, UTR and private document URLs', () => {
  const source = {
    application: {
      bank_account_no: '123456',
      aadhaar: '1111',
      utr_number: 'receipt',
      portal_status: 'registered',
    },
    documents: [{ file_url: '/private/kyc.pdf', file_name: 'Customer Aadhaar' }],
  };
  const safe = protect(source, { can_edit: false });
  assert.equal(safe.application.bank_account_no, null);
  assert.equal(safe.application.aadhaar, null);
  assert.equal(safe.application.utr_number, null);
  assert.equal(safe.documents[0].file_url, null);
  assert.equal(source.application.bank_account_no, '123456');
  assert.equal(protect(source, { can_edit: true }).application.bank_account_no, '123456');
});
test('local date respects company timezone at the UTC day boundary', () => {
  assert.equal(rules.today('Asia/Kolkata', new Date('2026-11-20T20:00:00Z')), '2026-11-21');
});
