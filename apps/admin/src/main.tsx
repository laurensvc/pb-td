import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

function AdminApp() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Project Facet — Balance Admin</h1>
      <p>Phase 4 placeholder: wave editor, replay browser, seed simulation dashboard.</p>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>,
);
