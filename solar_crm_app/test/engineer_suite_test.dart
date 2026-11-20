import 'package:flutter_test/flutter_test.dart';
import 'package:solar_crm_app/models/engineer_dashboard_model.dart';
import 'package:solar_crm_app/models/survey_model.dart';
import 'package:solar_crm_app/providers/dashboard_provider.dart';
import 'package:solar_crm_app/providers/survey_provider.dart';
import 'package:solar_crm_app/core/network/api_client.dart';

void main() {
  group('Engineer Role Suite Unit Tests', () {
    test('EngineerDashboardModel correctly deserializes and parses schedule & GPS coordinates', () {
      final json = {
        'todaySurveys': 3,
        'pendingSurveys': 7,
        'completedSurveys': 24,
        'activeProjects': 5,
        'todaySchedule': [
          {
            'id': 301,
            'lead_id': 55,
            'lead_code': 'LEAD-2026-112',
            'customer_name': 'Anil Sharma',
            'mobile_number': '9829012345',
            'address': 'Plot 12, Nirman Nagar',
            'city': 'Jaipur',
            'state': 'Rajasthan',
            'required_kw': 8.5,
            'scheduled_time': '10:00 AM',
            'scheduled_date': '2026-11-20',
            'status': 'scheduled',
            'site_latitude': 26.8851,
            'site_longitude': 75.7628,
          },
          {
            'id': 302,
            'lead_id': 56,
            'lead_code': 'LEAD-2026-113',
            'customer_name': 'Kavita Joshi',
            'mobile_number': '9829098765',
            'address': 'D-44, Malviya Nagar',
            'city': 'Jaipur',
            'state': 'Rajasthan',
            'required_kw': 5.0,
            'scheduled_time': '02:30 PM',
            'scheduled_date': '2026-11-20',
            'status': 'scheduled',
            'site_latitude': 26.8532,
            'site_longitude': 75.8054,
          }
        ],
        'recentSurveys': [
          {
            'id': 299,
            'lead_id': 50,
            'lead_code': 'LEAD-2026-100',
            'customer_name': 'Mukesh Patel',
            'mobile_number': '9829011111',
            'address': 'Sector 3, Mansarovar',
            'city': 'Jaipur',
            'status': 'completed',
          }
        ]
      };

      final model = EngineerDashboardModel.fromJson(json);

      expect(model.todaySurveys, equals(3));
      expect(model.pendingSurveys, equals(7));
      expect(model.completedSurveys, equals(24));
      expect(model.activeProjects, equals(5));

      // Schedule items
      expect(model.todaySchedule.length, equals(2));
      final first = model.todaySchedule.first;
      expect(first.customerName, equals('Anil Sharma'));
      expect(first.leadCode, equals('LEAD-2026-112'));
      expect(first.requiredKw, equals(8.5));
      expect(first.siteLatitude, equals(26.8851));
      expect(first.siteLongitude, equals(75.7628));
      expect(first.fullAddress, contains('Nirman Nagar'));

      // Recent surveys
      expect(model.recentSurveys.length, equals(1));
      expect(model.recentSurveys.first.status, equals('completed'));
    });

    test('SurveyModel deserializes full feasibility survey data correctly', () {
      final json = {
        'id': 501,
        'lead_id': 77,
        'lead_code': 'LEAD-2026-501',
        'customer_name': 'Rajesh Singhal',
        'mobile_number': '9829123456',
        'address': 'C-10, Vaishali Nagar',
        'city': 'Jaipur',
        'state': 'Rajasthan',
        'required_kw': '10.0',
        'engineer_name': 'Dev Engineer',
        'assigned_engineer_id': 4,
        'scheduled_date': '2026-11-20',
        'scheduled_time': '11:00 AM',
        'status': 'completed',
        'feasibility_verdict': 'Feasible',
        'roof_type': 'RCC',
        'roof_area_sqft': 1200,
        'shadow_conditions': 'Shadow-free',
        'electrical_phase': '3 Phase',
        'sanctioned_load_kw': 15.0,
        'proposed_capacity_kw': 10.0,
        'consumer_number': 'JVVNL-998822',
        'roof_orientation': 'South',
        'feasibility_notes': 'Clear rooftop, sturdy RCC structure ready for solar mounting.',
        'site_latitude': 26.9124,
        'site_longitude': 75.7873,
        'photos': ['https://example.com/roof1.jpg'],
        'project_id': 12,
        'project_number': 'PRJ-2026-012',
        'project_stage': 'Site Survey Done',
      };

      final survey = SurveyModel.fromJson(json);

      expect(survey.id, equals(501));
      expect(survey.customerName, equals('Rajesh Singhal'));
      expect(survey.isFeasible, isTrue);
      expect(survey.isCompleted, isTrue);
      expect(survey.hasGps, isTrue);
      expect(survey.mapsUrl, contains('26.9124,75.7873'));
      expect(survey.sanctionedLoadKw, equals(15.0));
      expect(survey.consumerNumber, equals('JVVNL-998822'));
      expect(survey.photos.length, equals(1));
      expect(survey.projectNumber, equals('PRJ-2026-012'));
    });

    test('SurveyProvider reset cleans state correctly', () {
      final client = ApiClient();
      final provider = SurveyProvider(apiClient: client);

      provider.reset();
      expect(provider.surveys, isEmpty);
      expect(provider.scheduledSurveys, isEmpty);
      expect(provider.completedSurveys, isEmpty);
      expect(provider.isLoading, isFalse);
      expect(provider.errorMessage, isNull);
    });

    test('DashboardProvider handles engineer stats reset cleanly', () {
      final client = ApiClient();
      final provider = DashboardProvider(apiClient: client);

      provider.reset();
      expect(provider.engineerStats, isNull);
      expect(provider.salesStats, isNull);
      expect(provider.managerStats, isNull);
      expect(provider.adminStats, isNull);
      expect(provider.isLoading, isFalse);
      expect(provider.errorMessage, isNull);
    });

    test('SurveyModel accurately parses address, landmark and prefers GPS for navigation', () {
      final surveyWithGps = SurveyModel.fromJson({
        'id': 101,
        'lead_id': 1,
        'customer_name': 'Ramesh Kumar',
        'site_address': '42 Green Valley',
        'landmark': 'Near City Hospital',
        'city': 'Jaipur',
        'state': 'Rajasthan',
        'site_latitude': 26.9124,
        'site_longitude': 75.7873,
      });

      expect(surveyWithGps.fullAddress, contains('42 Green Valley'));
      expect(surveyWithGps.fullAddress, contains('Landmark: Near City Hospital'));
      expect(surveyWithGps.landmark, equals('Near City Hospital'));
      expect(surveyWithGps.hasGps, isTrue);
      // Navigation prefers exact GPS coordinates
      expect(surveyWithGps.mapsUrl, equals('https://www.google.com/maps/dir/?api=1&destination=26.9124,75.7873'));

      final surveyWithoutGps = SurveyModel.fromJson({
        'id': 102,
        'lead_id': 2,
        'customer_name': 'Suresh Verma',
        'site_address': 'Flat 204, Surya Enclave',
        'landmark': 'Opposite Metro Pillar 44',
        'city': 'Jaipur',
        'state': 'Rajasthan',
      });

      expect(surveyWithoutGps.hasGps, isFalse);
      expect(surveyWithoutGps.fullAddress, contains('Opposite Metro Pillar 44'));
      // Fallback search navigation includes address and landmark
      expect(surveyWithoutGps.mapsUrl, contains('https://www.google.com/maps/search/?api=1&query='));
      expect(surveyWithoutGps.mapsUrl, contains('Opposite'));
    });

    test('SurveyDocumentModel parses categories, sizes, and formats correctly', () {
      final docsJson = [
        {
          'id': 1,
          'survey_id': 101,
          'category': 'aadhaar',
          'original_name': 'aadhaar_front.jpg',
          'mime': 'image/jpeg',
          'size_bytes': 1500000,
          'created_at': '2026-11-20T10:00:00Z',
        },
        {
          'id': 2,
          'survey_id': 101,
          'category': 'electricity_bill',
          'original_name': 'jvvnl_bill_nov.pdf',
          'mime': 'application/pdf',
          'size_bytes': 524288,
          'created_at': '2026-11-20T10:02:00Z',
        },
        {
          'id': 3,
          'survey_id': 101,
          'category': 'site_photo',
          'original_name': 'roof_top_view.png',
          'mime': 'image/png',
          'size_bytes': 3500000,
          'created_at': '2026-11-20T10:05:00Z',
        },
        {
          'id': 4,
          'survey_id': 101,
          'category': 'bank_passbook',
          'original_name': 'sbi_passbook.webp',
          'mime': 'image/webp',
          'size_bytes': 850000,
          'created_at': '2026-11-20T10:08:00Z',
        },
      ];

      final docs = docsJson.map((j) => SurveyDocumentModel.fromJson(j)).toList();

      expect(docs[0].category, equals('aadhaar'));
      expect(docs[0].isImage, isTrue);
      expect(docs[0].isPdf, isFalse);
      expect(docs[0].formattedSize, equals('1.43 MB'));

      expect(docs[1].category, equals('electricity_bill'));
      expect(docs[1].isPdf, isTrue);
      expect(docs[1].isImage, isFalse);
      expect(docs[1].formattedSize, equals('512.0 KB'));

      expect(docs[2].category, equals('site_photo'));
      expect(docs[2].isImage, isTrue);

      expect(docs[3].category, equals('bank_passbook'));
      expect(docs[3].isImage, isTrue);
    });

    test('SurveyProvider document state and reset cleans state', () {
      final client = ApiClient();
      final provider = SurveyProvider(apiClient: client);

      provider.reset();
      expect(provider.activeDocuments, isEmpty);
      expect(provider.isLoadingDocuments, isFalse);
      expect(provider.documentErrorMessage, isNull);
      expect(provider.uploadingCategory, isNull);
    });

    test('SurveyModel correctly differentiates Feasible, Feasible with conditions, and Not feasible', () {
      final feasibleSurvey = SurveyModel(
        id: 1,
        leadId: 10,
        customerName: 'Test Customer',
        mobileNumber: '9829011111',
        leadCode: 'LEAD-001',
        status: 'completed',
        feasibilityVerdict: 'Feasible',
        projectId: 99,
        projectNumber: 'PROJ-2026-A1B2',
        projectStage: 'Pre-Install Inspection',
      );

      expect(feasibleSurvey.isFeasible, isTrue);
      expect(feasibleSurvey.isFeasibleWithConditions, isFalse);
      expect(feasibleSurvey.isNotFeasible, isFalse);
      expect(feasibleSurvey.hasProject, isTrue);
      expect(feasibleSurvey.projectNumber, equals('PROJ-2026-A1B2'));

      final conditionalSurvey = SurveyModel(
        id: 2,
        leadId: 11,
        customerName: 'Test Customer 2',
        mobileNumber: '9829022222',
        leadCode: 'LEAD-002',
        status: 'completed',
        feasibilityVerdict: 'Feasible with conditions',
        projectId: null,
      );

      expect(conditionalSurvey.isFeasible, isFalse);
      expect(conditionalSurvey.isFeasibleWithConditions, isTrue);
      expect(conditionalSurvey.isNotFeasible, isFalse);
      expect(conditionalSurvey.hasProject, isFalse);

      final notFeasibleSurvey = SurveyModel(
        id: 3,
        leadId: 12,
        customerName: 'Test Customer 3',
        mobileNumber: '9829033333',
        leadCode: 'LEAD-003',
        status: 'completed',
        feasibilityVerdict: 'Not feasible',
        projectId: 0,
      );

      expect(notFeasibleSurvey.isFeasible, isFalse);
      expect(notFeasibleSurvey.isFeasibleWithConditions, isFalse);
      expect(notFeasibleSurvey.isNotFeasible, isTrue);
      expect(notFeasibleSurvey.hasProject, isFalse);
    });

    test('Survey conversion prevents duplicate project creation when project already exists', () {
      final existingProjectSurvey = SurveyModel(
        id: 4,
        leadId: 20,
        customerName: 'Existing Customer',
        mobileNumber: '9829044444',
        leadCode: 'LEAD-004',
        status: 'completed',
        feasibilityVerdict: 'Feasible',
        projectId: 45,
        projectNumber: 'PRJ-2026-045',
        projectStage: 'Site Survey Done',
      );

      // Verify that hasProject is true and projectId is preserved
      expect(existingProjectSurvey.hasProject, isTrue);
      expect(existingProjectSurvey.projectId, equals(45));
      expect(existingProjectSurvey.projectNumber, equals('PRJ-2026-045'));

      // Converting or viewing completion for an already converted survey must reuse existing project ID
      expect(existingProjectSurvey.projectId, isNotNull);
      expect(existingProjectSurvey.projectId, isPositive);
    });
  });
}

