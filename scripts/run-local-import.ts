/**
 * E2E test: uruchamia importer przeciwko lokalnemu oferty.xml i LIVE Supabase.
 *   IMPORT_SKIP_IMAGES=1 — pomija upload zdjęć (szybki sanity-check)
 *
 * Uruchom:
 *   npx tsx scripts/run-local-import.ts
 *   IMPORT_SKIP_IMAGES=1 npx tsx scripts/run-local-import.ts
 */
import Module from "node:module";
import path from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// "server-only" to runtime-guard dla bundlera Next.js (rzuca przy imporcie).
// Dla skryptów CLI podstawiamy pusty moduł.
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
  const { runImport } = await import("../src/lib/importer/run-import");
  const xmlPath = path.resolve(process.cwd(), "oferty.xml");
  const skipImages = process.env.IMPORT_SKIP_IMAGES === "1";

  console.log(`> Import lokalny z ${xmlPath} (skipImages=${skipImages})`);
  const summary = await runImport({ localXmlPath: xmlPath, skipImages });
  console.log("=== SUMMARY ===");
  console.log(JSON.stringify(summary, null, 2));
  if (summary.errors.length > 0) process.exitCode = 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
