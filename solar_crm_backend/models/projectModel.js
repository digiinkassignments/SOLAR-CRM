const crypto = require("crypto");
const dbConfig = require("../config/db");
const defaultDb = dbConfig.db || dbConfig.defaultDb;

// Auto-ensure projects and project_stage_logs tables exist (per-tenant DB tracking)
const ensuredDbs = new Set();

const ensureProjectTables = async (db = defaultDb) => {
  try {
    const dbKey = db?.config?.database || db?.pool?.config?.connectionConfig?.database || "default";
    if (ensuredDbs.has(dbKey)) return;

    await db.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        project_number VARCHAR(30) NOT NULL UNIQUE,
        lead_id INT(11) DEFAULT NULL,
        quotation_id INT(11) DEFAULT NULL,
        customer_name VARCHAR(150) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_address TEXT DEFAULT NULL,
        city VARCHAR(100) DEFAULT NULL,
        state VARCHAR(100) DEFAULT NULL,
        pincode VARCHAR(20) DEFAULT NULL,
        system_capacity_kw DECIMAL(6,2) NOT NULL,
        panel_count INT(11) DEFAULT NULL,
        inverter_kw DECIMAL(6,2) DEFAULT NULL,
        stage VARCHAR(60) NOT NULL DEFAULT 'Order Closed',
        stage_updated_at TIMESTAMP NULL DEFAULT NULL,
        assigned_to INT(11) DEFAULT NULL,
        assigned_by INT(11) DEFAULT NULL,
        installation_start_date DATE DEFAULT NULL,
        installation_end_date DATE DEFAULT NULL,
        completion_date DATE DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        is_deleted TINYINT(1) NOT NULL DEFAULT 0,
        created_by INT(11) DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_project_lead (lead_id),
        KEY idx_project_quotation (quotation_id),
        KEY idx_project_stage (stage),
        KEY idx_project_assigned_to (assigned_to),
        KEY idx_project_is_deleted (is_deleted)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure stage column is VARCHAR(60) so it supports the new stages smoothly
    try {
      await db.query(`ALTER TABLE projects MODIFY COLUMN stage VARCHAR(60) NOT NULL DEFAULT 'Order Closed'`);
    } catch (e) {}

    await db.query(`
      CREATE TABLE IF NOT EXISTS project_stage_logs (
        id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        project_id INT(11) NOT NULL,
        from_stage VARCHAR(60) DEFAULT NULL,
        to_stage VARCHAR(60) NOT NULL,
        changed_by INT(11) DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_stage_log_project (project_id),
        KEY idx_stage_log_changed_by (changed_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    ensuredDbs.add(dbKey);
  } catch (err) {
    console.error("ensureProjectTables error:", err.message);
  }
};

// Auto-run on module load
ensureProjectTables().catch(() => {});

/**
 * 1. Get All Projects with dynamic filters, pagination & assigned user name
 */
const getAllProjects = async (db = defaultDb, { stage, assigned_to, search, page = 1, limit = 15 } = {}) => {
  await ensureProjectTables(db);

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 15);
  const offset = (pageNum - 1) * limitNum;

  const whereConditions = ["p.is_deleted = 0"];
  const params = [];

  if (stage && stage !== "All") {
    whereConditions.push("p.stage = ?");
    params.push(stage);
  }

  if (assigned_to && assigned_to !== "All") {
    whereConditions.push("p.assigned_to = ?");
    params.push(Number(assigned_to));
  }

  if (search && search.trim() !== "") {
    const term = `%${search.trim()}%`;
    whereConditions.push("(p.project_number LIKE ? OR p.customer_name LIKE ? OR p.customer_phone LIKE ? OR p.city LIKE ?)");
    params.push(term, term, term, term);
  }

  const whereSql = whereConditions.join(" AND ");

  // Count total matching records
  const countSql = `SELECT COUNT(*) AS total FROM projects p WHERE ${whereSql}`;
  const [countRows] = await db.query(countSql, params);
  const total = countRows[0]?.total || 0;

  // Fetch paginated projects with JOIN on users for assigned_to_name
  const selectSql = `
    SELECT 
      p.*,
      u.full_name AS assigned_to_name,
      ab.full_name AS assigned_by_name,
      cb.full_name AS created_by_name
    FROM projects p
    LEFT JOIN users u ON p.assigned_to = u.id
    LEFT JOIN users ab ON p.assigned_by = ab.id
    LEFT JOIN users cb ON p.created_by = cb.id
    WHERE ${whereSql}
    ORDER BY p.id DESC
    LIMIT ? OFFSET ?
  `;

  const [projects] = await db.query(selectSql, [...params, limitNum, offset]);

  return {
    projects,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
};

/**
 * 2. Get Project By ID with assigned user name & stage logs
 */
const getProjectById = async (db = defaultDb, id) => {
  await ensureProjectTables(db);

  const sql = `
    SELECT 
      p.*,
      u.full_name AS assigned_to_name,
      ab.full_name AS assigned_by_name,
      cb.full_name AS created_by_name
    FROM projects p
    LEFT JOIN users u ON p.assigned_to = u.id
    LEFT JOIN users ab ON p.assigned_by = ab.id
    LEFT JOIN users cb ON p.created_by = cb.id
    WHERE (p.id = ? OR p.project_uuid = ? OR p.project_number = ?) AND p.is_deleted = 0
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [id, id, id]);
  if (!rows || rows.length === 0) return null;

  const project = rows[0];

  // Fetch stage logs with user name
  const logsSql = `
    SELECT 
      psl.*, 
      COALESCE(u.full_name, u.username) AS changed_by_name,
      COALESCE(u.full_name, u.username) AS name
    FROM project_stage_logs psl 
    LEFT JOIN users u ON psl.changed_by = u.id 
    WHERE psl.project_id = ? 
    ORDER BY psl.created_at DESC
  `;
  const [stage_logs] = await db.query(logsSql, [project.id]);
  project.stage_logs = stage_logs || [];

  return project;
};

/**
 * 3. Create Project & return insertId
 */
const createProject = async (db = defaultDb, data, created_by = null) => {
  await ensureProjectTables(db);

  const projectNumber =
    data.project_number ||
    "PROJ-" + new Date().getFullYear() + "-" + Math.floor(10000 + Math.random() * 90000);

  const projectUuid = data.project_uuid || `PRJ-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

  const initialStage = data.stage || "Order Closed";

  const totalCost = data.total_cost !== undefined && data.total_cost !== "" ? parseFloat(data.total_cost) : 0;
  const amountReceived = data.amount_received !== undefined && data.amount_received !== "" ? parseFloat(data.amount_received) : 0;
  let paymentStatus = data.payment_status || "Pending";
  if (totalCost > 0) {
    if (amountReceived >= totalCost) {
      paymentStatus = "Paid";
    } else if (amountReceived > 0) {
      paymentStatus = "Partially Paid";
    } else {
      paymentStatus = "Pending";
    }
  }

  const sql = `
    INSERT INTO projects (
      project_number,
      project_uuid,
      lead_id,
      quotation_id,
      customer_name,
      customer_phone,
      customer_address,
      city,
      state,
      pincode,
      system_capacity_kw,
      panel_count,
      inverter_kw,
      total_cost,
      amount_received,
      payment_status,
      stage,
      stage_updated_at,
      assigned_to,
      assigned_by,
      installation_start_date,
      installation_end_date,
      completion_date,
      notes,
      created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    projectNumber,
    projectUuid,
    data.lead_id || null,
    data.quotation_id || null,
    data.customer_name,
    data.customer_phone,
    data.customer_address || null,
    data.city || null,
    data.state || null,
    data.pincode || null,
    parseFloat(data.system_capacity_kw) || 1.0,
    data.panel_count ? parseInt(data.panel_count, 10) : null,
    data.inverter_kw ? parseFloat(data.inverter_kw) : null,
    totalCost,
    amountReceived,
    paymentStatus,
    initialStage,
    data.assigned_to || null,
    data.assigned_by || created_by || null,
    data.installation_start_date || null,
    data.installation_end_date || null,
    data.completion_date || null,
    data.notes || null,
    created_by || null,
  ];

  const [result] = await db.query(sql, values);
  const insertId = result.insertId;

  // Insert initial stage log
  try {
    await db.query(
      `INSERT INTO project_stage_logs (project_id, from_stage, to_stage, changed_by, notes)
       VALUES (?, NULL, ?, ?, ?)`,
      [insertId, initialStage, created_by, data.notes || "Initial project creation"]
    );
  } catch (logErr) {
    console.warn("Could not record initial project stage log:", logErr.message);
  }

  return insertId;
};

/**
 * 4. Update Project Stage and record log
 */
const updateProjectStage = async (db = defaultDb, projectId, newStage, changedBy = null, notes = null) => {
  await ensureProjectTables(db);

  // Get current stage first
  const [rows] = await db.query(
    `SELECT stage FROM projects WHERE id = ? AND is_deleted = 0 LIMIT 1`,
    [projectId]
  );

  if (!rows || rows.length === 0) {
    throw new Error("Project not found or has been deleted.");
  }

  const fromStage = rows[0].stage;

  // Update projects table
  await db.query(
    `UPDATE projects SET stage = ?, stage_updated_at = NOW() WHERE id = ?`,
    [newStage, projectId]
  );

  // Insert into project_stage_logs
  await db.query(
    `INSERT INTO project_stage_logs (project_id, from_stage, to_stage, changed_by, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [projectId, fromStage, newStage, changedBy, notes || null]
  );

  return {
    success: true,
    project_id: projectId,
    from_stage: fromStage,
    to_stage: newStage,
    changed_by: changedBy,
    notes,
  };
};

/**
 * 5. Dynamic Update Project (only provided fields)
 */
const updateProject = async (db = defaultDb, id, data) => {
  await ensureProjectTables(db);

  const allowedFields = [
    "lead_id",
    "quotation_id",
    "customer_name",
    "customer_phone",
    "customer_address",
    "city",
    "state",
    "pincode",
    "system_capacity_kw",
    "panel_count",
    "inverter_kw",
    "total_cost",
    "amount_received",
    "payment_status",
    "stage",
    "assigned_to",
    "assigned_by",
    "installation_start_date",
    "installation_end_date",
    "completion_date",
    "notes",
  ];

  const updates = [];
  const values = [];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(data[field]);
    }
  }

  if (updates.length === 0) {
    return false;
  }

  if (data.stage !== undefined) {
    updates.push("stage_updated_at = NOW()");
  }

  values.push(id);
  const sql = `UPDATE projects SET ${updates.join(", ")} WHERE id = ? AND is_deleted = 0`;
  const [result] = await db.query(sql, values);
  return result.affectedRows > 0;
};

/**
 * 6. Soft Delete Project
 */
const softDeleteProject = async (db = defaultDb, id) => {
  await ensureProjectTables(db);
  const [result] = await db.query(
    `UPDATE projects SET is_deleted = 1 WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
};

/**
 * 7. Get Project Stage Statistics
 */
const getProjectStats = async (db = defaultDb) => {
  await ensureProjectTables(db);
  const [rows] = await db.query(
    `SELECT stage, COUNT(*) AS count 
     FROM projects 
     WHERE is_deleted = 0 
     GROUP BY stage`
  );
  return rows;
};

module.exports = {
  ensureProjectTables,
  getAllProjects,
  getProjectById,
  createProject,
  updateProjectStage,
  updateProject,
  softDeleteProject,
  getProjectStats,
};
