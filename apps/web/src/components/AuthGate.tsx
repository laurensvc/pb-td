import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { isFirebaseConfigured, onAuthChange, signInWithGoogle, signOutUser } from '../lib/firebase';

export function AuthGate({ children }: { children: (user: User) => React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthChange((u) => {
        setUser(u);
        setLoading(false);
      }),
    [],
  );

  if (loading) {
    return <div className="auth-screen">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="auth-screen">
        <h1>Project Facet</h1>
        <p>Maze · Gems · Shared-seed races</p>
        {!isFirebaseConfigured && (
          <p className="auth-hint">Firebase not configured — using dev session.</p>
        )}
        <button type="button" className="btn-primary" onClick={() => void signInWithGoogle()}>
          Continue with Google
        </button>
      </div>
    );
  }

  return (
    <>
      <header className="auth-bar">
        <span>{user.displayName ?? user.uid}</span>
        {isFirebaseConfigured && (
          <button type="button" className="btn-ghost" onClick={() => void signOutUser()}>
            Sign out
          </button>
        )}
      </header>
      {children(user)}
    </>
  );
}
