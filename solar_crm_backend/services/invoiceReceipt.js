const crypto = require('crypto');
const { cents, validDate } = require('./customerWorkspace');
const ready = new WeakMap();
async function ensure(db) {
  if (!ready.has(db)) ready.set(db, db.query(`CREATE TABLE IF NOT EXISTS invoice_payment_requests (
    request_key VARCHAR(80) PRIMARY KEY, invoice_id INT NOT NULL, recorded_by INT NULL,
    payload_hash CHAR(64) NOT NULL, result_json LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`).catch(e => { ready.delete(db); throw e; }));
  await ready.get(db);
}
async function record(db, invoiceId, data, userId) {
  const value = cents(data.amount);
  if (!Number.isSafeInteger(value) || value <= 0) throw Error('Enter a positive payment amount with up to 2 decimal places.');
  const date = data.payment_date || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  if (!validDate(date)) throw Error('Enter a valid payment date.');
  const mode = String(data.payment_mode || 'Bank Transfer'), reference = String(data.reference_number || ''), notes = String(data.notes || '');
  if (mode.length > 50 || reference.length > 100 || notes.length > 6000) throw Error('Payment reference or notes are too long.');
  const key = data.request_key;
  if (key && !/^[a-zA-Z0-9-]{16,80}$/.test(key)) throw Error('Invalid payment request ID.');
  await ensure(db);
  const hash = crypto.createHash('sha256').update(JSON.stringify([Number(invoiceId), value, date, mode, reference, notes])).digest('hex');
  const c = await db.getConnection();
  try {
    await c.beginTransaction();
    const [[invoice]] = await c.query('SELECT * FROM invoices WHERE id=? FOR UPDATE', [invoiceId]);
    if (!invoice) throw Error('Invoice not found.');
    if (key) {
      const [[previous]] = await c.query('SELECT * FROM invoice_payment_requests WHERE request_key=? FOR UPDATE', [key]);
      if (previous) {
        if (previous.payload_hash !== hash || Number(previous.recorded_by) !== Number(userId)) throw Error('This payment request ID was already used for another payment.');
        await c.commit(); return JSON.parse(previous.result_json);
      }
    }
    const paid = Math.round(Number(invoice.amount_paid || 0) * 100), payable = Math.round(Number(invoice.net_payable_amount || 0) * 100);
    if (value > Math.max(0, payable - paid)) throw Error('Payment exceeds the outstanding invoice balance. Refresh the invoice before retrying.');
    const total = paid + value, balance = Math.max(0, payable - total), status = balance === 0 ? 'Paid' : 'Partially Paid';
    const [payment] = await c.query('INSERT INTO invoice_payments(invoice_id,amount,payment_date,payment_mode,reference_number,notes,recorded_by) VALUES (?,?,?,?,?,?,?)', [invoiceId, value / 100, date, mode, reference || null, notes || null, userId]);
    await c.query('UPDATE invoices SET amount_paid=?,balance_due=?,payment_status=?,payment_date=?,updated_at=CURRENT_TIMESTAMP WHERE id=?', [total / 100, balance / 100, status, date, invoiceId]);
    if (invoice.lead_id) await c.query("INSERT INTO lead_activity_logs(lead_id,action_type,new_value,remark,performed_by) VALUES (?,'Payment Received',?,?,?)", [invoice.lead_id, `Rs ${value / 100}`, `Receipt against invoice ${invoice.invoice_number}; balance Rs ${balance / 100}`, userId]);
    const result = { invoice_id: Number(invoiceId), payment_id: payment.insertId, amount_paid: total / 100, balance_due: balance / 100, payment_status: status };
    if (key) await c.query('INSERT INTO invoice_payment_requests(request_key,invoice_id,recorded_by,payload_hash,result_json) VALUES (?,?,?,?,?)', [key, invoiceId, userId, hash, JSON.stringify(result)]);
    await c.commit(); return result;
  } catch (e) { await c.rollback(); throw e; } finally { c.release(); }
}
module.exports = { ensure, record };
