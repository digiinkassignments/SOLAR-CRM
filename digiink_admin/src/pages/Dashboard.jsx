import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Avatar,
  Card,
  CardContent,
  IconButton,
  Button,
  Stack,
  Tooltip,
  Skeleton,
} from "@mui/material";

// Recharts
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Icons
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CurrencyRupeeRoundedIcon from "@mui/icons-material/CurrencyRupeeRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import PieChartOutlineRoundedIcon from "@mui/icons-material/PieChartOutlineRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const COLORS = {
  primary: "#005BAC",
  primaryDark: "#0B3A63",
  primarySoft: "#E0F2FE",
  bg: "#F5F7FA",
  card: "#FFFFFF",
  border: "#E2E8F0",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  orange: "#EA580C",
  orangeSoft: "#FFEDD5",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
};

const PIE_COLORS = ["#16A34A", "#D97706", "#EA580C", "#DC2626"];

// ── Reusable Stat Card ──────────────────────────────────────────
const StatCard = ({ label, value, caption, icon, color, softColor, loading }) => (
  <Card
    elevation={0}
    sx={{
      height: "100%",
      borderRadius: "14px",
      border: `1px solid ${COLORS.border}`,
      backgroundColor: COLORS.card,
      transition: "box-shadow 0.2s ease, transform 0.2s ease",
      "&:hover": {
        boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
        transform: "translateY(-2px)",
      },
    }}
  >
    <CardContent sx={{ p: 2.2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.2 }}>
        <Typography sx={{ color: COLORS.textSecondary, fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.04em" }}>
          {label}
        </Typography>
        <Avatar sx={{ width: 34, height: 34, borderRadius: "10px", bgcolor: softColor, color }}>
          {icon}
        </Avatar>
      </Box>
      {loading ? (
        <Skeleton width={80} height={30} />
      ) : (
        <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1.35rem", lineHeight: 1.2 }}>
          {value}
        </Typography>
      )}
      <Typography sx={{ color: COLORS.textSecondary, mt: 0.5, display: "block", fontWeight: 600, fontSize: "0.72rem" }}>
        {loading ? <Skeleton width={110} height={14} /> : caption}
      </Typography>
    </CardContent>
  </Card>
);

// ── Custom Tooltip for Area Chart ──────────────────────────────
const CustomAreaTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper
        elevation={3}
        sx={{
          p: 1.5,
          borderRadius: "10px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: "#FFFFFF",
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", color: COLORS.primaryDark, mb: 0.5 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: "0.75rem", color: COLORS.primary, fontWeight: 700 }}>
          Revenue: ₹{Number(payload[0]?.value || 0).toLocaleString("en-IN")}
        </Typography>
        {payload[1] && (
          <Typography sx={{ fontSize: "0.75rem", color: COLORS.success, fontWeight: 600 }}>
            Renewals: {payload[1]?.value}
          </Typography>
        )}
      </Paper>
    );
  }
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { admin } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get("/dashboard");
      setData(res.data?.data || {});
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const statusMap = {};
  (data?.status_summary || []).forEach((s) => {
    statusMap[s.status] = s.total;
  });

  const activeCount = statusMap["Active"] || 0;
  const expiringCount = statusMap["Expiring Soon"] || 0;
  const graceCount = statusMap["Grace Period"] || 0;
  const lockedCount = statusMap["Locked"] || 0;
  const totalClients = data?.total_clients || (activeCount + expiringCount + graceCount + lockedCount);
  const revenueThisMonth = Number(data?.revenue_this_month || 0);
  const pendingPayments = Number(data?.pending_payments || 0);

  // Chart data Preparation
  const rawTrend = data?.monthly_trend || [];
  const chartTrendData = rawTrend.length > 0 ? rawTrend : [
    { month_label: "May", revenue: 15000, renewals: 3 },
    { month_label: "Jun", revenue: 28000, renewals: 5 },
    { month_label: "Jul", revenue: 42000, renewals: 8 },
    { month_label: "Aug", revenue: 39000, renewals: 7 },
    { month_label: "Sep", revenue: revenueThisMonth || 48000, renewals: 9 },
  ];

  const statusPieData = [
    { name: "Active", value: activeCount || 1, color: COLORS.success },
    { name: "Expiring Soon", value: expiringCount || 0, color: COLORS.warning },
    { name: "Grace Period", value: graceCount || 0, color: COLORS.orange },
    { name: "Locked", value: lockedCount || 0, color: COLORS.danger },
  ].filter((item) => item.value > 0);

  return (
    <Box sx={{ width: "100%" }}>
      {/* Top Welcome Control Center Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 2.8,
          mb: 3,
          borderRadius: "16px",
          background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          boxShadow: "0 8px 24px rgba(11, 58, 99, 0.15)",
          width: "100%",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              borderRadius: "12px",
              backgroundColor: "rgba(255,255,255,0.15)",
              color: "#FFFFFF",
            }}
          >
            <ShieldOutlinedIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "1.15rem" }}>
              Super Admin Control Center
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.82rem", mt: 0.3 }}>
              Welcome back, <strong style={{ color: "#FFFFFF" }}>{admin?.full_name || "Digiink Admin"}</strong> — Multi-Tenant SaaS Overview & Subscriptions
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Tooltip title="Refresh data">
            <IconButton
              onClick={() => fetchDashboard(true)}
              disabled={refreshing || loading}
              sx={{
                backgroundColor: "rgba(255,255,255,0.12)",
                color: "#FFFFFF",
                borderRadius: "10px",
                width: 40,
                height: 40,
                "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
              }}
            >
              <RefreshRoundedIcon
                sx={{
                  fontSize: 20,
                  animation: refreshing ? "spin 0.9s linear infinite" : "none",
                  "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                }}
              />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            size="small"
            startIcon={<PeopleAltOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate("/clients/new")}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "10px",
              px: 2.2,
              py: 1,
              fontSize: "0.82rem",
              backgroundColor: "rgba(255,255,255,0.95)",
              color: COLORS.primaryDark,
              "&:hover": { backgroundColor: "#FFFFFF" },
            }}
          >
            + New Client
          </Button>
        </Stack>
      </Paper>

      {/* 5 KPI Stat Cards (100% Full Width 5-Column Grid on Desktop) */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(5, 1fr)",
          },
          gap: 2.5,
          mb: 3,
          width: "100%",
        }}
      >
        <StatCard
          label="ACTIVE CLIENTS"
          value={activeCount}
          caption={`Out of ${totalClients} total clients`}
          icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: 18 }} />}
          color={COLORS.success}
          softColor={COLORS.successSoft}
          loading={loading}
        />

        <StatCard
          label="EXPIRING SOON"
          value={expiringCount}
          caption="Next 7 days renewal"
          icon={<WarningAmberRoundedIcon sx={{ fontSize: 18 }} />}
          color={COLORS.warning}
          softColor={COLORS.warningSoft}
          loading={loading}
        />

        <StatCard
          label="GRACE PERIOD"
          value={graceCount}
          caption="Pending renewal grace"
          icon={<HourglassEmptyRoundedIcon sx={{ fontSize: 18 }} />}
          color={COLORS.orange}
          softColor={COLORS.orangeSoft}
          loading={loading}
        />

        <StatCard
          label="LOCKED ACCOUNTS"
          value={lockedCount}
          caption="Access suspended"
          icon={<LockOutlinedIcon sx={{ fontSize: 18 }} />}
          color={COLORS.danger}
          softColor={COLORS.dangerSoft}
          loading={loading}
        />

        <StatCard
          label="MONTHLY REVENUE"
          value={`₹${revenueThisMonth.toLocaleString("en-IN")}`}
          caption="Collections this month"
          icon={<CurrencyRupeeRoundedIcon sx={{ fontSize: 18 }} />}
          color={COLORS.primary}
          softColor={COLORS.primarySoft}
          loading={loading}
        />
      </Box>

      {/* Analytics & Graphs Section (Full Width 100% 2-Column CSS Grid) */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "1.65fr 1fr",
          },
          gap: 2.5,
          mb: 3,
          width: "100%",
        }}
      >
        {/* Left: Revenue Trend Area Chart */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: "14px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            p: 2.5,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            width: "100%",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.2}>
              <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: COLORS.primary }} />
              <ShowChartRoundedIcon sx={{ color: COLORS.primary, fontSize: 20 }} />
              <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.95rem" }}>
                Revenue & Collections Trend
              </Typography>
            </Stack>
            <Chip
              label="Monthly Inflow"
              size="small"
              icon={<TrendingUpRoundedIcon sx={{ fontSize: "14px !important", color: COLORS.success }} />}
              sx={{
                fontWeight: 700,
                fontSize: "0.7rem",
                bgcolor: COLORS.successSoft,
                color: COLORS.success,
              }}
            />
          </Box>

          <Box sx={{ flex: 1, minHeight: 250, width: "100%" }}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="month_label"
                  stroke={COLORS.textMuted}
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke={COLORS.textMuted}
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <ChartTooltip content={<CustomAreaTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={COLORS.primary}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Right: Client Status Breakdown Donut Chart */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: "14px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            p: 2.5,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            width: "100%",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.2} mb={2}>
            <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: COLORS.success }} />
            <PieChartOutlineRoundedIcon sx={{ color: COLORS.success, fontSize: 20 }} />
            <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.95rem" }}>
              Client Subscription Health
            </Typography>
          </Stack>

          <Box sx={{ flex: 1, minHeight: 250, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip
                  formatter={(value, name) => [`${value} Clients`, name]}
                  contentStyle={{ borderRadius: "10px", border: `1px solid ${COLORS.border}`, fontSize: "0.75rem", fontWeight: 700 }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  formatter={(value) => (
                    <span style={{ color: COLORS.textPrimary, fontSize: "0.75rem", fontWeight: 600 }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>

      {/* Bottom Section: Expiring Soon Table & Pending Payments (Full Width 100% 2-Column CSS Grid) */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "1.65fr 1fr",
          },
          gap: 2.5,
          width: "100%",
        }}
      >
        {/* Expiring Soon Table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: "14px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            overflow: "hidden",
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              p: 2.2,
              borderBottom: `1px solid ${COLORS.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.2}>
              <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: COLORS.warning }} />
              <AccessTimeRoundedIcon sx={{ color: COLORS.warning, fontSize: 20 }} />
              <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.95rem" }}>
                Clients Expiring Soon (Next 7 Days)
              </Typography>
            </Stack>
            <Chip
              label={`${data?.expiring_soon?.length || 0} Clients`}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: "0.7rem",
                bgcolor: COLORS.warningSoft,
                color: COLORS.warning,
              }}
            />
          </Box>

          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {loading ? (
              <Box sx={{ p: 4, textAlign: "center", m: "auto" }}>
                <CircularProgress size={28} sx={{ color: COLORS.primary }} />
              </Box>
            ) : !data?.expiring_soon || data?.expiring_soon.length === 0 ? (
              <Box sx={{ p: 5, textAlign: "center", m: "auto" }}>
                <CheckCircleRoundedIcon sx={{ fontSize: 38, color: COLORS.success, mb: 1 }} />
                <Typography sx={{ color: COLORS.textPrimary, fontWeight: 700, fontSize: "0.9rem" }}>
                  All Subscriptions in Good Standing
                </Typography>
                <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.78rem", mt: 0.3 }}>
                  No client accounts expiring in the next 7 days.
                </Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, py: 1.4 }}>Client</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>Plan</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>Expiry Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary }}>Days Left</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.textPrimary, textAlign: "right" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.expiring_soon.map((c) => (
                    <TableRow
                      key={c.id}
                      hover
                      sx={{ "&:hover": { backgroundColor: "#F8FAFC" }, cursor: "pointer" }}
                      onClick={() => navigate(`/clients/${c.id}`)}
                    >
                      <TableCell sx={{ py: 1.4 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                          <Avatar
                            sx={{
                              width: 30,
                              height: 30,
                              backgroundColor: COLORS.primarySoft,
                              color: COLORS.primary,
                              fontSize: "0.72rem",
                              fontWeight: 700,
                            }}
                          >
                            {c.business_name?.[0]?.toUpperCase() || "C"}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: COLORS.textPrimary }}>
                              {c.business_name}
                            </Typography>
                            <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.7rem" }}>
                              {c.subdomain}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={c.plan_name || "Plan"}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            bgcolor: "rgba(0,91,172,0.06)",
                            color: COLORS.primary,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: "0.8rem", color: COLORS.textPrimary }}>
                          {new Date(c.subscription_end).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${c.days_left}d left`}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            bgcolor: c.days_left <= 2 ? COLORS.dangerSoft : COLORS.warningSoft,
                            color: c.days_left <= 2 ? COLORS.danger : COLORS.warning,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: "right" }}>
                        <Button
                          size="small"
                          variant="text"
                          endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 13 }} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/clients/${c.id}`);
                          }}
                          sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.75rem", color: COLORS.primary }}
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </Paper>

        {/* Pending Payments Action Card */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: "14px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            overflow: "hidden",
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              p: 2.2,
              borderBottom: `1px solid ${COLORS.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.2}>
              <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: COLORS.danger }} />
              <AccountBalanceWalletOutlinedIcon sx={{ color: COLORS.danger, fontSize: 20 }} />
              <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.95rem" }}>
                Pending Payments
              </Typography>
            </Stack>
            <Chip
              label={pendingPayments}
              size="small"
              sx={{
                bgcolor: pendingPayments > 0 ? COLORS.dangerSoft : "#F1F5F9",
                color: pendingPayments > 0 ? COLORS.danger : COLORS.textSecondary,
                fontWeight: 800,
                fontSize: "0.75rem",
              }}
            />
          </Box>

          <Box
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              textAlign: "center",
            }}
          >
            <Avatar
              sx={{
                width: 52,
                height: 52,
                backgroundColor: pendingPayments > 0 ? COLORS.warningSoft : COLORS.successSoft,
                color: pendingPayments > 0 ? COLORS.warning : COLORS.success,
                mb: 1.5,
              }}
            >
              {pendingPayments > 0 ? (
                <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 26 }} />
              ) : (
                <CheckCircleOutlineRoundedIcon sx={{ fontSize: 26 }} />
              )}
            </Avatar>

            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: COLORS.textPrimary, mb: 0.5 }}>
              {pendingPayments > 0 ? `${pendingPayments} Unverified Request(s)` : "All Payments Cleared"}
            </Typography>

            <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.78rem", maxWidth: 280, mb: 2.5 }}>
              {pendingPayments > 0
                ? "Clients have submitted UTR payment details requiring verification & renewal."
                : "No pending payment verification requests from any tenant at the moment."}
            </Typography>

            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate("/payments")}
              endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "10px",
                py: 1,
                backgroundColor: COLORS.primary,
                "&:hover": { backgroundColor: "#0A6FD8" },
              }}
            >
              Review Payments
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;