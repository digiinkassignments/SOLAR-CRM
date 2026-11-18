# Add Customer form and opening financial record — 18 November 2026

- Replaced the Add Customer form with responsive sections, consistent field spacing, a close control, scrollable content and a fixed action footer.
- Added optional existing invoice amount/reference, payment received, date, mode and receipt/transaction reference. Shows the balance before saving.
- Customer totals and profile include the opening invoice and payment record. This records existing billing at onboarding; it does not generate a tax invoice. Do not enter an invoice here if it will also be created as a linked CRM invoice.
- Backend validates amounts in paise, dates, modes and reference lengths. Customer and financial record are committed together; request IDs prevent duplicate creation on retries. Existing customer creation clients remain supported.
- New additive table `customer_opening_records` initialized in all three tenant databases; no existing records changed.
- Validation: 24 backend tests; isolated MySQL storage/idempotency/rollback checks; desktop/mobile form submission, footer visibility, no horizontal overflow; production build passed.
- Live backup: `/var/www/solar_crm/backups/customer-add-ui-20261118-091528/` (code/build and three database snapshots).
