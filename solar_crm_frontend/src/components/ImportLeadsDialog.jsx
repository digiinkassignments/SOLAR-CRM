import React, { useState, useCallback } from "react";
import * as XLSX from "xlsx";

import {
  Box,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Paper,
  Stack,
  Divider,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

import { getLeads, bulkImportLeads } from "../services/leadService";

const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  primarySoft: "#E6F0FA",
  accent: "#F59E0B",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
};

const customScrollbarSx = {
  "&::-webkit-scrollbar": {
    width: "6px",
    height: "6px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "#F1F5F9",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "#94A3B8",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    backgroundColor: COLORS.primary,
  },
};

const SOLAR_REQUIREMENT_OPTIONS = ["Residential", "Commercial"];
const LEAD_SOURCE_OPTIONS = ["Website", "Call", "WhatsApp", "Reference", "Facebook", "Google", "Cold Call", "Direct", "Other"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];
const INTEREST_OPTIONS = ["Pending", "Interested", "Not Interested"];

const SAMPLE_HEADERS = [
  "customer_name", "mobile_number", "alternate_number", "email", "address",
  "city", "state", "pincode", "solar_requirement", "interest_status",
  "required_kw", "lead_source", "priority", "remark",
];
const SAMPLE_ROW = [
  "Ramesh Kumar", "9876543210", "9876543211", "ramesh@example.com", "123 MG Road",
  "Jaipur", "Rajasthan", "302001", "Residential", "Interested",
  "5", "Website", "Medium", "Interested in rooftop solar",
];

const getFieldValue = (row, key, altKey) => {
  const val = row[key] ?? row[altKey] ?? row[key?.replace(/_/g, " ")] ?? "";
  return typeof val === "string" ? val.trim() : val;
};

const validateRow = (row, existingMobiles) => {
  const errors = [];

  const customer_name = String(getFieldValue(row, "customer_name", "Customer Name") || "");
  const mobile_number = String(getFieldValue(row, "mobile_number", "Mobile Number") || "").replace(/\D/g, "").slice(0, 10);
  const alternate_number = String(getFieldValue(row, "alternate_number", "Alternate Number") || "").replace(/\D/g, "").slice(0, 10);
  const email = String(getFieldValue(row, "email", "Email") || "");
  const address = String(getFieldValue(row, "address", "Address") || "");
  const city = String(getFieldValue(row, "city", "City") || "");
  const state = String(getFieldValue(row, "state", "State") || "");
  const pincode = String(getFieldValue(row, "pincode", "Pincode") || "");
  const solar_requirement = String(getFieldValue(row, "solar_requirement", "Solar Requirement") || "Residential");
  const interest_status = String(getFieldValue(row, "interest_status", "Interest Status") || "Pending");
  const required_kw = getFieldValue(row, "required_kw", "Required kW");
  const lead_source = String(getFieldValue(row, "lead_source", "Lead Source") || "Other");
  const priority = String(getFieldValue(row, "priority", "Priority") || "Medium");
  const remark = String(getFieldValue(row, "remark", "Remark") || "");

  if (!customer_name) errors.push("Customer name is required");
  if (!mobile_number || mobile_number.length !== 10) errors.push("Invalid or missing 10-digit mobile number");

  const isDuplicate = mobile_number.length === 10 && existingMobiles.has(mobile_number);

  return {
    customer_name, mobile_number, alternate_number, email, address, city, state, pincode,
    solar_requirement, interest_status, required_kw, lead_source, priority, remark,
    _status: errors.length > 0 ? "invalid" : isDuplicate ? "duplicate" : "valid",
    _errors: errors,
  };
};

const StatusChip = ({ status }) => {
  if (status === "valid") {
    return <Chip icon={<CheckCircleOutlineIcon sx={{ fontSize: "0.85rem !important" }} />} label="Valid" size="small" sx={{ backgroundColor: COLORS.successSoft, color: COLORS.success, fontWeight: 700, fontSize: "0.68rem", height: 22 }} />;
  }
  if (status === "duplicate") {
    return <Chip icon={<WarningAmberIcon sx={{ fontSize: "0.85rem !important" }} />} label="Duplicate" size="small" sx={{ backgroundColor: COLORS.warningSoft, color: COLORS.warning, fontWeight: 700, fontSize: "0.68rem", height: 22 }} />;
  }
  return <Chip icon={<ErrorOutlineIcon sx={{ fontSize: "0.85rem !important" }} />} label="Invalid" size="small" sx={{ backgroundColor: COLORS.dangerSoft, color: COLORS.danger, fontWeight: 700, fontSize: "0.68rem", height: 22 }} />;
};

const ImportLeadsDialog = ({ open, onClose, onImportComplete, showSnackbar }) => {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState([]);
  const [includeDuplicates, setIncludeDuplicates] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const resetState = useCallback(() => {
    setStep(1);
    setFileName("");
    setRows([]);
    setIncludeDuplicates(false);
    setImportResult(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const handleDownloadSample = useCallback(() => {
    const csv = [SAMPLE_HEADERS.join(","), SAMPLE_ROW.join(",")].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setFileName(file.name);
    setParsing(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (json.length === 0) {
        showSnackbar?.("The file appears to be empty.", "error");
        setParsing(false);
        return;
      }

      let existingMobiles = new Set();
      try {
        const res = await getLeads({ page: 1, limit: 5000 });
        if (res?.success) {
          existingMobiles = new Set((res.data || []).map((l) => String(l.mobile_number || "").trim()));
        }
      } catch (err) {}

      const validated = json.map((row) => validateRow(row, existingMobiles));
      setRows(validated);
      setStep(2);
    } catch (err) {
      console.error(err);
      showSnackbar?.("Failed to read the file. Please check format.", "error");
    } finally {
      setParsing(false);
    }
  }, [showSnackbar]);

  const validCount = rows.filter((r) => r._status === "valid").length;
  const duplicateCount = rows.filter((r) => r._status === "duplicate").length;
  const invalidCount = rows.filter((r) => r._status === "invalid").length;
  const importableCount = includeDuplicates ? validCount + duplicateCount : validCount;

  const handleImport = useCallback(async () => {
    const toImport = rows.filter((r) => r._status === "valid" || (includeDuplicates && r._status === "duplicate"));
    if (toImport.length === 0) return;

    setImporting(true);
    try {
      const payload = toImport.map(({ _status, _errors, ...rest }) => rest);
      const res = await bulkImportLeads(payload);
      if (res?.success) {
        setImportResult(res.data);
        setStep(3);
        onImportComplete?.();
      } else {
        showSnackbar?.(res?.message || "Import failed.", "error");
      }
    } catch (err) {
      console.error(err);
      showSnackbar?.(err.response?.data?.message || "Import failed. Please try again.", "error");
    } finally {
      setImporting(false);
    }
  }, [rows, includeDuplicates, onImportComplete, showSnackbar]);

  return (
    <Dialog
      open={open}
      onClose={importing ? undefined : handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          maxHeight: "88vh",
          overflow: "hidden",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 2,
          backgroundColor: COLORS.primary,
          color: "#FFFFFF",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <UploadFileIcon sx={{ color: COLORS.accent, fontSize: "1.3rem" }} />
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.98rem", color: "#FFFFFF" }}>
              Bulk Import Solar Leads
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.7)" }}>
              {step === 1 && "Step 1 of 3 — Select CSV or Excel File"}
              {step === 2 && "Step 2 of 3 — Review Validation & Confirm"}
              {step === 3 && "Step 3 of 3 — Import Summary"}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} disabled={importing} sx={{ color: "#FFFFFF", opacity: 0.8, "&:hover": { opacity: 1 } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 0, ...customScrollbarSx }}>
        {/* STEP 1: UPLOAD ZONE */}
        {step === 1 && (
          <Box sx={{ p: 3.5, display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5 }}>
            <Box
              sx={{
                width: "100%",
                border: `2px dashed ${COLORS.borderStrong}`,
                borderRadius: "14px",
                py: 5,
                px: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1.5,
                backgroundColor: "#FAFBFC",
                transition: "all 0.2s ease-in-out",
                "&:hover": { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
              }}
            >
              <CloudUploadOutlinedIcon sx={{ fontSize: 52, color: COLORS.primary }} />
              <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: COLORS.textPrimary }}>
                {parsing ? "Parsing spreadsheet..." : "Drag and drop or browse CSV/Excel file"}
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                Supported file formats: .csv, .xlsx, .xls (Up to 5,000 rows)
              </Typography>

              <Button
                component="label"
                variant="contained"
                disabled={parsing}
                startIcon={parsing ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon sx={{ fontSize: 16 }} />}
                sx={{
                  mt: 1,
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: "8px",
                  px: 3,
                  py: 1,
                  fontSize: "0.8rem",
                  backgroundColor: COLORS.primary,
                  "&:hover": { backgroundColor: COLORS.primaryDark },
                }}
              >
                {parsing ? "Processing..." : "Select File"}
                <input type="file" hidden accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
              </Button>

              {fileName && !parsing && (
                <Chip label={`Selected: ${fileName}`} size="small" sx={{ mt: 1, fontWeight: 700, backgroundColor: COLORS.primarySoft, color: COLORS.primary }} />
              )}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                onClick={handleDownloadSample}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.78rem", borderRadius: "8px", borderColor: COLORS.border, color: COLORS.textPrimary }}
              >
                Download CSV Sample Template
              </Button>

              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted, fontStyle: "italic" }}>
                * Mandatory fields: customer_name, mobile_number
              </Typography>
            </Box>
          </Box>
        )}

        {/* STEP 2: VALIDATION TABLE */}
        {step === 2 && (
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Box sx={{ px: 3, py: 1.8, display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap", borderBottom: `1px solid ${COLORS.border}`, backgroundColor: "#F8FAFC" }}>
              <Chip label={`${validCount} Valid`} size="small" sx={{ backgroundColor: COLORS.successSoft, color: COLORS.success, fontWeight: 800, fontSize: "0.7rem" }} />
              <Chip label={`${duplicateCount} Duplicate`} size="small" sx={{ backgroundColor: COLORS.warningSoft, color: COLORS.warning, fontWeight: 800, fontSize: "0.7rem" }} />
              <Chip label={`${invalidCount} Invalid`} size="small" sx={{ backgroundColor: COLORS.dangerSoft, color: COLORS.danger, fontWeight: 800, fontSize: "0.7rem" }} />
              <Box sx={{ flex: 1 }} />
              {duplicateCount > 0 && (
                <FormControlLabel
                  control={<Checkbox size="small" checked={includeDuplicates} onChange={(e) => setIncludeDuplicates(e.target.checked)} />}
                  label={<Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary }}>Import duplicates too</Typography>}
                />
              )}
            </Box>

            <TableContainer sx={{ maxHeight: 380, ...customScrollbarSx }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: "#0F172A", color: "#FFFFFF", fontWeight: 800, fontSize: "0.68rem" }}>#</TableCell>
                    <TableCell sx={{ backgroundColor: "#0F172A", color: "#FFFFFF", fontWeight: 800, fontSize: "0.68rem" }}>Status</TableCell>
                    <TableCell sx={{ backgroundColor: "#0F172A", color: "#FFFFFF", fontWeight: 800, fontSize: "0.68rem" }}>Customer Name</TableCell>
                    <TableCell sx={{ backgroundColor: "#0F172A", color: "#FFFFFF", fontWeight: 800, fontSize: "0.68rem" }}>Mobile Number</TableCell>
                    <TableCell sx={{ backgroundColor: "#0F172A", color: "#FFFFFF", fontWeight: 800, fontSize: "0.68rem" }}>City</TableCell>
                    <TableCell sx={{ backgroundColor: "#0F172A", color: "#FFFFFF", fontWeight: 800, fontSize: "0.68rem" }}>Validation Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={idx} hover sx={{ backgroundColor: row._status === "invalid" ? COLORS.dangerSoft : row._status === "duplicate" ? COLORS.warningSoft : "transparent" }}>
                      <TableCell sx={{ fontSize: "0.75rem", color: COLORS.textMuted }}>{idx + 1}</TableCell>
                      <TableCell><StatusChip status={row._status} /></TableCell>
                      <TableCell sx={{ fontSize: "0.78rem", fontWeight: 700 }}>{row.customer_name || "—"}</TableCell>
                      <TableCell sx={{ fontSize: "0.78rem" }}>{row.mobile_number || "—"}</TableCell>
                      <TableCell sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}>{row.city || "—"}</TableCell>
                      <TableCell sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                        {row._status === "invalid" ? row._errors.join("; ") : row._status === "duplicate" ? "Mobile number already exists" : "Ready"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* STEP 3: SUCCESS RESULT */}
        {step === 3 && importResult && (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Box sx={{ width: 60, height: 60, borderRadius: "16px", backgroundColor: COLORS.successSoft, color: COLORS.success, display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 34 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: COLORS.textPrimary, mb: 0.5 }}>
              Leads Imported Successfully!
            </Typography>
            <Typography sx={{ fontSize: "0.85rem", color: COLORS.textSecondary, mb: 3 }}>
              <strong style={{ color: COLORS.success }}>{importResult.imported}</strong> leads added to your CRM pipeline
              {importResult.failed > 0 && <> · <strong style={{ color: COLORS.danger }}>{importResult.failed}</strong> failed</>}
            </Typography>

            {importResult.errors?.length > 0 && (
              <Box sx={{ textAlign: "left", maxHeight: 200, overflowY: "auto", border: `1px solid ${COLORS.border}`, borderRadius: "10px", p: 1.5, ...customScrollbarSx }}>
                {importResult.errors.map((e, idx) => (
                  <Typography key={idx} sx={{ fontSize: "0.75rem", color: COLORS.danger, mb: 0.5 }}>
                    Row {e.row}: {e.reason}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
        {step === 2 && (
          <Button startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />} onClick={() => { setStep(1); setRows([]); setFileName(""); }} disabled={importing} sx={{ textTransform: "none", fontWeight: 700, color: COLORS.textSecondary }}>
            Back
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        {step !== 3 && (
          <Button onClick={handleClose} disabled={importing} sx={{ textTransform: "none", fontWeight: 700, color: COLORS.textSecondary }}>
            Cancel
          </Button>
        )}
        {step === 2 && (
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={importing || importableCount === 0}
            startIcon={importing ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", px: 3, backgroundColor: COLORS.primary, "&:hover": { backgroundColor: COLORS.primaryDark } }}
          >
            {importing ? "Importing..." : `Import ${importableCount} Lead${importableCount === 1 ? "" : "s"}`}
          </Button>
        )}
        {step === 3 && (
          <Button variant="contained" onClick={handleClose} sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", px: 3, backgroundColor: COLORS.primary, "&:hover": { backgroundColor: COLORS.primaryDark } }}>
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportLeadsDialog;