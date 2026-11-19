import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/storage/storage_service.dart';
import '../../providers/auth_provider.dart';
import 'workspace_screen.dart';
import 'forgot_password_sheet.dart';
import 'access_denied_screen.dart';
import 'force_change_password_view.dart';
import '../sales/sales_shell.dart';
import '../engineer/engineer_shell.dart';
import '../manager/manager_shell.dart';
import '../admin/admin_shell.dart';
import '../finance/finance_shell.dart';
import '../applications/application_manager_shell.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _keepSignedIn = true;
  String? _localError;

  @override
  void initState() {
    super.initState();
    _loadSavedLogin();
  }

  void _loadSavedLogin() async {
    final saved = await StorageService.getSavedLoginIdentifier();
    if (saved != null && saved.isNotEmpty) {
      setState(() {
        _usernameController.text = saved;
        _keepSignedIn = true;
      });
    }
  }

  void _handleLogin() async {
    final username = _usernameController.text.trim();
    final password = _passwordController.text;

    if (username.isEmpty || password.isEmpty) {
      setState(() {
        _localError = "Please enter both username/email and password.";
      });
      return;
    }

    setState(() {
      _localError = null;
    });

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final success = await auth.login(username, password, rememberMe: _keepSignedIn);

    if (!mounted) return;

    if (success && auth.user != null) {
      final user = auth.user!;
      if (user.isPasswordChanged == 0) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const ForceChangePasswordView()),
          (route) => false,
        );
        return;
      }

      Widget destination;
      if (user.isAdmin) {
        destination = const AdminShell();
      } else if (user.isManager) {
        destination = const ManagerShell();
      } else if (user.isSales) {
        destination = const SalesShell();
      } else if (user.isEngineer) {
        destination = const EngineerShell();
      } else if (user.isFinance) {
        destination = const FinanceShell();
      } else if (user.isApplicationManager) {
        destination = const ApplicationManagerShell();
      } else {
        destination = const AccessDeniedScreen();
      }

      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => destination),
        (route) => false,
      );
    } else {
      setState(() {
        _localError = auth.errorMessage ?? "Invalid username or password.";
      });
    }
  }

  void _openForgotPassword() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).cardTheme.color,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => ForgotPasswordSheet(
        initialLogin: _usernameController.text.trim(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final companyTitle = auth.tenant?.businessName.isNotEmpty == true
        ? auth.tenant!.businessName
        : (auth.workspace?.toUpperCase() ?? "SOLAR CRM");

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final secondaryTextColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final mutedTextColor = isDark ? AppColors.textMutedDark : AppColors.textMutedLight;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          onPressed: () {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (_) => const WorkspaceScreen()),
            );
          },
        ),
        actions: [
          TextButton.icon(
            onPressed: () {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => const WorkspaceScreen()),
              );
            },
            icon: const Icon(Icons.swap_horiz, size: 16, color: AppColors.brandPrimary),
            label: Text(
              "Change Workspace",
              style: AppTypography.bodySmall(color: AppColors.brandPrimary),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 68,
                    height: 68,
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF161616) : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: borderColor),
                    ),
                    padding: const EdgeInsets.all(10),
                    child: Image.asset(
                      'assets/images/logo.png',
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Text(
                  companyTitle,
                  textAlign: TextAlign.center,
                  style: AppTypography.headingMedium(color: primaryTextColor),
                ),
                const SizedBox(height: 4),
                Text(
                  "Enter credentials to access company workspace",
                  textAlign: TextAlign.center,
                  style: AppTypography.bodySmall(color: secondaryTextColor),
                ),
                const SizedBox(height: 24),

                // Error Banner
                if (_localError != null) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: AppColors.errorRed.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.errorRed, width: 0.8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: AppColors.errorRed, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _localError!,
                            style: AppTypography.bodySmall(color: AppColors.errorRed),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Form Container
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: surfaceColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: borderColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Username, Email, or Mobile",
                        style: AppTypography.caption(color: secondaryTextColor),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _usernameController,
                        style: AppTypography.bodyMedium(color: primaryTextColor),
                        decoration: const InputDecoration(
                          hintText: "e.g. namita or user@company.com",
                          prefixIcon: Icon(Icons.person_outline),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            "Password",
                            style: AppTypography.caption(color: secondaryTextColor),
                          ),
                          InkWell(
                            onTap: _openForgotPassword,
                            child: Text(
                              "Forgot password?",
                              style: AppTypography.caption(color: AppColors.brandPrimary),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        style: AppTypography.bodyMedium(color: primaryTextColor),
                        onSubmitted: (_) => _handleLogin(),
                        decoration: InputDecoration(
                          hintText: "Enter password",
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                            ),
                            onPressed: () {
                              setState(() {
                                _obscurePassword = !_obscurePassword;
                              });
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Checkbox(
                            value: _keepSignedIn,
                            activeColor: AppColors.brandPrimary,
                            onChanged: (val) {
                              setState(() {
                                _keepSignedIn = val ?? true;
                              });
                            },
                          ),
                          Text(
                            "Keep me signed in",
                            style: AppTypography.bodySmall(color: secondaryTextColor),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: auth.isLoading ? null : _handleLogin,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: auth.isLoading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : Text(
                          "Authenticate Account",
                          style: AppTypography.button(),
                        ),
                ),

                const SizedBox(height: 24),
                Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.shield_outlined,
                        size: 15,
                        color: mutedTextColor,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        "Protected by Enterprise SSO Policy",
                        style: AppTypography.caption(color: mutedTextColor),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
