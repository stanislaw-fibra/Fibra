import "server-only";
import { createHash } from "crypto";

/**
 * Facebook / Meta Conversion API (CAPI) - wysyłka zdarzeń serwer → Meta.
 *
 * Zdarzenia z przeglądarki (piksel) i z serwera (CAPI) Meta deduplikuje po parze
 * (event_name, event_id) - dlatego klient i serwer wysyłają to samo `event_id`.
 *
 * Konfiguracja (env, NIE NEXT_PUBLIC - to sekrety serwerowe):
 *  - FB_CAPI_ACCESS_TOKEN  → token wygenerowany w Menedżerze zdarzeń (wymagany),
 *  - FB_DATASET_ID         → ID zbioru danych; domyślnie = NEXT_PUBLIC_FB_PIXEL_ID
 *                            (Meta scaliło piksel i zbiór danych - zwykle to samo ID),
 *  - FB_TEST_EVENT_CODE    → opcjonalnie; ustaw na czas testów w zakładce
 *                            „Testuj zdarzenia", USUŃ po weryfikacji.
 *
 * Generyczne - obsługuje dowolne zdarzenie (AddToCart teraz, Lead/Purchase później).
 */

const GRAPH_VERSION = "v21.0";

export type CapiUserData = {
  email?: string | null;
  phone?: string | null;
  /** Imię - hashowane (fn). Podnosi „jakość dopasowania zdarzeń". */
  first_name?: string | null;
  /** Nazwisko - hashowane (ln). */
  last_name?: string | null;
  /** Stabilny identyfikator klienta (np. e-mail zamówienia) - hashowany (external_id). */
  external_id?: string | null;
  client_ip_address?: string | null;
  client_user_agent?: string | null;
  /** Cookie _fbp (przeglądarkowy identyfikator piksela). */
  fbp?: string | null;
  /** Cookie _fbc (identyfikator kliknięcia reklamy). */
  fbc?: string | null;
};

export type CapiEvent = {
  event_name: string;
  event_id?: string;
  /** Sekundy epoch. Domyślnie „teraz". Meta odrzuca zdarzenia starsze niż 7 dni. */
  event_time?: number;
  event_source_url?: string | null;
  action_source?: "website" | "system_generated" | "app" | "phone_call" | "chat" | "email" | "other";
  user_data: CapiUserData;
  custom_data?: Record<string, unknown>;
};

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Normalizacja + hash e-maila wg wymagań Meta (trim, lowercase, SHA-256). */
function hashEmail(email: string): string {
  return sha256(email.trim().toLowerCase());
}

/** Telefon: same cyfry (z kodem kraju), potem SHA-256. */
function hashPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  return sha256(digits);
}

/** Imię/nazwisko wg Meta: trim, lowercase, bez znaków spoza liter, potem SHA-256. */
function hashName(name: string): string {
  const norm = name.trim().toLowerCase().replace(/[^a-ząćęłńóśźż]/gi, "");
  return sha256(norm);
}

/** Dowolny stabilny identyfikator (np. e-mail): trim, lowercase, SHA-256. */
function hashExternalId(value: string): string {
  return sha256(value.trim().toLowerCase());
}

/** ID zbioru danych - własny env lub piksel (Meta zwykle ma to samo ID). */
export function getDatasetId(): string | null {
  return (
    process.env.FB_DATASET_ID?.trim() ||
    process.env.NEXT_PUBLIC_FB_PIXEL_ID?.trim() ||
    null
  );
}

/** Czy CAPI jest w ogóle skonfigurowane (token + dataset). */
export function isCapiConfigured(): boolean {
  return Boolean(process.env.FB_CAPI_ACCESS_TOKEN?.trim() && getDatasetId());
}

export type CapiResult = { ok: boolean; skipped?: boolean; error?: string };

/**
 * Wysyła partię zdarzeń do Meta. NIGDY nie rzuca - zwraca wynik do zalogowania.
 * Brak konfiguracji = { ok:false, skipped:true } (cicho, bez błędu w wywołującym).
 */
export async function sendCapiEvents(events: CapiEvent[]): Promise<CapiResult> {
  const token = process.env.FB_CAPI_ACCESS_TOKEN?.trim();
  const datasetId = getDatasetId();
  if (!token || !datasetId) return { ok: false, skipped: true };
  if (events.length === 0) return { ok: true };

  const testCode = process.env.FB_TEST_EVENT_CODE?.trim();

  const data = events.map((e) => {
    const ud: Record<string, unknown> = {};
    if (e.user_data.email) ud.em = [hashEmail(e.user_data.email)];
    if (e.user_data.phone) ud.ph = [hashPhone(e.user_data.phone)];
    if (e.user_data.first_name) ud.fn = [hashName(e.user_data.first_name)];
    if (e.user_data.last_name) ud.ln = [hashName(e.user_data.last_name)];
    if (e.user_data.external_id) ud.external_id = [hashExternalId(e.user_data.external_id)];
    if (e.user_data.client_ip_address) ud.client_ip_address = e.user_data.client_ip_address;
    if (e.user_data.client_user_agent) ud.client_user_agent = e.user_data.client_user_agent;
    if (e.user_data.fbp) ud.fbp = e.user_data.fbp;
    if (e.user_data.fbc) ud.fbc = e.user_data.fbc;

    return {
      event_name: e.event_name,
      event_time: e.event_time ?? Math.floor(Date.now() / 1000),
      action_source: e.action_source ?? "website",
      ...(e.event_id ? { event_id: e.event_id } : {}),
      ...(e.event_source_url ? { event_source_url: e.event_source_url } : {}),
      user_data: ud,
      ...(e.custom_data ? { custom_data: e.custom_data } : {}),
    };
  });

  const body: Record<string, unknown> = { data };
  if (testCode) body.test_event_code = testCode;

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${datasetId}/events?access_token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[capi] Meta API error:", res.status, detail.slice(0, 500));
      return { ok: false, error: `Meta ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[capi] fetch failed:", e);
    return { ok: false, error: "fetch failed" };
  }
}
