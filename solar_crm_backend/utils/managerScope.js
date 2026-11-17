// Scope is attached to a request-local database facade, never to the shared pool.
const managerId = db => Number.isSafeInteger(db?.managerScopeId) && db.managerScopeId > 0 ? db.managerScopeId : null;
const team = id => `SELECT id FROM users WHERE manager_id=${Number(id)} AND role_id=3 AND is_deleted=0`;
const leadFor = (id, alias='l') => `${alias}.is_deleted=0 AND ${alias}.assigned_to IN (${team(id)})`;
const lead = (db, alias='l') => managerId(db) ? ` AND ${leadFor(managerId(db),alias)}` : '';
const linked = (db, expression) => managerId(db) ? ` AND ${expression} IN (SELECT ml.id FROM leads ml WHERE ${leadFor(managerId(db),'ml')})` : '';
const facades=new WeakMap();
function facade(pool,id) {
  let cache=facades.get(pool);if(!cache){cache=new Map();facades.set(pool,cache);}
  if(!cache.has(id))cache.set(id,new Proxy(pool,{get(target,key){if(key==='managerScopeId')return id;const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}}));
  return cache.get(id);
}
module.exports={managerId,team,leadFor,lead,linked,facade};
