import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAdminDashboardStats } from "../../services/dashboardService";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from "recharts";

import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Skeleton,
  Stack,
  Grow,
  Fade,
} from "@mui/material";

// Icons
import LogoutIcon from "@mui/icons-material/Logout";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import PieChartOutlinedIcon from "@mui/icons-material/PieChartOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import HistoryIcon from "@mui/icons-material/History";
import SourceOutlinedIcon from "@mui/icons-material/SourceOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import SyncAltOutlinedIcon from "@mui/icons-material/SyncAltOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import StarsIcon from "@mui/icons-material/Stars";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LanguageIcon from "@mui/icons-material/Language";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";

// ======================================================
// SOLAR BRAND DESIGN SYSTEM
// ======================================================
const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  primarySoft: "#F1F5F9",
  secondary: "#F59E0B",
  secondaryDark: "#D97706",
  secondarySoft: "#FEF3C7",
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

const PIE_COLORS = ["#0284C7", "#D97706", "#7C3AED", "#9333EA", "#C026D3", "#16A34A", "#DC2626", "#64748B"];

const STATUS_STYLES = {
  "New Lead": { bg: "#F0F9FF", color: "#0284C7", border: "#BAE6FD", dot: "#0284C7" },
  Contacted: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A", dot: "#D97706" },
  "Follow-up Pending": { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A", dot: "#D97706" },
  "Site Visit Scheduled": { bg: "#F5F3FF", color: "#7C3AED", border: "#DDD6FE", dot: "#7C3AED" },
  "Quotation Sent": { bg: "#EEF2FF", color: "#4F46E5", border: "#C7D2FE", dot: "#4F46E5" },
  Negotiation: { bg: "#FDF2F8", color: "#DB2777", border: "#FBCFE8", dot: "#DB2777" },
  Won: { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0", dot: "#16A34A" },
  Lost: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", dot: "#DC2626" },
  "Not Interested": { bg: "#F8FAFC", color: "#64748B", border: "#E2E8F0", dot: "#94A3B8" },
};

const ACTION_STYLE_MAP = {
  "Lead Created": { icon: AddCircleOutlineOutlinedIcon, color: COLORS.info, soft: COLORS.infoSoft },
  "Lead Assigned": { icon: PersonAddAltOutlinedIcon, color: COLORS.primary, soft: COLORS.primarySoft },
  "Lead Reassigned": { icon: SwapHorizOutlinedIcon, color: COLORS.primary, soft: COLORS.primarySoft },
  "Lead Updated": { icon: SyncAltOutlinedIcon, color: COLORS.textSecondary, soft: "#F1F5F9" },
  "Status Changed": { icon: SyncAltOutlinedIcon, color: COLORS.purple, soft: COLORS.purpleSoft },
  "Follow-up Added": { icon: EventAvailableOutlinedIcon, color: COLORS.info, soft: COLORS.infoSoft },
  "Quotation Sent": { icon: ReceiptLongOutlinedIcon, color: COLORS.success, soft: COLORS.successSoft },
  "Site Visit Scheduled": { icon: PlaceOutlinedIcon, color: COLORS.warning, soft: COLORS.warningSoft },
  "Lead Closed": { icon: FlagOutlinedIcon, color: COLORS.success, soft: COLORS.successSoft },
};

const getActionStyle = (actionType) =>
  ACTION_STYLE_MAP[actionType] || { icon: HistoryIcon, color: COLORS.textSecondary, soft: "#F1F5F9" };

// ======================================================
// HELPERS
// ======================================================
const formatCompactINR = (value) => {
  const n = Number(value) || 0;
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
};

const formatCapacity = (kw) => {
  const n = Number(kw) || 0;
  if (n >= 1000) return `${(n / 1000).toFixed(2)} MW`;
  return `${n.toFixed(1)} kW`;
};

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

const hashHue = (str = "") => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
};

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const GradientAvatar = ({ name, size = 30 }) => {
  const hue = hashHue(name || "?");
  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        fontWeight: 700,
        background: `linear-gradient(135deg, hsl(${hue},58%,50%), hsl(${hue + 30},60%,42%))`,
      }}
    >
      {getInitials(name)}
    </Avatar>
  );
};

const getSourceBadge = (source) => {
  const s = (source || "Direct").toLowerCase();
  let icon = <LanguageIcon sx={{ fontSize: 13 }} />;
  let color = "#0284C7";
  let bg = "#F0F9FF";
  let border = "#BAE6FD";

  if (s.includes("referral") || s.includes("reference") || s.includes("word")) {
    icon = <PeopleAltOutlinedIcon sx={{ fontSize: 13 }} />;
    color = "#16A34A";
    bg = "#F0FDF4";
    border = "#BBF7D0";
  } else if (s.includes("call") || s.includes("phone")) {
    icon = <SourceOutlinedIcon sx={{ fontSize: 13 }} />;
    color = "#D97706";
    bg = "#FFFBEB";
    border = "#FDE68A";
  } else if (s.includes("facebook") || s.includes("social") || s.includes("insta")) {
    icon = <SourceOutlinedIcon sx={{ fontSize: 13 }} />;
    color = "#7C3AED";
    bg = "#F5F3FF";
    border = "#DDD6FE";
  } else if (!source) {
    icon = <SourceOutlinedIcon sx={{ fontSize: 13 }} />;
    color = "#64748B";
    bg = "#F8FAFC";
    border = "#E2E8F0";
  }

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.6,
        px: 1,
        py: 0.3,
        borderRadius: "6px",
        bgcolor: bg,
        color: color,
        border: `1px solid ${border}`,
        fontSize: "0.7rem",
        fontWeight: 600,
      }}
    >
      {icon}
      <span>{source || "Direct"}</span>
    </Box>
  );
};

// ======================================================
// CLICKABLE KPI CARD COMPONENT
// ======================================================
const StatCard = ({ label, value, caption, icon, color, softColor, loading, onClick, index = 0 }) => (
  <Grow in timeout={300 + index * 100}>
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        flex: "1 1 210px",
        minWidth: 210,
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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.2 }}>
          <Typography sx={{ color: COLORS.textSecondary, fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.04em" }}>
            {label}
          </Typography>
          <Avatar sx={{ width: 34, height: 34, borderRadius: "9px", bgcolor: softColor, color }}>{icon}</Avatar>
        </Box>
        {loading ? (
          <Skeleton width={70} height={32} />
        ) : (
          <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1.35rem", lineHeight: 1.2 }}>
            {value}
          </Typography>
        )}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.6 }}>
          <Typography sx={{ color: COLORS.textSecondary, fontWeight: 600, fontSize: "0.72rem" }}>
            {loading ? <Skeleton width={100} height={12} /> : caption}
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

// ======================================================
// MAIN DASHBOARD COMPONENT
// ======================================================
const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getAdminDashboardStats();
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
    total_leads = 0,
    won_leads = 0,
    active_leads = 0,
    total_revenue = 0,
    total_installed_kw = 0,
    todays_followups = 0,
    top_performer = "N/A",
    top_performer_count = 0,
    statusBreakdown = [],
    sourcePerformance = [],
    monthlyTrend = [],
    recentLeads = [],
    activityFeed = [],
    teamLeaderboard = [],
  } = stats || {};

  const conversionRate = total_leads > 0 ? ((won_leads / total_leads) * 100).toFixed(1) : "0.0";

  // Dashboard KPI Cards Config
  const statCards = [
    {
      label: "TOTAL LEADS",
      value: total_leads,
      caption: `${active_leads} active in pipeline`,
      icon: <TrendingUpOutlinedIcon sx={{ fontSize: 18 }} />,
      color: COLORS.info,
      softColor: COLORS.infoSoft,
      onClick: () => navigate("/leads"),
    },
    {
      label: "WON LEADS",
      value: won_leads,
      caption: `${conversionRate}% conversion rate`,
      icon: <CheckCircleOutlinedIcon sx={{ fontSize: 18 }} />,
      color: COLORS.success,
      softColor: COLORS.successSoft,
      onClick: () => navigate("/leads?status=Won"),
    },
    {
      label: "TOTAL REVENUE WON",
      value: formatCompactINR(total_revenue),
      caption: `${won_leads} deals successfully closed`,
      icon: <AttachMoneyIcon sx={{ fontSize: 18 }} />,
      color: COLORS.warning,
      softColor: COLORS.warningSoft,
      onClick: () => navigate("/leads?status=Won"),
    },
    {
      label: "TOTAL CAPACITY WON",
      value: formatCapacity(total_installed_kw),
      caption: "Cumulative solar system capacity",
      icon: <WbSunnyIcon sx={{ fontSize: 18 }} />,
      color: COLORS.purple,
      softColor: COLORS.purpleSoft,
      onClick: () => navigate("/leads?status=Won"),
    },
    {
      label: "TODAY'S FOLLOWUPS",
      value: `${todays_followups} Pending`,
      caption: "Mandatory followups required today",
      icon: <EventAvailableOutlinedIcon sx={{ fontSize: 18 }} />,
      color: COLORS.danger,
      softColor: COLORS.dangerSoft,
      onClick: () => navigate("/leads?followup=today"),
    },
    {
      label: "TOP PERFORMER (SALES)",
      value: top_performer,
      caption: `${top_performer_count} deals won`,
      icon: <StarsIcon sx={{ fontSize: 18 }} />,
      color: COLORS.secondaryDark,
      softColor: COLORS.secondarySoft,
      onClick: () => navigate("/users"),
    },
  ];

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
            <ShieldOutlinedIcon sx={{ fontSize: 26 }} />
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "1.15rem" }}>Admin Control Center</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.8rem", mt: 0.2 }}>
              Welcome back, <strong style={{ color: "#FFFFFF" }}>{user?.full_name || user?.name || "Admin"}</strong> - Master CRM Analytics & Operations
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" alignItems="center" gap={1}>
          <Button
            variant="contained"
            size="small"
            startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
            onClick={handleLogout}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "10px",
              px: 2,
              fontSize: "0.8rem",
              backgroundColor: "rgba(255,255,255,0.15)",
              color: "#FFFFFF",
              boxShadow: "none",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.25)", boxShadow: "none" },
            }}
          >
            Logout
          </Button>
        </Stack>
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

      {/* STAT CARDS ROW */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)", xl: "repeat(6, 1fr)" }, gap: 2, mb: 2.5, width: "100%" }}>
        {statCards.map((s, idx) => (
          <StatCard key={s.label} {...s} loading={loading} index={idx} />
        ))}
      </Box>

      <Fade in={!loading} timeout={500}>
        <Box>
          {/* CHARTS ROW 1: MONTHLY TREND & PIPELINE STAGES */}
          <Box sx={{ display: "flex", gap: 2, mb: 2.5, width: "100%", flexDirection: { xs: "column", lg: "row" } }}>
            {/* Chart 1: Monthly Trend */}
            <Paper elevation={0} sx={{ flex: 1.4, p: 2.5, borderRadius: "16px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
              <SectionHeader icon={<ShowChartIcon sx={{ color: COLORS.primary, fontSize: 20 }} />} title="Leads Created vs. Won (6-Month Trend)" />
              <Box sx={{ height: 260, width: "100%" }}>
                {loading ? (
                  <Skeleton variant="rounded" height="100%" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.textSecondary, fontWeight: 600 }} />
                      <YAxis tick={{ fontSize: 11, fill: COLORS.textSecondary }} allowDecimals={false} />
                      <RechartsTooltip contentStyle={{ borderRadius: "10px", border: `1px solid ${COLORS.border}`, fontSize: "0.78rem" }} />
                      <Area type="monotone" dataKey="leads_created" stroke={COLORS.primary} fill={COLORS.primarySoft} name="Leads Created" />
                      <Area type="monotone" dataKey="leads_won" stroke={COLORS.success} fill={COLORS.successSoft} name="Leads Won" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>

            {/* Chart 2: Pipeline Stages Donut */}
            <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: "16px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
              <SectionHeader
                icon={<PieChartOutlinedIcon sx={{ color: COLORS.purple, fontSize: 20 }} />}
                title="Pipeline Stage Distribution"
                chipLabel={loading ? "" : `${conversionRate}% Conversion`}
                chipColor="success"
              />
              <Box sx={{ height: 230, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {loading ? (
                  <Skeleton variant="circular" width={160} height={160} />
                ) : statusBreakdown.length === 0 ? (
                  <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>No lead status data available</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusBreakdown} dataKey="count" nameKey="status" cx="50%" cy="46%" innerRadius={48} outerRadius={76} paddingAngle={3}>
                        {statusBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={(STATUS_STYLES[entry.status] || {}).color || PIE_COLORS[index % PIE_COLORS.length]} />
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

          {/* CHARTS ROW 2: LEAD SOURCE PERFORMANCE (BAR/PIE GRAPH) & TEAM LEADERBOARD */}
          <Box sx={{ display: "flex", gap: 2, mb: 2.5, width: "100%", flexDirection: { xs: "column", lg: "row" } }}>
            {/* Chart 3: Lead Source Bar/Pie Chart */}
            <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: "16px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
              <SectionHeader icon={<SourceOutlinedIcon sx={{ color: COLORS.primary, fontSize: 20 }} />} title="Lead Source Performance Chart" />
              <Box sx={{ height: 250, width: "100%" }}>
                {loading ? (
                  <Skeleton variant="rounded" height="100%" />
                ) : sourcePerformance.length === 0 ? (
                  <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.82rem", textAlign: "center", py: 4 }}>No source data recorded.</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sourcePerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="lead_source" tick={{ fontSize: 11, fill: COLORS.textSecondary, fontWeight: 600 }} />
                      <YAxis tick={{ fontSize: 11, fill: COLORS.textSecondary }} allowDecimals={false} />
                      <RechartsTooltip contentStyle={{ borderRadius: "10px", border: `1px solid ${COLORS.border}`, fontSize: "0.78rem" }} />
                      <Bar dataKey="total" fill={COLORS.primary} name="Total Leads" radius={[6, 6, 0, 0]} barSize={24} />
                      <Bar dataKey="won" fill={COLORS.success} name="Won Deals" radius={[6, 6, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>

            {/* Chart 4: Sales Team Performance / Leaderboard */}
            <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: "16px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
              <SectionHeader icon={<LeaderboardIcon sx={{ color: COLORS.secondaryDark, fontSize: 20 }} />} title="Sales Executive Performance" chipLabel="Top Reps" chipColor="warning" />
              <Box sx={{ height: 250, width: "100%" }}>
                {loading ? (
                  <Skeleton variant="rounded" height="100%" />
                ) : teamLeaderboard.length === 0 ? (
                  <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.82rem", textAlign: "center", py: 4 }}>No team performance data.</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamLeaderboard} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: COLORS.textSecondary }} allowDecimals={false} />
                      <YAxis dataKey="rep_name" type="category" tick={{ fontSize: 11, fill: COLORS.textPrimary, fontWeight: 600 }} width={100} />
                      <RechartsTooltip contentStyle={{ borderRadius: "10px", border: `1px solid ${COLORS.border}`, fontSize: "0.78rem" }} />
                      <Bar dataKey="won_leads" fill={COLORS.secondary} name="Deals Won" radius={[0, 6, 6, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Box>

          {/* ROW 3: RECENT LEADS TABLE & ORGANIZATION-WIDE ACTIVITY */}
          <Box sx={{ display: "flex", gap: 2, mb: 2.5, width: "100%", flexDirection: { xs: "column", lg: "row" } }}>
            {/* Recent Leads Table (Clickable) */}
            <Paper
              elevation={0}
              sx={{
                flex: 1.45,
                p: { xs: 2, sm: 2.5 },
                borderRadius: "16px",
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.card,
                boxShadow: "0 1px 3px 0 rgba(15, 23, 42, 0.05)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Header */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                <Stack direction="row" alignItems="center" gap={1.2}>
                  <Box sx={{ width: 4, height: 22, borderRadius: "4px", backgroundColor: COLORS.primary }} />
                  <TrendingUpOutlinedIcon sx={{ color: COLORS.primary, fontSize: 22 }} />
                  <Box>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.95rem" }}>
                        Recent Leads
                      </Typography>
                      <Chip
                        label={`${recentLeads.length} Total`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          bgcolor: COLORS.primarySoft,
                          color: COLORS.primary,
                          borderRadius: "6px",
                        }}
                      />
                    </Stack>
                    <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mt: 0.2 }}>
                      Latest organization-wide pipeline entries & deals
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  size="small"
                  onClick={() => navigate("/leads")}
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    color: COLORS.primary,
                    bgcolor: "#F8FAFC",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "8px",
                    px: 1.5,
                    py: 0.5,
                    "&:hover": { bgcolor: COLORS.primarySoft, borderColor: COLORS.borderStrong },
                  }}
                >
                  View All Leads
                </Button>
              </Box>

              {/* Encapsulated Table with Rounded Header */}
              <TableContainer
                sx={{
                  borderRadius: "12px",
                  border: `1px solid ${COLORS.border}`,
                  overflow: "hidden",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <Table size="small">
                  <TableHead sx={{ bgcolor: COLORS.primary }}>
                    <TableRow>
                      <TableCell sx={{ color: "#FFFFFF !important", bgcolor: "#0F172A !important", fontWeight: 700, fontSize: "0.72rem", py: 1.2, px: 1.5, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        Lead
                      </TableCell>
                      <TableCell sx={{ color: "#FFFFFF !important", bgcolor: "#0F172A !important", fontWeight: 700, fontSize: "0.72rem", py: 1.2, px: 1.5, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        Source
                      </TableCell>
                      <TableCell sx={{ color: "#FFFFFF !important", bgcolor: "#0F172A !important", fontWeight: 700, fontSize: "0.72rem", py: 1.2, px: 1.5, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        Sales Rep
                      </TableCell>
                      <TableCell sx={{ color: "#FFFFFF !important", bgcolor: "#0F172A !important", fontWeight: 700, fontSize: "0.72rem", py: 1.2, px: 1.5, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        Status
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#FFFFFF !important", bgcolor: "#0F172A !important", fontWeight: 700, fontSize: "0.72rem", py: 1.2, px: 1.5, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        Value
                      </TableCell>
                      <TableCell align="center" sx={{ color: "#FFFFFF !important", bgcolor: "#0F172A !important", fontWeight: 700, fontSize: "0.72rem", py: 1.2, px: 1, width: 44 }}>
                        
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      Array.from(new Array(5)).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ py: 1.2, px: 1.5 }}><Skeleton width="80%" height={24} /></TableCell>
                          <TableCell sx={{ py: 1.2, px: 1.5 }}><Skeleton width={65} height={22} /></TableCell>
                          <TableCell sx={{ py: 1.2, px: 1.5 }}><Skeleton width={90} height={24} /></TableCell>
                          <TableCell sx={{ py: 1.2, px: 1.5 }}><Skeleton variant="rounded" width={95} height={22} /></TableCell>
                          <TableCell align="right" sx={{ py: 1.2, px: 1.5 }}><Skeleton width={55} sx={{ ml: "auto" }} /></TableCell>
                          <TableCell align="center" sx={{ py: 1.2, px: 1 }}><Skeleton width={20} height={20} /></TableCell>
                        </TableRow>
                      ))
                    ) : recentLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 5, color: COLORS.textSecondary, border: 0 }}>
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                            <TrendingUpOutlinedIcon sx={{ fontSize: 32, color: COLORS.textMuted }} />
                            <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: COLORS.textPrimary }}>
                              No Leads Created Yet
                            </Typography>
                            <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                              New leads captured or uploaded will appear here.
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentLeads
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((lead) => {
                          const statusStyle = STATUS_STYLES[lead.status] || {
                            bg: "#F8FAFC",
                            color: "#64748B",
                            border: "#E2E8F0",
                            dot: "#94A3B8",
                          };
                          const customerInitial = (lead.customer_name || "L").trim().charAt(0).toUpperCase();

                          return (
                            <TableRow
                              key={lead.id}
                              hover
                              onClick={() => navigate("/leads")}
                              sx={{
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                "&:hover": { backgroundColor: "#F8FAFC !important" },
                                "& td": { borderBottom: `1px solid ${COLORS.border}` },
                              }}
                            >
                              {/* 1. Lead Info */}
                              <TableCell sx={{ py: 1.1, px: 1.5, minWidth: 170 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                                  <Avatar
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: "8px",
                                      bgcolor: COLORS.primarySoft,
                                      color: COLORS.primary,
                                      fontSize: "0.8rem",
                                      fontWeight: 800,
                                      flexShrink: 0,
                                      border: `1px solid ${COLORS.border}`,
                                    }}
                                  >
                                    {customerInitial}
                                  </Avatar>
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography
                                      sx={{
                                        fontWeight: 700,
                                        color: COLORS.textPrimary,
                                        fontSize: "0.82rem",
                                        lineHeight: 1.2,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {lead.customer_name || "Unnamed"}
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mt: 0.3 }}>
                                      <Typography
                                        component="span"
                                        sx={{
                                          fontFamily: "monospace",
                                          fontWeight: 700,
                                          fontSize: "0.68rem",
                                          color: COLORS.primary,
                                          bgcolor: "#F1F5F9",
                                          px: 0.6,
                                          py: 0.15,
                                          borderRadius: "4px",
                                          border: "1px solid #E2E8F0",
                                        }}
                                      >
                                        {lead.lead_code || `LD${String(lead.id).padStart(6, "0")}`}
                                      </Typography>
                                      {lead.required_kw ? (
                                        <Typography sx={{ fontSize: "0.68rem", color: COLORS.textSecondary, fontWeight: 500 }}>
                                          • {lead.required_kw} kW
                                        </Typography>
                                      ) : null}
                                    </Box>
                                  </Box>
                                </Box>
                              </TableCell>

                              {/* 2. Source */}
                              <TableCell sx={{ py: 1.1, px: 1.5, whiteSpace: "nowrap" }}>
                                {getSourceBadge(lead.lead_source)}
                              </TableCell>

                              {/* 3. Sales Rep */}
                              <TableCell sx={{ py: 1.1, px: 1.5, whiteSpace: "nowrap" }}>
                                {lead.assigned_to_name ? (
                                  <Stack direction="row" alignItems="center" gap={1}>
                                    <Avatar
                                      sx={{
                                        width: 26,
                                        height: 26,
                                        fontSize: "0.68rem",
                                        fontWeight: 700,
                                        bgcolor: COLORS.primary,
                                        color: "#FFFFFF",
                                        flexShrink: 0,
                                      }}
                                    >
                                      {getInitials(lead.assigned_to_name)}
                                    </Avatar>
                                    <Box>
                                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary, lineHeight: 1.1 }}>
                                        {lead.assigned_to_name}
                                      </Typography>
                                      <Typography sx={{ fontSize: "0.65rem", color: COLORS.textSecondary }}>
                                        Sales Rep
                                      </Typography>
                                    </Box>
                                  </Stack>
                                ) : (
                                  <Chip
                                    size="small"
                                    icon={<WarningAmberOutlinedIcon sx={{ fontSize: "12px !important", color: "#EF4444" }} />}
                                    label="Unassigned"
                                    sx={{
                                      height: 22,
                                      fontSize: "0.68rem",
                                      fontWeight: 700,
                                      bgcolor: "#FEF2F2",
                                      color: "#DC2626",
                                      border: "1px dashed #FCA5A5",
                                      borderRadius: "6px",
                                    }}
                                  />
                                )}
                              </TableCell>

                              {/* 4. Status */}
                              <TableCell sx={{ py: 1.1, px: 1.5, whiteSpace: "nowrap" }}>
                                <Box
                                  sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.7,
                                    px: 1.1,
                                    py: 0.35,
                                    borderRadius: "20px",
                                    bgcolor: statusStyle.bg,
                                    color: statusStyle.color,
                                    border: `1px solid ${statusStyle.border || statusStyle.bg}`,
                                    fontSize: "0.7rem",
                                    fontWeight: 700,
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                                  }}
                                >
                                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: statusStyle.dot || statusStyle.color }} />
                                  <span>{lead.status}</span>
                                </Box>
                              </TableCell>

                              {/* 5. Value */}
                              <TableCell align="right" sx={{ py: 1.1, px: 1.5, whiteSpace: "nowrap" }}>
                                {lead.quotation_amount ? (
                                  <Box sx={{ textAlign: "right" }}>
                                    <Typography
                                      sx={{
                                        fontWeight: 800,
                                        color: COLORS.primary,
                                        fontSize: "0.82rem",
                                        fontFamily: "'Outfit', sans-serif",
                                        lineHeight: 1.2,
                                      }}
                                    >
                                      {formatCompactINR(lead.quotation_amount)}
                                    </Typography>
                                    <Typography sx={{ fontSize: "0.65rem", color: COLORS.textSecondary, fontWeight: 500 }}>
                                      Quotation
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography sx={{ color: COLORS.textMuted, fontSize: "0.82rem", fontWeight: 500 }}>
                                    —
                                  </Typography>
                                )}
                              </TableCell>

                              {/* 6. Quick Action */}
                              <TableCell align="center" sx={{ py: 1.1, px: 1, width: 40 }}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate("/leads");
                                  }}
                                  sx={{
                                    color: COLORS.textSecondary,
                                    width: 26,
                                    height: 26,
                                    borderRadius: "6px",
                                    "&:hover": {
                                      color: COLORS.primary,
                                      bgcolor: COLORS.primarySoft,
                                    },
                                  }}
                                >
                                  <ArrowForwardIcon sx={{ fontSize: 13 }} />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Table Footer with Pagination */}
              {!loading && recentLeads.length > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 1.5,
                    pt: 1,
                    px: 0.5,
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, fontWeight: 500 }}>
                    Showing <strong>{Math.min(recentLeads.length, page * rowsPerPage + 1)}–{Math.min(recentLeads.length, (page + 1) * rowsPerPage)}</strong> of <strong>{recentLeads.length}</strong> leads
                  </Typography>

                  <TablePagination
                    rowsPerPageOptions={[5, 10]}
                    component="div"
                    count={recentLeads.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                      setRowsPerPage(parseInt(e.target.value, 10));
                      setPage(0);
                    }}
                    sx={{
                      border: "none",
                      "& .MuiTablePagination-toolbar": { minHeight: 32, p: 0 },
                      "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.72rem", color: COLORS.textSecondary },
                      "& .MuiTablePagination-select": { fontSize: "0.72rem", py: 0.3 },
                      "& .MuiTablePagination-actions": { ml: 1 },
                      "& .MuiIconButton-root": { p: 0.5 },
                    }}
                  />
                </Box>
              )}
            </Paper>

            {/* Organization-wide Activity Feed */}
            <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: "16px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
              <SectionHeader icon={<HistoryIcon sx={{ color: COLORS.primary, fontSize: 20 }} />} title="Organization-wide Activity" chipLabel="Live Stream" chipColor="primary" />

              {loading ? (
                <Stack gap={1.2}>{Array.from(new Array(4)).map((_, i) => <Skeleton key={i} variant="rounded" height={60} sx={{ borderRadius: "10px" }} />)}</Stack>
              ) : activityFeed.length === 0 ? (
                <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.82rem", textAlign: "center", py: 4 }}>No activity recorded yet.</Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, maxHeight: 380, overflowY: "auto", pr: 0.5 }}>
                  {activityFeed.map((log) => {
                    const { icon: ActionIcon, color, soft } = getActionStyle(log.action_type);
                    return (
                      <Box key={log.id} sx={{ p: 1.3, borderRadius: "10px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}`, display: "flex", gap: 1.2 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: "9px", backgroundColor: soft, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <ActionIcon sx={{ fontSize: "1rem" }} />
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color }}>{log.action_type}</Typography>
                            <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted }}>{formatRelativeTime(log.created_at)}</Typography>
                          </Stack>
                          <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: COLORS.textPrimary }}>
                            {log.customer_name || "Lead"} ({log.lead_code || "-"})
                          </Typography>
                          {log.remark && <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, fontStyle: "italic" }}>"{log.remark}"</Typography>}
                          <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted, mt: 0.2 }}>By {log.performed_by_name || "System"}</Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Paper>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
};

export default Dashboard;