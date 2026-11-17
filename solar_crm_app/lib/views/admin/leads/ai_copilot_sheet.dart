import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../core/utils/whatsapp_helper.dart';
import '../../../models/lead_model.dart';
import '../../../providers/lead_provider.dart';

class AiCopilotSheet extends StatefulWidget {
  final LeadModel lead;

  const AiCopilotSheet({super.key, required this.lead});

  @override
  State<AiCopilotSheet> createState() => _AiCopilotSheetState();
}

class _AiCopilotSheetState extends State<AiCopilotSheet> {
  int _selectedPitchTab = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<LeadProvider>(context, listen: false)
          .fetchAiCopilot(widget.lead.id, widget.lead);
    });
  }

  Color _getProbabilityColor(int winRate) {
    if (winRate >= 70) return AppColors.emeraldGreen;
    if (winRate >= 45) return AppColors.brandPrimary;
    return AppColors.errorRed;
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("$label copied to clipboard!"),
        duration: const Duration(seconds: 2),
        backgroundColor: AppColors.darkCard,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _openWhatsApp(String phone, String text) async {
    await WhatsAppHelper.launchWhatsApp(context: context, phone: phone, text: text);
  }

  @override
  Widget build(BuildContext context) {
    final leadProvider = Provider.of<LeadProvider>(context);
    final copilot = leadProvider.aiCopilotData;
    final isLoading = leadProvider.isLoadingAi;
    final error = leadProvider.aiError;

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
          // Drag Handle
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
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.brandPrimary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.auto_awesome_rounded, color: AppColors.brandPrimary, size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 6,
                        runSpacing: 2,
                        children: [
                          Text(
                            "Solar Lead Copilot",
                            style: AppTypography.heading(size: 16, color: textPrimary),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                            decoration: BoxDecoration(
                              color: AppColors.purple.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              "AI ADVISOR",
                              style: AppTypography.badge(color: AppColors.purple),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        "${widget.lead.customerName} • ${widget.lead.leadCode}",
                        style: AppTypography.caption(color: textSecondary),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 20),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          Divider(color: borderColor, height: 20),

          // Body
          Expanded(
            child: isLoading
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const CircularProgressIndicator(color: AppColors.brandPrimary),
                        const SizedBox(height: 16),
                        Text(
                          "Analyzing customer profile & subsidy models...",
                          style: AppTypography.body(color: textSecondary),
                        ),
                      ],
                    ),
                  )
                : error != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24.0),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.info_outline_rounded, color: AppColors.brandPrimary, size: 36),
                              const SizedBox(height: 12),
                              Text(
                                error,
                                textAlign: TextAlign.center,
                                style: AppTypography.body(color: textPrimary),
                              ),
                              const SizedBox(height: 16),
                              OutlinedButton.icon(
                                icon: const Icon(Icons.refresh_rounded),
                                label: const Text("Re-run Analysis"),
                                onPressed: () {
                                  leadProvider.fetchAiCopilot(widget.lead.id, widget.lead);
                                },
                              ),
                            ],
                          ),
                        ),
                      )
                    : copilot == null
                        ? const SizedBox.shrink()
                        : SingleChildScrollView(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Win Probability & Executive Assessment Row
                                Container(
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color: surfaceColor,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: borderColor),
                                  ),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Probability Gauge
                                      Column(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Container(
                                            width: 60,
                                            height: 60,
                                            alignment: Alignment.center,
                                            decoration: BoxDecoration(
                                              shape: BoxShape.circle,
                                              border: Border.all(
                                                color: _getProbabilityColor(copilot.winProbability),
                                                width: 4,
                                              ),
                                            ),
                                            child: Text(
                                              "${copilot.winProbability}%",
                                              style: AppTypography.heading(
                                                size: 16,
                                                color: _getProbabilityColor(copilot.winProbability),
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            "WIN RATE",
                                            textAlign: TextAlign.center,
                                            style: AppTypography.caption(
                                              color: textSecondary,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(width: 14),
                                      // Executive Assessment
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                const Icon(Icons.lightbulb_outline_rounded,
                                                    size: 14, color: AppColors.brandPrimary),
                                                const SizedBox(width: 4),
                                                Expanded(
                                                  child: Text(
                                                    copilot.dealHealth.toUpperCase(),
                                                    style: AppTypography.badge(color: AppColors.brandPrimary),
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              copilot.executiveAssessment,
                                              style: AppTypography.body(color: textPrimary, fontSize: 12.5),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                                const SizedBox(height: 12),

                                // System & Subsidy Recommendations
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    if (copilot.recommendedSystem.isNotEmpty)
                                      Expanded(
                                        child: Container(
                                          padding: const EdgeInsets.all(12),
                                          decoration: BoxDecoration(
                                            color: surfaceColor,
                                            borderRadius: BorderRadius.circular(14),
                                            border: Border.all(color: borderColor),
                                          ),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                children: [
                                                  const Icon(Icons.flash_on_rounded, size: 14, color: AppColors.brandPrimary),
                                                  const SizedBox(width: 4),
                                                  Expanded(
                                                    child: Text(
                                                      "Recommended",
                                                      style: AppTypography.badge(color: textSecondary),
                                                      maxLines: 1,
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 6),
                                              Text(
                                                copilot.recommendedSystem,
                                                style: AppTypography.body(
                                                    color: textPrimary, fontWeight: FontWeight.w600, fontSize: 12),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    if (copilot.recommendedSystem.isNotEmpty && copilot.estimatedSubsidy.isNotEmpty)
                                      const SizedBox(width: 8),
                                    if (copilot.estimatedSubsidy.isNotEmpty)
                                      Expanded(
                                        child: Container(
                                          padding: const EdgeInsets.all(12),
                                          decoration: BoxDecoration(
                                            color: surfaceColor,
                                            borderRadius: BorderRadius.circular(14),
                                            border: Border.all(color: borderColor),
                                          ),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                children: [
                                                  const Icon(Icons.savings_outlined, size: 14, color: AppColors.emeraldGreen),
                                                  const SizedBox(width: 4),
                                                  Expanded(
                                                    child: Text(
                                                      "Subsidy / DBT",
                                                      style: AppTypography.badge(color: textSecondary),
                                                      maxLines: 1,
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 6),
                                              Text(
                                                copilot.estimatedSubsidy,
                                                style: AppTypography.body(
                                                    color: textPrimary, fontWeight: FontWeight.w600, fontSize: 12),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                  ],
                                ),

                                if (copilot.estimatedSavings.isNotEmpty) ...[
                                  const SizedBox(height: 10),
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                    decoration: BoxDecoration(
                                      color: AppColors.emeraldGreen.withValues(alpha: 0.08),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: AppColors.emeraldGreen.withValues(alpha: 0.2)),
                                    ),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.trending_up_rounded, size: 18, color: AppColors.emeraldGreen),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            copilot.estimatedSavings,
                                            style: AppTypography.body(
                                              color: textPrimary,
                                              fontSize: 12.5,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],

                                const SizedBox(height: 16),

                                // Strategic Call Talking Points
                                if (copilot.talkingPoints.isNotEmpty) ...[
                                  Row(
                                    children: [
                                      const Icon(Icons.record_voice_over_outlined, size: 15, color: AppColors.skyBlue),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          "STRATEGIC CALL TALKING POINTS",
                                          style: AppTypography.badge(color: AppColors.skyBlue),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  ...List.generate(copilot.talkingPoints.length, (idx) {
                                    return Container(
                                      margin: const EdgeInsets.only(bottom: 8),
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: surfaceColor,
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(color: borderColor),
                                      ),
                                      child: Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Container(
                                            width: 20,
                                            height: 20,
                                            alignment: Alignment.center,
                                            decoration: BoxDecoration(
                                              color: AppColors.skyBlue.withValues(alpha: 0.15),
                                              shape: BoxShape.circle,
                                            ),
                                            child: Text(
                                              "${idx + 1}",
                                              style: AppTypography.caption(
                                                color: AppColors.skyBlue,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 10),
                                          Expanded(
                                            child: Text(
                                              copilot.talkingPoints[idx],
                                              style: AppTypography.body(color: textPrimary, fontSize: 12.5),
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  }),
                                ],

                                // Objection handling tip
                                if (copilot.keyObjectionTips.isNotEmpty) ...[
                                  const SizedBox(height: 10),
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: AppColors.brandPrimary.withValues(alpha: 0.08),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: AppColors.brandPrimary.withValues(alpha: 0.2)),
                                    ),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Icon(Icons.shield_outlined, size: 16, color: AppColors.brandPrimary),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                "OBJECTION HANDLING PRO-TIP",
                                                style: AppTypography.badge(color: AppColors.brandPrimary),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                copilot.keyObjectionTips,
                                                style: AppTypography.body(color: textPrimary, fontSize: 12),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],

                                // WhatsApp Pitch Templates
                                if (copilot.whatsappPitches.isNotEmpty) ...[
                                  const SizedBox(height: 16),
                                  Row(
                                    children: [
                                      const FaIcon(FontAwesomeIcons.whatsapp, size: 15, color: Color(0xFF25D366)),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          "READY-TO-SEND WHATSAPP PITCHES",
                                          style: AppTypography.badge(color: const Color(0xFF25D366)),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  // Tab selector
                                  SingleChildScrollView(
                                    scrollDirection: Axis.horizontal,
                                    child: Row(
                                      children: [
                                        _buildPitchTab(0, "Formal Pitch", isDark),
                                        const SizedBox(width: 8),
                                        _buildPitchTab(1, "Subsidy Focus", isDark),
                                        const SizedBox(width: 8),
                                        _buildPitchTab(2, "Urgent Followup", isDark),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  _buildSelectedPitchCard(copilot, surfaceColor, borderColor, textPrimary),
                                ],

                                const SizedBox(height: 24),
                              ],
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildPitchTab(int index, String label, bool isDark) {
    final isSelected = _selectedPitchTab == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedPitchTab = index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.emeraldGreen.withValues(alpha: 0.15)
              : (isDark ? AppColors.darkSurface : AppColors.lightSurface),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.emeraldGreen : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
          ),
        ),
        child: Text(
          label,
          style: AppTypography.caption(
            color: isSelected ? AppColors.emeraldGreen : (isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildSelectedPitchCard(
    AiCopilotModel copilot,
    Color surfaceColor,
    Color borderColor,
    Color textPrimary,
  ) {
    String pitchText = "";
    String pitchLabel = "Pitch";
    if (_selectedPitchTab == 0) {
      pitchText = copilot.whatsappPitches['formal'] ?? "";
      pitchLabel = "Formal Proposal";
    } else if (_selectedPitchTab == 1) {
      pitchText = copilot.whatsappPitches['subsidy_focus'] ?? "";
      pitchLabel = "Subsidy Focus";
    } else {
      pitchText = copilot.whatsappPitches['urgent_followup'] ?? "";
      pitchLabel = "Quick Followup";
    }

    if (pitchText.isEmpty) {
      pitchText = copilot.executiveAssessment;
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SelectableText(
            pitchText,
            style: AppTypography.body(color: textPrimary, fontSize: 12),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              OutlinedButton.icon(
                icon: const Icon(Icons.copy_rounded, size: 14),
                label: const Text("Copy", style: TextStyle(fontSize: 12)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  visualDensity: VisualDensity.compact,
                ),
                onPressed: () => _copyToClipboard(pitchText, pitchLabel),
              ),
              const SizedBox(width: 8),
              ElevatedButton.icon(
                icon: const FaIcon(FontAwesomeIcons.whatsapp, size: 14, color: Colors.white),
                label: const Text("WhatsApp", style: TextStyle(fontSize: 12, color: Colors.white)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF25D366),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  visualDensity: VisualDensity.compact,
                ),
                onPressed: () => _openWhatsApp(widget.lead.mobileNumber, pitchText),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
