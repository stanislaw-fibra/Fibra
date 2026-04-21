/**
 * Import lokalnego XML-a z Galactiki do Supabase z przypisaniem gałęzi biznesowej.
 * Służy do kontrolowanego wgrywania eksportów typu "calosc" per gałąź
 * (developerka / posrednictwo / finansowanie / unknown) bez ryzyka wyłączania ofert
 * z innych gałęzi.
 *
 * Domyślne ustawienia są BEZPIECZNE:
 *   - skipImages = true  (zdjęcia wrzucamy osobnym krokiem)
 *   - deactivateMissingInBranch = false  (brakujących ofert NIE dezaktywujemy, chyba że DEACTIVATE_MISSING=1)
 *   - sourceBranch = "unknown"  (reklasyfikacja SQL-em później)
 *
 * Użycie:
 *   XML_PATH=oferty2.xml npx tsx scripts/run-branch-import.ts
 *   XML_PATH=oferty2.xml SOURCE_BRANCH=developerka npx tsx scripts/run-branch-import.ts
 *
 * Flagi (env):
 *   XML_PATH=...            — plik XML do zaimportowania (wymagane)
 *   SOURCE_BRANCH=...       — gałąź (domyślnie 'unknown')
 *   IMPORT_SKIP_IMAGES=0    — wgrywaj zdjęcia (wymaga IMAGES_DIR; domyślnie 1)
 *   IMAGES_DIR=...          — katalog ze zdjęciami (opcjonalnie)
 *   DEACTIVATE_MISSING=1    — pozwól dezaktywować brakujące (DOMYŚLNIE WYŁĄCZONE)
 */
import Module from "node:module";
import path from "node:path";
import { promises as fs } from "node:fs";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// "server-only" to runtime-guard dla bundlera Next.js. Dla skryptów CLI podstawiamy pusty moduł.
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
  const xmlPathArg = process.env.XML_PATH || process.argv[2];
  if (!xmlPathArg) {
    console.error(
      "Podaj ścieżkę do XML-a:\n  XML_PATH=oferty2.xml SOURCE_BRANCH=developerka npx tsx scripts/run-branch-import.ts",
    );
    process.exit(1);
  }
  const xmlPath = path.resolve(process.cwd(), xmlPathArg);
  try {
    await fs.access(xmlPath);
  } catch {
    console.error(`Nie znaleziono pliku XML: ${xmlPath}`);
    process.exit(1);
  }

  const sourceBranch = process.env.SOURCE_BRANCH || "unknown";
  const skipImages = process.env.IMPORT_SKIP_IMAGES !== "0";
  const imagesDir = process.env.IMAGES_DIR
    ? path.resolve(process.cwd(), process.env.IMAGES_DIR)
    : undefined;
  const deactivateMissingInBranch = process.env.DEACTIVATE_MISSING === "1";

  console.log(`> Plik XML:          ${xmlPath}`);
  console.log(`> source_branch:     ${sourceBranch}`);
  console.log(`> skipImages:        ${skipImages}`);
  console.log(`> imagesDir:         ${imagesDir ?? "-"}`);
  console.log(`> deactivateMissing: ${deactivateMissingInBranch}`);
  console.log();

  const { runImport } = await import("../src/lib/importer/run-import");
  const started = Date.now();
  const summary = await runImport({
    localXmlPath: xmlPath,
    localImagesDir: imagesDir,
    skipImages,
    sourceBranch,
    deactivateMissingInBranch,
  });

  console.log("=== SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));
  console.log(`> Czas: ${((Date.now() - started) / 1000).toFixed(1)} s`);
  if (summary.errors.length > 0) process.exitCode = 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
