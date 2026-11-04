/// Firestore operations for reports, routing, and officer updates.
import 'dart:math';
import 'dart:typed_data';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:latlong2/latlong.dart';

import '../core/exceptions.dart';
import '../models/jurisdiction.dart';
import '../models/report.dart';
import '../utils/point_in_polygon.dart';
import 'jurisdictions.dart';
import 'routing_service.dart';
import 'storage_service.dart';
import 'tracking_id_service.dart';

class ReportService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<String> submitReport({
    required Uint8List image,
    required String imageName,
    required String category,
    required String description,
    required double lng,
    required double lat,
    required String addressText,
  }) async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) throw const AppException('Please sign in before submitting a report.');
    try {
      final mediaUrl = await uploadReportImage(image, uid, imageName);
      final point = LatLng(lat, lng);
      Jurisdiction? matched;
      for (final jurisdiction in jurisdictions) {
        if (pointInPolygon(point, jurisdiction.polygon)) {
          matched = jurisdiction;
          break;
        }
      }
      final jurisdiction = matched ?? findJurisdiction(lng, lat);
      final trackingId = await generateTrackingId();
      final doc = _firestore.collection('reports').doc();
      final geohash = '${lat.toStringAsFixed(3)}${lng.toStringAsFixed(3)}';
      await doc.set(<String, Object?>{
        'reportId': trackingId,
        'userId': uid,
        'category': category,
        'description': description,
        'mediaUrl': mediaUrl,
        'location': GeoPoint(lat, lng),
        'locationLngLat': {'lng': lng, 'lat': lat},
        'geohash': geohash,
        'addressText': addressText,
        'routingInfo': {
          'targetDepartment': jurisdiction.department,
          'localBranch': matched == null ? 'Colombo Municipal Council' : jurisdiction.name,
          'branchEmail': matched == null ? 'info@colombo.mc.example' : jurisdiction.email,
          'dispatchStatus': matched == null ? 'unrouted' : 'pending',
          'jurisdictionId': matched?.id,
        },
        'status': 'Pending',
        'history': [
          {'status': 'Pending', 'note': 'Report submitted', 'changedBy': uid,
           'timestamp': FieldValue.serverTimestamp()},
        ],
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      return trackingId;
    } on AppException {
      rethrow;
    } catch (_) {
      throw const AppException('The report could not be submitted. Please try again.');
    }
  }

  Stream<List<Report>> watchMyReports(String uid) {
    return _firestore.collection('reports')
        .where('userId', isEqualTo: uid).orderBy('createdAt', descending: true)
        .snapshots().map((snapshot) =>
            snapshot.docs.map(Report.fromSnapshot).toList());
  }

  Future<List<Report>> fetchNearbyReports(double lat, double lng, double radiusKm) async {
    try {
      final snapshot = await _firestore.collection('reports').limit(200).get();
      final reports = snapshot.docs.map(Report.fromSnapshot).where((report) {
        final distance = _distanceKm(lat, lng, report.lat, report.lng);
        return distance <= radiusKm;
      }).toList();
      reports.sort((a, b) => _distanceKm(lat, lng, a.lat, a.lng)
          .compareTo(_distanceKm(lat, lng, b.lat, b.lng)));
      return reports;
    } catch (_) {
      throw const AppException('Nearby reports could not be loaded.');
    }
  }

  Future<void> updateReportStatus(String documentId, String newStatus, String note) async {
    final caller = FirebaseAuth.instance.currentUser;
    if (caller == null) throw const AppException('Sign in is required.');
    try {
      final user = await _firestore.collection('users').doc(caller.uid).get();
      final role = user.data()?['role'] as String?;
      if (role != 'department_officer' && role != 'admin') {
        throw const AppException('You do not have permission to update reports.');
      }
      await _firestore.collection('reports').doc(documentId).update({
        'status': newStatus,
        'updatedAt': FieldValue.serverTimestamp(),
        'history': FieldValue.arrayUnion([
          {'status': newStatus, 'note': note, 'changedBy': caller.uid,
           'timestamp': FieldValue.serverTimestamp()},
        ]),
      });
    } on AppException {
      rethrow;
    } catch (_) {
      throw const AppException('The report status could not be updated.');
    }
  }

  Future<List<Report>> fetchReportsForBranch(String branchName) async {
    try {
      final snapshot = await _firestore.collection('reports')
          .where('routingInfo.localBranch', isEqualTo: branchName).get();
      return snapshot.docs.map(Report.fromSnapshot).toList();
    } catch (_) {
      throw const AppException('Branch reports could not be loaded.');
    }
  }

  double _distanceKm(double lat1, double lng1, double lat2, double lng2) {
    const earthRadius = 6371.0;
    final dLat = (lat2 - lat1) * pi / 180;
    final dLng = (lng2 - lng1) * pi / 180;
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1 * pi / 180) * cos(lat2 * pi / 180) * sin(dLng / 2) * sin(dLng / 2);
    return earthRadius * 2 * atan2(sqrt(a), sqrt(1 - a));
  }
}
