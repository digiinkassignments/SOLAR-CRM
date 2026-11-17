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
import 'stock_transactions_view.dart';
import 'widgets/stock_item_card.dart';

class StockDetailView extends StatefulWidget {
  final int itemId;

  const StockDetailView({super.key, required this.itemId});

  @override
  State<StockDetailView> createState() => _StockDetailViewState();
}

class _StockDetailViewState extends State<StockDetailView> {
  StockItemModel? _item;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    setState(() => _isLoading = true);
    final provider = Provider.of<StockProvider>(context, listen: false);
    final it = await provider.fetchStockItemById(widget.itemId);
    if (mounted) {
      setState(() {
        _item = it;
        _isLoading = false;
      });
    }
  }

  Future<void> _handleDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Delete Stock Item"),
        content: Text("Are you sure you want to delete ${_item?.name}? This action cannot be undone."),
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

    if (confirmed == true && mounted) {
      final success = await Provider.of<StockProvider>(context, listen: false).deleteStockItem(widget.itemId);
      if (mounted) {
        if (success) {
          Navigator.of(context).pop();
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

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(elevation: 0),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_item == null) {
      return Scaffold(
        appBar: AppBar(elevation: 0),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.errorRed),
              const SizedBox(height: 12),
              const Text("Stock item not found"),
              const SizedBox(height: 12),
              ElevatedButton(onPressed: () => Navigator.of(context).pop(), child: const Text("Go Back")),
            ],
          ),
        ),
      );
    }

    final item = _item!;

    // Status styling
    Color statusBg;
    Color statusColor;
    if (item.isOutOfStock) {
      statusBg = AppColors.errorRed.withValues(alpha: 0.12);
      statusColor = AppColors.errorRed;
    } else if (item.isLowStock) {
      statusBg = AppColors.amberDark.withValues(alpha: 0.15);
      statusColor = AppColors.amberDark;
    } else if (item.isReorderNeeded) {
      statusBg = AppColors.skyBlue.withValues(alpha: 0.15);
      statusColor = AppColors.skyBlue;
    } else {
      statusBg = AppColors.emeraldGreen.withValues(alpha: 0.12);
      statusColor = AppColors.emeraldGreen;
    }

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text(item.itemCode, style: AppTypography.headingSmall(color: textPrimary)),
        actions: [
          IconButton(
            icon: const Icon(Icons.receipt_long_outlined),
            tooltip: "Transactions Log",
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => StockTransactionsView(itemId: item.id, itemName: item.name),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: "Edit Item",
            onPressed: () async {
              final updated = await StockItemSheet.show(context, editItem: item);
              if (updated == true) _loadDetail();
            },
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline_rounded, color: AppColors.errorRed),
            tooltip: "Delete",
            onPressed: _handleDelete,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Item Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: borderColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppColors.brandPrimary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        alignment: Alignment.center,
                        child: Icon(
                          getStockCategoryIcon(item.categorySlug),
                          color: AppColors.brandPrimary,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.categoryName ?? "Hardware Item",
                              style: AppTypography.caption(color: textSecondary),
                            ),
                            Text(
                              item.name,
                              style: AppTypography.headingSmall(color: textPrimary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  if (item.brand?.isNotEmpty == true || item.model?.isNotEmpty == true) ...[
                    const SizedBox(height: 10),
                    Text(
                      [
                        if (item.brand?.isNotEmpty == true) "Brand: ${item.brand}",
                        if (item.model?.isNotEmpty == true) "Model: ${item.model}",
                      ].join(" • "),
                      style: AppTypography.bodySmall(color: textSecondary),
                    ),
                  ],

                  const SizedBox(height: 14),
                  const Divider(height: 1),
                  const SizedBox(height: 14),

                  // Stock Inventory Gauges
                  Row(
                    children: [
                      Expanded(
                        child: _buildStockMetric(
                          "CURRENT STOCK",
                          "${item.currentStock} ${item.unit}",
                          statusColor,
                          statusBg,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildStockMetric(
                          "AVAILABLE",
                          "${item.availableStock} ${item.unit}",
                          AppColors.skyBlue,
                          AppColors.skyBlue.withValues(alpha: 0.1),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildStockMetric(
                          "RESERVED",
                          "${item.reservedStock} ${item.unit}",
                          textSecondary,
                          isDark ? Colors.white10 : Colors.grey.shade100,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Stock Progress Bar
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: item.stockRatio,
                      minHeight: 6,
                      backgroundColor: isDark ? Colors.white12 : Colors.grey.shade200,
                      valueColor: AlwaysStoppedAnimation<Color>(statusColor),
                    ),
                  ),

                  const SizedBox(height: 8),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "Min Alert Level: ${item.minStockLevel} ${item.unit}",
                        style: AppTypography.caption(color: textSecondary),
                      ),
                      Text(
                        "Reorder Threshold: ${item.reorderLevel} ${item.unit}",
                        style: AppTypography.caption(color: textSecondary),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Commercial & Pricing Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: borderColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("COMMERCIAL & TAXATION", style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildDetailRow("Unit Price", Formatters.formatCurrency(item.unitPrice), textPrimary, textSecondary),
                      ),
                      Expanded(
                        child: _buildDetailRow("Total Valuation", Formatters.formatCurrency(item.totalValuation), AppColors.emeraldGreen, textSecondary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: _buildDetailRow("GST Rate", "${item.gstRate.toStringAsFixed(0)}%", textPrimary, textSecondary),
                      ),
                      Expanded(
                        child: _buildDetailRow("HSN Code", item.hsnCode ?? "N/A", textPrimary, textSecondary),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Technical Specifications Card
            if (item.specifications.isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: cardBg,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: borderColor),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("HARDWARE SPECIFICATIONS", style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary)),
                    const SizedBox(height: 12),
                    ...item.specifications.entries.map((e) {
                      if (e.value == null || e.value.toString().trim().isEmpty) return const SizedBox.shrink();
                      final keyLabel = e.key.replaceAll("_", " ").toUpperCase();
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(keyLabel, style: AppTypography.caption(color: textSecondary)),
                            Text(
                              e.value.toString(),
                              style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      );
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            if (item.description?.isNotEmpty == true) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: cardBg,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: borderColor),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("DESCRIPTION", style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary)),
                    const SizedBox(height: 6),
                    Text(item.description!, style: AppTypography.bodySmall(color: textPrimary)),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: cardBg,
          border: Border(top: BorderSide(color: borderColor)),
        ),
        child: Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () async {
                  final success = await StockInSheet.show(context, preSelectedItem: item);
                  if (success == true) _loadDetail();
                },
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
                onPressed: () async {
                  final success = await StockOutSheet.show(context, preSelectedItem: item);
                  if (success == true) _loadDetail();
                },
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

  Widget _buildStockMetric(String label, String value, Color color, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: AppTypography.badge(color: color)),
          const SizedBox(height: 2),
          Text(
            value,
            style: AppTypography.bodyMedium(fontWeight: FontWeight.w700, color: color),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, Color valueColor, Color labelColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.caption(color: labelColor)),
        const SizedBox(height: 2),
        Text(
          value,
          style: AppTypography.bodyMedium(fontWeight: FontWeight.w700, color: valueColor),
        ),
      ],
    );
  }
}

