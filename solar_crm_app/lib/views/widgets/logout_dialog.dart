import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';

Future<bool> showLogoutConfirmationDialog(BuildContext context) async {
  final isDark = Theme.of(context).brightness == Brightness.dark;
  final primaryTextColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
  final secondaryTextColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

  final confirmed = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: Theme.of(context).cardTheme.color,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
        ),
      ),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.errorRed.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.logout_rounded, color: AppColors.errorRed, size: 20),
          ),
          const SizedBox(width: 12),
          Text("Sign Out", style: AppTypography.headingSmall(color: primaryTextColor)),
        ],
      ),
      content: Text(
        "Are you sure you want to end your current session?",
        style: AppTypography.bodyMedium(color: secondaryTextColor),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx, false),
          child: Text(
            "Cancel",
            style: AppTypography.button(color: secondaryTextColor),
          ),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.errorRed,
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
          ),
          onPressed: () => Navigator.pop(ctx, true),
          child: Text(
            "Logout",
            style: AppTypography.button(color: Colors.white),
          ),
        ),
      ],
    ),
  );

  return confirmed ?? false;
}

