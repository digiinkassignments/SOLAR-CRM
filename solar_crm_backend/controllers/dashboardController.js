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
  getAdminTeamLeaderboard,
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
    const [overview, statusBreakdown, sourcePerformance, monthlyTrend, recentLeads, activityFeed, teamLeaderboard] =
      await Promise.all([
        getAdminOverview(req.db),
        getAdminStatusBreakdown(req.db),
        getAdminSourcePerformance(req.db),
        getAdminMonthlyTrend(req.db),
        getAdminRecentLeads(6, req.db),
        getAdminActivityFeed(15, req.db),
        getAdminTeamLeaderboard(req.db),
      ]);

    return res.status(200).json({
      success: true,
      message: "Admin dashboard data fetched successfully.",
      data: { ...overview, statusBreakdown, sourcePerformance, monthlyTrend, recentLeads, activityFeed, teamLeaderboard },
    });
  } catch (error) {
    console.error("Error in Admin Dashboard Controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

// Site Engineer Dashboard Stats Controller
const getEngineerDashboardStatsController = async (req, res) => {
  try {
    const engineerId = req.user ? req.user.id : null;
    const db = req.db;

    if (!engineerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request.",
      });
    }

    // Surveys Count
    const [[todaySurveysRow]] = await db.query(
      `SELECT COUNT(*) as count FROM site_surveys WHERE assigned_engineer_id = ? AND scheduled_date = CURDATE()`,
      [engineerId]
    ).catch(() => [[{ count: 0 }]]);

    const [[pendingSurveysRow]] = await db.query(
      `SELECT COUNT(*) as count FROM site_surveys WHERE assigned_engineer_id = ? AND status = 'scheduled'`,
      [engineerId]
    ).catch(() => [[{ count: 0 }]]);

    const [[completedSurveysRow]] = await db.query(
      `SELECT COUNT(*) as count FROM site_surveys WHERE assigned_engineer_id = ? AND status = 'completed'`,
      [engineerId]
    ).catch(() => [[{ count: 0 }]]);

    // Active Projects assigned to Engineer
    const [[activeProjectsRow]] = await db.query(
      `SELECT COUNT(*) as count FROM projects WHERE assigned_to = ? AND stage NOT IN ('Handover Done', 'Warranty Period') AND is_deleted = 0`,
      [engineerId]
    ).catch(() => [[{ count: 0 }]]);

    // Today's Scheduled Surveys List
    const [todaySchedule] = await db.query(
      `SELECT s.*, l.lead_code, l.customer_name, l.mobile_number, l.address, l.city, l.state, l.required_kw
       FROM site_surveys s
       LEFT JOIN leads l ON s.lead_id = l.id
       WHERE s.assigned_engineer_id = ? AND s.scheduled_date = CURDATE()
       ORDER BY s.scheduled_time ASC`,
      [engineerId]
    ).catch(() => [[]]);

    // Recent Completed Surveys
    const [recentSurveys] = await db.query(
      `SELECT s.*, l.lead_code, l.customer_name, l.mobile_number, l.address, l.city
       FROM site_surveys s
       LEFT JOIN leads l ON s.lead_id = l.id
       WHERE s.assigned_engineer_id = ?
       ORDER BY s.updated_at DESC
       LIMIT 5`,
      [engineerId]
    ).catch(() => [[]]);

    return res.status(200).json({
      success: true,
      message: "Engineer dashboard data fetched successfully.",
      data: {
        todaySurveys: todaySurveysRow?.count || 0,
        pendingSurveys: pendingSurveysRow?.count || 0,
        completedSurveys: completedSurveysRow?.count || 0,
        activeProjects: activeProjectsRow?.count || 0,
        todaySchedule: todaySchedule || [],
        recentSurveys: recentSurveys || [],
      },
    });
  } catch (error) {
    console.error("Error in Engineer Dashboard Controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });
  }
};

module.exports = {
  getManagerDashboardStats: getManagerDashboardStatsController,
  getSalesDashboardStats: getSalesDashboardStatsController,
  getAdminDashboardStats: getAdminDashboardStatsController,
  getEngineerDashboardStats: getEngineerDashboardStatsController,
};