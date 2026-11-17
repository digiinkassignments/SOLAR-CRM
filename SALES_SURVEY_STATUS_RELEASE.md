# Sales survey booking and lead statuses

Released locally and live on 14 November 2026 (server backup timestamp uses UTC).

## Survey booking

- Availability is checked across the tenant's scheduled and completed surveys, regardless of the salesperson who made the booking. The response exposes booked times only, without other customers' details.
- The same engineer cannot receive two surveys at the same date and exact start time. Engineer-row transaction locking serializes competing booking requests. Rescheduling and survey reassignment use the same conflict check. Cancelled surveys do not reserve slots. This is exact-time booking, not visit-duration or travel-time planning.
- Legacy AM/PM times and canonical 24-hour times compare consistently. Booking the existing survey retains its own slot; completed reports cannot be overwritten.
- Complete site address, nearby landmark and valid site GPS latitude/longitude are required for new bookings. Current-location capture is explicitly labelled for use only when physically at the site; coordinates can also be entered manually.
- Booking location is saved separately from survey execution GPS, so later measurements do not replace the original site directions. Engineer survey cards/details show landmark and coordinates; Navigate uses site GPS with an address fallback for older records.
- The scheduling form disables booked slots, preserves entered details after a failed save and marks a raced/conflicting slot unavailable after a 409 response. Successful booking now refreshes the parent Sales lead/follow-up list.

## Lead and follow-up statuses

New Lead → Contacted → Qualified → Site Survey Scheduled → Site Survey Done → Quotation Sent → Negotiation → Won → On Hold → Lost → Invalid

This is the selectable order, not a forced sequential transition rule. Scheduling records Site Survey Scheduled; actual survey completion records Site Survey Done without moving the project delivery stage. Invalid is closed for future follow-up scheduling/reminders; On Hold remains actionable.

The company pipeline configuration and Sales/Admin/Manager shared lead and follow-up interfaces use the requested list. Historical records are retained. Only unambiguous legacy labels are renamed: Site Visit Scheduled → Site Survey Scheduled; Survey Completed → Site Survey Done. Other previous labels remain in historical lead values/activity; their old configuration entries are archived. Existing company pipeline customization remains available after the one-time migration.

## Verification

- Backend suite: 59 tests passed, including a simultaneous-booking test proving one winner/one conflict, location validation, time normalization, SQL bindings, assigned access and Invalid follow-up handling.
- Browser fixture test passed: Sales scheduling form, disabled booked slots, missing-location errors, conflict recovery, saved location payload and editor widths 390/768/1440. Mobile screenshot inspected.
- Production build and changed-code undefined-name lint checks passed.
- Live tenant read-only checks passed for Admin, Manager and Sales: ordered pipeline list, availability response, field workspace/sales actions, authentication and all four site location columns. No test customer bookings or outbound messages were created in production. Actual device geolocation permissions were not tested.

## Deployment

- Backup: `/var/www/solar_crm/survey-booking-backup-20261113-183503` (backend files, frontend build and `lead-status-backup.json`).
- Additive survey columns: `site_address`, `landmark`, `site_latitude`, `site_longitude`; booking lookup index: `survey_engineer_day`.
- One-time pipeline migration recorded in `crm_schema_migrations`.
- Live index SHA-256: `5afdc2aa1ee54a693b25d1b37d27ddc26d9092042b9fa7c58bc4458aa159d6c0`.
