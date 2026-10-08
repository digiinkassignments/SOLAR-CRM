import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, IconButton, TextField,
  InputAdornment, Chip, Avatar, CircularProgress,
  Fade, Slide, Stack, Paper, Divider, Tooltip, Collapse,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert
} from "@mui/material";

// Material UI Icons (NO Emojis)
import CloseIcon from "@mui/icons-material/Close";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import ElectricMeterIcon from "@mui/icons-material/ElectricMeter";
import CableIcon from "@mui/icons-material/Cable";
import BoltIcon from "@mui/icons-material/Bolt";
import ArchitectureIcon from "@mui/icons-material/Architecture";
import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import BuildIcon from "@mui/icons-material/Build";
import InsightsIcon from "@mui/icons-material/Insights";
import FlipCameraIosIcon from "@mui/icons-material/FlipCameraIos";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import UndoIcon from "@mui/icons-material/Undo";
import HistoryIcon from "@mui/icons-material/History";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import CheckIcon from "@mui/icons-material/Check";
import RefreshIcon from "@mui/icons-material/Refresh";

import { BrowserMultiFormatReader } from "@zxing/browser";
import toast from "react-hot-toast";

import {
  quickStockInByBarcode,
  createStockTransaction,
  getStockItemByBarcode
} from "../../../services/stockService";

/* ============================================================
   DESIGN TOKENS (Matching StockList, StockItemModal, StockInModal)
   ============================================================ */
const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  primarySoft: "#F1F5F9",
  secondary: "#F59E0B",
  secondaryDark: "#D97706",
  secondarySoft: "#FEF3C7",
  bg: "#FAFBFC",
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

const getCategoryIcon = (slug) => {
  switch (slug) {
    case "solar-panels": return <SolarPowerIcon fontSize="small" />;
    case "inverters": return <ElectricMeterIcon fontSize="small" />;
    case "mounting-structure": return <ArchitectureIcon fontSize="small" />;
    case "dc-cables": case "ac-cables": return <CableIcon fontSize="small" />;
    case "earthing": return <BoltIcon fontSize="small" />;
    case "battery": return <BatteryChargingFullIcon fontSize="small" />;
    case "tools": return <BuildIcon fontSize="small" />;
    default: return <InsightsIcon fontSize="small" />;
  }
};

const cornerBox = (pos) => ({
  position: "absolute",
  width: 20,
  height: 20,
  borderColor: COLORS.secondary,
  borderStyle: "solid",
  borderWidth: 0,
  ...pos,
});

const scanLineStyle = {
  position: "absolute",
  left: "8%",
  right: "8%",
  height: "2px",
  background: "linear-gradient(90deg, transparent, #F59E0B, #FBBF24, #F59E0B, transparent)",
  borderRadius: "2px",
  boxShadow: "0 0 12px 3px rgba(245, 158, 11, 0.75)",
  animation: "laserScan 2.2s ease-in-out infinite",
  zIndex: 10,
};

const BarcodeScannerModal = ({
  open,
  onClose,
  onSuccess,
  onStockIn,
  onStockOut,
  onAddNewWithBarcode,
  items: preloadedItems = []
}) => {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const scanControlsRef = useRef(null);
  const manualInputRef = useRef(null);
  const cooldownRef = useRef(false);

  // Modes: 'camera' | 'manual'
  const [mode, setMode] = useState("camera");

  // Camera state
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceIdx, setSelectedDeviceIdx] = useState(0);

  // Scan Quantity
  const [scanQty, setScanQty] = useState(1);

  // Manual Input State
  const [manualCode, setManualCode] = useState("");
  const [manualQty, setManualQty] = useState(1);
  const [manualVendor, setManualVendor] = useState("");
  const [manualInvoice, setManualInvoice] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Results State
  const [submitting, setSubmitting] = useState(false);
  const [lastScannedResult, setLastScannedResult] = useState(null);
  const [notFoundCode, setNotFoundCode] = useState(null);

  // Session Logs
  const [sessionLogs, setSessionLogs] = useState([]);
  const [showSessionLogs, setShowSessionLogs] = useState(false);

  // Inject keyframe style for scanner laser
  useEffect(() => {
    const id = "solar-crm-barcode-laser-anim";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.innerHTML = `
        @keyframes laserScan {
          0% { top: 14%; opacity: 0.5; }
          50% { top: 84%; opacity: 1; }
          100% { top: 14%; opacity: 0.5; }
        }
      `;
      document.head.appendChild(el);
    }
  }, []);

  // Beep Sound
  const playBeep = (isSuccess = true) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isSuccess ? "sine" : "sawtooth";
      osc.frequency.setValueAtTime(isSuccess ? 880 : 300, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (isSuccess ? 0.16 : 0.28));
    } catch (_) {}
  };

  // Stock In Execution
  const executeStockAdd = useCallback(
    async ({ code, qty = 1, vendor = "", invoice = "", notes = "" }) => {
      const cleanCode = String(code || "").trim();
      if (!cleanCode) {
        toast.error("Please provide a barcode or QR code.");
        return;
      }

      setSubmitting(true);
      setNotFoundCode(null);

      try {
        const response = await quickStockInByBarcode({
          code: cleanCode,
          quantity: Number(qty) || 1,
          vendor_name: vendor || undefined,
          vendor_invoice: invoice || undefined,
          notes: notes || undefined,
        });

        if (response.success && response.data) {
          const { item, quantity, previous_stock, new_stock, transaction } = response.data;
          playBeep(true);

          const resultPayload = {
            item,
            quantityAdded: quantity,
            previousStock: previous_stock,
            newStock: new_stock,
            transactionNumber: transaction?.transaction_number,
            timestamp: new Date().toLocaleTimeString(),
            scannedCode: cleanCode,
          };

          setLastScannedResult(resultPayload);
          setSessionLogs((prev) => [resultPayload, ...prev]);

          toast.success(`Stock Added: +${quantity} ${item.unit || "unit"} to ${item.name}`);

          setManualCode("");
          setManualQty(1);

          onSuccess?.();
        } else {
          playBeep(false);
          setNotFoundCode(cleanCode);
          setLastScannedResult(null);
          toast.error(`Code "${cleanCode}" not found in inventory.`);
        }
      } catch (err) {
        console.error("executeStockAdd error:", err);
        playBeep(false);
        const errResp = err.response?.data;
        if (errResp?.notFound) {
          setNotFoundCode(cleanCode);
          setLastScannedResult(null);
          toast.error(`Item not found for code "${cleanCode}".`);
        } else {
          toast.error(errResp?.message || "Failed to add stock.");
        }
      } finally {
        setSubmitting(false);
      }
    },
    [onSuccess]
  );

  // Stop camera tracks cleanly
  const stopScanner = useCallback(() => {
    if (scanControlsRef.current) {
      try {
        scanControlsRef.current.stop();
      } catch (_) {}
      scanControlsRef.current = null;
    }
    setScanning(false);
  }, []);

  // Start camera scanner
  const startScanner = useCallback(async () => {
    if (!open || mode !== "camera") return;

    if (!videoRef.current) {
      setTimeout(() => {
        if (open && mode === "camera") startScanner();
      }, 150);
      return;
    }

    setScanning(true);
    setCameraError(null);

    try {
      const allDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      setDevices(allDevices);

      if (allDevices.length === 0) {
        setCameraError("No camera detected on this system. Please use the Manual Barcode tab.");
        setScanning(false);
        return;
      }

      const deviceId = allDevices[selectedDeviceIdx]?.deviceId || allDevices[0]?.deviceId;
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      const controls = await codeReader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result) => {
          if (result && !cooldownRef.current) {
            const rawText = result.getText();
            if (rawText && rawText.trim()) {
              cooldownRef.current = true;
              executeStockAdd({ code: rawText.trim(), qty: scanQty });
              setTimeout(() => {
                cooldownRef.current = false;
              }, 2500);
            }
          }
        }
      );

      scanControlsRef.current = controls;
    } catch (err) {
      console.error("Camera start error:", err);
      setCameraError("Camera access denied or unavailable. Please switch to the Manual Barcode tab.");
      setScanning(false);
    }
  }, [open, mode, selectedDeviceIdx, scanQty, executeStockAdd]);

  // Switch camera front/back
  const switchCamera = useCallback(() => {
    stopScanner();
    setTimeout(() => {
      setSelectedDeviceIdx((prev) => (prev + 1) % Math.max(devices.length, 1));
    }, 250);
  }, [stopScanner, devices.length]);

  // Mode and open effect
  useEffect(() => {
    if (!open) return;
    if (mode === "camera") {
      const timer = setTimeout(() => startScanner(), 100);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
      const timer = setTimeout(() => {
        manualInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open, mode, selectedDeviceIdx]); // eslint-disable-line

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      stopScanner();
      setLastScannedResult(null);
      setNotFoundCode(null);
      setManualCode("");
      setManualQty(1);
      setCameraError(null);
      cooldownRef.current = false;
    }
  }, [open]); // eslint-disable-line

  // Manual submission handler
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      executeStockAdd({
        code: manualCode.trim(),
        qty: manualQty,
        vendor: manualVendor,
        invoice: manualInvoice,
        notes: manualNotes,
      });
    }
  };

  // Quick add extra (+1, +5)
  const handleQuickAddMore = async (item, extraQty) => {
    if (!item) return;
    try {
      await quickStockInByBarcode({
        code: item.barcode || item.item_code,
        quantity: extraQty,
        notes: `Quick Add (+${extraQty}) via Scanner Card`,
      });

      const updatedNewStock = Number(item.current_stock || 0) + extraQty;
      const updatedItem = { ...item, current_stock: updatedNewStock };

      setLastScannedResult((prev) =>
        prev
          ? {
              ...prev,
              item: updatedItem,
              newStock: updatedNewStock,
              quantityAdded: prev.quantityAdded + extraQty,
            }
          : null
      );

      toast.success(`Added +${extraQty} more ${item.unit || "unit"}`);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add quantity");
    }
  };

  // Undo transaction
  const handleUndoTransaction = async (result) => {
    if (!result?.item?.id || !result?.quantityAdded) return;
    try {
      await createStockTransaction({
        item_id: result.item.id,
        transaction_type: "OUT",
        quantity: result.quantityAdded,
        reference_type: "ADJUSTMENT",
        notes: `Undo Quick Scan IN (${result.scannedCode})`,
      });

      toast.success(`Reverted +${result.quantityAdded} ${result.item.unit || "units"} for ${result.item.name}`);
      setLastScannedResult(null);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to undo transaction");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableEnforceFocus
      disableRestoreFocus
      TransitionComponent={Slide}
      TransitionProps={{ direction: "up" }}
      PaperProps={{
        sx: {
          borderRadius: "16px",
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 20px 48px rgba(15,23,42,0.12)",
        },
      }}
    >
      {/* ── Dialog Header (Matching StockItemModal & StockInModal) ── */}
      <DialogTitle
        component="div"
        sx={{
          backgroundColor: "#FFFFFF",
          py: 2,
          px: 3,
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "8px",
              bgcolor: COLORS.primarySoft,
              color: COLORS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <QrCodeScannerIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: COLORS.textPrimary,
                fontFamily: "'Outfit', sans-serif",
                lineHeight: 1.2,
              }}
            >
              Barcode & QR Scanner
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: COLORS.textSecondary,
                fontSize: "0.72rem",
                fontFamily: "'Inter', sans-serif",
                display: "block",
              }}
            >
              Scan QR code or enter barcode number to add stock
            </Typography>
          </Box>
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

      {/* ── Mode Switcher Bar (Clean Segmented Tabs, NO Emojis) ── */}
      <Box sx={{ px: 3, pt: 2, pb: 1, backgroundColor: COLORS.bg }}>
        <Box
          sx={{
            display: "flex",
            p: 0.5,
            borderRadius: "10px",
            backgroundColor: "#E2E8F0",
            gap: 0.5,
          }}
        >
          <Button
            size="small"
            fullWidth
            startIcon={<CameraAltIcon sx={{ fontSize: 16 }} />}
            onClick={() => setMode("camera")}
            sx={{
              height: 34,
              borderRadius: "7px",
              textTransform: "none",
              fontSize: "0.8125rem",
              fontWeight: mode === "camera" ? 700 : 500,
              fontFamily: "'Inter', sans-serif",
              backgroundColor: mode === "camera" ? COLORS.primary : "transparent",
              color: mode === "camera" ? "#FFFFFF" : COLORS.textSecondary,
              boxShadow: mode === "camera" ? "0 1px 3px rgba(15,23,42,0.14)" : "none",
              "&:hover": {
                backgroundColor: mode === "camera" ? COLORS.primaryDark : "rgba(255,255,255,0.5)",
              },
            }}
          >
            Camera Scanner
          </Button>

          <Button
            size="small"
            fullWidth
            startIcon={<KeyboardIcon sx={{ fontSize: 16 }} />}
            onClick={() => setMode("manual")}
            sx={{
              height: 34,
              borderRadius: "7px",
              textTransform: "none",
              fontSize: "0.8125rem",
              fontWeight: mode === "manual" ? 700 : 500,
              fontFamily: "'Inter', sans-serif",
              backgroundColor: mode === "manual" ? COLORS.primary : "transparent",
              color: mode === "manual" ? "#FFFFFF" : COLORS.textSecondary,
              boxShadow: mode === "manual" ? "0 1px 3px rgba(15,23,42,0.14)" : "none",
              "&:hover": {
                backgroundColor: mode === "manual" ? COLORS.primaryDark : "rgba(255,255,255,0.5)",
              },
            }}
          >
            Manual Barcode Entry
          </Button>
        </Box>
      </Box>

      {/* ── Dialog Content ────────────────────────────────────────── */}
      <DialogContent sx={{ p: 3, pt: 1.5, backgroundColor: COLORS.bg, overflowY: "auto", maxHeight: "72vh" }}>
        
        {/* CAMERA MODE */}
        {mode === "camera" && (
          <Box sx={{ mb: 2 }}>
            <Paper
              elevation={0}
              sx={{
                position: "relative",
                borderRadius: "12px",
                overflow: "hidden",
                backgroundColor: "#0B1120",
                aspectRatio: "16 / 10",
                border: `1px solid ${COLORS.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
              }}
            >
              <video
                ref={videoRef}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: cameraError ? "none" : "block",
                }}
                muted
                playsInline
              />

              {/* Viewfinder Overlay with Scanning Guides */}
              {scanning && !cameraError && (
                <>
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, rgba(0,0,0,0.2) 100%)",
                      pointerEvents: "none",
                    }}
                  />
                  <Box sx={{ ...cornerBox({ top: "15%", left: "14%" }), borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 6 }} />
                  <Box sx={{ ...cornerBox({ top: "15%", right: "14%" }), borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 6 }} />
                  <Box sx={{ ...cornerBox({ bottom: "15%", left: "14%" }), borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 6 }} />
                  <Box sx={{ ...cornerBox({ bottom: "15%", right: "14%" }), borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 6 }} />
                  <Box sx={scanLineStyle} />

                  <Typography
                    sx={{
                      position: "absolute",
                      bottom: 12,
                      color: "#FFFFFF",
                      backgroundColor: "rgba(15,23,42,0.72)",
                      backdropFilter: "blur(4px)",
                      px: 1.5,
                      py: 0.4,
                      borderRadius: "6px",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Point camera at QR code or product barcode
                  </Typography>
                </>
              )}

              {/* Camera Error Alert */}
              {cameraError && (
                <Box sx={{ p: 3, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                  <ErrorOutlineIcon sx={{ color: COLORS.warning, fontSize: 36 }} />
                  <Typography sx={{ color: "#FFFFFF", fontSize: "0.85rem", fontWeight: 600 }}>
                    {cameraError}
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => setMode("manual")}
                    sx={{
                      mt: 1,
                      backgroundColor: COLORS.primary,
                      color: "#FFFFFF",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      borderRadius: "8px",
                      textTransform: "none",
                    }}
                  >
                    Switch to Manual Barcode Entry
                  </Button>
                </Box>
              )}

              {/* Flip camera button */}
              {devices.length > 1 && scanning && (
                <IconButton
                  onClick={switchCamera}
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    bgcolor: "rgba(15,23,42,0.75)",
                    color: "#FFFFFF",
                    borderRadius: "8px",
                    "&:hover": { bgcolor: "rgba(15,23,42,0.95)" },
                  }}
                >
                  <FlipCameraIosIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Paper>

            {/* Quantity Selector Bar */}
            <Paper
              elevation={0}
              sx={{
                mt: 1.5,
                p: 1.5,
                borderRadius: "10px",
                border: `1px solid ${COLORS.border}`,
                backgroundColor: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FieldLabel>Quantity per scan:</FieldLabel>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    bgcolor: COLORS.bg,
                    borderRadius: "6px",
                    p: 0.3,
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => setScanQty((q) => Math.max(1, q - 1))}
                    sx={{ width: 24, height: 24, color: COLORS.textPrimary }}
                  >
                    <RemoveIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                  <Typography sx={{ width: 26, textAlign: "center", fontWeight: 700, fontSize: "0.85rem", color: COLORS.primary }}>
                    {scanQty}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setScanQty((q) => q + 1)}
                    sx={{ width: 24, height: 24, color: COLORS.textPrimary }}
                  >
                    <AddIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 0.6 }}>
                {[1, 5, 10, 25].map((preset) => (
                  <Chip
                    key={preset}
                    label={`+${preset}`}
                    size="small"
                    onClick={() => setScanQty(preset)}
                    sx={{
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "0.72rem",
                      height: 24,
                      bgcolor: scanQty === preset ? COLORS.primary : COLORS.bg,
                      color: scanQty === preset ? "#FFFFFF" : COLORS.textSecondary,
                      border: `1px solid ${scanQty === preset ? COLORS.primary : COLORS.border}`,
                      "&:hover": { bgcolor: scanQty === preset ? COLORS.primaryDark : COLORS.border },
                    }}
                  />
                ))}
              </Box>
            </Paper>
          </Box>
        )}

        {/* MANUAL BARCODE NUMBER INPUT MODE */}
        {mode === "manual" && (
          <Paper
            elevation={0}
            component="form"
            onSubmit={handleManualSubmit}
            sx={{
              p: 2.5,
              borderRadius: "12px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: "#FFFFFF",
              mb: 2,
            }}
          >
            <FieldLabel>Barcode Number or SKU Code *</FieldLabel>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                inputRef={manualInputRef}
                autoFocus
                placeholder="Type or scan barcode (e.g. STK-SOL-1001)..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                fullWidth
                size="small"
                autoComplete="off"
                sx={controlSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <QrCodeScannerIcon sx={{ color: COLORS.textSecondary, fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ width: 100 }}>
                <TextField
                  type="number"
                  placeholder="Qty"
                  value={manualQty}
                  onChange={(e) => setManualQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  size="small"
                  inputProps={{ min: 1 }}
                  sx={controlSx}
                />
              </Box>
            </Box>

            {/* Quick Quantity Chips */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 2, flexWrap: "wrap" }}>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted, fontWeight: 600 }}>
                Quick Presets:
              </Typography>
              {[1, 2, 5, 10, 20, 50].map((preset) => (
                <Chip
                  key={preset}
                  label={`+${preset}`}
                  size="small"
                  onClick={() => setManualQty(preset)}
                  sx={{
                    cursor: "pointer",
                    height: 24,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    bgcolor: manualQty === preset ? COLORS.primary : COLORS.bg,
                    color: manualQty === preset ? "#FFFFFF" : COLORS.textSecondary,
                    border: `1px solid ${manualQty === preset ? COLORS.primary : COLORS.border}`,
                  }}
                />
              ))}
            </Box>

            {/* Optional Vendor Details Toggle */}
            <Button
              size="small"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              endIcon={showOptionalFields ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
              sx={{
                color: COLORS.textSecondary,
                fontSize: "0.75rem",
                textTransform: "none",
                fontWeight: 600,
                p: 0,
                mb: showOptionalFields ? 1.5 : 2,
              }}
            >
              {showOptionalFields ? "Hide Purchase Details" : "+ Add Vendor & Invoice Info (Optional)"}
            </Button>

            <Collapse in={showOptionalFields}>
              <Stack spacing={1.5} sx={{ mb: 2 }}>
                <Box>
                  <FieldLabel>Vendor / Supplier Name</FieldLabel>
                  <TextField
                    placeholder="e.g. Waaree Energies Ltd"
                    value={manualVendor}
                    onChange={(e) => setManualVendor(e.target.value)}
                    fullWidth
                    size="small"
                    sx={controlSx}
                  />
                </Box>
                <Box>
                  <FieldLabel>Vendor Invoice Number</FieldLabel>
                  <TextField
                    placeholder="e.g. INV-2026-9081"
                    value={manualInvoice}
                    onChange={(e) => setManualInvoice(e.target.value)}
                    fullWidth
                    size="small"
                    sx={controlSx}
                  />
                </Box>
                <Box>
                  <FieldLabel>Notes / Remarks</FieldLabel>
                  <TextField
                    placeholder="e.g. Received at Main Warehouse"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    sx={controlSx}
                  />
                </Box>
              </Stack>
            </Collapse>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={submitting || !manualCode.trim()}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AddIcon fontSize="small" />}
              sx={{
                height: 38,
                borderRadius: "8px",
                backgroundColor: COLORS.primary,
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: "0.8125rem",
                fontFamily: "'Inter', sans-serif",
                textTransform: "none",
                boxShadow: "0 1px 3px rgba(15,23,42,0.12)",
                "&:hover": { backgroundColor: COLORS.primaryDark },
                "&:disabled": { opacity: 0.5 },
              }}
            >
              {submitting ? "Adding Stock..." : `Record Stock IN (+${manualQty} ${manualQty > 1 ? "Units" : "Unit"})`}
            </Button>
          </Paper>
        )}

        {/* LOADING STATE */}
        {submitting && (
          <Fade in>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, py: 2 }}>
              <CircularProgress sx={{ color: COLORS.primary }} size={22} />
              <Typography sx={{ color: COLORS.textPrimary, fontSize: "0.8125rem", fontWeight: 600 }}>
                Updating stock database...
              </Typography>
            </Box>
          </Fade>
        )}

        {/* NOT FOUND ALERT */}
        {notFoundCode && !submitting && (
          <Fade in>
            <Alert
              severity="warning"
              icon={<ErrorOutlineIcon fontSize="inherit" />}
              sx={{
                borderRadius: "10px",
                mb: 2,
                border: `1px solid ${COLORS.warning}40`,
                backgroundColor: COLORS.warningSoft,
              }}
              action={
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => {
                    onClose();
                    onAddNewWithBarcode?.(notFoundCode);
                  }}
                  sx={{
                    borderRadius: "6px",
                    backgroundColor: COLORS.primary,
                    color: "#FFFFFF",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "none",
                    height: 28,
                    "&:hover": { backgroundColor: COLORS.primaryDark },
                  }}
                >
                  Create Item
                </Button>
              }
            >
              <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, color: COLORS.textPrimary }}>
                Item not found for code: <strong>{notFoundCode}</strong>
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>
                This barcode is not registered in the product catalog yet.
              </Typography>
            </Alert>
          </Fade>
        )}

        {/* SUCCESS TRANSACTION CARD */}
        {lastScannedResult && !submitting && (
          <Fade in>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: `1px solid ${COLORS.success}40`,
                backgroundColor: "#FFFFFF",
                boxShadow: "0 2px 8px rgba(22, 163, 74, 0.08)",
                mb: 2,
              }}
            >
              {/* Green Header Banner */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.2,
                  borderRadius: "8px",
                  bgcolor: COLORS.successSoft,
                  border: `1px solid ${COLORS.success}30`,
                  mb: 1.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckCircleIcon sx={{ color: COLORS.success, fontSize: 18 }} />
                  <Typography sx={{ color: "#14532D", fontWeight: 700, fontSize: "0.8125rem" }}>
                    Added +{lastScannedResult.quantityAdded} {lastScannedResult.item.unit || "unit"} to Stock
                  </Typography>
                </Box>
                <Chip
                  label="Saved in DB"
                  size="small"
                  sx={{ bgcolor: COLORS.success, color: "#FFFFFF", fontWeight: 700, fontSize: "0.68rem", height: 20 }}
                />
              </Box>

              {/* Item Info Row */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <Avatar
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "10px",
                    bgcolor: COLORS.primarySoft,
                    color: COLORS.primary,
                    fontWeight: 700,
                    border: `1px solid ${COLORS.border}`,
                    flexShrink: 0,
                  }}
                >
                  {getCategoryIcon(lastScannedResult.item.category_slug) || lastScannedResult.item.name.charAt(0)}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      color: COLORS.textPrimary,
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      fontFamily: "'Outfit', sans-serif",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {lastScannedResult.item.name}
                  </Typography>
                  <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.72rem" }}>
                    SKU: <strong>{lastScannedResult.item.item_code}</strong> {lastScannedResult.item.brand ? `• ${lastScannedResult.item.brand}` : ""}
                  </Typography>
                </Box>
              </Box>

              {/* Stock Before / After Pill */}
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: "8px",
                  bgcolor: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-around",
                  mb: 1.5,
                }}
              >
                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase" }}>
                    Previous Stock
                  </Typography>
                  <Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: COLORS.textSecondary }}>
                    {lastScannedResult.previousStock} {lastScannedResult.item.unit || "pcs"}
                  </Typography>
                </Box>

                <ArrowForwardIcon sx={{ color: COLORS.textMuted, fontSize: 16 }} />

                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: "0.68rem", color: COLORS.success, fontWeight: 700, textTransform: "uppercase" }}>
                    Current Stock
                  </Typography>
                  <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: COLORS.success }}>
                    {lastScannedResult.newStock} {lastScannedResult.item.unit || "pcs"}
                  </Typography>
                </Box>
              </Box>

              {/* Card Actions */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                <Box sx={{ display: "flex", gap: 0.8 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                    onClick={() => handleQuickAddMore(lastScannedResult.item, 1)}
                    sx={{
                      borderRadius: "6px",
                      borderColor: COLORS.border,
                      color: COLORS.textPrimary,
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      textTransform: "none",
                      height: 30,
                    }}
                  >
                    +1 More
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                    onClick={() => handleQuickAddMore(lastScannedResult.item, 5)}
                    sx={{
                      borderRadius: "6px",
                      borderColor: COLORS.border,
                      color: COLORS.textPrimary,
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      textTransform: "none",
                      height: 30,
                    }}
                  >
                    +5 More
                  </Button>
                </Box>

                <Button
                  size="small"
                  variant="text"
                  startIcon={<UndoIcon sx={{ fontSize: 14 }} />}
                  onClick={() => handleUndoTransaction(lastScannedResult)}
                  sx={{
                    color: COLORS.danger,
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    textTransform: "none",
                    height: 30,
                    "&:hover": { bgcolor: COLORS.dangerSoft },
                  }}
                >
                  Undo
                </Button>
              </Box>
            </Paper>
          </Fade>
        )}

        {/* SESSION ACTIVITY LOG (Collapsible Table) */}
        {sessionLogs.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <Button
              size="small"
              onClick={() => setShowSessionLogs(!showSessionLogs)}
              startIcon={<HistoryIcon sx={{ fontSize: 16 }} />}
              endIcon={showSessionLogs ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
              sx={{
                color: COLORS.textSecondary,
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "none",
                p: 0,
                mb: 1,
              }}
            >
              Recent Scans in this Session ({sessionLogs.length} items)
            </Button>

            <Collapse in={showSessionLogs}>
              <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", maxHeight: 180 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: COLORS.bg }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>Item</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>Code</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>Qty</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessionLogs.map((log, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600 }}>{log.item.name}</TableCell>
                        <TableCell sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>{log.scannedCode}</TableCell>
                        <TableCell sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.success }}>
                          +{log.quantityAdded}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>{log.timestamp}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Collapse>
          </Box>
        )}
      </DialogContent>

      {/* ── Dialog Actions (Matching StockItemModal) ── */}
      <DialogActions sx={{ p: 2, px: 3, borderTop: `1px solid ${COLORS.border}`, backgroundColor: "#FFFFFF", justifyContent: "space-between" }}>
        <Typography variant="caption" sx={{ color: COLORS.textMuted, fontSize: "0.72rem" }}>
          Solar CRM Stock Inward Engine
        </Typography>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            height: 36,
            px: 3,
            borderRadius: "8px",
            backgroundColor: COLORS.primary,
            color: "#FFFFFF",
            fontWeight: 600,
            fontSize: "0.8125rem",
            textTransform: "none",
            boxShadow: "0 1px 3px rgba(15,23,42,0.12)",
            "&:hover": { backgroundColor: COLORS.primaryDark },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BarcodeScannerModal;
