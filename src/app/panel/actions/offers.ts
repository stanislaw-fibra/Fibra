"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { intFromHumanOrNull, parseHumanNumber } from "@/lib/parse-human-number";
import { sanitizeRichHtml } from "@/lib/rich-description";
import { makeOfferSlug } from "@/lib/slug";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Zapewnia unikalność slug-a. Przy kolizji doklejamy krótki losowy suffix,
 * żeby insert nie padł na unique indeksie.
 */
async function ensureUniqueOfferSlug(admin: SupabaseClient, candidate: string): Promise<string> {
  const base = candidate || "oferta";
  const { data } = await admin.from("offers").select("id").eq("slug", base).maybeSingle();
  if (!data) return base;
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

/**
 * Odświeża publiczną stronę oferty po kanonicznym slug-u (publiczny URL to
 * `/oferty/{slug}`, nie `/oferty/{uuid}`). Gdy slug jest pusty - fallback do UUID-a.
 */
async function revalidateOfferPublicPath(admin: SupabaseClient, offerId: string) {
  const { data } = await admin.from("offers").select("slug").eq("id", offerId).maybeSingle();
  const slug = data?.slug?.trim();
  revalidatePath(`/oferty/${slug || offerId}`);
}

async function requireSessionUser() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    redirect("/panel/login");
  }
  return user;
}

/**
 * Sprawdza scope (admin vs agent) i ownership oferty.
 * - Admin (brak `agent_id` w meta) - może wszystko.
 * - Agent - może edytować TYLKO oferty gdzie `offers.agent_id` === jego `user_metadata.agent_id`.
 *
 * Zwraca scope { kind, agentId? }. Robi redirect przy braku uprawnień.
 */
async function requireOfferAccess(offerId: string): Promise<{ kind: "admin" } | { kind: "agent"; agentId: string }> {
  const user = await requireSessionUser();
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const rawAgentId = meta.agent_id;
  const agentId = typeof rawAgentId === "string" && rawAgentId.trim() ? rawAgentId.trim() : null;
  if (!agentId) return { kind: "admin" };

  const admin = createSupabaseAdmin();
  const { data, error } = await admin.from("offers").select("agent_id").eq("id", offerId).maybeSingle();
  if (error || !data) {
    redirect(`/panel/oferty?error=${encodeURIComponent("Oferta nie istnieje albo nie masz do niej dostępu.")}`);
  }
  if ((data.agent_id ?? null) !== agentId) {
    redirect(`/panel/oferty?error=${encodeURIComponent("Brak uprawnień do edycji tej oferty.")}`);
  }
  return { kind: "agent", agentId };
}

/**
 * Dla tworzenia NOWEJ oferty: agent musi podać samego siebie jako `agent_id` (force-overridujemy
 * formularz). Admin może wybrać dowolnego agenta. Zwraca finalny `agent_id` do zapisania.
 */
async function resolveAgentIdForCreation(formAgentId: string | null): Promise<string | null> {
  const user = await requireSessionUser();
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const rawAgentId = meta.agent_id;
  const agentId = typeof rawAgentId === "string" && rawAgentId.trim() ? rawAgentId.trim() : null;
  // Agent musi przypisać samego siebie - admin może wybrać kogokolwiek.
  return agentId ?? formAgentId;
}

function strOrNull(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function boolFromCheckbox(v: FormDataEntryValue | null): boolean {
  return v === "on" || v === "true" || v === "1";
}

/**
 * Bezpieczne sanityzowanie opisu z formularza panelu admina. Bartosz prosił, żeby
 * dało się dodawać boldy/kursywy/podkreślenia ręcznie - przepuszczamy whitelisted
 * inline tagi, resztę agresywnie strip. To samo robi importer dla treści z Galactici.
 */
function sanitizedDescriptionFromForm(v: FormDataEntryValue | null): string | null {
  const s = strOrNull(v);
  if (!s) return null;
  const cleaned = sanitizeRichHtml(s);
  return cleaned.length > 0 ? cleaned : null;
}

function normalizeHttpUrlFromForm(v: FormDataEntryValue | null): string | null {
  const s = strOrNull(v);
  if (!s) return null;
  // Security: accept only explicit http(s) URLs to avoid accidental `javascript:` etc.
  // (We still allow http in dev; production can provide https.)
  if (!/^https?:\/\//i.test(s)) return null;
  return s;
}

/**
 * Akceptuje pełne URL-e youtube.com / youtu.be (z opcjonalnym ?t=…) oraz samo ID typu `dQw4w9WgXcQ`.
 * Zwraca w pełni kanoniczny URL `https://www.youtube.com/watch?v=ID` lub `null`, jeżeli nie da się
 * rozpoznać. Dzięki temu klient może wkleić co ma pod ręką i system nie zaboli.
 */
function normalizeYoutubeUrlFromForm(v: FormDataEntryValue | null): string | null {
  const raw = strOrNull(v);
  if (!raw) return null;
  const cleaned = raw.replace(/\s+/g, "");
  // Same ID? (11 znaków alfanumerycznych z myślnikami / podkreśleniami)
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleaned)) {
    return `https://www.youtube.com/watch?v=${cleaned}`;
  }
  if (!/^https?:\/\//i.test(cleaned)) return null;
  try {
    const u = new URL(cleaned);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id && /^[a-zA-Z0-9_-]{6,}$/.test(id)) {
        return `https://www.youtube.com/watch?v=${id}`;
      }
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id && /^[a-zA-Z0-9_-]{6,}$/.test(id)) {
        return `https://www.youtube.com/watch?v=${id}`;
      }
      // Krótkie / shorts / embed
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "shorts" || parts[0] === "embed") {
        const id2 = parts[1];
        if (id2 && /^[a-zA-Z0-9_-]{6,}$/.test(id2)) {
          return `https://www.youtube.com/watch?v=${id2}`;
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}

export async function toggleOfferActiveAction(formData: FormData) {
  const id = strOrNull(formData.get("id"));
  const activeRaw = strOrNull(formData.get("active"));
  if (!id || !activeRaw) return;
  await requireOfferAccess(id);
  const is_active = activeRaw === "true";
  const admin = createSupabaseAdmin();
  // Ukrycie = is_active false + hidden_by_admin true (import nie przywróci).
  // Pokazanie = is_active true + zdjęcie flagi (oferta wraca do normalnego obiegu).
  const { error } = await admin.from("offers").update({ is_active, hidden_by_admin: !is_active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/oferty");
  revalidatePath("/oferty");
  await revalidateOfferPublicPath(admin, id);
  revalidatePath("/");
}

// Masowe wygaszanie / przywracanie ofert z listy w panelu.
//
// `hidden=true`  → wygaś zaznaczone (is_active=false + hidden_by_admin=true). Import ich nie
//                  przywróci - to jedyny sposób, by sprzedane / z drugiego oddziału oferty
//                  zniknęły na stałe (Galactica nie ma pola usunięcia ani markera oddziału).
// `hidden=false` → przywróć (is_active=true + hidden_by_admin=false).
//
// Agent może ruszać tylko swoje oferty (filtr po agent_id). Admin - wszystkie zaznaczone.
export async function setOffersVisibilityAction(formData: FormData) {
  const ids = formData
    .getAll("ids")
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0);
  const hidden = strOrNull(formData.get("hidden")) === "true";
  const returnTo = strOrNull(formData.get("returnTo")) ?? "/panel/oferty";
  const safeReturn = returnTo.startsWith("/panel/oferty") ? returnTo : "/panel/oferty";

  if (ids.length === 0) {
    redirect(safeReturn);
  }

  const user = await requireSessionUser();
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const rawAgentId = meta.agent_id;
  const agentId = typeof rawAgentId === "string" && rawAgentId.trim() ? rawAgentId.trim() : null;

  const admin = createSupabaseAdmin();
  let q = admin
    .from("offers")
    .update({ is_active: !hidden, hidden_by_admin: hidden })
    .in("id", ids);
  if (agentId) q = q.eq("agent_id", agentId); // ⬅ agent: tylko własne oferty
  const { error } = await q;
  if (error) throw new Error(error.message);

  revalidatePath("/panel/oferty");
  revalidatePath("/oferty");
  revalidatePath("/");
  redirect(safeReturn);
}

export async function createOfferAction(formData: FormData) {
  await requireSessionUser();
  const admin = createSupabaseAdmin();

  const galactica_offer_id = `MANUAL-${randomUUID()}`;
  const category = strOrNull(formData.get("category"));
  const listing_type = strOrNull(formData.get("listing_type"));
  const title = strOrNull(formData.get("title"));
  if (!category || !listing_type || !title) {
    redirect(`/panel/oferty/nowa?error=${encodeURIComponent("Wypełnij kategorię, typ i tytuł.")}`);
  }

  const advertisement_text = strOrNull(formData.get("advertisement_text")) ?? title.slice(0, 50);
  // Agent z meta force-przypisany - admin może wybrać kogokolwiek.
  const agent_id = await resolveAgentIdForCreation(strOrNull(formData.get("agent_id")));

  let agent_name: string | null = null;
  let agent_email: string | null = null;
  let agent_phone_office: string | null = null;
  let agent_phone_mobile: string | null = null;
  if (agent_id) {
    const { data: ag } = await admin.from("agents").select("name,email,phone_office,phone_mobile").eq("id", agent_id).maybeSingle();
    if (ag) {
      agent_name = ag.name;
      agent_email = ag.email;
      agent_phone_office = ag.phone_office;
      agent_phone_mobile = ag.phone_mobile;
    }
  }

  const is_active = (strOrNull(formData.get("is_active")) ?? "true") === "true";

  const slug = await ensureUniqueOfferSlug(
    admin,
    makeOfferSlug(advertisement_text || title, galactica_offer_id),
  );

  const row = {
    galactica_offer_id,
    slug,
    category,
    listing_type,
    title,
    advertisement_text,
    description: sanitizedDescriptionFromForm(formData.get("description")),
    price: parseHumanNumber(formData.get("price")),
    city: strOrNull(formData.get("city")),
    district: strOrNull(formData.get("district")),
    area_usable: parseHumanNumber(formData.get("area_usable")),
    area_total: parseHumanNumber(formData.get("area_total")),
    area_plot: parseHumanNumber(formData.get("area_plot")),
    rooms: intFromHumanOrNull(formData.get("rooms")),
    bedrooms: intFromHumanOrNull(formData.get("bedrooms")),
    bathrooms: intFromHumanOrNull(formData.get("bathrooms")),
    floor: intFromHumanOrNull(formData.get("floor")),
    floors_total: intFromHumanOrNull(formData.get("floors_total")),
    year_built: intFromHumanOrNull(formData.get("year_built")),
    parking_spaces: intFromHumanOrNull(formData.get("parking_spaces")),
    heating: strOrNull(formData.get("heating")),
    building_material: strOrNull(formData.get("building_material")),
    building_state: strOrNull(formData.get("building_state")),
    property_state: strOrNull(formData.get("property_state")),
    kitchen_type: strOrNull(formData.get("kitchen_type")),
    market_type: strOrNull(formData.get("market_type")),
    virtual_tour_url: strOrNull(formData.get("virtual_tour_url")),
    floor_plan_image_url: normalizeHttpUrlFromForm(formData.get("floor_plan_image_url")),
    floor_plan_pdf_url: normalizeHttpUrlFromForm(formData.get("floor_plan_pdf_url")),
    is_active,
    is_exclusive: boolFromCheckbox(formData.get("is_exclusive")),
    is_price_negotiable: boolFromCheckbox(formData.get("is_price_negotiable")),
    has_balcony: boolFromCheckbox(formData.get("has_balcony")),
    has_terrace: boolFromCheckbox(formData.get("has_terrace")),
    has_basement: boolFromCheckbox(formData.get("has_basement")),
    has_garden: boolFromCheckbox(formData.get("has_garden")),
    has_loggia: boolFromCheckbox(formData.get("has_loggia")),
    has_elevator: boolFromCheckbox(formData.get("has_elevator")),
    has_air_conditioning: boolFromCheckbox(formData.get("has_air_conditioning")),
    agent_id: agent_id ?? null,
    agent_name,
    agent_email,
    agent_phone_office,
    agent_phone_mobile,
  };

  const { data, error } = await admin.from("offers").insert(row).select("id").single();
  if (error) {
    redirect(`/panel/oferty/nowa?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/panel/oferty");
  revalidatePath("/oferty");
  redirect(`/panel/oferty/${data.id}`);
}

export async function updateOfferAction(formData: FormData) {
  const id = strOrNull(formData.get("id"));
  if (!id) redirect(`/panel/oferty?error=${encodeURIComponent("Brak ID oferty.")}`);

  // Ownership: agent może edytować tylko swoje oferty; admin - wszystkie.
  const scope = await requireOfferAccess(id);
  const admin = createSupabaseAdmin();

  // Agent: force-przypisz samego siebie, ignoruj manipulacje w formularzu.
  const agent_id = scope.kind === "agent" ? scope.agentId : strOrNull(formData.get("agent_id"));
  let agent_name: string | null = null;
  let agent_email: string | null = null;
  let agent_phone_office: string | null = null;
  let agent_phone_mobile: string | null = null;
  if (agent_id) {
    const { data: ag } = await admin.from("agents").select("name,email,phone_office,phone_mobile").eq("id", agent_id).maybeSingle();
    if (ag) {
      agent_name = ag.name;
      agent_email = ag.email;
      agent_phone_office = ag.phone_office;
      agent_phone_mobile = ag.phone_mobile;
    }
  }

  const category = strOrNull(formData.get("category"));
  const listing_type = strOrNull(formData.get("listing_type"));
  const title = strOrNull(formData.get("title"));
  if (!category || !listing_type || !title) {
    redirect(`/panel/oferty/${id}?error=${encodeURIComponent("Kategoria, typ i tytuł są wymagane.")}`);
  }

  const is_active = (strOrNull(formData.get("is_active")) ?? "true") === "true";

  const patch = {
    category,
    listing_type,
    title,
    advertisement_text: strOrNull(formData.get("advertisement_text")),
    description: sanitizedDescriptionFromForm(formData.get("description")),
    price: parseHumanNumber(formData.get("price")),
    city: strOrNull(formData.get("city")),
    district: strOrNull(formData.get("district")),
    area_usable: parseHumanNumber(formData.get("area_usable")),
    area_total: parseHumanNumber(formData.get("area_total")),
    area_plot: parseHumanNumber(formData.get("area_plot")),
    rooms: intFromHumanOrNull(formData.get("rooms")),
    bedrooms: intFromHumanOrNull(formData.get("bedrooms")),
    bathrooms: intFromHumanOrNull(formData.get("bathrooms")),
    floor: intFromHumanOrNull(formData.get("floor")),
    floors_total: intFromHumanOrNull(formData.get("floors_total")),
    year_built: intFromHumanOrNull(formData.get("year_built")),
    parking_spaces: intFromHumanOrNull(formData.get("parking_spaces")),
    heating: strOrNull(formData.get("heating")),
    building_material: strOrNull(formData.get("building_material")),
    building_state: strOrNull(formData.get("building_state")),
    property_state: strOrNull(formData.get("property_state")),
    kitchen_type: strOrNull(formData.get("kitchen_type")),
    market_type: strOrNull(formData.get("market_type")),
    virtual_tour_url: strOrNull(formData.get("virtual_tour_url")),
    floor_plan_image_url: normalizeHttpUrlFromForm(formData.get("floor_plan_image_url")),
    floor_plan_pdf_url: normalizeHttpUrlFromForm(formData.get("floor_plan_pdf_url")),
    is_active,
    is_exclusive: boolFromCheckbox(formData.get("is_exclusive")),
    is_price_negotiable: boolFromCheckbox(formData.get("is_price_negotiable")),
    has_balcony: boolFromCheckbox(formData.get("has_balcony")),
    has_terrace: boolFromCheckbox(formData.get("has_terrace")),
    has_basement: boolFromCheckbox(formData.get("has_basement")),
    has_garden: boolFromCheckbox(formData.get("has_garden")),
    has_loggia: boolFromCheckbox(formData.get("has_loggia")),
    has_elevator: boolFromCheckbox(formData.get("has_elevator")),
    has_air_conditioning: boolFromCheckbox(formData.get("has_air_conditioning")),
    agent_id: agent_id ?? null,
    agent_name,
    agent_email,
    agent_phone_office,
    agent_phone_mobile,
  };

  const { error } = await admin.from("offers").update(patch).eq("id", id);
  if (error) {
    redirect(`/panel/oferty/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/panel/oferty");
  revalidatePath(`/panel/oferty/${id}`);
  revalidatePath("/oferty");
  await revalidateOfferPublicPath(admin, id);
  redirect(`/panel/oferty/${id}?saved=1`);
}

export async function uploadOfferImageAction(formData: FormData) {
  const offerId = strOrNull(formData.get("offer_id"));
  const galactica_offer_id = strOrNull(formData.get("galactica_offer_id"));
  const file = formData.get("file");
  if (!offerId || !galactica_offer_id || !file || !(file instanceof File) || file.size === 0) {
    redirect(`/panel/oferty/${offerId ?? ""}?error=${encodeURIComponent("Wybierz plik graficzny.")}`);
  }
  await requireOfferAccess(offerId);
  const admin = createSupabaseAdmin();

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const baseStem = file.name.replace(/\.[^.]+$/, "").replace(/[^\w.\-]/g, "_").slice(0, 72) || "image";
  const { count } = await admin
    .from("offer_images")
    .select("id", { count: "exact", head: true })
    .eq("offer_id", offerId);
  const order_index = count ?? 0;
  const path = `${galactica_offer_id}/${order_index}_${Date.now()}_${baseStem}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await admin.storage.from("offer-images").upload(path, buf, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (upErr) {
    redirect(`/panel/oferty/${offerId}?error=${encodeURIComponent(upErr.message)}`);
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  const image_url = `${base}/storage/v1/object/public/offer-images/${path}`;

  const { error: insErr } = await admin.from("offer_images").insert({
    offer_id: offerId,
    galactica_offer_id,
    source_filename: file.name,
    image_url,
    order_index,
    is_primary: order_index === 0,
  });
  if (insErr) {
    redirect(`/panel/oferty/${offerId}?error=${encodeURIComponent(insErr.message)}`);
  }

  revalidatePath(`/panel/oferty/${offerId}`);
  await revalidateOfferPublicPath(admin, offerId);
  redirect(`/panel/oferty/${offerId}?uploaded=1`);
}

function storagePathFromBucketPublicUrl(url: string, bucket: string): string | null {
  const marker = `/${bucket}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

function storagePathFromPublicUrl(url: string): string | null {
  const marker = "/offer-images/";
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

export async function deleteOfferImageAction(formData: FormData) {
  const imageId = strOrNull(formData.get("image_id"));
  const offerId = strOrNull(formData.get("offer_id"));
  if (!imageId || !offerId) return;
  await requireOfferAccess(offerId);
  const admin = createSupabaseAdmin();

  const { data: img } = await admin.from("offer_images").select("image_url").eq("id", imageId).maybeSingle();
  const path = img?.image_url ? storagePathFromPublicUrl(img.image_url) : null;
  if (path) {
    await admin.storage.from("offer-images").remove([path]);
  }
  await admin.from("offer_images").delete().eq("id", imageId);
  revalidatePath(`/panel/oferty/${offerId}`);
  await revalidateOfferPublicPath(admin, offerId);
  // Bez redirect() - usunięte zdjęcie znika z galerii w miejscu, bez skoku na górę.
  return;
}

/**
 * Zapisuje nową kolejność zdjęć galerii. Przyjmuje pełną listę ID w docelowej
 * kolejności (`ordered_ids` = ID rozdzielone przecinkami) i przepisuje `order_index`
 * na 0..n. Zdjęcie na pozycji 0 zostaje `is_primary` (miniatura karty/oferty), reszta
 * traci ten flag - tak samo jak przy uploadzie (order_index 0 = główne).
 *
 * Po co: Roman prosił o możliwość przestawiania kolejności zdjęć w panelu. UI robi to
 * przeciąganiem (framer-motion Reorder), a tu utrwalamy wynik jednym zapisem.
 */
export async function reorderOfferImagesAction(formData: FormData) {
  const offerId = strOrNull(formData.get("offer_id"));
  if (!offerId) return;
  await requireOfferAccess(offerId);
  const admin = createSupabaseAdmin();

  const raw = strOrNull(formData.get("ordered_ids"));
  const orderedIds = (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (orderedIds.length === 0) return;

  // Bezpieczeństwo: bierzemy pod uwagę tylko ID, które faktycznie należą do tej oferty.
  const { data: own } = await admin
    .from("offer_images")
    .select("id")
    .eq("offer_id", offerId);
  const validIds = new Set((own ?? []).map((r) => r.id as string));
  const finalOrder = orderedIds.filter((id) => validIds.has(id));
  if (finalOrder.length === 0) return;

  // Przepisujemy order_index i is_primary sekwencyjnie (galeria to zwykle kilka-
  // kilkanaście zdjęć, więc bez potrzeby optymalizacji wsadowej).
  for (let i = 0; i < finalOrder.length; i++) {
    await admin
      .from("offer_images")
      .update({ order_index: i, is_primary: i === 0 })
      .eq("id", finalOrder[i])
      .eq("offer_id", offerId);
  }

  revalidatePath(`/panel/oferty/${offerId}`);
  await revalidateOfferPublicPath(admin, offerId);
  return;
}

const FLOORPLANS_BUCKET = "offer-floorplans";

export async function uploadOfferFloorPlanImageAction(formData: FormData) {
  const offerId = strOrNull(formData.get("offer_id"));
  if (!offerId) return;
  await requireOfferAccess(offerId);
  const admin = createSupabaseAdmin();
  const galactica_offer_id = strOrNull(formData.get("galactica_offer_id"));
  const files = formData.getAll("file").filter((f) => f instanceof File) as File[];
  const realFiles = files.filter((f) => f.size > 0);
  if (!offerId || !galactica_offer_id || realFiles.length === 0) {
    redirect(`/panel/oferty/${offerId ?? ""}?error=${encodeURIComponent("Wybierz przynajmniej jedno zdjęcie rzutu.")}`);
  }

  const { count } = await admin
    .from("offer_floorplans")
    .select("id", { count: "exact", head: true })
    .eq("offer_id", offerId)
    .eq("kind", "image");
  let startIndex = count ?? 0;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  const insertedUrls: string[] = [];

  for (const file of realFiles) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const baseStem = file.name.replace(/\.[^.]+$/, "").replace(/[^\w.\-]/g, "_").slice(0, 72) || "floorplan";
    const order_index = startIndex;
    startIndex += 1;

    const path = `${galactica_offer_id}/floorplan_image_${order_index}_${Date.now()}_${baseStem}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await admin.storage.from(FLOORPLANS_BUCKET).upload(path, buf, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });
    if (upErr) {
      redirect(`/panel/oferty/${offerId}?error=${encodeURIComponent(upErr.message)}`);
    }

    const publicUrl = `${base}/storage/v1/object/public/${FLOORPLANS_BUCKET}/${path}`;
    insertedUrls.push(publicUrl);

    const { error: insErr } = await admin.from("offer_floorplans").insert({
      offer_id: offerId,
      kind: "image",
      label: file.name,
      url: publicUrl,
      storage_path: path,
      order_index,
    });
    if (insErr) redirect(`/panel/oferty/${offerId}?error=${encodeURIComponent(insErr.message)}`);
  }

  // Backward-compat "primary": jeśli puste, ustawiamy na pierwszy dodany obraz.
  const { data: off } = await admin.from("offers").select("floor_plan_image_url").eq("id", offerId).maybeSingle();
  if (!off?.floor_plan_image_url && insertedUrls[0]) {
    await admin.from("offers").update({ floor_plan_image_url: insertedUrls[0] }).eq("id", offerId);
  }

  revalidatePath(`/panel/oferty/${offerId}`);
  await revalidateOfferPublicPath(admin, offerId);
  redirect(`/panel/oferty/${offerId}?saved=1`);
}

export async function uploadOfferFloorPlanPdfAction(formData: FormData) {
  const offerId = strOrNull(formData.get("offer_id"));
  if (!offerId) return;
  await requireOfferAccess(offerId);
  const admin = createSupabaseAdmin();
  const galactica_offer_id = strOrNull(formData.get("galactica_offer_id"));
  const files = formData.getAll("file").filter((f) => f instanceof File) as File[];
  const realFiles = files.filter((f) => f.size > 0);
  if (!offerId || !galactica_offer_id || realFiles.length === 0) {
    redirect(`/panel/oferty/${offerId ?? ""}?error=${encodeURIComponent("Wybierz przynajmniej jeden plik PDF.")}`);
  }

  const { count } = await admin
    .from("offer_floorplans")
    .select("id", { count: "exact", head: true })
    .eq("offer_id", offerId)
    .eq("kind", "pdf");
  let startIndex = count ?? 0;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  const insertedUrls: string[] = [];

  for (const file of realFiles) {
    // Security: basic content-type sanity check.
    if (file.type && file.type !== "application/pdf") {
      redirect(`/panel/oferty/${offerId}?error=${encodeURIComponent("To nie wygląda na plik PDF.")}`);
    }
    const baseStem = file.name.replace(/\.[^.]+$/, "").replace(/[^\w.\-]/g, "_").slice(0, 72) || "floorplan";
    const order_index = startIndex;
    startIndex += 1;
    const path = `${galactica_offer_id}/floorplan_pdf_${order_index}_${Date.now()}_${baseStem}.pdf`;

    const buf = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await admin.storage.from(FLOORPLANS_BUCKET).upload(path, buf, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (upErr) {
      redirect(`/panel/oferty/${offerId}?error=${encodeURIComponent(upErr.message)}`);
    }

    const publicUrl = `${base}/storage/v1/object/public/${FLOORPLANS_BUCKET}/${path}`;
    insertedUrls.push(publicUrl);

    const { error: insErr } = await admin.from("offer_floorplans").insert({
      offer_id: offerId,
      kind: "pdf",
      label: file.name,
      url: publicUrl,
      storage_path: path,
      order_index,
    });
    if (insErr) redirect(`/panel/oferty/${offerId}?error=${encodeURIComponent(insErr.message)}`);
  }

  const { data: off } = await admin.from("offers").select("floor_plan_pdf_url").eq("id", offerId).maybeSingle();
  if (!off?.floor_plan_pdf_url && insertedUrls[0]) {
    await admin.from("offers").update({ floor_plan_pdf_url: insertedUrls[0] }).eq("id", offerId);
  }

  revalidatePath(`/panel/oferty/${offerId}`);
  await revalidateOfferPublicPath(admin, offerId);
  redirect(`/panel/oferty/${offerId}?saved=1`);
}

export async function deleteOfferFloorPlanImageAction(formData: FormData) {
  const offerId = strOrNull(formData.get("offer_id"));
  if (!offerId) return;
  await requireOfferAccess(offerId);
  const admin = createSupabaseAdmin();
  const floorplanId = strOrNull(formData.get("floorplan_id"));
  if (!offerId || !floorplanId) return;

  const { data: fp } = await admin
    .from("offer_floorplans")
    .select("id,url,storage_path")
    .eq("id", floorplanId)
    .maybeSingle();
  if (fp?.storage_path) {
    await admin.storage.from(FLOORPLANS_BUCKET).remove([fp.storage_path]);
  } else if (fp?.url) {
    const path = storagePathFromBucketPublicUrl(fp.url, FLOORPLANS_BUCKET);
    if (path) await admin.storage.from(FLOORPLANS_BUCKET).remove([path]);
  }
  await admin.from("offer_floorplans").delete().eq("id", floorplanId);

  // Refresh primary: pick next image (lowest order) or null.
  const { data: rest } = await admin
    .from("offer_floorplans")
    .select("url,order_index")
    .eq("offer_id", offerId)
    .eq("kind", "image")
    .order("order_index", { ascending: true })
    .limit(1);
  const nextUrl = rest?.[0]?.url?.trim() || null;
  await admin.from("offers").update({ floor_plan_image_url: nextUrl }).eq("id", offerId);
  revalidatePath(`/panel/oferty/${offerId}`);
  await revalidateOfferPublicPath(admin, offerId);
  redirect(`/panel/oferty/${offerId}?saved=1`);
}

/**
 * Oznacza istniejące zdjęcie z galerii (offer_images) jako RZUT, bez ponownego uploadu.
 *
 * Po co: Galactica NIE eksportuje markera rzutu (zielony podwójny kwadrat to flaga
 * wyświetlania w ich panelu, której nie ma w XML OfertyNet). Żeby Roman nie musiał
 * pobierać i wgrywać pliku ponownie, pozwalamy kliknąć „Oznacz jako rzut" wprost na
 * zdjęciu z galerii - kopiujemy tylko referencję (URL), plik zostaje w buckecie
 * offer-images.
 *
 * storage_path = null celowo: rzut wskazuje na zdjęcie z bucketu offer-images, więc
 * usunięcie rzutu (deleteOfferFloorPlanImageAction) nie skasuje oryginału - parser
 * ścieżki działa tylko dla bucketu offer-floorplans i dla obcego URL zwróci null.
 */
export async function markGalleryImageAsFloorPlanAction(formData: FormData) {
  const offerId = strOrNull(formData.get("offer_id"));
  if (!offerId) return;
  await requireOfferAccess(offerId);
  const admin = createSupabaseAdmin();
  const imageId = strOrNull(formData.get("image_id"));
  if (!offerId || !imageId) {
    redirect(`/panel/oferty/${offerId ?? ""}?error=${encodeURIComponent("Brak zdjęcia do oznaczenia.")}`);
  }

  const { data: img } = await admin
    .from("offer_images")
    .select("image_url")
    .eq("id", imageId)
    .eq("offer_id", offerId)
    .maybeSingle();
  const imageUrl = img?.image_url?.trim();
  if (!imageUrl) {
    redirect(`/panel/oferty/${offerId}?error=${encodeURIComponent("Nie znaleziono zdjęcia w galerii.")}`);
  }

  // Nie duplikuj, jeśli to zdjęcie już jest rzutem.
  const { data: dup } = await admin
    .from("offer_floorplans")
    .select("id")
    .eq("offer_id", offerId)
    .eq("kind", "image")
    .eq("url", imageUrl)
    .maybeSingle();
  if (dup?.id) {
    // Już jest rzutem - nic nie zmieniamy. NIE robimy redirect(), bo redirect
    // przeładowuje stronę i resetuje scroll na górę (Roman: „trzy oznaczenia,
    // trzy razy scrolluję góra-dół"). revalidatePath odświeża sekcję w miejscu.
    revalidatePath(`/panel/oferty/${offerId}`);
    return;
  }

  const { count } = await admin
    .from("offer_floorplans")
    .select("id", { count: "exact", head: true })
    .eq("offer_id", offerId)
    .eq("kind", "image");
  const order_index = count ?? 0;

  const { error: insErr } = await admin.from("offer_floorplans").insert({
    offer_id: offerId,
    kind: "image",
    label: "Rzut z galerii",
    url: imageUrl,
    storage_path: null,
    order_index,
  });
  if (insErr) redirect(`/panel/oferty/${offerId}?error=${encodeURIComponent(insErr.message)}`);

  const { data: off } = await admin.from("offers").select("floor_plan_image_url").eq("id", offerId).maybeSingle();
  if (!off?.floor_plan_image_url) {
    await admin.from("offers").update({ floor_plan_image_url: imageUrl }).eq("id", offerId);
  }

  revalidatePath(`/panel/oferty/${offerId}`);
  await revalidateOfferPublicPath(admin, offerId);
  // Bez redirect() - odświeżenie w miejscu zostawia widok przy oznaczonym zdjęciu,
  // zamiast skakać na górę edytowanej oferty. Zielony „Rzut ✓" to wystarczający sygnał.
  return;
}

/**
 * Cofa „Oznacz jako rzut" dla zdjęcia z galerii - zdjęcie wraca do bycia zwykłym
 * zdjęciem oferty, plik w buckecie offer-images zostaje nietknięty.
 *
 * Po co: Roman oznaczył zdjęcie jako rzut przez pomyłkę i nie mógł tego cofnąć w
 * miejscu (dało się tylko usunąć całe zdjęcie albo skasować wpis w osobnej sekcji
 * „Rzut"). Ten toggle usuwa TYLKO wiersz `offer_floorplans` wskazujący na to zdjęcie.
 *
 * Bezpieczeństwo pliku: rzuty z galerii mają `storage_path = null` i URL z bucketu
 * offer-images, więc kasujemy jedynie referencję - oryginał zostaje w galerii. Dla
 * pewności NIE dotykamy Storage w tej akcji.
 */
export async function unmarkGalleryImageAsFloorPlanAction(formData: FormData) {
  const offerId = strOrNull(formData.get("offer_id"));
  if (!offerId) return;
  await requireOfferAccess(offerId);
  const admin = createSupabaseAdmin();
  const imageId = strOrNull(formData.get("image_id"));
  if (!imageId) return;

  const { data: img } = await admin
    .from("offer_images")
    .select("image_url")
    .eq("id", imageId)
    .eq("offer_id", offerId)
    .maybeSingle();
  const imageUrl = img?.image_url?.trim();
  if (!imageUrl) {
    revalidatePath(`/panel/oferty/${offerId}`);
    return;
  }

  // Kasujemy tylko wpisy-rzuty wskazujące na to zdjęcie (referencja, storage_path null).
  await admin
    .from("offer_floorplans")
    .delete()
    .eq("offer_id", offerId)
    .eq("kind", "image")
    .eq("url", imageUrl);

  // Odśwież „primary" floor_plan_image_url: jeśli wskazywał na to zdjęcie, ustaw kolejny
  // rzut-obraz (najniższy order) albo null.
  const { data: off } = await admin
    .from("offers")
    .select("floor_plan_image_url")
    .eq("id", offerId)
    .maybeSingle();
  if (off?.floor_plan_image_url?.trim() === imageUrl) {
    const { data: rest } = await admin
      .from("offer_floorplans")
      .select("url,order_index")
      .eq("offer_id", offerId)
      .eq("kind", "image")
      .order("order_index", { ascending: true })
      .limit(1);
    const nextUrl = rest?.[0]?.url?.trim() || null;
    await admin.from("offers").update({ floor_plan_image_url: nextUrl }).eq("id", offerId);
  }

  revalidatePath(`/panel/oferty/${offerId}`);
  await revalidateOfferPublicPath(admin, offerId);
  // Bez redirect() - jak przy oznaczaniu, zostawiamy widok w miejscu.
  return;
}

export async function deleteOfferFloorPlanPdfAction(formData: FormData) {
  const offerId = strOrNull(formData.get("offer_id"));
  if (!offerId) return;
  await requireOfferAccess(offerId);
  const admin = createSupabaseAdmin();
  const floorplanId = strOrNull(formData.get("floorplan_id"));
  if (!offerId || !floorplanId) return;

  const { data: fp } = await admin
    .from("offer_floorplans")
    .select("id,url,storage_path")
    .eq("id", floorplanId)
    .maybeSingle();
  if (fp?.storage_path) {
    await admin.storage.from(FLOORPLANS_BUCKET).remove([fp.storage_path]);
  } else if (fp?.url) {
    const path = storagePathFromBucketPublicUrl(fp.url, FLOORPLANS_BUCKET);
    if (path) await admin.storage.from(FLOORPLANS_BUCKET).remove([path]);
  }
  await admin.from("offer_floorplans").delete().eq("id", floorplanId);

  const { data: rest } = await admin
    .from("offer_floorplans")
    .select("url,order_index")
    .eq("offer_id", offerId)
    .eq("kind", "pdf")
    .order("order_index", { ascending: true })
    .limit(1);
  const nextUrl = rest?.[0]?.url?.trim() || null;
  await admin.from("offers").update({ floor_plan_pdf_url: nextUrl }).eq("id", offerId);
  revalidatePath(`/panel/oferty/${offerId}`);
  await revalidateOfferPublicPath(admin, offerId);
  redirect(`/panel/oferty/${offerId}?saved=1`);
}

function streamVideoIdOrRedirect(offerId: string, label: string, raw: string | null): string | null {
  if (!raw) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(raw)) {
    redirect(
      `/panel/oferty/${offerId}?error=${encodeURIComponent(
        `Nieprawidłowy format ID (${label}) - dozwolone są tylko litery, cyfry, myślnik i podkreślenie.`,
      )}`,
    );
  }
  return raw;
}

export async function upsertOfferMediaAction(formData: FormData) {
  const offerId = strOrNull(formData.get("offer_id"));
  if (!offerId) {
    redirect(`/panel/oferty?error=${encodeURIComponent("Brak identyfikatora oferty.")}`);
  }
  await requireOfferAccess(offerId);
  const user = await requireSessionUser();
  const admin = createSupabaseAdmin();

  const { data: off, error: offErr } = await admin.from("offers").select("galactica_offer_id").eq("id", offerId).maybeSingle();
  if (offErr || !off?.galactica_offer_id) {
    redirect(`/panel/oferty?error=${encodeURIComponent("Nie znaleziono oferty.")}`);
  }

  const short = streamVideoIdOrRedirect(offerId, "wersja krótka", strOrNull(formData.get("cloudflare_video_short_id")));
  const long = streamVideoIdOrRedirect(offerId, "wersja długa", strOrNull(formData.get("cloudflare_video_long_id")));

  if (!short && !long) {
    const { error: delErr } = await admin.from("offer_media").delete().eq("offer_id", offerId);
    if (delErr) {
      redirect(`/panel/oferty/${offerId}?error=${encodeURIComponent(delErr.message)}`);
    }
  } else {
    const { error } = await admin.from("offer_media").upsert(
      {
        offer_id: offerId,
        galactica_offer_id: off.galactica_offer_id,
        cloudflare_video_short_id: short,
        cloudflare_video_long_id: long,
        status: "ready",
        uploaded_by: user.email ?? null,
      },
      { onConflict: "offer_id" },
    );
    if (error) {
      redirect(`/panel/oferty/${offerId}?error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath(`/panel/oferty/${offerId}`);
  revalidatePath("/panel/oferty");
  revalidatePath("/oferty");
  await revalidateOfferPublicPath(admin, offerId);
  revalidatePath("/");
  redirect(`/panel/oferty/${offerId}?videoSaved=1`);
}

export async function attachStreamVideoSlotAction(
  offerId: string,
  slot: "short" | "long",
  videoId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireOfferAccess(offerId);
  const user = await requireSessionUser();
  const trimmed = videoId.trim();
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { ok: false, error: "Nieprawidłowy format ID wideo." };
  }

  const admin = createSupabaseAdmin();
  const { data: off, error: oe } = await admin.from("offers").select("galactica_offer_id").eq("id", offerId).maybeSingle();
  if (oe || !off?.galactica_offer_id) {
    return { ok: false, error: "Nie znaleziono oferty." };
  }

  const { data: existing } = await admin
    .from("offer_media")
    .select("cloudflare_video_short_id, cloudflare_video_long_id")
    .eq("offer_id", offerId)
    .maybeSingle();

  const short = slot === "short" ? trimmed : (existing?.cloudflare_video_short_id?.trim() ?? null);
  const long = slot === "long" ? trimmed : (existing?.cloudflare_video_long_id?.trim() ?? null);

  const { error } = await admin.from("offer_media").upsert(
    {
      offer_id: offerId,
      galactica_offer_id: off.galactica_offer_id,
      cloudflare_video_short_id: short,
      cloudflare_video_long_id: long,
      status: "ready",
      uploaded_by: user.email ?? null,
    },
    { onConflict: "offer_id" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/panel/oferty/${offerId}`);
  revalidatePath("/panel/oferty");
  revalidatePath("/oferty");
  await revalidateOfferPublicPath(admin, offerId);
  revalidatePath("/");
  return { ok: true };
}

/**
 * Usuwa film z jednego slotu (krótki / długi). Gdy po usunięciu nie zostaje żaden film,
 * kasujemy cały wiersz `offer_media`. Używane przez przycisk „Usuń film" w panelu.
 */
export async function detachStreamVideoSlotAction(
  offerId: string,
  slot: "short" | "long",
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireOfferAccess(offerId);
  const admin = createSupabaseAdmin();

  const { data: existing } = await admin
    .from("offer_media")
    .select("cloudflare_video_short_id, cloudflare_video_long_id")
    .eq("offer_id", offerId)
    .maybeSingle();

  if (!existing) return { ok: true };

  const short = slot === "short" ? null : (existing.cloudflare_video_short_id?.trim() ?? null);
  const long = slot === "long" ? null : (existing.cloudflare_video_long_id?.trim() ?? null);

  if (!short && !long) {
    const { error } = await admin.from("offer_media").delete().eq("offer_id", offerId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await admin
      .from("offer_media")
      .update({ cloudflare_video_short_id: short, cloudflare_video_long_id: long })
      .eq("offer_id", offerId);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/panel/oferty/${offerId}`);
  revalidatePath("/panel/oferty");
  revalidatePath("/oferty");
  await revalidateOfferPublicPath(admin, offerId);
  revalidatePath("/");
  return { ok: true };
}

/**
 * Zapisuje (lub czyści) link do filmu YouTube w kolumnie `offers.youtube_url`.
 * Pusty `rawValue` = wyczyszczenie (null). Link normalizujemy do kanonicznego `watch?v=…`;
 * gdy nie da się rozpoznać - zwracamy błąd zamiast zapisywać śmieci.
 *
 * UWAGA: Galactica jest źródłem prawdy dla YouTube - import nadpisuje tę kolumnę przy
 * każdej synchronizacji. Ręczna zmiana/wyczyszczenie działa od razu, ale jest tymczasowa:
 * kolejny eksport z Galactiki przywróci wartość z Galactiki (albo ją wyczyści).
 */
export async function setOfferYoutubeAction(
  offerId: string,
  rawValue: string,
): Promise<{ ok: true; value: string | null } | { ok: false; error: string }> {
  await requireOfferAccess(offerId);
  const admin = createSupabaseAdmin();

  const trimmed = rawValue.trim();
  let value: string | null = null;
  if (trimmed.length > 0) {
    value = normalizeYoutubeUrlFromForm(trimmed);
    if (value === null) {
      return {
        ok: false,
        error: "Nie rozpoznano linku YouTube. Wklej pełny link (youtube.com / youtu.be) albo samo ID filmu.",
      };
    }
  }

  const { error } = await admin.from("offers").update({ youtube_url: value }).eq("id", offerId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/panel/oferty/${offerId}`);
  revalidatePath("/oferty");
  await revalidateOfferPublicPath(admin, offerId);
  revalidatePath("/");
  return { ok: true, value };
}
