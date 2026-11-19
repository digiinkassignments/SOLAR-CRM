# Customer handover evidence UI ? 19 November 2026

Hide signed docket and plant photo actions when their URLs are empty or whitespace. Keep available evidence actions responsive. Replace ambiguous Signed & Confirmed text with Acceptance recorded and show the separate overall handover status with the existing completion requirements. No workflow statuses or payment gates changed.

Validation: production build passed. Isolated browser checks cover empty/whitespace and populated URLs, pending overall handover with recorded acceptance, and runtime errors. Tests use mock API records without production writes.

Live backup: `/var/www/solar_crm/backups/handover-evidence-20261119-093020`. Publication uses source/hash guards, preserved assets and atomic index replacement.
