class EngineerDashboardModel {
  final int todaySurveys;
  final int pendingSurveys;
  final int completedSurveys;
  final int activeProjects;
  final List<EngineerScheduleItem> todaySchedule;
  final List<EngineerScheduleItem> recentSurveys;

  EngineerDashboardModel({
    this.todaySurveys = 0,
    this.pendingSurveys = 0,
    this.completedSurveys = 0,
    this.activeProjects = 0,
    this.todaySchedule = const [],
    this.recentSurveys = const [],
  });

  factory EngineerDashboardModel.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic val) {
      if (val == null) return 0;
      if (val is int) return val;
      return int.tryParse(val.toString()) ?? 0;
    }

    final rawToday = json['todaySchedule'] as List? ?? [];
    final rawRecent = json['recentSurveys'] as List? ?? [];

    return EngineerDashboardModel(
      todaySurveys: parseInt(json['todaySurveys']),
      pendingSurveys: parseInt(json['pendingSurveys']),
      completedSurveys: parseInt(json['completedSurveys']),
      activeProjects: parseInt(json['activeProjects']),
      todaySchedule: rawToday
          .map((e) => EngineerScheduleItem.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
      recentSurveys: rawRecent
          .map((e) => EngineerScheduleItem.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
    );
  }
}

class EngineerScheduleItem {
  final int id;
  final int? leadId;
  final String leadCode;
  final String customerName;
  final String mobileNumber;
  final String? address;
  final String? city;
  final String? state;
  final double requiredKw;
  final String? scheduledTime;
  final String? scheduledDate;
  final String status;
  final double? siteLatitude;
  final double? siteLongitude;

  EngineerScheduleItem({
    required this.id,
    this.leadId,
    required this.leadCode,
    required this.customerName,
    required this.mobileNumber,
    this.address,
    this.city,
    this.state,
    this.requiredKw = 0.0,
    this.scheduledTime,
    this.scheduledDate,
    this.status = 'scheduled',
    this.siteLatitude,
    this.siteLongitude,
  });

  String get fullAddress {
    final parts = [address, city, state].where((s) => s != null && s.trim().isNotEmpty).toList();
    return parts.isNotEmpty ? parts.join(', ') : 'Address not recorded';
  }

  factory EngineerScheduleItem.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic val) {
      if (val == null) return 0;
      if (val is int) return val;
      return int.tryParse(val.toString()) ?? 0;
    }

    double parseDouble(dynamic val) {
      if (val == null) return 0.0;
      if (val is num) return val.toDouble();
      return double.tryParse(val.toString()) ?? 0.0;
    }

    return EngineerScheduleItem(
      id: parseInt(json['id']),
      leadId: json['lead_id'] != null ? parseInt(json['lead_id']) : null,
      leadCode: json['lead_code']?.toString() ?? 'LEAD-000',
      customerName: json['customer_name']?.toString() ?? 'Customer',
      mobileNumber: json['mobile_number']?.toString() ?? json['phone']?.toString() ?? '',
      address: json['address']?.toString(),
      city: json['city']?.toString(),
      state: json['state']?.toString(),
      requiredKw: parseDouble(json['required_kw']),
      scheduledTime: json['scheduled_time']?.toString(),
      scheduledDate: json['scheduled_date']?.toString(),
      status: json['status']?.toString() ?? 'scheduled',
      siteLatitude: json['site_latitude'] != null ? parseDouble(json['site_latitude']) : null,
      siteLongitude: json['site_longitude'] != null ? parseDouble(json['site_longitude']) : null,
    );
  }
}
