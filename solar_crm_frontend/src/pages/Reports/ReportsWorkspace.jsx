import { useMemo } from "react";
import { Box, GlobalStyles } from "@mui/material";
import { createTheme, ThemeProvider, useTheme } from "@mui/material/styles";

// Report screens keep their existing palette; layout overrides stay scoped here.
export default function ReportsWorkspace({ children }) {
  const parent = useTheme();
  const theme = useMemo(() => createTheme(parent, {
    components: {
      MuiStack: { defaultProps: { useFlexGap: true } },
      MuiButton: { styleOverrides: {
        root: { height: "auto", minHeight: 40, padding: "8px 16px", lineHeight: 1.5, whiteSpace: "normal", boxShadow: "none", "&:hover": { transform: "none" } },
        sizeSmall: { minHeight: 36, padding: "6px 12px" },
      } },
      MuiDialog: { styleOverrides: { paper: {
        margin: 16, maxWidth: "calc(100% - 32px)", maxHeight: "calc(100dvh - 32px)",
        "& .MuiButton-root": { height: "auto", minHeight: 36, whiteSpace: "normal", lineHeight: 1.5, padding: "8px 16px" },
        "& .MuiDialogTitle-root": { gap: 12, overflowWrap: "anywhere" },
        "& .MuiGrid-root, & .MuiFormControl-root": { minWidth: 0 },
        "& .MuiDialogActions-root": { flexWrap: "wrap", gap: 8 },
      } } },
      MuiAlert: { styleOverrides: { root: { flexWrap: "wrap", gap: 8 }, message: { minWidth: 0, flex: "1 1 180px" }, action: { margin: 0, maxWidth: "100%" } } },
      MuiChip: { styleOverrides: { root: { maxWidth: "100%" } } },
    },
  }), [parent]);
  return <ThemeProvider theme={theme}>
    <GlobalStyles styles={{ "main:has(.reports-workspace)": { minWidth: 0, maxWidth: "100%" }, "body:has(.reports-workspace) .MuiAppBar-positionFixed": { top: 0 } }} />
    <Box className="reports-workspace" sx={{ width: "100%", minWidth: 0, maxWidth: 1600, mx: "auto",
      "& .MuiPaper-root, & .MuiGrid-root": { minWidth: 0 },
      "& .MuiStack-root": { flexWrap: "wrap", minWidth: 0, maxWidth: "100%" },
      "& .MuiTypography-root": { overflowWrap: "anywhere" },
      "& .MuiButton-root": { height: "auto", minHeight: 36, whiteSpace: "normal", lineHeight: 1.5, py: 0.875, maxWidth: "100%" },
      "& .MuiButton-startIcon, & .MuiButton-endIcon": { flexShrink: 0 },
      "& .MuiTableContainer-root": { maxWidth: "100%", overflowX: "auto" },
      "& .MuiTablePagination-toolbar": { flexWrap: "wrap", justifyContent: "flex-end", px: 0 },
      "& .MuiTab-root": { minHeight: 52, flexShrink: 0 },
      "& .MuiCard-root": { minWidth: "0 !important", boxShadow: "none !important", transform: "none !important", transition: "none !important" },
      "& .MuiPaper-root": { boxShadow: "none" },
      "@media (max-width: 900px)": { "& .MuiStack-root": { flexWrap: "wrap", maxWidth: "100%", minWidth: 0 }, "& .MuiStack-root > .MuiBox-root": { minWidth: 0 }, "& .MuiStack-root > .MuiChip-root": { flexShrink: 0 } },
      "@media (prefers-reduced-motion: reduce)": { "& *": { animation: "none !important", transition: "none !important" } },
    }}>{children}</Box>
  </ThemeProvider>;
}
