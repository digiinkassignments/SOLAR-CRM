import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

import Login          from "../pages/Auth/Login";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword  from "../pages/Auth/ResetPassword";
import PaymentPage from "../pages/Subscription/PaymentPage";
import ChangePassword from "../pages/Auth/ChangePassword";
import PrivateRoute from "./PrivateRoute";
import AdminLayout   from "../layouts/AdminLayout";
import ManagerLayout from "../layouts/ManagerLayout";
import SalesLayout   from "../layouts/SalesLayout";
import Dashboard from "../pages/Dashboard/Dashboard";
import Users     from "../pages/Users/Users";
import Leads     from "../pages/Leads/Leads";
import TodayFollowups from "../pages/Leads/TodayFollowups";
import BirthdayEvents from "../pages/Leads/BirthdayEvents";
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

import SolarCalculator from "../pages/Calculator/SolarCalculator";
import QuotationList   from "../pages/Quotations/QuotationList";
import DynamicWebQuotationView from "../pages/Quotations/DynamicWebQuotationView";
import InvoiceList from "../pages/Invoices/InvoiceList";
import DynamicInvoiceView from "../pages/Invoices/DynamicInvoiceView";

import StockList from "../pages/Stock/StockList";
import StockDetail from "../pages/Stock/StockDetail";
import StockTransactions from "../pages/Stock/StockTransactions";
import StockAlerts from "../pages/Stock/StockAlerts";
import ProjectsList from "../pages/Admin/Projects/ProjectsList";
import ProjectDetail from "../pages/Admin/Projects/ProjectDetail";
import ProcurementList from "../pages/Admin/Procurement/ProcurementList";
import SubsidyTracker from "../pages/Admin/Subsidy/SubsidyTracker";
import SubsidyDetail from "../pages/Admin/Subsidy/SubsidyDetail";

const SubscriptionGuard = ({ children }) => {
  const { user, token } = useAuth();
  const [subStatus, setSubStatus] = useState("Active");
  const [checking, setChecking] = useState(true);

  const checkStatus = async () => {
    if (!token || !user) return;
    try {
      const res = await api.get("/subscription/status");
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
      if (user?.is_password_changed === 0) {
      navigate("/change-password", { replace: true });
      return;
    }
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
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/quote/:token" element={<DynamicWebQuotationView />} />
        <Route path="/invoice/:token" element={<DynamicInvoiceView />} />

        <Route element={<PrivateRoute allowedRoles={["Admin", "Super Admin"]} />}>
          <Route element={<SubscriptionGuard><AdminLayout /></SubscriptionGuard>}>
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/users"      element={<Users />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/today-followups" element={<TodayFollowups />} />
            <Route path="/leads/birthdays" element={<BirthdayEvents />} />
            <Route path="/calculator" element={<SolarCalculator />} />
            <Route path="/quotations" element={<QuotationList />} />
            <Route path="/invoices"   element={<InvoiceList />} />
            <Route path="/projects"   element={<ProjectsList />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/procurement" element={<ProcurementList />} />
            <Route path="/subsidies"   element={<SubsidyTracker />} />
            <Route path="/subsidies/:leadId" element={<SubsidyDetail />} />
            <Route path="/stock"              element={<StockList />} />
            <Route path="/stock/transactions" element={<StockTransactions />} />
            <Route path="/stock/alerts"       element={<StockAlerts />} />
            <Route path="/stock/:id"          element={<StockDetail />} />
            <Route path="/reports"    element={<Reports />} />
            <Route path="/settings"   element={<Settings />} />
            <Route path="/profile"    element={<Profile />} />
          </Route>
        </Route>

        <Route element={<PrivateRoute allowedRoles={["Manager", "Team Manager"]} />}>
          <Route element={<SubscriptionGuard><ManagerLayout /></SubscriptionGuard>}>
            <Route path="/manager/dashboard"  element={<ManagerDashboard />} />
            <Route path="/manager/team"       element={<TeamMembers />} />
            <Route path="/manager/leads"      element={<ManagerLeads />} />
            <Route path="/manager/calculator" element={<SolarCalculator />} />
            <Route path="/manager/quotations" element={<QuotationList />} />
            <Route path="/manager/invoices"   element={<InvoiceList />} />
            <Route path="/manager/followups"  element={<TeamFollowups />} />
            <Route path="/manager/reports"    element={<ManagerReports />} />
            <Route path="/manager/profile"    element={<ManagerProfile />} />
          </Route>
        </Route>

        <Route element={<PrivateRoute allowedRoles={["Sales Executive", "Salesperson", "Sales"]} />}>
          <Route element={<SubscriptionGuard><SalesLayout /></SubscriptionGuard>}>
            <Route path="/sales/dashboard"  element={<SalesDashboard />} />
            <Route path="/sales/leads"      element={<SalesLeads />} />
            <Route path="/sales/calculator" element={<SolarCalculator />} />
            <Route path="/sales/quotations" element={<QuotationList />} />
            <Route path="/sales/invoices"   element={<InvoiceList />} />
            <Route path="/sales/profile"    element={<SalesProfile />} />
          </Route>
        </Route>

        <Route path="*" element={<HomeOrLogin />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
