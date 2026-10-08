import React, { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Paper,
  Stack,
  Alert,
  Snackbar,
} from "@mui/material";

import {
  WhatsApp as WhatsAppIcon,
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  LocationOn as LocationIcon,
  SolarPower as SolarIcon,
  AutoAwesome as SparklesIcon,
  DoneAll as DoneAllIcon,
} from "@mui/icons-material";

const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  primarySoft: "#FEF3C7",
  accent: "#F59E0B",
  bg: "#F4F6FA",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  whatsappHeader: "#075E54",
  whatsappGreen: "#25D366",
  whatsappDarkGreen: "#128C7E",
  whatsappBubbleBg: "#E7FFDB",
  whatsappChatBg: "#E5DDD5",
};

export const WHATSAPP_TEMPLATES = [
  {
    id: "proposal",
    name: "1) Proposal Link (auto-embeds /quote/:token)",
    text: `Hi {customer_name}, here is your customized rooftop solar proposal for {required_kw}kW system in {city}.\n\nView full quotation & specs here:\n{quotation_link}\n\nFeel free to reply back if you have any questions!\n- {agent_name}, {company_name}`,
  },
  {
    id: "site_visit",
    name: "2) Site Visit Confirmation",
    text: `Dear {customer_name}, our solar engineering team has scheduled a site visit for your location at {city} for roof measurement & structure assessment.\n\nPlease keep your latest electricity bill ready. Contact us if you need to reschedule!\n- {agent_name}, {company_name}`,
  },
  {
    id: "welcome",
    name: "3) Day-1 Welcome & Subsidy Pitch",
    text: `Hello {customer_name}, welcome to {company_name}! ☀️\n\nUnder PM Surya Ghar Muft Bijli Yojana, get up to ₹78,000 direct Govt subsidy on your {required_kw}kW rooftop solar system. Enjoy zero electricity bills & high ROI!\n\nReply YES to schedule a free rooftop consultation with our solar expert.\n- {agent_name}`,
  },
  {
    id: "followup",
    name: "4) Follow-up Reminder",
    text: `Hi {customer_name}, checking in regarding your rooftop solar enquiry for your property in {city}.\n\nHave you reviewed our proposal? We can clarify any doubts regarding net-metering, loan EMI options, or subsidy approval.\n\nBest regards,\n{agent_name} | {company_name}`,
  },
];

export const replaceDynamicTags = (templateText, lead, user) => {
  if (!templateText) return "";
  const customerName = lead?.customer_name || "Valued Customer";
  const requiredKw = lead?.required_kw ? `${lead.required_kw}` : "3";
  const city = lead?.city || (lead?.state ? lead.state : "your location");
  const agentName = user?.full_name || user?.name || "Solar Expert";
  const companyName = user?.company_name || "Solar CRM";

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const token = lead?.public_token || lead?.quotation_token || lead?.token || lead?.id || "sample-quote-token";
  const quotationLink = `${origin}/quote/${token}`;

  return templateText
    .replace(/{customer_name}/g, customerName)
    .replace(/{required_kw}/g, requiredKw)
    .replace(/{city}/g, city)
    .replace(/{agent_name}/g, agentName)
    .replace(/{company_name}/g, companyName)
    .replace(/{quotation_link}/g, quotationLink);
};

export const sanitizePhoneNumber = (phoneStr) => {
  if (!phoneStr) return "";
  const cleaned = String(phoneStr).replace(/\D/g, "");
  if (!cleaned) return "";
  if (cleaned.length === 10) return `91${cleaned}`;
  if (cleaned.length === 12 && cleaned.startsWith("91")) return cleaned;
  return cleaned;
};

export default function WhatsAppDrawer({ open, onClose, lead, currentUser }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState("proposal");
  const [messageText, setMessageText] = useState("");
  const [copiedSnackbar, setCopiedSnackbar] = useState(false);

  useEffect(() => {
    if (lead) {
      const tmpl = WHATSAPP_TEMPLATES.find((t) => t.id === selectedTemplateId) || WHATSAPP_TEMPLATES[0];
      const filledText = replaceDynamicTags(tmpl.text, lead, currentUser);
      setMessageText(filledText);
    }
  }, [lead, selectedTemplateId, currentUser, open]);

  const handleTemplateChange = (e) => {
    const newId = e.target.value;
    setSelectedTemplateId(newId);
    const tmpl = WHATSAPP_TEMPLATES.find((t) => t.id === newId);
    if (tmpl && lead) {
      setMessageText(replaceDynamicTags(tmpl.text, lead, currentUser));
    }
  };

  const handleSendWhatsApp = () => {
    if (!lead?.mobile_number) return;
    const cleanPhone = sanitizePhoneNumber(lead.mobile_number);
    if (!cleanPhone) return;
    const encodedText = encodeURIComponent(messageText || "");
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopyText = () => {
    if (!messageText) return;
    navigator.clipboard.writeText(messageText);
    setCopiedSnackbar(true);
  };

  const leadLocation = [lead?.city, lead?.state].filter(Boolean).join(", ") || "Location N/A";
  const currentTimeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <Drawer
      anchor="right"
      open={Boolean(open)}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 480 },
          backgroundColor: "#F0F2F5",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
    >
      {/* AUTHENTIC WHATSAPP TOP HEADER */}
      <Box
        sx={{
          p: 2,
          px: 2.5,
          backgroundColor: COLORS.whatsappHeader,
          color: "#FFFFFF",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flex: 1 }}>
          <Avatar
            sx={{
              width: 44,
              height: 44,
              backgroundColor: COLORS.whatsappDarkGreen,
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#FFFFFF",
              flexShrink: 0,
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            {lead?.customer_name ? lead.customer_name.charAt(0).toUpperCase() : "C"}
          </Avatar>
          <Box sx={{ minWidth: 0, overflow: "hidden" }}>
            <Typography noWrap sx={{ fontWeight: 700, fontSize: "1.05rem", fontFamily: "'Outfit', sans-serif", color: "#FFFFFF" }}>
              {lead?.customer_name || "Customer Name"}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mt: 0.2 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: COLORS.whatsappGreen, flexShrink: 0 }} />
              <Typography noWrap sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.85)", fontFamily: "'Inter', sans-serif" }}>
                {lead?.mobile_number ? `+${sanitizePhoneNumber(lead.mobile_number)}` : "WhatsApp Contact"}
              </Typography>
            </Box>
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "#FFFFFF",
            backgroundColor: "rgba(255,255,255,0.15)",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" },
            flexShrink: 0,
            ml: 2,
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* DRAWER BODY — SCROLLABLE */}
      <Box
        sx={{
          flex: 1,
          p: 2.5,
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
        }}
      >
        {/* LEAD QUICK METRICS BAR */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            px: 2,
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: "#FFFFFF",
          }}
        >
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} alignItems="center">
            <Chip
              icon={<SolarIcon sx={{ fontSize: "14px !important", color: "#D97706 !important" }} />}
              label={`${lead?.required_kw || "3"} kW Solar`}
              size="small"
              sx={{ fontSize: "0.72rem", fontWeight: 700, backgroundColor: "#FEF3C7", color: "#D97706", borderRadius: "6px" }}
            />
            <Chip
              label={lead?.status || "New Lead"}
              size="small"
              sx={{ fontSize: "0.72rem", fontWeight: 600, backgroundColor: "#F1F5F9", color: COLORS.textSecondary, borderRadius: "6px" }}
            />
            <Chip
              icon={<LocationIcon sx={{ fontSize: "13px !important", color: "#7C3AED !important" }} />}
              label={leadLocation}
              size="small"
              sx={{ fontSize: "0.72rem", fontWeight: 600, backgroundColor: "#FAF5FF", color: "#7C3AED", borderRadius: "6px" }}
            />
          </Stack>
        </Paper>

        {/* TEMPLATE SELECTOR */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 1 }}>
            <SparklesIcon sx={{ fontSize: 16, color: COLORS.whatsappHeader }} />
            <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.textPrimary, fontFamily: "'Outfit', sans-serif" }}>
              Select WhatsApp Template
            </Typography>
          </Stack>

          <FormControl fullWidth size="small">
            <Select
              value={selectedTemplateId}
              onChange={handleTemplateChange}
              sx={{
                borderRadius: "10px",
                backgroundColor: "#FFFFFF",
                fontSize: "0.83rem",
                fontWeight: 600,
                color: COLORS.textPrimary,
                fontFamily: "'Inter', sans-serif",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.border },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.whatsappHeader },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.whatsappHeader },
              }}
            >
              {WHATSAPP_TEMPLATES.map((tmpl) => (
                <MenuItem key={tmpl.id} value={tmpl.id} sx={{ fontSize: "0.82rem", py: 1 }}>
                  {tmpl.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* AUTHENTIC EDITABLE WHATSAPP CHAT BUBBLE CARD */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: COLORS.textPrimary, fontFamily: "'Outfit', sans-serif" }}>
              Message Box (Directly Editable)
            </Typography>
            <Chip
              label="Live WhatsApp Format"
              size="small"
              sx={{ fontSize: "0.68rem", fontWeight: 700, bgcolor: "#DCF8C6", color: "#075E54" }}
            />
          </Stack>

          {/* Authentic WhatsApp Chat Background Window */}
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              minHeight: 280,
              p: 2,
              borderRadius: "16px",
              backgroundColor: COLORS.whatsappChatBg,
              backgroundImage: "radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 0)",
              backgroundSize: "16px 16px",
              border: "1px solid #D1D5DB",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              boxShadow: "inset 0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            {/* WhatsApp Green Outgoing Bubble with Inline Textarea */}
            <Box
              sx={{
                width: "100%",
                backgroundColor: COLORS.whatsappBubbleBg,
                p: 2,
                pb: 1,
                borderRadius: "12px 0px 12px 12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                component="textarea"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your WhatsApp message..."
                sx={{
                  width: "100%",
                  minHeight: 180,
                  backgroundColor: "transparent",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.88rem",
                  lineHeight: 1.6,
                  color: "#111B21",
                  p: 0,
                  m: 0,
                  overflowY: "auto",
                  scrollbarWidth: "none",
                  "&::-webkit-scrollbar": { display: "none" },
                }}
              />

              {/* Timestamp & Double Blue Checkmark */}
              <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5} sx={{ mt: 1, pt: 0.5, borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                <Typography sx={{ fontSize: "0.68rem", color: "#667781", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                  {currentTimeStr}
                </Typography>
                <DoneAllIcon sx={{ fontSize: 16, color: "#53BDEB" }} />
              </Stack>
            </Box>
          </Paper>

          <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mt: 1, fontFamily: "'Inter', sans-serif" }}>
            💡 You can edit text directly inside the green WhatsApp bubble above before dispatching.
          </Typography>
        </Box>
      </Box>

      {/* FIXED FOOTER ACTIONS */}
      <Paper
        square
        elevation={0}
        sx={{
          p: 2,
          borderTop: `1px solid ${COLORS.border}`,
          backgroundColor: "#FFFFFF",
          flexShrink: 0,
        }}
      >
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={handleCopyText}
            startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />}
            sx={{
              flex: 1,
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "10px",
              py: 1.2,
              fontSize: "0.85rem",
              borderColor: COLORS.border,
              color: COLORS.textSecondary,
              fontFamily: "'Inter', sans-serif",
              "&:hover": { borderColor: COLORS.whatsappHeader, color: COLORS.whatsappHeader, backgroundColor: "#F1F5F9" },
            }}
          >
            Copy Text
          </Button>

          <Button
            variant="contained"
            onClick={handleSendWhatsApp}
            disabled={!lead?.mobile_number}
            startIcon={<WhatsAppIcon sx={{ fontSize: 20 }} />}
            sx={{
              flex: 1.4,
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "10px",
              py: 1.2,
              fontSize: "0.88rem",
              backgroundColor: COLORS.whatsappGreen,
              color: "#FFFFFF",
              fontFamily: "'Inter', sans-serif",
              boxShadow: "0 4px 14px rgba(37, 211, 102, 0.35)",
              "&:hover": { backgroundColor: COLORS.whatsappDarkGreen, boxShadow: "0 6px 18px rgba(18, 140, 126, 0.45)" },
            }}
          >
            Send via WhatsApp
          </Button>
        </Stack>
      </Paper>

      {/* SNACKBAR FEEDBACK */}
      <Snackbar
        open={copiedSnackbar}
        autoHideDuration={3000}
        onClose={() => setCopiedSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setCopiedSnackbar(false)} severity="success" sx={{ width: "100%", borderRadius: "8px", fontWeight: 600 }}>
          Message text copied to clipboard!
        </Alert>
      </Snackbar>
    </Drawer>
  );
}
