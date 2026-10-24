import { buildDocument } from './docModel.js';
import { itemsToLines, removeHeadersFooters, linesToBlocks } from './pdfText.js';

export const MAX_BYTES = 20 * 1024 * 1024;

export class ImportError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

let pdfjsPromise = null;
export const PDF_OPTIONS = {
  standardFontDataUrl: '/pdfjs/standard_fonts/',
  cMapUrl: '/pdfjs/cmaps/',
  cMapPacked: true,
  wasmUrl: '/pdfjs/wasm/',
};

export function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]).then(
      ([pdfjs, worker]) => {
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        return pdfjs;
      },
    );
  }
  return pdfjsPromise;
}

function titleFromName(name) {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function importPdf(buffer, name) {
  const pdfjs = await loadPdfjs();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer.slice(0)), ...PDF_OPTIONS }).promise;
  const pages = [];
  let chars = 0;
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const lines = itemsToLines(content.items, viewport.height);
    chars += lines.reduce((n, l) => n + l.text.length, 0);
    pages.push(lines);
  }
  if (chars < 20 * pdf.numPages) {
    throw new ImportError('scanned', "This PDF is a scanned image, so its text can't be read yet.");
  }
  const blocks = linesToBlocks(removeHeadersFooters(pages));
  let title = titleFromName(name);
  if (blocks[0]?.type === 'heading' && blocks[0].level === 1) title = blocks.shift().text;
  try {
    const meta = await pdf.getMetadata();
    if (title === titleFromName(name) && meta?.info?.Title && meta.info.Title.length > 3) title = meta.info.Title;
  } catch {
    /* metadata is optional */
  }
  const doc = buildDocument({ title, source: name, blocks, kind: 'pdf' });
  doc.pageCount = pdf.numPages;
  return doc;
}

export async function importDocx(buffer, name) {
  const mammoth = await import('mammoth');
  const result = await (mammoth.default || mammoth).convertToHtml({ arrayBuffer: buffer });
  const dom = new DOMParser().parseFromString(result.value, 'text/html');
  const blocks = [];
  let title = null;
  const walk = (el) => {
    for (const node of el.children) {
      const tag = node.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) {
        const level = Number(tag[1]);
        if (!title && level === 1) title = node.textContent.trim();
        blocks.push({ type: 'heading', level: Math.min(level, 3), text: node.textContent });
      } else if (tag === 'p') {
        blocks.push({ type: 'paragraph', text: node.textContent });
      } else if (tag === 'ul' || tag === 'ol') {
        for (const li of node.children) {
          // Nested lists are flattened into separate items.
          const own = [...li.childNodes].filter((c) => !(c.tagName && /^(ul|ol)$/i.test(c.tagName)));
          blocks.push({ type: 'paragraph', text: own.map((c) => c.textContent).join(''), list: tag === 'ol' ? 'number' : 'bullet' });
          for (const sub of li.querySelectorAll(':scope > ul, :scope > ol')) walk({ children: [sub] });
        }
      } else if (tag === 'table') {
        for (const row of node.querySelectorAll('tr')) {
          blocks.push({ type: 'paragraph', text: [...row.children].map((c) => c.textContent.trim()).join(' | ') });
        }
      } else if (node.children.length) {
        walk(node);
      } else if (node.textContent.trim()) {
        blocks.push({ type: 'paragraph', text: node.textContent });
      }
    }
  };
  walk(dom.body);
  return buildDocument({ title: title || titleFromName(name), source: name, blocks, kind: 'docx' });
}

// Plain text or Markdown. Blank lines separate paragraphs; "#" lines are headings.
export function textToBlocks(text) {
  const blocks = [];
  const chunks = text.replace(/\r\n?/g, '\n').split(/\n\s*\n/);
  for (const chunk of chunks) {
    const lines = chunk.split('\n').filter((l) => l.trim());
    let buf = '';
    const flush = () => {
      if (buf.trim()) blocks.push({ type: 'paragraph', text: buf });
      buf = '';
    };
    for (const line of lines) {
      const h = /^(#{1,6})\s+(.*)$/.exec(line.trim());
      const li = /^\s*([-*+•]|\d+[.)])\s+(.*)$/.exec(line);
      if (h) {
        flush();
        blocks.push({ type: 'heading', level: Math.min(h[1].length, 3), text: h[2] });
      } else if (li) {
        flush();
        blocks.push({ type: 'paragraph', text: li[2], list: /\d/.test(li[1]) ? 'number' : 'bullet' });
      } else {
        buf = buf ? (/[a-z]-$/.test(buf) ? buf.slice(0, -1) + line.trim() : `${buf} ${line.trim()}`) : line.trim();
      }
    }
    flush();
  }
  // Strip simple Markdown emphasis so it is read as plain text.
  return blocks.map((b) => ({ ...b, text: b.text.replace(/(\*\*|__|\*|_|`)(.+?)\1/g, '$2').replace(/\[(.+?)\]\((.+?)\)/g, '$1') }));
}

export function importText(text, name = 'Pasted text') {
  const blocks = textToBlocks(text);
  let title;
  if (blocks[0]?.type === 'heading') title = blocks[0].text;
  else if (name === 'Pasted text') title = `Pasted text, ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
  else title = titleFromName(name);
  return buildDocument({ title, source: name, blocks, kind: 'text' });
}

export async function importFile(file) {
  if (file.size > MAX_BYTES) throw new ImportError('too_big', 'This file is larger than 20 MB. Try a smaller file.');
  const name = file.name;
  const ext = name.split('.').pop().toLowerCase();
  const buffer = await file.arrayBuffer();
  if (ext === 'pdf' || file.type === 'application/pdf') {
    const doc = await importPdf(buffer, name);
    return { doc, original: buffer };
  }
  if (ext === 'docx') {
    const doc = await importDocx(buffer, name);
    return { doc, original: null };
  }
  if (ext === 'txt' || ext === 'md' || file.type.startsWith('text/')) {
    const text = new TextDecoder().decode(buffer);
    return { doc: importText(text, name), original: null };
  }
  throw new ImportError('type', 'Saral reads PDF, DOCX, TXT and MD files. Try one of those, or paste the text.');
}
