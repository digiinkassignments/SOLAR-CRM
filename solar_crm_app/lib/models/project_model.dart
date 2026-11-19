import 'package:flutter/material.dart';

class ProjectModel {
  final int id;
  final String projectNumber;
  final int? leadId;
  final int? quotationId;
  final String customerName;
  final String customerPhone;
  final String? customerAddress;
  final String? city;
  final String? state;
  final String? pincode;
  final double systemCapacityKw;
  final int? panelCount;
  final double? inverterKw;
  final double totalCost;
  final double amountReceived;
  final String paymentStatus;
  final String stage;
  final DateTime? stageUpdatedAt;
  final int? assignedTo;
  final String? assignedToName;
  final String? assignedByName;
  final int? createdBy;
  final String? createdByName;
  final DateTime? installationStartDate;
  final DateTime? installationEndDate;
  final DateTime? completionDate;
  final String? notes;
  final List<ProjectStageLogModel> stageLogs;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  ProjectModel({
    required this.id,
    required this.projectNumber,
    this.leadId,
    this.quotationId,
    required this.customerName,
    required this.customerPhone,
    this.customerAddress,
    this.city,
    this.state,
    this.pincode,
    required this.systemCapacityKw,
    this.panelCount,
    this.inverterKw,
    this.totalCost = 0.0,
    this.amountReceived = 0.0,
    this.paymentStatus = 'Pending',
    required this.stage,
    this.stageUpdatedAt,
    this.assignedTo,
    this.assignedToName,
    this.assignedByName,
    this.createdBy,
    this.createdByName,
    this.installationStartDate,
    this.installationEndDate,
    this.completionDate,
    this.notes,
    this.stageLogs = const [],
    this.createdAt,
    this.updatedAt,
  });

  // 10 Sequential PM Surya Ghar Solar EPC Stages
  static const List<String> stages = [
    'Order Closed',
    'DISCOM Application',
    'Pre-Install Inspection',
    'Procurement',
    'Installation In Progress',
    'Commissioning',
    'Subsidy Applied',
    'Subsidy Received',
    'Handover Done',
    'Warranty Period',
  ];

  static const Map<String, Map<String, dynamic>> stageConfig = {
    'Order Closed': {
      'step': 1,
      'color': Color(0xFF2563EB),
      'bg': Color(0xFFEFF6FF),
      'border': Color(0xFFBFDBFE),
      'description': 'Deal won & advance payment confirmed from customer',
    },
    'DISCOM Application': {
      'step': 2,
      'color': Color(0xFF0284C7),
      'bg': Color(0xFFF0F9FF),
      'border': Color(0xFFBAE6FD),
      'description': 'DISCOM registration, net meter application & feasibility approval',
    },
    'Pre-Install Inspection': {
      'step': 3,
      'color': Color(0xFF7C3AED),
      'bg': Color(0xFFF5F3FF),
      'border': Color(0xFFDDD6FE),
      'description': 'Site survey verification, shadow analysis & BOM',
    },
    'Procurement': {
      'step': 4,
      'color': Color(0xFFD97706),
      'bg': Color(0xFFFFFBEB),
      'border': Color(0xFFFDE68A),
      'description': 'Panels, inverter, structure & BOS dispatch from inventory',
    },
    'Installation In Progress': {
      'step': 5,
      'color': Color(0xFFEA580C),
      'bg': Color(0xFFFFF7ED),
      'border': Color(0xFFFFEDD5),
      'description': 'Structure erection, solar modules mounting, inverter & AC/DC wiring',
    },
    'Commissioning': {
      'step': 6,
      'color': Color(0xFF4F46E5),
      'bg': Color(0xFFEEF2FF),
      'border': Color(0xFFC7D2FE),
      'description': 'DISCOM inspection, bi-directional net meter installation & grid sync',
    },
    'Subsidy Applied': {
      'step': 7,
      'color': Color(0xFF0891B2),
      'bg': Color(0xFFECFEFF),
      'border': Color(0xFFA5F3FC),
      'description': 'Commissioning certificate uploaded to PM Surya Ghar National Portal',
    },
    'Subsidy Received': {
      'step': 8,
      'color': Color(0xFF16A34A),
      'bg': Color(0xFFF0FDF4),
      'border': Color(0xFFBBF7D0),
      'description': 'Direct DBT subsidy credited into customer bank account',
    },
    'Handover Done': {
      'step': 9,
      'color': Color(0xFF059669),
      'bg': Color(0xFFECFDF5),
      'border': Color(0xFFA7F3D0),
      'description': 'System documentation, warranty cards & customer sign-off',
    },
    'Warranty Period': {
      'step': 10,
      'color': Color(0xFF0D9488),
      'bg': Color(0xFFF0FDFA),
      'border': Color(0xFF99F6E4),
      'description': '25-year panel performance warranty & routine AMC visits',
    },
  };

  Map<String, dynamic> get stageMeta {
    return stageConfig[stage] ?? {
      'step': 1,
      'color': const Color(0xFF64748B),
      'bg': const Color(0xFFF1F5F9),
      'border': const Color(0xFFCBD5E1),
      'description': 'Project execution stage',
    };
  }

  int get stageStep {
    final meta = stageMeta;
    return meta['step'] as int? ?? (stages.indexOf(stage) + 1);
  }

  double get progressPercent {
    final idx = stages.indexOf(stage);
    if (idx == -1) return 0.10;
    return (idx + 1) / stages.length;
  }

  double get balanceAmount {
    return totalCost > amountReceived ? totalCost - amountReceived : 0.0;
  }

  bool get isPaidFull {
    return totalCost > 0 && balanceAmount == 0;
  }

  factory ProjectModel.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic d) {
      if (d == null) return null;
      try {
        return DateTime.parse(d.toString());
      } catch (_) {
        return null;
      }
    }

    double parseDouble(dynamic v, double fallback) {
      if (v == null) return fallback;
      if (v is num) return v.toDouble();
      return double.tryParse(v.toString()) ?? fallback;
    }

    int parseInt(dynamic v, int fallback) {
      if (v == null) return fallback;
      if (v is int) return v;
      return int.tryParse(v.toString()) ?? fallback;
    }

    return ProjectModel(
      id: parseInt(json['id'], 0),
      projectNumber: json['project_number']?.toString() ?? 'PRJ-NEW',
      leadId: json['lead_id'] != null ? parseInt(json['lead_id'], 0) : null,
      quotationId: json['quotation_id'] != null ? parseInt(json['quotation_id'], 0) : null,
      customerName: json['customer_name']?.toString() ?? 'Solar Customer',
      customerPhone: json['customer_phone']?.toString() ?? '',
      customerAddress: json['customer_address']?.toString(),
      city: json['city']?.toString(),
      state: json['state']?.toString(),
      pincode: json['pincode']?.toString(),
      systemCapacityKw: parseDouble(json['system_capacity_kw'], 3.0),
      panelCount: json['panel_count'] != null ? parseInt(json['panel_count'], 0) : null,
      inverterKw: json['inverter_kw'] != null ? parseDouble(json['inverter_kw'], 0.0) : null,
      totalCost: parseDouble(json['total_cost'], 0.0),
      amountReceived: parseDouble(json['amount_received'], 0.0),
      paymentStatus: json['payment_status']?.toString() ?? 'Pending',
      stage: json['stage']?.toString() ?? 'Order Closed',
      stageUpdatedAt: parseDate(json['stage_updated_at']),
      assignedTo: json['assigned_to'] != null ? parseInt(json['assigned_to'], 0) : null,
      assignedToName: json['assigned_to_name']?.toString(),
      assignedByName: json['assigned_by_name']?.toString(),
      createdBy: json['created_by'] != null ? parseInt(json['created_by'], 0) : null,
      createdByName: json['created_by_name']?.toString(),
      installationStartDate: parseDate(json['installation_start_date']),
      installationEndDate: parseDate(json['installation_end_date']),
      completionDate: parseDate(json['completion_date']),
      notes: json['notes']?.toString(),
      stageLogs: ((json['stage_logs'] ?? json['stageLogs']) is List)
          ? ((json['stage_logs'] ?? json['stageLogs']) as List)
              .map((l) => ProjectStageLogModel.fromJson(l as Map<String, dynamic>))
              .toList()
          : [],
      createdAt: parseDate(json['created_at']),
      updatedAt: parseDate(json['updated_at']),
    );
  }
}

class ProjectStageLogModel {
  final int id;
  final int projectId;
  final String? fromStage;
  final String toStage;
  final int? changedBy;
  final String? changedByName;
  final String? notes;
  final DateTime? createdAt;

  ProjectStageLogModel({
    required this.id,
    required this.projectId,
    this.fromStage,
    required this.toStage,
    this.changedBy,
    this.changedByName,
    this.notes,
    this.createdAt,
  });

  factory ProjectStageLogModel.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic d) {
      if (d == null) return null;
      try {
        final str = d.toString().trim();
        return DateTime.tryParse(str) ?? DateTime.tryParse(str.replaceAll(' ', 'T'));
      } catch (_) {
        return null;
      }
    }

    return ProjectStageLogModel(
      id: json['id'] is int
          ? json['id'] as int
          : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      projectId: json['project_id'] is int
          ? json['project_id'] as int
          : int.tryParse(json['project_id']?.toString() ?? '0') ?? 0,
      fromStage: (json['from_stage'] ?? json['previous_stage'])?.toString(),
      toStage: (json['to_stage'] ?? json['new_stage'] ?? json['stage'])?.toString() ?? '',
      changedBy: json['changed_by'] != null
          ? (json['changed_by'] is int
              ? json['changed_by'] as int
              : int.tryParse(json['changed_by']?.toString() ?? '0'))
          : null,
      changedByName: (json['changed_by_name'] ?? json['user_name'] ?? json['name'])?.toString(),
      notes: json['notes']?.toString(),
      createdAt: parseDate(json['created_at']),
    );
  }
}

class ProjectStatsModel {
  final int totalProjects;
  final int inExecution;
  final int subsidyPipeline;
  final int completedHandover;

  ProjectStatsModel({
    this.totalProjects = 0,
    this.inExecution = 0,
    this.subsidyPipeline = 0,
    this.completedHandover = 0,
  });

  factory ProjectStatsModel.fromRows(List<dynamic> rows) {
    int total = 0;
    int inProg = 0;
    int sub = 0;
    int comp = 0;

    for (final r in rows) {
      if (r is Map) {
        final c = (r['count'] is int)
            ? r['count'] as int
            : int.tryParse(r['count']?.toString() ?? '0') ?? 0;
        final stg = r['stage']?.toString() ?? '';
        total += c;

        if (['Installation In Progress', 'Procurement', 'Pre-Install Inspection'].contains(stg)) {
          inProg += c;
        }
        if (['Subsidy Applied', 'Subsidy Received', 'DISCOM Application', 'Commissioning'].contains(stg)) {
          sub += c;
        }
        if (['Handover Done', 'Warranty Period'].contains(stg)) {
          comp += c;
        }
      }
    }

    return ProjectStatsModel(
      totalProjects: total,
      inExecution: inProg,
      subsidyPipeline: sub,
      completedHandover: comp,
    );
  }
}

