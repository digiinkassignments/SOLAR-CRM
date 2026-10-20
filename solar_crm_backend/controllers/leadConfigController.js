// ============================================================
// LEAD CONFIG CONTROLLER (Dynamic Lead Sources & Pipeline Stages)
// ============================================================

// ── Ensure Tables & Defaults Exist (Self-Healing) ───────────
const ensureConfigTables = async (db) => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS \`custom_lead_sources\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(100) NOT NULL UNIQUE,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`is_default\` TINYINT(1) NOT NULL DEFAULT 0,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS \`custom_lead_statuses\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(100) NOT NULL UNIQUE,
        \`color_code\` VARCHAR(20) NOT NULL DEFAULT '#1A73E8',
        \`stage_order\` INT NOT NULL DEFAULT 0,
        \`is_won\` TINYINT(1) NOT NULL DEFAULT 0,
        \`is_lost\` TINYINT(1) NOT NULL DEFAULT 0,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`is_default\` TINYINT(1) NOT NULL DEFAULT 0,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure leads columns are VARCHAR
    try {
      await db.query("ALTER TABLE `leads` MODIFY COLUMN `lead_source` VARCHAR(100) NOT NULL DEFAULT 'Other'");
      await db.query("ALTER TABLE `leads` MODIFY COLUMN `status` VARCHAR(100) NOT NULL DEFAULT 'New Lead'");
    } catch (_) {}

    // Seed defaults if empty
    const [srcCount] = await db.query("SELECT COUNT(*) as cnt FROM custom_lead_sources");
    if (srcCount[0].cnt === 0) {
      await db.query(`
        INSERT IGNORE INTO custom_lead_sources (name, is_active, is_default) VALUES
        ('Website', 1, 1), ('Call', 1, 1), ('WhatsApp', 1, 1), ('Reference', 1, 1),
        ('Facebook', 1, 1), ('Google', 1, 1), ('Cold Call', 1, 1), ('Direct', 1, 1), ('Other', 1, 1)
      `);
    }

    const [statCount] = await db.query("SELECT COUNT(*) as cnt FROM custom_lead_statuses");
    if (statCount[0].cnt === 0) {
      await db.query(`
        INSERT IGNORE INTO custom_lead_statuses (name, color_code, stage_order, is_won, is_lost, is_active, is_default) VALUES
        ('New Lead', '#1A73E8', 1, 0, 0, 1, 1),
        ('Contacted', '#0284C7', 2, 0, 0, 1, 1),
        ('Follow-up Pending', '#D97706', 3, 0, 0, 1, 1),
        ('Site Visit Scheduled', '#7C3AED', 4, 0, 0, 1, 1),
        ('Quotation Sent', '#EA580C', 5, 0, 0, 1, 1),
        ('Negotiation', '#2563EB', 6, 0, 0, 1, 1),
        ('Won', '#16A34A', 7, 1, 0, 1, 1),
        ('Lost', '#DC2626', 8, 0, 1, 1, 1),
        ('Not Interested', '#64748B', 9, 0, 1, 1, 1)
      `);
    }
  } catch (err) {
    console.error("ensureConfigTables error:", err.message);
  }
};

// ============================================================
// 1. LEAD SOURCES
// ============================================================

const getLeadSources = async (req, res) => {
  try {
    await ensureConfigTables(req.db);
    const includeInactive = req.query.include_inactive === "true";
    const sql = includeInactive
      ? "SELECT * FROM custom_lead_sources ORDER BY is_default DESC, name ASC"
      : "SELECT * FROM custom_lead_sources WHERE is_active = 1 ORDER BY is_default DESC, name ASC";
    const [rows] = await req.db.query(sql);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("getLeadSources error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

const createLeadSource = async (req, res) => {
  try {
    await ensureConfigTables(req.db);
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Source name is required." });
    }
    const cleanName = name.trim();
    const [existing] = await req.db.query("SELECT id FROM custom_lead_sources WHERE LOWER(name) = LOWER(?)", [cleanName]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "A lead source with this name already exists." });
    }

    const [result] = await req.db.query(
      "INSERT INTO custom_lead_sources (name, is_active, is_default) VALUES (?, 1, 0)",
      [cleanName]
    );
    return res.status(201).json({
      success: true,
      message: "Lead source added successfully.",
      data: { id: result.insertId, name: cleanName, is_active: 1, is_default: 0 },
    });
  } catch (err) {
    console.error("createLeadSource error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

const updateLeadSource = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_active } = req.body;

    const updates = [];
    const values = [];

    if (name !== undefined) {
      const cleanName = name.trim();
      if (!cleanName) return res.status(400).json({ success: false, message: "Source name cannot be empty." });
      updates.push("name = ?");
      values.push(cleanName);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update." });
    }

    values.push(id);
    await req.db.query(`UPDATE custom_lead_sources SET ${updates.join(", ")} WHERE id = ?`, values);

    return res.status(200).json({ success: true, message: "Lead source updated successfully." });
  } catch (err) {
    console.error("updateLeadSource error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

const deleteLeadSource = async (req, res) => {
  try {
    const { id } = req.params;
    const [sourceRows] = await req.db.query("SELECT * FROM custom_lead_sources WHERE id = ?", [id]);
    if (sourceRows.length === 0) {
      return res.status(404).json({ success: false, message: "Lead source not found." });
    }

    const sourceName = sourceRows[0].name;

    // Check if any leads currently use this source
    const [leadCount] = await req.db.query("SELECT COUNT(*) as count FROM leads WHERE lead_source = ? AND is_deleted = 0", [sourceName]);
    if (leadCount[0].count > 0) {
      // Instead of hard delete, deactivate
      await req.db.query("UPDATE custom_lead_sources SET is_active = 0 WHERE id = ?", [id]);
      return res.status(200).json({
        success: true,
        message: `Lead source is currently attached to ${leadCount[0].count} lead(s). It has been deactivated instead of deleted.`,
        deactivated: true,
      });
    }

    await req.db.query("DELETE FROM custom_lead_sources WHERE id = ?", [id]);
    return res.status(200).json({ success: true, message: "Lead source deleted successfully." });
  } catch (err) {
    console.error("deleteLeadSource error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// ============================================================
// 2. PIPELINE STATUSES
// ============================================================

const getPipelineStatuses = async (req, res) => {
  try {
    await ensureConfigTables(req.db);
    const includeInactive = req.query.include_inactive === "true";
    const sql = includeInactive
      ? "SELECT * FROM custom_lead_statuses ORDER BY stage_order ASC, id ASC"
      : "SELECT * FROM custom_lead_statuses WHERE is_active = 1 ORDER BY stage_order ASC, id ASC";
    const [rows] = await req.db.query(sql);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("getPipelineStatuses error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

const createPipelineStatus = async (req, res) => {
  try {
    await ensureConfigTables(req.db);
    const { name, color_code, is_won, is_lost } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Stage name is required." });
    }
    const cleanName = name.trim();
    const [existing] = await req.db.query("SELECT id FROM custom_lead_statuses WHERE LOWER(name) = LOWER(?)", [cleanName]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "A stage with this name already exists." });
    }

    // Get max stage_order
    const [maxOrder] = await req.db.query("SELECT COALESCE(MAX(stage_order), 0) + 1 AS next_order FROM custom_lead_statuses");
    const nextOrder = maxOrder[0].next_order;

    const [result] = await req.db.query(
      `INSERT INTO custom_lead_statuses (name, color_code, stage_order, is_won, is_lost, is_active, is_default)
       VALUES (?, ?, ?, ?, ?, 1, 0)`,
      [cleanName, color_code || "#1A73E8", nextOrder, is_won ? 1 : 0, is_lost ? 1 : 0]
    );

    return res.status(201).json({
      success: true,
      message: "Pipeline stage created successfully.",
      data: {
        id: result.insertId,
        name: cleanName,
        color_code: color_code || "#1A73E8",
        stage_order: nextOrder,
        is_won: is_won ? 1 : 0,
        is_lost: is_lost ? 1 : 0,
        is_active: 1,
      },
    });
  } catch (err) {
    console.error("createPipelineStatus error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

const updatePipelineStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color_code, is_won, is_lost, is_active, stage_order } = req.body;

    // Get current stage info before update
    const [currentRows] = await req.db.query("SELECT * FROM custom_lead_statuses WHERE id = ?", [id]);
    if (currentRows.length === 0) {
      return res.status(404).json({ success: false, message: "Pipeline stage not found." });
    }
    const oldName = currentRows[0].name;

    const updates = [];
    const values = [];

    if (name !== undefined) {
      const cleanName = name.trim();
      if (!cleanName) return res.status(400).json({ success: false, message: "Stage name cannot be empty." });
      updates.push("name = ?");
      values.push(cleanName);

      // If name is changed, update existing leads that were in this stage!
      if (oldName !== cleanName) {
        await req.db.query("UPDATE leads SET status = ? WHERE status = ?", [cleanName, oldName]);
      }
    }

    if (color_code !== undefined) {
      updates.push("color_code = ?");
      values.push(color_code);
    }
    if (is_won !== undefined) {
      updates.push("is_won = ?");
      values.push(is_won ? 1 : 0);
    }
    if (is_lost !== undefined) {
      updates.push("is_lost = ?");
      values.push(is_lost ? 1 : 0);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }
    if (stage_order !== undefined) {
      updates.push("stage_order = ?");
      values.push(stage_order);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update." });
    }

    values.push(id);
    await req.db.query(`UPDATE custom_lead_statuses SET ${updates.join(", ")} WHERE id = ?`, values);

    return res.status(200).json({ success: true, message: "Pipeline stage updated successfully." });
  } catch (err) {
    console.error("updatePipelineStatus error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

const deletePipelineStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const [statusRows] = await req.db.query("SELECT * FROM custom_lead_statuses WHERE id = ?", [id]);
    if (statusRows.length === 0) {
      return res.status(404).json({ success: false, message: "Stage not found." });
    }

    const stageName = statusRows[0].name;

    // Check if any leads currently use this status
    const [leadCount] = await req.db.query("SELECT COUNT(*) as count FROM leads WHERE status = ? AND is_deleted = 0", [stageName]);
    if (leadCount[0].count > 0) {
      // Instead of hard delete, deactivate
      await req.db.query("UPDATE custom_lead_statuses SET is_active = 0 WHERE id = ?", [id]);
      return res.status(200).json({
        success: true,
        message: `Stage '${stageName}' is currently attached to ${leadCount[0].count} lead(s). It has been deactivated instead of deleted.`,
        deactivated: true,
      });
    }

    await req.db.query("DELETE FROM custom_lead_statuses WHERE id = ?", [id]);
    return res.status(200).json({ success: true, message: "Pipeline stage deleted successfully." });
  } catch (err) {
    console.error("deletePipelineStatus error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

const reorderPipelineStatuses = async (req, res) => {
  try {
    const { orderList } = req.body; // Array of { id, stage_order }
    if (!Array.isArray(orderList)) {
      return res.status(400).json({ success: false, message: "orderList array is required." });
    }

    for (const item of orderList) {
      if (item.id && typeof item.stage_order === "number") {
        await req.db.query("UPDATE custom_lead_statuses SET stage_order = ? WHERE id = ?", [item.stage_order, item.id]);
      }
    }

    return res.status(200).json({ success: true, message: "Pipeline order updated successfully." });
  } catch (err) {
    console.error("reorderPipelineStatuses error:", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

module.exports = {
  getLeadSources,
  createLeadSource,
  updateLeadSource,
  deleteLeadSource,
  getPipelineStatuses,
  createPipelineStatus,
  updatePipelineStatus,
  deletePipelineStatus,
  reorderPipelineStatuses,
};
