/// Routes coordinates to a seeded jurisdiction.
import 'dart:math';
import 'package:latlong2/latlong.dart';

import '../models/jurisdiction.dart';
import '../utils/point_in_polygon.dart';
import 'jurisdictions.dart';

Jurisdiction findJurisdiction(double lng, double lat) {
  final point = LatLng(lat, lng);
  for (final jurisdiction in jurisdictions) {
    if (pointInPolygon(point, jurisdiction.polygon)) return jurisdiction;
  }
  Jurisdiction nearest = jurisdictions.first;
  var distance = double.infinity;
  for (final jurisdiction in jurisdictions) {
    final center = jurisdiction.centroid;
    final candidate = pow(point.latitude - center.latitude, 2) +
        pow(point.longitude - center.longitude, 2);
    if (candidate < distance) {
      distance = candidate.toDouble();
      nearest = jurisdiction;
    }
  }
  return nearest;
}
