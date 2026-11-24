const workspace = require('./customerWorkspace');
const ledgerService = require('./customerLedger');
const { date, days, paise } = require('./customerInvoiceLedger');
const schema = require('./customerCollectionSchema');
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const finance = (user) => Number(user.role_id) === 1 || user.portal_role === 'finance';
function authorize(user) {
  if (![1, 2, 3].includes(Number(user.role_id)) && user.portal_role !== 'finance')
    fail('Access denied.', 403);
}
async function todayFor(db) {
  const prefs = await require('./salesWorkflow').preferences(db);
  return require('./salesWorkflow').localClock(prefs.timezone).date;
}
function match(row, f, today) {
  const l = row.ledger;
  if (f.balance === 'outstanding' && l.balance_due <= 0) return false;
  if (f.balance === 'refund' && l.refund_due <= 0) return false;
  if (f.balance === 'settled' && (!l.has_financial_record || l.balance_due || l.refund_due))
    return false;
  if (f.source && f.source !== (row.effective_lead_source || 'Not recorded')) return false;
  if (f.owner && String(row.collection_owner_id || '') !== String(f.owner)) return false;
  if (f.stage && !row.project_stages.includes(f.stage)) return false;
  if (f.followup && row.followup_status !== f.followup) return false;
  if (f.loan === 'awaited' && !l.loan_awaited) return false;
  if (f.loan === 'disbursed' && !l.loan_disbursed) return false;
  if (f.loan === 'none' && (l.loan_disbursed || l.loan_sanctioned)) return false;
  const amount =
    f.balance === 'refund'
      ? l.refund_due
      : f.balance === 'outstanding'
        ? l.balance_due
        : Math.max(l.balance_due, l.refund_due);
  if (f.min !== undefined && f.min !== '' && amount < Number(f.min)) return false;
  if (f.max !== undefined && f.max !== '' && amount > Number(f.max)) return false;
  // Loan-awaited debt is excluded from overdue chasing only when the entire
  // overdue invoice is covered by an undisbursed sanction; other debt still counts.
  const chase = l.invoices.filter((i) => i.balance_due > i.loan_awaited && i.days_overdue > 0);
  if (f.age) {
    const overdue = Math.max(0, ...chase.map((i) => i.days_overdue));
    const ranges = { '1-15': [1, 15], '16-30': [16, 30], '31-60': [31, 60], '60+': [61, Infinity] };
    const range = ranges[f.age];
    if (!range || overdue < range[0] || overdue > range[1]) return false;
  }
  if (f.due === 'overdue' && !chase.length) return false;
  if (f.due === 'none' && !l.no_due_date) return false;
  if (f.due && !['none', 'overdue'].includes(f.due)) {
    const dates = l.invoices
      .filter((i) => i.balance_due > 0)
      .flatMap((i) => {
        const dates = i.milestones.map((m) => m.due_date).filter(Boolean);
        if (i.next_due_date) dates.push(i.next_due_date);
        return dates;
      });
    if (
      !dates.some((d) => {
        const delta = days(today, d);
        return f.due === 'today'
          ? delta === 0
          : f.due === 'custom'
            ? (!f.from || d >= f.from) && (!f.to || d <= f.to)
            : delta >= 0 && delta <= Number(f.due);
      })
    )
      return false;
  }
  return true;
}
function totals(rows) {
  const sum = (key) => rows.reduce((s, r) => s + paise(r.ledger[key]), 0) / 100;
  return {
    customers: rows.length,
    outstanding: sum('balance_due'),
    refund_due: sum('refund_due'),
    outstanding_customers: rows.filter((r) => r.ledger.balance_due > 0).length,
    refund_customers: rows.filter((r) => r.ledger.refund_due > 0).length,
    contract_total: sum('contract_total'),
    received: sum('total_received'),
    refunds_paid: sum('refunds_paid'),
  };
}
async function all(db, user, filters = {}) {
  authorize(user);
  const rows = await require('../models/customerModel').getCustomers(
    {
      directory: true,
      search: filters.search,
      requirement: filters.requirement,
      role_id: user.role_id,
      user_id: user.id,
    },
    db
  );
  await schema.ensure(db);
  const ids = rows.map((r) => r.id);
  if (!ids.length) return [];
  const [states] = await db.query(
    "SELECT s.*,u.full_name AS owner_name,DATE_FORMAT(s.promised_date,'%Y-%m-%d') AS promised_date FROM customer_collection_state s LEFT JOIN users u ON u.id=s.owner_id WHERE s.customer_id IN (?)",
    [ids]
  );
  const [projects] = await db.query(
    'SELECT c.id AS customer_id,p.stage FROM customers c JOIN projects p ON p.customer_id=c.id OR p.lead_id=c.lead_id WHERE c.id IN (?) AND p.is_deleted=0',
    [ids]
  );
  const today = await todayFor(db);
  return rows.map((r) => {
    const state = states.find((s) => Number(s.customer_id) === Number(r.id));
    return {
      ...r,
      collection_owner_id: state?.owner_id || r.assigned_to || null,
      collection_owner_name: state?.owner_name || r.assigned_to_name || 'Unassigned',
      followup_status:
        state?.promised_date &&
        state.promised_date < today &&
        !state.task_done &&
        (r.ledger.balance_due || r.ledger.refund_due)
          ? 'Promise broken'
          : state?.followup_status || 'Not contacted',
      promised_date: state?.promised_date || null,
      last_note: state?.last_note || '',
      last_followup_at: state?.last_followup_at || null,
      task_done: !!state?.task_done,
      project_stages: [
        ...new Set(
          projects.filter((p) => Number(p.customer_id) === Number(r.id)).map((p) => p.stage)
        ),
      ],
    };
  });
}
async function owners(db, user) {
  authorize(user);
  let where =
    "u.is_deleted=0 AND LOWER(u.status)='active' AND (u.role_id IN (1,2,3) OR r.role_name='Finance')";
  const params = [];
  if (Number(user.role_id) === 2) {
    where += ' AND u.role_id=3 AND u.manager_id=?';
    params.push(user.id);
  }
  if (Number(user.role_id) === 3) {
    where += ' AND u.id=?';
    params.push(user.id);
  }
  const [rows] = await db.query(
    `SELECT u.id,u.full_name FROM users u LEFT JOIN roles r ON r.id=u.role_id WHERE ${where} ORDER BY u.full_name`,
    params
  );
  return rows;
}
async function list(db, user, filters) {
  for (const key of ['from', 'to'])
    if (filters[key] && !workspace.validDate(filters[key])) fail('Enter a valid date range.');
  for (const key of ['min', 'max'])
    if (filters[key] && (!Number.isFinite(Number(filters[key])) || Number(filters[key]) < 0))
      fail('Enter a valid non-negative amount range.');
  if (filters.from && filters.to && filters.from > filters.to)
    fail('Start date cannot follow end date.');
  if (filters.min && filters.max && Number(filters.min) > Number(filters.max))
    fail('Minimum cannot exceed maximum.');
  const rows = await all(db, user, filters),
    today = await todayFor(db);
  const filtered = rows.filter((r) => match(r, filters, today));
  const sorters = {
    name: (r) => r.customer_name,
    outstanding: (r) => r.ledger.balance_due,
    refund: (r) => r.ledger.refund_due,
    due: (r) => r.ledger.next_due_date || '9999',
    overdue: (r) => r.ledger.days_overdue,
    followup: (r) => date(r.last_followup_at),
    promised: (r) => r.promised_date || '9999',
    newest: (r) => Number(r.id),
  };
  const sort = sorters[filters.sort] || sorters.newest,
    direction = filters.direction === 'asc' ? 1 : -1;
  filtered.sort((a, b) => {
    const x = sort(a),
      y = sort(b);
    return (
      (typeof x === 'number' ? x - y : String(x || '').localeCompare(String(y || ''))) *
        direction || Number(b.id) - Number(a.id)
    );
  });
  const page = Math.min(
      Math.max(1, Math.ceil(filtered.length / 20)),
      Math.max(1, Number.parseInt(filters.page, 10) || 1)
    ),
    limit = 20;
  const [settings] = await db.query(
    'SELECT refund_alert_days FROM customer_collection_settings WHERE id=1'
  );
  return {
    rows: filters.export === 'csv' ? filtered : filtered.slice((page - 1) * limit, page * limit),
    totals: totals(filtered),
    cards: totals(rows.filter((r) => match(r, { ...filters, balance: undefined }, today))),
    page,
    pages: Math.max(1, Math.ceil(filtered.length / limit)),
    today,
    options: {
      owners: await owners(db, user),
      sources: [...new Set(rows.map((r) => r.effective_lead_source || 'Not recorded'))].sort(),
      stages: [...new Set(rows.flatMap((r) => r.project_stages))].sort(),
    },
    refund_alert_days: settings[0]?.refund_alert_days || 7,
  };
}
async function detail(db, id, user) {
  authorize(user);
  const customer = await workspace.accessibleCustomer(db, id, user);
  const opening = (await require('./customerOpening').records(db, [customer.id]))[0];
  const ledger = await ledgerService.get(db, customer, opening);
  const [activity] = await db.query(
    'SELECT a.*,u.full_name AS performed_by_name FROM customer_collection_activity a LEFT JOIN users u ON u.id=a.performed_by WHERE a.customer_id=? ORDER BY a.id DESC LIMIT 50',
    [id]
  );
  return { ledger, activity };
}
async function followup(db, id, body, user) {
  authorize(user);
  await workspace.accessibleCustomer(db, id, user);
  await ledgerService.ensure(db);
  await schema.ensure(db);
  const action = body.action || 'note',
    note = String(body.note || '').trim();
  if (!['note', 'promise', 'done', 'assign', 'reminder'].includes(action))
    fail('Invalid follow-up action.');
  if (note.length > 2000) fail('Note must be at most 2,000 characters.');
  if (['note', 'promise'].includes(action) && !note) fail('Add a follow-up note.');
  const today = await todayFor(db);
  if (
    action === 'promise' &&
    (!workspace.validDate(body.promised_date) || body.promised_date < today)
  )
    fail('Choose today or a future promised date.');
  if (action === 'assign' && Number(user.role_id) === 3)
    fail('Sales cannot reassign collection owners.', 403);
  if (
    action === 'assign' &&
    !(await owners(db, user)).some((o) => Number(o.id) === Number(body.owner_id))
  )
    fail('Choose an active owner in your permitted team.');
  const c = await db.getConnection();
  try {
    await c.beginTransaction();
    // Customer lock also serializes against deletion and concurrent ledger writes.
    const [[exists]] = await c.query('SELECT id,assigned_to FROM customers WHERE id=? FOR UPDATE', [
      id,
    ]);
    if (!exists) fail('Customer not found.', 404);
    await c.query(
      'INSERT IGNORE INTO customer_collection_state(customer_id,owner_id) VALUES(?,?)',
      [id, exists.assigned_to || user.id]
    );
    if (action === 'assign')
      await c.query(
        'UPDATE customer_collection_state SET owner_id=?,updated_by=? WHERE customer_id=?',
        [body.owner_id, user.id, id]
      );
    else if (action === 'done')
      await c.query(
        "UPDATE customer_collection_state SET task_done=1,followup_status='Contacted',promised_date=NULL,last_followup_at=NOW(),updated_by=? WHERE customer_id=?",
        [user.id, id]
      );
    else if (action === 'note')
      await c.query(
        "UPDATE customer_collection_state SET followup_status=IF(promised_date IS NULL,'Contacted',followup_status),last_note=?,last_followup_at=NOW(),updated_by=? WHERE customer_id=?",
        [note, user.id, id]
      );
    else
      await c.query(
        `UPDATE customer_collection_state SET followup_status=?,last_note=?,last_followup_at=NOW(),
      promised_date=?,task_due=?,task_done=0,updated_by=? WHERE customer_id=?`,
        [
          action === 'promise' ? 'Promised to pay' : 'Contacted',
          note || 'WhatsApp reminder prepared by staff.',
          action === 'promise' ? body.promised_date : null,
          action === 'promise' ? body.promised_date : today,
          user.id,
          id,
        ]
      );
    await c.query(
      'INSERT INTO customer_collection_activity(customer_id,action,note,promised_date,performed_by) VALUES(?,?,?,?,?)',
      [id, action, note || null, action === 'promise' ? body.promised_date : null, user.id]
    );
    await c.commit();
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
async function payment(db, id, body, user) {
  if (!finance(user)) fail('Only Admin and Finance can record amounts.', 403);
  const customer = await workspace.accessibleCustomer(db, id, user);
  const value = workspace.cents(body.amount);
  if (!Number.isSafeInteger(value) || value <= 0)
    fail('Enter a positive amount with up to two decimals.');
  if (!workspace.validDate(body.payment_date) || !ledgerService.modes.includes(body.payment_mode))
    fail('Choose a valid payment date and mode.');
  await detail(db, id, user);
  if (!/^[\w-]{16,80}$/.test(body.request_key || '')) fail('Payment request ID is required.');
  await require('./invoiceReceipt').ensure(db);
  const hash = require('crypto')
    .createHash('sha256')
    .update(
      JSON.stringify([
        Number(id),
        body.record_key,
        value,
        body.payment_date,
        body.payment_mode,
        body.reference_number || '',
      ])
    )
    .digest('hex');
  const today = await todayFor(db);
  const c = await db.getConnection();
  try {
    await c.beginTransaction();
    await c.query('SELECT id FROM customers WHERE id=? FOR UPDATE', [id]);
    const [[old]] = await c.query('SELECT * FROM invoice_payment_requests WHERE request_key=?', [
      body.request_key,
    ]);
    if (old) {
      if (old.payload_hash !== hash || Number(old.recorded_by) !== Number(user.id))
        fail('Request ID already used.', 409);
      await c.commit();
      return JSON.parse(old.result_json);
    }
    const [[opening]] = await c.query(
      'SELECT * FROM customer_opening_records WHERE customer_id=? FOR UPDATE',
      [id]
    );
    await c.query(
      'SELECT id FROM invoices WHERE customer_id=? OR lead_id IN (SELECT id FROM leads WHERE customer_id=? OR id=?) FOR UPDATE',
      [id, id, customer.lead_id]
    );
    const ledger = await ledgerService.get(c, customer, opening, { skipSetup: true, today });
    const invoice = ledger.invoices.find((r) => r.key === body.record_key);
    if (!invoice || value > paise(invoice.balance_due))
      fail('Balance changed. Refresh before retrying.', 409);
    if (String(body.reference_number || '').length > 100) fail('Reference is too long.');
    if (invoice.invoice_id) {
      await c.query('SELECT id FROM invoices WHERE id=? FOR UPDATE', [invoice.invoice_id]);
      await c.query(
        'INSERT INTO invoice_payments(invoice_id,amount,payment_date,payment_mode,reference_number,recorded_by) VALUES(?,?,?,?,?,?)',
        [
          invoice.invoice_id,
          value / 100,
          body.payment_date,
          body.payment_mode,
          body.reference_number || null,
          user.id,
        ]
      );
      const due = Math.max(0, paise(invoice.balance_due) - value) / 100;
      await c.query(
        'UPDATE invoices SET amount_paid=amount_paid+?,balance_due=?,payment_status=?,payment_date=? WHERE id=?',
        [value / 100, due, due ? 'Partially Paid' : 'Paid', body.payment_date, invoice.invoice_id]
      );
    } else {
      if (invoice.key !== 'opening') fail('Create an invoice before recording this receipt.');
      await c.query(
        'UPDATE customer_opening_records SET amount_paid=amount_paid+?,payment_date=?,payment_mode=?,payment_reference=? WHERE customer_id=?',
        [value / 100, body.payment_date, body.payment_mode, body.reference_number || null, id]
      );
    }
    await c.query(
      "INSERT INTO customer_collection_activity(customer_id,action,note,performed_by) VALUES(?,'Payment',?,?)",
      [
        id,
        `Receipt (${invoice.invoice_number}) ₹${value / 100}; ${body.payment_date}; ${body.payment_mode}; ${body.reference_number || ''}`,
        user.id,
      ]
    );
    await c.query(
      'INSERT INTO invoice_payment_requests(request_key,invoice_id,recorded_by,payload_hash,result_json) VALUES(?,0,?,?,?)',
      [body.request_key, user.id, hash, JSON.stringify({ recorded: true })]
    );
    await c.commit();
    return { recorded: true };
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
function csv(rows) {
  const cell = (v) =>
    '"' +
    String(v ?? '')
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replace(/"/g, '""') +
    '"';
  return (
    '\uFEFF' +
    [
      [
        'Customer code',
        'Customer',
        'Phone',
        'Outstanding',
        'Refund due',
        'Loan awaited',
        'Next due date',
        'Days overdue',
        'Owner',
        'Follow-up status',
        'Last follow-up',
        'Note',
        'Promised date',
      ],
      ...rows.map((r) => [
        r.customer_code,
        r.customer_name,
        r.mobile_number,
        r.ledger.balance_due,
        r.ledger.refund_due,
        r.ledger.loan_awaited,
        r.ledger.next_due_date,
        r.ledger.days_overdue,
        r.collection_owner_name,
        r.followup_status,
        date(r.last_followup_at),
        r.last_note,
        r.promised_date,
      ]),
    ]
      .map((r) => r.map(cell).join(','))
      .join('\r\n')
  );
}
module.exports = {
  authorize,
  finance,
  all,
  list,
  detail,
  followup,
  payment,
  totals,
  match,
  csv,
  todayFor,
};
