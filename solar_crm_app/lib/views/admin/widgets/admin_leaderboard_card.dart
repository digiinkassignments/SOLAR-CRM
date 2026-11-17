import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../core/utils/formatters.dart';
import '../../../models/admin_dashboard_model.dart';

class AdminLeaderboardCard extends StatelessWidget {
  final List<TeamLeaderboardItem> leaderboard;

  const AdminLeaderboardCard({super.key, required this.leaderboard});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    if (leaderboard.isEmpty) return const SizedBox.shrink();

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
                "Sales Team Leaderboard",
                style: AppTypography.subheading(color: textPrimary),
              ),
              const Icon(Icons.emoji_events_rounded, color: AppColors.brandPrimary, size: 20),
            ],
          ),
          const SizedBox(height: 16),
          ...List.generate(leaderboard.length, (index) {
            final item = leaderboard[index];
            final rank = index + 1;

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: rank == 1
                      ? AppColors.brandPrimary.withValues(alpha: 0.4)
                      : borderColor.withValues(alpha: 0.5),
                  width: 1,
                ),
              ),
              child: Row(
                children: [
                  _buildRankBadge(rank),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.repName,
                          style: AppTypography.body(
                            color: textPrimary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          "${item.totalAssigned} Assigned • ${item.wonLeads} Converted",
                          style: AppTypography.caption(color: textSecondary),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        Formatters.formatCurrency(item.revenue, compact: true),
                        style: AppTypography.body(
                          color: AppColors.successGreen,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        "Revenue",
                        style: AppTypography.caption(color: textSecondary),
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

  Widget _buildRankBadge(int rank) {
    if (rank == 1) {
      return const Text("🥇", style: TextStyle(fontSize: 20));
    } else if (rank == 2) {
      return const Text("🥈", style: TextStyle(fontSize: 20));
    } else if (rank == 3) {
      return const Text("🥉", style: TextStyle(fontSize: 20));
    } else {
      return Container(
        width: 24,
        height: 24,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: const Color(0xFF262626),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          "#$rank",
          style: AppTypography.badge(color: Colors.white70),
        ),
      );
    }
  }
}
