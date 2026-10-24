import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useSettings } from './store/settings.js';
import { useAnnounce } from './store/announce.js';
import { useResolvedTheme } from './lib/useMotion.js';
import Landing from './pages/Landing.jsx';
import Welcome from './pages/Welcome.jsx';
import Library from './pages/Library.jsx';

const Reader = lazy(() => import('./pages/Reader.jsx'));
const Captions = lazy(() => import('./pages/Captions.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const Help = lazy(() => import('./pages/Help.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

const TITLES = {
  '/': 'Saral · Accessible learning',
  '/start': 'Choose your setup · Saral',
  '/library': 'Library · Saral',
  '/captions': 'Live captions · Saral',
  '/settings': 'Display settings · Saral',
  '/help': 'Help · Saral',
  '/about': 'About · Saral',
};

function ThemeAndMotion() {
  const theme = useResolvedTheme();
  const motion = useSettings((s) => s.motion);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.motion = motion;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#141414';
  }, [theme, motion]);
  return null;
}

function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (TITLES[pathname]) document.title = TITLES[pathname];
    window.scrollTo(0, 0);
    // Move focus to the main landmark on navigation so screen-reader users hear the new page.
    const main = document.getElementById('main');
    if (main && pathname !== '/') main.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}

function LiveRegion() {
  const message = useAnnounce((s) => s.message);
  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}

function Loading() {
  return (
    <div className="grid min-h-[60dvh] place-items-center" role="status">
      <p className="spec">Loading…</p>
    </div>
  );
}

export default function App() {
  return (
    <>
      <ThemeAndMotion />
      <RouteEffects />
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <LiveRegion />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/start" element={<Welcome />} />
          <Route path="/library" element={<Library />} />
          <Route path="/read/:docId" element={<Reader />} />
          <Route path="/captions" element={<Captions />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/help" element={<Help />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
