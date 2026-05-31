/**
 * Wstawia puste linie tam, gdzie strukturalnie powinny być separatory bloków,
 * a Galactica/agent ich nie wpisał. Bez tego cały opis lądował w jednym `<p>`
 * - bez nagłówków, bez list - bo nasz parser auto-detekcji wymaga `\n\n`.
 *
 * Używane w dwóch miejscach:
 *   - importer (`description-cleaner.ts`): naprawiamy świeże dane przed zapisem
 *   - publiczny query (`offers-query.ts`): naprawiamy istniejące dane „w locie"
 *     przy odczycie, żeby nie trzeba było czekać na re-import po deployu
 *
 * Zasady:
 *  1) Linia kończąca się `:` (potencjalny nagłówek) - daj jej puste linie wokół
 *     (przed i po), żeby parser potraktował ją jako samodzielny blok.
 *  2) Pierwsza linia z myślnikiem po plain-texcie → break przed (otwiera listę).
 *  3) Ostatnia linia z myślnikiem przed plain-textem → break po (zamyka listę).
 */
/**
 * Wykrywa sekcje typu „nagłówek + lista" w stylu Galactici i wstawia myślnik na początku
 * każdej pozycji, żeby parser auto-detekcji rozpoznał blok jako `<ul>`.
 *
 * Konwencja Galactici (potwierdzona empirycznie na 70 ofertach):
 *   ```
 *   Do dyspozycji:           ← nagłówek (linia kończąca się dwukropkiem, krótka)
 *   <pusta linia>
 *   aneks kuchenny ... ,     ← pozycja listy (kończy się przecinkiem)
 *   garderoby w przedpokoju, ← pozycja listy (kończy się przecinkiem)
 *   miejsce parkingowe.      ← ostatnia pozycja (kończy się kropką)
 *   <pusta linia>
 *   ```
 *
 * Heurystyka: po nagłówku z dwukropkiem, jeżeli >= 2 kolejne linie (do blank lub kolejnego
 * nagłówka) kończą się przecinkiem albo kropką, traktujemy cały blok jako listę i dodajemy
 * `- ` przed każdą linią.
 */
export function detectGalacticaLists(text: string): string {
  if (!text) return text;
  const lines = text.replace(/\r\n?/g, "\n").split("\n");

  // Stripuje tagi <b>/<strong>/<i>/<em>/<u>, żeby end-character checks działały
  // bez względu na to czy nagłówek/pozycja jest pogrubiony przez `detectGalacticaBolds`.
  function stripInlineTags(s: string): string {
    return s.replace(/<\/?(?:b|strong|i|em|u)>/gi, "").trim();
  }
  function isHeadingColon(line: string): boolean {
    const t = stripInlineTags(line);
    if (!t.endsWith(":")) return false;
    if (t.length > 70) return false;
    if (/[.!?]/.test(t.slice(0, -1))) return false;
    return true;
  }
  function endsAsListItem(line: string): boolean {
    const t = stripInlineTags(line);
    if (!t) return false;
    return /[,.]$/.test(t);
  }
  function isBullet(line: string): boolean {
    return /^[-•*]\s+/.test(line.trim());
  }

  const out = [...lines];
  for (let i = 0; i < out.length; i++) {
    if (!isHeadingColon(out[i])) continue;

    // Zbierz kolejne niepuste linie po nagłówku do blank line / kolejnego nagłówka / koniec.
    const itemIdxs: number[] = [];
    let j = i + 1;
    // pomiń puste linie zaraz po nagłówku
    while (j < out.length && out[j].trim() === "") j++;
    // zbieraj kolejne niepuste linie
    while (j < out.length && out[j].trim() !== "" && !isHeadingColon(out[j])) {
      itemIdxs.push(j);
      j++;
    }
    if (itemIdxs.length < 2) continue;

    // Sprawdź ile linii wygląda jak pozycje listy (kończą się `,` lub `.`).
    const matchingItems = itemIdxs.filter((idx) => endsAsListItem(out[idx]));
    if (matchingItems.length < 2) continue;
    // Wymagaj większości - w przeciwnym razie traktujemy jako paragraph.
    if (matchingItems.length / itemIdxs.length < 0.5) continue;

    // Owijamy każdą pozycję myślnikiem (jeśli już nie ma).
    for (const idx of itemIdxs) {
      const line = out[idx];
      if (isBullet(line)) continue;
      const indent = line.match(/^\s*/)?.[0] ?? "";
      out[idx] = `${indent}- ${line.trimStart()}`;
    }
  }

  return out.join("\n");
}

export function injectBlockBreaks(text: string): string {
  if (!text) return text;
  // Normalize CRLF / CR end-of-line markers. Galactica wysyła `\r\n`, a `\r`
  // zostawione na końcach linii blokowało detekcję nagłówków (`endsWith(":")` było
  // fałszywie negative). Robimy to ZAWSZE tutaj, żeby helper był bezpieczny niezależnie
  // od źródła stringa (importer wykonuje także normalize, ale reader z bazy może nie).
  const normalized = text.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  const out: string[] = [];
  // (debug log removed after verifying CRLF was the root cause)

  function isBullet(line: string): boolean {
    return /^[-•*]\s+/.test(line.trim());
  }
  function isShortHeadingColon(line: string): boolean {
    // Strip inline tags (np. `<b>Lokalizacja:</b>`) przed testem ostatniego znaku.
    const t = line.replace(/<\/?(?:b|strong|i|em|u)>/gi, "").trim();
    if (!t.endsWith(":")) return false;
    if (t.length > 70) return false;
    if (/[.!?]/.test(t.slice(0, -1))) return false;
    return true;
  }
  function isBlank(line: string): boolean {
    return line.trim() === "";
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prev = i > 0 ? lines[i - 1] : "";
    const next = i + 1 < lines.length ? lines[i + 1] : "";

    // Reguła 1: nagłówek-z-dwukropkiem ma pustą linię nad sobą
    if (isShortHeadingColon(line) && !isBlank(prev) && out.length > 0 && !isBlank(out[out.length - 1])) {
      out.push("");
    }

    out.push(line);

    // Reguła 1b: po nagłówku-z-dwukropkiem pusta linia (chyba że dalej jest bullet - parser obsłuży)
    if (
      isShortHeadingColon(line) &&
      next !== undefined &&
      !isBlank(next) &&
      !isBullet(next) &&
      next.length > 0
    ) {
      out.push("");
    }

    // Reguła 2: pierwszy bullet po plain texcie → break przed
    if (isBullet(line) && !isBlank(prev) && !isBullet(prev) && !isShortHeadingColon(prev)) {
      const current = out.pop()!;
      if (out.length > 0 && !isBlank(out[out.length - 1])) out.push("");
      out.push(current);
    }

    // Reguła 2b: ostatni bullet przed plain textem → break po
    if (
      isBullet(line) &&
      next !== undefined &&
      !isBullet(next) &&
      !isBlank(next) &&
      next.length > 0
    ) {
      out.push("");
    }
  }

  return out.join("\n");
}
