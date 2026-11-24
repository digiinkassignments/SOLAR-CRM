const sync = require('./subsidySync');
async function report(db) {
  await sync.prepare(db);
  const [rows] = await db.query(`SELECT p.id AS project_id,p.project_number,p.stage,
    s.id AS tracker_id,s.portal_status,
    CASE WHEN p.stage IN ('Subsidy Received','Warranty Period') AND COALESCE(s.portal_status,'')<>'subsidy_credited'
      THEN 'manual_received_without_credit'
      WHEN s.portal_status='subsidy_credited' AND p.stage NOT IN ('Subsidy Received','Warranty Period')
      THEN 'credited_not_synced' ELSE 'legacy_stage_mapping' END AS issue
    FROM projects p LEFT JOIN subsidy_applications s ON s.project_id=p.id
    WHERE p.is_deleted=0 AND (p.stage IN ('Subsidy Applied','Subsidy Received','Handover Done','Warranty Period')
      OR s.portal_status='subsidy_credited') ORDER BY p.id`);
  const [ambiguous] = await db.query(`SELECT s.id AS tracker_id,s.lead_id,COUNT(p.id) AS projects
    FROM subsidy_applications s JOIN projects p ON p.lead_id=s.lead_id AND p.is_deleted=0
    WHERE s.project_id IS NULL GROUP BY s.id,s.lead_id HAVING COUNT(p.id)>1`);
  let legacy = [];
  try {
    [legacy] =
      await db.query(`SELECT b.project_id,p.project_number,b.stage AS legacy_stage,p.stage AS current_stage,
      s.portal_status FROM subsidy_legacy_stage_backup b JOIN projects p ON p.id=b.project_id
      LEFT JOIN subsidy_applications s ON s.project_id=p.id WHERE p.is_deleted=0
      AND b.stage IN ('Subsidy Received','Handover Done','Warranty Period')
      AND COALESCE(s.portal_status,'')<>'subsidy_credited' ORDER BY b.project_id`);
  } catch (error) {
    if (error.code !== 'ER_NO_SUCH_TABLE') throw error;
  }
  const [failures] =
    await db.query(`SELECT project_id,tracker_id,error_code,created_at FROM subsidy_sync_logs
    WHERE status='failed' ORDER BY id DESC LIMIT 100`);
  return {
    projects: rows,
    ambiguous_links: ambiguous,
    legacy_manual: legacy,
    recent_failures: failures,
  };
}
async function migrateLegacy(db) {
  await sync.prepare(db);
  const [[done]] = await db.query(
    "SELECT migration_key FROM subsidy_sync_migrations WHERE migration_key='option_a_v1'"
  );
  if (done) return { already_applied: true };
  const [projects] = await db.query('SELECT id FROM projects WHERE is_deleted=0 ORDER BY id');
  for (const project of projects) await sync.initializeProject(db, project.id);
  const before = await report(db);
  await db.query(`CREATE TABLE IF NOT EXISTS subsidy_legacy_stage_backup (
    project_id INT PRIMARY KEY,stage VARCHAR(60) NOT NULL,backed_up_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(`INSERT IGNORE INTO subsidy_legacy_stage_backup(project_id,stage)
      SELECT id,stage FROM projects WHERE is_deleted=0`);
    await connection.query(`UPDATE projects p LEFT JOIN subsidy_applications s ON s.project_id=p.id
      SET p.subsidy_legacy_manual=IF(COALESCE(s.portal_status,'')<>'subsidy_credited',1,0),
      p.stage=CASE WHEN p.stage IN ('Subsidy Applied','Subsidy Received','Handover Done')
        THEN 'Handover Done' ELSE p.stage END
      WHERE p.is_deleted=0 AND p.stage IN ('Subsidy Applied','Subsidy Received','Handover Done','Warranty Period')`);
    await connection.query(
      "INSERT INTO subsidy_sync_migrations(migration_key) VALUES ('option_a_v1')"
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return { before, migrated_projects: before.projects.length };
}
async function reconcile(db) {
  await sync.prepare(db);
  const [[migration]] = await db.query(
    "SELECT migration_key FROM subsidy_sync_migrations WHERE migration_key='option_a_v1'"
  );
  if (!migration) return { skipped: 'Legacy mapping must be reviewed and applied first.' };
  const [projects] =
    await db.query(`SELECT p.id FROM projects p LEFT JOIN subsidy_applications s ON s.project_id=p.id
    WHERE p.is_deleted=0 AND (s.portal_status IN ('subsidy_credited','bank_details_submitted','rejected')
      OR p.subsidy_applicable=0 OR s.id IS NULL)`);
  let synced = 0,
    failed = 0;
  for (const project of projects) {
    try {
      await sync.initializeProject(db, project.id);
      await sync.syncProject(db, project.id, null);
      synced++;
    } catch (error) {
      failed++;
      await db.query(
        `INSERT INTO subsidy_sync_logs(project_id,status,error_code) VALUES (?,'failed',?)`,
        [project.id, String(error.code || 'RECONCILE_FAILED').slice(0, 100)]
      );
    }
  }
  const [mismatches] =
    await db.query(`SELECT p.id FROM projects p LEFT JOIN subsidy_applications s ON s.project_id=p.id
    WHERE p.is_deleted=0 AND ((p.subsidy_applicable=1 AND s.id IS NULL)
      OR (s.portal_status='subsidy_credited' AND p.subsidy_received_amount IS NULL)
      OR (p.stage='Subsidy Received' AND COALESCE(s.portal_status,'')<>'subsidy_credited')
      OR (s.portal_status='subsidy_credited' AND p.stage NOT IN ('Subsidy Received','Warranty Period')
        AND EXISTS(SELECT 1 FROM project_handover h WHERE h.project_id=p.id AND h.is_deleted=0 AND h.handover_status='Completed')))`);
  if (mismatches.length || failed) {
    await db.query(
      `INSERT INTO notifications(user_id,title,body,type,reference_id)
      SELECT u.id,'Subsidy sync needs attention',?,'subsidy_sync',NULL FROM users u JOIN roles r ON r.id=u.role_id
      WHERE u.status='Active' AND u.is_deleted=0 AND (u.role_id=1 OR r.role_name='Application Manager')
      AND NOT EXISTS(SELECT 1 FROM notifications n WHERE n.user_id=u.id AND n.type='subsidy_sync' AND n.created_at>=CURRENT_DATE())`,
      [
        `${mismatches.length} mismatches and ${failed} failed synchronizations. Review the Subsidy Tracker sync report.`,
      ]
    );
  }
  return { checked: projects.length, synced, failed, mismatches: mismatches.length };
}
function start() {
  let running = false;
  require('node-cron').schedule(
    '35 2 * * *',
    async () => {
      if (running) return;
      running = true;
      try {
        const { masterDb } = require('../config/masterDb');
        const [tenants] = await masterDb.query("SELECT db_name FROM clients WHERE status='Active'");
        for (const tenant of tenants) {
          if (!/^\w+$/.test(tenant.db_name || '')) continue;
          try {
            await reconcile(require('../config/clientDb').getClientPool(tenant.db_name));
          } catch (error) {
            console.error('Subsidy reconciliation:', error.code || 'FAILED');
          }
        }
      } finally {
        running = false;
      }
    },
    { timezone: 'Asia/Kolkata' }
  );
}
module.exports = { report, migrateLegacy, reconcile, start };
