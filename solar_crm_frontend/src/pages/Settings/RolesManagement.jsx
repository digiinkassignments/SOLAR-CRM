import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Tooltip,
  Alert,
  Divider,
} from "@mui/material";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { useAuth } from "../../context/AuthContext";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL?.replace(/\/api\/?$/, "")) ||
  "";

const RolesManagement = ({ showNotification }) => {
  const { token, user: authUser } = useAuth();

  const [roles, setRoles] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Roles and Permissions
  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/roles`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/roles/permissions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();

      if (rolesData.success) {
        setRoles(rolesData.data || []);
      }
      if (permsData.success) {
        setAvailablePermissions(permsData.data || []);
      }
    } catch (err) {
      console.error(err);
      showNotification?.("Failed to load roles & permissions.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group available permissions by group name
  const groupedPermissions = React.useMemo(() => {
    const groups = {};
    availablePermissions.forEach((p) => {
      const g = p.group || "Other";
      if (!groups[g]) groups[g] = [];
      groups[g].push(p);
    });
    return groups;
  }, [availablePermissions]);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingRole(null);
    setRoleName("");
    setDescription("");
    setSelectedPermissions([]);
    setDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (role) => {
    setEditingRole(role);
    setRoleName(role.role_name);
    setDescription(role.description || "");
    setSelectedPermissions(Array.isArray(role.permissions) ? role.permissions : []);
    setDialogOpen(true);
  };

  // Toggle Single Permission
  const handleTogglePermission = (permId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  // Toggle Entire Group
  const handleToggleGroup = (groupPermissions) => {
    const groupIds = groupPermissions.map((p) => p.id);
    const allSelected = groupIds.every((id) => selectedPermissions.includes(id));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !groupIds.includes(id)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...groupIds])));
    }
  };

  // Select All Permissions
  const handleSelectAll = () => {
    const allIds = availablePermissions.map((p) => p.id);
    if (selectedPermissions.length === allIds.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(allIds);
    }
  };

  // Save Role
  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      showNotification?.("Role name is required.", "error");
      return;
    }

    try {
      setSaving(true);
      const url = editingRole
        ? `${API_BASE_URL}/api/roles/${editingRole.id}`
        : `${API_BASE_URL}/api/roles`;
      const method = editingRole ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role_name: roleName.trim(),
          description: description.trim(),
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showNotification?.(data.message, "success");
        setDialogOpen(false);
        fetchData();
      } else {
        showNotification?.(data.message || "Failed to save role.", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification?.("Server connection error.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Confirm Delete
  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      setDeleting(true);
      const res = await fetch(`${API_BASE_URL}/api/roles/${roleToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showNotification?.(data.message, "success");
        setDeleteConfirmOpen(false);
        setRoleToDelete(null);
        fetchData();
      } else {
        showNotification?.(data.message || "Failed to delete role.", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification?.("Failed to delete role.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "10px",
              backgroundColor: "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#F59E0B",
            }}
          >
            <ShieldOutlinedIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.05rem", lineHeight: 1.2 }}>
              Custom Roles & Permissions Management
            </Typography>
            <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.8rem" }}>
              Define company roles, configure dynamic access rights and grant module permissions.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          onClick={handleOpenCreate}
          sx={{
            backgroundColor: "#2563EB",
            color: "#FFFFFF",
            fontWeight: 600,
            fontSize: "0.85rem",
            textTransform: "none",
            borderRadius: "8px",
            px: 2.2,
            py: 1,
            boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
            "&:hover": { backgroundColor: "#1D4ED8" },
          }}
        >
          Create Custom Role
        </Button>
      </Paper>

      {/* Roles Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 6 }}>
            <CircularProgress size={32} sx={{ color: "#0F172A" }} />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: "#0F172A", fontSize: "0.82rem", py: 1.8 }}>ROLE NAME</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0F172A", fontSize: "0.82rem", py: 1.8 }}>DESCRIPTION</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0F172A", fontSize: "0.82rem", py: 1.8 }}>ACTIVE USERS</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0F172A", fontSize: "0.82rem", py: 1.8 }}>PERMISSIONS</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0F172A", fontSize: "0.82rem", py: 1.8 }}>TYPE</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: "#0F172A", fontSize: "0.82rem", py: 1.8 }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((role) => (
                  <TableRow
                    key={role.id}
                    hover
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      transition: "background 0.15s ease",
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: "8px",
                            backgroundColor: role.is_system ? "#EFF6FF" : "#FEF3C7",
                            color: role.is_system ? "#2563EB" : "#D97706",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {role.is_system ? <AdminPanelSettingsOutlinedIcon sx={{ fontSize: 18 }} /> : <SecurityOutlinedIcon sx={{ fontSize: 18 }} />}
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "#0F172A" }}>
                            {role.role_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.75rem" }}>
                            ID: #{role.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ color: "#64748B", fontSize: "0.85rem", maxWidth: 260 }}>
                      {role.description || "—"}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={`${role.user_count || 0} Member${role.user_count === 1 ? "" : "s"}`}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          backgroundColor: "#F1F5F9",
                          color: "#334155",
                          borderRadius: "6px",
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={`${role.permissions?.length || 0} Features`}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          backgroundColor: "#ECFDF5",
                          color: "#059669",
                          borderRadius: "6px",
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={role.is_system ? "System Role" : "Custom"}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          backgroundColor: role.is_system ? "#F8FAFC" : "#EFF6FF",
                          color: role.is_system ? "#64748B" : "#2563EB",
                          border: `1px solid ${role.is_system ? "#E2E8F0" : "#BFDBFE"}`,
                          borderRadius: "6px",
                        }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                        <Tooltip title="Edit Role & Permissions">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(role)}
                            sx={{ color: "#2563EB", "&:hover": { backgroundColor: "#EFF6FF" } }}
                          >
                            <EditOutlinedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>

                        {!role.is_system && (
                          <Tooltip title="Delete Custom Role">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setRoleToDelete(role);
                                setDeleteConfirmOpen(true);
                              }}
                              sx={{ color: "#DC2626", "&:hover": { backgroundColor: "#FEF2F2" } }}
                            >
                              <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* CREATE / EDIT ROLE DIALOG */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1.5,
            borderBottom: "1px solid #E2E8F0",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                backgroundColor: "#EFF6FF",
                color: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SecurityOutlinedIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", color: "#0F172A" }}>
                {editingRole ? `Edit Role: ${editingRole.role_name}` : "Create New Custom Role"}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B" }}>
                Select modules and features accessible to users assigned to this role.
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setDialogOpen(false)} size="small">
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5 }}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", mb: 0.5 }}>
                ROLE NAME *
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. Quality Auditor, Accountant, Surveyor"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                disabled={editingRole?.is_system && editingRole?.id === 1}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    backgroundColor: "#FFFFFF",
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", mb: 0.5 }}>
                ROLE DESCRIPTION
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Brief description of responsibilities"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    backgroundColor: "#FFFFFF",
                  },
                }}
              />
            </Grid>
          </Grid>

          {/* Permissions Matrix Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 1.5,
              backgroundColor: "#F8FAFC",
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              mb: 2,
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: "#0F172A" }}>
                FEATURE & MODULE PERMISSIONS MATRIX
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B" }}>
                {selectedPermissions.length} of {availablePermissions.length} permissions granted
              </Typography>
            </Box>
            <Button
              size="small"
              onClick={handleSelectAll}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.78rem",
                color: "#2563EB",
              }}
            >
              {selectedPermissions.length === availablePermissions.length ? "Deselect All" : "Select All"}
            </Button>
          </Box>

          {/* Grouped Permission Checkboxes */}
          <Grid container spacing={2}>
            {Object.keys(groupedPermissions).map((groupName) => {
              const perms = groupedPermissions[groupName];
              const allGroupSelected = perms.every((p) => selectedPermissions.includes(p.id));
              const someGroupSelected = perms.some((p) => selectedPermissions.includes(p.id));

              return (
                <Grid item xs={12} md={6} key={groupName}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: "10px",
                      border: "1px solid #E2E8F0",
                      backgroundColor: "#FFFFFF",
                      height: "100%",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        pb: 1,
                        mb: 1,
                        borderBottom: "1px solid #F1F5F9",
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#0F172A" }}>
                        {groupName}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => handleToggleGroup(perms)}
                        sx={{
                          fontSize: "0.72rem",
                          p: 0,
                          minWidth: "auto",
                          textTransform: "none",
                          color: "#64748B",
                          "&:hover": { color: "#2563EB" },
                        }}
                      >
                        {allGroupSelected ? "None" : "All"}
                      </Button>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      {perms.map((p) => {
                        const checked = selectedPermissions.includes(p.id);
                        return (
                          <FormControlLabel
                            key={p.id}
                            control={
                              <Checkbox
                                size="small"
                                checked={checked}
                                onChange={() => handleTogglePermission(p.id)}
                                sx={{
                                  color: "#CBD5E1",
                                  "&.Mui-checked": { color: "#2563EB" },
                                  p: 0.5,
                                }}
                              />
                            }
                            label={
                              <Typography sx={{ fontSize: "0.8rem", color: checked ? "#0F172A" : "#64748B", fontWeight: checked ? 600 : 400 }}>
                                {p.label}
                              </Typography>
                            }
                            sx={{ m: 0 }}
                          />
                        );
                      })}
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: "1px solid #E2E8F0" }}>
          <Button
            onClick={() => setDialogOpen(false)}
            sx={{
              color: "#64748B",
              fontWeight: 600,
              fontSize: "0.85rem",
              textTransform: "none",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveRole}
            disabled={saving}
            sx={{
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "0.85rem",
              textTransform: "none",
              borderRadius: "8px",
              px: 3,
              "&:hover": { backgroundColor: "#1D4ED8" },
            }}
          >
            {saving ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : editingRole ? "Save Changes" : "Create Role"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", color: "#0F172A" }}>
          Confirm Delete Role
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.88rem", color: "#64748B", mb: 1 }}>
            Are you sure you want to delete the custom role <strong>"{roleToDelete?.role_name}"</strong>?
          </Typography>
          <Alert severity="warning" sx={{ fontSize: "0.78rem", borderRadius: "8px" }}>
            This action cannot be undone. Users currently assigned must be reassigned first.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ textTransform: "none", color: "#64748B" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteRole}
            disabled={deleting}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: "8px" }}
          >
            {deleting ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RolesManagement;
