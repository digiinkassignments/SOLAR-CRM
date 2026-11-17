import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../models/profile_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/settings_provider.dart';
import '../auth/login_screen.dart';
import '../widgets/logout_dialog.dart';

class SettingsView extends StatefulWidget {
  const SettingsView({super.key});

  @override
  State<SettingsView> createState() => _SettingsViewState();
}

class _SettingsViewState extends State<SettingsView> with SingleTickerProviderStateMixin {
  int _activeTab = 0; // 0: Profile Info, 1: Security, 2: Timeline, 3: Company Settings

  // Basic Info Form
  bool _isEditingBasicInfo = false;
  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  // Password Form
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _showCurrentPassword = false;
  bool _showNewPassword = false;
  bool _showConfirmPassword = false;
  final _passwordFormKey = GlobalKey<FormState>();

  final ImagePicker _imagePicker = ImagePicker();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _loadData() {
    final provider = Provider.of<SettingsProvider>(context, listen: false);
    provider.fetchProfile().then((_) {
      _populateForm(provider.profile);
    });
    provider.fetchCompanySettings();
  }

  void _populateForm(ProfileModel? p) {
    if (p == null) return;
    _nameController.text = p.fullName;
    _usernameController.text = p.username;
    _emailController.text = p.email;
    _phoneController.text = p.phone ?? "";
  }

  Future<void> _pickAndUploadPhoto(ImageSource source) async {
    try {
      final picked = await _imagePicker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );
      if (picked == null) return;

      if (!mounted) return;
      final provider = Provider.of<SettingsProvider>(context, listen: false);
      final res = await provider.uploadProfilePhoto(picked.path);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: res['success'] == true ? AppColors.emeraldGreen : AppColors.errorRed,
          content: Text(res['message']?.toString() ?? "Photo updated"),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.errorRed,
          content: Text("Failed to pick image: $e"),
        ),
      );
    }
  }

  void _showPhotoOptionsDialog() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Row(
                    children: [
                      Text("Change Profile Photo", style: AppTypography.headingSmall()),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, size: 20),
                        onPressed: () => Navigator.of(ctx).pop(),
                      ),
                    ],
                  ),
                ),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.camera_alt_outlined, color: AppColors.brandPrimary),
                  title: const Text("Take Photo with Camera"),
                  onTap: () {
                    Navigator.of(ctx).pop();
                    _pickAndUploadPhoto(ImageSource.camera);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.photo_library_outlined, color: AppColors.brandPrimary),
                  title: const Text("Choose from Gallery"),
                  onTap: () {
                    Navigator.of(ctx).pop();
                    _pickAndUploadPhoto(ImageSource.gallery);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showViewPhotoDialog(String photoUrl) {
    showDialog(
      context: context,
      builder: (ctx) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.all(16),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(16),
                ),
                clipBehavior: Clip.antiAlias,
                child: InteractiveViewer(
                  maxScale: 4.0,
                  child: Image.network(
                    photoUrl,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => const Padding(
                      padding: EdgeInsets.all(40.0),
                      child: Text("Could not load full image", style: TextStyle(color: Colors.white)),
                    ),
                  ),
                ),
              ),
              Positioned(
                top: 10,
                right: 10,
                child: IconButton(
                  style: IconButton.styleFrom(backgroundColor: Colors.black54),
                  icon: const Icon(Icons.close_rounded, color: Colors.white),
                  onPressed: () => Navigator.of(ctx).pop(),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _handleRemovePhoto() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Remove Profile Photo?"),
        content: const Text("Your profile avatar will be reverted to your initials."),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.errorRed),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text("Remove", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    if (!mounted) return;
    final provider = Provider.of<SettingsProvider>(context, listen: false);
    final res = await provider.removeProfilePhoto();

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: res['success'] == true ? AppColors.emeraldGreen : AppColors.errorRed,
        content: Text(res['message']?.toString() ?? "Photo removed"),
      ),
    );
  }

  Future<void> _handleSaveBasicInfo() async {
    if (!_formKey.currentState!.validate()) return;

    final provider = Provider.of<SettingsProvider>(context, listen: false);
    final res = await provider.updateProfile(
      fullName: _nameController.text.trim(),
      username: _usernameController.text.trim(),
      email: _emailController.text.trim(),
      phone: _phoneController.text.trim(),
    );

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: res['success'] == true ? AppColors.emeraldGreen : AppColors.errorRed,
        content: Text(res['message']?.toString() ?? "Profile updated"),
      ),
    );

    if (res['success'] == true) {
      setState(() => _isEditingBasicInfo = false);
    }
  }

  Future<void> _handleUpdatePassword() async {
    if (!_passwordFormKey.currentState!.validate()) return;

    final cur = _currentPasswordController.text;
    final newP = _newPasswordController.text;
    final conf = _confirmPasswordController.text;

    if (newP != conf) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppColors.errorRed,
          content: Text("New password and confirm password do not match"),
        ),
      );
      return;
    }

    final provider = Provider.of<SettingsProvider>(context, listen: false);
    final res = await provider.changePassword(
      currentPassword: cur,
      newPassword: newP,
      confirmPassword: conf,
    );

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: res['success'] == true ? AppColors.emeraldGreen : AppColors.errorRed,
        content: Text(res['message']?.toString() ?? "Password updated"),
      ),
    );

    if (res['success'] == true) {
      _currentPasswordController.clear();
      _newPasswordController.clear();
      _confirmPasswordController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    final settingsProvider = Provider.of<SettingsProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    final profile = settingsProvider.profile;
    final company = settingsProvider.companySettings;

    final String baseApiUrl = settingsProvider.baseApiUrl;
    final String? photoUrl = profile?.getFullImageUrl(baseApiUrl);
    final bool hasPhoto = photoUrl != null && photoUrl.isNotEmpty;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Settings & Profile",
              style: AppTypography.headingSmall(color: textPrimary),
            ),
            Text(
              "Manage account, security, branding & system",
              style: AppTypography.caption(color: textSecondary),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: "Refresh",
            onPressed: _loadData,
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppColors.errorRed, size: 22),
            tooltip: "Logout",
            onPressed: () async {
              final nav = Navigator.of(context);
              final confirmed = await showLogoutConfirmationDialog(context);
              if (!confirmed) return;
              await authProvider.logout();
              nav.pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
          ),
        ],
      ),
      body: settingsProvider.isLoading && profile == null
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async => _loadData(),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 1. HERO PROFILE CARD (Matching https://digiinksolutions.solops.cloud/profile)
                    _buildHeroProfileCard(
                      profile: profile,
                      photoUrl: photoUrl,
                      hasPhoto: hasPhoto,
                      isDark: isDark,
                      cardBg: cardBg,
                      borderColor: borderColor,
                      textPrimary: textPrimary,
                      textSecondary: textSecondary,
                      isUploading: settingsProvider.isUploadingPhoto,
                    ),

                    const SizedBox(height: 16),

                    // 2. TAB SELECTOR CHIPS
                    _buildTabSelector(isDark, borderColor, textPrimary),

                    const SizedBox(height: 16),

                    // 3. TAB CONTENT
                    if (_activeTab == 0)
                      _buildBasicInfoTab(profile, cardBg, borderColor, textPrimary, textSecondary, settingsProvider.isSavingProfile)
                    else if (_activeTab == 1)
                      _buildSecurityTab(cardBg, borderColor, textPrimary, textSecondary, settingsProvider.isChangingPassword)
                    else if (_activeTab == 2)
                      _buildTimelineTab(profile, cardBg, borderColor, textPrimary, textSecondary)
                    else
                      _buildCompanyTab(company, authProvider, cardBg, borderColor, textPrimary, textSecondary),

                    const SizedBox(height: 24),

                    // 4. WORKSPACE & APP INFO FOOTER
                    _buildAppInfoCard(authProvider, isDark, cardBg, borderColor, textPrimary, textSecondary),

                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
    );
  }

  // HERO PROFILE CARD
  Widget _buildHeroProfileCard({
    required ProfileModel? profile,
    required String? photoUrl,
    required bool hasPhoto,
    required bool isDark,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
    required bool isUploading,
  }) {
    final initials = profile?.initials ?? "TS";
    final fullName = profile?.fullName.isNotEmpty == true ? profile!.fullName : "User Profile";
    final username = profile?.username.isNotEmpty == true ? "@${profile!.username}" : "@admin";
    final roleName = profile?.roleName.toUpperCase() ?? "SUPER ADMIN";
    final isActive = profile?.isActive ?? true;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Avatar with Camera Badge
          Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark ? AppColors.darkSurface : AppColors.brandNavy,
                  border: Border.all(color: AppColors.brandPrimary.withValues(alpha: 0.5), width: 3),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.brandPrimary.withValues(alpha: 0.2),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: ClipOval(
                  child: hasPhoto
                      ? Image.network(
                          photoUrl!,
                          width: 96,
                          height: 96,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => Center(
                            child: Text(
                              initials,
                              style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                          ),
                        )
                      : Center(
                          child: Text(
                            initials,
                            style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ),
                ),
              ),
              if (isUploading)
                const Positioned.fill(
                  child: CircleAvatar(
                    backgroundColor: Colors.black45,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                  ),
                ),
              Positioned(
                bottom: 0,
                right: 0,
                child: InkWell(
                  onTap: isUploading ? null : _showPhotoOptionsDialog,
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.all(7),
                    decoration: BoxDecoration(
                      color: AppColors.brandPrimary,
                      shape: BoxShape.circle,
                      border: Border.all(color: cardBg, width: 2),
                    ),
                    child: const Icon(Icons.camera_alt_rounded, size: 16, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          Text(
            fullName,
            style: AppTypography.heading(size: 19, color: textPrimary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 2),
          Text(
            username,
            style: AppTypography.bodySmall(color: textSecondary),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 10),

          // Role and Status Badges
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.brandPrimary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  roleName,
                  style: AppTypography.badge(color: AppColors.brandPrimary),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: (isActive ? AppColors.emeraldGreen : AppColors.errorRed).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  isActive ? "Active Account" : "Inactive",
                  style: AppTypography.badge(color: isActive ? AppColors.emeraldGreen : AppColors.errorRed),
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Photo Action Buttons
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 8,
            runSpacing: 8,
            children: [
              OutlinedButton.icon(
                onPressed: isUploading ? null : _showPhotoOptionsDialog,
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  side: BorderSide(color: AppColors.brandPrimary.withValues(alpha: 0.5)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                icon: const Icon(Icons.upload_rounded, size: 15, color: AppColors.brandPrimary),
                label: Text("Upload Photo", style: AppTypography.caption(color: AppColors.brandPrimary, fontWeight: FontWeight.w600)),
              ),
              if (hasPhoto) ...[
                OutlinedButton.icon(
                  onPressed: () => _showViewPhotoDialog(photoUrl!),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    side: BorderSide(color: borderColor),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  icon: Icon(Icons.visibility_outlined, size: 15, color: textPrimary),
                  label: Text("View Picture", style: AppTypography.caption(color: textPrimary, fontWeight: FontWeight.w600)),
                ),
                OutlinedButton.icon(
                  onPressed: isUploading ? null : _handleRemovePhoto,
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    side: BorderSide(color: AppColors.errorRed.withValues(alpha: 0.5)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  icon: const Icon(Icons.delete_outline_rounded, size: 15, color: AppColors.errorRed),
                  label: Text("Remove", style: AppTypography.caption(color: AppColors.errorRed, fontWeight: FontWeight.w600)),
                ),
              ],
            ],
          ),

          const SizedBox(height: 12),
          const Divider(),
          const SizedBox(height: 8),

          // Contact Strip
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.email_outlined, size: 15, color: AppColors.brandPrimary),
                  const SizedBox(width: 6),
                  Text(
                    profile?.email ?? "support@solarcrm.com",
                    style: AppTypography.caption(color: textPrimary, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
              if (profile?.phone != null && profile!.phone!.isNotEmpty)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.phone_outlined, size: 15, color: AppColors.emeraldGreen),
                    const SizedBox(width: 6),
                    Text(
                      profile.phone!,
                      style: AppTypography.caption(color: textPrimary, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
            ],
          ),
        ],
      ),
    );
  }

  // TAB SELECTOR
  Widget _buildTabSelector(bool isDark, Color borderColor, Color textPrimary) {
    final tabs = [
      {'label': 'Basic Info', 'icon': Icons.person_outline_rounded},
      {'label': 'Security', 'icon': Icons.lock_outline_rounded},
      {'label': 'Timeline', 'icon': Icons.history_rounded},
      {'label': 'Company', 'icon': Icons.business_outlined},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: List.generate(tabs.length, (idx) {
          final isSelected = _activeTab == idx;
          final item = tabs[idx];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              avatar: Icon(
                item['icon'] as IconData,
                size: 16,
                color: isSelected ? Colors.white : AppColors.brandPrimary,
              ),
              label: Text(item['label'] as String),
              selected: isSelected,
              onSelected: (_) => setState(() => _activeTab = idx),
              selectedColor: AppColors.brandPrimary,
              labelStyle: AppTypography.caption(
                color: isSelected ? Colors.white : textPrimary,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              ),
              side: BorderSide(color: isSelected ? AppColors.brandPrimary : borderColor),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          );
        }),
      ),
    );
  }

  // TAB 0: BASIC INFORMATION
  Widget _buildBasicInfoTab(
    ProfileModel? profile,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
    bool isSaving,
  ) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.badge_outlined, color: AppColors.brandPrimary, size: 20),
                    const SizedBox(width: 8),
                    Text("Basic Information", style: AppTypography.headingSmall(color: textPrimary)),
                  ],
                ),
                if (!_isEditingBasicInfo)
                  OutlinedButton.icon(
                    onPressed: () {
                      _populateForm(profile);
                      setState(() => _isEditingBasicInfo = true);
                    },
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.brandPrimary),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    icon: const Icon(Icons.edit_outlined, size: 14, color: AppColors.brandPrimary),
                    label: Text("Edit", style: AppTypography.caption(color: AppColors.brandPrimary, fontWeight: FontWeight.w600)),
                  )
                else
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextButton(
                        onPressed: isSaving
                            ? null
                            : () {
                                _populateForm(profile);
                                setState(() => _isEditingBasicInfo = false);
                              },
                        child: Text("Cancel", style: AppTypography.caption(color: textSecondary)),
                      ),
                      const SizedBox(width: 4),
                      ElevatedButton(
                        onPressed: isSaving ? null : _handleSaveBasicInfo,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.brandPrimary,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: isSaving
                            ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Text("Save", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
              ],
            ),

            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 12),

            // Full Name
            _buildField(
              label: "Full Name",
              controller: _nameController,
              isEditing: _isEditingBasicInfo,
              icon: Icons.person_outline_rounded,
              validator: (v) => v == null || v.trim().isEmpty ? "Full name is required" : null,
            ),

            const SizedBox(height: 12),

            // Username
            _buildField(
              label: "Username",
              controller: _usernameController,
              isEditing: _isEditingBasicInfo,
              icon: Icons.alternate_email_rounded,
              validator: (v) => v == null || v.trim().isEmpty ? "Username is required" : null,
            ),

            const SizedBox(height: 12),

            // Email
            _buildField(
              label: "Email Address",
              controller: _emailController,
              isEditing: _isEditingBasicInfo,
              icon: Icons.email_outlined,
              keyboardType: TextInputType.emailAddress,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return "Email is required";
                if (!v.contains('@')) return "Enter a valid email address";
                return null;
              },
            ),

            const SizedBox(height: 12),

            // Phone
            _buildField(
              label: "Phone Number",
              controller: _phoneController,
              isEditing: _isEditingBasicInfo,
              icon: Icons.phone_outlined,
              keyboardType: TextInputType.phone,
              validator: (v) => v == null || v.trim().isEmpty ? "Phone number is required" : null,
            ),

            const SizedBox(height: 12),

            // Role (Read-only)
            Row(
              children: [
                Expanded(
                  child: _buildReadOnlyField(
                    label: "System Role",
                    value: profile?.roleName.toUpperCase() ?? "SUPER ADMIN",
                    icon: Icons.admin_panel_settings_outlined,
                    accentColor: AppColors.brandPrimary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildReadOnlyField(
                    label: "Account Status",
                    value: (profile?.isActive ?? true) ? "Active" : "Inactive",
                    icon: Icons.check_circle_outline_rounded,
                    accentColor: (profile?.isActive ?? true) ? AppColors.emeraldGreen : AppColors.errorRed,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // TAB 1: SECURITY & PASSWORD
  Widget _buildSecurityTab(
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
    bool isChangingPassword,
  ) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Form(
        key: _passwordFormKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.security_rounded, color: AppColors.brandPrimary, size: 20),
                const SizedBox(width: 8),
                Text("Security & Password", style: AppTypography.headingSmall(color: textPrimary)),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              "Ensure your account is using a long, random password to stay secure.",
              style: AppTypography.caption(color: textSecondary),
            ),

            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 12),

            // Current Password
            TextFormField(
              controller: _currentPasswordController,
              obscureText: !_showCurrentPassword,
              decoration: InputDecoration(
                labelText: "Current Password",
                prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                suffixIcon: IconButton(
                  icon: Icon(_showCurrentPassword ? Icons.visibility_off_rounded : Icons.visibility_rounded, size: 18),
                  onPressed: () => setState(() => _showCurrentPassword = !_showCurrentPassword),
                ),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              validator: (v) => v == null || v.isEmpty ? "Current password is required" : null,
            ),

            const SizedBox(height: 12),

            // New Password
            TextFormField(
              controller: _newPasswordController,
              obscureText: !_showNewPassword,
              decoration: InputDecoration(
                labelText: "New Password",
                prefixIcon: const Icon(Icons.lock_reset_rounded, size: 20),
                suffixIcon: IconButton(
                  icon: Icon(_showNewPassword ? Icons.visibility_off_rounded : Icons.visibility_rounded, size: 18),
                  onPressed: () => setState(() => _showNewPassword = !_showNewPassword),
                ),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return "New password is required";
                if (v.length < 8) return "Password must be at least 8 characters";
                return null;
              },
            ),

            const SizedBox(height: 12),

            // Confirm Password
            TextFormField(
              controller: _confirmPasswordController,
              obscureText: !_showConfirmPassword,
              decoration: InputDecoration(
                labelText: "Confirm New Password",
                prefixIcon: const Icon(Icons.check_circle_outline_rounded, size: 20),
                suffixIcon: IconButton(
                  icon: Icon(_showConfirmPassword ? Icons.visibility_off_rounded : Icons.visibility_rounded, size: 18),
                  onPressed: () => setState(() => _showConfirmPassword = !_showConfirmPassword),
                ),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return "Please confirm password";
                if (v != _newPasswordController.text) return "Passwords do not match";
                return null;
              },
            ),

            const SizedBox(height: 14),

            // Password Policy Hint
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.skyBlue.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.skyBlue.withValues(alpha: 0.2)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline_rounded, color: AppColors.skyBlue, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      "Must contain at least 8 characters, an uppercase letter, a number, and a special character.",
                      style: AppTypography.caption(color: textSecondary),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            SizedBox(
              width: double.infinity,
              height: 44,
              child: ElevatedButton.icon(
                onPressed: isChangingPassword ? null : _handleUpdatePassword,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brandPrimary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                icon: isChangingPassword
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.lock_reset_rounded, color: Colors.white, size: 18),
                label: Text(
                  isChangingPassword ? "Updating..." : "Update Password",
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // TAB 2: ACCOUNT ACTIVITY TIMELINE
  Widget _buildTimelineTab(
    ProfileModel? profile,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final events = [
      {
        'title': 'Account Created',
        'desc': 'Initial profile registration and role assignment.',
        'date': profile?.createdAt != null
            ? "${Formatters.formatDate(profile!.createdAt?.toIso8601String())} • ${Formatters.formatTime(profile.createdAt?.toIso8601String())}"
            : "Initial setup",
        'color': AppColors.brandPrimary,
        'icon': Icons.person_add_alt_1_outlined,
      },
      {
        'title': 'Last Profile Update',
        'desc': 'Contact details and avatar information synced.',
        'date': profile?.updatedAt != null
            ? "${Formatters.formatDate(profile!.updatedAt?.toIso8601String())} • ${Formatters.formatTime(profile.updatedAt?.toIso8601String())}"
            : "Recently updated",
        'color': const Color(0xFFD97706),
        'icon': Icons.update_rounded,
      },
      {
        'title': 'Last Login Session',
        'desc': 'Logged in via authenticated Solar CRM portal.',
        'date': profile?.lastLogin != null
            ? "${Formatters.formatDate(profile!.lastLogin?.toIso8601String())} • ${Formatters.formatTime(profile.lastLogin?.toIso8601String())}"
            : "Active Session",
        'color': AppColors.emeraldGreen,
        'icon': Icons.login_rounded,
      },
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.history_rounded, color: AppColors.brandPrimary, size: 20),
              const SizedBox(width: 8),
              Text("Account Activity Timeline", style: AppTypography.headingSmall(color: textPrimary)),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            "Audit trail of user creation, security, and session logins.",
            style: AppTypography.caption(color: textSecondary),
          ),
          const SizedBox(height: 16),
          const Divider(),
          const SizedBox(height: 12),

          ...List.generate(events.length, (idx) {
            final ev = events[idx];
            final color = ev['color'] as Color;
            final isLast = idx == events.length - 1;

            return IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: color.withValues(alpha: 0.3)),
                        ),
                        child: Icon(ev['icon'] as IconData, size: 18, color: color),
                      ),
                      if (!isLast)
                        Expanded(
                          child: Container(
                            width: 2,
                            color: borderColor,
                            margin: const EdgeInsets.symmetric(vertical: 4),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(bottom: isLast ? 0 : 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                ev['title'] as String,
                                style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w700),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: borderColor.withValues(alpha: 0.5),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  ev['date'] as String,
                                  style: AppTypography.caption(color: textSecondary, fontWeight: FontWeight.w600),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            ev['desc'] as String,
                            style: AppTypography.caption(color: textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  // TAB 3: COMPANY SETTINGS
  Widget _buildCompanyTab(
    dynamic company,
    AuthProvider auth,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final companyName = company?.companyName ?? auth.tenant?.businessName ?? "Solar CRM Partner";
    final email = company?.companyEmail ?? "support@solarcrm.com";
    final phone = company?.companyPhone ?? "+91 98765 43210";
    final address = company?.companyAddress ?? "Corporate Headquarters, Industrial Area, Jaipur, Rajasthan";
    final gst = company?.gstNumber ?? "08AAAAA0000A1Z5";
    final pan = company?.panNumber ?? "AAAAA0000A";
    final bank = company?.bankName ?? "HDFC Bank";
    final acc = company?.accountNumber ?? "••••••••4589";
    final ifsc = company?.ifscCode ?? "HDFC0001234";

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.business_rounded, color: AppColors.brandPrimary, size: 20),
              const SizedBox(width: 8),
              Text("Company & Organization", style: AppTypography.headingSmall(color: textPrimary)),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            "Primary legal entity, tax numbers & bank account for invoice documents.",
            style: AppTypography.caption(color: textSecondary),
          ),
          const SizedBox(height: 16),
          const Divider(),
          const SizedBox(height: 12),

          _buildInfoRow("Business Name", companyName, Icons.corporate_fare_rounded, textPrimary, textSecondary),
          _buildInfoRow("Official Email", email, Icons.email_outlined, textPrimary, textSecondary),
          _buildInfoRow("Helpline Phone", phone, Icons.phone_outlined, textPrimary, textSecondary),
          _buildInfoRow("Registered Address", address, Icons.location_on_outlined, textPrimary, textSecondary),

          const SizedBox(height: 10),
          const Divider(),
          const SizedBox(height: 10),

          Text("Tax & Financial Details", style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w700)),
          const SizedBox(height: 10),

          Row(
            children: [
              Expanded(child: _buildInfoRow("GSTIN Number", gst, Icons.receipt_outlined, textPrimary, textSecondary)),
              const SizedBox(width: 12),
              Expanded(child: _buildInfoRow("PAN Number", pan, Icons.badge_outlined, textPrimary, textSecondary)),
            ],
          ),

          const SizedBox(height: 8),

          Row(
            children: [
              Expanded(child: _buildInfoRow("Bank Name", bank, Icons.account_balance_outlined, textPrimary, textSecondary)),
              const SizedBox(width: 12),
              Expanded(child: _buildInfoRow("Account Number", acc, Icons.credit_card_outlined, textPrimary, textSecondary)),
            ],
          ),

          const SizedBox(height: 8),
          _buildInfoRow("IFSC Code", ifsc, Icons.tag_rounded, textPrimary, textSecondary),
        ],
      ),
    );
  }

  // WORKSPACE & APP INFO FOOTER
  Widget _buildAppInfoCard(
    AuthProvider auth,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.cloud_done_rounded, size: 18, color: AppColors.emeraldGreen),
              const SizedBox(width: 8),
              Text(
                "Connected Workspace: ${auth.workspace?.toUpperCase() ?? 'DIGIINKSOLUTIONS'}",
                style: AppTypography.caption(color: textPrimary, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            "API Server: https://${auth.workspace ?? 'digiinksolutions'}.solops.cloud/api",
            style: AppTypography.caption(color: textSecondary),
          ),
          const SizedBox(height: 4),
          Text(
            "Solar CRM Mobile Application • v2.5.0-production (Build 120)",
            style: AppTypography.caption(color: textSecondary),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
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
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.errorRed,
                side: const BorderSide(color: AppColors.errorRed),
                padding: const EdgeInsets.symmetric(vertical: 10),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              icon: const Icon(Icons.logout_rounded, size: 16),
              label: const Text("Log Out from this Device", style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildField({
    required String label,
    required TextEditingController controller,
    required bool isEditing,
    required IconData icon,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    if (!isEditing) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark ? Colors.white10 : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: AppColors.brandPrimary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: AppTypography.badge(color: Colors.grey)),
                  const SizedBox(height: 2),
                  Text(
                    controller.text.isNotEmpty ? controller.text : "N/A",
                    style: AppTypography.bodySmall(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, size: 20),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
      ),
      validator: validator,
    );
  }

  Widget _buildReadOnlyField({
    required String label,
    required String value,
    required IconData icon,
    required Color accentColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: accentColor.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: accentColor.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: accentColor),
              const SizedBox(width: 4),
              Text(label, style: AppTypography.badge(color: accentColor)),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: AppTypography.bodySmall(fontWeight: FontWeight.w700),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(
    String label,
    String value,
    IconData icon,
    Color textPrimary,
    Color textSecondary,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AppColors.brandPrimary),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: AppTypography.badge(color: textSecondary)),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
