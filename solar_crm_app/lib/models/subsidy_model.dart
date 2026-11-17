import 'package:flutter/material.dart';

class SubsidyItemModel {
  final int? id;
  final int leadId;
  final String customerName;
  final String? customerPhone;
  final String? consumerNumber;
  final String? discom;
  final double plantCapacity;
  final double calculatedSubsidy;
  final String stage;
  final String? portalAckNo;
  final String? discomApplicationNo;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  SubsidyItemModel({
    this.id,
    required this.leadId,
    required this.customerName,
    this.customerPhone,
    this.consumerNumber,
    this.discom,
    this.plantCapacity = 3.0,
    this.calculatedSubsidy = 78000.0,
    this.stage = 'registered',
    this.portalAckNo,
    this.discomApplicationNo,
    this.createdAt,
    this.updatedAt,
  });

  // 9 Portal Stages
  static const Map<String, Map<String, dynamic>> stageMeta = {
    'registered': {
      'step': 1,
      'label': '1. Registered',
      'owner': 'Your Team',
      'color': Color(0xFF2563EB),
      'bg': Color(0xFFEFF6FF),
      'expectedDays': 2,
    },
    'feasibility_approved': {
      'step': 2,
      'label': '2. Feasibility Approved',
      'owner': 'DISCOM',
      'color': Color(0xFF7C3AED),
      'bg': Color(0xFFF5F3FF),
      'expectedDays': 7,
    },
    'vendor_selected': {
      'step': 3,
      'label': '3. Vendor Selected',
      'owner': 'Customer',
      'color': Color(0xFFD97706),
      'bg': Color(0xFFFEF3C7),
      'expectedDays': 3,
    },
    'agreement_uploaded': {
      'step': 4,
      'label': '4. Agreement Uploaded',
      'owner': 'Your Team',
      'color': Color(0xFF0284C7),
      'bg': Color(0xFFF0F9FF),
      'expectedDays': 2,
    },
    'installed_docs_uploaded': {
      'step': 5,
      'label': '5. Installed & Uploaded',
      'owner': 'Your Team',
      'color': Color(0xFF0D9488),
      'bg': Color(0xFFCCFBF1),
      'expectedDays': 10,
    },
    'net_meter_applied': {
      'step': 6,
      'label': '6. Net Meter Applied',
      'owner': 'DISCOM',
      'color': Color(0xFFEA580C),
      'bg': Color(0xFFFFF7ED),
      'expectedDays': 15,
    },
    'commissioning_issued': {
      'step': 7,
      'label': '7. Commissioning Issued',
      'owner': 'DISCOM',
      'color': Color(0xFF16A34A),
      'bg': Color(0xFFF0FDF4),
      'expectedDays': 7,
    },
    'bank_details_submitted': {
      'step': 8,
      'label': '8. Bank Details Submitted',
      'owner': 'Your Team',
      'color': Color(0xFF059669),
      'bg': Color(0xFFECFDF5),
      'expectedDays': 2,
    },
    'subsidy_credited': {
      'step': 9,
      'label': '9. Subsidy Credited',
      'owner': 'Government',
      'color': Color(0xFF047857),
      'bg': Color(0xFFD1FAE5),
      'expectedDays': 30,
    },
    'disbursed': {
      'step': 9,
      'label': '9. Subsidy Credited',
      'owner': 'Government',
      'color': Color(0xFF047857),
      'bg': Color(0xFFD1FAE5),
      'expectedDays': 30,
    },
    'rejected': {
      'step': 0,
      'label': 'Rejected by Portal',
      'owner': 'Your Team',
      'color': Color(0xFFDC2626),
      'bg': Color(0xFFFEF2F2),
      'expectedDays': 5,
    },
  };

  Map<String, dynamic> get stageInfo {
    final key = stage.toLowerCase().replaceAll(' ', '_');
    return stageMeta[key] ?? {
      'step': 1,
      'label': stage,
      'owner': 'Your Team',
      'color': const Color(0xFF64748B),
      'bg': const Color(0xFFF1F5F9),
      'expectedDays': 5,
    };
  }

  factory SubsidyItemModel.fromJson(Map<String, dynamic> json) {
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

    return SubsidyItemModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? ''),
      leadId: json['lead_id'] is int ? json['lead_id'] : int.tryParse(json['lead_id']?.toString() ?? '0') ?? 0,
      customerName: json['customer_name']?.toString() ?? json['name']?.toString() ?? 'Solar Customer',
      customerPhone: json['customer_phone']?.toString() ?? json['phone']?.toString(),
      consumerNumber: json['consumer_number']?.toString(),
      discom: json['discom']?.toString() ?? 'JVVNL',
      plantCapacity: parseDouble(json['plant_capacity'] ?? json['system_capacity_kw'], 3.0),
      calculatedSubsidy: parseDouble(json['calculated_subsidy'] ?? json['subsidy_amount'], 78000.0),
      stage: json['stage']?.toString() ?? json['portal_status']?.toString() ?? 'registered',
      portalAckNo: json['portal_ack_no']?.toString() ?? json['application_number']?.toString(),
      discomApplicationNo: json['discom_application_no']?.toString(),
      createdAt: parseDate(json['created_at']),
      updatedAt: parseDate(json['updated_at']),
    );
  }
}

class SubsidyDocumentModel {
  final int id;
  final int leadId;
  final String docType;
  final String? fileName;
  final String fileUrl;
  final String verificationStatus;
  final String? rejectionReason;
  final DateTime? uploadedAt;

  SubsidyDocumentModel({
    required this.id,
    required this.leadId,
    required this.docType,
    this.fileName,
    required this.fileUrl,
    this.verificationStatus = 'Pending',
    this.rejectionReason,
    this.uploadedAt,
  });

  String getFullFileUrl(String baseApiUrl) {
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }
    String clean = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
    if (!clean.startsWith('uploads/')) {
      clean = 'uploads/documents/$clean';
    }
    final origin = baseApiUrl.replaceAll(RegExp(r'/api/?$'), '');
    return "$origin/$clean";
  }

  factory SubsidyDocumentModel.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic d) {
      if (d == null) return null;
      try {
        return DateTime.parse(d.toString());
      } catch (_) {
        return null;
      }
    }

    return SubsidyDocumentModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      leadId: json['lead_id'] is int ? json['lead_id'] : int.tryParse(json['lead_id']?.toString() ?? '0') ?? 0,
      docType: json['doc_type']?.toString() ?? json['document_type']?.toString() ?? 'other',
      fileName: json['file_name']?.toString(),
      fileUrl: json['file_url']?.toString() ?? json['file_path']?.toString() ?? '',
      verificationStatus: json['verification_status']?.toString() ?? 'Pending',
      rejectionReason: json['rejection_reason']?.toString(),
      uploadedAt: parseDate(json['uploaded_at'] ?? json['created_at']),
    );
  }
}
