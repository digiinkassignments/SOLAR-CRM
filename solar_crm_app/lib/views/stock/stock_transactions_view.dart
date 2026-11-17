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
  String _selectedRefType = 'ALL';
  final _searchController = TextEditingController();

  final List<String> _txnTypes = ['ALL', 'IN', 'OUT', 'ADJUSTMENT', 'RESERVED', 'RELEASED'];
  final List<String> _refTypes = ['ALL', 'PURCHASE', 'LEAD', 'PROJECT', 'RETURN', 'DAMAGE'];

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

  void _loadData({int? page}) {
    final provider = Provider.of<StockProvider>(context, listen: false);
    provider.fetchTransactions(
      itemId: widget.itemId,
      transactionType: _selectedType == 'ALL' ? null : _selectedType,
      referenceType: _selectedRefType == 'ALL' ? null : _selectedRefType,
      search: _searchController.text.trim(),
      page: page,
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
            onPressed: () => _loadData(),
          ),
        ],
      ),
      body: Column(
        children: [
          // 3 Stat Cards Matching Web CRM
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildStatCard(
                    title: "TOTAL TRANSACTIONS LOGGED",
                    value: provider.totalTxns.toString(),
                    subtitle: "All historical stock movements",
                    accentColor: const Color(0xFF3B82F6),
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                    textSecondary: textSecondary,
                  ),
                  const SizedBox(width: 10),
                  _buildStatCard(
                    title: "PAGE INWARD PURCHASES (IN)",
                    value: Formatters.formatCurrency(totalInValue),
                    subtitle: "Stock added to warehouse",
                    accentColor: const Color(0xFF16A34A),
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                    textSecondary: textSecondary,
                  ),
                  const SizedBox(width: 10),
                  _buildStatCard(
                    title: "PAGE OUTWARD DISPATCHES (OUT)",
                    value: Formatters.formatCurrency(totalOutValue),
                    subtitle: "Stock issued for projects/leads",
                    accentColor: const Color(0xFFDC2626),
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                    textSecondary: textSecondary,
                  ),
                ],
              ),
            ),
          ),

          // Filters: Search & Dropdowns
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: "Search item, reference #, vendor, PO...",
                    prefixIcon: const Icon(Icons.search_rounded, size: 20),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.close_rounded, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              _loadData(page: 1);
                            },
                          )
                        : null,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onSubmitted: (_) => _loadData(page: 1),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    // Txn Type Dropdown
                    Expanded(
                      child: Container(
                        height: 38,
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        decoration: BoxDecoration(
                          color: cardBg,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: borderColor),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedType,
                            isExpanded: true,
                            icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 18),
                            items: _txnTypes.map((t) {
                              return DropdownMenuItem<String>(
                                value: t,
                                child: Text(
                                  t == 'ALL' ? "All Types" : t,
                                  style: AppTypography.caption(color: textPrimary, fontWeight: FontWeight.w600),
                                ),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) {
                                setState(() => _selectedType = val);
                                _loadData(page: 1);
                              }
                            },
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Reference Type Dropdown
                    Expanded(
                      child: Container(
                        height: 38,
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        decoration: BoxDecoration(
                          color: cardBg,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: borderColor),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedRefType,
                            isExpanded: true,
                            icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 18),
                            items: _refTypes.map((r) {
                              return DropdownMenuItem<String>(
                                value: r,
                                child: Text(
                                  r == 'ALL' ? "All Refs" : r,
                                  style: AppTypography.caption(color: textPrimary, fontWeight: FontWeight.w600),
                                ),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) {
                                setState(() => _selectedRefType = val);
                                _loadData(page: 1);
                              }
                            },
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 4),

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
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                          itemCount: txns.length,
                          itemBuilder: (ctx, idx) {
                            final t = txns[idx];
                            return _buildTransactionCard(t, isDark, cardBg, borderColor, textPrimary, textSecondary);
                          },
                        ),
                      ),
          ),

          // Numbered Bottom Pagination (Matching Web 25 items per page)
          if (provider.totalTxnPages > 1)
            _buildPaginationBar(provider, isDark, cardBg, borderColor, textPrimary, textSecondary),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required String subtitle,
    required Color accentColor,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
  }) {
    return Container(
      width: 220,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border(
          left: BorderSide(color: accentColor, width: 4),
          top: BorderSide(color: borderColor),
          right: BorderSide(color: borderColor),
          bottom: BorderSide(color: borderColor),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            title,
            style: AppTypography.badge(color: accentColor),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: AppTypography.headingSmall(color: textPrimary),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: AppTypography.caption(color: textSecondary),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
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

  Widget _buildPaginationBar(
    StockProvider provider,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final cur = provider.txnPage;
    final total = provider.totalTxnPages;

    List<int> pages = [];
    if (total <= 5) {
      pages = List.generate(total, (i) => i + 1);
    } else {
      int start = (cur - 2).clamp(1, total - 4);
      pages = List.generate(5, (i) => start + i);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: cardBg,
        border: Border(top: BorderSide(color: borderColor)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            "Page $cur of $total • ${provider.totalTxns} logs",
            style: AppTypography.caption(color: textSecondary),
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left_rounded, size: 20),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                onPressed: cur > 1
                    ? () => provider.setTxnPage(cur - 1,
                        itemId: widget.itemId,
                        transactionType: _selectedType == 'ALL' ? null : _selectedType,
                        referenceType: _selectedRefType == 'ALL' ? null : _selectedRefType,
                        search: _searchController.text.trim())
                    : null,
              ),
              const SizedBox(width: 4),
              ...pages.map((p) {
                final isCurrent = p == cur;
                return InkWell(
                  onTap: () => provider.setTxnPage(p,
                      itemId: widget.itemId,
                      transactionType: _selectedType == 'ALL' ? null : _selectedType,
                      referenceType: _selectedRefType == 'ALL' ? null : _selectedRefType,
                      search: _searchController.text.trim()),
                  borderRadius: BorderRadius.circular(6),
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    width: 28,
                    height: 28,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: isCurrent ? AppColors.brandPrimary : Colors.transparent,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: isCurrent ? AppColors.brandPrimary : borderColor,
                      ),
                    ),
                    child: Text(
                      "$p",
                      style: AppTypography.caption(
                        color: isCurrent ? Colors.white : textPrimary,
                        fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w500,
                      ),
                    ),
                  ),
                );
              }),
              const SizedBox(width: 4),
              IconButton(
                icon: const Icon(Icons.chevron_right_rounded, size: 20),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                onPressed: cur < total
                    ? () => provider.setTxnPage(cur + 1,
                        itemId: widget.itemId,
                        transactionType: _selectedType == 'ALL' ? null : _selectedType,
                        referenceType: _selectedRefType == 'ALL' ? null : _selectedRefType,
                        search: _searchController.text.trim())
                    : null,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
