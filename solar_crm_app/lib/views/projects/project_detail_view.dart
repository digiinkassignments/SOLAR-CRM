import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/api_constants.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../models/project_model.dart';
import '../../providers/project_provider.dart';
import 'sheets/change_stage_sheet.dart';
import 'sheets/commissioning_form_sheet.dart';
import 'sheets/customer_handover_form_sheet.dart';
import 'sheets/edit_project_sheet.dart';
import 'sheets/final_inspection_form_sheet.dart';
import 'sheets/log_installation_progress_sheet.dart';
import 'sheets/log_service_visit_sheet.dart';
import 'sheets/review_inspection_sheet.dart';
import 'sheets/warranty_amc_form_sheet.dart';

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
    provider.fetchInspection(widget.projectId);
    provider.fetchInstallationLogs(widget.projectId);
    provider.fetchCommissioning(widget.projectId);
    provider.fetchFinalInspection(widget.projectId);
    provider.fetchCustomerHandover(widget.projectId);
    provider.fetchWarrantyAmc(widget.projectId);
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
                          _buildPreInstallInspectionTab(
                            project,
                            provider,
                            isDark,
                            cardBg,
                            surfaceBg,
                            borderColor,
                            textPrimary,
                            textSecondary,
                          ),

                          // Tab 3: Installation Progress
                          _buildInstallationProgressTab(
                            project,
                            provider,
                            isDark,
                            cardBg,
                            surfaceBg,
                            borderColor,
                            textPrimary,
                            textSecondary,
                          ),

                          // Tab 4: Commissioning
                          _buildCommissioningTab(
                            project,
                            provider,
                            isDark,
                            cardBg,
                            surfaceBg,
                            borderColor,
                            textPrimary,
                            textSecondary,
                          ),

                          // Tab 5: Final Inspection
                          _buildFinalInspectionTab(
                            project,
                            provider,
                            isDark,
                            cardBg,
                            surfaceBg,
                            borderColor,
                            textPrimary,
                            textSecondary,
                          ),

                          // Tab 6: Customer Handover
                          _buildCustomerHandoverTab(
                            project,
                            provider,
                            isDark,
                            cardBg,
                            surfaceBg,
                            borderColor,
                            textPrimary,
                            textSecondary,
                          ),

                          // Tab 7: Warranty & AMC
                          _buildWarrantyAmcTab(
                            project,
                            provider,
                            isDark,
                            cardBg,
                            surfaceBg,
                            borderColor,
                            textPrimary,
                            textSecondary,
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
                              "Completed on ${DateFormat('dd MMM yyyy, h:mm a').format(matchingLog!.createdAt!.toLocal()).toLowerCase()}",
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
    final localStageUpdated = project.stageUpdatedAt?.toLocal();
    final localCreated = project.createdAt?.toLocal();
    final lastUpdateStr = localStageUpdated != null
        ? DateFormat('dd MMM yyyy').format(localStageUpdated)
        : (localCreated != null
            ? DateFormat('dd MMM yyyy').format(localCreated)
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
      final local = dt.toLocal();
      final datePart = DateFormat("d MMM yyyy").format(local);
      final timePart = DateFormat("h:mm a").format(local).toLowerCase();
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
  // TAB 2: PRE-INSTALL INSPECTION (FEASIBILITY)
  // ==========================================
  Widget _buildPreInstallInspectionTab(
    ProjectModel project,
    ProjectProvider provider,
    bool isDark,
    Color cardBg,
    Color surfaceBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final inspection = provider.currentInspection;
    final isLoading = provider.isLoadingInspection;

    String formatCleanDate(DateTime? d) {
      if (d == null) return "—";
      return DateFormat("dd MMM yyyy").format(d.toLocal());
    }

    Color getStatusColor(String status) {
      final s = status.toLowerCase();
      if (s.contains('approved') || s.contains('feasible (recommended)') || s == 'feasible') {
        return AppColors.emeraldGreen;
      }
      if (s.contains('conditional')) {
        return AppColors.brandPrimary;
      }
      if (s.contains('rejected') || s.contains('not feasible')) {
        return AppColors.errorRed;
      }
      return const Color(0xFF64748B);
    }

    Widget renderDetailItem(String label, dynamic value) {
      final valStr = (value != null && value.toString().trim().isNotEmpty) ? value.toString() : "—";
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w700,
              color: textSecondary,
              letterSpacing: 0.3,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            valStr,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: textPrimary,
            ),
          ),
        ],
      );
    }

    return RefreshIndicator(
      onRefresh: () async => _loadDetails(),
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // 1. Top Metrics Banner
          _buildTopMetricsBanner(
            project,
            isDark,
            cardBg,
            surfaceBg,
            borderColor,
            textPrimary,
            textSecondary,
          ),

          if (isLoading)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 40),
              child: Column(
                children: [
                  const CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.brandPrimary),
                  const SizedBox(height: 12),
                  Text(
                    "Loading inspection feasibility data...",
                    style: TextStyle(fontSize: 12, color: textSecondary),
                  ),
                ],
              ),
            )
          else if (inspection == null)
            // Empty State
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: borderColor),
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(
                      color: Color(0xFFEFF6FF),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.checklist_rounded, size: 36, color: Color(0xFF2563EB)),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    "No Pre-Installation Inspection Yet",
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: textPrimary),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    "Verify roof tilt & orientation, shadow-free area, DISCOM sanctioned load, and grid meter phase compatibility before purchasing materials.",
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: textSecondary, height: 1.4),
                  ),
                  const SizedBox(height: 18),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    icon: const Icon(Icons.checklist_rounded, size: 16),
                    label: const Text("Begin Pre-Installation Inspection", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                    onPressed: () => ReviewInspectionSheet.show(context, project: project),
                  ),
                ],
              ),
            )
          else ...[
            // Info Alert Banner if prefilled
            if (inspection.isPrefilled || inspection.id == null)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF0C243B) : const Color(0xFFF0F9FF),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: isDark ? const Color(0xFF0369A1) : const Color(0xFFBAE6FD)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.info_outline_rounded, color: Color(0xFF0284C7), size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: RichText(
                        text: TextSpan(
                          style: TextStyle(fontSize: 11, height: 1.4, color: isDark ? Colors.white : const Color(0xFF0369A1)),
                          children: const [
                            TextSpan(text: "⚡ Pre-filled from Site Survey: ", style: TextStyle(fontWeight: FontWeight.w800)),
                            TextSpan(text: "Technical measurements, roof details, consumer number, and grid phase have been automatically populated from the completed Site Survey so nothing needs to be re-entered. Click "),
                            TextSpan(text: "Review & Save Inspection", style: TextStyle(fontWeight: FontWeight.w800)),
                            TextSpan(text: " to confirm or adjust."),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // Header Action Card
            Container(
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
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF2563EB).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.assignment_turned_in_rounded, size: 22, color: Color(0xFF2563EB)),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "Pre-Installation Technical Feasibility Record",
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: textPrimary),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              "Inspected by ${inspection.inspectorName?.isNotEmpty == true ? inspection.inspectorName : 'N/A'} on ${formatCleanDate(inspection.inspectionDate)}${inspection.gpsCoordinates?.isNotEmpty == true ? ' • GPS: ${inspection.gpsCoordinates}' : ''}",
                              style: TextStyle(fontSize: 10, color: textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: getStatusColor(inspection.overallStatus).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: getStatusColor(inspection.overallStatus).withValues(alpha: 0.3)),
                        ),
                        child: Text(
                          inspection.overallStatus,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: getStatusColor(inspection.overallStatus),
                          ),
                        ),
                      ),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0284C7),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        icon: const Icon(Icons.edit_outlined, size: 14),
                        label: Text(
                          (inspection.isPrefilled && inspection.id == null) ? "Review & Save Inspection" : "Edit Inspection",
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                        ),
                        onPressed: () => ReviewInspectionSheet.show(context, project: project, initialData: inspection),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Section 1: Roof & Solar Geometry
            Container(
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
                    children: [
                      const Icon(Icons.home_repair_service_rounded, size: 18, color: Color(0xFFF59E0B)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          "Section 1: Roof & Solar Geometry",
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: textPrimary),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Divider(height: 1, color: borderColor),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: renderDetailItem("Roof Condition", inspection.roofCondition)),
                      Expanded(child: renderDetailItem("Roof Type", inspection.roofType ?? "RCC Flat Roof")),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: renderDetailItem("Roof Orientation", inspection.roofOrientation)),
                      Expanded(child: renderDetailItem("Tilt Angle", inspection.roofTiltAngle != null ? "${inspection.roofTiltAngle}°" : "—")),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: renderDetailItem("Total Roof Area", inspection.roofAreaSqft != null ? "${inspection.roofAreaSqft!.toStringAsFixed(0)} sqft" : "—")),
                      Expanded(child: renderDetailItem("Shadow-Free Usable Area", inspection.shadowFreeAreaSqft != null ? "${inspection.shadowFreeAreaSqft!.toStringAsFixed(0)} sqft" : "—")),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: renderDetailItem("Roof Age", inspection.roofAgeYears != null ? "${inspection.roofAgeYears} years" : "—")),
                      Expanded(child: renderDetailItem("Structural Concerns", inspection.structuralConcerns?.isNotEmpty == true ? inspection.structuralConcerns : "NIL")),
                    ],
                  ),
                ],
              ),
            ),

            // Section 2: Electrical & DISCOM Grid Connection
            Container(
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
                    children: [
                      const Icon(Icons.electric_bolt_rounded, size: 18, color: Color(0xFFF97316)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          "Section 2: Electrical & DISCOM Grid Connection",
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: textPrimary),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Divider(height: 1, color: borderColor),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: renderDetailItem("Meter Type (Phase)", inspection.meterType ?? "Single Phase")),
                      Expanded(child: renderDetailItem("Sanctioned Load", inspection.sanctionedLoadKw != null ? "${inspection.sanctionedLoadKw} kW" : "—")),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: renderDetailItem("DISCOM Consumer / CA No", inspection.consumerNumber?.isNotEmpty == true ? inspection.consumerNumber : "—")),
                      Expanded(child: renderDetailItem("Existing Running Load", inspection.existingLoadKw != null ? "${inspection.existingLoadKw} kW" : "—")),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: renderDetailItem("Main Panel Capacity", inspection.mainPanelCapacity != null ? "${inspection.mainPanelCapacity} Amps" : "—")),
                      Expanded(child: renderDetailItem("Earthing Available", inspection.earthingAvailable)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  renderDetailItem("Electrical Observations", inspection.electricalIssues?.isNotEmpty == true ? inspection.electricalIssues : "—"),
                ],
              ),
            ),

            // Section 3: Site Conditions & Geolocation
            Container(
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
                    children: [
                      const Icon(Icons.wb_sunny_rounded, size: 18, color: Color(0xFFEAB308)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          "Section 3: Site Conditions & Geolocation",
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: textPrimary),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Divider(height: 1, color: borderColor),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: renderDetailItem("Shading Issues", inspection.shadingIssues)),
                      Expanded(child: renderDetailItem("Shading Source", inspection.shadingSource?.isNotEmpty == true ? inspection.shadingSource : "NIL")),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: renderDetailItem("Water Availability", inspection.waterAvailability)),
                      Expanded(child: renderDetailItem("Site Access", inspection.siteAccess)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  renderDetailItem("GPS Coordinates", inspection.gpsCoordinates?.isNotEmpty == true ? inspection.gpsCoordinates : "—"),
                  const SizedBox(height: 12),
                  renderDetailItem("Additional Challenges", inspection.additionalChallenges?.isNotEmpty == true ? inspection.additionalChallenges : "—"),
                ],
              ),
            ),

            // Section 4: Inspection Decision & Sign-Off
            Container(
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
                    children: [
                      const Icon(Icons.assignment_turned_in_rounded, size: 18, color: Color(0xFF10B981)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          "Section 4: Inspection Decision & Sign-Off",
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: textPrimary),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Divider(height: 1, color: borderColor),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "OVERALL FEASIBILITY STATUS",
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                                color: textSecondary,
                                letterSpacing: 0.3,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: getStatusColor(inspection.overallStatus).withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(color: getStatusColor(inspection.overallStatus).withValues(alpha: 0.3)),
                              ),
                              child: Text(
                                inspection.overallStatus,
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: getStatusColor(inspection.overallStatus),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Expanded(child: renderDetailItem("Lead Inspector Name", inspection.inspectorName?.isNotEmpty == true ? inspection.inspectorName : "—")),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: renderDetailItem("Inspection Date", formatCleanDate(inspection.inspectionDate))),
                      Expanded(child: renderDetailItem("Customer / Rep Sign-Off", inspection.customerSignatureName?.isNotEmpty == true ? inspection.customerSignatureName : "—")),
                    ],
                  ),
                  if (inspection.signatureDate != null) ...[
                    const SizedBox(height: 12),
                    renderDetailItem("Sign-Off Date", formatCleanDate(inspection.signatureDate)),
                  ],
                  if (inspection.signatureData != null && inspection.signatureData!.trim().isNotEmpty) ...[
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF0F291E) : const Color(0xFFF0FDF4),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFF10B981)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  "Customer / Representative Digital Signature",
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? const Color(0xFF34D399) : const Color(0xFF166534),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDCFCE7),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: const Color(0xFF86EFAC)),
                                ),
                                child: const Text(
                                  "✓ Signature Verified",
                                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Color(0xFF16A34A)),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Container(
                            width: double.infinity,
                            height: 70,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFFCBD5E1)),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: inspection.signatureData!.startsWith('data:image')
                                  ? Image.memory(
                                      base64Decode(inspection.signatureData!.split(',').last),
                                      fit: BoxFit.contain,
                                    )
                                  : Image.network(
                                      inspection.signatureData!,
                                      fit: BoxFit.contain,
                                      errorBuilder: (context, error, stackTrace) => const Center(
                                        child: Icon(Icons.broken_image_rounded, color: Colors.grey),
                                      ),
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  renderDetailItem("Technical Remarks & Conditions", inspection.remarks?.isNotEmpty == true ? inspection.remarks : "Auto-prefilled from Site Survey"),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ==========================================
  // TAB 3: INSTALLATION PROGRESS
  // ==========================================
  Widget _buildInstallationProgressTab(
    ProjectModel project,
    ProjectProvider provider,
    bool isDark,
    Color cardBg,
    Color surfaceBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final logs = provider.installationLogs;
    final isLoading = provider.isLoadingInstallationLogs;
    final currentProgress = provider.installationProgressPercent;
    final completedPhases = provider.completedInstallationPhases;

    // Phase configurations matching web
    const phases = [
      {
        'key': 'Structure',
        'label': 'Structure',
        'fullName': 'Mounting Structure & Civil Foundation',
        'target': 20,
        'color': Color(0xFF6366F1),
        'bgLight': Color(0xFFEEF2FF),
        'borderLight': Color(0xFFC7D2FE),
      },
      {
        'key': 'Panels',
        'label': 'Panels',
        'fullName': 'Module Placement & DC Cabling',
        'target': 45,
        'color': Color(0xFFF59E0B),
        'bgLight': Color(0xFFFFFBEB),
        'borderLight': Color(0xFFFDE68A),
      },
      {
        'key': 'Inverter & Electrical',
        'label': 'Inverter & Electrical',
        'fullName': 'Inverter Mounting & AC/DC DBs',
        'target': 70,
        'color': Color(0xFF3B82F6),
        'bgLight': Color(0xFFEFF6FF),
        'borderLight': Color(0xFFBFDBFE),
      },
      {
        'key': 'Earthing & Protection',
        'label': 'Earthing & Protection',
        'fullName': 'Chemical Earthing & Lightning Arrestor',
        'target': 85,
        'color': Color(0xFF8B5CF6),
        'bgLight': Color(0xFFF5F3FF),
        'borderLight': Color(0xFFDDD6FE),
      },
      {
        'key': 'Testing',
        'label': 'Testing',
        'fullName': 'Pre-Commissioning Testing & Polarity',
        'target': 100,
        'color': Color(0xFF10B981),
        'bgLight': Color(0xFFECFDF5),
        'borderLight': Color(0xFFA7F3D0),
      },
    ];

    String formatCleanDate(String? dateStr) {
      if (dateStr == null || dateStr.trim().isEmpty) return "—";
      try {
        final d = DateTime.parse(dateStr.split('T').first);
        return DateFormat("dd MMM yyyy").format(d);
      } catch (_) {
        return dateStr;
      }
    }

    // Auto start date
    final autoStartDate = project.installationStartDate != null
        ? DateFormat('yyyy-MM-dd').format(project.installationStartDate!)
        : (logs.isNotEmpty ? logs.last.logDate : null);

    // Target date & status
    final targetDateStr = project.installationEndDate != null
        ? DateFormat('yyyy-MM-dd').format(project.installationEndDate!)
        : null;

    Map<String, dynamic> getTimelineStatus() {
      if (targetDateStr == null) {
        return {
          'label': 'Date Not Set',
          'color': const Color(0xFF64748B),
          'bg': isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
          'border': const Color(0xFFCBD5E1),
        };
      }
      try {
        final targetDate = DateTime.parse(targetDateStr);
        final now = DateTime.now();
        final today = DateTime(now.year, now.month, now.day);
        final diffDays = today.difference(targetDate).inDays;

        if (currentProgress >= 100) {
          if (diffDays > 0) {
            return {
              'label': 'Delayed by $diffDays ${diffDays == 1 ? "day" : "days"}',
              'color': AppColors.errorRed,
              'bg': isDark ? const Color(0xFF3B1212) : const Color(0xFFFEE2E2),
              'border': const Color(0xFFFCA5A5),
            };
          } else {
            return {
              'label': 'Completed on Time',
              'color': AppColors.emeraldGreen,
              'bg': isDark ? const Color(0xFF0F291E) : const Color(0xFFDCFCE7),
              'border': const Color(0xFF86EFAC),
            };
          }
        }

        if (diffDays > 0) {
          return {
            'label': 'Delayed by $diffDays ${diffDays == 1 ? "day" : "days"}',
            'color': AppColors.errorRed,
            'bg': isDark ? const Color(0xFF3B1212) : const Color(0xFFFEE2E2),
            'border': const Color(0xFFFCA5A5),
          };
        } else if (diffDays == 0) {
          return {
            'label': 'Due Today',
            'color': const Color(0xFFD97706),
            'bg': isDark ? const Color(0xFF332009) : const Color(0xFFFEF3C7),
            'border': const Color(0xFFFCD34D),
          };
        } else {
          final remaining = diffDays.abs();
          return {
            'label': 'On Track ($remaining ${remaining == 1 ? "day" : "days"} left)',
            'color': AppColors.emeraldGreen,
            'bg': isDark ? const Color(0xFF0F291E) : const Color(0xFFDCFCE7),
            'border': const Color(0xFF86EFAC),
          };
        }
      } catch (_) {
        return {
          'label': 'Target: $targetDateStr',
          'color': const Color(0xFF64748B),
          'bg': isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
          'border': const Color(0xFFCBD5E1),
        };
      }
    }

    final timelineInfo = getTimelineStatus();

    return RefreshIndicator(
      onRefresh: () async {
        await provider.fetchInstallationLogs(project.id);
        await provider.fetchProjectDetails(project.id);
      },
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ==========================================
            // 1. TOP HEADER: LIFECYCLE SUMMARY CARD
            // ==========================================
            Container(
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: borderColor),
              ),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.construction_rounded, color: Color(0xFFF59E0B), size: 22),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          "Installation Execution & Daily Site Progress",
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "Track daily field developments, crew attendance, material consumption, and safety adherence.",
                    style: TextStyle(fontSize: 11.5, color: textSecondary, height: 1.3),
                  ),
                  const SizedBox(height: 14),

                  // Dates & Metrics Row
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Start Date
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "START DATE",
                              style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700, color: textSecondary),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Icon(Icons.calendar_today_rounded, size: 12, color: textSecondary),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    formatCleanDate(autoStartDate),
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: textPrimary),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      // Target Completion
                      Expanded(
                        flex: 2,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "TARGET COMPLETION",
                              style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700, color: textSecondary),
                            ),
                            const SizedBox(height: 4),
                            if (targetDateStr != null) ...[
                              Row(
                                children: [
                                  Icon(Icons.calendar_today_rounded, size: 12, color: textSecondary),
                                  const SizedBox(width: 4),
                                  Flexible(
                                    child: Text(
                                      formatCleanDate(targetDateStr),
                                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: textPrimary),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  InkWell(
                                    onTap: () => _showSetTargetDateDialog(context, project, provider, targetDateStr),
                                    borderRadius: BorderRadius.circular(4),
                                    child: const Padding(
                                      padding: EdgeInsets.all(2.0),
                                      child: Icon(Icons.edit_calendar_rounded, size: 15, color: AppColors.brandPrimary),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: timelineInfo['bg'] as Color,
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: (timelineInfo['border'] as Color).withValues(alpha: 0.8)),
                                ),
                                child: Text(
                                  timelineInfo['label'] as String,
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: timelineInfo['color'] as Color,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ] else ...[
                              InkWell(
                                onTap: () => _showSetTargetDateDialog(context, project, provider, null),
                                borderRadius: BorderRadius.circular(6),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: const Color(0xFFBFDBFE)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: const [
                                      Icon(Icons.calendar_month_rounded, size: 12, color: AppColors.brandPrimary),
                                      SizedBox(width: 4),
                                      Text(
                                        "Set Target Date",
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.brandPrimary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),

                      // Field Logs count
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              "FIELD LOGS",
                              style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700, color: textSecondary),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              "${logs.length} Entries",
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: textPrimary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 14),

                  // Progress and Log Today's Work Button
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: surfaceBg,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: borderColor),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "$currentProgress%",
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFFF59E0B),
                                height: 1.0,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              "OVERALL PROGRESS",
                              style: TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w800,
                                color: textSecondary,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                        ElevatedButton.icon(
                          onPressed: () {
                            LogInstallationProgressSheet.show(context, project: project);
                          },
                          icon: const Icon(Icons.add, size: 16),
                          label: const Text(
                            "Log Today's Work",
                            style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF005BAC),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            elevation: 1,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),
                  Divider(height: 1, color: borderColor),
                  const SizedBox(height: 14),

                  // ==========================================
                  // 2. 5-STAGE SOLAR ENGINEERING SEQUENCE
                  // ==========================================
                  Text(
                    "5-STAGE SOLAR ENGINEERING SEQUENCE",
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w800,
                      color: textSecondary,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 10),

                  // List of 5 phases
                  ...List.generate(phases.length, (idx) {
                    final p = phases[idx];
                    final phaseKey = p['key'] as String;
                    final isCompleted = completedPhases.contains(phaseKey);
                    final isCurrent = !isCompleted && completedPhases.length == idx;

                    final pColor = p['color'] as Color;
                    final itemBg = isCompleted
                        ? (isDark ? const Color(0xFF0E281C) : const Color(0xFFECFDF5))
                        : isCurrent
                            ? (isDark ? const Color(0xFF232014) : (p['bgLight'] as Color))
                            : (isDark ? const Color(0xFF141414) : const Color(0xFFF8FAFC));
                    final itemBorder = isCompleted
                        ? (isDark ? const Color(0xFF165335) : const Color(0xFFA7F3D0))
                        : isCurrent
                            ? (isDark ? const Color(0xFF6B4810) : (p['borderLight'] as Color))
                            : borderColor;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: itemBg,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: itemBorder, width: isCurrent ? 1.5 : 1.0),
                      ),
                      child: Row(
                        children: [
                          // Number circle or checkmark
                          Container(
                            width: 26,
                            height: 26,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isCompleted
                                  ? AppColors.emeraldGreen
                                  : isCurrent
                                      ? pColor
                                      : (isDark ? const Color(0xFF2A2A2A) : const Color(0xFFCBD5E1)),
                            ),
                            alignment: Alignment.center,
                            child: isCompleted
                                ? const Icon(Icons.check, size: 16, color: Colors.white)
                                : Text(
                                    "${idx + 1}",
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                          ),
                          const SizedBox(width: 10),

                          // Titles
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        p['label'] as String,
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w800,
                                          color: textPrimary,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    if (isCompleted)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFD1FAE5),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: const Text(
                                          "Completed",
                                          style: TextStyle(
                                            fontSize: 9.5,
                                            fontWeight: FontWeight.w800,
                                            color: Color(0xFF065F46),
                                          ),
                                        ),
                                      )
                                    else if (isCurrent)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: pColor,
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: const Text(
                                          "In Progress",
                                          style: TextStyle(
                                            fontSize: 9.5,
                                            fontWeight: FontWeight.w800,
                                            color: Colors.white,
                                          ),
                                        ),
                                      )
                                    else
                                      Text(
                                        "Pending",
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                          color: textSecondary,
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  p['fullName'] as String,
                                  style: TextStyle(fontSize: 11, color: textSecondary),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // ==========================================
            // 3. DAILY FIELD LOGS & TIMELINE
            // ==========================================
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "Daily Field Logs & Timeline (${logs.length})",
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: textPrimary,
                  ),
                ),
                TextButton.icon(
                  onPressed: () {
                    LogInstallationProgressSheet.show(context, project: project);
                  },
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text(
                    "Add New Entry",
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            if (isLoading)
              Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 36),
                  child: Column(
                    children: [
                      const CircularProgressIndicator(color: AppColors.brandPrimary),
                      const SizedBox(height: 12),
                      Text("Loading site installation logs...", style: TextStyle(color: textSecondary, fontSize: 12)),
                    ],
                  ),
                ),
              )
            else if (logs.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 36),
                decoration: BoxDecoration(
                  color: cardBg,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: borderColor),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
                      ),
                      child: const Icon(Icons.construction_rounded, color: AppColors.brandPrimary, size: 26),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      "No Daily Installation Logs Recorded Yet",
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: textPrimary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      "Record today's structural or electrical milestones, worker headcounts, materials consumed, and site photos.",
                      style: TextStyle(fontSize: 12, color: textSecondary, height: 1.4),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 18),
                    ElevatedButton.icon(
                      onPressed: () {
                        LogInstallationProgressSheet.show(context, project: project);
                      },
                      icon: const Icon(Icons.add, size: 16),
                      label: const Text("Add First Daily Log", style: TextStyle(fontWeight: FontWeight.w800)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF005BAC),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ],
                ),
              )
            else
              ...logs.map((log) {
                final cfg = phases.firstWhere(
                  (p) => p['key'] == log.phase,
                  orElse: () => phases[0],
                );
                final pColor = cfg['color'] as Color;

                return Container(
                  margin: const EdgeInsets.only(bottom: 14),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: borderColor),
                  ),
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header Row
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Wrap(
                              spacing: 6,
                              runSpacing: 6,
                              crossAxisAlignment: WrapCrossAlignment.center,
                              children: [
                                Text(
                                  formatCleanDate(log.logDate),
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                    color: textPrimary,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: isDark ? (cfg['color'] as Color).withValues(alpha: 0.15) : (cfg['bgLight'] as Color),
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(color: pColor.withValues(alpha: 0.4)),
                                  ),
                                  child: Text(
                                    cfg['fullName'] as String,
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      color: pColor,
                                    ),
                                  ),
                                ),
                                if (log.isPhaseCompleted)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: isDark ? const Color(0xFF132D1E) : const Color(0xFFECFDF5),
                                      borderRadius: BorderRadius.circular(4),
                                      border: Border.all(color: const Color(0xFFA7F3D0)),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: const [
                                        Icon(Icons.check_circle, size: 11, color: AppColors.emeraldGreen),
                                        SizedBox(width: 3),
                                        Text(
                                          "Phase Completed",
                                          style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.w700,
                                            color: AppColors.emeraldGreen,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF332009) : const Color(0xFFFEF3C7),
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(color: const Color(0xFFFDE68A)),
                                  ),
                                  child: Text(
                                    "Overall: ${log.progressPercent ?? 0}%",
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFFB45309),
                                    ),
                                  ),
                                ),
                                if (log.weather != null && log.weather!.isNotEmpty)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: isDark ? const Color(0xFF1A1A1A) : const Color(0xFFF8FAFC),
                                      borderRadius: BorderRadius.circular(4),
                                      border: Border.all(color: borderColor),
                                    ),
                                    child: Text(
                                      log.weather!,
                                      style: TextStyle(fontSize: 10, color: textSecondary, fontWeight: FontWeight.w600),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () {
                              LogInstallationProgressSheet.show(
                                context,
                                project: project,
                                existingLog: log,
                              );
                            },
                            icon: const Icon(Icons.edit_outlined, size: 18),
                            color: textSecondary,
                            splashRadius: 18,
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                          ),
                        ],
                      ),

                      const SizedBox(height: 10),

                      // Work Done description
                      if (log.workDone != null && log.workDone!.isNotEmpty)
                        Text(
                          log.workDone!,
                          style: TextStyle(
                            fontSize: 12.5,
                            color: textPrimary,
                            height: 1.5,
                          ),
                        ),

                      // Materials Consumed Box
                      if (log.materialsList.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: surfaceBg,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: borderColor),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.inventory_2_outlined, size: 12, color: textSecondary),
                                  const SizedBox(width: 4),
                                  Text(
                                    "MATERIALS CONSUMED ON SITE",
                                    style: TextStyle(
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.w800,
                                      color: textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Wrap(
                                spacing: 6,
                                runSpacing: 6,
                                children: log.materialsList.map((m) {
                                  return Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: cardBg,
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: borderColor),
                                    ),
                                    child: RichText(
                                      text: TextSpan(
                                        children: [
                                          TextSpan(
                                            text: "${m.quantity} ${m.unit} ",
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w800,
                                              fontSize: 11,
                                              color: AppColors.brandPrimary,
                                            ),
                                          ),
                                          TextSpan(
                                            text: m.item,
                                            style: TextStyle(
                                              fontWeight: FontWeight.w600,
                                              fontSize: 11,
                                              color: textPrimary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                            ],
                          ),
                        ),
                      ],

                      // Field Personnel & Verification
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        decoration: BoxDecoration(
                          color: surfaceBg,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: borderColor),
                        ),
                        child: Wrap(
                          spacing: 12,
                          runSpacing: 6,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            if (log.supervisorName != null && log.supervisorName!.isNotEmpty)
                              RichText(
                                text: TextSpan(
                                  style: TextStyle(fontSize: 11, color: textSecondary),
                                  children: [
                                    const TextSpan(text: "Supervisor: "),
                                    TextSpan(
                                      text: log.supervisorName!,
                                      style: TextStyle(fontWeight: FontWeight.w700, color: textPrimary),
                                    ),
                                  ],
                                ),
                              ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.people_outline_rounded, size: 13, color: textSecondary),
                                const SizedBox(width: 4),
                                RichText(
                                  text: TextSpan(
                                    style: TextStyle(fontSize: 11, color: textSecondary),
                                    children: [
                                      const TextSpan(text: "Workers: "),
                                      TextSpan(
                                        text: "${log.workersCount ?? 0}",
                                        style: TextStyle(fontWeight: FontWeight.w700, color: textPrimary),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.access_time_rounded, size: 13, color: textSecondary),
                                const SizedBox(width: 4),
                                RichText(
                                  text: TextSpan(
                                    style: TextStyle(fontSize: 11, color: textSecondary),
                                    children: [
                                      const TextSpan(text: "Hours: "),
                                      TextSpan(
                                        text: "${log.hoursWorked ?? 0}h",
                                        style: TextStyle(fontWeight: FontWeight.w700, color: textPrimary),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            if (log.supervisorSignoff)
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: const [
                                  Icon(Icons.verified_rounded, size: 14, color: AppColors.emeraldGreen),
                                  SizedBox(width: 3),
                                  Text(
                                    "Supervisor Verified",
                                    style: TextStyle(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.emeraldGreen,
                                    ),
                                  ),
                                ],
                              ),
                          ],
                        ),
                      ),

                      // Signature preview
                      if (log.signatureData != null && log.signatureData!.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: const Color(0xFFCBD5E1)),
                              ),
                              child: _buildSignatureThumb(log.signatureData!),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: const [
                                      Icon(Icons.check_circle_rounded, size: 12, color: AppColors.emeraldGreen),
                                      SizedBox(width: 3),
                                      Flexible(
                                        child: Text(
                                          "Signature Recorded",
                                          style: TextStyle(
                                            fontSize: 10.5,
                                            fontWeight: FontWeight.w700,
                                            color: AppColors.emeraldGreen,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (log.supervisorSignoffTime != null)
                                    Text(
                                      formatCleanDate(log.supervisorSignoffTime),
                                      style: TextStyle(fontSize: 10, color: textSecondary),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],

                      // Issues Faced
                      if (log.issuesFaced != null && log.issuesFaced!.trim().isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF2E1906) : const Color(0xFFFFFBEB),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isDark ? const Color(0xFF6B4307) : const Color(0xFFFDE68A),
                            ),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.warning_amber_rounded, size: 15, color: Color(0xFFD97706)),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  log.issuesFaced!,
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    color: isDark ? const Color(0xFFFDE68A) : const Color(0xFF92400E),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],

                      // Photos with Tag & Caption + Lightbox Viewer
                      if (log.photos.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Text(
                          "FIELD PHOTOS (${log.photos.length})",
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            color: textSecondary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        SizedBox(
                          height: 110,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: log.photos.length,
                            separatorBuilder: (context, index) => const SizedBox(width: 10),
                            itemBuilder: (ctx, pIdx) {
                              final p = log.photos[pIdx];
                              String fullUrl = p.photoUrl;
                              if (!fullUrl.startsWith('http')) {
                                fullUrl = "https://${ApiConstants.baseDomain}$fullUrl";
                              }
                              return GestureDetector(
                                onTap: () => _showPhotoLightbox(context, fullUrl, p.caption, p.photoTag),
                                child: Container(
                                  width: 90,
                                  decoration: BoxDecoration(
                                    color: surfaceBg,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: borderColor),
                                  ),
                                  clipBehavior: Clip.antiAlias,
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Expanded(
                                        child: Stack(
                                          children: [
                                            Positioned.fill(
                                              child: Image.network(
                                                fullUrl,
                                                fit: BoxFit.cover,
                                                errorBuilder: (context, error, stackTrace) => Container(
                                                  color: surfaceBg,
                                                  alignment: Alignment.center,
                                                  child: const Icon(Icons.photo_outlined, size: 22, color: Colors.grey),
                                                ),
                                              ),
                                            ),
                                            if (p.photoTag != null && p.photoTag!.isNotEmpty)
                                              Positioned(
                                                top: 4,
                                                left: 4,
                                                child: Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                                  decoration: BoxDecoration(
                                                    color: Colors.black.withValues(alpha: 0.75),
                                                    borderRadius: BorderRadius.circular(4),
                                                  ),
                                                  child: Text(
                                                    p.photoTag!,
                                                    style: const TextStyle(
                                                      fontSize: 8.5,
                                                      fontWeight: FontWeight.bold,
                                                      color: Colors.white,
                                                    ),
                                                  ),
                                                ),
                                              ),
                                          ],
                                        ),
                                      ),
                                      if (p.caption != null && p.caption!.trim().isNotEmpty)
                                        Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 3),
                                          child: Text(
                                            p.caption!,
                                            style: TextStyle(
                                              fontSize: 9,
                                              color: textPrimary,
                                              fontWeight: FontWeight.w600,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ],
                  ),
                );
              }),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSignatureThumb(String sigData, {double height = 28}) {
    try {
      if (sigData.startsWith('data:image')) {
        final commaIdx = sigData.indexOf(',');
        final base64Str = commaIdx != -1 ? sigData.substring(commaIdx + 1) : sigData;
        return Image.memory(
          base64Decode(base64Str),
          height: height,
          fit: BoxFit.contain,
          errorBuilder: (context, error, stackTrace) => const Icon(Icons.draw, size: 16),
        );
      } else if (sigData.startsWith('http')) {
        return Image.network(
          sigData,
          height: height,
          fit: BoxFit.contain,
          errorBuilder: (context, error, stackTrace) => const Icon(Icons.draw, size: 16),
        );
      }
    } catch (_) {}
    return const Icon(Icons.draw, size: 16);
  }

  void _showPhotoLightbox(BuildContext context, String url, String? caption, String? tag) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.black,
        insetPadding: const EdgeInsets.all(12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (tag != null && tag.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.brandPrimary,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        tag,
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    )
                  else
                    const SizedBox.shrink(),
                  IconButton(
                    onPressed: () => Navigator.of(ctx).pop(),
                    icon: const Icon(Icons.close, color: Colors.white, size: 22),
                  ),
                ],
              ),
            ),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: InteractiveViewer(
                child: Image.network(
                  url,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) => const SizedBox(
                    height: 200,
                    child: Center(
                      child: Icon(Icons.broken_image, color: Colors.white54, size: 40),
                    ),
                  ),
                ),
              ),
            ),
            if (caption != null && caption.isNotEmpty)
              Padding(
                padding: const EdgeInsets.all(12.0),
                child: Text(
                  caption,
                  style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
                  textAlign: TextAlign.center,
                ),
              ),
          ],
        ),
      ),
    );
  }

  // Quick Set Target Date Dialog
  void _showSetTargetDateDialog(
    BuildContext context,
    ProjectModel project,
    ProjectProvider provider,
    String? currentDate,
  ) {
    DateTime selected = DateTime.now().add(const Duration(days: 15));
    if (currentDate != null) {
      final parsed = DateTime.tryParse(currentDate);
      if (parsed != null) selected = parsed;
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF1A1A1A) : Colors.white;
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSecondary = isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569);

    final dateCtrl = TextEditingController(text: DateFormat('yyyy-MM-dd').format(selected));

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: cardBg,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          title: Text(
            "Set Target Delivery Date",
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textPrimary),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Overall rooftop commissioning target date:",
                style: TextStyle(fontSize: 12, color: textSecondary),
              ),
              const SizedBox(height: 12),
              InkWell(
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: selected,
                    firstDate: DateTime(2020),
                    lastDate: DateTime(2035),
                  );
                  if (picked != null) {
                    setDialogState(() {
                      selected = picked;
                      dateCtrl.text = DateFormat('yyyy-MM-dd').format(picked);
                    });
                  }
                },
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF242424) : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFCBD5E1)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        DateFormat('dd MMM yyyy').format(selected),
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: textPrimary),
                      ),
                      const Icon(Icons.calendar_today_rounded, size: 18, color: AppColors.brandPrimary),
                    ],
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: Text("Cancel", style: TextStyle(color: textSecondary)),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.of(ctx).pop();
                final res = await provider.updateProjectTargetDate(project.id, dateCtrl.text);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(res['message'] ?? 'Target date updated!'),
                      backgroundColor: res['success'] == true ? AppColors.emeraldGreen : AppColors.errorRed,
                    ),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF005BAC),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text("Update Target Date"),
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================
  // TAB 4: COMMISSIONING & FUNCTIONAL TESTING
  // ==========================================
  Widget _buildCommissioningTab(
    ProjectModel project,
    ProjectProvider provider,
    bool isDark,
    Color cardBg,
    Color surfaceBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final commissioning = provider.commissioning;
    final isLoading = provider.isLoadingCommissioning;

    String formatCleanDate(String? dStr) {
      if (dStr == null || dStr.trim().isEmpty) return "—";
      try {
        final d = DateTime.parse(dStr);
        return DateFormat("dd MMM yyyy").format(d.toLocal());
      } catch (_) {
        return dStr;
      }
    }

    Widget renderDetailItem(String label, dynamic value, {Widget? customWidget}) {
      final valStr = (value != null && value.toString().trim().isNotEmpty) ? value.toString() : "—";
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: textSecondary,
              letterSpacing: 0.3,
            ),
          ),
          const SizedBox(height: 4),
          customWidget ??
              Text(
                valStr,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: textPrimary,
                ),
              ),
        ],
      );
    }

    Widget buildPassFailBadge(String? val) {
      if (val == null || val.trim().isEmpty) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1)),
          ),
          child: Text(
            "—",
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: textSecondary,
            ),
          ),
        );
      }
      final isPass = val.trim().toLowerCase() == 'pass';
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: isPass
              ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5))
              : (isDark ? const Color(0xFF7F1D1D) : const Color(0xFFFEF2F2)),
          borderRadius: BorderRadius.circular(4),
          border: Border.all(
            color: isPass
                ? (isDark ? const Color(0xFF059669) : const Color(0xFFA7F3D0))
                : (isDark ? const Color(0xFFDC2626) : const Color(0xFFFECACA)),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isPass ? Icons.check_circle_rounded : Icons.cancel_rounded,
              size: 13,
              color: isPass ? const Color(0xFF10B981) : const Color(0xFFEF4444),
            ),
            const SizedBox(width: 4),
            Text(
              val,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: isPass ? const Color(0xFF10B981) : const Color(0xFFEF4444),
              ),
            ),
          ],
        ),
      );
    }

    Widget buildResultBadge(String? res) {
      final r = res ?? 'Pending';
      Color bg;
      Color border;
      Color text;
      String label = r;

      if (r == 'Passed') {
        label = "Passed & Synchronized";
        bg = isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5);
        border = isDark ? const Color(0xFF059669) : const Color(0xFFA7F3D0);
        text = isDark ? const Color(0xFF34D399) : const Color(0xFF059669);
      } else if (r == 'Failed') {
        label = "Failed (Rectification Required)";
        bg = isDark ? const Color(0xFF7F1D1D) : const Color(0xFFFEF2F2);
        border = isDark ? const Color(0xFFDC2626) : const Color(0xFFFECACA);
        text = isDark ? const Color(0xFFFCA5A5) : const Color(0xFFDC2626);
      } else if (r == 'Conditional Pass') {
        label = "Conditional Pass";
        bg = isDark ? const Color(0xFF78350F) : const Color(0xFFFFFBEB);
        border = isDark ? const Color(0xFFD97706) : const Color(0xFFFDE68A);
        text = isDark ? const Color(0xFFFCD34D) : const Color(0xFFD97706);
      } else {
        label = "Pending";
        bg = isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9);
        border = isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1);
        text = isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569);
      }

      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: text,
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await provider.fetchCommissioning(project.id);
      },
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // 1. Stage Clarity Info Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF0C1929) : const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: isDark ? const Color(0xFF1E3A8A) : const Color(0xFFBFDBFE)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.info_outline_rounded,
                  size: 18,
                  color: isDark ? const Color(0xFF60A5FA) : const Color(0xFF2563EB),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: RichText(
                    text: TextSpan(
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? const Color(0xFF93C5FD) : const Color(0xFF1E40AF),
                        height: 1.4,
                      ),
                      children: const [
                        TextSpan(
                          text: "Technical & Functional Commissioning: ",
                          style: TextStyle(fontWeight: FontWeight.w800),
                        ),
                        TextSpan(
                          text: "This stage confirms anti-islanding safety shutoff, inverter synchronisation, insulation Megger resistance, and net-meter readings before customer handover and DISCOM subsidy inspection.",
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          if (isLoading && commissioning == null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 40),
              child: Center(
                child: Column(
                  children: [
                    const CircularProgressIndicator(),
                    const SizedBox(height: 12),
                    Text(
                      "Loading commissioning records...",
                      style: TextStyle(color: textSecondary, fontSize: 13),
                    ),
                  ],
                ),
              ),
            )
          else if (commissioning == null)
            // Empty State Card
            Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: borderColor),
              ),
              child: Column(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.electric_bolt_rounded,
                      size: 28,
                      color: isDark ? const Color(0xFF60A5FA) : const Color(0xFF2563EB),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    "Commissioning Not Conducted Yet",
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: textPrimary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    "Validate DC string voltage, anti-islanding protection cutoff, Megger insulation resistance, earth resistance, and net meter baseline readings.",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 12,
                      color: textSecondary,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 18),
                  ElevatedButton.icon(
                    onPressed: () {
                      CommissioningFormSheet.show(
                        context,
                        project: project,
                        existingCommissioning: null,
                      );
                    },
                    icon: const Icon(Icons.electric_bolt_rounded, size: 16),
                    label: const Text(
                      "Begin Functional Commissioning",
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF005BAC),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ],
              ),
            )
          else ...[
            // Certificate Header Card
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
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.verified_rounded, color: Color(0xFF10B981), size: 26),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "Commissioning & Functional Testing Certificate",
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: textPrimary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              "Engineer: ${commissioning.commissioningEngineer ?? 'N/A'} • Date: ${formatCleanDate(commissioning.commissionDate)}${commissioning.certificateNumber != null ? ' • Cert #${commissioning.certificateNumber}' : ''}",
                              style: TextStyle(
                                fontSize: 11,
                                color: textSecondary,
                                height: 1.3,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      buildResultBadge(commissioning.overallResult),
                      OutlinedButton.icon(
                        onPressed: () {
                          CommissioningFormSheet.show(
                            context,
                            project: project,
                            existingCommissioning: commissioning,
                          );
                        },
                        icon: const Icon(Icons.edit_outlined, size: 14),
                        label: const Text(
                          "Edit Commissioning",
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: textPrimary,
                          side: BorderSide(color: borderColor),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Section 1: Electrical & Net Meter Readings
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
                  Row(
                    children: [
                      const Icon(Icons.speed_rounded, color: Color(0xFFF59E0B), size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          "Section 1: Electrical & Net Meter Readings",
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Divider(color: borderColor, height: 1),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: renderDetailItem(
                          "DC String Voltage",
                          commissioning.panelOutputVoltage != null
                              ? "${commissioning.panelOutputVoltage!.toStringAsFixed(2)} V"
                              : null,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: renderDetailItem(
                          "DC String Current",
                          commissioning.dcCurrentAmps != null
                              ? "${commissioning.dcCurrentAmps!.toStringAsFixed(2)} A"
                              : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: renderDetailItem(
                          "Inverter Output Power",
                          commissioning.inverterOutputKw != null
                              ? "${commissioning.inverterOutputKw!.toStringAsFixed(2)} kW"
                              : null,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: renderDetailItem(
                          "Inverter Display Status",
                          commissioning.inverterDisplayStatus,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: renderDetailItem(
                          "AC Grid Output Voltage",
                          commissioning.acOutputVoltage != null
                              ? "${commissioning.acOutputVoltage!.toStringAsFixed(2)} V"
                              : null,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: renderDetailItem(
                          "Meter Serial Number",
                          commissioning.meterSerialNumber,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: renderDetailItem(
                          "Net Meter Import",
                          commissioning.netMeterImportKwh != null
                              ? "${commissioning.netMeterImportKwh!.toStringAsFixed(2)} kWh"
                              : null,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: renderDetailItem(
                          "Net Meter Export",
                          commissioning.netMeterExportKwh != null
                              ? "${commissioning.netMeterExportKwh!.toStringAsFixed(2)} kWh"
                              : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  renderDetailItem(
                    "Solar Generation Baseline",
                    (commissioning.generationMeterKwh ?? commissioning.meterReadingKwh) != null
                        ? "${(commissioning.generationMeterKwh ?? commissioning.meterReadingKwh)!.toStringAsFixed(2)} kWh"
                        : null,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Section 2: Anti-Islanding & Insulation Protection
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
                  Row(
                    children: [
                      const Icon(Icons.security_rounded, color: Color(0xFFF97316), size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          "Section 2: Anti-Islanding & Insulation Protection",
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Divider(color: borderColor, height: 1),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: renderDetailItem(
                          "Anti-Islanding Test",
                          null,
                          customWidget: buildPassFailBadge(commissioning.antiIslandingTest),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: renderDetailItem(
                          "Emergency Shutdowns",
                          null,
                          customWidget: buildPassFailBadge(commissioning.safetyShutdowns),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: renderDetailItem(
                          "Grounding / Earthing Continuity",
                          null,
                          customWidget: buildPassFailBadge(commissioning.groundingCheck),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: renderDetailItem(
                          "Earth Resistance",
                          commissioning.earthResistanceOhm != null
                              ? "${commissioning.earthResistanceOhm!.toStringAsFixed(2)} Ω (Req: < 5 Ω)"
                              : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: renderDetailItem(
                          "Wiring Insulation Integrity",
                          null,
                          customWidget: buildPassFailBadge(commissioning.wiringInsulation),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: renderDetailItem(
                          "Megger Insulation Resistance",
                          commissioning.insulationResistanceMohm != null
                              ? "${commissioning.insulationResistanceMohm!.toStringAsFixed(2)} MΩ (Req: > 1 MΩ)"
                              : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  renderDetailItem(
                    "Earth Leakage Current Test",
                    null,
                    customWidget: buildPassFailBadge(commissioning.earthLeakage),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Section 3: Commissioning Decision & Formal Sign-Off
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
                  Row(
                    children: [
                      const Icon(Icons.assignment_turned_in_rounded, color: Color(0xFF10B981), size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          "Section 3: Commissioning Decision & Formal Sign-Off",
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Divider(color: borderColor, height: 1),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: renderDetailItem(
                          "Overall Technical Result",
                          null,
                          customWidget: buildResultBadge(commissioning.overallResult),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: renderDetailItem(
                          "Commissioning Date",
                          formatCleanDate(commissioning.commissionDate),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: renderDetailItem(
                          "Testing Engineer",
                          commissioning.commissioningEngineer,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: renderDetailItem(
                          "Certificate Number",
                          commissioning.certificateNumber,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: renderDetailItem(
                          "Customer / Rep Sign-Off",
                          commissioning.customerSignatureName,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "VERIFICATION STATUS",
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: textSecondary,
                                letterSpacing: 0.3,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Wrap(
                              spacing: 6,
                              runSpacing: 4,
                              children: [
                                if (commissioning.customerAcknowledged)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5),
                                      borderRadius: BorderRadius.circular(4),
                                      border: Border.all(
                                        color: isDark ? const Color(0xFF059669) : const Color(0xFFA7F3D0),
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: const [
                                        Icon(Icons.check_circle_rounded, size: 12, color: Color(0xFF10B981)),
                                        SizedBox(width: 3),
                                        Text(
                                          "Customer Acknowledged",
                                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF10B981)),
                                        ),
                                      ],
                                    ),
                                  ),
                                if (commissioning.engineerSignoff)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: isDark ? const Color(0xFF1E3A8A) : const Color(0xFFEFF6FF),
                                      borderRadius: BorderRadius.circular(4),
                                      border: Border.all(
                                        color: isDark ? const Color(0xFF3B82F6) : const Color(0xFFBFDBFE),
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: const [
                                        Icon(Icons.verified_rounded, size: 12, color: Color(0xFF3B82F6)),
                                        SizedBox(width: 3),
                                        Text(
                                          "Engineer Signed Off",
                                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF3B82F6)),
                                        ),
                                      ],
                                    ),
                                  ),
                                if (!commissioning.customerAcknowledged && !commissioning.engineerSignoff)
                                  Text("—", style: TextStyle(color: textSecondary, fontSize: 12)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (commissioning.signatureData != null && commissioning.signatureData!.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF064E3B).withValues(alpha: 0.2) : const Color(0xFFF0FDF4),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFF10B981)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                "Official Commissioning Digital Signature",
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF16A34A),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDCFCE7),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: const Color(0xFF86EFAC)),
                                ),
                                child: const Text(
                                  "✓ Signature Verified",
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF16A34A),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Container(
                            height: 70,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFFCBD5E1)),
                            ),
                            alignment: Alignment.center,
                            child: _buildSignatureThumb(commissioning.signatureData!, height: 60),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 14),
                  renderDetailItem(
                    "Technical Remarks & Observations",
                    commissioning.remarks,
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  // ==========================================
  // TAB 5: FINAL INSPECTION & QUALITY CLEARANCE
  // ==========================================
  Widget _buildFinalInspectionTab(
    ProjectModel project,
    ProjectProvider provider,
    bool isDark,
    Color cardBg,
    Color surfaceBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final inspection = provider.finalInspection;
    final commissioningData = provider.commissioning;
    final isLoading = provider.isLoadingFinalInspection;

    String formatCleanDate(String? dStr) {
      if (dStr == null || dStr.trim().isEmpty) return "—";
      try {
        final d = DateTime.parse(dStr);
        return DateFormat("dd MMM yyyy").format(d.toLocal());
      } catch (_) {
        return dStr;
      }
    }

    Widget renderDetailItem(String label, dynamic value, {Widget? customWidget}) {
      final valStr = (value != null && value.toString().trim().isNotEmpty) ? value.toString() : "—";
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: textSecondary,
              letterSpacing: 0.3,
            ),
          ),
          const SizedBox(height: 4),
          customWidget ??
              Text(
                valStr,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: textPrimary,
                ),
              ),
        ],
      );
    }

    Widget buildPassFailBadge(String? val) {
      if (val == null || val.trim().isEmpty) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1)),
          ),
          child: Text(
            "—",
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: textSecondary,
            ),
          ),
        );
      }
      final isPass = val.trim().toLowerCase() == 'pass';
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: isPass
              ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5))
              : (isDark ? const Color(0xFF7F1D1D) : const Color(0xFFFEF2F2)),
          borderRadius: BorderRadius.circular(4),
          border: Border.all(
            color: isPass
                ? (isDark ? const Color(0xFF059669) : const Color(0xFFA7F3D0))
                : (isDark ? const Color(0xFFDC2626) : const Color(0xFFFECACA)),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isPass ? Icons.check_circle_rounded : Icons.cancel_rounded,
              size: 13,
              color: isPass ? const Color(0xFF10B981) : const Color(0xFFEF4444),
            ),
            const SizedBox(width: 4),
            Text(
              val,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: isPass ? const Color(0xFF10B981) : const Color(0xFFEF4444),
              ),
            ),
          ],
        ),
      );
    }

    Widget buildStatusBadge(String? status) {
      final s = status ?? 'Pending';
      Color bg;
      Color border;
      Color text;
      String label = s;

      if (s == 'Approved') {
        label = "Approved & Quality Cleared";
        bg = isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5);
        border = isDark ? const Color(0xFF059669) : const Color(0xFFA7F3D0);
        text = isDark ? const Color(0xFF34D399) : const Color(0xFF059669);
      } else if (s.contains('Conditional') || s.contains('Corrections')) {
        label = "Conditional Approval (Rework Needed)";
        bg = isDark ? const Color(0xFF78350F) : const Color(0xFFFFFBEB);
        border = isDark ? const Color(0xFFD97706) : const Color(0xFFFDE68A);
        text = isDark ? const Color(0xFFFCD34D) : const Color(0xFFD97706);
      } else if (s.contains('Rejected')) {
        label = "Rejected / Re-inspection Required";
        bg = isDark ? const Color(0xFF7F1D1D) : const Color(0xFFFEF2F2);
        border = isDark ? const Color(0xFFDC2626) : const Color(0xFFFECACA);
        text = isDark ? const Color(0xFFFCA5A5) : const Color(0xFFDC2626);
      } else {
        label = "Pending";
        bg = isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9);
        border = isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1);
        text = isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569);
      }

      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: text,
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await provider.fetchFinalInspection(project.id);
        await provider.fetchCommissioning(project.id);
      },
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          // 1. Stage Clarity Info Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF0C1929) : const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: isDark ? const Color(0xFF1E3A8A) : const Color(0xFFBFDBFE)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.info_outline_rounded,
                  size: 18,
                  color: isDark ? const Color(0xFF60A5FA) : const Color(0xFF2563EB),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: RichText(
                    text: TextSpan(
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? const Color(0xFF93C5FD) : const Color(0xFF1E40AF),
                        height: 1.4,
                      ),
                      children: const [
                        TextSpan(
                          text: "Company Quality Assurance & Pre-Handover Clearance: ",
                          style: TextStyle(fontWeight: FontWeight.w800),
                        ),
                        TextSpan(
                          text: "Commissioning verified electrical synchronization; this independent Final Inspection certifies EPC structural integrity, statutory DISCOM document packs, and warranty compliance before client handover.",
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          if (isLoading && inspection == null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 40),
              child: Center(
                child: Column(
                  children: [
                    const CircularProgressIndicator(),
                    const SizedBox(height: 12),
                    Text(
                      "Loading QA/QC inspection records...",
                      style: TextStyle(color: textSecondary, fontSize: 13),
                    ),
                  ],
                ),
              ),
            )
          else if (inspection == null)
            // Empty State Card
            Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: borderColor),
              ),
              child: Column(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.fact_check_rounded,
                      size: 28,
                      color: isDark ? const Color(0xFF60A5FA) : const Color(0xFF2563EB),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    "Final QA/QC Inspection Not Conducted Yet",
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: textPrimary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    "Conduct comprehensive structural torque audits, DISCOM statutory documentation verification, and pre-handover defect tracking.",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 12,
                      color: textSecondary,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 18),
                  ElevatedButton.icon(
                    onPressed: () {
                      FinalInspectionFormSheet.show(
                        context,
                        project: project,
                        existingInspection: null,
                        commissioningData: commissioningData,
                      );
                    },
                    icon: const Icon(Icons.fact_check_rounded, size: 16),
                    label: const Text(
                      "Begin Quality Inspection",
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF005BAC),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ],
              ),
            )
          else ...[
            // Quality Clearance Header Record Card
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
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.fact_check_rounded, color: Color(0xFF2563EB), size: 26),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "Quality Clearance & Final Inspection Record",
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: textPrimary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              "Auditor: ${inspection.inspectorName ?? 'N/A'} (${inspection.inspectorType ?? 'Internal QA / QC'}) • Date: ${formatCleanDate(inspection.inspectionDate)}${inspection.certificateNumber != null ? ' • Certificate: #${inspection.certificateNumber}' : ''}",
                              style: TextStyle(
                                fontSize: 11,
                                color: textSecondary,
                                height: 1.3,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      buildStatusBadge(inspection.inspectionStatus),
                      OutlinedButton.icon(
                        onPressed: () {
                          FinalInspectionFormSheet.show(
                            context,
                            project: project,
                            existingInspection: inspection,
                            commissioningData: commissioningData,
                          );
                        },
                        icon: const Icon(Icons.edit_outlined, size: 14),
                        label: const Text(
                          "Edit QA Record",
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: textPrimary,
                          side: BorderSide(color: borderColor),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Section 1: Quality & Compliance Clearances
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
                  Row(
                    children: [
                      const Icon(Icons.assignment_turned_in_rounded, color: Color(0xFF10B981), size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          "Section 1: Quality & Compliance Clearances",
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Divider(color: borderColor, height: 1),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: renderDetailItem(
                          "Mounting & Structural Quality",
                          null,
                          customWidget: buildPassFailBadge(inspection.installationQuality),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: renderDetailItem(
                          "Electrical Safety Compliance",
                          null,
                          customWidget: buildPassFailBadge(inspection.safetyCompliance),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: renderDetailItem(
                          "Statutory Document Pack",
                          null,
                          customWidget: buildPassFailBadge(inspection.documentVerification),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: renderDetailItem(
                          "Performance Verification",
                          null,
                          customWidget: buildPassFailBadge(inspection.performanceTesting),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Audited Engineering Evidence Box
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: borderColor),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "AUDITED ENGINEERING EVIDENCE",
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: textSecondary,
                            letterSpacing: 0.3,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          "✓ Structure: Torque checked, hot-dip galvanized & grouted",
                          style: TextStyle(fontSize: 11, color: textSecondary, height: 1.35),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          "✓ Electrical: UV-rated conduit saddles, DC warning stickers & ferrule labels",
                          style: TextStyle(fontSize: 11, color: textSecondary, height: 1.35),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          "✓ Inverter & Earthing: Dual body earthing & separate LA pit confirmed",
                          style: TextStyle(fontSize: 11, color: textSecondary, height: 1.35),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Section 2: Commissioning Benchmark Verification
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
                  Row(
                    children: [
                      const Icon(Icons.speed_rounded, color: Color(0xFFF59E0B), size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          "Section 2: Commissioning Benchmark Verification",
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Divider(color: borderColor, height: 1),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: renderDetailItem(
                          "DC String Voc",
                          commissioningData?.panelOutputVoltage != null
                              ? "${commissioningData!.panelOutputVoltage!.toStringAsFixed(2)} V"
                              : "Verified (>350V)",
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: renderDetailItem(
                          "Inverter Output Power",
                          commissioningData?.inverterOutputKw != null
                              ? "${commissioningData!.inverterOutputKw!.toStringAsFixed(2)} kW"
                              : "Active / Synchronized",
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: renderDetailItem(
                          "Megger Insulation",
                          commissioningData?.insulationResistanceMohm != null
                              ? "${commissioningData!.insulationResistanceMohm!.toStringAsFixed(2)} MΩ"
                              : "Compliant (>1 MΩ)",
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: renderDetailItem(
                          "Anti-Islanding Test",
                          commissioningData?.antiIslandingTest ?? "Pass (<2s Cutoff)",
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Synchronized Green Banner
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF064E3B).withValues(alpha: 0.3) : const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: const Color(0xFFA7F3D0)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle_rounded, size: 14, color: Color(0xFF059669)),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            "Synchronized with Commissioning Certificate #${commissioningData?.certificateNumber ?? 'COMM-VERIFIED'}",
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF065F46),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Section 3: Defect Tracking, Rework Status & Formal Approval
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
                  Row(
                    children: [
                      const Icon(Icons.build_circle_outlined, color: Color(0xFFF97316), size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          "Section 3: Defect Tracking, Rework Status & Formal Approval",
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Divider(color: borderColor, height: 1),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: renderDetailItem(
                          "Final QA Status",
                          null,
                          customWidget: buildStatusBadge(inspection.inspectionStatus),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: renderDetailItem(
                          "Auditor Name",
                          inspection.inspectorName,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: renderDetailItem(
                          "Audit Class",
                          inspection.inspectorType,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: renderDetailItem(
                          "QA Approval Cert No.",
                          inspection.certificateNumber,
                        ),
                      ),
                    ],
                  ),

                  // Rework Follow-up Status (if any)
                  if (inspection.correctionsNeeded != null && inspection.correctionsNeeded!.trim().isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF78350F).withValues(alpha: 0.3) : const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFFDE68A)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "REWORK & RECTIFICATION STATUS",
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF92400E),
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            "Status: ${inspection.reworkStatus ?? 'Open'}${inspection.reinspectionDate != null ? ' • Re-inspection: ${formatCleanDate(inspection.reinspectionDate)}' : ''}",
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF78350F),
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            "\"${inspection.correctionsNeeded}\"",
                            style: const TextStyle(
                              fontSize: 11,
                              color: Color(0xFF92400E),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 12),
                  renderDetailItem(
                    "Audit Remarks",
                    inspection.remarks,
                  ),

                  if (inspection.inspectionPhotos != null && inspection.inspectionPhotos!.trim().isNotEmpty) ...[
                    const SizedBox(height: 10),
                    renderDetailItem(
                      "Audit Photos / Documentation",
                      inspection.inspectionPhotos,
                    ),
                  ],

                  if (inspection.signatureData != null && inspection.signatureData!.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF064E3B).withValues(alpha: 0.2) : const Color(0xFFF0FDF4),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFF10B981)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                "Final QA Customer & Inspector Digital Signature",
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF16A34A),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDCFCE7),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: const Color(0xFF86EFAC)),
                                ),
                                child: const Text(
                                  "✓ Signature Verified",
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF16A34A),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Container(
                            height: 70,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFFCBD5E1)),
                            ),
                            alignment: Alignment.center,
                            child: _buildSignatureThumb(inspection.signatureData!, height: 60),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  // ==========================================
  // TAB 6: CUSTOMER HANDOVER & WARRANTY DOSSIER
  // ==========================================
  Widget _buildCustomerHandoverTab(
    ProjectModel project,
    ProjectProvider provider,
    bool isDark,
    Color cardBg,
    Color surfaceBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final handover = provider.customerHandover;
    final isLoading = provider.isLoadingCustomerHandover;

    String formatCleanDate(String? dStr) {
      if (dStr == null || dStr.trim().isEmpty) return "—";
      try {
        final d = DateTime.parse(dStr);
        return DateFormat("dd MMM yyyy").format(d.toLocal());
      } catch (_) {
        return dStr;
      }
    }

    Widget buildStatusBadge(String? status) {
      final s = status ?? 'Pending';
      Color bg;
      Color border;
      Color text;
      String label = s;

      if (s.toLowerCase().contains('complete')) {
        label = "Completed & Handed Over";
        bg = isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5);
        border = isDark ? const Color(0xFF059669) : const Color(0xFFA7F3D0);
        text = isDark ? const Color(0xFF34D399) : const Color(0xFF059669);
      } else if (s.toLowerCase().contains('progress')) {
        label = "In Progress";
        bg = isDark ? const Color(0xFF78350F) : const Color(0xFFFFFBEB);
        border = isDark ? const Color(0xFFD97706) : const Color(0xFFFDE68A);
        text = isDark ? const Color(0xFFFCD34D) : const Color(0xFFD97706);
      } else {
        label = "Pending";
        bg = isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9);
        border = isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1);
        text = isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569);
      }

      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: text,
          ),
        ),
      );
    }

    Widget buildPillBadge(String? val) {
      final isDone = val != null && val.toLowerCase().contains('complete');
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: isDone
              ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5))
              : (isDark ? const Color(0xFF78350F) : const Color(0xFFFFFBEB)),
          borderRadius: BorderRadius.circular(4),
          border: Border.all(
            color: isDone
                ? (isDark ? const Color(0xFF059669) : const Color(0xFFA7F3D0))
                : (isDark ? const Color(0xFFD97706) : const Color(0xFFFDE68A)),
          ),
        ),
        child: Text(
          val != null && val.isNotEmpty ? val : "Pending",
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            color: isDone ? const Color(0xFF10B981) : const Color(0xFFD97706),
          ),
        ),
      );
    }

    Widget renderDetailItem(String label, dynamic value) {
      final valStr = (value != null && value.toString().trim().isNotEmpty) ? value.toString() : "—";
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: textSecondary,
              letterSpacing: 0.3,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            valStr,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: textPrimary,
            ),
          ),
        ],
      );
    }

    // Default Statutory Dossier Checklist
    const defaultDossierLabels = [
      {"id": "comm_cert", "label": "Commissioning & Grid Synchronisation Certificate"},
      {"id": "qc_report", "label": "Final Quality & Safety Inspection Report"},
      {"id": "discom_metering", "label": "DISCOM Net-Metering Feasibility & Bi-directional Meter Test Report"},
      {"id": "subsidy_doc", "label": "PM Surya Ghar National Portal Subsidy Claim Submission Receipt"},
      {"id": "gst_invoice", "label": "Final GST Commercial Tax Invoice & Zero-Balance Payment Receipt"},
      {"id": "oem_warranty", "label": "OEM Warranty Certificates (25-Yr PV Modules & Inverter)"},
      {"id": "om_manual", "label": "Customer Operation & Emergency Shutdown Safety Manual"},
    ];

    bool isItemDelivered(String id) {
      if (handover?.documentsPackChecklist == null) return false;
      final found = handover!.documentsPackChecklist!.firstWhere(
        (item) => item['id'] == id,
        orElse: () => {'checked': false},
      );
      return found['checked'] == true || found['checked'] == 1;
    }

    final reviewUrl = "https://digiinksolutions.solops.cloud/review/${handover?.reviewToken ?? project.id}";

    final contractVal = handover?.contractValue ?? project.totalCost;
    final amtPaid = handover?.amountPaid ?? project.amountReceived;
    final balDue = handover?.balanceDue ?? (contractVal - amtPaid > 0 ? contractVal - amtPaid : 0.0);

    return RefreshIndicator(
      onRefresh: () async {
        await provider.fetchCustomerHandover(project.id);
      },
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          if (isLoading && handover == null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 40),
              child: Center(
                child: Column(
                  children: [
                    const CircularProgressIndicator(),
                    const SizedBox(height: 12),
                    Text(
                      "Loading handover details...",
                      style: TextStyle(color: textSecondary, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ),
          // 1. Header Action Bar
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
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.handshake_rounded, color: Color(0xFFF59E0B), size: 26),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                "Customer Handover",
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  color: textPrimary,
                                ),
                              ),
                              const SizedBox(width: 8),
                              buildStatusBadge(handover?.handoverStatus),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "Operational training, cloud monitoring app onboarding, warranty activation & signed customer acceptance dossier.",
                            style: TextStyle(
                              fontSize: 11,
                              color: textSecondary,
                              height: 1.3,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Blue milestone notice
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF0C1929) : const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: isDark ? const Color(0xFF1E3A8A) : const Color(0xFFBFDBFE)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline_rounded, size: 14, color: isDark ? const Color(0xFF60A5FA) : const Color(0xFF2563EB)),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          "Current project milestone: ${project.stage}. Check Stage History for saved changes and dates.",
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark ? const Color(0xFF93C5FD) : const Color(0xFF1E40AF),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // Update Handover Details Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      CustomerHandoverFormSheet.show(
                        context,
                        project: project,
                        existingHandover: handover,
                      );
                    },
                    icon: const Icon(Icons.edit_note_rounded, size: 16),
                    label: const Text(
                      "Update Handover Details",
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // 2. Company AMC Plans Bar
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: borderColor),
            ),
            child: Row(
              children: [
                const Icon(Icons.support_agent_rounded, size: 20, color: Color(0xFF3B82F6)),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Company AMC plans",
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: textPrimary),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        "Define your own paid maintenance plans, fees and coverage. Select the agreed customer plan in the Warranty & AMC tab. No paid plan is assigned automatically.",
                        style: TextStyle(fontSize: 10, color: textSecondary, height: 1.3),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // 3. Payment Clearance Gate (Commercial Clearance)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF064E3B).withValues(alpha: 0.25) : const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF86EFAC)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.receipt_long_rounded, size: 18, color: Color(0xFF16A34A)),
                        SizedBox(width: 6),
                        Text(
                          "PAYMENT CLEARANCE GATE",
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF166534)),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: const Color(0xFF86EFAC)),
                      ),
                      child: const Text(
                        "Cleared for Handover",
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF16A34A)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Contract Total", style: TextStyle(fontSize: 10, color: textSecondary)),
                          const SizedBox(height: 2),
                          Text("₹${contractVal.toStringAsFixed(0)}", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: textPrimary)),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Amount Paid", style: TextStyle(fontSize: 10, color: textSecondary)),
                          const SizedBox(height: 2),
                          Text("₹${amtPaid.toStringAsFixed(0)}", style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF16A34A))),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Balance Due", style: TextStyle(fontSize: 10, color: textSecondary)),
                          const SizedBox(height: 2),
                          Text("₹${balDue.toStringAsFixed(0)}", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: textPrimary)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: const Color(0xFFCBD5E1)),
                  ),
                  child: Row(
                    children: const [
                      Icon(Icons.check_circle_rounded, size: 14, color: Color(0xFF16A34A)),
                      SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          "100% Commercial Clearance Approved: Full project cost has been received. Project is commercially eligible for official document handover and signoff.",
                          style: TextStyle(fontSize: 10, color: Color(0xFF166534), fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // 4. Multi-Tier Component Warranty Activation
          Text(
            "MULTI-TIER COMPONENT WARRANTY ACTIVATION (STARTS: ${formatCleanDate(handover?.warrantyStartDate).toUpperCase()})",
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: textSecondary, letterSpacing: 0.3),
          ),
          const SizedBox(height: 8),

          Row(
            children: [
              Expanded(
                child: _buildWarrantyDisplayCard(
                  icon: Icons.solar_power_rounded,
                  iconColor: const Color(0xFF005BAC),
                  title: "Solar PV Modules",
                  years: "${handover?.moduleWarrantyYears ?? 25} Years",
                  subtitle: "Linear Degradation Performance Warranty",
                  validUntil: formatCleanDate(handover?.moduleWarrantyEnd ?? "2051-11-19"),
                  cardBg: cardBg,
                  borderColor: borderColor,
                  textPrimary: textPrimary,
                  textSecondary: textSecondary,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildWarrantyDisplayCard(
                  icon: Icons.electric_bolt_rounded,
                  iconColor: const Color(0xFFF59E0B),
                  title: "Grid Inverter",
                  years: "${handover?.inverterWarrantyYears ?? 5} Years",
                  subtitle: "Manufacturer Replacement Warranty",
                  validUntil: formatCleanDate(handover?.inverterWarrantyEnd ?? "2031-11-19"),
                  cardBg: cardBg,
                  borderColor: borderColor,
                  textPrimary: textPrimary,
                  textSecondary: textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          Row(
            children: [
              Expanded(
                child: _buildWarrantyDisplayCard(
                  icon: Icons.build_rounded,
                  iconColor: const Color(0xFF10B981),
                  title: "EPC Workmanship",
                  years: "${handover?.workmanshipWarrantyYears ?? 5} Years",
                  subtitle: "Structure, Fasteners & Waterproofing",
                  validUntil: formatCleanDate(handover?.workmanshipWarrantyEnd ?? "2031-11-19"),
                  cardBg: cardBg,
                  borderColor: borderColor,
                  textPrimary: textPrimary,
                  textSecondary: textSecondary,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildWarrantyDisplayCard(
                  icon: Icons.support_agent_rounded,
                  iconColor: const Color(0xFF8B5CF6),
                  title: "Free Scheduled AMC",
                  years: "1 Year free service period",
                  subtitle: "Confirm included visits and services in the agreed handover terms",
                  validUntil: formatCleanDate(handover?.amcWarrantyEnd ?? "2027-11-19"),
                  cardBg: cardBg,
                  borderColor: borderColor,
                  textPrimary: textPrimary,
                  textSecondary: textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // 5. Training & Statutory Dossier Section
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
                Row(
                  children: [
                    const Icon(Icons.school_rounded, color: Color(0xFF005BAC), size: 20),
                    const SizedBox(width: 8),
                    Text(
                      "Customer Training & Mobile App Onboarding",
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: textPrimary),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Divider(color: borderColor, height: 1),
                const SizedBox(height: 10),

                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Plant Operations & Safety Briefing", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: textPrimary)),
                          Text("Inverter shutoff, trip sequence, generation meter check", style: TextStyle(fontSize: 9, color: textSecondary)),
                        ],
                      ),
                    ),
                    buildPillBadge(handover?.trainingCompleted),
                  ],
                ),
                const SizedBox(height: 10),

                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Mobile Monitoring App Walkthrough", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: textPrimary)),
                          Text("Daily kWh graph, real-time kW output, carbon offset stats", style: TextStyle(fontSize: 9, color: textSecondary)),
                        ],
                      ),
                    ),
                    buildPillBadge(handover?.appDemoCompleted),
                  ],
                ),
                const SizedBox(height: 12),

                Row(
                  children: [
                    Expanded(child: renderDetailItem("App Access Shared", handover?.monitoringAppAccessShared == true ? "Yes" : "No")),
                    Expanded(child: renderDetailItem("Emergency Helpline", handover?.emergencyContactGiven == true ? "Yes" : "No")),
                  ],
                ),
                const SizedBox(height: 10),

                Row(
                  children: [
                    Expanded(child: renderDetailItem("Handover Date", formatCleanDate(handover?.handoverDate))),
                    Expanded(child: renderDetailItem("1st Scheduled Service Due", formatCleanDate(handover?.firstServiceDueDate))),
                  ],
                ),
                const SizedBox(height: 10),
                renderDetailItem("Handover Manager", handover?.handoverManager),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // 6. Statutory Document Dossier
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
                Row(
                  children: [
                    const Icon(Icons.receipt_long_rounded, color: Color(0xFFEF4444), size: 20),
                    const SizedBox(width: 8),
                    Text(
                      "Statutory Document Dossier (Delivered to Client)",
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: textPrimary),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Divider(color: borderColor, height: 1),
                const SizedBox(height: 10),

                ...defaultDossierLabels.map((item) {
                  final delivered = isItemDelivered(item['id']!);
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      children: [
                        Icon(
                          delivered ? Icons.check_circle_rounded : Icons.warning_amber_rounded,
                          size: 14,
                          color: delivered ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            item['label']!,
                            style: TextStyle(fontSize: 11, color: textPrimary, fontWeight: FontWeight.w600),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: delivered
                                ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5))
                                : (isDark ? const Color(0xFF78350F) : const Color(0xFFFFFBEB)),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            delivered ? "Delivered & Verified" : "Pending",
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              color: delivered ? const Color(0xFF10B981) : const Color(0xFFD97706),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // 7. Customer Acceptance & Signed Docket Evidence
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "CUSTOMER ACCEPTANCE & SIGNED DOCKET EVIDENCE",
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: textSecondary, letterSpacing: 0.3),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: handover?.signatureData != null
                            ? const Color(0xFFDCFCE7)
                            : (isDark ? const Color(0xFF78350F) : const Color(0xFFFFFBEB)),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        handover?.signatureData != null ? "Signed On-Screen (Digital)" : "Signoff Pending",
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: handover?.signatureData != null ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                Text(
                  "Signatory: ${handover?.signatureSignatoryName ?? project.customerName} (${handover?.signaturePhone ?? project.customerPhone})",
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: textPrimary),
                ),
                const SizedBox(height: 10),

                if (handover?.signatureData != null && handover!.signatureData!.isNotEmpty) ...[
                  Container(
                    height: 70,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: const Color(0xFFCBD5E1)),
                    ),
                    alignment: Alignment.center,
                    child: _buildSignatureThumb(handover.signatureData!, height: 60),
                  ),
                  const SizedBox(height: 10),
                ],

                Row(
                  children: [
                    if (handover?.signedDocketUrl != null && handover!.signedDocketUrl!.isNotEmpty)
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () async {
                            final uri = Uri.parse(handover.signedDocketUrl!);
                            if (await canLaunchUrl(uri)) await launchUrl(uri);
                          },
                          icon: const Icon(Icons.picture_as_pdf_rounded, size: 14),
                          label: const Text("View Signed Docket", style: TextStyle(fontSize: 11)),
                        ),
                      ),
                    if (handover?.handoverPhotoUrl != null && handover!.handoverPhotoUrl!.isNotEmpty) ...[
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () async {
                            final uri = Uri.parse(handover.handoverPhotoUrl!);
                            if (await canLaunchUrl(uri)) await launchUrl(uri);
                          },
                          icon: const Icon(Icons.photo_camera_rounded, size: 14),
                          label: const Text("View Plant Photo", style: TextStyle(fontSize: 11)),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // 8. Customer Satisfaction & Reviews
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "CUSTOMER SATISFACTION & REVIEWS",
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: textSecondary, letterSpacing: 0.3),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: handover?.customerFeedback != null
                            ? const Color(0xFFDCFCE7)
                            : (isDark ? const Color(0xFF78350F) : const Color(0xFFFFFBEB)),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        handover?.customerFeedback != null ? "REVIEW SUBMITTED" : "AWAITING CUSTOMER REVIEW",
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          color: handover?.customerFeedback != null ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Customer Review Link Box
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: borderColor),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          reviewUrl,
                          style: TextStyle(fontSize: 11, color: textPrimary),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      OutlinedButton.icon(
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: reviewUrl));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Review link copied to clipboard!")),
                          );
                        },
                        icon: const Icon(Icons.copy, size: 12),
                        label: const Text("Copy", style: TextStyle(fontSize: 10)),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          minimumSize: const Size(50, 26),
                        ),
                      ),
                      const SizedBox(width: 6),
                      ElevatedButton.icon(
                        onPressed: () async {
                          final phone = project.customerPhone.replaceAll(RegExp(r'\D'), '');
                          final text = "Namaste ${project.customerName} ji, please share your valuable review & rating for your solar rooftop installation:\n$reviewUrl";
                          final url = "https://wa.me/${phone.length == 10 ? '91$phone' : phone}?text=${Uri.encodeComponent(text)}";
                          final uri = Uri.parse(url);
                          if (await canLaunchUrl(uri)) {
                            await launchUrl(uri, mode: LaunchMode.externalApplication);
                          }
                        },
                        icon: const Icon(Icons.send, size: 12),
                        label: const Text("WhatsApp", style: TextStyle(fontSize: 10)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF25D366),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          minimumSize: const Size(60, 26),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // Star rating & review quote
                Row(
                  children: [
                    Row(
                      children: List.generate(5, (index) {
                        final rating = handover?.customerRating ?? 0;
                        return Icon(
                          index < rating ? Icons.star : Icons.star_border,
                          size: 16,
                          color: const Color(0xFFF59E0B),
                        );
                      }),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      handover?.customerRating != null && handover!.customerRating > 0
                          ? "${handover.customerRating} / 5"
                          : "No rating submitted",
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: textPrimary),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: borderColor),
                  ),
                  child: Text(
                    handover?.customerFeedback != null && handover!.customerFeedback!.trim().isNotEmpty
                        ? "\"${handover.customerFeedback}\"\n— ${handover.customerReviewerName ?? project.customerName}"
                        : "Review pending. Customer will enter their star rating and comments via the review link above.\nReviewer: ${project.customerName}",
                    style: TextStyle(fontSize: 11, color: textSecondary, height: 1.35),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildWarrantyDisplayCard({
    required IconData icon,
    Color? iconColor,
    Color? topColor,
    required String title,
    required String years,
    required String subtitle,
    required String validUntil,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
  }) {
    final effectiveColor = iconColor ?? topColor ?? textPrimary;
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(8),
        border: Border(
          top: BorderSide(color: topColor ?? borderColor, width: topColor != null ? 3.0 : 1.0),
          left: BorderSide(color: borderColor),
          right: BorderSide(color: borderColor),
          bottom: BorderSide(color: borderColor),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: effectiveColor),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: textPrimary),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(years, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: textPrimary)),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: TextStyle(fontSize: 9, color: textSecondary, height: 1.25),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),
          Text("Valid Until: $validUntil", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: textSecondary)),
        ],
      ),
    );
  }

  // ==========================================
  // TAB 7: WARRANTY & AMC MODULE WORKSPACE
  // ==========================================
  Widget _buildWarrantyAmcTab(
    ProjectModel project,
    ProjectProvider provider,
    bool isDark,
    Color cardBg,
    Color surfaceBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final warranty = provider.warrantyAmc;
    final visits = provider.serviceVisits;
    final isLoading = provider.isLoadingWarrantyAmc;

    String formatCleanDate(String? dStr) {
      if (dStr == null || dStr.trim().isEmpty) return "—";
      try {
        final d = DateTime.parse(dStr);
        return DateFormat("dd MMM yyyy").format(d.toLocal());
      } catch (_) {
        return dStr;
      }
    }

    final defaultCertNo = warranty?.warrantyCertificateNo ??
        "WAR-${DateTime.now().year}-${project.id.toString().padLeft(4, '0')}";

    final serviceVisitsPerYear = {
      "Monthly": 12,
      "Quarterly": 4,
      "Half-yearly": 2,
      "Annual": 1,
    }[warranty?.visitFrequency ?? "Quarterly"] ?? 4;

    final annualAmcFee = warranty?.amcAmount;
    final amcFeePerVisit = annualAmcFee != null && serviceVisitsPerYear > 0
        ? annualAmcFee / serviceVisitsPerYear
        : null;

    final scheduledVisits = warranty?.scheduledVisits ?? [];

    return RefreshIndicator(
      onRefresh: () async {
        await provider.fetchWarrantyAmc(project.id);
      },
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          if (isLoading && warranty == null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 40),
              child: Center(
                child: Column(
                  children: [
                    const CircularProgressIndicator(),
                    const SizedBox(height: 12),
                    Text(
                      "Loading warranty & AMC details...",
                      style: TextStyle(color: textSecondary, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ),

          // 1. HEADER CARD: STAGE BANNER & WORKFLOW ACTIONS
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
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.shield_rounded, color: Color(0xFF059669), size: 22),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                "Warranty & AMC",
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  color: textPrimary,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: warranty != null
                                      ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFDEF7EC))
                                      : (isDark ? const Color(0xFF78350F) : const Color(0xFFFEF3C7)),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(
                                    color: warranty != null
                                        ? const Color(0xFF31C48D)
                                        : const Color(0xFFF59E0B),
                                  ),
                                ),
                                child: Text(
                                  warranty != null ? "Warranty record saved" : "Not configured",
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: warranty != null
                                        ? (isDark ? const Color(0xFF34D399) : const Color(0xFF03543F))
                                        : const Color(0xFFD97706),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "Component warranties, recorded service visits and company-defined AMC contracts.",
                            style: TextStyle(
                              fontSize: 11,
                              color: textSecondary,
                              height: 1.3,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Milestone Notice
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF0C1929) : const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: isDark ? const Color(0xFF1E3A8A) : const Color(0xFFBFDBFE)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline_rounded, size: 14, color: isDark ? const Color(0xFF60A5FA) : const Color(0xFF2563EB)),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          "Current project milestone: ${project.stage}. Check Stage History for saved changes and dates.",
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark ? const Color(0xFF93C5FD) : const Color(0xFF1E40AF),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // Action Buttons
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          WarrantyAmcFormSheet.show(
                            context,
                            project: project,
                            existingWarranty: warranty,
                          );
                        },
                        icon: const Icon(Icons.edit_note_rounded, size: 16),
                        label: const Text(
                          "Update Warranty & AMC",
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0F172A),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 11),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          LogServiceVisitSheet.show(context, project: project);
                        },
                        icon: const Icon(Icons.add_rounded, size: 16),
                        label: const Text(
                          "Log Visit",
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: textPrimary,
                          side: BorderSide(color: borderColor),
                          padding: const EdgeInsets.symmetric(vertical: 11),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // 2. COMPANY AMC NOTICE
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: borderColor),
            ),
            child: Row(
              children: [
                Icon(Icons.assignment_outlined, size: 16, color: textSecondary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    "AMC plans are defined by your company. Select a plan explicitly for each contract.",
                    style: TextStyle(fontSize: 11, color: textSecondary),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          if (warranty == null) ...[
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0C1929) : const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: isDark ? const Color(0xFF1E3A8A) : const Color(0xFFBFDBFE)),
              ),
              child: Text(
                "No warranty or AMC record has been saved. Values below are draft setup values; tap Update Warranty & AMC to save.",
                style: TextStyle(
                  fontSize: 11,
                  color: isDark ? const Color(0xFF93C5FD) : const Color(0xFF1E40AF),
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],

          // 3. ASSET IDENTIFICATION & CERTIFICATE CARD
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
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E3A8A).withValues(alpha: 0.3) : const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.verified_rounded, color: Color(0xFF2563EB), size: 20),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "WARRANTY CERTIFICATE #",
                            style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: textSecondary),
                          ),
                          Text(
                            defaultCertNo,
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: textPrimary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("WARRANTY START DATE", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: textSecondary)),
                          const SizedBox(height: 2),
                          Text(
                            formatCleanDate(warranty?.warrantyStartDate),
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: textPrimary),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("FREE 1ST-YEAR SERVICE", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: textSecondary)),
                          const SizedBox(height: 2),
                          Text(
                            "Ends ${formatCleanDate(warranty?.freeServiceEndDate)}",
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF059669)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const Divider(height: 20),

                // Hardware Serials
                Text(
                  "REGISTERED HARDWARE SERIAL NUMBERS",
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: textSecondary),
                ),
                const SizedBox(height: 6),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: surfaceBg,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: borderColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "• Panels: ${warranty?.panelSerialNumbers != null && warranty!.panelSerialNumbers!.isNotEmpty ? warranty.panelSerialNumbers : 'Not recorded'}",
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: textPrimary),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "• Inverter: ${warranty?.inverterSerialNumber != null && warranty!.inverterSerialNumber!.isNotEmpty ? warranty.inverterSerialNumber : 'Not recorded'}",
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: textPrimary),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                // Cloud Generation Monitoring Portal
                Text(
                  "CLOUD GENERATION MONITORING PORTAL",
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: textSecondary),
                ),
                const SizedBox(height: 6),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
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
                            Text(
                              warranty?.monitoringPortalUrl != null && warranty!.monitoringPortalUrl!.isNotEmpty
                                  ? warranty.monitoringPortalUrl!
                                  : "Monitoring URL not configured",
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: warranty?.monitoringPortalUrl != null && warranty!.monitoringPortalUrl!.isNotEmpty
                                    ? const Color(0xFF2563EB)
                                    : textSecondary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              "Plant ID: ${warranty?.monitoringPlantId ?? '—'}  |  User: ${warranty?.monitoringUsername ?? '—'}",
                              style: TextStyle(fontSize: 10, color: textSecondary),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(
                          color: warranty?.monitoringPortalUrl != null && warranty!.monitoringPortalUrl!.isNotEmpty
                              ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFDCFCE7))
                              : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          warranty?.monitoringPortalUrl != null && warranty!.monitoringPortalUrl!.isNotEmpty
                              ? "Portal recorded"
                              : "Not configured",
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            color: warranty?.monitoringPortalUrl != null && warranty!.monitoringPortalUrl!.isNotEmpty
                                ? const Color(0xFF166534)
                                : textSecondary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // 4. 4-TIER INDEPENDENT COMPONENT WARRANTY CARDS
          Text(
            "INDEPENDENT COMPONENT WARRANTIES (START: ${formatCleanDate(warranty?.warrantyStartDate).toUpperCase()})",
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 8),

          Row(
            children: [
              Expanded(
                child: _buildWarrantyDisplayCard(
                  title: "Panel Product",
                  years: "${warranty?.panelProductWarrantyYears ?? 12} Years",
                  subtitle: "Materials & Workmanship",
                  validUntil: formatCleanDate(warranty?.panelProductWarrantyEnd),
                  topColor: const Color(0xFF0284C7),
                  cardBg: cardBg,
                  borderColor: borderColor,
                  textPrimary: textPrimary,
                  textSecondary: textSecondary,
                  icon: Icons.solar_power_rounded,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildWarrantyDisplayCard(
                  title: "Panel Power",
                  years: "${warranty?.panelPerformanceWarrantyYears ?? 25} Years",
                  subtitle: "Linear Guarantee (>84.8%)",
                  validUntil: formatCleanDate(warranty?.panelPerformanceWarrantyEnd),
                  topColor: const Color(0xFF2563EB),
                  cardBg: cardBg,
                  borderColor: borderColor,
                  textPrimary: textPrimary,
                  textSecondary: textSecondary,
                  icon: Icons.fact_check_rounded,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          Row(
            children: [
              Expanded(
                child: _buildWarrantyDisplayCard(
                  title: "Grid Inverter",
                  years: "${warranty?.inverterWarrantyYears ?? 5} Years",
                  subtitle: "OEM Hardware Replacement",
                  validUntil: formatCleanDate(warranty?.inverterWarrantyEnd),
                  topColor: const Color(0xFFD97706),
                  cardBg: cardBg,
                  borderColor: borderColor,
                  textPrimary: textPrimary,
                  textSecondary: textSecondary,
                  icon: Icons.electric_bolt_rounded,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildWarrantyDisplayCard(
                  title: "EPC Workmanship",
                  years: "${warranty?.installationWarrantyYears ?? 5} Years",
                  subtitle: "Structure & Waterproofing",
                  validUntil: formatCleanDate(warranty?.installationWarrantyEnd),
                  topColor: const Color(0xFF059669),
                  cardBg: cardBg,
                  borderColor: borderColor,
                  textPrimary: textPrimary,
                  textSecondary: textSecondary,
                  icon: Icons.build_rounded,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // 5. PAID ANNUAL MAINTENANCE CONTRACT (AMC)
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "PAID ANNUAL MAINTENANCE CONTRACT",
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: textPrimary),
                        ),
                        Text(
                          "Starts after free-service period.",
                          style: TextStyle(fontSize: 10, color: textSecondary),
                        ),
                      ],
                    ),
                    TextButton.icon(
                      onPressed: () {
                        WarrantyAmcFormSheet.show(
                          context,
                          project: project,
                          existingWarranty: warranty,
                        );
                      },
                      icon: const Icon(Icons.edit_outlined, size: 14),
                      label: const Text("Edit AMC", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Selected Plan Box
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: surfaceBg,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: borderColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text("SELECTED PLAN", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: textSecondary)),
                          if (warranty?.visitFrequency != null)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                warranty!.visitFrequency!,
                                style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: textPrimary),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        warranty?.amcPlan ?? "Plan not selected",
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textPrimary),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        warranty?.amcPlanSnapshot?['coverage']?.toString() ??
                            (warranty?.amcPlan != null
                                ? 'Legacy contract: coverage was not recorded. Tap Edit AMC to select an updated plan.'
                                : 'No plan selected. Create company plans and select one in Edit AMC.'),
                        style: TextStyle(fontSize: 11, color: textSecondary, height: 1.3),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),

                // Commercial Terms & Fee Box
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: surfaceBg,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: borderColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("COMMERCIAL TERMS & FEE", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: textSecondary)),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Text(
                            annualAmcFee != null ? "₹${annualAmcFee.toStringAsFixed(0)}" : "Not set",
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: textPrimary),
                          ),
                          const SizedBox(width: 4),
                          Text("/ year", style: TextStyle(fontSize: 10, color: textSecondary)),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: (warranty?.amcPaymentStatus == 'Paid')
                                  ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFDCFCE7))
                                  : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              "Status: ${warranty?.amcPaymentStatus ?? 'Not set'}",
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: (warranty?.amcPaymentStatus == 'Paid')
                                    ? const Color(0xFF166534)
                                    : textSecondary,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        project.systemCapacityKw > 0
                            ? "Calculated for ${project.systemCapacityKw.toStringAsFixed(2)} kW system"
                            : "System capacity not recorded",
                        style: TextStyle(fontSize: 10, color: textSecondary),
                      ),
                      if (amcFeePerVisit != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          "• ₹${amcFeePerVisit.toStringAsFixed(2)} per ${(warranty?.visitFrequency ?? 'Quarterly').toLowerCase()} visit",
                          style: TextStyle(fontSize: 10, color: textSecondary),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 10),

                // Contract Term & Renewal Box
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: surfaceBg,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: borderColor),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("CONTRACT TERM & RENEWAL", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: textSecondary)),
                      const SizedBox(height: 4),
                      Text(
                        warranty?.amcStartDate != null && warranty?.amcEndDate != null
                            ? "Effective: ${formatCleanDate(warranty!.amcStartDate)} — ${formatCleanDate(warranty.amcEndDate)}"
                            : "Term not set",
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: textPrimary),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        "Renewal Date: ${warranty?.amcRenewalDate != null ? formatCleanDate(warranty!.amcRenewalDate) : 'Not set'}",
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: textSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // 6. PREVENTIVE MAINTENANCE SCHEDULE (SCHEDULED VISITS)
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
                Text(
                  "PREVENTIVE MAINTENANCE SCHEDULE",
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: textPrimary),
                ),
                Text(
                  "Saved service intervals and technical scope. Tap a status to toggle Done/Scheduled.",
                  style: TextStyle(fontSize: 10, color: textSecondary),
                ),
                const SizedBox(height: 10),

                if (scheduledVisits.isEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Center(
                      child: Text(
                        "No maintenance visits have been scheduled.",
                        style: TextStyle(fontSize: 11, color: textSecondary),
                      ),
                    ),
                  ),
                ] else ...[
                  ...scheduledVisits.map((v) {
                    final isDone = v.status == 'Completed';
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: surfaceBg,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: borderColor),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      v.quarter ?? "Service Milestone",
                                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: textPrimary),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      formatCleanDate(v.scheduledDate),
                                      style: TextStyle(fontSize: 11, color: textSecondary),
                                    ),
                                  ],
                                ),
                                if (v.technician != null && v.technician!.isNotEmpty) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    "Engineer: ${v.technician}",
                                    style: TextStyle(fontSize: 10, color: textSecondary),
                                  ),
                                ],
                                if (v.scope != null && v.scope!.isNotEmpty) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    v.scope!,
                                    style: TextStyle(fontSize: 10, color: textSecondary),
                                  ),
                                ],
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),

                          // Interactive Toggle Chip
                          InkWell(
                            onTap: () async {
                              final ok = await provider.toggleScheduledVisit(project.id, v.id);
                              if (ok && mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text("Visit status changed to ${!isDone ? 'Completed' : 'Scheduled'}"),
                                    duration: const Duration(seconds: 2),
                                  ),
                                );
                              }
                            },
                            borderRadius: BorderRadius.circular(6),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: isDone
                                    ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFDCFCE7))
                                    : (isDark ? const Color(0xFF78350F) : const Color(0xFFFEF3C7)),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: isDone ? const Color(0xFF10B981) : const Color(0xFFD97706),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    isDone ? Icons.check_circle_rounded : Icons.calendar_month_rounded,
                                    size: 12,
                                    color: isDone ? const Color(0xFF166534) : const Color(0xFF92400E),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    isDone ? "Completed" : "Scheduled",
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: isDone ? const Color(0xFF166534) : const Color(0xFF92400E),
                                    ),
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
              ],
            ),
          ),
          const SizedBox(height: 12),

          // 7. HISTORICAL FIELD SERVICE LOGS (UNSCHEDULED VISITS)
          if (visits.isNotEmpty) ...[
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
                  Text(
                    "HISTORICAL FIELD SERVICE LOGS (${visits.length})",
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: textPrimary),
                  ),
                  const SizedBox(height: 10),
                  ...visits.map((vis) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: surfaceBg,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: borderColor),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                formatCleanDate(vis.visitDate),
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: textPrimary),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  vis.status ?? "Completed",
                                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: textPrimary),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "Technician: ${vis.technician != null && vis.technician!.isNotEmpty ? vis.technician : '—'}",
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: textPrimary),
                          ),
                          if (vis.issueReported != null && vis.issueReported!.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(
                              "Issue/Scope: ${vis.issueReported}",
                              style: TextStyle(fontSize: 10, color: textSecondary),
                            ),
                          ],
                          if (vis.resolution != null && vis.resolution!.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(
                              "Resolution: ${vis.resolution}",
                              style: TextStyle(fontSize: 10, color: textSecondary),
                            ),
                          ],
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
        ],
      ),
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
