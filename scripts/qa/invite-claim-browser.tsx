import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '@/i18n';
import '@/index.css';
import ClaimInvite from '@/pages/ClaimInvite';

createRoot(document.getElementById('root')!).render(
  <MemoryRouter initialEntries={['/e/test-event/claim/test-token']}>
    <Routes>
      <Route path="/e/:slug/claim/:token" element={<ClaimInvite />} />
      <Route path="/e/:slug/dashboard" element={<p>Event-Dashboard geöffnet</p>} />
    </Routes>
  </MemoryRouter>,
);
