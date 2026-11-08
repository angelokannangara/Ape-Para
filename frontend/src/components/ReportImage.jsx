import { useEffect, useRef, useState } from 'react';
import { loadReportImage } from '../lib/db.js';

/** Loads a report's photo only when it scrolls into view (photos are stored in a separate document). */
export default function ReportImage({ reportId, alt }) {
  const ref = useRef(null);
  const [src, setSrc] = useState(null);
  const [state, setState] = useState('idle'); // idle | loading | done | failed

  useEffect(() => {
    const el = ref.current;
    if (!el || state !== 'idle') return undefined;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      setState('loading');
      loadReportImage(reportId).then((u) => { setSrc(u); setState(u ? 'done' : 'failed'); }).catch(() => setState('failed'));
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [reportId, state]);

  return (
    <div ref={ref} className="h-40 w-full shrink-0 overflow-hidden rounded-xl bg-cream-100 sm:h-28 sm:w-40">
      {src ? <img src={src} alt={alt} className="h-full w-full object-cover" />
        : <p className="flex h-full items-center justify-center text-sm text-ink-700">
          {state === 'failed' ? 'Photo unavailable' : 'Loading photo…'}
        </p>}
    </div>
  );
}
