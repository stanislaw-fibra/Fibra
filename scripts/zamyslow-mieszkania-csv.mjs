/**
 * Generuje CSV z 36 mieszkaniami nowej inwestycji (Zamysłów) w układzie kolumn
 * z poprzedniej inwestycji 128F - do wrzucenia na Google Sheets.
 *   node scripts/zamyslow-mieszkania-csv.mjs
 * Dane per mieszkanie pochodzą z architektonicznych PDF (13.07.2026) - NIE z prospektu.
 * Skrypt sam sprawdza sumy powierzchni per piętro względem wartości z PDF.
 */
// Generuje CSV dla nowej inwestycji (36 mieszkań) w układzie kolumn z 128F.
// Dane per mieszkanie (metraż, pokoje, rozkład) - z architektonicznych PDF 13.07.2026.
import fs from "node:fs";

const liv = (a) => ["Pokój dzienny z aneksem kuchennym", a];
const rm = (a) => ["Pokój", a];
const bd = (a) => ["Sypialnia", a];
const ba = (a) => ["Łazienka", a];

// [nr, piętro, pow, pokoje, [pomieszczenia]]
const M = [
  // PARTER
  ["M1", 0, 31.12, 2, [liv(20.23), bd(7.19), ba(3.7)]],
  ["M2", 0, 49.15, 3, [liv(27.04), rm(7.28), ba(4.48), bd(10.35)]],
  ["M3", 0, 27.44, 2, [liv(16.4), bd(7.48), ba(3.56)]],
  ["M4", 0, 28.69, 2, [liv(17.4), ba(4.13), bd(7.16)]],
  ["M5", 0, 55.42, 3, [liv(27.82), rm(10.24), ba(4.98), bd(12.38)]],
  ["M6", 0, 32.34, 2, [liv(18.47), bd(8.74), ba(5.13)]],
  // I PIĘTRO
  ["M7", 1, 31.12, 2, [liv(20.23), bd(7.19), ba(3.7)]],
  ["M8", 1, 49.15, 3, [liv(27.04), rm(7.28), ba(4.48), bd(10.35)]],
  ["M9", 1, 27.44, 2, [liv(16.4), bd(7.48), ba(3.56)]],
  ["M10", 1, 28.52, 2, [liv(17.23), ba(4.13), bd(7.16)]],
  ["M11", 1, 55.33, 3, [liv(27.82), rm(10.24), ba(4.89), bd(12.38)]],
  ["M12", 1, 40.8, 3, [liv(19.14), rm(8.45), ba(4.95), bd(8.26)]],
  // II PIĘTRO
  ["M13", 2, 31.03, 2, [liv(20.14), bd(7.19), ba(3.7)]],
  ["M14", 2, 48.97, 3, [liv(27.04), rm(7.28), ba(4.48), bd(10.17)]],
  ["M15", 2, 27.44, 2, [liv(16.4), bd(7.48), ba(3.56)]],
  ["M16", 2, 28.43, 2, [liv(17.14), ba(4.13), bd(7.16)]],
  ["M17", 2, 55.24, 3, [liv(27.82), rm(10.24), ba(4.8), bd(12.38)]],
  ["M18", 2, 40.6, 3, [liv(19.14), rm(8.25), ba(4.95), bd(8.26)]],
  // III PIĘTRO
  ["M19", 3, 31.03, 2, [liv(20.14), bd(7.19), ba(3.7)]],
  ["M20", 3, 48.71, 3, [liv(27.04), rm(7.28), ba(4.22), bd(10.17)]],
  ["M21", 3, 27.18, 2, [liv(16.14), bd(7.48), ba(3.56)]],
  ["M22", 3, 28.26, 2, [liv(16.97), ba(4.13), bd(7.16)]],
  ["M23", 3, 55.15, 3, [liv(27.82), rm(10.24), ba(4.71), bd(12.38)]],
  ["M24", 3, 40.6, 3, [liv(19.14), rm(8.25), ba(4.95), bd(8.26)]],
  // IV PIĘTRO
  ["M25", 4, 30.94, 2, [liv(20.05), bd(7.19), ba(3.7)]],
  ["M26", 4, 48.53, 3, [liv(27.04), rm(7.28), ba(4.22), bd(9.99)]],
  ["M27", 4, 27.18, 2, [liv(16.14), bd(7.48), ba(3.56)]],
  ["M28", 4, 28.17, 2, [liv(16.88), ba(4.13), bd(7.16)]],
  ["M29", 4, 55.06, 3, [liv(27.82), rm(10.24), ba(4.62), bd(12.38)]],
  ["M30", 4, 40.42, 3, [liv(19.14), rm(8.07), ba(4.95), bd(8.26)]],
  // V PIĘTRO
  ["M31", 5, 30.94, 2, [liv(20.05), bd(7.19), ba(3.7)]],
  ["M32", 5, 48.53, 3, [liv(27.04), rm(7.28), ba(4.22), bd(9.99)]],
  ["M33", 5, 27.18, 2, [liv(16.14), bd(7.48), ba(3.56)]],
  ["M34", 5, 28.17, 2, [liv(16.88), ba(4.13), bd(7.16)]],
  ["M35", 5, 54.97, 3, [liv(27.82), rm(10.24), ba(4.53), bd(12.38)]],
  ["M36", 5, 32.16, 2, [liv(19.14), rm(8.07), ba(4.95)]],
];

const HEAD = ["Numer oferty","Opis","Data aktualizacji","Data wprowadzenia","Cena (tys.)","Status","Przedmiot","Miasto","Dzielnica","Piętro","Liczba pięter","Własność","Rok budowy","rodzaj budynku","rodzaj mieszkania","winda","piwnica","okna","opcje dodatkowe","komunikacja","pokoje: powierzchnia","ilu stronne","pokoje: podloga","kuchnia: podłoga","Liczba pokoi","liczba sypialni","Łazienka: Liczba łazienek","WC: Liczba WC","Ogrzewanie","Powierzchnia","pow. uzyt. (m2)","garaz","liczba miejsc garazowych","stan lokalu","glosnosc","balkon","wysokosc","material","woda","czynsz","kuchnia: powierzchnia","kuchnia: rodzaj kuchni","lazienka: opis","przedpokoj: opis","CenaWaluta","Ulica","Nr domu","Nr lokalu","Nr KW","Agent - wprowadzil","Klient: Adres","Klient: Imiona","Klient: Nazwisko","Miasto2","Klient: Telefon 2","Klient: Telefon 1","Klient: Telefon 3","Klient: Email 1","zdjecia url","rzut url","pomieszczenia"];

const num = (v) => String(v.toFixed(2)).replace(".", ",");
const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const rows = M.map(([id, floor, area, rooms, list]) => {
  const nr = Number(id.slice(1));
  const pom = list.map(([n, a]) => `${n} ${num(a)}`).join("; ");
  const r = {
    "Numer oferty": id,
    "Opis": "",
    "Data aktualizacji": "",
    "Data wprowadzenia": "",
    "Cena (tys.)": "",                       // DO UZUPEŁNIENIA
    "Status": "aktualna",
    "Przedmiot": "mieszkanie",
    "Miasto": "Rybnik",
    "Dzielnica": "Zamysłów",
    "Piętro": floor,
    "Liczba pięter": 5,
    "Własność": "Własność",
    "Rok budowy": "",                        // DO UZUPEŁNIENIA
    "rodzaj budynku": "apartamentowiec",
    "rodzaj mieszkania": "jednopoziomowe",
    "winda": "tak",
    "piwnica": "brak",
    "okna": "nowe PCV",
    "opcje dodatkowe": "internet, teren ogrodzony, plac zabaw, dzrwi antywłamaniowe, rolety antywłamaniowe",
    "komunikacja": "autobus miejski, autobus podmiejski, bus, kolej",
    "pokoje: powierzchnia": "",
    "ilu stronne": "",
    "pokoje: podloga": "panele/płytki",
    "kuchnia: podłoga": "płytki",
    "Liczba pokoi": rooms,
    "liczba sypialni": rooms - 1,
    "Łazienka: Liczba łazienek": 1,
    "WC: Liczba WC": 1,
    "Ogrzewanie": "gazowe/podłogowe",
    "Powierzchnia": num(area),
    "pow. uzyt. (m2)": num(area),
    "garaz": "garaż podziemny, garaż wolnostojący",
    "liczba miejsc garazowych": 128,
    "stan lokalu": "pod klucz",
    "glosnosc": "umarkowanie ciche",
    "balkon": floor === 0 ? "taras" : "balkon",
    "wysokosc": "",
    "material": "",
    "woda": "ciepła z pieca C.O",
    "czynsz": "",                            // DO UZUPEŁNIENIA
    "kuchnia: powierzchnia": "",
    "kuchnia: rodzaj kuchni": "aneks kuchenny",
    "lazienka: opis": "",
    "przedpokoj: opis": "",
    "CenaWaluta": "PLN",
    "Ulica": "Niedobczycka",
    "Nr domu": "",                           // DO UZUPEŁNIENIA
    "Nr lokalu": nr,
    "Nr KW": "",
    "Agent - wprowadzil": "",
    "Klient: Adres": "", "Klient: Imiona": "", "Klient: Nazwisko": "", "Miasto2": "Rybnik",
    "Klient: Telefon 2": "", "Klient: Telefon 1": "", "Klient: Telefon 3": "", "Klient: Email 1": "",
    "zdjecia url": "", "rzut url": "",
    "pomieszczenia": pom,
  };
  return HEAD.map((h) => esc(r[h])).join(",");
});

const out = [HEAD.map(esc).join(","), ...rows].join("\n") + "\n";
fs.writeFileSync("/tmp/zamyslow-mieszkania.csv", out);
console.log("zapisano /tmp/zamyslow-mieszkania.csv");
console.log(`wierszy: ${rows.length}, kolumn: ${HEAD.length}`);

// kontrola sum względem PDF (pow. użytkowa mieszkań per piętro)
const REF = { 0: 224.16, 1: 232.36, 2: 231.71, 3: 230.93, 4: 230.30, 5: 221.95 };
console.log("\nkontrola sum powierzchni per piętro (vs PDF):");
for (let f = 0; f <= 5; f++) {
  const s = M.filter((m) => m[1] === f).reduce((a, m) => a + m[2], 0);
  const ok = Math.abs(s - REF[f]) < 0.02;
  console.log(`  piętro ${f}: ${s.toFixed(2)} m²  (PDF: ${REF[f]})  ${ok ? "OK" : "!!! ROZBIEŻNOŚĆ"}`);
}
