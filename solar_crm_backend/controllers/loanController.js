const path = require("path");
const fs = require("fs");
const multer = require("multer");
const loanModel = require("../models/loanModel");
const { validateStageTransition } = require("../utils/loanWorkflow");

// Configure Multer for Loan Sanction Letters & Documents
const loanUploadDir = path.join(__dirname, "../uploads/loans");
if (!fs.existsSync(loanUploadDir)) {
  fs.mkdirSync(loanUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, loanUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `loan-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
}).single("file");

// 1. Create Loan
const createLoanHandler = async (req, res) => {
  try {
    const { lead_id } = req.body;
    if (!lead_id) {
      return res.status(400).json({ success: false, message: "lead_id is required." });
    }

    const stage = req.body.loan_stage || "Eligibility & Docs";
    const validation = validateStageTransition("Eligibility & Docs", stage, req.body);
    if (!validation.ok) return res.status(400).json({success:false, message:validation.error});
    for (const field of ["loan_amount_applied", "sanctioned_amount", "disbursed_amount", "interest_rate", "subsidy_expected", "down_payment_amount", "total_project_cost"]) {
      if (req.body[field] != null && (req.body[field] === "" || !Number.isFinite(Number(req.body[field])) || Number(req.body[field]) < 0)) return res.status(400).json({success:false, message:`Invalid ${field}.`});
    }
    if (stage !== "Disbursed" && Number(req.body.disbursed_amount) > 0) return res.status(400).json({success:false, message:"Record disbursement against the Disbursed stage."});

    const newLoan = await loanModel.createLoan(
      { ...req.body, created_by: req.user?.id },
      req.db
    );

    return res.status(201).json({
      success: true,
      message: "Solar loan application created successfully.",
      data: newLoan,
    });
  } catch (error) {
    console.error("createLoanHandler error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create solar loan application.",
      error: error.message,
    });
  }
};

// 2. Get All Loans with filters & pagination
const getAllLoansHandler = async (req, res) => {
  try {
    const { search, stage, bank, page, limit } = req.query;
    const result = await loanModel.getAllLoans(
      { search, stage, bank, page, limit },
      req.db
    );
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("getAllLoansHandler error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch solar loans.",
      error: error.message,
    });
  }
};

// 3. Get Loan Stats
const getLoanStatsHandler = async (req, res) => {
  try {
    const stats = await loanModel.getLoanStats(req.db);
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("getLoanStatsHandler error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch loan statistics.",
      error: error.message,
    });
  }
};

// 4. Get Loan By ID
const getLoanByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await loanModel.getLoanById(id, req.db);
    if (!loan) {
      return res.status(404).json({ success: false, message: "Loan application not found." });
    }
    return res.status(200).json({ success: true, data: loan });
  } catch (error) {
    console.error("getLoanByIdHandler error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch loan details.",
      error: error.message,
    });
  }
};

// 5. Get Loan by Lead ID
const getLoanByLeadHandler = async (req, res) => {
  try {
    const { leadId } = req.params;
    const loan = await loanModel.getLoanByLeadId(leadId, req.db);
    return res.status(200).json({ success: true, data: loan });
  } catch (error) {
    console.error("getLoanByLeadHandler error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch loan for lead.",
      error: error.message,
    });
  }
};

// 6. Get Loan by Project ID
const getLoanByProjectHandler = async (req, res) => {
  try {
    const { projectId } = req.params;
    const loan = await loanModel.getLoanByProjectId(projectId, req.db);
    return res.status(200).json({ success: true, data: loan });
  } catch (error) {
    console.error("getLoanByProjectHandler error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch loan for project.",
      error: error.message,
    });
  }
};

// 7. Update Loan
const updateLoanHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await loanModel.getLoanById(id, req.db);
    if (!existing) return res.status(404).json({ success:false, message:"Loan application not found." });
    const candidate = { ...existing, ...req.body };
    const financialFields = ["loan_amount_applied", "sanctioned_amount", "disbursed_amount", "interest_rate", "subsidy_expected", "down_payment_amount", "total_project_cost"];
    for (const field of financialFields) {
      if (req.body[field] != null && (req.body[field] === "" || !Number.isFinite(Number(req.body[field])) || Number(req.body[field]) < 0)) {
        return res.status(400).json({success:false, message:`Invalid ${field}: enter a non-negative number.`});
      }
    }
    if (req.body.side_status && !["Active", "Rejected", "Withdrawn"].includes(req.body.side_status)) return res.status(400).json({success:false, message:"Invalid side status."});
    if (["Rejected", "Withdrawn"].includes(req.body.side_status) && !String(req.body.rejection_reason || "").trim()) return res.status(400).json({success:false, message:"Record the rejection or withdrawal reason."});
    // Existing project receipts require reconciliation before changing lender/payment history.
    if (existing.loan_synced_to_project && ["disbursed_amount", "bank_name", "project_id"].some(field => req.body[field] != null && String(req.body[field]) !== String(existing[field]))) {
      return res.status(409).json({success:false, message:"This payment is already posted to the project. Reconcile the project receipt before changing the amount, lender or project."});
    }
    const reopening = req.body.clear_rejection === true && ["Rejected", "Withdrawn"].includes(existing.side_status) && candidate.loan_stage === "Eligibility & Docs" && String(req.body.bank_name || "").trim() && String(req.body.internal_notes || "").trim();
    if (reopening && !req.body.backward_reason) req.body.backward_reason = "New lender application after " + existing.side_status;
    const evidenceFields = ["loan_stage", "applied_date", "portal_application_no", "sanctioned_amount", "sanction_date", "sanction_letter_url", "disbursed_amount", "disbursal_date"];
    if (evidenceFields.some(field => req.body[field] !== undefined)) {
      const validation = validateStageTransition(existing.loan_stage, candidate.loan_stage, candidate);
      if (!validation.ok) return res.status(400).json({success:false, message:validation.error});
      if (validation.isBackward && !String(req.body.backward_reason || "").trim()) return res.status(400).json({success:false, message:"Record a reason for moving the loan backward."});
      if (validation.isBackward && Number(existing.disbursed_amount) > 0) return res.status(409).json({success:false, message:"A recorded disbursement must be reconciled before rolling back its stage."});
    }

    if (req.body.tenure_months != null && (!Number.isInteger(Number(req.body.tenure_months)) || Number(req.body.tenure_months) <= 0)) return res.status(400).json({success:false, message:"Tenure must be a positive number of months."});
    if (Number(candidate.disbursed_amount) > Number(candidate.sanctioned_amount)) return res.status(400).json({success:false, message:"Disbursed amount cannot exceed sanctioned amount."});
    if (["sanctioned_amount", "loan_amount_applied", "interest_rate", "tenure_months"].some(field => req.body[field] != null)) {
      req.body.monthly_emi = loanModel.calculateMonthlyEMI(Number(candidate.sanctioned_amount) || Number(candidate.loan_amount_applied), candidate.interest_rate ?? 7, candidate.tenure_months ?? 60);
    }
    const updated = await loanModel.updateLoan(id, req.body, req.db);
    return res.status(200).json({
      success: true,
      message: "Solar loan details updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("updateLoanHandler error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update loan details.",
      error: error.message,
    });
  }
};

// 8. Delete Loan
const deleteLoanHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await loanModel.deleteLoan(id, req.db);
    return res.status(200).json({
      success: true,
      message: "Solar loan application deleted successfully.",
    });
  } catch (error) {
    console.error("deleteLoanHandler error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete loan application.",
      error: error.message,
    });
  }
};

// 9. Upload Loan Document
const uploadLoanDocHandler = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No document file uploaded." });
    }

    try {
      const { id } = req.params;
      const { lead_id, doc_type } = req.body;
      const file_url = `/uploads/loans/${req.file.filename}`;

      const savedDoc = await loanModel.uploadLoanDoc(
        {
          loan_id: id,
          lead_id: lead_id || 0,
          doc_type: doc_type || "Loan Document",
          file_name: req.file.originalname,
          file_url,
        },
        req.db
      );

      // If document is Sanction Letter, also update sanction_letter_url on loan
      if (doc_type === "Sanction Letter") {
        await loanModel.updateLoan(id, { sanction_letter_url: file_url }, req.db);
      }

      return res.status(200).json({
        success: true,
        message: "Loan document uploaded successfully.",
        data: savedDoc,
      });
    } catch (dbErr) {
      console.error("uploadLoanDocHandler error:", dbErr);
      return res.status(500).json({
        success: false,
        message: "Failed to save loan document record.",
        error: dbErr.message,
      });
    }
  });
};

module.exports = {
  createLoanHandler,
  getAllLoansHandler,
  getLoanStatsHandler,
  getLoanByIdHandler,
  getLoanByLeadHandler,
  getLoanByProjectHandler,
  updateLoanHandler,
  deleteLoanHandler,
  uploadLoanDocHandler,
};

