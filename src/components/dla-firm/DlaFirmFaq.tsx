"use client";

import { useState } from "react";

type Item = { q: string; a: string };

export function DlaFirmFaq({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ul className="divide-y divide-ink-200/80 rounded-[var(--radius-lg)] bg-white ring-1 ring-ink-200/70 overflow-hidden">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <li key={item.q}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-start gap-5 px-5 md:px-7 py-5 md:py-6 text-left transition-colors hover:bg-paper-warm/50"
            >
              <span className="mt-1 text-[12px] font-semibold tracking-[0.12em] text-brand-500 tabular-nums shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 font-display text-ink-950 text-[1.1rem] md:text-[1.25rem] leading-snug tracking-tight">
                {item.q}
              </span>
              <span
                className={[
                  "mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink-200 text-ink-700 transition-transform duration-300",
                  isOpen ? "rotate-45 bg-ink-950 border-ink-950 text-white" : "",
                ].join(" ")}
                aria-hidden
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
            </button>
            <div
              className={[
                "grid transition-[grid-template-rows] duration-300 ease-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              ].join(" ")}
            >
              <div className="overflow-hidden">
                <div className="px-5 md:px-7 pb-6 md:pb-7 pl-[58px] md:pl-[68px] text-[15px] md:text-[16px] leading-[1.65] text-ink-700 max-w-3xl">
                  {item.a}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
