const ensured = new WeakMap();
module.exports = async (db, table) => {
  if (!["quotations", "invoices"].includes(table)) throw new Error("Invalid tax table");
  if (ensured.get(db)?.has(table)) return;
  for (const [column, definition] of [["gst_mode", "VARCHAR(32) NULL"], ["gst_summary_json", "LONGTEXT NULL"]]) {
    const [rows] = await db.query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`);
    if (!rows.length) { try { await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`); } catch (error) { if (error.code !== "ER_DUP_FIELDNAME") throw error; } }
  }
  if (!ensured.has(db)) ensured.set(db, new Set());
  ensured.get(db).add(table);
};
