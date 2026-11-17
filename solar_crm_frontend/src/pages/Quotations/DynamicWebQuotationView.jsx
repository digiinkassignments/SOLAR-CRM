import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from "@mui/material";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PrintIcon from "@mui/icons-material/Print";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import VerifiedIcon from "@mui/icons-material/Verified";
import EmailIcon from "@mui/icons-material/Email";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ShareIcon from "@mui/icons-material/Share";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Menu, MenuItem } from "@mui/material";

import api from "../../api/axios";
import { getAIProposalSavings } from "../../services/aiService";
import toast from "react-hot-toast";
import ConvertInvoiceModal from "../Invoices/ConvertInvoiceModal";
import SolarQuotationDocument from "./SolarQuotationDocument";

const formatIndianCurrency = (val) => {
  if (val === undefined || val === null) return "₹0";
  const num = Number(val) || 0;
  return `₹${Math.round(num).toLocaleString("en-IN")}`;
};

// Helper to resolve company logo path same-origin via Vite proxy so canvas export never fails
const resolveLogoUrl = (rawLogo) => {
  if (!rawLogo || typeof rawLogo !== "string") return null;
  if (rawLogo.startsWith("data:")) return rawLogo;
  if (rawLogo.includes("/uploads/")) {
    const idx = rawLogo.indexOf("/uploads/");
    return rawLogo.substring(idx);
  }
  const cleanPath = rawLogo.startsWith("/") ? rawLogo : `/uploads/company/${rawLogo}`;
  return cleanPath;
};

// Convert image URL to Base64 so html2canvas renders without canvas taint
const convertImageToBase64 = (url) => {
  return new Promise((resolve) => {
    if (!url || typeof url !== "string" || url.startsWith("data:")) {
      return resolve(url);
    }

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.blob();
      })
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(url);
        reader.readAsDataURL(blob);
      })
      .catch(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width || 120;
            canvas.height = img.naturalHeight || img.height || 40;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          } catch {
            resolve(url);
          }
        };
        img.onerror = () => resolve(url);
        img.src = url;
      });
  });
};

const DynamicWebQuotationView = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState(null);
  const [company, setCompany] = useState(null);

  const [openAcceptModal, setOpenAcceptModal] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);
  const [openConvertInvoiceModal, setOpenConvertInvoiceModal] = useState(false);
  const [logoSrc, setLogoSrc] = useState(null);
  const [shareAnchorEl, setShareAnchorEl] = useState(null);

  useEffect(() => {
    fetchPublicQuotation();
  }, [token]);

  // Auto-download PDF if URL param ?download=true is present
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("download") === "true" && quotation && !loading) {
      const timer = setTimeout(() => {
        handleDownloadPdf();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [quotation, loading]);

  useEffect(() => {
    let isMounted = true;
    if (company?.company_logo || company?.logo_url || company?.logo) {
      const rawLogo = company.company_logo || company.logo_url || company.logo;
      const targetUrl = resolveLogoUrl(rawLogo);
      if (targetUrl) {
        if (targetUrl.startsWith("data:")) {
          setLogoSrc(targetUrl);
        } else {
          // Set same-origin URL first for instant UI display
          setLogoSrc(targetUrl);
          // Convert to Base64 in background for flawless html2canvas PDF rendering
          convertImageToBase64(targetUrl).then((base64) => {
            if (isMounted && base64 && base64.startsWith("data:")) {
              setLogoSrc(base64);
            }
          });
        }
      }
    }
    return () => {
      isMounted = false;
    };
  }, [company]);

  const [aiInsights, setAiInsights] = useState(null);

  const fetchPublicQuotation = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/quotations/public/${token}`);
      if (res.data?.success) {
        const qData = res.data.data.quotation;
        setQuotation(qData);
        setCompany(res.data.data.company);
        if (qData?.customer_name) {
          setSignatureName(qData.customer_name);
        }

        // Fetch AI ROI and Savings story for this quotation
        if (qData) {
          getAIProposalSavings({
            customer_name: qData.customer_name,
            city: qData.city,
            state: qData.state,
            system_capacity_kw: qData.system_capacity_kw,
            system_type: qData.system_type,
            panel_brand: qData.panel_brand,
            inverter_brand: qData.inverter_brand,
            base_price: qData.base_price,
            subsidy_amount: qData.subsidy_amount,
            net_payable: qData.net_payable_amount,
          })
            .then((aiRes) => {
              if (aiRes?.success && aiRes?.data) {
                setAiInsights(aiRes.data);
              }
            })
            .catch((aiErr) => {
              console.warn("AI proposal fetch note:", aiErr);
            });
        }
      }
    } catch (err) {
      console.error("Fetch public quotation error:", err);
      toast.error(err.response?.data?.message || "Proposal not found");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSubmit = async () => {
    if (!signatureName.trim()) {
      toast.error("Please enter your name to confirm acceptance");
      return;
    }
    setAccepting(true);
    try {
      const res = await api.post(`/quotations/public/${token}/accept`, {
        customer_signature_name: signatureName.trim(),
      });
      if (res.data?.success) {
        toast.success("Quotation accepted successfully!");
        setQuotation((prev) => ({
          ...prev,
          status: "Accepted",
          customer_signature_name: signatureName.trim(),
          accepted_at: new Date().toISOString(),
        }));
        setAcceptedSuccess(true);
        setOpenAcceptModal(false);
      }
    } catch (err) {
      console.error("Accept error:", err);
      toast.error(err.response?.data?.message || "Failed to accept quotation");
    } finally {
      setAccepting(false);
    }
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById("printable-zoho-quotation");
    if (!element) return;

    toast.loading("Preparing your quotation PDF...", { id: "pdf-toast" });

    // Pre-convert any images in element to Base64 before exporting
    const imgs = element.querySelectorAll("img");
    for (const img of imgs) {
      if (img.src && !img.src.startsWith("data:")) {
        try {
          const b64 = await convertImageToBase64(img.src);
          if (b64 && b64.startsWith("data:")) {
            img.src = b64;
          }
        } catch (e) {
          console.warn("PDF pre-convert image error:", e);
        }
      }
    }

    import("html2pdf.js").then((html2pdfModule) => {
      const html2pdf = html2pdfModule.default || html2pdfModule;
      const opt = {
        margin: [12, 10, 15, 10],
        filename: `Solar_Quotation_${quotation?.quotation_number || "Proposal"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
          scrollX: 0,
          windowWidth: 1024,
          onclone: (document) => {
            const page = document.getElementById("printable-zoho-quotation");
            if (page) { page.style.width = "718px"; page.style.maxWidth = "718px"; }
          },
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"], avoid: [".pdf-keep-together", "tr"] },
      };

      html2pdf()
        .set(opt)
        .from(element)
        .toPdf()
        .get("pdf")
        .then((pdf) => {
          const pageCount = pdf.internal.getNumberOfPages();
          for (let page = 1; page <= pageCount; page += 1) {
            pdf.setPage(page);
            pdf.setFontSize(8);
            pdf.setTextColor(90, 90, 90);
            pdf.text(`${quotation?.quotation_number || "Solar Quotation"}  •  ${page} / ${pageCount}`, pdf.internal.pageSize.getWidth() - 10, pdf.internal.pageSize.getHeight() - 6, { align: "right" });
          }
        })
        .save()
        .then(() => {
          toast.success("Quotation PDF downloaded.", { id: "pdf-toast" });
        })
        .catch((err) => {
          console.error("PDF save error:", err);
          toast.error("Opening print dialog fallback...", { id: "pdf-toast" });
          window.print();
        });
    }).catch((e) => {
      console.error("html2pdf import error:", e);
      window.print();
    });
  };

  const handleShareWhatsApp = () => {
    if (!quotation) return;
    const phone = quotation.customer_phone ? quotation.customer_phone.replace(/[^0-9]/g, "") : "";
    const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
    const publicUrl = `${window.location.origin}/quote/${quotation.public_token || quotation.quotation_number || quotation.id}`;
    const compName = company?.company_name || "Solar Power Solutions";

    const message = `Hello ${quotation.customer_name},\n\nHere is your official solar energy system proposal (${quotation.system_capacity_kw} kW System) from ${compName}.\n\n💰 Total Net Investment: ${formatIndianCurrency(quotation.net_payable_amount)}\n📄 View Digital Proposal & Download 1-Page PDF:\n${publicUrl}\n\nThank you!`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleShareEmail = async () => {
    if (!quotation) return;
    if (!localStorage.getItem("token")) { toast.error("Sign in to the CRM to send a quotation email."); return; }
    if (!quotation.customer_email) { toast.error("Save the customer's email address first."); return; }
    const button = document.activeElement;
    if (button?.disabled) return;
    if (button) button.disabled = true;
    toast.loading("Sending quotation?", { id: "quotation-email" });
    try {
      const response = await api.post(`/quotations/${quotation.id}/send-email`, { to: quotation.customer_email });
      toast.success(response.data.message, { id: "quotation-email" });
    } catch (error) { toast.error(error.response?.data?.message || "Could not send email. Sign in and try again.", { id: "quotation-email" }); }
    finally { if (button) button.disabled = false; }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", bgcolor: "#F8F8F8" }}>
        <Stack alignItems="center" spacing={1.5}>
          <CircularProgress size={42} sx={{ color: "#111111" }} />
          <Typography variant="body2" sx={{ color: "#444444", fontWeight: 700 }}>
            Loading Official System-Generated Quotation...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!quotation) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#F8F8F8", display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
        <Paper elevation={0} sx={{ p: 4, textAlign: "center", maxWidth: 440, borderRadius: "14px", border: "1px solid #DEDEDE" }}>
          <SolarPowerIcon sx={{ fontSize: 50, color: "#888888", mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#111111", mb: 0.8 }}>
            Proposal Not Found
          </Typography>
          <Typography variant="body2" sx={{ color: "#666666", fontSize: "0.8rem" }}>
            The quotation link may have expired or is invalid. Please contact your solar provider for an updated proposal link.
          </Typography>
        </Paper>
      </Box>
    );
  }

  const isAccepted = quotation.status === "Accepted";
  const displayCompanyName =
    company?.company_name && company.company_name.trim().length > 1
      ? company.company_name.trim()
      : (company?.company_name?.trim() || "Solar Power Solutions");

  // Commercial Pricing Breakdown Math
  const numNetPayable = Number(quotation.net_payable_amount) || 0;
  const numSubsidy = Number(quotation.subsidy_amount) || 0;
  const numTotalGross = Number(quotation.total_amount) || (numNetPayable + numSubsidy);

  const numBase = Number(quotation.base_price) || 0;
  const numStructure = Number(quotation.structure_installation_cost) || 0;
  const numDiscount = Number(quotation.discount_amount) || 0;
  const numGstRate = Number(quotation.gst_rate ?? 0);

  let finalBase = numBase;
  let finalStructure = numStructure;

  if (finalBase === 0 && numTotalGross > 0) {
    const subtotalCalc = Math.round(numTotalGross / (1 + numGstRate / 100));
    if (finalStructure > 0) {
      finalBase = Math.max(0, subtotalCalc - finalStructure);
    } else {
      finalBase = subtotalCalc;
    }
  }

  const subtotalBeforeGst = Math.max(0, (finalBase + finalStructure) - numDiscount);
  const numGstAmount = quotation.gst_amount != null ? Number(quotation.gst_amount) : Math.round((subtotalBeforeGst * numGstRate) / 100);
  const totalGrossInvestment = numTotalGross || (subtotalBeforeGst + numGstAmount);
  const quotationLineItems = (() => {
    try {
      const parsed = typeof quotation.line_items_json === "string" ? JSON.parse(quotation.line_items_json) : quotation.line_items_json;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  return (
    <Box sx={{ bgcolor: "#F3F3F3", minHeight: "100vh", pb: 5, "& .MuiAlert-root": { bgcolor: "#F7F7F7", color: "#333333", border: "1px solid #DEDEDE" }, "& .MuiAlert-icon": { color: "#444444" } }}>
      {/* Print rules keep itemized quotations readable across multiple A4 pages. */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 10mm 15mm;
          }
          body {
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            color: #111111 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          #printable-zoho-quotation {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            background: #ffffff !important;
            page-break-after: auto !important;
            page-break-inside: auto !important;
          }
          #printable-zoho-quotation table { width: 100% !important; border-collapse: collapse !important; }
          #printable-zoho-quotation thead { display: table-header-group !important; }
          #printable-zoho-quotation tr { break-inside: avoid !important; page-break-inside: avoid !important; }
          #printable-zoho-quotation .pdf-keep-together { break-inside: avoid !important; page-break-inside: avoid !important; }
        }
      `}</style>

      {/* Top Action Sticky Header — Executive SaaS Style */}
      <Box
        className="no-print"
        sx={{
          bgcolor: "#FFFFFF",
          color: "#111111",
          borderBottom: "1px solid #DEDEDE",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          position: "sticky",
          top: 0,
          zIndex: 1100,
          backdropFilter: "blur(16px)",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
        }}
      >
        <Box
          sx={{
            maxWidth: "1350px",
            mx: "auto",
            px: { xs: 2, sm: 3, md: 4 },
            py: 1.2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
            }}
          >
            {/* Left Brand & Status Group */}
            <Stack direction="row" alignItems="center" spacing={2}>
              {logoSrc ? (
                <Box
                  component="img"
                  src={logoSrc}
                  alt={displayCompanyName}
                  onError={() => setLogoSrc(null)}
                  sx={{
                    height: 38,
                    maxWidth: 130,
                    objectFit: "contain",
                    borderRadius: "6px",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: "8px",
                    bgcolor: "#111111",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SolarPowerIcon sx={{ color: "#444444", fontSize: 22 }} />
                </Box>
              )}

              <Box sx={{ borderLeft: "1px solid #DEDEDE", pl: 2, display: { xs: "none", sm: "block" } }}>
                <Typography
                  sx={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    color: "#111111",
                    fontSize: "0.95rem",
                    lineHeight: 1.2,
                  }}
                >
                  {displayCompanyName}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    color: "#666666",
                    fontSize: "0.72rem",
                    fontWeight: 500,
                  }}
                >
                  Solar Proposal #{quotation.quotation_code || "QUO"}
                </Typography>
              </Box>

              <Chip
                icon={isAccepted ? <VerifiedIcon sx={{ color: "#333333 !important", fontSize: "14px !important" }} /> : undefined}
                label={isAccepted ? "Accepted" : quotation.status || "Sent"}
                size="small"
                sx={{
                  bgcolor: isAccepted ? "#EFEFEF" : "#F3F3F3",
                  color: isAccepted ? "#333333" : "#444444",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  height: 26,
                  borderRadius: "6px",
                  border: isAccepted ? "1px solid #DDDDDD" : "1px solid #DEDEDE",
                }}
              />
            </Stack>

            {/* Right Action Buttons Group */}
            <Stack direction="row" useFlexGap spacing={1} alignItems="center" sx={{ flexWrap: "wrap", minWidth: 0 }}>
              {/* Share Dropdown Button */}
              <Button
                variant="outlined"
                size="small"
                startIcon={<ShareIcon sx={{ fontSize: 16, color: "#666666" }} />}
                endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 16, color: "#666666" }} />}
                onClick={(e) => setShareAnchorEl(e.currentTarget)}
                sx={{
                  color: "#333333",
                  borderColor: "#CCCCCC",
                  bgcolor: "#FFFFFF",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  textTransform: "none",
                  height: 36,
                  px: 1.5,
                  borderRadius: "8px",
                  "&:hover": { borderColor: "#888888", bgcolor: "#F8F8F8" },
                }}
              >
                Share
              </Button>
              <Menu
                anchorEl={shareAnchorEl}
                open={Boolean(shareAnchorEl)}
                onClose={() => setShareAnchorEl(null)}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 1,
                      minWidth: 160,
                      borderRadius: "10px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                      border: "1px solid #DEDEDE",
                    },
                  },
                }}
              >
                <MenuItem
                  onClick={() => {
                    setShareAnchorEl(null);
                    handleShareWhatsApp();
                  }}
                  sx={{ gap: 1.2, py: 1, fontSize: "0.82rem", fontWeight: 600, color: "#333333" }}
                >
                  <WhatsAppIcon sx={{ fontSize: 18 }} />
                  WhatsApp Share
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setShareAnchorEl(null);
                    handleShareEmail();
                  }}
                  sx={{ gap: 1.2, py: 1, fontSize: "0.82rem", fontWeight: 600, color: "#333333" }}
                >
                  <EmailIcon sx={{ fontSize: 18 }} />
                  Email Client
                </MenuItem>
              </Menu>

              {/* Print Button */}
              <Button
                variant="outlined"
                size="small"
                startIcon={<PrintIcon sx={{ fontSize: 16, color: "#666666" }} />}
                onClick={() => window.print()}
                sx={{
                  color: "#333333",
                  borderColor: "#CCCCCC",
                  bgcolor: "#FFFFFF",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  textTransform: "none",
                  height: 36,
                  px: 1.5,
                  borderRadius: "8px",
                  display: { xs: "none", sm: "inline-flex" },
                  "&:hover": { borderColor: "#888888", bgcolor: "#F8F8F8" },
                }}
              >
                Print
              </Button>

              {/* Download PDF Button */}
              <Button
                variant="outlined"
                size="small"
                startIcon={<PictureAsPdfIcon sx={{ fontSize: 16, color: "#444444" }} />}
                onClick={handleDownloadPdf}
                sx={{
                  color: "#333333",
                  borderColor: "#DDDDDD",
                  bgcolor: "#FAFAFA",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  textTransform: "none",
                  height: 36,
                  px: 1.6,
                  borderRadius: "8px",
                  "&:hover": { bgcolor: "#EEEEEE", borderColor: "#444444" },
                }}
              >
                Download PDF
              </Button>

              {/* Convert to Invoice */}
              <Button
                variant="contained"
                size="small"
                startIcon={<ReceiptLongIcon sx={{ fontSize: 16 }} />}
                onClick={() => setOpenConvertInvoiceModal(true)}
                sx={{
                  bgcolor: "#111111",
                  color: "#FFFFFF",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  textTransform: "none",
                  height: 36,
                  px: 1.8,
                  borderRadius: "8px",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
                  "&:hover": { bgcolor: "#333333", boxShadow: "0 3px 8px rgba(0, 0, 0, 0.12)" },
                }}
              >
                Invoice ➔
              </Button>

              {/* Accept Proposal (Hero Action) */}
              {!isAccepted && !quotation.is_superseded && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                  onClick={() => setOpenAcceptModal(true)}
                  sx={{
                    bgcolor: "#333333",
                    color: "#FFFFFF",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    textTransform: "none",
                    height: 36,
                    px: 2.2,
                    borderRadius: "8px",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                    "&:hover": { bgcolor: "#333333", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" },
                  }}
                >
                  Accept Proposal
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* Multi-page A4 solar quotation document */}
      <Container maxWidth="md" sx={{ mt: 2.5, mb: 3 }}>
        {acceptedSuccess && (
          <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />} className="no-print" sx={{ mb: 2, borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600 }}>
            Thank you! You have successfully accepted this solar proposal online. Our engineering team will contact you shortly.
          </Alert>
        )}

        {quotation.is_superseded && <Alert severity="info">This is an archived quotation revision. Ask your consultant for the latest proposal before accepting.</Alert>}
      <SolarQuotationDocument
          quotation={quotation}
          company={company}
          logoSrc={logoSrc}
          onLogoError={() => setLogoSrc(null)}
          lineItems={quotationLineItems}
          totals={{ base: finalBase, structure: finalStructure, discount: numDiscount, taxable: subtotalBeforeGst, gst: numGstAmount, gstRate: numGstRate, total: totalGrossInvestment, subsidy: numSubsidy, net: numNetPayable }}
          isAccepted={isAccepted}
          aiInsights={aiInsights}
        />
      </Container>

      {/* Accept Proposal Confirmation Dialog */}
      <Dialog open={openAcceptModal} onClose={() => setOpenAcceptModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "12px", p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#111111", fontSize: "1rem" }}>
          Confirm Proposal Acceptance
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#666666", mb: 2, fontSize: "0.82rem" }}>
            By accepting, you confirm your approval of the solar system specifications ({quotation.system_capacity_kw} kW) and net payable investment of {formatIndianCurrency(quotation.net_payable_amount)}.
          </Typography>

          <TextField
            fullWidth
            required
            size="small"
            label="Digital Signature / Full Name"
            sx={{ "& .MuiInputLabel-root.Mui-focused": { color: "#333333" }, "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#444444" } }}
            value={signatureName}
            onChange={(e) => setSignatureName(e.target.value)}
            helperText="Please enter your full name as digital approval confirmation"
          />
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: "1px solid #DEDEDE" }}>
          <Button onClick={() => setOpenAcceptModal(false)} sx={{ color: "#666666", fontWeight: 700, fontSize: "0.78rem" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAcceptSubmit}
            disabled={accepting}
            sx={{ bgcolor: "#333333", color: "#FFFFFF", fontWeight: 800, px: 2.5, height: 32, borderRadius: "6px", "&:hover": { bgcolor: "#333333" } }}
          >
            {accepting ? "Confirming..." : "Confirm & Accept"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Convert into Official Invoice Modal */}
      {openConvertInvoiceModal && (
        <ConvertInvoiceModal
          open={openConvertInvoiceModal}
          quotationData={quotation}
          onClose={() => setOpenConvertInvoiceModal(false)}
        />
      )}
    </Box>
  );
};

export default DynamicWebQuotationView;
