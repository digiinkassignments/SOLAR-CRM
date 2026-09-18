const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { numberToWords } = require("../utils/numberToWords");
const { db: defaultDb } = require("../config/db");

// ── Font Setup Helper for Rupee Symbol (₹) ────────────────────
const setupFonts = (doc) => {
  const regularPath = path.join(__dirname, "../fonts/NotoSans-Regular.ttf");
  const boldPath = path.join(__dirname, "../fonts/NotoSans-Bold.ttf");

  if (fs.existsSync(regularPath) && fs.existsSync(boldPath)) {
    doc.registerFont("AppFont", regularPath);
    doc.registerFont("AppFont-Bold", boldPath);
    return {
      font: "AppFont",
      fontBold: "AppFont-Bold",
      currencyPrefix: "₹",
    };
  }

  // Fallback if font files missing
  return {
    font: "Helvetica",
    fontBold: "Helvetica-Bold",
    currencyPrefix: "Rs. ",
  };
};

const formatDate = (date) => {
  if (!date) return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// ============================================================
// 1. GENERATE QUOTATION PDF
// GET /api/leads/:id/quotation-pdf
// ============================================================
const generateQuotationPDF = async (req, res) => {
  try {
    const leadId = req.params.id;
    const db = req.db || defaultDb;

    // 1. Fetch Lead
    const [leadRows] = await db.query(`SELECT * FROM leads WHERE id = ? LIMIT 1`, [leadId]);
    if (leadRows.length === 0) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }
    const lead = leadRows[0];

    // 2. Fetch Settings
    const [settingsRows] = await db.query(`SELECT * FROM settings LIMIT 1`);
    const settings = settingsRows[0] || {};

    // 3. Fetch Assigned Sales User
    let salesUser = null;
    if (lead.assigned_to) {
      const [userRows] = await db.query(
        `SELECT full_name, email, phone FROM users WHERE id = ? LIMIT 1`,
        [lead.assigned_to]
      );
      if (userRows.length > 0) salesUser = userRows[0];
    }

    // Calculations
    const totalAmount = Number(lead.quotation_amount || 0);
    const baseAmount = totalAmount > 0 ? Math.round(totalAmount / 1.18) : 0;
    const gstAmount = totalAmount > 0 ? totalAmount - baseAmount : 0;

    // Init PDF Document (A4 size = 595.28 x 841.89 points)
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const { font, fontBold, currencyPrefix } = setupFonts(doc);

    // Set Response Headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Quotation-${lead.lead_code || lead.id}.pdf`
    );
    doc.pipe(res);

    const primaryColor = "#005BAC";
    const primaryDark = "#0B3A63";
    const cyanAccent = "#38BDF8";
    const textColor = "#0F172A";
    const mutedColor = "#64748B";
    const borderColor = "#E2E8F0";

    // ── Header Section (Deep Navy #0B3A63) ──────────────────────
    doc
      .rect(0, 0, 595.28, 95)
      .fill(primaryDark);

    // Company Logo (if available)
    let companyTextX = 40;
    if (settings.company_logo) {
      const logoPath = path.join(__dirname, "../uploads/company", settings.company_logo);
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 40, 18, { fit: [60, 60] });
          companyTextX = 110;
        } catch (e) {
          console.error("Failed to render company logo:", e.message);
        }
      }
    }

    // Company Title & Tagline
    doc
      .fillColor("#FFFFFF")
      .fontSize(18)
      .font(fontBold)
      .text(settings.company_name || "SOLAR POWER SOLUTIONS", companyTextX, 24, { width: 300 });

    doc
      .fillColor(cyanAccent)
      .fontSize(8.5)
      .font(font)
      .text("Clean Energy • Rooftop & Commercial Solar EPC Solutions", companyTextX, 48, { width: 300 });

    if (settings.gst_number) {
      doc
        .fillColor("#CBD5E1")
        .fontSize(7.5)
        .font(font)
        .text(`GSTIN: ${settings.gst_number}`, companyTextX, 62);
    }

    // Right Header: Quotation Badge & Metadata
    doc
      .fillColor("#FFFFFF")
      .fontSize(16)
      .font(fontBold)
      .text("QUOTATION", 400, 20, { width: 155, align: "right" });

    doc
      .fillColor(cyanAccent)
      .fontSize(8.5)
      .font(fontBold)
      .text(`Quote Ref: QT-${lead.lead_code || lead.id}`, 400, 42, { width: 155, align: "right" });

    doc
      .fillColor("#CBD5E1")
      .fontSize(8)
      .font(font)
      .text(`Date: ${formatDate(new Date())}`, 400, 56, { width: 155, align: "right" })
      .text("Valid for: 30 Days", 400, 68, { width: 155, align: "right" });

    // Cyan Accent Divider Bar
    doc
      .rect(0, 95, 595.28, 4)
      .fill(cyanAccent);

    // ── Company & Customer Info Cards ───────────────────────────
    let currentY = 112;

    // Left Card: Issued By
    doc
      .rect(40, currentY, 250, 80)
      .fillAndStroke("#F8FAFC", borderColor);

    doc
      .fillColor(primaryDark)
      .fontSize(9)
      .font(fontBold)
      .text("ISSUED BY:", 50, currentY + 10);

    doc
      .fillColor(textColor)
      .fontSize(8.5)
      .font(fontBold)
      .text(settings.company_name || "Solar EPC Company", 50, currentY + 24);

    doc
      .fillColor(mutedColor)
      .fontSize(8)
      .font(font)
      .text(`${settings.address || "Main Road"}, ${settings.city || "Jaipur"}, ${settings.state || "Rajasthan"} - ${settings.pincode || "302001"}`, 50, currentY + 36, { width: 230 })
      .text(`Phone: ${settings.company_phone || "+91 9876543210"} | Email: ${settings.company_email || "info@solarcrm.com"}`, 50, currentY + 58, { width: 230 });

    // Right Card: Quotation For (Customer)
    doc
      .rect(305, currentY, 250, 80)
      .fillAndStroke("#F8FAFC", borderColor);

    doc
      .fillColor(primaryDark)
      .fontSize(9)
      .font(fontBold)
      .text("QUOTATION FOR (BILL TO):", 315, currentY + 10);

    doc
      .fillColor(textColor)
      .fontSize(8.5)
      .font(fontBold)
      .text(lead.customer_name || "Valued Customer", 315, currentY + 24);

    doc
      .fillColor(mutedColor)
      .fontSize(8)
      .font(font)
      .text(`${lead.address || "Site Address"}, ${lead.city || ""}, ${lead.state || ""}${lead.pincode ? ` - ${lead.pincode}` : ""}`, 315, currentY + 36, { width: 230 })
      .text(`Phone: ${lead.mobile_number || "—"} | Email: ${lead.email || "—"}`, 315, currentY + 58, { width: 230 });

    // ── Technical Specifications Table ──────────────────────────
    currentY = 202;

    doc
      .rect(40, currentY, 515, 22)
      .fill(primaryDark);

    doc
      .fillColor("#FFFFFF")
      .fontSize(8.5)
      .font(fontBold)
      .text("SOLAR PV SYSTEM TECHNICAL SPECIFICATIONS", 50, currentY + 6);

    currentY += 22;

    const specs = [
      ["Project / System Type", `${lead.solar_requirement || "Residential"} On-Grid Solar Power Plant`],
      ["Proposed Capacity", `${lead.required_kw || 3} kWp DC Solar Capacity`],
      ["Solar PV Modules", "High-Efficiency Tier-1 Mono PERC Half-Cut Solar Panels (540Wp+)"],
      ["Solar Inverter", "High-Efficiency Grid-Tied String Inverter with Remote Wi-Fi Monitoring"],
      ["Mounting Structure", "Hot-Dip Galvanized Iron (HDGI) Elevated Rooftop Structure (150 km/h wind rated)"],
      ["AC/DC Protection", "ACDB & DCDB with Surge Protection Devices (SPD) & Class-A Earthing"],
      ["Net-Metering Assistance", "Complete DISCOM Documentation, Net-Meter Clearance & Commissioning Support"],
    ];

    specs.forEach(([label, value], i) => {
      const rowBg = i % 2 === 0 ? "#FFFFFF" : "#F8FAFC";
      doc.rect(40, currentY, 515, 18).fillAndStroke(rowBg, borderColor);

      doc
        .fillColor(primaryDark)
        .fontSize(7.8)
        .font(fontBold)
        .text(label, 50, currentY + 4, { width: 170 });

      doc
        .fillColor(textColor)
        .fontSize(7.8)
        .font(font)
        .text(value, 230, currentY + 4, { width: 315 });

      currentY += 18;
    });

    // ── Commercial & Quotation Pricing Table ────────────────────
    currentY += 12;

    doc
      .rect(40, currentY, 515, 22)
      .fill(primaryColor);

    doc
      .fillColor("#FFFFFF")
      .fontSize(8.5)
      .font(fontBold)
      .text("Item Description", 50, currentY + 6)
      .text("Qty", 320, currentY + 6, { width: 40, align: "center" })
      .text("Taxable Value", 380, currentY + 6, { width: 80, align: "right" })
      .text("Total (INR)", 470, currentY + 6, { width: 75, align: "right" });

    currentY += 22;

    // Item Row
    doc.rect(40, currentY, 515, 34).fillAndStroke("#FFFFFF", borderColor);

    doc
      .fillColor(textColor)
      .fontSize(8.5)
      .font(fontBold)
      .text(`Turnkey ${lead.required_kw || 3} kW Solar PV Power Plant System`, 50, currentY + 7)
      .fillColor(mutedColor)
      .fontSize(7.5)
      .font(font)
      .text("Complete Supply, Installation, Testing, Commissioning & Net Metering Support", 50, currentY + 19)
      .fillColor(textColor)
      .fontSize(8)
      .text("1 Set", 320, currentY + 11, { width: 40, align: "center" })
      .text(`${currencyPrefix}${baseAmount.toLocaleString("en-IN")}`, 380, currentY + 11, { width: 80, align: "right" })
      .font(fontBold)
      .text(`${currencyPrefix}${totalAmount.toLocaleString("en-IN")}`, 470, currentY + 11, { width: 75, align: "right" });

    currentY += 34;

    // Calculation Summary Rows
    const totals = [
      ["Subtotal (Taxable Value)", `${currencyPrefix}${baseAmount.toLocaleString("en-IN")}`],
      ["GST (Applicable @ 18%)", `${currencyPrefix}${gstAmount.toLocaleString("en-IN")}`],
      ["Grand Total (All Inclusive)", `${currencyPrefix}${totalAmount.toLocaleString("en-IN")}`],
    ];

    totals.forEach(([lbl, val], idx) => {
      const isGrand = idx === totals.length - 1;
      const bg = isGrand ? "#E0F2FE" : "#F8FAFC";
      doc.rect(320, currentY, 235, 20).fillAndStroke(bg, borderColor);

      doc
        .fillColor(isGrand ? primaryDark : mutedColor)
        .fontSize(isGrand ? 8.5 : 7.8)
        .font(isGrand ? fontBold : font)
        .text(lbl, 330, currentY + 5, { width: 130 })
        .fillColor(isGrand ? primaryDark : textColor)
        .text(val, 460, currentY + 5, { width: 85, align: "right" });

      currentY += 20;
    });

    // Amount in Words Box
    currentY += 8;
    doc
      .rect(40, currentY, 515, 20)
      .fillAndStroke("#F8FAFC", borderColor);

    doc
      .fillColor(primaryDark)
      .fontSize(7.8)
      .font(fontBold)
      .text("Amount in Words: ", 50, currentY + 5)
      .fillColor(textColor)
      .font(font)
      .text(numberToWords(totalAmount), 135, currentY + 5, { width: 410 });

    // ── Terms & Conditions ──────────────────────────────────────
    currentY += 28;

    doc
      .fillColor(primaryDark)
      .fontSize(8.5)
      .font(fontBold)
      .text("TERMS & CONDITIONS:", 40, currentY);

    currentY += 12;

    const terms = [
      "1. Payment Terms: 50% advance with work order, 40% against material delivery at site, 10% on commissioning.",
      "2. Delivery & Installation: Completed within 15-30 working days from approval and technical site clearance.",
      "3. Warranty: 25 Years linear performance warranty on Solar Panels; 5 Years on Solar Inverter & Workmanship.",
      "4. Validity: This formal quotation is valid for 30 days from the date of issue.",
    ];

    terms.forEach((t) => {
      doc
        .fillColor(mutedColor)
        .fontSize(7.5)
        .font(font)
        .text(t, 40, currentY, { width: 515 });
      currentY += 11;
    });

    // ── Signatures Block ────────────────────────────────────────
    currentY += 18;

    // Customer Acceptance
    doc
      .rect(40, currentY, 240, 48)
      .fillAndStroke("#FFFFFF", borderColor);
    doc
      .fillColor(mutedColor)
      .fontSize(7.5)
      .font(font)
      .text("Customer Acceptance & Signature", 50, currentY + 34);

    // Authorized Signatory
    doc
      .rect(315, currentY, 240, 48)
      .fillAndStroke("#FFFFFF", borderColor);

    doc
      .fillColor(primaryDark)
      .fontSize(8)
      .font(fontBold)
      .text(`For ${settings.company_name || "Solar EPC Company"}`, 325, currentY + 7)
      .fillColor(mutedColor)
      .fontSize(7.5)
      .font(font)
      .text(`Sales Exec: ${salesUser?.full_name || "Sales Department"}`, 325, currentY + 22)
      .text(`Contact: ${salesUser?.phone || settings.company_phone || "—"}`, 325, currentY + 34);

    doc.end();
  } catch (err) {
    console.error("generateQuotationPDF error:", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Failed to generate quotation PDF." });
    }
  }
};

// ============================================================
// 2. GENERATE TAX INVOICE PDF
// GET /api/leads/:id/invoice-pdf
// ============================================================
const generateInvoicePDF = async (req, res) => {
  try {
    const leadId = req.params.id;
    const db = req.db || defaultDb;

    // 1. Fetch Lead
    const [leadRows] = await db.query(`SELECT * FROM leads WHERE id = ? LIMIT 1`, [leadId]);
    if (leadRows.length === 0) {
      return res.status(404).json({ success: false, message: "Lead not found." });
    }
    const lead = leadRows[0];

    // 2. Fetch Settings (Company details & Bank Details)
    const [settingsRows] = await db.query(`SELECT * FROM settings LIMIT 1`);
    const settings = settingsRows[0] || {};

    // Calculations (CGST 9% + SGST 9%)
    const totalAmount = Number(lead.quotation_amount || 0);
    const taxableValue = totalAmount > 0 ? Math.round(totalAmount / 1.18) : 0;
    const cgstAmount = Math.round((taxableValue * 0.09) * 100) / 100;
    const sgstAmount = Math.round((taxableValue * 0.09) * 100) / 100;
    const finalTotal = taxableValue + cgstAmount + sgstAmount;

    // Init PDF Document (A4 size = 595.28 x 841.89 points)
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const { font, fontBold, currencyPrefix } = setupFonts(doc);

    // Set Response Headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Tax-Invoice-${lead.lead_code || lead.id}.pdf`
    );
    doc.pipe(res);

    const primaryColor = "#005BAC";
    const primaryDark = "#0B3A63";
    const cyanAccent = "#38BDF8";
    const textColor = "#0F172A";
    const mutedColor = "#64748B";
    const borderColor = "#E2E8F0";

    // ── Header Section (Deep Navy #0B3A63) ──────────────────────
    doc
      .rect(0, 0, 595.28, 95)
      .fill(primaryDark);

    // Company Logo (if available)
    let companyTextX = 40;
    if (settings.company_logo) {
      const logoPath = path.join(__dirname, "../uploads/company", settings.company_logo);
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 40, 18, { fit: [60, 60] });
          companyTextX = 110;
        } catch (e) {
          console.error("Failed to render company logo:", e.message);
        }
      }
    }

    doc
      .fillColor("#FFFFFF")
      .fontSize(18)
      .font(fontBold)
      .text(settings.company_name || "SOLAR POWER EPC", companyTextX, 24, { width: 300 });

    doc
      .fillColor(cyanAccent)
      .fontSize(8.5)
      .font(font)
      .text(`GSTIN: ${settings.gst_number || "08AABCS1429B1Z8"} • PAN: ${settings.pan_number || "AABCS1429B"}`, companyTextX, 48, { width: 300 });

    doc
      .fillColor("#CBD5E1")
      .fontSize(7.5)
      .font(font)
      .text(`${settings.address || "Main Road"}, ${settings.city || "Jaipur"}, ${settings.state || "Rajasthan"}`, companyTextX, 62);

    doc
      .fillColor("#FFFFFF")
      .fontSize(16)
      .font(fontBold)
      .text("TAX INVOICE", 400, 20, { width: 155, align: "right" });

    doc
      .fillColor(cyanAccent)
      .fontSize(8.5)
      .font(fontBold)
      .text(`Invoice: INV-${lead.lead_code || lead.id}`, 400, 42, { width: 155, align: "right" });

    doc
      .fillColor("#CBD5E1")
      .fontSize(8)
      .font(font)
      .text(`Date: ${formatDate(new Date())}`, 400, 56, { width: 155, align: "right" })
      .text("Due: Upon Receipt", 400, 68, { width: 155, align: "right" });

    // Cyan Accent Divider Bar
    doc
      .rect(0, 95, 595.28, 4)
      .fill(cyanAccent);

    // ── Bill To & Ship To ───────────────────────────────────────
    let currentY = 112;

    // Left: Billed To
    doc
      .rect(40, currentY, 250, 78)
      .fillAndStroke("#F8FAFC", borderColor);

    doc
      .fillColor(primaryDark)
      .fontSize(9)
      .font(fontBold)
      .text("BILLED TO (CUSTOMER):", 50, currentY + 10);

    doc
      .fillColor(textColor)
      .fontSize(8.5)
      .font(fontBold)
      .text(lead.customer_name || "Customer", 50, currentY + 24);

    doc
      .fillColor(mutedColor)
      .fontSize(8)
      .font(font)
      .text(`Phone: ${lead.mobile_number || "—"} | Email: ${lead.email || "—"}`, 50, currentY + 36)
      .text(`${lead.address || "Address"}, ${lead.city || ""}, ${lead.state || ""}${lead.pincode ? ` - ${lead.pincode}` : ""}`, 50, currentY + 48, { width: 230 });

    // Right: Shipped To (Site Installation)
    doc
      .rect(305, currentY, 250, 78)
      .fillAndStroke("#F8FAFC", borderColor);

    doc
      .fillColor(primaryDark)
      .fontSize(9)
      .font(fontBold)
      .text("SHIPPED TO (INSTALLATION SITE):", 315, currentY + 10);

    doc
      .fillColor(textColor)
      .fontSize(8.5)
      .font(fontBold)
      .text(lead.customer_name || "Site Installation", 315, currentY + 24);

    doc
      .fillColor(mutedColor)
      .fontSize(8)
      .font(font)
      .text(`Site: ${lead.solar_requirement || "Rooftop Solar Plant"} (${lead.required_kw || 3} kW)`, 315, currentY + 36)
      .text(`${lead.address || "Site Address"}, ${lead.city || ""}, ${lead.state || ""}`, 315, currentY + 48, { width: 230 });

    // ── Invoice Items Table ─────────────────────────────────────
    currentY = 200;

    doc
      .rect(40, currentY, 515, 22)
      .fill(primaryDark);

    doc
      .fillColor("#FFFFFF")
      .fontSize(8)
      .font(fontBold)
      .text("#", 46, currentY + 6, { width: 16 })
      .text("Description of Goods & Services", 66, currentY + 6, { width: 200 })
      .text("HSN/SAC", 270, currentY + 6, { width: 50, align: "center" })
      .text("Qty", 325, currentY + 6, { width: 35, align: "center" })
      .text("Rate (INR)", 365, currentY + 6, { width: 65, align: "right" })
      .text("Taxable Val", 435, currentY + 6, { width: 55, align: "right" })
      .text("Total (INR)", 495, currentY + 6, { width: 55, align: "right" });

    currentY += 22;

    const items = [
      {
        no: "1",
        desc: `Supply of ${lead.required_kw || 3} kW Solar PV Plant System (Tier-1 Modules, Inverter & Structure)`,
        hsn: "854143",
        qty: "1 Set",
        rate: Math.round(taxableValue * 0.85),
        taxable: Math.round(taxableValue * 0.85),
        total: Math.round(taxableValue * 0.85 * 1.18),
      },
      {
        no: "2",
        desc: "Design, Installation, Testing, Commissioning & Net Metering Services",
        hsn: "995469",
        qty: "1 Job",
        rate: Math.round(taxableValue * 0.15),
        taxable: Math.round(taxableValue * 0.15),
        total: Math.round(taxableValue * 0.15 * 1.18),
      },
    ];

    items.forEach((it, idx) => {
      const rowBg = idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC";
      doc.rect(40, currentY, 515, 26).fillAndStroke(rowBg, borderColor);

      doc
        .fillColor(textColor)
        .fontSize(7.8)
        .font(font)
        .text(it.no, 46, currentY + 7, { width: 16 })
        .text(it.desc, 66, currentY + 3, { width: 200 })
        .text(it.hsn, 270, currentY + 7, { width: 50, align: "center" })
        .text(it.qty, 325, currentY + 7, { width: 35, align: "center" })
        .text(`${currencyPrefix}${it.rate.toLocaleString("en-IN")}`, 365, currentY + 7, { width: 65, align: "right" })
        .text(`${currencyPrefix}${it.taxable.toLocaleString("en-IN")}`, 435, currentY + 7, { width: 55, align: "right" })
        .font(fontBold)
        .text(`${currencyPrefix}${it.total.toLocaleString("en-IN")}`, 495, currentY + 7, { width: 55, align: "right" });

      currentY += 26;
    });

    // ── Tax Breakdown & Bank Details Table ──────────────────────
    currentY += 10;

    // Bank Details Box (Left 250px)
    doc
      .rect(40, currentY, 250, 95)
      .fillAndStroke("#F8FAFC", borderColor);

    doc
      .fillColor(primaryDark)
      .fontSize(8.5)
      .font(fontBold)
      .text("BANK & PAYMENT DETAILS:", 50, currentY + 7);

    doc
      .fillColor(mutedColor)
      .fontSize(7.5)
      .font(font)
      .text("Account Name: ", 50, currentY + 20)
      .fillColor(textColor)
      .font(fontBold)
      .text(settings.bank_account_name || settings.company_name || "Solar EPC Account", 115, currentY + 20)
      .fillColor(mutedColor)
      .font(font)
      .text("Account No: ", 50, currentY + 34)
      .fillColor(textColor)
      .font(fontBold)
      .text(settings.bank_account_number || "987654321012", 115, currentY + 34)
      .fillColor(mutedColor)
      .font(font)
      .text("IFSC Code: ", 50, currentY + 48)
      .fillColor(textColor)
      .font(fontBold)
      .text(settings.bank_ifsc || "HDFC0001234", 115, currentY + 48)
      .fillColor(mutedColor)
      .font(font)
      .text("Bank / Branch: ", 50, currentY + 62)
      .fillColor(textColor)
      .text(`${settings.bank_name || "HDFC Bank"}, ${settings.bank_branch || "Main Branch"}`, 115, currentY + 62)
      .fillColor(mutedColor)
      .font(font)
      .text("UPI VPA: ", 50, currentY + 76)
      .fillColor(primaryColor)
      .font(fontBold)
      .text(settings.upi_id || "solarpower@okhdfcbank", 115, currentY + 76);

    // Totals Box (Right 255px)
    const summaryRows = [
      ["Total Taxable Amount", `${currencyPrefix}${taxableValue.toLocaleString("en-IN")}`],
      ["Central Tax (CGST 9%)", `${currencyPrefix}${cgstAmount.toLocaleString("en-IN")}`],
      ["State Tax (SGST 9%)", `${currencyPrefix}${sgstAmount.toLocaleString("en-IN")}`],
      ["Grand Total (Invoice Value)", `${currencyPrefix}${finalTotal.toLocaleString("en-IN")}`],
    ];

    let sumY = currentY;
    summaryRows.forEach(([l, v], i) => {
      const isFinal = i === summaryRows.length - 1;
      const bg = isFinal ? "#E0F2FE" : "#FFFFFF";
      doc.rect(300, sumY, 255, 23.75).fillAndStroke(bg, borderColor);

      doc
        .fillColor(isFinal ? primaryDark : mutedColor)
        .fontSize(isFinal ? 8.5 : 7.8)
        .font(isFinal ? fontBold : font)
        .text(l, 310, sumY + 6, { width: 140 })
        .fillColor(isFinal ? primaryDark : textColor)
        .text(v, 455, sumY + 6, { width: 90, align: "right" });

      sumY += 23.75;
    });

    currentY += 105;

    // Amount in Words Box
    doc
      .rect(40, currentY, 515, 20)
      .fillAndStroke("#F8FAFC", borderColor);

    doc
      .fillColor(primaryDark)
      .fontSize(7.8)
      .font(fontBold)
      .text("Invoice Amount in Words: ", 50, currentY + 5)
      .fillColor(textColor)
      .font(font)
      .text(numberToWords(finalTotal), 160, currentY + 5, { width: 385 });

    // ── Declaration & Signature ─────────────────────────────────
    currentY += 28;

    doc
      .rect(40, currentY, 320, 56)
      .fillAndStroke("#F8FAFC", borderColor);

    doc
      .fillColor(primaryDark)
      .fontSize(8)
      .font(fontBold)
      .text("DECLARATION:", 50, currentY + 7);

    doc
      .fillColor(mutedColor)
      .fontSize(7.2)
      .font(font)
      .text("We declare that this invoice shows the actual price of the goods and services described and that all particulars are true and correct.", 50, currentY + 20, { width: 300 })
      .text("This is a computer-generated Tax Invoice.", 50, currentY + 40);

    // Authorized Signatory Box
    doc
      .rect(370, currentY, 185, 56)
      .fillAndStroke("#FFFFFF", borderColor);

    doc
      .fillColor(primaryDark)
      .fontSize(8)
      .font(fontBold)
      .text(`For ${settings.company_name || "Solar EPC Company"}`, 380, currentY + 7)
      .fillColor(mutedColor)
      .fontSize(7.5)
      .font(font)
      .text("Authorized Signatory", 380, currentY + 40);

    doc.end();
  } catch (err) {
    console.error("generateInvoicePDF error:", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Failed to generate invoice PDF." });
    }
  }
};

// ============================================================
// 3. GENERATE TAX INVOICE PDF BUFFER (For Email Attachments)
// Returns Promise<Buffer>
// ============================================================
const generateInvoicePDFBuffer = async (lead, settings = {}, salesUser = null) => {
  return new Promise((resolve, reject) => {
    try {
      // Calculations (CGST 9% + SGST 9%)
      const totalAmount = Number(lead.quotation_amount || 0);
      const taxableValue = totalAmount > 0 ? Math.round(totalAmount / 1.18) : 0;
      const cgstAmount = Math.round((taxableValue * 0.09) * 100) / 100;
      const sgstAmount = Math.round((taxableValue * 0.09) * 100) / 100;
      const finalTotal = taxableValue + cgstAmount + sgstAmount;

      const doc = new PDFDocument({ margin: 40, size: "A4", info: { Title: `Tax-Invoice-${lead.lead_code || lead.id}` } });
      const { font, fontBold, currencyPrefix } = setupFonts(doc);

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const primaryColor = "#005BAC";
      const primaryDark = "#0B3A63";
      const cyanAccent = "#38BDF8";
      const textColor = "#0F172A";
      const mutedColor = "#64748B";
      const borderColor = "#E2E8F0";

      // Header Section
      doc.rect(0, 0, 595.28, 95).fill(primaryDark);

      let companyTextX = 40;
      if (settings?.company_logo) {
        const logoPath = path.join(__dirname, "../uploads/company", settings.company_logo);
        if (fs.existsSync(logoPath)) {
          try {
            doc.image(logoPath, 40, 18, { fit: [60, 60] });
            companyTextX = 110;
          } catch (e) {
            console.error("Failed to render company logo:", e.message);
          }
        }
      }

      doc
        .fillColor("#FFFFFF")
        .fontSize(18)
        .font(fontBold)
        .text(settings?.company_name || "SOLAR POWER EPC", companyTextX, 24, { width: 300 });

      doc
        .fillColor(cyanAccent)
        .fontSize(8.5)
        .font(font)
        .text(`GSTIN: ${settings?.gst_number || "08AABCS1429B1Z8"} • PAN: ${settings?.pan_number || "AABCS1429B"}`, companyTextX, 48, { width: 300 });

      doc
        .fillColor("#CBD5E1")
        .fontSize(7.5)
        .font(font)
        .text(`${settings?.address || "Main Road"}, ${settings?.city || "Jaipur"}, ${settings?.state || "Rajasthan"}`, companyTextX, 62);

      doc
        .fillColor("#FFFFFF")
        .fontSize(16)
        .font(fontBold)
        .text("TAX INVOICE", 400, 20, { width: 155, align: "right" });

      doc
        .fillColor(cyanAccent)
        .fontSize(8.5)
        .font(fontBold)
        .text(`Invoice: INV-${lead.lead_code || lead.id}`, 400, 42, { width: 155, align: "right" });

      doc
        .fillColor("#CBD5E1")
        .fontSize(8)
        .font(font)
        .text(`Date: ${formatDate(new Date())}`, 400, 56, { width: 155, align: "right" })
        .text("Due: Upon Receipt", 400, 68, { width: 155, align: "right" });

      doc.rect(0, 95, 595.28, 4).fill(cyanAccent);

      let currentY = 112;

      // Billed To
      doc.rect(40, currentY, 250, 78).fillAndStroke("#F8FAFC", borderColor);
      doc.fillColor(primaryDark).fontSize(9).font(fontBold).text("BILLED TO (CUSTOMER):", 50, currentY + 10);
      doc.fillColor(textColor).fontSize(8.5).font(fontBold).text(lead.customer_name || "Customer", 50, currentY + 24);
      doc.fillColor(mutedColor).fontSize(8).font(font)
        .text(`Phone: ${lead.mobile_number || "—"} | Email: ${lead.email || "—"}`, 50, currentY + 36)
        .text(`${lead.address || "Address"}, ${lead.city || ""}, ${lead.state || ""}${lead.pincode ? ` - ${lead.pincode}` : ""}`, 50, currentY + 48, { width: 230 });

      // Shipped To
      doc.rect(305, currentY, 250, 78).fillAndStroke("#F8FAFC", borderColor);
      doc.fillColor(primaryDark).fontSize(9).font(fontBold).text("SHIPPED TO (INSTALLATION SITE):", 315, currentY + 10);
      doc.fillColor(textColor).fontSize(8.5).font(fontBold).text(lead.customer_name || "Site Installation", 315, currentY + 24);
      doc.fillColor(mutedColor).fontSize(8).font(font)
        .text(`Site: ${lead.solar_requirement || "Rooftop Solar Plant"} (${lead.required_kw || 3} kW)`, 315, currentY + 36)
        .text(`${lead.address || "Site Address"}, ${lead.city || ""}, ${lead.state || ""}`, 315, currentY + 48, { width: 230 });

      // Items Table Header
      currentY = 200;
      doc.rect(40, currentY, 515, 22).fill(primaryDark);
      doc.fillColor("#FFFFFF").fontSize(8).font(fontBold)
        .text("#", 46, currentY + 6, { width: 16 })
        .text("Description of Goods & Services", 66, currentY + 6, { width: 200 })
        .text("HSN/SAC", 270, currentY + 6, { width: 50, align: "center" })
        .text("Qty", 325, currentY + 6, { width: 35, align: "center" })
        .text("Rate (INR)", 365, currentY + 6, { width: 65, align: "right" })
        .text("Taxable Val", 435, currentY + 6, { width: 55, align: "right" })
        .text("Total (INR)", 495, currentY + 6, { width: 55, align: "right" });

      currentY += 22;

      const items = [
        {
          no: "1",
          desc: `Supply of ${lead.required_kw || 3} kW Solar PV Plant System (Tier-1 Modules, Inverter & Structure)`,
          hsn: "854143",
          qty: "1 Set",
          rate: Math.round(taxableValue * 0.85),
          taxable: Math.round(taxableValue * 0.85),
          total: Math.round(taxableValue * 0.85 * 1.18),
        },
        {
          no: "2",
          desc: "Design, Installation, Testing, Commissioning & Net Metering Services",
          hsn: "995469",
          qty: "1 Job",
          rate: Math.round(taxableValue * 0.15),
          taxable: Math.round(taxableValue * 0.15),
          total: Math.round(taxableValue * 0.15 * 1.18),
        },
      ];

      items.forEach((it, idx) => {
        const rowBg = idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC";
        doc.rect(40, currentY, 515, 26).fillAndStroke(rowBg, borderColor);
        doc.fillColor(textColor).fontSize(7.8).font(font)
          .text(it.no, 46, currentY + 7, { width: 16 })
          .text(it.desc, 66, currentY + 3, { width: 200 })
          .text(it.hsn, 270, currentY + 7, { width: 50, align: "center" })
          .text(it.qty, 325, currentY + 7, { width: 35, align: "center" })
          .text(`${currencyPrefix}${it.rate.toLocaleString("en-IN")}`, 365, currentY + 7, { width: 65, align: "right" })
          .text(`${currencyPrefix}${it.taxable.toLocaleString("en-IN")}`, 435, currentY + 7, { width: 55, align: "right" })
          .font(fontBold)
          .text(`${currencyPrefix}${it.total.toLocaleString("en-IN")}`, 495, currentY + 7, { width: 55, align: "right" });
        currentY += 26;
      });

      // Bank Details & Summary
      currentY += 10;
      doc.rect(40, currentY, 250, 95).fillAndStroke("#F8FAFC", borderColor);
      doc.fillColor(primaryDark).fontSize(8.5).font(fontBold).text("BANK & PAYMENT DETAILS:", 50, currentY + 7);
      doc.fillColor(mutedColor).fontSize(7.5).font(font).text("Account Name: ", 50, currentY + 20)
        .fillColor(textColor).font(fontBold).text(settings?.bank_account_name || settings?.company_name || "Solar EPC Account", 115, currentY + 20)
        .fillColor(mutedColor).font(font).text("Account No: ", 50, currentY + 34)
        .fillColor(textColor).font(fontBold).text(settings?.bank_account_number || "987654321012", 115, currentY + 34)
        .fillColor(mutedColor).font(font).text("IFSC Code: ", 50, currentY + 48)
        .fillColor(textColor).font(fontBold).text(settings?.bank_ifsc || "HDFC0001234", 115, currentY + 48)
        .fillColor(mutedColor).font(font).text("Bank / Branch: ", 50, currentY + 62)
        .fillColor(textColor).text(`${settings?.bank_name || "HDFC Bank"}, ${settings?.bank_branch || "Main Branch"}`, 115, currentY + 62)
        .fillColor(mutedColor).font(font).text("UPI VPA: ", 50, currentY + 76)
        .fillColor(primaryColor).font(fontBold).text(settings?.upi_id || "solarpower@okhdfcbank", 115, currentY + 76);

      const summaryRows = [
        ["Total Taxable Amount", `${currencyPrefix}${taxableValue.toLocaleString("en-IN")}`],
        ["Central Tax (CGST 9%)", `${currencyPrefix}${cgstAmount.toLocaleString("en-IN")}`],
        ["State Tax (SGST 9%)", `${currencyPrefix}${sgstAmount.toLocaleString("en-IN")}`],
        ["Grand Total (Invoice Value)", `${currencyPrefix}${finalTotal.toLocaleString("en-IN")}`],
      ];

      let sumY = currentY;
      summaryRows.forEach(([l, v], i) => {
        const isFinal = i === summaryRows.length - 1;
        const bg = isFinal ? "#E0F2FE" : "#FFFFFF";
        doc.rect(300, sumY, 255, 23.75).fillAndStroke(bg, borderColor);
        doc.fillColor(isFinal ? primaryDark : mutedColor).fontSize(isFinal ? 8.5 : 7.8).font(isFinal ? fontBold : font)
          .text(l, 310, sumY + 6, { width: 140 })
          .fillColor(isFinal ? primaryDark : textColor)
          .text(v, 455, sumY + 6, { width: 90, align: "right" });
        sumY += 23.75;
      });

      currentY += 105;

      // Amount in Words
      doc.rect(40, currentY, 515, 20).fillAndStroke("#F8FAFC", borderColor);
      doc.fillColor(primaryDark).fontSize(7.8).font(fontBold).text("Invoice Amount in Words: ", 50, currentY + 5)
        .fillColor(textColor).font(font).text(numberToWords(finalTotal), 160, currentY + 5, { width: 385 });

      currentY += 28;

      // Declaration & Signatures
      doc.rect(40, currentY, 320, 56).fillAndStroke("#F8FAFC", borderColor);
      doc.fillColor(primaryDark).fontSize(8).font(fontBold).text("DECLARATION:", 50, currentY + 7);
      doc.fillColor(mutedColor).fontSize(7.2).font(font)
        .text("We declare that this invoice shows the actual price of the goods and services described and that all particulars are true and correct.", 50, currentY + 20, { width: 300 })
        .text("This is a computer-generated Tax Invoice.", 50, currentY + 40);

      doc.rect(370, currentY, 185, 56).fillAndStroke("#FFFFFF", borderColor);
      doc.fillColor(primaryDark).fontSize(8).font(fontBold).text(`For ${settings?.company_name || "Solar EPC Company"}`, 380, currentY + 7)
        .fillColor(mutedColor).fontSize(7.5).font(font).text("Authorized Signatory", 380, currentY + 40);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateQuotationPDF,
  generateInvoicePDF,
  generateInvoicePDFBuffer,
};
