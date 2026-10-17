import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Chip,
  IconButton,
  Stack,
  Tabs,
  Tab,
  CircularProgress,
  Card,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from "@mui/material";

// Icons
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SolarPowerOutlinedIcon from "@mui/icons-material/SolarPowerOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddIcon from "@mui/icons-material/Add";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { getCustomerById, updateCustomer } from "../../services/customerService";

const COLORS = {
  primary: "#0F172A",
  primaryDark: "#020617",
  border: "#E2E8F0",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  bgSubtle: "#F8FAFC",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  info: "#0284C7",
  infoSoft: "#E0F2FE",
};

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const roleName = (user?.role_name || user?.role || "").toLowerCase();
  const isManager = user?.role_id === 2 || roleName.includes("manager");
  const customersBasePath = isManager ? "/manager/customers" : "/customers";
  const projectsBasePath = isManager ? "/manager/projects" : "/projects";

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Edit Modal State
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomerById(id);
      if (res?.success) {
        setCustomer(res.data);
        setEditData(res.data);
      } else {
        toast.error("Customer not found");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customer profile");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await updateCustomer(id, editData);
      if (res?.success) {
        toast.success("Customer profile updated!");
        setOpenEditModal(false);
        fetchProfile();
      } else {
        toast.error(res?.message || "Failed to update");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating customer");
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <CircularProgress size={36} sx={{ color: COLORS.primary }} />
        <Typography variant="body2" sx={{ mt: 1.5, color: COLORS.textSecondary }}>
          Loading 360° customer profile...
        </Typography>
      </Box>
    );
  }

  if (!customer) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.primary }}>
          Customer Not Found
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(customersBasePath)}
          sx={{ mt: 2, textTransform: "none" }}
        >
          Back to Directory
        </Button>
      </Box>
    );
  }

  const projects = customer.projects || [];
  const quotations = customer.quotations || [];
  const invoices = customer.invoices || [];
  const leads = customer.leads || [];

  const totalBilled = invoices.reduce((acc, inv) => acc + (parseFloat(inv.gross_total) || 0), 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + (parseFloat(inv.amount_paid) || 0), 0);
  const totalBalance = invoices.reduce((acc, inv) => acc + (parseFloat(inv.balance_due) || 0), 0);
  const totalKw = projects.reduce((acc, p) => acc + (parseFloat(p.system_capacity_kw) || 0), 0);

  return (
    <Box sx={{ pb: 6 }}>
      {/* Back button & Breadcrumb */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(customersBasePath)}
          sx={{ color: COLORS.textSecondary, textTransform: "none", fontWeight: 600 }}
        >
          Back to Customers
        </Button>
      </Stack>

      {/* Header Customer Profile Card */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: "12px", border: `1px solid ${COLORS.border}` }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={7}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: "#EFF6FF", borderRadius: "12px", color: "#1D4ED8", mt: 0.5 }}>
                <PersonIcon sx={{ fontSize: 32 }} />
              </Box>

              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.primary }}>
                    {customer.customer_name}
                  </Typography>
                  <Chip
                    size="small"
                    label={customer.customer_code}
                    sx={{ bgcolor: COLORS.primary, color: "#FFFFFF", fontWeight: 700, fontFamily: "monospace" }}
                  />
                  <Chip
                    size="small"
                    label={customer.solar_requirement || "Residential"}
                    sx={{ bgcolor: COLORS.warningSoft, color: COLORS.warning, fontWeight: 700 }}
                  />
                </Stack>

                <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: "wrap" }}>
                  <Typography variant="body2" sx={{ color: COLORS.textSecondary, display: "flex", alignItems: "center", gap: 0.5 }}>
                    <PhoneIcon sx={{ fontSize: 16 }} /> {customer.mobile_number}
                  </Typography>
                  {customer.email && (
                    <Typography variant="body2" sx={{ color: COLORS.textSecondary, display: "flex", alignItems: "center", gap: 0.5 }}>
                      <EmailIcon sx={{ fontSize: 16 }} /> {customer.email}
                    </Typography>
                  )}
                  {customer.city && (
                    <Typography variant="body2" sx={{ color: COLORS.textSecondary, display: "flex", alignItems: "center", gap: 0.5 }}>
                      <LocationOnIcon sx={{ fontSize: 16 }} /> {[customer.city, customer.state].filter(Boolean).join(", ")}
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Box>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={5}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<WhatsAppIcon sx={{ color: "#25D366" }} />}
                onClick={() => {
                  const phone = customer.mobile_number?.replace(/\D/g, "");
                  window.open(`https://wa.me/91${phone.slice(-10)}`, "_blank");
                }}
                sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, borderColor: COLORS.border }}
              >
                WhatsApp
              </Button>

              <Button
                variant="outlined"
                startIcon={<EditOutlinedIcon />}
                onClick={() => setOpenEditModal(true)}
                sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, borderColor: COLORS.border }}
              >
                Edit Info
              </Button>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate(isManager ? "/manager/quotations" : "/quotations")}
                sx={{ bgcolor: COLORS.primary, borderRadius: "8px", textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: COLORS.primaryDark } }}
              >
                + New Proposal
              </Button>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        {/* Aggregated KPI Strip */}
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>Active Projects</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary }}>
              {projects.length} ({totalKw.toFixed(1)} kW)
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>Total Billed Value</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.primary }}>
              ₹{Math.round(totalBilled).toLocaleString("en-IN")}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>Total Paid in Bank</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.success }}>
              ₹{Math.round(totalPaid).toLocaleString("en-IN")}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>Outstanding Balance</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: totalBalance > 0 ? COLORS.danger : COLORS.success }}>
              ₹{Math.round(totalBalance).toLocaleString("en-IN")}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 360° Tabs */}
      <Paper elevation={0} sx={{ borderRadius: "12px", border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            borderBottom: `1px solid ${COLORS.border}`,
            bgcolor: "#F8FAFC",
            "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: "0.82rem", minHeight: 48 },
          }}
        >
          <Tab icon={<PersonIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Overview & Grid Specs" />
          <Tab icon={<EngineeringOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Projects (${projects.length})`} />
          <Tab icon={<DescriptionOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Quotations (${quotations.length})`} />
          <Tab icon={<ReceiptLongOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Invoices & Ledger (${invoices.length})`} />
          <Tab icon={<SolarPowerOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`Original Leads (${leads.length})`} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* TAB 0: Overview & Grid */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ p: 2.5, border: `1px solid ${COLORS.border}`, borderRadius: "10px", height: "100%" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary, mb: 1.5 }}>
                    Grid &amp; Electricity Consumer Details
                  </Typography>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>CA / Consumer No:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.primary }}>
                        {customer.electricity_consumer_number || "Not specified"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Discom Authority:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.primary }}>
                        {customer.discom_name || "Not specified"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Sanctioned Grid Load:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.primary }}>
                        {customer.sanctioned_load_kw ? `${customer.sanctioned_load_kw} kW` : "Not specified"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>GSTIN / Tax ID:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.primary }}>
                        {customer.customer_gstin || "N/A"}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ p: 2.5, border: `1px solid ${COLORS.border}`, borderRadius: "10px", height: "100%" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: COLORS.primary, mb: 1.5 }}>
                    Installation Address &amp; Metadata
                  </Typography>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Site Address:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.primary, textAlign: "right", maxWidth: "60%" }}>
                        {customer.address || "Not specified"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>City / State / PIN:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.primary }}>
                        {[customer.city, customer.state, customer.pincode].filter(Boolean).join(", ") || "—"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Assigned Rep / Manager:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.primary }}>
                        {customer.assigned_to_name || "Not assigned"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Customer Since:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.primary }}>
                        {new Date(customer.created_at).toLocaleDateString("en-IN", { dateStyle: "long" })}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* TAB 1: Projects */}
          {activeTab === 1 && (
            <Box>
              {projects.length === 0 ? (
                <Typography variant="body2" sx={{ color: COLORS.textSecondary, py: 4, textAlign: "center" }}>
                  No execution projects found for this customer yet.
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: COLORS.primary }}>
                      <TableRow>
                        <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>PROJECT #</TableCell>
                        <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>CAPACITY</TableCell>
                        <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>CURRENT STAGE</TableCell>
                        <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>ASSIGNED ENGINEER</TableCell>
                        <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, textAlign: "right" }}>ACTION</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {projects.map((p) => (
                        <TableRow key={p.id} hover>
                          <TableCell sx={{ fontWeight: 700, fontFamily: "monospace" }}>{p.project_number}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{p.system_capacity_kw} kW</TableCell>
                          <TableCell>
                            <Chip size="small" label={p.stage} sx={{ bgcolor: COLORS.warningSoft, color: COLORS.warning, fontWeight: 700 }} />
                          </TableCell>
                          <TableCell>{p.assigned_to_name || "Unassigned"}</TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                              onClick={() => navigate(`${projectsBasePath}/${p.id}`)}
                              sx={{ textTransform: "none", fontWeight: 700 }}
                            >
                              Track Stage
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* TAB 2: Quotations */}
          {activeTab === 2 && (
            <Box>
              {quotations.length === 0 ? (
                <Typography variant="body2" sx={{ color: COLORS.textSecondary, py: 4, textAlign: "center" }}>
                  No quotations created for this customer yet.
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: COLORS.primary }}>
                      <TableRow>
                        <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>QUOTATION #</TableCell>
                        <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>SYSTEM</TableCell>
                        <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, textAlign: "right" }}>AMOUNT</TableCell>
                        <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, textAlign: "center" }}>STATUS</TableCell>
                        <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, textAlign: "right" }}>VIEW</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {quotations.map((q) => (
                        <TableRow key={q.id} hover>
                          <TableCell sx={{ fontWeight: 700, fontFamily: "monospace" }}>{q.quotation_number}</TableCell>
                          <TableCell>{q.system_capacity_kw} kW ({q.system_type})</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            ₹{Math.round(q.net_payable_amount || 0).toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell align="center">
                            <Chip size="small" label={q.status} sx={{ fontWeight: 700 }} />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              onClick={() => window.open(`/quote/${q.public_token || q.id}`, "_blank")}
                              sx={{ textTransform: "none", fontWeight: 700 }}
                            >
                              Open Proposal ↗
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* TAB 3: Invoices */}
          {activeTab === 3 && (
            <Box>
              {invoices.length === 0 ? (
                <Typography variant="body2" sx={{ color: COLORS.textSecondary, py: 4, textAlign: "center" }}>
                  No tax invoices recorded for this customer yet.
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: COLORS.primary }}>
                      <TableRow>
                        <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>INVOICE #</TableCell>
                        <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>DATE</TableCell>
                        <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, textAlign: "right" }}>GROSS TOTAL</TableCell>
                        <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, textAlign: "right" }}>PAID</TableCell>
                        <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, textAlign: "right" }}>BALANCE</TableCell>
                        <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, textAlign: "center" }}>STATUS</TableCell>
                        <TableCell sx={{ color: "#FFFFFF", fontWeight: 700, textAlign: "right" }}>VIEW</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoices.map((inv) => (
                        <TableRow key={inv.id} hover>
                          <TableCell sx={{ fontWeight: 700, fontFamily: "monospace" }}>{inv.invoice_number}</TableCell>
                          <TableCell>{new Date(inv.invoice_date).toLocaleDateString("en-IN")}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            ₹{Math.round(inv.gross_total || 0).toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: COLORS.success }}>
                            ₹{Math.round(inv.amount_paid || 0).toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: parseFloat(inv.balance_due) > 0 ? COLORS.danger : COLORS.success }}>
                            ₹{Math.round(inv.balance_due || 0).toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell align="center">
                            <Chip size="small" label={inv.payment_status} sx={{ fontWeight: 700 }} />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              onClick={() => window.open(`/invoice/${inv.public_token || inv.id}`, "_blank")}
                              sx={{ textTransform: "none", fontWeight: 700 }}
                            >
                              PDF / View ↗
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* TAB 4: Leads */}
          {activeTab === 4 && (
            <Box>
              {leads.length === 0 ? (
                <Typography variant="body2" sx={{ color: COLORS.textSecondary, py: 4, textAlign: "center" }}>
                  No lead interactions logged.
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: COLORS.primary }}>
                      <TableRow>
                        <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>LEAD CODE</TableCell>
                        <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>STATUS</TableCell>
                        <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>ASSIGNED TO</TableCell>
                        <TableCell sx={{ color: "#FFFFFF", fontWeight: 700 }}>CREATED DATE</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leads.map((l) => (
                        <TableRow key={l.id} hover>
                          <TableCell sx={{ fontWeight: 700, fontFamily: "monospace" }}>{l.lead_code}</TableCell>
                          <TableCell>
                            <Chip size="small" label={l.status} sx={{ fontWeight: 700 }} />
                          </TableCell>
                          <TableCell>{l.assigned_to_name || "Unassigned"}</TableCell>
                          <TableCell>{new Date(l.created_at).toLocaleDateString("en-IN")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Edit Customer Modal */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "12px" } }}>
        <DialogTitle sx={{ bgcolor: COLORS.primary, color: "#FFFFFF", py: 2 }}>
          Edit Customer Profile ({customer.customer_code})
        </DialogTitle>
        <form onSubmit={handleSaveEdit}>
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Customer Name" name="customer_name" value={editData.customer_name || ""} onChange={handleEditChange} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Mobile Number" name="mobile_number" value={editData.mobile_number || ""} onChange={handleEditChange} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Alternate Phone" name="alternate_number" value={editData.alternate_number || ""} onChange={handleEditChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Email" name="email" value={editData.email || ""} onChange={handleEditChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="CA / Consumer Number" name="electricity_consumer_number" value={editData.electricity_consumer_number || ""} onChange={handleEditChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Discom Provider" name="discom_name" value={editData.discom_name || ""} onChange={handleEditChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" type="number" label="Sanctioned Load (kW)" name="sanctioned_load_kw" value={editData.sanctioned_load_kw || ""} onChange={handleEditChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="GSTIN" name="customer_gstin" value={editData.customer_gstin || ""} onChange={handleEditChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Address" name="address" value={editData.address || ""} onChange={handleEditChange} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="City" name="city" value={editData.city || ""} onChange={handleEditChange} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="State" name="state" value={editData.state || ""} onChange={handleEditChange} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Pincode" name="pincode" value={editData.pincode || ""} onChange={handleEditChange} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${COLORS.border}` }}>
            <Button onClick={() => setOpenEditModal(false)} sx={{ color: COLORS.textSecondary }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={savingEdit} sx={{ bgcolor: COLORS.primary, "&:hover": { bgcolor: COLORS.primaryDark } }}>
              {savingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
