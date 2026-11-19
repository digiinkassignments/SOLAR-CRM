import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/stock_category_model.dart';
import '../models/stock_item_model.dart';
import '../models/stock_transaction_model.dart';
import '../models/stock_alert_model.dart';
import '../models/stock_report_model.dart';
import 'auth_provider.dart';

class StockProvider extends ChangeNotifier {
  final ApiClient apiClient;

  StockProvider({required this.apiClient}) {
    AuthProvider.registerResetCallback(reset);
  }

  void reset() {
    _items = [];
    _page = 1;
    _totalItems = 0;
    _categories = [];
    _transactions = [];
    _txnPage = 1;
    _totalTxns = 0;
    _alerts = [];
    _report = null;
    _isLoadingItems = false;
    _isLoadingCategories = false;
    _isLoadingTransactions = false;
    _isLoadingAlerts = false;
    _isLoadingReport = false;
    _isSubmitting = false;
    _itemsError = null;
    _transactionsError = null;
    _alertsError = null;
    _searchQuery = "";
    _selectedCategoryId = null;
    _selectedStatus = "all";
    _sortBy = "updated_at";
    notifyListeners();
  }

  // Items State & Pagination
  List<StockItemModel> _items = [];
  int _page = 1;
  final int _limit = 20; // 20 per page as requested
  int _totalItems = 0;

  List<StockCategoryModel> _categories = [];

  // Transactions State & Pagination
  List<StockTransactionModel> _transactions = [];
  int _txnPage = 1;
  final int _txnLimit = 25;
  int _totalTxns = 0;

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

  // Getters - Items
  List<StockItemModel> get items => _items;
  int get page => _page;
  int get limit => _limit;
  int get totalItems => _totalItems;
  int get totalPages => (_totalItems / _limit).ceil().clamp(1, 9999);

  List<StockCategoryModel> get categories => _categories;
  List<StockTransactionModel> get transactions => _transactions;
  int get txnPage => _txnPage;
  int get totalTxns => _totalTxns;
  int get totalTxnPages => (_totalTxns / _txnLimit).ceil().clamp(1, 9999);

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
  int get totalSKUs => _report?.totalItems ?? _totalItems;
  double get totalValuation => _report?.totalValuation ?? _items.fold(0.0, (sum, i) => sum + i.totalValuation);
  int get lowStockCount => _report?.lowStockCount ?? _items.where((i) => i.isLowStock).length;
  int get outOfStockCount => _report?.outOfStockCount ?? _items.where((i) => i.isOutOfStock).length;

  // Filter & Page setters
  void setPage(int newPage) {
    if (newPage < 1 || newPage > totalPages || newPage == _page) return;
    _page = newPage;
    fetchStockItems();
  }

  void setTxnPage(int newPage, {int? itemId, String? transactionType, String? referenceType, String? search}) {
    if (newPage < 1 || newPage > totalTxnPages || newPage == _txnPage) return;
    _txnPage = newPage;
    fetchTransactions(itemId: itemId, transactionType: transactionType, referenceType: referenceType, search: search, page: newPage);
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    _page = 1;
    fetchStockItems();
  }

  void setSelectedCategory(int? categoryId) {
    _selectedCategoryId = categoryId;
    _page = 1;
    fetchStockItems();
  }

  void setSelectedStatus(String status) {
    _selectedStatus = status;
    _page = 1;
    fetchStockItems();
  }

  void setSortBy(String sort) {
    _sortBy = sort;
    _page = 1;
    fetchStockItems();
  }

  void resetFilters() {
    _searchQuery = "";
    _selectedCategoryId = null;
    _selectedStatus = "all";
    _sortBy = "updated_at";
    _page = 1;
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

  // API: Fetch Stock Items with Pagination (20 per page)
  Future<void> fetchStockItems() async {
    _isLoadingItems = true;
    _itemsError = null;
    notifyListeners();

    try {
      final Map<String, dynamic> queryParams = {
        'page': _page,
        'limit': _limit,
      };
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

        if (response.data['pagination'] != null) {
          final p = response.data['pagination'];
          _totalItems = p['total'] is int ? p['total'] : int.tryParse(p['total']?.toString() ?? '0') ?? _items.length;
        } else {
          _totalItems = _items.length;
        }
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

  // API: Find item by Barcode or Item Code
  Future<StockItemModel?> getItemByBarcode(String code) async {
    try {
      final response = await apiClient.dio.get(ApiConstants.stockItemByBarcode(code));
      if (response.data != null && response.data['success'] == true && response.data['data'] != null) {
        return StockItemModel.fromJson(response.data['data'] as Map<String, dynamic>);
      }
    } catch (e) {
      debugPrint("Error fetching item by barcode: $e");
    }
    return null;
  }

  // API: Quick Scan IN by Barcode
  Future<Map<String, dynamic>?> quickScanInByBarcode({
    required String code,
    int quantity = 1,
    double? unitPrice,
    String? vendorName,
    String? vendorInvoice,
    String? notes,
  }) async {
    try {
      final payload = {
        'code': code.trim(),
        'quantity': quantity,
        if (unitPrice != null && unitPrice > 0) 'unit_price': unitPrice,
        if (vendorName != null && vendorName.isNotEmpty) 'vendor_name': vendorName,
        if (vendorInvoice != null && vendorInvoice.isNotEmpty) 'vendor_invoice': vendorInvoice,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      };

      final response = await apiClient.dio.post(
        ApiConstants.stockQuickScanIn,
        data: payload,
      );

      if (response.data != null && response.data['success'] == true) {
        await fetchStockItems();
        return response.data['data'] as Map<String, dynamic>?;
      }
    } catch (e) {
      debugPrint("Error quick scanning in by barcode: $e");
    }
    return null;
  }

  // API: Create Stock Item (Supports image file upload)
  Future<bool> createStockItem(Map<String, dynamic> data, {String? imageFilePath}) async {
    _isSubmitting = true;
    notifyListeners();

    try {
      dynamic postData;
      if (imageFilePath != null && imageFilePath.isNotEmpty) {
        final formMap = Map<String, dynamic>.from(data);
        formMap['image'] = await MultipartFile.fromFile(imageFilePath);
        if (formMap['specifications'] != null && formMap['specifications'] is Map) {
          formMap['specifications'] = jsonEncode(formMap['specifications']);
        }
        postData = FormData.fromMap(formMap);
      } else {
        postData = data;
      }

      final response = await apiClient.dio.post(
        ApiConstants.stockItems,
        data: postData,
      );

      if (response.data != null && response.data['success'] == true) {
        await fetchStockItems();
        await fetchReport();
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

  // API: Update Stock Item (Supports image file upload)
  Future<bool> updateStockItem(int id, Map<String, dynamic> data, {String? imageFilePath}) async {
    _isSubmitting = true;
    notifyListeners();

    try {
      dynamic putData;
      if (imageFilePath != null && imageFilePath.isNotEmpty) {
        final formMap = Map<String, dynamic>.from(data);
        formMap['image'] = await MultipartFile.fromFile(imageFilePath);
        if (formMap['specifications'] != null && formMap['specifications'] is Map) {
          formMap['specifications'] = jsonEncode(formMap['specifications']);
        }
        putData = FormData.fromMap(formMap);
      } else {
        putData = data;
      }

      final response = await apiClient.dio.put(
        ApiConstants.stockItemDetails(id),
        data: putData,
      );

      if (response.data != null && response.data['success'] == true) {
        await fetchStockItems();
        await fetchReport();
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
        _totalItems = (_totalItems - 1).clamp(0, 9999);
        await fetchReport();
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
    String referenceType = "PURCHASE",
    String? referenceNumber,
    String? vendorName,
    String? vendorInvoice,
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
        'reference_number': referenceNumber,
        'reference_id': referenceNumber,
        'vendor_name': vendorName,
        'vendor_invoice': vendorInvoice,
        'notes': notes,
      };

      final response = await apiClient.dio.post(
        ApiConstants.stockTransactions,
        data: payload,
      );

      if (response.data != null && response.data['success'] == true) {
        await fetchStockItems();
        await fetchReport();
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
    String? referenceNumber,
    String? vendorName,
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
        'reference_number': referenceNumber,
        'reference_id': referenceNumber,
        'vendor_name': vendorName,
        'notes': notes,
      };

      final response = await apiClient.dio.post(
        ApiConstants.stockTransactions,
        data: payload,
      );

      if (response.data != null && response.data['success'] == true) {
        await fetchStockItems();
        await fetchReport();
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

  // API: Fetch Stock Transactions with Pagination (25 per page)
  Future<void> fetchTransactions({
    int? itemId,
    String? transactionType,
    String? referenceType,
    String? search,
    int? page,
  }) async {
    _isLoadingTransactions = true;
    _transactionsError = null;
    if (page != null) _txnPage = page;
    notifyListeners();

    try {
      final Map<String, dynamic> queryParams = {
        'page': _txnPage,
        'limit': _txnLimit,
      };
      if (itemId != null && itemId > 0) queryParams['item_id'] = itemId;
      if (transactionType != null && transactionType.isNotEmpty && transactionType != 'ALL') {
        queryParams['transaction_type'] = transactionType;
      }
      if (referenceType != null && referenceType.isNotEmpty && referenceType != 'ALL') {
        queryParams['reference_type'] = referenceType;
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

        if (response.data['pagination'] != null) {
          final p = response.data['pagination'];
          _totalTxns = p['total'] is int ? p['total'] : int.tryParse(p['total']?.toString() ?? '0') ?? _transactions.length;
        } else {
          _totalTxns = _transactions.length;
        }
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
      if (response.data != null && response.data['success'] == true && response.data['data'] != null) {
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
