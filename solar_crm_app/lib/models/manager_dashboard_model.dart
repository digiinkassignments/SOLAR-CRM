class ManagerDashboardModel {
  final List<ManagerStatusBreakdown> statusBreakdown;
  final List<ManagerTeamMemberPerformance> teamPerformance;
  final int pendingToday;
  final int convertedToday;
  final int overdueFollowups;
  final List<ManagerFollowupItem> todaysFollowupsList;
  final List<ManagerActivityLog> recentActivity;

  ManagerDashboardModel({
    this.statusBreakdown = const [],
    this.teamPerformance = const [],
    this.pendingToday = 0,
    this.convertedToday = 0,
    this.overdueFollowups = 0,
    this.todaysFollowupsList = const [],
    this.recentActivity = const [],
  });

  int get totalTeamLeads =>
      statusBreakdown.fold<int>(0, (sum, item) => sum + item.count);

  int get totalConverted =>
      statusBreakdown
          .where((s) => s.status.toLowerCase() == 'won')
          .fold<int>(0, (sum, item) => sum + item.count);

  double get teamRevenue =>
      teamPerformance.fold<double>(0.0, (sum, item) => sum + item.revenue);

  factory ManagerDashboardModel.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic val) {
      if (val == null) return 0;
      if (val is int) return val;
      return int.tryParse(val.toString()) ?? 0;
    }

    final rawBreakdown = json['statusBreakdown'] as List? ?? [];
    final rawTeam = json['teamPerformance'] as List? ?? [];
    final rawFollowups = json['todaysFollowupsList'] as List? ?? [];
    final rawActivity = json['recentActivity'] as List? ?? [];

    return ManagerDashboardModel(
      statusBreakdown: rawBreakdown
          .map((e) => ManagerStatusBreakdown.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
      teamPerformance: rawTeam
          .map((e) => ManagerTeamMemberPerformance.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
      pendingToday: parseInt(json['pendingToday']),
      convertedToday: parseInt(json['convertedToday']),
      overdueFollowups: parseInt(json['overdueFollowups']),
      todaysFollowupsList: rawFollowups
          .map((e) => ManagerFollowupItem.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
      recentActivity: rawActivity
          .map((e) => ManagerActivityLog.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
    );
  }
}

class ManagerStatusBreakdown {
  final String status;
  final int count;

  ManagerStatusBreakdown({required this.status, required this.count});

  factory ManagerStatusBreakdown.fromJson(Map<String, dynamic> json) {
    return ManagerStatusBreakdown(
      status: json['status']?.toString() ?? 'Other',
      count: json['count'] is int
          ? json['count']
          : int.tryParse(json['count']?.toString() ?? '0') ?? 0,
    );
  }
}

class ManagerTeamMemberPerformance {
  final int id;
  final String fullName;
  final String email;
  final String? phone;
  final String status;
  final String? profileImage;
  final int totalAssigned;
  final int converted;
  final int lost;
  final int inProgress;
  final double revenue;

  ManagerTeamMemberPerformance({
    required this.id,
    required this.fullName,
    required this.email,
    this.phone,
    this.status = 'Active',
    this.profileImage,
    this.totalAssigned = 0,
    this.converted = 0,
    this.lost = 0,
    this.inProgress = 0,
    this.revenue = 0.0,
  });

  double get winRate => totalAssigned > 0 ? (converted / totalAssigned * 100) : 0.0;

  factory ManagerTeamMemberPerformance.fromJson(Map<String, dynamic> json) {
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

    return ManagerTeamMemberPerformance(
      id: parseInt(json['id']),
      fullName: json['full_name']?.toString() ?? 'Sales Representative',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString(),
      status: json['status']?.toString() ?? 'Active',
      profileImage: json['profile_image']?.toString(),
      totalAssigned: parseInt(json['total_assigned']),
      converted: parseInt(json['converted']),
      lost: parseInt(json['lost']),
      inProgress: parseInt(json['in_progress']),
      revenue: parseDouble(json['revenue']),
    );
  }
}

class ManagerFollowupItem {
  final int id;
  final String leadCode;
  final String customerName;
  final String phone;
  final String? time;
  final bool isOverdue;
  final String? repName;

  ManagerFollowupItem({
    required this.id,
    required this.leadCode,
    required this.customerName,
    required this.phone,
    this.time,
    this.isOverdue = false,
    this.repName,
  });

  factory ManagerFollowupItem.fromJson(Map<String, dynamic> json) {
    final overdueRaw = json['is_overdue'];
    bool isOverdue = false;
    if (overdueRaw is bool) {
      isOverdue = overdueRaw;
    } else if (overdueRaw is num) {
      isOverdue = overdueRaw > 0;
    } else if (overdueRaw != null) {
      isOverdue = overdueRaw.toString() == '1' || overdueRaw.toString().toLowerCase() == 'true';
    }

    return ManagerFollowupItem(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      leadCode: json['lead_code']?.toString() ?? "LEAD-${json['id']}",
      customerName: json['customer_name']?.toString() ?? 'Customer',
      phone: json['phone']?.toString() ?? json['mobile_number']?.toString() ?? '',
      time: json['time']?.toString() ?? json['next_follow_up_date']?.toString(),
      isOverdue: isOverdue,
      repName: json['rep_name']?.toString() ?? json['assigned_to_name']?.toString(),
    );
  }
}

class ManagerActivityLog {
  final int id;
  final String? action;
  final String? notes;
  final String? leadCode;
  final String? customerName;
  final String? performedByName;
  final String? createdAt;

  ManagerActivityLog({
    required this.id,
    this.action,
    this.notes,
    this.leadCode,
    this.customerName,
    this.performedByName,
    this.createdAt,
  });

  factory ManagerActivityLog.fromJson(Map<String, dynamic> json) {
    return ManagerActivityLog(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      action: json['action']?.toString() ?? json['activity_type']?.toString() ?? 'Activity',
      notes: json['notes']?.toString() ?? json['description']?.toString(),
      leadCode: json['lead_code']?.toString(),
      customerName: json['customer_name']?.toString(),
      performedByName: json['performed_by_name']?.toString() ?? json['user_name']?.toString(),
      createdAt: json['created_at']?.toString(),
    );
  }
}
