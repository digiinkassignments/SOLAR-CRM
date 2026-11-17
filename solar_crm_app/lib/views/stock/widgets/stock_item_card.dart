import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../core/utils/formatters.dart';
import '../../../models/stock_item_model.dart';

IconData getStockCategoryIcon(String? slug) {
  switch (slug) {
    case 'solar-panels':
      return Icons.solar_power_rounded;
    case 'inverters':
      return Icons.electric_meter_rounded;
    case 'mounting-structure':
      return Icons.architecture_rounded;
    case 'dc-cables':
      return Icons.cable_rounded;
    case 'ac-cables':
      return Icons.power_rounded;
    case 'earthing':
      return Icons.bolt_rounded;
    case 'battery':
      return Icons.battery_charging_full_rounded;
    case 'tools':
      return Icons.build_rounded;
    default:
      return Icons.inventory_2_rounded;
  }
}

class StockItemCard extends StatelessWidget {
  final StockItemModel item;
  final VoidCallback onTap;
  final VoidCallback onStockIn;
  final VoidCallback onStockOut;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const StockItemCard({
    super.key,
    required this.item,
    required this.onTap,
    required this.onStockIn,
    required this.onStockOut,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

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

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top row: Category icon, SKU, Status badge, Menu
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.brandPrimary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: Icon(
                        getStockCategoryIcon(item.categorySlug),
                        color: AppColors.brandPrimary,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: isDark ? Colors.white10 : Colors.grey.shade100,
                                  borderRadius: BorderRadius.circular(5),
                                  border: Border.all(color: borderColor),
                                ),
                                child: Text(
                                  item.itemCode,
                                  style: AppTypography.badge(color: textSecondary),
                                ),
                              ),
                              if (item.categoryName != null) ...[
                                const SizedBox(width: 6),
                                Flexible(
                                  child: Text(
                                    item.categoryName!,
                                    style: AppTypography.caption(color: textSecondary),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            item.name,
                            style: AppTypography.bodyMedium(
                              fontWeight: FontWeight.w700,
                              color: textPrimary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    PopupMenuButton<String>(
                      icon: Icon(Icons.more_vert_rounded, color: textSecondary, size: 20),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      color: cardBg,
                      onSelected: (val) {
                        if (val == 'view') onTap();
                        if (val == 'in') onStockIn();
                        if (val == 'out') onStockOut();
                        if (val == 'edit') onEdit();
                        if (val == 'delete') onDelete();
                      },
                      itemBuilder: (ctx) => [
                        const PopupMenuItem(
                          value: 'view',
                          child: Row(
                            children: [
                              Icon(Icons.visibility_outlined, size: 18),
                              SizedBox(width: 8),
                              Text("View Details"),
                            ],
                          ),
                        ),
                        const PopupMenuItem(
                          value: 'in',
                          child: Row(
                            children: [
                              Icon(Icons.trending_up_rounded, color: AppColors.emeraldGreen, size: 18),
                              SizedBox(width: 8),
                              Text("Stock IN"),
                            ],
                          ),
                        ),
                        const PopupMenuItem(
                          value: 'out',
                          child: Row(
                            children: [
                              Icon(Icons.trending_down_rounded, color: AppColors.errorRed, size: 18),
                              SizedBox(width: 8),
                              Text("Stock OUT"),
                            ],
                          ),
                        ),
                        const PopupMenuItem(
                          value: 'edit',
                          child: Row(
                            children: [
                              Icon(Icons.edit_outlined, size: 18),
                              SizedBox(width: 8),
                              Text("Edit Item"),
                            ],
                          ),
                        ),
                        const PopupMenuItem(
                          value: 'delete',
                          child: Row(
                            children: [
                              Icon(Icons.delete_outline_rounded, color: AppColors.errorRed, size: 18),
                              SizedBox(width: 8),
                              Text("Delete Item", style: TextStyle(color: AppColors.errorRed)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 10),

                // Brand, Model & Specs
                if (item.brand?.isNotEmpty == true || item.model?.isNotEmpty == true)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text(
                      [
                        if (item.brand?.isNotEmpty == true) item.brand,
                        if (item.model?.isNotEmpty == true) item.model,
                      ].join(" • "),
                      style: AppTypography.bodySmall(color: textSecondary),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),

                // Stock progress & status pill
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: statusBg,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        item.stockStatusLabel,
                        style: AppTypography.badge(color: statusColor),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      "Min: ${item.minStockLevel} • Reorder: ${item.reorderLevel}",
                      style: AppTypography.caption(color: textSecondary),
                    ),
                  ],
                ),

                const SizedBox(height: 8),

                // Stock Level Linear Progress Indicator
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: item.stockRatio,
                    minHeight: 5,
                    backgroundColor: isDark ? Colors.white12 : Colors.grey.shade200,
                    valueColor: AlwaysStoppedAnimation<Color>(statusColor),
                  ),
                ),

                const SizedBox(height: 12),
                const Divider(height: 1),
                const SizedBox(height: 10),

                // Bottom row: Price, Total Valuation & Quick Action Buttons
                Row(
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Rate / Valuation",
                          style: AppTypography.caption(color: textSecondary),
                        ),
                        const SizedBox(height: 1),
                        Row(
                          children: [
                            Text(
                              Formatters.formatCurrency(item.unitPrice),
                              style: AppTypography.bodySmall(
                                color: textPrimary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              " • ${Formatters.formatCurrency(item.totalValuation)}",
                              style: AppTypography.bodySmall(
                                color: AppColors.emeraldGreen,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const Spacer(),
                    // Quick Action Buttons
                    InkWell(
                      onTap: onStockIn,
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.emeraldGreen.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.emeraldGreen.withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.add_rounded, color: AppColors.emeraldGreen, size: 15),
                            const SizedBox(width: 2),
                            Text(
                              "IN",
                              style: AppTypography.badge(color: AppColors.emeraldGreen),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    InkWell(
                      onTap: onStockOut,
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.errorRed.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.errorRed.withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.remove_rounded, color: AppColors.errorRed, size: 15),
                            const SizedBox(width: 2),
                            Text(
                              "OUT",
                              style: AppTypography.badge(color: AppColors.errorRed),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

