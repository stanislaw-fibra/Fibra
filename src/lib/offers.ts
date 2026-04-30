/**
 * Oferty - dane demonstracyjne dla regionu Fibry (powiat rybnicki / wodzisławski).
 * Docelowo: Galactica + Cloudflare Stream.
 */

export type OfferKind = "apartament" | "dom" | "penthouse" | "lokal" | "grunt";

export interface Offer {
  /** Gdy oferta z Supabase - ten sam co `slug` w URL (uuid). */
  id?: string;
  slug: string;
  title: string;
  subtitle?: string;
  city: string;
  district?: string;
  kind: OfferKind;
  kindLabel: string;
  area: number;
  rooms?: number;
  priceFrom?: number;
  priceLabel?: string;
  tagline: string;
  excerpt: string;
  /** Krótkie punkty (np. mocki) - gdy brak parametrów z bazy, sekcja na stronie oferty może je pokazać jako fallback. */
  highlights?: string[];
  /** Pełny opis z CRM / Supabase (`description`) - wyświetlany jako jeden blok, bez dzielenia na zdania. */
  fullDescription?: string;
  poster: string;
  videoSrc?: string;
  /** Cloudflare Stream - krótki klip (karty, hero). */
  streamId?: string;
  /** Cloudflare Stream - dłuższy klip na stronie oferty, jeśli jest w bazie. */
  streamIdLong?: string;
  gallery?: string[];
  isNew?: boolean;
  isExclusive?: boolean;
  refNumber?: string;
  body?: string[];
  rokBudowy?: number;
  pietro?: string;
  miejscParkingowych?: number;
  powDzialkiM2?: number;
  energetyka?: string;
  statusOferty?: "wolna" | "w rozmowach" | "zarezerwowana";
  /** Z bazy: `sprzedaz` | `wynajem` */
  listingType?: "sprzedaz" | "wynajem";
  /** URL obrazu rzutu / wizualizacji 3D układu — z `raw_params` (Galactica), gdy jest w imporcie. */
  floorPlanImageUrl?: string;
  /** PDF rzutu (panel/admin) — otwierany w nowej karcie. */
  floorPlanPdfUrl?: string;
  /** Dodatkowe zdjęcia rzutu (np. parter + piętro). */
  floorPlanImages?: string[];
  /** Dodatkowe PDF-y rzutu. */
  floorPlanPdfs?: { url: string; label?: string }[];
  bedrooms?: number;
  bathrooms?: number;
  /** Pow. użytkowa (m²), gdy znana osobno od głównego `area`. */
  areaUsableM2?: number;
  /** Pow. całkowita (m²). */
  areaTotalM2?: number;
  buildingMaterial?: string;
  buildingState?: string;
  propertyState?: string;
  heating?: string;
  kitchenType?: string;
  marketType?: string;
  hasBalcony?: boolean;
  hasTerrace?: boolean;
  hasBasement?: boolean;
  hasGarden?: boolean;
  hasLoggia?: boolean;
  hasElevator?: boolean;
  hasAirConditioning?: boolean;
  isPriceNegotiable?: boolean;
  virtualTourUrl?: string;
  /** Link do YouTube z Galactiki (param „wideo"). Fallback hero i landing page. */
  youtubeUrl?: string;
  /** Flaga — true gdy oferta ma krótki, pionowy film (Cloudflare Stream). */
  hasShortVideo?: boolean;
  /** Data ostatniej aktualizacji (ISO) — do sortowania w katalogu. */
  updatedAt?: string;
  /** Agent przypisany do oferty (z Galactiki / panelu). */
  agentName?: string;
  agentPhone?: string;
  agentPhoneOffice?: string;
  agentEmail?: string;
  /** URL zdjęcia agenta (bucket `agent-photos` w Supabase). Gdy puste — pokazujemy inicjały. */
  agentPhotoUrl?: string;
}

/**
 * Lista demonstracyjna pozostawiona PUSTA — wszystkie oferty są pobierane z Supabase
 * (`getAllOffers` / `getAllActiveOffers` / `getOfferBySlug` w `offers-query.ts`).
 * Eksport `OFFERS` zachowujemy dla zgodności typu, ale niczego nie wstrzykujemy do UI.
 */
export const OFFERS: Offer[] = [];

export function getOffer(slug: string): Offer | undefined {
  return OFFERS.find((o) => o.slug === slug);
}

/**
 * Wybiera z galerii URL prawdopodobnie będący rzutem / wizualizacją układu (np. 3D z opisu pliku),
 * gdy Galactica nie wysyła osobnego parametru. Heurystyka po ścieżce URL (nazwa pliku).
 */
export function pickFloorPlanImageFromGallery(gallery: string[] | undefined): string | undefined {
  if (!gallery?.length) return undefined;

  function pathParts(url: string): { raw: string; decoded: string } {
    try {
      const u = new URL(url);
      const raw = `${u.pathname}${u.search}`.toLowerCase();
      let decoded = raw;
      try {
        decoded = decodeURIComponent(raw);
      } catch {
        decoded = raw;
      }
      return { raw, decoded: decoded.toLowerCase() };
    } catch {
      const s = url.toLowerCase();
      return { raw: s, decoded: s };
    }
  }

  const patterns = [
    /rzut/i,
    /uklad|układ/i,
    /floor[_-]?plan/i,
    /layout[_-]?(mieszkan|apartment|flat|lokal)/i,
    /plan[_-]?(mieszkan|lokalu|rzut|3d)/i,
    /(^|\/|_|-)plan\.(png|jpe?g|webp)(\?|$)/i,
    /karta[_-]?(lokal|mieszkan)/i,
    /izometr|axonometr|isometric/i,
    /wizualizacja[^/]{0,40}(rzut|plan|3d|uklad|układ)/i,
    /(rzut|uklad|układ)[^/]{0,50}3d/i,
    /3d[^/]{0,50}(rzut|uklad|układ|plan)/i,
    /pomieszcze[^/]{0,30}(rzut|plan|3d)/i,
  ];

  for (const url of gallery) {
    const u = url?.trim();
    if (!u || !/^https?:\/\//i.test(u)) continue;
    const { raw, decoded } = pathParts(u);
    const hay = `${raw} ${decoded}`;
    if (
      /\b3d\b/i.test(hay) &&
      /(m2|m²|%c2%b2)/i.test(hay) &&
      /(rzut|plan|uklad|układ|layout|karta)/i.test(hay)
    ) {
      return u;
    }
    if (patterns.some((re) => re.test(hay))) return u;
  }
  return undefined;
}

export function priceFormat(pln?: number): string {
  if (!pln) return "Cena na zapytanie";
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(pln);
}

export function priceShort(pln?: number): string {
  if (!pln) return "na zapytanie";
  if (pln >= 1_000_000) {
    const m = pln / 1_000_000;
    return `${m.toFixed(m % 1 === 0 ? 0 : 2).replace(".", ",")} mln zł`;
  }
  return new Intl.NumberFormat("pl-PL").format(pln) + " zł";
}
