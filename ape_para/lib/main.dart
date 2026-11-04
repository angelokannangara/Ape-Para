/// Application entry point and Firebase bootstrap.
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app.dart';
import 'core/config.dart';
import 'providers/auth_provider.dart';
import 'providers/report_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: AppConfig.firebaseOptions);
  runApp(MultiProvider(
    providers: [
      ChangeNotifierProvider(create: (_) => AuthProvider()..initialize()),
      ChangeNotifierProvider(create: (_) => ReportProvider()),
    ],
    child: const ApeParaApp(),
  ));
}
