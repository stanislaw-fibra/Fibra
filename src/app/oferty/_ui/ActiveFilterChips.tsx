"use client";

import { FEATURE_LABELS, CATEGORY_OPTIONS, type Filters } from "../filters-state";

type Props = {
  filters: Filters;
  apply: (patch: Partial<Filters>) => void;
};

type Chip = { key: string; label: string; onRemove: () => void };

function fmtPrice(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2).replace(".", ",").replace(/,00$/, "")} mln`;
  if (v >= 1000) return `${Math.round(v / 1000)} tys.`;
  return String(v);
}

function chips(f: Filters, apply: Props["apply"]): Chip[] {
  const out: Chip[] = [];

  for (const cat of f.categories) {
    const label = CATEGORY_OPTIONS.find((c) => c.value === cat)?.label ?? cat;
    out.push({
      key: `cat-${cat}`,
      label,
      onRemove: () => apply({ categories: f.categories.filter((c) => c !== cat) }),
    });
  }

  if (f.listing !== "all") {
    out.push({
      key: "listing",
      label: f.listing === "sprzedaz" ? "Sprzedaż" : "Wynajem",
      onRemove: () => apply({ listing: "all" }),
    });
  }

  for (const c of f.cities) {
    out.push({
      key: `city-${c}`,
      label: c,
      onRemove: () => apply({ cities: f.cities.filter((x) => x !== c) }),
    });
  }

  if (f.priceMin != null || f.priceMax != null) {
    const label =
      f.priceMin != null && f.priceMax != null
        ? `Cena ${fmtPrice(f.priceMin)}–${fmtPrice(f.priceMax)}`
        : f.priceMin != null
          ? `Cena od ${fmtPrice(f.priceMin)}`
          : `Cena do ${fmtPrice(f.priceMax!)}`;
    out.push({
      key: "price",
      label,
      onRemove: () => apply({ priceMin: undefined, priceMax: undefined }),
    });
  }

  for (const r of f.rooms) {
    out.push({
      key: `rooms-${r}`,
      label: r >= 5 ? "5+ pokoi" : `${r} ${r === 1 ? "pokój" : r < 5 ? "pokoje" : "pokoi"}`,
      onRemove: () => apply({ rooms: f.rooms.filter((x) => x !== r) }),
    });
  }

  if (f.areaMin != null || f.areaMax != null) {
    const label =
      f.areaMin != null && f.areaMax != null
        ? `${f.areaMin}–${f.areaMax} m²`
        : f.areaMin != null
          ? `od ${f.areaMin} m²`
          : `do ${f.areaMax} m²`;
    out.push({ key: "area", label, onRemove: () => apply({ areaMin: undefined, areaMax: undefined }) });
  }

  if (f.yearMin != null || f.yearMax != null) {
    const label =
      f.yearMin != null && f.yearMax != null
        ? `Rok ${f.yearMin}–${f.yearMax}`
        : f.yearMin != null
          ? `Rok od ${f.yearMin}`
          : `Rok do ${f.yearMax}`;
    out.push({ key: "year", label, onRemove: () => apply({ yearMin: undefined, yearMax: undefined }) });
  }

  if (f.floorMin != null || f.floorMax != null) {
    const label =
      f.floorMin != null && f.floorMax != null
        ? `Piętro ${f.floorMin}–${f.floorMax}`
        : f.floorMin != null
          ? `Piętro od ${f.floorMin}`
          : `Piętro do ${f.floorMax}`;
    out.push({ key: "floor", label, onRemove: () => apply({ floorMin: undefined, floorMax: undefined }) });
  }

  if (f.market !== "all") {
    out.push({
      key: "market",
      label: f.market === "primary" ? "Rynek pierwotny" : "Rynek wtórny",
      onRemove: () => apply({ market: "all" }),
    });
  }

  for (const feat of f.features) {
    out.push({
      key: `feat-${feat}`,
      label: FEATURE_LABELS[feat] ?? feat,
      onRemove: () => apply({ features: f.features.filter((x) => x !== feat) }),
    });
  }

  return out;
}

export function ActiveFilterChips({ filters, apply }: Props) {
  const items = chips(filters, apply);
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 py-4">
      <span className="text-[11px] uppercase tracking-[0.14em] text-ink-500 mr-1">Aktywne filtry:</span>
      {items.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.onRemove}
          className="group inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-paper-warm/80 px-3 py-1.5 text-[12px] font-medium text-ink-800 hover:border-ink-400 hover:bg-paper transition-colors"
        >
          <span>{c.label}</span>
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-ink-200 text-ink-600 group-hover:bg-ink-900 group-hover:text-white transition-colors">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
        </button>
      ))}
    </div>
  );
}
