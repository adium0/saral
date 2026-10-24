// The document model shared by every feature: sections > paragraphs > sentences, with stable IDs.
// Paragraph IDs look like "p12" and sentence IDs like "p12.s3".

const segmenter =
  typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('en', { granularity: 'sentence' }) : null;

// Common abbreviations that end with a dot but do not end a sentence.
const ABBREV = /\b(e\.g|i\.e|etc|vs|Dr|Mr|Mrs|Ms|Prof|Fig|fig|No|approx|cf|al)\.\s*$/;

export function splitSentences(text) {
  const out = [];
  if (segmenter) {
    for (const seg of segmenter.segment(text)) {
      out.push({ start: seg.index, end: seg.index + seg.segment.length });
    }
  } else {
    const re = /[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g;
    let m;
    while ((m = re.exec(text))) out.push({ start: m.index, end: m.index + m[0].length });
  }
  // Merge pieces that were split after an abbreviation.
  const merged = [];
  for (const s of out) {
    const prev = merged[merged.length - 1];
    if (prev && ABBREV.test(text.slice(prev.start, prev.end))) prev.end = s.end;
    else merged.push({ ...s });
  }
  // Trim trailing whitespace from each range.
  return merged
    .map((s) => {
      let end = s.end;
      while (end > s.start && /\s/.test(text[end - 1])) end--;
      let start = s.start;
      while (start < end && /\s/.test(text[start])) start++;
      return { start, end };
    })
    .filter((s) => s.end > s.start);
}

export function slugify(s) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'doc'
  );
}

// blocks: [{type:'heading', level, text} | {type:'paragraph', text, list?:'bullet'|'number'}]
export function buildDocument({ title, source, blocks, kind }) {
  const sections = [];
  let current = null;
  let pCount = 0;
  const startSection = (heading, level = 1) => {
    current = { id: `s${sections.length + 1}`, heading, level, paragraphs: [] };
    sections.push(current);
  };
  for (const b of blocks) {
    const text = (b.text || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    if (b.type === 'heading') {
      startSection(text, b.level || 1);
      continue;
    }
    if (!current) startSection(title || 'Introduction', 1);
    pCount += 1;
    const id = `p${pCount}`;
    const sentences = splitSentences(text).map((r, i) => ({ id: `${id}.s${i + 1}`, ...r }));
    current.paragraphs.push({ id, text, list: b.list || null, sentences });
  }
  // Drop empty sections that only had a heading, but keep their heading as a paragraph-less outline entry.
  const id = `doc-${slugify(title || source || 'document')}-${Date.now().toString(36)}`;
  return {
    id,
    title: title || source || 'Untitled document',
    source: source || 'pasted text',
    kind: kind || 'text',
    createdAt: Date.now(),
    sections,
    simplified: {},
    summaries: {},
    translated: {},
    glossary: [],
  };
}

export function allParagraphs(doc) {
  return doc.sections.flatMap((s) => s.paragraphs);
}

export function sentenceList(doc) {
  const list = [];
  for (const s of doc.sections) {
    for (const p of s.paragraphs) {
      for (const sen of p.sentences) list.push({ id: sen.id, pid: p.id, text: p.text.slice(sen.start, sen.end) });
    }
  }
  return list;
}

export function findParagraph(doc, pid) {
  for (const s of doc.sections) for (const p of s.paragraphs) if (p.id === pid) return p;
  return null;
}

export function docWordCount(doc) {
  return allParagraphs(doc).reduce((n, p) => n + p.text.split(/\s+/).filter(Boolean).length, 0);
}

// Cheap stable hash for caching AI output by paragraph text.
export function hashText(text) {
  const s = text.replace(/\s+/g, ' ').trim().toLowerCase();
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}
