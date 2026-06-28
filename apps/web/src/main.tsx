import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthGate } from './components/AuthGate';
import FacetApp from './components/FacetApp';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthGate>{() => <FacetApp />}</AuthGate>
  </StrictMode>,
);
