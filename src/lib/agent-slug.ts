/**
 * Slug agenta = jego publiczny link `fibra.pl/agent/<slug>`.
 *
 * Zasada: krótko i do zapamiętania - samo imię (`justyna`, `arek`), bez polskich
 * znaków. Gdy imię jest już zajęte (dwie Anny) albo zarezerwowane, schodzimy do
 * `imie-nazwisko`, a w ostateczności dopinamy licznik.
 *
 * Każdy agent ma mieć link automatycznie - dlatego `ensureAgentSlug()` wołamy
 * wszędzie, gdzie agent powstaje albo jest edytowany (panel, import z VIRGO).
 * Dodatkowo ten sam algorytm siedzi w triggerze bazy
 * (`supabase/migrations/20260730000000_agents_slug_autofill.sql`), żeby wpisy
 * dodane ręcznie w SQL też dostały slug.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/slug";

/** Slugi kolidujące z trasami/segmentami serwisu - nie oddajemy ich agentom. */
const RESERVED_SLUGS = new Set([
  "agent",
  "agenci",
  "api",
  "kontakt",
  "kurs",
  "oferty",
  "panel",
  "zespol",
]);

/** Ile wariantów `imie-2`, `imie-3`… próbujemy zanim się poddamy. */
const MAX_NUMBERED_TRIES = 20;

/**
 * Kandydaci na slug w kolejności preferencji: imię, imię-nazwisko, imię-2, imię-3…
 * Czysta funkcja - bez bazy, łatwa do testu i identyczna z logiką triggera SQL.
 */
export function agentSlugCandidates(name: string | null | undefined): string[] {
  const clean = (name ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const first = slugify(clean.split(" ")[0] ?? "");
  const full = slugify(clean);
  const base = first || full;
  if (!base) return [];

  const out: string[] = [];
  if (first && !RESERVED_SLUGS.has(first)) out.push(first);
  if (full && full !== first) out.push(full);
  for (let i = 2; i <= MAX_NUMBERED_TRIES; i++) out.push(`${base}-${i}`);
  return out;
}

/** Kolumna `slug` jeszcze nie istnieje (migracja nie pojechała) - milcząco odpuszczamy. */
function isMissingSlugColumn(msg: string | null | undefined): boolean {
  const m = (msg ?? "").toLowerCase();
  return (
    m.includes("slug") &&
    (m.includes("does not exist") || m.includes("schema cache") || m.includes("could not find"))
  );
}

/**
 * Zapewnia, że agent ma slug. Zwraca slug (istniejący albo świeżo nadany) lub
 * `null`, gdy się nie udało (brak nazwiska, brak kolumny, błąd bazy).
 *
 * Nigdy nie nadpisuje istniejącego sluga - link raz wysłany klientowi ma działać.
 */
export async function ensureAgentSlug(
  supabase: SupabaseClient,
  agent: { id: string; name?: string | null; slug?: string | null },
): Promise<string | null> {
  const current = (agent.slug ?? "").trim();
  if (current) return current.toLowerCase();
  if (!agent.id) return null;

  // Gdy wywołujący nie miał sluga/nazwy pod ręką - dociągamy z bazy.
  let name = (agent.name ?? "").trim();
  if (!name || agent.slug === undefined) {
    const { data, error } = await supabase
      .from("agents")
      .select("name,slug")
      .eq("id", agent.id)
      .maybeSingle();
    if (error) {
      if (isMissingSlugColumn(error.message)) return null;
      console.warn("[agent-slug] odczyt agenta:", error.message);
      return null;
    }
    const row = data as { name: string | null; slug: string | null } | null;
    const existing = (row?.slug ?? "").trim();
    if (existing) return existing.toLowerCase();
    name = (row?.name ?? name).trim();
  }

  const candidates = agentSlugCandidates(name);
  if (candidates.length === 0) return null;

  const { data: taken, error: takenErr } = await supabase
    .from("agents")
    .select("slug")
    .not("slug", "is", null);
  if (takenErr) {
    if (isMissingSlugColumn(takenErr.message)) return null;
    console.warn("[agent-slug] lista slugów:", takenErr.message);
    return null;
  }
  const used = new Set(
    ((taken ?? []) as { slug: string | null }[])
      .map((r) => (r.slug ?? "").trim().toLowerCase())
      .filter(Boolean),
  );

  for (const candidate of candidates) {
    if (used.has(candidate)) continue;
    const { error } = await supabase
      .from("agents")
      .update({ slug: candidate })
      .eq("id", agent.id)
      .is("slug", null);
    if (!error) return candidate;
    if (isMissingSlugColumn(error.message)) return null;
    // 23505 = unique_violation: ktoś zdążył wziąć ten slug, próbujemy kolejny.
    const code = (error as { code?: string }).code;
    if (code !== "23505" && !error.message.toLowerCase().includes("duplicate")) {
      console.warn("[agent-slug] zapis sluga:", error.message);
      return null;
    }
  }
  return null;
}
