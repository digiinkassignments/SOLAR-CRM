import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/whatsapp_helper.dart';
import '../../../models/lead_model.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/dashboard_provider.dart';
import '../../../providers/lead_provider.dart';
import 'ai_copilot_sheet.dart';
import 'log_call_sheet.dart';
import '../../../providers/calculator_provider.dart';
import '../../calculator/solar_calculator_view.dart';
import '../../../providers/finance_provider.dart';
import '../../finance/finance_view.dart';

class LeadDetailsSheet extends StatefulWidget {
  final LeadModel lead;

  const LeadDetailsSheet({super.key, required this.lead});

  @override
  State<LeadDetailsSheet> createState() => _LeadDetailsSheetState();
}

class _LeadDetailsSheetState extends State<LeadDetailsSheet> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final p = Provider.of<LeadProvider>(context, listen: false);
      p.fetchFollowups(widget.lead.id);
      p.fetchAiCopilot(widget.lead.id);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _makeCall() async {
    await WhatsAppHelper.launchDialer(widget.lead.mobileNumber);
  }

  Future<void> _openWhatsApp() async {
    await WhatsAppHelper.launchWhatsApp(context: context, phone: widget.lead.mobileNumber);
  }

  @override
  Widget build(BuildContext context) {
    final leadProvider = Provider.of<LeadProvider>(context);
    final followups = leadProvider.leadFollowups;
    final copilot = leadProvider.aiCopilotData;

    final currentLead = leadProvider.leads.firstWhere(
      (l) => l.id == widget.lead.id,
      orElse: () => widget.lead,
    );

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;

    final statusColor = Formatters.getStatusColor(currentLead.status);

    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
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

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: AppColors.brandPrimary.withValues(alpha: 0.15),
                  child: Text(
                    currentLead.initials,
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
                              currentLead.customerName,
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
                              currentLead.leadCode,
                              style: AppTypography.badge(color: AppColors.brandPrimary),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                            decoration: BoxDecoration(
                              color: statusColor.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              currentLead.status,
                              style: AppTypography.badge(color: statusColor),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            "${Formatters.formatKw(currentLead.requiredKw)} • ${currentLead.city ?? 'Site'}",
                            style: AppTypography.caption(color: textSecondary),
                          ),
                        ],
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

          // Action Buttons
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
                const SizedBox(width: 8),
                Expanded(
                  child: _buildActionBtn(
                    icon: Icons.auto_awesome_rounded,
                    label: "AI Copilot",
                    color: AppColors.brandPrimary,
                    onTap: () {
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => AiCopilotSheet(lead: currentLead),
                      );
                    },
                    surfaceColor: surfaceColor,
                    borderColor: borderColor,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildActionBtn(
                    icon: Icons.phone_in_talk_rounded,
                    label: "Log Call",
                    color: AppColors.skyBlue,
                    onTap: () async {
                      final auth = Provider.of<AuthProvider>(context, listen: false);
                      final dashboard = Provider.of<DashboardProvider>(context, listen: false);
                      final res = await showModalBottomSheet<bool>(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => LogCallSheet(lead: currentLead),
                      );
                      if (res == true && mounted) {
                        await leadProvider.fetchFollowups(currentLead.id);
                        await leadProvider.fetchLeads(isRefresh: true);
                        final u = auth.user;
                        if (u != null) {
                          if (u.isAdmin) dashboard.fetchAdminDashboard(isRefresh: true);
                          if (u.isManager) dashboard.fetchManagerDashboard(isRefresh: true);
                          if (u.isSales) dashboard.fetchSalesDashboard(isRefresh: true);
                          if (u.isFinance || u.isApplicationManager) dashboard.fetchPortalDashboard(isRefresh: true);
                        }
                      }
                    },
                    surfaceColor: surfaceColor,
                    borderColor: borderColor,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 10),

          // Solar Proposal Calculator Quick Action
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: InkWell(
              onTap: () {
                final calc = Provider.of<CalculatorProvider>(context, listen: false);
                calc.prefillFromLead(widget.lead);
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => SolarCalculatorView(
                      initialCustomerName: widget.lead.customerName,
                      initialCustomerPhone: widget.lead.mobileNumber,
                      initialLeadId: widget.lead.id,
                    ),
                  ),
                );
              },
              borderRadius: BorderRadius.circular(10),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.brandPrimary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.brandPrimary.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calculate_outlined, color: AppColors.brandPrimary, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Calculate Solar Proposal & Subsidy",
                            style: AppTypography.bodySmall(color: AppColors.brandPrimary, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            "Generate tailored ${Formatters.formatKw(widget.lead.requiredKw)} ROI quotation with PM Surya Ghar",
                            style: AppTypography.caption(color: textSecondary),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.brandPrimary),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 8),

          // Quotations & Invoices Action
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: InkWell(
              onTap: () {
                final finance = Provider.of<FinanceProvider>(context, listen: false);
                finance.setQuotationSearch(widget.lead.customerName);
                finance.setInvoiceSearch(widget.lead.customerName);
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const FinanceView()),
                );
              },
              borderRadius: BorderRadius.circular(10),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.skyBlue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.skyBlue.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.receipt_long_rounded, color: AppColors.skyBlue, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "View Quotations & Invoices",
                            style: AppTypography.bodySmall(color: AppColors.skyBlue, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            "Track proposals, GST billing & recorded payments",
                            style: AppTypography.caption(color: textSecondary),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.skyBlue),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 16),

          TabBar(
            controller: _tabController,
            labelColor: AppColors.brandPrimary,
            unselectedLabelColor: textSecondary,
            indicatorColor: AppColors.brandPrimary,
            indicatorSize: TabBarIndicatorSize.label,
            labelStyle: AppTypography.caption(fontWeight: FontWeight.bold),
            unselectedLabelStyle: AppTypography.caption(),
            tabs: const [
              Tab(text: "Site Details"),
              Tab(text: "AI Advisor"),
              Tab(text: "Timeline"),
            ],
          ),
          Divider(color: borderColor, height: 1),

          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // 1. Site Details
                SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      _buildDetailBox(
                        title: "SOLAR & TECHNICAL REQUIREMENTS",
                        surfaceColor: surfaceColor,
                        borderColor: borderColor,
                        textPrimary: textPrimary,
                        textSecondary: textSecondary,
                        items: [
                          {"label": "Required Capacity", "value": Formatters.formatKw(currentLead.requiredKw)},
                          {"label": "Requirement Sector", "value": currentLead.solarRequirement},
                          {"label": "Roof Type", "value": currentLead.roofType ?? "Not specified"},
                          {"label": "Monthly Units", "value": currentLead.monthlyConsumptionUnits != null ? "${currentLead.monthlyConsumptionUnits} kWh" : "N/A"},
                          {"label": "Quotation Total", "value": currentLead.quotationAmount > 0 ? Formatters.formatCurrency(currentLead.quotationAmount) : "Pending"},
                        ],
                      ),
                      const SizedBox(height: 16),
                      _buildDetailBox(
                        title: "SITE LOCATION & ASSIGNMENT",
                        surfaceColor: surfaceColor,
                        borderColor: borderColor,
                        textPrimary: textPrimary,
                        textSecondary: textSecondary,
                        items: [
                          {"label": "Address", "value": currentLead.address ?? "Not specified"},
                          {"label": "City & State", "value": "${currentLead.city ?? '-'}, ${currentLead.state ?? '-'}"},
                          {"label": "Assigned Sales Rep", "value": currentLead.assignedToName ?? "Unassigned"},
                          {"label": "Lead Source", "value": currentLead.leadSource},
                          if (currentLead.nextAction != null && currentLead.nextAction!.trim().isNotEmpty)
                            {"label": "Next Action", "value": currentLead.nextAction!},
                          if (currentLead.nextFollowUpDate != null)
                            {"label": "Next Follow-up", "value": "${Formatters.formatDate(currentLead.nextFollowUpDate)} ${currentLead.nextFollowUpTime ?? ''}"},
                        ],
                      ),
                    ],
                  ),
                ),

                // 2. AI Advisor Tab
                copilot != null
                    ? SingleChildScrollView(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: surfaceColor,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: borderColor),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 26,
                                    backgroundColor: AppColors.brandPrimary.withValues(alpha: 0.15),
                                    child: Text(
                                      "${copilot.winProbability}%",
                                      style: AppTypography.heading(size: 16, color: AppColors.brandPrimary, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text("WIN PROBABILITY", style: AppTypography.badge(color: AppColors.brandPrimary)),
                                        const SizedBox(height: 4),
                                        Text(copilot.executiveAssessment, style: AppTypography.body(color: textPrimary, fontSize: 13)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),
                            if (copilot.talkingPoints.isNotEmpty) ...[
                              Text("RECOMMENDED TALKING POINTS", style: AppTypography.badge(color: AppColors.skyBlue)),
                              const SizedBox(height: 8),
                              ...copilot.talkingPoints.map((tp) => Container(
                                    margin: const EdgeInsets.only(bottom: 8),
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: surfaceColor,
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(color: borderColor),
                                    ),
                                    child: Text(tp, style: AppTypography.body(color: textPrimary, fontSize: 13)),
                                  )),
                            ],
                          ],
                        ),
                      )
                    : Center(child: Text("No AI analysis loaded", style: AppTypography.body(color: textSecondary))),

                // 3. Followup Timeline
                followups.isEmpty
                    ? Center(child: Text("No follow-ups logged yet", style: AppTypography.body(color: textSecondary)))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: followups.length,
                        itemBuilder: (ctx, i) {
                          final f = followups[i];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: surfaceColor,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: borderColor),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Row(
                                        children: [
                                          Text(
                                            f.followupType,
                                            style: AppTypography.body(
                                              color: AppColors.brandPrimary,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          if (f.callOutcome != null && f.callOutcome!.isNotEmpty) ...[
                                            Text(
                                              " • ${f.callOutcome}",
                                              style: AppTypography.body(
                                                color: textPrimary,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    Text(
                                      Formatters.formatDate(f.createdAt),
                                      style: AppTypography.caption(color: textSecondary),
                                    ),
                                  ],
                                ),
                                if (f.statusAfterFollowup != null && f.statusAfterFollowup!.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: Formatters.getStatusColor(f.statusAfterFollowup!).withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      "Stage: ${f.statusAfterFollowup}",
                                      style: AppTypography.badge(
                                        color: Formatters.getStatusColor(f.statusAfterFollowup!),
                                      ),
                                    ),
                                  ),
                                ],
                                const SizedBox(height: 6),
                                Text(f.note, style: AppTypography.body(color: textPrimary, fontSize: 13)),
                                if (f.nextAction != null && f.nextAction!.trim().isNotEmpty) ...[
                                  const SizedBox(height: 6),
                                  Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Icon(Icons.bolt_rounded, size: 14, color: AppColors.brandPrimaryHover),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          "Next: ${f.nextAction}",
                                          style: AppTypography.caption(
                                            color: AppColors.brandPrimaryHover,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                                if (f.nextFollowupDate != null && f.nextFollowupDate!.trim().isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Icon(Icons.calendar_today_rounded, size: 12, color: textSecondary),
                                      const SizedBox(width: 4),
                                      Text(
                                        "Follow-up: ${Formatters.formatDate(f.nextFollowupDate)} ${f.nextFollowUpTime ?? ''}",
                                        style: AppTypography.badge(color: textSecondary),
                                      ),
                                    ],
                                  ),
                                ],
                                if (f.performedByName != null) ...[
                                  const SizedBox(height: 4),
                                  Text("By: ${f.performedByName}", style: AppTypography.badge(color: textSecondary)),
                                ],
                              ],
                            ),
                          );
                        },
                      ),
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

  Widget _buildDetailBox({
    required String title,
    required Color surfaceColor,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
    required List<Map<String, String>> items,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: AppTypography.badge(color: textSecondary)),
          const SizedBox(height: 8),
          ...List.generate(items.length, (idx) {
            final item = items[idx];
            return Column(
              children: [
                if (idx > 0) Divider(color: borderColor, height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(item['label']!, style: AppTypography.caption(color: textSecondary)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        item['value']!,
                        textAlign: TextAlign.end,
                        style: AppTypography.body(color: textPrimary, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ],
            );
          }),
        ],
      ),
    );
  }
}

