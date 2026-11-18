export function portalRole(user) {
  const name=String(user?.role_name || user?.role || '').trim().toLowerCase();
  return name==='finance'?'finance':name==='application manager'?'application-manager':null;
}
export function workspacePrefix(user) {
  const role=portalRole(user);
  return role==='finance'?'/finance':role==='application-manager'?'/applications':Number(user?.role_id)===2?'/manager':'';
}
export function homePath(user) {
  const prefix=workspacePrefix(user);
  if(prefix)return `${prefix}/dashboard`;
  const role=String(user?.role_name || user?.role || '').toLowerCase();
  return role.includes('sales')?'/sales/dashboard':role.includes('engineer')?'/engineer/dashboard':'/dashboard';
}
