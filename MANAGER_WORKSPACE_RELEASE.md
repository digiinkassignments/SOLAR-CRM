# Manager workspace release — 13 November 2026

Manager now shares Admin's sidebar, navbar, dashboard overview, lead list, follow-up calendar, birthdays, customers, quotations, invoices, projects, financing, stock, detailed reports and settings screens. User Management is excluded; its mutation APIs remain blocked. Existing Sales Team, Team Follow-ups, Team Performance report and Manager dashboard tools remain available. The dashboard has Overview and Team Operations tabs.

## Access rule

A manager's lead scope is exactly current assignment to a non-deleted Sales user (`role_id=3`) whose `manager_id` matches that manager. Created-by-self, assigned-to-manager, unassigned, engineer-assigned and other-team leads do not qualify. Scope applies before pagination/counts and to direct lead access, follow-ups, workflow actions, linked commercial/project/finance lists, reports and direct record routes. Admin retains organisation-wide access. Stock is a shared company catalog; company settings remain shared. Discount approval and company discount/timezone policy remain Administrator-controlled.

Request-local database facades carry immutable manager scope; shared tenant pools are never modified with another user's scope. Repeated tenant middleware preserves this context. Quote/invoice/project/customer actions use scoped record checks, and bulk operations reject mixed-team IDs. Manager lead import requires a team salesperson. Manager user-picker APIs return only team Sales members. Linked references on writes are checked as well.

Shared reports fetch all result pages rather than silently using only the first 200 leads. Manager team revenue now uses recorded won quotation amounts rather than an assumed Rs 50,000/kW value. Saved calculator queries use the actual mobile-number field and scoped fallback.

## Validation and deployment

- 45 backend tests passed, including new manager scope and isolation cases.
- Changed-screen undefined-symbol checks and Vite production build passed.
- Headless browser smoke passed 14 Manager routes, hidden Users navigation, dashboard drilldown links, retained Team Operations and dashboard widths 390/1024/1440.
- Read-only live API smoke passed 32 module/access checks across Manager and Admin; live Admin total preserved.
- Session-only temporary SQL fixtures verified positive team visibility plus exclusions for other team, manager-owned, creator-owned, unassigned, engineer, deleted staff and deleted leads. Temporary tables were dropped; real customer fixture records were not created.
- Existing live Manager has no linked Sales members and therefore zero scoped leads. Assign the appropriate Manager on Sales users in Admin → User Management; team membership was not guessed or altered.

Local and live index SHA-256: 0665da3b641ecde0ab5a29acaf4a3008f97f6c7936071fe9b3b4ff6afc255bfd.
Backup: `/var/www/solar_crm/manager-workspace-backup-20261113-161036`.
Older sessions without a company-bound login token need sign-out/sign-in.
