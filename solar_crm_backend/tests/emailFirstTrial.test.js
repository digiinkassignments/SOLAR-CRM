'use strict';
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const originalUrl = process.env.REDIS_URL;
process.env.TRIAL_REDIS_PREFIX = 'solops:qa:trial:' + crypto.randomUUID() + ':';
process.env.TRIAL_OTP_SECRET = crypto.randomBytes(32).toString('hex');
process.env.PUBLIC_TRIAL_TURNSTILE_ENABLED = 'false';
const protection = require('../services/trialProtection');
const trial = require('../services/emailFirstTrial');
const legacy = require('../services/publicTrial');
const savedSend = legacy.send,
  savedFetch = global.fetch;
const db = { query: async () => [[]] };
let code;
legacy.send = async (to, subject, text) => {
  code = text.match(/code is (\d{6})/)?.[1];
};
const request = (email, ip) => trial.requestCode(db, { email }, ip);
const rtest = (name, fn) => test(name, { skip: !originalUrl }, fn);
test('email validation accepts company domains and normalises case', () => {
  assert.equal(trial.email(' OWNER@Example.com '), 'owner@example.com');
  for (const value of ['', 'x', 'x@', 'a@x.com\r\nBcc:x', 'x'.repeat(160) + '@x.com'])
    assert.throws(() => trial.email(value));
});
rtest('direct completion without an email session is rejected', async () => {
  await assert.rejects(
    () => trial.complete(db, {}, 'direct', null, () => assert.fail()),
    (e) => e.status === 403
  );
});
rtest(
  'OTP does not expose its value; refresh restores verification; changed email is rejected',
  async () => {
    const result = await request('first@example.invalid', 'first');
    assert(code);
    assert.equal(result.code, undefined);
    assert.equal((await trial.session(result.sid)).state, 'code');
    const raw = await protection.execute((r) => r.get(protection.key('session:' + result.sid)));
    assert(!raw.includes(code));
    await assert.rejects(() => trial.verify({ code: '000000' }, 'first', result.sid));
    await trial.verify({ code }, 'first', result.sid);
    assert.equal((await trial.session(result.sid)).state, 'verified');
    await assert.rejects(
      () =>
        trial.complete(db, { email: 'changed@example.invalid' }, 'first', result.sid, () =>
          assert.fail()
        ),
      (e) => e.status === 403
    );
    assert.equal(
      (await protection.execute((r) => r.ttl(protection.key('session:' + result.sid)))) > 1790,
      true
    );
  }
);
rtest('five wrong attempts lock the code even if the next code is correct', async () => {
  const result = await request('wrong@example.invalid', 'wrong'),
    correct = code;
  for (let n = 0; n < 5; n++)
    await assert.rejects(() => trial.verify({ code: '000000' }, 'wrong', result.sid));
  await assert.rejects(() => trial.verify({ code: correct }, 'wrong', result.sid));
  assert.equal((await trial.session(result.sid)).state, 'code');
});
rtest('OTP expires and verification cannot restore it', async () => {
  const result = await request('expires@example.invalid', 'expires');
  await protection.execute((r) => r.del(protection.key('session:' + result.sid)));
  await assert.rejects(() => trial.verify({ code }, 'expires', result.sid));
});
rtest('atomic cooldown permits only one concurrent send for one email', async () => {
  const outcomes = await Promise.allSettled(
    Array.from({ length: 4 }, (_, n) => request('concurrent@example.invalid', 'parallel' + n))
  );
  assert.equal(outcomes.filter((v) => v.status === 'fulfilled').length, 1);
  assert(outcomes.filter((v) => v.status === 'rejected').every((v) => v.reason.status === 429));
});
rtest('email send limit is four per hour after cooldowns', async () => {
  for (let n = 0; n < 4; n++) {
    await request('limited@example.invalid', 'email-limit' + n);
    await protection.execute((r) => r.del(protection.key('cooldown:limited@example.invalid')));
  }
  await assert.rejects(
    () => request('limited@example.invalid', 'email-limit-last'),
    (e) => e.status === 429
  );
});
rtest('IP send limit is shared across requests', async () => {
  for (let n = 0; n < 5; n++) await request('ip' + n + '@example.invalid', 'ip-limit');
  await assert.rejects(
    () => request('iplast@example.invalid', 'ip-limit'),
    (e) => e.status === 429
  );
});
rtest('concurrent correct verification keeps a single fixed verified session', async () => {
  const result = await request('verifyparallel@example.invalid', 'verifyparallel'),
    correct = code;
  const outcomes = await Promise.all(
    Array.from({ length: 6 }, () => trial.verify({ code: correct }, 'verifyparallel', result.sid))
  );
  assert(outcomes.every((v) => v.verified));
  assert.equal((await trial.session(result.sid)).state, 'verified');
});
rtest('resending replaces the earlier code and starts a new verification flow', async () => {
  const first = await request('resend@example.invalid', 'resend'),
    old = (await trial.session(first.sid)).flow;
  await protection.execute((r) => r.del(protection.key('cooldown:resend@example.invalid')));
  const second = await trial.requestCode(
    db,
    { email: 'resend@example.invalid' },
    'resend',
    first.sid
  );
  assert.equal(second.sid, first.sid);
  assert.notEqual((await trial.session(first.sid)).flow, old);
});
rtest(
  'Turnstile rejects absent credentials, bad hostname/action, and concurrent token replay',
  async () => {
    process.env.PUBLIC_TRIAL_TURNSTILE_ENABLED = 'true';
    delete process.env.TURNSTILE_SECRET_KEY;
    await assert.rejects(
      () => protection.human('token', 'ip'),
      (e) => e.status === 503
    );
    process.env.TURNSTILE_SITE_KEY = 'qa-site';
    process.env.TURNSTILE_SECRET_KEY = 'qa-secret';
    global.fetch = async () => ({
      ok: true,
      json: async () => ({ success: true, hostname: 'evil.example', action: 'trial_signup' }),
    });
    await assert.rejects(
      () => protection.human('badhost', 'ip'),
      (e) => e.status === 400
    );
    global.fetch = async () => ({
      ok: true,
      json: async () => ({ success: true, hostname: 'solops.cloud', action: 'other' }),
    });
    await assert.rejects(
      () => protection.human('badaction', 'ip'),
      (e) => e.status === 400
    );
    global.fetch = async () => ({
      ok: true,
      json: async () => ({ success: true, hostname: 'solops.cloud', action: 'trial_signup' }),
    });
    const results = await Promise.allSettled([
      protection.human('same-token', 'ip'),
      protection.human('same-token', 'ip'),
    ]);
    assert.equal(results.filter((v) => v.status === 'fulfilled').length, 1);
    process.env.PUBLIC_TRIAL_TURNSTILE_ENABLED = 'false';
  }
);
rtest('Redis unavailable fails signup closed without database/provision writes', async () => {
  await protection.close();
  process.env.REDIS_URL = 'redis://127.0.0.1:1';
  await assert.rejects(
    () => request('down@example.invalid', 'down'),
    (e) => e.status === 503
  );
  process.env.REDIS_URL = originalUrl;
  await protection.close();
});
after(async () => {
  legacy.send = savedSend;
  global.fetch = savedFetch;
  process.env.REDIS_URL = originalUrl;
  if (originalUrl) {
    await protection.execute(async (r) => {
      const keys = [];
      for await (const batch of r.scanIterator({
        MATCH: process.env.TRIAL_REDIS_PREFIX + '*',
        COUNT: 100,
      }))
        keys.push(...batch);
      if (keys.length) await r.del(keys);
    });
  }
  await protection.close();
});
