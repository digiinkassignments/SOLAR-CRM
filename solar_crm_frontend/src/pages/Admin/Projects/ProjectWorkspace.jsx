import { useMemo } from "react";
import { Box, GlobalStyles } from "@mui/material";
import { ThemeProvider, createTheme, useTheme } from "@mui/material/styles";

// Scoped to Projects, including portalled dialogs. Other CRM screens keep their theme.
export default function ProjectWorkspace({ children }) {
  const parentTheme = useTheme();
  const theme = useMemo(() => createTheme(parentTheme, {
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            height: "auto", minHeight: 40, padding: "8px 16px", lineHeight: 1.5,
            whiteSpace: "normal", overflowWrap: "anywhere", flexShrink: 0,
            boxShadow: "none", backgroundImage: "none",
            "&:hover": { transform: "none", boxShadow: "none" },
          },
          sizeSmall: { minHeight: 36, padding: "6px 12px" },
          containedPrimary: { background: "#0F172A", "&:hover": { background: "#1E293B" } },
          containedSecondary: { background: "#F59E0B", color: "#0F172A" },
        },
      },
      MuiDialog: {
        defaultProps: { scroll: "paper" },
        styleOverrides: {
          paper: {
            margin: 16, width: "calc(100% - 32px)", maxHeight: "calc(100dvh - 32px)", padding: 0,
            "& .MuiButton-root": { height: "auto", minHeight: 36, padding: "8px 16px", lineHeight: 1.5, whiteSpace: "normal" },
            "& .MuiDialogTitle-root": { overflowWrap: "anywhere" },
            "& .MuiGrid-root": { minWidth: 0 },
          },
        },
      },
      MuiDialogTitle: { styleOverrides: { root: { padding: "20px 24px", gap: 12, lineHeight: 1.4 } } },
      MuiDialogContent: { styleOverrides: { root: { padding: 24, minWidth: 0 } } },
      MuiDialogActions: { styleOverrides: { root: { flexWrap: "wrap", gap: 8, padding: "16px 24px" } } },
      MuiOutlinedInput: { styleOverrides: { root: { minWidth: 0 } } },
      MuiChip: { styleOverrides: { root: { maxWidth: "100%" }, label: { overflow: "hidden", textOverflow: "ellipsis" } } },
      MuiStack: { defaultProps: { useFlexGap: true } },
      MuiAlert: {
        styleOverrides: {
          root: { flexWrap: "wrap", gap: 8, alignItems: "flex-start" },
          message: { minWidth: 0, flex: "1 1 180px", overflowWrap: "anywhere" },
          action: { margin: 0, padding: 0, maxWidth: "100%", flexShrink: 0 },
        },
      },
    },
  }), [parentTheme]);

  return <ThemeProvider theme={theme}>
    <GlobalStyles styles={{
      "main:has(.project-workspace)": { minWidth: 0, maxWidth: "100%" },
      "body:has(.project-workspace) .MuiAppBar-positionFixed": { top: 0 },
    }} />
    <Box className="project-workspace" sx={{
      width: "100%", minWidth: 0, maxWidth: 1600, mx: "auto", color: "text.primary",
      "& .MuiGrid-root, & .MuiPaper-root": { minWidth: 0 },
      "& .MuiTypography-root": { overflowWrap: "anywhere" },
      "& .MuiButton-root": { height: "auto", minHeight: 36, py: 0.875, lineHeight: 1.5, whiteSpace: "normal" },
      "& .MuiButton-startIcon, & .MuiButton-endIcon": { flexShrink: 0 },
      "& .MuiTab-root": { minHeight: 48, whiteSpace: "nowrap", flexShrink: 0 },
      "& .MuiTableContainer-root": { maxWidth: "100%", overflowX: "auto" },
      "& .MuiTypography-h5, & .MuiTypography-h6": { textWrap: "balance" },
      "& .MuiLinearProgress-root": { height: 6, borderRadius: 3 },
      "& input[type=number]": { fontVariantNumeric: "tabular-nums" },
      "@media (max-width: 900px)": {
        "& .MuiStack-root": { minWidth: 0, maxWidth: "100%", flexWrap: "wrap", gap: 1 },
        "& .MuiStack-root > .MuiTypography-h6": { flex: "1 1 180px" },
        "& .MuiStack-root > .MuiChip-root": { flexShrink: 0 },
        "& .MuiStack-root > .MuiBox-root": { minWidth: 0 },
        "& .MuiButton-root": { maxWidth: "100%" },
      },
      "@media (prefers-reduced-motion: reduce)": {
        "& *, & *::before, & *::after": { animation: "none !important", transition: "none !important" },
      },
    }}>{children}</Box>
  </ThemeProvider>;
}
