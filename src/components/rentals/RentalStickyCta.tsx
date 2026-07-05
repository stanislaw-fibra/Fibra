"use client";

import { useEffect, useState } from "react";
import { TrackedPhoneLink } from "@/components/rentals/TrackedPhoneLink";

/**
 * Przyklejony dolny pasek CTA dla landingu wynajmu - tylko mobile/tablet
 * (na desktopie hero ma czytelne CTA, więc pasek chowamy: lg:hidden).
 *
 * Pojawia się dopiero po zjechaniu z hero (żeby nie dublować przycisków z góry)
 * i znika, gdy sekcja kontaktu (#kontakt) wchodzi w widok - inaczej na mobile
 * zasłaniałby przycisk „Wyślij" formularza.
 *
 * Pomiar: „Zadzwoń" leci jako phone_click (location: "sticky") - tak samo jak
 * pozostałe telefony. „Zapytaj o mieszkanie" (scroll do formularza) leci jako
 * cta_click, żeby było widać zainteresowanie zanim ktoś wyśle zapytanie.
 */
export function RentalStickyCta({
  phone,
  phoneDisplay,
}: {
  phone: string;
  phoneDisplay: string;
}) {
  const [pastHero, setPastHero] = useState(false);
  const [contactInView, setContactInView] = useState(false);

  useEffect(() => {
    // Sekcję kontaktu (#kontakt) liczymy z pozycji scrolla, a nie przez
    // IntersectionObserver - jeden listener, przewidywalny w każdym środowisku.
    const kontakt = document.getElementById("kontakt");
    const onScroll = () => {
      setPastHero(window.scrollY > 400);
      if (kontakt) {
        const top = kontakt.getBoundingClientRect().top;
        // Chowaj pasek, gdy formularz zaczyna wchodzić w górne 65% ekranu.
        setContactInView(top < window.innerHeight * 0.65);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const visible = pastHero && !contactInView;

  return (
    <div
      aria-hidden={!visible}
      // Inline transform zamiast utility translate-y-* - w Tailwind v4 toggling
      // klas translate-y-0/full na właściwości `translate` bywa zawodny; inline
      // `transform` jest jednoznaczny i tranzycjonuje przez transition-transform.
      style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
      className={[
        "lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-950/95 backdrop-blur-md",
        "px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        "shadow-[0_-12px_32px_-12px_rgba(0,0,0,0.5)]",
        "transition-transform duration-300 ease-out",
      ].join(" ")}
    >
      <div className="flex items-center gap-2.5">
        <a
          href="#kontakt"
          tabIndex={visible ? 0 : -1}
          onClick={() => {
            if (typeof window === "undefined") return;
            window.gtag?.("event", "cta_click", {
              source: "rental_zamyslow",
              location: "sticky",
              target: "form",
            });
          }}
          className="inline-flex flex-1 items-center justify-center rounded-full border border-white/25 px-5 py-3 text-[14px] font-medium text-white transition-colors hover:border-white/60"
        >
          Zapytaj o mieszkanie
        </a>
        <TrackedPhoneLink
          phone={phone}
          location="sticky"
          tabIndex={visible ? 0 : -1}
          aria-label={`Zadzwoń: ${phoneDisplay}`}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent-400 px-5 py-3 text-[14px] font-semibold text-ink-950 transition-colors hover:bg-accent-400/90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.07 2H7a2 2 0 0 1 2 1.72c.13.9.35 1.78.66 2.62a2 2 0 0 1-.45 2.11L7.9 9.77a16 16 0 0 0 6 6l1.32-1.32a2 2 0 0 1 2.11-.45c.84.3 1.72.53 2.62.66A2 2 0 0 1 22 16.92Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Zadzwoń
        </TrackedPhoneLink>
      </div>
    </div>
  );
}
