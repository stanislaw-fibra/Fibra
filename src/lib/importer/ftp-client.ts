import "server-only";
import { Client, FileInfo } from "basic-ftp";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

export interface FtpConfig {
  host: string;
  user: string;
  password: string;
  port: number;
  secure: boolean;
  remoteDir: string;
}

export function getFtpConfig(): FtpConfig {
  const host = process.env.FTP_HOST;
  const user = process.env.FTP_USER;
  const password = process.env.FTP_PASS;
  if (!host || !user || !password) {
    throw new Error("Brak FTP_HOST / FTP_USER / FTP_PASS w env");
  }
  return {
    host,
    user,
    password,
    port: parseInt(process.env.FTP_PORT || "21", 10),
    secure: (process.env.FTP_SECURE || "true").toLowerCase() === "true",
    remoteDir: process.env.FTP_REMOTE_DIR || "/",
  };
}

// Wyciągnij sortowalny klucz z nazwy typu "oferty_2026-04-20_11-34.zip"
export function zipDateKey(name: string): string {
  const m = name.match(/oferty_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2})/);
  return m ? m[1] : name;
}

export function isOffersZip(name: string): boolean {
  return /^oferty_.*\.zip$/i.test(name);
}

export interface DownloadedZip {
  localPath: string;
  remoteName: string;
  size: number;
}

// Pobiera NAJNOWSZY plik oferty_*.zip z FTP do lokalnego /tmp.
// skipFilenames — lista nazw plików, które zostały już przetworzone (pomiń je).
export async function downloadLatestOffersZip(
  config: FtpConfig = getFtpConfig(),
  skipFilenames: string[] = [],
): Promise<DownloadedZip | null> {
  const client = new Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port,
      secure: config.secure,
      secureOptions: { rejectUnauthorized: false },
    });

    if (config.remoteDir && config.remoteDir !== "/") {
      await client.cd(config.remoteDir);
    }

    const list: FileInfo[] = await client.list();
    const zips = list
      .filter((f) => f.isFile && isOffersZip(f.name))
      .filter((f) => !skipFilenames.includes(f.name))
      .sort((a, b) => zipDateKey(b.name).localeCompare(zipDateKey(a.name)));

    if (zips.length === 0) return null;

    const newest = zips[0];
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "fibra-import-"));
    const localPath = path.join(tmpDir, newest.name);

    await client.downloadTo(localPath, newest.name);

    return {
      localPath,
      remoteName: newest.name,
      size: newest.size,
    };
  } finally {
    client.close();
  }
}
