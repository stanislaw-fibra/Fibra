// READ-ONLY: sumuje realne rozmiary bucketów przez Storage API (aktualny stan obiektów).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
function loadEnv() {
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = {};
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[m[1]] = v;
  } return env;
}
const env = loadEnv();
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const mb = (b) => (b / 1024 / 1024).toFixed(1) + " MB";
async function sumBucket(bucket, prefix = "") {
  let bytes = 0, files = 0, offset = 0;
  for (;;) {
    const { data, error } = await db.storage.from(bucket).list(prefix, { limit: 1000, offset });
    if (error) throw error;
    for (const e of data) {
      const path = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.id === null) { const r = await sumBucket(bucket, path); bytes += r.bytes; files += r.files; }
      else { bytes += e.metadata?.size ?? 0; files++; }
    }
    if (data.length < 1000) break; offset += 1000;
  }
  return { bytes, files };
}
async function main() {
  const buckets = ["offer-images", "course-materials", "agent-photos", "offer-floorplans"];
  let total = 0;
  console.log("\n=== Realny rozmiar Storage (Storage API) ===\n");
  for (const b of buckets) {
    const r = await sumBucket(b);
    total += r.bytes;
    console.log(`  ${b.padEnd(18)} ${String(r.files).padStart(5)} plików  ${mb(r.bytes).padStart(10)}`);
  }
  console.log("  " + "-".repeat(44));
  console.log(`  ${"RAZEM".padEnd(18)} ${"".padStart(5)}          ${mb(total).padStart(10)}  (limit Free: 1 GB)\n`);
}
main().catch((e) => { console.error(e); process.exit(1); });
