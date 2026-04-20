/**
 * Slugi ofert: `{title-slugified}-{galactica_offer_id}`.
 *
 * - Polskie znaki ą/ć/ę/ł/ń/ó/ś/ź/ż mapowane do ASCII (a/c/e/l/n/o/s/z/z).
 * - Reszta przez NFKD + strip znaków diakrytycznych (Unicode fallback).
 * - Spacje i znaki specjalne → myślniki, wielokrotne myślniki składane do jednego.
 * - Tytuł obcinany do ~60 znaków (nie łamiąc słów, jeśli to możliwe).
 * - Galactica ID dopinane bez zmiany wielkości liter (przykład: `FIB-DS-4127`).
 *
 * Slug generowany raz, przy tworzeniu oferty — NIE zmieniamy go przy aktualizacji
 * tytułu, żeby nie łamać istniejących linków i SEO.
 */

const POLISH_DIACRITICS: Record<string, string> = {
  ą: "a",
  ć: "c",
  ę: "e",
  ł: "l",
  ń: "n",
  ó: "o",
  ś: "s",
  ź: "z",
  ż: "z",
  Ą: "a",
  Ć: "c",
  Ę: "e",
  Ł: "l",
  Ń: "n",
  Ó: "o",
  Ś: "s",
  Ź: "z",
  Ż: "z",
};

const MAX_TITLE_SLUG_LEN = 60;

export function slugify(input: string): string {
  if (!input) return "";
  const lowered = input.toLowerCase();
  const mapped = Array.from(lowered, (c) => POLISH_DIACRITICS[c] ?? c).join("");
  const ascii = mapped
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
  const dashed = ascii
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (dashed.length <= MAX_TITLE_SLUG_LEN) return dashed;
  const cut = dashed.slice(0, MAX_TITLE_SLUG_LEN);
  const lastDash = cut.lastIndexOf("-");
  const trimmed = lastDash > 20 ? cut.slice(0, lastDash) : cut;
  return trimmed.replace(/^-+|-+$/g, "");
}

/**
 * Buduje slug URL oferty: `{slug-tytułu}-{galactica_offer_id}`.
 * Galactica ID zostaje w oryginalnej wielkości liter (np. `FIB-DS-4127`).
 * Gdy tytuł jest pusty — slug to sam ID (w lowercase, żeby URL wyglądał neutralnie).
 */
export function makeOfferSlug(
  title: string | null | undefined,
  galacticaOfferId: string,
): string {
  const base = slugify((title ?? "").trim());
  const id = (galacticaOfferId ?? "").trim();
  if (!id) return base || "oferta";
  return base ? `${base}-${id}` : id;
}
