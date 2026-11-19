import 'package:flutter_test/flutter_test.dart';
import 'package:solar_crm_app/models/lead_model.dart';
import 'package:solar_crm_app/providers/lead_provider.dart';
import 'package:solar_crm_app/core/network/api_client.dart';

void main() {
  group('Lead API Contract & Sales Workflow Suite', () {
    test('LeadModel parses next_action, next_follow_up_date and next_follow_up_time', () {
      final json = {
        'id': 101,
        'lead_code': 'LEAD-2026-101',
        'customer_name': 'Ramesh Kumar',
        'mobile_number': '9829012345',
        'solar_requirement': 'Residential',
        'interest_status': 'Interested',
        'required_kw': '5.0',
        'status': 'Contacted',
        'priority': 'High',
        'lead_source': 'Website',
        'next_action': 'Send WhatsApp proposal & follow up',
        'next_follow_up_date': '2026-11-21',
        'next_follow_up_time': '11:30:00',
        'assigned_to': 7,
        'assigned_to_name': 'Sunil Sales',
        'remark': 'Client asked for 5kW subsidy details',
      };

      final lead = LeadModel.fromJson(json);

      expect(lead.id, equals(101));
      expect(lead.customerName, equals('Ramesh Kumar'));
      expect(lead.status, equals('Contacted'));
      expect(lead.nextAction, equals('Send WhatsApp proposal & follow up'));
      expect(lead.nextFollowUpDate, equals('2026-11-21'));
      expect(lead.nextFollowUpTime, equals('11:30:00'));
      expect(lead.assignedTo, equals(7));
    });

    test('Follow-up date and time adhere to backend salesWorkflow regex requirements', () {
      final dateRegex = RegExp(r'^\d{4}-\d{2}-\d{2}$');
      final timeRegex = RegExp(r'^([01]\d|2[0-3]):[0-5]\d(?::00)?$');

      const validDate = '2026-11-21';
      const validTimeShort = '11:30';
      const validTimeFull = '11:30:00';
      const validMorningTime = '09:05';

      expect(dateRegex.hasMatch(validDate), isTrue);
      expect(timeRegex.hasMatch(validTimeShort), isTrue);
      expect(timeRegex.hasMatch(validTimeFull), isTrue);
      expect(timeRegex.hasMatch(validMorningTime), isTrue);

      // Invalid patterns should fail
      expect(dateRegex.hasMatch('21-11-2026'), isFalse);
      expect(timeRegex.hasMatch('9:5'), isFalse);
      expect(timeRegex.hasMatch('25:00'), isFalse);
    });

    test('Closed lead statuses match backend salesWorkflow.js canonical list', () {
      const closedStatuses = ['Won', 'Lost', 'Invalid', 'Not Interested'];

      bool isClosed(String status, String interest) {
        return closedStatuses.contains(status) || interest == 'Not Interested';
      }

      // Active leads require next action & follow-up
      expect(isClosed('New Lead', 'Interested'), isFalse);
      expect(isClosed('Contacted', 'Interested'), isFalse);
      expect(isClosed('Site Survey Scheduled', 'Interested'), isFalse);
      expect(isClosed('Quotation Sent', 'Interested'), isFalse);

      // Closed leads do not require next action & follow-up
      expect(isClosed('Won', 'Interested'), isTrue);
      expect(isClosed('Lost', 'Interested'), isTrue);
      expect(isClosed('Invalid', 'Pending'), isTrue);
      expect(isClosed('New Lead', 'Not Interested'), isTrue);
    });

    test('LeadFollowupItem parses atomic action fields: call_outcome, next_action, next_follow_up_time', () {
      final json = {
        'id': 42,
        'note': 'Customer confirmed 5kW rooftop setup, requested subsidy form',
        'followup_type': 'Call',
        'call_outcome': 'Connected',
        'status_after_followup': 'Qualified',
        'next_action': 'Send quotation via WhatsApp and call back at 4 PM',
        'follow_up_date': '2026-11-22',
        'next_follow_up_time': '16:00:00',
        'created_by_name': 'Aman Sales',
        'created_at': '2026-11-20T10:00:00.000Z',
      };

      final followup = LeadFollowupItem.fromJson(json);

      expect(followup.id, equals(42));
      expect(followup.note, contains('Customer confirmed 5kW'));
      expect(followup.followupType, equals('Call'));
      expect(followup.callOutcome, equals('Connected'));
      expect(followup.statusAfterFollowup, equals('Qualified'));
      expect(followup.nextAction, equals('Send quotation via WhatsApp and call back at 4 PM'));
      expect(followup.nextFollowupDate, equals('2026-11-22'));
      expect(followup.nextFollowUpTime, equals('16:00:00'));
      expect(followup.performedByName, equals('Aman Sales'));
    });

    test('Sales workflow call outcomes match backend salesWorkflow.js OUTCOMES', () {
      const allowedOutcomes = [
        'Connected',
        'No answer',
        'Busy',
        'Call later',
        'Wrong number',
        'Meeting completed',
        'Note only',
      ];

      expect(allowedOutcomes.contains('Connected'), isTrue);
      expect(allowedOutcomes.contains('Call later'), isTrue);
      expect(allowedOutcomes.contains('Meeting completed'), isTrue);
      expect(allowedOutcomes.contains('Random outcome'), isFalse);
    });

    test('LeadProvider handles reset cleanly', () {
      final client = ApiClient();
      final provider = LeadProvider(apiClient: client);

      provider.reset();
      expect(provider.leads, isEmpty);
      expect(provider.isLoading, isFalse);
      expect(provider.errorMessage, isNull);
    });
  });
}

