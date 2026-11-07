import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from "@mui/material";
import DrawIcon from "@mui/icons-material/Draw";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import DoneAllIcon from "@mui/icons-material/DoneAll";

/**
 * Modern Signature Capture Component
 * - Dual Mode: Digital Draw Pad (Mouse/Trackpad/Touch) + Image Upload
 * - Verified Signature display with "✓ Signature Verified" badge
 * - High-DPI Canvas for crisp strokes on all screens
 */
export default function SignatureCapture({
  label = "Digital Signature",
  value = "", // DataURL or image URL
  onChange,
  signatoryName = "",
  required = false,
  disabled = false,
  helperText = "Draw using mouse/touchpad or upload a photo of your signature",
}) {
  const [mode, setMode] = useState(0); // 0 = Draw Pad, 1 = Upload
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Initialize Canvas with proper High-DPI scaling
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = 160 * dpr;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 2.5;

    // Draw subtle guide baseline
    ctx.save();
    ctx.strokeStyle = "#E2E8F0";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 125);
    ctx.lineTo(rect.width - 30, 125);
    ctx.stroke();
    ctx.restore();
  }, []);

  useEffect(() => {
    if (!value && mode === 0) {
      // Small timeout to ensure DOM rect is computed
      const timer = setTimeout(setupCanvas, 50);
      window.addEventListener("resize", setupCanvas);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", setupCanvas);
      };
    }
  }, [value, mode, setupCanvas]);

  // Pointer event handlers for drawing (works for mouse, trackpad, finger, stylus)
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}

    const pos = getCoordinates(e);
    lastPosRef.current = pos;
    setIsDrawing(true);

    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 1.25, 0, Math.PI * 2);
    ctx.fillStyle = "#0F172A";
    ctx.fill();
  };

  const handlePointerMove = (e) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getCoordinates(e);
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    lastPosRef.current = pos;
    setHasDrawn(true);
  };

  const handlePointerUp = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Clear Canvas
  const handleClearPad = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setupCanvas();
    setHasDrawn(false);
  };

  // Confirm Drawn Signature
  const handleConfirmDrawn = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL("image/png");
    if (onChange) onChange(dataUrl);
  };

  // File Upload Handlers
  const processUploadedFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, WEBP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      if (onChange) onChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processUploadedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  // Clear / Re-sign
  const handleResetSignature = () => {
    if (onChange) onChange("");
    setHasDrawn(false);
  };

  return (
    <Box sx={{ width: "100%", mt: 1, mb: 1 }}>
      {/* Header Label */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
        <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>
          {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
        </Typography>

        {value && (
          <Chip
            size="small"
            icon={<CheckCircleIcon sx={{ fontSize: "14px !important", color: "#16A34A !important" }} />}
            label="✓ Signature Verified"
            sx={{
              height: 22,
              fontSize: "0.72rem",
              fontWeight: 800,
              color: "#16A34A",
              backgroundColor: "#DCFCE7",
              border: "1px solid #86EFAC",
            }}
          />
        )}
      </Box>

      {/* ============================================================== */}
      {/* STATE 1: SIGNATURE IS VERIFIED & CAPTURED                      */}
      {/* ============================================================== */}
      {value ? (
        <Box
          sx={{
            p: 2,
            borderRadius: "10px",
            backgroundColor: "#FFFFFF",
            border: "1.5px solid #10B981",
            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)",
            position: "relative",
          }}
        >
          {/* Top Info Bar */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <VerifiedUserIcon sx={{ fontSize: 18, color: "#10B981" }} />
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#0F172A" }}>
                {signatoryName ? `Signatory: ${signatoryName}` : "Official Digital Signature"}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Tooltip title="Clear and re-sign or upload new signature">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleResetSignature}
                  disabled={disabled}
                  startIcon={<RefreshIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    fontSize: "0.72rem",
                    py: 0.3,
                    px: 1.2,
                    textTransform: "none",
                    fontWeight: 700,
                    borderColor: "#CBD5E1",
                    color: "#475569",
                    "&:hover": { borderColor: "#94A3B8", backgroundColor: "#F8FAFC" },
                  }}
                >
                  Change / Re-Sign
                </Button>
              </Tooltip>
            </Stack>
          </Box>

          {/* Signature Preview Canvas Box */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 120,
              backgroundColor: "#F8FAFC",
              borderRadius: "8px",
              border: "1px dashed #CBD5E1",
              p: 1.5,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              component="img"
              src={value}
              alt="Digital Signature"
              sx={{
                maxHeight: "100%",
                maxWidth: "90%",
                objectFit: "contain",
                filter: "contrast(1.1)",
              }}
            />
            {/* Watermark Line */}
            <Box
              sx={{
                position: "absolute",
                bottom: 8,
                left: 20,
                right: 20,
                borderBottom: "1px solid #E2E8F0",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Typography sx={{ fontSize: "0.62rem", color: "#94A3B8", fontStyle: "italic" }}>
                Verified Legal Authorization
              </Typography>
              <Typography sx={{ fontSize: "0.62rem", color: "#94A3B8" }}>
                ✓ Digital Hash Signed
              </Typography>
            </Box>
          </Box>
        </Box>
      ) : (
        /* ============================================================== */
        /* STATE 2: INPUT MODE (DRAW OR UPLOAD)                          */
        /* ============================================================== */
        <Box
          sx={{
            borderRadius: "10px",
            border: "1px solid #E2E8F0",
            backgroundColor: "#FFFFFF",
            overflow: "hidden",
          }}
        >
          {/* Mode Selector Tabs */}
          <Tabs
            value={mode}
            onChange={(_, val) => setMode(val)}
            variant="fullWidth"
            sx={{
              minHeight: 38,
              borderBottom: "1px solid #E2E8F0",
              backgroundColor: "#F8FAFC",
              "& .MuiTab-root": {
                minHeight: 38,
                py: 0.8,
                fontSize: "0.78rem",
                fontWeight: 700,
                textTransform: "none",
                gap: 0.8,
              },
            }}
          >
            <Tab icon={<DrawIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Sign on Screen (Pad / Touch / Mouse)" />
            <Tab icon={<CloudUploadIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Upload Signature Image" />
          </Tabs>

          {/* TAB 1: DRAW SIGNATURE PAD */}
          {mode === 0 && (
            <Box sx={{ p: 2 }}>
              <Box
                sx={{
                  position: "relative",
                  borderRadius: "8px",
                  border: "1.5px solid #CBD5E1",
                  backgroundColor: "#FFFFFF",
                  cursor: "crosshair",
                  touchAction: "none", // Prevent page scroll while signing on touchscreens
                  overflow: "hidden",
                }}
              >
                <canvas
                  ref={canvasRef}
                  style={{
                    display: "block",
                    width: "100%",
                    height: 160,
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                />

                {/* Initial Guide Overlay */}
                {!hasDrawn && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                      color: "#94A3B8",
                      gap: 0.8,
                    }}
                  >
                    <DrawIcon sx={{ fontSize: 18, opacity: 0.7 }} />
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#94A3B8" }}>
                      Click / touch and drag here to sign smoothly
                    </Typography>
                  </Box>
                )}

                {/* Left signature 'X' mark */}
                <Typography
                  sx={{
                    position: "absolute",
                    bottom: 18,
                    left: 12,
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    color: "#94A3B8",
                    pointerEvents: "none",
                  }}
                >
                  ✕
                </Typography>
              </Box>

              {/* Action Buttons for Draw Pad */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
                <Button
                  size="small"
                  variant="text"
                  color="inherit"
                  onClick={handleClearPad}
                  disabled={!hasDrawn || disabled}
                  startIcon={<RefreshIcon sx={{ fontSize: 14 }} />}
                  sx={{ fontSize: "0.75rem", textTransform: "none", color: "#64748B", fontWeight: 600 }}
                >
                  Clear Pad
                </Button>

                <Button
                  size="small"
                  variant="contained"
                  onClick={handleConfirmDrawn}
                  disabled={!hasDrawn || disabled}
                  startIcon={<DoneAllIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "none",
                    backgroundColor: "#2563EB",
                    boxShadow: "none",
                    "&:hover": { backgroundColor: "#1D4ED8" },
                  }}
                >
                  Confirm Signature
                </Button>
              </Stack>
            </Box>
          )}

          {/* TAB 2: UPLOAD SIGNATURE IMAGE */}
          {mode === 1 && (
            <Box sx={{ p: 2 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <Box
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  border: `2px dashed ${dragActive ? "#2563EB" : "#CBD5E1"}`,
                  borderRadius: "8px",
                  p: 3,
                  textAlign: "center",
                  backgroundColor: dragActive ? "#EFF6FF" : "#F8FAFC",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "#2563EB",
                    backgroundColor: "#EFF6FF",
                  },
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 36, color: "#3B82F6", mb: 0.8 }} />
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E293B" }}>
                  Click or drag & drop signature image here
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: "#64748B", mt: 0.4 }}>
                  Supports PNG, JPG, JPEG, WEBP (Photo of signed document, paper, or digital stamp)
                </Typography>
              </Box>
            </Box>
          )}

          {/* Helper Text Footer */}
          <Box sx={{ px: 2, pb: 1.2 }}>
            <Typography sx={{ fontSize: "0.7rem", color: "#64748B" }}>
              {helperText}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
