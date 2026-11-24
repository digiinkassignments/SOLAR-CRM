const ready = new WeakMap();
async function ensure(db) {
  if (!ready.has(db))
    ready.set(
      db,
      (async () => {
        await db.query(`CREATE TABLE IF NOT EXISTS customer_collection_state (
      customer_id INT PRIMARY KEY, owner_id INT NULL, followup_status VARCHAR(30) NOT NULL DEFAULT 'Not contacted',
      promised_date DATE NULL, last_note TEXT NULL, last_followup_at DATETIME NULL,
      task_due DATE NULL, task_done TINYINT NOT NULL DEFAULT 0,
      updated_by INT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);
        await db.query(`CREATE TABLE IF NOT EXISTS customer_collection_activity (
      id INT AUTO_INCREMENT PRIMARY KEY, customer_id INT NOT NULL, action VARCHAR(40) NOT NULL,
      note TEXT NULL, promised_date DATE NULL, performed_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, KEY collection_customer(customer_id)
    ) ENGINE=InnoDB`);
        await db.query(`CREATE TABLE IF NOT EXISTS customer_credit_notes (
      id INT AUTO_INCREMENT PRIMARY KEY, customer_id INT NOT NULL, invoice_id INT NOT NULL,
      amount DECIMAL(12,2) NOT NULL, credit_date DATE NOT NULL, reference VARCHAR(100) NOT NULL,
      recorded_by INT NOT NULL, request_key VARCHAR(80) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, KEY credit_customer(customer_id)
    ) ENGINE=InnoDB`);
        await db.query(`CREATE TABLE IF NOT EXISTS customer_collection_settings (
      id INT PRIMARY KEY, refund_alert_days INT NOT NULL DEFAULT 7
    ) ENGINE=InnoDB`);
        await db.query('INSERT IGNORE INTO customer_collection_settings(id) VALUES(1)');
        const [cols] = await db.query("SHOW COLUMNS FROM customer_refunds LIKE 'invoice_id'");
        if (!cols.length) {
          try {
            await db.query('ALTER TABLE customer_refunds ADD COLUMN invoice_id INT NULL');
          } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') throw e;
          }
        }
        for (const [table, column, type] of [
          ['customer_refunds', 'record_key', 'VARCHAR(80) NULL'],
          ['customer_opening_records', 'due_date', 'DATE NULL'],
        ]) {
          const [existing] = await db.query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`);
          if (!existing.length) {
            try {
              await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
            } catch (e) {
              if (e.code !== 'ER_DUP_FIELDNAME') throw e;
            }
          }
        }
      })().catch((e) => {
        ready.delete(db);
        throw e;
      })
    );
  return ready.get(db);
}
module.exports = { ensure };
