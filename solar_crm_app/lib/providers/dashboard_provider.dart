import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/admin_dashboard_model.dart';
import '../models/manager_dashboard_model.dart';
import 'auth_provider.dart';

class DashboardProvider extends ChangeNotifier {
  final ApiClient apiClient;

  DashboardProvider({required this.apiClient}) {
    AuthProvider.registerResetCallback(reset);
  }

  void reset() {
    _isLoading = false;
    _errorMessage = null;
    _adminStats = null;
    _managerStats = null;
    notifyListeners();
  }

  bool _isLoading = false;
  String? _errorMessage;
  AdminDashboardModel? _adminStats;
  ManagerDashboardModel? _managerStats;

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  AdminDashboardModel? get adminStats => _adminStats;
  ManagerDashboardModel? get managerStats => _managerStats;

  Future<void> fetchAdminDashboard({bool isRefresh = false}) async {
    if (!isRefresh && _adminStats != null) {
      // Already loaded, don't show full screen spinner
    } else {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();
    }

    try {
      final response = await apiClient.dio.get(ApiConstants.adminDashboard);
      final resData = response.data;

      if (resData['success'] == true && resData['data'] != null) {
        _adminStats = AdminDashboardModel.fromJson(resData['data']);
        _errorMessage = null;
      } else {
        _errorMessage = resData['message'] ?? 'Failed to load dashboard data.';
      }
    } on DioException catch (e) {
      if (e.response?.data is Map && e.response?.data['message'] != null) {
        _errorMessage = e.response?.data['message'];
      } else {
        _errorMessage = 'Network connection error. Pull down to retry.';
      }
    } catch (e) {
      _errorMessage = 'An unexpected error occurred: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchManagerDashboard({bool isRefresh = false}) async {
    if (!isRefresh && _managerStats != null) {
      // Already loaded
    } else {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();
    }

    try {
      final response = await apiClient.dio.get(ApiConstants.managerDashboard);
      final resData = response.data;

      if (resData['success'] == true && resData['data'] != null) {
        _managerStats = ManagerDashboardModel.fromJson(resData['data']);
        _errorMessage = null;
      } else {
        _errorMessage = resData['message'] ?? 'Failed to load manager dashboard.';
      }
    } on DioException catch (e) {
      if (e.response?.data is Map && e.response?.data['message'] != null) {
        _errorMessage = e.response?.data['message'];
      } else {
        _errorMessage = 'Network connection error. Pull down to retry.';
      }
    } catch (e) {
      _errorMessage = 'An unexpected error occurred: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

