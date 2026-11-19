import 'package:flutter_test/flutter_test.dart';
import 'package:solar_crm_app/models/manager_dashboard_model.dart';
import 'package:solar_crm_app/providers/dashboard_provider.dart';
import 'package:solar_crm_app/core/network/api_client.dart';

void main() {
  group('Manager Role Suite Unit Tests', () {
    test('ManagerDashboardModel correctly deserializes and computes metrics', () {
      final json = {
        'statusBreakdown': [
          {'status': 'New', 'count': 15},
          {'status': 'Contacted', 'count': 8},
          {'status': 'Won', 'count': 5},
          {'status': 'Lost', 'count': 2},
        ],
        'teamPerformance': [
          {
            'id': 101,
            'full_name': 'Rahul Sharma',
            'email': 'rahul@solar.com',
            'phone': '9876543210',
            'total_assigned': 15,
            'converted': 5,
            'lost': 2,
            'in_progress': 8,
            'revenue': 1250000.0,
          },
          {
            'id': 102,
            'full_name': 'Pooja Verma',
            'email': 'pooja@solar.com',
            'phone': '9876543211',
            'total_assigned': 10,
            'converted': 3,
            'lost': 1,
            'in_progress': 6,
            'revenue': 750000.0,
          },
        ],
        'pendingToday': 6,
        'convertedToday': 2,
        'overdueFollowups': 1,
        'todaysFollowupsList': [
          {
            'id': 501,
            'lead_code': 'LEAD-2026-001',
            'customer_name': 'Amit Kumar',
            'phone': '9988776655',
            'time': '11:00 AM',
            'is_overdue': true,
            'rep_name': 'Rahul Sharma',
          }
        ],
        'recentActivity': [
          {
            'id': 901,
            'lead_id': 501,
            'user_name': 'Rahul Sharma',
            'action': 'Stage Changed to Won',
            'time': '10 minutes ago',
          }
        ],
      };

      final model = ManagerDashboardModel.fromJson(json);

      // Verify computed aggregates
      expect(model.totalTeamLeads, equals(30)); // 15 + 8 + 5 + 2
      expect(model.totalConverted, equals(5)); // 5 won
      expect(model.teamRevenue, equals(2000000.0)); // 1250000 + 750000
      expect(model.pendingToday, equals(6));
      expect(model.convertedToday, equals(2));
      expect(model.overdueFollowups, equals(1));

      // Verify team member win rate calculation
      final rahul = model.teamPerformance.first;
      expect(rahul.fullName, equals('Rahul Sharma'));
      expect(rahul.winRate, closeTo(33.33, 0.01)); // 5 / 15 * 100
      expect(rahul.revenue, equals(1250000.0));

      // Verify followups
      expect(model.todaysFollowupsList.length, equals(1));
      expect(model.todaysFollowupsList.first.isOverdue, isTrue);
      expect(model.todaysFollowupsList.first.customerName, equals('Amit Kumar'));
    });

    test('DashboardProvider.reset() clears managerStats and state cleanly', () {
      final client = ApiClient();
      final provider = DashboardProvider(apiClient: client);

      // simulate state
      provider.reset();
      expect(provider.managerStats, isNull);
      expect(provider.adminStats, isNull);
      expect(provider.isLoading, isFalse);
      expect(provider.errorMessage, isNull);
    });
  });
}
