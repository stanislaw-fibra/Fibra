import { cleanDescription } from "./description-cleaner";
import type { RawOffer, RawParam } from "./xml-parser";

export type OfferCategory = "mieszkania" | "domy" | "dzialki" | "lokale" | "obiekty";
export type OfferListingType = "sprzedaz" | "wynajem";

export interface MappedOffer {
  galactica_offer_id: string;
  category: OfferCategory;
  listing_type: OfferListingType;
  title: string | null;
  advertisement_text: string | null;
  description: string | null;
  price: number | null;
  currency: "PLN" | "EUR" | "USD";
  area_total: number | null;
  area_usable: number | null;
  area_plot: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  floors_total: number | null;
  year_built: number | null;
  has_balcony: boolean | null;
  has_terrace: boolean | null;
  has_basement: boolean | null;
  has_elevator: boolean | null;
  has_air_conditioning: boolean | null;
  building_material: string | null;
  building_state: string | null;
  property_state: string | null;
  heating: string | null;
  kitchen_type: string | null;
  parking_spaces: number | null;
  province: string | null;
  city: string | null;
  district: string | null;
  street: string | null;
  lat: number | null;
  lng: number | null;
  is_primary_market: boolean | null;
  is_exclusive: boolean | null;
  is_without_commission: boolean | null;
  virtual_tour_url: string | null;
  source_updated_at: string | null;
  agent_name: string | null;
  agent_email: string | null;
  agent_phone_office: string | null;
  agent_phone_mobile: string | null;
  raw_params: Record<string, unknown>;
  image_filenames: { order: number; filename: string }[];
}

// Mapowanie kategorii. "pokoje" traktujemy jako mieszkania (spec FIBRA_IMPORTER_CONTEXT sekcja 3).
// "obiekty" nie ma dedykowanej wartości w enumie offer_category — traktujemy jako "lokale".
function mapCategory(tab: string): OfferCategory {
  const t = tab.toLowerCase().trim();
  switch (t) {
    case "mieszkania":
      return "mieszkania";
    case "domy":
      return "domy";
    case "dzialki":
    case "działki":
      return "dzialki";
    case "lokale":
      return "lokale";
    case "obiekty":
      return "obiekty";
    case "pokoje":
      return "mieszkania";
    default:
      return "mieszkania";
  }
}

function mapListingType(typ: string): OfferListingType {
  const t = typ.toLowerCase().trim();
  return t === "wynajem" ? "wynajem" : "sprzedaz";
}

function toFloat(v: string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim().replace(/\s+/g, "").replace(",", ".");
  if (!s) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function toInt(v: string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = parseInt(s.replace(",", "."), 10);
  return Number.isFinite(n) ? n : null;
}

function toBool(v: string | null | undefined): boolean | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim().toLowerCase();
  if (!s) return null;
  if (s === "1" || s === "true" || s === "tak") return true;
  if (s === "0" || s === "false" || s === "nie") return false;
  return null;
}

function toText(v: string | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s || null;
}

// Galactica czasem wysyła datę "2025-11-07" lub "2025-11-07 12:34:56"
function toTimestamp(v: string | null | undefined): string | null {
  const s = toText(v);
  if (!s) return null;
  // Zwracamy ISO jeśli parsuje, w innym wypadku null (zachowaj w raw_params)
  const normalized = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function parseParkingSpaces(v: string | null | undefined): number | null {
  const s = toText(v);
  if (!s) return null;
  const m = s.match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

// Grupa pól, które mają dedykowane kolumny — nie trafiają do raw_params
const HANDLED_PARAM_NAMES = new Set([
  "advertisement_text",
  "opis",
  "powierzchnia",
  "available_area",
  "powierzchniadzialki",
  "liczbapokoi",
  "liczba_sypialni",
  "liczbalazienek",
  "pietro",
  "liczbapieter",
  "rokbudowy",
  "wojewodztwo",
  "miasto",
  "dzielnica",
  "ulica",
  "n_geo_x",
  "n_geo_y",
  "rynek_pierwotny",
  "wylacznosc",
  "bezprowizji",
  "balkon",
  "taras",
  "piwnica",
  "winda",
  "klimatyzacja",
  "materialbudowy",
  "stanbudynku",
  "stannieruchomosci",
  "ogrzewanie",
  "typkuchni",
  "miejscaparkingowe",
  "wirtualnawizyta",
  "dataaktualizacji",
  "agent_nazwisko",
  "agent_email",
  "agent_tel_biuro",
  "agent_tel_kom",
]);

function findParam(params: RawParam[], name: string): RawParam | undefined {
  // uwaga: Galactica czasem wysyła nazwę z trailing space ("cenazametr ")
  return params.find((p) => p.nazwa === name || p.nazwa.trim() === name);
}

function findParamRaw(params: RawParam[], name: string): string | null {
  const p = findParam(params, name);
  return p ? p.value : null;
}

export function mapOffer(raw: RawOffer): MappedOffer {
  const { params } = raw;

  const advertisement_text = toText(findParamRaw(params, "advertisement_text"));
  const agent_name = toText(findParamRaw(params, "agent_nazwisko"));

  // Opis — KRYTYCZNE — patrz description-cleaner.ts
  const rawOpis = findParamRaw(params, "opis");
  const description = cleanDescription(rawOpis, agent_name);

  // Zdjęcia: zdjecie1..zdjecie50
  const image_filenames: MappedOffer["image_filenames"] = [];
  for (const p of params) {
    const m = /^zdjecie(\d+)$/.exec(p.nazwa.trim());
    if (m) {
      const order = parseInt(m[1], 10);
      const filename = toText(p.value);
      if (filename) image_filenames.push({ order, filename });
    }
  }
  image_filenames.sort((a, b) => a.order - b.order);

  // Współrzędne: Galactica używa x=lng, y=lat (geograficznie).
  const lng = toFloat(findParamRaw(params, "n_geo_x"));
  const lat = toFloat(findParamRaw(params, "n_geo_y"));

  // Cena
  let price: number | null = null;
  let currency: MappedOffer["currency"] = "PLN";
  if (raw.price) {
    price = toFloat(raw.price.value);
    const w = raw.price.waluta.toUpperCase();
    currency = w === "EUR" ? "EUR" : w === "USD" ? "USD" : "PLN";
  }

  // Location override dla miasta/dzielnicy, gdy param się nie pojawił
  const locByLevel = new Map<number, string>();
  for (const a of raw.location) locByLevel.set(a.level, a.value);

  const province = toText(findParamRaw(params, "wojewodztwo") ?? locByLevel.get(2) ?? null);
  const city = toText(findParamRaw(params, "miasto") ?? locByLevel.get(4) ?? null);
  const district = toText(findParamRaw(params, "dzielnica") ?? locByLevel.get(5) ?? null);

  // Zbuduj raw_params: wszystko, co nie jest obsłużone i nie jest zdjęciem
  const raw_params: Record<string, unknown> = {};
  for (const p of params) {
    const name = p.nazwa.trim();
    if (HANDLED_PARAM_NAMES.has(name)) continue;
    if (/^zdjecie\d+$/.test(name)) continue;
    // zachowujemy oryginalną wartość (stringiem), ale parsujemy liczby jeśli to real/int/bool/float
    const parsed = parseParamValue(p.value, p.typ);
    raw_params[name] = parsed;
  }

  // Dodatkowo zapisz location raw
  if (raw.location.length > 0) {
    raw_params["__location"] = raw.location;
  }

  // title: użyj advertisement_text, a jeśli puste — fallback na pierwszą niepustą linię
  // wyczyszczonego opisu (obcięta do 80 znaków).
  let title: string | null = advertisement_text;
  if (!title && description) {
    const firstLine = description.split("\n").find((l) => l.trim() !== "")?.trim();
    if (firstLine) {
      title = firstLine.length > 80 ? firstLine.slice(0, 80).trim() : firstLine;
    }
  }

  return {
    galactica_offer_id: raw.id,
    category: mapCategory(raw.category),
    listing_type: mapListingType(raw.listing_type),
    title,
    advertisement_text,
    description,
    price,
    currency,
    area_total: toFloat(findParamRaw(params, "powierzchnia")),
    area_usable: toFloat(findParamRaw(params, "available_area")),
    area_plot: toFloat(findParamRaw(params, "powierzchniadzialki")),
    rooms: toInt(findParamRaw(params, "liczbapokoi")),
    bedrooms: toInt(findParamRaw(params, "liczba_sypialni")),
    bathrooms: toInt(findParamRaw(params, "liczbalazienek")),
    floor: toInt(findParamRaw(params, "pietro")),
    floors_total: toInt(findParamRaw(params, "liczbapieter")),
    year_built: toInt(findParamRaw(params, "rokbudowy")),
    has_balcony: toBool(findParamRaw(params, "balkon")),
    has_terrace: toBool(findParamRaw(params, "taras")),
    has_basement: toBool(findParamRaw(params, "piwnica")),
    has_elevator: toBool(findParamRaw(params, "winda")),
    has_air_conditioning: toBool(findParamRaw(params, "klimatyzacja")),
    building_material: toText(findParamRaw(params, "materialbudowy")),
    building_state: toText(findParamRaw(params, "stanbudynku")),
    property_state: toText(findParamRaw(params, "stannieruchomosci")),
    heating: toText(findParamRaw(params, "ogrzewanie")),
    kitchen_type: toText(findParamRaw(params, "typkuchni")),
    parking_spaces: parseParkingSpaces(findParamRaw(params, "miejscaparkingowe")),
    province,
    city,
    district,
    street: toText(findParamRaw(params, "ulica")),
    lat,
    lng,
    is_primary_market: toBool(findParamRaw(params, "rynek_pierwotny")),
    is_exclusive: toBool(findParamRaw(params, "wylacznosc")),
    is_without_commission: toBool(findParamRaw(params, "bezprowizji")),
    virtual_tour_url: toText(findParamRaw(params, "wirtualnawizyta")),
    source_updated_at: toTimestamp(findParamRaw(params, "dataaktualizacji")),
    agent_name,
    agent_email: toText(findParamRaw(params, "agent_email")),
    agent_phone_office: toText(findParamRaw(params, "agent_tel_biuro")),
    agent_phone_mobile: toText(findParamRaw(params, "agent_tel_kom")),
    raw_params,
    image_filenames,
  };
}

// Parsowanie wartości parametru wg typu (do raw_params)
function parseParamValue(value: string, typ: string): unknown {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  switch (typ.toLowerCase()) {
    case "int":
    case "integer":
      return toInt(value);
    case "real":
    case "float":
      return toFloat(value);
    case "bool":
    case "boolean":
      return toBool(value);
    case "text":
    default:
      return String(value).trim();
  }
}
