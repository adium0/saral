// Builds public/samples/cache/*.json from the reviewed sample outputs.
import fs from 'node:fs';
import mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { itemsToLines, removeHeadersFooters, linesToBlocks } from '../src/lib/pdfText.js';
import { buildDocument, allParagraphs, hashText } from '../src/lib/docModel.js';
import { JSDOM } from 'jsdom';

const C = JSON.parse(fs.readFileSync('scripts/cache_content.json', 'utf8'));

async function pdfDoc(file) {
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)), verbosity: 0 }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    pages.push(itemsToLines((await page.getTextContent()).items, vp.height));
  }
  const blocks = linesToBlocks(removeHeadersFooters(pages));
  let title = 'x';
  if (blocks[0]?.type === 'heading' && blocks[0].level === 1) title = blocks.shift().text;
  return buildDocument({ title, blocks });
}

async function docxDoc(file) {
  const { value } = await mammoth.convertToHtml({ path: file });
  const dom = new JSDOM(value).window.document;
  const blocks = [];
  for (const node of dom.body.children) {
    const tag = node.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) blocks.push({ type: 'heading', level: Math.min(Number(tag[1]), 3), text: node.textContent });
    else if (tag === 'p') blocks.push({ type: 'paragraph', text: node.textContent });
    else if (tag === 'ul' || tag === 'ol') for (const li of node.children) blocks.push({ type: 'paragraph', text: li.textContent, list: 'bullet' });
  }
  return buildDocument({ title: 'CPU Scheduling', blocks });
}

function sectionPids(section) {
  let n = 0;
  const pids = [];
  for (const p of section.paragraphs) {
    if (n + p.text.length > 6000 && pids.length) break;
    pids.push(p.id);
    n += p.text.length;
  }
  return pids;
}
function docPids(doc) {
  const out = [];
  let n = 0;
  for (const p of allParagraphs(doc)) {
    if (n + p.text.length > 8000) break;
    out.push(p.id);
    n += p.text.length;
  }
  return out;
}

function build(doc, simple, summaries, docSummary, glossary) {
  const paras = allParagraphs(doc);
  if (paras.length !== simple.length) throw new Error(`paragraph count ${paras.length} != ${simple.length}`);
  const sections = doc.sections.filter((s) => s.paragraphs.length);
  if (sections.length !== summaries.length) throw new Error(`section count ${sections.length} != ${summaries.length}`);
  const byId = new Map(paras.map((p) => [p.id, p]));
  const joined = (pids) => hashText(pids.map((id) => byId.get(id).text).join(' '));
  const out = { simplified: {}, summaries: {}, glossary: [] };
  paras.forEach((p, i) => (out.simplified[hashText(p.text)] = simple[i]));
  sections.forEach((s, i) => (out.summaries[joined(sectionPids(s))] = summaries[i]));
  out.summaries[joined(docPids(doc))] = docSummary;
  for (const [term, definition, idx] of glossary) {
    const p = paras[idx];
    if (!new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(p.text)) throw new Error(`term "${term}" not in paragraph ${idx}`);
    out.glossary.push({ term, definition, source_hash: hashText(p.text) });
  }
  return out;
}

const jobs = [
  ['cell-structure', await pdfDoc('public/samples/cell-structure.pdf'), C.CELL_SIMPLE, C.CELL_SUMMARIES, C.CELL_DOC_SUMMARY, C.CELL_GLOSSARY],
  ['operating-systems', await pdfDoc('public/samples/operating-systems.pdf'), C.OS_SIMPLE, C.OS_SUMMARIES, C.OS_DOC_SUMMARY, C.OS_GLOSSARY],
  ['cpu-scheduling', await docxDoc('public/samples/cpu-scheduling.docx'), C.CPU_SIMPLE, C.CPU_SUMMARIES, C.CPU_DOC_SUMMARY, C.CPU_GLOSSARY],
];
fs.mkdirSync('public/samples/cache', { recursive: true });
for (const [id, doc, ...rest] of jobs) {
  const out = build(doc, ...rest);
  fs.writeFileSync(`public/samples/cache/${id}.json`, JSON.stringify(out, null, 1));
  console.log(id, Object.keys(out.simplified).length, 'paragraphs,', Object.keys(out.summaries).length, 'summaries,', out.glossary.length, 'terms');
}
