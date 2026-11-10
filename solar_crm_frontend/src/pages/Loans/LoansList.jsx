import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Breadcrumbs,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  LinearProgress,
  Divider,
  Alert,
  Card,
  CardContent,
  Slider,
} from "@mui/material";

// Icons
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import PhoneIcon from "@mui/icons-material/Phone";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import ElectricBoltOutlinedIcon from "@mui/icons-material/ElectricBoltOutlined";

import toast from "react-hot-toast";
import api from "../../api/axios";
import {
  LOAN_STAGES,
  LOAN_STAGE_CONFIG,
  POPULAR_BANKS,
  calculateEMI,
  getAllLoans,
  getLoanStats,
  getLoanById,
  createLoan,
  updateLoan,
  deleteLoan,
  uploadLoanDoc,
} from "../../services/loanService";

const COLORS = {
  primary: "#0F172A",
  primaryHover: "#020617",
  secondary: "#F59E0B",
  background: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
};

export default function LoansList() {
  const [loans, setLoans] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total_loans: 0,
    in_process_loans: 0,
    sanctioned_loans: 0,
    disbursed_loans: 0,
    total_disbursed_amount: 0,
    total_applied_amount: 0,
  });

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState("All");
  const [selectedBank, setSelectedBank] = useState("All");
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'table'
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeLoan, setActiveLoan] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [targetLoanForStage, setTargetLoanForStage] = useState(null);
  const [newStage, setNewStage] = useState("");
  const [updatingStage, setUpdatingStage] = useState(false);

  // New Loan Form State
  const [leadsList, setLeadsList] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState({
    lead_id: "",
    project_id: "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    city: "",
    state: "",
    bank_name: "State Bank of India (SBI)",
    bank_branch: "",
    bank_ifsc: "",
    bank_dsa_name: "",
    bank_dsa_phone: "",
    portal_application_no: "",
    loan_stage: "Applied / Logged",
    system_capacity_kw: 3.0,
    total_project_cost: 180000,
    subsidy_expected: 78000,
    down_payment_amount: 20000,
    loan_amount_applied: 160000,
    interest_rate: 7.0,
    tenure_months: 60,
    monthly_emi: 0,
    cibil_score: 750,
    electricity_consumer_no: "",
    applied_date: new Date().toISOString().slice(0, 10),
    internal_notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch leads for autocomplete in New Loan dialog
  useEffect(() => {
    api
      .get("/leads?limit=150")
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setLeadsList(res.data.data);
        } else if (Array.isArray(res.data?.data?.leads)) {
          setLeadsList(res.data.data.leads);
        }
      })
      .catch((e) => console.warn("Fetch leads error:", e));
  }, []);

  // Fetch Loans List
  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllLoans({
        search,
        stage: selectedStage,
        bank: selectedBank,
        page: page + 1,
        limit: rowsPerPage,
      });
      if (res?.success && res?.data) {
        setLoans(res.data.loans || []);
        setTotalCount(res.data.total || 0);
      }
    } catch (err) {
      console.error("Fetch loans error:", err);
      toast.error("Failed to load loan applications");
    } finally {
      setLoading(false);
    }
  }, [search, selectedStage, selectedBank, page, rowsPerPage]);

  // Fetch KPI Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await getLoanStats();
      if (res?.success && res?.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.warn("Fetch loan stats error:", err);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handle lead selection in New Loan dialog
  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
    if (!lead) return;

    const kw = parseFloat(lead.required_kw) || 3.0;
    const estCost = lead.quotation_amount ? parseFloat(lead.quotation_amount) : Math.round(kw * 60000);
    const sub = kw <= 1 ? 30000 : kw <= 2 ? 60000 : 78000;
    const down = Math.round(estCost * 0.1);
    const loanReq = Math.max(0, estCost - down);
    const emi = calculateEMI(loanReq, 7.0, 60);

    setFormData((prev) => ({
      ...prev,
      lead_id: lead.id,
      customer_name: lead.name || "",
      customer_phone: lead.phone || "",
      customer_email: lead.email || "",
      city: lead.city || "",
      state: lead.state || "",
      system_capacity_kw: kw,
      total_project_cost: estCost,
      subsidy_expected: sub,
      down_payment_amount: down,
      loan_amount_applied: loanReq,
      monthly_emi: emi,
      electricity_consumer_no: lead.consumer_number || lead.electricity_bill_account_no || "",
    }));
  };

  // Recalculate EMI whenever principal, rate, or tenure changes
  useEffect(() => {
    const P = parseFloat(formData.loan_amount_applied) || 0;
    const r = parseFloat(formData.interest_rate) || 7.0;
    const n = parseInt(formData.tenure_months) || 60;
    const emi = calculateEMI(P, r, n);
    setFormData((prev) => ({ ...prev, monthly_emi: emi }));
  }, [formData.loan_amount_applied, formData.interest_rate, formData.tenure_months]);

  // Save New Loan
  const handleCreateLoanSubmit = async (e) => {
    e.preventDefault();
    if (!formData.lead_id) {
      toast.error("Please select a customer / lead first");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createLoan(formData);
      if (res?.success) {
        toast.success("Solar loan application created successfully!");
        setCreateModalOpen(false);
        fetchLoans();
        fetchStats();
      }
    } catch (err) {
      console.error("Create loan error:", err);
      toast.error(err.response?.data?.message || "Failed to create loan application");
    } finally {
      setSubmitting(false);
    }
  };

  // View Loan Details
  const handleOpenDetail = async (loan) => {
    setActiveLoan(loan);
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await getLoanById(loan.id);
      if (res?.success && res?.data) {
        setActiveLoan(res.data);
      }
    } catch (err) {
      console.warn("Fetch loan detail note:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Quick Change Stage
  const handleOpenStageDialog = (loan) => {
    setTargetLoanForStage(loan);
    setNewStage(loan.loan_stage || "Applied / Logged");
    setStageDialogOpen(true);
  };

  const handleSaveStageChange = async () => {
    if (!targetLoanForStage || !newStage) return;
    setUpdatingStage(true);
    try {
      const updatePayload = { loan_stage: newStage };
      if (newStage === "Sanctioned" && !targetLoanForStage.sanction_date) {
        updatePayload.sanction_date = new Date().toISOString().slice(0, 10);
        if (!targetLoanForStage.sanctioned_amount) {
          updatePayload.sanctioned_amount = targetLoanForStage.loan_amount_applied;
        }
      }
      if (newStage === "Disbursed" && !targetLoanForStage.disbursal_date) {
        updatePayload.disbursal_date = new Date().toISOString().slice(0, 10);
        if (!targetLoanForStage.disbursed_amount) {
          updatePayload.disbursed_amount = targetLoanForStage.sanctioned_amount || targetLoanForStage.loan_amount_applied;
        }
      }

      const res = await updateLoan(targetLoanForStage.id, updatePayload);
      if (res?.success) {
        toast.success(`Loan stage updated to ${newStage}`);
        setStageDialogOpen(false);
        if (activeLoan && activeLoan.id === targetLoanForStage.id) {
          setActiveLoan(res.data);
        }
        fetchLoans();
        fetchStats();
      }
    } catch (err) {
      console.error("Update stage error:", err);
      toast.error("Failed to update loan stage");
    } finally {
      setUpdatingStage(false);
    }
  };

  // Document Upload in Details
  const handleDocUpload = async (e, docType) => {
    const file = e.target.files?.[0];
    if (!file || !activeLoan) return;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("lead_id", activeLoan.lead_id);
    fd.append("doc_type", docType);

    toast.loading(`Uploading ${docType}...`, { id: "doc-upload" });
    try {
      const res = await uploadLoanDoc(activeLoan.id, fd);
      if (res?.success) {
        toast.success(`${docType} uploaded successfully!`, { id: "doc-upload" });
        const refreshed = await getLoanById(activeLoan.id);
        if (refreshed?.success) setActiveLoan(refreshed.data);
        fetchLoans();
      }
    } catch (err) {
      console.error("Doc upload error:", err);
      toast.error("Failed to upload document", { id: "doc-upload" });
    }
  };

  // Delete Loan
  const handleDeleteLoan = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the loan application for ${name || "this customer"}?`)) {
      return;
    }
    try {
      await deleteLoan(id);
      toast.success("Loan application deleted");
      if (detailModalOpen && activeLoan?.id === id) {
        setDetailModalOpen(false);
      }
      fetchLoans();
      fetchStats();
    } catch (err) {
      console.error("Delete loan error:", err);
      toast.error("Failed to delete loan");
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, backgroundColor: COLORS.background, minHeight: "100vh" }}>
      {/* ── BREADCRUMBS & TOP BAR ── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        gap={1.5}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Breadcrumbs
            separator={<NavigateNextRoundedIcon sx={{ fontSize: 16, color: COLORS.textMuted }} />}
            sx={{ mb: 0.5 }}
          >
            <Stack direction="row" alignItems="center" gap={0.5} sx={{ color: COLORS.textMuted, fontSize: "0.75rem" }}>
              <HomeOutlinedIcon sx={{ fontSize: 15 }} /> Dashboard
            </Stack>
            <Typography sx={{ fontSize: "0.75rem", color: COLORS.textMuted }}>Finance</Typography>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary }}>
              Solar Loans
            </Typography>
          </Breadcrumbs>
          <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary, letterSpacing: "-0.02em" }}>
            Solar Loan &amp; Financing Hub
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.8rem", mt: 0.2 }}>
            Track PM Surya Ghar rooftop solar bank loans, Jan Samarth logins, sanctions &amp; disbursements.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.2} alignItems="center">
          <Tooltip title="Refresh Loans">
            <span>
              <IconButton
                onClick={() => {
                  fetchLoans();
                  fetchStats();
                }}
                disabled={loading}
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
                <RefreshIcon sx={{ fontSize: 18, animation: loading ? "spin 0.8s linear infinite" : "none" }} />
              </IconButton>
            </span>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
            onClick={() => setCreateModalOpen(true)}
            sx={{
              height: 36,
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.82rem",
              px: 2.2,
              backgroundColor: "#005BAC",
              color: "#FFFFFF",
              boxShadow: "0 2px 6px rgba(0, 91, 172, 0.25)",
              whiteSpace: "nowrap",
              "&:hover": { backgroundColor: "#004785" },
            }}
          >
            Apply for Loan
          </Button>
        </Stack>
      </Stack>

      {/* ── 4 KPI STATS SUMMARY CARDS (EXACT LEADS STYLE) ── */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {/* Total Loans */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            onClick={() => {
              setSelectedStage("All");
              setPage(0);
            }}
            sx={{
              p: 2.2,
              borderRadius: "14px",
              border: `1px solid ${selectedStage === "All" ? COLORS.primary : COLORS.border}`,
              backgroundColor: COLORS.card,
              cursor: "pointer",
              transition: "all 0.18s ease-in-out",
              "&:hover": { borderColor: COLORS.primary, boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)" },
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  Total Loan Applications
                </Typography>
                <Typography sx={{ fontSize: "1.75rem", fontWeight: 800, color: COLORS.textPrimary, mt: 0.4 }}>
                  {stats.total_loans || 0}
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mt: 0.3 }}>
                  Pipeline: ₹{Number(stats.total_applied_amount || 0).toLocaleString("en-IN")}
                </Typography>
              </Box>
              <Box sx={{ p: 1.2, borderRadius: "10px", backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>
                <AccountBalanceIcon sx={{ fontSize: 22 }} />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* In Process / Under Review */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            onClick={() => {
              setSelectedStage("Applied / Logged");
              setPage(0);
            }}
            sx={{
              p: 2.2,
              borderRadius: "14px",
              border: `1px solid ${selectedStage === "Applied / Logged" ? "#0284C7" : COLORS.border}`,
              backgroundColor: COLORS.card,
              cursor: "pointer",
              transition: "all 0.18s ease-in-out",
              "&:hover": { borderColor: "#0284C7", boxShadow: "0 4px 12px rgba(2, 132, 199, 0.08)" },
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  In Process / Verification
                </Typography>
                <Typography sx={{ fontSize: "1.75rem", fontWeight: 800, color: "#0284C7", mt: 0.4 }}>
                  {stats.in_process_loans || 0}
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mt: 0.3 }}>
                  Jan Samarth / FI Pending
                </Typography>
              </Box>
              <Box sx={{ p: 1.2, borderRadius: "10px", backgroundColor: "#F0F9FF", color: "#0284C7" }}>
                <PendingActionsOutlinedIcon sx={{ fontSize: 22 }} />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Sanctioned */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            onClick={() => {
              setSelectedStage("Sanctioned");
              setPage(0);
            }}
            sx={{
              p: 2.2,
              borderRadius: "14px",
              border: `1px solid ${selectedStage === "Sanctioned" ? "#16A34A" : COLORS.border}`,
              backgroundColor: COLORS.card,
              cursor: "pointer",
              transition: "all 0.18s ease-in-out",
              "&:hover": { borderColor: "#16A34A", boxShadow: "0 4px 12px rgba(22, 163, 74, 0.08)" },
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  Sanctioned / Approved
                </Typography>
                <Typography sx={{ fontSize: "1.75rem", fontWeight: 800, color: "#16A34A", mt: 0.4 }}>
                  {stats.sanctioned_loans || 0}
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mt: 0.3 }}>
                  Awaiting Disbursal
                </Typography>
              </Box>
              <Box sx={{ p: 1.2, borderRadius: "10px", backgroundColor: "#DCFCE7", color: "#16A34A" }}>
                <VerifiedOutlinedIcon sx={{ fontSize: 22 }} />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Disbursed Funds */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            onClick={() => {
              setSelectedStage("Disbursed");
              setPage(0);
            }}
            sx={{
              p: 2.2,
              borderRadius: "14px",
              border: `1px solid ${selectedStage === "Disbursed" ? "#059669" : COLORS.border}`,
              backgroundColor: COLORS.card,
              cursor: "pointer",
              transition: "all 0.18s ease-in-out",
              "&:hover": { borderColor: "#059669", boxShadow: "0 4px 12px rgba(5, 150, 105, 0.08)" },
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  Disbursed Amount
                </Typography>
                <Typography sx={{ fontSize: "1.5rem", fontWeight: 800, color: "#059669", mt: 0.4 }}>
                  ₹{Number(stats.total_disbursed_amount || 0).toLocaleString("en-IN")}
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mt: 0.3 }}>
                  {stats.disbursed_loans || 0} Loans Credited
                </Typography>
              </Box>
              <Box sx={{ p: 1.2, borderRadius: "10px", backgroundColor: "#D1FAE5", color: "#059669" }}>
                <MonetizationOnOutlinedIcon sx={{ fontSize: 22 }} />
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* ── FILTER TOOLBAR (SEARCH, STAGE, BANK, VIEW MODE) ── */}
      <Paper
        elevation={0}
        sx={{
          p: 1.8,
          mb: 2.5,
          borderRadius: "14px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.card,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, minWidth: 260, flexWrap: "wrap" }}>
          {/* Search Box */}
          <TextField
            size="small"
            placeholder="Search customer, phone, ARN no, bank..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: COLORS.textMuted }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: { xs: "100%", sm: 260 },
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                fontSize: "0.82rem",
                backgroundColor: "#F8FAFC",
              },
            }}
          />

          {/* Stage Dropdown */}
          <Select
            size="small"
            value={selectedStage}
            onChange={(e) => {
              setSelectedStage(e.target.value);
              setPage(0);
            }}
            sx={{
              minWidth: 160,
              borderRadius: "8px",
              fontSize: "0.82rem",
              backgroundColor: "#F8FAFC",
            }}
          >
            <MenuItem value="All">All Loan Stages</MenuItem>
            {LOAN_STAGES.map((stg) => (
              <MenuItem key={stg} value={stg} sx={{ fontSize: "0.82rem" }}>
                {stg}
              </MenuItem>
            ))}
          </Select>

          {/* Bank Dropdown */}
          <Select
            size="small"
            value={selectedBank}
            onChange={(e) => {
              setSelectedBank(e.target.value);
              setPage(0);
            }}
            sx={{
              minWidth: 180,
              borderRadius: "8px",
              fontSize: "0.82rem",
              backgroundColor: "#F8FAFC",
            }}
          >
            <MenuItem value="All">All Banks &amp; Lenders</MenuItem>
            {POPULAR_BANKS.map((b) => (
              <MenuItem key={b} value={b} sx={{ fontSize: "0.82rem" }}>
                {b}
              </MenuItem>
            ))}
          </Select>
        </Stack>

        {/* View Mode Toggle */}
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, val) => val && setViewMode(val)}
          size="small"
          sx={{
            height: 36,
            backgroundColor: "#F1F5F9",
            borderRadius: "8px",
            p: 0.3,
            "& .MuiToggleButton-root": {
              border: 0,
              borderRadius: "6px",
              px: 1.4,
              py: 0.4,
              color: COLORS.textSecondary,
              "&.Mui-selected": {
                backgroundColor: COLORS.card,
                color: COLORS.primary,
                fontWeight: 700,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              },
            },
          }}
        >
          <ToggleButton value="cards">
            <Stack direction="row" alignItems="center" gap={0.5}>
              <ViewListOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700 }}>Cards</Typography>
            </Stack>
          </ToggleButton>
          <ToggleButton value="table">
            <Stack direction="row" alignItems="center" gap={0.5}>
              <TableChartOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700 }}>Table</Typography>
            </Stack>
          </ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      {/* ── CARD VIEW ── */}
      {viewMode === "cards" ? (
        <Box>
          {loading ? (
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5, 6].map((k) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={k}>
                  <Skeleton variant="rounded" height={260} sx={{ borderRadius: "14px" }} />
                </Grid>
              ))}
            </Grid>
          ) : loans.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: "center",
                borderRadius: "14px",
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.card,
              }}
            >
              <AccountBalanceIcon sx={{ fontSize: 48, color: COLORS.textMuted, mb: 1.5 }} />
              <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: COLORS.textPrimary }}>
                No solar loan applications found
              </Typography>
              <Typography sx={{ fontSize: "0.82rem", color: COLORS.textSecondary, mt: 0.5, mb: 2.5 }}>
                Get started by clicking &quot;Apply for Loan&quot; to log a Jan Samarth or bank loan application.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateModalOpen(true)}
                sx={{ bgcolor: "#005BAC", borderRadius: "8px", textTransform: "none", fontWeight: 700 }}
              >
                Apply for Loan
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {loans.map((loan) => {
                const stageCfg = LOAN_STAGE_CONFIG[loan.loan_stage] || LOAN_STAGE_CONFIG["Applied / Logged"];
                return (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={loan.id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: "14px",
                        border: `1px solid ${COLORS.border}`,
                        backgroundColor: COLORS.card,
                        transition: "all 0.18s ease-in-out",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        height: "100%",
                        boxSizing: "border-box",
                        "&:hover": {
                          borderColor: "#BFDBFE",
                          boxShadow: "0 4px 16px rgba(15, 23, 42, 0.08)",
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      <Box>
                        {/* Top: Customer & Bank Badge */}
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                          <Box sx={{ minWidth: 0, pr: 1 }}>
                            <Typography
                              sx={{
                                fontWeight: 800,
                                fontSize: "1.05rem",
                                color: COLORS.textPrimary,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {loan.customer_name || loan.lead_name || "Customer"}
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={0.6} sx={{ mt: 0.3 }}>
                              <PhoneIcon sx={{ fontSize: 13, color: COLORS.textMuted }} />
                              <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}>
                                {loan.customer_phone || loan.lead_phone || "N/A"}
                              </Typography>
                            </Stack>
                          </Box>

                          {/* Stage Chip */}
                          <Chip
                            size="small"
                            label={loan.loan_stage}
                            sx={{
                              height: 24,
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              color: stageCfg.color,
                              backgroundColor: stageCfg.bg,
                              border: `1px solid ${stageCfg.border}`,
                              "& .MuiChip-label": { px: 0.8 },
                              flexShrink: 0,
                            }}
                          />
                        </Box>

                        {/* Lender & ARN No */}
                        <Box sx={{ p: 1.2, mb: 1.8, borderRadius: "8px", backgroundColor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Stack direction="row" alignItems="center" spacing={0.6}>
                              <AccountBalanceIcon sx={{ fontSize: 15, color: "#1D4ED8" }} />
                              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: COLORS.textPrimary }}>
                                {loan.bank_name}
                              </Typography>
                            </Stack>
                            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textMuted, fontFamily: "monospace" }}>
                              {loan.portal_application_no ? `ARN: ${loan.portal_application_no}` : "Direct Login"}
                            </Typography>
                          </Stack>
                        </Box>

                        {/* 4 Key Financial Figures */}
                        <Grid container spacing={1.2} sx={{ mb: 2 }}>
                          <Grid size={{ xs: 6 }}>
                            <Box sx={{ p: 1, borderRadius: "6px", bgcolor: "#F8FAFC" }}>
                              <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted, fontWeight: 700 }}>
                                LOAN APPLIED
                              </Typography>
                              <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, color: COLORS.textPrimary }}>
                                ₹{Number(loan.loan_amount_applied || 0).toLocaleString("en-IN")}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Box sx={{ p: 1, borderRadius: "6px", bgcolor: "#F8FAFC" }}>
                              <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted, fontWeight: 700 }}>
                                SANCTIONED
                              </Typography>
                              <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, color: loan.sanctioned_amount > 0 ? "#16A34A" : COLORS.textPrimary }}>
                                {loan.sanctioned_amount > 0 ? `₹${Number(loan.sanctioned_amount).toLocaleString("en-IN")}` : "Pending"}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Box sx={{ p: 1, borderRadius: "6px", bgcolor: "#F8FAFC" }}>
                              <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted, fontWeight: 700 }}>
                                MONTHLY EMI
                              </Typography>
                              <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, color: "#2563EB" }}>
                                ₹{Number(loan.monthly_emi || 0).toLocaleString("en-IN")}/mo
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Box sx={{ p: 1, borderRadius: "6px", bgcolor: "#F8FAFC" }}>
                              <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted, fontWeight: 700 }}>
                                DISBURSED
                              </Typography>
                              <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, color: loan.disbursed_amount > 0 ? "#059669" : COLORS.textMuted }}>
                                {loan.disbursed_amount > 0 ? `₹${Number(loan.disbursed_amount).toLocaleString("en-IN")}` : "₹0"}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {/* Progress Stepper Bar */}
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, fontWeight: 600 }}>
                              Loan Approval Progress
                            </Typography>
                            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: stageCfg.color }}>
                              {stageCfg.percent}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={stageCfg.percent}
                            sx={{
                              height: 6,
                              borderRadius: "3px",
                              backgroundColor: "#F1F5F9",
                              "& .MuiLinearProgress-bar": { backgroundColor: stageCfg.color, borderRadius: "3px" },
                            }}
                          />
                        </Box>
                      </Box>

                      {/* Card Footer: Action Buttons */}
                      <Box sx={{ pt: 1.5, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenStageDialog(loan)}
                          sx={{
                            height: 30,
                            borderRadius: "6px",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            textTransform: "none",
                            borderColor: COLORS.border,
                            color: COLORS.textPrimary,
                            "&:hover": { borderColor: COLORS.primary, bgcolor: "#F8FAFC" },
                          }}
                        >
                          Change Stage
                        </Button>

                        <Stack direction="row" spacing={0.8} alignItems="center">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteLoan(loan.id, loan.customer_name)}
                            sx={{ color: "#EF4444", p: 0.5, "&:hover": { bgcolor: "#FEE2E2" } }}
                          >
                            <DeleteIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                          <Button
                            size="small"
                            variant="contained"
                            endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                            onClick={() => handleOpenDetail(loan)}
                            sx={{
                              height: 30,
                              borderRadius: "6px",
                              fontSize: "0.74rem",
                              fontWeight: 700,
                              textTransform: "none",
                              bgcolor: "#005BAC",
                              "&:hover": { bgcolor: "#004785" },
                            }}
                          >
                            View Details
                          </Button>
                        </Stack>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      ) : (
        /* ── TABLE VIEW ── */
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "14px", border: `1px solid ${COLORS.border}` }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#F8FAFC" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.textMuted }}>CUSTOMER</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.textMuted }}>BANK / LENDER</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.textMuted }}>ARN / REF NO</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.textMuted }}>STAGE</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.textMuted }}>LOAN APPLIED</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.textMuted }}>SANCTIONED</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.textMuted }}>DISBURSED</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.textMuted }}>MONTHLY EMI</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.textMuted }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    Loading loan applications...
                  </TableCell>
                </TableRow>
              ) : loans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    No loan applications found.
                  </TableCell>
                </TableRow>
              ) : (
                loans.map((loan) => {
                  const stageCfg = LOAN_STAGE_CONFIG[loan.loan_stage] || LOAN_STAGE_CONFIG["Applied / Logged"];
                  return (
                    <TableRow key={loan.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: COLORS.textPrimary }}>
                          {loan.customer_name || loan.lead_name}
                        </Typography>
                        <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                          {loan.customer_phone || loan.lead_phone}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{loan.bank_name}</TableCell>
                      <TableCell sx={{ fontSize: "0.75rem", fontFamily: "monospace" }}>
                        {loan.portal_application_no || "—"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={loan.loan_stage}
                          sx={{
                            height: 22,
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            color: stageCfg.color,
                            bgcolor: stageCfg.bg,
                            border: `1px solid ${stageCfg.border}`,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem", fontWeight: 700 }}>
                        ₹{Number(loan.loan_amount_applied || 0).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem", fontWeight: 700, color: loan.sanctioned_amount > 0 ? "#16A34A" : COLORS.textMuted }}>
                        {loan.sanctioned_amount > 0 ? `₹${Number(loan.sanctioned_amount).toLocaleString("en-IN")}` : "—"}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem", fontWeight: 700, color: loan.disbursed_amount > 0 ? "#059669" : COLORS.textMuted }}>
                        {loan.disbursed_amount > 0 ? `₹${Number(loan.disbursed_amount).toLocaleString("en-IN")}` : "—"}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#2563EB" }}>
                        ₹{Number(loan.monthly_emi || 0).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenDetail(loan)}
                            sx={{ height: 26, fontSize: "0.72rem", borderRadius: "5px", textTransform: "none", px: 1 }}
                          >
                            Details
                          </Button>
                          <IconButton size="small" onClick={() => handleDeleteLoan(loan.id, loan.customer_name)} sx={{ color: "#EF4444" }}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[6, 12, 24, 48]}
        sx={{ mt: 2 }}
      />

      {/* ── CREATE NEW LOAN APPLICATION MODAL ── */}
      <Dialog
        open={createModalOpen}
        onClose={() => !submitting && setCreateModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.15rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Apply for Solar Rooftop Loan
          <IconButton size="small" onClick={() => setCreateModalOpen(false)} disabled={submitting}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <Box component="form" onSubmit={handleCreateLoanSubmit}>
          <DialogContent dividers sx={{ borderColor: COLORS.border, py: 2.5 }}>
            <Stack spacing={2.5}>
              {/* Step 1: Select Customer / Lead */}
              <Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.04em", mb: 1 }}>
                  1. Select Customer / Lead *
                </Typography>
                <Autocomplete
                  options={leadsList}
                  getOptionLabel={(opt) => `${opt.name || "Lead"} • ${opt.phone || ""} • ${opt.city || ""}`}
                  onChange={(e, val) => handleSelectLead(val)}
                  renderInput={(params) => (
                    <TextField {...params} required size="small" placeholder="Type customer name or mobile number..." />
                  )}
                />
              </Box>

              {/* Step 2: Lender & Portal Details */}
              <Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.04em", mb: 1 }}>
                  2. Bank &amp; Jan Samarth Portal Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                      Financing Bank / Lender *
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    >
                      {POPULAR_BANKS.map((b) => (
                        <MenuItem key={b} value={b}>{b}</MenuItem>
                      ))}
                    </Select>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                      Portal Application ARN No.
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. JS-2026-88912"
                      value={formData.portal_application_no}
                      onChange={(e) => setFormData({ ...formData, portal_application_no: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                      Bank Branch / IFSC
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. Mansarovar, Jaipur (SBIN0001234)"
                      value={formData.bank_branch}
                      onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                      Electricity CA / Consumer Number
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. 2101004589"
                      value={formData.electricity_consumer_no}
                      onChange={(e) => setFormData({ ...formData, electricity_consumer_no: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Step 3: Financials & Interactive EMI Calculator */}
              <Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.04em", mb: 1 }}>
                  3. Loan Financials &amp; Real-time EMI Calculator
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                      System Capacity (kW)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={formData.system_capacity_kw}
                      onChange={(e) => setFormData({ ...formData, system_capacity_kw: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                      Total Project Cost (₹)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={formData.total_project_cost}
                      onChange={(e) => setFormData({ ...formData, total_project_cost: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                      PM Surya Ghar Subsidy (₹)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={formData.subsidy_expected}
                      onChange={(e) => setFormData({ ...formData, subsidy_expected: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                      Down Payment / Margin (₹)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={formData.down_payment_amount}
                      onChange={(e) => setFormData({ ...formData, down_payment_amount: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                      Loan Amount Requested (₹) *
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      required
                      value={formData.loan_amount_applied}
                      onChange={(e) => setFormData({ ...formData, loan_amount_applied: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                      Interest Rate (% p.a.)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={formData.interest_rate}
                      onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                    />
                  </Grid>
                </Grid>

                {/* Live EMI Banner */}
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: "10px",
                    backgroundColor: "#EFF6FF",
                    border: "1px solid #BFDBFE",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1.5,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CalculateOutlinedIcon sx={{ fontSize: 24, color: "#1D4ED8" }} />
                    <Box>
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: "#1D4ED8" }}>
                        Calculated Monthly EMI: ₹{Number(formData.monthly_emi || 0).toLocaleString("en-IN")} / month
                      </Typography>
                      <Typography sx={{ fontSize: "0.72rem", color: "#475569" }}>
                        Tenure: {formData.tenure_months} Months ({Math.round(formData.tenure_months / 12)} Years) @ {formData.interest_rate}% interest
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    size="small"
                    label="Instant ROI Match"
                    sx={{ bgcolor: "#DCFCE7", color: "#166534", fontWeight: 700, fontSize: "0.72rem" }}
                  />
                </Box>
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, borderColor: COLORS.border, borderTop: `1px solid ${COLORS.border}` }}>
            <Button variant="outlined" onClick={() => setCreateModalOpen(false)} disabled={submitting} sx={{ borderRadius: "8px" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ bgcolor: "#005BAC", borderRadius: "8px", fontWeight: 700, px: 3, "&:hover": { bgcolor: "#004785" } }}
            >
              {submitting ? "Saving..." : "Create Loan Application"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ── LOAN DETAILS & 7-STAGE STEPPER MODAL ── */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.15rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: COLORS.textPrimary }}>
              {activeLoan?.customer_name || "Loan Application"}
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: COLORS.textMuted }}>
              Lender: {activeLoan?.bank_name} • ARN: {activeLoan?.portal_application_no || "N/A"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setDetailModalOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: COLORS.border, py: 2.5 }}>
          {detailLoading ? (
            <Skeleton variant="rectangular" height={250} />
          ) : activeLoan ? (
            <Stack spacing={3}>
              {/* 7-Stage Interactive Stepper */}
              <Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", mb: 1.5 }}>
                  Solar Loan Lifecycle Stepper (Click to advance)
                </Typography>
                <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1 }}>
                  {LOAN_STAGES.map((stg, idx) => {
                    const isCurrent = activeLoan.loan_stage === stg;
                    const cfg = LOAN_STAGE_CONFIG[stg];
                    return (
                      <Box
                        key={stg}
                        onClick={() => {
                          setTargetLoanForStage(activeLoan);
                          setNewStage(stg);
                          handleSaveStageChange();
                        }}
                        sx={{
                          p: 1.2,
                          borderRadius: "8px",
                          border: `1.5px solid ${isCurrent ? cfg.color : COLORS.border}`,
                          bgcolor: isCurrent ? cfg.bg : "#F8FAFC",
                          cursor: "pointer",
                          minWidth: 120,
                          textAlign: "center",
                          transition: "all 0.15s ease",
                          "&:hover": { borderColor: cfg.color, transform: "scale(1.02)" },
                        }}
                      >
                        <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: isCurrent ? cfg.color : COLORS.textMuted }}>
                          STEP {idx + 1}
                        </Typography>
                        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: isCurrent ? cfg.color : COLORS.textPrimary, mt: 0.3 }}>
                          {stg}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              {/* Financial Breakdown Grid */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Paper sx={{ p: 1.5, bgcolor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
                    <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted }}>Applied Amount</Typography>
                    <Typography sx={{ fontSize: "1rem", fontWeight: 800, mt: 0.3 }}>
                      ₹{Number(activeLoan.loan_amount_applied || 0).toLocaleString("en-IN")}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Paper sx={{ p: 1.5, bgcolor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
                    <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted }}>Sanctioned</Typography>
                    <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#16A34A", mt: 0.3 }}>
                      ₹{Number(activeLoan.sanctioned_amount || 0).toLocaleString("en-IN")}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Paper sx={{ p: 1.5, bgcolor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
                    <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted }}>Disbursed</Typography>
                    <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#059669", mt: 0.3 }}>
                      ₹{Number(activeLoan.disbursed_amount || 0).toLocaleString("en-IN")}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Paper sx={{ p: 1.5, bgcolor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
                    <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted }}>Monthly EMI</Typography>
                    <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#2563EB", mt: 0.3 }}>
                      ₹{Number(activeLoan.monthly_emi || 0).toLocaleString("en-IN")}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Document Vault */}
              <Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", mb: 1.2 }}>
                  Document Vault (Sanction Letter, KYC &amp; Mandate)
                </Typography>
                <Grid container spacing={1.5}>
                  {["Sanction Letter", "Bank Statement", "Electricity Bill", "Aadhaar Card"].map((docName) => {
                    const existingDoc = activeLoan.documents?.find((d) => d.doc_type === docName);
                    return (
                      <Grid size={{ xs: 12, sm: 6 }} key={docName}>
                        <Paper
                          sx={{
                            p: 1.5,
                            borderRadius: "10px",
                            border: `1px solid ${existingDoc ? "#86EFAC" : COLORS.border}`,
                            bgcolor: existingDoc ? "#F0FDF4" : "#FFFFFF",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box>
                            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: COLORS.textPrimary }}>
                              {docName}
                            </Typography>
                            <Typography sx={{ fontSize: "0.7rem", color: existingDoc ? "#16A34A" : COLORS.textMuted }}>
                              {existingDoc ? "✓ Uploaded & Verified" : "Pending Upload"}
                            </Typography>
                          </Box>

                          {existingDoc ? (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => window.open(existingDoc.file_url, "_blank")}
                              sx={{ height: 28, fontSize: "0.7rem", borderRadius: "6px", textTransform: "none" }}
                            >
                              View
                            </Button>
                          ) : (
                            <Button
                              component="label"
                              size="small"
                              variant="contained"
                              startIcon={<CloudUploadIcon sx={{ fontSize: 14 }} />}
                              sx={{ height: 28, fontSize: "0.7rem", borderRadius: "6px", textTransform: "none", bgcolor: "#005BAC" }}
                            >
                              Upload
                              <input type="file" hidden onChange={(e) => handleDocUpload(e, docName)} />
                            </Button>
                          )}
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            </Stack>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button variant="outlined" onClick={() => setDetailModalOpen(false)} sx={{ borderRadius: "8px" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── CHANGE STAGE MODAL ── */}
      <Dialog open={stageDialogOpen} onClose={() => setStageDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.05rem" }}>Update Loan Stage</DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Typography sx={{ fontSize: "0.75rem", color: COLORS.textMuted, mb: 1 }}>
            Select new loan workflow stage:
          </Typography>
          <Select fullWidth size="small" value={newStage} onChange={(e) => setNewStage(e.target.value)}>
            {LOAN_STAGES.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button variant="outlined" onClick={() => setStageDialogOpen(false)} disabled={updatingStage} sx={{ borderRadius: "8px" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveStageChange}
            disabled={updatingStage}
            sx={{ bgcolor: "#005BAC", borderRadius: "8px", fontWeight: 700 }}
          >
            {updatingStage ? "Saving..." : "Save Stage"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

