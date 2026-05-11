/**
 * Smoke test dla `detectGalacticaBolds` — weryfikuje calibration data od Bartosza.
 *
 * Oferta FIB-MW-4131. Po cleanerze opis MUSI mieć:
 *
 *   Whole-line title (Tura 1 — bold + underline):
 *     - "Kawalerka na wynajem w Centrum Rybnika!"  → <b><u>
 *
 *   Whole-line headings (Tura 2 — tylko bold; parser zrobi z tego h3):
 *     - "Nieruchomość:", "Do dyspozycji:", "Lokalizacja:" → <b>
 *
 *   Mid-line numbers (Tura 2 — tylko bold):
 *     - "25 m²", "3", "1250", "3500", "12" → <b>
 *
 *   Mid-line text phrases (Tura 1 — underline):
 *     - "płyta indukcyjna...", "piekarnik...", "dwie garderoby", "prysznic..." → <u>
 *
 *   Plain (poza markerami):
 *     - "aneks kuchenny w zabudowie" → bez tagów
 *
 * Uruchom: XML_PATH=oferty.xml npx tsx scripts/test-calibration.ts
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseGalacticaXml } from "../src/lib/importer/xml-parser";
import { mapOffer } from "../src/lib/importer/field-mapper";

type Expect = "u" | "b" | "i" | "bu" | "bi" | "biu" | "plain";
type Check = { fragment: string; expect: Expect };

const CHECKS: Check[] = [
  // Tura 1: whole-line title z dodatkowym emphasis (2/3 spacji)
  { fragment: "Kawalerka na wynajem w Centrum Rybnika!", expect: "bu" },
  // Tura 2: heading followed by padded-empty line — tylko bold
  { fragment: "Nieruchomość:", expect: "b" },
  // Tura 3: headings followed by truly-empty line — bold + italic
  { fragment: "Do dyspozycji:", expect: "bi" },
  { fragment: "Lokalizacja:", expect: "bi" },
  { fragment: "Ile Cię to kosztuje:", expect: "bi" },
  { fragment: "Formalności:", expect: "bi" },
  // Tura 2: mid-line numbers — tylko bold
  { fragment: "25 m²", expect: "b" },
  // Tura 1: mid-line text — underline
  { fragment: "płyta indukcyjna 2-palnikowa", expect: "u" },
  { fragment: "piekarnik elektryczny zlewozmywak", expect: "u" },
  { fragment: "dwie garderoby", expect: "u" },
  { fragment: "prysznic, umywalka z szafką", expect: "u" },
  // Tura 3: single-marker leading — bold only
  { fragment: "ścisłe Centrum Rybnika", expect: "b" },
  // Plain (poza markerami)
  { fragment: "aneks kuchenny w zabudowie", expect: "plain" },
];

function contextOf(text: string, needle: string, span = 50): string {
  const idx = text.indexOf(needle);
  if (idx < 0) return "<<NOT FOUND>>";
  const start = Math.max(0, idx - span);
  const end = Math.min(text.length, idx + needle.length + span);
  return text.slice(start, end);
}

function classify(text: string, needle: string): Expect | "missing" {
  const idx = text.indexOf(needle);
  if (idx < 0) return "missing";
  const before = text.slice(Math.max(0, idx - 100), idx);
  const openMatch = before.match(/(<[biu]>)+\s*$/);
  if (!openMatch) return "plain";
  const tagsStr = openMatch[0].trim();
  const tags = Array.from(tagsStr.matchAll(/<([biu])>/g))
    .map((m) => m[1])
    .sort()
    .join("");
  if (tags === "b" || tags === "i" || tags === "u") return tags as Expect;
  if (tags === "bi" || tags === "bu") return tags as Expect;
  if (tags === "biu") return "biu";
  return "plain";
}

async function main() {
  const xmlPath = path.resolve(process.cwd(), process.env.XML_PATH ?? "oferty.xml");
  const xml = await fs.readFile(xmlPath, "utf-8");
  const parsed = parseGalacticaXml(xml);

  const raw = parsed.offers.find((o) => o.id === "FIB-MW-4131");
  if (!raw) {
    console.error("FIB-MW-4131 nie znaleziona w", xmlPath);
    process.exit(1);
  }

  const mapped = mapOffer(raw);
  const desc = mapped.description ?? "";

  console.log("=== KONTEKST FRAGMENTÓW ===");
  for (const c of CHECKS) {
    console.log(`\n--- "${c.fragment}" (oczekiwane: ${c.expect}) ---`);
    console.log(contextOf(desc, c.fragment, 30));
  }

  console.log("\n=== WYNIK KALIBRACJI ===");
  let pass = 0;
  let fail = 0;
  for (const c of CHECKS) {
    const got = classify(desc, c.fragment);
    const ok = got === c.expect;
    if (ok) pass++;
    else fail++;
    console.log(
      `${ok ? "✅" : "❌"} "${c.fragment.slice(0, 45).padEnd(45)}" expect=${c.expect.padEnd(5)} got=${got}`,
    );
  }
  console.log(`\n${pass}/${CHECKS.length} pass, ${fail} fail`);
  if (fail > 0) process.exitCode = 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
