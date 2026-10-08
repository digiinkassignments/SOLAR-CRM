import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Chip,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  IconButton,
  Tooltip,
  Stack,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Menu,
  MenuItem,
  Breadcrumbs,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Skeleton,
} from "@mui/material";

import BulkDeleteBar from "../../components/BulkDeleteBar";
import { bulkDeleteQuotations } from "../../services/quotationService";

import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as FileCopyIcon,
  ContentCopy as ContentCopyIcon,
  OpenInNew as OpenInNewIcon,
  PictureAsPdf as PictureAsPdfIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  Send as SendIcon,
  PendingActions as PendingActionsIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  SolarPower as SolarIcon,
  HomeOutlined as HomeOutlinedIcon,
  NavigateNextRounded as NavigateNextRoundedIcon,
  FilterListOff as FilterListOffIcon,
  ViewListOutlined as ViewListOutlinedIcon,
  TableChartOutlined as TableChartOutlinedIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  ReceiptLong as ReceiptLongIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";

import api from "../../api/axios";
import toast from "react-hot-toast";
import CreateQuotationModal from "./CreateQuotationModal";
import EditQuotationModal from "./EditQuotationModal";
import ConvertInvoiceModal from "../Invoices/ConvertInvoiceModal";

/* ============================================================
   DESIGN TOKENS (PROFESSIONAL EXECUTIVE CRM STYLE)
   ============================================================ */
const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  primarySoft: "#F1F5F9",
  secondary: "#D97706",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
};

const cardSx = {
  borderRadius: "12px",
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.card,
  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
};

const customScrollbarSx = {
  "&::-webkit-scrollbar": {
    width: "8px",
    height: "8px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "#F1F5F9",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "#CBD5E1",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    backgroundColor: COLORS.primary,
  },
};

const primaryButtonSx = {
  height: 34,
  borderRadius: "6px",
  textTransform: "none",
  fontWeight: 700,
  fontSize: "0.76rem",
  px: 1.8,
  backgroundColor: COLORS.primary,
  color: "#FFFFFF",
  whiteSpace: "nowrap",
  fontFamily: "'Inter', sans-serif",
  "&:hover": { backgroundColor: COLORS.primaryDark },
};

const outlinedButtonSx = {
  height: 34,
  borderRadius: "6px",
  textTransform: "none",
  fontWeight: 700,
  fontSize: "0.76rem",
  px: 1.6,
  borderColor: COLORS.borderStrong,
  backgroundColor: COLORS.card,
  color: COLORS.textPrimary,
  whiteSpace: "nowrap",
  fontFamily: "'Inter', sans-serif",
  "&:hover": { borderColor: COLORS.primary, backgroundColor: "#F8FAFC" },
};

const iconActionBtnSx = {
  width: 32,
  height: 32,
  borderRadius: "6px",
  border: `1px solid ${COLORS.border}`,
  color: COLORS.textSecondary,
  backgroundColor: COLORS.card,
  "&:hover": {
    borderColor: COLORS.primary,
    color: COLORS.primary,
    backgroundColor: "#F8FAFC",
  },
};

const controlSx = {
  fontFamily: "'Inter', sans-serif",
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    backgroundColor: "#FAFBFC",
    fontSize: "0.78rem",
    color: COLORS.textPrimary,
    height: 36,
    "& fieldset": { borderColor: COLORS.border },
    "&:hover fieldset": { borderColor: COLORS.borderStrong },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary, borderWidth: "1.5px" },
  },
};

const formatCurrency = (val) => {
  if (val === undefined || val === null) return "₹0";
  const num = Number(val) || 0;
  return `₹${Math.round(num).toLocaleString("en-IN")}`;
};

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const QuotationList = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // View Mode: "box" or "table"
  const [viewMode, setViewMode] = useState("box");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [convertInvoiceQuotation, setConvertInvoiceQuotation] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(quotations.map((q) => q.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const res = await bulkDeleteQuotations(selectedIds);
      if (res?.success) {
        toast.success(res.message || `${selectedIds.length} quotations deleted!`);
        setQuotations((prev) => prev.filter((q) => !selectedIds.includes(q.id)));
        setSelectedIds([]);
      }
    } catch (err) {
      console.error("Bulk delete quotations error:", err);
      toast.error(err.response?.data?.message || "Failed to delete selected quotations");
    } finally {
      setBulkDeleting(false);
    }
  };

  // Status Change Menu State
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [statusTargetQuotation, setStatusTargetQuotation] = useState(null);

  // Card More Actions Menu State
  const [cardMenuAnchor, setCardMenuAnchor] = useState(null);
  const [cardTargetQuotation, setCardTargetQuotation] = useState(null);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/quotations?search=${encodeURIComponent(searchTerm)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await api.get(url);
      if (res.data?.success) {
        setQuotations(res.data.data || []);
      }
    } catch (err) {
      console.error("Fetch quotations error:", err);
      toast.error("Failed to load quotations");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const handleCopyPublicLink = (q) => {
    const tokenToUse = q.public_token || q.quotation_number || q.id;
    const fullUrl = `${window.location.origin}/quote/${tokenToUse}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Public proposal link copied!");
  };

  const handleShareWhatsApp = (q) => {
    const phone = q.customer_phone ? q.customer_phone.replace(/[^0-9]/g, "") : "";
    const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
    const publicUrl = `${window.location.origin}/quote/${q.public_token || q.quotation_number || q.id}`;

    const message = `Hello ${q.customer_name},\n\nHere is your official solar energy system proposal (${q.system_capacity_kw} kW System).\n\n💰 Total Net Investment: ${formatCurrency(q.net_payable_amount)}\n📄 View Proposal & Download PDF:\n${publicUrl}\n\nThank you!`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleShareEmail = (q) => {
    const publicUrl = `${window.location.origin}/quote/${q.public_token || q.quotation_number || q.id}`;
    const subject = `Solar Energy System Proposal (${q.system_capacity_kw} kW) - ${q.quotation_number}`;
    const body = `Dear ${q.customer_name},\n\nPlease find your solar energy system quotation below:\n\nSystem Capacity: ${q.system_capacity_kw} kW\nNet Investment: ${formatCurrency(q.net_payable_amount)}\n\nView Proposal & Download PDF:\n${publicUrl}\n\nBest Regards,\nSolar Power Solutions`;

    window.location.href = `mailto:${q.customer_email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleOpenEdit = (q) => {
    setSelectedQuotation(q);
    setOpenEditModal(true);
  };

  const handleDuplicate = async (id) => {
    try {
      toast.loading("Duplicating quotation...", { id: "dup-toast" });
      const res = await api.post(`/quotations/${id}/duplicate`);
      if (res.data?.success) {
        toast.success("Quotation duplicated successfully!", { id: "dup-toast" });
        fetchQuotations();
      }
    } catch (err) {
      console.error("Duplicate error:", err);
      toast.error(err.response?.data?.message || "Failed to duplicate quotation", { id: "dup-toast" });
    }
  };

  const handleOpenDeleteConfirm = (id) => {
    setDeletingId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteQuotation = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/quotations/${deletingId}`);
      if (res.data?.success) {
        toast.success("Quotation deleted successfully!");
        setQuotations((prev) => prev.filter((q) => q.id !== deletingId));
        setDeleteConfirmOpen(false);
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.response?.data?.message || "Failed to delete quotation");
    } finally {
      setDeleting(false);
      setDeletingId(null);
    }
  };

  const handleStatusClick = (event, q) => {
    setStatusMenuAnchor(event.currentTarget);
    setStatusTargetQuotation(q);
  };

  const handleStatusSelect = async (newStatus) => {
    if (!statusTargetQuotation) return;
    const qId = statusTargetQuotation.id;
    setStatusMenuAnchor(null);
    try {
      const res = await api.patch(`/quotations/${qId}/status`, { status: newStatus });
      if (res.data?.success) {
        toast.success(`Status updated to ${newStatus}`);
        setQuotations((prev) =>
          prev.map((q) => (q.id === qId ? { ...q, status: newStatus } : q))
        );
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // Metrics Calculation
  const totalCount = quotations.length;
  const totalValue = useMemo(() => {
    return quotations.reduce((acc, q) => acc + (Number(q.net_payable_amount) || 0), 0);
  }, [quotations]);

  const acceptedList = useMemo(() => {
    return quotations.filter((q) => q.status === "Accepted");
  }, [quotations]);

  const acceptedValue = useMemo(() => {
    return acceptedList.reduce((acc, q) => acc + (Number(q.net_payable_amount) || 0), 0);
  }, [acceptedList]);

  const sentCount = useMemo(() => {
    return quotations.filter((q) => q.status === "Sent").length;
  }, [quotations]);

  const draftCount = useMemo(() => {
    return quotations.filter((q) => q.status === "Draft").length;
  }, [quotations]);

  // Clean Corporate Status Chip
  const getStatusChip = (q) => {
    const status = q.status || "Sent";
    let bg = "#F1F5F9";
    let color = COLORS.textSecondary;
    let border = "#E2E8F0";

    if (status === "Accepted") {
      bg = "#DCFCE7";
      color = "#15803D";
      border = "#BBF7D0";
    } else if (status === "Sent") {
      bg = "#E0F2FE";
      color = "#0369A1";
      border = "#BAE6FD";
    } else if (status === "Draft") {
      bg = "#F1F5F9";
      color = "#475569";
      border = "#E2E8F0";
    } else if (status === "Rejected") {
      bg = "#FEE2E2";
      color = "#B91C1C";
      border = "#FECACA";
    }

    return (
      <Tooltip title="Click to change status">
        <Chip
          label={status}
          size="small"
          onClick={(e) => handleStatusClick(e, q)}
          sx={{
            bgcolor: bg,
            color: color,
            fontWeight: 700,
            fontSize: "0.74rem",
            height: 26,
            borderRadius: "6px",
            cursor: "pointer",
            border: `1px solid ${border}`,
            px: 0.6,
            "&:hover": { opacity: 0.85 },
          }}
        />
      </Tooltip>
    );
  };

  // Pagination Slice
  const paginatedQuotations = useMemo(() => {
    const start = page * rowsPerPage;
    return quotations.slice(start, start + rowsPerPage);
  }, [quotations, page, rowsPerPage]);

  return (
    <Box sx={{ backgroundColor: COLORS.bg, minHeight: "100vh", p: 2, boxSizing: "border-box", width: "100%" }}>
      <Box sx={{ width: "100%", maxWidth: "100%", mx: "auto" }}>

        {/* BREADCRUMBS */}
        <Breadcrumbs separator={<NavigateNextRoundedIcon sx={{ fontSize: "0.8rem", color: COLORS.textMuted }} />} sx={{ mb: 1.5 }}>
          <Stack direction="row" alignItems="center" gap={0.5}>
            <HomeOutlinedIcon sx={{ fontSize: "0.8rem", color: COLORS.textMuted }} />
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: COLORS.textMuted }}>
              Dashboard
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.primaryDark }}>
            Quotations &amp; Proposals
          </Typography>
        </Breadcrumbs>

        {/* HERO HEADER */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 1.5,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1.05rem" }}>
              Solar Quotations &amp; Web Proposals
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.75rem", mt: 0.2 }}>
              Generate, manage, and track commercial proposals, 1-page executive PDFs, and digital acceptances.
            </Typography>
          </Box>

          <Stack direction="row" alignItems="center" gap={1} sx={{ flexShrink: 0, flexWrap: "wrap" }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newView) => newView && setViewMode(newView)}
              size="small"
              sx={{
                height: 34,
                backgroundColor: "#F1F5F9",
                borderRadius: "6px",
                p: 0.25,
                "& .MuiToggleButton-root": {
                  border: 0,
                  borderRadius: "4px",
                  px: 1.2,
                  py: 0.3,
                  color: COLORS.textSecondary,
                  "&.Mui-selected": {
                    backgroundColor: COLORS.card,
                    color: COLORS.primary,
                    fontWeight: 700,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                  },
                },
              }}
            >
              <ToggleButton value="box">
                <Tooltip title="Card View">
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <ViewListOutlinedIcon sx={{ fontSize: 16 }} />
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700 }}>Box</Typography>
                  </Stack>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="table">
                <Tooltip title="Table View">
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <TableChartOutlinedIcon sx={{ fontSize: 16 }} />
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700 }}>Table</Typography>
                  </Stack>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            <Tooltip title="Refresh Quotations">
              <IconButton onClick={fetchQuotations} disabled={loading} size="small" sx={iconActionBtnSx}>
                <RefreshIcon
                  sx={{
                    fontSize: 16,
                    animation: loading ? "spin 0.8s linear infinite" : "none",
                    "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                  }}
                />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={() => setOpenCreateModal(true)}
              sx={primaryButtonSx}
            >
              New Quotation
            </Button>
          </Stack>
        </Paper>

        {/* 4 METRIC STAT CARDS (EXECUTIVE CORPORATE DESIGN) */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* Card 1: Total Quotations */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              onClick={() => setStatusFilter("")}
              sx={{
                p: 2,
                borderRadius: "12px",
                backgroundColor: COLORS.card,
                border: `1.5px solid ${statusFilter === "" ? COLORS.primary : COLORS.border}`,
                cursor: "pointer",
                transition: "all 0.15s ease-in-out",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                "&:hover": { borderColor: COLORS.primary },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Total Quotations
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary, mt: 0.5 }}>
                    {totalCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600, mt: 0.3, display: "block" }}>
                    Pipeline: {formatCurrency(totalValue)}
                  </Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: "8px", bgcolor: "#F1F5F9", color: COLORS.primary }}>
                  <DescriptionIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Card 2: Accepted / Won */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              onClick={() => setStatusFilter("Accepted")}
              sx={{
                p: 2,
                borderRadius: "12px",
                backgroundColor: COLORS.card,
                border: `1.5px solid ${statusFilter === "Accepted" ? COLORS.success : COLORS.border}`,
                cursor: "pointer",
                transition: "all 0.15s ease-in-out",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                "&:hover": { borderColor: COLORS.success },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: COLORS.success, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Accepted / Won
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary, mt: 0.5 }}>
                    {acceptedList.length}
                  </Typography>
                  <Typography variant="caption" sx={{ color: COLORS.success, fontWeight: 700, mt: 0.3, display: "block" }}>
                    Closed: {formatCurrency(acceptedValue)}
                  </Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: "8px", bgcolor: "#DCFCE7", color: COLORS.success }}>
                  <CheckCircleIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Card 3: Active Sent */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              onClick={() => setStatusFilter("Sent")}
              sx={{
                p: 2,
                borderRadius: "12px",
                backgroundColor: COLORS.card,
                border: `1.5px solid ${statusFilter === "Sent" ? "#0369A1" : COLORS.border}`,
                cursor: "pointer",
                transition: "all 0.15s ease-in-out",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                "&:hover": { borderColor: "#0369A1" },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#0369A1", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Active Sent
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary, mt: 0.5 }}>
                    {sentCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, mt: 0.3, display: "block" }}>
                    Awaiting Customer Approval
                  </Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: "8px", bgcolor: "#E0F2FE", color: "#0369A1" }}>
                  <SendIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Card 4: Draft Proposals */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              onClick={() => setStatusFilter("Draft")}
              sx={{
                p: 2,
                borderRadius: "12px",
                backgroundColor: COLORS.card,
                border: `1.5px solid ${statusFilter === "Draft" ? COLORS.textSecondary : COLORS.border}`,
                cursor: "pointer",
                transition: "all 0.15s ease-in-out",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                "&:hover": { borderColor: COLORS.textSecondary },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Draft Proposals
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary, mt: 0.5 }}>
                    {draftCount}
                  </Typography>
                  <Typography variant="caption" sx={{ color: COLORS.textMuted, mt: 0.3, display: "block" }}>
                    Under Preparation
                  </Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: "8px", bgcolor: "#F1F5F9", color: COLORS.textSecondary }}>
                  <PendingActionsIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* SEARCH & FILTER TOOLBAR */}
        <Paper elevation={0} sx={{ ...cardSx, p: 1.5, mb: 2, width: "100%", boxSizing: "border-box" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 1.5, width: "100%" }}>
            <Box sx={{ flex: "1 1 280px", minWidth: 220 }}>
              <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em", mb: 0.5 }}>
                Search Proposals
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by Quotation #, customer name, phone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 17, color: COLORS.textMuted }} />
                    </InputAdornment>
                  ),
                }}
                sx={controlSx}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em", mb: 0.5 }}>
                Filter Status
              </Typography>
              <ToggleButtonGroup
                value={statusFilter}
                exclusive
                onChange={(e, newStatus) => {
                  setStatusFilter(newStatus !== null ? newStatus : "");
                  setPage(0);
                }}
                size="small"
                sx={{
                  height: 38,
                  backgroundColor: "#F1F5F9",
                  borderRadius: "8px",
                  p: 0.3,
                  "& .MuiToggleButton-root": {
                    border: 0,
                    borderRadius: "6px",
                    px: 1.6,
                    py: 0.4,
                    fontSize: "0.76rem",
                    fontWeight: 600,
                    color: COLORS.textSecondary,
                    "&.Mui-selected": {
                      backgroundColor: COLORS.primary,
                      color: "#FFFFFF",
                      fontWeight: 700,
                    },
                  },
                }}
              >
                <ToggleButton value="">All</ToggleButton>
                <ToggleButton value="Sent">Sent</ToggleButton>
                <ToggleButton value="Accepted">Accepted</ToggleButton>
                <ToggleButton value="Draft">Draft</ToggleButton>
                <ToggleButton value="Rejected">Rejected</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setPage(0);
              }}
              startIcon={<FilterListOffIcon sx={{ fontSize: 15 }} />}
              sx={{ ...outlinedButtonSx, height: 38, borderRadius: "8px" }}
            >
              Reset
            </Button>
          </Box>
        </Paper>

        {/* BULK ACTIONS BAR */}
        <BulkDeleteBar
          selectedCount={selectedIds.length}
          totalCount={quotations.length}
          itemLabel="Quotations"
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          isAllSelected={selectedIds.length === quotations.length && quotations.length > 0}
          onConfirmDelete={handleBulkDelete}
          loading={bulkDeleting}
        />

        {/* QUOTATIONS CONTENT */}
        {loading ? (
          <Stack spacing={1.5}>
            {[1, 2, 3].map((sk) => (
              <Skeleton key={sk} variant="rounded" height={150} sx={{ borderRadius: "12px" }} />
            ))}
          </Stack>
        ) : quotations.length === 0 ? (
          <Paper elevation={0} sx={{ ...cardSx, p: 5, textAlign: "center" }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                backgroundColor: "#F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 1.5,
                color: COLORS.textMuted,
              }}
            >
              <DescriptionIcon sx={{ fontSize: 26 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, mb: 0.5, fontSize: "1rem" }}>
              No Quotations Found
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textMuted, maxWidth: 400, mx: "auto", mb: 2, fontSize: "0.78rem" }}>
              No solar proposals matched your search or status filter. Create a new quotation to get started.
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => setOpenCreateModal(true)}
              sx={primaryButtonSx}
            >
              + Create New Quotation
            </Button>
          </Paper>
        ) : viewMode === "box" ? (
          /* ============================================================
             BOX VIEW (EXECUTIVE, BALANCED, HIGH-DENSITY CRM CARDS)
             ============================================================ */
          <Stack spacing={2}>
            {paginatedQuotations.map((q) => {
              const publicToken = q.public_token || q.quotation_number || q.id;

              return (
                <Paper
                  key={q.id}
                  elevation={0}
                  sx={{
                    ...cardSx,
                    p: 2.2,
                    borderRadius: "14px",
                    border: `1px solid ${selectedIds.includes(q.id) ? COLORS.primary : COLORS.border}`,
                    bgcolor: selectedIds.includes(q.id) ? "#F8FAFC" : COLORS.card,
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: COLORS.borderStrong,
                      boxShadow: "0 4px 16px rgba(15,23,42,0.05)",
                    },
                  }}
                >
                  {/* Top Header Row with Generous Spacing */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2.2,
                      flexWrap: "wrap",
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 1.2,
                      }}
                    >
                      {/* Selection Checkbox */}
                      <Checkbox
                        size="small"
                        checked={selectedIds.includes(q.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(q.id);
                        }}
                        sx={{
                          p: 0.4,
                          color: COLORS.borderStrong,
                          "&.Mui-checked": { color: COLORS.primary },
                        }}
                      />

                      {/* Quotation Number Monospace Tag */}
                      <Box
                        sx={{
                          px: 1.2,
                          py: 0.4,
                          borderRadius: "6px",
                          backgroundColor: "#EFF6FF",
                          border: "1px solid #BFDBFE",
                          color: "#1D4ED8",
                          fontWeight: 800,
                          fontSize: "0.8rem",
                          fontFamily: "monospace",
                          letterSpacing: "0.03em",
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                      >
                        {q.quotation_number || `QUO-${q.id}`}
                      </Box>

                      {/* Customer Name */}
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: "1.02rem",
                          color: COLORS.textPrimary,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {q.customer_name}
                      </Typography>

                      {/* System Capacity Pill */}
                      <Chip
                        icon={<SolarIcon sx={{ fontSize: "14px !important", color: "#B45309 !important" }} />}
                        label={`${q.system_capacity_kw} kW • ${q.system_type || "On-Grid"}`}
                        size="small"
                        sx={{
                          height: 26,
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          backgroundColor: "#FEF3C7",
                          color: "#92400E",
                          border: "1px solid #FDE68A",
                          borderRadius: "6px",
                          px: 0.6,
                        }}
                      />

                      {/* Corporate Status Chip */}
                      {getStatusChip(q)}
                    </Box>

                    {/* Action Buttons Toolbar - Clean, Spaced & Distinct */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flexShrink: 0, flexWrap: "wrap" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<OpenInNewIcon sx={{ fontSize: 15 }} />}
                        onClick={() => window.open(`/quote/${publicToken}`, "_blank")}
                        sx={{
                          height: 34,
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          textTransform: "none",
                          borderRadius: "8px",
                          px: 1.6,
                          borderColor: COLORS.borderStrong,
                          color: COLORS.textPrimary,
                          bgcolor: "#FFFFFF",
                          "&:hover": { borderColor: COLORS.primary, bgcolor: "#F8FAFC" },
                        }}
                      >
                        Browser View
                      </Button>

                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<PictureAsPdfIcon sx={{ fontSize: 15 }} />}
                        onClick={() => window.open(`/quote/${publicToken}?download=true`, "_blank")}
                        sx={{
                          height: 34,
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          textTransform: "none",
                          borderRadius: "8px",
                          px: 1.8,
                          bgcolor: COLORS.primary,
                          color: "#FFFFFF",
                          boxShadow: "none",
                          "&:hover": { bgcolor: COLORS.primaryDark, boxShadow: "none" },
                        }}
                      >
                        PDF
                      </Button>

                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<ReceiptLongIcon sx={{ fontSize: 15 }} />}
                        onClick={() => setConvertInvoiceQuotation(q)}
                        sx={{
                          height: 34,
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          textTransform: "none",
                          borderRadius: "8px",
                          px: 1.8,
                          bgcolor: q.status === "Accepted" ? "#16A34A" : "#0284C7",
                          color: "#FFFFFF",
                          boxShadow: "none",
                          "&:hover": {
                            bgcolor: q.status === "Accepted" ? "#15803D" : "#0369A1",
                            boxShadow: "none",
                          },
                        }}
                      >
                        Convert to Invoice ➔
                      </Button>

                      {/* WhatsApp Quick Action */}
                      <Tooltip title="Share via WhatsApp">
                        <IconButton
                          size="small"
                          onClick={() => handleShareWhatsApp(q)}
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: "8px",
                            color: "#16A34A",
                            backgroundColor: "#DCFCE7",
                            "&:hover": { backgroundColor: "#16A34A", color: "#FFFFFF" },
                          }}
                        >
                          <WhatsAppIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>

                      {/* Clean More Options Dropdown Menu */}
                      <Tooltip title="More Actions">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setCardMenuAnchor(e.currentTarget);
                            setCardTargetQuotation(q);
                          }}
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: "8px",
                            border: `1px solid ${COLORS.border}`,
                            color: COLORS.textSecondary,
                            backgroundColor: "#F8FAFC",
                            "&:hover": { borderColor: COLORS.primary, backgroundColor: "#F1F5F9" },
                          }}
                        >
                          <MoreVertIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

                  {/* 3 Structured Columns with Proper Spacing */}
                  <Grid container spacing={2.2}>
                    {/* Column 1: System Specifications */}
                    <Grid item xs={12} sm={4}>
                      <Box
                        sx={{
                          p: 1.8,
                          borderRadius: "10px",
                          backgroundColor: "#F8FAFC",
                          border: `1px solid ${COLORS.border}`,
                          height: "100%",
                          boxSizing: "border-box",
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 0.6 }}>
                          <SolarIcon sx={{ fontSize: 15, color: COLORS.secondary }} /> Technical System Specs
                        </Typography>

                        <Typography sx={{ fontSize: "0.8rem", color: COLORS.textSecondary }}>
                          Capacity: <Box component="span" sx={{ fontWeight: 800, color: COLORS.textPrimary }}>{q.system_capacity_kw} kW ({q.system_type || "On-Grid"})</Box>
                        </Typography>

                        <Typography sx={{ fontSize: "0.8rem", color: COLORS.textSecondary }}>
                          PV Modules: <Box component="span" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>{q.panel_brand || "Waaree Mono PERC"} {q.panel_count ? `(${q.panel_count} Nos)` : ""}</Box>
                        </Typography>

                        <Typography sx={{ fontSize: "0.8rem", color: COLORS.textSecondary }}>
                          Inverter: <Box component="span" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>{q.inverter_brand || "Growatt / Solis"} ({q.inverter_capacity_kw || q.system_capacity_kw} kW)</Box>
                        </Typography>

                        <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary, mt: "auto", pt: 0.8 }}>
                          Mounting: <Box component="span" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>{q.structure_type || "Elevated GI Structure"}</Box>
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Column 2: Client & Contact */}
                    <Grid item xs={12} sm={4}>
                      <Box
                        sx={{
                          p: 1.8,
                          borderRadius: "10px",
                          backgroundColor: "#F8FAFC",
                          border: `1px solid ${COLORS.border}`,
                          height: "100%",
                          boxSizing: "border-box",
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 0.6 }}>
                          <PersonIcon sx={{ fontSize: 15, color: COLORS.primary }} /> Client &amp; Location
                        </Typography>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                          <PhoneIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                          <Typography sx={{ fontSize: "0.8rem", color: COLORS.textSecondary }}>
                            Phone:{" "}
                            <Box
                              component="a"
                              href={`tel:${q.customer_phone}`}
                              sx={{ fontWeight: 700, color: COLORS.primaryDark, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                            >
                              {q.customer_phone || "—"}
                            </Box>
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                          <EmailIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                          <Typography sx={{ fontSize: "0.8rem", color: COLORS.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            Email: <Box component="span" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>{q.customer_email || "Not provided"}</Box>
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                          <LocationIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                          <Typography sx={{ fontSize: "0.8rem", color: COLORS.textSecondary }}>
                            Location: <Box component="span" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>{[q.city, q.state].filter(Boolean).join(", ") || "Site Address"}</Box>
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mt: "auto", pt: 0.8 }}>
                          <CalendarIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                          <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary }}>
                            Created: <Box component="span" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>{formatDate(q.created_at)}</Box>
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Column 3: Commercial Financials */}
                    <Grid item xs={12} sm={4}>
                      <Box
                        sx={{
                          p: 1.8,
                          borderRadius: "10px",
                          backgroundColor: "#F8FAFC",
                          border: `1px solid ${COLORS.border}`,
                          height: "100%",
                          boxSizing: "border-box",
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 0.6 }}>
                          <TrendingUpIcon sx={{ fontSize: 15, color: COLORS.success }} /> Commercial Financials
                        </Typography>

                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}>Gross System Cost:</Typography>
                          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.textPrimary }}>
                            {formatCurrency(q.total_amount || (Number(q.net_payable_amount) + Number(q.subsidy_amount || 0)))}
                          </Typography>
                        </Box>

                        {Number(q.subsidy_amount) > 0 && (
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography sx={{ fontSize: "0.78rem", color: COLORS.success, fontWeight: 700 }}>PM Surya Ghar Subsidy:</Typography>
                            <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: COLORS.success }}>
                              - {formatCurrency(q.subsidy_amount)}
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ p: 1.4, bgcolor: "#FFFFFF", borderRadius: "8px", border: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", mt: "auto" }}>
                          <Box>
                            <Typography sx={{ fontSize: "0.66rem", fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase" }}>
                              Net Investment Payable
                            </Typography>
                            <Typography sx={{ fontSize: "1.1rem", fontWeight: 900, color: COLORS.primaryDark, mt: 0.2 }}>
                              {formatCurrency(q.net_payable_amount)}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PictureAsPdfIcon sx={{ fontSize: 14 }} />}
                            onClick={() => window.open(`/quote/${publicToken}?download=true`, "_blank")}
                            sx={{ ...outlinedButtonSx, height: 30, fontSize: "0.74rem", px: 1.4, borderRadius: "6px" }}
                          >
                            PDF
                          </Button>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              );
            })}
          </Stack>
        ) : (
          /* ============================================================
             TABLE VIEW (SMOOTH HORIZONTAL SCROLL & EXACT MATCH STYLE)
             ============================================================ */
          <Paper elevation={0} sx={{ ...cardSx, overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
            <TableContainer sx={{ width: "100%", overflowX: "auto", ...customScrollbarSx }}>
              <Table size="small" sx={{ width: "100%", minWidth: 1200 }}>
                <TableHead sx={{ backgroundColor: COLORS.primary }}>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ py: 1.2, pl: 2, bgcolor: COLORS.primary }}>
                      <Checkbox
                        size="small"
                        checked={paginatedQuotations.length > 0 && paginatedQuotations.every((q) => selectedIds.includes(q.id))}
                        indeterminate={paginatedQuotations.some((q) => selectedIds.includes(q.id)) && !paginatedQuotations.every((q) => selectedIds.includes(q.id))}
                        onChange={() => {
                          const pageIds = paginatedQuotations.map((q) => q.id);
                          const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
                          if (allSelected) {
                            setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
                          } else {
                            setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
                          }
                        }}
                        sx={{ color: "rgba(255,255,255,0.7)", "&.Mui-checked, &.MuiCheckbox-indeterminate": { color: "#FFFFFF" } }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem", whiteSpace: "nowrap", py: 1.2 }}>Quotation #</TableCell>
                    <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem", whiteSpace: "nowrap", minWidth: 160, py: 1.2 }}>Customer Name</TableCell>
                    <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem", whiteSpace: "nowrap", minWidth: 120, py: 1.2 }}>Phone</TableCell>
                    <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem", whiteSpace: "nowrap", minWidth: 140, py: 1.2 }}>System Capacity</TableCell>
                    <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem", whiteSpace: "nowrap", minWidth: 130, py: 1.2 }}>Net Investment</TableCell>
                    <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem", whiteSpace: "nowrap", minWidth: 110, py: 1.2 }}>Status</TableCell>
                    <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem", whiteSpace: "nowrap", minWidth: 110, py: 1.2 }}>Date</TableCell>
                    <TableCell align="right" sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem", whiteSpace: "nowrap", minWidth: 260, py: 1.2 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedQuotations.map((q) => {
                    const publicToken = q.public_token || q.quotation_number || q.id;

                    return (
                      <TableRow key={q.id} hover selected={selectedIds.includes(q.id)} sx={{ "&:last-child td, &:last-child th": { border: 0 }, "& td": { py: 1, px: 1.5 } }}>
                        <TableCell padding="checkbox" sx={{ py: 1, pl: 2 }}>
                          <Checkbox
                            size="small"
                            checked={selectedIds.includes(q.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleSelect(q.id);
                            }}
                            sx={{ color: COLORS.borderStrong, "&.Mui-checked": { color: COLORS.primary } }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.75rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                          <Box sx={{ px: 1, py: 0.3, bgcolor: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", borderRadius: "4px", display: "inline-block", fontFamily: "monospace" }}>
                            {q.quotation_number || `QUO-${q.id}`}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                          {q.customer_name}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}>{q.customer_phone}</TableCell>
                        <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {q.system_capacity_kw} kW ({q.system_type || "On-Grid"})
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.8rem", fontWeight: 800, color: COLORS.textPrimary, whiteSpace: "nowrap" }}>
                          {formatCurrency(q.net_payable_amount)}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{getStatusChip(q)}</TableCell>
                        <TableCell sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, whiteSpace: "nowrap" }}>
                          {formatDate(q.created_at)}
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          <Stack direction="row" spacing={0.6} justifyContent="flex-end" alignItems="center">
                            <Tooltip title="Browser View">
                              <IconButton size="small" onClick={() => window.open(`/quote/${publicToken}`, "_blank")} sx={iconActionBtnSx}>
                                <OpenInNewIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Download 1-Page PDF">
                              <IconButton size="small" onClick={() => window.open(`/quote/${publicToken}?download=true`, "_blank")} sx={iconActionBtnSx}>
                                <PictureAsPdfIcon sx={{ fontSize: 16, color: COLORS.primary }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Convert into Tax Invoice">
                              <IconButton
                                size="small"
                                onClick={() => setConvertInvoiceQuotation(q)}
                                sx={{
                                  ...iconActionBtnSx,
                                  color: q.status === "Accepted" ? "#16A34A" : "#0284C7",
                                  bgcolor: q.status === "Accepted" ? "#DCFCE7" : "#E0F2FE",
                                  "&:hover": { bgcolor: q.status === "Accepted" ? "#BBF7D0" : "#BAE6FD" },
                                }}
                              >
                                <ReceiptLongIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Share via WhatsApp">
                              <IconButton size="small" onClick={() => handleShareWhatsApp(q)} sx={{ ...iconActionBtnSx, color: "#16A34A", bgcolor: "#DCFCE7", "&:hover": { bgcolor: "#BBF7D0" } }}>
                                <WhatsAppIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Share via Email">
                              <IconButton size="small" onClick={() => handleShareEmail(q)} sx={iconActionBtnSx}>
                                <EmailIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Copy Link">
                              <IconButton size="small" onClick={() => handleCopyPublicLink(q)} sx={iconActionBtnSx}>
                                <ContentCopyIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Duplicate Quotation">
                              <IconButton size="small" onClick={() => handleDuplicate(q.id)} sx={iconActionBtnSx}>
                                <FileCopyIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Edit Details">
                              <IconButton size="small" onClick={() => handleOpenEdit(q)} sx={iconActionBtnSx}>
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDeleteConfirm(q.id)}
                                sx={{
                                  ...iconActionBtnSx,
                                  color: COLORS.danger,
                                  "&:hover": { bgcolor: COLORS.dangerSoft, borderColor: COLORS.danger },
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
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
          </Paper>
        )}

        {/* PAGINATION */}
        <TablePagination
          component="div"
          count={quotations.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
          sx={{ mt: 2, borderTop: `1px solid ${COLORS.border}` }}
        />

        {/* Status Change Menu */}
        <Menu
          anchorEl={statusMenuAnchor}
          open={Boolean(statusMenuAnchor)}
          onClose={() => setStatusMenuAnchor(null)}
          PaperProps={{ sx: { borderRadius: "8px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" } }}
        >
          <MenuItem onClick={() => handleStatusSelect("Draft")} sx={{ fontWeight: 600, fontSize: "0.8rem", color: "#475569" }}>
            Mark as Draft
          </MenuItem>
          <MenuItem onClick={() => handleStatusSelect("Sent")} sx={{ fontWeight: 600, fontSize: "0.8rem", color: "#0369A1" }}>
            Mark as Sent
          </MenuItem>
          <MenuItem onClick={() => handleStatusSelect("Accepted")} sx={{ fontWeight: 600, fontSize: "0.8rem", color: "#16A34A" }}>
            Mark as Accepted
          </MenuItem>
          <MenuItem onClick={() => handleStatusSelect("Rejected")} sx={{ fontWeight: 600, fontSize: "0.8rem", color: "#DC2626" }}>
            Mark as Rejected
          </MenuItem>
        </Menu>

        {/* Card More Actions Dropdown Menu */}
        <Menu
          anchorEl={cardMenuAnchor}
          open={Boolean(cardMenuAnchor)}
          onClose={() => {
            setCardMenuAnchor(null);
            setCardTargetQuotation(null);
          }}
          PaperProps={{ sx: { borderRadius: "10px", minWidth: 180, boxShadow: "0 8px 24px rgba(15,23,42,0.12)", p: 0.5 } }}
        >
          <MenuItem
            onClick={() => {
              if (cardTargetQuotation) handleShareEmail(cardTargetQuotation);
              setCardMenuAnchor(null);
            }}
            sx={{ fontSize: "0.78rem", fontWeight: 600, gap: 1.2, py: 0.8 }}
          >
            <EmailIcon sx={{ fontSize: 16, color: COLORS.textSecondary }} /> Share via Email
          </MenuItem>

          <MenuItem
            onClick={() => {
              if (cardTargetQuotation) handleCopyPublicLink(cardTargetQuotation);
              setCardMenuAnchor(null);
            }}
            sx={{ fontSize: "0.78rem", fontWeight: 600, gap: 1.2, py: 0.8 }}
          >
            <ContentCopyIcon sx={{ fontSize: 16, color: COLORS.textSecondary }} /> Copy Proposal Link
          </MenuItem>

          <MenuItem
            onClick={() => {
              if (cardTargetQuotation) handleDuplicate(cardTargetQuotation.id);
              setCardMenuAnchor(null);
            }}
            sx={{ fontSize: "0.78rem", fontWeight: 600, gap: 1.2, py: 0.8 }}
          >
            <FileCopyIcon sx={{ fontSize: 16, color: COLORS.textSecondary }} /> Duplicate Proposal
          </MenuItem>

          <MenuItem
            onClick={() => {
              if (cardTargetQuotation) handleOpenEdit(cardTargetQuotation);
              setCardMenuAnchor(null);
            }}
            sx={{ fontSize: "0.78rem", fontWeight: 600, gap: 1.2, py: 0.8 }}
          >
            <EditIcon sx={{ fontSize: 16, color: COLORS.textSecondary }} /> Edit Details
          </MenuItem>

          <Divider sx={{ my: 0.5 }} />

          <MenuItem
            onClick={() => {
              if (cardTargetQuotation) handleOpenDeleteConfirm(cardTargetQuotation.id);
              setCardMenuAnchor(null);
            }}
            sx={{ fontSize: "0.78rem", fontWeight: 700, gap: 1.2, py: 0.8, color: COLORS.danger, "&:hover": { bgcolor: COLORS.dangerSoft } }}
          >
            <DeleteIcon sx={{ fontSize: 16, color: COLORS.danger }} /> Delete Quotation
          </MenuItem>
        </Menu>

        {/* Create Modal */}
        <CreateQuotationModal
          open={openCreateModal}
          onClose={() => {
            setOpenCreateModal(false);
            fetchQuotations();
          }}
        />

        {/* Edit Modal */}
        <EditQuotationModal
          open={openEditModal}
          onClose={() => setOpenEditModal(false)}
          quotation={selectedQuotation}
          onUpdated={fetchQuotations}
        />

        {/* Convert to Invoice Modal */}
        {convertInvoiceQuotation && (
          <ConvertInvoiceModal
            open={Boolean(convertInvoiceQuotation)}
            quotationData={convertInvoiceQuotation}
            onClose={() => setConvertInvoiceQuotation(null)}
            onInvoiceCreated={() => {
              setConvertInvoiceQuotation(null);
              fetchQuotations();
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} PaperProps={{ sx: { borderRadius: "12px" } }}>
          <DialogTitle sx={{ fontWeight: 800, color: COLORS.danger, fontSize: "0.98rem" }}>
            Delete Solar Quotation
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontSize: "0.82rem", color: COLORS.textSecondary }}>
              Are you sure you want to delete this solar quotation? This action will permanently remove it from the system.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, pb: 2 }}>
            <Button onClick={() => setDeleteConfirmOpen(false)} sx={outlinedButtonSx}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleDeleteQuotation}
              disabled={deleting}
              sx={{ ...primaryButtonSx, bgcolor: COLORS.danger, "&:hover": { bgcolor: "#B91C1C" } }}
            >
              {deleting ? "Deleting..." : "Delete Quotation"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default QuotationList;
