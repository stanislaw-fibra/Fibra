"use client";

import { useEffect, useState } from "react";
import type { Offer } from "@/lib/offers";
import {
  CATEGORY_OPTIONS,
  FEATURE_LABELS,
  type Filters,
  type SortMode,
  type ViewMode,
} from "../filters-state";
import {
  FilterPopover,
  PopoverToggle,
  RangeInputs,
  SegmentedControl,
} from "./FilterPrimitives";

/**
 * Stan paska filtrów w zależności od scrolla:
 * - 'full'  — blisko góry, pełne filtry.
 * - 'mini'  — mobile, scroll w dół: tylko sortowanie + przełącznik widoku (ikony).
 * - 'hidden' — desktop, scroll w dół: pasek chowa się poza ekran, żeby nie
 *              zasłaniał odtwarzanego wideo. Na mobile zamiast hide
 *              schodzimy w mini-toolbar (patrz wyżej).
 *
 * Chcemy ŁAPAĆ INTENCJĘ, nie szarpnięcia: pasek zwija się, gdy user
 * zdecydowanie zjedzie w dół (kumulacja > 36 px w tę stronę) i rozwija
 * dopiero, gdy user naprawdę wróci w górę (kumulacja > 120 px). Drobne
 * korekty widoku (10-30 px w górę żeby „wyrównać" scroll) nie powinny
 * resetować stanu.
 */
type BarMode = "full" | "mini" | "hidden";

const DOWN_THRESHOLD = 36; // px - zwij, gdy przekroczymy 36 px w dół od ostatniego punktu odniesienia
const UP_THRESHOLD = 120; // px - rozwiń dopiero po zdecydowanym powrocie w górę

function useBarMode(): BarMode {
  const [mode, setMode] = useState<BarMode>("full");

  useEffect(() => {
    let lastY = window.scrollY;
    let pivot = lastY; // punkt odniesienia dla kumulatywnej delty w bieżącym kierunku
    let lastDir: "down" | "up" | null = null;
    let raf = 0;
    let queued = false;

    const isMobile = () => window.matchMedia("(max-width: 1023px)").matches;

    const apply = () => {
      queued = false;
      const y = window.scrollY;
      const frameDelta = y - lastY;
      lastY = y;

      // Blisko góry zawsze pełny pasek — nie chowamy.
      if (y < 180) {
        setMode("full");
        pivot = y;
        lastDir = null;
        return;
      }

      // Zmiana kierunku → resetuj punkt odniesienia.
      const dir: "down" | "up" | null =
        frameDelta > 0 ? "down" : frameDelta < 0 ? "up" : null;
      if (dir && dir !== lastDir) {
        pivot = y;
        lastDir = dir;
      }

      const travelled = y - pivot; // ujemne = w górę, dodatnie = w dół
      if (travelled > DOWN_THRESHOLD) {
        setMode(isMobile() ? "mini" : "hidden");
      } else if (travelled < -UP_THRESHOLD) {
        setMode("full");
      }
      // między progami: zostaw poprzedni tryb (brak migotania i fałszywych
      // re-expandów po drobnym ruchu palcem).
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      raf = window.requestAnimationFrame(apply);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return mode;
}

type Props = {
  offers: Offer[];
  filters: Filters;
  apply: (patch: Partial<Filters>) => void;
  reset: () => void;
  totalMatches: number;
  totalVideoMatches: number;
  advancedCount: number;
  onOpenDrawer: () => void;
  isPending?: boolean;
};

function uniqueCities(offers: Offer[]): string[] {
  const set = new Map<string, number>();
  for (const o of offers) {
    const c = o.city?.trim();
    if (!c) continue;
    set.set(c, (set.get(c) ?? 0) + 1);
  }
  return [...set.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pl")).map(([c]) => c);
}

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

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "newest", label: "Najnowsze" },
  { value: "price-asc", label: "Cena rosnąco" },
  { value: "price-desc", label: "Cena malejąco" },
  { value: "area-asc", label: "Powierzchnia rosnąco" },
  { value: "area-desc", label: "Powierzchnia malejąco" },
];

export function FiltersBar({
  offers,
  filters,
  apply,
  reset,
  totalMatches,
  totalVideoMatches,
  advancedCount,
  onOpenDrawer,
  isPending,
}: Props) {
  const cities = uniqueCities(offers);
  const pricePresets = filters.listing === "wynajem" ? PRICE_PRESETS_RENT : PRICE_PRESETS_SELL;
  const mode = useBarMode();

  const containerTransform =
    mode === "hidden" ? "-translate-y-[115%]" : "translate-y-0";

  const fullVisible = mode === "full";

  const hasAnyActive =
    filters.categories.length > 0 ||
    filters.listing !== "all" ||
    filters.cities.length > 0 ||
    filters.priceMin != null ||
    filters.priceMax != null ||
    filters.rooms.length > 0 ||
    advancedCount > 0;

  // Renderowalne „cegiełki" filtrów. Wyciągnięte, żeby użyć ich zarówno w
  // desktopowym flex-wrap, jak i w mobilnej poziomej, przewijanej
  // liście (bez zawijania → brak ściśniętego kafla).
  const categoryPopover = (
    <FilterPopover
      label="Kategoria"
      activeCount={filters.categories.length}
      isActive={filters.categories.length > 0}
      width="min-w-[260px]"
    >
      {() => (
        <div className="p-2 space-y-0.5">
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
      )}
    </FilterPopover>
  );

  const listingPopover = (
    <FilterPopover
      label={
        filters.listing === "all"
          ? "Sprzedaż / Wynajem"
          : filters.listing === "sprzedaz"
            ? "Sprzedaż"
            : "Wynajem"
      }
      isActive={filters.listing !== "all"}
    >
      {() => (
        <div className="p-3 space-y-2">
          <SegmentedControl
            value={filters.listing}
            onChange={(v) => apply({ listing: v })}
            options={[
              { value: "all", label: "Dowolnie" },
              { value: "sprzedaz", label: "Sprzedaż" },
              { value: "wynajem", label: "Wynajem" },
            ]}
          />
        </div>
      )}
    </FilterPopover>
  );

  const pricePopover = (
    <FilterPopover
      label="Cena"
      activeCount={filters.priceMin != null || filters.priceMax != null ? 1 : 0}
      isActive={filters.priceMin != null || filters.priceMax != null}
      width="min-w-[320px]"
    >
      {() => (
        <div className="p-3 space-y-3">
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
          <div className="h-px bg-ink-200/60" />
          <RangeInputs
            unit="zł"
            step={10_000}
            min={filters.priceMin}
            max={filters.priceMax}
            onMin={(v) => apply({ priceMin: v })}
            onMax={(v) => apply({ priceMax: v })}
          />
          {(filters.priceMin != null || filters.priceMax != null) && (
            <button
              type="button"
              onClick={() => apply({ priceMin: undefined, priceMax: undefined })}
              className="text-[12px] text-ink-500 hover:text-ink-900 cursor-pointer transition-colors"
            >
              Wyczyść cenę
            </button>
          )}
        </div>
      )}
    </FilterPopover>
  );

  const roomsPopover = (
    <FilterPopover
      label="Pokoje"
      activeCount={filters.rooms.length}
      isActive={filters.rooms.length > 0}
    >
      {() => (
        <div className="p-3">
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
                    "rounded-full border px-3 py-1.5 text-[12.5px] font-medium tabular-nums",
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
        </div>
      )}
    </FilterPopover>
  );

  const locationPopover = (
    <FilterPopover
      label="Lokalizacja"
      activeCount={filters.cities.length}
      isActive={filters.cities.length > 0}
      width="min-w-[280px]"
    >
      {() => (
        <div className="p-2 max-h-[340px] overflow-y-auto space-y-0.5">
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
      )}
    </FilterPopover>
  );

  const moreFiltersBtn = (
    <button
      type="button"
      onClick={onOpenDrawer}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12.5px] font-medium whitespace-nowrap",
        "cursor-pointer select-none transition-[background-color,border-color,color,transform,box-shadow] duration-150",
        "active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200",
        advancedCount > 0
          ? "border-ink-900 bg-ink-900 text-white hover:bg-ink-800 shadow-[0_4px_14px_-6px_rgba(11,15,20,0.35)]"
          : "border-ink-200 bg-paper text-ink-700 hover:border-ink-400 hover:text-ink-950 hover:shadow-[0_2px_8px_-4px_rgba(11,15,20,0.12)]",
      ].join(" ")}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M1.5 3h9M3 6h6M4.5 9h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      Więcej filtrów
      {advancedCount > 0 && (
        <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums bg-white/25 text-white">
          {advancedCount}
        </span>
      )}
    </button>
  );

  const resetBtn = hasAnyActive ? (
    <button
      type="button"
      onClick={reset}
      className="text-[12.5px] text-ink-500 hover:text-ink-900 whitespace-nowrap cursor-pointer transition-colors underline-offset-4 hover:underline px-1"
    >
      Wyczyść
    </button>
  ) : null;

  const sortPopover = (alignment: "start" | "end") => (
    <FilterPopover
      label={SORT_OPTIONS.find((s) => s.value === filters.sort)?.label ?? "Sortuj"}
      mobileTitle="Sortowanie"
      align={alignment}
      width="min-w-[220px]"
      icon={
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M2.5 3h7M3.5 6h5M4.5 9h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      }
    >
      {(close) => (
        <div className="p-2 space-y-0.5">
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => {
                apply({ sort: s.value });
                close();
              }}
              className={[
                "w-full text-left rounded-[var(--radius-sm)] px-3 py-2 text-[13px]",
                "cursor-pointer transition-colors duration-150 active:scale-[0.99]",
                filters.sort === s.value
                  ? "bg-ink-950 text-white"
                  : "hover:bg-paper-warm text-ink-800",
              ].join(" ")}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </FilterPopover>
  );

  return (
    <div
      className={[
        "sticky top-[72px] z-40 border-b border-ink-200/80 bg-paper/92 backdrop-blur-md",
        "transition-transform duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform",
        "focus-within:translate-y-0 hover:translate-y-0",
        containerTransform,
      ].join(" ")}
    >
      {/* Subtelny pasek postępu — feedback o aktualizacji. */}
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute left-0 right-0 top-0 h-[2px] overflow-hidden",
          isPending ? "opacity-100" : "opacity-0",
          "transition-opacity duration-150",
        ].join(" ")}
      >
        <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-brand-500 to-transparent animate-[shimmer_1.1s_ease-in-out_infinite]" />
        <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }`}</style>
      </div>

      {/* MOBILE: mini-toolbar — sortowanie + przełącznik widoku ikony only.
          Desktop go nie używa (ma hide-on-scroll). */}
      <div
        className={[
          "lg:hidden overflow-hidden transition-[max-height,opacity] duration-200 ease-out",
          mode === "mini" ? "max-h-[64px] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
        aria-hidden={mode !== "mini"}
      >
        <div className="container-xl py-2.5 flex items-center justify-between gap-2">
          {sortPopover("start")}
          <ViewToggleIcons
            view={filters.view}
            onChange={(v) => apply({ view: v })}
            totalGallery={totalMatches}
            totalVideo={totalVideoMatches}
          />
        </div>
      </div>

      {/* DESKTOP full bar — flex-wrap klasycznie. */}
      <div
        className={[
          "hidden lg:block overflow-hidden transition-[max-height,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
          fullVisible ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0 lg:max-h-[480px] lg:opacity-100",
        ].join(" ")}
      >
        <div className="container-xl py-3.5 flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 min-w-0">
            {categoryPopover}
            {listingPopover}
            {pricePopover}
            {roomsPopover}
            {locationPopover}
            {moreFiltersBtn}
            {resetBtn}
          </div>
          <div className="flex items-center gap-2 justify-end">
            {sortPopover("end")}
            <ViewToggle
              view={filters.view}
              onChange={(v) => apply({ view: v })}
              totalGallery={totalMatches}
              totalVideo={totalVideoMatches}
            />
          </div>
        </div>
      </div>

      {/* MOBILE full bar — kompaktowy, dwurzędowy:
          (1) pozioma, przewijalna lista pigułek z filtrami (brak zawijania,
              każdy przycisk ma normalny rozmiar, nic się nie ściska);
          (2) dolny rząd: Sortuj po lewej + przełącznik Wideo/Zdjęcia po prawej,
              wyrównane flex justify-between — toggle ma stabilną pozycję. */}
      <div
        className={[
          "lg:hidden overflow-hidden transition-[max-height,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
          fullVisible ? "max-h-[220px] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <div className="container-xl pt-2.5 pb-3">
          <div
            className="flex gap-2 overflow-x-auto pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0"
          >
            {categoryPopover}
            {listingPopover}
            {pricePopover}
            {roomsPopover}
            {locationPopover}
            {moreFiltersBtn}
            {resetBtn}
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            {sortPopover("start")}
            <ViewToggle
              view={filters.view}
              onChange={(v) => apply({ view: v })}
              totalGallery={totalMatches}
              totalVideo={totalVideoMatches}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewToggle({
  view,
  onChange,
  totalGallery,
  totalVideo,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
  totalGallery: number;
  totalVideo: number;
}) {
  return (
    <div
      className="inline-flex rounded-full border border-ink-200 bg-ink-50 p-1 text-[12px] font-medium shadow-inner"
      role="group"
      aria-label="Widok katalogu"
    >
      <button
        type="button"
        onClick={() => onChange("video")}
        aria-pressed={view === "video"}
        className={[
          "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5",
          "cursor-pointer select-none transition-[background-color,color,transform,box-shadow] duration-200 active:scale-[0.96]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200",
          view === "video"
            ? "bg-ink-950 text-white shadow-[0_2px_10px_-4px_rgba(11,15,20,0.45)]"
            : "text-ink-600 hover:text-ink-950 hover:bg-paper",
        ].join(" ")}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor" aria-hidden>
          <path d="M3.5 2.2L8.5 5.5 3.5 8.8V2.2z" />
        </svg>
        Wideo
        <span className="opacity-60 tabular-nums">({totalVideo})</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("gallery")}
        aria-pressed={view === "gallery"}
        className={[
          "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5",
          "cursor-pointer select-none transition-[background-color,color,transform,box-shadow] duration-200 active:scale-[0.96]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200",
          view === "gallery"
            ? "bg-ink-950 text-white shadow-[0_2px_10px_-4px_rgba(11,15,20,0.45)]"
            : "text-ink-600 hover:text-ink-950 hover:bg-paper",
        ].join(" ")}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
          <rect x="1.5" y="1.5" width="3.5" height="3.5" />
          <rect x="6" y="1.5" width="3.5" height="3.5" />
          <rect x="1.5" y="6" width="3.5" height="3.5" />
          <rect x="6" y="6" width="3.5" height="3.5" />
        </svg>
        Zdjęcia
        <span className="opacity-60 tabular-nums">({totalGallery})</span>
      </button>
    </div>
  );
}

/**
 * Kompaktowa wersja dla mini-toolbara na mobile: same ikonki + liczniki,
 * bez etykiet tekstowych ("Wideo"/"Zdjęcia"). Mniejszy footprint,
 * lepszy UI gdy user skrolluje.
 */
function ViewToggleIcons({
  view,
  onChange,
  totalGallery,
  totalVideo,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
  totalGallery: number;
  totalVideo: number;
}) {
  return (
    <div
      className="inline-flex rounded-full border border-ink-200 bg-ink-50 p-1 text-[11.5px] font-medium shadow-inner"
      role="group"
      aria-label="Widok katalogu"
    >
      <button
        type="button"
        onClick={() => onChange("video")}
        aria-pressed={view === "video"}
        aria-label={`Widok wideo (${totalVideo})`}
        className={[
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1.5",
          "cursor-pointer select-none transition-[background-color,color,transform] duration-200 active:scale-[0.96]",
          view === "video" ? "bg-ink-950 text-white" : "text-ink-600 hover:text-ink-950 hover:bg-paper",
        ].join(" ")}
      >
        <svg width="12" height="12" viewBox="0 0 11 11" fill="currentColor" aria-hidden>
          <path d="M3.5 2.2L8.5 5.5 3.5 8.8V2.2z" />
        </svg>
        <span className="opacity-70 tabular-nums">{totalVideo}</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("gallery")}
        aria-pressed={view === "gallery"}
        aria-label={`Widok zdjęć (${totalGallery})`}
        className={[
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1.5",
          "cursor-pointer select-none transition-[background-color,color,transform] duration-200 active:scale-[0.96]",
          view === "gallery" ? "bg-ink-950 text-white" : "text-ink-600 hover:text-ink-950 hover:bg-paper",
        ].join(" ")}
      >
        <svg width="12" height="12" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
          <rect x="1.5" y="1.5" width="3.5" height="3.5" />
          <rect x="6" y="1.5" width="3.5" height="3.5" />
          <rect x="1.5" y="6" width="3.5" height="3.5" />
          <rect x="6" y="6" width="3.5" height="3.5" />
        </svg>
        <span className="opacity-70 tabular-nums">{totalGallery}</span>
      </button>
    </div>
  );
}

export { FEATURE_LABELS };
