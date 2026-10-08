import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import VerifiedIcon from "@mui/icons-material/Verified";

import api from "../../api/axios";
import defaultLogo from "../../assets/images/logo.png";

// Helper: Convert number to Indian currency words
const numberToWordsIndian = (num) => {
  if (!num || isNaN(num)) return "Zero Rupees Only";
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const numInt = Math.floor(Math.abs(num));
  if (numInt === 0) return "Zero Rupees Only";

  const inWords = (n) => {
    let str = "";
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : " ");
    } else {
      str += a[n];
    }
    return str;
  };

  let crore = Math.floor(numInt / 10000000);
  let lakh = Math.floor((numInt % 10000000) / 100000);
  let thousand = Math.floor((numInt % 100000) / 1000);
  let hundred = Math.floor((numInt % 1000) / 100);
  let rem = numInt % 100;

  let res = "";
  if (crore > 0) res += inWords(crore) + "Crore ";
  if (lakh > 0) res += inWords(lakh) + "Lakh ";
  if (thousand > 0) res += inWords(thousand) + "Thousand ";
  if (hundred > 0) res += inWords(hundred) + "Hundred ";
  if (rem > 0) {
    if (res !== "") res += "and ";
    res += inWords(rem);
  }

  return `Indian Rupees ${res.trim()} Only`;
};

const DynamicInvoiceView = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [logoSrc, setLogoSrc] = useState(defaultLogo);

  useEffect(() => {
    fetchInvoice();
  }, [token]);

  const fetchInvoice = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/invoices/public/${token}`);
      if (res.data?.success && res.data?.data) {
        setInvoice(res.data.data);
      } else {
        setError("Invoice not found or link has expired.");
      }
    } catch (err) {
      console.error("Fetch invoice error:", err);
      setError(err.response?.data?.message || "Failed to load tax invoice.");
    } finally {
      setLoading(false);
    }
  };

  // Robust Logo Resolver
  useEffect(() => {
    if (invoice?.company) {
      const c = invoice.company;
      const rawLogo = c.company_logo || c.logo_url || c.logo;

      if (rawLogo) {
        if (
          rawLogo.startsWith("http://") ||
          rawLogo.startsWith("https://") ||
          rawLogo.startsWith("data:")
        ) {
          setLogoSrc(rawLogo);
        } else {
          let apiBase =
            (typeof import.meta !== "undefined" &&
              import.meta.env?.VITE_API_BASE_URL) ||
            "";
          if (apiBase) {
            apiBase = apiBase.replace(/\/api\/?$/, "");
          } else {
            const protocol = window.location.protocol;
            const hostname = window.location.hostname || "localhost";
            const port =
              window.location.port === "5173" || window.location.port === "3000"
                ? "5001"
                : window.location.port || "";
            apiBase = port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`;
          }
          const cleanPath = rawLogo.includes("/")
            ? rawLogo.startsWith("/")
              ? rawLogo
              : `/${rawLogo}`
            : `/uploads/company/${rawLogo}`;
          setLogoSrc(`${apiBase}${cleanPath}`);
        }
      } else {
        setLogoSrc(defaultLogo);
      }
    }
  }, [invoice]);

  // Trigger print if query parameter ?download=true is passed
  useEffect(() => {
    if (invoice && searchParams.get("download") === "true") {
      const timer = setTimeout(() => {
        window.print();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [invoice, searchParams]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", gap: 2 }}>
        <CircularProgress size={44} sx={{ color: "#0F172A" }} />
        <Typography variant="body2" sx={{ color: "#475569", fontWeight: 600 }}>
          Loading Official Tax Invoice...
        </Typography>
      </Box>
    );
  }

  if (error || !invoice) {
    return (
      <Box sx={{ maxWidth: 600, mx: "auto", mt: 8, p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: "8px" }}>
          {error || "Invoice not found."}
        </Alert>
      </Box>
    );
  }

  const company = invoice.company || {};

  // Financial Figures
  const baseAmount = parseFloat(invoice.base_amount || 0);
  const installationAmount = parseFloat(invoice.installation_amount || 0);
  const discountAmount = parseFloat(invoice.discount_amount || 0);
  const taxableAmount = parseFloat(invoice.taxable_amount || Math.max(0, baseAmount + installationAmount - discountAmount));
  const gstRate = parseFloat(invoice.gst_rate || 13.8);
  const halfGstRate = (gstRate / 2).toFixed(2);
  const cgstAmount = parseFloat(invoice.cgst_amount || Math.round((invoice.gst_amount || 0) / 2));
  const sgstAmount = parseFloat(invoice.sgst_amount || Math.round((invoice.gst_amount || 0) / 2));
  const grossTotal = parseFloat(invoice.gross_total || (taxableAmount + (invoice.gst_amount || 0)));
  const subsidyAmount = parseFloat(invoice.subsidy_amount || 0);
  const netPayable = parseFloat(invoice.net_payable_amount || Math.max(0, grossTotal - subsidyAmount));
  const amountPaid = parseFloat(invoice.amount_paid || 0);
  const balanceDue = parseFloat(invoice.balance_due || Math.max(0, netPayable - amountPaid));
  const status = invoice.payment_status || "Unpaid";

  // Address formatting
  const companyAddressParts = [
    company.address || company.company_address,
    company.city,
    company.state,
    company.pincode,
    company.country && company.country !== "India" ? company.country : null,
  ].filter(Boolean);
  const fullCompanyAddress = companyAddressParts.length > 0
    ? companyAddressParts.join(", ")
    : "Corporate Headquarters & Renewable Engineering Center";

  const customerAddressParts = [
    invoice.customer_address,
    invoice.city,
    invoice.state,
    invoice.pincode,
  ].filter(Boolean);
  const fullCustomerAddress = customerAddressParts.length > 0
    ? customerAddressParts.join(", ")
    : "Installation Site / Customer Address";

  // WhatsApp Share Handler
  const handleShareWhatsApp = () => {
    const url = window.location.href.split("?")[0];
    const text =
      `*TAX INVOICE: ${invoice.invoice_number}*\n` +
      `Customer: ${invoice.customer_name}\n` +
      `System: ${invoice.system_capacity_kw} kW (${invoice.system_type})\n` +
      `Net Invoice Amount: Rs. ${netPayable.toLocaleString("en-IN")}\n` +
      `Amount Paid: Rs. ${amountPaid.toLocaleString("en-IN")}\n` +
      `Balance Due: Rs. ${balanceDue.toLocaleString("en-IN")}\n` +
      `Status: ${status.toUpperCase()}\n\n` +
      `View & Download Official Invoice PDF:\n${url}`;

    window.open(`https://api.whatsapp.com/send?phone=91${invoice.customer_phone}&text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <Box sx={{ bgcolor: "#E2E8F0", minHeight: "100vh", py: { xs: 1.5, sm: 3 }, px: { xs: 1, sm: 2 } }}>
      {/* ── TOP ACTION BAR (Hidden on Print) ── */}
      <Box
        className="no-print"
        sx={{
          maxWidth: "210mm",
          mx: "auto",
          mb: 2,
          p: 1.5,
          bgcolor: "#0F172A",
          borderRadius: "8px",
          color: "#FFFFFF",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.15)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.2px" }}>
            Tax Invoice: {invoice.invoice_number}
          </Typography>
          <Box
            sx={{
              display: "inline-block",
              px: 1.2,
              py: 0.2,
              borderRadius: "4px",
              bgcolor: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "0.72rem",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            {status}
          </Box>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="contained"
            startIcon={<WhatsAppIcon sx={{ fontSize: 16 }} />}
            onClick={handleShareWhatsApp}
            sx={{
              bgcolor: "#25D366",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "0.76rem",
              textTransform: "none",
              borderRadius: "6px",
              height: 32,
              "&:hover": { bgcolor: "#1EBE5D" },
            }}
          >
            Share WhatsApp
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
            onClick={() => window.print()}
            sx={{
              bgcolor: "#334155",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "0.76rem",
              textTransform: "none",
              borderRadius: "6px",
              height: 32,
              "&:hover": { bgcolor: "#1E293B" },
            }}
          >
            Download / Print 1-Page PDF
          </Button>
        </Stack>
      </Box>

      {/* ── STRICT 1-PAGE A4 OFFICIAL TAX INVOICE CONTAINER ── */}
      <Box
        className="invoice-a4-page"
        sx={{
          width: "210mm",
          height: "297mm",
          maxHeight: "297mm",
          mx: "auto",
          bgcolor: "#FFFFFF",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          p: "8mm 12mm",
          boxSizing: "border-box",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          color: "#0F172A",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          overflow: "hidden",
        }}
      >
        <Box>
          {/* ============================================================ */}
          {/* 1. HEADER: LOGO, COMPANY DETAILS & TAX INVOICE META         */}
          {/* ============================================================ */}
          <Box sx={{ pb: 1.2, borderBottom: "2px solid #0F172A", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            {/* Left: Company Logo & Details A to Z */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, maxWidth: "60%" }}>
              <Box
                component="img"
                src={logoSrc || defaultLogo}
                alt={company.company_name || "Company Logo"}
                onError={() => {
                  if (logoSrc !== defaultLogo) setLogoSrc(defaultLogo);
                }}
                sx={{
                  maxHeight: 52,
                  maxWidth: 140,
                  objectFit: "contain",
                  display: "block",
                  mt: 0.3,
                }}
              />
              <Box>
                <Typography sx={{ fontWeight: 900, color: "#0F172A", fontSize: "1.1rem", lineHeight: 1.15, textTransform: "uppercase", letterSpacing: "0.2px" }}>
                  {company.company_name || "SOLAR EPC SOLUTIONS"}
                </Typography>
                <Typography sx={{ color: "#334155", fontSize: "0.70rem", mt: 0.3, lineHeight: 1.25 }}>
                  {fullCompanyAddress}
                </Typography>
                <Typography sx={{ color: "#475569", fontSize: "0.68rem", mt: 0.2, fontWeight: 500 }}>
                  {[company.company_phone || company.phone ? `Ph: ${company.company_phone || company.phone}` : "", company.company_email || company.email, company.website].filter(Boolean).join(" • ")}
                </Typography>
                <Typography sx={{ color: "#0F172A", fontWeight: 700, fontSize: "0.70rem", mt: 0.2 }}>
                  GSTIN: {company.gst_number || "To be updated"} &nbsp;|&nbsp; PAN: {company.pan_number || "To be updated"}
                </Typography>
              </Box>
            </Box>

            {/* Right: Tax Invoice Meta Block */}
            <Box sx={{ textAlign: "right", maxWidth: "38%" }}>
              <Typography sx={{ fontWeight: 900, color: "#0F172A", fontSize: "1.25rem", letterSpacing: "0.5px", lineHeight: 1 }}>
                TAX INVOICE
              </Typography>
              <Typography sx={{ color: "#64748B", fontSize: "0.62rem", mt: 0.2, fontStyle: "italic" }}>
                Original for Recipient (Sec. 31 CGST Act)
              </Typography>
              <Typography sx={{ fontWeight: 800, color: "#0F172A", fontFamily: "monospace", fontSize: "0.85rem", mt: 0.4 }}>
                {invoice.invoice_number}
              </Typography>
              <Typography sx={{ color: "#334155", fontSize: "0.70rem", mt: 0.2 }}>
                Invoice Date: <strong>{new Date(invoice.invoice_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong>
              </Typography>
              {invoice.due_date && (
                <Typography sx={{ color: "#334155", fontSize: "0.70rem", mt: 0.1 }}>
                  Due Date: <strong>{new Date(invoice.due_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong>
                </Typography>
              )}
              <Typography sx={{ color: "#64748B", fontSize: "0.68rem", mt: 0.2 }}>
                Place of Supply: <strong>{invoice.state || company.state || "State Jurisdiction"}</strong>
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Box
                  sx={{
                    display: "inline-block",
                    px: 1.2,
                    py: 0.2,
                    border: "1.5px solid #0F172A",
                    borderRadius: "4px",
                    color: "#0F172A",
                    fontWeight: 800,
                    fontSize: "0.70rem",
                    letterSpacing: "0.6px",
                    textTransform: "uppercase",
                  }}
                >
                  STATUS: {status}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* ============================================================ */}
          {/* 2. BILLED TO & PROJECT SITE SPECIFICATIONS                   */}
          {/* ============================================================ */}
          <Box sx={{ display: "flex", justifyContent: "space-between", py: 1, borderBottom: "1px solid #CBD5E1", fontSize: "0.74rem" }}>
            {/* Customer Details */}
            <Box sx={{ width: "56%" }}>
              <Typography sx={{ fontWeight: 800, color: "#64748B", textTransform: "uppercase", fontSize: "0.64rem", letterSpacing: "0.5px" }}>
                BILLED TO / CUSTOMER DETAILS
              </Typography>
              <Typography sx={{ fontWeight: 800, color: "#0F172A", fontSize: "0.86rem", mt: 0.2 }}>
                {invoice.customer_name}
              </Typography>
              <Typography sx={{ color: "#334155", fontSize: "0.70rem", mt: 0.2, lineHeight: 1.25 }}>
                {fullCustomerAddress}
              </Typography>
              <Typography sx={{ color: "#334155", fontSize: "0.70rem", mt: 0.1 }}>
                Contact: {invoice.customer_phone} {invoice.customer_email ? `• ${invoice.customer_email}` : ""}
              </Typography>
              {invoice.customer_gstin && (
                <Typography sx={{ color: "#0F172A", fontWeight: 700, fontSize: "0.70rem", mt: 0.1 }}>
                  Customer GSTIN: {invoice.customer_gstin}
                </Typography>
              )}
            </Box>

            {/* Project Technical Scope */}
            <Box sx={{ width: "42%", textAlign: "right" }}>
              <Typography sx={{ fontWeight: 800, color: "#64748B", textTransform: "uppercase", fontSize: "0.64rem", letterSpacing: "0.5px" }}>
                PROJECT / INSTALLATION SPECIFICATIONS
              </Typography>
              <Typography sx={{ fontWeight: 800, color: "#0F172A", fontSize: "0.78rem", mt: 0.2 }}>
                {invoice.system_capacity_kw} kWp {invoice.system_type} Solar PV System
              </Typography>
              <Typography sx={{ color: "#475569", fontSize: "0.68rem", mt: 0.1 }}>
                Panels: {invoice.panel_specs}
              </Typography>
              <Typography sx={{ color: "#475569", fontSize: "0.68rem", mt: 0.1 }}>
                Inverter: {invoice.inverter_specs}
              </Typography>
              <Typography sx={{ color: "#475569", fontSize: "0.68rem", mt: 0.1 }}>
                Structure: {invoice.structure_type}
              </Typography>
            </Box>
          </Box>

          {/* ============================================================ */}
          {/* 3. ITEMIZED COMMERCIAL & TAX TABLE                          */}
          {/* ============================================================ */}
          <Box sx={{ mt: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#0F172A", color: "#FFFFFF", textAlign: "left" }}>
                  <th style={{ padding: "5px 8px", width: "6%", fontWeight: 700 }}>#</th>
                  <th style={{ padding: "5px 8px", width: "52%", fontWeight: 700 }}>Item Description & Technical Scope</th>
                  <th style={{ padding: "5px 8px", width: "14%", fontWeight: 700 }}>HSN / SAC</th>
                  <th style={{ padding: "5px 8px", width: "10%", textAlign: "center", fontWeight: 700 }}>Qty</th>
                  <th style={{ padding: "5px 8px", width: "18%", textAlign: "right", fontWeight: 700 }}>Taxable Value (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                  <td style={{ padding: "5px 8px", verticalAlign: "top", color: "#64748B" }}>1</td>
                  <td style={{ padding: "5px 8px" }}>
                    <div style={{ fontWeight: 700, color: "#0F172A" }}>
                      {invoice.system_capacity_kw} kW Solar Power Generating System (SPGS)
                    </div>
                    <div style={{ color: "#64748B", fontSize: "0.66rem", marginTop: "2px" }}>
                      Supply of PV Modules, Solar Inverter, Balance of System (BoS), DC/ACDB, Earthing & Cabling
                    </div>
                  </td>
                  <td style={{ padding: "5px 8px", color: "#475569" }}>8479 / 8504</td>
                  <td style={{ padding: "5px 8px", textAlign: "center" }}>1 Set</td>
                  <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 600 }}>
                    ₹{baseAmount.toLocaleString("en-IN")}
                  </td>
                </tr>

                {installationAmount > 0 && (
                  <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                    <td style={{ padding: "5px 8px", verticalAlign: "top", color: "#64748B" }}>2</td>
                    <td style={{ padding: "5px 8px" }}>
                      <div style={{ fontWeight: 700, color: "#0F172A" }}>
                        Structural Installation, Civil Works, Testing & Commissioning
                      </div>
                      <div style={{ color: "#64748B", fontSize: "0.66rem", marginTop: "2px" }}>
                        Mounting Structure, Net-Metering Liaisoning & DISCOM Grid Synchronization
                      </div>
                    </td>
                    <td style={{ padding: "5px 8px", color: "#475569" }}>9954</td>
                    <td style={{ padding: "5px 8px", textAlign: "center" }}>1 Job</td>
                    <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 600 }}>
                      ₹{installationAmount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                )}

                {discountAmount > 0 && (
                  <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                    <td style={{ padding: "4px 8px", verticalAlign: "top", color: "#64748B" }}>3</td>
                    <td style={{ padding: "4px 8px", fontWeight: 600, color: "#334155" }}>
                      Special Project Rebate / Trade Discount
                    </td>
                    <td style={{ padding: "4px 8px", color: "#64748B" }}>—</td>
                    <td style={{ padding: "4px 8px", textAlign: "center" }}>—</td>
                    <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: 600, color: "#334155" }}>
                      -₹{discountAmount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Box>

          {/* ============================================================ */}
          {/* 4. FINANCIAL SETTLEMENT & WIRE DETAILS (CLEAN SLATE STYLE)   */}
          {/* ============================================================ */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1.2, pt: 1, borderTop: "1px solid #0F172A" }}>
            {/* Left: Official Bank Wire Credentials */}
            <Box sx={{ width: "48%", p: 1, bgcolor: "#F8FAFC", borderRadius: "4px", border: "1px solid #CBD5E1" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 0.4 }}>
                <AccountBalanceIcon sx={{ fontSize: 15, color: "#0F172A" }} />
                <Typography sx={{ fontWeight: 800, color: "#0F172A", textTransform: "uppercase", fontSize: "0.68rem", letterSpacing: "0.3px" }}>
                  OFFICIAL BANK WIRE DETAILS
                </Typography>
              </Box>

              <table style={{ width: "100%", fontSize: "0.70rem", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ color: "#64748B", padding: "1.5px 0", width: "35%" }}>Bank Name:</td>
                    <td style={{ fontWeight: 700, color: "#0F172A" }}>{company.bank_name || "HDFC Bank Ltd"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#64748B", padding: "1.5px 0" }}>Account Name:</td>
                    <td style={{ fontWeight: 700, color: "#0F172A" }}>{company.account_name || company.company_name || "Solar EPC Solutions"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#64748B", padding: "1.5px 0" }}>A/C Number:</td>
                    <td style={{ fontWeight: 700, color: "#0F172A", fontFamily: "monospace" }}>{company.account_number || "50200088991122"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#64748B", padding: "1.5px 0" }}>IFSC Code:</td>
                    <td style={{ fontWeight: 700, color: "#0F172A", fontFamily: "monospace" }}>{company.ifsc_code || "HDFC0001234"}</td>
                  </tr>
                  {company.branch_name && (
                    <tr>
                      <td style={{ color: "#64748B", padding: "1.5px 0" }}>Branch:</td>
                      <td style={{ fontWeight: 600, color: "#0F172A" }}>{company.branch_name}</td>
                    </tr>
                  )}
                  {company.upi_id && (
                    <tr>
                      <td style={{ color: "#64748B", padding: "1.5px 0" }}>UPI ID:</td>
                      <td style={{ fontWeight: 700, color: "#0F172A", fontFamily: "monospace" }}>{company.upi_id}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {invoice.notes && (
                <Box sx={{ mt: 0.6, pt: 0.4, borderTop: "1px dashed #CBD5E1" }}>
                  <Typography sx={{ color: "#475569", fontSize: "0.64rem", lineHeight: 1.25 }}>
                    <strong>Note:</strong> {invoice.notes}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Right: Tax Breakdown & Final Settlement */}
            <Box sx={{ width: "48%" }}>
              <table style={{ width: "100%", fontSize: "0.72rem", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "2px 0", color: "#475569" }}>Total Taxable Value:</td>
                    <td style={{ padding: "2px 0", textAlign: "right", fontWeight: 600, color: "#0F172A" }}>
                      ₹{taxableAmount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "2px 0", color: "#475569" }}>
                      CGST ({halfGstRate}%):
                    </td>
                    <td style={{ padding: "2px 0", textAlign: "right", fontWeight: 600, color: "#0F172A" }}>
                      ₹{cgstAmount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "2px 0", color: "#475569" }}>
                      SGST ({halfGstRate}%):
                    </td>
                    <td style={{ padding: "2px 0", textAlign: "right", fontWeight: 600, color: "#0F172A" }}>
                      ₹{sgstAmount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                  <tr style={{ borderTop: "1px solid #CBD5E1" }}>
                    <td style={{ padding: "3px 0", fontWeight: 700, color: "#0F172A" }}>Gross Invoice Value:</td>
                    <td style={{ padding: "3px 0", textAlign: "right", fontWeight: 700, color: "#0F172A" }}>
                      ₹{grossTotal.toLocaleString("en-IN")}
                    </td>
                  </tr>
                  {subsidyAmount > 0 && (
                    <tr>
                      <td style={{ padding: "2px 0", color: "#334155", fontWeight: 600 }}>
                        Less: PM Surya Ghar Subsidy:
                      </td>
                      <td style={{ padding: "2px 0", textAlign: "right", fontWeight: 600, color: "#334155" }}>
                        -₹{subsidyAmount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderTop: "2px solid #0F172A", backgroundColor: "#F1F5F9" }}>
                    <td style={{ padding: "3px 6px", fontWeight: 900, color: "#0F172A", fontSize: "0.78rem" }}>
                      Net Payable Amount:
                    </td>
                    <td style={{ padding: "3px 6px", textAlign: "right", fontWeight: 900, color: "#0F172A", fontSize: "0.82rem" }}>
                      ₹{netPayable.toLocaleString("en-IN")}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "3px 6px", fontWeight: 700, color: "#334155" }}>
                      Amount Received / Paid:
                    </td>
                    <td style={{ padding: "3px 6px", textAlign: "right", fontWeight: 700, color: "#334155" }}>
                      ₹{amountPaid.toLocaleString("en-IN")}
                    </td>
                  </tr>
                  <tr style={{ borderTop: "1.5px solid #0F172A", backgroundColor: "#F8FAFC" }}>
                    <td style={{ padding: "3px 6px", fontWeight: 900, color: "#0F172A", fontSize: "0.78rem" }}>
                      Balance Due Outstanding:
                    </td>
                    <td style={{ padding: "3px 6px", textAlign: "right", fontWeight: 900, color: "#0F172A", fontSize: "0.82rem" }}>
                      ₹{balanceDue.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tbody>
              </table>

              <Box sx={{ mt: 0.6, textAlign: "right" }}>
                <Typography sx={{ color: "#64748B", fontSize: "0.62rem", fontStyle: "italic" }}>
                  {numberToWordsIndian(netPayable)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ============================================================ */}
        {/* 5. FOOTER: TERMS, DECLARATION, SIGNATURE & REGISTERED INFO  */}
        {/* ============================================================ */}
        <Box sx={{ pt: 1, borderTop: "1px solid #CBD5E1" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            {/* Statutory Terms & Declaration */}
            <Box sx={{ width: "62%" }}>
              <Typography sx={{ fontWeight: 800, color: "#0F172A", fontSize: "0.66rem", letterSpacing: "0.3px", textTransform: "uppercase" }}>
                TERMS & STATUTORY DECLARATION:
              </Typography>
              <Typography sx={{ color: "#475569", fontSize: "0.62rem", mt: 0.2, lineHeight: 1.3 }}>
                1. Warranty: 25 Years linear performance on PV Modules, 5-8 Years on Inverter as per manufacturer norms.<br />
                2. Net metering liaisoning & DISCOM grid synchronization subject to DISCOM approval & clearance.<br />
                3. We declare that this invoice shows the actual price of the goods/services and all particulars are true and correct.
              </Typography>
            </Box>

            {/* Signature & Digital Stamp Block */}
            <Box sx={{ width: "34%", textAlign: "center" }}>
              <Box sx={{ height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    border: "1px solid #0F172A",
                    borderRadius: "4px",
                    px: 1,
                    py: 0.2,
                    color: "#0F172A",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    letterSpacing: "0.3px",
                  }}
                >
                  <VerifiedIcon sx={{ fontSize: 13, color: "#0F172A" }} />
                  DIGITALLY VERIFIED INVOICE
                </Box>
              </Box>
              <Box sx={{ borderTop: "1px solid #0F172A", pt: 0.2 }}>
                <Typography sx={{ fontWeight: 800, color: "#0F172A", fontSize: "0.70rem" }}>
                  For {company.company_name || "SOLAR EPC SYSTEM"}
                </Typography>
                <Typography sx={{ color: "#64748B", fontSize: "0.62rem" }}>
                  Authorized Signatory & Seal
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Registered Office & Bottom Corporate Details Line (A to Z) */}
          <Box sx={{ mt: 0.8, pt: 0.5, borderTop: "1px dashed #CBD5E1", textAlign: "center" }}>
            <Typography sx={{ color: "#475569", fontSize: "0.60rem", fontWeight: 500, lineHeight: 1.25 }}>
              Registered Office: {fullCompanyAddress} • Tel: {company.company_phone || company.phone || "-"} • Email: {company.company_email || company.email || "-"} • Website: {company.website || "-"}
            </Typography>
            <Typography sx={{ color: "#94A3B8", fontSize: "0.58rem", mt: 0.2 }}>
              This is a computer-generated tax invoice issued in accordance with Section 31 of the CGST Act, 2017. No physical ink signature is required.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── PRINT CSS RULES STRICTLY ENFORCING 1-PAGE A4 OUTPUT ── */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body, html {
            background-color: #FFFFFF !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .invoice-a4-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 8mm 12mm !important;
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </Box>
  );
};

export default DynamicInvoiceView;
