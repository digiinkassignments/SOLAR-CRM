import 'package:flutter/foundation.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/stock_category_model.dart';
import '../models/stock_item_model.dart';
import '../models/stock_transaction_model.dart';
import '../models/stock_alert_model.dart';
import '../models/stock_report_model.dart';

class StockProvider extends ChangeNotifier {
  final ApiClient apiClient;

  StockProvider({required this.apiClient});

  // State
  List<StockItemModel> _items = [];
  List<StockCategoryModel> _categories = [];
  List<StockTransactionModel> _transactions = [];
  List<StockAlertModel> _alerts = [];
  StockReportModel? _report;

  bool _isLoadingItems = false;
  bool _isLoadingCategories = false;
  bool _isLoadingTransactions = false;
  bool _isLoadingAlerts = false;
  bool _isLoadingReport = false;
  bool _isSubmitting = false;

  String? _itemsError;
  String? _transactionsError;
  String? _alertsError;

  // Filters
  String _searchQuery = "";
  int? _selectedCategoryId;
  String _selectedStatus = "all"; // all, in_stock, low_stock, reorder, out_of_stock
  String _sortBy = "updated_at";

  // Getters
  List<StockItemModel> get items => _items;
  List<StockCategoryModel> get categories => _categories;
  List<StockTransactionModel> get transactions => _transactions;
  List<StockAlertModel> get alerts => _alerts;
  StockReportModel? get report => _report;

  bool get isLoadingItems => _isLoadingItems;
  bool get isLoadingCategories => _isLoadingCategories;
  bool get isLoadingTransactions => _isLoadingTransactions;
  bool get isLoadingAlerts => _isLoadingAlerts;
  bool get isLoadingReport => _isLoadingReport;
  bool get isSubmitting => _isSubmitting;

  String? get itemsError => _itemsError;
  String? get transactionsError => _transactionsError;
  String? get alertsError => _alertsError;

  String get searchQuery => _searchQuery;
  int? get selectedCategoryId => _selectedCategoryId;
  String get selectedStatus => _selectedStatus;
  String get sortBy => _sortBy;

  // Metrics
  int get totalSKUs => _items.length;
  double get totalValuation => _items.fold(0.0, (sum, i) => sum + i.totalValuation);
  int get lowStockCount => _items.where((i) => i.isLowStock).length;
  int get outOfStockCount => _items.where((i) => i.isOutOfStock).length;

  // Filter setters
  void setSearchQuery(String query) {
    _searchQuery = query;
    fetchStockItems();
  }

  void setSelectedCategory(int? categoryId) {
    _selectedCategoryId = categoryId;
    fetchStockItems();
  }

  void setSelectedStatus(String status) {
    _selectedStatus = status;
    fetchStockItems();
  }

  void setSortBy(String sort) {
    _sortBy = sort;
    fetchStockItems();
  }

  void resetFilters() {
    _searchQuery = "";
    _selectedCategoryId = null;
    _selectedStatus = "all";
    _sortBy = "updated_at";
    fetchStockItems();
  }

  // API: Fetch Categories
  Future<void> fetchCategories() async {
    _isLoadingCategories = true;
    notifyListeners();

    try {
      final response = await apiClient.dio.get(ApiConstants.stockCategories);
      if (response.data != null && response.data['success'] == true) {
        final List rawList = response.data['data'] as List? ?? [];
        _categories = rawList
            .map((c) => StockCategoryModel.fromJson(c as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint("Error fetching stock categories: $e");
    } finally {
      _isLoadingCategories = false;
      notifyListeners();
    }
  }

  // API: Fetch Stock Items
  Future<void> fetchStockItems() async {
    _isLoadingItems = true;
    _itemsError = null;
    notifyListeners();

    try {
      final Map<String, dynamic> queryParams = {};
      if (_searchQuery.trim().isNotEmpty) {
        queryParams['search'] = _searchQuery.trim();
      }
      if (_selectedCategoryId != null && _selectedCategoryId! > 0) {
        queryParams['category_id'] = _selectedCategoryId;
      }
      if (_selectedStatus != "all") {
        queryParams['status'] = _selectedStatus;
      }
      if (_sortBy.isNotEmpty) {
        queryParams['sort_by'] = _sortBy;
      }

      final response = await apiClient.dio.get(
        ApiConstants.stockItems,
        queryParameters: queryParams,
      );

      if (response.data != null && response.data['success'] == true) {
        final List rawList = response.data['data'] as List? ?? [];
        _items = rawList
            .map((i) => StockItemModel.fromJson(i as Map<String, dynamic>))
            .toList();
      } else {
        _itemsError = response.data?['message']?.toString() ?? "Failed to load stock items";
      }
    } catch (e) {
      debugPrint("Error fetching stock items: $e");
      _itemsError = "Failed to load inventory. Please check connection.";
    } finally {
      _isLoadingItems = false;
      notifyListeners();
    }
  }

  // API: Fetch Single Item Details
  Future<StockItemModel?> fetchStockItemById(int id) async {
    try {
      final response = await apiClient.dio.get(ApiConstants.stockItemDetails(id));
      if (response.data != null && response.data['success'] == true && response.data['data'] != null) {
        return StockItemModel.fromJson(response.data['data'] as Map<String, dynamic>);
      }
    } catch (e) {
      debugPrint("Error fetching stock item by id $id: $e");
    }
    return null;
  }

  // API: Create Stock Item
  Future<bool> createStockItem(Map<String, dynamic> data) async {
    _isSubmitting = true;
    notifyListeners();

    try {
      final response = await apiClient.dio.post(
        ApiConstants.stockItems,
        data: data,
      );

      if (response.data != null && response.data['success'] == true) {
        await fetchStockItems();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint("Error creating stock item: $e");
      return false;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  // API: Update Stock Item
  Future<bool> updateStockItem(int id, Map<String, dynamic> data) async {
    _isSubmitting = true;
    notifyListeners();

    try {
      final response = await apiClient.dio.put(
        ApiConstants.stockItemDetails(id),
        data: data,
      );

      if (response.data != null && response.data['success'] == true) {
        await fetchStockItems();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint("Error updating stock item: $e");
      return false;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  // API: Delete Stock Item
  Future<bool> deleteStockItem(int id) async {
    _isSubmitting = true;
    notifyListeners();

    try {
      final response = await apiClient.dio.delete(ApiConstants.stockItemDetails(id));
      if (response.data != null && response.data['success'] == true) {
        _items.removeWhere((item) => item.id == id);
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint("Error deleting stock item: $e");
      return false;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  // API: Record Stock Inward (Stock IN)
  Future<bool> recordStockIn({
    required int itemId,
    required int quantity,
    double? unitPrice,
    String referenceType = "PURCHASE_ORDER",
    String? referenceId,
    String? notes,
  }) async {
    _isSubmitting = true;
    notifyListeners();

    try {
      final payload = {
        'item_id': itemId,
        'transaction_type': 'IN',
        'quantity': quantity,
        'unit_price': unitPrice ?? 0.0,
        'reference_type': referenceType,
        'reference_id': referenceId,
        'notes': notes,
      };

      final response = await apiClient.dio.post(
        ApiConstants.stockTransactions,
        data: payload,
      );

      if (response.data != null && response.data['success'] == true) {
        await fetchStockItems();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint("Error recording stock in: $e");
      return false;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  // API: Record Stock Outward (Stock OUT)
  Future<bool> recordStockOut({
    required int itemId,
    required int quantity,
    String referenceType = "PROJECT",
    String? referenceId,
    String? notes,
  }) async {
    _isSubmitting = true;
    notifyListeners();

    try {
      final payload = {
        'item_id': itemId,
        'transaction_type': 'OUT',
        'quantity': quantity,
        'reference_type': referenceType,
        'reference_id': referenceId,
        'notes': notes,
      };

      final response = await apiClient.dio.post(
        ApiConstants.stockTransactions,
        data: payload,
      );

      if (response.data != null && response.data['success'] == true) {
        await fetchStockItems();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint("Error recording stock out: $e");
      return false;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  // API: Fetch Stock Transactions
  Future<void> fetchTransactions({int? itemId, String? transactionType, String? search}) async {
    _isLoadingTransactions = true;
    _transactionsError = null;
    notifyListeners();

    try {
      final Map<String, dynamic> queryParams = {};
      if (itemId != null && itemId > 0) queryParams['item_id'] = itemId;
      if (transactionType != null && transactionType.isNotEmpty && transactionType != 'ALL') {
        queryParams['transaction_type'] = transactionType;
      }
      if (search != null && search.isNotEmpty) queryParams['search'] = search;

      final response = await apiClient.dio.get(
        ApiConstants.stockTransactions,
        queryParameters: queryParams,
      );

      if (response.data != null && response.data['success'] == true) {
        final List rawList = response.data['data'] as List? ?? [];
        _transactions = rawList
            .map((t) => StockTransactionModel.fromJson(t as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint("Error fetching stock transactions: $e");
      _transactionsError = "Failed to load transactions log";
    } finally {
      _isLoadingTransactions = false;
      notifyListeners();
    }
  }

  // API: Fetch Stock Alerts
  Future<void> fetchAlerts({int isResolved = 0}) async {
    _isLoadingAlerts = true;
    _alertsError = null;
    notifyListeners();

    try {
      final response = await apiClient.dio.get(
        ApiConstants.stockAlerts,
        queryParameters: {'is_resolved': isResolved},
      );

      if (response.data != null && response.data['success'] == true) {
        final List rawList = response.data['data'] as List? ?? [];
        _alerts = rawList
            .map((a) => StockAlertModel.fromJson(a as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint("Error fetching stock alerts: $e");
      _alertsError = "Failed to load stock alerts";
    } finally {
      _isLoadingAlerts = false;
      notifyListeners();
    }
  }

  // API: Resolve Alert
  Future<bool> resolveAlert(int alertId) async {
    try {
      final response = await apiClient.dio.put(ApiConstants.resolveStockAlert(alertId));
      if (response.data != null && response.data['success'] == true) {
        _alerts.removeWhere((a) => a.id == alertId);
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint("Error resolving alert $alertId: $e");
      return false;
    }
  }

  // API: Fetch Valuation Report
  Future<void> fetchReport() async {
    _isLoadingReport = true;
    notifyListeners();

    try {
      final response = await apiClient.dio.get(ApiConstants.stockReport);
      if (response.data != null && response.data['success'] == true) {
        _report = StockReportModel.fromJson(response.data['data'] as Map<String, dynamic>);
      }
    } catch (e) {
      debugPrint("Error fetching stock report: $e");
    } finally {
      _isLoadingReport = false;
      notifyListeners();
    }
  }
}
