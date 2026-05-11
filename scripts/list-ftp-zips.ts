/**
 * Listuje wszystkie pliki oferty_*.zip na FTP — żeby zobaczyć typy eksportu (roznica/calosc)
 * i wybrać najnowszy całościowy do re-importu.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

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
  const zips = list.filter((f) => /^oferty_.*\.zip$/i.test(f.name));
  zips.sort((a, b) => b.name.localeCompare(a.name));
  console.log(`WSZYSTKIE ZIP-y na FTP (${zips.length}):`);
  for (const z of zips.slice(0, 30)) {
    console.log(`  ${z.name}  (${(z.size / 1024 / 1024).toFixed(1)} MB)`);
  }
  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
