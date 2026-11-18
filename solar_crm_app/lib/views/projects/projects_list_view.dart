import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../models/project_model.dart';
import '../../providers/project_provider.dart';
import 'project_detail_view.dart';
import 'sheets/new_project_sheet.dart';

class ProjectsListView extends StatefulWidget {
  const ProjectsListView({super.key});

  @override
  State<ProjectsListView> createState() => _ProjectsListViewState();
}

class _ProjectsListViewState extends State<ProjectsListView> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedStage = 'All';
  final DateFormat _dateFormat = DateFormat('dd MMM yyyy');

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _loadData() {
    final provider = Provider.of<ProjectProvider>(context, listen: false);
    provider.fetchProjects(
      search: _searchController.text.trim(),
      stage: _selectedStage,
    );
    provider.fetchStats();
  }

  void _makePhoneCall(String phone) async {
    if (phone.isEmpty) return;
    final clean = phone.replaceAll(RegExp(r'[^\d+]'), '');
    final uri = Uri.parse('tel:$clean');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  void _showDeleteDialog(ProjectModel project) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Delete Project?"),
        content: Text(
          "Delete project ${project.projectNumber} for ${project.customerName}? This will archive the project and its records.",
          style: AppTypography.bodySmall(),
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
              final provider = Provider.of<ProjectProvider>(context, listen: false);
              final messenger = ScaffoldMessenger.of(context);
              final nav = Navigator.of(ctx);

              final res = await provider.deleteProject(project.id);
              nav.pop();

              if (res['success'] == true) {
                messenger.showSnackBar(
                  const SnackBar(
                    backgroundColor: AppColors.emeraldGreen,
                    content: Text("Project deleted successfully"),
                  ),
                );
              } else {
                messenger.showSnackBar(
                  SnackBar(
                    backgroundColor: AppColors.errorRed,
                    content: Text(res['message']?.toString() ?? "Failed to delete project"),
                  ),
                );
              }
            },
            child: const Text("Delete Project"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    final provider = Provider.of<ProjectProvider>(context);
    final projects = provider.projects;
    final isLoading = provider.isLoading;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Projects", style: AppTypography.headingSmall()),
            Text("Solar EPC & Installation Delivery", style: AppTypography.caption(color: textSecondary)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadData,
            tooltip: "Refresh Projects",
          ),
          IconButton(
            icon: const Icon(Icons.add_rounded),
            onPressed: () => NewProjectSheet.show(context),
            tooltip: "New Project",
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: null,
        backgroundColor: AppColors.brandPrimary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_rounded),
        label: Text("New Project", style: AppTypography.button()),
        onPressed: () => NewProjectSheet.show(context),
      ),
      body: RefreshIndicator(
        onRefresh: () async => _loadData(),
        child: Column(
          children: [
            // Search Filter
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: "Search customer, phone or project #...",
                  prefixIcon: const Icon(Icons.search_rounded, size: 18),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.close_rounded, size: 16),
                          onPressed: () {
                            _searchController.clear();
                            provider.fetchProjects(stage: _selectedStage);
                          },
                        )
                      : null,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onSubmitted: (_) {
                  provider.fetchProjects(
                    search: _searchController.text.trim(),
                    stage: _selectedStage,
                  );
                },
              ),
            ),

            // Stage Chips Scroll
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              child: Row(
                children: [
                  _buildStageChip("All", "All Stages", provider, textSecondary),
                  ...ProjectModel.stages.map((stg) {
                    final short = ProjectModel.stageConfig[stg]?['step'] != null
                        ? "${ProjectModel.stageConfig[stg]!['step']}. $stg"
                        : stg;
                    return _buildStageChip(stg, short, provider, textSecondary);
                  }),
                ],
              ),
            ),

            // Project Count Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    _selectedStage == "All" ? "Active Projects Workspace" : "Filtered: $_selectedStage",
                    style: AppTypography.caption(color: textSecondary, fontWeight: FontWeight.w700),
                  ),
                  Text(
                    "${provider.totalCount} projects",
                    style: AppTypography.caption(color: AppColors.brandPrimary, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
            ),

            // Projects List
            Expanded(
              child: isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.brandPrimary))
                  : projects.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.solar_power_outlined, size: 48, color: Colors.grey),
                              const SizedBox(height: 12),
                              Text("No matching projects found", style: AppTypography.bodyMedium(color: textSecondary)),
                              const SizedBox(height: 8),
                              ElevatedButton.icon(
                                onPressed: () => NewProjectSheet.show(context),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.brandPrimary,
                                  foregroundColor: Colors.white,
                                ),
                                icon: const Icon(Icons.add_rounded, size: 16),
                                label: const Text("Create Solar Project"),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.only(left: 16, right: 16, top: 6, bottom: 80),
                          itemCount: projects.length,
                          itemBuilder: (ctx, idx) {
                            final item = projects[idx];
                            return _buildProjectCard(item, isDark, cardBg, borderColor, textPrimary, textSecondary);
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStageChip(String stageKey, String label, ProjectProvider provider, Color textSecondary) {
    final isSelected = _selectedStage == stageKey;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) {
          setState(() => _selectedStage = stageKey);
          provider.fetchProjects(
            search: _searchController.text.trim(),
            stage: stageKey,
          );
        },
        selectedColor: AppColors.brandPrimary.withValues(alpha: 0.15),
        labelStyle: AppTypography.caption(
          color: isSelected ? AppColors.brandPrimary : textSecondary,
          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  Widget _buildProjectCard(
    ProjectModel project,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final meta = project.stageMeta;
    final color = meta['color'] as Color;
    final percent = project.progressPercent;

    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ProjectDetailView(projectId: project.id),
          ),
        );
      },
      borderRadius: BorderRadius.circular(14),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
          // Top Row: Project Number & Stage Badge
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: isDark ? Colors.black26 : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: borderColor),
                ),
                child: Text(
                  project.projectNumber,
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.w700,
                    fontSize: 11,
                  ),
                ),
              ),
              const Spacer(),
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(width: 6, height: 6, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          project.stage,
                          style: AppTypography.badge(color: color),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // Customer Name & Site Address
          Text(
            project.customerName,
            style: AppTypography.bodyMedium(color: textPrimary, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 2),
          Row(
            children: [
              const Icon(Icons.location_on_outlined, size: 13, color: Colors.grey),
              const SizedBox(width: 3),
              Expanded(
                child: Text(
                  [project.customerAddress, project.city, project.state].where((s) => s != null && s.isNotEmpty).join(", "),
                  style: AppTypography.caption(color: textSecondary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // 2x2 Specs Grid
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkSurface : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: borderColor.withValues(alpha: 0.5)),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("SYSTEM CAPACITY", style: AppTypography.caption(color: textSecondary)),
                          Text("${project.systemCapacityKw.toStringAsFixed(2)} kW", style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("PROJECT OWNER", style: AppTypography.caption(color: textSecondary)),
                          Text(project.assignedToName ?? "Unassigned", style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("INSTALLATION START", style: AppTypography.caption(color: textSecondary)),
                          Text(
                            project.installationStartDate != null ? _dateFormat.format(project.installationStartDate!) : "Not Scheduled",
                            style: AppTypography.bodySmall(color: textPrimary),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("CUSTOMER PHONE", style: AppTypography.caption(color: textSecondary)),
                          InkWell(
                            onTap: () => _makePhoneCall(project.customerPhone),
                            child: Row(
                              children: [
                                const Icon(Icons.phone_outlined, size: 12, color: AppColors.emeraldGreen),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    project.customerPhone,
                                    style: AppTypography.bodySmall(color: AppColors.emeraldGreen, fontWeight: FontWeight.w600),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 10),

          // Progress Bar (Stage X of 10)
          Row(
            children: [
              Expanded(
                child: Text(
                  "Stage ${project.stageStep} of 10",
                  style: AppTypography.caption(color: textSecondary, fontWeight: FontWeight.w700),
                ),
              ),
              Text(
                "${(percent * 100).toInt()}% of workflow",
                style: AppTypography.caption(color: color, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 4),
          LinearProgressIndicator(
            value: percent,
            backgroundColor: color.withValues(alpha: 0.15),
            valueColor: AlwaysStoppedAnimation<Color>(color),
            borderRadius: BorderRadius.circular(4),
            minHeight: 5,
          ),

          if (project.totalCost > 0) ...[
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "Cost: ${Formatters.formatCurrency(project.totalCost, compact: true)}",
                  style: AppTypography.caption(color: textSecondary),
                ),
                Text(
                  project.balanceAmount == 0
                      ? "100% Paid"
                      : "Due: ${Formatters.formatCurrency(project.balanceAmount, compact: true)}",
                  style: AppTypography.caption(
                    color: project.balanceAmount == 0 ? AppColors.emeraldGreen : AppColors.errorRed,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ],

          const SizedBox(height: 8),
          const Divider(),
          const SizedBox(height: 4),

          // Bottom Bar: Created Date, Delete, Open Project
          Row(
            children: [
              Expanded(
                child: Text(
                  project.createdAt != null ? "Created ${_dateFormat.format(project.createdAt!)}" : "",
                  style: AppTypography.caption(color: textSecondary),
                ),
              ),
              IconButton(
                visualDensity: VisualDensity.compact,
                padding: const EdgeInsets.all(4),
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                icon: const Icon(Icons.delete_outline_rounded, color: AppColors.errorRed, size: 18),
                onPressed: () => _showDeleteDialog(project),
                tooltip: "Delete Project",
              ),
              const SizedBox(width: 6),
              OutlinedButton.icon(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => ProjectDetailView(projectId: project.id),
                    ),
                  );
                },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  side: BorderSide(color: borderColor),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                icon: const Icon(Icons.arrow_forward_rounded, size: 14),
                label: const Text("Open Project", style: TextStyle(fontSize: 12)),
              ),
            ],
          ),
        ],
      ),
    ),
  );
}
}

