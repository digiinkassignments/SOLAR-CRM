# Solar GST modes

Implemented 13 November 2026. Applies to new documents or explicit edits; existing saved totals are not migrated.

- Complete solar system (70:30, automatic): only select for an eligible complete solar supply with installation under one contract. Discount is applied before tax. Goods value is 70% of taxable contract value at 5%; services are the remaining 30% at 18%. Values and component tax amounts are rounded to paise; total is their sum (nominal effective rate 8.9%). Per-line tax inputs do not determine composite tax. Item rows exclude tax in this mode; the document tax summary gives the statutory split.
- Itemised: GST is calculated on each discounted line using its entered rate. Installation-only service should use 18%; the automatic complete-system mode is not intended for it. Legacy aggregate quotations retain their recorded rate until edited.
- Catalog tax rates remain stored when switching modes. Editing a quotation permits itemised GST rate adjustments. Mode and computed tax summary persist in quotation and invoice records, including quotation duplication and invoice conversion.
- Quotation preview and backend calculations use matching arithmetic. Server recalculates tax; submitted tax totals are not trusted. CGST and SGST amounts are rounded so they sum to total GST. Existing intrastate/interstate handling is not redesigned by this release.

Example: taxable contract INR 100,000 -> goods INR 70,000 / GST INR 3,500; services INR 30,000 / GST INR 5,400; total GST INR 8,900 and gross INR 108,900. A pre-tax INR 10,000 discount makes tax INR 8,010. Subsidy is a separate commercial adjustment, not the taxable base discount.

Primary sources checked:
- MNRE/PIB, 17 September 2025: renewable energy devices reduced from 12% to 5%, effective 22 September 2025: https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=2167486&lang=2&reg=48
- Ministry of Finance/PIB, 31st GST Council clarification of 70% goods and 30% taxable services: https://www.pib.gov.in/PressReleasePage.aspx?PRID=1557065&lang=2&reg=48

Validation: node --test solar_crm_backend/tests/solarTax.test.js; focused lint of new tax calculator/summary and quote/document components; Vite build. Contract eligibility/classification remains the issuer's decision; this mode is not applied silently to all invoices.
