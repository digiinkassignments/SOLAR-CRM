# Solar CRM SaaS audit — 10 November 2026

## Scope and conclusion

Local source review of the Express/MySQL backend, React CRM, Digiink administration app, schema/provisioning/migration scripts, and selected business workflows. Both frontends were built; available calculator tests and frontend lint commands were run.

**Conclusion: substantial Solar EPC functionality exists, but this version is not ready for a trustworthy multi-company SaaS launch.** Tenant isolation, public document access, authorization, financial consistency and database lifecycle need attention before adding more features. UI problems include broken role navigation, scattered layouts, loading behavior and a very large application bundle.

No SSH/SCP, VPS access, deployment, production API requests, database migrations, account changes or source-code fixes were performed. Builds regenerated local ignored `dist` outputs. The supplied VPS connection/deployment information is context only.

This is a source audit, not a claim that every screen and production behavior was tested. No authenticated visual walkthrough, production schema comparison, backup verification or external dependency vulnerability scan was performed. Findings below distinguish directly observed code defects from risks requiring isolated runtime verification. Do not interpret lint counts as a count of user-facing bugs.

## Existing product map

| Area | Present functionality | Main concern |
|---|---|---|
| Platform administration | Clients, plans, provisioning, renewals, payment confirmation, impersonation | Tenant/session boundaries, destructive lifecycle, provisioning reliability |
| CRM | Leads, assignment, follow-ups, birthdays, customers, roles | Role checks and permissions disagree; notification tenant handling |
| Sales engineering | Solar calculator, quotations, web acceptance, PDF | Public access, concurrent numbering, conversion integrity |
| Finance | Invoices, payment ledger, loans, subsidy tracking | Atomic writes, reconciliation, validation, record access |
| Field operations | Surveys, projects, inspections, installation, commissioning, handover | Engineer navigation, stage rules, reporting schema drift |
| Inventory | Items, IN/OUT, reservations, imports, alerts, procurement | Concurrent stock writes, reservation invariants, decimal quantities |
| Service | Warranty, AMC, service visits, customer review | Review access and report accuracy |
| Interface | Admin/manager/sales/engineer layouts, onboarding, subscription banners | Duplication, inconsistent guards, oversized bundle |

## Verification results

| Check | Result | Meaning |
|---|---|---|
| CRM `npm run build` | Passed | Compilation succeeds; business behavior is not proven |
| Administration `npm run build` | Passed | Same limitation |
| CRM `npm run lint` | Failed: 585 errors, 27 warnings | Mix of unused imports/variables, hook rules and other findings; triage individually |
| Administration `npm run lint` | Exit 0 with 19 warning diagnostics | Warnings include unused code and hook dependencies |
| `node --test tests/solarCalculatorEngine.test.js` | 7/7 passed | Existing calculator cases pass; does not certify tariff/subsidy correctness for every location/date |
| Quotation test inspection | Only verifies exported functions | Does not exercise CRUD, permissions, conversion or transactions |

CRM main JS: **12,606.31 kB minified / 3,410.34 kB gzip**. Separate HTML-to-PDF chunk: 735.62 kB. Administration main JS: 1,153.06 kB / 339.06 kB gzip. Both builds warn about chunk sizes. These are build measurements, not measured page-load times.

The backend was deliberately not started: `server.js` runs migrations across tenant databases and starts subscription jobs, including deletion. Module imports can also run schema creation. Local Vite CRM configuration proxies `/api` and `/uploads` to the live domain, so a local browser session is not automatically an isolated test environment.

## P0 — address before onboarding more tenants

### F01. JWT is not bound to the tenant database — critical security defect

Evidence: `controllers/authController.js` signs `{ id, role_id, permissions }`; `middleware/authMiddleware.js` verifies the signature and attaches claims without validating a tenant. `config/clientDb.js` independently selects a database from the request Host. All tenant pools share the configured application credentials.

Impact: a valid token obtained on company A is not rejected for company B. ID and role collisions can authorize access in B. This is established by the code path; no cross-tenant production request was attempted.

Remedy: include immutable tenant ID and token purpose/audience, validate against the resolved tenant on every protected request, and require active membership. Keep platform administrator sessions separately scoped. Test A-token/B-host rejection for every role, including impersonation.

### F02. Public invoices accept predictable identifiers — critical privacy defect

Evidence: `routes/invoiceRoutes.js` exposes `/public/:token` without login. `models/invoiceModel.js:getInvoiceByToken` matches `public_token OR invoice_number OR id`. The controller returns invoice data, payment history and company settings.

Impact: knowing/guessing an invoice ID or invoice number can bypass the random sharing token. Remedy: accept only strong random, purpose-specific tokens; explicitly select public fields; add expiry/revocation where required. Numeric IDs must return no document.

### F03. Public quotations allow predictable-ID access and acceptance — critical integrity defect

Evidence: `controllers/quotationController.js:getPublicQuotation` and `acceptPublicQuotation` match `public_token OR id OR quotation_number`. Acceptance updates the quotation and marks the linked lead Won.

Impact: predictable identifiers can expose proposals and permit unauthorized commercial state changes. Remedy: token-only lookup, controlled acceptance state transitions, signature/consent evidence and idempotency. Test that expired/revoked tokens and already rejected/voided quotations cannot be accepted.

### F04. Public reviews expose customer details and permit repeated updates — critical privacy/integrity defect

Evidence: `models/handoverModel.js:getPublicHandoverReview` matches review token, project ID or project number and selects customer phone/address. `submitPublicHandoverReview` updates an existing review without a submitted-status restriction. Tokens are constructed from project ID and timestamp, rather than cryptographic randomness.

Remedy: random review token only, minimal public response, explicit one-time or authenticated edit policy, rate limits and review audit trail. GET should not create/mutate review credentials.

### F05. Subscription and feature guards are disconnected — high SaaS control defect

Evidence: `middleware/subscriptionMiddleware.js` defines `checkSubscription`, `requireFeature`, `checkUserLimit`, `checkLeadLimit`; searching all backend route files found no usages. Frontend checks/localStorage therefore do not enforce backend billing restrictions.

Impact: locked accounts can still call business APIs; plan entitlements and quotas are not consistently enforced. Remedy: central subscription enforcement with an explicit allowlist for renewal/status/login, per-module entitlements, and atomic quota enforcement for create/import/reactivate paths.

### F06. Subscription expiry job permanently drops tenant databases — critical lifecycle risk

Evidence: `services/subscriptionCron.js:deleteExpiredClients` calls `DROP DATABASE` for locked clients past their deletion date. It stores the deletion result in `dropped` but marks the client Deleted regardless of success. The visible job does not verify an archive/restore point or recheck renewal immediately before dropping.

Impact: irreversible data loss on successful deletion; misleading state on failed deletion; potential renewal/deletion race. Existing infrastructure backups were not inspected. Remedy: suspend/archive first, documented retention/export process, verified recoverability, isolated deletion worker, serialized renewal/deletion and auditable state transitions.

## P1 — security and business correctness

| ID | Finding and evidence | Impact / required remedy |
|---|---|---|
| F07 | JWT verification does not recheck active/deleted user state or session version (`authMiddleware.js`). Role permissions are embedded at login. | Disabling a user/changing permissions/resetting a password does not itself revoke issued tokens. Add revocable sessions/versioning and current membership validation. |
| F08 | `checkPermission` exists, but no backend route uses it; routes use fixed role IDs. `PrivateRoute.jsx` admits every custom role through every role group via `isCustomRole || ...`. | Custom permissions shown in UI do not correspond to API enforcement; custom roles can enter unintended layouts. Define one permission matrix and enforce both routes and record scope. |
| F09 | Invoice list scopes sales/team records, but `getInvoiceById` only looks up ID and its route requires only a token. | A user can request another team's invoice directly. Enforce the same scope in detail/download/mutation paths. Quotation detail has the same ID-only pattern and needs equivalent coverage. |
| F10 | Project read routes require a token but controller/model filters do not derive team/engineer scope from the caller. Report routes require only a token and query tenant-wide data. | Sales/engineer/custom users can obtain broader project/financial reports than their UI implies. Add permissions plus assignment/team scopes. |
| F11 | Forgot/reset password uses a 4-digit `Math.random()` OTP; auth routes have no visible attempt limit/rate limiter. Login/forgot distinguish account existence. | Brute-force and enumeration risk. Use cryptographic challenges, attempt budgets, uniform responses, password policy and session revocation. Proxy-level controls were not inspected. |
| F12 | `app.js` serves `/uploads` and `/api/uploads` before authentication/tenant resolution. | Any file under this directory is public if its path is known. Classify file types; private customer documents need tenant authorization or short-lived signed access. Do not treat random filenames as authorization. |
| F13 | Tenant resolution uses substring host matching and falls back to the default database for unrecognized hosts (`config/clientDb.js`, `app.js`). | Unknown/custom domain routing can silently select the wrong data context. Use exact registered-host mapping and fail closed for tenant APIs. Validate proxy trust separately. |
| F14 | `invoiceModel.recordPayment` reads totals, inserts ledger and overwrites totals as separate queries without transaction/row lock. | Two simultaneous payments can both create ledger rows but lose one payment in invoice totals. Use a single dedicated connection, transaction, row lock and idempotency key. |
| F15 | Invoice creation inserts invoice then initial payment separately; numbering reads the last invoice and adds one. Quotation numbering follows a similar pattern. | Partial invoices/payment state and duplicate sequence failures under concurrency. Atomic creation, locked sequence allocation and retry rules are needed. |
| F16 | Invoice calculations use `parseFloat(gst_rate) || 13.80`, round GST to whole rupees, then round each half independently. | Explicit zero rate is overwritten; CGST + SGST can disagree with GST total (GST 1 gives halves 1 + 1). Use decimal/minor-unit arithmetic and a consistent rounding/allocation policy. This is arithmetic analysis, not tax advice. |
| F17 | Invoice creation validates only name/phone in controller; model accepts supplied payment status, negative financial inputs and excess initial payments without coherent bounds. | Invalid or contradictory ledger data is possible. Validate a strict input schema; derive status and totals server-side; handle credits/overpayments explicitly. |
| F18 | Single invoice deletion deletes only invoice; bulk deletion separately deletes payments and invoice, swallowing payment-delete errors. | Orphan ledger records or partial deletion depending on schema. Prefer void/reversal for issued invoices; enforce FK/transaction rules and audit records. |
| F19 | `stockModel.createTransaction` reads stock, creates ledger, writes absolute balances without transaction/locking. | Concurrent stock movements can lose updates and disagree with ledger. Serialize per item with row locks and atomic writes. |
| F20 | Stock OUT checks `current_stock`, not stock less reservations; adjustment can set stock below reservations. `parseInt` truncates quantities; zero adjustment is rejected. | Reserved inventory can be consumed incorrectly; cable/metre/kg fractions cannot be represented correctly by this path; zero-count corrections fail. Define unit precision and enforce `0 <= reserved <= current` or explicit reservation-consumption behavior. |
| F21 | Existing-item bulk import adds imported stock to current stock (`bulkImportItems`) without import idempotency. | Retrying the same file adds inventory again. Offer explicit replace/add mode, preview, import batch identity, row validation and consistent ledger transactions. |
| F22 | Stage update accepts any nonempty string (`projectController.updateProjectStage`); model writes stage/log separately. General project update also permits stage. | Unsupported stages and bypassed signoff/checklists are possible; failed log write leaves partial state. Use a canonical stage transition policy and transactional history. |

## P1/P2 — operational defects and UI behavior

### F23. Engineer project detail navigation is broken

`AppRoutes.jsx` defines `/engineer/projects` but no `/engineer/projects/:id`. The shared Admin project list sets its detail base path to manager or `/projects` only. An engineer opening a project is sent into an Admin-protected route and redirected away. Add role-correct detail routes and a shared route builder; verify every menu/list/back link for all roles.

### F24. Field reports read different schema names from their owning models

In `routes/reportRoutes.js`, inspection reads `status` while the model creates `overall_status`; commissioning reads `overall_status` while its model uses `overall_result`; final inspection queries `project_final_inspections` while the model creates singular `project_final_inspection`; handover queries `project_customer_handovers` while the owning model uses `project_handover`.

These errors are caught silently and substituted with stage-derived statuses. Installation progress can default to a hardcoded 45%, and commissioning can become Pass based on stage instead of the saved result. Users can see plausible but unverified reports. Align queries to canonical schema; missing data must remain Unknown/Not recorded. Verify against each tenant's actual migrated schema before deployment.

### F25. Project audit-log write uses a conflicting schema

Public review submission writes `previous_stage/new_stage` into `project_stage_logs`; `projectModel` defines `from_stage/to_stage`. It attributes the event to hardcoded user 1 and swallows failures. Use the actual column contract and an explicit public/customer actor.

### F26. Notifications can go to the default tenant or disappear

`scheduledNotifications.js` queries the global/default DB, not each active tenant. `leadController.js` calls notification helpers without passing the current tenant DB although the helpers default to it. Identical user IDs across databases can route lookup/logging to the wrong tenant.

Additionally, `notificationService.sendToUser` returns if no FCM token exists and inserts the in-app notification only after successful push. Browser users without push tokens lose in-app notifications. Persist tenant-local notifications first and dispatch push as an independent retriable delivery.

### F27. Migrations/provisioning report success after statement failures

`Database/autoMigrate.js` catches individual SQL errors and then records the file as applied. `clientProvisionService.js` similarly logs template errors as non-fatal and can continue provisioning. This can leave different tenants with incomplete schemas that never retry failed migrations. Fail on unexpected errors, track per-tenant migration status/checksums, and test fresh provisioning plus upgrades from an older schema.

### F28. Schema changes occur during application startup and normal requests

Several model `ensure...` functions execute CREATE/ALTER queries, some on module import; password change can ALTER users. `server.js` migrates every tenant before listening and continues after migration errors. Separate deployment migrations from request handling; use limited runtime DB privileges and explicit schema readiness. Starting the server is not a read-only diagnostic action.

### F29. Subscription/UI loading can reject valid access or show blank screens

`usePlanFeatures` starts with null features and `can()` returns false; `PrivateRoute` ignores its loading state before redirecting report access. Direct report navigation can redirect before entitlement loading finishes. Multiple hook instances independently fetch subscription status, while `SubscriptionGuard` also polls. `loading`/`checking` paths return null, and subscription fetch failures fall back to locally stored Active.

Use shared session/entitlement state, a visible loading/error screen, and backend-authoritative access. `can()` also treats `max_users === 0` as permission for every feature: unlimited seats and all feature access should be independent entitlements.

### F30. Session initialization and impersonation need stronger handling

`AuthContext.jsx` trusts stored token/user on normal initialization, without checking expiry or refreshing identity. The CRM Axios client lacks a centralized 401/session-expiry response handler. An impersonation token arrives in a URL query and is temporarily stored before verification; URL removal happens only on success. `/auth/me` does not return permissions, causing permission-based UI inconsistency for refreshed/impersonated identities.

Use a short-lived one-time exchange code, remove sensitive query parameters reliably, revalidate sessions, return the canonical permission payload and invalidate on verification failure. Do not claim localStorage tokens are protected from XSS.

### F31. Frontend architecture slows initial load and multiplies UI inconsistencies

`AppRoutes.jsx` eagerly imports all major screens. Main bundle is 12.6 MB minified. Separate Admin/Manager/Sales/Engineer shell components and duplicated project/procurement implementations increase drift. Nonblank line counts include Leads 3,297; Admin procurement 2,663; InstallationProgress 2,373; calculator 2,319. These are maintainability signals, not automatic bugs.

Split by route, load PDF/scanning/calculator datasets on demand, consolidate the shell and create shared page/table/form primitives. Profile before choosing further optimizations.

### F32. Procurement screens exist without an application route

Both `pages/Procurement/ProcurementList.jsx` and `pages/Admin/Procurement/ProcurementList.jsx` exist, but `AppRoutes.jsx` does not import/mount a procurement screen. Decide the canonical implementation and intended standalone/project-tab entry points; do not assume a file means a usable feature.

### F33. Global UI overrides weaken keyboard focus behavior

`theme/theme.js` disables menu/popover auto-focus and focus restoration globally and makes focused menu-item backgrounds transparent. `index.css` globally replaces menu/popover animation for a trackpad workaround. Keyboard navigation, focus visibility, screen-reader interaction and reduced-motion behavior require manual verification. Fix the underlying interaction in a scoped component and preserve predictable focus.

### F34. Basic platform hardening is incomplete in visible application code

`app.js` allows all CORS origins and exposes raw `err.message`; multiple controllers return database errors. Tenant pool cache has no idle eviction; each visited tenant creates a pool of up to five connections. CORS is not an authentication boundary, and actual Nginx controls were not inspected. Configure allowed origins/headers, generic external errors with request IDs, bounded connections/timeouts and application/proxy rate controls.

### F35. Test and release gates do not cover the primary SaaS risks

Backend package has no test script. Existing quotation test checks function existence. No frontend test scripts or CI workflow were found in the enumerated project files. Current passing calculator tests do not exercise tenant isolation, role scope, payments, concurrent stock, fresh provisioning, lifecycle transitions, or end-to-end EPC flow.

Add tests in that risk order. Do not execute integration/load scripts against production as an audit shortcut. Lockfiles exist, but dependency vulnerability status was not checked; a clean build does not establish dependency safety.

## UI redesign brief — requires visual validation

Source evidence supports functional/navigation/loading/accessibility concerns above. Actual spacing, clipping, contrast, mobile usability and screenshot-level design quality have not been visually certified.

Recommended interface structure:

1. One responsive application shell, with role/permission-filtered navigation and consistent breadcrumbs.
2. Navigation groups: Sales (leads/follow-ups/quotes), Delivery (survey/projects/installation), Finance (invoices/payments/loans/subsidy), Inventory (stock/procurement), Service (AMC/warranty), Administration.
3. Shared page header: title, count, one primary action, search/filter area. Shared table behavior: pagination, sorting, empty/error/loading states, clear selection and bulk-action confirmation.
4. Project workspace with a factual stage timeline, owner, next action, due date, blockers and payment summary. Keep detailed field forms in focused sections; preserve unsaved changes.
5. Dashboard metrics must show their date range and definition. Unknown data must be explicit; never fill missing operational evidence with guessed progress/pass statuses.
6. Mobile field workflow should prioritize assigned jobs, capture/upload retry, draft recovery and clear completion requirements. Validate on small screens and slow networks before adding offline features.
7. Visual review matrix: desktop/tablet/mobile × Admin/Manager/Sales/Engineer/custom role × loading/empty/error/populated/permission-denied states.

## What “proper SaaS” still needs

These are acceptance requirements to implement or verify, not assertions that every related capability is absent:

| Capability | Minimum acceptance criterion |
|---|---|
| Isolation | A tenant token never accesses another tenant; unknown domains fail closed |
| Membership/permissions | Immediate revoke, consistent custom permissions and per-record scope |
| Provisioning | Fresh tenant creation is repeatable, verified and recoverable after failure |
| Billing | Server-side plan enforcement, clear lifecycle, reconciled renewal/payment records |
| Data ownership | Export, retention/archive policy, verified backup restore, controlled deletion |
| Solar delivery | Canonical stage rules, mandatory evidence/signoffs, assignment and history |
| Finance | Immutable issued records or revisions, atomic ledger, reconciliation, refunds/credits policy |
| Inventory | Atomic stock/reservation movement, traceability, procurement receipt reconciliation |
| Service | Warranty/AMC dates, service scheduling, escalation, maintenance history |
| Reliability | Request IDs, tenant-aware logs, health/readiness, monitored jobs and retries |
| Release process | Isolated staging, migration gate, smoke tests, rollback procedure |

## Recommended implementation order

1. **Isolated testing environment:** local/test DBs, safe API configuration and synthetic data. Establish backups/restore verification before lifecycle or schema changes.
2. **Security boundary:** F01–F05, F07–F13; token-only public links and a single permission/tenant policy.
3. **Prevent inconsistent records:** payment/invoice/stock transactions, validation, numbering and stage invariants (F14–F22).
4. **Repair existing workflows:** engineer routes, truthful reports, tenant-aware notifications, provisioning/migrations and session loading (F23–F30).
5. **UI and performance:** common shell/components, route splitting and role-by-role responsive walkthrough (F31–F33).
6. **SaaS operations:** recoverable retention, monitoring, release gates and risk-based regression tests (F06, F34–F35).
7. **Feature expansion:** after the above gates, prioritize real customer needs such as service tickets, payment reminders, procurement approvals or customer portal. Avoid expanding modules whose underlying records are not reliable yet.

## Remaining verification work

- Authenticated walkthrough using isolated synthetic users for each role; screenshots and reproducible click paths.
- Compare provisioned and upgraded tenant schemas, including report-table/column contracts.
- Concurrent payment/stock/numbering tests against disposable databases.
- Test expired/locked/deleted subscriptions and renewal races with a controllable clock.
- Inspect deployment config, backups, resource usage and logs only in a separately authorized infrastructure audit; current VPS settings are unverified.
- Audit dependency advisories and resolve lint findings by rule/severity, rather than mass-disabling rules.

No fixes or production changes are included in this audit.
