import { useNavigate } from "react-router-dom";
import {workspacePrefix} from "../utils/portalRoles";
import { useAuth } from "../context/AuthContext";

export function workspacePath(path, manager) {
  if (!manager || typeof path !== "string" || !/^\/(field-work|dashboard|leads|customers|calculator|quotations|invoices|loans|subsidies|projects|stock|reports|settings|profile|team|followups)([/?#]|$)/.test(path)) return path;
  return `/manager${path}`;
}

export default function useWorkspaceNavigate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  return (path, options) => {
    let target=workspacePath(path, Number(user?.role_id)===2);
    if(typeof target==='string')target=target.replace(/^\/(dashboard|customers|calculator|quotations|invoices|loans|subsidies|stock|profile)(?=[/?#]|$)/, match=>`${workspacePrefix(user)}${match}`);
    return navigate(target,options);
  };
}
