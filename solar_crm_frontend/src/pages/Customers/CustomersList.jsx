import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
  Card,
  Divider,
} from "@mui/material";

// Icons
import SearchIcon from "@mui/icons-material/Search";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import SolarPowerOutlinedIcon from "@mui/icons-material/SolarPowerOutlined";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";

import { useAuth } from "../../context/AuthContext";
import { getCustomers } from "../../services/customerService";
import AddCustomerModal from "./AddCustomerModal";

const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  border: "#E2E8F0",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  bgSubtle: "#F8FAFC",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  info: "#0284C7",
  infoSoft: "#E0F2FE",
};

export default function CustomersList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roleName = (user?.role_name || user?.role || "").toLowerCase();
  const isManager = user?.role_id === 2 || roleName.includes("manager");
  const basePath = isManager ? "/manager/customers" : "/customers";

  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalCapacityKw: 0,
    totalBilled: 0,
    totalPaid: 0,
    totalBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [requirementFilter, setRequirementFilter] = useState("All");
  const [openAddModal, setOpenAddModal] = useState(false);

  const fetchCustomersList = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (requirementFilter !== "All") params.requirement = requirementFilter;

      const res = await getCustomers(params);
      if (res?.success) {
        setCustomers(res.data || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error("fetchCustomersList error:", err);
    } finally {
      setLoading(false);
    }
  }, [search, requirementFilter]);

  useEffect(() => {
    fetchCustomersList();
  }, [fetchCustomersList]);

  const handleShareWhatsApp = (cust) => {
    const phone = cust.mobile_number?.replace(/\D/g, "");
    if (!phone) return;
    const text = encodeURIComponent(
      `Hello ${cust.customer_name},\nGreetings from Solar CRM! How can we assist you with your solar power system today?`
    );
    window.open(`https://wa.me/91${phone.slice(-10)}?text=${text}`, "_blank");
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.primary, letterSpacing: "-0.02em" }}>
            Customer Directory
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
            Official customer records converted from Won leads with 360° solar assets, projects, and invoices
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchCustomersList}
            sx={{
              borderRadius: "8px",
              borderColor: COLORS.border,
              color: COLORS.primary,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<PersonAddOutlinedIcon />}
            onClick={() => setOpenAddModal(true)}
            sx={{
              bgcolor: COLORS.primary,
              color: "#FFFFFF",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "8px",
              px: 2.5,
              "&:hover": { bgcolor: COLORS.primaryDark },
            }}
          >
            + Add Customer
          </Button>
        </Stack>
      </Box>

      {/* KPI Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2, bgcolor: "#FFFFFF", borderRadius: "12px", border: `1px solid ${COLORS.border}` }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>Total Converted Customers</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mt: 0.5 }}>
                  {stats.totalCustomers}
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.info, fontWeight: 600 }}>Verified Commercial & Homes</Typography>
              </Box>
              <Box sx={{ p: 1.2, bgcolor: COLORS.infoSoft, borderRadius: "10px", color: COLORS.info }}>
                <PeopleAltOutlinedIcon />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2, bgcolor: "#FFFFFF", borderRadius: "12px", border: `1px solid ${COLORS.border}` }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>Total Solar Installed</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.warning, mt: 0.5 }}>
                  {stats.totalCapacityKw.toFixed(1)} kW
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.warning, fontWeight: 600 }}>Commissioned Plant Size</Typography>
              </Box>
              <Box sx={{ p: 1.2, bgcolor: COLORS.warningSoft, borderRadius: "10px", color: COLORS.warning }}>
                <SolarPowerOutlinedIcon />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2, bgcolor: "#FFFFFF", borderRadius: "12px", border: `1px solid ${COLORS.border}` }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>Total Billed Revenue</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mt: 0.5 }}>
                  ₹{Math.round(stats.totalBilled).toLocaleString("en-IN")}
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.success, fontWeight: 600 }}>
                  ₹{Math.round(stats.totalPaid).toLocaleString("en-IN")} Collected
                </Typography>
              </Box>
              <Box sx={{ p: 1.2, bgcolor: COLORS.successSoft, borderRadius: "10px", color: COLORS.success }}>
                <ReceiptLongIcon />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2, bgcolor: "#FFFFFF", borderRadius: "12px", border: `1px solid ${COLORS.border}` }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>Total Balance Due</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: stats.totalBalance > 0 ? COLORS.danger : COLORS.success, mt: 0.5 }}>
                  ₹{Math.round(stats.totalBalance).toLocaleString("en-IN")}
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.danger, fontWeight: 600 }}>Customer Receivables</Typography>
              </Box>
              <Box sx={{ p: 1.2, bgcolor: COLORS.dangerSoft, borderRadius: "10px", color: COLORS.danger }}>
                <AccountBalanceWalletIcon />
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and Search Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: "12px", border: `1px solid ${COLORS.border}` }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by customer name, code (CUST-...), phone number, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: COLORS.textSecondary, fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: "flex-start", md: "flex-end" }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>Type:</Typography>
              {["All", "Residential", "Commercial", "Industrial"].map((req) => (
                <Chip
                  key={req}
                  label={req}
                  clickable
                  onClick={() => setRequirementFilter(req)}
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    bgcolor: requirementFilter === req ? COLORS.primary : "#F1F5F9",
                    color: requirementFilter === req ? "#FFFFFF" : COLORS.textSecondary,
                    "&:hover": {
                      bgcolor: requirementFilter === req ? COLORS.primaryDark : "#E2E8F0",
                    },
                  }}
                />
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Customers Table */}
      <Paper elevation={0} sx={{ borderRadius: "12px", border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <CircularProgress size={36} sx={{ color: COLORS.primary }} />
            <Typography variant="body2" sx={{ mt: 1.5, color: COLORS.textSecondary }}>
              Loading customer profiles...
            </Typography>
          </Box>
        ) : customers.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <PeopleAltOutlinedIcon sx={{ fontSize: 52, color: "#CBD5E1", mb: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.primary }}>
              No Customers Found
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 2 }}>
              When a lead is marked as "Won", an official customer profile will automatically be created here.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setOpenAddModal(true)}
              sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600 }}
            >
              + Create Customer Manually
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 900 }}>
              <TableHead sx={{ bgcolor: COLORS.primary }}>
                <TableRow>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.82rem" }}>CUSTOMER CODE</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.82rem" }}>CUSTOMER / ENTITY</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.82rem" }}>CATEGORY &amp; LOCATION</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.82rem", textAlign: "center" }}>PROJECTS / KW</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.82rem", textAlign: "right" }}>TOTAL BILLED</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.82rem", textAlign: "right" }}>BALANCE DUE</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.82rem", textAlign: "center" }}>DISCOM / CA NO</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.82rem", textAlign: "center" }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((c) => {
                  const bal = parseFloat(c.total_balance_amount) || 0;
                  const billed = parseFloat(c.total_billed_amount) || 0;

                  return (
                    <TableRow key={c.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      {/* Code */}
                      <TableCell sx={{ fontWeight: 700, color: COLORS.primary, fontSize: "0.85rem" }}>
                        <Box sx={{ px: 1, py: 0.4, bgcolor: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", borderRadius: "6px", display: "inline-block", fontFamily: "monospace" }}>
                          {c.customer_code}
                        </Box>
                        {c.lead_code && (
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block", mt: 0.3 }}>
                            Lead: {c.lead_code}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Name & Contact */}
                      <TableCell>
                        <Typography
                          variant="body2"
                          onClick={() => navigate(`${basePath}/${c.id}`)}
                          sx={{ fontWeight: 700, color: COLORS.primary, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                        >
                          {c.customer_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block" }}>
                          📞 {c.mobile_number}
                        </Typography>
                        {c.email && (
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block" }}>
                            ✉️ {c.email}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Category & City */}
                      <TableCell>
                        <Chip
                          size="small"
                          label={c.solar_requirement || "Residential"}
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            bgcolor: c.solar_requirement === "Commercial" ? COLORS.warningSoft : "#F1F5F9",
                            color: c.solar_requirement === "Commercial" ? COLORS.warning : COLORS.textPrimary,
                            mb: 0.5,
                          }}
                        />
                        <Typography variant="caption" sx={{ display: "block", color: COLORS.textSecondary }}>
                          📍 {[c.city, c.state].filter(Boolean).join(", ") || "Site Address"}
                        </Typography>
                      </TableCell>

                      {/* Projects & Capacity */}
                      <TableCell sx={{ textAlign: "center" }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.primary }}>
                          {c.total_projects} Project{c.total_projects === 1 ? "" : "s"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.warning, fontWeight: 700 }}>
                          {parseFloat(c.total_system_kw) > 0 ? `${c.total_system_kw} kW` : "—"}
                        </Typography>
                      </TableCell>

                      {/* Billed */}
                      <TableCell sx={{ textAlign: "right", fontWeight: 700, color: COLORS.primary }}>
                        ₹{Math.round(billed).toLocaleString("en-IN")}
                      </TableCell>

                      {/* Balance Due */}
                      <TableCell sx={{ textAlign: "right", fontWeight: 700, color: bal > 0 ? COLORS.danger : COLORS.success }}>
                        ₹{Math.round(bal).toLocaleString("en-IN")}
                      </TableCell>

                      {/* Discom / CA */}
                      <TableCell sx={{ textAlign: "center" }}>
                        {c.electricity_consumer_number ? (
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.primary, display: "block" }}>
                              {c.electricity_consumer_number}
                            </Typography>
                            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                              {c.discom_name || "Grid"}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                            —
                          </Typography>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell sx={{ textAlign: "center" }}>
                        <Stack direction="row" spacing={0.8} justifyContent="center">
                          {/* 360 View */}
                          <Tooltip title="View 360° Customer Profile">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`${basePath}/${c.id}`)}
                              sx={{ color: COLORS.primary, bgcolor: "#F1F5F9", "&:hover": { bgcolor: "#E2E8F0" } }}
                            >
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* WhatsApp */}
                          <Tooltip title="WhatsApp Direct">
                            <IconButton
                              size="small"
                              onClick={() => handleShareWhatsApp(c)}
                              sx={{ color: "#25D366", bgcolor: "#DCFCE7", "&:hover": { bgcolor: "#BBF7D0" } }}
                            >
                              <WhatsAppIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* Call */}
                          <Tooltip title={`Call ${c.mobile_number}`}>
                            <IconButton
                              size="small"
                              onClick={() => window.open(`tel:${c.mobile_number}`)}
                              sx={{ color: COLORS.info, bgcolor: COLORS.infoSoft, "&:hover": { bgcolor: "#BAE6FD" } }}
                            >
                              <PhoneInTalkIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add Customer Modal */}
      <AddCustomerModal
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        onCustomerCreated={fetchCustomersList}
      />
    </Box>
  );
}
