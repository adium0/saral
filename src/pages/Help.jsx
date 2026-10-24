import { Page, SpecLabel } from '../components/Shell.jsx';
import { useSettings } from '../store/settings.js';
import { ttsSupported } from '../lib/tts.js';
import { sttSupported } from '../lib/stt.js';

const KEYS = [
  ['Space', 'Play or pause read-aloud'],
  ['→ / ←', 'Next or previous sentence'],
  ['+ / −', 'Faster or slower reading'],
  ['↓ / ↑', 'Move line focus (when line focus is on)'],
  ['Double-click a word', 'Definition and pronunciation (long-press on phones)'],
  ['Tab / Shift+Tab', 'Move between controls'],
  ['Esc', 'Close a definition or dialog'],
];

function Check({ ok, label, note }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-line-soft p-4">
      <span aria-hidden="true" className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full font-bold ${ok ? 'bg-ink text-bg' : 'border-2 border-accent-ink text-accent-ink'}`}>
        {ok ? '✓' : '!'}
      </span>
      <span>
        <strong>{label}: {ok ? 'works in this browser' : 'not available in this browser'}</strong>
        <span className="block text-muted">{note}</span>
      </span>
    </li>
  );
}

export default function Help() {
  const shortcuts = useSettings((s) => s.shortcuts);
  const set = useSettings((s) => s.set);
  return (
    <Page narrow>
      <SpecLabel>Help</SpecLabel>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Help and keyboard shortcuts</h1>

      <section aria-labelledby="k-h" className="mt-10">
        <h2 id="k-h" className="font-display text-2xl font-semibold">Keyboard shortcuts</h2>
        <p className="mt-2 text-muted">Single-key shortcuts work in the reader when you are not typing in a box.</p>
        <label className="mt-4 flex min-h-11 items-center gap-3 font-bold">
          <input type="checkbox" className="size-5" checked={shortcuts} onChange={(e) => set({ shortcuts: e.target.checked })} />
          Single-key shortcuts on
        </label>
        <table className="mt-4 w-full border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-ink">
              <th scope="col" className="py-2 pr-4">Key</th>
              <th scope="col" className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {KEYS.map(([k, a]) => (
              <tr key={k} className="border-b border-line-soft">
                <td className="py-3 pr-4">
                  <kbd className="rounded-md border-2 border-line px-2 py-0.5 font-mono text-sm">{k}</kbd>
                </td>
                <td className="py-3">{a}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="b-h" className="mt-12">
        <h2 id="b-h" className="font-display text-2xl font-semibold">Browser support</h2>
        <ul className="mt-4 grid gap-3">
          <Check ok={ttsSupported} label="Read-aloud" note="Uses the voices installed on your device. Some voices highlight sentences only, not words." />
          <Check ok={sttSupported} label="Live captions and voice commands" note="Need Chrome or Edge and an internet connection." />
          <Check ok label="Reader, display settings, import and compare" note="Work in every modern browser, including offline once loaded." />
        </ul>
      </section>

      <section aria-labelledby="p-h" className="mt-12">
        <h2 id="p-h" className="font-display text-2xl font-semibold">Privacy and good use</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>Your files are read in this browser and saved only on this device. There are no accounts.</li>
          <li>When you press Simplify, Summarize, Explain or Translate, only the selected passage is sent to the AI service.</li>
          <li>Live captions in Chrome send microphone audio to Google's speech service.</li>
          <li>AI output can miss nuance or make mistakes. Every result links back to the original paragraph; for exams, read the original.</li>
          <li>Scanned PDFs, equations, diagrams and images can't be read yet.</li>
        </ul>
      </section>
    </Page>
  );
}
