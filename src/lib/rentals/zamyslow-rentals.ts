import "server-only";

// ─────────────────────────────────────────────────────────────────────────────
// Mieszkania na wynajem - Zamysłów, Niedobczycka 128F.
//
// Dane czytamy z OPUBLIKOWANEGO arkusza Google (CSV), który aktualizuje Arkadiusz.
// W tej samej zakładce są DWIE tabele:
//   1) wewnętrzna (nazwiska wynajmujących/najemców, telefony, e-maile, wynagrodzenia)
//      -> tej NIGDY nie publikujemy,
//   2) publiczna (piętro, nr lokalu, metraż, garaż, odstępne, kaucja, pokoje,
//      ogród/balkon, rezerwacja, uwagi) -> tylko ją pokazujemy na stronie.
//
// Trzy warstwy ochrony prywatności (gdyby ktoś zmienił układ arkusza):
//   A) zakotwiczenie na nagłówku, który MA kolumnę „Rezerwacja" (ma ją tylko
//      tabela publiczna),
//   B) twardy denylist nagłówków wrażliwych - jeśli trafi się którykolwiek,
//      przerywamy i nie publikujemy nic,
//   C) czytamy wyłącznie whitelistę kolumn po nazwie - dane spoza niej nigdy
//      nie wychodzą poza tę funkcję.
// ─────────────────────────────────────────────────────────────────────────────

/** Kontakt do osoby prowadzącej najem (stopka strony + powiadomienie biura). */
export const RENTAL_AGENT = {
  name: "Arkadiusz Jezusek",
  role: "Specjalista ds. zarządzania najmem",
  // Numer w formacie do wyświetlenia oraz do deep-linków tel:/sms: (E.164).
  phoneDisplay: "881 431 800",
  phoneTel: "+48881431800",
  email: "arkadiusz.jezusek@fibra.pl",
} as const;

export type RentalStatus = "available" | "reserved" | "rented";

export interface RentalUnit {
  /** „parter", „I piętro" itd. (uzupełniane w dół, gdy w wierszu puste). */
  floor: string;
  /** Numer lokalu, np. „128F/1". Klucz unikalny. */
  unit: string;
  /** Metraż jak w arkuszu, np. „35,15". */
  area: string;
  /** Metraż jako liczba - do sortowania. */
  areaNum: number;
  /** Rodzaj miejsca postojowego, np. „garaż podziemny". */
  parking: string;
  /** Odstępne (czynsz najmu), np. „2 600,00 zł". */
  rent: string;
  /** Kaucja, np. „5 200,00 zł". */
  deposit: string;
  /** Liczba pokoi jako tekst z arkusza, np. „2". */
  rooms: string;
  /** „ogród 170 m2" / „balkon". */
  gardenBalcony: string;
  /** Status dostępności wyliczony z kolumny „Rezerwacja". */
  status: RentalStatus;
  /** Surowa etykieta z arkusza, np. „dostępne" / „WYNAJĘTE". */
  statusLabel: string;
  /** Dopisek dla lokali dostępnych z terminem, np. „od września" (inaczej ""). */
  availableNote: string;
  /** Uwagi, np. „mieszkanie urządzone pod klucz". */
  notes: string;
}

export interface RentalListing {
  building: string;
  units: RentalUnit[];
  available: number;
  total: number;
}

// Adres opublikowanego arkusza w formacie CSV (zakładka 128F). Można nadpisać
// zmienną środowiskową, gdyby arkusz został kiedyś przepięty.
const DEFAULT_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTbaBaBAaK3Icqo2wt3jx7IAqr935oe6fJFJPJx2qXhZfIdhAJ-RorR8doRTOiVBgMQJ8hTVzbGeGWI/pub?output=csv";

function csvUrl(): string {
  return process.env.RENTALS_SHEET_CSV_URL?.trim() || DEFAULT_CSV_URL;
}

// Nagłówki, których obecność oznacza, że to TABELA WEWNĘTRZNA - przerywamy.
const SENSITIVE_HEADERS = [
  "wynajmujący",
  "najemca",
  "najem od",
  "najem do",
  "nr tel",
  "adres @",
  "wynagrodzenie",
  "zgłoszone śmieci",
  "zwierzęta",
  "usterki",
];

function norm(s: string): string {
  return (s ?? "").normalize("NFC").trim().toLowerCase();
}

/** Zwija wielokrotne spacje i przycina (arkusz bywa „  2 150,00  zł "). */
function clean(s: string): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function areaToNumber(area: string): number {
  const n = parseFloat(area.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/** Parser CSV (RFC 4180): obsługuje cudzysłowy, przecinki i nowe linie w polach. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  row.push(field);
  rows.push(row);
  return rows;
}

/**
 * Pobiera i parsuje mieszkania na wynajem z opublikowanego arkusza.
 * Zwraca `null`, gdy nie uda się bezpiecznie odczytać tabeli publicznej -
 * strona pokazuje wtedy sam kontakt do Arkadiusza zamiast pustej listy.
 */
export async function getZamyslowRentals(): Promise<RentalListing | null> {
  let text: string;
  try {
    const res = await fetch(csvUrl(), {
      // Cache ISR: świeże dane bez bombardowania Google przy każdym wejściu.
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      console.error("[rentals] Arkusz odpowiedział statusem", res.status);
      return null;
    }
    text = await res.text();
  } catch (e) {
    console.error("[rentals] Nie udało się pobrać arkusza:", e);
    return null;
  }

  const rows = parseCsv(text);

  // (A) Zakotwiczenie: pierwszy wiersz, który ma „numer lokalu" ORAZ „rezerwacja".
  // Kolumnę „Rezerwacja" ma wyłącznie tabela publiczna - tabela wewnętrzna nie.
  const headerIndex = rows.findIndex((r) => {
    const cells = r.map(norm);
    return cells.includes("numer lokalu") && cells.includes("rezerwacja");
  });
  if (headerIndex === -1) {
    console.error("[rentals] Nie znaleziono nagłówka tabeli publicznej.");
    return null;
  }

  const header = rows[headerIndex];

  // (B) Denylist: jeśli w nagłówku jest cokolwiek wrażliwego - nie publikujemy.
  if (header.some((h) => SENSITIVE_HEADERS.some((s) => norm(h).includes(s)))) {
    console.error("[rentals] Nagłówek zawiera kolumny wrażliwe - przerwano.");
    return null;
  }

  // (C) Whitelista: czytamy wyłącznie te kolumny, po nazwie.
  const idx: Record<string, number> = {};
  header.forEach((h, i) => {
    const key = norm(h);
    if (key && !(key in idx)) idx[key] = i;
  });
  const col = (name: string): number => (name in idx ? idx[name] : -1);

  const cFloor = col("piętro");
  const cUnit = col("numer lokalu");
  const cArea = col("metraż");
  const cParking = col("garaż/parking podziemny");
  const cRent = col("odstępne");
  const cDeposit = col("kaucja");
  const cRooms = col("ilość pokoi");
  const cGarden = col("ogród/balkon");
  const cStatus = col("rezerwacja");
  const cNotes = col("uwagi");

  if (cUnit === -1 || cArea === -1 || cStatus === -1) {
    console.error("[rentals] Brak wymaganych kolumn w tabeli publicznej.");
    return null;
  }

  const get = (row: string[], i: number): string =>
    i >= 0 && i < row.length ? clean(row[i]) : "";

  const units: RentalUnit[] = [];
  let lastFloor = "";
  for (let r = headerIndex + 1; r < rows.length; r += 1) {
    const row = rows[r];
    const unit = get(row, cUnit);
    // Pierwszy wiersz bez numeru lokalu = koniec tabeli (publiczna jest ostatnia).
    if (!unit) break;

    const floorRaw = get(row, cFloor);
    if (floorRaw) lastFloor = floorRaw;

    const area = get(row, cArea);
    const statusLabel = get(row, cStatus);
    // „WYNAJĘTE" → zajęte, „REZERWACJA" → zarezerwowane, reszta → dostępne.
    // Dla „dostępne od września" wyciągamy dopisek z terminem.
    let status: RentalStatus;
    let availableNote = "";
    if (/wynaj/i.test(statusLabel)) {
      status = "rented";
    } else if (/rezerw/i.test(statusLabel)) {
      status = "reserved";
    } else {
      status = "available";
      const m = statusLabel.match(/dost[eę]pne\s+(.+)/i);
      if (m) availableNote = m[1].trim();
    }

    units.push({
      floor: lastFloor,
      unit,
      area,
      areaNum: areaToNumber(area),
      parking: get(row, cParking),
      rent: get(row, cRent),
      deposit: get(row, cDeposit),
      rooms: get(row, cRooms),
      gardenBalcony: get(row, cGarden),
      status,
      statusLabel,
      availableNote,
      notes: get(row, cNotes),
    });
  }

  if (units.length === 0) return null;

  return {
    building: "Niedobczycka 128F",
    units,
    available: units.filter((u) => u.status === "available").length,
    total: units.length,
  };
}
