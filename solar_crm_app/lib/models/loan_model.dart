import 'package:flutter/material.dart';

class LoanDocumentModel {
  final int id;
  final int loanId;
  final int? leadId;
  final String docType;
  final String? fileName;
  final String fileUrl;
  final String verificationStatus;
  final DateTime? uploadedAt;

  LoanDocumentModel({
    required this.id,
    required this.loanId,
    this.leadId,
    required this.docType,
    this.fileName,
    required this.fileUrl,
    this.verificationStatus = 'Pending',
    this.uploadedAt,
  });

  factory LoanDocumentModel.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(dynamic d) {
      if (d == null) return null;
      try {
        return DateTime.parse(d.toString());
      } catch (_) {
        return null;
      }
    }

    int parseInt(dynamic v, int fallback) {
      if (v == null) return fallback;
      if (v is int) return v;
      return int.tryParse(v.toString()) ?? fallback;
    }

    return LoanDocumentModel(
      id: parseInt(json['id'], 0),
      loanId: parseInt(json['loan_id'], 0),
      leadId: json['lead_id'] != null ? parseInt(json['lead_id'], 0) : null,
      docType: json['doc_type']?.toString() ?? 'Document',
      fileName: json['file_name']?.toString(),
      fileUrl: json['file_url']?.toString() ?? '',
      verificationStatus: json['verification_status']?.toString() ?? 'Pending',
      uploadedAt: parseDate(json['uploaded_at']),
    );
  }

  String getFullFileUrl(String baseUrl) {
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }
    final cleanBase = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
    final cleanPath = fileUrl.startsWith('/') ? fileUrl : '/$fileUrl';
    return '$cleanBase$cleanPath';
  }
}

class LoanItemModel {
  final int id;
  final int leadId;
  final int? projectId;
  final String? projectNumber;
  final String customerName;
  final String? customerPhone;
  final String? customerEmail;
  final String? city;
  final String? state;
  final String bankName;
  final String? bankBranch;
  final String? bankIfsc;
  final String? bankDsaName;
  final String? bankDsaPhone;
  final String? portalApplicationNo;
  final String loanStage;
  final String sideStatus;
  final String? rejectionReason;
  final String? stoppedAtStage;
  final String? backwardReason;
  final bool subsidyCreditedToLoan;
  final String? sanctionLetterUrl;
  final String? internalNotes;
  final double systemCapacityKw;
  final double totalProjectCost;
  final double subsidyExpected;
  final double downPaymentAmount;
  final double loanAmountApplied;
  final double sanctionedAmount;
  final double disbursedAmount;
  final double interestRate;
  final int tenureMonths;
  final double monthlyEmi;
  final DateTime? appliedDate;
  final DateTime? sanctionDate;
  final DateTime? disbursalDate;
  final DateTime? createdAt;
  final List<LoanDocumentModel> documents;

  LoanItemModel({
    required this.id,
    required this.leadId,
    this.projectId,
    this.projectNumber,
    required this.customerName,
    this.customerPhone,
    this.customerEmail,
    this.city,
    this.state,
    required this.bankName,
    this.bankBranch,
    this.bankIfsc,
    this.bankDsaName,
    this.bankDsaPhone,
    this.portalApplicationNo,
    this.loanStage = 'Eligibility & Docs',
    this.sideStatus = 'Active',
    this.rejectionReason,
    this.stoppedAtStage,
    this.backwardReason,
    this.subsidyCreditedToLoan = false,
    this.sanctionLetterUrl,
    this.internalNotes,
    this.systemCapacityKw = 3.0,
    this.totalProjectCost = 0.0,
    this.subsidyExpected = 78000.0,
    this.downPaymentAmount = 0.0,
    this.loanAmountApplied = 0.0,
    this.sanctionedAmount = 0.0,
    this.disbursedAmount = 0.0,
    this.interestRate = 7.0,
    this.tenureMonths = 60,
    this.monthlyEmi = 0.0,
    this.appliedDate,
    this.sanctionDate,
    this.disbursalDate,
    this.createdAt,
    this.documents = const [],
  });

  // 5 Loan Stages Configuration
  static const Map<String, Map<String, dynamic>> stageConfig = {
    'Eligibility & Docs': {
      'step': 1,
      'color': Color(0xFF6366F1),
      'bg': Color(0xFFEEF2FF),
      'percent': 0.20,
    },
    'Applied': {
      'step': 2,
      'color': Color(0xFF0284C7),
      'bg': Color(0xFFF0F9FF),
      'percent': 0.40,
    },
    'Under Review': {
      'step': 3,
      'color': Color(0xFFD97706),
      'bg': Color(0xFFFFFBEB),
      'percent': 0.60,
    },
    'Sanctioned': {
      'step': 4,
      'color': Color(0xFF16A34A),
      'bg': Color(0xFFDCFCE7),
      'percent': 0.80,
    },
    'Disbursed': {
      'step': 5,
      'color': Color(0xFF059669),
      'bg': Color(0xFFD1FAE5),
      'percent': 1.0,
    },
  };

  Map<String, dynamic> get stageMeta {
    return stageConfig[loanStage] ?? {
      'step': 1,
      'color': const Color(0xFF64748B),
      'bg': const Color(0xFFF1F5F9),
      'percent': 0.20,
    };
  }

  bool get isSideStatusActive => sideStatus == 'Active';
  bool get isRejected => sideStatus == 'Rejected';
  bool get isWithdrawn => sideStatus == 'Withdrawn';

  factory LoanItemModel.fromJson(Map<String, dynamic> json) {
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

    List<LoanDocumentModel> parsedDocs = [];
    if (json['documents'] is List) {
      parsedDocs = (json['documents'] as List)
          .map((d) => LoanDocumentModel.fromJson(d as Map<String, dynamic>))
          .toList();
    }

    return LoanItemModel(
      id: parseInt(json['id'], 0),
      leadId: parseInt(json['lead_id'], 0),
      projectId: json['project_id'] != null ? parseInt(json['project_id'], 0) : null,
      projectNumber: json['project_number']?.toString(),
      customerName: json['customer_name']?.toString() ?? json['lead_customer_name']?.toString() ?? json['lead_name']?.toString() ?? 'Solar Customer',
      customerPhone: json['customer_phone']?.toString() ?? json['lead_phone']?.toString(),
      customerEmail: json['customer_email']?.toString() ?? json['lead_email']?.toString(),
      city: json['city']?.toString() ?? json['lead_city']?.toString(),
      state: json['state']?.toString() ?? json['lead_state']?.toString(),
      bankName: json['bank_name']?.toString() ?? 'State Bank of India (SBI)',
      bankBranch: json['bank_branch']?.toString(),
      bankIfsc: json['bank_ifsc']?.toString(),
      bankDsaName: json['bank_dsa_name']?.toString(),
      bankDsaPhone: json['bank_dsa_phone']?.toString(),
      portalApplicationNo: json['portal_application_no']?.toString(),
      loanStage: json['loan_stage']?.toString() ?? 'Eligibility & Docs',
      sideStatus: json['side_status']?.toString() ?? 'Active',
      rejectionReason: json['rejection_reason']?.toString(),
      stoppedAtStage: json['stopped_at_stage']?.toString(),
      backwardReason: json['backward_reason']?.toString(),
      subsidyCreditedToLoan: json['subsidy_credited_to_loan'] == 1 || json['subsidy_credited_to_loan'] == true,
      sanctionLetterUrl: json['sanction_letter_url']?.toString(),
      internalNotes: json['internal_notes']?.toString(),
      systemCapacityKw: parseDouble(json['system_capacity_kw'], 3.0),
      totalProjectCost: parseDouble(json['total_project_cost'], 0.0),
      subsidyExpected: parseDouble(json['subsidy_expected'], 78000.0),
      downPaymentAmount: parseDouble(json['down_payment_amount'], 0.0),
      loanAmountApplied: parseDouble(json['loan_amount_applied'], 0.0),
      sanctionedAmount: parseDouble(json['sanctioned_amount'], 0.0),
      disbursedAmount: parseDouble(json['disbursed_amount'], 0.0),
      interestRate: parseDouble(json['interest_rate'], 7.0),
      tenureMonths: parseInt(json['tenure_months'], 60),
      monthlyEmi: parseDouble(json['monthly_emi'], 0.0),
      appliedDate: parseDate(json['applied_date']),
      sanctionDate: parseDate(json['sanction_date']),
      disbursalDate: parseDate(json['disbursal_date']),
      createdAt: parseDate(json['created_at']),
      documents: parsedDocs,
    );
  }
}

class LoanStatsModel {
  final int totalLoans;
  final int inProcessLoans;
  final int sanctionedLoans;
  final int disbursedLoans;
  final int rejectedLoans;
  final double totalDisbursedAmount;
  final double totalAppliedAmount;

  LoanStatsModel({
    this.totalLoans = 0,
    this.inProcessLoans = 0,
    this.sanctionedLoans = 0,
    this.disbursedLoans = 0,
    this.rejectedLoans = 0,
    this.totalDisbursedAmount = 0.0,
    this.totalAppliedAmount = 0.0,
  });

  factory LoanStatsModel.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic v) => v is int ? v : int.tryParse(v?.toString() ?? '0') ?? 0;
    double parseDouble(dynamic v) => v is num ? v.toDouble() : double.tryParse(v?.toString() ?? '0.0') ?? 0.0;

    return LoanStatsModel(
      totalLoans: parseInt(json['total_loans']),
      inProcessLoans: parseInt(json['in_process_loans']),
      sanctionedLoans: parseInt(json['sanctioned_loans']),
      disbursedLoans: parseInt(json['disbursed_loans']),
      rejectedLoans: parseInt(json['rejected_loans']),
      totalDisbursedAmount: parseDouble(json['total_disbursed_amount']),
      totalAppliedAmount: parseDouble(json['total_applied_amount']),
    );
  }
}

