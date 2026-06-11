/**
 * READ-ONLY diagnostyka: pobiera wskazany ZIP z FTP, wyciąga tylko oferty.xml i szuka,
 * JAK Galactica koduje oznaczenie rzutu (zielony podwójny kwadrat). Po analizie kasuje ZIP.
 *
 * Użycie:
 *   ZIP_NAME=oferty_2026-06-11_06-19.zip npx tsx scripts/diag-floorplan-marker.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import AdmZip from "adm-zip";
import Module from "node:module";
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
  m._cache["fibra-server-only-shim"] = { exports: {}, id: "fibra-server-only-shim", loaded: true };
}

import { Client } from "basic-ftp";

async function main() {
  const name = process.env.ZIP_NAME;
  if (!name) {
    console.error("Podaj ZIP_NAME=oferty_xxx.zip");
    process.exit(1);
  }
  const client = new Client();
  client.ftp.verbose = false;
  await client.access({
    host: process.env.FTP_HOST!,
    user: process.env.FTP_USER!,
    password: process.env.FTP_PASS!,
    port: parseInt(process.env.FTP_PORT || "21", 10),
    secure: (process.env.FTP_SECURE || "true").toLowerCase() === "true",
    secureOptions: { rejectUnauthorized: false },
  });
  if (process.env.FTP_REMOTE_DIR && process.env.FTP_REMOTE_DIR !== "/") {
    await client.cd(process.env.FTP_REMOTE_DIR);
  }
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "fibra-fp-"));
  const localPath = path.join(tmpDir, name);
  console.log(`Pobieram ${name} ...`);
  await client.downloadTo(localPath, name);
  client.close();
  const stat = await fs.stat(localPath);
  console.log(`Pobrano ${(stat.size / 1024 / 1024).toFixed(1)} MB`);

  const zip = new AdmZip(localPath);
  const entries = zip.getEntries();
  const xmlEntry = entries.find((e) => /oferty.*\.xml$/i.test(e.entryName));
  if (!xmlEntry) {
    console.error("Brak oferty.xml w ZIP");
    await fs.rm(tmpDir, { recursive: true, force: true });
    process.exit(1);
  }
  const xml = xmlEntry.getData().toString("utf-8");
  // zachowaj XML lokalnie do dalszej analizy
  const outXml = path.join(process.cwd(), "tmp-latest-oferty.xml");
  await fs.writeFile(outXml, xml, "utf-8");
  console.log(`Zapisano XML → ${outXml}`);

  const typ = xml.match(/<zawartosc_pliku>([^<]+)<\/zawartosc_pliku>/)?.[1] ?? "?";
  const offers = (xml.match(/<oferta\b/g) || []).length;
  console.log(`Typ eksportu: ${typ}`);
  console.log(`Ofert: ${offers}`);

  // Szukamy potencjalnych markerów rzutu. Nie wiemy, jak Galactica je nazywa,
  // więc wypisujemy WSZYSTKIE unikalne nazwy paramów + atrybuty zdjęć.
  const paramNames = new Map<string, number>();
  const reParam = /<param\b[^>]*\bnazwa="([^"]+)"/g;
  let mm: RegExpExecArray | null;
  while ((mm = reParam.exec(xml))) {
    const n = mm[1].trim();
    paramNames.set(n, (paramNames.get(n) ?? 0) + 1);
  }
  const sorted = [...paramNames.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  console.log(`\n=== UNIKALNE nazwy paramów (${sorted.length}) ===`);
  for (const [n, c] of sorted) console.log(`  ${n}  (${c}x)`);

  // Atrybuty na <param nazwa="zdjecieN" ...> — czy jest tam coś poza typ="text"?
  console.log(`\n=== Pełne tagi param dla zdjęć (pierwsze 12) ===`);
  const reZ = /<param\b[^>]*nazwa="zdjecie\d+"[^>]*>/g;
  let z: RegExpExecArray | null;
  let count = 0;
  while ((z = reZ.exec(xml)) && count < 12) {
    console.log(`  ${z[0]}`);
    count++;
  }

  // Szukaj słów-kluczy mogących oznaczać rzut/plan
  console.log(`\n=== Słowa-klucze (rzut/plan/floor/2d/3d) w XML ===`);
  for (const kw of ["rzut", "plan", "floor", "2d", "3d", "schemat", "miniatur", "glown"]) {
    const re = new RegExp(kw, "gi");
    const n = (xml.match(re) || []).length;
    if (n > 0) console.log(`  "${kw}": ${n}x`);
  }

  await fs.rm(tmpDir, { recursive: true, force: true });
  console.log(`\nUsunięto tymczasowy ZIP. (XML pozostaje w ${outXml})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
