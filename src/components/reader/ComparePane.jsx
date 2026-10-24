import { useEffect, useRef, useState } from 'react';
import { loadPdfjs, PDF_OPTIONS } from '../../lib/importers.js';

function PdfPages({ buffer, width }) {
  const holder = useRef(null);
  const run = useRef(0);
  const [status, setStatus] = useState('Rendering the original PDF…');
  useEffect(() => {
    if (!width) return;
    const token = ++run.current;
    const timer = setTimeout(async () => {
      try {
        const pdfjs = await loadPdfjs();
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer.slice(0)), ...PDF_OPTIONS }).promise;
        const canvases = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          if (token !== run.current) return;
          const page = await pdf.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const scale = Math.max(0.4, (width - 16) / base.width);
          const ratio = window.devicePixelRatio || 1;
          const viewport = page.getViewport({ scale: scale * ratio });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = `${viewport.width / ratio}px`;
          canvas.style.height = `${viewport.height / ratio}px`;
          canvas.className = 'mx-auto mb-4 block bg-white shadow-md';
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', `Original page ${i} of ${pdf.numPages}`);
          await page.render({ canvas, viewport }).promise;
          canvases.push(canvas);
        }
        if (token !== run.current || !holder.current) return;
        holder.current.replaceChildren(...canvases);
        setStatus('');
      } catch (e) {
        setStatus(`Couldn't render the original: ${e.message}`);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [buffer, width]);
  return (
    <>
      {status && <p className="spec p-4">{status}</p>}
      <div ref={holder} />
    </>
  );
}

export default function ComparePane({ doc, original, scrollRef, onScroll }) {
  const [width, setWidth] = useState(0);
  const box = useRef(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.round(el.clientWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <section aria-labelledby="orig-h" className="flex min-h-0 flex-col border-line-soft md:border-r-2">
      <h2 id="orig-h" className="spec border-b border-line-soft bg-surface px-4 py-2 text-ink">
        Before · original {doc.kind === 'pdf' ? 'PDF page' : 'text'}
      </h2>
      <div
        ref={(el) => {
          box.current = el;
          if (scrollRef) scrollRef.current = el;
        }}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto bg-surface-2 p-2"
        tabIndex={0}
        aria-label="Original document, scrolls with the Saral reader"
      >
        {original ? (
          <PdfPages buffer={original} width={width} />
        ) : (
          <div className="mx-auto max-w-none bg-white p-6 text-[13px] leading-[1.25] text-black" style={{ fontFamily: 'Times New Roman, serif' }}>
            {doc.sections.map((s) => (
              <div key={s.id}>
                <p className="font-bold">{s.heading}</p>
                {s.paragraphs.map((p) => (
                  <p key={p.id} className="mb-2 text-justify">
                    {p.text}
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
