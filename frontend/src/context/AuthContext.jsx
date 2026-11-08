import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase.js';
import { friendlyError } from '../lib/errors.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const toUser = (uid, d) => ({
  id: uid, email: d.email, fullName: d.fullName ?? null, role: d.role, departmentId: d.departmentId ?? null,
});

async function createProfile(fbUser, fullName) {
  const profile = {
    email: fbUser.email.toLowerCase(), fullName: fullName || null,
    role: 'citizen', departmentId: null, createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'users', fbUser.uid), profile);
  return profile;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const registering = useRef(false); // register() sets the user itself once the profile is written

  useEffect(() => {
    if (!auth) { setLoading(false); return undefined; }
    return onAuthStateChanged(auth, async (fbUser) => {
      if (registering.current) return;
      if (!fbUser) { setUser(null); setLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, 'users', fbUser.uid));
        setUser(toUser(fbUser.uid, snap.exists() ? snap.data() : await createProfile(fbUser)));
      } catch {
        await signOut(auth);
        setUser(null);
      } finally { setLoading(false); }
    });
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setLoading(true); // keeps ProtectedRoute on "Loading…" until the profile is fetched
    try { await signInWithEmailAndPassword(auth, email.trim(), password); } catch (e) {
      setLoading(false);
      throw new Error(friendlyError(e));
    }
  }, []);

  const register = useCallback(async ({ email, password, fullName }) => {
    registering.current = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const profile = await createProfile(cred.user, fullName);
      setUser(toUser(cred.user.uid, profile));
    } catch (e) {
      if (auth.currentUser) await signOut(auth).catch(() => {}); // don't stay half-registered
      throw new Error(friendlyError(e));
    } finally { registering.current = false; setLoading(false); }
  }, []);

  const logout = useCallback(() => signOut(auth), []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
