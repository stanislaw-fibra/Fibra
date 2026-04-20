import "server-only";

import type { Offer, OfferKind } from "@/lib/offers";
import { OFFERS, getOffer as getStaticOffer } from "@/lib/offers";
import { getSupabaseAnon } from "@/lib/supabase/server-anon";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const OFFER_SELECT = `
  id,
  galactica_offer_id,
  category,
  listing_type,
  title,
  advertisement_text,
  description,
  raw_params,
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
  )
`;

/** Lista publiczna (homepage, /oferty): tylko oferty z krótkim filmem Stream. */
const OFFER_SELECT_PUBLIC_LIST = OFFER_SELECT.replace("offer_media (", "offer_media!inner (");

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
  galactica_offer_id: string;
  category: string;
  listing_type: string;
  title: string | null;
  advertisement_text: string | null;
  description: string | null;
  raw_params: Record<string, unknown> | null;
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
  offer_media: MediaRow | MediaRow[] | null;
  offer_images: ImageRow[] | null;
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

function streamThumb(streamId: string, h = 1200) {
  return `https://videodelivery.net/${streamId}/thumbnails/thumbnail.jpg?time=0s&height=${h}`;
}

function pickYoutubeUrl(raw: Record<string, unknown> | null | undefined): string | undefined {
  if (!raw) return undefined;
  const candidates = [raw.wideo, raw.video, raw.film, raw.youtube];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().includes("youtu")) return c.trim();
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
  const desc = row.description?.trim() || "";
  const excerpt = desc.length > 220 ? `${desc.slice(0, 217)}…` : desc || displayTitle;
  const poster =
    media?.poster_image_url?.trim() ||
    (shortId ? streamThumb(shortId) : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&h=1500&q=82");

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

  return {
    id: row.id,
    slug: row.id,
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
    agentName: row.agent_name?.trim() || undefined,
    agentPhone: row.agent_phone_mobile?.trim() || undefined,
    agentPhoneOffice: row.agent_phone_office?.trim() || undefined,
    agentEmail: row.agent_email?.trim() || undefined,
    youtubeUrl: pickYoutubeUrl(row.raw_params),
    hasShortVideo: Boolean(shortId),
    updatedAt: row.updated_at ?? undefined,
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
    console.warn("[offers-query] Supabase public offers list:", error.message);
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
    console.warn("[offers-query] Supabase all active offers:", error.message);
    return null;
  }
  return ((data ?? []) as unknown) as OfferRow[];
}

async function fetchOfferRow(filter: { id?: string; galactica_offer_id?: string }): Promise<OfferRow | null> {
  const supabase = getSupabaseAnon();
  if (!supabase) return null;

  let q = supabase.from("offers").select(OFFER_SELECT).eq("is_active", true);
  if (filter.id) q = q.eq("id", filter.id);
  else if (filter.galactica_offer_id) q = q.eq("galactica_offer_id", filter.galactica_offer_id);
  else return null;

  const { data, error } = await q.maybeSingle();

  if (error) {
    console.warn("[offers-query] Supabase offer one:", error.message);
    return null;
  }
  return (data as OfferRow) ?? null;
}

/** Lista publiczna z krótkim filmem (homepage, tryb Video w /oferty). */
export async function getAllOffers(): Promise<Offer[]> {
  try {
    const rows = await fetchPublicListingOfferRows();
    if (rows && rows.length > 0) {
      return dedupeOffersByRef(rows.map(mapOfferRow));
    }
  } catch (e) {
    console.warn("[offers-query] getAllOffers:", e);
  }
  return OFFERS;
}

/** Wszystkie aktywne oferty (bez wymogu krótkiego filmu) — katalog /oferty. */
export async function getAllActiveOffers(): Promise<Offer[]> {
  try {
    const rows = await fetchAllActiveOfferRows();
    if (rows && rows.length > 0) {
      return dedupeOffersByRef(rows.map(mapOfferRow));
    }
  } catch (e) {
    console.warn("[offers-query] getAllActiveOffers:", e);
  }
  return OFFERS;
}

/** Jedna oferta: najpierw mock po `slug`, potem Supabase po `id` (uuid) lub `galactica_offer_id`. */
export async function getOfferBySlug(slug: string): Promise<Offer | undefined> {
  const local = getStaticOffer(slug);
  if (local) return local;

  try {
    const supabase = getSupabaseAnon();
    if (!supabase) return undefined;

    let row: OfferRow | null = null;
    if (UUID_RE.test(slug)) {
      row = await fetchOfferRow({ id: slug });
    }
    if (!row) {
      row = await fetchOfferRow({ galactica_offer_id: slug });
    }
    if (row) return mapOfferRow(row);
  } catch (e) {
    console.warn("[offers-query] getOfferBySlug:", e);
  }
  return undefined;
}
