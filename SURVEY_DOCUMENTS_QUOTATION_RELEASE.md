# Survey, documents and quotation PDF release

Scope: automatic customer/project creation after a completed **Feasible** survey, private survey documents with normal gallery photos, and a detailed quotation PDF. Mobile app, landing page and master admin were not changed.

## Behaviour
- A Feasible submission saves the report and links/creates its customer and project in one transaction. No manager approval is required. Existing customer/project links are reused; concurrent submissions lock the lead/customer records.
- A project starts at the existing `Pre-Install Inspection` stage and retains the survey engineer assignment. Existing project stages and owners are preserved. Technical feasibility does not mark a sales deal Won.
- `Not feasible` and `Feasible with conditions` do not trigger automatic conversion. Historical reports are not bulk-converted.
- Survey documents: Aadhaar, electricity bill, site photos and bank passbook. JPG/PNG/WebP; PDF for document categories. Maximum 8 MB per file. Files save immediately, are tenant-isolated outside public uploads, and require authenticated survey access to download. No new geotagging or photo GPS requirement.
- Quotation PDF retains item pricing and GST calculation rules. Readable A4 pages include specifications, commercial/tax summary, terms, recorded bank details, acceptance and page numbers. Long quotations may span multiple pages. Mobile action buttons wrap.

## Source preservation and deployment
The VPS frontend source was stale compared with its running build. The original local source, built with `VITE_API_BASE_URL=/api`, reproduced live `index-ekSLHIR5.js` **byte for byte** (SHA256 `3913375bf650eba2f65bf3981dd3216f902b1cec2cc3539d60906283e37293c1`). Changes were built from that matching local baseline. The matching frontend source tree was synchronized to VPS to prevent a future rebuild from stale source. Only the six required backend runtime files were deployed. No environment files or mobile app files were deployed.

Published JS: `index-DDEPrpyE.js`.
Published/local index SHA256: `3ae816912e10cf39aaa69be71f93889498f929f1bb091fdac14ae6570c77df0e`.
VPS backup: `/var/www/solar_crm/backups/survey-docs-quotation-20261117-194947/` (server UTC clock name). Contains prior frontend build/source, affected backend files and compressed tenant SQL backup.

Build future production releases with `VITE_API_BASE_URL=/api`; preserve current configuration and compare the current live build before deploying.

## Verification
- 14 focused automated tests passed: conversion, retries, legacy entry point, rollback, non-feasible reports and document access/signature validation.
- Separate disposable MySQL database using current tenant table definitions: concurrent submissions created one customer/project; invalid-capacity failure rolled back; Not feasible did not convert. Verification database was removed. Client records were not used as test fixtures.
- Browser checks with mocked API: detailed 18-item quotation downloaded as 4-page PDF; final terms/payment/acceptance content visually checked. Mobile quotation and survey document screens had no horizontal overflow or runtime errors; gallery upload flow passed.
- Live tenant HTML/JS/CSS and tenant-info API returned 200; assigned engineer document list returned 200; unauthenticated document access returned 401. Live login browser had no runtime errors. Landing and master-admin HTML hashes remained unchanged.
- A real customer survey was not submitted and no client message/email was sent for testing.
