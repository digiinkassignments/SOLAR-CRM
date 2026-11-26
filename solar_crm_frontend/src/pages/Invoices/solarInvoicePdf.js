import { jsPDF } from "jspdf";
import { getInvoiceLines, getInvoiceTotals, invoiceAmountWords } from "./invoiceDocumentHelpers.js";

const clean = (value) => String(value ?? "").replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2013\u2014]/g, "-").replace(/\u20b9/g, "Rs. ").replace(/\u00a0/g, " ");
const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (value) => { const parsed = new Date(value); return value && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "Not recorded"; };

export function createSolarInvoicePdf({ invoice: inv, logoSrc }) {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const company = inv.company || {};
  const companyName = company.company_name || "Invoice issuer";
  const reference = inv.invoice_number || "Tax Invoice";
  const totals = getInvoiceTotals(inv);
  const items = getInvoiceLines(inv);
  const L = 15, R = 195, W = R - L, BOTTOM = 276, FOOT = 285;
  let y = 15;
  pdf.setProperties({ title: `Tax Invoice ${reference}`, subject: "Solar tax invoice", author: companyName, creator: companyName });

  const font = (size = 9, bold = false, grey = 25) => { pdf.setFont("helvetica", bold ? "bold" : "normal"); pdf.setFontSize(size); pdf.setTextColor(grey, grey, grey); };
  const text = (value, x, top, options = {}) => { const { size = 9, bold = false, grey = 25, align = "left" } = options; font(size, bold, grey); pdf.text(clean(value), x, top, { baseline: "top", align }); };
  const wrap = (value, width, size = 9, bold = false) => { font(size, bold); return pdf.splitTextToSize(clean(value || ""), width); };
  const lines = (value, x, top, width, options = {}) => { const { size = 9, bold = false, grey = 25, leading = 4.3, align = "left" } = options; const output = wrap(value, width, size, bold); output.forEach((line, index) => text(line, x, top + index * leading, { size, bold, grey, align })); return top + output.length * leading; };
  const rule = (top, dark = false) => { pdf.setDrawColor(dark ? 35 : 185); pdf.setLineWidth(dark ? .45 : .18); pdf.line(L, top, R, top); };
  const newPage = () => { pdf.addPage(); y = 15; };
  const ensure = (height) => { if (y + height > BOTTOM) newPage(); };
  const heading = (label) => { ensure(15); text(label, L, y, { size: 11, bold: true }); y += 6; rule(y, true); y += 4; };
  const paragraph = (value, options = {}) => { const { size = 8.8, leading = 4.3, grey = 35 } = options; clean(value).split("\n").forEach((raw) => { if (!raw.trim()) { y += 2; return; } wrap(raw, W, size).forEach((line) => { ensure(leading); text(line, L, y, { size, grey }); y += leading; }); }); };
  const table = (columns, rows, minHeight = 10) => {
    const header = () => { pdf.setFillColor(239, 242, 246); pdf.rect(L, y, W, 8, "F"); let x = L; columns.forEach((column) => { text(column.label, x + (column.right ? column.width - 2 : 2), y + 2.2, { size: 7.8, bold: true, align: column.right ? "right" : "left" }); x += column.width; }); y += 8; rule(y, true); };
    header();
    rows.forEach((row) => {
      const cells = columns.map((column, index) => wrap(row[index] ?? "", column.width - 4, row.size || 8.2, row.bold));
      let height = Math.max(minHeight, Math.max(...cells.map((cell) => cell.length)) * 3.9 + 5);
      if (y + height > BOTTOM) { newPage(); header(); height = Math.max(minHeight, Math.max(...cells.map((cell) => cell.length)) * 3.9 + 5); }
      let x = L;
      columns.forEach((column, index) => { cells[index].forEach((line, lineIndex) => text(line, x + (column.right ? column.width - 2 : 2), y + 2.5 + lineIndex * 3.9, { size: row.size || 8.2, bold: row.bold, align: column.right ? "right" : "left" })); pdf.setDrawColor(190); pdf.setLineWidth(.15); pdf.line(x, y, x, y + height); x += column.width; });
      pdf.line(R, y, R, y + height); y += height; rule(y);
    });
  };

  const companyAddress = [company.address || company.company_address, company.city, company.state, company.pincode, company.country].filter(Boolean).join(", ");
  let companyY = y;
  if (logoSrc) { try { const image = pdf.getImageProperties(logoSrc); const scale = Math.min(42 / image.width, 18 / image.height); pdf.addImage(logoSrc, image.fileType, L, companyY, image.width * scale, image.height * scale); companyY += image.height * scale + 2; } catch { /* Company name remains visible. */ } }
  companyY = lines(companyName, L, companyY, 105, { size: 16, bold: true, leading: 6.2 }) + 1;
  [companyAddress, company.company_phone || company.phone ? `Contact: ${company.company_phone || company.phone}` : "", company.company_email || company.email, company.gst_number ? `GSTIN: ${company.gst_number}` : "", company.pan_number ? `PAN: ${company.pan_number}` : ""].filter(Boolean).forEach((value) => { companyY = lines(value, L, companyY, 106, { size: 8, grey: 75, leading: 3.9 }); });
  text("TAX INVOICE", R, 16, { size: 19, bold: true, align: "right" });
  [["Invoice No.", reference], ["Invoice Date", date(inv.invoice_date)], ["Due Date", date(inv.due_date)], ["Payment Status", totals.status]].forEach(([label, value], index) => { text(label, 127, 29 + index * 6, { size: 8, grey: 85 }); text(value, R, 29 + index * 6, { size: 8.5, bold: true, align: "right" }); });
  y = Math.max(companyY, 55) + 4; rule(y, true); y += 6;

  const customerAddress = [inv.customer_address, inv.city, inv.state, inv.pincode].filter(Boolean).join(", ");
  text("BILL TO", L, y, { size: 8, bold: true, grey: 90 }); text("PROJECT / PLACE OF SUPPLY", 111, y, { size: 8, bold: true, grey: 90 }); y += 5;
  let customerY = lines(inv.customer_name || "Customer", L, y, 84, { size: 12, bold: true, leading: 5 });
  [customerAddress, inv.customer_phone ? `Phone: ${inv.customer_phone}` : "", inv.customer_email, inv.customer_gstin ? `GSTIN: ${inv.customer_gstin}` : ""].filter(Boolean).forEach((value) => { customerY = lines(value, L, customerY + 1, 84, { size: 8.5, grey: 65, leading: 4.1 }); });
  let projectY = lines(`${inv.system_capacity_kw || "-"} kW ${inv.system_type || "Solar"} rooftop plant`, 111, y, 84, { size: 11, bold: true, leading: 4.8 });
  projectY = lines(`Place of supply: ${inv.place_of_supply || inv.state || "Not recorded"}`, 111, projectY + 2, 84, { size: 8.5, grey: 65 });
  if (inv.quotation_number) projectY = lines(`Quotation reference: ${inv.quotation_number}`, 111, projectY + 1, 84, { size: 8.5, grey: 65 });
  y = Math.max(customerY, projectY) + 7;

  heading("System Description");
  paragraph(`This invoice covers the supply and installation of a ${inv.system_capacity_kw || "recorded"} kW ${inv.system_type || "solar"} rooftop solar power system. Solar modules generate DC power, which the inverter converts to usable AC power. The final system design, protection equipment and grid interface follow the approved project specifications and applicable DISCOM requirements.`);
  y += 5; heading("Description of Material / Services");
  const itemRows = items.map((item, index) => [String(index + 1), [item.name, item.description, item.hsn ? `HSN/SAC: ${item.hsn}` : ""].filter(Boolean).join("\n"), item.quantity, item.unit || "-", item.rate === null ? "-" : money(item.rate), money(item.amount)]);
  table([{ label: "Sr.", width: 11 }, { label: "Description of material / service", width: 78 }, { label: "Qty", width: 14, right: true }, { label: "Unit", width: 17 }, { label: "Rate", width: 27, right: true }, { label: "Taxable amount", width: 33, right: true }], itemRows, 12);

  y += 5; ensure(58);
  const summaryX = 106;
  [["Items subtotal", totals.base + totals.installation], ...(totals.discount > 0 ? [["Discount", -totals.discount]] : []), ["Taxable value", totals.taxable], ...(totals.cgst ? [["CGST", totals.cgst]] : []), ...(totals.sgst ? [["SGST", totals.sgst]] : []), ...(totals.igst ? [["IGST", totals.igst]] : []), [totals.gstRate ? `GST total (${totals.gstRate}%)` : "GST total", totals.gst]].forEach(([label, value]) => { text(label, summaryX, y, { size: 8.5 }); text(money(value), R, y, { size: 8.5, bold: true, align: "right" }); y += 5.2; });
  rule(y, true); y += 4; text("Invoice total", summaryX, y, { size: 9.5, bold: true }); text(money(totals.gross), R, y, { size: 11, bold: true, align: "right" }); y += 7;
  if (totals.subsidy > 0) { text("Subsidy adjustment", summaryX, y, { size: 8.5 }); text(money(-totals.subsidy), R, y, { size: 8.5, align: "right" }); y += 5.2; }
  [["Net payable", totals.net], ["Amount received", totals.paid], ["Balance due", totals.balance]].forEach(([label, value]) => { text(label, summaryX, y, { size: 8.8, bold: label === "Balance due" }); text(money(value), R, y, { size: 8.8, bold: true, align: "right" }); y += 5.4; });
  const words = invoiceAmountWords(totals.net); if (words) { y += 2; text("Amount in words", L, y, { size: 8, bold: true, grey: 80 }); y = lines(words, L, y + 4.5, 84, { size: 8.2, leading: 4, grey: 60 }); }

  newPage(); heading("Terms & Conditions for the Project");
  const terms = inv.terms_and_conditions || `GST: All amounts and tax components are shown as recorded in this invoice.\nWarranty Coverage: Solar modules, inverter and balance-of-system equipment are covered as per the respective OEM warranty and approved project specification.\nFreight & Transportation: Freight is included only where recorded in the agreed project scope. Site access or special handling beyond the agreed scope may be charged separately.\nPayment Terms: Payments must follow the agreed invoice milestones. Please mention the invoice number in the payment reference.\nDelivery & Installation: Delivery and commissioning timelines are subject to advance payment, site readiness, material availability and statutory / DISCOM approvals.`;
  paragraph(terms, { size: 9, leading: 4.5 });
  if (inv.notes) { y += 6; heading("Additional Notes"); paragraph(inv.notes, { size: 9, leading: 4.5 }); }
  const bank = [["Account Name", company.account_name], ["Bank", company.bank_name], ["Branch", company.branch_name], ["A/C No.", company.account_number], ["IFSC Code", company.ifsc_code], ["UPI ID", company.upi_id]].filter(([, value]) => value);
  if (bank.length) { y += 7; heading("Bank Details"); bank.forEach(([label, value]) => { ensure(6); text(label, L, y, { size: 8.8, bold: true }); text(":", 48, y, { size: 8.8 }); y = lines(value, 53, y, 93, { size: 8.8, leading: 4.2 }) + 1.3; }); }
  y += 12; ensure(48); rule(y, true); y += 8; text(`For ${companyName}`, L, y, { size: 9.5, bold: true }); text("Customer acknowledgement", 112, y, { size: 9.5, bold: true }); y += 27; text("Authorized signatory", L, y, { size: 9, bold: true }); text("Signature / name / date", 112, y, { size: 9, grey: 75 });

  const count = pdf.internal.getNumberOfPages();
  for (let page = 1; page <= count; page += 1) { pdf.setPage(page); rule(FOOT - 4); text(companyName, L, FOOT, { size: 7.5, grey: 100 }); text(`${reference}  |  Page ${page} of ${count}`, R, FOOT, { size: 7.5, grey: 100, align: "right" }); }
  return pdf;
}

export async function downloadSolarInvoicePdf(options) {
  const pdf = createSolarInvoicePdf(options);
  await pdf.save(`Tax_Invoice_${String(options.invoice.invoice_number || "Invoice").replace(/[^a-zA-Z0-9_.-]/g, "_")}.pdf`, { returnPromise: true });
}
