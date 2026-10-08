import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0F172A", // Slate 900
      light: "#1E293B",
      dark: "#020617",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#F59E0B", // Solar Sun Amber Gold
      light: "#FBBF24",
      dark: "#D97706",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F8FAFC", // Slate 50 Off-white
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1E293B", // Slate 800
      secondary: "#64748B", // Slate 500
      disabled: "#94A3B8",
    },
    divider: "#E2E8F0",
    success: {
      main: "#16A34A",
      light: "#F0FDF4",
      dark: "#15803D",
    },
    warning: {
      main: "#D97706",
      light: "#FEF3C7",
      dark: "#B45309",
    },
    error: {
      main: "#DC2626",
      light: "#FEE2E2",
      dark: "#B91C1C",
    },
    info: {
      main: "#0284C7",
      light: "#E0F2FE",
      dark: "#0369A1",
    },
  },

  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    h1: { fontFamily: "'Outfit', 'Inter', sans-serif", fontWeight: 700, fontSize: "2rem" },
    h2: { fontFamily: "'Outfit', 'Inter', sans-serif", fontWeight: 700, fontSize: "1.65rem" },
    h3: { fontFamily: "'Outfit', 'Inter', sans-serif", fontWeight: 700, fontSize: "1.4rem" },
    h4: { fontFamily: "'Outfit', 'Inter', sans-serif", fontWeight: 700, fontSize: "22px" }, // Page Titles (22px)
    h5: { fontFamily: "'Outfit', 'Inter', sans-serif", fontWeight: 700, fontSize: "20px" },
    h6: { fontFamily: "'Outfit', 'Inter', sans-serif", fontWeight: 600, fontSize: "16px" }, // Section Titles (16px)
    subtitle1: { fontFamily: "'Outfit', 'Inter', sans-serif", fontWeight: 600, fontSize: "15px" }, // Section Subtitles (15px)
    subtitle2: { fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "12px", color: "#475569" }, // Labels (12px)
    body1: { fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "14px", lineHeight: 1.5 }, // Body/Inputs (14px)
    body2: { fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "13px", lineHeight: 1.4 },
    button: { fontFamily: "'Inter', sans-serif", textTransform: "none", fontWeight: 600, fontSize: "14px" },
    caption: { fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#64748B" },
  },

  shape: {
    borderRadius: 8,
  },

  shadows: [
    "none",
    "0 1px 2px 0 rgba(15, 23, 42, 0.04)",
    "0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.03)",
    "0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.03)",
    "0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.03)",
    "0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)",
    ...Array(20).fill("0 4px 20px -2px rgba(15, 23, 42, 0.05)"),
  ],

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          height: 40,
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
          fontSize: "14px",
          boxShadow: "none",
          padding: "10px 20px",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.12)",
          },
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          color: "#FFFFFF",
          "&:hover": {
            background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          },
        },
        containedSecondary: {
          background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
          color: "#FFFFFF",
          "&:hover": {
            background: "linear-gradient(135deg, #D97706 0%, #B45309 100%)",
          },
        },
        outlinedPrimary: {
          borderColor: "#CBD5E1",
          color: "#475569",
          backgroundColor: "#FFFFFF",
          "&:hover": {
            borderColor: "#0F172A",
            backgroundColor: "#F1F5F9",
            color: "#0F172A",
          },
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          height: 40,
          borderRadius: 6,
          fontSize: "13px",
          fontWeight: 500,
          backgroundColor: "#FFFFFF",
          "& fieldset": {
            borderColor: "#CBD5E1",
          },
          "&:hover fieldset": {
            borderColor: "#94A3B8",
          },
          "&.Mui-focused": {
            boxShadow: "0 0 0 3px rgba(245, 158, 11, 0.15)",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#F59E0B",
            borderWidth: "1.5px",
          },
        },
        input: {
          padding: "10px 14px",
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "12px",
          fontWeight: 600,
          color: "#475569",
          "&.Mui-focused": {
            color: "#D97706",
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 12,
        },
        outlined: {
          borderColor: "#E2E8F0",
          boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: "1px solid #E2E8F0",
          boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)",
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 700,
          fontSize: "11px",
        },
        sizeSmall: {
          height: 22,
          fontSize: "11px",
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            backgroundColor: "#0F172A",
            color: "#FFFFFF",
            fontWeight: 700,
            fontSize: "12px",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            borderBottom: "none",
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: "12px 16px",
          borderColor: "#F1F5F9",
          fontSize: "13px",
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "#F8FAFC",
          },
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.15)",
        },
      },
    },
  },
});

export default theme;
