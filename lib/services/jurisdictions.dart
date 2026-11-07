/// Approximate sample boundaries for the Colombo pilot; real boundaries must replace these.
import 'package:latlong2/latlong.dart';

import '../models/jurisdiction.dart';

final List<Jurisdiction> jurisdictions = [
  Jurisdiction(
    id: 'colombo-mc',
    name: 'Colombo Municipal Council',
    department: 'Municipal/MC',
    email: 'info@colombo.mc.example',
    polygon: const [
      LatLng(6.9100, 79.8400),
      LatLng(6.9100, 79.8900),
      LatLng(6.9400, 79.8900),
      LatLng(6.9400, 79.8400),
    ],
  ),
  Jurisdiction(
    id: 'ceb-central',
    name: 'CEB Colombo Central',
    department: 'Electrical/CEB',
    email: 'colombo-central@ceb.example',
    polygon: const [
      LatLng(6.8950, 79.8400), LatLng(6.8950, 79.8700),
      LatLng(6.9100, 79.8700), LatLng(6.9100, 79.8400),
    ],
  ),
  Jurisdiction(
    id: 'nwsb-west',
    name: 'NWSB Colombo West',
    department: 'Water/NWSB',
    email: 'west@nwsb.example',
    polygon: const [
      LatLng(6.9400, 79.8200), LatLng(6.9400, 79.8500),
      LatLng(6.9700, 79.8500), LatLng(6.9700, 79.8200),
    ],
  ),
  Jurisdiction(
    id: 'rda-western',
    name: 'RDA Western Province',
    department: 'Road/RDA',
    email: 'western@rda.example',
    polygon: const [
      LatLng(6.9700, 79.8500), LatLng(6.9700, 79.9000),
      LatLng(7.0000, 79.9000), LatLng(7.0000, 79.8500),
    ],
  ),
];
