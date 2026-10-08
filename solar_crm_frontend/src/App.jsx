import { ThemeProvider, CssBaseline } from "@mui/material";
import { Toaster } from "react-hot-toast";
import theme from "./theme/theme";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#0F172A",
            color: "#FFFFFF",
            fontSize: "13px",
            fontWeight: 500,
            borderRadius: "8px",
            borderLeft: "4px solid #F59E0B",
            boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.25)",
            padding: "12px 16px",
          },
          success: {
            style: {
              borderLeft: "4px solid #16A34A",
            },
            iconTheme: {
              primary: "#16A34A",
              secondary: "#FFFFFF",
            },
          },
          error: {
            style: {
              borderLeft: "4px solid #DC2626",
            },
            iconTheme: {
              primary: "#DC2626",
              secondary: "#FFFFFF",
            },
          },
        }}
      />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;