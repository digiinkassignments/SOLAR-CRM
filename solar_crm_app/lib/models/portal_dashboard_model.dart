class PortalAttentionItem {
  final int id;
  final String reference;
  final String customerName;
  final double amount;
  final String? date;
  final String status;

  PortalAttentionItem({
    required this.id,
    required this.reference,
    required this.customerName,
    required this.amount,
    this.date,
    required this.status,
  });

  factory PortalAttentionItem.fromJson(Map<String, dynamic> json) {
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

    return PortalAttentionItem(
      id: parseInt(json['id']),
      reference: json['reference']?.toString() ?? '',
      customerName: json['customer_name']?.toString() ?? 'Customer',
      amount: parseDouble(json['amount']),
      date: json['date']?.toString(),
      status: json['status']?.toString() ?? 'Pending',
    );
  }
}

class PortalStageBreakdown {
  final String label;
  final int count;

  PortalStageBreakdown({
    required this.label,
    required this.count,
  });

  factory PortalStageBreakdown.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic val) {
      if (val == null) return 0;
      if (val is int) return val;
      return int.tryParse(val.toString()) ?? 0;
    }

    return PortalStageBreakdown(
      label: json['label']?.toString() ?? '',
      count: parseInt(json['count']),
    );
  }
}

class PortalDashboardModel {
  final String role;
  final String? updatedAt;

  // Finance Metrics
  final int totalInvoices;
  final double invoiced;
  final double paid;
  final double due;
  final int quotations;
  final int customers;
  final int stockItems;
  final double stockValue;
  final int lowStock;

  // Application Manager Metrics
  final int applications;
  final int credited;
  final int rejected;
  final double expected;
  final double received;
  final int loans;
  final int activeLoans;
  final double loanDisbursed;

  // Attention & Breakdown
  final List<PortalAttentionItem> attention;
  final List<PortalStageBreakdown> breakdown;

  PortalDashboardModel({
    required this.role,
    this.updatedAt,
    this.totalInvoices = 0,
    this.invoiced = 0.0,
    this.paid = 0.0,
    this.due = 0.0,
    this.quotations = 0,
    this.customers = 0,
    this.stockItems = 0,
    this.stockValue = 0.0,
    this.lowStock = 0,
    this.applications = 0,
    this.credited = 0,
    this.rejected = 0,
    this.expected = 0.0,
    this.received = 0.0,
    this.loans = 0,
    this.activeLoans = 0,
    this.loanDisbursed = 0.0,
    this.attention = const [],
    this.breakdown = const [],
  });

  bool get isFinance => role.toLowerCase() == 'finance';
  bool get isApplicationManager =>
      role.toLowerCase() == 'application manager' ||
      role.toLowerCase() == 'application-manager';

  int get totalBreakdownCount =>
      breakdown.fold<int>(0, (sum, item) => sum + item.count);

  factory PortalDashboardModel.fromJson(Map<String, dynamic> json) {
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

    final role = json['role']?.toString() ?? '';
    final metrics = json['metrics'] is Map<String, dynamic>
        ? json['metrics'] as Map<String, dynamic>
        : <String, dynamic>{};

    final attentionList = json['attention'] is List
        ? (json['attention'] as List)
            .map((item) => PortalAttentionItem.fromJson(item as Map<String, dynamic>))
            .toList()
        : <PortalAttentionItem>[];

    final breakdownList = json['breakdown'] is List
        ? (json['breakdown'] as List)
            .map((item) => PortalStageBreakdown.fromJson(item as Map<String, dynamic>))
            .toList()
        : <PortalStageBreakdown>[];

    return PortalDashboardModel(
      role: role,
      updatedAt: json['updated_at']?.toString(),
      // Finance metrics
      totalInvoices: parseInt(metrics['total_invoices']),
      invoiced: parseDouble(metrics['invoiced']),
      paid: parseDouble(metrics['paid']),
      due: parseDouble(metrics['due']),
      quotations: parseInt(metrics['quotations']),
      customers: parseInt(metrics['customers']),
      stockItems: parseInt(metrics['stock_items']),
      stockValue: parseDouble(metrics['stock_value']),
      lowStock: parseInt(metrics['low_stock']),
      // Application Manager metrics
      applications: parseInt(metrics['applications']),
      credited: parseInt(metrics['credited']),
      rejected: parseInt(metrics['rejected']),
      expected: parseDouble(metrics['expected']),
      received: parseDouble(metrics['received']),
      loans: parseInt(metrics['loans']),
      activeLoans: parseInt(metrics['active_loans']),
      loanDisbursed: parseDouble(metrics['loan_disbursed']),
      // Attention and breakdown
      attention: attentionList,
      breakdown: breakdownList,
    );
  }
}

