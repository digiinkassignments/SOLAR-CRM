import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  TextField,
  Chip,
  Paper,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailIcon from "@mui/icons-material/Email";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CakeIcon from "@mui/icons-material/Cake";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import VerifiedIcon from "@mui/icons-material/Verified";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";

import { getSettings } from "../../services/settingsService";
import { sendClientWish } from "../../services/leadService";
import defaultLogo from "../../assets/logo_without_bg.png";

// ============================================================
// CURATED CELEBRATION WISHES PRESETS (PROFESSIONAL & HEARTFELT)
// ============================================================
const PRESETS = {
  birthday: [
    {
      title: "👑 Executive & Prestigious",
      text: "Warmest greetings on your Birthday! May your special day and the year ahead be powered with immense happiness, radiant health, and grand success. Thank you for illuminating our journey as a cherished member of our Solar family.",
    },
    {
      title: "☀️ Warm & Solar Inspired",
      text: "On your special day, we wish you a life illuminated by bright sunshine, cheerful moments, and boundless prosperity. May your path ahead shine as bright and green as the clean energy powering our future. Happy Birthday!",
    },
    {
      title: "💫 Prosperity & Blessings",
      text: "May this auspicious birthday usher in endless peace, grand milestones, and treasured memories with your loved ones. Wishing you abundant joy today and ever-increasing prosperity in the days ahead!",
    },
    {
      title: "🥂 Short & Joyous",
      text: "Wishing you a very Happy Birthday! Here is to celebrating your wonderful journey, surrounded by warmth, laughter, and grand achievements. Have a truly magnificent celebration!",
    },
  ],
  anniversary: [
    {
      title: "💍 Golden Milestone",
      text: "Heartiest congratulations on your Wedding Anniversary! May your sacred bond of love, respect, and companionship grow stronger and brighter with each passing year. Wishing you both a lifetime of happiness, peace, and togetherness.",
    },
    {
      title: "🌟 Enduring Harmony",
      text: "Warmest anniversary wishes to an inspiring couple! Honoring your beautiful journey of shared dreams and mutual triumphs. May the warmth of love always illuminate your home. Happy Anniversary!",
    },
    {
      title: "🥂 Joyous Celebration",
      text: "Sending our warmest greetings on your anniversary! Wishing you both joyful moments, fond reflections, and continued harmony as you celebrate another glorious milestone together.",
    },
  ],
};

// ============================================================
// 6 DISTINCT PROFESSIONAL TEMPLATES DEFINITIONS
// ============================================================
const TEMPLATES_CONFIG = {
  template1: {
    id: "template1",
    name: "Royal 24K Gold",
    subtitle: "Midnight Noir & Liquid Gold",
    swatchColor: "#F59E0B",
    accent: "#F59E0B",
    borderFoil: "#EAB308",
    innerLine: "rgba(245, 158, 11, 0.45)",
    bgGradient: "radial-gradient(ellipse at 50% 25%, #182238 0%, #0D1424 50%, #050811 100%)",
    titleGradient: "linear-gradient(135deg, #FFFBEB 0%, #FEF08A 25%, #F59E0B 55%, #D97706 80%, #FBBF24 100%)",
    plaqueBg: "rgba(10, 16, 30, 0.72)",
    plaqueBorder: "1px solid rgba(245, 158, 11, 0.3)",
    plaqueShadow: "inset 0 1px 1px rgba(255,255,255,0.1), 0 10px 24px rgba(0,0,0,0.5)",
    textColor: "#E2E8F0",
    recipientColor: "#FFFFFF",
    companyColor: "#F8FAFC",
    quoteGlyph: "#F59E0B",
    footerBorder: "linear-gradient(90deg, transparent, #F59E0B, transparent)",
    footerTitle: "#FDE68A",
    footerMuted: "#94A3B8",
    isLight: false,
  },
  template2: {
    id: "template2",
    name: "Ivory & Champagne",
    subtitle: "Whitish Luxury & Gold Foil",
    swatchColor: "#B8860B",
    accent: "#B8860B",
    borderFoil: "#D4AF37",
    innerLine: "rgba(184, 134, 11, 0.35)",
    bgGradient: "radial-gradient(ellipse at 50% 20%, #FFFFFF 0%, #FAF8F5 45%, #F4EFE6 100%)",
    titleGradient: "linear-gradient(135deg, #4A3B2C 0%, #7A5C3E 35%, #B8860B 70%, #5C4328 100%)",
    plaqueBg: "rgba(255, 255, 255, 0.95)",
    plaqueBorder: "1px solid rgba(184, 134, 11, 0.3)",
    plaqueShadow: "0 8px 24px rgba(74, 59, 44, 0.08)",
    textColor: "#2D251E",
    recipientColor: "#1A140E",
    companyColor: "#3D3126",
    quoteGlyph: "#B8860B",
    footerBorder: "linear-gradient(90deg, transparent, #B8860B, transparent)",
    footerTitle: "#5C4328",
    footerMuted: "#786553",
    isLight: true,
  },
  template3: {
    id: "template3",
    name: "Sapphire Corporate",
    subtitle: "Deep Navy & Electric Silver",
    swatchColor: "#38BDF8",
    accent: "#38BDF8",
    borderFoil: "#2563EB",
    innerLine: "rgba(56, 189, 248, 0.4)",
    bgGradient: "radial-gradient(ellipse at 50% 25%, #0F2042 0%, #081226 55%, #030814 100%)",
    titleGradient: "linear-gradient(135deg, #FFFFFF 0%, #E0F2FE 30%, #7DD3FC 70%, #38BDF8 100%)",
    plaqueBg: "rgba(6, 18, 38, 0.72)",
    plaqueBorder: "1px solid rgba(56, 189, 248, 0.3)",
    plaqueShadow: "inset 0 1px 1px rgba(255,255,255,0.1), 0 10px 24px rgba(0,0,0,0.5)",
    textColor: "#F0F9FF",
    recipientColor: "#FFFFFF",
    companyColor: "#E0F2FE",
    quoteGlyph: "#38BDF8",
    footerBorder: "linear-gradient(90deg, transparent, #38BDF8, transparent)",
    footerTitle: "#BAE6FD",
    footerMuted: "#7DD3FC",
    isLight: false,
  },
  template4: {
    id: "template4",
    name: "Emerald Sovereign",
    subtitle: "Velvet Emerald & Mint Platinum",
    swatchColor: "#10B981",
    accent: "#10B981",
    borderFoil: "#059669",
    innerLine: "rgba(52, 211, 153, 0.4)",
    bgGradient: "radial-gradient(ellipse at 50% 25%, #064E3B 0%, #022C22 55%, #01140E 100%)",
    titleGradient: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 30%, #A7F3D0 65%, #34D399 100%)",
    plaqueBg: "rgba(2, 44, 34, 0.65)",
    plaqueBorder: "1px solid rgba(52, 211, 153, 0.3)",
    plaqueShadow: "inset 0 1px 1px rgba(255,255,255,0.1), 0 10px 24px rgba(0,0,0,0.5)",
    textColor: "#ECFDF5",
    recipientColor: "#FFFFFF",
    companyColor: "#A7F3D0",
    quoteGlyph: "#34D399",
    footerBorder: "linear-gradient(90deg, transparent, #34D399, transparent)",
    footerTitle: "#A7F3D0",
    footerMuted: "#6EE7B7",
    isLight: false,
  },
  template5: {
    id: "template5",
    name: "Sunrise Amber",
    subtitle: "Warm Festive Glow & Rose Gold",
    swatchColor: "#EA580C",
    accent: "#B45309",
    borderFoil: "#C2410C",
    innerLine: "rgba(180, 83, 9, 0.35)",
    bgGradient: "radial-gradient(ellipse at 50% 20%, #FFFDF7 0%, #FEF3C7 45%, #FDE68A 85%, #F59E0B 100%)",
    titleGradient: "linear-gradient(135deg, #78350F 0%, #9A3412 35%, #B45309 70%, #78350F 100%)",
    plaqueBg: "rgba(255, 255, 255, 0.9)",
    plaqueBorder: "1px solid rgba(180, 83, 9, 0.3)",
    plaqueShadow: "0 8px 24px rgba(180, 83, 9, 0.12)",
    textColor: "#292524",
    recipientColor: "#1E293B",
    companyColor: "#78350F",
    quoteGlyph: "#B45309",
    footerBorder: "linear-gradient(90deg, transparent, #B45309, transparent)",
    footerTitle: "#78350F",
    footerMuted: "#57534E",
    isLight: true,
  },
  template6: {
    id: "template6",
    name: "Modern Titanium",
    subtitle: "Clean White & Slate Minimalist",
    swatchColor: "#475569",
    accent: "#334155",
    borderFoil: "#94A3B8",
    innerLine: "rgba(100, 116, 139, 0.3)",
    bgGradient: "linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 50%, #F1F5F9 100%)",
    titleGradient: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)",
    plaqueBg: "rgba(255, 255, 255, 0.96)",
    plaqueBorder: "1px solid #CBD5E1",
    plaqueShadow: "0 6px 20px rgba(15, 23, 42, 0.05)",
    textColor: "#1E293B",
    recipientColor: "#0F172A",
    companyColor: "#0F172A",
    quoteGlyph: "#F59E0B",
    footerBorder: "linear-gradient(90deg, transparent, #94A3B8, transparent)",
    footerTitle: "#0F172A",
    footerMuted: "#64748B",
    isLight: true,
  },
};

// ============================================================
// INLINE LUXURY ORNAMENTS
// ============================================================
const LuxuryCornerFiligree = ({ position = "top-left", color = "#F59E0B" }) => {
  const isTop = position.includes("top");
  const isLeft = position.includes("left");

  return (
    <Box
      sx={{
        position: "absolute",
        top: isTop ? 6 : "auto",
        bottom: !isTop ? 6 : "auto",
        left: isLeft ? 6 : "auto",
        right: !isLeft ? 6 : "auto",
        transform: `rotate(${isTop && isLeft ? 0 : isTop && !isLeft ? 90 : !isTop && !isLeft ? 180 : 270}deg)`,
        width: 32,
        height: 32,
        pointerEvents: "none",
        zIndex: 2,
        opacity: 0.85,
      }}
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        <path d="M4 4H96V10H10V96H4V4Z" fill={color} />
        <path d="M16 16H84V20H20V84H16V16Z" fill={color} fillOpacity="0.75" />
        <path d="M4 4C24 4 48 10 60 22C72 34 78 58 78 78H72C72 60 66 38 56 28C46 18 24 12 4 12V4Z" fill={color} fillOpacity="0.45" />
        <circle cx="34" cy="34" r="4.5" fill={color} />
        <circle cx="96" cy="7" r="3.5" fill={color} />
        <circle cx="7" cy="96" r="3.5" fill={color} />
      </svg>
    </Box>
  );
};

const LaurelSolarEmblem = ({ color = "#F59E0B" }) => (
  <Box sx={{ width: 68, height: 34, mx: "auto", mb: 0.3, pointerEvents: "none" }}>
    <svg viewBox="0 0 140 76" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <path d="M54 44C44 42 36 34 32 24C38 25 44 28 48 34" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M48 52C36 50 26 42 20 30C28 32 34 36 40 44" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M42 62C28 60 16 50 10 36C20 38 28 44 34 54" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M86 44C96 42 104 34 108 24C102 25 96 28 92 34" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M92 52C104 50 114 42 120 30C112 32 106 36 100 44" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M98 62C112 60 124 50 130 36C120 38 112 44 106 54" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="70" cy="38" r="12" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
      <circle cx="70" cy="38" r="5" fill={color} />
      <line x1="70" y1="16" x2="70" y2="21" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="70" y1="55" x2="70" y2="60" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="48" y1="38" x2="53" y2="38" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="87" y1="38" x2="92" y2="38" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  </Box>
);

const LuxuryGoldDivider = ({ color = "#F59E0B" }) => (
  <Box sx={{ width: "70%", maxWidth: 300, mx: "auto", my: 0.8, height: 12, pointerEvents: "none" }}>
    <svg viewBox="0 0 340 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <line x1="20" y1="8" x2="140" y2="8" stroke={color} strokeWidth="1.2" strokeOpacity="0.7" />
      <circle cx="130" cy="8" r="2" fill={color} />
      <line x1="200" y1="8" x2="320" y2="8" stroke={color} strokeWidth="1.2" strokeOpacity="0.7" />
      <circle cx="210" cy="8" r="2" fill={color} />
      <polygon points="170,1 174,8 170,15 166,8" fill={color} />
      <circle cx="170" cy="8" r="1.5" fill="#FFFFFF" />
    </svg>
  </Box>
);

export default function GreetingCardModal({
  open,
  onClose,
  lead,
  defaultEventType = "birthday",
}) {
  const cardRef = useRef(null);
  const [eventType, setEventType] = useState(defaultEventType);
  const [template, setTemplate] = useState("template2"); // Ivory & Champagne
  const [customWish, setCustomWish] = useState("");
  const [customRecipient, setCustomRecipient] = useState("");
  const [companyName, setCompanyName] = useState("Solar Power Solutions");
  const [companyPhone, setCompanyPhone] = useState("+91 98765 43210");
  const [companyWebsite, setCompanyWebsite] = useState("www.solarpower.com");
  const [companyLogo, setCompanyLogo] = useState(defaultLogo);
  const [downloading, setDownloading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (open && lead) {
      const type = defaultEventType || (Number(lead.is_anniversary_today) === 1 ? "anniversary" : "birthday");
      setEventType(type);
      setCustomRecipient(lead.customer_name || "Valued Customer");
      const defaultText = PRESETS[type]?.[0]?.text || "";
      setCustomWish(defaultText);
    }
  }, [open, lead, defaultEventType]);

  useEffect(() => {
    getSettings()
      .then((res) => {
        if (res?.data?.data) {
          const s = res.data.data;
          if (s.company_name) setCompanyName(s.company_name);
          if (s.company_phone) setCompanyPhone(s.company_phone);
          if (s.website) setCompanyWebsite(s.website);

          const rawLogo = s.company_logo || s.logo_url || s.logo;
          if (rawLogo) {
            if (rawLogo.startsWith("http://") || rawLogo.startsWith("https://") || rawLogo.startsWith("data:")) {
              setCompanyLogo(rawLogo);
            } else {
              let apiBase = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "";
              if (apiBase) {
                apiBase = apiBase.replace(/\/api\/?$/, "");
              } else {
                const protocol = window.location.protocol;
                const hostname = window.location.hostname || "localhost";
                const port = (window.location.port === "5173" || window.location.port === "3000") ? "5001" : (window.location.port || "");
                apiBase = port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`;
              }
              const cleanPath = rawLogo.includes("/")
                ? (rawLogo.startsWith("/") ? rawLogo : `/${rawLogo}`)
                : `/uploads/company/${rawLogo}`;
              setCompanyLogo(`${apiBase}${cleanPath}`);
            }
          } else {
            setCompanyLogo(defaultLogo);
          }
        }
      })
      .catch(() => {
        setCompanyLogo(defaultLogo);
      });
  }, []);

  if (!lead) return null;

  const isBirthday = eventType === "birthday";
  const recipientName = customRecipient.trim() || lead.customer_name || "Valued Customer";
  const themeTokens = TEMPLATES_CONFIG[template] || TEMPLATES_CONFIG.template2;

  // Download Card as 3x Ultra-HD PNG
  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 180));

      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const safeName = recipientName.replace(/[^a-zA-Z0-9]/g, "_");
      link.download = `${isBirthday ? "Birthday" : "Anniversary"}_Wish_${safeName}.png`;
      link.href = image;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("✨ Ultra-HD Greeting Card downloaded successfully!");
    } catch (err) {
      console.error("Card download error:", err);
      toast.error("Failed to generate card image. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // WhatsApp Share Handler
  const handleShareWhatsApp = () => {
    handleDownloadCard();

    const cleanPhone = (lead.mobile_number || "").replace(/\D/g, "");
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const fullMessage =
      `🎉 *${isBirthday ? "HAPPY BIRTHDAY!" : "HAPPY WEDDING ANNIVERSARY!"}* 🎉\n\n` +
      `Dear ${recipientName},\n\n` +
      `${customWish}\n\n` +
      `With warm regards & grand celebration wishes,\n` +
      `*${companyName}*\n` +
      (companyPhone ? `📞 ${companyPhone} ` : "") +
      (companyWebsite ? `• 🌐 ${companyWebsite}` : "");

    const encoded = encodeURIComponent(fullMessage);
    window.open(`https://wa.me/${phoneWithCountry}?text=${encoded}`, "_blank", "noopener,noreferrer");

    sendClientWish({
      lead_id: lead.id,
      event_type: eventType,
      channel: "whatsapp",
      custom_message: fullMessage,
    }).catch(() => {});

    toast.success("Card downloaded! Opening WhatsApp to share with client.");
  };

  // Email Wish Handler
  const handleSendEmail = async () => {
    if (!lead.email) {
      toast.error("Customer email address is not recorded.");
      return;
    }
    setSendingEmail(true);
    try {
      const res = await sendClientWish({
        lead_id: lead.id,
        event_type: eventType,
        channel: "email",
        custom_message: customWish,
      });
      if (res?.success) {
        toast.success(`Greeting email dispatched to ${lead.email}`);
      } else {
        throw new Error(res?.message || "Failed to dispatch email");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to send email.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCopyText = () => {
    const textToCopy = `Dear ${recipientName},\n\n${customWish}\n\nWarm regards,\n${companyName}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success("Message copied to clipboard!");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          bgcolor: "#FFFFFF",
          color: "#0F172A",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.16)",
          border: "1px solid #E2E8F0",
          maxWidth: "1080px",
          m: 1.5,
        },
      }}
    >
      {/* ── TOP STUDIO NAVBAR (CLEAN & WHITE) ── */}
      <DialogTitle
        sx={{
          p: "14px 22px",
          bgcolor: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "8px",
              bgcolor: "#FEF3C7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#D97706",
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: "1rem", lineHeight: 1.2, color: "#0F172A" }}>
              Milestone Card Studio
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.72rem" }}>
              Creating luxury greeting card for: <strong style={{ color: "#0F172A" }}>{recipientName}</strong>
            </Typography>
          </Box>
        </Stack>

        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: "#64748B",
            bgcolor: "#F8FAFC",
            "&:hover": { color: "#0F172A", bgcolor: "#E2E8F0" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* ── DIALOG CONTENT: 50% / 50% SIDE-BY-SIDE SPLIT ── */}
      <DialogContent sx={{ p: { xs: 1.5, sm: 2.5 }, bgcolor: "#F8FAFC", overflowY: "auto" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2.5,
            alignItems: "flex-start",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* ══════════════════════════════════════════════════════════════
              LEFT SIDE: ALWAYS VISIBLE CARD PREVIEW (50% WIDTH)
              ══════════════════════════════════════════════════════════════ */}
          <Box
            sx={{
              flex: { xs: "1 1 100%", sm: "0 0 calc(50% - 10px)" },
              width: { xs: "100%", sm: "calc(50% - 10px)" },
              maxWidth: { xs: "100%", sm: "calc(50% - 10px)" },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: { sm: "sticky" },
              top: 0,
              boxSizing: "border-box",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                p: { xs: 1.5, sm: 2 },
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: "14px",
                bgcolor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 12px rgba(15, 23, 42, 0.04)",
                boxSizing: "border-box",
              }}
            >
              {/* ── THE LUXURY CARD RENDER TARGET ── */}
              <Box
                ref={cardRef}
                id="greeting-card-render-target"
                sx={{
                  width: "100%",
                  maxWidth: "440px",
                  minHeight: "340px",
                  position: "relative",
                  boxSizing: "border-box",
                  borderRadius: "12px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  background: themeTokens.bgGradient,
                  border: `3px solid ${themeTokens.borderFoil}`,
                  boxShadow: "0 14px 34px -8px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(0,0,0,0.06)",
                }}
              >
                {/* 4 PRECISION CORNER FLOURISHES */}
                <LuxuryCornerFiligree position="top-left" color={themeTokens.accent} />
                <LuxuryCornerFiligree position="top-right" color={themeTokens.accent} />
                <LuxuryCornerFiligree position="bottom-left" color={themeTokens.accent} />
                <LuxuryCornerFiligree position="bottom-right" color={themeTokens.accent} />

                {/* DOUBLE INNER CONCENTRIC FOIL BORDER */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 6,
                    left: 6,
                    right: 6,
                    bottom: 6,
                    border: `1.2px solid ${themeTokens.innerLine}`,
                    borderRadius: "8px",
                    pointerEvents: "none",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    top: 9,
                    left: 9,
                    right: 9,
                    bottom: 9,
                    border: `0.75px dashed ${themeTokens.innerLine}`,
                    borderRadius: "6px",
                    pointerEvents: "none",
                    opacity: 0.55,
                  }}
                />

                {/* ── CARD HEADER: COMPANY LOGO & TITLE (PROPER CORNER SPACING) ── */}
                <Box sx={{ p: "18px 24px 2px 24px", position: "relative", zIndex: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      {companyLogo ? (
                        <Box
                          component="img"
                          src={companyLogo}
                          alt={companyName}
                          crossOrigin="anonymous"
                          onError={() => setCompanyLogo(defaultLogo)}
                          sx={{
                            height: 32,
                            maxHeight: 34,
                            maxWidth: 100,
                            objectFit: "contain",
                            display: "block",
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: "6px",
                            bgcolor: themeTokens.isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.12)",
                            border: `1.2px solid ${themeTokens.accent}`,
                            color: themeTokens.accent,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <SolarPowerIcon sx={{ fontSize: 16 }} />
                        </Box>
                      )}

                      <Box>
                        <Typography
                          sx={{
                            fontSize: "0.74rem",
                            fontWeight: 800,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            fontFamily: "'Outfit', sans-serif",
                            color: themeTokens.companyColor,
                            lineHeight: 1.15,
                          }}
                        >
                          {companyName}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.52rem",
                            letterSpacing: "0.07em",
                            textTransform: "uppercase",
                            color: themeTokens.footerMuted,
                            fontWeight: 600,
                          }}
                        >
                          Solar Energy Excellence
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  {/* ── CARD HERO: LAUREL CREST & CELEBRATION HEADINGS ── */}
                  <Box sx={{ textAlign: "center", mt: 0.8, mb: 0.4 }}>
                    <LaurelSolarEmblem color={themeTokens.accent} />

                    <Typography
                      sx={{
                        fontSize: "0.62rem",
                        fontWeight: 800,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        fontFamily: "'Outfit', sans-serif",
                        color: themeTokens.accent,
                        mb: 0.2,
                      }}
                    >
                      {isBirthday ? "★ CELEBRATING YOUR SPECIAL DAY ★" : "★ COMMEMORATING SACRED MILESTONE ★"}
                    </Typography>

                    {/* Imperial Serif Headline */}
                    <Typography
                      sx={{
                        fontFamily: "'Cinzel', Georgia, serif",
                        fontWeight: 900,
                        fontSize: { xs: "1.45rem", sm: "1.65rem" },
                        letterSpacing: "0.03em",
                        lineHeight: 1.05,
                        textTransform: "uppercase",
                        background: themeTokens.titleGradient,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        filter: themeTokens.isLight ? "none" : "drop-shadow(0 2px 8px rgba(245, 158, 11, 0.35))",
                      }}
                    >
                      {isBirthday ? "HAPPY BIRTHDAY!" : "HAPPY ANNIVERSARY!"}
                    </Typography>

                    {/* Recipient Line */}
                    <Typography
                      sx={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontStyle: "italic",
                        fontSize: { xs: "0.98rem", sm: "1.1rem" },
                        fontWeight: 700,
                        mt: 0.3,
                        color: themeTokens.recipientColor,
                        textShadow: themeTokens.isLight ? "none" : "0 2px 6px rgba(0,0,0,0.5)",
                      }}
                    >
                      Honoring Dear {recipientName}
                    </Typography>

                    <LuxuryGoldDivider color={themeTokens.accent} />
                  </Box>
                </Box>

                {/* ── CARD BODY: THE HEARTFELT WISH PLAQUE ── */}
                <Box sx={{ px: { xs: "16px", sm: "22px" }, py: "2px", position: "relative", zIndex: 3, textAlign: "center" }}>
                  <Box
                    sx={{
                      p: "10px 14px",
                      borderRadius: "8px",
                      position: "relative",
                      background: themeTokens.plaqueBg,
                      border: themeTokens.plaqueBorder,
                      boxShadow: themeTokens.plaqueShadow,
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.76rem",
                        lineHeight: 1.5,
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 500,
                        color: themeTokens.textColor,
                        fontStyle: "normal",
                      }}
                    >
                      <span style={{ fontSize: "0.95rem", color: themeTokens.quoteGlyph, fontWeight: 900, marginRight: "3px" }}>“</span>
                      {customWish}
                      <span style={{ fontSize: "0.95rem", color: themeTokens.quoteGlyph, fontWeight: 900, marginLeft: "3px" }}>”</span>
                    </Typography>
                  </Box>
                </Box>

                {/* ── CARD FOOTER: SIGNATURE & CONTACT (PROPER CORNER SPACING) ── */}
                <Box sx={{ p: "8px 24px 16px 24px", position: "relative", zIndex: 3 }}>
                  <Box
                    sx={{
                      height: "1px",
                      mb: 0.8,
                      background: themeTokens.footerBorder,
                    }}
                  />

                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      sx={{
                        fontSize: "0.64rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        fontFamily: "'Outfit', sans-serif",
                        color: themeTokens.footerTitle,
                      }}
                    >
                      With Warm Regards: {companyName}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.55rem",
                        color: themeTokens.footerMuted,
                        mt: 0.2,
                        fontWeight: 500,
                        letterSpacing: "0.03em",
                      }}
                    >
                      {[companyPhone ? `Help: ${companyPhone}` : "", companyWebsite].filter(Boolean).join("  •  ")}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>

            <Typography variant="caption" sx={{ color: "#64748B", mt: 1, textAlign: "center", display: "block", fontSize: "0.7rem" }}>
              💡 Live Preview: Card updates in real-time as you customize.
            </Typography>
          </Box>

          {/* ══════════════════════════════════════════════════════════════
              RIGHT SIDE: CLEAN, SYMMETRICAL PERSONALIZER (50% WIDTH)
              ══════════════════════════════════════════════════════════════ */}
          <Box
            sx={{
              flex: { xs: "1 1 100%", sm: "0 0 calc(50% - 10px)" },
              width: { xs: "100%", sm: "calc(50% - 10px)" },
              maxWidth: { xs: "100%", sm: "calc(50% - 10px)" },
              boxSizing: "border-box",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                p: { xs: 2, sm: 2.5 },
                borderRadius: "14px",
                bgcolor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 12px rgba(15, 23, 42, 0.04)",
                boxSizing: "border-box",
              }}
            >
              <Stack spacing={2.2}>
                {/* 1. OCCASION SELECTOR */}
                <Box>
                  <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.6 }}>
                    1. Select Occasion:
                  </Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                    <Button
                      fullWidth
                      variant={isBirthday ? "contained" : "outlined"}
                      startIcon={<CakeIcon />}
                      onClick={() => {
                        setEventType("birthday");
                        setCustomWish(PRESETS.birthday[0].text);
                      }}
                      sx={{
                        height: 36,
                        borderRadius: "6px",
                        fontWeight: 800,
                        fontSize: "0.76rem",
                        textTransform: "none",
                        bgcolor: isBirthday ? "#0F172A" : "#FFFFFF",
                        color: isBirthday ? "#FFFFFF" : "#475569",
                        borderColor: isBirthday ? "#0F172A" : "#CBD5E1",
                        "&:hover": { bgcolor: isBirthday ? "#020617" : "#F8FAFC" },
                      }}
                    >
                      Birthday 🎂
                    </Button>
                    <Button
                      fullWidth
                      variant={!isBirthday ? "contained" : "outlined"}
                      startIcon={<FavoriteIcon />}
                      onClick={() => {
                        setEventType("anniversary");
                        setCustomWish(PRESETS.anniversary[0].text);
                      }}
                      sx={{
                        height: 36,
                        borderRadius: "6px",
                        fontWeight: 800,
                        fontSize: "0.76rem",
                        textTransform: "none",
                        bgcolor: !isBirthday ? "#7C3AED" : "#FFFFFF",
                        color: !isBirthday ? "#FFFFFF" : "#475569",
                        borderColor: !isBirthday ? "#7C3AED" : "#CBD5E1",
                        "&:hover": { bgcolor: !isBirthday ? "#6D28D9" : "#F8FAFC" },
                      }}
                    >
                      Anniversary 💍
                    </Button>
                  </Box>
                </Box>

                {/* 2. TEMPLATE SELECTOR (3x2 CLEAN SYMMETRICAL GRID) */}
                <Box>
                  <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.6 }}>
                    2. Choose Card Template:
                  </Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
                    {Object.values(TEMPLATES_CONFIG).map((tmpl) => {
                      const isSelected = template === tmpl.id;
                      return (
                        <Paper
                          key={tmpl.id}
                          elevation={0}
                          onClick={() => setTemplate(tmpl.id)}
                          sx={{
                            p: 0.8,
                            borderRadius: "6px",
                            cursor: "pointer",
                            border: isSelected ? "2px solid #0F172A" : "1px solid #E2E8F0",
                            bgcolor: isSelected ? "#F8FAFC" : "#FFFFFF",
                            textAlign: "center",
                            boxShadow: isSelected ? "0 2px 6px rgba(15, 23, 42, 0.08)" : "none",
                            transition: "all 0.15s ease",
                            "&:hover": { borderColor: "#0F172A", bgcolor: "#FAFBFC" },
                          }}
                        >
                          <Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: tmpl.swatchColor, mx: "auto", mb: 0.3, border: "1px solid rgba(0,0,0,0.1)" }} />
                          <Typography sx={{ fontSize: "0.68rem", fontWeight: isSelected ? 800 : 700, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {tmpl.name}
                          </Typography>
                        </Paper>
                      );
                    })}
                  </Box>
                </Box>

                {/* 3. RECIPIENT NAME INPUT */}
                <Box>
                  <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.6 }}>
                    3. Client Recipient Name:
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={customRecipient}
                    onChange={(e) => setCustomRecipient(e.target.value)}
                    placeholder="e.g. Ramesh Chandra Verma"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: 38,
                        borderRadius: "8px",
                        bgcolor: "#FAFBFC",
                        color: "#0F172A",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        "& fieldset": { borderColor: "#CBD5E1" },
                        "&:hover fieldset": { borderColor: "#94A3B8" },
                        "&.Mui-focused fieldset": { borderColor: "#0F172A", borderWidth: "1.5px" },
                      },
                    }}
                  />
                </Box>

                {/* 4. PERSONALIZED MESSAGE & PRESET CHIPS (PROPERLY EXPANDED & SPACED) */}
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
                    <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      4. Personalized Message:
                    </Typography>
                    <Typography sx={{ fontSize: "0.68rem", color: "#64748B", fontWeight: 600 }}>
                      {customWish.length} characters
                    </Typography>
                  </Box>

                  {/* Preset Quick-Selector Pills */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.7, mb: 1.2 }}>
                    {(PRESETS[eventType] || []).map((p, idx) => {
                      const isMatch = customWish === p.text;
                      return (
                        <Chip
                          key={idx}
                          label={p.title}
                          size="small"
                          onClick={() => setCustomWish(p.text)}
                          sx={{
                            fontSize: "0.69rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            height: 27,
                            borderRadius: "7px",
                            bgcolor: isMatch ? "#0F172A" : "#F8FAFC",
                            color: isMatch ? "#FFFFFF" : "#334155",
                            border: isMatch ? "1.5px solid #0F172A" : "1px solid #E2E8F0",
                            boxShadow: isMatch ? "0 2px 6px rgba(15, 23, 42, 0.1)" : "none",
                            transition: "all 0.15s ease",
                            "&:hover": {
                              bgcolor: isMatch ? "#020617" : "#F1F5F9",
                              borderColor: isMatch ? "#020617" : "#CBD5E1",
                            },
                          }}
                        />
                      );
                    })}
                  </Box>

                  {/* Premium Textarea Composer Box (Zero Awkward Scrollbar, Generous Breathing Room) */}
                  <Box
                    sx={{
                      borderRadius: "9px",
                      border: "1.5px solid #CBD5E1",
                      bgcolor: "#FFFFFF",
                      transition: "all 0.2s ease",
                      overflow: "hidden",
                      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                      "&:focus-within": {
                        borderColor: "#0F172A",
                        boxShadow: "0 0 0 3px rgba(15, 23, 42, 0.08)",
                      },
                    }}
                  >
                    <Box
                      component="textarea"
                      value={customWish}
                      onChange={(e) => setCustomWish(e.target.value)}
                      placeholder="Craft your personalized milestone wish here..."
                      rows={4}
                      sx={{
                        width: "100%",
                        display: "block",
                        boxSizing: "border-box",
                        p: "12px 14px 8px 14px",
                        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                        fontSize: "0.83rem",
                        fontWeight: 500,
                        lineHeight: 1.6,
                        color: "#0F172A",
                        bgcolor: "transparent",
                        border: "none",
                        outline: "none",
                        resize: "vertical",
                        minHeight: "108px",
                        scrollbarWidth: "thin",
                        scrollbarColor: "#CBD5E1 transparent",
                        "&::-webkit-scrollbar": {
                          width: "5px",
                        },
                        "&::-webkit-scrollbar-track": {
                          background: "transparent",
                        },
                        "&::-webkit-scrollbar-thumb": {
                          backgroundColor: "#CBD5E1",
                          borderRadius: "4px",
                        },
                        "&::-webkit-scrollbar-button": {
                          display: "none",
                          width: 0,
                          height: 0,
                        },
                      }}
                    />

                    {/* Bottom Status / Utility Bar */}
                    <Box
                      sx={{
                        px: 1.4,
                        py: 0.6,
                        bgcolor: "#F8FAFC",
                        borderTop: "1px solid #F1F5F9",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Stack direction="row" spacing={0.6} alignItems="center">
                        <AutoAwesomeIcon sx={{ fontSize: 13, color: "#D97706" }} />
                        <Typography sx={{ fontSize: "0.68rem", color: "#64748B", fontWeight: 600 }}>
                          Live synced to card preview
                        </Typography>
                      </Stack>

                      {customWish && (
                        <Typography
                          onClick={() => setCustomWish("")}
                          sx={{
                            fontSize: "0.68rem",
                            color: "#94A3B8",
                            cursor: "pointer",
                            fontWeight: 600,
                            "&:hover": { color: "#EF4444" },
                          }}
                        >
                          Clear Text
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* 5. BRANDING & CONTACT SIGNATURE (SYMMETRICAL 50/50 GRID WITH PROPER MARGIN) */}
                <Box sx={{ pt: 1 }}>
                  <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.6 }}>
                    5. Company Signature:
                  </Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Company Name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      InputLabelProps={{ sx: { color: "#64748B", fontSize: "0.74rem" } }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: 38,
                          borderRadius: "8px",
                          bgcolor: "#FAFBFC",
                          color: "#0F172A",
                          fontSize: "0.78rem",
                          "& fieldset": { borderColor: "#CBD5E1" },
                          "&:hover fieldset": { borderColor: "#94A3B8" },
                          "&.Mui-focused fieldset": { borderColor: "#0F172A", borderWidth: "1.5px" },
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Helpline Phone"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      InputLabelProps={{ sx: { color: "#64748B", fontSize: "0.74rem" } }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: 38,
                          borderRadius: "8px",
                          bgcolor: "#FAFBFC",
                          color: "#0F172A",
                          fontSize: "0.78rem",
                          "& fieldset": { borderColor: "#CBD5E1" },
                          "&:hover fieldset": { borderColor: "#94A3B8" },
                          "&.Mui-focused fieldset": { borderColor: "#0F172A", borderWidth: "1.5px" },
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Box>
      </DialogContent>

      {/* ── BOTTOM ACTIONS DOCK (CLEAN WHITE) ── */}
      <DialogActions
        sx={{
          p: "12px 22px",
          bgcolor: "#FFFFFF",
          borderTop: "1px solid #E2E8F0",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.2,
        }}
      >
        <Button
          size="small"
          variant="outlined"
          startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
          onClick={handleCopyText}
          sx={{
            borderColor: "#CBD5E1",
            color: "#475569",
            fontWeight: 700,
            fontSize: "0.74rem",
            textTransform: "none",
            borderRadius: "6px",
            height: 34,
            "&:hover": { borderColor: "#0F172A", bgcolor: "#F8FAFC", color: "#0F172A" },
          }}
        >
          Copy Text
        </Button>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            size="small"
            variant="contained"
            disabled={downloading}
            startIcon={downloading ? <CircularProgress size={14} sx={{ color: "#0F172A" }} /> : <DownloadIcon sx={{ fontSize: 15 }} />}
            onClick={handleDownloadCard}
            sx={{
              background: "linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)",
              color: "#0F172A",
              fontWeight: 800,
              fontSize: "0.76rem",
              textTransform: "none",
              borderRadius: "6px",
              height: 34,
              px: 1.8,
              boxShadow: "0 2px 8px rgba(245, 158, 11, 0.25)",
              "&:hover": { background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", color: "#FFFFFF" },
            }}
          >
            {downloading ? "Rendering..." : "Download HD Card (PNG)"}
          </Button>

          <Button
            size="small"
            variant="contained"
            startIcon={<WhatsAppIcon sx={{ fontSize: 16 }} />}
            onClick={handleShareWhatsApp}
            sx={{
              bgcolor: "#25D366",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "0.76rem",
              textTransform: "none",
              borderRadius: "6px",
              height: 34,
              px: 1.8,
              boxShadow: "0 2px 8px rgba(37, 211, 102, 0.25)",
              "&:hover": { bgcolor: "#1EBE5D" },
            }}
          >
            WhatsApp &amp; Send Card
          </Button>

          {lead.email && (
            <Button
              size="small"
              variant="outlined"
              disabled={sendingEmail}
              startIcon={sendingEmail ? <CircularProgress size={13} color="inherit" /> : <EmailIcon sx={{ fontSize: 15 }} />}
              onClick={handleSendEmail}
              sx={{
                borderColor: "#CBD5E1",
                color: "#0F172A",
                fontWeight: 700,
                fontSize: "0.76rem",
                textTransform: "none",
                borderRadius: "6px",
                height: 34,
                px: 1.6,
                "&:hover": { borderColor: "#0F172A", bgcolor: "#F8FAFC" },
              }}
            >
              {sendingEmail ? "Dispatching..." : "Send Email"}
            </Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
