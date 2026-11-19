# Website self-service trial ? 19 November 2026

Visitors can start a 7-day trial from the landing page, complete business/contact/workspace details, accept the versioned Terms/Privacy notice and verify email ownership with a six-digit code. The server fixes the plan to the existing Enterprise plan and the trial to 168 hours; public signup does not expose a plan picker or accept plan/duration overrides. No card or automatic charge is involved.

A verified signup provisions an empty company database, Admin login and settings, records zero trial billing and appears automatically in the existing master Clients list. Notes identify the website trial. The same workspace can be renewed using the existing master-admin plan/duration flow. Existing popup UI, master-admin build and CRM/app builds are unchanged.

Website support is +91 90241 54995 and digiink2505@gmail.com. Dedicated Terms/Privacy pages and legacy URL aliases describe registration, verification, service communications, data handling, account responsibilities, integrations and the existing post-expiry retention/deletion lifecycle. Policy version 2026-11-19 is stored with signup consent. Drafting references: [MeitY DPDP Rules publication](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digital-Personal-Data-Protection-Rules-2025686cadad39.pdf); no certification of legal compliance is claimed.

## Safeguards
- Required consent in browser and API; verification before provisioning.
- Persistent network/email throttles, request-bound hashed codes, 10-minute expiry, five verification attempts, honeypot and reserved/validated subdomains.
- Email/phone/subdomain duplicate reservations, one-use verification and serialised client-code allocation shared with manual provisioning.
- Random trial passwords; credentials are returned only after successful verification, never saved in signup metadata/browser storage.
- Strict schema import into the new trial database. Public signup avoids legacy self-running all-tenant migrations. Portal role setup is scoped to the new database.
- Exact-time expiry API guard for website trials only, compatible with the existing status response/popup. Paid renewal restores access without new workspace/data.
- Setup failures are recorded for support; incomplete trial clients are locked. Welcome-mail failure is reported honestly and verified users can save their on-screen credentials.

## Validation
- 15 Node validation tests passed; changed JavaScript syntax checks passed.
- Browser signup/verification/success flow passed at 1440, 768 and 390 pixels with fake APIs; no horizontal overflow or runtime errors. Required checkbox, fixed subscription, slug, legal links and landing CTAs checked locally and on published pages.
- Disposable VPS QA databases: consent/host checks, wrong/correct OTP, actual tenant schema, fixed Enterprise/168h/zero billing, password hashing, empty business tables, Admin login/dashboard, master Clients listing, duplicate/replay rejection, trial expiry and 12-month paid renewal passed. SMTP was mocked; QA databases were removed.
- Live SMTP connection/authentication verified without sending an email. Actual recipient inbox delivery is not asserted.
- Live landing/trial/legal pages, master admin and both existing tenant entry points returned 200. Invalid signup consent returned 400, without creating a tenant or sending mail.

## Deployment
Published using live file hashes, backup and backend health checks; existing admin/frontend build differences were preserved. Rollback backup: `/var/www/solar_crm/backups/public-trial-20261119-114106`. Additive master tables: `public_trial_signups`, `public_trial_limits`. These hold signup/consent metadata and rate-limit counters; do not remove them during rollback without checking whether real registrations have arrived. Landing index SHA-256: `cfa0cb7d4a90564e5d2624dc604adbb9fc3032b2d0e1d584fd4d537afe9edd50`.
