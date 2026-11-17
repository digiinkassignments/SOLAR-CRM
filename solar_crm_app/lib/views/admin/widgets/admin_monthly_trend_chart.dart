import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../models/admin_dashboard_model.dart';

class AdminMonthlyTrendChart extends StatelessWidget {
  final List<MonthlyTrendItem> trendData;

  const AdminMonthlyTrendChart({super.key, required this.trendData});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    if (trendData.isEmpty) {
      return const SizedBox.shrink();
    }

    double maxY = 10;
    for (var item in trendData) {
      if (item.leadsCreated > maxY) maxY = item.leadsCreated.toDouble();
      if (item.leadsWon > maxY) maxY = item.leadsWon.toDouble();
    }
    maxY = (maxY * 1.25).ceilToDouble();

    return Container(
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
                "6-Month Performance Trend",
                style: AppTypography.subheading(color: textPrimary),
              ),
              Row(
                children: [
                  _buildLegendItem("Created", AppColors.brandPrimary),
                  const SizedBox(width: 12),
                  _buildLegendItem("Won", AppColors.successGreen),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 180,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: maxY,
                barTouchData: BarTouchData(
                  touchTooltipData: BarTouchTooltipData(
                    getTooltipColor: (_) => isDark ? AppColors.darkSurface : AppColors.lightSurface,
                    getTooltipItem: (group, groupIndex, rod, rodIndex) {
                      final item = trendData[groupIndex];
                      final isWon = rodIndex == 1;
                      return BarTooltipItem(
                        "${item.month}\n${isWon ? 'Won' : 'Created'}: ${rod.toY.toInt()}",
                        AppTypography.caption(
                          color: isWon ? AppColors.successGreen : AppColors.brandPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                      );
                    },
                  ),
                ),
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        final index = value.toInt();
                        if (index < 0 || index >= trendData.length) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 8.0),
                          child: Text(
                            trendData[index].month,
                            style: AppTypography.caption(color: textSecondary),
                          ),
                        );
                      },
                    ),
                  ),
                  leftTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                ),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) => FlLine(
                    color: borderColor.withValues(alpha: 0.5),
                    strokeWidth: 1,
                  ),
                ),
                borderData: FlBorderData(show: false),
                barGroups: List.generate(trendData.length, (index) {
                  final item = trendData[index];
                  return BarChartGroupData(
                    x: index,
                    barRods: [
                      BarChartRodData(
                        toY: item.leadsCreated.toDouble(),
                        color: AppColors.brandPrimary,
                        width: 8,
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                      ),
                      BarChartRodData(
                        toY: item.leadsWon.toDouble(),
                        color: AppColors.successGreen,
                        width: 8,
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                      ),
                    ],
                  );
                }),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(String label, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: AppTypography.caption(color: color, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
