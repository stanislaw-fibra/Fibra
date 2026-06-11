/**
 * READ-ONLY: pobiera wskazany (mały) ZIP z FTP i wypisuje PEŁNY manifest plików w środku.
 * Szukamy, czy poza oferty.xml + zdjęciami jest plik z metadanymi zdjęć (np. typ/rzut).
 *
 * Użycie: ZIP_NAME=oferty_2026-06-10_22-34.zip npx tsx scripts/diag-zip-manifest.ts
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
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "fibra-mani-"));
  const localPath = path.join(tmpDir, name);
  console.log(`Pobieram ${name} ...`);
  await client.downloadTo(localPath, name);
  client.close();

  const zip = new AdmZip(localPath);
  const entries = zip.getEntries();
  console.log(`\nManifest (${entries.length} wpisów):`);
  const nonImage: string[] = [];
  let imgCount = 0;
  for (const e of entries) {
    if (/\.(jpe?g|png|webp|gif)$/i.test(e.entryName)) {
      imgCount++;
      continue;
    }
    nonImage.push(`${e.entryName}  (${e.header.size} B)`);
  }
  console.log(`  zdjęć (pominięto w wypisie): ${imgCount}`);
  console.log(`  pliki NIE-obrazowe:`);
  for (const n of nonImage) console.log(`    ${n}`);

  await fs.rm(tmpDir, { recursive: true, force: true });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
