import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Fade,
  Slide,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Tooltip,
} from "@mui/material";

// Icons
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import UpdateOutlinedIcon from "@mui/icons-material/UpdateOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CloseIcon from "@mui/icons-material/Close";
import MailOutlineOutlinedIcon from "@mui/icons-material/MailOutlineOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import ZoomInOutlinedIcon from "@mui/icons-material/ZoomInOutlined";
import ZoomOutOutlinedIcon from "@mui/icons-material/ZoomOutOutlined";
import CropIcon from "@mui/icons-material/Crop";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

// Import Profile Services safely
import * as profileService from "../../services/profileService";

const { getProfile, updateProfile, changePassword, uploadProfilePhoto } = profileService;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
  "";

const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  bg: "#F5F7FA",
  card: "#FFFFFF",
  border: "#E5E7EB",
  hover: "#F8FAFC",
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#D97706",
  info: "#0284C7",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
};

const SlideTransition = (props) => <Slide {...props} direction="left" />;

const fieldSx = (readOnly) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: readOnly ? "#F8FAFC" : "#FFFFFF",
    height: "38px",
    fontSize: "0.85rem",
    "& fieldset": { borderColor: COLORS.border },
    "&:hover fieldset": { borderColor: readOnly ? COLORS.border : "#94A3B8" },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary, borderWidth: "1.5px" },
  },
  "& .MuiInputLabel-root": { fontSize: "0.8rem", top: "-2px" },
  "& .MuiInputLabel-root.Mui-focused": { color: COLORS.primary },
});

const cardSx = {
  p: { xs: 2, md: 2.5 },
  borderRadius: "14px",
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.card,
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
  transition: "all 0.2s ease",
  "&:hover": {
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
  },
};

const sectionTitleSx = {
  fontWeight: 700,
  color: COLORS.primaryDark,
  fontSize: "1rem",
  letterSpacing: "-0.2px",
};

const primaryButtonSx = {
  height: 38,
  borderRadius: "8px",
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.825rem",
  px: 2,
  backgroundColor: COLORS.primary,
  boxShadow: "none",
  whiteSpace: "nowrap",
  transition: "all 0.2s ease",
  "&:hover": { backgroundColor: COLORS.primaryDark, boxShadow: "0 4px 12px rgba(0,91,172,0.2)" },
};

const outlinedButtonSx = {
  height: 38,
  borderRadius: "8px",
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.825rem",
  px: 2,
  borderColor: COLORS.border,
  color: COLORS.textSecondary,
  whiteSpace: "nowrap",
  transition: "all 0.2s ease",
  "&:hover": { borderColor: "#94A3B8", backgroundColor: COLORS.hover },
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};


const getInitials = (name) => {
  if (!name || typeof name !== "string") return "TS";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const Profile = ({ embedded = false }) => {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [basicInfoForm, setBasicInfoForm] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
  });
  const [basicInfoErrors, setBasicInfoErrors] = useState({});
  const [savingInfo, setSavingInfo] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [removingPhoto, setRemovingPhoto] = useState(false);

  // Picture Viewer & Cropper States
  const [viewPhotoOpen, setViewPhotoOpen] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showNotification = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const updateLocalStorageUser = (updated) => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const newUser = {
        ...storedUser,
        full_name: updated.full_name ?? storedUser.full_name,
        username: updated.username ?? storedUser.username,
        email: updated.email ?? storedUser.email,
        phone: updated.phone ?? storedUser.phone,
        profile_image: updated.profile_image !== undefined ? updated.profile_image : null,
      };
      localStorage.setItem("user", JSON.stringify(newUser));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.error("Failed to sync localStorage user object", e);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getProfile();
      const data = res?.data?.data || res?.data || res;
      setProfileData(data);

      setBasicInfoForm({
        full_name: data.full_name || "",
        username: data.username || "",
        email: data.email || "",
        phone: data.phone || "",
      });

      updateLocalStorageUser(data);
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Failed to load profile details.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const isAccountActive = () => {
    if (!profileData) return false;
    const st = profileData.status;
    return st === 1 || st === "1" || st === true || st?.toString().toLowerCase() === "active";
  };

  // Fixed Strict Image URL Resolver (Handles null/empty cases for Instant Removal)
  const getImageUrl = (imgPath) => {
    if (photoPreview) return photoPreview;
    if (!imgPath || imgPath === "null" || imgPath === "undefined" || imgPath.trim() === "") return null;

    if (imgPath.startsWith("http")) {
      const cacheKey = profileData?.updated_at
        ? `?v=${new Date(profileData.updated_at).getTime()}`
        : `?v=${Date.now()}`;
      return `${imgPath}${cacheKey}`;
    }

    let cleanPath = imgPath.startsWith("/") ? imgPath.slice(1) : imgPath;

    if (!cleanPath.startsWith("uploads/profiles/")) {
      if (cleanPath.startsWith("uploads/")) {
        cleanPath = cleanPath.replace("uploads/", "uploads/profiles/");
      } else {
        cleanPath = `uploads/profiles/${cleanPath}`;
      }
    }

    const cacheKey = profileData?.updated_at
      ? `?v=${new Date(profileData.updated_at).getTime()}`
      : `?v=${Date.now()}`;

    return `${API_BASE_URL}/${cleanPath}${cacheKey}`;
  };

  // When file is selected, open interactive Crop Dialog
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|jpg|webp)$/)) {
      showNotification("Please upload a valid image (JPG, JPEG, PNG, WEBP).", "warning");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification("Image size must be under 5MB.", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result);
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Perform canvas circular crop and upload
  const handleApplyCropAndUpload = async () => {
    if (!rawImageSrc) return;

    try {
      setPhotoUploading(true);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = rawImageSrc;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const outputSize = 400; // High quality 400x400 square for avatar
      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");

      // Clear transparent
      ctx.clearRect(0, 0, outputSize, outputSize);

      // Compute display dimensions matching the 260px preview container
      const previewSize = 260;
      const scaleFactor = outputSize / previewSize;

      const baseScale = Math.max(previewSize / img.naturalWidth, previewSize / img.naturalHeight);
      const drawWidth = img.naturalWidth * baseScale * zoomLevel * scaleFactor;
      const drawHeight = img.naturalHeight * baseScale * zoomLevel * scaleFactor;

      const drawX = (outputSize - drawWidth) / 2 + (panOffset.x * scaleFactor);
      const drawY = (outputSize - drawHeight) / 2 + (panOffset.y * scaleFactor);

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      // Convert canvas to WebP/JPEG Blob
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92)
      );

      if (!blob) throw new Error("Could not crop image");

      const croppedFile = new File([blob], "profile_avatar.jpg", { type: "image/jpeg" });
      const previewUrl = URL.createObjectURL(croppedFile);
      setPhotoPreview(previewUrl);

      const formData = new FormData();
      formData.append("profile_image", croppedFile);

      setCropDialogOpen(false);

      const res = await uploadProfilePhoto(formData);
      const updatedData = res?.data?.data || res?.data || {};

      showNotification("Profile photo cropped & updated successfully!", "success");
      setPhotoPreview(null);

      if (updatedData.profile_image) {
        updateLocalStorageUser({ profile_image: updatedData.profile_image });
      }
      await fetchProfile();
    } catch (err) {
      console.error(err);
      showNotification(
        err.response?.data?.message || "Failed to crop & upload photo.",
        "error"
      );
      setPhotoPreview(null);
    } finally {
      setPhotoUploading(false);
    }
  };

  // Instant Front-end Photo Removal with Local State Override
  const handleRemovePhoto = async () => {
    try {
      setRemovingPhoto(true);

      if (typeof profileService.removeProfilePhoto === "function") {
        await profileService.removeProfilePhoto();
      } else {
        await updateProfile({
          id: profileData.id,
          full_name: profileData.full_name,
          username: profileData.username,
          email: profileData.email,
          phone: profileData.phone,
          profile_image: null,
        });
      }

      // Immediately clear image state locally
      setPhotoPreview(null);
      setProfileData((prev) => ({
        ...prev,
        profile_image: null,
      }));

      updateLocalStorageUser({ profile_image: null });
      showNotification("Profile photo removed successfully!", "success");
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Failed to remove photo.",
        "error"
      );
    } finally {
      setRemovingPhoto(false);
    }
  };

  const validateBasicInfo = () => {
    const errors = {};
    if (!basicInfoForm.full_name.trim()) errors.full_name = "Full Name is required";
    if (!basicInfoForm.username.trim()) errors.username = "Username is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicInfoForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(basicInfoForm.email)) {
      errors.email = "Enter a valid email address";
    }

    if (!basicInfoForm.phone.trim()) {
      errors.phone = "Phone number is required";
    }

    setBasicInfoErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveBasicInfo = async () => {
    if (!validateBasicInfo()) return;

    try {
      setSavingInfo(true);
      const res = await updateProfile({
        id: profileData.id,
        full_name: basicInfoForm.full_name,
        username: basicInfoForm.username,
        email: basicInfoForm.email,
        phone: basicInfoForm.phone,
      });

      const updated = res?.data?.data || res?.data || basicInfoForm;
      updateLocalStorageUser(updated);

      showNotification("Profile details saved successfully!", "success");
      setIsEditing(false);
      await fetchProfile();
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Failed to update profile.",
        "error"
      );
    } finally {
      setSavingInfo(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setBasicInfoErrors({});
    if (profileData) {
      setBasicInfoForm({
        full_name: profileData.full_name || "",
        username: profileData.username || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
      });
    }
  };

  const validatePassword = () => {
    const errors = {};
    const pass = passwordForm.new_password;

    if (!passwordForm.current_password) {
      errors.current_password = "Current password is required";
    }

    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|;:'",.<>\/]).{8,}$/;

    if (!pass) {
      errors.new_password = "New password is required";
    } else if (!strongRegex.test(pass)) {
      errors.new_password = "Must contain 8+ chars, uppercase, lowercase, number & special char";
    }

    if (!passwordForm.confirm_password) {
      errors.confirm_password = "Confirm password is required";
    } else if (passwordForm.new_password !== passwordForm.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

const handleUpdatePassword = async () => {
    if (!validatePassword()) return;

    try {
      setUpdatingPassword(true);
      // Backend safe payload - current_password, old_password & confirm_password sabhi bhejo
      await changePassword({
        current_password: passwordForm.current_password,
        old_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password,
      });

      showNotification("Password updated successfully!", "success");
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setPasswordErrors({});
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Failed to update password.",
        "error"
      );
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
        <CircularProgress sx={{ color: COLORS.primary }} size={38} thickness={4} />
      </Box>
    );
  }

  const currentPhotoUrl = getImageUrl(profileData?.profile_image);
  const hasPhoto = Boolean(currentPhotoUrl);
  const activeStatus = isAccountActive();

  return (
    <Box sx={{ width: "100%", backgroundColor: embedded ? "transparent" : COLORS.bg, minHeight: embedded ? "auto" : "100vh", p: embedded ? 0 : { xs: 1.5, sm: 2, md: 2.5 } }}>
      <Box sx={{ width: "100%" }}>
        
        {/* TOP ROW */}
        <Grid container spacing={2.5} sx={{ mb: 2.5, alignItems: "stretch" }}>
          
          {/* PROFILE CARD */}
          <Grid item xs={12} md={6}>
            <Fade in timeout={400}>
              <Paper elevation={0} sx={{ ...cardSx, height: "100%", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <Box>
                  <Box sx={{ position: "relative", display: "inline-block", mb: 1, mt: 0.5 }}>
                    <Avatar
                      key={currentPhotoUrl || "initials"}
                      src={currentPhotoUrl || undefined}
                      sx={{
                        width: 110,
                        height: 110,
                        fontSize: "2.4rem",
                        fontWeight: 700,
                        backgroundColor: COLORS.primaryDark,
                        color: "#FFFFFF",
                        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
                        border: "3px solid #FFFFFF",
                        outline: `1px solid ${COLORS.border}`,
                        mx: "auto",
                        "& img": {
                          objectFit: "cover",
                        },
                      }}
                    >
                      {getInitials(profileData?.full_name)}
                    </Avatar>

                    <IconButton
                      component="label"
                      disabled={photoUploading}
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        backgroundColor: COLORS.primary,
                        color: "#FFFFFF",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                        "&:hover": { backgroundColor: COLORS.primaryDark },
                        width: 32,
                        height: 32,
                      }}
                    >
                      {photoUploading ? (
                        <CircularProgress size={16} sx={{ color: "#FFFFFF" }} />
                      ) : (
                        <PhotoCameraOutlinedIcon sx={{ fontSize: "1rem" }} />
                      )}
                      <input type="file" hidden accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handlePhotoSelect} />
                    </IconButton>
                  </Box>

                  {photoUploading && (
                    <LinearProgress
                      sx={{
                        mb: 1,
                        borderRadius: 4,
                        height: 3,
                        backgroundColor: "#E2E8F0",
                        "& .MuiLinearProgress-bar": { backgroundColor: COLORS.primary },
                      }}
                    />
                  )}

                  <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "1.05rem", lineHeight: 1.2 }}>
                    {profileData?.full_name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.8rem", mb: 1 }}>
                    @{profileData?.username}
                  </Typography>

                  <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mb: 1.5 }}>
                    <Chip
                      label={profileData?.role_name?.toUpperCase() || "SUPER ADMIN"}
                      size="small"
                      sx={{
                        backgroundColor: "#E6F0FA",
                        color: COLORS.primary,
                        fontWeight: 700,
                        fontSize: "0.68rem",
                        borderRadius: "5px",
                        height: 22,
                      }}
                    />
                    <Chip
                      label={activeStatus ? "Active" : "Inactive"}
                      size="small"
                      sx={{
                        backgroundColor: activeStatus ? "#DCFCE7" : "#FEE2E2",
                        color: activeStatus ? COLORS.success : COLORS.danger,
                        fontWeight: 700,
                        fontSize: "0.68rem",
                        borderRadius: "5px",
                        height: 22,
                      }}
                    />
                  </Box>

                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: 1.25, mb: 1.5 }}>
                    <Button
                      component="label"
                      variant="contained"
                      startIcon={photoUploading ? <CircularProgress size={14} sx={{ color: "#FFF" }} /> : <CropIcon sx={{ fontSize: "1.05rem" }} />}
                      disabled={photoUploading}
                      sx={{ ...primaryButtonSx, minWidth: "125px" }}
                    >
                      {photoUploading ? "Uploading..." : "Upload Photo"}
                      <input type="file" hidden accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handlePhotoSelect} />
                    </Button>

                    <Button
                      variant="outlined"
                      startIcon={<VisibilityOutlinedIcon sx={{ fontSize: "1.05rem" }} />}
                      onClick={() => setViewPhotoOpen(true)}
                      disabled={!hasPhoto}
                      sx={{
                        ...outlinedButtonSx,
                        minWidth: "115px",
                        color: COLORS.primary,
                        borderColor: COLORS.border,
                        "&:hover": { borderColor: COLORS.primary, backgroundColor: COLORS.hover },
                      }}
                    >
                      View Picture
                    </Button>

                    <Button
                      variant="outlined"
                      startIcon={removingPhoto ? <CircularProgress size={14} sx={{ color: COLORS.danger }} /> : <DeleteOutlineOutlinedIcon sx={{ fontSize: "1.05rem" }} />}
                      onClick={handleRemovePhoto}
                      disabled={!hasPhoto || removingPhoto || photoUploading}
                      sx={{
                        ...outlinedButtonSx,
                        minWidth: "90px",
                        color: COLORS.danger,
                        borderColor: "#FCA5A5",
                        "&:hover": { borderColor: COLORS.danger, backgroundColor: "#FEF2F2" },
                      }}
                    >
                      Remove
                    </Button>
                  </Box>
                </Box>

                <Box>
                  <Divider sx={{ mb: 1.5, borderColor: "#F1F5F9" }} />

                  <Box sx={{ display: "flex", justifyContent: "space-around", alignItems: "center", flexWrap: "wrap", gap: 1, textAlign: "left" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <MailOutlineOutlinedIcon sx={{ fontSize: "0.95rem", color: COLORS.primary }} />
                      <Typography variant="body2" sx={{ color: COLORS.textPrimary, fontWeight: 500, fontSize: "0.8rem" }}>
                        {profileData?.email || "N/A"}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <PhoneOutlinedIcon sx={{ fontSize: "0.95rem", color: COLORS.primary }} />
                      <Typography variant="body2" sx={{ color: COLORS.textPrimary, fontWeight: 500, fontSize: "0.8rem" }}>
                        {profileData?.phone || "N/A"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Fade>
          </Grid>

          {/* TIMELINE CARD */}
          <Grid item xs={12} md={6}>
            <Fade in timeout={500}>
              <Paper elevation={0} sx={{ ...cardSx, height: "100%", display: "flex", flexDirection: "column", width: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <HistoryOutlinedIcon sx={{ color: COLORS.primaryDark, fontSize: "1.2rem" }} />
                  <Typography sx={sectionTitleSx}>Account Activity Timeline</Typography>
                </Box>

                <Divider sx={{ mb: 1.5, borderColor: "#F1F5F9" }} />

                <Box sx={{ position: "relative", pl: 0.5, flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly", width: "100%" }}>
                  {[
                    {
                      icon: <PersonAddAltOutlinedIcon sx={{ fontSize: "1.1rem" }} />,
                      label: "Account Created",
                      description: "Initial profile registration and role assignment.",
                      date: formatDate(profileData?.created_at),
                      color: COLORS.primary,
                    },
                    {
                      icon: <UpdateOutlinedIcon sx={{ fontSize: "1.1rem" }} />,
                      label: "Last Profile Update",
                      description: "Contact details and avatar information synced.",
                      date: formatDate(profileData?.updated_at),
                      color: "#D97706",
                    },
                    {
                      icon: <LoginOutlinedIcon sx={{ fontSize: "1.1rem" }} />,
                      label: "Last Login Session",
                      description: "Logged in via authenticated Solar CRM portal.",
                      date: formatDate(profileData?.last_login),
                      color: COLORS.success,
                    },
                  ].map((item, idx, arr) => (
                    <Box key={item.label} sx={{ display: "flex", gap: 2, position: "relative", my: 0.5, width: "100%" }}>
                      {idx !== arr.length - 1 && (
                        <Box
                          sx={{
                            position: "absolute",
                            left: 17,
                            top: 32,
                            bottom: -20,
                            width: "2px",
                            backgroundColor: "#E2E8F0",
                          }}
                        />
                      )}
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: `${item.color}15`,
                          color: item.color,
                          flexShrink: 0,
                          zIndex: 1,
                          border: `1px solid ${item.color}30`,
                        }}
                      >
                        {item.icon}
                      </Box>

                      <Box sx={{ flexGrow: 1, width: "100%" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "0.875rem" }}>
                            {item.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600, backgroundColor: "#F1F5F9", px: 1, py: 0.3, borderRadius: "4px", fontSize: "0.75rem" }}>
                            {item.date}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, mt: 0.2, display: "block", fontSize: "0.775rem" }}>
                          {item.description}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Fade>
          </Grid>
        </Grid>

        {/* BOTTOM ROW */}
        <Grid container spacing={2.5}>
          
          {/* BASIC INFO */}
          <Grid item xs={12} lg={7}>
            <Fade in timeout={400}>
              <Paper elevation={0} sx={cardSx}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <PersonOutlineOutlinedIcon sx={{ color: COLORS.primaryDark, fontSize: "1.1rem" }} />
                    <Typography sx={sectionTitleSx}>Basic Information</Typography>
                  </Box>

                  {!isEditing ? (
                    <Button
                      variant="outlined"
                      startIcon={<EditOutlinedIcon sx={{ fontSize: "0.95rem" }} />}
                      onClick={() => setIsEditing(true)}
                      sx={{ ...outlinedButtonSx, height: 32, fontSize: "0.78rem", px: 1.8, color: COLORS.primary, borderColor: COLORS.primary, "&:hover": { backgroundColor: "#E6F0FA" } }}
                    >
                      Edit
                    </Button>
                  ) : (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<CancelOutlinedIcon sx={{ fontSize: "0.95rem" }} />}
                        onClick={handleCancelEdit}
                        disabled={savingInfo}
                        sx={{ ...outlinedButtonSx, height: 32, fontSize: "0.78rem", px: 1.5 }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={savingInfo ? <CircularProgress size={12} sx={{ color: "#FFF" }} /> : <SaveOutlinedIcon sx={{ fontSize: "0.95rem" }} />}
                        onClick={handleSaveBasicInfo}
                        disabled={savingInfo}
                        sx={{ ...primaryButtonSx, height: 32, fontSize: "0.78rem", px: 1.8 }}
                      >
                        Save
                      </Button>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ mb: 1.5, borderColor: "#F1F5F9" }} />

                <Grid container spacing={1.5}>


                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={basicInfoForm.full_name}
                      onChange={(e) => setBasicInfoForm({ ...basicInfoForm, full_name: e.target.value })}
                      disabled={!isEditing}
                      error={Boolean(basicInfoErrors.full_name)}
                      helperText={basicInfoErrors.full_name}
                      size="small"
                      sx={fieldSx(!isEditing)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Username"
                      value={basicInfoForm.username}
                      onChange={(e) => setBasicInfoForm({ ...basicInfoForm, username: e.target.value })}
                      disabled={!isEditing}
                      error={Boolean(basicInfoErrors.username)}
                      helperText={basicInfoErrors.username}
                      size="small"
                      sx={fieldSx(!isEditing)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      value={basicInfoForm.email}
                      onChange={(e) => setBasicInfoForm({ ...basicInfoForm, email: e.target.value })}
                      disabled={!isEditing}
                      error={Boolean(basicInfoErrors.email)}
                      helperText={basicInfoErrors.email}
                      size="small"
                      sx={fieldSx(!isEditing)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={basicInfoForm.phone}
                      onChange={(e) => setBasicInfoForm({ ...basicInfoForm, phone: e.target.value })}
                      disabled={!isEditing}
                      error={Boolean(basicInfoErrors.phone)}
                      helperText={basicInfoErrors.phone}
                      size="small"
                      sx={fieldSx(!isEditing)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Role"
                      value={profileData?.role_name || "Super Admin"}
                      disabled
                      size="small"
                      sx={fieldSx(true)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Status"
                      value={activeStatus ? "Active" : "Inactive"}
                      disabled
                      size="small"
                      sx={fieldSx(true)}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Fade>
          </Grid>

          {/* SECURITY & PASSWORD */}
          <Grid item xs={12} lg={5}>
            <Fade in timeout={500}>
              <Paper elevation={0} sx={cardSx}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1.5 }}>
                  <SecurityOutlinedIcon sx={{ color: COLORS.primaryDark, fontSize: "1.1rem" }} />
                  <Typography sx={sectionTitleSx}>Security & Password</Typography>
                </Box>

                <Divider sx={{ mb: 1.5, borderColor: "#F1F5F9" }} />

                <Grid container spacing={1.5}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Current Password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      error={Boolean(passwordErrors.current_password)}
                      helperText={passwordErrors.current_password}
                      size="small"
                      sx={fieldSx(false)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton edge="end" onClick={() => setShowCurrentPassword((prev) => !prev)}>
                              {showCurrentPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="New Password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      error={Boolean(passwordErrors.new_password)}
                      helperText={passwordErrors.new_password}
                      size="small"
                      sx={fieldSx(false)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton edge="end" onClick={() => setShowNewPassword((prev) => !prev)}>
                              {showNewPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Confirm Password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      error={Boolean(passwordErrors.confirm_password)}
                      helperText={passwordErrors.confirm_password}
                      size="small"
                      sx={fieldSx(false)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton edge="end" onClick={() => setShowConfirmPassword((prev) => !prev)}>
                              {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    startIcon={updatingPassword ? <CircularProgress size={12} sx={{ color: "#FFF" }} /> : <LockResetOutlinedIcon sx={{ fontSize: "0.95rem" }} />}
                    onClick={handleUpdatePassword}
                    disabled={updatingPassword}
                    sx={{ ...primaryButtonSx, height: 32, fontSize: "0.78rem" }}
                  >
                    Update Password
                  </Button>
                </Box>
              </Paper>
            </Fade>
          </Grid>
        </Grid>

        {/* CROP PICTURE DIALOG */}
        <Dialog
          open={cropDialogOpen}
          onClose={() => !photoUploading && setCropDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "16px",
              p: 1,
              boxShadow: "0 20px 40px rgba(15, 23, 42, 0.2)",
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, fontSize: "1.05rem", color: COLORS.textPrimary, pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CropIcon sx={{ color: COLORS.primary, fontSize: "1.2rem" }} />
              Crop Profile Photo
            </Box>
            <IconButton size="small" onClick={() => setCropDialogOpen(false)} disabled={photoUploading}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ pt: 1, pb: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary, mb: 2, textAlign: "center", display: "block" }}>
              Drag to reposition or adjust zoom to fit nicely in the circular profile avatar.
            </Typography>

            {/* Circular Crop Frame with Dragging */}
            <Box
              onMouseDown={(e) => {
                setIsDragging(true);
                setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
              }}
              onMouseMove={(e) => {
                if (!isDragging) return;
                setPanOffset({
                  x: e.clientX - dragStart.x,
                  y: e.clientY - dragStart.y,
                });
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              sx={{
                width: 260,
                height: 260,
                borderRadius: "50%",
                overflow: "hidden",
                position: "relative",
                border: "4px solid #0F172A",
                boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.65), 0 8px 24px rgba(0,0,0,0.3)",
                cursor: isDragging ? "grabbing" : "grab",
                backgroundColor: "#0F172A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                userSelect: "none",
              }}
            >
              {rawImageSrc && (
                <Box
                  component="img"
                  src={rawImageSrc}
                  alt="Crop preview"
                  draggable={false}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                    transition: isDragging ? "none" : "transform 0.1s ease",
                    pointerEvents: "none",
                  }}
                />
              )}
            </Box>

            {/* Zoom Slider Controls */}
            <Box sx={{ width: "100%", mt: 3, px: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
                  Zoom Level
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>
                  {Math.round(zoomLevel * 100)}%
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <ZoomOutOutlinedIcon sx={{ color: "#94A3B8", fontSize: "1.2rem" }} />
                <Slider
                  value={zoomLevel}
                  min={1}
                  max={3}
                  step={0.05}
                  onChange={(e, val) => setZoomLevel(val)}
                  sx={{
                    color: COLORS.primary,
                    "& .MuiSlider-thumb": { width: 16, height: 16 },
                  }}
                />
                <ZoomInOutlinedIcon sx={{ color: "#94A3B8", fontSize: "1.2rem" }} />
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button
              onClick={() => setCropDialogOpen(false)}
              disabled={photoUploading}
              sx={{ ...outlinedButtonSx, height: 36 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleApplyCropAndUpload}
              disabled={photoUploading}
              startIcon={photoUploading ? <CircularProgress size={14} sx={{ color: "#FFF" }} /> : <CropIcon sx={{ fontSize: "1rem" }} />}
              sx={{ ...primaryButtonSx, height: 36, px: 3 }}
            >
              {photoUploading ? "Saving Photo..." : "Crop & Save"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* FULL PICTURE VIEWER DIALOG */}
        <Dialog
          open={viewPhotoOpen}
          onClose={() => setViewPhotoOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "16px",
              p: 1,
              backgroundColor: "#0F172A",
              color: "#FFFFFF",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <VisibilityOutlinedIcon sx={{ color: "#38BDF8", fontSize: "1.2rem" }} />
              Profile Photo Preview
            </Box>
            <IconButton size="small" onClick={() => setViewPhotoOpen(false)} sx={{ color: "#94A3B8", "&:hover": { color: "#FFFFFF" } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 2, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 320 }}>
            {currentPhotoUrl ? (
              <Box
                component="img"
                src={currentPhotoUrl}
                alt={profileData?.full_name || "Profile Photo"}
                sx={{
                  maxWidth: "100%",
                  maxHeight: "65vh",
                  borderRadius: "12px",
                  objectFit: "contain",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
            ) : (
              <Avatar
                sx={{
                  width: 160,
                  height: 160,
                  fontSize: "3.5rem",
                  fontWeight: 700,
                  backgroundColor: "#1E293B",
                  color: "#FFFFFF",
                }}
              >
                {getInitials(profileData?.full_name)}
              </Avatar>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 2, pb: 1.5, justifyContent: "space-between" }}>
            <Typography variant="caption" sx={{ color: "#94A3B8" }}>
              {profileData?.full_name} (@{profileData?.username})
            </Typography>
            <Button
              onClick={() => setViewPhotoOpen(false)}
              variant="outlined"
              sx={{
                borderRadius: "8px",
                borderColor: "rgba(255,255,255,0.2)",
                color: "#FFFFFF",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.825rem",
                "&:hover": { borderColor: "#FFFFFF", backgroundColor: "rgba(255,255,255,0.05)" },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* TOAST SYSTEM */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3500}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          TransitionComponent={SlideTransition}
          sx={{ mt: 2 }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            variant="filled"
            iconMapping={{
              success: <CheckCircleOutlineOutlinedIcon fontSize="inherit" />,
              error: <ErrorOutlineOutlinedIcon fontSize="inherit" />,
              warning: <WarningAmberOutlinedIcon fontSize="inherit" />,
              info: <InfoOutlinedIcon fontSize="inherit" />,
            }}
            action={
              <IconButton size="small" onClick={handleSnackbarClose} sx={{ color: "#FFFFFF" }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            }
            sx={{
              minWidth: 280,
              borderRadius: "8px",
              fontWeight: 600,
              alignItems: "center",
              boxShadow: "0 6px 20px rgba(15, 23, 42, 0.15)",
              backgroundColor:
                snackbar.severity === "success"
                  ? COLORS.success
                  : snackbar.severity === "error"
                  ? COLORS.danger
                  : snackbar.severity === "warning"
                  ? COLORS.warning
                  : COLORS.info,
              color: "#FFFFFF",
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

      </Box>
    </Box>
  );
};

export default Profile;