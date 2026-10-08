import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Button,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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

import api from "../../api/axios";
import toast from "react-hot-toast";
import ConvertInvoiceModal from "../Invoices/ConvertInvoiceModal";

const formatIndianCurrency = (val) => {
  if (val === undefined || val === null) return "₹0";
  const num = Number(val) || 0;
  return `₹${Math.round(num).toLocaleString("en-IN")}`;
};

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
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
          } catch (e) {
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

  const fetchPublicQuotation = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/quotations/public/${token}`);
      if (res.data?.success) {
        setQuotation(res.data.data.quotation);
        setCompany(res.data.data.company);
        if (res.data.data.quotation?.customer_name) {
          setSignatureName(res.data.data.quotation.customer_name);
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

    toast.loading("Generating 1-page executive PDF download...", { id: "pdf-toast" });

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
        margin: [5, 6, 5, 6],
        filename: `Solar_Quotation_${quotation?.quotation_number || "Proposal"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
          scrollX: 0,
          windowWidth: 1024,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all"] },
      };

      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          toast.success("Executive 1-Page PDF downloaded!", { id: "pdf-toast" });
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

  const handleShareEmail = () => {
    if (!quotation) return;
    const publicUrl = `${window.location.origin}/quote/${quotation.public_token || quotation.quotation_number || quotation.id}`;
    const compName = company?.company_name || "Solar Power Solutions";
    const subject = `Solar Energy System Proposal (${quotation.system_capacity_kw} kW) - ${quotation.quotation_number}`;
    const body = `Dear ${quotation.customer_name},\n\nPlease find your customized solar energy system quotation below:\n\nSystem Capacity: ${quotation.system_capacity_kw} kW (${quotation.system_type || "On-Grid"})\nNet Investment Payable: ${formatIndianCurrency(quotation.net_payable_amount)}\n\nView Digital Proposal Online & Download PDF:\n${publicUrl}\n\nBest Regards,\n${compName}\n${company?.company_phone || ""}`;

    window.location.href = `mailto:${quotation.customer_email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", bgcolor: "#F8FAFC" }}>
        <Stack alignItems="center" spacing={1.5}>
          <CircularProgress size={42} sx={{ color: "#0F172A" }} />
          <Typography variant="body2" sx={{ color: "#475569", fontWeight: 700 }}>
            Loading Official System-Generated Quotation...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!quotation) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
        <Paper elevation={0} sx={{ p: 4, textAlign: "center", maxWidth: 440, borderRadius: "14px", border: "1px solid #E2E8F0" }}>
          <SolarPowerIcon sx={{ fontSize: 50, color: "#94A3B8", mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A", mb: 0.8 }}>
            Proposal Not Found
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.8rem" }}>
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
  const numGstRate = Number(quotation.gst_rate) || 13.8;

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
  const numGstAmount = Number(quotation.gst_amount) || Math.round((subtotalBeforeGst * numGstRate) / 100);
  const totalGrossInvestment = numTotalGross || (subtotalBeforeGst + numGstAmount);

  // Full Company Address from Settings
  const companyFullAddress = [
    company?.address,
    company?.city,
    company?.state,
    company?.country,
    company?.pincode ? `- ${company.pincode}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const companyPhone = company?.company_phone || "";
  const companyEmail = company?.company_email || "";
  const companyWebsite = company?.website || "";

  return (
    <Box sx={{ bgcolor: "#F1F5F9", minHeight: "100vh", pb: 5 }}>
      {/* Strict CSS Rules for Crisp Vector 1-Page A4 Executive Document Printing */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          body {
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            color: #0F172A !important;
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
            padding: 2mm 3mm !important;
            width: 100% !important;
            max-height: 280mm !important;
            overflow: hidden !important;
            background: #ffffff !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Top Action Sticky Header */}
      <Box
        className="no-print"
        sx={{
          bgcolor: "#0F172A",
          color: "#FFFFFF",
          py: 1.4,
          px: { xs: 2, md: 5 },
          boxShadow: "0 2px 10px rgba(15,23,42,0.12)",
          position: "sticky",
          top: 0,
          zIndex: 1100,
        }}
      >
        <Container maxWidth="lg">
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1.2}>
              {logoSrc ? (
                <Box
                  component="img"
                  src={logoSrc}
                  alt={displayCompanyName}
                  onError={() => setLogoSrc(null)}
                  sx={{ maxHeight: 34, maxWidth: 130, objectFit: "contain", bgcolor: "#FFFFFF", p: 0.3, borderRadius: "4px" }}
                />
              ) : (
                <Box sx={{ bgcolor: "#FFFFFF", borderRadius: "6px", p: 0.5, display: "flex", alignItems: "center" }}>
                  <SolarPowerIcon sx={{ color: "#0F172A", fontSize: 20 }} />
                </Box>
              )}
              <Box>
                <Typography sx={{ fontWeight: 800, lineHeight: 1.1, color: "#FFFFFF", fontSize: "0.92rem" }}>
                  {displayCompanyName}
                </Typography>
                <Typography sx={{ color: "#94A3B8", fontWeight: 600, fontSize: "0.7rem" }}>
                  Official Commercial Solar Energy Proposal
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ rowGap: 1 }}>
              <Chip
                icon={isAccepted ? <VerifiedIcon sx={{ color: "#FFFFFF !important", fontSize: "14px !important" }} /> : undefined}
                label={isAccepted ? "Accepted Online" : `Status: ${quotation.status || "Sent"}`}
                size="small"
                sx={{
                  bgcolor: isAccepted ? "#16A34A" : "rgba(255,255,255,0.12)",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "0.74rem",
                  height: 32,
                  px: 0.5,
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              />

              <Button
                variant="contained"
                size="small"
                startIcon={<WhatsAppIcon sx={{ fontSize: 16 }} />}
                onClick={handleShareWhatsApp}
                sx={{
                  bgcolor: "#16A34A",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  textTransform: "none",
                  height: 32,
                  px: 1.5,
                  borderRadius: "8px",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#15803D", boxShadow: "0 2px 6px rgba(22,163,74,0.3)" },
                }}
              >
                WhatsApp Share
              </Button>

              <Button
                variant="contained"
                size="small"
                startIcon={<EmailIcon sx={{ fontSize: 16 }} />}
                onClick={handleShareEmail}
                sx={{
                  bgcolor: "#334155",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  textTransform: "none",
                  height: 32,
                  px: 1.5,
                  borderRadius: "8px",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#1E293B", boxShadow: "0 2px 6px rgba(51,65,85,0.3)" },
                }}
              >
                Email
              </Button>

              <Button
                variant="contained"
                size="small"
                startIcon={<PictureAsPdfIcon sx={{ fontSize: 16 }} />}
                onClick={handleDownloadPdf}
                sx={{
                  bgcolor: "#D97706",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  textTransform: "none",
                  height: 32,
                  px: 1.5,
                  borderRadius: "8px",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#B45309", boxShadow: "0 2px 6px rgba(217,119,6,0.3)" },
                }}
              >
                Download PDF
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<PrintIcon sx={{ fontSize: 16 }} />}
                onClick={() => window.print()}
                sx={{
                  borderColor: "rgba(255,255,255,0.3)",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  textTransform: "none",
                  height: 32,
                  px: 1.5,
                  borderRadius: "8px",
                  "&:hover": { borderColor: "#FFFFFF", bgcolor: "rgba(255,255,255,0.1)" },
                }}
              >
                Print
              </Button>

              <Button
                variant="contained"
                size="small"
                startIcon={<ReceiptLongIcon sx={{ fontSize: 16 }} />}
                onClick={() => setOpenConvertInvoiceModal(true)}
                sx={{
                  bgcolor: "#0284C7",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  textTransform: "none",
                  height: 32,
                  px: 1.6,
                  borderRadius: "8px",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#0369A1", boxShadow: "0 2px 6px rgba(2,132,199,0.3)" },
                }}
              >
                Convert to Invoice ➔
              </Button>

              {!isAccepted && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                  onClick={() => setOpenAcceptModal(true)}
                  sx={{
                    bgcolor: "#16A34A",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    textTransform: "none",
                    height: 32,
                    px: 1.8,
                    borderRadius: "8px",
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#15803D", boxShadow: "0 2px 6px rgba(22,163,74,0.3)" },
                  }}
                >
                  Accept Proposal
                </Button>
              )}
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* MAIN 1-PAGE PROFESSIONAL EXECUTIVE SOLAR QUOTATION SHEET */}
      <Container maxWidth="md" sx={{ mt: 2.5, mb: 3 }}>
        {acceptedSuccess && (
          <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />} className="no-print" sx={{ mb: 2, borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600 }}>
            Thank you! You have successfully accepted this solar proposal online. Our engineering team will contact you shortly.
          </Alert>
        )}

        <Paper
          id="printable-zoho-quotation"
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: "10px",
            bgcolor: "#FFFFFF",
            border: "1px solid #CBD5E1",
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            color: "#0F172A",
            fontFamily: "'Inter', sans-serif",
            boxSizing: "border-box",
            width: "100%",
            maxWidth: "794px",
            mx: "auto",
          }}
        >
          {/* ============================================================ */}
          {/* 1. HEADER: COMPANY BRANDING & QUOTATION METADATA             */}
          {/* ============================================================ */}
          <Box
            sx={{
              pb: 1.5,
              borderBottom: "2px solid #0F172A",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              width: "100%",
              boxSizing: "border-box",
              gap: 2,
            }}
          >
            {/* Left: Logo + Company Name + Address + Contact from Settings */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                {logoSrc ? (
                  <Box
                    component="img"
                    src={logoSrc}
                    alt={displayCompanyName}
                    onError={() => setLogoSrc(null)}
                    sx={{ maxHeight: 44, maxWidth: 140, objectFit: "contain" }}
                  />
                ) : (
                  <Box sx={{ width: 40, height: 40, border: "1.5px solid #0F172A", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px" }}>
                    <SolarPowerIcon sx={{ color: "#0F172A", fontSize: 24 }} />
                  </Box>
                )}
                <Box>
                  <Typography sx={{ fontWeight: 900, color: "#0F172A", fontSize: "1.05rem", lineHeight: 1.2 }}>
                    {displayCompanyName}
                  </Typography>
                  {companyFullAddress && (
                    <Typography sx={{ color: "#475569", fontSize: "0.68rem", mt: 0.2, lineHeight: 1.25 }}>
                      {companyFullAddress}
                    </Typography>
                  )}
                  <Typography sx={{ color: "#475569", fontSize: "0.66rem", mt: 0.2, fontWeight: 600 }}>
                    {[companyPhone ? `Tel: ${companyPhone}` : "", companyEmail, companyWebsite].filter(Boolean).join(" • ")}
                  </Typography>
                  {company?.gst_number && (
                    <Typography sx={{ color: "#0F172A", fontSize: "0.66rem", fontWeight: 700, mt: 0.1 }}>
                      GSTIN: {company.gst_number} {company?.pan_number ? `| PAN: ${company.pan_number}` : ""}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Box>

            {/* Right: Quotation Number, Date, Valid Until, Status */}
            <Box sx={{ flexShrink: 0, textAlign: "right" }}>
              <Typography sx={{ fontSize: "1.1rem", fontWeight: 900, color: "#0F172A", letterSpacing: "0.02em", textTransform: "uppercase" }}>
                SOLAR QUOTATION
              </Typography>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: "#0F172A", fontFamily: "monospace", mt: 0.2 }}>
                Ref: #{quotation.quotation_number}
              </Typography>
              <Stack spacing={0.15} sx={{ mt: 0.4, fontSize: "0.68rem", color: "#475569" }}>
                <div><strong>Date:</strong> {formatDate(quotation.created_at)}</div>
                <div><strong>Valid Until:</strong> {quotation.valid_until ? formatDate(quotation.valid_until) : "30 Days from Issue"}</div>
                <div>
                  <strong>Status:</strong>{" "}
                  <span style={{ color: isAccepted ? "#16A34A" : "#0F172A", fontWeight: 800 }}>
                    {quotation.status || "Sent"}
                  </span>
                </div>
              </Stack>
            </Box>
          </Box>

          {/* ============================================================ */}
          {/* 2. CLIENT & PROJECT SITE SUMMARY CARD                        */}
          {/* ============================================================ */}
          <Box
            sx={{
              my: 1.5,
              p: 1.6,
              px: 2,
              bgcolor: "#F8FAFC",
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              boxSizing: "border-box",
              gap: 2,
            }}
          >
            {/* Left Column: Prepared for / Site details */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: "0.62rem", color: "#64748B", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                PREPARED FOR / SITE LOCATION:
              </Typography>
              <Typography sx={{ fontWeight: 800, color: "#0F172A", fontSize: "0.95rem", mt: 0.25, letterSpacing: "-0.01em" }}>
                {quotation.customer_name}
              </Typography>
              <Typography sx={{ color: "#475569", fontSize: "0.72rem", mt: 0.15, lineHeight: 1.3 }}>
                {[quotation.customer_address, quotation.city, quotation.state, quotation.pincode].filter(Boolean).join(", ") || "Site Address"}
              </Typography>
              <Typography sx={{ color: "#475569", fontSize: "0.7rem", fontWeight: 600, mt: 0.3 }}>
                Phone: <strong style={{ color: "#0F172A" }}>{quotation.customer_phone || "—"}</strong> {quotation.customer_email ? ` • Email: ${quotation.customer_email}` : ""}
              </Typography>
            </Box>

            {/* Right Column: Proposed System Capacity Card - Cleanly docked on the right side */}
            <Box
              sx={{
                flexShrink: 0,
                p: 1.4,
                px: 2.2,
                bgcolor: "#FFFFFF",
                borderRadius: "8px",
                border: "1.5px solid #CBD5E1",
                textAlign: "right",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                minWidth: "220px",
              }}
            >
              <Typography sx={{ fontSize: "0.62rem", color: "#64748B", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                PROPOSED SYSTEM CAPACITY
              </Typography>
              <Typography sx={{ fontSize: "1.25rem", color: "#0284C7", fontWeight: 900, lineHeight: 1.2, my: 0.2 }}>
                {quotation.system_capacity_kw} kWp
              </Typography>
              <Typography sx={{ fontSize: "0.68rem", color: "#475569", fontWeight: 700 }}>
                {quotation.system_type || "On-Grid Net-Metered"} Power Plant
              </Typography>
            </Box>
          </Box>

          {/* ============================================================ */}
          {/* 3. TECHNICAL SPECIFICATIONS & HARDWARE BAR                   */}
          {/* ============================================================ */}
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ bgcolor: "#F1F5F9", py: 0.5, px: 1.2, borderLeft: "3px solid #0F172A", mb: 0.8 }}>
              <Typography sx={{ fontWeight: 800, color: "#0F172A", fontSize: "0.74rem", textTransform: "uppercase" }}>
                1. System Specifications &amp; Hardware Included
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 1.2,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <Box sx={{ p: 1, bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "6px" }}>
                <Typography sx={{ fontSize: "0.6rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>PV MODULES</Typography>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: "#0F172A", mt: 0.2 }}>
                  {quotation.panel_brand || "Waaree Mono PERC"}
                </Typography>
                <Typography sx={{ fontSize: "0.64rem", color: "#475569", mt: 0.1 }}>
                  {quotation.panel_count ? `${quotation.panel_count} Nos (550Wp)` : "550Wp Half-Cut"}
                </Typography>
              </Box>

              <Box sx={{ p: 1, bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "6px" }}>
                <Typography sx={{ fontSize: "0.6rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>SOLAR INVERTER</Typography>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: "#0F172A", mt: 0.2 }}>
                  {quotation.inverter_brand || "Growatt / Solis"}
                </Typography>
                <Typography sx={{ fontSize: "0.64rem", color: "#475569", mt: 0.1 }}>
                  {quotation.inverter_capacity_kw || quotation.system_capacity_kw} kW Grid-Tie MPPT
                </Typography>
              </Box>

              <Box sx={{ p: 1, bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "6px" }}>
                <Typography sx={{ fontSize: "0.6rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>STRUCTURE</Typography>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: "#0F172A", mt: 0.2 }}>
                  HDGI Elevated
                </Typography>
                <Typography sx={{ fontSize: "0.64rem", color: "#475569", mt: 0.1 }}>
                  {quotation.structure_type || "150 km/h Wind Rated"}
                </Typography>
              </Box>

              <Box sx={{ p: 1, bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "6px" }}>
                <Typography sx={{ fontSize: "0.6rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>WARRANTY &amp; BOS</Typography>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: "#16A34A", mt: 0.2 }}>
                  25Y Performance
                </Typography>
                <Typography sx={{ fontSize: "0.64rem", color: "#475569", mt: 0.1 }}>
                  10Y Inverter • Turnkey
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* ============================================================ */}
          {/* 4. COMMERCIAL SYSTEM BUDGET BREAKDOWN TABLE                  */}
          {/* ============================================================ */}
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ bgcolor: "#F1F5F9", py: 0.5, px: 1.2, borderLeft: "3px solid #0F172A", mb: 0.8 }}>
              <Typography sx={{ fontWeight: 800, color: "#0F172A", fontSize: "0.74rem", textTransform: "uppercase" }}>
                2. Commercial Budget &amp; Subsidy Breakdown
              </Typography>
            </Box>

            <TableContainer component={Box} sx={{ border: "1px solid #CBD5E1", borderRadius: "6px", overflow: "hidden" }}>
              <Table
                size="small"
                sx={{
                  "& .MuiTableRow-root:hover": {
                    backgroundColor: "inherit !important",
                  },
                }}
              >
                <TableHead>
                  <TableRow sx={{ bgcolor: "#0F172A", "&:hover": { bgcolor: "#0F172A !important" } }}>
                    <TableCell sx={{ color: "#FFFFFF !important", fontWeight: 800, fontSize: "0.72rem", py: 0.7 }}>
                      SERVICE / ITEM PARTICULAR
                    </TableCell>
                    <TableCell align="right" sx={{ color: "#FFFFFF !important", fontWeight: 800, fontSize: "0.72rem", py: 0.7 }}>
                      AMOUNT (RS.)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Base Solar EPC System Cost */}
                  <TableRow sx={{ borderBottom: "1px solid #E2E8F0", "&:hover": { bgcolor: "transparent !important" } }}>
                    <TableCell sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#0F172A", py: 0.5 }}>
                      Base Solar EPC System Hardware ({quotation.system_capacity_kw} kW Plant Modules &amp; Inverter)
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#0F172A", py: 0.5 }}>
                      Rs. {finalBase.toLocaleString("en-IN")}.00
                    </TableCell>
                  </TableRow>

                  {/* Mounting Structure & Installation */}
                  {finalStructure > 0 && (
                    <TableRow sx={{ borderBottom: "1px solid #E2E8F0", "&:hover": { bgcolor: "transparent !important" } }}>
                      <TableCell sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#0F172A", py: 0.5 }}>
                        Elevated HDGI Mounting Structure &amp; On-Site Technical Installation Charges
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#0F172A", py: 0.5 }}>
                        Rs. {finalStructure.toLocaleString("en-IN")}.00
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Promotional Discount (if any) */}
                  {numDiscount > 0 && (
                    <TableRow sx={{ borderBottom: "1px solid #E2E8F0", bgcolor: "#F0FDF4", "&:hover": { bgcolor: "#F0FDF4 !important" } }}>
                      <TableCell sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#16A34A", py: 0.5 }}>
                        Special Promotional Discount
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.72rem", fontWeight: 800, color: "#16A34A", py: 0.5 }}>
                        - Rs. {numDiscount.toLocaleString("en-IN")}.00
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Subtotal Taxable Value */}
                  <TableRow sx={{ borderBottom: "1px solid #E2E8F0", bgcolor: "#F8FAFC", "&:hover": { bgcolor: "#F8FAFC !important" } }}>
                    <TableCell sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#475569", py: 0.5 }}>
                      Subtotal (Net System Taxable Value)
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", py: 0.5 }}>
                      Rs. {subtotalBeforeGst.toLocaleString("en-IN")}.00
                    </TableCell>
                  </TableRow>

                  {/* Applicable Solar GST */}
                  <TableRow sx={{ borderBottom: "1px solid #E2E8F0", "&:hover": { bgcolor: "transparent !important" } }}>
                    <TableCell sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#0F172A", py: 0.5 }}>
                      Applicable Solar GST @ {numGstRate}%
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#0F172A", py: 0.5 }}>
                      Rs. {numGstAmount.toLocaleString("en-IN")}.00
                    </TableCell>
                  </TableRow>

                  {/* Total Gross System Investment */}
                  <TableRow sx={{ borderBottom: "1px solid #CBD5E1", bgcolor: "#F1F5F9", "&:hover": { bgcolor: "#F1F5F9 !important" } }}>
                    <TableCell sx={{ fontSize: "0.72rem", fontWeight: 800, color: "#0F172A", py: 0.6 }}>
                      Total Gross System Investment (Inclusive of GST)
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: "0.76rem", fontWeight: 800, color: "#0F172A", py: 0.6 }}>
                      Rs. {totalGrossInvestment.toLocaleString("en-IN")}.00
                    </TableCell>
                  </TableRow>

                  {/* PM Surya Ghar Govt. Subsidy */}
                  {numSubsidy > 0 && (
                    <TableRow sx={{ borderBottom: "1px solid #86EFAC", bgcolor: "#DCFCE7", "&:hover": { bgcolor: "#DCFCE7 !important" } }}>
                      <TableCell sx={{ fontSize: "0.72rem", fontWeight: 800, color: "#15803D", py: 0.6 }}>
                        PM Surya Ghar Govt. Central Financial Assistance (Direct DBT Subsidy)
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: "0.8rem", fontWeight: 900, color: "#15803D", py: 0.6 }}>
                        - Rs. {numSubsidy.toLocaleString("en-IN")}.00
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Final Net Customer Payable */}
                  <TableRow
                    sx={{
                      bgcolor: "#0F172A !important",
                      "&:hover": {
                        bgcolor: "#0F172A !important",
                      },
                      "& td": {
                        color: "#FFFFFF !important",
                        bgcolor: "#0F172A !important",
                      },
                    }}
                  >
                    <TableCell sx={{ color: "#FFFFFF !important", fontWeight: 900, fontSize: "0.84rem", py: 0.8 }}>
                      FINAL NET CUSTOMER INVESTMENT PAYABLE
                    </TableCell>
                    <TableCell align="right" sx={{ color: "#FFFFFF !important", fontWeight: 900, fontSize: "1rem", py: 0.8 }}>
                      Rs. {numNetPayable.toLocaleString("en-IN")}.00
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* ============================================================ */}
          {/* 5. PAYMENT TERMS & SCOPE (COMPACT SIDE BY SIDE)              */}
          {/* ============================================================ */}
          <Box sx={{ mb: 1.5 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1.2,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <Box sx={{ p: 1.2, border: "1px solid #E2E8F0", borderRadius: "6px", bgcolor: "#FAFAFA", boxSizing: "border-box" }}>
                <Typography sx={{ fontSize: "0.6rem", color: "#64748B", fontWeight: 800, textTransform: "uppercase" }}>
                  PAYMENT TERMS &amp; METHODS
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: "#0F172A", mt: 0.25 }}>
                  20% Advance • 70% Material Dispatch • 10% Net-Metering
                </Typography>
                <Typography sx={{ fontSize: "0.64rem", color: "#475569", mt: 0.2 }}>
                  Modes: <strong>Bank Transfer / NEFT / RTGS / Cheque / UPI</strong>
                </Typography>
              </Box>

              <Box sx={{ p: 1.2, border: "1px solid #E2E8F0", borderRadius: "6px", bgcolor: "#FAFAFA", boxSizing: "border-box" }}>
                <Typography sx={{ fontSize: "0.6rem", color: "#64748B", fontWeight: 800, textTransform: "uppercase" }}>
                  SCOPE &amp; STATUTORY COMPLIANCE
                </Typography>
                <Typography sx={{ fontSize: "0.66rem", color: "#334155", mt: 0.25, lineHeight: 1.35 }}>
                  Turnkey execution with complete DISCOM liaisoning, testing, and net-meter setup. Quoted prices include complete supply &amp; transit insurance.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* ============================================================ */}
          {/* 6. SIGNATURES & ACCEPTANCE (ELEGANT CORPORATE BLOCK)         */}
          {/* ============================================================ */}
          <Box sx={{ pt: 1.2, borderTop: "1px dashed #CBD5E1", mb: 1.2 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1.5,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <Box sx={{ p: 1.4, border: "1px solid #E2E8F0", borderRadius: "6px", bgcolor: "#FAFAFA", boxSizing: "border-box" }}>
                <Typography sx={{ fontSize: "0.6rem", color: "#64748B", fontWeight: 800, textTransform: "uppercase" }}>
                  FOR {displayCompanyName.toUpperCase()}
                </Typography>

                <Box sx={{ my: 1.2, height: 22, display: "flex", alignItems: "flex-end" }}>
                  <Typography sx={{ fontSize: "0.7rem", color: "#94A3B8", letterSpacing: "0.1em" }}>
                    ___________________________
                  </Typography>
                </Box>

                <Typography sx={{ fontSize: "0.76rem", fontWeight: 800, color: "#0F172A" }}>
                  Authorized Company Signatory
                </Typography>
                <Typography sx={{ fontSize: "0.64rem", color: "#64748B", mt: 0.2 }}>
                  {displayCompanyName} {companyPhone ? `• Tel: ${companyPhone}` : ""}
                </Typography>
              </Box>

              <Box sx={{ p: 1.4, border: isAccepted ? "1.5px solid #16A34A" : "1px solid #E2E8F0", borderRadius: "6px", bgcolor: isAccepted ? "#F0FDF4" : "#FAFAFA", boxSizing: "border-box" }}>
                <Typography sx={{ fontSize: "0.6rem", color: isAccepted ? "#15803D" : "#64748B", fontWeight: 800, textTransform: "uppercase" }}>
                  CUSTOMER ACCEPTANCE CONFIRMATION
                </Typography>

                <Box sx={{ my: 1.2, minHeight: 22, display: "flex", alignItems: "center" }}>
                  {isAccepted ? (
                    <Stack direction="row" alignItems="center" spacing={0.6}>
                      <CheckCircleIcon sx={{ color: "#16A34A", fontSize: 16 }} />
                      <Typography sx={{ fontSize: "0.76rem", fontWeight: 800, color: "#14532D" }}>
                        Digitally Accepted by {quotation.customer_signature_name || quotation.customer_name}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography sx={{ fontSize: "0.7rem", color: "#94A3B8", letterSpacing: "0.1em" }}>
                      ___________________________
                    </Typography>
                  )}
                </Box>

                <Typography sx={{ fontSize: "0.76rem", fontWeight: 800, color: "#0F172A" }}>
                  {quotation.customer_name}
                </Typography>
                <Typography sx={{ fontSize: "0.64rem", color: "#64748B", mt: 0.2 }}>
                  {isAccepted && quotation.accepted_at ? `Confirmed Online on ${formatDate(quotation.accepted_at)}` : "Customer Signature / Acceptance"}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* ============================================================ */}
          {/* 7. DOCUMENT COMPACT FOOTER STRIP                             */}
          {/* ============================================================ */}
          <Box sx={{ pt: 0.8, borderTop: "1px solid #E2E8F0", textAlign: "center" }}>
            <Typography sx={{ color: "#64748B", fontSize: "0.64rem", fontWeight: 600 }}>
              {displayCompanyName} {companyFullAddress ? `• ${companyFullAddress} ` : ""}{companyPhone ? `• Tel: ${companyPhone} ` : ""}{companyWebsite ? `• ${companyWebsite}` : ""}
            </Typography>
            <Typography sx={{ color: "#94A3B8", fontSize: "0.58rem", mt: 0.2 }}>
              Official system-generated commercial quotation issued via Solar CRM Platform. Valid subject to site feasibility.
            </Typography>
          </Box>
        </Paper>
      </Container>

      {/* Accept Proposal Confirmation Dialog */}
      <Dialog open={openAcceptModal} onClose={() => setOpenAcceptModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "12px", p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A", fontSize: "1rem" }}>
          Confirm Proposal Acceptance
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#64748B", mb: 2, fontSize: "0.82rem" }}>
            By accepting, you confirm your approval of the solar system specifications ({quotation.system_capacity_kw} kW) and net payable investment of {formatIndianCurrency(quotation.net_payable_amount)}.
          </Typography>

          <TextField
            fullWidth
            required
            size="small"
            label="Digital Signature / Full Name"
            value={signatureName}
            onChange={(e) => setSignatureName(e.target.value)}
            helperText="Please enter your full name as digital approval confirmation"
          />
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: "1px solid #E2E8F0" }}>
          <Button onClick={() => setOpenAcceptModal(false)} sx={{ color: "#64748B", fontWeight: 700, fontSize: "0.78rem" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAcceptSubmit}
            disabled={accepting}
            sx={{ bgcolor: "#16A34A", color: "#FFFFFF", fontWeight: 800, px: 2.5, height: 32, borderRadius: "6px", "&:hover": { bgcolor: "#15803D" } }}
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
