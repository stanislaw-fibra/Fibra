/**
 * Walidacja adresów e-mail - wspólna dla klienta (formularze) i serwera (`/api/leads`).
 *
 * Świadomie BEZ zależności (brak zod/yup) - jedna prosta funkcja, ten sam wynik
 * po obu stronach, żeby błąd pokazany w formularzu pokrywał się z walidacją API.
 *
 * Regex pokrywa typowe adresy (RFC w pełni jest zbyt liberalne dla formularza):
 *  - lokalna część: litery/cyfry oraz . _ % + - (bez spacji, bez podwójnej kropki na brzegach)
 *  - domena: co najmniej jedna kropka i TLD min. 2 znaki
 */
const EMAIL_RE =
  /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

/** Komunikat pokazywany w formularzach - jeden, spójny dla całej strony. */
export const EMAIL_ERROR_MESSAGE = "Podaj poprawny adres e-mail (np. imie@gmail.com).";

/** Normalizacja: trim + lowercase. Zwraca "" gdy wejście puste/nie-string. */
export function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

/** True gdy `value` po normalizacji jest poprawnym adresem e-mail. */
export function isValidEmail(value: unknown): boolean {
  const email = normalizeEmail(value);
  if (!email || email.length > 254) return false;
  // Dodatkowa ochrona przed podwójną kropką w domenie/lokalnej części.
  if (email.includes("..")) return false;
  return EMAIL_RE.test(email);
}
