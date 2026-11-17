import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../core/utils/formatters.dart';
import '../../../models/admin_dashboard_model.dart';

class AdminRecentLeadsCard extends StatelessWidget {
  final List<RecentLeadItem> recentLeads;
  final VoidCallback? onViewAll;

  const AdminRecentLeadsCard({
    super.key,
    required this.recentLeads,
    this.onViewAll,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    if (recentLeads.isEmpty) return const SizedBox.shrink();

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
                "Recent Inbound Leads",
                style: AppTypography.subheading(color: textPrimary),
              ),
              if (onViewAll != null)
                GestureDetector(
                  onTap: onViewAll,
                  child: Row(
                    children: [
                      Text(
                        "View All",
                        style: AppTypography.caption(
                          color: AppColors.brandPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(
                        Icons.arrow_forward_ios_rounded,
                        size: 10,
                        color: AppColors.brandPrimary,
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          ...recentLeads.map((lead) {
            final statusColor = Formatters.getStatusColor(lead.status);

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: borderColor.withValues(alpha: 0.5), width: 1),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          lead.customerName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.body(
                            color: textPrimary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          lead.status,
                          style: AppTypography.badge(color: statusColor),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          "${lead.leadCode} • ${Formatters.formatKw(lead.requiredKw)}",
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.caption(color: textSecondary),
                        ),
                      ),
                      const SizedBox(width: 8),
                      if (lead.quotationAmount > 0)
                        Text(
                          Formatters.formatCurrency(lead.quotationAmount),
                          style: AppTypography.caption(
                            color: AppColors.successGreen,
                            fontWeight: FontWeight.bold,
                          ),
                        )
                      else
                        Text(
                          lead.leadSource,
                          style: AppTypography.caption(color: textSecondary),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "Assigned: ${lead.assignedToName}",
                        style: AppTypography.badge(color: textSecondary),
                      ),
                      Text(
                        Formatters.formatDate(lead.createdAt),
                        style: AppTypography.badge(color: textSecondary),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
