import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../models/team_user_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/user_provider.dart';
import '../admin/users/user_details_sheet.dart';
import '../admin/users/widgets/user_card.dart';

class ManagerTeamView extends StatefulWidget {
  const ManagerTeamView({super.key});

  @override
  State<ManagerTeamView> createState() => _ManagerTeamViewState();
}

class _ManagerTeamViewState extends State<ManagerTeamView> {
  final _searchController = TextEditingController();

  final List<String> _roleFilters = [
    "All",
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

  void _openUserDetailsSheet(TeamUserModel user) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => UserDetailsSheet(user: user),
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
      body: RefreshIndicator(
        color: AppColors.skyBlue,
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
                    // Header Banner
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: borderColor),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.skyBlue.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.badge_outlined, color: AppColors.skyBlue, size: 24),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "Team Roster",
                                  style: AppTypography.headingSmall(color: textPrimary),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  "Supervising sales representatives and site engineering staff.",
                                  style: AppTypography.caption(color: textSecondary),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Metrics Row
                    Row(
                      children: [
                        Expanded(
                          child: _buildMetricTile(
                            label: "Total Staff",
                            value: "${userProvider.totalRecords}",
                            icon: Icons.people_outline_rounded,
                            color: AppColors.skyBlue,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _buildMetricTile(
                            label: "Active Field",
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
                      onChanged: _onSearch,
                      style: AppTypography.body(color: textPrimary),
                      decoration: InputDecoration(
                        hintText: "Search team members by name or phone...",
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
                        filled: true,
                        fillColor: cardBg,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: borderColor),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: borderColor),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.skyBlue, width: 1.5),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Role Filters
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
                              backgroundColor: cardBg,
                              selectedColor: AppColors.skyBlue.withValues(alpha: 0.2),
                              labelStyle: TextStyle(
                                fontSize: 12,
                                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                color: isSelected ? AppColors.skyBlue : textSecondary,
                              ),
                              side: BorderSide(
                                color: isSelected ? AppColors.skyBlue : borderColor,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              showCheckmark: false,
                            ),
                          );
                        }).toList(),
                      ),
                    ),

                    const SizedBox(height: 8),

                    // Status Filters
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: _statusFilters.map((st) {
                          final isSelected = userProvider.selectedStatus == st ||
                              (userProvider.selectedStatus.isEmpty && st == "All");
                          return Padding(
                            padding: const EdgeInsets.only(right: 8.0),
                            child: ChoiceChip(
                              label: Text(st),
                              selected: isSelected,
                              onSelected: (_) => _onStatusSelected(st),
                              backgroundColor: cardBg,
                              selectedColor: st == "Active"
                                  ? AppColors.emeraldGreen.withValues(alpha: 0.2)
                                  : (st == "Inactive"
                                      ? AppColors.errorRed.withValues(alpha: 0.2)
                                      : AppColors.skyBlue.withValues(alpha: 0.2)),
                              labelStyle: TextStyle(
                                fontSize: 11,
                                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                color: isSelected
                                    ? (st == "Active"
                                        ? AppColors.emeraldGreen
                                        : (st == "Inactive" ? AppColors.errorRed : AppColors.skyBlue))
                                    : textSecondary,
                              ),
                              side: BorderSide(
                                color: isSelected
                                    ? (st == "Active"
                                        ? AppColors.emeraldGreen
                                        : (st == "Inactive" ? AppColors.errorRed : AppColors.skyBlue))
                                    : borderColor,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              showCheckmark: false,
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Content List
            if (userProvider.isLoading && userProvider.users.isEmpty)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.skyBlue),
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
                        Icon(Icons.people_outline_rounded, size: 48, color: textSecondary),
                        const SizedBox(height: 12),
                        Text(
                          "No team members found",
                          style: AppTypography.headingSmall(color: textPrimary),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "Try adjusting your search or role filters.",
                          style: AppTypography.caption(color: textSecondary),
                          textAlign: TextAlign.center,
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
                        onEdit: (_) {}, // Manager view is supervisory
                        onViewDetails: _openUserDetailsSheet,
                        onToggleStatus: (_) {},
                        onDelete: (_) {},
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
              Text(
                label.toUpperCase(),
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                  color: textSecondary,
                  letterSpacing: 0.5,
                ),
              ),
              Icon(icon, size: 14, color: color),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
