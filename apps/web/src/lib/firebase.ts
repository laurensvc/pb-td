import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();

export function signInWithGoogle(): Promise<User | null> {
  if (!auth) return Promise.resolve(null);
  return signInWithPopup(auth, googleProvider).then((r) => r.user);
}

export function signOutUser(): Promise<void> {
  if (!auth) return Promise.resolve();
  return signOut(auth);
}

export function onAuthChange(cb: (user: User | null) => void): () => void {
  if (!auth) {
    cb({ uid: 'dev-user', displayName: 'Dev Player' } as User);
    return () => {};
  }
  return onAuthStateChanged(auth, cb);
}
