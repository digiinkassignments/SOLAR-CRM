// Re-read the current role on every request. A previously issued JWT cannot retain edit rights.
async function currentAccess(req, res, next) {
  try {
    const [[user]] = await req.db.query(
      `SELECT u.id,u.role_id,u.status,u.is_deleted,r.role_name FROM users u
       JOIN roles r ON r.id=u.role_id WHERE u.id=? LIMIT 1`,
      [req.user.id]
    );
    if (!user || user.is_deleted || user.status !== 'Active')
      return res
        .status(403)
        .json({ success: false, message: 'Your account no longer has access.' });
    req.subsidyAccess = {
      can_edit: Number(user.role_id) === 1 || user.role_name === 'Application Manager',
      is_admin: Number(user.role_id) === 1,
      role_id: Number(user.role_id),
      user_id: user.id,
      can_view_all:
        Number(user.role_id) === 1 || ['Application Manager', 'Finance'].includes(user.role_name),
    };
    if (
      req.method === 'GET' &&
      !req.subsidyAccess.can_view_all &&
      ![2, 3, 4].includes(Number(user.role_id))
    )
      return res
        .status(403)
        .json({ success: false, message: 'Subsidy records are not available in your role.' });
    if (req.method !== 'GET' && !req.subsidyAccess.can_edit) {
      await require('../services/subsidySyncSchema').ensure(req.db);
      const endpoint = String(req.path.split('/').filter(Boolean)[0] || 'tracker')
        .replace(/[^a-z-]/gi, '')
        .slice(0, 32);
      await req.db.query('INSERT INTO subsidy_access_audit(actor_id,action) VALUES (?,?)', [
        user.id,
        `denied_${req.method}_${endpoint}`,
      ]);
      return res
        .status(403)
        .json({
          success: false,
          message: 'Only Application Manager and Super Admin can edit the Subsidy Tracker.',
        });
    }
    next();
  } catch (error) {
    console.error('Subsidy access check:', error.code || error.message);
    res
      .status(503)
      .json({ success: false, message: 'Unable to verify subsidy permissions. Please retry.' });
  }
}
async function canReadKey(db, key, access) {
  if (access.can_view_all) return true;
  const userId = Number(access.user_id);
  if (!Number.isSafeInteger(userId) || userId <= 0) return false;
  const direct = /^project-\d+$/.test(String(key));
  if (access.role_id === 4) {
    const assigned = require('../services/field/workflow').assignedLeadSQL(userId);
    const [[row]] = direct
      ? await db.query(
          `SELECT id FROM projects WHERE id=? AND is_deleted=0 AND (assigned_to=? OR lead_id IN (${assigned}))`,
          [Number(key.slice(8)), userId]
        )
      : await db.query(`SELECT id FROM leads WHERE id=? AND is_deleted=0 AND id IN (${assigned})`, [
          key,
        ]);
    return Boolean(row);
  }
  if (direct) return false;
  return Boolean(
    await require('../services/salesWorkflow').scopedLead(db, key, {
      id: userId,
      role_id: access.role_id,
    })
  );
}
function protect(data, access) {
  if (!data || typeof data !== 'object') return data;
  const result = structuredClone(data);
  result.can_edit = Boolean(access?.can_edit);
  if (result.can_edit) return result;
  const redact = (value) => {
    if (!value || typeof value !== 'object') return;
    for (const key of Object.keys(value)) {
      if (/bank_account|bank_ifsc|aadhaar|aadhar|utr_number|signature_data/i.test(key))
        value[key] = null;
      else if (
        [
          'file_url',
          'file_name',
          'portal_notes',
          'rejection_reason',
          'fix_task',
          'remark',
        ].includes(key)
      )
        value[key] = null;
      else redact(value[key]);
    }
  };
  redact(result);
  return result;
}
module.exports = { currentAccess, protect, canReadKey };
