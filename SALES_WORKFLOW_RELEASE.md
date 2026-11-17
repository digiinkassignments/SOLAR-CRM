# Sales workflow release — 13 November 2026

Implemented locally and prepared for deployment:
- Sales dashboard next-action queue with note, actual outcome, status and rescheduling. Failed writes roll back; closed statuses use the existing lead conversion workflow.
- New Leads, Converted Deals and Upcoming Visits cards link to their respective filters, retaining server-side salesperson scope.
- Manual active lead creation and new scheduling require an action, date and exact time. Older imported/integration leads are retained and flagged as incomplete; no invented appointment time is added.
- Shared Admin / Manager follow-up dialogs and lead forms support scheduling fields. Manager refresh callbacks corrected.
- Tenant-specific reminder jobs use company timezone, transactional notification storage and deduplication. In-app reminders work without Firebase; push requires a valid configured device. Missed earlier-day tasks appear in the overdue summary. No external WhatsApp/email reminder delivery is claimed.
- Quotation edits save numbered commercial snapshots and rotate opaque public links. Old opaque links show their saved revision and cannot accept a superseded proposal. Accepted quotes must be duplicated to change commercial terms. Concurrent stale edits are rejected.
- Sales/Manager discounts over the company limit require administrator approval. Pending/rejected revisions cannot be shared, accepted or converted to an invoice. Invoice conversion checks the selected revision.
- Admin Settings → Sales workflow controls timezone and discount limit, with revision review and approve/reject notes. Default timezone Asia/Kolkata, default discount allowance 0%.

Account connection for Meta, Google and WhatsApp remains deferred by request. No provider tokens or real customer messages were used in tests.

Validation: 12 backend tests covering role scope, task validation, SQL bindings, action rollback, timezone/deduplication, revision snapshots/discount gating and solar tax consistency. New component lint, changed-screen undefined-symbol checks, backend syntax checks and Vite production build pass. Interactive browser and real-device push delivery still require operational verification.

Database changes are additive. Existing commercial records are not repriced; revision capture starts when a quotation is next saved. Users with older login tokens may need to sign out and back in for company-bound workflow endpoints.

Deployment completed: local source and live release match. Live index SHA-256: 97f919d1cc8205abbf6329cadce5541b39671a7bdf4c06e8f75ef715e1ac5dcb. Backup: /var/www/solar_crm/sales-workflow-backup-20261113-151348. Authenticated read-only checks passed for Admin, Manager and Sales settings, action queues and notification APIs; Admin approval queue passed. Sales queue was checked against assigned-user scope. Dashboard save now refreshes its metrics and activity list. Frontend route and built asset return HTTP 200.
