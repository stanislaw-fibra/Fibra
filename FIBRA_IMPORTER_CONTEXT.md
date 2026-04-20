# FIBRA — Importer XML z Galactiki → Supabase

## Czym jest ten dokument

Instrukcja dla Cursora do zbudowania importera ofert z systemu Galactica Virgo. Importer pobiera pliki ZIP z serwera FTP, parsuje XML w formacie oferty.net, czyści dane (szczególnie opisy) i zapisuje do Supabase.

**KRYTYCZNE WYMAGANIE:** Opisy ofert z Galactiki przychodzą z rozjechanym formatowaniem (HTML entities, puste linie, śmieci, boilerplate). To jest NAJWAŻNIEJSZY problem do rozwiązania — klient wprost powiedział, że taki sam bałagan mają na Otodomie i na nowej stronie tego nie chce. Importer MUSI czyścić opisy do stanu premium.

---

## 1. Architektura

```
FTP (s47.zenbox.pl)
  └── / (katalog główny)
       └── oferty_2026-04-20_11-34.zip
            ├── oferty.xml
            └── [zdjęcia .jpg]

Importer (API route w Next.js):
  1. Łączy się z FTP
  2. Pobiera najnowszy ZIP (po dacie w nazwie)
  3. Rozpakowuje ZIP
  4. Parsuje oferty.xml
  5. Dla każdej oferty:
     a. Czyści opis
     b. Mapuje pola na kolumny w Supabase
     c. Upsert do tabeli offers
     d. Upsert agenta do tabeli agents
     e. Upload zdjęć do Supabase Storage → wpisy w offer_images
  6. Obsługuje <oferta_usun> → is_active = false
  7. Loguje przebieg w import_runs
```

### Pliki do stworzenia

```
src/lib/importer/
  ├── ftp-client.ts        — połączenie FTP, pobranie najnowszego ZIP
  ├── xml-parser.ts        — parsowanie XML, ekstrakcja ofert
  ├── description-cleaner.ts — czyszczenie opisów (KRYTYCZNE)
  ├── field-mapper.ts      — mapowanie pól XML → Supabase
  ├── image-uploader.ts    — upload zdjęć do Supabase Storage
  ├── agent-sync.ts        — upsert agentów
  ├── offer-sync.ts        — upsert ofert
  └── run-import.ts        — orkiestracja całego procesu

src/app/api/import/route.ts  — API route do triggerowania importu
```

### Env potrzebne

```env
FTP_HOST=s47.zenbox.pl
FTP_USER=galactica@grupafibra.pl
FTP_PASS=<hasło>
FTP_PORT=21
FTP_SECURE=true  # TLS (widać w logach FileZilli: "Inicjowanie TLS")
FTP_REMOTE_DIR=/
```

---

## 2. Struktura XML

### Header

```xml
<plik>
  <header>
    <informacje>Oferty wyeksportowane z programu Galactica Virgo</informacje>
    <agencja>galactica@grupafibra.pl</agencja>
    <data>2026-04-20 11:34:16</data>
    <wersja>0.4</wersja>
    <cel>oferty.net</cel>
    <zawartosc_pliku>roznica</zawartosc_pliku>  <!-- "roznica" = przyrostowy, "calosc" = pełny -->
  </header>
```

`zawartosc_pliku` mówi czy to eksport pełny czy różnicowy. Przy "calosc" — oferty nieobecne w XML-u powinny być dezaktywowane. Przy "roznica" — tylko przetwarzaj to co jest w pliku.

### Sekcje (działy)

```xml
<lista_ofert>
  <dzial tab="mieszkania" typ="sprzedaz">
    <oferta>...</oferta>
    <oferta>...</oferta>
  </dzial>
  <dzial tab="domy" typ="wynajem">
    <oferta>...</oferta>
  </dzial>
  <!-- itd. -->
</lista_ofert>
```

Dostępne wartości `tab`: `mieszkania`, `domy`, `dzialki`, `lokale`, `obiekty`, `pokoje`
Dostępne wartości `typ`: `sprzedaz`, `wynajem`

### Oferta

```xml
<oferta>
  <id>FIB-MS-4089</id>
  <cena waluta="PLN">474500</cena>
  <param nazwa="powierzchnia" typ="real">65,9000</param>
  <param nazwa="opis" typ="text">...</param>
  <!-- ... kolejne param -->
  <location>
    <area level="1">Polska</area>
    <area level="2">ŚLĄSKIE</area>
    <area level="3">wodzisławski</area>
    <area level="4">Wodzisław Śląski</area>
    <area level="5">Centrum</area>  <!-- opcjonalne, dzielnica -->
  </location>
</oferta>
```

### Usuwanie ofert (eksport różnicowy)

```xml
<oferta_usun>
  <id>FIB-MS-1234</id>
</oferta_usun>
```

---

## 3. Mapowanie pól XML → Supabase

### Pola z atrybutów oferty i działu

| XML | Supabase kolumna | Uwagi |
|-----|-----------------|-------|
| `<id>` | `galactica_offer_id` | np. "FIB-MS-4089" |
| `dzial[@tab]` | `category` | mapowanie: mieszkania→mieszkania, domy→domy, dzialki→dzialki, lokale→lokale, obiekty→obiekty, pokoje→traktuj jako mieszkania |
| `dzial[@typ]` | `listing_type` | sprzedaz / wynajem |
| `<cena waluta="PLN">` | `price` + `currency` | waluta z atrybutu |

### Pola z `<param>`

| XML param nazwa | Supabase kolumna | Typ / konwersja |
|----------------|-----------------|-----------------|
| `advertisement_text` | `advertisement_text` + `title` | Użyj jako title jeśli title puste |
| `opis` | `description` | **WYMAGANE CZYSZCZENIE** — patrz sekcja 4 |
| `powierzchnia` | `area_total` | Zamień przecinek na kropkę, parseFloat |
| `available_area` | `area_usable` | j.w. |
| `powierzchniadzialki` | `area_plot` | j.w. |
| `liczbapokoi` | `rooms` | parseInt |
| `liczba_sypialni` | `bedrooms` | parseInt |
| `liczbalazienek` | `bathrooms` | parseInt |
| `pietro` | `floor` | parseInt |
| `liczbapieter` | `floors_total` | parseInt |
| `rokbudowy` | `year_built` | parseInt |
| `wojewodztwo` | `province` | tekst |
| `miasto` | `city` | tekst |
| `dzielnica` | `district` | tekst |
| `ulica` | `street` | tekst |
| `n_geo_y` | `lat` | parseFloat (UWAGA: y = latitude) |
| `n_geo_x` | `lng` | parseFloat (UWAGA: x = longitude) |
| `rynek_pierwotny` | `is_primary_market` | "1" → true, "0" → false |
| `wylacznosc` | `is_exclusive` | j.w. |
| `bezprowizji` | `is_without_commission` | j.w. |
| `balkon` | `has_balcony` | j.w. |
| `taras` | `has_terrace` | j.w. |
| `piwnica` | `has_basement` | j.w. |
| `winda` | `has_elevator` | j.w. |
| `klimatyzacja` | `has_air_conditioning` | j.w. (może być tekst "tak"/"nie" lub bool) |
| `materialbudowy` | `building_material` | tekst |
| `stanbudynku` | `building_state` | tekst |
| `stannieruchomosci` | `property_state` | tekst |
| `ogrzewanie` | `heating` | tekst |
| `typkuchni` | `kitchen_type` | tekst |
| `miejscaparkingowe` | `parking_spaces` | Spróbuj wyciągnąć liczbę z tekstu, jeśli się nie da → zapisz w raw_params |
| `wirtualnawizyta` | `virtual_tour_url` | tekst (URL) |
| `dataaktualizacji` | `source_updated_at` | parse date |
| `agent_nazwisko` | `agent_name` | tekst |
| `agent_email` | `agent_email` | tekst |
| `agent_tel_biuro` | `agent_phone_office` | tekst |
| `agent_tel_kom` | `agent_phone_mobile` | tekst |

### Pola do `raw_params` (jsonb) — złap wszystko czego nie mapujesz

Wszystkie pola, które nie mają dedykowanej kolumny, zapisuj do `raw_params`. Ważniejsze z nich:

- `forma_wlasnosci` — forma własności
- `cenazametr` — cena za m² (uwaga: nazwa ma spację na końcu w XML!)
- `kaucja` — kaucja przy wynajmie
- `dodatkowe_koszty` — dodatkowe koszty
- `powierzchnia_balkonu` — pow. balkonu
- `powierzchnia_lazienki` — pow. łazienki
- `dwupoziomowe` — czy dwupoziomowe
- `liczba_poziomow`
- `wysokoscpomieszczen` — wysokość pomieszczeń
- `typbudynkumieszk` — typ budynku
- `typzabudowy` — typ zabudowy (domy)
- `typdzialki` — typ działki
- `typlokalu` — typ lokalu
- `szerokoscdzialki`
- `drogadojazdowa`
- `ogrodzenie`
- `uzbrojenie`
- `gaz`, `kanalizacja`, `prad`
- `osiedlezamkniete`
- `zwalnianeod`
- `stolarka_okienna`
- `typdachu`
- `energy_*` — pola energetyczne
- `wideo` — link YouTube (zachowaj, ale to NIE jest nasze Cloudflare Stream video)
- `biuro` — bool, może oznaczać który oddział

### Zdjęcia

Parametry `zdjecie1` do `zdjecie50` zawierają nazwy plików JPG. Pliki są w ZIP-ie obok XML-a.

Nazwy plików mają format: `galactica@grupafibra.pl_ms_FIB-MS-4089_1.jpg`

Dla każdego zdjęcia:
1. Upload pliku do Supabase Storage: `offer-images/{galactica_offer_id}/{order_index}_{filename}`
2. Wstaw wpis do `offer_images`: offer_id, galactica_offer_id, source_filename, image_url, order_index, is_primary (true dla zdjecie1)

### Agenci

Z każdej oferty wyciągnij agenta (agent_nazwisko, agent_email, agent_tel_biuro, agent_tel_kom) i:
1. Sprawdź czy istnieje w tabeli `agents` po `email`
2. Jeśli nie — utwórz
3. Jeśli tak — zaktualizuj telefony (mogły się zmienić)
4. Zapisz `agent_id` w ofercie (FK)
5. Dodatkowo zachowaj denormalizowane pola agent_name, agent_email, agent_phone_* w ofercie (dla szybkości)

---

## 4. Czyszczenie opisów — KRYTYCZNE

### Problem

Opisy z Galactiki przychodzą w stanie:

```
\n\nOferta na wyłączność dostępna tylko w naszym biurze! Nie musisz szukać dalej!\n\n \n        \n\n              \n\n      \n\n   Na sprzedaż  apartament premium o powierzchni 65,9 m&sup2; ...
```

Problemy:
- HTML entities: `&oacute;` → ó, `&sup2;` → ², `&amp;` → &, `&nbsp;` → spacja
- Wielokrotne puste linie (czasem 5-6 z rzędu)
- Spacje na początku/końcu linii
- Wielokrotne spacje w tekście
- Boilerplate na początku i końcu (patrz niżej)
- HTML tagi w tekście (mogą się pojawić `<br>`, `<b>`, `<ul>`, `<li>` itp.)

### Boilerplate do usunięcia

Te wzorce pojawiają się w prawie KAŻDEJ ofercie i MUSZĄ być usunięte:

**Na końcu (100% ofert):**
```
Oferta wysłana z systemu BCK Galactica
```

**Na początku (97% ofert):**
```
Oferta na wyłączność dostępna tylko w naszym biurze! Nie musisz szukać dalej!
```

**Na początku (32% ofert):**
```
Prowizja 0% - wynagrodzenie naszej firmy pokrywa w całości właściciel nieruchomości
```

**Na końcu (częste):**
```
Nasza firma szybko i skutecznie przeprowadza formalną stronę transakcji kupna/sprzedaży nieruchomości - od umowy przedwstępnej po umówioną przez nas wizytę u notariusza. Potrafimy również zorganizować finansowanie jej zakupu, jeżeli nie dysponujesz odpowiednią gotówką. Wybieramy dla Ciebie najkorzystniejszą ofertę kredytową z propozycji najlepszych banków. Krok po kroku, bez dodatkowych kosztów, pomagamy w przebrnięciu przez wymagane formalności i uzyskaniu kredytu.
```

**Na końcu (częste) — link do spaceru i strony oferty:**
```
Adres www oferty
www.osiedlebatory.pl

Zobacz Wirtualny Spacer: https://...
```
(Link do wirtualnego spaceru jest już wyciągnięty do osobnego pola `virtual_tour_url`, nie musi być w opisie)

### Algorytm czyszczenia: `cleanDescription(raw: string): string`

```
1. Dekoduj HTML entities:
   - &amp;oacute; → ó  (uwaga: mogą być podwójnie encodowane: &amp;oacute; zamiast &oacute;)
   - &amp;sup2; → ²
   - &amp;nbsp; → spacja
   - &amp;amp; → &
   - &lt; → <, &gt; → >
   - &amp;quot; → "
   - Użyj biblioteki (np. he lub html-entities) do pełnego dekodowania

2. Usuń HTML tagi:
   - <br>, <br/>, <br /> → zamień na \n
   - <p>...</p> → zachowaj tekst + \n
   - <li>...</li> → zachowaj tekst z "• " na początku + \n
   - <ul>, </ul>, <ol>, </ol> → usuń
   - <b>, </b>, <strong>, </strong> → usuń (tekst zachowaj)
   - <i>, </i>, <em>, </em> → usuń
   - Wszystkie inne tagi → usuń

3. Usuń boilerplate (case-insensitive, trim whitespace):
   - Linie zawierające "Oferta wysłana z systemu" → usuń
   - Linie zawierające "Nie musisz szukać dalej" → usuń linię I poprzedzającą (jeśli to "Oferta na wyłączność...")
   - Blok zaczynający się od "Nasza firma szybko i skutecznie" do "uzyskaniu kredytu" → usuń
   - Linie zaczynające się od "Adres www oferty" → usuń tę linię i następną (URL)
   - Linie zaczynające się od "Zobacz Wirtualny Spacer" → usuń (mamy to w virtual_tour_url)
   - Linie zawierające "Prowizja 0%" na początku opisu → usuń
   - Linie zaczynające się od "Zadzwoń i dowiedz się więcej" → usuń

4. Wyczyść whitespace:
   - Trim każdej linii (usuń spacje na początku i końcu)
   - Zamień wielokrotne spacje na pojedynczą
   - Zamień 3+ pustych linii z rzędu na max 1 pustą linię
   - Trim całego tekstu na początku i końcu

5. Finalne sprawdzenie:
   - Jeśli opis po czyszczeniu jest pusty lub krótszy niż 20 znaków → ustaw null
```

### WAŻNE — nie zmieniaj treści

Czyszczenie dotyczy TYLKO formatowania i boilerplate'u. NIE zmieniaj słów, nie poprawiaj gramatyki, nie skracaj tekstu. Agent napisał opis — my go tylko czyścimy z technicznego bałaganu.

---

## 5. Logika importu

### Upsert ofert

```
Dla każdej <oferta> w XML:
  1. Wyciągnij galactica_offer_id z <id>
  2. Wyciągnij category z dzial[@tab] i listing_type z dzial[@typ]
  3. Zmapuj wszystkie <param> na pola Supabase
  4. Wyczyść opis
  5. Wyciągnij agenta → upsert do agents → weź agent_id
  6. UPSERT do offers ON CONFLICT (galactica_offer_id):
     - Ustaw is_active = true
     - Zaktualizuj wszystkie pola
     - ALE: NIE nadpisuj ofert z galactica_offer_id zaczynającym się od "MANUAL-"
  7. Obsłuż zdjęcia (patrz niżej)
```

### Obsługa zdjęć

```
Dla każdej oferty:
  1. Wyciągnij parametry zdjecie1..zdjecie50
  2. Porównaj z istniejącymi wpisami w offer_images dla tej oferty
  3. Nowe zdjęcia → upload do Storage + insert do offer_images
  4. Usunięte zdjęcia (były w DB, nie ma w XML) → usuń z Storage + delete z offer_images
  5. zdjecie1 → is_primary = true, reszta false
  6. Order index = numer z nazwy parametru (zdjecie1 → 1, zdjecie2 → 2)
```

### Obsługa usunięć

```
Dla każdej <oferta_usun> w XML:
  1. Wyciągnij id
  2. UPDATE offers SET is_active = false WHERE galactica_offer_id = id
  NIE kasuj fizycznie — soft delete
```

### Eksport pełny vs różnicowy

```
Sprawdź <zawartosc_pliku> w headerze:
- "roznica" → przetwórz tylko oferty z pliku (upsert + usunięcia)
- "calosc" → po przetworzeniu:
    UPDATE offers SET is_active = false
    WHERE galactica_offer_id NOT LIKE 'MANUAL-%'
    AND galactica_offer_id NOT IN (lista ID z pliku)
    AND is_active = true
  (dezaktywuj oferty, których nie ma w pełnym eksporcie, ale NIE ruszaj ręcznych)
```

### Import run logging

```
Na początku importu:
  INSERT INTO import_runs (status, source_filename, import_type)
  VALUES ('running', 'oferty_2026-04-20_11-34.zip', 'diff')

W trakcie — aktualizuj countery:
  offers_created, offers_updated, offers_deleted, images_imported, errors_count

Na końcu:
  UPDATE import_runs SET status = 'success', finished_at = now(), log = '...'
```

---

## 6. API route

### `POST /api/import`

Triggeruje import. Chroniony — wymaga SUPABASE_SERVICE_ROLE_KEY lub IMPORT_SECRET w headerze.

```ts
// src/app/api/import/route.ts
export async function POST(req: Request) {
  // 1. Sprawdź autoryzację (secret w headerze lub zalogowany admin)
  // 2. Uruchom import
  // 3. Zwróć wynik { success, offers_created, offers_updated, ... }
}
```

### Vercel Cron

W `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/import",
      "schedule": "0 */2 * * *"
    }
  ]
}
```
(co 2 godziny — dostosujemy później)

Cron na Vercelu wysyła GET, więc dodaj też handler GET z tym samym secretem.

### Env dodatkowe

```env
IMPORT_SECRET=<losowy_string_do_autoryzacji_crona>
```

W Vercel Cron: request idzie na `/api/import` z headerem `Authorization: Bearer <IMPORT_SECRET>`.

---

## 7. Obsługa FTP

Użyj biblioteki `basic-ftp` (npm):

```ts
import { Client } from 'basic-ftp'

const client = new Client()
await client.access({
  host: process.env.FTP_HOST,
  user: process.env.FTP_USER,
  password: process.env.FTP_PASS,
  port: parseInt(process.env.FTP_PORT || '21'),
  secure: process.env.FTP_SECURE === 'true'  // FTPS (TLS)
})
```

Logika pobierania:
1. Listuj pliki w katalogu `FTP_REMOTE_DIR` (domyślnie `/`)
2. Filtruj po wzorcu `oferty_*.zip`
3. Sortuj po dacie w nazwie (najnowszy pierwszy)
4. Sprawdź w `import_runs` czy ten plik już był przetworzony (po `source_filename`)
5. Jeśli nowy — pobierz do `/tmp/`, rozpakuj, przetwórz
6. Po przetworzeniu — opcjonalnie przenieś ZIP do podkatalogu `/processed/`

**WAŻNE — Vercel timeout:** Vercel Hobby ma 60s timeout na API routes. Przy 71 ofertach i zdjęciach to może być za mało. Rozwiązania:
- Na start: testuj lokalnie (`npm run dev`), gdzie nie ma timeoutu
- Na produkcji: rozważ Vercel Pro (300s) lub background function
- Alternatywnie: podziel import na chunki (oferty bez zdjęć w jednym requeście, zdjęcia w osobnych)

---

## 8. Parsowanie wartości z XML

### Typy parametrów

```ts
function parseParamValue(value: string | null, typ: string): any {
  if (!value || value.trim() === '') return null
  
  switch (typ) {
    case 'int':
    case 'integer':
      return parseInt(value, 10) || null
    
    case 'real':
    case 'float':
      // Galactika używa przecinka jako separatora dziesiętnego
      return parseFloat(value.replace(',', '.')) || null
    
    case 'bool':
    case 'boolean':
      return value === '1' || value.toLowerCase() === 'true'
    
    case 'text':
    default:
      return value.trim()
  }
}
```

---

## 9. Dane z prawdziwego eksportu — statystyki

Pierwszy eksport (2026-04-20):
- 71 ofert (17 mieszkań sprzedaż, 6 wynajem, 13 domów sprzedaż, 2 wynajem, 25 działek, 6 lokali, 2 obiekty)
- 8 agentów
- 63 oferty z video YouTube
- 32 oferty z wirtualnym spacerem
- Do 50 zdjęć na ofertę
- Eksport różnicowy (`zawartosc_pliku = roznica`)
- 134 unikalnych parametrów (w tym zdjęcia)
- Nazwy plików zdjęć: `galactica@grupafibra.pl_{typ}_{ID}_{nr}.jpg`
  - `_ms_` = mieszkania sprzedaż
  - `_mw_` = mieszkania wynajem
  - `_ds_` = domy sprzedaż
  - `_ls_` = lokale sprzedaż
  - `_gs_` = działki sprzedaż
  - `_bs_` = obiekty sprzedaż

---

## 10. Checklist

- [ ] `basic-ftp` zainstalowany (`npm install basic-ftp`)
- [ ] `he` lub `html-entities` zainstalowane (do dekodowania HTML entities)
- [ ] `adm-zip` lub `unzipper` zainstalowane (do rozpakowywania ZIP)
- [ ] Moduł FTP client z pobieraniem najnowszego ZIP-a
- [ ] Parser XML (można użyć `fast-xml-parser` — szybki i dobry z atrybutami)
- [ ] `cleanDescription()` — z pełną logiką z sekcji 4
- [ ] Field mapper — z tabelą z sekcji 3
- [ ] Agent sync — upsert po email
- [ ] Offer sync — upsert po galactica_offer_id, z ochroną MANUAL-*
- [ ] Image sync — upload do Storage, wpisy w offer_images
- [ ] Import run logging
- [ ] API route `/api/import` z autoryzacją
- [ ] Vercel cron config
- [ ] Env variables dodane do `.env.example`
- [ ] Testowy import lokalny z prawdziwym plikiem XML
