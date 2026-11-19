import 'dart:convert';

class InvoiceLineItem {
  final String name;
  final String? hsn;
  final double quantity;
  final String unit;
  final double? rate;
  final double amount;

  InvoiceLineItem({
    required this.name,
    this.hsn,
    required this.quantity,
    this.unit = "Piece",
    this.rate,
    required this.amount,
  });

  factory InvoiceLineItem.fromJson(Map<String, dynamic> json) {
    return InvoiceLineItem(
      name: json['name']?.toString() ?? "Solar Component",
      hsn: json['hsn']?.toString() ?? json['hsn_code']?.toString(),
      quantity: (json['quantity'] is num) ? (json['quantity'] as num).toDouble() : 1.0,
      unit: json['unit']?.toString() ?? "Piece",
      rate: (json['rate'] is num) ? (json['rate'] as num).toDouble() : (json['unit_price'] is num ? (json['unit_price'] as num).toDouble() : null),
      amount: (json['amount'] is num) ? (json['amount'] as num).toDouble() : (json['taxable_amount'] is num ? (json['taxable_amount'] as num).toDouble() : 0.0),
    );
  }
}

class InvoicePaymentRecord {
  final int id;
  final double amount;
  final String paymentDate;
  final String paymentMode;
  final String? referenceNumber;
  final String? notes;

  InvoicePaymentRecord({
    required this.id,
    required this.amount,
    required this.paymentDate,
    required this.paymentMode,
    this.referenceNumber,
    this.notes,
  });

  factory InvoicePaymentRecord.fromJson(Map<String, dynamic> json) {
    return InvoicePaymentRecord(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      amount: (json['amount'] is num) ? (json['amount'] as num).toDouble() : double.tryParse(json['amount']?.toString() ?? '0') ?? 0.0,
      paymentDate: json['payment_date']?.toString() ?? "",
      paymentMode: json['payment_mode']?.toString() ?? "Bank Transfer",
      referenceNumber: json['reference_number']?.toString(),
      notes: json['notes']?.toString(),
    );
  }
}

class InvoiceModel {
  final int id;
  final String invoiceNumber;
  final String publicToken;
  final int? quotationId;
  final String? quotationNumber;
  final int? leadId;
  final String? leadCode;

  final String customerName;
  final String customerPhone;
  final String? customerEmail;
  final String? customerAddress;
  final String? city;
  final String? state;
  final String? pincode;
  final String? customerGstin;

  // Technical Specs
  final double systemCapacityKw;
  final String systemType;
  final String? panelSpecs;
  final String? inverterSpecs;
  final String? structureType;

  // Commercial Amounts
  final double baseAmount;
  final double installationAmount;
  final double discountAmount;
  final double taxableAmount;
  final double gstRate;
  final double cgstAmount;
  final double sgstAmount;
  final double igstAmount;
  final double gstAmount;
  final double grossTotal;
  final double subsidyAmount;
  final double netPayableAmount;
  final String gstMode; // "solar_composite" | "itemised"
  final String? gstSummaryJson;
  final int? quotationRevisionNumber;

  // Payment Tracking
  final double amountPaid;
  final double balanceDue;
  final String paymentStatus; // "Paid" | "Partially Paid" | "Unpaid"
  final String? paymentMode;
  final String? paymentReference;
  final String? paymentDate;

  // Metadata
  final String invoiceDate;
  final String? dueDate;
  final String? termsAndConditions;
  final String? notes;
  final String status;
  final String? createdAt;
  final String? createdByName;
  final List<InvoiceLineItem> lineItems;
  final List<InvoicePaymentRecord> payments;

  InvoiceModel({
    required this.id,
    required this.invoiceNumber,
    required this.publicToken,
    this.quotationId,
    this.quotationNumber,
    this.leadId,
    this.leadCode,
    required this.customerName,
    required this.customerPhone,
    this.customerEmail,
    this.customerAddress,
    this.city,
    this.state,
    this.pincode,
    this.customerGstin,
    required this.systemCapacityKw,
    required this.systemType,
    this.panelSpecs,
    this.inverterSpecs,
    this.structureType,
    required this.baseAmount,
    required this.installationAmount,
    required this.discountAmount,
    required this.taxableAmount,
    required this.gstRate,
    required this.cgstAmount,
    required this.sgstAmount,
    required this.igstAmount,
    required this.gstAmount,
    required this.grossTotal,
    required this.subsidyAmount,
    required this.netPayableAmount,
    this.gstMode = "itemised",
    this.gstSummaryJson,
    this.quotationRevisionNumber,
    required this.amountPaid,
    required this.balanceDue,
    required this.paymentStatus,
    this.paymentMode,
    this.paymentReference,
    this.paymentDate,
    required this.invoiceDate,
    this.dueDate,
    this.termsAndConditions,
    this.notes,
    required this.status,
    this.createdAt,
    this.createdByName,
    required this.lineItems,
    required this.payments,
  });

  String get initials {
    final parts = customerName.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts[0].isEmpty) return "I";
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return "${parts[0][0]}${parts[1][0]}".toUpperCase();
  }

  String get fullAddress {
    final parts = [customerAddress, city, state, pincode].where((s) => s != null && s.trim().isNotEmpty).toList();
    return parts.isEmpty ? "Address not specified" : parts.join(", ");
  }

  factory InvoiceModel.fromJson(Map<String, dynamic> json) {
    // Parse line items
    List<InvoiceLineItem> parsedItems = [];
    final rawLineItems = json['line_items'];
    if (rawLineItems != null) {
      try {
        final dynamic decoded = rawLineItems is String ? jsonDecode(rawLineItems) : rawLineItems;
        if (decoded is List) {
          parsedItems = decoded.map((i) => InvoiceLineItem.fromJson(Map<String, dynamic>.from(i))).toList();
        }
      } catch (_) {}
    }

    // Parse payments if present
    List<InvoicePaymentRecord> parsedPayments = [];
    if (json['payments'] is List) {
      try {
        parsedPayments = (json['payments'] as List)
            .map((p) => InvoicePaymentRecord.fromJson(Map<String, dynamic>.from(p)))
            .toList();
      } catch (_) {}
    }

    return InvoiceModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      invoiceNumber: json['invoice_number']?.toString() ?? "INV-0000",
      publicToken: json['public_token']?.toString() ?? "",
      quotationId: json['quotation_id'] != null ? int.tryParse(json['quotation_id'].toString()) : null,
      quotationNumber: json['quotation_number']?.toString(),
      leadId: json['lead_id'] != null ? int.tryParse(json['lead_id'].toString()) : null,
      leadCode: json['lead_code']?.toString(),
      customerName: json['customer_name']?.toString() ?? "Customer",
      customerPhone: json['customer_phone']?.toString() ?? "",
      customerEmail: json['customer_email']?.toString(),
      customerAddress: json['customer_address']?.toString(),
      city: json['city']?.toString(),
      state: json['state']?.toString(),
      pincode: json['pincode']?.toString(),
      customerGstin: json['customer_gstin']?.toString(),
      systemCapacityKw: (json['system_capacity_kw'] is num) ? (json['system_capacity_kw'] as num).toDouble() : double.tryParse(json['system_capacity_kw']?.toString() ?? '1.0') ?? 1.0,
      systemType: json['system_type']?.toString() ?? "On-Grid",
      panelSpecs: json['panel_specs']?.toString(),
      inverterSpecs: json['inverter_specs']?.toString(),
      structureType: json['structure_type']?.toString(),
      baseAmount: (json['base_amount'] is num) ? (json['base_amount'] as num).toDouble() : double.tryParse(json['base_amount']?.toString() ?? '0') ?? 0.0,
      installationAmount: (json['installation_amount'] is num) ? (json['installation_amount'] as num).toDouble() : double.tryParse(json['installation_amount']?.toString() ?? '0') ?? 0.0,
      discountAmount: (json['discount_amount'] is num) ? (json['discount_amount'] as num).toDouble() : double.tryParse(json['discount_amount']?.toString() ?? '0') ?? 0.0,
      taxableAmount: (json['taxable_amount'] is num) ? (json['taxable_amount'] as num).toDouble() : double.tryParse(json['taxable_amount']?.toString() ?? '0') ?? 0.0,
      gstRate: (json['gst_rate'] is num) ? (json['gst_rate'] as num).toDouble() : double.tryParse(json['gst_rate']?.toString() ?? '13.8') ?? 13.8,
      cgstAmount: (json['cgst_amount'] is num) ? (json['cgst_amount'] as num).toDouble() : double.tryParse(json['cgst_amount']?.toString() ?? '0') ?? 0.0,
      sgstAmount: (json['sgst_amount'] is num) ? (json['sgst_amount'] as num).toDouble() : double.tryParse(json['sgst_amount']?.toString() ?? '0') ?? 0.0,
      igstAmount: (json['igst_amount'] is num) ? (json['igst_amount'] as num).toDouble() : double.tryParse(json['igst_amount']?.toString() ?? '0') ?? 0.0,
      gstAmount: (json['gst_amount'] is num) ? (json['gst_amount'] as num).toDouble() : double.tryParse(json['gst_amount']?.toString() ?? '0') ?? 0.0,
      grossTotal: (json['gross_total'] is num) ? (json['gross_total'] as num).toDouble() : double.tryParse(json['gross_total']?.toString() ?? '0') ?? 0.0,
      subsidyAmount: (json['subsidy_amount'] is num) ? (json['subsidy_amount'] as num).toDouble() : double.tryParse(json['subsidy_amount']?.toString() ?? '0') ?? 0.0,
      netPayableAmount: (json['net_payable_amount'] is num) ? (json['net_payable_amount'] as num).toDouble() : double.tryParse(json['net_payable_amount']?.toString() ?? '0') ?? 0.0,
      gstMode: json['gst_mode']?.toString() ?? "itemised",
      gstSummaryJson: json['gst_summary_json']?.toString(),
      quotationRevisionNumber: json['quotation_revision_number'] != null
          ? int.tryParse(json['quotation_revision_number'].toString())
          : (json['revision_number'] != null ? int.tryParse(json['revision_number'].toString()) : null),
      amountPaid: (json['amount_paid'] is num) ? (json['amount_paid'] as num).toDouble() : double.tryParse(json['amount_paid']?.toString() ?? '0') ?? 0.0,
      balanceDue: (json['balance_due'] is num) ? (json['balance_due'] as num).toDouble() : double.tryParse(json['balance_due']?.toString() ?? '0') ?? 0.0,
      paymentStatus: json['payment_status']?.toString() ?? "Unpaid",
      paymentMode: json['payment_mode']?.toString(),
      paymentReference: json['payment_reference']?.toString(),
      paymentDate: json['payment_date']?.toString(),
      invoiceDate: json['invoice_date']?.toString() ?? "",
      dueDate: json['due_date']?.toString(),
      termsAndConditions: json['terms_and_conditions']?.toString(),
      notes: json['notes']?.toString(),
      status: json['status']?.toString() ?? "Issued",
      createdAt: json['created_at']?.toString(),
      createdByName: json['created_by_name']?.toString(),
      lineItems: parsedItems,
      payments: parsedPayments,
    );
  }

  String buildWhatsAppPitch(String publicUrl) {
    return """
*TAX INVOICE: $invoiceNumber*
Namaste $customerName ji,

Here are the billing details for your Solar Installation:
- System: *${systemCapacityKw.toStringAsFixed(1)} kW* ($systemType)
- Invoice Date: *$invoiceDate*
- Total Payable: *₹${netPayableAmount.toStringAsFixed(0)}*
- Amount Paid: *₹${amountPaid.toStringAsFixed(0)}*
- Balance Due: *₹${balanceDue.toStringAsFixed(0)}*
- Payment Status: *${paymentStatus.toUpperCase()}*

View and download your official GST Tax Invoice PDF:
$publicUrl

Thank you for choosing Solar Energy!
""";
  }
}

