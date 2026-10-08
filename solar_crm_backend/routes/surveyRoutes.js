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
router.post("/schedule", verifyToken, scheduleSurveyHandler);
router.get("/lead/:leadId", verifyToken, getSurveyByLeadHandler);
router.get("/", verifyToken, getSurveysListHandler);
router.put("/:id/complete", verifyToken, completeSurveyHandler);
router.post("/upload-photos", verifyToken, upload.array("photos", 10), uploadPhotosHandler);

module.exports = router;
