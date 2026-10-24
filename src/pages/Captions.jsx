import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, Download, BookOpen, Trash2, Maximize, PanelRight, AlertTriangle } from 'lucide-react';
import { Page, btn, SpecLabel } from '../components/Shell.jsx';
import { useSettings } from '../store/settings.js';
import { announce } from '../store/announce.js';
import { Captioner, sttSupported } from '../lib/stt.js';
import { importText } from '../lib/importers.js';
import { saveDoc } from '../lib/storage.js';

const STORE_KEY = 'saral-transcript';

function fmtClock(ms) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
function fmtVtt(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const x = Math.floor(ms % 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(x).padStart(3, '0')}`;
}

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const STATUS = {
  off: { label: 'Off', cls: 'border-line' },
  listening: { label: 'Listening', cls: 'border-ink bg-ink text-bg' },
  paused: { label: 'Paused, restarting…', cls: 'border-accent-ink' },
  error: { label: 'Stopped', cls: 'border-accent-ink' },
};

const ERRORS = {
  denied: 'Microphone access is blocked. Allow the microphone for this site in the address bar, then press Start again.',
  'no-mic': 'Saral could not find a microphone.',
  network: 'Captions need an internet connection in Chrome. Check the connection and press Start again.',
  unsupported: 'Live captions need Chrome or Edge. Every other Saral feature still works in this browser.',
};

export default function Captions() {
  const s = useSettings();
  const set = s.set;
  const navigate = useNavigate();
  const [status, setStatus] = useState('off');
  const [error, setError] = useState(null);
  const [interim, setInterim] = useState('');
  const [entries, setEntries] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [showTranscript, setShowTranscript] = useState(() => s.preset === 'hearing' || window.matchMedia('(min-width: 1024px)').matches);
  const segStart = useRef(null);
  const stage = useRef(null);
  const listEnd = useRef(null);
  const cap = useRef(null);

  if (!cap.current) {
    cap.current = new Captioner({
      onInterim: (t) => {
        if (t && segStart.current === null) segStart.current = Date.now();
        setInterim(t);
      },
      onFinal: (text) => {
        const now = Date.now();
        const startAbs = segStart.current || now - 1500;
        segStart.current = null;
        setEntries((list) => [...list, { startAbs, endAbs: now, text, at: new Date(now).toISOString() }]);
      },
      onStatus: (st, detail) => {
        setStatus(st);
        if (st === 'listening') announce('Listening');
        if (st === 'error') {
          setError(ERRORS[detail] || 'Captions stopped.');
          announce(ERRORS[detail] || 'Captions stopped');
        }
      },
    });
  }

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(entries.slice(-2000)));
    } catch {
      /* storage full or blocked */
    }
    listEnd.current?.scrollIntoView({ block: 'nearest' });
  }, [entries]);

  useEffect(() => () => cap.current?.stop(), []);

  function start() {
    setError(null);
    if (!sttSupported) {
      setError(ERRORS.unsupported);
      return;
    }
    cap.current.start(s.captionLang);
  }
  function stop() {
    cap.current.stop();
    setInterim('');
    announce('Captions stopped');
  }

  const running = status === 'listening' || status === 'paused';
  const lineHeight = 1.35;
  const recent = entries.slice(-12).map((e) => e.text).join(' ');

  function toTxt() {
    return entries.map((e) => `[${new Date(e.at).toLocaleTimeString('en-IN')}] ${e.text}`).join('\n');
  }
  function toVtt() {
    const t0 = entries[0]?.startAbs || 0;
    return `WEBVTT\n\n${entries
      .map((e, i) => `${i + 1}\n${fmtVtt(e.startAbs - t0)} --> ${fmtVtt(Math.max(e.endAbs, e.startAbs + 800) - t0)}\n${e.text}\n`)
      .join('\n')}`;
  }
  async function openInReader() {
    if (!entries.length) return;
    const text = `# Lecture transcript, ${new Date(entries[0].at).toLocaleDateString('en-IN')}\n\n${entries.map((e) => e.text).join(' ').replace(/([.!?])\s+/g, '$1\n')}`;
    // Group into paragraphs of about five sentences.
    const sentences = text.split('\n').slice(2);
    const paras = [];
    for (let i = 0; i < sentences.length; i += 5) paras.push(sentences.slice(i, i + 5).join(' '));
    const doc = importText(`# Lecture transcript, ${new Date(entries[0].at).toLocaleDateString('en-IN')}\n\n${paras.join('\n\n')}`, 'Live captions');
    doc.kind = 'transcript';
    await saveDoc(doc);
    navigate(`/read/${doc.id}`);
  }

  return (
    <Page>
      <SpecLabel>F4 / Live captions</SpecLabel>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Live captions</h1>
        <p className={`spec inline-flex min-h-9 items-center rounded-full border-2 px-3 ${STATUS[status].cls}`} role="status">
          {running && <span aria-hidden="true" className="mr-2 inline-block size-2.5 animate-pulse rounded-full bg-accent" />}
          {STATUS[status].label}
        </p>
      </div>

      {!sttSupported && (
        <p role="alert" className="mt-6 flex items-start gap-2 rounded-2xl border-2 border-accent-ink p-4 font-bold">
          <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" /> {ERRORS.unsupported}
        </p>
      )}

      <p className="mt-4 max-w-3xl text-muted">
        Saral will ask to use your microphone. In Chrome, speech is sent to Google's speech service to make captions; Saral itself stores nothing online.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {running ? (
          <button type="button" onClick={stop} className={`${btn.primary} min-h-14 px-7 text-lg`}>
            <Square aria-hidden="true" /> Stop captions
          </button>
        ) : (
          <button type="button" onClick={start} className={`${btn.accent} min-h-14 px-7 text-lg`} disabled={!sttSupported}>
            <Mic aria-hidden="true" /> Start captions
          </button>
        )}
        <div className="grid gap-1">
          <label htmlFor="cl" className="spec">
            Language
          </label>
          <select id="cl" value={s.captionLang} onChange={(e) => set({ captionLang: e.target.value })} disabled={running} className="min-h-11 rounded-xl border-2 border-line bg-bg px-3 text-ink">
            <option value="en-IN">English (India)</option>
            <option value="hi-IN">Hindi</option>
          </select>
        </div>
        <button type="button" className={btn.ghost} aria-pressed={showTranscript} onClick={() => setShowTranscript((v) => !v)}>
          <PanelRight aria-hidden="true" className="size-5" /> Transcript
        </button>
        <button type="button" className={btn.ghost} onClick={() => stage.current?.requestFullscreen?.()}>
          <Maximize aria-hidden="true" className="size-5" /> Full screen
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-2xl border-2 border-accent-ink p-4 font-bold">
          {error}
        </p>
      )}

      <div className={`mt-6 grid gap-6 ${showTranscript ? 'lg:grid-cols-[1fr_22rem]' : ''}`}>
        <div>
          <div
            ref={stage}
            className={`flex min-h-[50dvh] rounded-3xl bg-[#111] p-4 sm:p-8 ${s.captionPosition === 'top' ? 'items-start' : 'items-end'}`}
          >
            <div
              className="w-full overflow-hidden"
              aria-live={s.announceCaptions ? 'polite' : 'off'}
              style={{ maxHeight: `${s.captionLines * s.captionSize * lineHeight + 8}px` }}
            >
              <p
                className="flex flex-col justify-end rounded-xl bg-black px-4 py-1 font-bold text-white"
                style={{ fontSize: s.captionSize, lineHeight, minHeight: `${s.captionLines * s.captionSize * lineHeight}px` }}
              >
                <span>
                  {recent || (!interim && <span className="text-white/70">{running ? 'Listening… start speaking.' : 'Captions appear here.'}</span>)}{' '}
                  {interim && <span className="text-white/60">{interim}</span>}
                </span>
              </p>
            </div>
          </div>

          <fieldset className="mt-6 grid gap-5 rounded-3xl border border-line-soft p-5 sm:grid-cols-2">
            <legend className="px-2 font-bold">Caption display</legend>
            <div className="grid gap-1">
              <label htmlFor="cs" className="flex justify-between font-bold">
                Caption size <output className="spec text-ink">{s.captionSize} px</output>
              </label>
              <input id="cs" type="range" min={18} max={64} step={2} value={s.captionSize} aria-valuetext={`${s.captionSize} pixels`} onChange={(e) => set({ captionSize: Number(e.target.value) })} />
            </div>
            <div className="grid gap-1">
              <label htmlFor="cln" className="flex justify-between font-bold">
                Visible lines <output className="spec text-ink">{s.captionLines}</output>
              </label>
              <input id="cln" type="range" min={2} max={4} step={1} value={s.captionLines} aria-valuetext={`${s.captionLines} lines`} onChange={(e) => set({ captionLines: Number(e.target.value) })} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold" id="pos-l">
                Position
              </span>
              <div role="group" aria-labelledby="pos-l" className="flex gap-2">
                {['top', 'bottom'].map((p) => (
                  <button key={p} type="button" aria-pressed={s.captionPosition === p} onClick={() => set({ captionPosition: p })} className={`min-h-11 rounded-full border-2 px-4 font-bold capitalize ${s.captionPosition === p ? 'border-ink bg-ink text-bg' : 'border-line'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex min-h-11 items-center gap-3 font-bold">
              <input type="checkbox" className="size-5" checked={s.announceCaptions} onChange={(e) => set({ announceCaptions: e.target.checked })} />
              Read captions to my screen reader
            </label>
          </fieldset>
        </div>

        {showTranscript && (
          <section aria-labelledby="tr-h" className="flex max-h-[80dvh] flex-col rounded-3xl border border-line-soft bg-surface">
            <div className="border-b border-line-soft p-4">
              <h2 id="tr-h" className="font-display text-xl font-semibold">
                Transcript
              </h2>
              <p className="spec">{entries.length} lines</p>
            </div>
            <ol className="flex-1 space-y-3 overflow-y-auto p-4" tabIndex={0} aria-label="Transcript lines">
              {entries.length === 0 && <li className="text-muted">Final lines are saved here with the time.</li>}
              {entries.map((e, i) => (
                <li key={i} className="grid grid-cols-[3.5rem_1fr] gap-2">
                  <span className="spec pt-0.5">{fmtClock((e.startAbs || 0) - (entries[0].startAbs || 0))}</span>
                  <span>{e.text}</span>
                </li>
              ))}
              <li ref={listEnd} aria-hidden="true" />
            </ol>
            <div className="grid gap-2 border-t border-line-soft p-4">
              <button type="button" className={btn.primary} disabled={!entries.length} onClick={openInReader}>
                <BookOpen aria-hidden="true" className="size-5" /> Open in reader
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className={`${btn.secondary} px-3`} disabled={!entries.length} onClick={() => download('transcript.txt', toTxt(), 'text/plain')}>
                  <Download aria-hidden="true" className="size-5" /> .txt
                </button>
                <button type="button" className={`${btn.secondary} px-3`} disabled={!entries.length} onClick={() => download('transcript.vtt', toVtt(), 'text/vtt')}>
                  <Download aria-hidden="true" className="size-5" /> .vtt
                </button>
              </div>
              <button
                type="button"
                className={btn.ghost}
                disabled={!entries.length || running}
                onClick={() => {
                  if (window.confirm('Clear the transcript? This cannot be undone.')) setEntries([]);
                }}
              >
                <Trash2 aria-hidden="true" className="size-5" /> Clear
              </button>
            </div>
          </section>
        )}
      </div>
    </Page>
  );
}
