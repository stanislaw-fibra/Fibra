/**
 * Import lokalnego XML-a z przypisaną gałęzią biznesową (source_branch).
 *
 * Użycie (XML + opcjonalnie katalog ze zdjęciami):
 *   SOURCE_BRANCH=developerka XML_PATH=oferty2.xml IMPORT_SKIP_IMAGES=1 \
 *     npx tsx scripts/run-local-branch-import.ts
 *
 * Użycie (ZIP z oferty.xml + zdjęciami — jak z Galactiki):
 *   SOURCE_BRANCH=developerka ZIP_PATH=/path/to/oferty_2026-04-21_15-00.zip \
 *     NODE_OPTIONS="--max-old-space-size=4096" npx tsx scripts/run-local-branch-import.ts
 *
 * Env:
 *   ZIP_PATH                - jeśli ustawione: import z ZIP-a (pomija XML_PATH)
 *   XML_PATH                - ścieżka do pliku XML (domyślnie ./oferty.xml)
 *   SOURCE_BRANCH           - gałąź: developerka | posrednictwo | finansowanie | unknown
 *                             (domyślnie 'unknown')
 *   IMPORT_SKIP_IMAGES=1    - pomiń zdjęcia (zwykle tak, upload robimy osobno)
 *   DEACTIVATE_MISSING=1    - przy 'calosc' wyłącz oferty z TEJ SAMEJ gałęzi,
 *                             których nie ma w pliku (domyślnie: WYŁĄCZONE).
 *
 * Dlaczego osobny skrypt od `run-local-import.ts`:
 * - tamten zakłada `oferty.xml` w CWD i nie patrzy na gałąź,
 * - tu chcemy jawnie decydować o (a) źródle, (b) gałęzi, (c) dezaktywacji.
 */
import Module from "node:module";
import path from "node:path";
import { promises as fs } from "node:fs";
import dotenv from "dotenv";
import type { RunImportOptions } from "../src/lib/importer/run-import";
dotenv.config({ path: ".env.local" });

// "server-only" to runtime-guard Next.js — w skryptach CLI podmieniamy na pusty moduł.
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
  const zipArg = process.env.ZIP_PATH?.trim();
  const xmlArg = process.env.XML_PATH || process.argv[2] || "oferty.xml";

  const sourceBranch = (process.env.SOURCE_BRANCH || "unknown").trim() || "unknown";
  const skipImages = process.env.IMPORT_SKIP_IMAGES === "1";
  const deactivateMissingInBranch = process.env.DEACTIVATE_MISSING === "1";

  let runOpts: RunImportOptions;

  if (zipArg) {
    const zipPath = path.resolve(process.cwd(), zipArg);
    try {
      await fs.access(zipPath);
    } catch {
      console.error(`Nie znaleziono pliku ZIP: ${zipPath}`);
      process.exit(1);
    }
    const st = await fs.stat(zipPath);
    console.log(`> ZIP:            ${zipPath}`);
    console.log(`> rozmiar ZIP:    ${(st.size / 1024 / 1024).toFixed(1)} MB`);
    runOpts = {
      localZipPath: zipPath,
      skipImages,
      sourceBranch,
      deactivateMissingInBranch,
    };
  } else {
    const xmlPath = path.resolve(process.cwd(), xmlArg);
    try {
      await fs.access(xmlPath);
    } catch {
      console.error(`Nie znaleziono pliku XML: ${xmlPath}`);
      process.exit(1);
    }
    console.log(`> XML:            ${xmlPath}`);
    runOpts = {
      localXmlPath: xmlPath,
      skipImages,
      sourceBranch,
      deactivateMissingInBranch,
    };
  }

  console.log(`> source_branch:  ${sourceBranch}`);
  console.log(`> skipImages:     ${skipImages}`);
  console.log(`> deactivate:     ${deactivateMissingInBranch}`);

  const { runImport } = await import("../src/lib/importer/run-import");
  const started = Date.now();
  const summary = await runImport(runOpts);
  console.log("=== SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));
  console.log(`> Czas: ${((Date.now() - started) / 1000).toFixed(1)} s`);
  if (summary.errors.length > 0) process.exitCode = 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
