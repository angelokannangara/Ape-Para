import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

SupabaseClient get supabase => Supabase.instance.client;

class AuthService {
  // The *web* OAuth client ID from Google Cloud (not the Android one).
  // Pass with --dart-define=GOOGLE_WEB_CLIENT_ID=xxxx.apps.googleusercontent.com
  static const _webClientId = String.fromEnvironment('GOOGLE_WEB_CLIENT_ID');
  static bool _googleReady = false;

  Future<void> _ensureGoogle() async {
    if (_googleReady) return;
    if (_webClientId.isEmpty) {
      throw const AuthException(
        'Google sign-in is not configured. Set GOOGLE_WEB_CLIENT_ID.',
      );
    }
    await GoogleSignIn.instance.initialize(serverClientId: _webClientId);
    _googleReady = true;
  }

  /// Native Google account picker, then exchange the ID token with Supabase.
  /// Throws GoogleSignInException (code: canceled) if the person backs out.
  Future<void> signInWithGoogle() async {
    await _ensureGoogle();
    final account = await GoogleSignIn.instance.authenticate();
    final idToken = account.authentication.idToken;
    if (idToken == null) {
      throw const AuthException('Google did not return an ID token.');
    }
    await supabase.auth.signInWithIdToken(
      provider: OAuthProvider.google,
      idToken: idToken,
    );
  }

  /// Turns what people actually type into E.164 (+947XXXXXXXX).
  /// Accepts: 0771234567, 771234567, 94771234567, +94771234567, "077 123 4567".
  /// Returns null if it isn't a valid Sri Lankan mobile number.
  static String? normalizeLkPhone(String input) {
    var d = input.replaceAll(RegExp(r'[^\d+]'), '');
    if (d.startsWith('+94')) {
      d = d.substring(3);
    } else if (d.startsWith('94') && d.length == 11) {
      d = d.substring(2);
    } else if (d.startsWith('0')) {
      d = d.substring(1);
    }
    // Sri Lankan mobiles are 9 digits after the country code and start with 7.
    if (!RegExp(r'^7\d{8}$').hasMatch(d)) return null;
    return '+94$d';
  }

  /// Sends a 6-digit SMS code. Also creates the account on first use.
  Future<void> sendOtp(String e164Phone) {
    return supabase.auth.signInWithOtp(phone: e164Phone);
  }

  /// Verifies the code. On success the session is stored on the device
  /// and onAuthStateChange fires, so AuthGate swaps screens by itself.
  Future<AuthResponse> verifyOtp(String e164Phone, String code) {
    return supabase.auth.verifyOTP(
      phone: e164Phone,
      token: code,
      type: OtpType.sms,
    );
  }

  Future<void> signOut() async {
    try {
      await _ensureGoogle();
      await GoogleSignIn.instance.signOut();
    } catch (_) {
      // Not signed in with Google, or already signed out. Safe to ignore.
    }
    await supabase.auth.signOut();
  }

  User? get currentUser => supabase.auth.currentUser;
}
