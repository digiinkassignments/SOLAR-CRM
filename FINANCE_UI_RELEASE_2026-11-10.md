# Subsidy & Finance release — 10 November 2026

## Delivered

- Combined navigation under **Subsidy & Finance**, with Subsidy tracker and Solar loans tabs. Separate Admin Loans sidebar item removed; Manager hub added. Old `/loans` and `/manager/loans` URLs redirect to the matching hub tab.
- Redesigned subsidy and loan lists with the existing palette/stage colors, responsive cards/tables, separate amounts, filters, loading/empty/error/retry states and contained buttons.
- Updated subsidy detail layout, current MUI Grid/Stack usage, loading/error handling, activity history and internal-target wording. Missing data no longer receives sample costs/equipment from frontend defaults.
- Loan application forms record a CRM request rather than implying automatic bank submission. Expected subsidy does not reduce the initial funding request automatically. Real requested/sanctioned/disbursed values stay separate.
- Forward stage changes collect the corresponding application/sanction/disbursement evidence. Stage-specific payloads prevent prefilled future disbursement fields being sent during earlier stages. Saved lender rate/tenure are retained when estimating a newly recorded sanction.
- Subsidy-credit saves require a positive actual amount, date and transaction reference. Beneficiary/loan-account wording reflects lender-specific routing.
- Small backend loan-model correction preserves explicit zero subsidy and zero interest, handles zero-interest EMI, and avoids a sample 3 kW fallback for unknown capacity. No endpoints, schema or migration files changed.

## Validation

- Production build passed. Existing large-bundle warning remains.
- 12 tests passed: frontend/backend loan calculation and zero-value persistence tests, plus existing solar-calculator tests. Backend regression tests use an in-memory adapter and never connect to a database.
- Browser checks passed locally for Admin and Manager at 1440, 1100, 960, 768 and 390 pixels: subsidy table/cards/detail, loan cards/table/create/detail, old-link redirects, empty/error recovery and button containment. Synthetic write assertions cover initial funding without upfront subsidy deduction, zero-interest EMI, actual disbursement with stage-specific fields, rejected incomplete subsidy credit and zero-subsidy save.
- Previous project optional-date save regression also passed.
- New hub/workspace/estimator/service files have clean lint results. Five existing `react-hooks/set-state-in-effect` findings remain across the modified list/detail components; global lint is not reported as passing. No parser/undefined-variable errors remained in the scoped check.
- Browser tests intercept all API requests and use synthetic fixtures. They do not establish real bank/portal integration or exercise production customer transactions.
- The complete Admin/Manager five-width suite also passed against the published HTTPS frontend with API interception retained.

## Deployment

- Live hub: `https://diassignments.digiinksolutions.com/subsidies`.
- Loan tab: `https://diassignments.digiinksolutions.com/subsidies/loans`.
- Backup: `/var/www/solar_crm/backups/finance-ui-before-20261110/` contains `frontend-dist.tgz`, `index.sha256` and the previous `loanModel.js`.
- Release files: `/var/www/solar_crm/releases/finance-ui-20261110`.
- Published index SHA-256: `74d53eeb4a5e27c0c5a67b80bdc0246c46a32f1a9ed1f8df25ed84fa749cceb7`.
- Published loan-model SHA-256: `17078f894e98e296239b361bb23b85ae93fff700da8dbb6b281a499d42a51b10`.
- Backend base version checked against the previous live checksum before replacement. Only `solar-crm-backend` restarted (restart count 64); readiness succeeded before frontend index switch. Other PM2 applications were not restarted.
- Hub, loan-tab and new main asset HTTP responses: 200. Protected unauthenticated loan API: 401. Existing hashed assets retained for open sessions; index replaced atomically.

Rollback uses the backed-up loan model and a restart of `solar-crm-backend`, plus an atomic replacement of the frontend index extracted from the archive. Previous frontend assets remain available. No rollback was needed.

Research and product boundary: see `SOLAR_FINANCING_WORKFLOW.md`. Wider tenant authorization, server-side workflow validation, payment reconciliation and tranche modelling remain separate work.
