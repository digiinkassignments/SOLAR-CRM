import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  IconButton,
  Tooltip,
  Stack,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  Breadcrumbs,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
} from "@mui/material";

// Icons (100% Professional MUI Icons — Zero Emojis)
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import SolarPowerOutlinedIcon from "@mui/icons-material/SolarPowerOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CheckIcon from "@mui/icons-material/Check";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

import toast from "react-hot-toast";
import { getSubsidiesList } from "../../../services/subsidyService";
import SubsidyTrackerDrawer from "../../../components/SubsidyTrackerDrawer";

// Theme constants
const COLORS = {
  primary: "#0F172A",
  secondary: "#F59E0B",
  background: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  primaryDark: "#0F172A",
};

// 9 Real Portal Stages Configuration
const PORTAL_STAGE_CONFIG = {
  registered: {
    label: "1. Registered",
    owner: "Your Team",
    ownerType: "team",
    expectedDays: 2,
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  feasibility_approved: {
    label: "2. Feasibility Approved",
    owner: "DISCOM",
    ownerType: "discom",
    expectedDays: 7,
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
  },
  vendor_selected: {
    label: "3. Vendor Selected",
    owner: "Customer",
    ownerType: "customer",
    expectedDays: 3,
    color: "#D97706",
    bg: "#FEF3C7",
    border: "#FDE68A",
  },
  agreement_uploaded: {
    label: "4. Agreement Uploaded",
    owner: "Your Team",
    ownerType: "team",
    expectedDays: 2,
    color: "#0284C7",
    bg: "#F0F9FF",
    border: "#BAE6FD",
  },
  installed_docs_uploaded: {
    label: "5. Installed & Uploaded",
    owner: "Your Team",
    ownerType: "team",
    expectedDays: 10,
    color: "#0D9488",
    bg: "#CCFBF1",
    border: "#99F6E4",
  },
  net_meter_applied: {
    label: "6. Net Meter Applied",
    owner: "DISCOM",
    ownerType: "discom",
    expectedDays: 15,
    color: "#EA580C",
    bg: "#FFF7ED",
    border: "#FFEDD5",
  },
  commissioning_issued: {
    label: "7. Commissioning Issued",
    owner: "DISCOM",
    ownerType: "discom",
    expectedDays: 7,
    color: "#16A34A",
    bg: "#F0FDF4",
    border: "#BBF7D0",
  },
  bank_details_submitted: {
    label: "8. Bank Details Submitted",
    owner: "Your Team",
    ownerType: "team",
    expectedDays: 2,
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
  subsidy_credited: {
    label: "9. Subsidy Credited",
    owner: "Government",
    ownerType: "govt",
    expectedDays: 30,
    color: "#047857",
    bg: "#D1FAE5",
    border: "#6EE7B7",
  },
  disbursed: {
    label: "9. Subsidy Credited",
    owner: "Government",
    ownerType: "govt",
    expectedDays: 30,
    color: "#047857",
    bg: "#D1FAE5",
    border: "#6EE7B7",
  },
  rejected: {
    label: "Rejected by Portal",
    owner: "Your Team",
    ownerType: "team",
    expectedDays: 5,
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FCA5A5",
  },
};

export default function SubsidyTracker() {
  const navigate = useNavigate();

  // State
  const [subsidies, setSubsidies] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("table");

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // Subsidy Tracker Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeLead, setActiveLead] = useState(null);

  // Copy state
  const [copiedKey, setCopiedKey] = useState(null);

  // Backend Aggregate Stats
  const [stats, setStats] = useState({
    totalProjects: 0,
    registered: 0,
    feasibility: 0,
    installation: 0,
    netMeter: 0,
    credited: 0,
    rejected: 0,
    totalExpected: 0,
    totalDisbursed: 0,
  });

  // Fetch Subsidies from backend
  const fetchSubsidies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSubsidiesList({
        page: page + 1,
        limit: rowsPerPage,
        search: search.trim(),
        status: selectedStatus,
      });

      if (res?.success && res.data) {
        const list = res.data.subsidies || [];
        setSubsidies(list);
        setTotalCount(res.data.total || list.length);

        const bStats = res.data.stats || {};
        setStats({
          totalProjects: Number(bStats.total_projects || list.length),
          registered: Number(bStats.count_registered || 0),
          feasibility: Number(bStats.count_feasibility || 0),
          installation: Number(bStats.count_in_installation || 0),
          netMeter: Number(bStats.count_net_meter || 0),
          credited: Number(bStats.count_credited || 0),
          rejected: Number(bStats.count_rejected || 0),
          totalExpected: Number(bStats.total_expected_subsidy || 0),
          totalDisbursed: Number(bStats.total_disbursed_subsidy || 0),
        });
      } else {
        setSubsidies([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("fetchSubsidies error:", err);
      toast.error("Failed to load subsidy projects.");
      setSubsidies([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, selectedStatus]);

  useEffect(() => {
    fetchSubsidies();
  }, [fetchSubsidies]);

  // Handle Search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  };

  const handleClearFilters = () => {
    setSearch("");
    setSearchInput("");
    setSelectedStatus("All");
    setPage(0);
  };

  // 1-Click Copy Data Pack from Table row
  const handleCopyRowDataPack = (row) => {
    const text = `=== PM SURYA GHAR PORTAL DATA PACK ===
Applicant: ${row.customer_name}
Electricity Bill CA No.: ${row.consumer_number || "N/A"}
PM Surya Ghar App No.: ${row.application_number || "Pending"}
Installation Address: ${[row.address, row.city, row.state, row.pincode].filter(Boolean).join(", ")}
Capacity: ${row.system_capacity_kw || "3.50"} kW
DISCOM: ${row.discom_name || "JVVNL"} (${row.discom_division || row.city || "Circle Office"})
DCR Compliant: ${row.is_dcr_compliant ? "YES (ALMM Verified)" : "NO"}
Expected Subsidy: ₹${row.expected_subsidy || "78,000"}
Current Portal Stage: ${row.portal_status}
======================================`;

    navigator.clipboard.writeText(text);
    setCopiedKey(row.lead_id);
    toast.success(`Copied Portal Data Pack for ${row.customer_name}!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenDrawer = (lead) => {
    setActiveLead(lead);
    setDrawerOpen(true);
  };

  return (
    <Box
      sx={{
        backgroundColor: COLORS.background,
        minHeight: "100vh",
        p: { xs: 2, sm: 3 },
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1440, mx: "auto" }}>
        {/* 1. BREADCRUMBS */}
        <Breadcrumbs
          separator={
            <NavigateNextRoundedIcon sx={{ fontSize: "0.85rem", color: COLORS.textMuted }} />
          }
          sx={{ mb: 1.5 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            gap={0.5}
            sx={{ cursor: "pointer" }}
            onClick={() => navigate("/dashboard")}
          >
            <HomeOutlinedIcon sx={{ fontSize: "0.9rem", color: COLORS.textMuted }} />
            <Typography
              sx={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: COLORS.textMuted,
                "&:hover": { color: COLORS.primary },
              }}
            >
              Dashboard
            </Typography>
          </Stack>
          <Typography
            sx={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: COLORS.primaryDark,
            }}
          >
            Subsidy Tracking
          </Typography>
        </Breadcrumbs>

        {/* 2. HERO HEADER PAPER */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 2.5,
            borderRadius: "14px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: COLORS.textPrimary,
                fontSize: "1.25rem",
              }}
            >
              PM Surya Ghar National Portal Subsidy Tracker
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: COLORS.textSecondary,
                fontSize: "0.8rem",
                mt: 0.3,
              }}
            >
              Track all 9 national portal milestones, stage owners, DISCOM SLA timers, DCR compliance, and DBT subsidy disbursements.
            </Typography>
          </Box>

          <Stack direction="row" alignItems="center" gap={1.2} flexWrap="wrap">
            {/* View Toggle */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newView) => newView && setViewMode(newView)}
              size="small"
              sx={{
                height: 36,
                backgroundColor: "#F1F5F9",
                borderRadius: "8px",
                p: 0.3,
                "& .MuiToggleButton-root": {
                  border: 0,
                  borderRadius: "6px",
                  px: 1.5,
                  py: 0.4,
                  color: COLORS.textSecondary,
                  "&.Mui-selected": {
                    backgroundColor: COLORS.card,
                    color: COLORS.primary,
                    fontWeight: 700,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  },
                },
              }}
            >
              <ToggleButton value="table">
                <Stack direction="row" alignItems="center" gap={0.6}>
                  <TableChartOutlinedIcon sx={{ fontSize: 17 }} />
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700 }}>
                    Table
                  </Typography>
                </Stack>
              </ToggleButton>
              <ToggleButton value="box">
                <Stack direction="row" alignItems="center" gap={0.6}>
                  <ViewListOutlinedIcon sx={{ fontSize: 17 }} />
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700 }}>
                    Cards
                  </Typography>
                </Stack>
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Refresh Button */}
            <Tooltip title="Refresh Applications">
              <IconButton
                onClick={fetchSubsidies}
                disabled={loading}
                size="small"
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "8px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.card,
                  color: COLORS.textPrimary,
                  "&:hover": { backgroundColor: "#F8FAFC" },
                }}
              >
                <RefreshIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Paper>

        {/* 3. METRIC STATS ROW */}
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          {/* Total Pipeline */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.card,
              }}
            >
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase" }}>
                Total Projects
              </Typography>
              <Typography sx={{ fontSize: "1.5rem", fontWeight: 900, color: COLORS.primaryDark, mt: 0.3 }}>
                {stats.totalProjects}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                In Subsidy Workflow
              </Typography>
            </Paper>
          </Grid>

          {/* DISCOM Feasibility */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: "1px solid #DDD6FE",
                backgroundColor: "#F5F3FF",
              }}
            >
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#6D28D9", textTransform: "uppercase" }}>
                DISCOM Feasibility
              </Typography>
              <Typography sx={{ fontSize: "1.5rem", fontWeight: 900, color: "#5B21B6", mt: 0.3 }}>
                {stats.feasibility}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: "#7C3AED", fontWeight: 600 }}>
                Owner: DISCOM JE Desk
              </Typography>
            </Paper>
          </Grid>

          {/* Net Meter & Metering */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: "1px solid #FFEDD5",
                backgroundColor: "#FFF7ED",
              }}
            >
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#C2410C", textTransform: "uppercase" }}>
                Net Metering
              </Typography>
              <Typography sx={{ fontSize: "1.5rem", fontWeight: 900, color: "#9A3412", mt: 0.3 }}>
                {stats.netMeter}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: "#EA580C", fontWeight: 600 }}>
                Owner: DISCOM M&P
              </Typography>
            </Paper>
          </Grid>

          {/* Subsidy Credited */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: "1px solid #BBF7D0",
                backgroundColor: "#F0FDF4",
              }}
            >
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#15803D", textTransform: "uppercase" }}>
                DBT Credited
              </Typography>
              <Typography sx={{ fontSize: "1.5rem", fontWeight: 900, color: "#166534", mt: 0.3 }}>
                {stats.credited}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: "#15803D", fontWeight: 600 }}>
                ₹{Number(stats.totalDisbursed).toLocaleString("en-IN")} Disbursed
              </Typography>
            </Paper>
          </Grid>

          {/* Rejections & Overdue */}
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: stats.rejected > 0 ? "1px solid #FECDD3" : `1px solid ${COLORS.border}`,
                backgroundColor: stats.rejected > 0 ? "#FFF1F2" : COLORS.card,
              }}
            >
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: stats.rejected > 0 ? "#BE123C" : COLORS.textSecondary, textTransform: "uppercase" }}>
                Rejections / Fix Tasks
              </Typography>
              <Typography sx={{ fontSize: "1.5rem", fontWeight: 900, color: stats.rejected > 0 ? "#9F1239" : COLORS.primaryDark, mt: 0.3 }}>
                {stats.rejected}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: stats.rejected > 0 ? "#E11D48" : COLORS.textMuted, fontWeight: 600 }}>
                Actionable Re-submissions
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* 4. FILTER BAR */}
        <Paper
          elevation={0}
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          {/* Search Box */}
          <TextField
            size="small"
            placeholder="Search customer name, mobile, CA No, App No..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: COLORS.textMuted }} />
                </InputAdornment>
              ),
            }}
            sx={{
              flexGrow: 1,
              minWidth: { xs: "100%", sm: 280 },
              "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.82rem" },
            }}
          />

          {/* Status Dropdown */}
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <Select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(0);
              }}
              sx={{ borderRadius: "8px", fontSize: "0.82rem", fontWeight: 600 }}
            >
              <MenuItem value="All">All 9 Stages</MenuItem>
              <MenuItem value="registered">1. Registered</MenuItem>
              <MenuItem value="feasibility_approved">2. Feasibility Approved</MenuItem>
              <MenuItem value="vendor_selected">3. Vendor Selected</MenuItem>
              <MenuItem value="agreement_uploaded">4. Agreement Uploaded</MenuItem>
              <MenuItem value="installed_docs_uploaded">5. Installed & Uploaded</MenuItem>
              <MenuItem value="net_meter_applied">6. Net Meter Applied</MenuItem>
              <MenuItem value="commissioning_issued">7. Commissioning Issued</MenuItem>
              <MenuItem value="bank_details_submitted">8. Bank Details Submitted</MenuItem>
              <MenuItem value="subsidy_credited">9. Subsidy Credited</MenuItem>
              <MenuItem value="rejected">Rejected by Portal</MenuItem>
            </Select>
          </FormControl>

          {/* Search Action */}
          <Button
            type="submit"
            variant="contained"
            size="small"
            startIcon={<SearchIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: "8px",
              px: 2,
              height: 40,
              backgroundColor: COLORS.primary,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.8rem",
            }}
          >
            Filter
          </Button>

          {(search || selectedStatus !== "All") && (
            <Button
              variant="text"
              size="small"
              startIcon={<FilterListOffIcon sx={{ fontSize: 16 }} />}
              onClick={handleClearFilters}
              sx={{
                color: COLORS.textSecondary,
                textTransform: "none",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              Reset
            </Button>
          )}
        </Paper>

        {/* 5. TABLE VIEW */}
        {viewMode === "table" ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: "14px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.card,
              overflow: "hidden",
            }}
          >
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.72rem", color: COLORS.textMuted, py: 1.5 }}>
                      CUSTOMER & SYSTEM
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.72rem", color: COLORS.textMuted, py: 1.5 }}>
                      CONSUMER & APP NO.
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.72rem", color: COLORS.textMuted, py: 1.5 }}>
                      DISCOM & CIRCLE
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.72rem", color: COLORS.textMuted, py: 1.5 }}>
                      STAGE & OWNER
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.72rem", color: COLORS.textMuted, py: 1.5 }}>
                      TIMER & SLA
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.72rem", color: COLORS.textMuted, py: 1.5 }}>
                      DCR COMPLIANCE
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.72rem", color: COLORS.textMuted, py: 1.5 }}>
                      SUBSIDY LEDGER
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.72rem", color: COLORS.textMuted, py: 1.5 }}>
                      ACTIONS
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((__, j) => (
                          <TableCell key={j}>
                            <Skeleton height={26} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : subsidies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <Typography sx={{ fontWeight: 700, color: COLORS.textSecondary, fontSize: "0.9rem" }}>
                          No subsidy projects found matching criteria.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    subsidies.map((row) => {
                      const cfg = PORTAL_STAGE_CONFIG[row.portal_status] || PORTAL_STAGE_CONFIG.registered;
                      const daysInStage = Number(row.days_in_stage || 1);
                      const isDelayed = daysInStage > (row.sla_expected_days || cfg.expectedDays);
                      const isRejected = row.portal_status === "rejected";

                      return (
                        <TableRow
                          key={row.lead_id}
                          hover
                          sx={{
                            "&:hover": { backgroundColor: "#F8FAFC" },
                            cursor: "pointer",
                          }}
                        >
                          {/* Customer & System */}
                          <TableCell onClick={() => navigate(`/subsidies/${row.lead_id}`)}>
                            <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: COLORS.primaryDark }}>
                              {row.customer_name}
                            </Typography>
                            <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 0.3 }}>
                              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, fontFamily: "monospace" }}>
                                {row.mobile_number}
                              </Typography>
                              <Chip
                                label={`${row.system_capacity_kw || "3.5"} kW`}
                                size="small"
                                sx={{ height: 18, fontSize: "0.62rem", fontWeight: 700, bgcolor: "#FEF3C7", color: "#B45309" }}
                              />
                            </Stack>
                          </TableCell>

                          {/* Consumer & App No */}
                          <TableCell>
                            <Stack direction="row" alignItems="center" gap={0.6}>
                              <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, fontFamily: "monospace", color: COLORS.primaryDark }}>
                                {row.consumer_number || "Not Registered"}
                              </Typography>
                              {row.consumer_number && (
                                <Tooltip title="Copy Consumer No">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(row.consumer_number);
                                      toast.success("Copied Consumer No!");
                                    }}
                                    sx={{ p: 0.3 }}
                                  >
                                    <ContentCopyIcon sx={{ fontSize: 13, color: COLORS.textMuted }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                            <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, fontFamily: "monospace" }}>
                              {row.application_number || "App No. Pending"}
                            </Typography>
                          </TableCell>

                          {/* DISCOM & Circle */}
                          <TableCell onClick={() => navigate(`/subsidies/${row.lead_id}`)}>
                            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: COLORS.primaryDark }}>
                              {row.discom_name || "JVVNL"}
                            </Typography>
                            <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>
                              {row.discom_division || row.city || "Circle Office"}
                            </Typography>
                          </TableCell>

                          {/* Stage & Owner */}
                          <TableCell onClick={() => navigate(`/subsidies/${row.lead_id}`)}>
                            <Chip
                              label={cfg.label}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.7rem",
                                bgcolor: cfg.bg,
                                color: cfg.color,
                                border: `1px solid ${cfg.border}`,
                                height: 22,
                              }}
                            />
                            <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: COLORS.textMuted, mt: 0.4 }}>
                              Owner: {cfg.owner}
                            </Typography>
                          </TableCell>

                          {/* Timer & SLA */}
                          <TableCell onClick={() => navigate(`/subsidies/${row.lead_id}`)}>
                            <Stack direction="row" alignItems="center" gap={0.5}>
                              <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: isDelayed ? COLORS.danger : COLORS.primaryDark }}>
                                {daysInStage}d elapsed
                              </Typography>
                              <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted }}>
                                / SLA {cfg.expectedDays}d
                              </Typography>
                            </Stack>

                            {isDelayed && (
                              <Chip
                                label={`+${daysInStage - cfg.expectedDays}d Overdue`}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: "0.62rem",
                                  fontWeight: 800,
                                  bgcolor: "#FEE2E2",
                                  color: "#DC2626",
                                  mt: 0.3,
                                }}
                              />
                            )}
                          </TableCell>

                          {/* DCR Compliance */}
                          <TableCell onClick={() => navigate(`/subsidies/${row.lead_id}`)}>
                            {row.is_dcr_compliant ? (
                              <Chip
                                icon={<AssignmentTurnedInIcon sx={{ fontSize: "13px !important", color: "#16A34A !important" }} />}
                                label="DCR Compliant"
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: "0.68rem",
                                  fontWeight: 800,
                                  bgcolor: "#DCFCE7",
                                  color: "#166534",
                                }}
                              />
                            ) : (
                              <Chip
                                icon={<ErrorOutlineOutlinedIcon sx={{ fontSize: "13px !important", color: "#DC2626 !important" }} />}
                                label="Non-DCR Risk"
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: "0.68rem",
                                  fontWeight: 800,
                                  bgcolor: "#FEE2E2",
                                  color: "#991B1B",
                                }}
                              />
                            )}
                          </TableCell>

                          {/* Subsidy Ledger */}
                          <TableCell onClick={() => navigate(`/subsidies/${row.lead_id}`)}>
                            <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: COLORS.primaryDark }}>
                              ₹{Number(row.expected_subsidy || 78000).toLocaleString("en-IN")}
                            </Typography>
                            <Typography sx={{ fontSize: "0.68rem", color: Number(row.amount_received) > 0 ? "#16A34A" : COLORS.textMuted, fontWeight: 700 }}>
                              {Number(row.amount_received) > 0 ? `Credited: ₹${Number(row.amount_received).toLocaleString("en-IN")}` : "DBT Pending"}
                            </Typography>
                          </TableCell>

                          {/* Actions */}
                          <TableCell align="right">
                            <Stack direction="row" alignItems="center" justifyContent="flex-end" gap={0.8}>
                              <Tooltip title="Copy National Portal Data Pack">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyRowDataPack(row);
                                  }}
                                  sx={{
                                    border: `1px solid ${COLORS.border}`,
                                    borderRadius: "6px",
                                    p: 0.6,
                                    bgcolor: copiedKey === row.lead_id ? "#DCFCE7" : "#FFFFFF",
                                  }}
                                >
                                  {copiedKey === row.lead_id ? (
                                    <CheckIcon sx={{ fontSize: 15, color: "#16A34A" }} />
                                  ) : (
                                    <ContentCopyIcon sx={{ fontSize: 15, color: COLORS.textSecondary }} />
                                  )}
                                </IconButton>
                              </Tooltip>

                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => navigate(`/subsidies/${row.lead_id}`)}
                                sx={{
                                  borderRadius: "6px",
                                  textTransform: "none",
                                  fontSize: "0.74rem",
                                  fontWeight: 700,
                                  py: 0.4,
                                  px: 1.2,
                                  bgcolor: COLORS.primary,
                                  "&:hover": { bgcolor: "#020617" },
                                }}
                              >
                                View File
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              rowsPerPageOptions={[10, 15, 25, 50]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newP) => setPage(newP)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              sx={{ borderTop: `1px solid ${COLORS.border}` }}
            />
          </Paper>
        ) : (
          /* CARD GRID VIEW */
          <Grid container spacing={2}>
            {subsidies.map((row) => {
              const cfg = PORTAL_STAGE_CONFIG[row.portal_status] || PORTAL_STAGE_CONFIG.registered;
              const daysInStage = Number(row.days_in_stage || 1);
              const isDelayed = daysInStage > (row.sla_expected_days || cfg.expectedDays);

              return (
                <Grid item xs={12} sm={6} md={4} key={row.lead_id}>
                  <Paper
                    elevation={0}
                    onClick={() => navigate(`/subsidies/${row.lead_id}`)}
                    sx={{
                      p: 2.2,
                      borderRadius: "14px",
                      border: `1px solid ${COLORS.border}`,
                      backgroundColor: COLORS.card,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: "100%",
                      boxSizing: "border-box",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                        borderColor: COLORS.primary,
                      },
                    }}
                  >
                    <Box>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Chip
                          label={cfg.label}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.68rem",
                            bgcolor: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${cfg.border}`,
                            height: 22,
                          }}
                        />

                        {isDelayed && (
                          <Chip
                            label={`+${daysInStage - cfg.expectedDays}d SLA Overdue`}
                            size="small"
                            sx={{ height: 20, fontSize: "0.62rem", fontWeight: 800, bgcolor: "#FEE2E2", color: "#DC2626" }}
                          />
                        )}
                      </Stack>

                      <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: COLORS.primaryDark, mt: 1.5 }}>
                        {row.customer_name}
                      </Typography>

                      <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, fontFamily: "monospace", mt: 0.3 }}>
                        CA No: {row.consumer_number || "Not Registered"} · App: {row.application_number || "Pending"}
                      </Typography>

                      <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 1.5 }} flexWrap="wrap">
                        <Chip
                          label={`${row.system_capacity_kw || "3.5"} kW`}
                          size="small"
                          sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, bgcolor: "#FEF3C7", color: "#B45309" }}
                        />
                        <Chip
                          label={row.discom_name || "JVVNL"}
                          size="small"
                          sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, bgcolor: "#F1F5F9", color: COLORS.primaryDark }}
                        />
                        <Chip
                          label={row.is_dcr_compliant ? "DCR Verified" : "Non-DCR"}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            bgcolor: row.is_dcr_compliant ? "#DCFCE7" : "#FEE2E2",
                            color: row.is_dcr_compliant ? "#15803D" : "#B91C1C",
                          }}
                        />
                      </Stack>

                      <Box sx={{ mt: 1.5, p: 1.2, borderRadius: "8px", bgcolor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
                        <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                          Stage Responsibility
                        </Typography>
                        <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: COLORS.primaryDark, mt: 0.2 }}>
                          {cfg.owner} · {daysInStage} days in stage
                        </Typography>
                      </Box>
                    </Box>

                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${COLORS.border}` }}>
                      <Box>
                        <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted }}>Expected DBT</Typography>
                        <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: COLORS.primaryDark }}>
                          ₹{Number(row.expected_subsidy || 78000).toLocaleString("en-IN")}
                        </Typography>
                      </Box>

                      <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyRowDataPack(row);
                        }}
                        startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
                        sx={{ textTransform: "none", fontSize: "0.72rem", fontWeight: 700, borderRadius: "6px" }}
                      >
                        Copy Data Pack
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* QUICK DRAWER */}
      <SubsidyTrackerDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        lead={activeLead}
        onUpdate={fetchSubsidies}
      />
    </Box>
  );
}
