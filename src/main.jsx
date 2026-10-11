import { StrictMode, Suspense, lazy, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/style.css';

const PublicSharePage = lazy(() => import('./pages/share/PublicSharePage'));
const PrivateApp = lazy(() => import('./PrivateApp'));
function Entry() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const change = () => setHash(location.hash);
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => { if (hash.startsWith('#/share/')) document.getElementById('splash')?.remove(); }, [hash]);
  // Public links never mount the private authentication or cloud-sync providers.
  if (hash.startsWith('#/share/')) return <Suspense fallback={<p role="status">正在載入公開行程…</p>}><PublicSharePage token={hash.slice(8).split(/[/?]/)[0]} /></Suspense>;
  return <Suspense fallback={<p role="status">正在載入旅程…</p>}><PrivateApp /></Suspense>;
}
createRoot(document.getElementById('root')).render(
  <StrictMode><Entry /></StrictMode>
);
