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

import toast from "react-hot-toast";
import {
  LOAN_STAGES,
  LOAN_STAGE_CONFIG,
  POPULAR_BANKS,
  calculateEMI,
  getLoanByLead,
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
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [newStage, setNewStage] = useState("");
  const [saving, setSaving] = useState(false);

  // New Loan Form State
  const [formData, setFormData] = useState({
    bank_name: "State Bank of India (SBI)",
    bank_branch: "",
    portal_application_no: "",
    loan_stage: "Applied / Logged",
    system_capacity_kw: project?.system_capacity_kw || 3.0,
    total_project_cost: project?.total_cost || 180000,
    subsidy_expected: 78000,
    down_payment_amount: 20000,
    loan_amount_applied: 160000,
    interest_rate: 7.0,
    tenure_months: 60,
    monthly_emi: 0,
    electricity_consumer_no: project?.consumer_number || "",
  });

  const fetchLoanData = async () => {
    if (!project?.lead_id && !projectId) return;
    setLoading(true);
    try {
      const res = await getLoanByLead(project?.lead_id || projectId);
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

  // Recalculate EMI
  useEffect(() => {
    const P = parseFloat(formData.loan_amount_applied) || 0;
    const r = parseFloat(formData.interest_rate) || 7.0;
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

  // Change Stage
  const handleStageChangeSubmit = async () => {
    if (!loan || !newStage) return;
    setSaving(true);
    try {
      const payload = { loan_stage: newStage };
      if (newStage === "Sanctioned" && !loan.sanction_date) {
        payload.sanction_date = new Date().toISOString().slice(0, 10);
        if (!loan.sanctioned_amount) payload.sanctioned_amount = loan.loan_amount_applied;
      }
      if (newStage === "Disbursed" && !loan.disbursal_date) {
        payload.disbursal_date = new Date().toISOString().slice(0, 10);
        if (!loan.disbursed_amount) payload.disbursed_amount = loan.sanctioned_amount || loan.loan_amount_applied;
      }

      const res = await updateLoan(loan.id, payload);
      if (res?.success) {
        toast.success(`Loan stage updated to ${newStage}`);
        setStageDialogOpen(false);
        fetchLoanData();
      }
    } catch (err) {
      console.error("Update stage error:", err);
      toast.error("Failed to update stage");
    } finally {
      setSaving(false);
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
              loan_stage: "Applied / Logged",
              system_capacity_kw: kw,
              total_project_cost: cost,
              subsidy_expected: 78000,
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
          + Link / Apply for Solar Loan
        </Button>

        {/* Create Modal */}
        <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}>
          <DialogTitle sx={{ fontWeight: 800, fontSize: "1.1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Apply for Solar Loan ({project?.customer_name})
            <IconButton size="small" onClick={() => setCreateModalOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <Box component="form" onSubmit={handleCreateSubmit}>
            <DialogContent dividers sx={{ py: 2.5 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                    Financing Bank / Lender *
                  </Typography>
                  <Select fullWidth size="small" value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}>
                    {POPULAR_BANKS.map((b) => (
                      <MenuItem key={b} value={b}>{b}</MenuItem>
                    ))}
                  </Select>
                </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                      Portal ARN / Application No.
                    </Typography>
                    <TextField fullWidth size="small" placeholder="e.g. JS-2026-991" value={formData.portal_application_no} onChange={(e) => setFormData({ ...formData, portal_application_no: e.target.value })} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                      Loan Amount Requested (₹) *
                    </Typography>
                    <TextField fullWidth size="small" type="number" required value={formData.loan_amount_applied} onChange={(e) => setFormData({ ...formData, loan_amount_applied: e.target.value })} />
                  </Grid>
                </Grid>
                <Box sx={{ p: 1.5, borderRadius: "8px", bgcolor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: "#1D4ED8" }}>
                    Estimated EMI: ₹{Number(formData.monthly_emi || 0).toLocaleString("en-IN")} / month
                  </Typography>
                  <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>
                    5 Years @ 7.0% Concessional Interest Rate
                  </Typography>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button variant="outlined" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: "#005BAC", fontWeight: 700 }}>
                {saving ? "Saving..." : "Submit Loan Application"}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>
      </Paper>
    );
  }

  const stageCfg = LOAN_STAGE_CONFIG[loan.loan_stage] || LOAN_STAGE_CONFIG["Applied / Logged"];

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: "14px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
      {/* Top Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <AccountBalanceIcon sx={{ fontSize: 24, color: "#005BAC" }} />
            <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", color: COLORS.textPrimary }}>
              {loan.bank_name}
            </Typography>
            <Chip
              size="small"
              label={loan.loan_stage}
              sx={{
                height: 24,
                fontSize: "0.72rem",
                fontWeight: 800,
                color: stageCfg.color,
                bgcolor: stageCfg.bg,
                border: `1px solid ${stageCfg.border}`,
              }}
            />
          </Stack>
          <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary, mt: 0.5 }}>
            Application ARN: <strong>{loan.portal_application_no || "N/A"}</strong> • Applied: {loan.applied_date || "Recent"}
          </Typography>
        </Box>

        <Button
          size="small"
          variant="contained"
          onClick={() => {
            setNewStage(loan.loan_stage);
            setStageDialogOpen(true);
          }}
          sx={{ bgcolor: "#F59E0B", color: "#FFFFFF", fontWeight: 700, borderRadius: "6px", textTransform: "none", height: 34, "&:hover": { bgcolor: "#D97706" } }}
        >
          Change Loan Stage
        </Button>
      </Box>

      {/* 7-Stage Interactive Stepper */}
      <Box sx={{ mb: 3.5 }}>
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: COLORS.primary, textTransform: "uppercase", mb: 1.2 }}>
          Loan Progress Pipeline
        </Typography>
        <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1 }}>
          {LOAN_STAGES.map((stg, idx) => {
            const isCurrent = loan.loan_stage === stg;
            const cfg = LOAN_STAGE_CONFIG[stg];
            return (
              <Box
                key={stg}
                onClick={() => {
                  setNewStage(stg);
                  handleStageChangeSubmit();
                }}
                sx={{
                  p: 1.2,
                  borderRadius: "8px",
                  border: `1.5px solid ${isCurrent ? cfg.color : COLORS.border}`,
                  bgcolor: isCurrent ? cfg.bg : "#F8FAFC",
                  cursor: "pointer",
                  minWidth: 110,
                  textAlign: "center",
                  "&:hover": { borderColor: cfg.color },
                }}
              >
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: isCurrent ? cfg.color : COLORS.textMuted }}>
                  STEP {idx + 1}
                </Typography>
                <Typography sx={{ fontSize: "0.74rem", fontWeight: 700, color: isCurrent ? cfg.color : COLORS.textPrimary, mt: 0.2 }}>
                  {stg}
                </Typography>
              </Box>
            );
          })}
        </Box>
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

      {/* Change Stage Dialog */}
      <Dialog open={stageDialogOpen} onClose={() => setStageDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.05rem" }}>Update Loan Stage</DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Select fullWidth size="small" value={newStage} onChange={(e) => setNewStage(e.target.value)}>
            {LOAN_STAGES.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setStageDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleStageChangeSubmit} disabled={saving} sx={{ bgcolor: "#005BAC", fontWeight: 700 }}>
            Save Stage
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
