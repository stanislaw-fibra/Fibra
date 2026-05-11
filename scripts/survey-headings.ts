/**
 * Survey headings across ALL 70 offers.
 *
 * Cele:
 * 1. Skatalogować wszystkie standalone-line patterns (linie 2sp+content+2sp).
 * 2. Sprawdzić, czy "ends with :" 1:1 pokrywa się z "next-line truly empty"
 *    (czy to są dwa różne sygnały, czy ten sam).
 * 3. Znaleźć WSZYSTKIE inne potencjalne markery formatowania (NBSP, ZWSP, escape seq, etc.)
 *
 * XML_PATH=oferty.xml npx tsx scripts/survey-headings.ts
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseGalacticaXml } from "../src/lib/importer/xml-parser";

function classifyLine(line: string): { type: "blank-empty" | "blank-padded" | "content" | "standalone-marker"; trailingChar: string; leading: number; trailing: number } {
  if (line === "") return { type: "blank-empty", trailingChar: "", leading: 0, trailing: 0 };
  if (/^ +$/.test(line)) return { type: "blank-padded", trailingChar: "", leading: line.length, trailing: line.length };
  const leading = (line.match(/^ +/)?.[0] ?? "").length;
  const trailing = (line.match(/ +$/)?.[0] ?? "").length;
  const trimmed = line.trim();
  const trailingChar = trimmed.slice(-1);
  // Standalone marker: line starts with ≥2sp AND ends with ≥2sp AND no internal 2+sp
  const noInternalMarker = !/[^ ]  +[^ ]/.test(line);
  const isStandalone = leading >= 2 && trailing >= 2 && noInternalMarker;
  return { type: isStandalone ? "standalone-marker" : "content", trailingChar, leading, trailing };
}

async function main() {
  const xmlPath = path.resolve(process.cwd(), process.env.XML_PATH ?? "oferty.xml");
  const xml = await fs.readFile(xmlPath, "utf-8");
  const parsed = parseGalacticaXml(xml);

  // For each offer: find all standalone-marker lines, log their "ends with :" and "next-line classification"
  type Pattern = {
    offerId: string;
    lineIdx: number;
    text: string;
    leading: number;
    trailing: number;
    endsWithColon: boolean;
    nextLineKind: string;
    nextLineRaw: string;
  };
  const patterns: Pattern[] = [];

  for (const offer of parsed.offers) {
    const opis = offer.params.find((p) => p.nazwa === "opis")?.value ?? "";
    if (!opis) continue;
    const lines = opis.replace(/\r\n?/g, "\n").split("\n");
    for (let i = 0; i < lines.length; i++) {
      const c = classifyLine(lines[i]);
      if (c.type !== "standalone-marker") continue;
      const nextRaw = i + 1 < lines.length ? lines[i + 1] : "<<EOF>>";
      const nextC = i + 1 < lines.length ? classifyLine(lines[i + 1]) : null;
      const nextKind = nextC?.type ?? "EOF";
      patterns.push({
        offerId: offer.id,
        lineIdx: i,
        text: lines[i].trim(),
        leading: c.leading,
        trailing: c.trailing,
        endsWithColon: c.trailingChar === ":",
        nextLineKind: nextKind,
        nextLineRaw: nextRaw,
      });
    }
  }

  // Cross-tabulate: endsWithColon × nextLineKind
  const crosstab: Map<string, number> = new Map();
  for (const p of patterns) {
    const key = `colon=${p.endsWithColon ? "Y" : "N"}, next=${p.nextLineKind}`;
    crosstab.set(key, (crosstab.get(key) ?? 0) + 1);
  }
  console.log("=== CROSS-TABULATION (across all 70 offers) ===");
  for (const [k, v] of [...crosstab.entries()].sort()) {
    console.log(`  ${k}: ${v}`);
  }

  // Show outliers: standalone marker NOT ending with colon
  console.log("\n=== STANDALONE LINES NOT ENDING WITH COLON ===");
  for (const p of patterns.filter((p) => !p.endsWithColon).slice(0, 30)) {
    console.log(`  [${p.offerId}/L${p.lineIdx}] L=${p.leading} T=${p.trailing} next=${p.nextLineKind}: "${p.text}"`);
  }

  // Show outliers: standalone ending with colon BUT next is padded (not truly empty)
  console.log("\n=== STANDALONE :-ENDING + NEXT-PADDED (not truly empty) ===");
  for (const p of patterns.filter((p) => p.endsWithColon && p.nextLineKind === "blank-padded").slice(0, 30)) {
    console.log(`  [${p.offerId}/L${p.lineIdx}] L=${p.leading} T=${p.trailing}: "${p.text}"`);
  }

  // Show: standalone NOT :-ending BUT next IS truly empty (could be different style)
  console.log("\n=== STANDALONE NON-:-ENDING + NEXT-TRULY-EMPTY ===");
  for (const p of patterns.filter((p) => !p.endsWithColon && p.nextLineKind === "blank-empty").slice(0, 30)) {
    console.log(`  [${p.offerId}/L${p.lineIdx}] L=${p.leading} T=${p.trailing}: "${p.text}"`);
  }

  console.log(`\n=== TOTAL standalone markers across 70 offers: ${patterns.length} ===`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
