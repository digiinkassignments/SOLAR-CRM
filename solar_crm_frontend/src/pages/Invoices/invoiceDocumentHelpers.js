export const invoiceMoney = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(Number(value) || 0);

export const invoiceDate = (value) => {
  if (!value) return "Not recorded";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Not recorded" : parsed.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const numeric = (value, fallback = 0) => value == null || value === "" || !Number.isFinite(Number(value)) ? fallback : Number(value);

// Stored amounts are authoritative, including an explicitly recorded zero.
export const getInvoiceTotals = (invoice) => {
  const base = numeric(invoice.base_amount);
  const installation = numeric(invoice.installation_amount);
  const discount = numeric(invoice.discount_amount);
  const taxable = numeric(invoice.taxable_amount, Math.max(0, base + installation - discount));
  const gstRate = numeric(invoice.gst_rate);
  const gst = numeric(invoice.gst_amount, Math.round(taxable * gstRate) / 100);
  const gross = numeric(invoice.gross_total, taxable + gst);
  const subsidy = numeric(invoice.subsidy_amount);
  const net = numeric(invoice.net_payable_amount, Math.max(0, gross - subsidy));
  const paid = numeric(invoice.amount_paid);
  const balance = numeric(invoice.balance_due, Math.max(0, net - paid));
  return {
    base, installation, discount, taxable, gstRate, gst, gross, subsidy, net, paid, balance,
    cgst: numeric(invoice.cgst_amount), sgst: numeric(invoice.sgst_amount), igst: numeric(invoice.igst_amount),
    status: invoice.payment_status || (paid > 0 ? (balance > 0 ? "Partially Paid" : "Paid") : "Unpaid"),
  };
};

export const getInvoiceLines = (invoice) => {
  let parsed = invoice.line_items;
  try { if (typeof parsed === "string") parsed = JSON.parse(parsed); } catch { parsed = null; }
  if (Array.isArray(parsed) && parsed.length) {
    return parsed.map((item, index) => {
      const quantity = numeric(item.quantity ?? item.qty, 1);
      const rateValue = item.unit_price ?? item.rate;
      const lineAmount = item.taxable_amount ?? item.taxable_after_discount ?? item.amount
        ?? (item.total_amount == null ? undefined : numeric(item.total_amount) - numeric(item.gst_amount));
      return {
        name: item.name || item.item_name || `Item ${index + 1}`,
        description: item.description || "", hsn: item.hsn_code || item.hsn_sac || "",
        quantity, unit: item.unit || "",
        rate: rateValue == null || rateValue === "" ? null : numeric(rateValue),
        amount: numeric(lineAmount, quantity * numeric(rateValue)),
      };
    });
  }
  return [
    { name: "Solar power system supply", description: [invoice.system_capacity_kw ? `${invoice.system_capacity_kw} kW` : "", invoice.system_type, invoice.panel_specs, invoice.inverter_specs].filter(Boolean).join(" · "), hsn: invoice.hsn_code || "", quantity: 1, unit: "System", rate: numeric(invoice.base_amount), amount: numeric(invoice.base_amount) },
    ...(numeric(invoice.installation_amount) > 0 ? [{ name: "Installation & mounting structure", description: invoice.structure_type || "", hsn: invoice.installation_hsn_code || "", quantity: 1, unit: "Service", rate: numeric(invoice.installation_amount), amount: numeric(invoice.installation_amount) }] : []),
  ];
};

const smallWords = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tensWords = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const integerWords = (value) => {
  if (value < 20) return smallWords[value];
  if (value < 100) return `${tensWords[Math.floor(value / 10)]}${value % 10 ? ` ${smallWords[value % 10]}` : ""}`;
  for (const [scale, name] of [[10000000, "Crore"], [100000, "Lakh"], [1000, "Thousand"], [100, "Hundred"]]) {
    if (value >= scale) return `${integerWords(Math.floor(value / scale))} ${name}${value % scale ? ` ${integerWords(value % scale)}` : ""}`;
  }
  return "";
};
export const invoiceAmountWords = (value) => {
  const minorUnits = Math.round(Math.abs(numeric(value)) * 100);
  if (!Number.isSafeInteger(minorUnits)) return "";
  const rupees = Math.floor(minorUnits / 100);
  const paise = minorUnits % 100;
  return `Indian Rupees ${integerWords(rupees)}${paise ? ` and ${integerWords(paise)} Paise` : ""} Only`;
};

export const resolveInvoiceLogo = (company) => {
  const logo = company?.company_logo || company?.logo_url || company?.logo;
  if (!logo || typeof logo !== "string") return null;
  if (logo.startsWith("data:")) return logo;
  if (logo.includes("/uploads/")) return logo.substring(logo.indexOf("/uploads/"));
  if (/^https?:\/\//i.test(logo)) return logo;
  return logo.startsWith("/") ? logo : logo.includes("/") ? `/${logo}` : `/uploads/company/${logo}`;
};
