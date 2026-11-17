import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../models/stock_alert_model.dart';
import '../../providers/stock_provider.dart';
import 'sheets/stock_in_sheet.dart';

class StockAlertsView extends StatefulWidget {
  const StockAlertsView({super.key});

  @override
  State<StockAlertsView> createState() => _StockAlertsViewState();
}

class _StockAlertsViewState extends State<StockAlertsView> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (_tabController.indexIsChanging) {
        _loadAlerts();
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadAlerts();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _loadAlerts() {
    final isResolved = _tabController.index == 1 ? 1 : 0;
    Provider.of<StockProvider>(context, listen: false).fetchAlerts(isResolved: isResolved);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    final provider = Provider.of<StockProvider>(context);
    final alerts = provider.alerts;
    final isLoading = provider.isLoadingAlerts;

    final outOfStockCount = alerts.where((a) => a.isCritical).length;
    final lowStockCount = alerts.where((a) => !a.isCritical).length;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Stock Alerts", style: AppTypography.headingSmall(color: textPrimary)),
            Text("Shortage & reorder threshold triggers", style: AppTypography.caption(color: textSecondary)),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.brandPrimary,
          labelColor: AppColors.brandPrimary,
          unselectedLabelColor: textSecondary,
          labelStyle: AppTypography.bodySmall(fontWeight: FontWeight.w700),
          tabs: const [
            Tab(text: "Active Alerts"),
            Tab(text: "Resolved History"),
          ],
        ),
      ),
      body: Column(
        children: [
          // KPI strip
          if (_tabController.index == 0)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.errorRed.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.errorRed.withValues(alpha: 0.25)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.warning_amber_rounded, color: AppColors.errorRed, size: 24),
                          const SizedBox(width: 10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("$outOfStockCount", style: AppTypography.headingSmall(color: AppColors.errorRed)),
                              Text("Out of Stock", style: AppTypography.caption(color: textSecondary)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.amberDark.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.amberDark.withValues(alpha: 0.25)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.priority_high_rounded, color: AppColors.amberDark, size: 24),
                          const SizedBox(width: 10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("$lowStockCount", style: AppTypography.headingSmall(color: AppColors.amberDark)),
                              Text("Low Stock", style: AppTypography.caption(color: textSecondary)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : alerts.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.check_circle_outline_rounded, size: 50, color: AppColors.emeraldGreen),
                            const SizedBox(height: 12),
                            Text(
                              _tabController.index == 0
                                  ? "All stock levels are optimal!"
                                  : "No resolved alerts found",
                              style: AppTypography.bodyMedium(color: textSecondary),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () async => _loadAlerts(),
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          itemCount: alerts.length,
                          itemBuilder: (ctx, idx) {
                            final alert = alerts[idx];
                            return _buildAlertCard(alert, isDark, cardBg, borderColor, textPrimary, textSecondary);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildAlertCard(
    StockAlertModel alert,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final isCritical = alert.isCritical;
    final accent = isCritical ? AppColors.errorRed : AppColors.amberDark;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: accent.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  alert.alertType.replaceAll("_", " "),
                  style: AppTypography.badge(color: accent),
                ),
              ),
              const Spacer(),
              if (alert.categoryName != null)
                Text(
                  alert.categoryName!,
                  style: AppTypography.caption(color: textSecondary),
                ),
            ],
          ),

          const SizedBox(height: 10),

          Text(
            alert.itemName ?? "Item #${alert.itemId}",
            style: AppTypography.bodyMedium(fontWeight: FontWeight.w700, color: textPrimary),
          ),

          if (alert.itemCode?.isNotEmpty == true)
            Text(
              "SKU: ${alert.itemCode}",
              style: AppTypography.caption(color: textSecondary),
            ),

          const SizedBox(height: 8),

          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isDark ? Colors.white10 : Colors.grey.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "Current: ${alert.currentStock} ${alert.unit}",
                  style: AppTypography.bodySmall(
                    color: accent,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  "Min Threshold: ${alert.minStockLevel} ${alert.unit}",
                  style: AppTypography.caption(color: textSecondary),
                ),
              ],
            ),
          ),

          if (!alert.isResolved) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      final provider = Provider.of<StockProvider>(context, listen: false);
                      final item = await provider.fetchStockItemById(alert.itemId);
                      if (!mounted) return;
                      StockInSheet.show(context, preSelectedItem: item);
                    },
                    icon: const Icon(Icons.add_rounded, size: 16),
                    label: const Text("Restock Now"),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.emeraldGreen,
                      side: const BorderSide(color: AppColors.emeraldGreen),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () async {
                      final messenger = ScaffoldMessenger.of(context);
                      final success = await Provider.of<StockProvider>(context, listen: false).resolveAlert(alert.id);
                      if (mounted && success) {
                        messenger.showSnackBar(
                          const SnackBar(content: Text("Alert marked as resolved")),
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isDark ? Colors.white24 : Colors.grey.shade200,
                      foregroundColor: textPrimary,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text("Mark Resolved"),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
