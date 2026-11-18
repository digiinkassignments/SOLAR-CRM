# Finance and Application Manager portals

Two company-scoped staff roles are available in Admin → User Management → Assign Role:

- Finance: Customers (including import and payment milestones), quotations/revisions, invoices/receipts, stock and solar calculator.
- Application Manager: Subsidy applications/documents and solar loan applications/documents.

Login redirects to `/finance/dashboard` or `/applications/dashboard`. New users must change their initial password. Both portals reuse the admin layout and the existing module components; customer/public quotation/invoice URLs remain unchanged.

Backend `portalContext` resolves the current role from the tenant database, checks the token's company and applies a module allowlist. Supporting lead lookups are read-only and limited to contact/system information. Company settings lookups exclude credentials. Neither role can manage users, roles, integrations or settings, or approve quotation discounts. Existing discount limits and administrator approvals remain in force.

Role IDs are allocated by each company's database, rather than assuming IDs 5/6. Migration 013 seeds roles without replacing existing records; the admin roles dropdown also ensures roles exist for newly provisioned companies. A reserved name already used by a custom role fails instead of silently changing that role.

Validation: role policy/tenant/session tests; shared customer, invoice and survey regressions; desktop/mobile browser navigation and forms; isolated MySQL user creation, login/password change, quotation/revisions, invoice/receipt, customer/milestones, stock and subsidy/loan saves. Test welcome emails are suppressed. No real client test records or users are created.

Deployment guards compare the prior live index, affected backend files and all existing frontend JavaScript/JSX/JSON source hashes before publishing. Current code/build and tenant databases are backed up. Existing assets are retained for cached browsers. Flutter app and landing/master-admin UI are outside this release.

Live verification (18 November 2026): both active companies expose both system roles; portal HTML/JS and existing admin session/invoice endpoints passed. Deployed source checksums match local source. Landing/master-admin hashes are unchanged. Backups: /var/www/solar_crm/backups/staff-portals-20261118-070000/ (code/build and all 3 migration-target databases).
