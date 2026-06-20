// Kasuje sieroty zdjęć w offer-images: oferty NIEAKTYWNE, które zniknęły z VIRGO
// (nie MANUAL-, nie hidden_by_admin) oraz ewentualne foldery bez oferty w bazie.
//
// DOMYŚLNIE DRY-RUN (nic nie kasuje, tylko pokazuje). Realne kasowanie: CONFIRM=1.
//   node scripts/clean-storage-orphans.mjs            <- podgląd
//   CONFIRM=1 node scripts/clean-storage-orphans.mjs  <- wykonanie
//
// Dla każdej oferty z zestawu:
//   1) usuwa pliki z bucketa offer-images
//   2) usuwa wiersze offer_images (dzięki temu re-import odtworzy zdjęcia, jeśli oferta wróci)
//   3) usuwa rzuty z galerii (offer_floorplans: label='Rzut' AND storage_path IS NULL),
//      które wskazywały na skasowane URL-e. Ręcznie wgranych rzutów (storage_path != null) nie rusza.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = {};
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[m[1]] = v;
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Brak URL/SERVICE_ROLE_KEY w .env.local"); process.exit(1); }
const db = createClient(url, key, { auth: { persistSession: false } });
const BUCKET = "offer-images";
const CONFIRM = process.env.CONFIRM === "1";
// Próg wieku: kasujemy zdjęcia oferty nieaktywnej dopiero, gdy jest nieaktywna od >= tylu dni.
// Chroni przed re-downloadem zdjęć ofert, które chwilowo wypadły z feedu i zaraz wrócą.
// INACTIVE_DAYS=0 wyłącza próg (skasuje każdą nieaktywną sierotę - jak jednorazowy sweep).
const INACTIVE_DAYS = process.env.INACTIVE_DAYS !== undefined ? Number(process.env.INACTIVE_DAYS) : 30;
const cutoffIso = new Date(Date.now() - INACTIVE_DAYS * 86400_000).toISOString();
const mb = (b) => (b / 1024 / 1024).toFixed(1) + " MB";

async function loadOffers() {
  const map = new Map();
  let from = 0;
  for (;;) {
    const { data, error } = await db.from("offers")
      .select("id, galactica_offer_id, is_active, hidden_by_admin, updated_at").range(from, from + 999);
    if (error) throw error;
    for (const o of data) map.set(o.galactica_offer_id, o);
    if (data.length < 1000) break;
    from += 1000;
  }
  return map;
}
async function listFolders() {
  const out = []; let offset = 0;
  for (;;) {
    const { data, error } = await db.storage.from(BUCKET).list("", { limit: 1000, offset });
    if (error) throw error;
    for (const e of data) if (e.id === null) out.push(e.name);
    if (data.length < 1000) break; offset += 1000;
  }
  return out;
}
async function listFiles(gid) {
  const out = []; let offset = 0;
  for (;;) {
    const { data, error } = await db.storage.from(BUCKET).list(gid, { limit: 1000, offset });
    if (error) throw error;
    for (const f of data) if (f.id !== null) out.push({ path: `${gid}/${f.name}`, size: f.metadata?.size ?? 0 });
    if (data.length < 1000) break; offset += 1000;
  }
  return out;
}
function isDeletable(gid, offers) {
  const o = offers.get(gid);
  if (!o) return true;                                  // brak oferty -> twarda sierota
  if (o.is_active) return false;                        // aktywna -> chroń
  if (gid.startsWith("MANUAL-")) return false;          // ręczna -> chroń
  if (o.hidden_by_admin) return false;                  // ukryta ręcznie -> chroń
  if (INACTIVE_DAYS > 0 && o.updated_at && o.updated_at > cutoffIso) return false; // za świeża -> chroń (może wrócić)
  return true;                                          // nieaktywna od dawna, zniknęła z VIRGO
}

async function main() {
  const offers = await loadOffers();
  const folders = await listFolders();

  // BEZPIECZNIKI: bez ofert nie klasyfikujemy; nie pozwalamy skasować absurdalnie dużo.
  if (offers.size === 0) { console.error("STOP: baza ofert pusta - przerywam, by nie skasować wszystkiego."); process.exit(2); }
  const targets = folders.filter((g) => isDeletable(g, offers));
  if (folders.length > 0 && targets.length / folders.length > 0.7) {
    console.error(`STOP: zestaw do skasowania to ${targets.length}/${folders.length} folderów (>70%). Podejrzane - przerywam.`);
    process.exit(2);
  }

  console.log(`\n${CONFIRM ? "‼️  TRYB KASOWANIA (CONFIRM=1)" : "🔍 DRY-RUN (podgląd, nic nie kasuję)"}`);
  console.log(`Próg wieku: ${INACTIVE_DAYS > 0 ? `oferty nieaktywne od >= ${INACTIVE_DAYS} dni` : "WYŁĄCZONY (każda nieaktywna)"}`);
  console.log(`Oferty w bazie: ${offers.size} | foldery: ${folders.length} | do skasowania: ${targets.length}\n`);

  let totFiles = 0, totBytes = 0;
  for (const gid of targets) {
    const files = await listFiles(gid);
    const bytes = files.reduce((s, f) => s + f.size, 0);
    totFiles += files.length; totBytes += bytes;
    const offer = offers.get(gid);
    console.log(`  ${gid.padEnd(16)} ${String(files.length).padStart(3)} plików  ${mb(bytes).padStart(9)}  ${offer ? "(oferta nieaktywna)" : "(brak oferty)"}`);

    if (!CONFIRM) continue;

    // 1) Pliki ze storage (batchami po 100).
    for (let i = 0; i < files.length; i += 100) {
      const batch = files.slice(i, i + 100).map((f) => f.path);
      const { error } = await db.storage.from(BUCKET).remove(batch);
      if (error) throw error;
    }
    // 2) Wiersze offer_images.
    {
      const { error } = await db.from("offer_images").delete().eq("galactica_offer_id", gid);
      if (error) throw error;
    }
    // 3) Rzuty z galerii (tylko import-managed: label='Rzut' i storage_path IS NULL).
    if (offer) {
      const { error } = await db.from("offer_floorplans").delete()
        .eq("offer_id", offer.id).eq("label", "Rzut").is("storage_path", null);
      if (error) throw error;
    }
  }

  console.log("\n----------------------------------------------------------");
  console.log(`${CONFIRM ? "SKASOWANO" : "DO SKASOWANIA"}: ${targets.length} ofert, ${totFiles} plików, ${mb(totBytes)}`);
  console.log("----------------------------------------------------------");
  if (!CONFIRM) console.log("\nTo był podgląd. Aby wykonać: CONFIRM=1 node scripts/clean-storage-orphans.mjs\n");
  else console.log("\nGotowe. Sprawdź licznik Storage w dashboardzie Supabase.\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
