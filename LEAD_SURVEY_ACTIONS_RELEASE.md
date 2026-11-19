# Lead survey actions release ? 19 November 2026

Removed the obsolete survey approval controls from Leads Management: lead cards, action menus and lead profile dialogs. Removed the unused modal wiring in the shared page. Admin and Manager no longer see approval actions; survey scheduling and the existing automatic Feasible conversion remain unchanged.

Validation: production frontend build passed; 13 survey completion/conversion tests passed; isolated browser checks passed for Admin, Manager and Sales across cards, menus and profiles. No production records were created by these checks.

Deployment: frontend source and build published with source/hash guards, assets uploaded before atomic index replacement. Rollback backup: `/var/www/solar_crm/backups/leads-survey-actions-20261119-072708`. Published index SHA-256: `559200f5451c4a9dd2d8505d895a97395793a11d9a1848f8e4ab27779f4b240b`.
