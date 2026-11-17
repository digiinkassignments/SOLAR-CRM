class StockCategoryBreakdown {
  final int? categoryId;
  final String categoryName;
  final String? categorySlug;
  final int itemCount;
  final int totalQuantity;
  final double categoryValuation;

  StockCategoryBreakdown({
    this.categoryId,
    required this.categoryName,
    this.categorySlug,
    required this.itemCount,
    required this.totalQuantity,
    required this.categoryValuation,
  });

  factory StockCategoryBreakdown.fromJson(Map<String, dynamic> json) {
    return StockCategoryBreakdown(
      categoryId: json['category_id'] is int
          ? json['category_id']
          : int.tryParse(json['category_id']?.toString() ?? ''),
      categoryName: json['category_name']?.toString() ?? json['name']?.toString() ?? 'General',
      categorySlug: json['category_slug']?.toString(),
      itemCount: json['item_count'] is int
          ? json['item_count']
          : int.tryParse(json['item_count']?.toString() ?? json['total_items']?.toString() ?? '0') ?? 0,
      totalQuantity: json['category_quantity'] is int
          ? json['category_quantity']
          : int.tryParse(json['category_quantity']?.toString() ?? json['total_quantity']?.toString() ?? json['total_stock']?.toString() ?? '0') ?? 0,
      categoryValuation: json['category_valuation'] is num
          ? (json['category_valuation'] as num).toDouble()
          : double.tryParse(json['category_valuation']?.toString() ?? json['total_valuation']?.toString() ?? '0') ?? 0.0,
    );
  }
}

class StockReportModel {
  final int totalItems;
  final int totalQuantity;
  final double totalValuation;
  final double totalValuationWithGst;
  final int lowStockCount;
  final int outOfStockCount;
  final int reorderCount;
  final int healthyCount;
  final List<StockCategoryBreakdown> categories;

  StockReportModel({
    required this.totalItems,
    required this.totalQuantity,
    required this.totalValuation,
    required this.totalValuationWithGst,
    required this.lowStockCount,
    required this.outOfStockCount,
    this.reorderCount = 0,
    this.healthyCount = 0,
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

    final double valExcl = summary['total_valuation'] is num
        ? (summary['total_valuation'] as num).toDouble()
        : double.tryParse(summary['total_valuation']?.toString() ?? '0') ?? 0.0;

    final double valIncl = summary['total_valuation_with_gst'] is num
        ? (summary['total_valuation_with_gst'] as num).toDouble()
        : double.tryParse(summary['total_valuation_with_gst']?.toString() ?? '${valExcl * 1.18}') ?? (valExcl * 1.18);

    return StockReportModel(
      totalItems: summary['total_items'] is int
          ? summary['total_items']
          : int.tryParse(summary['total_items']?.toString() ?? '0') ?? 0,
      totalQuantity: summary['total_quantity'] is int
          ? summary['total_quantity']
          : int.tryParse(summary['total_quantity']?.toString() ?? '0') ?? 0,
      totalValuation: valExcl,
      totalValuationWithGst: valIncl,
      lowStockCount: summary['low_stock_count'] is int
          ? summary['low_stock_count']
          : int.tryParse(summary['low_stock_count']?.toString() ?? '0') ?? 0,
      outOfStockCount: summary['out_of_stock_count'] is int
          ? summary['out_of_stock_count']
          : int.tryParse(summary['out_of_stock_count']?.toString() ?? '0') ?? 0,
      reorderCount: summary['reorder_count'] is int
          ? summary['reorder_count']
          : int.tryParse(summary['reorder_count']?.toString() ?? '0') ?? 0,
      healthyCount: summary['healthy_count'] is int
          ? summary['healthy_count']
          : int.tryParse(summary['healthy_count']?.toString() ?? '0') ?? 0,
      categories: cats,
    );
  }
}
