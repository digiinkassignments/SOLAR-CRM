import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Slide,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

const BulkDeleteBar = ({
  selectedCount = 0,
  totalCount = 0,
  itemLabel = "Records",
  onDeselectAll,
  onSelectAll,
  isAllSelected = false,
  onConfirmDelete,
  loading = false,
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (selectedCount === 0) return null;

  const handleDelete = async () => {
    if (onConfirmDelete) {
      await onConfirmDelete();
      setConfirmOpen(false);
    }
  };

  return (
    <>
      {/* Floating or Top-Sticky Bulk Action Bar */}
      <Slide in={selectedCount > 0} direction="down" mountOnEnter unmountOnExit>
        <Paper
          elevation={4}
          sx={{
            mb: 2,
            p: 1.5,
            px: 2.5,
            bgcolor: "#0F172A",
            color: "#FFFFFF",
            borderRadius: "10px",
            border: "1px solid #334155",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
            boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.4)",
            zIndex: 10,
          }}
        >
          {/* Left: Count & Selection Controls */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CheckBoxIcon sx={{ color: "#38BDF8", fontSize: 22 }} />
            <Chip
              label={`${selectedCount} ${itemLabel} Selected`}
              size="small"
              sx={{
                bgcolor: "#0284C7",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: "0.76rem",
              }}
            />

            {onSelectAll && !isAllSelected && totalCount > selectedCount && (
              <Button
                size="small"
                onClick={onSelectAll}
                sx={{
                  color: "#94A3B8",
                  textTransform: "none",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  "&:hover": { color: "#FFFFFF" },
                }}
              >
                Select all {totalCount} {itemLabel}
              </Button>
            )}

            {onDeselectAll && (
              <Button
                size="small"
                onClick={onDeselectAll}
                startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                sx={{
                  color: "#94A3B8",
                  textTransform: "none",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  "&:hover": { color: "#FFFFFF" },
                }}
              >
                Clear Selection
              </Button>
            )}
          </Stack>

          {/* Right: Delete Action */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="contained"
              color="error"
              size="small"
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress size={16} sx={{ color: "#FFFFFF" }} />
                ) : (
                  <DeleteIcon sx={{ fontSize: 18 }} />
                )
              }
              onClick={() => setConfirmOpen(true)}
              sx={{
                fontWeight: 700,
                textTransform: "none",
                fontSize: "0.8rem",
                px: 2,
                py: 0.6,
                borderRadius: "6px",
                bgcolor: "#DC2626",
                "&:hover": { bgcolor: "#B91C1C" },
              }}
            >
              Delete Selected ({selectedCount})
            </Button>
          </Stack>
        </Paper>
      </Slide>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => !loading && setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            p: 1,
            border: "1px solid #E2E8F0",
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.2, fontWeight: 800, color: "#0F172A", fontSize: "1.05rem" }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              bgcolor: "#FEE2E2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#DC2626",
            }}
          >
            <WarningAmberRoundedIcon sx={{ fontSize: 22 }} />
          </Box>
          Delete {selectedCount} {itemLabel}?
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ color: "#475569", fontSize: "0.85rem", mt: 0.5 }}>
            Are you sure you want to permanently delete the <strong>{selectedCount} selected {itemLabel.toLowerCase()}</strong>? This action cannot be reversed.
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 1, borderTop: "1px solid #F1F5F9" }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={loading}
            sx={{ color: "#64748B", fontWeight: 700, textTransform: "none", fontSize: "0.82rem" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={loading}
            startIcon={loading && <CircularProgress size={16} sx={{ color: "#FFFFFF" }} />}
            sx={{
              fontWeight: 800,
              textTransform: "none",
              fontSize: "0.82rem",
              px: 2.2,
              borderRadius: "6px",
              bgcolor: "#DC2626",
              "&:hover": { bgcolor: "#B91C1C" },
            }}
          >
            {loading ? "Deleting..." : `Yes, Delete (${selectedCount})`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BulkDeleteBar;
