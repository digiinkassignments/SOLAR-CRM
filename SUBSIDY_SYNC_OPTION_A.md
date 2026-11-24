# Subsidy sync — Option A

Implemented from `Subsidy_Sync_Option_A_Dev_Spec.pdf` v1.1 (23 November 2026).

## Decisions

- Bank Details complete (tracker stage 8) triggers Subsidy Applied, after actual handover completion.
- No manual Subsidy Received override, including Super Admin.
- Only active Super Admin and Application Manager accounts edit any tracker data or documents. Current database roles are checked again inside saves; stale tokens do not retain edit access.
- Other existing roles have masked, read-only views within their own permitted scope. No new Telecaller access is granted.
- Legacy mapping runs once, after a database/source backup and review report. A stage label alone never proves handover was completed.

## Behaviour

Execution order: Order Closed → DISCOM Application → Pre-Install Inspection → Procurement → Installation In Progress → Commissioning → Handover Done → Subsidy Applied → Subsidy Received → Warranty Period.

Tracker credit requires sequential progress, a positive amount, a valid credit date after commissioning (not future in the company timezone), and a UTR. A short credit requires an explanation; duplicate UTRs produce warnings. Project synchronization and tracker saves share a transaction, with one bounded retry for infrastructure failures. Repeated/concurrent saves do not duplicate lifecycle transitions.

Credit before handover copies receipt information and sets a pending flag. Completed handover catches up the automatic stages. Commercial/opt-out projects skip subsidy stages. Warranty starts on handover, independently of subsidy; subsidy never changes customer receipts, balance or refunds.

Changing credited receipt details or reopening credit requires a Super Admin and a reason. Reopening returns the subsidy stage to Applied and retains handover/warranty dates. Invalid historical credits are flagged for review without blocking handover or inventing a valid receipt.

Residential projects, including direct-customer projects without leads, receive a linked tracker. Survey conversion initializes it inside the existing transaction without schema DDL. Ambiguous legacy lead/project links are reported rather than guessed.

## Operations

- Schema migration: `solar_crm_backend/Database/migrations/032_subsidy_sync.js`.
- One-time stage mapping: `services/subsidyReconciliation.migrateLegacy(db)`; original stages are retained in `subsidy_legacy_stage_backup`.
- Sync/legacy review: `GET /api/subsidy/sync-report`, restricted to tracker editors; available in the tracker UI.
- Nightly reconciliation: 02:35 Asia/Kolkata for active tenants. Missing trackers, invalid/manual receipts and failed synchronization are surfaced for review.
- Internal credit notifications go to the project owner, assigned salesperson and their manager.
- Customer WhatsApp delivery remains dependent on the separate provider/template integration. Neither active tenant had a connected WhatsApp provider at preflight; this release does not send customer WhatsApp messages or retroactive migration messages.
- Flutter source/APK is not part of this web release. Backend permission and validation changes also apply to API clients; the responsive web screens were checked at mobile width.

## Verification

- 69 targeted automated tests: subsidy rules/UI persistence, role policy, survey conversion and customer ledger regressions.
- 18 isolated MySQL/API scenarios, including injected rollback, concurrent idempotence, all six roles, stale-token revocation, handover gates, lead-less projects, legacy mapping and reconciliation.
- Six role screens checked in headless Chrome at desktop and 390px width with synthetic API data: no runtime errors or horizontal page overflow.
- Production frontend build passes; existing bundle-size/XLSX warnings remain.

Run the database suite only against its disposable scratch database:

```sh
RUN_SUBSIDY_SYNC_MYSQL_QA=1 node tests/integration/subsidySync.mysql.cjs
```

The runner creates and removes only its own uniquely named `qa_subsidy_sync_20261124_*` database. Production write scenarios are not exercised against client records.

## Rollout — 24 November 2026

- Web/backend deployed to both active companies; all six existing roles checked through their real tenant domains.
- Seven project trackers linked in the first company and one in the second.
- Two historical Subsidy Applied projects mapped to Handover Done (active). No completed handover or credit was invented.
- No unresolved migration links or reconciliation mismatches at rollout.
- Full database and source backup: `/var/www/solar_crm/backups/subsidy-sync-20261124-074016` on the VPS. Backup files remain server-side and are not committed to Git.
