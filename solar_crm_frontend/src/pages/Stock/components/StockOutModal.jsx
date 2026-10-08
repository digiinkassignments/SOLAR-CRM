import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid, Typography, IconButton,
  CircularProgress, Box, Alert
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import toast from "react-hot-toast";

import { createStockTransaction } from "../../../services/stockService";

const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
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
    "&.MuiInputBase-multiline": {
      py: 1,
      px: 1.5,
      minHeight: 72,
    },
  },
  "& .MuiInputBase-input": {
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.8125rem",
    py: 0.8,
    "&.MuiInputBase-inputMultiline": {
      py: 0,
      px: 0,
    },
  },
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    fontSize: "0.8125rem",
    fontFamily: "'Inter', sans-serif",
    py: 0.8,
  },
};

const FieldLabel = ({ children }) => (
  <Typography
    sx={{
      fontSize: "0.6875rem",
      fontWeight: 600,
      color: COLORS.textSecondary,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      mb: 0.6,
      fontFamily: "'Inter', sans-serif",
    }}
  >
    {children}
  </Typography>
);

const StockOutModal = ({ open, onClose, onSuccess, items = [], preSelectedItem = null }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    item_id: "",
    quantity: "",
    reference_type: "PROJECT",
    reference_number: "",
    vendor_name: "",
    notes: "",
  });

  useEffect(() => {
    if (preSelectedItem) {
      setFormData({
        item_id: preSelectedItem.id,
        quantity: "",
        reference_type: "PROJECT",
        reference_number: "",
        vendor_name: "",
        notes: "",
      });
    } else if (items.length > 0) {
      setFormData((prev) => ({
        ...prev,
        item_id: prev.item_id || items[0].id,
      }));
    }
  }, [preSelectedItem, open, items]);

  const selectedItem = items.find((i) => i.id === Number(formData.item_id)) || preSelectedItem;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.item_id) {
      toast.error("Please select a stock item");
      return;
    }
    const qty = parseInt(formData.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid positive quantity");
      return;
    }

    if (selectedItem && qty > selectedItem.current_stock) {
      toast.error(`Cannot dispatch ${qty} ${selectedItem.unit}. Available current stock is only ${selectedItem.current_stock}.`);
      return;
    }

    setLoading(true);
    try {
      await createStockTransaction({
        ...formData,
        transaction_type: "OUT",
        quantity: qty,
      });
      toast.success("Stock OUT dispatch entry recorded successfully!");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to record Stock OUT");
    } finally {
      setLoading(false);
    }
  };

  const currentStock = selectedItem?.current_stock || 0;
  const requestedQty = parseInt(formData.quantity, 10) || 0;
  const remainingStock = currentStock - requestedQty;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          border: `1px solid ${COLORS.border}`,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          fontSize: "1.0625rem",
          fontWeight: 700,
          fontFamily: "'Inter', sans-serif",
          py: 2,
          px: 3,
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              bgcolor: COLORS.dangerSoft,
              color: COLORS.danger,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TrendingDownIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="h6" sx={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.textPrimary, fontFamily: "'Outfit', sans-serif" }}>
            Stock OUT — Dispatch / Issue Entry
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            width: 30,
            height: 30,
            borderRadius: "8px",
            color: COLORS.textSecondary,
            backgroundColor: "#F1F5F9",
            "&:hover": { backgroundColor: "#E2E8F0" },
          }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3, backgroundColor: "#FAFBFC" }}>
          {selectedItem && (
            <Alert
              severity={remainingStock < 0 ? "error" : "info"}
              sx={{ mb: 2.5, borderRadius: "10px", fontWeight: 500, fontSize: "0.8125rem" }}
            >
              Current Stock: <strong>{currentStock} {selectedItem.unit}</strong>
              {requestedQty > 0 && (
                <>
                  {" "}→ After Dispatch: <strong>{remainingStock} {selectedItem.unit}</strong>
                </>
              )}
            </Alert>
          )}

          <Grid container spacing={2}>
            {!preSelectedItem && (
              <Grid item xs={12}>
                <FieldLabel>Select Stock Item *</FieldLabel>
                <TextField
                  select
                  name="item_id"
                  value={formData.item_id}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  sx={controlSx}
                  required
                >
                  {items.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.item_code} — {item.name} ({item.brand || "Generic"}) — Available: {item.current_stock} {item.unit}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <FieldLabel>Dispatch Quantity *</FieldLabel>
              <TextField
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                fullWidth
                size="small"
                sx={controlSx}
                required
                placeholder="e.g. 10"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FieldLabel>Reference Type</FieldLabel>
              <TextField
                select
                name="reference_type"
                value={formData.reference_type}
                onChange={handleChange}
                fullWidth
                size="small"
                sx={controlSx}
              >
                <MenuItem value="PROJECT">Project / Site Dispatch</MenuItem>
                <MenuItem value="LEAD">Lead Demo / Sample</MenuItem>
                <MenuItem value="DAMAGED">Scrap / Damaged Write-off</MenuItem>
                <MenuItem value="ADJUSTMENT">Stock Adjustment</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FieldLabel>Project / Lead Code</FieldLabel>
              <TextField
                name="reference_number"
                value={formData.reference_number}
                onChange={handleChange}
                placeholder="e.g. PROJ-2026-104"
                fullWidth
                size="small"
                sx={controlSx}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FieldLabel>Customer / Site Name</FieldLabel>
              <TextField
                name="vendor_name"
                value={formData.vendor_name}
                onChange={handleChange}
                placeholder="e.g. Rajesh Sharma (Jaipur Site)"
                fullWidth
                size="small"
                sx={controlSx}
              />
            </Grid>

            <Grid item xs={12}>
              <FieldLabel>Remarks / Dispatch Notes</FieldLabel>
              <TextField
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="e.g. Dispatched 10 panels via local transport for site installation"
                multiline
                rows={3}
                fullWidth
                size="small"
                sx={controlSx}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3, borderTop: `1px solid ${COLORS.border}`, backgroundColor: "#FFFFFF" }}>
          <Button onClick={onClose} sx={{ color: COLORS.textSecondary, fontWeight: 600, fontSize: "0.8125rem", textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || remainingStock < 0}
            sx={{
              backgroundColor: COLORS.danger,
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "0.8125rem",
              px: 3,
              height: 38,
              borderRadius: "8px",
              textTransform: "none",
              boxShadow: "none",
              "&:hover": { backgroundColor: "#B91C1C", boxShadow: "none" }
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : "Confirm Stock OUT"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default StockOutModal;
