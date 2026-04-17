# FIBRA — Polityka prywatności, Cookies i instrukcje dla Cursora

---

## CZĘŚĆ 1: Instrukcje dla Cursora

### Co zrobić

Stwórz trzy strony statyczne:
- `/polityka-prywatnosci` — polityka prywatności
- `/regulamin` — regulamin serwisu (placeholder na razie, tekst dostarczymy później)
- `/cookies` — polityka cookies

Oraz komponent:
- **Cookie consent banner** — pasek/modal na dole ekranu przy pierwszym wejściu

### Wymagania techniczne

**Strony prawne:**
- Statyczne, bez danych z Supabase
- Czytelna typografia — tekst prawny musi być łatwy do przeczytania
- Jasne tło, ciemny tekst, max-w-3xl wycentrowany
- Nagłówki sekcji wyraźne, numeracja zachowana
- `metadata` z odpowiednimi tytułami i `noindex` (nie chcemy indeksować stron prawnych)
- W footerze strony linki „Polityka prywatności", „Regulamin", „Cookies" już istnieją — upewnij się że prowadzą do właściwych ścieżek

**Cookie consent banner:**
- Pojawia się na dole ekranu przy pierwszym wejściu (jeśli użytkownik jeszcze nie wyraził zgody)
- Tekst: „Używamy plików cookies, żeby strona działała prawidłowo i żebyśmy mogli analizować ruch. Szczegóły znajdziesz w naszej polityce cookies."
- Dwa przyciski: „Akceptuję" (wypełniony) i „Tylko niezbędne" (outline)
- Po kliknięciu „Akceptuję" — zapisz zgodę w cookie (np. `fibra_consent=all`, max-age 365 dni) i załaduj skrypty analityczne (GA, Pixel)
- Po kliknięciu „Tylko niezbędne" — zapisz `fibra_consent=essential`, NIE ładuj GA ani Pixel
- Jeśli zgoda już zapisana — nie pokazuj bannera
- Banner NIE MOŻE używać localStorage (nie działa w artifacts) — użyj document.cookie
- Styl: spójny z resztą strony, ciemne tło, zaokrąglone rogi, nie nachodzący na treść (fixed bottom)
- Na mobile: pełna szerokość, przyciski jeden pod drugim
- Link „polityce cookies" w tekście bannera prowadzi do `/cookies`

**Ładowanie skryptów analitycznych warunkowo:**
- Google Analytics i Facebook Pixel ładuj TYLKO po zgodzie (`fibra_consent=all`)
- Stwórz komponent `AnalyticsScripts` w layout.tsx, który sprawdza cookie i warunkowo ładuje skrypty
- Google Analytics: ID będzie w env `NEXT_PUBLIC_GA_ID`
- Facebook Pixel: ID będzie w env `NEXT_PUBLIC_FB_PIXEL_ID`
- Na razie te env mogą być puste — skrypty po prostu się nie załadują

---

## CZĘŚĆ 2: Polityka prywatności — treść do wklejenia na stronę

*(Cursor: wklej poniższy tekst na stronie `/polityka-prywatnosci`)*

---

**Polityka Prywatności**
fibranieruchomosci.pl

**Ostatnia aktualizacja: [DATA PUBLIKACJI]**

### 1. Administrator danych

Administratorem danych osobowych zbieranych za pośrednictwem serwisu fibranieruchomosci.pl jest:

**GRUPA FIBRA Sp. z o.o.**
ul. Józefa Rymera 177, 44-310 Radlin
E-mail: biuro@grupafibra.pl
Telefon: 510 777 200

### 2. Jakie dane zbieramy i dlaczego

Zbieramy dane osobowe wyłącznie w zakresie niezbędnym do świadczenia naszych usług. Poniżej wskazujemy kategorie danych, cele i podstawy prawne przetwarzania.

**a) Formularz kontaktowy i zapytania o oferty**

Zakres danych: imię, telefon lub adres e-mail, treść wiadomości, opcjonalnie informacja o rodzaju zapytania (sprzedaż, kupno, wynajem).

Cel: odpowiedź na zapytanie, kontakt zwrotny, przedstawienie oferty.

Podstawa prawna: art. 6 ust. 1 lit. b) RODO (podjęcie działań na żądanie osoby przed zawarciem umowy) oraz art. 6 ust. 1 lit. f) RODO (prawnie uzasadniony interes administratora — obsługa zapytań).

**b) Przeglądanie ofert i korzystanie z serwisu**

Zakres danych: adres IP, typ przeglądarki, system operacyjny, dane o sposobie korzystania z serwisu (strony odwiedzone, czas wizyty).

Cel: zapewnienie prawidłowego działania serwisu, analiza ruchu, optymalizacja treści.

Podstawa prawna: art. 6 ust. 1 lit. f) RODO (prawnie uzasadniony interes — utrzymanie i rozwój serwisu).

**c) Newsletter**

Zakres danych: adres e-mail.

Cel: wysyłka newslettera z ofertami i informacjami o rynku nieruchomości.

Podstawa prawna: art. 6 ust. 1 lit. a) RODO (zgoda). Zgodę można wycofać w każdej chwili — link do rezygnacji znajduje się w każdym e-mailu.

**d) Panel administracyjny (agenci)**

Zakres danych: adres e-mail, hasło (zaszyfrowane).

Cel: dostęp do panelu zarządzania ofertami.

Podstawa prawna: art. 6 ust. 1 lit. b) RODO (wykonanie umowy / świadczenie usługi).

### 3. Komu przekazujemy dane

Dane osobowe mogą być przekazywane następującym kategoriom odbiorców:

- **Supabase Inc.** (baza danych i uwierzytelnianie) — serwery w Unii Europejskiej (region EU West, Irlandia). Supabase przetwarza dane na podstawie standardowych klauzul umownych.
- **Vercel Inc.** (hosting serwisu) — serwery na terenie UE i USA. Vercel przetwarza dane na podstawie Data Processing Addendum zgodnego z RODO.
- **Cloudflare Inc.** (hosting i dostarczanie materiałów wideo) — globalna sieć CDN. Cloudflare przetwarza dane na podstawie standardowych klauzul umownych.
- **GetResponse S.A.** (obsługa newslettera) — siedziba w Polsce, dane przetwarzane na terenie EOG.
- **Google LLC** (Google Analytics — analiza ruchu) — dane zanonimizowane, przetwarzane na podstawie zgody użytkownika.
- **Meta Platforms Inc.** (Facebook Pixel — analiza kampanii reklamowych) — dane zanonimizowane, przetwarzane na podstawie zgody użytkownika.
- **Organy administracji publicznej** — w zakresie wynikającym z obowiązujących przepisów prawa.
- **Podmioty świadczące usługi księgowe i prawne** na rzecz Administratora — na podstawie odrębnych umów powierzenia przetwarzania danych.

Dane osobowe nie są przekazywane do państw trzecich spoza Europejskiego Obszaru Gospodarczego, z wyjątkiem przypadków wskazanych powyżej (Vercel, Cloudflare, Google, Meta), gdzie transfer odbywa się na podstawie standardowych klauzul umownych lub decyzji Komisji Europejskiej stwierdzającej odpowiedni stopień ochrony.

### 4. Jak długo przechowujemy dane

- Dane z formularzy kontaktowych: do czasu zakończenia obsługi zapytania, a następnie przez okres przedawnienia roszczeń (3 lata).
- Dane z newslettera: do momentu wycofania zgody.
- Dane analityczne (Google Analytics): zgodnie z polityką retencji Google (standardowo 14 miesięcy).
- Dane w panelu administracyjnym: przez okres korzystania z konta.

### 5. Twoje prawa

Przysługuje Ci prawo do:

- **dostępu** do swoich danych osobowych,
- **sprostowania** nieprawidłowych danych,
- **usunięcia** danych („prawo do bycia zapomnianym"),
- **ograniczenia** przetwarzania,
- **przenoszenia** danych,
- **sprzeciwu** wobec przetwarzania opartego na prawnie uzasadnionym interesie,
- **wycofania zgody** w dowolnym momencie (bez wpływu na zgodność z prawem przetwarzania przed wycofaniem).

Aby skorzystać z powyższych praw, skontaktuj się z nami: biuro@grupafibra.pl

Masz również prawo wniesienia skargi do organu nadzorczego — Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa).

### 6. Bezpieczeństwo danych

Stosujemy odpowiednie środki techniczne i organizacyjne, w tym:

- szyfrowanie połączeń (certyfikat SSL/TLS),
- kontrolę dostępu do danych (uwierzytelnianie, role użytkowników),
- regularne kopie zapasowe bazy danych,
- polityki bezpieczeństwa zgodne z RODO.

### 7. Zmiany polityki prywatności

Zastrzegamy sobie prawo do aktualizacji niniejszej polityki prywatności. O istotnych zmianach poinformujemy za pośrednictwem serwisu. Aktualna wersja jest zawsze dostępna pod adresem fibranieruchomosci.pl/polityka-prywatnosci.

### 8. Kontakt

We wszelkich sprawach dotyczących ochrony danych osobowych prosimy o kontakt:

GRUPA FIBRA Sp. z o.o.
ul. Józefa Rymera 177, 44-310 Radlin
E-mail: biuro@grupafibra.pl
Telefon: 510 777 200

---

## CZĘŚĆ 3: Polityka Cookies — treść do wklejenia na stronę

*(Cursor: wklej poniższy tekst na stronie `/cookies`)*

---

**Polityka Cookies**
fibranieruchomosci.pl

**Ostatnia aktualizacja: [DATA PUBLIKACJI]**

### 1. Czym są pliki cookies

Pliki cookies (ciasteczka) to niewielkie pliki tekstowe zapisywane na Twoim urządzeniu (komputerze, telefonie, tablecie) podczas korzystania z naszego serwisu. Pozwalają nam zapamiętać Twoje preferencje i analizować sposób korzystania ze strony.

### 2. Jakich cookies używamy

**a) Niezbędne (zawsze aktywne)**

Te cookies są konieczne do prawidłowego działania serwisu. Bez nich strona nie mogłaby funkcjonować poprawnie.

| Nazwa | Dostawca | Cel | Czas przechowywania |
|---|---|---|---|
| fibra_consent | fibranieruchomosci.pl | Zapamiętanie Twojej decyzji o cookies | 1 rok |
| sb-access-token, sb-refresh-token | Supabase | Uwierzytelnianie w panelu administracyjnym | Sesja / 7 dni |

**b) Analityczne (wymagają zgody)**

Pomagają nam zrozumieć, jak odwiedzający korzystają z serwisu — które strony są popularne, skąd przychodzą użytkownicy, jak długo zostają.

| Nazwa | Dostawca | Cel | Czas przechowywania |
|---|---|---|---|
| _ga, _ga_* | Google Analytics | Analiza ruchu na stronie | 14 miesięcy |

**c) Marketingowe (wymagają zgody)**

Służą do śledzenia skuteczności naszych kampanii reklamowych.

| Nazwa | Dostawca | Cel | Czas przechowywania |
|---|---|---|---|
| _fbp, _fbc | Meta (Facebook Pixel) | Pomiar kampanii reklamowych | 90 dni |

### 3. Jak zarządzać cookies

**Na naszej stronie:** Przy pierwszej wizycie zobaczysz baner z możliwością wyboru: „Akceptuję" (wszystkie cookies) lub „Tylko niezbędne" (bez analitycznych i marketingowych).

**W przeglądarce:** Możesz w każdej chwili zmienić ustawienia cookies w swojej przeglądarce:

- Chrome: chrome://settings/cookies
- Firefox: about:preferences#privacy
- Safari: Preferencje → Prywatność
- Edge: edge://settings/privacy

Wyłączenie cookies analitycznych i marketingowych nie wpływa na działanie serwisu.

### 4. Usługi zewnętrzne

**Google Analytics** — usługa analizy ruchu dostarczana przez Google LLC. Dane są anonimizowane (maskowanie IP). Więcej informacji: https://policies.google.com/privacy

**Facebook Pixel** — usługa pomiaru kampanii reklamowych dostarczana przez Meta Platforms Inc. Więcej informacji: https://www.facebook.com/privacy/policy/

**Cloudflare Stream** — dostarczanie materiałów wideo. Cloudflare może zapisywać cookies techniczne niezbędne do odtwarzania filmów. Więcej informacji: https://www.cloudflare.com/privacypolicy/

**Supabase** — baza danych i uwierzytelnianie. Cookies sesyjne służą wyłącznie do obsługi logowania w panelu administracyjnym. Więcej informacji: https://supabase.com/privacy

**Vercel** — hosting serwisu. Vercel może używać cookies technicznych do routingu i optymalizacji. Więcej informacji: https://vercel.com/legal/privacy-policy

### 5. Zmiany

Zastrzegamy sobie prawo do aktualizacji polityki cookies. Aktualna wersja jest dostępna pod adresem fibranieruchomosci.pl/cookies.

### 6. Kontakt

GRUPA FIBRA Sp. z o.o.
ul. Józefa Rymera 177, 44-310 Radlin
E-mail: biuro@grupafibra.pl

---

## CZĘŚĆ 4: Strona regulaminu (placeholder)

*(Cursor: stwórz stronę `/regulamin` z poniższym tekstem — docelowy regulamin zostanie dostarczony później)*

---

**Regulamin serwisu**
fibranieruchomosci.pl

Regulamin serwisu jest w przygotowaniu. W razie pytań prosimy o kontakt: biuro@grupafibra.pl

---

## CZĘŚĆ 5: Checklist dla Cursora

- [ ] Strona `/polityka-prywatnosci` z treścią z CZĘŚCI 2
- [ ] Strona `/cookies` z treścią z CZĘŚCI 3
- [ ] Strona `/regulamin` z placeholderem z CZĘŚCI 4
- [ ] Wszystkie trzy strony: `metadata` z `robots: 'noindex, nofollow'`
- [ ] Cookie consent banner (komponent `CookieConsent`)
- [ ] Komponent `AnalyticsScripts` — warunkowe ładowanie GA i Pixel
- [ ] Env: `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_FB_PIXEL_ID` dodane do `.env.example`
- [ ] Linki w footerze prowadzą do `/polityka-prywatnosci`, `/regulamin`, `/cookies`
- [ ] Zamień `[DATA PUBLIKACJI]` na aktualną datę przy deploymencie
