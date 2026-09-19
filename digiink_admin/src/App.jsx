import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
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

// Google Material 3 Theme with Plus Jakarta Sans & Inter
const theme = createTheme({
  typography: {
    fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 },
    h2: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 },
    h3: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 },
    h4: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 },
    h5: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 },
    h6: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 },
    subtitle1: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 },
    subtitle2: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 },
    body1: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 },
    body2: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 },
    button: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, textTransform: "none" },
  },
  palette: {
    primary: { main: "#1A73E8" },
    background: { default: "#F8F9FA", paper: "#FFFFFF" },
    text: { primary: "#202124", secondary: "#5F6368" },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "100px",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 600,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        },
      },
    },
  },
});

// Route Guard
const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
    </ThemeProvider>
  );
};

export default App;