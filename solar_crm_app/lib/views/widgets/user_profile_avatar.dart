import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/settings_provider.dart';

class UserProfileAvatar extends StatelessWidget {
  final double radius;
  final bool isSelected;
  final VoidCallback? onTap;

  const UserProfileAvatar({
    super.key,
    this.radius = 15,
    this.isSelected = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final settingsProvider = Provider.of<SettingsProvider>(context);
    final user = auth.user;
    final profile = settingsProvider.profile;

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final activeBorderColor = isSelected ? AppColors.brandPrimary : borderColor;

    // Resolve profile photo URL from either auth user or live settings profile
    final imageUrl = user?.getFullImageUrl(auth.workspace) ??
        profile?.getFullImageUrl(settingsProvider.baseApiUrl);

    final initial = (user?.name.isNotEmpty == true
            ? user!.name[0]
            : (profile?.fullName.isNotEmpty == true ? profile!.fullName[0] : "A"))
        .toUpperCase();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(radius + 4),
        child: Container(
          padding: const EdgeInsets.all(2),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: activeBorderColor,
              width: 2,
            ),
          ),
          child: ClipOval(
            child: Container(
              width: radius * 2,
              height: radius * 2,
              color: AppColors.brandNavy,
              child: (imageUrl != null && imageUrl.isNotEmpty)
                  ? Image.network(
                      imageUrl,
                      width: radius * 2,
                      height: radius * 2,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Center(
                        child: Text(
                          initial,
                          style: TextStyle(
                            fontSize: radius * 0.85,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return Center(
                          child: SizedBox(
                            width: radius,
                            height: radius,
                            child: const CircularProgressIndicator(
                              strokeWidth: 1.5,
                              valueColor: AlwaysStoppedAnimation<Color>(AppColors.brandPrimary),
                            ),
                          ),
                        );
                      },
                    )
                  : Center(
                      child: Text(
                        initial,
                        style: TextStyle(
                          fontSize: radius * 0.85,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
            ),
          ),
        ),
      ),
    );
  }
}

