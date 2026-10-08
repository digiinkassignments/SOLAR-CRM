// ======================================================
// 1. IMPORTS
// ======================================================
import React, { useState, useEffect, useCallback, useMemo } from "react";
import usePlanFeatures from "../../hooks/usePlanFeatures";
import * as XLSX from "xlsx";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment,
  Switch,
  CircularProgress,
  Snackbar,
  Alert,
  Slide,
  Breadcrumbs,
  Stack,
  Select,
  Card,
  CardContent,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from "@mui/material";

// Material UI Icons
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import BadgeIcon from "@mui/icons-material/Badge";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

// Services (API Layer)
import {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
} from "../../services/userServices";

import { getSettings } from "../../services/settingsService";

// ======================================================
// 2. CONSTANTS & DESIGN SYSTEM
// ======================================================
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
  "http://localhost:5000";

const ROLE_SUPER_ADMIN = 1;
const ROLE_MANAGER = 2;
const ROLE_SALES = 3;

const STATUS_ACTIVE = "Active";
const STATUS_INACTIVE = "Inactive";

const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  primarySoft: "#E6F0FA",
  accentGold: "#F59E0B",
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
  purple: "#9333EA",
  purpleSoft: "#F3E8FF",
};

const SlideTransition = React.forwardRef((props, ref) => (
  <Slide ref={ref} {...props} direction="up" />
));

const customScrollbarSx = {
  "&::-webkit-scrollbar": {
    width: "6px",
    height: "6px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "#F1F5F9",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "#94A3B8",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    backgroundColor: COLORS.primary,
  },
};

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
  "&:hover": {
    backgroundColor: COLORS.primaryDark,
  },
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
  "&:hover": { borderColor: COLORS.primary, backgroundColor: "#F1F5F9" },
};

const iconSquareBtnSx = {
  width: 36,
  height: 36,
  borderRadius: "6px",
  border: `1px solid ${COLORS.border}`,
  color: COLORS.primary,
  backgroundColor: "#F1F5F9",
  "&:hover": { borderColor: COLORS.primary, backgroundColor: "#E2E8F0" },
};

const controlSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    backgroundColor: COLORS.card,
    height: "36px",
    fontSize: "0.78rem",
    color: COLORS.textPrimary,
    "& fieldset": { borderColor: COLORS.border },
    "&:hover fieldset": { borderColor: COLORS.borderStrong },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary, borderWidth: "1.5px" },
  },
  "& .MuiSelect-select": { display: "flex", alignItems: "center", fontSize: "0.78rem" },
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
    }}
  >
    {children}
  </Typography>
);

const getRoleChipByName = (roleName) => {
  const label = roleName || "Unassigned";
  const nameLower = label.toLowerCase();
  if (nameLower.includes("admin")) return { label, bg: COLORS.primarySoft, color: COLORS.primaryDark };
  if (nameLower.includes("manager")) return { label, bg: COLORS.warningSoft, color: COLORS.warning };
  return { label, bg: COLORS.successSoft, color: COLORS.success };
};

const getRoleLabel = (roleId) => {
  const id = Number(roleId);
  if (id === ROLE_SUPER_ADMIN) return "Super Admin";
  if (id === ROLE_MANAGER) return "Manager";
  return "Sales Representative";
};

const getCurrentUserId = () => {
  if (typeof window === "undefined") return null;
  try {
    const rawUser =
      localStorage.getItem("user") ||
      localStorage.getItem("authUser") ||
      localStorage.getItem("currentUser") ||
      sessionStorage.getItem("user");
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      const id = parsed?.id ?? parsed?.user_id ?? parsed?.userId ?? null;
      if (id !== null && id !== undefined) return id;
    }
  } catch (e) {}
  return null;
};

const SELF_ACTION_TOOLTIP = "You cannot modify your own account.";

const circleActionSx = (color, soft) => ({
  width: 28,
  height: 28,
  borderRadius: "6px",
  color,
  backgroundColor: soft,
  p: 0.3,
  "&:hover": {
    backgroundColor: color,
    color: "#FFFFFF",
  },
});

const disabledCircleActionSx = {
  width: 28,
  height: 28,
  borderRadius: "6px",
  color: COLORS.textMuted,
  backgroundColor: "#F1F5F9",
  cursor: "not-allowed",
  pointerEvents: "none",
  opacity: 0.6,
  p: 0.3,
};

const SectionTitle = ({ children }) => (
  <Typography
    sx={{
      fontSize: "0.72rem",
      fontWeight: 800,
      color: COLORS.primary,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      pb: 0.8,
      mb: 0.2,
      borderBottom: `1px solid ${COLORS.border}`,
    }}
  >
    {children}
  </Typography>
);

// ======================================================
// EXPORT HELPERS (EXCEL & PROFESSIONAL PDF WITH SETTINGS LOGO & META)
// ======================================================
const exportUsersToExcel = (rows) => {
  if (!rows || !rows.length) return;
  const formattedData = rows.map((r, idx) => ({
    "S.No": idx + 1,
    "Full Name": r.full_name || "",
    "Username": r.username || "",
    "Email Address": r.email || "",
    "Phone Number": r.phone || "N/A",
    "Role": r.role_name || "",
    "Reporting Manager": r.manager_name || "None",
    "Account Status": r.status || "",
    "Created Date": r.created_at ? new Date(r.created_at).toLocaleDateString("en-GB") : "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Users Directory");
  XLSX.writeFile(workbook, `Solar_CRM_Users_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const exportUsersToPdf = (rows, companyData) => {
  if (!rows || !rows.length) return;

  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const compName = companyData?.company_name || "Solar CRM";
  const compEmail = companyData?.company_email || "";
  const compPhone = companyData?.company_phone || "";
  const compWebsite = companyData?.website || "";
  const compAddressParts = [
    companyData?.address,
    companyData?.city,
    companyData?.state,
    companyData?.pincode || companyData?.zip_code,
  ].filter(Boolean);
  const compAddress = compAddressParts.join(", ");
  const compGst = companyData?.gst_number ? `GSTIN: ${companyData.gst_number}` : "";

  const logoFile = companyData?.company_logo;
  const logoUrl = logoFile
    ? logoFile.startsWith("http")
      ? logoFile
      : `${API_BASE_URL}/uploads/company/${logoFile}`
    : null;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${compName} - User Management Report</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            color: #0F172A;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            border-bottom: 2px solid #0F172A;
            padding-bottom: 14px;
          }
          .brand-cell {
            vertical-align: middle;
            width: 50%;
          }
          .logo-img {
            max-height: 52px;
            max-width: 200px;
            object-fit: contain;
            margin-bottom: 4px;
          }
          .brand-title {
            font-size: 22px;
            font-weight: 800;
            color: #0F172A;
            letter-spacing: -0.5px;
          }
          .brand-subtitle {
            font-size: 11px;
            color: #64748B;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            margin-top: 4px;
          }
          .meta-cell {
            text-align: right;
            vertical-align: middle;
            font-size: 10.5px;
            color: #475569;
            line-height: 1.5;
            width: 50%;
          }
          .meta-cell strong {
            color: #0F172A;
            font-size: 12px;
          }
          .doc-bar {
            background: #0F172A;
            color: #ffffff;
            padding: 8px 14px;
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }
          .doc-title {
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }
          .doc-date {
            font-size: 11px;
            opacity: 0.9;
          }
          .stats-bar {
            display: table;
            width: 100%;
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            margin-bottom: 18px;
          }
          .stat-cell {
            display: table-cell;
            padding: 10px 14px;
            border-right: 1px solid #E2E8F0;
          }
          .stat-cell:last-child {
            border-right: none;
          }
          .stat-label {
            font-size: 9px;
            text-transform: uppercase;
            font-weight: 800;
            color: #64748B;
            letter-spacing: 0.04em;
          }
          .stat-val {
            font-size: 16px;
            font-weight: 800;
            color: #0F172A;
            margin-top: 2px;
          }
          table.data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
            margin-bottom: 24px;
          }
          table.data-table th {
            background-color: #0F172A;
            color: #ffffff;
            font-weight: 800;
            text-align: left;
            padding: 8px 10px;
            font-size: 9.5px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          table.data-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #E2E8F0;
          }
          table.data-table tr:nth-child(even) {
            background-color: #F8FAFC;
          }
          .badge {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
          }
          .badge-active { background: #DCFCE7; color: #16A34A; }
          .badge-inactive { background: #FEE2E2; color: #DC2626; }
          .badge-role { background: #E6F0FA; color: #020617; }
          .footer-box {
            border-top: 2px solid #E2E8F0;
            padding-top: 10px;
            margin-top: 20px;
            font-size: 9.5px;
            color: #64748B;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .footer-company {
            font-weight: 700;
            color: #0F172A;
          }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td class="brand-cell">
              ${
                logoUrl
                  ? `<img src="${logoUrl}" class="logo-img" alt="${compName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                     <div class="brand-title" style="display:none;">${compName}</div>`
                  : `<div class="brand-title">${compName}</div>`
              }
              <div class="brand-subtitle">USER MANAGEMENT DIRECTORY REPORT</div>
            </td>
            <td class="meta-cell">
              <strong>${compName}</strong><br/>
              ${compAddress ? `${compAddress}<br/>` : ""}
              ${compEmail ? `Email: ${compEmail} ` : ""}${compPhone ? `| Ph: ${compPhone}` : ""}<br/>
              ${compWebsite ? `Web: ${compWebsite} ` : ""}${compGst ? `| ${compGst}` : ""}
            </td>
          </tr>
        </table>

        <div class="doc-bar">
          <span class="doc-title">Team User Directory</span>
          <span class="doc-date">Generated on ${dateStr}</span>
        </div>

        <div class="stats-bar">
          <div class="stat-cell">
            <div class="stat-label">Total Users Listed</div>
            <div class="stat-val">${rows.length}</div>
          </div>
          <div class="stat-cell">
            <div class="stat-label">Active Accounts</div>
            <div class="stat-val" style="color: #16A34A;">${rows.filter((r) => r.status === STATUS_ACTIVE).length}</div>
          </div>
          <div class="stat-cell">
            <div class="stat-label">Inactive Accounts</div>
            <div class="stat-val" style="color: #DC2626;">${rows.filter((r) => r.status === STATUS_INACTIVE).length}</div>
          </div>
          <div class="stat-cell">
            <div class="stat-label">Report Type</div>
            <div class="stat-val" style="font-size: 13px; margin-top: 4px;">Official CRM Export</div>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 30px;">#</th>
              <th>Full Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Manager</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${r.full_name || ""}</strong></td>
                <td>@${r.username || ""}</td>
                <td>${r.email || ""}</td>
                <td>${r.phone || "N/A"}</td>
                <td><span class="badge badge-role">${r.role_name || "Sales"}</span></td>
                <td>${r.manager_name || "None"}</td>
                <td>
                  <span class="badge ${r.status === STATUS_ACTIVE ? "badge-active" : "badge-inactive"}">
                    ${r.status || "N/A"}
                  </span>
                </td>
                <td>${r.created_at ? new Date(r.created_at).toLocaleDateString("en-GB") : "N/A"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer-box">
          <div>
            <span class="footer-company">${compName}</span> — System Generated Report (Confidential)
          </div>
          <div>
            ${compWebsite ? compWebsite : "Solar CRM"} | ${dateStr}
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

// ======================================================
// MAIN COMPONENT
// ======================================================
const Users = () => {
  const { can, features } = usePlanFeatures();

  const [usersList, setUsersList] = useState([]);
  const [managersList, setManagersList] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeOnPage: 0,
    inactiveOnPage: 0,
    uniqueRoleNames: [],
  });

  // View Mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState("list");

  // Filters & Sorting State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  // Dialog / Modal Popup State (Add User & Edit User)
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [userForm, setUserForm] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    role_id: ROLE_SALES,
    manager_id: "",
    profile_image: null,
  });
  const [formErrors, setFormErrors] = useState({});

  // View Details Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewDetails, setViewDetails] = useState(null);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toast Snackbar State
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const currentUserId = useMemo(() => getCurrentUserId(), []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchManagersDropdown();
    fetchCompanySettingsData();
  }, []);

  useEffect(() => {
    fetchUsersData();
  }, [page, rowsPerPage, debouncedSearch, roleFilter, statusFilter]);

  const fetchCompanySettingsData = async () => {
    try {
      const res = await getSettings();
      const data = res?.data?.data || res?.data || {};
      setCompanySettings(data);
    } catch (e) {
      console.error("Failed to fetch settings for PDF", e);
    }
  };

  const fetchManagersDropdown = async () => {
    try {
      const res = await getUsers({ limit: 100 });
      const data = res?.data?.data || [];
      const filtered = data.filter(
        (u) => u.role_id === ROLE_MANAGER || u.role_id === ROLE_SUPER_ADMIN
      );
      setManagersList(Array.isArray(filtered) ? filtered : []);
    } catch (e) {
      console.error("Failed to load managers dropdown", e);
    }
  };

  const fetchUsersData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      };

      const res = await getUsers(params);
      const payload = res?.data || {};
      const userArray = Array.isArray(payload.data) ? payload.data : [];
      const totalRecords = payload.pagination?.totalRecords ?? userArray.length;

      setUsersList(userArray);
      setTotalCount(totalRecords);

      const uniqueRoleNames = Array.from(
        new Set(userArray.map((u) => u.role_name).filter(Boolean))
      );
      setStats({
        totalUsers: totalRecords,
        activeOnPage: userArray.filter((u) => u.status === STATUS_ACTIVE).length,
        inactiveOnPage: userArray.filter((u) => u.status === STATUS_INACTIVE).length,
        uniqueRoleNames,
      });
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to load users list.", "error");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, roleFilter, statusFilter]);

  // Client-side Sorted Users
  const processedUsers = useMemo(() => {
    let sorted = [...usersList];
    if (sortBy === "name_asc") {
      sorted.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
    } else if (sortBy === "name_desc") {
      sorted.sort((a, b) => (b.full_name || "").localeCompare(a.full_name || ""));
    } else if (sortBy === "oldest") {
      sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else {
      // "newest"
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return sorted;
  }, [usersList, sortBy]);

  const handleRefresh = async () => {
    await Promise.all([fetchUsersData(), fetchManagersDropdown(), fetchCompanySettingsData()]);
    showNotification("User directory refreshed.", "info");
  };

  const buildUserPayload = () => {
    const isSales = Number(userForm.role_id) === ROLE_SALES;
    const payload = {
      role_id: Number(userForm.role_id),
      manager_id: isSales ? userForm.manager_id || null : null,
      full_name: userForm.full_name.trim(),
      username: userForm.username.trim(),
      email: userForm.email.trim(),
      phone: userForm.phone.trim(),
    };
    if (modalMode === "add") {
      payload.password = userForm.password;
    }
    return payload;
  };

  const handleSaveUser = async () => {
    if (!validateForm()) return;

    try {
      setFormSubmitting(true);
      const payload = buildUserPayload();

      if (modalMode === "add") {
        await createUser(payload);
        showNotification("New team member added successfully!", "success");
      } else {
        await updateUser(selectedUserId, payload);
        showNotification("User details updated successfully!", "success");
      }

      setUserModalOpen(false);
      await fetchUsersData();
      await fetchManagersDropdown();
    } catch (err) {
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to save user details.";
      showNotification(serverMessage, "error");

      // Auto-highlight problematic field in the modal
      const lower = serverMessage.toLowerCase();
      if (lower.includes("email")) {
        setFormErrors((prev) => ({ ...prev, email: serverMessage }));
      } else if (lower.includes("username")) {
        setFormErrors((prev) => ({ ...prev, username: serverMessage }));
      } else if (lower.includes("phone")) {
        setFormErrors((prev) => ({ ...prev, phone: serverMessage }));
      } else if (lower.includes("manager")) {
        setFormErrors((prev) => ({ ...prev, manager_id: serverMessage }));
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (userObj) => {
    const isActive = userObj.status === STATUS_ACTIVE;
    const newStatus = isActive ? STATUS_INACTIVE : STATUS_ACTIVE;

    try {
      await updateUserStatus(userObj.id, { status: newStatus });
      showNotification(
        `User ${newStatus === STATUS_ACTIVE ? "activated" : "deactivated"} successfully!`,
        "success"
      );
      await fetchUsersData();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to update status.", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setDeleting(true);
      await deleteUser(userToDelete.id);
      showNotification("User account deleted successfully.", "success");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      await fetchUsersData();
      await fetchManagersDropdown();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to delete user.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const showNotification = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const getAvatarUrl = (fileName) => {
    if (!fileName) return "";
    return `${API_BASE_URL}/uploads/profiles/${fileName}`;
  };

  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";

  const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : "N/A");

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setSortBy("newest");
    setPage(0);
  };

  const handleOpenAddModal = () => {
    if (features && features.max_users > 0 && totalCount >= features.max_users) {
      showNotification(
        `Your plan allows maximum ${features.max_users} users. Please upgrade to add more.`,
        "warning"
      );
      return;
    }
    setUserForm({
      full_name: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      confirm_password: "",
      role_id: ROLE_SALES,
      manager_id: "",
      profile_image: null,
    });
    setFormErrors({});
    setSelectedUserId(null);
    setModalMode("add");
    setShowPassword(false);
    setUserModalOpen(true);
  };

  const handleOpenEditModal = async (userObj) => {
    setSelectedUserId(userObj.id);
    setModalMode("edit");
    setFormErrors({});
    setShowPassword(false);
    setUserModalOpen(true);
    setModalLoading(true);

    try {
      const res = await getUserById(userObj.id);
      const data = res?.data?.data;
      setUserForm({
        full_name: data?.full_name || "",
        username: data?.username || "",
        email: data?.email || "",
        phone: data?.phone || "",
        password: "",
        confirm_password: "",
        role_id: Number(data?.role_id) || ROLE_SALES,
        manager_id: data?.manager_id || "",
        profile_image: data?.profile_image || null,
      });
    } catch (e) {
      showNotification("Failed to load user details.", "error");
      setUserModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenViewModal = async (userObj) => {
    setSelectedUserId(userObj.id);
    setViewModalOpen(true);
    setModalLoading(true);

    try {
      const res = await getUserById(userObj.id);
      setViewDetails(res?.data?.data || null);
    } catch (e) {
      showNotification("Failed to load user details.", "error");
      setViewModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setUserForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!userForm.full_name.trim()) errors.full_name = "Full Name is required";
    if (!userForm.username.trim()) errors.username = "Username is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userForm.email.trim()) {
      errors.email = "Email address is required";
    } else if (!emailRegex.test(userForm.email)) {
      errors.email = "Enter a valid email address";
    }

    if (!userForm.phone.trim()) errors.phone = "Phone number is required";

    if (modalMode === "add") {
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|;:'",.<>\/]).{8,}$/;
      if (!userForm.password) {
        errors.password = "Password is required";
      } else if (!strongPasswordRegex.test(userForm.password)) {
        errors.password = "8+ chars, upper, lower, number & special character";
      }

      if (userForm.password !== userForm.confirm_password) {
        errors.confirm_password = "Passwords do not match";
      }
    }

    if (Number(userForm.role_id) === ROLE_SALES && !userForm.manager_id) {
      errors.manager_id = "Assigning a Manager is mandatory for Sales Users";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const pageSize = usersList.length;
  const pctOfPage = (n) => (pageSize > 0 ? Math.round((n / pageSize) * 100) : 0);

  const statCards = useMemo(
    () => [
      {
        key: "totalUsers",
        label: "TOTAL USERS",
        value: stats.totalUsers,
        caption: "Across all pages",
        icon: <PeopleAltOutlinedIcon sx={{ fontSize: 16 }} />,
        color: COLORS.primary,
        soft: COLORS.primarySoft,
      },
      {
        key: "active",
        label: "ACTIVE USERS",
        value: stats.activeOnPage,
        caption: `${pctOfPage(stats.activeOnPage)}% of this page`,
        icon: <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 16 }} />,
        color: COLORS.success,
        soft: COLORS.successSoft,
      },
      {
        key: "inactive",
        label: "INACTIVE USERS",
        value: stats.inactiveOnPage,
        caption: `${pctOfPage(stats.inactiveOnPage)}% of this page`,
        icon: <PersonOffOutlinedIcon sx={{ fontSize: 16 }} />,
        color: COLORS.danger,
        soft: COLORS.dangerSoft,
      },
      {
        key: "roles",
        label: "ROLES SHOWN",
        value: stats.uniqueRoleNames.length,
        caption: stats.uniqueRoleNames.length ? stats.uniqueRoleNames.join(" · ") : "No roles on this page",
        icon: <ShieldOutlinedIcon sx={{ fontSize: 16 }} />,
        color: COLORS.warning,
        soft: COLORS.warningSoft,
      },
    ],
    [stats, pageSize]
  );

  const hasActiveFilters = Boolean(search || roleFilter || statusFilter || sortBy !== "newest");

  return (
    <Box
      sx={{
        width: "100%",
        backgroundColor: COLORS.bg,
        minHeight: "100vh",
        p: 2,
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "100%", mx: "auto" }}>
        
        {/* ================= BREADCRUMB ================= */}
        <Breadcrumbs
          separator={<NavigateNextRoundedIcon sx={{ fontSize: "0.8rem", color: COLORS.textMuted }} />}
          sx={{ mb: 1.5 }}
        >
          <Stack direction="row" alignItems="center" gap={0.5}>
            <HomeOutlinedIcon sx={{ fontSize: "0.8rem", color: COLORS.textMuted }} />
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: COLORS.textMuted }}>
              Dashboard
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: COLORS.textMuted }}>
            Administration
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.primary }}>
            User Management
          </Typography>
        </Breadcrumbs>

        {/* ================= HERO HEADER ================= */}
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
              User Management Directory
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.75rem", mt: 0.1 }}>
              Manage managers and sales team members, assign reporting lines, and control account access.
            </Typography>
          </Box>

          <Stack direction="row" alignItems="center" gap={1} sx={{ flexShrink: 0, flexWrap: "wrap" }}>
            {/* View Mode Switcher (Grid / List) */}
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
              <ToggleButton value="list">
                <Tooltip title="List View">
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <ViewListOutlinedIcon sx={{ fontSize: 17 }} />
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700 }}>List</Typography>
                  </Stack>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="grid">
                <Tooltip title="Grid View">
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <GridViewOutlinedIcon sx={{ fontSize: 17 }} />
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700 }}>Grid</Typography>
                  </Stack>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Refresh */}
            <Tooltip title="Refresh Directory">
              <IconButton onClick={handleRefresh} disabled={loading} size="small" sx={iconSquareBtnSx}>
                <RefreshRoundedIcon
                  sx={{
                    fontSize: 17,
                    animation: loading ? "spin 0.9s linear infinite" : "none",
                    "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                  }}
                />
              </IconButton>
            </Tooltip>

            {/* Export Excel */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<TableChartOutlinedIcon sx={{ fontSize: 15, color: COLORS.success }} />}
              onClick={() => exportUsersToExcel(processedUsers)}
              disabled={!processedUsers.length}
              sx={outlinedButtonSx}
            >
              Excel
            </Button>

            {/* Export PDF */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<PictureAsPdfOutlinedIcon sx={{ fontSize: 15, color: COLORS.danger }} />}
              onClick={() => exportUsersToPdf(processedUsers, companySettings)}
              disabled={!processedUsers.length}
              sx={outlinedButtonSx}
            >
              PDF Report
            </Button>

            {/* Add User Popup Button */}
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={handleOpenAddModal}
              sx={primaryButtonSx}
            >
              Add User
            </Button>
          </Stack>
        </Paper>

        {/* ================= STAT CARDS ================= */}
        <Box sx={{ display: "flex", gap: 1.5, mb: 2, width: "100%", flexWrap: "wrap" }}>
          {statCards.map((s) => (
            <Card key={s.key} elevation={0} sx={{ flex: 1, minWidth: "160px", borderRadius: "12px", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}>
              <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.8 }}>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 800, fontSize: "0.65rem", letterSpacing: "0.03em" }}>
                    {s.label}
                  </Typography>
                  <Avatar sx={{ width: 28, height: 28, borderRadius: "6px", bgcolor: s.soft, color: s.color }}>
                    {s.icon}
                  </Avatar>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1.2rem", lineHeight: 1.2 }}>
                  {loading ? <Skeleton width={40} height={24} /> : s.value}
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, mt: 0.2, display: "block", fontWeight: 600, fontSize: "0.68rem" }}>
                  {loading ? <Skeleton width={70} height={12} /> : s.caption}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* ================= RICH FILTER TOOLBAR ================= */}
        <Paper elevation={0} sx={{ ...cardSx, p: 1.5, mb: 2, width: "100%", boxSizing: "border-box" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 1.2 }}>
            {/* Search Input */}
            <Box sx={{ flex: "1 1 220px", minWidth: 180 }}>
              <FieldLabel>Search User</FieldLabel>
              <TextField
                fullWidth
                placeholder="Search name, username, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                sx={controlSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: COLORS.textMuted, fontSize: "0.95rem" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Role Filter */}
            <Box sx={{ flex: "0 1 160px", minWidth: 130 }}>
              <FieldLabel>Role</FieldLabel>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(0);
                }}
                IconComponent={KeyboardArrowDownRoundedIcon}
                sx={controlSx}
                renderValue={(val) =>
                  val === "" ? (
                    <Box component="span" sx={{ color: COLORS.textMuted, fontSize: "0.78rem" }}>All Roles</Box>
                  ) : (
                    getRoleLabel(val)
                  )
                }
              >
                <MenuItem value="" sx={{ fontSize: "0.78rem" }}>All Roles</MenuItem>
                <MenuItem value={ROLE_SUPER_ADMIN} sx={{ fontSize: "0.78rem" }}>Super Admin</MenuItem>
                <MenuItem value={ROLE_MANAGER} sx={{ fontSize: "0.78rem" }}>Manager</MenuItem>
                <MenuItem value={ROLE_SALES} sx={{ fontSize: "0.78rem" }}>Sales Representative</MenuItem>
              </Select>
            </Box>

            {/* Status Filter */}
            <Box sx={{ flex: "0 1 140px", minWidth: 110 }}>
              <FieldLabel>Status</FieldLabel>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                IconComponent={KeyboardArrowDownRoundedIcon}
                sx={controlSx}
                renderValue={(val) =>
                  val === "" ? <Box component="span" sx={{ color: COLORS.textMuted, fontSize: "0.78rem" }}>All Status</Box> : val
                }
              >
                <MenuItem value="" sx={{ fontSize: "0.78rem" }}>All Status</MenuItem>
                <MenuItem value={STATUS_ACTIVE} sx={{ fontSize: "0.78rem" }}>Active</MenuItem>
                <MenuItem value={STATUS_INACTIVE} sx={{ fontSize: "0.78rem" }}>Inactive</MenuItem>
              </Select>
            </Box>

            {/* Sort By Dropdown */}
            <Box sx={{ flex: "0 1 160px", minWidth: 130 }}>
              <FieldLabel>Sort By</FieldLabel>
              <Select
                fullWidth
                size="small"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                IconComponent={KeyboardArrowDownRoundedIcon}
                sx={controlSx}
                startAdornment={
                  <InputAdornment position="start">
                    <SortRoundedIcon sx={{ color: COLORS.textMuted, fontSize: "0.85rem", ml: 0.5 }} />
                  </InputAdornment>
                }
              >
                <MenuItem value="newest" sx={{ fontSize: "0.78rem" }}>Newest First</MenuItem>
                <MenuItem value="oldest" sx={{ fontSize: "0.78rem" }}>Oldest First</MenuItem>
                <MenuItem value="name_asc" sx={{ fontSize: "0.78rem" }}>Name (A to Z)</MenuItem>
                <MenuItem value="name_desc" sx={{ fontSize: "0.78rem" }}>Name (Z to A)</MenuItem>
              </Select>
            </Box>

            {/* Filter Reset Button */}
            <Box sx={{ flex: "0 0 auto" }}>
              <Tooltip title="Reset All Filters">
                <span>
                  <IconButton
                    onClick={handleResetFilters}
                    disabled={!hasActiveFilters}
                    size="small"
                    sx={{
                      ...iconSquareBtnSx,
                      color: hasActiveFilters ? COLORS.primary : COLORS.textMuted,
                      "&:hover": hasActiveFilters
                        ? { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary }
                        : {},
                    }}
                  >
                    <FilterListOffIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>
        </Paper>

        {/* ================= MAIN DATA CONTENT (LIST / GRID) ================= */}
        {viewMode === "list" ? (
          /* ================= LIST VIEW (TABLE) ================= */
          <Paper elevation={0} sx={{ ...cardSx, p: 0, overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
            <TableContainer sx={{ maxHeight: 600, width: "100%", overflowX: "auto", ...customScrollbarSx }}>
              <Table stickyHeader sx={{ minWidth: 800, width: "100%" }} size="small">
                <TableHead>
                  <TableRow>
                    {[
                      { label: "USER", width: "24%" },
                      { label: "ROLE", width: "14%" },
                      { label: "MANAGER", width: "14%" },
                      { label: "CONTACT", width: "22%" },
                      { label: "STATUS", width: "12%" },
                      { label: "CREATED", width: "10%" },
                      { label: "ACTIONS", width: "4%", align: "right" },
                    ].map((h, i) => (
                      <TableCell
                        key={i}
                        align={h.align || "left"}
                        sx={{
                          fontWeight: 800,
                          color: COLORS.primaryDark,
                          fontSize: "0.68rem",
                          letterSpacing: "0.03em",
                          py: 1,
                          px: 1.2,
                          width: h.width,
                          backgroundColor: "#F8FAFC",
                          borderBottom: `2px solid ${COLORS.border}`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    Array.from(new Array(rowsPerPage > 8 ? 8 : rowsPerPage)).map((_, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ py: 1, px: 1.2 }}>
                          <Stack direction="row" alignItems="center" gap={1}>
                            <Skeleton variant="circular" width={28} height={28} />
                            <Box sx={{ flex: 1 }}>
                              <Skeleton width="60%" height={14} />
                              <Skeleton width="40%" height={10} />
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ py: 1, px: 1.2 }}><Skeleton variant="rounded" width={60} height={18} /></TableCell>
                        <TableCell sx={{ py: 1, px: 1.2 }}><Skeleton width={80} height={12} /></TableCell>
                        <TableCell sx={{ py: 1, px: 1.2 }}><Skeleton width={100} height={12} /></TableCell>
                        <TableCell sx={{ py: 1, px: 1.2 }}><Skeleton width={50} height={18} /></TableCell>
                        <TableCell sx={{ py: 1, px: 1.2 }}><Skeleton width={60} height={12} /></TableCell>
                        <TableCell align="right" sx={{ py: 1, px: 1.2 }}><Skeleton width={70} height={24} sx={{ ml: "auto" }} /></TableCell>
                      </TableRow>
                    ))
                  ) : processedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 5, border: 0 }}>
                        <Box sx={{ textAlign: "center", maxWidth: 320, mx: "auto" }}>
                          <Box
                            sx={{
                              width: 52,
                              height: 52,
                              borderRadius: "12px",
                              backgroundColor: COLORS.primarySoft,
                              color: COLORS.primary,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              mx: "auto",
                              mb: 1.5,
                            }}
                          >
                            <Inventory2OutlinedIcon sx={{ fontSize: "1.6rem" }} />
                          </Box>
                          <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.9rem" }}>
                            No Users Found
                          </Typography>
                          <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.75rem", mt: 0.3, mb: 1.5 }}>
                            Try adjusting search queries or filter selections, or create a new user.
                          </Typography>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<PersonAddAlt1OutlinedIcon sx={{ fontSize: 14 }} />}
                            onClick={handleOpenAddModal}
                            sx={primaryButtonSx}
                          >
                            Create User
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    processedUsers.map((row) => {
                      const isActive = row.status === STATUS_ACTIVE;
                      const roleChip = getRoleChipByName(row.role_name);
                      const isSelfRow =
                        currentUserId !== null &&
                        currentUserId !== undefined &&
                        String(row.id) === String(currentUserId);

                      return (
                        <TableRow
                          key={row.id}
                          hover
                          sx={{
                            "& td": { borderBottom: `1px solid ${COLORS.border}`, py: 1, px: 1.2 },
                            "&:hover td": { backgroundColor: "#FAFBFD" },
                          }}
                        >
                          {/* User Column */}
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Avatar
                                src={getAvatarUrl(row.profile_image)}
                                sx={{
                                  width: 28,
                                  height: 28,
                                  backgroundColor: COLORS.primaryDark,
                                  color: "#FFFFFF",
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                }}
                              >
                                {getInitials(row.full_name)}
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "0.78rem", lineHeight: 1.1 }}
                                  noWrap
                                >
                                  {row.full_name}
                                </Typography>
                                <Typography sx={{ color: COLORS.textMuted, fontSize: "0.68rem" }} noWrap>
                                  @{row.username}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          {/* Role */}
                          <TableCell>
                            <Chip
                              label={roleChip.label}
                              size="small"
                              sx={{
                                backgroundColor: roleChip.bg,
                                color: roleChip.color,
                                fontWeight: 700,
                                fontSize: "0.65rem",
                                height: 20,
                                px: 0.3,
                              }}
                            />
                          </TableCell>

                          {/* Manager */}
                          <TableCell sx={{ fontSize: "0.75rem", color: COLORS.textPrimary, fontWeight: 500, whiteSpace: "nowrap" }}>
                            {row.manager_name || "—"}
                          </TableCell>

                          {/* Contact */}
                          <TableCell>
                            <Stack direction="row" alignItems="center" gap={0.4} sx={{ mb: 0.1 }}>
                              <MailOutlineRoundedIcon sx={{ fontSize: "0.68rem", color: COLORS.textMuted }} />
                              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }} noWrap>
                                {row.email}
                              </Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" gap={0.4}>
                              <CallOutlinedIcon sx={{ fontSize: "0.68rem", color: COLORS.textMuted }} />
                              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>
                                {row.phone || "N/A"}
                              </Typography>
                            </Stack>
                          </TableCell>

                          {/* Status + Switch */}
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <Chip
                                label={row.status}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  fontSize: "0.65rem",
                                  height: 18,
                                  backgroundColor: isActive ? COLORS.successSoft : COLORS.dangerSoft,
                                  color: isActive ? COLORS.success : COLORS.danger,
                                }}
                              />
                              <Tooltip title={isSelfRow ? SELF_ACTION_TOOLTIP : (isActive ? "Deactivate User" : "Activate User")}>
                                <span>
                                  <Switch
                                    size="small"
                                    checked={isActive}
                                    disabled={isSelfRow}
                                    onChange={() => handleToggleStatus(row)}
                                    sx={{
                                      transform: "scale(0.85)",
                                      "& .MuiSwitch-switchBase.Mui-checked": { color: COLORS.success },
                                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                        backgroundColor: COLORS.success,
                                      },
                                    }}
                                  />
                                </span>
                              </Tooltip>
                            </Box>
                          </TableCell>

                          {/* Created Date */}
                          <TableCell sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, fontWeight: 500, whiteSpace: "nowrap" }}>
                            {formatDate(row.created_at)}
                          </TableCell>

                          {/* Actions */}
                          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                            <Stack direction="row" alignItems="center" justifyContent="flex-end" gap={0.3}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenViewModal(row)}
                                  sx={circleActionSx(COLORS.primary, COLORS.primarySoft)}
                                >
                                  <VisibilityOutlinedIcon sx={{ fontSize: "0.85rem" }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={isSelfRow ? SELF_ACTION_TOOLTIP : "Edit User"}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenEditModal(row)}
                                    disabled={isSelfRow}
                                    sx={isSelfRow ? disabledCircleActionSx : circleActionSx(COLORS.warning, COLORS.warningSoft)}
                                  >
                                    <EditOutlinedIcon sx={{ fontSize: "0.85rem" }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title={isSelfRow ? SELF_ACTION_TOOLTIP : "Delete User"}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setUserToDelete(row);
                                      setDeleteDialogOpen(true);
                                    }}
                                    disabled={isSelfRow}
                                    sx={isSelfRow ? disabledCircleActionSx : circleActionSx(COLORS.danger, COLORS.dangerSoft)}
                                  >
                                    <DeleteOutlineOutlinedIcon sx={{ fontSize: "0.85rem" }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
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
              rowsPerPageOptions={[6, 12, 24, 48]}
              sx={{
                borderTop: `1px solid ${COLORS.border}`,
                "& .MuiTablePagination-toolbar": { minHeight: 36, px: 1.5 },
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                  fontSize: "0.72rem",
                  color: COLORS.textSecondary,
                },
                "& .MuiTablePagination-select": { fontSize: "0.72rem" },
              }}
            />
          </Paper>
        ) : (
          /* ================= GRID VIEW ================= */
          <Box sx={{ width: "100%" }}>
            {loading ? (
              <Grid container spacing={2}>
                {Array.from(new Array(6)).map((_, idx) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
                    <Paper elevation={0} sx={{ ...cardSx, p: 2, borderRadius: "12px" }}>
                      <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
                        <Skeleton variant="circular" width={44} height={44} />
                        <Box sx={{ flex: 1 }}>
                          <Skeleton width="70%" height={16} />
                          <Skeleton width="40%" height={12} />
                        </Box>
                      </Box>
                      <Skeleton width="100%" height={12} sx={{ mb: 0.8 }} />
                      <Skeleton width="80%" height={12} sx={{ mb: 1.5 }} />
                      <Skeleton variant="rounded" width="100%" height={32} />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : processedUsers.length === 0 ? (
              <Paper elevation={0} sx={{ ...cardSx, p: 5, textAlign: "center", borderRadius: "12px" }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: "12px",
                    backgroundColor: COLORS.primarySoft,
                    color: COLORS.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5,
                  }}
                >
                  <Inventory2OutlinedIcon sx={{ fontSize: "1.6rem" }} />
                </Box>
                <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.9rem" }}>
                  No Users Found
                </Typography>
                <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.75rem", mt: 0.3, mb: 1.5 }}>
                  Try adjusting search queries or filter selections, or create a new user.
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PersonAddAlt1OutlinedIcon sx={{ fontSize: 14 }} />}
                  onClick={handleOpenAddModal}
                  sx={primaryButtonSx}
                >
                  Create User
                </Button>
              </Paper>
            ) : (
              <>
                <Grid container spacing={2}>
                  {processedUsers.map((user) => {
                    const isActive = user.status === STATUS_ACTIVE;
                    const roleChip = getRoleChipByName(user.role_name);
                    const isSelfRow =
                      currentUserId !== null &&
                      currentUserId !== undefined &&
                      String(user.id) === String(currentUserId);

                    return (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
                        <Paper
                          elevation={0}
                          sx={{
                            ...cardSx,
                            p: 2,
                            borderRadius: "12px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            height: "100%",
                            position: "relative",
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              borderColor: COLORS.primary,
                              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
                              transform: "translateY(-2px)",
                            },
                          }}
                        >
                          {/* Top Card Header */}
                          <Box>
                            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                                <Avatar
                                  src={getAvatarUrl(user.profile_image)}
                                  sx={{
                                    width: 44,
                                    height: 44,
                                    backgroundColor: COLORS.primaryDark,
                                    color: "#FFFFFF",
                                    fontSize: "0.9rem",
                                    fontWeight: 800,
                                    border: `2px solid ${COLORS.border}`,
                                  }}
                                >
                                  {getInitials(user.full_name)}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography
                                    sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.85rem", lineHeight: 1.2 }}
                                    noWrap
                                  >
                                    {user.full_name}
                                  </Typography>
                                  <Typography sx={{ color: COLORS.textMuted, fontSize: "0.72rem" }} noWrap>
                                    @{user.username}
                                  </Typography>
                                </Box>
                              </Box>

                              {/* Status Switch */}
                              <Tooltip title={isSelfRow ? SELF_ACTION_TOOLTIP : (isActive ? "Deactivate User" : "Activate User")}>
                                <span>
                                  <Switch
                                    size="small"
                                    checked={isActive}
                                    disabled={isSelfRow}
                                    onChange={() => handleToggleStatus(user)}
                                    sx={{
                                      "& .MuiSwitch-switchBase.Mui-checked": { color: COLORS.success },
                                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                        backgroundColor: COLORS.success,
                                      },
                                    }}
                                  />
                                </span>
                              </Tooltip>
                            </Box>

                            {/* Role Badge & Manager */}
                            <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5, flexWrap: "wrap" }}>
                              <Chip
                                label={roleChip.label}
                                size="small"
                                sx={{
                                  backgroundColor: roleChip.bg,
                                  color: roleChip.color,
                                  fontWeight: 800,
                                  fontSize: "0.65rem",
                                  height: 20,
                                  px: 0.5,
                                }}
                              />
                              <Chip
                                label={isActive ? "Active" : "Inactive"}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  fontSize: "0.65rem",
                                  height: 20,
                                  backgroundColor: isActive ? COLORS.successSoft : COLORS.dangerSoft,
                                  color: isActive ? COLORS.success : COLORS.danger,
                                }}
                              />
                            </Stack>

                            <Divider sx={{ my: 1, borderColor: COLORS.border }} />

                            {/* Contact & Details Info */}
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, my: 1.2 }}>
                              <Stack direction="row" alignItems="center" gap={0.8}>
                                <MailOutlineRoundedIcon sx={{ fontSize: "0.85rem", color: COLORS.textMuted }} />
                                <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }} noWrap>
                                  {user.email}
                                </Typography>
                              </Stack>

                              <Stack direction="row" alignItems="center" gap={0.8}>
                                <CallOutlinedIcon sx={{ fontSize: "0.85rem", color: COLORS.textMuted }} />
                                <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                                  {user.phone || "No contact number"}
                                </Typography>
                              </Stack>

                              <Stack direction="row" alignItems="center" gap={0.8}>
                                <GroupsOutlinedIcon sx={{ fontSize: "0.85rem", color: COLORS.textMuted }} />
                                <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }} noWrap>
                                  Manager: <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{user.manager_name || "None"}</Box>
                                </Typography>
                              </Stack>
                            </Box>
                          </Box>

                          {/* Card Action Buttons */}
                          <Box sx={{ pt: 1.2, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                            <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted, fontWeight: 600 }}>
                              Joined {formatDate(user.created_at)}
                            </Typography>

                            <Stack direction="row" alignItems="center" gap={0.4}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenViewModal(user)}
                                  sx={circleActionSx(COLORS.primary, COLORS.primarySoft)}
                                >
                                  <VisibilityOutlinedIcon sx={{ fontSize: "0.85rem" }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={isSelfRow ? SELF_ACTION_TOOLTIP : "Edit User"}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenEditModal(user)}
                                    disabled={isSelfRow}
                                    sx={isSelfRow ? disabledCircleActionSx : circleActionSx(COLORS.warning, COLORS.warningSoft)}
                                  >
                                    <EditOutlinedIcon sx={{ fontSize: "0.85rem" }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title={isSelfRow ? SELF_ACTION_TOOLTIP : "Delete User"}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setUserToDelete(user);
                                      setDeleteDialogOpen(true);
                                    }}
                                    disabled={isSelfRow}
                                    sx={isSelfRow ? disabledCircleActionSx : circleActionSx(COLORS.danger, COLORS.dangerSoft)}
                                  >
                                    <DeleteOutlineOutlinedIcon sx={{ fontSize: "0.85rem" }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>
                          </Box>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>

                {/* Grid Pagination */}
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
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
                    rowsPerPageOptions={[6, 12, 24, 48]}
                    sx={{
                      "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                        fontSize: "0.72rem",
                        color: COLORS.textSecondary,
                      },
                      "& .MuiTablePagination-select": { fontSize: "0.72rem" },
                    }}
                  />
                </Box>
              </>
            )}
          </Box>
        )}
      </Box>

      {/* ================= ADD / EDIT USER POPUP MODAL (DIALOG) ================= */}
      <Dialog
        open={userModalOpen}
        onClose={() => !formSubmitting && setUserModalOpen(false)}
        TransitionComponent={SlideTransition}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "14px",
            p: 0,
            overflow: "hidden",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
          },
        }}
      >
        {/* Modal Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2,
            backgroundColor: COLORS.primary,
            color: "#FFFFFF",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PersonAddAlt1OutlinedIcon sx={{ color: COLORS.accentGold, fontSize: "1.2rem" }} />
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>
              {modalMode === "add" ? "Add New User Account" : "Edit User Account"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setUserModalOpen(false)} disabled={formSubmitting} sx={{ color: "#FFFFFF", opacity: 0.8, "&:hover": { opacity: 1 } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {modalLoading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress size={32} sx={{ color: COLORS.primary }} />
            <Typography sx={{ mt: 1.5, fontSize: "0.8rem", color: COLORS.textSecondary, fontWeight: 600 }}>
              Loading user details...
            </Typography>
          </Box>
        ) : (
          <DialogContent sx={{ p: 3, maxHeight: "75vh", overflowY: "auto", ...customScrollbarSx }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              
              <SectionTitle>Basic Information</SectionTitle>
              
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Full Name *</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. Rahul Sharma"
                    value={userForm.full_name}
                    onChange={(e) => handleFormChange("full_name", e.target.value)}
                    error={Boolean(formErrors.full_name)}
                    helperText={formErrors.full_name || ""}
                    sx={controlSx}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FieldLabel>Username *</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. rahul_sharma"
                    value={userForm.username}
                    onChange={(e) => handleFormChange("username", e.target.value)}
                    error={Boolean(formErrors.username)}
                    helperText={formErrors.username || ""}
                    sx={controlSx}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FieldLabel>Email Address *</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    type="email"
                    placeholder="rahul@solar.com"
                    value={userForm.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    error={Boolean(formErrors.email)}
                    helperText={formErrors.email || ""}
                    sx={controlSx}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FieldLabel>Phone Number *</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="+91 98765 43210"
                    value={userForm.phone}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                    error={Boolean(formErrors.phone)}
                    helperText={formErrors.phone || ""}
                    sx={controlSx}
                  />
                </Grid>
              </Grid>

              <SectionTitle>Role &amp; Reporting</SectionTitle>

              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={Number(userForm.role_id) === ROLE_SALES ? 6 : 12}>
                  <FieldLabel>Assign Role *</FieldLabel>
                  <Select
                    fullWidth
                    size="small"
                    value={userForm.role_id}
                    onChange={(e) => handleFormChange("role_id", e.target.value)}
                    IconComponent={KeyboardArrowDownRoundedIcon}
                    sx={controlSx}
                  >
                    <MenuItem value={ROLE_SUPER_ADMIN} sx={{ fontSize: "0.8rem" }}>Super Admin</MenuItem>
                    {can("has_manager_role") && (
                      <MenuItem value={ROLE_MANAGER} sx={{ fontSize: "0.8rem" }}>Manager</MenuItem>
                    )}
                    <MenuItem value={ROLE_SALES} sx={{ fontSize: "0.8rem" }}>Sales Representative</MenuItem>
                  </Select>
                </Grid>

                {Number(userForm.role_id) === ROLE_SALES && (
                  <Grid item xs={12} sm={6}>
                    <FieldLabel>Reporting Manager *</FieldLabel>
                    <Select
                      fullWidth
                      displayEmpty
                      size="small"
                      value={userForm.manager_id}
                      onChange={(e) => handleFormChange("manager_id", e.target.value)}
                      IconComponent={KeyboardArrowDownRoundedIcon}
                      error={Boolean(formErrors.manager_id)}
                      sx={controlSx}
                      renderValue={(val) =>
                        val === "" ? (
                          <Box component="span" sx={{ color: COLORS.textMuted, fontSize: "0.8rem" }}>Select a manager...</Box>
                        ) : (
                          managersList.find((m) => String(m.id) === String(val))?.full_name || ""
                        )
                      }
                    >
                      {managersList.map((mgr) => (
                        <MenuItem key={mgr.id} value={mgr.id} sx={{ fontSize: "0.8rem" }}>
                          {mgr.full_name} ({mgr.role_name || "Manager"})
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.manager_id && (
                      <Typography sx={{ color: COLORS.danger, fontSize: "0.7rem", mt: 0.5 }}>
                        {formErrors.manager_id}
                      </Typography>
                    )}
                  </Grid>
                )}
              </Grid>

              {modalMode === "add" && (
                <>
                  <SectionTitle>Security Credentials</SectionTitle>

                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6}>
                      <FieldLabel>Password *</FieldLabel>
                      <TextField
                        fullWidth
                        size="small"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min 8 chars, uppercase & special"
                        value={userForm.password}
                        onChange={(e) => handleFormChange("password", e.target.value)}
                        error={Boolean(formErrors.password)}
                        helperText={formErrors.password || ""}
                        sx={controlSx}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
                                {showPassword ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FieldLabel>Confirm Password *</FieldLabel>
                      <TextField
                        fullWidth
                        size="small"
                        type={showPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={userForm.confirm_password}
                        onChange={(e) => handleFormChange("confirm_password", e.target.value)}
                        error={Boolean(formErrors.confirm_password)}
                        helperText={formErrors.confirm_password || ""}
                        sx={controlSx}
                      />
                    </Grid>
                  </Grid>
                </>
              )}

            </Box>
          </DialogContent>
        )}

        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${COLORS.border}`, gap: 1, backgroundColor: COLORS.card }}>
          <Button variant="outlined" onClick={() => setUserModalOpen(false)} disabled={formSubmitting} sx={outlinedButtonSx}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveUser}
            disabled={formSubmitting || modalLoading}
            startIcon={formSubmitting ? <CircularProgress size={14} color="inherit" /> : <AddIcon sx={{ fontSize: 16 }} />}
            sx={primaryButtonSx}
          >
            {modalMode === "add" ? "Create User" : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= VIEW DETAILS MODAL (DIALOG) ================= */}
      <Dialog
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "14px", p: 0, overflow: "hidden" },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.5,
            py: 1.8,
            backgroundColor: COLORS.primary,
            color: "#FFFFFF",
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>User Account Profile</Typography>
          <IconButton size="small" onClick={() => setViewModalOpen(false)} sx={{ color: "#FFFFFF", opacity: 0.8, "&:hover": { opacity: 1 } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {modalLoading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress size={30} sx={{ color: COLORS.primary }} />
          </Box>
        ) : viewDetails ? (
          <DialogContent sx={{ p: 2.5, maxHeight: "75vh", overflowY: "auto", ...customScrollbarSx }}>
            <Box sx={{ textAlign: "center", mb: 2.5 }}>
              <Avatar
                src={getAvatarUrl(viewDetails.profile_image)}
                sx={{
                  width: 60,
                  height: 60,
                  mx: "auto",
                  mb: 1,
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  backgroundColor: COLORS.primaryDark,
                  color: "#FFFFFF",
                  border: `2px solid ${COLORS.border}`,
                }}
              >
                {getInitials(viewDetails.full_name)}
              </Avatar>
              <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: COLORS.textPrimary }}>
                {viewDetails.full_name}
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: COLORS.textMuted }}>
                @{viewDetails.username}
              </Typography>
              {viewDetails.role_name && (
                <Chip
                  label={viewDetails.role_name}
                  size="small"
                  sx={{
                    mt: 0.8,
                    backgroundColor: getRoleChipByName(viewDetails.role_name).bg,
                    color: getRoleChipByName(viewDetails.role_name).color,
                    fontWeight: 800,
                    fontSize: "0.68rem",
                    height: 22,
                  }}
                />
              )}
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[
                { icon: <MailOutlineRoundedIcon sx={{ fontSize: "0.85rem" }} />, label: "Email", value: viewDetails.email },
                { icon: <CallOutlinedIcon sx={{ fontSize: "0.85rem" }} />, label: "Phone", value: viewDetails.phone || "N/A" },
                { icon: <BadgeIcon sx={{ fontSize: "0.85rem" }} />, label: "Username", value: viewDetails.username },
                { icon: <ShieldOutlinedIcon sx={{ fontSize: "0.85rem" }} />, label: "Role", value: viewDetails.role_name || "N/A" },
                { icon: <GroupsOutlinedIcon sx={{ fontSize: "0.85rem" }} />, label: "Manager", value: viewDetails.manager_name || "None assigned" },
                { icon: <EventOutlinedIcon sx={{ fontSize: "0.85rem" }} />, label: "Created", value: formatDateTime(viewDetails.created_at) },
              ].map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                    p: 1,
                    borderRadius: "8px",
                    backgroundColor: "#F8FAFC",
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  <Avatar sx={{ width: 30, height: 30, borderRadius: "6px", bgcolor: COLORS.primarySoft, color: COLORS.primary }}>
                    {item.icon}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: "0.62rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                      {item.label}
                    </Typography>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: COLORS.textPrimary, wordBreak: "break-word" }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </DialogContent>
        ) : null}

        <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}`, justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={() => setViewModalOpen(false)} sx={outlinedButtonSx}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= DELETE CONFIRMATION DIALOG ================= */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteDialogOpen(false);
            setUserToDelete(null);
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            p: 1,
            maxWidth: 380,
            width: "100%",
          },
        }}
      >
        <Box sx={{ p: 1.5, textAlign: "center" }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "12px",
              backgroundColor: COLORS.dangerSoft,
              color: COLORS.danger,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 1.5,
            }}
          >
            <WarningAmberOutlinedIcon sx={{ fontSize: "1.8rem" }} />
          </Box>
          <DialogTitle sx={{ fontWeight: 800, fontSize: "1.05rem", color: COLORS.textPrimary, p: 0, mb: 0.5 }}>
            Delete User Account?
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <DialogContentText sx={{ fontSize: "0.8rem", color: COLORS.textSecondary }}>
              Are you sure you want to delete{" "}
              <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
                {userToDelete?.full_name}
              </Box>
              ? This user will lose access to Solar CRM immediately.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 0, mt: 2, gap: 1, justifyContent: "center" }}>
            <Button
              variant="outlined"
              onClick={() => {
                setDeleteDialogOpen(false);
                setUserToDelete(null);
              }}
              disabled={deleting}
              sx={outlinedButtonSx}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmDelete}
              disabled={deleting}
              startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteOutlineOutlinedIcon sx={{ fontSize: 16 }} />}
              sx={{
                ...primaryButtonSx,
                backgroundColor: COLORS.danger,
                "&:hover": {
                  backgroundColor: "#B91C1C",
                },
              }}
            >
              {deleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ================= TOAST / SNACKBAR ================= */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: "100%",
            fontWeight: 600,
            fontSize: "0.8rem",
            borderRadius: "8px",
          }}
          iconMapping={{
            success: <CheckCircleOutlineOutlinedIcon sx={{ fontSize: "1.1rem" }} />,
            error: <ErrorOutlineOutlinedIcon sx={{ fontSize: "1.1rem" }} />,
            warning: <WarningAmberOutlinedIcon sx={{ fontSize: "1.1rem" }} />,
            info: <InfoOutlinedIcon sx={{ fontSize: "1.1rem" }} />,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users;