import FieldWorkspace from "../pages/Engineer/field/FieldWorkspace";
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

import EngineerLayout    from "../layouts/EngineerLayout";

import SolarCalculator from "../pages/Calculator/SolarCalculator";
import QuotationList   from "../pages/Quotations/QuotationList";
import DynamicWebQuotationView from "../pages/Quotations/DynamicWebQuotationView";
import InvoiceList from "../pages/Invoices/InvoiceList";
import DynamicInvoiceView from "../pages/Invoices/DynamicInvoiceView";
import CustomerReviewPage from "../pages/Public/CustomerReviewPage";

import StockList from "../pages/Stock/StockList";
import StockDetail from "../pages/Stock/StockDetail";
import StockTransactions from "../pages/Stock/StockTransactions";
import StockAlerts from "../pages/Stock/StockAlerts";
import ProjectsList from "../pages/Admin/Projects/ProjectsList";
import ProjectDetail from "../pages/Admin/Projects/ProjectDetail";
import SubsidyDetail from "../pages/Admin/Subsidy/SubsidyDetail";
import CustomersList from "../pages/Customers/CustomersList";
import CustomerDetail from "../pages/Customers/CustomerDetail";
import FinancingHub from "../pages/Finance/FinancingHub";

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
      } else if (role.includes("engineer")) {
        navigate("/engineer/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [token, user, loading, navigate]);

  if (loading) return null;
  if (!token || !user) return <Login />;
  return null;
};

function RedirectToProject() {
  const { id } = useParams();
  return <Navigate to={`/projects/${id}`} replace />;
}
function RedirectToManagerProject() {
  const { id } = useParams();
  return <Navigate to={`/manager/projects/${id}`} replace />;
}
function RedirectToEngineerProject() {
  const { id } = useParams();
  return <Navigate to={`/engineer/projects/${id}`} replace />;
}

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
        <Route path="/review/:token" element={<CustomerReviewPage />} />
        <Route path="/handover-review/:token" element={<CustomerReviewPage />} />

        <Route element={<PrivateRoute allowedRoles={["Admin", "Super Admin"]} />}>
          <Route element={<SubscriptionGuard><AdminLayout /></SubscriptionGuard>}>
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/users"      element={<Users />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/today-followups" element={<TodayFollowups />} />
            <Route path="/leads/birthdays" element={<BirthdayEvents />} />
            <Route path="/customers"   element={<CustomersList />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/calculator" element={<SolarCalculator />} />
            <Route path="/quotations" element={<QuotationList />} />
            <Route path="/invoices"   element={<InvoiceList />} />
            <Route path="/loans" element={<Navigate to="/subsidies/loans" replace />} />
            <Route path="/projects"   element={<ProjectsList />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/projects/:id/field" element={<RedirectToProject />} />
            <Route path="/subsidies" element={<FinancingHub />} />
            <Route path="/subsidies/loans" element={<FinancingHub />} />
            <Route path="/subsidies/:leadId" element={<SubsidyDetail />} />
            <Route path="/stock"              element={<StockList />} />
            <Route path="/stock/transactions" element={<StockTransactions />} />
            <Route path="/stock/alerts"       element={<StockAlerts />} />
            <Route path="/stock/:id"          element={<StockDetail />} />
            <Route path="/field-work" element={<FieldWorkspace />} />
<Route path="/field-work/tasks" element={<FieldWorkspace mode="tasks" />} />
<Route path="/field-work/projects" element={<FieldWorkspace mode="projects" />} />
<Route path="/field-work/surveys" element={<FieldWorkspace mode="surveys" />} />
<Route path="/field-work/surveys/:id" element={<FieldWorkspace resourceType="survey" />} />
            <Route path="/reports"    element={<Reports />} />
            <Route path="/settings"   element={<Settings />} />
            <Route path="/profile"    element={<Profile />} />
          </Route>
        </Route>

        <Route element={<PrivateRoute allowedRoles={["Manager", "Team Manager"]} />}>
          <Route element={<SubscriptionGuard><ManagerLayout /></SubscriptionGuard>}>
            <Route path="/manager/dashboard"  element={<ManagerDashboard />} />
            <Route path="/manager/team"       element={<TeamMembers />} />
            <Route path="/manager/leads" element={<Leads />} />
            <Route path="/manager/leads/today-followups" element={<TodayFollowups />} />
            <Route path="/manager/leads/birthdays" element={<BirthdayEvents />} />
            <Route path="/manager/customers"  element={<CustomersList />} />
            <Route path="/manager/customers/:id" element={<CustomerDetail />} />
            <Route path="/manager/calculator" element={<SolarCalculator />} />
            <Route path="/manager/quotations" element={<QuotationList />} />
            <Route path="/manager/invoices"   element={<InvoiceList />} />
            <Route path="/manager/loans" element={<Navigate to="/manager/subsidies/loans" replace />} />
            <Route path="/manager/subsidies" element={<FinancingHub />} />
            <Route path="/manager/subsidies/loans" element={<FinancingHub />} />
            <Route path="/manager/subsidies/:leadId" element={<SubsidyDetail />} />
            <Route path="/manager/projects"   element={<ProjectsList />} />
            <Route path="/manager/projects/:id" element={<ProjectDetail />} />
            <Route path="/manager/projects/:id/field" element={<RedirectToManagerProject />} />
            <Route path="/manager/followups"  element={<TeamFollowups />} />
            <Route path="/manager/field-work" element={<FieldWorkspace />} />
<Route path="/manager/field-work/tasks" element={<FieldWorkspace mode="tasks" />} />
<Route path="/manager/field-work/projects" element={<FieldWorkspace mode="projects" />} />
<Route path="/manager/field-work/surveys" element={<FieldWorkspace mode="surveys" />} />
<Route path="/manager/field-work/surveys/:id" element={<FieldWorkspace resourceType="survey" />} />
            <Route path="/manager/reports" element={<Reports />} />
            <Route path="/manager/reports/team" element={<ManagerReports />} />
            <Route path="/manager/settings" element={<Settings />} />
            <Route path="/manager/stock" element={<StockList />} />
            <Route path="/manager/stock/transactions" element={<StockTransactions />} />
            <Route path="/manager/stock/alerts" element={<StockAlerts />} />
            <Route path="/manager/stock/:id" element={<StockDetail />} />
            <Route path="/manager/profile"    element={<ManagerProfile />} />
          </Route>
        </Route>

        <Route element={<PrivateRoute allowedRoles={["Sales Executive", "Salesperson", "Sales"]} />}>
          <Route element={<SubscriptionGuard><SalesLayout /></SubscriptionGuard>}>
            <Route path="/sales/dashboard"  element={<SalesDashboard />} />
            <Route path="/sales/leads"      element={<SalesLeads />} />
            <Route path="/sales/followups" element={<Navigate to="/sales/leads/today-followups" replace />} />
            <Route path="/sales/leads/today-followups" element={<TodayFollowups salesMode />} />
            <Route path="/sales/leads/birthdays" element={<BirthdayEvents salesMode />} />
            <Route path="/sales/calculator" element={<SolarCalculator />} />
            <Route path="/sales/quotations" element={<QuotationList />} />
            <Route path="/sales/invoices"   element={<InvoiceList />} />
            <Route path="/sales/profile"    element={<SalesProfile />} />
          </Route>
        </Route>

        <Route element={<PrivateRoute allowedRoles={["Site Engineer", "Engineer"]} />}>
          <Route element={<SubscriptionGuard><EngineerLayout /></SubscriptionGuard>}>
            <Route path="/engineer/dashboard" element={<FieldWorkspace />} />
            <Route path="/engineer/surveys" element={<FieldWorkspace mode="surveys" />} />
            <Route path="/engineer/surveys/:id" element={<FieldWorkspace resourceType="survey" />} />
            <Route path="/engineer/tasks" element={<FieldWorkspace mode="tasks" />} />
            <Route path="/engineer/service" element={<FieldWorkspace mode="service" />} />
            <Route path="/engineer/projects" element={<ProjectsList />} />
            <Route path="/engineer/projects/:id" element={<ProjectDetail />} />
            <Route path="/engineer/projects/:id/field" element={<RedirectToEngineerProject />} />
            <Route path="/engineer/calculator" element={<SolarCalculator technicalOnly />} />
            <Route path="/engineer/profile"    element={<Profile />} />
          </Route>
        </Route>

        <Route path="*" element={<HomeOrLogin />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
