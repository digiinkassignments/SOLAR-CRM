# SolOps public website redesign and SEO release

Release date: 19 November 2026 (Asia/Calcutta).
Live site: https://solops.cloud/

## What changed

- Rebuilt the homepage around solar business operations: eight module explanations, six web roles, customer journey, web/Android distinction, registration steps, FAQs and contact options.
- Added original interactive rooftop geometry: flat-roof residence, solar cells/modules, mounting supports, parapets, windows, inverter, cable runs, site paving and planting. Rotation, reset and optional auto-rotation are available. Illustrative dashboard/app records are explicitly labelled sample data.
- Desktop loads the 3D renderer when the stage approaches the viewport. Mobile starts with a lightweight rooftop illustration and loads 3D on request. Reduced-motion, offscreen/hidden-page pausing, disposal and renderer-failure fallback are implemented.
- Self-hosted the existing Inter/Manrope brand fonts, optimized the logo derivative, pinned/localized Three.js 0.187.0 and enabled website-only gzip delivery. The original logo is retained.
- Correct contact is consistently present: +91 90241 54995 / digiink2505@gmail.com.
- Downloads still has a disabled APK button with no link, as requested. No app binary was published.
- The trial provisioning API, CRM code, tenant databases and master-admin build were not changed. Protected backend/frontend/admin entrypoint hashes remained unchanged during deployment.

## SEO implementation

| Search intent | Canonical destination | Page focus |
|---|---|---|
| Solar CRM software India / solar EPC CRM | `/` | Product overview, modules, team roles, workflow and trial |
| Solar CRM software for installers | `/solar-crm-software` | Customer, commercial, inventory, application and reporting context |
| Solar sales CRM / solar lead management | `/solar-sales-crm` | Lead context, assignments, follow-ups, survey coordination and handoff |
| Solar project management software | `/solar-project-management` | Survey, installation, commissioning, handover and after-sales |
| How to register / solar CRM free trial | `/how-it-works` | Exact registration, workspace, verification, login and setup steps |
| SolOps Android app | `/downloads` | Available mobile capabilities and current download status |

These are editorial intent targets, not claims of measured search volume or ranking positions. No paid keyword-volume data was available.

- Static, crawlable product content; one H1 per canonical page and descriptive heading hierarchy.
- Unique page titles/descriptions, clean internal links, canonical URLs and a nine-URL XML sitemap.
- `www.solops.cloud` redirects to the main HTTPS host; previous HTML paths and guide HTML aliases redirect to clean URLs. Query parameters are retained. Unknown public paths return 404.
- Open Graph/social metadata and a branded 1200 x 630 image.
- Organization, WebSite, WebPage, SoftwareApplication, FAQPage and guide breadcrumb JSON-LD where applicable. No fabricated customer logos, ratings, reviews, paid prices or approval guarantees.
- Structured data matches visible content. SoftwareApplication markup is descriptive; without genuine qualifying offers/reviews it is not a claim of eligibility for Google's software-app rich results. FAQ markup is also not a guarantee of a rich result.
- `robots.txt` allows public crawling and advertises the sitemap; `/api/` is excluded from crawl instructions. Robots instructions do not replace API authentication.
- No keyword stuffing, hidden SEO text, city doorway pages or unsupported "best/number one" claims. Google does not use the meta-keywords tag for ranking.

## Verified results

Final live mobile Lighthouse run: **Performance 100 / Accessibility 100 / Best Practices 100 / SEO 100**.

- FCP: 1.0 s
- LCP: 1.8 s
- Total blocking time: 0 ms
- Cumulative layout shift: 0
- Speed Index: 1.2 s
- No Lighthouse run warnings.

This is one controlled automated run, not a guarantee of real-user performance, full accessibility conformance or Google rankings. Mobile initial-load measurement uses the lightweight illustration; interactive 3D was exercised separately on request.

Additional checks:

- Live 3D loading/rotation/reset/optional animation and horizontal layout at 1440, 1024, 768, 390 and 320 px.
- Nine live canonical pages: HTTP 200, metadata, one H1, clean links and valid JSON-LD.
- axe WCAG 2 A/AA and 2.1 AA checks: zero detected violations on those nine mobile pages.
- Reduced-motion preference, mobile keyboard navigation and blocked-renderer fallback.
- Trial registration UI regression at desktop/tablet/mobile with mocked API responses; no real trial account or external email created by UI testing.
- Sitemap XML, internal page/fragment links, contact details and unavailable-APK guards: `node --test tests/publicWebsite.test.cjs` (5 passing tests).
- Root/index and new guide redirects, canonical host redirects, current asset delivery and three existing portal entrypoints.

Raw reports and screenshots: ignored `.tmp/site-redesign/`. Lighthouse live capture: 19 November 2026, 19:37 IST.
Backup: `/var/www/solar_crm/backups/website-redesign-20261119-140637`.
Routing reference: `deployment/solops-website-clean-urls.conf` (main public website server only).

## Owner/account actions still needed for search growth

1. Verify `solops.cloud` in Google Search Console using the owner's account/DNS access (or provide its URL-prefix verification file).
2. Submit `https://solops.cloud/sitemap.xml`; inspect the homepage and three guide URLs, then monitor indexing and crawl reports. No Search Console property or indexing request was made in this release.
3. Review actual search queries, impressions and conversions after data accumulates. Keyword positions and organic traffic have not been measured here.
4. Publish genuine customer-approved case studies and original workflow/support content as evidence becomes available. Obtain relevant links and business mentions without buying spam links.
5. Once the final Android APK is supplied, test it before adding its download URL and verified release information. Do not claim iOS or unimplemented mobile features are available.

Indexing and ranking are controlled by search engines. A clean audit is a technical foundation, not a promise that every query will rank first.

## Primary references used

- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide): helpful content, descriptive titles, crawling and the meta-keywords/keyword-stuffing guidance.
- [Google Search Essentials](https://developers.google.com/search/docs/essentials): search eligibility and core practices.
- [Google structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies): accurate content and rich-result limitations.
- [SoftwareApplication guidance](https://developers.google.com/search/docs/appearance/structured-data/software-app): eligibility is separate from simply supplying descriptive schema.
- [Three.js responsive rendering](https://threejs.org/manual/pages/responsive.html): viewport sizing and device-resolution tradeoffs.
