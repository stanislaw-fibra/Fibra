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
          <div className="flex shrink-0 items-center gap-2.5">
            {/* Telefon pod ręką - dla części osób to niższy próg niż formularz. */}
            <a
              href="tel:+48881431800"
              aria-label="Zadzwoń: 881 431 800"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink-950/15 text-ink-800 transition-colors hover:border-ink-950/40 hover:text-ink-950"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.07 2H7a2 2 0 0 1 2 1.72c.13.9.35 1.78.66 2.62a2 2 0 0 1-.45 2.11L7.9 9.77a16 16 0 0 0 6 6l1.32-1.32a2 2 0 0 1 2.11-.45c.84.3 1.72.53 2.62.66A2 2 0 0 1 22 16.92Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            {/* Akcentowy pomarańcz jak sticky CTA na /zamyslow - główna akcja
                strony ma się odcinać, a nie zlewać z resztą paska. */}
            <a
              href="#kontakt"
              className="inline-flex items-center gap-2 rounded-full bg-accent-400 px-5 py-2.5 text-[13.5px] font-semibold text-ink-950 ring-1 ring-ink-950/10 shadow-[0_10px_28px_-8px_rgba(242,101,34,0.5)] transition-colors hover:bg-ink-950 hover:text-white"
            >
              Zapytaj o mieszkanie
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
