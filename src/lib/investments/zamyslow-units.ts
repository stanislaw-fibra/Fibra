import "server-only";

// ─────────────────────────────────────────────────────────────────────────────
// Mieszkania nowej inwestycji Zamysłów (Etap II, budynek 128G) - 36 lokali.
//
// Źródłem danych jest OPUBLIKOWANY arkusz Google (CSV), którym zarządza biuro
// (Arek): statusy, ceny, rezerwacje, linki do materiałów. Strona czyta arkusz
// na żywo (ISR 300 s), więc zmiana w arkuszu pojawia się na stronie sama.
//
// PRYWATNOŚĆ - arkusz zawiera też kolumny wewnętrzne (Klient / rezerwujący,
// Telefon, Data rezerwacji, Notatki). Ochrona jak w zamyslow-rentals:
//   A) kotwiczymy się na wierszu nagłówków (ma kolumny „ID" i „STATUS"),
//   B) czytamy WYŁĄCZNIE whitelistę kolumn po nazwie - kolumny wewnętrzne
//      nie są nigdzie czytane i nie opuszczają tej funkcji,
//   C) publikujemy tylko wiersze z „Publikować na stronie" = TAK.
// ─────────────────────────────────────────────────────────────────────────────

export type UnitAvailability = "available" | "reserved" | "sold";

export interface ZamyslowUnitListing {
  /** „M1"…„M36" - klucz i slug (małymi literami w URL). */
  id: string;
  /** Piętro 0-5 (0 = parter). */
  floor: number;
  /** Etykieta piętra do wyświetlenia, np. „Parter", „1. piętro". */
  floorLabel: string;
  /** Numer lokalu z arkusza (1-36). */
  unitNumber: string;
  /** Oznaczenie budynku, np. „128G". */
  building: string;
  /** Typ układu z arkusza (A-G). */
  layoutType: string;
  rooms: number;
  bedrooms: number;
  /** Powierzchnia w m² (liczba) + oryginalny zapis. */
  areaM2: number;
  areaLabel: string;
  /** Rozkład pomieszczeń (tylko te, które mają wartość w arkuszu). */
  roomsList: { name: string; areaLabel: string; areaM2: number }[];
  /** „Balkon" / „Taras" + opcjonalna powierzchnia. */
  outdoor: string;
  outdoorArea: string;
  exposure: string;
  availability: UnitAvailability;
  /** Etykieta statusu z arkusza, np. „Dostępne". */
  statusLabel: string;
  /** Cena w zł (null = cena na zapytanie). */
  price: number | null;
  /** Cena za m² wyliczona z ceny (null, gdy brak ceny). */
  pricePerM2: number | null;
  parkingSpot: string;
  parkingPrice: number | null;
  storageRoom: string;
  /** Linki do materiałów (uzupełniane w arkuszu, gdy będą gotowe). */
  links: { floorPlanPdf: string; visualization: string; tour3d: string };
  updatedAt: string;
}

export interface ZamyslowUnitsListing {
  units: ZamyslowUnitListing[];
  available: number;
  total: number;
}

const DEFAULT_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQivrSotst5b5hgIt3qpQ-CzC76fgKae3WmQy4wZtdZ4Q-eyQF8CaPgEW6PUUf41yKfx6WZXtXw0W0F/pub?output=csv";

function csvUrl(): string {
  return process.env.ZAMYSLOW_UNITS_SHEET_CSV_URL?.trim() || DEFAULT_CSV_URL;
}

function norm(s: string): string {
  return (s ?? "").normalize("NFC").trim().toLowerCase();
}
function clean(s: string): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

/** „31.12 m²" / „31,12" → 31.12 (0, gdy brak liczby). */
function toNumber(v: string): number {
  const n = parseFloat(clean(v).replace(/\s/g, "").replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** „450 000 zł" / „450000" → 450000; „—" / puste → null. */
function toPrice(v: string): number | null {
  const s = clean(v);
  if (!s || s === "—" || s === "-") return null;
  const n = Math.round(toNumber(s));
  return n > 0 ? n : null;
}

export function floorLabelOf(floor: number): string {
  return floor === 0 ? "Parter" : `${floor}. piętro`;
}

/** Parser CSV (RFC 4180) - cudzysłowy, przecinki i nowe linie w polach. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  row.push(field);
  rows.push(row);
  return rows;
}

/**
 * Pobiera 36 mieszkań z arkusza. Zwraca null przy problemie z arkuszem -
 * strona oferty pokazuje wtedy 404/komunikat zamiast błędnych danych.
 */
export async function getZamyslowUnits(): Promise<ZamyslowUnitsListing | null> {
  let text: string;
  try {
    const res = await fetch(csvUrl(), { next: { revalidate: 300 } });
    if (!res.ok) {
      console.error("[zamyslow-units] Arkusz odpowiedział statusem", res.status);
      return null;
    }
    text = await res.text();
  } catch (e) {
    console.error("[zamyslow-units] Nie udało się pobrać arkusza:", e);
    return null;
  }

  const rows = parseCsv(text);

  // (A) Wiersz nagłówków: ma „id" oraz „status".
  const headerIndex = rows.findIndex((r) => {
    const cells = r.map(norm);
    return cells.includes("id") && cells.includes("status");
  });
  if (headerIndex === -1) {
    console.error("[zamyslow-units] Nie znaleziono wiersza nagłówków.");
    return null;
  }

  const header = rows[headerIndex].map(norm);
  const col = (name: string): number => header.indexOf(name);
  // Linki mają w nagłówku półpauzę („Link – rzut") - dopasowanie po fragmencie.
  const colLike = (fragment: string): number =>
    header.findIndex((h) => h.includes(fragment));

  // (B) Whitelista - TYLKO te kolumny są czytane.
  const c = {
    id: col("id"),
    building: col("budynek"),
    floor: col("piętro"),
    unitNumber: col("nr lokalu"),
    layout: col("typ układu"),
    rooms: col("pokoje"),
    bedrooms: col("sypialnie"),
    area: col("powierzchnia"),
    salon: col("salon z aneksem"),
    bedroom1: col("sypialnia 1"),
    bedroom2: col("sypialnia 2"),
    bath: col("łazienka"),
    outdoor: colLike("balkon / taras"),
    outdoorArea: colLike("pow. balkonu"),
    exposure: col("ekspozycja"),
    status: col("status"),
    price: colLike("cena (zł)"),
    parking: col("miejsce postojowe"),
    parkingPrice: colLike("cena miejsca"),
    storage: col("komórka lokatorska"),
    publish: colLike("publikować"),
    linkPlan: colLike("link – rzut"),
    linkViz: colLike("link – wizualizacja"),
    linkTour: colLike("link – spacer"),
    updated: colLike("ostatnia aktualizacja"),
  };
  if (c.id === -1 || c.area === -1 || c.status === -1) {
    console.error("[zamyslow-units] Brak wymaganych kolumn (ID/Powierzchnia/STATUS).");
    return null;
  }

  const get = (row: string[], i: number): string =>
    i >= 0 && i < row.length ? clean(row[i]) : "";

  const units: ZamyslowUnitListing[] = [];
  for (let r = headerIndex + 1; r < rows.length; r += 1) {
    const row = rows[r];
    const id = get(row, c.id).toUpperCase();
    if (!/^M\d{1,2}$/.test(id)) continue; // koniec tabeli / wiersze pomocnicze

    // (C) Publikujemy wyłącznie wiersze z TAK.
    const publish = norm(get(row, c.publish));
    if (c.publish !== -1 && publish !== "tak") continue;

    const statusLabel = get(row, c.status) || "Dostępne";
    let availability: UnitAvailability;
    if (/sprzeda/i.test(statusLabel)) availability = "sold";
    else if (/rezerw|umowa/i.test(statusLabel)) availability = "reserved";
    else availability = "available";

    const floor = Math.max(0, Math.min(5, Math.round(toNumber(get(row, c.floor)))));
    const areaM2 = toNumber(get(row, c.area));
    const price = toPrice(get(row, c.price));

    const roomsList: { name: string; areaLabel: string; areaM2: number }[] = (
      [
        ["Salon z aneksem kuchennym", get(row, c.salon)],
        ["Sypialnia", get(row, c.bedroom1)],
        ["Sypialnia 2", get(row, c.bedroom2)],
        ["Łazienka", get(row, c.bath)],
      ] as const
    )
      .filter(([, v]) => v && toNumber(v) > 0)
      .map(([name, v]) => ({ name, areaLabel: v, areaM2: toNumber(v) }));
    // Gdy są dwie sypialnie, pierwszą też numerujemy - czytelniej w rozkładzie.
    if (roomsList.some((x) => x.name === "Sypialnia 2")) {
      const first = roomsList.find((x) => x.name === "Sypialnia");
      if (first) first.name = "Sypialnia 1";
    }

    units.push({
      id,
      floor,
      floorLabel: floorLabelOf(floor),
      unitNumber: get(row, c.unitNumber) || id.slice(1),
      building: get(row, c.building) || "128G",
      layoutType: get(row, c.layout),
      rooms: Math.round(toNumber(get(row, c.rooms))) || roomsList.length,
      bedrooms: Math.round(toNumber(get(row, c.bedrooms))),
      areaM2,
      areaLabel: get(row, c.area),
      roomsList,
      outdoor: get(row, c.outdoor),
      outdoorArea: get(row, c.outdoorArea),
      exposure: get(row, c.exposure),
      availability,
      statusLabel,
      price,
      pricePerM2: price && areaM2 > 0 ? Math.round(price / areaM2) : null,
      parkingSpot: get(row, c.parking),
      parkingPrice: toPrice(get(row, c.parkingPrice)),
      storageRoom: get(row, c.storage),
      links: {
        floorPlanPdf: get(row, c.linkPlan),
        visualization: get(row, c.linkViz),
        tour3d: get(row, c.linkTour),
      },
      updatedAt: get(row, c.updated),
    });
  }

  if (units.length === 0) return null;
  units.sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));

  return {
    units,
    available: units.filter((u) => u.availability === "available").length,
    total: units.length,
  };
}

/** Jedno mieszkanie po id (akceptuje „m12" i „M12"). */
export async function getZamyslowUnit(
  rawId: string,
): Promise<{ unit: ZamyslowUnitListing; all: ZamyslowUnitListing[] } | null> {
  const listing = await getZamyslowUnits();
  if (!listing) return null;
  const id = rawId.toUpperCase();
  const unit = listing.units.find((u) => u.id === id);
  return unit ? { unit, all: listing.units } : null;
}

/** Format ceny: 450000 → „450 000 zł". */
export function formatPln(n: number): string {
  return `${new Intl.NumberFormat("pl-PL").format(n)} zł`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Widełki metrażu i ceny dla tekstów marketingowych (/zamyslow, Przewodnik).
//
// Klient prosił, żeby ŻADEN zakres nie był wpisany w kod na sztywno - metraże
// i ceny mają lecieć z tego samego arkusza, co strony lokali. Zaokrąglamy
// „na zewnątrz" (dół w dół, góra w górę), żeby widełki nigdy nie obiecywały
// mniejszej ceny ani nie ucinały największego mieszkania.
// ─────────────────────────────────────────────────────────────────────────────

export interface ZamyslowUnitsSummary {
  total: number;
  available: number;
  /** np. „27 – 55,5 m²". */
  areaRangeLabel: string;
  /** np. „296 – 554 tys. zł". `null`, gdy w arkuszu nie ma jeszcze cen. */
  priceRangeLabel: string | null;
}

/** 55.5 → „55,5"; 27 → „27". */
function plNumber(n: number): string {
  return String(n).replace(".", ",");
}

export function getZamyslowUnitsSummaryFrom(
  listing: ZamyslowUnitsListing,
): ZamyslowUnitsSummary {
  const areas = listing.units.map((u) => u.areaM2).filter((a) => a > 0);
  const prices = listing.units
    .map((u) => u.price)
    .filter((p): p is number => typeof p === "number" && p > 0);

  const areaRangeLabel = areas.length
    ? `${plNumber(Math.floor(Math.min(...areas)))} – ${plNumber(
        Math.ceil(Math.max(...areas) * 2) / 2,
      )} m²`
    : "";

  const priceRangeLabel = prices.length
    ? `${Math.floor(Math.min(...prices) / 1000)} – ${Math.ceil(
        Math.max(...prices) / 1000,
      )} tys. zł`
    : null;

  return {
    total: listing.total,
    available: listing.available,
    areaRangeLabel,
    priceRangeLabel,
  };
}

/** Widełki z arkusza. `null`, gdy arkusz nie odpowiada - wtedy strona pokazuje fallback. */
export async function getZamyslowUnitsSummary(): Promise<ZamyslowUnitsSummary | null> {
  const listing = await getZamyslowUnits();
  return listing ? getZamyslowUnitsSummaryFrom(listing) : null;
}
