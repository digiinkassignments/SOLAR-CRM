# Customers: bulk upload, lead source, invoice amounts and milestone collections

## Implemented
- Shared Customers UI/API for client companies. Both active company databases received the additive schema. New companies initialize these tables/columns when customer features are first used.
- CSV/XLSX customer import, downloadable template, preview, per-row validation, duplicate phone detection, results report and idempotent retries. Maximum 100 rows, 2 MB per file; Excel uses the first worksheet. Existing records are skipped rather than overwritten. Imports add contacts and source information, not artificial invoices or receipts.
- Admin imports may leave customers unassigned. Managers must choose an active salesperson in their own team; the server validates each row. Sales users cannot import or edit payment plans.
- Customer source is editable on creation/profile and shown/filterable on directory cards/list. Existing linked customers inherit the original lead source unless a customer-specific override is recorded. Legacy update callers that omit source preserve it.
- Invoice amount is based on actual linked gross invoice totals. Net payable, recorded receipts and balance are separately shown in the payment workspace. Collection percentages use net payable rather than gross when subsidy adjustments exist. Customer currency display preserves paise.
- Customer profile → Milestone payments: choose a linked invoice, create/edit up to 20 named instalments with amounts and optional dates. Total planned cannot exceed invoice net payable. Unallocated payable remains visible. Existing invoice receipts cover milestones in the specified order; Paid/Partially paid/Pending/Overdue is derived from that allocation. This is a collection plan, not a second receipt ledger or evidence of installation completion.
- Record payment uses the existing invoice ledger. Invoice row locks, transactions and request IDs prevent concurrent balance loss, overpayment and duplicate retries from the updated web form. Older clients can still call the endpoint without a request ID and benefit from atomic balance updates.
- Company token mismatch is rejected for customer routes and receipt writes. Customer profile access respects existing manager/sales scopes.

## Verification
- 27 focused checks passed across customer/import/payment, manager scope and the previous survey/document conversion tests (26 before the added source compatibility check; the updated 13 customer/payment/manager checks passed separately).
- Two disposable MySQL databases cloned from current schema verified import validation/retries, team restrictions, company isolation, optimistic plan version conflicts, concurrent receipt rejection and single-ledger-entry retries. Disposable databases were removed; customer records were not used as fixtures.
- Mocked browser flows: CSV preview/import result, milestone edit/save, receipt save with request ID, Manager team selector, overview rendering and mobile import/profile views. No runtime errors or horizontal page overflow.
- Live APIs checked for both active companies: customer list/profile/payment-plan reads 200, empty import 400, unauthenticated 401, cross-company token 403. No real customer import or receipt was created for verification.
- Live authenticated browser customer screen and bulk-upload dialog loaded without runtime errors; mobile width had no horizontal overflow. All non-GET requests were blocked during that check.
- Landing and master-admin HTML hashes remained unchanged. Flutter app changes were excluded from this release.

## Release
Backup: `/var/www/solar_crm/backups/customers-expansion-20261118-051132/`
Contains prior affected code/frontend build and SQL backups for both active company databases. Schema changes are additive: customers.lead_source, import batch history, payment plan/milestone tables and receipt request history. No existing invoices or receipts were rewritten during deployment.

Published JS: `index-Bn7_W_by.js`.
Local/live index SHA256: `d10ef641614f38da33726c4916725268710491816319c1c2a1ac3e5f3bd5d081`.
Build uses `VITE_API_BASE_URL=/api`. Deployment guarded the previous live index and affected source hashes before copying only the 16 required runtime files.
