import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/whatsapp_helper.dart';
import '../../models/solar_calculator_model.dart';
import '../../providers/calculator_provider.dart';

class SolarCalculatorView extends StatefulWidget {
  final String? initialCustomerName;
  final String? initialCustomerPhone;
  final int? initialLeadId;

  const SolarCalculatorView({
    super.key,
    this.initialCustomerName,
    this.initialCustomerPhone,
    this.initialLeadId,
  });

  @override
  State<SolarCalculatorView> createState() => _SolarCalculatorViewState();
}

class _SolarCalculatorViewState extends State<SolarCalculatorView> {
  final TextEditingController _inputController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final calc = Provider.of<CalculatorProvider>(context, listen: false);
      if (widget.initialCustomerName != null || widget.initialCustomerPhone != null) {
        calc.setCustomerInfo(
          name: widget.initialCustomerName,
          phone: widget.initialCustomerPhone,
          leadId: widget.initialLeadId,
        );
      }
      _nameController.text = calc.customerName;
      _phoneController.text = calc.customerPhone;
      _syncInputController(calc);
    });
  }

  @override
  void dispose() {
    _inputController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _syncInputController(CalculatorProvider calc) {
    if (calc.calcMode == "bill") {
      _inputController.text = calc.monthlyBill.toStringAsFixed(0);
    } else if (calc.calcMode == "units") {
      _inputController.text = calc.monthlyUnits.toStringAsFixed(0);
    } else {
      _inputController.text = calc.roofAreaSqft.toStringAsFixed(0);
    }
  }

  void _copyQuotation(String text) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(
          children: [
            Icon(Icons.check_circle_rounded, color: AppColors.emeraldGreen, size: 18),
            SizedBox(width: 8),
            Text("Solar Proposal copied to clipboard!"),
          ],
        ),
        duration: const Duration(seconds: 2),
        backgroundColor: AppColors.darkCard,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _shareOnWhatsApp(CalculatorProvider calc) async {
    final text = calc.result.generateWhatsAppQuotation(
      customerName: calc.customerName,
    );
    await WhatsAppHelper.launchWhatsApp(
      context: context,
      phone: calc.customerPhone,
      text: text,
    );
  }

  void _showCustomerEditDialog(CalculatorProvider calc, bool isDark, Color cardBg, Color borderColor) {
    _nameController.text = calc.customerName;
    _phoneController.text = calc.customerPhone;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: cardBg,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: borderColor),
        ),
        title: Text("Lead / Customer Details", style: AppTypography.headingSmall()),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: "Customer Name",
                hintText: "e.g. Ramesh Kumar",
                prefixIcon: const Icon(Icons.person_outline_rounded, size: 20),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                labelText: "WhatsApp / Mobile Number",
                hintText: "e.g. 9876543210",
                prefixIcon: const Icon(Icons.phone_outlined, size: 20),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.brandPrimary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () {
              calc.setCustomerInfo(
                name: _nameController.text.trim(),
                phone: _phoneController.text.trim(),
              );
              Navigator.pop(ctx);
            },
            child: const Text("Save"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final calc = Provider.of<CalculatorProvider>(context);
    final res = calc.result;

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AppColors.darkCard : AppColors.lightCard;
    final borderColor = isDark ? AppColors.darkBorder : AppColors.lightBorder;
    final textPrimary = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
    final textSecondary = isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight;
    final surfaceColor = isDark ? AppColors.darkSurface : AppColors.lightSurface;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Solar ROI & Subsidy Calculator",
              style: AppTypography.heading(size: 17, color: textPrimary, fontWeight: FontWeight.w600),
            ),
            Text(
              "PM Surya Ghar & Commercial System Sizing",
              style: AppTypography.caption(color: textSecondary),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 22),
            tooltip: "Reset to Default",
            onPressed: () {
              calc.setCalcMode("bill");
              calc.setMonthlyBill(5000.0);
              calc.setSelectedState("Rajasthan");
              calc.setPropertyType("Residential");
              _syncInputController(calc);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text("Calculator reset to 5,000/mo default."),
                  duration: Duration(seconds: 1),
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        physics: const BouncingScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Customer Banner (optional/editable)
            _buildCustomerBar(calc, isDark, cardBg, borderColor, textPrimary, textSecondary),

            const SizedBox(height: 12),

            // Mode Selector Tabs (Bill | Units | Roof)
            _buildModeSelector(calc, isDark, surfaceColor, borderColor),

            const SizedBox(height: 14),

            // Interactive Input Card
            _buildInputControlCard(calc, isDark, cardBg, borderColor, textPrimary, textSecondary),

            const SizedBox(height: 14),

            // State, Tariff & Property Selector Card
            _buildStateAndPropertyCard(calc, isDark, cardBg, borderColor, textPrimary, textSecondary),

            const SizedBox(height: 16),

            // System Sizing Hero Card
            _buildSystemSizingCard(res, isDark, cardBg, borderColor, textPrimary, textSecondary),

            const SizedBox(height: 14),

            // Financial Breakdown & Subsidy Card
            _buildFinancialCard(res, isDark, cardBg, borderColor, textPrimary, textSecondary),

            const SizedBox(height: 14),

            // Environmental Impact Card
            _buildEnvironmentalCard(res, isDark, cardBg, borderColor, textPrimary, textSecondary),

            const SizedBox(height: 80), // Padding for bottom sticky bar
          ],
        ),
      ),
      bottomSheet: _buildBottomActionBar(calc, isDark, cardBg, borderColor, textPrimary),
    );
  }

  // --- CUSTOMER BANNER ---
  Widget _buildCustomerBar(
    CalculatorProvider calc,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final hasCustomer = calc.customerName.isNotEmpty;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: AppColors.brandPrimary.withValues(alpha: 0.15),
            child: const Icon(Icons.person_rounded, size: 18, color: AppColors.brandPrimary),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  hasCustomer ? calc.customerName : "Unassigned Lead / Customer",
                  style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w600),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  calc.customerPhone.isNotEmpty
                      ? calc.customerPhone
                      : "Tap edit to personalize proposal for customer",
                  style: AppTypography.caption(color: textSecondary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.brandPrimary),
            tooltip: "Edit Customer Info",
            onPressed: () => _showCustomerEditDialog(calc, isDark, cardBg, borderColor),
          ),
        ],
      ),
    );
  }

  // --- MODE SELECTOR TABS ---
  Widget _buildModeSelector(
    CalculatorProvider calc,
    bool isDark,
    Color surfaceColor,
    Color borderColor,
  ) {
    final modes = [
      {'key': 'bill', 'label': 'Monthly Bill (₹)', 'icon': Icons.currency_rupee_rounded},
      {'key': 'units', 'label': 'Units (kWh)', 'icon': Icons.bolt_rounded},
      {'key': 'roof', 'label': 'Roof Area (sq.ft)', 'icon': Icons.roofing_rounded},
    ];

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: modes.map((m) {
          final isSelected = calc.calcMode == m['key'];
          return Expanded(
            child: InkWell(
              onTap: () {
                calc.setCalcMode(m['key'] as String);
                _syncInputController(calc);
              },
              borderRadius: BorderRadius.circular(9),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(vertical: 9),
                decoration: BoxDecoration(
                  color: isSelected
                      ? (isDark ? Colors.white : Colors.black)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      m['icon'] as IconData,
                      size: 15,
                      color: isSelected
                          ? (isDark ? Colors.black : Colors.white)
                          : (isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
                    ),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        m['key'] == 'bill'
                            ? "By Bill"
                            : m['key'] == 'units'
                                ? "By Units"
                                : "By Roof",
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          color: isSelected
                              ? (isDark ? Colors.black : Colors.white)
                              : (isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // --- INPUT CONTROL CARD ---
  Widget _buildInputControlCard(
    CalculatorProvider calc,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    if (calc.calcMode == "bill") {
      return _buildSliderInputCard(
        title: "Average Monthly Electricity Bill",
        unitPrefix: "₹ ",
        unitSuffix: " / mo",
        value: calc.monthlyBill,
        min: 500,
        max: 50000,
        divisions: 99,
        presets: [2500, 5000, 8000, 12000, 20000],
        onChanged: (val) {
          calc.setMonthlyBill(val);
          _inputController.text = val.toStringAsFixed(0);
        },
        onSubmitted: (val) {
          final n = double.tryParse(val);
          if (n != null && n > 0) calc.setMonthlyBill(n);
        },
        cardBg: cardBg,
        borderColor: borderColor,
        textPrimary: textPrimary,
        textSecondary: textSecondary,
      );
    } else if (calc.calcMode == "units") {
      return _buildSliderInputCard(
        title: "Monthly Power Consumption",
        unitPrefix: "",
        unitSuffix: " Units (kWh)",
        value: calc.monthlyUnits,
        min: 50,
        max: 6000,
        divisions: 119,
        presets: [300, 600, 1000, 1500, 2500],
        onChanged: (val) {
          calc.setMonthlyUnits(val);
          _inputController.text = val.toStringAsFixed(0);
        },
        onSubmitted: (val) {
          final n = double.tryParse(val);
          if (n != null && n > 0) calc.setMonthlyUnits(n);
        },
        cardBg: cardBg,
        borderColor: borderColor,
        textPrimary: textPrimary,
        textSecondary: textSecondary,
      );
    } else {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    "Total Rooftop Shadow-Free Area",
                    style: AppTypography.headingSmall(color: textPrimary),
                  ),
                ),
                SizedBox(
                  width: 90,
                  height: 38,
                  child: TextField(
                    controller: _inputController,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.end,
                    style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.bold),
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                      suffixText: "sq.ft",
                      suffixStyle: AppTypography.caption(color: textSecondary),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onSubmitted: (val) {
                      final n = double.tryParse(val);
                      if (n != null && n > 0) calc.setRoofArea(n);
                    },
                  ),
                ),
              ],
            ),
            Slider(
              value: calc.roofAreaSqft.clamp(100.0, 5000.0),
              min: 100,
              max: 5000,
              divisions: 98,
              activeColor: AppColors.brandPrimary,
              onChanged: (val) {
                calc.setRoofArea(val);
                _inputController.text = val.toStringAsFixed(0);
              },
            ),
            const SizedBox(height: 8),
            // Usable percent slider
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "Usable Area for Panels: ${calc.roofUsablePercent.toStringAsFixed(0)}%",
                  style: AppTypography.caption(color: textSecondary),
                ),
                Text(
                  "= ${(calc.roofAreaSqft * calc.roofUsablePercent / 100).toStringAsFixed(0)} sq.ft effective",
                  style: AppTypography.caption(color: AppColors.brandPrimary, fontWeight: FontWeight.w600),
                ),
              ],
            ),
            Slider(
              value: calc.roofUsablePercent.clamp(20.0, 100.0),
              min: 20,
              max: 100,
              divisions: 16,
              activeColor: AppColors.emeraldGreen,
              onChanged: (val) => calc.setRoofUsablePercent(val),
            ),
          ],
        ),
      );
    }
  }

  Widget _buildSliderInputCard({
    required String title,
    required String unitPrefix,
    required String unitSuffix,
    required double value,
    required double min,
    required double max,
    required int divisions,
    required List<num> presets,
    required ValueChanged<double> onChanged,
    required ValueChanged<String> onSubmitted,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: AppTypography.headingSmall(color: textPrimary),
                ),
              ),
              SizedBox(
                width: 105,
                height: 38,
                child: TextField(
                  controller: _inputController,
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.end,
                  style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    prefixText: unitPrefix,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onSubmitted: onSubmitted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Slider(
            value: value.clamp(min, max),
            min: min,
            max: max,
            divisions: divisions,
            activeColor: AppColors.brandPrimary,
            onChanged: onChanged,
          ),
          // Presets row
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: presets.map((p) {
              final isMatch = (value.round() == p.round());
              return InkWell(
                onTap: () {
                  onChanged(p.toDouble());
                },
                borderRadius: BorderRadius.circular(6),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isMatch ? AppColors.brandPrimary.withValues(alpha: 0.15) : Colors.transparent,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: isMatch ? AppColors.brandPrimary : borderColor,
                    ),
                  ),
                  child: Text(
                    "$unitPrefix$p",
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: isMatch ? FontWeight.bold : FontWeight.normal,
                      color: isMatch ? AppColors.brandPrimary : textSecondary,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // --- STATE & PROPERTY SELECTOR CARD ---
  Widget _buildStateAndPropertyCard(
    CalculatorProvider calc,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // State and tariff row
          Row(
            children: [
              Expanded(
                flex: 3,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("State (Discom Grid)", style: AppTypography.caption(color: textSecondary)),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: borderColor),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: IndianSolarData.states.any((s) => s.name == calc.selectedState)
                              ? calc.selectedState
                              : IndianSolarData.states.first.name,
                          isExpanded: true,
                          icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 20),
                          items: IndianSolarData.states.map((s) {
                            return DropdownMenuItem(
                              value: s.name,
                              child: Text(
                                s.name,
                                style: AppTypography.bodySmall(color: textPrimary),
                              ),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) calc.setSelectedState(val);
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Tariff (₹/kWh)", style: AppTypography.caption(color: textSecondary)),
                    const SizedBox(height: 4),
                    Container(
                      height: 48,
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: borderColor),
                      ),
                      alignment: Alignment.centerLeft,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            "₹${calc.tariffRate.toStringAsFixed(1)}",
                            style: AppTypography.bodySmall(color: AppColors.brandPrimary, fontWeight: FontWeight.bold),
                          ),
                          InkWell(
                            onTap: () => _showTariffEditDialog(calc, isDark, cardBg, borderColor),
                            child: const Icon(Icons.edit_outlined, size: 16, color: AppColors.brandPrimary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Property Type
          Text("Property Type", style: AppTypography.caption(color: textSecondary)),
          const SizedBox(height: 6),
          Row(
            children: ["Residential", "Commercial", "Industrial"].map((type) {
              final isSel = calc.propertyType == type;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 3),
                  child: InkWell(
                    onTap: () => calc.setPropertyType(type),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: isSel ? AppColors.brandPrimary.withValues(alpha: 0.15) : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isSel ? AppColors.brandPrimary : borderColor,
                          width: isSel ? 1.5 : 1.0,
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        type,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                          color: isSel ? AppColors.brandPrimary : textPrimary,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 12),

          // Subsidy Scheme Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: calc.propertyType == "Residential"
                  ? AppColors.emeraldGreen.withValues(alpha: 0.1)
                  : AppColors.skyBlue.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: calc.propertyType == "Residential"
                    ? AppColors.emeraldGreen.withValues(alpha: 0.3)
                    : AppColors.skyBlue.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  calc.propertyType == "Residential"
                      ? Icons.verified_user_rounded
                      : Icons.account_balance_rounded,
                  size: 20,
                  color: calc.propertyType == "Residential" ? AppColors.emeraldGreen : AppColors.skyBlue,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        calc.propertyType == "Residential"
                            ? "PM Surya Ghar: Muft Bijli Yojana"
                            : "Commercial Tax Benefit",
                        style: AppTypography.bodySmall(
                          color: calc.propertyType == "Residential"
                              ? AppColors.emeraldGreen
                              : AppColors.skyBlue,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        calc.propertyType == "Residential"
                            ? "Direct Central DBT CFA: Up to ₹78,000 for DCR panels"
                            : "Accelerated Tax Depreciation @ 40% (Sec 32 IT Act)",
                        style: AppTypography.caption(color: textSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showTariffEditDialog(CalculatorProvider calc, bool isDark, Color cardBg, Color borderColor) {
    final tc = TextEditingController(text: calc.tariffRate.toStringAsFixed(1));
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: cardBg,
        title: Text("Custom Electricity Tariff", style: AppTypography.headingSmall()),
        content: TextField(
          controller: tc,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(
            labelText: "Tariff Rate (₹ per kWh)",
            suffixText: "₹/unit",
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Cancel")),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.brandPrimary),
            onPressed: () {
              final n = double.tryParse(tc.text);
              if (n != null && n > 0) calc.setTariffRate(n);
              Navigator.pop(ctx);
            },
            child: const Text("Apply", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  // --- SYSTEM SIZING HERO CARD ---
  Widget _buildSystemSizingCard(
    SolarCalculationResult res,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.brandPrimary.withValues(alpha: 0.4), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: AppColors.brandPrimary.withValues(alpha: isDark ? 0.08 : 0.05),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row with badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.solar_power_rounded, color: AppColors.brandPrimary, size: 22),
                  const SizedBox(width: 8),
                  Text(
                    "RECOMMENDED CAPACITY",
                    style: AppTypography.caption(color: textSecondary, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.brandPrimary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  res.connectionPhase,
                  style: AppTypography.badge(color: AppColors.brandPrimary),
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // Big bold capacity display
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                "${res.recommendedKw}",
                style: const TextStyle(
                  fontSize: 38,
                  fontWeight: FontWeight.w900,
                  color: AppColors.brandPrimary,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(width: 6),
              const Text(
                "kWp",
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppColors.brandPrimary,
                ),
              ),
              const Spacer(),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    "~${res.dailyGenerationKwh.toStringAsFixed(1)} kWh / day",
                    style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w600),
                  ),
                  Text(
                    "${res.annualGenerationKwh} kWh / year",
                    style: AppTypography.caption(color: textSecondary),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 14),
          const Divider(height: 1),
          const SizedBox(height: 14),

          // 4-Specs Grid
          Row(
            children: [
              Expanded(
                child: _buildSpecItem(
                  icon: Icons.grid_view_rounded,
                  label: "Solar Panels",
                  value: "${res.panelCount} Modules",
                  subvalue: "550W Mono PERC DCR",
                  textPrimary: textPrimary,
                  textSecondary: textSecondary,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildSpecItem(
                  icon: Icons.electric_bolt_rounded,
                  label: "Inverter",
                  value: "${res.inverterKw} kW",
                  subvalue: "On-Grid String",
                  textPrimary: textPrimary,
                  textSecondary: textSecondary,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: _buildSpecItem(
                  icon: Icons.square_foot_rounded,
                  label: "Area Needed",
                  value: "${res.requiredAreaSqft.round()} sq.ft",
                  subvalue: res.isFeasible ? "✓ Feasible" : "⚠ Tight Area",
                  subvalueColor: res.isFeasible ? AppColors.emeraldGreen : AppColors.brandPrimary,
                  textPrimary: textPrimary,
                  textSecondary: textSecondary,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildSpecItem(
                  icon: Icons.speed_rounded,
                  label: "Specific Yield",
                  value: "${res.annualGenerationKwh.round()} kWh",
                  subvalue: "${res.selectedState} Grid",
                  textPrimary: textPrimary,
                  textSecondary: textSecondary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSpecItem({
    required IconData icon,
    required String label,
    required String value,
    required String subvalue,
    Color? subvalueColor,
    required Color textPrimary,
    required Color textSecondary,
  }) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: textSecondary.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: AppColors.brandPrimary),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  label,
                  style: AppTypography.caption(color: textSecondary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.bold),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            subvalue,
            style: TextStyle(
              fontSize: 10,
              color: subvalueColor ?? textSecondary,
              fontWeight: subvalueColor != null ? FontWeight.w600 : FontWeight.normal,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  // --- FINANCIAL BREAKDOWN & PM SURYA GHAR CARD ---
  Widget _buildFinancialCard(
    SolarCalculationResult res,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.account_balance_wallet_rounded, color: AppColors.emeraldGreen, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  "Financials & Subsidy Breakdown",
                  style: AppTypography.headingSmall(color: textPrimary),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.emeraldGreen.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  "${res.paybackYears.toStringAsFixed(1)} Yrs Payback",
                  style: AppTypography.badge(color: AppColors.emeraldGreen),
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Gross Cost
          _buildFinancialRow(
            label: "Estimated Gross System Cost",
            value: Formatters.formatCurrency(res.grossCost.toDouble()),
            textPrimary: textPrimary,
            textSecondary: textSecondary,
          ),

          const SizedBox(height: 8),

          // Subsidy row (if any)
          if (res.subsidyAmount > 0) ...[
            _buildFinancialRow(
              label: "PM Surya Ghar CFA Subsidy (DBT)",
              value: "- ${Formatters.formatCurrency(res.subsidyAmount.toDouble())}",
              valueColor: AppColors.emeraldGreen,
              isBold: true,
              textPrimary: textPrimary,
              textSecondary: textSecondary,
            ),
            const SizedBox(height: 8),
          ],

          const Divider(height: 1),
          const SizedBox(height: 10),

          // Net Customer Cost
          _buildFinancialRow(
            label: "Net Customer Investment",
            value: Formatters.formatCurrency(res.netCost.toDouble()),
            valueColor: AppColors.brandPrimary,
            isBold: true,
            isLarge: true,
            textPrimary: textPrimary,
            textSecondary: textSecondary,
          ),

          const SizedBox(height: 14),
          const Divider(height: 1),
          const SizedBox(height: 14),

          // Savings Grid
          Row(
            children: [
              Expanded(
                child: _buildSavingsTile(
                  label: "Monthly Savings",
                  value: "${Formatters.formatCurrency(res.monthlySavings.toDouble())} / mo",
                  color: AppColors.emeraldGreen,
                  textSecondary: textSecondary,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildSavingsTile(
                  label: "Annual Savings",
                  value: "${Formatters.formatCurrency(res.annualSavings.toDouble())} / yr",
                  color: AppColors.emeraldGreen,
                  textSecondary: textSecondary,
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),

          Row(
            children: [
              Expanded(
                child: _buildSavingsTile(
                  label: "25-Yr Lifetime Savings",
                  value: "₹${(res.twentyFiveYearSavings / 100000).toStringAsFixed(2)} Lakhs",
                  color: AppColors.brandPrimary,
                  textSecondary: textSecondary,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildSavingsTile(
                  label: "Annualized ROI",
                  value: "${res.annualRoiPercent.toStringAsFixed(1)}%",
                  color: AppColors.skyBlue,
                  textSecondary: textSecondary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFinancialRow({
    required String label,
    required String value,
    Color? valueColor,
    bool isBold = false,
    bool isLarge = false,
    required Color textPrimary,
    required Color textSecondary,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isLarge ? 14 : 13,
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            color: isBold ? textPrimary : textSecondary,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isLarge ? 17 : 14,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
            color: valueColor ?? textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildSavingsTile({
    required String label,
    required String value,
    required Color color,
    required Color textSecondary,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: AppTypography.caption(color: textSecondary)),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  // --- ENVIRONMENTAL IMPACT CARD ---
  Widget _buildEnvironmentalCard(
    SolarCalculationResult res,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          Expanded(
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.emeraldGreen.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.forest_rounded, color: AppColors.emeraldGreen, size: 22),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("CO₂ Offset", style: AppTypography.caption(color: textSecondary)),
                      Text(
                        "${res.co2OffsetTonnes.toStringAsFixed(1)} Tons",
                        style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.bold),
                      ),
                      Text("over 25 years", style: TextStyle(fontSize: 10, color: textSecondary)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Container(width: 1, height: 44, color: borderColor),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(left: 12),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.brandPrimary.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.park_rounded, color: AppColors.brandPrimary, size: 22),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Trees Equivalent", style: AppTypography.caption(color: textSecondary)),
                        Text(
                          "${res.treesPlanted} Trees",
                          style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.bold),
                        ),
                        Text("planted lifecycle", style: TextStyle(fontSize: 10, color: textSecondary)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // --- BOTTOM ACTION BAR ---
  Widget _buildBottomActionBar(
    CalculatorProvider calc,
    bool isDark,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: cardBg,
        border: Border(top: BorderSide(color: borderColor)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Copy Quotation
            IconButton(
              icon: const Icon(Icons.copy_rounded, size: 20),
              tooltip: "Copy Solar Proposal",
              onPressed: () {
                final quote = calc.result.generateWhatsAppQuotation(
                  customerName: calc.customerName,
                );
                _copyQuotation(quote);
              },
            ),
            // Save to CRM DB
            IconButton(
              icon: calc.isSaving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.brandPrimary),
                    )
                  : const Icon(Icons.save_outlined, size: 22),
              tooltip: "Save to CRM",
              onPressed: calc.isSaving
                  ? null
                  : () async {
                      final res = await calc.saveCalculation();
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(res['message'] ?? "Saved!"),
                            backgroundColor: res['success'] == true ? AppColors.emeraldGreen : AppColors.errorRed,
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      }
                    },
            ),
            const SizedBox(width: 8),
            // 1-Tap WhatsApp Share Button
            Expanded(
              child: ElevatedButton.icon(
                icon: const FaIcon(FontAwesomeIcons.whatsapp, size: 18, color: Colors.white),
                label: const Text(
                  "Share on WhatsApp",
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF25D366), // Official WhatsApp Green
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () => _shareOnWhatsApp(calc),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
