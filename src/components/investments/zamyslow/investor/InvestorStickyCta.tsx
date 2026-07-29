"use client";

import { useEffect, useState } from "react";

/**
 * Stały skrót do eksploratora budynku (#mieszkania) - dostępny na całej stronie
 * inwestora, żeby przejście do wyboru mieszkania było zawsze na wyciągnięcie ręki.
 *
 * Chowamy go, gdy: (1) jesteśmy jeszcze na samej górze (w hero jest już duże CTA),
 * (2) eksplorator faktycznie zajmuje kawałek ekranu - przycisk prowadzący do tego,
 * co użytkownik właśnie ogląda, tylko zasłaniałby widok, (3) widać formularz kontaktu.
 *
 * Świadomie liczymy widoczność z getBoundingClientRect zamiast IntersectionObserver:
 * sekcja #mieszkania jest bardzo wysoka (eksplorator + lista 36 lokali), więc przy
 * progu 0 „dotyka" viewportu niemal na całej stronie i przycisk nigdy by się nie pokazał.
 */
const HIDE_ABOVE_FOLD = 420; // px - dopóki widać hero z własnym CTA
const EXPLORER_VISIBLE_RATIO = 0.3; // ile ekranu musi zająć eksplorator, by schować skrót

export function InvestorStickyCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const visibleRatio = (el: HTMLElement | null): number => {
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
      return visible / vh;
    };

    const update = () => {
      const explorer = document.getElementById("mieszkania");
      const contact = document.getElementById("kontakt");
      setShow(
        window.scrollY > HIDE_ABOVE_FOLD &&
          visibleRatio(explorer) < EXPLORER_VISIBLE_RATIO &&
          visibleRatio(contact) === 0,
      );
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      aria-hidden={!show}
      className={[
        "fixed inset-x-0 bottom-0 z-[90] flex justify-center px-4 pb-5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
      ].join(" ")}
    >
      <a
        href="#wizualizacja"
        tabIndex={show ? 0 : -1}
        className="inline-flex items-center gap-2.5 rounded-full bg-ink-950 px-6 py-3.5 text-[14px] font-medium text-white shadow-[0_8px_32px_-8px_rgba(11,15,20,0.45)] transition-colors duration-300 hover:bg-accent-400 hover:text-ink-950"
      >
        Zobacz dostępne mieszkania
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M7 3v8M3 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </div>
  );
}
