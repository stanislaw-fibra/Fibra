import "server-only";
import AdmZip from "adm-zip";

// Cienki klient SOAP/ASMX do VIRGO API Galactiki.
// Flow: LoginEx(key, app) -> Sid; GetOffers(Sid) -> base64 ZIP zawierający xml.xml;
//       GetImage2(Sid, fotoId, "WIDTH_HEIGHT") -> obraz (base64).
//
// Pułapki potwierdzone na produkcji:
// - `app` w LoginEx to host BEZ protokołu (np. "bck.galapp.net"), nie URL.
// - GetImage2 wymaga rozmiaru w formacie "szerokość_wysokość" (np. "1600_1200");
//   inny format zwraca Status=5 "INVALID SIZE (MUST BE width_height)".
// - GetImage2Result owija obraz w <Status>/<Message>/<Image> (Status=0 = OK).

const NS = "pl.galactica.Virgo.virWsOfertyAPI";
const DEFAULT_WS_URL = "https://ex.galapp.net/Moduly/Virgo/virWsOfertyAPI.asmx";
const DEFAULT_APP_HOST = "bck.galapp.net";
const DEFAULT_IMAGE_SIZE = "1600_1200";

export interface VirgoConfig {
  key: string;
  wsUrl: string;
  appHost: string;
  imageSize: string;
}

export function getVirgoConfig(): VirgoConfig {
  const key = process.env.VIRGO_API;
  if (!key) throw new Error("Brak VIRGO_API w env (klucz produkcyjny VIRGO)");
  return {
    key,
    wsUrl: process.env.VIRGO_WS_URL || DEFAULT_WS_URL,
    appHost: process.env.VIRGO_APP_HOST || DEFAULT_APP_HOST,
    imageSize: process.env.VIRGO_IMAGE_SIZE || DEFAULT_IMAGE_SIZE,
  };
}

function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? m[1] : null;
}

async function soapCall(
  cfg: VirgoConfig,
  method: string,
  innerBody: string,
): Promise<string> {
  const envelope =
    `<?xml version="1.0" encoding="utf-8"?>` +
    `<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ` +
    `xmlns:xsd="http://www.w3.org/2001/XMLSchema" ` +
    `xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">` +
    `<soap:Body><${method} xmlns="${NS}">${innerBody}</${method}></soap:Body></soap:Envelope>`;

  const res = await fetch(cfg.wsUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: `"${NS}/${method}"`,
    },
    body: envelope,
  });

  const text = await res.text();
  if (!res.ok) {
    const fault = firstTag(text, "faultstring");
    throw new Error(
      `VIRGO ${method} HTTP ${res.status}${fault ? `: ${fault}` : `: ${text.slice(0, 300)}`}`,
    );
  }
  return text;
}

// Loguje się i zwraca Sid sesji. `app` = host bez protokołu.
export async function loginEx(cfg: VirgoConfig = getVirgoConfig()): Promise<string> {
  const body = `<key>${escXml(cfg.key)}</key><app>${escXml(cfg.appHost)}</app>`;
  const resp = await soapCall(cfg, "LoginEx", body);
  const sid = firstTag(resp, "Sid");
  if (!sid || !sid.trim()) {
    const msg = firstTag(resp, "Message") ?? resp.slice(0, 300);
    throw new Error(`VIRGO LoginEx nie zwrócił Sid: ${msg}`);
  }
  return sid.trim();
}

// Pobiera pełny eksport ofert i zwraca treść xml.xml (root <Dane>).
export async function getOffersXml(
  sid: string,
  cfg: VirgoConfig = getVirgoConfig(),
): Promise<string> {
  const resp = await soapCall(cfg, "GetOffers", `<sid>${escXml(sid)}</sid>`);
  const b64 = firstTag(resp, "OffersZip");
  if (!b64 || !b64.trim()) {
    const msg = firstTag(resp, "Message") ?? resp.slice(0, 300);
    throw new Error(`VIRGO GetOffers nie zwrócił OffersZip: ${msg}`);
  }
  const zipBuf = Buffer.from(b64.trim(), "base64");
  const zip = new AdmZip(zipBuf);
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue;
    const name = entry.entryName.split("/").pop()?.toLowerCase() ?? "";
    if (name === "xml.xml" || name.endsWith(".xml")) {
      return entry.getData().toString("utf-8");
    }
  }
  throw new Error("VIRGO GetOffers: brak xml.xml w paczce OffersZip");
}

// Pobiera lekką listę WSZYSTKICH aktualnych ofert (pełny snapshot, bez ciężkich pól/zdjęć).
// Używamy jej raz dziennie do reconciliacji: które Symbol-e są nadal aktywne w VIRGO, żeby
// wygasić w bazie te, których już nie ma. GetOffers (różnice) nie nadaje się do tego - jest
// przyrostowe i nie zwraca pełnego stanu.
export async function getOfferListXml(
  sid: string,
  cfg: VirgoConfig = getVirgoConfig(),
): Promise<string> {
  const resp = await soapCall(cfg, "GetOfferList", `<sid>${escXml(sid)}</sid>`);
  const b64 = firstTag(resp, "OffersZip");
  if (!b64 || !b64.trim()) {
    const msg = firstTag(resp, "Message") ?? resp.slice(0, 300);
    throw new Error(`VIRGO GetOfferList nie zwrócił OffersZip: ${msg}`);
  }
  const zipBuf = Buffer.from(b64.trim(), "base64");
  const zip = new AdmZip(zipBuf);
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue;
    const name = entry.entryName.split("/").pop()?.toLowerCase() ?? "";
    if (name === "xml.xml" || name.endsWith(".xml")) {
      return entry.getData().toString("utf-8");
    }
  }
  throw new Error("VIRGO GetOfferList: brak xml.xml w paczce OffersZip");
}

/**
 * Wyciąga listę Symbol-i z lekkiej listy GetOfferList. Struktura jest PŁASKA:
 *   <Dane><Oferta ID="..." Symbol="FIB-XX-NNNN" StatusEks="1" .../> ... </Dane>
 * czyli <Oferta> bezpośrednio pod <Dane>, BEZ wrappera <Oferty> i bez treści -
 * dlatego ogólny parseVirgoXml (oczekujący zagnieżdżonych ofert z polami) zwracał 0,
 * przez co reconcile dostawał pustą listę i był po cichu pomijany (próg bezpieczeństwa).
 * Tu lecimy prostym, odpornym wyciąganiem atrybutu Symbol.
 */
export function parseOfferListSymbols(xml: string): string[] {
  const out: string[] = [];
  const re = /<Oferta\b[^>]*\bSymbol="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const s = m[1].trim();
    if (s) out.push(s);
  }
  return out;
}

/**
 * Reset stanu dostarczenia po stronie serwera VIRGO (SOAP "Reset", jak w
 * referencyjnym kliencie). Po resecie kolejne GetOffers zwraca PEŁEN zestaw ofert
 * od nowa - to oficjalny sposób na wymuszenie pełnej resynchronizacji przez żywe
 * API (bez ręcznego seeda). GetOffers jest przyrostowy i stanowy: serwer pamięta,
 * co już nam wysłał; Reset czyści tę pamięć, więc dostajemy wszystko ponownie.
 */
export async function resetOffers(sid: string, cfg: VirgoConfig = getVirgoConfig()): Promise<string> {
  const resp = await soapCall(cfg, "Reset", `<sid>${escXml(sid)}</sid>`);
  const status = firstTag(resp, "Status");
  const msg = firstTag(resp, "Message") ?? "";
  if (status !== null && status.trim() !== "0") {
    throw new Error(`VIRGO Reset Status=${status}: ${msg || resp.slice(0, 200)}`);
  }
  return msg;
}

/**
 * Zgłasza serwerowi VIRGO listę ID ofert, których NAM brakuje (SOAP "SetMissingOffers",
 * param `mids`). Serwer dosyła je w następnym GetOffers - to mechanizm samonaprawy
 * z referencyjnego klienta (porównuje GetOfferList z własną bazą i prosi o brakujące).
 * `ids` to numeryczne ID z Galactiki (atrybut ID w GetOfferList), łączone przecinkami.
 */
export async function setMissingOffers(
  sid: string,
  ids: string[],
  cfg: VirgoConfig = getVirgoConfig(),
): Promise<void> {
  if (ids.length === 0) return;
  const mids = ids.join(",");
  await soapCall(cfg, "SetMissingOffers", `<sid>${escXml(sid)}</sid><mids>${escXml(mids)}</mids>`);
}

// Pobiera jeden obraz po ID zdjęcia (Foto@ID). size w formacie "WIDTH_HEIGHT".
// Zwraca null, gdy VIRGO zgłosi błąd (Status != 0) - wywołujący pomija takie zdjęcie.
export async function getImage2(
  sid: string,
  fotoId: number,
  cfg: VirgoConfig = getVirgoConfig(),
  size: string = cfg.imageSize,
): Promise<Buffer | null> {
  const body = `<sid>${escXml(sid)}</sid><id>${fotoId}</id><size>${escXml(size)}</size>`;
  const resp = await soapCall(cfg, "GetImage2", body);
  const result = firstTag(resp, "GetImage2Result") ?? resp;
  const status = firstTag(result, "Status");
  if (status !== null && status.trim() !== "0") return null;
  const b64 = firstTag(result, "Image");
  if (!b64 || !b64.trim()) return null;
  return Buffer.from(b64.trim(), "base64");
}
