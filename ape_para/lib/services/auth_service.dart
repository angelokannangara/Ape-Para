/// Firebase email/password authentication.
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../core/exceptions.dart';

class AuthService {
  Stream<User?> authStateChanges() => FirebaseAuth.instance.authStateChanges();

  Future<UserCredential> signIn(String email, String password) async {
    try {
      return await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: email.trim(), password: password,
      );
    } on FirebaseAuthException catch (error) {
      throw AppException(error.message ?? 'Sign in failed.');
    } catch (_) {
      throw const AppException('Sign in failed. Please try again.');
    }
  }

  Future<UserCredential> signUp(String name, String email, String password) async {
    try {
      final credential = await FirebaseAuth.instance.createUserWithEmailAndPassword(
        email: email.trim(), password: password,
      );
      await credential.user?.updateDisplayName(name.trim());
      await FirebaseFirestore.instance.collection('users').doc(credential.user!.uid).set({
        'name': name.trim(),
        'email': email.trim(),
        'role': 'citizen',
        'localBranchId': null,
        'createdAt': FieldValue.serverTimestamp(),
      });
      return credential;
    } on FirebaseAuthException catch (error) {
      throw AppException(error.message ?? 'Registration failed.');
    } catch (_) {
      throw const AppException('Registration failed. Please try again.');
    }
  }

  Future<void> signOut() async {
    try {
      await FirebaseAuth.instance.signOut();
    } catch (_) {
      throw const AppException('Could not sign out. Please try again.');
    }
  }
}
