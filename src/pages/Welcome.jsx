import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Eye, BookOpenText, Ear, Target } from 'lucide-react';
import { Page, btn, SpecLabel } from '../components/Shell.jsx';
import { useSettings, PRESETS, DEFAULTS, FONTS } from '../store/settings.js';
import { announce } from '../store/announce.js';

const ICONS = { 'low-vision': Eye, dyslexia: BookOpenText, hearing: Ear, focus: Target };

// Preview colours per preset, independent of the current theme, so each card shows its own look.
const PREVIEW_THEME = {
  'low-vision': { background: '#000', color: '#ffff00', border: '#ffff00' },
  dyslexia: { background: '#fbf3df', color: '#2a2017', border: '#8f7b60' },
  hearing: { background: '#111', color: '#fff', border: '#111' },
  focus: { background: 'var(--bg)', color: 'var(--ink)', border: 'var(--line)' },
};

function Preview({ id }) {
  const p = { ...DEFAULTS, ...PRESETS[id].settings };
  const t = PREVIEW_THEME[id];
  if (id === 'hearing') {
    return (
      <div aria-hidden="true" className="flex h-36 flex-col justify-end rounded-2xl p-3" style={{ background: t.background }}>
        <p className="rounded-lg bg-black px-3 py-2 font-bold leading-snug text-white" style={{ fontSize: 18 }}>
          So the scheduler picks the process with the{' '}
          <span className="text-white/60">shortest burst…</span>
        </p>
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className="relative h-36 overflow-hidden rounded-2xl border-2 p-3"
      style={{
        background: t.background,
        color: t.color,
        borderColor: t.border,
        fontFamily: FONTS[p.font].css,
        fontSize: Math.min(p.fontSize, 24) * 0.85,
        lineHeight: p.lineHeight,
        letterSpacing: `${p.letterSpacing}em`,
      }}
    >
      {id === 'focus' && <p className="mb-1 text-xs font-bold uppercase tracking-wider opacity-70">Summary first</p>}
      <p>
        {id === 'dyslexia' ? (
          <>
            <span style={{ background: '#fde69a' }}>Mitochondria release energy from food.</span> They have their own DNA.
          </>
        ) : (
          'Mitochondria release energy from food. They have their own DNA and can make some proteins.'
        )}
      </p>
      {p.lineFocus && <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: `color-mix(in srgb, ${t.background} 75%, transparent)` }} />}
    </div>
  );
}

export default function Welcome() {
  const navigate = useNavigate();
  const applyPreset = useSettings((s) => s.applyPreset);
  const setS = useSettings((s) => s.set);

  function choose(id) {
    applyPreset(id);
    announce(`${PRESETS[id].label} preset on`);
    navigate(PRESETS[id].route || '/library');
  }

  return (
    <Page>
      <SpecLabel>F6 / Welcome</SpecLabel>
      <h1 className="mt-2 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-6xl">What helps you read best?</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">Pick a starting point. You can change any setting later, and Reset brings back the defaults.</p>

      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(PRESETS).map(([id, p], i) => {
          const Icon = ICONS[id];
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => choose(id)}
                className="group flex h-full w-full flex-col gap-4 rounded-3xl border-2 border-line-soft bg-surface p-5 text-left transition hover:-translate-y-1.5 hover:border-ink hover:shadow-[0_10px_0_var(--ink)] focus-visible:-translate-y-1.5"
              >
                <span className="flex items-center justify-between">
                  <span className="spec">0{i + 1}</span>
                  <Icon aria-hidden="true" className="size-6 transition group-hover:rotate-[-8deg] group-hover:scale-110" />
                </span>
                <Preview id={id} />
                <span className="text-xl font-bold">{p.label}</span>
                <span className="text-muted">{p.blurb}</span>
                <span className="mt-auto inline-flex items-center gap-1 font-bold">
                  Use this <ArrowRight aria-hidden="true" className="size-5 transition group-hover:translate-x-1" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          to="/settings"
          className={btn.primary}
          onClick={() => setS({ onboarded: true })}
        >
          Customize settings
        </Link>
        <Link to="/library" className={btn.ghost} onClick={() => setS({ onboarded: true })}>
          Skip to library
        </Link>
      </div>
    </Page>
  );
}
