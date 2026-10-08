import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid, Typography, IconButton,
  InputAdornment, CircularProgress, Box, Alert
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import toast from "react-hot-toast";

import { createStockTransaction, getStockItemByBarcode } from "../../../services/stockService";

const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  primarySoft: "#F1F5F9",
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  success: "#16A34A",
  successSoft: "#DCFCE7",
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

const StockInModal = ({ open, onClose, onSuccess, items = [], preSelectedItem = null }) => {
  const [loading, setLoading] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeSearching, setBarcodeSearching] = useState(false);
  const [formData, setFormData] = useState({
    item_id: "",
    quantity: "",
    unit_price: "",
    reference_type: "PURCHASE",
    vendor_name: "",
    vendor_invoice: "",
    notes: "",
  });

  useEffect(() => {
    if (preSelectedItem) {
      setFormData({
        item_id: preSelectedItem.id,
        quantity: "",
        unit_price: preSelectedItem.unit_price || "",
        reference_type: "PURCHASE",
        vendor_name: "",
        vendor_invoice: "",
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

  const handleBarcodeLookup = async (codeToSearch) => {
    const clean = String(codeToSearch || barcodeInput).trim();
    if (!clean) return;

    setBarcodeSearching(true);
    try {
      // 1. Check local preloaded items list
      const upper = clean.toUpperCase();
      let matched = items.find(
        (i) =>
          (i.barcode && i.barcode.toUpperCase() === upper) ||
          (i.item_code && i.item_code.toUpperCase() === upper)
      );

      // 2. Fallback to API if not in current page
      if (!matched) {
        const res = await getStockItemByBarcode(clean);
        if (res.success && res.data) {
          matched = res.data;
        }
      }

      if (matched) {
        setFormData((prev) => ({
          ...prev,
          item_id: matched.id,
          unit_price: matched.unit_price || prev.unit_price,
        }));
        toast.success(`Selected: ${matched.name} (${matched.item_code})`);
      } else {
        toast.error(`No item found for barcode "${clean}"`);
      }
    } catch (err) {
      toast.error(`Barcode "${clean}" not found.`);
    } finally {
      setBarcodeSearching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "item_id") {
        const itemObj = items.find((i) => i.id === Number(value));
        if (itemObj) {
          updated.unit_price = itemObj.unit_price || "";
        }
      }
      return updated;
    });
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

    setLoading(true);
    try {
      await createStockTransaction({
        ...formData,
        transaction_type: "IN",
        quantity: qty,
      });
      toast.success("Stock IN purchase entry recorded successfully!");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to record Stock IN");
    } finally {
      setLoading(false);
    }
  };

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
              bgcolor: COLORS.successSoft,
              color: COLORS.success,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TrendingUpIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="h6" sx={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.textPrimary, fontFamily: "'Outfit', sans-serif" }}>
            Stock IN — Purchase / Inward Entry
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
            <Alert severity="success" icon={<TrendingUpIcon fontSize="inherit" />} sx={{ mb: 2.5, borderRadius: "10px", fontWeight: 500, fontSize: "0.8125rem" }}>
              Current Stock: <strong>{selectedItem.current_stock} {selectedItem.unit}</strong> | SKU: <strong>{selectedItem.item_code}</strong>
            </Alert>
          )}

          <Grid container spacing={2}>
            {!preSelectedItem && (
              <>
                {/* Barcode Quick Scan / Key-in Picker */}
                <Grid item xs={12}>
                  <Box sx={{ mb: 1, display: "flex", gap: 1 }}>
                    <TextField
                      placeholder="Scan QR or type barcode to auto-select item..."
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleBarcodeLookup(barcodeInput);
                        }
                      }}
                      fullWidth
                      size="small"
                      sx={controlSx}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <QrCodeScannerIcon sx={{ color: "#F59E0B", fontSize: 18 }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => handleBarcodeLookup(barcodeInput)}
                      disabled={barcodeSearching || !barcodeInput.trim()}
                      sx={{
                        borderRadius: "8px",
                        borderColor: "#F59E0B",
                        color: "#B45309",
                        bgcolor: "#FEF3C7",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        textTransform: "none",
                        whiteSpace: "nowrap",
                        "&:hover": { bgcolor: "#FDE68A" },
                      }}
                    >
                      {barcodeSearching ? <CircularProgress size={16} color="inherit" /> : "Lookup Barcode"}
                    </Button>
                  </Box>
                </Grid>

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
                      {item.item_code} — {item.name} ({item.brand || "Generic"}) — Stock: {item.current_stock} {item.unit}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </>
          )}

            <Grid item xs={12} sm={6}>
              <FieldLabel>Inward Quantity *</FieldLabel>
              <TextField
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                fullWidth
                size="small"
                sx={controlSx}
                required
                placeholder="e.g. 50"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FieldLabel>Purchase Unit Price (₹)</FieldLabel>
              <TextField
                name="unit_price"
                type="number"
                value={formData.unit_price}
                onChange={handleChange}
                fullWidth
                size="small"
                sx={controlSx}
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
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
                <MenuItem value="PURCHASE">Purchase Order / Bill</MenuItem>
                <MenuItem value="RETURN">Customer Return</MenuItem>
                <MenuItem value="ADJUSTMENT">Inventory Adjustment</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FieldLabel>Vendor / Supplier Name</FieldLabel>
              <TextField
                name="vendor_name"
                value={formData.vendor_name}
                onChange={handleChange}
                placeholder="e.g. Waaree Energies Ltd"
                fullWidth
                size="small"
                sx={controlSx}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FieldLabel>Vendor Invoice / Bill No</FieldLabel>
              <TextField
                name="vendor_invoice"
                value={formData.vendor_invoice}
                onChange={handleChange}
                placeholder="e.g. INV-2026-9901"
                fullWidth
                size="small"
                sx={controlSx}
              />
            </Grid>

            <Grid item xs={12}>
              <FieldLabel>Remarks / Notes</FieldLabel>
              <TextField
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="e.g. Received 50 panels in Good condition at main warehouse"
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
            disabled={loading}
            sx={{
              backgroundColor: COLORS.success,
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "0.8125rem",
              px: 3,
              height: 38,
              borderRadius: "8px",
              textTransform: "none",
              boxShadow: "none",
              "&:hover": { backgroundColor: "#15803D", boxShadow: "none" }
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : "Confirm Stock IN"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default StockInModal;
