import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeOfferSlug } from "@/lib/slug";
import type { MappedOffer } from "./field-mapper";

export interface OfferSyncResult {
  offerId: string;
  action: "created" | "updated" | "skipped";
  protected?: boolean;
}

/**
 * Gdy proponowany slug koliduje (np. duplikat tytułu + inny ID),
 * dodaj skrócony suffix losowy, żeby insert się udał.
 */
function deriveUniqueSlugFallback(baseSlug: string): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${baseSlug}-${rnd}`;
}

// Upsert oferty po galactica_offer_id. Oferty MANUAL-* nie są nadpisywane.
export async function upsertOffer(
  supabase: SupabaseClient,
  mapped: MappedOffer,
  agentId: string | null,
): Promise<OfferSyncResult> {
  if (mapped.galactica_offer_id.startsWith("MANUAL-")) {
    // Spec: nie nadpisuj ofert ręcznych — ale taki ID nie powinien nigdy trafić z Galactiki.
    // Zwracamy skipped dla bezpieczeństwa.
    const { data } = await supabase
      .from("offers")
      .select("id")
      .eq("galactica_offer_id", mapped.galactica_offer_id)
      .maybeSingle();
    return { offerId: data?.id ?? "", action: "skipped", protected: true };
  }

  const row = {
    galactica_offer_id: mapped.galactica_offer_id,
    category: mapped.category,
    listing_type: mapped.listing_type,
    title: mapped.title,
    advertisement_text: mapped.advertisement_text,
    description: mapped.description,
    price: mapped.price,
    currency: mapped.currency,
    area_total: mapped.area_total,
    area_usable: mapped.area_usable,
    area_plot: mapped.area_plot,
    rooms: mapped.rooms,
    bedrooms: mapped.bedrooms,
    bathrooms: mapped.bathrooms,
    floor: mapped.floor,
    floors_total: mapped.floors_total,
    year_built: mapped.year_built,
    has_balcony: mapped.has_balcony,
    has_terrace: mapped.has_terrace,
    has_basement: mapped.has_basement,
    has_elevator: mapped.has_elevator,
    has_air_conditioning: mapped.has_air_conditioning,
    building_material: mapped.building_material,
    building_state: mapped.building_state,
    property_state: mapped.property_state,
    heating: mapped.heating,
    kitchen_type: mapped.kitchen_type,
    parking_spaces: mapped.parking_spaces,
    province: mapped.province,
    city: mapped.city,
    district: mapped.district,
    street: mapped.street,
    lat: mapped.lat,
    lng: mapped.lng,
    is_primary_market: mapped.is_primary_market,
    is_exclusive: mapped.is_exclusive,
    is_without_commission: mapped.is_without_commission,
    virtual_tour_url: mapped.virtual_tour_url,
    source_updated_at: mapped.source_updated_at,
    agent_id: agentId,
    agent_name: mapped.agent_name,
    agent_email: mapped.agent_email,
    agent_phone_office: mapped.agent_phone_office,
    agent_phone_mobile: mapped.agent_phone_mobile,
    raw_params: mapped.raw_params,
    is_active: true,
  };

  // Sprawdź czy istnieje (i pobierz istniejący slug — NIE nadpisujemy przy update,
  // żeby zmiana tytułu nie łamała linków/SEO).
  const { data: existing, error: selErr } = await supabase
    .from("offers")
    .select("id, slug")
    .eq("galactica_offer_id", mapped.galactica_offer_id)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing?.id) {
    // Backfill slug-a tylko gdy brakuje; istniejący zostaje bez zmian.
    const patch: Record<string, unknown> = { ...row };
    if (!existing.slug || existing.slug.trim().length === 0) {
      patch.slug = await resolveInsertableSlug(
        supabase,
        makeOfferSlug(mapped.advertisement_text || mapped.title, mapped.galactica_offer_id),
      );
    }
    const { error } = await supabase.from("offers").update(patch).eq("id", existing.id);
    if (error) throw error;
    return { offerId: existing.id, action: "updated" };
  }

  const slug = await resolveInsertableSlug(
    supabase,
    makeOfferSlug(mapped.advertisement_text || mapped.title, mapped.galactica_offer_id),
  );
  const { data: inserted, error } = await supabase
    .from("offers")
    .insert({ ...row, slug })
    .select("id")
    .single();
  if (error) throw error;
  return { offerId: inserted.id, action: "created" };
}

/**
 * Zapewnia unikalność slug-a. Przy kolizji (niezwykle rzadkie — tylko gdy dwa różne
 * tytuły dadzą identyczny slug i Galactica ID też się pokryje) doklejamy krótki
 * losowy suffix.
 */
async function resolveInsertableSlug(supabase: SupabaseClient, candidate: string): Promise<string> {
  if (!candidate) return deriveUniqueSlugFallback("oferta");
  const { data, error } = await supabase
    .from("offers")
    .select("id")
    .eq("slug", candidate)
    .maybeSingle();
  if (error) {
    // Na wszelki wypadek: gdy zapytanie padło, wolimy slug z suffixem niż crash insertu.
    return deriveUniqueSlugFallback(candidate);
  }
  if (!data) return candidate;
  return deriveUniqueSlugFallback(candidate);
}

export async function deactivateOffer(
  supabase: SupabaseClient,
  galacticaOfferId: string,
): Promise<boolean> {
  if (galacticaOfferId.startsWith("MANUAL-")) return false;
  const { error, count } = await supabase
    .from("offers")
    .update({ is_active: false }, { count: "exact" })
    .eq("galactica_offer_id", galacticaOfferId)
    .eq("is_active", true);
  if (error) throw error;
  return (count ?? 0) > 0;
}

// Dezaktywuj wszystkie oferty, których galactica_offer_id nie ma w presentIds i nie są MANUAL-*.
export async function deactivateMissingOffers(
  supabase: SupabaseClient,
  presentIds: string[],
): Promise<number> {
  // Wczytaj listę aktywnych ofert z Galactiki
  const { data: all, error: selErr } = await supabase
    .from("offers")
    .select("id, galactica_offer_id")
    .eq("is_active", true)
    .not("galactica_offer_id", "like", "MANUAL-%");
  if (selErr) throw selErr;

  const present = new Set(presentIds);
  const toDeactivate = (all ?? [])
    .filter((o) => !present.has(o.galactica_offer_id))
    .map((o) => o.id);

  if (toDeactivate.length === 0) return 0;

  // Deaktywuj w batchach (PostgREST limit na IN)
  const BATCH = 200;
  let deactivated = 0;
  for (let i = 0; i < toDeactivate.length; i += BATCH) {
    const batch = toDeactivate.slice(i, i + BATCH);
    const { error, count } = await supabase
      .from("offers")
      .update({ is_active: false }, { count: "exact" })
      .in("id", batch);
    if (error) throw error;
    deactivated += count ?? batch.length;
  }
  return deactivated;
}
