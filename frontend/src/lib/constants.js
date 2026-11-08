export const CATEGORIES = [
  { value: 'pothole', label: 'Pothole / damaged road', authority: 'Municipal Council', icon: '🕳️' },
  { value: 'garbage_dumping', label: 'Garbage dumping', authority: 'Municipal Council', icon: '🗑️' },
  { value: 'broken_street_light', label: 'Broken street light', authority: 'Ceylon Electricity Board', icon: '💡' },
  { value: 'drainage_block', label: 'Water drainage block', authority: 'Water Board', icon: '🌊' },
];
export const categoryLabel = (v) => CATEGORIES.find((c) => c.value === v)?.label ?? v;
export const categoryIcon = (v) => CATEGORIES.find((c) => c.value === v)?.icon ?? '📍';

export const STATUSES = [
  { value: 'submitted', label: 'Submitted', color: '#6b5b53', badge: 'bg-cream-200 text-ink-900' },
  { value: 'in_review', label: 'In review', color: '#b36b00', badge: 'bg-saffron-100 text-ink-900' },
  { value: 'in_progress', label: 'In progress', color: '#0b5aa8', badge: 'bg-sky-100 text-sky-900' },
  { value: 'resolved', label: 'Resolved', color: '#00746d', badge: 'bg-lanka-100 text-lanka-800' },
];
export const statusMeta = (v) => STATUSES.find((s) => s.value === v) ?? STATUSES[0];

// Colombo — default map centre
export const DEFAULT_CENTER = [6.9271, 79.8612];
// Rough Sri Lanka bounds, used to keep the map framed on the island
export const SL_BOUNDS = [[5.7, 79.4], [10.0, 82.0]];
export const inSriLanka = (lat, lng) => lat >= 5.7 && lat <= 10.0 && lng >= 79.4 && lng <= 82.0;
