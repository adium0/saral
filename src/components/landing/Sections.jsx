import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useMotionValue, useSpring } from 'motion/react';
import { Pause, Play, ArrowRight, Eye, Ear, BookOpenText } from 'lucide-react';
import { useReducedMotion } from '../../lib/useMotion.js';
import { DENSE, SIMPLE } from './Hero.jsx';

export function Reveal({ children, delay = 0, className = '', as = 'div' }) {
  const reduced = useReducedMotion();
  const M = motion[as];
  return (
    <M
      className={className}
      initial={reduced ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </M>
  );
}

const MARQUEE = ['PDF', 'DOCX', 'TXT', 'Pasted notes', 'English (India)', 'हिन्दी', 'Read-aloud', 'Live captions', 'Simplify', 'Glossary', 'Line focus', 'High contrast'];

// Auto-moving strip with a visible pause button (WCAG 2.2.2).
export function Marquee() {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const stop = paused || reduced;
  return (
    <section aria-label="What Saral works with" className={`relative border-y-2 border-ink bg-ink py-4 text-bg ${stop ? 'marquee-paused' : ''}`}>
      <p className="sr-only">{MARQUEE.join(', ')}</p>
      <div aria-hidden="true" className="overflow-hidden">
        <div className={`flex w-max gap-10 pr-10 ${stop ? '' : 'marquee-track'}`}>
          {[...MARQUEE, ...MARQUEE].map((t, i) => (
            <span key={i} className="flex items-center gap-10 font-display text-2xl font-medium whitespace-nowrap sm:text-3xl" lang={t === 'हिन्दी' ? 'hi' : undefined}>
              {t} <span className="text-accent">✳</span>
            </span>
          ))}
        </div>
      </div>
      {!reduced && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-bg text-ink shadow"
        >
          {paused ? <Play aria-hidden="true" className="size-5" /> : <Pause aria-hidden="true" className="size-5" />}
          <span className="sr-only">{paused ? 'Play scrolling text' : 'Pause scrolling text'}</span>
        </button>
      )}
    </section>
  );
}

// Mini demos inside the feature cards.
function ReadAloudDemo() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.6 });
  const reduced = useReducedMotion();
  const words = 'Mitochondria release energy from food so the cell can work.'.split(' ');
  const [i, setI] = useState(2);
  useEffect(() => {
    if (!inView || reduced) return;
    const t = setInterval(() => setI((x) => (x + 1) % words.length), 420);
    return () => clearInterval(t);
  }, [inView, reduced, words.length]);
  return (
    <p ref={ref} aria-hidden="true" className="rounded-2xl bg-[var(--hl-sentence)] p-4 text-xl leading-relaxed text-[#141414] sm:text-2xl">
      {words.map((w, k) => (
        <span key={k} className={`rounded px-0.5 transition-colors duration-150 ${k === i ? 'bg-[#ffc933]' : ''}`}>
          {w}{' '}
        </span>
      ))}
    </p>
  );
}

function CaptionsDemo() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.6 });
  const reduced = useReducedMotion();
  const full = 'Round robin gives every process a small time slice, called a quantum.';
  const [n, setN] = useState(reduced ? full.length : 24);
  useEffect(() => {
    if (!inView || reduced) return;
    const t = setInterval(() => setN((x) => (x >= full.length + 20 ? 0 : x + 1)), 55);
    return () => clearInterval(t);
  }, [inView, reduced, full.length]);
  const shown = full.slice(0, Math.min(n, full.length));
  const cut = shown.lastIndexOf(' ');
  return (
    <div ref={ref} aria-hidden="true" className="flex min-h-36 items-end rounded-2xl bg-[#111] p-4">
      <p className="rounded-lg bg-black px-3 py-2 text-xl font-bold leading-snug text-white sm:text-2xl">
        {shown.slice(0, cut + 1)}
        <span className="text-white/60">{shown.slice(cut + 1)}</span>
        <span className="ml-0.5 inline-block h-6 w-0.5 animate-pulse bg-white align-middle" />
      </p>
    </div>
  );
}

function SimplifyDemo() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = useReducedMotion();
  const [grade, setGrade] = useState(reduced ? 6.1 : 19.4);
  const done = reduced || grade <= 6.1;
  useEffect(() => {
    if (!inView || reduced) return;
    const t = setInterval(() => setGrade((g) => (g <= 6.2 ? (clearInterval(t), 6.1) : Math.round((g - 0.3) * 10) / 10)), 30);
    return () => clearInterval(t);
  }, [inView, reduced]);
  return (
    <div ref={ref} aria-hidden="true" className="grid gap-3">
      <p className={`text-sm leading-snug text-muted transition ${done ? 'line-through decoration-accent-ink' : ''}`}>{DENSE.slice(0, 170)}…</p>
      <p className={`text-lg leading-relaxed transition duration-500 ${done ? 'opacity-100' : 'translate-y-2 opacity-0'}`}>{SIMPLE.slice(0, 113)}</p>
      <p className="spec text-ink">
        Reading grade <span className="font-bold tabular-nums">{grade.toFixed(1)}</span> {done && '· −13.3 grades'}
      </p>
    </div>
  );
}

function ReaderDemo() {
  const [size, setSize] = useState(20);
  return (
    <div className="grid gap-3">
      <p className="rounded-2xl border-2 border-line bg-bg p-4" style={{ fontFamily: 'var(--font-display)', fontSize: size, lineHeight: 1.7 }}>
        Cells are the basic units of life.
      </p>
      <label className="flex items-center gap-3 font-bold">
        Try it: text size
        <input type="range" min={14} max={40} value={size} onChange={(e) => setSize(Number(e.target.value))} aria-valuetext={`${size} pixels`} className="flex-1" />
        <span className="spec w-12 text-ink">{size}px</span>
      </label>
    </div>
  );
}

const FEATURES = [
  { n: '01', id: 'F2', title: 'Reader view', body: 'Text from 14 to 40 px, four fonts including Lexend and OpenDyslexic, four themes and a focus line that follows you.', demo: ReaderDemo },
  { n: '02', id: 'F3', title: 'Read-aloud', body: 'Click any sentence and hear it, with the spoken word highlighted. Speed from 0.5× to 2×, Indian English and Hindi voices.', demo: ReadAloudDemo },
  { n: '03', id: 'F4', title: 'Live captions', body: 'Big, high-contrast captions of your lecturer, live, with a timestamped transcript you can read, simplify or save.', demo: CaptionsDemo },
  { n: '04', id: 'F5', title: 'Simplify and glossary', body: 'AI rewrites a paragraph at a lower reading grade, beside the original, with every claim linked back to its source.', demo: SimplifyDemo },
];

// Numbered cards that stack as you scroll (sticky positioning).
export function FeatureStack() {
  return (
    <section aria-labelledby="feat-h" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <Reveal>
        <p className="spec">System · four assistive features</p>
        <h2 id="feat-h" className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-6xl">
          One upload. Four ways in.
        </h2>
      </Reveal>
      <ol className="mt-14 grid gap-8">
        {FEATURES.map((f, i) => {
          const Demo = f.demo;
          return (
            <li key={f.n} className="sticky" style={{ top: `${80 + i * 24}px` }}>
              <article className="grid gap-8 rounded-[2rem] border-2 border-ink bg-surface p-6 shadow-[0_-6px_0_var(--bg)] sm:p-10 md:grid-cols-[1fr_1.1fr]">
                <div>
                  <div className="flex items-center gap-4">
                    <span className="font-display text-6xl font-semibold text-accent-ink sm:text-7xl">{f.n}</span>
                    <span className="spec">
                      {f.id} / P0 / Shipped
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-3xl font-semibold">{f.title}</h3>
                  <p className="mt-3 text-lg text-muted">{f.body}</p>
                </div>
                <div className="self-center">
                  <Demo />
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// Drag or use the arrow keys to compare the original page with Saral.
export function BeforeAfter() {
  const [pos, setPos] = useState(50);
  return (
    <section aria-labelledby="ba-h" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <Reveal>
        <p className="spec">F7 · Before / after</p>
        <h2 id="ba-h" className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
          Same page. Different reader.
        </h2>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="relative mt-10 overflow-hidden rounded-[2rem] border-2 border-ink" style={{ minHeight: '22rem' }}>
          <div className="absolute inset-0 bg-white p-6 sm:p-10" aria-hidden="true">
            <p className="text-justify text-[11px] leading-[1.2] text-[#555]" style={{ fontFamily: 'Times New Roman, serif' }}>
              {DENSE} {DENSE} {DENSE}
            </p>
          </div>
          <div className="absolute inset-0 bg-[#fbf3df] p-6 text-[#2a2017] sm:p-10" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
            <p className="max-w-[34ch] text-2xl leading-[1.9] sm:ml-auto sm:text-3xl" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.03em' }}>
              {SIMPLE}
            </p>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-1 bg-ink" style={{ left: `${pos}%` }}>
            <span className="absolute top-1/2 left-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-accent font-bold text-on-accent">
              ⇆
            </span>
          </div>
          <span className="spec absolute top-3 left-4 rounded-full bg-white px-2 text-[#141414]" aria-hidden="true">
            Before
          </span>
          <span className="spec absolute top-3 right-4 rounded-full bg-[#141414] px-2 text-white" aria-hidden="true">
            After
          </span>
          <label className="sr-only" htmlFor="ba">
            Compare the original page with the Saral version
          </label>
          <input
            id="ba"
            type="range"
            min={0}
            max={100}
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            aria-valuetext={`${100 - pos}% of the Saral version shown`}
            className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
          />
        </div>
      </Reveal>
    </section>
  );
}

const PERSONAS = [
  { name: 'Ananya', role: '2nd-year BTech · low vision', need: 'Reads 30–40 page PDFs in 10 pt print.', does: 'Reflowed text up to 40 px, yellow-on-black contrast and read-aloud.', icon: Eye },
  { name: 'Rohan', role: '3rd-year BTech · hard of hearing', need: 'Misses speech when the lecturer turns away.', does: 'Large live captions and a saved, searchable transcript.', icon: Ear },
  { name: 'Meera', role: '1st-year BTech · dyslexia', need: 'Loses her place in long, dense theory.', does: 'Lexend, wide spacing, line focus, Simplify and a glossary.', icon: BookOpenText },
];

export function Personas() {
  return (
    <section aria-labelledby="per-h" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <Reveal>
        <p className="spec">Users · three students</p>
        <h2 id="per-h" className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
          Built around real barriers.
        </h2>
      </Reveal>
      <ul className="mt-12 grid gap-6 md:grid-cols-3">
        {PERSONAS.map((p, i) => {
          const Icon = p.icon;
          return (
            <Reveal as="li" key={p.name} delay={i * 0.08}>
              <article
                tabIndex={0}
                className="group relative flex h-full min-h-80 flex-col overflow-hidden rounded-[2rem] border-2 border-ink bg-surface p-6 transition duration-300 hover:-translate-y-2 hover:shadow-[0_12px_0_var(--ink)] focus-visible:-translate-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="spec">P0{i + 1}</span>
                  <Icon aria-hidden="true" className="size-7 transition duration-300 group-hover:scale-125 group-hover:-rotate-12" />
                </div>
                <h3 className="mt-6 font-display text-4xl font-semibold">{p.name}</h3>
                <p className="spec mt-1">{p.role}</p>
                <p className="mt-4 text-lg">{p.need}</p>
                <div className="mt-auto translate-y-0 rounded-2xl bg-ink p-4 text-bg transition duration-300 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-visible:translate-y-0 md:group-focus-visible:opacity-100">
                  <p className="spec text-bg/80" style={{ color: 'inherit' }}>
                    What Saral does
                  </p>
                  <p className="mt-1">{p.does}</p>
                </div>
              </article>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}

const STATS = [
  ['4', 'assistive features where the brief asks for 2'],
  ['14–40', 'px text, four fonts, four themes'],
  ['AA', 'WCAG 2.2 target for Saral itself'],
  ['0', 'accounts or uploads: files stay on your device'],
];

export function Stats() {
  return (
    <section aria-label="Saral in numbers" className="border-y-2 border-ink">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 lg:grid-cols-4">
        {STATS.map(([n, label], i) => (
          <Reveal key={label} delay={i * 0.06} className={`flex flex-col-reverse gap-2 border-line-soft p-6 sm:p-10 ${i % 2 ? 'border-l' : ''} ${i > 1 ? 'border-t lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l' : ''}`}>
            <dt className="text-muted">{label}</dt>
            <dd className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">{n}</dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}

// A call-to-action button that leans toward the pointer.
const MLink = motion.create(Link);

export function MagneticLink({ to, children }) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15 });
  const sy = useSpring(y, { stiffness: 200, damping: 15 });
  return (
    <MLink
      to={to}
      style={reduced ? undefined : { x: sx, y: sy }}
      onPointerMove={(e) => {
        if (reduced || e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.3);
        y.set((e.clientY - r.top - r.height / 2) * 0.4);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className="inline-flex min-h-16 items-center gap-3 rounded-full bg-accent px-9 font-display text-xl font-semibold text-on-accent"
    >
      {children} <ArrowRight aria-hidden="true" />
    </MLink>
  );
}
