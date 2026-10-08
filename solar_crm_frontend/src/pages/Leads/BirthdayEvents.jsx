import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert as MuiAlert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Breadcrumbs,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Call as CallIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  EditCalendar as EditCalendarIcon,
  Close as CloseIcon,
  Inbox as InboxIcon,
  HomeOutlined as HomeOutlinedIcon,
  NavigateNextRounded as NavigateNextRoundedIcon,
  FilterListOff as FilterListOffIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  SolarPower as SolarIcon,
  Send as SendIcon,
  ViewListOutlined as ViewListOutlinedIcon,
  TableChartOutlined as TableChartOutlinedIcon,
  CardGiftcard as CardGiftcardIcon,
} from "@mui/icons-material";

import {
  getBirthdayEvents,
  sendClientWish,
  updateLead,
} from "../../services/leadService";

import GreetingCardModal from "./GreetingCardModal";

/* ============================================================
   DESIGN TOKENS (EXACT CLEAN WHITISH MATCH WITH LEADS.JSX)
   ============================================================ */
const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  primarySoft: "#E6F0FA",
  secondary: "#F59E0B",
  secondaryDark: "#D97706",
  secondarySoft: "#FEF3C7",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  purple: "#7C3AED",
  purpleSoft: "#EDE9FE",
};

const MONTHS = [
  { value: "", label: "All Months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const cardSx = {
  borderRadius: "12px",
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.card,
  boxShadow: "none",
};

const primaryButtonSx = {
  height: 36,
  borderRadius: "6px",
  textTransform: "none",
  fontWeight: 700,
  fontSize: "0.78rem",
  px: 2,
  backgroundColor: COLORS.primary,
  whiteSpace: "nowrap",
  fontFamily: "'Inter', sans-serif",
  "&:hover": { backgroundColor: COLORS.primaryDark },
};

const outlinedButtonSx = {
  height: 36,
  borderRadius: "6px",
  textTransform: "none",
  fontWeight: 700,
  fontSize: "0.78rem",
  px: 1.8,
  borderColor: COLORS.border,
  backgroundColor: COLORS.card,
  color: COLORS.textPrimary,
  whiteSpace: "nowrap",
  fontFamily: "'Inter', sans-serif",
  "&:hover": { borderColor: COLORS.primary, backgroundColor: "#F8FAFC" },
};

const iconSquareBtnSx = {
  width: 36,
  height: 36,
  borderRadius: "6px",
  border: `1px solid ${COLORS.border}`,
  color: COLORS.primary,
  backgroundColor: COLORS.card,
  "&:hover": { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
};

const controlSx = {
  fontFamily: "'Inter', sans-serif",
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    backgroundColor: "#FAFBFC",
    fontSize: "0.78rem",
    color: COLORS.textPrimary,
    height: 36,
    "& fieldset": { borderColor: COLORS.border },
    "&:hover fieldset": { borderColor: COLORS.borderStrong },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary, borderWidth: "1.5px" },
  },
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    fontSize: "0.78rem",
  },
};

const dateControlSx = {
  ...controlSx,
  "& .MuiOutlinedInput-root": {
    ...controlSx["& .MuiOutlinedInput-root"],
    "& input[type='date']": {
      fontFamily: "'Inter', sans-serif",
      fontSize: "0.78rem",
      colorScheme: "light",
    },
  },
};

const FieldLabel = ({ children }) => (
  <Typography
    sx={{
      fontSize: "0.68rem",
      fontWeight: 800,
      color: COLORS.textSecondary,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      mb: 0.5,
      fontFamily: "'Inter', sans-serif",
    }}
  >
    {children}
  </Typography>
);

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function BirthdayEvents() {
  const navigate = useNavigate();

  // State
  const [events, setEvents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // View Mode: "box" or "table"
  const [viewMode, setViewMode] = useState("box");

  // Filters
  const [filterPeriod, setFilterPeriod] = useState("today"); // today | this_week | this_month | all
  const [selectedMonth, setSelectedMonth] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Email Dialog State
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTarget, setEmailTarget] = useState(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailCustomMessage, setEmailCustomMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Greeting Card Studio Modal State
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardTarget, setCardTarget] = useState({ lead: null, type: "birthday" });

  const handleOpenCardModal = useCallback((lead, type = "birthday") => {
    setCardTarget({ lead, type });
    setCardModalOpen(true);
  }, []);

  // Edit Dates Dialog State
  const [editDatesOpen, setEditDatesOpen] = useState(false);
  const [editTargetLead, setEditTargetLead] = useState(null);
  const [editDob, setEditDob] = useState("");
  const [editAnniversary, setEditAnniversary] = useState("");
  const [savingDates, setSavingDates] = useState(false);

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Fetch Events
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        filter: selectedMonth ? "month" : filterPeriod,
        month: selectedMonth || undefined,
        search: searchInput.trim() || undefined,
        page: page + 1,
        limit: rowsPerPage,
      };

      const res = await getBirthdayEvents(params);
      if (res?.success) {
        setEvents(res.data || []);
        setTotalCount(res.total || 0);
      } else {
        setEvents([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("Fetch birthday events error:", err);
      showSnackbar("Failed to load celebration events", "error");
      setEvents([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filterPeriod, selectedMonth, searchInput, page, rowsPerPage, showSnackbar]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Derived Stats
  const todayBirthdaysCount = useMemo(() => {
    return events.filter((e) => Number(e.is_birthday_today) === 1).length;
  }, [events]);

  const todayAnniversariesCount = useMemo(() => {
    return events.filter((e) => Number(e.is_anniversary_today) === 1).length;
  }, [events]);

  // Handle WhatsApp Wish (Corporate Clean Greeting)
  const handleOpenWhatsAppWish = useCallback((lead, type) => {
    const isBirthday = type === "birthday";
    const defaultMsg = isBirthday
      ? `Dear ${lead.customer_name},\n\nWarm greetings from our Solar team. Wishing you a very Happy Birthday! May this year bring continued happiness, good health, and success.\n\nWarm regards,\nSolar Power Solutions`
      : `Dear ${lead.customer_name},\n\nHeartiest congratulations on your Anniversary! Wishing you and your family lasting happiness and prosperity.\n\nWarm regards,\nSolar Power Solutions`;

    const cleanPhone = (lead.mobile_number || "").replace(/\D/g, "");
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const encoded = encodeURIComponent(defaultMsg);
    window.open(`https://wa.me/${phoneWithCountry}?text=${encoded}`, "_blank", "noopener,noreferrer");

    sendClientWish({
      lead_id: lead.id,
      event_type: type,
      channel: "whatsapp",
      custom_message: defaultMsg,
    }).catch(() => {});
  }, []);

  // Open Email Dialog
  const handleOpenEmailDialog = useCallback((lead, type) => {
    setEmailTarget({ lead, type });
    const isBirthday = type === "birthday";
    const subject = isBirthday
      ? `Warm Birthday Greetings, ${lead.customer_name} | Solar Team`
      : `Heartiest Wedding Anniversary Wishes, ${lead.customer_name} | Solar Team`;
    const message = isBirthday
      ? `Dear ${lead.customer_name},\n\nWarmest greetings on your Birthday! We value our association with you and wish you a year ahead filled with health, joy, and prosperity.\n\nWarm regards,\nSolar Power Solutions Team`
      : `Dear ${lead.customer_name},\n\nHeartiest congratulations on your wedding anniversary! May your special day be filled with warm memories and happiness.\n\nWarm regards,\nSolar Power Solutions Team`;

    setEmailSubject(subject);
    setEmailCustomMessage(message);
    setEmailDialogOpen(true);
  }, []);

  // Send Email Wish
  const handleSendEmailWish = useCallback(async () => {
    if (!emailTarget?.lead) return;
    setSendingEmail(true);
    try {
      const res = await sendClientWish({
        lead_id: emailTarget.lead.id,
        event_type: emailTarget.type,
        channel: "email",
        custom_message: emailCustomMessage,
      });

      if (res?.success) {
        showSnackbar("Greeting email sent successfully.", "success");
        setEmailDialogOpen(false);
      } else {
        throw new Error(res?.message || "Failed to send email");
      }
    } catch (err) {
      showSnackbar(err.response?.data?.message || err.message || "Failed to send email.", "error");
    } finally {
      setSendingEmail(false);
    }
  }, [emailTarget, emailCustomMessage, showSnackbar]);

  // Open Edit Dates
  const handleOpenEditDates = useCallback((lead) => {
    setEditTargetLead(lead);
    setEditDob(lead.dob ? lead.dob.substring(0, 10) : "");
    setEditAnniversary(lead.anniversary_date ? lead.anniversary_date.substring(0, 10) : "");
    setEditDatesOpen(true);
  }, []);

  // Save Dates
  const handleSaveDates = useCallback(async () => {
    if (!editTargetLead) return;
    setSavingDates(true);
    try {
      await updateLead(editTargetLead.id, {
        customer_name: editTargetLead.customer_name,
        dob: editDob || null,
        anniversary_date: editAnniversary || null,
      });
      showSnackbar("Celebration dates updated successfully.", "success");
      setEditDatesOpen(false);
      fetchEvents();
    } catch (err) {
      showSnackbar(err.response?.data?.message || "Failed to update dates.", "error");
    } finally {
      setSavingDates(false);
    }
  }, [editTargetLead, editDob, editAnniversary, showSnackbar, fetchEvents]);

  const handleResetFilters = useCallback(() => {
    setFilterPeriod("today");
    setSelectedMonth("");
    setSearchInput("");
    setPage(0);
  }, []);

  const handleCall = useCallback((mobile) => {
    if (!mobile) return;
    window.location.href = `tel:${mobile}`;
  }, []);

  return (
    <Box sx={{ backgroundColor: COLORS.bg, minHeight: "100vh", p: 2, boxSizing: "border-box", width: "100%" }}>
      <Box sx={{ width: "100%", maxWidth: "100%", mx: "auto" }}>

        {/* BREADCRUMBS */}
        <Breadcrumbs separator={<NavigateNextRoundedIcon sx={{ fontSize: "0.8rem", color: COLORS.textMuted }} />} sx={{ mb: 1.5 }}>
          <Stack direction="row" alignItems="center" gap={0.5}>
            <HomeOutlinedIcon sx={{ fontSize: "0.8rem", color: COLORS.textMuted }} />
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: COLORS.textMuted }}>
              Dashboard
            </Typography>
          </Stack>
          <Typography
            onClick={() => navigate("/leads")}
            sx={{ fontSize: "0.75rem", fontWeight: 600, color: COLORS.textMuted, cursor: "pointer", "&:hover": { color: COLORS.primary } }}
          >
            Lead Management
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.primaryDark }}>
            Birthdays &amp; Events
          </Typography>
        </Breadcrumbs>

        {/* HERO HEADER (CLEAN & WHITISH) */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 1.5,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1.05rem" }}>
              Client Milestones &amp; Events
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.75rem", mt: 0.1 }}>
              Track customer birthdays, wedding anniversaries and dispatch greetings via WhatsApp or Email.
            </Typography>
          </Box>

          <Stack direction="row" alignItems="center" gap={1} sx={{ flexShrink: 0, flexWrap: "wrap" }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newView) => newView && setViewMode(newView)}
              size="small"
              sx={{
                height: 36,
                backgroundColor: "#F1F5F9",
                borderRadius: "6px",
                p: 0.3,
                "& .MuiToggleButton-root": {
                  border: 0,
                  borderRadius: "4px",
                  px: 1.2,
                  py: 0.4,
                  color: COLORS.textSecondary,
                  "&.Mui-selected": {
                    backgroundColor: COLORS.card,
                    color: COLORS.primary,
                    fontWeight: 700,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  },
                },
              }}
            >
              <ToggleButton value="box">
                <Tooltip title="Box List View">
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <ViewListOutlinedIcon sx={{ fontSize: 17 }} />
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700 }}>Box</Typography>
                  </Stack>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="table">
                <Tooltip title="Table View">
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <TableChartOutlinedIcon sx={{ fontSize: 17 }} />
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700 }}>Table</Typography>
                  </Stack>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            <Tooltip title="Refresh Events">
              <IconButton onClick={fetchEvents} disabled={loading} size="small" sx={iconSquareBtnSx}>
                <RefreshIcon
                  sx={{
                    fontSize: 17,
                    animation: loading ? "spin 0.8s linear infinite" : "none",
                    "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                  }}
                />
              </IconButton>
            </Tooltip>

            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate("/leads")}
              sx={outlinedButtonSx}
            >
              All Leads Directory
            </Button>
          </Stack>
        </Paper>

        {/* 4 METRIC STAT CARDS (CLEAN WHITISH CSS GRID - GUARANTEES 1 ROW OF 4 CARDS) */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
            mb: 2,
            width: "100%",
          }}
        >
          <Paper
            elevation={0}
            onClick={() => { setFilterPeriod("today"); setSelectedMonth(""); }}
            sx={{
              ...cardSx,
              p: 2,
              cursor: "pointer",
              border: `1.5px solid ${filterPeriod === "today" && !selectedMonth ? COLORS.primary : COLORS.border}`,
              "&:hover": { borderColor: COLORS.primary },
            }}
          >
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Today's Birthdays
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary, mt: 0.5 }}>
              {todayBirthdaysCount}
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textMuted, mt: 0.5, display: "block" }}>
              {todayBirthdaysCount > 0 ? "Clients celebrating birthday today" : "No birthdays scheduled today"}
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            onClick={() => { setFilterPeriod("today"); setSelectedMonth(""); }}
            sx={{
              ...cardSx,
              p: 2,
              cursor: "pointer",
              border: `1.5px solid ${COLORS.border}`,
              "&:hover": { borderColor: COLORS.primary },
            }}
          >
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Today's Anniversaries
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary, mt: 0.5 }}>
              {todayAnniversariesCount}
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textMuted, mt: 0.5, display: "block" }}>
              {todayAnniversariesCount > 0 ? "Wedding anniversaries today" : "No anniversaries scheduled today"}
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            onClick={() => { setFilterPeriod("this_month"); setSelectedMonth(""); }}
            sx={{
              ...cardSx,
              p: 2,
              cursor: "pointer",
              border: `1.5px solid ${filterPeriod === "this_month" ? COLORS.primary : COLORS.border}`,
              "&:hover": { borderColor: COLORS.primary },
            }}
          >
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              This Month Events
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.primary, mt: 0.5 }}>
              {filterPeriod === "this_month" ? totalCount : "View"}
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textMuted, mt: 0.5, display: "block" }}>
              Client milestones current month
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            onClick={() => { setFilterPeriod("all"); setSelectedMonth(""); }}
            sx={{
              ...cardSx,
              p: 2,
              cursor: "pointer",
              border: `1.5px solid ${filterPeriod === "all" && !selectedMonth ? COLORS.primary : COLORS.border}`,
              "&:hover": { borderColor: COLORS.primary },
            }}
          >
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              All Registered Clients
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.primary, mt: 0.5 }}>
              {filterPeriod === "all" ? totalCount : "All"}
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textMuted, mt: 0.5, display: "block" }}>
              Customer milestone repository
            </Typography>
          </Paper>
        </Box>

        {/* EXTENSIVE FILTERS BAR */}
        <Paper elevation={0} sx={{ ...cardSx, p: 1.8, mb: 2, width: "100%", boxSizing: "border-box" }}>
          <Stack spacing={1.5}>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 1.2, width: "100%" }}>
              <Box sx={{ flex: "1 1 200px", minWidth: 150 }}>
                <FieldLabel>Filter Period</FieldLabel>
                <Select
                  fullWidth
                  size="small"
                  value={filterPeriod}
                  onChange={(e) => {
                    setFilterPeriod(e.target.value);
                    setSelectedMonth("");
                    setPage(0);
                  }}
                  sx={controlSx}
                >
                  <MenuItem value="today" sx={{ fontSize: "0.78rem" }}>Today's Milestones</MenuItem>
                  <MenuItem value="this_week" sx={{ fontSize: "0.78rem" }}>This Week (Next 7 Days)</MenuItem>
                  <MenuItem value="this_month" sx={{ fontSize: "0.78rem" }}>This Current Month</MenuItem>
                  <MenuItem value="all" sx={{ fontSize: "0.78rem" }}>All Registered Leads</MenuItem>
                </Select>
              </Box>

              <Box sx={{ flex: "1 1 180px", minWidth: 150 }}>
                <FieldLabel>Filter Specific Month</FieldLabel>
                <Select
                  fullWidth
                  size="small"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setPage(0);
                  }}
                  displayEmpty
                  sx={controlSx}
                >
                  {MONTHS.map((m) => (
                    <MenuItem key={m.value} value={m.value} sx={{ fontSize: "0.78rem" }}>
                      {m.label}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>

            <Divider sx={{ borderColor: COLORS.border }} />

            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 1.2, width: "100%" }}>
              <Box sx={{ flex: "1 1 240px", minWidth: 200 }}>
                <FieldLabel>Search Customer</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Name, phone, email, ID..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchEvents()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: 16, color: COLORS.textMuted }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={controlSx}
                />
              </Box>

              <Button
                variant="outlined"
                size="small"
                onClick={handleResetFilters}
                startIcon={<FilterListOffIcon sx={{ fontSize: 15 }} />}
                sx={outlinedButtonSx}
              >
                Reset
              </Button>
            </Box>
          </Stack>
        </Paper>

        {/* EVENTS LIST / CONTENT */}
        {loading ? (
          <Stack spacing={1.5}>
            {[1, 2, 3].map((sk) => (
              <Skeleton key={sk} variant="rounded" height={140} sx={{ borderRadius: "10px" }} />
            ))}
          </Stack>
        ) : events.length === 0 ? (
          <Paper elevation={0} sx={{ ...cardSx, p: 6, textAlign: "center" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "#F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 1.5,
                color: COLORS.textMuted,
              }}
            >
              <InboxIcon sx={{ fontSize: 28 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.textPrimary, mb: 0.5 }}>
              No Celebration Events Found
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textMuted, maxWidth: 420, mx: "auto", mb: 2 }}>
              No client birthdays or wedding anniversaries found for the selected filter. You can record milestone dates in the lead form.
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => { setFilterPeriod("all"); setSelectedMonth(""); setSearchInput(""); }}
              sx={primaryButtonSx}
            >
              View All Registered Clients
            </Button>
          </Paper>
        ) : viewMode === "box" ? (
          /* ============================================================
             BOX VIEW (EXACT MATCH LEADS.JSX)
             ============================================================ */
          <Stack spacing={1.5}>
            {events.map((client) => {
              const isBirthdayToday = Number(client.is_birthday_today) === 1;
              const isAnniversaryToday = Number(client.is_anniversary_today) === 1;

              return (
                <Paper
                  key={client.id}
                  elevation={0}
                  sx={{
                    borderRadius: "12px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderLeft: isBirthdayToday
                      ? "4px solid #F59E0B"
                      : isAnniversaryToday
                        ? "4px solid #8B5CF6"
                        : "4px solid #CBD5E1",
                    p: { xs: 1.8, sm: 2 },
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: "#CBD5E1",
                      borderLeftColor: isBirthdayToday ? "#D97706" : isAnniversaryToday ? "#7C3AED" : "#94A3B8",
                      boxShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
                    },
                  }}
                >
                  {/* Top Header: Client ID, Name, Milestone Badge & Actions */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.4, flexWrap: "wrap", gap: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1.2} flexWrap="wrap">
                      {/* Lead Code Badge (Exact Match to Leads.jsx) */}
                      <Box
                        sx={{
                          px: 1,
                          py: 0.25,
                          borderRadius: "6px",
                          backgroundColor: "#EFF6FF",
                          border: "1px solid #BFDBFE",
                          color: "#1D4ED8",
                          fontWeight: 800,
                          fontSize: "0.78rem",
                          fontFamily: "monospace",
                          letterSpacing: "0.03em",
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                      >
                        {client.lead_code || `LE${String(client.id).padStart(5, "0")}`}
                      </Box>

                      {/* Customer Name */}
                      <Typography sx={{ fontWeight: 800, fontSize: "0.98rem", color: "#0F172A", letterSpacing: "-0.01em" }}>
                        {client.customer_name || "Untitled Lead"}
                      </Typography>

                      {/* Celebration Status Badges */}
                      {isBirthdayToday && (
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 1.2,
                            py: 0.35,
                            borderRadius: "20px",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            backgroundColor: "#FEF3C7",
                            color: "#B45309",
                            border: "1px solid #FDE68A",
                            boxShadow: "0 1px 2px rgba(245, 158, 11, 0.1)",
                          }}
                        >
                          <span>🎂</span> Birthday Today
                        </Box>
                      )}

                      {isAnniversaryToday && (
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 1.2,
                            py: 0.35,
                            borderRadius: "20px",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            backgroundColor: "#F3E8FF",
                            color: "#6B21A8",
                            border: "1px solid #E9D5FF",
                            boxShadow: "0 1px 2px rgba(139, 92, 246, 0.1)",
                          }}
                        >
                          <span>💍</span> Anniversary Today
                        </Box>
                      )}
                    </Stack>

                    {/* Action Buttons Right Side */}
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                      {/* Bada & Beautiful Wishes Card Button */}
                      <Button
                        size="small"
                        startIcon={<CardGiftcardIcon sx={{ fontSize: 16 }} />}
                        onClick={() => handleOpenCardModal(client, isBirthdayToday ? "birthday" : (isAnniversaryToday ? "anniversary" : "birthday"))}
                        sx={{
                          color: "#0F172A",
                          background: "linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)",
                          fontWeight: 800,
                          fontSize: "0.76rem",
                          borderRadius: "6px",
                          px: 1.8,
                          height: 32,
                          boxShadow: "0 2px 6px rgba(245, 158, 11, 0.22)",
                          textTransform: "none",
                          "&:hover": {
                            background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                            color: "#FFFFFF",
                            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.35)",
                          },
                        }}
                      >
                        Create Wishes Card ✨
                      </Button>

                      {/* WhatsApp Button */}
                      <Button
                        size="small"
                        startIcon={<WhatsAppIcon sx={{ fontSize: 15 }} />}
                        onClick={() => handleOpenWhatsAppWish(client, isBirthdayToday ? "birthday" : "anniversary")}
                        sx={{
                          color: "#15803D",
                          backgroundColor: "#DCFCE7",
                          border: "1px solid #BBF7D0",
                          fontWeight: 700,
                          fontSize: "0.74rem",
                          borderRadius: "6px",
                          px: 1.4,
                          height: 32,
                          textTransform: "none",
                          "&:hover": { backgroundColor: "#16A34A", color: "#FFFFFF", borderColor: "#16A34A" },
                        }}
                      >
                        WhatsApp
                      </Button>

                      {/* Call Button */}
                      <Button
                        size="small"
                        startIcon={<CallIcon sx={{ fontSize: 15 }} />}
                        onClick={() => handleCall(client.mobile_number)}
                        sx={{
                          color: "#0F172A",
                          backgroundColor: "#F1F5F9",
                          border: "1px solid #E2E8F0",
                          fontWeight: 700,
                          fontSize: "0.74rem",
                          borderRadius: "6px",
                          px: 1.4,
                          height: 32,
                          textTransform: "none",
                          "&:hover": { backgroundColor: "#0F172A", color: "#FFFFFF", borderColor: "#0F172A" },
                        }}
                      >
                        CALL
                      </Button>

                      {/* Email Button */}
                      {client.email && (
                        <Button
                          size="small"
                          startIcon={<EmailIcon sx={{ fontSize: 15 }} />}
                          onClick={() => handleOpenEmailDialog(client, isBirthdayToday ? "birthday" : "anniversary")}
                          sx={{
                            color: "#0F172A",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #CBD5E1",
                            fontWeight: 700,
                            fontSize: "0.74rem",
                            borderRadius: "6px",
                            px: 1.4,
                            height: 32,
                            textTransform: "none",
                            "&:hover": { backgroundColor: "#F8FAFC", borderColor: "#94A3B8" },
                          }}
                        >
                          Email
                        </Button>
                      )}

                      {/* Edit Dates Icon Button */}
                      <Tooltip title="Edit Milestone Dates">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditDates(client)}
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: "6px",
                            color: "#64748B",
                            backgroundColor: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            "&:hover": { backgroundColor: "#E2E8F0", color: "#0F172A" },
                          }}
                        >
                          <EditCalendarIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>

                  <Divider sx={{ mb: 1.4, borderColor: "#F1F5F9" }} />

                  {/* 3 Column Details Layout */}
                  <Grid container spacing={2}>
                    {/* Column 1: Milestone Dates */}
                    <Grid item xs={12} sm={4}>
                      <Stack spacing={0.8}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                          <CalendarIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                          <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                            Date of Birth: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{client.dob ? formatDate(client.dob) : "Not recorded"}</Box>
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                          <CalendarIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                          <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                            Anniversary: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{client.anniversary_date ? formatDate(client.anniversary_date) : "Not recorded"}</Box>
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>

                    {/* Column 2: Contact Details */}
                    <Grid item xs={12} sm={4}>
                      <Stack spacing={0.8}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                          <PhoneIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                          <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                            Phone: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{client.mobile_number || "—"}</Box>
                          </Typography>
                        </Box>

                        {client.email && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                            <EmailIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                            <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, overflow: "hidden", textOverflow: "ellipsis" }}>
                              {client.email}
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                          <LocationIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                          <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                            Location: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{[client.city, client.state].filter(Boolean).join(", ") || "—"}</Box>
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>

                    {/* Column 3: Assignment & System */}
                    <Grid item xs={12} sm={4}>
                      <Stack spacing={0.8}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                          <PersonIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                          <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                            Assigned To: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{client.assigned_to_name || "Unassigned"}</Box>
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                          <SolarIcon sx={{ fontSize: 15, color: COLORS.textMuted }} />
                          <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                            System: <Box component="span" sx={{ fontWeight: 600 }}>{client.solar_requirement || "Residential"}</Box>
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>
                </Paper>
              );
            })}
          </Stack>
        ) : (
          /* ============================================================
             TABLE VIEW
             ============================================================ */
          <TableContainer component={Paper} elevation={0} sx={{ ...cardSx, overflow: "hidden" }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: COLORS.primary }}>
                <TableRow>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Lead ID</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Customer Name</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Mobile</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Date of Birth</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Anniversary Date</TableCell>
                  <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Assigned To</TableCell>
                  <TableCell align="right" sx={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map((client) => {
                  const isAnniversary = Number(client.is_anniversary_today) === 1;

                  return (
                    <TableRow key={client.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell sx={{ fontSize: "0.75rem", fontWeight: 700 }}>
                        {client.lead_code || `LE${String(client.id).padStart(5, "0")}`}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.78rem", fontWeight: 600 }}>{client.customer_name}</TableCell>
                      <TableCell sx={{ fontSize: "0.75rem" }}>{client.mobile_number}</TableCell>
                      <TableCell sx={{ fontSize: "0.75rem" }}>{client.dob ? formatDate(client.dob) : "—"}</TableCell>
                      <TableCell sx={{ fontSize: "0.75rem" }}>{client.anniversary_date ? formatDate(client.anniversary_date) : "—"}</TableCell>
                      <TableCell sx={{ fontSize: "0.75rem" }}>{client.assigned_to_name || "Unassigned"}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Create Wishes Card ✨">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenCardModal(client, isAnniversary ? "anniversary" : "birthday")}
                              sx={{
                                color: "#D97706",
                                backgroundColor: "#FEF3C7",
                                width: 28,
                                height: 28,
                                borderRadius: "6px",
                                "&:hover": { backgroundColor: "#D97706", color: "#FFFFFF" },
                              }}
                            >
                              <CardGiftcardIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <IconButton size="small" onClick={() => handleOpenWhatsAppWish(client, "birthday")}>
                            <WhatsAppIcon sx={{ fontSize: 16, color: "#16A34A" }} />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleOpenEditDates(client)}>
                            <EditCalendarIcon sx={{ fontSize: 16, color: COLORS.textSecondary }} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* PAGINATION */}
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[12, 24, 48]}
          sx={{ mt: 2, borderTop: `1px solid ${COLORS.border}` }}
        />

        {/* ================= EMAIL WISH MODAL ================= */}
        <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "12px", overflow: "hidden" } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2.5, py: 1.8, backgroundColor: COLORS.primary, color: "#FFFFFF" }}>
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>
              Send {emailTarget?.type === "anniversary" ? "Anniversary" : "Birthday"} Greeting
            </Typography>
            <IconButton size="small" onClick={() => setEmailDialogOpen(false)} sx={{ color: "#FFFFFF" }}><CloseIcon fontSize="small" /></IconButton>
          </Box>
          <DialogContent sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.8 }}>
            <Box sx={{ p: 1.2, borderRadius: "6px", bgcolor: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary }}>
                Recipient: {emailTarget?.lead?.customer_name} ({emailTarget?.lead?.email || "No email"})
              </Typography>
            </Box>
            <Box>
              <FieldLabel>Subject Line</FieldLabel>
              <TextField fullWidth size="small" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} sx={controlSx} />
            </Box>
            <Box>
              <FieldLabel>Message Content</FieldLabel>
              <TextField fullWidth multiline rows={5} size="small" value={emailCustomMessage} onChange={(e) => setEmailCustomMessage(e.target.value)} sx={controlSx} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}` }}>
            <Button variant="outlined" onClick={() => setEmailDialogOpen(false)} sx={outlinedButtonSx}>Cancel</Button>
            <Button
              variant="contained"
              startIcon={sendingEmail ? <CircularProgress size={14} color="inherit" /> : <SendIcon sx={{ fontSize: 14 }} />}
              disabled={sendingEmail || !emailTarget?.lead?.email}
              onClick={handleSendEmailWish}
              sx={primaryButtonSx}
            >
              {sendingEmail ? "Sending..." : "Send Greeting"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ================= EDIT CELEBRATION DATES MODAL ================= */}
        <Dialog open={editDatesOpen} onClose={() => setEditDatesOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "12px", overflow: "hidden" } }}>
          <Box sx={{ p: 2, backgroundColor: COLORS.primary, color: "#FFFFFF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>Edit Milestone Dates</Typography>
            <IconButton size="small" onClick={() => setEditDatesOpen(false)} sx={{ color: "#FFFFFF" }}><CloseIcon fontSize="small" /></IconButton>
          </Box>
          <DialogContent sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.8 }}>
            <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}>
              Update celebration dates for <strong>{editTargetLead?.customer_name}</strong>:
            </Typography>
            <Box>
              <FieldLabel>Date of Birth</FieldLabel>
              <TextField fullWidth size="small" type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} InputLabelProps={{ shrink: true }} sx={dateControlSx} />
            </Box>
            <Box>
              <FieldLabel>Wedding / Anniversary Date</FieldLabel>
              <TextField fullWidth size="small" type="date" value={editAnniversary} onChange={(e) => setEditAnniversary(e.target.value)} InputLabelProps={{ shrink: true }} sx={dateControlSx} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}` }}>
            <Button variant="outlined" onClick={() => setEditDatesOpen(false)} sx={outlinedButtonSx}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveDates} disabled={savingDates} sx={primaryButtonSx}>
              {savingDates ? "Saving..." : "Save Dates"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ================= GREETING CARD STUDIO MODAL ================= */}
        <GreetingCardModal
          open={cardModalOpen}
          onClose={() => setCardModalOpen(false)}
          lead={cardTarget.lead}
          defaultEventType={cardTarget.type}
        />

        {/* TOAST SNACKBAR */}
        <Snackbar open={snackbar.open} autoHideDuration={3500} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <MuiAlert onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: "100%", fontWeight: 600, fontSize: "0.8rem" }}>
            {snackbar.message}
          </MuiAlert>
        </Snackbar>
      </Box>
    </Box>
  );
}
