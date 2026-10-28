"use client";

import { useEffect, useState } from "react";

export type TocItem = { id: string; label: string };

/**
 * Spis treści w lewej kolumnie (desktop). Podświetla rozdział, który właśnie
 * czytasz: aktywny jest ten, którego nagłówek ostatni minął górną część ekranu.
 */
export function ArticleToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    const onScroll = () => {
      const line = window.innerHeight * 0.3;
      let current = items[0]?.id ?? "";
      for (const s of sections) {
        if (s.getBoundingClientRect().top <= line) current = s.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  return (
    <nav aria-labelledby="spis-tresci">
      <h2 id="spis-tresci" className="px-3 text-[14px] font-semibold text-ink-950">
        Spis treści
      </h2>
      <ol className="mt-3 space-y-0.5">
        {items.map((i) => {
          const isActive = i.id === active;
          return (
            <li key={i.id}>
              <a
                href={`#${i.id}`}
                aria-current={isActive ? "location" : undefined}
                className={`block rounded-[var(--radius-sm)] px-3 py-2 text-[15px] leading-snug transition-colors duration-200 ${
                  isActive
                    ? "bg-brand-50 font-medium text-brand-700"
                    : "text-ink-600 hover:bg-ink-100/70 hover:text-ink-950"
                }`}
              >
                {i.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
