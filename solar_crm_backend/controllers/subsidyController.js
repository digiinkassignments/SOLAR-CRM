const path = require("path");
const fs = require("fs");
const multer = require("multer");
const subsidyModel = require("../models/subsidyModel");

// Configure Multer for Customer KYC Documents
const docUploadDir = path.join(__dirname, "../uploads/documents");
if (!fs.existsSync(docUploadDir)) {
  fs.mkdirSync(docUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, docUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
}).single("document");

// 1. Create or Update Subsidy Application
const applySubsidyHandler = async (req, res) => {
  try {
    const { lead_id, consumer_number } = req.body;
    if (!lead_id) {
      return res.status(400).json({
        success: false,
        message: "lead_id is required.",
      });
    }

    const result = await subsidyModel.applySubsidy(req.body, req.db);
    return res.status(200).json({
      success: true,
      message: "PM Surya Ghar subsidy portal application details saved successfully.",
      data: result,
    });
  } catch (error) {
    console.error("applySubsidyHandler error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save subsidy application.",
      error: error.message,
    });
  }
};

// 2. Get Subsidy Tracker & Customer Documents
const getSubsidyByLeadHandler = async (req, res) => {
  try {
    const { leadId } = req.params;
    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: "leadId parameter is required.",
      });
    }

    const data = await subsidyModel.getSubsidyByLeadId(leadId, req.db);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("getSubsidyByLeadHandler error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subsidy details.",
      error: error.message,
    });
  }
};

// 3. Upload Customer Document
const uploadDocHandler = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Doc upload error:", err);
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No document file uploaded." });
    }

    try {
      const { lead_id, document_type } = req.body;
      if (!lead_id || !document_type) {
        return res.status(400).json({
          success: false,
          message: "lead_id and document_type are required.",
        });
      }

      const fileUrl = `/uploads/documents/${req.file.filename}`;
      const docsList = await subsidyModel.saveCustomerDoc(
        {
          lead_id,
          document_type,
          file_name: req.file.originalname,
          file_url: fileUrl,
        },
        req.db
      );

      return res.status(200).json({
        success: true,
        message: "Document uploaded successfully.",
        data: docsList,
      });
    } catch (error) {
      console.error("uploadDocHandler error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to process document upload.",
        error: error.message,
      });
    }
  });
};

// 4. Verify / Reject Document Status
const verifyDocHandler = async (req, res) => {
  try {
    const { docId } = req.params;
    const { verification_status, rejection_reason } = req.body;

    if (!docId || !verification_status) {
      return res.status(400).json({
        success: false,
        message: "docId and verification_status are required.",
      });
    }

    const updatedDoc = await subsidyModel.updateDocVerification(
      docId,
      verification_status,
      rejection_reason,
      req.db
    );

    return res.status(200).json({
      success: true,
      message: `Document status updated to ${verification_status}.`,
      data: updatedDoc,
    });
  } catch (error) {
    console.error("verifyDocHandler error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update document status.",
      error: error.message,
    });
  }
};

// 5. Log Subsidy Rejection & Create Fix Task
const logRejectionHandler = async (req, res) => {
  try {
    const { lead_id, stage_at_rejection, rejection_category, rejection_reason, fix_task } = req.body;
    if (!lead_id || !rejection_category || !rejection_reason) {
      return res.status(400).json({
        success: false,
        message: "lead_id, rejection_category, and rejection_reason are required.",
      });
    }

    const result = await subsidyModel.logSubsidyRejection(req.body, req.db);
    return res.status(200).json({
      success: true,
      message: "Subsidy rejection logged and actionable fix task assigned.",
      data: result,
    });
  } catch (error) {
    console.error("logRejectionHandler error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to log subsidy rejection.",
      error: error.message,
    });
  }
};

// 6. Resolve Fix Task
const resolveFixTaskHandler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Rejection log ID required." });
    }

    const result = await subsidyModel.resolveRejectionFixTask(id, req.db);
    return res.status(200).json({
      success: true,
      message: "Rejection fix task marked as resolved.",
      data: result,
    });
  } catch (error) {
    console.error("resolveFixTaskHandler error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resolve rejection task.",
      error: error.message,
    });
  }
};

// 7. Get All Subsidies List
const getAllSubsidiesHandler = async (req, res) => {
  try {
    const { page, limit, search, status } = req.query;
    const data = await subsidyModel.getAllSubsidies({ page, limit, search, status }, req.db);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("getAllSubsidiesHandler error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subsidy projects list.",
      error: error.message,
    });
  }
};

module.exports = {
  applySubsidyHandler,
  getSubsidyByLeadHandler,
  uploadDocHandler,
  verifyDocHandler,
  logRejectionHandler,
  resolveFixTaskHandler,
  getAllSubsidiesHandler,
};
