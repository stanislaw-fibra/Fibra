"use client";

import { useFilters } from "@/app/oferty/filters-state";

/**
 * Ciemny hero strony głównej (styl jak dawne OpeningReels) + wyeksponowane,
 * OtoDom-owe wejście w katalog: Kupno/Wynajem, typy nieruchomości i przełącznik
 * widoku (wideo / klasyczny). Steruje tym samym, URL-owym stanem filtrów co
 * katalog (OfertyPageClient) poniżej - więc klik tutaj filtruje listę od razu.
 */

const TYPES: { key: string; label: string }[] = [
  { key: "mieszkania", label: "Mieszkania" },
  { key: "domy", label: "Domy" },
  { key: "dzialki", label: "Działki" },
  { key: "lokale", label: "Lokale" },
  { key: "obiekty", label: "Obiekty" },
];

const LISTINGS: { key: "all" | "sprzedaz" | "wynajem"; label: string }[] = [
  { key: "all", label: "Wszystkie" },
  { key: "sprzedaz", label: "Kupno" },
  { key: "wynajem", label: "Wynajem" },
];

export function HomeOffersHero() {
  const { filters, apply } = useFilters();

  const toggleType = (key: string) => {
    const has = filters.categories.includes(key);
    apply({ categories: has ? [] : [key] });
  };

  return (
    <section className="relative overflow-hidden bg-ink-950 text-ink-100 pt-[72px]">
      <div className="absolute inset-0 grad-radial-brand opacity-70 pointer-events-none" />
      <div className="absolute inset-0 grain grain-on-dark pointer-events-none opacity-45" />

      <div className="container-xl relative py-7 md:py-10 lg:py-12">
        <p className="eyebrow eyebrow-on-dark inline-flex items-center gap-3">
          <span className="inline-block w-6 lg:w-8 h-px bg-accent-400" />
          Fibra Nieruchomości
        </p>
        <h1 className="mt-3 font-display text-white leading-[1.04] tracking-tight text-[clamp(1.6rem,5vw,2.2rem)] md:text-[clamp(1.9rem,3vw,2.8rem)] max-w-[20ch]">
          Znajdź swoje miejsce.{" "}
          <em className="italic text-accent-400">Zobacz je na wideo.</em>
        </h1>

        {/* Kupno / Wynajem - duży, czytelny wybór jak na OtoDom. */}
        <div className="mt-6 inline-flex rounded-full border border-white/15 bg-white/[0.06] p-1 backdrop-blur-sm">
          {LISTINGS.map((l) => {
            const active = filters.listing === l.key;
            return (
              <button
                key={l.key}
                type="button"
                onClick={() => apply({ listing: l.key })}
                aria-pressed={active}
                className={[
                  "rounded-full px-4 py-2 text-[13px] font-medium transition-colors",
                  active ? "bg-white text-ink-950" : "text-white/80 hover:text-white",
                ].join(" ")}
              >
                {l.label}
              </button>
            );
          })}
        </div>

        {/* Typy nieruchomości - szybkie wejście, filtruje katalog poniżej. */}
        <div className="mt-3 flex flex-wrap gap-2">
          {TYPES.map((t) => {
            const active = filters.categories.includes(t.key);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => toggleType(t.key)}
                aria-pressed={active}
                className={[
                  "rounded-full border px-4 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "border-accent-400 bg-accent-400 text-ink-950"
                    : "border-white/15 bg-white/[0.04] text-white/85 hover:border-white/35 hover:text-white",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Przełącznik widoku - wideo domyślnie, klasyczny po kliknięciu. */}
        <div className="mt-5 flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Widok
          </span>
          <div className="inline-flex rounded-full border border-white/15 bg-white/[0.06] p-1">
            {(["video", "gallery"] as const).map((v) => {
              const active = filters.view === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => apply({ view: v })}
                  aria-pressed={active}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
                    active ? "bg-white text-ink-950" : "text-white/75 hover:text-white",
                  ].join(" ")}
                >
                  {v === "video" ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                      <rect x="9" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                  )}
                  {v === "video" ? "Wideo" : "Klasyczny"}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
