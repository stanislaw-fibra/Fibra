"use client";

import { useState, type ReactNode } from "react";

/**
 * Zwijana sekcja treści ("po przycisku się rozwija") - długi opis / pełne parametry
 * nie zajmują od razu całej wysokości. W stanie zwiniętym treść jest przycięta do
 * `collapsedHeight` z delikatnym fade na dole (sygnał, że jest więcej). Premium, clean.
 */
export function OfferCollapsible({
  children,
  collapsedHeight = 260,
  moreLabel = "Rozwiń",
  lessLabel = "Zwiń",
}: {
  children: ReactNode;
  collapsedHeight?: number;
  moreLabel?: string;
  lessLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div
        className="relative overflow-hidden"
        style={{ maxHeight: open ? "none" : `${collapsedHeight}px` }}
      >
        {children}
        {!open && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-paper via-paper/80 to-transparent"
          />
        )}
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-ink-200/80 bg-paper px-4 py-2 text-[13px] font-medium text-ink-900 transition-colors hover:border-brand-400 hover:text-brand-600"
      >
        {open ? lessLabel : moreLabel}
        <svg
          width="13"
          height="13"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden
          className={open ? "rotate-180 transition-transform" : "transition-transform"}
        >
          <path d="M3.5 5.5L7 9l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
