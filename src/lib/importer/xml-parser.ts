import { XMLParser } from "fast-xml-parser";

export interface RawParam {
  nazwa: string;
  typ: string;
  value: string;
}

export interface RawOffer {
  id: string;
  category: string; // dzial[@tab]
  listing_type: string; // dzial[@typ]
  price: { value: string; waluta: string } | null;
  params: RawParam[];
  location: { level: number; value: string }[];
}

export interface ParsedXml {
  header: {
    agencja: string | null;
    data: string | null;
    wersja: string | null;
    cel: string | null;
    zawartosc_pliku: "roznica" | "calosc" | null;
  };
  offers: RawOffer[];
  deletes: string[]; // galactica_offer_id do dezaktywacji
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  // zachowaj treść tekstową w dedykowanym kluczu
  textNodeName: "#text",
  trimValues: false,
  parseAttributeValue: false,
  parseTagValue: false,
  isArray: (name) => ["dzial", "oferta", "oferta_usun", "param", "area"].includes(name),
});

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    if (typeof obj["#text"] === "string") return obj["#text"];
    if (obj["#text"] !== undefined) return String(obj["#text"]);
  }
  return "";
}

export function parseGalacticaXml(xml: string): ParsedXml {
  const doc = parser.parse(xml) as { plik?: Record<string, unknown> };
  const plik = doc.plik ?? {};
  const headerRaw = (plik as Record<string, unknown>).header as
    | Record<string, unknown>
    | undefined;

  const zawartosc = str(headerRaw?.zawartosc_pliku).trim().toLowerCase();

  const header: ParsedXml["header"] = {
    agencja: str(headerRaw?.agencja).trim() || null,
    data: str(headerRaw?.data).trim() || null,
    wersja: str(headerRaw?.wersja).trim() || null,
    cel: str(headerRaw?.cel).trim() || null,
    zawartosc_pliku:
      zawartosc === "roznica" ? "roznica" : zawartosc === "calosc" ? "calosc" : null,
  };

  const offers: RawOffer[] = [];
  const deletes: string[] = [];

  const lista = (plik as Record<string, unknown>).lista_ofert as
    | Record<string, unknown>
    | undefined;

  if (lista) {
    const dzialy = (lista.dzial as unknown[] | undefined) ?? [];
    for (const d of dzialy) {
      const dzialNode = d as Record<string, unknown>;
      const tab = str(dzialNode["@_tab"]).trim();
      const typ = str(dzialNode["@_typ"]).trim();

      const oferty = (dzialNode.oferta as unknown[] | undefined) ?? [];
      for (const o of oferty) {
        const off = parseOffer(o as Record<string, unknown>, tab, typ);
        if (off) offers.push(off);
      }
    }

    // <oferta_usun> jest albo w <lista_ofert> albo luzem — obsłuż oba
    const usunRoot1 = (lista.oferta_usun as unknown[] | undefined) ?? [];
    const usunRoot2 = ((plik as Record<string, unknown>).oferta_usun as unknown[] | undefined) ?? [];
    for (const u of [...usunRoot1, ...usunRoot2]) {
      const id = str((u as Record<string, unknown>).id).trim();
      if (id) deletes.push(id);
    }
  }

  return { header, offers, deletes };
}

function parseOffer(
  node: Record<string, unknown>,
  category: string,
  listing_type: string,
): RawOffer | null {
  const id = str(node.id).trim();
  if (!id) return null;

  const params: RawParam[] = [];
  const paramArr = (node.param as unknown[] | undefined) ?? [];
  for (const p of paramArr) {
    const pn = p as Record<string, unknown>;
    const nazwa = str(pn["@_nazwa"]).trim(); // UWAGA: niektóre mają trailing space ("cenazametr ")
    const typ = str(pn["@_typ"]).trim() || "text";
    const value = str(pn["#text"]);
    if (!nazwa) continue;
    params.push({ nazwa, typ, value });
  }

  // cena: <cena waluta="PLN">474500</cena>
  let price: RawOffer["price"] = null;
  const cenaNode = node.cena as Record<string, unknown> | string | undefined;
  if (cenaNode !== undefined && cenaNode !== null) {
    if (typeof cenaNode === "object") {
      const value = str(cenaNode["#text"]).trim();
      const waluta = str(cenaNode["@_waluta"]).trim() || "PLN";
      if (value) price = { value, waluta };
    } else {
      const value = String(cenaNode).trim();
      if (value) price = { value, waluta: "PLN" };
    }
  }

  // location → area[level]
  const location: RawOffer["location"] = [];
  const loc = node.location as Record<string, unknown> | undefined;
  if (loc) {
    const areas = (loc.area as unknown[] | undefined) ?? [];
    for (const a of areas) {
      const an = a as Record<string, unknown>;
      const level = parseInt(str(an["@_level"]), 10);
      const value = str(an["#text"]).trim();
      if (!Number.isNaN(level) && value) {
        location.push({ level, value });
      }
    }
  }

  return { id, category, listing_type, price, params, location };
}
