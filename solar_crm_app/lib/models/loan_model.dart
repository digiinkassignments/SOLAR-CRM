import 'package:flutter/material.dart';

class LoanItemModel {
  final int id;
  final int leadId;
  final int? projectId;
  final String customerName;
  final String? customerPhone;
  final String? customerEmail;
  final String? city;
  final String? state;
  final String bankName;
  final String? bankBranch;
  final String? bankIfsc;
  final String? portalApplicationNo;
  final String loanStage;
  final String sideStatus;
  final String? rejectionReason;
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

  LoanItemModel({
    required this.id,
    required this.leadId,
    this.projectId,
    required this.customerName,
    this.customerPhone,
    this.customerEmail,
    this.city,
    this.state,
    required this.bankName,
    this.bankBranch,
    this.bankIfsc,
    this.portalApplicationNo,
    this.loanStage = 'Eligibility & Docs',
    this.sideStatus = 'Active',
    this.rejectionReason,
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

    return LoanItemModel(
      id: parseInt(json['id'], 0),
      leadId: parseInt(json['lead_id'], 0),
      projectId: json['project_id'] != null ? parseInt(json['project_id'], 0) : null,
      customerName: json['customer_name']?.toString() ?? 'Solar Customer',
      customerPhone: json['customer_phone']?.toString(),
      customerEmail: json['customer_email']?.toString(),
      city: json['city']?.toString(),
      state: json['state']?.toString(),
      bankName: json['bank_name']?.toString() ?? 'State Bank of India (SBI)',
      bankBranch: json['bank_branch']?.toString(),
      bankIfsc: json['bank_ifsc']?.toString(),
      portalApplicationNo: json['portal_application_no']?.toString(),
      loanStage: json['loan_stage']?.toString() ?? 'Eligibility & Docs',
      sideStatus: json['side_status']?.toString() ?? 'Active',
      rejectionReason: json['rejection_reason']?.toString(),
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
