const {
  getStatusBreakdown,
  getTeamPerformance,
  getPendingToday,
  getConvertedToday,
  getRecentActivity,
  getTodaysFollowupsList,
  getOverdueFollowupsCount,
  getSalesSummary,
  getSalesActivityTimeline,
  getSalesStatusBreakdown,
  getSalesFollowupsList,
  getAdminOverview,
  getAdminStatusBreakdown,
  getAdminSourcePerformance,
  getAdminMonthlyTrend,
  getAdminRecentLeads,
  getAdminActivityFeed,
} = require("../models/dashboardModel");

const getManagerDashboardStatsController = async (req, res) => {
  try {
    const managerId = req.user ? req.user.id : null;

    if (!managerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request.",
      });
    }

    // ⚡ Parallel Execution (Max Performance)
    const [
      statusBreakdown,
      teamPerformance,
      pendingToday,
      convertedToday,
      recentActivity,
      todaysFollowupsList,
      overdueFollowups,
    ] = await Promise.all([
      getStatusBreakdown(managerId, req.db),
      getTeamPerformance(managerId, req.db),
      getPendingToday(managerId, req.db),
      getConvertedToday(managerId, req.db),
      getRecentActivity(managerId, req.db),
      getTodaysFollowupsList(managerId, req.db),
      getOverdueFollowupsCount(managerId, req.db),
    ]);

    return res.status(200).json({
      success: true,
      message: "Manager dashboard data fetched successfully.",
      data: {
        statusBreakdown: statusBreakdown || [],
        teamPerformance: teamPerformance || [],
        pendingToday: pendingToday || 0,
        convertedToday: convertedToday || 0,
        overdueFollowups: overdueFollowups || 0,
        todaysFollowupsList: todaysFollowupsList || [],
        recentActivity: recentActivity || [],
      },
    });
  } catch (error) {
    console.error("Error in Manager Dashboard Controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

// 🟢 Sales Rep — Own Dashboard Stats
const getSalesDashboardStatsController = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request.",
      });
    }

    const [summary, activityTimeline, statusBreakdown, followupsList] = await Promise.all([
      getSalesSummary(userId, req.db),
      getSalesActivityTimeline(userId, 10, req.db),
      getSalesStatusBreakdown(userId, req.db),
      getSalesFollowupsList(userId, req.db),
    ]);

    return res.status(200).json({
      success: true,
      message: "Sales dashboard data fetched successfully.",
      data: { ...summary, activityTimeline, statusBreakdown, followupsList },
    });
  } catch (error) {
    console.error("Error in Sales Dashboard Controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

// 🟣 Admin — Org-wide Dashboard Stats
const getAdminDashboardStatsController = async (req, res) => {
  try {
    const [overview, statusBreakdown, sourcePerformance, monthlyTrend, recentLeads, activityFeed] =
      await Promise.all([
        getAdminOverview(req.db),
        getAdminStatusBreakdown(req.db),
        getAdminSourcePerformance(req.db),
        getAdminMonthlyTrend(req.db),
        getAdminRecentLeads(6, req.db),
        getAdminActivityFeed(15, req.db),
      ]);

    return res.status(200).json({
      success: true,
      message: "Admin dashboard data fetched successfully.",
      data: { ...overview, statusBreakdown, sourcePerformance, monthlyTrend, recentLeads, activityFeed },
    });
  } catch (error) {
    console.error("Error in Admin Dashboard Controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

module.exports = {
  getManagerDashboardStats: getManagerDashboardStatsController,
  getSalesDashboardStats: getSalesDashboardStatsController,
  getAdminDashboardStats: getAdminDashboardStatsController,
};