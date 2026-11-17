# Solar project workspace — researched feature map

Research date: 10 November 2026. This is a proposed product backlog; it is not a claim that all features below have been implemented.

## What an actual solar project tracks

An Indian rooftop installation includes customer/application details, technical feasibility, installation documents, inspection, net-meter work, commissioning and subsidy processing where eligible. The exact sequence and documents vary by DISCOM, location and project type. The Delhi government describes registration, feasibility approval, vendor installation, document submission, inspection, meter installation, commissioning certificate and subsidy application in its [consumer installation process](https://eerem.delhi.gov.in/eerem/installation-process-consumers). This is a regional example, not a universal national workflow or subsidy eligibility determination.

Commercial solar software also treats a project as a workspace for customer/site data, assignments, designs, workflow, activities and private files. See [OpenSolar project model](https://developers.opensolar.com/api/projects/) and [OpenSolar application flow](https://support.opensolar.com/hc/en-us/articles/13211447430799-Application-Flow).

The product recommendations below are our synthesis of these workflows and the existing CRM's gaps. They are not all features promised by those sources.

## Full feature inventory to consider

| Area | Features | Current CRM direction / next step |
|---|---|---|
| 1. Project overview | Unique code, customer/site, residential/commercial type, system capacity, owner, priority, dates, next action, blockers, risk flag, contract/balance summary | Overview and basic dates exist; add actionable owner/deadline/blocker fields |
| 2. Sales-to-delivery handoff | Link accepted quote, approved design, scope, exclusions, advance, contract, sales notes, change requests | Quotation linkage exists; enforce a complete handoff checklist |
| 3. Site survey | GPS/address, roof material/condition, usable area, shading, structural review, load/phase, meter and bill, access, photographs, customer consent | Survey/pre-install sections exist; connect observations to design and signoff |
| 4. Design and engineering | Panel layout, tilt/azimuth, strings, inverter selection, AC/DC cable sizing, single-line diagram, structure drawings, generation estimate, design revisions/approval | Calculator/specs exist; drawings/versioned design approval need product work |
| 5. DISCOM/application | Utility/consumer number, portal reference, feasibility submission/approval, queries, uploads, inspection appointment, rejection/rework, meter application | Stage exists; add a dedicated checklist and application tracker |
| 6. Documents | Required-document checklist, private files, revisions, uploader/date, expiry, signatures, generated PDFs, controlled customer sharing | Various URLs/forms exist; consolidate into a private document repository |
| 7. Procurement | Project BOM, purchase request/order, supplier comparison, approvals, delivery promises, partial receipts, shortage and returns | Procurement code exists; finish accessible entry points and project linkage |
| 8. Material traceability | Stock reservation, issue/return, panel/inverter serials, batches, DCR/OEM evidence where applicable, dispatch proof and damage | Stock and installation fields exist; atomic movements and serial tracking are priorities |
| 9. Installation planning | Crew/contractor assignment, calendar, dependencies, site readiness, tools/material check, rescheduling, weather/access hold | Installation dates/logs exist; add owner-based scheduling and blockers |
| 10. Site execution | Phase checklists, daily work logs, dated photos, installed quantities, labour/material usage, snags, field notes, draft recovery and upload retries | Installation tab exists; improve mobile capture and actual completion evidence |
| 11. Quality and safety | Earthing/insulation/voltage tests, structure/cable inspection, safety checklist, corrective actions, retest, engineer/QA signoff | Inspection/commissioning tabs exist; make required evidence authoritative |
| 12. Grid connection | DISCOM inspection, net-meter number/install date, import/export readings, energization permission and commissioning certificate | Commissioning exists; track external utility milestones independently |
| 13. Finance | Milestone invoice schedule, receipts, balances, reconciliation, credit/refund, project costs, margin, loan sanction/disbursement, collection tasks | Invoices/loan/contracts exist; ledger consistency comes before margin dashboards |
| 14. Subsidy | Applicable/not applicable, application reference, evidence checklist, bank verification status, queries, submission/approval/disbursal dates, rejection/rework | Subsidy module exists; don't force commercial/non-subsidy projects through subsidy stages |
| 15. Customer handover | Training, emergency shutdown, monitoring access, as-built drawings, warranties, signed acceptance, actual handover date, open issues | Handover exists; record actual evidence and do not prefill completed work |
| 16. Warranty and AMC | OEM terms, serials, start/end dates, certificate, free-service period, paid AMC, renewal, service calendar, visits, complaint tickets, claims/spares | Warranty/visits exist; remove sample records and add genuine service scheduling |
| 17. Customer communication | Approved email/WhatsApp templates, progress updates, appointments, document requests, delivery history, customer portal, escalation | Sharing/reviews exist; separate communication consent and delivery audit |
| 18. Team collaboration | Tasks, assignees, due dates, comments/mentions, internal vs customer-visible notes, file links, escalations | Ownership/history exist; task/deadline workspace would add practical value |
| 19. Management reporting | Stage aging, blocked work, overdue tasks, planned vs actual dates, crew capacity, pending approvals/material, collections, margin, rework | Reports exist but schema/data accuracy must be repaired first |
| 20. SaaS governance | Company isolation, per-record roles, approval limits, immutable history, exports, backups, retention, entitlement enforcement | Foundation fixes documented in the main audit remain necessary |

## A practical workflow model

Use a main delivery lifecycle such as **Order confirmed → Survey/design approved → Materials/site ready → Installation → QA/commissioning → Customer handover → Service**.

Track **DISCOM/net-metering**, **finance/loan**, **subsidy** and **procurement** as parallel workstreams, each with its own status, owner, deadline, evidence and blockers. A single rigid ten-stage sequence cannot represent every commercial, residential, no-subsidy or delayed-utility project accurately. Handover need not be held until subsidy disbursement in every business model; make policies explicit per project type.

Do not deploy this lifecycle redesign silently: existing stages/history and reporting require a planned migration. The current UI release preserves the stored stage vocabulary and APIs.

## Suggested next implementation batches

1. Required: secure project access, truthful statuses, atomic payments/stock, stable route/navigation and responsive UI.
2. High value: assigned tasks, deadlines/blockers, document checklist, configurable project templates and utility/subsidy tracking.
3. Operational scale: procurement approvals, material serials, crew calendar, customer portal, service tickets and notification delivery history.
4. Advanced: design/version approvals, inverter monitoring integrations, actual-vs-estimated generation and profitability dashboards.

Automatic portal submissions, messaging, monitoring integrations and offline sync each require a separate integration design and validation; a UI checkbox is not evidence that an external action occurred.
