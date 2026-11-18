# Field Operations navigation removal — 18 November 2026

- Removed Field Operations from the shared Super Admin/Manager sidebar.
- Replaced old `/field-work/*` and `/manager/field-work/*` pages with redirects to the respective Projects pages, including bookmarked survey/task links.
- Removed obsolete navbar title mapping.
- Engineer routes, survey submissions, Projects, reports and stored records were not changed. No backend/database changes.
- Validation: production build passed; isolated browser checks passed for both administrative roles and Site Engineer, including nested legacy URLs.
- Live rollback backup: `/var/www/solar_crm/backups/remove-field-operations-20261118-085920/`.
- Deployment checks existing frontend sources and live index before publishing; existing assets retained.
