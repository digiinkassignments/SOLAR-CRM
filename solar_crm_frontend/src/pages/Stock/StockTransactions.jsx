import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box, Typography, Paper, Grid, TextField, MenuItem,
  Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, LinearProgress, Button, InputAdornment,
  Avatar, Pagination
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import toast from "react-hot-toast";

import { getStockTransactions } from "../../services/stockService";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000";

const StockTransactions = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const itemIdParam = searchParams.get("item_id") || "";

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [txnType, setTxnType] = useState("");
  const [refType, setRefType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStockTransactions({
        item_id: itemIdParam,
        transaction_type: txnType,
        reference_type: refType,
        search,
        start_date: startDate,
        end_date: endDate,
        page,
        limit: 25,
      });

      setTransactions(res.data || []);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load stock transaction logs.");
    } finally {
      setLoading(false);
    }
  }, [itemIdParam, txnType, refType, search, startDate, endDate, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const totalInValue = transactions
    .filter((t) => t.transaction_type === "IN")
    .reduce((sum, t) => sum + Number(t.total_value || 0), 0);

  const totalOutValue = transactions
    .filter((t) => t.transaction_type === "OUT")
    .reduce((sum, t) => sum + Number(t.total_value || 0), 0);

  return (
    <Box sx={{ pb: 6 }}>
      {/* Top Header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: 1.5 }}>
            <ReceiptLongIcon sx={{ color: "#3B82F6", fontSize: 32 }} /> Stock Transaction History
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            Audit log of all inward purchases, outward dispatches, site allocations & adjustments.
          </Typography>
        </Box>

        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/stock")}
          sx={{ color: "#64748B", fontWeight: 600 }}
        >
          Back to Stock Grid
        </Button>
      </Box>

      {/* Summary Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2.5, borderRadius: "12px", borderLeft: "4px solid #3B82F6", backgroundColor: "#FFFFFF" }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748B" }}>TOTAL TRANSACTIONS LOGGED</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#0F172A", my: 0.5, fontFamily: "'Outfit', sans-serif" }}>
              {totalCount}
            </Typography>
            <Typography variant="caption" color="textSecondary">All historical stock movements</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2.5, borderRadius: "12px", borderLeft: "4px solid #16A34A", backgroundColor: "#FFFFFF" }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "#15803D" }}>PAGE INWARD PURCHASES (IN)</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#16A34A", my: 0.5, fontFamily: "'Outfit', sans-serif" }}>
              ₹{totalInValue.toLocaleString("en-IN")}
            </Typography>
            <Typography variant="caption" color="textSecondary">Stock added to warehouse</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2.5, borderRadius: "12px", borderLeft: "4px solid #DC2626", backgroundColor: "#FFFFFF" }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "#B91C1C" }}>PAGE OUTWARD DISPATCHES (OUT)</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#DC2626", my: 0.5, fontFamily: "'Outfit', sans-serif" }}>
              ₹{totalOutValue.toLocaleString("en-IN")}
            </Typography>
            <Typography variant="caption" color="textSecondary">Stock issued for projects/leads</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Toolbar matching Leads.jsx style */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: "12px", border: "1px solid #E2E8F0", backgroundColor: "#FFFFFF" }}>
        <Grid container spacing={1.5} alignItems="flex-end">
          <Grid item xs={12} sm={6} md={3.5}>
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", mb: 0.5 }}>
              Search Transactions
            </Typography>
            <TextField
              placeholder="Search by Txn #, Item, SKU, Vendor, Invoice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#94A3B8", fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  backgroundColor: "#FAFBFC",
                  fontSize: "0.8125rem",
                  height: 38,
                  "& fieldset": { borderColor: "#E2E8F0" },
                  "&:hover fieldset": { borderColor: "#CBD5E1" },
                  "&.Mui-focused fieldset": { borderColor: "#0F172A", borderWidth: "1.5px" },
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", mb: 0.5 }}>
              Transaction Type
            </Typography>
            <TextField
              select
              value={txnType}
              onChange={(e) => setTxnType(e.target.value)}
              fullWidth
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  backgroundColor: "#FAFBFC",
                  fontSize: "0.8125rem",
                  height: 38,
                  "& fieldset": { borderColor: "#E2E8F0" },
                  "&:hover fieldset": { borderColor: "#CBD5E1" },
                  "&.Mui-focused fieldset": { borderColor: "#0F172A", borderWidth: "1.5px" },
                },
              }}
            >
              <MenuItem value="" sx={{ fontSize: "0.8rem" }}>All Types</MenuItem>
              <MenuItem value="IN" sx={{ fontSize: "0.8rem" }}>IN (Purchase/Restock)</MenuItem>
              <MenuItem value="OUT" sx={{ fontSize: "0.8rem" }}>OUT (Dispatch/Issue)</MenuItem>
              <MenuItem value="ADJUSTMENT" sx={{ fontSize: "0.8rem" }}>Stock Adjustment</MenuItem>
              <MenuItem value="RESERVED" sx={{ fontSize: "0.8rem" }}>Reserved</MenuItem>
              <MenuItem value="RELEASED" sx={{ fontSize: "0.8rem" }}>Released</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", mb: 0.5 }}>
              Reference Type
            </Typography>
            <TextField
              select
              value={refType}
              onChange={(e) => setRefType(e.target.value)}
              fullWidth
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  backgroundColor: "#FAFBFC",
                  fontSize: "0.8125rem",
                  height: 38,
                  "& fieldset": { borderColor: "#E2E8F0" },
                  "&:hover fieldset": { borderColor: "#CBD5E1" },
                  "&.Mui-focused fieldset": { borderColor: "#0F172A", borderWidth: "1.5px" },
                },
              }}
            >
              <MenuItem value="" sx={{ fontSize: "0.8rem" }}>All References</MenuItem>
              <MenuItem value="PURCHASE" sx={{ fontSize: "0.8rem" }}>Purchase Order</MenuItem>
              <MenuItem value="LEAD" sx={{ fontSize: "0.8rem" }}>Lead Requirement</MenuItem>
              <MenuItem value="PROJECT" sx={{ fontSize: "0.8rem" }}>Project Order</MenuItem>
              <MenuItem value="RETURN" sx={{ fontSize: "0.8rem" }}>Customer Return</MenuItem>
              <MenuItem value="DAMAGE" sx={{ fontSize: "0.8rem" }}>Damaged / Scrap</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2.25}>
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", mb: 0.5 }}>
              From Date
            </Typography>
            <TextField
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  backgroundColor: "#FAFBFC",
                  fontSize: "0.8125rem",
                  height: 38,
                  "& fieldset": { borderColor: "#E2E8F0" },
                  "&:hover fieldset": { borderColor: "#CBD5E1" },
                  "&.Mui-focused fieldset": { borderColor: "#0F172A", borderWidth: "1.5px" },
                },
                "& input": {
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.8125rem",
                  colorScheme: "light",
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2.25}>
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", mb: 0.5 }}>
              To Date
            </Typography>
            <TextField
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  backgroundColor: "#FAFBFC",
                  fontSize: "0.8125rem",
                  height: 38,
                  "& fieldset": { borderColor: "#E2E8F0" },
                  "&:hover fieldset": { borderColor: "#CBD5E1" },
                  "&.Mui-focused fieldset": { borderColor: "#0F172A", borderWidth: "1.5px" },
                },
                "& input": {
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.8125rem",
                  colorScheme: "light",
                },
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Loading bar */}
      {loading && <LinearProgress color="warning" sx={{ mb: 2, borderRadius: "4px" }} />}

      {/* Transactions Table */}
      <TableContainer component={Paper} sx={{ borderRadius: "16px", border: "1px solid #E2E8F0" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#0F172A" }}>
            <TableRow>
              <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Txn #</TableCell>
              <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Item Details</TableCell>
              <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Quantity</TableCell>
              <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Stock (Before → After)</TableCell>
              <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Unit Price</TableCell>
              <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Total Value</TableCell>
              <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Reference / Vendor</TableCell>
              <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>User</TableCell>
              <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>Date & Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((txn) => (
              <TableRow key={txn.id} hover>
                <TableCell sx={{ fontWeight: 700, color: "#3B82F6" }}>
                  {txn.transaction_number}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar
                      src={txn.item_image ? `${API_BASE_URL}${txn.item_image.startsWith("/") ? "" : "/"}${txn.item_image}` : undefined}
                      sx={{ width: 32, height: 32, bgcolor: "rgba(245,158,11,0.15)", color: "#F59E0B", fontSize: "0.85rem" }}
                    >
                      {txn.item_name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A", cursor: "pointer" }} onClick={() => navigate(`/stock/${txn.item_id}`)}>
                        {txn.item_name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">{txn.item_code} • {txn.category_name}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={txn.transaction_type}
                    size="small"
                    color={
                      txn.transaction_type === "IN" ? "success" :
                      txn.transaction_type === "OUT" ? "error" : "warning"
                    }
                    sx={{ fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{txn.quantity} {txn.item_unit}</TableCell>
                <TableCell>{txn.quantity_before} → <strong>{txn.quantity_after}</strong></TableCell>
                <TableCell>₹{Number(txn.unit_price || 0).toLocaleString("en-IN")}</TableCell>
                <TableCell sx={{ fontWeight: 700, color: txn.transaction_type === "IN" ? "#16A34A" : "#DC2626" }}>
                  ₹{Number(txn.total_value || 0).toLocaleString("en-IN")}
                </TableCell>
                <TableCell>
                  <Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>
                    {txn.reference_type} {txn.reference_number ? `(${txn.reference_number})` : ""}
                  </Typography>
                  {txn.vendor_name && <Typography variant="caption" color="textSecondary">{txn.vendor_name}</Typography>}
                </TableCell>
                <TableCell>{txn.created_by_name || "Admin"}</TableCell>
                <TableCell>{new Date(txn.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4, color: "#94A3B8" }}>
                  No transaction logs match the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {Math.ceil(totalCount / 25) > 1 && (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Pagination
            count={Math.ceil(totalCount / 25)}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="warning"
          />
        </Box>
      )}
    </Box>
  );
};

export default StockTransactions;
