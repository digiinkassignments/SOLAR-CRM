class SurveyModel {
  final int id;
  final int leadId;
  final String leadCode;
  final String customerName;
  final String mobileNumber;
  final String? address;
  final String? landmark;
  final String? city;
  final String? state;
  final double requiredKw;
  final String? engineerName;
  final int? assignedEngineerId;
  final String? scheduledDate;
  final String? scheduledTime;
  final String status;
  final String? feasibilityVerdict;
  final String? notFeasibleReason;
  final String? roofType;
  final double? roofAreaSqft;
  final String? shadowConditions;
  final String? electricalPhase;
  final double? sanctionedLoadKw;
  final double? proposedCapacityKw;
  final String? consumerNumber;
  final String? roofOrientation;
  final double? roofTiltAngle;
  final String? feasibilityNotes;
  final String? siteNotes;
  final double? siteLatitude;
  final double? siteLongitude;
  final List<String> photos;
  final int? projectId;
  final String? projectNumber;
  final String? projectStage;

  SurveyModel({
    required this.id,
    required this.leadId,
    required this.leadCode,
    required this.customerName,
    required this.mobileNumber,
    this.address,
    this.landmark,
    this.city,
    this.state,
    this.requiredKw = 0.0,
    this.engineerName,
    this.assignedEngineerId,
    this.scheduledDate,
    this.scheduledTime,
    this.status = 'scheduled',
    this.feasibilityVerdict,
    this.notFeasibleReason,
    this.roofType,
    this.roofAreaSqft,
    this.shadowConditions,
    this.electricalPhase,
    this.sanctionedLoadKw,
    this.proposedCapacityKw,
    this.consumerNumber,
    this.roofOrientation,
    this.roofTiltAngle,
    this.feasibilityNotes,
    this.siteNotes,
    this.siteLatitude,
    this.siteLongitude,
    this.photos = const [],
    this.projectId,
    this.projectNumber,
    this.projectStage,
  });

  bool get isCompleted => status.toLowerCase() == 'completed';
  bool get isScheduled => status.toLowerCase() == 'scheduled';
  bool get isFeasible => feasibilityVerdict == 'Feasible';
  bool get isFeasibleWithConditions => feasibilityVerdict == 'Feasible with conditions';
  bool get isNotFeasible => feasibilityVerdict == 'Not feasible';
  bool get hasProject => projectId != null && projectId! > 0;

  bool get hasGps => siteLatitude != null && siteLongitude != null && siteLatitude != 0 && siteLongitude != 0;

  String? get mapsUrl {
    if (hasGps) {
      return 'https://www.google.com/maps/dir/?api=1&destination=$siteLatitude,$siteLongitude';
    }
    final effectiveAddr = fullAddress.trim();
    if (effectiveAddr.isNotEmpty && effectiveAddr != 'Address not recorded') {
      return 'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(effectiveAddr)}';
    }
    return null;
  }

  String get fullAddress {
    final effectiveAddr = address?.trim();
    final effectiveLandmark = landmark?.trim();
    final effectiveCity = city?.trim();
    final effectiveState = state?.trim();

    final parts = <String>[];
    if (effectiveAddr != null && effectiveAddr.isNotEmpty) {
      parts.add(effectiveAddr);
    }
    if (effectiveLandmark != null && effectiveLandmark.isNotEmpty) {
      parts.add("Landmark: $effectiveLandmark");
    }
    if (effectiveCity != null && effectiveCity.isNotEmpty) {
      parts.add(effectiveCity);
    }
    if (effectiveState != null && effectiveState.isNotEmpty) {
      parts.add(effectiveState);
    }
    return parts.isNotEmpty ? parts.join(', ') : 'Address not recorded';
  }

  factory SurveyModel.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic val) {
      if (val == null) return 0;
      if (val is int) return val;
      return int.tryParse(val.toString()) ?? 0;
    }

    double? parseDouble(dynamic val) {
      if (val == null) return null;
      if (val is num) return val.toDouble();
      return double.tryParse(val.toString());
    }

    List<String> parsePhotos(dynamic val) {
      if (val == null) return [];
      if (val is List) {
        return val.map((e) => e.toString()).toList();
      }
      return [];
    }

    return SurveyModel(
      id: parseInt(json['id']),
      leadId: parseInt(json['lead_id']),
      leadCode: json['lead_code']?.toString() ?? 'LEAD-000',
      customerName: json['customer_name']?.toString() ?? 'Customer',
      mobileNumber: json['mobile_number']?.toString() ?? json['customer_phone']?.toString() ?? '',
      address: json['site_address']?.toString() ?? json['customer_address']?.toString() ?? json['address']?.toString(),
      landmark: json['landmark']?.toString() ?? json['site_landmark']?.toString(),
      city: json['city']?.toString(),
      state: json['state']?.toString(),
      requiredKw: parseDouble(json['required_kw']) ?? 0.0,
      engineerName: json['engineer_name']?.toString(),
      assignedEngineerId: json['assigned_engineer_id'] != null ? parseInt(json['assigned_engineer_id']) : null,
      scheduledDate: json['scheduled_date']?.toString(),
      scheduledTime: json['scheduled_time']?.toString(),
      status: json['status']?.toString() ?? 'scheduled',
      feasibilityVerdict: json['feasibility_verdict']?.toString(),
      notFeasibleReason: json['not_feasible_reason']?.toString(),
      roofType: json['roof_type']?.toString(),
      roofAreaSqft: parseDouble(json['roof_area_sqft']),
      shadowConditions: json['shadow_conditions']?.toString(),
      electricalPhase: json['electrical_phase']?.toString(),
      sanctionedLoadKw: parseDouble(json['sanctioned_load_kw']),
      proposedCapacityKw: parseDouble(json['proposed_capacity_kw']),
      consumerNumber: json['consumer_number']?.toString(),
      roofOrientation: json['roof_orientation']?.toString(),
      roofTiltAngle: parseDouble(json['roof_tilt_angle']),
      feasibilityNotes: json['feasibility_notes']?.toString(),
      siteNotes: json['site_notes']?.toString(),
      siteLatitude: parseDouble(json['site_latitude'] ?? json['gps_latitude']),
      siteLongitude: parseDouble(json['site_longitude'] ?? json['gps_longitude']),
      photos: parsePhotos(json['photos']),
      projectId: json['project_id'] != null ? parseInt(json['project_id']) : null,
      projectNumber: json['project_number']?.toString(),
      projectStage: json['project_stage']?.toString(),
    );
  }
}

class SurveyDocumentModel {
  final int id;
  final int surveyId;
  final String category; // 'aadhaar', 'electricity_bill', 'site_photo', 'bank_passbook'
  final String originalName;
  final String mime;
  final int sizeBytes;
  final String? createdAt;

  const SurveyDocumentModel({
    required this.id,
    required this.surveyId,
    required this.category,
    required this.originalName,
    required this.mime,
    required this.sizeBytes,
    this.createdAt,
  });

  bool get isPdf =>
      mime.toLowerCase().contains('pdf') ||
      originalName.toLowerCase().endsWith('.pdf');

  bool get isImage =>
      mime.toLowerCase().startsWith('image/') ||
      originalName.toLowerCase().endsWith('.jpg') ||
      originalName.toLowerCase().endsWith('.jpeg') ||
      originalName.toLowerCase().endsWith('.png') ||
      originalName.toLowerCase().endsWith('.webp');

  String get formattedSize {
    if (sizeBytes < 1024) return '$sizeBytes B';
    if (sizeBytes < 1024 * 1024) return '${(sizeBytes / 1024).toStringAsFixed(1)} KB';
    return '${(sizeBytes / (1024 * 1024)).toStringAsFixed(2)} MB';
  }

  factory SurveyDocumentModel.fromJson(Map<String, dynamic> json, {int? fallbackSurveyId}) {
    int parseInt(dynamic val) {
      if (val == null) return 0;
      if (val is int) return val;
      return int.tryParse(val.toString()) ?? 0;
    }

    return SurveyDocumentModel(
      id: parseInt(json['id']),
      surveyId: parseInt(json['survey_id'] ?? fallbackSurveyId),
      category: json['category']?.toString() ?? 'site_photo',
      originalName: json['original_name']?.toString() ?? 'document',
      mime: json['mime']?.toString() ?? 'application/octet-stream',
      sizeBytes: parseInt(json['size_bytes']),
      createdAt: json['created_at']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'survey_id': surveyId,
    'category': category,
    'original_name': originalName,
    'mime': mime,
    'size_bytes': sizeBytes,
    'created_at': createdAt,
  };
}
