import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useSettings, FONTS, THEMES, PRESETS } from '../store/settings.js';
import { getVoices, onVoicesChanged, sortVoices, ttsSupported } from '../lib/tts.js';
import { btn } from './Shell.jsx';

export function readerStyleVars(s) {
  return {
    '--r-font': FONTS[s.font]?.css || FONTS.atkinson.css,
    '--r-size': `${s.fontSize}px`,
    '--r-lh': s.lineHeight,
    '--r-ls': `${s.letterSpacing}em`,
    '--r-ws': `${s.wordSpacing}em`,
    '--r-measure': `${s.lineLength}ch`,
  };
}

function Slider({ id, label, value, min, max, step, unit = '', onChange, format }) {
  const shown = format ? format(value) : `${value}${unit}`;
  return (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-bold">
          {label}
        </label>
        <output htmlFor={id} className="spec text-ink">
          {shown}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={shown}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function Toggle({ id, label, hint, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="font-bold">
          {label}
        </label>
        {hint && (
          <p id={`${id}-hint`} className="text-sm text-muted">
            {hint}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 border-ink transition ${checked ? 'bg-ink' : 'bg-bg'}`}
      >
        <span className={`inline-block size-5 rounded-full transition ${checked ? 'translate-x-7 bg-bg' : 'translate-x-1 bg-ink'}`} />
        <span className="sr-only">{checked ? 'On' : 'Off'}</span>
      </button>
    </div>
  );
}

export function VoicePicker({ id = 'voice' }) {
  const voiceURI = useSettings((s) => s.voiceURI);
  const set = useSettings((s) => s.set);
  const [voices, setVoices] = useState(() => sortVoices(getVoices()));
  useEffect(() => onVoicesChanged(() => setVoices(sortVoices(getVoices()))), []);
  if (!ttsSupported) return <p className="text-muted">This browser can't read aloud.</p>;
  const shown = voices.filter((v) => /^(en|hi|ta)/i.test(v.lang));
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="font-bold">
        Voice
      </label>
      <select
        id={id}
        value={voiceURI || ''}
        onChange={(e) => set({ voiceURI: e.target.value || null })}
        className="min-h-11 rounded-xl border-2 border-line bg-bg px-3 text-ink"
      >
        <option value="">Automatic (English, India if installed)</option>
        {shown.map((v) => (
          <option key={v.voiceURI} value={v.voiceURI}>
            {v.name} · {v.lang}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function DisplaySettings({ showPreview = true, compact = false, headingLevel = 2 }) {
  const s = useSettings();
  const H = `h${headingLevel}`;
  const set = s.set;
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)] gap-8 ${compact ? '' : 'lg:grid-cols-[1fr_1.1fr]'}`}>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6">
        <fieldset className="grid gap-2">
          <legend className="mb-2 font-bold">Preset</legend>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESETS)
              .filter(([id]) => id !== 'hearing')
              .map(([id, p]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={s.preset === id}
                  onClick={() => s.applyPreset(id)}
                  className={`min-h-11 rounded-full border-2 px-4 font-bold ${s.preset === id ? 'border-ink bg-ink text-bg' : 'border-line hover:border-ink'}`}
                >
                  {p.label}
                </button>
              ))}
          </div>
        </fieldset>

        <div className="grid gap-1">
          <label htmlFor="font" className="font-bold">
            Font
          </label>
          <select
            id="font"
            value={s.font}
            onChange={(e) => set({ font: e.target.value, preset: null })}
            className="min-h-11 rounded-xl border-2 border-line bg-bg px-3 text-ink"
          >
            {Object.entries(FONTS).map(([k, f]) => (
              <option key={k} value={k}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="mb-2 font-bold">Theme</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(THEMES).map(([k, label]) => (
              <label
                key={k}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2 ${s.theme === k ? 'border-ink' : 'border-line-soft'}`}
              >
                <input type="radio" name="theme" value={k} checked={s.theme === k} onChange={() => set({ theme: k, preset: null })} className="size-5 accent-[var(--accent-ink)]" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <Slider id="size" label="Text size" value={s.fontSize} min={14} max={40} step={1} unit=" px" onChange={(v) => set({ fontSize: v, preset: null })} />
        <Slider id="lh" label="Line height" value={s.lineHeight} min={1.2} max={2.5} step={0.1} format={(v) => v.toFixed(1)} onChange={(v) => set({ lineHeight: v, preset: null })} />
        <Slider id="ls" label="Letter spacing" value={s.letterSpacing} min={0} max={0.12} step={0.01} format={(v) => `${v.toFixed(2)} em`} onChange={(v) => set({ letterSpacing: v, preset: null })} />
        <Slider id="ws" label="Word spacing" value={s.wordSpacing} min={0} max={0.3} step={0.02} format={(v) => `${v.toFixed(2)} em`} onChange={(v) => set({ wordSpacing: v, preset: null })} />
        <Slider id="ll" label="Line length" value={s.lineLength} min={45} max={90} step={5} unit=" characters" onChange={(v) => set({ lineLength: v, preset: null })} />

        <Toggle id="lf" label="Line focus" hint="Dims everything except the lines you are reading. Use the up and down arrow keys to move it." checked={s.lineFocus} onChange={(v) => set({ lineFocus: v })} />
        {s.lineFocus && (
          <Slider id="fl" label="Lines in focus" value={s.focusLines} min={1} max={3} step={1} format={(v) => `${v} line${v > 1 ? 's' : ''}`} onChange={(v) => set({ focusLines: v })} />
        )}

        <H className="mt-2 border-t border-line-soft pt-6 font-display text-xl font-semibold">Read-aloud</H>
        <VoicePicker />
        <Slider id="rate" label="Reading speed" value={s.rate} min={0.5} max={2} step={0.1} format={(v) => `${v.toFixed(1)}×`} onChange={(v) => set({ rate: v })} />
        <Toggle id="pin" label="Keep the read-aloud bar open" checked={s.pinPlayer} onChange={(v) => set({ pinPlayer: v })} />
        <Toggle
          id="sc"
          label="Single-key shortcuts"
          hint="Space, arrow keys, + and − control read-aloud. Turn off if you use speech input or a screen reader that needs these keys."
          checked={s.shortcuts}
          onChange={(v) => set({ shortcuts: v })}
        />

        <H className="mt-2 border-t border-line-soft pt-6 font-display text-xl font-semibold">Layout and motion</H>
        <Toggle id="hp" label="Hide side panels" hint="Shows only the text. Panels open from the top bar." checked={s.hidePanels} onChange={(v) => set({ hidePanels: v })} />
        <Toggle id="sf" label="Show the summary first" checked={s.summaryFirst} onChange={(v) => set({ summaryFirst: v })} />
        <Toggle id="calm" label="Calm mode" hint="Turns off decorative animation everywhere. Saral also follows your device's reduce-motion setting." checked={s.motion === 'calm'} onChange={(v) => set({ motion: v ? 'calm' : 'system' })} />

        <button type="button" className={`${btn.secondary} justify-self-start`} onClick={s.reset}>
          <RotateCcw aria-hidden="true" className="size-5" /> Reset to defaults
        </button>
      </div>

      {showPreview && (
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="spec mb-2">Live preview</p>
          <div className="overflow-hidden rounded-3xl border-2 border-ink bg-bg p-6" style={readerStyleVars(s)}>
            <div className="reader-text">
              <p aria-hidden="true" style={{ marginTop: 0, fontWeight: 700, fontSize: "calc(var(--r-size) * 1.35)", lineHeight: 1.3 }}>The cell membrane</p>
              <p>
                Every cell is surrounded by a thin, flexible <span className="term">plasma membrane</span>. It controls what enters and leaves the
                cell, letting nutrients in and keeping harmful substances out.
              </p>
              <p>
                <span className="sen is-current">
                  The membrane is made of a <span className="word-current">double</span> layer of lipids with proteins floating in it.
                </span>{' '}
                Scientists call this the fluid mosaic model.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
