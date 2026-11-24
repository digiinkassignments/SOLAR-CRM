const ready = new WeakMap();
async function ensure(db) {
  if (ready.has(db)) return ready.get(db);
  const work = (async () => {
    await require('../models/subsidyModel').ensureSubsidyTables(db);
    await db.query('ALTER TABLE subsidy_applications MODIFY COLUMN lead_id INT DEFAULT NULL');
    await db.query('ALTER TABLE customer_documents MODIFY COLUMN lead_id INT DEFAULT NULL');
    await db.query('ALTER TABLE subsidy_rejection_logs MODIFY COLUMN lead_id INT DEFAULT NULL');
    const additions = {
      subsidy_applications: {
        project_id: 'INT DEFAULT NULL',
        shortfall_remark: 'TEXT DEFAULT NULL',
        last_completed_stage: "VARCHAR(50) DEFAULT 'registered'",
        credited_by: 'INT DEFAULT NULL',
        credited_at: 'DATETIME DEFAULT NULL',
        reopened: 'TINYINT(1) NOT NULL DEFAULT 0',
        correction_reason: 'TEXT DEFAULT NULL',
      },
      customer_documents: { project_id: 'INT DEFAULT NULL' },
      projects: {
        subsidy_applicable: 'TINYINT(1) NOT NULL DEFAULT 1',
        subsidy_pending_handover: 'TINYINT(1) NOT NULL DEFAULT 0',
        subsidy_claim_pending_handover: 'TINYINT(1) NOT NULL DEFAULT 0',
        subsidy_legacy_manual: 'TINYINT(1) NOT NULL DEFAULT 0',
        subsidy_reopened: 'TINYINT(1) NOT NULL DEFAULT 0',
        subsidy_received_amount: 'DECIMAL(12,2) DEFAULT NULL',
        subsidy_credit_date: 'DATE DEFAULT NULL',
        subsidy_utr_number: 'VARCHAR(100) DEFAULT NULL',
        subsidy_credited_by: 'INT DEFAULT NULL',
        subsidy_credited_at: 'DATETIME DEFAULT NULL',
        warranty_anchor_date: 'DATE DEFAULT NULL',
      },
    };
    for (const [table, columns] of Object.entries(additions)) {
      const [existing] = await db.query(`SHOW COLUMNS FROM ${table}`);
      const names = new Set(existing.map((c) => c.Field));
      for (const [column, definition] of Object.entries(columns)) {
        if (!names.has(column)) {
          try {
            await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
          } catch (error) {
            if (error.code !== 'ER_DUP_FIELDNAME') throw error;
          }
        }
      }
    }
    await db.query(`CREATE TABLE IF NOT EXISTS subsidy_sync_logs (
      id BIGINT AUTO_INCREMENT PRIMARY KEY, tracker_id INT DEFAULT NULL,
      project_id INT DEFAULT NULL, actor_id INT DEFAULT NULL,
      from_stage VARCHAR(60), to_stage VARCHAR(60), status VARCHAR(30) NOT NULL,
      error_code VARCHAR(100) DEFAULT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX(project_id), INDEX(status, created_at)
    ) ENGINE=InnoDB`);
    await db.query(`CREATE TABLE IF NOT EXISTS subsidy_access_audit (
      id BIGINT AUTO_INCREMENT PRIMARY KEY, actor_id INT DEFAULT NULL,
      action VARCHAR(60) NOT NULL, resource_id INT DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);
    await db.query(`CREATE TABLE IF NOT EXISTS subsidy_sync_migrations (
      migration_key VARCHAR(100) PRIMARY KEY, applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);
    const [indexes] = await db.query('SHOW INDEX FROM subsidy_applications');
    if (!indexes.some((index) => index.Key_name === 'uq_subsidy_project')) {
      try {
        await db.query(
          'CREATE UNIQUE INDEX uq_subsidy_project ON subsidy_applications(project_id)'
        );
      } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
      }
    }
  })();
  ready.set(db, work);
  try {
    await work;
  } catch (error) {
    ready.delete(db);
    throw error;
  }
}
module.exports = { ensure };
