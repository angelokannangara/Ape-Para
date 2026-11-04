import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _auth = AuthService();
  final _phoneCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();

  String? _e164; // set once a code has been sent
  bool _loading = false;
  String? _error;
  int _resendIn = 0;
  Timer? _timer;

  bool get _codeSent => _e164 != null;

  @override
  void dispose() {
    _timer?.cancel();
    _phoneCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  void _startCooldown() {
    _timer?.cancel();
    setState(() => _resendIn = 30);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_resendIn <= 1) {
        t.cancel();
      }
      if (mounted) setState(() => _resendIn = _resendIn - 1);
    });
  }

  Future<void> _googleSignIn() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await _auth.signInWithGoogle();
      // AuthGate reacts to the new session.
    } on GoogleSignInException catch (e) {
      if (e.code != GoogleSignInExceptionCode.canceled && mounted) {
        setState(() => _error = 'Google sign-in failed. Please try again.');
      }
    } on AuthException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) {
        setState(() => _error =
            'Could not sign in with Google. Check your connection and try again.');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _sendCode() async {
    final phone = AuthService.normalizeLkPhone(_phoneCtrl.text);
    if (phone == null) {
      setState(() => _error =
          'Enter a valid mobile number, for example 077 123 4567.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await _auth.sendOtp(phone);
      if (!mounted) return;
      setState(() => _e164 = phone);
      _startCooldown();
    } on AuthException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) {
        setState(() => _error =
            'Could not send the code. Check your connection and try again.');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verify() async {
    final code = _otpCtrl.text.trim();
    if (code.length != 6) {
      setState(() => _error = 'Enter the 6-digit code from the SMS.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await _auth.verifyOtp(_e164!, code);
      // Nothing else to do: AuthGate reacts to the new session.
    } on AuthException {
      if (mounted) {
        setState(() => _error =
            'That code is wrong or has expired. Check it, or request a new one.');
      }
    } catch (_) {
      if (mounted) {
        setState(() => _error =
            'Could not verify the code. Check your connection and try again.');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _changeNumber() {
    _timer?.cancel();
    setState(() {
      _e164 = null;
      _otpCtrl.clear();
      _error = null;
      _resendIn = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 56,
                    height: 8,
                    decoration: BoxDecoration(
                      color: scheme.secondary,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text('Ape Para',
                      style: text.displaySmall?.copyWith(
                          color: scheme.primary, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Text(
                      _codeSent
                          ? 'We sent a code to $_e164'
                          : 'Sign in to report problems and follow their progress.',
                      style: text.bodyLarge),
                  const SizedBox(height: 32),
                  if (!_codeSent) ...[
                    OutlinedButton.icon(
                      // Swap this icon for Google's official "G" logo asset
                      // to follow their branding guidelines.
                      onPressed: _loading ? null : _googleSignIn,
                      icon: const Icon(Icons.account_circle_outlined),
                      label: const Text('Continue with Google'),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(52),
                        backgroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        const Expanded(child: Divider()),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text('or use your mobile number',
                              style: text.bodySmall),
                        ),
                        const Expanded(child: Divider()),
                      ],
                    ),
                    const SizedBox(height: 16),
                  ],
                  if (!_codeSent)
                    TextField(
                      controller: _phoneCtrl,
                      keyboardType: TextInputType.phone,
                      autofillHints: const [AutofillHints.telephoneNumber],
                      onSubmitted: (_) => _sendCode(),
                      decoration: const InputDecoration(
                        labelText: 'Mobile number',
                        prefixText: '+94  ',
                        border: OutlineInputBorder(),
                        filled: true,
                        fillColor: Colors.white,
                      ),
                    )
                  else
                    TextField(
                      controller: _otpCtrl,
                      keyboardType: TextInputType.number,
                      maxLength: 6,
                      autofillHints: const [AutofillHints.oneTimeCode],
                      onSubmitted: (_) => _verify(),
                      decoration: const InputDecoration(
                        labelText: '6-digit code',
                        border: OutlineInputBorder(),
                        filled: true,
                        fillColor: Colors.white,
                      ),
                    ),
                  if (_error != null) ...[
                    const SizedBox(height: 8),
                    Text(_error!, style: TextStyle(color: scheme.error)),
                  ],
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: _loading ? null : (_codeSent ? _verify : _sendCode),
                    child: _loading
                        ? const SizedBox(
                            height: 22,
                            width: 22,
                            child: CircularProgressIndicator(strokeWidth: 2.5),
                          )
                        : Text(_codeSent ? 'Verify and continue' : 'Send code'),
                  ),
                  if (_codeSent) ...[
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        TextButton(
                          onPressed: _loading ? null : _changeNumber,
                          child: const Text('Change number'),
                        ),
                        TextButton(
                          onPressed:
                              (_loading || _resendIn > 0) ? null : _sendCode,
                          child: Text(_resendIn > 0
                              ? 'Resend in ${_resendIn}s'
                              : 'Resend code'),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}