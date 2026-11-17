import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Chip,
  Stack,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Divider,
  Alert,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
} from "@mui/material";

import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PhoneIcon from "@mui/icons-material/Phone";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import ReplayIcon from "@mui/icons-material/Replay";

import toast from "react-hot-toast";
import {
  LOAN_STAGES,
  LOAN_STAGE_CONFIG,
  SIDE_STATUS_CONFIG,
  POPULAR_BANKS,
  calculateEMI,
  validateStageTransition,
  getLoanByLead,
  getLoanByProject,
  createLoan,
  updateLoan,
  uploadLoanDoc,
} from "../../../../services/loanService";

const COLORS = {
  primary: "#0F172A",
  secondary: "#F59E0B",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
};

export default function ProjectLoanTab({ project, projectId }) {
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Side Status Dialog (Mark as Rejected / Withdrawn)
  const [sideStatusDialogOpen, setSideStatusDialogOpen] = useState(false);
  const [sideStatusAction, setSideStatusAction] = useState("Rejected");
  const [sideStatusReason, setSideStatusReason] = useState("");
  const [savingSideStatus, setSavingSideStatus] = useState(false);

  // Try Another Lender Dialog
  const [tryAnotherLenderDialogOpen, setTryAnotherLenderDialogOpen] = useState(false);
  const [newLenderName, setNewLenderName] = useState("");
  const [newLenderAmount, setNewLenderAmount] = useState("");
  const [savingNewLender, setSavingNewLender] = useState(false);

  // Backward Dialog
  const [backwardDialogOpen, setBackwardDialogOpen] = useState(false);
  const [backwardTargetStage, setBackwardTargetStage] = useState("");
  const [backwardReasonText, setBackwardReasonText] = useState("");
  const [savingBackward, setSavingBackward] = useState(false);

  // Stage Advance Requirements Dialog
  const [advanceReqDialogOpen, setAdvanceReqDialogOpen] = useState(false);
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
  const [formData, setFormData] = useState({
    bank_name: "",
    bank_branch: "",
    portal_application_no: "",
    loan_stage: "Eligibility & Docs",
    system_capacity_kw: project?.system_capacity_kw || "",
    total_project_cost: project?.total_cost || "",
    subsidy_expected: "",
    down_payment_amount: "",
    loan_amount_applied: project?.total_cost || "",
    interest_rate: "",
    tenure_months: "",
    monthly_emi: "",
    electricity_consumer_no: project?.consumer_number || "",
  });

  const fetchLoanData = async () => {
    if (!project?.lead_id && !projectId) return;
    setLoading(true);
    try {
      const res = await (projectId ? getLoanByProject(projectId) : getLoanByLead(project.lead_id));
      if (res?.success && res?.data) {
        setLoan(res.data);
      } else {
        setLoan(null);
      }
    } catch (err) {
      console.warn("Fetch loan for project error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoanData();
  }, [project?.lead_id, projectId]);

  // Recalculate EMI in Create Modal
  useEffect(() => {
    const P = parseFloat(formData.loan_amount_applied) || 0;
    const r = Number(formData.interest_rate);
    const n = parseInt(formData.tenure_months) || 60;
    setFormData((prev) => ({ ...prev, monthly_emi: calculateEMI(P, r, n) }));
  }, [formData.loan_amount_applied, formData.interest_rate, formData.tenure_months]);

  // Create Loan
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        lead_id: project?.lead_id,
        project_id: project?.id || projectId,
        customer_name: project?.customer_name,
        customer_phone: project?.customer_phone,
        city: project?.city,
        state: project?.state,
      };
      const res = await createLoan(payload);
      if (res?.success) {
        toast.success("Solar loan linked to project successfully!");
        setCreateModalOpen(false);
        fetchLoanData();
      }
    } catch (err) {
      console.error("Create loan error:", err);
      toast.error("Failed to link loan");
    } finally {
      setSaving(false);
    }
  };

  // Handle Step Click
  const handleStepClick = (targetStage) => {
    if (!loan) return;
    const currentStage = loan.loan_stage || "Eligibility & Docs";
    if (currentStage === targetStage && loan.side_status === "Active") return;

    const fromIdx = LOAN_STAGES.indexOf(currentStage);
    const toIdx = LOAN_STAGES.indexOf(targetStage);

    // If moving backward: ask for a reason
    if (toIdx < fromIdx) {
      setBackwardTargetStage(targetStage);
      setBackwardReasonText("");
      setBackwardDialogOpen(true);
      return;
    }

    // If moving forward: check validation
    const validation = validateStageTransition(currentStage, targetStage, loan);
    if (!validation.ok || ["Applied", "Sanctioned", "Disbursed"].includes(targetStage)) {
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

    // Direct transition
    executeStageChange({ loan_stage: targetStage });
  };

  const executeStageChange = async (payload) => {
    if (!loan) return;
    try {
      const res = await updateLoan(loan.id, payload);
      if (res?.success) {
        toast.success(`Loan stage updated to ${payload.loan_stage}`);
        fetchLoanData();
      }
    } catch (err) {
      console.error("Update stage error:", err);
      toast.error(err.response?.data?.message || "Failed to update stage");
    }
  };

  // Submit Stage Advance with completed requirements
  const handleSaveAdvanceRequirements = async () => {
    if (!loan || !advanceTargetStage) return;

    // Rule: Disbursed amount cannot exceed sanctioned amount
    if (advanceTargetStage === "Disbursed" || advanceFormData.disbursed_amount) {
      const sancAmt = parseFloat(advanceFormData.sanctioned_amount || loan.sanctioned_amount || 0);
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
      const validation = validateStageTransition(loan.loan_stage, advanceTargetStage, { ...loan, ...payload });
      if (!validation.ok) { toast.error(validation.error); return; }

      const res = await updateLoan(loan.id, payload);
      if (res?.success) {
        toast.success(`Loan moved to ${advanceTargetStage} successfully!`);
        setAdvanceReqDialogOpen(false);
        fetchLoanData();
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
    if (!loan || !backwardTargetStage) return;
    if (!backwardReasonText.trim()) {
      toast.error("Please enter a short reason for moving back.");
      return;
    }

    setSavingBackward(true);
    try {
      const payload = {
        loan_stage: backwardTargetStage,
        backward_reason: backwardReasonText.trim(),
        internal_notes: loan.internal_notes
          ? `${loan.internal_notes}\n[${new Date().toLocaleDateString("en-IN")}] Moved back to ${backwardTargetStage}: ${backwardReasonText.trim()}`
          : `[${new Date().toLocaleDateString("en-IN")}] Moved back to ${backwardTargetStage}: ${backwardReasonText.trim()}`,
      };

      const res = await updateLoan(loan.id, payload);
      if (res?.success) {
        toast.success(`Loan moved back to ${backwardTargetStage}`);
        setBackwardDialogOpen(false);
        fetchLoanData();
      }
    } catch (err) {
      console.error("Backward error:", err);
      toast.error(err.response?.data?.message || "Failed to move back.");
    } finally {
      setSavingBackward(false);
    }
  };

  // Submit Side Status
  const handleSaveSideStatus = async () => {
    if (!loan) return;
    if (!sideStatusReason.trim()) {
      toast.error("Please enter a reason.");
      return;
    }

    setSavingSideStatus(true);
    try {
      const payload = {
        side_status: sideStatusAction,
        rejection_reason: sideStatusReason.trim(),
        stopped_at_stage: loan.loan_stage || "Eligibility & Docs",
      };

      const res = await updateLoan(loan.id, payload);
      if (res?.success) {
        toast.success(`Loan application marked as ${sideStatusAction}`);
        setSideStatusDialogOpen(false);
        fetchLoanData();
      }
    } catch (err) {
      console.error("Side status error:", err);
      toast.error(err.response?.data?.message || "Failed to update status.");
    } finally {
      setSavingSideStatus(false);
    }
  };

  // Submit Try Another Lender
  const handleSaveTryAnotherLender = async () => {
    if (!loan) return;
    if (!newLenderName.trim()) {
      toast.error("Please select a bank.");
      return;
    }

    setSavingNewLender(true);
    try {
      const payload = {
        bank_name: newLenderName.trim(),
        loan_amount_applied: newLenderAmount || loan.loan_amount_applied,
        loan_stage: "Eligibility & Docs",
        side_status: "Active",
        clear_rejection: true,
        portal_application_no: "",
        internal_notes: loan.internal_notes
          ? `${loan.internal_notes}\n[${new Date().toLocaleDateString("en-IN")}] Re-applied with new lender: ${newLenderName.trim()}`
          : `[${new Date().toLocaleDateString("en-IN")}] Re-applied with new lender: ${newLenderName.trim()}`,
      };

      const res = await updateLoan(loan.id, payload);
      if (res?.success) {
        toast.success(`Loan reopened with ${newLenderName}!`);
        setTryAnotherLenderDialogOpen(false);
        fetchLoanData();
      }
    } catch (err) {
      console.error("Try another lender error:", err);
      toast.error(err.response?.data?.message || "Failed to re-apply.");
    } finally {
      setSavingNewLender(false);
    }
  };

  // Doc Upload
  const handleDocUpload = async (e, docType) => {
    const file = e.target.files?.[0];
    if (!file || !loan) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("lead_id", loan.lead_id);
    fd.append("doc_type", docType);

    toast.loading(`Uploading ${docType}...`, { id: "p-doc" });
    try {
      const res = await uploadLoanDoc(loan.id, fd);
      if (res?.success) {
        toast.success(`${docType} uploaded successfully!`, { id: "p-doc" });
        fetchLoanData();
      }
    } catch (err) {
      console.error("Doc upload error:", err);
      toast.error("Upload failed", { id: "p-doc" });
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 4, textAlign: "center", borderRadius: "14px", border: `1px solid ${COLORS.border}` }}>
        <Typography sx={{ fontSize: "0.85rem", color: COLORS.textMuted }}>Loading loan &amp; financing data...</Typography>
      </Paper>
    );
  }

  if (!loan) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 5,
          textAlign: "center",
          borderRadius: "14px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.card,
        }}
      >
        <AccountBalanceIcon sx={{ fontSize: 44, color: COLORS.textMuted, mb: 1.5 }} />
        <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: COLORS.textPrimary }}>
          No Solar Loan Linked to this Project
        </Typography>
        <Typography sx={{ fontSize: "0.82rem", color: COLORS.textSecondary, mt: 0.5, mb: 2.5, maxWidth: 480, mx: "auto" }}>
          Track Jan Samarth portal login, bank verification, sanction letter, and EPC disbursement for this customer.
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            const kw = parseFloat(project?.system_capacity_kw) || 3.0;
            const cost = parseFloat(project?.total_cost) || Math.round(kw * 60000);
            const down = Math.round(cost * 0.1);
            setFormData({
              bank_name: "State Bank of India (SBI)",
              bank_branch: "",
              portal_application_no: "",
              loan_stage: "Eligibility & Docs",
              system_capacity_kw: kw,
              total_project_cost: cost,
              subsidy_expected: 0,
              down_payment_amount: down,
              loan_amount_applied: cost - down,
              interest_rate: 7.0,
              tenure_months: 60,
              monthly_emi: calculateEMI(cost - down, 7.0, 60),
              electricity_consumer_no: project?.consumer_number || "",
            });
            setCreateModalOpen(true);
          }}
          sx={{ bgcolor: "#005BAC", borderRadius: "8px", textTransform: "none", fontWeight: 700 }}
        >
          Link / Apply for Solar Loan
        </Button>

        {/* Create Modal */}
        <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}>
          <DialogTitle sx={{ fontWeight: 800, fontSize: "1.1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Apply for Solar Loan ({project?.customer_name})
            <IconButton size="small" onClick={() => setCreateModalOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <form onSubmit={handleCreateSubmit}>
            <DialogContent dividers sx={{ py: 2 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, mb: 0.5 }}>Lender (Bank / NBFC) *</Typography>
                  <Select
                    fullWidth
                    size="small"
                    displayEmpty
                    value={formData.bank_name || ""}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  >
                    <MenuItem value=""><em>Select Lender / Bank</em></MenuItem>
                    {POPULAR_BANKS.map((b) => (
                      <MenuItem key={b} value={b}>{b}</MenuItem>
                    ))}
                  </Select>
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Loan Requested Amount (₹) *"
                  type="number"
                  required
                  placeholder="e.g. 150000"
                  value={formData.loan_amount_applied}
                  onChange={(e) => setFormData({ ...formData, loan_amount_applied: e.target.value })}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Jan Samarth / Bank App No"
                  placeholder="e.g. JS-2026-99182"
                  value={formData.portal_application_no}
                  onChange={(e) => setFormData({ ...formData, portal_application_no: e.target.value })}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Bank Branch Location"
                  placeholder="e.g. Main Branch, MI Road, Jaipur"
                  value={formData.bank_branch}
                  onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: "#005BAC", fontWeight: 700 }}>
                {saving ? "Saving..." : "Log Application"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Paper>
    );
  }

  const stageCfg = LOAN_STAGE_CONFIG[loan.loan_stage] || LOAN_STAGE_CONFIG["Eligibility & Docs"];
  const isRejectedOrWithdrawn = loan.side_status === "Rejected" || loan.side_status === "Withdrawn";
  const sideCfg = SIDE_STATUS_CONFIG[loan.side_status] || SIDE_STATUS_CONFIG.Active;

  return (
    <Box>
      {/* Top Header Card */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Stack sx={{ alignItems: "center" }} direction="row"  spacing={1}>
            <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", color: COLORS.textPrimary }}>
              {loan.bank_name}
            </Typography>
            {isRejectedOrWithdrawn ? (
              <Chip
                size="small"
                label={`${sideCfg.label} (Stopped at ${loan.stopped_at_stage || loan.loan_stage})`}
                sx={{
                  height: 24,
                  fontSize: "0.72rem",
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
                  height: 24,
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  color: stageCfg.color,
                  bgcolor: stageCfg.bg,
                  border: `1px solid ${stageCfg.border}`,
                }}
              />
            )}
          </Stack>
          <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary, mt: 0.5 }}>
            Application ARN: <strong>{loan.portal_application_no || "Eligibility & Docs"}</strong> • Applied: {loan.applied_date ? loan.applied_date.slice(0, 10) : "Recent"}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          {isRejectedOrWithdrawn ? (
            <Button
              size="small"
              variant="contained"
              startIcon={<ReplayIcon />}
              onClick={() => {
                setNewLenderName("State Bank of India (SBI)");
                setNewLenderAmount(loan.loan_amount_applied || "");
                setTryAnotherLenderDialogOpen(true);
              }}
              sx={{ bgcolor: "#1E293B", fontWeight: 700, borderRadius: "6px", textTransform: "none" }}
            >
              Try Another Lender
            </Button>
          ) : (
            <Button
              size="small"
              variant="outlined"
              startIcon={<BlockOutlinedIcon />}
              onClick={() => {
                setSideStatusAction("Rejected");
                setSideStatusReason(loan.rejection_reason || "");
                setSideStatusDialogOpen(true);
              }}
              sx={{ color: "#EF4444", borderColor: "#FCA5A5", fontWeight: 700, borderRadius: "6px", textTransform: "none", "&:hover": { bgcolor: "#FEE2E2" } }}
            >
              Mark Rejected / Withdrawn
            </Button>
          )}
        </Stack>
      </Box>

      {/* Rejection / Stopped Callout Banner */}
      {isRejectedOrWithdrawn && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: "10px" }}
        >
          <strong>{sideCfg.label}:</strong> Loan application stopped at <strong>{loan.stopped_at_stage || loan.loan_stage}</strong>.
          <br />
          Reason: <em>{loan.rejection_reason || "None specified"}</em>
        </Alert>
      )}

      {/* 5-Stage Interactive Stepper */}
      <Box sx={{ mb: 3.5 }}>
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", mb: 1.2 }}>
          5-Stage Solar Loan Pipeline (Click any step to advance or adjust)
        </Typography>
        <Grid container spacing={1}>
          {LOAN_STAGES.map((stg, idx) => {
            const isCurrent = loan.loan_stage === stg;
            const cfg = LOAN_STAGE_CONFIG[stg];
            const isPassed = LOAN_STAGES.indexOf(loan.loan_stage) > idx;

            return (
              <Grid size={{ xs: 12, sm: 2.4 }} key={stg}>
                <Paper
                  onClick={() => handleStepClick(stg)}
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

      {/* 4 Financial Figures */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Box sx={{ p: 2, borderRadius: "10px", bgcolor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
            <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, fontWeight: 700 }}>LOAN REQUESTED</Typography>
            <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: COLORS.textPrimary, mt: 0.3 }}>
              ₹{Number(loan.loan_amount_applied || 0).toLocaleString("en-IN")}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Box sx={{ p: 2, borderRadius: "10px", bgcolor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
            <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, fontWeight: 700 }}>SANCTIONED AMOUNT</Typography>
            <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: loan.sanctioned_amount > 0 ? "#16A34A" : COLORS.textMuted, mt: 0.3 }}>
              {loan.sanctioned_amount > 0 ? `₹${Number(loan.sanctioned_amount).toLocaleString("en-IN")}` : "Pending"}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Box sx={{ p: 2, borderRadius: "10px", bgcolor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
            <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, fontWeight: 700 }}>DISBURSED TO INSTALLER</Typography>
            <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: loan.disbursed_amount > 0 ? "#059669" : COLORS.textMuted, mt: 0.3 }}>
              {loan.disbursed_amount > 0 ? `₹${Number(loan.disbursed_amount).toLocaleString("en-IN")}` : "₹0"}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Box sx={{ p: 2, borderRadius: "10px", bgcolor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
            <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, fontWeight: 700 }}>ESTIMATED MONTHLY EMI</Typography>
            <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: "#2563EB", mt: 0.3 }}>
              ₹{Number(loan.monthly_emi || 0).toLocaleString("en-IN")}/mo
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Disbursed Stage Highlight: Subsidy Checkbox */}
      {loan.loan_stage === "Disbursed" && (
        <Box sx={{ p: 2, borderRadius: "10px", bgcolor: "#F0FDF4", border: "1px solid #86EFAC", mb: 3 }}>
          <Stack sx={{ justifyContent: "space-between", alignItems: "center" }} direction={{ xs: "column", sm: "row" }}   spacing={1}>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: "#065F46" }}>
                ✓ Loan Disbursed &amp; Recorded on Project
              </Typography>
              <Typography sx={{ fontSize: "0.76rem", color: "#047857", mt: 0.2 }}>
                ₹{Number(loan.disbursed_amount || 0).toLocaleString("en-IN")} credited into Project Payment received.
              </Typography>
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(loan.subsidy_credited_to_loan)}
                  onChange={async (e) => {
                    const val = e.target.checked;
                    await updateLoan(loan.id, { subsidy_credited_to_loan: val });
                    setLoan((prev) => ({ ...prev, subsidy_credited_to_loan: val }));
                    toast.success(val ? "Subsidy credited to loan account marked" : "Subsidy loan adjustment removed");
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

      {/* Documents Vault */}
      <Box>
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", mb: 1.5 }}>
          Loan Documents &amp; Sanction Letter
        </Typography>
        <Grid container spacing={2}>
          {["Sanction Letter", "Bank Agreement", "Electricity Bill", "Bank Statement"].map((docName) => {
            const doc = loan.documents?.find((d) => d.doc_type === docName);
            return (
              <Grid size={{ xs: 12, sm: 6 }} key={docName}>
                <Paper
                  sx={{
                    p: 1.8,
                    borderRadius: "10px",
                    border: `1px solid ${doc ? "#86EFAC" : COLORS.border}`,
                    bgcolor: doc ? "#F0FDF4" : "#FFFFFF",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.textPrimary }}>
                      {docName}
                    </Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: doc ? "#16A34A" : COLORS.textMuted }}>
                      {doc ? "✓ Uploaded & Verified" : "Pending Upload"}
                    </Typography>
                  </Box>

                  {doc ? (
                    <Button size="small" variant="outlined" onClick={() => window.open(doc.file_url, "_blank")} sx={{ height: 28, fontSize: "0.72rem" }}>
                      View
                    </Button>
                  ) : (
                    <Button component="label" size="small" variant="contained" startIcon={<CloudUploadIcon sx={{ fontSize: 14 }} />} sx={{ height: 28, fontSize: "0.72rem", bgcolor: "#005BAC" }}>
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
                  label="Sanction Letter Document URL"
                  value={advanceFormData.sanction_letter_url}
                  onChange={(e) => setAdvanceFormData({ ...advanceFormData, sanction_letter_url: e.target.value })}
                />
              </>
            )}

            {advanceTargetStage === "Disbursed" && (
              <>
                <TextField
                  fullWidth
                  size="small"
                  label="Disbursed Amount (₹) *"
                  type="number"
                  required
                  helperText={`Maximum allowable: Sanctioned Amount (₹${Number(loan?.sanctioned_amount || advanceFormData.sanctioned_amount || 0).toLocaleString("en-IN")})`}
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
            Moving this loan back from <strong>{loan?.loan_stage}</strong> to <strong>{backwardTargetStage}</strong>. Please enter a short reason:
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
            sx={{ bgcolor: "#D97706", fontWeight: 700 }}
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
            The card will keep showing stage <strong>{loan?.loan_stage}</strong> as where it stopped.
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
            placeholder="e.g. CIBIL score below 650, or customer opted for cash payment..."
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
            sx={{ bgcolor: "#DC2626", fontWeight: 700 }}
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
            Choose a new bank or NBFC for <strong>{project?.customer_name}</strong>. Previous KYC documents remain saved in the vault.
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
