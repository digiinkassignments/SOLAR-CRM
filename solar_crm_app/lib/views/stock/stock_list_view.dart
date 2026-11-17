import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../models/stock_item_model.dart';
import '../../providers/stock_provider.dart';
import 'sheets/stock_in_sheet.dart';
import 'sheets/stock_out_sheet.dart';
import 'sheets/stock_item_sheet.dart';
import 'sheets/stock_valuation_sheet.dart';
import 'stock_detail_view.dart';
import 'stock_transactions_view.dart';
import 'stock_alerts_view.dart';
import 'widgets/barcode_scanner_sheet.dart';
import 'widgets/stock_item_card.dart';

class StockListView extends StatefulWidget {
  const StockListView({super.key});

  @override
  State<StockListView> createState() => _StockListViewState();
}

class _StockListViewState extends State<StockListView> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = Provider.of<StockProvider>(context, listen: false);
      provider.fetchCategories();
      provider.fetchReport();
      provider.fetchStockItems();
      provider.fetchAlerts();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    final provider = Provider.of<StockProvider>(context);
    final items = provider.items;
    final categories = provider.categories;
    final isLoading = provider.isLoadingItems;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Stock Management", style: AppTypography.headingSmall(color: textPrimary)),
            Text(
              "Warehouse hardware & inventory valuation",
              style: AppTypography.caption(color: textSecondary),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner_rounded),
            tooltip: "Scan Barcode / QR",
            onPressed: () => BarcodeScannerSheet.show(context),
          ),
          IconButton(
            icon: const Icon(Icons.assessment_outlined),
            tooltip: "Valuation Report",
            onPressed: () => StockValuationSheet.show(context),
          ),
          IconButton(
            icon: const Icon(Icons.receipt_long_outlined),
            tooltip: "Transactions Log",
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const StockTransactionsView()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: "Refresh",
            onPressed: () {
              provider.fetchCategories();
              provider.fetchReport();
              provider.fetchStockItems();
              provider.fetchAlerts();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await provider.fetchCategories();
          await provider.fetchReport();
          await provider.fetchStockItems();
          await provider.fetchAlerts();
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            // KPI Summary Cards (2x2 Grid)
            _buildKpiGrid(provider, isDark, cardBg, borderColor, textPrimary, textSecondary),

            const SizedBox(height: 14),

            // Action Buttons Bar (Scan Barcode, +New SKU, Alerts, Transactions, Valuation)
            _buildActionButtonsBar(context, provider, isDark, cardBg, borderColor, textPrimary, textSecondary),

            const SizedBox(height: 14),

            // Search Bar
            TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: "Search name, brand, model or SKU...",
                prefixIcon: const Icon(Icons.search_rounded, size: 20),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          provider.setSearchQuery("");
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onChanged: (val) => provider.setSearchQuery(val),
            ),

            const SizedBox(height: 10),

            // Status Filter Chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildStatusChip("all", "All Items", provider),
                  const SizedBox(width: 8),
                  _buildStatusChip("in_stock", "In Stock", provider),
                  const SizedBox(width: 8),
                  _buildStatusChip("low_stock", "Low Stock", provider),
                  const SizedBox(width: 8),
                  _buildStatusChip("reorder", "Reorder", provider),
                  const SizedBox(width: 8),
                  _buildStatusChip("out_of_stock", "Out of Stock", provider),
                ],
              ),
            ),

            const SizedBox(height: 8),

            // Category Filter Chips
            if (categories.isNotEmpty) ...[
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    FilterChip(
                      selected: provider.selectedCategoryId == null,
                      label: const Text("All Categories"),
                      onSelected: (_) => provider.setSelectedCategory(null),
                      selectedColor: AppColors.brandPrimary.withValues(alpha: 0.15),
                      labelStyle: AppTypography.caption(
                        color: provider.selectedCategoryId == null ? AppColors.brandPrimary : null,
                        fontWeight: provider.selectedCategoryId == null ? FontWeight.w700 : FontWeight.w500,
                      ),
                    ),
                    const SizedBox(width: 6),
                    ...categories.map((c) {
                      final isSelected = provider.selectedCategoryId == c.id;
                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: FilterChip(
                          selected: isSelected,
                          label: Text(c.name),
                          onSelected: (_) => provider.setSelectedCategory(isSelected ? null : c.id),
                          selectedColor: AppColors.brandPrimary.withValues(alpha: 0.15),
                          labelStyle: AppTypography.caption(
                            color: isSelected ? AppColors.brandPrimary : null,
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],

            // Item count & pagination summary
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "Showing ${items.length} of ${provider.totalItems} SKUs (Page ${provider.page} of ${provider.totalPages})",
                    style: AppTypography.caption(color: textSecondary, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),

            // Stock Items List
            if (isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (items.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 40),
                  child: Column(
                    children: [
                      Icon(Icons.inventory_2_outlined, size: 48, color: textSecondary),
                      const SizedBox(height: 12),
                      Text("No stock items match your filter", style: AppTypography.bodyMedium(color: textSecondary)),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        onPressed: () => StockItemSheet.show(context),
                        icon: const Icon(Icons.add_rounded, size: 18),
                        label: const Text("Add New SKU"),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.brandPrimary,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              ...items.map((item) {
                return StockItemCard(
                  item: item,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => StockDetailView(itemId: item.id),
                      ),
                    );
                  },
                  onStockIn: () => StockInSheet.show(context, preSelectedItem: item),
                  onStockOut: () => StockOutSheet.show(context, preSelectedItem: item),
                  onEdit: () => StockItemSheet.show(context, editItem: item),
                  onDelete: () => _confirmDeleteItem(context, provider, item),
                );
              }),

            const SizedBox(height: 12),

            // Numbered Pagination Controls (1, 2, 3...)
            if (provider.totalPages > 1)
              _buildPaginationBar(provider, isDark, cardBg, borderColor, textPrimary, textSecondary),

            const SizedBox(height: 60),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: cardBg,
          border: Border(top: BorderSide(color: borderColor)),
        ),
        child: Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => StockInSheet.show(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.emeraldGreen,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                icon: const Icon(Icons.add_rounded, size: 18),
                label: const Text("Stock IN"),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => StockOutSheet.show(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.errorRed,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                icon: const Icon(Icons.remove_rounded, size: 18),
                label: const Text("Stock OUT"),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaginationBar(
    StockProvider provider,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final currentPage = provider.page;
    final totalPages = provider.totalPages;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      alignment: Alignment.center,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Previous button
          IconButton(
            icon: const Icon(Icons.chevron_left_rounded),
            onPressed: currentPage > 1 ? () => provider.setPage(currentPage - 1) : null,
          ),

          // Page numbers (e.g. 1, 2, 3...)
          ...List.generate(totalPages, (index) {
            final pageNum = index + 1;
            final isCurrent = pageNum == currentPage;

            return GestureDetector(
              onTap: () => provider.setPage(pageNum),
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: isCurrent
                      ? AppColors.brandPrimary
                      : (isDark ? Colors.white10 : Colors.grey.shade100),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isCurrent ? AppColors.brandPrimary : borderColor,
                  ),
                ),
                alignment: Alignment.center,
                child: Text(
                  "$pageNum",
                  style: TextStyle(
                    color: isCurrent ? Colors.white : textPrimary,
                    fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w500,
                    fontSize: 13,
                  ),
                ),
              ),
            );
          }),

          // Next button
          IconButton(
            icon: const Icon(Icons.chevron_right_rounded),
            onPressed: currentPage < totalPages ? () => provider.setPage(currentPage + 1) : null,
          ),
        ],
      ),
    );
  }

  Widget _buildStatusChip(String value, String label, StockProvider provider) {
    final isSelected = provider.selectedStatus == value;
    return FilterChip(
      selected: isSelected,
      label: Text(label),
      onSelected: (_) => provider.setSelectedStatus(value),
      selectedColor: AppColors.brandPrimary.withValues(alpha: 0.15),
      labelStyle: AppTypography.caption(
        color: isSelected ? AppColors.brandPrimary : null,
        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
      ),
    );
  }

  Widget _buildKpiGrid(
    StockProvider provider,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildMetricTile(
                "TOTAL SKUs",
                "${provider.totalSKUs}",
                "Active catalog items",
                Icons.inventory_2_rounded,
                AppColors.skyBlue,
                isDark,
                cardBg,
                borderColor,
                textPrimary,
                textSecondary,
                null,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricTile(
                "TOTAL VALUATION",
                Formatters.formatCurrency(provider.totalValuation, compact: true),
                "Total inventory value",
                Icons.currency_rupee_rounded,
                AppColors.emeraldGreen,
                isDark,
                cardBg,
                borderColor,
                textPrimary,
                textSecondary,
                () => StockValuationSheet.show(context),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _buildMetricTile(
                "LOW STOCK",
                "${provider.lowStockCount}",
                "Below min threshold",
                Icons.warning_amber_rounded,
                AppColors.amberDark,
                isDark,
                cardBg,
                borderColor,
                textPrimary,
                textSecondary,
                () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const StockAlertsView()),
                  );
                },
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricTile(
                "OUT OF STOCK",
                "${provider.outOfStockCount}",
                "Critical 0 quantity",
                Icons.error_outline_rounded,
                AppColors.errorRed,
                isDark,
                cardBg,
                borderColor,
                textPrimary,
                textSecondary,
                () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const StockAlertsView()),
                  );
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMetricTile(
    String label,
    String value,
    String subtitle,
    IconData icon,
    Color accentColor,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
    VoidCallback? onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(label, style: AppTypography.badge(color: textSecondary)),
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: accentColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Icon(icon, color: accentColor, size: 16),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              value,
              style: AppTypography.headingSmall(color: textPrimary),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: AppTypography.caption(color: textSecondary),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtonsBar(
    BuildContext context,
    StockProvider provider,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          // Barcode / QR Scanner button
          ElevatedButton.icon(
            onPressed: () => BarcodeScannerSheet.show(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.brandPrimary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            icon: const Icon(Icons.qr_code_scanner_rounded, size: 18),
            label: const Text("Scan Barcode / QR"),
          ),
          const SizedBox(width: 8),
          OutlinedButton.icon(
            onPressed: () => StockItemSheet.show(context),
            style: OutlinedButton.styleFrom(
              foregroundColor: textPrimary,
              side: BorderSide(color: borderColor),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            icon: const Icon(Icons.add_rounded, size: 18),
            label: const Text("+ New SKU"),
          ),
          const SizedBox(width: 8),
          OutlinedButton.icon(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const StockAlertsView()),
              );
            },
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.amberDark,
              side: const BorderSide(color: AppColors.amberDark),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            icon: const Icon(Icons.warning_amber_rounded, size: 18),
            label: Text("Alerts (${provider.alerts.length})"),
          ),
          const SizedBox(width: 8),
          OutlinedButton.icon(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const StockTransactionsView()),
              );
            },
            style: OutlinedButton.styleFrom(
              foregroundColor: textPrimary,
              side: BorderSide(color: borderColor),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            icon: const Icon(Icons.receipt_long_rounded, size: 18),
            label: const Text("Transactions"),
          ),
          const SizedBox(width: 8),
          OutlinedButton.icon(
            onPressed: () => StockValuationSheet.show(context),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.emeraldGreen,
              side: const BorderSide(color: AppColors.emeraldGreen),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            icon: const Icon(Icons.assessment_rounded, size: 18),
            label: const Text("Valuation"),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmDeleteItem(BuildContext context, StockProvider provider, StockItemModel item) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Delete Stock Item"),
        content: Text("Are you sure you want to delete ${item.name}?"),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text("Cancel")),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.errorRed),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text("Delete", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      final success = await provider.deleteStockItem(item.id);
      if (context.mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Stock item deleted successfully")),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Failed to delete stock item")),
          );
        }
      }
    }
  }
}
