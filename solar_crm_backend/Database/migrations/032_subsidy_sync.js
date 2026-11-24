exports.up = async (db) => {
  await require('../../services/subsidySync').prepare(db);
  await db.query(`INSERT IGNORE INTO subsidy_sync_migrations(migration_key)
    SELECT 'option_a_v1' WHERE NOT EXISTS(SELECT 1 FROM projects WHERE is_deleted=0)`);
};
