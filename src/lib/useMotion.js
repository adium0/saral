import { useEffect, useState } from 'react';
import { useSettings } from '../store/settings.js';

function osReduced() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// True when decorative motion should be off: Calm mode, or the OS setting when Saral follows the system.
export function useReducedMotion() {
  const motion = useSettings((s) => s.motion);
  const [os, setOs] = useState(osReduced);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const on = () => setOs(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  if (motion === 'calm') return true;
  if (motion === 'full') return false;
  return os;
}

export function useResolvedTheme() {
  const theme = useSettings((s) => s.theme);
  const [dark, setDark] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const on = () => setDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  if (theme === 'system') return dark ? 'dark' : 'light';
  return theme;
}
