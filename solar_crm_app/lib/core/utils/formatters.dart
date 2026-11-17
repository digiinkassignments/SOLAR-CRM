import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/app_colors.dart';

class Formatters {
  static final NumberFormat _currencyFormatter = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹ ',
    decimalDigits: 0,
  );

  /// Format Indian Rupee currency (compact or full)
  static String formatCurrency(double amount, {bool compact = false}) {
    if (compact) {
      if (amount >= 10000000) {
        return "₹ ${(amount / 10000000).toStringAsFixed(2)} Cr";
      } else if (amount >= 100000) {
        return "₹ ${(amount / 100000).toStringAsFixed(2)} L";
      } else if (amount >= 1000) {
        return "₹ ${(amount / 1000).toStringAsFixed(1)} K";
      }
    }
    return _currencyFormatter.format(amount);
  }

  /// Format solar kW capacity
  static String formatKw(double kw) {
    if (kw <= 0) return "0 kW";
    if (kw % 1 == 0) {
      return "${kw.toInt()} kW";
    }
    return "${kw.toStringAsFixed(2)} kW";
  }

  /// Format date string e.g. "2026-11-17T06:00:00.000Z" -> "17 Nov 2026"
  static String formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return "-";
    try {
      final dt = DateTime.parse(dateStr).toLocal();
      return DateFormat("dd MMM yyyy").format(dt);
    } catch (_) {
      return dateStr;
    }
  }

  /// Format time e.g. "11:30 AM"
  static String formatTime(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return "";
    try {
      final dt = DateTime.parse(dateStr).toLocal();
      return DateFormat("hh:mm a").format(dt);
    } catch (_) {
      return "";
    }
  }

  /// Return intuitive color for solar lead status
  static Color getStatusColor(String status) {
    final lower = status.toLowerCase();
    if (lower.contains("won") || lower.contains("completed") || lower.contains("approved")) {
      return AppColors.successGreen;
    } else if (lower.contains("lost") || lower.contains("cancelled") || lower.contains("rejected")) {
      return AppColors.errorRed;
    } else if (lower.contains("progress") || lower.contains("survey") || lower.contains("site")) {
      return AppColors.skyBlue;
    } else if (lower.contains("quotation") || lower.contains("proposal")) {
      return AppColors.purple;
    } else if (lower.contains("new") || lower.contains("pending")) {
      return AppColors.brandPrimary;
    }
    return AppColors.textSecondaryDark;
  }
}

