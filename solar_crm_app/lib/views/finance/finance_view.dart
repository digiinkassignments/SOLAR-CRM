import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../providers/finance_provider.dart';
import 'widgets/invoice_card.dart';
import 'widgets/quotation_card.dart';

class FinanceView extends StatefulWidget {
  final int initialTabIndex; // 0 for Quotations, 1 for Invoices

  const FinanceView({super.key, this.initialTabIndex = 0});

  @override
  State<FinanceView> createState() => _FinanceViewState();
}

class _FinanceViewState extends State<FinanceView> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this, initialIndex: widget.initialTabIndex);
    _tabController.addListener(_onTabChanged);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final finance = Provider.of<FinanceProvider>(context, listen: false);
      finance.fetchQuotations(refresh: true);
      finance.fetchInvoices(refresh: true);
    });
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) return;
    final finance = Provider.of<FinanceProvider>(context, listen: false);
    if (_tabController.index == 0) {
      _searchController.text = finance.quotationSearchQuery;
    } else {
      _searchController.text = finance.invoiceSearchQuery;
    }
    setState(() {});
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    final finance = Provider.of<FinanceProvider>(context, listen: false);
    if (_tabController.index == 0) {
      finance.setQuotationSearch(query);
    } else {
      finance.setInvoiceSearch(query);
    }
  }

  void _clearSearch() {
    _searchController.clear();
    _onSearchChanged("");
  }

  @override
  Widget build(BuildContext context) {
    final finance = Provider.of<FinanceProvider>(context);

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Quotations & Invoices",
              style: AppTypography.heading(size: 18, color: textPrimary, fontWeight: FontWeight.bold),
            ),
            Text(
              "Commercial proposals, billing & GST payment tracking",
              style: AppTypography.caption(color: textSecondary),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 22),
            tooltip: "Refresh Data",
            onPressed: () {
              if (_tabController.index == 0) {
                finance.fetchQuotations(refresh: true);
              } else {
                finance.fetchInvoices(refresh: true);
              }
            },
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(54),
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: surfaceColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: borderColor),
            ),
            child: TabBar(
              controller: _tabController,
              indicator: BoxDecoration(
                color: isDark ? Colors.white : Colors.black,
                borderRadius: BorderRadius.circular(9),
              ),
              indicatorSize: TabBarIndicatorSize.tab,
              dividerColor: Colors.transparent,
              labelColor: isDark ? Colors.black : Colors.white,
              unselectedLabelColor: textSecondary,
              labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
              tabs: [
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.description_outlined, size: 16),
                      const SizedBox(width: 6),
                      Text("Quotations (${finance.quotations.length})"),
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.receipt_long_rounded, size: 16),
                      const SizedBox(width: 6),
                      Text("Invoices (${finance.invoices.length})"),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 0: Quotations View
          _buildQuotationsTab(finance, isDark, cardBg, borderColor, textPrimary, textSecondary, surfaceColor),

          // Tab 1: Invoices View
          _buildInvoicesTab(finance, isDark, cardBg, borderColor, textPrimary, textSecondary, surfaceColor),
        ],
      ),
    );
  }

  // =========================================================================
  // --- QUOTATIONS TAB ---
  // =========================================================================
  Widget _buildQuotationsTab(
    FinanceProvider finance,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
    Color surfaceColor,
  ) {
    return RefreshIndicator(
      onRefresh: () => finance.fetchQuotations(refresh: true),
      color: AppColors.brandPrimary,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Quotations Metrics Grid
                  _buildQuotationMetrics(finance, isDark, cardBg, borderColor, textPrimary, textSecondary),

                  const SizedBox(height: 12),

                  // Search Bar
                  _buildSearchBar(
                    hint: "Search quotation #, customer, phone...",
                    controller: _searchController,
                    onChanged: _onSearchChanged,
                    onClear: _clearSearch,
                    surfaceColor: surfaceColor,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                    textSecondary: textSecondary,
                  ),

                  const SizedBox(height: 10),

                  // Status Filter Chips
                  _buildFilterChips(
                    options: ["All", "Draft", "Sent", "Accepted", "Rejected"],
                    selected: finance.quotationStatusFilter,
                    onSelected: (val) => finance.setQuotationStatusFilter(val),
                    isDark: isDark,
                    surfaceColor: surfaceColor,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                    textSecondary: textSecondary,
                  ),

                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),

          // Quotations List / States
          if (finance.isLoadingQuotations && finance.quotations.isEmpty)
            const SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: CircularProgressIndicator(color: AppColors.brandPrimary),
              ),
            )
          else if (finance.quotationsError != null && finance.quotations.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: _buildErrorState(
                message: finance.quotationsError!,
                onRetry: () => finance.fetchQuotations(refresh: true),
                textPrimary: textPrimary,
                textSecondary: textSecondary,
              ),
            )
          else if (finance.quotations.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: _buildEmptyState(
                title: "No Quotations Found",
                subtitle: finance.quotationSearchQuery.isNotEmpty || finance.quotationStatusFilter != "All"
                    ? "Try adjusting your search or status filter."
                    : "No commercial quotations generated yet.",
                onReset: () {
                  _clearSearch();
                  finance.setQuotationStatusFilter("All");
                },
                textPrimary: textPrimary,
                textSecondary: textSecondary,
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final item = finance.quotations[index];
                    return QuotationCard(quotation: item);
                  },
                  childCount: finance.quotations.length,
                ),
              ),
            ),
        ],
      ),
    );
  }

  // =========================================================================
  // --- INVOICES TAB ---
  // =========================================================================
  Widget _buildInvoicesTab(
    FinanceProvider finance,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
    Color surfaceColor,
  ) {
    return RefreshIndicator(
      onRefresh: () => finance.fetchInvoices(refresh: true),
      color: AppColors.skyBlue,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Invoices Metrics Grid
                  _buildInvoiceMetrics(finance, isDark, cardBg, borderColor, textPrimary, textSecondary),

                  const SizedBox(height: 12),

                  // Search Bar
                  _buildSearchBar(
                    hint: "Search invoice #, customer, phone...",
                    controller: _searchController,
                    onChanged: _onSearchChanged,
                    onClear: _clearSearch,
                    surfaceColor: surfaceColor,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                    textSecondary: textSecondary,
                  ),

                  const SizedBox(height: 10),

                  // Payment Status Filter Chips
                  _buildFilterChips(
                    options: ["All", "Paid", "Partially Paid", "Unpaid"],
                    selected: finance.invoiceStatusFilter,
                    onSelected: (val) => finance.setInvoiceStatusFilter(val),
                    isDark: isDark,
                    surfaceColor: surfaceColor,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                    textSecondary: textSecondary,
                  ),

                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),

          // Invoices List / States
          if (finance.isLoadingInvoices && finance.invoices.isEmpty)
            const SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: CircularProgressIndicator(color: AppColors.skyBlue),
              ),
            )
          else if (finance.invoicesError != null && finance.invoices.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: _buildErrorState(
                message: finance.invoicesError!,
                onRetry: () => finance.fetchInvoices(refresh: true),
                textPrimary: textPrimary,
                textSecondary: textSecondary,
              ),
            )
          else if (finance.invoices.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: _buildEmptyState(
                title: "No Invoices Found",
                subtitle: finance.invoiceSearchQuery.isNotEmpty || finance.invoiceStatusFilter != "All"
                    ? "Try adjusting your search or payment filter."
                    : "No tax invoices generated yet.",
                onReset: () {
                  _clearSearch();
                  finance.setInvoiceStatusFilter("All");
                },
                textPrimary: textPrimary,
                textSecondary: textSecondary,
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final item = finance.invoices[index];
                    return InvoiceCard(invoice: item);
                  },
                  childCount: finance.invoices.length,
                ),
              ),
            ),
        ],
      ),
    );
  }

  // --- QUOTATION METRICS WIDGET ---
  Widget _buildQuotationMetrics(
    FinanceProvider finance,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return Row(
      children: [
        Expanded(
          child: _buildMetricBox(
            title: "Total Proposals",
            value: "${finance.totalQuotationsCount}",
            subtitle: "${finance.acceptedQuotationsCount} Accepted deals",
            icon: Icons.description_outlined,
            accentColor: AppColors.brandPrimary,
            cardBg: cardBg,
            borderColor: borderColor,
            textPrimary: textPrimary,
            textSecondary: textSecondary,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildMetricBox(
            title: "Pipeline Value",
            value: Formatters.formatCurrency(finance.totalQuotationsValue, compact: true),
            subtitle: "${finance.pendingQuotationsCount} Pending/Draft",
            icon: Icons.currency_rupee_rounded,
            accentColor: AppColors.emeraldGreen,
            cardBg: cardBg,
            borderColor: borderColor,
            textPrimary: textPrimary,
            textSecondary: textSecondary,
          ),
        ),
      ],
    );
  }

  // --- INVOICE METRICS WIDGET ---
  Widget _buildInvoiceMetrics(
    FinanceProvider finance,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildMetricBox(
                title: "Total Invoiced",
                value: Formatters.formatCurrency(finance.totalInvoicedAmount, compact: true),
                subtitle: "${finance.invoices.length} Tax Invoices",
                icon: Icons.receipt_long_rounded,
                accentColor: AppColors.skyBlue,
                cardBg: cardBg,
                borderColor: borderColor,
                textPrimary: textPrimary,
                textSecondary: textSecondary,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricBox(
                title: "Payments Received",
                value: Formatters.formatCurrency(finance.totalPaymentsReceived, compact: true),
                subtitle: "${finance.collectionRatePercent}% Collection rate",
                icon: Icons.check_circle_outline_rounded,
                accentColor: AppColors.emeraldGreen,
                cardBg: cardBg,
                borderColor: borderColor,
                textPrimary: textPrimary,
                textSecondary: textSecondary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _buildMetricBox(
                title: "Balance Outstanding",
                value: Formatters.formatCurrency(finance.totalBalanceDue, compact: true),
                subtitle: "Remaining collection",
                icon: Icons.pending_actions_rounded,
                accentColor: finance.totalBalanceDue > 0 ? AppColors.errorRed : AppColors.emeraldGreen,
                cardBg: cardBg,
                borderColor: borderColor,
                textPrimary: textPrimary,
                textSecondary: textSecondary,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMetricBox({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color accentColor,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: accentColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: accentColor, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppTypography.caption(color: textSecondary)),
                Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textPrimary)),
                Text(subtitle, style: TextStyle(fontSize: 10, color: textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // --- SEARCH BAR ---
  Widget _buildSearchBar({
    required String hint,
    required TextEditingController controller,
    required ValueChanged<String> onChanged,
    required VoidCallback onClear,
    required Color surfaceColor,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
  }) {
    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: borderColor),
      ),
      child: TextField(
        controller: controller,
        onChanged: onChanged,
        style: AppTypography.bodySmall(color: textPrimary),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: AppTypography.bodySmall(color: textSecondary),
          prefixIcon: const Icon(Icons.search_rounded, size: 20),
          suffixIcon: controller.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear_rounded, size: 18),
                  onPressed: onClear,
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 11),
        ),
      ),
    );
  }

  // --- FILTER CHIPS ---
  Widget _buildFilterChips({
    required List<String> options,
    required String selected,
    required ValueChanged<String> onSelected,
    required bool isDark,
    required Color surfaceColor,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
  }) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: options.map((opt) {
          final isSel = selected.toLowerCase() == opt.toLowerCase();
          return Padding(
            padding: const EdgeInsets.only(right: 6),
            child: InkWell(
              onTap: () => onSelected(opt),
              borderRadius: BorderRadius.circular(8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: isSel
                      ? (isDark ? Colors.white : Colors.black)
                      : surfaceColor,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isSel ? Colors.transparent : borderColor,
                  ),
                ),
                child: Text(
                  opt,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                    color: isSel
                        ? (isDark ? Colors.black : Colors.white)
                        : textSecondary,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // --- EMPTY STATE ---
  Widget _buildEmptyState({
    required String title,
    required String subtitle,
    required VoidCallback onReset,
    required Color textPrimary,
    required Color textSecondary,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.folder_open_rounded, size: 48, color: textSecondary.withValues(alpha: 0.5)),
            const SizedBox(height: 12),
            Text(title, style: AppTypography.headingSmall(color: textPrimary)),
            const SizedBox(height: 4),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: AppTypography.caption(color: textSecondary),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              icon: const Icon(Icons.refresh_rounded, size: 16),
              label: const Text("Reset Filters"),
              onPressed: onReset,
            ),
          ],
        ),
      ),
    );
  }

  // --- ERROR STATE ---
  Widget _buildErrorState({
    required String message,
    required VoidCallback onRetry,
    required Color textPrimary,
    required Color textSecondary,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.errorRed),
            const SizedBox(height: 12),
            Text("Connection Issue", style: AppTypography.headingSmall(color: textPrimary)),
            const SizedBox(height: 4),
            Text(
              message,
              textAlign: TextAlign.center,
              style: AppTypography.caption(color: textSecondary),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              icon: const Icon(Icons.refresh_rounded, size: 16),
              label: const Text("Try Again"),
              onPressed: onRetry,
            ),
          ],
        ),
      ),
    );
  }
}
