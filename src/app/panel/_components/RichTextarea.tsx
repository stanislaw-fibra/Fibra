"use client";

import { useCallback, useId, useRef } from "react";

type Props = {
  name: string;
  defaultValue?: string;
  rows?: number;
  placeholder?: string;
  className?: string;
  /** Etykieta nad polem — opcjonalna. */
  label?: string;
  /** Pomocniczy hint pod polem (np. „akapity oddziel pustą linią"). */
  hint?: React.ReactNode;
};

/**
 * Lekka textarea z toolbarem: B / I / U + lista + nagłówek.
 *
 * Klient prosił, żeby agenci mogli formatować opis bez znajomości HTML — zaznaczasz tekst,
 * klikasz B, dostajesz `<b>tekst</b>`. To samo dla I, U. Lista wstawia myślnik na początku
 * linii (bo nasz parser auto-detekcji rozpoznaje `- ` jako bullet). Nagłówek dokleja `:` na
 * końcu linii (pattern który auto-detekcja rozpoznaje jako podnagłówek sekcji).
 *
 * Toolbar nie jest WYSIWYG — to celowo. Pełen rich editor (TipTap / Lexical) byłby
 * over-engineering i wprowadziłby dużo zależności. Klient potrzebuje TYLKO B / I / U,
 * a auto-detekcja struktury robi resztę.
 *
 * Skróty klawiaturowe: Cmd/Ctrl+B (bold), Cmd/Ctrl+I (italic), Cmd/Ctrl+U (underline).
 */
export function RichTextarea({
  name,
  defaultValue = "",
  rows = 10,
  placeholder,
  className = "",
  label,
  hint,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const reactId = useId();
  const id = `${name}-${reactId}`;

  /** Wraps current selection with `before` and `after` markers. Cursor lands inside the wrap. */
  const wrap = useCallback((before: string, after: string) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const value = ta.value;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    ta.value = next;
    // Po wstawieniu: jeśli była selekcja — zaznacz to co teraz w środku, jeśli nie — kursor wewnątrz tagów
    const newStart = start + before.length;
    const newEnd = newStart + selected.length;
    ta.selectionStart = newStart;
    ta.selectionEnd = newEnd;
    ta.focus();
    // React-controlled inputs łapią value przez native event — dispatch żeby form data się zsynchronizowało
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }, []);

  /** Insert `text` at cursor (replacing any selection). */
  const insertAtCursor = useCallback((text: string) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const value = ta.value;
    const next = value.slice(0, start) + text + value.slice(end);
    ta.value = next;
    const cursor = start + text.length;
    ta.selectionStart = ta.selectionEnd = cursor;
    ta.focus();
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }, []);

  /** Lista: dla każdej zaznaczonej linii dodaje "- " na początku. */
  const toggleList = useCallback(() => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const value = ta.value;

    // Rozszerz selekcję do pełnych linii
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEndRaw = value.indexOf("\n", end);
    const lineEnd = lineEndRaw === -1 ? value.length : lineEndRaw;
    const block = value.slice(lineStart, lineEnd);

    // Każda linia → dopisz "- " na początku, chyba że już jest myślnik
    const transformed = block
      .split("\n")
      .map((line) => (line.match(/^\s*-\s/) ? line : line.trim() ? `- ${line}` : line))
      .join("\n");

    const next = value.slice(0, lineStart) + transformed + value.slice(lineEnd);
    ta.value = next;
    ta.selectionStart = lineStart;
    ta.selectionEnd = lineStart + transformed.length;
    ta.focus();
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }, []);

  /** Nagłówek: dodaje `:` na końcu linii zawierającej kursor (auto-parser to wyłapie). */
  const toggleHeading = useCallback(() => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const value = ta.value;

    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEndRaw = value.indexOf("\n", start);
    const lineEnd = lineEndRaw === -1 ? value.length : lineEndRaw;
    const line = value.slice(lineStart, lineEnd).trimEnd();

    if (!line) return;
    if (line.endsWith(":")) return; // już jest nagłówkiem

    const next = value.slice(0, lineStart) + line + ":" + value.slice(lineEnd);
    ta.value = next;
    const newCursor = lineStart + line.length + 1;
    ta.selectionStart = ta.selectionEnd = newCursor;
    ta.focus();
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }, []);

  /** Skróty klawiaturowe: Cmd/Ctrl+B/I/U. */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        wrap("<b>", "</b>");
      } else if (key === "i") {
        e.preventDefault();
        wrap("<i>", "</i>");
      } else if (key === "u") {
        e.preventDefault();
        wrap("<u>", "</u>");
      }
    },
    [wrap],
  );

  const buttonClass =
    "inline-flex h-8 min-w-8 items-center justify-center px-2 rounded-md border border-ink-300 bg-paper text-ink-900 text-[13px] hover:bg-brand-50 hover:border-brand-500 active:bg-brand-100 transition-colors";

  return (
    <div className={className}>
      {label ? (
        <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-700 mb-2">
          {label}
        </label>
      ) : null}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-t-[var(--radius-sm)] border border-ink-300/90 border-b-0 bg-paper-warm/60 px-3 py-2">
        <button type="button" onClick={() => wrap("<b>", "</b>")} className={buttonClass} title="Pogrubienie (Cmd/Ctrl+B)">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => wrap("<i>", "</i>")} className={buttonClass} title="Kursywa (Cmd/Ctrl+I)">
          <em>I</em>
        </button>
        <button type="button" onClick={() => wrap("<u>", "</u>")} className={buttonClass} title="Podkreślenie (Cmd/Ctrl+U)">
          <span className="underline">U</span>
        </button>

        <span aria-hidden className="mx-1 h-5 w-px bg-ink-300/80" />

        <button type="button" onClick={toggleList} className={buttonClass} title="Lista — myślnik na początku linii">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="3" cy="4" r="1" fill="currentColor" />
            <circle cx="3" cy="8" r="1" fill="currentColor" />
            <circle cx="3" cy="12" r="1" fill="currentColor" />
            <line x1="6.5" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="6.5" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="6.5" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>

        <button type="button" onClick={toggleHeading} className={buttonClass} title="Nagłówek sekcji (dwukropek na końcu linii)">
          <span className="font-semibold">H:</span>
        </button>

        <span aria-hidden className="mx-1 h-5 w-px bg-ink-300/80" />

        <button
          type="button"
          onClick={() => insertAtCursor("\n\n")}
          className={buttonClass}
          title="Nowy akapit (pusta linia)"
        >
          ¶
        </button>
      </div>

      <textarea
        ref={ref}
        id={id}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
        onKeyDown={onKeyDown}
        spellCheck
        className="w-full rounded-b-[var(--radius-sm)] border border-ink-300/90 bg-paper px-4 py-3 text-[14px] text-ink-900 outline-none transition-colors focus:border-brand-500 hover:border-ink-400 leading-relaxed font-sans"
      />

      {hint ? <div className="mt-1 text-[12.5px] text-ink-700 leading-relaxed">{hint}</div> : null}
    </div>
  );
}
