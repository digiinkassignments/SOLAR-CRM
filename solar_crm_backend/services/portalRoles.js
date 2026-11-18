const PORTAL_NAMES = Object.freeze({ Finance: 'finance', 'Application Manager': 'application-manager' });
const portalRole = name => PORTAL_NAMES[name] || null;
const permissions = {
  finance: ['dashboard:view','stock:view','stock:create','stock:edit','stock:delete','quotations:view','quotations:create','quotations:edit','quotations:delete','invoices:view','invoices:create','invoices:edit','invoices:delete','calculator:view','calculator:use','customers:view','customers:create','customers:edit'],
  'application-manager': ['dashboard:view','subsidies:view','subsidies:edit','loans:view','loans:edit']
};
async function ensurePortalRoles(db) {
  for (const [name,key] of Object.entries(PORTAL_NAMES)) {
    const [existing] = await db.query('SELECT id,is_system FROM roles WHERE role_name=? LIMIT 1',[name]);
    if (existing.length) {
      if (!Number(existing[0].is_system)) throw Error('Reserved portal role name already used by a custom role: '+name);
      continue;
    }
    await db.query('INSERT INTO roles(role_name,description,permissions,is_system,status) SELECT ?,?,?,1,? WHERE NOT EXISTS (SELECT 1 FROM roles WHERE role_name=?)',[
      name,key==='finance'?'Stock, quotations, invoices, calculator and customers':'Subsidy and solar loan applications',JSON.stringify(permissions[key]),'Active',name
    ]);
  }
}
// Supporting lookups are read-only; administration and unrelated workspaces stay blocked.
function allowed(role, method, pathname) {
  const p=pathname.replace(/\/+$/,'') || '/', read=method==='GET';
  if (/^\/api\/profile(?:\/|$)/.test(p)) return true;
  if (read && ['/api/auth/me','/api/auth/tenant-info','/api/subscription/status','/api/portals/dashboard'].includes(p)) return true;
  if (method==='POST' && p==='/api/auth/change-password') return true;
  if (read && /^\/api\/notifications(?:\/(unread-count))?$/.test(p)) return true;
  if (method==='PATCH' && /^\/api\/notifications\/(mark-all-read|\d+\/read)$/.test(p)) return true;
  if (method==='PUT' && p==='/api/users/fcm-token') return true;
  if (read && (p==='/api/settings' || /^\/api\/leads(?:\/\d+)?$/.test(p))) return true;
  if (role==='finance') {
    if (/^\/api\/(stock|quotations|invoices|customers|calculator)(?:\/|$)/.test(p)) return true;
    if (read && /^\/api\/quotation-governance\/(pending|\d+\/revisions)$/.test(p)) return true;
  }
  if (role==='application-manager' && /^\/api\/(subsidy|loans)(?:\/|$)/.test(p)) return true;
  return false;
}
module.exports={portalRole,ensurePortalRoles,allowed,permissions};
