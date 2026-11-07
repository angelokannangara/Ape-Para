/// Report submission and list state.
import 'dart:typed_data';

import 'package:flutter/foundation.dart';

import '../core/exceptions.dart';
import '../models/report.dart';
import '../services/report_service.dart';

class ReportProvider extends ChangeNotifier {
  final ReportService _service = ReportService();
  List<Report> reports = [];
  bool loading = false;
  String? error;

  Future<String?> submit({
    required Uint8List image,
    required String imageName,
    required String category,
    required String description,
    required double lng,
    required double lat,
    required String addressText,
  }) async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      final trackingId = await _service.submitReport(
        image: image, imageName: imageName, category: category,
        description: description, lng: lng, lat: lat, addressText: addressText,
      );
      loading = false;
      notifyListeners();
      return trackingId;
    } on AppException catch (errorValue) {
      error = errorValue.message;
      loading = false;
      notifyListeners();
      return null;
    }
  }

  Future<void> refresh(List<Report> value) async {
    reports = value;
    notifyListeners();
  }

  Future<void> updateStatus(String reportId, String status, String note) async {
    loading = true;
    notifyListeners();
    try {
      await _service.updateReportStatus(reportId, status, note);
      error = null;
    } on AppException catch (errorValue) {
      error = errorValue.message;
    } finally {
      loading = false;
      notifyListeners();
    }
  }
}
