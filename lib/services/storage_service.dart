/// Firebase Storage uploads for report photos.
import 'dart:typed_data';

import 'package:firebase_storage/firebase_storage.dart';

import '../core/exceptions.dart';

Future<String> uploadReportImage(Uint8List bytes, String uid, String fileName) async {
  final extension = fileName.toLowerCase().split('.').last;
  final contentType = switch (extension) {
    'png' => 'image/png',
    'webp' => 'image/webp',
    'gif' => 'image/gif',
    _ => 'image/jpeg',
  };
  try {
    final path = 'reports/$uid/${DateTime.now().millisecondsSinceEpoch}.$extension';
    final reference = FirebaseStorage.instance.ref(path);
    await reference.putData(bytes, SettableMetadata(contentType: contentType));
    return await reference.getDownloadURL();
  } catch (_) {
    throw const AppException('The photo could not be uploaded. Please try again.');
  }
}
