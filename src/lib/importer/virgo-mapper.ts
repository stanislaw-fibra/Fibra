import { pickYoutubeUrl } from "@/lib/offers-query";
import { cleanDescription } from "./description-cleaner";
import type { MappedOffer, OfferCategory, OfferListingType } from "./field-mapper";
import type { VirgoAgent, VirgoOfferNode } from "./virgo-parser";

// Mapuje pojedynczą <Oferta> z VIRGO na ten sam MappedOffer, którego używa reszta
// pipeline'u (offer-sync, image-uploader). Dzięki temu strona i panel zostają bez zmian.
//
// VIRGO trzyma to samo pole raz jako atrybut, raz jako element-dziecko (zależnie od
// kategorii oferty), więc `field()` patrzy w oba miejsca.

const str = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (o["#text"] !== undefined) return String(o["#text"]);
  }
  return "";
};

// Supabase Storage odrzuca klucze z polskimi znakami/spacją ("Invalid key"). Klucz =
// `${galactica_offer_id}/${order}_${filename}`, więc filename musi być czystym ASCII.
const PL_MAP: Record<string, string> = {
  ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
  Ą: "A", Ć: "C", Ę: "E", Ł: "L", Ń: "N", Ó: "O", Ś: "S", Ź: "Z", Ż: "Z",
};
function sanitizeFilename(name: string): string {
  return name
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (c) => PL_MAP[c] ?? c)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]/g, "_");
}

// Nazwa pliku jednoznacznie wskazująca na rzut/plan - łapiemy też zdjęcia, którym
// Galactica nie ustawiła `typ=Rzut` (jak robi OtoDom). Wąsko, żeby nie brać zdjęć
// pokoi: „rzut z wymiarami", „rzut parteru", „układ pomieszczeń", „kondygnacja".
//
// `rzut` MUSI być osobnym słowem (lookbehind na literę), inaczej łapaliśmy polskie
// „Zrzut ekranu" (screenshot) - w środku siedzi ciąg „rzut" - i pierwsze lepsze
// zdjęcie oferty wskakiwało jako rzut (zgłoszone przez Romana, FIB-DS-4127). Uwaga:
// separatorem w nazwach plików bywa `_`, który dla `\b` jest znakiem słowa, więc `\b`
// gubiłoby „parter_rzut" - stąd negatywny lookbehind na dowolną literę, nie `\b`.
// To NIE wyklucza screenshotów na twardo: „Zrzut ekranu" nadal trafi do rzutu, jeśli
// Galactica otaguje go `typ=Rzut` (osobny sygnał `isRzutTyp`) albo nazwa niesie realne
// słowo rzutu (np. „zrzut - rzut parteru").
const RZUT_FILENAME_RE = /(?<!\p{L})rzut|wymiar|uk[lł]ad|kondygnacj/iu;

function attr(node: VirgoOfferNode, name: string): string | null {
  const v = node[`@_${name}`];
  return v === undefined || v === null ? null : String(v).trim();
}

function childText(node: VirgoOfferNode, name: string): string | null {
  const v = node[name];
  if (v === undefined || v === null) return null;
  const s = str(v).trim();
  return s || null;
}

// Pole: najpierw atrybut, potem element-dziecko (to samo pole bywa w obu miejscach).
function field(node: VirgoOfferNode, name: string): string | null {
  return attr(node, name) ?? childText(node, name);
}

// Link wirtualnego spaceru. UWAGA: w feedzie VIRGO `WirtualnaWizytaLink` to NIE jest
// pole tekstowe, tylko KONTENER z dzieckiem <Url>:
//   <WirtualnaWizytaLink><Url>https://spacer3d...</Url></WirtualnaWizytaLink>
// Bywa też pojedynczym <Url> (string) albo kilkoma (array) - bierzemy pierwszy niepusty.
// Dla bezpieczeństwa obsługujemy też wariant, gdy całość przyszłaby jako goły string.
function virtualTourUrl(node: VirgoOfferNode): string | null {
  const v = node["WirtualnaWizytaLink"];
  if (v === undefined || v === null) return null;
  if (typeof v === "string") return toText(v);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    const url = o["Url"] ?? o["url"] ?? o["#text"];
    if (Array.isArray(url)) {
      return url.map((u) => str(u).trim()).find((s) => s.length > 0) ?? null;
    }
    const s = str(url).trim();
    return s || null;
  }
  return null;
}

const toFloat = (v: string | null): number | null => {
  if (v === null) return null;
  const s = v.trim().replace(/\s+/g, "").replace(",", ".");
  if (!s) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

const toInt = (v: string | null): number | null => {
  if (v === null) return null;
  const s = v.trim().replace(",", ".");
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
};

const toBool = (v: string | null): boolean | null => {
  if (v === null) return null;
  const s = v.trim().toLowerCase();
  if (!s) return null;
  if (s === "1" || s === "true" || s === "tak") return true;
  if (s === "0" || s === "false" || s === "nie") return false;
  return null;
};

const toText = (v: string | null): string | null => {
  if (v === null) return null;
  const s = v.trim();
  return s || null;
};

function toTimestamp(v: string | null): string | null {
  const s = toText(v);
  if (!s) return null;
  const normalized = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function mapCategory(przedmiot: string | null): OfferCategory {
  switch ((przedmiot ?? "").toLowerCase().trim()) {
    case "mieszkanie":
    case "pokoj":
    case "pokój":
      return "mieszkania";
    case "dom":
      return "domy";
    case "dzialka":
    case "działka":
      return "dzialki";
    case "lokal":
      return "lokale";
    case "biurowiec":
    case "hala":
    case "obiekt":
    case "garaz":
    case "garaż":
    case "magazyn":
      return "obiekty";
    default:
      return "lokale";
  }
}

function mapListingType(wynajem: string | null): OfferListingType {
  return toBool(wynajem) === true ? "wynajem" : "sprzedaz";
}

// Atrybuty + elementy potomne, które trafiają do dedykowanych kolumn - NIE dublujemy
// ich w raw_params. Wszystko inne ląduje w raw_params (faithful zapas ~110 pól VIRGO).
const CONSUMED = new Set([
  "Symbol",
  "Przedmiot",
  "Wynajem",
  "Agent",
  "Cena",
  "Waluta",
  "Pierwotny",
  "Wojewodztwo",
  "Powiat",
  "Lokalizacja",
  "Dzielnica",
  "Ulica",
  "MapSzerokoscGeogr",
  "MapDlugoscGeogr",
  "IloscPokoi",
  "PowierzchniaCalkowita",
  "PowierzchniaUzytkowa",
  "PowierzchniaDzialki",
  "Pietro",
  "IloscSypialni",
  "IloscLazienek",
  "IloscPieter",
  "RokBudowy",
  "Balkon",
  "Taras",
  "Piwnica",
  "WindaJest",
  "Klimatyzacja",
  "MaterialKonstrukcyjny",
  "StanBudynku",
  "StanLokaluLista",
  "Ogrzewanie",
  "IloscMiejscParking",
  "WirtualnaWizytaLink",
  "DataAktualizacji",
  "ZeroProwizji",
  "WylacznoscOd",
  "TytulOferty",
  "UwagiOpis",
  "Zdjecia",
]);

// Upraszcza dowolną wartość z XML-a do JSON-friendly postaci dla raw_params.
function simplify(v: unknown, depth = 0): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return v;
  if (Array.isArray(v)) return v.map((x) => simplify(x, depth + 1));
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    // <X><lista>a</lista><lista>b</lista></X> -> ["a","b"]
    if (o.lista !== undefined) {
      const l = o.lista;
      return Array.isArray(l) ? l.map((x) => str(x).trim()) : [str(l).trim()];
    }
    if (o["#text"] !== undefined) return str(o).trim();
    if (depth >= 3) return null;
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(o)) {
      if (k === "#text") continue;
      out[k.startsWith("@_") ? k.slice(2) : k] = simplify(val, depth + 1);
    }
    return Object.keys(out).length ? out : null;
  }
  return null;
}

export function mapVirgoOffer(
  node: VirgoOfferNode,
  agents: Map<string, VirgoAgent>,
): MappedOffer {
  // KLUCZ oferty = atrybut Symbol (np. "FIB-BS-3786") - to ten sam identyfikator, którego
  // używał stary import FTP (galactica_offer_id w bazie). Numeryczne ID VIRGO ("1135771")
  // to wewnętrzny klucz Galactiki i NIE pokrywa się z bazą - trzymamy je tylko w raw_params.
  const galactica_offer_id = attr(node, "Symbol") ?? attr(node, "ID") ?? "";

  // Cena + waluta
  const price = toFloat(field(node, "Cena"));
  const waluta = (field(node, "Waluta") ?? "PLN").toUpperCase();
  const currency: MappedOffer["currency"] =
    waluta === "EUR" ? "EUR" : waluta === "USD" ? "USD" : "PLN";

  // Agent po ID-ref
  const agentRef = attr(node, "Agent");
  const agent = agentRef ? agents.get(agentRef) : undefined;

  // Zdjęcia + YouTube z <Zdjecia><Foto>
  const image_filenames: MappedOffer["image_filenames"] = [];
  const floorplan_filenames: string[] = [];
  let youtubeFromFilmy: string | null = null;
  const zdjecia = node.Zdjecia as Record<string, unknown> | undefined;
  const fotos = (zdjecia?.Foto as Record<string, unknown>[] | undefined) ?? [];
  for (const f of fotos) {
    const typ = (childText(f, "typ") ?? "").toLowerCase();
    const plik = childText(f, "plik");
    const lp = toInt(childText(f, "lp"));
    const fotoId = toInt(attr(f, "ID"));
    if (typ === "filmy") {
      youtubeFromFilmy = youtubeFromFilmy ?? toText(childText(f, "LinkFilmYouTube"));
      continue;
    }
    // Bierzemy zdjęcia (typ "Zdjecie") ORAZ rzuty (typ "Rzut"). Galactica taguje rzuty
    // osobno - wcześniej je gubiliśmy. Rzut ląduje w galerii (jak zdjęcie) i dodatkowo
    // trafia do floorplan_filenames, żeby downstream dopiął go jako rzut (offer_floorplans).
    const isRzutTyp = typ === "rzut";
    if (typ && typ !== "zdjecie" && !isRzutTyp) continue; // pomijamy tylko Dokumenty/inne
    if (!plik || fotoId === null) continue;
    const filename = sanitizeFilename(plik);
    image_filenames.push({
      order: lp ?? image_filenames.length + 1,
      filename,
      fotoId,
    });
    // Rzut = tag `typ=Rzut` LUB nazwa pliku jednoznacznie wskazująca na rzut.
    // Galactica często wrzuca rzut 2D ("rzut z wymiarami.jpg") jako zwykłe zdjęcie
    // (typ=Zdjecie), a OtoDom i tak pokazuje go jako rzut - łapie go po nazwie.
    // Robimy to samo. Wzorce wąskie (rzut/wymiar/układ/kondygnacja), żeby NIE łapać
    // zdjęć pokoi typu "14 pokój piętro.jpg" (brak słów rzut/wymiar).
    if (isRzutTyp || RZUT_FILENAME_RE.test(plik)) floorplan_filenames.push(filename);
  }
  image_filenames.sort((a, b) => a.order - b.order);

  // Opis (HTML) -> cleaner; tytuł
  const agent_name = agent?.name ?? null;
  const description = cleanDescription(field(node, "UwagiOpis"), agent_name);
  let title = toText(field(node, "TytulOferty"));
  if (!title && description) {
    const firstLine = description.split("\n").find((l) => l.trim() !== "")?.trim();
    if (firstLine) title = firstLine.length > 80 ? firstLine.slice(0, 80).trim() : firstLine;
  }

  // raw_params: wszystkie atrybuty i dzieci poza CONSUMED
  const raw_params: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(node)) {
    const name = key.startsWith("@_") ? key.slice(2) : key;
    if (name === "#text") continue;
    if (CONSUMED.has(name)) continue;
    const simplified = simplify(val);
    if (simplified !== null && simplified !== "") raw_params[name] = simplified;
  }

  const has_elevator =
    toBool(field(node, "WindaJest")) ??
    ((toInt(field(node, "IloscWind")) ?? 0) > 0 ? true : null);

  return {
    galactica_offer_id,
    category: mapCategory(attr(node, "Przedmiot")),
    listing_type: mapListingType(attr(node, "Wynajem")),
    title,
    advertisement_text: title,
    description,
    price,
    currency,
    area_total: toFloat(field(node, "PowierzchniaCalkowita")),
    area_usable: toFloat(field(node, "PowierzchniaUzytkowa")),
    area_plot:
      toFloat(field(node, "PowierzchniaDzialki")) ??
      (mapCategory(attr(node, "Przedmiot")) === "dzialki"
        ? toFloat(field(node, "PowierzchniaCalkowita"))
        : null),
    rooms: toInt(field(node, "IloscPokoi")),
    bedrooms: toInt(field(node, "IloscSypialni")),
    bathrooms: toInt(field(node, "IloscLazienek")),
    floor: toInt(field(node, "Pietro")),
    floors_total: toInt(field(node, "IloscPieter")),
    year_built: toInt(field(node, "RokBudowy")),
    has_balcony: toBool(field(node, "Balkon")),
    has_terrace: toBool(field(node, "Taras")),
    has_basement: toBool(field(node, "Piwnica")) ?? toBool(field(node, "Podpiwniczenie")),
    has_elevator,
    has_air_conditioning: toBool(field(node, "Klimatyzacja")),
    building_material:
      toText(field(node, "MaterialKonstrukcyjny")) ?? toText(field(node, "TechnologiaBudowlana")),
    building_state: toText(field(node, "StanBudynku")) ?? toText(field(node, "StanWybudowania")),
    property_state: toText(field(node, "StanLokaluLista")),
    heating: toText(field(node, "Ogrzewanie")),
    kitchen_type: null,
    parking_spaces: toInt(field(node, "IloscMiejscParking")),
    province: toText(field(node, "Wojewodztwo")),
    city: toText(field(node, "Lokalizacja")),
    district: toText(field(node, "Dzielnica")),
    street: toText(field(node, "Ulica")),
    // VIRGO: MapSzerokoscGeogr = szerokość (lat), MapDlugoscGeogr = długość (lng).
    lat: toFloat(field(node, "MapSzerokoscGeogr")),
    lng: toFloat(field(node, "MapDlugoscGeogr")),
    is_primary_market: toBool(attr(node, "Pierwotny")),
    is_exclusive: field(node, "WylacznoscOd") ? true : null,
    is_without_commission: toBool(field(node, "ZeroProwizji")),
    virtual_tour_url: virtualTourUrl(node),
    source_updated_at:
      toTimestamp(field(node, "DataAktualizacji")) ??
      toTimestamp(field(node, "DataModyfikacjiListing")) ??
      toTimestamp(field(node, "DataEdycji")),
    agent_name,
    agent_email: agent?.email ?? null,
    agent_phone_office: null,
    agent_phone_mobile: agent?.phoneMobile ?? null,
    youtube_url: youtubeFromFilmy ?? pickYoutubeUrl(raw_params) ?? null,
    raw_params,
    image_filenames,
    floorplan_filenames,
  };
}
