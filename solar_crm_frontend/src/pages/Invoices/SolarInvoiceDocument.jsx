import SolarTaxSummary from "../../components/SolarTaxSummary";
import { readTaxSummary } from "../../utils/solarTax";
import { Box, Paper, Typography, Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";
import { getInvoiceLines, getInvoiceTotals, invoiceMoney as money, invoiceDate as date, invoiceAmountWords } from "./invoiceDocumentHelpers";

const body = { fontSize: "12px", lineHeight: 1.45, color: "#333333", overflowWrap: "anywhere" };
const caption = { fontSize: "10px", color: "#666666", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, mb: 0.75 };
const sectionTitle = { fontSize: "12px", fontWeight: 800, color: "#111111", mb: 1, pb: 0.75, borderBottom: "1px solid #DDDDDD" };
const tableStyle = {
  width: "100%", tableLayout: "fixed",
  "& th": { bgcolor: "#F3F3F3", color: "#222222", fontWeight: 700, fontSize: "10px", borderTop: "1px solid #CCCCCC" },
  "& th, & td": { p: { xs: "7px 4px", sm: "6px 7px" }, verticalAlign: "top", borderBottom: "1px solid #DDDDDD", overflowWrap: "anywhere" },
  "& td": { fontSize: "11px", lineHeight: 1.4 }, "& tr": { breakInside: "avoid" },
};

export default function SolarInvoiceDocument({ invoice: inv, logoSrc, onLogoError }) {
  const company = inv.company || {};
  const companyName = company.company_name || "Invoice issuer";
  const companyAddress = [company.address || company.company_address, company.city, company.state, company.pincode, company.country].filter(Boolean).join(", ");
  const customerAddress = [inv.customer_address, inv.city, inv.state, inv.pincode].filter(Boolean).join(", ");
  const totals = getInvoiceTotals(inv);
  const lines = getInvoiceLines(inv);
  const bankFields = [["Bank", company.bank_name], ["Account name", company.account_name], ["Account number", company.account_number], ["IFSC", company.ifsc_code], ["Branch", company.branch_name], ["UPI ID", company.upi_id]].filter(([, value]) => value);
  const hasBankInstructions = Boolean(company.account_number || company.upi_id || company.bank_name || company.ifsc_code);
  const taxParts = [["CGST", totals.cgst], ["SGST", totals.sgst], ["IGST", totals.igst]].filter(([, value]) => value !== 0);
  const invoiceWords = invoiceAmountWords(totals.net);

  return (
    <Paper id="printable-tax-invoice" className="invoice-a4-page" elevation={0} sx={{ width: "100%", maxWidth: 794, mx: "auto", p: { xs: 2.25, sm: 3 }, bgcolor: "#FFFFFF", border: "1px solid #DDDDDD", borderRadius: 0, boxSizing: "border-box", color: "#111111", fontFamily: "Inter, Arial, sans-serif" }}>
      <Box className="pdf-keep-together" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) 245px" }, gap: 2, pb: 2, borderBottom: "2px solid #111111" }}>
        <Box sx={{ minWidth: 0 }}>
          {logoSrc && <Box component="img" src={logoSrc} alt={companyName} onError={onLogoError} sx={{ maxWidth: 150, maxHeight: 48, objectFit: "contain", mb: 1.5 }} />}
          <Typography sx={{ fontSize: "19px", fontWeight: 800, lineHeight: 1.35, mb: 0.75, overflowWrap: "anywhere" }}>{companyName}</Typography>
          {companyAddress && <Typography sx={body}>{companyAddress}</Typography>}
          {(company.company_phone || company.phone) && <Typography sx={body}>Tel: {company.company_phone || company.phone}</Typography>}
          {(company.company_email || company.email) && <Typography sx={body}>{company.company_email || company.email}</Typography>}
          {company.gst_number && <Typography sx={{ ...body, mt: 0.75 }}><strong>GSTIN:</strong> {company.gst_number}</Typography>}
          {company.pan_number && <Typography sx={body}><strong>PAN:</strong> {company.pan_number}</Typography>}
        </Box>
        <Box sx={{ textAlign: { xs: "left", sm: "right" }, minWidth: 0 }}>
          <Typography component="h1" sx={{ fontSize: "28px", fontWeight: 800, letterSpacing: "0.05em", lineHeight: 1.2, mb: 1 }}>TAX INVOICE</Typography>
          {[["Invoice no.", inv.invoice_number], ["Invoice date", date(inv.invoice_date)], ["Due date", date(inv.due_date)], ...(inv.quotation_number ? [["Quotation ref.", inv.quotation_number]] : []), ["Payment status", totals.status]].map(([label, value]) => <Box key={label} sx={{ display: "flex", justifyContent: { xs: "flex-start", sm: "space-between" }, gap: 2, py: 0.35 }}><Typography sx={{ ...body, color: "#666666", flexShrink: 0 }}>{label}</Typography><Typography sx={{ ...body, fontWeight: 700, textAlign: "right" }}>{value}</Typography></Box>)}
        </Box>
      </Box>

      <Box className="pdf-keep-together" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2, py: 2, borderBottom: "1px solid #DDDDDD", mb: 2 }}>
        <Box><Typography sx={caption}>Bill to</Typography><Typography sx={{ fontSize: "15px", fontWeight: 800, mb: 0.5 }}>{inv.customer_name}</Typography>{customerAddress && <Typography sx={body}>{customerAddress}</Typography>}{inv.customer_phone && <Typography sx={body}>Phone: {inv.customer_phone}</Typography>}{inv.customer_email && <Typography sx={body}>{inv.customer_email}</Typography>}{inv.customer_gstin && <Typography sx={{ ...body, mt: 0.5 }}><strong>GSTIN:</strong> {inv.customer_gstin}</Typography>}</Box>
        <Box><Typography sx={caption}>Project / place of supply</Typography><Typography sx={{ fontSize: "15px", fontWeight: 800, mb: 0.5 }}>Solar energy installation</Typography><Typography sx={body}><strong>Capacity:</strong> {inv.system_capacity_kw ? `${inv.system_capacity_kw} kW` : "Not recorded"}</Typography><Typography sx={body}><strong>System:</strong> {inv.system_type || "Not recorded"}</Typography><Typography sx={body}><strong>Place of supply:</strong> {inv.place_of_supply || inv.state || "Not recorded"}</Typography></Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography component="h2" sx={sectionTitle}>Invoice particulars</Typography>
        <Table size="small" aria-label="Invoice particulars" sx={tableStyle}>
          <TableHead><TableRow><TableCell sx={{ width: "5%" }}>#</TableCell><TableCell sx={{ width: "34%" }}>Description / HSN</TableCell><TableCell align="right" sx={{ width: "12%" }}>Qty</TableCell><TableCell align="right" sx={{ width: "22%" }}>Rate</TableCell><TableCell align="right" sx={{ width: "27%" }}>Amount</TableCell></TableRow></TableHead>
          <TableBody>{lines.map((line, index) => <TableRow key={`${line.name}-${index}`}><TableCell>{index + 1}</TableCell><TableCell><Typography sx={{ fontSize: "11px", fontWeight: 700, lineHeight: 1.4 }}>{line.name}</Typography><Typography sx={{ fontSize: "10px", color: "#666666", mt: 0.5 }}>HSN/SAC: {line.hsn || "Not recorded"}</Typography></TableCell><TableCell align="right">{line.quantity}<br /><Box component="span" sx={{ fontSize: "10px", color: "#666666" }}>{line.unit}</Box></TableCell><TableCell align="right">{line.rate === null ? "—" : money(line.rate)}</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>{money(line.amount)}</TableCell></TableRow>)}</TableBody>
        </Table>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) minmax(0, 1fr)" }, gap: 2, mb: 2 }}>
        <Box>
          <Typography component="h2" sx={sectionTitle}>Payment instructions</Typography>
          {hasBankInstructions ? <Box className="pdf-keep-together">{bankFields.map(([label, value]) => <Box key={label} sx={{ display: "grid", gridTemplateColumns: "100px minmax(0, 1fr)", gap: 1, mb: 0.5 }}><Typography sx={{ ...body, color: "#666666" }}>{label}</Typography><Typography sx={{ ...body, fontWeight: 600 }}>{value}</Typography></Box>)}</Box> : <Typography sx={body}>Payment instructions have not been recorded. Contact the invoice issuer before arranging payment.</Typography>}
          {invoiceWords && <Box sx={{ mt: 2.5 }}><Typography sx={caption}>Net payable in words</Typography><Typography sx={{ ...body, fontSize: "11px" }}>{invoiceWords}</Typography></Box>}
        </Box>
        <Box className="pdf-keep-together" sx={{ minWidth: 0 }}>
          <Typography component="h2" sx={sectionTitle}>Amount summary</Typography>
          <SolarTaxSummary tax={readTaxSummary(inv)} />
          {[["Items subtotal", totals.base + totals.installation], ...(totals.discount > 0 ? [["Discount", -totals.discount]] : []), ["Taxable value", totals.taxable], ...taxParts, [inv.gst_rate != null && inv.gst_rate !== "" ? `GST total (${totals.gstRate}%)` : "GST total", totals.gst]].map(([label, value]) => <Box key={label} sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 0.5 }}><Typography sx={body}>{label}</Typography><Typography sx={{ ...body, fontWeight: 600, textAlign: "right" }}>{money(value)}</Typography></Box>)}
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, borderTop: "1px solid #CCCCCC", py: 1.25, mt: 1 }}><Typography sx={{ ...body, fontWeight: 800 }}>Invoice total (incl. GST)</Typography><Typography sx={{ ...body, fontWeight: 800, textAlign: "right" }}>{money(totals.gross)}</Typography></Box>
          {totals.subsidy > 0 && <Box sx={{ mb: 1 }}><Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}><Typography sx={body}>Subsidy adjustment</Typography><Typography sx={body}>{money(-totals.subsidy)}</Typography></Box><Typography sx={{ fontSize: "10px", color: "#666666", lineHeight: 1.4, mt: 0.4 }}>As recorded in this invoice; this does not confirm subsidy receipt.</Typography></Box>}
          {[["Net payable", totals.net], ["Amount received", totals.paid]].map(([label, value]) => <Box key={label} sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 0.5 }}><Typography sx={{ ...body, fontWeight: 700 }}>{label}</Typography><Typography sx={{ ...body, fontWeight: 700 }}>{money(value)}</Typography></Box>)}
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, borderTop: "1px solid #111111", borderBottom: "1px solid #111111", py: 1.25, mt: 1.25 }}><Typography sx={{ fontSize: "13px", fontWeight: 800 }}>Balance due</Typography><Typography sx={{ fontSize: "17px", fontWeight: 800, textAlign: "right" }}>{money(totals.balance)}</Typography></Box>
        </Box>
      </Box>

      <Box className="pdf-keep-together" sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 2, py: 1.5, borderTop: "1px solid #DDDDDD", borderBottom: "1px solid #DDDDDD" }}><Box><Typography sx={caption}>For {companyName}</Typography><Box sx={{ height: 24 }} /><Typography sx={{ ...body, fontWeight: 700 }}>Authorized signatory</Typography></Box><Box><Typography sx={caption}>Customer acknowledgement</Typography><Box sx={{ height: 24 }} /><Typography sx={body}>Signature / name / date</Typography></Box></Box>

    </Paper>
  );
}
