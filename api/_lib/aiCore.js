// Shared AI handler used by the Vercel function, the Netlify function and the Vite dev server.
// The API key lives only here, on the server. The browser never sees it.

const MAX_CHARS = 12000;
const RATE_LIMIT = 30; // requests per IP per 10 minutes
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map();

export function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  return list.length > RATE_LIMIT;
}

const LANG_NAMES = { hi: 'Hindi', ta: 'Tamil' };

function passage(paragraphs) {
  return paragraphs.map((p) => `[${p.id}] ${p.text}`).join('\n');
}

export function buildPrompt({ action, paragraphs, grade = 7, lang }) {
  const text = passage(paragraphs);
  if (action === 'translate') {
    const name = LANG_NAMES[lang] || 'Hindi';
    return `You translate study material into simple ${name} for students.
Rules:
- Translate each passage faithfully. Add no facts, examples or numbers.
- Keep numbers, names and formulas unchanged. Keep English technical terms in brackets after the ${name} word.
Return JSON only:
{"translated": [{"source_id": "p12", "text": "..."}]}

Passage:
${text}`;
  }
  const explain =
    action === 'explain'
      ? `- The reader is completely new to this subject. Explain each idea in everyday words, as if to a curious 12-year-old, but still add no new facts.\n`
      : '';
  return `You rewrite study material for students with reading difficulties.
Rules:
- Use only facts in the passage. Add no examples, numbers or claims.
- Keep every number, name, formula and technical term; explain terms in brackets.
- Sentences of 15 words or fewer. Target reading grade: ${action === 'explain' ? 5 : grade}.
- If a sentence cannot be simplified safely, copy it unchanged.
${explain}- "summary" has at most 5 short bullet points covering the whole passage.
- "glossary" has 5 to 15 hard terms from the passage with plain definitions based on the passage.
Return JSON only:
{"simplified": [{"source_id": "p12", "text": "..."}],
 "summary": ["..."],
 "glossary": [{"term": "...", "definition": "...", "source_id": "p12"}]}

Passage:
${text}`;
}

async function callGemini(prompt, key, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) throw Object.assign(new Error(`Gemini error ${res.status}`), { status: res.status });
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
}

async function callOpenAICompatible(prompt, key, model, baseUrl) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw Object.assign(new Error(`LLM error ${res.status}`), { status: res.status });
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

export function providerFromEnv(env) {
  if (env.GEMINI_API_KEY) return { name: 'gemini', key: env.GEMINI_API_KEY, model: env.AI_MODEL || 'gemini-2.5-flash' };
  if (env.GROQ_API_KEY)
    return { name: 'groq', key: env.GROQ_API_KEY, model: env.AI_MODEL || 'llama-3.3-70b-versatile', baseUrl: 'https://api.groq.com/openai/v1' };
  if (env.OPENAI_COMPAT_API_KEY && env.OPENAI_COMPAT_BASE_URL)
    return { name: 'compat', key: env.OPENAI_COMPAT_API_KEY, model: env.AI_MODEL, baseUrl: env.OPENAI_COMPAT_BASE_URL };
  return null;
}

// Returns { status, body }.
export async function handleAi(body, env) {
  const provider = providerFromEnv(env);
  if (!provider) return { status: 503, body: { error: 'no_key', message: 'No AI key is set on the server.' } };

  const { action, paragraphs, grade, lang } = body || {};
  if (!['simplify', 'summary', 'explain', 'translate'].includes(action))
    return { status: 400, body: { error: 'bad_action' } };
  if (!Array.isArray(paragraphs) || paragraphs.length === 0)
    return { status: 400, body: { error: 'no_text' } };
  const clean = paragraphs
    .filter((p) => p && typeof p.id === 'string' && typeof p.text === 'string')
    .map((p) => ({ id: p.id.slice(0, 20), text: p.text }));
  const total = clean.reduce((n, p) => n + p.text.length, 0);
  if (total > MAX_CHARS) return { status: 413, body: { error: 'too_long', message: 'Select a shorter passage.' } };

  const prompt = buildPrompt({ action, paragraphs: clean, grade: Number(grade) || 7, lang });
  try {
    const raw =
      provider.name === 'gemini'
        ? await callGemini(prompt, provider.key, provider.model)
        : await callOpenAICompatible(prompt, provider.key, provider.model, provider.baseUrl);
    return { status: 200, body: { raw, provider: provider.name } };
  } catch (err) {
    const status = err.status === 429 ? 429 : 502;
    return { status, body: { error: status === 429 ? 'rate_limited' : 'upstream', message: err.message } };
  }
}
