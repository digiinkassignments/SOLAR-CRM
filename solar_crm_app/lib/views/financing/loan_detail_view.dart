import 'dart:math';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_typography.dart';
import '../../../core/utils/formatters.dart';
import '../../../models/loan_model.dart';
import '../../../providers/financing_provider.dart';
import 'sheets/loan_sheet.dart';

class LoanDetailView extends StatefulWidget {
  final int loanId;
  final LoanItemModel? initialLoan;

  const LoanDetailView({
    super.key,
    required this.loanId,
    this.initialLoan,
  });

  @override
  State<LoanDetailView> createState() => _LoanDetailViewState();
}

class _LoanDetailViewState extends State<LoanDetailView> {
  final ImagePicker _picker = ImagePicker();
  final DateFormat _dateFormat = DateFormat('yyyy-MM-dd');

  final List<String> _stages = [
    'Eligibility & Docs',
    'Applied',
    'Under Review',
    'Sanctioned',
    'Disbursed',
  ];

  final Map<String, Map<String, String>> _stageDescriptions = {
    'Eligibility & Docs': {
      'meaning': 'Customer wants a loan, collecting documents',
      'needed': 'Lender chosen, amount requested',
    },
    'Applied': {
      'meaning': 'Application is filed with bank or NBFC',
      'needed': 'Applied date, application number',
    },
    'Under Review': {
      'meaning': 'Lender is verifying and credit check',
      'needed': 'Track lender queries & verification',
    },
    'Sanctioned': {
      'meaning': 'Lender has approved the loan',
      'needed': 'Sanctioned amount, date, sanction letter',
    },
    'Disbursed': {
      'meaning': 'Actual lender payment recorded',
      'needed': 'Disbursed amount, date',
    },
  };

  final List<String> _requiredVaultDocs = [
    'Sanction Letter',
    'Bank Statement',
    'Electricity Bill',
    'Aadhaar Card',
  ];

  final List<String> _popularBanks = [
    'State Bank of India (SBI)',
    'Punjab National Bank (PNB)',
    'Canara Bank',
    'Bank of Baroda (BoB)',
    'Union Bank of India',
    'HDFC Bank',
    'ICICI Bank',
    'Ecofy (Solar NBFC)',
    'Metafin (Green FinTech)',
    'Credit Fair',
    'Other Local Bank / NBFC',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadLoanDetails();
    });
  }

  Future<void> _loadLoanDetails() async {
    final provider = Provider.of<FinancingProvider>(context, listen: false);
    await provider.fetchLoanDetails(widget.loanId);
  }

  // ----------------------------------------------------------------------
  // STEP CLICK: ADVANCE OR BACKTRACK
  // ----------------------------------------------------------------------
  void _handleStepClick(LoanItemModel loan, String targetStage) {
    final currentIdx = _stages.indexOf(loan.loanStage);
    final targetIdx = _stages.indexOf(targetStage);

    if (currentIdx == targetIdx) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Loan is currently in '$targetStage'")),
      );
      return;
    }

    if (targetIdx > currentIdx) {
      _showAdvanceDialog(loan, targetStage);
    } else {
      _showBacktrackDialog(loan, targetStage);
    }
  }

  // ----------------------------------------------------------------------
  // ADVANCE STAGE DIALOG
  // ----------------------------------------------------------------------
  void _showAdvanceDialog(LoanItemModel loan, String targetStage) {
    final formKey = GlobalKey<FormState>();
    final appNoCtrl = TextEditingController(text: loan.portalApplicationNo ?? "");
    final appliedDateCtrl = TextEditingController(
      text: loan.appliedDate != null ? _dateFormat.format(loan.appliedDate!) : _dateFormat.format(DateTime.now()),
    );
    final sanctionedAmtCtrl = TextEditingController(
      text: loan.sanctionedAmount > 0 ? loan.sanctionedAmount.toStringAsFixed(0) : (loan.loanAmountApplied > 0 ? loan.loanAmountApplied.toStringAsFixed(0) : "180000"),
    );
    final sanctionDateCtrl = TextEditingController(
      text: loan.sanctionDate != null ? _dateFormat.format(loan.sanctionDate!) : _dateFormat.format(DateTime.now()),
    );
    final disbursedAmtCtrl = TextEditingController(
      text: loan.disbursedAmount > 0 ? loan.disbursedAmount.toStringAsFixed(0) : (loan.sanctionedAmount > 0 ? loan.sanctionedAmount.toStringAsFixed(0) : "180000"),
    );
    final disbursalDateCtrl = TextEditingController(
      text: loan.disbursalDate != null ? _dateFormat.format(loan.disbursalDate!) : _dateFormat.format(DateTime.now()),
    );

    bool isSubmitting = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDlgState) {
          return AlertDialog(
            title: Row(
              children: [
                const Icon(Icons.trending_up_rounded, color: AppColors.emeraldGreen),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    "Advance to $targetStage",
                    style: AppTypography.headingSmall(),
                  ),
                ),
              ],
            ),
            content: SingleChildScrollView(
              child: Form(
                key: formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Moving pipeline from '${loan.loanStage}' to '$targetStage'. Complete the required fields:",
                      style: AppTypography.bodySmall(color: Colors.grey),
                    ),
                    const SizedBox(height: 14),

                    // Applied fields
                    if (targetStage == 'Applied' || _stages.indexOf(targetStage) >= 1) ...[
                      TextFormField(
                        controller: appNoCtrl,
                        decoration: const InputDecoration(
                          labelText: "Bank Loan Ref / Application # *",
                          hintText: "e.g. SBI-SOL-99882",
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) => (v == null || v.trim().isEmpty) ? "Application reference required" : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: appliedDateCtrl,
                        readOnly: true,
                        decoration: const InputDecoration(
                          labelText: "Application Date *",
                          suffixIcon: Icon(Icons.calendar_today_rounded),
                          border: OutlineInputBorder(),
                        ),
                        onTap: () async {
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: DateTime.tryParse(appliedDateCtrl.text) ?? DateTime.now(),
                            firstDate: DateTime(2020),
                            lastDate: DateTime.now().add(const Duration(days: 30)),
                          );
                          if (picked != null) {
                            appliedDateCtrl.text = _dateFormat.format(picked);
                          }
                        },
                      ),
                      const SizedBox(height: 12),
                    ],

                    // Sanctioned fields
                    if (targetStage == 'Sanctioned' || _stages.indexOf(targetStage) >= 3) ...[
                      TextFormField(
                        controller: sanctionedAmtCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: "Sanctioned Amount (₹) *",
                          prefixText: "₹ ",
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) {
                          final d = double.tryParse(v ?? "");
                          if (d == null || d <= 0) return "Enter valid sanctioned amount";
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: sanctionDateCtrl,
                        readOnly: true,
                        decoration: const InputDecoration(
                          labelText: "Sanction Date *",
                          suffixIcon: Icon(Icons.calendar_today_rounded),
                          border: OutlineInputBorder(),
                        ),
                        onTap: () async {
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: DateTime.tryParse(sanctionDateCtrl.text) ?? DateTime.now(),
                            firstDate: DateTime(2020),
                            lastDate: DateTime.now().add(const Duration(days: 30)),
                          );
                          if (picked != null) {
                            sanctionDateCtrl.text = _dateFormat.format(picked);
                          }
                        },
                      ),
                      const SizedBox(height: 12),
                    ],

                    // Disbursed fields
                    if (targetStage == 'Disbursed') ...[
                      TextFormField(
                        controller: disbursedAmtCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: "Disbursed Amount (₹) *",
                          prefixText: "₹ ",
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) {
                          final d = double.tryParse(v ?? "");
                          if (d == null || d <= 0) return "Enter valid disbursed amount";
                          final sanc = double.tryParse(sanctionedAmtCtrl.text) ?? loan.sanctionedAmount;
                          if (sanc > 0 && d > sanc) {
                            return "Disbursed amount cannot exceed Sanctioned (₹${sanc.toStringAsFixed(0)})";
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: disbursalDateCtrl,
                        readOnly: true,
                        decoration: const InputDecoration(
                          labelText: "Disbursal Date *",
                          suffixIcon: Icon(Icons.calendar_today_rounded),
                          border: OutlineInputBorder(),
                        ),
                        onTap: () async {
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: DateTime.tryParse(disbursalDateCtrl.text) ?? DateTime.now(),
                            firstDate: DateTime(2020),
                            lastDate: DateTime.now().add(const Duration(days: 30)),
                          );
                          if (picked != null) {
                            disbursalDateCtrl.text = _dateFormat.format(picked);
                          }
                        },
                      ),
                      const SizedBox(height: 12),
                    ],
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: isSubmitting ? null : () => Navigator.pop(ctx),
                child: const Text("Cancel"),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.emeraldGreen,
                  foregroundColor: Colors.white,
                ),
                onPressed: isSubmitting
                    ? null
                    : () async {
                        if (!formKey.currentState!.validate()) return;
                        setDlgState(() => isSubmitting = true);

                        final payload = <String, dynamic>{
                          'loan_stage': targetStage,
                        };

                        if (appNoCtrl.text.trim().isNotEmpty) {
                          payload['portal_application_no'] = appNoCtrl.text.trim();
                        }
                        if (appliedDateCtrl.text.trim().isNotEmpty) {
                          payload['applied_date'] = appliedDateCtrl.text.trim();
                        }

                        if (targetStage == 'Sanctioned' || _stages.indexOf(targetStage) >= 3) {
                          final sancAmt = double.tryParse(sanctionedAmtCtrl.text.trim()) ?? 0.0;
                          payload['sanctioned_amount'] = sancAmt;
                          payload['sanction_date'] = sanctionDateCtrl.text.trim();

                          final rate = loan.interestRate > 0 ? loan.interestRate : 7.0;
                          final months = loan.tenureMonths > 0 ? loan.tenureMonths : 60;
                          final monthlyRate = rate / 1200;
                          if (sancAmt > 0 && months > 0) {
                            final emi = (sancAmt * monthlyRate * pow(1 + monthlyRate, months)) /
                                (pow(1 + monthlyRate, months) - 1);
                            payload['monthly_emi'] = emi.round();
                          }
                        }

                        if (targetStage == 'Disbursed') {
                          payload['disbursed_amount'] = double.tryParse(disbursedAmtCtrl.text.trim()) ?? 0.0;
                          payload['disbursal_date'] = disbursalDateCtrl.text.trim();
                        }

                        final provider = Provider.of<FinancingProvider>(context, listen: false);
                        final messenger = ScaffoldMessenger.of(context);
                        final dlgNav = Navigator.of(ctx);

                        final res = await provider.updateLoan(loan.id, payload);

                        dlgNav.pop();

                        if (res['success'] == true) {
                          await _loadLoanDetails();
                          messenger.showSnackBar(
                            SnackBar(
                              backgroundColor: AppColors.emeraldGreen,
                              content: Text("Loan moved to '$targetStage' successfully!"),
                            ),
                          );
                        } else {
                          messenger.showSnackBar(
                            SnackBar(
                              backgroundColor: AppColors.errorRed,
                              content: Text(res['message']?.toString() ?? "Failed to advance stage"),
                            ),
                          );
                        }
                      },
                child: isSubmitting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text("Confirm & Advance"),
              ),
            ],
          );
        },
      ),
    );
  }

  // ----------------------------------------------------------------------
  // BACKTRACK STAGE DIALOG
  // ----------------------------------------------------------------------
  void _showBacktrackDialog(LoanItemModel loan, String targetStage) {
    final reasonCtrl = TextEditingController();
    bool isSubmitting = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDlgState) {
          return AlertDialog(
            title: Row(
              children: [
                const Icon(Icons.history_rounded, color: Colors.amber),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    "Move Back to $targetStage",
                    style: AppTypography.headingSmall(),
                  ),
                ),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "You are moving this loan backwards from '${loan.loanStage}' to '$targetStage'.",
                  style: AppTypography.bodySmall(color: Colors.grey),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: reasonCtrl,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: "Reason for moving back *",
                    hintText: "e.g. Bank requested additional KYC / verification audit",
                    border: OutlineInputBorder(),
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: isSubmitting ? null : () => Navigator.pop(ctx),
                child: const Text("Cancel"),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.amber[800],
                  foregroundColor: Colors.white,
                ),
                onPressed: isSubmitting
                    ? null
                    : () async {
                        if (reasonCtrl.text.trim().isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Reason is required to backtrack stage")),
                          );
                          return;
                        }

                        setDlgState(() => isSubmitting = true);
                        final provider = Provider.of<FinancingProvider>(context, listen: false);
                        final messenger = ScaffoldMessenger.of(context);
                        final dlgNav = Navigator.of(ctx);

                        final payload = {
                          'loan_stage': targetStage,
                          'backward_reason': reasonCtrl.text.trim(),
                          'internal_notes': loan.internalNotes != null && loan.internalNotes!.isNotEmpty
                              ? "${loan.internalNotes}\n[${_dateFormat.format(DateTime.now())}] Moved back to $targetStage: ${reasonCtrl.text.trim()}"
                              : "[${_dateFormat.format(DateTime.now())}] Moved back to $targetStage: ${reasonCtrl.text.trim()}",
                        };

                        final res = await provider.updateLoan(loan.id, payload);
                        dlgNav.pop();

                        if (res['success'] == true) {
                          await _loadLoanDetails();
                          messenger.showSnackBar(
                            SnackBar(
                              backgroundColor: AppColors.emeraldGreen,
                              content: Text("Loan moved back to '$targetStage'"),
                            ),
                          );
                        } else {
                          messenger.showSnackBar(
                            SnackBar(
                              backgroundColor: AppColors.errorRed,
                              content: Text(res['message']?.toString() ?? "Failed to move back"),
                            ),
                          );
                        }
                      },
                child: isSubmitting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text("Confirm Move Back"),
              ),
            ],
          );
        },
      ),
    );
  }

  // ----------------------------------------------------------------------
  // SIDE STATUS: REJECTED OR WITHDRAWN
  // ----------------------------------------------------------------------
  void _showSideStatusModal(LoanItemModel loan) {
    String sideStatusAction = loan.sideStatus == 'Withdrawn' ? 'Withdrawn' : 'Rejected';
    final reasonCtrl = TextEditingController(text: loan.rejectionReason ?? "");
    bool isSubmitting = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDlgState) {
          return AlertDialog(
            title: Row(
              children: [
                const Icon(Icons.block_outlined, color: AppColors.errorRed),
                const SizedBox(width: 8),
                Text("Mark Stopped Status", style: AppTypography.headingSmall()),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Select the stopping status for this application:", style: AppTypography.caption(color: Colors.grey)),
                  const SizedBox(height: 12),
                  InkWell(
                    onTap: () => setDlgState(() => sideStatusAction = "Rejected"),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: sideStatusAction == "Rejected" ? AppColors.errorRed.withValues(alpha: 0.1) : Colors.transparent,
                        border: Border.all(color: sideStatusAction == "Rejected" ? AppColors.errorRed : Colors.grey.withValues(alpha: 0.3)),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(sideStatusAction == "Rejected" ? Icons.radio_button_checked : Icons.radio_button_off, color: AppColors.errorRed, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text("Rejected by Lender", style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                                Text("Bank / NBFC declined loan or credit verification", style: AppTypography.caption(color: Colors.grey)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  InkWell(
                    onTap: () => setDlgState(() => sideStatusAction = "Withdrawn"),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: sideStatusAction == "Withdrawn" ? Colors.orange.withValues(alpha: 0.1) : Colors.transparent,
                        border: Border.all(color: sideStatusAction == "Withdrawn" ? Colors.orange : Colors.grey.withValues(alpha: 0.3)),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(sideStatusAction == "Withdrawn" ? Icons.radio_button_checked : Icons.radio_button_off, color: Colors.orange, size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text("Withdrawn by Customer", style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                                Text("Customer decided not to proceed with loan", style: AppTypography.caption(color: Colors.grey)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: reasonCtrl,
                    maxLines: 3,
                    decoration: InputDecoration(
                      labelText: sideStatusAction == "Rejected" ? "Rejection Reason *" : "Withdrawal Reason *",
                      hintText: sideStatusAction == "Rejected" ? "e.g. CIBIL score below 650" : "e.g. Self-funding",
                      border: const OutlineInputBorder(),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: isSubmitting ? null : () => Navigator.pop(ctx),
                child: const Text("Cancel"),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.errorRed,
                  foregroundColor: Colors.white,
                ),
                onPressed: isSubmitting
                    ? null
                    : () async {
                        if (reasonCtrl.text.trim().isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Reason is required")),
                          );
                          return;
                        }

                        setDlgState(() => isSubmitting = true);
                        final provider = Provider.of<FinancingProvider>(context, listen: false);
                        final messenger = ScaffoldMessenger.of(context);
                        final dlgNav = Navigator.of(ctx);

                        final payload = {
                          'side_status': sideStatusAction,
                          'rejection_reason': reasonCtrl.text.trim(),
                          'stopped_at_stage': loan.loanStage,
                          'internal_notes': loan.internalNotes != null && loan.internalNotes!.isNotEmpty
                              ? "${loan.internalNotes}\n[${_dateFormat.format(DateTime.now())}] $sideStatusAction at ${loan.loanStage}: ${reasonCtrl.text.trim()}"
                              : "[${_dateFormat.format(DateTime.now())}] $sideStatusAction at ${loan.loanStage}: ${reasonCtrl.text.trim()}",
                        };

                        final res = await provider.updateLoan(loan.id, payload);
                        dlgNav.pop();

                        if (res['success'] == true) {
                          await _loadLoanDetails();
                          messenger.showSnackBar(
                            SnackBar(
                              backgroundColor: AppColors.errorRed,
                              content: Text("Loan marked as $sideStatusAction"),
                            ),
                          );
                        } else {
                          messenger.showSnackBar(
                            SnackBar(
                              backgroundColor: AppColors.errorRed,
                              content: Text(res['message']?.toString() ?? "Failed to update status"),
                            ),
                          );
                        }
                      },
                child: isSubmitting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text("Confirm Status"),
              ),
            ],
          );
        },
      ),
    );
  }

  // ----------------------------------------------------------------------
  // TRY ANOTHER LENDER MODAL
  // ----------------------------------------------------------------------
  void _showTryAnotherLenderDialog(LoanItemModel loan) {
    String selectedBank = 'State Bank of India (SBI)';
    final amountCtrl = TextEditingController(
      text: loan.loanAmountApplied > 0 ? loan.loanAmountApplied.toStringAsFixed(0) : "180000",
    );
    bool isSubmitting = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDlgState) {
          return AlertDialog(
            title: Row(
              children: [
                const Icon(Icons.replay_rounded, color: AppColors.brandPrimary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    "Try Another Lender",
                    style: AppTypography.headingSmall(),
                  ),
                ),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Reopen this customer's solar loan with a different bank or NBFC. Stage will reset to Step 1 (Eligibility & Docs) with Active status.",
                    style: AppTypography.bodySmall(color: Colors.grey),
                  ),
                  const SizedBox(height: 14),
                  DropdownButtonFormField<String>(
                    isExpanded: true,
                    initialValue: _popularBanks.contains(selectedBank) ? selectedBank : _popularBanks.first,
                    decoration: const InputDecoration(
                      labelText: "New Lender / Bank *",
                      border: OutlineInputBorder(),
                    ),
                    items: _popularBanks.map((b) => DropdownMenuItem(value: b, child: Text(b, overflow: TextOverflow.ellipsis))).toList(),
                    onChanged: (val) => setDlgState(() => selectedBank = val ?? _popularBanks.first),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: amountCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: "Loan Amount Applied (₹) *",
                      prefixText: "₹ ",
                      border: OutlineInputBorder(),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: isSubmitting ? null : () => Navigator.pop(ctx),
                child: const Text("Cancel"),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brandPrimary,
                  foregroundColor: Colors.white,
                ),
                onPressed: isSubmitting
                    ? null
                    : () async {
                        setDlgState(() => isSubmitting = true);
                        final provider = Provider.of<FinancingProvider>(context, listen: false);
                        final messenger = ScaffoldMessenger.of(context);
                        final dlgNav = Navigator.of(ctx);

                        final payload = {
                          'bank_name': selectedBank,
                          'loan_amount_applied': double.tryParse(amountCtrl.text.trim()) ?? loan.loanAmountApplied,
                          'loan_stage': 'Eligibility & Docs',
                          'side_status': 'Active',
                          'portal_application_no': '',
                          'clear_rejection': true,
                          'internal_notes': loan.internalNotes != null && loan.internalNotes!.isNotEmpty
                              ? "${loan.internalNotes}\n[${_dateFormat.format(DateTime.now())}] Re-applied with new lender: $selectedBank"
                              : "[${_dateFormat.format(DateTime.now())}] Re-applied with new lender: $selectedBank",
                        };

                        final res = await provider.updateLoan(loan.id, payload);
                        dlgNav.pop();

                        if (res['success'] == true) {
                          await _loadLoanDetails();
                          messenger.showSnackBar(
                            SnackBar(
                              backgroundColor: AppColors.emeraldGreen,
                              content: Text("Loan reopened with $selectedBank!"),
                            ),
                          );
                        } else {
                          messenger.showSnackBar(
                            SnackBar(
                              backgroundColor: AppColors.errorRed,
                              content: Text(res['message']?.toString() ?? "Failed to reopen loan"),
                            ),
                          );
                        }
                      },
                child: isSubmitting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text("Reopen with New Lender"),
              ),
            ],
          );
        },
      ),
    );
  }

  // ----------------------------------------------------------------------
  // DELETE LOAN CONFIRMATION
  // ----------------------------------------------------------------------
  void _showDeleteDialog(LoanItemModel loan) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Delete loan record?"),
        content: Text(
          "Delete the CRM loan record for ${loan.customerName}? This does not cancel an active lender application.",
          style: AppTypography.bodySmall(),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Cancel")),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.errorRed, foregroundColor: Colors.white),
            onPressed: () async {
              final provider = Provider.of<FinancingProvider>(context, listen: false);
              final messenger = ScaffoldMessenger.of(context);
              final pageNav = Navigator.of(context);
              final dlgNav = Navigator.of(ctx);

              final res = await provider.deleteLoan(loan.id);
              dlgNav.pop();
              if (res['success'] == true) {
                pageNav.pop();
                messenger.showSnackBar(
                  const SnackBar(backgroundColor: AppColors.emeraldGreen, content: Text("Loan record deleted")),
                );
              } else {
                messenger.showSnackBar(
                  SnackBar(backgroundColor: AppColors.errorRed, content: Text(res['message']?.toString() ?? "Delete failed")),
                );
              }
            },
            child: const Text("Delete Record"),
          ),
        ],
      ),
    );
  }

  // ----------------------------------------------------------------------
  // UPLOAD DOCUMENT (CAMERA OR GALLERY)
  // ----------------------------------------------------------------------
  Future<void> _pickAndUploadDocument(String docType, ImageSource source) async {
    try {
      final provider = Provider.of<FinancingProvider>(context, listen: false);
      final messenger = ScaffoldMessenger.of(context);
      final picked = await _picker.pickImage(
        source: source,
        maxWidth: 1600,
        maxHeight: 1600,
        imageQuality: 85,
      );
      if (picked == null) return;

      final res = await provider.uploadLoanDocument(
        loanId: widget.loanId,
        docType: docType,
        filePath: picked.path,
      );

      if (res['success'] == true) {
        await _loadLoanDetails();
        messenger.showSnackBar(
          SnackBar(backgroundColor: AppColors.emeraldGreen, content: Text("Uploaded $docType successfully!")),
        );
      } else {
        messenger.showSnackBar(
          SnackBar(backgroundColor: AppColors.errorRed, content: Text(res['message']?.toString() ?? "Upload failed")),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: AppColors.errorRed, content: Text("Upload error: $e")),
        );
      }
    }
  }

  // ----------------------------------------------------------------------
  // VIEW IMAGE PREVIEW
  // ----------------------------------------------------------------------
  void _showImagePreviewDialog(String title, String fileUrl) {
    final provider = Provider.of<FinancingProvider>(context, listen: false);
    String fullUrl = fileUrl;
    if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
      final base = provider.baseApiUrl.endsWith('/')
          ? provider.baseApiUrl.substring(0, provider.baseApiUrl.length - 1)
          : provider.baseApiUrl;
      final path = fileUrl.startsWith('/') ? fileUrl : '/$fileUrl';
      fullUrl = '$base$path';
    }

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(child: Text(title, style: AppTypography.headingSmall())),
                  IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
            ),
            const Divider(height: 1),
            Flexible(
              child: InteractiveViewer(
                child: Image.network(
                  fullUrl,
                  fit: BoxFit.contain,
                  errorBuilder: (ctx, err, stack) => Padding(
                    padding: const EdgeInsets.all(40),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.broken_image_outlined, size: 48, color: Colors.grey),
                        const SizedBox(height: 8),
                        Text("Preview unavailable or link expired", style: AppTypography.caption(color: Colors.grey)),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF1E293B) : Colors.white;
    final borderColor = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSecondary = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return Consumer<FinancingProvider>(
      builder: (context, provider, _) {
        final loan = provider.selectedLoan ?? widget.initialLoan;
        final isLoading = provider.isLoadingLoanDetails && loan == null;

        return Scaffold(
          appBar: AppBar(
            title: Text(loan?.customerName ?? "Solar Loan Application"),
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh_rounded),
                onPressed: _loadLoanDetails,
                tooltip: "Reload",
              ),
              if (loan != null) ...[
                IconButton(
                  icon: const Icon(Icons.edit_outlined),
                  onPressed: () async {
                    await LoanSheet.show(context, existingLoan: loan);
                    _loadLoanDetails();
                  },
                  tooltip: "Edit Application",
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline_rounded, color: AppColors.errorRed),
                  onPressed: () => _showDeleteDialog(loan),
                  tooltip: "Delete Record",
                ),
              ],
            ],
          ),
          body: isLoading
              ? const Center(child: CircularProgressIndicator(color: AppColors.brandPrimary))
              : loan == null
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline_rounded, size: 48, color: Colors.grey),
                          const SizedBox(height: 12),
                          const Text("Loan application not found"),
                          const SizedBox(height: 8),
                          ElevatedButton(onPressed: _loadLoanDetails, child: const Text("Retry")),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadLoanDetails,
                      child: ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          // ----------------------------------------------------
                          // HEADER CUSTOMER CARD
                          // ----------------------------------------------------
                          _buildHeaderCard(loan, cardBg, borderColor, textPrimary, textSecondary),
                          const SizedBox(height: 14),

                          // ----------------------------------------------------
                          // REJECTED / WITHDRAWN ALERT BANNER
                          // ----------------------------------------------------
                          if (!loan.isSideStatusActive) ...[
                            _buildSideStatusBanner(loan),
                            const SizedBox(height: 14),
                          ],

                          // ----------------------------------------------------
                          // 5-STAGE SEQUENTIAL PIPELINE STEPPER
                          // ----------------------------------------------------
                          _buildPipelineCard(loan, cardBg, borderColor, textPrimary, textSecondary),
                          const SizedBox(height: 14),

                          // ----------------------------------------------------
                          // FINANCIAL BREAKDOWN GRID (4 CARDS)
                          // ----------------------------------------------------
                          _buildFinancialGrid(loan, cardBg, borderColor, textPrimary, textSecondary),
                          const SizedBox(height: 14),

                          // ----------------------------------------------------
                          // DISBURSED HIGHLIGHTS BANNER
                          // ----------------------------------------------------
                          if (loan.loanStage == 'Disbursed') ...[
                            _buildDisbursedBanner(loan, provider),
                            const SizedBox(height: 14),
                          ],

                          // ----------------------------------------------------
                          // DOCUMENT VAULT (4 LOAN DOCUMENTS)
                          // ----------------------------------------------------
                          _buildDocumentVaultCard(loan, cardBg, borderColor, textPrimary, textSecondary),
                          const SizedBox(height: 14),

                          // ----------------------------------------------------
                          // APPLICATION DETAILS & SPECS
                          // ----------------------------------------------------
                          _buildSpecsCard(loan, cardBg, borderColor, textPrimary, textSecondary),
                          const SizedBox(height: 30),
                        ],
                      ),
                    ),
        );
      },
    );
  }

  // ----------------------------------------------------------------------
  // HEADER CARD
  // ----------------------------------------------------------------------
  Widget _buildHeaderCard(
    LoanItemModel loan,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final meta = loan.stageMeta;
    final color = meta['color'] as Color;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(loan.bankName, style: AppTypography.badge(color: color)),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: loan.isSideStatusActive
                      ? AppColors.emeraldGreen.withValues(alpha: 0.12)
                      : AppColors.errorRed.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  loan.sideStatus.toUpperCase(),
                  style: AppTypography.badge(
                    color: loan.isSideStatusActive ? AppColors.emeraldGreen : AppColors.errorRed,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            loan.customerName,
            style: AppTypography.headingMedium(color: textPrimary),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              if (loan.customerPhone != null && loan.customerPhone!.isNotEmpty) ...[
                const Icon(Icons.phone_outlined, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text(loan.customerPhone!, style: AppTypography.bodySmall(color: textSecondary)),
                const SizedBox(width: 12),
              ],
              if (loan.city != null && loan.city!.isNotEmpty) ...[
                const Icon(Icons.location_on_outlined, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text("${loan.city}${loan.state != null ? ', ${loan.state}' : ''}", style: AppTypography.bodySmall(color: textSecondary)),
              ],
            ],
          ),
          if (loan.portalApplicationNo != null && loan.portalApplicationNo!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                "App Ref: ${loan.portalApplicationNo}",
                style: AppTypography.caption(color: Colors.blue[800], fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ----------------------------------------------------------------------
  // REJECTED / WITHDRAWN ALERT BANNER
  // ----------------------------------------------------------------------
  Widget _buildSideStatusBanner(LoanItemModel loan) {
    final isRejected = loan.sideStatus == 'Rejected';
    final bgColor = isRejected ? const Color(0xFFFEE2E2) : const Color(0xFFFFEDD5);
    final borderColor = isRejected ? const Color(0xFFFCA5A5) : const Color(0xFFFDBA74);
    final textColor = isRejected ? const Color(0xFF991B1B) : const Color(0xFF9A3412);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: textColor),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  "${loan.sideStatus == 'Rejected' ? 'Rejected by Lender' : 'Withdrawn by Customer'} (Stopped at ${loan.stoppedAtStage ?? loan.loanStage})",
                  style: AppTypography.bodyMedium(color: textColor, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
          if (loan.rejectionReason != null && loan.rejectionReason!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              "Reason: ${loan.rejectionReason}",
              style: AppTypography.bodySmall(color: textColor),
            ),
          ],
          const SizedBox(height: 10),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: textColor,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            icon: const Icon(Icons.replay_rounded, size: 16),
            label: const Text("Try Another Lender", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
            onPressed: () => _showTryAnotherLenderDialog(loan),
          ),
        ],
      ),
    );
  }

  // ----------------------------------------------------------------------
  // 5-STAGE PIPELINE STEPPER
  // ----------------------------------------------------------------------
  Widget _buildPipelineCard(
    LoanItemModel loan,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    final currentStageIdx = _stages.indexOf(loan.loanStage);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "5-STAGE SEQUENTIAL PIPELINE",
                style: AppTypography.heading(size: 13, color: textPrimary),
              ),
              if (loan.isSideStatusActive)
                TextButton.icon(
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.errorRed,
                    visualDensity: VisualDensity.compact,
                  ),
                  icon: const Icon(Icons.block_outlined, size: 14),
                  label: const Text("Mark Stopped", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                  onPressed: () => _showSideStatusModal(loan),
                ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            "Tap any step to advance with requirements or move backward",
            style: AppTypography.caption(color: textSecondary),
          ),
          const SizedBox(height: 16),

          // Stepper List
          Column(
            children: _stages.asMap().entries.map((entry) {
              final idx = entry.key;
              final stg = entry.value;
              final isCurrent = idx == currentStageIdx;
              final isPassed = idx < currentStageIdx;
              final desc = _stageDescriptions[stg];
              final stageMeta = LoanItemModel.stageConfig[stg] ?? {'color': Colors.grey};
              final stgColor = stageMeta['color'] as Color;

              return InkWell(
                onTap: () => _handleStepClick(loan, stg),
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isCurrent
                        ? stgColor.withValues(alpha: 0.10)
                        : isPassed
                            ? const Color(0xFFF0FDF4)
                            : Colors.transparent,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isCurrent
                          ? stgColor
                          : isPassed
                              ? const Color(0xFF86EFAC)
                              : borderColor,
                      width: isCurrent ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isPassed
                              ? const Color(0xFF16A34A)
                              : isCurrent
                                  ? stgColor
                                  : Colors.grey.withValues(alpha: 0.2),
                        ),
                        child: Center(
                          child: isPassed
                              ? const Icon(Icons.check, size: 16, color: Colors.white)
                              : Text(
                                  "${idx + 1}",
                                  style: TextStyle(
                                    color: isCurrent ? Colors.white : Colors.grey[700],
                                    fontWeight: FontWeight.w700,
                                    fontSize: 12,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              stg,
                              style: AppTypography.bodySmall(
                                color: isCurrent ? stgColor : textPrimary,
                                fontWeight: isCurrent ? FontWeight.w800 : FontWeight.w600,
                              ),
                            ),
                            if (desc != null)
                              Text(
                                desc['needed'] ?? '',
                                style: AppTypography.caption(color: textSecondary),
                              ),
                          ],
                        ),
                      ),
                      if (isCurrent)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: stgColor,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text("CURRENT", style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800)),
                        ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // ----------------------------------------------------------------------
  // FINANCIAL BREAKDOWN GRID (4 CARDS)
  // ----------------------------------------------------------------------
  Widget _buildFinancialGrid(
    LoanItemModel loan,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildMetricTile(
                title: "REQUESTED",
                value: Formatters.formatCurrency(loan.loanAmountApplied),
                color: textPrimary,
                cardBg: cardBg,
                borderColor: borderColor,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricTile(
                title: "SANCTIONED",
                value: loan.sanctionedAmount > 0 ? Formatters.formatCurrency(loan.sanctionedAmount) : "Pending",
                color: AppColors.emeraldGreen,
                cardBg: cardBg,
                borderColor: borderColor,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _buildMetricTile(
                title: "DISBURSED",
                value: loan.disbursedAmount > 0 ? Formatters.formatCurrency(loan.disbursedAmount) : "₹0",
                color: const Color(0xFF059669),
                cardBg: cardBg,
                borderColor: borderColor,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricTile(
                title: "MONTHLY EMI",
                value: "₹${loan.monthlyEmi.toStringAsFixed(0)} / mo",
                subtitle: "${loan.tenureMonths} Mos @ ${loan.interestRate}%",
                color: AppColors.skyBlue,
                cardBg: cardBg,
                borderColor: borderColor,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMetricTile({
    required String title,
    required String value,
    String? subtitle,
    required Color color,
    required Color cardBg,
    required Color borderColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: AppTypography.caption(color: Colors.grey, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(value, style: AppTypography.heading(size: 16, color: color)),
          if (subtitle != null) ...[
            const SizedBox(height: 2),
            Text(subtitle, style: AppTypography.caption(color: Colors.grey)),
          ],
        ],
      ),
    );
  }

  // ----------------------------------------------------------------------
  // DISBURSED BANNER WITH SUBSIDY TOGGLE
  // ----------------------------------------------------------------------
  Widget _buildDisbursedBanner(LoanItemModel loan, FinancingProvider provider) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF86EFAC)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: Color(0xFF059669)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  "Loan Disbursed to Installer / Credited",
                  style: AppTypography.bodyMedium(color: const Color(0xFF065F46), fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            loan.projectNumber != null
                ? "Recorded as project payment on Project #${loan.projectNumber}."
                : "Money received from lender for customer solar installation.",
            style: AppTypography.caption(color: const Color(0xFF047857)),
          ),
          const SizedBox(height: 8),
          const Divider(color: Color(0xFF86EFAC)),
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            value: loan.subsidyCreditedToLoan,
            activeColor: const Color(0xFF059669),
            title: const Text(
              "Subsidy credited to loan account",
              style: TextStyle(color: Color(0xFF065F46), fontWeight: FontWeight.w700, fontSize: 13),
            ),
            subtitle: const Text(
              "Mark when Central subsidy is directly adjusted against the loan balance",
              style: TextStyle(color: Color(0xFF047857), fontSize: 11),
            ),
            onChanged: (val) async {
              if (val == null) return;
              final res = await provider.updateLoan(loan.id, {'subsidy_credited_to_loan': val});
              if (res['success'] == true) {
                await _loadLoanDetails();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      backgroundColor: AppColors.emeraldGreen,
                      content: Text(val ? "Subsidy credit recorded" : "Subsidy credit adjustment removed"),
                    ),
                  );
                }
              }
            },
          ),
        ],
      ),
    );
  }

  // ----------------------------------------------------------------------
  // DOCUMENT VAULT (4 LOAN DOCUMENTS)
  // ----------------------------------------------------------------------
  Widget _buildDocumentVaultCard(
    LoanItemModel loan,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "DOCUMENT VAULT",
                style: AppTypography.heading(size: 13, color: textPrimary),
              ),
              Text(
                "${loan.documents.length} Uploaded",
                style: AppTypography.caption(color: textSecondary, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            "Sanction Letter, Bank Statement & KYC Verification",
            style: AppTypography.caption(color: textSecondary),
          ),
          const SizedBox(height: 14),

          Column(
            children: _requiredVaultDocs.map((docType) {
              LoanDocumentModel? existingDoc;
              try {
                existingDoc = loan.documents.firstWhere(
                  (d) => d.docType.toLowerCase().trim() == docType.toLowerCase().trim(),
                );
              } catch (_) {
                existingDoc = null;
              }

              // Fallback for Sanction Letter URL if not in documents array
              if (existingDoc == null && docType == 'Sanction Letter' && loan.sanctionLetterUrl != null && loan.sanctionLetterUrl!.isNotEmpty) {
                existingDoc = LoanDocumentModel(
                  id: 0,
                  loanId: loan.id,
                  docType: 'Sanction Letter',
                  fileUrl: loan.sanctionLetterUrl!,
                  verificationStatus: 'Verified',
                );
              }

              final hasDoc = existingDoc != null;

              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: hasDoc ? const Color(0xFFF0FDF4) : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: hasDoc ? const Color(0xFF86EFAC) : borderColor,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      hasDoc ? Icons.check_circle_rounded : Icons.description_outlined,
                      color: hasDoc ? AppColors.emeraldGreen : Colors.grey,
                      size: 24,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            docType,
                            style: AppTypography.bodySmall(
                              color: textPrimary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Text(
                            hasDoc
                                ? "Verified & Uploaded"
                                : "Required for lender clearance",
                            style: AppTypography.caption(
                              color: hasDoc ? AppColors.emeraldGreen : textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),

                    if (hasDoc) ...[
                      IconButton(
                        icon: const Icon(Icons.visibility_outlined, size: 20, color: AppColors.skyBlue),
                        onPressed: () => _showImagePreviewDialog(docType, existingDoc!.fileUrl),
                        tooltip: "Preview",
                      ),
                    ],

                    IconButton(
                      icon: const Icon(Icons.camera_alt_outlined, size: 20, color: AppColors.brandPrimary),
                      onPressed: () => _pickAndUploadDocument(docType, ImageSource.camera),
                      tooltip: "Camera Capture",
                    ),
                    IconButton(
                      icon: const Icon(Icons.photo_library_outlined, size: 20, color: AppColors.brandPrimary),
                      onPressed: () => _pickAndUploadDocument(docType, ImageSource.gallery),
                      tooltip: "Gallery Upload",
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // ----------------------------------------------------------------------
  // SPECS & TECHNICAL DETAILS
  // ----------------------------------------------------------------------
  Widget _buildSpecsCard(
    LoanItemModel loan,
    Color cardBg,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "FINANCING & DISCOM DETAILS",
            style: AppTypography.heading(size: 13, color: textPrimary),
          ),
          const SizedBox(height: 12),
          _buildSpecRow("System Capacity", "${loan.systemCapacityKw.toStringAsFixed(1)} kW", textPrimary, textSecondary),
          _buildSpecRow("Total Quoted Cost", Formatters.formatCurrency(loan.totalProjectCost), textPrimary, textSecondary),
          _buildSpecRow("Expected Subsidy", Formatters.formatCurrency(loan.subsidyExpected), textPrimary, textSecondary),
          _buildSpecRow("Down Payment", Formatters.formatCurrency(loan.downPaymentAmount), textPrimary, textSecondary),
          if (loan.bankBranch != null && loan.bankBranch!.isNotEmpty)
            _buildSpecRow("Bank Branch", loan.bankBranch!, textPrimary, textSecondary),
          if (loan.bankIfsc != null && loan.bankIfsc!.isNotEmpty)
            _buildSpecRow("IFSC Code", loan.bankIfsc!, textPrimary, textSecondary),
          if (loan.bankDsaName != null && loan.bankDsaName!.isNotEmpty)
            _buildSpecRow("DSA Agent", "${loan.bankDsaName}${loan.bankDsaPhone != null ? ' (${loan.bankDsaPhone})' : ''}", textPrimary, textSecondary),
          if (loan.internalNotes != null && loan.internalNotes!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text("Activity & Notes:", style: AppTypography.caption(color: textSecondary, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.grey.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(loan.internalNotes!, style: AppTypography.caption(color: textPrimary)),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSpecRow(String label, String value, Color textPrimary, Color textSecondary) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTypography.bodySmall(color: textSecondary)),
          Text(value, style: AppTypography.bodySmall(color: textPrimary, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
