import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Stack,
  Chip,
  Tabs,
  Tab,
  Paper,
  Alert,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BoltIcon from "@mui/icons-material/Bolt";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import ShieldIcon from "@mui/icons-material/Shield";
import RefreshIcon from "@mui/icons-material/Refresh";
import { getLeadCopilotInsights } from "../services/aiService";

const THEME = {
  primary: "#0F172A",
  primaryDark: "#020617",
  primarySoft: "#F1F5F9",
  secondary: "#F59E0B",
  secondaryDark: "#D97706",
  secondarySoft: "#FEF3C7",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  successDark: "#15803D",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  indigo: "#4F46E5",
  indigoSoft: "#EEF2FF",
};

export default function AICopilotModal({ open, onClose, lead }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const fetchInsights = async () => {
    if (!lead?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getLeadCopilotInsights(lead.id);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || "Could not generate insights.");
      }
    } catch (err) {
      console.error("AI Copilot Error:", err);
      setError(err.response?.data?.message || err.message || "Failed to connect to AI Copilot.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && lead?.id) {
      fetchInsights();
    } else {
      setData(null);
      setError(null);
      setActiveTab(0);
    }
  }, [open, lead?.id]);

  const getActivePitch = () => {
    if (!data?.whatsapp_pitches) return "";
    if (activeTab === 0) return data.whatsapp_pitches.formal || "";
    if (activeTab === 1) return data.whatsapp_pitches.subsidy_focus || "";
    return data.whatsapp_pitches.urgent_followup || "";
  };

  const handleCopyPitch = () => {
    const text = getActivePitch();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const text = getActivePitch();
    if (!lead?.mobile_number) return;
    let cleanPhone = String(lead.mobile_number).replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const winProb = data?.win_probability || 0;
  const getProbColor = (val) => {
    if (val >= 80) return THEME.success;
    if (val >= 60) return THEME.secondary;
    return THEME.danger;
  };

  // Strip emojis from label if any returned
  const cleanDealHealth = (data?.deal_health || "High Priority Deal")
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .trim();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          overflow: "hidden",
          border: `1px solid ${THEME.border}`,
          boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)",
        },
      }}
    >
      {/* HEADER: Clean Corporate Dark Navy */}
      <Box
        sx={{
          backgroundColor: THEME.primary,
          color: "#FFFFFF",
          px: 2.5,
          py: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${THEME.border}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "8px",
              bgcolor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AutoAwesomeIcon sx={{ color: THEME.secondary, fontSize: 20 }} />
          </Box>
          <Box>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", color: "#FFFFFF", letterSpacing: -0.2 }}>
                Solar Lead Copilot
              </Typography>
              <Chip
                label="AI Deal Advisor"
                size="small"
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.12)",
                  color: "#F8FAFC",
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  height: 20,
                  borderRadius: "4px",
                }}
              />
            </Stack>
            <Typography sx={{ color: "#94A3B8", fontSize: "0.78rem", mt: 0.2 }}>
              Deal Closure Intelligence for{" "}
              <strong style={{ color: "#F8FAFC" }}>{lead?.customer_name || "Lead"}</strong>
              {lead?.lead_code ? ` • ${lead.lead_code}` : ""}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title="Regenerate Analysis">
            <IconButton
              size="small"
              onClick={fetchInsights}
              disabled={loading}
              sx={{ color: "#94A3B8", "&:hover": { color: "#FFFFFF", bgcolor: "rgba(255, 255, 255, 0.08)" } }}
            >
              <RefreshIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ color: "#94A3B8", "&:hover": { color: "#FFFFFF", bgcolor: "rgba(255, 255, 255, 0.08)" } }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Box>

      {/* CONTENT */}
      <DialogContent sx={{ p: 2.5, bgcolor: THEME.bg, maxHeight: "75vh" }}>
        {loading ? (
          <Box sx={{ py: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
            <CircularProgress size={42} thickness={4} sx={{ color: THEME.primary }} />
            <Typography sx={{ fontWeight: 600, color: THEME.textPrimary, fontSize: "0.9rem", mt: 1 }}>
              Analyzing lead profile, bill and communication history...
            </Typography>
            <Typography sx={{ color: THEME.textSecondary, fontSize: "0.78rem" }}>
              Evaluating PM Surya Ghar Muft Bijli Yojana subsidies and tailoring pitch
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ py: 2 }}>
            <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }}>{error}</Alert>
            <Button
              variant="contained"
              onClick={fetchInsights}
              startIcon={<RefreshIcon />}
              sx={{ bgcolor: THEME.primary, textTransform: "none", borderRadius: "6px" }}
            >
              Retry Analysis
            </Button>
          </Box>
        ) : data ? (
          <Stack spacing={2}>
            {/* ROW 1: METRICS & WIN PROBABILITY */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "170px 1fr" },
                gap: 2,
              }}
            >
              {/* WIN PROBABILITY CARD */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: "10px",
                  border: `1px solid ${THEME.border}`,
                  bgcolor: THEME.card,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                <Typography sx={{ color: THEME.textSecondary, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Win Probability
                </Typography>
                <Box sx={{ position: "relative", my: 1.2, display: "inline-flex" }}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={68}
                    thickness={4}
                    sx={{ color: THEME.border }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={winProb}
                    size={68}
                    thickness={4}
                    sx={{
                      color: getProbColor(winProb),
                      position: "absolute",
                      left: 0,
                    }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: "absolute",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: THEME.textPrimary }}>
                      {winProb}%
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={cleanDealHealth}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    borderRadius: "4px",
                    bgcolor: winProb >= 75 ? THEME.successSoft : winProb >= 50 ? THEME.secondarySoft : THEME.dangerSoft,
                    color: winProb >= 75 ? THEME.successDark : winProb >= 50 ? THEME.secondaryDark : THEME.danger,
                  }}
                />
              </Paper>

              {/* EXECUTIVE ASSESSMENT */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: "10px",
                  border: `1px solid ${THEME.border}`,
                  bgcolor: THEME.card,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography sx={{ color: THEME.primary, fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 0.6 }}>
                    <LightbulbIcon sx={{ fontSize: 16, color: THEME.secondary }} /> Executive Assessment
                  </Typography>
                  <Typography sx={{ fontSize: "0.84rem", color: THEME.textPrimary, mt: 0.8, lineHeight: 1.55, fontWeight: 500 }}>
                    {data.executive_summary}
                  </Typography>
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, mt: 1.5, pt: 1.5, borderTop: `1px solid ${THEME.border}` }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <BoltIcon sx={{ color: THEME.secondary, fontSize: 18, mt: 0.2 }} />
                    <Box>
                      <Typography sx={{ color: THEME.textSecondary, fontSize: "0.7rem", fontWeight: 600 }}>
                        Recommended System
                      </Typography>
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: THEME.textPrimary }}>
                        {data.recommended_system}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <CurrencyRupeeIcon sx={{ color: THEME.success, fontSize: 18, mt: 0.2 }} />
                    <Box>
                      <Typography sx={{ color: THEME.textSecondary, fontSize: "0.7rem", fontWeight: 600 }}>
                        Estimated Subsidy / Savings
                      </Typography>
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: THEME.successDark }}>
                        {data.estimated_subsidy}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Box>

            {/* ROW 2: CALL TALKING POINTS */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "10px",
                border: `1px solid ${THEME.border}`,
                bgcolor: THEME.card,
              }}
            >
              <Typography sx={{ color: THEME.primary, fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 0.6, mb: 1.2 }}>
                <RecordVoiceOverIcon sx={{ fontSize: 16, color: THEME.primary }} /> Strategic Call Talking Points
              </Typography>

              <Stack spacing={1}>
                {Array.isArray(data.calling_script) &&
                  data.calling_script.map((step, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 1.2,
                        borderRadius: "8px",
                        bgcolor: THEME.bg,
                        border: `1px solid ${THEME.border}`,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.2,
                      }}
                    >
                      <Box
                        sx={{
                          minWidth: 20,
                          height: 20,
                          borderRadius: "50%",
                          bgcolor: THEME.primarySoft,
                          color: THEME.primary,
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mt: 0.1,
                        }}
                      >
                        {idx + 1}
                      </Box>
                      <Typography sx={{ fontSize: "0.82rem", color: THEME.textPrimary, lineHeight: 1.5, fontWeight: 500 }}>
                        {step}
                      </Typography>
                    </Box>
                  ))}
              </Stack>

              {data.key_objection_tips && (
                <Box
                  sx={{
                    mt: 1.5,
                    p: 1.2,
                    borderRadius: "8px",
                    bgcolor: THEME.secondarySoft,
                    border: `1px solid #FDE68A`,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                  }}
                >
                  <ShieldIcon sx={{ color: THEME.secondaryDark, fontSize: 18, mt: 0.1 }} />
                  <Typography sx={{ fontSize: "0.78rem", color: THEME.secondaryDark, fontWeight: 600 }}>
                    <strong>Objection Handling:</strong> {data.key_objection_tips}
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* ROW 3: WHATSAPP PROPOSAL DRAFTS */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "10px",
                border: `1px solid ${THEME.border}`,
                bgcolor: THEME.card,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography sx={{ color: THEME.primary, fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 0.6 }}>
                  <WhatsAppIcon sx={{ fontSize: 16, color: THEME.success }} /> WhatsApp Follow-Up Templates
                </Typography>
                <Chip
                  label="Ready to Send"
                  size="small"
                  sx={{ bgcolor: THEME.successSoft, color: THEME.successDark, fontWeight: 700, fontSize: "0.68rem", height: 20, borderRadius: "4px" }}
                />
              </Box>

              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                sx={{
                  minHeight: 34,
                  mb: 1.5,
                  "& .MuiTab-root": {
                    minHeight: 34,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    py: 0.5,
                    px: 1.5,
                    color: THEME.textSecondary,
                    "&.Mui-selected": { color: THEME.primary, fontWeight: 700 },
                  },
                  "& .MuiTabs-indicator": {
                    backgroundColor: THEME.primary,
                  },
                }}
              >
                <Tab label="Formal English" />
                <Tab label="Subsidy Focus (Hinglish)" />
                <Tab label="Urgent Follow-up" />
              </Tabs>

              <Paper
                elevation={0}
                sx={{
                  p: 1.8,
                  borderRadius: "8px",
                  bgcolor: "#F8FAFC",
                  border: `1px solid ${THEME.border}`,
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                  fontSize: "0.82rem",
                  color: THEME.textPrimary,
                  lineHeight: 1.6,
                  maxHeight: 160,
                  overflowY: "auto",
                }}
              >
                {getActivePitch()}
              </Paper>

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1.5 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={copied ? <CheckCircleIcon sx={{ color: THEME.success }} /> : <ContentCopyIcon />}
                  onClick={handleCopyPitch}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    borderColor: THEME.borderStrong,
                    color: THEME.textPrimary,
                    borderRadius: "6px",
                    "&:hover": { borderColor: THEME.primary, bgcolor: THEME.bg },
                  }}
                >
                  {copied ? "Copied" : "Copy Draft"}
                </Button>

                <Button
                  size="small"
                  variant="contained"
                  startIcon={<WhatsAppIcon />}
                  onClick={handleSendWhatsApp}
                  disabled={!lead?.mobile_number}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    bgcolor: THEME.success,
                    borderRadius: "6px",
                    "&:hover": { bgcolor: THEME.successDark },
                  }}
                >
                  Send on WhatsApp
                </Button>
              </Box>
            </Paper>
          </Stack>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: `1px solid ${THEME.border}`, bgcolor: THEME.card }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.8rem",
            color: THEME.textSecondary,
            borderColor: THEME.borderStrong,
            borderRadius: "6px",
            "&:hover": { borderColor: THEME.primary, color: THEME.textPrimary },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
