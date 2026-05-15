/**
 * Mini-helper: wykonuje SQL z pliku przeciwko live Supabase przez service-role.
 * Używane do ręcznego puszczania migracji gdy nie używamy `supabase db push`.
 *
 *   SQL_FILE=supabase/migrations/20260512000000_agents_slug.sql npx tsx scripts/run-sql.ts
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const sqlFile = process.env.SQL_FILE;
  if (!sqlFile) {
    console.error("Podaj SQL_FILE=ścieżka/do/pliku.sql");
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY w .env.local");
    process.exit(1);
  }

  const sql = await fs.readFile(path.resolve(process.cwd(), sqlFile), "utf-8");
  console.log(`> SQL z ${sqlFile} (${sql.length} bajtów)`);

  // Supabase Postgres REST endpoint (`/rest/v1/rpc/`) wymaga zarejestrowanej funkcji.
  // Najprościej — pgmeta endpoint `/pg/query`. Dla pewności użyję `pg-meta`:
  const endpoint = `${url}/pg-meta/default/query`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`FAIL ${res.status}:\n${text}`);
    process.exit(2);
  }
  console.log("OK:", text.slice(0, 500));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
