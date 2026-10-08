import React from "react";
import { Dialog, DialogTitle, DialogContent, IconButton, Box, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import SolarCalculator from "../pages/Calculator/SolarCalculator";

const SolarCalculatorModal = ({ open, onClose, lead = null, onQuotationCreated = null }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "14px",
          bgcolor: "#FFFFFF",
          boxShadow: "0 8px 30px rgba(15, 23, 42, 0.16)",
          p: 0,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #E2E8F0",
          py: 2,
          px: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              bgcolor: "#0F172A",
              color: "#F59E0B",
              width: 36,
              height: 36,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SolarPowerIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A", fontFamily: "'Outfit', sans-serif" }}>
              Solar Sizing & Savings Calculator
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B", fontFamily: "'Inter', sans-serif" }}>
              {lead ? `Customer: ${lead.customer_name || "Lead"} | State: ${lead.state || "Rajasthan"}` : "Accurate system capacity, PM Surya Ghar subsidy & 25-yr ROI"}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#64748B", "&:hover": { color: "#0F172A" } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1.5, sm: 2.5 }, bgcolor: "#F8FAFC" }}>
        <SolarCalculator embeddedLead={lead} onQuotationCreated={onQuotationCreated} />
      </DialogContent>
    </Dialog>
  );
};

export default SolarCalculatorModal;
