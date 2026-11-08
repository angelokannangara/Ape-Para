/**
 * Sample departments for the Colombo pilot. Coordinates are APPROXIMATE PLACEHOLDERS:
 * replace them with real boundaries before relying on routing.
 */
const rect = (minLat, minLng, maxLat, maxLng) => [{
  points: [
    { lat: minLat, lng: minLng }, { lat: minLat, lng: maxLng },
    { lat: maxLat, lng: maxLng }, { lat: maxLat, lng: minLng },
  ],
}];

export const SAMPLE_DEPARTMENTS = [
  { id: 'colombo-mc', name: 'Colombo Municipal Council', type: 'municipal',
    contactEmail: 'info@colombo.mc.example', polygons: rect(6.91, 79.84, 6.94, 79.89) },
  { id: 'ceb-colombo-central', name: 'CEB Colombo Central', type: 'ceb',
    contactEmail: 'colombo-central@ceb.example', polygons: rect(6.895, 79.84, 6.91, 79.87) },
  { id: 'nwsdb-colombo-west', name: 'National Water Supply & Drainage Board — Colombo West', type: 'water_board',
    contactEmail: 'west@nwsb.example', polygons: rect(6.94, 79.82, 6.97, 79.85) },
];
