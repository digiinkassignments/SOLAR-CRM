import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

class WhatsAppHelper {
  /// Opens WhatsApp conversation with a given phone number and optional pre-filled text
  static Future<bool> launchWhatsApp({
    required BuildContext? context,
    required String phone,
    String text = "",
  }) async {
    final clean = phone.replaceAll(RegExp(r'[^0-9]'), '');
    if (clean.isEmpty) {
      if (context != null && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Phone number not available."),
            duration: Duration(seconds: 2),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
      return false;
    }

    // Format for India (+91) if standard 10-digit number
    final fullPhone = clean.length == 10 ? "91$clean" : clean;
    final encodedText = Uri.encodeComponent(text);

    // 1. Native app scheme: whatsapp://send?phone=...
    final nativeUri = Uri.parse(
      text.isNotEmpty
          ? "whatsapp://send?phone=$fullPhone&text=$encodedText"
          : "whatsapp://send?phone=$fullPhone",
    );

    // 2. Universal web / intent fallback: https://wa.me/...
    final webUri = Uri.parse(
      text.isNotEmpty
          ? "https://wa.me/$fullPhone?text=$encodedText"
          : "https://wa.me/$fullPhone",
    );

    // 3. Secondary web fallback: https://api.whatsapp.com/send?phone=...
    final apiUri = Uri.parse(
      text.isNotEmpty
          ? "https://api.whatsapp.com/send?phone=$fullPhone&text=$encodedText"
          : "https://api.whatsapp.com/send?phone=$fullPhone",
    );

    try {
      final launchedNative = await launchUrl(
        nativeUri,
        mode: LaunchMode.externalNonBrowserApplication,
      );
      if (launchedNative) return true;
    } catch (_) {}

    try {
      final launchedWeb = await launchUrl(
        webUri,
        mode: LaunchMode.externalApplication,
      );
      if (launchedWeb) return true;
    } catch (_) {}

    try {
      final launchedApi = await launchUrl(
        apiUri,
        mode: LaunchMode.externalApplication,
      );
      if (launchedApi) return true;
    } catch (_) {}

    // Fallback if WhatsApp is not installed or unable to open
    if (text.isNotEmpty) {
      Clipboard.setData(ClipboardData(text: text));
    }
    if (context != null && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            text.isNotEmpty
                ? "Could not open WhatsApp directly. Pitch copied to clipboard!"
                : "Could not open WhatsApp. Please ensure WhatsApp is installed.",
          ),
          duration: const Duration(seconds: 3),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
    return false;
  }

  /// Launch phone dialer
  static Future<bool> launchDialer(String phone) async {
    final clean = phone.replaceAll(RegExp(r'[^0-9+]'), '');
    if (clean.isEmpty) return false;
    final uri = Uri.parse("tel:$clean");
    try {
      return await launchUrl(uri);
    } catch (_) {
      return false;
    }
  }

  /// Launch email client
  static Future<bool> launchEmail(String email) async {
    if (email.trim().isEmpty) return false;
    final uri = Uri.parse("mailto:${email.trim()}");
    try {
      return await launchUrl(uri);
    } catch (_) {
      return false;
    }
  }
}

