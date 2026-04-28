"use client";

import { useCallback, useMemo, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Offer } from "@/lib/offers";

export type ViewMode = "video" | "gallery";
export type SortMode = "newest" | "price-asc" | "price-desc" | "area-asc" | "area-desc";

export type Filters = {
  view: ViewMode;
  sort: SortMode;
  /** Wolny tekst (lupka) — szukane słowa kluczowe; matchowane w tytule,
   * mieście, dzielnicy, kategorii, opisie i numerze referencyjnym. */
  query: string;
  categories: string[];       // mieszkania|domy|dzialki|lokale|obiekty
  listing: "all" | "sprzedaz" | "wynajem";
  cities: string[];
  priceMin?: number;
  priceMax?: number;
  rooms: number[];            // 1,2,3,4,5 (5 = "5+")
  areaMin?: number;
  areaMax?: number;
  yearMin?: number;
  yearMax?: number;
  floorMin?: number;
  floorMax?: number;
  market: "all" | "primary" | "secondary";
  exclusiveOnly: boolean;
  features: string[];         // balkon, taras, piwnica, ogrod, winda, klimatyzacja, loggia, garaz
};

export const DEFAULT_FILTERS: Filters = {
  view: "video",
  sort: "newest",
  query: "",
  categories: [],
  listing: "all",
  cities: [],
  rooms: [],
  market: "all",
  exclusiveOnly: false,
  features: [],
};

const FEATURE_MATCHERS: Record<string, (o: Offer) => boolean> = {
  balkon: (o) => !!o.hasBalcony,
  taras: (o) => !!o.hasTerrace,
  piwnica: (o) => !!o.hasBasement,
  ogrod: (o) => !!o.hasGarden,
  winda: (o) => !!o.hasElevator,
  klimatyzacja: (o) => !!o.hasAirConditioning,
  loggia: (o) => !!o.hasLoggia,
  garaz: (o) => (o.miejscParkingowych ?? 0) > 0,
};

export const FEATURE_LABELS: Record<string, string> = {
  balkon: "Balkon",
  taras: "Taras",
  piwnica: "Piwnica",
  ogrod: "Ogród",
  winda: "Winda",
  klimatyzacja: "Klimatyzacja",
  loggia: "Loggia",
  garaz: "Garaż / miejsce postojowe",
};

export const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "mieszkania", label: "Mieszkania" },
  { value: "domy", label: "Domy" },
  { value: "dzialki", label: "Działki" },
  { value: "lokale", label: "Lokale" },
  { value: "obiekty", label: "Obiekty" },
];

function categoryFromOffer(o: Offer): string {
  switch (o.kind) {
    case "apartament":
    case "penthouse":
      return "mieszkania";
    case "dom":
      return "domy";
    case "grunt":
      return "dzialki";
    case "lokal":
      return "lokale";
  }
}

function csv(v: string | null): string[] {
  if (!v) return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

function num(v: string | null): number | undefined {
  if (v == null || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function listing(v: string | null): Filters["listing"] {
  return v === "sprzedaz" || v === "wynajem" ? v : "all";
}

function market(v: string | null): Filters["market"] {
  return v === "primary" || v === "secondary" ? v : "all";
}

function sort(v: string | null): SortMode {
  const allowed: SortMode[] = ["newest", "price-asc", "price-desc", "area-asc", "area-desc"];
  return allowed.includes(v as SortMode) ? (v as SortMode) : "newest";
}

function view(v: string | null): ViewMode {
  return v === "gallery" ? "gallery" : "video";
}

function readQuery(raw: string | null): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  // Defensywnie: jeśli ktoś (np. zewnętrzne narzędzie) zapisze do URL
  // literal "undefined"/"null" - traktujemy jako pusty string.
  if (trimmed === "undefined" || trimmed === "null") return "";
  return trimmed;
}

export function parseFiltersFromSearchParams(sp: URLSearchParams): Filters {
  return {
    view: view(sp.get("view")),
    sort: sort(sp.get("sort")),
    query: readQuery(sp.get("q")),
    categories: csv(sp.get("category")),
    listing: listing(sp.get("listing")),
    cities: csv(sp.get("city")),
    priceMin: num(sp.get("priceMin")),
    priceMax: num(sp.get("priceMax")),
    rooms: csv(sp.get("rooms"))
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n) && n > 0),
    areaMin: num(sp.get("areaMin")),
    areaMax: num(sp.get("areaMax")),
    yearMin: num(sp.get("yearMin")),
    yearMax: num(sp.get("yearMax")),
    floorMin: num(sp.get("floorMin")),
    floorMax: num(sp.get("floorMax")),
    market: market(sp.get("market")),
    exclusiveOnly: sp.get("exclusive") === "1",
    features: csv(sp.get("features")),
  };
}

export function filtersToSearchParams(f: Filters): URLSearchParams {
  const out = new URLSearchParams();
  if (f.view !== DEFAULT_FILTERS.view) out.set("view", f.view);
  if (f.sort !== DEFAULT_FILTERS.sort) out.set("sort", f.sort);
  if (f.query.trim()) out.set("q", f.query.trim());
  if (f.categories.length) out.set("category", f.categories.join(","));
  if (f.listing !== "all") out.set("listing", f.listing);
  if (f.cities.length) out.set("city", f.cities.join(","));
  if (f.priceMin != null) out.set("priceMin", String(f.priceMin));
  if (f.priceMax != null) out.set("priceMax", String(f.priceMax));
  if (f.rooms.length) out.set("rooms", f.rooms.join(","));
  if (f.areaMin != null) out.set("areaMin", String(f.areaMin));
  if (f.areaMax != null) out.set("areaMax", String(f.areaMax));
  if (f.yearMin != null) out.set("yearMin", String(f.yearMin));
  if (f.yearMax != null) out.set("yearMax", String(f.yearMax));
  if (f.floorMin != null) out.set("floorMin", String(f.floorMin));
  if (f.floorMax != null) out.set("floorMax", String(f.floorMax));
  if (f.market !== "all") out.set("market", f.market);
  if (f.exclusiveOnly) out.set("exclusive", "1");
  if (f.features.length) out.set("features", f.features.join(","));
  return out;
}

export function useFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = useMemo(
    () => parseFiltersFromSearchParams(new URLSearchParams(sp.toString())),
    [sp],
  );

  const apply = useCallback(
    (patch: Partial<Filters>) => {
      const next = { ...filters, ...patch };
      const qs = filtersToSearchParams(next).toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [filters, router, pathname],
  );

  const reset = useCallback(
    (preserveView = true) => {
      const next: Filters = { ...DEFAULT_FILTERS, view: preserveView ? filters.view : DEFAULT_FILTERS.view };
      const qs = filtersToSearchParams(next).toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [filters.view, router, pathname],
  );

  return { filters, apply, reset, isPending };
}

/**
 * Policz, ile filtrów ma "niedomyślną" wartość - używane na badge w pasku filtrów.
 */
export function activeFilterCount(f: Filters): number {
  let n = 0;
  if (f.query.trim()) n++;
  if (f.categories.length) n++;
  if (f.listing !== "all") n++;
  if (f.cities.length) n++;
  if (f.priceMin != null || f.priceMax != null) n++;
  if (f.rooms.length) n++;
  if (f.areaMin != null || f.areaMax != null) n++;
  if (f.yearMin != null || f.yearMax != null) n++;
  if (f.floorMin != null || f.floorMax != null) n++;
  if (f.market !== "all") n++;
  if (f.exclusiveOnly) n++;
  if (f.features.length) n++;
  return n;
}

/**
 * Normalizacja stringa do dopasowania case-insensitive i diacritic-insensitive
 * (np. "łodź" matchuje "LODZ"). Używana wyłącznie przy filtrze tekstowym.
 */
function normalize(s: string | undefined | null): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l");
}

function offerSearchHaystack(o: Offer): string {
  return [
    o.title,
    o.subtitle,
    o.tagline,
    o.excerpt,
    o.fullDescription,
    o.kindLabel,
    o.city,
    o.district,
    o.refNumber,
    ...(o.body ?? []),
    ...(o.highlights ?? []),
  ]
    .map((x) => normalize(x))
    .join(" ");
}

function tokenize(q: string): string[] {
  return normalize(q).split(/\s+/).filter(Boolean);
}

function withinNum(v: number | undefined, min?: number, max?: number): boolean {
  if (v == null) return min == null && max == null ? true : false;
  if (min != null && v < min) return false;
  if (max != null && v > max) return false;
  return true;
}

export function applyFilters(offers: Offer[], f: Filters): Offer[] {
  const tokens = tokenize(f.query);
  const filtered = offers.filter((o) => {
    if (tokens.length) {
      const hay = offerSearchHaystack(o);
      if (!tokens.every((t) => hay.includes(t))) return false;
    }
    if (f.categories.length) {
      const cat = categoryFromOffer(o);
      if (!f.categories.includes(cat)) return false;
    }
    if (f.listing !== "all" && o.listingType !== f.listing) return false;
    if (f.cities.length && !f.cities.includes(o.city || "")) return false;

    if (f.priceMin != null || f.priceMax != null) {
      const p = o.priceFrom ?? 0;
      if (p <= 0) return false;
      if (f.priceMin != null && p < f.priceMin) return false;
      if (f.priceMax != null && p > f.priceMax) return false;
    }

    if (f.rooms.length) {
      const r = o.rooms ?? 0;
      const ok = f.rooms.some((target) => (target >= 5 ? r >= 5 : r === target));
      if (!ok) return false;
    }

    if (f.areaMin != null || f.areaMax != null) {
      const a = o.areaUsableM2 || o.area || 0;
      if (a <= 0) return false;
      if (!withinNum(a, f.areaMin, f.areaMax)) return false;
    }

    if (f.yearMin != null || f.yearMax != null) {
      if (!withinNum(o.rokBudowy, f.yearMin, f.yearMax)) return false;
    }

    if (f.floorMin != null || f.floorMax != null) {
      const pietro = o.pietro ? Number(o.pietro.split("/")[0].trim()) : undefined;
      if (!withinNum(pietro, f.floorMin, f.floorMax)) return false;
    }

    if (f.market === "primary" && o.marketType !== "Rynek pierwotny") return false;
    if (f.market === "secondary" && o.marketType && o.marketType !== "Rynek wtórny") return false;

    if (f.exclusiveOnly && !o.isExclusive) return false;

    if (f.features.length) {
      for (const key of f.features) {
        const fn = FEATURE_MATCHERS[key];
        if (!fn || !fn(o)) return false;
      }
    }

    return true;
  });

  const sorted = [...filtered];
  switch (f.sort) {
    case "price-asc":
      sorted.sort((a, b) => (a.priceFrom ?? Number.MAX_SAFE_INTEGER) - (b.priceFrom ?? Number.MAX_SAFE_INTEGER));
      break;
    case "price-desc":
      sorted.sort((a, b) => (b.priceFrom ?? -1) - (a.priceFrom ?? -1));
      break;
    case "area-asc":
      sorted.sort((a, b) => ((a.areaUsableM2 || a.area) || Number.MAX_SAFE_INTEGER) - ((b.areaUsableM2 || b.area) || Number.MAX_SAFE_INTEGER));
      break;
    case "area-desc":
      sorted.sort((a, b) => ((b.areaUsableM2 || b.area) || -1) - ((a.areaUsableM2 || a.area) || -1));
      break;
    default:
      sorted.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  }

  return sorted;
}

/** Policz ile ofert z pełnej listy pasuje do filtrów — dla CTA „zobacz N więcej". */
export function countMatches(offers: Offer[], f: Filters): number {
  return applyFilters(offers, f).length;
}

export { categoryFromOffer };
