import fs from 'node:fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { itemsToLines, removeHeadersFooters, linesToBlocks } from '../src/lib/pdfText.js';
import { buildDocument } from '../src/lib/docModel.js';
const file = process.argv[2];
const t0 = performance.now();
const data = new Uint8Array(fs.readFileSync(file));
const pdf = await pdfjs.getDocument({ data }).promise;
const pages = [];
let chars = 0;
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const vp = page.getViewport({ scale: 1 });
  const c = await page.getTextContent();
  const lines = itemsToLines(c.items, vp.height);
  chars += lines.reduce((n, l) => n + l.text.length, 0);
  pages.push(lines);
}
console.log('pages', pdf.numPages, 'chars', chars, chars < 20 * pdf.numPages ? 'SCANNED' : '');
const blocks = linesToBlocks(removeHeadersFooters(pages));
const doc = buildDocument({ title: 'x', blocks });
console.log('ms', Math.round(performance.now() - t0));
for (const s of doc.sections) {
  console.log('## ' + s.heading);
  for (const p of s.paragraphs) console.log(`  [${p.id}] (${p.sentences.length}s) ${p.text.slice(0, 90)} … ${p.text.slice(-40)}`);
}
