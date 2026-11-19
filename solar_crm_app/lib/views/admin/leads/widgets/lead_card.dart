import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_typography.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/utils/whatsapp_helper.dart';
import '../../../../models/lead_model.dart';

class LeadCard extends StatelessWidget {
  final LeadModel lead;
  final Function(LeadModel) onViewDetails;
  final Function(LeadModel) onOpenCopilot;
  final Function(LeadModel) onLogCall;
  final Function(LeadModel) onEdit;
  final Function(LeadModel)? onDelete;
  final Function(LeadModel)? onAssign;

  const LeadCard({
    super.key,
    required this.lead,
    required this.onViewDetails,
    required this.onOpenCopilot,
    required this.onLogCall,
    required this.onEdit,
    this.onDelete,
    this.onAssign,
  });

  Color _getPriorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'high':
        return AppColors.errorRed;
      case 'medium':
        return AppColors.brandPrimary;
      case 'low':
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

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;

    final statusColor = Formatters.getStatusColor(lead.status);
    final priorityColor = _getPriorityColor(lead.priority);

    return InkWell(
      onTap: () => onViewDetails(lead),
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
            // Top Row: Lead Code, Priority Chip, Status Badge, More Menu
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
                    lead.leadCode,
                    style: AppTypography.badge(color: AppColors.brandPrimary),
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                  decoration: BoxDecoration(
                    color: priorityColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 5,
                        height: 5,
                        decoration: BoxDecoration(
                          color: priorityColor,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        lead.priority,
                        style: AppTypography.caption(color: priorityColor, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Align(
                    alignment: Alignment.centerRight,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                      ),
                      child: Text(
                        lead.status,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.badge(color: statusColor),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 2),
                SizedBox(
                  width: 28,
                  height: 36,
                  child: PopupMenuButton<String>(
                    padding: EdgeInsets.zero,
                    icon: Icon(Icons.more_vert_rounded, color: textSecondary, size: 20),
                    color: isDark ? AppColors.darkSurfaceElevated : AppColors.lightSurfaceElevated,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: borderColor),
                  ),
                  onSelected: (val) {
                    if (val == 'details') onViewDetails(lead);
                    if (val == 'copilot') onOpenCopilot(lead);
                    if (val == 'log') onLogCall(lead);
                    if (val == 'edit') onEdit(lead);
                    if (val == 'assign' && onAssign != null) onAssign!(lead);
                    if (val == 'delete' && onDelete != null) onDelete!(lead);
                  },
                  itemBuilder: (ctx) => [
                    PopupMenuItem(
                      value: 'details',
                      child: Row(
                        children: [
                          const Icon(Icons.info_outline_rounded, size: 18),
                          const SizedBox(width: 10),
                          Text("View Lead Details", style: AppTypography.body(color: textPrimary)),
                        ],
                      ),
                    ),
                    PopupMenuItem(
                      value: 'copilot',
                      child: Row(
                        children: [
                          const Icon(Icons.auto_awesome_rounded, size: 18, color: AppColors.brandPrimary),
                          const SizedBox(width: 10),
                          Text("AI Deal Advisor", style: AppTypography.body(color: AppColors.brandPrimary, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    PopupMenuItem(
                      value: 'log',
                      child: Row(
                        children: [
                          const Icon(Icons.phone_in_talk_rounded, size: 18, color: AppColors.emeraldGreen),
                          const SizedBox(width: 10),
                          Text("Log Call / Followup", style: AppTypography.body(color: textPrimary)),
                        ],
                      ),
                    ),
                    PopupMenuItem(
                      value: 'edit',
                      child: Row(
                        children: [
                          const Icon(Icons.edit_outlined, size: 18),
                          const SizedBox(width: 10),
                          Text("Edit Lead", style: AppTypography.body(color: textPrimary)),
                        ],
                      ),
                    ),
                    if (onAssign != null)
                      PopupMenuItem(
                        value: 'assign',
                        child: Row(
                          children: [
                            const Icon(Icons.person_add_alt_1_outlined, size: 18),
                            const SizedBox(width: 10),
                            Text("Assign Lead", style: AppTypography.body(color: textPrimary)),
                          ],
                        ),
                      ),
                    if (onDelete != null) ...[
                      const PopupMenuDivider(),
                      PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            const Icon(Icons.delete_outline_rounded, size: 18, color: AppColors.errorRed),
                            const SizedBox(width: 10),
                            Text("Delete Lead", style: AppTypography.body(color: AppColors.errorRed)),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),

            const SizedBox(height: 10),

            // Customer Name & Location
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: AppColors.brandPrimary.withValues(alpha: 0.15),
                  child: Text(
                    lead.initials,
                    style: AppTypography.heading(size: 15, color: AppColors.brandPrimary, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        lead.customerName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.heading(size: 16, color: textPrimary),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          if (lead.city != null && lead.city!.isNotEmpty) ...[
                            Icon(Icons.location_on_outlined, size: 13, color: textSecondary),
                            const SizedBox(width: 3),
                            Flexible(
                              child: Text(
                                "${lead.city}${lead.state != null ? ', ${lead.state}' : ''}",
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppTypography.caption(color: textSecondary),
                              ),
                            ),
                            const SizedBox(width: 8),
                          ],
                          Flexible(
                            child: Text(
                              "Source: ${lead.leadSource}",
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTypography.caption(color: textSecondary),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Solar Metrics Box (Capacity, Quotation, Consumption)
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
                        Text("SOLAR CAPACITY", style: AppTypography.caption(color: textSecondary)),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            const Icon(Icons.solar_power_rounded, size: 15, color: AppColors.brandPrimary),
                            const SizedBox(width: 4),
                            Text(
                              Formatters.formatKw(lead.requiredKw),
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
                        Text("QUOTATION", style: AppTypography.caption(color: textSecondary)),
                        const SizedBox(height: 2),
                        Text(
                          lead.quotationAmount > 0
                              ? Formatters.formatCurrency(lead.quotationAmount, compact: true)
                              : "Pending",
                          style: AppTypography.body(
                            color: lead.quotationAmount > 0 ? AppColors.emeraldGreen : textSecondary,
                            fontWeight: FontWeight.bold,
                          ),
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
                        Text("FOLLOW-UPS", style: AppTypography.caption(color: textSecondary)),
                        const SizedBox(height: 2),
                        Text(
                          "${lead.totalFollowups} Logged",
                          style: AppTypography.body(color: textPrimary, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Action Toolbar (Call, WhatsApp, AI Copilot, Log Call)
            Row(
              children: [
                InkWell(
                  onTap: () => _makeCall(lead.mobileNumber),
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: surfaceColor,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: borderColor),
                    ),
                    child: const Icon(Icons.call_rounded, size: 16, color: AppColors.emeraldGreen),
                  ),
                ),
                const SizedBox(width: 8),
                InkWell(
                  onTap: () => _openWhatsApp(context, lead.mobileNumber),
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: surfaceColor,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: borderColor),
                    ),
                    child: const FaIcon(FontAwesomeIcons.whatsapp, size: 16, color: Color(0xFF25D366)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: InkWell(
                    onTap: () => onOpenCopilot(lead),
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.brandPrimary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.brandPrimary.withValues(alpha: 0.4)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.auto_awesome_rounded, size: 15, color: AppColors.brandPrimary),
                          const SizedBox(width: 6),
                          Text(
                            "AI Copilot",
                            style: AppTypography.caption(
                              color: AppColors.brandPrimary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: InkWell(
                    onTap: () => onLogCall(lead),
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(
                        color: surfaceColor,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: borderColor),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.phone_in_talk_rounded, size: 15, color: AppColors.skyBlue),
                          const SizedBox(width: 6),
                          Text(
                            "Log Call",
                            style: AppTypography.caption(color: textPrimary, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    lead.assignedToName != null && lead.assignedToName!.isNotEmpty
                        ? "Assigned: ${lead.assignedToName}"
                        : "Unassigned",
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.badge(color: textSecondary),
                  ),
                ),
                if (lead.nextFollowUpDate != null) ...[
                  const SizedBox(width: 8),
                  Text(
                    "Next: ${Formatters.formatDate(lead.nextFollowUpDate)}${lead.nextFollowUpTime != null && lead.nextFollowUpTime!.isNotEmpty ? ' ${lead.nextFollowUpTime}' : ''}",
                    style: AppTypography.badge(color: AppColors.brandPrimary),
                  ),
                ],
              ],
            ),
            if (lead.nextAction != null && lead.nextAction!.trim().isNotEmpty) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.bolt_rounded, size: 13, color: AppColors.brandPrimaryHover),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      lead.nextAction!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.badge(color: AppColors.brandPrimaryHover),
                    ),
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

