import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/team_user_model.dart';

class UserProvider extends ChangeNotifier {
  final ApiClient apiClient;

  UserProvider({required this.apiClient});

  List<TeamUserModel> _users = [];
  List<RoleItem> _roles = [];
  bool _isLoading = false;
  String? _errorMessage;

  int _currentPage = 1;
  int _totalPages = 1;
  int _totalRecords = 0;

  String _searchQuery = "";
  String _selectedRole = "";
  String _selectedStatus = "";

  List<TeamUserModel> get users => _users;
  List<RoleItem> get roles => _roles;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  int get totalRecords => _totalRecords;
  int get currentPage => _currentPage;
  int get totalPages => _totalPages;

  String get searchQuery => _searchQuery;
  String get selectedRole => _selectedRole;
  String get selectedStatus => _selectedStatus;

  // Filtered managers for Sales rep reporting
  List<TeamUserModel> get managers => _users.where((u) => u.isManager).toList();

  int get activeCount => _users.where((u) => u.isActive).length;
  int get inactiveCount => _users.where((u) => !u.isActive).length;

  /// Fetch users with filters & pagination
  Future<void> fetchUsers({
    bool isRefresh = false,
    String? search,
    String? role,
    String? status,
    int? page,
  }) async {
    if (search != null) _searchQuery = search;
    if (role != null) _selectedRole = role;
    if (status != null) _selectedStatus = status;
    if (page != null) _currentPage = page;

    if (isRefresh) {
      _currentPage = 1;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final queryParams = <String, dynamic>{
        'page': _currentPage,
        'limit': 20,
      };

      if (_searchQuery.trim().isNotEmpty) {
        queryParams['search'] = _searchQuery.trim();
      }
      if (_selectedRole.isNotEmpty && _selectedRole != "All") {
        queryParams['role'] = _selectedRole;
      }
      if (_selectedStatus.isNotEmpty && _selectedStatus != "All") {
        queryParams['status'] = _selectedStatus;
      }

      final response = await apiClient.dio.get(
        ApiConstants.users,
        queryParameters: queryParams,
      );

      final resData = response.data;
      if (resData['success'] == true && resData['data'] != null) {
        final list = (resData['data'] as List)
            .map((e) => TeamUserModel.fromJson(e as Map<String, dynamic>))
            .toList();

        if (_currentPage == 1 || isRefresh) {
          _users = list;
        } else {
          _users.addAll(list);
        }

        if (resData['pagination'] != null) {
          _totalRecords = resData['pagination']['totalRecords'] ?? _users.length;
          _totalPages = resData['pagination']['totalPages'] ?? 1;
        } else {
          _totalRecords = _users.length;
        }

        _errorMessage = null;
      } else {
        _errorMessage = resData['message'] ?? 'Failed to load team members.';
      }
    } on DioException catch (e) {
      if (e.response?.data is Map && e.response?.data['message'] != null) {
        _errorMessage = e.response?.data['message'];
      } else {
        _errorMessage = "Network error. Pull down to refresh.";
      }
    } catch (e) {
      _errorMessage = "An unexpected error occurred: $e";
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Fetch Roles from /roles
  Future<void> fetchRoles() async {
    try {
      final response = await apiClient.dio.get(ApiConstants.roles);
      final resData = response.data;
      if (resData['success'] == true && resData['data'] != null) {
        _roles = (resData['data'] as List)
            .map((e) => RoleItem.fromJson(e as Map<String, dynamic>))
            .toList();
        notifyListeners();
      }
    } catch (e) {
      // Fallback default roles
      if (_roles.isEmpty) {
        _roles = [
          RoleItem(id: 1, roleName: "Admin", description: "Full system administration access"),
          RoleItem(id: 2, roleName: "Manager", description: "Sales & project team supervision"),
          RoleItem(id: 3, roleName: "Sales Representative", description: "Lead management and customer conversion"),
          RoleItem(id: 4, roleName: "Site Engineer", description: "Site surveys, inspections and field installations"),
        ];
        notifyListeners();
      }
    }
  }

  /// Create New User Account
  Future<Map<String, dynamic>> createUser({
    required String fullName,
    required String username,
    required String email,
    required String phone,
    required int roleId,
    int? managerId,
    required String password,
  }) async {
    try {
      final body = <String, dynamic>{
        'full_name': fullName.trim(),
        'username': username.trim().toLowerCase(),
        'email': email.trim().toLowerCase(),
        'phone': phone.trim(),
        'role_id': roleId,
        'password': password,
      };

      if (managerId != null && managerId > 0) {
        body['manager_id'] = managerId;
      }

      final response = await apiClient.dio.post(
        ApiConstants.users,
        data: body,
      );

      final resData = response.data;
      if (resData['success'] == true) {
        await fetchUsers(isRefresh: true);
        return {'success': true, 'message': resData['message'] ?? 'User created successfully.'};
      } else {
        return {'success': false, 'message': resData['message'] ?? 'Failed to create user.'};
      }
    } on DioException catch (e) {
      final msg = e.response?.data is Map && e.response?.data['message'] != null
          ? e.response?.data['message']
          : 'Failed to create user. Please check credentials.';
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'An error occurred: $e'};
    }
  }

  /// Update User
  Future<Map<String, dynamic>> updateUser({
    required int id,
    required String fullName,
    required String username,
    required String email,
    required String phone,
    required int roleId,
    int? managerId,
  }) async {
    try {
      final body = <String, dynamic>{
        'full_name': fullName.trim(),
        'username': username.trim().toLowerCase(),
        'email': email.trim().toLowerCase(),
        'phone': phone.trim(),
        'role_id': roleId,
      };

      if (managerId != null && managerId > 0) {
        body['manager_id'] = managerId;
      }

      final response = await apiClient.dio.put(
        "${ApiConstants.users}/$id",
        data: body,
      );

      final resData = response.data;
      if (resData['success'] == true) {
        await fetchUsers(isRefresh: true);
        return {'success': true, 'message': resData['message'] ?? 'User updated successfully.'};
      } else {
        return {'success': false, 'message': resData['message'] ?? 'Failed to update user.'};
      }
    } on DioException catch (e) {
      final msg = e.response?.data is Map && e.response?.data['message'] != null
          ? e.response?.data['message']
          : 'Failed to update user details.';
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'An error occurred: $e'};
    }
  }

  /// Toggle User Status (Active / Inactive)
  Future<Map<String, dynamic>> toggleUserStatus(int id, String currentStatus) async {
    final nextStatus = currentStatus.toLowerCase() == "active" ? "Inactive" : "Active";
    try {
      final response = await apiClient.dio.patch(
        "${ApiConstants.userStatus}/$id",
        data: {'status': nextStatus},
      );

      final resData = response.data;
      if (resData['success'] == true) {
        // Update locally
        final index = _users.indexWhere((u) => u.id == id);
        if (index != -1) {
          final u = _users[index];
          _users[index] = TeamUserModel(
            id: u.id,
            roleId: u.roleId,
            managerId: u.managerId,
            fullName: u.fullName,
            username: u.username,
            email: u.email,
            phone: u.phone,
            profileImage: u.profileImage,
            status: nextStatus,
            lastLogin: u.lastLogin,
            createdAt: u.createdAt,
            roleName: u.roleName,
            managerName: u.managerName,
          );
          notifyListeners();
        }
        return {'success': true, 'message': 'Status updated to $nextStatus.'};
      } else {
        return {'success': false, 'message': resData['message'] ?? 'Failed to update status.'};
      }
    } on DioException catch (e) {
      final msg = e.response?.data is Map && e.response?.data['message'] != null
          ? e.response?.data['message']
          : 'Failed to change status.';
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'An error occurred: $e'};
    }
  }

  /// Soft Delete User
  Future<Map<String, dynamic>> deleteUser(int id) async {
    try {
      final response = await apiClient.dio.delete("${ApiConstants.users}/$id");
      final resData = response.data;
      if (resData['success'] == true) {
        _users.removeWhere((u) => u.id == id);
        _totalRecords = _totalRecords > 0 ? _totalRecords - 1 : 0;
        notifyListeners();
        return {'success': true, 'message': 'User deleted successfully.'};
      } else {
        return {'success': false, 'message': resData['message'] ?? 'Failed to delete user.'};
      }
    } on DioException catch (e) {
      final msg = e.response?.data is Map && e.response?.data['message'] != null
          ? e.response?.data['message']
          : 'Failed to delete user.';
      return {'success': false, 'message': msg};
    } catch (e) {
      return {'success': false, 'message': 'An error occurred: $e'};
    }
  }
}

