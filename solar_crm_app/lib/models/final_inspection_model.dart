import 'dart:convert';

class FinalInspectionModel {
  final int? id;
  final int? projectId;
  final String? installationQuality;
  final Map<String, dynamic>? structureChecklist;
  final String? safetyCompliance;
  final Map<String, dynamic>? electricalChecklist;
  final Map<String, dynamic>? inverterEarthingChecklist;
  final String? documentVerification;
  final Map<String, dynamic>? documentsChecklist;
  final String? performanceTesting;
  final String? inspectorName;
  final String? inspectorType;
  final String? inspectionDate;
  final String? inspectionStatus;
  final String? correctionsNeeded;
  final String? reworkStatus;
  final String? reinspectionDate;
  final String? certificateNumber;
  final String? remarks;
  final String? inspectionPhotos;
  final String? customerSignatureName;
  final bool customerAcknowledged;
  final bool inspectorSignoff;
  final String? signatureData;

  FinalInspectionModel({
    this.id,
    this.projectId,
    this.installationQuality,
    this.structureChecklist,
    this.safetyCompliance,
    this.electricalChecklist,
    this.inverterEarthingChecklist,
    this.documentVerification,
    this.documentsChecklist,
    this.performanceTesting,
    this.inspectorName,
    this.inspectorType,
    this.inspectionDate,
    this.inspectionStatus,
    this.correctionsNeeded,
    this.reworkStatus,
    this.reinspectionDate,
    this.certificateNumber,
    this.remarks,
    this.inspectionPhotos,
    this.customerSignatureName,
    this.customerAcknowledged = false,
    this.inspectorSignoff = false,
    this.signatureData,
  });

  factory FinalInspectionModel.fromJson(Map<String, dynamic> json) {
    bool parseBool(dynamic v) {
      if (v == null) return false;
      if (v is bool) return v;
      if (v is num) return v == 1;
      final str = v.toString().toLowerCase();
      return str == '1' || str == 'true';
    }

    Map<String, dynamic>? parseMap(dynamic v) {
      if (v == null) return null;
      if (v is Map) return Map<String, dynamic>.from(v);
      if (v is String && v.trim().isNotEmpty) {
        try {
          final decoded = jsonDecode(v);
          if (decoded is Map) return Map<String, dynamic>.from(decoded);
        } catch (_) {}
      }
      return null;
    }

    return FinalInspectionModel(
      id: json['id'] is num ? (json['id'] as num).toInt() : int.tryParse(json['id']?.toString() ?? ''),
      projectId: json['project_id'] is num ? (json['project_id'] as num).toInt() : int.tryParse(json['project_id']?.toString() ?? ''),
      installationQuality: json['installation_quality']?.toString(),
      structureChecklist: parseMap(json['structure_checklist']),
      safetyCompliance: json['safety_compliance']?.toString(),
      electricalChecklist: parseMap(json['electrical_checklist']),
      inverterEarthingChecklist: parseMap(json['inverter_earthing_checklist']),
      documentVerification: json['document_verification']?.toString(),
      documentsChecklist: parseMap(json['documents_checklist']),
      performanceTesting: json['performance_testing']?.toString(),
      inspectorName: json['inspector_name']?.toString(),
      inspectorType: json['inspector_type']?.toString(),
      inspectionDate: json['inspection_date']?.toString(),
      inspectionStatus: json['inspection_status']?.toString(),
      correctionsNeeded: json['corrections_needed']?.toString(),
      reworkStatus: json['rework_status']?.toString(),
      reinspectionDate: json['reinspection_date']?.toString(),
      certificateNumber: json['certificate_number']?.toString(),
      remarks: json['remarks']?.toString(),
      inspectionPhotos: json['inspection_photos']?.toString(),
      customerSignatureName: json['customer_signature_name']?.toString(),
      customerAcknowledged: parseBool(json['customer_acknowledged']),
      inspectorSignoff: parseBool(json['inspector_signoff']),
      signatureData: json['signature_data']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'installation_quality': installationQuality,
      'structure_checklist': structureChecklist,
      'safety_compliance': safetyCompliance,
      'electrical_checklist': electricalChecklist,
      'inverter_earthing_checklist': inverterEarthingChecklist,
      'document_verification': documentVerification,
      'documents_checklist': documentsChecklist,
      'performance_testing': performanceTesting,
      'inspector_name': inspectorName,
      'inspector_type': inspectorType,
      'inspection_date': inspectionDate,
      'inspection_status': inspectionStatus,
      'corrections_needed': correctionsNeeded,
      'rework_status': reworkStatus,
      'reinspection_date': reinspectionDate,
      'certificate_number': certificateNumber,
      'remarks': remarks,
      'inspection_photos': inspectionPhotos,
      'customer_signature_name': customerSignatureName,
      'customer_acknowledged': customerAcknowledged ? 1 : 0,
      'inspector_signoff': inspectorSignoff ? 1 : 0,
      'signature_data': signatureData,
    };
  }
}
