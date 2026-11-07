/// Email and password sign-in and registration.
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _name = TextEditingController();
  bool _register = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _name.dispose();
    super.dispose();
  }

  Future<void> _submit(AuthProvider auth) async {
    if (_register) {
      await auth.signUp(_name.text, _email.text, _password.text);
    } else {
      await auth.signIn(_email.text, _password.text);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('අපේ පාර')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: ListView(padding: const EdgeInsets.all(24), children: [
            if (_register) TextField(controller: _name, decoration: const InputDecoration(labelText: 'Name')),
            TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email')),
            TextField(controller: _password, obscureText: true,
                decoration: const InputDecoration(labelText: 'Password (minimum 6 characters)')),
            const SizedBox(height: 16),
            if (auth.error != null) Text(auth.error!, style: const TextStyle(color: Colors.red)),
            FilledButton(
              onPressed: auth.loading ? null : () => _submit(auth),
              child: Text(auth.loading ? 'Please wait...' : (_register ? 'Register' : 'Sign in')),
            ),
            TextButton(
              onPressed: () => setState(() => _register = !_register),
              child: Text(_register ? 'Already have an account? Sign in' : 'Create an account'),
            ),
          ]),
        ),
      ),
    );
  }
}
