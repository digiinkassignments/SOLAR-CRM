import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/whatsapp_helper.dart';
import '../../../models/customer_model.dart';
import '../../../providers/customer_provider.dart';

class Customer360Sheet extends StatefulWidget {
  final CustomerModel customer;

  const Customer360Sheet({super.key, required this.customer});

  @override
  State<Customer360Sheet> createState() => _Customer360SheetState();
}

class _Customer360SheetState extends State<Customer360Sheet> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<CustomerProvider>(context, listen: false).fetchCustomerById(widget.customer.id);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _makeCall() async {
    await WhatsAppHelper.launchDialer(widget.customer.mobileNumber);
  }

  Future<void> _openWhatsApp() async {
    await WhatsAppHelper.launchWhatsApp(context: context, phone: widget.customer.mobileNumber);
  }

  Future<void> _sendMail() async {
    if (widget.customer.email != null) {
      await WhatsAppHelper.launchEmail(widget.customer.email!);
    }
  }

  Future<void> _openMaps() async {
    final address = "${widget.customer.address ?? ''} ${widget.customer.city ?? ''} ${widget.customer.state ?? ''}".trim();
    if (address.isNotEmpty) {
      final uri = Uri.parse("https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(address)}");
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final customerProvider = Provider.of<CustomerProvider>(context);
    final detail = customerProvider.selectedCustomerDetail;
    final isLoading = customerProvider.isLoadingDetail;

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;

    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: borderColor)),
      ),
      child: Column(
        children: [
          // Drag handle
          const SizedBox(height: 12),
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: borderColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: AppColors.brandPrimary.withValues(alpha: 0.15),
                  child: Text(
                    widget.customer.initials,
                    style: AppTypography.heading(size: 18, color: AppColors.brandPrimary, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              widget.customer.customerName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTypography.heading(size: 18, color: textPrimary),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.brandPrimary.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              widget.customer.customerCode,
                              style: AppTypography.badge(color: AppColors.brandPrimary),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        "${widget.customer.solarRequirement} • ${widget.customer.city ?? 'Location N/A'}",
                        style: AppTypography.caption(color: textSecondary),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // Quick Action Buttons
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Expanded(
                  child: _buildActionBtn(
                    icon: Icons.call_rounded,
                    label: "Call",
                    color: AppColors.emeraldGreen,
                    onTap: _makeCall,
                    surfaceColor: surfaceColor,
                    borderColor: borderColor,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildActionBtn(
                    customIcon: const FaIcon(FontAwesomeIcons.whatsapp, size: 18, color: Color(0xFF25D366)),
                    label: "WhatsApp",
                    color: const Color(0xFF25D366),
                    onTap: _openWhatsApp,
                    surfaceColor: surfaceColor,
                    borderColor: borderColor,
                  ),
                ),
                if (widget.customer.email != null && widget.customer.email!.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildActionBtn(
                      icon: Icons.mail_rounded,
                      label: "Email",
                      color: AppColors.skyBlue,
                      onTap: _sendMail,
                      surfaceColor: surfaceColor,
                      borderColor: borderColor,
                    ),
                  ),
                ],
                const SizedBox(width: 8),
                Expanded(
                  child: _buildActionBtn(
                    icon: Icons.directions_rounded,
                    label: "Navigate",
                    color: AppColors.amberDark,
                    onTap: _openMaps,
                    surfaceColor: surfaceColor,
                    borderColor: borderColor,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Tabs: Overview, Projects, Invoices, Deals
          TabBar(
            controller: _tabController,
            isScrollable: true,
            labelColor: AppColors.brandPrimary,
            unselectedLabelColor: textSecondary,
            indicatorColor: AppColors.brandPrimary,
            indicatorSize: TabBarIndicatorSize.label,
            labelStyle: AppTypography.caption(fontWeight: FontWeight.bold),
            unselectedLabelStyle: AppTypography.caption(),
            tabs: const [
              Tab(text: "Overview"),
              Tab(text: "Projects"),
              Tab(text: "Invoices"),
              Tab(text: "Quotations"),
            ],
          ),
          Divider(color: borderColor, height: 1),

          // Tab Content
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.brandPrimary))
                : TabBarView(
                    controller: _tabController,
                    children: [
                      _buildOverviewTab(
                        detail?.customer ?? widget.customer,
                        detail?.openingRecord,
                        detail?.invoices ?? [],
                        surfaceColor,
                        borderColor,
                        textPrimary,
                        textSecondary,
                      ),
                      _buildProjectsTab(detail?.projects ?? [], surfaceColor, borderColor, textPrimary, textSecondary),
                      _buildInvoicesTab(detail?.invoices ?? [], surfaceColor, borderColor, textPrimary, textSecondary),
                      _buildQuotationsTab(detail?.quotations ?? [], surfaceColor, borderColor, textPrimary, textSecondary),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionBtn({
    Widget? customIcon,
    IconData? icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
    required Color surfaceColor,
    required Color borderColor,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: surfaceColor,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          children: [
            customIcon ?? Icon(icon, color: color, size: 18),
            const SizedBox(height: 2),
            Text(label, style: AppTypography.caption(color: color, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  Widget _buildOverviewTab(
    CustomerModel c,
    CustomerOpeningRecord? opening,
    List<dynamic> invoices,
    Color surfaceColor,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    // 1. Calculate actual generated invoices sum
    double invoiceBilledSum = 0.0;
    double invoicePaidSum = 0.0;
    double invoiceDueSum = 0.0;

    for (final inv in invoices) {
      if (inv is Map) {
        invoiceBilledSum += double.tryParse(inv['gross_total']?.toString() ?? '0') ?? 0.0;
        invoicePaidSum += double.tryParse(inv['amount_paid']?.toString() ?? '0') ?? 0.0;
        invoiceDueSum += double.tryParse(inv['balance_due']?.toString() ?? '0') ?? 0.0;
      }
    }

    // 2. Opening record amounts
    final openingInvoice = opening?.invoiceAmount ?? 0.0;
    final openingPaid = opening?.amountPaid ?? 0.0;
    final openingDue = (openingInvoice - openingPaid > 0) ? (openingInvoice - openingPaid) : 0.0;

    // 3. True combined financial summary: opening record + actual generated invoices
    final double billed;
    final double paid;
    final double balance;

    if (invoices.isNotEmpty || opening != null) {
      billed = openingInvoice + invoiceBilledSum;
      paid = openingPaid + invoicePaidSum;
      balance = openingDue + invoiceDueSum;
    } else {
      billed = c.totalBilledAmount;
      paid = c.totalPaidAmount;
      balance = c.totalBalanceAmount > 0
          ? c.totalBalanceAmount
          : (billed - paid > 0 ? billed - paid : 0.0);
    }

    final effectivePlantSize = opening?.plantSizeKw ?? c.plantSizeKw;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Financials Highlight
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: surfaceColor,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: borderColor),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildFinancialMetric(
                  "Gross Billed",
                  Formatters.formatCurrency(billed, compact: true),
                  textPrimary,
                  textSecondary,
                ),
                Container(width: 1, height: 28, color: borderColor),
                _buildFinancialMetric(
                  "Total Paid",
                  Formatters.formatCurrency(paid, compact: true),
                  AppColors.emeraldGreen,
                  textSecondary,
                ),
                Container(width: 1, height: 28, color: borderColor),
                _buildFinancialMetric(
                  "Balance Due",
                  Formatters.formatCurrency(balance, compact: true),
                  balance > 0 ? AppColors.errorRed : AppColors.emeraldGreen,
                  textSecondary,
                ),
              ],
            ),
          ),

          if (opening != null || effectivePlantSize != null) ...[
            const SizedBox(height: 16),
            // Opening Installation & Contract Card
            Text("OPENING CONTRACT & SYSTEM SPECS", style: AppTypography.badge(color: AppColors.brandPrimary)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: surfaceColor,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.brandPrimary.withValues(alpha: 0.3)),
              ),
              child: Column(
                children: [
                  _buildInfoLine(
                    "System Capacity (Plant Size)",
                    effectivePlantSize != null ? "${effectivePlantSize.toStringAsFixed(2)} kW" : "Not recorded",
                    textPrimary,
                    textSecondary,
                  ),
                  if (opening != null) ...[
                    Divider(color: borderColor, height: 16),
                    _buildInfoLine(
                      "Final Contract Amount",
                      "₹${Formatters.formatCurrency(opening.invoiceAmount)}",
                      textPrimary,
                      textSecondary,
                    ),
                    Divider(color: borderColor, height: 16),
                    _buildInfoLine(
                      "Payment Received",
                      "₹${Formatters.formatCurrency(opening.amountPaid)}",
                      AppColors.emeraldGreen,
                      textSecondary,
                    ),
                    Divider(color: borderColor, height: 16),
                    _buildInfoLine(
                      "Opening Balance Due",
                      "₹${Formatters.formatCurrency(opening.invoiceAmount - opening.amountPaid > 0 ? opening.invoiceAmount - opening.amountPaid : 0.0)}",
                      (opening.invoiceAmount - opening.amountPaid) > 0 ? AppColors.errorRed : AppColors.emeraldGreen,
                      textSecondary,
                    ),
                    if (opening.paymentMode != null || opening.paymentDate != null) ...[
                      Divider(color: borderColor, height: 16),
                      _buildInfoLine(
                        "Payment Details",
                        "${opening.paymentMode ?? 'Payment'}${opening.paymentDate != null ? ' • ${opening.paymentDate}' : ''}",
                        textPrimary,
                        textSecondary,
                      ),
                    ],
                    if (opening.paymentReference != null && opening.paymentReference!.isNotEmpty) ...[
                      Divider(color: borderColor, height: 16),
                      _buildInfoLine(
                        "Payment Reference",
                        opening.paymentReference!,
                        textPrimary,
                        textSecondary,
                      ),
                    ],
                  ],
                ],
              ),
            ),
          ],

          const SizedBox(height: 16),

          // Utility & Technical Card
          Text("UTILITY & GRID CONNECTION", style: AppTypography.badge(color: textSecondary)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: surfaceColor,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: borderColor),
            ),
            child: Column(
              children: [
                _buildInfoLine("Consumer Number (CA)", c.electricityConsumerNumber ?? "Not provided", textPrimary, textSecondary),
                Divider(color: borderColor, height: 16),
                _buildInfoLine("DISCOM Name", c.discomName ?? "Not specified", textPrimary, textSecondary),
                Divider(color: borderColor, height: 16),
                _buildInfoLine("Sanctioned Load", c.sanctionedLoadKw != null ? "${c.sanctionedLoadKw} kW" : "N/A", textPrimary, textSecondary),
                if (c.customerGstin != null && c.customerGstin!.isNotEmpty) ...[
                  Divider(color: borderColor, height: 16),
                  _buildInfoLine("GSTIN", c.customerGstin!, textPrimary, textSecondary),
                ],
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Address Card
          Text("INSTALLATION SITE", style: AppTypography.badge(color: textSecondary)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: surfaceColor,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: borderColor),
            ),
            child: Column(
              children: [
                _buildInfoLine("Address", c.address ?? "Not provided", textPrimary, textSecondary),
                Divider(color: borderColor, height: 16),
                _buildInfoLine("City & State", "${c.city ?? '-'}, ${c.state ?? '-'}", textPrimary, textSecondary),
                Divider(color: borderColor, height: 16),
                _buildInfoLine("Pincode", c.pincode ?? "-", textPrimary, textSecondary),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFinancialMetric(String label, String value, Color valColor, Color textSecondary) {
    return Column(
      children: [
        Text(label, style: AppTypography.caption(color: textSecondary)),
        const SizedBox(height: 2),
        Text(value, style: AppTypography.heading(size: 16, color: valColor, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildInfoLine(String label, String value, Color textPrimary, Color textSecondary) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppTypography.caption(color: textSecondary)),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: AppTypography.body(color: textPrimary, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }

  Widget _buildProjectsTab(List<dynamic> projects, Color surfaceColor, Color borderColor, Color textPrimary, Color textSecondary) {
    if (projects.isEmpty) {
      return Center(
        child: Text("No solar projects linked yet", style: AppTypography.body(color: textSecondary)),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: projects.length,
      itemBuilder: (ctx, i) {
        final p = projects[i];
        final kw = p['system_capacity_kw']?.toString() ?? '0';
        final stage = p['stage']?.toString() ?? 'Initiated';
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: surfaceColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: borderColor),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(p['project_code']?.toString() ?? "Solar Project", style: AppTypography.heading(size: 15, color: textPrimary)),
                  const SizedBox(height: 2),
                  Text("$kw kW System", style: AppTypography.caption(color: AppColors.brandPrimary, fontWeight: FontWeight.bold)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.skyBlue.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(stage, style: AppTypography.badge(color: AppColors.skyBlue)),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildInvoicesTab(List<dynamic> invoices, Color surfaceColor, Color borderColor, Color textPrimary, Color textSecondary) {
    if (invoices.isEmpty) {
      return Center(
        child: Text("No invoices generated yet", style: AppTypography.body(color: textSecondary)),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: invoices.length,
      itemBuilder: (ctx, i) {
        final inv = invoices[i];
        final total = double.tryParse(inv['gross_total']?.toString() ?? '0') ?? 0;
        final due = double.tryParse(inv['balance_due']?.toString() ?? '0') ?? 0;
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: surfaceColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: borderColor),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(inv['invoice_number']?.toString() ?? "Invoice", style: AppTypography.heading(size: 15, color: textPrimary)),
                  const SizedBox(height: 2),
                  Text("Total: ${Formatters.formatCurrency(total)}", style: AppTypography.caption(color: textSecondary)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    due > 0 ? "Due: ${Formatters.formatCurrency(due, compact: true)}" : "Paid",
                    style: AppTypography.body(
                      color: due > 0 ? AppColors.errorRed : AppColors.emeraldGreen,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildQuotationsTab(List<dynamic> quotations, Color surfaceColor, Color borderColor, Color textPrimary, Color textSecondary) {
    if (quotations.isEmpty) {
      return Center(
        child: Text("No quotations created yet", style: AppTypography.body(color: textSecondary)),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: quotations.length,
      itemBuilder: (ctx, i) {
        final q = quotations[i];
        final amount = double.tryParse(q['total_amount']?.toString() ?? '0') ?? 0;
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: surfaceColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: borderColor),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(q['quotation_code']?.toString() ?? "Quotation", style: AppTypography.heading(size: 15, color: textPrimary)),
                  const SizedBox(height: 2),
                  Text(q['status']?.toString() ?? "Sent", style: AppTypography.caption(color: textSecondary)),
                ],
              ),
              Text(
                Formatters.formatCurrency(amount),
                style: AppTypography.body(color: AppColors.emeraldGreen, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        );
      },
    );
  }
}

