# Saral

Saral turns any PDF, Word file or pasted notes into study material a student can resize, hear, simplify and caption, all in the browser. Built for Question 17 (Assistive Learning Tool for Students with Disabilities) at VIT's AI Innovate-A-Thon.

## Run it

```bash
npm install
cp .env.example .env      # add GEMINI_API_KEY or GROQ_API_KEY (optional: samples work without it)
npm run dev               # http://localhost:5173
```

`npm run dev` also serves the AI endpoint (`POST /api/ai`) with the same code the deployed function uses, so the key stays on the server side even locally.

Use Chrome or Edge for the demo: live captions and voice commands need the Web Speech recognition API.

## Deploy

**Vercel (recommended):** import the GitHub repo, keep the defaults (Vite), add `GEMINI_API_KEY` (or `GROQ_API_KEY`) under Project settings → Environment variables, deploy. `api/ai.js` becomes the serverless function and `vercel.json` handles page routes.

**Netlify:** import the repo, add the same variable. `netlify.toml` and `netlify/functions/ai.mjs` are already set up.

Without a key, Simplify/Summary/Explain still work on the three samples (reviewed, cached output) and fall back to an extractive summary ("key sentences, not AI") on other documents. Translate needs a key.

## What's built (PRD coverage)

| ID | Feature | Status | Where |
| --- | --- | --- | --- |
| F1 | Import PDF, DOCX, TXT, MD, paste, 3 samples; header/footer and page-number removal; hyphen rejoining; paragraph and sentence IDs; scanned-PDF message; 20 MB cap; keyboard "Choose file" | Done | `src/lib/importers.js`, `src/lib/pdfText.js`, `src/pages/Library.jsx` |
| F2 | Reader: 14–40 px, line height 1.2–2.5, letter 0–0.12 em, word 0–0.3 em, 45–90 ch; 4 fonts; light/dark/cream/high-contrast; line focus 1–3 lines following keys and read-aloud; persisted; follows dark mode and reduced motion | Done | `src/components/DisplaySettings.jsx`, `src/pages/Reader.jsx` |
| F3 | Read-aloud: play/pause/stop/prev/next, 0.5–2×, voice picker (en-IN/hi first), click a sentence to read, word highlight with sentence fallback, auto-scroll, one sentence at a time, switchable shortcuts | Done | `src/lib/tts.js`, `src/components/reader/Player.jsx` |
| F4 | Live captions: mic explanation, interim grey / final white, en-IN + Hindi, 18–64 px, 2–4 lines, top/bottom, auto-restart with status, transcript → reader, .txt, unsupported-browser message, screen-reader mute | Done | `src/lib/stt.js`, `src/pages/Captions.jsx` |
| F5 | Simplify / Summarize in 5 bullets / Explain like I'm new; side-by-side with source links and hover linking; glossary 5–15 terms underlined with definitions on tap or focus; FK badge before→after; "AI-generated" labels; Report a problem; retry once on bad output; cached or extractive fallback | Done | `src/lib/ai.js`, `api/_lib/aiCore.js`, `src/components/reader/AiPanel.jsx` |
| F6 | First-run presets: Low vision, Dyslexia-friendly, Hard of hearing, Focus; Customize; Reset | Done | `src/pages/Welcome.jsx`, `src/store/settings.js` |
| F7 | Compare: original PDF pages (PDF.js) beside the reader, linked scrolling, header toggle | Done | `src/components/reader/ComparePane.jsx` |
| F8 | Double-click / long-press a word: definition + pronunciation | Done (P1) | `src/components/reader/WordLookup.jsx` |
| F9 | Voice commands: read, stop, next, previous, bigger/smaller text, simplify this | Done (P1) | `src/pages/Reader.jsx` |
| F10 | Export notes + glossary (.txt, print to PDF); transcript .txt and .vtt | Done (P1) | Reader AI panel, Captions page |
| F11 | Whisper captions for recorded video | Not built (P1, optional) | — |
| F12 | OCR for scanned PDFs | Not built (P2, "proposed" slide) | — |
| F13 | Translate to Hindi or Tamil and read aloud | Done (P2, needs AI key) | AI panel |
| F14 | Offline PWA | Not built (P2) | — |

Also: landing page with scroll-driven "dense → readable" hero (GSAP ScrollTrigger), stacking feature cards, before/after slider, hover/magnetic effects; Calm mode and OS reduced-motion turn all decorative motion off; marquee has a pause button. Help (shortcuts, browser support, privacy) and About (SDGs, AI methods, credits, problem-report log).

## Accessibility checks run

- axe-core (WCAG 2.0/2.1/2.2 A and AA + best practice) on landing, welcome, library, reader, reader in high contrast, captions, settings: no violations.
- No horizontal scroll at 320 px on every screen.
- Every control is a native button, link, input or select with a visible 3 px focus ring; status changes go to a polite live region.

Run them again with `npm run dev` then `SHOTS=/tmp node scripts/e2e.cjs`. Still to do by hand on the demo laptop: Lighthouse, NVDA and TalkBack walkthroughs, mic permission.

## Samples and test files

`public/samples/` holds three team-written samples (cell structure PDF, operating systems PDF, CPU scheduling DOCX) and `test-cases/` holds a two-column page (TC2, expected to interleave) and an image-only scanned page (TC3). `public/samples/cache/` holds reviewed AI output for the samples so the demo works on bad Wi-Fi. Rebuild with `npm run build:samples` (needs Python with reportlab and python-docx).

The PRD planned OpenStax and Wikipedia excerpts; those sites weren't reachable from the build environment, so the samples are original text in the same style. Swap in the real PDFs any time: upload works with any text PDF.

## Project layout

```
api/ai.js, api/_lib/aiCore.js   serverless AI proxy (Gemini or Groq), prompt, rate limit
netlify/functions/ai.mjs        same handler for Netlify
src/lib/                        document model, importers, readability, AI client, speech engines, storage
src/pages/                      Landing, Welcome, Library, Reader, Captions, Settings, Help, About
src/components/                 shell, display settings, reader parts, landing sections
scripts/                        sample generation, cache builder, browser tests
```
