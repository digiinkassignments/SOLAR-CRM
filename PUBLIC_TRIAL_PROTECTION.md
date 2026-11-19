# Public trial signup: email verification and Redis protection

Implemented on 19 November 2026. Scope: the public website signup only.

## Flow

1. Email (Gmail suggested on blur if no domain is entered; all valid domains remain editable).
2. Human verification when enabled, then email OTP.
3. Verify OTP before showing the business form. A secure, HTTP-only, SameSite=Strict host-only cookie binds the browser to the flow. Changing the email requires verification again.
4. Submit business details and required Terms/Privacy consent. The server fixes the trial entitlement and duration; submitted plan/duration values are ignored.
5. Provision through the existing shared provisioning service. MySQL records consent and final provisioning state. Duplicate submissions/retries resolve to the same workspace. Existing client provisioning, login, renewal and trial-expiry rules remain in place.

OTP codes and session IDs are not logged. OTPs are HMAC-hashed using a separate server secret. No plaintext OTP is stored in Redis or MySQL by the public email step. The existing internal provisioning bridge creates a short-lived server-only code in MySQL, never sent to the browser, and clears it when provisioning starts.

## Limits and failure behaviour

- Email: four code requests per hour; IP: five requests per hour, including rejected attempts.
- Resend cooldown: 60 seconds per email, claimed atomically across workers.
- OTP: 10 minutes, five wrong attempts. A resend replaces the old flow/code.
- Verification requests: 30 per IP/hour; final submission: 30 per IP/hour.
- Verified signup session: 30 minutes, not extended by repeated verification. One workspace per flow. The cookie expires after 40 minutes, but server-side TTL remains authoritative.
- Redis unavailable: public signup returns 503. CRM login and internal client creation do not use this Redis service.
- Provisioning is durably claimed in MySQL before calling the shared service. A server crash during provisioning leaves a processing/failed record for support review instead of starting another tenant. Do not delete/retry such records blindly.
- Completed session restore returns the workspace address and username, never the temporary password. On the initial successful response, save the password securely. Welcome-mail acceptance is reported accurately; SMTP acceptance does not guarantee inbox delivery.
- Existing-email requests give the same HTTP response and send sign-in guidance instead of creating another trial.

## Cloudflare activation (pending owner keys)

At the owner's request, OTP and Redis protection are released first. CAPTCHA remains disabled until real keys are supplied. There is no automatic bypass once enabled.

1. Cloudflare dashboard -> Turnstile -> Add widget. Choose **Managed**.
2. Allow `solops.cloud` and `www.solops.cloud` (hostname only, no URL path).
3. Securely edit `/var/www/solar_crm/solar_crm_backend/.env` on the VPS. Do not paste the secret in chat or Git:

   ```dotenv
   TURNSTILE_SITE_KEY=<public widget site key>
   TURNSTILE_SECRET_KEY=<private widget secret>
   PUBLIC_TRIAL_TURNSTILE_ENABLED=true
   ```

4. Keep the existing `REDIS_URL`, `TRIAL_OTP_SECRET` and `TRIAL_REDIS_PREFIX`. Do not rotate the OTP secret during active signups unless invalidating them is intended.
5. Run `pm2 restart solar-crm-backend --update-env`.
6. Open `https://solops.cloud/start-trial` in a fresh browser session. Verify a real challenge and a real inbox OTP, then complete one agreed test registration. Test failed/expired human verification and resend too. Never use Cloudflare test keys in production.

The frontend loads Cloudflare only when the server config enables it. The backend checks success, allowed hostname and action `trial_signup`, plus an atomic Redis token-replay claim (five minutes). Missing keys when enabled fail signup closed. Cloudflare requests have an eight-second timeout.

References: [server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [widget setup](https://developers.cloudflare.com/turnstile/get-started/), [testing](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).

## Configuration

`REDIS_URL` must point to a private Redis endpoint. Production Redis was verified bound only to loopback, protected mode enabled. Keys have a dedicated `solops:public-trial:v2:` namespace and expiry; no flush operation is used. Generate a distinct random `TRIAL_OTP_SECRET` of at least 32 characters. Examples are in `.env.example`; production values stay outside Git.

## Validation

- Existing registration validation and website metadata/navigation regression tests pass.
- `REDIS_URL=redis://127.0.0.1:6379 node --test tests/emailFirstTrial.test.js` from the backend runs the Redis suite. It uses a unique QA prefix, mock email/Turnstile responses, and removes only its own keys. Without REDIS_URL the Redis cases are explicitly skipped.
- Redis suite covers concurrency, cooldown, send limits, wrong attempts, expiry, email lock, direct-completion rejection, Turnstile hostname/action/replay checks and Redis outage.
- Isolated disposable MySQL/Redis integration exercised real provisioning, tenant login/dashboard, master client listing, concurrent submit/retry, fixed entitlement, 168-hour expiry and renewal. Email delivery was mocked; production SMTP transport is separately verified without sending a message.
- Browser tests cover email-first flow, editable Gmail suggestion, refresh before and after provisioning, consent, 320/390/768/1440px layouts and automated WCAG checks. Provider/API responses are simulated for these browser tests.
- This is targeted signup validation, not a claim that every CRM feature or existing dependency vulnerability has been audited or fixed.
