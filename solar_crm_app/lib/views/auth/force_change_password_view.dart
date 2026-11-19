import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../providers/auth_provider.dart';
import '../../providers/settings_provider.dart';
import '../admin/admin_shell.dart';
import '../engineer/engineer_shell.dart';
import '../manager/manager_shell.dart';
import '../sales/sales_shell.dart';
import 'access_denied_screen.dart';
import 'login_screen.dart';

class ForceChangePasswordView extends StatefulWidget {
  const ForceChangePasswordView({super.key});

  @override
  State<ForceChangePasswordView> createState() => _ForceChangePasswordViewState();
}

class _ForceChangePasswordViewState extends State<ForceChangePasswordView> {
  final _formKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    final cur = _currentPasswordController.text;
    final newP = _newPasswordController.text;
    final conf = _confirmPasswordController.text;

    if (newP != conf) {
      setState(() {
        _errorMessage = "New password and confirmation password do not match.";
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final settingsProvider = Provider.of<SettingsProvider>(context, listen: false);
    final auth = Provider.of<AuthProvider>(context, listen: false);

    final res = await settingsProvider.changePassword(
      currentPassword: cur,
      newPassword: newP,
      confirmPassword: conf,
    );

    if (!mounted) return;

    setState(() {
      _isLoading = false;
    });

    if (res['success'] == true) {
      await auth.markPasswordChanged();

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.emeraldGreen,
          content: Text(res['message']?.toString() ?? "Password updated successfully."),
        ),
      );

      final user = auth.user;
      Widget destination;
      if (user != null) {
        if (user.isAdmin) {
          destination = const AdminShell();
        } else if (user.isManager) {
          destination = const ManagerShell();
        } else if (user.isSales) {
          destination = const SalesShell();
        } else if (user.isEngineer) {
          destination = const EngineerShell();
        } else {
          destination = const AccessDeniedScreen();
        }
      } else {
        destination = const LoginScreen();
      }

      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => destination),
        (route) => false,
      );
    } else {
      setState(() {
        _errorMessage = res['message']?.toString() ?? "Failed to update password. Please check your current password.";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? AppColors.darkBackground : AppColors.lightBackground;
    final cardBg = isDark ? const Color(0xFF161616) : Colors.white;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final auth = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Key / Shield icon
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppColors.brandPrimary.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.brandPrimary.withValues(alpha: 0.3),
                        width: 2,
                      ),
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.lock_reset_rounded,
                        size: 38,
                        color: AppColors.brandPrimary,
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  Text(
                    "Password Update Required",
                    style: AppTypography.headingLarge(color: textPrimary),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    "Welcome, ${auth.user?.name ?? 'User'}! For account security, you must update your temporary initial password before continuing.",
                    style: AppTypography.body(color: textSecondary),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),

                  if (_errorMessage != null) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.errorRed.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.errorRed.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, size: 18, color: AppColors.errorRed),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _errorMessage!,
                              style: const TextStyle(fontSize: 12, color: AppColors.errorRed),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Form Container
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: borderColor),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Current Temporary Password",
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: textPrimary,
                          ),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _currentPasswordController,
                          obscureText: _obscureCurrent,
                          decoration: InputDecoration(
                            hintText: "Enter current password",
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscureCurrent ? Icons.visibility_off : Icons.visibility,
                                size: 18,
                              ),
                              onPressed: () => setState(() => _obscureCurrent = !_obscureCurrent),
                            ),
                          ),
                          validator: (val) {
                            if (val == null || val.isEmpty) return "Current password is required";
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),

                        Text(
                          "New Password",
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: textPrimary,
                          ),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _newPasswordController,
                          obscureText: _obscureNew,
                          decoration: InputDecoration(
                            hintText: "At least 6 characters",
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscureNew ? Icons.visibility_off : Icons.visibility,
                                size: 18,
                              ),
                              onPressed: () => setState(() => _obscureNew = !_obscureNew),
                            ),
                          ),
                          validator: (val) {
                            if (val == null || val.length < 6) {
                              return "Password must be at least 6 characters";
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),

                        Text(
                          "Confirm New Password",
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: textPrimary,
                          ),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _confirmPasswordController,
                          obscureText: _obscureConfirm,
                          decoration: InputDecoration(
                            hintText: "Re-enter new password",
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscureConfirm ? Icons.visibility_off : Icons.visibility,
                                size: 18,
                              ),
                              onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                            ),
                          ),
                          validator: (val) {
                            if (val == null || val.isEmpty) {
                              return "Please confirm your new password";
                            }
                            return null;
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Submit Button
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleSubmit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.brandPrimary,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Text(
                              "Set New Password & Continue",
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                            ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Sign Out Button
                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: TextButton(
                      onPressed: () async {
                        await auth.logout();
                        if (context.mounted) {
                          Navigator.pushAndRemoveUntil(
                            context,
                            MaterialPageRoute(builder: (_) => const LoginScreen()),
                            (route) => false,
                          );
                        }
                      },
                      child: Text(
                        "Sign Out",
                        style: TextStyle(color: textSecondary, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
