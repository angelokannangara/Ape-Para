import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MapPicker from '../components/MapPicker.jsx';
import { api } from '../lib/api.js';
import { CATEGORIES, inSriLanka } from '../lib/constants.js';

const MAX_MB = 5;
const fmt = (n) => n.toFixed(6);

export default function NewReport() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', category: '', description: '' });
  const [coords, setCoords] = useState(null);
  const [text, setText] = useState({ lat: '', lng: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [route, setRoute] = useState(null); // routing preview from the backend
  const [error, setError] = useState('');
  const [geoMsg, setGeoMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInput = useRef(null);

  const pin = (c) => { setCoords(c); setText({ lat: fmt(c.lat), lng: fmt(c.lng) }); setError(''); };

  const onCoordText = (key, value) => {
    const next = { ...text, [key]: value };
    setText(next);
    const lat = parseFloat(next.lat); const lng = parseFloat(next.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng) && inSriLanka(lat, lng)) setCoords({ lat, lng });
  };

  const useMyLocation = () => {
    setGeoMsg('');
    if (!navigator.geolocation) return setGeoMsg('Your browser does not support location.');
    setGeoMsg('Finding your location…');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const c = { lat: p.coords.latitude, lng: p.coords.longitude };
        if (!inSriLanka(c.lat, c.lng)) return setGeoMsg('Your location appears to be outside Sri Lanka. Tap the map to pin the issue instead.');
        pin(c); setGeoMsg('Location pinned. Drag the pin to adjust it.');
      },
      () => setGeoMsg('Could not get your location. Tap the map to pin it instead.'),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) { setError('Please choose a JPEG, PNG or WebP photo.'); e.target.value = ''; return; }
    if (f.size > MAX_MB * 1024 * 1024) { setError(`Photo must be under ${MAX_MB} MB.`); e.target.value = ''; return; }
    setError(''); setFile(f);
  };

  useEffect(() => {
    if (!file) { setPreview(null); return undefined; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Show which authority will receive the report once category + location are known.
  useEffect(() => {
    if (!coords || !form.category) { setRoute(null); return undefined; }
    let cancelled = false;
    const t = setTimeout(() => {
      api.resolveDepartment({ ...coords, category: form.category })
        .then((r) => { if (!cancelled) setRoute(r); })
        .catch(() => { if (!cancelled) setRoute(null); });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [coords, form.category]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.category) return setError('Please choose a category.');
    if (!coords) return setError('Please pin the location on the map.');
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('category', form.category);
    fd.append('lat', coords.lat);
    fd.append('lng', coords.lng);
    if (file) fd.append('image', file);
    setBusy(true);
    try {
      const { report } = await api.createReport(fd);
      navigate('/', { state: { flash: `Report submitted${report.department ? ` and sent to ${report.department.name}` : ''}. Thank you!` } });
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-extrabold text-maroon-800">Report an issue</h1>
      <p className="mb-6 text-ink-700">Tell us what is wrong and where. We will send it to the right authority automatically.</p>

      <form onSubmit={submit} className="space-y-6" noValidate>
        <section className="card space-y-4" aria-labelledby="what">
          <h2 id="what" className="text-xl font-bold">1. What is the problem?</h2>
          <div>
            <label htmlFor="category" className="label">Category</label>
            <select id="category" required className="input" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Choose a category…</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="title" className="label">Short title</label>
            <input id="title" required minLength={3} maxLength={120} className="input" placeholder="e.g. Deep pothole near the bus stand"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label htmlFor="description" className="label">Description</label>
            <textarea id="description" required minLength={5} maxLength={2000} rows={4} className="input"
              placeholder="How big is it? Is it dangerous? Any landmark nearby?"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </section>

        <section className="card space-y-3" aria-labelledby="photo">
          <h2 id="photo" className="text-xl font-bold">2. Add a photo</h2>
          <input ref={fileInput} id="image" type="file" accept="image/jpeg,image/png,image/webp" capture="environment"
            onChange={onFile} className="sr-only" />
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="image" className="btn btn-secondary cursor-pointer">📷 {file ? 'Change photo' : 'Take or choose a photo'}</label>
            {file && (
              <button type="button" className="text-sm font-semibold text-maroon-700 underline"
                onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = ''; }}>
                Remove
              </button>
            )}
            <span className="text-sm text-ink-700">JPEG, PNG or WebP, up to {MAX_MB} MB</span>
          </div>
          {preview && <img src={preview} alt="Preview of the photo you selected" className="max-h-64 rounded-xl border border-cream-200 object-contain" />}
        </section>

        <section className="card space-y-3" aria-labelledby="where">
          <h2 id="where" className="text-xl font-bold">3. Where is it?</h2>
          <p className="text-sm text-ink-700">Tap the map to drop a pin, drag it to fine-tune, or enter coordinates.</p>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-secondary" onClick={useMyLocation}>🎯 Use my location</button>
            <span role="status" aria-live="polite" className="text-sm text-ink-700">{geoMsg}</span>
          </div>
          <MapPicker value={coords} onChange={pin} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="lat" className="label">Latitude</label>
              <input id="lat" inputMode="decimal" className="input" placeholder="6.927100" value={text.lat}
                onChange={(e) => onCoordText('lat', e.target.value)} />
            </div>
            <div>
              <label htmlFor="lng" className="label">Longitude</label>
              <input id="lng" inputMode="decimal" className="input" placeholder="79.861200" value={text.lng}
                onChange={(e) => onCoordText('lng', e.target.value)} />
            </div>
          </div>
          <div aria-live="polite" className="min-h-[1.5rem] text-sm">
            {route?.department && (
              <p className="rounded-lg bg-lanka-50 p-3 font-medium text-lanka-800">
                ✅ Will be sent to <strong>{route.department.name}</strong>
              </p>
            )}
            {route && !route.department && (
              <p className="rounded-lg bg-saffron-50 p-3 font-medium text-ink-900">
                No authority covers this exact spot yet. Our team will assign it manually.
              </p>
            )}
          </div>
        </section>

        {error && <p role="alert" className="rounded-lg bg-maroon-50 p-3 font-medium text-maroon-800">{error}</p>}
        <button className="btn btn-primary w-full sm:w-auto" disabled={busy}>{busy ? 'Submitting…' : 'Submit report'}</button>
      </form>
    </div>
  );
}
