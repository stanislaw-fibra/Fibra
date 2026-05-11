/**
 * Sanityzacja „rich description" — opisu oferty z dopuszczonym formatowaniem inline.
 *
 * Klient (Bartosz) chce, żeby boldy / kursywy / podkreślenia z Galactiki były szanowane 1:1.
 * Agenci formatują opisy świadomie (układ litery „F", boldy jako „rodzynki"), więc strip-all
 * jest zbyt agresywny. Z drugiej strony nie możemy puszczać surowego HTML (XSS, śmieci typu
 * `style="font-size:42pt"`, `<font color>`, eventy). Stąd whitelist tag-by-tag + strip atrybutów.
 *
 * Tagi DOZWOLONE (zachowywane przy imporcie i renderowaniu):
 *   - inline:  b, strong, i, em, u
 *   - blok:    p, br, ul, ol, li
 *
 * Wszystko inne (script, iframe, font, span, div, atrybuty inline style/onclick/href, encoded
 * entity-bombs) jest usuwane. Defense-in-depth: sanityzujemy 2 razy — przy imporcie i przy
 * server-side save w panelu (na wypadek, gdyby admin wkleił coś z internetu).
 */

const ALLOWED_TAGS = new Set([
  "b",
  "strong",
  "i",
  "em",
  "u",
  "p",
  "br",
  "ul",
  "ol",
  "li",
]);

/** Tagi blokowe, które są self-zamykające (br) lub mogą stać samotnie. */
const VOID_OR_OPEN_ALONE_TAGS = new Set(["br"]);

/**
 * Sanitizuje fragment HTML usuwając:
 *  - tagi spoza whitelisty (zachowując ich treść tekstową)
 *  - WSZYSTKIE atrybuty (nie potrzebujemy `class`, `style`, `href` ani niczego)
 *  - komentarze HTML
 *  - tagi <script>, <style>, <iframe> wraz z ich treścią (XSS protection)
 *
 * Zwraca string nadający się bezpośrednio do `dangerouslySetInnerHTML`.
 */
export function sanitizeRichHtml(input: string): string {
  if (!input) return "";
  let s = input;

  // 1) Usuń komentarze HTML (mogą zawierać konstrukcje wpływające na parsing).
  s = s.replace(/<!--[\s\S]*?-->/g, "");

  // 2) Usuń tagi <script>, <style>, <iframe>, <object>, <embed>, <noscript> WRAZ Z ZAWARTOŚCIĄ.
  //    Ten krok MUSI być przed ogólnym strippingiem atrybutów — inaczej zostawiłby contents.
  s = s.replace(
    /<\s*(script|style|iframe|object|embed|noscript|svg|math|template)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
    "",
  );
  // Samotne otwierające warianty (gdy brak zamknięcia) — usuń tag i ewentualnie zostaw resztę.
  s = s.replace(/<\s*\/?\s*(script|style|iframe|object|embed|noscript|svg|math|template)[^>]*>/gi, "");

  // 3) Przejdź po każdym tagu HTML — zachowaj tylko nazwę tagu (bez atrybutów),
  //    odrzuć tagi spoza whitelisty.
  s = s.replace(/<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (_, slash: string, tagRaw: string) => {
    const tag = tagRaw.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return ""; // tag spoza whitelisty → usuń, treść między tagami zostanie sama
    if (slash === "/") return `</${tag}>`;
    if (VOID_OR_OPEN_ALONE_TAGS.has(tag)) return `<${tag}>`;
    return `<${tag}>`;
  });

  // 4) Strip wszystkich pozostałych „dziwnych" sekwencji: `javascript:` w tekście (gdyby ktoś wstawił
  //    jako tekst, browser samo nie wykona, ale niech będzie schludnie).
  s = s.replace(/javascript:/gi, "");
  s = s.replace(/data:/gi, "");

  // 5) Normalizuj whitespace wewnątrz tagów blokowych — usuń puste <p></p> i podwójne <br>.
  s = s.replace(/<p>\s*<\/p>/gi, "");
  s = s.replace(/(?:<br>\s*){3,}/gi, "<br><br>");

  return s.trim();
}

/**
 * Szybkie sprawdzenie — czy `description` zawiera realne formatowanie HTML?
 * Używamy w renderze, żeby zdecydować: rich HTML (przez dangerouslySetInnerHTML)
 * vs legacy plain-text z auto-detekcją struktury (linia z dwukropkiem → nagłówek itp.).
 */
export function hasRichFormatting(text: string): boolean {
  if (!text) return false;
  // Szukamy whitelisted opening tagów (już po sanityzacji powinny być tylko takie).
  return /<\s*(b|strong|i|em|u|p|br|ul|ol|li)\b/i.test(text);
}
