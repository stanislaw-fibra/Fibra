/**
 * Pokazuje DOKŁADNĄ strukturę linii w raw opisie FIB-MW-4131,
 * z bytami otaczającymi każdy heading-marker, żeby zobaczyć co je różni.
 *
 * XML_PATH=oferty.xml npx tsx scripts/inspect-line-context.ts
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseGalacticaXml } from "../src/lib/importer/xml-parser";

async function main() {
  const xmlPath = path.resolve(process.cwd(), process.env.XML_PATH ?? "oferty.xml");
  const xml = await fs.readFile(xmlPath, "utf-8");
  const parsed = parseGalacticaXml(xml);
  const raw = parsed.offers.find((o) => o.id === "FIB-MW-4131");
  if (!raw) {
    console.error("FIB-MW-4131 nie znaleziona");
    process.exit(1);
  }
  const opis = raw.params.find((p) => p.nazwa === "opis")?.value ?? "";
  const lines = opis.replace(/\r\n?/g, "\n").split("\n");

  // Print each line with its index and JSON-encoded content (revealing all whitespace).
  console.log("=== WSZYSTKIE LINIE (JSON-encoded) ===");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Count leading/trailing spaces
    const leading = (line.match(/^ */)?.[0] ?? "").length;
    const trailing = (line.match(/ *$/)?.[0] ?? "").length;
    const marker = line.trim().length > 0 ? "" : "(empty/whitespace)";
    console.log(`${String(i).padStart(3)} L=${leading} T=${trailing} ${marker} ${JSON.stringify(line)}`);
  }

  // Find heading-like lines (lines containing ":") and report their surroundings.
  console.log("\n=== NAGŁÓWKI Z KONTEKSTEM (±3 linie) ===");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Only standalone-line markers with colon: 2+ leading, ends with `:`, possibly 2+ trailing
    if (/^ {2,}.+: *$/.test(line)) {
      console.log(`\n--- Linia ${i} ---`);
      for (let j = Math.max(0, i - 3); j < Math.min(lines.length, i + 4); j++) {
        const marker = j === i ? " ◀── HEADING" : "";
        console.log(`  ${String(j).padStart(3)} ${JSON.stringify(lines[j])}${marker}`);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
