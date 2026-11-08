-- Sample departments for the Colombo pilot.
-- Coordinates are copied from lib/services/jurisdictions.dart and are APPROXIMATE
-- PLACEHOLDERS. Replace with vetted boundaries before production routing.
-- WKT order is (longitude latitude).

INSERT INTO departments (name, type, contact_email, region_polygon) VALUES
(
  'Colombo Municipal Council', 'municipal', 'info@colombo.mc.example',
  ST_Multi(ST_GeomFromText('POLYGON((79.8400 6.9100, 79.8900 6.9100, 79.8900 6.9400, 79.8400 6.9400, 79.8400 6.9100))', 4326))
),
(
  'CEB Colombo Central', 'ceb', 'colombo-central@ceb.example',
  ST_Multi(ST_GeomFromText('POLYGON((79.8400 6.8950, 79.8700 6.8950, 79.8700 6.9100, 79.8400 6.9100, 79.8400 6.8950))', 4326))
),
(
  'National Water Supply & Drainage Board — Colombo West', 'water_board', 'west@nwsb.example',
  ST_Multi(ST_GeomFromText('POLYGON((79.8200 6.9400, 79.8500 6.9400, 79.8500 6.9700, 79.8200 6.9700, 79.8200 6.9400))', 4326))
)
ON CONFLICT (name) DO NOTHING;
