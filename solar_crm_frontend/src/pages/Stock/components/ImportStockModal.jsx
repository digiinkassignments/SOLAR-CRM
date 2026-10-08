import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, IconButton, Paper, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Stack, LinearProgress, Alert
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import DescriptionIcon from "@mui/icons-material/Description";

import toast from "react-hot-toast";
import * as XLSX from "xlsx";

import { bulkImportStockItems } from "../../../services/stockService";

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
};

const SAMPLE_CSV_HEADERS = [
  "Item Name",
  "Category",
  "Item Code / SKU",
  "Brand",
  "Model",
  "Unit Price",
  "Current Stock Qty",
  "Unit",
  "Min Stock Level",
  "Reorder Level",
  "GST Rate",
  "HSN Code",
  "Description"
];

const SAMPLE_CSV_ROWS = [
  {
    "Item Name": "Waaree 540W Mono PERC Solar Panel",
    "Category": "Solar Panels",
    "Item Code / SKU": "SP-WAR-540W",
    "Brand": "Waaree",
    "Model": "WSM-540",
    "Unit Price": 16500,
    "Current Stock Qty": 50,
    "Unit": "Piece",
    "Min Stock Level": 10,
    "Reorder Level": 15,
    "GST Rate": 12,
    "HSN Code": "8541",
    "Description": "Tier 1 Mono PERC High Efficiency Solar PV Module"
  },
  {
    "Item Name": "Sungrow 5kW Hybrid 3-Phase Inverter",
    "Category": "Inverters",
    "Item Code / SKU": "INV-SUN-5K",
    "Brand": "Sungrow",
    "Model": "SH5.0RT",
    "Unit Price": 75000,
    "Current Stock Qty": 12,
    "Unit": "Piece",
    "Min Stock Level": 3,
    "Reorder Level": 5,
    "GST Rate": 18,
    "HSN Code": "8504",
    "Description": "3-Phase Hybrid Solar Inverter with Dual MPPT"
  },
  {
    "Item Name": "Polycab 6mm sq DC Solar Cable (100m Roll)",
    "Category": "DC Cables",
    "Item Code / SKU": "CBL-DC-6MM",
    "Brand": "Polycab",
    "Model": "DC-SOLAR-6",
    "Unit Price": 4500,
    "Current Stock Qty": 25,
    "Unit": "Roll",
    "Min Stock Level": 5,
    "Reorder Level": 10,
    "GST Rate": 18,
    "HSN Code": "8544",
    "Description": "EN50618 Standard UV Resistant Twin Core Solar DC Cable"
  },
  {
    "Item Name": "Chemical Earthing Kit (Rod + Compound 25kg)",
    "Category": "Earthing",
    "Item Code / SKU": "EARTH-CHEM-ROD",
    "Brand": "Elmet",
    "Model": "EC-17-3M",
    "Unit Price": 2800,
    "Current Stock Qty": 30,
    "Unit": "Set",
    "Min Stock Level": 5,
    "Reorder Level": 10,
    "GST Rate": 18,
    "HSN Code": "8535",
    "Description": "Pure Copper Bonded 3 Meter Earthing Electrode Kit"
  }
];

const ImportStockModal = ({ open, onClose, onSuccess, categories = [] }) => {
  const [file, setFile] = useState(null);
  const [parsedItems, setParsedItems] = useState([]);
  const [validItems, setValidItems] = useState([]);
  const [invalidItems, setInvalidItems] = useState([]);
  const [importing, setImporting] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Generate and download Sample CSV Template
  const handleDownloadSample = () => {
    const ws = XLSX.utils.json_to_sheet(SAMPLE_CSV_ROWS, { header: SAMPLE_CSV_HEADERS });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock_Import_Template");
    XLSX.writeFile(wb, "Solar_Stock_Import_Template.csv");
    toast.success("Sample CSV template downloaded!");
  };

  // Helper function to normalize key names from CSV header
  const normalizeKey = (key) => {
    const k = String(key || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    if (k.includes("itemname") || k.includes("productname") || k.includes("title") || k === "name") return "name";
    if (k.includes("category")) return "category";
    if (k.includes("itemcode") || k.includes("sku") || k === "code") return "item_code";
    if (k.includes("brand") || k.includes("make")) return "brand";
    if (k.includes("model")) return "model";
    if (k.includes("unitprice") || k.includes("price") || k.includes("cost") || k.includes("rate")) return "unit_price";
    if (k.includes("currentstock") || k.includes("qty") || k.includes("quantity") || k.includes("stock")) return "current_stock";
    if (k === "unit") return "unit";
    if (k.includes("minstock") || k.includes("minlevel")) return "min_stock_level";
    if (k.includes("reorder") || k.includes("reorderlevel")) return "reorder_level";
    if (k.includes("gstrate") || k.includes("gst")) return "gst_rate";
    if (k.includes("hsn") || k.includes("hsncode")) return "hsn_code";
    if (k.includes("description") || k.includes("remarks") || k.includes("notes")) return "description";
    return key;
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    // File size limit: 10MB
    const maxSizeBytes = 10 * 1024 * 1024;
    if (uploadedFile.size > maxSizeBytes) {
      const sizeInMb = (uploadedFile.size / (1024 * 1024)).toFixed(1);
      const msg = `File size too large (${sizeInMb} MB)! Maximum allowed CSV/Excel size is 10MB.`;
      setUploadError(msg);
      toast.error(msg, { duration: 5000 });
      e.target.value = "";
      return;
    }

    setUploadError(null);
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (!rawJson || rawJson.length === 0) {
          setUploadError("Uploaded file is empty or missing data rows.");
          return;
        }

        const formattedRows = rawJson.map((row, idx) => {
          const mappedRow = {};
          Object.keys(row).forEach((colHeader) => {
            const normKey = normalizeKey(colHeader);
            mappedRow[normKey] = row[colHeader];
          });

          // Check validation errors
          const rowNum = idx + 2;
          const errors = [];
          if (!mappedRow.name || !String(mappedRow.name).trim()) {
            errors.push("Missing Item Name");
          }

          const parsedPrice = parseFloat(mappedRow.unit_price);
          if (mappedRow.unit_price !== "" && isNaN(parsedPrice)) {
            errors.push("Invalid Unit Price");
          }

          const parsedStock = parseInt(mappedRow.current_stock, 10);
          if (mappedRow.current_stock !== "" && isNaN(parsedStock)) {
            errors.push("Invalid Stock Qty");
          }

          return {
            rowNum,
            original: row,
            mapped: mappedRow,
            isValid: errors.length === 0,
            errorMessages: errors,
          };
        });

        setParsedItems(formattedRows);
        setValidItems(formattedRows.filter((r) => r.isValid).map((r) => r.mapped));
        setInvalidItems(formattedRows.filter((r) => !r.isValid));
      } catch (err) {
        console.error("Error parsing file:", err);
        setUploadError("Could not parse file. Please upload a valid CSV or Excel file.");
      }
    };

    reader.readAsBinaryString(uploadedFile);
  };

  const handleImportSubmit = async () => {
    if (validItems.length === 0) {
      toast.error("No valid stock items to import.");
      return;
    }

    setImporting(true);
    try {
      const res = await bulkImportStockItems(validItems);
      toast.success(res.message || `Successfully imported ${res.data?.successCount} stock items!`);
      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to bulk import stock items.");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedItems([]);
    setValidItems([]);
    setInvalidItems([]);
    setUploadError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
            <FileUploadIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="h6" sx={{ fontSize: "1.05rem", fontWeight: 700, color: COLORS.textPrimary, fontFamily: "'Outfit', sans-serif" }}>
            Import Stock Items from CSV / Excel
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
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

      <DialogContent sx={{ p: 3, backgroundColor: "#FAFBFC", flex: 1, overflowY: "auto" }}>
        <Stack spacing={2.5}>
          
          {/* Top Instruction Banner & Sample CSV Download */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: "12px",
              border: `1px dashed ${COLORS.secondary}`,
              bgcolor: "#FFFBEB",
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { sm: "center" },
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.primary, fontSize: "0.875rem" }}>
                Step 1: Download Sample CSV Template
              </Typography>
              <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block", mt: 0.3 }}>
                Use our pre-formatted template with exact column names (Item Name, Category, SKU, Unit Price, Stock Qty).
              </Typography>
            </Box>

            <Button
              size="small"
              variant="contained"
              startIcon={<DownloadIcon fontSize="small" />}
              onClick={handleDownloadSample}
              sx={{
                bgcolor: COLORS.secondary,
                color: COLORS.primaryDark,
                fontWeight: 700,
                fontSize: "0.8125rem",
                textTransform: "none",
                borderRadius: "8px",
                whiteSpace: "nowrap",
                flexShrink: 0,
                "&:hover": { bgcolor: "#D97706", color: "#FFFFFF" }
              }}
            >
              Download Sample CSV
            </Button>
          </Paper>

          {/* Upload Dropzone */}
          <Paper
            elevation={0}
            component="label"
            sx={{
              p: 3.5,
              borderRadius: "12px",
              border: `2px dashed ${file ? COLORS.primary : COLORS.borderStrong}`,
              bgcolor: file ? COLORS.primarySoft : "#FFFFFF",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": { borderColor: COLORS.primary, bgcolor: COLORS.primarySoft },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <input
              type="file"
              hidden
              accept=".csv, .xlsx, .xls"
              onChange={handleFileUpload}
            />

            <DescriptionIcon sx={{ fontSize: 42, color: file ? COLORS.primary : COLORS.textMuted, mb: 1 }} />

            {file ? (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.primary }}>
                  File Selected: {file.name}
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                  {(file.size / 1024).toFixed(1)} KB — Click or drag to change file
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
                  Step 2: Upload CSV or Excel file
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.textMuted, display: "block", mt: 0.5 }}>
                  Drag and drop file here, or click to browse (.csv, .xlsx, .xls)
                </Typography>
              </Box>
            )}
          </Paper>

          {uploadError && (
            <Alert severity="error" sx={{ borderRadius: "8px", fontSize: "0.8125rem" }}>
              {uploadError}
            </Alert>
          )}

          {/* Parsed Preview Table & Statistics */}
          {parsedItems.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.primary, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                  Step 3: Preview & Validation ({parsedItems.length} Total Rows)
                </Typography>

                <Stack direction="row" spacing={1}>
                  <Chip
                    icon={<CheckCircleIcon fontSize="small" />}
                    label={`${validItems.length} Ready to Import`}
                    size="small"
                    sx={{ bgcolor: COLORS.successSoft, color: COLORS.success, fontWeight: 700, fontSize: "0.72rem" }}
                  />
                  {invalidItems.length > 0 && (
                    <Chip
                      icon={<ErrorIcon fontSize="small" />}
                      label={`${invalidItems.length} Invalid Rows`}
                      size="small"
                      sx={{ bgcolor: COLORS.dangerSoft, color: COLORS.danger, fontWeight: 700, fontSize: "0.72rem" }}
                    />
                  )}
                </Stack>

              </Box>

              <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 280, borderRadius: "10px", border: `1px solid ${COLORS.border}` }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: COLORS.primary, color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Row</TableCell>
                      <TableCell sx={{ bgcolor: COLORS.primary, color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Status</TableCell>
                      <TableCell sx={{ bgcolor: COLORS.primary, color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Item Name</TableCell>
                      <TableCell sx={{ bgcolor: COLORS.primary, color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Category</TableCell>
                      <TableCell sx={{ bgcolor: COLORS.primary, color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>SKU / Code</TableCell>
                      <TableCell sx={{ bgcolor: COLORS.primary, color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Unit Price</TableCell>
                      <TableCell sx={{ bgcolor: COLORS.primary, color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Stock Qty</TableCell>
                      <TableCell sx={{ bgcolor: COLORS.primary, color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Unit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parsedItems.map((item) => (
                      <TableRow key={item.rowNum} hover sx={{ bgcolor: item.isValid ? "inherit" : COLORS.dangerSoft }}>
                        <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600 }}>#{item.rowNum}</TableCell>
                        <TableCell>
                          {item.isValid ? (
                            <Chip label="Valid" size="small" sx={{ bgcolor: COLORS.successSoft, color: COLORS.success, height: 18, fontSize: "0.65rem", fontWeight: 700 }} />
                          ) : (
                            <Chip label={item.errorMessages.join(", ")} size="small" sx={{ bgcolor: COLORS.danger, color: "#FFFFFF", height: 18, fontSize: "0.65rem", fontWeight: 700 }} />
                          )}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{item.mapped.name || "-"}</TableCell>
                        <TableCell sx={{ fontSize: "0.75rem" }}>{item.mapped.category || "Auto-detect"}</TableCell>
                        <TableCell sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>{item.mapped.item_code || "Auto-gen"}</TableCell>
                        <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600 }}>₹{item.mapped.unit_price || "0"}</TableCell>
                        <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600 }}>{item.mapped.current_stock || "0"}</TableCell>
                        <TableCell sx={{ fontSize: "0.75rem" }}>{item.mapped.unit || "Piece"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {importing && <LinearProgress color="warning" sx={{ borderRadius: "4px" }} />}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3, borderTop: `1px solid ${COLORS.border}`, backgroundColor: "#FFFFFF" }}>
        <Button onClick={handleClose} sx={{ color: COLORS.textSecondary, fontWeight: 600, fontSize: "0.8125rem", textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={importing || validItems.length === 0}
          onClick={handleImportSubmit}
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
          {importing ? <CircularProgress size={20} color="inherit" /> : `Import ${validItems.length} Stock Items`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportStockModal;
