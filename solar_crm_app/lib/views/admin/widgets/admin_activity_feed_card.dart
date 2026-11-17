import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../core/utils/formatters.dart';
import '../../../models/admin_dashboard_model.dart';

class AdminActivityFeedCard extends StatelessWidget {
  final List<ActivityFeedItem> activityFeed;

  const AdminActivityFeedCard({super.key, required this.activityFeed});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    if (activityFeed.isEmpty) return const SizedBox.shrink();

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
                "Live Activity Feed",
                style: AppTypography.subheading(color: textPrimary),
              ),
              const Icon(Icons.history_rounded, color: AppColors.skyBlue, size: 20),
            ],
          ),
          const SizedBox(height: 16),
          ...activityFeed.take(6).map((item) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 2),
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: AppColors.brandPrimary,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        RichText(
                          text: TextSpan(
                            children: [
                              TextSpan(
                                text: "${item.performedByName} ",
                                style: AppTypography.body(
                                  color: textPrimary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              TextSpan(
                                text: item.action,
                                style: AppTypography.body(
                                  color: AppColors.brandPrimary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              if (item.customerName.isNotEmpty) ...[
                                TextSpan(
                                  text: " for ",
                                  style: AppTypography.body(color: textSecondary),
                                ),
                                TextSpan(
                                  text: item.customerName,
                                  style: AppTypography.body(
                                    color: textPrimary,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        if (item.details.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(
                            item.details,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: AppTypography.caption(color: textSecondary),
                          ),
                        ],
                        const SizedBox(height: 2),
                        Text(
                          "${item.leadCode} • ${Formatters.formatDate(item.createdAt)} ${Formatters.formatTime(item.createdAt)}",
                          style: AppTypography.badge(color: textSecondary),
                        ),
                      ],
                    ),
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

