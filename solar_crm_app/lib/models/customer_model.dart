class CustomerModel {
  final int id;
  final String customerCode;
  final int? leadId;
  final String customerName;
  final String mobileNumber;
  final String? alternateNumber;
  final String? email;
  final String? address;
  final String? city;
  final String? state;
  final String? pincode;
  final String? electricityConsumerNumber;
  final String? discomName;
  final double? sanctionedLoadKw;
  final String? customerGstin;
  final String solarRequirement;
  final String status;
  final String? notes;
  final int? assignedTo;
  final String? assignedToName;
  final String? leadCode;
  final String? leadSource;
  final double? plantSizeKw;
  final int totalProjects;
  final double totalSystemKw;
  final double totalBilledAmount;
  final double totalPaidAmount;
  final double totalBalanceAmount;
  final String? createdAt;

  CustomerModel({
    required this.id,
    required this.customerCode,
    this.leadId,
    required this.customerName,
    required this.mobileNumber,
    this.alternateNumber,
    this.email,
    this.address,
    this.city,
    this.state,
    this.pincode,
    this.electricityConsumerNumber,
    this.discomName,
    this.sanctionedLoadKw,
    this.customerGstin,
    this.solarRequirement = 'Residential',
    this.status = 'Active',
    this.notes,
    this.assignedTo,
    this.assignedToName,
    this.leadCode,
    this.leadSource,
    this.plantSizeKw,
    this.totalProjects = 0,
    this.totalSystemKw = 0.0,
    this.totalBilledAmount = 0.0,
    this.totalPaidAmount = 0.0,
    this.totalBalanceAmount = 0.0,
    this.createdAt,
  });

  bool get isActive => status.toLowerCase() == 'active';

  String get initials {
    if (customerName.trim().isEmpty) return "C";
    final parts = customerName.trim().split(" ");
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return "${parts[0][0]}${parts[parts.length - 1][0]}".toUpperCase();
  }

  factory CustomerModel.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic val, [int fallback = 0]) {
      if (val == null) return fallback;
      if (val is int) return val;
      return int.tryParse(val.toString()) ?? fallback;
    }

    double parseDouble(dynamic val, [double fallback = 0.0]) {
      if (val == null) return fallback;
      if (val is double) return val;
      if (val is int) return val.toDouble();
      return double.tryParse(val.toString()) ?? fallback;
    }

    return CustomerModel(
      id: parseInt(json['id']),
      customerCode: json['customer_code']?.toString() ?? '',
      leadId: json['lead_id'] != null ? parseInt(json['lead_id']) : null,
      customerName: json['customer_name']?.toString() ?? 'Unnamed Customer',
      mobileNumber: json['mobile_number']?.toString() ?? '',
      alternateNumber: json['alternate_number']?.toString(),
      email: json['email']?.toString(),
      address: json['address']?.toString(),
      city: json['city']?.toString(),
      state: json['state']?.toString(),
      pincode: json['pincode']?.toString(),
      electricityConsumerNumber: json['electricity_consumer_number']?.toString(),
      discomName: json['discom_name']?.toString(),
      sanctionedLoadKw: json['sanctioned_load_kw'] != null ? parseDouble(json['sanctioned_load_kw']) : null,
      customerGstin: json['customer_gstin']?.toString(),
      solarRequirement: json['solar_requirement']?.toString() ?? 'Residential',
      status: json['status']?.toString() ?? 'Active',
      notes: json['notes']?.toString(),
      assignedTo: json['assigned_to'] != null ? parseInt(json['assigned_to']) : null,
      assignedToName: json['assigned_to_name']?.toString(),
      leadCode: json['lead_code']?.toString(),
      leadSource: json['effective_lead_source']?.toString() ?? json['lead_source']?.toString(),
      plantSizeKw: json['plant_size_kw'] != null
          ? parseDouble(json['plant_size_kw'])
          : (json['opening_record'] != null && json['opening_record'] is Map
              ? parseDouble((json['opening_record'] as Map)['plant_size_kw'])
              : null),
      totalProjects: parseInt(json['total_projects']),
      totalSystemKw: parseDouble(json['total_system_kw']),
      totalBilledAmount: parseDouble(json['total_billed_amount']),
      totalPaidAmount: parseDouble(json['total_paid_amount']),
      totalBalanceAmount: parseDouble(json['total_balance_amount']),
      createdAt: json['created_at']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'customer_name': customerName,
      'mobile_number': mobileNumber,
      'alternate_number': alternateNumber,
      'email': email,
      'address': address,
      'city': city,
      'state': state,
      'pincode': pincode,
      'electricity_consumer_number': electricityConsumerNumber,
      'discom_name': discomName,
      'sanctioned_load_kw': sanctionedLoadKw,
      'customer_gstin': customerGstin,
      'solar_requirement': solarRequirement,
      'status': status,
      'notes': notes,
      'assigned_to': assignedTo,
    };
  }
}

class CustomerStats {
  final int totalCustomers;
  final double totalCapacityKw;
  final double totalBilled;
  final double totalPaid;
  final double totalBalance;

  CustomerStats({
    required this.totalCustomers,
    required this.totalCapacityKw,
    required this.totalBilled,
    required this.totalPaid,
    required this.totalBalance,
  });

  factory CustomerStats.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic val) {
      if (val == null) return 0;
      if (val is int) return val;
      return int.tryParse(val.toString()) ?? 0;
    }

    double parseDouble(dynamic val) {
      if (val == null) return 0.0;
      if (val is double) return val;
      if (val is int) return val.toDouble();
      return double.tryParse(val.toString()) ?? 0.0;
    }

    return CustomerStats(
      totalCustomers: parseInt(json['totalCustomers']),
      totalCapacityKw: parseDouble(json['totalCapacityKw']),
      totalBilled: parseDouble(json['totalBilled']),
      totalPaid: parseDouble(json['totalPaid']),
      totalBalance: parseDouble(json['totalBalance']),
    );
  }
}

class CustomerOpeningRecord {
  final int customerId;
  final double? plantSizeKw;
  final double invoiceAmount; // Final amount
  final double amountPaid;    // Payment received
  final String? invoiceReference;
  final String? paymentDate;
  final String? paymentMode;
  final String? paymentReference;
  final String? createdAt;

  CustomerOpeningRecord({
    required this.customerId,
    this.plantSizeKw,
    this.invoiceAmount = 0.0,
    this.amountPaid = 0.0,
    this.invoiceReference,
    this.paymentDate,
    this.paymentMode,
    this.paymentReference,
    this.createdAt,
  });

  factory CustomerOpeningRecord.fromJson(Map<String, dynamic> json) {
    double parseDouble(dynamic val, [double fallback = 0.0]) {
      if (val == null) return fallback;
      if (val is num) return val.toDouble();
      return double.tryParse(val.toString()) ?? fallback;
    }

    return CustomerOpeningRecord(
      customerId: int.tryParse(json['customer_id']?.toString() ?? '0') ?? 0,
      plantSizeKw: json['plant_size_kw'] != null ? parseDouble(json['plant_size_kw']) : null,
      invoiceAmount: parseDouble(json['invoice_amount']),
      amountPaid: parseDouble(json['amount_paid']),
      invoiceReference: json['invoice_reference']?.toString(),
      paymentDate: json['payment_date']?.toString(),
      paymentMode: json['payment_mode']?.toString(),
      paymentReference: json['payment_reference']?.toString(),
      createdAt: json['created_at']?.toString(),
    );
  }
}

class Customer360Detail {
  final CustomerModel customer;
  final CustomerOpeningRecord? openingRecord;
  final List<dynamic> projects;
  final List<dynamic> quotations;
  final List<dynamic> invoices;
  final List<dynamic> leads;

  Customer360Detail({
    required this.customer,
    this.openingRecord,
    required this.projects,
    required this.quotations,
    required this.invoices,
    required this.leads,
  });

  factory Customer360Detail.fromJson(Map<String, dynamic> json) {
    CustomerOpeningRecord? opening;
    if (json['opening_record'] != null && json['opening_record'] is Map) {
      opening = CustomerOpeningRecord.fromJson(Map<String, dynamic>.from(json['opening_record']));
    }

    return Customer360Detail(
      customer: CustomerModel.fromJson(json),
      openingRecord: opening,
      projects: json['projects'] as List? ?? [],
      quotations: json['quotations'] as List? ?? [],
      invoices: json['invoices'] as List? ?? [],
      leads: json['leads'] as List? ?? [],
    );
  }
}

