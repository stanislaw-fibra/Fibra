/**
 * Nadaje publiczny slug (`fibra.pl/agent/<slug>`) każdemu agentowi, który go jeszcze nie ma.
 *
 * Ta sama logika co `src/lib/agent-slug.ts` (panel + import z VIRGO) i trigger w
 * `supabase/migrations/20260730000000_agents_slug_autofill.sql`. Skrypt jest tu po to,
 * żeby dociągnąć istniejące wpisy bez czekania na migrację - jest idempotentny,
 * NIE nadpisuje istniejących slugów.
 *
 *   npm run agents:slugs          # nadaje brakujące slugi
 *   DRY_RUN=1 npm run agents:slugs  # tylko pokazuje, co by zrobił
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { agentSlugCandidates } from "../src/lib/agent-slug";

dotenv.config({ path: ".env.local" });

const DRY_RUN = process.env.DRY_RUN === "1";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY w .env.local");
    process.exit(1);
  }
  const db = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await db
    .from("agents")
    .select("id,name,slug,is_team_visible,team_order")
    .order("team_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) {
    console.error("Nie udało się pobrać agentów:", error.message);
    process.exit(2);
  }

  const rows = (data ?? []) as {
    id: string;
    name: string | null;
    slug: string | null;
    is_team_visible: boolean | null;
  }[];
  const used = new Set(
    rows.map((r) => (r.slug ?? "").trim().toLowerCase()).filter(Boolean),
  );

  let assigned = 0;
  for (const row of rows) {
    if ((row.slug ?? "").trim()) continue;
    const candidate = agentSlugCandidates(row.name).find((c) => !used.has(c));
    if (!candidate) {
      console.warn(`- ${row.name}: nie udało się wygenerować sluga (pomijam)`);
      continue;
    }
    if (DRY_RUN) {
      console.log(`[dry-run] ${row.name} -> /agent/${candidate}`);
      used.add(candidate);
      continue;
    }
    const { error: upErr } = await db
      .from("agents")
      .update({ slug: candidate })
      .eq("id", row.id)
      .is("slug", null);
    if (upErr) {
      console.error(`- ${row.name}: ${upErr.message}`);
      continue;
    }
    used.add(candidate);
    assigned++;
    console.log(`+ ${row.name} -> /agent/${candidate}`);
  }

  console.log(
    DRY_RUN
      ? "Dry-run zakończony (nic nie zapisano)."
      : `Gotowe. Nadano slugów: ${assigned}.`,
  );

  // Podsumowanie: aktualne linki wszystkich agentów.
  const { data: after } = await db
    .from("agents")
    .select("name,slug,is_team_visible,team_order")
    .order("team_order", { ascending: true })
    .order("name", { ascending: true });
  console.log("\nLinki agentów:");
  for (const a of (after ?? []) as {
    name: string;
    slug: string | null;
    is_team_visible: boolean | null;
  }[]) {
    const status = a.is_team_visible ? "widoczny" : "ukryty (404)";
    console.log(`  ${a.name.padEnd(26)} ${a.slug ? `fibra.pl/agent/${a.slug}` : "(brak sluga)"}  [${status}]`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
