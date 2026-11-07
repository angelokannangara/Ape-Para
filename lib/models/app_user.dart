/// Citizen and officer profile model.
import 'package:cloud_firestore/cloud_firestore.dart';

class AppUserProfile {
  final String uid;
  final String name;
  final String email;
  final String role;
  final String? localBranchId;

  const AppUserProfile({
    required this.uid,
    required this.name,
    required this.email,
    required this.role,
    this.localBranchId,
  });

  factory AppUserProfile.fromSnapshot(DocumentSnapshot<Map<String, dynamic>> snapshot) {
    final data = snapshot.data() ?? <String, dynamic>{};
    return AppUserProfile(
      uid: snapshot.id,
      name: data['name'] as String? ?? '',
      email: data['email'] as String? ?? '',
      role: data['role'] as String? ?? 'citizen',
      localBranchId: data['localBranchId'] as String?,
    );
  }
}
