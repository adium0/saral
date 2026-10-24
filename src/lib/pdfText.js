// Turns PDF.js text items into clean headings and paragraphs.
// Pure functions so they can be tested outside the browser.

// Group a page's text items into lines by their y position.
export function itemsToLines(items, pageHeight) {
  const rows = [];
  for (const it of items) {
    if (!it.str && !it.hasEOL) continue;
    const x = it.transform[4];
    const y = it.transform[5];
    const size = Math.abs(it.transform[3]) || it.height || 10;
    let row = rows.find((r) => Math.abs(r.y - y) < Math.max(2, size * 0.4));
    if (!row) {
      row = { y, items: [] };
      rows.push(row);
    }
    row.items.push({ x, str: it.str, size, width: it.width || 0, font: it.fontName || '' });
  }
  rows.sort((a, b) => b.y - a.y); // top of page first
  return rows
    .map((r) => {
      r.items.sort((a, b) => a.x - b.x);
      let text = '';
      let lastEnd = null;
      for (const it of r.items) {
        if (lastEnd !== null && it.x - lastEnd > it.size * 0.15 && !text.endsWith(' ') && !it.str.startsWith(' ')) text += ' ';
        text += it.str;
        lastEnd = it.x + it.width;
      }
      const chars = r.items.reduce((n, it) => n + it.str.length, 0) || 1;
      const size = r.items.reduce((n, it) => n + it.size * it.str.length, 0) / chars;
      const bold = r.items.some((it) => /bold|black|heavy|semibold/i.test(it.font));
      return {
        text: text.replace(/\s+/g, ' ').trim(),
        y: r.y,
        x: r.items[0]?.x || 0,
        right: lastEnd || 0,
        size,
        bold,
        relY: pageHeight ? r.y / pageHeight : 0.5,
      };
    })
    .filter((l) => l.text.length > 0);
}

const norm = (t) => t.toLowerCase().replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
const isPageNumber = (t) => /^(page\s*)?\d{1,4}(\s*(of|\/)\s*\d{1,4})?$/i.test(t.trim()) || /^[-–]\s*\d+\s*[-–]$/.test(t.trim());

// Remove running headers, footers and page numbers.
export function removeHeadersFooters(pages) {
  const counts = new Map();
  for (const lines of pages) {
    const seen = new Set();
    for (const l of lines) {
      if (l.relY > 0.9 || l.relY < 0.1) {
        const k = norm(l.text);
        if (!seen.has(k)) {
          seen.add(k);
          counts.set(k, (counts.get(k) || 0) + 1);
        }
      }
    }
  }
  const minRepeat = Math.max(2, Math.ceil(pages.length * 0.5));
  const sizes = pages.flat().map((l) => Math.round(l.size));
  const body = mode(sizes.length ? sizes : [10]);
  return pages.map((lines) =>
    lines.filter((l) => {
      const edge = l.relY > 0.9 || l.relY < 0.1;
      if (!edge) return true;
      if (isPageNumber(l.text)) return false;
      if (pages.length > 1 && (counts.get(norm(l.text)) || 0) >= minRepeat) return false;
      // Small print right at the page edge (running header or footer on a one-page file).
      if ((l.relY > 0.94 || l.relY < 0.06) && l.size < body * 0.9) return false;
      return true;
    }),
  );
}

function mode(values) {
  const m = new Map();
  for (const v of values) m.set(v, (m.get(v) || 0) + 1);
  let best = values[0];
  let n = 0;
  for (const [v, c] of m) if (c > n) [best, n] = [v, c];
  return best;
}

const BULLET = /^([•●▪◦‣∙·\-–*]|\d{1,2}[.)]|[a-z][.)])\s+/;

function joinLine(acc, next) {
  if (!acc) return next;
  // Rejoin a word hyphenated across lines: "compu-" + "ter" -> "computer".
  if (/[a-z]-$/.test(acc) && /^[a-z]/.test(next)) return acc.slice(0, -1) + next;
  return `${acc} ${next}`;
}

// Turn cleaned lines of all pages into heading and paragraph blocks.
export function linesToBlocks(pages) {
  const all = pages.flat();
  if (all.length === 0) return [];
  const bodySize = mode(all.map((l) => Math.round(l.size * 2) / 2));
  const lineGaps = [];
  for (const lines of pages) {
    for (let i = 1; i < lines.length; i++) {
      const g = lines[i - 1].y - lines[i].y;
      if (g > 0 && Math.abs(lines[i].size - bodySize) < 1) lineGaps.push(Math.round(g * 2) / 2);
    }
  }
  const normalGap = lineGaps.length ? mode(lineGaps) : bodySize * 1.2;
  const bodyLeft = mode(all.filter((l) => Math.abs(l.size - bodySize) < 1).map((l) => Math.round(l.x)));
  const bodyRight = Math.max(...all.filter((l) => Math.abs(l.size - bodySize) < 1).map((l) => l.right));

  const blocks = [];
  let para = null;
  const flush = () => {
    if (para && para.text.trim()) blocks.push(para);
    para = null;
  };

  for (const lines of pages) {
    let prev = null;
    for (const l of lines) {
      const bigger = l.size >= bodySize * 1.15;
      const short = l.text.length < 120 && !/[.,;:]$/.test(l.text);
      const isHeading = (bigger && short) || (l.bold && short && l.text.length < 80 && Math.abs(l.size - bodySize) < 1 && !BULLET.test(l.text) && (!prev || prev.y - l.y > normalGap * 1.3));
      if (isHeading) {
        // Join a multi-line heading.
        const last = blocks[blocks.length - 1];
        if (!para && last && last.type === 'heading' && prev && Math.abs(prev.size - l.size) < 0.5 && prev.y - l.y < l.size * 1.8) {
          last.text = `${last.text} ${l.text}`;
        } else {
          flush();
          const level = l.size >= bodySize * 1.6 ? 1 : l.size >= bodySize * 1.15 ? 2 : 3;
          blocks.push({ type: 'heading', level, text: l.text });
        }
        prev = l;
        continue;
      }
      const bullet = BULLET.exec(l.text);
      const gap = prev ? prev.y - l.y : 0;
      const bigGap = prev && gap > normalGap * 1.45;
      const indented = Math.round(l.x) - bodyLeft > bodySize * 0.8 && !bullet;
      const prevShort = prev && para && prev.right < bodyRight - bodySize * 4 && /[.!?:"”)]$/.test(prev.text);
      if (bullet) {
        flush();
        para = { type: 'paragraph', text: l.text.slice(bullet[0].length), list: /\d/.test(bullet[1]) ? 'number' : 'bullet' };
      } else if (!para || bigGap || (indented && prev && /[.!?:"”)]$/.test(prev.text)) || (prevShort && !para.list)) {
        flush();
        para = { type: 'paragraph', text: l.text };
      } else {
        para.text = joinLine(para.text, l.text);
      }
      prev = l;
    }
    // A paragraph can continue onto the next page, so only flush when the page ended a sentence.
    if (para && /[.!?:"”)]$/.test(para.text)) flush();
  }
  flush();
  return blocks;
}
