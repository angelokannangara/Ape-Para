import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ReportsMap from '../components/ReportsMap.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ReportImage from '../components/ReportImage.jsx';
import { friendlyError } from '../lib/errors.js';
import { loadDepartments, reassignReport, subscribeReports, updateStatus } from '../lib/db.js';
import { STATUSES, categoryIcon, categoryLabel } from '../lib/constants.js';

const TITLES = {
  citizen: ['My reports', 'Track the issues you have reported.'],
  field_worker: ['Department reports', 'Issues assigned to your department.'],
  admin: ['All reports', 'Every report across all departments.'],
};

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(location.state?.flash || '');

  const canUpdate = user.role === 'field_worker' || user.role === 'admin';
  const [title, subtitle] = TITLES[user.role];

  // Realtime subscription: new reports and status changes appear without refreshing.
  useEffect(() => {
    setLoading(true);
    return subscribeReports(
      user,
      (list) => { setReports(list); setError(''); setLoading(false); },
      (err) => { setError(friendlyError(err)); setLoading(false); },
    );
  }, [user]);

  useEffect(() => {
    if (user.role === 'admin') loadDepartments().then(setDepartments).catch(() => {});
  }, [user.role]);

  useEffect(() => { // clear router state so the flash doesn't reappear on refresh
    if (location.state?.flash) window.history.replaceState({}, '');
  }, [location.state]);

  const visible = useMemo(() => (filter ? reports.filter((r) => r.status === filter) : reports), [reports, filter]);
  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s.value, reports.filter((r) => r.status === s.value).length])), [reports]);

  const run = async (fn) => {
    try { await fn(); setError(''); } catch (e) { setError(friendlyError(e)); }
  };
  const changeStatus = (report, status) => run(() => updateStatus(report, status));
  const reassign = (report, deptId) => {
    const dept = departments.find((d) => d.id === deptId);
    if (dept) run(() => reassignReport(report, dept));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-maroon-800">{title}</h1>
          <p className="text-ink-700">{subtitle}</p>
        </div>
        {user.role !== 'field_worker' && <Link to="/reports/new" className="btn btn-primary">+ Report an issue</Link>}
      </div>

      {flash && (
        <div role="status" className="flex items-start justify-between gap-3 rounded-xl bg-lanka-50 p-4 font-medium text-lanka-800">
          <span>✅ {flash}</span>
          <button type="button" aria-label="Dismiss message" className="font-bold" onClick={() => setFlash('')}>✕</button>
        </div>
      )}
      {error && <p role="alert" className="rounded-xl bg-maroon-50 p-4 font-medium text-maroon-800">{error}</p>}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Report counts by status">
        {STATUSES.map((s) => (
          <li key={s.value} className="card !p-4">
            <p className="text-3xl font-extrabold" style={{ color: s.color }}>{counts[s.value]}</p>
            <p className="text-sm font-semibold text-ink-700">{s.label}</p>
          </li>
        ))}
      </ul>

      <section aria-label="Map of reports">
        <ReportsMap reports={visible} selectedId={selectedId} onSelect={setSelectedId} />
      </section>

      <section aria-labelledby="list-h">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="list-h" className="text-xl font-bold">Reports ({visible.length})</h2>
          <div>
            <label htmlFor="filter" className="sr-only">Filter by status</label>
            <select id="filter" className="input !w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {loading && <p role="status" className="text-ink-700">Loading reports…</p>}
        {!loading && visible.length === 0 && (
          <div className="card text-center text-ink-700">
            <p className="text-lg">No reports here yet.</p>
            {user.role === 'citizen' && <Link to="/reports/new" className="btn btn-primary mt-3">Report your first issue</Link>}
          </div>
        )}

        <ul className="space-y-3">
          {visible.map((r) => (
            <li key={r.id} id={`report-${r.id}`}
              className={`card flex flex-col gap-4 sm:flex-row ${selectedId === r.id ? 'ring-4 ring-saffron-300' : ''}`}>
              {r.hasImage && <ReportImage reportId={r.id} alt={`Photo for ${r.title}`} />}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold">
                    <span aria-hidden="true">{categoryIcon(r.category)} </span>{r.title}
                  </h3>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-1 text-ink-700">{r.description}</p>
                <p className="mt-2 text-sm text-ink-700">
                  {categoryLabel(r.category)} · {r.department ? `Sent to ${r.department.name}` : 'Awaiting assignment'} ·{' '}
                  <time dateTime={r.createdAt}>{new Date(r.createdAt).toLocaleDateString()}</time>
                </p>
                <button type="button" className="mt-2 text-sm font-semibold text-lanka-700 underline"
                  onClick={() => { setSelectedId(r.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  Show on map
                </button>
              </div>
              {canUpdate && (
                <div className="sm:w-52">
                  <label htmlFor={`st-${r.id}`} className="label">Update status</label>
                  <select id={`st-${r.id}`} className="input" value={r.status} onChange={(e) => changeStatus(r, e.target.value)}>
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  {user.role === 'admin' && departments.length > 0 && (
                    <>
                      <label htmlFor={`dp-${r.id}`} className="label mt-3">Assigned to</label>
                      <select id={`dp-${r.id}`} className="input" value={r.department?.id ?? ''}
                        onChange={(e) => reassign(r, e.target.value)}>
                        {!r.department && <option value="">Unassigned</option>}
                        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
