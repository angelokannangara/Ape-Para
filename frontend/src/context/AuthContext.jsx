import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../lib/api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get())); // true while validating a saved token

  const logout = useCallback(() => { tokenStore.clear(); setUser(null); }, []);

  useEffect(() => { setUnauthorizedHandler(logout); }, [logout]);

  // Restore session on first load
  useEffect(() => {
    if (!tokenStore.get()) return;
    api.me().then((r) => setUser(r.user)).catch(logout).finally(() => setLoading(false));
  }, [logout]);

  const authenticate = useCallback(async (fn, payload) => {
    const { token, user: u } = await fn(payload);
    tokenStore.set(token);
    setUser(u);
    return u;
  }, []);

  const value = useMemo(() => ({
    user, loading, logout,
    login: (p) => authenticate(api.login, p),
    register: (p) => authenticate(api.register, p),
  }), [user, loading, logout, authenticate]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
