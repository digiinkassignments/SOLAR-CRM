import {portalRole} from "../../utils/portalRoles";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box, Typography, Button, TextField, InputAdornment, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination, Paper,
  Chip, IconButton, Tooltip, Stack, Divider, Checkbox, Menu, MenuItem,
  ListItemIcon, ListItemText, Skeleton, Alert,
} from "@mui/material";
import {
  Search as SearchIcon, ReceiptLong as ReceiptLongIcon,
  PictureAsPdf as PictureAsPdfIcon, OpenInNew as OpenInNewIcon,
  WhatsApp as WhatsAppIcon, ContentCopy as ContentCopyIcon,
  Payment as PaymentIcon, DeleteOutlined as DeleteOutlineIcon,
  Add as AddIcon, AccountBalanceWallet as WalletIcon,
  CheckCircleOutlined as CheckCircleIcon, PendingActions as PendingIcon,
  MoreHoriz as MoreIcon, Refresh as RefreshIcon,
  FilterAltOffOutlined as ClearFiltersIcon, SolarPowerOutlined as SolarIcon,
} from "@mui/icons-material";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import ConvertInvoiceModal from "./ConvertInvoiceModal";
import RecordPaymentModal from "./RecordPaymentModal";
import BulkDeleteBar from "../../components/BulkDeleteBar";
import { bulkDeleteInvoices } from "../../services/invoiceService";

const C = {
  primary: "#0F172A", border: "#E2E8F0", text: "#1E293B", muted: "#64748B",
  bg: "#F8FAFC", green: "#16A34A", greenSoft: "#DCFCE7",
  amber: "#D97706", amberSoft: "#FEF3C7", red: "#DC2626", redSoft: "#FEE2E2",
  blue: "#0284C7", blueSoft: "#E0F2FE",
};
const money = (value) => `₹${(Number(value) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const dateLabel = (value) => {
  if (!value) return "Date not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date not recorded" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const primaryButton = {
  bgcolor: C.primary, color: "#FFFFFF", textTransform: "none", fontWeight: 700,
  borderRadius: "9px", boxShadow: "none", minHeight: 42, px: 2.25,
  "&:hover": { bgcolor: "#020617", boxShadow: "none" },
};

export default function InvoiceList() {
  const { user } = useAuth();
  const roleName = (user?.role_name || user?.role || "").toLowerCase();
  const isSuperAdmin = [1,2].includes(Number(user?.role_id)) || roleName.includes("super") || roleName === "admin";
  const canCreateOrPay = portalRole(user)==='finance' || isSuperAdmin || user?.role_id === 2 || roleName.includes("manager");
  const canDeleteInvoice = isSuperAdmin || portalRole(user)==='finance';
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [actionMenu, setActionMenu] = useState(null);
  const emailBusy = useRef(false);
  const latestRequest = useRef(0);

  const fetchInvoices = useCallback((signal) => {
    const requestId = ++latestRequest.current;
    const params = {};
    if (statusFilter !== "All") params.payment_status = statusFilter;
    if (appliedSearch) params.search = appliedSearch;
    return api.get("/invoices", { params, signal }).then((res) => {
      if (signal?.aborted || requestId !== latestRequest.current) return;
      if (!res.data?.success) throw new Error("Invoice request failed");
      setInvoices(res.data.data || []);
      setPage(0);
    }).catch((err) => {
      if (signal?.aborted || requestId !== latestRequest.current) return;
      console.error("Fetch invoices error:", err);
      setInvoices([]);
      setLoadError("Invoices could not be loaded. Please try again.");
    }).finally(() => {
      if (!signal?.aborted && requestId === latestRequest.current) setLoading(false);
    });
  }, [statusFilter, appliedSearch]);

  useEffect(() => {
    const controller = new AbortController();
    fetchInvoices(controller.signal);
    return () => controller.abort();
  }, [fetchInvoices]);

  const beginLoading = () => {
    setLoading(true);
    setLoadError("");
    setSelectedIds([]);
  };
  const refreshInvoices = () => { beginLoading(); fetchInvoices(); };
  const changeStatus = (status) => {
    if (status === statusFilter) return;
    beginLoading();
    setStatusFilter(status);
  };
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = search.trim();
    if (query === appliedSearch) refreshInvoices();
    else { beginLoading(); setAppliedSearch(query); }
  };
  const clearFilters = () => { beginLoading(); setSearch(""); setAppliedSearch(""); setStatusFilter("All"); };
  const handleToggleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  const handleSelectAll = () => setSelectedIds(invoices.map((inv) => inv.id));
  const handleDeselectAll = () => setSelectedIds([]);
  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    setBulkDeleting(true);
    try {
      const res = await bulkDeleteInvoices(selectedIds);
      if (res?.success) {
        toast.success(res.message || `${selectedIds.length} invoices deleted successfully`);
        setInvoices((prev) => prev.filter((inv) => !selectedIds.includes(inv.id)));
        setSelectedIds([]);
      } else toast.error(res?.message || "Failed to delete invoices");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete invoices");
    } finally { setBulkDeleting(false); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await api.delete(`/invoices/${id}`);
      if (res.data?.success) {
        toast.success("Invoice deleted successfully");
        setInvoices((prev) => prev.filter((inv) => inv.id !== id));
        setSelectedIds((prev) => prev.filter((item) => item !== id));
      }
    } catch { toast.error("Failed to delete invoice"); }
  };
  const handleCopyLink = async (token) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/invoice/${token}`);
      toast.success("Invoice public link copied!");
    } catch { toast.error("Could not copy the invoice link. Please try again."); }
  };
  const handleSendEmail = async (invoice) => {
    if (emailBusy.current) return;
    if (!invoice.customer_email) { toast.error("Save the customer's email address before sending."); return; }
    emailBusy.current = true;
    toast.loading("Sending invoice?", { id: "invoice-email" });
    try {
      const response = await api.post(`/invoices/${invoice.id}/send-email`);
      toast.success(response.data.message, { id: "invoice-email" });
    } catch (error) { toast.error(error.response?.data?.message || "Could not send invoice email.", { id: "invoice-email" }); }
    finally { emailBusy.current = false; }
  };
  const handleShareWhatsApp = (inv) => {
    const url = `${window.location.origin}/invoice/${inv.public_token}`;
    const text = `*TAX INVOICE: ${inv.invoice_number}*\nCustomer: ${inv.customer_name}\nSystem: ${inv.system_capacity_kw} kW (${inv.system_type})\nNet Invoice Amount: ${money(inv.net_payable_amount)}\nAmount Paid: ${money(inv.amount_paid)}\nBalance Due: ${money(inv.balance_due)}\nStatus: ${(inv.payment_status || "Unpaid").toUpperCase()}\n\nView & Download Official Invoice PDF:\n${url}`;
    window.open(`https://api.whatsapp.com/send?phone=91${inv.customer_phone}&text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };
  const openInvoice = (inv, download = false) => window.open(`/invoice/${inv.public_token}${download ? "?download=true" : ""}`, "_blank", "noopener,noreferrer");
  const runMenuAction = (action) => {
    const invoice = actionMenu?.invoice;
    setActionMenu(null);
    if (invoice) action(invoice);
  };

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number(inv.net_payable_amount) || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (Number(inv.amount_paid) || 0), 0);
  const totalBalance = invoices.reduce((sum, inv) => sum + (Number(inv.balance_due) || 0), 0);
  const isFiltered = Boolean(appliedSearch || statusFilter !== "All");
  const currentPage = Math.min(page, Math.max(0, Math.ceil(invoices.length / rowsPerPage) - 1));
  const visibleInvoices = invoices.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);
  const metrics = [
    { label: "Total invoiced", value: money(totalInvoiced), detail: `${invoices.length} invoices in current results`, Icon: ReceiptLongIcon, color: C.blue, bg: C.blueSoft },
    { label: "Payments received", value: money(totalPaid), detail: "Recorded invoice payments", Icon: CheckCircleIcon, color: C.green, bg: C.greenSoft },
    { label: "Outstanding balance", value: money(totalBalance), detail: "Balance remaining to collect", Icon: PendingIcon, color: C.red, bg: C.redSoft },
    { label: "Collection rate", value: `${totalInvoiced > 0 ? Math.round(totalPaid / totalInvoiced * 100) : 0}%`, detail: "Payments received / invoiced value", Icon: WalletIcon, color: C.amber, bg: C.amberSoft },
  ];

  return (
    <Box sx={{ width: "100%", minWidth: 0, boxSizing: "border-box", p: { xs: 1.5, sm: 2.5, lg: 3 }, bgcolor: C.bg, "& .MuiButton-root": { textTransform: "none" } }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, gap: 2, mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 48, height: 48, flexShrink: 0, borderRadius: "12px", display: "grid", placeItems: "center", bgcolor: "#FFFFFF", border: `1px solid ${C.border}`, color: C.blue }}><ReceiptLongIcon /></Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h1" sx={{ fontWeight: 800, color: C.primary, fontSize: { xs: "1.3rem", md: "1.55rem" }, letterSpacing: "-0.035em", lineHeight: 1.3 }}>Invoices & billing</Typography>
            <Typography sx={{ color: C.muted, fontSize: "0.84rem", mt: 0.4 }}>Track invoices, record payments and manage outstanding balances.</Typography>
          </Box>
        </Stack>
        {canCreateOrPay && <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreateModal(true)} sx={{ ...primaryButton, flexShrink: 0 }}>Create tax invoice</Button>}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }, gap: 2, mb: 2.5 }}>
        {metrics.map(({ label, value, detail, Icon, color, bg }) => (
          <Paper key={label} elevation={0} sx={{ border: `1px solid ${C.border}`, borderRadius: "13px", p: { xs: 2, md: 2.25 }, minWidth: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 1.75 }}>
              <Typography sx={{ fontSize: "0.79rem", fontWeight: 600, color: C.muted }}>{label}</Typography>
              <Box sx={{ display: "grid", placeItems: "center", width: 36, height: 36, flexShrink: 0, bgcolor: bg, color, borderRadius: "10px" }}><Icon sx={{ fontSize: 20 }} /></Box>
            </Stack>
            {loading ? <Skeleton width="75%" height={37} /> : <Typography sx={{ fontSize: { xs: "1.6rem", md: "1.75rem" }, fontWeight: 800, color: label === "Outstanding balance" ? C.red : label === "Payments received" ? C.green : C.primary, letterSpacing: "-0.035em", lineHeight: 1.25, overflowWrap: "anywhere", fontVariantNumeric: "tabular-nums" }}>{loadError ? "—" : value}</Typography>}
            <Typography sx={{ color: C.muted, fontSize: "0.72rem", mt: 0.9 }}>{loading ? "Loading invoice summary…" : loadError ? "Summary unavailable" : detail}</Typography>
          </Paper>
        ))}
      </Box>

      <Paper elevation={0} sx={{ border: `1px solid ${C.border}`, borderRadius: "13px", mb: 2.5, overflow: "hidden" }}>
        <Box component="form" onSubmit={handleSearchSubmit} sx={{ p: { xs: 1.75, md: 2 }, display: "flex", flexWrap: "wrap", gap: 1.25, alignItems: "center" }}>
          <TextField size="small" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Invoice number, customer or phone" slotProps={{ htmlInput: { "aria-label": "Search invoices" }, input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 20, color: C.muted }} /></InputAdornment> } }} sx={{ flex: "1 1 280px", minWidth: 0, "& .MuiOutlinedInput-root": { height: 42, borderRadius: "8px", bgcolor: C.bg } }} />
          <Button type="submit" variant="contained" sx={primaryButton}>Search</Button>
          <Tooltip title="Refresh invoices"><IconButton aria-label="Refresh invoices" disabled={loading} onClick={refreshInvoices} sx={{ border: `1px solid ${C.border}`, borderRadius: "9px", width: 42, height: 42, color: C.muted }}><RefreshIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
        <Divider />
        <Box sx={{ px: { xs: 1.75, md: 2 }, py: 1.5, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
          <Box role="group" aria-label="Filter invoices by payment status" sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75 }}>
            <Typography sx={{ fontSize: "0.75rem", color: C.muted, fontWeight: 700, mr: 0.75 }}>Payment status</Typography>
            {["All", "Unpaid", "Partially Paid", "Paid"].map((status) => <Button key={status} size="small" aria-pressed={statusFilter === status} onClick={() => changeStatus(status)} sx={{ borderRadius: "7px", fontSize: "0.75rem", fontWeight: 700, px: 1.5, minHeight: 32, bgcolor: statusFilter === status ? C.primary : C.bg, color: statusFilter === status ? "#FFFFFF" : C.muted, "&:hover": { bgcolor: statusFilter === status ? "#020617" : C.border } }}>{status === "All" ? "All invoices" : status}</Button>)}
          </Box>
          {isFiltered && <Button size="small" startIcon={<ClearFiltersIcon />} onClick={clearFilters} sx={{ color: C.muted, fontSize: "0.75rem", fontWeight: 600 }}>Clear filters</Button>}
        </Box>
      </Paper>

      {canDeleteInvoice && <BulkDeleteBar selectedCount={selectedIds.length} totalCount={invoices.length} itemLabel="Invoices" onSelectAll={handleSelectAll} onDeselectAll={handleDeselectAll} isAllSelected={Boolean(invoices.length && selectedIds.length === invoices.length)} onConfirmDelete={handleBulkDelete} loading={bulkDeleting} />}

      <Paper elevation={0} sx={{ borderRadius: "13px", border: `1px solid ${C.border}`, overflow: "hidden", minWidth: 0 }}>
        <Box sx={{ px: 2.25, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.25 }}>
          <Stack direction="row" spacing={1} alignItems="center"><Typography component="h2" sx={{ fontWeight: 800, fontSize: "0.98rem", color: C.primary }}>Invoice register</Typography><Chip size="small" label={loading ? "Loading" : `${invoices.length} invoices`} sx={{ height: 23, fontSize: "0.68rem", fontWeight: 700, bgcolor: "#F1F5F9", color: C.muted }} /></Stack>
          <Typography sx={{ fontSize: "0.73rem", color: C.muted }}>{invoices.length >= 150 ? "Latest 150 results · Use search to find older invoices" : isFiltered ? "Showing filtered results" : "Recorded invoices"} · Amounts in INR</Typography>
        </Box>
        <Divider />
        {loadError ? <Box sx={{ p: 3 }}><Alert severity="error" action={<Button color="inherit" size="small" onClick={refreshInvoices}>Retry</Button>}>{loadError}</Alert></Box> : loading ? (
          <Box aria-busy="true" aria-label="Loading invoices" sx={{ p: 2.25 }}>{Array.from({ length: 5 }, (_, index) => <Stack key={index} direction="row" spacing={2} sx={{ py: 1.5 }}><Skeleton width="25%" height={38} /><Skeleton width="30%" height={38} /><Skeleton width="20%" height={38} /><Skeleton width="25%" height={38} /></Stack>)}</Box>
        ) : !invoices.length ? (
          <Stack alignItems="center" sx={{ px: 2, py: 7, textAlign: "center" }}>
            <Box sx={{ display: "grid", placeItems: "center", width: 62, height: 62, bgcolor: C.bg, borderRadius: "16px", color: "#94A3B8", mb: 2 }}><ReceiptLongIcon sx={{ fontSize: 30 }} /></Box>
            <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: C.primary }}>{isFiltered ? "No matching invoices" : "Your invoice register is ready"}</Typography>
            <Typography sx={{ color: C.muted, fontSize: "0.83rem", maxWidth: 390, mt: 0.75, mb: 2.5 }}>{isFiltered ? "Try a different customer, invoice number or payment status." : "Create your first tax invoice or convert an existing quotation to start tracking payments."}</Typography>
            {isFiltered ? <Button variant="outlined" onClick={clearFilters} sx={{ borderRadius: "8px" }}>Clear filters</Button> : canCreateOrPay && <Button variant="contained" startIcon={<AddIcon />} sx={primaryButton} onClick={() => setOpenCreateModal(true)}>Create tax invoice</Button>}
          </Stack>
        ) : (
          <>
            <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
              <Table aria-label="Invoice register" sx={{ minWidth: 1210, "& th": { bgcolor: C.bg, color: C.muted, fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap", borderBottom: `1px solid ${C.border}`, py: 1.5 }, "& td": { py: 2, fontSize: "0.81rem", borderColor: "#EEF2F6" }, "& td, & th": { px: 2 }, "& .money-cell": { fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", fontWeight: 700 } }}>
                <TableHead><TableRow>
                  {canDeleteInvoice && <TableCell padding="checkbox" sx={{ width: 44 }}><Checkbox size="small" slotProps={{ input: { "aria-label": "Select all invoices in current results" } }} indeterminate={selectedIds.length > 0 && selectedIds.length < invoices.length} checked={Boolean(invoices.length && selectedIds.length === invoices.length)} onChange={(event) => event.target.checked ? handleSelectAll() : handleDeselectAll()} /></TableCell>}
                  <TableCell>Invoice / date</TableCell><TableCell>Customer</TableCell><TableCell>Solar system</TableCell><TableCell align="right">Invoice value</TableCell><TableCell align="right">Received</TableCell><TableCell align="right">Balance due</TableCell><TableCell>Payment status</TableCell><TableCell align="right">Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>{visibleInvoices.map((invoice) => {
                  const paid = invoice.payment_status === "Paid";
                  const partial = invoice.payment_status === "Partially Paid";
                  const balance = Number(invoice.balance_due) || 0;
                  const selected = selectedIds.includes(invoice.id);
                  return <TableRow key={invoice.id} hover selected={selected} sx={{ verticalAlign: "middle", "&:last-child td": { borderBottom: 0 }, "&:hover": { bgcolor: C.bg } }}>
                    {canDeleteInvoice && <TableCell padding="checkbox"><Checkbox size="small" checked={selected} onChange={() => handleToggleSelect(invoice.id)} slotProps={{ input: { "aria-label": `Select invoice ${invoice.invoice_number}` } }} /></TableCell>}
                    <TableCell><Button disabled={!invoice.public_token} onClick={() => openInvoice(invoice)} sx={{ p: 0, minWidth: 0, justifyContent: "flex-start", fontWeight: 800, fontSize: "0.81rem", color: C.primary, whiteSpace: "nowrap", "&:hover": { bgcolor: "transparent", color: C.blue } }}>{invoice.invoice_number || "Invoice"}</Button><Typography sx={{ fontSize: "0.71rem", color: C.muted, mt: 0.4, whiteSpace: "nowrap" }}>{dateLabel(invoice.invoice_date)}</Typography></TableCell>
                    <TableCell sx={{ maxWidth: 245 }}><Typography sx={{ color: C.text, fontWeight: 700, fontSize: "0.83rem", overflowWrap: "anywhere" }}>{invoice.customer_name || "Customer not recorded"}</Typography><Typography sx={{ color: C.muted, fontSize: "0.72rem", mt: 0.4 }}>{invoice.customer_phone || "No phone"}{invoice.city ? ` · ${invoice.city}` : ""}</Typography></TableCell>
                    <TableCell sx={{ maxWidth: 210 }}><Stack direction="row" spacing={0.6} alignItems="center"><SolarIcon sx={{ fontSize: 16, color: C.muted }} /><Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: C.text, whiteSpace: "nowrap" }}>{invoice.system_capacity_kw ? `${invoice.system_capacity_kw} kW` : "Capacity not set"}</Typography></Stack><Typography sx={{ color: C.muted, fontSize: "0.71rem", mt: 0.4 }}>{invoice.system_type || "Type not set"}</Typography>{invoice.panel_specs && <Typography title={invoice.panel_specs} noWrap sx={{ maxWidth: 175, fontSize: "0.68rem", color: C.muted, mt: 0.25 }}>{invoice.panel_specs}</Typography>}</TableCell>
                    <TableCell align="right" className="money-cell" sx={{ color: C.primary }}>{money(invoice.net_payable_amount)}</TableCell>
                    <TableCell align="right" className="money-cell" sx={{ color: C.green }}>{money(invoice.amount_paid)}</TableCell>
                    <TableCell align="right" className="money-cell" sx={{ color: balance > 0 ? C.red : C.muted }}>{money(balance)}</TableCell>
                    <TableCell><Chip size="small" label={invoice.payment_status || "Unpaid"} sx={{ height: 26, borderRadius: "6px", fontWeight: 700, fontSize: "0.69rem", bgcolor: paid ? C.greenSoft : partial ? C.amberSoft : C.redSoft, color: paid ? C.green : partial ? C.amber : C.red }} /></TableCell>
                    <TableCell align="right"><Stack direction="row" spacing={0.75} alignItems="center" justifyContent="flex-end">
                      {balance > 0 && canCreateOrPay && <Button size="small" startIcon={<PaymentIcon sx={{ fontSize: "16px !important" }} />} onClick={() => setSelectedInvoiceForPayment(invoice)} sx={{ whiteSpace: "nowrap", borderRadius: "7px", minHeight: 33, px: 1, fontSize: "0.71rem", fontWeight: 700, bgcolor: C.greenSoft, color: "#15803D", "&:hover": { bgcolor: "#BBF7D0" } }}>Record payment</Button>}
                      <Tooltip title="Invoice actions"><IconButton aria-label={`Actions for invoice ${invoice.invoice_number}`} aria-haspopup="menu" aria-expanded={actionMenu?.invoice.id === invoice.id ? true : undefined} onClick={(event) => setActionMenu({ anchorEl: event.currentTarget, invoice })} sx={{ width: 33, height: 33, borderRadius: "7px", border: `1px solid ${C.border}`, color: C.muted }}><MoreIcon fontSize="small" /></IconButton></Tooltip>
                    </Stack></TableCell>
                  </TableRow>;
                })}</TableBody>
              </Table>
            </TableContainer>
            <Divider />
            <TablePagination component="div" count={invoices.length} page={currentPage} rowsPerPage={rowsPerPage} rowsPerPageOptions={[10, 25, 50, 100]} onPageChange={(_, nextPage) => setPage(nextPage)} onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0); }} sx={{ "& .MuiTablePagination-toolbar": { flexWrap: "wrap", justifyContent: "flex-end", px: { xs: 1, sm: 2 } }, "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.73rem", color: C.muted } }} />
          </>
        )}
      </Paper>

      <Menu anchorEl={actionMenu?.anchorEl || null} open={Boolean(actionMenu)} onClose={() => setActionMenu(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }} slotProps={{ paper: { sx: { minWidth: 210, mt: 0.75, p: 0.5, border: `1px solid ${C.border}`, borderRadius: "10px", boxShadow: "0 12px 32px rgba(15,23,42,0.12)", "& .MuiMenuItem-root": { borderRadius: "6px", minHeight: 40 }, "& .MuiListItemText-primary": { fontSize: "0.8rem" } } } }}>
        <MenuItem disabled={!actionMenu?.invoice.public_token} onClick={() => runMenuAction((invoice) => openInvoice(invoice))}><ListItemIcon><OpenInNewIcon fontSize="small" sx={{ color: C.blue }} /></ListItemIcon><ListItemText>View invoice</ListItemText></MenuItem>
        <MenuItem disabled={!actionMenu?.invoice.public_token} onClick={() => runMenuAction((invoice) => openInvoice(invoice, true))}><ListItemIcon><PictureAsPdfIcon fontSize="small" sx={{ color: C.red }} /></ListItemIcon><ListItemText>Download PDF</ListItemText></MenuItem>
        <MenuItem disabled={!actionMenu?.invoice.public_token || !actionMenu?.invoice.customer_phone} onClick={() => runMenuAction(handleShareWhatsApp)}><ListItemIcon><WhatsAppIcon fontSize="small" sx={{ color: C.green }} /></ListItemIcon><ListItemText>Share via WhatsApp</ListItemText></MenuItem>
        <MenuItem onClick={() => runMenuAction(handleSendEmail)}><ListItemText>Send invoice by email</ListItemText></MenuItem>
        <MenuItem disabled={!actionMenu?.invoice.public_token} onClick={() => runMenuAction((invoice) => handleCopyLink(invoice.public_token))}><ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon><ListItemText>Copy invoice link</ListItemText></MenuItem>
        {canDeleteInvoice && <Divider />}
        {canDeleteInvoice && <MenuItem onClick={() => runMenuAction((invoice) => handleDelete(invoice.id))} sx={{ color: C.red }}><ListItemIcon><DeleteOutlineIcon fontSize="small" sx={{ color: C.red }} /></ListItemIcon><ListItemText>Delete invoice</ListItemText></MenuItem>}
      </Menu>
      <ConvertInvoiceModal open={openCreateModal} onClose={() => setOpenCreateModal(false)} onInvoiceCreated={refreshInvoices} />
      {selectedInvoiceForPayment && <RecordPaymentModal open invoice={selectedInvoiceForPayment} onClose={() => setSelectedInvoiceForPayment(null)} onPaymentRecorded={() => { refreshInvoices(); setSelectedInvoiceForPayment(null); }} />}
    </Box>
  );
}
