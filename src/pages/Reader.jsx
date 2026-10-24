import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Columns2, ListTree, Sparkles, SlidersHorizontal, Mic, MicOff, Captions as CaptionsIcon, X } from 'lucide-react';
import { useSettings } from '../store/settings.js';
import { announce } from '../store/announce.js';
import { loadDoc, loadOriginal, saveDoc, logReport } from '../lib/storage.js';
import { sentenceList, findParagraph, allParagraphs } from '../lib/docModel.js';
import { Speaker } from '../lib/tts.js';
import { listenForCommands, sttSupported } from '../lib/stt.js';
import { runAi } from '../lib/ai.js';
import { fkGrade } from '../lib/readability.js';
import { useReducedMotion } from '../lib/useMotion.js';
import Paragraph, { buildTermRegex } from '../components/reader/Paragraph.jsx';
import Player from '../components/reader/Player.jsx';
import AiPanel from '../components/reader/AiPanel.jsx';
import ComparePane from '../components/reader/ComparePane.jsx';
import WordLookup from '../components/reader/WordLookup.jsx';
import DisplaySettings, { readerStyleVars } from '../components/DisplaySettings.jsx';
import { btn } from '../components/Shell.jsx';

const DOC_SUMMARY_CHARS = 8000;

export function docSummaryPids(doc) {
  const out = [];
  let n = 0;
  for (const p of allParagraphs(doc)) {
    if (n + p.text.length > DOC_SUMMARY_CHARS) break;
    out.push(p.id);
    n += p.text.length;
  }
  return out;
}

function isTyping(el) {
  return el && (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A'].includes(el.tagName) || el.isContentEditable || el.getAttribute('role') === 'switch');
}

function download(name, text, type = 'text/plain') {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function TopButton({ pressed, onClick, icon: Icon, label, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-bold transition ${pressed ? 'bg-ink text-bg' : 'hover:bg-surface-2'} ${className}`}
    >
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      <span className="hidden xl:inline">{label}</span>
      <span className="sr-only xl:hidden">{label}</span>
    </button>
  );
}

export default function Reader() {
  const { docId } = useParams();
  const settings = useSettings();
  const setS = settings.set;
  const reduced = useReducedMotion();
  const [doc, setDoc] = useState(null);
  const [original, setOriginal] = useState(null);
  const [missing, setMissing] = useState(false);

  // Read-aloud state
  const [sIndex, setSIndex] = useState(0);
  const [wordRange, setWordRange] = useState(null);
  const [playState, setPlayState] = useState('stopped');
  const [wordSync, setWordSync] = useState(null);

  // Panels
  const wide = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
  const [outlineOpen, setOutlineOpen] = useState(() => wide && !settings.hidePanels);
  const [aiOpen, setAiOpen] = useState(() => wide && !settings.hidePanels);
  const [compare, setCompare] = useState(false);
  const settingsDialog = useRef(null);

  // AI state
  const [selected, setSelected] = useState(() => new Set());
  const [linkedPid, setLinkedPid] = useState(null);
  const [aiBusy, setAiBusy] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [translateLang, setTranslateLang] = useState('hi');

  const [lookup, setLookup] = useState(null);
  const [voiceCmd, setVoiceCmd] = useState(false);
  const [focusY, setFocusY] = useState(0);

  const articleRef = useRef(null);
  const readerScrollRef = useRef(null);
  const origScrollRef = useRef(null);
  const syncing = useRef(false);

  // Load the document and its original file.
  useEffect(() => {
    let alive = true;
    loadDoc(docId).then((d) => {
      if (!alive) return;
      if (!d) setMissing(true);
      else {
        setDoc(d);
        document.title = `${d.title} · Saral`;
      }
    });
    loadOriginal(docId).then((buf) => alive && setOriginal(buf || null));
    return () => {
      alive = false;
    };
  }, [docId]);

  const sentences = useMemo(() => (doc ? sentenceList(doc) : []), [doc?.id, doc?.sections]); // eslint-disable-line react-hooks/exhaustive-deps
  const sentencesRef = useRef(sentences);
  sentencesRef.current = sentences;

  // One Speaker for the page.
  const speaker = useRef(null);
  if (!speaker.current) {
    speaker.current = new Speaker({
      onSentence: (i) => {
        setSIndex(i);
        setWordRange(null);
      },
      onWord: (i, start, len) => {
        setSIndex(i);
        setWordRange([start, len]);
        setWordSync(true);
      },
      onState: (s) => {
        setPlayState(s);
        announce(s === 'playing' ? 'Reading' : s === 'paused' ? 'Paused' : 'Stopped');
        if (s !== 'playing') setWordRange(null);
      },
      onEnd: () => announce('Finished reading'),
      onError: (err) => announce(`Read-aloud error: ${err}`),
    });
  }
  useEffect(() => {
    speaker.current.setItems(sentences.map((s) => ({ id: s.id, text: s.text })));
  }, [sentences]);
  useEffect(() => {
    speaker.current.rate = settings.rate;
  }, [settings.rate]);
  useEffect(() => {
    speaker.current.voiceURI = settings.voiceURI;
  }, [settings.voiceURI]);
  useEffect(() => () => speaker.current?.stop(), []);

  // After a sentence starts, check whether the voice reports word positions.
  useEffect(() => {
    if (playState !== 'playing') return;
    const t = setTimeout(() => setWordSync((w) => (w === null ? speaker.current.gotBoundary : w)), 2500);
    return () => clearTimeout(t);
  }, [playState, sIndex]);

  const current = sentences[sIndex];
  const currentPid = current?.pid;

  // Keep the spoken line in view and move line focus with it.
  useEffect(() => {
    if (!current || playState === 'stopped') return;
    const el = document.querySelector('.word-current') || document.getElementById(current.id);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const container = compare ? readerScrollRef.current : null;
    const top = container ? container.getBoundingClientRect().top : 80;
    const bottom = container ? container.getBoundingClientRect().bottom : window.innerHeight - 110;
    if (r.top < top + 40 || r.bottom > bottom - 40) el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
  }, [current, wordRange, playState, compare, reduced]);

  const lineH = settings.fontSize * settings.lineHeight;
  useEffect(() => {
    if (!settings.lineFocus || !current || !articleRef.current) return;
    const el = document.querySelector('.word-current') || document.getElementById(current.id);
    if (!el) return;
    const rect = el.getClientRects()[0] || el.getBoundingClientRect();
    const base = articleRef.current.getBoundingClientRect().top;
    setFocusY(Math.max(0, rect.top - base - (lineH - rect.height) / 2));
  }, [current, wordRange, settings.lineFocus, lineH]);

  const updateDoc = useCallback((fn) => {
    setDoc((prev) => {
      const next = fn(prev);
      saveDoc(next).catch(() => {});
      return next;
    });
  }, []);

  // Player actions
  const play = useCallback(() => speaker.current.play(speaker.current.index), []);
  const pause = useCallback(() => speaker.current.pause(), []);
  const stop = useCallback(() => speaker.current.stop(), []);
  const next = useCallback(() => speaker.current.next(), []);
  const prev = useCallback(() => speaker.current.prev(), []);
  const setRate = useCallback((r) => setS({ rate: r }), [setS]);
  const readFrom = useCallback((sid) => {
    const i = sentencesRef.current.findIndex((s) => s.id === sid);
    if (i >= 0) speaker.current.play(i);
  }, []);

  const toggleSelect = useCallback((pid) => {
    setSelected((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(pid)) nextSet.delete(pid);
      else nextSet.add(pid);
      return nextSet;
    });
  }, []);
  const firstSelect = useRef(true);
  useEffect(() => {
    if (firstSelect.current) {
      firstSelect.current = false;
      return;
    }
    announce(`${selected.size} paragraph${selected.size === 1 ? '' : 's'} selected`);
  }, [selected]);

  const jumpTo = useCallback(
    (pid) => {
      const el = document.getElementById(pid);
      if (!el) return;
      el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      setLinkedPid(pid);
      setTimeout(() => setLinkedPid((p) => (p === pid ? null : p)), 2000);
    },
    [reduced],
  );

  // Scope for AI: selected paragraphs, or the section being read.
  const scope = useMemo(() => {
    if (!doc) return { pids: [], label: '' };
    const order = allParagraphs(doc).map((p) => p.id);
    if (selected.size) {
      const pids = order.filter((id) => selected.has(id));
      return { pids, label: `${pids.length} selected paragraph${pids.length > 1 ? 's' : ''}`, key: `sel:${pids.join(',')}` };
    }
    const section = doc.sections.find((s) => s.paragraphs.some((p) => p.id === currentPid)) || doc.sections.find((s) => s.paragraphs.length);
    if (!section) return { pids: [], label: 'Nothing to work on' };
    let n = 0;
    const pids = [];
    for (const p of section.paragraphs) {
      if (n + p.text.length > 6000 && pids.length) break;
      pids.push(p.id);
      n += p.text.length;
    }
    return { pids, label: `Section: ${section.heading} (${pids.length} paragraph${pids.length > 1 ? 's' : ''})`, key: `sec:${section.id}`, sectionHeading: section.heading };
  }, [doc, selected, currentPid]);

  const runAction = useCallback(
    async (action, opts = {}, overrideScope = null) => {
      const sc = overrideScope || scope;
      if (!doc || !sc.pids.length) return;
      const verbs = { simplify: 'Simplifying', summary: 'Summarizing', explain: 'Explaining', translate: 'Translating' };
      setAiBusy(`${verbs[action]}…`);
      setAiError(null);
      announce(verbs[action]);
      try {
        const texts = action === 'translate' ? Object.fromEntries(sc.pids.map((pid) => [pid, doc.simplified[pid]?.text || findParagraph(doc, pid)?.text])) : null;
        const res = await runAi({ doc, action, pids: sc.pids, grade: opts.grade, lang: opts.lang, texts });
        updateDoc((d) => {
          const nextDoc = { ...d, simplified: { ...d.simplified }, summaries: { ...d.summaries }, translated: { ...(d.translated || {}) } };
          if (res.simplified?.length) {
            for (const item of res.simplified) {
              const p = findParagraph(d, item.source_id);
              nextDoc.simplified[item.source_id] = {
                text: item.text,
                mode: action,
                source: res.source,
                gradeBefore: fkGrade(p.text),
                gradeAfter: fkGrade(item.text),
              };
            }
          }
          let summaryKey = null;
          if (action === 'summary' || res.source === 'extractive') {
            summaryKey = sc.key || 'scope';
            nextDoc.summaries[summaryKey] = { bullets: res.summary, source: res.source, label: sc.sectionHeading || sc.label };
          }
          if (res.glossary?.length) {
            const byTerm = new Map(d.glossary.map((g) => [g.term.toLowerCase(), g]));
            for (const g of res.glossary) if (!byTerm.has(g.term.toLowerCase())) byTerm.set(g.term.toLowerCase(), g);
            nextDoc.glossary = [...byTerm.values()].slice(0, 40);
          }
          if (res.translated) {
            nextDoc.translated[opts.lang] = { ...(nextDoc.translated[opts.lang] || {}) };
            for (const t of res.translated) nextDoc.translated[opts.lang][t.source_id] = t.text;
          }
          nextDoc.lastRun = { action, pids: sc.pids, summaryKey, lang: opts.lang, notice: res.notice || null };
          return nextDoc;
        });
        announce(res.source === 'extractive' ? 'AI unavailable. Showing key sentences.' : 'Done. Results are in the AI panel.');
        setAiOpen(true);
      } catch (e) {
        const msg = e.code === 'too_long' ? 'That passage is too long. Select fewer paragraphs.' : `${e.message} Try again.`;
        setAiError(msg);
        announce(msg);
      } finally {
        setAiBusy(null);
      }
    },
    [doc, scope, updateDoc],
  );

  // Focus preset: show a summary of the document first.
  useEffect(() => {
    if (!doc || !settings.summaryFirst || doc.summaries?.doc) return;
    const pids = docSummaryPids(doc);
    if (!pids.length) return;
    runAi({ doc, action: 'summary', pids })
      .then((res) => updateDoc((d) => ({ ...d, summaries: { ...d.summaries, doc: { bullets: res.summary, source: res.source, label: 'Whole document' } } })))
      .catch(() => {});
  }, [doc?.id, settings.summaryFirst]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts on the page (the player handles its own when it has focus).
  useEffect(() => {
    const onKey = (e) => {
      if (!settings.shortcuts || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTyping(e.target) || e.target.closest?.('[aria-label="Read-aloud player"], dialog, [role="dialog"]')) return;
      if (e.key === ' ') {
        e.preventDefault();
        speaker.current.toggle();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && settings.lineFocus) {
        e.preventDefault();
        setFocusY((y) => {
          const max = (articleRef.current?.scrollHeight || 0) - lineH;
          const ny = Math.max(0, Math.min(max, y + (e.key === 'ArrowDown' ? lineH : -lineH)));
          const base = articleRef.current?.getBoundingClientRect().top || 0;
          const abs = base + ny;
          if (abs < 120 || abs > window.innerHeight - 160) window.scrollBy({ top: e.key === 'ArrowDown' ? lineH * 3 : -lineH * 3, behavior: 'auto' });
          return ny;
        });
      } else if (e.key === '+' || e.key === '=') {
        setRate(Math.min(2, Math.round((useSettings.getState().rate + 0.1) * 10) / 10));
      } else if (e.key === '-') {
        setRate(Math.max(0.5, Math.round((useSettings.getState().rate - 0.1) * 10) / 10));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settings.shortcuts, settings.lineFocus, lineH, next, prev, setRate]);

  // F9 voice commands
  useEffect(() => {
    if (!voiceCmd) return;
    const stopListening = listenForCommands(
      'en-IN',
      (said) => {
        const s = useSettings.getState();
        if (/\b(stop|pause)\b/.test(said)) {
          speaker.current.pause();
          announce('Command: stop');
        } else if (/\b(read|start|play|resume)\b/.test(said)) {
          speaker.current.play(speaker.current.index);
          announce('Command: read');
        } else if (/\bnext\b/.test(said)) {
          speaker.current.next();
          announce('Command: next');
        } else if (/\b(previous|back)\b/.test(said)) {
          speaker.current.prev();
          announce('Command: previous');
        } else if (/\b(bigger|larger)\b/.test(said)) {
          s.set({ fontSize: Math.min(40, s.fontSize + 2) });
          announce('Command: bigger text');
        } else if (/\bsmaller\b/.test(said)) {
          s.set({ fontSize: Math.max(14, s.fontSize - 2) });
          announce('Command: smaller text');
        } else if (/\bsimplif/.test(said)) {
          const pid = sentencesRef.current[speaker.current.index]?.pid;
          if (pid) runActionRef.current('simplify', { grade: 7 }, { pids: [pid], label: `Paragraph ${pid.slice(1)}`, key: `sel:${pid}` });
          announce('Command: simplify this');
        }
      },
      (st) => st === 'denied' && (setVoiceCmd(false), announce('Microphone blocked. Voice commands are off.')),
    );
    announce('Voice commands on. Say read, stop, next, bigger text or simplify this.');
    return stopListening;
  }, [voiceCmd]);
  const runActionRef = useRef(runAction);
  runActionRef.current = runAction;

  // Linked scrolling between the original and the Saral reader in compare view.
  const syncScroll = (from, to) => {
    if (syncing.current || !from || !to) return;
    syncing.current = true;
    const ratio = from.scrollTop / Math.max(1, from.scrollHeight - from.clientHeight);
    to.scrollTop = ratio * (to.scrollHeight - to.clientHeight);
    requestAnimationFrame(() => (syncing.current = false));
  };

  // F8: double-click or long-press a word for its definition.
  const pressTimer = useRef(null);
  const onDoubleClick = () => {
    const w = window.getSelection()?.toString().trim();
    if (w && /^[A-Za-z][A-Za-z'-]{1,30}$/.test(w)) setLookup(w);
  };
  const onPointerDown = (e) => {
    if (e.pointerType !== 'touch') return;
    const { clientX, clientY } = e;
    pressTimer.current = setTimeout(() => {
      const range = document.caretRangeFromPoint?.(clientX, clientY);
      if (!range) return;
      const text = range.startContainer.textContent || '';
      let a = range.startOffset;
      let b = range.startOffset;
      while (a > 0 && /[A-Za-z'-]/.test(text[a - 1])) a--;
      while (b < text.length && /[A-Za-z'-]/.test(text[b])) b++;
      const w = text.slice(a, b);
      if (w.length > 1) setLookup(w);
    }, 600);
  };
  const cancelPress = () => clearTimeout(pressTimer.current);

  function exportTxt() {
    const lines = [`${doc.title}`, `Simplified notes from Saral · ${new Date().toLocaleDateString('en-IN')}`, 'AI-generated: check against the original.', ''];
    for (const s of doc.sections) {
      const items = s.paragraphs.filter((p) => doc.simplified[p.id]);
      const sum = doc.summaries[`sec:${s.id}`];
      if (!items.length && !sum) continue;
      lines.push(`## ${s.heading}`, '');
      if (sum) lines.push('Summary:', ...sum.bullets.map((b) => `  • ${b}`), '');
      for (const p of items) lines.push(`[¶${p.id.slice(1)}] ${doc.simplified[p.id].text}`, '');
    }
    if (doc.glossary.length) {
      lines.push('## Glossary', '');
      for (const g of doc.glossary) lines.push(`${g.term}: ${g.definition}`);
    }
    download(`${doc.title.replace(/[^\w ]+/g, '').trim() || 'saral'} - simplified notes.txt`, lines.join('\n'));
    announce('Notes downloaded');
  }

  function printNotes() {
    const w = window.open('', '_blank');
    if (!w) return;
    const esc = (t) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
    let html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(doc.title)} · Saral notes</title><style>body{font-family:Atkinson Hyperlegible,Arial,sans-serif;font-size:16pt;line-height:1.6;max-width:42em;margin:2em auto;padding:0 1em;color:#000}h1{font-size:24pt}h2{font-size:18pt;margin-top:1.5em}.src{font-size:10pt;color:#444}dt{font-weight:bold}</style></head><body><h1>${esc(doc.title)}</h1><p class="src">Simplified with Saral. AI-generated: check against the original.</p>`;
    for (const s of doc.sections) {
      const items = s.paragraphs.filter((p) => doc.simplified[p.id]);
      const sum = doc.summaries[`sec:${s.id}`];
      if (!items.length && !sum) continue;
      html += `<h2>${esc(s.heading)}</h2>`;
      if (sum) html += `<ul>${sum.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`;
      for (const p of items) html += `<p>${esc(doc.simplified[p.id].text)} <span class="src">(¶${p.id.slice(1)})</span></p>`;
    }
    if (doc.glossary.length) html += `<h2>Glossary</h2><dl>${doc.glossary.map((g) => `<dt>${esc(g.term)}</dt><dd>${esc(g.definition)}</dd>`).join('')}</dl>`;
    html += '</body></html>';
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

  if (missing) {
    return (
      <main id="main" tabIndex={-1} className="mx-auto max-w-xl px-4 py-24 text-center outline-none">
        <h1 className="font-display text-3xl font-semibold">This document isn't on this device</h1>
        <p className="mt-3 text-muted">Saral keeps files in this browser only. Open it again from your library.</p>
        <Link to="/library" className={`${btn.primary} mt-6`}>
          Go to library
        </Link>
      </main>
    );
  }
  if (!doc) {
    return (
      <p className="spec p-10" role="status">
        Opening document…
      </p>
    );
  }

  const termRe = buildTermRegex(doc.glossary);
  const defs = new Map(doc.glossary.map((g) => [g.term.toLowerCase(), g.definition]));
  const docSummary = doc.summaries?.doc;
  const showOutline = outlineOpen;

  const article = (
    <article
      ref={articleRef}
      className="reader-text relative mx-auto pb-24"
      style={{ maxWidth: `calc(${settings.lineLength}ch + 2.75rem)` }}
      onDoubleClick={onDoubleClick}
      onPointerDown={onPointerDown}
      onPointerUp={cancelPress}
      onPointerMove={cancelPress}
      onClick={(e) => {
        if (!settings.lineFocus || playState === 'playing') return;
        const base = articleRef.current.getBoundingClientRect().top;
        setFocusY(Math.max(0, e.clientY - base - lineH / 2));
      }}
    >
      <h1 className="mb-2 pl-[2.75rem] font-display font-semibold" style={{ fontSize: 'calc(var(--r-size) * 1.7)', lineHeight: 1.2 }}>
        {doc.title}
      </h1>
      <p className="spec mb-8 pl-[2.75rem]">
        {doc.source} · {sentences.length} sentences · double-click a word for its meaning
      </p>

      {settings.summaryFirst && (
        <section aria-labelledby="docsum-h" className="mb-10 ml-[2.75rem] rounded-2xl border-2 border-ink bg-surface p-5" style={{ fontSize: '0.9em' }}>
          <h2 id="docsum-h" style={{ marginTop: 0 }}>
            Summary first
          </h2>
          {docSummary ? (
            <>
              <ul className="list-disc pl-5">
                {docSummary.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <p className="spec">{docSummary.source === 'extractive' ? 'Key sentences picked from the text, not AI' : 'AI-generated, check against the original'}</p>
            </>
          ) : (
            <p>Making a summary…</p>
          )}
        </section>
      )}

      {doc.sections.map((section, si) => {
        const groups = [];
        for (const p of section.paragraphs) {
          const last = groups[groups.length - 1];
          if (p.list && last && last.list === p.list) last.items.push(p);
          else groups.push({ list: p.list, items: [p] });
        }
        const showHeading = !(si === 0 && section.heading === doc.title);
        return (
          <section key={section.id} aria-labelledby={showHeading ? section.id : undefined}>
            {showHeading &&
              (section.level >= 3 ? (
                <h3 id={section.id} tabIndex={-1} className="pl-[2.75rem]">
                  {section.heading}
                </h3>
              ) : (
                <h2 id={section.id} tabIndex={-1} className="pl-[2.75rem]">
                  {section.heading}
                </h2>
              ))}
            {groups.map((g, gi) => {
              const items = g.items.map((p) => (
                <Paragraph
                  key={p.id}
                  as={g.list ? 'li' : 'div'}
                  paragraph={p}
                  currentSentenceId={currentPid === p.id && playState !== 'stopped' ? current.id : currentPid === p.id && playState === 'stopped' && sIndex > 0 ? current.id : null}
                  wordRange={currentPid === p.id && playState === 'playing' ? wordRange : null}
                  selected={selected.has(p.id)}
                  linked={linkedPid === p.id}
                  termRe={termRe}
                  defs={defs}
                  onSentenceClick={readFrom}
                  onToggleSelect={toggleSelect}
                  onHoverLink={setLinkedPid}
                />
              ));
              if (!g.list) return items;
              const ListTag = g.list === 'number' ? 'ol' : 'ul';
              return (
                <ListTag key={`g${gi}`} className={`m-0 p-0 ${g.list === 'number' ? 'list-decimal' : 'list-none'}`} style={{ listStylePosition: 'inside' }}>
                  {items}
                </ListTag>
              );
            })}
          </section>
        );
      })}

      {settings.lineFocus && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[-1rem] top-0 bottom-0 no-print">
          <div className="absolute inset-x-0 top-0" style={{ height: focusY, background: 'var(--dim)' }} />
          <div
            className="absolute inset-x-0 border-y-2 border-accent"
            style={{ top: focusY, height: lineH * settings.focusLines }}
          />
          <div className="absolute inset-x-0 bottom-0" style={{ top: focusY + lineH * settings.focusLines, background: 'var(--dim)' }} />
        </div>
      )}
    </article>
  );

  return (
    <div className="flex min-h-dvh flex-col" style={readerStyleVars(settings)}>
      <header className="no-print sticky top-0 z-40 border-b border-line-soft bg-bg/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 sm:flex-nowrap sm:px-4">
          <Link to="/library" className={`${btn.icon}`}>
            <ArrowLeft aria-hidden="true" />
            <span className="sr-only">Back to library</span>
          </Link>
          <p className="min-w-0 flex-1 truncate px-1 font-bold" aria-hidden="true">
            {doc.title}
          </p>
          <nav aria-label="Reader tools" className="flex basis-full flex-wrap items-center justify-between gap-0.5 sm:basis-auto sm:justify-end">
            <TopButton pressed={outlineOpen} onClick={() => setOutlineOpen((o) => !o)} icon={ListTree} label="Outline" />
            <TopButton
              pressed={compare}
              onClick={() => {
                setCompare((c) => !c);
                if (!compare) {
                  window.scrollTo(0, 0);
                  if (!window.matchMedia('(min-width: 1536px)').matches) setOutlineOpen(false);
                }
              }}
              icon={Columns2}
              label="Compare"
            />
            <TopButton pressed={aiOpen} onClick={() => setAiOpen((o) => !o)} icon={Sparkles} label="AI tools" />
            {sttSupported && <TopButton pressed={voiceCmd} onClick={() => setVoiceCmd((v) => !v)} icon={voiceCmd ? Mic : MicOff} label="Voice commands" />}
            <Link to="/captions" className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-bold hover:bg-surface-2">
              <CaptionsIcon aria-hidden="true" className="size-5" />
              <span className="hidden xl:inline">Captions</span>
              <span className="sr-only xl:hidden">Live captions</span>
            </Link>
            <TopButton pressed={false} onClick={() => settingsDialog.current?.showModal()} icon={SlidersHorizontal} label="Display" />
          </nav>
        </div>
      </header>

      <div className="flex flex-1">
        {showOutline && (
          <nav
            aria-label="Outline"
            className="no-print fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-line-soft bg-bg p-4 shadow-xl lg:sticky lg:top-[57px] lg:z-10 lg:h-[calc(100dvh-57px)] lg:shadow-none"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="spec">Outline</p>
              <button type="button" className={`${btn.icon} lg:hidden`} onClick={() => setOutlineOpen(false)}>
                <X aria-hidden="true" />
                <span className="sr-only">Close outline</span>
              </button>
            </div>
            <ol className="grid gap-1">
              {doc.sections.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      const h = document.getElementById(s.id) || document.getElementById(s.paragraphs[0]?.id);
                      h?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
                      h?.focus?.({ preventScroll: true });
                      if (!wide) setOutlineOpen(false);
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-left hover:bg-surface-2 ${s.level >= 3 ? 'pl-6 text-sm' : 'font-bold'} ${
                      s.paragraphs.some((p) => p.id === currentPid) ? 'bg-surface-2' : ''
                    }`}
                  >
                    {s.heading}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <main id="main" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          {compare ? (
            <div className="grid h-[calc(100dvh-57px-72px)] grid-rows-2 md:grid-cols-2 md:grid-rows-1">
              <ComparePane doc={doc} original={original} scrollRef={origScrollRef} onScroll={() => syncScroll(origScrollRef.current, readerScrollRef.current)} />
              <section aria-labelledby="after-h" className="flex min-h-0 flex-col">
                <h2 id="after-h" className="spec border-b border-line-soft bg-surface px-4 py-2 text-ink">
                  After · Saral reader
                </h2>
                <div ref={readerScrollRef} onScroll={() => syncScroll(readerScrollRef.current, origScrollRef.current)} className="min-h-0 flex-1 overflow-y-auto px-3 py-6 sm:px-6">
                  {article}
                </div>
              </section>
            </div>
          ) : (
            <div className="px-3 py-8 sm:px-6">{article}</div>
          )}
        </main>

        {aiOpen && (
          <div className="no-print fixed inset-0 z-50 bg-bg lg:sticky lg:inset-auto lg:top-[57px] lg:z-10 lg:h-[calc(100dvh-57px)] lg:w-[26rem] lg:shrink-0 lg:border-l lg:border-line-soft">
            <AiPanel
              doc={doc}
              scope={scope}
              busy={aiBusy}
              error={aiError}
              onRun={runAction}
              onClose={() => setAiOpen(false)}
              linkedPid={linkedPid}
              onLink={setLinkedPid}
              onJump={(pid) => {
                if (!wide) setAiOpen(false);
                setTimeout(() => jumpTo(pid), 50);
              }}
              onReport={(pid, action) => {
                logReport({ docId: doc.id, pid, action });
                announce(`Thanks. Problem with paragraph ${pid.slice(1)} logged.`);
              }}
              onExportTxt={exportTxt}
              onPrint={printNotes}
              translateLang={translateLang}
              setTranslateLang={setTranslateLang}
            />
          </div>
        )}
      </div>

      <Player state={playState} index={sIndex} total={sentences.length} wordSync={wordSync} onPlay={play} onPause={pause} onStop={stop} onPrev={prev} onNext={next} onRate={setRate} />

      <dialog
        ref={settingsDialog}
        aria-labelledby="ds-h"
        className="m-auto max-h-[90dvh] w-[min(40rem,94vw)] overflow-y-auto rounded-3xl border-2 border-ink bg-bg p-0 text-ink backdrop:bg-black/50"
        onClick={(e) => e.target === settingsDialog.current && settingsDialog.current.close()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line-soft bg-bg px-5 py-3">
          <h2 id="ds-h" className="font-display text-xl font-semibold">
            Display settings
          </h2>
          <button type="button" className={btn.icon} onClick={() => settingsDialog.current.close()}>
            <X aria-hidden="true" />
            <span className="sr-only">Close display settings</span>
          </button>
        </div>
        <div className="p-5">
          <p className="mb-4 text-muted">Changes apply to the page behind straight away.</p>
          <DisplaySettings showPreview={false} compact headingLevel={3} />
        </div>
      </dialog>

      {lookup && <WordLookup word={lookup} rate={settings.rate} onClose={() => setLookup(null)} />}
    </div>
  );
}
