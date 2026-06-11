// READ-ONLY: porównaj aktywne oferty w bazie z jedynym pełnym eksportem (calosc).
import { readFileSync, promises as fs } from "node:fs";
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
const CALOSC = "oferty_2026-04-21_15-00.zip";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text", trimValues: false, isArray: (n) => ["dzial", "oferta", "param", "area"].includes(n) });
const str = (v) => (v == null ? "" : typeof v === "string" ? v : typeof v === "object" && typeof v["#text"] === "string" ? v["#text"] : String(v));

const client = new Client();
await client.access({ host: env.FTP_HOST, user: env.FTP_USER, password: env.FTP_PASS, port: parseInt(env.FTP_PORT || "21", 10), secure: (env.FTP_SECURE || "true").toLowerCase() === "true", secureOptions: { rejectUnauthorized: false } });
const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "fibra-calosc-"));
const local = path.join(tmp, CALOSC);
await client.downloadTo(local, CALOSC);
client.close();

const zip = new AdmZip(local);
let xml = "";
for (const e of zip.getEntries()) { const n = (e.entryName.split("/").pop() ?? e.entryName).toLowerCase(); if (n === "oferty.xml") { xml = e.getData().toString("utf-8"); break; } }
const doc = parser.parse(xml);
const lista = doc.plik?.lista_ofert ?? {};
const caloscIds = new Set();
for (const d of lista.dzial ?? []) for (const o of d.oferta ?? []) { const id = str(o.id).trim(); if (id) caloscIds.add(id); }
await fs.rm(local, { force: true });

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: active } = await db.from("offers").select("galactica_offer_id, agent_name, created_at").eq("is_active", true).not("galactica_offer_id", "like", "MANUAL-%");

const activeIds = new Set(active.map((o) => o.galactica_offer_id));
const activeNotInCalosc = active.filter((o) => !caloscIds.has(o.galactica_offer_id));
const caloscNotActive = [...caloscIds].filter((id) => !activeIds.has(id));

console.log(`=== Pełny eksport ${CALOSC} (21 kwietnia) ===`);
console.log("ofert w pełnym eksporcie:", caloscIds.size);
console.log("aktywnych w bazie (bez MANUAL):", active.length);
console.log("\n=== Aktywne w bazie, których NIE było w pełnym eksporcie z 21.04 ===");
console.log("(dodane późniejszymi różnicami — mogą być realne nowe, albo śmieci):", activeNotInCalosc.length);
const byAgent = new Map();
for (const o of activeNotInCalosc) byAgent.set(o.agent_name ?? "?", (byAgent.get(o.agent_name ?? "?") ?? 0) + 1);
for (const [a, c] of [...byAgent.entries()].sort((x, y) => y[1] - x[1])) console.log(`   ${a}: ${c}`);
for (const o of activeNotInCalosc) console.log(`   ${o.galactica_offer_id}  ${o.agent_name ?? "?"}  created=${o.created_at?.slice(0,10)}`);
console.log("\n=== W pełnym eksporcie z 21.04, ale dziś NIEaktywne w bazie ===");
console.log("(już wygaszone albo nigdy nie zaimportowane):", caloscNotActive.length);
for (const id of caloscNotActive) console.log(`   ${id}`);
