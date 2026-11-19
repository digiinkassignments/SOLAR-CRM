import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/commissioning_model.dart';
import '../models/customer_handover_model.dart';
import '../models/final_inspection_model.dart';
import '../models/inspection_model.dart';
import '../models/installation_log_model.dart';
import '../models/project_model.dart';
import '../models/warranty_amc_model.dart';
import 'auth_provider.dart';

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

  ProjectProvider({required this.apiClient}) {
    AuthProvider.registerResetCallback(reset);
  }

  /// Reset all project cached state on logout
  void reset() {
    _projects = [];
    _totalCount = 0;
    _currentPage = 1;
    _totalPages = 1;
    _isLoading = false;
    _errorMessage = null;
    _stats = ProjectStatsModel();
    _engineers = [];
    _completedSurveys = [];
    _isLoadingSurveys = false;
    _isSubmitting = false;
    _selectedProject = null;
    _isLoadingDetails = false;
    _detailsError = null;
    _currentInspection = null;
    _isLoadingInspection = false;
    _inspectionError = null;
    _isSavingInspection = false;
    _installationLogs = [];
    _isLoadingInstallationLogs = false;
    _installationLogsError = null;
    _installationProgressPercent = 0;
    _completedInstallationPhases = [];
    _isSavingInstallationLog = false;
    _commissioning = null;
    _isLoadingCommissioning = false;
    _finalInspection = null;
    _isLoadingFinalInspection = false;
    _customerHandover = null;
    _isLoadingCustomerHandover = false;
    _warrantyAmc = null;
    _serviceVisits = [];
    _companyAmcPlans = [];
    _isLoadingWarrantyAmc = false;
    _isLoadingAmcPlans = false;
    notifyListeners();
  }

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

  // 15. Commissioning State & API Methods
  CommissioningModel? _commissioning;
  bool _isLoadingCommissioning = false;
  CommissioningModel? get commissioning => _commissioning;
  bool get isLoadingCommissioning => _isLoadingCommissioning;

  Future<void> fetchCommissioning(dynamic projectId) async {
    _isLoadingCommissioning = true;
    notifyListeners();
    try {
      final res = await apiClient.dio.get(ApiConstants.projectCommissioning(projectId));
      final raw = res.data;
      final data = raw?['commissioning'] ?? raw?['data'] ?? raw;
      if (data != null && (data['id'] != null || data['project_id'] != null || data['overall_result'] != null)) {
        _commissioning = CommissioningModel.fromJson(Map<String, dynamic>.from(data));
      } else {
        _commissioning = null;
      }
    } catch (e) {
      debugPrint("fetchCommissioning error: $e");
      _commissioning = null;
    } finally {
      _isLoadingCommissioning = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> saveCommissioning(dynamic projectId, Map<String, dynamic> data, {bool isUpdate = false}) async {
    try {
      final url = ApiConstants.projectCommissioning(projectId);
      final res = isUpdate
          ? await apiClient.dio.put(url, data: data)
          : await apiClient.dio.post(url, data: data);

      await fetchCommissioning(projectId);
      await fetchProjectDetails(projectId);

      return {
        'success': true,
        'message': res.data?['message'] ?? 'Commissioning report saved successfully!',
        'commissioning': _commissioning,
      };
    } catch (e) {
      debugPrint("saveCommissioning error: $e");
      return {'success': false, 'message': e.toString()};
    }
  }

  // 16. Final QA & Pre-Handover Inspection State & Methods
  FinalInspectionModel? _finalInspection;
  bool _isLoadingFinalInspection = false;
  FinalInspectionModel? get finalInspection => _finalInspection;
  bool get isLoadingFinalInspection => _isLoadingFinalInspection;

  Future<void> fetchFinalInspection(dynamic projectId) async {
    _isLoadingFinalInspection = true;
    notifyListeners();

    try {
      final res = await apiClient.dio.get(ApiConstants.projectFinalInspection(projectId));
      final raw = res.data;
      final data = raw?['finalInspection'] ?? raw?['inspection'] ?? raw?['data'] ?? raw;
      if (data != null && data is Map && (data['id'] != null || data['project_id'] != null || data['inspection_status'] != null)) {
        _finalInspection = FinalInspectionModel.fromJson(Map<String, dynamic>.from(data));
      } else {
        _finalInspection = null;
      }
    } catch (e) {
      debugPrint("fetchFinalInspection error: $e");
      _finalInspection = null;
    } finally {
      _isLoadingFinalInspection = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> saveFinalInspection(dynamic projectId, Map<String, dynamic> data, {bool isUpdate = false}) async {
    try {
      final url = ApiConstants.projectFinalInspection(projectId);
      final res = isUpdate
          ? await apiClient.dio.put(url, data: data)
          : await apiClient.dio.post(url, data: data);

      await fetchFinalInspection(projectId);
      await fetchProjectDetails(projectId);

      return {
        'success': true,
        'message': res.data?['message'] ?? 'Final QA Inspection saved successfully!',
        'finalInspection': _finalInspection,
      };
    } catch (e) {
      debugPrint("saveFinalInspection error: $e");
      String errorMsg = e.toString();
      if (e is DioException) {
        errorMsg = e.response?.data?['message'] ?? e.message ?? errorMsg;
      }
      return {'success': false, 'message': errorMsg};
    }
  }

  // 17. Customer Handover State & Methods
  CustomerHandoverModel? _customerHandover;
  bool _isLoadingCustomerHandover = false;
  CustomerHandoverModel? get customerHandover => _customerHandover;
  bool get isLoadingCustomerHandover => _isLoadingCustomerHandover;

  Future<void> fetchCustomerHandover(dynamic projectId) async {
    _isLoadingCustomerHandover = true;
    notifyListeners();

    try {
      final res = await apiClient.dio.get(ApiConstants.projectHandover(projectId));
      final raw = res.data;
      final data = raw?['handover'] ?? raw?['data'] ?? raw;
      if (data != null && data is Map && (data['id'] != null || data['project_id'] != null || data['handover_status'] != null)) {
        _customerHandover = CustomerHandoverModel.fromJson(Map<String, dynamic>.from(data));
      } else {
        _customerHandover = null;
      }
    } catch (e) {
      debugPrint("fetchCustomerHandover error: $e");
      _customerHandover = null;
    } finally {
      _isLoadingCustomerHandover = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> saveCustomerHandover(dynamic projectId, Map<String, dynamic> data, {bool isUpdate = false}) async {
    try {
      final url = ApiConstants.projectHandover(projectId);
      final res = isUpdate
          ? await apiClient.dio.put(url, data: data)
          : await apiClient.dio.post(url, data: data);

      await fetchCustomerHandover(projectId);
      await fetchProjectDetails(projectId);

      return {
        'success': true,
        'message': res.data?['message'] ?? 'Customer Handover saved successfully!',
        'handover': _customerHandover,
      };
    } catch (e) {
      debugPrint("saveCustomerHandover error: $e");
      String errorMsg = e.toString();
      if (e is DioException) {
        errorMsg = e.response?.data?['message'] ?? e.message ?? errorMsg;
      }
      return {'success': false, 'message': errorMsg};
    }
  }

  // 18. Warranty & AMC State & Methods
  WarrantyAmcModel? _warrantyAmc;
  List<ServiceVisitModel> _serviceVisits = [];
  List<CompanyAmcPlanModel> _companyAmcPlans = [];
  bool _isLoadingWarrantyAmc = false;
  bool _isLoadingAmcPlans = false;

  WarrantyAmcModel? get warrantyAmc => _warrantyAmc;
  List<ServiceVisitModel> get serviceVisits => _serviceVisits;
  List<CompanyAmcPlanModel> get companyAmcPlans => _companyAmcPlans;
  bool get isLoadingWarrantyAmc => _isLoadingWarrantyAmc;
  bool get isLoadingAmcPlans => _isLoadingAmcPlans;

  Future<void> fetchWarrantyAmc(dynamic projectId) async {
    _isLoadingWarrantyAmc = true;
    notifyListeners();

    try {
      final res = await apiClient.dio.get(ApiConstants.projectWarranty(projectId));
      final raw = res.data;
      final wData = raw?['warranty'];
      final vData = raw?['visits'];

      if (wData != null && wData is Map && (wData['id'] != null || wData['project_id'] != null || wData['warranty_certificate_no'] != null)) {
        _warrantyAmc = WarrantyAmcModel.fromJson(Map<String, dynamic>.from(wData));
      } else {
        _warrantyAmc = null;
      }

      if (vData != null && vData is List) {
        _serviceVisits = vData.map((e) => ServiceVisitModel.fromJson(Map<String, dynamic>.from(e))).toList();
      } else {
        _serviceVisits = [];
      }
    } catch (e) {
      debugPrint("fetchWarrantyAmc error: $e");
      _warrantyAmc = null;
      _serviceVisits = [];
    } finally {
      _isLoadingWarrantyAmc = false;
      notifyListeners();
    }
  }

  Future<void> fetchCompanyAmcPlans() async {
    _isLoadingAmcPlans = true;
    notifyListeners();

    try {
      final res = await apiClient.dio.get(ApiConstants.amcPlans);
      final raw = res.data;
      final plans = raw?['plans'];
      if (plans != null && plans is List) {
        _companyAmcPlans = plans.map((e) => CompanyAmcPlanModel.fromJson(Map<String, dynamic>.from(e))).toList();
      } else {
        _companyAmcPlans = [];
      }
    } catch (e) {
      debugPrint("fetchCompanyAmcPlans error: $e");
      _companyAmcPlans = [];
    } finally {
      _isLoadingAmcPlans = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> saveCompanyAmcPlan({
    required Map<String, dynamic> data,
    int? planId,
  }) async {
    try {
      if (planId != null && planId > 0) {
        await apiClient.dio.put('${ApiConstants.amcPlans}/$planId', data: data);
      } else {
        await apiClient.dio.post(ApiConstants.amcPlans, data: data);
      }
      await fetchCompanyAmcPlans();
      return {'success': true, 'message': 'Company AMC plan saved successfully!'};
    } catch (e) {
      debugPrint("saveCompanyAmcPlan error: $e");
      String errorMsg = e.toString();
      if (e is DioException) {
        errorMsg = e.response?.data?['message'] ?? e.message ?? errorMsg;
      }
      return {'success': false, 'message': errorMsg};
    }
  }

  Future<Map<String, dynamic>> recordHandoverPayment(
    dynamic projectId, {
    required double contractValue,
    required double totalPaid,
    required String paymentMode,
    String? paymentRef,
    CustomerHandoverModel? currentHandover,
  }) async {
    try {
      final balance = (contractValue - totalPaid).clamp(0.0, double.infinity);
      final paymentStatus = (contractValue > 0 && balance == 0)
          ? "Completed"
          : (totalPaid > 0 ? "Partial" : "Pending");

      // 1. Update project commercial fields
      await apiClient.dio.put(
        ApiConstants.projectDetails(projectId),
        data: {
          'total_cost': contractValue,
          'amount_received': totalPaid,
          'payment_status': paymentStatus,
        },
      );

      // 2. Update handover commercial fields
      final handoverMap = currentHandover != null ? currentHandover.toJson() : <String, dynamic>{};
      handoverMap['contract_value'] = contractValue;
      handoverMap['amount_paid'] = totalPaid;
      handoverMap['balance_due'] = balance;
      handoverMap['payment_status'] = paymentStatus;

      final handoverUrl = ApiConstants.projectHandover(projectId);
      if (currentHandover != null && (currentHandover.id ?? 0) > 0) {
        await apiClient.dio.put(handoverUrl, data: handoverMap);
      } else {
        await apiClient.dio.post(handoverUrl, data: handoverMap);
      }

      await fetchProjectDetails(projectId);
      await fetchCustomerHandover(projectId);

      return {
        'success': true,
        'balance': balance,
        'message': balance == 0
            ? "Payment updated: 100% Cleared! Customer Handover is now commercially unlocked."
            : "Payment updated: Recorded. Remaining balance: ₹${balance.toStringAsFixed(0)}.",
      };
    } catch (e) {
      debugPrint("recordHandoverPayment error: $e");
      String errorMsg = e.toString();
      if (e is DioException) {
        errorMsg = e.response?.data?['message'] ?? e.message ?? errorMsg;
      }
      return {'success': false, 'message': errorMsg};
    }
  }

  Future<Map<String, dynamic>> saveWarrantyAmc(dynamic projectId, Map<String, dynamic> data) async {
    try {
      final url = ApiConstants.projectWarranty(projectId);
      final res = await apiClient.dio.post(url, data: data);

      await fetchWarrantyAmc(projectId);
      await fetchProjectDetails(projectId);

      return {
        'success': true,
        'message': res.data?['message'] ?? 'Warranty & AMC saved successfully!',
        'warranty': _warrantyAmc,
      };
    } catch (e) {
      debugPrint("saveWarrantyAmc error: $e");
      String errorMsg = e.toString();
      if (e is DioException) {
        errorMsg = e.response?.data?['message'] ?? e.message ?? errorMsg;
      }
      return {'success': false, 'message': errorMsg};
    }
  }

  Future<bool> toggleScheduledVisit(dynamic projectId, dynamic visitId) async {
    if (_warrantyAmc == null) return false;
    final currentVisits = List<ScheduledVisitModel>.from(_warrantyAmc!.scheduledVisits);
    final idx = currentVisits.indexWhere((v) => v.id == visitId);
    if (idx == -1) return false;

    final target = currentVisits[idx];
    final nextStatus = target.status == 'Completed' ? 'Scheduled' : 'Completed';
    final nowStr = DateTime.now().toIso8601String().substring(0, 10);
    final updated = target.copyWith(
      status: nextStatus,
      completedDate: nextStatus == 'Completed' ? nowStr : null,
    );

    currentVisits[idx] = updated;

    // Optimistically update local model
    _warrantyAmc = WarrantyAmcModel(
      id: _warrantyAmc!.id,
      projectId: _warrantyAmc!.projectId,
      warrantyCertificateNo: _warrantyAmc!.warrantyCertificateNo,
      panelWarrantyYears: _warrantyAmc!.panelWarrantyYears,
      panelProductWarrantyYears: _warrantyAmc!.panelProductWarrantyYears,
      panelProductWarrantyEnd: _warrantyAmc!.panelProductWarrantyEnd,
      panelPerformanceWarrantyYears: _warrantyAmc!.panelPerformanceWarrantyYears,
      panelPerformanceWarrantyEnd: _warrantyAmc!.panelPerformanceWarrantyEnd,
      inverterWarrantyYears: _warrantyAmc!.inverterWarrantyYears,
      inverterWarrantyEnd: _warrantyAmc!.inverterWarrantyEnd,
      installationWarrantyYears: _warrantyAmc!.installationWarrantyYears,
      installationWarrantyEnd: _warrantyAmc!.installationWarrantyEnd,
      warrantyStartDate: _warrantyAmc!.warrantyStartDate,
      warrantyEndDate: _warrantyAmc!.warrantyEndDate,
      freeServiceEndDate: _warrantyAmc!.freeServiceEndDate,
      amcStartDate: _warrantyAmc!.amcStartDate,
      amcEndDate: _warrantyAmc!.amcEndDate,
      amcPlan: _warrantyAmc!.amcPlan,
      amcPlanId: _warrantyAmc!.amcPlanId,
      amcPlanSnapshot: _warrantyAmc!.amcPlanSnapshot,
      amcAmount: _warrantyAmc!.amcAmount,
      amcPaymentStatus: _warrantyAmc!.amcPaymentStatus,
      amcRenewalDate: _warrantyAmc!.amcRenewalDate,
      visitFrequency: _warrantyAmc!.visitFrequency,
      panelSerialNumbers: _warrantyAmc!.panelSerialNumbers,
      inverterSerialNumber: _warrantyAmc!.inverterSerialNumber,
      monitoringPortalUrl: _warrantyAmc!.monitoringPortalUrl,
      monitoringPlantId: _warrantyAmc!.monitoringPlantId,
      monitoringUsername: _warrantyAmc!.monitoringUsername,
      warrantyDocketUrl: _warrantyAmc!.warrantyDocketUrl,
      scheduledVisits: currentVisits,
      createdBy: _warrantyAmc!.createdBy,
      createdAt: _warrantyAmc!.createdAt,
      updatedAt: _warrantyAmc!.updatedAt,
    );
    notifyListeners();

    try {
      final payload = _warrantyAmc!.toJson();
      await apiClient.dio.post(ApiConstants.projectWarranty(projectId), data: payload);
      await fetchWarrantyAmc(projectId);
      return true;
    } catch (e) {
      debugPrint("toggleScheduledVisit error: $e");
      await fetchWarrantyAmc(projectId);
      return false;
    }
  }

  Future<Map<String, dynamic>> addServiceVisit(dynamic projectId, Map<String, dynamic> visitData) async {
    try {
      final url = ApiConstants.projectWarrantyVisits(projectId);
      final res = await apiClient.dio.post(url, data: visitData);

      await fetchWarrantyAmc(projectId);

      return {
        'success': true,
        'message': res.data?['message'] ?? 'Service visit logged successfully!',
      };
    } catch (e) {
      debugPrint("addServiceVisit error: $e");
      String errorMsg = e.toString();
      if (e is DioException) {
        errorMsg = e.response?.data?['message'] ?? e.message ?? errorMsg;
      }
      return {'success': false, 'message': errorMsg};
    }
  }
}

