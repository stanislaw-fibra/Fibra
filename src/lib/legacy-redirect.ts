/**
 * Przekierowania ze starego serwisu fibranieruchomosci.pl na fibra.pl.
 *
 * Stara strona (CodeIgniter od Galactiki) ma własne adresy SEO, które siedzą
 * w Google, w mailach i w linkach wysyłanych klientom. Po przestawieniu DNS-a
 * tej domeny na Vercela cały jej ruch wchodzi do tej aplikacji i trafia tutaj -
 * zamiast na 404 wysyłamy odwiedzającego na odpowiednik na fibra.pl.
 *
 * Adresy ofert kończą się numerem wewnętrznym Galactiki, np.
 * `/domy-na-sprzedaz-695000zl-132m2-rybnik-o951179`. Ten sam numer trzymamy
 * w `offers.raw_params.ID` (atrybut `ID` z VIRGO), więc oferta przechodzi
 * dokładnie na swoją podstronę - patrz `resolveLegacyOfferSlug`. Kluczem jest
 * TYLKO numer na końcu; część opisowa zmieniała się razem z ceną i metrażem,
 * więc jej nie dotykamy.
 */

/**
 * Domeny starego serwisu obsługiwane przez tę aplikację. `m.` to dawna wersja
 * mobilna (te same adresy co wersja główna) - dziś przekierowuje w pustkę
 * na serwer Galactiki, więc łapiemy ją razem z resztą.
 */
export const LEGACY_HOSTS = new Set([
  "fibranieruchomosci.pl",
  "www.fibranieruchomosci.pl",
  "m.fibranieruchomosci.pl",
]);

/**
 * Stara strona Zamysłowa - osobny serwis Galactiki („Deweloper Prestige") na
 * subdomenie, pod którą podpięta jest też domena osiedlezamyslow.pl (dziś
 * przekierowuje tam 301-ką z hostingu) i grupafibra.pl.
 *
 * Cały ten ruch idzie na `/zamyslow`, a podstrony, które mają u nas swój
 * odpowiednik (galeria, prospekt, przewodnik, kontakt), na ten odpowiednik.
 */
export const LEGACY_ZAMYSLOW_HOSTS = new Set([
  "zamyslow.fibranieruchomosci.pl",
  "www.zamyslow.fibranieruchomosci.pl",
  // Gotowe na wypadek przestawienia DNS-u także tych domen - bez tego kroku
  // te wpisy po prostu nic nie robią.
  "osiedlezamyslow.pl",
  "www.osiedlezamyslow.pl",
]);

/** Parametry warte przeniesienia na nowy adres - atrybucja reklam i leadów. */
const KEEP_PARAMS = ["gclid", "fbclid", "msclkid"];

/** Oferta: `...-o1149660` na końcu ścieżki. Numer = `raw_params.ID` z VIRGO. */
const LEGACY_OFFER_RE = /-o(\d+)\/?$/;

/** Prefiks adresu oferty: `mieszkania-na-wynajem-...`, `dzialki-na-sprzedaz-...`. */
const LEGACY_OFFER_PREFIX_RE = /^\/([a-z]+)-na-(sprzedaz|wynajem)-/;

/** Kategorie starego serwisu -> wartości filtra `category` w katalogu. */
const CATEGORY_MAP: Record<string, string> = {
  mieszkania: "mieszkania",
  domy: "domy",
  dzialki: "dzialki",
  lokale: "lokale",
  obiekty: "obiekty",
  // Stary serwis miał osobną kategorię „hale"; u nas to obiekty komercyjne.
  hale: "obiekty",
};

/**
 * Stare listy filtrowane po agencie (`/oferty/sf/ag-1253`) -> strona agenta.
 *
 * Numery to wewnętrzne ID agentów w Galactice. Przypisanie wyszło z porównania
 * ofert z tych list z agentem przy ofercie w naszej bazie. Dwóch agentów ze
 * starej strony (ag-4300 Piotr Polok, ag-4747 Marta Gapińska) nie ma już
 * aktywnej strony na fibra.pl, więc ich listy idą do katalogu.
 */
const AGENT_MAP: Record<string, string> = {
  "ag-1253": "/agent/karina",
  "ag-1377": "/agent/justyna",
  "ag-2154": "/agent/beata",
  "ag-3015": "/agent/arek",
  "ag-3114": "/agent/dariusz",
  "ag-3542": "/agent/barbara",
};

/**
 * Pojedyncze strony starego serwisu. Treść siedziała w `/artykul,<nr>`, więc
 * adresy same z siebie nic nie mówią - numery rozpoznane po nagłówkach stron.
 * Bloki techniczne (stopki, banery zgłoszeń) wpadły do sitemapy przez pomyłkę
 * i idą na stronę główną razem z resztą.
 */
const PAGE_MAP: Record<string, string> = {
  "/artykul,41": "/", // „Szukam nieruchomości" - katalog
  "/artykul,43": "/sprzedaj-z-fibra", // „Chcę sprzedać/wynająć nieruchomość"
  "/artykul,47": "/polityka-prywatnosci", // „Nota prawna"
  "/artykul,67": "/kontakt", // „Kontakt | Nasz zespół"
  "/artykul,83": "/o-fibrze", // „Firma"
  "/artykul,87": "/kontakt", // „Kredyty Hipoteczne" - nie mamy odpowiednika
  "/artykul,92": "/sprzedaj-z-fibra", // „Sprzedaj nieruchomość | Nasz zespół"
  "/notatnik": "/", // schowek na oferty
  "/oferty": "/",
  "/oferty/sprzedaz": "/?listing=sprzedaz",
  "/oferty/wynajem": "/?listing=wynajem",
  "/oferty/sf/org-1": "/",
  "/en": "/", // stara wersja angielska - nie mamy jej na fibra.pl
};

/** Ścieżka bez końcowego ukośnika, zawsze z wiodącym. */
function normalizePath(pathname: string): string {
  const p = pathname.replace(/\/+$/, "");
  return p === "" ? "/" : p;
}

/** Numer oferty w Galactice ze starego adresu, jeśli to adres oferty. */
export function legacyOfferId(pathname: string): string | null {
  return normalizePath(pathname).match(LEGACY_OFFER_RE)?.[1] ?? null;
}

/**
 * Katalog zawężony do tego, co dało się wyczytać ze starego adresu.
 *
 * Używamy tego, gdy oferty nie ma już w bazie (sprzedana, zdjęta) albo gdy
 * przyszła jeszcze starym importem FTP i nie ma numeru VIRGO. Zamiast gołej
 * strony głównej odwiedzający dostaje listę tej samej kategorii i transakcji.
 */
function catalogFromLegacyPath(pathname: string): string {
  const m = normalizePath(pathname).match(LEGACY_OFFER_PREFIX_RE);
  if (!m) return "/";
  const category = CATEGORY_MAP[m[1]];
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  params.set("listing", m[2]);
  return `/?${params.toString()}`;
}

/**
 * Docelowa ścieżka na fibra.pl dla starego adresu - wszystko poza ofertami,
 * bo te wymagają zapytania do bazy (`resolveLegacyOfferSlug`).
 *
 * `null` = to adres oferty, obsłuż go najpierw przez bazę.
 */
export function legacyTarget(pathname: string): string | null {
  const path = normalizePath(pathname);

  if (legacyOfferId(path)) return null;

  const mapped = PAGE_MAP[path];
  if (mapped) return mapped;

  // `/oferty/<kategoria>/<sprzedaz|wynajem>` - listy z menu starej strony.
  const list = path.match(/^\/oferty\/([a-z]+)\/(sprzedaz|wynajem)$/);
  if (list) {
    const category = CATEGORY_MAP[list[1]];
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    params.set("listing", list[2]);
    return `/?${params.toString()}`;
  }

  // `/oferty/sf/ag-<id>` - lista ofert jednego agenta.
  const agent = path.match(/^\/oferty\/sf\/(ag-\d+)$/);
  if (agent) return AGENT_MAP[agent[1]] ?? "/";

  // Wszystko inne (w tym stare 404) - strona główna z katalogiem.
  return "/";
}

/**
 * Podstrony starej strony Zamysłowa -> odpowiedniki na fibra.pl.
 *
 * Nazwy pokrywają się prawie jeden do jednego, bo obie strony opisują tę samą
 * inwestycję. `/oferty` i strony etapów idą na `/zamyslow`, a nie na eksplorator
 * `/osiedle-zamyslow`, żeby stary ruch nie mieszał się w porównaniu dwóch wersji.
 */
const ZAMYSLOW_PAGE_MAP: Record<string, string> = {
  "/": "/zamyslow",
  "/oferty": "/zamyslow",
  "/galeria": "/galeria-inwestycji",
  "/kontakt": "/kontakt",
  "/o-firmie": "/o-fibrze",
  "/prospekt-informacyjny": "/prospekt-informacyjny",
  "/przewodnik-inwestora": "/przewodnik-inwestora",
  "/zarzadzanie-najmem": "/zarzadzanie-najmem",
};

/** Docelowa ścieżka na fibra.pl dla starej strony Zamysłowa. */
export function legacyZamyslowTarget(pathname: string): string {
  const path = normalizePath(pathname);

  const mapped = ZAMYSLOW_PAGE_MAP[path];
  if (mapped) return mapped;

  // Strony etapów: `/oferty/inwestycja/osiedle-zamyslow-etap-ii,523`.
  if (path.startsWith("/oferty/inwestycja/")) return "/zamyslow";

  // Dziennik budowy (`/dziennik-budowy/523`) - u nas to galeria z postępu prac.
  if (path.startsWith("/dziennik-budowy")) return "/galeria-inwestycji";

  return "/zamyslow";
}

/** Fallback dla oferty, której nie udało się odnaleźć w bazie. */
export function legacyOfferFallback(pathname: string): string {
  return catalogFromLegacyPath(pathname);
}

/**
 * Numer Galactiki -> slug oferty na fibra.pl.
 *
 * Pytamy REST-em Supabase kluczem anon (publiczne oferty są pod RLS-em
 * czytelne dla anona, tak samo jak w katalogu). Zapytanie idzie tylko dla
 * ruchu ze starej domeny, czyli dla pojedynczych wejść z Google i z linków.
 */
export async function resolveLegacyOfferSlug(offerId: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const endpoint =
    `${url.replace(/\/+$/, "")}/rest/v1/offers` +
    `?raw_params->>ID=eq.${encodeURIComponent(offerId)}&select=slug&limit=1`;

  try {
    const res = await fetch(endpoint, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      // Przekierowanie nie może wisieć na bazie - przy problemie lecimy w fallback.
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    const rows: unknown = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const slug = (rows[0] as { slug?: unknown }).slug;
    return typeof slug === "string" && slug.trim() ? slug.trim() : null;
  } catch {
    return null;
  }
}

/** Parametry atrybucji ze starego adresu, doklejane do nowego. */
export function carryOverParams(from: URLSearchParams, to: URL): void {
  for (const [key, value] of from.entries()) {
    if (key.startsWith("utm_") || KEEP_PARAMS.includes(key)) {
      to.searchParams.set(key, value);
    }
  }
}
