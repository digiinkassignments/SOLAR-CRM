import api from "../api/axios";

// Standard Solar Loan 5 Sequential Stages
export const LOAN_STAGES = [
  "Eligibility & Docs",
  "Applied",
  "Under Review",
  "Sanctioned",
  "Disbursed",
];

export const LOAN_STAGE_CONFIG = {
  "Eligibility & Docs": {
    step: 1,
    label: "Eligibility & Docs",
    meaning: "Customer wants a loan, and you collect their documents",
    needed: "Lender chosen, amount requested",
    color: "#6366F1",
    bg: "#EEF2FF",
    border: "#C7D2FE",
    percent: 20,
  },
  "Applied": {
    step: 2,
    label: "Applied",
    meaning: "Application is filed with the bank or NBFC",
    needed: "Applied date, application number",
    color: "#0284C7",
    bg: "#F0F9FF",
    border: "#BAE6FD",
    percent: 40,
  },
  "Under Review": {
    step: 3,
    label: "Under Review",
    meaning: "Lender is verifying and may ask questions",
    needed: "None (waiting stage)",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    percent: 60,
  },
  "Sanctioned": {
    step: 4,
    label: "Sanctioned",
    meaning: "Lender has approved the loan",
    needed: "Sanctioned amount, date, sanction letter",
    color: "#16A34A",
    bg: "#DCFCE7",
    border: "#86EFAC",
    percent: 80,
  },
  "Disbursed": {
    step: 5,
    label: "Disbursed",
    meaning: "Money has been paid to you",
    needed: "Disbursed amount, date",
    color: "#059669",
    bg: "#D1FAE5",
    border: "#6EE7B7",
    percent: 100,
  },
  // Backward compatibility alias
  "Eligibility Check": { step: 1, label: "Eligibility & Docs", color: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE", percent: 20 },
  "Docs Pending": { step: 1, label: "Eligibility & Docs", color: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE", percent: 20 },
  "Applied / Logged": { step: 2, label: "Applied", color: "#0284C7", bg: "#F0F9FF", border: "#BAE6FD", percent: 40 },
  "Bank FI & Verification": { step: 3, label: "Under Review", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", percent: 60 },
  "Subsidy Adjusted": { step: 5, label: "Disbursed", color: "#059669", bg: "#D1FAE5", border: "#6EE7B7", percent: 100 },
};

// Side Statuses (Rejected or Withdrawn)
export const SIDE_STATUSES = ["Active", "Rejected", "Withdrawn"];

export const SIDE_STATUS_CONFIG = {
  "Active": {
    label: "Active",
    color: "#16A34A",
    bg: "#DCFCE7",
    border: "#86EFAC",
  },
  "Rejected": {
    label: "Rejected by Lender",
    color: "#DC2626",
    bg: "#FEE2E2",
    border: "#FCA5A5",
  },
  "Withdrawn": {
    label: "Withdrawn by Customer",
    color: "#EA580C",
    bg: "#FFEDD5",
    border: "#FDBA74",
  },
};

// Validation Helper for Stage Transitions
export const validateStageTransition = (fromStage, toStage, loan = {}) => {
  const fromIdx = LOAN_STAGES.indexOf(fromStage);
  const toIdx = LOAN_STAGES.indexOf(toStage);

  // If going backward
  if (toIdx < fromIdx) {
    return { ok: true, isBackward: true };
  }

  const missing = [];

  // If advancing to "Applied"
  if (toStage === "Applied") {
    if (!loan.bank_name || !loan.bank_name.trim()) missing.push("Lender (Bank / NBFC)");
    if (!loan.loan_amount_applied || parseFloat(loan.loan_amount_applied) <= 0) missing.push("Requested Loan Amount (₹)");
  }

  // If advancing to "Under Review"
  if (toStage === "Under Review") {
    if (!loan.applied_date) missing.push("Application Date");
    if (!loan.portal_application_no || !loan.portal_application_no.trim()) missing.push("Application / Jan Samarth ARN Number");
  }

  // If advancing to "Sanctioned"
  if (toStage === "Sanctioned") {
    // Waiting stage, no strict blockers
  }

  // If advancing to "Disbursed"
  if (toStage === "Disbursed") {
    if (!loan.sanctioned_amount || parseFloat(loan.sanctioned_amount) <= 0) missing.push("Sanctioned Amount (₹)");
    if (!loan.sanction_date) missing.push("Sanction Date");
    const hasSanctionDoc = loan.sanction_letter_url || (loan.documents && loan.documents.some(d => d.doc_type && d.doc_type.toLowerCase().includes("sanction")));
    if (!hasSanctionDoc) missing.push("Sanction Letter (Upload or URL)");
  }

  // Disbursed check (if completing Disbursed)
  if (fromStage === "Disbursed" || toStage === "Disbursed") {
    if (loan.disbursed_amount && loan.sanctioned_amount) {
      if (parseFloat(loan.disbursed_amount) > parseFloat(loan.sanctioned_amount)) {
        return {
          ok: false,
          error: `Disbursed amount (₹${parseFloat(loan.disbursed_amount).toLocaleString("en-IN")}) cannot exceed sanctioned amount (₹${parseFloat(loan.sanctioned_amount).toLocaleString("en-IN")}).`,
          missing: [],
        };
      }
    }
  }

  if (missing.length > 0) {
    return {
      ok: false,
      missing,
      error: `Please fill required items before moving to ${toStage}: ${missing.join(", ")}`,
    };
  }

  return { ok: true, isBackward: false };
};

export const POPULAR_BANKS = [
  "State Bank of India (SBI)",
  "Punjab National Bank (PNB)",
  "Canara Bank",
  "Bank of Baroda (BoB)",
  "Union Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Ecofy (Solar NBFC)",
  "Metafin (Green FinTech)",
  "Credit Fair",
  "Jan Samarth Portal Direct",
  "Other Local Bank / NBFC",
];

// Helper: Monthly EMI calculation
export const calculateEMI = (principal, annualRate = 7.0, tenureMonths = 60) => {
  const P = parseFloat(principal) || 0;
  const r = (parseFloat(annualRate) || 7) / 12 / 100;
  const n = parseInt(tenureMonths) || 60;
  if (P <= 0 || r <= 0 || n <= 0) return 0;
  const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(emi);
};

// 1. Get All Loans
export const getAllLoans = async (params = {}) => {
  const res = await api.get("/loans", { params });
  return res.data;
};

// 2. Get Loan Statistics
export const getLoanStats = async () => {
  const res = await api.get("/loans/stats");
  return res.data;
};

// 3. Get Loan by ID
export const getLoanById = async (id) => {
  const res = await api.get(`/loans/${id}`);
  return res.data;
};

// 4. Get Loan for Lead
export const getLoanByLead = async (leadId) => {
  const res = await api.get(`/loans/lead/${leadId}`);
  return res.data;
};

// 5. Get Loan for Project
export const getLoanByProject = async (projectId) => {
  const res = await api.get(`/loans/project/${projectId}`);
  return res.data;
};

// 6. Create Loan
export const createLoan = async (loanData) => {
  const res = await api.post("/loans", loanData);
  return res.data;
};

// 7. Update Loan
export const updateLoan = async (id, loanData) => {
  const res = await api.put(`/loans/${id}`, loanData);
  return res.data;
};

// 8. Delete Loan
export const deleteLoan = async (id) => {
  const res = await api.delete(`/loans/${id}`);
  return res.data;
};

// 9. Upload Loan Document
export const uploadLoanDoc = async (id, formData) => {
  const res = await api.post(`/loans/${id}/upload-doc`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

