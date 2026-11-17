const jwt = require('jsonwebtoken');
const facades = new WeakMap();
module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return next();
  let user;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return next();
  }
  if (Number(user.role_id) !== 4) return next();
  if (req.clientInfo?.id && user?.client_id && Number(user.client_id) !== Number(req.clientInfo.id)) return res.status(403).json({
    success: false,
    message: 'Sign out and sign in to this company again.'
  });
  const id = Number(user.id);
  if (!Number.isSafeInteger(id) || id <= 0) return res.sendStatus(403);
  const base = req.db;
  let cache = facades.get(base);
  if (!cache) {
    cache = new Map();
    facades.set(base, cache);
  }
  if (!cache.has(id)) cache.set(id, new Proxy(base, {
    get(t, k) {
      if (k === 'engineerScopeId') return id;
      const v = Reflect.get(t, k, t);
      return typeof v === 'function' ? v.bind(t) : v;
    }
  }));
  req.db = cache.get(id);
  const p = req.path;
  const roleAllowed = p.startsWith('/api/field-work') || p.startsWith('/api/surveys') || p.startsWith('/api/profile') || p.startsWith('/api/auth/') || p.startsWith('/api/notifications') || p === '/api/subscription/status' || p === '/api/users/fcm-token' || p === '/api/dashboard/engineer';
  const assigned = require('../services/field/workflow').assignedLeadSQL(id);
  try {
    const [[active]] = await base.query("SELECT id FROM users WHERE id=? AND role_id=4 AND is_deleted=0 AND status='Active'", [id]);
    if (!active) return res.sendStatus(401);
    if (roleAllowed) return next();
    if (p.startsWith('/api/projects')) {
      if (req.method === 'POST' && (p === '/api/projects' || /^\/api\/projects\/\d+$/.test(p))) {
        return res.status(403).json({
          success: false,
          message: 'Project creation is restricted to Managers and Admins.'
        });
      }
      if (req.method === 'DELETE') {
        return res.status(403).json({
          success: false,
          message: 'Deleting projects is restricted.'
        });
      }
      return next();
    }
    if (p === '/api/settings' && req.method === 'GET') {
      const [rows] = await base.query('SELECT company_name,company_logo FROM settings LIMIT 1');
      return res.json({
        success: true,
        data: rows[0] || {}
      });
    }
    if (p === '/api/leads' && req.method === 'GET') {
      const [rows] = await base.query(`SELECT id,lead_code,customer_name,mobile_number,address,city,state,required_kw FROM leads WHERE is_deleted=0 AND id IN (${assigned}) ORDER BY id DESC LIMIT 200`);
      return res.json({
        success: true,
        data: rows,
        total: rows.length,
        page: 1,
        limit: 200
      });
    }
    if (p.startsWith('/api/calculator')) {
      if (req.body?.lead_id) {
        const [rows] = await base.query(`SELECT id FROM leads WHERE id=? AND is_deleted=0 AND id IN (${assigned})`, [req.body.lead_id]);
        if (!rows.length) return res.sendStatus(404);
      }
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Use your assigned Field Workspace. Commercial and company administration access is restricted.'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Assigned-work access check unavailable.'
    });
  }
};
