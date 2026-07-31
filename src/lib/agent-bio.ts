/**
 * Czyszczenie biogramów agentów przed wyświetleniem.
 *
 * Bio przychodzi z panelu/importu i bywa wklejane razem z „nagłówkiem" - imieniem,
 * mailem albo telefonem na pierwszych liniach. Te dane pokazujemy osobno (nazwisko,
 * rola, przyciski kontaktu), więc powtórka w treści wygląda na pomyłkę.
 *
 * Używane na `/o-fibrze` (sekcja „Ludzie Fibry") i na stronie agenta `/agent/<slug>`
 * - jedno źródło prawdy, żeby te same dane nie wyglądały inaczej w dwóch miejscach.
 */

/** Warianty unicode (math-bold itp.) -> zwykłe znaki; usuwa znaki zero-width. */
export function normalizePlain(s: string): string {
  return s.normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g, "");
}

const onlyDigits = (s: string) => s.replace(/\D/g, "");

/**
 * Usuwa z POCZĄTKU bio linie będące zdublowanym kontaktem agenta (jego imię, email
 * lub numer), które bywały ręcznie wklejane w treść opisu. Usuwa tylko ZNANE dane
 * (z pól name/email/phone), nigdy nieznanej treści, i zatrzymuje się na pierwszej
 * linii, która kontaktem nie jest. Dodatkowo normalizuje unicode w całym bio.
 */
export function cleanBio(
  bio: string,
  name?: string,
  email?: string,
  phone?: string,
): string {
  const normalized = normalizePlain(bio);
  const nameLc = name?.trim().toLowerCase();
  const emailLc = email?.trim().toLowerCase();
  const phoneDigits = phone ? onlyDigits(phone) : "";
  if (!nameLc && !emailLc && !phoneDigits) return normalized.trim();

  const lines = normalized.split("\n");
  let start = 0;
  while (start < lines.length) {
    const raw = lines[start].trim();
    if (raw === "") {
      start++;
      continue;
    }
    const ld = onlyDigits(raw);
    const isKnownName = Boolean(nameLc) && raw.toLowerCase() === nameLc;
    const isKnownEmail = Boolean(emailLc) && raw.toLowerCase().includes(emailLc!);
    const isKnownPhone =
      Boolean(phoneDigits) && ld.includes(phoneDigits) && ld.length <= phoneDigits.length + 3;
    if (isKnownName || isKnownEmail || isKnownPhone) {
      start++;
      continue;
    }
    break;
  }
  return lines.slice(start).join("\n").trim();
}
