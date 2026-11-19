import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../providers/auth_provider.dart';
import '../auth/login_screen.dart';
import '../widgets/logout_dialog.dart';
import '../settings/settings_view.dart';
import '../widgets/navbar_location_pill.dart';
import '../widgets/user_profile_avatar.dart';
import '../admin/leads/leads_list_view.dart';
import '../admin/customers/customers_list_view.dart';
import '../projects/projects_list_view.dart';
import 'manager_dashboard_view.dart';
import 'manager_team_view.dart';

class ManagerShell extends StatefulWidget {
  const ManagerShell({super.key});

  @override
  State<ManagerShell> createState() => _ManagerShellState();
}

class _ManagerShellState extends State<ManagerShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;

    final pages = [
      ManagerDashboardView(
        onNavigateTab: (index) => setState(() => _currentIndex = index),
      ),
      const LeadsListView(),
      const CustomersListView(),
      const ProjectsListView(),
      const ManagerTeamView(),
      const SettingsView(),
    ];

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: InkWell(
          onTap: () => setState(() => _currentIndex = 5),
          borderRadius: BorderRadius.circular(8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                user?.name ?? "Team Manager",
                style: AppTypography.headingSmall(color: primaryTextColor),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                "MANAGER • ${auth.workspace?.toUpperCase()}",
                style: AppTypography.badge(color: AppColors.skyBlue),
              ),
            ],
          ),
        ),
        actions: [
          const NavbarLocationPill(),
          const SizedBox(width: 4),
          UserProfileAvatar(
            radius: 14,
            isSelected: _currentIndex == 5,
            onTap: () => setState(() => _currentIndex = 5),
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
        currentIndex: _currentIndex > 4 ? 0 : _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        selectedItemColor: AppColors.skyBlue,
        unselectedItemColor: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard_rounded),
            label: "Overview",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment_outlined),
            activeIcon: Icon(Icons.assignment_rounded),
            label: "Leads",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people_outline_rounded),
            activeIcon: Icon(Icons.people_rounded),
            label: "Customers",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.solar_power_outlined),
            activeIcon: Icon(Icons.solar_power_rounded),
            label: "Projects",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.badge_outlined),
            activeIcon: Icon(Icons.badge_rounded),
            label: "Team",
          ),
        ],
      ),
    );
  }
}
