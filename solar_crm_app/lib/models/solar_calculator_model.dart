class StateSolarInfo {
  final String name;
  final double tariffRate;
  final double specificYield; // kWh/kWp/year

  const StateSolarInfo({
    required this.name,
    required this.tariffRate,
    required this.specificYield,
  });
}

class IndianSolarData {
  static const List<StateSolarInfo> states = [
    StateSolarInfo(name: "Rajasthan", tariffRate: 7.8, specificYield: 1650.0),
    StateSolarInfo(name: "Gujarat", tariffRate: 7.2, specificYield: 1600.0),
    StateSolarInfo(name: "Maharashtra", tariffRate: 9.2, specificYield: 1500.0),
    StateSolarInfo(name: "Madhya Pradesh", tariffRate: 7.6, specificYield: 1550.0),
    StateSolarInfo(name: "Delhi", tariffRate: 7.5, specificYield: 1450.0),
    StateSolarInfo(name: "Karnataka", tariffRate: 8.2, specificYield: 1500.0),
    StateSolarInfo(name: "Tamil Nadu", tariffRate: 7.9, specificYield: 1520.0),
    StateSolarInfo(name: "Uttar Pradesh", tariffRate: 7.4, specificYield: 1480.0),
    StateSolarInfo(name: "Haryana", tariffRate: 7.5, specificYield: 1500.0),
    StateSolarInfo(name: "Punjab", tariffRate: 7.2, specificYield: 1460.0),
    StateSolarInfo(name: "Telangana", tariffRate: 8.0, specificYield: 1510.0),
    StateSolarInfo(name: "Andhra Pradesh", tariffRate: 7.8, specificYield: 1520.0),
    StateSolarInfo(name: "Kerala", tariffRate: 7.3, specificYield: 1440.0),
    StateSolarInfo(name: "West Bengal", tariffRate: 8.1, specificYield: 1420.0),
    StateSolarInfo(name: "Bihar", tariffRate: 7.5, specificYield: 1460.0),
    StateSolarInfo(name: "Odisha", tariffRate: 7.2, specificYield: 1480.0),
    StateSolarInfo(name: "Chhattisgarh", tariffRate: 7.0, specificYield: 1520.0),
    StateSolarInfo(name: "Uttarakhand", tariffRate: 6.8, specificYield: 1450.0),
    StateSolarInfo(name: "Himachal Pradesh", tariffRate: 6.5, specificYield: 1400.0),
    StateSolarInfo(name: "Goa", tariffRate: 6.9, specificYield: 1480.0),
  ];

  static StateSolarInfo getState(String stateName) {
    try {
      return states.firstWhere(
        (s) => s.name.toLowerCase() == stateName.trim().toLowerCase(),
      );
    } catch (_) {
      return const StateSolarInfo(name: "Other State", tariffRate: 8.0, specificYield: 1485.0);
    }
  }
}

class SolarCalculationResult {
  final String calcMode; // "bill" | "units" | "roof"
  final double monthlyBill;
  final double monthlyUnits;
  final double roofAreaSqft;
  final double roofUsablePercent;
  final double usableRoofAreaSqft;
  final String selectedState;
  final double tariffRate;
  final String propertyType;
  final String subsidyType;

  // System Specs
  final double recommendedKw;
  final double actualDcKw;
  final int inverterKw;
  final int panelCount;
  final int panelWattage;
  final String connectionPhase;
  final double requiredAreaSqft;
  final double remainingRoofAreaSqft;
  final bool isFeasible;

  // Generation
  final double dailyGenerationKwh;
  final int monthlyGenerationKwh;
  final int annualGenerationKwh;

  // Financials
  final int grossCost;
  final int subsidyAmount;
  final String subsidyFormulaText;
  final int netCost;
  final int monthlySavings;
  final int annualSavings;
  final int twentyFiveYearSavings;
  final double paybackYears;
  final double annualRoiPercent;

  // Environment
  final int co2OffsetTonnes;
  final int treesPlanted;

  SolarCalculationResult({
    required this.calcMode,
    required this.monthlyBill,
    required this.monthlyUnits,
    required this.roofAreaSqft,
    required this.roofUsablePercent,
    required this.usableRoofAreaSqft,
    required this.selectedState,
    required this.tariffRate,
    required this.propertyType,
    required this.subsidyType,
    required this.recommendedKw,
    required this.actualDcKw,
    required this.inverterKw,
    required this.panelCount,
    required this.panelWattage,
    required this.connectionPhase,
    required this.requiredAreaSqft,
    required this.remainingRoofAreaSqft,
    required this.isFeasible,
    required this.dailyGenerationKwh,
    required this.monthlyGenerationKwh,
    required this.annualGenerationKwh,
    required this.grossCost,
    required this.subsidyAmount,
    required this.subsidyFormulaText,
    required this.netCost,
    required this.monthlySavings,
    required this.annualSavings,
    required this.twentyFiveYearSavings,
    required this.paybackYears,
    required this.annualRoiPercent,
    required this.co2OffsetTonnes,
    required this.treesPlanted,
  });

  /// Real-time deterministic Solar Calculation Engine
  factory SolarCalculationResult.compute({
    required String calcMode,
    required double monthlyBill,
    required double monthlyUnits,
    required double roofAreaSqft,
    required double roofUsablePercent,
    required String selectedState,
    required double tariffRate,
    required String propertyType,
    required String subsidyType,
  }) {
    final tRate = tariffRate > 0 ? tariffRate : 8.0;
    double bill = monthlyBill;
    double units = monthlyUnits;
    final roof = roofAreaSqft;
    final usablePct = roofUsablePercent.clamp(10.0, 100.0);
    final usableRoofSqft = (roof * (usablePct / 100.0)).roundToDouble();

    double recommendedKw = 1.0;

    if (calcMode == "units") {
      units = units > 0 ? units : 625.0;
      bill = (units * tRate).roundToDouble();
      recommendedKw = double.parse((units / 135.0).toStringAsFixed(1));
    } else if (calcMode == "roof") {
      final targetArea = usableRoofSqft > 0 ? usableRoofSqft : 400.0;
      recommendedKw = double.parse((targetArea / 80.0).toStringAsFixed(1));
      units = (recommendedKw * 135.0).roundToDouble();
      bill = (units * tRate).roundToDouble();
    } else {
      // Default: "bill"
      bill = bill > 0 ? bill : 5000.0;
      units = (bill / tRate).roundToDouble();
      recommendedKw = double.parse((units / 135.0).toStringAsFixed(1));
    }

    if (recommendedKw < 1.0) recommendedKw = 1.0;

    // Hardware specifications: 550W Mono PERC Half-Cut DCR
    const panelWattage = 550;
    final panelCount = ((recommendedKw * 1000) / panelWattage).ceil();
    final actualDcKw = double.parse(((panelCount * panelWattage) / 1000.0).toStringAsFixed(2));
    final inverterKw = recommendedKw.ceil();
    final connectionPhase = recommendedKw > 8.0 ? "3 Phase" : "Single Phase";

    // Generation Calculations based on State Yield
    final stateInfo = IndianSolarData.getState(selectedState);
    final specificYield = stateInfo.specificYield;
    final annualGenerationKwh = (recommendedKw * specificYield).round();
    final dailyGenerationKwh = double.parse((annualGenerationKwh / 365.0).toStringAsFixed(1));
    final monthlyGenerationKwh = (annualGenerationKwh / 12.0).round();

    // Costing: ₹55,000/kW for DCR Monocrystalline, ₹48,500/kW for Non-DCR
    final isNonDcr = subsidyType.toLowerCase().contains("non-dcr");
    final costPerKw = isNonDcr ? 48500 : 55000;
    final grossCost = (recommendedKw * costPerKw).round();

    // PM Surya Ghar Muft Bijli Yojana Central Financial Assistance (CFA) Rules
    int subsidyAmount = 0;
    String subsidyFormulaText = "Ineligible";
    final isResidential = propertyType.toLowerCase() == "residential";

    if (isResidential && !isNonDcr && !subsidyType.toLowerCase().contains("no subsidy")) {
      if (recommendedKw <= 2.0) {
        subsidyAmount = (recommendedKw * 30000).round();
        subsidyFormulaText = "₹30,000/kW (Up to 2 kW)";
      } else if (recommendedKw <= 3.0) {
        subsidyAmount = (60000 + (recommendedKw - 2.0) * 18000).round();
        subsidyFormulaText = "₹60,000 + ₹18,000/kW (3rd kW)";
      } else {
        subsidyAmount = 78000; // Flat max cap at 3kW+
        subsidyFormulaText = "PM Surya Ghar Max Cap (₹78,000)";
      }
    } else if (!isResidential) {
      subsidyAmount = 0;
      subsidyFormulaText = "Commercial / Industrial (Tax Depreciation 40%)";
    } else {
      subsidyAmount = 0;
      subsidyFormulaText = "Non-DCR Panels (Ineligible for CFA)";
    }

    final netCost = (grossCost - subsidyAmount).clamp(0, 999999999);

    // Financial Savings & Payback
    final monthlySavings = (monthlyGenerationKwh * tRate).round();
    final annualSavings = (annualGenerationKwh * tRate).round();
    final paybackYears = annualSavings > 0
        ? double.parse((netCost / annualSavings).toStringAsFixed(1))
        : 0.0;
    final annualRoiPercent = netCost > 0
        ? double.parse(((annualSavings / netCost) * 100).toStringAsFixed(1))
        : 0.0;

    // Rooftop Requirements: ~80 sq.ft per kW
    final requiredAreaSqft = (recommendedKw * 80.0).roundToDouble();
    final remainingRoofAreaSqft = roof > 0 ? (usableRoofSqft - requiredAreaSqft).clamp(0.0, 999999.0) : 0.0;
    final isFeasible = roof == 0 || usableRoofSqft >= requiredAreaSqft;

    // 25-Year Lifecycle Savings (0.55% annual degradation, 3% tariff inflation)
    double cumulativeSavings = 0;
    double curGen = annualGenerationKwh.toDouble();
    double curTariff = tRate;
    for (int y = 1; y <= 25; y++) {
      if (y > 1) {
        curGen *= (1 - 0.0055);
        curTariff *= (1 + 0.03);
      }
      cumulativeSavings += (curGen * curTariff);
    }
    final twentyFiveYearSavings = (cumulativeSavings - netCost).round();
    final co2OffsetTonnes = ((annualGenerationKwh * 25 * 0.82) / 1000.0).round();
    final treesPlanted = (co2OffsetTonnes * 16);

    return SolarCalculationResult(
      calcMode: calcMode,
      monthlyBill: bill,
      monthlyUnits: units,
      roofAreaSqft: roof,
      roofUsablePercent: usablePct,
      usableRoofAreaSqft: usableRoofSqft,
      selectedState: selectedState,
      tariffRate: tRate,
      propertyType: propertyType,
      subsidyType: subsidyType,
      recommendedKw: recommendedKw,
      actualDcKw: actualDcKw,
      inverterKw: inverterKw,
      panelCount: panelCount,
      panelWattage: panelWattage,
      connectionPhase: connectionPhase,
      requiredAreaSqft: requiredAreaSqft,
      remainingRoofAreaSqft: remainingRoofAreaSqft,
      isFeasible: isFeasible,
      dailyGenerationKwh: dailyGenerationKwh,
      monthlyGenerationKwh: monthlyGenerationKwh,
      annualGenerationKwh: annualGenerationKwh,
      grossCost: grossCost,
      subsidyAmount: subsidyAmount,
      subsidyFormulaText: subsidyFormulaText,
      netCost: netCost,
      monthlySavings: monthlySavings,
      annualSavings: annualSavings,
      twentyFiveYearSavings: twentyFiveYearSavings,
      paybackYears: paybackYears,
      annualRoiPercent: annualRoiPercent,
      co2OffsetTonnes: co2OffsetTonnes,
      treesPlanted: treesPlanted,
    );
  }

  /// Generate formatted quotation pitch message for WhatsApp
  String generateWhatsAppQuotation({String customerName = "Valued Customer"}) {
    final name = customerName.trim().isNotEmpty ? customerName.trim() : "Customer";
    return """
*SOLAR ROOFTOP ESTIMATE & SUBSIDY REPORT*
Namaste $name ji,

Here is your customized Rooftop Solar Proposal:

*System Specifications:*
- Recommended Capacity: *${recommendedKw.toStringAsFixed(1)} kW* ($connectionPhase)
- Solar Panels: *$panelCount x ${panelWattage}W Mono PERC DCR* (Total ${actualDcKw.toStringAsFixed(2)} kWp)
- Inverter: *$inverterKw kW Smart On-Grid Inverter*
- Estimated Generation: *~$dailyGenerationKwh units/day* (~$monthlyGenerationKwh units/mo)
- Required Roof Space: *~$requiredAreaSqft sq.ft*

*Financial Investment & Government Subsidy:*
- Estimated Project Cost: *₹${grossCost.toString()}*
- PM Surya Ghar DBT Subsidy: *₹${subsidyAmount.toString()}* ($subsidyFormulaText)
- *Net Investment After Subsidy: ₹${netCost.toString()}*

*Projected Savings & ROI:*
- Monthly Bill Savings: *~₹$monthlySavings/month*
- Annual Bill Savings: *~₹$annualSavings/year*
- Payback Period: *~$paybackYears Years* (Virtual Free Electricity Thereafter!)
- 25-Year Lifetime Savings: *~₹${(twentyFiveYearSavings / 100000).toStringAsFixed(2)} Lakhs*

*Environmental Benefit:*
- CO2 Emissions Avoided: *$co2OffsetTonnes Tonnes*
- Equivalent Trees Planted: *$treesPlanted Trees*

May we schedule a complimentary 15-minute technical site survey this week?

Warm regards,
Solar Solutions Team
""";
  }
}
