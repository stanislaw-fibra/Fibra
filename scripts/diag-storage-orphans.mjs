// READ-ONLY audyt sierot w buckecie offer-images. NIC NIE KASUJE.
// Folder w storage = galactica_offer_id. Klasyfikacja wg statusu oferty w bazie:
//   active_keep            - oferta aktywna -> NIGDY nie ruszamy
//   inactive_manual_keep   - oferta ręczna (MANUAL-) nieaktywna -> NIE kasujemy (nieodtwarzalne)
//   inactive_hidden_keep   - oferta ukryta ręcznie (hidden_by_admin) -> NIE kasujemy (admin przywróci)
//   inactive_stale_DELETE  - oferta zniknęła z VIRGO -> BEZPIECZNE do skasowania (odtworzy się z importu)
//   hard_orphan_DELETE     - folder bez żadnej oferty w bazie -> BEZPIECZNE do skasowania
//
// Uruchom:  node scripts/diag-storage-orphans.mjs
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

const mb = (b) => (b / 1024 / 1024).toFixed(1) + " MB";

// Wszystkie oferty (stronicowanie po 1000) -> mapa gid -> {is_active, hidden_by_admin}
async function loadOffers() {
  const map = new Map();
  let from = 0;
  for (;;) {
    const { data, error } = await db
      .from("offers")
      .select("galactica_offer_id, is_active, hidden_by_admin")
      .range(from, from + 999);
    if (error) throw error;
    for (const o of data) map.set(o.galactica_offer_id, o);
    if (data.length < 1000) break;
    from += 1000;
  }
  return map;
}

// Wszystkie top-level foldery w buckecie (gid). Stronicowanie po 1000.
async function listFolders() {
  const folders = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await db.storage.from(BUCKET).list("", { limit: 1000, offset });
    if (error) throw error;
    for (const e of data) if (e.id === null) folders.push(e.name); // id===null => prefix/folder
    if (data.length < 1000) break;
    offset += 1000;
  }
  return folders;
}

// Pliki w jednym folderze -> [{path, size}]
async function listFiles(gid) {
  const out = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await db.storage.from(BUCKET).list(gid, { limit: 1000, offset });
    if (error) throw error;
    for (const f of data) {
      if (f.id === null) continue; // zagnieżdżony folder (nie spodziewany) - pomiń
      out.push({ path: `${gid}/${f.name}`, size: f.metadata?.size ?? 0 });
    }
    if (data.length < 1000) break;
    offset += 1000;
  }
  return out;
}

function classify(gid, offers) {
  const o = offers.get(gid);
  if (!o) return "hard_orphan_DELETE";
  if (o.is_active) return "active_keep";
  if (gid.startsWith("MANUAL-")) return "inactive_manual_keep";
  if (o.hidden_by_admin) return "inactive_hidden_keep";
  return "inactive_stale_DELETE";
}

async function main() {
  console.log("Ładuję oferty i listę folderów…");
  const offers = await loadOffers();
  const folders = await listFolders();
  console.log(`Oferty w bazie: ${offers.size}   |   Foldery w storage: ${folders.length}\n`);

  const cats = {};
  const deleteFolders = []; // gid-y do skasowania
  // Listujemy pliki tylko w folderach NIE-aktywnych (DELETE + manual/hidden keep) - aktywnych nie ruszamy,
  // a ich rozmiar znamy już z wcześniejszego SQL. To trzyma liczbę zapytań nisko.
  for (const gid of folders) {
    const cat = classify(gid, offers);
    cats[cat] ??= { files: 0, bytes: 0, folders: 0 };
    cats[cat].folders++;
    if (cat === "active_keep") { continue; } // nie listujemy - nie dotykamy
    const files = await listFiles(gid);
    cats[cat].files += files.length;
    cats[cat].bytes += files.reduce((s, f) => s + f.size, 0);
    if (cat.endsWith("DELETE")) deleteFolders.push(gid);
  }

  console.log("=== Klasyfikacja (offer-images) ===\n");
  const order = ["active_keep","inactive_manual_keep","inactive_hidden_keep","inactive_stale_DELETE","hard_orphan_DELETE"];
  let delBytes = 0, delFiles = 0;
  for (const cat of order) {
    const c = cats[cat]; if (!c) continue;
    const flag = cat.endsWith("DELETE") ? "  ⟵ do skasowania" : "";
    const sz = cat === "active_keep" ? "(nie listowano)" : mb(c.bytes);
    console.log(`${cat.padEnd(24)} ${String(c.folders).padStart(4)} ofert  ${String(c.files).padStart(5)} plików  ${sz.padStart(14)}${flag}`);
    if (cat.endsWith("DELETE")) { delBytes += c.bytes; delFiles += c.files; }
  }
  console.log("\n----------------------------------------------------------");
  console.log(`BEZPIECZNE DO SKASOWANIA: ${deleteFolders.length} ofert, ${delFiles} plików, ${mb(delBytes)}`);
  console.log("----------------------------------------------------------\n");
  console.log(`Oferty do wyczyszczenia (${deleteFolders.length}):`);
  console.log("  " + deleteFolders.slice(0, 60).join(", ") + (deleteFolders.length > 60 ? " …" : ""));
  console.log("\n(Nic nie zmieniono. Kasowanie: scripts/clean-storage-orphans.mjs z CONFIRM=1.)\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
