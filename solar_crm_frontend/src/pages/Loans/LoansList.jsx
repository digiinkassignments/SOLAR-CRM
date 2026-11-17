import { useState, useEffect, useCallback, useRef } from "react";
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
  Stack,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  LinearProgress,
  Alert,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
} from "@mui/material";

// Icons
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import ReplayIcon from "@mui/icons-material/Replay";

import toast from "react-hot-toast";
import api from "../../api/axios";
import {
  LOAN_STAGES,
  LOAN_STAGE_CONFIG,
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const sequenceRef = useRef(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
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
  const [newLenderName, setNewLenderName] = useState("");
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
    bank_name: "",
    bank_branch: "",
    bank_ifsc: "",
    bank_dsa_name: "",
    bank_dsa_phone: "",
    portal_application_no: "",
    loan_stage: "Eligibility & Docs",
    system_capacity_kw: "",
    total_project_cost: "",
    subsidy_expected: "",
    down_payment_amount: "",
    loan_amount_applied: "",
    interest_rate: "",
    tenure_months: 60,
    monthly_emi: "",
    cibil_score: "",
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
    const sequence = ++sequenceRef.current;
    setLoading(true);
    setLoadError("");
    try {
      const res = await getAllLoans({
        search,
        stage: selectedStage,
        bank: selectedBank,
        page: page + 1,
        limit: rowsPerPage,
      });
      if (sequence !== sequenceRef.current) return;
      if (!res?.success || !res.data) throw new Error(res?.message || "Unable to load loan records");
      if (res?.success && res?.data) {
        setLoans(res.data.loans || []);
        setTotalCount(res.data.total || 0);
      }
    } catch (err) {
      if (sequence !== sequenceRef.current) return;
      console.error("Fetch loans error:", err);
      setLoadError(err.response?.data?.message || "Unable to load loan records. Please retry.");
    } finally {
      if (sequence === sequenceRef.current) setLoading(false);
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
    const rate = formData.interest_rate === "" ? 7 : Number(formData.interest_rate);
    const tenure = parseInt(formData.tenure_months) || 60;
    const emi = calculateEMI(principal, rate, tenure);
    setFormData((prev) => ({ ...prev, monthly_emi: emi }));
  }, [formData.loan_amount_applied, formData.interest_rate, formData.tenure_months]);

  // Indicative initial funding need: expected subsidy is not an upfront receipt.
  const handleCostOrSubsidyChange = (field, val) => {
    const updated = { ...formData, [field]: val };
    const cost = parseFloat(field === "total_project_cost" ? val : updated.total_project_cost) || 0;
    const downPay = parseFloat(field === "down_payment_amount" ? val : updated.down_payment_amount) || 0;
    const autoLoan = Math.max(0, cost - downPay);
    if (field !== "subsidy_expected") updated.loan_amount_applied = autoLoan;
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
    if (!validation.ok || ["Applied", "Sanctioned", "Disbursed"].includes(targetStage)) {
      // Open Stage Advance Requirements modal
      setAdvanceTargetLoan(loan);
      setAdvanceTargetStage(targetStage);
      setAdvanceFormData({
        applied_date: loan.applied_date ? loan.applied_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        portal_application_no: loan.portal_application_no || "",
        sanctioned_amount: loan.sanctioned_amount > 0 ? loan.sanctioned_amount : "",
        sanction_date: loan.sanction_date ? loan.sanction_date.slice(0, 10) : "",
        sanction_letter_url: loan.sanction_letter_url || "",
        disbursed_amount: loan.disbursed_amount > 0 ? loan.disbursed_amount : "",
        disbursal_date: loan.disbursal_date ? loan.disbursal_date.slice(0, 10) : "",
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
    if (!advanceTargetLoan || !advanceTargetStage || savingAdvance) return;
    if (["Applied", "Under Review"].includes(advanceTargetStage) && (!advanceFormData.applied_date || !advanceFormData.portal_application_no.trim())) {
      toast.error("Record the application date and lender / portal reference."); return;
    }
    if (advanceTargetStage === "Sanctioned" && (!(Number(advanceFormData.sanctioned_amount) > 0) || !advanceFormData.sanction_date || !advanceFormData.sanction_letter_url.trim())) {
      toast.error("Record the sanctioned amount, date and sanction document."); return;
    }
    if (advanceTargetStage === "Disbursed" && (!(Number(advanceFormData.disbursed_amount) > 0) || !advanceFormData.disbursal_date)) {
      toast.error("Record the actual disbursed amount and date."); return;
    }

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
      const fields = advanceTargetStage === "Sanctioned" ? ["sanctioned_amount", "sanction_date", "sanction_letter_url"]
        : advanceTargetStage === "Disbursed" ? ["disbursed_amount", "disbursal_date", "subsidy_credited_to_loan"]
        : ["applied_date", "portal_application_no"];
      const payload = { loan_stage: advanceTargetStage };
      for (const field of fields) payload[field] = advanceFormData[field];
      if (advanceTargetStage === "Sanctioned") {
        payload.interest_rate = advanceTargetLoan.interest_rate ?? 7;
        payload.tenure_months = advanceTargetLoan.tenure_months ?? 60;
        payload.monthly_emi = calculateEMI(payload.sanctioned_amount, payload.interest_rate, payload.tenure_months);
      }
      const validation = validateStageTransition(advanceTargetLoan.loan_stage, advanceTargetStage, { ...advanceTargetLoan, ...payload });
      if (!validation.ok) { toast.error(validation.error); setSavingAdvance(false); return; }

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
  const handleDeleteLoan = (id, name) => setDeleteTarget({ id, name });
  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteLoan(deleteTarget.id);
      if (activeLoan?.id === deleteTarget.id) setDetailModalOpen(false);
      setDeleteTarget(null);
      toast.success("Loan record deleted");
      if (loans.length === 1 && page > 0) setPage(page - 1); else fetchLoans();
      fetchStats();
    } catch (error) { toast.error(error.response?.data?.message || "Failed to delete loan record"); }
    finally { setDeleting(false); }
  };

  // Submit Create Loan
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.lead_id) {
      toast.error("Please select a customer / lead first");
      return;
    }

    if (submitting) return;
    if (!formData.bank_name || !Number.isFinite(Number(formData.loan_amount_applied)) || Number(formData.loan_amount_applied) <= 0) {
      toast.error("Choose a lender and enter a requested amount greater than zero."); return;
    }
    if (formData.interest_rate === "" || !Number.isFinite(Number(formData.interest_rate)) || Number(formData.interest_rate) < 0) {
      toast.error("Enter a valid annual interest rate, including zero if applicable."); return;
    }
    if ([formData.total_project_cost, formData.subsidy_expected, formData.down_payment_amount].some(value => Number(value) < 0)) {
      toast.error("Project cost, subsidy and customer contribution cannot be negative."); return;
    }
    setSubmitting(true);
    try {
      const res = await createLoan(formData);
      if (res?.success) {
        toast.success("Solar loan request recorded successfully!");
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
          system_capacity_kw: "",
          total_project_cost: "",
          subsidy_expected: "",
          down_payment_amount: "",
          loan_amount_applied: "",
          interest_rate: 7.0,
          tenure_months: 60,
          monthly_emi: 0,
          cibil_score: "",
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

  const money = value => value == null ? "Not recorded" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
  return (
    <Box>
      <Alert severity="info" sx={{mb:2}}>
        <Typography variant="body2" sx={{fontWeight:700}}>Application ? lender review ? sanction ? actual disbursement</Typography>
        <Typography variant="body2">Confirm KYC, electricity bill, quotation, feasibility and income evidence with the selected lender. Jan Samarth is an application channel. Sanction is approval, not a receipt. Record bank queries during review.</Typography>
        <Typography variant="body2" sx={{mt:0.5}}>Some lenders pay in tranches. This tracker records one cumulative disbursement amount; it does not reconcile individual tranches. Subsidy credit to the borrower's loan account is separate from EPC collections. Confirm moratorium, first EMI and revised repayment terms with the bank.</Typography>
      </Alert>
      <Box sx={{ display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:2,mb:2.5 }}>
        <Box sx={{ flex:"1 1 280px",minWidth:0 }}><Typography component="h2" variant="h5" sx={{fontWeight:700}}>Solar loan applications</Typography><Typography variant="body2" color="text.secondary" sx={{mt:0.5}}>Manage lender follow-ups, sanctions, disbursements and documents.</Typography></Box>
        <Stack direction="row" sx={{gap:1,flexWrap:"wrap"}}><Button variant="outlined" startIcon={<RefreshIcon />} disabled={loading} onClick={()=>{fetchLoans();fetchStats();}}>Refresh</Button><Button variant="contained" startIcon={<AddIcon />} onClick={()=>setCreateModalOpen(true)} sx={{ bgcolor:"#005BAC", "&:hover":{bgcolor:"#004785"} }}>New loan record</Button></Stack>
      </Box>
      <Box sx={{display:"grid",gridTemplateColumns:{xs:"repeat(2,minmax(0,1fr))",lg:"repeat(4,minmax(0,1fr))"},gap:2,mb:2.5}}>
        {[["Total requests",stats.total_loans,"#0F172A","#FFFFFF"],["In process",stats.in_process_loans,"#D97706","#FFFBEB"],["Sanctioned",stats.sanctioned_loans,"#16A34A","#F0FDF4"],["Disbursed",stats.disbursed_loans,"#059669","#ECFDF5"]].map(([label,value,color,bg])=><Paper variant="outlined" key={label} sx={{p:2.5,bgcolor:bg,boxShadow:"none"}}><Typography variant="body2" sx={{color,fontWeight:600}}>{label}</Typography><Typography sx={{fontSize:30,fontWeight:700,color,mt:0.5,fontVariantNumeric:"tabular-nums"}}>{value || 0}</Typography></Paper>)}
      </Box>
      <Paper variant="outlined" sx={{p:2,mb:2.5,boxShadow:"none"}}>
        <Box component="form" onSubmit={e=>{e.preventDefault();setSearch(searchInput);setPage(0);}} sx={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:1.5}}>
          <TextField label="Search loans" placeholder="Customer, lender or reference" size="small" value={searchInput} onChange={e=>setSearchInput(e.target.value)} sx={{flex:"2 1 220px",minWidth:0}} />
          <TextField select label="Loan stage" size="small" value={selectedStage} onChange={e=>{setSelectedStage(e.target.value);setPage(0);}} sx={{flex:"1 1 180px",minWidth:0}}><MenuItem value="All">All stages</MenuItem>{LOAN_STAGES.map(stage=><MenuItem key={stage} value={stage}>{stage}</MenuItem>)}</TextField>
          <TextField select label="Lender" size="small" value={selectedBank} onChange={e=>{setSelectedBank(e.target.value);setPage(0);}} sx={{flex:"1 1 210px",minWidth:0}}><MenuItem value="All">All lenders</MenuItem>{POPULAR_BANKS.map(bank=><MenuItem key={bank} value={bank}>{bank}</MenuItem>)}</TextField>
          <Button type="submit" variant="outlined">Search</Button>
          {(search||selectedStage!=="All"||selectedBank!=="All")&&<Button onClick={()=>{setSearch("");setSearchInput("");setSelectedStage("All");setSelectedBank("All");setPage(0);}}>Clear filters</Button>}
          <ToggleButtonGroup value={viewMode} exclusive size="small" onChange={(_,value)=>value&&setViewMode(value)} aria-label="Loan view"><ToggleButton value="cards" aria-label="Loan card view"><ViewListOutlinedIcon fontSize="small" /></ToggleButton><ToggleButton value="table" aria-label="Loan table view"><TableChartOutlinedIcon fontSize="small" /></ToggleButton></ToggleButtonGroup>
        </Box>
      </Paper>
      <Alert severity="info" sx={{mb:2.5}}>A sanction is an approval, not a payment. Record the actual disbursed amount and date; record subsidy adjustment only after lender confirmation. Creating a CRM record does not submit a bank application.</Alert>
      <Typography variant="body2" color="text.secondary" role="status" sx={{mb:2}}>{loading ? "Loading loan records..." : `${totalCount} loan records`}</Typography>
      {loadError ? <Alert severity="error" action={<Button color="inherit" onClick={fetchLoans}>Retry</Button>}>{loadError}</Alert>
       : loading ? <Box sx={{display:"grid",gap:2}}>{[1,2,3].map(i=><Skeleton key={i} variant="rounded" height={120} />)}</Box>
       : loans.length===0 ? <Paper variant="outlined" sx={{p:5,textAlign:"center",boxShadow:"none"}}><AccountBalanceIcon sx={{fontSize:36,color:"text.secondary",mb:1}}/><Typography variant="h6">No loan records found</Typography><Typography color="text.secondary" sx={{my:1}}>Record a financing request or adjust your filters.</Typography><Button variant="contained" onClick={()=>setCreateModalOpen(true)}>New loan record</Button></Paper>
       : viewMode==="table" ? <Paper variant="outlined" sx={{overflow:"hidden",boxShadow:"none"}}><TableContainer><Table size="small" sx={{minWidth:1000}} aria-label="Solar loan applications"><TableHead><TableRow>{["Customer / lender","Stage","Requested","Sanctioned","Disbursed","Actions"].map(label=><TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead><TableBody>{loans.map(loan=>{const cfg=LOAN_STAGE_CONFIG[loan.loan_stage];const stopped=["Rejected","Withdrawn"].includes(loan.side_status);return <TableRow key={loan.id} hover><TableCell><Typography sx={{fontWeight:600}}>{loan.customer_name||loan.lead_name||"Customer"}</Typography><Typography variant="caption">{loan.bank_name}</Typography></TableCell><TableCell><Chip size="small" label={stopped?loan.side_status:loan.loan_stage} sx={{bgcolor:stopped?"#FEE2E2":cfg?.bg,color:stopped?"#DC2626":cfg?.color}}/></TableCell><TableCell>{money(loan.loan_amount_applied)}</TableCell><TableCell>{money(loan.sanctioned_amount)}</TableCell><TableCell>{money(loan.disbursed_amount)}</TableCell><TableCell><Button size="small" variant="outlined" onClick={()=>handleOpenDetail(loan)}>Open loan</Button></TableCell></TableRow>;})}</TableBody></Table></TableContainer></Paper>
       : <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",lg:"repeat(2,minmax(0,1fr))",xl:"repeat(3,minmax(0,1fr))"},gap:2}}>{loans.map(loan=>{
         const cfg=LOAN_STAGE_CONFIG[loan.loan_stage]||LOAN_STAGE_CONFIG["Eligibility & Docs"];const stopped=["Rejected","Withdrawn"].includes(loan.side_status);const next=LOAN_STAGES[cfg.step];
         return <Paper key={loan.id} variant="outlined" sx={{p:2.5,boxShadow:"none",display:"flex",flexDirection:"column",gap:2,borderColor:stopped?"#FCA5A5":COLORS.border}}>
           <Box sx={{display:"flex",flexWrap:"wrap",justifyContent:"space-between",gap:1}}><Typography variant="h6" component="h3">{loan.customer_name||loan.lead_name||"Customer"}</Typography><Chip size="small" label={stopped?loan.side_status:cfg.label} sx={{bgcolor:stopped?"#FEE2E2":cfg.bg,color:stopped?"#DC2626":cfg.color}}/></Box>
           <Box><Typography sx={{fontWeight:600}}>{loan.bank_name||"Lender not recorded"}</Typography><Typography variant="caption">{loan.portal_application_no||"Application reference not recorded"}</Typography></Box>
           <Box sx={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:2}}>{[["Requested",loan.loan_amount_applied],["Sanctioned",loan.sanctioned_amount],["Disbursed",loan.disbursed_amount],["Expected subsidy",loan.subsidy_expected]].map(([label,value])=><Box key={label}><Typography variant="caption">{label}</Typography><Typography sx={{fontWeight:700,fontVariantNumeric:"tabular-nums",color:label==="Disbursed"?"#059669":"inherit"}}>{money(value)}</Typography></Box>)}</Box>
           {loan.subsidy_credited_to_loan ? <Chip size="small" label="Subsidy adjustment recorded" sx={{alignSelf:"flex-start",bgcolor:"#CCFBF1",color:"#0D9488"}}/> : null}
           <Box sx={{mt:"auto"}}><Typography variant="caption">Stage {cfg.step} of {LOAN_STAGES.length}</Typography><LinearProgress variant="determinate" value={cfg.percent} aria-label="Loan workflow stage" sx={{height:6,borderRadius:3,mt:0.75,bgcolor:cfg.bg,"& .MuiLinearProgress-bar":{bgcolor:cfg.color}}}/></Box>
           <Stack direction="row" sx={{flexWrap:"wrap",gap:1,pt:1.5,borderTop:"1px solid",borderColor:"divider"}}><Button variant="outlined" size="small" onClick={()=>handleOpenDetail(loan)}>Open loan</Button>{stopped?<Button size="small" startIcon={<ReplayIcon/>} onClick={()=>handleOpenTryAnotherLender(loan)}>Change lender</Button>:next&&<Button variant="contained" size="small" onClick={()=>handleStepClick(loan,next)} sx={{bgcolor:cfg.color}}>Next: {next}</Button>}<IconButton aria-label={`Delete loan for ${loan.customer_name||"customer"}`} color="error" onClick={()=>handleDeleteLoan(loan.id,loan.customer_name)}><DeleteIcon fontSize="small"/></IconButton></Stack>
         </Paper>;
       })}</Box>}
      {!loadError&&totalCount>0&&<TablePagination component="div" count={totalCount} page={page} rowsPerPage={rowsPerPage} rowsPerPageOptions={[12,24,48]} onPageChange={(_,value)=>setPage(value)} onRowsPerPageChange={e=>{setRowsPerPage(Number(e.target.value));setPage(0);}}/>}
      <Dialog open={Boolean(deleteTarget)} onClose={()=>!deleting&&setDeleteTarget(null)} role="alertdialog" aria-labelledby="delete-loan-title" maxWidth="xs" fullWidth><DialogTitle id="delete-loan-title">Delete loan record?</DialogTitle><DialogContent><Typography>Delete the CRM loan record for {deleteTarget?.name||"this customer"}? This does not cancel a lender application.</Typography></DialogContent><DialogActions><Button disabled={deleting} onClick={()=>setDeleteTarget(null)}>Cancel</Button><Button color="error" variant="contained" disabled={deleting} onClick={confirmDelete}>{deleting?"Deleting...":"Delete record"}</Button></DialogActions></Dialog>
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
              Record solar loan request
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", color: COLORS.textSecondary, mt: 0.3 }}>
              Collect customer details and record the lender request. Submit separately through the lender / Jan Samarth.
            </Typography>
          </Box>
          <IconButton aria-label="Close" onClick={() => setCreateModalOpen(false)} disabled={submitting}>
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
                        state: val.state || "",
                        system_capacity_kw: val.required_kw || "",
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

              <Alert severity="info">Expected subsidy is tracked separately and is not deducted as an upfront receipt. The starting funding estimate is project cost minus customer contribution; edit the requested amount to match the lender application. EMI is indicative and excludes lender fees / moratorium effects.</Alert>
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
                      placeholder="e.g. 250000"
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
                      placeholder="e.g. 78000"
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
                      placeholder="e.g. 25000"
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
                      placeholder="e.g. 150000"
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
                      placeholder="e.g. 7.0"
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
                  <Stack sx={{alignItems: "center"}} direction="row"  spacing={1}>
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
              {submitting ? "Logging Loan..." : "Save loan record"}
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
          <IconButton aria-label="Close" onClick={() => setDetailModalOpen(false)}>
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
                <Stack direction="row"   sx={{justifyContent: "space-between", alignItems: "center",  mb: 1.2 }}>
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
                  <Stack sx={{justifyContent: "space-between", alignItems: "center"}} direction={{ xs: "column", sm: "row" }}   spacing={1}>
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
            {["Applied", "Under Review"].includes(advanceTargetStage) && (
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
