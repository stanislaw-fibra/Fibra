import "server-only";
import { isValidEmail, normalizeEmail } from "@/lib/email-validation";

// ─────────────────────────────────────────────────────────────────────────────
// Cienka warstwa nad GetResponse API v3.
//
// Zasada nadrzędna (jak przy mailach): zapis do GetResponse NIGDY nie może
// wywalić akcji użytkownika (zapis leada). Dlatego funkcje tu NIE rzucają -
// zwracają wynik, a wołający (route /api/leads) loguje ewentualny błąd.
// Brak GETRESPONSE_API_KEY / GETRESPONSE_CAMPAIGN_ID = no-op z ostrzeżeniem.
//
// Konfiguracja przez env:
//   GETRESPONSE_API_KEY      - klucz API (Konto → Integracje i API → API).
//   GETRESPONSE_CAMPAIGN_ID  - token listy (campaignId), na którą zapisujemy.
//   GETRESPONSE_BASE_TAG     - tag doklejany KAŻDEMU ze strony (domyślnie
//                              'strona-www'); poza nim dokładamy tag źródła.
//   GETRESPONSE_API_BASE     - opcjonalnie inny host (GetResponse MAX);
//                              domyślnie https://api.getresponse.com/v3
//
// Double opt-in (mail potwierdzający) ustawia się NA LIŚCIE w panelu GetResponse,
// nie tutaj - API tylko dodaje kontakt, a GR sam wysyła potwierdzenie.
// ─────────────────────────────────────────────────────────────────────────────

export type NewsletterSource =
  | "offer_page"
  | "offer_page_mini"
  | "contact_page"
  | "sprzedaj_page"
  | "home_form"
  | "newsletter_footer"
  | "b2b_page";

/**
 * Tag źródła = z jakiego formularza przyszedł kontakt. Po tym segmentujemy
 * wysyłki w GetResponse. 'zrodlo_newsletter' to czysty zapis na newsletter;
 * pozostałe oznaczają zgodę zaznaczoną przy innym formularzu.
 *
 * UWAGA: GetResponse dopuszcza w nazwie tagu TYLKO [A-Za-z0-9_] (bez myślników!).
 * Dlatego podkreślniki, nie myślniki - inaczej tworzenie tagu zwraca 400 i kontakt
 * zostaje BEZ tagów (cicho). Dodatkowo grTagName() sanityzuje każdą nazwę.
 */
const SOURCE_TAG: Record<NewsletterSource, string> = {
  newsletter_footer: "zrodlo_newsletter",
  offer_page: "zrodlo_oferta",
  offer_page_mini: "zrodlo_oferta",
  contact_page: "zrodlo_kontakt",
  sprzedaj_page: "zrodlo_sprzedaj",
  home_form: "zrodlo_strona_glowna",
  b2b_page: "zrodlo_dla_firm",
};

/** GetResponse: nazwa tagu tylko [A-Za-z0-9_]. Zamieniamy resztę na '_'. */
function grTagName(name: string): string {
  return name.trim().replace(/[^A-Za-z0-9_]/g, "_");
}

interface GrConfig {
  apiKey: string;
  campaignId: string;
  baseUrl: string;
  baseTag: string;
}

function getConfig(): GrConfig | null {
  const apiKey = process.env.GETRESPONSE_API_KEY?.trim();
  const campaignId = process.env.GETRESPONSE_CAMPAIGN_ID?.trim();
  if (!apiKey || !campaignId) return null;
  const baseUrl =
    process.env.GETRESPONSE_API_BASE?.trim().replace(/\/+$/, "") ||
    "https://api.getresponse.com/v3";
  const baseTag = process.env.GETRESPONSE_BASE_TAG?.trim() || "strona_www";
  return { apiKey, campaignId, baseUrl, baseTag };
}

async function grFetch(
  cfg: GrConfig,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${cfg.baseUrl}${path}`, {
    ...init,
    headers: {
      "X-Auth-Token": `api-key ${cfg.apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

// Cache name→tagId per ciepły lambda - tagi są stałe, nie ma sensu pytać za każdym razem.
const tagIdCache = new Map<string, string>();

/**
 * Zamienia nazwę tagu na tagId. Jeśli tag nie istnieje w koncie - tworzy go.
 * Przy jakimkolwiek problemie zwraca null (pomijamy ten tag, nie blokujemy zapisu).
 */
async function resolveTagId(cfg: GrConfig, name: string): Promise<string | null> {
  const key = name.toLowerCase();
  const cached = tagIdCache.get(key);
  if (cached) return cached;

  try {
    const qs = new URLSearchParams({
      "query[name]": name,
      fields: "tagId,name",
      perPage: "100",
    });
    const res = await grFetch(cfg, `/tags?${qs.toString()}`, { method: "GET" });
    if (res.ok) {
      const arr = (await res.json().catch(() => null)) as
        | { tagId?: string; name?: string }[]
        | null;
      // query[name] działa jak "zawiera" - dopasowujemy dokładną nazwę.
      const hit = Array.isArray(arr)
        ? arr.find((t) => typeof t.name === "string" && t.name.toLowerCase() === key)
        : undefined;
      if (hit?.tagId) {
        tagIdCache.set(key, hit.tagId);
        return hit.tagId;
      }
    }

    // Nie ma - utwórz.
    const create = await grFetch(cfg, "/tags", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    if (create.ok) {
      const obj = (await create.json().catch(() => null)) as { tagId?: string } | null;
      if (obj?.tagId) {
        tagIdCache.set(key, obj.tagId);
        return obj.tagId;
      }
    }
  } catch (e) {
    console.error("[getresponse] resolveTagId wyjątek:", name, e);
  }
  console.warn("[getresponse] nie udało się rozwiązać tagu:", name);
  return null;
}

/** Znajduje istniejący kontakt na liście (po e-mailu) + jego aktualne tagId. */
async function findContact(
  cfg: GrConfig,
  campaignId: string,
  email: string,
): Promise<{ contactId: string; tagIds: string[] } | null> {
  try {
    const qs = new URLSearchParams({
      "query[email]": email,
      "query[campaignId]": campaignId,
      fields: "contactId,tags",
      perPage: "1",
    });
    const res = await grFetch(cfg, `/contacts?${qs.toString()}`, { method: "GET" });
    if (!res.ok) return null;
    const arr = (await res.json().catch(() => null)) as
      | { contactId?: string; tags?: { tagId?: string }[] }[]
      | null;
    const ct = Array.isArray(arr) ? arr[0] : undefined;
    if (!ct?.contactId) return null;
    const tagIds = Array.isArray(ct.tags)
      ? ct.tags.map((t) => t?.tagId).filter((x): x is string => !!x)
      : [];
    return { contactId: ct.contactId, tagIds };
  } catch (e) {
    console.error("[getresponse] findContact wyjątek:", e);
    return null;
  }
}

/**
 * Kontakt już jest na liście (POST /contacts zwrócił 409). Dokładamy mu tag
 * źródła, NIE gubiąc istniejących tagów. GetResponse przy update REPLACE-uje
 * listę tagów, więc wysyłamy sumę (stare ∪ nowe).
 */
async function ensureTagsOnExisting(
  cfg: GrConfig,
  campaignId: string,
  email: string,
  newTagIds: string[],
): Promise<void> {
  if (!newTagIds.length) return;
  const found = await findContact(cfg, campaignId, email);
  if (!found) return;
  const union = Array.from(new Set([...found.tagIds, ...newTagIds]));
  if (union.length === found.tagIds.length) return; // nic nowego
  try {
    await grFetch(cfg, `/contacts/${found.contactId}`, {
      method: "POST",
      body: JSON.stringify({ tags: union }),
    });
  } catch (e) {
    console.error("[getresponse] ensureTagsOnExisting wyjątek:", e);
  }
}

export interface SubscribeResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

/**
 * Zapisuje kontakt na listę newslettera w GetResponse z tagami:
 *   [BASE_TAG, tag-źródła].
 * NIGDY nie rzuca. Brak konfiguracji / błędny e-mail = skipped.
 *
 * Double opt-in (jeśli włączony na liście) GetResponse obsłuży sam - wyśle
 * mail z potwierdzeniem, a kontakt 'zatwierdzi się' po kliknięciu.
 */
export async function subscribeToNewsletter(input: {
  email: string;
  name?: string | null;
  source: NewsletterSource;
  /** Dodatkowe tagi segmentujące (np. 'zrodlo_kurs' dla osób związanych z kursem),
   *  poza BASE_TAG i tagiem źródła. */
  extraTags?: string[];
  /** Nadpisanie listy (campaignId) - np. osobna baza dla osób od kursu, na której
   *  działa autoresponder „dzień 0" wysyłający streszczenie. Puste = lista domyślna. */
  campaignId?: string;
}): Promise<SubscribeResult> {
  const cfg = getConfig();
  if (!cfg) {
    console.warn("[getresponse] brak GETRESPONSE_API_KEY/CAMPAIGN_ID - pomijam zapis");
    return { ok: false, skipped: true, error: "GetResponse not configured" };
  }
  if (!isValidEmail(input.email)) {
    return { ok: false, skipped: true, error: "invalid email" };
  }

  const email = normalizeEmail(input.email);
  const name = input.name?.trim() || undefined;
  const targetCampaign = input.campaignId?.trim() || cfg.campaignId;

  try {
    const wantedTags = Array.from(
      new Set(
        [cfg.baseTag, SOURCE_TAG[input.source] ?? "zrodlo_inne", ...(input.extraTags ?? [])].map(
          grTagName,
        ),
      ),
    );
    const tagIds = (
      await Promise.all(wantedTags.map((n) => resolveTagId(cfg, n)))
    ).filter((x): x is string => !!x);

    const res = await grFetch(cfg, "/contacts", {
      method: "POST",
      body: JSON.stringify({
        email,
        name,
        campaign: { campaignId: targetCampaign },
        tags: tagIds,
      }),
    });

    // 202 Accepted = dodany do kolejki (i ew. wysłany double opt-in).
    if (res.status === 202 || res.ok) return { ok: true };

    // 409 = e-mail już na tej liście. Dokładamy tylko tag źródła.
    if (res.status === 409) {
      await ensureTagsOnExisting(cfg, targetCampaign, email, tagIds);
      return { ok: true };
    }

    const txt = await res.text().catch(() => "");
    console.error("[getresponse] POST /contacts błąd:", res.status, txt);
    return { ok: false, error: `GetResponse ${res.status}` };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[getresponse] subscribeToNewsletter wyjątek:", message);
    return { ok: false, error: message };
  }
}
