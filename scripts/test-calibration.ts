/**
 * Smoke test dla `detectGalacticaBolds` — weryfikuje calibration data od Bartosza.
 *
 * Oferta FIB-MW-4131 (kawalerka Centrum Rybnika). Po cleanerze opis MUSI mieć:
 *   - "Kawalerka na wynajem w Centrum Rybnika!"        → <b><u>
 *   - "płyta indukcyjna ... bojler,"                   → <u>
 *   - "dwie garderoby"                                 → <u>
 *   - "prysznic, umywalka ... bojler,"                 → <u>
 *   - "aneks kuchenny w zabudowie -"                   → plain (NIC)
 *
 * Uruchom:
 *   npx tsx scripts/test-calibration.ts
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseGalacticaXml } from "../src/lib/importer/xml-parser";
import { mapOffer } from "../src/lib/importer/field-mapper";

type Check = {
  fragment: string;
  expect: "u" | "bu" | "iu" | "biu" | "plain";
};

const CHECKS: Check[] = [
  { fragment: "Kawalerka na wynajem w Centrum Rybnika!", expect: "bu" },
  { fragment: "płyta indukcyjna 2-palnikowa", expect: "u" },
  { fragment: "dwie garderoby", expect: "u" },
  { fragment: "prysznic, umywalka z szafką", expect: "u" },
  { fragment: "aneks kuchenny w zabudowie", expect: "plain" },
];

function contextOf(text: string, needle: string, span = 50): string {
  const idx = text.indexOf(needle);
  if (idx < 0) return "<<NOT FOUND>>";
  const start = Math.max(0, idx - span);
  const end = Math.min(text.length, idx + needle.length + span);
  return text.slice(start, end);
}

function classify(text: string, needle: string): "u" | "bu" | "iu" | "biu" | "plain" | "missing" {
  const idx = text.indexOf(needle);
  if (idx < 0) return "missing";
  // Find the start of the surrounding text (search backwards through tags / non-space)
  // We look at the 80-char window before to identify enclosing tags.
  const before = text.slice(Math.max(0, idx - 100), idx);
  // Last tag opening immediately before the text (allowing nested tags)
  // Match a sequence of opening tags: e.g. "<b><u>" right before.
  const openMatch = before.match(/(<[biu]>)+\s*$/);
  if (!openMatch) return "plain";
  const tagsStr = openMatch[0].trim();
  const tags = Array.from(tagsStr.matchAll(/<([biu])>/g)).map((m) => m[1]).sort().join("");
  if (tags === "u") return "u";
  if (tags === "bu") return "bu";
  if (tags === "iu") return "iu";
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

  console.log("=== FRAGMENT WOKÓŁ KALIBRACJI ===");
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
    console.log(`${ok ? "✅" : "❌"} "${c.fragment.slice(0, 40)}" → expect=${c.expect}, got=${got}`);
  }
  console.log(`\n${pass}/${CHECKS.length} pass, ${fail} fail`);
  if (fail > 0) process.exitCode = 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
