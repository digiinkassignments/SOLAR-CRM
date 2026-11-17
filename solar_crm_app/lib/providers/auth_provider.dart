import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../core/network/api_client.dart';
import '../core/constants/api_constants.dart';
import '../core/storage/storage_service.dart';
import '../models/user_model.dart';
import '../models/tenant_model.dart';

class AuthProvider extends ChangeNotifier {
  final ApiClient apiClient;

  String? _workspace;
  TenantModel? _tenant;
  UserModel? _user;
  String? _token;
  bool _isLoading = false;
  String? _errorMessage;

  AuthProvider({required this.apiClient});

  String? get workspace => _workspace;
  TenantModel? get tenant => _tenant;
  UserModel? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _token != null && _user != null;

  /// Check stored credentials on app startup
  Future<void> init() async {
    _isLoading = true;
    notifyListeners();

    try {
      _workspace = await StorageService.getWorkspace();
      if (_workspace != null && _workspace!.isNotEmpty) {
        apiClient.setWorkspace(_workspace!);

        final tenantJson = await StorageService.getTenantJson();
        if (tenantJson != null) {
          try {
            _tenant = TenantModel.fromJson(jsonDecode(tenantJson));
          } catch (_) {}
        }
      }

      _token = await StorageService.getToken();
      final userJson = await StorageService.getUserJson();

      if (_token != null && userJson != null) {
        _user = UserModel.fromJson(jsonDecode(userJson));
      }
    } catch (e) {
      debugPrint("Auth init error: $e");
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Verify and set company workspace via /auth/tenant-info
  Future<bool> verifyAndSetWorkspace(String newWorkspace) async {
    final cleanWorkspace = newWorkspace.trim().toLowerCase();
    if (cleanWorkspace.isEmpty) {
      _errorMessage = "Please enter your company workspace handle.";
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // Temporarily set baseUrl to test workspace
      apiClient.setWorkspace(cleanWorkspace);

      final response = await apiClient.dio.get(ApiConstants.tenantInfo);
      final data = response.data;

      if (data['success'] == true && data['data'] != null) {
        _tenant = TenantModel.fromJson(data['data']);
        _workspace = cleanWorkspace;

        await StorageService.saveWorkspace(_workspace!);
        await StorageService.saveTenantJson(jsonEncode(_tenant!.toJson()));

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = data['message'] ?? "Workspace not found.";
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } on DioException catch (e) {
      _isLoading = false;
      if (e.response?.statusCode == 404) {
        _errorMessage = "Workspace '$cleanWorkspace' was not found on ${ApiConstants.baseDomain}.";
      } else if (e.type == DioExceptionType.connectionTimeout || e.type == DioExceptionType.receiveTimeout) {
        _errorMessage = "Connection timed out. Please check your internet connection.";
      } else {
        _errorMessage = "Cannot reach '$cleanWorkspace.${ApiConstants.baseDomain}'. Please check spelling.";
      }
      notifyListeners();
      return false;
    } catch (e) {
      _isLoading = false;
      _errorMessage = "Error validating workspace: $e";
      notifyListeners();
      return false;
    }
  }

  /// Login with identifier (Username/Email/Phone) and password
  Future<bool> login(String loginIdentifier, String password, {bool rememberMe = true}) async {
    if (_workspace == null || _workspace!.isEmpty) {
      _errorMessage = "Please enter your company workspace code first.";
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await apiClient.dio.post(
        ApiConstants.login,
        data: {
          'login': loginIdentifier.trim(),
          'password': password,
        },
      );

      final data = response.data;
      if (data['success'] == true && data['token'] != null) {
        _token = data['token'];
        await StorageService.saveToken(_token!);

        final userData = data['user'] ?? data['data'];
        if (userData != null) {
          _user = UserModel.fromJson(userData);
          await StorageService.saveUserJson(jsonEncode(_user!.toJson()));
        }

        if (rememberMe) {
          await StorageService.saveLoginIdentifier(loginIdentifier.trim());
        } else {
          await StorageService.clearSavedLoginIdentifier();
        }

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = data['message'] ?? "Authentication failed.";
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } on DioException catch (e) {
      _isLoading = false;
      if (e.response != null && e.response?.data != null) {
        final resData = e.response?.data;
        if (resData is Map && resData.containsKey('message')) {
          _errorMessage = resData['message'];
        } else {
          _errorMessage = "Authentication error (${e.response?.statusCode}). Please verify your credentials.";
        }
      } else {
        _errorMessage = "Cannot connect to $_workspace.${ApiConstants.baseDomain}. Please check your internet.";
      }
      notifyListeners();
      return false;
    } catch (e) {
      _isLoading = false;
      _errorMessage = "An unexpected error occurred: $e";
      notifyListeners();
      return false;
    }
  }

  /// Request OTP for Password Reset
  Future<Map<String, dynamic>> requestPasswordResetOtp(String loginIdentifier) async {
    if (_workspace == null || _workspace!.isEmpty) {
      return {'success': false, 'message': 'Company workspace not set.'};
    }

    try {
      final response = await apiClient.dio.post(
        ApiConstants.forgotPassword,
        data: {'login': loginIdentifier.trim()},
      );

      final data = response.data;
      return {
        'success': data['success'] == true,
        'message': data['message'] ?? 'OTP sent to registered email.',
      };
    } on DioException catch (e) {
      final msg = e.response?.data is Map && e.response?.data['message'] != null
          ? e.response?.data['message']
          : 'Failed to send OTP. Please check your username/email.';
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'An error occurred: $e'};
    }
  }

  /// Confirm OTP and Set New Password
  Future<Map<String, dynamic>> confirmPasswordReset({
    required String loginIdentifier,
    required String otp,
    required String newPassword,
    required String confirmPassword,
  }) async {
    try {
      final response = await apiClient.dio.post(
        ApiConstants.resetPassword,
        data: {
          'login': loginIdentifier.trim(),
          'otp': otp.trim(),
          'password': newPassword,
          'confirm_password': confirmPassword,
        },
      );

      final data = response.data;
      return {
        'success': data['success'] == true,
        'message': data['message'] ?? 'Password reset successfully.',
      };
    } on DioException catch (e) {
      final msg = e.response?.data is Map && e.response?.data['message'] != null
          ? e.response?.data['message']
          : 'Invalid or expired OTP.';
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'An error occurred: $e'};
    }
  }

  /// Logout and clear sessions (preserves workspace subdomain)
  Future<void> logout() async {
    await StorageService.clearAuth();
    _token = null;
    _user = null;
    _errorMessage = null;
    notifyListeners();
  }
}
