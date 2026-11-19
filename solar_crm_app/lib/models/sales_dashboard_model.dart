class SalesDashboardModel {
  final int totalAssigned;
  final int newLeads;
  final int todayFollowups;
  final int pendingFollowups;
  final int converted;
  final int lost;
  final int upcomingSiteVisits;
  final List<SalesStatusBreakdown> statusBreakdown;
  final List<SalesFollowupItem> followupsList;
  final List<SalesActivityTimelineItem> activityTimeline;

  SalesDashboardModel({
    this.totalAssigned = 0,
    this.newLeads = 0,
    this.todayFollowups = 0,
    this.pendingFollowups = 0,
    this.converted = 0,
    this.lost = 0,
    this.upcomingSiteVisits = 0,
    this.statusBreakdown = const [],
    this.followupsList = const [],
    this.activityTimeline = const [],
  });

  double get winRate =>
      totalAssigned > 0 ? (converted / totalAssigned * 100) : 0.0;

  int get inProgressLeads =>
      totalAssigned - (converted + lost);

  factory SalesDashboardModel.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic val) {
      if (val == null) return 0;
      if (val is int) return val;
      return int.tryParse(val.toString()) ?? 0;
    }

    final rawBreakdown = json['statusBreakdown'] as List? ?? [];
    final rawFollowups = json['followupsList'] as List? ?? [];
    final rawTimeline = json['activityTimeline'] as List? ?? [];

    return SalesDashboardModel(
      totalAssigned: parseInt(json['total_assigned']),
      newLeads: parseInt(json['new_leads']),
      todayFollowups: parseInt(json['today_followups']),
      pendingFollowups: parseInt(json['pending_followups']),
      converted: parseInt(json['converted']),
      lost: parseInt(json['lost']),
      upcomingSiteVisits: parseInt(json['upcoming_site_visits']),
      statusBreakdown: rawBreakdown
          .map((e) => SalesStatusBreakdown.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
      followupsList: rawFollowups
          .map((e) => SalesFollowupItem.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
      activityTimeline: rawTimeline
          .map((e) => SalesActivityTimelineItem.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
    );
  }
}

class SalesStatusBreakdown {
  final String status;
  final int count;

  SalesStatusBreakdown({required this.status, required this.count});

  factory SalesStatusBreakdown.fromJson(Map<String, dynamic> json) {
    return SalesStatusBreakdown(
      status: json['status']?.toString() ?? 'Other',
      count: json['count'] is int
          ? json['count']
          : int.tryParse(json['count']?.toString() ?? '0') ?? 0,
    );
  }
}

class SalesFollowupItem {
  final int id;
  final String leadCode;
  final String customerName;
  final String phone;
  final String? nextFollowUpDate;
  final bool isOverdue;

  SalesFollowupItem({
    required this.id,
    required this.leadCode,
    required this.customerName,
    required this.phone,
    this.nextFollowUpDate,
    this.isOverdue = false,
  });

  factory SalesFollowupItem.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic val) {
      if (val == null) return 0;
      if (val is int) return val;
      return int.tryParse(val.toString()) ?? 0;
    }

    final overdueVal = json['is_overdue'];
    bool isOverdue = false;
    if (overdueVal is bool) {
      isOverdue = overdueVal;
    } else if (overdueVal is int) {
      isOverdue = overdueVal == 1;
    } else if (overdueVal != null) {
      isOverdue = overdueVal.toString().toLowerCase() == 'true' || overdueVal.toString() == '1';
    }

    return SalesFollowupItem(
      id: parseInt(json['id']),
      leadCode: json['lead_code']?.toString() ?? 'LEAD-000',
      customerName: json['customer_name']?.toString() ?? 'Customer',
      phone: json['phone']?.toString() ?? json['mobile_number']?.toString() ?? '',
      nextFollowUpDate: json['next_follow_up_date']?.toString(),
      isOverdue: isOverdue,
    );
  }
}

class SalesActivityTimelineItem {
  final int id;
  final int? leadId;
  final String? leadCode;
  final String? customerName;
  final String action;
  final String? details;
  final String? createdAt;

  SalesActivityTimelineItem({
    required this.id,
    this.leadId,
    this.leadCode,
    this.customerName,
    required this.action,
    this.details,
    this.createdAt,
  });

  factory SalesActivityTimelineItem.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic val) {
      if (val == null) return 0;
      if (val is int) return val;
      return int.tryParse(val.toString()) ?? 0;
    }

    return SalesActivityTimelineItem(
      id: parseInt(json['id']),
      leadId: json['lead_id'] != null ? parseInt(json['lead_id']) : null,
      leadCode: json['lead_code']?.toString(),
      customerName: json['customer_name']?.toString(),
      action: json['action']?.toString() ?? 'Activity',
      details: json['details']?.toString() ?? json['note']?.toString(),
      createdAt: json['created_at']?.toString(),
    );
  }
}
