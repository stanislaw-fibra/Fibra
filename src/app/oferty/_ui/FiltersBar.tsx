"use client";

import { useEffect, useRef, useState } from "react";
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
 * Filozofia paska filtrów:
 *
 *  - Pełny pasek NIE jest sticky — scrolluje się wraz z treścią, jak każdy
 *    zwykły element. Dzięki temu „osadzony jest na stałe" w miejscu, w którym
 *    user się z nim spotkał pierwszy raz.
 *  - Dopiero gdy pełny pasek wyjedzie poza viewport (a konkretnie: gdy jego
 *    dolna krawędź przejedzie pod górnym Navem), pojawia się mini-toolbar
 *    przyklejony fixed pod navem. Kontrolowane przez IntersectionObserver na
 *    sentinelu umieszczonym tuż pod pełnym paskiem.
 *  - Scroll w górę wycofuje mini gdy sentinel wróci w widok — nie ma
 *    „połowicznej" regresji; wracasz do naturalnego, scroll-owalnego paska.
 */

const NAV_OFFSET = 72; // px — wysokość górnego Nav'a

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

  // Sentinel umieszczony tuż pod pełnym paskiem — gdy wyjedzie z widoku
  // (przechodzi pod górny Nav), aktywujemy fixed mini-toolbar. Gdy wraca,
  // chowamy mini. Intersection-Observer to najtańszy sposób — zero scroll
  // listenera.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [showMini, setShowMini] = useState(false);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    // rootMargin od góry ≈ -NAV_OFFSET → obszar nawigacji wchodzi jako
    // „poza widokiem". Kiedy sentinel jest nad Nav'em → !isIntersecting.
    const io = new IntersectionObserver(
      ([entry]) => setShowMini(!entry.isIntersecting),
      { rootMargin: `-${NAV_OFFSET + 1}px 0px 0px 0px`, threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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

  const filtryBadge =
    advancedCount +
    (filters.categories.length ? 1 : 0) +
    (filters.listing !== "all" ? 1 : 0) +
    (filters.cities.length ? 1 : 0) +
    (filters.priceMin != null || filters.priceMax != null ? 1 : 0) +
    (filters.rooms.length ? 1 : 0);

  return (
    <>
      {/* PEŁNY PASEK — osadzony na stałe (zwykły block, NIE sticky).
          Scrolluje się razem z treścią. Kiedy wyjedzie z widoku, dopiero
          wtedy pojawi się mini-toolbar (patrz niżej). */}
      <div className="relative border-b border-ink-200/80 bg-paper">
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

        {/* DESKTOP full bar — flex-wrap klasycznie. */}
        <div className="hidden lg:block">
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

        {/* MOBILE full bar — dwa rzędy:
            (1) PRZEŁĄCZNIK WIDOKU na pełną szerokość (dwie równe połówki,
                nic się nie ucina nawet na 320 px),
            (2) pozioma, przewijalna lista pigułek filtrów i sortowania
                (z delikatnym fade-right sygnalizującym, że za krawędzią są
                kolejne opcje). */}
        <div className="lg:hidden">
          <div className="container-xl pt-3 pb-3 space-y-2.5">
            <ViewToggleWide
              view={filters.view}
              onChange={(v) => apply({ view: v })}
              totalGallery={totalMatches}
              totalVideo={totalVideoMatches}
            />
            <div className="relative">
              <div className="flex gap-2 overflow-x-auto pb-1 pr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0">
                {sortPopover("start")}
                {categoryPopover}
                {listingPopover}
                {pricePopover}
                {roomsPopover}
                {locationPopover}
                {moreFiltersBtn}
                {resetBtn}
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-paper to-transparent"
              />
            </div>
          </div>
        </div>

        {/* Sentinel — znika z widoku → uruchamiamy mini-toolbar. */}
        <div ref={sentinelRef} aria-hidden className="h-px" />
      </div>

      {/* MINI-TOOLBAR (mobile) — pojawia się fixed gdy pełny pasek wyszedł
          z horyzontu. Transition-opacity + translate daje subtelne,
          naturalne wejście. */}
      <div
        className={[
          "lg:hidden fixed left-0 right-0 z-40",
          "border-b border-ink-200/80 bg-paper/94 backdrop-blur-md",
          "transition-[opacity,transform] duration-[220ms] ease-out will-change-[opacity,transform]",
          showMini
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-1 pointer-events-none",
        ].join(" ")}
        style={{ top: `${NAV_OFFSET}px` }}
        aria-hidden={!showMini}
      >
        <div className="container-xl py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {sortPopover("start")}
            <button
              type="button"
              onClick={onOpenDrawer}
              aria-label={filtryBadge > 0 ? `Filtry (aktywne: ${filtryBadge})` : "Filtry"}
              className={[
                "relative inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12.5px] font-medium whitespace-nowrap",
                "cursor-pointer select-none transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97]",
                hasAnyActive
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-200 bg-paper text-ink-700 hover:border-ink-400",
              ].join(" ")}
            >
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M1.5 3h9M3 6h6M4.5 9h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Filtry
              {filtryBadge > 0 && (
                <span className="inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-white/25 px-1 text-[10px] font-semibold tabular-nums text-white">
                  {filtryBadge}
                </span>
              )}
            </button>
          </div>
          <ViewToggleIcons
            view={filters.view}
            onChange={(v) => apply({ view: v })}
            totalGallery={totalMatches}
            totalVideo={totalVideoMatches}
          />
        </div>
      </div>
    </>
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

/**
 * Pełnoszerokościowa wersja przełącznika do mobilnego pełnego paska: dwie
 * równe połówki (grid-cols-2). Dzięki temu nic się nie ucina nawet na 320 px
 * — przyciski rosną/zwężają się razem z dostępną szerokością.
 */
function ViewToggleWide({
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
      className="grid grid-cols-2 rounded-full border border-ink-200 bg-ink-50 p-1 text-[12px] font-medium shadow-inner"
      role="group"
      aria-label="Widok katalogu"
    >
      <button
        type="button"
        onClick={() => onChange("video")}
        aria-pressed={view === "video"}
        className={[
          "inline-flex items-center justify-center gap-1.5 rounded-full px-2 py-1.5 min-w-0",
          "cursor-pointer select-none transition-[background-color,color,transform,box-shadow] duration-200 active:scale-[0.97]",
          view === "video"
            ? "bg-ink-950 text-white shadow-[0_2px_10px_-4px_rgba(11,15,20,0.45)]"
            : "text-ink-600 hover:text-ink-950 hover:bg-paper",
        ].join(" ")}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor" aria-hidden>
          <path d="M3.5 2.2L8.5 5.5 3.5 8.8V2.2z" />
        </svg>
        <span className="truncate">Wideo</span>
        <span className="opacity-60 tabular-nums">({totalVideo})</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("gallery")}
        aria-pressed={view === "gallery"}
        className={[
          "inline-flex items-center justify-center gap-1.5 rounded-full px-2 py-1.5 min-w-0",
          "cursor-pointer select-none transition-[background-color,color,transform,box-shadow] duration-200 active:scale-[0.97]",
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
        <span className="truncate">Zdjęcia</span>
        <span className="opacity-60 tabular-nums">({totalGallery})</span>
      </button>
    </div>
  );
}

export { FEATURE_LABELS };
