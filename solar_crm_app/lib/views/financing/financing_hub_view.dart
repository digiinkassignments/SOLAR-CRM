import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../models/subsidy_model.dart';
import '../../models/loan_model.dart';
import '../../providers/financing_provider.dart';
import 'sheets/apply_subsidy_sheet.dart';
import 'sheets/subsidy_detail_sheet.dart';
import 'sheets/loan_sheet.dart';

class FinancingHubView extends StatefulWidget {
  final int initialTab;
  const FinancingHubView({super.key, this.initialTab = 0});

  @override
  State<FinancingHubView> createState() => _FinancingHubViewState();
}

class _FinancingHubViewState extends State<FinancingHubView> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Search and Filter State - Subsidy
  final TextEditingController _subsidySearchController = TextEditingController();
  String _selectedSubsidyStage = 'All';

  // Search and Filter State - Loans
  final TextEditingController _loanSearchController = TextEditingController();
  String _selectedLoanStage = 'All';

  final List<String> _subsidyStages = [
    'All',
    'registered',
    'feasibility_approved',
    'vendor_selected',
    'agreement_uploaded',
    'installed_docs_uploaded',
    'net_meter_applied',
    'commissioning_issued',
    'bank_details_submitted',
    'subsidy_credited',
    'rejected',
  ];

  final List<String> _loanStages = [
    'All',
    'Eligibility & Docs',
    'Applied',
    'Under Review',
    'Sanctioned',
    'Disbursed',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this, initialIndex: widget.initialTab);
    _tabController.addListener(() {
      setState(() {});
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _subsidySearchController.dispose();
    _loanSearchController.dispose();
    super.dispose();
  }

  void _loadData() {
    final provider = Provider.of<FinancingProvider>(context, listen: false);
    provider.fetchSubsidies(
      search: _subsidySearchController.text.trim(),
      status: _selectedSubsidyStage,
    );
    provider.fetchLoans(
      search: _loanSearchController.text.trim(),
      stage: _selectedLoanStage,
    );
    provider.fetchLoanStats();
  }

  Future<void> _openNationalPortal() async {
    final uri = Uri.parse("https://pmsuryaghar.gov.in/");
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Could not launch National Portal url")),
        );
      }
    }
  }

  void _copyPortalDataPack(SubsidyItemModel item) {
    final text = """=== PM SURYA GHAR PORTAL DATA PACK ===
Applicant: ${item.customerName}
Electricity Bill CA No.: ${item.consumerNumber ?? "N/A"}
PM Surya Ghar App No.: ${item.portalAckNo ?? "Pending"}
Address: ${[item.address, item.city, item.state, item.pincode].where((e) => e != null && e.isNotEmpty).join(", ")}
Capacity: ${item.plantCapacity} kW
DISCOM: ${item.discom ?? "Not recorded"} (${item.discomDivision ?? item.city ?? "Circle Office"})
DCR Compliant: ${item.isDcrCompliant == true ? "YES (Recorded Compliant)" : "Needs Verification"}
Expected Subsidy: ₹${item.expectedSubsidy.toStringAsFixed(0)}
Current Portal Stage: ${item.stage}
======================================""";

    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("Copied Portal Data Pack for ${item.customerName}!"),
        backgroundColor: AppColors.brandNavy,
        behavior: SnackBarBehavior.floating,
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

    final provider = Provider.of<FinancingProvider>(context);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Subsidy & Finance", style: AppTypography.headingSmall(color: textPrimary)),
            Text("PM Surya Ghar & Rooftop Solar Loans", style: AppTypography.caption(color: textSecondary)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: "Refresh",
            onPressed: _loadData,
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: borderColor)),
            ),
            child: TabBar(
              controller: _tabController,
              indicatorColor: AppColors.brandPrimary,
              labelColor: AppColors.brandPrimary,
              unselectedLabelColor: textSecondary,
              labelStyle: AppTypography.bodySmall(fontWeight: FontWeight.w700),
              unselectedLabelStyle: AppTypography.bodySmall(),
              tabs: const [
                Tab(
                  icon: Icon(Icons.account_balance_outlined, size: 18),
                  text: "Subsidy Tracker",
                ),
                Tab(
                  icon: Icon(Icons.payments_outlined, size: 18),
                  text: "Solar Loans",
                ),
              ],
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: Subsidy Tracker
          _buildSubsidyTab(provider, isDark, cardBg, borderColor, textPrimary, textSecondary),

          // Tab 2: Solar Loans
          _buildLoansTab(provider, isDark, cardBg, borderColor, textPrimary, textSecondary),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: null,
        backgroundColor: AppColors.brandPrimary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_rounded),
        label: Text(
          _tabController.index == 0 ? "Apply Subsidy" : "New Loan",
          style: AppTypography.button(),
        ),
        onPressed: () {
          if (_tabController.index == 0) {
            ApplySubsidySheet.show(context);
          } else {
            LoanSheet.show(context);
          }
        },
      ),
    );
  }

  // ==========================================
  // TAB 1: SUBSIDY TRACKER
  // ==========================================
  Widget _buildSubsidyTab(
    FinancingProvider provider,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final subsidies = provider.subsidies;
    final stats = provider.subsidyStats;
    final isLoading = provider.isLoadingSubsidies;

    final totalProjects = stats.totalProjects > 0 ? stats.totalProjects : provider.totalSubsidies;
    final feasibilityCount = stats.countFeasibility > 0 ? stats.countFeasibility : subsidies.where((s) => s.stage == 'feasibility_approved').length;
    final netMeterCount = stats.countNetMeter > 0 ? stats.countNetMeter : subsidies.where((s) => s.stage == 'net_meter_applied' || s.stage == 'commissioning_issued').length;
    final creditedCount = stats.countCredited > 0 ? stats.countCredited : subsidies.where((s) => s.stage == 'subsidy_credited' || s.stage == 'disbursed').length;

    return RefreshIndicator(
      onRefresh: () async => _loadData(),
      child: Column(
        children: [
          // Top KPI Strip (4 Cards matching Web CRM)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildKpiCard(
                    title: "TRACKED PROJECTS",
                    value: totalProjects.toString(),
                    subtitle: "National Portal registered",
                    color: AppColors.brandNavy == textPrimary ? AppColors.brandPrimary : const Color(0xFF60A5FA),
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                  ),
                  const SizedBox(width: 8),
                  _buildKpiCard(
                    title: "FEASIBILITY",
                    value: feasibilityCount.toString(),
                    subtitle: "DISCOM feasibility OK",
                    color: const Color(0xFF8B5CF6),
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                  ),
                  const SizedBox(width: 8),
                  _buildKpiCard(
                    title: "NET METERING",
                    value: netMeterCount.toString(),
                    subtitle: "Inspection & grid sync",
                    color: const Color(0xFFEA580C),
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                  ),
                  const SizedBox(width: 8),
                  _buildKpiCard(
                    title: "SUBSIDY CREDITED",
                    value: creditedCount.toString(),
                    subtitle: "Govt DBT transferred",
                    color: AppColors.emeraldGreen,
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                  ),
                ],
              ),
            ),
          ),

          // Financial Summary Strip & National Portal Link
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: borderColor),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        RichText(
                          text: TextSpan(
                            style: AppTypography.caption(color: textSecondary),
                            children: [
                              const TextSpan(text: "Expected Subsidy: "),
                              TextSpan(
                                text: Formatters.formatCurrency(stats.totalExpectedSubsidy > 0 ? stats.totalExpectedSubsidy : 78000.0 * totalProjects),
                                style: TextStyle(fontWeight: FontWeight.w700, color: textPrimary),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 2),
                        RichText(
                          text: TextSpan(
                            style: AppTypography.caption(color: textSecondary),
                            children: [
                              const TextSpan(text: "Recorded Credits: "),
                              TextSpan(
                                text: Formatters.formatCurrency(stats.totalDisbursedSubsidy),
                                style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.emeraldGreen),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  InkWell(
                    onTap: _openNationalPortal,
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.brandPrimary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: AppColors.brandPrimary.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.open_in_new_rounded, size: 12, color: AppColors.brandPrimary),
                          const SizedBox(width: 4),
                          Text(
                            "Portal",
                            style: AppTypography.badge(color: AppColors.brandPrimary),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Search & Filter Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: TextField(
              controller: _subsidySearchController,
              decoration: InputDecoration(
                hintText: "Search customer, consumer #, ack no...",
                prefixIcon: const Icon(Icons.search_rounded, size: 18),
                suffixIcon: _subsidySearchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.close_rounded, size: 16),
                        onPressed: () {
                          _subsidySearchController.clear();
                          provider.fetchSubsidies(status: _selectedSubsidyStage);
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onSubmitted: (_) {
                provider.fetchSubsidies(
                  search: _subsidySearchController.text.trim(),
                  status: _selectedSubsidyStage,
                );
              },
            ),
          ),

          // Filter Chips (PM Surya Ghar 9 Portal Stages)
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Row(
              children: _subsidyStages.map((stage) {
                final isSelected = _selectedSubsidyStage == stage;
                final cleanName = stage == 'All'
                    ? 'All Stages'
                    : (SubsidyItemModel.stageMeta[stage]?['label'] as String? ?? stage);

                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: FilterChip(
                    label: Text(cleanName),
                    selected: isSelected,
                    onSelected: (_) {
                      setState(() => _selectedSubsidyStage = stage);
                      provider.fetchSubsidies(
                        search: _subsidySearchController.text.trim(),
                        status: stage,
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
              }).toList(),
            ),
          ),

          // Subsidies List
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.brandPrimary))
                : subsidies.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.account_balance_outlined, size: 48, color: Colors.grey),
                            const SizedBox(height: 12),
                            Text("No subsidy applications found", style: AppTypography.bodyMedium(color: textSecondary)),
                            const SizedBox(height: 8),
                            ElevatedButton.icon(
                              onPressed: () => ApplySubsidySheet.show(context),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.brandPrimary,
                                foregroundColor: Colors.white,
                              ),
                              icon: const Icon(Icons.add_rounded, size: 16),
                              label: const Text("Apply for PM Surya Ghar"),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.only(left: 16, right: 16, top: 6, bottom: 80),
                        itemCount: subsidies.length,
                        itemBuilder: (ctx, idx) {
                          final item = subsidies[idx];
                          return _buildSubsidyCard(item, isDark, cardBg, borderColor, textPrimary, textSecondary);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubsidyCard(
    SubsidyItemModel item,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final info = item.stageInfo;
    final color = info['color'] as Color;
    final label = info['label'] as String;
    final owner = info['owner'] as String;
    final expectedDays = item.slaExpectedDays ?? (info['expectedDays'] as int);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Lead # & Stage
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.brandPrimary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text("LEAD #${item.leadId}", style: AppTypography.badge(color: AppColors.brandPrimary)),
              ),
              const SizedBox(width: 6),
              if (item.isDcrCompliant != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: item.isDcrCompliant == true ? AppColors.emeraldGreen.withValues(alpha: 0.12) : const Color(0xFFF59E0B).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    item.isDcrCompliant == true ? "DCR" : "VERIFY DCR",
                    style: AppTypography.badge(color: item.isDcrCompliant == true ? AppColors.emeraldGreen : const Color(0xFFF59E0B)),
                  ),
                ),
              const Spacer(),
              Container(
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
                    Text(label, style: AppTypography.badge(color: color)),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),

          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.customerName,
                      style: AppTypography.bodyMedium(color: textPrimary, fontWeight: FontWeight.w700),
                    ),
                    if (item.customerPhone != null && item.customerPhone!.isNotEmpty)
                      Text(item.customerPhone!, style: AppTypography.caption(color: textSecondary)),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.copy_rounded, size: 16),
                tooltip: "Copy Portal Data Pack",
                onPressed: () => _copyPortalDataPack(item),
              ),
            ],
          ),

          const SizedBox(height: 6),

          // Details row
          Row(
            children: [
              Expanded(
                child: Text(
                  "Consumer: ${item.consumerNumber ?? 'Pending'} • ${item.discom ?? 'DISCOM'}",
                  style: AppTypography.caption(color: textSecondary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Text(
                "Subsidy: ${Formatters.formatCurrency(item.expectedSubsidy)}",
                style: AppTypography.bodySmall(color: AppColors.emeraldGreen, fontWeight: FontWeight.w700),
              ),
            ],
          ),

          const SizedBox(height: 4),
          Text(
            "Capacity: ${item.plantCapacity} kW • Owner: $owner • ${item.daysInStage != null ? '${item.daysInStage} days in stage' : 'SLA: $expectedDays Days'}",
            style: AppTypography.caption(color: textSecondary),
          ),

          const SizedBox(height: 10),
          const Divider(),
          const SizedBox(height: 4),

          // Actions (Responsive to avoid overflow)
          Row(
            children: [
              Expanded(
                flex: 1,
                child: OutlinedButton.icon(
                  onPressed: () {
                    ApplySubsidySheet.show(
                      context,
                      leadId: item.leadId,
                      customerName: item.customerName,
                      consumerNo: item.consumerNumber,
                      capacity: item.plantCapacity,
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                    side: BorderSide(color: borderColor),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  icon: const Icon(Icons.edit_outlined, size: 14),
                  label: const Text(
                    "Edit Info",
                    style: TextStyle(fontSize: 12),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                flex: 2,
                child: ElevatedButton.icon(
                  onPressed: () {
                    SubsidyDetailSheet.show(
                      context,
                      leadId: item.leadId,
                      customerName: item.customerName,
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.brandPrimary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  icon: const Icon(Icons.folder_shared_outlined, size: 14),
                  label: const Text(
                    "Vault (Camera / Docs)",
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ==========================================
  // TAB 2: SOLAR LOANS
  // ==========================================
  Widget _buildLoansTab(
    FinancingProvider provider,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final loans = provider.loans;
    final stats = provider.loanStats;
    final isLoading = provider.isLoadingLoans;

    return RefreshIndicator(
      onRefresh: () async => _loadData(),
      child: Column(
        children: [
          // 4 Stats Cards matching Web CRM
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildKpiCard(
                    title: "TOTAL LOANS",
                    value: stats.totalLoans.toString(),
                    subtitle: "Solar financing cases",
                    color: AppColors.skyBlue,
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                  ),
                  const SizedBox(width: 8),
                  _buildKpiCard(
                    title: "IN PROCESS",
                    value: stats.inProcessLoans.toString(),
                    subtitle: "Under bank review",
                    color: const Color(0xFFD97706),
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                  ),
                  const SizedBox(width: 8),
                  _buildKpiCard(
                    title: "SANCTIONED",
                    value: stats.sanctionedLoans.toString(),
                    subtitle: "Approved by bank",
                    color: const Color(0xFF6366F1),
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                  ),
                  const SizedBox(width: 8),
                  _buildKpiCard(
                    title: "DISBURSED VALUE",
                    value: Formatters.formatCurrency(stats.totalDisbursedAmount, compact: true),
                    subtitle: "Lender payments completed",
                    color: AppColors.emeraldGreen,
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                  ),
                ],
              ),
            ),
          ),

          // Search Field
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: TextField(
              controller: _loanSearchController,
              decoration: InputDecoration(
                hintText: "Search customer, bank, application #...",
                prefixIcon: const Icon(Icons.search_rounded, size: 18),
                suffixIcon: _loanSearchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.close_rounded, size: 16),
                        onPressed: () {
                          _loanSearchController.clear();
                          provider.fetchLoans(stage: _selectedLoanStage);
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onSubmitted: (_) {
                provider.fetchLoans(
                  search: _loanSearchController.text.trim(),
                  stage: _selectedLoanStage,
                );
              },
            ),
          ),

          // Loan Stage Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Row(
              children: _loanStages.map((stage) {
                final isSelected = _selectedLoanStage == stage;
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: FilterChip(
                    label: Text(stage),
                    selected: isSelected,
                    onSelected: (_) {
                      setState(() => _selectedLoanStage = stage);
                      provider.fetchLoans(
                        search: _loanSearchController.text.trim(),
                        stage: stage,
                      );
                    },
                    selectedColor: AppColors.skyBlue.withValues(alpha: 0.15),
                    labelStyle: AppTypography.caption(
                      color: isSelected ? AppColors.skyBlue : textSecondary,
                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    ),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                );
              }).toList(),
            ),
          ),

          // Loans List
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.brandPrimary))
                : loans.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.payments_outlined, size: 48, color: Colors.grey),
                            const SizedBox(height: 12),
                            Text("No solar loan applications found", style: AppTypography.bodyMedium(color: textSecondary)),
                            const SizedBox(height: 8),
                            ElevatedButton.icon(
                              onPressed: () => LoanSheet.show(context),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.brandPrimary,
                                foregroundColor: Colors.white,
                              ),
                              icon: const Icon(Icons.add_rounded, size: 16),
                              label: const Text("New Loan Application"),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.only(left: 16, right: 16, top: 6, bottom: 80),
                        itemCount: loans.length,
                        itemBuilder: (ctx, idx) {
                          final item = loans[idx];
                          return _buildLoanCard(item, isDark, cardBg, borderColor, textPrimary, textSecondary);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoanCard(
    LoanItemModel item,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final meta = item.stageMeta;
    final color = meta['color'] as Color;
    final percent = meta['percent'] as double;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Bank & Stage
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(item.bankName, style: AppTypography.badge(color: color)),
              ),
              const SizedBox(width: 8),
              if (!item.isSideStatusActive)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.errorRed.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(item.sideStatus.toUpperCase(), style: AppTypography.badge(color: AppColors.errorRed)),
                ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(item.loanStage, style: AppTypography.badge(color: color)),
              ),
            ],
          ),

          const SizedBox(height: 8),

          Text(
            item.customerName,
            style: AppTypography.bodyMedium(color: textPrimary, fontWeight: FontWeight.w700),
          ),
          if (item.customerPhone != null && item.customerPhone!.isNotEmpty)
            Text(item.customerPhone!, style: AppTypography.caption(color: textSecondary)),

          const SizedBox(height: 10),

          // 4-box financial summary
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Requested", style: AppTypography.caption(color: textSecondary)),
                    Text(Formatters.formatCurrency(item.loanAmountApplied), style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Sanctioned", style: AppTypography.caption(color: textSecondary)),
                    Text(Formatters.formatCurrency(item.sanctionedAmount), style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Disbursed", style: AppTypography.caption(color: textSecondary)),
                    Text(Formatters.formatCurrency(item.disbursedAmount), style: AppTypography.bodySmall(color: AppColors.emeraldGreen, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // EMI & Progress
          Row(
            children: [
              Expanded(
                child: Text(
                  "EMI: ₹${item.monthlyEmi.toStringAsFixed(0)} / mo • ${item.tenureMonths} Mos @ ${item.interestRate}%",
                  style: AppTypography.caption(color: textSecondary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                "Stage ${(percent * 5).toInt()} of 5",
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

          const SizedBox(height: 10),
          const Divider(),
          const SizedBox(height: 4),

          // Edit & Open Action
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              OutlinedButton.icon(
                onPressed: () {
                  LoanSheet.show(
                    context,
                    existingLoan: item,
                  );
                },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  side: BorderSide(color: borderColor),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                icon: const Icon(Icons.edit_outlined, size: 14),
                label: const Text("Manage Loan", style: TextStyle(fontSize: 12)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildKpiCard({
    required String title,
    required String value,
    required String subtitle,
    required Color color,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
  }) {
    return Container(
      width: 155,
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            child: Container(color: color),
          ),
          Padding(
            padding: const EdgeInsets.only(left: 14, right: 12, top: 10, bottom: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: color,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
