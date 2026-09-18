import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

import Login          from "../pages/Auth/Login";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword  from "../pages/Auth/ResetPassword";
import PaymentPage from "../pages/Subscription/PaymentPage";
import PrivateRoute from "./PrivateRoute";
import AdminLayout   from "../layouts/AdminLayout";
import ManagerLayout from "../layouts/ManagerLayout";
import SalesLayout   from "../layouts/SalesLayout";
import Dashboard from "../pages/Dashboard/Dashboard";
import Users     from "../pages/Users/Users";
import Leads     from "../pages/Leads/Leads";
import Reports   from "../pages/Reports/Reports";
import Settings  from "../pages/Settings/Settings";
import Profile   from "../pages/Profile/Profile";
import ManagerDashboard from "../pages/Manager/ManagerDashboard";
import TeamMembers      from "../pages/Manager/TeamMembers";
import ManagerLeads     from "../pages/Manager/ManagerLeads";
import ManagerProfile   from "../pages/Manager/ManagerProfile";
import TeamFollowups    from "../pages/Manager/TeamFollowups";
import ManagerReports   from "../pages/Manager/ManagerReports";
import SalesDashboard from "../pages/Sales/SalesDashboard";
import SalesLeads     from "../pages/Sales/SalesLeads";
import SalesProfile   from "../pages/Sales/SalesProfile";

const SubscriptionGuard = ({ children }) => {
  const { user, token } = useAuth();
  const [subStatus, setSubStatus] = useState("Active");
  const [checking, setChecking] = useState(true);

  const checkStatus = async () => {
    if (!token || !user) return;
    try {
      const res = await axios.get("/api/subscription/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const live = res.data?.data?.status;
      localStorage.setItem("subscription_status", live || "Active");
      setSubStatus(live || "Active");
    } catch {
      setSubStatus(localStorage.getItem("subscription_status") || "Active");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token, user]);

  if (checking) return null;

  if (subStatus === "Locked" || subStatus === "Deleted") {
    return <Navigate to="/payment" replace />;
  }

  return children;
};

const HomeOrLogin = () => {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (token && user) {
      const role = (user?.role_name || user?.role || "").toLowerCase();
      if (role.includes("manager")) {
        navigate("/manager/dashboard", { replace: true });
      } else if (role.includes("sales")) {
        navigate("/sales/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [token, user, loading, navigate]);

  if (loading) return null;
  if (!token || !user) return <Login />;
  return null;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                element={<HomeOrLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/payment"         element={<PaymentPage />} />

        <Route element={<PrivateRoute allowedRoles={["Admin", "Super Admin"]} />}>
          <Route element={<SubscriptionGuard><AdminLayout /></SubscriptionGuard>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users"     element={<Users />} />
            <Route path="/leads"     element={<Leads />} />
            <Route path="/reports"   element={<Reports />} />
            <Route path="/settings"  element={<Settings />} />
            <Route path="/profile"   element={<Profile />} />
          </Route>
        </Route>

        <Route element={<PrivateRoute allowedRoles={["Manager", "Team Manager"]} />}>
          <Route element={<SubscriptionGuard><ManagerLayout /></SubscriptionGuard>}>
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/manager/team"      element={<TeamMembers />} />
            <Route path="/manager/leads"     element={<ManagerLeads />} />
            <Route path="/manager/followups" element={<TeamFollowups />} />
            <Route path="/manager/reports"   element={<ManagerReports />} />
            <Route path="/manager/profile"   element={<ManagerProfile />} />
          </Route>
        </Route>

        <Route element={<PrivateRoute allowedRoles={["Sales Executive", "Salesperson", "Sales"]} />}>
          <Route element={<SubscriptionGuard><SalesLayout /></SubscriptionGuard>}>
            <Route path="/sales/dashboard" element={<SalesDashboard />} />
            <Route path="/sales/leads"     element={<SalesLeads />} />
            <Route path="/sales/profile"   element={<SalesProfile />} />
          </Route>
        </Route>

        <Route path="*" element={<HomeOrLogin />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
