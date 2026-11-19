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
  });
}

