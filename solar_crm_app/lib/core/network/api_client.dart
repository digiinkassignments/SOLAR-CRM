import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import '../storage/storage_service.dart';

class ApiClient {
  late Dio dio;
  String? currentWorkspace;

  /// Global session epoch counter to discard late responses from previous sessions
  static int sessionGeneration = 0;

  /// Global cancel token actively cancelling pending requests on logout
  static CancelToken _sessionCancelToken = CancelToken();

  /// Global callback invoked on HTTP 401 Unauthorized responses
  static void Function()? onUnauthorized;

  /// Invalidate active session: cancels pending requests & bumps session generation
  static void invalidateSession() {
    sessionGeneration++;
    try {
      if (!_sessionCancelToken.isCancelled) {
        _sessionCancelToken.cancel("Session invalidated");
      }
    } catch (_) {}
    _sessionCancelToken = CancelToken();
  }

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
          // Attach session cancellation and generation check
          options.cancelToken ??= _sessionCancelToken;
          options.extra['sessionGeneration'] = sessionGeneration;

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
        onResponse: (response, handler) {
          final reqGen = response.requestOptions.extra['sessionGeneration'];
          if (reqGen != null && reqGen != sessionGeneration) {
            // Late response arriving after logout or session switch: discard
            return handler.reject(
              DioException(
                requestOptions: response.requestOptions,
                error: "Late response ignored due to session invalidation.",
                type: DioExceptionType.cancel,
              ),
            );
          }
          return handler.next(response);
        },
        onError: (DioException e, handler) {
          if (e.type == DioExceptionType.cancel || e.error == "Session invalidated") {
            return handler.next(e);
          }
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

