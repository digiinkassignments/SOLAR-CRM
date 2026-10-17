const ensureInstallationLogsTable = async (db) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS installation_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      log_date DATE NOT NULL,
      phase ENUM('Mounting Structure','Panel Installation','Electrical & Wiring','Inverter Installation','Final Testing & Safety') NOT NULL,
      work_done TEXT NOT NULL,
      workers_count INT DEFAULT 0,
      hours_worked DECIMAL(5,2) DEFAULT 0,
      materials_used TEXT DEFAULT NULL,
      issues_faced TEXT DEFAULT NULL,
      progress_percent INT DEFAULT 0,
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_deleted TINYINT(1) DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS installation_log_photos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      log_id INT NOT NULL,
      photo_url VARCHAR(255) NOT NULL,
      file_name VARCHAR(255) DEFAULT NULL,
      file_size INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_deleted TINYINT(1) DEFAULT 0,
      FOREIGN KEY (log_id) REFERENCES installation_logs(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

const getAllLogs = async (db, projectId) => {
  await ensureInstallationLogsTable(db);
  const [rows] = await db.query(
    `SELECT * FROM installation_logs WHERE project_id = ? AND is_deleted = 0 ORDER BY log_date DESC, created_at DESC`,
    [projectId]
  );

  let photosByLog = {};
  if (rows.length > 0) {
    const logIds = rows.map(r => r.id);
    const [photoRows] = await db.query(
      `SELECT * FROM installation_log_photos WHERE log_id IN (?) AND is_deleted = 0 ORDER BY id ASC`,
      [logIds]
    );
    photoRows.forEach(p => {
      if (!photosByLog[p.log_id]) photosByLog[p.log_id] = [];
      photosByLog[p.log_id].push(p);
    });
  }

  const logsWithPhotos = rows.map(r => ({
    ...r,
    photos: photosByLog[r.id] || []
  }));

  const currentProgress = rows.length > 0 ? Math.max(...rows.map(r => r.progress_percent || 0)) : 0;
  return { logs: logsWithPhotos, totalLogs: logsWithPhotos.length, currentProgress };
};

const createLog = async (db, projectId, data, userId) => {
  await ensureInstallationLogsTable(db);
  const [result] = await db.query(
    `INSERT INTO installation_logs (project_id, log_date, phase, work_done, workers_count, hours_worked, materials_used, issues_faced, progress_percent, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [projectId, data.log_date, data.phase, data.work_done, data.workers_count || 0, data.hours_worked || 0, data.materials_used || null, data.issues_faced || null, data.progress_percent || 0, userId]
  );
  return result.insertId;
};

const updateLog = async (db, logId, projectId, data) => {
  await ensureInstallationLogsTable(db);
  await db.query(
    `UPDATE installation_logs SET log_date=?, phase=?, work_done=?, workers_count=?, hours_worked=?, materials_used=?, issues_faced=?, progress_percent=?
     WHERE id=? AND project_id=? AND is_deleted=0`,
    [data.log_date, data.phase, data.work_done, data.workers_count || 0, data.hours_worked || 0, data.materials_used || null, data.issues_faced || null, data.progress_percent || 0, logId, projectId]
  );
};

const saveLogPhotos = async (db, logId, photos = []) => {
  await ensureInstallationLogsTable(db);
  for (const p of photos) {
    await db.query(
      `INSERT INTO installation_log_photos (log_id, photo_url, file_name, file_size) VALUES (?, ?, ?, ?)`,
      [logId, p.photo_url, p.file_name || null, p.file_size || null]
    );
  }
};

module.exports = {
  ensureInstallationLogsTable,
  getAllLogs,
  createLog,
  updateLog,
  saveLogPhotos
};
