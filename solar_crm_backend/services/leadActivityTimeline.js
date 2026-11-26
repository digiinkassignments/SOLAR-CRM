const ensured = new WeakSet();

async function ensure(db) {
  if (ensured.has(db)) return;
  // The legacy activity table is retained so existing history remains visible.
  // These additive columns make the history extensible without breaking old tenants.
  const statements = [
    "ALTER TABLE lead_activity_logs MODIFY action_type VARCHAR(80) NOT NULL",
    "ALTER TABLE lead_activity_logs ADD COLUMN visibility VARCHAR(20) NOT NULL DEFAULT 'all'",
    "ALTER TABLE lead_activity_logs ADD COLUMN related_type VARCHAR(40) NULL",
    "ALTER TABLE lead_activity_logs ADD COLUMN related_id BIGINT NULL",
    "ALTER TABLE lead_activity_logs ADD COLUMN metadata JSON NULL",
    "ALTER TABLE lead_activity_logs ADD COLUMN editable_until DATETIME NULL",
    "ALTER TABLE lead_activity_logs ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0",
  ];
  for (const sql of statements) {
    try { await db.query(sql); } catch (err) {
      if (!['ER_DUP_FIELDNAME', 'ER_DUP_COLUMN', 'ER_NO_SUCH_TABLE'].includes(err.code)) throw err;
    }
  }
  try { await db.query('ALTER TABLE lead_activity_logs ADD KEY idx_lead_activity_timeline (lead_id, created_at, is_deleted)'); } catch (_) {}
  ensured.add(db);
}

async function record(db, { leadId, eventType, text, actorId = null, oldValue = null, newValue = null,
  visibility = 'all', relatedType = null, relatedId = null, metadata = null, editableUntil = null }) {
  await ensure(db);
  await db.query(`INSERT INTO lead_activity_logs
    (lead_id, action_type, old_value, new_value, remark, performed_by, visibility, related_type, related_id, metadata, editable_until)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    leadId, String(eventType).slice(0, 80), oldValue, newValue, text, actorId,
    visibility === 'internal' ? 'internal' : 'all', relatedType, relatedId,
    metadata ? JSON.stringify(metadata) : null, editableUntil,
  ]);
}

async function timeline(db, leadId, { roleId = 1, page = 1, limit = 20, filter = 'all' } = {}) {
  await ensure(db);
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (safePage - 1) * safeLimit;
  const args = [leadId];
  const where = ['l.lead_id=?', 'l.is_deleted=0'];
  if (Number(roleId) === 4) {
    where.push("l.visibility='all'");
    where.push("(l.action_type LIKE '%Survey%' OR l.action_type LIKE '%Follow-up%' OR l.action_type IN ('Lead Assigned','Lead Reassigned','Status Changed','Lead Created'))");
  }
  const filterMap = {
    calls: "(l.action_type LIKE '%Call%' OR (l.action_type='Follow-up Added' AND JSON_UNQUOTE(JSON_EXTRACT(l.metadata,'$.followup_type')) IN ('Call','Phone Call','WhatsApp','Meeting')))",
    survey: "l.action_type LIKE '%Survey%' OR l.action_type LIKE '%Site Visit%'",
    status: "l.action_type LIKE '%Status%' OR l.action_type='Lead Closed'",
    quotation: "l.action_type LIKE '%Quotation%'",
    notes: "(l.action_type='Manual Remark' OR (l.action_type='Follow-up Added' AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(l.metadata,'$.followup_type')),'Note')='Note'))",
  };
  if (filterMap[filter]) where.push(`(${filterMap[filter]})`);
  const base = `FROM lead_activity_logs l LEFT JOIN users u ON u.id=l.performed_by WHERE ${where.join(' AND ')}`;
  const [[count]] = await db.query(`SELECT COUNT(*) AS total ${base}`, args);
  const [rows] = await db.query(`SELECT l.id, l.lead_id,
    CASE WHEN l.action_type='Follow-up Added' THEN COALESCE(JSON_UNQUOTE(JSON_EXTRACT(l.metadata,'$.followup_type')),l.action_type) ELSE l.action_type END AS event_type,
    l.old_value, l.new_value, l.remark AS text, l.performed_by AS actor_id,
    COALESCE(u.full_name,'System') AS actor_name, l.visibility, l.related_type,
    l.related_id, l.metadata, l.editable_until, l.created_at
    ${base} ORDER BY l.created_at DESC, l.id DESC LIMIT ? OFFSET ?`, [...args, safeLimit, offset]);
  return { total: Number(count.total || 0), page: safePage, limit: safeLimit, data: rows };
}

module.exports = { ensure, record, timeline };
