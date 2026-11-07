// models/installationLogModel.js

const ensureInstallationLogsTable = async (db) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS installation_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      log_date DATE NOT NULL,
      phase VARCHAR(80) NOT NULL,
      is_phase_completed TINYINT(1) DEFAULT 0,
      work_done TEXT NOT NULL,
      workers_count INT DEFAULT 0,
      hours_worked DECIMAL(5,2) DEFAULT 0,
      supervisor_name VARCHAR(100) DEFAULT NULL,
      crew_names TEXT DEFAULT NULL,
      materials_used TEXT DEFAULT NULL,
      materials_json JSON DEFAULT NULL,
      issues_faced TEXT DEFAULT NULL,
      progress_percent INT DEFAULT 0,
      weather VARCHAR(50) DEFAULT 'Sunny / Clear',
      safety_checklist JSON DEFAULT NULL,
      supervisor_signoff TINYINT(1) DEFAULT 0,
      supervisor_signoff_time DATETIME DEFAULT NULL,
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
      caption VARCHAR(150) DEFAULT NULL,
      photo_tag VARCHAR(50) DEFAULT 'Work Progress',
      file_name VARCHAR(255) DEFAULT NULL,
      file_size INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_deleted TINYINT(1) DEFAULT 0,
      FOREIGN KEY (log_id) REFERENCES installation_logs(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  try {
    const [cols] = await db.query(`SHOW COLUMNS FROM installation_logs`);
    const existingCols = new Set(cols.map((c) => c.Field));

    if (!existingCols.has('is_phase_completed')) {
      await db.query(`ALTER TABLE installation_logs ADD COLUMN is_phase_completed TINYINT(1) DEFAULT 0`);
    }
    if (!existingCols.has('supervisor_name')) {
      await db.query(`ALTER TABLE installation_logs ADD COLUMN supervisor_name VARCHAR(100) DEFAULT NULL`);
    }
    if (!existingCols.has('crew_names')) {
      await db.query(`ALTER TABLE installation_logs ADD COLUMN crew_names TEXT DEFAULT NULL`);
    }
    if (!existingCols.has('materials_json')) {
      await db.query(`ALTER TABLE installation_logs ADD COLUMN materials_json JSON DEFAULT NULL`);
    }
    if (!existingCols.has('weather')) {
      await db.query(`ALTER TABLE installation_logs ADD COLUMN weather VARCHAR(50) DEFAULT 'Sunny / Clear'`);
    }
    if (!existingCols.has('safety_checklist')) {
      await db.query(`ALTER TABLE installation_logs ADD COLUMN safety_checklist JSON DEFAULT NULL`);
    }
    if (!existingCols.has('supervisor_signoff')) {
      await db.query(`ALTER TABLE installation_logs ADD COLUMN supervisor_signoff TINYINT(1) DEFAULT 0`);
    }
    if (!existingCols.has('supervisor_signoff_time')) {
      await db.query(`ALTER TABLE installation_logs ADD COLUMN supervisor_signoff_time DATETIME DEFAULT NULL`);
    }
    if (!existingCols.has('signature_data')) {
      await db.query(`ALTER TABLE installation_logs ADD COLUMN signature_data LONGTEXT DEFAULT NULL`);
    }
    await db.query(`ALTER TABLE installation_logs MODIFY COLUMN phase VARCHAR(80) NOT NULL`);

    const [pcols] = await db.query(`SHOW COLUMNS FROM installation_log_photos`);
    const existingPCols = new Set(pcols.map((c) => c.Field));
    if (!existingPCols.has('caption')) {
      await db.query(`ALTER TABLE installation_log_photos ADD COLUMN caption VARCHAR(150) DEFAULT NULL`);
    }
    if (!existingPCols.has('photo_tag')) {
      await db.query(`ALTER TABLE installation_log_photos ADD COLUMN photo_tag VARCHAR(50) DEFAULT 'Work Progress'`);
    }
  } catch (err) {
    // Non-fatal schema migration
  }
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

  const logsWithPhotos = rows.map(r => {
    let parsedMaterials = null;
    if (r.materials_json) {
      try {
        parsedMaterials = typeof r.materials_json === 'string' ? JSON.parse(r.materials_json) : r.materials_json;
      } catch {
        parsedMaterials = null;
      }
    }
    let parsedSafety = null;
    if (r.safety_checklist) {
      try {
        parsedSafety = typeof r.safety_checklist === 'string' ? JSON.parse(r.safety_checklist) : r.safety_checklist;
      } catch {
        parsedSafety = null;
      }
    }

    return {
      ...r,
      materials_list: parsedMaterials,
      safety_checklist: parsedSafety,
      photos: photosByLog[r.id] || []
    };
  });

  // Calculate current progress: highest progress_percent logged or 0
  const currentProgress = rows.length > 0 ? Math.max(...rows.map(r => r.progress_percent || 0)) : 0;
  
  // Calculate completed phases
  const completedPhases = rows
    .filter(r => r.is_phase_completed === 1)
    .map(r => r.phase);

  return { logs: logsWithPhotos, totalLogs: logsWithPhotos.length, currentProgress, completedPhases };
};

const toMysqlDatetime = (val) => {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

const createLog = async (db, projectId, data, userId) => {
  await ensureInstallationLogsTable(db);

  const materialsJson = data.materials_list
    ? JSON.stringify(data.materials_list)
    : (data.materials_json ? (typeof data.materials_json === 'string' ? data.materials_json : JSON.stringify(data.materials_json)) : null);

  const safetyJson = data.safety_checklist
    ? (typeof data.safety_checklist === 'string' ? data.safety_checklist : JSON.stringify(data.safety_checklist))
    : null;

  const isSignoff = data.supervisor_signoff ? 1 : 0;
  const signoffTime = isSignoff ? toMysqlDatetime(data.supervisor_signoff_time || new Date()) : null;

  const [result] = await db.query(
    `INSERT INTO installation_logs (
      project_id, log_date, phase, is_phase_completed, work_done,
      workers_count, hours_worked, supervisor_name, crew_names,
      materials_used, materials_json, issues_faced, progress_percent,
      weather, safety_checklist, supervisor_signoff, supervisor_signoff_time, signature_data, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      projectId,
      data.log_date,
      data.phase,
      data.is_phase_completed ? 1 : 0,
      data.work_done,
      data.workers_count || 0,
      data.hours_worked || 0,
      data.supervisor_name || null,
      data.crew_names || null,
      data.materials_used || null,
      materialsJson,
      data.issues_faced || null,
      data.progress_percent || 0,
      data.weather || 'Sunny / Clear',
      safetyJson,
      isSignoff,
      signoffTime,
      data.signature_data || null,
      userId
    ]
  );

  // Auto-fill project installation_start_date from this first log if project doesn't have one
  try {
    await db.query(
      `UPDATE projects SET installation_start_date = COALESCE(installation_start_date, ?) WHERE id = ?`,
      [data.log_date, projectId]
    );
  } catch (err) {
    // Non-fatal
  }

  return result.insertId;
};

const updateLog = async (db, logId, projectId, data) => {
  await ensureInstallationLogsTable(db);

  const materialsJson = data.materials_list
    ? JSON.stringify(data.materials_list)
    : (data.materials_json ? (typeof data.materials_json === 'string' ? data.materials_json : JSON.stringify(data.materials_json)) : null);

  const safetyJson = data.safety_checklist
    ? (typeof data.safety_checklist === 'string' ? data.safety_checklist : JSON.stringify(data.safety_checklist))
    : null;

  const isSignoff = data.supervisor_signoff ? 1 : 0;
  const signoffTime = isSignoff ? toMysqlDatetime(data.supervisor_signoff_time || new Date()) : null;

  await db.query(
    `UPDATE installation_logs SET
      log_date = ?,
      phase = ?,
      is_phase_completed = ?,
      work_done = ?,
      workers_count = ?,
      hours_worked = ?,
      supervisor_name = ?,
      crew_names = ?,
      materials_used = ?,
      materials_json = ?,
      issues_faced = ?,
      progress_percent = ?,
      weather = ?,
      safety_checklist = ?,
      supervisor_signoff = ?,
      supervisor_signoff_time = ?,
      signature_data = COALESCE(?, signature_data)
     WHERE id = ? AND project_id = ? AND is_deleted = 0`,
    [
      data.log_date,
      data.phase,
      data.is_phase_completed ? 1 : 0,
      data.work_done,
      data.workers_count || 0,
      data.hours_worked || 0,
      data.supervisor_name || null,
      data.crew_names || null,
      data.materials_used || null,
      materialsJson,
      data.issues_faced || null,
      data.progress_percent || 0,
      data.weather || 'Sunny / Clear',
      safetyJson,
      isSignoff,
      signoffTime,
      data.signature_data !== undefined ? data.signature_data : null,
      logId,
      projectId
    ]
  );
};

const saveLogPhotos = async (db, logId, photos = []) => {
  await ensureInstallationLogsTable(db);
  for (const p of photos) {
    await db.query(
      `INSERT INTO installation_log_photos (log_id, photo_url, caption, photo_tag, file_name, file_size) VALUES (?, ?, ?, ?, ?, ?)`,
      [logId, p.photo_url, p.caption || null, p.photo_tag || 'Work Progress', p.file_name || null, p.file_size || null]
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
