# Projects UI release — 10 November 2026

## Delivered scope

- Replaced the oversized project-list presentation with a responsive card/table workspace, clear filters, summary metrics, skeletons, empty/error/retry states and accessible actions.
- Reworked project detail header, milestone/owner/system information and commercial summary. Removed nested outer padding.
- Added a Projects-only theme wrapper to fix fixed-height button clipping, small-screen wrapping, alert actions, dialog sizing and scrollable tables. Moved unsupported Stack styling shorthand into `sx` so spacing/alignment actually applies in the installed MUI version.
- Fixed Engineer detail routes and role-correct project links, back navigation and dashboard navigation. Create/delete actions now match the backend's existing role restrictions.
- Prevented older list responses overwriting newer filter results; delete on the last row of a page returns to the preceding page. Added positive-capacity/negative-payment checks and action-in-progress guards.
- Removed fabricated customer/document/serial/monitoring defaults, paid AMC defaults, completed sample service visits, fixed illustrative milestone timelines and default five-star feedback. Existing saved records are retained. Unsaved warranty values are identified as drafts.
- Handover and warranty use the shared API base URL, rather than a hardcoded live tenant hostname.
- Corrected the Admin navbar title for Projects.

No backend source, database schema, customer records, Nginx configuration or other application deployment was changed. The backend was not restarted.

## Validation

- Production frontend build passed.
- Browser smoke script: `scripts/project-ui-smoke.cjs`.
- Local checks passed for Admin, Manager and Engineer at 1440, 768 and 390 pixels: list/detail navigation, create/edit dialog rendering, no horizontal page overflow and action buttons within viewport.
- All eight detail tabs were exercised for Admin at those sizes; table view and failed-load/retry were exercised too. Tests fail on browser runtime exceptions.
- API calls in browser checks are intercepted with synthetic fixtures. They do not validate real production create/update/delete transactions or every populated-record variant, and do not access customer data.
- The same 3-role/3-size browser checks also passed against the published HTTPS frontend, with API interception retained.
- The new scoped workspace component has no lint findings. Existing hook/legacy lint findings remain in project screens; lint is not reported as globally passing. No undefined-variable or parser errors remained in the project-source check.
- Existing overall application bundle remains approximately 12.6 MB minified; application-wide code splitting is outside this release.

To reproduce the browser checks, install Playwright into the ignored `.tmp/project-ui` directory, build the frontend, run Vite preview on `127.0.0.1:4173`, then execute `node scripts/project-ui-smoke.cjs`. The script uses installed Google Chrome. An optional first argument selects a deployment origin; API requests remain mocked.

## Deployment and recovery

Frontend published to `https://diassignments.digiinksolutions.com/projects`.

- Full pre-release frontend backup: `/var/www/solar_crm/backups/projects-ui-before-20261110/frontend-dist.tgz`.
- Unpacked release: `/var/www/solar_crm/releases/projects-ui-20261110`.
- New main asset: `assets/index-BE8PGbK1.js`.
- Published index SHA-256: `701a1c1fa25ea7fe3bfae1eda169c3ffa658ca39f31978242cba8d04265fe1cf` (matches local build).
- New assets were published first, followed by an atomic index replacement. Existing hashed assets and root static files were retained for open sessions.
- HTTP checks: Projects route 200, new JavaScript asset 200, unauthenticated `/api/auth/me` 401 as before. PM2 backend remained online with the same restart count (63).

Rollback: extract the backed-up `index.html` into a temporary file in the live `dist` directory, restore its readable owner/permissions, then atomically replace the live index. Previous hashed assets remain present. The full archive is available if additional static-file restoration is necessary. No rollback has been performed.

## Product research

See `SOLAR_PROJECT_FEATURES.md` for a 20-area feature inventory, source links, current-module mapping and recommended implementation batches. No new DISCOM, payment, messaging or monitoring integration is claimed by this UI release. The wider security/data-integrity findings in the earlier SaaS audit remain separate work.
