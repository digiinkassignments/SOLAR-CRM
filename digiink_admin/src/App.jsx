import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import Login        from "./pages/Login";
import Dashboard    from "./pages/Dashboard";
import Clients      from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import CreateClient from "./pages/CreateClient";
import Payments     from "./pages/Payments";
import Plans        from "./pages/Plans";
import Settings     from "./pages/Settings";

// Layout
import AdminLayout from "./layouts/AdminLayout";

// Route Guard
const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/" element={
            <PrivateRoute>
              <AdminLayout />
            </PrivateRoute>
          }>
            <Route path="dashboard"   element={<Dashboard />} />
            <Route path="clients"     element={<Clients />} />
            <Route path="clients/new" element={<CreateClient />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            <Route path="payments"    element={<Payments />} />
            <Route path="plans"       element={<Plans />} />
            <Route path="settings"    element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;