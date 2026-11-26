import { jsPDF } from 'jspdf';
import { readTaxSummary } from '../../utils/solarTax';

const money = value => `Rs. ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const clean = value => String(value ?? '').replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2013\u2014]/g, '-').replace(/[\u2022\u00b7]/g, ' - ').replace(/\u20b9/g, 'Rs. ').replace(/\u00a0/g, ' ');
const date = value => { const parsed = new Date(value); return value && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'To be confirmed'; };

// Formal, print-ready techno-commercial offer. Company header, footer and payment data are always read from Settings.
export function createSolarQuotationPdf({ quotation: q, company = {}, logoSrc, lineItems = [], totals: input = {}, isAccepted, aiInsights }) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  const L = 15, R = 195, W = R - L, BOTTOM = 276, FOOT = 285;
  const companyName = company.company_name?.trim() || 'Solar Power Solutions';
  const ref = q.quotation_number || 'Quotation';
  const capacity = q.system_capacity_kw ? `${q.system_capacity_kw} kW` : 'Solar';
  const totals = { base: Number(input.base || 0), structure: Number(input.structure || 0), discount: Number(input.discount || 0), taxable: Number(input.taxable || 0), gst: Number(input.gst || 0), gstRate: Number(input.gstRate || 0), total: Number(input.total || q.total_amount || 0), subsidy: Number(input.subsidy || q.subsidy_amount || 0), net: Number(input.net || q.net_payable_amount || 0) };
  let y = 16;
  pdf.setProperties({ title: `Techno-commercial offer ${ref}`, subject: `${capacity} rooftop solar proposal`, author: companyName, creator: companyName });

  const font = (size = 9, bold = false, grey = 24) => { pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(size); pdf.setTextColor(grey, grey, grey); };
  const text = (value, x, top, { size = 9, bold = false, grey = 24, align = 'left' } = {}) => { font(size, bold, grey); pdf.text(clean(value), x, top, { baseline: 'top', align }); };
  const wrap = (value, width, size = 9, bold = false) => { font(size, bold); return pdf.splitTextToSize(clean(value || ''), width); };
  const lines = (value, x, top, width, options = {}) => { const { size = 9, bold = false, grey = 24, leading = 4.3, align = 'left' } = options; const result = wrap(value, width, size, bold); result.forEach((line, index) => text(line, x, top + index * leading, { size, bold, grey, align })); return top + result.length * leading; };
  const rule = (top, dark = false) => { pdf.setDrawColor(dark ? 30 : 180); pdf.setLineWidth(dark ? .45 : .18); pdf.line(L, top, R, top); };
  const footer = () => { rule(FOOT - 4); text(companyName, L, FOOT, { size: 7.5, grey: 100 }); text(`${ref}  |  Page ${pdf.internal.getCurrentPageInfo().pageNumber}`, R, FOOT, { size: 7.5, grey: 100, align: 'right' }); };
  const page = () => { pdf.addPage(); y = 16; };
  const ensure = height => { if (y + height > BOTTOM) page(); };
  const heading = label => { ensure(17); text(label, L, y, { size: 12, bold: true }); y += 6.5; rule(y, true); y += 5; };
  const paragraph = (value, options = {}) => { const { size = 9, leading = 4.5, grey = 35 } = options; clean(value).split('\n').forEach(raw => { if (!raw.trim()) { y += 2; return; } wrap(raw, W, size).forEach(line => { ensure(leading); text(line, L, y, { size, grey }); y += leading; }); }); };
  const table = (columns, rows, minimum = 10) => {
    const head = () => { pdf.setFillColor(238, 242, 247); pdf.rect(L, y, W, 8, 'F'); let x = L; columns.forEach(col => { text(col.label, x + (col.right ? col.width - 2 : 2), y + 2.2, { size: 8, bold: true, align: col.right ? 'right' : 'left' }); x += col.width; }); y += 8; rule(y, true); };
    head(); rows.forEach(row => { const cells = columns.map((col, index) => wrap(row[index] ?? '', col.width - 4, row.size || 8.6, row.bold)); let height = Math.max(minimum, Math.max(...cells.map(cell => cell.length)) * (row.leading || 4.1) + 5); if (y + height > BOTTOM) { page(); head(); height = Math.max(minimum, Math.max(...cells.map(cell => cell.length)) * (row.leading || 4.1) + 5); } let x = L; columns.forEach((col, index) => { cells[index].forEach((line, lineIndex) => text(line, x + (col.right ? col.width - 2 : 2), y + 2.5 + lineIndex * (row.leading || 4.1), { size: row.size || 8.6, bold: row.bold, grey: row.grey ?? 25, align: col.right ? 'right' : 'left' })); pdf.setDrawColor(190); pdf.setLineWidth(.15); pdf.line(x, y, x, y + height); x += col.width; }); pdf.line(R, y, R, y + height); y += height; rule(y); });
  };
  const companyAddress = [company.address || company.company_address, company.city, company.state, company.pincode].filter(Boolean).join(', ');
  const customerAddress = [q.customer_address, q.city, q.state, q.pincode].filter(Boolean).join(', ');

  let companyY = y;
  if (logoSrc) { try { const image = pdf.getImageProperties(logoSrc); const scale = Math.min(37 / image.width, 16 / image.height); pdf.addImage(logoSrc, image.fileType, L, companyY, image.width * scale, image.height * scale); companyY += image.height * scale + 3; } catch { /* text identity remains available */ } }
  companyY = lines(companyName, L, companyY, 108, { size: 16, bold: true, leading: 6.2 }) + 1;
  [companyAddress, company.company_phone ? `Phone: ${company.company_phone}` : '', company.company_email, company.website, company.gst_number ? `GSTIN: ${company.gst_number}` : ''].filter(Boolean).forEach(item => { companyY = lines(item, L, companyY, 106, { size: 8.5, grey: 80, leading: 4.1 }); });
  text('CAPEX OFFER', R, 17, { size: 19, bold: true, align: 'right' }); text(`Offer No: ${ref}`, R, 28, { size: 9, bold: true, align: 'right' }); text(`Dated: ${date(q.created_at)}`, R, 34, { size: 9, grey: 75, align: 'right' }); text(`Valid until: ${date(q.valid_until)}`, R, 40, { size: 9, grey: 75, align: 'right' });
  y = Math.max(companyY, 48) + 4; rule(y, true); y += 8; text('FOR', L, y, { size: 8, bold: true, grey: 95 }); y += 5; y = lines(q.customer_name || 'Customer', L, y, W, { size: 15, bold: true, leading: 6 }); if (customerAddress) y = lines(customerAddress, L, y + 1, W, { size: 9.5, grey: 75, leading: 4.4 }); if (q.customer_phone || q.customer_email) y = lines([q.customer_phone, q.customer_email].filter(Boolean).join('  |  '), L, y + 1, W, { size: 9, grey: 75 }); y += 7;
  text('SUBJECT', L, y, { size: 9, bold: true, grey: 85 }); y += 5; y = lines(`TECHNO-COMMERCIAL OFFER FOR ${capacity.toUpperCase()} ${String(q.system_type || 'GRID-CONNECTED').toUpperCase()} ROOFTOP SOLAR PV PLANT`, L, y, W, { size: 11, bold: true, leading: 5.2 }); y += 6;
  paragraph(`Dear ${q.customer_name || 'Sir / Madam'},`, { size: 9.5 }); y += 2; paragraph(`Thank you for the opportunity to submit our techno-commercial offer for your rooftop solar project. Based on the discussion and available site information, this proposal covers the design, supply, installation, testing and commissioning of a ${capacity} ${q.system_type || 'grid-connected'} solar PV system.`, { size: 9.5, leading: 4.7 }); y += 5;
  heading('1. Scope of Work');
  ['Detailed technical review and final engineering documentation for the proposed rooftop solar system.', 'Supply, installation, testing and commissioning of the solar PV plant and balance-of-system equipment.', 'System health checks, safety checks and handover documentation before commissioning.', 'Support for applicable DISCOM, net-metering and approval documentation within the agreed scope.'].forEach((item, index) => { ensure(7); text(`${index + 1}.`, L + 2, y, { size: 9, bold: true }); y = lines(item, L + 10, y, W - 12, { size: 9, leading: 4.35 }) + 2.2; });
  if (q.notes) { y += 2; text('Project-specific note', L, y, { size: 9.5, bold: true }); y += 5; paragraph(q.notes, { size: 9, leading: 4.4 }); } y += 3; paragraph('The final design is subject to the site survey, available roof area, statutory approvals and the electrical conditions at site.', { size: 8.6, grey: 85, leading: 4.2 });

  page(); heading('2. Description of System and Specifications');
  const equipment = [
    ['2.1', 'Solar structure', `Fixed-tilt mounting structure designed for the approved layout and site conditions.\nStructure type: ${q.structure_type || 'To be confirmed'}`, 'LS', capacity, 'As per final approved design'],
    ['2.2', 'Solar modules', [q.panel_type, q.panel_count ? `${q.panel_count} solar modules` : '', 'High-efficiency solar PV modules compliant with applicable IEC / IS standards.'].filter(Boolean).join('\n'), 'Wp', q.panel_count || 'As required', q.panel_brand || 'Approved equivalent'],
    ['2.3', 'Solar PV inverter', [`${q.system_type || 'Grid interactive'} inverter`, q.inverter_capacity_kw ? `Inverter capacity: ${q.inverter_capacity_kw} kW` : '', 'Built-in protection, anti-islanding and grid synchronisation as applicable.'].filter(Boolean).join('\n'), 'Nos', '1', q.inverter_brand || 'Approved equivalent'],
    ['2.4', 'DC & AC cables', 'Solar DC cable, AC cable, conduits and connectors sized as per final design and applicable safety standards.', 'Mtr', 'LS', 'Reputed make'],
    ['2.5', 'ACDB / DCDB boxes', 'Protective devices including MCB / MCCB / SPD as required by the final system design.', 'Nos', '1 set', 'Reputed make'],
    ['2.6', 'Earthing & lightning protection', 'Earthing arrangement and lightning protection as required for safe operation.', 'Nos', 'As required', 'Reputed make'],
    ['2.7', 'Meters & signage', 'Solar / net-metering interface support, caution signage and commissioning documentation where applicable.', 'Nos', 'As required', 'As per DISCOM norms'],
  ];
  table([{ label: 'S.No.', width: 13 }, { label: 'Equipment', width: 35 }, { label: 'Brief specification', width: 73 }, { label: 'Unit', width: 12 }, { label: 'Qty', width: 16 }, { label: 'Make', width: 31 }], equipment, 16); y += 4; paragraph('Note: Equipment quantities and makes may change only where the approved design, availability or site conditions require an equivalent or better specification. The final drawings are shared after work order confirmation.', { size: 8.3, grey: 85, leading: 4 });

  // The editable bill of quantities is kept in the PDF as well. This makes every item entered
  // in the quotation form visible to the customer and avoids replacing commercial detail with defaults.
  if (lineItems.length) {
    ensure(42); heading('3. Detailed Commercial Schedule');
    table(
      [{ label: '#', width: 12 }, { label: 'Item / service', width: 84 }, { label: 'Qty', width: 17, right: true }, { label: 'Unit rate', width: 32, right: true }, { label: 'GST', width: 14, right: true }, { label: 'Amount', width: 21, right: true }],
      lineItems.map((item, index) => {
        const quantity = Number(item.quantity || 0);
        const rate = Number(item.unit_price || 0);
        const taxable = Number(item.taxable_after_discount ?? quantity * rate);
        const amount = Number(item.total_amount ?? taxable + Number(item.gst_amount || 0));
        return [String(index + 1), [item.name || 'Item / service', item.description || '', item.hsn_code ? `HSN/SAC: ${item.hsn_code}` : ''].filter(Boolean).join('\n'), quantity.toLocaleString('en-IN'), money(rate), `${Number(item.gst_rate || 0)}%`, money(amount)];
      }),
      12,
    );
    y += 4; paragraph('The detailed schedule above reflects the items and quantities saved in this quotation. Any final site-dependent change requires written approval.', { size: 8.3, grey: 85, leading: 4 });
  }

  ensure(84); heading(`${lineItems.length ? '4' : '3'}. Techno-Commercial Aspects for ${capacity} Rooftop System`); paragraph(`Project price for design, supply, installation, testing and commissioning of the ${capacity} ${q.system_type || 'solar'} rooftop plant as described in this offer.`, { size: 9.5, leading: 4.6 }); y += 4;
  const commercial = [['1.', 'Approved project cost as per the site survey and discussion with the customer', money(totals.total)], ['2.', `Grand Total${totals.gst ? ' (inclusive of applicable GST)' : ''}`, money(totals.total)], ...(totals.subsidy > 0 ? [['3.', 'Estimated customer cost after estimated eligible subsidy*', money(totals.net)]] : [])].map(row => Object.assign(row, { bold: true, size: 9 }));
  table([{ label: 'Sr. No.', width: 22 }, { label: 'Parameters', width: 105 }, { label: 'Description', width: 53, right: true }], commercial, 14); y += 5;
  const tax = readTaxSummary(q); if (q.gst_mode === 'solar_composite' && tax) paragraph(`Applicable GST follows the recorded solar composite split: goods ${money(tax.goodsValue)} with GST ${money(tax.goodsTax)}, and services ${money(tax.serviceValue)} with GST ${money(tax.serviceTax)}. Effective GST: ${tax.effectiveRate ?? totals.gstRate}%.`, { size: 8.5, grey: 70, leading: 4.2 }); else if (totals.gst) paragraph(`GST included in the quotation: ${money(totals.gst)}${totals.gstRate ? ` at the recorded rate of ${totals.gstRate}%` : ''}.`, { size: 8.5, grey: 70, leading: 4.2 }); if (totals.subsidy > 0) { y += 2; paragraph('* Subsidy is subject to customer eligibility and government approval. It is an estimate and not an installer discount or confirmed payment.', { size: 8.3, grey: 90, leading: 4 }); }
  y += 5; text('Offer validity & warranty', L, y, { size: 10, bold: true }); y += 6; [`This offer is valid until ${date(q.valid_until)}. Module and equipment pricing may be revised after the validity date if supplier pricing changes.`, 'Module performance, inverter and other equipment warranties are provided as per the respective OEM terms and product selection recorded in the final order.', 'Project completion timeline begins after receipt of the agreed advance, site readiness and required approvals.'].forEach((item, index) => { ensure(7); text(`${index + 1}.`, L + 2, y, { size: 8.8, bold: true }); y = lines(item, L + 10, y, W - 12, { size: 8.8, leading: 4.2 }) + 2; });
  if (q.terms_and_conditions) { y += 3; text('Additional commercial terms', L, y, { size: 10, bold: true }); y += 6; paragraph(q.terms_and_conditions, { size: 8.8, leading: 4.25 }); }
  let schedule = []; try { const parsed = typeof q.payment_schedule_json === 'string' ? JSON.parse(q.payment_schedule_json) : q.payment_schedule_json; schedule = Array.isArray(parsed) ? parsed : []; } catch { schedule = []; } y += 4; ensure(20); text('Payment Terms', L, y, { size: 10, bold: true }); y += 6;
  if (schedule.length) table([{ label: '#', width: 13 }, { label: 'Milestone', width: 82 }, { label: 'Due date', width: 34 }, { label: 'Amount / share', width: 51, right: true }], schedule.map((item, index) => [String(index + 1), item.title || 'Payment milestone', date(item.due_date), `${Number(item.percent || 0)}%  |  ${money((totals.total * Number(item.percent || 0)) / 100)}`]), 10); else ['20% advance with signed purchase order.', '50% before panel installation at site.', '25% before inverter installation.', '5% after completion / net-metering.'].forEach((item, index) => { text(`${index + 1}.`, L + 2, y, { size: 8.8, bold: true }); y = lines(item, L + 10, y, W - 12, { size: 8.8, leading: 4.2 }) + 2; });
  const bank = [['Account name', company.account_name], ['Bank', company.bank_name], ['Account number', company.account_number], ['IFSC code', company.ifsc_code], ['Branch', company.branch_name], ['UPI ID', company.upi_id]].filter(([, value]) => value); if (bank.length) { y += 4; ensure(18); text('Account Details', L, y, { size: 10, bold: true }); y += 6; table([{ label: 'Account details', width: 65 }, { label: 'Particulars', width: 115 }], bank.map(([key, value], index) => [`${index + 1}. ${key}`, value]), 9); }

  ensure(92); heading(`${lineItems.length ? '5' : '4'}. Contact Details and Proposal Acceptance`); paragraph(`For any clarification on this proposal, please contact ${companyName}${company.company_phone ? ` on ${company.company_phone}` : ''}${company.company_email ? ` or write to ${company.company_email}` : ''}.`, { size: 9.5, leading: 4.7 });
  const financial = aiInsights?.financial_highlights; if (financial) { const estimates = [['Indicative annual generation', financial.annual_units_generated], ['Indicative annual savings', financial.annual_savings], ['Estimated payback period', financial.estimated_payback_years], ['Estimated 25-year savings', financial.lifetime_savings_25yr]].filter(([, value]) => value !== null && value !== undefined && value !== ''); if (estimates.length) { y += 7; text('Indicative performance estimates', L, y, { size: 10, bold: true }); y += 6; table([{ label: 'Parameter', width: 85 }, { label: 'Estimate', width: 95 }], estimates, 10); y += 2; paragraph('These are indicative estimates based on the recorded system details and are subject to final site conditions, irradiation, shading, electricity usage and approvals.', { size: 8.2, grey: 85, leading: 4 }); } }
  y += 15; ensure(56); rule(y, true); y += 10; text(`FOR ${companyName.toUpperCase()}`, L, y, { size: 9, bold: true, grey: 75 }); text('PROPOSAL ACCEPTED BY CUSTOMER', 112, y, { size: 9, bold: true, grey: 75 }); y += 28; text('Authorized signatory', L, y, { size: 9.5, bold: true }); if (isAccepted) { text(q.customer_signature_name || q.customer_name || 'Customer', 112, y - 17, { size: 11, bold: true }); text(`Accepted on ${date(q.accepted_at)}`, 112, y - 10, { size: 8.8, grey: 75 }); text('Customer acceptance recorded digitally', 112, y, { size: 9.5, bold: true }); } else text('Signature, name and date', 112, y, { size: 9.5, grey: 75 });
  const pageCount = pdf.internal.getNumberOfPages(); for (let index = 1; index <= pageCount; index += 1) { pdf.setPage(index); rule(FOOT - 4); text(companyName, L, FOOT, { size: 7.5, grey: 100 }); text(`${ref}  |  Page ${index} of ${pageCount}`, R, FOOT, { size: 7.5, grey: 100, align: 'right' }); }
  return pdf;
}

export async function downloadSolarQuotationPdf(options) {
  const pdf = createSolarQuotationPdf(options);
  await pdf.save(`Solar_Quotation_${String(options.quotation.quotation_number || 'Proposal').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`, { returnPromise: true });
}
