import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../models/survey_model.dart';
import '../../providers/survey_provider.dart';
import 'sheets/complete_survey_sheet.dart';
import 'sheets/survey_documents_sheet.dart';

class EngineerSurveysView extends StatefulWidget {
  const EngineerSurveysView({super.key});

  @override
  State<EngineerSurveysView> createState() => _EngineerSurveysViewState();
}

class _EngineerSurveysViewState extends State<EngineerSurveysView> {
  final _searchController = TextEditingController();

  final List<String> _filters = ["all", "scheduled", "completed"];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<SurveyProvider>(context, listen: false).fetchSurveys(isRefresh: true);
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearch(String query) {
    Provider.of<SurveyProvider>(context, listen: false).fetchSurveys(search: query, isRefresh: true);
  }

  void _onFilterSelected(String filter) {
    Provider.of<SurveyProvider>(context, listen: false).fetchSurveys(filter: filter, isRefresh: true);
  }

  Future<void> _makeCall(String phoneNumber) async {
    final cleanPhone = phoneNumber.replaceAll(RegExp(r'[^\d+]'), '');
    final uri = Uri.parse('tel:$cleanPhone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _navigateToSite(SurveyModel s) async {
    final url = s.mapsUrl;
    if (url == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("No site coordinates or address recorded.")),
      );
      return;
    }

    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Could not launch Google Maps navigation.")),
        );
      }
    }
  }

  void _openDocumentsSheet(SurveyModel survey) {
    SurveyDocumentsSheet.show(context, survey: survey);
  }

  void _openCompleteSurveySheet(SurveyModel survey) async {
    final res = await CompleteSurveySheet.show(context, survey: survey);
    if (res == true && mounted) {
      Provider.of<SurveyProvider>(context, listen: false).fetchSurveys(isRefresh: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<SurveyProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        color: AppColors.emeraldGreen,
        onRefresh: () async {
          await provider.fetchSurveys(isRefresh: true);
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // Top Workspace Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header Card
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
                              color: AppColors.emeraldGreen.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.architecture_rounded, color: AppColors.emeraldGreen, size: 24),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "Site Surveys Workspace",
                                  style: AppTypography.headingSmall(color: textPrimary),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  "On-site technical feasibility, rooftop measurements & GPS verification.",
                                  style: AppTypography.caption(color: textSecondary),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Metrics Strip
                    Row(
                      children: [
                        Expanded(
                          child: _buildMetricTile(
                            label: "Total Surveys",
                            value: "${provider.totalCount}",
                            icon: Icons.assignment_outlined,
                            color: AppColors.skyBlue,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildMetricTile(
                            label: "Scheduled",
                            value: "${provider.scheduledCount}",
                            icon: Icons.schedule_rounded,
                            color: AppColors.solarGold,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildMetricTile(
                            label: "Completed",
                            value: "${provider.completedCount}",
                            icon: Icons.verified_outlined,
                            color: AppColors.emeraldGreen,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 14),

                    // Search Box
                    TextField(
                      controller: _searchController,
                      onChanged: _onSearch,
                      style: AppTypography.body(color: textPrimary),
                      decoration: InputDecoration(
                        hintText: "Search by customer name, lead code, phone...",
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
                          borderSide: const BorderSide(color: AppColors.emeraldGreen, width: 1.5),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),

                    const SizedBox(height: 10),

                    // Filter Chips
                    Row(
                      children: _filters.map((f) {
                        final isSelected = provider.selectedFilter == f;
                        final label = f[0].toUpperCase() + f.substring(1);
                        return Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: ChoiceChip(
                            label: Text(label),
                            selected: isSelected,
                            onSelected: (_) => _onFilterSelected(f),
                            backgroundColor: cardBg,
                            selectedColor: AppColors.emeraldGreen.withValues(alpha: 0.2),
                            labelStyle: TextStyle(
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                              color: isSelected ? AppColors.emeraldGreen : textSecondary,
                            ),
                            side: BorderSide(
                              color: isSelected ? AppColors.emeraldGreen : borderColor,
                            ),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            showCheckmark: false,
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
            ),

            // Content List
            if (provider.isLoading && provider.surveys.isEmpty)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.emeraldGreen),
                ),
              )
            else if (provider.surveys.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.assignment_turned_in_outlined, size: 48, color: textSecondary),
                        const SizedBox(height: 12),
                        Text(
                          "No site surveys found",
                          style: AppTypography.headingSmall(color: textPrimary),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "No assigned field surveys match your current filter.",
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
                      final s = provider.surveys[index];
                      return _buildSurveyCard(
                        survey: s,
                        cardBg: cardBg,
                        borderColor: borderColor,
                        textPrimary: textPrimary,
                        textSecondary: textSecondary,
                        isDark: isDark,
                      );
                    },
                    childCount: provider.surveys.length,
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
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
                label.toUpperCase(),
                style: TextStyle(
                  fontSize: 8.5,
                  fontWeight: FontWeight.w800,
                  color: textSecondary,
                  letterSpacing: 0.5,
                ),
              ),
              Icon(icon, size: 13, color: color),
            ],
          ),
          const SizedBox(height: 4),
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

  Widget _buildSurveyCard({
    required SurveyModel survey,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
    required bool isDark,
  }) {
    Color statusColor;
    if (survey.isCompleted) {
      statusColor = AppColors.emeraldGreen;
    } else if (survey.isScheduled) {
      statusColor = AppColors.solarGold;
    } else {
      statusColor = AppColors.errorRed;
    }

    return Container(
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
          // Header Row: Customer, Lead Code, Status Badge
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  survey.isCompleted ? Icons.verified_rounded : Icons.calendar_today_rounded,
                  size: 20,
                  color: statusColor,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      survey.customerName,
                      style: AppTypography.bodyMedium(color: textPrimary).copyWith(fontWeight: FontWeight.w800),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      "${survey.leadCode} • ${survey.requiredKw > 0 ? '${survey.requiredKw} kW' : 'Capacity TBD'}",
                      style: AppTypography.caption(color: textSecondary),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  survey.status.toUpperCase(),
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w800,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // Schedule Date & Time
          Row(
            children: [
              Icon(Icons.schedule_rounded, size: 13, color: textSecondary),
              const SizedBox(width: 4),
              Text(
                "${survey.scheduledDate ?? 'Date TBD'}  ${survey.scheduledTime ?? ''}",
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: textPrimary),
              ),
              if (survey.feasibilityVerdict != null) ...[
                const SizedBox(width: 8),
                Builder(
                  builder: (context) {
                    final Color verdictColor = survey.isFeasible
                        ? AppColors.emeraldGreen
                        : (survey.isFeasibleWithConditions
                            ? AppColors.solarGold
                            : (survey.isNotFeasible ? AppColors.errorRed : textSecondary));
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: verdictColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        survey.feasibilityVerdict!,
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          color: verdictColor,
                        ),
                      ),
                    );
                  },
                ),
              ],
            ],
          ),

          const SizedBox(height: 6),

          // Address
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.location_on_outlined, size: 14, color: textSecondary),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  survey.fullAddress,
                  style: TextStyle(fontSize: 11, color: textSecondary, height: 1.3),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),

          // Landmark if recorded
          if (survey.landmark != null && survey.landmark!.trim().isNotEmpty) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.near_me_outlined, size: 12, color: AppColors.skyBlue),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    "Landmark: ${survey.landmark}",
                    style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: AppColors.skyBlue),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],

          // GPS coordinates indicator
          if (survey.hasGps) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.gps_fixed_rounded, size: 11, color: AppColors.emeraldGreen),
                const SizedBox(width: 4),
                Text(
                  "Site GPS: ${survey.siteLatitude!.toStringAsFixed(5)}, ${survey.siteLongitude!.toStringAsFixed(5)}",
                  style: const TextStyle(fontSize: 10, color: AppColors.emeraldGreen, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ],

          // Linked project indicator
          if (survey.hasProject || survey.projectNumber != null) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.solar_power_outlined, size: 12, color: AppColors.skyBlue),
                const SizedBox(width: 4),
                Text(
                  "Project: ${survey.projectNumber ?? 'PRJ-${survey.projectId}'}",
                  style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: AppColors.skyBlue),
                ),
                if (survey.projectStage != null && survey.projectStage!.trim().isNotEmpty) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                    decoration: BoxDecoration(
                      color: AppColors.skyBlue.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      survey.projectStage!,
                      style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.skyBlue),
                    ),
                  ),
                ],
              ],
            ),
          ],

          // Feasibility specs if recorded
          if (survey.isCompleted && survey.roofType != null) ...[
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF18181B) : const Color(0xFFF4F4F5),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                "Roof: ${survey.roofType} • ${survey.roofAreaSqft != null ? '${survey.roofAreaSqft?.toInt()} sq ft' : ''} • ${survey.shadowConditions ?? 'No shadow'}",
                style: TextStyle(fontSize: 10, color: textSecondary),
              ),
            ),
          ],

          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 10),

          // Action Buttons: Call, Navigate, Documents, Report
          Row(
            children: [
              if (survey.mobileNumber.isNotEmpty) ...[
                IconButton(
                  onPressed: () => _makeCall(survey.mobileNumber),
                  icon: const Icon(Icons.call_rounded, size: 18, color: AppColors.emeraldGreen),
                  tooltip: "Call Client",
                  style: IconButton.styleFrom(
                    backgroundColor: AppColors.emeraldGreen.withValues(alpha: 0.1),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
                const SizedBox(width: 6),
              ],
              IconButton(
                onPressed: () => _navigateToSite(survey),
                icon: const Icon(Icons.navigation_rounded, size: 18, color: AppColors.skyBlue),
                tooltip: "Navigate to Site (Google Maps)",
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.skyBlue.withValues(alpha: 0.1),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
              const SizedBox(width: 6),
              IconButton(
                onPressed: () => _openDocumentsSheet(survey),
                icon: const Icon(Icons.folder_shared_outlined, size: 18, color: Colors.deepPurpleAccent),
                tooltip: "Survey Documents & Photos",
                style: IconButton.styleFrom(
                  backgroundColor: Colors.deepPurpleAccent.withValues(alpha: 0.1),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _openCompleteSurveySheet(survey),
                  icon: Icon(
                    survey.isCompleted ? Icons.edit_note_rounded : Icons.check_circle_outline_rounded,
                    size: 16,
                  ),
                  label: Text(
                    survey.isCompleted ? "Review Feasibility" : "Fill Feasibility Form",
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: survey.isCompleted ? const Color(0xFF0F172A) : AppColors.emeraldGreen,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

