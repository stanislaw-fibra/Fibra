import "server-only";
import { Resend } from "resend";

// ─────────────────────────────────────────────────────────────────────────────
// Cienka warstwa nad Resend.
//
// Zasada nadrzędna: wysyłka maila NIGDY nie może wywalić akcji użytkownika
// (zapis leada, webhook zakupu). Dlatego sendEmail NIE rzuca - zwraca wynik,
// a wołający decyduje, czy to loguje. Brak RESEND_API_KEY = no-op z ostrzeżeniem,
// nie błąd.
//
// Konfiguracja przez env (z sensownymi domyślnymi):
//   RESEND_API_KEY  - klucz API (wymagany do realnej wysyłki).
//   RESEND_FROM     - nadawca, np. 'Fibra Nieruchomości <biuro@fibra.pl>'.
//                     MUSI być na domenie zweryfikowanej w Resend.
//   RESEND_REPLY_TO - domyślny Reply-To (odpowiedzi klientów). Domyślnie biuro.
//   LEAD_NOTIFY_TO  - skrzynka biura, na którą lecą powiadomienia o leadach.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Odbiorcy powiadomień o leadach. `LEAD_NOTIFY_TO` może zawierać kilka adresów
 * po przecinku, np. "biuro@grupafibra.pl,stanislaw@fibra.pl" - wtedy każdy lead
 * leci do wszystkich. Adresy odbiorcze NIE muszą być na domenie nadawczej.
 */
export const LEAD_NOTIFY_RECIPIENTS: string[] = (
  process.env.LEAD_NOTIFY_TO?.trim() || "biuro@grupafibra.pl"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * Główna skrzynka biura (pierwsza z listy) - używana jako domyślny Reply-To
 * oraz wszędzie, gdzie potrzebny jest pojedynczy adres biura.
 */
export const OFFICE_INBOX = LEAD_NOTIFY_RECIPIENTS[0] || "biuro@grupafibra.pl";

/**
 * Nadawca wszystkich maili. MUSI być na domenie zweryfikowanej w Resend (fibra.pl),
 * dlatego @fibra.pl, mimo że biuro odbiera na grupafibra.pl. Odpowiedzi i tak
 * trafiają na grupafibra.pl dzięki Reply-To (DEFAULT_REPLY_TO = OFFICE_INBOX).
 */
export const EMAIL_FROM =
  process.env.RESEND_FROM?.trim() || "Fibra Nieruchomości <biuro@fibra.pl>";

/** Domyślny Reply-To - odpowiedzi klienta mają trafiać do biura. */
export const DEFAULT_REPLY_TO = process.env.RESEND_REPLY_TO?.trim() || OFFICE_INBOX;

let cached: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!cached) cached = new Resend(key);
  return cached;
}

export interface SendEmailArgs {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string | string[];
  /** Domyślnie EMAIL_FROM; nadpisuj tylko świadomie. */
  from?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

/**
 * Wysyła mail przez Resend. NIGDY nie rzuca - zwraca wynik.
 * Brak klucza API => { ok:false, skipped:true } (cicho, żeby nie psuć dev/preview).
 */
export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const client = getClient();
  if (!client) {
    console.warn("[email] RESEND_API_KEY nie ustawiony - pomijam wysyłkę:", args.subject);
    return { ok: false, skipped: true, error: "RESEND_API_KEY not configured" };
  }

  try {
    const { data, error } = await client.emails.send({
      from: args.from ?? EMAIL_FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      replyTo: args.replyTo ?? DEFAULT_REPLY_TO,
    });

    if (error) {
      console.error("[email] Resend zwrócił błąd:", error);
      return { ok: false, error: error.message || String(error) };
    }
    return { ok: true, id: data?.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[email] Wyjątek przy wysyłce:", message);
    return { ok: false, error: message };
  }
}
