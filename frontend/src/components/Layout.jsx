import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationBell from './NotificationBell.jsx';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl bg-saffron-400 text-2xl">📍</span>
      <span className="leading-tight">
        <span className="block text-xl font-extrabold tracking-tight">Ape Para</span>
        <span className="block text-sm text-saffron-300">අපේ පාර · Our Road</span>
      </span>
    </Link>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-base font-semibold ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`;

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[2000] focus:rounded focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <header className="bg-maroon-700 text-white shadow-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Logo />
          <nav aria-label="Main" className="flex flex-wrap items-center gap-2">
            {user ? (
              <>
                <NavLink to="/" end className={navClass}>Dashboard</NavLink>
                {(user.role === 'citizen' || user.role === 'admin') && (
                  <NavLink to="/reports/new" className={navClass}>Report an issue</NavLink>
                )}
                {user.role === 'admin' && <NavLink to="/admin" className={navClass}>Admin</NavLink>}
                <NotificationBell />
                <span className="hidden text-sm text-saffron-300 sm:inline">{user.fullName || user.email}</span>
                <button type="button" className="rounded-lg border border-white/40 px-3 py-2 text-base font-semibold hover:bg-white/10"
                  onClick={() => { logout(); navigate('/login'); }}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navClass}>Log in</NavLink>
                <NavLink to="/register" className="rounded-lg bg-saffron-400 px-4 py-2 text-base font-bold text-ink-900 hover:bg-saffron-300">Register</NavLink>
              </>
            )}
          </nav>
        </div>
        {/* Sri Lankan flag-inspired accent stripe */}
        <div aria-hidden="true" className="flex h-1.5"><span className="flex-1 bg-lanka-700" /><span className="flex-1 bg-saffron-400" /><span className="flex-[3] bg-maroon-900" /></div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-cream-200 bg-cream-100 py-4 text-center text-sm text-ink-700">
        Ape Para · Helping every community keep Sri Lanka's roads, lights and drains in good repair.
      </footer>
    </div>
  );
}
