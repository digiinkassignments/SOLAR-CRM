import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import '../storage/storage_service.dart';

class ApiClient {
  late Dio dio;
  String? currentWorkspace;

  /// Global callback invoked on HTTP 401 Unauthorized responses
  static void Function()? onUnauthorized;

  ApiClient() {
    dio = Dio(
      BaseOptions(
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 20),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Attach Bearer Token if available
          final token = await StorageService.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }

          // If Host header or workspace URL needs verification
          if (currentWorkspace != null && currentWorkspace!.isNotEmpty) {
            options.headers['X-Workspace-Subdomain'] = currentWorkspace;
          }

          return handler.next(options);
        },
        onError: (DioException e, handler) {
          if (e.response?.statusCode == 401) {
            final path = e.requestOptions.path;
            final isAuthCheck = path.contains(ApiConstants.login) ||
                path.contains(ApiConstants.tenantInfo) ||
                path.contains(ApiConstants.forgotPassword) ||
                path.contains(ApiConstants.resetPassword);
            if (!isAuthCheck) {
              onUnauthorized?.call();
            }
          }
          return handler.next(e);
        },
      ),
    );
  }

  /// Update the base URL dynamically based on workspace code
  void setWorkspace(String workspace) {
    currentWorkspace = workspace.trim().toLowerCase();
    dio.options.baseUrl = ApiConstants.getBaseUrl(currentWorkspace!);
  }
}

