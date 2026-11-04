/// Nearby report feed.
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../models/report.dart';
import '../services/report_service.dart';
import '../widgets/category_filter.dart';
import '../widgets/report_card.dart';

class NearbyScreen extends StatefulWidget {
  const NearbyScreen({super.key});
  @override
  State<NearbyScreen> createState() => _NearbyScreenState();
}

class _NearbyScreenState extends State<NearbyScreen> {
  String category = 'All';
  late Future<List<Report>> _future = _load();

  Future<List<Report>> _load() async {
    final position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium),
    );
    return ReportService().fetchNearbyReports(position.latitude, position.longitude, 5);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nearby reports')),
      body: Column(children: [
        Padding(padding: const EdgeInsets.all(12), child: CategoryFilter(
          value: category,
          onChanged: (value) => setState(() => category = value ?? 'All'),
        )),
        Expanded(child: FutureBuilder<List<Report>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.hasError) return Center(child: Text(snapshot.error.toString()));
            if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
            final reports = snapshot.data!.where(
              (report) => category == 'All' || report.category == category,
            ).toList();
            if (reports.isEmpty) return const Center(child: Text('No nearby reports.'));
            return ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: reports.length,
              itemBuilder: (_, index) => ReportCard(report: reports[index]),
            );
          },
        )),
      ]),
    );
  }
}
