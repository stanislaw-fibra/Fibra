// READ-ONLY: szukamy w raw_params pola rozróżniającego firmę/oddział (Grupa Fibra vs Fibra Nieruchomości).
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
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: rows, error } = await db
  .from("offers")
  .select("galactica_offer_id, agent_name, agent_email, agent_phone_mobile, agent_phone_office, is_active, raw_params, category, listing_type, city")
  .eq("is_active", true)
  .not("galactica_offer_id", "like", "MANUAL-%");
if (error) throw error;

console.log("aktywnych ofert (bez MANUAL):", rows.length);

// 1) Wszystkie klucze raw_params + ile razy występują
const keyCount = new Map();
for (const r of rows) {
  const rp = r.raw_params && typeof r.raw_params === "object" ? r.raw_params : {};
  for (const k of Object.keys(rp)) keyCount.set(k, (keyCount.get(k) ?? 0) + 1);
}
console.log("\n=== WSZYSTKIE klucze raw_params (klucz: ile ofert) ===");
for (const [k, c] of [...keyCount.entries()].sort((a, b) => a[0].localeCompare(b[0]))) console.log(`  ${k}: ${c}`);

// 2) Kandydaci na pole firmy/oddziału
const candidates = [...keyCount.keys()].filter((k) =>
  /firm|oddzia|biuro|dzial|branch|company|agencj|spolk|nip|regon|kontakt|broker|office|department/i.test(k),
);
console.log("\n=== KANDYDACI na pole firmy/oddziału + rozkład wartości ===");
for (const k of candidates) {
  const dist = new Map();
  for (const r of rows) {
    const rp = r.raw_params ?? {};
    const v = rp[k];
    const key = v == null ? "(brak)" : String(v).slice(0, 60);
    dist.set(key, (dist.get(key) ?? 0) + 1);
  }
  console.log(`  [${k}]`);
  for (const [v, c] of [...dist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log(`     "${v}": ${c}`);
}

// 3) Agenci → e-mail/telefon (czy dzielą się na dwie domeny/grupy?)
console.log("\n=== AGENCI: e-mail + telefon biuro (czy widać dwie firmy?) ===");
const agents = new Map();
for (const r of rows) {
  const name = r.agent_name ?? "?";
  if (!agents.has(name)) agents.set(name, { email: r.agent_email, office: r.agent_phone_office, n: 0 });
  agents.get(name).n++;
}
for (const [name, v] of agents) console.log(`  ${name}: ${v.n} ofert | email=${v.email ?? "-"} | tel.biuro=${v.office ?? "-"}`);

// 4) Domeny e-mail agentów
console.log("\n=== Domeny e-mail agentów ===");
const domains = new Map();
for (const [, v] of agents) {
  const d = (v.email ?? "").split("@")[1] ?? "(brak)";
  domains.set(d, (domains.get(d) ?? 0) + 1);
}
for (const [d, c] of domains) console.log(`  ${d}: ${c} agentów`);

// 5) Prefiksy galactica_offer_id (FIB-DS, FIB-MS, ...) — może kodują firmę?
console.log("\n=== Prefiksy galactica_offer_id ===");
const pref = new Map();
for (const r of rows) {
  const m = r.galactica_offer_id.match(/^([A-Z]+-[A-Z]+)/);
  const p = m ? m[1] : r.galactica_offer_id;
  pref.set(p, (pref.get(p) ?? 0) + 1);
}
for (const [p, c] of [...pref.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${p}: ${c}`);
