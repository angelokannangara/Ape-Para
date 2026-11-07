/// Atomic human-readable report tracking ID generator.
import 'package:cloud_firestore/cloud_firestore.dart';

import '../core/exceptions.dart';

Future<String> generateTrackingId() async {
  final counterRef = FirebaseFirestore.instance.collection('counters').doc(
        'reports-${DateTime.now().year}',
      );
  try {
    final sequence = await FirebaseFirestore.instance.runTransaction((transaction) async {
      final snapshot = await transaction.get(counterRef);
      final next = ((snapshot.data()?['seq'] as num?)?.toInt() ?? 0) + 1;
      transaction.set(counterRef, {'seq': next, 'year': DateTime.now().year});
      return next;
    });
    return 'APR-${DateTime.now().year}-${sequence.toString().padLeft(4, '0')}';
  } catch (_) {
    throw const AppException('Could not generate a tracking ID. Please try again.');
  }
}
