import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/lead_provider.dart';
import 'widgets/admin_metric_card.dart';
import 'widgets/admin_monthly_trend_chart.dart';
import 'widgets/admin_pipeline_card.dart';
import 'widgets/admin_leaderboard_card.dart';
import 'widgets/admin_recent_leads_card.dart';
import 'widgets/admin_activity_feed_card.dart';
import '../calculator/solar_calculator_view.dart';
import '../finance/finance_view.dart';
import '../stock/stock_list_view.dart';

class AdminDashboardView extends StatefulWidget {
  final Function(int)? onNavigateTab;

  const AdminDashboardView({super.key, this.onNavigateTab});

  @override
  State<AdminDashboardView> createState() => _AdminDashboardViewState();
}

class _AdminDashboardViewState extends State<AdminDashboardView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDashboard();
    });
  }

  void _loadDashboard({bool isRefresh = false}) {
    final dashboardProvider = Provider.of<DashboardProvider>(context, listen: false);
    dashboardProvider.fetchAdminDashboard(isRefresh: isRefresh);
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final dashboard = Provider.of<DashboardProvider>(context);

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;

    final todayFormatted = DateFormat("EEEE • d MMMM yyyy").format(DateTime.now());

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        color: AppColors.brandPrimary,
        onRefresh: () async {
          _loadDashboard(isRefresh: true);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Header
              InkWell(
                onTap: () => widget.onNavigateTab?.call(5),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: borderColor, width: 1),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            todayFormatted,
                            style: AppTypography.caption(color: textSecondary),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.brandPrimary.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: AppColors.brandPrimary.withValues(alpha: 0.25)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(4),
                                  child: Image.asset(
                                    'assets/images/logo.png',
                                    width: 14,
                                    height: 14,
                                    fit: BoxFit.contain,
                                    errorBuilder: (context, error, stackTrace) => const Icon(
                                      Icons.solar_power_rounded,
                                      size: 14,
                                      color: AppColors.brandPrimary,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  auth.tenant?.businessName ?? auth.workspace?.toUpperCase() ?? "SOLAR CRM",
                                  style: AppTypography.badge(color: AppColors.brandPrimary),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "${_getGreeting()}, ${auth.user?.name ?? 'Admin'} 👋",
                                  style: AppTypography.heading(size: 20, color: textPrimary),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  "Executive overview of operations, installations, and revenue pipeline.",
                                  style: AppTypography.body(color: textSecondary),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                              shape: BoxShape.circle,
                              border: Border.all(color: borderColor),
                            ),
                            child: const Icon(Icons.settings_outlined, size: 20, color: AppColors.brandPrimary),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Loading State
              if (dashboard.isLoading && dashboard.adminStats == null)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 48.0),
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const CircularProgressIndicator(color: AppColors.brandPrimary),
                        const SizedBox(height: 16),
                        Text(
                          "Loading dashboard insights...",
                          style: AppTypography.body(color: textSecondary),
                        ),
                      ],
                    ),
                  ),
                )
              // Error State
              else if (dashboard.errorMessage != null && dashboard.adminStats == null)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.errorRed.withValues(alpha: 0.3)),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.error_outline_rounded, color: AppColors.errorRed, size: 36),
                      const SizedBox(height: 12),
                      Text(
                        dashboard.errorMessage!,
                        textAlign: TextAlign.center,
                        style: AppTypography.body(color: textPrimary),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: () => _loadDashboard(isRefresh: true),
                        icon: const Icon(Icons.refresh_rounded, size: 18),
                        label: const Text("Retry Connection"),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.brandPrimary,
                          foregroundColor: Colors.black,
                        ),
                      ),
                    ],
                  ),
                )
              // Data State
              else if (dashboard.adminStats != null) ...[
                // Solar ROI & Subsidy Calculator Banner
                _buildSolarCalculatorCard(isDark, cardBg, borderColor, textPrimary, textSecondary),

                const SizedBox(height: 10),

                // Quotations & Invoices Quick Tool Banner
                _buildFinanceCard(isDark, cardBg, borderColor, textPrimary, textSecondary),

                const SizedBox(height: 10),

                // Stock & Inventory Management Banner
                _buildStockCard(isDark, cardBg, borderColor, textPrimary, textSecondary),

                const SizedBox(height: 16),

                // KPI Metric Grid (2 columns)
                _buildKpiGrid(dashboard.adminStats!),

                const SizedBox(height: 16),

                // 6-Month Trend Chart
                AdminMonthlyTrendChart(trendData: dashboard.adminStats!.monthlyTrend),

                const SizedBox(height: 16),

                // Pipeline Status Breakdown
                AdminPipelineCard(statusBreakdown: dashboard.adminStats!.statusBreakdown),

                const SizedBox(height: 16),

                // Sales Team Leaderboard
                AdminLeaderboardCard(leaderboard: dashboard.adminStats!.teamLeaderboard),

                const SizedBox(height: 16),

                // Recent Leads
                AdminRecentLeadsCard(
                  recentLeads: dashboard.adminStats!.recentLeads,
                  onViewAll: () {
                    if (widget.onNavigateTab != null) {
                      widget.onNavigateTab!(1); // Go to Leads tab
                    }
                  },
                ),

                const SizedBox(height: 16),

                // Activity Feed
                AdminActivityFeedCard(activityFeed: dashboard.adminStats!.activityFeed),

                const SizedBox(height: 32),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildKpiGrid(dynamic stats) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () {
                  if (widget.onNavigateTab != null) {
                    widget.onNavigateTab!(1);
                  }
                },
                child: AdminMetricCard(
                  title: "Total Leads",
                  value: "${stats.totalLeads}",
                  subtitle: "${stats.activeLeads} active pipeline",
                  icon: Icons.hub_rounded,
                  accentColor: AppColors.brandPrimary,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: AdminMetricCard(
                title: "Won Deals",
                value: "${stats.wonLeads}",
                subtitle: stats.totalLeads > 0
                    ? "${((stats.wonLeads / stats.totalLeads) * 100).toStringAsFixed(1)}% win rate"
                    : "0% win rate",
                icon: Icons.check_circle_rounded,
                accentColor: AppColors.successGreen,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: AdminMetricCard(
                title: "Installed Capacity",
                value: Formatters.formatKw(stats.totalInstalledKw),
                subtitle: "Closed capacity",
                icon: Icons.solar_power_rounded,
                accentColor: AppColors.skyBlue,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: AdminMetricCard(
                title: "Total Revenue",
                value: Formatters.formatCurrency(stats.totalRevenue, compact: true),
                subtitle: "Won quotation value",
                icon: Icons.currency_rupee_rounded,
                accentColor: AppColors.emerald,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(  
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () {
                  if (widget.onNavigateTab != null) {
                    Provider.of<LeadProvider>(context, listen: false).toggleTodayFollowups(true);
                    widget.onNavigateTab!(1);
                  }
                },
                child: AdminMetricCard(
                  title: "Today's Follow-ups",
                  value: "${stats.todaysFollowups}",
                  subtitle: "Requires action today",
                  icon: Icons.event_available_rounded,
                  accentColor: AppColors.amberDark,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: AdminMetricCard(
                title: "Top Performer",
                value: stats.topPerformer,
                subtitle: "${stats.topPerformerCount} deals converted",
                icon: Icons.star_rounded,
                accentColor: AppColors.purple,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSolarCalculatorCard(
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const SolarCalculatorView()),
        );
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.brandPrimary.withValues(alpha: 0.35)),
          boxShadow: [
            BoxShadow(
              color: AppColors.brandPrimary.withValues(alpha: isDark ? 0.06 : 0.03),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.brandPrimary.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.calculate_rounded,
                color: AppColors.brandPrimary,
                size: 26,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          "Solar ROI & Subsidy Calculator",
                          style: AppTypography.headingSmall(color: textPrimary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                        decoration: BoxDecoration(
                          color: AppColors.emeraldGreen.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          "PM SURYA GHAR",
                          style: AppTypography.badge(color: AppColors.emeraldGreen),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    "System sizing, ₹78k subsidy, 25-yr ROI & WhatsApp proposal",
                    style: AppTypography.caption(color: textSecondary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(
              Icons.arrow_forward_ios_rounded,
              size: 16,
              color: AppColors.brandPrimary,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFinanceCard(
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const FinanceView()),
        );
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.skyBlue.withValues(alpha: 0.35)),
          boxShadow: [
            BoxShadow(
              color: AppColors.skyBlue.withValues(alpha: isDark ? 0.06 : 0.03),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.skyBlue.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.receipt_long_rounded,
                color: AppColors.skyBlue,
                size: 26,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          "Quotations & Invoices",
                          style: AppTypography.headingSmall(color: textPrimary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                        decoration: BoxDecoration(
                          color: AppColors.skyBlue.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          "BILLING",
                          style: AppTypography.badge(color: AppColors.skyBlue),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    "Commercial proposals, GST invoices, PDF download & payments",
                    style: AppTypography.caption(color: textSecondary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(
              Icons.arrow_forward_ios_rounded,
              size: 16,
              color: AppColors.skyBlue,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStockCard(
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const StockListView()),
        );
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.emeraldGreen.withValues(alpha: 0.35)),
          boxShadow: [
            BoxShadow(
              color: AppColors.emeraldGreen.withValues(alpha: isDark ? 0.06 : 0.03),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.emeraldGreen.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.inventory_2_rounded,
                color: AppColors.emeraldGreen,
                size: 26,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          "Stock & Inventory",
                          style: AppTypography.headingSmall(color: textPrimary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                        decoration: BoxDecoration(
                          color: AppColors.emeraldGreen.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          "WAREHOUSE",
                          style: AppTypography.badge(color: AppColors.emeraldGreen),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    "Track solar panels, inverters, cables, stock IN/OUT & valuation",
                    style: AppTypography.caption(color: textSecondary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(
              Icons.arrow_forward_ios_rounded,
              size: 16,
              color: AppColors.emeraldGreen,
            ),
          ],
        ),
      ),
    );
  }
}
