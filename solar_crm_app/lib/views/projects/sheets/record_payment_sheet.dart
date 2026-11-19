import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../models/customer_handover_model.dart';
import '../../../models/project_model.dart';
import '../../../providers/project_provider.dart';

class RecordPaymentSheet extends StatefulWidget {
  final ProjectModel project;
  final CustomerHandoverModel? handover;

  const RecordPaymentSheet({
    super.key,
    required this.project,
    this.handover,
  });

  static Future<void> show(
    BuildContext context, {
    required ProjectModel project,
    CustomerHandoverModel? handover,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => RecordPaymentSheet(
        project: project,
        handover: handover,
      ),
    );
  }

  @override
  State<RecordPaymentSheet> createState() => _RecordPaymentSheetState();
}

class _RecordPaymentSheetState extends State<RecordPaymentSheet> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _contractValueCtrl;
  late TextEditingController _amountPaidCtrl;
  final TextEditingController _newCollectionCtrl = TextEditingController();
  final TextEditingController _paymentRefCtrl = TextEditingController();

  String _paymentMode = "Bank Transfer (NEFT/RTGS)";
  bool _isSaving = false;
  String? _errorMessage;

  static const List<String> _paymentModes = [
    "Bank Transfer (NEFT/RTGS)",
    "UPI / QR",
    "Cheque",
    "Cash",
    "Direct Online Gateway",
  ];

  @override
  void initState() {
    super.initState();
    final contractVal = widget.handover?.contractValue ?? widget.project.totalCost;
    final amtPaid = widget.handover?.amountPaid ?? widget.project.amountReceived;

    _contractValueCtrl = TextEditingController(
      text: contractVal > 0 ? contractVal.toStringAsFixed(0) : "0",
    );
    _amountPaidCtrl = TextEditingController(
      text: amtPaid > 0 ? amtPaid.toStringAsFixed(0) : "0",
    );

    _contractValueCtrl.addListener(_onFieldChanged);
    _amountPaidCtrl.addListener(_onFieldChanged);
    _newCollectionCtrl.addListener(_onFieldChanged);
  }

  void _onFieldChanged() {
    setState(() {});
  }

  @override
  void dispose() {
    _contractValueCtrl.removeListener(_onFieldChanged);
    _amountPaidCtrl.removeListener(_onFieldChanged);
    _newCollectionCtrl.removeListener(_onFieldChanged);

    _contractValueCtrl.dispose();
    _amountPaidCtrl.dispose();
    _newCollectionCtrl.dispose();
    _paymentRefCtrl.dispose();
    super.dispose();
  }

  double get _contractVal => double.tryParse(_contractValueCtrl.text.trim()) ?? 0.0;
  double get _prevPaid => double.tryParse(_amountPaidCtrl.text.trim()) ?? 0.0;
  double get _newCollection => double.tryParse(_newCollectionCtrl.text.trim()) ?? 0.0;
  double get _totalPaid => _prevPaid + _newCollection;
  double get _netBalance => (_contractVal - _totalPaid).clamp(0.0, double.infinity);

  Future<void> _submitPayment() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    final provider = context.read<ProjectProvider>();
    final result = await provider.recordHandoverPayment(
      widget.project.id,
      contractValue: _contractVal,
      totalPaid: _totalPaid,
      paymentMode: _paymentMode,
      paymentRef: _paymentRefCtrl.text.trim(),
      currentHandover: widget.handover,
    );

    if (!mounted) return;
    setState(() => _isSaving = false);

    if (result['success'] == true) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            result['message'] ?? "Payment recorded and synced successfully!",
          ),
          backgroundColor: const Color(0xFF10B981),
        ),
      );
    } else {
      setState(() {
        _errorMessage = result['message'] ?? "Failed to save payment.";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? const Color(0xFF0F172A) : Colors.white;
    final cardBg = isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC);
    final borderColor = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSecondary = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final inputBg = isDark ? const Color(0xFF1E293B) : Colors.white;

    final formatter = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.85,
        ),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag Handle
            Center(
              child: Container(
                width: 36,
                height: 4,
                margin: const EdgeInsets.only(top: 10, bottom: 6),
                decoration: BoxDecoration(
                  color: borderColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  const Icon(Icons.payment_rounded, color: Color(0xFF16A34A), size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      "Record / Update Handover Payment",
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: textPrimary,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded, size: 20),
                    color: textSecondary,
                  ),
                ],
              ),
            ),
            Divider(color: borderColor, height: 1),

            // Scrollable Form Content
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Blue Info Callout
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF0C1929) : const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: isDark ? const Color(0xFF1E3A8A) : const Color(0xFFBFDBFE)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              Icons.info_outline_rounded,
                              size: 16,
                              color: isDark ? const Color(0xFF60A5FA) : const Color(0xFF2563EB),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                "Sync with Handover: As per commercial policy, zero documents or completion dossiers can be released until 100% of the contract value is collected.",
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isDark ? const Color(0xFF93C5FD) : const Color(0xFF1E40AF),
                                  height: 1.35,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      if (_errorMessage != null) ...[
                        Container(
                          padding: const EdgeInsets.all(10),
                          margin: const EdgeInsets.only(bottom: 14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF2F2),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFFCA5A5)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.error_outline_rounded, size: 16, color: Color(0xFFDC2626)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _errorMessage!,
                                  style: const TextStyle(fontSize: 12, color: Color(0xFFDC2626)),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],

                      // Contract Value & Amount Paid
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _contractValueCtrl,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              style: TextStyle(color: textPrimary, fontSize: 13),
                              validator: (v) {
                                if (v == null || v.trim().isEmpty) return "Required";
                                if (double.tryParse(v.trim()) == null) return "Invalid";
                                return null;
                              },
                              decoration: InputDecoration(
                                labelText: "Total Contract Amount (₹) *",
                                labelStyle: TextStyle(color: textSecondary, fontSize: 11),
                                prefixText: "₹ ",
                                prefixStyle: TextStyle(color: textSecondary, fontSize: 12),
                                filled: true,
                                fillColor: inputBg,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: TextFormField(
                              controller: _amountPaidCtrl,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              style: TextStyle(color: textPrimary, fontSize: 13),
                              validator: (v) {
                                if (v != null && v.trim().isNotEmpty && double.tryParse(v.trim()) == null) {
                                  return "Invalid";
                                }
                                return null;
                              },
                              decoration: InputDecoration(
                                labelText: "Amount Received So Far (₹)",
                                labelStyle: TextStyle(color: textSecondary, fontSize: 11),
                                prefixText: "₹ ",
                                prefixStyle: TextStyle(color: textSecondary, fontSize: 12),
                                filled: true,
                                fillColor: inputBg,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // New Collection & Payment Mode
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _newCollectionCtrl,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              style: TextStyle(color: textPrimary, fontSize: 13),
                              validator: (v) {
                                if (v != null && v.trim().isNotEmpty && double.tryParse(v.trim()) == null) {
                                  return "Invalid";
                                }
                                return null;
                              },
                              decoration: InputDecoration(
                                labelText: "New Collection Received Today (₹)",
                                labelStyle: TextStyle(color: textSecondary, fontSize: 11),
                                hintText: "e.g. 50000",
                                helperText: "Enter additional payment collected now",
                                helperStyle: TextStyle(fontSize: 10, color: textSecondary),
                                prefixText: "₹ ",
                                prefixStyle: TextStyle(color: textSecondary, fontSize: 12),
                                filled: true,
                                fillColor: inputBg,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              isExpanded: true,
                              initialValue: _paymentMode,
                              style: TextStyle(color: textPrimary, fontSize: 12),
                              dropdownColor: inputBg,
                              decoration: InputDecoration(
                                labelText: "Payment Mode",
                                labelStyle: TextStyle(color: textSecondary, fontSize: 11),
                                filled: true,
                                fillColor: inputBg,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                              ),
                              items: _paymentModes
                                  .map((m) => DropdownMenuItem(value: m, child: Text(m, overflow: TextOverflow.ellipsis)))
                                  .toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => _paymentMode = val);
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Reference Notes / UTR
                      TextFormField(
                        controller: _paymentRefCtrl,
                        style: TextStyle(color: textPrimary, fontSize: 13),
                        decoration: InputDecoration(
                          labelText: "UTR / Cheque No / Reference Notes",
                          labelStyle: TextStyle(color: textSecondary, fontSize: 11),
                          hintText: "e.g. UTR12345678, HDFC Cheque #004521",
                          filled: true,
                          fillColor: inputBg,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: borderColor)),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Net Balance After Collection Calculation Card
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: cardBg,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFCBD5E1), style: BorderStyle.solid),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              "Net Balance After Collection:",
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: textSecondary),
                            ),
                            Text(
                              formatter.format(_netBalance),
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                color: _netBalance == 0 ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Bottom Action Buttons
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: _isSaving ? null : () => Navigator.of(context).pop(),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              child: const Text("Cancel", style: TextStyle(fontWeight: FontWeight.w700)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _isSaving ? null : _submitPayment,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF0F172A),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              child: _isSaving
                                  ? const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                    )
                                  : const Text(
                                      "Save & Sync Payment",
                                      style: TextStyle(fontWeight: FontWeight.w700),
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
