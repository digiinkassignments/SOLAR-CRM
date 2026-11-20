import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../admin/customers/customers_list_view.dart';

class FinanceDashboardView extends StatefulWidget {
  final Function(int)? onNavigateTab;

  const FinanceDashboardView({super.key, this.onNavigateTab});

  @override
  State<FinanceDashboardView> createState() => _FinanceDashboardViewState();
}

class _FinanceDashboardViewState extends State<FinanceDashboardView> {
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

  void _navigateToTab(int index) {
    if (widget.onNavigateTab != null) {
      widget.onNavigateTab!(index);
    } else if (index == 2) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => Scaffold(
            appBar: AppBar(title: const Text("Customers")),
            body: const CustomersListView(),
          ),
        ),
      );
    }
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
    if (s == 'paid' || s == 'completed' || s == 'active') {
      return AppColors.emeraldGreen;
    }
    if (s == 'partial' || s == 'in_progress') {
      return AppColors.solarGold;
    }
    if (s == 'unpaid' || s == 'overdue' || s == 'rejected') {
      return AppColors.errorRed;
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
        color: AppColors.brandGold,
        backgroundColor: cardBg,
        child: dashboard.isLoading && stats == null
            ? const Center(
                child: CircularProgressIndicator(color: AppColors.brandGold),
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
                            "Unable to load finance data",
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
                              backgroundColor: AppColors.brandGold,
                              foregroundColor: Colors.black,
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
                                color: AppColors.brandGold.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                Icons.account_balance_wallet_rounded,
                                color: AppColors.brandGold,
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
                                        : "${auth.workspace?.toUpperCase()} FINANCE",
                                    style: AppTypography.headingSmall(color: textPrimary),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    "Financial accounts, billing & inventory",
                                    style: AppTypography.caption(color: textSecondary),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Financial KPI Grid
                      Text(
                        "FINANCIAL METRICS",
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
                            title: "Net Invoiced",
                            value: _formatCurrency(stats?.invoiced ?? 0),
                            subtitle: "Total billed value",
                            icon: Icons.receipt_long_rounded,
                            iconColor: AppColors.infoBlue,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                            onTap: () => _navigateToTab(1),
                          ),
                          _buildMetricCard(
                            title: "Payments Received",
                            value: _formatCurrency(stats?.paid ?? 0),
                            subtitle: "Recorded collections",
                            icon: Icons.payments_rounded,
                            iconColor: AppColors.emeraldGreen,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                            onTap: () => _navigateToTab(1),
                          ),
                          _buildMetricCard(
                            title: "Outstanding Balance",
                            value: _formatCurrency(stats?.due ?? 0),
                            subtitle: "Pending receivables",
                            icon: Icons.warning_amber_rounded,
                            iconColor: AppColors.errorRed,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                            onTap: () => _navigateToTab(1),
                          ),
                          _buildMetricCard(
                            title: "Stock Valuation",
                            value: _formatCurrency(stats?.stockValue ?? 0),
                            subtitle: "${stats?.lowStock ?? 0} items low stock",
                            icon: Icons.inventory_2_rounded,
                            iconColor: AppColors.solarGold,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                            onTap: () => _navigateToTab(3),
                          ),
                          _buildMetricCard(
                            title: "Quotations",
                            value: _formatNumber(stats?.quotations ?? 0),
                            subtitle: "Proposals issued",
                            icon: Icons.description_rounded,
                            iconColor: Colors.deepPurpleAccent,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                            onTap: () => _navigateToTab(1),
                          ),
                          _buildMetricCard(
                            title: "Customers",
                            value: _formatNumber(stats?.customers ?? 0),
                            subtitle: "Customer accounts",
                            icon: Icons.people_alt_rounded,
                            iconColor: Colors.tealAccent,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                            onTap: () => _navigateToTab(2),
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
                              title: "Invoices",
                              icon: Icons.receipt_long_rounded,
                              color: AppColors.emeraldGreen,
                              onTap: () => _navigateToTab(1),
                              cardBg: cardBg,
                              borderColor: borderColor,
                              textPrimary: textPrimary,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _buildQuickActionButton(
                              title: "Customers",
                              icon: Icons.people_alt_rounded,
                              color: Colors.tealAccent,
                              onTap: () => _navigateToTab(2),
                              cardBg: cardBg,
                              borderColor: borderColor,
                              textPrimary: textPrimary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: _buildQuickActionButton(
                              title: "Stock",
                              icon: Icons.inventory_2_rounded,
                              color: AppColors.solarGold,
                              onTap: () => _navigateToTab(3),
                              cardBg: cardBg,
                              borderColor: borderColor,
                              textPrimary: textPrimary,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _buildQuickActionButton(
                              title: "Calculator",
                              icon: Icons.calculate_rounded,
                              color: AppColors.infoBlue,
                              onTap: () => _navigateToTab(4),
                              cardBg: cardBg,
                              borderColor: borderColor,
                              textPrimary: textPrimary,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),

                      // Outstanding Invoices (Attention Items)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            "OUTSTANDING INVOICES",
                            style: AppTypography.caption(color: textSecondary),
                          ),
                          if (stats != null && stats.attention.isNotEmpty)
                            TextButton(
                              onPressed: () => _navigateToTab(1),
                              style: TextButton.styleFrom(
                                padding: EdgeInsets.zero,
                                visualDensity: VisualDensity.compact,
                              ),
                              child: const Text("View All", style: TextStyle(color: AppColors.brandGold, fontSize: 12)),
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
                              "No outstanding invoices pending collection.",
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
                                      Icons.receipt_rounded,
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
                                          item.reference.isNotEmpty ? item.reference : "Due Invoice",
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
                                        style: AppTypography.bodyMedium(color: AppColors.errorRed)
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

                      // Payment Status Breakdown
                      if (stats != null && stats.breakdown.isNotEmpty) ...[
                        Text(
                          "PAYMENT STATUS BREAKDOWN",
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
    VoidCallback? onTap,
  }) {
    final card = Container(
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

    if (onTap != null) {
      return InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: card,
      );
    }
    return card;
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
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 20, color: color),
            ),
            const SizedBox(height: 6),
            Text(
              title,
              style: AppTypography.caption(color: textPrimary).copyWith(fontWeight: FontWeight.w600),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
