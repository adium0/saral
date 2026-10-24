import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useSettings } from '../store/settings.js';

export const btn = {
  primary:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 font-bold text-bg transition hover:-translate-y-0.5 hover:shadow-[0_6px_0_var(--accent)] active:translate-y-0 disabled:opacity-50',
  secondary:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-ink px-5 py-2 font-bold text-ink transition hover:bg-ink hover:text-bg disabled:opacity-50',
  ghost:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 font-bold text-ink transition hover:bg-surface-2 disabled:opacity-50',
  icon: 'inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink transition hover:bg-surface-2 disabled:opacity-40',
  accent:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 font-bold text-on-accent transition hover:-translate-y-0.5 hover:shadow-[0_6px_0_var(--ink)] disabled:opacity-50',
};

export function Logo({ className = '' }) {
  return (
    <Link to="/" className={`inline-flex min-h-11 items-center gap-2 font-display text-2xl font-semibold tracking-tight ${className}`}>
      <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-ink font-display text-lg text-accent">
        S
      </span>
      Saral
    </Link>
  );
}

const NAV = [
  ['/library', 'Library'],
  ['/captions', 'Live captions'],
  ['/settings', 'Display settings'],
  ['/help', 'Help'],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const motion = useSettings((s) => s.motion);
  const setS = useSettings((s) => s.set);
  const linkCls = ({ isActive }) =>
    `inline-flex min-h-11 items-center rounded-full px-4 font-bold ${isActive ? 'bg-ink text-bg' : 'hover:bg-surface-2'}`;
  return (
    <header className="no-print sticky top-0 z-40 border-b border-line-soft bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map(([to, label]) => (
              <li key={to}>
                <NavLink to={to} className={linkCls}>
                  {label}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                type="button"
                className={btn.ghost}
                aria-pressed={motion === 'calm'}
                onClick={() => setS({ motion: motion === 'calm' ? 'system' : 'calm' })}
              >
                Calm mode {motion === 'calm' ? 'on' : 'off'}
              </button>
            </li>
          </ul>
        </nav>
        <button
          type="button"
          className={`${btn.icon} md:hidden`}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          <span className="sr-only">Menu</span>
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-line-soft px-4 pb-4 md:hidden">
          <ul className="flex flex-col gap-1 pt-2">
            {NAV.map(([to, label]) => (
              <li key={to}>
                <NavLink to={to} className={linkCls} onClick={() => setOpen(false)}>
                  {label}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                type="button"
                className={btn.ghost}
                aria-pressed={motion === 'calm'}
                onClick={() => setS({ motion: motion === 'calm' ? 'system' : 'calm' })}
              >
                Calm mode {motion === 'calm' ? 'on' : 'off'}
              </button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print mt-24 border-t border-line-soft">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <Logo />
          <p className="mt-2 max-w-xs text-muted">Any study material, in the format your eyes, ears and brain need.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid gap-1">
            <li>
              <Link className="underline underline-offset-4" to="/library">
                Library
              </Link>
            </li>
            <li>
              <Link className="underline underline-offset-4" to="/help">
                Help and keyboard shortcuts
              </Link>
            </li>
            <li>
              <Link className="underline underline-offset-4" to="/about">
                About, privacy and credits
              </Link>
            </li>
          </ul>
        </nav>
        <p className="spec self-end sm:text-right">Built for VIT AI Innovate-A-Thon · Q17 · SDG 4 &amp; 10</p>
      </div>
    </footer>
  );
}

export function Page({ children, narrow = false }) {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className={`mx-auto px-4 py-10 outline-none sm:px-6 ${narrow ? 'max-w-3xl' : 'max-w-6xl'}`}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

export function SpecLabel({ children, className = '' }) {
  return <p className={`spec ${className}`}>{children}</p>;
}
