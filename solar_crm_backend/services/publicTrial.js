const crypto = require('crypto');
const POLICY_VERSION = '2026-11-19';
const reserved = new Set([
  'admin',
  'www',
  'api',
  'mail',
  'smtp',
  'support',
  'help',
  'app',
  'apps',
  'billing',
  'status',
  'docs',
  'static',
  'assets',
  'cdn',
  'test',
  'demo',
  'localhost',
  'solops',
  'crm-admin',
  'solar-crm',
]);
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const text = (v, max) => (typeof v === 'string' && v.trim().length <= max ? v.trim() : '');
function validate(input) {
  const business_name = text(input.business_name, 100),
    owner_name = text(input.owner_name, 100);
  const email = text(input.email, 150).toLowerCase();
  const phone = text(input.phone, 20)
    .replace(/[\s()+-]/g, '')
    .replace(/^91(?=\d{10}$)/, '');
  const subdomain = text(input.subdomain, 30).toLowerCase();
  if (
    business_name.length < 2 ||
    owner_name.length < 2 ||
    /[<>\x00-\x1f]/.test(business_name + owner_name)
  )
    fail('Enter your business name and contact person.');
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(email))
    fail('Enter a valid email address.');
  if (!/^[6-9]\d{9}$/.test(phone)) fail('Enter a valid 10-digit Indian mobile number.');
  if (!/^[a-z][a-z0-9-]{2,28}[a-z0-9]$/.test(subdomain) || reserved.has(subdomain))
    fail('Choose a workspace name of 4–30 letters, numbers or hyphens, starting with a letter.');
  if (input.agree !== true || input.policy_version !== POLICY_VERSION)
    fail('Please read and accept the current Terms and Privacy Policy.');
  if (input.website) fail('Unable to process this request.');
  const city = text(input.city, 80),
    state = text(input.state, 80);
  if (/[<>\x00-\x1f]/.test(city + state)) fail('Enter a valid city and state.');
  return { business_name, owner_name, email, phone, subdomain, city, state };
}
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
let ready;
async function ensure(db) {
  if (!ready)
    ready = (async () => {
      await db.query(`CREATE TABLE IF NOT EXISTS public_trial_signups (
      id CHAR(36) PRIMARY KEY, email VARCHAR(190) NOT NULL UNIQUE, phone VARCHAR(20) NOT NULL UNIQUE,
      subdomain VARCHAR(30) NOT NULL UNIQUE, payload_json TEXT NOT NULL, code_hash CHAR(64) NULL,
      expires_at DATETIME NOT NULL, attempts INT NOT NULL DEFAULT 0, sent_at DATETIME NOT NULL,
      state VARCHAR(20) NOT NULL DEFAULT 'verification', client_id INT NULL, trial_end_at DATETIME NULL,
      policy_version VARCHAR(20) NOT NULL, consent_at DATETIME NOT NULL, ip_hash CHAR(64) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY trial_client_state (client_id,state)
    ) ENGINE=InnoDB`);
      await db.query(`CREATE TABLE IF NOT EXISTS public_trial_limits (
      bucket CHAR(64) PRIMARY KEY, hits INT NOT NULL DEFAULT 1, window_start DATETIME NOT NULL
    ) ENGINE=InnoDB`);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  return ready;
}
async function rateLimit(db, key, max) {
  const bucket = hash(key);
  await db.query(
    `INSERT INTO public_trial_limits(bucket,hits,window_start) VALUES (?,1,UTC_TIMESTAMP())
    ON DUPLICATE KEY UPDATE hits=IF(window_start < UTC_TIMESTAMP()-INTERVAL 1 HOUR,1,hits+1),
    window_start=IF(window_start < UTC_TIMESTAMP()-INTERVAL 1 HOUR,UTC_TIMESTAMP(),window_start)`,
    [bucket]
  );
  const [[row]] = await db.query('SELECT hits FROM public_trial_limits WHERE bucket=?', [bucket]);
  if (row.hits > max) fail('Too many requests. Please try again in an hour or contact us.', 429);
}
function mailer() {
  return require('nodemailer').createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: Number(process.env.MAIL_PORT) === 465,
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    connectionTimeout: 15000,
    socketTimeout: 20000,
  });
}
async function send(to, subject, text, html) {
  const info = await mailer().sendMail({
    from: `"SolOps" <${process.env.MAIL_USER}>`,
    replyTo: 'digiink2505@gmail.com',
    to,
    subject,
    text,
    html,
  });
  if (!info.accepted?.length) throw new Error('Email delivery was not accepted');
}
async function requestCode(db, input, ip) {
  const data = validate(input || {});
  await ensure(db);
  const ipHash = hash(ip);
  await rateLimit(db, 'send:' + ipHash, 5);
  await rateLimit(db, 'email:' + data.email, 4);
  const [clients] = await db.query(
    "SELECT id FROM clients WHERE LOWER(email)=? OR subdomain=? OR REPLACE(REPLACE(REPLACE(phone,' ',''),'+91',''),'-','')=? LIMIT 1",
    [data.email, data.subdomain, data.phone]
  );
  if (clients.length)
    fail('A workspace already uses these details. Sign in or contact us for help.', 409);
  const [rows] = await db.query(
    'SELECT *, TIMESTAMPDIFF(SECOND,sent_at,UTC_TIMESTAMP()) AS age FROM public_trial_signups WHERE email=? OR phone=? OR subdomain=?',
    [data.email, data.phone, data.subdomain]
  );
  if (
    rows.some((r) => r.state !== 'verification' || r.email !== data.email || r.phone !== data.phone)
  )
    fail('These details are already registered. Contact us for help.', 409);
  if (rows[0]?.age < 60) fail('Please wait one minute before requesting another code.', 429);
  const id = rows[0]?.id || crypto.randomUUID(),
    code = String(crypto.randomInt(100000, 1000000));
  await db.query(
    `INSERT INTO public_trial_signups(id,email,phone,subdomain,payload_json,code_hash,expires_at,sent_at,policy_version,consent_at,ip_hash)
    VALUES (?,?,?,?,?,?,UTC_TIMESTAMP()+INTERVAL 10 MINUTE,UTC_TIMESTAMP(),?,UTC_TIMESTAMP(),?)
    ON DUPLICATE KEY UPDATE subdomain=VALUES(subdomain),payload_json=VALUES(payload_json),code_hash=VALUES(code_hash),expires_at=VALUES(expires_at),sent_at=VALUES(sent_at),attempts=0,policy_version=VALUES(policy_version),consent_at=VALUES(consent_at)`,
    [
      id,
      data.email,
      data.phone,
      data.subdomain,
      JSON.stringify(data),
      hash(id + code),
      POLICY_VERSION,
      ipHash,
    ]
  );
  try {
    await send(
      data.email,
      'Your SolOps verification code',
      `Your code is ${code}. It expires in 10 minutes. Do not share it. If you did not request a trial, ignore this email.`,
      `<p>Your SolOps verification code is:</p><p style="font-size:28px;letter-spacing:6px;font-weight:bold">${code}</p><p>Expires in 10 minutes. Do not share this code. If you did not request a trial, ignore this email.</p>`
    );
  } catch {
    await db.query('UPDATE public_trial_signups SET code_hash=NULL WHERE id=?', [id]);
    fail('We could not send your verification email. Please retry or contact us.', 503);
  }
  return { request_id: id, email: data.email };
}
async function complete(db, input, ip, provision) {
  await ensure(db);
  await rateLimit(db, 'verify:' + hash(ip), 30);
  const id = text(input.request_id, 36),
    code = text(input.code, 6);
  if (!/^[0-9a-f-]{36}$/.test(id) || !/^\d{6}$/.test(code))
    fail('Enter the six-digit code from your email.');
  const connection = await db.getConnection();
  let row;
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      'SELECT *,expires_at>UTC_TIMESTAMP() AS valid FROM public_trial_signups WHERE id=? FOR UPDATE',
      [id]
    );
    row = rows[0];
    if (!row || row.state !== 'verification' || !row.valid || row.attempts >= 5)
      fail(
        'This request is expired or already used. If you completed setup, check your email for access; otherwise request a new code.'
      );
    if (row.code_hash !== hash(id + code)) {
      await connection.query('UPDATE public_trial_signups SET attempts=attempts+1 WHERE id=?', [
        id,
      ]);
      await connection.commit();
      fail('Incorrect verification code.');
    }
    await connection.query(
      "UPDATE public_trial_signups SET state='provisioning',code_hash=NULL WHERE id=?",
      [id]
    );
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
  const data = JSON.parse(row.payload_json);
  let result;
  try {
    const [[plan]] = await db.query(
      "SELECT id FROM plans WHERE LOWER(TRIM(name)) IN ('enterprise','enterprise tier') ORDER BY id LIMIT 1"
    );
    if (!plan) throw new Error('Trial configuration unavailable');
    result = await provision({
      businessName: data.business_name,
      ownerName: data.owner_name,
      email: data.email,
      phone: data.phone,
      city: data.city,
      state: data.state,
      subdomain: data.subdomain,
      planId: plan.id,
      durationMonths: 7 / 30,
      createdBy: null,
      trialOptions: { days: 7 },
    });
    await db.query("UPDATE clients SET notes=CONCAT(COALESCE(notes,''),?) WHERE id=?", [
      '\nWebsite signup: 7-day free trial. Terms/privacy ' + POLICY_VERSION,
      result.clientId,
    ]);
    await db.query(
      "UPDATE public_trial_signups SET state='active',client_id=?,trial_end_at=? WHERE id=?",
      [result.clientId, new Date(result.trialEndAt), id]
    );
  } catch (e) {
    await db.query("UPDATE public_trial_signups SET state='failed',client_id=? WHERE id=?", [
      e.clientId || result?.clientId || null,
      id,
    ]);
    console.error('Public trial provisioning failed', e.code || e.name);
    fail(
      'Workspace setup could not finish. Contact +91 90241 54995 with your email; please do not register again.',
      503
    );
  }
  const url = `https://${data.subdomain}.solops.cloud`,
    expiry = new Date(result.trialEndAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  let emailSent = true;
  try {
    await send(
      data.email,
      'Your SolOps workspace is ready',
      `Welcome to SolOps. Your 7-day free trial is ready. Workspace: ${url}\nUsername: ${data.subdomain}\nTemporary password: ${result.tempPassword}\nTrial ends: ${expiry} IST. Change your password after signing in. No card or automatic charge. Support: +91 90241 54995 / digiink2505@gmail.com`,
      `<h2>Welcome to SolOps</h2><p>Your 7-day free trial is ready.</p><p><a href="${url}">Open your workspace</a></p><p>Username: <strong>${escape(data.subdomain)}</strong><br>Temporary password: <strong>${escape(result.tempPassword)}</strong></p><p>Trial ends: ${escape(expiry)} IST. Change your password after signing in.</p><p>No card required. No automatic charge.</p><p>Support: +91 90241 54995 · digiink2505@gmail.com</p>`
    );
  } catch {
    emailSent = false;
  }
  return {
    workspace_url: url,
    username: data.subdomain,
    temporary_password: result.tempPassword,
    trial_ends_at: result.trialEndAt,
    email_sent: emailSent,
  };
}
module.exports = { POLICY_VERSION, validate, hash, escape, ensure, send, requestCode, complete };
