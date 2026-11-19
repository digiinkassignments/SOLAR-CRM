import 'dart:convert';

class QuotationLineItem {
  final String name;
  final String? description;
  final String? hsnCode;
  final String unit;
  final double quantity;
  final double unitPrice;
  final double gstRate;
  final double taxableAmount;
  final double discountAmount;
  final double gstAmount;
  final double totalAmount;

  QuotationLineItem({
    required this.name,
    this.description,
    this.hsnCode,
    this.unit = "Piece",
    required this.quantity,
    required this.unitPrice,
    required this.gstRate,
    required this.taxableAmount,
    this.discountAmount = 0,
    required this.gstAmount,
    required this.totalAmount,
  });

  factory QuotationLineItem.fromJson(Map<String, dynamic> json) {
    return QuotationLineItem(
      name: json['name']?.toString() ?? "Solar Item",
      description: json['description']?.toString(),
      hsnCode: json['hsn_code']?.toString(),
      unit: json['unit']?.toString() ?? "Piece",
      quantity: (json['quantity'] is num) ? (json['quantity'] as num).toDouble() : 1.0,
      unitPrice: (json['unit_price'] is num) ? (json['unit_price'] as num).toDouble() : 0.0,
      gstRate: (json['gst_rate'] is num) ? (json['gst_rate'] as num).toDouble() : 13.8,
      taxableAmount: (json['taxable_amount'] is num) ? (json['taxable_amount'] as num).toDouble() : 0.0,
      discountAmount: (json['discount_amount'] is num) ? (json['discount_amount'] as num).toDouble() : 0.0,
      gstAmount: (json['gst_amount'] is num) ? (json['gst_amount'] as num).toDouble() : 0.0,
      totalAmount: (json['total_amount'] is num) ? (json['total_amount'] as num).toDouble() : 0.0,
    );
  }
}

class QuotationModel {
  final int id;
  final String quotationNumber;
  final String publicToken;
  final int? leadId;
  final String? leadCode;
  final String customerName;
  final String customerPhone;
  final String? customerEmail;
  final String? customerAddress;
  final String? city;
  final String? state;
  final String? pincode;

  // Technical Specs
  final double systemCapacityKw;
  final String systemType;
  final String? panelBrand;
  final String? panelType;
  final int panelCount;
  final String? inverterBrand;
  final double? inverterCapacityKw;
  final String? structureType;
  final double? batteryCapacityAh;

  // Commercials
  final double basePrice;
  final double structureInstallationCost;
  final double gstRate;
  final double gstAmount;
  final double discountAmount;
  final double totalAmount;
  final double subsidyAmount;
  final double netPayableAmount;

  // Projections
  final int annualGenerationKwh;
  final int annualSavings;
  final double paybackYears;
  final int twentyFiveYearSavings;

  // Meta
  final String status; // "Draft" | "Sent" | "Accepted" | "Rejected"
  final String gstMode; // "solar_composite" | "itemised"
  final String? gstSummaryJson;
  final int? revisionNumber;
  final String? validUntil;
  final String? termsAndConditions;
  final String? notes;
  final String? createdAt;
  final String? createdByName;
  final List<QuotationLineItem> lineItems;

  QuotationModel({
    required this.id,
    required this.quotationNumber,
    required this.publicToken,
    this.leadId,
    this.leadCode,
    required this.customerName,
    required this.customerPhone,
    this.customerEmail,
    this.customerAddress,
    this.city,
    this.state,
    this.pincode,
    required this.systemCapacityKw,
    required this.systemType,
    this.panelBrand,
    this.panelType,
    required this.panelCount,
    this.inverterBrand,
    this.inverterCapacityKw,
    this.structureType,
    this.batteryCapacityAh,
    required this.basePrice,
    required this.structureInstallationCost,
    required this.gstRate,
    required this.gstAmount,
    required this.discountAmount,
    required this.totalAmount,
    required this.subsidyAmount,
    required this.netPayableAmount,
    required this.annualGenerationKwh,
    required this.annualSavings,
    required this.paybackYears,
    required this.twentyFiveYearSavings,
    required this.status,
    this.gstMode = "itemised",
    this.gstSummaryJson,
    this.revisionNumber,
    this.validUntil,
    this.termsAndConditions,
    this.notes,
    this.createdAt,
    this.createdByName,
    required this.lineItems,
  });

  String get initials {
    final parts = customerName.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts[0].isEmpty) return "Q";
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return "${parts[0][0]}${parts[1][0]}".toUpperCase();
  }

  String get fullAddress {
    final parts = [customerAddress, city, state, pincode].where((s) => s != null && s.trim().isNotEmpty).toList();
    return parts.isEmpty ? "Address not specified" : parts.join(", ");
  }

  factory QuotationModel.fromJson(Map<String, dynamic> json) {
    // Parse line items
    List<QuotationLineItem> parsedItems = [];
    final rawLineItems = json['line_items_json'] ?? json['line_items'];
    if (rawLineItems != null) {
      try {
        final dynamic decoded = rawLineItems is String ? jsonDecode(rawLineItems) : rawLineItems;
        if (decoded is List) {
          parsedItems = decoded.map((i) => QuotationLineItem.fromJson(Map<String, dynamic>.from(i))).toList();
        }
      } catch (_) {}
    }

    return QuotationModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      quotationNumber: json['quotation_number']?.toString() ?? "QUO-0000",
      publicToken: json['public_token']?.toString() ?? "",
      leadId: json['lead_id'] != null ? int.tryParse(json['lead_id'].toString()) : null,
      leadCode: json['lead_code']?.toString(),
      customerName: json['customer_name']?.toString() ?? "Customer",
      customerPhone: json['customer_phone']?.toString() ?? "",
      customerEmail: json['customer_email']?.toString(),
      customerAddress: json['customer_address']?.toString(),
      city: json['city']?.toString(),
      state: json['state']?.toString(),
      pincode: json['pincode']?.toString(),
      systemCapacityKw: (json['system_capacity_kw'] is num) ? (json['system_capacity_kw'] as num).toDouble() : double.tryParse(json['system_capacity_kw']?.toString() ?? '0') ?? 0.0,
      systemType: json['system_type']?.toString() ?? "On-Grid",
      panelBrand: json['panel_brand']?.toString(),
      panelType: json['panel_type']?.toString(),
      panelCount: (json['panel_count'] is num) ? (json['panel_count'] as num).toInt() : int.tryParse(json['panel_count']?.toString() ?? '0') ?? 0,
      inverterBrand: json['inverter_brand']?.toString(),
      inverterCapacityKw: (json['inverter_capacity_kw'] is num) ? (json['inverter_capacity_kw'] as num).toDouble() : double.tryParse(json['inverter_capacity_kw']?.toString() ?? ''),
      structureType: json['structure_type']?.toString(),
      batteryCapacityAh: (json['battery_capacity_ah'] is num) ? (json['battery_capacity_ah'] as num).toDouble() : double.tryParse(json['battery_capacity_ah']?.toString() ?? ''),
      basePrice: (json['base_price'] is num) ? (json['base_price'] as num).toDouble() : double.tryParse(json['base_price']?.toString() ?? '0') ?? 0.0,
      structureInstallationCost: (json['structure_installation_cost'] is num) ? (json['structure_installation_cost'] as num).toDouble() : double.tryParse(json['structure_installation_cost']?.toString() ?? '0') ?? 0.0,
      gstRate: (json['gst_rate'] is num) ? (json['gst_rate'] as num).toDouble() : double.tryParse(json['gst_rate']?.toString() ?? '13.8') ?? 13.8,
      gstAmount: (json['gst_amount'] is num) ? (json['gst_amount'] as num).toDouble() : double.tryParse(json['gst_amount']?.toString() ?? '0') ?? 0.0,
      discountAmount: (json['discount_amount'] is num) ? (json['discount_amount'] as num).toDouble() : double.tryParse(json['discount_amount']?.toString() ?? '0') ?? 0.0,
      totalAmount: (json['total_amount'] is num) ? (json['total_amount'] as num).toDouble() : double.tryParse(json['total_amount']?.toString() ?? '0') ?? 0.0,
      subsidyAmount: (json['subsidy_amount'] is num) ? (json['subsidy_amount'] as num).toDouble() : double.tryParse(json['subsidy_amount']?.toString() ?? '0') ?? 0.0,
      netPayableAmount: (json['net_payable_amount'] is num) ? (json['net_payable_amount'] as num).toDouble() : double.tryParse(json['net_payable_amount']?.toString() ?? '0') ?? 0.0,
      annualGenerationKwh: (json['annual_generation_kwh'] is num) ? (json['annual_generation_kwh'] as num).toInt() : int.tryParse(json['annual_generation_kwh']?.toString() ?? '0') ?? 0,
      annualSavings: (json['annual_savings'] is num) ? (json['annual_savings'] as num).toInt() : int.tryParse(json['annual_savings']?.toString() ?? '0') ?? 0,
      paybackYears: (json['payback_years'] is num) ? (json['payback_years'] as num).toDouble() : double.tryParse(json['payback_years']?.toString() ?? '0') ?? 0.0,
      twentyFiveYearSavings: (json['twenty_five_year_savings'] is num) ? (json['twenty_five_year_savings'] as num).toInt() : int.tryParse(json['twenty_five_year_savings']?.toString() ?? '0') ?? 0,
      status: json['status']?.toString() ?? "Draft",
      gstMode: json['gst_mode']?.toString() ?? "itemised",
      gstSummaryJson: json['gst_summary_json']?.toString(),
      revisionNumber: json['revision_number'] != null
          ? int.tryParse(json['revision_number'].toString())
          : (json['quotation_revision_number'] != null ? int.tryParse(json['quotation_revision_number'].toString()) : null),
      validUntil: json['valid_until']?.toString(),
      termsAndConditions: json['terms_and_conditions']?.toString(),
      notes: json['notes']?.toString(),
      createdAt: json['created_at']?.toString(),
      createdByName: json['created_by_name']?.toString(),
      lineItems: parsedItems,
    );
  }

  String buildWhatsAppPitch(String publicUrl) {
    return """
*SOLAR PROPOSAL: $quotationNumber*
Namaste $customerName ji,

Please find below the summary of your tailored Solar System quotation:

*System Highlights:*
- Capacity: *${systemCapacityKw.toStringAsFixed(1)} kW* ($systemType)
- Panels: *$panelCount Modules* (${panelBrand ?? 'Tier-1 Mono PERC'})
- Inverter: *${inverterCapacityKw ?? systemCapacityKw} kW* (${inverterBrand ?? 'Grid-Tied'})
- Structure: *${structureType ?? 'High-Grade GI'}*

*Commercial & Subsidy Details:*
- Total System Cost: *₹${totalAmount.toStringAsFixed(0)}*
${subsidyAmount > 0 ? "- PM Surya Ghar DBT Subsidy: *₹${subsidyAmount.toStringAsFixed(0)}*\n" : ""}- *Net Investment After Subsidy: ₹${netPayableAmount.toStringAsFixed(0)}*

*Projected Benefits:*
- Annual Generation: *~$annualGenerationKwh units/yr*
- Annual Electricity Savings: *~₹$annualSavings/yr*
- Payback Period: *~$paybackYears Years*

View and download your official Quotation PDF here:
$publicUrl

Warm regards,
Solar Energy Team
""";
  }
}

