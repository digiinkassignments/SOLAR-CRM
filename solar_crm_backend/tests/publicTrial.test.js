const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validate, hash, escape, POLICY_VERSION } = require('../services/publicTrial');
const base = {
  business_name: 'Sunrise Solar',
  owner_name: 'Ravi Kumar',
  email: 'owner@example.com',
  phone: '9876543210',
  subdomain: 'sunrisesolar',
  agree: true,
  policy_version: POLICY_VERSION,
};
test('registration normalises contacts without accepting client-selected plan or duration', () => {
  const data = validate({
    ...base,
    email: ' OWNER@EXAMPLE.COM ',
    phone: '+91 98765 43210',
    plan_id: 1,
    duration_months: 12,
  });
  assert.equal(data.email, 'owner@example.com');
  assert.equal(data.phone, '9876543210');
  assert.equal(data.plan_id, undefined);
  assert.equal(data.duration_months, undefined);
});
for (const patch of [
  { agree: false },
  { policy_version: 'old' },
  { subdomain: 'admin' },
  { subdomain: 'api' },
  { subdomain: '-bad' },
  { subdomain: '../evil' },
  { subdomain: 'a' },
  { email: 'bad' },
  { phone: '1234' },
  { website: 'bot' },
  { business_name: '<script>' },
  { owner_name: '' },
]) {
  test('reject invalid registration ' + JSON.stringify(patch), () =>
    assert.throws(
      () => validate({ ...base, ...patch }),
      (e) => e.status === 400
    )
  );
}
test('email rendering escapes user content', () =>
  assert.equal(escape('<a "x">&'), '&lt;a &quot;x&quot;&gt;&amp;'));
test('codes are tied to request identifiers', () =>
  assert.notEqual(hash('request1' + '123456'), hash('request2' + '123456')));
