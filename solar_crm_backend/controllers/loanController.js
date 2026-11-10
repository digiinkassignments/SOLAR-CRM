const path = require("path");
const fs = require("fs");
const multer = require("multer");
const loanModel = require("../models/loanModel");

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
