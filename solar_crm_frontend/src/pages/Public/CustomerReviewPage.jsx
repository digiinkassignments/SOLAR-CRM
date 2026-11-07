import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  Rating,
  Stack,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";

// Icons (Zero Emojis — 100% Professional MUI Icons)
import SolarPowerOutlinedIcon from "@mui/icons-material/SolarPowerOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";

import api from "../../api/axios";
import toast from "react-hot-toast";

const COLORS = {
  primary: "#0F172A", // Slate 900
  secondary: "#F59E0B", // Solar Amber
  background: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  success: "#10B981",
  successBg: "#ECFDF5",
  successBorder: "#A7F3D0",
};

const RATING_LABELS = {
  1: "1 Star — Needs Improvement",
  2: "2 Stars — Fair Experience",
  3: "3 Stars — Good Installation",
  4: "4 Stars — Very Good Experience",
  5: "5 Stars — Excellent & Highly Satisfied!",
};

export default function CustomerReviewPage() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [projectData, setProjectData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Review Form States
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(-1);
  const [feedback, setFeedback] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Fetch Public Project Review Data
  useEffect(() => {
    const fetchReviewData = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await api.get(`/public/review/${token}`);
        if (res.data?.success && res.data?.data) {
          const d = res.data.data;
          setProjectData(d);
          setRating(d.customer_rating || 5);
          setFeedback(d.customer_feedback || "");
          setReviewerName(d.customer_reviewer_name || d.customer_name || "");

          if (d.review_status === "submitted" || d.review_submitted_at) {
            setSubmittedSuccess(true);
          }
        } else {
          setErrorMsg(res.data?.message || "Invalid or expired review link.");
        }
      } catch (err) {
        console.error("fetchReviewData error:", err);
        setErrorMsg(err.response?.data?.message || "Review link not found or expired.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchReviewData();
    }
  }, [token]);

  // Handle Review Submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1) {
      toast.error("Please select a star rating.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/public/review/${token}`, {
        rating,
        feedback: feedback.trim(),
        reviewer_name: reviewerName.trim() || projectData?.customer_name,
      });

      if (res.data?.success) {
        setSubmittedSuccess(true);
        if (res.data?.data) {
          setProjectData(res.data.data);
        }
        toast.success("Thank you! Your verified review has been submitted.");
      } else {
        toast.error(res.data?.message || "Failed to submit review.");
      }
    } catch (err) {
      console.error("Submit review error:", err);
      toast.error(err.response?.data?.message || "Error submitting review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.background,
          p: 2,
        }}
      >
        <CircularProgress sx={{ color: COLORS.secondary, mb: 2 }} />
        <Typography sx={{ fontWeight: 700, color: COLORS.textSecondary, fontSize: "0.9rem" }}>
          Loading your solar handover review portal...
        </Typography>
      </Box>
    );
  }

  if (errorMsg || !projectData) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.background,
          p: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            maxWidth: 480,
            width: "100%",
            textAlign: "center",
            borderRadius: "16px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
          }}
        >
          <ErrorOutlineOutlinedIcon sx={{ fontSize: 48, color: "#DC2626", mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, mb: 1 }}>
            Review Link Unavailable
          </Typography>
          <Typography sx={{ fontSize: "0.85rem", color: COLORS.textSecondary, mb: 3 }}>
            {errorMsg || "This feedback link may have expired or is invalid. Please contact your solar project engineer."}
          </Typography>
        </Paper>
      </Box>
    );
  }

  const activeRatingLabel = RATING_LABELS[hoverRating !== -1 ? hoverRating : rating] || "Select Rating";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: COLORS.background,
        py: { xs: 3, sm: 5 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ maxWidth: 640, mx: "auto" }}>
        {/* BRANDING HEADER */}
        <Box sx={{ textAlign: "center", mb: 3.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="center" gap={1} sx={{ mb: 1 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                backgroundColor: COLORS.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: COLORS.secondary,
              }}
            >
              <SolarPowerOutlinedIcon sx={{ fontSize: 22 }} />
            </Box>
            <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: COLORS.primary, letterSpacing: "-0.01em" }}>
              Solar CRM
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: "0.82rem", color: COLORS.textSecondary, fontWeight: 600 }}>
            Customer Project Handover & Satisfaction Review
          </Typography>
        </Box>

        {/* PROJECT INFO CARD */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: "14px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1.5}>
            <Box>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase" }}>
                Solar Installation Project
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary, fontSize: "1.1rem", mt: 0.2 }}>
                {projectData.customer_name}
              </Typography>

              <Stack direction="row" alignItems="center" gap={1.5} sx={{ mt: 0.8 }} flexWrap="wrap">
                <Chip
                  label={projectData.project_number}
                  size="small"
                  sx={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    bgcolor: "#F1F5F9",
                    color: COLORS.primary,
                    height: 22,
                  }}
                />

                {(projectData.city || projectData.state) && (
                  <Stack direction="row" alignItems="center" gap={0.4}>
                    <LocationOnOutlinedIcon sx={{ fontSize: 14, color: COLORS.textMuted }} />
                    <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                      {[projectData.city, projectData.state].filter(Boolean).join(", ")}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Box>

            <Chip
              icon={<SolarPowerOutlinedIcon sx={{ fontSize: "15px !important", color: "#B45309 !important" }} />}
              label={`${projectData.system_capacity_kw || "3.50"} kW Plant`}
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: "0.74rem",
                bgcolor: "#FEF3C7",
                color: "#92400E",
                height: 26,
              }}
            />
          </Stack>
        </Paper>

        {/* REVIEW FORM OR SUCCESS CONFIRMATION */}
        {submittedSuccess ? (
          /* SUCCESS VIEW (ALREADY SUBMITTED & RECORDED) */
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: "16px",
              border: `1px solid ${COLORS.successBorder}`,
              backgroundColor: COLORS.card,
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                backgroundColor: COLORS.successBg,
                color: COLORS.success,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <VerifiedOutlinedIcon sx={{ fontSize: 36 }} />
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.primary, fontSize: "1.2rem", mb: 0.5 }}>
              Thank You for Your Feedback!
            </Typography>
            <Typography sx={{ fontSize: "0.85rem", color: COLORS.textSecondary, maxWidth: 440, mx: "auto", mb: 3 }}>
              Your verified review and satisfaction rating have been officially recorded in your solar project handover docket.
            </Typography>

            {/* RECORDED REVIEW PREVIEW */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: "12px",
                bgcolor: "#F8FAFC",
                border: `1px solid ${COLORS.border}`,
                textAlign: "left",
                mb: 3,
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Rating
                  value={rating}
                  readOnly
                  precision={1}
                  icon={<StarRoundedIcon sx={{ fontSize: 26, color: COLORS.secondary }} />}
                  emptyIcon={<StarRoundedIcon sx={{ fontSize: 26 }} />}
                />
                <Chip
                  icon={<LockOutlinedIcon sx={{ fontSize: "13px !important" }} />}
                  label="Recorded & Verified"
                  size="small"
                  sx={{
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    bgcolor: COLORS.successBg,
                    color: "#065F46",
                    height: 22,
                  }}
                />
              </Stack>

              <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, color: COLORS.primary, mb: 1 }}>
                {RATING_LABELS[rating]}
              </Typography>

              {feedback ? (
                <Typography sx={{ fontSize: "0.85rem", color: COLORS.textSecondary, fontStyle: "italic", lineHeight: 1.5 }}>
                  "{feedback}"
                </Typography>
              ) : (
                <Typography sx={{ fontSize: "0.8rem", color: COLORS.textMuted, fontStyle: "italic" }}>
                  (No written comment provided — 5 Star rating recorded)
                </Typography>
              )}

              {projectData.review_submitted_at && (
                <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, mt: 1.5, textAlign: "right" }}>
                  Submitted on {new Date(projectData.review_submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </Typography>
              )}
            </Box>

            <Alert severity="success" sx={{ borderRadius: "10px", fontSize: "0.8rem", textAlign: "left" }}>
              This review is synced directly with your installation file in the Solar CRM portal. No further action is required.
            </Alert>
          </Paper>
        ) : (
          /* ACTIVE REVIEW FORM */
          <Paper
            elevation={0}
            component="form"
            onSubmit={handleSubmitReview}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: "16px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.card,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 900, color: COLORS.primary, fontSize: "1.15rem", mb: 0.5 }}>
              Rate Your Solar Handover Experience
            </Typography>
            <Typography sx={{ fontSize: "0.82rem", color: COLORS.textSecondary, mb: 3 }}>
              Your honest feedback helps us maintain top-tier engineering standards and ensures smooth warranty handover.
            </Typography>

            {/* INTERACTIVE STAR RATING BLOCK */}
            <Box
              sx={{
                p: 3,
                borderRadius: "12px",
                bgcolor: "#F8FAFC",
                border: `1px solid ${COLORS.border}`,
                textAlign: "center",
                mb: 3,
              }}
            >
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", mb: 1.5 }}>
                Tap Stars to Rate
              </Typography>

              <Rating
                name="customer-handover-rating"
                value={rating}
                precision={1}
                size="large"
                onChange={(event, newValue) => {
                  if (newValue) setRating(newValue);
                }}
                onChangeActive={(event, newHover) => {
                  setHoverRating(newHover);
                }}
                icon={<StarRoundedIcon sx={{ fontSize: 44, color: COLORS.secondary }} />}
                emptyIcon={<StarRoundedIcon sx={{ fontSize: 44 }} />}
              />

              <Typography sx={{ fontSize: "0.88rem", fontWeight: 800, color: COLORS.primary, mt: 1 }}>
                {activeRatingLabel}
              </Typography>
            </Box>

            {/* OPTIONAL WRITTEN FEEDBACK */}
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.6 }}>
                Your Review / Experience Comments (Optional)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Share your thoughts about the rooftop solar generation, team conduct, wiring neatness, inverter app setup, or any suggestions..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    fontSize: "0.85rem",
                    bgcolor: "#FFFFFF",
                  },
                }}
              />
            </Box>

            {/* REVIEWER NAME (OPTIONAL) */}
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: COLORS.textPrimary, mb: 0.6 }}>
                Reviewer Name
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. Ramesh Kumar"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    fontSize: "0.85rem",
                    bgcolor: "#FFFFFF",
                  },
                }}
              />
            </Box>

            {/* SUBMIT BUTTON */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={18} sx={{ color: "#FFFFFF" }} /> : <SendRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                py: 1.4,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 800,
                fontSize: "0.92rem",
                bgcolor: COLORS.primary,
                color: "#FFFFFF",
                "&:hover": { bgcolor: "#020617" },
              }}
            >
              {submitting ? "Submitting Review..." : "Submit My Handover Review"}
            </Button>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
