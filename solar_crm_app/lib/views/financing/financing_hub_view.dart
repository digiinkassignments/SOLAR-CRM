import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
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
  final int initialTab; // 0: Subsidies, 1: Loans

  const FinancingHubView({super.key, this.initialTab = 0});

  @override
  State<FinancingHubView> createState() => _FinancingHubViewState();
}

class _FinancingHubViewState extends State<FinancingHubView> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final TextEditingController _subsidySearchController = TextEditingController();
  final TextEditingController _loanSearchController = TextEditingController();

  String _selectedSubsidyStage = 'All';
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
        backgroundColor: AppColors.brandPrimary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_rounded),
        label: Text(
          _tabController.index == 0 ? "Apply Subsidy" : "New Loan",
          style: const TextStyle(fontWeight: FontWeight.w700),
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
    final isLoading = provider.isLoadingSubsidies;

    final creditedCount = subsidies.where((s) => s.stage == 'subsidy_credited' || s.stage == 'disbursed').length;
    final feasibilityCount = subsidies.where((s) => s.stage == 'feasibility_approved').length;

    return RefreshIndicator(
      onRefresh: () async => _loadData(),
      child: Column(
        children: [
          // Top KPI Strip
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildKpiCard(
                    title: "APPLICATIONS",
                    value: provider.totalSubsidies.toString(),
                    subtitle: "National Portal registered",
                    color: AppColors.brandPrimary,
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                  ),
                  const SizedBox(width: 8),
                  _buildKpiCard(
                    title: "FEASIBILITY OK",
                    value: feasibilityCount.toString(),
                    subtitle: "Approved by DISCOM",
                    color: const Color(0xFF7C3AED),
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

          // Filter Chips
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
                ? const Center(child: CircularProgressIndicator())
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
    final days = info['expectedDays'] as int;

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

          Text(
            item.customerName,
            style: AppTypography.bodyMedium(color: textPrimary, fontWeight: FontWeight.w700),
          ),
          if (item.customerPhone != null && item.customerPhone!.isNotEmpty)
            Text(item.customerPhone!, style: AppTypography.caption(color: textSecondary)),

          const SizedBox(height: 8),

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
                "Subsidy: ${Formatters.formatCurrency(item.calculatedSubsidy)}",
                style: AppTypography.bodySmall(color: AppColors.emeraldGreen, fontWeight: FontWeight.w700),
              ),
            ],
          ),

          const SizedBox(height: 6),
          Text(
            "Capacity: ${item.plantCapacity} kW • Owner: $owner • SLA: $days Days",
            style: AppTypography.caption(color: textSecondary),
          ),

          const SizedBox(height: 10),
          const Divider(),
          const SizedBox(height: 4),

          // Actions
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              OutlinedButton.icon(
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
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  side: BorderSide(color: borderColor),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                icon: const Icon(Icons.edit_outlined, size: 14),
                label: const Text("Edit Portal Info", style: TextStyle(fontSize: 12)),
              ),
              const SizedBox(width: 8),
              ElevatedButton.icon(
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
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                icon: const Icon(Icons.folder_shared_outlined, size: 14),
                label: const Text("Open Vault (Camera / Docs)", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
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
          // 4 Stats Cards
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
                    title: "DISBURSED VALUE",
                    value: Formatters.formatCurrency(stats.totalDisbursedAmount, compact: true),
                    subtitle: "Lender payments completed",
                    color: AppColors.emeraldGreen,
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
                ? const Center(child: CircularProgressIndicator())
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
          // Top: Bank & Status
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(item.loanStage.toUpperCase(), style: AppTypography.badge(color: color)),
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
              Text(
                Formatters.formatCurrency(item.sanctionedAmount > 0 ? item.sanctionedAmount : item.loanAmountApplied),
                style: AppTypography.bodyMedium(color: color, fontWeight: FontWeight.w700),
              ),
            ],
          ),

          const SizedBox(height: 8),

          Text(
            item.customerName,
            style: AppTypography.bodyMedium(color: textPrimary, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 2),
          Text(
            "Lender: ${item.bankName}",
            style: AppTypography.caption(color: textSecondary, fontWeight: FontWeight.w600),
          ),

          const SizedBox(height: 8),

          // Stage Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: percent,
              backgroundColor: isDark ? Colors.white10 : Colors.grey.shade200,
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 5,
            ),
          ),

          const SizedBox(height: 8),

          // Financial Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Applied: ${Formatters.formatCurrency(item.loanAmountApplied)}",
                style: AppTypography.caption(color: textSecondary),
              ),
              Text(
                "EMI: ₹${item.monthlyEmi.toStringAsFixed(0)} / mo (${item.tenureMonths}m @ ${item.interestRate}%)",
                style: AppTypography.caption(color: AppColors.emeraldGreen, fontWeight: FontWeight.w700),
              ),
            ],
          ),

          if (item.portalApplicationNo != null && item.portalApplicationNo!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              "Ref: ${item.portalApplicationNo}",
              style: AppTypography.caption(color: textSecondary),
            ),
          ],

          const SizedBox(height: 10),
          const Divider(),
          const SizedBox(height: 4),

          // Action Buttons
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              OutlinedButton.icon(
                onPressed: () => LoanSheet.show(context, existingLoan: item),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  side: BorderSide(color: borderColor),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                icon: const Icon(Icons.edit_outlined, size: 14),
                label: const Text("Manage Loan", style: TextStyle(fontSize: 12)),
              ),
              const SizedBox(width: 8),
              ElevatedButton.icon(
                onPressed: () => LoanSheet.show(context, existingLoan: item),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.skyBlue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                icon: const Icon(Icons.cloud_upload_outlined, size: 14),
                label: const Text("Sanction Docs", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
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
      width: 150,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border(
          left: BorderSide(color: color, width: 3.5),
          top: BorderSide(color: borderColor),
          right: BorderSide(color: borderColor),
          bottom: BorderSide(color: borderColor),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: AppTypography.badge(color: color)),
          const SizedBox(height: 4),
          Text(value, style: AppTypography.headingSmall(color: textPrimary)),
          const SizedBox(height: 2),
          Text(subtitle, style: const TextStyle(fontSize: 10, color: Colors.grey), maxLines: 1, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }
}
