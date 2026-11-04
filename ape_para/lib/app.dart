/// Registers routing and the Material 3 application theme.
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'router/app_router.dart';

class ApeParaApp extends StatelessWidget {
  const ApeParaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'අපේ පාර',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF00695C)),
      ),
      routerConfig: AppRouter(context.read<AuthProvider>()).router,
    );
  }
}
