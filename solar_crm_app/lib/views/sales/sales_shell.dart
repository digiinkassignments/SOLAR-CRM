import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../providers/auth_provider.dart';
import '../auth/login_screen.dart';
import '../widgets/logout_dialog.dart';

class SalesShell extends StatefulWidget {
  const SalesShell({super.key});

  @override
  State<SalesShell> createState() => _SalesShellState();
}

class _SalesShellState extends State<SalesShell> {
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
              user?.name ?? "Sales Workspace",
              style: AppTypography.headingSmall(color: primaryTextColor),
            ),
            Text(
              "SALES EXECUTIVE • ${auth.workspace?.toUpperCase()}",
              style: AppTypography.badge(color: AppColors.brandPrimary),
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
                  Icons.phone_in_talk_rounded,
                  size: 48,
                  color: AppColors.brandPrimary,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                "Sales Execution Ready",
                style: AppTypography.headingMedium(color: primaryTextColor),
              ),
              const SizedBox(height: 8),
              Text(
                "Today's Calling Queue & AI Copilot ready for live API integration.",
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
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.call_outlined),
            activeIcon: Icon(Icons.call),
            label: "Calling Queue",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people_outline),
            activeIcon: Icon(Icons.people),
            label: "All Leads",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calculate_outlined),
            activeIcon: Icon(Icons.calculate),
            label: "Solar Calc",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.auto_awesome_outlined),
            activeIcon: Icon(Icons.auto_awesome),
            label: "AI Copilot",
          ),
        ],
      ),
    );
  }
}
