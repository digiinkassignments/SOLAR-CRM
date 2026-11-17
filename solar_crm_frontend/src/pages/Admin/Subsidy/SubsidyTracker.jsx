import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  IconButton,
  Stack,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Alert,
} from "@mui/material";

// Icons (100% Professional MUI Icons — Zero Emojis)
import RefreshIcon from "@mui/icons-material/Refresh";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CheckIcon from "@mui/icons-material/Check";

import toast from "react-hot-toast";
import { getSubsidiesList } from "../../../services/subsidyService";

// 9 Real Portal Stages Configuration
const PORTAL_STAGE_CONFIG = {
  registered: {
    label: "1. Registered",
    owner: "Your Team",
    ownerType: "team",
    expectedDays: 2,
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  feasibility_approved: {
    label: "2. Feasibility Approved",
    owner: "DISCOM",
    ownerType: "discom",
    expectedDays: 7,
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
  },
  vendor_selected: {
    label: "3. Vendor Selected",
    owner: "Customer",
    ownerType: "customer",
    expectedDays: 3,
    color: "#D97706",
    bg: "#FEF3C7",
    border: "#FDE68A",
  },
  agreement_uploaded: {
    label: "4. Agreement Uploaded",
    owner: "Your Team",
    ownerType: "team",
    expectedDays: 2,
    color: "#0284C7",
    bg: "#F0F9FF",
    border: "#BAE6FD",
  },
  installed_docs_uploaded: {
    label: "5. Installed & Uploaded",
    owner: "Your Team",
    ownerType: "team",
    expectedDays: 10,
    color: "#0D9488",
    bg: "#CCFBF1",
    border: "#99F6E4",
  },
  net_meter_applied: {
    label: "6. Net Meter Applied",
    owner: "DISCOM",
    ownerType: "discom",
    expectedDays: 15,
    color: "#EA580C",
    bg: "#FFF7ED",
    border: "#FFEDD5",
  },
  commissioning_issued: {
    label: "7. Commissioning Issued",
    owner: "DISCOM",
    ownerType: "discom",
    expectedDays: 7,
    color: "#16A34A",
    bg: "#F0FDF4",
    border: "#BBF7D0",
  },
  bank_details_submitted: {
    label: "8. Bank Details Submitted",
    owner: "Your Team",
    ownerType: "team",
    expectedDays: 2,
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
  subsidy_credited: {
    label: "9. Subsidy Credited",
    owner: "Government",
    ownerType: "govt",
    expectedDays: 30,
    color: "#047857",
    bg: "#D1FAE5",
    border: "#6EE7B7",
  },
  disbursed: {
    label: "9. Subsidy Credited",
    owner: "Government",
    ownerType: "govt",
    expectedDays: 30,
    color: "#047857",
    bg: "#D1FAE5",
    border: "#6EE7B7",
  },
  rejected: {
    label: "Rejected by Portal",
    owner: "Your Team",
    ownerType: "team",
    expectedDays: 5,
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FCA5A5",
  },
};

export default function SubsidyTracker() {
  const navigate = useNavigate();
  const base = window.location.pathname.startsWith("/manager/") ? "/manager/subsidies" : "/subsidies";
  const sequenceRef = useRef(0);
  const [loadError, setLoadError] = useState("");

  // State
  const [subsidies, setSubsidies] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("box");

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // Subsidy Tracker Drawer State

  // Copy state
  const [copiedKey, setCopiedKey] = useState(null);

  // Backend Aggregate Stats
  const [stats, setStats] = useState({
    totalProjects: 0,
    registered: 0,
    feasibility: 0,
    installation: 0,
    netMeter: 0,
    credited: 0,
    rejected: 0,
    totalExpected: 0,
    totalDisbursed: 0,
  });

  // Fetch Subsidies from backend
  const fetchSubsidies = useCallback(async () => {
    const sequence = ++sequenceRef.current;
    setLoading(true);
    setLoadError("");
    try {
      const res = await getSubsidiesList({
        page: page + 1,
        limit: rowsPerPage,
        search: search.trim(),
        status: selectedStatus,
      });

      if (sequence !== sequenceRef.current) return;
      if (!res?.success || !res.data) throw new Error(res?.message || "Unable to load subsidy records");
      if (res?.success && res.data) {
        const list = res.data.subsidies || [];
        setSubsidies(list);
        setTotalCount(res.data.total ?? list.length);

        const bStats = res.data.stats || {};
        setStats({
          totalProjects: Number(bStats.total_projects ?? list.length),
          registered: Number(bStats.count_registered || 0),
          feasibility: Number(bStats.count_feasibility || 0),
          installation: Number(bStats.count_in_installation || 0),
          netMeter: Number(bStats.count_net_meter || 0),
          credited: Number(bStats.count_credited || 0),
          rejected: Number(bStats.count_rejected || 0),
          totalExpected: Number(bStats.total_expected_subsidy || 0),
          totalDisbursed: Number(bStats.total_disbursed_subsidy || 0),
        });
      } else {
        setSubsidies([]);
        setTotalCount(0);
      }
    } catch (err) {
      if (sequence !== sequenceRef.current) return;
      console.error("fetchSubsidies error:", err);
      setLoadError(err.response?.data?.message || "Unable to load subsidy records. Please retry.");
      setSubsidies([]);
      setTotalCount(0);
    } finally {
      if (sequence === sequenceRef.current) setLoading(false);
    }
  }, [page, rowsPerPage, search, selectedStatus]);

  useEffect(() => {
    fetchSubsidies();
  }, [fetchSubsidies]);

  // Handle Search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  };

  const handleClearFilters = () => {
    setSearch("");
    setSearchInput("");
    setSelectedStatus("All");
    setPage(0);
  };

  // 1-Click Copy Data Pack from Table row
  const handleCopyRowDataPack = async (row) => {
    const text = `=== PM SURYA GHAR PORTAL DATA PACK ===
Applicant: ${row.customer_name}
Electricity Bill CA No.: ${row.consumer_number || "N/A"}
PM Surya Ghar App No.: ${row.application_number || "Pending"}
Installation Address: ${[row.address, row.city, row.state, row.pincode].filter(Boolean).join(", ")}
Capacity: ${row.system_capacity_kw ?? "Not recorded"} kW
DISCOM: ${row.discom_name || "Not recorded"} (${row.discom_division || row.city || "Circle Office"})
DCR Compliant: ${Number(row.is_dcr_compliant) === 1 ? "Recorded as compliant; verify evidence" : "NO"}
Expected Subsidy: ₹${row.expected_subsidy ?? "Not assessed"}
Current Portal Stage: ${row.portal_status}
======================================`;

    try { await navigator.clipboard.writeText(text); } catch { toast.error("Could not copy. Check browser clipboard permission."); return; }
    setCopiedKey(row.lead_id);
    toast.success(`Copied Portal Data Pack for ${row.customer_name}!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const money = value => value == null ? "Not recorded" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
  const openFile = row => navigate(`${base}/${row.lead_id}`);
  return (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2.5 }}>
        <Box sx={{ flex: "1 1 280px", minWidth: 0 }}>
          <Typography component="h2" variant="h5" sx={{ fontWeight: 700 }}>Subsidy applications</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Follow registration, DISCOM work, claim submission and actual subsidy credits.</Typography>
        </Box>
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} disabled={loading} onClick={fetchSubsidies}>Refresh</Button>
          <Button variant="outlined" component="a" href="https://pmsuryaghar.gov.in/" target="_blank" rel="noopener noreferrer" endIcon={<OpenInNewIcon />}>National portal</Button>
        </Stack>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", lg: "repeat(4,minmax(0,1fr))" }, gap: 2, mb: 2.5 }}>
        {[["Tracked projects", stats.totalProjects, "#0F172A", "#FFFFFF"], ["Feasibility", stats.feasibility, "#6D28D9", "#F5F3FF"], ["Net metering", stats.netMeter, "#EA580C", "#FFF7ED"], ["Subsidy credited", stats.credited, "#047857", "#ECFDF5"]].map(([label,value,color,bg]) => <Paper key={label} variant="outlined" sx={{ p: 2.5, bgcolor: bg, boxShadow: "none" }}><Typography variant="body2" sx={{ color, fontWeight: 600 }}>{label}</Typography><Typography sx={{ fontSize: 30, fontWeight: 700, color, mt: 0.5, fontVariantNumeric: "tabular-nums" }}>{value}</Typography></Paper>)}
      </Box>
      <Paper variant="outlined" sx={{ p: 2, mb: 2.5, boxShadow: "none" }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}><Typography variant="body2">Expected subsidy: <strong>{money(stats.totalExpected)}</strong></Typography><Typography variant="body2" sx={{ color: "#047857" }}>Recorded credits: <strong>{money(stats.totalDisbursed)}</strong></Typography></Box>
        <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
          <TextField label="Search applications" placeholder="Customer, phone or reference" size="small" value={searchInput} onChange={e=>setSearchInput(e.target.value)} sx={{ flex: "2 1 230px", minWidth: 0 }} />
          <TextField select label="Portal milestone" size="small" value={selectedStatus} onChange={e=>{setSelectedStatus(e.target.value);setPage(0);}} sx={{ flex: "1 1 220px", minWidth: 0 }}><MenuItem value="All">All milestones</MenuItem>{Object.entries(PORTAL_STAGE_CONFIG).filter(([key])=>key!=="disbursed").map(([key,cfg])=><MenuItem key={key} value={key}>{cfg.label}</MenuItem>)}</TextField>
          <Button type="submit" variant="outlined">Search</Button>
          {(search || selectedStatus!=="All") && <Button onClick={handleClearFilters}>Clear filters</Button>}
          <ToggleButtonGroup value={viewMode} exclusive size="small" onChange={(_,value)=>value&&setViewMode(value)} aria-label="Subsidy view"><ToggleButton value="box" aria-label="Subsidy card view"><ViewListOutlinedIcon fontSize="small" /></ToggleButton><ToggleButton value="table" aria-label="Subsidy table view"><TableChartOutlinedIcon fontSize="small" /></ToggleButton></ToggleButtonGroup>
        </Box>
      </Paper>
      <Alert severity="info" sx={{ mb: 2.5 }}>Portal milestones are recorded by your team. Follow-up targets are internal reminders, not guaranteed government processing times. Loan disbursement and subsidy credit are separate receipts.</Alert>
      <Typography variant="body2" color="text.secondary" role="status" sx={{ mb: 2 }}>{loading ? "Loading applications..." : `${totalCount} applications`}</Typography>
      {loadError ? <Alert severity="error" action={<Button color="inherit" onClick={fetchSubsidies}>Retry</Button>}>{loadError}</Alert>
       : loading ? <Box sx={{ display: "grid", gap: 2 }}>{[1,2,3].map(i=><Skeleton key={i} variant="rounded" height={120} />)}</Box>
       : subsidies.length===0 ? <Paper variant="outlined" sx={{ p: 5, textAlign: "center", boxShadow: "none" }}><AccountBalanceOutlinedIcon sx={{ fontSize: 36, color: "text.secondary", mb: 1 }} /><Typography variant="h6">No subsidy applications found</Typography><Typography color="text.secondary" sx={{ my: 1 }}>Try a different customer or milestone filter.</Typography><Button onClick={handleClearFilters}>Clear filters</Button></Paper>
       : viewMode==="table" ? <Paper variant="outlined" sx={{ overflow: "hidden", boxShadow: "none" }}><TableContainer><Table size="small" sx={{ minWidth: 1050 }} aria-label="Subsidy applications"><TableHead><TableRow>{["Customer / application", "Milestone / owner", "Follow-up", "DCR evidence", "Expected / credited", "Actions"].map(label=><TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead><TableBody>{subsidies.map(row=>{
         const cfg=PORTAL_STAGE_CONFIG[row.portal_status];const days=row.days_in_stage;const target=row.sla_expected_days ?? cfg?.expectedDays;
         return <TableRow key={row.lead_id} hover><TableCell><Typography sx={{fontWeight:600}}>{row.customer_name}</Typography><Typography variant="caption">{row.application_number || "Reference not recorded"}</Typography><Typography variant="body2">{row.mobile_number || row.customer_phone || ""}</Typography></TableCell>
          <TableCell><Chip size="small" label={cfg?.label || row.portal_status || "Not recorded"} sx={{ bgcolor: cfg?.bg, color: cfg?.color }} /><Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>{cfg?.owner || "Owner not recorded"}</Typography></TableCell>
          <TableCell><Typography variant="body2">{days==null ? "Age not recorded" : `${days} days in stage`}</Typography><Typography variant="caption">{target ? `Internal target: ${target} days` : "Target not set"}</Typography></TableCell>
          <TableCell><Chip size="small" label={row.is_dcr_compliant==null ? "Not recorded" : Number(row.is_dcr_compliant)===1 ? "Recorded compliant" : "Needs verification"} sx={{ bgcolor: Number(row.is_dcr_compliant)===1 ? "#DCFCE7" : "#FEF3C7", color: Number(row.is_dcr_compliant)===1 ? "#166534" : "#92400E" }} /></TableCell>
          <TableCell><Typography sx={{fontWeight:600}}>{money(row.expected_subsidy)}</Typography><Typography variant="caption" sx={{ color: "#047857" }}>Credited: {money(row.amount_received)}</Typography></TableCell>
          <TableCell><Stack direction="row" sx={{ gap: 1 }}><Button size="small" variant="contained" onClick={()=>openFile(row)}>Open file</Button><IconButton aria-label={`Copy application for ${row.customer_name}`} onClick={()=>handleCopyRowDataPack(row)}>{copiedKey===row.lead_id ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}</IconButton></Stack></TableCell></TableRow>;
        })}</TableBody></Table></TableContainer></Paper>
       : <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2,minmax(0,1fr))" }, gap: 2 }}>{subsidies.map(row=>{const cfg=PORTAL_STAGE_CONFIG[row.portal_status];return <Paper key={row.lead_id} variant="outlined" sx={{ p: 2.5, boxShadow: "none", display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display:"flex",flexWrap:"wrap",gap:1,justifyContent:"space-between" }}><Typography variant="h6" component="h3">{row.customer_name}</Typography><Chip size="small" label={cfg?.label || row.portal_status || "Not recorded"} sx={{ bgcolor:cfg?.bg,color:cfg?.color }} /></Box>
          <Typography variant="body2" color="text.secondary">{row.application_number || "Application reference not recorded"} | {row.discom_name || "DISCOM not recorded"}</Typography>
          <Box sx={{ display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:2 }}><Box><Typography variant="caption">Expected subsidy</Typography><Typography sx={{fontWeight:700}}>{money(row.expected_subsidy)}</Typography></Box><Box><Typography variant="caption">Recorded credit</Typography><Typography sx={{fontWeight:700,color:"#047857"}}>{money(row.amount_received)}</Typography></Box><Box><Typography variant="caption">Current owner</Typography><Typography variant="body2">{cfg?.owner || "Not recorded"}</Typography></Box><Box><Typography variant="caption">Stage age</Typography><Typography variant="body2">{row.days_in_stage==null ? "Not recorded" : `${row.days_in_stage} days`}</Typography></Box></Box>
          <Stack direction="row" sx={{ gap:1,flexWrap:"wrap",mt:"auto",pt:1.5,borderTop:"1px solid",borderColor:"divider" }}><Button variant="contained" size="small" onClick={()=>openFile(row)}>Open file</Button><IconButton aria-label={`Copy application for ${row.customer_name}`} onClick={()=>handleCopyRowDataPack(row)}><ContentCopyIcon fontSize="small" /></IconButton></Stack>
        </Paper>;})}</Box>}
      {!loadError && totalCount>0 && <TablePagination component="div" count={totalCount} page={page} rowsPerPage={rowsPerPage} onPageChange={(_,value)=>setPage(value)} rowsPerPageOptions={[15,30,50]} onRowsPerPageChange={e=>{setRowsPerPage(Number(e.target.value));setPage(0);}} />}
    </Box>
  );
}
