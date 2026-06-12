# Fibra — Oferty / Galactica / VIRGO — handoff dla nowej sesji

> Cel tego dokumentu: dać świeżej sesji pełny kontekst tematu importu ofert, żeby
> pracować nad nim osobno. Opisuje: jak działa eksport z Galactiki (FTP), jakie były
> problemy, jak je obecnie rozwiązujemy, oraz docelową drogę przez **VIRGO API**
> (świeżo dostałeś produkcyjne klucze). Na końcu: pliki w repo, zmienne env, linki.

---

## 1. Skąd biorą się oferty

Oferty pochodzą z **Galactiki** (system CRM/MLS dla biur nieruchomości). Są dwa
kanały dostarczania danych:

1. **FTP eksport** (stary, obecnie zaimplementowany) — Galactica wrzuca paczki ZIP na FTP.
2. **VIRGO API** (nowy, docelowy) — SOAP/ASMX web service, z którego sami pobieramy dane.

---

## 2. FTP eksport — format

- Pliki to ZIP-y nazwane `oferty_YYYY-MM-DD_HH-MM.zip`.
- Wewnątrz ZIP-a **`oferty.xml` jest PIERWSZYM wpisem** (~90 KB), reszta to zdjęcia.
- Nagłówek XML zawiera pole `zawartosc_pliku`:
  - `calosc` — pełny eksport wszystkich ofert (**~637 MB** z obrazami).
  - `roznica` — różnicowy (tylko zmiany od ostatniego razu, KB–MB).
- Usunięcia ofert: tag `<oferta_usun>` w XML.

### Struktura XML (parser: `src/lib/importer/xml-parser.ts`)
`parseGalacticaXml(xml)` zwraca:
```
{
  header: { agencja, data, wersja, cel, zawartosc_pliku },
  offers: RawOffer[],   // id, category (dzial@tab), listing_type (dzial@typ),
                        // price, params, location
  deletes: string[]     // z <oferta_usun>
}
```
Uwaga / pułapka: niektóre nazwy parametrów mają **spację na końcu** (np. `"cenazametr "`).

### ZIP internals (do częściowego reconcile bez ładowania 637 MB do RAM)
- Local File Header sygnatura `PK\x03\x04`.
- Offsety: method@8, compSize@18, nameLen@26, extraLen@28, filename@30.
- Deflate → `zlib.inflateRawSync`.
- Flaga bit `0x08` = data descriptor (rozmiar po danych).

---

## 3. Problemy, które napotkaliśmy (i dlaczego)

1. **637 MB `calosc` → OOM / head-of-line blocking.** Pełny eksport z obrazami jest
   ogromny. Ładowanie całości do pamięci wywalało import; duża paczka blokowała kolejkę.
2. **Różnice (`roznica`) nigdy nie usuwają ofert → "stale offers".** Eksport różnicowy
   dodaje/aktualizuje, ale nie zawiera kompletu, więc oferty zdjęte z rynku zostają
   aktywne w bazie. Trzeba osobnego mechanizmu czyszczenia.
3. **Cron 401.** Vercel cron wysyła `Authorization: Bearer ${CRON_SECRET}`, a endpointy
   sprawdzały tylko `IMPORT_SECRET`; w dodatku `CRON_SECRET` nie istniał w env na Vercelu.
   **NAPRAWIONE** (patrz niżej).

---

## 4. Obecne rozwiązanie (FTP, zaimplementowane)

- **`src/lib/importer/run-import.ts`** → `runImport(opts)`:
  1. Pobierz XML + obrazy (FTP zip lub lokalny plik), `extractZip` przez AdmZip.
  2. `parseGalacticaXml`.
  3. Zaloguj do `import_runs`.
  4. Per oferta: `upsertAgent` + `upsertOffer` + `syncOfferImages`.
  5. Przetwórz `deletes`.
  6. Gdy `reconcileFullExport`: `deactivateMissingFromFullExport` z progami
     bezpieczeństwa (nie deaktywuj, jeśli eksport podejrzanie mały — ochrona przed
     wyczyszczeniem bazy przez błędny/pusty eksport).
- `listProcessedFilenames` czyta `source_filename` z ostatnich 50 udanych
  `import_runs`, żeby pomijać już przetworzone paczki.
- Reconcile dla `calosc` czyta ZIP strumieniowo/po offsetach, żeby nie ładować 637 MB.

### Auth (naprawione cron 401)
`src/lib/importer/cron-auth.ts` — `isCronOrAdminAuthorized(req)`:
- Akceptuje `Bearer` z **IMPORT_SECRET LUB CRON_SECRET**, nagłówek `x-import-secret`,
  albo zalogowanego admina panelu (`getPanelRouteUser`).
- Używają go: `src/app/api/import/route.ts`, `src/app/api/reconcile/route.ts`,
  `src/app/api/email/test/route.ts`.
- `CRON_SECRET` jest już dodany na Vercelu (potwierdzone: email-test przez tę samą
  ścieżkę auth zwraca 200).

---

## 5. Droga docelowa — VIRGO API (NOWE klucze produkcyjne)

To jest kierunek dla nowej sesji: zastąpić/uzupełnić FTP web service'em VIRGO.
Rozwiązuje problem stale offers, bo zwraca też listę usuniętych.

- **Typ:** ASP.NET ASMX SOAP.
- **Endpoint:** `https://ex.galapp.net/Moduly/Virgo/virWsOfertyAPI.asmx`
- **Namespace:** `pl.galactica.Virgo.virWsOfertyAPI`
- **Flow auth:**
  - `LoginEx(key, app)` → zwraca **Sid (sesję)**.
    - **PUŁAPKA:** `app` = host **bez protokołu** (np. `demovirgo.galapp.net`,
      NIE `https://demovirgo.galapp.net`). To częsty błąd.
  - `GetOffers(sid)` / `GetOfferList(sid)` → oferty.
  - `GetImage2(sid, id, size)` → obraz.
- **Odpowiedź `<OffersZip>`** = base64 ZIP zawierający `xml.xml`.
- **Struktura `xml.xml`:** root `<Dane>` z `<Agenci/>`, `<Oddzialy/>`, `<Oferty/>`,
  `<Usuniete/>`.
  - **`<Usuniete>` rozwiązuje problem stale offers** — mamy jawną listę usuniętych,
    czego FTP-różnice nigdy nie dawały.

### Klucze
- **Demo (już nieaktualne, baza demo była pusta — `xml.xml` miał tylko 124 znaki):**
  - key = `b9fe1604-a038-4404-afcb-2aac99bd23eb`
  - WebServiceUrl = `https://ex.galapp.net`
  - GalAppDomain = `https://demovirgo.galapp.net`
- **Produkcja:** masz świeże klucze VIRGO. **NIE wklejaj ich do czatu** — trzymaj w
  `.env.local` / menedżerze sekretów. W repo brak jeszcze zmiennych VIRGO/GAL
  (są tylko `FTP_*`). Trzeba je dodać (propozycja nazw niżej).

---

## 6. Mapowanie pól (`src/lib/importer/field-mapper.ts`)

`mapOffer(raw)` → `MappedOffer` (m.in.: category, listing_type, price, areas, rooms,
agent_*, youtube_url, image_filenames, …).
- Kategorie: `mieszkania | domy | dzialki | lokale | obiekty`.
- Typ oferty: `sprzedaz | wynajem`.

---

## 7. Pliki w repo (moduł importera: `src/lib/importer/`)

| Plik | Rola |
|---|---|
| `xml-parser.ts` | parsuje XML Galactiki → header/offers/deletes |
| `field-mapper.ts` | `mapOffer(raw)` → `MappedOffer` |
| `run-import.ts` | orkiestracja całego importu (`runImport`) |
| `offer-sync.ts` | upsert ofert do Supabase |
| `agent-sync.ts` | upsert agentów |
| `image-uploader.ts` | wgrywanie zdjęć |
| `calosc-reconcile.ts` | deaktywacja ofert nieobecnych w pełnym eksporcie (progi bezpieczeństwa) |
| `description-cleaner.ts` | czyszczenie opisów |
| `ftp-client.ts` | pobieranie paczek z FTP |
| `cron-auth.ts` | `isCronOrAdminAuthorized` (Bearer IMPORT_SECRET/CRON_SECRET lub admin) |

**Endpointy:** `src/app/api/import/route.ts`, `src/app/api/reconcile/route.ts`
(oba `runtime="nodejs"`, `maxDuration=300`).

**Publiczne odczytywanie ofert (nie importer):**
`getAllOffers()` / `getOfferBySlug()` w `src/lib/offers-query.ts` (anon + RLS);
przy błędzie lub pustej bazie fallback do `src/lib/offers.ts`.

**Dokumentacja w repo:** `FIBRA_IMPORTER_CONTEXT.md`, `FIBRA_SUPABASE_PANEL_CONTEXT.md`.

---

## 8. Supabase (tabele istotne dla ofert)

- `offers`, `offer_images`, `import_runs`, `agents`.
- (poza ofertami: `lead_submissions`, `course_access`).
- Dostęp z importera: `createSupabaseAdmin` (service role).

---

## 9. Zmienne env

**Istnieją (`.env.local`):** `FTP_*` (host/user/pass/ścieżki). Brak jeszcze VIRGO/GAL.

**Do dodania dla VIRGO (propozycja nazw — ustal w nowej sesji):**
```
VIRGO_API_KEY=...                 # produkcyjny klucz (NIE w czacie)
VIRGO_WS_URL=https://ex.galapp.net
VIRGO_APP_HOST=...galapp.net      # host BEZ protokołu do LoginEx(key, app)
```

**Importer/cron:** `IMPORT_SECRET`, `CRON_SECRET` (oba akceptowane przez auth).

---

## 10. Pierwsze kroki w nowej sesji (sugestia)

1. Zbuduj cienkiego klienta VIRGO: `LoginEx` → `GetOffers` → rozpakuj `<OffersZip>`
   (base64 → ZIP → `xml.xml`), pamiętając o `app` bez protokołu.
2. Sprawdź na produkcyjnym kluczu, czy `<Oferty>` i `<Usuniete>` się wypełniają
   (demo było puste — to był brak danych, nie błąd kodu).
3. Zmapuj `<Dane>` na istniejący `MappedOffer` (możliwe drobne różnice nazw pól vs FTP-XML).
4. Wykorzystaj `<Usuniete>` do deaktywacji — to czystsze niż próg bezpieczeństwa z `calosc`.
5. Obrazy: `GetImage2(sid,id,size)` zamiast wyciągania z 637 MB ZIP-a → koniec problemu OOM.

---

## 11. Stan repo / deploy (na moment pisania)

- 5 commitów na lokalnym `main` czeka na push (push robisz sam — gh zalogowany jako
  `droziu`, repo `stanislaw-fibra/Fibra`, stąd 403):
  - `d983f6b` importer reconcile
  - `5b8167b` UX
  - `b1358a4` cron fix
  - `efa80a0` email integration
  - `a68be91` grupafibra.pl + wyłączenie newslettera z Resend
