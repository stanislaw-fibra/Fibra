/**
 * Diagnostyka eksportu Galactici — sprawdza czy w pobranym XML są jakiekolwiek tagi
 * formatowania (b/strong/i/em/u/p/font/span itp.) lub ich entity-encoded warianty.
 *
 * Pobiera NAJNOWSZY plik `oferty_*.zip` z FTP, wyciąga `oferty.xml`, robi raport.
 *
 * Użycie:
 *   npx tsx scripts/inspect-galactica-formatting.ts
 *
 * Nie dotyka Supabase, nic nie zapisuje. Czyste read-only.
 */
import Module from "node:module";
import path from "node:path";
import { promises as fs } from "node:fs";
import dotenv from "dotenv";
import AdmZip from "adm-zip";

dotenv.config({ path: ".env.local" });

// Shim "server-only" tak samo jak w innych skryptach.
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
  const { downloadLatestOffersZip } = await import("@/lib/importer/ftp-client");
  console.log("→ Pobieram najnowszy oferty_*.zip z FTP…");
  const zip = await downloadLatestOffersZip();
  if (!zip) {
    console.error("Brak ZIP-a na FTP albo błąd połączenia.");
    process.exit(1);
  }
  console.log(`  Pobrano: ${zip.remoteName} (${(zip.size / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`  Lokalnie: ${zip.localPath}`);

  const adm = new AdmZip(zip.localPath);
  const entries = adm.getEntries();
  const xmlEntry = entries.find((e) => /oferty.*\.xml$/i.test(e.entryName));
  if (!xmlEntry) {
    console.error(`Nie znaleziono oferty.xml w ZIP-ie. Zawartość: ${entries.map((e) => e.entryName).join(", ").slice(0, 200)}`);
    process.exit(1);
  }
  const xml = xmlEntry.getData().toString("utf-8");
  console.log(`\n→ XML: ${xmlEntry.entryName} (${xml.length.toLocaleString("pl-PL")} znaków)`);

  // 1) Sprawdź obecność tagów formatowania (raw + entity-encoded).
  const checks = [
    { label: "<b>", re: /<\s*b\s*>/gi },
    { label: "<strong>", re: /<\s*strong\s*>/gi },
    { label: "<i>", re: /<\s*i\s*>/gi },
    { label: "<em>", re: /<\s*em\s*>/gi },
    { label: "<u>", re: /<\s*u\s*>/gi },
    { label: "<p>", re: /<\s*p\s*[^>]*>/gi },
    { label: "<br>", re: /<\s*br\s*\/?\s*>/gi },
    { label: "<ul>/<ol>", re: /<\s*[uo]l\s*[^>]*>/gi },
    { label: "<li>", re: /<\s*li\s*[^>]*>/gi },
    { label: "<font>", re: /<\s*font\s*[^>]*>/gi },
    { label: "<span>", re: /<\s*span\s*[^>]*>/gi },
    { label: "<div>", re: /<\s*div\s*[^>]*>/gi },
    { label: "&lt;b&gt; (encoded)", re: /&lt;\s*b\s*&gt;/gi },
    { label: "&lt;strong&gt;", re: /&lt;\s*strong\s*&gt;/gi },
    { label: "&lt;i&gt;", re: /&lt;\s*i\s*&gt;/gi },
    { label: "**bold** (markdown)", re: /\*\*[^*\n]+\*\*/g },
    { label: "__bold__ (markdown)", re: /__[^_\n]+__/g },
  ];

  console.log("\n=== TAGI FORMATOWANIA W XML ===");
  for (const c of checks) {
    const matches = xml.match(c.re);
    const count = matches?.length ?? 0;
    const status = count > 0 ? "✓" : " ";
    console.log(`  ${status} ${c.label.padEnd(28)} ${count}`);
  }

  // 2) Wyciągnij 3 sample opisów do podglądu.
  const opisRe = /<param\s+nazwa="opis"\s+typ="text">([\s\S]*?)<\/param>/g;
  const samples: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = opisRe.exec(xml)) && samples.length < 3) {
    const v = m[1].trim();
    if (v.length > 40) samples.push(v);
  }

  console.log("\n=== PRÓBKA: 3 OPISY (pierwsze 600 znaków każdego) ===");
  samples.forEach((s, i) => {
    console.log(`\n--- opis #${i + 1} ---`);
    console.log(s.slice(0, 600));
    if (s.length > 600) console.log(`... (${s.length - 600} więcej znaków)`);
  });

  // 3) Sprawdź ogólny zestaw tagów w opisach.
  console.log("\n=== UNIKALNE TAGI W OPISACH ===");
  const allTags = new Set<string>();
  let totalDescs = 0;
  opisRe.lastIndex = 0;
  while ((m = opisRe.exec(xml))) {
    totalDescs += 1;
    const inner = m[1];
    const tags = inner.match(/<\s*\/?\s*([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g);
    if (tags) {
      for (const t of tags) {
        const name = t.match(/[a-zA-Z]+/)?.[0]?.toLowerCase();
        if (name) allTags.add(name);
      }
    }
  }
  console.log(`  Łącznie opisów w XML: ${totalDescs}`);
  console.log(`  Tagi znalezione w opisach: ${[...allTags].sort().join(", ") || "(żadne)"}`);
}

main().catch((e) => {
  console.error("BŁĄD:", e);
  process.exit(1);
});
