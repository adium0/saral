import { memo, useId, useState } from 'react';

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildTermRegex(glossary) {
  const terms = [...new Set(glossary.map((g) => g.term.trim()).filter((t) => t.length > 2))].sort((a, b) => b.length - a.length);
  if (!terms.length) return null;
  return new RegExp(`\\b(${terms.map(escapeRe).join('|')})\\b`, 'gi');
}

// A glossary term: definition shows on hover, keyboard focus or tap. Escape hides it.
function Term({ text, definition }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const shown = open || hover;
  return (
    <span className="relative inline" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button
        type="button"
        className="term"
        aria-describedby={id}
        aria-expanded={shown}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
            setHover(false);
          }
        }}
      >
        {text}
      </button>
      <span
        id={id}
        role="tooltip"
        className={`absolute bottom-full left-0 z-30 mb-2 w-[min(22rem,80vw)] rounded-2xl border-2 border-ink bg-bg p-3 text-base leading-snug text-ink shadow-lg ${
          shown ? 'block' : 'hidden'
        }`}
        style={{ fontFamily: 'var(--font-body)', letterSpacing: 0, wordSpacing: 0 }}
      >
        <strong className="block">{text}</strong>
        {definition}
      </span>
    </span>
  );
}

function renderWithTerms(text, termRe, defs, used, keyBase) {
  if (!termRe) return text;
  const out = [];
  let last = 0;
  termRe.lastIndex = 0;
  let m;
  while ((m = termRe.exec(text))) {
    const key = m[0].toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<Term key={`${keyBase}-${m.index}`} text={m[0]} definition={defs.get(key)} />);
    last = m.index + m[0].length;
  }
  if (last === 0) return text;
  out.push(text.slice(last));
  return out;
}

function Paragraph({
  paragraph,
  as: Tag = 'div',
  currentSentenceId,
  wordRange,
  selected,
  linked,
  termRe,
  defs,
  translatedText,
  translatedLang,
  onSentenceClick,
  onToggleSelect,
  onHoverLink,
}) {
  const used = new Set();
  return (
    <Tag
      className="group grid grid-cols-[2.75rem_minmax(0,1fr)] items-start"
      data-pid={paragraph.id}
      onMouseEnter={() => onHoverLink(paragraph.id)}
      onMouseLeave={() => onHoverLink(null)}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onToggleSelect(paragraph.id)}
        className={`no-print mt-[calc((var(--r-size)*var(--r-lh)-2.25rem)/2)] grid size-9 place-items-center rounded-full border-2 text-xs font-bold transition ${
          selected ? 'border-ink bg-ink text-bg' : 'border-transparent text-muted opacity-60 group-hover:border-line group-hover:opacity-100 focus-visible:opacity-100'
        }`}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <span aria-hidden="true">{paragraph.list === 'bullet' ? '•' : '¶'}</span>
        <span className="sr-only">
          Select paragraph {paragraph.id.slice(1)} for AI tools
        </span>
      </button>
      <p id={paragraph.id} className={`${linked ? 'para-linked' : ''} ${selected ? 'rounded-md outline-2 outline-offset-4 outline-dashed outline-[var(--line)]' : ''}`}>
        {paragraph.sentences.map((s) => {
          const text = paragraph.text.slice(s.start, s.end);
          const isCurrent = s.id === currentSentenceId;
          let content;
          if (isCurrent && wordRange) {
            const a = Math.max(0, Math.min(wordRange[0], text.length));
            const b = Math.max(a, Math.min(wordRange[0] + wordRange[1], text.length));
            content = (
              <>
                {text.slice(0, a)}
                <mark className="word-current">{text.slice(a, b)}</mark>
                {text.slice(b)}
              </>
            );
          } else {
            content = renderWithTerms(text, termRe, defs, used, s.id);
          }
          return (
            <span key={s.id}>
              <span
                id={s.id}
                className={`sen ${isCurrent ? 'is-current' : ''}`}
                onClick={(e) => {
                  if (e.target.closest('.term')) return;
                  if (window.getSelection()?.toString()) return;
                  onSentenceClick(s.id);
                }}
              >
                {content}
              </span>{' '}
            </span>
          );
        })}
        {translatedText && (
          <span lang={translatedLang} className="mt-2 block rounded-xl border-l-4 border-accent bg-surface p-3">
            {translatedText}
          </span>
        )}
      </p>
    </Tag>
  );
}

export default memo(Paragraph);
