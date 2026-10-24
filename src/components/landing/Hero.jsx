import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useReducedMotion } from '../../lib/useMotion.js';
import { btn } from '../Shell.jsx';

export const DENSE =
  'The plasma membrane, which is composed predominantly of a phospholipid bilayer interspersed with integral and peripheral proteins, cholesterol and glycolipids, functions as a selectively permeable barrier that regulates the bidirectional transport of ions, nutrients and metabolic waste products, thereby maintaining the homeostatic conditions that are indispensable for cellular viability.';
export const SIMPLE =
  'The plasma membrane is the thin skin around every cell. It is made of two layers of fat, with proteins inside. It lets food and water in and keeps harmful things out. This keeps the cell alive.';

const HEADLINE = 'Any study material, in the format your eyes, ears and brain need.';

function SplitHeadline({ reduced }) {
  const words = HEADLINE.split(' ');
  return (
    <h1 aria-label={HEADLINE} className="font-display text-[clamp(2.4rem,6.5vw,5.6rem)] leading-[0.98] font-semibold tracking-[-0.03em]">
      {words.map((w, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block"
            initial={reduced ? false : { y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            {w === 'eyes,' || w === 'ears' || w === 'brain' ? <span className="text-accent-ink">{w}</span> : w}
            {' '}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

// The page card that turns from a cramped PDF paragraph into readable text as you scroll.
function MorphCard({ cardRef, reduced }) {
  const words = SIMPLE.split(' ');
  return (
    <div
      ref={cardRef}
      className="morph-card relative w-full max-w-xl rounded-[1.75rem] border-2 border-ink bg-bg p-6 shadow-[0_14px_0_var(--ink)] sm:p-8"
      style={
        reduced
          ? { '--m-size': '22px', '--m-lh': 1.85, '--m-ls': '0.02em', '--m-wght': 420, '--m-dense': 0, '--m-simple': 1, '--m-focus': 1 }
          : { '--m-size': '11px', '--m-lh': 1.15, '--m-ls': '0em', '--m-wght': 300, '--m-dense': 1, '--m-simple': 0, '--m-focus': 0 }
      }
    >
      <div className="flex items-center justify-between">
        <p className="spec">
          <span className="morph-label-before" style={{ opacity: 'var(--m-dense)' }}>
            Before · page 42 · 10 pt
          </span>
          <span className="morph-label-after absolute left-6 sm:left-8" style={{ opacity: 'var(--m-simple)' }}>
            After · Saral reader
          </span>
        </p>
        <p className="spec" aria-hidden="true">
          FK grade <span className="morph-grade font-bold text-ink">{reduced ? '6.1' : '19.4'}</span>
        </p>
      </div>
      <div className="relative mt-4 min-h-[15rem]">
        <p
          aria-hidden="true"
          className="absolute inset-0 text-justify text-muted"
          style={{ fontFamily: 'Times New Roman, serif', fontSize: 'var(--m-size)', lineHeight: 'var(--m-lh)', opacity: 'var(--m-dense)', filter: 'blur(calc((1 - var(--m-dense)) * 4px))' }}
        >
          {DENSE} {DENSE}
        </p>
        <p
          className="relative"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--m-size)',
            lineHeight: 'var(--m-lh)',
            letterSpacing: 'var(--m-ls)',
            fontVariationSettings: '"wght" var(--m-wght)',
            opacity: 'var(--m-simple)',
          }}
        >
          {words.map((w, i) => (
            <span key={i} className={i >= 6 && i <= 9 ? 'morph-hl rounded-[0.2em]' : ''}>
              {w}{' '}
            </span>
          ))}
        </p>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[-0.5rem] rounded-lg border-y-2 border-accent"
          style={{ top: 'calc(var(--m-size) * var(--m-lh) * 1)', height: 'calc(var(--m-size) * var(--m-lh))', opacity: 'var(--m-focus)' }}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2" aria-hidden="true">
        {['Lexend', '22 px', 'Line focus', 'Simplified'].map((t) => (
          <span key={t} className="spec rounded-full border border-line px-2 py-0.5 text-ink" style={{ opacity: 'var(--m-simple)' }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Hero({ startHref }) {
  const reduced = useReducedMotion();
  const section = useRef(null);
  const card = useRef(null);

  useLayoutEffect(() => {
    if (reduced) return;
    let ctx;
    let cancelled = false;
    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        const grade = { v: 19.4 };
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section.current,
            start: 'top top',
            end: '+=110%',
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
          },
        });
        tl.to(card.current, { '--m-size': '22px', '--m-lh': 1.85, '--m-ls': '0.02em', '--m-wght': 420, duration: 1, ease: 'power2.inOut' }, 0)
          .to(card.current, { '--m-dense': 0, duration: 0.45, ease: 'none' }, 0.15)
          .to(card.current, { '--m-simple': 1, duration: 0.45, ease: 'none' }, 0.4)
          .to(card.current, { '--m-focus': 1, duration: 0.2 }, 0.85)
          .to(
            grade,
            {
              v: 6.1,
              duration: 0.8,
              ease: 'none',
              onUpdate: () => {
                const el = card.current?.querySelector('.morph-grade');
                if (el) el.textContent = grade.v.toFixed(1);
              },
            },
            0.2,
          )
          .to(card.current.querySelectorAll('.morph-hl'), { backgroundColor: 'var(--hl-word)', color: 'var(--hl-word-ink)', duration: 0.15, stagger: 0.04 }, 0.8);
      }, section);
    });
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduced]);

  return (
    <section ref={section} aria-labelledby="hero" className="relative overflow-hidden">
      <div className="mx-auto grid min-h-[calc(100dvh-60px)] max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_1fr]">
        <div id="hero">
          <div className="mb-6 flex flex-wrap gap-x-6 gap-y-1">
            <p className="spec">System · Accessible learning</p>
            <p className="spec">Q17 · VIT AI Innovate-A-Thon</p>
          </div>
          <SplitHeadline reduced={reduced} />
          <p className="mt-6 max-w-xl text-lg text-muted sm:text-xl">
            Saral turns any PDF, Word file or notes into text you can resize, hear, simplify and caption. All in the browser, no account.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={startHref} className={`${btn.accent} min-h-14 px-7 text-lg`}>
              Start reading <ArrowRight aria-hidden="true" />
            </Link>
            <Link to="/library" className={`${btn.secondary} min-h-14 px-7 text-lg`}>
              Try a sample
            </Link>
          </div>
          {!reduced && <p className="spec mt-10 hidden lg:block">Scroll ↓ to watch a textbook page become readable</p>}
        </div>
        <div className="flex justify-center lg:justify-end">
          <MorphCard cardRef={card} reduced={reduced} />
        </div>
      </div>
    </section>
  );
}
