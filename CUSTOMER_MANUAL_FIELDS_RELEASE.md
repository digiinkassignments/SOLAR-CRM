# Manual Add Customer fields — 19 November 2026

- Added optional Plant size (kW) to manual customer creation and persisted it in the same opening-record table used by spreadsheet imports.
- Renamed Invoice amount to Final amount to match the client sheet. Payment received, payment date/mode/reference and balance remain available.
- Moved the financial section immediately after customer information, before site/utility details, so the requested fields are easier to find.
- Reused spreadsheet validation for positive plant size (up to three decimals) and opening financial values. Retry/rollback behavior retained. Existing customer list/profile already display these stored values.
- Validation: 12 targeted tests, production build, desktop/mobile form submission and overflow/footer checks; isolated MySQL verified 5.455 kW persistence, amounts, retry and rollback.
- Audit remediation work is deferred; unrelated routes, roles, app, reports and live-only backend differences were not changed.

- Live rollback backup: /var/www/solar_crm/backups/customer-manual-fields-20261119-045706/ (code/build plus three database snapshots).
