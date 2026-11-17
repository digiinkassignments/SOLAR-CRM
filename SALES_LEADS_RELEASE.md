# Sales lead workspace update

13 November 2026

Sales My Leads uses the same shared Leads page as Admin, with box, table and grid views. Sales filters include search, status, source, priority, requirement, capacity and creation-date range. The assignee control becomes Assigned to me. Existing API role scope remains authoritative: both counts and rows require assigned_to = authenticated salesperson.

New Sales Lead Management menu: Today's Follow-up, My Leads, Add Lead, Birthdays / Events. Follow-up and events screens use the shared pages under Sales routes and preserve their backend sales scope. The dashboard's today and overdue cards link to the relevant follow-up views. Existing /sales/followups bookmarks redirect to the new path.

Sales cannot see import/export, assignment, delete or bulk-delete controls. Sales can create leads (server assigns them to self) and edit only existing permitted operational fields; identity/assignment fields are read-only on edit. Status changes remain in the follow-up flow. Existing user roles are unchanged.

Filtering and sorting moved before backend pagination, so capacity/date/requirement filters and counts cover all matching records rather than the loaded page. Supported sort columns are whitelisted. Page size is capped at 200. Shared forms use the current MUI Grid size API.

Checks: node --test solar_crm_backend/tests/salesLeadScope.test.js validates sales scoping on list/count/followups/events queries, filter predicates, pagination and sort injection rejection. Frontend build and focused Sales wrapper/sidebar/navbar lint are checked. No production leads are created or reassigned during deployment.
