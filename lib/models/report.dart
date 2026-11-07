/// Report document model.
import 'package:cloud_firestore/cloud_firestore.dart';

class Report {
  final String id;
  final String reportId;
  final String userId;
  final String category;
  final String description;
  final String mediaUrl;
  final double lat;
  final double lng;
  final String addressText;
  final String targetDepartment;
  final String localBranch;
  final String branchEmail;
  final String dispatchStatus;
  final String status;
  final DateTime createdAt;

  const Report({
    required this.id,
    required this.reportId,
    required this.userId,
    required this.category,
    required this.description,
    required this.mediaUrl,
    required this.lat,
    required this.lng,
    required this.addressText,
    required this.targetDepartment,
    required this.localBranch,
    required this.branchEmail,
    required this.dispatchStatus,
    required this.status,
    required this.createdAt,
  });

  factory Report.fromSnapshot(DocumentSnapshot<Map<String, dynamic>> snapshot) {
    final data = snapshot.data() ?? <String, dynamic>{};
    final geo = data['location'] as GeoPoint?;
    final routing = Map<String, dynamic>.from(data['routingInfo'] as Map? ?? const {});
    final timestamp = data['createdAt'] as Timestamp?;
    return Report(
      id: snapshot.id,
      reportId: data['reportId'] as String? ?? snapshot.id,
      userId: data['userId'] as String? ?? '',
      category: data['category'] as String? ?? '',
      description: data['description'] as String? ?? '',
      mediaUrl: data['mediaUrl'] as String? ?? '',
      lat: geo?.latitude ?? 0,
      lng: geo?.longitude ?? 0,
      addressText: data['addressText'] as String? ?? '',
      targetDepartment: routing['targetDepartment'] as String? ?? '',
      localBranch: routing['localBranch'] as String? ?? '',
      branchEmail: routing['branchEmail'] as String? ?? '',
      dispatchStatus: routing['dispatchStatus'] as String? ?? 'unrouted',
      status: data['status'] as String? ?? 'Pending',
      createdAt: timestamp?.toDate() ?? DateTime.fromMillisecondsSinceEpoch(0),
    );
  }
}
