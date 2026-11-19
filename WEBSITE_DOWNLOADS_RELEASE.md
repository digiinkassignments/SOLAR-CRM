# Website clean URLs and Downloads

Released: 19 November 2026.

## Public URLs

- `/`
- `/how-it-works`
- `/start-trial`
- `/downloads`
- `/privacy-policy`
- `/terms-and-conditions`

Source HTML files remain in `solar_landing_page`; Nginx resolves extensionless URLs. Previous `.html` URLs, `/privacy` and `/terms` redirect permanently to their canonical paths, retaining query parameters. Website navigation, canonical metadata and sitemap use the clean paths. Unknown public website paths return 404. CRM and master-admin SPA routing remains separate.

## Downloads

`solar_landing_page/downloads.html` and `downloads.css` add a responsive Android app landing page, illustrative dashboard preview with sample data, app features, workspace login steps, FAQs and support contacts. The page describes currently implemented admin mobile capabilities and identifies web-only workflows separately.

The APK button is deliberately disabled and has no URL, as requested. No debug APK or unapproved binary was published. When the final APK is supplied, replace this button with a download link, update the availability copy and add verified release metadata. Do not claim an APK is available before testing the actual download.

## Routing and deployment

`deployment/solops-website-clean-urls.conf` records the directives applied **only** to the solops.cloud/www.solops.cloud Nginx server block. Do not install it as a standalone server configuration or in the tenant wildcard block.

Backup: `/var/www/solar_crm/backups/website-downloads-20261119-133119`.

Deployment used source/checksum guards, a scoped landing/config backup, `nginx -t`, graceful reload and HTTP verification. No backend, CRM build, app code or tenant data changes were part of this release.

## Validation

- Downloads page: 1440, 1024, 768, 390 and 320 pixel viewport checks; no horizontal overflow or runtime errors.
- APK control disabled, no link, and availability message visible.
- FAQ interactions, one H1, canonical metadata and clean internal links checked.
- Eight previous `.html` paths return 301 to the intended clean destination with query parameters retained.
- Public pages and stylesheet return 200; admin and both existing tenant entrypoints return 200.

Local test artifacts and screenshots are under ignored `.tmp/downloads/`.
