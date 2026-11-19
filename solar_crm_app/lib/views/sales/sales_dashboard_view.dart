import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/lead_provider.dart';
import '../admin/leads/add_lead_sheet.dart';
import '../calculator/solar_calculator_view.dart';
import '../finance/finance_view.dart';

class SalesDashboardView extends StatefulWidget {
  final Function(int)? onNavigateTab;

  const SalesDashboardView({super.key, this.onNavigateTab});

  @override
  State<SalesDashboardView> createState() => _SalesDashboardViewState();
}

class _SalesDashboardViewState extends State<SalesDashboardView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDashboard();
    });
  }

  void _loadDashboard({bool isRefresh = false}) {
    final dashboardProvider = Provider.of<DashboardProvider>(context, listen: false);
    dashboardProvider.fetchSalesDashboard(isRefresh: isRefresh);
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

  Future<void> _openWhatsApp(String phoneNumber) async {
    final cleanPhone = phoneNumber.replaceAll(RegExp(r'[^\d]'), '');
    final formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : '91$cleanPhone';
    final uri = Uri.parse('https://wa.me/$formattedPhone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _openAddLeadSheet() async {
    final res = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const AddLeadSheet(),
    );
    if (res == true && mounted) {
      _loadDashboard(isRefresh: true);
      Provider.of<LeadProvider>(context, listen: false).fetchLeads(isRefresh: true);
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
    final stats = dashboard.salesStats;

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
              // 1. Sales Header Card
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
                            color: AppColors.brandPrimary.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: AppColors.brandPrimary.withValues(alpha: 0.25)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.bolt_rounded, size: 13, color: AppColors.brandPrimary),
                              const SizedBox(width: 4),
                              Text(
                                "SALES EXECUTIVE",
                                style: AppTypography.badge(color: AppColors.brandPrimary),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      "${_getGreeting()}, ${auth.user?.name ?? 'Executive'}",
                      style: AppTypography.headingMedium(color: textPrimary),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "Your direct pipeline: assigned solar leads, follow-ups, and surveys.",
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
                    child: CircularProgressIndicator(color: AppColors.brandPrimary),
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
                        title: "My Leads",
                        value: stats?.totalAssigned.toString() ?? "0",
                        subtitle: "Active pipeline",
                        icon: Icons.assignment_ind_outlined,
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
                        title: "Today's Calls",
                        value: stats?.todayFollowups.toString() ?? "0",
                        subtitle: "Calling queue",
                        icon: Icons.phone_callback_rounded,
                        color: AppColors.brandPrimary,
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
                        title: "Converted Won",
                        value: stats?.converted.toString() ?? "0",
                        subtitle: "Closed contracts",
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
                        title: "Pending / Overdue",
                        value: stats?.pendingFollowups.toString() ?? "0",
                        subtitle: (stats?.pendingFollowups ?? 0) > 0 ? "Requires call today" : "All up to date",
                        icon: Icons.timer_off_rounded,
                        color: (stats?.pendingFollowups ?? 0) > 0 ? AppColors.errorRed : AppColors.textMutedDark,
                        cardBg: cardBg,
                        borderColor: borderColor,
                        textPrimary: textPrimary,
                        textSecondary: textSecondary,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // 4. Sales Conversion & Field Activity Banner
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: isDark
                          ? [const Color(0xFF18181B), const Color(0xFF27272A)]
                          : [const Color(0xFFFFFBEB), const Color(0xFFFEF3C7)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFFDE68A),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.brandPrimary.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.trending_up_rounded, color: AppColors.brandPrimary, size: 24),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "CONVERSION WIN RATE",
                              style: AppTypography.badge(
                                color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFFB45309),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              "${(stats?.winRate ?? 0.0).toStringAsFixed(1)}%",
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
                              color: AppColors.skyBlue.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              "${stats?.upcomingSiteVisits ?? 0} SURVEYS",
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: AppColors.skyBlue,
                              ),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "${stats?.newLeads ?? 0} Fresh Leads",
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
                  "SALES WORKSPACE TOOLS",
                  style: AppTypography.caption(color: textSecondary),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: _buildQuickToolButton(
                        icon: Icons.person_add_alt_1_rounded,
                        label: "New Lead",
                        color: AppColors.brandPrimary,
                        cardBg: cardBg,
                        borderColor: borderColor,
                        textPrimary: textPrimary,
                        onTap: _openAddLeadSheet,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildQuickToolButton(
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
                      child: _buildQuickToolButton(
                        icon: Icons.receipt_long_outlined,
                        label: "Quotes",
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
                      child: _buildQuickToolButton(
                        icon: Icons.people_outline_rounded,
                        label: "Clients",
                        color: AppColors.purple,
                        cardBg: cardBg,
                        borderColor: borderColor,
                        textPrimary: textPrimary,
                        onTap: () => widget.onNavigateTab?.call(3),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // 6. Today's Calling Queue & Urgent Follow-ups
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "TODAY'S CALLING QUEUE",
                      style: AppTypography.caption(color: textSecondary),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: (stats?.followupsList.length ?? 0) > 0
                            ? AppColors.brandPrimary.withValues(alpha: 0.15)
                            : AppColors.textMutedDark.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        "${stats?.followupsList.length ?? 0} DUE",
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: (stats?.followupsList.length ?? 0) > 0
                              ? AppColors.brandPrimary
                              : textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                if (stats?.followupsList.isEmpty ?? true)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: borderColor),
                    ),
                    child: Center(
                      child: Column(
                        children: [
                          Icon(Icons.check_circle_outline_rounded, size: 36, color: AppColors.emeraldGreen),
                          const SizedBox(height: 8),
                          Text(
                            "Great job! No pending follow-up calls due today.",
                            style: AppTypography.bodySmall(color: textSecondary),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  )
                else
                  ...stats!.followupsList.map((f) => Container(
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
                                    : AppColors.brandPrimary.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(
                                f.isOverdue ? Icons.timer_off_rounded : Icons.phone_in_talk_rounded,
                                size: 18,
                                color: f.isOverdue ? AppColors.errorRed : AppColors.brandPrimary,
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
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
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
                                    "${f.leadCode} • ${f.phone.isNotEmpty ? f.phone : 'No phone'}",
                                    style: AppTypography.caption(color: textSecondary),
                                  ),
                                ],
                              ),
                            ),
                            if (f.phone.isNotEmpty) ...[
                              IconButton(
                                onPressed: () => _openWhatsApp(f.phone),
                                icon: const Icon(Icons.chat_bubble_outline_rounded, color: AppColors.emeraldGreen, size: 20),
                                tooltip: "WhatsApp",
                              ),
                              IconButton(
                                onPressed: () => _makeCall(f.phone),
                                icon: const Icon(Icons.phone_rounded, color: AppColors.skyBlue, size: 20),
                                tooltip: "Call",
                              ),
                            ],
                          ],
                        ),
                      )),

                const SizedBox(height: 20),

                // 7. My Pipeline Status Breakdown
                Text(
                  "MY PIPELINE BREAKDOWN",
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
                              "No pipeline leads assigned yet.",
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

  Widget _buildQuickToolButton({
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

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'won':
      case 'closed won':
        return AppColors.emeraldGreen;
      case 'in progress':
      case 'contacted':
      case 'site survey scheduled':
      case 'site survey done':
        return AppColors.skyBlue;
      case 'pending':
      case 'new lead':
      case 'new':
        return AppColors.brandPrimary;
      case 'lost':
      case 'invalid':
      case 'not interested':
        return AppColors.errorRed;
      default:
        return AppColors.textMutedDark;
    }
  }
}
