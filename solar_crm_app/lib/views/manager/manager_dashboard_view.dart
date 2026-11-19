import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../models/manager_dashboard_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../calculator/solar_calculator_view.dart';
import '../finance/finance_view.dart';
import '../stock/stock_list_view.dart';
import '../financing/financing_hub_view.dart';

class ManagerDashboardView extends StatefulWidget {
  final Function(int)? onNavigateTab;

  const ManagerDashboardView({super.key, this.onNavigateTab});

  @override
  State<ManagerDashboardView> createState() => _ManagerDashboardViewState();
}

class _ManagerDashboardViewState extends State<ManagerDashboardView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDashboard();
    });
  }

  void _loadDashboard({bool isRefresh = false}) {
    final dashboardProvider = Provider.of<DashboardProvider>(context, listen: false);
    dashboardProvider.fetchManagerDashboard(isRefresh: isRefresh);
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  Future<void> _makeCall(String phoneNumber) async {
    final cleanPhone = phoneNumber.replaceAll(RegExp(r'[^\d+]'), '');
    final uri = Uri.parse('tel:$cleanPhone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
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
    final stats = dashboard.managerStats;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        color: AppColors.skyBlue,
        onRefresh: () async {
          _loadDashboard(isRefresh: true);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Manager Header
              Container(
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
                            color: AppColors.skyBlue.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: AppColors.skyBlue.withValues(alpha: 0.25)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.groups_rounded, size: 13, color: AppColors.skyBlue),
                              const SizedBox(width: 4),
                              Text(
                                "TEAM MANAGER",
                                style: AppTypography.badge(color: AppColors.skyBlue),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      "${_getGreeting()}, ${auth.user?.name ?? 'Manager'}",
                      style: AppTypography.headingMedium(color: textPrimary),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "Supervising sales reps, site operations and team revenue pipelines.",
                      style: AppTypography.bodySmall(color: textSecondary),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // 2. Loading / Error / Content
              if (dashboard.isLoading && stats == null)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40.0),
                  child: Center(
                    child: CircularProgressIndicator(color: AppColors.skyBlue),
                  ),
                )
              else if (dashboard.errorMessage != null && stats == null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.errorRed.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.errorRed.withValues(alpha: 0.3)),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.error_outline_rounded, color: AppColors.errorRed, size: 28),
                      const SizedBox(height: 8),
                      Text(
                        dashboard.errorMessage!,
                        style: AppTypography.bodySmall(color: AppColors.errorRed),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: () => _loadDashboard(isRefresh: true),
                        icon: const Icon(Icons.refresh_rounded, size: 16),
                        label: const Text("Retry"),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.errorRed,
                          side: const BorderSide(color: AppColors.errorRed),
                        ),
                      ),
                    ],
                  ),
                )
              else ...[
                // 3. Four Core Metric Cards
                Row(
                  children: [
                    Expanded(
                      child: _buildMetricCard(
                        title: "Team Leads",
                        value: stats?.totalTeamLeads.toString() ?? "0",
                        subtitle: "Under management",
                        icon: Icons.assignment_outlined,
                        color: AppColors.skyBlue,
                        cardBg: cardBg,
                        borderColor: borderColor,
                        textPrimary: textPrimary,
                        textSecondary: textSecondary,
                        onTap: () => widget.onNavigateTab?.call(1),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildMetricCard(
                        title: "Pending Today",
                        value: stats?.pendingToday.toString() ?? "0",
                        subtitle: "Awaiting action",
                        icon: Icons.hourglass_top_rounded,
                        color: AppColors.solarGold,
                        cardBg: cardBg,
                        borderColor: borderColor,
                        textPrimary: textPrimary,
                        textSecondary: textSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildMetricCard(
                        title: "Converted Today",
                        value: stats?.convertedToday.toString() ?? "0",
                        subtitle: "Won closed deals",
                        icon: Icons.verified_outlined,
                        color: AppColors.emeraldGreen,
                        cardBg: cardBg,
                        borderColor: borderColor,
                        textPrimary: textPrimary,
                        textSecondary: textSecondary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildMetricCard(
                        title: "Overdue",
                        value: stats?.overdueFollowups.toString() ?? "0",
                        subtitle: (stats?.overdueFollowups ?? 0) > 0 ? "Requires coaching" : "All clean",
                        icon: Icons.warning_amber_rounded,
                        color: (stats?.overdueFollowups ?? 0) > 0 ? AppColors.errorRed : AppColors.textMutedDark,
                        cardBg: cardBg,
                        borderColor: borderColor,
                        textPrimary: textPrimary,
                        textSecondary: textSecondary,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // 4. Team Revenue & Win Rate Banner
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: isDark
                          ? [const Color(0xFF0F172A), const Color(0xFF1E293B)]
                          : [const Color(0xFFF0FDF4), const Color(0xFFE0F2FE)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isDark ? const Color(0xFF334155) : const Color(0xFFBAE6FD),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.emeraldGreen.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.currency_rupee_rounded, color: AppColors.emeraldGreen, size: 24),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "TEAM REVENUE GENERATED",
                              style: AppTypography.badge(
                                color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF0369A1),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              Formatters.formatCurrency(stats?.teamRevenue ?? 0.0),
                              style: AppTypography.headingLarge(color: textPrimary),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.emeraldGreen.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              "${stats?.totalConverted ?? 0} WON",
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: AppColors.emeraldGreen,
                              ),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "${stats?.teamPerformance.length ?? 0} Reps Active",
                            style: AppTypography.caption(color: textSecondary),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // 5. Quick Tools Hub
                Text(
                  "MANAGEMENT WORKSPACES",
                  style: AppTypography.caption(color: textSecondary),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: _buildQuickHubButton(
                        icon: Icons.calculate_outlined,
                        label: "Calculator",
                        color: AppColors.solarGold,
                        cardBg: cardBg,
                        borderColor: borderColor,
                        textPrimary: textPrimary,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const SolarCalculatorView()),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildQuickHubButton(
                        icon: Icons.receipt_long_outlined,
                        label: "Finance",
                        color: AppColors.emeraldGreen,
                        cardBg: cardBg,
                        borderColor: borderColor,
                        textPrimary: textPrimary,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const FinanceView()),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildQuickHubButton(
                        icon: Icons.inventory_2_outlined,
                        label: "Stock",
                        color: AppColors.skyBlue,
                        cardBg: cardBg,
                        borderColor: borderColor,
                        textPrimary: textPrimary,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const StockListView()),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildQuickHubButton(
                        icon: Icons.account_balance_outlined,
                        label: "Subsidies",
                        color: const Color(0xFF8B5CF6),
                        cardBg: cardBg,
                        borderColor: borderColor,
                        textPrimary: textPrimary,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const FinancingHubView()),
                          );
                        },
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // 6. Sales Representatives Performance Leaderboard
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "TEAM PERFORMANCE",
                      style: AppTypography.caption(color: textSecondary),
                    ),
                    TextButton(
                      onPressed: () => widget.onNavigateTab?.call(4),
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text(
                        "View All Team",
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppColors.skyBlue,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                if (stats?.teamPerformance.isEmpty ?? true)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: borderColor),
                    ),
                    child: Center(
                      child: Text(
                        "No sales reps reporting to you yet.",
                        style: AppTypography.bodySmall(color: textSecondary),
                      ),
                    ),
                  )
                else
                  ...stats!.teamPerformance.map((rep) => _buildRepPerformanceCard(
                        rep: rep,
                        cardBg: cardBg,
                        borderColor: borderColor,
                        textPrimary: textPrimary,
                        textSecondary: textSecondary,
                        isDark: isDark,
                      )),

                const SizedBox(height: 20),

                // 7. Status Breakdown
                Text(
                  "LEAD PIPELINE BREAKDOWN",
                  style: AppTypography.caption(color: textSecondary),
                ),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: borderColor),
                  ),
                  child: Column(
                    children: [
                      if (stats?.statusBreakdown.isEmpty ?? true)
                        Center(
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Text(
                              "No pipeline leads recorded.",
                              style: AppTypography.bodySmall(color: textSecondary),
                            ),
                          ),
                        )
                      else
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: stats!.statusBreakdown.map((item) {
                            final color = _getStatusColor(item.status);
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: color.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: color.withValues(alpha: 0.3)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 7,
                                    height: 7,
                                    decoration: BoxDecoration(
                                      color: color,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    item.status,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: textPrimary,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                    decoration: BoxDecoration(
                                      color: color.withValues(alpha: 0.2),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      "${item.count}",
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w900,
                                        color: color,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // 8. Today's Urgent Follow-ups
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "TODAY'S TEAM FOLLOW-UPS",
                      style: AppTypography.caption(color: textSecondary),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: (stats?.todaysFollowupsList.length ?? 0) > 0
                            ? AppColors.solarGold.withValues(alpha: 0.15)
                            : AppColors.textMutedDark.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        "${stats?.todaysFollowupsList.length ?? 0} SCHEDULED",
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: (stats?.todaysFollowupsList.length ?? 0) > 0
                              ? AppColors.solarGold
                              : textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                if (stats?.todaysFollowupsList.isEmpty ?? true)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: borderColor),
                    ),
                    child: Center(
                      child: Text(
                        "No pending follow-ups scheduled for today.",
                        style: AppTypography.bodySmall(color: textSecondary),
                      ),
                    ),
                  )
                else
                  ...stats!.todaysFollowupsList.map((f) => Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: cardBg,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: f.isOverdue ? AppColors.errorRed.withValues(alpha: 0.4) : borderColor,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: f.isOverdue
                                    ? AppColors.errorRed.withValues(alpha: 0.15)
                                    : AppColors.skyBlue.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(
                                f.isOverdue ? Icons.timer_off_rounded : Icons.schedule_rounded,
                                size: 18,
                                color: f.isOverdue ? AppColors.errorRed : AppColors.skyBlue,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        f.customerName,
                                        style: AppTypography.bodyMedium(color: textPrimary)
                                            .copyWith(fontWeight: FontWeight.w700),
                                      ),
                                      if (f.isOverdue) ...[
                                        const SizedBox(width: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                          decoration: BoxDecoration(
                                            color: AppColors.errorRed.withValues(alpha: 0.15),
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: const Text(
                                            "OVERDUE",
                                            style: TextStyle(
                                              fontSize: 8,
                                              fontWeight: FontWeight.w900,
                                              color: AppColors.errorRed,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    "Rep: ${f.repName ?? 'Unassigned'} • ${f.time ?? 'Today'}",
                                    style: AppTypography.caption(color: textSecondary),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              onPressed: () => _makeCall(f.phone),
                              icon: const Icon(Icons.phone_rounded, color: AppColors.emeraldGreen, size: 20),
                              tooltip: "Call Customer",
                            ),
                          ],
                        ),
                      )),

                const SizedBox(height: 30),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color color,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  title.toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: textSecondary,
                    letterSpacing: 0.5,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 16),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              value,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: textPrimary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 10,
                color: textSecondary,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickHubButton({
    required IconData icon,
    required String label,
    required Color color,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: textPrimary,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRepPerformanceCard({
    required ManagerTeamMemberPerformance rep,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
    required bool isDark,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.skyBlue.withValues(alpha: 0.15),
                child: Text(
                  rep.fullName.isNotEmpty ? rep.fullName[0].toUpperCase() : 'R',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: AppColors.skyBlue,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      rep.fullName,
                      style: AppTypography.bodyMedium(color: textPrimary)
                          .copyWith(fontWeight: FontWeight.w800),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      rep.email,
                      style: AppTypography.caption(color: textSecondary),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              if (rep.phone != null && rep.phone!.isNotEmpty) ...[
                IconButton(
                  onPressed: () => _makeCall(rep.phone!),
                  icon: const Icon(Icons.call_rounded, size: 18, color: AppColors.emeraldGreen),
                  tooltip: "Call Rep",
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
                const SizedBox(width: 8),
              ],
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: rep.winRate >= 50
                      ? AppColors.emeraldGreen.withValues(alpha: 0.15)
                      : (rep.winRate > 20
                          ? AppColors.solarGold.withValues(alpha: 0.15)
                          : AppColors.skyBlue.withValues(alpha: 0.15)),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  "${rep.winRate.toStringAsFixed(1)}% Win",
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: rep.winRate >= 50
                        ? AppColors.emeraldGreen
                        : (rep.winRate > 20 ? AppColors.solarGold : AppColors.skyBlue),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildRepStatCol("Assigned", "${rep.totalAssigned}", textPrimary, textSecondary),
              _buildRepStatCol("In Progress", "${rep.inProgress}", AppColors.solarGold, textSecondary),
              _buildRepStatCol("Won", "${rep.converted}", AppColors.emeraldGreen, textSecondary),
              _buildRepStatCol("Lost", "${rep.lost}", AppColors.errorRed, textSecondary),
              _buildRepStatCol("Revenue", Formatters.formatCurrency(rep.revenue), textPrimary, textSecondary),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRepStatCol(String label, String value, Color valueColor, Color textSecondary) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w900,
            color: valueColor,
          ),
        ),
        const SizedBox(height: 1),
        Text(
          label,
          style: TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w600,
            color: textSecondary,
          ),
        ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'won':
      case 'completed':
        return AppColors.emeraldGreen;
      case 'in progress':
      case 'contacted':
        return AppColors.skyBlue;
      case 'pending':
      case 'new':
        return AppColors.solarGold;
      case 'lost':
      case 'cancelled':
        return AppColors.errorRed;
      default:
        return AppColors.textMutedDark;
    }
  }
}

