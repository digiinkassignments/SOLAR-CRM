// ============================================================
// SUBSCRIPTION BANNER
// Expiring Soon aur Grace Period mein ye banner dikhega
// Har layout mein add karo — Admin, Manager, Sales
//
// File location: src/components/SubscriptionBanner.jsx
// Usage: AdminLayout.jsx, ManagerLayout.jsx, SalesLayout.jsx mein add karo
// <SubscriptionBanner />
// ============================================================

import React, { useEffect, useState } from "react";
import { Alert, Box, Button } from "@mui/material";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL;

const SubscriptionBanner = () => {
  const [warning, setWarning] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${API}/subscription/status`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (res.data.data?.warning) {
          setWarning(res.data.data.warning);
        }
      } catch {
        // Silent fail — banner nahi dikhega
      }
    };
    fetchStatus();
  }, []);

  if (!warning) return null;

  const severity = warning.type === "grace" ? "error" : "warning";

  return (
    <Box sx={{ position: "sticky", top: 0, zIndex: 1200 }}>
      <Alert
        severity={severity}
        sx={{ borderRadius: 0, fontWeight: 500 }}
        action={
          <Button
            color="inherit"
            size="small"
            variant="outlined"
            href="/payment"
            sx={{ fontWeight: 700 }}
          >
            Renew Now
          </Button>
        }
      >
        {warning.message}
      </Alert>
    </Box>
  );
};

export default SubscriptionBanner;
