import { useEffect, useState } from "react";
import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import { invoiceLogoAsPng } from "./invoiceDocumentHelpers";

// Preview and download use the same jsPDF document so page breaks and totals cannot drift.
export default function SolarInvoiceDocument({ invoice, logoSrc }) {
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let disposed = false;
    let objectUrl = "";
    setPdfUrl("");
    setError("");
    const render = async () => {
      try {
        const [{ createSolarInvoicePdf }, logo] = await Promise.all([
          import("./solarInvoicePdf"),
          invoiceLogoAsPng(logoSrc),
        ]);
        if (disposed) return;
        const document = createSolarInvoicePdf({ invoice, logoSrc: logo });
        objectUrl = URL.createObjectURL(document.output("blob"));
        if (!disposed) setPdfUrl(objectUrl);
      } catch (renderError) {
        console.error("Invoice preview error:", renderError);
        if (!disposed) setError("Invoice preview could not be prepared. Please retry.");
      }
    };
    render();
    return () => { disposed = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [invoice, logoSrc]);

  if (error) return <Paper id="printable-tax-invoice" elevation={0} sx={{ maxWidth: 900, mx: "auto", p: 4, border: "1px solid #ddd" }}><Typography color="error">{error}</Typography></Paper>;
  if (!pdfUrl) return <Paper id="printable-tax-invoice" elevation={0} sx={{ maxWidth: 900, minHeight: 520, mx: "auto", display: "grid", placeItems: "center", border: "1px solid #ddd" }}><Box sx={{ textAlign: "center" }}><CircularProgress size={34} /><Typography sx={{ mt: 1.5, color: "text.secondary" }}>Preparing tax invoice preview…</Typography></Box></Paper>;

  return (
    <Paper id="printable-tax-invoice" elevation={0} sx={{ width: "100%", maxWidth: 980, mx: "auto", p: { xs: 0, sm: 1 }, bgcolor: "#e5e7eb", border: "1px solid #d1d5db", borderRadius: 0, boxSizing: "border-box" }}>
      <Box component="iframe" title={`Tax Invoice ${invoice.invoice_number || "preview"}`} src={`${pdfUrl}#view=FitH&toolbar=1&navpanes=0`} sx={{ display: "block", width: "100%", height: { xs: "72vh", md: "1120px" }, border: 0, bgcolor: "#fff" }} />
    </Paper>
  );
}
