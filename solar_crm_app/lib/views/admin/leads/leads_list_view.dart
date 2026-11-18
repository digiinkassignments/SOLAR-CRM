import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../models/lead_model.dart';
import '../../../providers/lead_provider.dart';
import 'widgets/lead_card.dart';
import 'add_lead_sheet.dart';
import 'log_call_sheet.dart';
import 'ai_copilot_sheet.dart';
import 'lead_details_sheet.dart';

class LeadsListView extends StatefulWidget {
  const LeadsListView({super.key});

  @override
  State<LeadsListView> createState() => _LeadsListViewState();
}

class _LeadsListViewState extends State<LeadsListView> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();

  final List<String> _stages = [
    "All",
    "New Lead",
    "Contacted",
    "Interested",
    "Site Survey",
    "Quotation Sent",
    "Negotiation",
    "Order Won",
    "Lost",
  ];

  final List<String> _priorities = [
    "All",
    "High",
    "Medium",
    "Low",
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<LeadProvider>(context, listen: false).fetchLeads(isRefresh: true);
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToTop() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _onSearch(String query) {
    Provider.of<LeadProvider>(context, listen: false).fetchLeads(search: query, isRefresh: true);
  }

  void _onStageSelected(String stage) {
    Provider.of<LeadProvider>(context, listen: false).fetchLeads(status: stage, isRefresh: true);
  }

  void _onPrioritySelected(String priority) {
    Provider.of<LeadProvider>(context, listen: false).fetchLeads(priority: priority, isRefresh: true);
  }

  void _openAddLeadSheet() async {
    final res = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const AddLeadSheet(),
    );
    if (res == true && mounted) {
      Provider.of<LeadProvider>(context, listen: false).fetchLeads(isRefresh: true);
    }
  }

  void _openLeadDetails(LeadModel lead) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => LeadDetailsSheet(lead: lead),
    );
  }

  void _openAiCopilot(LeadModel lead) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AiCopilotSheet(lead: lead),
    );
  }

  void _openLogCall(LeadModel lead) async {
    final res = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => LogCallSheet(lead: lead),
    );
    if (res == true && mounted) {
      Provider.of<LeadProvider>(context, listen: false).fetchLeads(isRefresh: true);
    }
  }

  void _confirmDeleteLead(LeadModel lead) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          "Delete Lead?",
          style: AppTypography.heading(size: 18, color: AppColors.errorRed),
        ),
        content: Text(
          "Are you sure you want to delete lead ${lead.leadCode} (${lead.customerName})? This action cannot be undone.",
          style: AppTypography.body(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final provider = Provider.of<LeadProvider>(context, listen: false);
              final res = await provider.deleteLead(lead.id);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(res['message'] ?? (res['success'] ? 'Lead deleted' : 'Delete failed')),
                    backgroundColor: res['success'] ? AppColors.successGreen : AppColors.errorRed,
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.errorRed,
              foregroundColor: Colors.white,
            ),
            child: const Text("Delete"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final leadProvider = Provider.of<LeadProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      floatingActionButton: FloatingActionButton.extended(
        heroTag: null,
        onPressed: _openAddLeadSheet,
        backgroundColor: AppColors.brandPrimary,
        foregroundColor: Colors.black,
        icon: const Icon(Icons.person_add_alt_1_rounded, size: 20),
        label: Text("New Lead", style: AppTypography.button(color: Colors.black)),
      ),
      body: RefreshIndicator(
        color: AppColors.brandPrimary,
        backgroundColor: cardBg,
        onRefresh: () => leadProvider.fetchLeads(isRefresh: true),
        child: CustomScrollView(
          controller: _scrollController,
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // Top Controls (Pipeline Toggle, Search & Filters)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Top Segmented Switcher: [ All Pipeline Leads ] vs [ 🔔 Today's Follow-ups ]
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: borderColor),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                if (leadProvider.isTodayFollowupsOnly) {
                                  leadProvider.toggleTodayFollowups(false);
                                  _scrollToTop();
                                }
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 9),
                                decoration: BoxDecoration(
                                  color: !leadProvider.isTodayFollowupsOnly
                                      ? AppColors.brandPrimary
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.hub_rounded,
                                      size: 16,
                                      color: !leadProvider.isTodayFollowupsOnly
                                          ? Colors.black
                                          : textSecondary,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      "All Pipeline",
                                      style: AppTypography.caption(
                                        color: !leadProvider.isTodayFollowupsOnly
                                            ? Colors.black
                                            : textSecondary,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                if (!leadProvider.isTodayFollowupsOnly) {
                                  leadProvider.toggleTodayFollowups(true);
                                  _scrollToTop();
                                }
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 9),
                                decoration: BoxDecoration(
                                  color: leadProvider.isTodayFollowupsOnly
                                      ? AppColors.brandPrimary
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.event_available_rounded,
                                      size: 16,
                                      color: leadProvider.isTodayFollowupsOnly
                                          ? Colors.black
                                          : AppColors.amberDark,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      "Today's Action",
                                      style: AppTypography.caption(
                                        color: leadProvider.isTodayFollowupsOnly
                                            ? Colors.black
                                            : textPrimary,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                      decoration: BoxDecoration(
                                        color: leadProvider.isTodayFollowupsOnly
                                            ? Colors.black.withValues(alpha: 0.15)
                                            : AppColors.amberDark.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Text(
                                        "TODAY",
                                        style: TextStyle(
                                          fontSize: 9,
                                          fontWeight: FontWeight.bold,
                                          color: leadProvider.isTodayFollowupsOnly
                                              ? Colors.black
                                              : AppColors.amberDark,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Search Bar
                    TextField(
                      controller: _searchController,
                      onSubmitted: _onSearch,
                      style: AppTypography.body(color: textPrimary),
                      decoration: InputDecoration(
                        hintText: leadProvider.isTodayFollowupsOnly
                            ? "Search today's action leads..."
                            : "Search lead by name, phone, code, city...",
                        hintStyle: AppTypography.caption(color: textSecondary),
                        prefixIcon: const Icon(Icons.search_rounded, color: AppColors.brandPrimary, size: 22),
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
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
                          borderSide: const BorderSide(color: AppColors.brandPrimary, width: 1.5),
                        ),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Stage Filter Pills
                    SizedBox(
                      height: 38,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _stages.length,
                        separatorBuilder: (context, index) => const SizedBox(width: 8),
                        itemBuilder: (context, i) {
                          final stage = _stages[i];
                          final isSelected = (leadProvider.selectedStatus.isEmpty && stage == "All") ||
                              leadProvider.selectedStatus == stage;

                          return ChoiceChip(
                            label: Text(stage),
                            selected: isSelected,
                            onSelected: (_) => _onStageSelected(stage),
                            selectedColor: AppColors.brandPrimary,
                            backgroundColor: cardBg,
                            labelStyle: AppTypography.caption(
                              color: isSelected ? Colors.black : textSecondary,
                              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                            ),
                            side: BorderSide(
                              color: isSelected ? AppColors.brandPrimary : borderColor,
                              width: 1,
                            ),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                            showCheckmark: false,
                          );
                        },
                      ),
                    ),

                    const SizedBox(height: 10),

                    // Priority Filter Pills + Total Count
                    Row(
                      children: [
                        Text(
                          "Priority:",
                          style: AppTypography.caption(color: textSecondary, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: SizedBox(
                            height: 32,
                            child: ListView.separated(
                              scrollDirection: Axis.horizontal,
                              itemCount: _priorities.length,
                              separatorBuilder: (context, index) => const SizedBox(width: 6),
                              itemBuilder: (context, i) {
                                final prio = _priorities[i];
                                final isSelected = (leadProvider.selectedPriority.isEmpty && prio == "All") ||
                                    leadProvider.selectedPriority == prio;

                                Color prioColor = AppColors.brandPrimary;
                                if (prio == "High") prioColor = AppColors.errorRed;
                                if (prio == "Medium") prioColor = AppColors.brandPrimary;
                                if (prio == "Low") prioColor = AppColors.skyBlue;

                                return FilterChip(
                                  label: Text(prio),
                                  selected: isSelected,
                                  onSelected: (_) => _onPrioritySelected(prio),
                                  selectedColor: prioColor.withValues(alpha: 0.2),
                                  backgroundColor: Colors.transparent,
                                  labelStyle: AppTypography.badge(
                                    color: isSelected ? prioColor : textSecondary,
                                  ),
                                  side: BorderSide(
                                    color: isSelected ? prioColor : borderColor,
                                  ),
                                  padding: const EdgeInsets.symmetric(horizontal: 4),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                  showCheckmark: false,
                                );
                              },
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: cardBg,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: borderColor),
                          ),
                          child: Text(
                            "${leadProvider.totalRecords} Leads",
                            style: AppTypography.badge(color: AppColors.brandPrimary),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // Content Area: Loading / Error / Empty / List with 10 items
            if (leadProvider.isLoading && leadProvider.leads.isEmpty)
              const SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(color: AppColors.brandPrimary),
                      SizedBox(height: 16),
                      Text("Loading solar pipeline leads..."),
                    ],
                  ),
                ),
              )
            else if (leadProvider.errorMessage != null && leadProvider.leads.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.cloud_off_rounded, color: AppColors.errorRed, size: 48),
                        const SizedBox(height: 16),
                        Text(
                          leadProvider.errorMessage!,
                          textAlign: TextAlign.center,
                          style: AppTypography.body(color: textPrimary),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: () => leadProvider.fetchLeads(isRefresh: true),
                          icon: const Icon(Icons.refresh_rounded),
                          label: const Text("Retry"),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.brandPrimary,
                            foregroundColor: Colors.black,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else if (leadProvider.leads.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: AppColors.brandPrimary.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.rule_folder_outlined, color: AppColors.brandPrimary, size: 40),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          leadProvider.isTodayFollowupsOnly
                              ? "No Follow-ups Today"
                              : "No Leads Found",
                          style: AppTypography.heading(size: 20, color: textPrimary),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          leadProvider.isTodayFollowupsOnly
                              ? "All tasks and follow-up activities for today are up-to-date!"
                              : (leadProvider.searchQuery.isNotEmpty
                                  ? "No results matched '${leadProvider.searchQuery}'."
                                  : "No leads are currently available in this stage or filter."),
                          textAlign: TextAlign.center,
                          style: AppTypography.body(color: textSecondary),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton.icon(
                          onPressed: _openAddLeadSheet,
                          icon: const Icon(Icons.add_rounded, size: 20),
                          label: const Text("Create First Lead"),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.brandPrimary,
                            foregroundColor: Colors.black,
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else ...[
              // Leads List (10 Leads Per Page)
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final lead = leadProvider.leads[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: LeadCard(
                          lead: lead,
                          onViewDetails: _openLeadDetails,
                          onOpenCopilot: _openAiCopilot,
                          onLogCall: _openLogCall,
                          onEdit: (l) {
                            _openLeadDetails(l);
                          },
                          onDelete: _confirmDeleteLead,
                        ),
                      );
                    },
                    childCount: leadProvider.leads.length,
                  ),
                ),
              ),

              // Numbered 1, 2, 3, 4, 5 Pagination Bar
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _buildPaginationBar(
                    leadProvider: leadProvider,
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                    textSecondary: textSecondary,
                  ),
                ),
              ),

              // Bottom Spacer for Floating Action Button
              const SliverToBoxAdapter(
                child: SizedBox(height: 72),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildPaginationBar({
    required LeadProvider leadProvider,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
  }) {
    final currentPage = leadProvider.currentPage;
    final totalPages = leadProvider.totalPages;
    final totalRecords = leadProvider.totalRecords;

    if (totalRecords == 0) return const SizedBox.shrink();

    final startItem = (currentPage - 1) * 10 + 1;
    final endItem = ((currentPage - 1) * 10 + leadProvider.leads.length);

    // Dynamic page numbers window e.g. [1, 2, 3, 4, 5]
    List<int> pages = [];
    if (totalPages <= 5) {
      pages = List.generate(totalPages, (i) => i + 1);
    } else {
      int start = currentPage - 2;
      int end = currentPage + 2;
      if (start < 1) {
        end += (1 - start);
        start = 1;
      }
      if (end > totalPages) {
        start -= (end - totalPages);
        end = totalPages;
      }
      start = start.clamp(1, totalPages);
      end = end.clamp(1, totalPages);
      pages = [for (int i = start; i <= end; i++) i];
    }

    return Container(
      margin: const EdgeInsets.only(top: 8, bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          // Range description
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Showing $startItem–$endItem of $totalRecords leads",
                style: AppTypography.caption(color: textSecondary),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.brandPrimary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  "Page $currentPage of $totalPages",
                  style: AppTypography.badge(color: AppColors.brandPrimary),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Divider(color: borderColor, height: 1),
          const SizedBox(height: 12),

          // Pagination Buttons: [ < Prev ]   [ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ]   [ Next > ]
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Previous button
              InkWell(
                onTap: currentPage > 1
                    ? () {
                        leadProvider.goToPage(currentPage - 1);
                        _scrollToTop();
                      }
                    : null,
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: currentPage > 1
                        ? borderColor.withValues(alpha: 0.2)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: currentPage > 1 ? borderColor : borderColor.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.chevron_left_rounded,
                        size: 18,
                        color: currentPage > 1 ? textPrimary : textSecondary.withValues(alpha: 0.3),
                      ),
                      const SizedBox(width: 2),
                      Text(
                        "Prev",
                        style: AppTypography.caption(
                          color: currentPage > 1 ? textPrimary : textSecondary.withValues(alpha: 0.3),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(width: 8),

              // Numbered Page Buttons: 1, 2, 3, 4, 5...
              Flexible(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: pages.map((p) {
                      final isCurrent = p == currentPage;
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 3),
                        child: InkWell(
                          onTap: () {
                            leadProvider.goToPage(p);
                            _scrollToTop();
                          },
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            width: 36,
                            height: 36,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: isCurrent ? AppColors.brandPrimary : Colors.transparent,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isCurrent ? AppColors.brandPrimary : borderColor,
                                width: isCurrent ? 1.5 : 1,
                              ),
                            ),
                            child: Text(
                              "$p",
                              style: AppTypography.caption(
                                color: isCurrent ? Colors.black : textPrimary,
                                fontWeight: isCurrent ? FontWeight.bold : FontWeight.w500,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),

              const SizedBox(width: 8),

              // Next button
              InkWell(
                onTap: currentPage < totalPages
                    ? () {
                        leadProvider.goToPage(currentPage + 1);
                        _scrollToTop();
                      }
                    : null,
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: currentPage < totalPages
                        ? borderColor.withValues(alpha: 0.2)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: currentPage < totalPages ? borderColor : borderColor.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        "Next",
                        style: AppTypography.caption(
                          color: currentPage < totalPages ? textPrimary : textSecondary.withValues(alpha: 0.3),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 2),
                      Icon(
                        Icons.chevron_right_rounded,
                        size: 18,
                        color: currentPage < totalPages ? textPrimary : textSecondary.withValues(alpha: 0.3),
                      ),
                    ],
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
