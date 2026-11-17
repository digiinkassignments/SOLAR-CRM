import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/constants/api_constants.dart';
import '../../providers/auth_provider.dart';
import 'login_screen.dart';

class WorkspaceScreen extends StatefulWidget {
  const WorkspaceScreen({super.key});

  @override
  State<WorkspaceScreen> createState() => _WorkspaceScreenState();
}

class _WorkspaceScreenState extends State<WorkspaceScreen> {
  final _workspaceController = TextEditingController();
  String _previewUrl = "";

  @override
  void initState() {
    super.initState();
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.workspace != null && auth.workspace!.isNotEmpty) {
      _workspaceController.text = auth.workspace!;
      _updatePreview(auth.workspace!);
    }
  }

  void _updatePreview(String value) {
    setState(() {
      if (value.trim().isEmpty) {
        _previewUrl = "";
      } else {
        _previewUrl = "${value.trim().toLowerCase()}.${ApiConstants.baseDomain}";
      }
    });
  }

  void _onContinue() async {
    final workspace = _workspaceController.text.trim();
    if (workspace.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Please enter your company workspace handle."),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final verified = await auth.verifyAndSetWorkspace(workspace);

    if (!mounted) return;

    if (verified) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(auth.errorMessage ?? "Workspace not found."),
          backgroundColor: AppColors.errorRed,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final secondaryTextColor = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final mutedTextColor = isDark ? AppColors.textMutedDark : AppColors.textMutedLight;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 76,
                    height: 76,
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF161616) : Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: borderColor),
                      boxShadow: [
                        BoxShadow(
                          color: isDark ? Colors.black.withValues(alpha: 0.5) : Colors.black.withValues(alpha: 0.06),
                          blurRadius: 20,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(12),
                    child: Image.asset(
                      'assets/images/logo.png',
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  "Company Workspace",
                  textAlign: TextAlign.center,
                  style: AppTypography.headingLarge(color: primaryTextColor),
                ),
                const SizedBox(height: 8),
                Text(
                  "Enter your organization's domain code to connect to your enterprise CRM.",
                  textAlign: TextAlign.center,
                  style: AppTypography.subtitle(color: secondaryTextColor),
                ),
                const SizedBox(height: 36),

                // Workspace Input Box
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
                        "WORKSPACE HANDLE",
                        style: AppTypography.caption(color: AppColors.brandPrimary),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _workspaceController,
                        style: AppTypography.bodyMedium(color: primaryTextColor),
                        onChanged: _updatePreview,
                        decoration: InputDecoration(
                          hintText: "e.g. amprisiaenergies or digiinksolutions",
                          prefixIcon: const Icon(Icons.business_outlined),
                          suffixText: ".${ApiConstants.baseDomain}",
                          suffixStyle: AppTypography.bodySmall(
                            color: AppColors.brandPrimary,
                          ),
                        ),
                      ),
                      if (_previewUrl.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            const Icon(
                              Icons.check_circle_outline,
                              size: 16,
                              color: AppColors.emeraldGreen,
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                "Connecting to https://$_previewUrl",
                                style: AppTypography.bodySmall(
                                  color: AppColors.emeraldGreen,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: auth.isLoading ? null : _onContinue,
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
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              "Verify & Continue",
                              style: AppTypography.button(),
                            ),
                            const SizedBox(width: 8),
                            const Icon(Icons.arrow_forward_rounded, size: 18),
                          ],
                        ),
                ),

                const SizedBox(height: 32),
                Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.shield_outlined,
                        size: 16,
                        color: mutedTextColor,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        "Protected by Multi-Tenant Enterprise Isolation",
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
