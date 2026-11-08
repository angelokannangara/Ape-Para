/**
 * Automated routing, run in the browser (there is no server on the Firebase Spark plan).
 *
 * 1. Category rule -> which TYPE of authority handles this kind of issue.
 * 2. Spatial rule  -> the department of that type whose boundary contains the pin
 *                     (smallest boundary wins when regions overlap).
 * 3. Fallback      -> nearest department of that type within FALLBACK_KM.
 * 4. Otherwise     -> unrouted; an admin assigns it manually.
 *
 * departments: [{ id, name, type, polygons: [{ points: [{ lat, lng }, ...] }] }]
 */
export const CATEGORY_TO_DEPARTMENT_TYPE = {
  pothole: 'municipal',
  garbage_dumping: 'municipal',
  broken_street_light: 'ceb',
  drainage_block: 'water_board',
};
export const FALLBACK_KM = 50;

const M_PER_DEG_LAT = 111_320;

/** Ray casting; x = longitude, y = latitude. */
export function pointInRing(lat, lng, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]; const b = ring[j];
    const crosses = (a.lat > lat) !== (b.lat > lat)
      && lng < ((b.lng - a.lng) * (lat - a.lat)) / (b.lat - a.lat) + a.lng;
    if (crosses) inside = !inside;
  }
  return inside;
}

const ringArea = (ring) => {
  let s = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    s += (ring[j].lng + ring[i].lng) * (ring[j].lat - ring[i].lat);
  }
  return Math.abs(s / 2);
};

/** Distance in metres from a point to a segment, using a local flat projection (fine at city scale). */
function distanceToSegmentM(lat, lng, a, b) {
  const kx = M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
  const px = (lng - a.lng) * kx; const py = (lat - a.lat) * M_PER_DEG_LAT;
  const bx = (b.lng - a.lng) * kx; const by = (b.lat - a.lat) * M_PER_DEG_LAT;
  const len2 = bx * bx + by * by;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (px * bx + py * by) / len2));
  return Math.hypot(px - t * bx, py - t * by);
}

function distanceToDepartmentM(dept, lat, lng) {
  let best = Infinity;
  for (const { points } of dept.polygons) {
    if (pointInRing(lat, lng, points)) return 0;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      best = Math.min(best, distanceToSegmentM(lat, lng, points[j], points[i]));
    }
  }
  return best;
}

const deptArea = (d) => d.polygons.reduce((sum, p) => sum + ringArea(p.points), 0);
const contains = (d, lat, lng) => d.polygons.some((p) => pointInRing(lat, lng, p.points));

/** @returns {{ department: object|null, method: 'polygon'|'nearest'|'unrouted' }} */
export function routeReport(departments, { category, lat, lng, fallbackKm = FALLBACK_KM }) {
  const type = CATEGORY_TO_DEPARTMENT_TYPE[category];
  const candidates = departments.filter((d) => d.type === type && d.polygons?.length);
  if (!type || candidates.length === 0) return { department: null, method: 'unrouted' };

  const inside = candidates.filter((d) => contains(d, lat, lng)).sort((a, b) => deptArea(a) - deptArea(b));
  if (inside[0]) return { department: inside[0], method: 'polygon' };

  const ranked = candidates
    .map((d) => ({ d, dist: distanceToDepartmentM(d, lat, lng) }))
    .sort((a, b) => a.dist - b.dist);
  if (ranked[0].dist <= fallbackKm * 1000) return { department: ranked[0].d, method: 'nearest' };
  return { department: null, method: 'unrouted' };
}
