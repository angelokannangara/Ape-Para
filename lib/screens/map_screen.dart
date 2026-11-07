/// Optional OpenStreetMap report map with graceful loading and tile errors.
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

import '../models/report.dart';
import '../services/report_service.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});
  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
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
      appBar: AppBar(title: const Text('Nearby map')),
      body: FutureBuilder<List<Report>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.hasError) return Center(child: Text(snapshot.error.toString()));
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          final reports = snapshot.data!;
          final center = reports.isEmpty
              ? const LatLng(6.9271, 79.8612)
              : LatLng(reports.first.lat, reports.first.lng);
          return FlutterMap(
            options: MapOptions(initialCenter: center, initialZoom: 13),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'lk.apepara.app',
                errorTileCallback: (_, __, ___) {},
              ),
              MarkerLayer(markers: reports.map((report) => Marker(
                point: LatLng(report.lat, report.lng),
                width: 40,
                height: 40,
                child: const Icon(Icons.location_pin, color: Colors.red),
              )).toList()),
            ],
          );
        },
      ),
    );
  }
}
