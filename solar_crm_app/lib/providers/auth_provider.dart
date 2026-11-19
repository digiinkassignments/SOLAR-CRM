import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../core/network/api_client.dart';
import '../core/constants/api_constants.dart';
import '../core/storage/storage_service.dart';
import '../models/user_model.dart';
import '../models/tenant_model.dart';

enum SessionStatus {
  authenticated,
  expired,
  networkError,
}

class SessionVerificationResult {
  final SessionStatus status;
  final String? message;
  final UserModel? user;

  SessionVerificationResult({
    required this.status,
    this.message,
    this.user,
  });
}

class AuthProvider extends ChangeNotifier {
  final ApiClient apiClient;

  static final List<void Function()> _onResetCallbacks = [];

  /// Register callback to reset in-memory caches on logout
  static void registerResetCallback(void Function() callback) {
    if (!_onResetCallbacks.contains(callback)) {
      _onResetCallbacks.add(callback);
    }
  }

  /// Trigger all registered provider reset callbacks and invalidate in-flight network requests
  static void triggerResetAll() {
    ApiClient.invalidateSession();
    for (final cb in _onResetCallbacks) {
      try {
        cb();
      } catch (_) {}
    }
  }

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

  /// Verify active session with the backend server upon app restart
  Future<SessionVerificationResult> verifySession() async {
    final token = _token ?? await StorageService.getToken();
    if (token == null || token.isEmpty) {
      return SessionVerificationResult(
        status: SessionStatus.expired,
        message: "No active session token found.",
      );
    }

    try {
      final response = await apiClient.dio.get(ApiConstants.userProfile);
      final resData = response.data;

      if (resData['success'] == true && resData['data'] != null) {
        final profileMap = Map<String, dynamic>.from(resData['data']);

        // Preserve existing is_password_changed requirement if server response omits the key
        final existingUser = _user;
        if (profileMap['is_password_changed'] == null && existingUser != null) {
          profileMap['is_password_changed'] = existingUser.isPasswordChanged;
        }

        // Also preserve existing permissions if server profile omits them
        if (profileMap['permissions'] == null && existingUser != null) {
          profileMap['permissions'] = existingUser.permissions;
        }

        // Build fresh UserModel directly from server database row
        final freshUser = UserModel.fromJson(profileMap);

        // Account status check (reject deactivated/suspended users)
        if (freshUser.status.toLowerCase() != 'active') {
          await logout();
          return SessionVerificationResult(
            status: SessionStatus.expired,
            message: "Account is ${freshUser.status.toLowerCase()}. Please contact administrator.",
          );
        }

        // Update in-memory user and persistent storage
        _user = freshUser;
        _token = token;
        await StorageService.saveUserJson(jsonEncode(freshUser.toJson()));
        notifyListeners();

        return SessionVerificationResult(
          status: SessionStatus.authenticated,
          user: freshUser,
        );
      } else {
        await logout();
        return SessionVerificationResult(
          status: SessionStatus.expired,
          message: resData['message']?.toString() ?? "Session expired. Please log in again.",
        );
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401 || e.response?.statusCode == 403) {
        await logout();
        return SessionVerificationResult(
          status: SessionStatus.expired,
          message: "Session expired or access revoked. Please log in again.",
        );
      }
      // Connection timeout, socket exception, offline network failure
      return SessionVerificationResult(
        status: SessionStatus.networkError,
        message: "Unable to connect to server. Check your network connection.",
      );
    } catch (e) {
      return SessionVerificationResult(
        status: SessionStatus.networkError,
        message: "Network error during session verification: $e",
      );
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

  /// Mark password as changed for initial login requirement
  Future<void> markPasswordChanged() async {
    if (_user != null) {
      _user = _user!.copyWith(isPasswordChanged: 1);
      await StorageService.saveUserJson(jsonEncode(_user!.toJson()));
      notifyListeners();
    }
  }

  /// Logout and clear sessions (preserves workspace subdomain)
  Future<void> logout() async {
    await StorageService.clearAuth();
    _token = null;
    _user = null;
    _errorMessage = null;
    triggerResetAll();
    notifyListeners();
  }

  /// Reset workspace and clear all auth & cached provider state
  Future<void> resetWorkspace() async {
    await StorageService.clearWorkspace();
    await StorageService.clearAuth();
    _workspace = null;
    _tenant = null;
    _token = null;
    _user = null;
    _errorMessage = null;
    triggerResetAll();
    notifyListeners();
  }
}
