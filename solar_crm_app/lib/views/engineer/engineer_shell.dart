import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../providers/auth_provider.dart';
import '../auth/login_screen.dart';
import '../widgets/logout_dialog.dart';

class EngineerShell extends StatefulWidget {
  const EngineerShell({super.key});

  @override
  State<EngineerShell> createState() => _EngineerShellState();
}

class _EngineerShellState extends State<EngineerShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final secondaryTextColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              user?.name ?? "Engineer Workspace",
              style: AppTypography.headingSmall(color: primaryTextColor),
            ),
            Text(
              "SITE ENGINEER • ${auth.workspace?.toUpperCase()}",
              style: AppTypography.badge(color: AppColors.emeraldGreen),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppColors.errorRed),
            tooltip: "Logout",
            onPressed: () async {
              final nav = Navigator.of(context);
              final confirmed = await showLogoutConfirmationDialog(context);
              if (!confirmed) return;
              await auth.logout();
              nav.pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: surfaceColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: borderColor),
                ),
                child: const Icon(
                  Icons.engineering_outlined,
                  size: 48,
                  color: AppColors.emeraldGreen,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                "Site Engineering Ready",
                style: AppTypography.headingMedium(color: primaryTextColor),
              ),
              const SizedBox(height: 8),
              Text(
                "GPS Site Navigation, Feasibility Form & Camera uploads ready for live API integration.",
                textAlign: TextAlign.center,
                style: AppTypography.subtitle(color: secondaryTextColor),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        selectedItemColor: AppColors.emeraldGreen,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment_outlined),
            activeIcon: Icon(Icons.assignment),
            label: "Site Surveys",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.camera_alt_outlined),
            activeIcon: Icon(Icons.camera_alt),
            label: "Evidence",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.solar_power_outlined),
            activeIcon: Icon(Icons.solar_power),
            label: "Projects",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: "Profile",
          ),
        ],
      ),
    );
  }
}
