import 'dart:convert';

class CustomerHandoverModel {
  final int? id;
  final int? projectId;
  final String? trainingCompleted;
  final String? appDemoCompleted;
  final bool monitoringAppAccessShared;
  final bool emergencyContactGiven;
  final bool operationManual;
  final bool warrantyCard;
  final bool maintenanceSchedule;
  final bool inverterManual;
  final List<Map<String, dynamic>>? documentsPackChecklist;
  final String? handoverDate;
  final String? handoverManager;
  final String? warrantyStartDate;
  final int moduleWarrantyYears;
  final String? moduleWarrantyEnd;
  final int inverterWarrantyYears;
  final String? inverterWarrantyEnd;
  final int workmanshipWarrantyYears;
  final String? workmanshipWarrantyEnd;
  final int amcWarrantyYears;
  final String? amcWarrantyEnd;
  final String? firstServiceDueDate;
  final bool customerSignature;
  final String? signedDocketUrl;
  final String? signatureSignatoryName;
  final String? signaturePhone;
  final String? handoverPhotoUrl;
  final String? customerFeedback;
  final int customerRating;
  final String? reviewToken;
  final String? reviewStatus;
  final String? reviewSubmittedAt;
  final String? customerReviewerName;
  final String? handoverStatus;
  final String? remarks;
  final String? signatureData;
  final double? contractValue;
  final double? amountPaid;
  final double? balanceDue;
  final String? paymentStatus;

  CustomerHandoverModel({
    this.id,
    this.projectId,
    this.trainingCompleted,
    this.appDemoCompleted,
    this.monitoringAppAccessShared = false,
    this.emergencyContactGiven = false,
    this.operationManual = false,
    this.warrantyCard = false,
    this.maintenanceSchedule = false,
    this.inverterManual = false,
    this.documentsPackChecklist,
    this.handoverDate,
    this.handoverManager,
    this.warrantyStartDate,
    this.moduleWarrantyYears = 25,
    this.moduleWarrantyEnd,
    this.inverterWarrantyYears = 5,
    this.inverterWarrantyEnd,
    this.workmanshipWarrantyYears = 5,
    this.workmanshipWarrantyEnd,
    this.amcWarrantyYears = 1,
    this.amcWarrantyEnd,
    this.firstServiceDueDate,
    this.customerSignature = false,
    this.signedDocketUrl,
    this.signatureSignatoryName,
    this.signaturePhone,
    this.handoverPhotoUrl,
    this.customerFeedback,
    this.customerRating = 0,
    this.reviewToken,
    this.reviewStatus,
    this.reviewSubmittedAt,
    this.customerReviewerName,
    this.handoverStatus = 'Pending',
    this.remarks,
    this.signatureData,
    this.contractValue,
    this.amountPaid,
    this.balanceDue,
    this.paymentStatus,
  });

  factory CustomerHandoverModel.fromJson(Map<String, dynamic> json) {
    bool parseBool(dynamic v) {
      if (v == null) return false;
      if (v is bool) return v;
      if (v is num) return v == 1;
      final str = v.toString().toLowerCase();
      return str == '1' || str == 'true';
    }

    double? parseDouble(dynamic v) {
      if (v == null) return null;
      if (v is num) return v.toDouble();
      return double.tryParse(v.toString());
    }

    int parseInt(dynamic v, int fallback) {
      if (v == null) return fallback;
      if (v is num) return v.toInt();
      return int.tryParse(v.toString()) ?? fallback;
    }

    List<Map<String, dynamic>>? parseChecklist(dynamic v) {
      if (v == null) return null;
      if (v is List) {
        return v.map((item) => Map<String, dynamic>.from(item as Map)).toList();
      }
      if (v is String && v.trim().isNotEmpty) {
        try {
          final decoded = jsonDecode(v);
          if (decoded is List) {
            return decoded.map((item) => Map<String, dynamic>.from(item as Map)).toList();
          }
        } catch (_) {}
      }
      return null;
    }

    return CustomerHandoverModel(
      id: json['id'] is num ? (json['id'] as num).toInt() : int.tryParse(json['id']?.toString() ?? ''),
      projectId: json['project_id'] is num ? (json['project_id'] as num).toInt() : int.tryParse(json['project_id']?.toString() ?? ''),
      trainingCompleted: json['training_completed']?.toString(),
      appDemoCompleted: json['app_demo_completed']?.toString(),
      monitoringAppAccessShared: parseBool(json['monitoring_app_access_shared']),
      emergencyContactGiven: parseBool(json['emergency_contact_given']),
      operationManual: parseBool(json['operation_manual']),
      warrantyCard: parseBool(json['warranty_card']),
      maintenanceSchedule: parseBool(json['maintenance_schedule']),
      inverterManual: parseBool(json['inverter_manual']),
      documentsPackChecklist: parseChecklist(json['documents_pack_checklist']),
      handoverDate: json['handover_date']?.toString(),
      handoverManager: json['handover_manager']?.toString(),
      warrantyStartDate: json['warranty_start_date']?.toString(),
      moduleWarrantyYears: parseInt(json['module_warranty_years'], 25),
      moduleWarrantyEnd: json['module_warranty_end']?.toString(),
      inverterWarrantyYears: parseInt(json['inverter_warranty_years'], 5),
      inverterWarrantyEnd: json['inverter_warranty_end']?.toString(),
      workmanshipWarrantyYears: parseInt(json['workmanship_warranty_years'], 5),
      workmanshipWarrantyEnd: json['workmanship_warranty_end']?.toString(),
      amcWarrantyYears: parseInt(json['amc_warranty_years'], 1),
      amcWarrantyEnd: json['amc_warranty_end']?.toString(),
      firstServiceDueDate: json['first_service_due_date']?.toString(),
      customerSignature: parseBool(json['customer_signature']),
      signedDocketUrl: json['signed_docket_url']?.toString(),
      signatureSignatoryName: json['signature_signatory_name']?.toString(),
      signaturePhone: json['signature_phone']?.toString(),
      handoverPhotoUrl: json['handover_photo_url']?.toString(),
      customerFeedback: json['customer_feedback']?.toString(),
      customerRating: parseInt(json['customer_rating'], 0),
      reviewToken: json['review_token']?.toString(),
      reviewStatus: json['review_status']?.toString(),
      reviewSubmittedAt: json['review_submitted_at']?.toString(),
      customerReviewerName: json['customer_reviewer_name']?.toString(),
      handoverStatus: json['handover_status']?.toString() ?? 'Pending',
      remarks: json['remarks']?.toString(),
      signatureData: json['signature_data']?.toString(),
      contractValue: parseDouble(json['contract_value']),
      amountPaid: parseDouble(json['amount_paid']),
      balanceDue: parseDouble(json['balance_due']),
      paymentStatus: json['payment_status']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'training_completed': trainingCompleted,
      'app_demo_completed': appDemoCompleted,
      'monitoring_app_access_shared': monitoringAppAccessShared ? 1 : 0,
      'emergency_contact_given': emergencyContactGiven ? 1 : 0,
      'operation_manual': operationManual ? 1 : 0,
      'warranty_card': warrantyCard ? 1 : 0,
      'maintenance_schedule': maintenanceSchedule ? 1 : 0,
      'inverter_manual': inverterManual ? 1 : 0,
      'documents_pack_checklist': documentsPackChecklist,
      'handover_date': handoverDate,
      'handover_manager': handoverManager,
      'warranty_start_date': warrantyStartDate,
      'module_warranty_years': moduleWarrantyYears,
      'module_warranty_end': moduleWarrantyEnd,
      'inverter_warranty_years': inverterWarrantyYears,
      'inverter_warranty_end': inverterWarrantyEnd,
      'workmanship_warranty_years': workmanshipWarrantyYears,
      'workmanship_warranty_end': workmanshipWarrantyEnd,
      'amc_warranty_years': amcWarrantyYears,
      'amc_warranty_end': amcWarrantyEnd,
      'first_service_due_date': firstServiceDueDate,
      'customer_signature': customerSignature ? 1 : 0,
      'signed_docket_url': signedDocketUrl,
      'signature_signatory_name': signatureSignatoryName,
      'signature_phone': signaturePhone,
      'handover_photo_url': handoverPhotoUrl,
      'customer_feedback': customerFeedback,
      'customer_rating': customerRating,
      'review_token': reviewToken,
      'review_status': reviewStatus,
      'review_submitted_at': reviewSubmittedAt,
      'customer_reviewer_name': customerReviewerName,
      'handover_status': handoverStatus,
      'remarks': remarks,
      'signature_data': signatureData,
      'contract_value': contractValue,
      'amount_paid': amountPaid,
      'balance_due': balanceDue,
      'payment_status': paymentStatus,
    };
  }
}

