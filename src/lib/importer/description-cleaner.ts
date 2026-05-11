import { decode } from "html-entities";

import { detectGalacticaLists, injectBlockBreaks } from "@/lib/description-blocks";

// Czyści opis z Galactici i porządkuje go dla strony Fibra. NIE zmienia słów,
// nie poprawia gramatyki, nie wstawia własnych boldów.
//
// Klient (Bartosz) prosił: minimum reguł, treść 1:1 z Galactici. Lista 9 zasad opisana
// w cleanDescription() na dole pliku — każda ma uzasadnienie.
//
// Patrz: FIBRA_IMPORTER_CONTEXT.md sekcja 4.

// Tylko 2 wzorce: oczywiste boilerplate Galactici / spam systemowy.
// Wszystkie pozostałe ("zadzwoń i dowiedz się więcej", "potrzebujesz finansowania", itp.)
// celowo USUNIĘTE — agent może to legalnie wpisać i nie mamy prawa za niego decydować.
const BOILERPLATE_LINE_PATTERNS: RegExp[] = [
  /oferta wysłana z systemu/i,
  /\bprowizja\s*0\s*%/i,
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
  // Galactica double-encoduje entities (np. `&amp;oacute;` zamiast `&oacute;`).
  // Dekodujemy wielokrotnie dopóki tekst się zmienia, max 3 razy.
  let prev = input;
  for (let i = 0; i < 3; i++) {
    const next = decode(prev, { level: "html5" });
    if (next === prev) break;
    prev = next;
  }
  return prev;
}

/** Inline-formatowanie ZACHOWYWANE w opisie (bez atrybutów). */
const PRESERVED_INLINE_TAGS = new Set(["b", "strong", "i", "em", "u"]);

/**
 * Konwertuje HTML z Galactici na tekst:
 *  - bloki (`<br>`, `<p>`, `<ul>`, `<ol>`, `<li>`) → markery tekstowe (\n, „- ")
 *  - inline (`<b>`, `<strong>`, `<i>`, `<em>`, `<u>`) → pozostają jako tagi w tekście
 *  - reszta tagów → strip (treść zostaje)
 *
 * Dziś Galactica nie wysyła `<b>` ani innych tagów inline, ale ten kod jest gotowy
 * gdy włączą eksport rich-text.
 */
function convertHtmlToTextWithInline(input: string): string {
  let s = input;

  // Niebezpieczne kontenery (script/style/iframe) wraz z treścią.
  s = s.replace(
    /<\s*(script|style|iframe|object|embed|noscript|svg|math|template)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
    "",
  );
  s = s.replace(/<\s*\/?\s*(script|style|iframe|object|embed|noscript|svg|math|template)[^>]*>/gi, "");

  // <br> → newline
  s = s.replace(/<\s*br\s*\/?\s*>/gi, "\n");

  // <li>...</li> → "\n- tekst"
  s = s.replace(
    /<\s*li[^>]*>([\s\S]*?)<\s*\/\s*li\s*>/gi,
    (_, inner) => `\n- ${String(inner).replace(/\s+/g, " ").trim()}`,
  );
  s = s.replace(/<\s*li[^>]*>/gi, "\n- ");
  s = s.replace(/<\s*\/\s*li\s*>/gi, "\n");

  // <ul>, <ol> → newline
  s = s.replace(/<\s*\/?\s*(?:ul|ol)[^>]*>/gi, "\n");

  // <p>...</p> → "\n\ntekst\n\n"
  s = s.replace(
    /<\s*p[^>]*>([\s\S]*?)<\s*\/\s*p\s*>/gi,
    (_, inner) => `\n\n${String(inner).trim()}\n\n`,
  );
  s = s.replace(/<\s*\/?\s*p\s*[^>]*>/gi, "\n\n");

  // Inline-tagi z whitelisty zachowaj (bez atrybutów); resztę usuń.
  s = s.replace(/<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (_, slash: string, tagRaw: string) => {
    const tag = tagRaw.toLowerCase();
    if (!PRESERVED_INLINE_TAGS.has(tag)) return "";
    return slash === "/" ? `</${tag}>` : `<${tag}>`;
  });

  return s;
}

/**
 * Minimalne porządki — tylko BEZPIECZNE, nieinwazyjne fixy. Klient prosił:
 * minimum reguł, treść 1:1 z Galactici.
 *
 * Zostaje:
 *  - usunięcie niewidzialnych Unicode (ZWSP, ZWJ, ZWNJ, BOM) — psują match patternów
 *  - „65m2" → „65 m²" (uniwersalny standard branżowy, agent na Otodom widzi tak samo)
 *
 * Wyrzucone (były wcześniej, za inwazyjne):
 *  - „6 00 zł" → „600 zł" (agent może świadomie tak pisać)
 *  - „15000zł" → „15000 zł" (zmiana wyglądu liczby)
 */
function fixCommonTypos(text: string): string {
  let s = text;

  // Niewidoczne znaki Unicode → usuń (ZWSP U+200B, ZWJ U+200D, BOM U+FEFF).
  s = s.replace(/[​-‍﻿]/g, "");

  // m2 → m² (jedyny dopuszczony "kosmetyczny" fix)
  s = s.replace(/(\d+(?:[,.]\d+)?)\s*m\s*[²2]\b/g, "$1 m²");

  return s;
}

/**
 * Detekcja bold/underline/italic w stylu Galactici.
 *
 * Galactica koduje formatowanie agenta przez WIELOKROTNE SPACJE wokół frazy
 * i przez STRUKTURĘ otaczających linii (czy następna linia jest truly-empty
 * czy padded-empty). Spacje są inherently ambiguous, więc używamy kontekstu:
 *
 * 1) Standalone-line (cała linia opakowana 2 markerami):
 *      baseline: <b>
 *      + <u> jeśli max(L,T) ≥ 3        (np. "Kawalerka...!" 2/3)
 *      + <i> jeśli NASTĘPNA LINIA jest TRULY-EMPTY (""), nie padded (" ")
 *                                       (np. "Do dyspozycji:", "Lokalizacja:")
 *
 * 2) Single-marker line (tylko leading 2sp, bez closing) → <b>
 *                                       (np. "  ścisłe Centrum Rybnika ,")
 *
 * 3) Mid-line marker (fraza między dwoma markerami w linii):
 *      - zaczyna się od cyfry → <b>     (np. "25 m 2", "3", "1250")
 *      - inaczej → <u>                  (np. "dwie garderoby")
 *
 * Empiryczna kalibracja na FIB-MW-4131 (3 tury feedbacku od Bartosza).
 *
 * Krytyczne: ten krok MUSI być przed `normalizeWhitespace` — ta zwija multi-spacje
 * I zwija blank-line distinctions (truly-empty vs padded-empty).
 */
function detectGalacticaBolds(text: string): string {
  const s = text.replace(/\u00a0/g, " ");
  const lines = s.split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const next = i + 1 < lines.length ? lines[i + 1] : null;
    // "truly empty" = pusty string bez żadnego padding-spacji
    const nextIsTrulyEmpty = next === "";
    out.push(formatLine(lines[i], nextIsTrulyEmpty));
  }
  return out.join("\n");
}

type Marker = { start: number; end: number; size: number };

function findMarkers(line: string): Marker[] {
  const markers: Marker[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === " ") {
      const start = i;
      while (i < line.length && line[i] === " ") i++;
      const size = i - start;
      if (size >= 2) markers.push({ start, end: i, size });
    } else {
      i++;
    }
  }
  return markers;
}

/** Tag dla mid-line frazy. Liczby -> <b>, tekst -> <u>. */
function tagForMidlinePhrase(phrase: string): "b" | "u" {
  return /^\s*\d/.test(phrase) ? "b" : "u";
}

function wrap(tag: string, text: string): string {
  return `<${tag}>${text}</${tag}>`;
}

function formatLine(line: string, nextIsTrulyEmpty: boolean): string {
  if (!line.trim()) return line;

  const markers = findMarkers(line);
  if (markers.length === 0) return line;

  const startsWithMarker = markers[0].start === 0;
  const endsWithMarker = markers[markers.length - 1].end === line.length;

  // Standalone wrap: cała linia to jedna fraza między dwoma edge-markerami.
  if (startsWithMarker && endsWithMarker && markers.length === 2) {
    const text = line.slice(markers[0].end, markers[1].start).trim();
    if (text) {
      const maxSpaces = Math.max(markers[0].size, markers[1].size);
      const addU = maxSpaces >= 3;       // dodatkowy emphasis (Kawalerka 2/3)
      const addI = nextIsTrulyEmpty;     // followed by truly-empty line (Do dyspozycji:)
      let wrapped = text;
      if (addI) wrapped = wrap("i", wrapped);
      if (addU) wrapped = wrap("u", wrapped);
      return wrap("b", wrapped);
    }
  }

  // Pojedynczy marker (np. "  ścisłe Centrum Rybnika ,") — bold emphasis,
  // tylko jedna strona linii ma marker.
  if (markers.length === 1) {
    const m = markers[0];
    if (m.start === 0 && m.end < line.length) {
      const phrase = line.slice(m.end).trim();
      if (phrase) return wrap("b", phrase);
    }
    if (m.end === line.length && m.start > 0) {
      const phrase = line.slice(0, m.start).trim();
      if (phrase) return wrap("b", phrase);
    }
    return line;
  }

  // Mid-line: marked region = od pierwszego do ostatniego markera.
  // Wewnętrzne markery dzielą region na osobne frazy.
  let out = "";

  if (markers[0].start > 0) {
    out += line.slice(0, markers[0].start);
  }

  let emittedPhrase = false;
  for (let k = 0; k + 1 < markers.length; k++) {
    const phrase = line.slice(markers[k].end, markers[k + 1].start).trim();
    if (!phrase) continue;
    if (out.length > 0 && !out.endsWith(" ")) out += " ";
    out += wrap(tagForMidlinePhrase(phrase), phrase);
    emittedPhrase = true;
  }

  const last = markers[markers.length - 1];
  if (last.end < line.length) {
    const suffix = line.slice(last.end);
    if (emittedPhrase && !suffix.startsWith(" ") && !out.endsWith(" ")) out += " ";
    out += suffix;
  }

  return out;
}

function removeBoilerplate(text: string): string {
  const lines = text.split("\n");
  const kept: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      kept.push(line);
      continue;
    }

    if (HEAD_EXCLUSIVITY_PATTERN.test(trimmed)) {
      continue;
    }

    if (TAIL_ADRES_WWW_LINE.test(trimmed)) {
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      if (j < lines.length) {
        i = j;
      }
      continue;
    }

    if (TAIL_SPACER_LINE.test(trimmed)) {
      continue;
    }

    if (TAIL_LONG_BLOCK_START.test(trimmed)) {
      let j = i;
      while (j < lines.length && !TAIL_LONG_BLOCK_END.test(lines[j])) j++;
      i = j;
      continue;
    }

    if (BOILERPLATE_LINE_PATTERNS.some((p) => p.test(trimmed))) {
      continue;
    }

    kept.push(line);
  }

  return kept.join("\n");
}

function removeTrailingAgentSignature(text: string, agentName: string | null | undefined): string {
  const lines = text.split("\n");
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
  // Trim każdej linii; zwijamy multi-spacje (ZA boldami, więc bezpiecznie) oraz multi-newlines.
  // UWAGA: kolejność wykonania pipeline'a: detectGalacticaBolds JEST WCZEŚNIEJ — markery
  // double-space już zostały zamienione na <b>...</b>. Tu zwijamy resztę spacji.
  const lines = text.split("\n").map((l) => l.replace(/[ \t ]+/g, " ").trim());

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

/**
 * Pipeline 9 reguł — zatwierdzone z Bartoszem. Każdy krok ma uzasadnienie:
 *
 *  1. decode entities       — Galactica double-encoduje (`&amp;oacute;`)
 *  2. HTML → tekst          — `<br>` na końcach linii, listy/akapity Galactici
 *  3. minimum typo fixów    — tylko m² + niewidzialne Unicode
 *  4. detect Galactica bolds — double-space wokół frazy → `<b>...</b>`
 *  5. usuń 2 wzorce spamu   — „oferta wysłana z systemu", „prowizja 0%"
 *  6. normalize whitespace  — zwija pozostałe multi-spacje (boldy już są w `<b>`)
 *  7. usuń podpis agenta    — samotne "Imię Nazwisko" na końcu
 *  8. inject block breaks   — `\n\n` przed nagłówkami i listami (parser potrzebuje)
 *  9. final normalize       — porządek po block breaks
 */
export function cleanDescription(
  raw: string | null | undefined,
  agentName?: string | null,
): string | null {
  if (!raw) return null;

  // 1. decode entities (potencjalnie podwójnie encodowane)
  let s = decodeEntitiesFully(String(raw));

  // 2. HTML → tekst z zachowanym inline-formatowaniem (bloki na markery, b/i/u zostają)
  s = convertHtmlToTextWithInline(s);

  // 3. minimum typo fixów (m² + niewidzialne Unicode)
  s = fixCommonTypos(s);

  // 4. wykryj boldy Galactici (PRZED normalize, żeby markery nie zostały zniszczone)
  s = detectGalacticaBolds(s);

  // 5. usuń oczywisty boilerplate (2 wzorce)
  s = removeBoilerplate(s);

  // 6. wyczyść whitespace (boldy są już w <b>...</b>, multi-spacje można zwinąć)
  s = normalizeWhitespace(s);

  // 7. usuń samotny podpis agenta na końcu
  s = removeTrailingAgentSignature(s, agentName);

  // 8a. wykryj sekcje "nagłówek + linie kończące się przecinkami" jako listy Galactici
  //     — dodaj `- ` przed każdą pozycją, żeby parser zrobił `<ul>` w renderze.
  s = detectGalacticaLists(s);

  // 8b. wstaw puste linie przed nagłówkami i listami (parser auto-detekcji)
  s = injectBlockBreaks(s);

  // 9. finalna normalizacja
  s = normalizeWhitespace(s);

  if (s.length < 20) return null;

  return s;
}
