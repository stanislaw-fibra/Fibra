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

function looksLikeStandaloneHeading(line: string): boolean {
  if (line.length > MAX_STANDALONE_HEADING_LEN) return false;
  // nie kończy się znakami zdaniowymi (dopuszczamy `?`, `!`)
  if (/[.,;:]$/.test(line)) return false;
  // musi zaczynać się od wielkiej litery (tytuł)
  if (!/^[A-ZŚĆŻŹŁÓĘĄŃ"„]/.test(line)) return false;
  // wymaga co najmniej jednego słownego znaku
  if (!/\w/.test(line)) return false;
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

  for (const lines of rawBlocks) {
    if (lines.length === 1) {
      const line = lines[0];

      const numbered = NUMBERED_HEADING_RE.exec(line);
      if (numbered && line.length <= MAX_HEADING_LEN) {
        blocks.push({
          type: "heading",
          text: numbered[2].trim(),
          number: numbered[1].padStart(2, "0"),
        });
        continue;
      }

      if (HEADING_COLON_RE.test(line) && line.length <= MAX_HEADING_LEN) {
        blocks.push({ type: "heading", text: line.replace(HEADING_COLON_RE, "").trim() });
        continue;
      }

      if (looksLikeStandaloneHeading(line)) {
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

    // Pierwsza linia wygląda na nagłówek?
    const firstEndsWithColon = HEADING_COLON_RE.test(first) && first.length <= MAX_HEADING_LEN;
    const firstIsStandaloneHeading = looksLikeStandaloneHeading(first);

    if ((firstEndsWithColon || firstIsStandaloneHeading) && restIsList) {
      blocks.push({
        type: "heading",
        text: firstEndsWithColon ? first.replace(HEADING_COLON_RE, "").trim() : first,
      });
      blocks.push({
        type: "list",
        items: restBullets.map((m) => (m as RegExpExecArray)[1].trim()),
      });
      continue;
    }

    if (firstEndsWithColon) {
      blocks.push({ type: "heading", text: first.replace(HEADING_COLON_RE, "").trim() });
      blocks.push({ type: "paragraph", lines: rest });
      continue;
    }

    blocks.push({ type: "paragraph", lines });
  }

  return blocks;
}

function renderLine(line: string, key: number, isFirst: boolean) {
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
              <span>{b.text}</span>
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
                  {item}
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
