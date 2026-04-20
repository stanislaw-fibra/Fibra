"use client";

import { useEffect } from "react";
import { FEATURE_LABELS, type Filters } from "../filters-state";
import { PopoverToggle, RangeInputs, SegmentedControl } from "./FilterPrimitives";

type Props = {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  apply: (patch: Partial<Filters>) => void;
  advancedCount: number;
  matchesCount: number;
};

export function FiltersDrawer({ open, onClose, filters, apply, advancedCount, matchesCount }: Props) {
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
            <p className="eyebrow text-ink-500">Filtry zaawansowane</p>
            <h2 className="font-display text-[20px] text-ink-950 mt-0.5">
              {advancedCount > 0 ? `Aktywne: ${advancedCount}` : "Precyzyjne wyszukiwanie"}
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
            Wyczyść zaawansowane
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
