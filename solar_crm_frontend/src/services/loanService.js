import api from "../api/axios";

// Standard Solar Loan Stages & Configurations
export const LOAN_STAGES = [
  "Eligibility Check",
  "Docs Pending",
  "Applied / Logged",
  "Bank FI & Verification",
  "Sanctioned",
  "Disbursed",
  "Subsidy Adjusted",
  "Rejected",
];

export const LOAN_STAGE_CONFIG = {
  "Eligibility Check": {
    label: "Eligibility Check",
    color: "#6366F1",
    bg: "#EEF2FF",
    border: "#C7D2FE",
    percent: 15,
  },
  "Docs Pending": {
    label: "Docs Pending",
    color: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FDE68A",
    percent: 30,
  },
  "Applied / Logged": {
    label: "Applied / Logged",
    color: "#0284C7",
    bg: "#F0F9FF",
    border: "#BAE6FD",
    percent: 50,
  },
  "Bank FI & Verification": {
    label: "Bank FI & Verification",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    percent: 65,
  },
  "Sanctioned": {
    label: "Sanctioned",
    color: "#16A34A",
    bg: "#DCFCE7",
    border: "#86EFAC",
    percent: 85,
  },
  "Disbursed": {
    label: "Disbursed",
    color: "#059669",
    bg: "#D1FAE5",
    border: "#6EE7B7",
    percent: 100,
  },
  "Subsidy Adjusted": {
    label: "Subsidy Adjusted",
    color: "#0D9488",
    bg: "#CCFBF1",
    border: "#99F6E4",
    percent: 100,
  },
  "Rejected": {
    label: "Rejected",
    color: "#DC2626",
    bg: "#FEE2E2",
    border: "#FCA5A5",
    percent: 0,
  },
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
