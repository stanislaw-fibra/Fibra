/**
 * Import z lokalnego ZIP-a (oferty_*.zip) → Supabase.
 *   - wyciąga oferty.xml + zdjęcia
 *   - odpala pełny import (oferty + agenci + upload zdjęć do bucket 'offer-images')
 *
 * Użycie:
 *   ZIP_PATH=/path/to/oferty_XXX.zip npx tsx scripts/run-local-zip-import.ts
 *
 * Flagi (env):
 *   DRY_RUN=1            — analiza bez dotykania Supabase (zalicza match zdjęć → oferty)
 *   IMPORT_SKIP_IMAGES=1 — importuj tylko oferty i agentów, zdjęcia pomiń
 *
 * Uwaga: ZIP ~750 MB → podnieś limit pamięci jeśli trzeba:
 *   NODE_OPTIONS="--max-old-space-size=4096" ZIP_PATH=... npx tsx scripts/run-local-zip-import.ts
 */
import Module from "node:module";
import path from "node:path";
import { promises as fs } from "node:fs";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

{
  const m = Module as unknown as {
    _resolveFilename: (r: string, ...rest: unknown[]) => string;
    _cache: Record<string, { exports: unknown; id: string; loaded: boolean }>;
  };
  const orig = m._resolveFilename;
  m._resolveFilename = function (request: string, ...rest: unknown[]): string {
    if (request === "server-only") return "fibra-server-only-shim";
    return orig.call(this, request, ...(rest as [])) as string;
  };
  m._cache["fibra-server-only-shim"] = {
    exports: {},
    id: "fibra-server-only-shim",
    loaded: true,
  };
}

async function main() {
  const zipPathArg = process.env.ZIP_PATH || process.argv[2];
  if (!zipPathArg) {
    console.error(
      "Podaj ścieżkę do ZIP-a:\n  ZIP_PATH=/path/to/oferty_XXX.zip npx tsx scripts/run-local-zip-import.ts",
    );
    process.exit(1);
  }
  const zipPath = path.resolve(process.cwd(), zipPathArg);
  try {
    await fs.access(zipPath);
  } catch {
    console.error(`Nie znaleziono pliku: ${zipPath}`);
    process.exit(1);
  }
  const stat = await fs.stat(zipPath);

  const dryRun = process.env.DRY_RUN === "1";
  const skipImages = process.env.IMPORT_SKIP_IMAGES === "1";

  console.log(`> ZIP: ${zipPath}`);
  console.log(`  rozmiar: ${(stat.size / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  dryRun=${dryRun}  skipImages=${skipImages}`);

  if (dryRun) {
    await doDryRun(zipPath);
    return;
  }

  const { runImport } = await import("../src/lib/importer/run-import");
  const started = Date.now();
  const summary = await runImport({ localZipPath: zipPath, skipImages });
  console.log("=== SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));
  console.log(`> Czas: ${((Date.now() - started) / 1000).toFixed(1)} s`);
  if (summary.errors.length > 0) process.exitCode = 2;
}

// Dry-run: tylko diagnostyka. Nic nie leci do Supabase.
async function doDryRun(zipPath: string) {
  const AdmZip = (await import("adm-zip")).default;
  const { parseGalacticaXml } = await import("../src/lib/importer/xml-parser");
  const { mapOffer } = await import("../src/lib/importer/field-mapper");

  console.log("> Otwieram ZIP...");
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();

  let xmlText = "";
  const imageNames = new Set<string>();
  let totalBytes = 0;

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const name = entry.entryName.split("/").pop() ?? entry.entryName;
    if (name.toLowerCase() === "oferty.xml") {
      xmlText = entry.getData().toString("utf-8");
    } else if (/\.(jpe?g|png|webp)$/i.test(name)) {
      imageNames.add(name);
      totalBytes += entry.header.size;
    }
  }
  if (!xmlText) {
    console.error("Nie znaleziono oferty.xml w ZIP-ie");
    process.exit(1);
  }
  console.log(
    `> W ZIP-ie: obrazów ${imageNames.size}, razem ${(totalBytes / 1024 / 1024).toFixed(1)} MB (surowe pliki, przed uploadem)`,
  );

  const parsed = parseGalacticaXml(xmlText);
  console.log(`> Ofert w XML: ${parsed.offers.length} (typ: ${parsed.header.zawartosc_pliku})`);

  let offersWithImages = 0;
  let offersMissingAll = 0;
  let offersMissingSome = 0;
  let totalExpected = 0;
  let totalMatched = 0;
  const missingSamples: string[] = [];
  const perOfferSummary: Array<{ id: string; expected: number; found: number }> = [];

  for (const raw of parsed.offers) {
    const mapped = mapOffer(raw);
    const expected = mapped.image_filenames.length;
    if (expected === 0) continue;
    offersWithImages++;
    totalExpected += expected;
    let found = 0;
    for (const img of mapped.image_filenames) {
      if (imageNames.has(img.filename)) found++;
      else if (missingSamples.length < 5) missingSamples.push(img.filename);
    }
    totalMatched += found;
    if (found === 0) offersMissingAll++;
    else if (found < expected) offersMissingSome++;
    perOfferSummary.push({ id: mapped.galactica_offer_id, expected, found });
  }

  console.log("\n=== DRY-RUN: zdjęcia ===");
  console.log(`Oferty ze zdjęciami w XML:       ${offersWithImages}`);
  console.log(`Zdjęć oczekiwanych (XML):        ${totalExpected}`);
  console.log(`Zdjęć zmatchowanych w ZIP-ie:    ${totalMatched}`);
  console.log(`Oferty bez żadnego match:        ${offersMissingAll}`);
  console.log(`Oferty z częściowym brakiem:     ${offersMissingSome}`);
  if (missingSamples.length > 0) {
    console.log(`\nPrzykłady plików z XML, których NIE MA w ZIP:`);
    for (const f of missingSamples) console.log(`  - ${f}`);
  }
  const problems = perOfferSummary.filter((p) => p.found < p.expected).slice(0, 10);
  if (problems.length > 0) {
    console.log(`\nOferty z niepełnym match (max 10):`);
    for (const p of problems) {
      console.log(`  ${p.id}: ${p.found}/${p.expected}`);
    }
  }
  console.log(`\n→ OK, to był dry-run. Nic nie zostało uploadowane.`);
  console.log(`→ Pełny upload: odpal bez DRY_RUN=1.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
