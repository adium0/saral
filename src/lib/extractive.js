// Offline fallback: pick the most informative sentences, no AI involved.

const STOP = new Set(
  'a an the and or but if of to in on at by for with from as is are was were be been being this that these those it its into than then so such not no can may will would should could has have had do does did which who whom what when where why how also each other more most some any all both their there they them we you he she his her our your i'.split(
    ' ',
  ),
);

export function extractiveSummary(sentences, count = 5) {
  const clean = sentences.map((s) => s.trim()).filter((s) => s.split(/\s+/).length >= 5);
  if (clean.length <= count) return clean;
  const freq = new Map();
  const tokens = clean.map((s) => (s.toLowerCase().match(/[a-z][a-z-]+/g) || []).filter((w) => !STOP.has(w)));
  for (const t of tokens) for (const w of t) freq.set(w, (freq.get(w) || 0) + 1);
  const scored = clean.map((s, i) => {
    const t = tokens[i];
    const score = t.reduce((n, w) => n + (freq.get(w) || 0), 0) / Math.sqrt(t.length + 1) + (i === 0 ? 2 : 0);
    return { s, i, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.s);
}
