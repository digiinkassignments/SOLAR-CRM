const ready = new WeakMap();
async function ensure(db) {
  if (!ready.has(db))
    ready.set(
      db,
      (async () => {
        const [columns] = await db.query(
          "SHOW COLUMNS FROM quotations LIKE 'payment_schedule_json'"
        );
        if (!columns.length) {
          try {
            await db.query('ALTER TABLE quotations ADD COLUMN payment_schedule_json LONGTEXT NULL');
          } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') throw e;
          }
        }
      })().catch((e) => {
        ready.delete(db);
        throw e;
      })
    );
  return ready.get(db);
}
function validate(rows) {
  const fail = () => {
    throw Object.assign(
      new Error(
        'Payment schedule needs named milestones, valid dates and positive percentages totalling 100%.'
      ),
      { status: 400 }
    );
  };
  if (!Array.isArray(rows) || rows.length > 20) fail();
  const normalized = rows.map((r) => {
    if (
      !r ||
      !String(r.title || '').trim() ||
      String(r.title).length > 120 ||
      !require('./customerWorkspace').validDate(r.due_date) ||
      !/^\d+(\.\d{1,2})?$/.test(String(r.percent)) ||
      Number(r.percent) <= 0
    )
      fail();
    return { title: String(r.title).trim(), percent: Number(r.percent), due_date: r.due_date };
  });
  if (rows.length && normalized.reduce((s, r) => s + Math.round(r.percent * 100), 0) !== 10000)
    fail();
  return normalized;
}
function amounts(rows, total) {
  const cents = Math.round(Number(total) * 100);
  let remaining = cents;
  return rows.map((r, index) => {
    const amount = index === rows.length - 1 ? remaining : Math.round((cents * r.percent) / 100);
    remaining -= amount;
    return { ...r, amount: amount / 100 };
  });
}
async function sync(db, ids) {
  if (!ids.length) return;
  try { await ensure(db); }
  catch (e) { if (e.code === 'ER_NO_SUCH_TABLE') return; throw e; }
  const [invoices] = await db.query(
    `SELECT i.id,i.gross_total,c.id AS customer_id,q.payment_schedule_json
    FROM invoices i JOIN quotations q ON i.quotation_id=q.id
    JOIN customers c ON i.customer_id=c.id OR i.lead_id IN (SELECT id FROM leads WHERE customer_id=c.id OR id=c.lead_id)
    LEFT JOIN customer_payment_plans p ON p.invoice_id=i.id
    WHERE c.id IN (?) AND p.invoice_id IS NULL AND q.payment_schedule_json IS NOT NULL`,
    [ids]
  );
  for (const i of invoices) {
    const rows = validate(JSON.parse(i.payment_schedule_json));
    if (!rows.length) continue;
    // A unique invoice plan serializes lazy creation across concurrent requests.
    const c = await db.getConnection();
    try {
      await c.beginTransaction();
      await c.query('SELECT id FROM invoices WHERE id=? FOR UPDATE', [i.id]);
      const [[old]] = await c.query(
        'SELECT invoice_id FROM customer_payment_plans WHERE invoice_id=?',
        [i.id]
      );
      if (!old) {
        await c.query(
          'INSERT INTO customer_payment_plans(invoice_id,customer_id,version) VALUES(?,?,1)',
          [i.id, i.customer_id]
        );
        for (const [index, r] of amounts(rows, i.gross_total).entries())
          await c.query(
            'INSERT INTO customer_payment_milestones(invoice_id,customer_id,title,amount,due_date,position) VALUES(?,?,?,?,?,?)',
            [i.id, i.customer_id, r.title, r.amount, r.due_date, index + 1]
          );
        await c.query('UPDATE invoices SET due_date=? WHERE id=?', [
          rows.map((r) => r.due_date).sort()[0],
          i.id,
        ]);
      }
      await c.commit();
    } catch (e) {
      await c.rollback();
      throw e;
    } finally {
      c.release();
    }
  }
}
module.exports = { ensure, validate, amounts, sync };
