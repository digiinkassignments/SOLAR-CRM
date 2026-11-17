import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../core/utils/formatters.dart';
import '../../../models/customer_model.dart';
import '../../../providers/customer_provider.dart';
import 'widgets/customer_card.dart';
import 'add_customer_sheet.dart';
import 'edit_customer_sheet.dart';
import 'customer_360_sheet.dart';

class CustomersListView extends StatefulWidget {
  const CustomersListView({super.key});

  @override
  State<CustomersListView> createState() => _CustomersListViewState();
}

class _CustomersListViewState extends State<CustomersListView> {
  final _searchController = TextEditingController();

  final List<String> _requirementFilters = [
    "All",
    "Residential",
    "Commercial",
    "Industrial",
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<CustomerProvider>(context, listen: false).fetchCustomers(isRefresh: true);
    });
  }

  void _onSearch(String query) {
    Provider.of<CustomerProvider>(context, listen: false).fetchCustomers(search: query, isRefresh: true);
  }

  void _onRequirementSelected(String req) {
    Provider.of<CustomerProvider>(context, listen: false).fetchCustomers(requirement: req, isRefresh: true);
  }

  void _openAddCustomerSheet() async {
    final res = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const AddCustomerSheet(),
    );
    if (res == true) {
      if (mounted) {
        Provider.of<CustomerProvider>(context, listen: false).fetchCustomers(isRefresh: true);
      }
    }
  }

  void _openEditCustomerSheet(CustomerModel customer) async {
    final res = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => EditCustomerSheet(customer: customer),
    );
    if (res == true) {
      if (mounted) {
        Provider.of<CustomerProvider>(context, listen: false).fetchCustomers(isRefresh: true);
      }
    }
  }

  void _openCustomer360Sheet(CustomerModel customer) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Customer360Sheet(customer: customer),
    );
  }

  void _confirmDeleteCustomer(CustomerModel customer) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          "Delete Customer?",
          style: AppTypography.heading(size: 18, color: AppColors.errorRed),
        ),
        content: Text(
          "Are you sure you want to delete ${customer.customerName} (${customer.customerCode})? This will remove customer associations.",
          style: AppTypography.body(),
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
              Navigator.pop(ctx);
              final provider = Provider.of<CustomerProvider>(context, listen: false);
              final res = await provider.deleteCustomer(customer.id);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(res['message'] ?? "Customer deleted"),
                    backgroundColor: res['success'] == true ? AppColors.emeraldGreen : AppColors.errorRed,
                  ),
                );
              }
            },
            child: const Text("Delete Permanently"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final customerProvider = Provider.of<CustomerProvider>(context);
    final stats = customerProvider.stats;

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openAddCustomerSheet,
        backgroundColor: AppColors.brandPrimary,
        foregroundColor: Colors.black,
        icon: const Icon(Icons.person_add_alt_rounded, size: 20),
        label: Text("Add Customer", style: AppTypography.button(color: Colors.black)),
      ),
      body: RefreshIndicator(
        color: AppColors.brandPrimary,
        onRefresh: () async {
          await customerProvider.fetchCustomers(isRefresh: true);
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Top 4 Metric KPI Tiles
                    if (stats != null) ...[
                      Row(
                        children: [
                          Expanded(
                            child: _buildMetricTile(
                              label: "Customers",
                              value: "${stats.totalCustomers}",
                              icon: Icons.people_alt_outlined,
                              color: AppColors.brandPrimary,
                              cardBg: cardBg,
                              borderColor: borderColor,
                              textPrimary: textPrimary,
                              textSecondary: textSecondary,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _buildMetricTile(
                              label: "Installed kW",
                              value: Formatters.formatKw(stats.totalCapacityKw),
                              icon: Icons.solar_power_rounded,
                              color: AppColors.skyBlue,
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
                            child: _buildMetricTile(
                              label: "Total Billed",
                              value: Formatters.formatCurrency(stats.totalBilled, compact: true),
                              icon: Icons.receipt_long_rounded,
                              color: AppColors.emeraldGreen,
                              cardBg: cardBg,
                              borderColor: borderColor,
                              textPrimary: textPrimary,
                              textSecondary: textSecondary,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _buildMetricTile(
                              label: "Balance Due",
                              value: Formatters.formatCurrency(stats.totalBalance, compact: true),
                              icon: Icons.account_balance_wallet_outlined,
                              color: stats.totalBalance > 0 ? AppColors.errorRed : AppColors.emeraldGreen,
                              cardBg: cardBg,
                              borderColor: borderColor,
                              textPrimary: textPrimary,
                              textSecondary: textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ],

                    const SizedBox(height: 16),

                    // Search Box
                    TextField(
                      controller: _searchController,
                      style: AppTypography.body(color: textPrimary),
                      textInputAction: TextInputAction.search,
                      onSubmitted: _onSearch,
                      decoration: InputDecoration(
                        hintText: "Search customer name, phone, code...",
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
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Filter Chips (Residential, Commercial, Industrial)
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: _requirementFilters.map((req) {
                          final isSelected = customerProvider.selectedRequirement == req ||
                              (customerProvider.selectedRequirement.isEmpty && req == "All");

                          return Padding(
                            padding: const EdgeInsets.only(right: 8.0),
                            child: FilterChip(
                              label: Text(req),
                              selected: isSelected,
                              onSelected: (_) => _onRequirementSelected(req),
                              selectedColor: AppColors.brandPrimary.withValues(alpha: 0.15),
                              checkmarkColor: AppColors.brandPrimary,
                              labelStyle: AppTypography.caption(
                                color: isSelected ? AppColors.brandPrimary : textSecondary,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              ),
                              backgroundColor: cardBg,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                                side: BorderSide(
                                  color: isSelected ? AppColors.brandPrimary : borderColor,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),

                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),

            // Customer List
            if (customerProvider.isLoading && customerProvider.customers.isEmpty)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.brandPrimary),
                ),
              )
            else if (customerProvider.customers.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: cardBg,
                            shape: BoxShape.circle,
                            border: Border.all(color: borderColor),
                          ),
                          child: Icon(Icons.person_search_outlined, size: 40, color: textSecondary),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          "No customers found",
                          style: AppTypography.heading(size: 18, color: textPrimary),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          "Try adjusting your search criteria.",
                          style: AppTypography.caption(color: textSecondary),
                        ),
                        const SizedBox(height: 16),
                        OutlinedButton(
                          onPressed: () {
                            _searchController.clear();
                            customerProvider.fetchCustomers(search: "", requirement: "All", isRefresh: true);
                          },
                          child: const Text("Reset Filters"),
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
                      final customer = customerProvider.customers[index];
                      return CustomerCard(
                        customer: customer,
                        onView360: _openCustomer360Sheet,
                        onEdit: _openEditCustomerSheet,
                        onDelete: _confirmDeleteCustomer,
                      );
                    },
                    childCount: customerProvider.customers.length,
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
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
              Text(label, style: AppTypography.caption(color: textSecondary)),
              Icon(icon, color: color, size: 16),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: AppTypography.heading(size: 17, color: textPrimary, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}

