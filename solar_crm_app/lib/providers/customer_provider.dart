import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/customer_model.dart';

class CustomerProvider extends ChangeNotifier {
  final ApiClient apiClient;

  CustomerProvider({required this.apiClient});

  List<CustomerModel> _customers = [];
  CustomerStats? _stats;
  bool _isLoading = false;
  String? _errorMessage;

  String _searchQuery = "";
  String _selectedRequirement = "All";
  String _selectedCity = "";

  Customer360Detail? _selectedCustomerDetail;
  bool _isLoadingDetail = false;

  List<CustomerModel> get customers => _customers;
  CustomerStats? get stats => _stats;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get searchQuery => _searchQuery;
  String get selectedRequirement => _selectedRequirement;
  String get selectedCity => _selectedCity;

  Customer360Detail? get selectedCustomerDetail => _selectedCustomerDetail;
  bool get isLoadingDetail => _isLoadingDetail;

  /// Fetch all customers with query filters
  Future<void> fetchCustomers({
    bool isRefresh = false,
    String? search,
    String? city,
    String? requirement,
  }) async {
    if (search != null) _searchQuery = search;
    if (city != null) _selectedCity = city;
    if (requirement != null) _selectedRequirement = requirement;

    if (!isRefresh && _customers.isNotEmpty) {
      // Background reload
    } else {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();
    }

    try {
      final queryParams = <String, dynamic>{};
      if (_searchQuery.trim().isNotEmpty) {
        queryParams['search'] = _searchQuery.trim();
      }
      if (_selectedCity.trim().isNotEmpty) {
        queryParams['city'] = _selectedCity.trim();
      }
      if (_selectedRequirement.isNotEmpty && _selectedRequirement != "All") {
        queryParams['requirement'] = _selectedRequirement;
      }

      final response = await apiClient.dio.get(
        ApiConstants.customers,
        queryParameters: queryParams,
      );

      final resData = response.data;
      if (resData['success'] == true) {
        final list = (resData['data'] as List? ?? [])
            .map((e) => CustomerModel.fromJson(e as Map<String, dynamic>))
            .toList();

        _customers = list;
        if (resData['stats'] != null) {
          _stats = CustomerStats.fromJson(resData['stats']);
        }
        _errorMessage = null;
      } else {
        _errorMessage = resData['message'] ?? 'Failed to load customers.';
      }
    } on DioException catch (e) {
      if (e.response?.data is Map && e.response?.data['message'] != null) {
        _errorMessage = e.response?.data['message'];
      } else {
        _errorMessage = 'Network connection error. Pull down to refresh.';
      }
    } catch (e) {
      _errorMessage = 'An unexpected error occurred: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Fetch single customer 360° profile
  Future<Customer360Detail?> fetchCustomerById(int id) async {
    _isLoadingDetail = true;
    _selectedCustomerDetail = null;
    notifyListeners();

    try {
      final response = await apiClient.dio.get("${ApiConstants.customers}/$id");
      final resData = response.data;
      if (resData['success'] == true && resData['data'] != null) {
        _selectedCustomerDetail = Customer360Detail.fromJson(resData['data']);
        _isLoadingDetail = false;
        notifyListeners();
        return _selectedCustomerDetail;
      }
    } catch (e) {
      debugPrint("fetchCustomerById error: $e");
    } finally {
      _isLoadingDetail = false;
      notifyListeners();
    }
    return null;
  }

  /// Create Customer Manually
  Future<Map<String, dynamic>> createCustomer(Map<String, dynamic> data) async {
    try {
      final response = await apiClient.dio.post(
        ApiConstants.customers,
        data: data,
      );
      final resData = response.data;
      if (resData['success'] == true) {
        await fetchCustomers(isRefresh: true);
        return {'success': true, 'message': resData['message'] ?? 'Customer created successfully.'};
      } else {
        return {'success': false, 'message': resData['message'] ?? 'Failed to create customer.'};
      }
    } on DioException catch (e) {
      final msg = e.response?.data is Map && e.response?.data['message'] != null
          ? e.response?.data['message']
          : 'Failed to create customer.';
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'An error occurred: $e'};
    }
  }

  /// Update Customer
  Future<Map<String, dynamic>> updateCustomer(int id, Map<String, dynamic> data) async {
    try {
      final response = await apiClient.dio.put(
        "${ApiConstants.customers}/$id",
        data: data,
      );
      final resData = response.data;
      if (resData['success'] == true) {
        await fetchCustomers(isRefresh: true);
        return {'success': true, 'message': resData['message'] ?? 'Customer updated successfully.'};
      } else {
        return {'success': false, 'message': resData['message'] ?? 'Failed to update customer.'};
      }
    } on DioException catch (e) {
      final msg = e.response?.data is Map && e.response?.data['message'] != null
          ? e.response?.data['message']
          : 'Failed to update customer.';
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'An error occurred: $e'};
    }
  }

  /// Delete Customer
  Future<Map<String, dynamic>> deleteCustomer(int id) async {
    try {
      final response = await apiClient.dio.delete("${ApiConstants.customers}/$id");
      final resData = response.data;
      if (resData['success'] == true) {
        _customers.removeWhere((c) => c.id == id);
        notifyListeners();
        return {'success': true, 'message': 'Customer deleted successfully.'};
      } else {
        return {'success': false, 'message': resData['message'] ?? 'Failed to delete customer.'};
      }
    } on DioException catch (e) {
      final msg = e.response?.data is Map && e.response?.data['message'] != null
          ? e.response?.data['message']
          : 'Failed to delete customer.';
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'An error occurred: $e'};
    }
  }
}

