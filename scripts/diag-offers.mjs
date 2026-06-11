// READ-ONLY diagnostyka ofert. Nie modyfikuje danych.
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
if (!url || !key) {
  console.error("Brak URL/SERVICE_ROLE_KEY");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const count = async (build) => {
  const { count, error } = await build(db.from("offers").select("*", { count: "exact", head: true }));
  if (error) throw error;
  return count ?? 0;
};

console.log("=== OGÓLNE LICZNIKI offers ===");
console.log("wszystkie wiersze:        ", await count((q) => q));
console.log("is_active = true:         ", await count((q) => q.eq("is_active", true)));
console.log("is_active = false:        ", await count((q) => q.eq("is_active", false)));
console.log("MANUAL-* (galactica_id):  ", await count((q) => q.like("galactica_offer_id", "MANUAL-%")));
console.log("active + MANUAL-*:        ", await count((q) => q.eq("is_active", true).like("galactica_offer_id", "MANUAL-%")));

// duplikaty galactica_offer_id
const { data: allRows, error: e2 } = await db
  .from("offers")
  .select("id, galactica_offer_id, is_active, agent_name, source_branch, slug")
  .order("galactica_offer_id", { ascending: true });
if (e2) throw e2;

const byGid = new Map();
for (const r of allRows) {
  const k = r.galactica_offer_id;
  byGid.set(k, (byGid.get(k) ?? []).concat(r));
}
const dups = [...byGid.entries()].filter(([, rows]) => rows.length > 1);
console.log("\n=== DUPLIKATY galactica_offer_id ===");
console.log("liczba zduplikowanych ID: ", dups.length);
for (const [gid, rows] of dups.slice(0, 20)) {
  console.log(`  ${gid}: ${rows.length}x  active=[${rows.map((r) => r.is_active).join(",")}]  branch=[${rows.map((r) => r.source_branch).join(",")}]`);
}

console.log("\n=== source_branch (wszystkie) ===");
const byBranch = new Map();
for (const r of allRows) byBranch.set(r.source_branch ?? "NULL", (byBranch.get(r.source_branch ?? "NULL") ?? 0) + 1);
for (const [b, c] of byBranch) console.log(`  ${b}: ${c}`);

console.log("\n=== source_branch (tylko aktywne) ===");
const byBranchActive = new Map();
for (const r of allRows.filter((r) => r.is_active)) byBranchActive.set(r.source_branch ?? "NULL", (byBranchActive.get(r.source_branch ?? "NULL") ?? 0) + 1);
for (const [b, c] of byBranchActive) console.log(`  ${b}: ${c}`);

console.log("\n=== AKTYWNE oferty wg agenta ===");
const byAgent = new Map();
for (const r of allRows.filter((r) => r.is_active)) {
  const a = r.agent_name?.trim() || "(brak agenta)";
  byAgent.set(a, (byAgent.get(a) ?? 0) + 1);
}
for (const [a, c] of [...byAgent.entries()].sort((x, y) => y[1] - x[1])) console.log(`  ${a}: ${c}`);

// media: które aktywne oferty mają zdjęcia / krótki film
const activeIds = allRows.filter((r) => r.is_active).map((r) => r.id);
const { data: imgs } = await db.from("offer_images").select("offer_id").in("offer_id", activeIds.slice(0, 1000));
const withImg = new Set((imgs ?? []).map((x) => x.offer_id));
const { data: media } = await db.from("offer_media").select("offer_id, cloudflare_video_short_id").in("offer_id", activeIds.slice(0, 1000));
const withShort = new Set((media ?? []).filter((m) => m.cloudflare_video_short_id).map((m) => m.offer_id));

console.log("\n=== MEDIA wśród aktywnych ===");
console.log("aktywne łącznie:          ", activeIds.length);
console.log("aktywne ze zdjęciami:     ", activeIds.filter((id) => withImg.has(id)).length);
console.log("aktywne bez zdjęć:        ", activeIds.filter((id) => !withImg.has(id)).length);
console.log("aktywne z krótkim filmem: ", activeIds.filter((id) => withShort.has(id)).length);

console.log("\n=== Darek - aktywne oferty (szczegóły) ===");
const darek = allRows.filter((r) => r.is_active && (r.agent_name ?? "").toLowerCase().includes("dar"));
for (const r of darek) {
  console.log(`  ${r.galactica_offer_id}  img=${withImg.has(r.id)} short=${withShort.has(r.id)}  branch=${r.source_branch}  slug=${r.slug}`);
}
console.log("Darek aktywnych razem:", darek.length);
