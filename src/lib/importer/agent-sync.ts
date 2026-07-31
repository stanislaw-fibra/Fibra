import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureAgentSlug } from "@/lib/agent-slug";

export interface AgentCandidate {
  name: string | null;
  email: string | null;
  phone_office: string | null;
  phone_mobile: string | null;
}

// Upsert agenta po email. Zwraca agent.id lub null, jeśli nie mamy ani emaila ani nazwiska.
// Nie nadpisuje zdjęcia/bio (ustawiane ręcznie w panelu).
// Przy okazji pilnuje, żeby agent miał swój publiczny link `/agent/<slug>` - osoby
// zakładane automatycznie z VIRGO też mają go dostać, bez ręcznego SQL-a.
export async function upsertAgent(
  supabase: SupabaseClient,
  candidate: AgentCandidate,
): Promise<{ id: string | null; created: boolean }> {
  const email = candidate.email?.trim().toLowerCase() || null;
  const name = candidate.name?.trim() || null;
  if (!email && !name) return { id: null, created: false };

  if (email) {
    const { data: existing, error: selErr } = await supabase
      .from("agents")
      .select("id, phone_office, phone_mobile, name, slug")
      .eq("email", email)
      .maybeSingle();
    if (selErr) throw selErr;

    if (existing?.id) {
      // Aktualizuj telefony / nazwę - mogły się zmienić w Galactice
      const updates: Record<string, unknown> = {};
      if (name && name !== existing.name) updates.name = name;
      if (candidate.phone_office && candidate.phone_office !== existing.phone_office) {
        updates.phone_office = candidate.phone_office;
      }
      if (candidate.phone_mobile && candidate.phone_mobile !== existing.phone_mobile) {
        updates.phone_mobile = candidate.phone_mobile;
      }
      if (Object.keys(updates).length > 0) {
        const { error: upErr } = await supabase
          .from("agents")
          .update(updates)
          .eq("id", existing.id);
        if (upErr) throw upErr;
      }
      await ensureAgentSlug(supabase, {
        id: existing.id,
        name: name ?? existing.name,
        slug: existing.slug,
      });
      return { id: existing.id, created: false };
    }

    // utwórz nowego
    const { data: inserted, error: insErr } = await supabase
      .from("agents")
      .insert({
        name: name ?? email,
        email,
        phone_office: candidate.phone_office,
        phone_mobile: candidate.phone_mobile,
        is_active: true,
      })
      .select("id")
      .single();
    if (insErr) throw insErr;
    await ensureAgentSlug(supabase, { id: inserted.id, name: name ?? email, slug: null });
    return { id: inserted.id, created: true };
  }

  // Brak emaila - spróbuj po nazwisku (fallback)
  const { data: byName } = await supabase
    .from("agents")
    .select("id, slug")
    .eq("name", name!)
    .maybeSingle();
  if (byName?.id) {
    await ensureAgentSlug(supabase, { id: byName.id, name, slug: byName.slug });
    return { id: byName.id, created: false };
  }

  const { data: inserted, error } = await supabase
    .from("agents")
    .insert({
      name: name!,
      phone_office: candidate.phone_office,
      phone_mobile: candidate.phone_mobile,
      is_active: true,
    })
    .select("id")
    .single();
  if (error) throw error;
  await ensureAgentSlug(supabase, { id: inserted.id, name, slug: null });
  return { id: inserted.id, created: true };
}
