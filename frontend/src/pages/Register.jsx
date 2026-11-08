import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    setBusy(true);
    try {
      await register({ ...form, fullName: form.fullName || undefined });
      navigate('/', { replace: true });
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-2xl font-extrabold text-maroon-800">Join Ape Para</h1>
        <p className="mb-5 text-ink-700">Help keep your neighbourhood safe and in good repair.</p>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="name" className="label">Full name <span className="font-normal">(optional)</span></label>
            <input id="name" autoComplete="name" className="input" value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" autoComplete="email" required className="input" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input id="password" type="password" autoComplete="new-password" required minLength={8}
              aria-describedby="pw-hint" className="input" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <p id="pw-hint" className="mt-1 text-sm text-ink-700">At least 8 characters.</p>
          </div>
          {error && <p role="alert" className="rounded-lg bg-maroon-50 p-3 text-sm font-medium text-maroon-800">{error}</p>}
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        </form>
        <p className="mt-5 text-center text-ink-700">
          Already registered? <Link to="/login" className="font-semibold text-lanka-700 underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
