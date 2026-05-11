/**
 * Hex dump bajtów wokół każdego standalone-line headingu w FIB-MW-4131,
 * żeby znaleźć JAKĄKOLWIEK różnicę między nagłówkami "bold-only" i "bold+italic".
 *
 * Czyta SUROWE bajty z oferty.xml (bez entity-decode, bez HTML→text).
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const TARGET_STRINGS = [
  "Kawalerka na wynajem w Centrum Rybnika!",
  "Nieruchomość:",
  "Do dyspozycji:",
  "Lokalizacja:",
  "Ile Cię to kosztuje:",
  "Formalności:",
];

function hex(s: string): string {
  return Array.from(s).map((c) => {
    const cp = c.codePointAt(0)!;
    if (cp === 0x0a) return "\\n";
    if (cp === 0x0d) return "\\r";
    if (cp === 0x20) return "·"; // visible space
    if (cp === 0xa0) return "[NBSP]"; // non-breaking space
    if (cp === 0x200b) return "[ZWSP]"; // zero-width space
    if (cp === 0x200c) return "[ZWNJ]";
    if (cp === 0x200d) return "[ZWJ]";
    if (cp === 0xfeff) return "[BOM]";
    if (cp >= 32 && cp < 127) return c;
    if (cp > 127 && cp < 0x10000) return c; // printable unicode (Polish chars)
    return `[U+${cp.toString(16).toUpperCase().padStart(4, "0")}]`;
  }).join("");
}

async function main() {
  const xmlPath = path.resolve(process.cwd(), process.env.XML_PATH ?? "oferty.xml");
  const xml = await fs.readFile(xmlPath, "utf-8");

  // Find FIB-MW-4131's opis tag
  const offerStart = xml.indexOf("FIB-MW-4131");
  if (offerStart < 0) {
    console.error("FIB-MW-4131 nie znaleziona");
    process.exit(1);
  }
  const opisStart = xml.indexOf('<param nazwa="opis"', offerStart);
  const opisEnd = xml.indexOf("</param>", opisStart);
  const opisRaw = xml.slice(opisStart, opisEnd);

  console.log("=== RAW OPIS (hex-encoded chars) ===");
  console.log(`Length: ${opisRaw.length} chars\n`);

  for (const needle of TARGET_STRINGS) {
    console.log(`\n### "${needle}" ###`);
    const idx = opisRaw.indexOf(needle);
    if (idx < 0) {
      console.log("  NIE ZNALEZIONO");
      continue;
    }
    // Take 60 chars before, the needle, 60 chars after
    const before = opisRaw.slice(Math.max(0, idx - 60), idx);
    const after = opisRaw.slice(idx + needle.length, Math.min(opisRaw.length, idx + needle.length + 60));
    console.log(`  BEFORE: |${hex(before)}|`);
    console.log(`  NEEDLE: |${hex(needle)}|`);
    console.log(`  AFTER:  |${hex(after)}|`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
