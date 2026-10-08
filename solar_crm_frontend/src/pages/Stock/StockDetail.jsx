import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, Paper, Grid, Avatar, Chip,
  Divider, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, LinearProgress, Alert, Tooltip,
  Breadcrumbs, Link, Dialog, DialogTitle, DialogContent,
  DialogActions, Stack, CircularProgress, IconButton
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CloseIcon from "@mui/icons-material/Close";

import toast from "react-hot-toast";

import {
  getStockItemById,
  deleteStockItem,
  getCategories
} from "../../services/stockService";

import StockItemModal from "./components/StockItemModal";
import StockInModal from "./components/StockInModal";
import StockOutModal from "./components/StockOutModal";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000";

const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  primarySoft: "#F1F5F9",
  secondary: "#F59E0B",
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  info: "#0284C7",
  infoSoft: "#E0F2FE",
};

const StockDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [item, setItem] = useState(null);
  const [categories, setCategories] = useState([]);

  // Modal states
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [stockInModalOpen, setStockInModalOpen] = useState(false);
  const [stockOutModalOpen, setStockOutModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchItemDetail = useCallback(async () => {
    setLoading(true);
    try {
      const [itemRes, catRes] = await Promise.all([
        getStockItemById(id),
        getCategories(),
      ]);
      setItem(itemRes.data || null);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load stock item details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItemDetail();
  }, [fetchItemDetail]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteStockItem(item.id);
      toast.success(`${item.name} deleted successfully!`);
      setDeleteDialogOpen(false);
      navigate("/stock");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete stock item.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <LinearProgress color="warning" sx={{ mb: 2, borderRadius: 4 }} />
        <Typography color="textSecondary" sx={{ fontSize: "0.875rem" }}>
          Loading item specifications & transaction history...
        </Typography>
      </Box>
    );
  }

  if (!item) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="error" sx={{ fontWeight: 700, mb: 1 }}>
          Stock Item Not Found
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/stock")}
          sx={{ borderRadius: "8px", textTransform: "none" }}
        >
          Back to Inventory
        </Button>
      </Box>
    );
  }

  const curStock = item.current_stock || 0;
  const reservedStock = item.reserved_stock || 0;
  const availStock = item.available_stock !== undefined ? item.available_stock : (curStock - reservedStock);
  const minLevel = item.min_stock_level || 5;
  const reorderLevel = item.reorder_level || 10;
  const unitPrice = Number(item.unit_price || 0);
  const totalValuation = curStock * unitPrice;

  // Image source
  const avatarSrc = item.image_url
    ? item.image_url.startsWith("http")
      ? item.image_url
      : `${API_BASE_URL}${item.image_url.startsWith("/") ? "" : "/"}${item.image_url}`
    : null;

  const specs = item.specifications || {};

  return (
    <Box sx={{ pb: 6, backgroundColor: "#F8FAFC", minHeight: "100vh" }}>
      {/* ── Breadcrumbs & Navigation ────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 1.5, fontSize: "0.8125rem" }}>
          <Link
            underline="hover"
            color="inherit"
            onClick={() => navigate("/stock")}
            sx={{ cursor: "pointer", color: COLORS.textSecondary, "&:hover": { color: COLORS.primary } }}
          >
            Stock Inventory
          </Link>
          <Typography color="text.primary" sx={{ fontWeight: 600, color: COLORS.primary }}>
            {item.name}
          </Typography>
        </Breadcrumbs>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon fontSize="small" />}
            onClick={() => navigate("/stock")}
            sx={{
              height: 36,
              borderRadius: "8px",
              borderColor: COLORS.border,
              color: COLORS.textPrimary,
              backgroundColor: "#FFFFFF",
              textTransform: "none",
              fontSize: "0.8125rem",
              fontWeight: 600,
              border: `1px solid ${COLORS.border}`,
              "&:hover": { borderColor: COLORS.borderStrong, backgroundColor: "#F8FAFC" }
            }}
          >
            Back to Stock
          </Button>

          {/* Clean Action Buttons */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              startIcon={<TrendingUpIcon fontSize="small" />}
              onClick={() => setStockInModalOpen(true)}
              sx={{
                height: 36,
                borderRadius: "8px",
                borderColor: COLORS.success,
                color: COLORS.success,
                backgroundColor: COLORS.successSoft,
                textTransform: "none",
                fontSize: "0.8125rem",
                fontWeight: 700,
                "&:hover": { backgroundColor: "#C6F6D5" }
              }}
            >
              + Stock IN
            </Button>

            <Button
              variant="outlined"
              startIcon={<TrendingDownIcon fontSize="small" />}
              onClick={() => setStockOutModalOpen(true)}
              sx={{
                height: 36,
                borderRadius: "8px",
                borderColor: COLORS.danger,
                color: COLORS.danger,
                backgroundColor: COLORS.dangerSoft,
                textTransform: "none",
                fontSize: "0.8125rem",
                fontWeight: 700,
                "&:hover": { backgroundColor: "#FCD3D3" }
              }}
            >
              - Stock OUT
            </Button>

            <Button
              variant="outlined"
              startIcon={<EditIcon fontSize="small" />}
              onClick={() => setItemModalOpen(true)}
              sx={{
                height: 36,
                borderRadius: "8px",
                borderColor: COLORS.border,
                color: COLORS.textPrimary,
                backgroundColor: "#FFFFFF",
                textTransform: "none",
                fontSize: "0.8125rem",
                fontWeight: 600,
                "&:hover": { borderColor: COLORS.borderStrong, backgroundColor: "#F8FAFC" }
              }}
            >
              Edit Specs
            </Button>

            <Button
              variant="outlined"
              startIcon={<DeleteIcon fontSize="small" />}
              onClick={() => setDeleteDialogOpen(true)}
              sx={{
                height: 36,
                borderRadius: "8px",
                borderColor: COLORS.danger,
                color: COLORS.danger,
                backgroundColor: COLORS.dangerSoft,
                textTransform: "none",
                fontSize: "0.8125rem",
                fontWeight: 600,
                "&:hover": { backgroundColor: "#FCD3D3" }
              }}
            >
              Delete
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* ── Low Stock Alert Banner ────────────────────────────── */}
      {curStock <= minLevel && (
        <Alert
          severity="error"
          icon={<WarningAmberIcon fontSize="small" />}
          sx={{ mb: 3, borderRadius: "12px", fontWeight: 600, fontSize: "0.8125rem", border: `1px solid ${COLORS.danger}30` }}
        >
          Low Stock Warning: Current stock ({curStock} {item.unit}) is below minimum threshold level ({minLevel} {item.unit}). Please arrange restock!
        </Alert>
      )}

      {/* ── Main Item Overview & Stock Cards ──────────────────── */}
      <Grid container spacing={3} sx={{ mb: 3.5 }}>
        {/* Left Card — Product Overview */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: "14px", border: `1px solid ${COLORS.border}`, backgroundColor: "#FFFFFF", height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
              <Avatar
                src={avatarSrc || undefined}
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  bgcolor: COLORS.primarySoft,
                  color: COLORS.primary,
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  border: `2px dashed ${COLORS.borderStrong}`,
                  flexShrink: 0,
                }}
              >
                {!avatarSrc && (item.name.charAt(0).toUpperCase() || <SolarPowerIcon fontSize="large" />)}
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Chip
                  label={item.category_name}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 700, mb: 0.8, fontSize: "0.68rem", color: COLORS.primary, borderColor: COLORS.border }}
                />
                <Typography variant="h6" noWrap sx={{ fontWeight: 700, color: COLORS.primary, fontFamily: "'Outfit', sans-serif" }}>
                  {item.name}
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.8125rem" }}>
                  Brand: <strong>{item.brand || "—"}</strong> {item.model ? `• Model: ${item.model}` : ""}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, textTransform: "uppercase", fontSize: "0.68rem", fontWeight: 600 }}>Item Code (SKU)</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{item.item_code}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, textTransform: "uppercase", fontSize: "0.68rem", fontWeight: 600 }}>Unit Measurement</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{item.unit}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, textTransform: "uppercase", fontSize: "0.68rem", fontWeight: 600 }}>Unit Price (Excl GST)</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>₹{unitPrice.toLocaleString("en-IN")}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, textTransform: "uppercase", fontSize: "0.68rem", fontWeight: 600 }}>GST Rate (%)</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{item.gst_rate}% {item.hsn_code ? `(HSN: ${item.hsn_code})` : ""}</Typography>
              </Grid>
            </Grid>

            {item.description && (
              <Box sx={{ mt: "auto", p: 2, bgcolor: "#FAFBFC", borderRadius: "10px", border: `1px solid ${COLORS.border}` }}>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, textTransform: "uppercase", fontSize: "0.68rem" }} display="block">Description / Summary</Typography>
                <Typography variant="body2" sx={{ color: COLORS.textPrimary, fontSize: "0.8125rem", mt: 0.5, lineHeight: 1.5 }}>{item.description}</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Card — Stock Gauge & Specs */}
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            {/* Stock Level Gauges */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: "14px", border: `1px solid ${COLORS.border}`, backgroundColor: "#FFFFFF" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.primary, mb: 2, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                Warehouse Stock Level Overview
              </Typography>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <Box sx={{ p: 2, bgcolor: COLORS.successSoft, borderRadius: "12px", border: `1px solid ${COLORS.success}30`, textAlign: "center" }}>
                    <Typography variant="caption" sx={{ color: COLORS.success, fontWeight: 700, textTransform: "uppercase", fontSize: "0.68rem" }}>CURRENT STOCK</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.success, my: 0.5, fontFamily: "'Outfit', sans-serif" }}>{curStock}</Typography>
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: "0.72rem" }}>{item.unit}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={4}>
                  <Box sx={{ p: 2, bgcolor: "#FEF3C7", borderRadius: "12px", border: `1px solid ${COLORS.secondary}30`, textAlign: "center" }}>
                    <Typography variant="caption" sx={{ color: COLORS.secondaryDark, fontWeight: 700, textTransform: "uppercase", fontSize: "0.68rem" }}>RESERVED</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.secondaryDark, my: 0.5, fontFamily: "'Outfit', sans-serif" }}>{reservedStock}</Typography>
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: "0.72rem" }}>{item.unit}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={4}>
                  <Box sx={{ p: 2, bgcolor: COLORS.infoSoft, borderRadius: "12px", border: `1px solid ${COLORS.info}30`, textAlign: "center" }}>
                    <Typography variant="caption" sx={{ color: COLORS.info, fontWeight: 700, textTransform: "uppercase", fontSize: "0.68rem" }}>AVAILABLE</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: COLORS.info, my: 0.5, fontFamily: "'Outfit', sans-serif" }}>{availStock}</Typography>
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: "0.72rem" }}>{item.unit}</Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Threshold level bar */}
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.8 }}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: "0.75rem" }}>Min Level: <strong>{minLevel} {item.unit}</strong></Typography>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: "0.75rem" }}>Reorder Level: <strong>{reorderLevel} {item.unit}</strong></Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.success, fontSize: "0.75rem" }}>
                    Valuation: ₹{totalValuation.toLocaleString("en-IN")}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, (curStock / Math.max(reorderLevel * 2, 50)) * 100)}
                  color={curStock <= minLevel ? "error" : curStock <= reorderLevel ? "warning" : "success"}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Paper>

            {/* Technical Specifications Breakdown */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: "14px", border: `1px solid ${COLORS.border}`, backgroundColor: "#FFFFFF" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.primary, mb: 2, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                Technical Specifications ({item.category_name})
              </Typography>

              <Grid container spacing={1.5}>
                {Object.entries(specs).map(([key, val]) => {
                  if (!val) return null;
                  const formattedKey = key.replace(/_/g, " ").toUpperCase();
                  return (
                    <Grid item xs={12} sm={6} key={key}>
                      <Box sx={{ p: 1.5, bgcolor: "#FAFBFC", borderRadius: "8px", border: `1px solid ${COLORS.border}` }}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700, display: "block", fontSize: "0.68rem" }}>
                          {formattedKey}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: "0.8125rem" }}>
                          {String(val)}
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* ── Transaction History Logs Table ──────────────────── */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: "14px", border: `1px solid ${COLORS.border}`, backgroundColor: "#FFFFFF" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.primary, fontFamily: "'Outfit', sans-serif" }}>
            Stock Movement & Transaction Logs ({item.transactions?.length || 0})
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate(`/stock/transactions?item_id=${item.id}`)}
            sx={{
              height: 32,
              borderRadius: "8px",
              borderColor: COLORS.border,
              color: COLORS.textPrimary,
              textTransform: "none",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            View All Logs
          </Button>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: COLORS.primary }}>
              <TableRow>
                <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.8125rem" }}>Txn #</TableCell>
                <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.8125rem" }}>Type</TableCell>
                <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.8125rem" }}>Qty</TableCell>
                <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.8125rem" }}>Stock Before → After</TableCell>
                <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.8125rem" }}>Unit Price</TableCell>
                <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.8125rem" }}>Total Value</TableCell>
                <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.8125rem" }}>Reference / Vendor</TableCell>
                <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.8125rem" }}>Performed By</TableCell>
                <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.8125rem" }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(item.transactions || []).map((txn) => (
                <TableRow key={txn.id} hover sx={{ "&:hover": { bgcolor: COLORS.primarySoft } }}>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.info, fontSize: "0.8125rem" }}>{txn.transaction_number}</TableCell>
                  <TableCell>
                    <Chip
                      label={txn.transaction_type}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.68rem",
                        height: 22,
                        bgcolor: txn.transaction_type === "IN" ? COLORS.successSoft : COLORS.dangerSoft,
                        color: txn.transaction_type === "IN" ? COLORS.success : COLORS.danger,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.8125rem" }}>{txn.quantity} {item.unit}</TableCell>
                  <TableCell sx={{ fontSize: "0.8125rem" }}>{txn.quantity_before} → <strong>{txn.quantity_after}</strong></TableCell>
                  <TableCell sx={{ fontSize: "0.8125rem" }}>₹{Number(txn.unit_price).toLocaleString("en-IN")}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: COLORS.success, fontSize: "0.8125rem" }}>₹{Number(txn.total_value).toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <Typography variant="caption" display="block" sx={{ fontWeight: 600, color: COLORS.textPrimary }}>
                      {txn.reference_type} {txn.reference_number ? `(${txn.reference_number})` : ""}
                    </Typography>
                    {txn.vendor_name && <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: "0.72rem" }}>{txn.vendor_name}</Typography>}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.8125rem" }}>{txn.user_name || "Admin"}</TableCell>
                  <TableCell sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}>{new Date(txn.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {(!item.transactions || item.transactions.length === 0) && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3, color: COLORS.textMuted }}>
                    No stock transactions recorded for this item yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── Custom MUI Confirm Delete Dialog ──────────────────── */}
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
            Are you sure you want to delete <strong>{item.name}</strong> ({item.item_code})?
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

      {/* Stock Item Modal */}
      {itemModalOpen && (
        <StockItemModal
          open={itemModalOpen}
          onClose={() => setItemModalOpen(false)}
          onSuccess={fetchItemDetail}
          categories={categories}
          editItem={item}
        />
      )}

      {/* Stock IN Modal */}
      {stockInModalOpen && (
        <StockInModal
          open={stockInModalOpen}
          onClose={() => setStockInModalOpen(false)}
          onSuccess={fetchItemDetail}
          items={[item]}
          preSelectedItem={item}
        />
      )}

      {/* Stock OUT Modal */}
      {stockOutModalOpen && (
        <StockOutModal
          open={stockOutModalOpen}
          onClose={() => setStockOutModalOpen(false)}
          onSuccess={fetchItemDetail}
          items={[item]}
          preSelectedItem={item}
        />
      )}
    </Box>
  );
};

export default StockDetail;
