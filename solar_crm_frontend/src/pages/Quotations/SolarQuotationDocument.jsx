import { useEffect, useState } from "react";
import { Box, CircularProgress, Paper, Typography } from "@mui/material";

const imageAsPng = (source) => new Promise((resolve) => {
  if (!source) { resolve(null); return; }
  if (source.startsWith("data:")) { resolve(source); return; }
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = () => {
    try {
      const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
    } catch { resolve(null); }
  };
  image.onerror = () => resolve(null);
  image.src = source;
});

// The browser preview and downloaded document deliberately use the same renderer.
// This prevents layout, totals, page breaks or tenant branding from drifting between them.
export default function SolarQuotationDocument({ quotation, company, logoSrc, lineItems, totals, isAccepted, aiInsights }) {
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let disposed = false;
    let objectUrl = "";
    setPdfUrl("");
    setError("");

    const render = async () => {
      try {
        const [{ createSolarQuotationPdf }, logo] = await Promise.all([
          import("./solarQuotationPdf"),
          imageAsPng(logoSrc),
        ]);
        if (disposed) return;
        const document = createSolarQuotationPdf({
          quotation,
          company,
          logoSrc: logo,
          lineItems,
          totals,
          isAccepted,
          aiInsights,
        });
        objectUrl = URL.createObjectURL(document.output("blob"));
        if (!disposed) setPdfUrl(objectUrl);
      } catch (renderError) {
        console.error("Quotation preview error:", renderError);
        if (!disposed) setError("Quotation preview could not be prepared. Please use Download PDF and retry.");
      }
    };

    render();
    return () => {
      disposed = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [quotation, company, logoSrc, lineItems, totals, isAccepted, aiInsights]);

  if (error) {
    return <Paper id="printable-zoho-quotation" elevation={0} sx={{ maxWidth: 900, mx: "auto", p: 4, border: "1px solid #ddd" }}><Typography color="error">{error}</Typography></Paper>;
  }

  if (!pdfUrl) {
    return <Paper id="printable-zoho-quotation" elevation={0} sx={{ maxWidth: 900, minHeight: 520, mx: "auto", display: "grid", placeItems: "center", border: "1px solid #ddd" }}><Box sx={{ textAlign: "center" }}><CircularProgress size={34} /><Typography sx={{ mt: 1.5, color: "text.secondary" }}>Preparing quotation preview…</Typography></Box></Paper>;
  }

  return (
    <Paper id="printable-zoho-quotation" elevation={0} sx={{ width: "100%", maxWidth: 980, mx: "auto", p: { xs: 0, sm: 1 }, bgcolor: "#e5e7eb", border: "1px solid #d1d5db", borderRadius: 0, boxSizing: "border-box" }}>
      <Box
        component="iframe"
        title={`Quotation ${quotation.quotation_number || "preview"}`}
        src={`${pdfUrl}#view=FitH&toolbar=1&navpanes=0`}
        sx={{ display: "block", width: "100%", height: { xs: "72vh", md: "1120px" }, border: 0, bgcolor: "#ffffff" }}
      />
    </Paper>
  );
}
