// lib/models/warranty_amc_model.dart

class WarrantyAmcModel {
  final int? id;
  final int? projectId;
  final String? warrantyCertificateNo;
  final int? panelWarrantyYears;
  final int? panelProductWarrantyYears;
  final String? panelProductWarrantyEnd;
  final int? panelPerformanceWarrantyYears;
  final String? panelPerformanceWarrantyEnd;
  final int? inverterWarrantyYears;
  final String? inverterWarrantyEnd;
  final int? installationWarrantyYears;
  final String? installationWarrantyEnd;
  final String? warrantyStartDate;
  final String? warrantyEndDate;
  final String? freeServiceEndDate;
  final String? amcStartDate;
  final String? amcEndDate;
  final String? amcPlan;
  final int? amcPlanId;
  final Map<String, dynamic>? amcPlanSnapshot;
  final double? amcAmount;
  final String? amcPaymentStatus;
  final String? amcRenewalDate;
  final String? visitFrequency;
  final String? panelSerialNumbers;
  final String? inverterSerialNumber;
  final String? monitoringPortalUrl;
  final String? monitoringPlantId;
  final String? monitoringUsername;
  final String? warrantyDocketUrl;
  final List<ScheduledVisitModel> scheduledVisits;
  final int? createdBy;
  final String? createdAt;
  final String? updatedAt;

  WarrantyAmcModel({
    this.id,
    this.projectId,
    this.warrantyCertificateNo,
    this.panelWarrantyYears,
    this.panelProductWarrantyYears,
    this.panelProductWarrantyEnd,
    this.panelPerformanceWarrantyYears,
    this.panelPerformanceWarrantyEnd,
    this.inverterWarrantyYears,
    this.inverterWarrantyEnd,
    this.installationWarrantyYears,
    this.installationWarrantyEnd,
    this.warrantyStartDate,
    this.warrantyEndDate,
    this.freeServiceEndDate,
    this.amcStartDate,
    this.amcEndDate,
    this.amcPlan,
    this.amcPlanId,
    this.amcPlanSnapshot,
    this.amcAmount,
    this.amcPaymentStatus,
    this.amcRenewalDate,
    this.visitFrequency,
    this.panelSerialNumbers,
    this.inverterSerialNumber,
    this.monitoringPortalUrl,
    this.monitoringPlantId,
    this.monitoringUsername,
    this.warrantyDocketUrl,
    this.scheduledVisits = const [],
    this.createdBy,
    this.createdAt,
    this.updatedAt,
  });

  static int? _parseInt(dynamic val) {
    if (val == null) return null;
    if (val is int) return val;
    return int.tryParse(val.toString());
  }

  static double? _parseDouble(dynamic val) {
    if (val == null) return null;
    if (val is num) return val.toDouble();
    return double.tryParse(val.toString());
  }

  static String? _parseDate(dynamic val) {
    if (val == null) return null;
    final str = val.toString().trim();
    if (str.isEmpty || str == 'null' || str == 'undefined') return null;
    if (str.contains('T')) {
      return str.split('T')[0];
    }
    return str.length >= 10 ? str.substring(0, 10) : str;
  }

  factory WarrantyAmcModel.fromJson(Map<String, dynamic> json) {
    List<ScheduledVisitModel> parseVisits(dynamic raw) {
      if (raw == null) return [];
      if (raw is List) {
        return raw.map((e) => ScheduledVisitModel.fromJson(Map<String, dynamic>.from(e))).toList();
      }
      return [];
    }

    Map<String, dynamic>? parseSnapshot(dynamic raw) {
      if (raw == null) return null;
      if (raw is Map) return Map<String, dynamic>.from(raw);
      return null;
    }

    return WarrantyAmcModel(
      id: _parseInt(json['id']),
      projectId: _parseInt(json['project_id']),
      warrantyCertificateNo: json['warranty_certificate_no']?.toString(),
      panelWarrantyYears: _parseInt(json['panel_warranty_years']),
      panelProductWarrantyYears: _parseInt(json['panel_product_warranty_years']),
      panelProductWarrantyEnd: _parseDate(json['panel_product_warranty_end']),
      panelPerformanceWarrantyYears: _parseInt(json['panel_performance_warranty_years']),
      panelPerformanceWarrantyEnd: _parseDate(json['panel_performance_warranty_end']),
      inverterWarrantyYears: _parseInt(json['inverter_warranty_years']),
      inverterWarrantyEnd: _parseDate(json['inverter_warranty_end']),
      installationWarrantyYears: _parseInt(json['installation_warranty_years']),
      installationWarrantyEnd: _parseDate(json['installation_warranty_end']),
      warrantyStartDate: _parseDate(json['warranty_start_date']),
      warrantyEndDate: _parseDate(json['warranty_end_date']),
      freeServiceEndDate: _parseDate(json['free_service_end_date']),
      amcStartDate: _parseDate(json['amc_start_date']),
      amcEndDate: _parseDate(json['amc_end_date']),
      amcPlan: json['amc_plan']?.toString(),
      amcPlanId: _parseInt(json['amc_plan_id']),
      amcPlanSnapshot: parseSnapshot(json['amc_plan_snapshot']),
      amcAmount: _parseDouble(json['amc_amount']),
      amcPaymentStatus: json['amc_payment_status']?.toString(),
      amcRenewalDate: _parseDate(json['amc_renewal_date']),
      visitFrequency: json['visit_frequency']?.toString(),
      panelSerialNumbers: json['panel_serial_numbers']?.toString(),
      inverterSerialNumber: json['inverter_serial_number']?.toString(),
      monitoringPortalUrl: json['monitoring_portal_url']?.toString(),
      monitoringPlantId: json['monitoring_plant_id']?.toString(),
      monitoringUsername: json['monitoring_username']?.toString(),
      warrantyDocketUrl: json['warranty_docket_url']?.toString(),
      scheduledVisits: parseVisits(json['scheduled_visits']),
      createdBy: _parseInt(json['created_by']),
      createdAt: json['created_at']?.toString(),
      updatedAt: json['updated_at']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'warranty_certificate_no': warrantyCertificateNo,
      'warranty_start_date': warrantyStartDate,
      'free_service_end_date': freeServiceEndDate,
      'panel_warranty_years': panelWarrantyYears,
      'panel_product_warranty_years': panelProductWarrantyYears,
      'panel_product_warranty_end': panelProductWarrantyEnd,
      'panel_performance_warranty_years': panelPerformanceWarrantyYears,
      'panel_performance_warranty_end': panelPerformanceWarrantyEnd,
      'inverter_warranty_years': inverterWarrantyYears,
      'inverter_warranty_end': inverterWarrantyEnd,
      'installation_warranty_years': installationWarrantyYears,
      'installation_warranty_end': installationWarrantyEnd,
      'amc_start_date': amcStartDate,
      'amc_end_date': amcEndDate,
      'amc_plan': amcPlan,
      'amc_plan_id': amcPlanId,
      'amc_plan_snapshot': amcPlanSnapshot,
      'amc_amount': amcAmount,
      'amc_payment_status': amcPaymentStatus,
      'amc_renewal_date': amcRenewalDate,
      'visit_frequency': visitFrequency,
      'panel_serial_numbers': panelSerialNumbers,
      'inverter_serial_number': inverterSerialNumber,
      'monitoring_portal_url': monitoringPortalUrl,
      'monitoring_plant_id': monitoringPlantId,
      'monitoring_username': monitoringUsername,
      'warranty_docket_url': warrantyDocketUrl,
      'scheduled_visits': scheduledVisits.map((e) => e.toJson()).toList(),
    };
  }
}

class ScheduledVisitModel {
  final dynamic id;
  final String? quarter;
  final String? scheduledDate;
  final String? technician;
  final String? scope;
  final String? status;
  final String? completedDate;

  ScheduledVisitModel({
    this.id,
    this.quarter,
    this.scheduledDate,
    this.technician,
    this.scope,
    this.status,
    this.completedDate,
  });

  factory ScheduledVisitModel.fromJson(Map<String, dynamic> json) {
    return ScheduledVisitModel(
      id: json['id'],
      quarter: json['quarter']?.toString(),
      scheduledDate: json['scheduled_date']?.toString(),
      technician: json['technician']?.toString(),
      scope: json['scope']?.toString(),
      status: json['status']?.toString() ?? 'Scheduled',
      completedDate: json['completed_date']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'quarter': quarter,
      'scheduled_date': scheduledDate,
      'technician': technician,
      'scope': scope,
      'status': status,
      'completed_date': completedDate,
    };
  }

  ScheduledVisitModel copyWith({
    dynamic id,
    String? quarter,
    String? scheduledDate,
    String? technician,
    String? scope,
    String? status,
    String? completedDate,
  }) {
    return ScheduledVisitModel(
      id: id ?? this.id,
      quarter: quarter ?? this.quarter,
      scheduledDate: scheduledDate ?? this.scheduledDate,
      technician: technician ?? this.technician,
      scope: scope ?? this.scope,
      status: status ?? this.status,
      completedDate: completedDate ?? this.completedDate,
    );
  }
}

class ServiceVisitModel {
  final int? id;
  final int? projectId;
  final String? visitDate;
  final String? technician;
  final String? issueReported;
  final String? resolution;
  final String? status;
  final int? createdBy;
  final String? createdAt;
  final String? updatedAt;

  ServiceVisitModel({
    this.id,
    this.projectId,
    this.visitDate,
    this.technician,
    this.issueReported,
    this.resolution,
    this.status,
    this.createdBy,
    this.createdAt,
    this.updatedAt,
  });

  factory ServiceVisitModel.fromJson(Map<String, dynamic> json) {
    return ServiceVisitModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? ''),
      projectId: json['project_id'] is int ? json['project_id'] : int.tryParse(json['project_id']?.toString() ?? ''),
      visitDate: json['visit_date']?.toString(),
      technician: json['technician']?.toString(),
      issueReported: json['issue_reported']?.toString(),
      resolution: json['resolution']?.toString(),
      status: json['status']?.toString() ?? 'Completed',
      createdBy: json['created_by'] is int ? json['created_by'] : int.tryParse(json['created_by']?.toString() ?? ''),
      createdAt: json['created_at']?.toString(),
      updatedAt: json['updated_at']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'visit_date': visitDate,
      'technician': technician,
      'issue_reported': issueReported,
      'resolution': resolution,
      'status': status ?? 'Completed',
    };
  }
}

class CompanyAmcPlanModel {
  final int id;
  final String name;
  final String? coverage;
  final String? exclusions;
  final double annualAmount;
  final String visitFrequency;
  final int termMonths;
  final bool isActive;
  final int version;

  CompanyAmcPlanModel({
    required this.id,
    required this.name,
    this.coverage,
    this.exclusions,
    required this.annualAmount,
    required this.visitFrequency,
    required this.termMonths,
    required this.isActive,
    required this.version,
  });

  factory CompanyAmcPlanModel.fromJson(Map<String, dynamic> json) {
    return CompanyAmcPlanModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      name: json['name']?.toString() ?? '',
      coverage: json['coverage']?.toString(),
      exclusions: json['exclusions']?.toString(),
      annualAmount: (json['annual_amount'] is num)
          ? (json['annual_amount'] as num).toDouble()
          : double.tryParse(json['annual_amount']?.toString() ?? '0') ?? 0.0,
      visitFrequency: json['visit_frequency']?.toString() ?? 'Quarterly',
      termMonths: json['term_months'] is int
          ? json['term_months']
          : int.tryParse(json['term_months']?.toString() ?? '12') ?? 12,
      isActive: json['is_active'] == 1 || json['is_active'] == true,
      version: json['version'] is int
          ? json['version']
          : int.tryParse(json['version']?.toString() ?? '1') ?? 1,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'coverage': coverage,
      'exclusions': exclusions,
      'annual_amount': annualAmount,
      'visit_frequency': visitFrequency,
      'term_months': termMonths,
      'is_active': isActive ? 1 : 0,
      'version': version,
    };
  }
}

