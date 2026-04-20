"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { intFromHumanOrNull, parseHumanNumber } from "@/lib/parse-human-number";
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
 * `/oferty/{slug}`, nie `/oferty/{uuid}`). Gdy slug jest pusty — fallback do UUID-a.
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

function strOrNull(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function boolFromCheckbox(v: FormDataEntryValue | null): boolean {
  return v === "on" || v === "true" || v === "1";
}

export async function toggleOfferActiveAction(formData: FormData) {
  await requireSessionUser();
  const id = strOrNull(formData.get("id"));
  const activeRaw = strOrNull(formData.get("active"));
  if (!id || !activeRaw) return;
  const is_active = activeRaw === "true";
  const admin = createSupabaseAdmin();
  const { error } = await admin.from("offers").update({ is_active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/panel/oferty");
  revalidatePath("/oferty");
  await revalidateOfferPublicPath(admin, id);
  revalidatePath("/");
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
  const agent_id = strOrNull(formData.get("agent_id"));

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
    description: strOrNull(formData.get("description")),
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
  await requireSessionUser();
  const admin = createSupabaseAdmin();
  const id = strOrNull(formData.get("id"));
  if (!id) redirect(`/panel/oferty?error=${encodeURIComponent("Brak ID oferty.")}`);

  const agent_id = strOrNull(formData.get("agent_id"));
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
    description: strOrNull(formData.get("description")),
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
  await requireSessionUser();
  const admin = createSupabaseAdmin();
  const offerId = strOrNull(formData.get("offer_id"));
  const galactica_offer_id = strOrNull(formData.get("galactica_offer_id"));
  const file = formData.get("file");
  if (!offerId || !galactica_offer_id || !file || !(file instanceof File) || file.size === 0) {
    redirect(`/panel/oferty/${offerId ?? ""}?error=${encodeURIComponent("Wybierz plik graficzny.")}`);
  }

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

function storagePathFromPublicUrl(url: string): string | null {
  const marker = "/offer-images/";
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

export async function deleteOfferImageAction(formData: FormData) {
  await requireSessionUser();
  const admin = createSupabaseAdmin();
  const imageId = strOrNull(formData.get("image_id"));
  const offerId = strOrNull(formData.get("offer_id"));
  if (!imageId || !offerId) return;

  const { data: img } = await admin.from("offer_images").select("image_url").eq("id", imageId).maybeSingle();
  const path = img?.image_url ? storagePathFromPublicUrl(img.image_url) : null;
  if (path) {
    await admin.storage.from("offer-images").remove([path]);
  }
  await admin.from("offer_images").delete().eq("id", imageId);
  revalidatePath(`/panel/oferty/${offerId}`);
  await revalidateOfferPublicPath(admin, offerId);
  redirect(`/panel/oferty/${offerId}`);
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
  const user = await requireSessionUser();
  const admin = createSupabaseAdmin();
  const offerId = strOrNull(formData.get("offer_id"));
  if (!offerId) {
    redirect(`/panel/oferty?error=${encodeURIComponent("Brak identyfikatora oferty.")}`);
  }

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
