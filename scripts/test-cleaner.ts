/**
 * Test czystego czyszczenia opisów na prawdziwym oferty.xml.
 * Uruchom:
 *   npx tsx scripts/test-cleaner.ts
 *   lub: npx ts-node --esm scripts/test-cleaner.ts
 * Alternatywnie: node --loader ts-node/esm scripts/test-cleaner.ts
 *
 * Skrypt NIE wymaga Supabase ani FTP — tylko oferty.xml w repo.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseGalacticaXml } from "../src/lib/importer/xml-parser";
import { mapOffer } from "../src/lib/importer/field-mapper";

async function main() {
  const xmlPath = path.resolve(process.cwd(), "oferty.xml");
  const xml = await fs.readFile(xmlPath, "utf-8");
  const parsed = parseGalacticaXml(xml);

  console.log("=== HEADER ===");
  console.log(parsed.header);
  console.log("");
  console.log(`Oferty: ${parsed.offers.length}`);
  console.log(`Oferty do usunięcia: ${parsed.deletes.length}`);
  console.log("");

  let badDescriptions = 0;
  let cleanedCount = 0;
  let hasBoilerplate = 0;
  const BOILERPLATE_MARKERS = [
    "Oferta wysłana z systemu",
    "Nie musisz szukać dalej",
    "&amp;oacute;",
    "&oacute;",
    "&sup2;",
    "Zobacz Wirtualny Spacer",
    "Adres www oferty",
    "Nasza firma szybko i skutecznie",
    "Pośrednik odpowiedzialny zawodowo",
    "Potrzebujesz finansowania",
    "Oferta bez prowizji, kupujący nie płaci",
    "Jeśli masz dodatkowe pytania, zadzwoń",
    "Zadzwoń lub napisz, chętnie udzielę",
    "Zadzwoń i umów się na",
    " m2 ", // m2 z poprzedzającą spacją (po liczbie powinno być już m²)
    " m 2 ", // "m 2"
    " 6 00 ", // konkretny przypadek z oferty
  ];

  const offendingSamples: string[] = [];
  for (const raw of parsed.offers) {
    const mapped = mapOffer(raw);
    if (mapped.description) {
      cleanedCount++;
      for (const m of BOILERPLATE_MARKERS) {
        if (mapped.description.includes(m)) {
          hasBoilerplate++;
          console.log(`⚠️  [${mapped.galactica_offer_id}] zawiera boilerplate "${m}"`);
          if (offendingSamples.length < 3) {
            const idx = mapped.description.indexOf(m);
            const ctxStart = Math.max(0, idx - 60);
            const ctxEnd = Math.min(mapped.description.length, idx + m.length + 60);
            offendingSamples.push(
              `[${mapped.galactica_offer_id}] "${mapped.description.slice(ctxStart, ctxEnd)}"`,
            );
          }
          break;
        }
      }
      // Dodatkowa heurystyka: czy ostatnia linia to podpis agenta?
      const tail = mapped.description.split("\n").filter((l) => l.trim()).slice(-1)[0];
      if (tail && mapped.agent_name && tail.trim() === mapped.agent_name.trim()) {
        console.log(`⚠️  [${mapped.galactica_offer_id}] opis kończy się imieniem agenta: "${tail}"`);
      }
    } else {
      badDescriptions++;
    }
  }
  if (offendingSamples.length > 0) {
    console.log("\n--- próbki kontekstu ---");
    for (const s of offendingSamples) console.log(s);
  }

  // Pinpoint test: konkretne oferty po ostatnich fixach
  const pinpoint = ["FIB-MS-4129", "FIB-MW-3641"];
  console.log("\n=== PINPOINT ===");
  for (const id of pinpoint) {
    const raw = parsed.offers.find((o) => o.id === id);
    if (!raw) {
      console.log(`  ${id}: NIE ZNALEZIONO`);
      continue;
    }
    const m = mapOffer(raw);
    console.log(`  ${id}: title="${m.title}" advertisement_text="${m.advertisement_text}"`);
    if (m.description) {
      const hit = /(\d)\s+(00)\s*zł/.exec(m.description);
      if (hit) console.log(`    ⚠️ pozostało: "${hit[0]}" (pełny kontekst: ${m.description.slice(Math.max(0, hit.index - 30), hit.index + 30)})`);
      else console.log(`    ok — brak "N 00 zł" w opisie`);
    }
  }

  console.log("");
  console.log(`Opisy wyczyszczone: ${cleanedCount}/${parsed.offers.length}`);
  console.log(`Opisy puste po czyszczeniu (null): ${badDescriptions}`);
  console.log(`Oferty z pozostałym boilerplatem: ${hasBoilerplate}`);

  // Pokaż pierwszy wyczyszczony opis jako próbkę
  const first = parsed.offers.find((o) => {
    const m = mapOffer(o);
    return m.description;
  });
  if (first) {
    const m = mapOffer(first);
    console.log("");
    console.log(`=== PRÓBKA: ${m.galactica_offer_id} ===`);
    console.log(`Kategoria: ${m.category} / ${m.listing_type}`);
    console.log(`Tytuł: ${m.advertisement_text}`);
    console.log(`Cena: ${m.price} ${m.currency}`);
    console.log(`Powierzchnia: ${m.area_total}`);
    console.log(`Miasto: ${m.city}`);
    console.log(`Agent: ${m.agent_name} <${m.agent_email}>`);
    console.log(`Zdjęć: ${m.image_filenames.length}`);
    console.log("");
    console.log("=== OPIS (po czyszczeniu) ===");
    console.log(m.description);
    console.log("=== /OPIS ===");
  }

  // Statystyki wg kategorii
  const stats = new Map<string, number>();
  for (const o of parsed.offers) {
    const key = `${o.category}/${o.listing_type}`;
    stats.set(key, (stats.get(key) ?? 0) + 1);
  }
  console.log("");
  console.log("=== STATYSTYKI ===");
  for (const [k, v] of stats) console.log(`  ${k}: ${v}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
