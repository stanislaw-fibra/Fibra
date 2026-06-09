/**
 * Catch-up importu: pobiera z FTP WSZYSTKIE pliki oferty_*.zip, których nie ma
 * jeszcze w import_runs (status success), sortuje OD NAJSTARSZEGO i odtwarza je
 * po kolei przez ten sam runImport(), którego używa cron.
 *
 * To nadrabia zaległość, której produkcyjny cron nie zaciągnął (bierze tylko najnowszy plik).
 *
 * Flagi (env):
 *   DRY_RUN=1        — tylko wypisz, które pliki byłyby przetworzone (bez pobierania/importu)
 *   SOURCE_BRANCH=…  — gałąź dla nowych ofert (domyślnie 'developerka' — cały feed Galactiki jak dotąd)
 *   LIMIT=n          — przetwórz maks. n najstarszych zaległych plików
 */
import Module from "node:module";
import path from "node:path";
import os from "node:os";
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
  m._cache["fibra-server-only-shim"] = { exports: {}, id: "fibra-server-only-shim", loaded: true };
}

import { Client } from "basic-ftp";
import { createClient } from "@supabase/supabase-js";

function zipDateKey(name: string): string {
  const m = name.match(/oferty_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2})/);
  return m ? m[1] : name;
}

async function main() {
  const dryRun = process.env.DRY_RUN === "1";
  const sourceBranch = process.env.SOURCE_BRANCH || "developerka";
  const limit = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : Infinity;
  // Filtr: przetwarzaj tylko pliki, których data (z nazwy) jest >= SINCE (np. "2026-05-12").
  const since = process.env.SINCE || "";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const db = createClient(url, key, { auth: { persistSession: false } });

  // 1. Co już przerobiliśmy (po source_filename, status=success)
  const { data: runs } = await db
    .from("import_runs")
    .select("source_filename")
    .eq("status", "success")
    .limit(500);
  const processed = new Set((runs ?? []).map((r) => r.source_filename).filter(Boolean) as string[]);

  // 2. Lista plików na FTP
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
  const list = await client.list();
  const pending = list
    .filter((f) => f.isFile && /^oferty_.*\.zip$/i.test(f.name))
    .filter((f) => !processed.has(f.name))
    .filter((f) => !since || zipDateKey(f.name).localeCompare(since) >= 0)
    .sort((a, b) => zipDateKey(a.name).localeCompare(zipDateKey(b.name))) // OD NAJSTARSZEGO
    .slice(0, limit);

  console.log(`Zaległych plików do przetworzenia: ${pending.length} (branch=${sourceBranch}, dryRun=${dryRun})`);
  for (const f of pending) console.log(`  - ${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`);

  if (dryRun || pending.length === 0) {
    client.close();
    console.log(dryRun ? "\n(DRY_RUN — nic nie pobrano ani nie zaimportowano)" : "\nNic do zrobienia.");
    return;
  }

  const { runImport } = await import("../src/lib/importer/run-import");

  let totals = { created: 0, updated: 0, deleted: 0, images: 0, errors: 0 };
  for (const f of pending) {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "fibra-catchup-"));
    const localPath = path.join(tmpDir, f.name);
    process.stdout.write(`\n>>> ${f.name} ... pobieranie`);
    await client.downloadTo(localPath, f.name);
    process.stdout.write(" → import\n");
    try {
      const s = await runImport({ localZipPath: localPath, sourceBranch });
      console.log(
        `    [${s.status}/${s.import_type}] +${s.offers_created} ~${s.offers_updated} -${s.offers_deleted} img:${s.images_imported} err:${s.errors.length}`,
      );
      if (s.errors.length) for (const e of s.errors.slice(0, 5)) console.log(`      ! [${e.step}] ${e.message}`);
      totals.created += s.offers_created;
      totals.updated += s.offers_updated;
      totals.deleted += s.offers_deleted;
      totals.images += s.images_imported;
      totals.errors += s.errors.length;
    } catch (e) {
      console.error(`    BŁĄD importu ${f.name}:`, e instanceof Error ? e.message : e);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }
  client.close();

  console.log(`\n=== RAZEM ===`);
  console.log(`utworzone:${totals.created} zaktualizowane:${totals.updated} dezaktywowane:${totals.deleted} zdjęcia:${totals.images} błędy:${totals.errors}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
