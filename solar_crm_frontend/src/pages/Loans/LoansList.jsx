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
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import ElectricBoltOutlinedIcon from "@mui/icons-material/ElectricBoltOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import ReplayIcon from "@mui/icons-material/Replay";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import toast from "react-hot-toast";
import api from "../../api/axios";
import {
  LOAN_STAGES,
  LOAN_STAGE_CONFIG,
  SIDE_STATUSES,
  SIDE_STATUS_CONFIG,
  POPULAR_BANKS,
  calculateEMI,
  validateStageTransition,
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
    rejected_loans: 0,
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

  // Side Status Dialog (Mark as Rejected / Withdrawn)
  const [sideStatusDialogOpen, setSideStatusDialogOpen] = useState(false);
  const [targetLoanForSideStatus, setTargetLoanForSideStatus] = useState(null);
  const [sideStatusAction, setSideStatusAction] = useState("Rejected"); // 'Rejected' | 'Withdrawn'
  const [sideStatusReason, setSideStatusReason] = useState("");
  const [savingSideStatus, setSavingSideStatus] = useState(false);

  // Try Another Lender Dialog
  const [tryAnotherLenderDialogOpen, setTryAnotherLenderDialogOpen] = useState(false);
  const [targetLoanForNewLender, setTargetLoanForNewLender] = useState(null);
  const [newLenderName, setNewLenderName] = useState("State Bank of India (SBI)");
  const [newLenderAmount, setNewLenderAmount] = useState("");
  const [savingNewLender, setSavingNewLender] = useState(false);

  // Stage Backward Reason Dialog
  const [backwardDialogOpen, setBackwardDialogOpen] = useState(false);
  const [backwardTargetLoan, setBackwardTargetLoan] = useState(null);
  const [backwardTargetStage, setBackwardTargetStage] = useState("");
  const [backwardReasonText, setBackwardReasonText] = useState("");
  const [savingBackward, setSavingBackward] = useState(false);

  // Stage Advance Requirements Dialog
  const [advanceReqDialogOpen, setAdvanceReqDialogOpen] = useState(false);
  const [advanceTargetLoan, setAdvanceTargetLoan] = useState(null);
  const [advanceTargetStage, setAdvanceTargetStage] = useState("");
  const [advanceFormData, setAdvanceFormData] = useState({
    applied_date: "",
    portal_application_no: "",
    sanctioned_amount: "",
    sanction_date: "",
    sanction_letter_url: "",
    disbursed_amount: "",
    disbursal_date: "",
    subsidy_credited_to_loan: false,
  });
  const [savingAdvance, setSavingAdvance] = useState(false);

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
    loan_stage: "Eligibility & Docs",
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
      console.error("Fetch loan stats error:", err);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Live EMI calculation in Create Dialog
  useEffect(() => {
    const principal = parseFloat(formData.loan_amount_applied) || 0;
    const rate = parseFloat(formData.interest_rate) || 7.0;
    const tenure = parseInt(formData.tenure_months) || 60;
    const emi = calculateEMI(principal, rate, tenure);
    setFormData((prev) => ({ ...prev, monthly_emi: emi }));
  }, [formData.loan_amount_applied, formData.interest_rate, formData.tenure_months]);

  // Auto calculate loan applied = total project cost - expected subsidy - down payment
  const handleCostOrSubsidyChange = (field, val) => {
    const updated = { ...formData, [field]: val };
    const cost = parseFloat(field === "total_project_cost" ? val : updated.total_project_cost) || 0;
    const subsidy = parseFloat(field === "subsidy_expected" ? val : updated.subsidy_expected) || 0;
    const downPay = parseFloat(field === "down_payment_amount" ? val : updated.down_payment_amount) || 0;
    const autoLoan = Math.max(0, cost - subsidy - downPay);
    updated.loan_amount_applied = autoLoan;
    setFormData(updated);
  };

  // Open Details Modal
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
      console.error("Fetch loan detail error:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle stage transition click (Forward vs Backward)
  const handleStepClick = (loan, targetStage) => {
    const currentStage = loan.loan_stage || "Eligibility & Docs";
    if (currentStage === targetStage && loan.side_status === "Active") return;

    const fromIdx = LOAN_STAGES.indexOf(currentStage);
    const toIdx = LOAN_STAGES.indexOf(targetStage);

    // If moving backward: ask for a reason
    if (toIdx < fromIdx) {
      setBackwardTargetLoan(loan);
      setBackwardTargetStage(targetStage);
      setBackwardReasonText("");
      setBackwardDialogOpen(true);
      return;
    }

    // If moving forward: check validation
    const validation = validateStageTransition(currentStage, targetStage, loan);
    if (!validation.ok) {
      // Open Stage Advance Requirements modal
      setAdvanceTargetLoan(loan);
      setAdvanceTargetStage(targetStage);
      setAdvanceFormData({
        applied_date: loan.applied_date ? loan.applied_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        portal_application_no: loan.portal_application_no || "",
        sanctioned_amount: loan.sanctioned_amount > 0 ? loan.sanctioned_amount : loan.loan_amount_applied || "",
        sanction_date: loan.sanction_date ? loan.sanction_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        sanction_letter_url: loan.sanction_letter_url || "",
        disbursed_amount: loan.disbursed_amount > 0 ? loan.disbursed_amount : loan.sanctioned_amount || loan.loan_amount_applied || "",
        disbursal_date: loan.disbursal_date ? loan.disbursal_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        subsidy_credited_to_loan: Boolean(loan.subsidy_credited_to_loan),
      });
      setAdvanceReqDialogOpen(true);
      return;
    }

    // Direct transition if no missing requirements
    executeStageChange(loan.id, { loan_stage: targetStage });
  };

  // Execute stage update API
  const executeStageChange = async (loanId, payload) => {
    try {
      const res = await updateLoan(loanId, payload);
      if (res?.success) {
        toast.success(`Loan stage updated to ${payload.loan_stage}`);
        if (activeLoan && activeLoan.id === loanId) {
          setActiveLoan(res.data);
        }
        fetchLoans();
        fetchStats();
      }
    } catch (err) {
      console.error("Update stage error:", err);
      toast.error(err.response?.data?.message || "Failed to update loan stage");
    }
  };

  // Submit Stage Advance with completed requirements
  const handleSaveAdvanceRequirements = async () => {
    if (!advanceTargetLoan || !advanceTargetStage) return;

    // Rule: Disbursed amount cannot exceed sanctioned amount
    if (advanceTargetStage === "Disbursed" || advanceFormData.disbursed_amount) {
      const sancAmt = parseFloat(advanceFormData.sanctioned_amount || advanceTargetLoan.sanctioned_amount || 0);
      const disbAmt = parseFloat(advanceFormData.disbursed_amount || 0);
      if (sancAmt > 0 && disbAmt > sancAmt) {
        toast.error(`Disbursed amount (₹${disbAmt.toLocaleString("en-IN")}) cannot exceed Sanctioned amount (₹${sancAmt.toLocaleString("en-IN")})`);
        return;
      }
    }

    setSavingAdvance(true);
    try {
      const payload = {
        loan_stage: advanceTargetStage,
        ...advanceFormData,
      };

      const res = await updateLoan(advanceTargetLoan.id, payload);
      if (res?.success) {
        toast.success(`Loan moved to ${advanceTargetStage} successfully!`);
        setAdvanceReqDialogOpen(false);
        if (activeLoan && activeLoan.id === advanceTargetLoan.id) {
          setActiveLoan(res.data);
        }
        fetchLoans();
        fetchStats();
      }
    } catch (err) {
      console.error("Advance error:", err);
      toast.error(err.response?.data?.message || "Failed to move stage.");
    } finally {
      setSavingAdvance(false);
    }
  };

  // Submit Moving Backward with reason
  const handleConfirmBackward = async () => {
    if (!backwardTargetLoan || !backwardTargetStage) return;
    if (!backwardReasonText.trim()) {
      toast.error("Please enter a short reason for moving back.");
      return;
    }

    setSavingBackward(true);
    try {
      const payload = {
        loan_stage: backwardTargetStage,
        backward_reason: backwardReasonText.trim(),
        internal_notes: backwardTargetLoan.internal_notes
          ? `${backwardTargetLoan.internal_notes}\n[${new Date().toLocaleDateString("en-IN")}] Moved back to ${backwardTargetStage}: ${backwardReasonText.trim()}`
          : `[${new Date().toLocaleDateString("en-IN")}] Moved back to ${backwardTargetStage}: ${backwardReasonText.trim()}`,
      };

      const res = await updateLoan(backwardTargetLoan.id, payload);
      if (res?.success) {
        toast.success(`Loan moved back to ${backwardTargetStage}`);
        setBackwardDialogOpen(false);
        if (activeLoan && activeLoan.id === backwardTargetLoan.id) {
          setActiveLoan(res.data);
        }
        fetchLoans();
        fetchStats();
      }
    } catch (err) {
      console.error("Backward error:", err);
      toast.error(err.response?.data?.message || "Failed to move back.");
    } finally {
      setSavingBackward(false);
    }
  };

  // Open Side Status Modal (Mark Rejected / Withdrawn)
  const handleOpenSideStatusModal = (loan) => {
    setTargetLoanForSideStatus(loan);
    setSideStatusAction(loan.side_status === "Withdrawn" ? "Withdrawn" : "Rejected");
    setSideStatusReason(loan.rejection_reason || "");
    setSideStatusDialogOpen(true);
  };

  // Submit Side Status
  const handleSaveSideStatus = async () => {
    if (!targetLoanForSideStatus) return;
    if (!sideStatusReason.trim()) {
      toast.error("Please provide a reason for rejection or withdrawal.");
      return;
    }

    setSavingSideStatus(true);
    try {
      const payload = {
        side_status: sideStatusAction,
        rejection_reason: sideStatusReason.trim(),
        stopped_at_stage: targetLoanForSideStatus.loan_stage || "Eligibility & Docs",
      };

      const res = await updateLoan(targetLoanForSideStatus.id, payload);
      if (res?.success) {
        toast.success(`Loan application marked as ${sideStatusAction}`);
        setSideStatusDialogOpen(false);
        if (activeLoan && activeLoan.id === targetLoanForSideStatus.id) {
          setActiveLoan(res.data);
        }
        fetchLoans();
        fetchStats();
      }
    } catch (err) {
      console.error("Side status error:", err);
      toast.error(err.response?.data?.message || "Failed to update side status.");
    } finally {
      setSavingSideStatus(false);
    }
  };

  // Open "Try Another Lender" Modal
  const handleOpenTryAnotherLender = (loan) => {
    setTargetLoanForNewLender(loan);
    setNewLenderName("State Bank of India (SBI)");
    setNewLenderAmount(loan.loan_amount_applied || "");
    setTryAnotherLenderDialogOpen(true);
  };

  // Submit "Try Another Lender"
  const handleSaveTryAnotherLender = async () => {
    if (!targetLoanForNewLender) return;
    if (!newLenderName.trim()) {
      toast.error("Please select or enter the new lender bank.");
      return;
    }

    setSavingNewLender(true);
    try {
      const payload = {
        bank_name: newLenderName.trim(),
        loan_amount_applied: newLenderAmount || targetLoanForNewLender.loan_amount_applied,
        loan_stage: "Eligibility & Docs",
        side_status: "Active",
        clear_rejection: true,
        portal_application_no: "",
        internal_notes: targetLoanForNewLender.internal_notes
          ? `${targetLoanForNewLender.internal_notes}\n[${new Date().toLocaleDateString("en-IN")}] Re-applied with new lender: ${newLenderName.trim()}`
          : `[${new Date().toLocaleDateString("en-IN")}] Re-applied with new lender: ${newLenderName.trim()}`,
      };

      const res = await updateLoan(targetLoanForNewLender.id, payload);
      if (res?.success) {
        toast.success(`Loan reopened with ${newLenderName}!`);
        setTryAnotherLenderDialogOpen(false);
        if (activeLoan && activeLoan.id === targetLoanForNewLender.id) {
          setActiveLoan(res.data);
        }
        fetchLoans();
        fetchStats();
      }
    } catch (err) {
      console.error("Try another lender error:", err);
      toast.error(err.response?.data?.message || "Failed to re-apply with new lender.");
    } finally {
      setSavingNewLender(false);
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

  // Submit Create Loan
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.lead_id) {
      toast.error("Please select a customer / lead first");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createLoan(formData);
      if (res?.success) {
        toast.success("Solar loan application logged successfully!");
        setCreateModalOpen(false);
        setFormData({
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
          loan_stage: "Eligibility & Docs",
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
        setSelectedLead(null);
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
            5-Stage Rooftop Solar Banking Pipeline &amp; Disbursement Management
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

      {/* ── 4 KPI STATS SUMMARY CARDS ── */}
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
              p: 2,
              borderRadius: "12px",
              border: `1px solid ${selectedStage === "All" ? "#93C5FD" : COLORS.border}`,
              backgroundColor: COLORS.card,
              cursor: "pointer",
              transition: "all 0.18s ease-in-out",
              "&:hover": { borderColor: "#93C5FD", boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)" },
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  TOTAL LOAN APPLICATIONS
                </Typography>
                <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, color: COLORS.textPrimary, mt: 0.5, lineHeight: 1 }}>
                  {stats.total_loans || 0}
                </Typography>
                <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary, mt: 0.8 }}>
                  Pipeline: ₹{Number(stats.total_applied_amount || 0).toLocaleString("en-IN")}
                </Typography>
              </Box>
              <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AccountBalanceIcon sx={{ fontSize: 22, color: "#1D4ED8" }} />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* In Process / Under Review */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            onClick={() => {
              setSelectedStage("Under Review");
              setPage(0);
            }}
            sx={{
              p: 2,
              borderRadius: "12px",
              border: `1px solid ${selectedStage === "Under Review" ? "#FED7AA" : COLORS.border}`,
              backgroundColor: COLORS.card,
              cursor: "pointer",
              transition: "all 0.18s ease-in-out",
              "&:hover": { borderColor: "#FED7AA", boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)" },
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  IN PROCESS / REVIEW
                </Typography>
                <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, color: "#D97706", mt: 0.5, lineHeight: 1 }}>
                  {stats.in_process_loans || 0}
                </Typography>
                <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary, mt: 0.8 }}>
                  Stages 1 to 3 Active
                </Typography>
              </Box>
              <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PendingActionsOutlinedIcon sx={{ fontSize: 22, color: "#D97706" }} />
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
              p: 2,
              borderRadius: "12px",
              border: `1px solid ${selectedStage === "Sanctioned" ? "#86EFAC" : COLORS.border}`,
              backgroundColor: COLORS.card,
              cursor: "pointer",
              transition: "all 0.18s ease-in-out",
              "&:hover": { borderColor: "#86EFAC", boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)" },
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  SANCTIONED / APPROVED
                </Typography>
                <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, color: "#16A34A", mt: 0.5, lineHeight: 1 }}>
                  {stats.sanctioned_loans || 0}
                </Typography>
                <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary, mt: 0.8 }}>
                  Awaiting Disbursal
                </Typography>
              </Box>
              <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <VerifiedOutlinedIcon sx={{ fontSize: 22, color: "#16A34A" }} />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Disbursed Amount */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            onClick={() => {
              setSelectedStage("Disbursed");
              setPage(0);
            }}
            sx={{
              p: 2,
              borderRadius: "12px",
              border: `1px solid ${selectedStage === "Disbursed" ? "#6EE7B7" : COLORS.border}`,
              backgroundColor: COLORS.card,
              cursor: "pointer",
              transition: "all 0.18s ease-in-out",
              "&:hover": { borderColor: "#6EE7B7", boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)" },
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  DISBURSED AMOUNT
                </Typography>
                <Typography sx={{ fontSize: "1.6rem", fontWeight: 800, color: "#059669", mt: 0.5, lineHeight: 1 }}>
                  ₹{Number(stats.total_disbursed_amount || 0).toLocaleString("en-IN")}
                </Typography>
                <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary, mt: 0.8 }}>
                  {stats.disbursed_loans || 0} Loans Credited to Projects
                </Typography>
              </Box>
              <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MonetizationOnOutlinedIcon sx={{ fontSize: 22, color: "#059669" }} />
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* ── SEARCH & FILTER TOOLBAR ── */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: "12px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.card,
          mb: 2.5,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center" sx={{ flexGrow: 1 }}>
          {/* Search Box */}
          <TextField
            size="small"
            placeholder="Search customer, phone, ARN no, bank, project #..."
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
              minWidth: 170,
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
            <Divider sx={{ my: 0.5 }} />
            <MenuItem value="Rejected / Withdrawn" sx={{ fontSize: "0.82rem", color: "#DC2626", fontWeight: 700 }}>
              Rejected / Withdrawn
            </MenuItem>
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

      {/* ── MAIN CONTENT (CARDS VS TABLE) ── */}
      {viewMode === "cards" ? (
        <Box>
          {loading ? (
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5, 6].map((k) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={k}>
                  <Skeleton variant="rectangular" height={320} sx={{ borderRadius: "14px" }} />
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
                const stageCfg = LOAN_STAGE_CONFIG[loan.loan_stage] || LOAN_STAGE_CONFIG["Eligibility & Docs"];
                const isRejectedOrWithdrawn = loan.side_status === "Rejected" || loan.side_status === "Withdrawn";
                const sideCfg = SIDE_STATUS_CONFIG[loan.side_status] || SIDE_STATUS_CONFIG.Active;

                return (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={loan.id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: "14px",
                        border: `1.5px solid ${isRejectedOrWithdrawn ? sideCfg.border : COLORS.border}`,
                        backgroundColor: COLORS.card,
                        transition: "all 0.18s ease-in-out",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        height: "100%",
                        boxSizing: "border-box",
                        position: "relative",
                        overflow: "hidden",
                        "&:hover": {
                          borderColor: isRejectedOrWithdrawn ? sideCfg.border : "#BFDBFE",
                          boxShadow: "0 4px 16px rgba(15, 23, 42, 0.08)",
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      <Box>
                        {/* Top: Customer & Status Badges */}
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

                          {/* Stage or Side Status Chip */}
                          <Stack direction="column" alignItems="flex-end" spacing={0.5}>
                            {isRejectedOrWithdrawn ? (
                              <Chip
                                size="small"
                                icon={<BlockOutlinedIcon sx={{ fontSize: 13, color: "inherit !important" }} />}
                                label={sideCfg.label}
                                sx={{
                                  height: 24,
                                  fontSize: "0.72rem",
                                  fontWeight: 800,
                                  color: sideCfg.color,
                                  backgroundColor: sideCfg.bg,
                                  border: `1px solid ${sideCfg.border}`,
                                  "& .MuiChip-label": { px: 0.8 },
                                }}
                              />
                            ) : (
                              <Chip
                                size="small"
                                label={`Step ${stageCfg.step}/5 • ${stageCfg.label}`}
                                sx={{
                                  height: 24,
                                  fontSize: "0.72rem",
                                  fontWeight: 800,
                                  color: stageCfg.color,
                                  backgroundColor: stageCfg.bg,
                                  border: `1px solid ${stageCfg.border}`,
                                  "& .MuiChip-label": { px: 0.8 },
                                }}
                              />
                            )}

                            {isRejectedOrWithdrawn && (
                              <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: COLORS.textMuted }}>
                                Stopped at: {loan.stopped_at_stage || loan.loan_stage}
                              </Typography>
                            )}
                          </Stack>
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
                              {loan.portal_application_no ? `ARN: ${loan.portal_application_no}` : "Eligibility & Docs"}
                            </Typography>
                          </Stack>
                        </Box>

                        {/* Rejection / Stopped Callout Banner */}
                        {isRejectedOrWithdrawn && (
                          <Alert
                            severity="error"
                            icon={false}
                            sx={{
                              mb: 1.8,
                              py: 0.6,
                              px: 1.2,
                              borderRadius: "8px",
                              bgcolor: sideCfg.bg,
                              border: `1px solid ${sideCfg.border}`,
                              color: sideCfg.color,
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            <strong>Reason:</strong> {loan.rejection_reason || "Not specified by lender"}
                          </Alert>
                        )}

                        {/* 4 Key Financial Figures */}
                        <Grid container spacing={1.2} sx={{ mb: 2 }}>
                          <Grid size={{ xs: 6 }}>
                            <Box sx={{ p: 1, borderRadius: "6px", bgcolor: "#F8FAFC" }}>
                              <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted, fontWeight: 700 }}>
                                LOAN REQUESTED
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

                        {/* Optional Disbursed Indicators */}
                        {loan.loan_stage === "Disbursed" && (
                          <Stack direction="row" spacing={0.8} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                            {loan.subsidy_credited_to_loan ? (
                              <Chip
                                size="small"
                                label="Subsidy Credited to Loan"
                                sx={{ height: 22, fontSize: "0.68rem", fontWeight: 700, bgcolor: "#CCFBF1", color: "#0D9488" }}
                              />
                            ) : null}
                            {loan.project_number ? (
                              <Chip
                                size="small"
                                label={`✓ Recorded on Project #${loan.project_number}`}
                                sx={{ height: 22, fontSize: "0.68rem", fontWeight: 700, bgcolor: "#D1FAE5", color: "#065F46" }}
                              />
                            ) : null}
                          </Stack>
                        )}

                        {/* 5-Stage Stepper Progress Bar */}
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, fontWeight: 600 }}>
                              5-Stage Pipeline Progress
                            </Typography>
                            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: isRejectedOrWithdrawn ? sideCfg.color : stageCfg.color }}>
                              {isRejectedOrWithdrawn ? sideCfg.label : `${stageCfg.percent}%`}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={isRejectedOrWithdrawn ? 100 : stageCfg.percent}
                            sx={{
                              height: 6,
                              borderRadius: "3px",
                              backgroundColor: "#F1F5F9",
                              "& .MuiLinearProgress-bar": {
                                backgroundColor: isRejectedOrWithdrawn ? sideCfg.color : stageCfg.color,
                                borderRadius: "3px",
                              },
                            }}
                          />
                        </Box>
                      </Box>

                      {/* Card Footer: Action Buttons */}
                      <Box sx={{ pt: 1.5, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        {isRejectedOrWithdrawn ? (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<ReplayIcon sx={{ fontSize: 15 }} />}
                            onClick={() => handleOpenTryAnotherLender(loan)}
                            sx={{
                              height: 30,
                              borderRadius: "6px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              textTransform: "none",
                              bgcolor: "#1E293B",
                              color: "#FFFFFF",
                              "&:hover": { bgcolor: "#0F172A" },
                            }}
                          >
                            Try Another Lender
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenDetail(loan)}
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
                            Manage Pipeline
                          </Button>
                        )}

                        <Stack direction="row" spacing={0.8} alignItems="center">
                          {!isRejectedOrWithdrawn && (
                            <Tooltip title="Mark as Rejected / Withdrawn">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenSideStatusModal(loan)}
                                sx={{ color: "#EF4444", p: 0.5, "&:hover": { bgcolor: "#FEE2E2" } }}
                              >
                                <BlockOutlinedIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteLoan(loan.id, loan.customer_name)}
                            sx={{ color: COLORS.textMuted, p: 0.5, "&:hover": { color: "#EF4444", bgcolor: "#FEE2E2" } }}
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
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              textTransform: "none",
                              bgcolor: "#005BAC",
                              "&:hover": { bgcolor: "#004785" },
                            }}
                          >
                            Details
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
                <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.textMuted }}>STAGE (5-STEP)</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", color: COLORS.textMuted }}>LOAN REQUESTED</TableCell>
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
                  const stageCfg = LOAN_STAGE_CONFIG[loan.loan_stage] || LOAN_STAGE_CONFIG["Eligibility & Docs"];
                  const isRejectedOrWithdrawn = loan.side_status === "Rejected" || loan.side_status === "Withdrawn";
                  const sideCfg = SIDE_STATUS_CONFIG[loan.side_status] || SIDE_STATUS_CONFIG.Active;

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
                        {isRejectedOrWithdrawn ? (
                          <Chip
                            size="small"
                            label={`${sideCfg.label} (${loan.stopped_at_stage || loan.loan_stage})`}
                            sx={{
                              height: 22,
                              fontSize: "0.7rem",
                              fontWeight: 800,
                              color: sideCfg.color,
                              bgcolor: sideCfg.bg,
                              border: `1px solid ${sideCfg.border}`,
                            }}
                          />
                        ) : (
                          <Chip
                            size="small"
                            label={`Step ${stageCfg.step}/5 • ${stageCfg.label}`}
                            sx={{
                              height: 22,
                              fontSize: "0.7rem",
                              fontWeight: 800,
                              color: stageCfg.color,
                              bgcolor: stageCfg.bg,
                              border: `1px solid ${stageCfg.border}`,
                            }}
                          />
                        )}
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
                          {isRejectedOrWithdrawn ? (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleOpenTryAnotherLender(loan)}
                              sx={{ height: 26, fontSize: "0.72rem", borderRadius: "5px", textTransform: "none", px: 1 }}
                            >
                              New Lender
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleOpenSideStatusModal(loan)}
                              sx={{ height: 26, fontSize: "0.72rem", borderRadius: "5px", textTransform: "none", px: 0.8, color: "#EF4444" }}
                            >
                              Reject
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleOpenDetail(loan)}
                            sx={{ height: 26, fontSize: "0.72rem", borderRadius: "5px", textTransform: "none", px: 1, bgcolor: "#005BAC" }}
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
        <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", color: COLORS.textPrimary }}>
              Apply for Solar Loan / Jan Samarth
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", color: COLORS.textSecondary, mt: 0.3 }}>
              Step 1 of 5: Eligibility &amp; Document Collection for rooftop solar rooftop financing
            </Typography>
          </Box>
          <IconButton onClick={() => setCreateModalOpen(false)} disabled={submitting}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleCreateSubmit}>
          <DialogContent dividers sx={{ px: 3, py: 2.5, borderColor: COLORS.border }}>
            <Stack spacing={2.5}>
              {/* Select Customer / Lead */}
              <Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", mb: 0.8 }}>
                  1. Customer &amp; Site Information *
                </Typography>
                <Autocomplete
                  options={leadsList}
                  getOptionLabel={(option) => `${option.customer_name || "Lead"} • ${option.mobile_number || ""} (${option.city || "Site"})`}
                  value={selectedLead}
                  onChange={(e, val) => {
                    setSelectedLead(val);
                    if (val) {
                      setFormData((prev) => ({
                        ...prev,
                        lead_id: val.id,
                        customer_name: val.customer_name || "",
                        customer_phone: val.mobile_number || "",
                        customer_email: val.email || "",
                        city: val.city || "",
                        state: val.state || "Rajasthan",
                        system_capacity_kw: val.required_kw || 3.0,
                        electricity_consumer_no: val.electricity_consumer_no || "",
                      }));
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} size="small" placeholder="Search customer by name or phone..." required />
                  )}
                />
              </Box>

              {/* Bank & Application Details */}
              <Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", mb: 0.8 }}>
                  2. Lender (Bank / NBFC) &amp; Application *
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
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
                    <TextField
                      fullWidth
                      size="small"
                      label="Jan Samarth / Bank App No (if generated)"
                      placeholder="e.g. JS-2026-88129"
                      value={formData.portal_application_no}
                      onChange={(e) => setFormData({ ...formData, portal_application_no: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Bank Branch Location"
                      placeholder="e.g. Mansarovar, Jaipur"
                      value={formData.bank_branch}
                      onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Electricity Consumer Number"
                      placeholder="e.g. 192837465012"
                      value={formData.electricity_consumer_no}
                      onChange={(e) => setFormData({ ...formData, electricity_consumer_no: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Loan Financial Structure & Live EMI */}
              <Box sx={{ p: 2, borderRadius: "10px", bgcolor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", mb: 1.5 }}>
                  3. Financial Structure &amp; EMI Estimator
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Total Project Cost (₹)"
                      type="number"
                      value={formData.total_project_cost}
                      onChange={(e) => handleCostOrSubsidyChange("total_project_cost", e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Expected Subsidy (₹)"
                      type="number"
                      value={formData.subsidy_expected}
                      onChange={(e) => handleCostOrSubsidyChange("subsidy_expected", e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Down Payment (₹)"
                      type="number"
                      value={formData.down_payment_amount}
                      onChange={(e) => handleCostOrSubsidyChange("down_payment_amount", e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Loan Requested Amount (₹) *"
                      type="number"
                      required
                      value={formData.loan_amount_applied}
                      onChange={(e) => setFormData({ ...formData, loan_amount_applied: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Interest Rate (% p.a.)"
                      type="number"
                      value={formData.interest_rate}
                      onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Select
                      fullWidth
                      size="small"
                      value={formData.tenure_months}
                      onChange={(e) => setFormData({ ...formData, tenure_months: e.target.value })}
                    >
                      <MenuItem value={36}>3 Years (36 Months)</MenuItem>
                      <MenuItem value={60}>5 Years (60 Months)</MenuItem>
                      <MenuItem value={84}>7 Years (84 Months)</MenuItem>
                      <MenuItem value={120}>10 Years (120 Months)</MenuItem>
                    </Select>
                  </Grid>
                </Grid>

                {/* Monthly EMI Output Box */}
                <Box sx={{ mt: 2, p: 1.5, borderRadius: "8px", bgcolor: "#EFF6FF", border: "1px solid #BFDBFE", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CalculateOutlinedIcon sx={{ color: "#1D4ED8" }} />
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#1E40AF" }}>
                      Estimated Monthly EMI ({formData.tenure_months} Months @ {formData.interest_rate}%):
                    </Typography>
                  </Stack>
                  <Typography sx={{ fontSize: "1.15rem", fontWeight: 800, color: "#1D4ED8" }}>
                    ₹{Number(formData.monthly_emi || 0).toLocaleString("en-IN")}/month
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setCreateModalOpen(false)} disabled={submitting} sx={{ borderRadius: "8px" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ bgcolor: "#005BAC", borderRadius: "8px", fontWeight: 700, px: 3 }}
            >
              {submitting ? "Logging Loan..." : "Log Loan Application"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── LOAN DETAILS & 5-STAGE PIPELINE MODAL ── */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ px: 3, pt: 2.5, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.25rem", color: COLORS.textPrimary }}>
              {activeLoan?.customer_name || activeLoan?.lead_name || "Loan Application"}
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", color: COLORS.textSecondary, mt: 0.3 }}>
              Lender: <strong>{activeLoan?.bank_name}</strong> • Phone: {activeLoan?.customer_phone || activeLoan?.lead_phone}
            </Typography>
          </Box>
          <IconButton onClick={() => setDetailModalOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: COLORS.border, py: 2.5 }}>
          {detailLoading ? (
            <Skeleton variant="rectangular" height={250} />
          ) : activeLoan ? (
            <Stack spacing={3}>
              {/* Side Status Banner if Rejected / Withdrawn */}
              {(activeLoan.side_status === "Rejected" || activeLoan.side_status === "Withdrawn") && (
                <Alert
                  severity="error"
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      startIcon={<ReplayIcon />}
                      onClick={() => handleOpenTryAnotherLender(activeLoan)}
                      sx={{ fontWeight: 800, textTransform: "none" }}
                    >
                      Try Another Lender
                    </Button>
                  }
                  sx={{ borderRadius: "10px" }}
                >
                  <strong>{SIDE_STATUS_CONFIG[activeLoan.side_status]?.label}:</strong> Stopped at <strong>{activeLoan.stopped_at_stage || activeLoan.loan_stage}</strong>.
                  <br />
                  Reason: <em>{activeLoan.rejection_reason || "None specified"}</em>
                </Alert>
              )}

              {/* 5-Stage Stepper Header */}
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase" }}>
                    5-Stage Sequential Pipeline (Click any step to advance or adjust)
                  </Typography>
                  {activeLoan.side_status === "Active" && (
                    <Button
                      size="small"
                      startIcon={<BlockOutlinedIcon />}
                      onClick={() => handleOpenSideStatusModal(activeLoan)}
                      sx={{ color: "#EF4444", fontSize: "0.72rem", textTransform: "none", fontWeight: 700 }}
                    >
                      Mark Rejected / Withdrawn
                    </Button>
                  )}
                </Stack>

                {/* Stepper Cards in a Row */}
                <Grid container spacing={1}>
                  {LOAN_STAGES.map((stg, idx) => {
                    const isCurrent = activeLoan.loan_stage === stg;
                    const cfg = LOAN_STAGE_CONFIG[stg];
                    const isPassed = LOAN_STAGES.indexOf(activeLoan.loan_stage) > idx;

                    return (
                      <Grid size={{ xs: 12, sm: 2.4 }} key={stg}>
                        <Paper
                          onClick={() => handleStepClick(activeLoan, stg)}
                          elevation={0}
                          sx={{
                            p: 1.5,
                            borderRadius: "10px",
                            border: `2px solid ${isCurrent ? cfg.color : isPassed ? "#86EFAC" : COLORS.border}`,
                            bgcolor: isCurrent ? cfg.bg : isPassed ? "#F0FDF4" : "#FFFFFF",
                            cursor: "pointer",
                            textAlign: "center",
                            transition: "all 0.15s ease",
                            "&:hover": { borderColor: cfg.color, transform: "scale(1.02)" },
                          }}
                        >
                          <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: isCurrent ? cfg.color : isPassed ? "#16A34A" : COLORS.textMuted }}>
                            STEP {idx + 1} {isPassed ? "✓" : ""}
                          </Typography>
                          <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: isCurrent ? cfg.color : COLORS.textPrimary, mt: 0.2 }}>
                            {cfg.label}
                          </Typography>
                          <Typography sx={{ fontSize: "0.65rem", color: COLORS.textMuted, mt: 0.5, lineHeight: 1.2 }}>
                            {cfg.needed}
                          </Typography>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>

              {/* Financial Breakdown Grid */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Paper sx={{ p: 1.5, bgcolor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
                    <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, fontWeight: 700 }}>REQUESTED</Typography>
                    <Typography sx={{ fontSize: "1rem", fontWeight: 800, mt: 0.3 }}>
                      ₹{Number(activeLoan.loan_amount_applied || 0).toLocaleString("en-IN")}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Paper sx={{ p: 1.5, bgcolor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
                    <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, fontWeight: 700 }}>SANCTIONED</Typography>
                    <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#16A34A", mt: 0.3 }}>
                      {activeLoan.sanctioned_amount > 0 ? `₹${Number(activeLoan.sanctioned_amount).toLocaleString("en-IN")}` : "Pending"}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Paper sx={{ p: 1.5, bgcolor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
                    <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, fontWeight: 700 }}>DISBURSED</Typography>
                    <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#059669", mt: 0.3 }}>
                      {activeLoan.disbursed_amount > 0 ? `₹${Number(activeLoan.disbursed_amount).toLocaleString("en-IN")}` : "₹0"}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Paper sx={{ p: 1.5, bgcolor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
                    <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, fontWeight: 700 }}>MONTHLY EMI</Typography>
                    <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#2563EB", mt: 0.3 }}>
                      ₹{Number(activeLoan.monthly_emi || 0).toLocaleString("en-IN")}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Disbursed Highlights: Subsidy Checkbox & Project Payment */}
              {activeLoan.loan_stage === "Disbursed" && (
                <Box sx={{ p: 2, borderRadius: "10px", bgcolor: "#F0FDF4", border: "1px solid #86EFAC" }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={1}>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: "#065F46" }}>
                        ✓ Loan Disbursed to Installer / Credited
                      </Typography>
                      <Typography sx={{ fontSize: "0.76rem", color: "#047857", mt: 0.2 }}>
                        {activeLoan.project_number
                          ? `Automatically recorded as payment on Project #${activeLoan.project_number}`
                          : "Money received from lender for customer solar installation."}
                      </Typography>
                    </Box>

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(activeLoan.subsidy_credited_to_loan)}
                          onChange={async (e) => {
                            const val = e.target.checked;
                            await updateLoan(activeLoan.id, { subsidy_credited_to_loan: val });
                            setActiveLoan((prev) => ({ ...prev, subsidy_credited_to_loan: val }));
                            toast.success(val ? "Subsidy credited to loan account marked" : "Subsidy loan adjustment removed");
                            fetchLoans();
                          }}
                          color="success"
                        />
                      }
                      label={
                        <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#065F46" }}>
                          Subsidy credited to loan account
                        </Typography>
                      }
                    />
                  </Stack>
                </Box>
              )}

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
                            <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.textPrimary }}>
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

      {/* ── STAGE ADVANCE REQUIREMENTS MODAL ── */}
      <Dialog
        open={advanceReqDialogOpen}
        onClose={() => !savingAdvance && setAdvanceReqDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
          Advance to Stage: {advanceTargetStage}
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Typography sx={{ fontSize: "0.8rem", color: COLORS.textSecondary, mb: 2 }}>
            Complete the required items below to advance this loan to <strong>{advanceTargetStage}</strong>:
          </Typography>

          <Stack spacing={2}>
            {/* If moving to Applied */}
            {advanceTargetStage === "Applied" && (
              <>
                <TextField
                  fullWidth
                  size="small"
                  label="Application Date *"
                  type="date"
                  required
                  value={advanceFormData.applied_date}
                  onChange={(e) => setAdvanceFormData({ ...advanceFormData, applied_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Application / Jan Samarth ARN Number *"
                  placeholder="e.g. JS-2026-99182"
                  required
                  value={advanceFormData.portal_application_no}
                  onChange={(e) => setAdvanceFormData({ ...advanceFormData, portal_application_no: e.target.value })}
                />
              </>
            )}

            {/* If moving to Sanctioned */}
            {advanceTargetStage === "Sanctioned" && (
              <>
                <TextField
                  fullWidth
                  size="small"
                  label="Sanctioned Loan Amount (₹) *"
                  type="number"
                  required
                  value={advanceFormData.sanctioned_amount}
                  onChange={(e) => setAdvanceFormData({ ...advanceFormData, sanctioned_amount: e.target.value })}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Sanction Date *"
                  type="date"
                  required
                  value={advanceFormData.sanction_date}
                  onChange={(e) => setAdvanceFormData({ ...advanceFormData, sanction_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Sanction Letter Document URL / Reference"
                  placeholder="https://... or upload in Document Vault"
                  value={advanceFormData.sanction_letter_url}
                  onChange={(e) => setAdvanceFormData({ ...advanceFormData, sanction_letter_url: e.target.value })}
                />
              </>
            )}

            {/* If moving to Disbursed */}
            {advanceTargetStage === "Disbursed" && (
              <>
                <TextField
                  fullWidth
                  size="small"
                  label="Disbursed Amount (₹) *"
                  type="number"
                  required
                  helperText={`Maximum allowable: Sanctioned Amount (₹${Number(advanceTargetLoan?.sanctioned_amount || advanceFormData.sanctioned_amount || 0).toLocaleString("en-IN")})`}
                  value={advanceFormData.disbursed_amount}
                  onChange={(e) => setAdvanceFormData({ ...advanceFormData, disbursed_amount: e.target.value })}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Disbursal Date *"
                  type="date"
                  required
                  value={advanceFormData.disbursal_date}
                  onChange={(e) => setAdvanceFormData({ ...advanceFormData, disbursal_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={advanceFormData.subsidy_credited_to_loan}
                      onChange={(e) => setAdvanceFormData({ ...advanceFormData, subsidy_credited_to_loan: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: "0.82rem" }}>
                      Subsidy credited to loan account (optional)
                    </Typography>
                  }
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button variant="outlined" onClick={() => setAdvanceReqDialogOpen(false)} disabled={savingAdvance}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAdvanceRequirements}
            disabled={savingAdvance}
            sx={{ bgcolor: "#005BAC", fontWeight: 700 }}
          >
            {savingAdvance ? "Advancing..." : `Confirm & Move to ${advanceTargetStage}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── BACKWARD STAGE REASON MODAL ── */}
      <Dialog
        open={backwardDialogOpen}
        onClose={() => !savingBackward && setBackwardDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
          Move Loan Backward
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Typography sx={{ fontSize: "0.82rem", color: COLORS.textSecondary, mb: 1.5 }}>
            Moving this loan back from <strong>{backwardTargetLoan?.loan_stage}</strong> to <strong>{backwardTargetStage}</strong>. Please enter a short reason:
          </Typography>
          <TextField
            fullWidth
            size="small"
            multiline
            rows={3}
            placeholder="e.g. Lender requested revised quotation or co-applicant KYC documents..."
            required
            value={backwardReasonText}
            onChange={(e) => setBackwardReasonText(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button variant="outlined" onClick={() => setBackwardDialogOpen(false)} disabled={savingBackward}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmBackward}
            disabled={savingBackward}
            sx={{ bgcolor: "#D97706", fontWeight: 700, "&:hover": { bgcolor: "#B45309" } }}
          >
            {savingBackward ? "Moving..." : "Confirm & Move Back"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── SIDE STATUS MODAL (MARK REJECTED / WITHDRAWN) ── */}
      <Dialog
        open={sideStatusDialogOpen}
        onClose={() => !savingSideStatus && setSideStatusDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#DC2626" }}>
          Mark as Rejected or Withdrawn
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Typography sx={{ fontSize: "0.8rem", color: COLORS.textSecondary, mb: 1.5 }}>
            The card will keep showing stage <strong>{targetLoanForSideStatus?.loan_stage}</strong> as where it stopped.
          </Typography>

          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend" sx={{ fontSize: "0.75rem", fontWeight: 700 }}>Select Status *</FormLabel>
            <RadioGroup
              row
              value={sideStatusAction}
              onChange={(e) => setSideStatusAction(e.target.value)}
            >
              <FormControlLabel value="Rejected" control={<Radio size="small" />} label={<Typography sx={{ fontSize: "0.82rem" }}>Rejected by Lender</Typography>} />
              <FormControlLabel value="Withdrawn" control={<Radio size="small" />} label={<Typography sx={{ fontSize: "0.82rem" }}>Withdrawn by Customer</Typography>} />
            </RadioGroup>
          </FormControl>

          <TextField
            fullWidth
            size="small"
            multiline
            rows={3}
            label="Reason *"
            placeholder="e.g. CIBIL score below 650, or customer opted for personal cash payment..."
            required
            value={sideStatusReason}
            onChange={(e) => setSideStatusReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button variant="outlined" onClick={() => setSideStatusDialogOpen(false)} disabled={savingSideStatus}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSideStatus}
            disabled={savingSideStatus}
            sx={{ bgcolor: "#DC2626", fontWeight: 700, "&:hover": { bgcolor: "#B91C1C" } }}
          >
            {savingSideStatus ? "Saving..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── TRY ANOTHER LENDER MODAL ── */}
      <Dialog
        open={tryAnotherLenderDialogOpen}
        onClose={() => !savingNewLender && setTryAnotherLenderDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
          Try Another Lender
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Typography sx={{ fontSize: "0.82rem", color: COLORS.textSecondary, mb: 2 }}>
            Choose a new bank or NBFC for <strong>{targetLoanForNewLender?.customer_name || targetLoanForNewLender?.lead_name}</strong>. Previous KYC documents remain saved in the vault.
          </Typography>

          <Stack spacing={2}>
            <Box>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, mb: 0.5 }}>New Bank / NBFC *</Typography>
              <Select
                fullWidth
                size="small"
                value={newLenderName}
                onChange={(e) => setNewLenderName(e.target.value)}
              >
                {POPULAR_BANKS.map((b) => (
                  <MenuItem key={b} value={b}>{b}</MenuItem>
                ))}
              </Select>
            </Box>

            <TextField
              fullWidth
              size="small"
              label="Requested Loan Amount (₹)"
              type="number"
              value={newLenderAmount}
              onChange={(e) => setNewLenderAmount(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button variant="outlined" onClick={() => setTryAnotherLenderDialogOpen(false)} disabled={savingNewLender}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveTryAnotherLender}
            disabled={savingNewLender}
            sx={{ bgcolor: "#005BAC", fontWeight: 700 }}
          >
            {savingNewLender ? "Re-Applying..." : "Re-Apply with New Lender"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
