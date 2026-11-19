import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/inspection_model.dart';
import '../models/installation_log_model.dart';
import '../models/project_model.dart';

class ProjectProvider extends ChangeNotifier {
  final ApiClient apiClient;

  List<ProjectModel> _projects = [];
  int _totalCount = 0;
  int _currentPage = 1;
  int _totalPages = 1;
  bool _isLoading = false;
  String? _errorMessage;

  ProjectStatsModel _stats = ProjectStatsModel();
  List<Map<String, dynamic>> _engineers = [];
  List<Map<String, dynamic>> _completedSurveys = [];
  bool _isLoadingSurveys = false;
  bool _isSubmitting = false;

  ProjectModel? _selectedProject;
  bool _isLoadingDetails = false;
  String? _detailsError;

  PreInstallInspectionModel? _currentInspection;
  bool _isLoadingInspection = false;
  String? _inspectionError;
  bool _isSavingInspection = false;

  List<InstallationLogModel> _installationLogs = [];
  bool _isLoadingInstallationLogs = false;
  String? _installationLogsError;
  int _installationProgressPercent = 0;
  List<String> _completedInstallationPhases = [];
  bool _isSavingInstallationLog = false;

  ProjectProvider({required this.apiClient});

  // Getters
  List<ProjectModel> get projects => _projects;
  int get totalCount => _totalCount;
  int get currentPage => _currentPage;
  int get totalPages => _totalPages;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  ProjectStatsModel get stats => _stats;
  List<Map<String, dynamic>> get engineers => _engineers;
  List<Map<String, dynamic>> get completedSurveys => _completedSurveys;
  bool get isLoadingSurveys => _isLoadingSurveys;
  bool get isSubmitting => _isSubmitting;
  ProjectModel? get selectedProject => _selectedProject;
  bool get isLoadingDetails => _isLoadingDetails;
  String? get detailsError => _detailsError;
  PreInstallInspectionModel? get currentInspection => _currentInspection;
  bool get isLoadingInspection => _isLoadingInspection;
  String? get inspectionError => _inspectionError;
  bool get isSavingInspection => _isSavingInspection;

  List<InstallationLogModel> get installationLogs => _installationLogs;
  bool get isLoadingInstallationLogs => _isLoadingInstallationLogs;
  String? get installationLogsError => _installationLogsError;
  int get installationProgressPercent => _installationProgressPercent;
  List<String> get completedInstallationPhases => _completedInstallationPhases;
  bool get isSavingInstallationLog => _isSavingInstallationLog;

  // 1. Fetch Paginated Projects
  Future<void> fetchProjects({
    String? search,
    String? stage,
    int? assignedTo,
    int page = 1,
    int limit = 20,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };

      if (search != null && search.trim().isNotEmpty) {
        queryParams['search'] = search.trim();
      }
      if (stage != null && stage != 'All' && stage.isNotEmpty) {
        queryParams['stage'] = stage;
      }
      if (assignedTo != null && assignedTo > 0) {
        queryParams['assigned_to'] = assignedTo;
      }

      final response = await apiClient.dio.get(
        ApiConstants.projects,
        queryParameters: queryParams,
      );

      if (response.data != null && response.data['success'] == true) {
        final data = response.data['data'];
        List rawList = [];
        if (data is Map && data['projects'] is List) {
          rawList = data['projects'] as List;
          _totalCount = data['total'] is int ? data['total'] as int : int.tryParse(data['total']?.toString() ?? '0') ?? rawList.length;
          _currentPage = data['page'] is int ? data['page'] as int : 1;
          _totalPages = data['totalPages'] is int ? data['totalPages'] as int : 1;
        } else if (data is List) {
          rawList = data;
          _totalCount = rawList.length;
        }

        _projects = rawList
            .map((item) => ProjectModel.fromJson(item as Map<String, dynamic>))
            .toList();
      } else {
        _errorMessage = response.data?['message'] ?? 'Failed to load projects';
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // 2. Fetch Project Stage Statistics
  Future<void> fetchStats() async {
    try {
      final response = await apiClient.dio.get(ApiConstants.projectStats);
      if (response.data != null && response.data['success'] == true) {
        final data = response.data['data'];
        if (data is List) {
          _stats = ProjectStatsModel.fromRows(data);
          notifyListeners();
        }
      }
    } catch (e) {
      debugPrint("Error fetching project stats: $e");
    }
  }

  // 3. Fetch Site Engineers for Assignment
  Future<void> fetchEngineers() async {
    try {
      final response = await apiClient.dio.get("/surveys/engineers");
      if (response.data != null && response.data['success'] == true) {
        final data = response.data['data'];
        if (data is List) {
          _engineers = List<Map<String, dynamic>>.from(data);
          notifyListeners();
        }
      }
    } catch (e) {
      debugPrint("Error fetching engineers: $e");
    }
  }

  // 4. Fetch Completed Surveys for Project Linking
  Future<void> fetchCompletedSurveys() async {
    _isLoadingSurveys = true;
    notifyListeners();
    try {
      final response = await apiClient.dio.get(ApiConstants.projectCompletedSurveys);
      if (response.data != null && response.data['success'] == true) {
        final data = response.data['data'];
        if (data is List) {
          _completedSurveys = List<Map<String, dynamic>>.from(data);
        }
      }
    } catch (e) {
      debugPrint("Error fetching completed surveys: $e");
    } finally {
      _isLoadingSurveys = false;
      notifyListeners();
    }
  }

  // 5. Create Project
  Future<Map<String, dynamic>> createProject(Map<String, dynamic> payload) async {
    _isSubmitting = true;
    notifyListeners();

    try {
      final response = await apiClient.dio.post(
        ApiConstants.projects,
        data: payload,
      );

      if (response.data != null && response.data['success'] == true) {
        await fetchProjects();
        await fetchStats();
        return {'success': true, 'message': response.data['message'] ?? 'Project created successfully'};
      }
      return {'success': false, 'message': response.data?['message'] ?? 'Failed to create project'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  // 6. Delete Project
  Future<Map<String, dynamic>> deleteProject(int projectId) async {
    try {
      final response = await apiClient.dio.delete(ApiConstants.projectDetails(projectId));
      if (response.data != null && response.data['success'] == true) {
        await fetchProjects();
        await fetchStats();
        return {'success': true, 'message': response.data['message'] ?? 'Project deleted'};
      }
      return {'success': false, 'message': response.data?['message'] ?? 'Delete failed'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  // 7. Update Project Stage
  Future<Map<String, dynamic>> updateProjectStage(dynamic projectId, String newStage, {String? notes}) async {
    try {
      final response = await apiClient.dio.put(
        ApiConstants.projectUpdateStage(projectId),
        data: {
          'stage': newStage,
          if (notes != null && notes.isNotEmpty) 'notes': notes,
        },
      );
      if (response.data != null && response.data['success'] == true) {
        await fetchProjectDetails(projectId);
        fetchProjects();
        fetchStats();
        return {'success': true, 'message': response.data['message'] ?? 'Stage updated'};
      }
      return {'success': false, 'message': response.data?['message'] ?? 'Update failed'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  // 8. Fetch Project Details by ID or Number
  Future<void> fetchProjectDetails(dynamic id) async {
    _isLoadingDetails = true;
    _detailsError = null;
    notifyListeners();

    try {
      final response = await apiClient.dio.get(ApiConstants.projectDetails(id));
      if (response.data != null && response.data['success'] == true && response.data['data'] != null) {
        _selectedProject = ProjectModel.fromJson(response.data['data'] as Map<String, dynamic>);
      } else {
        _detailsError = response.data?['message'] ?? 'Project not found';
      }
    } catch (e) {
      _detailsError = e.toString();
    } finally {
      _isLoadingDetails = false;
      notifyListeners();
    }
  }

  // 9. Update Project Details
  Future<Map<String, dynamic>> updateProject(dynamic id, Map<String, dynamic> data) async {
    _isSubmitting = true;
    notifyListeners();

    try {
      final response = await apiClient.dio.put(
        ApiConstants.projectDetails(id),
        data: data,
      );

      if (response.data != null && response.data['success'] == true) {
        await fetchProjectDetails(id);
        fetchProjects();
        return {'success': true, 'message': response.data['message'] ?? 'Project updated successfully'};
      }
      return {'success': false, 'message': response.data?['message'] ?? 'Failed to update project'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  // 10. Fetch Inspection Data
  Future<void> fetchInspection(dynamic projectId) async {
    _isLoadingInspection = true;
    _inspectionError = null;
    notifyListeners();

    try {
      final response = await apiClient.dio.get(ApiConstants.projectInspection(projectId));
      final raw = response.data;
      final data = (raw is Map && raw['inspection'] != null)
          ? raw['inspection']
          : ((raw is Map && raw['data'] != null) ? raw['data'] : raw);

      if (data is Map<String, dynamic> && (data['id'] != null || data['project_id'] != null || data['is_prefilled'] == true)) {
        _currentInspection = PreInstallInspectionModel.fromJson(data);
      } else {
        _currentInspection = null;
      }
    } catch (e) {
      _currentInspection = null;
      _inspectionError = e.toString();
    } finally {
      _isLoadingInspection = false;
      notifyListeners();
    }
  }

  // 11. Save or Update Inspection
  Future<Map<String, dynamic>> saveInspection(dynamic projectId, Map<String, dynamic> payload) async {
    _isSavingInspection = true;
    notifyListeners();

    try {
      final endpoint = ApiConstants.projectInspection(projectId);
      final response = (_currentInspection != null && _currentInspection!.id != null)
          ? await apiClient.dio.put(endpoint, data: payload)
          : await apiClient.dio.post(endpoint, data: payload);

      if (response.data != null && (response.data['success'] == true || response.data['inspection'] != null || response.data['data'] != null)) {
        await fetchInspection(projectId);
        await fetchProjectDetails(projectId);
        return {
          'success': true,
          'message': response.data['message'] ?? 'Pre-Installation Inspection saved successfully!'
        };
      }
      return {
        'success': false,
        'message': response.data?['message'] ?? 'Failed to save pre-installation inspection.'
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    } finally {
      _isSavingInspection = false;
      notifyListeners();
    }
  }

  // 12. Fetch Installation Logs
  Future<void> fetchInstallationLogs(dynamic projectId) async {
    _isLoadingInstallationLogs = true;
    _installationLogsError = null;
    notifyListeners();

    try {
      final response = await apiClient.dio.get(ApiConstants.projectInstallationLogs(projectId));
      final raw = response.data;
      final data = (raw is Map && raw['data'] != null) ? raw['data'] : raw;

      List rawLogs = [];
      if (data is Map && data['logs'] is List) {
        rawLogs = data['logs'] as List;
        _installationProgressPercent = data['currentProgress'] is int
            ? data['currentProgress'] as int
            : int.tryParse(data['currentProgress']?.toString() ?? '0') ?? 0;
        if (data['completedPhases'] is List) {
          _completedInstallationPhases = (data['completedPhases'] as List).map((e) => e.toString()).toList();
        }
      } else if (data is List) {
        rawLogs = data;
        _installationProgressPercent = rawLogs.isNotEmpty
            ? rawLogs.map((e) => int.tryParse(e['progress_percent']?.toString() ?? '0') ?? 0).reduce((a, b) => a > b ? a : b)
            : 0;
      }

      _installationLogs = rawLogs
          .whereType<Map<String, dynamic>>()
          .map((m) => InstallationLogModel.fromJson(m))
          .toList();

      if (_completedInstallationPhases.isEmpty) {
        _completedInstallationPhases = _installationLogs
            .where((l) => l.isPhaseCompleted && l.phase != null)
            .map((l) => l.phase!)
            .toSet()
            .toList();
      }
    } catch (e) {
      _installationLogsError = e.toString();
      _installationLogs = [];
    } finally {
      _isLoadingInstallationLogs = false;
      notifyListeners();
    }
  }

  // 13. Save or Update Installation Log
  Future<Map<String, dynamic>> saveInstallationLog(
    dynamic projectId,
    Map<String, dynamic> payload, {
    int? logId,
    List<File>? photos,
    List<Map<String, String>>? photoCaptions,
  }) async {
    _isSavingInstallationLog = true;
    notifyListeners();

    try {
      final isEdit = logId != null;
      final url = isEdit
          ? ApiConstants.projectInstallationLogDetail(projectId, logId)
          : ApiConstants.projectInstallationLogs(projectId);

      final response = isEdit
          ? await apiClient.dio.put(url, data: payload)
          : await apiClient.dio.post(url, data: payload);

      int? targetLogId = logId;
      if (!isEdit && response.data != null) {
        targetLogId = response.data['id'] is int
            ? response.data['id']
            : int.tryParse(response.data['id']?.toString() ?? '');
      }

      // Sync expected completion date to project if provided
      if (payload['expected_completion_date'] != null &&
          payload['expected_completion_date'].toString().trim().isNotEmpty) {
        try {
          await apiClient.dio.put(
            ApiConstants.projectDetails(projectId),
            data: {'installation_end_date': payload['expected_completion_date']},
          );
        } catch (_) {}
      }

      // Upload photos if any
      if (photos != null && photos.isNotEmpty && targetLogId != null) {
        try {
          final formData = FormData();
          for (var i = 0; i < photos.length; i++) {
            final f = photos[i];
            formData.files.add(MapEntry(
              'photos',
              await MultipartFile.fromFile(f.path, filename: f.path.split(Platform.pathSeparator).last),
            ));
          }
          if (photoCaptions != null && photoCaptions.isNotEmpty) {
            formData.fields.add(MapEntry('captions', jsonEncode(photoCaptions)));
          }

          await apiClient.dio.post(
            ApiConstants.projectInstallationLogPhotos(projectId, targetLogId),
            data: formData,
          );
        } catch (photoErr) {
          debugPrint('Error uploading installation photos: $photoErr');
        }
      }

      await fetchInstallationLogs(projectId);
      await fetchProjectDetails(projectId);

      return {
        'success': true,
        'message': isEdit
            ? 'Installation log updated successfully!'
            : 'Daily installation progress log saved successfully!',
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    } finally {
      _isSavingInstallationLog = false;
      notifyListeners();
    }
  }

  // 14. Quick Update Target Date
  Future<Map<String, dynamic>> updateProjectTargetDate(dynamic projectId, String targetDate) async {
    try {
      final response = await apiClient.dio.put(
        ApiConstants.projectDetails(projectId),
        data: {'installation_end_date': targetDate},
      );
      await fetchProjectDetails(projectId);
      await fetchInstallationLogs(projectId);
      return {
        'success': true,
        'message': response.data?['message'] ?? 'Target completion date updated successfully!',
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }
}

