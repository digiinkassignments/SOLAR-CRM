import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_typography.dart';
import '../../../../models/team_user_model.dart';

class UserCard extends StatelessWidget {
  final TeamUserModel user;
  final bool isCurrentUser;
  final Function(TeamUserModel) onEdit;
  final Function(TeamUserModel) onViewDetails;
  final Function(TeamUserModel) onToggleStatus;
  final Function(TeamUserModel) onDelete;

  const UserCard({
    super.key,
    required this.user,
    this.isCurrentUser = false,
    required this.onEdit,
    required this.onViewDetails,
    required this.onToggleStatus,
    required this.onDelete,
  });

  Color _getRoleColor(int roleId) {
    switch (roleId) {
      case 1:
        return AppColors.brandPrimary; // Admin Gold
      case 2:
        return AppColors.skyBlue; // Manager Blue
      case 3:
        return AppColors.purple; // Sales Purple
      case 4:
        return AppColors.emeraldGreen; // Engineer Green
      default:
        return AppColors.textSecondaryDark;
    }
  }

  Future<void> _makePhoneCall(String phoneNumber) async {
    final cleanPhone = phoneNumber.replaceAll(RegExp(r'[^0-9+]'), '');
    final uri = Uri.parse("tel:$cleanPhone");
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _sendEmail(String email) async {
    final uri = Uri.parse("mailto:$email");
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    final roleColor = _getRoleColor(user.roleId);

    return InkWell(
      onTap: () => onViewDetails(user),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: user.isActive
                ? borderColor
                : AppColors.errorRed.withValues(alpha: 0.3),
            width: 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Avatar, Name, Role & Status Dot, Menu
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Initials Avatar
                CircleAvatar(
                  radius: 22,
                  backgroundColor: roleColor.withValues(alpha: 0.15),
                  child: Text(
                    user.initials,
                    style: AppTypography.heading(
                      size: 16,
                      color: roleColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              user.fullName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTypography.body(
                                color: textPrimary,
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                              ),
                            ),
                          ),
                          if (isCurrentUser) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                              decoration: BoxDecoration(
                                color: AppColors.brandPrimary.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                "YOU",
                                style: AppTypography.caption(
                                  color: AppColors.brandPrimary,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        "@${user.username}",
                        style: AppTypography.caption(color: textSecondary),
                      ),
                    ],
                  ),
                ),
                // Role Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
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
                // Action Menu
                PopupMenuButton<String>(
                  icon: Icon(Icons.more_vert_rounded, color: textSecondary, size: 20),
                  color: isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: borderColor),
                  ),
                  onSelected: (value) {
                    if (value == 'edit') onEdit(user);
                    if (value == 'details') onViewDetails(user);
                    if (value == 'status') onToggleStatus(user);
                    if (value == 'delete') onDelete(user);
                  },
                  itemBuilder: (context) => [
                    PopupMenuItem(
                      value: 'details',
                      child: Row(
                        children: [
                          const Icon(Icons.info_outline_rounded, size: 18),
                          const SizedBox(width: 10),
                          Text("View Profile", style: AppTypography.body(color: textPrimary)),
                        ],
                      ),
                    ),
                    PopupMenuItem(
                      value: 'edit',
                      child: Row(
                        children: [
                          const Icon(Icons.edit_outlined, size: 18),
                          const SizedBox(width: 10),
                          Text("Edit Member", style: AppTypography.body(color: textPrimary)),
                        ],
                      ),
                    ),
                    if (!isCurrentUser) ...[
                      PopupMenuItem(
                        value: 'status',
                        child: Row(
                          children: [
                            Icon(
                              user.isActive ? Icons.block_rounded : Icons.check_circle_outline_rounded,
                              size: 18,
                              color: user.isActive ? AppColors.errorRed : AppColors.emeraldGreen,
                            ),
                            const SizedBox(width: 10),
                            Text(
                              user.isActive ? "Deactivate Account" : "Activate Account",
                              style: AppTypography.body(
                                color: user.isActive ? AppColors.errorRed : AppColors.emeraldGreen,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const PopupMenuDivider(),
                      PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            const Icon(Icons.delete_outline_rounded, size: 18, color: AppColors.errorRed),
                            const SizedBox(width: 10),
                            Text("Delete Member", style: AppTypography.body(color: AppColors.errorRed)),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Middle: Contact details with 1-tap actions
            Row(
              children: [
                if (user.phone.isNotEmpty)
                  InkWell(
                    onTap: () => _makePhoneCall(user.phone),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: borderColor),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.call_outlined, size: 14, color: AppColors.emeraldGreen),
                          const SizedBox(width: 6),
                          Text(
                            user.phone,
                            style: AppTypography.caption(
                              color: textPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(width: 8),
                if (user.email.isNotEmpty)
                  Expanded(
                    child: InkWell(
                      onTap: () => _sendEmail(user.email),
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: borderColor),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.mail_outline_rounded, size: 14, color: AppColors.skyBlue),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                user.email,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppTypography.caption(
                                  color: textPrimary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),

            // Bottom row: Manager info + Status pill
            if (user.managerName != null && user.managerName!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.supervisor_account_outlined, size: 14, color: textSecondary),
                  const SizedBox(width: 6),
                  Text(
                    "Manager: ${user.managerName}",
                    style: AppTypography.caption(color: textSecondary),
                  ),
                ],
              ),
            ],

            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: user.isActive ? AppColors.emeraldGreen : AppColors.errorRed,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      user.status,
                      style: AppTypography.caption(
                        color: user.isActive ? AppColors.emeraldGreen : AppColors.errorRed,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                if (user.lastLogin != null && user.lastLogin!.isNotEmpty)
                  Text(
                    "Last seen: ${user.lastLogin}",
                    style: AppTypography.caption(color: textSecondary),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

