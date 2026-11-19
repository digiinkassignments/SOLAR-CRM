import 'package:flutter_test/flutter_test.dart';
import 'package:solar_crm_app/models/sales_dashboard_model.dart';
import 'package:solar_crm_app/providers/dashboard_provider.dart';
import 'package:solar_crm_app/core/network/api_client.dart';

void main() {
  group('Sales Role Suite Unit Tests', () {
    test('SalesDashboardModel correctly deserializes and computes metrics', () {
      final json = {
        'total_assigned': 20,
        'new_leads': 4,
        'today_followups': 5,
        'pending_followups': 2,
        'converted': 6,
        'lost': 2,
        'upcoming_site_visits': 3,
        'statusBreakdown': [
          {'status': 'New Lead', 'count': 4},
          {'status': 'Contacted', 'count': 8},
          {'status': 'Won', 'count': 6},
          {'status': 'Lost', 'count': 2},
        ],
        'followupsList': [
          {
            'id': 201,
            'lead_code': 'LEAD-2026-089',
            'customer_name': 'Vikas Gupta',
            'mobile_number': '9812345678',
            'next_follow_up_date': '2026-11-19',
            'is_overdue': 1,
          },
          {
            'id': 202,
            'lead_code': 'LEAD-2026-090',
            'customer_name': 'Sunita Meena',
            'phone': '9876543210',
            'next_follow_up_date': '2026-11-20',
            'is_overdue': false,
          }
        ],
        'activityTimeline': [
          {
            'id': 401,
            'lead_id': 201,
            'lead_code': 'LEAD-2026-089',
            'customer_name': 'Vikas Gupta',
            'action': 'Call Logged: Customer requested 5kW subsidy details',
            'created_at': '2026-11-19T10:30:00Z',
          }
        ],
      };

      final model = SalesDashboardModel.fromJson(json);

      expect(model.totalAssigned, equals(20));
      expect(model.newLeads, equals(4));
      expect(model.todayFollowups, equals(5));
      expect(model.pendingFollowups, equals(2));
      expect(model.converted, equals(6));
      expect(model.lost, equals(2));
      expect(model.upcomingSiteVisits, equals(3));

      // Computed properties
      expect(model.winRate, equals(30.0)); // 6 / 20 * 100
      expect(model.inProgressLeads, equals(12)); // 20 - (6 + 2)

      // Breakdown & followups list
      expect(model.statusBreakdown.length, equals(4));
      expect(model.followupsList.length, equals(2));
      expect(model.followupsList.first.isOverdue, isTrue);
      expect(model.followupsList.first.customerName, equals('Vikas Gupta'));
      expect(model.followupsList.last.isOverdue, isFalse);

      // Activity timeline
      expect(model.activityTimeline.length, equals(1));
      expect(model.activityTimeline.first.leadCode, equals('LEAD-2026-089'));
    });

    test('DashboardProvider handles sales stats reset', () {
      final client = ApiClient();
      final provider = DashboardProvider(apiClient: client);

      provider.reset();
      expect(provider.salesStats, isNull);
      expect(provider.managerStats, isNull);
      expect(provider.adminStats, isNull);
      expect(provider.isLoading, isFalse);
      expect(provider.errorMessage, isNull);
    });
  });
}

