class MaterialConsumedItem {
  final String item;
  final dynamic quantity;
  final String unit;
  final int? stockItemId;
  final bool isCustom;

  MaterialConsumedItem({
    required this.item,
    this.quantity = 1,
    this.unit = "Nos",
    this.stockItemId,
    this.isCustom = false,
  });

  factory MaterialConsumedItem.fromJson(Map<String, dynamic> json) {
    return MaterialConsumedItem(
      item: json['item']?.toString() ?? '',
      quantity: json['quantity'] ?? 1,
      unit: json['unit']?.toString() ?? 'Nos',
      stockItemId: json['stock_item_id'] is int
          ? json['stock_item_id']
          : int.tryParse(json['stock_item_id']?.toString() ?? ''),
      isCustom: json['is_custom'] == true || json['is_other'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'item': item,
      'quantity': quantity,
      'unit': unit,
      'stock_item_id': stockItemId,
      'is_custom': isCustom,
    };
  }
}

class InstallationLogPhotoModel {
  final int? id;
  final int? logId;
  final String photoUrl;
  final String? caption;
  final String? photoTag;

  InstallationLogPhotoModel({
    this.id,
    this.logId,
    required this.photoUrl,
    this.caption,
    this.photoTag,
  });

  factory InstallationLogPhotoModel.fromJson(Map<String, dynamic> json) {
    return InstallationLogPhotoModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? ''),
      logId: json['log_id'] is int ? json['log_id'] : int.tryParse(json['log_id']?.toString() ?? ''),
      photoUrl: json['photo_url']?.toString() ?? '',
      caption: json['caption']?.toString(),
      photoTag: json['photo_tag']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      if (logId != null) 'log_id': logId,
      'photo_url': photoUrl,
      if (caption != null) 'caption': caption,
      if (photoTag != null) 'photo_tag': photoTag,
    };
  }
}

class InstallationLogModel {
  final int? id;
  final int? projectId;
  final String? logDate;
  final String? phase;
  final bool isPhaseCompleted;
  final String? workDone;
  final int? workersCount;
  final dynamic hoursWorked;
  final String? supervisorName;
  final String? crewNames;
  final String? materialsUsed;
  final List<MaterialConsumedItem> materialsList;
  final String? issuesFaced;
  final int? progressPercent;
  final String? weather;
  final Map<String, bool>? safetyChecklist;
  final bool supervisorSignoff;
  final String? supervisorSignoffTime;
  final String? signatureData;
  final List<InstallationLogPhotoModel> photos;
  final String? createdAt;

  InstallationLogModel({
    this.id,
    this.projectId,
    this.logDate,
    this.phase,
    this.isPhaseCompleted = false,
    this.workDone,
    this.workersCount,
    this.hoursWorked,
    this.supervisorName,
    this.crewNames,
    this.materialsUsed,
    this.materialsList = const [],
    this.issuesFaced,
    this.progressPercent,
    this.weather,
    this.safetyChecklist,
    this.supervisorSignoff = false,
    this.supervisorSignoffTime,
    this.signatureData,
    this.photos = const [],
    this.createdAt,
  });

  factory InstallationLogModel.fromJson(Map<String, dynamic> json) {
    List<MaterialConsumedItem> parsedMaterials = [];
    if (json['materials_list'] is List) {
      parsedMaterials = (json['materials_list'] as List)
          .whereType<Map<String, dynamic>>()
          .map((m) => MaterialConsumedItem.fromJson(m))
          .toList();
    } else if (json['materials_used'] != null && json['materials_used'].toString().trim().isNotEmpty) {
      parsedMaterials = [
        MaterialConsumedItem(
          item: json['materials_used'].toString(),
          quantity: 1,
          unit: "Nos",
          isCustom: true,
        ),
      ];
    }

    Map<String, bool> parsedSafety = {
      'harness': false,
      'helmet': false,
      'shoes': false,
      'lifeline': false,
    };
    if (json['safety_checklist'] is Map) {
      final sc = json['safety_checklist'] as Map;
      parsedSafety = {
        'harness': sc['harness'] == true || sc['harness'] == 1,
        'helmet': sc['helmet'] == true || sc['helmet'] == 1,
        'shoes': sc['shoes'] == true || sc['shoes'] == 1,
        'lifeline': sc['lifeline'] == true || sc['lifeline'] == 1,
      };
    }

    List<InstallationLogPhotoModel> parsedPhotos = [];
    if (json['photos'] is List) {
      parsedPhotos = (json['photos'] as List)
          .whereType<Map<String, dynamic>>()
          .map((p) => InstallationLogPhotoModel.fromJson(p))
          .toList();
    }

    return InstallationLogModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? ''),
      projectId: json['project_id'] is int ? json['project_id'] : int.tryParse(json['project_id']?.toString() ?? ''),
      logDate: json['log_date']?.toString(),
      phase: json['phase']?.toString(),
      isPhaseCompleted: json['is_phase_completed'] == 1 || json['is_phase_completed'] == true,
      workDone: json['work_done']?.toString(),
      workersCount: json['workers_count'] is int ? json['workers_count'] : int.tryParse(json['workers_count']?.toString() ?? '0'),
      hoursWorked: json['hours_worked'],
      supervisorName: json['supervisor_name']?.toString(),
      crewNames: json['crew_names']?.toString(),
      materialsUsed: json['materials_used']?.toString(),
      materialsList: parsedMaterials,
      issuesFaced: json['issues_faced']?.toString(),
      progressPercent: json['progress_percent'] is int ? json['progress_percent'] : int.tryParse(json['progress_percent']?.toString() ?? '0'),
      weather: json['weather']?.toString() ?? 'Sunny / Clear',
      safetyChecklist: parsedSafety,
      supervisorSignoff: json['supervisor_signoff'] == 1 || json['supervisor_signoff'] == true,
      supervisorSignoffTime: json['supervisor_signoff_time']?.toString(),
      signatureData: json['signature_data']?.toString(),
      photos: parsedPhotos,
      createdAt: json['created_at']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      if (projectId != null) 'project_id': projectId,
      if (logDate != null) 'log_date': logDate,
      if (phase != null) 'phase': phase,
      'is_phase_completed': isPhaseCompleted ? 1 : 0,
      if (workDone != null) 'work_done': workDone,
      if (workersCount != null) 'workers_count': workersCount,
      if (hoursWorked != null) 'hours_worked': hoursWorked,
      if (supervisorName != null) 'supervisor_name': supervisorName,
      if (crewNames != null) 'crew_names': crewNames,
      if (materialsUsed != null) 'materials_used': materialsUsed,
      'materials_list': materialsList.map((m) => m.toJson()).toList(),
      if (issuesFaced != null) 'issues_faced': issuesFaced,
      if (progressPercent != null) 'progress_percent': progressPercent,
      if (weather != null) 'weather': weather,
      if (safetyChecklist != null) 'safety_checklist': safetyChecklist,
      'supervisor_signoff': supervisorSignoff ? 1 : 0,
      if (supervisorSignoffTime != null) 'supervisor_signoff_time': supervisorSignoffTime,
      if (signatureData != null) 'signature_data': signatureData,
    };
  }
}

