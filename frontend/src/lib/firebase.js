import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** False until the VITE_FIREBASE_* variables are set; App shows a setup screen instead of crashing. */
export const firebaseConfigured = Boolean(cfg.apiKey && cfg.projectId && cfg.appId);

const app = firebaseConfigured ? initializeApp(cfg) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
