import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getEngineerDashboardStats } from "../../services/dashboardService";
import { useAuth } from "../../context/AuthContext";

// MUI
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  Grid,
  Stack,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from "@mui/material";

// Icons
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import FlashOnOutlinedIcon from "@mui/icons-material/FlashOnOutlined";

export default function EngineerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todaySurveys: 0,
    pendingSurveys: 0,
    completedSurveys: 0,
    activeProjects: 0,
    todaySchedule: [],
    recentSurveys: [],
  });

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getEngineerDashboardStats();
      if (res?.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Error loading engineer dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      title: "TODAY'S SCHEDULED",
      count: stats.todaySurveys,
      icon: <EventAvailableOutlinedIcon sx={{ fontSize: "1.6rem", color: "#0284C7" }} />,
      bg: "#E0F2FE",
      color: "#0284C7",
      desc: "Surveys scheduled for today",
    },
    {
      title: "PENDING VISITS",
      count: stats.pendingSurveys,
      icon: <PendingActionsOutlinedIcon sx={{ fontSize: "1.6rem", color: "#F59E0B" }} />,
      bg: "#FEF3C7",
      color: "#D97706",
      desc: "Pending survey assignments",
    },
    {
      title: "SURVEYS COMPLETED",
      count: stats.completedSurveys,
      icon: <AssignmentTurnedInOutlinedIcon sx={{ fontSize: "1.6rem", color: "#16A34A" }} />,
      bg: "#DCFCE7",
      color: "#16A34A",
      desc: "Total completed feasibility reports",
    },
    {
      title: "ACTIVE INSTALLATIONS",
      count: stats.activeProjects,
      icon: <EngineeringOutlinedIcon sx={{ fontSize: "1.6rem", color: "#8B5CF6" }} />,
      bg: "#EDE9FE",
      color: "#7C3AED",
      desc: "Projects currently in execution",
    },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      {/* WELCOME BANNER */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderRadius: "12px",
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          color: "#FFFFFF",
          mb: 3,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
            Welcome back, {user?.full_name || "Engineer"}! ⚡
          </Typography>
          <Typography sx={{ fontSize: "0.82rem", color: "#94A3B8", mt: 0.5 }}>
            Here is your daily site survey schedule, field inspections, and technical reports overview.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="contained"
            onClick={() => navigate("/engineer/surveys")}
            startIcon={<AssignmentTurnedInOutlinedIcon />}
            sx={{
              backgroundColor: "#0284C7",
              color: "#FFFFFF",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.82rem",
              borderRadius: "8px",
              px: 2,
              "&:hover": { backgroundColor: "#0369A1" },
            }}
          >
            My Surveys
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate("/engineer/calculator")}
            startIcon={<FlashOnOutlinedIcon />}
            sx={{
              borderColor: "#334155",
              color: "#F8FAFC",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.82rem",
              borderRadius: "8px",
              px: 2,
              "&:hover": { borderColor: "#0284C7", backgroundColor: "#1E293B" },
            }}
          >
            Solar Calculator
          </Button>
        </Stack>
      </Paper>

      {/* METRIC CARDS */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {statCards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card
              elevation={0}
              sx={{
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
                height: "100%",
                transition: "transform 0.15s, box-shadow 0.15s",
                "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 20px rgba(0,0,0,0.06)" },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748B", letterSpacing: "0.05em" }}>
                    {card.title}
                  </Typography>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "10px",
                      backgroundColor: card.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>
                {loading ? (
                  <Skeleton width={60} height={38} />
                ) : (
                  <Typography sx={{ fontSize: "1.75rem", fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>
                    {card.count}
                  </Typography>
                )}
                <Typography sx={{ fontSize: "0.72rem", color: "#94A3B8", mt: 1 }}>
                  {card.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* TODAY'S SCHEDULE TABLE */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: "12px",
          border: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: "0.98rem", fontWeight: 800, color: "#0F172A" }}>
              Today's Field Visits & Site Surveys
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "#64748B" }}>
              Sites scheduled for inspection today
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={() => navigate("/engineer/surveys")}
            endIcon={<ArrowForwardOutlinedIcon />}
            sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.78rem" }}
          >
            View All Surveys
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ py: 3 }}>
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </Box>
        ) : stats.todaySchedule.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                margin: "0 auto 12px auto",
                backgroundColor: "#F1F5F9",
                color: "#94A3B8",
              }}
            >
              <EventAvailableOutlinedIcon />
            </Avatar>
            <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: "#0F172A" }}>
              No Surveys Scheduled For Today
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", color: "#64748B", mt: 0.5 }}>
              You are all caught up on today's visits or check the complete surveys list.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.72rem", color: "#64748B" }}>TIME</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.72rem", color: "#64748B" }}>CUSTOMER / LEAD</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.72rem", color: "#64748B" }}>CAPACITY</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.72rem", color: "#64748B" }}>LOCATION / ADDRESS</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: "0.72rem", color: "#64748B" }}>STATUS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.72rem", color: "#64748B" }}>ACTION</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.todaySchedule.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem", color: "#0284C7" }}>
                      {row.scheduled_time}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#0F172A" }}>
                        {row.customer_name || "Customer"}
                      </Typography>
                      <Typography sx={{ fontSize: "0.72rem", color: "#64748B" }}>
                        {row.lead_code}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
                      {row.required_kw ? `${row.required_kw} kW` : "—"}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, maxWidth: 260 }}>
                        <LocationOnOutlinedIcon sx={{ fontSize: "0.85rem", color: "#94A3B8" }} />
                        <Typography sx={{ fontSize: "0.75rem", color: "#334155" }} noWrap>
                          {[row.address, row.city, row.state].filter(Boolean).join(", ") || "—"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.status === "completed" ? "Completed" : "Scheduled"}
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.7rem",
                          backgroundColor: row.status === "completed" ? "#DCFCE7" : "#E0F2FE",
                          color: row.status === "completed" ? "#16A34A" : "#0284C7",
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => navigate("/engineer/surveys")}
                        sx={{
                          backgroundColor: "#0F172A",
                          color: "#FFFFFF",
                          textTransform: "none",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          borderRadius: "6px",
                          py: 0.5,
                          px: 1.5,
                          "&:hover": { backgroundColor: "#1E293B" },
                        }}
                      >
                        {row.status === "completed" ? "View Details" : "Start Survey"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
