import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getSalesDashboardStats } from "../../services/dashboardService";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  Skeleton,
  IconButton,
  Tooltip,
  Button,
  Stack,
  Grow,
  Fade,
} from "@mui/material";

import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import SolarPowerOutlinedIcon from "@mui/icons-material/SolarPowerOutlined";
import HistoryIcon from "@mui/icons-material/History";
import PieChartOutlinedIcon from "@mui/icons-material/PieChartOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import NewReleasesOutlinedIcon from "@mui/icons-material/NewReleasesOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import SyncAltOutlinedIcon from "@mui/icons-material/SyncAltOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  info: "#0284C7",
  infoSoft: "#E0F2FE",
  purple: "#7C3AED",
  purpleSoft: "#EDE9FE",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
};

const ACTION_STYLE_MAP = {
  "Lead Created": { icon: AddCircleOutlineOutlinedIcon, color: COLORS.info, soft: COLORS.infoSoft },
  "Lead Assigned": { icon: PersonAddAltOutlinedIcon, color: COLORS.primary, soft: "#E6F0FA" },
  "Lead Reassigned": { icon: SwapHorizOutlinedIcon, color: COLORS.primary, soft: "#E6F0FA" },
  "Status Changed": { icon: SyncAltOutlinedIcon, color: COLORS.purple, soft: COLORS.purpleSoft },
  "Follow-up Added": { icon: EventAvailableOutlinedIcon, color: COLORS.info, soft: COLORS.infoSoft },
  "Quotation Sent": { icon: ReceiptLongOutlinedIcon, color: COLORS.success, soft: COLORS.successSoft },
  "Site Visit Scheduled": { icon: PlaceOutlinedIcon, color: COLORS.warning, soft: COLORS.warningSoft },
  "Lead Closed": { icon: FlagOutlinedIcon, color: COLORS.success, soft: COLORS.successSoft },
  "Lead Updated": { icon: SyncAltOutlinedIcon, color: COLORS.textSecondary, soft: "#F1F5F9" },
};

const getActionStyle = (actionType) =>
  ACTION_STYLE_MAP[actionType] || { icon: HistoryIcon, color: COLORS.textSecondary, soft: "#F1F5F9" };

const formatRelativeTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

const formatFollowupDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

const StatCard = ({ label, value, caption, icon, color, softColor, loading, onClick, index = 0 }) => (
  <Grow in timeout={300 + index * 100}>
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        flex: "1 1 200px",
        minWidth: 200,
        borderRadius: "14px",
        border: `1px solid ${COLORS.border}`,
        backgroundColor: COLORS.card,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": onClick
          ? {
              boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
              transform: "translateY(-3px)",
              borderColor: color,
            }
          : {},
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.3 }}>
          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.04em" }}>
            {label}
          </Typography>
          <Avatar sx={{ width: 34, height: 34, borderRadius: "9px", bgcolor: softColor, color }}>{icon}</Avatar>
        </Box>
        {loading ? (
          <Skeleton width={50} height={32} />
        ) : (
          <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1.4rem" }}>
            {value}
          </Typography>
        )}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.6 }}>
          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600, fontSize: "0.72rem" }}>
            {loading ? <Skeleton width={90} height={12} /> : caption}
          </Typography>
          {onClick && !loading && (
            <ArrowForwardIcon sx={{ fontSize: 13, color: COLORS.textMuted, opacity: 0.7 }} />
          )}
        </Box>
      </CardContent>
    </Card>
  </Grow>
);

const SectionHeader = ({ icon, title, chipLabel, chipColor = "default" }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
    <Stack direction="row" alignItems="center" gap={1.2}>
      <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: COLORS.primary }} />
      {icon}
      <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.95rem" }}>{title}</Typography>
    </Stack>
    {chipLabel && (
      <Chip label={chipLabel} size="small" color={chipColor} variant="outlined" sx={{ fontWeight: 700, height: 22, fontSize: "0.68rem" }} />
    )}
  </Box>
);

const SalesDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getSalesDashboardStats();
      if (res?.success) setStats(res.data);
      else setError(res?.message || "Failed to load dashboard.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const {
    total_assigned = 0,
    new_leads = 0,
    today_followups = 0,
    pending_followups = 0,
    converted = 0,
    lost = 0,
    upcoming_site_visits = 0,
    activityTimeline = [],
    statusBreakdown = [],
    followupsList = [],
  } = stats || {};

  const conversionRate = total_assigned > 0 ? ((converted / total_assigned) * 100).toFixed(1) : "0.0";

  const openCount = statusBreakdown
    .filter((s) => !["Won", "Lost", "Not Interested", "New Lead"].includes(s.status))
    .reduce((acc, s) => acc + s.count, 0);

  const donutData = [
    { name: "New", value: new_leads, color: COLORS.info },
    { name: "In Progress", value: openCount, color: COLORS.warning },
    { name: "Won", value: converted, color: COLORS.success },
    { name: "Lost", value: lost, color: COLORS.danger },
  ].filter((d) => d.value > 0);

  const fullName = user?.full_name || user?.name || "Sales Executive";

  const buildTelLink = (phone) => `tel:${phone}`;
  const buildWhatsAppLink = (phone) => {
    const digits = (phone || "").replace(/\D/g, "");
    const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
    return `https://wa.me/${withCountryCode}`;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: COLORS.bg, minHeight: "100vh", width: "100%", boxSizing: "border-box" }}>
      {/* HEADER */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2.5,
          borderRadius: "16px",
          background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
          <Avatar sx={{ width: 46, height: 46, borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.15)", color: "#FFFFFF" }}>
            <SolarPowerOutlinedIcon sx={{ fontSize: 26 }} />
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "1.15rem" }}>Sales Executive Portal</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.8rem", mt: 0.2 }}>
              Welcome back, <strong style={{ color: "#FFFFFF" }}>{fullName}</strong> - Track your assigned leads & daily call follow-ups
            </Typography>
          </Box>
        </Box>
      </Paper>

      {error && !loading && (
        <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: "12px", border: `1px solid ${COLORS.dangerSoft}`, backgroundColor: COLORS.dangerSoft, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <ErrorOutlineOutlinedIcon sx={{ color: COLORS.danger, fontSize: 20 }} />
            <Typography sx={{ color: COLORS.danger, fontWeight: 600, fontSize: "0.8rem" }}>{error}</Typography>
          </Stack>
          <Button variant="contained" size="small" onClick={fetchDashboard} sx={{ backgroundColor: COLORS.danger, "&:hover": { backgroundColor: "#B91C1C" }, textTransform: "none", fontWeight: 700 }}>
            Retry
          </Button>
        </Paper>
      )}

      {/* STAT CARDS */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", xl: "repeat(6, 1fr)" }, gap: 2, mb: 2.5, width: "100%" }}>
        <StatCard label="MY ASSIGNED LEADS" value={total_assigned} caption="Total active solar inquiries" icon={<PhoneInTalkIcon sx={{ fontSize: 18 }} />} color={COLORS.info} softColor={COLORS.infoSoft} loading={loading} onClick={() => navigate("/sales/leads")} index={0} />
        <StatCard label="NEW LEADS" value={new_leads} caption="Not yet contacted" icon={<NewReleasesOutlinedIcon sx={{ fontSize: 18 }} />} color={COLORS.primary} softColor="#E6F0FA" loading={loading} onClick={() => navigate("/sales/leads")} index={1} />
        <StatCard label="TODAY'S FOLLOW-UPS" value={today_followups} caption="Due today" icon={<PendingActionsIcon sx={{ fontSize: 18 }} />} color={COLORS.warning} softColor={COLORS.warningSoft} loading={loading} onClick={() => navigate("/sales/followups")} index={2} />
        <StatCard label="PENDING FOLLOW-UPS" value={pending_followups} caption="Overdue - action required" icon={<WarningAmberOutlinedIcon sx={{ fontSize: 18 }} />} color={COLORS.danger} softColor={COLORS.dangerSoft} loading={loading} onClick={() => navigate("/sales/followups")} index={3} />
        <StatCard label="CONVERTED DEALS" value={converted} caption={`${conversionRate}% conversion rate`} icon={<CheckCircleOutlinedIcon sx={{ fontSize: 18 }} />} color={COLORS.success} softColor={COLORS.successSoft} loading={loading} onClick={() => navigate("/sales/leads")} index={4} />
        <StatCard label="UPCOMING SITE VISITS" value={upcoming_site_visits} caption="Scheduled surveys" icon={<LocationOnOutlinedIcon sx={{ fontSize: 18 }} />} color={COLORS.purple} softColor={COLORS.purpleSoft} loading={loading} onClick={() => navigate("/sales/leads")} index={5} />
      </Box>

      <Fade in={!loading} timeout={500}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* MIDDLE ROW: ACTIONABLE FOLLOW-UPS & STAGE BREAKDOWN */}
          <Box sx={{ display: "flex", gap: 2.5, flexDirection: { xs: "column", lg: "row" } }}>
            {/* ACTIONABLE FOLLOW-UPS LIST */}
            <Paper elevation={0} sx={{ flex: 1.4, p: 2.5, borderRadius: "16px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
              <SectionHeader
                icon={<PendingActionsIcon sx={{ color: COLORS.warning, fontSize: 20 }} />}
                title="Actionable Follow-ups (Today & Overdue)"
                chipLabel={loading ? "" : `${followupsList.length} Pending`}
                chipColor={followupsList.length > 0 ? "warning" : "default"}
              />

              {loading ? (
                <Stack gap={1.2}>
                  {Array.from(new Array(3)).map((_, i) => (
                    <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: "10px" }} />
                  ))}
                </Stack>
              ) : followupsList.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <CheckCircleOutlinedIcon sx={{ fontSize: 40, color: COLORS.success, opacity: 0.8, mb: 1 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>All caught up!</Typography>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>No follow-ups due today or overdue.</Typography>
                </Box>
              ) : (
                <Stack gap={1.2} sx={{ maxHeight: 340, overflowY: "auto", pr: 0.5 }}>
                  {followupsList.map((f) => (
                    <Box
                      key={f.id}
                      sx={{
                        p: 1.5,
                        borderRadius: "12px",
                        backgroundColor: f.is_overdue ? "#FEF2F2" : "#F8FAFC",
                        border: `1px solid ${f.is_overdue ? "#FECACA" : COLORS.border}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 0.3 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary, fontSize: "0.85rem" }}>
                            {f.customer_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: COLORS.textMuted, fontSize: "0.7rem", fontWeight: 700 }}>
                            {f.lead_code}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" sx={{ color: f.is_overdue ? COLORS.danger : COLORS.warning, fontWeight: 700, display: "block" }}>
                          {f.is_overdue ? `Overdue - Due ${formatFollowupDate(f.next_follow_up_date)}` : `Due Today (${formatFollowupDate(f.next_follow_up_date)})`}
                        </Typography>
                      </Box>

                      <Stack direction="row" gap={0.8}>
                        <Tooltip title={`Call ${f.phone || ""}`}>
                          <IconButton
                            component="a"
                            href={buildTelLink(f.phone)}
                            size="small"
                            sx={{ backgroundColor: COLORS.infoSoft, color: COLORS.info, "&:hover": { backgroundColor: "#BAE6FD" } }}
                          >
                            <PhoneInTalkIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="WhatsApp message">
                          <IconButton
                            component="a"
                            href={buildWhatsAppLink(f.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            sx={{ backgroundColor: COLORS.successSoft, color: COLORS.success, "&:hover": { backgroundColor: "#BBF7D0" } }}
                          >
                            <WhatsAppIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>

            {/* STAGE BREAKDOWN DONUT */}
            <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: "16px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
              <SectionHeader
                icon={<PieChartOutlinedIcon sx={{ color: COLORS.purple, fontSize: 20 }} />}
                title="Personal Pipeline Overview"
                chipLabel={loading ? "" : `${conversionRate}% Conversion`}
                chipColor="success"
              />

              <Box sx={{ height: 240, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {loading ? (
                  <Skeleton variant="circular" width={160} height={160} />
                ) : donutData.length === 0 ? (
                  <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>No leads assigned yet.</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3}>
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: "10px", border: `1px solid ${COLORS.border}`, fontSize: "0.78rem" }} />
                      <Legend formatter={(value) => <span style={{ fontSize: "11px", fontWeight: 600, color: COLORS.textPrimary }}>{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Box>

          {/* BOTTOM ROW: RECENT ACTIVITY TIMELINE */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
            <SectionHeader icon={<HistoryIcon sx={{ color: COLORS.primary, fontSize: 20 }} />} title="My Recent Activity History" chipLabel="Last 10 actions" chipColor="primary" />

            {loading ? (
              <Stack gap={1.2}>
                {Array.from(new Array(3)).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={54} sx={{ borderRadius: "10px" }} />
                ))}
              </Stack>
            ) : activityTimeline.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.textSecondary, textAlign: "center", py: 3 }}>
                No recent activity logs recorded yet.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, maxHeight: 300, overflowY: "auto", pr: 0.5 }}>
                {activityTimeline.map((log) => {
                  const { icon: ActionIcon, color, soft } = getActionStyle(log.action_type);
                  return (
                    <Box
                      key={log.id}
                      sx={{
                        p: 1.3,
                        borderRadius: "10px",
                        backgroundColor: "#F8FAFC",
                        border: `1px solid ${COLORS.border}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <Avatar sx={{ width: 32, height: 32, borderRadius: "8px", backgroundColor: soft, color }}>
                        <ActionIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" sx={{ fontWeight: 800, color, fontSize: "0.75rem" }}>
                            {log.action_type}
                          </Typography>
                          <Typography variant="caption" sx={{ color: COLORS.textMuted, fontSize: "0.68rem" }}>
                            {formatRelativeTime(log.created_at)}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "0.82rem" }}>
                          {log.customer_name || "Lead"} ({log.lead_code || "-"})
                        </Typography>
                        {log.remark && (
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontStyle: "italic", display: "block" }}>
                            "{log.remark}"
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Box>
      </Fade>
    </Box>
  );
};

export default SalesDashboard;