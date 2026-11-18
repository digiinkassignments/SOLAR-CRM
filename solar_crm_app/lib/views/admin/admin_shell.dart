import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../providers/auth_provider.dart';
import '../auth/login_screen.dart';
import '../widgets/logout_dialog.dart';
import 'admin_dashboard_view.dart';
import 'users/users_list_view.dart';
import 'customers/customers_list_view.dart';
import 'leads/leads_list_view.dart';
import '../calculator/solar_calculator_view.dart';
import '../finance/finance_view.dart';
import '../stock/stock_list_view.dart';
import '../settings/settings_view.dart';
import '../financing/financing_hub_view.dart';
import '../projects/projects_list_view.dart';

class AdminShell extends StatefulWidget {
  const AdminShell({super.key});

  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final secondaryTextColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;

    final pages = [
      AdminDashboardView(
        onNavigateTab: (index) {
          setState(() => _currentIndex = index);
        },
      ),
      const LeadsListView(),
      const CustomersListView(),
      const ProjectsListView(),
      const UsersListView(),
      const SettingsView(),
    ];

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        elevation: 0,
        scrolledUnderElevation: 0,
        title: InkWell(
          onTap: () => setState(() => _currentIndex = 5),
          borderRadius: BorderRadius.circular(10),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: borderColor),
                ),
                clipBehavior: Clip.antiAlias,
                child: Image.asset(
                  'assets/images/logo.png',
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) => Container(
                    color: AppColors.brandPrimary.withValues(alpha: 0.15),
                    alignment: Alignment.center,
                    child: const Icon(Icons.solar_power_rounded, color: AppColors.brandPrimary, size: 20),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      auth.tenant?.businessName.isNotEmpty == true
                          ? auth.tenant!.businessName
                          : (auth.workspace?.toUpperCase() ?? "DigiInk Solutions"),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.headingSmall(color: primaryTextColor),
                    ),
                    Text(
                      "ADMIN • ${auth.workspace?.toUpperCase() ?? 'SOLAR CRM'}",
                      style: AppTypography.badge(color: AppColors.brandPrimary),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.inventory_2_outlined, color: AppColors.emeraldGreen, size: 22),
            tooltip: "Stock & Inventory",
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const StockListView()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.receipt_long_rounded, color: AppColors.skyBlue, size: 22),
            tooltip: "Quotations & Invoices",
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const FinanceView()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.calculate_outlined, color: AppColors.brandPrimary, size: 22),
            tooltip: "Solar Calculator",
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const SolarCalculatorView()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.account_balance_outlined, color: Color(0xFF7C3AED), size: 22),
            tooltip: "Subsidy & Finance",
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const FinancingHubView()),
              );
            },
          ),
          // Header Profile Avatar (Opens Settings)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: InkWell(
              onTap: () => setState(() => _currentIndex = 5),
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: _currentIndex == 5 ? AppColors.brandPrimary : borderColor,
                    width: 2,
                  ),
                ),
                child: CircleAvatar(
                  radius: 14,
                  backgroundColor: AppColors.brandNavy,
                  child: Text(
                    (auth.user?.name.isNotEmpty == true ? auth.user!.name[0] : "A").toUpperCase(),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppColors.errorRed, size: 22),
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
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(color: borderColor, width: 1),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          type: BottomNavigationBarType.fixed,
          backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
          selectedItemColor: AppColors.brandPrimary,
          unselectedItemColor: secondaryTextColor,
          selectedLabelStyle: AppTypography.caption(fontWeight: FontWeight.w600),
          unselectedLabelStyle: AppTypography.caption(),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_outlined),
              activeIcon: Icon(Icons.dashboard_rounded),
              label: "Dashboard",
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.leaderboard_outlined),
              activeIcon: Icon(Icons.leaderboard_rounded),
              label: "Leads",
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.people_alt_outlined),
              activeIcon: Icon(Icons.people_alt_rounded),
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
            BottomNavigationBarItem(
              icon: Icon(Icons.settings_outlined),
              activeIcon: Icon(Icons.settings_rounded),
              label: "Settings",
            ),
          ],
        ),
      ),
    );
  }
}
