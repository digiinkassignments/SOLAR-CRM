import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  Stack,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import FlipCameraIosIcon from "@mui/icons-material/FlipCameraIos";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

const COLORS = {
  primary: "#0F172A",
  secondary: "#F59E0B",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
};

export default function DocumentCaptureModal({
  open,
  onClose,
  onCapture,
  documentType,
  documentLabel,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState("environment"); // back camera preferred
  const [loadingCamera, setLoadingCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Start Camera Stream
  const startCamera = async (mode = facingMode) => {
    setLoadingCamera(true);
    setCameraError(null);
    setCapturedImage(null);

    // Stop any existing stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser environment.");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn("getUserMedia failed or denied:", err);
      // Try fallback without facingMode constraints
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err2) {
        setCameraError(
          "Camera access could not be established. You can grant camera permission in your browser or use the file/camera picker below."
        );
      }
    } finally {
      setLoadingCamera(false);
    }
  };

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      // Clean up stream on close
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setCapturedImage(null);
      setCameraError(null);
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [open]);

  // Flip Camera between User / Environment
  const handleFlipCamera = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture Snapshot from Video
  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);

    // Stop video tracks while previewing
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  // Confirm and upload
  const handleConfirm = () => {
    if (!capturedImage) return;

    // Convert dataUrl to Blob / File
    const arr = capturedImage.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    const fileName = `${documentType || "doc"}-capture-${Date.now()}.jpg`;
    const file = new File([blob], fileName, { type: "image/jpeg" });

    onCapture(file, documentType);
    handleClose();
  };

  // Handle fallback file / mobile native capture
  const handleFallbackFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file, documentType);
      handleClose();
    }
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
    setCameraError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "14px",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          px: 2.5,
          py: 1.8,
          backgroundColor: COLORS.primary,
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" alignItems="center" gap={1.2}>
          <PhotoCameraIcon sx={{ color: COLORS.secondary, fontSize: 22 }} />
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#FFFFFF" }}>
              Capture {documentLabel || "KYC Document"}
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "#94A3B8" }}>
              Snap a clear, well-lit photo of the physical document
            </Typography>
          </Box>
        </Stack>
        <IconButton size="small" onClick={handleClose} sx={{ color: "#94A3B8" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2, backgroundColor: "#020617" }}>
        {cameraError ? (
          <Box sx={{ py: 4, px: 2, textAlign: "center" }}>
            <Alert severity="warning" sx={{ mb: 3, textAlign: "left" }}>
              {cameraError}
            </Alert>
            <Button
              component="label"
              variant="contained"
              size="large"
              startIcon={<CloudUploadOutlinedIcon />}
              sx={{
                backgroundColor: COLORS.secondary,
                color: "#FFFFFF",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: "8px",
                px: 3,
                "&:hover": { backgroundColor: "#D97706" },
              }}
            >
              Choose from Gallery / Camera Roll
              <input
                type="file"
                hidden
                accept="image/*"
                capture="environment"
                onChange={handleFallbackFile}
              />
            </Button>
          </Box>
        ) : capturedImage ? (
          // Preview of captured image
          <Box sx={{ position: "relative", width: "100%", textAlign: "center" }}>
            <Box
              component="img"
              src={capturedImage}
              alt="Captured document"
              sx={{
                width: "100%",
                maxHeight: "380px",
                objectFit: "contain",
                borderRadius: "10px",
                border: "2px solid #334155",
              }}
            />
            <Typography sx={{ color: "#94A3B8", fontSize: "0.75rem", mt: 1 }}>
              Review snapshot: ensure text is legible and all 4 corners are visible.
            </Typography>
          </Box>
        ) : (
          // Live Video Viewfinder
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: 360,
              backgroundColor: "#000000",
              borderRadius: "10px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {loadingCamera && (
              <Box sx={{ position: "absolute", zIndex: 10, textAlign: "center" }}>
                <CircularProgress sx={{ color: COLORS.secondary }} />
                <Typography sx={{ color: "#94A3B8", fontSize: "0.75rem", mt: 1 }}>
                  Initializing camera...
                </Typography>
              </Box>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            {/* Viewfinder Target Framing Guidelines */}
            <Box
              sx={{
                position: "absolute",
                top: "10%",
                left: "8%",
                right: "8%",
                bottom: "10%",
                border: "2px dashed rgba(245, 158, 11, 0.75)",
                borderRadius: "8px",
                pointerEvents: "none",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                pb: 1,
              }}
            >
              <Typography
                sx={{
                  color: "#FFFFFF",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  backgroundColor: "rgba(15, 23, 42, 0.75)",
                  px: 1.5,
                  py: 0.3,
                  borderRadius: "4px",
                }}
              >
                Fit document within frame
              </Typography>
            </Box>

            {/* Flip Camera Button */}
            <IconButton
              onClick={handleFlipCamera}
              sx={{
                position: "absolute",
                top: 12,
                right: 12,
                backgroundColor: "rgba(15, 23, 42, 0.8)",
                color: "#FFFFFF",
                "&:hover": { backgroundColor: "#0F172A" },
              }}
            >
              <FlipCameraIosIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.5,
          py: 2,
          backgroundColor: "#0F172A",
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid #1E293B",
        }}
      >
        <Button
          onClick={handleClose}
          sx={{
            color: "#94A3B8",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.82rem",
          }}
        >
          Cancel
        </Button>

        {capturedImage ? (
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleRetake}
              sx={{
                borderColor: "#475569",
                color: "#E2E8F0",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "8px",
              }}
            >
              Retake
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<CheckCircleIcon />}
              onClick={handleConfirm}
              sx={{
                backgroundColor: "#10B981",
                color: "#FFFFFF",
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "8px",
                px: 2.5,
                "&:hover": { backgroundColor: "#059669" },
              }}
            >
              Use This Photo
            </Button>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Fallback File Select for mobile camera roll */}
            <Button
              component="label"
              size="small"
              sx={{
                color: "#94A3B8",
                textTransform: "none",
                fontSize: "0.78rem",
              }}
            >
              Or pick file
              <input
                type="file"
                hidden
                accept="image/*,application/pdf"
                capture="environment"
                onChange={handleFallbackFile}
              />
            </Button>
            <Button
              variant="contained"
              startIcon={<PhotoCameraIcon />}
              onClick={handleSnap}
              disabled={loadingCamera || !!cameraError}
              sx={{
                backgroundColor: COLORS.secondary,
                color: "#FFFFFF",
                textTransform: "none",
                fontWeight: 800,
                borderRadius: "8px",
                px: 3,
                "&:hover": { backgroundColor: "#D97706" },
              }}
            >
              Snap Photo
            </Button>
          </Stack>
        )}
      </DialogActions>
    </Dialog>
  );
}

