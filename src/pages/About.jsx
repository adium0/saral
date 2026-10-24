import { useState } from 'react';
import { Page, SpecLabel, btn } from '../components/Shell.jsx';
import { getReports } from '../lib/storage.js';

export default function About() {
  const [reports] = useState(getReports);
  return (
    <Page narrow>
      <SpecLabel>About</SpecLabel>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">About Saral</h1>
      <p className="mt-4 text-lg">
        Saral (Hindi for "simple") turns any PDF, Word file or pasted notes into study material a student can resize, hear, simplify and caption, all in the
        browser. It was built for Question 17, Assistive Learning Tool for Students with Disabilities, at VIT's AI Innovate-A-Thon.
      </p>

      <section aria-labelledby="sdg-h" className="mt-10">
        <h2 id="sdg-h" className="font-display text-2xl font-semibold">Why it matters</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>
            <strong>SDG 4.5 and 4.a:</strong> equal access to education and inclusive learning environments for students with disabilities.
          </li>
          <li>
            <strong>SDG 10.2:</strong> free and browser-based, so cost is not a barrier.
          </li>
          <li>Supports the inclusive-education duties in India's Rights of Persons with Disabilities Act, 2016.</li>
        </ul>
      </section>

      <section aria-labelledby="ai-h" className="mt-10">
        <h2 id="ai-h" className="font-display text-2xl font-semibold">How the AI is used</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>Text-to-speech and speech-to-text come from the browser's Web Speech API.</li>
          <li>Simplify, Summarize, Explain and Translate use a hosted language model through one server function that keeps the key private.</li>
          <li>The prompt tells the model to use only facts in the passage. Saral rejects any output that points to a paragraph that doesn't exist.</li>
          <li>Readability is measured with the Flesch–Kincaid grade formula, before and after.</li>
          <li>No model is trained by Saral, so there is no training data.</li>
        </ul>
      </section>

      <section aria-labelledby="cr-h" className="mt-10">
        <h2 id="cr-h" className="font-display text-2xl font-semibold">Credits</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>Sample documents were written by the Saral team for this demo. They follow the style of OpenStax Biology (CC BY 4.0) and Wikipedia (CC BY-SA 4.0) articles.</li>
          <li>Fonts: Atkinson Hyperlegible (Braille Institute), Lexend, OpenDyslexic and JetBrains Mono, all under the SIL Open Font License.</li>
          <li>PDF.js (Mozilla), mammoth.js, the Free Dictionary API, GSAP and Motion.</li>
        </ul>
      </section>

      <section aria-labelledby="rep-h" className="mt-10">
        <h2 id="rep-h" className="font-display text-2xl font-semibold">Reported problems on this device</h2>
        <p className="mt-2 text-muted">Each "Report a problem" click is logged here with the paragraph ID, for the team's faithfulness review.</p>
        {reports.length === 0 ? (
          <p className="mt-3">None yet.</p>
        ) : (
          <>
            <ul className="mt-3 grid gap-1">
              {reports.slice(-20).map((r, i) => (
                <li key={i} className="spec text-ink">
                  {r.at.slice(0, 16).replace('T', ' ')} · {r.docId} · ¶{r.pid.slice(1)} · {r.action}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={`${btn.secondary} mt-4`}
              onClick={() => {
                const url = URL.createObjectURL(new Blob([JSON.stringify(reports, null, 2)], { type: 'application/json' }));
                const a = document.createElement('a');
                a.href = url;
                a.download = 'saral-reports.json';
                a.click();
              }}
            >
              Download the log
            </button>
          </>
        )}
      </section>
    </Page>
  );
}
