import { useEffect, useState } from 'react';
import { findUserByEmail, loadDepartments, seedDepartments, setUserRole } from '../lib/db.js';
import { friendlyError } from '../lib/errors.js';
import { SAMPLE_DEPARTMENTS } from '../lib/sampleDepartments.js';

const TYPE_LABEL = { municipal: 'Municipal Council', ceb: 'CEB', water_board: 'Water Board' };

export default function Admin() {
  const [departments, setDepartments] = useState(null);
  const [email, setEmail] = useState('');
  const [found, setFound] = useState(null);
  const [role, setRole] = useState('field_worker');
  const [deptId, setDeptId] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  const refresh = () => loadDepartments().then(setDepartments).catch((e) => setMsg({ type: 'error', text: friendlyError(e) }));
  useEffect(() => { refresh(); }, []);

  const guard = async (fn) => {
    setBusy(true); setMsg({ type: '', text: '' });
    try { await fn(); } catch (e) { setMsg({ type: 'error', text: friendlyError(e) }); } finally { setBusy(false); }
  };

  const seed = () => guard(async () => {
    await seedDepartments(SAMPLE_DEPARTMENTS);
    await refresh();
    setMsg({ type: 'ok', text: 'Sample departments added.' });
  });

  const lookup = (e) => {
    e.preventDefault();
    guard(async () => {
      const u = await findUserByEmail(email);
      setFound(u);
      if (!u) setMsg({ type: 'error', text: 'No account with that email. Ask them to register first.' });
      else { setRole(u.role === 'citizen' ? 'field_worker' : u.role); setDeptId(u.departmentId || ''); }
    });
  };

  const save = () => guard(async () => {
    if (role === 'field_worker' && !deptId) throw new Error('Choose a department for the field worker.');
    await setUserRole(found.id, role, deptId);
    setFound({ ...found, role, departmentId: role === 'field_worker' ? deptId : null });
    setMsg({ type: 'ok', text: `${found.email} is now ${role.replace('_', ' ')}.` });
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-extrabold text-maroon-800">Admin</h1>
      {msg.text && (
        <p role={msg.type === 'error' ? 'alert' : 'status'}
          className={`rounded-xl p-4 font-medium ${msg.type === 'error' ? 'bg-maroon-50 text-maroon-800' : 'bg-lanka-50 text-lanka-800'}`}>
          {msg.text}
        </p>
      )}

      <section className="card space-y-3" aria-labelledby="dep-h">
        <h2 id="dep-h" className="text-xl font-bold">Departments</h2>
        {departments === null && <p className="text-ink-700">Loading…</p>}
        {departments?.length === 0 && (
          <>
            <p className="text-ink-700">No departments yet. Reports cannot be routed until some exist.</p>
            <button className="btn btn-primary" onClick={seed} disabled={busy}>Add sample Colombo departments</button>
            <p className="text-sm text-ink-700">The sample boundaries are approximate placeholders. Replace them with real ones before real use.</p>
          </>
        )}
        {departments?.length > 0 && (
          <ul className="divide-y divide-cream-200">
            {departments.map((d) => (
              <li key={d.id} className="py-2">
                <p className="font-semibold">{d.name}</p>
                <p className="text-sm text-ink-700">{TYPE_LABEL[d.type]} · {d.polygons?.length ?? 0} boundary polygon(s)</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-4" aria-labelledby="staff-h">
        <h2 id="staff-h" className="text-xl font-bold">Staff access</h2>
        <p className="text-sm text-ink-700">The person must register first. Then find them by email and give them a role.</p>
        <form onSubmit={lookup} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[14rem] flex-1">
            <label htmlFor="staff-email" className="label">Email</label>
            <input id="staff-email" type="email" required className="input" value={email}
              onChange={(e) => { setEmail(e.target.value); setFound(null); }} />
          </div>
          <button className="btn btn-secondary" disabled={busy}>Find</button>
        </form>

        {found && (
          <div className="space-y-3 rounded-xl bg-cream-100 p-4">
            <p><strong>{found.email}</strong> · current role: {found.role.replace('_', ' ')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="role" className="label">Role</label>
                <select id="role" className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="citizen">Citizen</option>
                  <option value="field_worker">Field worker</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {role === 'field_worker' && (
                <div>
                  <label htmlFor="dept" className="label">Department</label>
                  <select id="dept" className="input" value={deptId} onChange={(e) => setDeptId(e.target.value)}>
                    <option value="">Choose…</option>
                    {(departments || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <button className="btn btn-primary" onClick={save} disabled={busy}>Save</button>
            <p className="text-sm text-ink-700">They will see the change the next time they log in.</p>
          </div>
        )}
      </section>
    </div>
  );
}
