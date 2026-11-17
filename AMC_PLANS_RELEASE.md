# Company AMC plans

Released locally and live on 13 November 2026.

## Usage

Company Admin opens **Customer Handover → Edit AMC Plans** or **Warranty & AMC → Edit AMC Plans**. Create/edit plans with name, annual fee, service frequency, contract term in months, coverage and exclusions. Switch Active off to archive a plan. Manager can view the catalog and select active plans for accessible projects; company-wide editing is Admin-only.

In **Warranty & AMC → Edit AMC details**, select the agreed plan explicitly. Its annual fee, service frequency and term populate the form. Review/edit the project contract amount and dates before saving. No plan or payment status is automatically assigned. Saving or editing the catalog does not issue an invoice, collect payment or schedule visits automatically.

Plan selection stores a server-created snapshot of the agreed plan name/coverage/exclusions/catalog fee/frequency/term/version. Catalog edits and archival do not overwrite existing project contracts. Existing legacy plan labels are preserved; their coverage is no longer guessed from Basic/Standard/Premium names. New selections must come from the active company catalog. Concurrent catalog edits and stale selections are rejected for review.

Customer Handover now exposes plan management and directs contract selection to Warranty & AMC. Its free-service period no longer claims a fixed four visits. Payment clearance rules were retained.

## Validation

- Backend suite: 55 tests passed. Additional post-release guard check: all 4 AMC tests passed.
- Tests cover tenant catalog separation, Admin/Manager/Sales/Engineer permissions, invalid values, SQL parameter binding, immutable contract snapshots, stale updates and archived selections.
- Browser fixture tests cover creation, save failure/retry, explicit selection, no preset options, refresh persistence, archival and responsive editor widths 390/768/1440. Mobile screenshot inspected.
- Frontend production build and relevant lint checks passed. Existing large-bundle warning remains.
- Live read-only checks passed for Admin/Manager/Sales catalog authorization, warranty loading and additive schema. No test plans/customer contracts were written to production. Catalog was empty at release.

## Deployment

- Backup: `/var/www/solar_crm/amc-plans-backup-20261113-180320`.
- Additive table: `company_amc_plans`; warranty columns: `amc_plan_id`, `amc_plan_snapshot`.
- Live index SHA-256: `ec439945a777170b86e909bf2cc24b8671be2e14e13dca97446495783daf8c91`.
- HTTPS page hash and JavaScript bundle availability verified. Previous frontend assets retained.
