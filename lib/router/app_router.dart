/// Application routes and role-aware redirects.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';
import '../screens/home_screen.dart';
import '../screens/login_screen.dart';
import '../screens/my_reports_screen.dart';
import '../screens/nearby_screen.dart';
import '../screens/map_screen.dart';
import '../screens/officer_dashboard_screen.dart';

class AppRouter {
  final AuthProvider auth;
  late final GoRouter router;

  AppRouter(this.auth) {
    router = GoRouter(
      refreshListenable: auth,
      initialLocation: '/',
      redirect: (context, state) {
        final loggingIn = state.matchedLocation == '/login';
        if (!auth.loading && auth.user == null && !loggingIn) return '/login';
        if (auth.user != null && loggingIn) return '/';
        if (state.matchedLocation == '/dashboard') {
          final role = auth.profile?.role;
          if (role != 'department_officer' && role != 'admin') return '/';
        }
        return null;
      },
      routes: [
        GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
        GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
        GoRoute(path: '/my-reports', builder: (_, __) => const MyReportsScreen()),
        GoRoute(path: '/nearby', builder: (_, __) => const NearbyScreen()),
        GoRoute(path: '/map', builder: (_, __) => const MapScreen()),
        GoRoute(path: '/dashboard', builder: (_, __) => const OfficerDashboardScreen()),
      ],
      errorBuilder: (_, __) => const Scaffold(body: Center(child: Text('Page not found'))),
    );
  }
}
