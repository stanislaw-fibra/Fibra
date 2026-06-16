"use client";

import { useFilters } from "@/app/oferty/filters-state";

/**
 * Kompaktowy, ciemny pasek wejściowy strony głównej. Eksponujemy TYLKO jedną,
 * najważniejszą oś wyboru - Kupno/Wynajem (jak Otodom/Rightmove/Zillow). Typ
 * nieruchomości celowo NIE jest tu wyłożony pigułkami (to zagracało i dublowało
 * „Kategorię" w pasku filtrów niżej) - zostaje w filtrze. Steruje tym samym,
 * URL-owym stanem co katalog poniżej. Świadomie niski, żeby wideo nie było ucinane.
 */

const LISTINGS: { key: "all" | "sprzedaz" | "wynajem"; label: string }[] = [
  { key: "all", label: "Wszystkie" },
  { key: "sprzedaz", label: "Kupno" },
  { key: "wynajem", label: "Wynajem" },
];

export function HomeOffersHero() {
  const { filters, apply } = useFilters();

  return (
    <section className="relative overflow-hidden bg-ink-950 text-ink-100 pt-[72px]">
      <div className="absolute inset-0 grad-radial-brand opacity-70 pointer-events-none" />
      <div className="absolute inset-0 grain grain-on-dark pointer-events-none opacity-40" />

      <div className="container-xl relative py-5 md:py-6">
        {/* Tytuł - własny, zwięzły rząd. */}
        <h1 className="font-display text-white leading-[1.08] tracking-tight text-[clamp(1.35rem,4vw,1.9rem)]">
          Znajdź swoje miejsce.{" "}
          <em className="italic text-accent-400">Zobacz je na wideo.</em>
        </h1>

        {/* Pasek sterowania na całą szerokość: filtry po lewej, widok po prawej
            (układ jak na OtoDom). */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-white/15 bg-white/[0.06] p-1">
            {LISTINGS.map((l) => {
              const active = filters.listing === l.key;
              return (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => apply({ listing: l.key })}
                  aria-pressed={active}
                  className={[
                    "rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
                    active ? "bg-white text-ink-950" : "text-white/80 hover:text-white",
                  ].join(" ")}
                >
                  {l.label}
                </button>
              );
            })}
          </div>

          {/* Przełącznik widoku - dosunięty do prawej krawędzi. Tylko desktop:
              na mobile pełnoszerokościowy przełącznik „Widok" jest już w pasku
              filtrów poniżej, więc tutaj go nie dublujemy. */}
          <div className="ml-auto hidden rounded-full border border-white/15 bg-white/[0.06] p-1 lg:inline-flex">
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
