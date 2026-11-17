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
import '../../../../models/invoice_model.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../providers/finance_provider.dart';
import 'record_payment_dialog.dart';

class InvoiceDetailSheet extends StatefulWidget {
  final InvoiceModel invoice;

  const InvoiceDetailSheet({super.key, required this.invoice});

  @override
  State<InvoiceDetailSheet> createState() => _InvoiceDetailSheetState();
}

class _InvoiceDetailSheetState extends State<InvoiceDetailSheet> {
  late InvoiceModel _invoice;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _invoice = widget.invoice;
    _loadFullDetails();
  }

  Future<void> _loadFullDetails() async {
    setState(() => _isLoading = true);
    final finance = Provider.of<FinanceProvider>(context, listen: false);
    final updated = await finance.getInvoiceDetails(_invoice.id);
    if (updated != null && mounted) {
      setState(() => _invoice = updated);
    }
    if (mounted) setState(() => _isLoading = false);
  }

  String _getPublicUrl() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final ws = auth.workspace?.trim().toLowerCase() ?? "digiinksolutions";
    return "https://$ws.${ApiConstants.baseDomain}/invoice/${_invoice.publicToken}";
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
    final pitch = _invoice.buildWhatsAppPitch(publicUrl);
    await WhatsAppHelper.launchWhatsApp(
      context: context,
      phone: _invoice.customerPhone,
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
            Text("Public Invoice link copied to clipboard!"),
          ],
        ),
        duration: Duration(seconds: 2),
        backgroundColor: AppColors.darkCard,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _sendEmail() async {
    if (_invoice.customerEmail == null || _invoice.customerEmail!.isEmpty) {
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
      const SnackBar(content: Text("Sending invoice email to customer...")),
    );

    final res = await finance.sendInvoiceEmail(_invoice.id);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? "Email processed."),
          backgroundColor: res['success'] == true ? AppColors.emeraldGreen : AppColors.errorRed,
        ),
      );
    }
  }

  Future<void> _recordPayment() async {
    final res = await showDialog<bool>(
      context: context,
      builder: (_) => RecordPaymentDialog(invoice: _invoice),
    );
    if (res == true && mounted) {
      _loadFullDetails();
    }
  }

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Delete Invoice?"),
        content: Text("Are you sure you want to delete ${_invoice.invoiceNumber}? This action cannot be undone."),
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
      final ok = await finance.deleteInvoice(_invoice.id);
      if (mounted) {
        if (ok) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text("Invoice deleted successfully"),
              backgroundColor: AppColors.emeraldGreen,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Failed to delete invoice"), backgroundColor: AppColors.errorRed),
          );
        }
      }
    }
  }

  Color _getPaymentStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'paid':
        return AppColors.emeraldGreen;
      case 'partially paid':
        return AppColors.brandPrimary;
      default:
        return AppColors.errorRed; // Unpaid
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

    final statusColor = _getPaymentStatusColor(_invoice.paymentStatus);

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
                  backgroundColor: AppColors.skyBlue.withValues(alpha: 0.15),
                  child: Text(
                    _invoice.initials,
                    style: AppTypography.heading(size: 16, color: AppColors.skyBlue, fontWeight: FontWeight.bold),
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
                              _invoice.invoiceNumber,
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
                              _invoice.paymentStatus.toUpperCase(),
                              style: AppTypography.badge(color: statusColor),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        "${_invoice.customerName} • ${Formatters.formatKw(_invoice.systemCapacityKw)}",
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

          // Primary Quick Action Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                // Record Payment (if not fully paid)
                if (_invoice.balanceDue > 0) ...[
                  Expanded(
                    child: _buildActionBtn(
                      icon: Icons.payment_rounded,
                      label: "Record Pay",
                      color: AppColors.emeraldGreen,
                      onTap: _recordPayment,
                      surfaceColor: surfaceColor,
                      borderColor: borderColor,
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
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
                        // Payment Summary Hero Box
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: surfaceColor,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: borderColor),
                          ),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    flex: 3,
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text("Net Invoice Total", style: AppTypography.caption(color: textSecondary)),
                                        const SizedBox(height: 2),
                                        FittedBox(
                                          fit: BoxFit.scaleDown,
                                          alignment: Alignment.centerLeft,
                                          child: Text(
                                            Formatters.formatCurrency(_invoice.netPayableAmount),
                                            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: textPrimary),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    flex: 3,
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Text("Balance Due", style: AppTypography.caption(color: textSecondary)),
                                        const SizedBox(height: 2),
                                        FittedBox(
                                          fit: BoxFit.scaleDown,
                                          alignment: Alignment.centerRight,
                                          child: Text(
                                            Formatters.formatCurrency(_invoice.balanceDue),
                                            style: TextStyle(
                                              fontSize: 20,
                                              fontWeight: FontWeight.bold,
                                              color: _invoice.balanceDue > 0 ? AppColors.errorRed : AppColors.emeraldGreen,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: _invoice.netPayableAmount > 0
                                      ? (_invoice.amountPaid / _invoice.netPayableAmount).clamp(0.0, 1.0)
                                      : 0.0,
                                  minHeight: 6,
                                  backgroundColor: textSecondary.withValues(alpha: 0.15),
                                  valueColor: const AlwaysStoppedAnimation<Color>(AppColors.emeraldGreen),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    "Paid: ${Formatters.formatCurrency(_invoice.amountPaid)}",
                                    style: AppTypography.caption(color: AppColors.emeraldGreen),
                                  ),
                                  Text(
                                    "${_invoice.netPayableAmount > 0 ? ((_invoice.amountPaid / _invoice.netPayableAmount) * 100).round() : 0}% collected",
                                    style: AppTypography.caption(color: textSecondary),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Customer & Site Section
                        _buildSectionHeader("Customer & Place of Supply", textPrimary),
                        const SizedBox(height: 8),
                        _buildInfoCard(
                          cardBg: surfaceColor,
                          borderColor: borderColor,
                          children: [
                            _buildInfoRow("Customer Name", _invoice.customerName, textPrimary, textSecondary),
                            _buildInfoRow("Phone Number", _invoice.customerPhone, textPrimary, textSecondary),
                            if (_invoice.customerEmail != null && _invoice.customerEmail!.isNotEmpty)
                              _buildInfoRow("Email", _invoice.customerEmail!, textPrimary, textSecondary),
                            if (_invoice.customerGstin != null && _invoice.customerGstin!.isNotEmpty)
                              _buildInfoRow("GSTIN", _invoice.customerGstin!, textPrimary, textSecondary),
                            _buildInfoRow("Billing Address", _invoice.fullAddress, textPrimary, textSecondary),
                            _buildInfoRow("Invoice Date", Formatters.formatDate(_invoice.invoiceDate), textPrimary, textSecondary),
                            if (_invoice.dueDate != null)
                              _buildInfoRow("Due Date", Formatters.formatDate(_invoice.dueDate), textPrimary, textSecondary),
                            if (_invoice.quotationNumber != null)
                              _buildInfoRow("Quotation Ref", _invoice.quotationNumber!, textPrimary, textSecondary),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Technical Specifications
                        _buildSectionHeader("System Particulars", textPrimary),
                        const SizedBox(height: 8),
                        _buildInfoCard(
                          cardBg: surfaceColor,
                          borderColor: borderColor,
                          children: [
                            _buildInfoRow("Capacity", "${_invoice.systemCapacityKw.toStringAsFixed(1)} kW", textPrimary, textSecondary),
                            _buildInfoRow("System Type", _invoice.systemType, textPrimary, textSecondary),
                            _buildInfoRow("Modules", _invoice.panelSpecs ?? "Mono PERC 550W Half-Cut", textPrimary, textSecondary),
                            _buildInfoRow("Inverter", _invoice.inverterSpecs ?? "Grid-Tied String Inverter", textPrimary, textSecondary),
                            _buildInfoRow("Structure", _invoice.structureType ?? "Elevated GI Structure", textPrimary, textSecondary),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Line Items (if present)
                        if (_invoice.lineItems.isNotEmpty) ...[
                          _buildSectionHeader("Invoice Line Items", textPrimary),
                          const SizedBox(height: 8),
                          ..._invoice.lineItems.map((item) => Container(
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
                                          Text(
                                            "${item.quantity} ${item.unit}${item.rate != null ? ' @ ₹${item.rate!.toStringAsFixed(0)}' : ''}${item.hsn != null ? ' • HSN: ${item.hsn}' : ''}",
                                            style: AppTypography.caption(color: textSecondary),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      Formatters.formatCurrency(item.amount),
                                      style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                              )),
                          const SizedBox(height: 12),
                        ],

                        // Tax & Totals Breakdown
                        _buildSectionHeader("Tax Particulars & Net Payable", textPrimary),
                        const SizedBox(height: 8),
                        _buildInfoCard(
                          cardBg: surfaceColor,
                          borderColor: borderColor,
                          children: [
                            _buildInfoRow("Taxable Base Amount", Formatters.formatCurrency(_invoice.taxableAmount), textPrimary, textSecondary),
                            if (_invoice.cgstAmount > 0)
                              _buildInfoRow("CGST (${(_invoice.gstRate / 2).toStringAsFixed(1)}%)", Formatters.formatCurrency(_invoice.cgstAmount), textPrimary, textSecondary),
                            if (_invoice.sgstAmount > 0)
                              _buildInfoRow("SGST (${(_invoice.gstRate / 2).toStringAsFixed(1)}%)", Formatters.formatCurrency(_invoice.sgstAmount), textPrimary, textSecondary),
                            if (_invoice.igstAmount > 0)
                              _buildInfoRow("IGST (${_invoice.gstRate.toStringAsFixed(1)}%)", Formatters.formatCurrency(_invoice.igstAmount), textPrimary, textSecondary),
                            _buildInfoRow("Gross Total Amount", Formatters.formatCurrency(_invoice.grossTotal), textPrimary, textSecondary, isBold: true),
                            if (_invoice.subsidyAmount > 0)
                              _buildInfoRow("PM Surya Ghar Subsidy", "- ${Formatters.formatCurrency(_invoice.subsidyAmount)}", AppColors.emeraldGreen, textSecondary, isBold: true),
                            const Divider(height: 12),
                            _buildInfoRow("Net Invoice Amount", Formatters.formatCurrency(_invoice.netPayableAmount), AppColors.brandPrimary, textSecondary, isBold: true, isLarge: true),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Payments Recorded History
                        if (_invoice.payments.isNotEmpty) ...[
                          _buildSectionHeader("Payment History", textPrimary),
                          const SizedBox(height: 8),
                          ..._invoice.payments.map((p) => Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: surfaceColor,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: borderColor),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(p.paymentMode, style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.bold)),
                                        Text(
                                          "${Formatters.formatDate(p.paymentDate)}${p.referenceNumber != null ? ' • ${p.referenceNumber}' : ''}",
                                          style: AppTypography.caption(color: textSecondary),
                                        ),
                                      ],
                                    ),
                                    Text(
                                      Formatters.formatCurrency(p.amount),
                                      style: AppTypography.bodySmall(color: AppColors.emeraldGreen, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                              )),
                          const SizedBox(height: 12),
                        ],

                        if (_invoice.notes != null && _invoice.notes!.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          _buildSectionHeader("Invoice Notes", textPrimary),
                          const SizedBox(height: 6),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: surfaceColor,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: borderColor),
                            ),
                            child: Text(_invoice.notes!, style: AppTypography.bodySmall(color: textPrimary)),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // Secondary actions (Copy link, Delete)
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
                            IconButton(
                              icon: const Icon(Icons.delete_outline_rounded, color: AppColors.errorRed),
                              tooltip: "Delete Invoice",
                              onPressed: _confirmDelete,
                            ),
                          ],
                        ),

                        const SizedBox(height: 24),
                      ],
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
        crossAxisAlignment: CrossAxisAlignment.start,
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

