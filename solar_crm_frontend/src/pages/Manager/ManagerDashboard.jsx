import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getManagerDashboardStats } from "../../services/dashboardService";
import { assignLead } from "../../services/leadService";
import { useAuth } from "../../context/AuthContext";

// Recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  PieChart,
  Pie,
  CartesianGrid,
  Legend,
} from "recharts";

// MUI
import {
  Box,
  Typography,
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
  Button,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Skeleton,
  Grow,
  Fade,
} from "@mui/material";

// Icons
import GroupsIcon from "@mui/icons-material/Groups";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import HistoryIcon from "@mui/icons-material/History";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import DownloadIcon from "@mui/icons-material/Download";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import SolarPowerOutlinedIcon from "@mui/icons-material/SolarPowerOutlined";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CloseIcon from "@mui/icons-material/Close";
import PieChartOutlinedIcon from "@mui/icons-material/PieChartOutlined";
import BarChartIcon from "@mui/icons-material/BarChart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SearchIcon from "@mui/icons-material/Search";

import toast from "react-hot-toast";

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

const PIE_COLORS = ["#0284C7", "#D97706", "#0F172A", "#7C3AED", "#9333EA", "#16A34A", "#DC2626"];

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "M";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
  if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
  return `₹${num.toLocaleString("en-IN")}`;
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
          <Skeleton width={60} height={32} />
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

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [timeRange, setTimeRange] = useState("this_month");
  const [searchQuery, setSearchQuery] = useState("");

  const [teamPage, setTeamPage] = useState(0);
  const [teamRowsPerPage, setTeamRowsPerPage] = useState(5);

  const [openReassignModal, setOpenReassignModal] = useState(false);
  const [selectedFollowupLead, setSelectedFollowupLead] = useState(null);
  const [reassignToId, setReassignToId] = useState("");
  const [reassigning, setReassigning] = useState(false);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getManagerDashboardStats({ range: timeRange });
      if (res && res.success) {
        setDashboardData(res.data || res);
      } else {
        setError(res?.message || "Failed to load manager metrics.");
      }
    } catch (err) {
      console.error("Error fetching manager dashboard metrics:", err);
      setError(err.response?.data?.message || "Error loading live dashboard stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardStats();
    }
  }, [token, timeRange]);

  const {
    teamPerformance = [],
    statusBreakdown = [],
    pendingToday = 0,
    convertedToday = 0,
    overdueFollowups = 0,
    todaysFollowupsList = [],
    recentActivity = [],
  } = dashboardData || {};

  const totalAssignedLeads = useMemo(() => {
    return teamPerformance.reduce((acc, curr) => acc + (Number(curr.total_assigned) || 0), 0);
  }, [teamPerformance]);

  const totalConvertedDeals = useMemo(() => {
    return teamPerformance.reduce((acc, curr) => acc + (Number(curr.converted) || 0), 0);
  }, [teamPerformance]);

  const totalRevenueGenerated = useMemo(() => {
    return teamPerformance.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
  }, [teamPerformance]);

  const overallConversionRate = useMemo(() => {
    if (totalAssignedLeads === 0) return "0.0";
    return ((totalConvertedDeals / totalAssignedLeads) * 100).toFixed(1);
  }, [totalAssignedLeads, totalConvertedDeals]);

  const filteredTeamList = useMemo(() => {
    return teamPerformance.filter((m) =>
      m.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teamPerformance, searchQuery]);

  const handleExportCSV = () => {
    if (teamPerformance.length === 0) {
      toast.error("No performance data available to export.");
      return;
    }

    const headers = ["Sales Rep", "Total Assigned", "Converted (Won)", "Lost Deals", "In Progress", "Conversion Rate %", "Revenue (INR)"];
    const rows = teamPerformance.map((rep) => [
      `"${rep.full_name}"`,
      rep.total_assigned || 0,
      rep.converted || 0,
      rep.lost || 0,
      rep.in_progress || 0,
      `${rep.total_assigned ? ((rep.converted / rep.total_assigned) * 100).toFixed(1) : 0}%`,
      rep.revenue || 0,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Team_Performance_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Team Performance report exported!");
  };

  const handleOpenReassign = (lead) => {
    setSelectedFollowupLead(lead);
    setReassignToId("");
    setOpenReassignModal(true);
  };

  const handleConfirmReassign = async () => {
    if (!reassignToId) {
      toast.error("Please select a sales representative.");
      return;
    }

    setReassigning(true);
    try {
      await assignLead(selectedFollowupLead.id, { assigned_to: Number(reassignToId) });
      toast.success("Lead reassigned successfully!");
      setOpenReassignModal(false);
      fetchDashboardStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reassign lead.");
    } finally {
      setReassigning(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: COLORS.bg, minHeight: "100vh", width: "100%", boxSizing: "border-box" }}>
      {/* HEADER BANNER */}
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
            <Typography sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "1.15rem" }}>Manager Analytics Control Center</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.8rem", mt: 0.2 }}>
              Welcome back, <strong style={{ color: "#FFFFFF" }}>{user?.full_name || user?.name || "Manager"}</strong> - Team Performance & Lead Pipeline
            </Typography>
          </Box>
        </Box>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            startAdornment={<CalendarTodayIcon sx={{ fontSize: 14, mr: 1, color: "#FFFFFF" }} />}
            sx={{
              borderRadius: "10px",
              backgroundColor: "rgba(255,255,255,0.15)",
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "0.8rem",
              "& .MuiSelect-icon": { color: "#FFFFFF" },
              "& fieldset": { border: 0 },
            }}
          >
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="this_week">This Week</MenuItem>
            <MenuItem value="this_month">This Month</MenuItem>
            <MenuItem value="all_time">All Time</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {error && !loading && (
        <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: "12px", border: `1px solid ${COLORS.dangerSoft}`, backgroundColor: COLORS.dangerSoft, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <ErrorOutlineOutlinedIcon sx={{ color: COLORS.danger, fontSize: 20 }} />
            <Typography sx={{ color: COLORS.danger, fontWeight: 600, fontSize: "0.8rem" }}>{error}</Typography>
          </Stack>
          <Button variant="contained" size="small" onClick={fetchDashboardStats} sx={{ backgroundColor: COLORS.danger, "&:hover": { backgroundColor: "#B91C1C" }, textTransform: "none", fontWeight: 700 }}>
            Retry
          </Button>
        </Paper>
      )}

      {/* STAT CARDS ROW */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", xl: "repeat(5, 1fr)" }, gap: 2, mb: 2.5, width: "100%" }}>
        <StatCard label="TOTAL TEAM LEADS" value={totalAssignedLeads} caption={`${teamPerformance.length} sales reps active`} icon={<GroupsIcon sx={{ fontSize: 18 }} />} color={COLORS.info} softColor={COLORS.infoSoft} loading={loading} onClick={() => navigate("/manager/leads")} index={0} />
        <StatCard label="CONVERTED DEALS" value={totalConvertedDeals} caption={`${overallConversionRate}% team conversion`} icon={<CheckCircleOutlinedIcon sx={{ fontSize: 18 }} />} color={COLORS.success} softColor={COLORS.successSoft} loading={loading} onClick={() => navigate("/manager/leads")} index={1} />
        <StatCard label="TOTAL REVENUE" value={formatCurrency(totalRevenueGenerated)} caption="Cumulative converted deal value" icon={<AttachMoneyIcon sx={{ fontSize: 18 }} />} color={COLORS.warning} softColor={COLORS.warningSoft} loading={loading} onClick={() => navigate("/manager/reports")} index={2} />
        <StatCard label="TODAY'S FOLLOWUPS" value={pendingToday} caption="Pending followups due today" icon={<PendingActionsIcon sx={{ fontSize: 18 }} />} color={COLORS.purple} softColor={COLORS.purpleSoft} loading={loading} onClick={() => navigate("/manager/followups")} index={3} />
        <StatCard label="OVERDUE FOLLOWUPS" value={overdueFollowups} caption="Requires immediate assignment" icon={<WarningAmberOutlinedIcon sx={{ fontSize: 18 }} />} color={COLORS.danger} softColor={COLORS.dangerSoft} loading={loading} onClick={() => navigate("/manager/followups")} index={4} />
      </Box>

      <Fade in={!loading} timeout={500}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* ROW 1: TEAM PERFORMANCE GRAPH & STAGE BREAKDOWN */}
          <Box sx={{ display: "flex", gap: 2.5, flexDirection: { xs: "column", lg: "row" } }}>
            {/* TEAM PERFORMANCE BAR CHART */}
            <Paper elevation={0} sx={{ flex: 1.4, p: 2.5, borderRadius: "16px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
              <SectionHeader icon={<BarChartIcon sx={{ color: COLORS.primary, fontSize: 20 }} />} title="Sales Rep Deal Conversion Performance" />
              <Box sx={{ height: 260, width: "100%" }}>
                {loading ? (
                  <Skeleton variant="rounded" height="100%" />
                ) : teamPerformance.length === 0 ? (
                  <Typography sx={{ color: COLORS.textSecondary, textAlign: "center", py: 4 }}>No team performance data.</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="full_name" tick={{ fontSize: 11, fill: COLORS.textSecondary, fontWeight: 600 }} />
                      <YAxis tick={{ fontSize: 11, fill: COLORS.textSecondary }} allowDecimals={false} />
                      <RechartsTooltip contentStyle={{ borderRadius: "10px", border: `1px solid ${COLORS.border}`, fontSize: "0.78rem" }} />
                      <Bar dataKey="total_assigned" fill={COLORS.primary} name="Assigned Leads" radius={[6, 6, 0, 0]} barSize={22} />
                      <Bar dataKey="converted" fill={COLORS.success} name="Converted Deals" radius={[6, 6, 0, 0]} barSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>

            {/* STAGE BREAKDOWN DONUT */}
            <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: "16px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
              <SectionHeader icon={<PieChartOutlinedIcon sx={{ color: COLORS.purple, fontSize: 20 }} />} title="Team Lead Pipeline Distribution" />
              <Box sx={{ height: 240, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {loading ? (
                  <Skeleton variant="circular" width={160} height={160} />
                ) : statusBreakdown.length === 0 ? (
                  <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>No status data available.</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusBreakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3}>
                        {statusBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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

          {/* ROW 2: TEAM PERFORMANCE TABLE & TODAY'S ACTIONABLE FOLLOWUPS */}
          <Box sx={{ display: "flex", gap: 2.5, flexDirection: { xs: "column", lg: "row" } }}>
            {/* TEAM PERFORMANCE TABLE */}
            <Paper elevation={0} sx={{ flex: 1.4, p: 2.5, borderRadius: "16px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
                <SectionHeader icon={<GroupsIcon sx={{ color: COLORS.primary, fontSize: 20 }} />} title="Team Sales Performance Leaderboard" />
                <Button size="small" variant="outlined" startIcon={<DownloadIcon sx={{ fontSize: 14 }} />} onClick={handleExportCSV} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}>
                  Export CSV
                </Button>
              </Box>

              <Box sx={{ mb: 1.5 }}>
                <TextField
                  size="small"
                  placeholder="Search sales rep..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 16, color: COLORS.textMuted, mr: 1 }} /> }}
                  sx={{ width: 220, "& .MuiInputBase-root": { borderRadius: "8px", fontSize: "0.8rem" } }}
                />
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                      <TableCell sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.72rem" }}>Sales Executive</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.72rem" }}>Assigned</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.72rem" }}>Won</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.72rem" }}>Conversion Rate</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.72rem" }}>Revenue Generated</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTeamList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3, color: COLORS.textSecondary }}>No sales representatives found.</TableCell>
                      </TableRow>
                    ) : (
                      filteredTeamList
                        .slice(teamPage * teamRowsPerPage, teamPage * teamRowsPerPage + teamRowsPerPage)
                        .map((rep) => {
                          const rate = rep.total_assigned ? ((rep.converted / rep.total_assigned) * 100).toFixed(1) : "0.0";
                          return (
                            <TableRow key={rep.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate("/manager/team")}>
                              <TableCell>
                                <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: COLORS.textPrimary }}>{rep.full_name}</Typography>
                                <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted }}>{rep.email}</Typography>
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.8rem" }}>{rep.total_assigned}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800, color: COLORS.success, fontSize: "0.8rem" }}>{rep.converted}</TableCell>
                              <TableCell align="center">
                                <Chip label={`${rate}%`} size="small" sx={{ backgroundColor: Number(rate) > 20 ? COLORS.successSoft : COLORS.warningSoft, color: Number(rate) > 20 ? COLORS.success : COLORS.warning, fontWeight: 700, fontSize: "0.68rem" }} />
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800, color: COLORS.primary, fontSize: "0.8rem" }}>
                                {formatCurrency(rep.revenue)}
                              </TableCell>
                            </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10]}
                component="div"
                count={filteredTeamList.length}
                rowsPerPage={teamRowsPerPage}
                page={teamPage}
                onPageChange={(e, newPage) => setTeamPage(newPage)}
                onRowsPerPageChange={(e) => { setTeamRowsPerPage(parseInt(e.target.value, 10)); setTeamPage(0); }}
              />
            </Paper>

            {/* ACTIONABLE FOLLOWUPS LIST */}
            <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: "16px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
              <SectionHeader icon={<PendingActionsIcon sx={{ color: COLORS.warning, fontSize: 20 }} />} title="Actionable Team Follow-ups" chipLabel={`${todaysFollowupsList.length} Pending`} chipColor="warning" />

              {todaysFollowupsList.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <CheckCircleOutlinedIcon sx={{ fontSize: 36, color: COLORS.success, opacity: 0.8, mb: 1 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>All follow-ups updated!</Typography>
                </Box>
              ) : (
                <Stack gap={1.2} sx={{ maxHeight: 320, overflowY: "auto", pr: 0.5 }}>
                  {todaysFollowupsList.map((f) => (
                    <Box key={f.id} sx={{ p: 1.3, borderRadius: "10px", backgroundColor: f.is_overdue ? "#FEF2F2" : "#F8FAFC", border: `1px solid ${f.is_overdue ? "#FECACA" : COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: COLORS.textPrimary }}>{f.customer_name} ({f.lead_code})</Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: COLORS.textSecondary }}>Assigned: <strong>{f.rep_name || "Unassigned"}</strong></Typography>
                      </Box>
                      <Button size="small" variant="outlined" onClick={() => handleOpenReassign(f)} sx={{ fontSize: "0.7rem", textTransform: "none", fontWeight: 700, borderRadius: "6px" }}>
                        Reassign
                      </Button>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Box>
        </Box>
      </Fade>

      {/* REASSIGN MODAL */}
      <Dialog open={openReassignModal} onClose={() => setOpenReassignModal(false)} PaperProps={{ sx: { borderRadius: "12px", p: 1, minWidth: 320 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem" }}>Reassign Lead</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: COLORS.textSecondary, fontSize: "0.82rem" }}>
            Select a new sales representative for <strong>{selectedFollowupLead?.customer_name}</strong>:
          </Typography>
          <FormControl fullWidth size="small">
            <Select value={reassignToId} onChange={(e) => setReassignToId(e.target.value)} displayEmpty sx={{ borderRadius: "8px" }}>
              <MenuItem value="" disabled>Choose Sales Executive</MenuItem>
              {teamPerformance.map((rep) => (
                <MenuItem key={rep.id} value={rep.id}>{rep.full_name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenReassignModal(false)} sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleConfirmReassign} disabled={reassigning} variant="contained" disableElevation sx={{ backgroundColor: COLORS.primary, fontWeight: 700 }}>
            {reassigning ? "Reassigning..." : "Confirm Reassign"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManagerDashboard;