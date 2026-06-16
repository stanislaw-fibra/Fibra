import "server-only";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Ochrona formularzy przed botami. Warstwy (od najtańszej do najdroższej):
 *
 *  1. Honeypot - ukryte pole-pułapka. Prawdziwy user go nie wypełni; bot
 *     wypełniający wszystkie inputy - tak. Zero tarcia dla człowieka.
 *  2. Pułapka czasowa - formularz wysłany w <MIN_FILL_MS po załadowaniu to bot.
 *  3. Cloudflare Turnstile - nowoczesna, w większości niewidoczna CAPTCHA.
 *     Pomijana, dopóki nie ustawiono TURNSTILE_SECRET_KEY (żeby działało lokalnie).
 *  4. Rate-limit per IP - twardy limit zgłoszeń z jednego adresu w oknie czasu.
 *
 * Wszystkie warstwy są fail-open na błędy infrastruktury (np. awaria sieci do
 * Cloudflare) - awaria zewnętrznej usługi NIE może zablokować realnego leada.
 */

/** Honeypot zadziałał = ukryte pole nie jest puste (czyli wypełnił je bot). */
export function honeypotTripped(hp: unknown): boolean {
  return typeof hp === "string" && hp.trim().length > 0;
}

// Minimalny realny czas wypełnienia formularza. Poniżej tego = automat.
const MIN_FILL_MS = 1200;

/**
 * True, gdy formularz wysłano podejrzanie szybko po załadowaniu. `ts` to znacznik
 * czasu (ms epoch) z momentu zamontowania formularza po stronie klienta.
 * Brak / niepoprawny / ujemny odstęp (zegar klienta do przodu) NIE jest karany.
 */
export function tooFast(ts: unknown): boolean {
  const t = typeof ts === "number" ? ts : Number(ts);
  if (!Number.isFinite(t) || t <= 0) return false;
  const elapsed = Date.now() - t;
  if (elapsed < 0) return false;
  return elapsed < MIN_FILL_MS;
}

/**
 * Weryfikacja tokenu Cloudflare Turnstile po stronie serwera.
 *  - brak TURNSTILE_SECRET_KEY  → { ok: true, skipped: true } (nie blokujemy),
 *  - sekret jest, brak tokenu    → { ok: false } (bot / brak widgetu),
 *  - błąd sieci do Cloudflare     → fail-open { ok: true, skipped: true }.
 */
export async function verifyTurnstile(
  token: unknown,
  ip: string | null,
): Promise<{ ok: boolean; skipped: boolean }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return { ok: true, skipped: true };
  if (typeof token !== "string" || !token) return { ok: false, skipped: false };

  try {
    const form = new URLSearchParams();
    form.set("secret", secret);
    form.set("response", token);
    if (ip) form.set("remoteip", ip);

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      },
    );
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!data.success) {
      // Powód odrzucenia z Cloudflare - przydatne do diagnozy (np. invalid-input-secret
      // = zły sekret, invalid-input-response = zły/wygasły token, timeout-or-duplicate).
      console.warn("[anti-bot] Turnstile odrzucił token:", data["error-codes"] ?? "(brak kodów)");
    }
    return { ok: Boolean(data.success), skipped: false };
  } catch (e) {
    console.error("[anti-bot] Turnstile verify error (fail-open):", e);
    return { ok: true, skipped: true };
  }
}

// Rate-limit per IP: maks. RL_MAX zgłoszeń z tym samym ip_hash w oknie RL_WINDOW_MS.
const RL_WINDOW_MS = 10 * 60 * 1000; // 10 minut
const RL_MAX = 6;

/**
 * True, gdy z danego ip_hash wpłynęło już RL_MAX zgłoszeń w ostatnim oknie.
 * Liczy istniejące wiersze `lead_submissions` przez service-role (omija RLS).
 * Fail-open: błąd zapytania NIE blokuje zapisu.
 */
export async function rateLimited(ipHash: string | null): Promise<boolean> {
  if (!ipHash) return false;
  try {
    const admin = createSupabaseAdmin();
    const since = new Date(Date.now() - RL_WINDOW_MS).toISOString();
    const { count, error } = await admin
      .from("lead_submissions")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    if (error) {
      console.error("[anti-bot] rate-limit query error (fail-open):", error.message);
      return false;
    }
    return (count ?? 0) >= RL_MAX;
  } catch (e) {
    console.error("[anti-bot] rate-limit error (fail-open):", e);
    return false;
  }
}
