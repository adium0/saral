// Documents stay in the browser (IndexedDB). Nothing is uploaded except the passage sent to the AI.
import { get, set, del, keys, createStore } from 'idb-keyval';

const docStore = createStore('saral-docs', 'docs');
const fileStore = createStore('saral-files', 'files');

export async function saveDoc(doc, original) {
  await set(doc.id, doc, docStore);
  if (original) await set(doc.id, original, fileStore);
}

export async function loadDoc(id) {
  return get(id, docStore);
}

export async function loadOriginal(id) {
  return get(id, fileStore);
}

export async function deleteDoc(id) {
  await del(id, docStore);
  await del(id, fileStore);
}

export async function listDocs() {
  const ids = await keys(docStore);
  const docs = await Promise.all(ids.map((id) => get(id, docStore)));
  return docs
    .filter(Boolean)
    .map((d) => ({ id: d.id, title: d.title, source: d.source, kind: d.kind, createdAt: d.createdAt, sampleId: d.sampleId }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

// Local log of "Report a problem" clicks: paragraph ID, action and time.
export function logReport(entry) {
  try {
    const list = JSON.parse(localStorage.getItem('saral-reports') || '[]');
    list.push({ ...entry, at: new Date().toISOString() });
    localStorage.setItem('saral-reports', JSON.stringify(list.slice(-200)));
  } catch {
    /* storage may be blocked */
  }
  console.info('[Saral] Problem reported', entry);
}

export function getReports() {
  try {
    return JSON.parse(localStorage.getItem('saral-reports') || '[]');
  } catch {
    return [];
  }
}
