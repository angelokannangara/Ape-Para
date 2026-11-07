/// Authentication state and current user profile.
import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

import '../core/exceptions.dart';
import '../models/app_user.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _service = AuthService();
  StreamSubscription<User?>? _subscription;
  User? user;
  AppUserProfile? profile;
  bool loading = false;
  String? error;

  void initialize() {
    _subscription = _service.authStateChanges().listen((value) async {
      user = value;
      profile = null;
      if (value != null) {
        final snapshot = await FirebaseFirestore.instance.collection('users').doc(value.uid).get();
        if (snapshot.exists) profile = AppUserProfile.fromSnapshot(snapshot);
      }
      notifyListeners();
    });
  }

  Future<void> signIn(String email, String password) async {
    _start();
    try {
      await _service.signIn(email, password);
    } on AppException catch (errorValue) {
      error = errorValue.message;
      notifyListeners();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> signUp(String name, String email, String password) async {
    _start();
    try {
      await _service.signUp(name, email, password);
    } on AppException catch (errorValue) {
      error = errorValue.message;
      notifyListeners();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() => _service.signOut();

  void _start() {
    loading = true;
    error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
