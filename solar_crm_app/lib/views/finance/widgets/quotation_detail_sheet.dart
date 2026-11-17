import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_typography.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/utils/whatsapp_helper.dart';
import '../../../../models/quotation_model.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../providers/finance_provider.dart';
import 'convert_invoice_dialog.dart';

class QuotationDetailSheet extends StatefulWidget {
  final QuotationModel quotation;

  const QuotationDetailSheet({super.key, required this.quotation});

  @override
  State<QuotationDetailSheet> createState() => _QuotationDetailSheetState();
}

class _QuotationDetailSheetState extends State<QuotationDetailSheet> {
  late QuotationModel _quotation;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _quotation = widget.quotation;
    _loadFullDetails();
  }

  Future<void> _loadFullDetails() async {
    setState(() => _isLoading = true);
    final finance = Provider.of<FinanceProvider>(context, listen: false);
    final updated = await finance.getQuotationDetails(_quotation.id);
    if (updated != null && mounted) {
      setState(() => _quotation = updated);
    }
    if (mounted) setState(() => _isLoading = false);
  }

  String _getPublicUrl() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final ws = auth.workspace?.trim().toLowerCase() ?? "digiinksolutions";
    return "https://$ws.${ApiConstants.baseDomain}/quote/${_quotation.publicToken}";
  }

  Future<void> _openPdf() async {
    final url = "${_getPublicUrl()}?download=true";
    final uri = Uri.parse(url);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
            children: [
              Icon(Icons.download_rounded, color: AppColors.brandPrimary, size: 18),
              SizedBox(width: 8),
              Text("Opening official PDF download..."),
            ],
          ),
          duration: Duration(seconds: 2),
          backgroundColor: AppColors.darkCard,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Could not launch PDF viewer.")),
        );
      }
    }
  }

  Future<void> _shareWhatsApp() async {
    final publicUrl = _getPublicUrl();
    final pitch = _quotation.buildWhatsAppPitch(publicUrl);
    await WhatsAppHelper.launchWhatsApp(
      context: context,
      phone: _quotation.customerPhone,
      text: pitch,
    );
  }

  void _copyLink() {
    final publicUrl = _getPublicUrl();
    Clipboard.setData(ClipboardData(text: publicUrl));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            Icon(Icons.check_circle_rounded, color: AppColors.emeraldGreen, size: 18),
            SizedBox(width: 8),
            Text("Public Quotation link copied to clipboard!"),
          ],
        ),
        duration: Duration(seconds: 2),
        backgroundColor: AppColors.darkCard,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _sendEmail() async {
    if (_quotation.customerEmail == null || _quotation.customerEmail!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Customer does not have an email address recorded."),
          backgroundColor: AppColors.errorRed,
        ),
      );
      return;
    }

    final finance = Provider.of<FinanceProvider>(context, listen: false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Sending quotation email to customer...")),
    );

    final res = await finance.sendQuotationEmail(_quotation.id);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? "Email processed."),
          backgroundColor: res['success'] == true ? AppColors.emeraldGreen : AppColors.errorRed,
        ),
      );
    }
  }

  void _showChangeStatusDialog() {
    final statuses = ["Draft", "Sent", "Accepted", "Rejected"];
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text("Update Quotation Status", style: AppTypography.headingSmall()),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: statuses.map((status) {
            final isCurrent = _quotation.status.toLowerCase() == status.toLowerCase();
            return ListTile(
              leading: Icon(
                isCurrent ? Icons.radio_button_checked : Icons.radio_button_off,
                color: isCurrent ? AppColors.brandPrimary : Colors.grey,
              ),
              title: Text(status, style: AppTypography.bodySmall(fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal)),
              onTap: () async {
                Navigator.pop(ctx);
                final finance = Provider.of<FinanceProvider>(context, listen: false);
                final ok = await finance.updateQuotationStatus(_quotation.id, status);
                if (ok && mounted) {
                  _loadFullDetails();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text("Status updated to $status")),
                  );
                }
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  void _openConvertDialog() {
    showDialog(
      context: context,
      builder: (_) => ConvertInvoiceDialog(quotation: _quotation),
    ).then((result) {
      if (result == true && mounted) {
        Navigator.pop(context);
      }
    });
  }

  Future<void> _duplicateQuotation() async {
    final finance = Provider.of<FinanceProvider>(context, listen: false);
    final ok = await finance.duplicateQuotation(_quotation.id);
    if (mounted) {
      if (ok) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Quotation duplicated successfully as draft!"),
            backgroundColor: AppColors.emeraldGreen,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Failed to duplicate quotation"), backgroundColor: AppColors.errorRed),
        );
      }
    }
  }

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Delete Quotation?"),
        content: Text("Are you sure you want to delete ${_quotation.quotationNumber}? This action cannot be undone."),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text("Cancel")),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.errorRed),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text("Delete", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final finance = Provider.of<FinanceProvider>(context, listen: false);
      final ok = await finance.deleteQuotation(_quotation.id);
      if (mounted) {
        if (ok) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text("Quotation deleted successfully"),
              backgroundColor: AppColors.emeraldGreen,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Failed to delete quotation"), backgroundColor: AppColors.errorRed),
          );
        }
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'accepted':
        return AppColors.emeraldGreen;
      case 'sent':
        return AppColors.skyBlue;
      case 'rejected':
        return AppColors.errorRed;
      default:
        return const Color(0xFF94A3B8); // Draft / Slate
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;

    final statusColor = _getStatusColor(_quotation.status);

    return Container(
      height: MediaQuery.of(context).size.height * 0.90,
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: borderColor)),
      ),
      child: Column(
        children: [
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

          // Header Row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: AppColors.brandPrimary.withValues(alpha: 0.15),
                  child: Text(
                    _quotation.initials,
                    style: AppTypography.heading(size: 16, color: AppColors.brandPrimary, fontWeight: FontWeight.bold),
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
                              _quotation.quotationNumber,
                              style: AppTypography.heading(size: 16, color: textPrimary, fontWeight: FontWeight.bold),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: statusColor.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              _quotation.status.toUpperCase(),
                              style: AppTypography.badge(color: statusColor),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        "${_quotation.customerName} • ${Formatters.formatKw(_quotation.systemCapacityKw)}",
                        style: AppTypography.caption(color: textSecondary),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
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

          const SizedBox(height: 12),

          // Primary Quick Action Bar (PDF, WhatsApp, Email, More)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                // PDF View / Download
                Expanded(
                  child: _buildActionBtn(
                    icon: Icons.picture_as_pdf_rounded,
                    label: "PDF",
                    color: AppColors.errorRed,
                    onTap: _openPdf,
                    surfaceColor: surfaceColor,
                    borderColor: borderColor,
                  ),
                ),
                const SizedBox(width: 8),
                // WhatsApp Share
                Expanded(
                  child: _buildActionBtn(
                    customIcon: const FaIcon(FontAwesomeIcons.whatsapp, size: 16, color: Color(0xFF25D366)),
                    label: "WhatsApp",
                    color: const Color(0xFF25D366),
                    onTap: _shareWhatsApp,
                    surfaceColor: surfaceColor,
                    borderColor: borderColor,
                  ),
                ),
                const SizedBox(width: 8),
                // Send Email
                Expanded(
                  child: _buildActionBtn(
                    icon: Icons.email_outlined,
                    label: "Email",
                    color: AppColors.skyBlue,
                    onTap: _sendEmail,
                    surfaceColor: surfaceColor,
                    borderColor: borderColor,
                  ),
                ),
                const SizedBox(width: 8),
                // Status / More Menu
                Expanded(
                  child: _buildActionBtn(
                    icon: Icons.sync_alt_rounded,
                    label: "Status",
                    color: AppColors.brandPrimary,
                    onTap: _showChangeStatusDialog,
                    surfaceColor: surfaceColor,
                    borderColor: borderColor,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),
          const Divider(height: 1),

          // Document Details Body
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.brandPrimary))
                : SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    physics: const BouncingScrollPhysics(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Net Payable Hero Box
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.brandPrimary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppColors.brandPrimary.withValues(alpha: 0.3)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                flex: 3,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text("Net Payable Amount", style: AppTypography.caption(color: textSecondary)),
                                    const SizedBox(height: 2),
                                    Text(
                                      Formatters.formatCurrency(_quotation.netPayableAmount),
                                      style: const TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.w900,
                                        color: AppColors.brandPrimary,
                                      ),
                                    ),
                                    if (_quotation.subsidyAmount > 0)
                                      Text(
                                        "Includes -${Formatters.formatCurrency(_quotation.subsidyAmount)} PM Surya Ghar CFA",
                                        style: AppTypography.caption(color: AppColors.emeraldGreen),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                flex: 2,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text("Issue Date", style: AppTypography.caption(color: textSecondary)),
                                    Text(
                                      Formatters.formatDate(_quotation.createdAt),
                                      style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.bold),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    if (_quotation.validUntil != null) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        "Valid: ${Formatters.formatDate(_quotation.validUntil)}",
                                        style: AppTypography.caption(color: textSecondary),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Customer & Site Section
                        _buildSectionHeader("Customer & Installation Site", textPrimary),
                        const SizedBox(height: 8),
                        _buildInfoCard(
                          cardBg: surfaceColor,
                          borderColor: borderColor,
                          children: [
                            _buildInfoRow("Customer Name", _quotation.customerName, textPrimary, textSecondary),
                            _buildInfoRow("Phone Number", _quotation.customerPhone, textPrimary, textSecondary),
                            if (_quotation.customerEmail != null && _quotation.customerEmail!.isNotEmpty)
                              _buildInfoRow("Email", _quotation.customerEmail!, textPrimary, textSecondary),
                            _buildInfoRow("Installation Address", _quotation.fullAddress, textPrimary, textSecondary),
                            if (_quotation.leadCode != null)
                              _buildInfoRow("Linked Lead", _quotation.leadCode!, textPrimary, textSecondary),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Technical Specifications
                        _buildSectionHeader("Solar Plant Specifications", textPrimary),
                        const SizedBox(height: 8),
                        _buildInfoCard(
                          cardBg: surfaceColor,
                          borderColor: borderColor,
                          children: [
                            _buildInfoRow("Capacity", "${_quotation.systemCapacityKw.toStringAsFixed(1)} kW", textPrimary, textSecondary),
                            _buildInfoRow("System Type", _quotation.systemType, textPrimary, textSecondary),
                            _buildInfoRow("Solar Modules", "${_quotation.panelCount}x ${_quotation.panelBrand ?? 'Mono PERC DCR'}", textPrimary, textSecondary),
                            _buildInfoRow("Solar Inverter", "${_quotation.inverterCapacityKw ?? _quotation.systemCapacityKw} kW ${_quotation.inverterBrand ?? 'Smart String'}", textPrimary, textSecondary),
                            _buildInfoRow("Structure", _quotation.structureType ?? "High-Grade GI", textPrimary, textSecondary),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Line Items (if present)
                        if (_quotation.lineItems.isNotEmpty) ...[
                          _buildSectionHeader("Commercial Line Items", textPrimary),
                          const SizedBox(height: 8),
                          ..._quotation.lineItems.map((item) => Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: surfaceColor,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: borderColor),
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(item.name, style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.bold)),
                                          Text("${item.quantity} ${item.unit} @ ₹${item.unitPrice.toStringAsFixed(0)}", style: AppTypography.caption(color: textSecondary)),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      Formatters.formatCurrency(item.totalAmount),
                                      style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                              )),
                          const SizedBox(height: 12),
                        ],

                        // Commercial Cost Breakdown
                        _buildSectionHeader("Commercial Pricing & Taxes", textPrimary),
                        const SizedBox(height: 8),
                        _buildInfoCard(
                          cardBg: surfaceColor,
                          borderColor: borderColor,
                          children: [
                            _buildInfoRow("Base Hardware Price", Formatters.formatCurrency(_quotation.basePrice), textPrimary, textSecondary),
                            if (_quotation.structureInstallationCost > 0)
                              _buildInfoRow("Structure & Installation", Formatters.formatCurrency(_quotation.structureInstallationCost), textPrimary, textSecondary),
                            if (_quotation.discountAmount > 0)
                              _buildInfoRow("Special Discount", "- ${Formatters.formatCurrency(_quotation.discountAmount)}", AppColors.emeraldGreen, textSecondary),
                            _buildInfoRow("GST (${_quotation.gstRate.toStringAsFixed(1)}%)", Formatters.formatCurrency(_quotation.gstAmount), textPrimary, textSecondary),
                            _buildInfoRow("Gross Total Price", Formatters.formatCurrency(_quotation.totalAmount), textPrimary, textSecondary, isBold: true),
                            if (_quotation.subsidyAmount > 0)
                              _buildInfoRow("PM Surya Ghar Subsidy", "- ${Formatters.formatCurrency(_quotation.subsidyAmount)}", AppColors.emeraldGreen, textSecondary, isBold: true),
                            const Divider(height: 12),
                            _buildInfoRow("Net Investment", Formatters.formatCurrency(_quotation.netPayableAmount), AppColors.brandPrimary, textSecondary, isBold: true, isLarge: true),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Financial Projections & ROI
                        _buildSectionHeader("Savings & ROI Projections", textPrimary),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: _buildMetricTile(
                                label: "Est. Generation",
                                value: "${_quotation.annualGenerationKwh} kWh/yr",
                                color: AppColors.brandPrimary,
                                surfaceColor: surfaceColor,
                                borderColor: borderColor,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: _buildMetricTile(
                                label: "Annual Savings",
                                value: "${Formatters.formatCurrency(_quotation.annualSavings.toDouble())}/yr",
                                color: AppColors.emeraldGreen,
                                surfaceColor: surfaceColor,
                                borderColor: borderColor,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: _buildMetricTile(
                                label: "Payback Period",
                                value: "${_quotation.paybackYears.toStringAsFixed(1)} Years",
                                color: AppColors.skyBlue,
                                surfaceColor: surfaceColor,
                                borderColor: borderColor,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: _buildMetricTile(
                                label: "25-Yr Lifetime Savings",
                                value: "₹${(_quotation.twentyFiveYearSavings / 100000).toStringAsFixed(2)} L",
                                color: AppColors.brandPrimary,
                                surfaceColor: surfaceColor,
                                borderColor: borderColor,
                              ),
                            ),
                          ],
                        ),

                        if (_quotation.notes != null && _quotation.notes!.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          _buildSectionHeader("Quotation Notes", textPrimary),
                          const SizedBox(height: 6),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: surfaceColor,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: borderColor),
                            ),
                            child: Text(_quotation.notes!, style: AppTypography.bodySmall(color: textPrimary)),
                          ),
                        ],

                        const SizedBox(height: 24),

                        // Secondary actions (Copy link, Duplicate, Delete)
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                icon: const Icon(Icons.copy_rounded, size: 16),
                                label: const Text("Copy Link"),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 11),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                onPressed: _copyLink,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: OutlinedButton.icon(
                                icon: const Icon(Icons.file_copy_outlined, size: 16),
                                label: const Text("Duplicate"),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 11),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                onPressed: _duplicateQuotation,
                              ),
                            ),
                            const SizedBox(width: 8),
                            IconButton(
                              icon: const Icon(Icons.delete_outline_rounded, color: AppColors.errorRed),
                              tooltip: "Delete Quotation",
                              onPressed: _confirmDelete,
                            ),
                          ],
                        ),

                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
          ),

          // Persistent Bottom Action: Convert to Tax Invoice (Just like web!)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: surfaceColor,
              border: Border(top: BorderSide(color: borderColor)),
            ),
            child: SafeArea(
              top: false,
              child: SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _quotation.status.toLowerCase() == "accepted"
                        ? AppColors.emeraldGreen
                        : AppColors.brandPrimary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    elevation: 0,
                  ),
                  icon: const Icon(Icons.receipt_long_rounded, color: Colors.white, size: 20),
                  label: const Text(
                    "Convert to Tax Invoice ➔",
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  onPressed: _openConvertDialog,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, Color textPrimary) {
    return Text(
      title,
      style: AppTypography.caption(color: textPrimary, fontWeight: FontWeight.bold),
    );
  }

  Widget _buildInfoCard({
    required Color cardBg,
    required Color borderColor,
    required List<Widget> children,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }

  Widget _buildInfoRow(
    String label,
    String value,
    Color valueColor,
    Color labelColor, {
    bool isBold = false,
    bool isLarge = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: AppTypography.caption(color: labelColor),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 3,
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: TextStyle(
                fontSize: isLarge ? 15 : 12,
                fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
                color: valueColor,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricTile({
    required String label,
    required String value,
    required Color color,
    required Color surfaceColor,
    required Color borderColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: AppTypography.caption(color: color, fontWeight: FontWeight.w600)),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildActionBtn({
    IconData? icon,
    Widget? customIcon,
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
            customIcon ?? Icon(icon, size: 18, color: color),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color),
            ),
          ],
        ),
      ),
    );
  }
}
