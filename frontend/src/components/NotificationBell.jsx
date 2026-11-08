import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = useCallback(() => {
    api.notifications().then((r) => { setItems(r.notifications); setUnread(r.unread); }).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000); // light polling; swap for SSE/WebSocket later
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      api.markNotificationsRead().then(() => setUnread(0)).catch(() => {});
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button" onClick={toggle} aria-haspopup="true" aria-expanded={open}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl hover:bg-white/20"
      >
        <span aria-hidden="true">🔔</span>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[22px] rounded-full bg-saffron-400 px-1.5 text-center text-xs font-bold text-ink-900">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-[1000] mt-2 w-80 max-w-[90vw] rounded-xl border border-cream-200 bg-white p-2 text-ink-900 shadow-xl">
          <p className="px-3 py-2 text-sm font-bold">Notifications</p>
          {items.length === 0 ? (
            <p className="px-3 py-4 text-sm text-ink-700">No notifications yet.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-cream-200 overflow-auto">
              {items.map((n) => (
                <li key={n.id} className={`px-3 py-2 text-sm ${n.read ? '' : 'bg-saffron-50'}`}>
                  <p>{n.message}</p>
                  <time className="text-xs text-ink-700" dateTime={n.createdAt}>
                    {new Date(n.createdAt).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
