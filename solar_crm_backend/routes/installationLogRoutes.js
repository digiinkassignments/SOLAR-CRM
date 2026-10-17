const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getLogs, createLog, updateLog, uploadPhotos } = require('../controllers/installationLogController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { clientDbMiddleware } = require('../middleware/clientDbMiddleware');

// Multer storage setup for installation photos
const uploadDir = path.join(__dirname, '../uploads/installation');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueSuffix);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, and WEBP image formats are supported.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 }, // max 10MB per file, max 5 files
});

router.use(authMiddleware, clientDbMiddleware);

router.get('/', getLogs);
router.post('/', createLog);
router.put('/:logId', updateLog);
router.post('/:logId/photos', upload.array('photos', 5), uploadPhotos);

module.exports = router;
