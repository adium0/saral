import { Play, Pause, Square, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useSettings } from '../../store/settings.js';
import { ttsSupported } from '../../lib/tts.js';
import { VoicePicker } from '../DisplaySettings.jsx';
import { btn } from '../Shell.jsx';

export default function Player({ state, index, total, wordSync, onPlay, onPause, onStop, onPrev, onNext, onRate }) {
  const rate = useSettings((s) => s.rate);
  const pin = useSettings((s) => s.pinPlayer);
  const shortcuts = useSettings((s) => s.shortcuts);
  const expanded = pin || state !== 'stopped';
  const playing = state === 'playing';

  const onKeyDown = (e) => {
    if (!shortcuts) return;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.key === ' ' && e.target.tagName !== 'BUTTON') {
      e.preventDefault();
      playing ? onPause() : onPlay();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onPrev();
    } else if (e.key === '+' || e.key === '=') {
      onRate(Math.min(2, Math.round((rate + 0.1) * 10) / 10));
    } else if (e.key === '-' || e.key === '_') {
      onRate(Math.max(0.5, Math.round((rate - 0.1) * 10) / 10));
    }
  };

  if (!ttsSupported) {
    return (
      <div className="no-print sticky bottom-0 z-30 border-t border-line-soft bg-surface px-4 py-3 text-center">
        This browser can't read aloud. Try Chrome or Edge.
      </div>
    );
  }

  const big = pin ? 'size-14' : 'size-11';
  return (
    <section
      aria-label="Read-aloud player"
      onKeyDown={onKeyDown}
      className="no-print sticky bottom-0 z-30 border-t-2 border-ink bg-surface/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 sm:px-6">
        <div className="flex items-center gap-1">
          {expanded && (
            <button type="button" className={btn.icon} onClick={onPrev} disabled={index <= 0}>
              <SkipBack aria-hidden="true" />
              <span className="sr-only">Previous sentence</span>
            </button>
          )}
          <button
            type="button"
            onClick={playing ? onPause : onPlay}
            className={`inline-flex ${big} items-center justify-center rounded-full bg-ink text-bg transition hover:scale-105`}
          >
            {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
            <span className="sr-only">{playing ? 'Pause' : state === 'paused' ? 'Resume reading' : 'Read aloud'}</span>
          </button>
          {expanded && (
            <>
              <button type="button" className={btn.icon} onClick={onStop} disabled={state === 'stopped'}>
                <Square aria-hidden="true" />
                <span className="sr-only">Stop</span>
              </button>
              <button type="button" className={btn.icon} onClick={onNext} disabled={index >= total - 1}>
                <SkipForward aria-hidden="true" />
                <span className="sr-only">Next sentence</span>
              </button>
            </>
          )}
        </div>

        <p className="min-w-0 flex-1 text-sm">
          {state === 'stopped' && !expanded ? (
            <span className="font-bold">
              <Volume2 aria-hidden="true" className="mr-1 inline size-5" />
              Read aloud{shortcuts ? ' · Space to play when this bar has focus' : ''}
            </span>
          ) : (
            <>
              <span className="font-bold">{playing ? 'Reading' : state === 'paused' ? 'Paused' : 'Ready'}</span>
              <span className="text-muted">
                {' '}
                · sentence {Math.min(index + 1, total)} of {total}
                {playing && wordSync === false ? ' · this voice highlights sentences only' : ''}
              </span>
            </>
          )}
        </p>

        {expanded && (
          <div className="flex w-full flex-wrap items-end gap-3 sm:w-auto">
            <div className="grid w-40 gap-0">
              <label htmlFor="player-rate" className="spec">
                Speed {rate.toFixed(1)}×
              </label>
              <input
                id="player-rate"
                type="range"
                min={0.5}
                max={2}
                step={0.1}
                value={rate}
                aria-valuetext={`${rate.toFixed(1)} times`}
                onChange={(e) => onRate(Number(e.target.value))}
              />
            </div>
            <div className="w-56">
              <VoicePicker id="player-voice" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
