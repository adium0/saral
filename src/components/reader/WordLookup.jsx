import { useEffect, useRef, useState } from 'react';
import { Volume2, X, Loader2 } from 'lucide-react';
import { btn } from '../Shell.jsx';
import { speakOnce } from '../../lib/tts.js';

// F8: definition and pronunciation for a double-clicked or long-pressed word (Free Dictionary API).
export default function WordLookup({ word, onClose, rate }) {
  const [state, setState] = useState({ loading: true });
  const closeRef = useRef(null);
  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status === 404 ? 'notfound' : 'error'))))
      .then((data) => {
        if (!alive) return;
        const entry = data[0];
        const meanings = (entry.meanings || []).slice(0, 2).map((m) => ({
          part: m.partOfSpeech,
          def: m.definitions?.[0]?.definition,
        }));
        setState({ loading: false, phonetic: entry.phonetic || entry.phonetics?.find((p) => p.text)?.text, meanings });
      })
      .catch((e) => alive && setState({ loading: false, error: e.message === 'notfound' ? 'No dictionary entry for this word.' : "Couldn't reach the dictionary. Check the internet." }));
    return () => {
      alive = false;
    };
  }, [word]);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="false" aria-labelledby="wl-h" className="no-print fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md rounded-3xl border-2 border-ink bg-bg p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="wl-h" className="font-display text-2xl font-semibold">
            {word}
          </h2>
          {state.phonetic && <p className="spec text-ink">{state.phonetic}</p>}
        </div>
        <div className="flex gap-1">
          <button type="button" className={btn.icon} onClick={() => speakOnce(word, { rate: Math.min(rate, 1) })}>
            <Volume2 aria-hidden="true" />
            <span className="sr-only">Say {word}</span>
          </button>
          <button ref={closeRef} type="button" className={btn.icon} onClick={onClose}>
            <X aria-hidden="true" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </div>
      <div aria-live="polite" className="mt-3">
        {state.loading && (
          <p className="flex items-center gap-2">
            <Loader2 aria-hidden="true" className="animate-spin" /> Looking it up…
          </p>
        )}
        {state.error && <p>{state.error}</p>}
        {state.meanings?.map((m, i) => (
          <p key={i} className="mt-1">
            <em className="text-muted">{m.part}</em> · {m.def}
          </p>
        ))}
      </div>
    </div>
  );
}
