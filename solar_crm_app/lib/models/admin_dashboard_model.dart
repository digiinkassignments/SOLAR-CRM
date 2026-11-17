class AdminDashboardModel {
  final int totalLeads;
  final int wonLeads;
  final int lostLeads;
  final int activeLeads;
  final int totalManagers;
  final int totalSales;
  final double totalRevenue;
  final double totalInstalledKw;
  final int todaysFollowups;
  final String topPerformer;
  final int topPerformerCount;
  final List<StatusBreakdownItem> statusBreakdown;
  final List<SourcePerformanceItem> sourcePerformance;
  final List<MonthlyTrendItem> monthlyTrend;
  final List<RecentLeadItem> recentLeads;
  final List<TeamLeaderboardItem> teamLeaderboard;
  final List<ActivityFeedItem> activityFeed;

  AdminDashboardModel({
    required this.totalLeads,
    required this.wonLeads,
    required this.lostLeads,
    required this.activeLeads,
    required this.totalManagers,
    required this.totalSales,
    required this.totalRevenue,
    required this.totalInstalledKw,
    required this.todaysFollowups,
    required this.topPerformer,
    required this.topPerformerCount,
    required this.statusBreakdown,
    required this.sourcePerformance,
    required this.monthlyTrend,
    required this.recentLeads,
    required this.teamLeaderboard,
    required this.activityFeed,
  });

  factory AdminDashboardModel.fromJson(Map<String, dynamic> json) {
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

    final statusList = (json['statusBreakdown'] as List? ?? [])
        .map((e) => StatusBreakdownItem.fromJson(e as Map<String, dynamic>))
        .toList();

    final sourceList = (json['sourcePerformance'] as List? ?? [])
        .map((e) => SourcePerformanceItem.fromJson(e as Map<String, dynamic>))
        .toList();

    final trendList = (json['monthlyTrend'] as List? ?? [])
        .map((e) => MonthlyTrendItem.fromJson(e as Map<String, dynamic>))
        .toList();

    final recentList = (json['recentLeads'] as List? ?? [])
        .map((e) => RecentLeadItem.fromJson(e as Map<String, dynamic>))
        .toList();

    final leaderboardList = (json['teamLeaderboard'] as List? ?? [])
        .map((e) => TeamLeaderboardItem.fromJson(e as Map<String, dynamic>))
        .toList();

    final activityList = (json['activityFeed'] as List? ?? [])
        .map((e) => ActivityFeedItem.fromJson(e as Map<String, dynamic>))
        .toList();

    return AdminDashboardModel(
      totalLeads: parseInt(json['total_leads']),
      wonLeads: parseInt(json['won_leads']),
      lostLeads: parseInt(json['lost_leads']),
      activeLeads: parseInt(json['active_leads']),
      totalManagers: parseInt(json['total_managers']),
      totalSales: parseInt(json['total_sales']),
      totalRevenue: parseDouble(json['total_revenue']),
      totalInstalledKw: parseDouble(json['total_installed_kw']),
      todaysFollowups: parseInt(json['todays_followups']),
      topPerformer: json['top_performer']?.toString() ?? "N/A",
      topPerformerCount: parseInt(json['top_performer_count']),
      statusBreakdown: statusList,
      sourcePerformance: sourceList,
      monthlyTrend: trendList,
      recentLeads: recentList,
      teamLeaderboard: leaderboardList,
      activityFeed: activityList,
    );
  }
}

class StatusBreakdownItem {
  final String status;
  final int count;

  StatusBreakdownItem({required this.status, required this.count});

  factory StatusBreakdownItem.fromJson(Map<String, dynamic> json) {
    return StatusBreakdownItem(
      status: json['status']?.toString() ?? 'Unknown',
      count: json['count'] is int ? json['count'] : int.tryParse(json['count']?.toString() ?? '0') ?? 0,
    );
  }
}

class SourcePerformanceItem {
  final String source;
  final int total;
  final int won;

  SourcePerformanceItem({
    required this.source,
    required this.total,
    required this.won,
  });

  factory SourcePerformanceItem.fromJson(Map<String, dynamic> json) {
    return SourcePerformanceItem(
      source: json['lead_source']?.toString() ?? 'Direct',
      total: json['total'] is int ? json['total'] : int.tryParse(json['total']?.toString() ?? '0') ?? 0,
      won: json['won'] is int ? json['won'] : int.tryParse(json['won']?.toString() ?? '0') ?? 0,
    );
  }
}

class MonthlyTrendItem {
  final String month;
  final int leadsCreated;
  final int leadsWon;

  MonthlyTrendItem({
    required this.month,
    required this.leadsCreated,
    required this.leadsWon,
  });

  factory MonthlyTrendItem.fromJson(Map<String, dynamic> json) {
    return MonthlyTrendItem(
      month: json['month']?.toString() ?? '',
      leadsCreated: json['leads_created'] is int ? json['leads_created'] : int.tryParse(json['leads_created']?.toString() ?? '0') ?? 0,
      leadsWon: json['leads_won'] is int ? json['leads_won'] : int.tryParse(json['leads_won']?.toString() ?? '0') ?? 0,
    );
  }
}

class RecentLeadItem {
  final int id;
  final String leadCode;
  final String customerName;
  final String leadSource;
  final String status;
  final double quotationAmount;
  final double requiredKw;
  final String assignedToName;
  final String createdAt;

  RecentLeadItem({
    required this.id,
    required this.leadCode,
    required this.customerName,
    required this.leadSource,
    required this.status,
    required this.quotationAmount,
    required this.requiredKw,
    required this.assignedToName,
    required this.createdAt,
  });

  factory RecentLeadItem.fromJson(Map<String, dynamic> json) {
    double parseDouble(dynamic val) {
      if (val == null) return 0.0;
      if (val is double) return val;
      if (val is int) return val.toDouble();
      return double.tryParse(val.toString()) ?? 0.0;
    }

    return RecentLeadItem(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      leadCode: json['lead_code']?.toString() ?? '',
      customerName: json['customer_name']?.toString() ?? 'Unnamed',
      leadSource: json['lead_source']?.toString() ?? 'Unknown',
      status: json['status']?.toString() ?? 'New Lead',
      quotationAmount: parseDouble(json['quotation_amount']),
      requiredKw: parseDouble(json['required_kw']),
      assignedToName: json['assigned_to_name']?.toString() ?? 'Unassigned',
      createdAt: json['created_at']?.toString() ?? '',
    );
  }
}

class TeamLeaderboardItem {
  final String repName;
  final int totalAssigned;
  final int wonLeads;
  final double revenue;

  TeamLeaderboardItem({
    required this.repName,
    required this.totalAssigned,
    required this.wonLeads,
    required this.revenue,
  });

  factory TeamLeaderboardItem.fromJson(Map<String, dynamic> json) {
    double parseDouble(dynamic val) {
      if (val == null) return 0.0;
      if (val is double) return val;
      if (val is int) return val.toDouble();
      return double.tryParse(val.toString()) ?? 0.0;
    }

    return TeamLeaderboardItem(
      repName: json['rep_name']?.toString() ?? 'Representative',
      totalAssigned: json['total_assigned'] is int ? json['total_assigned'] : int.tryParse(json['total_assigned']?.toString() ?? '0') ?? 0,
      wonLeads: json['won_leads'] is int ? json['won_leads'] : int.tryParse(json['won_leads']?.toString() ?? '0') ?? 0,
      revenue: parseDouble(json['revenue']),
    );
  }
}

class ActivityFeedItem {
  final int? id;
  final String leadCode;
  final String customerName;
  final String action;
  final String details;
  final String performedByName;
  final String createdAt;

  ActivityFeedItem({
    this.id,
    required this.leadCode,
    required this.customerName,
    required this.action,
    required this.details,
    required this.performedByName,
    required this.createdAt,
  });

  factory ActivityFeedItem.fromJson(Map<String, dynamic> json) {
    return ActivityFeedItem(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? ''),
      leadCode: json['lead_code']?.toString() ?? '',
      customerName: json['customer_name']?.toString() ?? '',
      action: json['action']?.toString() ?? json['activity_type']?.toString() ?? 'Activity',
      details: json['details']?.toString() ?? json['notes']?.toString() ?? '',
      performedByName: json['performed_by_name']?.toString() ?? 'Staff',
      createdAt: json['created_at']?.toString() ?? '',
    );
  }
}

