import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_typography.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/utils/whatsapp_helper.dart';
import '../../../../models/customer_model.dart';

class CustomerCard extends StatelessWidget {
  final CustomerModel customer;
  final Function(CustomerModel) onView360;
  final Function(CustomerModel) onEdit;
  final Function(CustomerModel) onDelete;

  const CustomerCard({
    super.key,
    required this.customer,
    required this.onView360,
    required this.onEdit,
    required this.onDelete,
  });

  Color _getRequirementColor(String req) {
    switch (req.toLowerCase()) {
      case 'commercial':
        return AppColors.purple;
      case 'industrial':
        return AppColors.brandPrimary;
      case 'residential':
      default:
        return AppColors.skyBlue;
    }
  }

  Future<void> _makeCall(String phone) async {
    await WhatsAppHelper.launchDialer(phone);
  }

  Future<void> _openWhatsApp(BuildContext context, String phone) async {
    await WhatsAppHelper.launchWhatsApp(context: context, phone: phone);
  }

  Future<void> _sendEmail(String email) async {
    await WhatsAppHelper.launchEmail(email);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;

    final reqColor = _getRequirementColor(customer.solarRequirement);
    final hasBalance = customer.totalBalanceAmount > 0;

    return InkWell(
      onTap: () => onView360(customer),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor, width: 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Code, Requirement, Menu
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.brandPrimary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppColors.brandPrimary.withValues(alpha: 0.3)),
                  ),
                  child: Text(
                    customer.customerCode,
                    style: AppTypography.badge(color: AppColors.brandPrimary),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: reqColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    customer.solarRequirement,
                    style: AppTypography.caption(
                      color: reqColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const Spacer(),
                PopupMenuButton<String>(
                  icon: Icon(Icons.more_vert_rounded, color: textSecondary, size: 20),
                  color: isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: borderColor),
                  ),
                  onSelected: (val) {
                    if (val == 'view') onView360(customer);
                    if (val == 'edit') onEdit(customer);
                    if (val == 'delete') onDelete(customer);
                  },
                  itemBuilder: (ctx) => [
                    PopupMenuItem(
                      value: 'view',
                      child: Row(
                        children: [
                          const Icon(Icons.visibility_outlined, size: 18),
                          const SizedBox(width: 10),
                          Text("Customer 360°", style: AppTypography.body(color: textPrimary)),
                        ],
                      ),
                    ),
                    PopupMenuItem(
                      value: 'edit',
                      child: Row(
                        children: [
                          const Icon(Icons.edit_outlined, size: 18),
                          const SizedBox(width: 10),
                          Text("Edit Customer", style: AppTypography.body(color: textPrimary)),
                        ],
                      ),
                    ),
                    const PopupMenuDivider(),
                    PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          const Icon(Icons.delete_outline_rounded, size: 18, color: AppColors.errorRed),
                          const SizedBox(width: 10),
                          Text("Delete Customer", style: AppTypography.body(color: AppColors.errorRed)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),

            const SizedBox(height: 10),

            // Customer Name & Location
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: reqColor.withValues(alpha: 0.15),
                  child: Text(
                    customer.initials,
                    style: AppTypography.heading(size: 15, color: reqColor, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        customer.customerName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.heading(size: 16, color: textPrimary),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          if (customer.city != null && customer.city!.isNotEmpty) ...[
                            Icon(Icons.location_on_outlined, size: 13, color: textSecondary),
                            const SizedBox(width: 3),
                            Text(
                              "${customer.city}${customer.state != null ? ', ${customer.state}' : ''}",
                              style: AppTypography.caption(color: textSecondary),
                            ),
                          ] else
                            Text(
                              "Location not specified",
                              style: AppTypography.caption(color: textSecondary),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Quick Contact Buttons (Call, WhatsApp, Email)
            Row(
              children: [
                InkWell(
                  onTap: () => _makeCall(customer.mobileNumber),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: surfaceColor,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: borderColor),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.call_outlined, size: 14, color: AppColors.emeraldGreen),
                        const SizedBox(width: 6),
                        Text(
                          customer.mobileNumber,
                          style: AppTypography.caption(color: textPrimary, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                InkWell(
                  onTap: () => _openWhatsApp(context, customer.mobileNumber),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: surfaceColor,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: borderColor),
                    ),
                    child: const FaIcon(FontAwesomeIcons.whatsapp, size: 14, color: Color(0xFF25D366)),
                  ),
                ),
                if (customer.email != null && customer.email!.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  Expanded(
                    child: InkWell(
                      onTap: () => _sendEmail(customer.email!),
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: surfaceColor,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: borderColor),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.mail_outline_rounded, size: 14, color: AppColors.skyBlue),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                customer.email!,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppTypography.caption(color: textPrimary),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),

            const SizedBox(height: 12),

            // Solar Capacity & Projects Count Box
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: surfaceColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: borderColor),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("INSTALLED", style: AppTypography.caption(color: textSecondary)),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            const Icon(Icons.solar_power_rounded, size: 15, color: AppColors.brandPrimary),
                            const SizedBox(width: 4),
                            Text(
                              Formatters.formatKw(customer.totalSystemKw),
                              style: AppTypography.body(color: textPrimary, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Container(width: 1, height: 28, color: borderColor),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("PROJECTS", style: AppTypography.caption(color: textSecondary)),
                        const SizedBox(height: 2),
                        Text(
                          "${customer.totalProjects} Linked",
                          style: AppTypography.body(color: textPrimary, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  Container(width: 1, height: 28, color: borderColor),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          hasBalance ? "BALANCE DUE" : "PAID STATUS",
                          style: AppTypography.caption(
                            color: hasBalance ? AppColors.errorRed : AppColors.emeraldGreen,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          hasBalance
                              ? Formatters.formatCurrency(customer.totalBalanceAmount, compact: true)
                              : "Settled",
                          style: AppTypography.body(
                            color: hasBalance ? AppColors.errorRed : AppColors.emeraldGreen,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            if (customer.assignedToName != null && customer.assignedToName!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "Sales Rep: ${customer.assignedToName}",
                    style: AppTypography.badge(color: textSecondary),
                  ),
                  if (customer.electricityConsumerNumber != null && customer.electricityConsumerNumber!.isNotEmpty)
                    Text(
                      "CA: ${customer.electricityConsumerNumber}",
                      style: AppTypography.badge(color: textSecondary),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

