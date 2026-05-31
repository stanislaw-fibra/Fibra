import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * Model dostępu do panelu:
 *
 *   user_metadata.agent_id = null/brak  →  ADMIN - widzi i edytuje wszystko
 *   user_metadata.agent_id = "<uuid>"   →  AGENT - widzi i edytuje TYLKO oferty,
 *                                          gdzie `offers.agent_id` matchuje to UUID
 *
 * Admin tworzy konta agentów w Supabase Dashboard (Authentication → Users → Add user)
 * i w polu "Raw user meta data" wpisuje `{"agent_id": "<uuid-z-tabeli-agents>"}`.
 *
 * Funkcja zwraca scope:
 *   { kind: "admin" } - pełny dostęp
 *   { kind: "agent", agentId } - ograniczony do tego agenta
 *
 * Przy braku sesji robi `redirect("/panel/login")`.
 */
export type PanelScope =
  | { kind: "admin"; userId: string; email: string | null }
  | { kind: "agent"; userId: string; email: string | null; agentId: string };

export async function requirePanelScope(): Promise<PanelScope> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    redirect("/panel/login");
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const rawAgentId = meta.agent_id;
  const agentId = typeof rawAgentId === "string" && rawAgentId.trim() ? rawAgentId.trim() : null;

  if (agentId) {
    return { kind: "agent", userId: user.id, email: user.email ?? null, agentId };
  }
  return { kind: "admin", userId: user.id, email: user.email ?? null };
}

/**
 * Sprawdza czy zalogowany user może edytować daną ofertę.
 * - Admin: zawsze TAK
 * - Agent: tylko jeśli `offers.agent_id === scope.agentId`
 *
 * Zwraca scope (do dalszego użycia w handlerze).
 * Robi `redirect("/panel/oferty?error=brak-uprawnien")` gdy brak uprawnień.
 */
export async function requireOfferOwnership(offerAgentId: string | null): Promise<PanelScope> {
  const scope = await requirePanelScope();
  if (scope.kind === "admin") return scope;
  if (offerAgentId !== scope.agentId) {
    redirect("/panel/oferty?error=brak-uprawnien-do-tej-oferty");
  }
  return scope;
}
