/**
 * Bramka dostępu do portalu kursu (/kurs) - wersja przejściowa.
 *
 * Docelowo dostęp pójdzie przez magic-link (Supabase Auth) + podpisane URL-e
 * Cloudflare. Na teraz - żeby móc wypuścić /kurs na produkcję za bramką i
 * pokazać kurs - mamy prostą bramkę:
 *   - wspólny kod dostępu (`KURS_ACCESS_CODE`) - dajesz go ręcznie komu chcesz,
 *   - albo e-mail zakupu, sprawdzany w tabeli `course_access` (kupujący z
 *     Imkera trafiają tam automatycznie przez webhook).
 *
 * Po wejściu ustawiamy podpisane, httpOnly cookie. Ten moduł podpisuje i
 * weryfikuje to cookie. Używa wyłącznie Web Crypto + process.env, więc działa
 * zarówno w middleware (edge), jak i w Server Action / Route Handler (node).
 *
 * UWAGA: to NIE jest docelowe zabezpieczenie płatnej treści. Samo wideo wciąż
 * leci publicznym iframe Cloudflare - przed prawdziwą sprzedażą trzeba włączyć
 * "Require signed URLs" i podpisywać URL-e po stronie serwera.
 */

export const KURS_ACCESS_COOKIE = "kurs_access";

/** Ważność cookie dostępu: 30 dni. */
export const KURS_ACCESS_MAX_AGE = 60 * 60 * 24 * 30;

function getSigningSecret(): string | null {
  const s = process.env.KURS_ACCESS_SECRET?.trim();
  return s && s.length > 0 ? s : null;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Porównanie odporne na timing (obie wartości tej samej długości = hex). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

/**
 * Tworzy podpisany token dostępu z wbudowaną datą wygaśnięcia.
 * Zwraca null, gdy brak `KURS_ACCESS_SECRET` (bramka nieskonfigurowana).
 */
export async function createAccessToken(): Promise<string | null> {
  const secret = getSigningSecret();
  if (!secret) return null;
  const exp = Date.now() + KURS_ACCESS_MAX_AGE * 1000;
  const sig = await hmacHex(secret, String(exp));
  return `${exp}.${sig}`;
}

/** Weryfikuje token z cookie: poprawny podpis i nieprzeterminowany. */
export async function verifyAccessToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  const secret = getSigningSecret();
  if (!secret) return false;

  const dot = token.indexOf(".");
  if (dot <= 0) return false;

  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;

  const expected = await hmacHex(secret, expStr);
  return timingSafeEqual(sig, expected);
}
