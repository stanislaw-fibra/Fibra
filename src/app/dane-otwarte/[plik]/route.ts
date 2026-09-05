// src/app/dane-otwarte/[plik]/route.ts
//
// Obsluguje dwa adresy:
//   /dane-otwarte/zamyslow-128g.xml            manifest dla dane.gov.pl
//   /dane-otwarte/ceny-128g-YYYY-MM-DD.csv     cennik na dany dzien
//   /dane-otwarte/ceny-128g.csv                cennik na DZISIAJ (staly adres)
//
// Trzeci adres jest po to, ze portal dane.gov.pl da sie wpiac dwojako:
// albo manifestem (portal sam tworzy zasob na kazdy dzien), albo jednym
// zasobem ze STALYM linkiem, ktory portal odpytuje codziennie - tak wpiety
// jest zbior 128F. Stalego linku nie da sie zrobic z adresu z data, stad ten.
//
// Zrodlo danych: arkusz Google opublikowany w sieci jako CSV (cztery zakladki).
// Zadnych danych osobowych. Caly wynik jest publiczny z zalozenia.
//
// Harvester dane.gov.pl pobiera manifest raz na dobe i sprawdza go schematem
// XSD. Gdy XML nie przejdzie walidacji, zbior NIE zostaje zaktualizowany -
// dlatego po kazdej zmianie w budowie XML warto sprawdzic go lokalnie:
//
//   gh api repos/olekstomek/mcod-backend-dane.gov.pl/contents/data/harvester/xml_import_otwarte_dane_1_13.xsd \
//     --jq .content | base64 -d > /tmp/harvester_1_13.xsd
//   curl -s http://localhost:3000/dane-otwarte/zamyslow-128g.xml > /tmp/manifest.xml
//   xmllint --noout --schema /tmp/harvester_1_13.xsd /tmp/manifest.xml
//
// (repozytorium olekstomek/mcod-* to lustro zrodel portalu z dane.gov.pl/source-code)
// Stan na 5.09.2026: manifest przechodzi walidacje schematem 1.13.

export const dynamic = "force-dynamic";

// Dwie proby po 8 s na cztery arkusze to w najgorszym razie ~16 s, a domyslny
// limit funkcji na Vercelu bywa krotszy - wtedy funkcja zostalaby ubita
// dokladnie wtedy, gdy retry ma pomoc, a harvester dostalby 504 zamiast
// danych. 30 s miesci sie w limicie kazdego planu.
export const maxDuration = 30;

// ---------------------------------------------------------------- konfiguracja

// Arkusz Google opublikowany w sieci (Plik > Udostepnij > Opublikuj w sieci),
// cztery zakladki jako CSV. Adresy sa jawne z zalozenia: to dokladnie ten sam
// zbior, ktory i tak trafia na dane.gov.pl. Dlatego siedza w kodzie jako
// wartosc awaryjna - brak zmiennej na Vercelu nie moze wywrocic obowiazkowej
// publikacji. Zmienna srodowiskowa (gdy ustawiona) ma pierwszenstwo: pozwala
// podmienic arkusz bez wdrozenia.
const PUB =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRywFx91ip5xRSG4NThobiHcS4XDs9JGGqK5GfDuBj7AnbcVlHD_HYX4k2r6TW0fjJf7PcRp30g-ZEc/pub";

const arkusz = (gid: string, env: string | undefined) =>
  env && env.trim() ? env.trim() : `${PUB}?gid=${gid}&single=true&output=csv`;

const SHEETS = {
  inwestycja: arkusz("1001990594", process.env.DANE_GOV_SHEET_INWESTYCJA),
  mieszkania: arkusz("36117115", process.env.DANE_GOV_SHEET_MIESZKANIA),
  historia: arkusz("32964673", process.env.DANE_GOV_SHEET_HISTORIA),
  czesci: arkusz("202596353", process.env.DANE_GOV_SHEET_CZESCI),
};

const BAZA_URL = "https://fibra.pl/dane-otwarte";
const PLIK_XML = "zamyslow-128g.xml";
const PREFIX_CSV = "ceny-128g-";

// Cena lokalu trafia do kolumny 40 (iloczyn ceny za m2 i powierzchni).
// Kolumna 38 liczona jest z dokladnoscia do groszy, wiec iloczyn sie zgadza.
// Gdyby ministerstwo zakwestionowalo to podejscie, zmien na "42".
const KOLUMNA_CENY_LOKALU: "40" | "42" = "40";

const X = "X"; // znak umowny zadeklarowany w manifescie

// ---------------------------------------------------------------- narzedzia

function parseCSV(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); out.push(row); row = []; cell = ""; }
    else if (ch !== "\r") cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); out.push(row); }
  return out.filter((r) => r.some((c) => c.trim() !== ""));
}

// Twardy limit na odpowiedz arkusza. Google potrafi przytrzymac polaczenie
// z datacenter, a `fetch` bez sygnalu nie ma wlasnego timeoutu i czeka bez
// konca (3.09.2026 wywalilo to build /osiedle-zamyslow). Tutaj wisialby
// request harvestera dane.gov.pl, wiec: dwie proby po 8 s, potem blad.
const LIMIT_MS = 8_000;
const PROBY = 2;

async function pobierz(url: string): Promise<string[][]> {
  let ostatni: unknown = null;
  for (let proba = 1; proba <= PROBY; proba += 1) {
    try {
      const r = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(LIMIT_MS),
      });
      if (!r.ok) throw new Error(`Nie udalo sie pobrac arkusza: ${r.status}`);
      return parseCSV(await r.text());
    } catch (e) {
      ostatni = e;
      console.error(`[dane-otwarte] Arkusz nie odpowiedzial (proba ${proba}/${PROBY}):`, e);
    }
  }
  throw new Error(`Arkusz nie odpowiedzial: ${(ostatni as Error)?.message ?? "brak odpowiedzi"}`);
}

function naObiekty(rows: string[][]): Record<string, string>[] {
  const head = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const o: Record<string, string> = {};
    head.forEach((h, i) => (o[h] = (r[i] ?? "").trim()));
    return o;
  });
}

// Puste pole musi byc znakiem umownym, nie pusta wartoscia.
const v = (s: string | undefined | null) => (s && s.trim() !== "" ? s.trim() : X);

// Google publikuje wartosci tak, jak sa wyswietlane w arkuszu, wiec liczba
// moze przyjsc jako "351000", "351,000.00", "351 000,00" albo "351000,00".
function liczba(s: string | undefined | null): number | null {
  if (s === undefined || s === null) return null;
  let t = String(s).replace(/[\s\u00a0\u202f]/g, "").replace(/[^\d.,-]/g, "");
  if (t === "") return null;
  const ostPrzecinek = t.lastIndexOf(",");
  const ostKropka = t.lastIndexOf(".");
  if (ostPrzecinek > -1 && ostKropka > -1) {
    // ten znak, ktory stoi dalej, jest separatorem dziesietnym
    t = ostPrzecinek > ostKropka
      ? t.replace(/\./g, "").replace(",", ".")
      : t.replace(/,/g, "");
  } else if (ostPrzecinek > -1) {
    // przecinek dziesietny tylko wtedy, gdy po nim nie stoja dokladnie 3 cyfry
    t = /,\d{3}$/.test(t) ? t.replace(/,/g, "") : t.replace(",", ".");
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

// Kwota w formacie wymaganym przez ministerstwo: kropka dziesietna, bez spacji.
function kwota(s: string | undefined): string {
  const n = liczba(s);
  return n === null ? X : n.toFixed(2);
}

// Znacznik czasu w formacie YYYY-MM-DD HH:MM:SS.
function stempel(s: string | undefined): string {
  if (!s || !s.trim()) return X;
  const d = new Date(s.trim().replace(" ", "T"));
  if (isNaN(d.getTime())) return s.trim();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ` +
    `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function dzien(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Dzisiejsza data wedlug czasu polskiego, niezaleznie od strefy serwera.
function dzisWarszawa(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Warsaw",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------- naglowki CSV

const NAGLOWKI = [
  "Nazwa dewelopera",
  "Forma prawna dewelopera",
  "Nr KRS",
  "Nr wpisu do CEiDG",
  "Nr NIP",
  "Nr REGON",
  "Nr telefonu",
  "Adres poczty elektronicznej",
  "Nr faxu",
  "Adres strony internetowej dewelopera",
  "Województwo adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera",
  "Powiat adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera ",
  "Gmina adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera",
  "Miejscowość adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera",
  "Ulica adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera",
  "Nr nieruchomości adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera",
  "Nr lokalu adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera",
  "Kod pocztowy adresu siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera",
  "Województwo adresu lokalu, w którym prowadzona jest sprzedaż",
  "Powiat adresu lokalu, w którym prowadzona jest sprzedaż",
  "Gmina adresu lokalu, w którym prowadzona jest sprzedaż",
  "Miejscowość adresu lokalu, w którym prowadzona jest sprzedaż",
  "Ulica adresu lokalu, w którym prowadzona jest sprzedaż",
  "Nr nieruchomości adresu lokalu, w którym prowadzona jest sprzedaż",
  "Nr lokalu adresu lokalu, w którym prowadzona jest sprzedaż",
  "Kod pocztowy adresu lokalu, w którym prowadzona jest sprzedaż",
  "Dodatkowe lokalizacje, w których prowadzona jest sprzedaż",
  "Sposób kontaktu nabywcy z deweloperem",
  "Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego",
  "Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego",
  "Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego",
  "Miejscowość lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego",
  "Ulica lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego",
  "Nr nieruchomości lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego",
  "Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego",
  "Rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny ",
  "Nr lokalu lub domu jednorodzinnego nadany przez dewelopera",
  "Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]",
  "Data od której cena obowiązuje cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego",
  "Cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni [zł]",
  "Data od której cena obowiązuje cena lokalu mieszkalnego lub domu jednorodzinnego będących przedmiotem umowy stanowiąca iloczyn ceny m2 oraz powierzchni",
  "Cena lokalu mieszkalnego lub domu jednorodzinnego uwzględniająca cenę lokalu stanowiącą iloczyn powierzchni oraz metrażu i innych składowych ceny, o których mowa w art. 19a ust. 1 pkt 1), 2) lub 3) [zł]",
  "Data od której obowiązuje cena lokalu mieszkalnego lub domu jednorodzinnego uwzględniająca cenę lokalu stanowiącą iloczyn powierzchni oraz metrażu i innych składowych ceny, o których mowa w art. 19a ust. 1 pkt 1), 2) lub 3)",
  "Rodzaj części nieruchomości będących przedmiotem umowy",
  "Oznaczenie części nieruchomości nadane przez dewelopera",
  "Cena części nieruchomości, będących przedmiotem umowy [zł]",
  "Data od której obowiązuje cena części nieruchomości, będących przedmiotem umowy",
  "Rodzaj pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali",
  "Oznaczenie pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali",
  "Wyszczególnienie cen pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali [zł]",
  "Data od której obowiązuje cena wyszczególnionych pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali",
  "Wyszczególnienie praw niezbędnych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego",
  "Wartość praw niezbędnych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego [zł]",
  "Data od której obowiązuje cena wartości praw niezbędnych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego",
  "Wyszczególnienie rodzajów innych świadczeń pieniężnych, które nabywca zobowiązany jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność",
  "Wartość innych świadczeń pieniężnych, które nabywca zobowiązany jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność [zł]",
  "Data od której obowiązuje cena wartości innych świadczeń pieniężnych, które nabywca zobowiązany jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność",
  "Adres strony internetowej, pod którym dostępny jest prospekt informacyjny",
];

// ---------------------------------------------------------------- budowa CSV

function pole(s: string): string {
  // separator to srednik, wiec kazda wartosc zawierajaca srednik,
  // cudzyslow albo znak konca linii musi byc cytowana
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Kolumny 1 do 35, identyczne w kazdym wierszu.
function STALE(I: Record<string, string>): string[] {
  return [
    v(I["Nazwa dewelopera"]),
    v(I["Forma prawna dewelopera"]),
    v(I["Nr KRS"]),
    v(I["Nr wpisu do CEiDG"]),
    v(I["Nr NIP"]),
    v(I["Nr REGON"]),
    v(I["Nr telefonu"]),
    v(I["Adres poczty elektronicznej"]),
    v(I["Nr faxu"]),
    v(I["Adres strony internetowej dewelopera"]),
    v(I["Siedziba - wojewodztwo"]),
    v(I["Siedziba - powiat"]),
    v(I["Siedziba - gmina"]),
    v(I["Siedziba - miejscowosc"]),
    v(I["Siedziba - ulica"]),
    v(I["Siedziba - nr nieruchomosci"]),
    v(I["Siedziba - nr lokalu"]),
    v(I["Siedziba - kod pocztowy"]),
    v(I["Biuro sprzedazy - wojewodztwo"]),
    v(I["Biuro sprzedazy - powiat"]),
    v(I["Biuro sprzedazy - gmina"]),
    v(I["Biuro sprzedazy - miejscowosc"]),
    v(I["Biuro sprzedazy - ulica"]),
    v(I["Biuro sprzedazy - nr nieruchomosci"]),
    v(I["Biuro sprzedazy - nr lokalu"]),
    v(I["Biuro sprzedazy - kod pocztowy"]),
    v(I["Dodatkowe lokalizacje sprzedazy"]),
    v(I["Sposob kontaktu nabywcy z deweloperem"]),
    v(I["Inwestycja - wojewodztwo"]),
    v(I["Inwestycja - powiat"]),
    v(I["Inwestycja - gmina"]),
    v(I["Inwestycja - miejscowosc"]),
    v(I["Inwestycja - ulica"]),
    v(I["Inwestycja - nr nieruchomosci"]),
    v(I["Inwestycja - kod pocztowy"]),
  ];
}

async function zbudujCSV(dataPliku: string): Promise<string> {
  const [invRows, mieszRows, czesciRows, histRows] = await Promise.all([
    pobierz(SHEETS.inwestycja),
    pobierz(SHEETS.mieszkania),
    pobierz(SHEETS.czesci),
    pobierz(SHEETS.historia),
  ]);

  const I: Record<string, string> = {};
  invRows.slice(1).forEach((r) => { if (r[0]?.trim()) I[r[0].trim()] = (r[1] ?? "").trim(); });

  const lokale = naObiekty(mieszRows);
  const czesci = naObiekty(czesciRows);
  const historia = naObiekty(histRows);

  // Cena obowiazujaca na koniec dnia dataPliku, odtworzona z historii.
  const granica = new Date(`${dataPliku}T23:59:59`);
  const zHistorii = (id: string, pozycja: string) => {
    const pasujace = historia
      .filter((h) => h["ID"] === id && h["Pozycja"] === pozycja)
      .map((h) => ({ t: new Date((h["Obowiazuje od"] || "").replace(" ", "T")), h }))
      .filter((x) => !isNaN(x.t.getTime()) && x.t <= granica)
      .sort((a, b) => a.t.getTime() - b.t.getTime());
    return pasujace.length ? pasujace[pasujace.length - 1] : null;
  };

  const dataStart = stempel(`${I["Data rozpoczecia sprzedazy"]} 08:00:00`);

  const linie = [NAGLOWKI.map(pole).join(";")];

  for (const l of lokale) {
    const wpis = zHistorii(l["ID"], "Lokal");
    const cena = wpis ? kwota(wpis.h["Cena (zl)"]) : kwota(l["Cena lokalu (zl)"]);
    const odKiedy = wpis
      ? stempel(wpis.h["Obowiazuje od"])
      : stempel(l["Cena obowiazuje od"]);

    const pow = liczba(l["Powierzchnia uzytkowa (m2)"]);
    const zaM2 = cena !== X && pow && pow > 0 ? (Number(cena) / pow).toFixed(2) : X;

    const cenaIloczyn = KOLUMNA_CENY_LOKALU === "40" ? cena : X;
    const dataIloczyn = KOLUMNA_CENY_LOKALU === "40" ? odKiedy : X;
    const cenaSkladowe = KOLUMNA_CENY_LOKALU === "42" ? cena : X;
    const dataSkladowe = KOLUMNA_CENY_LOKALU === "42" ? odKiedy : X;

    const w = [
      ...STALE(I),
      v(I["Rodzaj nieruchomosci"]),   // 36
      v(l["Nr lokalu"]),              // 37
      zaM2,                           // 38
      odKiedy,                        // 39
      cenaIloczyn,                    // 40
      dataIloczyn,                    // 41
      cenaSkladowe,                   // 42
      dataSkladowe,                   // 43
      X, X, X, X,                     // 44 47 czesci nieruchomosci
      X, X, X, X,                     // 48 51 pomieszczenia przynalezne
      v(I["Prawa niezbedne - opis"]), // 52
      kwota(I["Prawa niezbedne - wartosc (zl)"]),
      I["Prawa niezbedne - opis"] ? dataStart : X,
      v(I["Inne swiadczenia - opis"]),
      kwota(I["Inne swiadczenia - wartosc (zl)"]),
      I["Inne swiadczenia - opis"] ? dataStart : X,
      v(I["Adres strony z prospektem"]),
    ];

    if (w.length !== 58) throw new Error(`Zla liczba kolumn: ${w.length}`);
    linie.push(w.map(pole).join(";"));
  }

  // Garaze i miejsca postojowe sprzedawane osobno: wlasny wiersz,
  // znak umowny we wszystkich kolumnach dotyczacych lokalu mieszkalnego.
  for (const cz of czesci) {
    const wpis = zHistorii(cz["ID"], "Czesc nieruchomosci");
    const cena = wpis ? kwota(wpis.h["Cena (zl)"]) : kwota(cz["Cena (zl)"]);
    const odKiedy = wpis
      ? stempel(wpis.h["Obowiazuje od"])
      : stempel(cz["Obowiazuje od"]);

    const w = [
      ...STALE(I),
      X,                       // 36 rodzaj nieruchomosci
      X,                       // 37 nr lokalu
      X, X,                    // 38 39 cena za m2
      X, X,                    // 40 41 cena lokalu
      X, X,                    // 42 43 cena ze skladowymi
      v(cz["Rodzaj"]),         // 44 rodzaj czesci nieruchomosci
      v(cz["Oznaczenie"]),     // 45 oznaczenie
      cena,                    // 46 cena
      odKiedy,                 // 47 data
      X, X, X, X,              // 48 51 pomieszczenia przynalezne
      v(I["Prawa niezbedne - opis"]),
      kwota(I["Prawa niezbedne - wartosc (zl)"]),
      I["Prawa niezbedne - opis"] ? dataStart : X,
      v(I["Inne swiadczenia - opis"]),
      kwota(I["Inne swiadczenia - wartosc (zl)"]),
      I["Inne swiadczenia - opis"] ? dataStart : X,
      v(I["Adres strony z prospektem"]),
    ];

    if (w.length !== 58) throw new Error(`Zla liczba kolumn: ${w.length}`);
    linie.push(w.map(pole).join(";"));
  }

  return "\uFEFF" + linie.join("\r\n") + "\r\n";
}

// ---------------------------------------------------------------- budowa XML

async function zbudujXML(): Promise<string> {
  const invRows = await pobierz(SHEETS.inwestycja);
  const I: Record<string, string> = {};
  invRows.slice(1).forEach((r) => { if (r[0]?.trim()) I[r[0].trim()] = (r[1] ?? "").trim(); });

  const nazwa = I["Nazwa dewelopera"];
  const ident = I["extIdent zbioru"];
  const start = new Date(`${I["Data rozpoczecia sprzedazy"]}T00:00:00Z`);
  const dzis = new Date(`${dzisWarszawa()}T00:00:00Z`);

  const dni: string[] = [];
  for (const d = new Date(start); d <= dzis; d.setUTCDate(d.getUTCDate() + 1)) {
    dni.push(d.toISOString().slice(0, 10));
  }
  if (dni.length === 0) dni.push(dzisWarszawa());

  const opisPL = `Zbiór danych zawiera informacje o cenach ofertowych mieszkań dewelopera ${nazwa} udostępniane zgodnie z art. 19b. ust. 1 Ustawy z dnia 20 maja 2021 r. o ochronie praw nabywcy lokalu mieszkalnego lub domu jednorodzinnego oraz Deweloperskim Funduszu Gwarancyjnym (Dz. U. z 2024 r. poz. 695).`;
  const opisEN = `The dataset contains information on offer prices of apartments of the developer ${nazwa} made available in accordance with art. 19b. ust. 1 Ustawy z dnia 20 maja 2021 r. o ochronie praw nabywcy lokalu mieszkalnego lub domu jednorodzinnego oraz Deweloperskim Funduszu Gwarancyjnym (Dz. U. z 2024 r. poz. 695).`;

  const zasoby = dni.map((d) => `\t\t\t<resource status="published">
\t\t\t\t<extIdent>${esc(ident)}-${d.replace(/-/g, "")}</extIdent>
\t\t\t\t<url>${esc(`${BAZA_URL}/${PREFIX_CSV}${d}.csv`)}</url>
\t\t\t\t<title>
\t\t\t\t\t<polish>Ceny ofertowe mieszkań dewelopera ${esc(nazwa)} ${d}</polish>
\t\t\t\t\t<english>Offer prices for developer's apartments ${esc(nazwa)} ${d}</english>
\t\t\t\t</title>
\t\t\t\t<description>
\t\t\t\t\t<polish>Dane dotyczące cen ofertowych mieszkań dewelopera ${esc(nazwa)} udostępnione ${d} zgodnie z art. 19b. ust. 1 Ustawy z dnia 20 maja 2021 r. o ochronie praw nabywcy lokalu mieszkalnego lub domu jednorodzinnego oraz Deweloperskim Funduszu Gwarancyjnym (Dz. U. z 2024 r. poz. 695).</polish>
\t\t\t\t\t<english>Data on offer prices of apartments of the developer ${esc(nazwa)} made available ${d} in accordance with art. 19b. ust. 1 Ustawy z dnia 20 maja 2021 r. o ochronie praw nabywcy lokalu mieszkalnego lub domu jednorodzinnego oraz Deweloperskim Funduszu Gwarancyjnym (Dz. U. z 2024 r. poz. 695).</english>
\t\t\t\t</description>
\t\t\t\t<availability>local</availability>
\t\t\t\t<dataDate>${d}</dataDate>
\t\t\t\t<specialSigns>
\t\t\t\t\t<specialSign>X</specialSign>
\t\t\t\t</specialSigns>
\t\t\t\t<hasDynamicData>false</hasDynamicData>
\t\t\t\t<hasHighValueData>true</hasHighValueData>
\t\t\t\t<hasHighValueDataFromEuropeanCommissionList>false</hasHighValueDataFromEuropeanCommissionList>
\t\t\t\t<hasResearchData>false</hasResearchData>
\t\t\t\t<containsProtectedData>false</containsProtectedData>
\t\t\t</resource>`).join("\n");

  return `<?xml version='1.0' encoding='UTF-8'?>
<ns2:datasets xmlns:ns2="urn:otwarte-dane:harvester:1.13" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
\t<dataset status="published">
\t\t<extIdent>${esc(ident)}</extIdent>
\t\t<title>
\t\t\t<polish>Ceny ofertowe mieszkań dewelopera ${esc(nazwa)} w ${start.getFullYear()} r.</polish>
\t\t\t<english>Offer prices of apartments of developer ${esc(nazwa)} in ${start.getFullYear()}.</english>
\t\t</title>
\t\t<description>
\t\t\t<polish>${esc(opisPL)}</polish>
\t\t\t<english>${esc(opisEN)}</english>
\t\t</description>
\t\t<updateFrequency>daily</updateFrequency>
\t\t<hasDynamicData>false</hasDynamicData>
\t\t<hasHighValueData>true</hasHighValueData>
\t\t<hasHighValueDataFromEuropeanCommissionList>false</hasHighValueDataFromEuropeanCommissionList>
\t\t<hasResearchData>false</hasResearchData>
\t\t<categories>
\t\t\t<category>ECON</category>
\t\t</categories>
\t\t<resources>
${zasoby}
\t\t</resources>
\t\t<tags>
\t\t\t<tag lang="pl">Deweloper</tag>
\t\t</tags>
\t</dataset>
</ns2:datasets>
`;
}

// ---------------------------------------------------------------- routing

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ plik: string }> }
) {
  const { plik } = await params;

  try {
    if (plik === PLIK_XML) {
      return new Response(await zbudujXML(), {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
        },
      });
    }

    // Staly adres bez daty = cennik na dzis (czas polski).
    if (plik === `${PREFIX_CSV.replace(/-$/, "")}.csv`) {
      return new Response(await zbudujCSV(dzisWarszawa()), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
        },
      });
    }

    const m = plik.match(new RegExp(`^${PREFIX_CSV}(\\d{4}-\\d{2}-\\d{2})\\.csv$`));
    if (m) {
      return new Response(await zbudujCSV(m[1]), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
        },
      });
    }

    return new Response("Nie znaleziono", { status: 404 });
  } catch (e) {
    return new Response(`Blad generowania: ${(e as Error).message}`, { status: 500 });
  }
}
