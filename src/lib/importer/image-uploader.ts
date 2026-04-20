import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ImageInput {
  order: number;
  filename: string;
  buffer: Buffer;
}

export interface ImageSyncResult {
  uploaded: number;
  deleted: number;
  kept: number;
}

const BUCKET = "offer-images";

function storagePath(galacticaOfferId: string, order: number, filename: string): string {
  // Ścieżka zgodna ze specem: {galactica_offer_id}/{order_index}_{filename}
  return `${galacticaOfferId}/${order}_${filename}`;
}

function publicUrl(supabase: SupabaseClient, path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Synchronizuje zdjęcia oferty:
// - usuwa zdjęcia, których nie ma już w XML (Storage + DB)
// - uploaduje nowe
// - zachowuje istniejące (po source_filename)
export async function syncOfferImages(
  supabase: SupabaseClient,
  offerId: string,
  galacticaOfferId: string,
  incoming: ImageInput[],
): Promise<ImageSyncResult> {
  const { data: existing, error: selErr } = await supabase
    .from("offer_images")
    .select("id, source_filename, order_index, is_primary, image_url")
    .eq("offer_id", offerId);
  if (selErr) throw selErr;

  const byFilename = new Map<string, (typeof existing)[number]>();
  for (const row of existing ?? []) {
    if (row.source_filename) byFilename.set(row.source_filename, row);
  }

  const incomingNames = new Set(incoming.map((i) => i.filename));

  // Usuń nieobecne
  const toDelete = (existing ?? []).filter(
    (r) => !r.source_filename || !incomingNames.has(r.source_filename),
  );
  let deleted = 0;
  if (toDelete.length > 0) {
    const storagePaths = toDelete
      .map((r) =>
        r.source_filename
          ? storagePath(galacticaOfferId, r.order_index ?? 0, r.source_filename)
          : null,
      )
      .filter((p): p is string => !!p);

    if (storagePaths.length > 0) {
      await supabase.storage.from(BUCKET).remove(storagePaths);
    }
    const ids = toDelete.map((r) => r.id);
    const { error: delErr } = await supabase.from("offer_images").delete().in("id", ids);
    if (delErr) throw delErr;
    deleted = toDelete.length;
  }

  // Upload nowych + update metadata dla istniejących
  let uploaded = 0;
  let kept = 0;
  for (const img of incoming) {
    const isPrimary = img.order === 1;
    const existingRow = byFilename.get(img.filename);

    if (existingRow) {
      // upewnij się, że order_index / is_primary są zgodne z XML
      const updates: Record<string, unknown> = {};
      if (existingRow.order_index !== img.order) updates.order_index = img.order;
      if (existingRow.is_primary !== isPrimary) updates.is_primary = isPrimary;
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("offer_images")
          .update(updates)
          .eq("id", existingRow.id);
        if (error) throw error;
      }
      kept++;
      continue;
    }

    const path = storagePath(galacticaOfferId, img.order, img.filename);
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, img.buffer, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (upErr) throw upErr;

    const url = publicUrl(supabase, path);
    const { error: insErr } = await supabase.from("offer_images").insert({
      offer_id: offerId,
      galactica_offer_id: galacticaOfferId,
      source_filename: img.filename,
      image_url: url,
      order_index: img.order,
      is_primary: isPrimary,
    });
    if (insErr) throw insErr;

    uploaded++;
  }

  return { uploaded, deleted, kept };
}
