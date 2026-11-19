import 'package:flutter/material.dart';
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
import 'invoice_detail_sheet.dart';
import 'record_payment_dialog.dart';

class InvoiceCard extends StatelessWidget {
  final InvoiceModel invoice;

  const InvoiceCard({super.key, required this.invoice});

  Color _getPaymentStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'paid':
        return AppColors.emeraldGreen;
      case 'partially paid':
        return AppColors.brandPrimary;
      default:
        return AppColors.errorRed;
    }
  }

  void _openDetails(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => InvoiceDetailSheet(invoice: invoice),
    );
  }

  Future<void> _openPdf(BuildContext context) async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final origin = ApiConstants.getWebOrigin(auth.workspace);
    final url = "$origin/invoice/${invoice.publicToken}?download=true";
    final uri = Uri.parse(url);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            Icon(Icons.download_rounded, color: AppColors.brandPrimary, size: 18),
            SizedBox(width: 8),
            Text("Opening Invoice PDF download..."),
          ],
        ),
        duration: Duration(seconds: 2),
        backgroundColor: AppColors.darkCard,
        behavior: SnackBarBehavior.floating,
      ),
    );
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _shareWhatsApp(BuildContext context) async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final origin = ApiConstants.getWebOrigin(auth.workspace);
    final publicUrl = "$origin/invoice/${invoice.publicToken}";
    final pitch = invoice.buildWhatsAppPitch(publicUrl);
    await WhatsAppHelper.launchWhatsApp(
      context: context,
      phone: invoice.customerPhone,
      text: pitch,
    );
  }

  Future<void> _recordPayment(BuildContext context) async {
    await showDialog<bool>(
      context: context,
      builder: (_) => RecordPaymentDialog(invoice: invoice),
    );
  }

  Future<void> _deleteInvoice(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Delete Invoice?"),
        content: Text("Delete invoice ${invoice.invoiceNumber}?"),
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

    if (confirmed == true && context.mounted) {
      final finance = Provider.of<FinanceProvider>(context, listen: false);
      final ok = await finance.deleteInvoice(invoice.id);
      if (context.mounted && ok) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Invoice deleted successfully")),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;

    final statusColor = _getPaymentStatusColor(invoice.paymentStatus);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.06 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        onTap: () => _openDetails(context),
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Invoice Number + Status Badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppColors.skyBlue.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.receipt_long_rounded, size: 16, color: AppColors.skyBlue),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        invoice.invoiceNumber,
                        style: AppTypography.heading(size: 14, color: textPrimary, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      invoice.paymentStatus.toUpperCase(),
                      style: AppTypography.badge(color: statusColor),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 10),

              // Customer details
              Row(
                children: [
                  CircleAvatar(
                    radius: 14,
                    backgroundColor: textSecondary.withValues(alpha: 0.1),
                    child: Text(
                      invoice.initials,
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textPrimary),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          invoice.customerName,
                          style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.bold),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          "${invoice.customerPhone}${invoice.city != null && invoice.city!.isNotEmpty ? ' • ${invoice.city}' : ''}",
                          style: AppTypography.caption(color: textSecondary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),
              const Divider(height: 1),
              const SizedBox(height: 10),

              // Specs & Financials Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.solar_power_rounded, size: 14, color: AppColors.brandPrimary),
                          const SizedBox(width: 4),
                          Text(
                            "${Formatters.formatKw(invoice.systemCapacityKw)} • ${invoice.systemType}",
                            style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        "Date: ${Formatters.formatDate(invoice.invoiceDate)}",
                        style: AppTypography.caption(color: textSecondary),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        Formatters.formatCurrency(invoice.netPayableAmount),
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textPrimary),
                      ),
                      Text(
                        invoice.balanceDue > 0
                            ? "Due: ${Formatters.formatCurrency(invoice.balanceDue)}"
                            : "Fully Paid",
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: invoice.balanceDue > 0 ? AppColors.errorRed : AppColors.emeraldGreen,
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 10),

              // Quick Actions Bar
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  // Record payment quick button
                  if (invoice.balanceDue > 0)
                    IconButton(
                      icon: const Icon(Icons.payment_rounded, size: 18, color: AppColors.emeraldGreen),
                      tooltip: "Record Payment",
                      constraints: const BoxConstraints(),
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      onPressed: () => _recordPayment(context),
                    ),
                  // WhatsApp
                  IconButton(
                    icon: const FaIcon(FontAwesomeIcons.whatsapp, size: 16, color: Color(0xFF25D366)),
                    tooltip: "Share on WhatsApp",
                    constraints: const BoxConstraints(),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    onPressed: () => _shareWhatsApp(context),
                  ),
                  // PDF
                  IconButton(
                    icon: const Icon(Icons.picture_as_pdf_outlined, size: 18, color: AppColors.errorRed),
                    tooltip: "View PDF",
                    constraints: const BoxConstraints(),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    onPressed: () => _openPdf(context),
                  ),
                  // Delete
                  IconButton(
                    icon: const Icon(Icons.delete_outline_rounded, size: 18, color: AppColors.textMutedLight),
                    tooltip: "Delete",
                    constraints: const BoxConstraints(),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    onPressed: () => _deleteInvoice(context),
                  ),
                  // Details Arrow
                  const SizedBox(width: 4),
                  const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: AppColors.brandPrimary),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

