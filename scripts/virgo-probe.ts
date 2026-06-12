/**
 * Jednorazowy probe VIRGO API (read-only).
 * LoginEx -> GetOffers -> rozpakuj base64 ZIP -> zrzuć xml.xml do /tmp/virgo-dump/.
 * Klucz czytany z .env.local (VIRGO_API). NIC nie zapisuje do Supabase.
 *
 * Uruchom:  npx tsx scripts/virgo-probe.ts
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";

const WS_URL = process.env.VIRGO_WS_URL || "https://ex.galapp.net/Moduly/Virgo/virWsOfertyAPI.asmx";
const NS = "pl.galactica.Virgo.virWsOfertyAPI";
const APP_HOST = process.env.VIRGO_APP_HOST || "bck.galapp.net"; // host BEZ protokołu

async function loadKey(): Promise<string> {
  if (process.env.VIRGO_API) return process.env.VIRGO_API;
  const env = await fs.readFile(path.join(process.cwd(), ".env.local"), "utf-8");
  const m = env.match(/^VIRGO_API=(.*)$/m);
  if (!m) throw new Error("Brak VIRGO_API w .env.local");
  return m[1].trim().replace(/^["']|["']$/g, "");
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function soapCall(method: string, body: string): Promise<string> {
  const envelope =
    `<?xml version="1.0" encoding="utf-8"?>` +
    `<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ` +
    `xmlns:xsd="http://www.w3.org/2001/XMLSchema" ` +
    `xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">` +
    `<soap:Body><${method} xmlns="${NS}">${body}</${method}></soap:Body></soap:Envelope>`;
  const res = await fetch(WS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: `"${NS}/${method}"`,
    },
    body: envelope,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`SOAP ${method} HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  return text;
}

function extractTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? m[1] : null;
}

async function main() {
  const key = await loadKey();
  console.log(`WS_URL=${WS_URL}`);
  console.log(`APP_HOST=${APP_HOST}`);
  console.log(`key=${key.slice(0, 8)}...(${key.length} znaków)`);

  // 1. LoginEx
  const loginResp = await soapCall("LoginEx", `<key>${esc(key)}</key><app>${esc(APP_HOST)}</app>`);
  const sid = extractTag(loginResp, "Sid");
  if (!sid) {
    console.error("Brak <Sid> w odpowiedzi LoginEx. Surowa odpowiedź:");
    console.error(loginResp.slice(0, 1500));
    process.exit(1);
  }
  console.log(`\nLoginEx OK. Sid=${sid.slice(0, 12)}...`);

  // 2. GetOffers
  const offersResp = await soapCall("GetOffers", `<sid>${esc(sid)}</sid>`);
  const b64 = extractTag(offersResp, "OffersZip");
  if (!b64) {
    console.error("Brak <OffersZip> w odpowiedzi GetOffers. Surowa odpowiedź:");
    console.error(offersResp.slice(0, 1500));
    process.exit(1);
  }
  const zipBuf = Buffer.from(b64.trim(), "base64");
  console.log(`GetOffers OK. ZIP base64 -> ${zipBuf.length} bajtów`);

  // 3. Rozpakuj ZIP
  const zip = new AdmZip(zipBuf);
  const entries = zip.getEntries();
  console.log(`\nZawartość ZIP-a (${entries.length} wpisów):`);
  for (const e of entries) console.log(`  - ${e.entryName} (${e.header.size} B)`);

  const outDir = "/tmp/virgo-dump";
  await fs.mkdir(outDir, { recursive: true });
  for (const e of entries) {
    if (e.isDirectory) continue;
    await fs.writeFile(path.join(outDir, e.entryName.split("/").pop()!), e.getData());
  }
  console.log(`\nWypakowano do ${outDir}/`);
}

main().catch((e) => {
  console.error("BŁĄD:", e instanceof Error ? e.message : e);
  process.exit(1);
});
