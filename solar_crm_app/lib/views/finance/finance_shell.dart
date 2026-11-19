import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../providers/auth_provider.dart';
import '../auth/login_screen.dart';
import '../widgets/logout_dialog.dart';
import '../settings/settings_view.dart';
import '../calculator/solar_calculator_view.dart';
import '../stock/stock_list_view.dart';
import '../widgets/navbar_location_pill.dart';
import '../widgets/user_profile_avatar.dart';
import 'finance_dashboard_view.dart';
import 'finance_view.dart';

class FinanceShell extends StatefulWidget {
  const FinanceShell({super.key});

  @override
  State<FinanceShell> createState() => _FinanceShellState();
}

class _FinanceShellState extends State<FinanceShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;

    final pages = [
      FinanceDashboardView(
        onNavigateTab: (index) => setState(() => _currentIndex = index),
      ),
      const FinanceView(initialTabIndex: 1), // Invoices & Quotations
      const StockListView(),                 // Inventory & Warehouses
      const SolarCalculatorView(),           // Cost & Capacity Estimator
      const SettingsView(),                  // User Settings & Profile
    ];

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: InkWell(
          onTap: () => setState(() => _currentIndex = 4),
          borderRadius: BorderRadius.circular(8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                user?.name ?? "Finance Portal",
                style: AppTypography.headingSmall(color: primaryTextColor),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                "FINANCE • ${auth.workspace?.toUpperCase()}",
                style: AppTypography.badge(color: AppColors.brandGold),
              ),
            ],
          ),
        ),
        actions: [
          const NavbarLocationPill(),
          const SizedBox(width: 4),
          UserProfileAvatar(
            radius: 14,
            isSelected: _currentIndex == 4,
            onTap: () => setState(() => _currentIndex = 4),
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
        selectedItemColor: AppColors.brandGold,
        unselectedItemColor: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard_rounded),
            label: "Overview",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            activeIcon: Icon(Icons.receipt_long_rounded),
            label: "Billing",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2_outlined),
            activeIcon: Icon(Icons.inventory_2_rounded),
            label: "Stock",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calculate_outlined),
            activeIcon: Icon(Icons.calculate_rounded),
            label: "Calculator",
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
