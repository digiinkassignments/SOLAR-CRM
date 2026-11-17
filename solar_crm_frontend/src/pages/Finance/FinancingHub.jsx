import { Box, Paper, Tabs, Tab, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import FinanceWorkspace from "./FinanceWorkspace";
import SubsidyTracker from "../Admin/Subsidy/SubsidyTracker";
import LoansList from "../Loans/LoansList";

export default function FinancingHub() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const base = pathname.startsWith("/manager/") ? "/manager/subsidies" : "/subsidies";
  const loans = pathname.endsWith("/loans");
  return <FinanceWorkspace>
    <Box sx={{ mb: 3 }}>
      <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 700 }}>CUSTOMER FINANCE</Typography>
      <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 26, md: 30 }, fontWeight: 700 }}>Subsidy &amp; Finance</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.75 }}>One workspace for subsidy claims and solar loans. Track each approval and payment separately.</Typography>
    </Box>
    <Paper variant="outlined" sx={{ mb: 3, boxShadow: "none", overflow: "hidden" }}>
      <Tabs value={loans ? 1 : 0} onChange={(_, value) => navigate(value ? `${base}/loans` : base)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile aria-label="Subsidy and financing sections">
        <Tab icon={<AccountBalanceOutlinedIcon fontSize="small" />} iconPosition="start" label="Subsidy tracker" />
        <Tab icon={<PaymentsOutlinedIcon fontSize="small" />} iconPosition="start" label="Solar loans" />
      </Tabs>
    </Paper>
    {loans ? <LoansList /> : <SubsidyTracker />}
  </FinanceWorkspace>;
}
