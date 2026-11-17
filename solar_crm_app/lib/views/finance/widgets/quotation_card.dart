import 'package:flutter/material.dart';
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
import 'quotation_detail_sheet.dart';

class QuotationCard extends StatelessWidget {
  final QuotationModel quotation;

  const QuotationCard({super.key, required this.quotation});

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'accepted':
        return AppColors.emeraldGreen;
      case 'sent':
        return AppColors.skyBlue;
      case 'rejected':
        return AppColors.errorRed;
      default:
        return const Color(0xFF94A3B8); // Draft
    }
  }

  void _openDetails(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => QuotationDetailSheet(quotation: quotation),
    );
  }

  void _openConvertDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => ConvertInvoiceDialog(quotation: quotation),
    );
  }

  Future<void> _openPdf(BuildContext context) async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final ws = auth.workspace?.trim().toLowerCase() ?? "digiinksolutions";
    final url = "https://$ws.${ApiConstants.baseDomain}/quote/${quotation.publicToken}?download=true";
    final uri = Uri.parse(url);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            Icon(Icons.download_rounded, color: AppColors.brandPrimary, size: 18),
            SizedBox(width: 8),
            Text("Opening Quotation PDF download..."),
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
    final ws = auth.workspace?.trim().toLowerCase() ?? "digiinksolutions";
    final publicUrl = "https://$ws.${ApiConstants.baseDomain}/quote/${quotation.publicToken}";
    final pitch = quotation.buildWhatsAppPitch(publicUrl);
    await WhatsAppHelper.launchWhatsApp(
      context: context,
      phone: quotation.customerPhone,
      text: pitch,
    );
  }

  Future<void> _deleteQuotation(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Delete Quotation?"),
        content: Text("Delete quotation ${quotation.quotationNumber}?"),
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
      final ok = await finance.deleteQuotation(quotation.id);
      if (context.mounted && ok) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Quotation deleted successfully")),
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

    final statusColor = _getStatusColor(quotation.status);

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
              // Header: Quo Number + Status Chip
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppColors.brandPrimary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.description_outlined, size: 16, color: AppColors.brandPrimary),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        quotation.quotationNumber,
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
                      quotation.status.toUpperCase(),
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
                      quotation.initials,
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textPrimary),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          quotation.customerName,
                          style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.bold),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          "${quotation.customerPhone}${quotation.city != null && quotation.city!.isNotEmpty ? ' • ${quotation.city}' : ''}",
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

              // Specs & Price Row
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
                            "${Formatters.formatKw(quotation.systemCapacityKw)} • ${quotation.systemType}",
                            style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        Formatters.formatDate(quotation.createdAt),
                        style: AppTypography.caption(color: textSecondary),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        Formatters.formatCurrency(quotation.netPayableAmount),
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.brandPrimary),
                      ),
                      if (quotation.subsidyAmount > 0)
                        Text(
                          "Subsidy: -${Formatters.formatCurrency(quotation.subsidyAmount)}",
                          style: const TextStyle(fontSize: 10, color: AppColors.emeraldGreen, fontWeight: FontWeight.w600),
                        ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 10),

              // Quick Actions Bar
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Convert to Invoice Button (Just like web!)
                  InkWell(
                    onTap: () => _openConvertDialog(context),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: quotation.status.toLowerCase() == "accepted"
                            ? AppColors.emeraldGreen
                            : AppColors.brandPrimary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.receipt_long_rounded, size: 14, color: Colors.white),
                          SizedBox(width: 5),
                          Text(
                            "Convert to Invoice ➔",
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Action Icons
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // WhatsApp
                      IconButton(
                        icon: const FaIcon(FontAwesomeIcons.whatsapp, size: 16, color: Color(0xFF25D366)),
                        tooltip: "Share on WhatsApp",
                        constraints: const BoxConstraints(),
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                        onPressed: () => _shareWhatsApp(context),
                      ),
                      // PDF
                      IconButton(
                        icon: const Icon(Icons.picture_as_pdf_outlined, size: 18, color: AppColors.errorRed),
                        tooltip: "View PDF",
                        constraints: const BoxConstraints(),
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                        onPressed: () => _openPdf(context),
                      ),
                      // Delete
                      IconButton(
                        icon: const Icon(Icons.delete_outline_rounded, size: 18, color: AppColors.textMutedLight),
                        tooltip: "Delete",
                        constraints: const BoxConstraints(),
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                        onPressed: () => _deleteQuotation(context),
                      ),
                      // Details Arrow
                      const SizedBox(width: 2),
                      const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: AppColors.brandPrimary),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

