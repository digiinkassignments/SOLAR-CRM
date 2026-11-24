const crypto = require('crypto');
const ready = new WeakMap();
const reasons = ['Different city / property', 'Family member', 'Incorrect old record', 'Other'];
const fail = (message, status = 400, extra = {}) => {
  throw Object.assign(new Error(message), { status, ...extra });
};

function normalize(value, optional = false) {
  if (optional && !String(value || '').trim()) return null;
  let digits = String(value || '').replace(/[\s()+.-]/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits))
    fail('Enter a valid Indian mobile number (10 digits, starting with 6–9).');
  return digits;
}

async function ensure(db) {
  if (!ready.has(db))
    ready.set(
      db,
      (async () => {
        for (const [table, fields] of [
          ['leads', ['mobile_number', 'alternate_number']],
          ['customers', ['mobile_number', 'alternate_number']],
          ['projects', ['customer_phone']],
        ]) {
          const [columns] = await db.query(`SHOW COLUMNS FROM \`${table}\``);
          for (const field of fields) {
            if (!columns.some((c) => c.Field === field)) continue;
            const column = `dup_${field}`;
            if (!columns.some((c) => c.Field === column)) {
              // Stored generated columns also stay correct for imports and older write paths.
              let expression = `COALESCE(\`${field}\`,'')`;
              for (const character of [' ', '-', '+', '(', ')', '.', '\t', '\r', '\n']) {
                expression = `REPLACE(${expression},${db.escape(character)},'')`;
              }
              try {
                await db.query(
                  `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` VARCHAR(10) GENERATED ALWAYS AS (RIGHT(${expression},10)) STORED, ADD INDEX \`idx_${column}\` (\`${column}\`)`
                );
              } catch (error) {
                if (error.code !== 'ER_DUP_FIELDNAME') throw error;
              }
            }
          }
          const [indexes] = await db.query(
            `SHOW INDEX FROM \`${table}\` WHERE Key_name='idx_duplicate_name'`
          );
          if (!indexes.length) {
            try {
              await db.query(
                `ALTER TABLE \`${table}\` ADD INDEX idx_duplicate_name (customer_name(100))`
              );
            } catch (error) {
              if (error.code !== 'ER_DUP_KEYNAME') throw error;
            }
          }
        }
        await db.query(`CREATE TABLE IF NOT EXISTS crm_duplicate_links (
      id BIGINT AUTO_INCREMENT PRIMARY KEY, record_type VARCHAR(20) NOT NULL,
      record_id INT NOT NULL, original_type VARCHAR(20) NOT NULL, original_id INT NOT NULL,
      reason VARCHAR(100) NOT NULL, remarks VARCHAR(1000) NULL, created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, resolved_at DATETIME NULL,
      KEY record_lookup(record_type,record_id), KEY original_lookup(original_type,original_id)
    ) ENGINE=InnoDB`);
        await db.query(`CREATE TABLE IF NOT EXISTS crm_duplicate_audit (
      id BIGINT AUTO_INCREMENT PRIMARY KEY, action VARCHAR(30) NOT NULL,
      record_type VARCHAR(20) NOT NULL, record_id INT NOT NULL, original_type VARCHAR(20),
      original_id INT, reason VARCHAR(1000), performed_by INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);
      })().catch((error) => {
        ready.delete(db);
        throw error;
      })
    );
  return ready.get(db);
}

async function search(db, query = {}, user = {}) {
  await ensure(db);
  const phones = [query.phone, query.alternate]
    .filter((v) => String(v || '').trim())
    .map((v) => normalize(v));
  const name = String(query.name || '')
    .trim()
    .slice(0, 150);
  if (!phones.length && name.length < 3) return { data: [], total: 0 };
  const params = [];
  const phoneWhere = (alias, fields) =>
    fields
      .map((field) => {
        params.push(...phones);
        return `${alias}.dup_${field} IN (${phones.map(() => '?').join(',')})`;
      })
      .join(' OR ');
  const condition = (alias, fields) => {
    if (phones.length) return `(${phoneWhere(alias, fields)})`;
    params.push(`%${name.replace(/[\\%_]/g, '\\$&')}%`);
    return `LOWER(${alias}.customer_name) LIKE LOWER(?)`;
  };
  const unions = [
    `SELECT 'lead' kind,l.id,l.customer_name,l.mobile_number,l.city,l.status,l.assigned_to,l.created_at,l.lead_code code,l.id lead_id,l.customer_id,
      COALESCE(CONCAT('c',l.customer_id),CONCAT('c',(SELECT cc.id FROM customers cc WHERE cc.lead_id=l.id LIMIT 1)),CONCAT('l',l.id)) group_key,2 rank_value
      FROM leads l WHERE l.is_deleted=0 AND ${condition('l', ['mobile_number', 'alternate_number'])}`,
    `SELECT 'customer',c.id,c.customer_name,c.mobile_number,c.city,c.status,c.assigned_to,c.created_at,c.customer_code,c.lead_id,c.id,CONCAT('c',c.id),1
      FROM customers c WHERE ${condition('c', ['mobile_number', 'alternate_number'])}`,
    `SELECT 'project',p.id,p.customer_name,p.customer_phone,p.city,p.stage,p.assigned_to,p.created_at,p.project_number,p.lead_id,p.customer_id,
      COALESCE(CONCAT('c',p.customer_id),CONCAT('c',(SELECT ll.customer_id FROM leads ll WHERE ll.id=p.lead_id)),CONCAT('l',p.lead_id),CONCAT('p',p.id)),3
      FROM projects p WHERE p.is_deleted=0 AND ${condition('p', ['customer_phone'])}`,
  ];
  let exclude = '';
  if (query.exclude_id && ['lead', 'customer'].includes(query.exclude_type)) {
    const table = query.exclude_type === 'lead' ? 'leads' : 'customers';
    const [[self]] = await db.query(`SELECT * FROM ${table} WHERE id=?`, [query.exclude_id]);
    if (self) {
      const lead = query.exclude_type === 'lead' ? self.id : self.lead_id;
      const customer = query.exclude_type === 'customer' ? self.id : self.customer_id;
      exclude =
        ' WHERE NOT ((kind=? AND id=?) OR (lead_id IS NOT NULL AND lead_id=?) OR (customer_id IS NOT NULL AND customer_id=?))';
      params.push(query.exclude_type, self.id, lead || 0, customer || 0);
    }
  }
  const limit = phones.length ? 50 : 5;
  const [rows] = await db.query(
    `WITH matches AS (${unions.join(' UNION ALL ')}), filtered AS (SELECT * FROM matches${exclude}),
    ranked AS (SELECT *,ROW_NUMBER() OVER(PARTITION BY group_key ORDER BY rank_value,id) rn FROM filtered)
    SELECT r.*,u.full_name owner_name,u.manager_id,COUNT(*) OVER() total_count,
      (SELECT COUNT(*) FROM lead_followups f WHERE f.lead_id=r.lead_id) contact_count
    FROM ranked r LEFT JOIN users u ON u.id=r.assigned_to WHERE rn=1 ORDER BY r.created_at DESC,r.id DESC LIMIT ${limit}`,
    params
  );
  const data = rows.map((row) => {
    const allowed =
      Number(user.role_id) === 1 ||
      (Number(user.role_id) === 2 && Number(row.manager_id) === Number(user.id)) ||
      (Number(user.role_id) === 3 && Number(row.assigned_to) === Number(user.id)) ||
      (user.portal_role === 'finance' && row.kind === 'customer');
    return {
      kind: row.kind,
      id: row.id,
      name: row.customer_name,
      phone: phones.length && allowed ? row.mobile_number : mask(row.mobile_number),
      city: row.city,
      status: row.status,
      owner: row.owner_name || 'Unassigned',
      created_at: row.created_at,
      code: row.code,
      contact_count: Number(row.contact_count || 0),
      can_open: allowed,
      can_reopen: allowed && row.kind === 'lead' && ['Lost', 'Not Interested'].includes(row.status),
      lead_id: row.lead_id || null,
    };
  });
  return { data, total: Number(rows[0]?.total_count || 0) };
}

function mask(value) {
  const digits = String(value || '')
    .replace(/\D/g, '')
    .slice(-10);
  return digits.length === 10 ? `${digits.slice(0, 5)}xxx${digits.slice(-2)}` : 'Hidden';
}

async function locked(db, data, work, extraLocks = []) {
  data.mobile_number = normalize(data.mobile_number);
  if (data.alternate_number != null) data.alternate_number = normalize(data.alternate_number, true);
  return lockedPhones(db, [data.mobile_number, data.alternate_number, ...extraLocks], work);
}

async function lockedPhones(db, phones, work) {
  await ensure(db);
  const connection = await db.getConnection();
  const [[database]] = await connection.query('SELECT DATABASE() db');
  const keys = [...new Set(phones.filter(Boolean))]
    .sort()
    .map(
      (phone) =>
        'dup:' +
        crypto.createHash('sha256').update(`${database.db}:${phone}`).digest('hex').slice(0, 54)
    );
  const held = [];
  try {
    for (const key of keys) {
      const [[row]] = await connection.query('SELECT GET_LOCK(?,10) acquired', [key]);
      if (Number(row.acquired) !== 1) fail('This number is being saved. Please retry.', 409);
      held.push(key);
    }
    // One leased connection per request avoids exhausting a five-connection tenant pool.
    const lease = new Proxy(connection, {
      get(target, key) {
        if (key === 'deferCustomerLink') return true;
        if (key === 'getConnection') return async () => lease;
        if (key === 'release') return () => {};
        const value = Reflect.get(target, key, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
    ready.set(lease, Promise.resolve());
    return await work(lease);
  } finally {
    for (const key of held.reverse()) await connection.query('SELECT RELEASE_LOCK(?)', [key]);
    connection.release();
  }
}

async function check(db, data, user, type, id) {
  const result = await search(
    db,
    {
      phone: data.mobile_number,
      alternate: data.alternate_number,
      exclude_type: type,
      exclude_id: id,
    },
    user
  );
  if (!result.total) return [];
  if (data.duplicate_override !== true)
    fail(
      'This number already exists. Open the existing record or confirm why a new record is needed.',
      409,
      { code: 'DUPLICATE_RECORD', duplicates: result }
    );
  if (data.duplicate_reason && !reasons.includes(data.duplicate_reason))
    fail('Choose a valid duplicate reason.');
  if (Number(user.role_id) !== 1 && !reasons.includes(data.duplicate_reason))
    fail('Choose a reason before creating a possible duplicate.');
  if (data.duplicate_reason === 'Other' && !String(data.duplicate_remarks || '').trim())
    fail('Enter remarks for Other.');
  if (data.duplicate_remarks != null && typeof data.duplicate_remarks !== 'string')
    fail('Duplicate remarks must be text.');
  if (String(data.duplicate_remarks || '').length > 1000)
    fail('Duplicate remarks must be under 1000 characters.');
  return result.data;
}

async function record(db, type, id, matches, data, user) {
  for (const match of matches) {
    const reason = data.duplicate_reason || 'Admin override';
    await db.query(
      'INSERT INTO crm_duplicate_links(record_type,record_id,original_type,original_id,reason,remarks,created_by) VALUES (?,?,?,?,?,?,?)',
      [type, id, match.kind, match.id, reason, data.duplicate_remarks || null, user.id]
    );
    await db.query(
      "INSERT INTO crm_duplicate_audit(action,record_type,record_id,original_type,original_id,reason,performed_by) VALUES ('override',?,?,?,?,?,?)",
      [type, id, match.kind, match.id, `${reason}: ${data.duplicate_remarks || ''}`, user.id]
    );
    const note = `Possible duplicate: ${type} #${id}, ${match.kind} #${match.id}; by user #${user.id}; reason: ${reason}. ${data.duplicate_remarks || ''}`;
    for (const leadId of new Set([type === 'lead' ? id : null, match.lead_id].filter(Boolean))) {
      await db.query(
        "INSERT INTO lead_activity_logs(lead_id,action_type,remark,performed_by) VALUES (?,'Possible Duplicate',?,?)",
        [leadId, note, user.id]
      );
    }
    const table =
      match.kind === 'lead' ? 'leads' : match.kind === 'customer' ? 'customers' : 'projects';
    const [[owner]] = await db.query(`SELECT assigned_to FROM ${table} WHERE id=?`, [match.id]);
    if (owner?.assigned_to)
      await require('./notificationService').sendToUser(
        owner.assigned_to,
        {
          title: 'Possible duplicate enquiry',
          body: note,
          type: 'lead_duplicate',
          referenceId: match.lead_id || null,
        },
        db
      );
  }
}

async function transaction(connection, work) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await connection.beginTransaction();
    try {
      const result = await work();
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      if (!['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(error.code) || attempt === 2)
        throw error;
      await new Promise((resolve) => setTimeout(resolve, 30 * (attempt + 1)));
    }
  }
}

async function decorate(db, type, rows) {
  if (!rows?.length) return rows;
  await ensure(db);
  const [links] = await db.query(
    'SELECT record_id,original_type,original_id,reason FROM crm_duplicate_links WHERE record_type=? AND record_id IN (?) AND resolved_at IS NULL',
    [type, rows.map((r) => r.id)]
  );
  for (const row of rows) {
    row.duplicate_links = links.filter((link) => Number(link.record_id) === Number(row.id));
    row.possible_duplicate = row.duplicate_links.length > 0;
  }
  return rows;
}

module.exports = {
  decorate,
  lockedPhones,
  transaction,
  ensure,
  normalize,
  mask,
  search,
  locked,
  check,
  record,
  reasons,
  fail,
};
