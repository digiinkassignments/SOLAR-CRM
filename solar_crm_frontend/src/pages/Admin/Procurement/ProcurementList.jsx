import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Grid,
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
  Tooltip,
  Stack,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  Breadcrumbs,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";

// Icons
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

import toast from "react-hot-toast";
import api from "../../../utils/api";

// Theme constants
const COLORS = {
  primary: "#0F172A",
  secondary: "#F59E0B",
  background: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  primaryDark: "#0F172A",
};

// Status chip colors
const STATUS_CONFIG = {
  Draft: {
    color: "#64748B",
    bg: "#F1F5F9",
    border: "#CBD5E1",
  },
  Sent: {
    color: "#3B82F6",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  Confirmed: {
    color: "#6366F1",
    bg: "#EEF2FF",
    border: "#C7D2FE",
  },
  "Partial Delivery": {
    color: "#F59E0B",
    bg: "#FEF3C7",
    border: "#FDE68A",
  },
  Delivered: {
    color: "#10B981",
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
  Cancelled: {
    color: "#EF4444",
    bg: "#FEF2F2",
    border: "#FECACA",
  },
};

const STATUS_OPTIONS = [
  "Draft",
  "Sent",
  "Confirmed",
  "Partial Delivery",
  "Delivered",
  "Cancelled",
];

// Helper: Indian currency formatting
const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return (
    "₹" +
    num.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })
  );
};

// Helper: Date formatting
const formatDate = (dateVal) => {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

export default function ProcurementList() {
  const navigate = useNavigate();

  // Data state
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [projectsList, setProjectsList] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inTransit: 0,
    delivered: 0,
  });

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [viewMode, setViewMode] = useState("box"); // 'box' or 'table'
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // New PO Dialog State
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newOrderData, setNewOrderData] = useState({
    project_id: "",
    vendor_name: "",
    vendor_phone: "",
    vendor_email: "",
    expected_delivery_date: "",
    notes: "",
    items: [
      {
        item_name: "Solar Panels 540W Mono PERC",
        quantity: 10,
        unit: "Nos",
        unit_price: 11000,
      },
    ],
  });

  // View Details Dialog State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [actualDeliveryDate, setActualDeliveryDate] = useState("");

  // Fetch Procurement Stats from GET /api/procurement/stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/procurement/stats");
      if (res.data?.success && Array.isArray(res.data.data)) {
        const rows = res.data.data;
        let total = 0;
        let pending = 0;
        let inTransit = 0;
        let delivered = 0;

        rows.forEach((item) => {
          const count = Number(item.count) || 0;
          total += count;
          if (["Draft", "Sent", "Confirmed"].includes(item.status)) {
            pending += count;
          }
          if (item.status === "Partial Delivery") {
            inTransit += count;
          }
          if (item.status === "Delivered") {
            delivered += count;
          }
        });

        setStats({ total, pending, inTransit, delivered });
      }
    } catch (err) {
      console.error("fetchStats error:", err);
    }
  }, []);

  // Fetch Projects for Dropdown in New PO Dialog
  const fetchProjectsForDropdown = useCallback(async () => {
    try {
      const res = await api.get("/projects", { params: { limit: 100 } });
      if (res.data?.success) {
        setProjectsList(res.data.data?.projects || []);
      }
    } catch (err) {
      console.error("fetchProjectsForDropdown error:", err);
    }
  }, []);

  // Fetch Purchase Orders List from GET /api/procurement
  const fetchPurchaseOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        status: selectedStatus === "All" ? "" : selectedStatus,
        search: search.trim(),
      };

      const res = await api.get("/procurement", { params });
      if (res.data?.success) {
        setOrders(res.data.data?.orders || []);
        setTotalCount(res.data.data?.total || 0);
      } else {
        setOrders([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("fetchPurchaseOrders error:", err);
      toast.error(err.response?.data?.message || "Failed to load purchase orders");
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, selectedStatus, search]);

  useEffect(() => {
    fetchStats();
    fetchProjectsForDropdown();
  }, [fetchStats, fetchProjectsForDropdown]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  // Search handler (on Enter or submit)
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  };

  const handleClearFilters = () => {
    setSearch("");
    setSearchInput("");
    setSelectedStatus("All");
    setPage(0);
  };

  // Dynamic Items handler for New PO
  const handleItemChange = (index, field, value) => {
    setNewOrderData((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleAddItemRow = () => {
    setNewOrderData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { item_name: "", quantity: 1, unit: "Nos", unit_price: 0 },
      ],
    }));
  };

  const handleRemoveItemRow = (index) => {
    if (newOrderData.items.length <= 1) {
      toast.error("At least one item is required in the purchase order.");
      return;
    }
    setNewOrderData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Calculate Grand Total for New PO
  const computedGrandTotal = newOrderData.items.reduce((sum, itm) => {
    const q = parseFloat(itm.quantity) || 0;
    const p = parseFloat(itm.unit_price) || 0;
    return sum + q * p;
  }, 0);

  // Create Purchase Order Submit Handler
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newOrderData.vendor_name.trim()) {
      toast.error("Vendor Name is required.");
      return;
    }
    if (!newOrderData.project_id) {
      toast.error("Please select a linked Project.");
      return;
    }
    const hasEmptyItem = newOrderData.items.some(
      (itm) => !itm.item_name.trim() || Number(itm.quantity) <= 0
    );
    if (hasEmptyItem) {
      toast.error("Please provide valid item names and quantities.");
      return;
    }

    setCreating(true);
    try {
      const payload = {
        ...newOrderData,
        total_amount: computedGrandTotal,
      };

      const res = await api.post("/procurement", payload);
      if (res.data?.success) {
        toast.success(res.data.message || "Purchase order created successfully!");
        setNewModalOpen(false);
        setNewOrderData({
          project_id: "",
          vendor_name: "",
          vendor_phone: "",
          vendor_email: "",
          expected_delivery_date: "",
          notes: "",
          items: [
            {
              item_name: "Solar Panels 540W Mono PERC",
              quantity: 10,
              unit: "Nos",
              unit_price: 11000,
            },
          ],
        });
        fetchPurchaseOrders();
        fetchStats();
      }
    } catch (err) {
      console.error("handleCreateSubmit error:", err);
      toast.error(err.response?.data?.message || "Failed to create purchase order");
    } finally {
      setCreating(false);
    }
  };

  // Open Details Modal
  const handleOpenDetails = (po) => {
    setSelectedPO(po);
    setNewStatus(po.status || "Draft");
    setActualDeliveryDate(
      po.actual_delivery_date
        ? po.actual_delivery_date.substring(0, 10)
        : new Date().toISOString().substring(0, 10)
    );
    setDetailModalOpen(true);
  };

  // Update PO Status from Detail Modal
  const handleStatusUpdate = async () => {
    if (!selectedPO) return;
    setStatusUpdateLoading(true);
    try {
      const payload = {
        status: newStatus,
        actual_delivery_date:
          newStatus === "Delivered" ? actualDeliveryDate : null,
      };

      const res = await api.put(`/procurement/${selectedPO.id}/status`, payload);
      if (res.data?.success) {
        toast.success("Purchase order status updated successfully!");
        setSelectedPO((prev) => ({
          ...prev,
          status: newStatus,
          actual_delivery_date: payload.actual_delivery_date,
        }));
        fetchPurchaseOrders();
        fetchStats();
      }
    } catch (err) {
      console.error("handleStatusUpdate error:", err);
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Status Chip Renderer
  const renderStatusChip = (statusName) => {
    const config = STATUS_CONFIG[statusName] || {
      color: COLORS.textSecondary,
      bg: "#F1F5F9",
      border: COLORS.border,
    };

    return (
      <Chip
        label={statusName || "Draft"}
        size="small"
        sx={{
          color: config.color,
          backgroundColor: config.bg,
          border: `1px solid ${config.border}`,
          fontWeight: 700,
          fontSize: "0.72rem",
          height: 24,
          borderRadius: "6px",
        }}
      />
    );
  };

  const hasActiveFilters = Boolean(search || selectedStatus !== "All");

  return (
    <Box
      sx={{
        backgroundColor: COLORS.background,
        minHeight: "100vh",
        p: 2.5,
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "100%", mx: "auto" }}>
        {/* 1. BREADCRUMBS */}
        <Breadcrumbs
          separator={
            <NavigateNextRoundedIcon
              sx={{ fontSize: "0.8rem", color: COLORS.textMuted }}
            />
          }
          sx={{ mb: 1.5 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            gap={0.5}
            sx={{ cursor: "pointer" }}
            onClick={() => navigate("/dashboard")}
          >
            <HomeOutlinedIcon
              sx={{ fontSize: "0.85rem", color: COLORS.textMuted }}
            />
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: COLORS.textMuted,
                "&:hover": { color: COLORS.primary },
              }}
            >
              Dashboard
            </Typography>
          </Stack>
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: COLORS.primaryDark,
            }}
          >
            Procurement
          </Typography>
        </Breadcrumbs>

        {/* 2. HERO HEADER PAPER */}
        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            mb: 2.5,
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
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: COLORS.textPrimary,
                fontSize: "1.15rem",
                letterSpacing: "-0.01em",
              }}
            >
              Procurement & Purchase Orders
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: COLORS.textSecondary,
                fontSize: "0.78rem",
                mt: 0.2,
              }}
            >
              Manage vendor purchase orders and material delivery tracking
            </Typography>
          </Box>

          <Stack
            direction="row"
            alignItems="center"
            gap={1}
            sx={{ flexShrink: 0, flexWrap: "wrap" }}
          >
            {/* View Toggle */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newView) => newView && setViewMode(newView)}
              size="small"
              sx={{
                height: 36,
                backgroundColor: "#F1F5F9",
                borderRadius: "6px",
                p: 0.3,
                "& .MuiToggleButton-root": {
                  border: 0,
                  borderRadius: "4px",
                  px: 1.4,
                  py: 0.4,
                  color: COLORS.textSecondary,
                  "&.Mui-selected": {
                    backgroundColor: COLORS.card,
                    color: COLORS.primary,
                    fontWeight: 700,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  },
                },
              }}
            >
              <ToggleButton value="box">
                <Tooltip title="Box / Card View">
                  <Stack direction="row" alignItems="center" gap={0.6}>
                    <ViewListOutlinedIcon sx={{ fontSize: 17 }} />
                    <Typography sx={{ fontSize: "0.74rem", fontWeight: 700 }}>
                      Box
                    </Typography>
                  </Stack>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="table">
                <Tooltip title="Table View">
                  <Stack direction="row" alignItems="center" gap={0.6}>
                    <TableChartOutlinedIcon sx={{ fontSize: 17 }} />
                    <Typography sx={{ fontSize: "0.74rem", fontWeight: 700 }}>
                      Table
                    </Typography>
                  </Stack>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Refresh Button */}
            <Tooltip title="Refresh Purchase Orders & Stats">
              <span>
                <IconButton
                  onClick={() => {
                    fetchPurchaseOrders();
                    fetchStats();
                  }}
                  disabled={loading}
                  size="small"
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "6px",
                    border: `1px solid ${COLORS.border}`,
                    backgroundColor: COLORS.card,
                    color: COLORS.textPrimary,
                    "&:hover": { backgroundColor: "#F8FAFC" },
                  }}
                >
                  <RefreshIcon
                    sx={{
                      fontSize: 18,
                      animation: loading ? "spin 0.8s linear infinite" : "none",
                      "@keyframes spin": {
                        from: { transform: "rotate(0deg)" },
                        to: { transform: "rotate(360deg)" },
                      },
                    }}
                  />
                </IconButton>
              </span>
            </Tooltip>

            {/* New Purchase Order Button */}
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 17 }} />}
              onClick={() => setNewModalOpen(true)}
              sx={{
                height: 36,
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.8rem",
                px: 2,
                backgroundColor: COLORS.primary,
                color: "#FFFFFF",
                whiteSpace: "nowrap",
                "&:hover": { backgroundColor: "#020617" },
              }}
            >
              New Purchase Order
            </Button>
          </Stack>
        </Paper>

        {/* 3. STATS ROW (4 Cards, click to filter) */}
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          {/* Total POs */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              onClick={() => {
                setSelectedStatus("All");
                setPage(0);
              }}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: `1px solid ${
                  selectedStatus === "All" ? COLORS.primary : COLORS.border
                }`,
                backgroundColor: COLORS.card,
                cursor: "pointer",
                transition: "all 0.15s ease-in-out",
                "&:hover": {
                  borderColor: COLORS.primary,
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
                },
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Total POs
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "1.6rem",
                      fontWeight: 900,
                      color: COLORS.primaryDark,
                      mt: 0.3,
                    }}
                  >
                    {stats.total}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "10px",
                    backgroundColor: "#EFF6FF",
                    color: "#2563EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Inventory2OutlinedIcon sx={{ fontSize: 22 }} />
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* Pending (Draft + Sent + Confirmed) */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              onClick={() => {
                setSelectedStatus("Pending");
                setPage(0);
              }}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: `1px solid ${
                  selectedStatus === "Pending" ? "#6366F1" : COLORS.border
                }`,
                backgroundColor: COLORS.card,
                cursor: "pointer",
                transition: "all 0.15s ease-in-out",
                "&:hover": {
                  borderColor: "#6366F1",
                  boxShadow: "0 2px 8px rgba(99, 102, 241, 0.08)",
                },
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Pending
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "1.6rem",
                      fontWeight: 900,
                      color: "#4F46E5",
                      mt: 0.3,
                    }}
                  >
                    {stats.pending}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "10px",
                    backgroundColor: "#EEF2FF",
                    color: "#4F46E5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PendingActionsOutlinedIcon sx={{ fontSize: 22 }} />
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* In Transit (Partial Delivery) */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              onClick={() => {
                setSelectedStatus("In Transit");
                setPage(0);
              }}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: `1px solid ${
                  selectedStatus === "In Transit" ? "#F59E0B" : COLORS.border
                }`,
                backgroundColor: COLORS.card,
                cursor: "pointer",
                transition: "all 0.15s ease-in-out",
                "&:hover": {
                  borderColor: "#F59E0B",
                  boxShadow: "0 2px 8px rgba(245, 158, 11, 0.08)",
                },
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    In Transit
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "1.6rem",
                      fontWeight: 900,
                      color: "#D97706",
                      mt: 0.3,
                    }}
                  >
                    {stats.inTransit}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "10px",
                    backgroundColor: "#FEF3C7",
                    color: "#D97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LocalShippingOutlinedIcon sx={{ fontSize: 22 }} />
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* Delivered */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={0}
              onClick={() => {
                setSelectedStatus("Delivered");
                setPage(0);
              }}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: `1px solid ${
                  selectedStatus === "Delivered" ? "#10B981" : COLORS.border
                }`,
                backgroundColor: COLORS.card,
                cursor: "pointer",
                transition: "all 0.15s ease-in-out",
                "&:hover": {
                  borderColor: "#10B981",
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)",
                },
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Delivered
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "1.6rem",
                      fontWeight: 900,
                      color: "#059669",
                      mt: 0.3,
                    }}
                  >
                    {stats.delivered}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "10px",
                    backgroundColor: "#D1FAE5",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircleOutlinedIcon sx={{ fontSize: 22 }} />
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* 4. FILTER BAR */}
        <Paper
          elevation={0}
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            p: 1.8,
            mb: 2.5,
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1.5,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Search Input */}
          <Box sx={{ flex: "1 1 240px", minWidth: 200 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by PO number, vendor name, project..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: COLORS.textMuted }} />
                  </InputAdornment>
                ),
                endAdornment: searchInput && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearchInput("");
                        setSearch("");
                        setPage(0);
                      }}
                      sx={{ p: 0.2 }}
                    >
                      <CloseIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: 38,
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  backgroundColor: "#FFFFFF",
                },
              }}
            />
          </Box>

          {/* Status Dropdown */}
          <Box sx={{ flex: "0 0 200px", minWidth: 170 }}>
            <FormControl fullWidth size="small">
              <Select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(0);
                }}
                sx={{
                  height: 38,
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <MenuItem value="All">All Statuses</MenuItem>
                <MenuItem value="Pending">Pending (Draft/Sent/Conf)</MenuItem>
                <MenuItem value="In Transit">In Transit (Partial)</MenuItem>
                {STATUS_OPTIONS.map((stg) => (
                  <MenuItem key={stg} value={stg}>
                    {stg}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Search Button */}
          <Button
            type="submit"
            variant="contained"
            size="small"
            sx={{
              height: 38,
              borderRadius: "6px",
              px: 2,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.8rem",
              backgroundColor: COLORS.primary,
              color: "#FFFFFF",
              "&:hover": { backgroundColor: "#020617" },
            }}
          >
            Search
          </Button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterListOffIcon sx={{ fontSize: 16 }} />}
              onClick={handleClearFilters}
              sx={{
                height: 38,
                borderRadius: "6px",
                px: 1.5,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.78rem",
                color: COLORS.textSecondary,
                borderColor: COLORS.border,
                "&:hover": {
                  borderColor: COLORS.primary,
                  backgroundColor: "#F8FAFC",
                },
              }}
            >
              Clear Filters
            </Button>
          )}
        </Paper>

        {/* 5. CONTENT SECTION: Skeletons vs Data */}
        {loading ? (
          viewMode === "box" ? (
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.2,
                      borderRadius: "12px",
                      border: `1px solid ${COLORS.border}`,
                      backgroundColor: COLORS.card,
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      sx={{ mb: 1.5 }}
                    >
                      <Skeleton variant="rectangular" width={110} height={24} />
                      <Skeleton variant="rectangular" width={70} height={24} />
                    </Stack>
                    <Skeleton variant="text" width="70%" height={26} />
                    <Skeleton variant="text" width="50%" height={20} />
                    <Skeleton
                      variant="rectangular"
                      height={40}
                      sx={{ my: 1.5, borderRadius: "6px" }}
                    />
                    <Skeleton variant="text" width="40%" height={22} />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <Skeleton variant="rectangular" height={300} />
            </Paper>
          )
        ) : orders.length === 0 ? (
          /* Empty State */
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: "12px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.card,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "#F1F5F9",
                color: COLORS.textMuted,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <Inventory2OutlinedIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: COLORS.textPrimary,
                fontSize: "1.05rem",
              }}
            >
              No Purchase Orders Found
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: COLORS.textSecondary,
                fontSize: "0.82rem",
                mt: 0.5,
                mb: 2.5,
                maxWidth: 400,
                mx: "auto",
              }}
            >
              {hasActiveFilters
                ? "No purchase orders match your current filter conditions. Try clearing filters or searching for different keywords."
                : "Get started by generating your first material purchase order for vendor supply tracking."}
            </Typography>
            {hasActiveFilters ? (
              <Button
                variant="outlined"
                size="small"
                onClick={handleClearFilters}
                sx={{
                  borderRadius: "6px",
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: COLORS.border,
                  color: COLORS.textPrimary,
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                onClick={() => setNewModalOpen(true)}
                sx={{
                  borderRadius: "6px",
                  textTransform: "none",
                  fontWeight: 700,
                  backgroundColor: COLORS.primary,
                  color: "#FFFFFF",
                }}
              >
                Create Purchase Order
              </Button>
            )}
          </Paper>
        ) : viewMode === "box" ? (
          /* BOX VIEW */
          <>
            <Grid container spacing={2}>
              {orders.map((po) => {
                const itemCount = Array.isArray(po.items)
                  ? po.items.length
                  : 0;

                return (
                  <Grid item xs={12} sm={6} md={4} key={po.id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.2,
                        borderRadius: "12px",
                        border: `1px solid ${COLORS.border}`,
                        backgroundColor: COLORS.card,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        height: "100%",
                        boxSizing: "border-box",
                        transition: "all 0.15s ease-in-out",
                        "&:hover": {
                          borderColor: COLORS.primary,
                          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
                        },
                      }}
                    >
                      <Box>
                        {/* Top: PO Number pill + Status chip */}
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{ mb: 1.5 }}
                        >
                          <Typography
                            sx={{
                              fontFamily: "monospace",
                              fontWeight: 800,
                              fontSize: "0.82rem",
                              backgroundColor: "#F1F5F9",
                              color: COLORS.primaryDark,
                              px: 1.1,
                              py: 0.35,
                              borderRadius: "6px",
                              letterSpacing: "0.02em",
                              border: "1px solid #E2E8F0",
                            }}
                          >
                            {po.po_number}
                          </Typography>
                          {renderStatusChip(po.status)}
                        </Stack>

                        {/* Vendor Name & Phone */}
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 800,
                            color: COLORS.textPrimary,
                            fontSize: "0.95rem",
                            lineHeight: 1.25,
                            mb: 0.4,
                          }}
                        >
                          {po.vendor_name}
                        </Typography>

                        {po.vendor_phone && (
                          <Stack
                            direction="row"
                            alignItems="center"
                            gap={0.6}
                            sx={{ mb: 1.2 }}
                          >
                            <PhoneIcon
                              sx={{ fontSize: 13, color: COLORS.textMuted }}
                            />
                            <Typography
                              component="a"
                              href={`tel:${po.vendor_phone}`}
                              sx={{
                                fontSize: "0.76rem",
                                color: COLORS.textSecondary,
                                textDecoration: "none",
                                fontWeight: 500,
                                "&:hover": {
                                  color: COLORS.primary,
                                  textDecoration: "underline",
                                },
                              }}
                            >
                              {po.vendor_phone}
                            </Typography>
                          </Stack>
                        )}

                        {/* Linked Project Box */}
                        <Box
                          sx={{
                            backgroundColor: "#F8FAFC",
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: "8px",
                            p: 1.2,
                            mb: 1.5,
                          }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            gap={0.6}
                            sx={{ mb: 0.3 }}
                          >
                            <EngineeringOutlinedIcon
                              sx={{ fontSize: 14, color: COLORS.textMuted }}
                            />
                            <Typography
                              sx={{
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                color: COLORS.primaryDark,
                              }}
                            >
                              {po.project_number || "Direct Order"}
                            </Typography>
                          </Stack>
                          {po.customer_name && (
                            <Typography
                              sx={{
                                fontSize: "0.72rem",
                                color: COLORS.textSecondary,
                                ml: 2.2,
                              }}
                            >
                              Customer: {po.customer_name}
                            </Typography>
                          )}
                        </Box>

                        {/* Total Amount & Items Count */}
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{ mb: 1 }}
                        >
                          <Box>
                            <Typography
                              sx={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                color: COLORS.textMuted,
                                textTransform: "uppercase",
                              }}
                            >
                              Total Amount
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: "1.05rem",
                                fontWeight: 900,
                                color: COLORS.primaryDark,
                              }}
                            >
                              {formatCurrency(po.total_amount)}
                            </Typography>
                          </Box>

                          <Chip
                            label={`${itemCount} ${
                              itemCount === 1 ? "item" : "items"
                            }`}
                            size="small"
                            sx={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              backgroundColor: "#F1F5F9",
                              color: COLORS.textSecondary,
                              height: 22,
                              borderRadius: "4px",
                            }}
                          />
                        </Stack>

                        {/* Expected Delivery */}
                        <Stack
                          direction="row"
                          alignItems="center"
                          gap={0.6}
                          sx={{ mb: 1.5 }}
                        >
                          <CalendarTodayIcon
                            sx={{ fontSize: 13, color: COLORS.textMuted }}
                          />
                          <Typography
                            sx={{
                              fontSize: "0.74rem",
                              color: COLORS.textSecondary,
                            }}
                          >
                            Expected: {formatDate(po.expected_delivery_date)}
                          </Typography>
                        </Stack>
                      </Box>

                      {/* Actions: View Details Button */}
                      <Box sx={{ pt: 1, borderTop: `1px solid ${COLORS.border}` }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon sx={{ fontSize: 15 }} />}
                          onClick={() => handleOpenDetails(po)}
                          sx={{
                            borderRadius: "6px",
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "0.78rem",
                            borderColor: COLORS.border,
                            color: COLORS.primary,
                            "&:hover": {
                              borderColor: COLORS.primary,
                              backgroundColor: "#F8FAFC",
                            },
                          }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>

            {/* Pagination for Box View */}
            <Box sx={{ mt: 2.5, display: "flex", justifyContent: "flex-end" }}>
              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[9, 15, 30, 60]}
                sx={{
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "8px",
                  backgroundColor: COLORS.card,
                }}
              />
            </Box>
          </>
        ) : (
          /* 6. TABLE VIEW */
          <Paper
            elevation={0}
            sx={{
              borderRadius: "12px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.card,
              overflow: "hidden",
            }}
          >
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        color: COLORS.textSecondary,
                        py: 1.5,
                      }}
                    >
                      PO No
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        color: COLORS.textSecondary,
                      }}
                    >
                      Vendor
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        color: COLORS.textSecondary,
                      }}
                    >
                      Project
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        color: COLORS.textSecondary,
                      }}
                    >
                      Items
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        color: COLORS.textSecondary,
                      }}
                    >
                      Total Amount
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        color: COLORS.textSecondary,
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        color: COLORS.textSecondary,
                      }}
                    >
                      Expected Delivery
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        color: COLORS.textSecondary,
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((po) => {
                    const itemCount = Array.isArray(po.items)
                      ? po.items.length
                      : 0;

                    return (
                      <TableRow
                        key={po.id}
                        hover
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                          cursor: "pointer",
                        }}
                        onClick={() => handleOpenDetails(po)}
                      >
                        <TableCell>
                          <Typography
                            sx={{
                              fontFamily: "monospace",
                              fontWeight: 800,
                              fontSize: "0.78rem",
                              color: COLORS.primaryDark,
                            }}
                          >
                            {po.po_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.82rem",
                              color: COLORS.textPrimary,
                            }}
                          >
                            {po.vendor_name}
                          </Typography>
                          {po.vendor_phone && (
                            <Typography
                              sx={{
                                fontSize: "0.72rem",
                                color: COLORS.textSecondary,
                              }}
                            >
                              {po.vendor_phone}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography
                            sx={{
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              color: COLORS.primaryDark,
                            }}
                          >
                            {po.project_number || "—"}
                          </Typography>
                          {po.customer_name && (
                            <Typography
                              sx={{
                                fontSize: "0.72rem",
                                color: COLORS.textSecondary,
                              }}
                            >
                              {po.customer_name}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${itemCount} items`}
                            size="small"
                            sx={{
                              fontSize: "0.68rem",
                              height: 20,
                              borderRadius: "4px",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.82rem",
                              color: COLORS.primaryDark,
                            }}
                          >
                            {formatCurrency(po.total_amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>{renderStatusChip(po.status)}</TableCell>
                        <TableCell>
                          <Typography
                            sx={{
                              fontSize: "0.78rem",
                              color: COLORS.textSecondary,
                            }}
                          >
                            {formatDate(po.expected_delivery_date)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDetails(po)}
                              sx={{
                                border: `1px solid ${COLORS.border}`,
                                borderRadius: "6px",
                                p: 0.6,
                                "&:hover": {
                                  backgroundColor: "#F1F5F9",
                                  borderColor: COLORS.primary,
                                },
                              }}
                            >
                              <VisibilityIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 15, 25, 50]}
            />
          </Paper>
        )}
      </Box>

      {/* 7. NEW PO DIALOG */}
      <Dialog
        open={newModalOpen}
        onClose={() => !creating && setNewModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "14px",
            p: 1,
            backgroundColor: COLORS.card,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            color: COLORS.primaryDark,
            fontSize: "1.1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
            Create New Purchase Order
          </Typography>
          <IconButton
            size="small"
            onClick={() => setNewModalOpen(false)}
            disabled={creating}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: COLORS.border, py: 2.5 }}>
          <Box component="form" onSubmit={handleCreateSubmit}>
            <Grid container spacing={2}>
              {/* Linked Project */}
              <Grid item xs={12} sm={6}>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    mb: 0.5,
                  }}
                >
                  Select Project *
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={newOrderData.project_id}
                    onChange={(e) =>
                      setNewOrderData((prev) => ({
                        ...prev,
                        project_id: e.target.value,
                      }))
                    }
                    displayEmpty
                    required
                    sx={{ borderRadius: "6px", fontSize: "0.82rem" }}
                  >
                    <MenuItem value="" disabled>
                      Select linked project...
                    </MenuItem>
                    {projectsList.map((pj) => (
                      <MenuItem key={pj.id} value={pj.id}>
                        {pj.project_number} — {pj.customer_name} (
                        {pj.system_capacity_kw} kW)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Vendor Name */}
              <Grid item xs={12} sm={6}>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    mb: 0.5,
                  }}
                >
                  Vendor Name *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  required
                  placeholder="e.g. Vikram Solar Technologies Ltd."
                  value={newOrderData.vendor_name}
                  onChange={(e) =>
                    setNewOrderData((prev) => ({
                      ...prev,
                      vendor_name: e.target.value,
                    }))
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "6px",
                      fontSize: "0.82rem",
                    },
                  }}
                />
              </Grid>

              {/* Vendor Phone */}
              <Grid item xs={12} sm={6}>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    mb: 0.5,
                  }}
                >
                  Vendor Phone
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="+91 98765 43210"
                  value={newOrderData.vendor_phone}
                  onChange={(e) =>
                    setNewOrderData((prev) => ({
                      ...prev,
                      vendor_phone: e.target.value,
                    }))
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "6px",
                      fontSize: "0.82rem",
                    },
                  }}
                />
              </Grid>

              {/* Vendor Email */}
              <Grid item xs={12} sm={6}>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    mb: 0.5,
                  }}
                >
                  Vendor Email
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="email"
                  placeholder="orders@vendor.com"
                  value={newOrderData.vendor_email}
                  onChange={(e) =>
                    setNewOrderData((prev) => ({
                      ...prev,
                      vendor_email: e.target.value,
                    }))
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "6px",
                      fontSize: "0.82rem",
                    },
                  }}
                />
              </Grid>

              {/* Expected Delivery Date */}
              <Grid item xs={12} sm={6}>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    mb: 0.5,
                  }}
                >
                  Expected Delivery Date
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={newOrderData.expected_delivery_date}
                  onChange={(e) =>
                    setNewOrderData((prev) => ({
                      ...prev,
                      expected_delivery_date: e.target.value,
                    }))
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "6px",
                      fontSize: "0.82rem",
                    },
                  }}
                />
              </Grid>

              {/* Notes */}
              <Grid item xs={12} sm={6}>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    mb: 0.5,
                  }}
                >
                  Procurement Notes
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Dispatch instructions, warranty terms..."
                  value={newOrderData.notes}
                  onChange={(e) =>
                    setNewOrderData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "6px",
                      fontSize: "0.82rem",
                    },
                  }}
                />
              </Grid>

              {/* ITEMS SECTION */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1.5, borderColor: COLORS.border }} />
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1.5 }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.85rem",
                      fontWeight: 800,
                      color: COLORS.primaryDark,
                    }}
                  >
                    Items List
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                    onClick={handleAddItemRow}
                    sx={{
                      textTransform: "none",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: COLORS.primary,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "6px",
                      "&:hover": { backgroundColor: "#F8FAFC" },
                    }}
                  >
                    Add Item
                  </Button>
                </Stack>

                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
                          Item Name *
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            width: "90px",
                          }}
                        >
                          Qty *
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            width: "90px",
                          }}
                        >
                          Unit
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            width: "120px",
                          }}
                        >
                          Unit Price (₹)
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            width: "120px",
                          }}
                        >
                          Total (₹)
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            width: "50px",
                          }}
                        />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {newOrderData.items.map((row, idx) => {
                        const rowTotal =
                          (parseFloat(row.quantity) || 0) *
                          (parseFloat(row.unit_price) || 0);

                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="e.g. Solar Inverter 5kW"
                                value={row.item_name}
                                onChange={(e) =>
                                  handleItemChange(
                                    idx,
                                    "item_name",
                                    e.target.value
                                  )
                                }
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    fontSize: "0.78rem",
                                    height: 32,
                                  },
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                inputProps={{ min: 1 }}
                                value={row.quantity}
                                onChange={(e) =>
                                  handleItemChange(
                                    idx,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    fontSize: "0.78rem",
                                    height: 32,
                                  },
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                fullWidth
                                size="small"
                                value={row.unit || "Nos"}
                                onChange={(e) =>
                                  handleItemChange(idx, "unit", e.target.value)
                                }
                                sx={{ fontSize: "0.78rem", height: 32 }}
                              >
                                <MenuItem value="Nos">Nos</MenuItem>
                                <MenuItem value="kW">kW</MenuItem>
                                <MenuItem value="Sets">Sets</MenuItem>
                                <MenuItem value="Pcs">Pcs</MenuItem>
                                <MenuItem value="Meters">Meters</MenuItem>
                                <MenuItem value="Lots">Lots</MenuItem>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                inputProps={{ min: 0, step: "0.01" }}
                                value={row.unit_price}
                                onChange={(e) =>
                                  handleItemChange(
                                    idx,
                                    "unit_price",
                                    e.target.value
                                  )
                                }
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    fontSize: "0.78rem",
                                    height: 32,
                                  },
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                sx={{
                                  fontSize: "0.78rem",
                                  fontWeight: 700,
                                  color: COLORS.primaryDark,
                                }}
                              >
                                {formatCurrency(rowTotal)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveItemRow(idx)}
                                sx={{ color: "#EF4444" }}
                              >
                                <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Grand Total Summary */}
                <Stack
                  direction="row"
                  justifyContent="flex-end"
                  alignItems="center"
                  gap={2}
                  sx={{ mt: 1.5 }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                    }}
                  >
                    Grand Total Amount:
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "1.2rem",
                      fontWeight: 900,
                      color: COLORS.primaryDark,
                    }}
                  >
                    {formatCurrency(computedGrandTotal)}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setNewModalOpen(false)}
            disabled={creating}
            sx={{
              color: COLORS.textSecondary,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateSubmit}
            disabled={creating}
            sx={{
              backgroundColor: COLORS.primary,
              fontWeight: 700,
              textTransform: "none",
              px: 3,
              borderRadius: "6px",
              "&:hover": { backgroundColor: "#020617" },
            }}
          >
            {creating ? "Creating..." : "Save Purchase Order"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 8. VIEW DETAILS DIALOG */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "14px",
            p: 1,
            backgroundColor: COLORS.card,
          },
        }}
      >
        {selectedPO && (
          <>
            <DialogTitle
              sx={{
                fontWeight: 800,
                color: COLORS.primaryDark,
                fontSize: "1.1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                pb: 1,
              }}
            >
              <Stack direction="row" alignItems="center" gap={1.2}>
                <Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
                  Purchase Order {selectedPO.po_number}
                </Typography>
                {renderStatusChip(selectedPO.status)}
              </Stack>
              <IconButton size="small" onClick={() => setDetailModalOpen(false)}>
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ borderColor: COLORS.border, py: 2.5 }}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {/* Vendor Details */}
                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.8,
                      borderRadius: "10px",
                      border: `1px solid ${COLORS.border}`,
                      backgroundColor: "#F8FAFC",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: COLORS.textMuted,
                        textTransform: "uppercase",
                        mb: 0.8,
                      }}
                    >
                      Vendor Information
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.95rem",
                        color: COLORS.textPrimary,
                      }}
                    >
                      {selectedPO.vendor_name}
                    </Typography>
                    {selectedPO.vendor_phone && (
                      <Stack
                        direction="row"
                        alignItems="center"
                        gap={0.6}
                        sx={{ mt: 0.5 }}
                      >
                        <PhoneIcon
                          sx={{ fontSize: 13, color: COLORS.textMuted }}
                        />
                        <Typography
                          component="a"
                          href={`tel:${selectedPO.vendor_phone}`}
                          sx={{
                            fontSize: "0.78rem",
                            color: COLORS.textSecondary,
                            textDecoration: "none",
                          }}
                        >
                          {selectedPO.vendor_phone}
                        </Typography>
                      </Stack>
                    )}
                    {selectedPO.vendor_email && (
                      <Stack
                        direction="row"
                        alignItems="center"
                        gap={0.6}
                        sx={{ mt: 0.3 }}
                      >
                        <EmailIcon
                          sx={{ fontSize: 13, color: COLORS.textMuted }}
                        />
                        <Typography
                          component="a"
                          href={`mailto:${selectedPO.vendor_email}`}
                          sx={{
                            fontSize: "0.78rem",
                            color: COLORS.textSecondary,
                            textDecoration: "none",
                          }}
                        >
                          {selectedPO.vendor_email}
                        </Typography>
                      </Stack>
                    )}
                  </Paper>
                </Grid>

                {/* Project Details */}
                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.8,
                      borderRadius: "10px",
                      border: `1px solid ${COLORS.border}`,
                      backgroundColor: "#F8FAFC",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: COLORS.textMuted,
                        textTransform: "uppercase",
                        mb: 0.8,
                      }}
                    >
                      Linked Project
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.95rem",
                        color: COLORS.textPrimary,
                      }}
                    >
                      {selectedPO.project_number || "Direct Order"}
                    </Typography>
                    {selectedPO.customer_name && (
                      <Typography
                        sx={{
                          fontSize: "0.78rem",
                          color: COLORS.textSecondary,
                          mt: 0.4,
                        }}
                      >
                        Customer: {selectedPO.customer_name}
                      </Typography>
                    )}
                    {selectedPO.system_capacity_kw && (
                      <Typography
                        sx={{
                          fontSize: "0.78rem",
                          color: COLORS.textSecondary,
                        }}
                      >
                        Capacity: {selectedPO.system_capacity_kw} kW
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                {/* Dates & Notes */}
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.8,
                      borderRadius: "10px",
                      border: `1px solid ${COLORS.border}`,
                      backgroundColor: "#F8FAFC",
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: COLORS.textMuted,
                            textTransform: "uppercase",
                          }}
                        >
                          Expected Delivery
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            color: COLORS.textPrimary,
                            mt: 0.3,
                          }}
                        >
                          {formatDate(selectedPO.expected_delivery_date)}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <Typography
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: COLORS.textMuted,
                            textTransform: "uppercase",
                          }}
                        >
                          Actual Delivery
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            color: COLORS.textPrimary,
                            mt: 0.3,
                          }}
                        >
                          {formatDate(selectedPO.actual_delivery_date)}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <Typography
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: COLORS.textMuted,
                            textTransform: "uppercase",
                          }}
                        >
                          Created By
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            color: COLORS.textPrimary,
                            mt: 0.3,
                          }}
                        >
                          {selectedPO.created_by_name || "Admin"}
                        </Typography>
                      </Grid>

                      {selectedPO.notes && (
                        <Grid item xs={12}>
                          <Typography
                            sx={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              color: COLORS.textMuted,
                              textTransform: "uppercase",
                            }}
                          >
                            Notes
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "0.8rem",
                              color: COLORS.textSecondary,
                              mt: 0.3,
                            }}
                          >
                            {selectedPO.notes}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>

              {/* Items Table */}
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  color: COLORS.primaryDark,
                  mb: 1,
                }}
              >
                Ordered Material Items
              </Typography>

              <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "8px",
                  overflow: "hidden",
                  mb: 2,
                }}
              >
                <Table size="small">
                  <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
                        #
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
                        Item Name
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
                        Qty
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
                        Unit
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
                        Unit Price
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                      >
                        Total
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(selectedPO.items) &&
                    selectedPO.items.length > 0 ? (
                      selectedPO.items.map((itm, i) => {
                        const qty = parseFloat(itm.quantity || itm.qty) || 0;
                        const price =
                          parseFloat(itm.unit_price || itm.rate || itm.price) ||
                          0;
                        const total = qty * price;

                        return (
                          <TableRow key={i}>
                            <TableCell sx={{ fontSize: "0.75rem", color: COLORS.textMuted }}>
                              {i + 1}
                            </TableCell>
                            <TableCell
                              sx={{
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                color: COLORS.textPrimary,
                              }}
                            >
                              {itm.item_name || itm.name || "Item"}
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.8rem" }}>
                              {qty}
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.8rem" }}>
                              {itm.unit || "Nos"}
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.8rem" }}>
                              {formatCurrency(price)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.82rem",
                                color: COLORS.primaryDark,
                              }}
                            >
                              {formatCurrency(total)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 2 }}>
                          <Typography
                            sx={{
                              fontSize: "0.8rem",
                              color: COLORS.textMuted,
                            }}
                          >
                            No specific item lines found.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Total Banner */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: 2,
                  mb: 3,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: COLORS.textSecondary,
                  }}
                >
                  Total PO Value:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "1.3rem",
                    fontWeight: 900,
                    color: COLORS.primaryDark,
                  }}
                >
                  {formatCurrency(selectedPO.total_amount)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2, borderColor: COLORS.border }} />

              {/* Status Update Control Section */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: "10px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: "#F8FAFC",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    color: COLORS.primaryDark,
                    mb: 1.5,
                  }}
                >
                  Update Purchase Order Status
                </Typography>

                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <Select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        sx={{
                          height: 38,
                          borderRadius: "6px",
                          fontSize: "0.82rem",
                          backgroundColor: "#FFFFFF",
                        }}
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <MenuItem key={st} value={st}>
                            {st}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {newStatus === "Delivered" && (
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="Actual Delivery Date"
                        value={actualDeliveryDate}
                        onChange={(e) => setActualDeliveryDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            height: 38,
                            borderRadius: "6px",
                            fontSize: "0.82rem",
                            backgroundColor: "#FFFFFF",
                          },
                        }}
                      />
                    </Grid>
                  )}

                  <Grid item xs={12} sm={newStatus === "Delivered" ? 4 : 8}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleStatusUpdate}
                      disabled={
                        statusUpdateLoading || newStatus === selectedPO.status
                      }
                      sx={{
                        height: 38,
                        borderRadius: "6px",
                        fontWeight: 700,
                        textTransform: "none",
                        backgroundColor: COLORS.primary,
                        color: "#FFFFFF",
                        "&:hover": { backgroundColor: "#020617" },
                      }}
                    >
                      {statusUpdateLoading ? "Updating..." : "Update Status"}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button
                onClick={() => setDetailModalOpen(false)}
                sx={{
                  color: COLORS.textPrimary,
                  fontWeight: 600,
                  textTransform: "none",
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
