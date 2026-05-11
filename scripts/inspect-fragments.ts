/**
 * Inspekcja surowych liczb spacji wokół konkretnych fragmentów w FIB-MW-4131.
 * Cel: zrozumieć, jakie sąsiedztwo ma KAŻDY fragment kalibracyjny,
 * żeby wyprowadzić poprawne mapowanie.
 *
 * Uruchom:
 *   XML_PATH=oferty.xml npx tsx scripts/inspect-fragments.ts
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseGalacticaXml } from "../src/lib/importer/xml-parser";

// Kalibracja od Bartosza (z dwóch tur feedbacku):
// Tura 1 (są podkreślone):
//   "Kawalerka na wynajem w Centrum Rybnika!"          → bold + underline (BU)
//   "płyta indukcyjna 2-palnikowa, okap, lodówka,"     → underline (U)
//   "piekarnik elektryczny zlewozmywak,"               → underline (U)
//   "dwie garderoby"                                    → underline (U)
//   "prysznic, umywalka z szafką i lustrem, kompakt wc, bojler," → underline (U)
//
// Tura 2 (NIE są podkreślone — tylko bold):
//   "Nieruchomość:"                                     → bold only (B)
//   "25 m²"                                             → bold only (B)
//   "3"  (w kontekście "piętro  3  z (4)")             → bold only (B)
//
// Plain:
//   "aneks kuchenny w zabudowie -"                      → plain
const FRAGMENTS: { needle: string; want: string }[] = [
  { needle: "Kawalerka na wynajem w Centrum Rybnika!", want: "BU" },
  { needle: "Nieruchomość:", want: "B" },
  { needle: "25 m²", want: "B" },
  { needle: "płyta indukcyjna 2-palnikowa", want: "U" },
  { needle: "piekarnik elektryczny zlewozmywak", want: "U" },
  { needle: "dwie garderoby", want: "U" },
  { needle: "prysznic, umywalka z szafką", want: "U" },
  { needle: "aneks kuchenny w zabudowie", want: "plain" },
];

function inspectFragment(text: string, needle: string) {
  // Find needle in text. If multiple matches, return ALL.
  const matches: Array<{
    line: string;
    lineIdx: number;
    leadingSpaces: number;
    trailingSpaces: number;
    sliceLeft: string;
    sliceRight: string;
  }> = [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    let from = 0;
    while (true) {
      const idx = line.indexOf(needle, from);
      if (idx < 0) break;
      // Count spaces immediately before
      let leading = 0;
      let i = idx - 1;
      while (i >= 0 && line[i] === " ") {
        leading++;
        i--;
      }
      // If at start of line, treat as "edge"
      const atStart = i < 0;
      // Count spaces immediately after
      let trailing = 0;
      let j = idx + needle.length;
      while (j < line.length && line[j] === " ") {
        trailing++;
        j++;
      }
      const atEnd = j >= line.length;
      matches.push({
        line: line.slice(Math.max(0, idx - 30), Math.min(line.length, idx + needle.length + 30)),
        lineIdx: li,
        leadingSpaces: atStart ? -1 : leading, // -1 = start of line
        trailingSpaces: atEnd ? -1 : trailing, // -1 = end of line
        sliceLeft: JSON.stringify(line.slice(Math.max(0, idx - 6), idx)),
        sliceRight: JSON.stringify(line.slice(idx + needle.length, Math.min(line.length, idx + needle.length + 6))),
      });
      from = idx + needle.length;
    }
  }
  return matches;
}

async function main() {
  const xmlPath = path.resolve(process.cwd(), process.env.XML_PATH ?? "oferty.xml");
  const xml = await fs.readFile(xmlPath, "utf-8");
  const parsed = parseGalacticaXml(xml);
  const raw = parsed.offers.find((o) => o.id === "FIB-MW-4131");
  if (!raw) {
    console.error("FIB-MW-4131 nie znaleziona");
    process.exit(1);
  }
  // Raw description — `opis` param (zanim leci do cleanera).
  const opis = raw.params.find((p) => p.nazwa === "opis");
  const desc: string = opis?.value ?? "";
  if (!desc) {
    console.error("Brak opis w surowej ofercie");
    process.exit(1);
  }

  console.log("=== RAW DESCRIPTION (pierwsze 600 znaków, escape'd) ===");
  console.log(JSON.stringify(desc.slice(0, 600)));
  console.log("");
  console.log("=== ŚRODEK (znaki 600..1200) ===");
  console.log(JSON.stringify(desc.slice(600, 1200)));
  console.log("");

  console.log("=== INSPEKCJA FRAGMENTÓW ===");
  for (const f of FRAGMENTS) {
    console.log(`\n--- "${f.needle}" (oczekiwane: ${f.want}) ---`);
    const ms = inspectFragment(desc, f.needle);
    if (ms.length === 0) {
      console.log("  NIE ZNALEZIONO w opisie");
      continue;
    }
    for (const m of ms) {
      const lead = m.leadingSpaces === -1 ? "START" : `${m.leadingSpaces}sp`;
      const tail = m.trailingSpaces === -1 ? "END" : `${m.trailingSpaces}sp`;
      console.log(`  line ${m.lineIdx}: L=${lead} T=${tail}`);
      console.log(`    left=${m.sliceLeft} right=${m.sliceRight}`);
      console.log(`    context: "...${m.line}..."`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
