/**
 * Jednorazowa diagnostyka: ostatnie wpisy z import_runs + stan tabeli offers.
 * Pokazuje, czy cron faktycznie zaciągał pliki z FTP i z jakim skutkiem.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Brak NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  const db = createClient(url, key, { auth: { persistSession: false } });

  console.log("=== Ostatnie 15 importów (import_runs) ===");
  const { data: runs, error: rErr } = await db
    .from("import_runs")
    .select("started_at, finished_at, status, source_filename, import_type, offers_created, offers_updated, offers_deleted, images_imported, errors_count")
    .order("started_at", { ascending: false })
    .limit(15);
  if (rErr) console.error("import_runs error:", rErr.message);
  else if (!runs?.length) console.log("(brak żadnych wpisów — import nigdy się nie wykonał)");
  else for (const r of runs) {
    console.log(
      `${r.started_at}  [${r.status}/${r.import_type ?? "?"}]  ${r.source_filename ?? "?"}  ` +
      `+${r.offers_created} ~${r.offers_updated} -${r.offers_deleted}  img:${r.images_imported}  err:${r.errors_count}`,
    );
  }

  console.log("\n=== Stan tabeli offers ===");
  const total = await db.from("offers").select("id", { count: "exact", head: true });
  const active = await db.from("offers").select("id", { count: "exact", head: true }).eq("is_active", true);
  const manual = await db.from("offers").select("id", { count: "exact", head: true }).like("galactica_offer_id", "MANUAL-%");
  console.log(`offers total:   ${total.count}`);
  console.log(`offers active:  ${active.count}`);
  console.log(`offers MANUAL:  ${manual.count}`);

  console.log("\n=== Aktywne oferty wg source_branch ===");
  const { data: branches, error: bErr } = await db.from("offers").select("source_branch").eq("is_active", true);
  if (bErr) console.error("branch error:", bErr.message);
  else {
    const counts: Record<string, number> = {};
    for (const o of branches ?? []) {
      const b = (o as { source_branch: string | null }).source_branch ?? "(null)";
      counts[b] = (counts[b] ?? 0) + 1;
    }
    for (const [b, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(`  ${b}: ${n}`);
  }

  console.log("\n=== Aktywne oferty z rolką (short video) ===");
  const withReel = await db
    .from("offer_media")
    .select("offer_id, offers!inner(is_active)", { count: "exact", head: true })
    .not("cloudflare_video_short_id", "is", null)
    .eq("offers.is_active", true);
  if (withReel.error) console.error("reel error:", withReel.error.message);
  else console.log(`  aktywne oferty z rolką (widoczne na stronie głównej): ${withReel.count}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
