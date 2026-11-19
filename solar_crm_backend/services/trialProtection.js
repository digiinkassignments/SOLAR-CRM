'use strict';
const crypto = require('crypto');
const unavailable = () =>
  Object.assign(
    new Error('Signup verification is temporarily unavailable. Please try again shortly.'),
    { status: 503 }
  );
let client, connecting;
async function redis() {
  if (
    !process.env.REDIS_URL ||
    !process.env.TRIAL_OTP_SECRET ||
    process.env.TRIAL_OTP_SECRET.length < 32
  )
    throw unavailable();
  if (!client) {
    client = require('redis').createClient({
      url: process.env.REDIS_URL,
      disableOfflineQueue: true,
      socket: { connectTimeout: 3000, reconnectStrategy: false },
    });
    client.on('error', () => {}); // Never log URLs, OTPs or session contents.
  }
  if (!client.isReady) {
    if (!connecting)
      connecting = client.connect().finally(() => {
        connecting = null;
      });
    try {
      await connecting;
    } catch {
      throw unavailable();
    }
  }
  return client;
}
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
const key = (value) =>
  (process.env.TRIAL_REDIS_PREFIX || 'solops:public-trial:v2:') + digest(value);
const codeHash = (id, code) =>
  crypto
    .createHmac('sha256', process.env.TRIAL_OTP_SECRET)
    .update(id + ':' + code)
    .digest('hex');
async function execute(fn) {
  try {
    return await fn(await redis());
  } catch (e) {
    if (e.status) throw e;
    throw unavailable();
  }
}
async function limit(bucket, max, seconds = 3600) {
  return execute(async (r) => {
    const hits = await r.eval(
      "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n",
      { keys: [key('limit:' + bucket)], arguments: [String(seconds)] }
    );
    if (hits > max)
      throw Object.assign(new Error('Too many requests. Please try again later.'), { status: 429 });
  });
}
async function human(token, ip) {
  if (process.env.PUBLIC_TRIAL_TURNSTILE_ENABLED !== 'true') return;
  if (!process.env.TURNSTILE_SITE_KEY || !process.env.TURNSTILE_SECRET_KEY) throw unavailable();
  if (typeof token !== 'string' || !token || token.length > 2048)
    throw Object.assign(new Error('Complete the human verification first.'), { status: 400 });
  // Siteverify replay detection is eventually consistent. Claim locally before validation too.
  const claimed = await execute((r) => r.set(key('captcha:' + token), '1', { NX: true, EX: 300 }));
  if (!claimed)
    throw Object.assign(new Error('Please complete a fresh human verification.'), { status: 400 });
  let result;
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip,
      }),
    });
    if (!response.ok) throw unavailable();
    result = await response.json();
  } catch {
    throw unavailable();
  }
  if (
    result.success !== true ||
    !['solops.cloud', 'www.solops.cloud'].includes(result.hostname) ||
    result.action !== 'trial_signup'
  )
    throw Object.assign(new Error('Human verification failed. Please try again.'), { status: 400 });
}
async function close() {
  if (client?.isOpen) await client.close();
  client = null;
}
module.exports = { execute, key, codeHash, limit, human, close };
