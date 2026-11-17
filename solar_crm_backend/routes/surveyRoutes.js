const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { verifyToken } = require("../middleware/authMiddleware");
const {
  scheduleSurveyHandler,
  getSurveyByLeadHandler,
  getSurveysListHandler,
  completeSurveyHandler,
  uploadPhotosHandler,
  approveSurveyToProjectHandler,
} = require("../controllers/surveyController");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads/surveys");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `survey_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
});

// Routes
router.use(verifyToken, (req, res, next) => {
  if (req.clientInfo?.id && req.user?.client_id && Number(req.user.client_id) !== Number(req.clientInfo.id)) return res.status(403).json({ success: false, message: 'Sign in to this company again.' });
  next();
});
router.get("/engineers", verifyToken, async (req, res) => {
  if (![1, 2, 3, 4].includes(Number(req.user.role_id))) return res.sendStatus(403);
  try {
    const [rows] = await req.db.query(`
      SELECT u.id, u.full_name, u.role_id, r.role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.role_id = 4 AND u.is_deleted = 0 AND (LOWER(u.status) = 'active') 
      ORDER BY u.full_name ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("fetch engineers error:", err);
    res.sendStatus(503);
  }
});
router.get('/availability', verifyToken, async (req, res) => {
  if (![1, 2, 3, 4].includes(Number(req.user.role_id))) return res.sendStatus(403);
  const b = require('../services/surveyBooking');
  if (!require('../services/field/definitions').validDate(req.query.date) || !/^\d+$/.test(req.query.engineer_id || '')) {
    return res.status(400).json({ message: 'Choose surveyor and date.' });
  }
  try {
    let exclude = 0;
    if (req.query.lead_id && await require('../models/leadModel').isLeadAccessibleByUser(req.query.lead_id, req.user.role_id, req.user.id, req.db)) {
      exclude = Number(req.query.lead_id);
    }
    const [rows] = await req.db.query(
      "SELECT scheduled_time FROM site_surveys WHERE assigned_engineer_id=? AND scheduled_date=? AND status IN ('scheduled','completed') AND lead_id<>?",
      [req.query.engineer_id, req.query.date, exclude]
    );
    res.json({ success: true, data: { booked_times: [...new Set(rows.map(r => b.time(r.scheduled_time)).filter(Boolean))] } });
  } catch (err) {
    console.error("availability check error:", err);
    res.sendStatus(503);
  }
});
router.use(require("./surveyDocuments"));
router.post("/schedule", verifyToken, scheduleSurveyHandler);
router.get("/lead/:leadId", verifyToken, getSurveyByLeadHandler);
router.get("/", verifyToken, getSurveysListHandler);
router.post("/:id/approve-to-project", verifyToken, approveSurveyToProjectHandler);
router.post("/lead/:leadId/approve-to-project", verifyToken, approveSurveyToProjectHandler);
router.put("/:id/complete", verifyToken, completeSurveyHandler);
router.post("/upload-photos", verifyToken, upload.array("photos", 10), uploadPhotosHandler);

module.exports = router;
