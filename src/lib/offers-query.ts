import "server-only";

import { injectBlockBreaks } from "@/lib/description-blocks";
import type { Offer, OfferKind } from "@/lib/offers";
import { getSupabaseAnon } from "@/lib/supabase/server-anon";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const OFFER_SELECT = `
  id,
  slug,
  galactica_offer_id,
  category,
  listing_type,
  title,
  advertisement_text,
  description,
  raw_params,
  floor_plan_image_url,
  floor_plan_pdf_url,
  youtube_url,
  updated_at,
  price,
  currency,
  area_total,
  area_usable,
  area_plot,
  rooms,
  floor,
  floors_total,
  year_built,
  city,
  district,
  neighborhood,
  street,
  parking_spaces,
  bathrooms,
  bedrooms,
  building_material,
  building_state,
  property_state,
  heating,
  kitchen_type,
  market_type,
  is_exclusive,
  is_primary_market,
  has_balcony,
  has_terrace,
  has_basement,
  has_garden,
  has_loggia,
  has_elevator,
  has_air_conditioning,
  is_price_negotiable,
  virtual_tour_url,
  agent_name,
  agent_phone_mobile,
  agent_phone_office,
  agent_email,
  agents (
    photo_url,
    slug
  ),
  offer_media (
    cloudflare_video_short_id,
    cloudflare_video_long_id,
    poster_image_url,
    status
  ),
  offer_images (
    image_url,
    order_index,
    is_primary
  ),
  offer_floorplans (
    kind,
    label,
    url,
    order_index
  )
`;

/** Lista publiczna (homepage, /oferty): tylko oferty z krótkim filmem Stream. */
const OFFER_SELECT_PUBLIC_LIST = OFFER_SELECT.replace("offer_media (", "offer_media!inner (");

// Backward compatibility: zanim migracja dojdzie na środowisko docelowe,
// kolumny `floor_plan_*` / `youtube_url` mogą jeszcze nie istnieć. Wtedy Supabase
// zwróci błąd przy select-cie. Robimy retry na legacy select bez tych kolumn,
// zamiast zrywać render / spamować warnami.
const OFFER_SELECT_LEGACY = OFFER_SELECT.replace(
  "  floor_plan_image_url,\n  floor_plan_pdf_url,\n",
  "",
).replace("  youtube_url,\n", "");
const OFFER_SELECT_PUBLIC_LIST_LEGACY = OFFER_SELECT_LEGACY.replace("offer_media (", "offer_media!inner (");

const OFFER_SELECT_NO_YOUTUBE = OFFER_SELECT.replace("  youtube_url,\n", "");
const OFFER_SELECT_PUBLIC_LIST_NO_YOUTUBE = OFFER_SELECT_NO_YOUTUBE.replace("offer_media (", "offer_media!inner (");

// Legacy: kolumna `agents.slug` może jeszcze nie istnieć (świeży deploy, migracja
// 20260512000000_agents_slug.sql niezaaplikowana). Wtedy embed `agents(slug)` zwróci
// błąd - robimy retry bez `slug`, agent po prostu nie ma URL-a, public page 404.
const OFFER_SELECT_NO_AGENT_SLUG = OFFER_SELECT.replace(
  /(agents \(\s*\n\s*photo_url),\s*\n\s*slug\s*\n/,
  "$1\n",
);
const OFFER_SELECT_PUBLIC_LIST_NO_AGENT_SLUG = OFFER_SELECT_NO_AGENT_SLUG.replace("offer_media (", "offer_media!inner (");

// Legacy: `offer_floorplans` relacja może jeszcze nie istnieć (brak tabeli / brak FK cache).
// Usuwamy cały fragment relacji, żeby select działał na starym schemacie.
const OFFER_SELECT_NO_FLOORPLANS = OFFER_SELECT.replace(
  /\s*,\s*offer_floorplans\s*\([\s\S]*?\)\s*\n/,
  "\n",
);
const OFFER_SELECT_PUBLIC_LIST_NO_FLOORPLANS = OFFER_SELECT_NO_FLOORPLANS.replace("offer_media (", "offer_media!inner (");

function isMissingFloorPlanColumnsError(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes("does not exist") && (m.includes("floor_plan_image_url") || m.includes("floor_plan_pdf_url"));
}

function isMissingYoutubeColumnError(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes("does not exist") && m.includes("youtube_url");
}

function isMissingAgentSlugColumnError(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    (m.includes("does not exist") && m.includes("slug")) ||
    (m.includes("schema cache") && m.includes("slug"))
  );
}

function isMissingFloorPlansRelationError(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    (m.includes("does not exist") && (m.includes("offer_floorplans") || m.includes("relation") || m.includes("table"))) ||
    m.includes("could not find a relationship between") ||
    (m.includes("schema cache") && m.includes("offer_floorplans"))
  );
}

type MediaRow = {
  cloudflare_video_short_id: string | null;
  cloudflare_video_long_id: string | null;
  poster_image_url: string | null;
  status: string | null;
};

type ImageRow = {
  image_url: string;
  order_index: number | null;
  is_primary: boolean | null;
};

type OfferRow = {
  id: string;
  slug: string | null;
  galactica_offer_id: string;
  category: string;
  listing_type: string;
  title: string | null;
  advertisement_text: string | null;
  description: string | null;
  raw_params: Record<string, unknown> | null;
  floor_plan_image_url: string | null;
  floor_plan_pdf_url: string | null;
  youtube_url?: string | null;
  updated_at: string | null;
  price: string | number | null;
  currency: string | null;
  area_total: string | number | null;
  area_usable: string | number | null;
  area_plot: string | number | null;
  rooms: number | null;
  floor: number | null;
  floors_total: number | null;
  year_built: number | null;
  city: string | null;
  district: string | null;
  neighborhood: string | null;
  street: string | null;
  parking_spaces: number | null;
  bathrooms: number | null;
  bedrooms: number | null;
  building_material: string | null;
  building_state: string | null;
  property_state: string | null;
  heating: string | null;
  kitchen_type: string | null;
  market_type: string | null;
  is_exclusive: boolean | null;
  is_primary_market: boolean | null;
  has_balcony: boolean | null;
  has_terrace: boolean | null;
  has_basement: boolean | null;
  has_garden: boolean | null;
  has_loggia: boolean | null;
  has_elevator: boolean | null;
  has_air_conditioning: boolean | null;
  is_price_negotiable: boolean | null;
  virtual_tour_url: string | null;
  agent_name: string | null;
  agent_phone_mobile: string | null;
  agent_phone_office: string | null;
  agent_email: string | null;
  agents: { photo_url: string | null; slug: string | null } | { photo_url: string | null; slug: string | null }[] | null;
  offer_media: MediaRow | MediaRow[] | null;
  offer_images: ImageRow[] | null;
  offer_floorplans?: {
    kind: "image" | "pdf";
    label: string | null;
    url: string;
    order_index: number | null;
  }[] | null;
};

function num(v: string | number | null | undefined): number {
  if (v == null || v === "") return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function firstRel<T>(x: T | T[] | null | undefined): T | undefined {
  if (x == null) return undefined;
  return Array.isArray(x) ? x[0] : x;
}

/** W bucketcie `agent-photos` Arkadiusz i Justyna mają wersje PNG; stare `photo_url` w bazie mogą wskazywać na `.jpg`. */
function normalizeAgentHeadshotUrl(url: string | null | undefined): string | undefined {
  const u = url?.trim();
  if (!u) return undefined;
  const lower = u.toLowerCase();
  if (!lower.includes("agent-photos")) return u;
  if (
    (lower.includes("arkadiusz") && lower.includes("jezusek")) ||
    (lower.includes("justyna") && lower.includes("polok"))
  ) {
    return u.replace(/\.jpg\b/i, ".png");
  }
  return u;
}

/**
 * Gdy `offers.agent_id` jest puste lub embed `agents` nie zwraca wiersza (np. stary import),
 * a w wierszu jest `agent_name` - dociągnij `photo_url` z tabeli `agents` po dokładnym dopasowaniu nazwy.
 */
async function attachAgentPhotoUrlIfMissing(offer: Offer): Promise<Offer> {
  if (offer.agentPhotoUrl?.trim()) return offer;
  const name = offer.agentName?.trim();
  if (!name) return offer;

  const supabase = getSupabaseAnon();
  if (!supabase) return offer;

  const { data, error } = await supabase.from("agents").select("photo_url").eq("name", name).maybeSingle();
  if (error) {
    console.warn("[offers-query] attachAgentPhotoUrlIfMissing:", error.message);
    return offer;
  }
  const url = normalizeAgentHeadshotUrl(data?.photo_url?.trim());
  if (!url) return offer;
  return { ...offer, agentPhotoUrl: url };
}

/**
 * Dociąga `cloudflare_video_id` autoprezentacji agenta (kolumna `agents.cloudflare_video_id`)
 * dla pojedynczej oferty (strona szczegółów). Embed `agents(...)` w głównym selekcie celowo
 * tego nie pobiera (lista/katalog tego nie potrzebują), więc robimy lekki dociąg po `slug`
 * lub - gdy brak slug - po dokładnej nazwie. Brak kolumny / błąd → po prostu zostaje bez wideo.
 */
async function attachAgentVideoId(offer: Offer): Promise<Offer> {
  if (offer.agentVideoId?.trim()) return offer;
  const slug = offer.agentSlug?.trim();
  const name = offer.agentName?.trim();
  if (!slug && !name) return offer;

  const supabase = getSupabaseAnon();
  if (!supabase) return offer;

  try {
    let videoId: string | null = null;
    if (slug) {
      const { data, error } = await supabase
        .from("agents")
        .select("cloudflare_video_id")
        .eq("slug", slug)
        .maybeSingle();
      if (error) return offer; // np. brak kolumny - cicho rezygnujemy z wideo
      videoId = (data?.cloudflare_video_id as string | null) ?? null;
    }
    if (!videoId && name) {
      const { data, error } = await supabase
        .from("agents")
        .select("cloudflare_video_id")
        .eq("name", name)
        .maybeSingle();
      if (error) return offer;
      videoId = (data?.cloudflare_video_id as string | null) ?? null;
    }
    const id = videoId?.trim();
    if (!id) return offer;
    return { ...offer, agentVideoId: id };
  } catch {
    return offer;
  }
}

function streamThumb(streamId: string, h = 1200) {
  return `https://videodelivery.net/${streamId}/thumbnails/thumbnail.jpg?time=0s&height=${h}`;
}

export function pickYoutubeUrl(raw: Record<string, unknown> | null | undefined): string | undefined {
  if (!raw) return undefined;
  const candidates = [raw.wideo, raw.video, raw.film, raw.youtube];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().includes("youtu")) return c.trim();
  }
  return undefined;
}

/**
 * Data DODANIA oferty w systemie źródłowym (Galactica/VIRGO). VIRGO podaje ją jako atrybut
 * `DataWprowadzenia`, który (nie będąc w zestawie CONSUMED mappera) trafia wprost do `raw_params`
 * przy każdym imporcie - dlatego czytamy ją stąd, bez osobnej kolumny. To po tej dacie sortuje
 * „Najnowsze" oficjalna strona Galactiki; nasze `updated_at` to tylko czas ostatniego sync-u
 * (po pełnym imporcie identyczny dla wszystkich ofert), więc nie nadaje się na „najnowsze".
 * Zwraca ISO, by dało się porównywać 1:1 z `updated_at`.
 */
export function pickSourceCreatedAt(
  raw: Record<string, unknown> | null | undefined,
): string | undefined {
  if (!raw) return undefined;
  const key = Object.keys(raw).find((k) =>
    /^data(wprowadzenia|dodania|utworzenia)$/i.test(k),
  );
  const value = key ? raw[key] : undefined;
  if (typeof value !== "string") return undefined;
  const s = value.trim();
  if (!s) return undefined;
  const normalized = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/**
 * Czyta efektywny link YouTube z kolumny `offers.youtube_url`. To jedyne źródło prawdy do
 * wyświetlania: import (reconciliacja w offer-sync) i ręczna edycja w panelu zapisują tu już
 * gotową wartość. Świadome wyczyszczenie (null/puste) oznacza „brak filmu" - dlatego NIE ma
 * tu już fallbacku do `raw_params` (inaczej usunięty film wracałby z importowego linku).
 * Migracja 20260609 backfilluje kolumnę z raw_params, więc stare oferty nic nie tracą.
 */
export function resolveYoutubeUrl(explicit: string | null | undefined): string | undefined {
  const e = explicit?.trim();
  return e && e.length > 0 ? e : undefined;
}

function normalizeRawUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const s = value.trim().replace(/&amp;/g, "&");
  if (!/^https?:\/\//i.test(s)) return undefined;
  return s;
}

/**
 * Link do obrazu rzutu / wizualizacji układu z parametrów Galactica (trafiają do `raw_params`).
 * Nazwy parametrów bywają różne - próbujemy znanych kluczy, potem heurystykę po nazwie pola.
 */
function pickFloorPlanImageUrl(raw: Record<string, unknown> | null | undefined): string | undefined {
  if (!raw) return undefined;
  const preferredKeys = [
    "rzut3d",
    "rzut_3d",
    "plan3d",
    "plan_3d",
    "wizualizacja_rzutu",
    "wizualizacja_rzutu_3d",
    "rzut_wizualizacja",
    "rzut_url",
    "link_do_rzutu",
    "rzut",
    "plan_mieszkania",
    "planmieszkania",
    "uklad_mieszkania",
    "rzut_mieszkania",
  ];
  for (const key of preferredKeys) {
    const u = normalizeRawUrl(raw[key]);
    if (u) return u;
  }
  for (const [key, val] of Object.entries(raw)) {
    if (key.startsWith("__")) continue;
    const u = normalizeRawUrl(val);
    if (!u) continue;
    const kl = key.toLowerCase();
    if (
      kl.includes("rzut") ||
      (kl.includes("plan") && (kl.includes("3d") || kl.includes("mieszkan") || kl.includes("lokalu")))
    ) {
      return u;
    }
  }
  return undefined;
}

function categoryToKind(category: string, title: string): OfferKind {
  const t = (title || "").toLowerCase();
  if (t.includes("penthouse")) return "penthouse";
  switch (category) {
    case "domy":
      return "dom";
    case "dzialki":
      return "grunt";
    case "lokale":
      return "lokal";
    default:
      return "apartament";
  }
}

function kindLabel(kind: OfferKind): string {
  const map: Record<OfferKind, string> = {
    apartament: "Mieszkanie",
    dom: "Dom",
    penthouse: "Penthouse",
    lokal: "Lokal",
    grunt: "Działka",
  };
  return map[kind];
}

function dedupeOffersByRef(offers: Offer[]): Offer[] {
  const seen = new Set<string>();
  return offers.filter((o) => {
    const key = (o.refNumber || o.slug).trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Akceptujemy ofertę tylko, jeśli ma realny materiał wizualny:
 *  - poster z bazy LUB
 *  - co najmniej jedno zdjęcie w galerii LUB
 *  - krótki film Cloudflare (z którego można wyciągnąć kadr).
 *
 * Eliminuje to oferty z pustą galerią albo z fallbackowym placeholderem
 * (np. obrazek z Unsplash dorzucany w mapowaniu, gdy w bazie nic nie ma).
 */
function hasUsableMedia(row: OfferRow): boolean {
  const media = firstRel(row.offer_media);
  const hasPoster = Boolean(media?.poster_image_url?.trim());
  const hasStream = Boolean(media?.cloudflare_video_short_id?.trim());
  const hasImages = Array.isArray(row.offer_images)
    && row.offer_images.some((i) => typeof i?.image_url === "string" && i.image_url.trim().length > 0);
  return hasPoster || hasStream || hasImages;
}

export function mapOfferRow(row: OfferRow): Offer {
  const media = firstRel(row.offer_media);
  const shortId = media?.cloudflare_video_short_id?.trim() || undefined;
  const longId = media?.cloudflare_video_long_id?.trim() || undefined;
  const kind = categoryToKind(row.category, row.title || row.advertisement_text || "");
  const areaUsable = num(row.area_usable);
  const areaTotal = num(row.area_total);
  const areaPlot = num(row.area_plot);
  const area = kind === "grunt" ? (areaPlot || areaTotal || areaUsable) : areaUsable || areaTotal;

  const displayTitle = (row.advertisement_text?.trim() || row.title?.trim() || "Oferta").slice(0, 120);
  // Wstaw breaks blokowe „w locie" - istniejące opisy w bazie były zapisywane bez `\n\n`
  // między akapitami, przez co cały tekst lądował w jednym `<p>` (bez nagłówków, bez list).
  // Re-import jest niepotrzebny - naprawiamy przy odczycie tym samym helperem co importer.
  const desc = injectBlockBreaks(row.description?.trim() || "");
  // Excerpt = plain text (tags inline jak <b>/<u>/<i> stripowane), bo to krótki preview
  // pod kafelkami - formatowanie pojawia się dopiero w pełnym opisie oferty.
  // Strip: usuń tagi open/close, zwij kolejne whitespace, weź pierwsze 217 znaków.
  const plainDesc = desc.replace(/<\/?(?:b|strong|i|em|u)>/gi, "").replace(/\s+/g, " ").trim();
  const excerpt = plainDesc.length > 220 ? `${plainDesc.slice(0, 217)}…` : plainDesc || displayTitle;
  // hasUsableMedia gwarantuje, że co najmniej jedno z trzech źródeł jest realne;
  // przy ekstremalnym braku poster_image_url + brak streamId staje się pierwsze zdjęcie z galerii.
  const firstGalleryImage = row.offer_images?.find((i) => typeof i?.image_url === "string" && i.image_url.trim().length > 0)?.image_url?.trim();
  const poster =
    media?.poster_image_url?.trim() ||
    (shortId ? streamThumb(shortId) : firstGalleryImage || "");

  const images = [...(row.offer_images || [])].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
  );
  const gallery = images.map((i) => i.image_url).filter(Boolean);

  const floor = row.floor;
  const floorsTotal = row.floors_total;
  const pietro =
    floor != null
      ? `${floor}${floorsTotal != null ? ` / ${floorsTotal}` : ""}`
      : undefined;

  const listing = row.listing_type === "wynajem" ? "wynajem" : "sprzedaz";
  const priceVal = num(row.price);
  const priceFrom = priceVal > 0 ? Math.round(priceVal) : undefined;

  const marketType =
    row.market_type?.trim() ||
    (row.is_primary_market === true ? "Rynek pierwotny" : row.is_primary_market === false ? "Rynek wtórny" : undefined);

  const floorplans = [...(row.offer_floorplans ?? [])]
    .filter((x) => x && typeof x.url === "string" && x.url.trim().length > 0)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  const floorPlanImages = floorplans
    .filter((x) => x.kind === "image")
    .map((x) => x.url)
    .filter(Boolean);

  const floorPlanPdfs = floorplans
    .filter((x) => x.kind === "pdf")
    .map((x) => ({ url: x.url, label: x.label?.trim() || undefined }))
    .filter((x) => Boolean(x.url));

  return {
    id: row.id,
    slug: row.slug?.trim() || row.id,
    title: displayTitle,
    subtitle: row.district?.trim() || row.neighborhood?.trim() || undefined,
    city: row.city?.trim() || "",
    district: row.district?.trim() || undefined,
    kind,
    kindLabel: kindLabel(kind),
    area: area || 0,
    areaUsableM2: areaUsable > 0 ? Math.round(areaUsable) : undefined,
    areaTotalM2: areaTotal > 0 ? Math.round(areaTotal) : undefined,
    rooms: row.rooms ?? undefined,
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    priceFrom,
    priceLabel: listing === "wynajem" ? "Cena miesięczna" : undefined,
    listingType: listing,
    tagline: row.advertisement_text?.trim() || displayTitle,
    excerpt,
    highlights: [],
    fullDescription: desc.length > 0 ? desc : undefined,
    poster,
    streamId: shortId,
    streamIdLong: longId,
    gallery: gallery.length ? gallery : undefined,
    isExclusive: row.is_exclusive ?? undefined,
    refNumber: row.galactica_offer_id,
    rokBudowy: row.year_built ?? undefined,
    pietro,
    miejscParkingowych: row.parking_spaces ?? undefined,
    powDzialkiM2: areaPlot > 0 ? Math.round(areaPlot) : undefined,
    buildingMaterial: row.building_material?.trim() || undefined,
    buildingState: row.building_state?.trim() || undefined,
    propertyState: row.property_state?.trim() || undefined,
    heating: row.heating?.trim() || undefined,
    kitchenType: row.kitchen_type?.trim() || undefined,
    marketType,
    hasBalcony: row.has_balcony ?? undefined,
    hasTerrace: row.has_terrace ?? undefined,
    hasBasement: row.has_basement ?? undefined,
    hasGarden: row.has_garden ?? undefined,
    hasLoggia: row.has_loggia ?? undefined,
    hasElevator: row.has_elevator ?? undefined,
    hasAirConditioning: row.has_air_conditioning ?? undefined,
    isPriceNegotiable: row.is_price_negotiable ?? undefined,
    virtualTourUrl: row.virtual_tour_url?.trim() || undefined,
    floorPlanImageUrl:
      row.floor_plan_image_url?.trim() || floorPlanImages[0]?.trim() || pickFloorPlanImageUrl(row.raw_params),
    floorPlanPdfUrl: row.floor_plan_pdf_url?.trim() || floorPlanPdfs[0]?.url?.trim() || undefined,
    floorPlanImages: floorPlanImages.length ? floorPlanImages : undefined,
    floorPlanPdfs: floorPlanPdfs.length ? floorPlanPdfs : undefined,
    agentName: row.agent_name?.trim() || undefined,
    agentPhone: row.agent_phone_mobile?.trim() || undefined,
    agentPhoneOffice: row.agent_phone_office?.trim() || undefined,
    agentEmail: row.agent_email?.trim() || undefined,
    agentPhotoUrl: normalizeAgentHeadshotUrl(firstRel(row.agents)?.photo_url?.trim()) || undefined,
    agentSlug: firstRel(row.agents)?.slug?.trim() || undefined,
    youtubeUrl: resolveYoutubeUrl(row.youtube_url ?? null),
    hasShortVideo: Boolean(shortId),
    updatedAt: row.updated_at ?? undefined,
    sourceCreatedAt: pickSourceCreatedAt(row.raw_params),
  };
}

async function fetchPublicListingOfferRows(): Promise<OfferRow[] | null> {
  const supabase = getSupabaseAnon();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("offers")
    .select(OFFER_SELECT_PUBLIC_LIST)
    .eq("is_active", true)
    .not("offer_media.cloudflare_video_short_id", "is", null)
    .order("updated_at", { ascending: false });

  if (error) {
    // If `offer_floorplans` isn't available yet, retry without it.
    if (isMissingFloorPlansRelationError(error.message)) {
      const retry = await supabase
        .from("offers")
        .select(OFFER_SELECT_PUBLIC_LIST_NO_FLOORPLANS)
        .eq("is_active", true)
        .not("offer_media.cloudflare_video_short_id", "is", null)
        .order("updated_at", { ascending: false });
      if (retry.error) {
        console.warn("[offers-query] Supabase public offers list:", retry.error.message);
        return null;
      }
      const rows = ((retry.data ?? []) as unknown) as OfferRow[];
      return rows.filter((row) => {
        const m = firstRel(row.offer_media);
        return Boolean(m?.cloudflare_video_short_id?.trim());
      });
    }
    if (isMissingYoutubeColumnError(error.message)) {
      const retry = await supabase
        .from("offers")
        .select(OFFER_SELECT_PUBLIC_LIST_NO_YOUTUBE)
        .eq("is_active", true)
        .not("offer_media.cloudflare_video_short_id", "is", null)
        .order("updated_at", { ascending: false });
      if (retry.error) {
        console.warn("[offers-query] Supabase public offers list:", retry.error.message);
        return null;
      }
      const rows = ((retry.data ?? []) as unknown) as OfferRow[];
      return rows.filter((row) => {
        const m = firstRel(row.offer_media);
        return Boolean(m?.cloudflare_video_short_id?.trim());
      });
    }
    if (isMissingAgentSlugColumnError(error.message)) {
      const retry = await supabase
        .from("offers")
        .select(OFFER_SELECT_PUBLIC_LIST_NO_AGENT_SLUG)
        .eq("is_active", true)
        .not("offer_media.cloudflare_video_short_id", "is", null)
        .order("updated_at", { ascending: false });
      if (retry.error) {
        console.warn("[offers-query] Supabase public offers list:", retry.error.message);
        return null;
      }
      const rows = ((retry.data ?? []) as unknown) as OfferRow[];
      return rows.filter((row) => {
        const m = firstRel(row.offer_media);
        return Boolean(m?.cloudflare_video_short_id?.trim());
      });
    }
    if (isMissingFloorPlanColumnsError(error.message)) {
      const retry = await supabase
        .from("offers")
        .select(OFFER_SELECT_PUBLIC_LIST_LEGACY)
        .eq("is_active", true)
        .not("offer_media.cloudflare_video_short_id", "is", null)
        .order("updated_at", { ascending: false });
      if (retry.error) {
        console.warn("[offers-query] Supabase public offers list:", retry.error.message);
        return null;
      }
      const rows = ((retry.data ?? []) as unknown) as OfferRow[];
      return rows.filter((row) => {
        const m = firstRel(row.offer_media);
        return Boolean(m?.cloudflare_video_short_id?.trim());
      });
    }
    // Avoid noisy logs for expected transitional states (local schema cache).
    if (!isMissingFloorPlansRelationError(error.message)) {
      console.warn("[offers-query] Supabase public offers list:", error.message);
    }
    return null;
  }
  const rows = ((data ?? []) as unknown) as OfferRow[];
  return rows.filter((row) => {
    const m = firstRel(row.offer_media);
    return Boolean(m?.cloudflare_video_short_id?.trim());
  });
}

async function fetchAllActiveOfferRows(): Promise<OfferRow[] | null> {
  const supabase = getSupabaseAnon();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("offers")
    .select(OFFER_SELECT)
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingFloorPlansRelationError(error.message)) {
      const retry = await supabase
        .from("offers")
        .select(OFFER_SELECT_NO_FLOORPLANS)
        .eq("is_active", true)
        .order("updated_at", { ascending: false });
      if (retry.error) {
        console.warn("[offers-query] Supabase all active offers:", retry.error.message);
        return null;
      }
      return ((retry.data ?? []) as unknown) as OfferRow[];
    }
    if (isMissingYoutubeColumnError(error.message)) {
      const retry = await supabase
        .from("offers")
        .select(OFFER_SELECT_NO_YOUTUBE)
        .eq("is_active", true)
        .order("updated_at", { ascending: false });
      if (retry.error) {
        console.warn("[offers-query] Supabase all active offers:", retry.error.message);
        return null;
      }
      return ((retry.data ?? []) as unknown) as OfferRow[];
    }
    if (isMissingAgentSlugColumnError(error.message)) {
      const retry = await supabase
        .from("offers")
        .select(OFFER_SELECT_NO_AGENT_SLUG)
        .eq("is_active", true)
        .order("updated_at", { ascending: false });
      if (retry.error) {
        console.warn("[offers-query] Supabase all active offers:", retry.error.message);
        return null;
      }
      return ((retry.data ?? []) as unknown) as OfferRow[];
    }
    if (isMissingFloorPlanColumnsError(error.message)) {
      const retry = await supabase
        .from("offers")
        .select(OFFER_SELECT_LEGACY)
        .eq("is_active", true)
        .order("updated_at", { ascending: false });
      if (retry.error) {
        console.warn("[offers-query] Supabase all active offers:", retry.error.message);
        return null;
      }
      return ((retry.data ?? []) as unknown) as OfferRow[];
    }
    if (!isMissingFloorPlansRelationError(error.message)) {
      console.warn("[offers-query] Supabase all active offers:", error.message);
    }
    return null;
  }
  return ((data ?? []) as unknown) as OfferRow[];
}

async function fetchOfferRow(
  filter: { slug?: string; id?: string; galactica_offer_id?: string },
): Promise<OfferRow | null> {
  const supabase = getSupabaseAnon();
  if (!supabase) return null;

  let q = supabase.from("offers").select(OFFER_SELECT).eq("is_active", true);
  if (filter.slug) q = q.eq("slug", filter.slug);
  else if (filter.id) q = q.eq("id", filter.id);
  else if (filter.galactica_offer_id) q = q.eq("galactica_offer_id", filter.galactica_offer_id);
  else return null;

  const { data, error } = await q.maybeSingle();

  async function attachFloorplansIfPossible(row: OfferRow | null): Promise<OfferRow | null> {
    if (!row) return null;
    // Jeśli relacja została już zaciągnięta i coś w niej jest - nie dublujemy.
    if (Array.isArray(row.offer_floorplans) && row.offer_floorplans.length > 0) return row;
    if (!supabase) return row;
    try {
      const { data: fps, error: fpErr } = await supabase
        .from("offer_floorplans")
        .select("kind,label,url,order_index")
        .eq("offer_id", row.id)
        .order("kind", { ascending: true })
        .order("order_index", { ascending: true });
      if (fpErr) return row;
      (row as unknown as { offer_floorplans?: unknown }).offer_floorplans = fps ?? [];
    } catch {
      // brak tabeli / brak uprawnień - ignorujemy (fallback zostaje na primary URL)
    }
    return row;
  }

  if (error) {
    if (isMissingFloorPlansRelationError(error.message)) {
      let q2 = supabase.from("offers").select(OFFER_SELECT_NO_FLOORPLANS).eq("is_active", true);
      if (filter.slug) q2 = q2.eq("slug", filter.slug);
      else if (filter.id) q2 = q2.eq("id", filter.id);
      else if (filter.galactica_offer_id) q2 = q2.eq("galactica_offer_id", filter.galactica_offer_id);
      const retry = await q2.maybeSingle();
      if (retry.error) {
        console.warn("[offers-query] Supabase offer one:", retry.error.message);
        return null;
      }
      return attachFloorplansIfPossible((((retry.data as unknown) as OfferRow) ?? null));
    }
    if (isMissingYoutubeColumnError(error.message)) {
      let q2 = supabase.from("offers").select(OFFER_SELECT_NO_YOUTUBE).eq("is_active", true);
      if (filter.slug) q2 = q2.eq("slug", filter.slug);
      else if (filter.id) q2 = q2.eq("id", filter.id);
      else if (filter.galactica_offer_id) q2 = q2.eq("galactica_offer_id", filter.galactica_offer_id);
      const retry = await q2.maybeSingle();
      if (retry.error) {
        console.warn("[offers-query] Supabase offer one:", retry.error.message);
        return null;
      }
      return attachFloorplansIfPossible((((retry.data as unknown) as OfferRow) ?? null));
    }
    if (isMissingFloorPlanColumnsError(error.message)) {
      let q2 = supabase.from("offers").select(OFFER_SELECT_LEGACY).eq("is_active", true);
      if (filter.slug) q2 = q2.eq("slug", filter.slug);
      else if (filter.id) q2 = q2.eq("id", filter.id);
      else if (filter.galactica_offer_id) q2 = q2.eq("galactica_offer_id", filter.galactica_offer_id);
      const retry = await q2.maybeSingle();
      if (retry.error) {
        console.warn("[offers-query] Supabase offer one:", retry.error.message);
        return null;
      }
      return attachFloorplansIfPossible((((retry.data as unknown) as OfferRow) ?? null));
    }
    if (!isMissingFloorPlansRelationError(error.message)) {
      console.warn("[offers-query] Supabase offer one:", error.message);
    }
    return null;
  }
  return attachFloorplansIfPossible(((data as OfferRow) ?? null));
}

/** Lista publiczna z krótkim filmem (homepage, tryb Video w /oferty).
 *  Zwracamy WYŁĄCZNIE oferty z Cloudflare streamId i realnymi mediami. Brak fallbacku na mocki -
 *  pusta lista jest poprawna i klient renderuje stan „brak ofert". */
/**
 * Kolejność „od najnowszych" = data dodania oferty w Galactice (sourceCreatedAt), tak jak na
 * oficjalnej stronie. Fallback na updatedAt. Stosowana do domyślnej kolejności (hero na stronie
 * głównej, wstępny render /oferty); na /oferty klient i tak może przesortować innym kluczem.
 */
function compareByNewest(a: Offer, b: Offer): number {
  // Oferty Z realną datą dodania idą pierwsze (malejąco). Te BEZ niej (stare rekordy
  // FTP/developerka bez DataWprowadzenia) lądują na końcu - NIE używamy dla nich updated_at
  // (czas sync-u jest „dzisiejszy" i błędnie wypchnąłby je na samą górę „najnowszych").
  const ka = a.sourceCreatedAt || "";
  const kb = b.sourceCreatedAt || "";
  if (ka !== kb) return kb.localeCompare(ka);
  return (b.updatedAt || "").localeCompare(a.updatedAt || "");
}

export async function getAllOffers(): Promise<Offer[]> {
  try {
    const rows = await fetchPublicListingOfferRows();
    if (rows && rows.length > 0) {
      const filtered = rows.filter((row) => {
        const m = firstRel(row.offer_media);
        return Boolean(m?.cloudflare_video_short_id?.trim()) && hasUsableMedia(row);
      });
      return dedupeOffersByRef(filtered.map(mapOfferRow)).sort(compareByNewest);
    }
  } catch (e) {
    console.warn("[offers-query] getAllOffers:", e);
  }
  return [];
}

/** Wszystkie aktywne oferty (bez wymogu krótkiego filmu) - katalog /oferty.
 *  Również tylko z Supabase, bez fallbacków na mocki; oferty bez realnych mediów odpadają. */
export async function getAllActiveOffers(): Promise<Offer[]> {
  try {
    const rows = await fetchAllActiveOfferRows();
    if (rows && rows.length > 0) {
      return dedupeOffersByRef(rows.filter(hasUsableMedia).map(mapOfferRow)).sort(compareByNewest);
    }
  } catch (e) {
    console.warn("[offers-query] getAllActiveOffers:", e);
  }
  return [];
}

/**
 * Jedna oferta - wyłącznie z Supabase:
 *  1) po kolumnie `slug` (kanoniczne URL-e typu `tytul-FIB-DS-4127`)
 *  2) po `id` (UUID) - stare linki
 *  3) po `galactica_offer_id` (np. `FIB-DS-4127` samotnie) - kompatybilność wstecz
 *
 * Jeśli chcesz wiedzieć, czy trafiono w URL kanoniczny (i ewentualnie zrobić 301),
 * porównaj zwrócone `offer.slug` z `slug` z URL-a.
 */
export async function getOfferBySlug(slug: string): Promise<Offer | undefined> {
  try {
    const supabase = getSupabaseAnon();
    if (!supabase) return undefined;

    let row: OfferRow | null = null;
    // 1) po kolumnie slug
    row = await fetchOfferRow({ slug });
    // 2) fallback: UUID (stare linki sprzed migracji)
    if (!row && UUID_RE.test(slug)) {
      row = await fetchOfferRow({ id: slug });
    }
    // 3) fallback: galactica_offer_id (np. FIB-DS-4127 bez części tytułowej)
    if (!row) {
      row = await fetchOfferRow({ galactica_offer_id: slug });
    }
    if (row) {
      const withPhoto = await attachAgentPhotoUrlIfMissing(mapOfferRow(row));
      return attachAgentVideoId(withPhoto);
    }
  } catch (e) {
    console.warn("[offers-query] getOfferBySlug:", e);
  }
  return undefined;
}
