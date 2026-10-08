import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
  Card,
  Divider,
  Checkbox,
} from "@mui/material";

// Icons
import SearchIcon from "@mui/icons-material/Search";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PaymentIcon from "@mui/icons-material/Payment";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircle";
import PendingActionsIcon from "@mui/icons-material/HourglassEmpty";

import api from "../../api/axios";
import toast from "react-hot-toast";
import ConvertInvoiceModal from "./ConvertInvoiceModal";
import RecordPaymentModal from "./RecordPaymentModal";
import BulkDeleteBar from "../../components/BulkDeleteBar";
import { bulkDeleteInvoices } from "../../services/invoiceService";

const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  border: "#E2E8F0",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  bgSubtle: "#F8FAFC",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  info: "#0284C7",
  infoSoft: "#E0F2FE",
};

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);

  // Bulk Delete State
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(invoices.map((inv) => inv.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const res = await bulkDeleteInvoices(selectedIds);
      if (res?.success) {
        toast.success(res.message || `${selectedIds.length} invoices deleted successfully`);
        setInvoices((prev) => prev.filter((inv) => !selectedIds.includes(inv.id)));
        setSelectedIds([]);
      } else {
        toast.error(res?.message || "Failed to delete invoices");
      }
    } catch (err) {
      console.error("Bulk delete invoices error:", err);
      toast.error(err.response?.data?.message || "Failed to delete invoices");
    } finally {
      setBulkDeleting(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let url = "/invoices?";
      if (statusFilter !== "All") url += `payment_status=${statusFilter}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await api.get(url);
      if (res.data?.success) {
        setInvoices(res.data.data || []);
      }
    } catch (err) {
      console.error("Fetch invoices error:", err);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInvoices();
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
    } catch (err) {
      toast.error("Failed to delete invoice");
    }
  };

  const handleCopyLink = (token) => {
    const url = `${window.location.origin}/invoice/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Invoice public link copied!");
  };

  const handleShareWhatsApp = (inv) => {
    const url = `${window.location.origin}/invoice/${inv.public_token}`;
    const text =
      `*TAX INVOICE: ${inv.invoice_number}*\n` +
      `Customer: ${inv.customer_name}\n` +
      `System: ${inv.system_capacity_kw} kW (${inv.system_type})\n` +
      `Net Invoice Amount: Rs. ${parseFloat(inv.net_payable_amount).toLocaleString("en-IN")}\n` +
      `Amount Paid: Rs. ${parseFloat(inv.amount_paid).toLocaleString("en-IN")}\n` +
      `Balance Due: Rs. ${parseFloat(inv.balance_due).toLocaleString("en-IN")}\n` +
      `Status: ${(inv.payment_status || "Unpaid").toUpperCase()}\n\n` +
      `View & Download Official Invoice PDF:\n${url}`;

    window.open(`https://api.whatsapp.com/send?phone=91${inv.customer_phone}&text=${encodeURIComponent(text)}`, "_blank");
  };

  // KPIs
  const totalInvoiced = invoices.reduce((acc, i) => acc + (parseFloat(i.net_payable_amount) || 0), 0);
  const totalPaid = invoices.reduce((acc, i) => acc + (parseFloat(i.amount_paid) || 0), 0);
  const totalBalance = invoices.reduce((acc, i) => acc + (parseFloat(i.balance_due) || 0), 0);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.primary, letterSpacing: -0.5 }}>
            Tax Invoices & Billing
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
            Manage commercial client invoices, advance receipts, balance settlements, and executive A4 PDFs
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateModal(true)}
          sx={{
            bgcolor: COLORS.primary,
            color: "#FFFFFF",
            fontWeight: 700,
            textTransform: "none",
            borderRadius: "8px",
            px: 2.5,
            py: 1,
            "&:hover": { bgcolor: COLORS.primaryDark },
          }}
        >
          Create Tax Invoice
        </Button>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2, bgcolor: "#FFFFFF", borderRadius: "12px", border: `1px solid ${COLORS.border}` }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>Total Invoiced</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mt: 0.5 }}>
                  ₹{totalInvoiced.toLocaleString("en-IN")}
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>{invoices.length} Invoices Generated</Typography>
              </Box>
              <Box sx={{ p: 1.2, bgcolor: COLORS.infoSoft, borderRadius: "10px", color: COLORS.info }}>
                <ReceiptLongIcon />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2, bgcolor: "#FFFFFF", borderRadius: "12px", border: `1px solid ${COLORS.border}` }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>Total Collections Paid</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.success, mt: 0.5 }}>
                  ₹{totalPaid.toLocaleString("en-IN")}
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.success, fontWeight: 600 }}>Received in Bank / UPI</Typography>
              </Box>
              <Box sx={{ p: 1.2, bgcolor: COLORS.successSoft, borderRadius: "10px", color: COLORS.success }}>
                <CheckCircleOutlineIcon />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2, bgcolor: "#FFFFFF", borderRadius: "12px", border: `1px solid ${COLORS.border}` }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>Outstanding Balance Due</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.danger, mt: 0.5 }}>
                  ₹{totalBalance.toLocaleString("en-IN")}
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.danger, fontWeight: 600 }}>Pending Collections</Typography>
              </Box>
              <Box sx={{ p: 1.2, bgcolor: COLORS.dangerSoft, borderRadius: "10px", color: COLORS.danger }}>
                <PendingActionsIcon />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ p: 2, bgcolor: "#FFFFFF", borderRadius: "12px", border: `1px solid ${COLORS.border}` }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>Settlement Ratio</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mt: 0.5 }}>
                  {totalInvoiced > 0 ? `${Math.round((totalPaid / totalInvoiced) * 100)}%` : "0%"}
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Recovery Rate</Typography>
              </Box>
              <Box sx={{ p: 1.2, bgcolor: COLORS.warningSoft, borderRadius: "10px", color: COLORS.warning }}>
                <AccountBalanceWalletIcon />
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          bgcolor: "#FFFFFF",
          borderRadius: "12px",
          border: `1px solid ${COLORS.border}`,
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: "flex", gap: 1.5, flex: 1, minWidth: 260 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search by Invoice #, Customer Name, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: COLORS.textSecondary, fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                backgroundColor: "#FAFBFC",
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            sx={{
              bgcolor: COLORS.primary,
              textTransform: "none",
              borderRadius: "8px",
              fontWeight: 600,
            }}
          >
            Search
          </Button>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>Status:</Typography>
          {["All", "Paid", "Partially Paid", "Unpaid"].map((st) => (
            <Chip
              key={st}
              label={st}
              clickable
              onClick={() => setStatusFilter(st)}
              sx={{
                fontWeight: 600,
                fontSize: "0.8rem",
                bgcolor: statusFilter === st ? COLORS.primary : "#F1F5F9",
                color: statusFilter === st ? "#FFFFFF" : COLORS.textSecondary,
                "&:hover": {
                  bgcolor: statusFilter === st ? COLORS.primaryDark : "#E2E8F0",
                },
              }}
            />
          ))}
        </Stack>
      </Paper>

      {/* Bulk Delete Bar */}
      <BulkDeleteBar
        selectedCount={selectedIds.length}
        totalCount={invoices.length}
        itemLabel="Invoices"
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        isAllSelected={selectedIds.length === invoices.length && invoices.length > 0}
        onConfirmDelete={handleBulkDelete}
        loading={bulkDeleting}
      />

      {/* Invoices Table */}
      <Paper elevation={0} sx={{ borderRadius: "12px", border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <CircularProgress size={36} sx={{ color: COLORS.primary }} />
            <Typography variant="body2" sx={{ mt: 1.5, color: COLORS.textSecondary }}>
              Loading tax invoices...
            </Typography>
          </Box>
        ) : invoices.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <ReceiptLongIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.primary }}>
              No Invoices Found
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 2 }}>
              Generate invoices from Quotations or click Create Tax Invoice above.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setOpenCreateModal(true)}
              sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600 }}
            >
              + Create Invoice Now
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 850 }}>
              <TableHead sx={{ bgcolor: COLORS.primary }}>
                <TableRow>
                  <TableCell sx={{ color: "#FFFFFF", width: 44, p: 0.5, pl: 1.5 }}>
                    <Checkbox
                      size="small"
                      indeterminate={selectedIds.length > 0 && selectedIds.length < invoices.length}
                      checked={invoices.length > 0 && selectedIds.length === invoices.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(invoices.map((inv) => inv.id));
                        else setSelectedIds([]);
                      }}
                      sx={{
                        color: "rgba(255,255,255,0.7)",
                        "&.Mui-checked, &.MuiCheckbox-indeterminate": { color: "#FFFFFF" },
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.82rem" }}>INVOICE #</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.82rem" }}>CUSTOMER / CONTACT</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.82rem" }}>SYSTEM SPEC</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.82rem", textAlign: "right" }}>NET PAYABLE</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.82rem", textAlign: "right" }}>PAID AMOUNT</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.82rem", textAlign: "right" }}>BALANCE DUE</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.82rem", textAlign: "center" }}>PAYMENT STATUS</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.82rem", textAlign: "center" }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((inv) => {
                  const isPaid = inv.payment_status === "Paid";
                  const isPartially = inv.payment_status === "Partially Paid";
                  const bal = parseFloat(inv.balance_due) || 0;
                  const isSelected = selectedIds.includes(inv.id);

                  return (
                    <TableRow
                      key={inv.id}
                      hover
                      selected={isSelected}
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        bgcolor: isSelected ? "rgba(15, 23, 42, 0.04)" : "inherit",
                      }}
                    >
                      <TableCell sx={{ width: 44, p: 0.5, pl: 1.5 }}>
                        <Checkbox
                          size="small"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(inv.id)}
                          sx={{
                            color: COLORS.border,
                            "&.Mui-checked": { color: COLORS.primary },
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: COLORS.primary, fontSize: "0.86rem" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <ReceiptLongIcon sx={{ color: COLORS.info, fontSize: 18 }} />
                          <Box>
                            <div>{inv.invoice_number}</div>
                            <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: "0.72rem" }}>
                              {new Date(inv.invoice_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>
                          {inv.customer_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block" }}>
                          {inv.customer_phone} {inv.city ? `• ${inv.city}` : ""}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>
                          {inv.system_capacity_kw} kW {inv.system_type}
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block", fontSize: "0.72rem" }}>
                          {inv.panel_specs?.substring(0, 24)}...
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ textAlign: "right", fontWeight: 700, color: COLORS.primary }}>
                        ₹{parseFloat(inv.net_payable_amount || 0).toLocaleString("en-IN")}
                      </TableCell>

                      <TableCell sx={{ textAlign: "right", fontWeight: 700, color: COLORS.success }}>
                        ₹{parseFloat(inv.amount_paid || 0).toLocaleString("en-IN")}
                      </TableCell>

                      <TableCell sx={{ textAlign: "right", fontWeight: 700, color: bal > 0 ? COLORS.danger : COLORS.success }}>
                        ₹{bal.toLocaleString("en-IN")}
                      </TableCell>

                      <TableCell sx={{ textAlign: "center" }}>
                        <Chip
                          size="small"
                          label={inv.payment_status || "Unpaid"}
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            bgcolor: isPaid ? COLORS.successSoft : isPartially ? COLORS.warningSoft : COLORS.dangerSoft,
                            color: isPaid ? COLORS.success : isPartially ? COLORS.warning : COLORS.danger,
                          }}
                        />
                      </TableCell>

                      <TableCell sx={{ textAlign: "center" }}>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {/* Record Payment (if balance remains) */}
                          {bal > 0 && (
                            <Tooltip title="Record Payment Installment">
                              <IconButton
                                size="small"
                                onClick={() => setSelectedInvoiceForPayment(inv)}
                                sx={{ color: COLORS.success, bgcolor: COLORS.successSoft, "&:hover": { bgcolor: "#BBF7D0" } }}
                              >
                                <PaymentIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Browser View */}
                          <Tooltip title="Browser View ↗">
                            <IconButton
                              size="small"
                              onClick={() => window.open(`/invoice/${inv.public_token}`, "_blank")}
                              sx={{ color: COLORS.primary, bgcolor: "#F1F5F9", "&:hover": { bgcolor: "#E2E8F0" } }}
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* Download 1-Page PDF */}
                          <Tooltip title="Download 1-Page PDF">
                            <IconButton
                              size="small"
                              onClick={() => window.open(`/invoice/${inv.public_token}?download=true`, "_blank")}
                              sx={{ color: COLORS.info, bgcolor: COLORS.infoSoft, "&:hover": { bgcolor: "#BAE6FD" } }}
                            >
                              <PictureAsPdfIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* WhatsApp Share */}
                          <Tooltip title="Share via WhatsApp">
                            <IconButton
                              size="small"
                              onClick={() => handleShareWhatsApp(inv)}
                              sx={{ color: "#25D366", bgcolor: "#DCFCE7", "&:hover": { bgcolor: "#BBF7D0" } }}
                            >
                              <WhatsAppIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* Copy Link */}
                          <Tooltip title="Copy Link">
                            <IconButton
                              size="small"
                              onClick={() => handleCopyLink(inv.public_token)}
                              sx={{ color: COLORS.textSecondary }}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* Delete */}
                          <Tooltip title="Delete Invoice">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(inv.id)}
                              sx={{ color: COLORS.danger }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Convert / Create Invoice Modal */}
      <ConvertInvoiceModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onInvoiceCreated={() => fetchInvoices()}
      />

      {/* Record Payment Installment Modal */}
      {selectedInvoiceForPayment && (
        <RecordPaymentModal
          open={Boolean(selectedInvoiceForPayment)}
          invoice={selectedInvoiceForPayment}
          onClose={() => setSelectedInvoiceForPayment(null)}
          onPaymentRecorded={() => {
            fetchInvoices();
            setSelectedInvoiceForPayment(null);
          }}
        />
      )}
    </Box>
  );
};

export default InvoiceList;
