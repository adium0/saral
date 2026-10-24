import { findParagraph, hashText } from './docModel.js';
import { extractiveSummary } from './extractive.js';

const TIMEOUT_MS = 25000;
const cacheFiles = new Map();

async function loadSampleCache(sampleId) {
  if (!sampleId) return null;
  if (!cacheFiles.has(sampleId)) {
    cacheFiles.set(
      sampleId,
      fetch(`/samples/cache/${sampleId}.json`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    );
  }
  return cacheFiles.get(sampleId);
}

export function parseJson(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let s = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first === -1 || last === -1) return null;
  s = s.slice(first, last + 1);
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// Keeps only output tied to paragraphs we actually sent. Returns null when the output is unusable.
export function validate(action, data, ids) {
  if (!data || typeof data !== 'object') return null;
  const ok = (id) => typeof id === 'string' && ids.has(id);
  if (action === 'translate') {
    const translated = (Array.isArray(data.translated) ? data.translated : []).filter((x) => ok(x?.source_id) && typeof x.text === 'string');
    return translated.length ? { translated } : null;
  }
  const simplified = (Array.isArray(data.simplified) ? data.simplified : []).filter(
    (x) => ok(x?.source_id) && typeof x.text === 'string' && x.text.trim(),
  );
  const summary = (Array.isArray(data.summary) ? data.summary : []).filter((x) => typeof x === 'string').slice(0, 5);
  const glossary = (Array.isArray(data.glossary) ? data.glossary : [])
    .filter((g) => g && typeof g.term === 'string' && typeof g.definition === 'string' && ok(g.source_id))
    .slice(0, 15);
  if (action === 'summary' && summary.length === 0) return null;
  if ((action === 'simplify' || action === 'explain') && simplified.length === 0) return null;
  return { simplified, summary, glossary };
}

async function callApi(body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || `AI request failed (${res.status})`);
      err.code = data.error || 'http';
      throw err;
    }
    return data.raw;
  } catch (e) {
    if (e.name === 'AbortError') {
      const err = new Error('The AI took too long to answer.');
      err.code = 'timeout';
      throw err;
    }
    if (!e.code) e.code = 'network';
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function fromCache(cache, action, paragraphs, lang) {
  if (!cache) return null;
  if (action === 'translate') {
    const table = cache.translated?.[lang];
    if (!table) return null;
    const translated = paragraphs.map((p) => ({ source_id: p.id, text: table[hashText(p.text)] })).filter((x) => x.text);
    return translated.length === paragraphs.length ? { translated } : null;
  }
  const key = action === 'explain' ? 'explained' : 'simplified';
  const table = cache[key] || cache.simplified;
  const simplified = paragraphs.map((p) => ({ source_id: p.id, text: table?.[hashText(p.text)] })).filter((x) => x.text);
  if (action !== 'summary' && simplified.length !== paragraphs.length) return null;
  const hashes = new Map(paragraphs.map((p) => [hashText(p.text), p.id]));
  const glossary = (cache.glossary || [])
    .filter((g) => hashes.has(g.source_hash))
    .map((g) => ({ term: g.term, definition: g.definition, source_id: hashes.get(g.source_hash) }));
  const sumKey = hashText(paragraphs.map((p) => p.text).join(' '));
  const summary = cache.summaries?.[sumKey] || null;
  if (action === 'summary' && !summary) return null;
  return { simplified: action === 'summary' ? [] : simplified, summary: summary || [], glossary };
}

function extractiveFallback(paragraphs) {
  const sentences = paragraphs.flatMap((p) => p.sentences.map((s) => p.text.slice(s.start, s.end)));
  return { simplified: [], summary: extractiveSummary(sentences, 5), glossary: [] };
}

const FALLBACK_NOTICE = {
  no_key: 'AI is not set up on this server yet, so Saral picked the key sentences instead.',
  timeout: 'The AI took too long, so Saral picked the key sentences instead.',
  network: "Couldn't reach the AI (check the internet), so Saral picked the key sentences instead.",
  rate_limited: 'The AI is busy right now, so Saral picked the key sentences instead.',
};

/**
 * Runs an AI action on some paragraphs of a document.
 * Returns { simplified, summary, glossary, translated?, source: 'ai'|'cache'|'extractive', notice? }
 */
export async function runAi({ doc, action, pids, grade = 7, lang = 'hi', texts = null }) {
  const paragraphs = pids
    .map((id) => {
      const p = findParagraph(doc, id);
      return p && texts?.[id] ? { ...p, text: texts[id] } : p;
    })
    .filter(Boolean);
  if (paragraphs.length === 0) throw new Error('Nothing selected.');
  const ids = new Set(paragraphs.map((p) => p.id));

  // Samples ship with reviewed, cached AI output so the demo works on bad Wi-Fi.
  const cache = await loadSampleCache(doc.sampleId);
  const cached = fromCache(cache, action, paragraphs, lang);
  if (cached) return { ...cached, source: 'cache' };

  const body = { action, grade, lang, paragraphs: paragraphs.map((p) => ({ id: p.id, text: p.text })) };
  let lastErr = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callApi(body);
      const out = validate(action, parseJson(raw), ids);
      if (out) return { ...out, source: 'ai' };
      lastErr = Object.assign(new Error('The AI gave an answer Saral could not read.'), { code: 'malformed' });
    } catch (e) {
      lastErr = e;
      if (e.code !== 'malformed' && e.code !== 'upstream') break; // only retry bad output
    }
  }
  if (action === 'translate') throw lastErr;
  if (lastErr?.code === 'malformed' || lastErr?.code === 'too_long') throw lastErr;
  return {
    ...extractiveFallback(paragraphs),
    source: 'extractive',
    notice: FALLBACK_NOTICE[lastErr?.code] || FALLBACK_NOTICE.network,
  };
}
