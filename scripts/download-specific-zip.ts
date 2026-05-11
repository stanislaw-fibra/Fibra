/**
 * Pobiera konkretny ZIP z FTP (po nazwie) — używane przy szukaniu „calosc" eksportu.
 *
 * Użycie:
 *   ZIP_NAME=oferty_2026-05-09_18-59.zip npx tsx scripts/download-specific-zip.ts
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
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "fibra-zip-"));
  const localPath = path.join(tmpDir, name);
  console.log(`Pobieram ${name} → ${localPath} ...`);
  await client.downloadTo(localPath, name);
  client.close();

  const stat = await fs.stat(localPath);
  console.log(`OK — ${(stat.size / 1024 / 1024).toFixed(1)} MB`);

  const zip = new AdmZip(localPath);
  const entries = zip.getEntries();
  const xmlEntry = entries.find((e) => /oferty.*\.xml$/i.test(e.entryName));
  if (xmlEntry) {
    const xml = xmlEntry.getData().toString("utf-8");
    const typ = xml.match(/<zawartosc_pliku>([^<]+)<\/zawartosc_pliku>/)?.[1] ?? "?";
    const offers = (xml.match(/<oferta\b/g) || []).length;
    console.log(`Typ: ${typ}`);
    console.log(`Ofert: ${offers}`);
  }
  console.log(`\nLOCAL_PATH=${localPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
