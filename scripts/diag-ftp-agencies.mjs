// READ-ONLY diagnostyka FTP: które pliki, jaka agencja, jakie ID ofert.
// Nic nie zapisuje do bazy ani na FTP. Tylko pobiera ZIP-y do /tmp i czyta nagłówki.
import { readFileSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { Client } from "basic-ftp";
import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = {};
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[m[1]] = v;
  }
  return env;
}
const env = loadEnv();

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  trimValues: false,
  isArray: (name) => ["dzial", "oferta", "oferta_usun", "param", "area"].includes(name),
});
const str = (v) => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && typeof v["#text"] === "string") return v["#text"];
  return String(v);
};

function inspectXml(xml) {
  const doc = parser.parse(xml);
  const plik = doc.plik ?? {};
  const h = plik.header ?? {};
  const agencja = str(h.agencja).trim();
  const zawartosc = str(h.zawartosc_pliku).trim().toLowerCase();
  const data = str(h.data).trim();
  const cel = str(h.cel).trim();
  const lista = plik.lista_ofert ?? {};
  const ids = [];
  for (const d of lista.dzial ?? []) {
    for (const o of d.oferta ?? []) {
      const id = str(o.id).trim();
      if (id) ids.push(id);
    }
  }
  const usun = [];
  for (const u of [...(lista.oferta_usun ?? []), ...(plik.oferta_usun ?? [])]) {
    const id = str(u.id).trim();
    if (id) usun.push(id);
  }
  return { agencja, zawartosc, data, cel, ids, usun };
}

const client = new Client();
client.ftp.verbose = false;
await client.access({
  host: env.FTP_HOST,
  user: env.FTP_USER,
  password: env.FTP_PASS,
  port: parseInt(env.FTP_PORT || "21", 10),
  secure: (env.FTP_SECURE || "true").toLowerCase() === "true",
  secureOptions: { rejectUnauthorized: false },
});
const remoteDir = env.FTP_REMOTE_DIR || "/";
if (remoteDir && remoteDir !== "/") await client.cd(remoteDir);

const list = await client.list();
const zips = list.filter((f) => f.isFile && /^oferty_.*\.zip$/i.test(f.name)).sort((a, b) => a.name.localeCompare(b.name));
console.log(`=== PLIKI oferty_*.zip na FTP (remoteDir=${remoteDir}) ===`);
console.log("łącznie zipów:", zips.length);
for (const f of list.filter((x) => x.isFile)) {
  if (!/^oferty_.*\.zip$/i.test(f.name)) console.log("  (inny plik):", f.name, f.size);
}

const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "fibra-diag-"));
const perAgency = new Map(); // agencja -> Set ids (union ze wszystkich plików)
const perAgencyLatestFull = new Map(); // agencja -> {name, ids} ostatni 'calosc'
const rows = [];

for (const f of zips) {
  const local = path.join(tmpDir, f.name);
  try {
    await client.downloadTo(local, f.name);
    const zip = new AdmZip(local);
    let xml = "";
    for (const e of zip.getEntries()) {
      const n = (e.entryName.split("/").pop() ?? e.entryName).toLowerCase();
      if (n === "oferty.xml") { xml = e.getData().toString("utf-8"); break; }
    }
    await fs.rm(local, { force: true });
    if (!xml) { rows.push({ name: f.name, agencja: "(brak xml)", zawartosc: "-", n: 0, nusun: 0 }); continue; }
    const info = inspectXml(xml);
    rows.push({ name: f.name, agencja: info.agencja || "(puste)", zawartosc: info.zawartosc || "-", n: info.ids.length, nusun: info.usun.length });
    const key = info.agencja || "(puste)";
    if (!perAgency.has(key)) perAgency.set(key, new Set());
    for (const id of info.ids) perAgency.get(key).add(id);
    if (info.zawartosc === "calosc") perAgencyLatestFull.set(key, { name: f.name, ids: new Set(info.ids) });
  } catch (e) {
    rows.push({ name: f.name, agencja: "ERR " + (e?.message ?? e), zawartosc: "-", n: 0, nusun: 0 });
  }
}
client.close();

console.log("\n=== NAGŁÓWKI per plik ===");
for (const r of rows) console.log(`  ${r.name}  agencja="${r.agencja}"  typ=${r.zawartosc}  ofert=${r.n}  usun=${r.nusun}`);

console.log("\n=== AGENCJE (unia ID ze wszystkich plików) ===");
for (const [a, set] of perAgency) console.log(`  "${a}": ${set.size} unikalnych ID`);

console.log("\n=== Ostatni PEŁNY (calosc) eksport per agencja ===");
if (perAgencyLatestFull.size === 0) console.log("  BRAK plików typu 'calosc' — same różnice (roznica).");
for (const [a, v] of perAgencyLatestFull) console.log(`  "${a}": ${v.name} → ${v.ids.size} ofert`);

// Porównanie z bazą: które aktywne oferty NIE są w żadnym pliku FTP (duchy)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: active } = await db.from("offers").select("galactica_offer_id, agent_name").eq("is_active", true);
const allFtpIds = new Set();
for (const set of perAgency.values()) for (const id of set) allFtpIds.add(id);
const ghosts = (active ?? []).filter((o) => !o.galactica_offer_id.startsWith("MANUAL-") && !allFtpIds.has(o.galactica_offer_id));
console.log("\n=== DUCHY: aktywne w bazie, których NIE MA w żadnym pliku FTP ===");
console.log("aktywnych (bez MANUAL):", (active ?? []).filter((o) => !o.galactica_offer_id.startsWith("MANUAL-")).length);
console.log("obecnych na FTP (unia):", allFtpIds.size);
console.log("duchów:", ghosts.length);
for (const g of ghosts) console.log(`  ${g.galactica_offer_id}  (${g.agent_name ?? "?"})`);
