const ready = new WeakMap();
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const modes = ['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Card', 'Other'];

function money(value) {
  if (value == null || value === '') return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(String(value)) || Number(value) > 9999999999.99) return NaN;
  return Math.round(Number(value) * 100);
}

function summary(contract, receipts, loans = 0, refunds = 0) {
  const contractCents = Math.round(Number(contract || 0) * 100);
  const receivedCents =
    Math.round(Number(receipts || 0) * 100) + Math.round(Number(loans || 0) * 100);
  const refundCents = Math.round(Number(refunds || 0) * 100);
  const balanceDue = Math.max(0, contractCents - receivedCents);
  const refundDue = Math.max(0, receivedCents - contractCents - refundCents);
  if (balanceDue > 0 && refundDue > 0)
    fail('Invalid ledger: balance and refund cannot both be due.');
  const balance = balanceDue - refundDue;
  return {
    contract_total: contractCents / 100,
    total_received: receivedCents / 100,
    loan_disbursed: Math.round(Number(loans || 0) * 100) / 100,
    refunds_paid: refundCents / 100,
    balance: balance / 100,
    balance_due: balanceDue / 100,
    refund_due: refundDue / 100,
  };
}

async function ensure(db) {
  if (!ready.has(db))
    ready.set(
      db,
      (async () => {
        await db.query(`CREATE TABLE IF NOT EXISTS customer_refunds (
      id INT AUTO_INCREMENT PRIMARY KEY, customer_id INT NOT NULL,
      request_key VARCHAR(80) NOT NULL UNIQUE, amount DECIMAL(12,2) NOT NULL,
      refund_date DATE NOT NULL, refund_mode VARCHAR(50) NOT NULL,
      refund_reference VARCHAR(100) NULL, recorded_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, KEY refund_customer(customer_id)
    ) ENGINE=InnoDB`);
        const [columns] = await db.query('SHOW COLUMNS FROM customer_opening_records');
        for (const name of [
          'loan_sanctioned_amount',
          'loan_disbursed_amount',
          'refund_paid_amount',
        ]) {
          if (!columns.some((c) => c.Field === name)) {
            try {
              await db.query(
                `ALTER TABLE customer_opening_records ADD COLUMN ${name} DECIMAL(12,2) NOT NULL DEFAULT 0`
              );
            } catch (e) {
              if (e.code !== 'ER_DUP_FIELDNAME') throw e;
            }
          }
        }
        for (const [name, type] of [
          ['refund_date', 'DATE NULL'],
          ['refund_mode', 'VARCHAR(50) NULL'],
          ['refund_reference', 'VARCHAR(100) NULL'],
        ]) {
          if (!columns.some((c) => c.Field === name)) {
            try {
              await db.query(`ALTER TABLE customer_opening_records ADD COLUMN ${name} ${type}`);
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

function importFinancials(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row))
    return { error: 'Invalid customer row.' };
  const keys = [
    'invoice_amount',
    'payment_amount',
    'loan_sanctioned_amount',
    'loan_disbursed_amount',
    'refund_paid_amount',
  ];
  const values = Object.fromEntries(keys.map((k) => [k, money(row[k])]));
  if (Object.values(values).some((v) => !Number.isSafeInteger(v)))
    return { error: 'Amounts must be non-negative with up to 2 decimal places.' };
  const excess = Math.max(
    0,
    values.payment_amount + values.loan_disbursed_amount - values.invoice_amount
  );
  if (values.refund_paid_amount > excess)
    return { error: 'Refund paid exceeds the refundable excess received.' };
  if (values.refund_paid_amount > 0) {
    const date = String(row.refund_date || '');
    const parsed = new Date(date + 'T00:00:00Z');
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date
    )
      return { error: 'Refund Date must be a valid YYYY-MM-DD date.' };
    if (!modes.includes(row.refund_mode))
      return { error: 'Refund Mode must be Bank Transfer, UPI, Cash, Cheque, Card or Other.' };
  }
  if (
    row.refund_reference != null &&
    (typeof row.refund_reference !== 'string' || row.refund_reference.length > 100)
  )
    return { error: 'Refund Reference must be text up to 100 characters.' };
  return {
    values,
    refundDue: (excess - values.refund_paid_amount) / 100,
    warning:
      excess > 0
        ? 'Total received exceeds contract amount; refundable excess has been calculated.'
        : null,
  };
}

async function getMany(db, customers, openings = [], options = {}) {
  const result = new Map();
  if (!customers.length) return result;
  if (!options.skipSetup) await require('./customerCollectionSchema').ensure(db);
  const ids = customers.map((row) => Number(row.id));
  if (!options.skipSetup) await require('./quotationPaymentSchedule').sync(db, ids);
  const [invoices] = await db.query(
    `SELECT c.id AS ledger_customer_id,i.* FROM customers c JOIN invoices i
     ON i.customer_id=c.id OR i.lead_id IN (SELECT id FROM leads WHERE customer_id=c.id OR id=c.lead_id)
     WHERE c.id IN (?) AND LOWER(COALESCE(i.status,'')) NOT IN ('cancelled','canceled','void')${require('../utils/managerScope').managerId(db) ? ` AND (i.lead_id IS NULL OR i.lead_id IN (SELECT ml.id FROM leads ml WHERE ${require('../utils/managerScope').leadFor(db.managerScopeId, 'ml')}))` : ''}`,
    [ids]
  );
  const [tables] = await db.query(
    "SELECT TABLE_NAME AS name FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='solar_loans'"
  );
  let loans = [];
  if (tables.length)
    [loans] = await db.query(
      `SELECT c.id AS ledger_customer_id,s.* FROM customers c
     JOIN leads l ON l.customer_id=c.id OR l.id=c.lead_id JOIN solar_loans s ON s.lead_id=l.id WHERE c.id IN (?)${require('../utils/managerScope').lead(db, 'l')}`,
      [ids]
    );
  const [refundRows] = await db.query(
    "SELECT *,DATE_FORMAT(refund_date,'%Y-%m-%d') AS refund_date FROM customer_refunds WHERE customer_id IN (?) ORDER BY refund_date,id",
    [ids]
  );
  const [credits] = await db.query('SELECT * FROM customer_credit_notes WHERE customer_id IN (?)', [
    ids,
  ]);
  const [milestones] = await db.query(
    "SELECT *,DATE_FORMAT(due_date,'%Y-%m-%d') AS due_date FROM customer_payment_milestones WHERE customer_id IN (?) ORDER BY position,id",
    [ids]
  );
  const today =
    options.today ||
    require('./salesWorkflow').localClock(
      (await require('./salesWorkflow').preferences(db)).timezone
    ).date;
  for (const customer of customers) {
    const id = Number(customer.id),
      opening = openings.find((r) => Number(r.customer_id) === id);
    const refunds = refundRows
      .filter((r) => Number(r.customer_id) === id)
      .map((r) => ({ ...r, type: 'Refund' }));
    result.set(id, {
      ...require('./customerInvoiceLedger').calculate(
        invoices.filter((r) => Number(r.ledger_customer_id) === id),
        opening,
        loans.filter((r) => Number(r.ledger_customer_id) === id),
        refunds,
        credits.filter((r) => Number(r.customer_id) === id),
        milestones.filter((r) => Number(r.customer_id) === id),
        today
      ),
      opening_refund:
        Number(opening?.refund_paid_amount) > 0
          ? {
              type: 'Refund',
              amount: Number(opening.refund_paid_amount),
              refund_date: opening.refund_date,
              refund_mode: opening.refund_mode,
              refund_reference: opening.refund_reference,
            }
          : null,
      refunds,
    });
  }
  return result;
}
async function get(db, customer, opening, options = {}) {
  return (await getMany(db, [customer], opening ? [opening] : [], options)).get(
    Number(customer.id)
  );
}

async function recordRefund(db, customerId, body, user) {
  if (Number(user.role_id) !== 1 && user.portal_role !== 'finance') fail('Access denied.', 403);
  await require('./customerOpening').ensure(db);
  await ensure(db);
  await require('./customerCollectionSchema').ensure(db);
  const customer = await require('./customerWorkspace').accessibleCustomer(db, customerId, user);
  if (Number(user.role_id) === 2) {
    const [outside] = await db.query(
      'SELECT id FROM leads WHERE (customer_id=? OR id=?) AND (assigned_to IS NULL OR assigned_to NOT IN (SELECT id FROM users WHERE manager_id=? AND role_id=3 AND is_deleted=0))',
      [customer.id, customer.lead_id, user.id]
    );
    if (outside.length)
      fail(
        'This customer has linked records outside your team. Ask an Admin to record the refund.',
        403
      );
  }

  if (!/^[\w-]{16,80}$/.test(body.request_key || '')) fail('A refund request ID is required.');
  const amount = money(body.amount);
  if (!Number.isSafeInteger(amount) || amount <= 0)
    fail('Enter a positive refund amount with up to 2 decimal places.');
  const today = require('./salesWorkflow').localClock(
    (await require('./salesWorkflow').preferences(db)).timezone
  ).date;
  const c = await db.getConnection();
  try {
    await c.beginTransaction();
    await c.query('SELECT id FROM customers WHERE id=? FOR UPDATE', [customer.id]);
    const [[old]] = await c.query('SELECT * FROM customer_refunds WHERE request_key=?', [
      body.request_key,
    ]);
    if (old) {
      if (
        Number(old.customer_id) !== Number(customer.id) ||
        money(old.amount) !== amount ||
        String(old.record_key || '') !== String(body.record_key || '') ||
        Number(old.invoice_id || 0) !== Number(body.invoice_id || 0) ||
        String(old.refund_mode) !== body.refund_mode ||
        String(old.refund_reference || '') !== String(body.refund_reference || '') ||
        (old.refund_date instanceof Date
          ? `${old.refund_date.getFullYear()}-${String(old.refund_date.getMonth() + 1).padStart(2, '0')}-${String(old.refund_date.getDate()).padStart(2, '0')}`
          : String(old.refund_date).slice(0, 10)) !== body.refund_date
      )
        fail('Request ID already used for another refund.', 409);
      await c.commit();
      return { id: old.id };
    }
    const [[opening]] = await c.query(
      'SELECT * FROM customer_opening_records WHERE customer_id=?',
      [customer.id]
    );
    const ledger = await get(c, customer, opening, { skipSetup: true, today });
    const validation = importFinancials({
      invoice_amount: 0,
      payment_amount: amount / 100,
      refund_paid_amount: amount / 100,
      refund_date: body.refund_date,
      refund_mode: body.refund_mode,
      refund_reference: body.refund_reference,
    });
    if (validation.error) fail(validation.error);
    const target = body.record_key
      ? ledger.invoices.find((r) => r.key === body.record_key)
      : body.invoice_id
        ? ledger.invoices.find((r) => Number(r.invoice_id) === Number(body.invoice_id))
        : ledger;
    if (!target) fail('Linked invoice not found.', 404);
    if (amount > Math.round(target.refund_due * 100))
      fail('Refund paid exceeds the current refund due. Refresh the ledger.', 409);
    const [result] = await c.query(
      'INSERT INTO customer_refunds(customer_id,request_key,amount,refund_date,refund_mode,refund_reference,recorded_by,invoice_id,record_key) VALUES (?,?,?,?,?,?,?,?,?)',
      [
        customer.id,
        body.request_key,
        amount / 100,
        body.refund_date,
        body.refund_mode,
        body.refund_reference || null,
        user.id,
        body.invoice_id || null,
        body.record_key || null,
      ]
    );
    await c.commit();
    return { id: result.insertId };
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}

module.exports = { money, summary, ensure, importFinancials, get, getMany, recordRefund, modes };
