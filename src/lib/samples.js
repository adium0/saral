import { importPdf, importDocx } from './importers.js';
import { saveDoc } from './storage.js';

export const SAMPLES = [
  {
    id: 'cell-structure',
    title: 'Cell Structure',
    file: '/samples/cell-structure.pdf',
    kind: 'pdf',
    blurb: 'A dense, textbook-style biology chapter in small print. The main demo document.',
    tag: 'Biology · PDF · 4 pages',
  },
  {
    id: 'operating-systems',
    title: 'Operating Systems',
    file: '/samples/operating-systems.pdf',
    kind: 'pdf',
    blurb: 'An encyclopedia-style computer science article full of jargon for the glossary.',
    tag: 'Computer science · PDF · 3 pages',
  },
  {
    id: 'cpu-scheduling',
    title: 'CPU Scheduling, Lecture Notes',
    file: '/samples/cpu-scheduling.docx',
    kind: 'docx',
    blurb: 'Lecture notes with headings, lists and technical terms.',
    tag: 'Operating systems · DOCX',
  },
];

export async function openSample(sample) {
  const res = await fetch(sample.file);
  if (!res.ok) throw new Error("Couldn't load the sample file.");
  const buffer = await res.arrayBuffer();
  const name = sample.file.split('/').pop();
  const doc = sample.kind === 'pdf' ? await importPdf(buffer, name) : await importDocx(buffer, name);
  doc.title = sample.title;
  doc.sampleId = sample.id;
  doc.id = `sample-${sample.id}`;
  await saveDoc(doc, sample.kind === 'pdf' ? buffer : null);
  return doc;
}
