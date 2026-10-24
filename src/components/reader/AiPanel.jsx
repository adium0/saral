import { useState } from 'react';
import { Sparkles, ListOrdered, Baby, Languages, Flag, Volume2, Loader2, X, Download, Printer, ArrowUpRight } from 'lucide-react';
import { btn } from '../Shell.jsx';
import { gradeLabel } from '../../lib/readability.js';
import { speakOnce } from '../../lib/tts.js';
import { useSettings } from '../../store/settings.js';

function GradeBadge({ before, after }) {
  if (before == null) return null;
  const drop = after != null ? Math.round((before - after) * 10) / 10 : null;
  return (
    <p className="spec flex flex-wrap items-center gap-2 text-ink">
      <span className="rounded-full border border-line px-2 py-0.5">
        Grade {before} <span className="sr-only">({gradeLabel(before)})</span>
      </span>
      {after != null && (
        <>
          <span aria-hidden="true">→</span>
          <span className="sr-only">to</span>
          <span className="rounded-full bg-ink px-2 py-0.5 text-bg">Grade {after}</span>
          {drop > 0 && <span>−{drop} grades</span>}
        </>
      )}
    </p>
  );
}

const SOURCE_LABEL = {
  ai: 'AI-generated, check against the original',
  cache: 'AI-generated (saved copy), check against the original',
  extractive: 'Key sentences picked from the text, not AI',
};

export default function AiPanel({ doc, scope, busy, error, onRun, onClose, linkedPid, onLink, onJump, onReport, onExportTxt, onPrint, translateLang, setTranslateLang }) {
  const [grade, setGrade] = useState(7);
  const voiceURI = useSettings((s) => s.voiceURI);
  const rate = useSettings((s) => s.rate);
  const last = doc.lastRun;
  const simplifiedItems = last && (last.action === 'simplify' || last.action === 'explain') ? last.pids.filter((pid) => doc.simplified[pid]) : [];
  const summary = last?.summaryKey ? doc.summaries[last.summaryKey] : null;
  const translations = last?.action === 'translate' ? last.pids.filter((pid) => doc.translated?.[last.lang]?.[pid]) : [];

  return (
    <aside aria-labelledby="ai-h" className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-line-soft px-4 py-3">
        <h2 id="ai-h" className="flex items-center gap-2 font-display text-lg font-semibold">
          <Sparkles aria-hidden="true" className="size-5" /> AI tools
        </h2>
        <button type="button" className={btn.icon} onClick={onClose}>
          <X aria-hidden="true" />
          <span className="sr-only">Close AI tools</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="spec">Working on</p>
        <p className="mt-1 font-bold">{scope.label}</p>
        <p className="text-sm text-muted">Select paragraphs with the ¶ buttons, or Saral uses the section you are reading.</p>

        <div className="mt-4 grid gap-1">
          <label htmlFor="grade" className="text-sm font-bold">
            Target reading grade
          </label>
          <select id="grade" value={grade} onChange={(e) => setGrade(Number(e.target.value))} className="min-h-11 rounded-xl border-2 border-line bg-bg px-3 text-ink">
            {[4, 5, 6, 7, 8, 9].map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid gap-2">
          <button type="button" className={btn.primary} disabled={busy} onClick={() => onRun('simplify', { grade })}>
            <Sparkles aria-hidden="true" className="size-5" /> Simplify
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={`${btn.secondary} px-3 text-sm`} disabled={busy} onClick={() => onRun('summary', { grade })}>
              <ListOrdered aria-hidden="true" className="size-5" /> Summarize in 5 bullets
            </button>
            <button type="button" className={`${btn.secondary} px-3 text-sm`} disabled={busy} onClick={() => onRun('explain', { grade: 5 })}>
              <Baby aria-hidden="true" className="size-5" /> Explain like I'm new
            </button>
          </div>
          <div className="flex items-end gap-2">
            <div className="grid flex-1 gap-1">
              <label htmlFor="tl" className="text-sm font-bold">
                Translate to
              </label>
              <select id="tl" value={translateLang} onChange={(e) => setTranslateLang(e.target.value)} className="min-h-11 rounded-xl border-2 border-line bg-bg px-3 text-ink">
                <option value="hi">Hindi</option>
                <option value="ta">Tamil</option>
              </select>
            </div>
            <button type="button" className={`${btn.secondary} px-3`} disabled={busy} onClick={() => onRun('translate', { lang: translateLang })}>
              <Languages aria-hidden="true" className="size-5" /> Translate
            </button>
          </div>
        </div>

        <div aria-live="polite" className="mt-4">
          {busy && (
            <p className="flex items-center gap-2 font-bold">
              <Loader2 aria-hidden="true" className="animate-spin" /> {busy}
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-2xl border-2 border-accent-ink p-3 font-bold">
              {error}
            </p>
          )}
          {last?.notice && !busy && <p className="rounded-2xl bg-surface-2 p-3 text-sm">{last.notice}</p>}
        </div>

        {summary && (
          <section aria-labelledby="sum-h" className="mt-6 rounded-2xl border border-line-soft bg-surface p-4">
            <h3 id="sum-h" className="font-bold">
              Summary · {summary.label}
            </h3>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              {summary.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
            <p className="spec mt-3">{SOURCE_LABEL[summary.source]}</p>
          </section>
        )}

        {simplifiedItems.length > 0 && (
          <section aria-labelledby="simp-h" className="mt-6">
            <h3 id="simp-h" className="font-bold">
              {last.action === 'explain' ? 'Explained simply' : 'Simplified'} · {simplifiedItems.length} paragraph{simplifiedItems.length > 1 ? 's' : ''}
            </h3>
            <ol className="mt-3 grid gap-3">
              {simplifiedItems.map((pid) => {
                const r = doc.simplified[pid];
                return (
                  <li
                    key={pid}
                    onMouseEnter={() => onLink(pid)}
                    onMouseLeave={() => onLink(null)}
                    onFocus={() => onLink(pid)}
                    className={`rounded-2xl border-2 p-4 transition ${linkedPid === pid ? 'border-ink bg-[var(--hl-link)]' : 'border-line-soft bg-surface'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button type="button" onClick={() => onJump(pid)} className="spec inline-flex min-h-11 items-center gap-1 text-ink underline underline-offset-4">
                        From ¶{pid.slice(1)} <ArrowUpRight aria-hidden="true" className="size-4" />
                        <span className="sr-only">Go to the original paragraph</span>
                      </button>
                      <button type="button" className={btn.icon} onClick={() => speakOnce(r.text, { voiceURI, rate })}>
                        <Volume2 aria-hidden="true" className="size-5" />
                        <span className="sr-only">Read this simplified paragraph aloud</span>
                      </button>
                    </div>
                    <p className="mt-1 text-lg leading-relaxed">{r.text}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <GradeBadge before={r.gradeBefore} after={r.gradeAfter} />
                      <button type="button" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold underline underline-offset-4" onClick={() => onReport(pid, last.action)}>
                        <Flag aria-hidden="true" className="size-4" /> Report a problem
                      </button>
                    </div>
                    <p className="spec mt-2">{SOURCE_LABEL[r.source]}</p>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {translations.length > 0 && (
          <section aria-labelledby="tr-h" className="mt-6">
            <h3 id="tr-h" className="font-bold">
              Translation · {last.lang === 'ta' ? 'Tamil' : 'Hindi'}
            </h3>
            <ol className="mt-3 grid gap-3">
              {translations.map((pid) => {
                const lang = last.lang === 'ta' ? 'ta-IN' : 'hi-IN';
                const text = doc.translated[last.lang][pid];
                return (
                  <li key={pid} className="rounded-2xl border border-line-soft bg-surface p-4" onMouseEnter={() => onLink(pid)} onMouseLeave={() => onLink(null)}>
                    <div className="flex items-center justify-between">
                      <button type="button" onClick={() => onJump(pid)} className="spec min-h-11 text-ink underline underline-offset-4">
                        From ¶{pid.slice(1)}
                      </button>
                      <button type="button" className={btn.icon} onClick={() => speakOnce(text, { lang, rate })}>
                        <Volume2 aria-hidden="true" className="size-5" />
                        <span className="sr-only">Read aloud in {last.lang === 'ta' ? 'Tamil' : 'Hindi'}, if a voice is installed</span>
                      </button>
                    </div>
                    <p lang={last.lang} className="text-lg leading-relaxed">
                      {text}
                    </p>
                    <p className="spec mt-2">AI translation, check against the original</p>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {doc.glossary.length > 0 && (
          <section aria-labelledby="glo-h" className="mt-6">
            <h3 id="glo-h" className="font-bold">
              Glossary · {doc.glossary.length} terms
            </h3>
            <p className="text-sm text-muted">Terms are underlined in the text. Tap or focus one to see its meaning.</p>
            <dl className="mt-3 grid gap-3">
              {doc.glossary.map((g) => (
                <div key={g.term} className="rounded-2xl border border-line-soft p-3">
                  <dt className="font-bold">
                    <button type="button" className="underline-offset-4 hover:underline" onClick={() => onJump(g.source_id)}>
                      {g.term}
                    </button>
                  </dt>
                  <dd className="text-muted">{g.definition}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <div className="mt-8 grid gap-2 border-t border-line-soft pt-4">
          <p className="spec">Export</p>
          <button type="button" className={`${btn.ghost} justify-start`} onClick={onExportTxt}>
            <Download aria-hidden="true" className="size-5" /> Simplified notes and glossary (.txt)
          </button>
          <button type="button" className={`${btn.ghost} justify-start`} onClick={onPrint}>
            <Printer aria-hidden="true" className="size-5" /> Print or save as PDF
          </button>
        </div>
      </div>
    </aside>
  );
}
