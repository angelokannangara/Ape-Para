/// Point-in-polygon geometry helpers independent of Firebase.
import 'package:latlong2/latlong.dart';

bool pointInPolygon(LatLng point, List<LatLng> polygon) {
  var inside = false;
  for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    final a = polygon[i];
    final b = polygon[j];
    final onEdge = ((point.longitude - b.longitude) * (a.latitude - b.latitude) ==
            (a.longitude - b.longitude) * (point.latitude - b.latitude)) &&
        point.longitude >= (a.longitude < b.longitude ? a.longitude : b.longitude) &&
        point.longitude <= (a.longitude > b.longitude ? a.longitude : b.longitude) &&
        point.latitude >= (a.latitude < b.latitude ? a.latitude : b.latitude) &&
        point.latitude <= (a.latitude > b.latitude ? a.latitude : b.latitude);
    if (onEdge) return true;
    final crosses = (a.latitude > point.latitude) != (b.latitude > point.latitude) &&
        point.longitude <
            (b.longitude - a.longitude) * (point.latitude - a.latitude) /
                    (b.latitude - a.latitude) +
                a.longitude;
    if (crosses) inside = !inside;
  }
  return inside;
}
