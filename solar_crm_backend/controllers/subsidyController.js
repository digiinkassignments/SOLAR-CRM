const path = require("path");
const fs = require("fs");
const multer = require("multer");
const subsidyModel = require("../models/subsidyModel");
const sync = require('../services/subsidySync');
const { protect, canReadKey } = require('../middleware/subsidyAccess');
async function trackerDetails(db, key) {
  if (!/^project-\d+$/.test(String(key))) return subsidyModel.getSubsidyByLeadId(key, db);
  const projectId = Number(String(key).slice(8));
  const [[application]] = await db.query(`SELECT s.*,p.customer_name,p.customer_phone AS mobile_number,
    p.customer_address AS address,p.city,p.state,p.pincode,p.project_number,p.stage AS project_stage,
    p.system_capacity_kw,p.total_cost AS deal_amount,p.subsidy_pending_handover
    FROM subsidy_applications s JOIN projects p ON p.id=s.project_id
    WHERE p.id=? AND p.is_deleted=0 LIMIT 1`, [projectId]);
  const [documents] = await db.query('SELECT * FROM customer_documents WHERE project_id=? ORDER BY id DESC', [projectId]);
  const [rejections] = application ? await db.query('SELECT * FROM subsidy_rejection_logs WHERE subsidy_id=? ORDER BY id DESC', [application.id]) : [[]];
  const [logs] = await db.query(`SELECT id,CASE WHEN status='tracker_saved' THEN 'Subsidy Tracker updated'
    WHEN status='synced' THEN 'Automatic project sync' ELSE 'Subsidy sync requires review' END AS action_type,
    to_stage AS new_value,created_at FROM subsidy_sync_logs
    WHERE project_id=? ORDER BY id DESC LIMIT 20`, [projectId]);
  return { application, documents, rejections, logs };
}

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
  fileFilter: (req,file,cb) => {
    const accepted = {
      'application/pdf':['.pdf'], 'image/jpeg':['.jpg','.jpeg'],
      'image/png':['.png'], 'image/webp':['.webp'],
    };
    cb(accepted[file.mimetype]?.includes(path.extname(file.originalname).toLowerCase())
      ? null : new Error('Upload a PDF, JPG, PNG or WebP document.'),true);
  },
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

    const capacity = req.body.sanctioned_capacity_kw;
    if (capacity !== undefined && capacity !== null && capacity !== "" && (typeof capacity === "boolean" || !/^\d+(\.\d{1,3})?$/.test(String(capacity)) || Number(capacity) <= 0 || Number(capacity) > 9999999.999)) {
      return res.status(400).json({ success: false, message: "Sanctioned capacity must be a positive kW value with up to 3 decimal places." });
    }
    const saved = await sync.save(req.db, req.body, req.user.id, req.subsidyAccess);
    const result = await trackerDetails(req.db, lead_id);
    result.warnings = saved.warnings;
    result.can_edit = true;
    return res.status(200).json({
      success: true,
      message: "PM Surya Ghar subsidy portal application details saved successfully.",
      data: result,
    });
  } catch (error) {
    console.error("applySubsidyHandler error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : "Failed to save subsidy application.",
      error: error.message,
    });
  }
};

// 2. Get Subsidy Tracker & Customer Documents
const getSubsidyByLeadHandler = async (req, res) => {
  try {
    const { leadId } = req.params;
    if (!await canReadKey(req.db, leadId, req.subsidyAccess))
      return res.status(404).json({ success: false, message: 'Application not found.' });
    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: "leadId parameter is required.",
      });
    }

    await sync.prepare(req.db);
    const data = await trackerDetails(req.db, leadId);
    return res.status(200).json({
      success: true,
      data: protect(data, req.subsidyAccess),
    });
  } catch (error) {
    console.error("getSubsidyByLeadHandler error:", error);
    return res.status(error.status || 500).json({
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
      if(Number(req.user.role_id)===2 && !await require('../services/salesWorkflow').scopedLead(req.db,lead_id,req.user))return res.status(404).json({success:false,message:'Lead not found in your sales team.'});
      if (!lead_id || !document_type) {
        throw Object.assign(new Error('lead_id and document_type are required.'),{status:400});
      }

      const fileUrl = `/uploads/documents/${req.file.filename}`;
      let docsList;
      if (/^project-\d+$/.test(String(lead_id))) {
        const projectId = Number(String(lead_id).slice(8));
        const [[project]] = await req.db.query('SELECT id,lead_id FROM projects WHERE id=? AND is_deleted=0', [projectId]);
        if (!project) throw Object.assign(new Error('Project not found.'), {status:404});
        await req.db.query('INSERT INTO customer_documents(lead_id,project_id,document_type,file_name,file_url) VALUES (?,?,?,?,?)',
          [project.lead_id,project.id,document_type,req.file.originalname,fileUrl]);
        [docsList] = await req.db.query('SELECT * FROM customer_documents WHERE project_id=? ORDER BY id DESC',[projectId]);
      } else docsList = await subsidyModel.saveCustomerDoc(
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
      await fs.promises.unlink(req.file.path).catch(() => {});
      console.error("uploadDocHandler error:", error);
      return res.status(error.status || 500).json({
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
    if (!['pending','verified','rejected'].includes(verification_status))
      return res.status(422).json({success:false,message:'Invalid document verification status.'});

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
    return res.status(error.status || 500).json({
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

    await sync.save(req.db, { ...req.body, portal_status: 'rejected' }, req.user.id, req.subsidyAccess);
    const result = await trackerDetails(req.db, lead_id);
    return res.status(200).json({
      success: true,
      message: "Subsidy rejection logged and actionable fix task assigned.",
      data: result,
    });
  } catch (error) {
    console.error("logRejectionHandler error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : "Failed to log subsidy rejection.",
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
    return res.status(error.status || 500).json({
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
    await sync.prepare(req.db);
    const data = await subsidyModel.getAllSubsidies({ page, limit, search, status,
      readerRole: req.subsidyAccess.role_id, readerId: req.subsidyAccess.user_id }, req.db);
    return res.status(200).json({
      success: true,
      data: protect(data, req.subsidyAccess),
    });
  } catch (error) {
    console.error("getAllSubsidiesHandler error:", error);
    return res.status(error.status || 500).json({
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
