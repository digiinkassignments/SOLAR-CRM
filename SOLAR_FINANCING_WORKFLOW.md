# Subsidy and solar-loan workspace

Reviewed 10 November 2026 for an Indian solar EPC business. The interface is a team-maintained operations tracker, not an official portal or bank integration.

## Research that informed this release

The [Delhi government consumer process](https://eerem.delhi.gov.in/eerem/installation-process-consumers) describes registration, feasibility approval, installation evidence, DISCOM inspection, net metering, commissioning and a subsequent subsidy claim/bank-verification process. Its regional rules should not be treated as universal eligibility or timing guarantees.

[SBI's Surya Ghar product page](https://sbi.bank.in/web/personal-banking/loans/pm-surya-ghar-loan-for-solar-roof-top) distinguishes application, sanction and payment. It describes registration before a Jan Samarth application, vendor/EPC-directed disbursement, and subsidy credit to the borrower's loan account. Those are SBI-specific terms, not a promise about every bank/NBFC. Record the lender's sanction and actual receipts; confirm the beneficiary account for each case.

[Bank of Baroda's composite product](https://bankofbaroda.bank.in/loans/other-loans/pm-suryaghar-yojana-bundled) combines a fresh home loan and rooftop solar finance. It illustrates why one bank's product, margin and eligibility conditions cannot be used as a universal solar-loan template. No current interest-rate promise has been hardcoded from this research.

## Working model for an experienced EPC team

| Track | What the operator records | What must not be confused |
|---|---|---|
| Customer and site | Customer, electricity consumer number, capacity, location, quote/project link | A sample capacity or amount is not verified customer data |
| Subsidy process | Portal reference, feasibility, installation documents, meter work, commissioning, bank details, claim and follow-up | CRM stage changes do not update the official portal |
| Loan application | Lender, branch/contact, application reference, requested amount, queries, sanction terms and documents | Sanction does not prove payment |
| Funds received | Actual bank disbursement amount/date; subsidy credit/reference/date and any confirmed loan adjustment | Expected subsidy must not be counted as money already available upfront |
| Documents | Required evidence, uploads, verification/rejection, fix tasks | DCR/compliance flags require evidence and review |
| Follow-up | Stage owner, age, internal target and reason for delay | Internal targets are not government or bank approval SLAs |

Subsidy and loan tracks run in parallel. A cash-funded customer can have a subsidy file without a loan. A bank-financed customer can have a sanctioned loan while subsidy remains unclaimed/uncredited. Lender rejection does not automatically reject the subsidy application. Keep each status and amount distinct.

## Interface and calculation decisions

- One sidebar entry, **Subsidy & Finance**, with **Subsidy tracker** and **Solar loans** tabs. Existing loan URLs redirect into the new section. Manager routes use the Manager shell and preserve return navigation.
- Keep the current slate/amber palette and existing stage colors. Improve hierarchy, responsive spacing, forms, buttons, tables and dialogs rather than replacing the brand.
- Show requested, sanctioned and disbursed loan amounts independently. Show expected subsidy and recorded subsidy credit independently.
- New loan records start without fictitious project costs, subsidy amounts or credit scores. The default editable EMI rate is an illustration, not a lender quote; actual fees, repayment schedule and moratorium must be confirmed with the lender.
- Initial funding estimate = project cost minus customer contribution. Changing expected subsidy alone does not reduce an entered loan request. Operators can edit the request to match the lender application.
- Zero-interest EMI is principal divided by duration. Invalid/negative values must not produce a plausible estimate.
- Use a single full subsidy-file editing path instead of the older quick-edit drawer with a different stage vocabulary and field contract.
- Require amount, date and transaction reference before saving a subsidy receipt/credited status. This records evidence; it does not verify a bank transfer automatically.
- Do not overwrite saved customer/application records to remove historical sample values. Existing data should be reviewed separately with the business owner.

## Release boundary

This release changes the frontend/navigation and estimator, plus a small loan-model correction that preserves explicit zero interest/subsidy values instead of substituting 7%/78,000, and avoids substituting a sample 3 kW capacity for missing data. It preserves the existing backend endpoints, database schemas and stored stage vocabulary. Existing server-side authorization, receipt reconciliation, partial-tranche modelling and broader API validation limitations require separate work; client-side checks are not a replacement for them.

Future work worth prioritising with the client: configurable lender checklists, partial disbursement receipts with references, explicit subsidy-credit destination, approved sanction terms, linked bank-query tasks, document expiry and reconciled project collections. These require server-side design and should not be simulated with UI-only status labels.

## Loan workflow follow-up — 10 November 2026

The five stages are broad CRM milestones, not a complete or universal lender process. Official [Indian Bank rooftop solar terms](https://indianbank.bank.in/en/pm-surya-ghar-muft-bijli-yojana-roof-top-solar-loan) explicitly describe upfront and post-installation disbursement, and separate subsidy credit with revised EMI. [SBI](https://sbi.bank.in/web/personal-banking/loans/pm-surya-ghar-loan-for-solar-roof-top) describes national-portal/Jan Samarth registration, vendor-directed payment and loan-account subsidy credit. Eligibility, evidence, margin, insurance and repayment requirements vary by lender/product; these pages are examples, not universal approval rules.

Implemented locally and deployed from the local build:
- Browser and API enforce matching milestone evidence: lender/request/application reference/date, sanction amount/date/letter, actual disbursement/date. Invalid stages, invalid dates, reversed date chronology and payment above sanction are rejected.
- API checks existing records, negative/nonfinite amounts, positive whole-month tenure, stopped-status reasons, and backward-stage reasons. Existing incomplete legacy files can still receive notes-only repairs.
- Project loan tab now loads by project ID correctly, preserves zero-interest EMI, removes sample capacity/cost/subsidy/request defaults, opens evidence forms and saves only fields for the selected milestone. Unsaved future payments no longer leak into earlier stages.
- API EMI recalculation uses saved lender terms instead of substituting defaults when only principal changes.
- Already posted project receipts cannot silently change amount/lender/project, and paid loans cannot roll back stages without reconciliation. This is a guard, not a reconciliation implementation.
- Loan workspace explains the difference between lender approval, actual payment, subsidy adjustment and bank repayment. Jan Samarth is no longer offered as a bank for new records; historical saved values remain untouched.

Still outstanding: individual tranche receipts/UTRs, atomic and idempotent receipt posting, bank reconciliation, lender-specific configurable checklists, lender retry history, explicit subsidy-adjustment evidence and repayment schedule/closure tracking. The current cumulative amount and subsidy checkbox do not implement those features. Existing upload verification labels and broader authorization issues from the audit remain outside this release. No database schema migration was added.

Validation: production build; 11 EMI/workflow/API tests with mocked DB; finance browser checks for Admin/Manager at five widths and existing Project regression checks at three widths for Admin/Manager/Engineer. Browser API writes are intercepted with synthetic fixtures; these checks do not submit real bank applications or alter customer records. Legacy hooks/unused-import lint findings remain in ProjectLoanTab; no parser or undefined-symbol errors were found in scoped lint.

Deployment backup: `/var/www/solar_crm/backups/loan-workflow-before-20261110`. Backend changes: `controllers/loanController.js`, `utils/loanWorkflow.js`; frontend is built from this workspace. Rollback: restore the backed-up controller and frontend archive, then restart only `solar-crm-backend`. The added pure validator can remain unused after rollback.

Final follow-up: preserved rejected/withdrawn lender reopening with a recorded reason; 12 unit/API tests now pass. Live controller SHA256: 1622ac19cadc04e758952eb4d3da7e23ab8cd48949f18578083a8a988e6b6db1. Frontend index SHA256: cb19fdbd70ce67fb0242e112594308349684c7692153efa34c03d2eec050d777. Both match local files.

Live verification: backend readiness and served-index hash passed. The first full live browser run timed out loading a page after 30s; the longer-timeout retry completed Admin desktop cases but was stopped before the complete matrix due slow repeated page loads. Full responsive matrix passed locally; full live matrix is not claimed.
