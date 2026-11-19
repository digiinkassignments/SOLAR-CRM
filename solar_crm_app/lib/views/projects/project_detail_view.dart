import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../models/project_model.dart';
import '../../providers/project_provider.dart';
import 'sheets/change_stage_sheet.dart';
import 'sheets/edit_project_sheet.dart';

class ProjectDetailView extends StatefulWidget {
  final dynamic projectId;

  const ProjectDetailView({super.key, required this.projectId});

  @override
  State<ProjectDetailView> createState() => _ProjectDetailViewState();
}

class _ProjectDetailViewState extends State<ProjectDetailView> {
  static const List<String> _tabs = [
    "Overview & Stages",
    "Stage History",
    "Pre-Install Inspection",
    "Installation Progress",
    "Commissioning",
    "Final Inspection",
    "Customer Handover",
    "Warranty & AMC",
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDetails();
    });
  }

  void _loadDetails() {
    final provider = Provider.of<ProjectProvider>(context, listen: false);
    provider.fetchProjectDetails(widget.projectId);
  }

  Future<void> _makeCall(String phoneNumber) async {
    final cleanPhone = phoneNumber.replaceAll(RegExp(r'[^0-9+]'), '');
    final uri = Uri.parse("tel:$cleanPhone");
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    } catch (_) {}
  }

  Future<void> _quickAdvance(ProjectModel project, String nextStage) async {
    final provider = Provider.of<ProjectProvider>(context, listen: false);
    final res = await provider.updateProjectStage(
      project.id,
      nextStage,
      notes: "Quick advanced to $nextStage",
    );

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? 'Project moved to $nextStage'),
          backgroundColor: res['success'] == true ? AppColors.emeraldGreen : AppColors.errorRed,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _confirmDelete(BuildContext context, ProjectModel project) {
    final scaffoldMessenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Theme.of(context).brightness == Brightness.dark
            ? AppColors.darkSurfaceElevated
            : AppColors.lightSurfaceElevated,
        title: const Text("Delete Project?"),
        content: Text(
          "Are you sure you want to delete project ${project.projectNumber} (${project.customerName})? This action cannot be undone.",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.errorRed,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              Navigator.of(ctx).pop();
              final provider = Provider.of<ProjectProvider>(context, listen: false);
              final res = await provider.deleteProject(project.id);
              if (mounted) {
                scaffoldMessenger.showSnackBar(
                  SnackBar(
                    content: Text(res['message'] ?? 'Project deleted'),
                    backgroundColor: res['success'] == true ? AppColors.emeraldGreen : AppColors.errorRed,
                    behavior: SnackBarBehavior.floating,
                  ),
                );
                if (res['success'] == true) {
                  navigator.pop();
                }
              }
            },
            child: const Text("Delete"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final surfaceBg = isDark ? AppColors.darkSurface : AppColors.lightSurface;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    final provider = Provider.of<ProjectProvider>(context);
    final project = provider.selectedProject;
    final isLoading = provider.isLoadingDetails;
    final error = provider.detailsError;

    return DefaultTabController(
      length: _tabs.length,
      child: Scaffold(
        backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
        appBar: AppBar(
          elevation: 0,
          scrolledUnderElevation: 0,
          backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
          leading: IconButton(
            icon: Icon(Icons.arrow_back_rounded, color: textPrimary),
            onPressed: () => Navigator.of(context).pop(),
            tooltip: "Back to Projects",
          ),
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                project?.customerName ?? "Project Details",
                style: AppTypography.headingSmall(color: textPrimary),
                overflow: TextOverflow.ellipsis,
              ),
              if (project != null)
                Text(
                  project.projectNumber,
                  style: TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: textSecondary,
                  ),
                ),
            ],
          ),
          actions: [
            IconButton(
              icon: Icon(Icons.refresh_rounded, color: textPrimary),
              tooltip: "Refresh",
              onPressed: _loadDetails,
            ),
            if (project != null) ...[
              IconButton(
                icon: Icon(Icons.edit_outlined, size: 20, color: textPrimary),
                tooltip: "Edit details",
                onPressed: () => EditProjectSheet.show(context, project),
              ),
              IconButton(
                icon: const Icon(Icons.swap_horiz_rounded, size: 22, color: AppColors.brandPrimary),
                tooltip: "Change stage",
                onPressed: () => ChangeStageSheet.show(context, project),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline_rounded, size: 20, color: AppColors.errorRed),
                tooltip: "Delete project",
                onPressed: () => _confirmDelete(context, project),
              ),
            ],
          ],
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(44),
            child: Container(
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkBackground : AppColors.lightBackground,
                border: Border(
                  bottom: BorderSide(color: borderColor),
                ),
              ),
              child: TabBar(
                isScrollable: true,
                indicatorColor: AppColors.brandPrimary,
                indicatorSize: TabBarIndicatorSize.label,
                indicatorWeight: 3,
                labelColor: AppColors.brandPrimary,
                unselectedLabelColor: textSecondary,
                labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                unselectedLabelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                tabs: _tabs.map((t) => Tab(text: t)).toList(),
              ),
            ),
          ),
        ),
        body: isLoading
            ? const Center(child: CircularProgressIndicator(color: AppColors.brandPrimary))
            : error != null
                ? _buildErrorState(error)
                : project == null
                    ? _buildNotFoundState()
                    : TabBarView(
                        children: [
                          // Tab 0: Overview & Stages
                          _buildOverviewAndStagesTab(project, isDark, cardBg, surfaceBg, borderColor, textPrimary, textSecondary),

                          // Tab 1: Stage History
                          _buildStageHistoryTab(project, isDark, cardBg, surfaceBg, borderColor, textPrimary, textSecondary),

                          // Tab 2: Pre-Install Inspection
                          _buildStagePlaceholderTab(
                            project: project,
                            title: "Pre-Install Site Inspection",
                            description: "Drone & roof survey, shadow analysis, structure load-bearing and BOM checklist.",
                            icon: Icons.checklist_rounded,
                            accentColor: AppColors.skyBlue,
                            isDark: isDark,
                            cardBg: cardBg,
                            surfaceBg: surfaceBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),

                          // Tab 3: Installation Progress
                          _buildStagePlaceholderTab(
                            project: project,
                            title: "Installation & Execution Progress",
                            description: "Civil structure erection, solar module clamping, inverter wiring & grounding earthing.",
                            icon: Icons.construction_rounded,
                            accentColor: AppColors.brandPrimary,
                            isDark: isDark,
                            cardBg: cardBg,
                            surfaceBg: surfaceBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),

                          // Tab 4: Commissioning
                          _buildStagePlaceholderTab(
                            project: project,
                            title: "DISCOM Net-Meter & Commissioning",
                            description: "Bi-directional smart meter sync, grid interconnection approvals & energization certs.",
                            icon: Icons.electric_bolt_rounded,
                            accentColor: AppColors.emeraldGreen,
                            isDark: isDark,
                            cardBg: cardBg,
                            surfaceBg: surfaceBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),

                          // Tab 5: Final Inspection
                          _buildStagePlaceholderTab(
                            project: project,
                            title: "Final QC & Technical Sign-off",
                            description: "Safety audit, IV curve testing, inverter generation validation and safety clearances.",
                            icon: Icons.fact_check_outlined,
                            accentColor: const Color(0xFF0891B2),
                            isDark: isDark,
                            cardBg: cardBg,
                            surfaceBg: surfaceBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),

                          // Tab 6: Customer Handover
                          _buildStagePlaceholderTab(
                            project: project,
                            title: "Customer Handover & Dossier",
                            description: "Handover pack, warranty certificates, OEM serial tags and customer sign-off OTP.",
                            icon: Icons.handshake_outlined,
                            accentColor: AppColors.emeraldGreen,
                            isDark: isDark,
                            cardBg: cardBg,
                            surfaceBg: surfaceBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),

                          // Tab 7: Warranty & AMC
                          _buildStagePlaceholderTab(
                            project: project,
                            title: "Warranty & AMC Maintenance",
                            description: "25-year solar generation performance guarantee, inverter warranty and routine AMC visits.",
                            icon: Icons.verified_outlined,
                            accentColor: const Color(0xFF0D9488),
                            isDark: isDark,
                            cardBg: cardBg,
                            surfaceBg: surfaceBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                        ],
                      ),
      ),
    );
  }

  // ==========================================
  // TOP HEADER CARD (Matches Web with NO OVERFLOW)
  // ==========================================
  Widget _buildTopHeaderCard(
    ProjectModel project,
    bool isDark,
    Color cardBg,
    Color surfaceBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final address = [project.customerAddress, project.city, project.state, project.pincode]
        .where((e) => e != null && e.isNotEmpty)
        .join(", ");

    final progressClamped = project.progressPercent.clamp(0.0, 1.0);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Row 1: Project Number Pill & Stage Badge
          Row(
            children: [
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: surfaceBg,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: borderColor),
                  ),
                  child: Text(
                    project.projectNumber,
                    style: TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: textPrimary,
                      letterSpacing: 0.3,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.brandPrimary.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: AppColors.brandPrimary.withValues(alpha: 0.35)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppColors.brandPrimary, shape: BoxShape.circle)),
                    const SizedBox(width: 5),
                    Text(
                      project.stage,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: AppColors.brandPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Customer Name
          Text(
            project.customerName,
            style: AppTypography.heading(size: 19, color: textPrimary),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),

          // Address
          if (address.isNotEmpty) ...[
            const SizedBox(height: 3),
            Row(
              children: [
                Icon(Icons.location_on_outlined, size: 13, color: textSecondary),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    address,
                    style: TextStyle(fontSize: 11, color: textSecondary),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 12),

          // Full-Width Action Buttons (NEVER OVERFLOWS)
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    side: BorderSide(color: borderColor),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  icon: Icon(Icons.edit_outlined, size: 14, color: textPrimary),
                  label: Text("Edit Details", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: textPrimary)),
                  onPressed: () => EditProjectSheet.show(context, project),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.brandPrimary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  icon: const Icon(Icons.swap_horiz_rounded, size: 16),
                  label: const Text("Change Stage", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                  onPressed: () => ChangeStageSheet.show(context, project),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Divider(height: 1, color: borderColor),
          const SizedBox(height: 10),

          // 2x2 Metric Grid (Clean on Mobile)
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Current milestone", style: TextStyle(fontSize: 10, color: textSecondary)),
                    const SizedBox(height: 2),
                    Text(
                      project.stage,
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: textPrimary),
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(2),
                      child: LinearProgressIndicator(
                        value: progressClamped,
                        minHeight: 4,
                        backgroundColor: surfaceBg,
                        valueColor: const AlwaysStoppedAnimation<Color>(AppColors.brandPrimary),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("System size", style: TextStyle(fontSize: 10, color: textSecondary)),
                    const SizedBox(height: 2),
                    Text(
                      "${project.systemCapacityKw.toStringAsFixed(2)} kW",
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: textPrimary),
                    ),
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
                    Text("Project owner", style: TextStyle(fontSize: 10, color: textSecondary)),
                    const SizedBox(height: 2),
                    Text(
                      project.assignedToName ?? "Unassigned",
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: textPrimary),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Last update", style: TextStyle(fontSize: 10, color: textSecondary)),
                    const SizedBox(height: 2),
                    Text(
                      project.stageUpdatedAt != null
                          ? DateFormat('dd MMM yyyy').format(project.stageUpdatedAt!)
                          : (project.updatedAt != null ? DateFormat('dd MMM yyyy').format(project.updatedAt!) : 'Recent'),
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: textPrimary),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Financial Value Strip (if recorded)
          if (project.totalCost > 0) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: surfaceBg,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: borderColor),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Contract value", style: TextStyle(fontSize: 9, color: textSecondary)),
                        Text(
                          "₹${project.totalCost.toStringAsFixed(0)}",
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: textPrimary),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Amount received", style: TextStyle(fontSize: 9, color: textSecondary)),
                        Text(
                          "₹${project.amountReceived.toStringAsFixed(0)}",
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.emeraldGreen),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Balance due", style: TextStyle(fontSize: 9, color: textSecondary)),
                        Text(
                          "₹${project.balanceAmount.toStringAsFixed(0)}",
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: project.balanceAmount > 0 ? AppColors.errorRed : AppColors.emeraldGreen,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ==========================================
  // TAB 0: OVERVIEW & 10-STAGE PIPELINE (Pure Black & Focused)
  // ==========================================
  Widget _buildOverviewAndStagesTab(
    ProjectModel project,
    bool isDark,
    Color cardBg,
    Color surfaceBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final currentStageIndex = ProjectModel.stages.indexOf(project.stage);
    final progressPct = (project.progressPercent.clamp(0.0, 1.0) * 100).round();
    final address = [project.customerAddress, project.city, project.state, project.pincode]
        .where((e) => e != null && e.isNotEmpty)
        .join(", ");

    return RefreshIndicator(
      onRefresh: () async => _loadDetails(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          // 1. TOP HEADER SUMMARY CARD
          _buildTopHeaderCard(project, isDark, cardBg, surfaceBg, borderColor, textPrimary, textSecondary),

          // 2. DELIVERY MILESTONES (10-STAGE PIPELINE STEPPER)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: borderColor),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Delivery milestones",
                          style: AppTypography.heading(size: 15, color: textPrimary),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          "Track your delivery milestones and approvals",
                          style: TextStyle(fontSize: 11, color: textSecondary),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.brandPrimary.withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: AppColors.brandPrimary.withValues(alpha: 0.3)),
                      ),
                      child: Text(
                        "$progressPct% done",
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: AppColors.brandPrimary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Progress Bar
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "Stage ${currentStageIndex >= 0 ? currentStageIndex + 1 : 1} of 10: ${project.stage}",
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: textSecondary),
                    ),
                    Text(
                      "$progressPct% of workflow",
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.brandPrimary),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: project.progressPercent.clamp(0.0, 1.0),
                    minHeight: 6,
                    backgroundColor: surfaceBg,
                    valueColor: const AlwaysStoppedAnimation<Color>(AppColors.brandPrimary),
                  ),
                ),
                const SizedBox(height: 14),

                // 10 Sequential Milestones Cards (Pure Black Palette)
                ...ProjectModel.stages.asMap().entries.map((entry) {
                  final index = entry.key;
                  final stageName = entry.value;
                  final isCompleted = currentStageIndex >= 0 && index < currentStageIndex;
                  final isCurrent = index == currentStageIndex;
                  final meta = ProjectModel.stageConfig[stageName] ?? {};
                  final nextStageCandidate = index + 1 < ProjectModel.stages.length
                      ? ProjectModel.stages[index + 1]
                      : null;

                  final matchingLog = project.stageLogs.cast<ProjectStageLogModel?>().firstWhere(
                    (l) => l?.toStage == stageName,
                    orElse: () => null,
                  );

                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isCurrent
                          ? (isDark ? AppColors.brandPrimary.withValues(alpha: 0.12) : const Color(0xFFFFFBEB))
                          : isCompleted
                              ? (isDark ? AppColors.emeraldGreen.withValues(alpha: 0.08) : const Color(0xFFF0FDF4))
                              : surfaceBg,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isCurrent
                            ? AppColors.brandPrimary
                            : isCompleted
                                ? (isDark ? AppColors.emeraldGreen.withValues(alpha: 0.35) : const Color(0xFFBBF7D0))
                                : borderColor,
                        width: isCurrent ? 1.5 : 1,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            // Status Icon
                            if (isCompleted)
                              const Icon(Icons.check_circle_rounded, size: 18, color: AppColors.emeraldGreen)
                            else if (isCurrent)
                              const Icon(Icons.radio_button_checked_rounded, size: 18, color: AppColors.brandPrimary)
                            else
                              Icon(Icons.radio_button_unchecked_rounded, size: 18, color: textSecondary),
                            const SizedBox(width: 8),

                            // Stage Title
                            Expanded(
                              child: Text(
                                "${index + 1}. $stageName",
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: isCurrent ? FontWeight.w800 : (isCompleted ? FontWeight.w700 : FontWeight.w600),
                                  color: isCurrent
                                      ? AppColors.brandPrimary
                                      : isCompleted
                                          ? AppColors.emeraldGreen
                                          : textPrimary,
                                ),
                              ),
                            ),

                            // Badge for Current
                            if (isCurrent)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.brandPrimary,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  "CURRENT ACTIVE STAGE",
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white,
                                    letterSpacing: 0.3,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 4),

                        // Description
                        Padding(
                          padding: const EdgeInsets.only(left: 26),
                          child: Text(
                            meta['description']?.toString() ?? '',
                            style: TextStyle(fontSize: 11, color: textSecondary),
                          ),
                        ),

                        // Timestamp if completed
                        if (isCompleted && matchingLog?.createdAt != null) ...[
                          const SizedBox(height: 3),
                          Padding(
                            padding: const EdgeInsets.only(left: 26),
                            child: Text(
                              "Completed on ${DateFormat('dd MMM yyyy, hh:mm a').format(matchingLog!.createdAt!)}",
                              style: const TextStyle(fontSize: 10, color: AppColors.emeraldGreen, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],

                        // 1-Click Advance Button on Active Stage
                        if (isCurrent && nextStageCandidate != null) ...[
                          const SizedBox(height: 10),
                          Padding(
                            padding: const EdgeInsets.only(left: 26),
                            child: ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.brandPrimary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                minimumSize: Size.zero,
                                elevation: 0,
                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                              ),
                              icon: const Icon(Icons.arrow_forward_rounded, size: 14),
                              label: Text(
                                "Advance to: $nextStageCandidate",
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                              ),
                              onPressed: () => _quickAdvance(project, nextStageCandidate),
                            ),
                          ),
                        ],
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // 3. CUSTOMER & SITE PROFILE CARD
          _buildSectionCard(
            title: "CUSTOMER & SITE PROFILE",
            cardBg: cardBg,
            borderColor: borderColor,
            textPrimary: textPrimary,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Customer Name", style: TextStyle(fontSize: 11, color: textSecondary)),
                        const SizedBox(height: 2),
                        Text(
                          project.customerName,
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: textPrimary),
                        ),
                      ],
                    ),
                  ),
                  InkWell(
                    onTap: () => _makeCall(project.customerPhone),
                    borderRadius: BorderRadius.circular(6),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.phone_outlined, size: 14, color: AppColors.brandPrimary),
                          const SizedBox(width: 4),
                          Text(
                            project.customerPhone,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.brandPrimary,
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Installation Site Location", style: TextStyle(fontSize: 11, color: textSecondary)),
                  const SizedBox(height: 4),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.location_on_outlined, size: 16, color: textSecondary),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          address.isNotEmpty ? address : "Site address not specified",
                          style: TextStyle(fontSize: 13, color: textPrimary, height: 1.3),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),

          // 4. SOLAR TECHNICAL SPECIFICATIONS
          _buildSectionCard(
            title: "SOLAR TECHNICAL SPECIFICATIONS",
            cardBg: cardBg,
            borderColor: borderColor,
            textPrimary: textPrimary,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("System Capacity", style: TextStyle(fontSize: 11, color: textSecondary)),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.solar_power_outlined, size: 18, color: AppColors.brandPrimary),
                            const SizedBox(width: 6),
                            Text(
                              "${project.systemCapacityKw.toStringAsFixed(2)} kW",
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: textPrimary),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Solar Modules", style: TextStyle(fontSize: 11, color: textSecondary)),
                        const SizedBox(height: 4),
                        Text(
                          project.panelCount != null && project.panelCount! > 0
                              ? "${project.panelCount} Panels"
                              : "Standard Array",
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: textPrimary),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Grid Inverter", style: TextStyle(fontSize: 11, color: textSecondary)),
                        const SizedBox(height: 4),
                        Text(
                          project.inverterKw != null && project.inverterKw! > 0
                              ? "${project.inverterKw} kW Smart"
                              : "Grid-Tied",
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: textPrimary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),

          // 5. PROJECT EXECUTION SCHEDULE
          _buildSectionCard(
            title: "PROJECT EXECUTION SCHEDULE",
            cardBg: cardBg,
            borderColor: borderColor,
            textPrimary: textPrimary,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Installation Start", style: TextStyle(fontSize: 11, color: textSecondary)),
                        const SizedBox(height: 4),
                        Text(
                          project.installationStartDate != null
                            ? DateFormat('dd/MM/yyyy').format(project.installationStartDate!)
                            : "—",
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: textPrimary),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Target Completion", style: TextStyle(fontSize: 11, color: textSecondary)),
                        const SizedBox(height: 4),
                        Text(
                          project.installationEndDate != null
                            ? DateFormat('dd/MM/yyyy').format(project.installationEndDate!)
                            : "—",
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: textPrimary),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Actual Handover", style: TextStyle(fontSize: 11, color: textSecondary)),
                        const SizedBox(height: 4),
                        Text(
                          project.completionDate != null
                            ? DateFormat('dd/MM/yyyy').format(project.completionDate!)
                            : "—",
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: project.completionDate != null ? AppColors.emeraldGreen : textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),

          // 6. PROJECT NOTES
          _buildSectionCard(
            title: "PROJECT NOTES",
            cardBg: cardBg,
            borderColor: borderColor,
            textPrimary: textPrimary,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: surfaceBg,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: borderColor),
                ),
                child: Text(
                  (project.notes != null && project.notes!.trim().isNotEmpty)
                      ? project.notes!
                      : "NIL NIL",
                  style: TextStyle(fontSize: 12, color: textSecondary, height: 1.4),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ==========================================
  // TOP METRICS BANNER (Shared across tabs)
  // ==========================================
  Widget _buildTopMetricsBanner(
    ProjectModel project,
    bool isDark,
    Color cardBg,
    Color surfaceBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final progressClamped = project.progressPercent.clamp(0.0, 1.0);
    final lastUpdateStr = project.stageUpdatedAt != null
        ? DateFormat('dd MMM yyyy').format(project.stageUpdatedAt!)
        : (project.createdAt != null
            ? DateFormat('dd MMM yyyy').format(project.createdAt!)
            : '—');

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Current milestone",
                      style: TextStyle(fontSize: 10, color: textSecondary),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      project.stage,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 5),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(2),
                      child: LinearProgressIndicator(
                        value: progressClamped,
                        minHeight: 4,
                        backgroundColor: surfaceBg,
                        valueColor: const AlwaysStoppedAnimation<Color>(
                          AppColors.brandPrimary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "System size",
                      style: TextStyle(fontSize: 10, color: textSecondary),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      "${project.systemCapacityKw.toStringAsFixed(2)} kW",
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Project owner",
                      style: TextStyle(fontSize: 10, color: textSecondary),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      project.assignedToName?.isNotEmpty == true
                          ? project.assignedToName!
                          : "Unassigned",
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Last stage update",
                      style: TextStyle(fontSize: 10, color: textSecondary),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      lastUpdateStr,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ==========================================
  // TAB 1: STAGE HISTORY (AUDIT TRAIL)
  // ==========================================
  Widget _buildStageHistoryTab(
    ProjectModel project,
    bool isDark,
    Color cardBg,
    Color surfaceBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final logs = project.stageLogs;

    String formatDateTime(DateTime? dt) {
      if (dt == null) return "—";
      final datePart = DateFormat("d MMM yyyy").format(dt);
      final timePart = DateFormat("h:mm a").format(dt).toLowerCase();
      return "$datePart, $timePart";
    }

    return RefreshIndicator(
      onRefresh: () async => _loadDetails(),
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // 1. Top Metrics Banner (Current milestone, System size, Project owner, Last stage update)
          _buildTopMetricsBanner(
            project,
            isDark,
            cardBg,
            surfaceBg,
            borderColor,
            textPrimary,
            textSecondary,
          ),

          // 2. Stage Transition Audit Trail Card
          Container(
            padding: const EdgeInsets.all(16),
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
                      "Stage Transition Audit Trail",
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: textPrimary,
                        letterSpacing: -0.2,
                      ),
                    ),
                    if (logs.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFF2563EB).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: const Color(0xFF2563EB).withValues(alpha: 0.3),
                          ),
                        ),
                        child: Text(
                          "${logs.length} ${logs.length == 1 ? 'event' : 'events'}",
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF2563EB),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 14),

                if (logs.isEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 16),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF161616) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: borderColor),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          Icons.history_toggle_off_rounded,
                          size: 32,
                          color: textSecondary.withValues(alpha: 0.6),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          "No stage changes logged yet.",
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: textSecondary,
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  ...logs.map((log) {
                    final itemBg = isDark ? const Color(0xFF161616) : const Color(0xFFF8FAFC);
                    final formattedDate = formatDateTime(log.createdAt);
                    final userName = (log.changedByName != null && log.changedByName!.trim().isNotEmpty)
                        ? log.changedByName!.trim()
                        : "System";

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: itemBg,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: borderColor),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Top row: Stage Name (blue #2563EB) & Timestamp
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: RichText(
                                  text: TextSpan(
                                    children: [
                                      if (log.fromStage != null && log.fromStage!.trim().isNotEmpty) ...[
                                        TextSpan(
                                          text: "${log.fromStage!.trim()} → ",
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w700,
                                            color: textPrimary,
                                          ),
                                        ),
                                      ],
                                      TextSpan(
                                        text: log.toStage.isNotEmpty ? log.toStage : project.stage,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                          color: Color(0xFF2563EB),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                formattedDate,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  color: textSecondary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),

                          // Changed by: Name
                          RichText(
                            text: TextSpan(
                              children: [
                                TextSpan(
                                  text: "Changed by: ",
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: textSecondary,
                                  ),
                                ),
                                TextSpan(
                                  text: userName,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: textPrimary,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Notes
                          if (log.notes != null && log.notes!.trim().isNotEmpty) ...[
                            const SizedBox(height: 6),
                            Text(
                              "“${log.notes!.trim()}”",
                              style: TextStyle(
                                fontSize: 12,
                                fontStyle: FontStyle.italic,
                                color: textPrimary,
                                height: 1.35,
                              ),
                            ),
                          ],
                        ],
                      ),
                    );
                  }),

                const SizedBox(height: 6),
                // Action to update stage directly
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      side: BorderSide(color: borderColor),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    icon: const Icon(
                      Icons.swap_horiz_rounded,
                      size: 16,
                      color: AppColors.brandPrimary,
                    ),
                    label: Text(
                      "Update Project Stage",
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: textPrimary,
                      ),
                    ),
                    onPressed: () => ChangeStageSheet.show(context, project),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // TABS 2-7: MODULE PLACEHOLDER WORKSPACES
  // ==========================================
  Widget _buildStagePlaceholderTab({
    required ProjectModel project,
    required String title,
    required String description,
    required IconData icon,
    required Color accentColor,
    required bool isDark,
    required Color cardBg,
    required Color surfaceBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
  }) {
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        _buildTopMetricsBanner(
          project,
          isDark,
          cardBg,
          surfaceBg,
          borderColor,
          textPrimary,
          textSecondary,
        ),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: borderColor),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, size: 36, color: accentColor),
              ),
              const SizedBox(height: 16),
              Text(
                title,
                textAlign: TextAlign.center,
                style: AppTypography.heading(size: 16, color: textPrimary),
              ),
              const SizedBox(height: 8),
              Text(
                description,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: textSecondary, height: 1.4),
              ),
              const SizedBox(height: 18),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: surfaceBg,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  "Workflows & Evidence Uploads synced with Web CRM",
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: textSecondary),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSectionCard({
    required String title,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: AppColors.brandPrimary,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 10),
          ...children,
        ],
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.errorRed),
            const SizedBox(height: 12),
            Text("Failed to load project details", style: AppTypography.heading(size: 16)),
            const SizedBox(height: 6),
            Text(error, textAlign: TextAlign.center, style: AppTypography.caption()),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadDetails,
              child: const Text("Retry"),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotFoundState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.search_off_rounded, size: 48, color: Colors.grey),
            const SizedBox(height: 12),
            Text("Project Not Found", style: AppTypography.heading(size: 16)),
            const SizedBox(height: 6),
            Text(
              "The requested project could not be found or has been removed.",
              textAlign: TextAlign.center,
              style: AppTypography.caption(),
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text("Back to Projects"),
            ),
          ],
        ),
      ),
    );
  }
}
