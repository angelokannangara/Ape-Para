/// Logged-in citizen report history.
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../models/report.dart';
import '../services/report_service.dart';
import '../widgets/report_card.dart';

class MyReportsScreen extends StatelessWidget {
  const MyReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return const Scaffold(body: Center(child: Text('Please sign in')));
    return Scaffold(
      appBar: AppBar(title: const Text('My reports')),
      body: StreamBuilder<List<Report>>(
        stream: ReportService().watchMyReports(uid),
        builder: (context, snapshot) {
          if (snapshot.hasError) return Center(child: Text(snapshot.error.toString()));
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final reports = snapshot.data ?? [];
          if (reports.isEmpty) return const Center(child: Text('No reports yet.'));
          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: reports.length,
            itemBuilder: (_, index) => ReportCard(report: reports[index]),
          );
        },
      ),
    );
  }
}
