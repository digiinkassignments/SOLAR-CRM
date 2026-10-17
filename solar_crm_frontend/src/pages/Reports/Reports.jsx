import React, { useState, useEffect, useMemo } from "react";
import api from "../../api/axios";
import { getUsers } from "../../services/userServices";
import { getLeads } from "../../services/leadService";

import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  CircularProgress,
  IconButton,
  Tooltip,
  Button,
  Card,
  CardContent,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  Tabs,
  Tab,
  Stack,
  TablePagination,
  Divider,
} from "@mui/material";

// Icons
import AssessmentIcon from "@mui/icons-material/Assessment";
import RefreshIcon from "@mui/icons-material/Refresh";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import SupervisorAccountOutlinedIcon from "@mui/icons-material/SupervisorAccountOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SourceOutlinedIcon from "@mui/icons-material/SourceOutlined";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import PendingOutlinedIcon from "@mui/icons-material/PendingOutlined";
import PauseCircleFilledIcon from "@mui/icons-material/PauseCircleFilled";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

import logo from "../../assets/images/logo.png";

// ═══════════════════════════════════════════════════════════
// THEME & COLOR PALETTE
// ═══════════════════════════════════════════════════════════
const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000";

const C = {
  primary: "#0F172A",
  primaryDark: "#020617",
  primarySoft: "#FEF3C7",
  accent: "#F59E0B",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
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
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
};

const PERIOD_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "this_month", label: "This Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "this_year", label: "This Year" },
];

const getPeriodRange = (p) => {
  const n = new Date();
  if (p === "this_month") return { start: new Date(n.getFullYear(), n.getMonth(), 1), end: n };
  if (p === "this_quarter") {
    const q = Math.floor(n.getMonth() / 3);
    return { start: new Date(n.getFullYear(), q * 3, 1), end: n };
  }
  if (p === "this_year") return { start: new Date(n.getFullYear(), 0, 1), end: n };
  return null;
};

const formatINR = (v) => {
  const n = Number(v) || 0;
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
};

const formatDate = (dateVal) => {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
};

const hashHue = (s = "") => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
};

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "?";
  const p = name.trim().split(" ");
  return p.length === 1 ? p[0].charAt(0).toUpperCase() : (p[0].charAt(0) + p[p.length - 1].charAt(0)).toUpperCase();
};

const getProfileUrl = (user) => {
  if (!user) return null;
  const candidates = [
    user.profile_image, user.profile_photo, user.profile_pic,
    user.avatar, user.photo, user.image, user.picture,
  ];
  let imgPath = null;
  for (const url of candidates) {
    if (typeof url === "string" && url.trim().length > 0 && url !== "null" && url !== "undefined") {
      imgPath = url.trim();
      break;
    }
  }
  if (!imgPath) return null;
  if (imgPath.startsWith("http")) return `${imgPath}?v=${Date.now()}`;
  let cleanPath = imgPath.startsWith("/") ? imgPath.slice(1) : imgPath;
  if (!cleanPath.startsWith("uploads/profiles/")) {
    if (cleanPath.startsWith("uploads/")) {
      cleanPath = cleanPath.replace("uploads/", "uploads/profiles/");
    } else {
      cleanPath = `uploads/profiles/${cleanPath}`;
    }
  }
  return `${API_BASE_URL}/${cleanPath}?v=${Date.now()}`;
};

// ═══════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════
const UserAvatar = ({ user, size = 36 }) => {
  const photoUrl = getProfileUrl(user);
  const hue = hashHue(user?.full_name || "?");
  if (photoUrl) {
    return (
      <Avatar
        src={photoUrl}
        alt={user?.full_name || ""}
        imgProps={{ onError: (e) => { e.target.style.display = "none"; } }}
        sx={{ width: size, height: size, flexShrink: 0, border: `2px solid ${C.border}`, "& img": { objectFit: "cover" } }}
      >
        {getInitials(user?.full_name)}
      </Avatar>
    );
  }
  return (
    <Avatar
      sx={{
        width: size, height: size, flexShrink: 0, fontSize: size * 0.38, fontWeight: 800,
        background: `linear-gradient(135deg, hsl(${hue}, 55%, 52%), hsl(${hue + 35}, 58%, 40%))`,
        border: `2px solid ${C.border}`, color: "#FFF",
      }}
    >
      {getInitials(user?.full_name)}
    </Avatar>
  );
};

const StatCard = ({ label, value, caption, icon, color, softColor, loading }) => (
  <Card
    elevation={0}
    sx={{
      flex: "1 1 200px", minWidth: 200, borderRadius: "14px",
      border: `1px solid ${C.border}`, backgroundColor: C.card,
      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      transition: "all 0.22s ease",
      "&:hover": { boxShadow: `0 6px 20px ${color}15`, transform: "translateY(-2px)", borderColor: `${color}40` },
    }}
  >
    <CardContent sx={{ p: 2.2, "&:last-child": { pb: 2.2 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Typography sx={{ color: C.textMuted, fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {label}
        </Typography>
        <Avatar sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: softColor, color, boxShadow: `0 2px 8px ${color}20` }}>
          {icon}
        </Avatar>
      </Box>
      <Typography sx={{ fontWeight: 900, color: C.textPrimary, fontSize: "1.45rem", lineHeight: 1, letterSpacing: "-0.02em" }}>
        {loading ? "—" : value}
      </Typography>
      <Box sx={{ mt: 1, height: 4, borderRadius: 2, bgcolor: C.borderLight, overflow: "hidden" }}>
        <Box sx={{ height: "100%", width: "65%", borderRadius: 2, bgcolor: color, opacity: 0.6 }} />
      </Box>
      {caption && (
        <Typography sx={{ color: C.textMuted, mt: 0.8, display: "block", fontWeight: 600, fontSize: "0.7rem" }}>
          {caption}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const ConversionCell = ({ rate }) => {
  const n = Number(rate);
  const barColor = n >= 30 ? C.success : n >= 15 ? C.warning : C.danger;
  const chipBg = n >= 30 ? C.successSoft : n >= 15 ? C.warningSoft : C.dangerSoft;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 140 }}>
      <Box sx={{ flex: 1 }}>
        <LinearProgress variant="determinate" value={Math.min(n, 100)} sx={{ height: 7, borderRadius: 4, backgroundColor: "#F1F5F9", "& .MuiLinearProgress-bar": { backgroundColor: barColor, borderRadius: 4 } }} />
      </Box>
      <Chip label={`${rate}%`} size="small" sx={{ fontWeight: 800, fontSize: "0.68rem", height: 20, minWidth: 44, backgroundColor: chipBg, color: barColor, border: `1px solid ${barColor}25` }} />
    </Box>
  );
};

const EmptyState = ({ icon, title, description }) => (
  <Box sx={{ py: 7, textAlign: "center", px: 3 }}>
    <Box sx={{ width: 56, height: 56, borderRadius: "14px", backgroundColor: C.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 1.8, color: C.primary }}>
      {icon}
    </Box>
    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: C.textPrimary, mb: 0.5 }}>{title}</Typography>
    <Typography sx={{ fontSize: "0.8rem", color: C.textMuted, maxWidth: 420, mx: "auto", lineHeight: 1.5 }}>{description}</Typography>
  </Box>
);

const DonutChart = ({ segments, size = 160, strokeWidth = 22, centerLabel = "Leads" }) => {
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const cx = size / 2;
  let acc = 0;
  return (
    <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={radius} fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth} />
        {segments.map((seg, i) => {
          if (seg.value === 0) return null;
          const pct = total > 0 ? seg.value / total : 0;
          const dash = pct * circ;
          const gap = circ - dash;
          const rot = -90 + acc * 360;
          acc += pct;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cx}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${gap}`}
              transform={`rotate(${rot} ${cx} ${cx})`}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <Box sx={{ position: "absolute", textAlign: "center" }}>
        <Typography sx={{ fontWeight: 900, fontSize: "1.3rem", color: C.textPrimary, lineHeight: 1 }}>{total}</Typography>
        <Typography sx={{ fontSize: "0.6rem", color: C.textMuted, fontWeight: 700, letterSpacing: "0.05em", mt: 0.3, textTransform: "uppercase" }}>{centerLabel}</Typography>
      </Box>
    </Box>
  );
};

const TH = ({ children, align = "left" }) => (
  <TableCell align={align} sx={{ fontWeight: 800, color: C.primaryDark, fontSize: "0.7rem", letterSpacing: "0.04em", textTransform: "uppercase", py: 1.4, px: 2, whiteSpace: "nowrap", borderBottom: `2px solid ${C.border}` }}>
    {children}
  </TableCell>
);

const isManager = (u) => Number(u.role_id) === 2 || u.role_name === "Manager" || u.role === "Manager";
const isSalesRep = (u) => Number(u.role_id) === 3 || u.role_name === "Sales" || u.role === "Sales";

// ═══════════════════════════════════════════════════════════
// MAIN REPORT COMPONENT
// ═══════════════════════════════════════════════════════════
const Reports = () => {
  // Main Tab (0: Sales & Leads, 1: Project Execution, 2: Financial, 3: Field Operations, 4: AMC & Warranty)
  const [mainTab, setMainTab] = useState(0);

  // Global Date Filter applied across all tabs
  const [period, setPeriod] = useState("all");
  const [loading, setLoading] = useState(true);

  // Tab 1 Data States
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeLeadView, setActiveLeadView] = useState(0);
  const [repPage, setRepPage] = useState(0);
  const [repRowsPerPage, setRepRowsPerPage] = useState(10);

  // Tab 2 Data States (Projects)
  const [projectsData, setProjectsData] = useState({ total: 0, inProgress: 0, completed: 0, stalled: 0, funnelCounts: {}, projects: [] });
  const [projectPage, setProjectPage] = useState(0);
  const [projectRowsPerPage, setProjectRowsPerPage] = useState(10);

  // Tab 3 Data States (Financials)
  const [financialsData, setFinancialsData] = useState({ totalInvoiced: 0, totalCollected: 0, totalOutstanding: 0, totalOverdue: 0, statusCounts: {}, monthlyRevenue: [], invoices: [] });
  const [invoicePage, setInvoicePage] = useState(0);
  const [invoiceRowsPerPage, setInvoiceRowsPerPage] = useState(10);

  // Tab 4 Data States (Field Operations)
  const [fieldOpsData, setFieldOpsData] = useState({ inspectionsDone: 0, installationsActive: 0, commissioningPending: 0, handoversComplete: 0, phaseCounts: {}, operations: [] });
  const [opsPage, setOpsPage] = useState(0);
  const [opsRowsPerPage, setOpsPageRowsPerPage] = useState(10);

  // Tab 5 Data States (AMC & Warranty)
  const [warrantyData, setWarrantyData] = useState({ activeContracts: 0, expiringThisMonth: 0, serviceVisitsThisMonth: 0, pendingVisits: 0, planCounts: {}, amcList: [] });
  const [amcPage, setAmcPage] = useState(0);
  const [amcRowsPerPage, setAmcRowsPerPage] = useState(10);

  // Fetch All Modules Data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [leadsRes, usersRes, projRes, finRes, opsRes, warRes] = await Promise.allSettled([
        getLeads({ page: 1, limit: 5000 }),
        getUsers({ limit: 200 }),
        api.get("/reports/projects"),
        api.get("/reports/financials"),
        api.get("/reports/field-operations"),
        api.get("/reports/warranty-amc"),
      ]);

      if (leadsRes.status === "fulfilled") {
        const lRaw = leadsRes.value?.data;
        setLeads(Array.isArray(lRaw) ? lRaw : lRaw?.data || []);
      }

      if (usersRes.status === "fulfilled") {
        const uRaw = usersRes.value?.data;
        setUsers(Array.isArray(uRaw) ? uRaw : uRaw?.data || []);
      }

      if (projRes.status === "fulfilled" && projRes.value?.data?.success) {
        setProjectsData(projRes.value.data.data);
      }

      if (finRes.status === "fulfilled" && finRes.value?.data?.success) {
        setFinancialsData(finRes.value.data.data);
      }

      if (opsRes.status === "fulfilled" && opsRes.value?.data?.success) {
        setFieldOpsData(opsRes.value.data.data);
      }

      if (warRes.status === "fulfilled" && warRes.value?.data?.success) {
        setWarrantyData(warRes.value.data.data);
      }
    } catch (err) {
      console.error("Error fetching report data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ─────────────────────────────────────────────────────────────
  // TAB 1: SALES & LEADS MEMOIZED ANALYTICS
  // ─────────────────────────────────────────────────────────────
  const filteredLeads = useMemo(() => {
    const range = getPeriodRange(period);
    if (!range) return leads;
    return leads.filter((l) => {
      const d = new Date(l.created_at);
      return d >= range.start && d <= range.end;
    });
  }, [leads, period]);

  const orgSummary = useMemo(() => {
    const total = filteredLeads.length;
    const won = filteredLeads.filter((l) => l.status === "Won").length;
    const lost = filteredLeads.filter((l) => l.status === "Lost").length;
    const active = total - won - lost;
    const conversionRate = total > 0 ? ((won / total) * 100).toFixed(1) : "0.0";
    const revenue = filteredLeads
      .filter((l) => l.status === "Won")
      .reduce((s, l) => s + (Number(l.quotation_amount) || 0), 0);
    return { total, won, lost, active, conversionRate, revenue };
  }, [filteredLeads]);

  const managers = useMemo(() => users.filter(isManager), [users]);
  const reps = useMemo(() => users.filter(isSalesRep), [users]);

  const managerReports = useMemo(() => {
    return managers.map((mgr) => {
      const teamRepIds = reps.filter((r) => Number(r.manager_id) === Number(mgr.id)).map((r) => r.id);
      const teamLeads = filteredLeads.filter(
        (l) => teamRepIds.includes(l.assigned_to) || Number(l.assigned_to) === Number(mgr.id) || Number(l.created_by) === Number(mgr.id)
      );
      const total = teamLeads.length;
      const won = teamLeads.filter((l) => l.status === "Won").length;
      const lost = teamLeads.filter((l) => l.status === "Lost").length;
      const active = total - won - lost;
      const rate = total > 0 ? ((won / total) * 100).toFixed(1) : "0.0";
      const revenue = teamLeads.filter((l) => l.status === "Won").reduce((s, l) => s + (Number(l.quotation_amount) || 0), 0);
      return { user: mgr, id: mgr.id, name: mgr.full_name, email: mgr.email, teamSize: teamRepIds.length, total, won, lost, active, rate, revenue };
    });
  }, [managers, reps, filteredLeads]);

  const repReports = useMemo(() => {
    return reps.map((rep) => {
      const repLeads = filteredLeads.filter((l) => Number(l.assigned_to) === Number(rep.id));
      const total = repLeads.length;
      const won = repLeads.filter((l) => l.status === "Won").length;
      const lost = repLeads.filter((l) => l.status === "Lost").length;
      const active = total - won - lost;
      const rate = total > 0 ? ((won / total) * 100).toFixed(1) : "0.0";
      const revenue = repLeads.filter((l) => l.status === "Won").reduce((s, l) => s + (Number(l.quotation_amount) || 0), 0);
      const managerName = rep.manager_name || managers.find((m) => Number(m.id) === Number(rep.manager_id))?.full_name || "Unassigned";
      return { user: rep, id: rep.id, name: rep.full_name, email: rep.email, managerName, total, won, lost, active, rate, revenue };
    });
  }, [reps, filteredLeads, managers]);

  const sourcePerformance = useMemo(() => {
    const map = {};
    filteredLeads.forEach((l) => {
      const src = l.lead_source || "Other";
      if (!map[src]) map[src] = { total: 0, won: 0 };
      map[src].total += 1;
      if (l.status === "Won") map[src].won += 1;
    });
    return Object.entries(map).map(([source, v]) => ({
      source,
      ...v,
      rate: v.total > 0 ? Math.round((v.won / v.total) * 100) : 0,
    })).sort((a, b) => b.total - a.total);
  }, [filteredLeads]);

  const donutSegments = useMemo(() => [
    { label: "Won", value: orgSummary.won, color: C.success },
    { label: "Lost", value: orgSummary.lost, color: C.danger },
    { label: "Active", value: orgSummary.active, color: C.primary },
  ], [orgSummary]);

  // ─────────────────────────────────────────────────────────────
  // TAB 2: PROJECT EXECUTION FILTERING
  // ─────────────────────────────────────────────────────────────
  const filteredProjects = useMemo(() => {
    const range = getPeriodRange(period);
    const list = projectsData.projects || [];
    if (!range) return list;
    return list.filter((p) => {
      const d = new Date(p.created_at || p.installation_start_date);
      return d >= range.start && d <= range.end;
    });
  }, [projectsData.projects, period]);

  const projectStats = useMemo(() => {
    const total = filteredProjects.length;
    let completed = 0;
    let inProgress = 0;
    let stalled = 0;
    const now = new Date();

    filteredProjects.forEach((p) => {
      if (p.stage === "Handover Done" || p.stage === "Warranty Period") {
        completed++;
      } else {
        inProgress++;
        const lastUpdated = new Date(p.updated_at || p.created_at);
        const diffDays = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));
        if (diffDays > 30) stalled++;
      }
    });
    return { total, completed, inProgress, stalled };
  }, [filteredProjects]);

  const funnelStages = [
    { label: "Pre-Install Inspection", stages: ["Pre-Install Inspection"] },
    { label: "Installation in Progress", stages: ["Installation in Progress"] },
    { label: "Testing & Commissioning", stages: ["Testing & Commissioning"] },
    { label: "Final Inspection", stages: ["Final Inspection"] },
    { label: "Customer Handover", stages: ["Customer Handover", "Handover Done", "Warranty Period"] },
  ];

  const funnelCounts = useMemo(() => {
    const counts = {};
    funnelStages.forEach((f) => {
      counts[f.label] = filteredProjects.filter((p) => f.stages.includes(p.stage)).length;
    });
    return counts;
  }, [filteredProjects]);

  const maxFunnelVal = Math.max(1, ...Object.values(funnelCounts));

  // ─────────────────────────────────────────────────────────────
  // TAB 3: FINANCIALS FILTERING
  // ─────────────────────────────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    const range = getPeriodRange(period);
    const list = financialsData.invoices || [];
    if (!range) return list;
    return list.filter((inv) => {
      const d = new Date(inv.created_at);
      return d >= range.start && d <= range.end;
    });
  }, [financialsData.invoices, period]);

  const financialStats = useMemo(() => {
    let invoiced = 0;
    let collected = 0;
    let outstanding = 0;
    let overdue = 0;
    const now = new Date();

    const statusMap = { Paid: 0, "Partially Paid": 0, Unpaid: 0 };

    filteredInvoices.forEach((inv) => {
      const tot = Number(inv.total_amount) || 0;
      const pd = Number(inv.paid_amount) || 0;
      const bal = Number(inv.balance_amount) || (tot - pd);

      invoiced += tot;
      collected += pd;
      outstanding += bal;

      const dueDate = inv.due_date ? new Date(inv.due_date) : null;
      if (dueDate && dueDate < now && bal > 0) overdue += bal;

      const st = inv.payment_status || (bal <= 0 ? "Paid" : pd > 0 ? "Partially Paid" : "Unpaid");
      if (st === "Paid") statusMap.Paid++;
      else if (st === "Partially Paid") statusMap["Partially Paid"]++;
      else statusMap.Unpaid++;
    });

    return { invoiced, collected, outstanding, overdue, statusMap };
  }, [filteredInvoices]);

  const paymentDonutSegments = useMemo(() => [
    { label: "Paid", value: financialStats.statusMap.Paid || 0, color: C.success },
    { label: "Partial", value: financialStats.statusMap["Partially Paid"] || 0, color: C.warning },
    { label: "Unpaid", value: financialStats.statusMap.Unpaid || 0, color: C.danger },
  ], [financialStats]);

  // ─────────────────────────────────────────────────────────────
  // TAB 4: FIELD OPERATIONS FILTERING
  // ─────────────────────────────────────────────────────────────
  const filteredOperations = useMemo(() => {
    const range = getPeriodRange(period);
    const list = fieldOpsData.operations || [];
    if (!range) return list;
    return list.filter((op) => {
      const d = new Date(op.created_at);
      return d >= range.start && d <= range.end;
    });
  }, [fieldOpsData.operations, period]);

  const fieldOpsStats = useMemo(() => {
    let inspDone = 0;
    let installActive = 0;
    let commPending = 0;
    let handoversDone = 0;

    const phaseMap = {
      "Mounting Structure": 0,
      "Panel Installation": 0,
      "Electrical & Wiring": 0,
      "Inverter Installation": 0,
      "Final Testing & Safety": 0,
    };

    filteredOperations.forEach((op) => {
      if (op.inspection_status === "Completed" || op.inspection_status === "Approved") inspDone++;
      if (op.installation_percent > 0 && op.installation_percent < 100) {
        installActive++;
        if (op.current_phase && phaseMap[op.current_phase] !== undefined) {
          phaseMap[op.current_phase]++;
        } else {
          phaseMap["Mounting Structure"]++;
        }
      }
      if (op.commissioning_result === "Pending Test" || op.commissioning_result === "Fail") commPending++;
      if (op.handover_status === "Signed") handoversDone++;
    });

    return { inspDone, installActive, commPending, handoversDone, phaseMap };
  }, [filteredOperations]);

  const maxPhaseVal = Math.max(1, ...Object.values(fieldOpsStats.phaseMap));

  // ─────────────────────────────────────────────────────────────
  // TAB 5: AMC & WARRANTY FILTERING
  // ─────────────────────────────────────────────────────────────
  const filteredAmcList = useMemo(() => {
    const range = getPeriodRange(period);
    const list = warrantyData.amcList || [];
    if (!range) return list;
    return list.filter((item) => {
      const d = new Date(item.created_at);
      return d >= range.start && d <= range.end;
    });
  }, [warrantyData.amcList, period]);

  const amcStats = useMemo(() => {
    let active = 0;
    let expiring = 0;
    const now = new Date();
    const currM = now.getMonth();
    const currY = now.getFullYear();

    const planMap = { Basic: 0, Standard: 0, Premium: 0 };

    filteredAmcList.forEach((a) => {
      if (a.status === "Active") {
        active++;
        if (planMap[a.amc_plan] !== undefined) planMap[a.amc_plan]++;
      }
      if (a.expiry_date) {
        const expD = new Date(a.expiry_date);
        if (expD.getMonth() === currM && expD.getFullYear() === currY) expiring++;
      }
    });

    return {
      active,
      expiring,
      serviceVisits: warrantyData.serviceVisitsThisMonth || 0,
      pendingVisits: warrantyData.pendingVisits || 0,
      planMap,
    };
  }, [filteredAmcList, warrantyData]);

  const amcDonutSegments = useMemo(() => [
    { label: "Basic", value: amcStats.planMap.Basic || 0, color: C.info },
    { label: "Standard", value: amcStats.planMap.Standard || 0, color: C.accent },
    { label: "Premium", value: amcStats.planMap.Premium || 0, color: C.purple },
  ], [amcStats]);

  // ─────────────────────────────────────────────────────────────
  // CSV EXPORT HANDLERS PER TAB
  // ─────────────────────────────────────────────────────────────
  const exportCsv = (headers, rows, filename) => {
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.setAttribute("href", URL.createObjectURL(blob));
    a.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportCSV = () => {
    if (mainTab === 0) {
      // Sales & Leads
      const isM = activeLeadView === 0;
      const rows = isM ? managerReports : repReports;
      if (!rows?.length) return;
      const h = isM
        ? ["Manager Name", "Email", "Team Size", "Total Leads", "Active", "Won", "Lost", "Conversion Rate (%)", "Revenue Won"]
        : ["Rep Name", "Email", "Reporting Manager", "Total Leads", "Active", "Won", "Lost", "Conversion Rate (%)", "Revenue Won"];
      const d = rows.map((r) =>
        isM
          ? [`"${r.name}"`, `"${r.email}"`, r.teamSize, r.total, r.active, r.won, r.lost, `"${r.rate}%"`, r.revenue]
          : [`"${r.name}"`, `"${r.email}"`, `"${r.managerName}"`, r.total, r.active, r.won, r.lost, `"${r.rate}%"`, r.revenue]
      );
      exportCsv(h, d, `Solar_CRM_${isM ? "Manager" : "Rep"}_Report`);
    } else if (mainTab === 1) {
      // Project Execution
      const h = ["Project Number", "Customer Name", "System Size (kW)", "Stage", "Assigned Team", "Start Date", "Days Elapsed"];
      const d = filteredProjects.map((p) => {
        const start = p.installation_start_date ? new Date(p.installation_start_date) : new Date(p.created_at);
        const elapsed = Math.max(0, Math.floor((new Date() - start) / (1000 * 60 * 60 * 24)));
        return [
          `"${p.project_number}"`,
          `"${p.customer_name}"`,
          p.system_capacity_kw || 0,
          `"${p.stage}"`,
          `"${p.assigned_to_name || "Unassigned"}"`,
          `"${formatDate(p.installation_start_date || p.created_at)}"`,
          elapsed,
        ];
      });
      exportCsv(h, d, "Solar_CRM_Project_Execution_Report");
    } else if (mainTab === 2) {
      // Financials
      const h = ["Invoice #", "Customer", "Total Amount", "Paid Amount", "Balance", "Status", "Due Date"];
      const d = filteredInvoices.map((inv) => [
        `"${inv.invoice_number}"`,
        `"${inv.customer_name}"`,
        inv.total_amount,
        inv.paid_amount || 0,
        inv.balance_amount || 0,
        `"${inv.payment_status}"`,
        `"${formatDate(inv.due_date)}"`,
      ]);
      exportCsv(h, d, "Solar_CRM_Financial_Report");
    } else if (mainTab === 3) {
      // Field Operations
      const h = ["Project #", "Customer", "Inspection Status", "Installation Progress (%)", "Phase", "Commissioning Result", "Final Inspection", "Handover Status"];
      const d = filteredOperations.map((op) => [
        `"${op.project_number}"`,
        `"${op.customer_name}"`,
        `"${op.inspection_status}"`,
        `${op.installation_percent}%`,
        `"${op.current_phase}"`,
        `"${op.commissioning_result}"`,
        `"${op.final_inspection}"`,
        `"${op.handover_status}"`,
      ]);
      exportCsv(h, d, "Solar_CRM_Field_Operations_Report");
    } else if (mainTab === 4) {
      // AMC & Warranty
      const h = ["Project #", "Customer", "System Size (kW)", "AMC Plan", "AMC Expiry", "Last Visit", "Next Due Visit", "Status"];
      const d = filteredAmcList.map((a) => [
        `"${a.project_number}"`,
        `"${a.customer_name}"`,
        a.system_capacity_kw || 0,
        `"${a.amc_plan}"`,
        `"${formatDate(a.expiry_date)}"`,
        `"${formatDate(a.last_visit)}"`,
        `"${formatDate(a.next_due_visit)}"`,
        `"${a.status}"`,
      ]);
      exportCsv(h, d, "Solar_CRM_AMC_Warranty_Report");
    }
  };

  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label || "All Time";

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: C.bg, minHeight: "100vh", width: "100%", boxSizing: "border-box" }}>
      {/* ── HEADER BANNER ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 2.5,
          borderRadius: "16px",
          background: `linear-gradient(135deg, ${C.primaryDark} 0%, #1E293B 60%, ${C.primary} 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ position: "absolute", top: "-50px", right: "-30px", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(245, 158, 11, 0.08)" }} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, position: "relative", zIndex: 1 }}>
          <Avatar sx={{ width: 48, height: 48, borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.12)", color: C.accent }}>
            <AssessmentIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 900, color: "#FFFFFF", fontSize: { xs: "1.15rem", md: "1.35rem" }, lineHeight: 1.2 }}>
              Solar Enterprise Reports & Analytics
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.68)", fontSize: "0.82rem", mt: 0.4 }}>
              Multi-dimensional operational, financial, field execution, and warranty performance insights.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* ── TOOLBAR: PERIOD FILTER & EXPORT ACTIONS ── */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mb: 2.5,
          borderRadius: "12px",
          border: `1px solid ${C.border}`,
          backgroundColor: C.card,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1.5,
          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1, py: 0.4, borderRadius: "8px", bgcolor: "#F1F5F9" }}>
          <CalendarTodayIcon sx={{ fontSize: 16, color: C.textMuted }} />
          <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: C.textSecondary }}>Filter Period:</Typography>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              sx={{
                borderRadius: "6px",
                fontSize: "0.8rem",
                fontWeight: 700,
                bgcolor: "#FFFFFF",
                "& .MuiSelect-select": { py: 0.6, px: 1.5 },
              }}
            >
              {PERIOD_OPTIONS.map((p) => (
                <MenuItem key={p.value} value={p.value} sx={{ fontSize: "0.8rem" }}>
                  {p.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Chip
          label={`Active Range: ${periodLabel}`}
          size="small"
          sx={{ fontWeight: 700, fontSize: "0.72rem", height: 26, borderRadius: "6px", bgcolor: C.primarySoft, color: C.warning }}
        />

        <Box sx={{ flex: 1 }} />

        <Tooltip title="Refresh All Reports">
          <span>
            <IconButton
              onClick={fetchAllData}
              disabled={loading}
              sx={{
                borderRadius: "8px",
                width: 36,
                height: 36,
                border: `1px solid ${C.border}`,
                color: C.textSecondary,
                "&:hover": { bgcolor: "#F8FAFC", color: C.primary },
              }}
            >
              <RefreshIcon sx={{ fontSize: 18, animation: loading ? "spin 0.9s linear infinite" : "none", "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } } }} />
            </IconButton>
          </span>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 26, alignSelf: "center" }} />

        <Button
          variant="contained"
          size="small"
          startIcon={<DownloadIcon sx={{ fontSize: 17 }} />}
          onClick={handleExportCSV}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: "8px",
            px: 2,
            height: 36,
            fontSize: "0.78rem",
            bgcolor: C.primary,
            "&:hover": { bgcolor: C.primaryDark },
          }}
        >
          Export CSV
        </Button>
      </Paper>

      {/* ── 5 MAIN TABS NAVIGATION BAR ── */}
      <Paper
        elevation={0}
        sx={{
          mb: 2.5,
          borderRadius: "12px",
          border: `1px solid ${C.border}`,
          backgroundColor: C.card,
          overflow: "hidden",
        }}
      >
        <Tabs
          value={mainTab}
          onChange={(e, val) => setMainTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: `1px solid ${C.border}`,
            bgcolor: "#FFFFFF",
            px: 1.5,
            "& .MuiTab-root": {
              fontSize: "0.82rem",
              fontWeight: 600,
              textTransform: "none",
              minHeight: 48,
              px: 2.2,
              gap: 0.8,
              color: C.textSecondary,
            },
            "& .Mui-selected": { color: C.accent, fontWeight: 700 },
            "& .MuiTabs-indicator": { bgcolor: C.accent, height: 3, borderRadius: "3px 3px 0 0" },
          }}
        >
          <Tab icon={<LeaderboardOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Sales & Lead Reports" />
          <Tab icon={<EngineeringOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Project Execution Reports" />
          <Tab icon={<AccountBalanceWalletOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Financial Reports" />
          <Tab icon={<BuildCircleOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Field Operations Reports" />
          <Tab icon={<VerifiedOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="AMC & Warranty Reports" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, gap: 2 }}>
          <CircularProgress sx={{ color: C.accent }} size={38} thickness={4} />
          <Typography sx={{ color: C.textMuted, fontWeight: 600, fontSize: "0.85rem" }}>
            Aggregating solar reports...
          </Typography>
        </Box>
      ) : (
        <>
          {/* ═════════════════════════════════════════════════════ */}
          {/* TAB 1: SALES & LEAD REPORTS                          */}
          {/* ═════════════════════════════════════════════════════ */}
          {mainTab === 0 && (
            <Box>
              {/* Stat Cards */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2.5 }}>
                <StatCard label="Total Leads" value={orgSummary.total} caption={`${orgSummary.active} currently active`} icon={<TrendingUpIcon sx={{ fontSize: 18 }} />} color={C.primary} softColor={C.primarySoft} />
                <StatCard label="Deals Won" value={orgSummary.won} caption={`${orgSummary.lost} lost in period`} icon={<EmojiEventsOutlinedIcon sx={{ fontSize: 18 }} />} color={C.success} softColor={C.successSoft} />
                <StatCard label="Conversion Rate" value={`${orgSummary.conversionRate}%`} caption="Selected period rate" icon={<AssessmentIcon sx={{ fontSize: 18 }} />} color={C.info} softColor={C.infoSoft} />
                <StatCard label="Revenue Won" value={formatINR(orgSummary.revenue)} caption="Closed-won pipeline" icon={<AttachMoneyIcon sx={{ fontSize: 18 }} />} color={C.warning} softColor={C.warningSoft} />
              </Box>

              {filteredLeads.length === 0 ? (
                <Paper elevation={0} sx={{ p: 4, borderRadius: "12px", border: `1px solid ${C.border}`, backgroundColor: C.card }}>
                  <EmptyState icon={<InboxOutlinedIcon sx={{ fontSize: 32 }} />} title="No Leads Found" description="No leads match the selected date filter range." />
                </Paper>
              ) : (
                <>
                  {/* Charts Row */}
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "360px 1fr" }, gap: 2.5, mb: 2.5 }}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: "14px", border: `1px solid ${C.border}`, backgroundColor: C.card, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: C.textPrimary, alignSelf: "flex-start", mb: 2 }}>
                        Deal Status Distribution
                      </Typography>
                      <DonutChart segments={donutSegments} centerLabel="Leads" />
                      <Stack direction="row" spacing={2} sx={{ mt: 2.5, width: "100%", justifyContent: "center" }}>
                        {donutSegments.map((seg) => (
                          <Stack key={seg.label} alignItems="center" spacing={0.4} sx={{ flex: 1, py: 1, px: 1, borderRadius: "8px", bgcolor: `${seg.color}0A`, border: `1px solid ${seg.color}20` }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: seg.color }} />
                            <Typography sx={{ fontSize: "0.95rem", fontWeight: 900, color: C.textPrimary }}>{seg.value}</Typography>
                            <Typography sx={{ fontSize: "0.65rem", color: C.textMuted, fontWeight: 700 }}>{seg.label}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: "14px", border: `1px solid ${C.border}`, backgroundColor: C.card }}>
                      <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: C.textPrimary, mb: 2 }}>
                        Lead Source Performance
                      </Typography>
                      <Stack gap={1.6}>
                        {sourcePerformance.map((item, i) => {
                          const maxVal = Math.max(1, ...sourcePerformance.map((s) => s.total));
                          const BAR_COLORS = [C.primary, C.success, C.warning, C.purple, C.info];
                          return (
                            <Box key={item.source} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: C.textPrimary, width: 90, flexShrink: 0, textAlign: "right" }}>
                                {item.source}
                              </Typography>
                              <Box sx={{ flex: 1, height: 9, borderRadius: 5, backgroundColor: "#F1F5F9", overflow: "hidden" }}>
                                <Box sx={{ height: "100%", width: `${(item.total / maxVal) * 100}%`, borderRadius: 5, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }} />
                              </Box>
                              <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: C.textPrimary, width: 40, textAlign: "right" }}>
                                {item.total}
                              </Typography>
                              <Chip label={`${item.rate}% won`} size="small" sx={{ fontWeight: 800, fontSize: "0.62rem", height: 20, bgcolor: C.successSoft, color: C.success }} />
                            </Box>
                          );
                        })}
                      </Stack>
                    </Paper>
                  </Box>

                  {/* Tables */}
                  <Paper elevation={0} sx={{ borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden", backgroundColor: C.card }}>
                    <Tabs
                      value={activeLeadView}
                      onChange={(e, val) => setActiveLeadView(val)}
                      sx={{ borderBottom: `1px solid ${C.border}`, px: 2, bgcolor: "#FAFBFC" }}
                    >
                      <Tab icon={<SupervisorAccountOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`By Manager (${managerReports.length})`} />
                      <Tab icon={<PersonOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`By Sales Rep (${repReports.length})`} />
                    </Tabs>

                    {activeLeadView === 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: "#FAFBFC" }}>
                              <TH>Manager</TH>
                              <TH align="center">Team Size</TH>
                              <TH align="center">Total Leads</TH>
                              <TH align="center">Active</TH>
                              <TH align="center">Won</TH>
                              <TH align="center">Lost</TH>
                              <TH>Conversion</TH>
                              <TH align="right">Revenue</TH>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {managerReports.map((r) => (
                              <TableRow key={r.id} hover>
                                <TableCell>
                                  <Stack direction="row" alignItems="center" gap={1.2}>
                                    <UserAvatar user={r.user} size={32} />
                                    <Box>
                                      <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: C.textPrimary }}>{r.name}</Typography>
                                      <Typography sx={{ fontSize: "0.72rem", color: C.textMuted }}>{r.email}</Typography>
                                    </Box>
                                  </Stack>
                                </TableCell>
                                <TableCell align="center">{r.teamSize}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>{r.total}</TableCell>
                                <TableCell align="center" sx={{ color: C.info, fontWeight: 700 }}>{r.active}</TableCell>
                                <TableCell align="center" sx={{ color: C.success, fontWeight: 700 }}>{r.won}</TableCell>
                                <TableCell align="center" sx={{ color: C.danger, fontWeight: 700 }}>{r.lost}</TableCell>
                                <TableCell><ConversionCell rate={r.rate} /></TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: C.primaryDark }}>{formatINR(r.revenue)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: "#FAFBFC" }}>
                              <TH>Sales Rep</TH>
                              <TH>Reporting Manager</TH>
                              <TH align="center">Total</TH>
                              <TH align="center">Active</TH>
                              <TH align="center">Won</TH>
                              <TH align="center">Lost</TH>
                              <TH>Conversion</TH>
                              <TH align="right">Revenue</TH>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {repReports.slice(repPage * repRowsPerPage, repPage * repRowsPerPage + repRowsPerPage).map((r) => (
                              <TableRow key={r.id} hover>
                                <TableCell>
                                  <Stack direction="row" alignItems="center" gap={1.2}>
                                    <UserAvatar user={r.user} size={32} />
                                    <Box>
                                      <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: C.textPrimary }}>{r.name}</Typography>
                                      <Typography sx={{ fontSize: "0.72rem", color: C.textMuted }}>{r.email}</Typography>
                                    </Box>
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Chip label={r.managerName} size="small" sx={{ fontWeight: 600, fontSize: "0.72rem", height: 24, bgcolor: C.purpleSoft, color: C.purple }} />
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>{r.total}</TableCell>
                                <TableCell align="center" sx={{ color: C.info, fontWeight: 700 }}>{r.active}</TableCell>
                                <TableCell align="center" sx={{ color: C.success, fontWeight: 700 }}>{r.won}</TableCell>
                                <TableCell align="center" sx={{ color: C.danger, fontWeight: 700 }}>{r.lost}</TableCell>
                                <TableCell><ConversionCell rate={r.rate} /></TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: C.primaryDark }}>{formatINR(r.revenue)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <TablePagination
                          rowsPerPageOptions={[10, 25, 50]}
                          component="div"
                          count={repReports.length}
                          rowsPerPage={repRowsPerPage}
                          page={repPage}
                          onPageChange={(e, p) => setRepPage(p)}
                          onRowsPerPageChange={(e) => { setRepRowsPerPage(parseInt(e.target.value, 10)); setRepPage(0); }}
                          sx={{ borderTop: `1px solid ${C.borderLight}` }}
                        />
                      </TableContainer>
                    )}
                  </Paper>
                </>
              )}
            </Box>
          )}

          {/* ═════════════════════════════════════════════════════ */}
          {/* TAB 2: PROJECT EXECUTION REPORTS                     */}
          {/* ═════════════════════════════════════════════════════ */}
          {mainTab === 1 && (
            <Box>
              {/* Stat Cards */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2.5 }}>
                <StatCard label="Total Projects" value={projectStats.total} caption="Assigned execution pipeline" icon={<EngineeringOutlinedIcon sx={{ fontSize: 18 }} />} color={C.primary} softColor={C.primarySoft} />
                <StatCard label="In Progress" value={projectStats.inProgress} caption="Active field works" icon={<PendingOutlinedIcon sx={{ fontSize: 18 }} />} color={C.info} softColor={C.infoSoft} />
                <StatCard label="Completed" value={projectStats.completed} caption="Handed over & warranty" icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: 18 }} />} color={C.success} softColor={C.successSoft} />
                <StatCard label="Stalled (>30 Days)" value={projectStats.stalled} caption="Needs team intervention" icon={<PauseCircleFilledIcon sx={{ fontSize: 18 }} />} color={C.danger} softColor={C.dangerSoft} />
              </Box>

              {/* Stage-wise funnel bar chart */}
              <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderRadius: "14px", border: `1px solid ${C.border}`, backgroundColor: C.card }}>
                <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: C.textPrimary, mb: 2 }}>
                  Stage-wise Funnel (Inspection → Installation → Commissioning → Handover)
                </Typography>
                <Stack spacing={1.8}>
                  {funnelStages.map((f, i) => {
                    const count = funnelCounts[f.label] || 0;
                    const pct = maxFunnelVal > 0 ? (count / maxFunnelVal) * 100 : 0;
                    const FUNNEL_COLORS = ["#6366F1", "#0EA5E9", "#F59E0B", "#10B981", "#059669"];
                    const color = FUNNEL_COLORS[i % FUNNEL_COLORS.length];
                    return (
                      <Box key={f.label} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: C.textPrimary, width: 170, flexShrink: 0, textAlign: "right" }}>
                          {f.label}
                        </Typography>
                        <Box sx={{ flex: 1, height: 14, borderRadius: 4, bgcolor: "#F1F5F9", overflow: "hidden" }}>
                          <Box sx={{ height: "100%", width: `${pct}%`, borderRadius: 4, bgcolor: color, transition: "width 0.5s ease" }} />
                        </Box>
                        <Typography sx={{ width: 45, fontWeight: 800, fontSize: "0.82rem", color: C.textPrimary, textAlign: "right" }}>
                          {count}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>

              {/* Projects Table */}
              <Paper elevation={0} sx={{ borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden", backgroundColor: C.card }}>
                <Box sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${C.border}`, bgcolor: "#FAFBFC" }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: C.textPrimary }}>
                    Project Execution Directory ({filteredProjects.length})
                  </Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#FAFBFC" }}>
                        <TH>Project Code</TH>
                        <TH>Customer Name</TH>
                        <TH align="center">System Size</TH>
                        <TH>Current Stage</TH>
                        <TH>Assigned Team</TH>
                        <TH>Start Date</TH>
                        <TH align="right">Days Elapsed</TH>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredProjects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ border: 0 }}>
                            <EmptyState icon={<EngineeringOutlinedIcon sx={{ fontSize: 32 }} />} title="No Projects Found" description="No projects match the selected period filter." />
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProjects
                          .slice(projectPage * projectRowsPerPage, projectPage * projectRowsPerPage + projectRowsPerPage)
                          .map((p) => {
                            const start = p.installation_start_date ? new Date(p.installation_start_date) : new Date(p.created_at);
                            const elapsed = Math.max(0, Math.floor((new Date() - start) / (1000 * 60 * 60 * 24)));
                            return (
                              <TableRow key={p.id} hover>
                                <TableCell>
                                  <Box sx={{ px: 1, py: 0.3, borderRadius: "6px", bgcolor: "#F1F5F9", display: "inline-block", fontFamily: "monospace", fontWeight: 700, fontSize: "0.8rem", color: C.primary }}>
                                    {p.project_number}
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, color: C.textPrimary }}>{p.customer_name}</TableCell>
                                <TableCell align="center">
                                  <Chip label={`${parseFloat(p.system_capacity_kw || 0).toFixed(1)} kW`} size="small" sx={{ fontWeight: 800, fontSize: "0.72rem", height: 22, bgcolor: C.primarySoft, color: C.warning }} />
                                </TableCell>
                                <TableCell>
                                  <Chip label={p.stage || "Order Closed"} size="small" sx={{ fontWeight: 700, fontSize: "0.72rem", height: 24, bgcolor: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }} />
                                </TableCell>
                                <TableCell sx={{ color: C.textSecondary, fontWeight: 600 }}>{p.assigned_to_name || "Unassigned"}</TableCell>
                                <TableCell sx={{ fontSize: "0.78rem", color: C.textSecondary }}>{formatDate(p.installation_start_date || p.created_at)}</TableCell>
                                <TableCell align="right">
                                  <Typography sx={{ fontWeight: 800, color: elapsed > 30 ? C.danger : C.textPrimary, fontSize: "0.82rem" }}>
                                    {elapsed} Days
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            );
                          })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {filteredProjects.length > 0 && (
                  <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={filteredProjects.length}
                    rowsPerPage={projectRowsPerPage}
                    page={projectPage}
                    onPageChange={(e, p) => setProjectPage(p)}
                    onRowsPerPageChange={(e) => { setProjectRowsPerPage(parseInt(e.target.value, 10)); setProjectPage(0); }}
                    sx={{ borderTop: `1px solid ${C.borderLight}` }}
                  />
                )}
              </Paper>
            </Box>
          )}

          {/* ═════════════════════════════════════════════════════ */}
          {/* TAB 3: FINANCIAL REPORTS                             */}
          {/* ═════════════════════════════════════════════════════ */}
          {mainTab === 2 && (
            <Box>
              {/* Stat Cards */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2.5 }}>
                <StatCard label="Total Invoiced" value={formatINR(financialStats.invoiced)} caption="All raised invoices" icon={<AccountBalanceWalletOutlinedIcon sx={{ fontSize: 18 }} />} color={C.primary} softColor={C.primarySoft} />
                <StatCard label="Total Collected" value={formatINR(financialStats.collected)} caption="Confirmed cash receipts" icon={<AttachMoneyIcon sx={{ fontSize: 18 }} />} color={C.success} softColor={C.successSoft} />
                <StatCard label="Outstanding Balance" value={formatINR(financialStats.outstanding)} caption="Remaining unpaid balance" icon={<PendingOutlinedIcon sx={{ fontSize: 18 }} />} color={C.warning} softColor={C.warningSoft} />
                <StatCard label="Overdue Amount" value={formatINR(financialStats.overdue)} caption="Past payment due date" icon={<WarningAmberOutlinedIcon sx={{ fontSize: 18 }} />} color={C.danger} softColor={C.dangerSoft} />
              </Box>

              {/* Charts Row */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 340px" }, gap: 2.5, mb: 2.5 }}>
                {/* Monthly Revenue Bar Chart (Last 6 Months) */}
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: "14px", border: `1px solid ${C.border}`, backgroundColor: C.card }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: C.textPrimary, mb: 2 }}>
                    Monthly Revenue Collections (Last 6 Months)
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "flex-end", height: 180, gap: 2, pt: 2, px: 2 }}>
                    {(financialsData.monthlyRevenue || []).map((m) => {
                      const maxMonth = Math.max(1, ...(financialsData.monthlyRevenue || []).map((x) => x.amount));
                      const pct = Math.max(8, (m.amount / maxMonth) * 100);
                      return (
                        <Box key={m.month} sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                          <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: C.textSecondary, mb: 0.5 }}>
                            {formatINR(m.amount)}
                          </Typography>
                          <Box sx={{ width: "100%", maxWidth: 44, height: `${pct}%`, borderRadius: "6px 6px 0 0", bgcolor: C.accent, transition: "height 0.4s ease" }} />
                          <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: C.textMuted, mt: 1, whiteSpace: "nowrap" }}>
                            {m.month}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Paper>

                {/* Payment Status Pie Chart */}
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: "14px", border: `1px solid ${C.border}`, backgroundColor: C.card, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: C.textPrimary, alignSelf: "flex-start", mb: 2 }}>
                    Payment Status Breakdown
                  </Typography>
                  <DonutChart segments={paymentDonutSegments} centerLabel="Invoices" />
                  <Stack direction="row" spacing={1.5} sx={{ mt: 2.5, width: "100%", justifyContent: "center" }}>
                    {paymentDonutSegments.map((seg) => (
                      <Stack key={seg.label} alignItems="center" spacing={0.3} sx={{ flex: 1, py: 1, px: 0.5, borderRadius: "8px", bgcolor: `${seg.color}0A`, border: `1px solid ${seg.color}20` }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: seg.color }} />
                        <Typography sx={{ fontSize: "0.9rem", fontWeight: 900, color: C.textPrimary }}>{seg.value}</Typography>
                        <Typography sx={{ fontSize: "0.62rem", color: C.textMuted, fontWeight: 700 }}>{seg.label}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              </Box>

              {/* Table */}
              <Paper elevation={0} sx={{ borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden", backgroundColor: C.card }}>
                <Box sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${C.border}`, bgcolor: "#FAFBFC" }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: C.textPrimary }}>
                    Invoices Ledger ({filteredInvoices.length})
                  </Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#FAFBFC" }}>
                        <TH>Invoice #</TH>
                        <TH>Customer</TH>
                        <TH align="right">Amount</TH>
                        <TH align="right">Paid</TH>
                        <TH align="right">Balance</TH>
                        <TH align="center">Status</TH>
                        <TH align="right">Due Date</TH>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ border: 0 }}>
                            <EmptyState icon={<AccountBalanceWalletOutlinedIcon sx={{ fontSize: 32 }} />} title="No Invoices Found" description="No invoices exist in the selected period." />
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredInvoices
                          .slice(invoicePage * invoiceRowsPerPage, invoicePage * invoiceRowsPerPage + invoiceRowsPerPage)
                          .map((inv) => {
                            const isPaid = inv.payment_status === "Paid";
                            const isPart = inv.payment_status === "Partially Paid";
                            return (
                              <TableRow key={inv.id} hover>
                                <TableCell sx={{ fontFamily: "monospace", fontWeight: 700, color: C.primary }}>{inv.invoice_number}</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: C.textPrimary }}>{inv.customer_name}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatINR(inv.total_amount)}</TableCell>
                                <TableCell align="right" sx={{ color: C.success, fontWeight: 700 }}>{formatINR(inv.paid_amount || 0)}</TableCell>
                                <TableCell align="right" sx={{ color: Number(inv.balance_amount) > 0 ? C.danger : C.textMuted, fontWeight: 700 }}>
                                  {formatINR(inv.balance_amount || 0)}
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={inv.payment_status || "Unpaid"}
                                    size="small"
                                    sx={{
                                      fontWeight: 800,
                                      fontSize: "0.68rem",
                                      height: 22,
                                      bgcolor: isPaid ? C.successSoft : isPart ? C.warningSoft : C.dangerSoft,
                                      color: isPaid ? C.success : isPart ? C.warning : C.danger,
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="right" sx={{ fontSize: "0.78rem", color: C.textSecondary }}>{formatDate(inv.due_date)}</TableCell>
                              </TableRow>
                            );
                          })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {filteredInvoices.length > 0 && (
                  <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={filteredInvoices.length}
                    rowsPerPage={invoiceRowsPerPage}
                    page={invoicePage}
                    onPageChange={(e, p) => setInvoicePage(p)}
                    onRowsPerPageChange={(e) => { setInvoiceRowsPerPage(parseInt(e.target.value, 10)); setInvoicePage(0); }}
                    sx={{ borderTop: `1px solid ${C.borderLight}` }}
                  />
                )}
              </Paper>
            </Box>
          )}

          {/* ═════════════════════════════════════════════════════ */}
          {/* TAB 4: FIELD OPERATIONS REPORTS                      */}
          {/* ═════════════════════════════════════════════════════ */}
          {mainTab === 3 && (
            <Box>
              {/* Stat Cards */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2.5 }}>
                <StatCard label="Inspections Done" value={fieldOpsStats.inspDone} caption="Verified site readiness" icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: 18 }} />} color={C.primary} softColor={C.primarySoft} />
                <StatCard label="Installations Active" value={fieldOpsStats.installActive} caption="Underway on roof" icon={<BuildCircleOutlinedIcon sx={{ fontSize: 18 }} />} color={C.warning} softColor={C.warningSoft} />
                <StatCard label="Commissioning Pending" value={fieldOpsStats.commPending} caption="Awaiting electrical sync" icon={<PendingOutlinedIcon sx={{ fontSize: 18 }} />} color={C.danger} softColor={C.dangerSoft} />
                <StatCard label="Handovers Complete" value={fieldOpsStats.handoversDone} caption="Signed customer certificates" icon={<VerifiedOutlinedIcon sx={{ fontSize: 18 }} />} color={C.success} softColor={C.successSoft} />
              </Box>

              {/* Phase-wise Installation Progress Bar Chart */}
              <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderRadius: "14px", border: `1px solid ${C.border}`, backgroundColor: C.card }}>
                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: C.textPrimary, mb: 2 }}>
                  Phase-wise Installation Progress Distribution
                </Typography>
                <Stack spacing={1.6}>
                  {Object.entries(fieldOpsStats.phaseMap).map(([phase, count], i) => {
                    const pct = maxPhaseVal > 0 ? (count / maxPhaseVal) * 100 : 0;
                    const PHASE_COLORS = ["#3B82F6", "#8B5CF6", "#F59E0B", "#10B981", "#059669"];
                    return (
                      <Box key={phase} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: C.textPrimary, width: 170, flexShrink: 0, textAlign: "right" }}>
                          {phase}
                        </Typography>
                        <Box sx={{ flex: 1, height: 12, borderRadius: 4, bgcolor: "#F1F5F9", overflow: "hidden" }}>
                          <Box sx={{ height: "100%", width: `${pct}%`, borderRadius: 4, bgcolor: PHASE_COLORS[i % PHASE_COLORS.length] }} />
                        </Box>
                        <Typography sx={{ width: 40, fontWeight: 800, fontSize: "0.8rem", color: C.textPrimary, textAlign: "right" }}>
                          {count}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>

              {/* Table */}
              <Paper elevation={0} sx={{ borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden", backgroundColor: C.card }}>
                <Box sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${C.border}`, bgcolor: "#FAFBFC" }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: C.textPrimary }}>
                    Field Execution Operations Tracking ({filteredOperations.length})
                  </Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#FAFBFC" }}>
                        <TH>Project</TH>
                        <TH>Customer</TH>
                        <TH>Inspection</TH>
                        <TH>Installation %</TH>
                        <TH>Phase</TH>
                        <TH>Commissioning</TH>
                        <TH>Final Inspection</TH>
                        <TH>Handover</TH>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredOperations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} sx={{ border: 0 }}>
                            <EmptyState icon={<BuildCircleOutlinedIcon sx={{ fontSize: 32 }} />} title="No Operations Found" description="No field operations logged for this period." />
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOperations
                          .slice(opsPage * opsRowsPerPage, opsPage * opsRowsPerPage + opsRowsPerPage)
                          .map((op) => (
                            <TableRow key={op.id} hover>
                              <TableCell sx={{ fontFamily: "monospace", fontWeight: 700, color: C.primary }}>{op.project_number}</TableCell>
                              <TableCell sx={{ fontWeight: 700, color: C.textPrimary }}>{op.customer_name}</TableCell>
                              <TableCell>
                                <Chip
                                  label={op.inspection_status}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: "0.7rem",
                                    height: 22,
                                    bgcolor: op.inspection_status === "Completed" ? C.successSoft : "#EFF6FF",
                                    color: op.inspection_status === "Completed" ? C.success : "#1D4ED8",
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 100 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={op.installation_percent}
                                    sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: "#F1F5F9", "& .MuiLinearProgress-bar": { bgcolor: C.accent } }}
                                  />
                                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: C.textPrimary }}>
                                    {op.installation_percent}%
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.76rem", color: C.textSecondary, fontWeight: 600 }}>{op.current_phase}</TableCell>
                              <TableCell>
                                <Chip
                                  label={op.commissioning_result}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: "0.7rem",
                                    height: 22,
                                    bgcolor: op.commissioning_result === "Pass" ? C.successSoft : C.warningSoft,
                                    color: op.commissioning_result === "Pass" ? C.success : C.warning,
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.76rem", color: C.textSecondary }}>{op.final_inspection}</TableCell>
                              <TableCell>
                                <Chip
                                  label={op.handover_status}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: "0.7rem",
                                    height: 22,
                                    bgcolor: op.handover_status === "Signed" ? C.successSoft : "#F1F5F9",
                                    color: op.handover_status === "Signed" ? C.success : C.textSecondary,
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {filteredOperations.length > 0 && (
                  <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={filteredOperations.length}
                    rowsPerPage={opsRowsPerPage}
                    page={opsPage}
                    onPageChange={(e, p) => setOpsPage(p)}
                    onRowsPerPageChange={(e) => { setOpsPageRowsPerPage(parseInt(e.target.value, 10)); setOpsPage(0); }}
                    sx={{ borderTop: `1px solid ${C.borderLight}` }}
                  />
                )}
              </Paper>
            </Box>
          )}

          {/* ═════════════════════════════════════════════════════ */}
          {/* TAB 5: AMC & WARRANTY REPORTS                        */}
          {/* ═════════════════════════════════════════════════════ */}
          {mainTab === 4 && (
            <Box>
              {/* Stat Cards */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2.5 }}>
                <StatCard label="Active AMC Contracts" value={amcStats.active} caption="Currently covered customers" icon={<VerifiedOutlinedIcon sx={{ fontSize: 18 }} />} color={C.primary} softColor={C.primarySoft} />
                <StatCard label="Expiring This Month" value={amcStats.expiring} caption="Renewal follow-up queue" icon={<WarningAmberOutlinedIcon sx={{ fontSize: 18 }} />} color={C.danger} softColor={C.dangerSoft} />
                <StatCard label="Service Visits Done" value={amcStats.serviceVisits} caption="Completed this month" icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: 18 }} />} color={C.success} softColor={C.successSoft} />
                <StatCard label="Pending Visits" value={amcStats.pendingVisits} caption="Awaiting technician visit" icon={<PendingOutlinedIcon sx={{ fontSize: 18 }} />} color={C.warning} softColor={C.warningSoft} />
              </Box>

              {/* Charts Row */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "360px 1fr" }, gap: 2.5, mb: 2.5 }}>
                {/* AMC Plan Distribution */}
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: "14px", border: `1px solid ${C.border}`, backgroundColor: C.card, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: C.textPrimary, alignSelf: "flex-start", mb: 2 }}>
                    AMC Plan Distribution
                  </Typography>
                  <DonutChart segments={amcDonutSegments} centerLabel="Contracts" />
                  <Stack direction="row" spacing={1.5} sx={{ mt: 2.5, width: "100%", justifyContent: "center" }}>
                    {amcDonutSegments.map((seg) => (
                      <Stack key={seg.label} alignItems="center" spacing={0.3} sx={{ flex: 1, py: 1, px: 0.5, borderRadius: "8px", bgcolor: `${seg.color}0A`, border: `1px solid ${seg.color}20` }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: seg.color }} />
                        <Typography sx={{ fontSize: "0.9rem", fontWeight: 900, color: C.textPrimary }}>{seg.value}</Typography>
                        <Typography sx={{ fontSize: "0.62rem", color: C.textMuted, fontWeight: 700 }}>{seg.label}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Paper>

                {/* Quick AMC Health Card */}
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: "14px", border: `1px solid ${C.border}`, backgroundColor: C.card }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: C.textPrimary, mb: 1.5 }}>
                    Warranty & AMC Policy Overview
                  </Typography>
                  <Typography sx={{ fontSize: "0.78rem", color: C.textSecondary, lineHeight: 1.6, mb: 2 }}>
                    Solar systems under AMC retain guaranteed generation efficiency and priority service tickets. Active monitoring includes bi-annual electrical inspection and inverter calibration.
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={1.2}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                      <Typography sx={{ color: C.textSecondary }}>Standard Panel Warranty:</Typography>
                      <Typography sx={{ fontWeight: 700, color: C.textPrimary }}>25 Years Performance</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                      <Typography sx={{ color: C.textSecondary }}>Standard Inverter Warranty:</Typography>
                      <Typography sx={{ fontWeight: 700, color: C.textPrimary }}>5 Years Replacement</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                      <Typography sx={{ color: C.textSecondary }}>Workmanship Warranty:</Typography>
                      <Typography sx={{ fontWeight: 700, color: C.textPrimary }}>2 Years Workmanship</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Box>

              {/* Table */}
              <Paper elevation={0} sx={{ borderRadius: "14px", border: `1px solid ${C.border}`, overflow: "hidden", backgroundColor: C.card }}>
                <Box sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${C.border}`, bgcolor: "#FAFBFC" }}>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: C.textPrimary }}>
                    Customer AMC & Service Registry ({filteredAmcList.length})
                  </Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#FAFBFC" }}>
                        <TH>Customer Name</TH>
                        <TH align="center">System Size</TH>
                        <TH>AMC Plan</TH>
                        <TH>Expiry Date</TH>
                        <TH>Last Visit</TH>
                        <TH>Next Due Visit</TH>
                        <TH align="center">Status</TH>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAmcList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ border: 0 }}>
                            <EmptyState icon={<VerifiedOutlinedIcon sx={{ fontSize: 32 }} />} title="No AMC Records" description="No AMC contracts registered for the selected period." />
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAmcList
                          .slice(amcPage * amcRowsPerPage, amcPage * amcRowsPerPage + amcRowsPerPage)
                          .map((a) => (
                            <TableRow key={a.id} hover>
                              <TableCell sx={{ fontWeight: 700, color: C.textPrimary }}>{a.customer_name}</TableCell>
                              <TableCell align="center">
                                <Chip label={`${parseFloat(a.system_capacity_kw || 0).toFixed(1)} kW`} size="small" sx={{ fontWeight: 800, fontSize: "0.72rem", height: 22, bgcolor: C.primarySoft, color: C.warning }} />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={a.amc_plan}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: "0.7rem",
                                    height: 22,
                                    bgcolor: a.amc_plan === "Premium" ? C.purpleSoft : a.amc_plan === "Standard" ? C.primarySoft : C.infoSoft,
                                    color: a.amc_plan === "Premium" ? C.purple : a.amc_plan === "Standard" ? C.warning : C.info,
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontSize: "0.78rem", color: C.textSecondary }}>{formatDate(a.expiry_date)}</TableCell>
                              <TableCell sx={{ fontSize: "0.78rem", color: C.textSecondary }}>{formatDate(a.last_visit)}</TableCell>
                              <TableCell sx={{ fontSize: "0.78rem", color: C.textSecondary }}>{formatDate(a.next_due_visit)}</TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={a.status}
                                  size="small"
                                  sx={{
                                    fontWeight: 800,
                                    fontSize: "0.68rem",
                                    height: 22,
                                    bgcolor: a.status === "Active" ? C.successSoft : a.status === "Expired" ? C.dangerSoft : "#F1F5F9",
                                    color: a.status === "Active" ? C.success : a.status === "Expired" ? C.danger : C.textMuted,
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {filteredAmcList.length > 0 && (
                  <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={filteredAmcList.length}
                    rowsPerPage={amcRowsPerPage}
                    page={amcPage}
                    onPageChange={(e, p) => setAmcPage(p)}
                    onRowsPerPageChange={(e) => { setAmcRowsPerPage(parseInt(e.target.value, 10)); setAmcPage(0); }}
                    sx={{ borderTop: `1px solid ${C.borderLight}` }}
                  />
                )}
              </Paper>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default Reports;