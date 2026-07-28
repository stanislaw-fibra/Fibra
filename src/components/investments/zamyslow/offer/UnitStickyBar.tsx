"use client";

import { useEffect, useState } from "react";

/**
 * Dyskretny pasek CTA przyklejony do dołu ekranu. Pojawia się dopiero, gdy
 * hero zniknie z widoku, i chowa się, gdy widać sekcję kontaktu (wtedy CTA
 * byłoby duplikatem). Czysty dostęp do „Zapytaj" w każdym miejscu strony.
 */
export function UnitStickyBar({
  unitId,
  areaLabel,
  rooms,
  priceLabel,
}: {
  unitId: string;
  areaLabel: string;
  rooms: number;
  priceLabel: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("unit-hero");
    const contact = document.getElementById("kontakt");
    if (!hero || !contact) return;
    let heroVisible = true;
    let contactVisible = false;
    const update = () => setShow(!heroVisible && !contactVisible);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target === hero) heroVisible = e.isIntersecting;
          if (e.target === contact) contactVisible = e.isIntersecting;
        }
        update();
      },
      { threshold: 0.05 },
    );
    io.observe(hero);
    io.observe(contact);
    return () => io.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!show}
      className={[
        "fixed inset-x-0 bottom-0 z-[90] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        show ? "translate-y-0" : "translate-y-full",
      ].join(" ")}
    >
      <div className="border-t border-ink-200/70 bg-[rgba(250,250,248,0.92)] shadow-[0_-8px_32px_-12px_rgba(11,15,20,0.18)] backdrop-blur-xl">
        <div className="container-xl flex h-[64px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-baseline gap-3">
            <span className="font-sans text-[16px] font-bold tabular-nums tracking-tight text-ink-950">
              {unitId}
            </span>
            <span className="hidden truncate text-[13.5px] text-ink-500 sm:inline">
              {areaLabel.replace(".", ",")} · {rooms} pokoje
            </span>
            <span className="truncate text-[13.5px] font-medium text-ink-800">
              {priceLabel}
            </span>
          </div>
          <a
            href="#kontakt"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-brand-500"
          >
            Zapytaj o mieszkanie
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
