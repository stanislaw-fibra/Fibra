/**
 * Zasiew bazy z VIRGO. Domyślnie DRY-RUN (nic nie zapisuje). Dopiero --apply pisze do Supabase.
 *
 * Źródło XML:
 *   - domyślnie zapisany pełny eksport: VIRGO_XML_FILE=/sciezka/xml.xml (zalecane dla seedu),
 *   - bez VIRGO_XML_FILE: live GetOfferList (pełny snapshot) - uwaga na rate-limit.
 *
 * Przykłady:
 *   VIRGO_XML_FILE=/tmp/virgo-dump/xml.xml npx tsx scripts/virgo-seed.ts            # dry-run, bez zdjęć w liczeniu pobrań
 *   VIRGO_XML_FILE=/tmp/virgo-dump/xml.xml npx tsx scripts/virgo-seed.ts --apply --skip-images
 *   VIRGO_XML_FILE=/tmp/virgo-dump/xml.xml npx tsx scripts/virgo-seed.ts --apply --max-images 200
 */
import Module from "node:module";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// server-only shim (jak w scripts/virgo-validate.ts).
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
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const skipImages = args.includes("--skip-images");
  const maxIdx = args.indexOf("--max-images");
  const maxImagesPerRun = maxIdx >= 0 ? Number(args[maxIdx + 1]) : undefined;

  const { runVirgoImport } = await import("@/lib/importer/virgo-run");

  const localXmlPath = process.env.VIRGO_XML_FILE;
  console.log(
    `tryb: ${apply ? "APPLY (zapis do Supabase)" : "DRY-RUN (bez zapisu)"}` +
      `, źródło: ${localXmlPath ?? "live GetOfferList"}` +
      `, zdjęcia: ${skipImages ? "pominięte" : maxImagesPerRun ? `max ${maxImagesPerRun}/run` : "wszystkie brakujące"}`,
  );

  const summary = await runVirgoImport({
    importType: "full",
    localXmlPath,
    skipImages,
    maxImagesPerRun: Number.isFinite(maxImagesPerRun) ? maxImagesPerRun : undefined,
    dryRun: !apply,
    sourceBranch: "virgo",
  });

  console.log("\n=== PODSUMOWANIE ===");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error("BŁĄD:", e instanceof Error ? e.stack : e);
  process.exit(1);
});
