import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, Card, CardContent, Grid, TextField,
  MenuItem, InputAdornment, Chip, Avatar, IconButton, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Tooltip, Badge, ToggleButtonGroup, ToggleButton, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress,
  Skeleton, Stack, Grow, Checkbox
} from "@mui/material";

// Icons
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewListIcon from "@mui/icons-material/ViewList";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import ElectricMeterIcon from "@mui/icons-material/ElectricMeter";
import ArchitectureIcon from "@mui/icons-material/Architecture";
import CableIcon from "@mui/icons-material/Cable";
import PowerIcon from "@mui/icons-material/Power";
import BoltIcon from "@mui/icons-material/Bolt";
import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import BuildIcon from "@mui/icons-material/Build";
import InsightsIcon from "@mui/icons-material/Insights";
import CloseIcon from "@mui/icons-material/Close";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";

import toast from "react-hot-toast";

import {
  getCategories,
  getStockItems,
  deleteStockItem,
  bulkDeleteStockItems,
  getStockReport
} from "../../services/stockService";

import BulkDeleteBar from "../../components/BulkDeleteBar";

import StockItemModal from "./components/StockItemModal";
import StockInModal from "./components/StockInModal";
import StockOutModal from "./components/StockOutModal";
import ImportStockModal from "./components/ImportStockModal";
import BarcodeScannerModal from "./components/BarcodeScannerModal";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000";

/* ============================================================
   DESIGN TOKENS (Matching Leads.jsx)
   ============================================================ */
const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  primarySoft: "#F1F5F9",
  secondary: "#F59E0B",
  secondaryDark: "#D97706",
  secondarySoft: "#FEF3C7",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  info: "#0284C7",
  infoSoft: "#E0F2FE",
};

const controlSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#FAFBFC",
    fontSize: "0.8125rem",
    color: COLORS.textPrimary,
    minHeight: 38,
    "& fieldset": { borderColor: COLORS.border, borderWidth: "1px" },
    "&:hover fieldset": { borderColor: COLORS.borderStrong },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary, borderWidth: "1.5px" },
  },
  "& .MuiInputBase-input": {
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.8125rem",
    py: 0.8,
  },
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    fontSize: "0.8125rem",
    fontFamily: "'Inter', sans-serif",
    py: 0.8,
  },
  "& .MuiInputLabel-root": {
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.8125rem",
    color: COLORS.textSecondary,
    "&.Mui-focused": { color: COLORS.primary },
  },
};

// Helper for category icon mapping
const getCategoryIcon = (slug) => {
  switch (slug) {
    case "solar-panels": return <SolarPowerIcon fontSize="small" />;
    case "inverters": return <ElectricMeterIcon fontSize="small" />;
    case "mounting-structure": return <ArchitectureIcon fontSize="small" />;
    case "dc-cables": return <CableIcon fontSize="small" />;
    case "ac-cables": return <PowerIcon fontSize="small" />;
    case "earthing": return <BoltIcon fontSize="small" />;
    case "battery": return <BatteryChargingFullIcon fontSize="small" />;
    case "tools": return <BuildIcon fontSize="small" />;
    default: return <InsightsIcon fontSize="small" />;
  }
};

/* ============================================================
   KPI SUMMARY CARD COMPONENT
   ============================================================ */
const KpiCard = ({ icon, label, value, subtext, accent, onClick, index = 0 }) => (
  <Grow in timeout={280 + index * 100} style={{ width: "100%", height: "100%", display: "flex" }}>
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRadius: "12px",
        border: `1px solid ${COLORS.border}`,
        backgroundColor: COLORS.card,
        boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        "&:hover": onClick ? { boxShadow: "0 4px 12px rgba(15,23,42,0.08)", transform: "translateY(-1px)" } : {},
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 }, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: COLORS.textSecondary,
              fontWeight: 600,
              fontSize: "0.6875rem",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {label}
          </Typography>
          <Avatar sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: `${accent}15`, color: accent, flexShrink: 0 }}>
            {icon}
          </Avatar>
        </Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: COLORS.textPrimary,
            fontSize: "1.35rem",
            lineHeight: 1.2,
            fontFamily: "'Inter', sans-serif",
            mb: 0.4,
          }}
        >
          {value}
        </Typography>
        <Typography variant="caption" sx={{ color: COLORS.textMuted, fontSize: "0.72rem", fontFamily: "'Inter', sans-serif", mt: "auto" }}>
          {subtext}
        </Typography>
      </CardContent>
    </Card>
  </Grow>
);

const StockList = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reportData, setReportData] = useState(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("updated_at");
  const [viewMode, setViewMode] = useState("grid");

  // Modal states
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [stockInModalOpen, setStockInModalOpen] = useState(false);
  const [stockOutModalOpen, setStockOutModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [activeItem, setActiveItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk Delete State
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(items.map((i) => i.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const res = await bulkDeleteStockItems(selectedIds);
      if (res?.success) {
        toast.success(res.message || `${selectedIds.length} stock items deleted successfully`);
        setSelectedIds([]);
        fetchData();
      } else {
        toast.error(res?.message || "Failed to delete selected items");
      }
    } catch (err) {
      console.error("Bulk delete stock items error:", err);
      toast.error(err.response?.data?.message || "Failed to delete selected items");
    } finally {
      setBulkDeleting(false);
    }
  };

  // Fetch Categories & Report & Items
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, itemsRes, reportRes] = await Promise.all([
        getCategories(),
        getStockItems({
          category_id: selectedCategory,
          status: selectedStatus === "all" ? "" : selectedStatus,
          search,
          sort_by: sortBy,
        }),
        getStockReport(),
      ]);

      setCategories(catRes.data || []);
      setItems(itemsRes.data || []);
      setReportData(reportRes.data || null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load inventory stock items.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus, search, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const promptDelete = (item) => {
    setActiveItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!activeItem) return;
    setDeleting(true);
    try {
      await deleteStockItem(activeItem.id);
      toast.success(`${activeItem.name} deleted successfully!`);
      setSelectedIds((prev) => prev.filter((id) => id !== activeItem.id));
      setDeleteDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete stock item.");
    } finally {
      setDeleting(false);
    }
  };

  const getStockStatusChip = (item) => {
    const cur = item.current_stock;
    const min = item.min_stock_level;
    const reorder = item.reorder_level;

    if (cur <= 0) {
      return (
        <Chip
          label="Out of Stock"
          size="small"
          sx={{ bgcolor: COLORS.dangerSoft, color: COLORS.danger, fontWeight: 700, fontSize: "0.6875rem", height: 22, borderRadius: "6px" }}
        />
      );
    } else if (cur <= min) {
      return (
        <Chip
          label={`Low Stock (${cur} ${item.unit})`}
          size="small"
          sx={{ bgcolor: COLORS.warningSoft, color: COLORS.warning, fontWeight: 700, fontSize: "0.6875rem", height: 22, borderRadius: "6px" }}
        />
      );
    } else if (cur <= reorder) {
      return (
        <Chip
          label={`Reorder (${cur} ${item.unit})`}
          size="small"
          sx={{ bgcolor: COLORS.infoSoft, color: COLORS.info, fontWeight: 600, fontSize: "0.6875rem", height: 22, borderRadius: "6px" }}
        />
      );
    } else {
      return (
        <Chip
          label={`In Stock (${cur} ${item.unit})`}
          size="small"
          sx={{ bgcolor: COLORS.successSoft, color: COLORS.success, fontWeight: 600, fontSize: "0.6875rem", height: 22, borderRadius: "6px" }}
        />
      );
    }
  };

  // Metrics summary
  const summary = reportData?.summary || {};
  const totalValuation = summary.total_valuation || items.reduce((acc, i) => acc + (i.current_stock * i.unit_price), 0);
  const lowStockCount = summary.low_stock_count || items.filter(i => i.current_stock > 0 && i.current_stock <= i.min_stock_level).length;
  const outOfStockCount = summary.out_of_stock_count || items.filter(i => i.current_stock <= 0).length;

  return (
    <Box sx={{ pb: 6, px: { xs: 2, sm: 3 }, backgroundColor: COLORS.bg, minHeight: "100vh" }}>
      {/* ── Page Header ────────────────────────────────────────── */}
      <Box sx={{ mb: 3, pt: 3 }}>
        {/* Title Row */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: COLORS.primary, fontSize: { xs: "1.25rem", sm: "1.4rem" } }}>
            Stock Management
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.8125rem", mt: 0.3 }}>
            Track solar panels, inverters, mounting structures, cables, BOS & warehouse inventory valuations.
          </Typography>
        </Box>

        {/* Action Buttons Row */}
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          sx={{ alignItems: "center" }}
        >
          <Button
            size="small"
            variant="outlined"
            startIcon={<AssessmentIcon fontSize="small" />}
            onClick={() => setReportModalOpen(true)}
            sx={{
              height: 36,
              borderRadius: "8px",
              borderColor: COLORS.border,
              color: COLORS.textPrimary,
              backgroundColor: "#FFFFFF",
              textTransform: "none",
              fontSize: "0.8125rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
              "&:hover": { borderColor: COLORS.borderStrong, backgroundColor: "#F8FAFC" }
            }}
          >
            Valuation Report
          </Button>

          <Button
            size="small"
            variant="outlined"
            startIcon={<ReceiptLongIcon fontSize="small" />}
            onClick={() => navigate("/stock/transactions")}
            sx={{
              height: 36,
              borderRadius: "8px",
              borderColor: COLORS.border,
              color: COLORS.textPrimary,
              backgroundColor: "#FFFFFF",
              textTransform: "none",
              fontSize: "0.8125rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
              "&:hover": { borderColor: COLORS.borderStrong, backgroundColor: "#F8FAFC" }
            }}
          >
            Transactions Log
          </Button>

          <Button
            size="small"
            variant="outlined"
            startIcon={<TrendingUpIcon fontSize="small" />}
            onClick={() => { setActiveItem(null); setStockInModalOpen(true); }}
            sx={{
              height: 36,
              borderRadius: "8px",
              borderColor: COLORS.success,
              color: COLORS.success,
              backgroundColor: COLORS.successSoft,
              textTransform: "none",
              fontSize: "0.8125rem",
              fontWeight: 700,
              whiteSpace: "nowrap",
              "&:hover": { backgroundColor: "#C6F6D5" }
            }}
          >
            Stock IN
          </Button>

          <Button
            size="small"
            variant="outlined"
            startIcon={<TrendingDownIcon fontSize="small" />}
            onClick={() => { setActiveItem(null); setStockOutModalOpen(true); }}
            sx={{
              height: 36,
              borderRadius: "8px",
              borderColor: COLORS.danger,
              color: COLORS.danger,
              backgroundColor: COLORS.dangerSoft,
              textTransform: "none",
              fontSize: "0.8125rem",
              fontWeight: 700,
              whiteSpace: "nowrap",
              "&:hover": { backgroundColor: "#FCD3D3" }
            }}
          >
            Stock OUT
          </Button>

          <Button
            size="small"
            variant="outlined"
            startIcon={<FileUploadIcon fontSize="small" />}
            onClick={() => setImportModalOpen(true)}
            sx={{
              height: 36,
              borderRadius: "8px",
              borderColor: COLORS.secondaryDark,
              color: COLORS.secondaryDark,
              backgroundColor: COLORS.secondarySoft,
              textTransform: "none",
              fontSize: "0.8125rem",
              fontWeight: 700,
              whiteSpace: "nowrap",
              "&:hover": { backgroundColor: "#FDE68A" }
            }}
          >
            Import CSV
          </Button>

          {/* Barcode / QR Scanner Button */}
          <Button
            size="small"
            variant="outlined"
            startIcon={<QrCodeScannerIcon fontSize="small" />}
            onClick={() => setScannerModalOpen(true)}
            sx={{
              height: 36,
              borderRadius: "8px",
              borderColor: COLORS.border,
              color: COLORS.textPrimary,
              backgroundColor: "#FFFFFF",
              textTransform: "none",
              fontSize: "0.8125rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
              "&:hover": {
                backgroundColor: COLORS.bg,
                borderColor: COLORS.borderStrong,
              },
            }}
          >
            Scan Barcode / QR
          </Button>

          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => { setActiveItem(null); setItemModalOpen(true); }}
            sx={{
              height: 36,
              borderRadius: "8px",
              backgroundColor: COLORS.primary,
              color: "#FFFFFF",
              textTransform: "none",
              fontSize: "0.8125rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
              boxShadow: "0 1px 3px rgba(15,23,42,0.12)",
              "&:hover": { backgroundColor: COLORS.primaryDark }
            }}
          >
            Add New Item
          </Button>
        </Stack>
      </Box>

      {/* ── KPI Summary Cards Bar ──────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={6} md={3} sx={{ display: "flex" }}>
          <KpiCard
            index={0}
            icon={<Inventory2Icon fontSize="small" />}
            label="Total SKUs"
            value={summary.total_items || items.length}
            subtext="Active stock items catalog"
            accent={COLORS.info}
          />
        </Grid>

        <Grid item xs={6} sm={6} md={3} sx={{ display: "flex" }}>
          <KpiCard
            index={1}
            icon={<Typography sx={{ fontWeight: 800, fontSize: "1.1rem" }}>₹</Typography>}
            label="Total Valuation"
            value={`₹${Number(totalValuation).toLocaleString("en-IN")}`}
            subtext="Total warehouse stock value"
            accent={COLORS.success}
          />
        </Grid>

        <Grid item xs={6} sm={6} md={3} sx={{ display: "flex" }}>
          <KpiCard
            index={2}
            icon={<WarningAmberIcon fontSize="small" />}
            label="Low Stock Alerts"
            value={lowStockCount}
            subtext="Items below min threshold level"
            accent={COLORS.warning}
            onClick={() => navigate("/stock/alerts")}
          />
        </Grid>

        <Grid item xs={6} sm={6} md={3} sx={{ display: "flex" }}>
          <KpiCard
            index={3}
            icon={<WarningAmberIcon fontSize="small" />}
            label="Out of Stock"
            value={outOfStockCount}
            subtext="Critical shortages (0 Qty)"
            accent={COLORS.danger}
            onClick={() => navigate("/stock/alerts")}
          />
        </Grid>
      </Grid>

      {/* ── Filter Toolbar ────────────────────────────────────── */}
      <Paper elevation={0} sx={{ p: 1.5, mb: 3, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card, width: "100%" }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, width: "100%" }}>
          {/* Auto-expanding Search input */}
          <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 280px" }, minWidth: 220 }}>
            <TextField
              placeholder="Search by item name, brand, model, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              size="small"
              sx={controlSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: COLORS.textMuted, fontSize: 18 }} />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch("")} sx={{ p: 0.5 }}>
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
            />
          </Box>

          {/* Category Dropdown */}
          <Box sx={{ flex: { xs: "1 1 48%", sm: "0 0 170px" } }}>
            <TextField
              select
              label="Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              fullWidth
              size="small"
              sx={controlSx}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Stock Status Dropdown */}
          <Box sx={{ flex: { xs: "1 1 48%", sm: "0 0 160px" } }}>
            <TextField
              select
              label="Stock Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              fullWidth
              size="small"
              sx={controlSx}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="healthy">In Stock (Healthy)</MenuItem>
              <MenuItem value="low_stock">Low Stock</MenuItem>
              <MenuItem value="out_of_stock">Out of Stock</MenuItem>
              <MenuItem value="reorder">Reorder Level</MenuItem>
            </TextField>
          </Box>

          {/* Sort By Dropdown */}
          <Box sx={{ flex: { xs: "1 1 48%", sm: "0 0 170px" } }}>
            <TextField
              select
              label="Sort By"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              fullWidth
              size="small"
              sx={controlSx}
            >
              <MenuItem value="updated_at">Recently Updated</MenuItem>
              <MenuItem value="name">Item Name (A-Z)</MenuItem>
              <MenuItem value="current_stock">Stock Quantity</MenuItem>
              <MenuItem value="unit_price">Unit Price</MenuItem>
            </TextField>
          </Box>

          {/* View Toggle Buttons */}
          <Box sx={{ ml: { sm: "auto" } }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, next) => next && setViewMode(next)}
              size="small"
              sx={{ height: 38 }}
            >
              <ToggleButton value="grid" sx={{ px: 1.2 }}>
                <ViewModuleIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="table" sx={{ px: 1.2 }}>
                <ViewListIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Paper>

      {/* Loading Progress */}
      {loading && <LinearProgress color="warning" sx={{ mb: 2, borderRadius: "4px" }} />}

      {/* Bulk Delete Bar */}
      <BulkDeleteBar
        selectedCount={selectedIds.length}
        totalCount={items.length}
        itemLabel="Stock Items"
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        isAllSelected={selectedIds.length === items.length && items.length > 0}
        onConfirmDelete={handleBulkDelete}
        loading={bulkDeleting}
      />

      {/* ── Items Grid View ───────────────────────────────────── */}
      {viewMode === "grid" ? (
        <Grid container spacing={2}>
          {items.map((item) => {
            const catIcon = getCategoryIcon(item.category_slug);
            const avatarSrc = item.image_url
              ? item.image_url.startsWith("http")
                ? item.image_url
                : `${API_BASE_URL}${item.image_url.startsWith("/") ? "" : "/"}${item.image_url}`
              : null;
            const isSelected = selectedIds.includes(item.id);

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: "12px",
                    border: `1px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                    backgroundColor: isSelected ? "rgba(15, 23, 42, 0.02)" : COLORS.card,
                    boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
                      borderColor: COLORS.borderStrong,
                    },
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  <Box sx={{ p: 1.8, display: "flex", alignItems: "center", gap: 1.2, borderBottom: `1px solid ${COLORS.border}` }}>
                    <Checkbox
                      size="small"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(item.id)}
                      sx={{
                        p: 0.5,
                        color: COLORS.borderStrong,
                        "&.Mui-checked": { color: COLORS.primary },
                      }}
                    />
                    <Avatar
                      src={avatarSrc || undefined}
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "10px",
                        bgcolor: COLORS.primarySoft,
                        color: COLORS.primary,
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        flexShrink: 0,
                      }}
                    >
                      {!avatarSrc && (catIcon || item.name.charAt(0).toUpperCase())}
                    </Avatar>

                    <Box sx={{ overflow: "hidden", flex: 1 }}>
                      <Typography variant="caption" sx={{ color: COLORS.secondaryDark, fontWeight: 700, fontSize: "0.68rem", display: "block" }}>
                        {item.category_name}
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 700,
                          color: COLORS.textPrimary,
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          lineHeight: 1.25,
                        }}
                        onClick={() => navigate(`/stock/${item.id}`)}
                      >
                        {item.name}
                      </Typography>
                      <Typography variant="caption" noWrap sx={{ color: COLORS.textSecondary, fontSize: "0.72rem", display: "block" }}>
                        {item.brand ? `${item.brand} ${item.model ? "• " + item.model : ""}` : item.item_code}
                      </Typography>
                    </Box>
                  </Box>

                  <CardContent sx={{ flex: 1, py: 1.5, px: 1.8 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                      <Chip label={item.item_code} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: "0.7rem", height: 20 }} />
                      {getStockStatusChip(item)}
                    </Box>

                    <Grid container spacing={1} sx={{ bgcolor: COLORS.bg, p: 1.2, borderRadius: "8px", border: `1px solid ${COLORS.border}` }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" display="block" sx={{ color: COLORS.textSecondary, fontSize: "0.68rem" }}>
                          Unit Price
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "0.8125rem" }}>
                          ₹{Number(item.unit_price).toLocaleString("en-IN")} / {item.unit}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" display="block" sx={{ color: COLORS.textSecondary, fontSize: "0.68rem" }}>
                          Valuation
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.success, fontSize: "0.8125rem" }}>
                          ₹{Number(item.current_stock * item.unit_price).toLocaleString("en-IN")}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>

                  {/* Grid Card Footer Actions */}
                  <Box sx={{ p: 1.2, px: 1.8, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#FAFBFC", borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px" }}>
                    <Stack direction="row" spacing={0.8}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => { setActiveItem(item); setStockInModalOpen(true); }}
                        sx={{
                          height: 26,
                          px: 1,
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          borderRadius: "6px",
                          borderColor: COLORS.success,
                          color: COLORS.success,
                          backgroundColor: COLORS.successSoft,
                          textTransform: "none",
                          "&:hover": { backgroundColor: "#C6F6D5" }
                        }}
                      >
                        + IN
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => { setActiveItem(item); setStockOutModalOpen(true); }}
                        sx={{
                          height: 26,
                          px: 1,
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          borderRadius: "6px",
                          borderColor: COLORS.danger,
                          color: COLORS.danger,
                          backgroundColor: COLORS.dangerSoft,
                          textTransform: "none",
                          "&:hover": { backgroundColor: "#FCD3D3" }
                        }}
                      >
                        - OUT
                      </Button>
                    </Stack>

                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Tooltip title="View Details & Logs" arrow>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/stock/${item.id}`)}
                          sx={{
                            width: 26, height: 26, borderRadius: "6px",
                            color: COLORS.info, backgroundColor: COLORS.infoSoft,
                            "&:hover": { backgroundColor: "#BAE6FD" }
                          }}
                        >
                          <VisibilityIcon sx={{ fontSize: "0.85rem" }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Stock Item" arrow>
                        <IconButton
                          size="small"
                          onClick={() => { setActiveItem(item); setItemModalOpen(true); }}
                          sx={{
                            width: 26, height: 26, borderRadius: "6px",
                            color: COLORS.textPrimary, backgroundColor: "#F1F5F9",
                            "&:hover": { backgroundColor: "#E2E8F0" }
                          }}
                        >
                          <EditIcon sx={{ fontSize: "0.85rem" }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Item" arrow>
                        <IconButton
                          size="small"
                          onClick={() => promptDelete(item)}
                          sx={{
                            width: 26, height: 26, borderRadius: "6px",
                            color: COLORS.danger, backgroundColor: COLORS.dangerSoft,
                            "&:hover": { backgroundColor: "#FCD3D3" }
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: "0.85rem" }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        /* ── Items Table View ─────────────────────────────────── */
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "12px", border: `1px solid ${COLORS.border}`, width: "100%", overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 950 }}>
            <TableHead sx={{ bgcolor: COLORS.primary }}>
              <TableRow>
                <TableCell sx={{ color: "#FFFFFF", width: 44, p: 0.5, pl: 1.5 }}>
                  <Checkbox
                    size="small"
                    indeterminate={selectedIds.length > 0 && selectedIds.length < items.length}
                    checked={items.length > 0 && selectedIds.length === items.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(items.map((it) => it.id));
                      else setSelectedIds([]);
                    }}
                    sx={{
                      color: "rgba(255,255,255,0.7)",
                      "&.Mui-checked, &.MuiCheckbox-indeterminate": { color: "#FFFFFF" },
                    }}
                  />
                </TableCell>
                <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.8125rem", minWidth: 240, py: 1.2 }}>Item / Code</TableCell>
                <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.8125rem", minWidth: 130, py: 1.2, whiteSpace: "nowrap" }}>Category</TableCell>
                <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.8125rem", minWidth: 140, py: 1.2, whiteSpace: "nowrap" }}>Brand / Model</TableCell>
                <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.8125rem", minWidth: 100, py: 1.2, whiteSpace: "nowrap" }}>Unit Price</TableCell>
                <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.8125rem", minWidth: 110, py: 1.2, whiteSpace: "nowrap" }}>Current Stock</TableCell>
                <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.8125rem", minWidth: 110, py: 1.2, whiteSpace: "nowrap" }}>Total Value</TableCell>
                <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.8125rem", minWidth: 140, py: 1.2, whiteSpace: "nowrap" }}>Status</TableCell>
                <TableCell align="right" sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.8125rem", minWidth: 150, py: 1.2, whiteSpace: "nowrap" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <TableRow
                    key={item.id}
                    hover
                    selected={isSelected}
                    sx={{
                      "&:hover": { bgcolor: COLORS.primarySoft },
                      bgcolor: isSelected ? "rgba(15, 23, 42, 0.04)" : "inherit",
                    }}
                  >
                    <TableCell sx={{ width: 44, p: 0.5, pl: 1.5 }}>
                      <Checkbox
                        size="small"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(item.id)}
                        sx={{
                          color: COLORS.borderStrong,
                          "&.Mui-checked": { color: COLORS.primary },
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 240, maxWidth: 300 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar
                        src={item.image_url ? `${API_BASE_URL}${item.image_url.startsWith("/") ? "" : "/"}${item.image_url}` : undefined}
                        sx={{ width: 36, height: 36, borderRadius: "8px", bgcolor: COLORS.primarySoft, color: COLORS.primary, fontSize: "0.8rem", fontWeight: 700, flexShrink: 0 }}
                      >
                        {item.name.charAt(0)}
                      </Avatar>
                      <Box sx={{ overflow: "hidden" }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 700,
                            color: COLORS.textPrimary,
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            lineHeight: 1.3,
                          }}
                          onClick={() => navigate(`/stock/${item.id}`)}
                        >
                          {item.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: "0.72rem", display: "block", mt: 0.2 }}>
                          SKU: {item.item_code} {item.barcode ? `• Barcode: ${item.barcode}` : ""}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell sx={{ minWidth: 130, whiteSpace: "nowrap" }}>
                    <Chip label={item.category_name} size="small" variant="outlined" sx={{ fontSize: "0.72rem", height: 22, fontWeight: 600 }} />
                  </TableCell>

                  <TableCell sx={{ fontSize: "0.8125rem", minWidth: 140, whiteSpace: "nowrap" }}>
                    {item.brand || "—"} {item.model ? `(${item.model})` : ""}
                  </TableCell>

                  <TableCell sx={{ fontSize: "0.8125rem", minWidth: 100, whiteSpace: "nowrap" }}>
                    ₹{Number(item.unit_price).toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell sx={{ fontSize: "0.8125rem", minWidth: 110, whiteSpace: "nowrap" }}>
                    <strong>{item.current_stock}</strong> {item.unit}
                  </TableCell>

                  <TableCell sx={{ fontWeight: 700, color: COLORS.success, fontSize: "0.8125rem", minWidth: 110, whiteSpace: "nowrap" }}>
                    ₹{Number(item.current_stock * item.unit_price).toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell sx={{ minWidth: 140, whiteSpace: "nowrap" }}>
                    {getStockStatusChip(item)}
                  </TableCell>

                  <TableCell align="right" sx={{ minWidth: 150, whiteSpace: "nowrap" }}>
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center" flexWrap="nowrap">
                      <Tooltip title="Stock IN (Purchase)" arrow>
                        <IconButton
                          size="small"
                          onClick={() => { setActiveItem(item); setStockInModalOpen(true); }}
                          sx={{
                            width: 28, height: 28, borderRadius: "6px",
                            color: COLORS.success, backgroundColor: COLORS.successSoft,
                            "&:hover": { backgroundColor: "#C6F6D5" }
                          }}
                        >
                          <TrendingUpIcon sx={{ fontSize: "0.85rem" }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Stock OUT (Dispatch)" arrow>
                        <IconButton
                          size="small"
                          onClick={() => { setActiveItem(item); setStockOutModalOpen(true); }}
                          sx={{
                            width: 28, height: 28, borderRadius: "6px",
                            color: COLORS.danger, backgroundColor: COLORS.dangerSoft,
                            "&:hover": { backgroundColor: "#FCD3D3" }
                          }}
                        >
                          <TrendingDownIcon sx={{ fontSize: "0.85rem" }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="View Details" arrow>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/stock/${item.id}`)}
                          sx={{
                            width: 28, height: 28, borderRadius: "6px",
                            color: COLORS.info, backgroundColor: COLORS.infoSoft,
                            "&:hover": { backgroundColor: "#BAE6FD" }
                          }}
                        >
                          <VisibilityIcon sx={{ fontSize: "0.85rem" }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Edit Item" arrow>
                        <IconButton
                          size="small"
                          onClick={() => { setActiveItem(item); setItemModalOpen(true); }}
                          sx={{
                            width: 28, height: 28, borderRadius: "6px",
                            color: COLORS.textPrimary, backgroundColor: "#F1F5F9",
                            "&:hover": { backgroundColor: "#E2E8F0" }
                          }}
                        >
                          <EditIcon sx={{ fontSize: "0.85rem" }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete Item" arrow>
                        <IconButton
                          size="small"
                          onClick={() => promptDelete(item)}
                          sx={{
                            width: 28, height: 28, borderRadius: "6px",
                            color: COLORS.danger, backgroundColor: COLORS.dangerSoft,
                            "&:hover": { backgroundColor: "#FCD3D3" }
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: "0.85rem" }} />
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


      {/* Stock Item Add/Edit Modal */}
      {itemModalOpen && (
        <StockItemModal
          open={itemModalOpen}
          onClose={() => setItemModalOpen(false)}
          onSuccess={fetchData}
          categories={categories}
          editItem={activeItem}
        />
      )}


      {/* Stock IN Modal */}
      {stockInModalOpen && (
        <StockInModal
          open={stockInModalOpen}
          onClose={() => setStockInModalOpen(false)}
          onSuccess={fetchData}
          items={items}
          preSelectedItem={activeItem}
        />
      )}

      {/* Stock OUT Modal */}
      {stockOutModalOpen && (
        <StockOutModal
          open={stockOutModalOpen}
          onClose={() => setStockOutModalOpen(false)}
          onSuccess={fetchData}
          items={items}
          preSelectedItem={activeItem}
        />
      )}

      {/* Valuation Report Dialog */}
      <Dialog open={reportModalOpen} onClose={() => setReportModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "14px" } }}>
        <DialogTitle component="div" sx={{ backgroundColor: COLORS.primary, color: "#FFFFFF", fontWeight: 700, py: 2 }}>
          <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
            Stock Inventory & Valuation Report
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>Total Valuation (Excl GST)</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.success, fontFamily: "'Inter', sans-serif" }}>
                ₹{Number(totalValuation).toLocaleString("en-IN")}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>Total Valuation (Incl GST)</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.info, fontFamily: "'Inter', sans-serif" }}>
                ₹{Number(summary.total_valuation_with_gst || totalValuation * 1.18).toLocaleString("en-IN")}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>Total Stock Quantity</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
                {summary.total_quantity || 0} Units
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>Catalog SKUs</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
                {summary.total_items || items.length} SKUs
              </Typography>
            </Grid>
          </Grid>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: COLORS.textPrimary }}>
            Category-wise Stock Valuation
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "8px" }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: COLORS.bg }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>SKUs</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total Quantity</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Category Valuation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(reportData?.categories || []).map((cat) => (
                  <TableRow key={cat.category_id}>
                    <TableCell sx={{ fontWeight: 600 }}>{cat.category_name}</TableCell>
                    <TableCell>{cat.item_count} items</TableCell>
                    <TableCell>{cat.category_quantity} Units</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: COLORS.success }}>
                      ₹{Number(cat.category_valuation).toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReportModalOpen(false)} sx={{ fontWeight: 600, color: COLORS.textSecondary }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Custom MUI Confirm Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", border: `1px solid ${COLORS.border}`, overflow: "hidden" } }}
      >
        <DialogTitle
          component="div"
          sx={{
            py: 2,
            px: 3,
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: COLORS.dangerSoft, color: COLORS.danger, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DeleteIcon sx={{ fontSize: 18 }} />
            </Box>
            <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 700, color: COLORS.textPrimary, fontFamily: "'Outfit', sans-serif" }}>
              Confirm Delete
            </Typography>
          </Box>
          <IconButton onClick={() => setDeleteDialogOpen(false)} size="small" sx={{ width: 28, height: 28, borderRadius: "6px", color: COLORS.textSecondary, bgcolor: "#F1F5F9" }}>
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, backgroundColor: "#FAFBFC" }}>
          <Typography variant="body2" sx={{ color: COLORS.textPrimary, fontSize: "0.875rem", lineHeight: 1.6 }}>
            Are you sure you want to delete <strong>{activeItem?.name}</strong> ({activeItem?.item_code})?
          </Typography>
          <Typography variant="caption" sx={{ color: COLORS.danger, display: "block", mt: 1, fontWeight: 500 }}>
            This action cannot be undone and will delete all associated inventory logs.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3, borderTop: `1px solid ${COLORS.border}`, backgroundColor: "#FFFFFF" }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: COLORS.textSecondary, fontWeight: 600, fontSize: "0.8125rem", textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            disabled={deleting}
            sx={{
              backgroundColor: COLORS.danger,
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "0.8125rem",
              px: 3,
              height: 36,
              borderRadius: "8px",
              textTransform: "none",
              boxShadow: "none",
              "&:hover": { backgroundColor: "#B91C1C", boxShadow: "none" }
            }}
          >
            {deleting ? <CircularProgress size={20} color="inherit" /> : "Delete Item"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import CSV Modal */}
      <ImportStockModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={fetchData}
        categories={categories}
      />

      {/* Barcode Scanner Modal */}
      {scannerModalOpen && (
        <BarcodeScannerModal
          open={scannerModalOpen}
          onClose={() => setScannerModalOpen(false)}
          onSuccess={fetchData}
          items={items}
          onStockIn={(item) => {
            setActiveItem(item);
            setStockInModalOpen(true);
          }}
          onStockOut={(item) => {
            setActiveItem(item);
            setStockOutModalOpen(true);
          }}
          onAddNewWithBarcode={(scannedBarcode) => {
            setActiveItem({ barcode: scannedBarcode, item_code: scannedBarcode });
            setItemModalOpen(true);
          }}
        />
      )}
    </Box>
  );
};


export default StockList;
