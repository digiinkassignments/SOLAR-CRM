import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../models/team_user_model.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/user_provider.dart';
import 'widgets/user_card.dart';
import 'create_user_sheet.dart';
import 'edit_user_sheet.dart';
import 'user_details_sheet.dart';

class UsersListView extends StatefulWidget {
  const UsersListView({super.key});

  @override
  State<UsersListView> createState() => _UsersListViewState();
}

class _UsersListViewState extends State<UsersListView> {
  final _searchController = TextEditingController();

  final List<String> _roleFilters = [
    "All",
    "Admin",
    "Manager",
    "Sales Representative",
    "Site Engineer",
  ];

  final List<String> _statusFilters = [
    "All",
    "Active",
    "Inactive",
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final userProvider = Provider.of<UserProvider>(context, listen: false);
      userProvider.fetchUsers(isRefresh: true);
      userProvider.fetchRoles();
    });
  }

  void _onSearch(String query) {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    userProvider.fetchUsers(search: query, isRefresh: true);
  }

  void _onRoleSelected(String role) {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    userProvider.fetchUsers(role: role, isRefresh: true);
  }

  void _onStatusSelected(String status) {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    userProvider.fetchUsers(status: status, isRefresh: true);
  }

  void _openCreateUserSheet() async {
    final res = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const CreateUserSheet(),
    );
    if (res == true) {
      if (mounted) {
        Provider.of<UserProvider>(context, listen: false).fetchUsers(isRefresh: true);
      }
    }
  }

  void _openEditUserSheet(TeamUserModel user) async {
    final res = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => EditUserSheet(user: user),
    );
    if (res == true) {
      if (mounted) {
        Provider.of<UserProvider>(context, listen: false).fetchUsers(isRefresh: true);
      }
    }
  }

  void _openUserDetailsSheet(TeamUserModel user) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => UserDetailsSheet(user: user),
    );
  }

  void _confirmToggleStatus(TeamUserModel user) {
    final nextStatus = user.isActive ? "Inactive" : "Active";
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          user.isActive ? "Deactivate Account?" : "Activate Account?",
          style: AppTypography.heading(size: 18),
        ),
        content: Text(
          "Are you sure you want to change ${user.fullName}'s status to $nextStatus?",
          style: AppTypography.body(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: user.isActive ? AppColors.errorRed : AppColors.emeraldGreen,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              final provider = Provider.of<UserProvider>(context, listen: false);
              final res = await provider.toggleUserStatus(user.id, user.status);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(res['message'] ?? "Status updated"),
                    backgroundColor: res['success'] == true ? AppColors.emeraldGreen : AppColors.errorRed,
                  ),
                );
              }
            },
            child: Text("Set $nextStatus"),
          ),
        ],
      ),
    );
  }

  void _confirmDeleteUser(TeamUserModel user) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          "Delete Team Member?",
          style: AppTypography.heading(size: 18, color: AppColors.errorRed),
        ),
        content: Text(
          "Are you sure you want to remove ${user.fullName} (@${user.username})? This user will no longer be able to log in.",
          style: AppTypography.body(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.errorRed,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              final provider = Provider.of<UserProvider>(context, listen: false);
              final res = await provider.deleteUser(user.id);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(res['message'] ?? "User deleted"),
                    backgroundColor: res['success'] == true ? AppColors.emeraldGreen : AppColors.errorRed,
                  ),
                );
              }
            },
            child: const Text("Delete Permanently"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final userProvider = Provider.of<UserProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    final currentUserId = authProvider.user?.id;

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        heroTag: null,
        onPressed: _openCreateUserSheet,
        backgroundColor: AppColors.brandPrimary,
        foregroundColor: Colors.black,
        icon: const Icon(Icons.person_add_alt_1_rounded, size: 20),
        label: Text("Add Member", style: AppTypography.button(color: Colors.black)),
      ),
      body: RefreshIndicator(
        color: AppColors.brandPrimary,
        onRefresh: () async {
          await userProvider.fetchUsers(isRefresh: true);
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Metrics Row
                    Row(
                      children: [
                        Expanded(
                          child: _buildMetricTile(
                            label: "Total Staff",
                            value: "${userProvider.totalRecords}",
                            icon: Icons.people_outline_rounded,
                            color: AppColors.brandPrimary,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _buildMetricTile(
                            label: "Active",
                            value: "${userProvider.activeCount}",
                            icon: Icons.check_circle_outline_rounded,
                            color: AppColors.emeraldGreen,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _buildMetricTile(
                            label: "Inactive",
                            value: "${userProvider.inactiveCount}",
                            icon: Icons.pause_circle_outline_rounded,
                            color: AppColors.errorRed,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Search Box
                    TextField(
                      controller: _searchController,
                      style: AppTypography.body(color: textPrimary),
                      textInputAction: TextInputAction.search,
                      onSubmitted: _onSearch,
                      decoration: InputDecoration(
                        hintText: "Search by name, email, phone...",
                        prefixIcon: const Icon(Icons.search_rounded, size: 20),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear_rounded, size: 18),
                                onPressed: () {
                                  _searchController.clear();
                                  _onSearch("");
                                },
                              )
                            : null,
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Role Filter Chips
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: _roleFilters.map((role) {
                          final isSelected = userProvider.selectedRole == role ||
                              (userProvider.selectedRole.isEmpty && role == "All");

                          return Padding(
                            padding: const EdgeInsets.only(right: 8.0),
                            child: FilterChip(
                              label: Text(role),
                              selected: isSelected,
                              onSelected: (_) => _onRoleSelected(role),
                              selectedColor: AppColors.brandPrimary.withValues(alpha: 0.15),
                              checkmarkColor: AppColors.brandPrimary,
                              labelStyle: AppTypography.caption(
                                color: isSelected ? AppColors.brandPrimary : textSecondary,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              ),
                              backgroundColor: cardBg,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                                side: BorderSide(
                                  color: isSelected ? AppColors.brandPrimary : borderColor,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),

                    const SizedBox(height: 8),

                    // Status Filter Chips
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: _statusFilters.map((st) {
                          final isSelected = userProvider.selectedStatus == st ||
                              (userProvider.selectedStatus.isEmpty && st == "All");

                          return Padding(
                            padding: const EdgeInsets.only(right: 8.0),
                            child: FilterChip(
                              label: Text(st),
                              selected: isSelected,
                              onSelected: (_) => _onStatusSelected(st),
                              selectedColor: st == "Active"
                                  ? AppColors.emeraldGreen.withValues(alpha: 0.15)
                                  : st == "Inactive"
                                      ? AppColors.errorRed.withValues(alpha: 0.15)
                                      : AppColors.brandPrimary.withValues(alpha: 0.15),
                              checkmarkColor: st == "Active"
                                  ? AppColors.emeraldGreen
                                  : st == "Inactive"
                                      ? AppColors.errorRed
                                      : AppColors.brandPrimary,
                              labelStyle: AppTypography.caption(
                                color: isSelected ? textPrimary : textSecondary,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              ),
                              backgroundColor: cardBg,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                                side: BorderSide(
                                  color: isSelected ? AppColors.brandPrimary : borderColor,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),

                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),

            // User List / Loading / Empty
            if (userProvider.isLoading && userProvider.users.isEmpty)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.brandPrimary),
                ),
              )
            else if (userProvider.users.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: cardBg,
                            shape: BoxShape.circle,
                            border: Border.all(color: borderColor),
                          ),
                          child: Icon(Icons.people_outline_rounded, size: 40, color: textSecondary),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          "No team members found",
                          style: AppTypography.heading(size: 18, color: textPrimary),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          "Try adjusting your filters or search terms.",
                          style: AppTypography.caption(color: textSecondary),
                        ),
                        const SizedBox(height: 16),
                        OutlinedButton(
                          onPressed: () {
                            _searchController.clear();
                            userProvider.fetchUsers(search: "", role: "All", status: "All", isRefresh: true);
                          },
                          child: const Text("Reset Filters"),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.only(left: 16, right: 16, bottom: 80),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final user = userProvider.users[index];
                      final isCurrent = currentUserId != null && user.id == currentUserId;

                      return UserCard(
                        user: user,
                        isCurrentUser: isCurrent,
                        onEdit: _openEditUserSheet,
                        onViewDetails: _openUserDetailsSheet,
                        onToggleStatus: _confirmToggleStatus,
                        onDelete: _confirmDeleteUser,
                      );
                    },
                    childCount: userProvider.users.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricTile({
    required String label,
    required String value,
    required IconData icon,
    required Color color,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: AppTypography.caption(color: textSecondary)),
              Icon(icon, color: color, size: 16),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: AppTypography.heading(size: 18, color: textPrimary),
          ),
        ],
      ),
    );
  }
}

