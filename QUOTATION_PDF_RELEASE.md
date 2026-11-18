# Quotation PDF layout release

The quotation download now uses a dedicated A4 PDF renderer rather than slicing a screenshot of the public web page. It provides fixed margins, aligned numeric columns, wrapped descriptions, repeated continuation/table headers, page numbers, a two-column GST/totals summary, specifications, full terms and notes, payment details and acceptance/signature sections. English text remains selectable; Indian-script names use a canvas glyph fallback to retain their appearance.

Print opens the same generated PDF in a new tab; the PDF viewer provides printing. Amounts use `Rs.` for reliable PDF font rendering. Composite and itemised GST continue to use the quotation's recorded values; no backend calculations or records change. Subsidy remains clearly labelled as an estimate. Long item descriptions can continue across pages without being clipped. Documents may use multiple pages according to their actual content.

Scope: public quotation document actions and their new renderer only. Quotation form, invoice PDF, roles/portals, backend, databases, landing page and Flutter app are unchanged. jsPDF 4.2.1 was already installed as an html2pdf dependency and is now declared directly for reproducible builds.

Validation includes production build, generated desktop/mobile PDFs, composite and itemised taxation, 18-item/many-clause pagination, a very long description, legacy fallback rows, recorded acceptance, the print-preview path, text/bounds checks and page-by-page image inspection. Live deployment uses current source/build hash guards and a prior-code/build backup.

Deployed and verified on 18 November 2026. Live browser tests use intercepted sample API data; no real client quotations or statuses were changed. Five generated PDF cases passed A4 dimensions, text-margin bounds, complete-content and recorded-total checks; desktop/mobile text is identical. Print preview passed. Backup: /var/www/solar_crm/backups/quotation-pdf-layout-20261118-072526/. Existing VPS lock metadata was preserved; package versions were unchanged.


## Settings branding update ? 18 November 2026
- PDF reads the saved company logo directly from the public quotation company settings and waits for image decoding. PNG/JPEG/WEBP are normalized to PNG for reliable embedding; a configured logo failure stops download with an error instead of silently dropping branding.
- Saved website now appears alongside company address, contact, GSTIN and PAN. Existing bank/account/IFSC/UPI details remain in Payment details.
- Verified desktop/mobile, long tables, long descriptions, print and accepted quotation fixtures with a WEBP Settings logo. All PDF bounds and recorded amounts passed.
- Live backup: /var/www/solar_crm/backups/quotation-branding-20261118-073230. Only two quotation frontend source files changed; no backend/database changes.
