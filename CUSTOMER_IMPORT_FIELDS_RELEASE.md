# Customer spreadsheet fields — 18 November 2026

- CSV and Excel templates now include the client's Plant size, Final amount and Payment recieved columns.
- Both spellings Payment recieved / Payment received map to the same field. Legacy templates and canonical API field names remain supported.
- Import preview shows all three new values. Final amount and received payment are stored as opening financial records in the same transaction as the imported customer; their totals appear in customer cards/table/profile. Plant size is stored separately in kW and does not fabricate a project or double-count linked project capacity.
- Optional blanks remain optional. Positive plant sizes support three decimals; financial values support two decimals. Invalid amounts, overpayment and invalid capacity produce row errors. Duplicate mobile numbers are skipped without changing existing customer records. Retrying a batch does not duplicate records.
- The supplied sheet has no receipt dates or modes; these remain not recorded rather than being invented. Imports do not generate tax invoices.
- Added nullable plant_size_kw column to customer_opening_records; all tenant schemas migrated before publication.
- Validation: 26 backend tests, CSV/XLSX template download and upload through the browser, production build, isolated MySQL bulk import/storage/retry/duplicate/rollback checks.

- Live rollback backup: /var/www/solar_crm/backups/customer-import-fields-20261118-174925/ (code/build and three tenant database snapshots).
