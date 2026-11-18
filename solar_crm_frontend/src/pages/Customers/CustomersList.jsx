import {portalRole,workspacePrefix} from "../../utils/portalRoles";
import ImportCustomersDialog from "./ImportCustomersDialog";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, TextField, MenuItem, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Stack, Avatar, Alert, Skeleton, Pagination, IconButton, Tooltip } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import SolarPowerOutlinedIcon from "@mui/icons-material/SolarPowerOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import { useAuth } from "../../context/AuthContext";
import { getCustomers } from "../../services/customerService";
import AddCustomerModal from "./AddCustomerModal";
import CustomerWorkspace from "./CustomerWorkspace";
import { money, initials, copyValue } from "./customerHelpers";
import { ContactActions, Metric, Field, ViewToggle, CustomerBadges, customerTypeTone } from "./customerUi";

export default function CustomersList() {
  const navigate=useNavigate(); const {user}=useAuth();
  const isManager=Number(user?.role_id)===2 || String(user?.role_name || user?.role || "").toLowerCase().includes("manager");
  const basePath=`${workspacePrefix(user)}/customers`;
  const [customers,setCustomers]=useState([]); const [stats,setStats]=useState({});
  const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  const [search,setSearch]=useState(""); const [type,setType]=useState("All");
  const [balance,setBalance]=useState("all"); const [sort,setSort]=useState("newest");
  const [view,setView]=useState("cards"); const [page,setPage]=useState(1); const [openAdd,setOpenAdd]=useState(false);
  const [openImport,setOpenImport]=useState(false);
  const [leadSource,setLeadSource]=useState("all");
  const canEdit=[1,2].includes(Number(user?.role_id)) || portalRole(user)==='finance';
  const sequence=useRef(0);
  const fetchCustomers=useCallback(async()=>{
    const request=++sequence.current; setLoading(true); setError("");
    try {
      const res=await getCustomers({ ...(search.trim()?{search:search.trim()}:{}), ...(type!=="All"?{requirement:type}:{}) });
      if(request!==sequence.current)return;
      if(!res?.success)throw new Error(res?.message || "Unable to load customers.");
      setCustomers(Array.isArray(res.data)?res.data:[]); setStats(res.stats || {});
    } catch(err) { if(request===sequence.current)setError(err.response?.data?.message || err.message || "Unable to load customers."); }
    finally { if(request===sequence.current)setLoading(false); }
  },[search,type]);
  useEffect(()=>{const requests=sequence;const timer=setTimeout(fetchCustomers,250);return()=>{clearTimeout(timer);requests.current++;};},[fetchCustomers]);
  const filtered=useMemo(()=>customers.filter(c=>{
    const text=[c.customer_name,c.customer_code,c.mobile_number,c.email,c.city].filter(Boolean).join(" ").toLowerCase();
    return (!search.trim() || text.includes(search.trim().toLowerCase())) && (type==="All" || c.solar_requirement===type)
      && (leadSource==="all" || (c.effective_lead_source || c.lead_source || "Not recorded")===leadSource)
      && (balance==="all" || (balance==="due"?Number(c.total_balance_amount)>0:Number(c.total_balance_amount)<=0));
  }).sort((a,b)=>sort==="name"?String(a.customer_name || "").localeCompare(String(b.customer_name || "")):sort==="balance"?Number(b.total_balance_amount || 0)-Number(a.total_balance_amount || 0):Number(b.id)-Number(a.id)),[customers,search,type,balance,sort,leadSource]);
  const pages=Math.max(1,Math.ceil(filtered.length/12)); const currentPage=Math.min(page,pages); const visible=filtered.slice((currentPage-1)*12,currentPage*12);
  const change=(setter,value)=>{setter(value);setPage(1);};
  const reset=()=>{setSearch("");setType("All");setBalance("all");setSort("newest");setLeadSource("all");setPage(1);};
  const activeFilters=Boolean(search || type!=="All" || balance!=="all" || leadSource!=="all");
  return <CustomerWorkspace><Box sx={{pb:4}}>
    <Box sx={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:2,mb:3}}>
      <Box sx={{flex:"1 1 260px"}}><Typography variant="overline" color="text.secondary">CUSTOMER RELATIONSHIPS</Typography><Typography component="h1" variant="h4" sx={{fontWeight:700}}>Customer directory</Typography><Typography color="text.secondary" variant="body2" sx={{mt:1}}>Contacts, solar projects and billing in one place.</Typography></Box>
      <Stack direction="row" sx={{gap:1,flexWrap:"wrap"}}><Button variant="outlined" startIcon={<RefreshIcon/>} onClick={fetchCustomers} disabled={loading}>Refresh</Button>{canEdit&&<><Button variant="outlined" startIcon={<UploadFileOutlinedIcon/>} onClick={()=>setOpenImport(true)}>Bulk upload</Button><Button variant="contained" startIcon={<PersonAddOutlinedIcon/>} onClick={()=>setOpenAdd(true)}>Add customer</Button></>}</Stack>
    </Box>
    <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",sm:"repeat(2,minmax(0,1fr))",xl:"repeat(4,minmax(0,1fr))"},gap:2,mb:3}}>
      <Metric label="Customers" value={loading?"--":Number(stats.totalCustomers ?? customers.length).toLocaleString("en-IN")} hint="In current search results" icon={PeopleAltOutlinedIcon} tone="blue"/>
      <Metric label="Linked project capacity" value={loading?"--":`${Number(stats.totalCapacityKw || 0).toFixed(1)} kW`} hint="Linked capacity in current results" icon={SolarPowerOutlinedIcon} tone="amber"/>
      <Metric label="Total billed" value={loading?"--":money(stats.totalBilled ?? 0)} hint={loading?"Loading totals":`${money(stats.totalPaid ?? 0)} recorded payments`} icon={ReceiptLongOutlinedIcon} tone="green"/>
      <Metric label="Outstanding balance" value={loading?"--":money(stats.totalBalance ?? 0)} hint="Invoices in current results" color={Number(stats.totalBalance)>0?"error.main":"text.primary"} icon={AccountBalanceWalletOutlinedIcon} tone={Number(stats.totalBalance)>0?"red":"violet"}/>
    </Box>
    <Paper variant="outlined" sx={{p:{xs:2,md:2.5},mb:2.5,borderRadius:3,boxShadow:"none"}}>
      <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",md:"minmax(240px,2fr) repeat(3,minmax(145px,1fr))"},gap:2}}>
        <TextField size="small" label="Search customers" placeholder="Name, code, phone, email or city" value={search} onChange={e=>change(setSearch,e.target.value)} InputProps={{startAdornment:<InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment>}}/>
        <TextField select size="small" label="Customer type" value={type} onChange={e=>change(setType,e.target.value)}>{["All","Residential","Commercial","Industrial"].map(v=><MenuItem key={v} value={v}>{v==="All"?"All types":v}</MenuItem>)}</TextField>
        <TextField select size="small" label="Invoice balance" value={balance} onChange={e=>change(setBalance,e.target.value)}><MenuItem value="all">All balances</MenuItem><MenuItem value="due">Balance due</MenuItem><MenuItem value="clear">No balance due</MenuItem></TextField>
        <TextField select size="small" label="Sort by" value={sort} onChange={e=>change(setSort,e.target.value)}><MenuItem value="newest">Newest first</MenuItem><MenuItem value="name">Name A-Z</MenuItem><MenuItem value="balance">Highest balance</MenuItem></TextField>
      </Box>
      <Stack direction="row" sx={{justifyContent:"space-between",alignItems:"center",gap:1.5,mt:2}}><Typography variant="body2" color="text.secondary" role="status">{loading?"Loading customers...":`${filtered.length} of ${customers.length} customers`}</Typography><Stack direction="row" sx={{gap:1,alignItems:"center"}}>{activeFilters&&<Button size="small" onClick={reset}>Clear filters</Button>}<TextField select size="small" label="Lead source" value={leadSource} onChange={e=>change(setLeadSource,e.target.value)} sx={{minWidth:170}}><MenuItem value="all">All sources</MenuItem>{[...new Set(customers.map(c=>c.effective_lead_source || c.lead_source || "Not recorded"))].sort().map(source=><MenuItem key={source} value={source}>{source}</MenuItem>)}</TextField><ViewToggle value={view} onChange={setView}/></Stack></Stack>
    </Paper>
    {customers.length>=150&&!loading&&<Alert severity="info" sx={{mb:2}}>Showing up to 150 matching records. Narrow the search or select a customer type to find older records.</Alert>}
    {error?<Alert severity="error" action={<Button onClick={fetchCustomers}>Retry</Button>}>{error}</Alert>:loading?<Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",lg:"repeat(2,minmax(0,1fr))"},gap:2}}>{[1,2,3,4].map(n=><Skeleton key={n} variant="rounded" height={270}/>)}</Box>:!filtered.length?<Paper variant="outlined" sx={{p:5,textAlign:"center",borderRadius:3}}><PeopleAltOutlinedIcon sx={{fontSize:40,color:"text.secondary"}}/><Typography variant="h6" sx={{mt:1,fontWeight:700}}>{activeFilters?"No matching customers":"Your customer directory is ready"}</Typography><Typography variant="body2" color="text.secondary" sx={{my:1.5}}>{activeFilters?"Try a different search or clear the filters.":"Add a customer to keep contact, project and billing details together."}</Typography>{(activeFilters || canEdit)&&<Button variant="outlined" onClick={activeFilters?reset:()=>setOpenAdd(true)}>{activeFilters?"Clear filters":"Add customer"}</Button>}</Paper>:view==="cards"?
    <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",lg:"repeat(2,minmax(0,1fr))",xl:"repeat(3,minmax(0,1fr))"},gap:2}}>{visible.map(c=><Paper variant="outlined" key={c.id} sx={{p:2.5,borderRadius:3,display:"flex",flexDirection:"column",gap:2,boxShadow:"none",borderColor:"#E2E8F0",backgroundColor:"#FFFFFF"}}>
      <Stack direction="row" sx={{gap:1.5,alignItems:"flex-start",flexWrap:"nowrap !important"}}><Avatar sx={{bgcolor:"#F1F5F9",color:"#334155",fontWeight:700,width:44,height:44}}>{initials(c.customer_name)}</Avatar><Box sx={{flex:1,minWidth:0}}><Typography component="h2" variant="subtitle1" sx={{fontWeight:700}}>{c.customer_name || "Unnamed customer"}</Typography><Typography variant="caption" color="text.secondary">{c.customer_code || "Code not recorded"}</Typography></Box><Tooltip title="Copy customer code"><IconButton size="small" disabled={!c.customer_code} aria-label={`Copy code for ${c.customer_name}`} onClick={()=>copyValue(c.customer_code,"Customer code")}><ContentCopyOutlinedIcon fontSize="small"/></IconButton></Tooltip></Stack>
      <Stack direction="row" sx={{gap:1,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}><CustomerBadges type={c.solar_requirement} status={c.status}/><Typography variant="caption" sx={{color:"#64748B"}}>{[c.city,c.state].filter(Boolean).join(", ") || "Location not recorded"}</Typography></Stack>
      <Box sx={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:2,p:1.5,borderRadius:2,bgcolor:"#F8FAFC",border:"1px solid #E2E8F0"}}><Field label="Phone" value={c.mobile_number || "Not recorded"}/><Field label="Projects / capacity" value={`${Number(c.total_projects || 0)} projects / ${Number(c.total_system_kw || 0)} kW`} valueColor="#1E293B"/><Field label="Invoice amount" value={money(c.total_billed_amount ?? 0)} valueColor="#1E293B"/><Field label="Balance due" value={money(c.total_balance_amount ?? 0)} valueColor={Number(c.total_balance_amount)>0?"#B91C1C":"#15803D"}/><Field label="Lead source" value={c.effective_lead_source || c.lead_source || "Not recorded"}/><Field label="Payment milestones" value={`${Number(c.total_milestones || 0)} planned`}/></Box>
      {c.email&&<Typography variant="body2" color="text.secondary">{c.email}</Typography>}
      <Box sx={{mt:"auto",pt:2,borderTop:"1px solid",borderColor:"divider"}}><ContactActions customer={c} compact/><Button variant="contained" fullWidth endIcon={<ArrowForwardIcon/>} onClick={()=>navigate(`${basePath}/${c.id}`)} sx={{mt:1.5,bgcolor:"#0284C7","&:hover":{bgcolor:"#0369A1"}}}>Open customer</Button></Box>
    </Paper>)}</Box>:
    <Paper variant="outlined" sx={{borderRadius:3,overflow:"hidden",boxShadow:"none"}}><TableContainer><Table sx={{minWidth:1000}} aria-label="Customer directory"><TableHead sx={{bgcolor:"#F8FAFC"}}><TableRow>{["Customer","Contact","Type / location","Projects","Invoice amount","Lead source","Milestones","Balance due","Actions"].map(label=><TableCell key={label} sx={{fontWeight:700}}>{label}</TableCell>)}</TableRow></TableHead><TableBody>{visible.map(c=><TableRow key={c.id} hover><TableCell><Button onClick={()=>navigate(`${basePath}/${c.id}`)} sx={{justifyContent:"flex-start",px:0,textAlign:"left"}}>{c.customer_name}</Button><Typography variant="caption" display="block" color="text.secondary">{c.customer_code}</Typography></TableCell><TableCell>{c.mobile_number || "Not recorded"}<Typography variant="caption" display="block" color="text.secondary">{c.email}</Typography></TableCell><TableCell><CustomerBadges type={c.solar_requirement} status={c.status}/><Typography variant="caption" display="block" color="text.secondary" sx={{mt:0.5}}>{[c.city,c.state].filter(Boolean).join(", ") || "Location not recorded"}</Typography></TableCell><TableCell>{Number(c.total_projects || 0)}<Typography variant="caption" display="block" color="text.secondary">{Number(c.total_system_kw || 0)} kW</Typography></TableCell><TableCell>{money(c.total_billed_amount ?? 0)}</TableCell><TableCell>{c.effective_lead_source || c.lead_source || "Not recorded"}</TableCell><TableCell><Button size="small" onClick={()=>navigate(`${basePath}/${c.id}?tab=payments`)}>{Number(c.total_milestones || 0)} planned</Button></TableCell><TableCell sx={{color:Number(c.total_balance_amount)>0?"error.main":"text.primary",fontWeight:600}}>{money(c.total_balance_amount ?? 0)}</TableCell><TableCell><Button size="small" onClick={()=>navigate(`${basePath}/${c.id}`)}>Open customer</Button><ContactActions customer={c} compact/></TableCell></TableRow>)}</TableBody></Table></TableContainer></Paper>}
    {!loading&&!error&&filtered.length>12&&<Stack direction="row" sx={{justifyContent:"space-between",alignItems:"center",gap:2,mt:3}}><Typography variant="body2" color="text.secondary">Showing {(currentPage-1)*12+1}-{Math.min(currentPage*12,filtered.length)} of {filtered.length}</Typography><Pagination count={pages} page={currentPage} onChange={(_,value)=>setPage(value)} size="small"/></Stack>}
    <ImportCustomersDialog open={openImport} onClose={()=>setOpenImport(false)} onImported={fetchCustomers} manager={isManager}/>
    <AddCustomerModal open={openAdd} onClose={()=>setOpenAdd(false)} onCustomerCreated={fetchCustomers}/>
  </Box></CustomerWorkspace>;
}
