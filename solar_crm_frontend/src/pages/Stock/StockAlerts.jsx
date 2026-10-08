import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Grid, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  Button, IconButton, Avatar, Tabs, Tab, LinearProgress,
  Tooltip
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VisibilityIcon from "@mui/icons-material/Visibility";

import toast from "react-hot-toast";

import { getStockAlerts, resolveStockAlert, getStockItems } from "../../services/stockService";
import StockInModal from "./components/StockInModal";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000";

const StockAlerts = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0); // 0: Active, 1: Resolved
  const [alerts, setAlerts] = useState([]);
  const [items, setItems] = useState([]);

  // Stock IN modal for quick restock
  const [stockInModalOpen, setStockInModalOpen] = useState(false);
  const [selectedRestockItem, setSelectedRestockItem] = useState(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const [alertRes, itemRes] = await Promise.all([
        getStockAlerts({ is_resolved: tabValue }),
        getStockItems({ limit: 100 }),
      ]);
      setAlerts(alertRes.data || []);
      setItems(itemRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load stock alerts.");
    } finally {
      setLoading(false);
    }
  }, [tabValue]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleResolve = async (alertId) => {
    try {
      await resolveStockAlert(alertId);
      toast.success("Alert marked as resolved!");
      fetchAlerts();
    } catch (err) {
      toast.error("Failed to resolve alert.");
    }
  };

  const handleOpenRestock = (item) => {
    setSelectedRestockItem(item);
    setStockInModalOpen(true);
  };

  const outOfStockCount = alerts.filter(a => a.alert_type === "OUT_OF_STOCK").length;
  const lowStockCount = alerts.filter(a => a.alert_type === "LOW_STOCK").length;
  const reorderCount = alerts.filter(a => a.alert_type === "REORDER").length;

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: 1.5 }}>
            <WarningAmberIcon sx={{ color: "#EF4444", fontSize: 32 }} /> Low Stock & Inventory Alerts
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            Automated alerts when items reach critical stock shortages or reorder thresholds.
          </Typography>
        </Box>

        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/stock")}
          sx={{ color: "#64748B", fontWeight: 600 }}
        >
          Back to Stock Grid
        </Button>
      </Box>

      {/* Summary KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2.5, borderRadius: "12px", borderLeft: "4px solid #DC2626", backgroundColor: "#FFFFFF" }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "#DC2626" }}>OUT OF STOCK ITEMS</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#DC2626", my: 0.5, fontFamily: "'Outfit', sans-serif" }}>
              {outOfStockCount}
            </Typography>
            <Typography variant="caption" color="textSecondary">Stock quantity is 0</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2.5, borderRadius: "12px", borderLeft: "4px solid #F59E0B", backgroundColor: "#FFFFFF" }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "#D97706" }}>LOW STOCK THRESHOLD</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#D97706", my: 0.5, fontFamily: "'Outfit', sans-serif" }}>
              {lowStockCount}
            </Typography>
            <Typography variant="caption" color="textSecondary">Current stock ≤ Min stock level</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2.5, borderRadius: "12px", borderLeft: "4px solid #3B82F6", backgroundColor: "#FFFFFF" }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "#2563EB" }}>REORDER RECOMMENDED</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#2563EB", my: 0.5, fontFamily: "'Outfit', sans-serif" }}>
              {reorderCount}
            </Typography>
            <Typography variant="caption" color="textSecondary">Stock at reorder point</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ borderRadius: "12px", mb: 3, backgroundColor: "#FFFFFF" }}>
        <Tabs
          value={tabValue}
          onChange={(e, val) => setTabValue(val)}
          indicatorColor="warning"
          textColor="warning"
          sx={{ borderBottom: "1px solid #E2E8F0" }}
        >
          <Tab label={`Active Alerts (${tabValue === 0 ? alerts.length : "..."})`} sx={{ fontWeight: 700 }} />
          <Tab label="Resolved Alerts History" sx={{ fontWeight: 700 }} />
        </Tabs>
      </Paper>

      {loading && <LinearProgress color="warning" sx={{ mb: 2, borderRadius: "4px" }} />}

      {/* Alerts Table */}
      <TableContainer component={Paper} sx={{ borderRadius: "16px", border: "1px solid #E2E8F0" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#0F172A" }}>
            <TableRow>
              <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Item Details</TableCell>
              <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Alert Severity</TableCell>
              <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Current Stock vs Min Threshold</TableCell>
              <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Alert Triggered Date</TableCell>
              {tabValue === 1 && <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Resolved By</TableCell>}
              <TableCell align="right" sx={{ color: "#FFFFFF", fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert.id} hover>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar
                      src={alert.item_image ? `${API_BASE_URL}${alert.item_image.startsWith("/") ? "" : "/"}${alert.item_image}` : undefined}
                      sx={{ width: 38, height: 38, bgcolor: "rgba(239,68,68,0.15)", color: "#EF4444", fontWeight: 700 }}
                    >
                      {alert.item_name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A", cursor: "pointer" }} onClick={() => navigate(`/stock/${alert.item_id}`)}>
                        {alert.item_name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">{alert.item_code} • {alert.item_brand || "Generic"}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell><Chip label={alert.category_name} size="small" variant="outlined" /></TableCell>
                <TableCell>
                  <Chip
                    label={alert.alert_type.replace(/_/g, " ")}
                    size="small"
                    color={
                      alert.alert_type === "OUT_OF_STOCK" ? "error" :
                      alert.alert_type === "LOW_STOCK" ? "warning" : "info"
                    }
                    sx={{ fontWeight: 800 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: alert.current_stock <= 0 ? "#DC2626" : "#D97706" }}>
                    {alert.current_stock} {alert.item_unit}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Min Threshold: {alert.min_stock_level} {alert.item_unit}
                  </Typography>
                </TableCell>
                <TableCell>{new Date(alert.created_at).toLocaleString()}</TableCell>
                {tabValue === 1 && (
                  <TableCell>
                    {alert.resolved_by_name || "System Auto-Resolved"}
                    <Typography variant="caption" display="block" color="textSecondary">
                      {alert.resolved_at ? new Date(alert.resolved_at).toLocaleDateString() : ""}
                    </Typography>
                  </TableCell>
                )}
                <TableCell align="right">
                  <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<TrendingUpIcon />}
                      onClick={() => handleOpenRestock({ id: alert.item_id, name: alert.item_name, item_code: alert.item_code, current_stock: alert.current_stock, unit: alert.item_unit })}
                      sx={{ fontWeight: 700, textTransform: "none" }}
                    >
                      Restock
                    </Button>
                    {tabValue === 0 && (
                      <Tooltip title="Mark as Resolved">
                        <IconButton size="small" color="primary" onClick={() => handleResolve(alert.id)}>
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="View Item Details">
                      <IconButton size="small" onClick={() => navigate(`/stock/${alert.item_id}`)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {alerts.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: "#94A3B8" }}>
                  {tabValue === 0 ? "🎉 No active low stock alerts! All inventory levels are healthy." : "No resolved alerts history."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Restock Modal */}
      {stockInModalOpen && (
        <StockInModal
          open={stockInModalOpen}
          onClose={() => setStockInModalOpen(false)}
          onSuccess={fetchAlerts}
          items={items}
          preSelectedItem={selectedRestockItem}
        />
      )}
    </Box>
  );
};

export default StockAlerts;
