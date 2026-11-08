import { statusMeta } from '../lib/constants.js';

export default function StatusBadge({ status }) {
  const m = statusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${m.badge}`}>
      <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}
