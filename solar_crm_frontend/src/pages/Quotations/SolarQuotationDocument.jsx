import SolarTaxSummary from "../../components/SolarTaxSummary";
import { readTaxSummary } from "../../utils/solarTax";
import { Box, Paper, Typography, Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";

const amount = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0);
const date = (value) => {
  if (!value) return "Not specified";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Not specified" : parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const caption = { fontSize: "10px", color: "#666666", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, mb: 0.75 };
const body = { fontSize: "12px", lineHeight: 1.7, color: "#333333", overflowWrap: "anywhere" };
const sectionTitle = { fontSize: "12px", fontWeight: 800, color: "#111111", mb: 1.5, pb: 1, borderBottom: "1px solid #DDDDDD" };

export default function SolarQuotationDocument({ quotation: q, company, logoSrc, onLogoError, lineItems, totals: t, isAccepted, aiInsights }) {
  const composite = q.gst_mode === "solar_composite";
  const revision = q.revision_number || 1;
  const companyName = company?.company_name?.trim() || "Solar Power Solutions";
  const issuerAddress = [company?.address, company?.city, company?.state, company?.pincode, company?.country].filter(Boolean).join(", ");
  const customerAddress = [q.customer_address, q.city, q.state, q.pincode].filter(Boolean).join(", ");
  const bankFields = [["Bank", company?.bank_name], ["Account name", company?.account_name], ["Account number", company?.account_number], ["IFSC", company?.ifsc_code], ["Branch", company?.branch_name], ["UPI ID", company?.upi_id]].filter(([, value]) => value);
  const rows = lineItems.length ? lineItems : [
    { name: `Solar ${q.system_type || ""} system`, description: q.system_capacity_kw ? `${q.system_capacity_kw} kW supply as specified below` : "Supply as specified below", quantity: 1, unit: "System", unit_price: t.base },
    ...(t.structure > 0 ? [{ name: "Structure & installation", quantity: 1, unit: "Service", unit_price: t.structure }] : []),
  ];
  const estimates = [
    ["Annual generation", aiInsights?.financial_highlights?.annual_units_generated],
    ["Annual savings", aiInsights?.financial_highlights?.annual_savings],
    ["Estimated payback", aiInsights?.financial_highlights?.estimated_payback_years],
    ["Estimated savings over 25 years", aiInsights?.financial_highlights?.lifetime_savings_25yr],
  ].filter(([, value]) => value !== undefined && value !== null && value !== "");

  return (
    <Paper id="printable-zoho-quotation" className="quotation-pdf" elevation={0} sx={{ width: "100%", maxWidth: 794, mx: "auto", p: { xs: 2.25, sm: 4 }, bgcolor: "#FFFFFF", border: "1px solid #DDDDDD", borderRadius: 0, boxSizing: "border-box", color: "#111111", fontFamily: "Inter, Arial, sans-serif" }}>
      <Box className="pdf-keep-together" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) 240px" }, gap: 3, pb: 3, borderBottom: "2px solid #111111" }}>
        <Box sx={{ minWidth: 0 }}>
          {logoSrc && <Box component="img" src={logoSrc} alt={companyName} onError={onLogoError} sx={{ maxWidth: 150, maxHeight: 48, objectFit: "contain", mb: 1.5 }} />}
          <Typography sx={{ fontSize: "19px", fontWeight: 800, lineHeight: 1.35, mb: 0.75, overflowWrap: "anywhere" }}>{companyName}</Typography>
          {issuerAddress && <Typography sx={body}>{issuerAddress}</Typography>}
          {company?.company_phone && <Typography sx={body}>Tel: {company.company_phone}</Typography>}
          {company?.company_email && <Typography sx={body}>{company.company_email}</Typography>}
          {company?.gst_number && <Typography sx={{ ...body, mt: 0.75 }}><strong>GSTIN:</strong> {company.gst_number}</Typography>}
          {company?.pan_number && <Typography sx={body}><strong>PAN:</strong> {company.pan_number}</Typography>}
        </Box>
        <Box sx={{ textAlign: { xs: "left", sm: "right" }, minWidth: 0 }}>
          <Typography component="h1" sx={{ fontSize: "29px", fontWeight: 800, letterSpacing: "0.06em", lineHeight: 1.2, mb: 2 }}>QUOTATION</Typography><Typography sx={{ fontSize: 11, color: "#666666", mb: 1 }}>Revision {revision}</Typography>
          {[["Quotation no.", q.quotation_number], ["Issue date", date(q.created_at)], ["Valid until", date(q.valid_until)], ["Status", q.status || "Sent"]].map(([label, value]) => <Box key={label} sx={{ display: "flex", justifyContent: { xs: "flex-start", sm: "space-between" }, gap: 2, py: 0.35 }}><Typography sx={{ ...body, color: "#666666" }}>{label}</Typography><Typography sx={{ ...body, fontWeight: 700, textAlign: "right" }}>{value}</Typography></Box>)}
        </Box>
      </Box>

      <Box className="pdf-keep-together" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) minmax(0, 1fr)" }, gap: 3, py: 3, borderBottom: "1px solid #DDDDDD", mb: 3 }}>
        <Box sx={{ minWidth: 0 }}><Typography sx={caption}>Prepared for</Typography><Typography sx={{ fontSize: "15px", fontWeight: 800, mb: 0.5 }}>{q.customer_name}</Typography>{customerAddress && <Typography sx={body}>{customerAddress}</Typography>}{q.customer_phone && <Typography sx={body}>Phone: {q.customer_phone}</Typography>}{q.customer_email && <Typography sx={body}>{q.customer_email}</Typography>}</Box>
        <Box sx={{ minWidth: 0 }}><Typography sx={caption}>Project / installation</Typography><Typography sx={{ fontSize: "15px", fontWeight: 800, mb: 0.5 }}>Rooftop solar energy system</Typography><Typography sx={body}><strong>Capacity:</strong> {q.system_capacity_kw} kW</Typography><Typography sx={body}><strong>System type:</strong> {q.system_type || "Not specified"}</Typography><Typography sx={body}><strong>Site:</strong> {customerAddress || "To be confirmed"}</Typography></Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography component="h2" sx={sectionTitle}>01. Supply & commercial offer</Typography>
        <Box sx={{ width: "100%", overflowWrap: "anywhere" }}>
          <Table size="small" aria-label="Quotation item details" sx={{ tableLayout: "fixed", width: "100%", "& th": { bgcolor: "#F3F3F3", color: "#222222", fontWeight: 700, fontSize: "10px", borderTop: "1px solid #CCCCCC" }, "& th, & td": { p: { xs: "7px 4px", sm: "10px 7px" }, verticalAlign: "top", borderBottom: "1px solid #DDDDDD", overflowWrap: "anywhere" }, "& td": { fontSize: "11px", lineHeight: 1.6 }, "& tr": { breakInside: "avoid" } }}>
            <TableHead><TableRow><TableCell sx={{ width: "5%" }}>#</TableCell><TableCell sx={{ width: lineItems.length ? "34%" : "44%" }}>Description</TableCell><TableCell align="right" sx={{ width: "12%" }}>Qty</TableCell><TableCell align="right" sx={{ width: "16%" }}>Rate</TableCell>{lineItems.length > 0 && <TableCell align="right" sx={{ width: "10%" }}>GST</TableCell>}<TableCell align="right" sx={{ width: "23%" }}>{composite ? "Taxable value" : "Amount"}</TableCell></TableRow></TableHead>
            <TableBody>{rows.map((item, index) => <TableRow key={`${item.name}-${index}`}>
              <TableCell>{index + 1}</TableCell><TableCell><Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#111111", lineHeight: 1.6 }}>{item.name}</Typography>{item.description && <Typography sx={{ fontSize: "10px", lineHeight: 1.6, color: "#555555" }}>{item.description}</Typography>}{item.hsn_code && <Typography sx={{ fontSize: "10px", color: "#666666", mt: 0.5 }}>HSN/SAC: {item.hsn_code}</Typography>}</TableCell>
              <TableCell align="right">{item.quantity}<br /><Box component="span" sx={{ color: "#666666", fontSize: "10px" }}>{item.unit}</Box></TableCell><TableCell align="right">{amount(item.unit_price)}</TableCell>{lineItems.length > 0 && <TableCell align="right">{composite ? "Summary" : `${Number(item.gst_rate || 0)}%`}</TableCell>}<TableCell align="right" sx={{ fontWeight: 700 }}>{amount(item.total_amount ?? (Number(item.taxable_after_discount ?? (Number(item.quantity || 0) * Number(item.unit_price || 0))) + Number(item.gst_amount || 0)))}</TableCell>
            </TableRow>)}</TableBody>
          </Table>
        </Box>
        {lineItems.length > 0 && <Typography sx={{ fontSize: "10px", color: "#666666", mt: 1 }}>{composite ? "Item amounts exclude GST; automatic tax split is shown below." : "Item amounts include item-wise GST after allocated discount."}</Typography>}
        <Box className="pdf-keep-together" sx={{ maxWidth: 355, ml: "auto", mt: 2.5 }}>
          {[["Items subtotal", t.base + t.structure], ...(t.discount > 0 ? [["Discount", -t.discount]] : []), ["Taxable value", t.taxable], [composite ? "GST (70:30 composite)" : lineItems.length ? "GST (item-wise)" : `GST (${t.gstRate}%)`, t.gst]].map(([label, value]) => <Box key={label} sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 0.6 }}><Typography sx={body}>{label}</Typography><Typography sx={{ ...body, fontWeight: 600, textAlign: "right" }}>{amount(value)}</Typography></Box>)}
          <SolarTaxSummary tax={readTaxSummary(q)} />
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 1.3, mt: 1, borderTop: "1px solid #111111", borderBottom: "1px solid #111111" }}><Typography sx={{ fontSize: "12px", fontWeight: 800 }}>Quotation total (incl. GST)</Typography><Typography sx={{ fontSize: "15px", fontWeight: 800, textAlign: "right" }}>{amount(t.total)}</Typography></Box>
          {t.subsidy > 0 && <Box sx={{ mt: 1.5 }}><Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}><Typography sx={body}>Estimated eligible subsidy</Typography><Typography sx={body}>{amount(t.subsidy)}</Typography></Box><Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mt: 0.5 }}><Typography sx={{ ...body, fontWeight: 700 }}>Estimated cost after subsidy</Typography><Typography sx={{ ...body, fontWeight: 700 }}>{amount(t.net)}</Typography></Box><Typography sx={{ fontSize: "10px", color: "#666666", lineHeight: 1.6, mt: 1 }}>Subsidy is subject to eligibility and government approval. It is not a confirmed payment or discount from the installer.</Typography></Box>}
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography component="h2" sx={sectionTitle}>02. Proposed system specifications</Typography>
        {[ ["Solar modules", [q.panel_brand, q.panel_type, q.panel_count ? `${q.panel_count} panels` : ""].filter(Boolean).join(" · ")], ["Inverter", [q.inverter_brand, q.inverter_capacity_kw ? `${q.inverter_capacity_kw} kW` : ""].filter(Boolean).join(" · ")], ["Mounting structure", q.structure_type] ].map(([label, value]) => <Box key={label} className="pdf-keep-together" sx={{ display: "grid", gridTemplateColumns: "125px minmax(0, 1fr)", gap: 2, py: 1.1, borderBottom: "1px solid #EEEEEE" }}><Typography sx={{ ...body, fontWeight: 700 }}>{label}</Typography><Typography sx={body}>{value || "To be confirmed"}</Typography></Box>)}
      </Box>

      <Box sx={{ mb: 3 }}><Typography component="h2" sx={sectionTitle}>03. Terms, scope & validity</Typography><Typography sx={{ ...body, whiteSpace: "pre-wrap" }}>{q.terms_and_conditions || "Payment schedule, delivery timeline and scope exclusions are to be confirmed in writing before order acceptance."}</Typography>{q.notes && <Box sx={{ mt: 2 }}><Typography sx={{ ...body, fontWeight: 700, mb: 0.5 }}>Additional notes / scope</Typography><Typography sx={{ ...body, whiteSpace: "pre-wrap" }}>{q.notes}</Typography></Box>}<Typography sx={{ ...body, mt: 1.5 }}><strong>Offer validity:</strong> {date(q.valid_until)}</Typography></Box>

      {bankFields.length > 0 && <Box className="pdf-keep-together" sx={{ mb: 3 }}><Typography component="h2" sx={sectionTitle}>04. Payment details</Typography><Box sx={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 1.5 }}>{bankFields.map(([label, value]) => <Box key={label}><Typography sx={caption}>{label}</Typography><Typography sx={body}>{value}</Typography></Box>)}</Box><Typography sx={{ ...body, mt: 1 }}>Please mention quotation {q.quotation_number} with your payment reference.</Typography></Box>}
      <Box className="pdf-keep-together" sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 3, py: 2.5, borderTop: "1px solid #DDDDDD", borderBottom: "1px solid #DDDDDD" }}>
        <Box><Typography sx={caption}>For {companyName}</Typography><Box sx={{ height: 42 }} /><Typography sx={{ ...body, fontWeight: 700 }}>Authorized signatory</Typography></Box>
        <Box><Typography sx={caption}>Customer acceptance</Typography><Box sx={{ minHeight: 42, display: "flex", alignItems: "center" }}>{isAccepted && <Typography sx={{ ...body, fontWeight: 700 }}>Accepted by {q.customer_signature_name || q.customer_name}</Typography>}</Box><Typography sx={body}>{isAccepted ? `Accepted on ${date(q.accepted_at)}` : "Signature / name / date"}</Typography></Box>
      </Box>
      {estimates.length > 0 && <Box sx={{ mt: 3 }}><Typography component="h2" sx={sectionTitle}>Indicative performance estimates</Typography>{estimates.map(([label, value]) => <Typography key={label} sx={body}><strong>{label}:</strong> {String(value)}</Typography>)}<Typography sx={{ fontSize: "10px", color: "#666666", lineHeight: 1.6, mt: 1 }}>Estimates depend on site conditions, irradiation, shading and usage. These are not guaranteed generation or financial returns.</Typography></Box>}
      <Box sx={{ mt: 3, textAlign: "center" }}><Typography sx={{ fontSize: "10px", color: "#777777", overflowWrap: "anywhere" }}>{companyName} · {q.quotation_number}{company?.website ? ` · ${company.website}` : ""}</Typography></Box>
    </Paper>
  );
}
