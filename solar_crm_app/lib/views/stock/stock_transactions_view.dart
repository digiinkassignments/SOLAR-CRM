import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../models/stock_transaction_model.dart';
import '../../providers/stock_provider.dart';

class StockTransactionsView extends StatefulWidget {
  final int? itemId;
  final String? itemName;

  const StockTransactionsView({super.key, this.itemId, this.itemName});

  @override
  State<StockTransactionsView> createState() => _StockTransactionsViewState();
}

class _StockTransactionsViewState extends State<StockTransactionsView> {
  String _selectedType = 'ALL';
  final _searchController = TextEditingController();

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
    Provider.of<StockProvider>(context, listen: false).fetchTransactions(
      itemId: widget.itemId,
      transactionType: _selectedType,
      search: _searchController.text.trim(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    final provider = Provider.of<StockProvider>(context);
    final txns = provider.transactions;
    final isLoading = provider.isLoadingTransactions;

    final totalInValue = txns
        .where((t) => t.isInward)
        .fold(0.0, (sum, t) => sum + t.totalValue);
    final totalOutValue = txns
        .where((t) => t.isOutward)
        .fold(0.0, (sum, t) => sum + t.totalValue);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.itemName != null ? "${widget.itemName} Logs" : "Stock Transactions",
              style: AppTypography.headingSmall(color: textPrimary),
            ),
            Text(
              "Audit log of inward & outward movements",
              style: AppTypography.caption(color: textSecondary),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadData,
          ),
        ],
      ),
      body: Column(
        children: [
          // KPI Summary Cards (Total IN / Total OUT)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.emeraldGreen.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.emeraldGreen.withValues(alpha: 0.25)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.trending_up_rounded, color: AppColors.emeraldGreen, size: 16),
                            const SizedBox(width: 4),
                            Text("INWARD VALUE", style: AppTypography.badge(color: AppColors.emeraldGreen)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          Formatters.formatCurrency(totalInValue),
                          style: AppTypography.headingSmall(color: textPrimary),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.errorRed.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.errorRed.withValues(alpha: 0.25)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.trending_down_rounded, color: AppColors.errorRed, size: 16),
                            const SizedBox(width: 4),
                            Text("OUTWARD VALUE", style: AppTypography.badge(color: AppColors.errorRed)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          Formatters.formatCurrency(totalOutValue),
                          style: AppTypography.headingSmall(color: textPrimary),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Filters: Search & Type Chips
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: "Search item, reference #, PO...",
                    prefixIcon: const Icon(Icons.search_rounded, size: 20),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onSubmitted: (_) => _loadData(),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _buildFilterChip("ALL", "All", _selectedType == "ALL"),
                    const SizedBox(width: 8),
                    _buildFilterChip("IN", "Stock IN", _selectedType == "IN"),
                    const SizedBox(width: 8),
                    _buildFilterChip("OUT", "Stock OUT", _selectedType == "OUT"),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 6),

          // Transaction list
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : txns.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.receipt_long_outlined, size: 48, color: textSecondary),
                            const SizedBox(height: 12),
                            Text("No stock transactions found", style: AppTypography.bodyMedium(color: textSecondary)),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () async => _loadData(),
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          itemCount: txns.length,
                          itemBuilder: (ctx, idx) {
                            final t = txns[idx];
                            return _buildTransactionCard(t, isDark, cardBg, borderColor, textPrimary, textSecondary);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String value, String label, bool isSelected) {
    return FilterChip(
      selected: isSelected,
      label: Text(label),
      onSelected: (_) {
        setState(() => _selectedType = value);
        _loadData();
      },
      selectedColor: AppColors.brandPrimary.withValues(alpha: 0.15),
      labelStyle: AppTypography.caption(
        color: isSelected ? AppColors.brandPrimary : null,
        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
      ),
    );
  }

  Widget _buildTransactionCard(
    StockTransactionModel t,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final isIn = t.isInward;
    final color = isIn ? AppColors.emeraldGreen : AppColors.errorRed;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
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
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(isIn ? Icons.south_west_rounded : Icons.north_east_rounded, color: color, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      isIn ? "IN (+${t.quantity} ${t.unit})" : "OUT (-${t.quantity} ${t.unit})",
                      style: AppTypography.badge(color: color),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              if (t.totalValue > 0)
                Text(
                  Formatters.formatCurrency(t.totalValue),
                  style: AppTypography.bodySmall(color: color, fontWeight: FontWeight.w700),
                ),
            ],
          ),

          const SizedBox(height: 8),

          Text(
            t.itemName ?? "Stock Item #${t.itemId}",
            style: AppTypography.bodyMedium(fontWeight: FontWeight.w700, color: textPrimary),
          ),

          if (t.itemCode?.isNotEmpty == true)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(
                "SKU: ${t.itemCode}",
                style: AppTypography.caption(color: textSecondary),
              ),
            ),

          const SizedBox(height: 8),

          // Reference & Stock change info
          Row(
            children: [
              if (t.referenceType != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white10 : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    "${t.referenceType}${t.referenceId != null ? ' #${t.referenceId}' : ''}",
                    style: AppTypography.caption(color: textSecondary, fontWeight: FontWeight.w600),
                  ),
                ),
                const SizedBox(width: 8),
              ],
              if (t.previousStock != null && t.newStock != null)
                Text(
                  "Balance: ${t.previousStock} ➔ ${t.newStock} ${t.unit}",
                  style: AppTypography.caption(color: textSecondary),
                ),
            ],
          ),

          if (t.notes?.isNotEmpty == true) ...[
            const SizedBox(height: 6),
            Text(
              "Note: ${t.notes}",
              style: AppTypography.caption(color: textSecondary).copyWith(fontStyle: FontStyle.italic),
            ),
          ],

          if (t.createdAt != null) ...[
            const SizedBox(height: 6),
            Text(
              "Logged: ${Formatters.formatDate(t.createdAt)} ${Formatters.formatTime(t.createdAt)}${t.createdByName != null ? ' by ${t.createdByName}' : ''}",
              style: AppTypography.caption(color: textSecondary),
            ),
          ],
        ],
      ),
    );
  }
}
