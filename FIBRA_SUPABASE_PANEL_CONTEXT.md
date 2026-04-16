# FIBRA NIERUCHOMOŚCI — kontekst Supabase + Panel admina

## Czym jest ten dokument

Ten dokument zawiera pełny kontekst techniczny projektu:
- co zostało postawione w Supabase (schemat, tabele, RLS, storage)
- jak ma wyglądać panel admina (`/panel`)
- jak działa przepływ danych (Galactica → XML → Supabase → frontend)
- jak działa video workflow z Cloudflare Stream
- jakie są wymagania UX panelu

Traktuj ten dokument jako źródło prawdy o backendzie i panelu.

---

## 1. Architektura projektu

```
┌─────────────┐     XML/ZIP      ┌─────────────┐
│  Galactica  │ ──── FTP ──────▶ │  Importer   │
│   (CRM)     │                  │  (skrypt)   │
└─────────────┘                  └──────┬──────┘
                                        │ upsert / delete
                                        ▼
┌─────────────┐                  ┌─────────────┐
│  Cloudflare │ ◀── video ID ──▶│  Supabase   │
│   Stream    │                  │  (baza +    │
└──────┬──────┘                  │   storage)  │
       │ stream video            └──────┬──────┘
       ▼                                │ fetch data
┌──────────────────────────────────────────────┐
│            Next.js na Vercelu                │
│                                              │
│  /            ← strona publiczna             │
│  /oferty/[id] ← strona oferty               │
│  /panel/*     ← panel admina (chroniony)     │
└──────────────────────────────────────────────┘
```

### Stack technologiczny
- **Frontend + panel**: Next.js (App Router) na Vercelu
- **Baza danych**: Supabase (PostgreSQL) — region: EU West (Ireland), eu-west-1
- **Storage zdjęć**: Supabase Storage — bucket `offer-images` (public)
- **Video**: Cloudflare Stream
- **CRM źródłowy**: Galactica Virgo (eksport XML w formacie oferty.net)
- **Styling**: Tailwind CSS

---

## 2. Supabase — co jest postawione

### Project URL
```
https://yrkvochsziertbvzbnol.supabase.co
```

### Klucze API
- `NEXT_PUBLIC_SUPABASE_URL` — Project URL (publiczny, OK w przeglądarce)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon key (publiczny, frontend)
- `SUPABASE_SERVICE_ROLE_KEY` — service role (TYLKO server-side, NIGDY w przeglądarce)

### Klient Supabase — konfiguracja

Klient frontendowy (`lib/supabase.ts`):
```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

Klient server-side / admin (`lib/supabase-admin.ts`):
```ts
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)
```

Klient admin (`supabaseAdmin`) omija RLS i ma pełny dostęp — używaj go w:
- API routes (`app/api/...`)
- Server actions
- Server components w `/panel`
- Importerze XML

---

## 3. Schemat bazy danych

### Enumy (custom types)

```sql
offer_category:     'mieszkania' | 'domy' | 'dzialki' | 'lokale'
offer_listing_type: 'sprzedaz' | 'wynajem'
offer_currency:     'PLN' | 'EUR' | 'USD'
media_status:       'pending' | 'ready' | 'failed'
import_status:      'running' | 'success' | 'partial' | 'failed'
import_type:        'full' | 'diff'
```

### Tabela: `agents`

Agenci nieruchomości. Mogą być importowani z Galactiki lub dodani ręcznie.

| Kolumna | Typ | Opis |
|---------|-----|------|
| id | uuid (PK) | auto-generated |
| name | text NOT NULL | imię i nazwisko |
| email | text UNIQUE | email agenta |
| phone_office | text | telefon biurowy |
| phone_mobile | text | telefon komórkowy |
| photo_url | text | URL do zdjęcia agenta |
| bio | text | opis / bio agenta |
| is_active | boolean (default true) | czy aktywny |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto (trigger) |

### Tabela: `offers`

Główna tabela ofert. Zawiera zarówno oferty z Galactiki jak i dodane ręcznie.

| Kolumna | Typ | Opis |
|---------|-----|------|
| id | uuid (PK) | auto-generated |
| galactica_offer_id | text UNIQUE NOT NULL | ID z Galactiki lub `MANUAL-xxx` dla ręcznych |
| category | offer_category NOT NULL | mieszkania/domy/dzialki/lokale |
| listing_type | offer_listing_type NOT NULL | sprzedaz/wynajem |
| market_type | text | rynek pierwotny/wtórny |
| title | text | tytuł oferty (wewnętrzny, dłuższy) |
| advertisement_text | text | tytuł z Galactiki (max 50 znaków) |
| description | text | pełny opis oferty |
| price | numeric(14,2) | cena |
| currency | offer_currency (default PLN) | waluta |
| is_price_negotiable | boolean (default false) | czy cena do negocjacji |
| area_total | numeric(10,2) | powierzchnia całkowita |
| area_usable | numeric(10,2) | powierzchnia użytkowa |
| area_plot | numeric(10,2) | powierzchnia działki |
| rooms | int | liczba pokoi |
| bedrooms | int | liczba sypialni |
| bathrooms | int | liczba łazienek |
| floor | int | piętro |
| floors_total | int | liczba pięter |
| year_built | int | rok budowy |
| has_balcony | boolean | balkon |
| has_terrace | boolean | taras |
| has_basement | boolean | piwnica |
| has_garden | boolean | ogród |
| has_loggia | boolean | loggia |
| has_elevator | boolean | winda |
| has_air_conditioning | boolean | klimatyzacja |
| building_material | text | materiał budowy |
| building_state | text | stan budynku |
| property_state | text | stan nieruchomości |
| heating | text | ogrzewanie |
| kitchen_type | text | typ kuchni |
| parking_spaces | int | miejsca parkingowe |
| province | text | województwo |
| city | text | miasto |
| district | text | dzielnica |
| neighborhood | text | okolica |
| street | text | ulica |
| zip_code | text | kod pocztowy |
| lat | numeric(10,7) | szerokość geograficzna |
| lng | numeric(10,7) | długość geograficzna |
| agent_id | uuid (FK → agents) | powiązany agent |
| agent_name | text | nazwa agenta (denormalizacja) |
| agent_email | text | email agenta (denormalizacja) |
| agent_phone_office | text | tel. biurowy agenta |
| agent_phone_mobile | text | tel. komórkowy agenta |
| is_exclusive | boolean (default false) | wyłączność |
| is_without_commission | boolean (default false) | bez prowizji |
| is_primary_market | boolean (default false) | rynek pierwotny |
| virtual_tour_url | text | link do wirtualnej wizuty (np. Matterport) |
| raw_params | jsonb | surowe parametry z XML, których jeszcze nie zmapowano |
| source_updated_at | timestamptz | data aktualizacji ze źródła (Galactica) |
| is_active | boolean NOT NULL (default true) | czy oferta jest widoczna na stronie |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto (trigger) |

**WAŻNE — rozróżnienie ofert:**
- Oferty z Galactiki mają `galactica_offer_id` np. `"12345"`, `"G-5678"`
- Oferty dodane ręcznie przez panel mają `galactica_offer_id` np. `"MANUAL-uuid"` lub `"MANUAL-001"`
- Importer XML robi upsert po `galactica_offer_id` — nigdy nie nadpisze oferty ręcznej
- `is_active` kontroluje widoczność na stronie — panel pozwala to przełączać

### Tabela: `offer_images`

Zdjęcia ofert. Pliki w Supabase Storage (bucket `offer-images`).

| Kolumna | Typ | Opis |
|---------|-----|------|
| id | uuid (PK) | auto-generated |
| offer_id | uuid (FK → offers, CASCADE) | powiązana oferta |
| galactica_offer_id | text NOT NULL | ID oferty z Galactiki |
| source_filename | text | oryginalna nazwa pliku |
| image_url | text NOT NULL | publiczny URL do zdjęcia |
| order_index | int (default 0) | kolejność wyświetlania |
| is_primary | boolean (default false) | czy to główne zdjęcie |
| created_at | timestamptz | auto |

Ścieżki w Storage: `offer-images/{galactica_offer_id}/{order_index}_{filename}.jpg`

### Tabela: `offer_media`

Mapowanie oferty → video z Cloudflare Stream. Relacja 1:1 z offers.

| Kolumna | Typ | Opis |
|---------|-----|------|
| id | uuid (PK) | auto-generated |
| offer_id | uuid (FK → offers, CASCADE, UNIQUE) | powiązana oferta |
| galactica_offer_id | text NOT NULL | ID oferty |
| cloudflare_video_short_id | text | ID krótkiego pionowego video (homepage, karty) |
| cloudflare_video_long_id | text | ID dłuższego video (strona oferty) |
| poster_image_url | text | URL do poster frame |
| status | media_status (default 'pending') | pending / ready / failed |
| uploaded_by | text | kto wrzucił video |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto (trigger) |

### Tabela: `lead_submissions`

Formularze kontaktowe / zapytania od odwiedzających stronę.

| Kolumna | Typ | Opis |
|---------|-----|------|
| id | uuid (PK) | auto-generated |
| offer_id | uuid (FK → offers, SET NULL) | opcjonalne powiązanie z ofertą |
| galactica_offer_id | text | ID oferty |
| full_name | text | imię i nazwisko |
| email | text | email |
| phone | text | telefon |
| message | text | treść wiadomości |
| source | text | skąd lead (offer_page, home_form, itp.) |
| user_agent | text | user agent przeglądarki |
| ip_hash | text | hash IP (prywatność) |
| is_processed | boolean (default false) | czy obsłużony |
| processed_at | timestamptz | kiedy obsłużony |
| notes | text | notatki |
| created_at | timestamptz | auto |

### Tabela: `import_runs`

Logi importów XML z Galactiki.

| Kolumna | Typ | Opis |
|---------|-----|------|
| id | uuid (PK) | auto-generated |
| started_at | timestamptz | start importu |
| finished_at | timestamptz | koniec importu |
| status | import_status (default 'running') | running/success/partial/failed |
| source_filename | text | nazwa pliku ZIP |
| import_type | import_type | full / diff |
| offers_created | int (default 0) | ile ofert utworzono |
| offers_updated | int (default 0) | ile ofert zaktualizowano |
| offers_deleted | int (default 0) | ile ofert usunięto |
| images_imported | int (default 0) | ile zdjęć zaimportowano |
| errors_count | int (default 0) | ile błędów |
| log | text | log tekstowy |
| error_details | jsonb | szczegóły błędów |

---

## 4. Row Level Security (RLS)

RLS jest WŁĄCZONY na wszystkich tabelach. Zasady:

### Publiczny odczyt (anon + authenticated)
- `offers` — SELECT tylko `WHERE is_active = true`
- `offer_images` — SELECT tylko jeśli powiązana oferta jest aktywna
- `offer_media` — SELECT tylko jeśli powiązana oferta jest aktywna
- `agents` — SELECT tylko `WHERE is_active = true`

### Lead submissions
- INSERT dozwolony dla anon + authenticated (formularze kontaktowe)
- SELECT — brak publicznej policy → tylko service role może czytać

### import_runs
- Brak publicznych policy → tylko service role może czytać/pisać

### Ważne
- **Service role key** (`supabaseAdmin`) omija RLS — używaj go w panelu admina i importerze
- **Anon key** (`supabase`) respektuje RLS — używaj go na publicznej stronie
- Panel admina (`/panel`) musi używać server-side calls z `supabaseAdmin`, żeby widzieć WSZYSTKIE oferty (także nieaktywne)

---

## 5. Supabase Storage

### Bucket: `offer-images`
- **Public**: tak (zdjęcia ofert muszą być dostępne publicznie)
- **Struktura ścieżek**: `{galactica_offer_id}/{order_index}_{filename}.jpg`
- **Publiczny URL**: `https://yrkvochsziertbvzbnol.supabase.co/storage/v1/object/public/offer-images/{path}`

### Upload zdjęć z panelu
```ts
const { data, error } = await supabaseAdmin.storage
  .from('offer-images')
  .upload(`${offerId}/${orderIndex}_${filename}`, file, {
    contentType: 'image/jpeg',
    upsert: true
  })
```

---

## 6. Supabase Auth — panel admina

### Setup
- Używamy Supabase Auth do logowania w panelu
- Konta tworzone ręcznie przez dashboard Supabase (Authentication → Users → Add user)
- Email + hasło — najprostsza metoda
- Nie budujemy rejestracji — konta dodaje admin (my)

### Middleware / ochrona `/panel`
W `app/panel/layout.tsx` lub middleware Next.js:
- sprawdź sesję Supabase Auth
- jeśli brak sesji → redirect na `/panel/login`
- jeśli jest sesja → renderuj panel

### Klient Auth w panelu
```ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

// login
await supabase.auth.signInWithPassword({ email, password })

// logout
await supabase.auth.signOut()

// sprawdzenie sesji
const { data: { session } } = await supabase.auth.getSession()
```

---

## 7. Panel admina — wymagania

### Routing

```
/panel/login          → strona logowania
/panel                → dashboard (podsumowanie, ostatnie oferty, leady)
/panel/oferty         → lista wszystkich ofert (aktywne, nieaktywne, z Galactiki, ręczne)
/panel/oferty/nowa    → formularz dodawania nowej oferty (ręcznej)
/panel/oferty/[id]    → edycja oferty (wszystkie pola + zdjęcia + video)
/panel/media          → zarządzanie video (lista ofert bez video, upload)
/panel/leady          → lista leadów/zapytań z formularzy
/panel/agenci         → zarządzanie agentami
```

### Design panelu
- **Ciemny motyw** — spójny z resztą strony Fibra (premium, elegancki)
- **Minimalistyczny** — prosty, czytelny, bez zbędnych elementów
- **Sidebar** po lewej z nawigacją
- **Responsive** — musi działać na tablecie (agenci w terenie)
- **Tailwind CSS** — ten sam co reszta projektu

### Funkcjonalności panelu

#### Lista ofert (`/panel/oferty`)
- Tabela/lista ze wszystkimi ofertami (aktywne i nieaktywne)
- Kolumny: zdjęcie główne, tytuł, kategoria, typ, cena, miasto, status (aktywna/nieaktywna), źródło (Galactica/ręczna), czy ma video
- Filtrowanie: kategoria, typ, status, źródło, miasto
- Szukajka po tytule/adresie
- Szybki toggle is_active (włącz/wyłącz na stronie)
- Przycisk "Dodaj ofertę" → `/panel/oferty/nowa`

#### Dodawanie oferty (`/panel/oferty/nowa`)
- Formularz ze wszystkimi polami z tabeli `offers`
- `galactica_offer_id` generowany automatycznie jako `MANUAL-{uuid}`
- Upload zdjęć → Supabase Storage → wpisy w `offer_images`
- Wybór agenta z listy (dropdown z tabeli `agents`)
- Po zapisaniu oferta jest od razu widoczna na stronie (is_active = true)

#### Edycja oferty (`/panel/oferty/[id]`)
- Pełny formularz jak przy dodawaniu, ale pre-filled
- Edycja KAŻDEGO pola — nawet jeśli oferta przyszła z Galactiki
- Zmienione dane NIE przepadają — importer nie nadpisuje ofert, które mają flagę nadpisania (patrz sekcja "Oferty z Galactiki vs ręczne")
- Zarządzanie zdjęciami: dodawanie, usuwanie, zmiana kolejności, oznaczanie głównego
- Sekcja VIDEO: przypisanie Cloudflare Stream video (patrz sekcja 8)
- Toggle is_active

#### Media / Video (`/panel/media`)
- Lista ofert z info: ma video / nie ma video
- Filtr: "tylko bez video" / "tylko z video"
- Przy każdej ofercie:
  - upload video → Cloudflare Stream
  - lub ręczne wpisanie Cloudflare Video ID (jeśli film już jest w CF)
  - podgląd video
  - usunięcie powiązania

#### Leady (`/panel/leady`)
- Lista zapytań z formularzy kontaktowych
- Sortowanie po dacie (najnowsze na górze)
- Oznaczanie jako obsłużone
- Dodawanie notatek

#### Agenci (`/panel/agenci`)
- Lista agentów
- Dodawanie / edycja agenta
- Upload zdjęcia agenta
- Włączanie/wyłączanie agenta

### SEO / Robots
```
/robots.txt:
User-agent: *
Disallow: /panel
```

Panel nie powinien być indeksowany przez wyszukiwarki. Dodaj też `<meta name="robots" content="noindex, nofollow" />` w layout panelu.

---

## 8. Video workflow — Cloudflare Stream

### Jak to działa

1. Agent/admin wchodzi w edycję oferty lub sekcję Media w panelu
2. Wybiera ofertę i uploaduje plik video
3. Upload idzie do Cloudflare Stream (przez API z backendu)
4. Cloudflare zwraca `video_id` (UID)
5. `video_id` zapisuje się w tabeli `offer_media` (kolumna `cloudflare_video_short_id` lub `cloudflare_video_long_id`)
6. Frontend na stronie publicznej pobiera video ID z Supabase i odtwarza przez Cloudflare Stream player/iframe

### Dwa typy video
- **Short** (`cloudflare_video_short_id`) — krótki, pionowy film (do kart na homepage, format reels/shorts)
- **Long** (`cloudflare_video_long_id`) — dłuższy film (do strony oferty, pełna prezentacja)

### Upload flow (backend)
```
Panel → API route Next.js → Cloudflare Stream API (upload) → video_id → Supabase (save)
```

Agent NIE loguje się do Cloudflare. Agent NIE kopiuje ręcznie video ID. Wszystko dzieje się przez panel.

### Cloudflare Stream API
- Upload: `POST https://api.cloudflare.com/client/v4/accounts/{account_id}/stream`
- Potrzebny: `CLOUDFLARE_ACCOUNT_ID` i `CLOUDFLARE_API_TOKEN` w `.env`
- Alternatywnie: TUS upload (dla dużych plików) lub signed upload URL (direct creator upload z przeglądarki)

### Odtwarzanie na froncie
```html
<iframe
  src="https://customer-{code}.cloudflarestream.com/{video_id}/iframe"
  allow="autoplay; fullscreen"
  allowfullscreen
/>
```

Lub przez Cloudflare Stream Player SDK dla większej kontroli.

---

## 9. Oferty z Galactiki vs oferty ręczne

### Rozróżnienie
- **Z Galactiki**: `galactica_offer_id` to numeryczny ID lub format Galactiki (np. `"12345"`)
- **Ręczne**: `galactica_offer_id` zaczyna się od `"MANUAL-"` (np. `"MANUAL-a1b2c3d4"`)

### Reguły importera XML (na przyszłość)
- Importer robi upsert po `galactica_offer_id`
- Oferty `MANUAL-*` NIGDY nie są nadpisywane przez importer
- Importer aktualizuje tylko oferty, których `galactica_offer_id` pasuje do ID z XML-a
- `<oferta_usun>` z XML-a ustawia `is_active = false` (soft delete, nie kasuje)

### Edycja ofert z Galactiki w panelu
- Admin może edytować ofertę, która przyszła z Galactiki
- UWAGA: przy następnym imporcie dane mogą zostać nadpisane
- Rozwiązanie na przyszłość: pole `raw_params` (jsonb) w ofercie przechowuje surowe dane z XML-a, a nadpisane pola mogą być oznaczane flagą — ale na start nie komplikujemy, edycja po prostu nadpisuje

---

## 10. Przepływ danych — podsumowanie

### Strona publiczna
```
Supabase (offers WHERE is_active = true)
  + Supabase Storage (zdjęcia)
  + Cloudflare Stream (video)
    ↓
  Next.js frontend (publiczne strony)
```

### Panel admina
```
Supabase (ALL offers, agents, leads — via service role)
  + Supabase Storage (upload zdjęć)
  + Cloudflare Stream API (upload video)
    ↓
  Next.js /panel/* (chroniony Supabase Auth)
```

### Import z Galactiki (na przyszłość)
```
Galactica → ZIP na FTP → Importer (cron) → Supabase (upsert/delete)
```

---

## 11. Zmienne środowiskowe (`.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://yrkvochsziertbvzbnol.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# Cloudflare Stream
CLOUDFLARE_ACCOUNT_ID=<account_id>
CLOUDFLARE_API_TOKEN=<api_token>

# Opcjonalnie — FTP (dla importera, na przyszłość)
# FTP_HOST=<host>
# FTP_USER=<user>
# FTP_PASS=<password>
# FTP_PORT=21
```

**NIGDY nie commituj `.env.local` do repozytorium.**
**NIGDY nie używaj `SUPABASE_SERVICE_ROLE_KEY` w kodzie klienckim (przeglądarkowym).**

---

## 12. Indeksy w bazie

Już utworzone indeksy (dla performance):

### offers
- `galactica_offer_id` (unique)
- `category`
- `listing_type`
- `city`
- `price`
- `is_active`
- `agent_id`
- composite: `(is_active, category) WHERE is_active = true`

### offer_images
- `offer_id`
- composite: `(offer_id, order_index)`

### offer_media
- `offer_id`
- `status`

### lead_submissions
- `offer_id`
- `created_at DESC`
- `is_processed WHERE is_processed = false`

### import_runs
- `started_at DESC`
- `status`

### agents
- `email` (unique)

---

## 13. Triggery

Automatyczny `updated_at` na tabelach:
- `agents`
- `offers`
- `offer_media`

Trigger ustawia `updated_at = now()` przy każdym UPDATE.

---

## 14. Checklist — co jest gotowe, co trzeba zbudować

### ✅ Gotowe
- [x] Projekt Supabase (EU West, Ireland)
- [x] Schemat bazy (6 tabel, enumy, indeksy, triggery)
- [x] RLS skonfigurowany
- [x] Storage bucket `offer-images` (public)
- [x] Frontend strony publicznej (Next.js na Vercelu) — DZIAŁA
- [x] Konto FTP na serwerze Fibry — ZAŁOŻONE

### 🔨 Do zbudowania
- [ ] `/panel/login` — logowanie Supabase Auth
- [ ] `/panel` — dashboard
- [ ] `/panel/oferty` — lista ofert (CRUD, toggle active, filtrowanie)
- [ ] `/panel/oferty/nowa` — dodawanie oferty ręcznej
- [ ] `/panel/oferty/[id]` — edycja oferty + zdjęcia + video
- [ ] `/panel/media` — zarządzanie video Cloudflare Stream
- [ ] `/panel/leady` — lista zapytań
- [ ] `/panel/agenci` — zarządzanie agentami
- [ ] Podpięcie frontendu publicznego do Supabase (zamiana statycznych danych na live)
- [ ] API routes dla uploadu video do Cloudflare Stream
- [ ] robots.txt — blokowanie /panel
- [ ] Importer XML z Galactiki (PÓŹNIEJ — jak Galactica zacznie wysyłać pliki)

### ⏳ Czekamy
- [ ] Odpowiedź z Galactiki — jakie dane potrzebują do konfiguracji eksportu XML
- [ ] Pierwszy plik XML z Galactiki do testów
