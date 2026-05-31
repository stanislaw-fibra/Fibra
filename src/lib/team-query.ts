import "server-only";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseAnon } from "@/lib/supabase/server-anon";
import { teamDefaultsFor } from "@/lib/team-defaults";

export type TeamRole = "founder" | "member";

export type TeamMember = {
  id: string;
  name: string;
  /** Rola wyświetlana pod nazwiskiem (np. „Założyciel, Prezes Zarządu"). */
  role: string;
  /** Pełny opis (wieloparagrafowy). */
  bio: string;
  /** Numer kontaktowy (tylko karty członków zespołu - założyciel ma własny CTA). */
  phone?: string;
  email?: string;
  /** URL zdjęcia portretowego - używane jako fallback gdy nie ma video. */
  photoUrl?: string;
  /** Cloudflare Stream ID krótkiego, pionowego filmu autoprezentacji. */
  cloudflareVideoId?: string;
  /** Klasyfikacja: czy to założyciel (osobna sekcja na górze) czy zwykły członek zespołu. */
  kind: TeamRole;
  /** Kolejność wyświetlania w sekcji (mniejsze = wyżej). */
  order: number;
  /** Czy publicznie widoczny w sekcji „Zespół" na /o-fibrze. */
  isVisible: boolean;
  /** Slug do publicznego URL `/agent/<slug>` (np. "justyna"). */
  slug?: string;
};

const FOUNDER_ROLES = new Set([
  "założyciel",
  "założyciel, prezes zarządu",
  "prezes zarządu",
  "prezes",
]);

function classifyRole(role: string | null): TeamRole {
  if (!role) return "member";
  return FOUNDER_ROLES.has(role.trim().toLowerCase()) ? "founder" : "member";
}

type AgentRow = {
  id: string;
  name: string;
  email: string | null;
  phone_office: string | null;
  phone_mobile: string | null;
  photo_url: string | null;
  bio: string | null;
  bio_long?: string | null;
  team_role?: string | null;
  team_order?: number | null;
  is_team_visible?: boolean | null;
  cloudflare_video_id?: string | null;
  slug?: string | null;
};

const TEAM_SELECT = `
  id, name, email, phone_office, phone_mobile, photo_url, bio,
  bio_long, team_role, team_order, is_team_visible, cloudflare_video_id, slug
`;

const TEAM_SELECT_LEGACY = `
  id, name, email, phone_office, phone_mobile, photo_url, bio
`;

function isMissingTeamColumnError(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes("does not exist") &&
    (m.includes("bio_long") ||
      m.includes("team_role") ||
      m.includes("team_order") ||
      m.includes("is_team_visible") ||
      m.includes("cloudflare_video_id"))
  );
}

function normalize(row: AgentRow, opts?: { applyDefaults?: boolean }): TeamMember {
  // Domyślne treści (rola + biografia + widoczność) dla 3 osób z zespołu, kiedy w bazie nic
  // jeszcze nie ma. Dzięki temu panel /panel/zespol nie pokazuje pustego pola - admin od razu
  // widzi treść do edycji, a po pierwszym zapisie pełna prawda jedzie do Supabase.
  const fallback = opts?.applyDefaults ? teamDefaultsFor(row.name) : undefined;

  const dbRole = (row.team_role ?? "").trim();
  const role = dbRole || fallback?.role || (classifyRole(row.team_role ?? null) === "founder" ? "Założyciel" : "Specjalista");

  const dbBio = (row.bio_long?.trim() || row.bio?.trim() || "").trim();
  const bio = dbBio || fallback?.bio || "";

  // Klasyfikacja "founder vs member" - bierze pod uwagę zarówno rolę z DB, jak i fallback
  // (dla Bartosza Nosiadka rola "Założyciel..." sklasyfikuje się jako founder nawet gdy w bazie pusto).
  const kind = classifyRole(role);

  const phone = (row.phone_mobile?.trim() || row.phone_office?.trim() || "").trim() || undefined;

  // is_team_visible: jeśli kolumna istnieje i jest jednoznacznie ustawiona - używamy.
  // Inaczej, dla znanych osób z fallbacka domyślnie pokazujemy (zgodnie z prośbą klienta:
  // "oni już są przecież zapisani"), a dla nieznanych zostawiamy false.
  const isVisible =
    row.is_team_visible === true || row.is_team_visible === false
      ? row.is_team_visible === true
      : fallback?.isVisible === true;

  const dbOrder = typeof row.team_order === "number" ? row.team_order : 100;
  const order = dbOrder !== 100 ? dbOrder : (fallback?.order ?? 100);

  return {
    id: row.id,
    name: row.name,
    role,
    bio,
    phone,
    email: row.email?.trim() || undefined,
    photoUrl: row.photo_url?.trim() || undefined,
    cloudflareVideoId: row.cloudflare_video_id?.trim() || undefined,
    kind,
    order,
    isVisible,
    slug: row.slug?.trim() || undefined,
  };
}

/** Lista członków zespołu pokazywana publicznie na `/o-fibrze`. */
export async function getPublicTeamMembers(): Promise<TeamMember[]> {
  try {
    const supabase = getSupabaseAnon();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("agents")
      .select(TEAM_SELECT)
      .eq("is_active", true)
      .eq("is_team_visible", true)
      .order("team_order", { ascending: true });

    if (error) {
      // Migracja jeszcze nie pojechała - fallback do pustej listy żeby strona miała hardcoded fallback.
      if (isMissingTeamColumnError(error.message)) return [];
      console.warn("[team-query] public team:", error.message);
      return [];
    }
    const rows = ((data ?? []) as unknown) as AgentRow[];
    return rows.map((r) => normalize(r)).filter((m) => m.name?.trim());
  } catch (e) {
    console.warn("[team-query] public team exception:", e);
    return [];
  }
}

/**
 * Sprawdza, czy nowe kolumny zespołu (`bio_long`, `team_role`, `team_order`,
 * `is_team_visible`, `cloudflare_video_id`) są dostępne w `agents`. Pozwala panelowi
 * pokazać banner „uruchom migrację" i wyłączyć część funkcjonalności (np. wideo)
 * zamiast walić błędem 500 przy każdej akcji.
 */
export async function checkTeamSchemaReady(): Promise<{ ready: boolean; missing: string[] }> {
  const admin = createSupabaseAdmin();
  const probe = await admin.from("agents").select("bio_long,team_role,team_order,is_team_visible,cloudflare_video_id").limit(1);
  if (!probe.error) return { ready: true, missing: [] };

  const m = probe.error.message.toLowerCase();
  const candidates = ["bio_long", "team_role", "team_order", "is_team_visible", "cloudflare_video_id"];
  const missing = candidates.filter((c) => m.includes(c));
  if (missing.length > 0) return { ready: false, missing };
  // Inny błąd (np. RLS lub sieć) - traktujemy jako gotowy, żeby nie spamować banera.
  return { ready: true, missing: [] };
}

/**
 * Pobiera agenta po publicznym slugu (np. "justyna"). Używane przez `/agent/[slug]`
 * i przy filtrze ofert po agencie. Zwraca null gdy slug nie istnieje albo agent
 * jest ukryty (`is_team_visible = false`).
 */
export async function getPublicAgentBySlug(slug: string): Promise<TeamMember | null> {
  if (!slug?.trim()) return null;
  const normalized = slug.trim().toLowerCase();
  try {
    const supabase = getSupabaseAnon();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("agents")
      .select(TEAM_SELECT)
      .eq("slug", normalized)
      .eq("is_team_visible", true)
      .maybeSingle();
    if (error) {
      // Brak slug w schemacie - migracja niezaaplikowana; potraktuj jak brak agenta.
      if (
        isMissingTeamColumnError(error.message) ||
        (error.message.toLowerCase().includes("does not exist") && error.message.toLowerCase().includes("slug"))
      ) {
        return null;
      }
      console.warn("[team-query] agent by slug:", error.message);
      return null;
    }
    if (!data) return null;
    return normalize(data as AgentRow, { applyDefaults: true });
  } catch (e) {
    console.warn("[team-query] agent by slug exception:", e);
    return null;
  }
}

/** Lista wszystkich agentów dla panelu admina (z fallbackiem dla starszego schematu). */
export async function getAdminTeamMembers(): Promise<TeamMember[]> {
  const admin = createSupabaseAdmin();

  const primary = await admin
    .from("agents")
    .select(TEAM_SELECT)
    .order("team_order", { ascending: true })
    .order("name", { ascending: true });

  if (primary.error) {
    if (isMissingTeamColumnError(primary.error.message)) {
      const legacy = await admin.from("agents").select(TEAM_SELECT_LEGACY).order("name", { ascending: true });
      if (legacy.error) {
        console.warn("[team-query] admin team legacy:", legacy.error.message);
        return [];
      }
      const rows = ((legacy.data ?? []) as unknown) as AgentRow[];
      return rows.map((r) => normalize(r, { applyDefaults: true }));
    }
    console.warn("[team-query] admin team:", primary.error.message);
    return [];
  }

  const rows = ((primary.data ?? []) as unknown) as AgentRow[];
  return rows.map((r) => normalize(r, { applyDefaults: true }));
}
