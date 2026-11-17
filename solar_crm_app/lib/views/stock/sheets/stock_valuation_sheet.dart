import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../core/utils/formatters.dart';
import '../../../providers/stock_provider.dart';

class StockValuationSheet extends StatefulWidget {
  const StockValuationSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const StockValuationSheet(),
    );
  }

  @override
  State<StockValuationSheet> createState() => _StockValuationSheetState();
}

class _StockValuationSheetState extends State<StockValuationSheet> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<StockProvider>(context, listen: false).fetchReport();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    final provider = Provider.of<StockProvider>(context);
    final report = provider.report;
    final isLoading = provider.isLoadingReport;

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        border: Border.all(color: borderColor),
      ),
      padding: const EdgeInsets.all(20),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.emeraldGreen.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.assessment_rounded, color: AppColors.emeraldGreen, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Inventory Valuation Report",
                      style: AppTypography.headingSmall(color: textPrimary),
                    ),
                    Text(
                      "Real-time asset valuation across hardware categories",
                      style: AppTypography.caption(color: textSecondary),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(Icons.close_rounded, color: textSecondary),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),

          const SizedBox(height: 16),

          if (isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: CircularProgressIndicator(),
              ),
            )
          else ...[
            // KPI Summary Row
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDark ? Colors.white10 : Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: borderColor),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("TOTAL VALUE", style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary)),
                        const SizedBox(height: 4),
                        Text(
                          Formatters.formatCurrency(report?.totalValuation ?? provider.totalValuation),
                          style: AppTypography.headingSmall(color: AppColors.emeraldGreen),
                        ),
                      ],
                    ),
                  ),
                  Container(width: 1, height: 40, color: borderColor),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("ACTIVE SKUs", style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary)),
                        const SizedBox(height: 4),
                        Text(
                          "${report?.totalItems ?? provider.totalSKUs} Items",
                          style: AppTypography.headingSmall(color: textPrimary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            Text(
              "CATEGORY BREAKDOWN",
              style: AppTypography.caption(fontWeight: FontWeight.w700, color: textSecondary),
            ),

            const SizedBox(height: 8),

            Expanded(
              child: (report?.categories.isNotEmpty == true)
                  ? ListView.separated(
                      itemCount: report!.categories.length,
                      separatorBuilder: (ctx, idx) => const Divider(height: 1),
                      itemBuilder: (ctx, idx) {
                        final cat = report.categories[idx];
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          child: Row(
                            children: [
                              Container(
                                width: 34,
                                height: 34,
                                decoration: BoxDecoration(
                                  color: AppColors.brandPrimary.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  "${idx + 1}",
                                  style: AppTypography.badge(color: AppColors.brandPrimary),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      cat.categoryName,
                                      style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w600),
                                    ),
                                    Text(
                                      "${cat.totalItems} SKUs • ${cat.totalStock} in stock",
                                      style: AppTypography.caption(color: textSecondary),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                Formatters.formatCurrency(cat.totalValuation),
                                style: AppTypography.bodyMedium(color: AppColors.emeraldGreen, fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                        );
                      },
                    )
                  : Center(
                      child: Text(
                        "No category valuation data available",
                        style: AppTypography.bodySmall(color: textSecondary),
                      ),
                    ),
            ),
          ],
        ],
      ),
    );
  }
}
