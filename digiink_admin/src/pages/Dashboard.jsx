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
  TableContainer,
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
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import PieChartOutlineRoundedIcon from "@mui/icons-material/PieChartOutlineRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const GOOGLE_COLORS = {
  blue: "#1A73E8",
  blueDark: "#0B57D0",
  blueSoft: "#E8F0FE",
  green: "#1E8E3E",
  greenSoft: "#E6F4EA",
  red: "#D93025",
  redSoft: "#FCE8E6",
  yellow: "#F9AB00",
  yellowSoft: "#FEF7E0",
  orange: "#E37400",
  orangeSoft: "#FEF3D6",
  bg: "#F8F9FA",
  card: "#FFFFFF",
  border: "#E0E3E7",
  textPrimary: "#202124",
  textSecondary: "#5F6368",
  textMuted: "#70757A",
};

const PIE_COLORS = ["#1E8E3E", "#F9AB00", "#E37400", "#D93025"];

// ── Reusable Google Stat Card ──────────────────────────────────────────
const StatCard = ({ label, value, caption, icon, color, softColor, loading }) => (
  <Card
    elevation={0}
    sx={{
      height: "100%",
      borderRadius: "16px",
      border: `1px solid ${GOOGLE_COLORS.border}`,
      backgroundColor: GOOGLE_COLORS.card,
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      "&:hover": {
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        borderColor: "#BDC1C6",
      },
    }}
  >
    <CardContent sx={{ p: 2.2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Typography
          sx={{
            color: GOOGLE_COLORS.textSecondary,
            fontWeight: 700,
            fontSize: "0.7rem",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {label}
        </Typography>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            borderRadius: "100px",
            bgcolor: softColor,
            color: color,
          }}
        >
          {icon}
        </Avatar>
      </Box>
      {loading ? (
        <Skeleton width={80} height={32} />
      ) : (
        <Typography
          sx={{
            fontWeight: 700,
            color: GOOGLE_COLORS.textPrimary,
            fontSize: "1.45rem",
            lineHeight: 1.1,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {value}
        </Typography>
      )}
      <Typography
        sx={{
          color: GOOGLE_COLORS.textMuted,
          mt: 0.6,
          display: "block",
          fontWeight: 500,
          fontSize: "0.75rem",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
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
        elevation={2}
        sx={{
          p: 1.5,
          borderRadius: "12px",
          border: `1px solid ${GOOGLE_COLORS.border}`,
          backgroundColor: "#FFFFFF",
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: GOOGLE_COLORS.textPrimary, mb: 0.4 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: "0.78rem", color: GOOGLE_COLORS.blue, fontWeight: 700 }}>
          Revenue: ₹{Number(payload[0]?.value || 0).toLocaleString("en-IN")}
        </Typography>
        {payload[1] && (
          <Typography sx={{ fontSize: "0.75rem", color: GOOGLE_COLORS.green, fontWeight: 600 }}>
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
    { name: "Active", value: activeCount || 1, color: GOOGLE_COLORS.green },
    { name: "Expiring Soon", value: expiringCount || 0, color: GOOGLE_COLORS.yellow },
    { name: "Grace Period", value: graceCount || 0, color: GOOGLE_COLORS.orange },
    { name: "Locked", value: lockedCount || 0, color: GOOGLE_COLORS.red },
  ].filter((item) => item.value > 0);

  return (
    <Box sx={{ width: "100%", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Google Cloud Header & Control Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          mb: 3,
          borderRadius: "20px",
          backgroundColor: "#FFFFFF",
          border: `1px solid ${GOOGLE_COLORS.border}`,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          width: "100%",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              width: 46,
              height: 46,
              borderRadius: "14px",
              backgroundColor: GOOGLE_COLORS.blueSoft,
              color: GOOGLE_COLORS.blue,
            }}
          >
            <ShieldOutlinedIcon sx={{ fontSize: 26 }} />
          </Avatar>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: GOOGLE_COLORS.textPrimary,
                fontSize: "1.2rem",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                lineHeight: 1.2,
              }}
            >
              Super Admin Infrastructure Console
            </Typography>
            <Typography
              sx={{
                color: GOOGLE_COLORS.textSecondary,
                fontSize: "0.82rem",
                mt: 0.3,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Logged in as <strong style={{ color: GOOGLE_COLORS.textPrimary }}>{admin?.full_name || "Digiink Admin"}</strong> • Monitoring all tenant instances & subscriptions
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Tooltip title="Refresh console data">
            <IconButton
              onClick={() => fetchDashboard(true)}
              disabled={refreshing || loading}
              sx={{
                border: `1px solid ${GOOGLE_COLORS.border}`,
                color: GOOGLE_COLORS.textSecondary,
                borderRadius: "100px",
                width: 38,
                height: 38,
                "&:hover": { backgroundColor: GOOGLE_COLORS.bg },
              }}
            >
              <RefreshRoundedIcon
                sx={{
                  fontSize: 19,
                  animation: refreshing ? "spin 0.9s linear infinite" : "none",
                  "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                }}
              />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            disableElevation
            startIcon={<AddRoundedIcon sx={{ fontSize: 18 }} />}
            onClick={() => navigate("/clients/new")}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "100px",
              px: 2.6,
              py: 0.95,
              fontSize: "0.85rem",
              backgroundColor: GOOGLE_COLORS.blue,
              color: "#FFFFFF",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              "&:hover": { backgroundColor: GOOGLE_COLORS.blueDark },
            }}
          >
            + Add New Client
          </Button>
        </Stack>
      </Paper>

      {/* 5 KPI Stat Cards (Google Cloud Metric Tile Grid) */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(5, 1fr)",
          },
          gap: 2,
          mb: 3,
          width: "100%",
        }}
      >
        <StatCard
          label="ACTIVE INSTANCES"
          value={activeCount}
          caption={`Out of ${totalClients} total tenants`}
          icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: 20 }} />}
          color={GOOGLE_COLORS.green}
          softColor={GOOGLE_COLORS.greenSoft}
          loading={loading}
        />

        <StatCard
          label="EXPIRING SOON"
          value={expiringCount}
          caption="Renewal within 7 days"
          icon={<WarningAmberRoundedIcon sx={{ fontSize: 20 }} />}
          color={GOOGLE_COLORS.yellow}
          softColor={GOOGLE_COLORS.yellowSoft}
          loading={loading}
        />

        <StatCard
          label="GRACE PERIOD"
          value={graceCount}
          caption="Overdue renewal window"
          icon={<HourglassEmptyRoundedIcon sx={{ fontSize: 20 }} />}
          color={GOOGLE_COLORS.orange}
          softColor={GOOGLE_COLORS.orangeSoft}
          loading={loading}
        />

        <StatCard
          label="LOCKED ACCOUNTS"
          value={lockedCount}
          caption="Access restricted"
          icon={<LockOutlinedIcon sx={{ fontSize: 20 }} />}
          color={GOOGLE_COLORS.red}
          softColor={GOOGLE_COLORS.redSoft}
          loading={loading}
        />

        <StatCard
          label="MONTHLY REVENUE"
          value={`₹${revenueThisMonth.toLocaleString("en-IN")}`}
          caption="Collections this month"
          icon={<CurrencyRupeeRoundedIcon sx={{ fontSize: 20 }} />}
          color={GOOGLE_COLORS.blue}
          softColor={GOOGLE_COLORS.blueSoft}
          loading={loading}
        />
      </Box>

      {/* Analytics & Graphs Section (Google Material Charts) */}
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
            borderRadius: "20px",
            border: `1px solid ${GOOGLE_COLORS.border}`,
            backgroundColor: GOOGLE_COLORS.card,
            p: 2.8,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            width: "100%",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.2}>
              <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: GOOGLE_COLORS.blue }} />
              <ShowChartRoundedIcon sx={{ color: GOOGLE_COLORS.blue, fontSize: 22 }} />
              <Typography sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, fontSize: "0.98rem" }}>
                Revenue & Collections Trend
              </Typography>
            </Stack>
            <Chip
              label="Monthly Metrics"
              size="small"
              icon={<TrendingUpRoundedIcon sx={{ fontSize: "14px !important", color: GOOGLE_COLORS.green }} />}
              sx={{
                fontWeight: 600,
                fontSize: "0.72rem",
                bgcolor: GOOGLE_COLORS.greenSoft,
                color: GOOGLE_COLORS.green,
                borderRadius: "100px",
              }}
            />
          </Box>

          <Box sx={{ flex: 1, minHeight: 250, width: "100%" }}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GOOGLE_COLORS.blue} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={GOOGLE_COLORS.blue} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F4" />
                <XAxis
                  dataKey="month_label"
                  stroke={GOOGLE_COLORS.textMuted}
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke={GOOGLE_COLORS.textMuted}
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <ChartTooltip content={<CustomAreaTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={GOOGLE_COLORS.blue}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Right: Tenant Status Donut Chart */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: "20px",
            border: `1px solid ${GOOGLE_COLORS.border}`,
            backgroundColor: GOOGLE_COLORS.card,
            p: 2.8,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            width: "100%",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.2} mb={2}>
            <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: GOOGLE_COLORS.green }} />
            <PieChartOutlineRoundedIcon sx={{ color: GOOGLE_COLORS.green, fontSize: 22 }} />
            <Typography sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, fontSize: "0.98rem" }}>
              Subscription Status Health
            </Typography>
          </Stack>

          <Box sx={{ flex: 1, minHeight: 250, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip
                  formatter={(value, name) => [`${value} Tenants`, name]}
                  contentStyle={{ borderRadius: "12px", border: `1px solid ${GOOGLE_COLORS.border}`, fontSize: "0.78rem", fontWeight: 600 }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  formatter={(value) => (
                    <span style={{ color: GOOGLE_COLORS.textPrimary, fontSize: "0.75rem", fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>

      {/* Bottom Section: Expiring Soon Table & Pending Payments */}
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
            borderRadius: "20px",
            border: `1px solid ${GOOGLE_COLORS.border}`,
            backgroundColor: GOOGLE_COLORS.card,
            overflow: "hidden",
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              p: 2.5,
              borderBottom: `1px solid ${GOOGLE_COLORS.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.2}>
              <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: GOOGLE_COLORS.yellow }} />
              <AccessTimeRoundedIcon sx={{ color: GOOGLE_COLORS.yellow, fontSize: 22 }} />
              <Typography sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, fontSize: "0.98rem" }}>
                Tenants Expiring Soon (Next 7 Days)
              </Typography>
            </Stack>
            <Chip
              label={`${data?.expiring_soon?.length || 0} Tenants`}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: "0.72rem",
                bgcolor: GOOGLE_COLORS.yellowSoft,
                color: GOOGLE_COLORS.yellow,
                borderRadius: "100px",
              }}
            />
          </Box>

          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {loading ? (
              <Box sx={{ p: 4, textAlign: "center", m: "auto" }}>
                <CircularProgress size={28} sx={{ color: GOOGLE_COLORS.blue }} />
              </Box>
            ) : !data?.expiring_soon || data?.expiring_soon.length === 0 ? (
              <Box sx={{ p: 5, textAlign: "center", m: "auto" }}>
                <CheckCircleRoundedIcon sx={{ fontSize: 40, color: GOOGLE_COLORS.green, mb: 1 }} />
                <Typography sx={{ color: GOOGLE_COLORS.textPrimary, fontWeight: 700, fontSize: "0.92rem" }}>
                  All Subscriptions Healthy
                </Typography>
                <Typography sx={{ color: GOOGLE_COLORS.textSecondary, fontSize: "0.8rem", mt: 0.3 }}>
                  No tenant instances expiring in the next 7 days.
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: 550 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#F8F9FA" }}>
                      <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, py: 1.5, px: 1.8, fontSize: "0.78rem" }}>Tenant Name</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 1.8, fontSize: "0.78rem" }}>Plan Tier</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 1.8, fontSize: "0.78rem" }}>Expiry Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 1.8, fontSize: "0.78rem" }}>Time Remaining</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, px: 1.8, textAlign: "right", fontSize: "0.78rem" }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.expiring_soon.map((c) => (
                      <TableRow
                        key={c.id}
                        hover
                        sx={{ "&:hover": { backgroundColor: "#F8F9FA" }, cursor: "pointer" }}
                        onClick={() => navigate(`/clients/${c.id}`)}
                      >
                        <TableCell sx={{ py: 1.5, px: 1.8 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                backgroundColor: GOOGLE_COLORS.blueSoft,
                                color: GOOGLE_COLORS.blue,
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                borderRadius: "100px",
                              }}
                            >
                              {c.business_name?.[0]?.toUpperCase() || "C"}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: GOOGLE_COLORS.textPrimary }}>
                                {c.business_name}
                              </Typography>
                              <Typography sx={{ color: GOOGLE_COLORS.textMuted, fontSize: "0.72rem" }}>
                                {c.subdomain}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ px: 1.8 }}>
                          <Chip
                            label={c.plan_name || "Plan"}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: "0.72rem",
                              bgcolor: GOOGLE_COLORS.blueSoft,
                              color: GOOGLE_COLORS.blue,
                              borderRadius: "100px",
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ px: 1.8 }}>
                          <Typography sx={{ fontSize: "0.82rem", color: GOOGLE_COLORS.textPrimary }}>
                            {new Date(c.subscription_end).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ px: 1.8 }}>
                          <Chip
                            label={`${c.days_left}d left`}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.72rem",
                              bgcolor: c.days_left <= 2 ? GOOGLE_COLORS.redSoft : GOOGLE_COLORS.yellowSoft,
                              color: c.days_left <= 2 ? GOOGLE_COLORS.red : GOOGLE_COLORS.yellow,
                              borderRadius: "100px",
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: "right", px: 1.8 }}>
                          <Button
                            size="small"
                            variant="text"
                            endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/clients/${c.id}`);
                            }}
                            sx={{
                              textTransform: "none",
                              fontWeight: 600,
                              fontSize: "0.78rem",
                              color: GOOGLE_COLORS.blue,
                              borderRadius: "100px",
                            }}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Paper>

        {/* Pending Payments Action Card */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: "20px",
            border: `1px solid ${GOOGLE_COLORS.border}`,
            backgroundColor: GOOGLE_COLORS.card,
            overflow: "hidden",
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              p: 2.5,
              borderBottom: `1px solid ${GOOGLE_COLORS.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.2}>
              <Box sx={{ width: 4, height: 18, borderRadius: "4px", backgroundColor: GOOGLE_COLORS.red }} />
              <AccountBalanceWalletOutlinedIcon sx={{ color: GOOGLE_COLORS.red, fontSize: 22 }} />
              <Typography sx={{ fontWeight: 700, color: GOOGLE_COLORS.textPrimary, fontSize: "0.98rem" }}>
                Pending Verification
              </Typography>
            </Stack>
            <Chip
              label={pendingPayments}
              size="small"
              sx={{
                bgcolor: pendingPayments > 0 ? GOOGLE_COLORS.redSoft : GOOGLE_COLORS.bg,
                color: pendingPayments > 0 ? GOOGLE_COLORS.red : GOOGLE_COLORS.textMuted,
                fontWeight: 700,
                fontSize: "0.75rem",
                borderRadius: "100px",
              }}
            />
          </Box>

          <Box
            sx={{
              p: 3.5,
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
                width: 56,
                height: 56,
                backgroundColor: pendingPayments > 0 ? GOOGLE_COLORS.yellowSoft : GOOGLE_COLORS.greenSoft,
                color: pendingPayments > 0 ? GOOGLE_COLORS.yellow : GOOGLE_COLORS.green,
                mb: 2,
                borderRadius: "100px",
              }}
            >
              {pendingPayments > 0 ? (
                <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 28 }} />
              ) : (
                <CheckCircleOutlineRoundedIcon sx={{ fontSize: 28 }} />
              )}
            </Avatar>

            <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: GOOGLE_COLORS.textPrimary, mb: 0.6 }}>
              {pendingPayments > 0 ? `${pendingPayments} Pending Request(s)` : "All Payments Cleared"}
            </Typography>

            <Typography sx={{ color: GOOGLE_COLORS.textSecondary, fontSize: "0.82rem", maxWidth: 290, mb: 3 }}>
              {pendingPayments > 0
                ? "Tenants have submitted UTR payment proofs requiring administrative review and license renewal."
                : "No pending payment verification requests from any tenant at the moment."}
            </Typography>

            <Button
              variant="contained"
              disableElevation
              fullWidth
              onClick={() => navigate("/payments")}
              endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "100px",
                py: 1.1,
                backgroundColor: GOOGLE_COLORS.blue,
                color: "#FFFFFF",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                "&:hover": { backgroundColor: GOOGLE_COLORS.blueDark },
              }}
            >
              Manage Payments
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;