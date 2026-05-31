"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";
import { canonicalName, teamDefaultsFor } from "@/lib/team-defaults";

async function requireSessionUser() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    redirect("/panel/login");
  }
  return user;
}

function strOrNull(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function intFromForm(v: FormDataEntryValue | null, fallback: number): number {
  const s = strOrNull(v);
  if (!s) return fallback;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function boolFromCheckbox(v: FormDataEntryValue | null): boolean {
  return v === "on" || v === "true" || v === "1";
}

function sanitizeStreamId(raw: string | null | undefined): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  return /^[a-zA-Z0-9_-]+$/.test(s) ? s : null;
}

/**
 * Wykrywa błąd typu „kolumna nie istnieje” (PostgREST PGRST204 / „column ... does not exist”
 * / „could not find the X column of agents in the schema cache”). Klient prosił, żeby panel
 * działał z migracją lub bez - gdy nowych kolumn jeszcze nie ma, akcja musi się wycofać do
 * legacy schematu (`bio` + `name` + `is_active`) zamiast wywalać się błędem 500.
 */
function isMissingAgentColumnError(msg: string | null | undefined): {
  missing: Set<string>;
} | null {
  if (!msg) return null;
  const m = msg.toLowerCase();
  const candidates = ["bio_long", "team_role", "team_order", "is_team_visible", "cloudflare_video_id"];
  const hits = candidates.filter((c) => m.includes(c));
  if (hits.length === 0) return null;
  // Akceptujemy zarówno PostgREST schema cache, jak i klasyczny "does not exist" z Postgresa.
  if (
    m.includes("does not exist") ||
    m.includes("schema cache") ||
    m.includes("pgrst204") ||
    m.includes("could not find")
  ) {
    return { missing: new Set(hits) };
  }
  return null;
}

/**
 * Aktualizuje opis (bio_long lub fallback do bio), rolę i widoczność członka zespołu.
 *
 * Jeżeli kolumny `bio_long` / `team_role` / `team_order` / `is_team_visible` jeszcze nie istnieją
 * w bazie (migracja nieuruchomiona), zapisujemy minimalny patch z polem `bio` - dzięki temu
 * panel działa zaraz po deployu, a po dodaniu kolumn włącza się pełna funkcjonalność.
 */
export async function updateTeamMemberAction(formData: FormData) {
  await requireSessionUser();
  const admin = createSupabaseAdmin();

  const id = strOrNull(formData.get("id"));
  if (!id) redirect("/panel/zespol?error=Brak%20ID%20agenta");

  const bio = strOrNull(formData.get("bio_long"));
  const role = strOrNull(formData.get("team_role"));
  const orderVal = intFromForm(formData.get("team_order"), 100);
  const isVisible = boolFromCheckbox(formData.get("is_team_visible"));

  const fullPatch: Record<string, unknown> = {
    bio_long: bio,
    team_role: role,
    team_order: orderVal,
    is_team_visible: isVisible,
  };

  const result = await admin.from("agents").update(fullPatch).eq("id", id);
  if (result.error) {
    const missing = isMissingAgentColumnError(result.error.message);
    if (missing) {
      // Fallback: zapisujemy do `bio` (kolumna istnieje od początku), reszta poczeka na migrację.
      // Komunikujemy adminowi że pełna funkcjonalność wymaga migracji.
      const legacyPatch: Record<string, unknown> = { bio };
      const legacy = await admin.from("agents").update(legacyPatch).eq("id", id);
      if (legacy.error) {
        redirect(`/panel/zespol?error=${encodeURIComponent(legacy.error.message)}`);
      }
      revalidatePath("/panel/zespol");
      revalidatePath("/o-fibrze");
      redirect(
        `/panel/zespol?saved=${id}&warn=${encodeURIComponent(
          "Zapisano tylko opis. Pełne ustawienia (rola, kolejność, widoczność, film) wymagają migracji bazy - brakujące kolumny: " +
            [...missing.missing].join(", "),
        )}`,
      );
    }
    redirect(`/panel/zespol?error=${encodeURIComponent(result.error.message)}`);
  }

  revalidatePath("/panel/zespol");
  revalidatePath("/o-fibrze");
  redirect(`/panel/zespol?saved=${id}`);
}

/** Usuwa powiązanie z filmem CF (czyści cloudflare_video_id). */
export async function clearTeamMemberVideoAction(formData: FormData) {
  await requireSessionUser();
  const admin = createSupabaseAdmin();

  const id = strOrNull(formData.get("id"));
  if (!id) redirect("/panel/zespol?error=Brak%20ID%20agenta");

  const { error } = await admin.from("agents").update({ cloudflare_video_id: null }).eq("id", id);
  if (error) {
    const missing = isMissingAgentColumnError(error.message);
    if (missing) {
      // Brak kolumny = nic do wyczyszczenia. Pomijamy bez błędu.
      revalidatePath("/panel/zespol");
      redirect(`/panel/zespol?saved=${id}`);
    }
    redirect(`/panel/zespol?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/panel/zespol");
  revalidatePath("/o-fibrze");
  redirect(`/panel/zespol?saved=${id}`);
}

/**
 * Tworzy w `agents` brakującego znanego członka zespołu (Bartosz / Justyna / Arek)
 * z domyślnymi treściami z `team-defaults`. Idempotentne - gdy rekord o danym
 * imieniu istnieje, redirect prowadzi prosto na jego edycję.
 *
 * Schema-resilient: jeżeli nowe kolumny (`bio_long`, `team_role`, …) jeszcze nie istnieją,
 * INSERT-ujemy tylko z polami z legacy schematu (`name`, `bio`, `is_active`).
 */
export async function addKnownTeamMemberAction(formData: FormData) {
  await requireSessionUser();
  const key = strOrNull(formData.get("key"));
  if (!key) redirect("/panel/zespol?error=Brak%20osoby");

  const defaults = teamDefaultsFor(key);
  const name = canonicalName(key);
  if (!defaults || !name) {
    redirect(`/panel/zespol?error=${encodeURIComponent("Nieznana osoba: " + key)}`);
  }

  const admin = createSupabaseAdmin();

  // Idempotencja: jeśli ktoś już istnieje pod tym imieniem, nie duplikujemy - przekierowujemy.
  const { data: existing } = await admin
    .from("agents")
    .select("id")
    .ilike("name", name)
    .maybeSingle();
  if (existing?.id) {
    revalidatePath("/panel/zespol");
    redirect(`/panel/zespol?saved=${existing.id}`);
  }

  // Próba 1: pełny payload z nowymi kolumnami.
  const fullPayload: Record<string, unknown> = {
    name,
    bio: defaults.bio, // dublujemy też do legacy `bio` - będzie czytelne nawet bez migracji
    bio_long: defaults.bio,
    team_role: defaults.role,
    team_order: defaults.order,
    is_team_visible: defaults.isVisible,
    is_active: true,
  };

  let { data: created, error } = await admin.from("agents").insert(fullPayload).select("id").single();

  if (error) {
    const missing = isMissingAgentColumnError(error.message);
    if (missing) {
      // Próba 2: zostawiamy tylko kolumny z legacy schematu.
      const legacyPayload = {
        name,
        bio: defaults.bio,
        is_active: true,
      };
      const retry = await admin.from("agents").insert(legacyPayload).select("id").single();
      if (retry.error || !retry.data) {
        redirect(
          `/panel/zespol?error=${encodeURIComponent(retry.error?.message ?? "Nie udało się dodać osoby")}`,
        );
      }
      created = retry.data;
      error = null;
    } else if (!created) {
      redirect(`/panel/zespol?error=${encodeURIComponent(error.message)}`);
    }
  }

  if (!created) {
    redirect(`/panel/zespol?error=${encodeURIComponent("Nie udało się dodać osoby")}`);
  }

  revalidatePath("/panel/zespol");
  revalidatePath("/o-fibrze");
  redirect(`/panel/zespol?saved=${created.id}`);
}

/**
 * Wywoływane z klienta (po wgraniu do Cloudflare Stream) - wpisuje świeże ID do agents
 * i AUTOMATYCZNIE włącza widoczność na publicznej stronie /o-fibrze.
 *
 * Klient prosił, żeby po wgraniu filmu nie trzeba było ręcznie klikać toggle „Pokaż" -
 * upload filmu jednoznacznie sygnalizuje „chcę żeby to było widoczne", więc atomicznie
 * ustawiamy `is_team_visible = true`. Klient zwracał uwagę, że bez tego film był wgrany,
 * ale na /o-fibrze nadal pokazywało się tylko zdjęcie.
 *
 * Zwracamy informację `visibilityEnabled` aby UI mógł od razu przełączyć toggle na ON
 * (bez czekania na re-render z bazy).
 */
export async function attachTeamMemberVideoAction(
  agentId: string,
  videoId: string,
): Promise<
  | { ok: true; visibilityEnabled: boolean }
  | { ok: false; error: string }
> {
  await requireSessionUser();
  const admin = createSupabaseAdmin();

  const safeId = sanitizeStreamId(videoId);
  if (!safeId) return { ok: false, error: "Nieprawidłowy format ID filmu." };
  if (!agentId.trim()) return { ok: false, error: "Brak ID agenta." };

  // Próba 1: pełny update z auto-włączeniem widoczności.
  const fullPatch: Record<string, unknown> = {
    cloudflare_video_id: safeId,
    is_team_visible: true,
  };
  const result = await admin.from("agents").update(fullPatch).eq("id", agentId);

  if (!result.error) {
    revalidatePath("/panel/zespol");
    revalidatePath("/o-fibrze");
    return { ok: true, visibilityEnabled: true };
  }

  const missing = isMissingAgentColumnError(result.error.message);
  if (missing) {
    return {
      ok: false,
      error:
        "Kolumna `cloudflare_video_id` lub `is_team_visible` nie istnieje jeszcze w tabeli `agents`. Uruchom migrację 20260506000100_agents_presentation_video.sql.",
    };
  }

  return { ok: false, error: result.error.message };
}
