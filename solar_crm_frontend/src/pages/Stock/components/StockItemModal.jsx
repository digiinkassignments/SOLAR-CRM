import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid, Box, Typography,
  IconButton, InputAdornment, Avatar, CircularProgress, Chip,
  Stack, Paper
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import toast from "react-hot-toast";

import { createStockItem, updateStockItem } from "../../../services/stockService";

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
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}
  >
    {children}
  </Typography>
);

const UNITS = ["Piece", "Set", "Meter", "Kg", "Litre", "Roll", "Pair", "Box"];

const StockItemModal = ({ open, onClose, onSuccess, categories = [], editItem = null }) => {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);

  const [formData, setFormData] = useState({
    category_id: "",
    item_code: "",
    barcode: "",
    name: "",
    brand: "",
    model: "",
    description: "",
    unit: "Piece",
    unit_price: "",
    gst_rate: "18.00",
    hsn_code: "",
    min_stock_level: "5",
    reorder_level: "10",
    current_stock: "0",
  });

  const [specs, setSpecs] = useState({
    wattage: "",
    panel_type: "Mono PERC",
    efficiency: "",
    warranty_years: "25",
    capacity_kw: "",
    inverter_type: "On-Grid",
    phase: "3 Phase",
    structure_type: "GI",
    weight_kg: "",
    cable_type: "DC 6mm²",
    earthing_type: "Chemical Rod",
    battery_capacity: "",
    notes: "",
  });

  useEffect(() => {
    if (editItem) {
      setFormData({
        category_id: editItem.category_id || "",
        item_code: editItem.item_code || "",
        barcode: editItem.barcode || "",
        name: editItem.name || "",
        brand: editItem.brand || "",
        model: editItem.model || "",
        description: editItem.description || "",
        unit: editItem.unit || "Piece",
        unit_price: editItem.unit_price || "",
        gst_rate: editItem.gst_rate || "18.00",
        hsn_code: editItem.hsn_code || "",
        min_stock_level: editItem.min_stock_level || "5",
        reorder_level: editItem.reorder_level || "10",
        current_stock: editItem.current_stock || "0",
      });

      const existingSpecs = editItem.specifications || {};
      setSpecs({
        wattage: existingSpecs.wattage || "",
        panel_type: existingSpecs.panel_type || "Mono PERC",
        efficiency: existingSpecs.efficiency || "",
        warranty_years: existingSpecs.warranty_years || "25",
        capacity_kw: existingSpecs.capacity_kw || "",
        inverter_type: existingSpecs.inverter_type || "On-Grid",
        phase: existingSpecs.phase || "3 Phase",
        structure_type: existingSpecs.structure_type || "GI",
        weight_kg: existingSpecs.weight_kg || "",
        cable_type: existingSpecs.cable_type || "DC 6mm²",
        earthing_type: existingSpecs.earthing_type || "Chemical Rod",
        battery_capacity: existingSpecs.battery_capacity || "",
        notes: existingSpecs.notes || "",
      });

      if (editItem.image_url) {
        const fullUrl = editItem.image_url.startsWith("http")
          ? editItem.image_url
          : `${API_BASE_URL}${editItem.image_url.startsWith("/") ? "" : "/"}${editItem.image_url}`;
        setImagePreview(fullUrl);
      } else {
        setImagePreview(null);
      }
    } else {
      setFormData({
        category_id: categories[0]?.id || "",
        item_code: "",
        barcode: "",
        name: "",
        brand: "",
        model: "",
        description: "",
        unit: "Piece",
        unit_price: "",
        gst_rate: "18.00",
        hsn_code: "",
        min_stock_level: "5",
        reorder_level: "10",
        current_stock: "0",
      });
      setSpecs({
        wattage: "",
        panel_type: "Mono PERC",
        efficiency: "",
        warranty_years: "25",
        capacity_kw: "",
        inverter_type: "On-Grid",
        phase: "3 Phase",
        structure_type: "GI",
        weight_kg: "",
        cable_type: "DC 6mm²",
        earthing_type: "Chemical Rod",
        battery_capacity: "",
        notes: "",
      });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [editItem, open, categories]);

  const selectedCategory = categories.find((c) => c.id === Number(formData.category_id)) || categories[0];
  const catSlug = selectedCategory?.slug || "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSpecChange = (e) => {
    const { name, value } = e.target;
    setSpecs((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    setImageError(null);
    if (file) {
      // 5MB Maximum File Size Check
      const maxSizeBytes = 5 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
        const errorMsg = `File size too large (${sizeInMb} MB)! Maximum allowed image size is 5MB.`;
        setImageError(errorMsg);
        toast.error(errorMsg, { duration: 5000 });
        e.target.value = "";
        return;
      }

      // Format validation
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        const errorMsg = "Invalid file type. Only JPG, PNG, and WEBP images are allowed.";
        setImageError(errorMsg);
        toast.error(errorMsg);
        e.target.value = "";
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Item Name is required");
      return;
    }
    if (!formData.category_id) {
      toast.error("Category selection is required");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });
      data.append("specifications", JSON.stringify(specs));
      if (imageFile) {
        data.append("image", imageFile);
      }

      if (editItem) {
        await updateStockItem(editItem.id, data);
        toast.success("Stock item updated successfully!");
      } else {
        await createStockItem(data);
        toast.success("Stock item created successfully!");
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save stock item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          border: `1px solid ${COLORS.border}`,
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        component="div"
        sx={{
          fontSize: "1.0625rem",
          fontWeight: 700,
          fontFamily: "'Inter', sans-serif",
          pb: 1.5,
          pt: 2,
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
              bgcolor: COLORS.primarySoft,
              color: COLORS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SolarPowerIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="h6" sx={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.textPrimary, fontFamily: "'Outfit', sans-serif" }}>
            {editItem ? `Edit Item: ${editItem.name}` : "Add New Stock Item"}
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

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        <DialogContent sx={{ p: 3, backgroundColor: "#FAFBFC", flex: 1, overflowY: "auto" }}>
          <Stack spacing={3}>
            
            {/* SECTION 1: Product Header & Photo */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: "#FFFFFF" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.primary, mb: 2, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                1. General Product Information
              </Typography>
              
              {/* TOP CENTERED CIRCULAR IMAGE AVATAR UPLOAD */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", mb: 3 }}>
                <Box sx={{ position: "relative" }}>
                  <Avatar
                    src={imagePreview || undefined}
                    sx={{
                      width: 96,
                      height: 96,
                      borderRadius: "50%",
                      bgcolor: COLORS.primarySoft,
                      color: COLORS.primary,
                      border: `2px dashed ${COLORS.borderStrong}`,
                      fontSize: "2.2rem",
                      boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
                    }}
                  >
                    {!imagePreview && (formData.name ? formData.name.charAt(0).toUpperCase() : <SolarPowerIcon />)}
                  </Avatar>
                  <IconButton
                    component="label"
                    size="small"
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      bgcolor: COLORS.primary,
                      color: "#FFFFFF",
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                      border: "2px solid #FFFFFF",
                      "&:hover": { bgcolor: COLORS.primaryDark },
                    }}
                  >
                    <PhotoCameraIcon sx={{ fontSize: 16 }} />
                    <input type="file" hidden accept="image/*" onChange={handleImageSelect} />
                  </IconButton>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: imageError ? COLORS.danger : COLORS.textMuted,
                    fontSize: "0.72rem",
                    textAlign: "center",
                    mt: 1,
                    fontWeight: imageError ? 700 : 500,
                  }}
                >
                  {imageError || "Upload Product Image (PNG, JPG, WEBP up to 5MB)"}
                </Typography>
              </Box>

              {/* Product General Fields Grid */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Category *</FieldLabel>
                  <TextField
                    select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    sx={controlSx}
                    required
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FieldLabel>Item Code / SKU</FieldLabel>
                  <TextField
                    name="item_code"
                    value={formData.item_code}
                    onChange={handleChange}
                    placeholder="e.g. SP-WAR-540W (Auto if empty)"
                    fullWidth
                    size="small"
                    sx={controlSx}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FieldLabel>Barcode / EAN / QR Code (Optional)</FieldLabel>
                  <TextField
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    placeholder="e.g. 8901234567890"
                    fullWidth
                    size="small"
                    sx={controlSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <QrCodeScannerIcon sx={{ fontSize: 16, color: COLORS.textMuted }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FieldLabel>Product / Item Name *</FieldLabel>
                  <TextField
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Waaree 540W Mono PERC Solar Panel"
                    fullWidth
                    size="small"
                    sx={controlSx}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FieldLabel>Brand</FieldLabel>
                  <TextField
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="e.g. Waaree, Sungrow, Polycab"
                    fullWidth
                    size="small"
                    sx={controlSx}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FieldLabel>Model Number</FieldLabel>
                  <TextField
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="e.g. WSM-540W"
                    fullWidth
                    size="small"
                    sx={controlSx}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* SECTION 2: Pricing & Stock Controls */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: "#FFFFFF" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.primary, mb: 2, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                2. Pricing & Inventory Controls
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <FieldLabel>Unit *</FieldLabel>
                  <TextField
                    select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    sx={controlSx}
                  >
                    {UNITS.map((u) => (
                      <MenuItem key={u} value={u}>{u}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <FieldLabel>Unit Price (₹) *</FieldLabel>
                  <TextField
                    name="unit_price"
                    type="number"
                    value={formData.unit_price}
                    onChange={handleChange}
                    placeholder="0.00"
                    fullWidth
                    size="small"
                    sx={controlSx}
                    required
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <FieldLabel>GST Rate (%)</FieldLabel>
                  <TextField
                    name="gst_rate"
                    type="number"
                    value={formData.gst_rate}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    sx={controlSx}
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <FieldLabel>HSN Code</FieldLabel>
                  <TextField
                    name="hsn_code"
                    value={formData.hsn_code}
                    onChange={handleChange}
                    placeholder="e.g. 8541"
                    fullWidth
                    size="small"
                    sx={controlSx}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FieldLabel>Min Stock Level</FieldLabel>
                  <TextField
                    name="min_stock_level"
                    type="number"
                    value={formData.min_stock_level}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    sx={controlSx}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FieldLabel>Reorder Level</FieldLabel>
                  <TextField
                    name="reorder_level"
                    type="number"
                    value={formData.reorder_level}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    sx={controlSx}
                  />
                </Grid>

                {!editItem && (
                  <Grid item xs={12} sm={4}>
                    <FieldLabel>Initial Stock Quantity</FieldLabel>
                    <TextField
                      name="current_stock"
                      type="number"
                      value={formData.current_stock}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                      sx={controlSx}
                    />
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* SECTION 3: Technical Specifications & Notes */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: "#FFFFFF" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.primary, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                  3. Technical Specifications ({selectedCategory?.name || "Specs"})
                </Typography>
                <Chip label={selectedCategory?.name || "General"} size="small" variant="outlined" sx={{ fontSize: "0.68rem", height: 22, color: COLORS.primary, borderColor: COLORS.border }} />
              </Box>

              <Grid container spacing={2}>
                {catSlug === "solar-panels" && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <FieldLabel>Wattage (Wp)</FieldLabel>
                      <TextField name="wattage" type="number" placeholder="e.g. 540" value={specs.wattage} onChange={handleSpecChange} fullWidth size="small" sx={controlSx} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FieldLabel>Technology / Cell Type</FieldLabel>
                      <TextField select name="panel_type" value={specs.panel_type} onChange={handleSpecChange} fullWidth size="small" sx={controlSx}>
                        <MenuItem value="Mono PERC">Mono PERC</MenuItem>
                        <MenuItem value="Bifacial">Bifacial</MenuItem>
                        <MenuItem value="Poly">Poly Crystalline</MenuItem>
                        <MenuItem value="TopCon">TopCon N-Type</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FieldLabel>Module Efficiency (%)</FieldLabel>
                      <TextField name="efficiency" placeholder="e.g. 21.3%" value={specs.efficiency} onChange={handleSpecChange} fullWidth size="small" sx={controlSx} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FieldLabel>Warranty (Years)</FieldLabel>
                      <TextField name="warranty_years" value={specs.warranty_years} onChange={handleSpecChange} fullWidth size="small" sx={controlSx} />
                    </Grid>
                  </>
                )}

                {catSlug === "inverters" && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <FieldLabel>Capacity (kW)</FieldLabel>
                      <TextField name="capacity_kw" type="number" placeholder="e.g. 10" value={specs.capacity_kw} onChange={handleSpecChange} fullWidth size="small" sx={controlSx} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FieldLabel>Inverter Type</FieldLabel>
                      <TextField select name="inverter_type" value={specs.inverter_type} onChange={handleSpecChange} fullWidth size="small" sx={controlSx}>
                        <MenuItem value="On-Grid">On-Grid / String</MenuItem>
                        <MenuItem value="Off-Grid">Off-Grid</MenuItem>
                        <MenuItem value="Hybrid">Hybrid</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FieldLabel>Phase</FieldLabel>
                      <TextField select name="phase" value={specs.phase} onChange={handleSpecChange} fullWidth size="small" sx={controlSx}>
                        <MenuItem value="Single Phase">Single Phase (1Ф)</MenuItem>
                        <MenuItem value="3 Phase">Three Phase (3Ф)</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FieldLabel>Warranty (Years)</FieldLabel>
                      <TextField name="warranty_years" value={specs.warranty_years} onChange={handleSpecChange} fullWidth size="small" sx={controlSx} />
                    </Grid>
                  </>
                )}

                {catSlug === "mounting-structure" && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <FieldLabel>Material Type</FieldLabel>
                      <TextField select name="structure_type" value={specs.structure_type} onChange={handleSpecChange} fullWidth size="small" sx={controlSx}>
                        <MenuItem value="GI (Galvanized Iron)">GI (Galvanized Iron)</MenuItem>
                        <MenuItem value="Aluminium">Aluminium</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FieldLabel>Weight (kg / kW set)</FieldLabel>
                      <TextField name="weight_kg" placeholder="e.g. 45" value={specs.weight_kg} onChange={handleSpecChange} fullWidth size="small" sx={controlSx} />
                    </Grid>
                  </>
                )}

                {(catSlug === "dc-cables" || catSlug === "ac-cables") && (
                  <Grid item xs={12}>
                    <FieldLabel>Cable / Wire Specification</FieldLabel>
                    <TextField name="cable_type" value={specs.cable_type} onChange={handleSpecChange} placeholder="e.g. DC 4mm² Solar Cable / AC 3.5 Core 25mm² Aluminium Armoured" fullWidth size="small" sx={controlSx} />
                  </Grid>
                )}

                {/* FULL-WIDTH DEDICATED DESCRIPTION / REMARKS FIELD */}
                <Grid item xs={12}>
                  <FieldLabel>Description / Remarks</FieldLabel>
                  <TextField
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Write additional technical specs, notes, or storage details..."
                    multiline
                    rows={3}
                    fullWidth
                    size="small"
                    sx={controlSx}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Stack>
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
              backgroundColor: COLORS.primary,
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "0.8125rem",
              px: 3,
              height: 38,
              borderRadius: "8px",
              textTransform: "none",
              boxShadow: "none",
              "&:hover": { backgroundColor: COLORS.primaryDark, boxShadow: "none" }
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : editItem ? "Save Changes" : "Create Item"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default StockItemModal;
