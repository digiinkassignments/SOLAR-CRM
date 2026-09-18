import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import usePlanFeatures from "../hooks/usePlanFeatures";

// Feature key mapping — kaunsa route kaunse plan feature se lock hai
const routeFeatureMap = {
  "/reports":          "has_reports",
  "/manager/reports":  "has_reports",
};

const PrivateRoute = ({ allowedRoles = [] }) => {
  const { user, token, loading } = useAuth();
  const { can } = usePlanFeatures();

  // 1. Context re-hydration wait
  if (loading) return null;

  // 2. Unauthenticated → Login
  if (!token || !user) return <Navigate to="/" replace />;

  // 3. Open access routes
  if (!allowedRoles || allowedRoles.length === 0) return <Outlet />;

  // 4. Role check
  const userRole = (user?.role_name || user?.role || "").toLowerCase().trim();
  const isAllowed = allowedRoles.some((role) => {
    const target = role.toLowerCase().trim();
    return userRole.includes(target) || target.includes(userRole);
  });

  if (!isAllowed) {
    if (userRole.includes("manager")) return <Navigate to="/manager/dashboard" replace />;
    if (userRole.includes("sales"))   return <Navigate to="/sales/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  // 5. Plan feature check — URL se bhi lock
  const currentPath = window.location.pathname;
  const requiredFeature = routeFeatureMap[currentPath];
  if (requiredFeature && !can(requiredFeature)) {
    // Role ke hisaab se dashboard pe bhejo
    if (userRole.includes("manager")) return <Navigate to="/manager/dashboard" replace />;
    if (userRole.includes("sales"))   return <Navigate to="/sales/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;