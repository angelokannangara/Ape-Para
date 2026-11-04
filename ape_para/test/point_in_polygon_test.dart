/// Geometry unit tests.
import 'package:flutter_test/flutter_test.dart';
import 'package:latlong2/latlong.dart';

import 'package:ape_para/utils/point_in_polygon.dart';

void main() {
  final rectangle = [
    const LatLng(0, 0), const LatLng(0, 10),
    const LatLng(10, 10), const LatLng(10, 0),
  ];

  test('point inside rectangle', () {
    expect(pointInPolygon(const LatLng(5, 5), rectangle), isTrue);
  });

  test('point outside rectangle', () {
    expect(pointInPolygon(const LatLng(12, 5), rectangle), isFalse);
  });

  test('point on vertex is inside', () {
    expect(pointInPolygon(const LatLng(0, 0), rectangle), isTrue);
  });
}
