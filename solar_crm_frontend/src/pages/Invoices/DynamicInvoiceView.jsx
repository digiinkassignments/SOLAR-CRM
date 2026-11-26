import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Box, Paper, Typography, Button, Stack, CircularProgress } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import toast from "react-hot-toast";
import api from "../../api/axios";
import SolarInvoiceDocument from "./SolarInvoiceDocument";
import { getInvoiceTotals, invoiceMoney, resolveInvoiceLogo, invoiceLogoAsPng } from "./invoiceDocumentHelpers";

export default function DynamicInvoiceView() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const [loaded, setLoaded] = useState({ token: null, invoice: null, error: null });
  const [failedLogo, setFailedLogo] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const emailBusy = useRef(false);
  const pdfBusy = useRef(false);
  const autoDownloadedToken = useRef(null);
  const invoice = loaded.token === token ? loaded.invoice : null;
  const loading = loaded.token !== token;
  const wantsDownload = searchParams.get("download") === "true";
  const resolvedLogo = resolveInvoiceLogo(invoice?.company);
  const logoSrc = resolvedLogo !== failedLogo ? resolvedLogo : null;

  useEffect(() => {
    const controller = new AbortController();
    api.get(`/invoices/public/${token}`, { signal: controller.signal }).then((response) => {
      if (controller.signal.aborted) return;
      if (!response.data?.success || !response.data?.data) {
        setLoaded({ token, invoice: null, error: "Invoice not found or link unavailable." });
        return;
      }
      setLoaded({ token, invoice: response.data.data, error: null });
    }).catch((error) => {
      if (!controller.signal.aborted) setLoaded({ token, invoice: null, error: error.response?.data?.message || "This invoice could not be loaded. Please try again." });
    });
    return () => controller.abort();
  }, [token]);

  const downloadPdf = useCallback(async (mode = "download") => {
    if (!invoice || pdfBusy.current) return;
    const preview = mode === "print" ? window.open("about:blank", "_blank") : null;
    if (mode === "print" && !preview) { toast.error("Allow a new tab to open the print-ready invoice."); return; }
    if (preview) { preview.opener = null; preview.document.title = "Preparing tax invoice"; }
    pdfBusy.current = true;
    setDownloading(true);
    toast.loading("Preparing invoice PDF…", { id: "invoice-pdf" });
    try {
      const [{ createSolarInvoicePdf }, logo] = await Promise.all([
        import("./solarInvoicePdf"),
        invoiceLogoAsPng(logoSrc),
      ]);
      const reference = String(invoice.invoice_number || "Invoice");
      const pdf = createSolarInvoicePdf({ invoice, logoSrc: logo });
      if (preview) {
        const url = URL.createObjectURL(pdf.output("blob"));
        preview.location.replace(url);
        const closed = setInterval(() => { if (preview.closed) { URL.revokeObjectURL(url); clearInterval(closed); } }, 1000);
        toast.success("Print-ready invoice opened.", { id: "invoice-pdf" });
      } else {
        await pdf.save(`Tax_Invoice_${reference.replace(/[^a-z0-9_.-]/gi, "_")}.pdf`, { returnPromise: true });
        toast.success("Invoice PDF downloaded.", { id: "invoice-pdf" });
      }
    } catch (error) {
      if (preview) preview.close();
      console.error("Invoice PDF export failed:", error);
      toast.error("PDF could not be generated. Please retry.", { id: "invoice-pdf" });
    } finally {
      pdfBusy.current = false;
      setDownloading(false);
    }
  }, [invoice, logoSrc]);

  useEffect(() => {
    if (!invoice || !wantsDownload || autoDownloadedToken.current === token) return;
    const timer = setTimeout(() => {
      autoDownloadedToken.current = token;
      downloadPdf();
    }, 300);
    return () => clearTimeout(timer);
  }, [invoice, wantsDownload, token, downloadPdf]);

  if (loading) return <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: "80vh", bgcolor: "#F8F8F8" }}><CircularProgress size={34} sx={{ color: "#333333" }} /><Typography sx={{ color: "#666666", fontSize: "0.85rem" }}>Loading invoice…</Typography></Stack>;
  if (!invoice || loaded.error) return <Box sx={{ p: 3, pt: 8 }}><Paper elevation={0} sx={{ maxWidth: 480, mx: "auto", p: 3, border: "1px solid #DDDDDD", textAlign: "center" }}><Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: "#111111", mb: 1 }}>Invoice unavailable</Typography><Typography sx={{ color: "#666666", fontSize: "0.85rem", lineHeight: 1.7 }}>{loaded.error || "Contact the invoice issuer for an updated invoice link."}</Typography><Button onClick={() => window.location.reload()} sx={{ color: "#111111", textTransform: "none", mt: 2 }}>Try again</Button></Paper></Box>;

  const sendEmail = async () => {
    if (emailBusy.current) return;
    if (!localStorage.getItem("token")) { toast.error("Sign in to the CRM to send an invoice email."); return; }
    if (!invoice.customer_email) { toast.error("Save the customer's email address first."); return; }
    emailBusy.current = true;
    toast.loading("Sending invoice?", { id: "invoice-email" });
    try {
      const response = await api.post(`/invoices/${invoice.id}/send-email`);
      toast.success(response.data.message, { id: "invoice-email" });
    } catch (error) { toast.error(error.response?.data?.message || "Could not send invoice email.", { id: "invoice-email" }); }
    finally { emailBusy.current = false; }
  };
  const totals = getInvoiceTotals(invoice);
  const shareWhatsApp = () => {
    const digits = String(invoice.customer_phone || "").replace(/\D/g, "");
    const phone = digits.length === 10 ? `91${digits}` : digits;
    const publicUrl = `${window.location.origin}/invoice/${token}`;
    const text = `Tax invoice: ${invoice.invoice_number}\nCustomer: ${invoice.customer_name}\nNet payable: ${invoiceMoney(totals.net)}\nAmount received: ${invoiceMoney(totals.paid)}\nBalance due: ${invoiceMoney(totals.balance)}\nPayment status: ${totals.status}\n\nView invoice and download PDF:\n${publicUrl}`;
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Box className="invoice-public-page" sx={{ bgcolor: "#F3F3F3", minHeight: "100vh", px: { xs: 1, sm: 2 }, py: { xs: 1.5, sm: 3 } }}>
      <Box className="no-print" sx={{ maxWidth: 794, mx: "auto", mb: 2, p: 2, bgcolor: "#FFFFFF", border: "1px solid #DDDDDD", borderRadius: "9px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
        <Box sx={{ minWidth: 0 }}><Typography sx={{ color: "#111111", fontWeight: 800, fontSize: "0.9rem", overflowWrap: "anywhere" }}>Invoice {invoice.invoice_number}</Typography><Typography sx={{ color: "#666666", fontSize: "0.74rem", mt: 0.35 }}>{totals.status} · Balance due {invoiceMoney(totals.balance)}</Typography></Box>
        <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1} sx={{ "& .MuiButton-root": { minHeight: 37, borderRadius: "7px", fontSize: "0.74rem", fontWeight: 700, textTransform: "none" } }}>
          <Button variant="outlined" startIcon={<WhatsAppIcon fontSize="small" />} disabled={!invoice.customer_phone} onClick={shareWhatsApp} sx={{ color: "#333333", borderColor: "#CCCCCC" }}>Share</Button>
          <Button variant="outlined" onClick={sendEmail} sx={{ color: "#333333", borderColor: "#CCCCCC" }}>Send email</Button>
          <Button variant="outlined" startIcon={<PrintIcon fontSize="small" />} onClick={() => downloadPdf("print")} sx={{ color: "#333333", borderColor: "#CCCCCC" }}>Print</Button>
          <Button variant="contained" startIcon={<DownloadIcon fontSize="small" />} disabled={downloading} onClick={downloadPdf} sx={{ color: "#FFFFFF", bgcolor: "#111111", boxShadow: "none", "&:hover": { bgcolor: "#333333", boxShadow: "none" } }}>{downloading ? "Preparing PDF…" : "Download PDF"}</Button>
        </Stack>
      </Box>
      <SolarInvoiceDocument invoice={invoice} logoSrc={logoSrc} onLogoError={() => setFailedLogo(resolvedLogo)} />
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm 10mm 15mm; }
          html, body { margin: 0 !important; padding: 0 !important; background: #FFFFFF !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          .invoice-public-page { padding: 0 !important; background: #FFFFFF !important; }
          .invoice-a4-page { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; height: auto !important; max-height: none !important; overflow: visible !important; }
          .invoice-a4-page thead { display: table-header-group; }
          .invoice-a4-page tr, .invoice-a4-page .pdf-keep-together { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </Box>
  );
}
