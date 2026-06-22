/**
 * Bramka dostępu do stron projektu „Zamysłów" - wersja przejściowa.
 *
 * Dopóki projekt jest w przygotowaniu, wszystkie powiązane strony chowamy za
 * jednym wspólnym hasłem. Strony są też usunięte z menu (Nav/Footer) - da się
 * na nie wejść TYLKO przez bezpośredni link, a i tak najpierw trzeba podać hasło.
 *
 * Hasło trzymamy w `ZAMYSLOW_GATE_PASSWORD`. Tym samym sekretem podpisujemy
 * httpOnly cookie dostępu - jedna zmienna środowiskowa, prościej w konfiguracji.
 * Zmiana hasła automatycznie unieważnia wszystkie wcześniejsze cookie.
 *
 * Używa wyłącznie Web Crypto + process.env, więc działa zarówno w middleware
 * (edge), jak i w Server Action / Route Handler (node).
 */

export const ZAMYSLOW_ACCESS_COOKIE = "zamyslow_access";

/** Ważność cookie dostępu: 30 dni. */
export const ZAMYSLOW_ACCESS_MAX_AGE = 60 * 60 * 24 * 30;

/** Ścieżka bramki (sama nie jest chroniona - tu wpisuje się hasło). */
export const ZAMYSLOW_GATE_PATH = "/zamyslow-dostep";

/**
 * Prefiksy stron schowanych za bramką Zamysłowa. Jedno źródło prawdy dla
 * middleware (matcher + logika) i ewentualnych innych miejsc.
 */
export const ZAMYSLOW_GATED_PREFIXES = [
  "/zamyslow",
  "/osiedle-zamyslow",
  "/czy-inwestycja-w-mieszkanie-jest-dla-mnie",
  "/przewodnik-inwestora",
  "/zarzadzanie-najmem",
  "/galeria-inwestycji",
  "/prospekt-informacyjny",
] as const;

/** Czy dana ścieżka należy do stref chronionych bramką Zamysłowa. */
export function isZamyslowGatedPath(pathname: string): boolean {
  return ZAMYSLOW_GATED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function getSigningSecret(): string | null {
  const s = process.env.ZAMYSLOW_GATE_PASSWORD?.trim();
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

/** Porównanie odporne na timing (obie wartości tej samej długości). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

/** Czy podane hasło zgadza się z `ZAMYSLOW_GATE_PASSWORD`. */
export async function checkZamyslowPassword(input: string): Promise<boolean> {
  const secret = getSigningSecret();
  if (!secret) return false;
  // Hashujemy oba tym samym kluczem i porównujemy hashe (równa długość -> timing-safe).
  const inputHash = await hmacHex(secret, input);
  const secretHash = await hmacHex(secret, secret);
  return timingSafeEqual(inputHash, secretHash);
}

/**
 * Tworzy podpisany token dostępu z wbudowaną datą wygaśnięcia.
 * Zwraca null, gdy brak `ZAMYSLOW_GATE_PASSWORD` (bramka nieskonfigurowana).
 */
export async function createZamyslowToken(): Promise<string | null> {
  const secret = getSigningSecret();
  if (!secret) return null;
  const exp = Date.now() + ZAMYSLOW_ACCESS_MAX_AGE * 1000;
  const sig = await hmacHex(secret, String(exp));
  return `${exp}.${sig}`;
}

/** Weryfikuje token z cookie: poprawny podpis i nieprzeterminowany. */
export async function verifyZamyslowToken(
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
