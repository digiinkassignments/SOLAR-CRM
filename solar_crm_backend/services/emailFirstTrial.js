'use strict';
const crypto = require('crypto');
const legacy = require('./publicTrial');
const protection = require('./trialProtection');
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const validId = (id) => typeof id === 'string' && /^[a-f0-9]{64}$/.test(id);
const sessionKey = (id) => protection.key('session:' + id);
function email(value) {
  const result = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (
    result.length > 150 ||
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(result)
  )
    fail('Enter a valid email address.');
  return result;
}
async function session(id) {
  if (!validId(id)) return null;
  const value = await protection.execute((r) => r.get(sessionKey(id)));
  return value ? JSON.parse(value) : null;
}
const completed = (row) => ({
  workspace_url: `https://${row.subdomain}.solops.cloud`,
  username: row.subdomain,
  temporary_password: null,
  trial_ends_at: row.trial_end_at,
  email_sent: null,
  already_created: true,
});
async function status(db, id) {
  const s = await session(id);
  if (!s) return { email: null, verified: false };
  const result = { email: s.email, verified: s.state === 'verified' };
  if (result.verified) {
    await legacy.ensure(db);
    const [[row]] = await db.query(
      "SELECT subdomain,trial_end_at FROM public_trial_signups WHERE id=? AND state='active'",
      [s.flow]
    );
    if (row) result.workspace = completed(row);
  }
  return result;
}
async function requestCode(db, input, ip, id) {
  const address = email(input.email);
  if (input.website) fail('Unable to process this request.');
  await protection.limit('send-ip:' + ip, 5);
  await protection.human(input.turnstile_token, ip);
  const cooldown = await protection.execute((r) =>
    r.set(protection.key('cooldown:' + address), '1', { NX: true, EX: 60 })
  );
  if (!cooldown) fail('Please wait 60 seconds before requesting another code.', 429);
  await protection.limit('send-email:' + address, 4);
  // Existing accounts receive the same response; no account enumeration or extra trial.
  const [[existing]] = await db.query('SELECT id FROM clients WHERE LOWER(email)=? LIMIT 1', [
    address,
  ]);
  const code = String(crypto.randomInt(100000, 1000000)),
    sid = validId(id) ? id : crypto.randomBytes(32).toString('hex');
  const flow = crypto.randomUUID();
  const data = {
    email: address,
    flow,
    state: 'code',
    hash: protection.codeHash(flow, code),
    attempts: 0,
    existing: !!existing,
  };
  await protection.execute((r) => r.set(sessionKey(sid), JSON.stringify(data), { EX: 600 }));
  try {
    await legacy.send(
      address,
      existing ? 'Your SolOps workspace access' : 'Your SolOps verification code',
      existing
        ? 'A workspace already uses this email. Sign in to your existing workspace or contact +91 90241 54995 for assistance.'
        : `Your SolOps code is ${code}. It expires in 10 minutes. Do not share it. If you did not request it, ignore this email.`,
      existing
        ? '<p>A workspace already uses this email. Sign in to your existing workspace or contact +91 90241 54995 for assistance.</p>'
        : `<p>Your SolOps verification code</p><p style="font-size:28px;letter-spacing:6px;font-weight:bold">${code}</p><p>Expires in 10 minutes. Do not share this code. If you did not request it, ignore this email.</p>`
    );
  } catch {
    await protection.execute((r) => r.del(sessionKey(sid)));
    fail('We could not send your email. Please retry in a minute or contact us.', 503);
  }
  return { sid, email: address, resend_after: 60 };
}
const VERIFY_SCRIPT = `
local raw=redis.call('GET',KEYS[1]); if not raw then return 0 end
local s=cjson.decode(raw); if s.state=='verified' then return 1 end
if s.state~='code' or s.attempts>=5 then return 0 end
if s.existing or s.hash~=ARGV[1] then
 s.attempts=s.attempts+1; redis.call('SET',KEYS[1],cjson.encode(s),'KEEPTTL'); return -1
end
s.state='verified'; s.hash=nil; s.attempts=nil; redis.call('SET',KEYS[1],cjson.encode(s),'EX',1800); return 1`;
async function verify(input, ip, id) {
  await protection.limit('verify-ip:' + ip, 30);
  const s = await session(id);
  if (!s || !/^\d{6}$/.test(String(input.code || '')))
    fail('Enter the six-digit code, or request a new one.');
  const result = await protection.execute((r) =>
    r.eval(VERIFY_SCRIPT, {
      keys: [sessionKey(id)],
      arguments: [protection.codeHash(s.flow, String(input.code))],
    })
  );
  if (result !== 1)
    fail(
      result === -1
        ? 'Incorrect verification code.'
        : 'This code has expired or reached its attempt limit. Request a new code.'
    );
  return { email: s.email, verified: true };
}
async function complete(db, input, ip, id, provision) {
  await protection.limit('complete-ip:' + ip, 30);
  const s = await session(id);
  if (!s || s.state !== 'verified') fail('Verify your email before creating a workspace.', 403);
  if (input.email && email(input.email) !== s.email)
    fail('Your verified email cannot be changed. Verify the new email first.', 403);
  const data = legacy.validate({ ...input, email: s.email });
  await legacy.ensure(db);
  const [[previous]] = await db.query(
    'SELECT state,subdomain,trial_end_at FROM public_trial_signups WHERE id=?',
    [s.flow]
  );
  if (previous?.state === 'active') return completed(previous);
  if (previous && previous.state !== 'verification')
    fail(
      'Workspace setup is already processing or needs assistance. Check your email or contact us before retrying.',
      409
    );
  const lock = protection.key('complete:' + s.flow);
  if (!(await protection.execute((r) => r.set(lock, '1', { NX: true, EX: 600 }))))
    fail('Workspace setup is processing. Please wait, then retry to check its status.', 409);
  try {
    const [[current]] = await db.query(
      'SELECT state,subdomain,trial_end_at,payload_json FROM public_trial_signups WHERE id=?',
      [s.flow]
    );
    if (current?.state === 'active') return completed(current);
    if (current && current.state !== 'verification')
      fail('Workspace setup is processing or needs assistance. Contact us before retrying.', 409);
    const [[existing]] = await db.query(
      "SELECT id FROM clients WHERE LOWER(email)=? OR subdomain=? OR REPLACE(REPLACE(REPLACE(phone,' ',''),'+91',''),'-','')=? LIMIT 1",
      [data.email, data.subdomain, data.phone]
    );
    if (existing) fail('A workspace already uses these details. Sign in or contact us.', 409);
    const internalCode = String(crypto.randomInt(100000, 1000000));
    if (current) {
      if (current.payload_json !== JSON.stringify(data))
        fail('Please retry with the same business details, or contact us.', 409);
      await db.query(
        "UPDATE public_trial_signups SET code_hash=?,expires_at=UTC_TIMESTAMP()+INTERVAL 10 MINUTE,attempts=0 WHERE id=? AND state='verification'",
        [legacy.hash(s.flow + internalCode), s.flow]
      );
    } else
      await db.query(
        `INSERT INTO public_trial_signups(id,email,phone,subdomain,payload_json,code_hash,expires_at,sent_at,policy_version,consent_at,ip_hash)
      VALUES(?,?,?,?,?,?,UTC_TIMESTAMP()+INTERVAL 10 MINUTE,UTC_TIMESTAMP(),?,UTC_TIMESTAMP(),?)`,
        [
          s.flow,
          data.email,
          data.phone,
          data.subdomain,
          JSON.stringify(data),
          legacy.hash(s.flow + internalCode),
          legacy.POLICY_VERSION,
          legacy.hash(ip),
        ]
      );
    return await legacy.complete(db, { request_id: s.flow, code: internalCode }, ip, provision);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY')
      fail('These details already have a signup in progress. Check your email or contact us.', 409);
    throw e;
  } finally {
    await protection.execute((r) => r.del(lock)).catch(() => {});
  }
}
module.exports = { email, session, status, requestCode, verify, complete, VERIFY_SCRIPT };
