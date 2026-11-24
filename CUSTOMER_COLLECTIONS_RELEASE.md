# Customer collections web release — 24 November 2026

## Delivered

- Invoice-wise receivables and refunds remain separate; a customer may have both on different invoices. Subsidy is excluded. Credit notes reduce the invoice final amount.
- Customer directory has clickable total/count cards, sortable monetary/date columns, AND filters, removable chips, URL-based shared views, server pagination and filtered/selected CSV export without the old 150-record totals limit.
- Invoice/opening breakdown, payment/refund recording with retry IDs and transaction locks, collection notes, promised dates, completion and scoped collection-owner assignment.
- WhatsApp actions prepare messages for staff to review and send; no automatic customer WhatsApp messages are sent.
- Dated quotation payment schedules (100% total) populate linked invoice milestones once. Historical terms remain text and are not guessed into dates. Missing dates have their own filter and an explicit date-setting action.
- Customer-level loans are allocated once to oldest linked invoice debt. Undisbursed sanctions are shown as loan awaited, never as received. Fully loan-awaited invoices are excluded from overdue chasing.
- Tenant-timezone owner notifications: 3 days before due, due date, every 7 days overdue, promised-date tasks and configurable refund alerts (default 7 days). Delivery is deduplicated. Archived/recycled customers are excluded; collection notifications participate in customer deletion.
- Admin/Finance can record money; Sales can view scoped records and log follow-ups. Manager/team scope and company boundaries remain enforced.
- Customer profile and financial reports use the same ledger calculations.

## Verification

- 32 focused Node tests passed (financial formulas, opening edits/imports, plans, permissions, refund edge cases and reminders).
- 17 isolated MySQL/API scenarios passed: role/tenant boundaries, retry safety, concurrent overpayment rejection, credit notes, quote schedule create/edit, dated milestone generation, deduplicated notifications, report consistency and >150-customer totals.
- Desktop/390px browser smoke passed: filter URL, drawer, formatted receipt, note save and no page overflow.
- VPS production build passed. Live directory requests returned HTTP 200 for Admin, Manager, Sales and Finance in both active tenants; financial reports returned HTTP 200.

The opt-in MySQL runner creates and removes only a uniquely named `qa_customer_collections_20261124_*` test database. It does not insert transactions into client databases.

## Scope

Web/backend release only. Mobile UI is deferred as requested. Existing local mobile edits were not included. Production customer profile behavior unrelated to this task was preserved; the local pre-existing conversion work remains available separately.
