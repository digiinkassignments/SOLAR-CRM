class LeadModel {
  final int id;
  final String leadCode;
  final String customerName;
  final String mobileNumber;
  final String? alternateNumber;
  final String? email;
  final String? address;
  final String? city;
  final String? state;
  final String? pincode;
  final String? electricityConsumerNumber;
  final int? monthlyConsumptionUnits;
  final String? roofType;
  final String solarRequirement;
  final String interestStatus;
  final double requiredKw;
  final double? sanctionedLoadKw;
  final double quotationAmount;
  final String status;
  final String priority;
  final String leadSource;
  final String? nextAction;
  final String? nextFollowUpDate;
  final String? nextFollowUpTime;
  final String? siteVisitDate;
  final int? assignedTo;
  final String? assignedToName;
  final String? createdByName;
  final String? remark;
  final int totalFollowups;
  final String? createdAt;

  LeadModel({
    required this.id,
    required this.leadCode,
    required this.customerName,
    required this.mobileNumber,
    this.alternateNumber,
    this.email,
    this.address,
    this.city,
    this.state,
    this.pincode,
    this.electricityConsumerNumber,
    this.monthlyConsumptionUnits,
    this.roofType,
    this.solarRequirement = 'Residential',
    this.interestStatus = 'Pending',
    required this.requiredKw,
    this.sanctionedLoadKw,
    this.quotationAmount = 0.0,
    required this.status,
    this.priority = 'Medium',
    this.leadSource = 'Direct',
    this.nextAction,
    this.nextFollowUpDate,
    this.nextFollowUpTime,
    this.siteVisitDate,
    this.assignedTo,
    this.assignedToName,
    this.createdByName,
    this.remark,
    this.totalFollowups = 0,
    this.createdAt,
  });

  bool get isWon => status.toLowerCase() == 'won';
  bool get isLost => status.toLowerCase() == 'lost';

  String get initials {
    if (customerName.trim().isEmpty) return "L";
    final parts = customerName.trim().split(" ");
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return "${parts[0][0]}${parts[parts.length - 1][0]}".toUpperCase();
  }

  factory LeadModel.fromJson(Map<String, dynamic> json) {
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

    return LeadModel(
      id: parseInt(json['id']),
      leadCode: json['lead_code']?.toString() ?? '',
      customerName: json['customer_name']?.toString() ?? 'Unnamed Lead',
      mobileNumber: json['mobile_number']?.toString() ?? '',
      alternateNumber: json['alternate_number']?.toString(),
      email: json['email']?.toString(),
      address: json['address']?.toString(),
      city: json['city']?.toString(),
      state: json['state']?.toString(),
      pincode: json['pincode']?.toString(),
      electricityConsumerNumber: json['electricity_consumer_number']?.toString(),
      monthlyConsumptionUnits: json['monthly_consumption_units'] != null
          ? parseInt(json['monthly_consumption_units'])
          : null,
      roofType: json['roof_type']?.toString(),
      solarRequirement: json['solar_requirement']?.toString() ?? 'Residential',
      interestStatus: json['interest_status']?.toString() ?? 'Pending',
      requiredKw: parseDouble(json['required_kw']),
      sanctionedLoadKw: json['sanctioned_load_kw'] != null ? parseDouble(json['sanctioned_load_kw']) : null,
      quotationAmount: parseDouble(json['quotation_amount']),
      status: json['status']?.toString() ?? 'New Lead',
      priority: json['priority']?.toString() ?? 'Medium',
      leadSource: json['lead_source']?.toString() ?? 'Direct',
      nextAction: json['next_action']?.toString(),
      nextFollowUpDate: json['next_follow_up_date']?.toString(),
      nextFollowUpTime: json['next_follow_up_time']?.toString(),
      siteVisitDate: json['site_visit_date']?.toString(),
      assignedTo: json['assigned_to'] != null ? parseInt(json['assigned_to']) : null,
      assignedToName: json['assigned_to_name']?.toString(),
      createdByName: json['created_by_name']?.toString(),
      remark: json['remark']?.toString() ?? json['initial_remark']?.toString(),
      totalFollowups: parseInt(json['total_followups']),
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
      'monthly_consumption_units': monthlyConsumptionUnits,
      'roof_type': roofType,
      'solar_requirement': solarRequirement,
      'interest_status': interestStatus,
      'required_kw': requiredKw,
      'sanctioned_load_kw': sanctionedLoadKw,
      'quotation_amount': quotationAmount,
      'status': status,
      'priority': priority,
      'lead_source': leadSource,
      'remark': remark,
      'assigned_to': assignedTo,
      'next_action': nextAction,
      'next_follow_up_date': nextFollowUpDate,
      'next_follow_up_time': nextFollowUpTime,
    };
  }
}

class AiCopilotModel {
  final int winProbability;
  final String dealHealth;
  final String executiveAssessment;
  final String recommendedSystem;
  final String estimatedSubsidy;
  final String estimatedSavings;
  final String keyObjectionTips;
  final List<String> talkingPoints;
  final Map<String, String> whatsappPitches;

  AiCopilotModel({
    required this.winProbability,
    this.dealHealth = 'Moderate Interest',
    required this.executiveAssessment,
    required this.recommendedSystem,
    required this.estimatedSubsidy,
    this.estimatedSavings = '',
    this.keyObjectionTips = '',
    required this.talkingPoints,
    this.whatsappPitches = const {},
  });

  factory AiCopilotModel.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic val) {
      if (val == null) return 65;
      if (val is int) return val;
      return int.tryParse(val.toString()) ?? 65;
    }

    List<String> parseList(dynamic val) {
      if (val == null || val is! List) return [];
      return val.map((e) => e.toString()).toList();
    }

    Map<String, String> parseMap(dynamic val) {
      if (val == null || val is! Map) return {};
      return val.map((k, v) => MapEntry(k.toString(), v?.toString() ?? ''));
    }

    return AiCopilotModel(
      winProbability: parseInt(json['win_probability'] ?? json['winProbability'] ?? json['win_rate']),
      dealHealth: json['deal_health']?.toString() ?? json['dealHealth']?.toString() ?? 'Moderate Interest',
      executiveAssessment: json['executive_summary']?.toString() ??
          json['executive_assessment']?.toString() ??
          json['assessment']?.toString() ??
          '',
      recommendedSystem: json['recommended_system']?.toString() ?? json['recommendedSystem']?.toString() ?? '',
      estimatedSubsidy: json['estimated_subsidy']?.toString() ?? json['subsidy']?.toString() ?? '',
      estimatedSavings: json['estimated_savings']?.toString() ?? json['savings']?.toString() ?? '',
      keyObjectionTips: json['key_objection_tips']?.toString() ?? '',
      talkingPoints: parseList(
        json['calling_script'] ??
            json['talking_points'] ??
            json['strategic_talking_points'] ??
            json['talkingPoints'],
      ),
      whatsappPitches: parseMap(json['whatsapp_pitches']),
    );
  }
}

class LeadFollowupItem {
  final int id;
  final String note;
  final String followupType;
  final String status;
  final String? nextFollowupDate;
  final String? performedByName;
  final String createdAt;

  LeadFollowupItem({
    required this.id,
    required this.note,
    required this.followupType,
    required this.status,
    this.nextFollowupDate,
    this.performedByName,
    required this.createdAt,
  });

  factory LeadFollowupItem.fromJson(Map<String, dynamic> json) {
    return LeadFollowupItem(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      note: json['note']?.toString() ?? json['remark']?.toString() ?? '',
      followupType: json['followup_type']?.toString() ?? 'Call',
      status: json['status']?.toString() ?? 'Pending',
      nextFollowupDate: json['next_followup_date']?.toString(),
      performedByName: json['performed_by_name']?.toString() ?? json['user_name']?.toString(),
      createdAt: json['created_at']?.toString() ?? '',
    );
  }
}

