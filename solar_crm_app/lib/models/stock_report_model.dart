class StockCategoryBreakdown {
  final String categoryName;
  final int totalItems;
  final int totalStock;
  final double totalValuation;

  StockCategoryBreakdown({
    required this.categoryName,
    required this.totalItems,
    required this.totalStock,
    required this.totalValuation,
  });

  factory StockCategoryBreakdown.fromJson(Map<String, dynamic> json) {
    return StockCategoryBreakdown(
      categoryName: json['category_name']?.toString() ?? json['name']?.toString() ?? 'Other',
      totalItems: json['total_items'] is int ? json['total_items'] : int.tryParse(json['total_items']?.toString() ?? '0') ?? 0,
      totalStock: json['total_stock'] is int ? json['total_stock'] : int.tryParse(json['total_stock']?.toString() ?? '0') ?? 0,
      totalValuation: json['total_valuation'] is num
          ? (json['total_valuation'] as num).toDouble()
          : double.tryParse(json['total_valuation']?.toString() ?? '0') ?? 0.0,
    );
  }
}

class StockReportModel {
  final int totalItems;
  final double totalValuation;
  final int lowStockCount;
  final int outOfStockCount;
  final List<StockCategoryBreakdown> categories;

  StockReportModel({
    required this.totalItems,
    required this.totalValuation,
    required this.lowStockCount,
    required this.outOfStockCount,
    required this.categories,
  });

  factory StockReportModel.fromJson(Map<String, dynamic> json) {
    final summary = json['summary'] is Map ? json['summary'] as Map<String, dynamic> : json;

    final List<StockCategoryBreakdown> cats = [];
    if (json['categories'] is List) {
      for (var c in json['categories']) {
        if (c is Map<String, dynamic>) {
          cats.add(StockCategoryBreakdown.fromJson(c));
        }
      }
    }

    return StockReportModel(
      totalItems: summary['total_items'] is int
          ? summary['total_items']
          : int.tryParse(summary['total_items']?.toString() ?? '0') ?? 0,
      totalValuation: summary['total_valuation'] is num
          ? (summary['total_valuation'] as num).toDouble()
          : double.tryParse(summary['total_valuation']?.toString() ?? '0') ?? 0.0,
      lowStockCount: summary['low_stock_count'] is int
          ? summary['low_stock_count']
          : int.tryParse(summary['low_stock_count']?.toString() ?? '0') ?? 0,
      outOfStockCount: summary['out_of_stock_count'] is int
          ? summary['out_of_stock_count']
          : int.tryParse(summary['out_of_stock_count']?.toString() ?? '0') ?? 0,
      categories: cats,
    );
  }
}
