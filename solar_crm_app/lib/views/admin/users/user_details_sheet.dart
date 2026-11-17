import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/whatsapp_helper.dart';
import '../../../models/team_user_model.dart';

class UserDetailsSheet extends StatelessWidget {
  final TeamUserModel user;

  const UserDetailsSheet({super.key, required this.user});

  Color _getRoleColor(int roleId) {
    switch (roleId) {
      case 1:
        return AppColors.brandPrimary;
      case 2:
        return AppColors.skyBlue;
      case 3:
        return AppColors.purple;
      case 4:
        return AppColors.emeraldGreen;
      default:
        return AppColors.textSecondaryDark;
    }
  }

  Future<void> _makeCall() async {
    await WhatsAppHelper.launchDialer(user.phone);
  }

  Future<void> _openWhatsApp(BuildContext context) async {
    await WhatsAppHelper.launchWhatsApp(context: context, phone: user.phone);
  }

  Future<void> _sendMail() async {
    await WhatsAppHelper.launchEmail(user.email);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;

    final roleColor = _getRoleColor(user.roleId);

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: borderColor)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: borderColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Avatar & Role
          CircleAvatar(
            radius: 36,
            backgroundColor: roleColor.withValues(alpha: 0.15),
            child: Text(
              user.initials,
              style: AppTypography.heading(
                size: 26,
                color: roleColor,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            user.fullName,
            textAlign: TextAlign.center,
            style: AppTypography.heading(size: 20, color: textPrimary),
          ),
          const SizedBox(height: 4),
          Text(
            "@${user.username}",
            style: AppTypography.body(color: textSecondary),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: roleColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: roleColor.withValues(alpha: 0.3)),
            ),
            child: Text(
              user.roleName.toUpperCase(),
              style: AppTypography.badge(color: roleColor),
            ),
          ),

          const SizedBox(height: 20),

          // Quick Action Buttons (Call, WhatsApp, Email)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildActionButton(
                icon: Icons.call_rounded,
                label: "Call",
                color: AppColors.emeraldGreen,
                onTap: _makeCall,
              ),
              _buildActionButton(
                customIcon: const FaIcon(FontAwesomeIcons.whatsapp, size: 22, color: Color(0xFF25D366)),
                label: "WhatsApp",
                color: const Color(0xFF25D366),
                onTap: () => _openWhatsApp(context),
              ),
              _buildActionButton(
                icon: Icons.mail_rounded,
                label: "Email",
                color: AppColors.skyBlue,
                onTap: _sendMail,
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Detailed Info Box
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: surfaceColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: borderColor),
            ),
            child: Column(
              children: [
                _buildInfoRow(
                  label: "Phone",
                  value: user.phone,
                  textPrimary: textPrimary,
                  textSecondary: textSecondary,
                ),
                Divider(color: borderColor, height: 20),
                _buildInfoRow(
                  label: "Email",
                  value: user.email,
                  textPrimary: textPrimary,
                  textSecondary: textSecondary,
                ),
                if (user.managerName != null && user.managerName!.isNotEmpty) ...[
                  Divider(color: borderColor, height: 20),
                  _buildInfoRow(
                    label: "Reporting Manager",
                    value: user.managerName!,
                    textPrimary: textPrimary,
                    textSecondary: textSecondary,
                  ),
                ],
                Divider(color: borderColor, height: 20),
                _buildInfoRow(
                  label: "Account Status",
                  value: user.status,
                  valueColor: user.isActive ? AppColors.emeraldGreen : AppColors.errorRed,
                  textPrimary: textPrimary,
                  textSecondary: textSecondary,
                ),
                if (user.createdAt != null) ...[
                  Divider(color: borderColor, height: 20),
                  _buildInfoRow(
                    label: "Member Since",
                    value: Formatters.formatDate(user.createdAt),
                    textPrimary: textPrimary,
                    textSecondary: textSecondary,
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    Widget? customIcon,
    IconData? icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 84,
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          children: [
            customIcon ?? Icon(icon, color: color, size: 22),
            const SizedBox(height: 4),
            Text(label, style: AppTypography.caption(color: color, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow({
    required String label,
    required String value,
    Color? valueColor,
    required Color textPrimary,
    required Color textSecondary,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppTypography.caption(color: textSecondary)),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.end,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppTypography.body(
              color: valueColor ?? textPrimary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}

