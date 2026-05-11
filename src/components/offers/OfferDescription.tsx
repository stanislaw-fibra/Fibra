// Prezentacja opisu oferty z CRM.
//
// Zasady (prosta, świadoma logika — nie markdown):
// - puste linie dzielą tekst na bloki
// - w bloku jednolinijkowym krótka linia kończąca się `:` / `1. ...` / bez
//   interpunkcji zdaniowej → podnagłówek sekcji
// - blok wielolinijkowy zaczynający się myślnikiem (`-` / `•` / `*`) → lista
// - w pozostałych blokach paragraf: wewnętrzne \n zachowujemy jako <br/>,
//   dzięki czemu treści z Galactiki (punkty bez myślników, oddzielone tylko
//   newline'em) pozostają czytelne — zamiast sklejać się w jeden ciąg.

type Block =
  | { type: "paragraph"; lines: string[] }
  | { type: "heading"; text: string; number?: string }
  | { type: "list"; items: string[] };

const BULLET_RE = /^[-•*]\s*(.+)/;
const HEADING_COLON_RE = /:\s*$/;
const NUMBERED_HEADING_RE = /^(\d{1,2})\.\s+(.+)$/;
const MAX_HEADING_LEN = 100;
const MAX_STANDALONE_HEADING_LEN = 70;
// Inline-bold pierwszego słowa kończącego się dwukropkiem (np. "Efekt: ...").
const LEADING_LABEL_RE = /^([A-ZŚĆŻŹŁÓĘĄŃ][A-Za-zŚĆŻŹŁÓĘĄŃśćżźłóęąń]+):\s+(.+)$/;
const INLINE_TAGS_STRIP_RE = /<\/?(?:b|strong|i|em|u)>/gi;

/** Strip inline-tags żeby detekcja końca linii (`:`, `,`) działała na boldowanych nagłówkach. */
function stripInlineTagsForDetect(s: string): string {
  return s.replace(INLINE_TAGS_STRIP_RE, "").trim();
}

function looksLikeStandaloneHeading(line: string): boolean {
  const t = stripInlineTagsForDetect(line);
  if (t.length > MAX_STANDALONE_HEADING_LEN) return false;
  if (/[.,;:]$/.test(t)) return false;
  if (!/^[A-ZŚĆŻŹŁÓĘĄŃ"„]/.test(t)) return false;
  if (!/\w/.test(t)) return false;
  return true;
}

function parseDescription(raw: string): Block[] {
  // Bloki oddzielone pustymi liniami. W bloku — linie.
  const rawBlocks = raw
    .split(/\n{2,}/)
    .map((chunk) =>
      chunk
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0),
    )
    .filter((lines) => lines.length > 0);

  const blocks: Block[] = [];

  // Pomocnicze: testowanie nagłówka po stripie inline-tagów.
  const isHeadingColonLine = (line: string): boolean => {
    const t = stripInlineTagsForDetect(line);
    return HEADING_COLON_RE.test(t) && t.length <= MAX_HEADING_LEN;
  };
  // Treść nagłówka — usuwamy tylko końcowy dwukropek, ale ZACHOWUJEMY inline tagi
  // (`<b>`, `<u>`, `<i>`), żeby h3 mógł je wyrenderować przez `hasInlineHtml` w renderze.
  const cleanHeadingText = (line: string): string => {
    // Usuń `:` na końcu, ale ZACHOWAJ inline tagi (`<b>`, `<u>`, `<i>`).
    // Obsługuje też zagnieżdżone tagi: `<b><i>Tytuł:</i></b>` → `<b><i>Tytuł</i></b>`.
    let t = line.trim();
    // 1) `:` przed jednym lub więcej zamykających tagów na końcu (handle nesting):
    //    `<b><i>Tytuł:</i></b>` → `<b><i>Tytuł</i></b>`
    t = t.replace(/:\s*((?:<\/(?:b|strong|i|em|u)>\s*)+)$/i, "$1");
    // 2) `:` na samym końcu (bez tagów wokół): `Tytuł:` → `Tytuł`
    t = t.replace(/:\s*$/, "");
    return t.trim();
  };

  for (const lines of rawBlocks) {
    if (lines.length === 1) {
      const line = lines[0];

      const numbered = NUMBERED_HEADING_RE.exec(stripInlineTagsForDetect(line));
      if (numbered && stripInlineTagsForDetect(line).length <= MAX_HEADING_LEN) {
        blocks.push({
          type: "heading",
          text: numbered[2].trim(),
          number: numbered[1].padStart(2, "0"),
        });
        continue;
      }

      if (isHeadingColonLine(line)) {
        blocks.push({ type: "heading", text: cleanHeadingText(line) });
        continue;
      }

      if (looksLikeStandaloneHeading(line)) {
        // Zachowujemy oryginalną linię z inline tagami — renderer wyemituje rich HTML.
        blocks.push({ type: "heading", text: line });
        continue;
      }

      blocks.push({ type: "paragraph", lines });
      continue;
    }

    // Blok wielolinijkowy.
    const bulletMatches = lines.map((l) => BULLET_RE.exec(l));
    if (bulletMatches.every(Boolean)) {
      blocks.push({
        type: "list",
        items: bulletMatches.map((m) => (m as RegExpExecArray)[1].trim()),
      });
      continue;
    }

    // Pierwsza linia + reszta: sprawdź czy reszta to lista.
    const first = lines[0];
    const rest = lines.slice(1);
    const restBullets = rest.map((l) => BULLET_RE.exec(l));
    const restIsList = rest.length > 0 && restBullets.every(Boolean);

    const firstEndsWithColon = isHeadingColonLine(first);
    const firstIsStandaloneHeading = looksLikeStandaloneHeading(first);

    if ((firstEndsWithColon || firstIsStandaloneHeading) && restIsList) {
      blocks.push({
        type: "heading",
        // Dla heading-with-colon: usuń dwukropek, zachowaj tagi.
        // Dla standalone heading: zachowaj cały oryginał (z tagami).
        text: firstEndsWithColon ? cleanHeadingText(first) : first,
      });
      blocks.push({
        type: "list",
        items: restBullets.map((m) => (m as RegExpExecArray)[1].trim()),
      });
      continue;
    }

    if (firstEndsWithColon) {
      blocks.push({ type: "heading", text: cleanHeadingText(first) });
      blocks.push({ type: "paragraph", lines: rest });
      continue;
    }

    blocks.push({ type: "paragraph", lines });
  }

  return blocks;
}

/** Detekcja inline-tagów (bez flagi /g, żeby `.test()` był stateless). */
const HAS_INLINE_TAG_RE = /<\s*\/?\s*(b|strong|i|em|u)\b[^>]*>/i;

function hasInlineHtml(line: string): boolean {
  return HAS_INLINE_TAG_RE.test(line);
}

/**
 * Sanityzuje i normalizuje inline-HTML w jednym wierszu opisu (b, strong, i, em, u).
 * Wszystko inne — atrybuty, tagi blokowe, spurious markup — zostaje usunięte. Bezpieczne
 * do bezpośredniego wsadzenia w `dangerouslySetInnerHTML`. Defense-in-depth: na poziomie
 * importu mamy już sanityzację, ale renderujemy też tu — żeby ręczne edycje w panelu
 * nie wprowadziły dziury bezpieczeństwa.
 */
function sanitizeInlineHtml(line: string): string {
  let out = line;
  // Strip dangerous containers (na wszelki wypadek).
  out = out.replace(
    /<\s*(script|style|iframe|object|embed|noscript|svg|math|template)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
    "",
  );
  out = out.replace(/<\s*\/?\s*(script|style|iframe|object|embed|noscript|svg|math|template)[^>]*>/gi, "");
  // Tagi inline → bez atrybutów. Wszystkie inne (np. <a>, <span>, <div>) → strip, treść zostaje.
  out = out.replace(/<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (_, slash: string, tagRaw: string) => {
    const tag = tagRaw.toLowerCase();
    if (!/^(b|strong|i|em|u)$/.test(tag)) return "";
    return slash === "/" ? `</${tag}>` : `<${tag}>`;
  });
  return out;
}

function renderLine(line: string, key: number, isFirst: boolean) {
  // Jeśli linia ma już rich-formatting z Galactiki (np. `<b>oferta</b> zaprasza`),
  // renderujemy ją przez sanityzowany dangerouslySetInnerHTML. Klient prosił, żeby boldy
  // i kursywy z Galactici były szanowane 1:1 — to jest dokładnie tu.
  if (hasInlineHtml(line)) {
    return (
      <span
        key={key}
        // sanitizeInlineHtml whitelistuje tylko b/strong/i/em/u i strip atrybutów
        dangerouslySetInnerHTML={{ __html: sanitizeInlineHtml(line) }}
      />
    );
  }

  // Inline-bold "Etykieta:" tylko na pierwszej linii akapitu (typowo "Efekt:").
  if (isFirst) {
    const m = LEADING_LABEL_RE.exec(line);
    if (m) {
      return (
        <span key={key}>
          <strong className="font-semibold text-ink-900">{m[1]}:</strong> {m[2]}
        </span>
      );
    }
  }
  return <span key={key}>{line}</span>;
}

export function OfferDescription({ text }: { text: string }) {
  const blocks = parseDescription(text);
  if (blocks.length === 0) return null;

  return (
    <div className="max-w-2xl text-base leading-[1.8] text-ink-700">
      {blocks.map((b, idx) => {
        if (b.type === "heading") {
          return (
            <h3
              key={idx}
              className="font-semibold text-ink-900 mt-7 mb-2 first:mt-0 flex items-baseline gap-3"
            >
              {b.number && (
                <span
                  aria-hidden
                  className="font-display text-[12px] tabular-nums text-brand-500 tracking-[0.14em]"
                >
                  {b.number}
                </span>
              )}
              {hasInlineHtml(b.text) ? (
                <span dangerouslySetInnerHTML={{ __html: sanitizeInlineHtml(b.text) }} />
              ) : (
                <span>{b.text}</span>
              )}
            </h3>
          );
        }
        if (b.type === "list") {
          return (
            <ul key={idx} className="mb-5 space-y-2 pl-1">
              {b.items.map((item, i) => (
                <li key={i} className="relative pl-6">
                  <span
                    aria-hidden
                    className="absolute left-0 top-[0.7em] w-1.5 h-1.5 rounded-full bg-brand-500/70"
                  />
                  {hasInlineHtml(item) ? (
                    <span dangerouslySetInnerHTML={{ __html: sanitizeInlineHtml(item) }} />
                  ) : (
                    item
                  )}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={idx} className="mb-5 last:mb-0">
            {b.lines.map((ln, i) => (
              <span key={i}>
                {renderLine(ln, i, i === 0)}
                {i < b.lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
