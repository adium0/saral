import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileUp, FileText, Trash2, ArrowRight, ClipboardPaste, Loader2, AlertCircle } from 'lucide-react';
import { Page, btn, SpecLabel } from '../components/Shell.jsx';
import { importFile, importText, ImportError } from '../lib/importers.js';
import { saveDoc, listDocs, deleteDoc, loadDoc } from '../lib/storage.js';
import { SAMPLES, openSample } from '../lib/samples.js';
import { announce } from '../store/announce.js';

export default function Library() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [paste, setPaste] = useState('');
  const [recent, setRecent] = useState([]);

  const refresh = () => listDocs().then(setRecent).catch(() => setRecent([]));
  useEffect(() => {
    refresh();
  }, []);

  async function open(doc, t0) {
    const ms = Math.round(performance.now() - t0);
    sessionStorage.setItem('saral-last-import-ms', String(ms));
    announce(`Opened ${doc.title} in ${(ms / 1000).toFixed(1)} seconds`);
    navigate(`/read/${doc.id}`);
  }

  async function handleFiles(files) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    setBusy(`Reading ${file.name}…`);
    announce(`Importing ${file.name}`);
    const t0 = performance.now();
    try {
      const { doc, original } = await importFile(file);
      if (doc.sections.every((s) => s.paragraphs.length === 0)) throw new ImportError('empty', 'Saral found no text in this file.');
      await saveDoc(doc, original);
      await open(doc, t0);
    } catch (e) {
      const msg = e instanceof ImportError ? e.message : `Saral couldn't read this file. ${e.message || ''}`.trim();
      setError(msg);
      announce(msg);
      setBusy(null);
    }
  }

  async function handlePaste(e) {
    e.preventDefault();
    if (!paste.trim()) {
      setError('Paste some text first.');
      return;
    }
    const t0 = performance.now();
    const doc = importText(paste);
    await saveDoc(doc);
    await open(doc, t0);
  }

  async function handleSample(sample) {
    setError(null);
    setBusy(`Opening ${sample.title}…`);
    const t0 = performance.now();
    try {
      const existing = await loadDoc(`sample-${sample.id}`);
      const doc = existing || (await openSample(sample));
      await open(doc, t0);
    } catch (e) {
      setError(e.message);
      setBusy(null);
    }
  }

  async function remove(id, title) {
    await deleteDoc(id);
    announce(`Removed ${title}`);
    refresh();
  }

  return (
    <Page>
      <SpecLabel>F1 / Library</SpecLabel>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Your library</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Add a PDF, Word file or notes. Everything stays in this browser. Only a passage you choose to simplify is sent to the AI.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section aria-labelledby="upload-h">
          <h2 id="upload-h" className="sr-only">
            Upload a file
          </h2>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={`flex min-h-64 flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-8 text-center transition ${
              drag ? 'scale-[1.01] border-accent-ink bg-surface-2' : 'border-line bg-surface'
            }`}
          >
            {busy ? (
              <p className="flex items-center gap-2 text-lg font-bold" role="status">
                <Loader2 className="animate-spin" aria-hidden="true" /> {busy}
              </p>
            ) : (
              <>
                <FileUp className="size-10" aria-hidden="true" />
                <p className="text-lg">
                  <strong>Drop a file here</strong> or choose one.
                </p>
                <button type="button" className={btn.primary} onClick={() => inputRef.current?.click()}>
                  Choose file
                </button>
                <p className="spec">PDF · DOCX · TXT · MD · up to 20 MB</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>
          {error && (
            <p role="alert" className="mt-4 flex items-start gap-2 rounded-2xl border-2 border-accent-ink p-4 font-bold">
              <AlertCircle className="mt-0.5 shrink-0" aria-hidden="true" /> {error}
            </p>
          )}
        </section>

        <section aria-labelledby="paste-h" className="rounded-3xl border border-line-soft bg-surface p-6">
          <h2 id="paste-h" className="flex items-center gap-2 text-xl font-bold">
            <ClipboardPaste aria-hidden="true" /> Paste text
          </h2>
          <form onSubmit={handlePaste} className="mt-3 grid gap-3">
            <label htmlFor="paste" className="text-muted">
              Notes, an email from your teacher, or a page you copied.
            </label>
            <textarea
              id="paste"
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              rows={7}
              className="w-full rounded-2xl border-2 border-line bg-bg p-3 text-ink"
            />
            <button type="submit" className={btn.secondary}>
              Open in reader <ArrowRight aria-hidden="true" className="size-5" />
            </button>
          </form>
        </section>
      </div>

      <section aria-labelledby="samples-h" className="mt-14">
        <h2 id="samples-h" className="font-display text-2xl font-semibold">
          Try a sample
        </h2>
        <ul className="mt-4 grid gap-4 md:grid-cols-3">
          {SAMPLES.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => handleSample(s)}
                disabled={Boolean(busy)}
                className="group flex h-full w-full flex-col rounded-3xl border border-line-soft bg-surface p-5 text-left transition hover:-translate-y-1 hover:border-ink hover:shadow-[0_8px_0_var(--ink)]"
              >
                <span className="spec">0{i + 1} / {s.tag}</span>
                <span className="mt-3 text-xl font-bold">{s.title}</span>
                <span className="mt-2 text-muted">{s.blurb}</span>
                <span className="mt-auto flex items-center gap-1 pt-4 font-bold">
                  Open <ArrowRight aria-hidden="true" className="size-5 transition group-hover:translate-x-1" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="recent-h" className="mt-14">
        <h2 id="recent-h" className="font-display text-2xl font-semibold">
          Recent files
        </h2>
        {recent.length === 0 ? (
          <p className="mt-3 text-muted">Nothing yet. Files you open appear here, on this device only.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line-soft rounded-3xl border border-line-soft">
            {recent.map((d) => (
              <li key={d.id} className="flex items-center gap-3 p-3 pl-5">
                <FileText aria-hidden="true" className="shrink-0" />
                <Link to={`/read/${d.id}`} className="min-w-0 flex-1 py-2 font-bold underline-offset-4 hover:underline">
                  <span className="block truncate">{d.title}</span>
                  <span className="spec block truncate font-normal">
                    {d.kind} · {new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </Link>
                <button type="button" className={btn.icon} onClick={() => remove(d.id, d.title)}>
                  <Trash2 aria-hidden="true" className="size-5" />
                  <span className="sr-only">Remove {d.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Page>
  );
}
