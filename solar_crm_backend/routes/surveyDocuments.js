const router = require('express').Router();
const multer = require('multer');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const root = path.resolve(__dirname, '../private/survey-documents');
const categories = ['aadhaar', 'electricity_bill', 'site_photo', 'bank_passbook'];
const ready = new WeakSet();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 } }).single('file');
const wrap = fn => async (req, res) => {
  try { await fn(req, res); } catch (error) {
    if (!error.status) console.error('Survey document error:', error.message);
    res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Could not process the survey document. Please retry.' });
  }
};
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
async function access(req) {
  if (![1, 2, 3, 4].includes(Number(req.user.role_id))) fail('Access denied.', 403);
  if (!/^\d+$/.test(req.params.surveyId)) fail('Survey not found.', 404);
  const [[survey]] = await req.db.query('SELECT id,lead_id,assigned_engineer_id FROM site_surveys WHERE id=?', [req.params.surveyId]);
  if (!survey) fail('Survey not found.', 404);
  if (Number(req.user.role_id) === 4) {
    if (Number(survey.assigned_engineer_id) !== Number(req.user.id)) fail('Survey not found.', 404);
  } else if (!await require('../models/leadModel').isLeadAccessibleByUser(survey.lead_id, req.user.role_id, req.user.id, req.db)) fail('Survey not found.', 404);
  if (!ready.has(req.db)) {
    await req.db.query(`CREATE TABLE IF NOT EXISTS survey_documents (
      id INT AUTO_INCREMENT PRIMARY KEY, survey_id INT NOT NULL, category VARCHAR(30) NOT NULL,
      stored_name VARCHAR(80) NOT NULL, original_name VARCHAR(255) NOT NULL, mime VARCHAR(80) NOT NULL,
      size_bytes INT NOT NULL, uploaded_by INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_survey_documents (survey_id)
    ) ENGINE=InnoDB`);
    ready.add(req.db);
  }
  const tenant = Number(req.clientInfo?.id || req.user.client_id);
  if (!Number.isSafeInteger(tenant) || tenant <= 0) fail('Sign in to your company again.', 403);
  return path.join(root, String(tenant));
}
function fileType(buffer) {
  if (buffer.subarray(0, 5).toString() === '%PDF-') return ['pdf', 'application/pdf'];
  if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return ['jpg', 'image/jpeg'];
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return ['png', 'image/png'];
  if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return ['webp', 'image/webp'];
  return null;
}
router.get('/:surveyId/documents', wrap(async (req, res) => {
  await access(req);
  const [rows] = await req.db.query('SELECT id,category,original_name,mime,size_bytes,created_at FROM survey_documents WHERE survey_id=? ORDER BY id DESC', [req.params.surveyId]);
  res.json({ success: true, data: rows });
}));
router.post('/:surveyId/documents', wrap(async (req, res) => {
  const directory = await access(req);
  upload(req, res, async error => {
    if (error) return res.status(400).json({ success: false, message: 'Choose one file up to 8 MB.' });
    let storedPath;
    try {
      if (!categories.includes(req.body.category)) fail('Choose a document category.');
      if (!req.file) fail('Choose a photo or PDF.');
      const type = fileType(req.file.buffer);
      if (!type || req.body.category === 'site_photo' && type[0] === 'pdf') fail('Use a JPG, PNG or WebP photo; documents also accept PDF.');
      const [[count]] = await req.db.query('SELECT COUNT(*) AS total FROM survey_documents WHERE survey_id=?', [req.params.surveyId]);
      if (count.total >= 40) fail('A survey can contain up to 40 documents.');
      const stored = crypto.randomUUID() + '.' + type[0];
      await fs.mkdir(directory, { recursive: true, mode: 0o700 });
      storedPath = path.join(directory, stored);
      await fs.writeFile(storedPath, req.file.buffer, { flag: 'wx', mode: 0o600 });
      const [result] = await req.db.query('INSERT INTO survey_documents(survey_id,category,stored_name,original_name,mime,size_bytes,uploaded_by) VALUES (?,?,?,?,?,?,?)', [req.params.surveyId, req.body.category, stored, path.basename(req.file.originalname).replace(/[\r\n]/g, '').slice(0, 255), type[1], req.file.size, req.user.id]);
      res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Document saved.' });
    } catch (e) {
      if (storedPath) await fs.unlink(storedPath).catch(() => {});
      res.status(e.status || 500).json({ success: false, message: e.status ? e.message : 'Document upload failed. Please retry.' });
    }
  });
}));
router.get('/:surveyId/documents/:documentId', wrap(async (req, res) => {
  const directory = await access(req);
  const [[file]] = await req.db.query('SELECT * FROM survey_documents WHERE id=? AND survey_id=?', [req.params.documentId, req.params.surveyId]);
  if (!file || !/^[a-f0-9-]+\.(pdf|jpg|png|webp)$/.test(file.stored_name)) fail('Document not found.', 404);
  res.set({ 'Content-Type': file.mime, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
  res.download(path.join(directory, file.stored_name), file.original_name, error => {
    if (error && !res.headersSent) res.status(404).json({ message: 'Document file not found.' });
  });
}));
module.exports = router;
module.exports.fileType = fileType;
