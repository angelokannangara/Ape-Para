/**
 * Automated routing: decides which department receives a report.
 *
 * 1. Category rule  -> which TYPE of authority handles this kind of issue.
 * 2. Spatial rule   -> among departments of that type, the one whose
 *                      region_polygon contains the pin (ST_Covers). If several
 *                      overlap, the smallest (most local) region wins.
 * 3. Fallback       -> nearest department of that type within ROUTING_FALLBACK_KM.
 * 4. Otherwise      -> unrouted (assigned_department_id NULL) for admin triage.
 */
import { config } from '../config.js';

// Category rules. Adjust here if your authorities split responsibilities differently
// (e.g. send storm-drain blockages to the municipal council instead).
export const CATEGORY_TO_DEPARTMENT_TYPE = Object.freeze({
  pothole: 'municipal',
  garbage_dumping: 'municipal',
  broken_street_light: 'ceb',
  drainage_block: 'water_board',
});

export const CATEGORIES = Object.keys(CATEGORY_TO_DEPARTMENT_TYPE);

// Rough Sri Lanka bounding box (including offshore margin) used to reject bad pins.
export const SL_BOUNDS = Object.freeze({ minLat: 5.7, maxLat: 10.0, minLng: 79.4, maxLng: 82.0 });

export const isInSriLanka = (lat, lng) =>
  lat >= SL_BOUNDS.minLat && lat <= SL_BOUNDS.maxLat && lng >= SL_BOUNDS.minLng && lng <= SL_BOUNDS.maxLng;

const POLYGON_SQL = `
  SELECT d.id, d.name, d.type
  FROM departments d
  WHERE d.type = $3::department_type
    AND ST_Covers(d.region_polygon, ST_SetSRID(ST_MakePoint($1::float8, $2::float8), 4326))
  ORDER BY ST_Area(d.region_polygon::geography) ASC
  LIMIT 1`;

const NEAREST_SQL = `
  SELECT d.id, d.name, d.type,
         ST_Distance(d.region_polygon::geography,
                     ST_SetSRID(ST_MakePoint($1::float8, $2::float8), 4326)::geography) AS distance_m
  FROM departments d
  WHERE d.type = $3::department_type
  ORDER BY distance_m ASC
  LIMIT 1`;

/**
 * @param {{query: Function}} db  pg Pool or Client (so it can run inside a transaction)
 * @returns {Promise<{department: {id,name,type}|null, method: 'polygon'|'nearest'|'unrouted'}>}
 */
export async function routeReport(db, { category, lat, lng }) {
  const type = CATEGORY_TO_DEPARTMENT_TYPE[category];
  if (!type) return { department: null, method: 'unrouted' };

  const inside = await db.query(POLYGON_SQL, [lng, lat, type]); // PostGIS order: x=lng, y=lat
  if (inside.rows[0]) return { department: inside.rows[0], method: 'polygon' };

  const nearest = await db.query(NEAREST_SQL, [lng, lat, type]);
  const row = nearest.rows[0];
  if (row && row.distance_m <= config.routingFallbackKm * 1000) {
    return { department: { id: row.id, name: row.name, type: row.type }, method: 'nearest' };
  }
  return { department: null, method: 'unrouted' };
}
