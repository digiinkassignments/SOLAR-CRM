import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';

class ApplicationDashboardView extends StatefulWidget {
  final Function(int)? onNavigateTab;

  const ApplicationDashboardView({super.key, this.onNavigateTab});

  @override
  State<ApplicationDashboardView> createState() => _ApplicationDashboardViewState();
}

class _ApplicationDashboardViewState extends State<ApplicationDashboardView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDashboard();
    });
  }

  void _loadDashboard({bool isRefresh = false}) {
    final dashboard = Provider.of<DashboardProvider>(context, listen: false);
    dashboard.fetchPortalDashboard(isRefresh: isRefresh);
  }

  String _formatCurrency(num value) {
    return NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 0,
    ).format(value);
  }

  String _formatNumber(num value) {
    return NumberFormat.decimalPattern('en_IN').format(value);
  }

  String _humanizeStatus(String status) {
    if (status.isEmpty) return 'Pending';
    return status
        .replaceAll('_', ' ')
        .split(' ')
        .map((w) => w.isNotEmpty ? '${w[0].toUpperCase()}${w.substring(1).toLowerCase()}' : '')
        .join(' ');
  }

  Color _getStatusColor(String status) {
    final s = status.toLowerCase();
    if (s.contains('credit') || s.contains('disburs') || s.contains('approved') || s.contains('issued')) {
      return AppColors.emeraldGreen;
    }
    if (s.contains('reject')) {
      return AppColors.errorRed;
    }
    if (s.contains('submit') || s.contains('under') || s.contains('review') || s.contains('upload')) {
      return AppColors.solarGold;
    }
    return AppColors.infoBlue;
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

    final stats = dashboard.portalStats;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        onRefresh: () async => _loadDashboard(isRefresh: true),
        color: AppColors.emeraldGreen,
        backgroundColor: cardBg,
        child: dashboard.isLoading && stats == null
            ? const Center(
                child: CircularProgressIndicator(color: AppColors.emeraldGreen),
              )
            : dashboard.errorMessage != null && stats == null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline, size: 48, color: AppColors.errorRed),
                          const SizedBox(height: 12),
                          Text(
                            "Unable to load application dashboard",
                            style: AppTypography.headingSmall(color: textPrimary),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            dashboard.errorMessage!,
                            textAlign: TextAlign.center,
                            style: AppTypography.bodySmall(color: textSecondary),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: () => _loadDashboard(isRefresh: true),
                            icon: const Icon(Icons.refresh, size: 18),
                            label: const Text("Retry"),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.emeraldGreen,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                : ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    children: [
                      // Header greeting & role banner
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: cardBg,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: borderColor),
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
                                Icons.account_balance_rounded,
                                color: AppColors.emeraldGreen,
                                size: 28,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    auth.tenant?.businessName.isNotEmpty == true
                                        ? auth.tenant!.businessName
                                        : "${auth.workspace?.toUpperCase()} APPLICATIONS",
                                    style: AppTypography.headingSmall(color: textPrimary),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    "PM Surya Ghar Subsidies & Loan Hub",
                                    style: AppTypography.caption(color: textSecondary),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Application KPI Grid
                      Text(
                        "SUBSIDY & FINANCING SUMMARY",
                        style: AppTypography.caption(color: textSecondary),
                      ),
                      const SizedBox(height: 10),

                      GridView.count(
                        crossAxisCount: 2,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                        childAspectRatio: 1.35,
                        children: [
                          _buildMetricCard(
                            title: "Subsidy Applications",
                            value: _formatNumber(stats?.applications ?? 0),
                            subtitle: "Saved portal cases",
                            icon: Icons.account_balance_rounded,
                            iconColor: AppColors.infoBlue,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                          _buildMetricCard(
                            title: "Subsidy Credited",
                            value: _formatNumber(stats?.credited ?? 0),
                            subtitle: "Marked credited",
                            icon: Icons.check_circle_rounded,
                            iconColor: AppColors.emeraldGreen,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                          _buildMetricCard(
                            title: "Recorded Receipts",
                            value: _formatCurrency(stats?.received ?? 0),
                            subtitle: "Subsidy amount received",
                            icon: Icons.payments_rounded,
                            iconColor: AppColors.emeraldGreen,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                          _buildMetricCard(
                            title: "Active Solar Loans",
                            value: _formatNumber(stats?.activeLoans ?? 0),
                            subtitle: "${stats?.loans ?? 0} total applications",
                            icon: Icons.description_rounded,
                            iconColor: Colors.deepPurpleAccent,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                          _buildMetricCard(
                            title: "Loan Disbursements",
                            value: _formatCurrency(stats?.loanDisbursed ?? 0),
                            subtitle: "Disbursed by lenders",
                            icon: Icons.account_balance_wallet_rounded,
                            iconColor: AppColors.brandGold,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                          _buildMetricCard(
                            title: "Subsidy Rejections",
                            value: _formatNumber(stats?.rejected ?? 0),
                            subtitle: "Action & query required",
                            icon: Icons.cancel_rounded,
                            iconColor: AppColors.errorRed,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),

                      // Quick Access
                      Text(
                        "QUICK ACCESS WORKSPACES",
                        style: AppTypography.caption(color: textSecondary),
                      ),
                      const SizedBox(height: 10),

                      Row(
                        children: [
                          Expanded(
                            child: _buildQuickActionButton(
                              title: "PM Surya Ghar Subsidies",
                              icon: Icons.account_balance_rounded,
                              color: AppColors.emeraldGreen,
                              onTap: () => widget.onNavigateTab?.call(1),
                              cardBg: cardBg,
                              borderColor: borderColor,
                              textPrimary: textPrimary,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _buildQuickActionButton(
                              title: "Solar Loan Applications",
                              icon: Icons.credit_score_rounded,
                              color: Colors.deepPurpleAccent,
                              onTap: () => widget.onNavigateTab?.call(2),
                              cardBg: cardBg,
                              borderColor: borderColor,
                              textPrimary: textPrimary,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),

                      // Applications to Follow Up (Attention Items)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            "APPLICATIONS TO FOLLOW UP",
                            style: AppTypography.caption(color: textSecondary),
                          ),
                          if (stats != null && stats.attention.isNotEmpty)
                            TextButton(
                              onPressed: () => widget.onNavigateTab?.call(1),
                              style: TextButton.styleFrom(
                                padding: EdgeInsets.zero,
                                visualDensity: VisualDensity.compact,
                              ),
                              child: const Text("View All", style: TextStyle(color: AppColors.emeraldGreen, fontSize: 12)),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      if (stats == null || stats.attention.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: cardBg,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: borderColor),
                          ),
                          child: Center(
                            child: Text(
                              "No pending saved subsidy applications require follow up.",
                              style: AppTypography.bodySmall(color: textSecondary),
                            ),
                          ),
                        )
                      else
                        Column(
                          children: stats.attention.map((item) {
                            return Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              decoration: BoxDecoration(
                                color: cardBg,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: borderColor),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: _getStatusColor(item.status).withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Icon(
                                      Icons.description_rounded,
                                      size: 20,
                                      color: _getStatusColor(item.status),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          item.customerName,
                                          style: AppTypography.bodyMedium(color: textPrimary),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        Text(
                                          item.reference.isNotEmpty ? item.reference : "Lead Case",
                                          style: AppTypography.caption(color: textSecondary),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        _formatCurrency(item.amount),
                                        style: AppTypography.bodyMedium(color: AppColors.emeraldGreen)
                                            .copyWith(fontWeight: FontWeight.bold),
                                      ),
                                      const SizedBox(height: 2),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: _getStatusColor(item.status).withValues(alpha: 0.15),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          _humanizeStatus(item.status),
                                          style: TextStyle(
                                            color: _getStatusColor(item.status),
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        ),

                      const SizedBox(height: 20),

                      // Subsidy Stages Breakdown
                      if (stats != null && stats.breakdown.isNotEmpty) ...[
                        Text(
                          "PORTAL STAGE BREAKDOWN",
                          style: AppTypography.caption(color: textSecondary),
                        ),
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: cardBg,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: borderColor),
                          ),
                          child: Column(
                            children: stats.breakdown.map((stage) {
                              final total = stats.totalBreakdownCount;
                              final percentage = total > 0 ? (stage.count / total) : 0.0;
                              final color = _getStatusColor(stage.label);

                              return Padding(
                                padding: const EdgeInsets.only(bottom: 12.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          _humanizeStatus(stage.label),
                                          style: AppTypography.bodySmall(color: textPrimary),
                                        ),
                                        Text(
                                          "${stage.count} (${(percentage * 100).toStringAsFixed(0)}%)",
                                          style: AppTypography.caption(color: textSecondary)
                                              .copyWith(fontWeight: FontWeight.bold),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(4),
                                      child: LinearProgressIndicator(
                                        value: percentage,
                                        minHeight: 6,
                                        backgroundColor: isDark ? Colors.grey[800] : Colors.grey[200],
                                        valueColor: AlwaysStoppedAnimation<Color>(color),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ],

                      const SizedBox(height: 30),
                    ],
                  ),
      ),
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: AppTypography.caption(color: textSecondary),
              ),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 16, color: iconColor),
              ),
            ],
          ),
          Text(
            value,
            style: AppTypography.headingSmall(color: textPrimary).copyWith(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            subtitle,
            style: AppTypography.caption(color: textSecondary).copyWith(fontSize: 11),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionButton({
    required String title,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 20, color: color),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                title,
                style: AppTypography.bodySmall(color: textPrimary).copyWith(fontWeight: FontWeight.w600),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textMutedDark),
          ],
        ),
      ),
    );
  }
}
