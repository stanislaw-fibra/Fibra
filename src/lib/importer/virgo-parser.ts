import { XMLParser } from "fast-xml-parser";

// Parser eksportu VIRGO (root <Dane>). W odróżnieniu od FTP-XML (<plik><lista_ofert>)
// VIRGO trzyma większość danych w atrybutach <Oferta> oraz w bogatym zestawie elementów
// potomnych. Tu tylko wczytujemy strukturę; mapowanie na MappedOffer robi virgo-mapper.ts.

export interface VirgoAgent {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneMobile: string | null;
  photo: string | null;
  branchId: string | null;
}

export interface VirgoBranch {
  id: string;
  name: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  www: string | null;
}

// Surowy węzeł <Oferta> z fast-xml-parser (atrybuty pod "@_", tekst pod "#text").
export type VirgoOfferNode = Record<string, unknown>;

export interface VirgoParsed {
  appAddress: string | null;
  agents: Map<string, VirgoAgent>;
  branches: Map<string, VirgoBranch>;
  offers: VirgoOfferNode[];
  // Lista galactica_offer_id do dezaktywacji (z <Usuniete>). To rozwiązuje "stale offers" -
  // FTP-różnice nigdy nie dawały jawnej listy usuniętych.
  deletes: string[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  trimValues: false,
  parseAttributeValue: false,
  parseTagValue: false,
  isArray: (name) =>
    ["Agent", "Oddzial", "Oferta", "Foto", "lista", "atrybut", "Cena", "Usun", "Oferta_usun"].includes(
      name,
    ),
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

function attr(node: Record<string, unknown>, name: string): string | null {
  const v = node[`@_${name}`];
  return v === undefined || v === null ? null : String(v).trim();
}

function childText(node: Record<string, unknown>, name: string): string | null {
  const v = node[name];
  if (v === undefined || v === null) return null;
  const s = str(v).trim();
  return s || null;
}

export function parseVirgoXml(xml: string): VirgoParsed {
  const doc = parser.parse(xml) as { Dane?: Record<string, unknown> };
  const dane = doc.Dane ?? {};
  const appAddress = attr(dane, "AdresAPP");

  // Agenci
  const agents = new Map<string, VirgoAgent>();
  const agenciRoot = (dane.Agenci as Record<string, unknown> | undefined) ?? {};
  const agentArr = (agenciRoot.Agent as Record<string, unknown>[] | undefined) ?? [];
  for (const a of agentArr) {
    const id = attr(a, "ID");
    if (!id) continue;
    agents.set(id, {
      id,
      name: childText(a, "Nazwa"),
      firstName: childText(a, "Imie"),
      lastName: childText(a, "Nazwisko"),
      email: childText(a, "Email"),
      phoneMobile: childText(a, "Komorka"),
      photo: childText(a, "PlikFoto"),
      branchId: childText(a, "Oddzial"),
    });
  }

  // Oddziały
  const branches = new Map<string, VirgoBranch>();
  const oddzialyRoot = (dane.Oddzialy as Record<string, unknown> | undefined) ?? {};
  const branchArr = (oddzialyRoot.Oddzial as Record<string, unknown>[] | undefined) ?? [];
  for (const b of branchArr) {
    const id = attr(b, "ID");
    if (!id) continue;
    branches.set(id, {
      id,
      name: childText(b, "Nazwa"),
      city: childText(b, "Miasto"),
      phone: childText(b, "Telefon"),
      email: childText(b, "Email"),
      www: childText(b, "Www"),
    });
  }

  // Oferty
  const ofertyRoot = (dane.Oferty as Record<string, unknown> | undefined) ?? {};
  const offers = (ofertyRoot.Oferta as VirgoOfferNode[] | undefined) ?? [];

  // Usunięte: <Usuniete> z listą ID (struktura potwierdzona jako pusta na produkcji -
  // obsługujemy kilka prawdopodobnych kształtów, żeby zadziałało gdy się wypełni).
  const deletes: string[] = [];
  const usun = dane.Usuniete as Record<string, unknown> | undefined;
  if (usun) {
    collectDeletedIds(usun, deletes);
  }

  return { appAddress, agents, branches, offers, deletes };
}

// <Usuniete> może mieć różne kształty (lista <Oferta ID=..>, <Usun ID=..>, <lista>ID</lista>,
// albo tekst). Zbieramy wszystkie sensowne identyfikatory, ignorując puste.
function collectDeletedIds(usun: Record<string, unknown>, out: string[]): void {
  const pushId = (v: unknown) => {
    if (v && typeof v === "object") {
      const id = attr(v as Record<string, unknown>, "ID") ?? str(v).trim();
      if (id) out.push(id);
    } else {
      const id = str(v).trim();
      if (id) out.push(id);
    }
  };
  for (const key of ["Oferta", "Usun", "Oferta_usun", "lista", "ID", "#text"]) {
    const v = usun[key];
    if (v === undefined) continue;
    if (Array.isArray(v)) v.forEach(pushId);
    else pushId(v);
  }
}
