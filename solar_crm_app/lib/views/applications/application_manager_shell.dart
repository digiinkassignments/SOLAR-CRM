import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../providers/auth_provider.dart';
import '../auth/login_screen.dart';
import '../widgets/logout_dialog.dart';
import '../settings/settings_view.dart';
import '../financing/financing_hub_view.dart';
import '../widgets/navbar_location_pill.dart';
import '../widgets/user_profile_avatar.dart';
import 'application_dashboard_view.dart';

class ApplicationManagerShell extends StatefulWidget {
  const ApplicationManagerShell({super.key});

  @override
  State<ApplicationManagerShell> createState() => _ApplicationManagerShellState();
}

class _ApplicationManagerShellState extends State<ApplicationManagerShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;

    final pages = [
      ApplicationDashboardView(
        onNavigateTab: (index) => setState(() => _currentIndex = index),
      ),
      const FinancingHubView(initialTab: 0), // PM Surya Ghar Subsidies
      const FinancingHubView(initialTab: 1), // Solar Loans Hub
      const SettingsView(),                  // User Settings & Profile
    ];

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: InkWell(
          onTap: () => setState(() => _currentIndex = 3),
          borderRadius: BorderRadius.circular(8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                user?.name ?? "Applications Portal",
                style: AppTypography.headingSmall(color: primaryTextColor),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                "APPLICATIONS • ${auth.workspace?.toUpperCase()}",
                style: AppTypography.badge(color: AppColors.emeraldGreen),
              ),
            ],
          ),
        ),
        actions: [
          const NavbarLocationPill(),
          const SizedBox(width: 4),
          UserProfileAvatar(
            radius: 14,
            isSelected: _currentIndex == 3,
            onTap: () => setState(() => _currentIndex = 3),
          ),
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
      body: IndexedStack(
        index: _currentIndex,
        children: pages,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        selectedItemColor: AppColors.emeraldGreen,
        unselectedItemColor: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard_rounded),
            label: "Overview",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.account_balance_outlined),
            activeIcon: Icon(Icons.account_balance_rounded),
            label: "Subsidies",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.credit_score_outlined),
            activeIcon: Icon(Icons.credit_score_rounded),
            label: "Loans",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings_outlined),
            activeIcon: Icon(Icons.settings_rounded),
            label: "Settings",
          ),
        ],
      ),
    );
  }
}
