import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ImageInput {
  order: number;
  filename: string;
  buffer: Buffer;
}

// Wariant "leniwy": bufor pobieramy dopiero, gdy zdjęcie jest NOWE (nie ma go jeszcze
// w bazie). Dla VIRGO to kluczowe - każdy obraz ciągniemy osobnym GetImage2, a API ostro
// limituje liczbę zapytań, więc nie wolno pobierać tego, co już mamy. `fetchBuffer` zwraca
// null, gdy pobranie się nie uda (np. rate-limit) - takie zdjęcie pomijamy i wróci następnym razem.
export interface LazyImageInput {
  order: number;
  filename: string;
  fetchBuffer: () => Promise<Buffer | null>;
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
  // Ścieżka FTP ma bufory od ręki - opakowujemy je w fetchBuffer i lecimy tą samą logiką.
  return syncOfferImagesLazy(
    supabase,
    offerId,
    galacticaOfferId,
    incoming.map((i) => ({
      order: i.order,
      filename: i.filename,
      fetchBuffer: async () => i.buffer,
    })),
  );
}

export async function syncOfferImagesLazy(
  supabase: SupabaseClient,
  offerId: string,
  galacticaOfferId: string,
  incoming: LazyImageInput[],
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

    // Nowe zdjęcie - dopiero TERAZ pobieramy bufor (FTP: z ZIP-a; VIRGO: GetImage2).
    const buffer = await img.fetchBuffer();
    if (!buffer) continue; // pobranie się nie udało (rate-limit / błąd) - pominie, wróci następnym razem

    const path = storagePath(galacticaOfferId, img.order, img.filename);
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, buffer, {
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

// Etykieta wierszy rzutu, którymi ZARZĄDZA import. Reguła własności: importer dotyka
// wyłącznie wierszy `label = RZUT_IMPORT_LABEL AND storage_path IS NULL`. Dzięki temu
// NIE rusza rzutów dodanych ręcznie w panelu (te mają storage_path albo inną etykietę,
// np. "Rzut z galerii"). Etykieta dla zdjęć-rzutów nie jest pokazywana w UI (galeria
// rzutów renderuje same URL-e), więc to bezpieczny marker.
const RZUT_IMPORT_LABEL = "Rzut";

export interface FloorplanSyncResult {
  added: number;
  removed: number;
}

/**
 * Dopina rzuty z Galactiki do `offer_floorplans`, wskazując zdjęcia już wgrane do
 * `offer-images` (te same pliki są w galerii). Idempotentne i bezpieczne dla rzutów
 * dodanych ręcznie - zarządza tylko swoimi wierszami (patrz RZUT_IMPORT_LABEL).
 *
 * `rzutFilenames` to nazwy plików po sanityzacji (zgodne z offer_images.source_filename).
 * Zdjęcia jeszcze nie wgrane (rate-limit) po prostu nie mają wiersza - dopną się, gdy
 * upload się powiedzie w kolejnym runie.
 */
export async function syncOfferFloorplansFromGallery(
  supabase: SupabaseClient,
  offerId: string,
  rzutFilenames: string[],
): Promise<FloorplanSyncResult> {
  // Wiersze rzutu, którymi zarządza import.
  const { data: existing, error: exErr } = await supabase
    .from("offer_floorplans")
    .select("id, url")
    .eq("offer_id", offerId)
    .eq("label", RZUT_IMPORT_LABEL)
    .is("storage_path", null);
  if (exErr) throw exErr;

  // Wgrane już zdjęcia-rzuty (po source_filename). Gdy lista pusta - i tak chcemy
  // posprzątać ewentualne stare wiersze importu (rzut zniknął z Galactiki).
  const uploaded =
    rzutFilenames.length > 0
      ? (
          await supabase
            .from("offer_images")
            .select("image_url, source_filename, order_index")
            .eq("offer_id", offerId)
            .in("source_filename", rzutFilenames)
        ).data ?? []
      : [];

  const desired = uploaded
    .filter((i) => i.image_url)
    .map((i, idx) => ({ url: i.image_url as string, order_index: i.order_index ?? idx }));
  const desiredUrls = new Set(desired.map((d) => d.url));
  const existingUrls = new Set((existing ?? []).map((e) => e.url));

  // Usuń wiersze importu, których URL-a już nie ma wśród rzutów (rzut usunięty w Galactice).
  const toDelete = (existing ?? []).filter((e) => !desiredUrls.has(e.url)).map((e) => e.id);
  let removed = 0;
  if (toDelete.length > 0) {
    const { error } = await supabase.from("offer_floorplans").delete().in("id", toDelete);
    if (error) throw error;
    removed = toDelete.length;
  }

  // Dopisz brakujące (po URL-u, żeby nie dublować).
  const toInsert = desired
    .filter((d) => !existingUrls.has(d.url))
    .map((d) => ({
      offer_id: offerId,
      kind: "image",
      label: RZUT_IMPORT_LABEL,
      url: d.url,
      storage_path: null,
      order_index: d.order_index,
    }));
  let added = 0;
  if (toInsert.length > 0) {
    const { error } = await supabase.from("offer_floorplans").insert(toInsert);
    if (error) throw error;
    added = toInsert.length;
  }

  return { added, removed };
}
