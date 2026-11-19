import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../providers/auth_provider.dart';
import 'login_screen.dart';
import 'workspace_screen.dart';

class AccessDeniedScreen extends StatelessWidget {
  const AccessDeniedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    final bgColor = isDark ? AppColors.darkBackground : AppColors.lightBackground;
    final cardBg = isDark ? const Color(0xFF161616) : Colors.white;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Lock / Shield Icon
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.errorRed.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppColors.errorRed.withValues(alpha: 0.3),
                      width: 2,
                    ),
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.shield_outlined,
                      size: 44,
                      color: AppColors.errorRed,
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                Text(
                  "Access Restricted",
                  style: AppTypography.headingLarge(color: textPrimary),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 10),
                Text(
                  "Your assigned role does not have permission to access the Solar CRM mobile application.",
                  style: AppTypography.body(color: textSecondary),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 28),

                // User & Role Info Card
                Container(
                  width: double.infinity,
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
                          Icon(Icons.badge_outlined, size: 16, color: textSecondary),
                          const SizedBox(width: 8),
                          Text(
                            "AUTHENTICATED SESSION",
                            style: AppTypography.caption(
                              color: textSecondary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _buildInfoRow("User", user?.name ?? "Unknown", textPrimary, textSecondary),
                      const SizedBox(height: 8),
                      _buildInfoRow("Email", user?.email ?? "-", textPrimary, textSecondary),
                      const SizedBox(height: 8),
                      _buildInfoRow(
                        "Assigned Role",
                        "${user?.roleName ?? 'None'} (Role ID: ${user?.roleId ?? 0})",
                        AppColors.brandPrimary,
                        textSecondary,
                      ),
                      const SizedBox(height: 8),
                      _buildInfoRow("Workspace", auth.workspace ?? "-", textPrimary, textSecondary),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Advisory Notice
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.brandPrimary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppColors.brandPrimary.withValues(alpha: 0.2),
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.info_outline,
                        size: 18,
                        color: AppColors.brandPrimary,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          "Mobile application access is enabled for Super Admin, Manager, Sales Executive, and Site Engineer roles. For specialized portal roles (e.g. Finance, Application Manager), please sign in via the web platform.",
                          style: TextStyle(
                            fontSize: 12,
                            color: textPrimary,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Sign Out Button
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      await auth.logout();
                      if (context.mounted) {
                        Navigator.pushAndRemoveUntil(
                          context,
                          MaterialPageRoute(builder: (_) => const LoginScreen()),
                          (route) => false,
                        );
                      }
                    },
                    icon: const Icon(Icons.logout, size: 18),
                    label: const Text(
                      "Sign Out",
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.errorRed,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Switch Workspace
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: OutlinedButton(
                    onPressed: () async {
                      await auth.resetWorkspace();
                      if (context.mounted) {
                        Navigator.pushAndRemoveUntil(
                          context,
                          MaterialPageRoute(builder: (_) => const WorkspaceScreen()),
                          (route) => false,
                        );
                      }
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: textPrimary,
                      side: BorderSide(color: borderColor),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text("Switch Workspace"),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, Color valueColor, Color labelColor) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 90,
          child: Text(
            label,
            style: TextStyle(fontSize: 12, color: labelColor, fontWeight: FontWeight.w500),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: TextStyle(fontSize: 12, color: valueColor, fontWeight: FontWeight.w700),
          ),
        ),
      ],
    );
  }
}
