/// Administrative jurisdiction boundary model.
import 'package:latlong2/latlong.dart';

class Jurisdiction {
  final String id;
  final String name;
  final String department;
  final String email;
  final List<LatLng> polygon;

  const Jurisdiction({
    required this.id,
    required this.name,
    required this.department,
    required this.email,
    required this.polygon,
  });

  LatLng get centroid {
    if (polygon.isEmpty) return const LatLng(0, 0);
    final lat = polygon.map((point) => point.latitude).reduce((a, b) => a + b) / polygon.length;
    final lng = polygon.map((point) => point.longitude).reduce((a, b) => a + b) / polygon.length;
    return LatLng(lat, lng);
  }
}
