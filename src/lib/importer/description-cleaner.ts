import { decode } from "html-entities";

// Usuwa boilerplate i porządkuje whitespace. NIE zmienia słów, nie poprawia gramatyki.
// Patrz: FIBRA_IMPORTER_CONTEXT.md sekcja 4.

// Linie ZAWIERAJĄCE któryś z tych wzorców są usuwane w całości (nawet jeśli wzorzec
// jest w środku linii po innym zdaniu typu "Masz pytania? Zadzwoń...").
const BOILERPLATE_LINE_PATTERNS: RegExp[] = [
  /oferta wysłana z systemu/i,
  /\bprowizja\s*0\s*%/i,
  /\bzadzwoń i dowiedz się więcej/i,
  /^zapraszam do kontaktu$/i,
  // Dodatkowe CTA / boilerplate z prawdziwych ofert:
  /pośrednik odpowiedzialny zawodowo/i,
  /potrzebujesz finansowania/i,
  /oferta bez prowizji,?\s*kupujący nie płaci/i,
  /jeśli masz dodatkowe pytania,?\s*zadzwoń/i,
  /zadzwoń lub napisz,?\s*chętnie udzielę/i,
  /zadzwoń lub napisz[,.!]?\s*(umówimy|chętnie)/i,
  /zadzwoń i umów się na\b/i,
  /napisz lub zadzwoń,?\s*chętnie udzielę/i,
];

const HEAD_EXCLUSIVITY_PATTERN =
  /oferta na wyłączność dostępna tylko w naszym biurze.*nie musisz szukać dalej/i;

const TAIL_LONG_BLOCK_START = /nasza firma szybko i skutecznie/i;
const TAIL_LONG_BLOCK_END = /uzyskaniu kredytu/i;

const TAIL_SPACER_LINE = /^zobacz wirtualny spacer/i;
const TAIL_ADRES_WWW_LINE = /^adres www oferty/i;

// Imię i nazwisko z polskimi znakami (opcjonalnie z myślnikiem w nazwisku, np. "Świenty-Szczyra").
// 2–3 "słowa" zaczynające się od wielkiej litery.
const AGENT_SIGNATURE_WORD = "[A-ZŚĆŻŹŁÓĘĄŃ][a-zśćżźłóęąń]+(?:-[A-ZŚĆŻŹŁÓĘĄŃ][a-zśćżźłóęąń]+)?";
const AGENT_SIGNATURE_PATTERN = new RegExp(
  `^${AGENT_SIGNATURE_WORD}(?:\\s+${AGENT_SIGNATURE_WORD}){1,2}$`,
);

function decodeEntitiesFully(input: string): string {
  // Niektóre eksporty Galactiki mają podwójnie encodowane entities (np. `&amp;oacute;`).
  // Dekodujemy wielokrotnie dopóki tekst się zmienia (bezpiecznie, max 3 razy).
  let prev = input;
  for (let i = 0; i < 3; i++) {
    const next = decode(prev, { level: "html5" });
    if (next === prev) break;
    prev = next;
  }
  return prev;
}

function stripHtml(input: string): string {
  let s = input;

  // <br>, <br/>, <br /> → newline
  s = s.replace(/<\s*br\s*\/?\s*>/gi, "\n");

  // <li>...</li> → "\n- tekst" (myślnik rozpoznaje frontend jako bullet)
  // UWAGA: bez końcowego `\n` — pusta linia rozbiłaby listę na wiele osobnych list.
  s = s.replace(
    /<\s*li[^>]*>([\s\S]*?)<\s*\/\s*li\s*>/gi,
    (_, inner) => `\n- ${String(inner).replace(/\s+/g, " ").trim()}`,
  );
  // samotne otwierające <li> (bez pary </li>) — traktuj jak nowy bullet
  s = s.replace(/<\s*li[^>]*>/gi, "\n- ");
  // samotne </li> — tylko newline
  s = s.replace(/<\s*\/\s*li\s*>/gi, "\n");

  // <ul>, </ul>, <ol>, </ol> → newline (zachowaj podział między listą a otoczeniem)
  s = s.replace(/<\s*\/?\s*(?:ul|ol)[^>]*>/gi, "\n");

  // <p>...</p> → "\n\ntekst\n\n" (akapit)
  s = s.replace(
    /<\s*p[^>]*>([\s\S]*?)<\s*\/\s*p\s*>/gi,
    (_, inner) => `\n\n${String(inner).trim()}\n\n`,
  );
  // samotne <p> / </p> — potraktuj jako separator akapitu
  s = s.replace(/<\s*\/?\s*p\s*[^>]*>/gi, "\n\n");

  // usuń pozostałe tagi HTML, zachowując treść
  s = s.replace(/<\/?[a-z][^>]*>/gi, "");

  return s;
}

function fixCommonTypos(text: string): string {
  let s = text;

  // Liczby z przypadkową spacją: "6 00 zł" → "600 zł", "30 00 zł" → "3000 zł".
  // Bezpieczna reguła: 1-2 cyfry + whitespace + DOKŁADNIE "00" + (nie cyfra) przed zł/pln.
  // "1 000 zł" NIE jest tknięte, bo po "00" w "1 000" jest kolejne "0".
  // Uwaga: nie używamy `\b` po "zł"/"pln", bo `\b` w JS opiera się o ASCII i psuje się przy `ł`.
  s = s.replace(
    /(?<!\d)(\d{1,2})\s+(00)(?!\d)(?=\s*(?:zł|pln)(?![a-ząćęłńóśźż]))/gi,
    "$1$2",
  );

  // Jednostka "m 2" / "m2" / "m &sup2;" po liczbie → "m²".
  // Obsługuje też warianty bez spacji: "65m2" → "65 m²".
  s = s.replace(/(\d+(?:[,.]\d+)?)\s*m\s*[²2]\b/g, "$1 m²");

  // Liczba sklejona z walutą: "15000zł" → "15000 zł".
  s = s.replace(/(\d)(zł|pln)(?![a-ząćęłńóśźż])/gi, "$1 $2");

  // Niewidoczne znaki Unicode (ZWSP, ZWJ, ZWNJ, BOM) → usuń.
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, "");

  return s;
}

function removeBoilerplate(text: string): string {
  const lines = text.split("\n");
  const kept: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // skip empty lines (handled later)
    if (!trimmed) {
      kept.push(line);
      continue;
    }

    // "Oferta na wyłączność... Nie musisz szukać dalej!" — usuń linię
    if (HEAD_EXCLUSIVITY_PATTERN.test(trimmed)) {
      continue;
    }

    // "Adres www oferty" → usuń tę linię + następną niepustą (URL)
    if (TAIL_ADRES_WWW_LINE.test(trimmed)) {
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      if (j < lines.length) {
        i = j; // pomiń URL
      }
      continue;
    }

    // "Zobacz Wirtualny Spacer: ..." — usuń
    if (TAIL_SPACER_LINE.test(trimmed)) {
      continue;
    }

    // Blok "Nasza firma szybko i skutecznie ... uzyskaniu kredytu" — usuń aż do końca bloku
    if (TAIL_LONG_BLOCK_START.test(trimmed)) {
      let j = i;
      while (j < lines.length && !TAIL_LONG_BLOCK_END.test(lines[j])) j++;
      i = j; // pomiń całość
      continue;
    }

    // Pozostałe boilerplate linie
    if (BOILERPLATE_LINE_PATTERNS.some((p) => p.test(trimmed))) {
      continue;
    }

    kept.push(line);
  }

  return kept.join("\n");
}

function removeTrailingAgentSignature(text: string, agentName: string | null | undefined): string {
  const lines = text.split("\n");
  // znajdź ostatnią niepustą linię
  let lastIdx = lines.length - 1;
  while (lastIdx >= 0 && lines[lastIdx].trim() === "") lastIdx--;
  if (lastIdx < 0) return text;

  const last = lines[lastIdx].trim();

  const normalizedAgent = agentName?.trim().toLowerCase();
  const isExactAgent = !!normalizedAgent && last.toLowerCase() === normalizedAgent;
  const looksLikeName = AGENT_SIGNATURE_PATTERN.test(last) && last.split(/\s+/).length <= 3;

  if (isExactAgent || looksLikeName) {
    lines.splice(lastIdx, 1);
    return lines.join("\n");
  }
  return text;
}

function normalizeWhitespace(text: string): string {
  // trim każdej linii i normalizuj wielokrotne spacje (w obrębie linii)
  const lines = text.split("\n").map((l) => l.replace(/[ \t\u00A0]+/g, " ").trim());

  // zamień 3+ puste linie z rzędu na max 1 pustą
  const collapsed: string[] = [];
  let blanks = 0;
  for (const line of lines) {
    if (line === "") {
      blanks++;
      if (blanks <= 1) collapsed.push("");
    } else {
      blanks = 0;
      collapsed.push(line);
    }
  }

  return collapsed.join("\n").trim();
}

export function cleanDescription(
  raw: string | null | undefined,
  agentName?: string | null,
): string | null {
  if (!raw) return null;

  // 1. dekoduj entities (potencjalnie podwójnie encodowane)
  let s = decodeEntitiesFully(String(raw));

  // 2. usuń HTML tagi
  s = stripHtml(s);

  // 3. popraw proste typos (m2 → m², "6 00 zł" → "600 zł")
  s = fixCommonTypos(s);

  // 4. usuń boilerplate
  s = removeBoilerplate(s);

  // 5. wyczyść whitespace (raz — żeby podpis agenta na końcu był "goły")
  s = normalizeWhitespace(s);

  // 6. usuń samotny podpis agenta na końcu opisu
  s = removeTrailingAgentSignature(s, agentName);

  // 7. finalna normalizacja (po wyrwaniu podpisu może zostać pusta linia)
  s = normalizeWhitespace(s);

  // 8. jeśli za krótkie po czyszczeniu → null
  if (s.length < 20) return null;

  return s;
}
