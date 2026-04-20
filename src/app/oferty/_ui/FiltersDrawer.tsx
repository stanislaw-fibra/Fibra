"use client";

import { useEffect } from "react";
import { CATEGORY_OPTIONS, FEATURE_LABELS, type Filters } from "../filters-state";
import { PopoverToggle, RangeInputs, SegmentedControl } from "./FilterPrimitives";

type Props = {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  apply: (patch: Partial<Filters>) => void;
  advancedCount: number;
  matchesCount: number;
  /** Lista miast zbudowana z ofert (do sekcji „Lokalizacja"). */
  cities: string[];
};

const PRICE_PRESETS_SELL = [
  { label: "Do 300 tys.", min: undefined, max: 300_000 },
  { label: "300-500 tys.", min: 300_000, max: 500_000 },
  { label: "500-800 tys.", min: 500_000, max: 800_000 },
  { label: "800 tys.-1,2 mln", min: 800_000, max: 1_200_000 },
  { label: "Powyżej 1,2 mln", min: 1_200_000, max: undefined },
];

const PRICE_PRESETS_RENT = [
  { label: "Do 2 tys./mies.", min: undefined, max: 2000 },
  { label: "2-3 tys./mies.", min: 2000, max: 3000 },
  { label: "3-5 tys./mies.", min: 3000, max: 5000 },
  { label: "Powyżej 5 tys.", min: 5000, max: undefined },
];

export function FiltersDrawer({ open, onClose, filters, apply, advancedCount, matchesCount, cities }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const clearAll = () => {
    apply({
      categories: [],
      listing: "all",
      cities: [],
      priceMin: undefined,
      priceMax: undefined,
      rooms: [],
      areaMin: undefined,
      areaMax: undefined,
      yearMin: undefined,
      yearMax: undefined,
      floorMin: undefined,
      floorMax: undefined,
      market: "all",
      exclusiveOnly: false,
      features: [],
    });
  };

  const pricePresets = filters.listing === "wynajem" ? PRICE_PRESETS_RENT : PRICE_PRESETS_SELL;

  const totalActive =
    (filters.categories.length ? 1 : 0) +
    (filters.listing !== "all" ? 1 : 0) +
    (filters.cities.length ? 1 : 0) +
    (filters.priceMin != null || filters.priceMax != null ? 1 : 0) +
    (filters.rooms.length ? 1 : 0) +
    advancedCount;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Filtry zaawansowane"
    >
      <button
        type="button"
        aria-label="Zamknij filtry"
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/50 backdrop-blur-[2px] animate-[fadeIn_.18s_ease-out]"
      />
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes slideInUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>

      <aside
        className={[
          "relative bg-paper shadow-[-24px_0_60px_-20px_rgba(11,15,20,0.3)]",
          "w-full sm:max-w-[460px] h-full flex flex-col",
          "animate-[slideInRight_.24s_cubic-bezier(.2,.8,.2,1)]",
          "max-sm:animate-[slideInUp_.24s_cubic-bezier(.2,.8,.2,1)]",
        ].join(" ")}
      >
        <header className="flex items-center justify-between border-b border-ink-200/80 px-5 py-4">
          <div>
            <p className="eyebrow text-ink-500">Wszystkie filtry</p>
            <h2 className="font-display text-[20px] text-ink-950 mt-0.5">
              {totalActive > 0 ? `Aktywne: ${totalActive}` : "Wyszukiwanie"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-paper-warm text-ink-700"
            aria-label="Zamknij"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">
          <Section title="Kategoria">
            <div className="space-y-0.5">
              {CATEGORY_OPTIONS.map((opt) => (
                <PopoverToggle
                  key={opt.value}
                  checked={filters.categories.includes(opt.value)}
                  label={opt.label}
                  onChange={(on) =>
                    apply({
                      categories: on
                        ? [...filters.categories, opt.value]
                        : filters.categories.filter((v) => v !== opt.value),
                    })
                  }
                />
              ))}
            </div>
          </Section>

          <Section title="Typ oferty">
            <SegmentedControl
              value={filters.listing}
              onChange={(v) => apply({ listing: v })}
              options={[
                { value: "all", label: "Dowolnie" },
                { value: "sprzedaz", label: "Sprzedaż" },
                { value: "wynajem", label: "Wynajem" },
              ]}
            />
          </Section>

          <Section title="Cena">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {pricePresets.map((p) => {
                  const active = filters.priceMin === p.min && filters.priceMax === p.max;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => apply({ priceMin: p.min, priceMax: p.max })}
                      className={[
                        "rounded-full border px-2.5 py-1 text-[11.5px] font-medium",
                        "cursor-pointer transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96]",
                        active
                          ? "border-ink-950 bg-ink-950 text-white"
                          : "border-ink-200 text-ink-700 hover:border-ink-400",
                      ].join(" ")}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <RangeInputs
                unit="zł"
                step={10_000}
                min={filters.priceMin}
                max={filters.priceMax}
                onMin={(v) => apply({ priceMin: v })}
                onMax={(v) => apply({ priceMax: v })}
              />
            </div>
          </Section>

          <Section title="Pokoje">
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5].map((r) => {
                const active = filters.rooms.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() =>
                      apply({
                        rooms: active ? filters.rooms.filter((x) => x !== r) : [...filters.rooms, r],
                      })
                    }
                    className={[
                      "rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium tabular-nums",
                      "cursor-pointer transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96]",
                      active
                        ? "border-ink-950 bg-ink-950 text-white"
                        : "border-ink-200 text-ink-700 hover:border-ink-400",
                    ].join(" ")}
                  >
                    {r === 5 ? "5+" : r}
                  </button>
                );
              })}
            </div>
          </Section>

          {cities.length > 0 && (
            <Section title="Lokalizacja">
              <div className="max-h-[260px] overflow-y-auto space-y-0.5 pr-1">
                {cities.map((c) => (
                  <PopoverToggle
                    key={c}
                    checked={filters.cities.includes(c)}
                    label={c}
                    onChange={(on) =>
                      apply({
                        cities: on ? [...filters.cities, c] : filters.cities.filter((v) => v !== c),
                      })
                    }
                  />
                ))}
              </div>
            </Section>
          )}

          <div className="h-px bg-ink-200/70" />

          <Section title="Powierzchnia">
            <RangeInputs
              unit="m²"
              step={1}
              min={filters.areaMin}
              max={filters.areaMax}
              onMin={(v) => apply({ areaMin: v })}
              onMax={(v) => apply({ areaMax: v })}
            />
          </Section>

          <Section title="Rok budowy">
            <RangeInputs
              unit="r."
              step={1}
              min={filters.yearMin}
              max={filters.yearMax}
              onMin={(v) => apply({ yearMin: v })}
              onMax={(v) => apply({ yearMax: v })}
              placeholderMin="od"
              placeholderMax="do"
            />
          </Section>

          <Section title="Piętro">
            <RangeInputs
              unit=""
              step={1}
              min={filters.floorMin}
              max={filters.floorMax}
              onMin={(v) => apply({ floorMin: v })}
              onMax={(v) => apply({ floorMax: v })}
              placeholderMin="od"
              placeholderMax="do"
            />
          </Section>

          <Section title="Rynek">
            <SegmentedControl
              value={filters.market}
              onChange={(v) => apply({ market: v })}
              options={[
                { value: "all", label: "Dowolny" },
                { value: "primary", label: "Pierwotny" },
                { value: "secondary", label: "Wtórny" },
              ]}
            />
          </Section>

          <Section title="Udogodnienia">
            <div className="space-y-0.5">
              {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                <PopoverToggle
                  key={key}
                  checked={filters.features.includes(key)}
                  label={label}
                  onChange={(on) =>
                    apply({
                      features: on
                        ? [...filters.features, key]
                        : filters.features.filter((f) => f !== key),
                    })
                  }
                />
              ))}
            </div>
          </Section>
        </div>

        <footer className="border-t border-ink-200/80 bg-paper px-5 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={clearAll}
            className="text-[13px] text-ink-600 hover:text-ink-950"
          >
            Wyczyść wszystko
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-ink-950 hover:bg-brand-500 text-white px-5 py-2.5 text-[13px] font-medium transition-colors"
          >
            Pokaż {matchesCount}{" "}
            {matchesCount === 1 ? "ofertę" : matchesCount < 5 ? "oferty" : "ofert"}
          </button>
        </footer>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[11px] uppercase tracking-[0.16em] text-ink-500 font-medium">{title}</h3>
      {children}
    </section>
  );
}
