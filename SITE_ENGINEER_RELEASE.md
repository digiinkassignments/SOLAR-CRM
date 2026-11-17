# Site Engineer workspace release

Released locally and live on 13 November 2026.

## Included

- Assigned-only projects, surveys and delegated tasks, enforced by backend permissions.
- Dashboard: today's surveys, open tasks, blocked work, overdue schedules and pending reviews.
- Technical site surveys, design/drawings, daily installation logs, installation checklists, quality/safety readings, material records, hardware serials, utility evidence, customer handover, service/AMC visits and documents.
- Draft saving/recovery, mandatory submission checks, private authenticated evidence downloads, upload retries and duplicate protection.
- Exact task deadlines, next actions, outcomes, blockers, survey rescheduling and company-timezone in-app reminders.
- Admin/Manager Field Operations: engineer assignment, task creation, submission queue, approval/return and activity history. Existing Manager team scope remains enforced.
- Submitted daily logs feed the existing installation log; coordinator approval controls supervisor signoff.
- Engineer financial/admin API access is restricted. Technical calculator and customer contact/navigation remain available.

## Client setup

1. In Admin Users, create or activate a user with the Site Engineer role and real contact details.
2. Assign a project, survey or field task through Field Operations. An unassigned engineer sees no unrelated work.
3. Log in with that engineer account, complete a draft and submit it. Admin/Manager reviews the evidence.

There were zero active Site Engineer accounts during the live release check. No staff identity or credentials were fabricated.

## Practical limits

- Material evidence does not automatically change warehouse stock; stock movements continue through existing inventory controls.
- Utility evidence/review does not issue DISCOM permission or perform government portal submissions.
- Browser recovery preserves text drafts, not selected local files. Files must be selected again after closing the browser. This is not full offline sync.
- Private attachments: PDF, JPG, PNG or WEBP; 8 MB each, maximum 20 per record.
- Actual device GPS permissions and optional push-provider delivery require a real device/account check. Durable in-app reminders are supported.
- No customer emails or external messages were sent during validation.

## Validation and deployment

- Backend suite: 51 tests passed, including authorization, persistence, upload deduplication, transaction rollback, review/task gates, survey booking and tenant-timezone reminder checks.
- Browser tests used synthetic API fixtures: engineer routes, forms, upload failure/retry, persisted submission, coordinator review, missing assignment handling and responsive widths 390/768/1440. Mobile header and desktop screenshots inspected.
- Production build passed; existing large-bundle warning remains.
- Live tenant read-only checks passed for Admin/Manager scope, technical fields, endpoints and unauthenticated rejection. Engineer authorization was tested locally; no active live engineer existed at release time.
- Backend and frontend backup: `/var/www/solar_crm/engineer-field-backup-20261113-173956`.
- Additive `crm_field_*` tables created; previous frontend assets retained.
- Live frontend index SHA-256: `0e074cd377f221d9316d49d2c75f03c0c1cd707ae2d14047640942da26ab493d`.
- Published page hash and JavaScript bundle availability confirmed over HTTPS.
